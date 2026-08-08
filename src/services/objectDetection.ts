/**
 * Modular browser-side object detection.
 *
 * Currently backed by TensorFlow.js + COCO-SSD (generic pretrained model).
 * The detector is intentionally behind a small interface so a custom-trained
 * electronics model (air conditioners, sockets, routers, ceiling lights...)
 * can replace it without touching the UI layer.
 */

import { COCO_TO_ELECTRONICS, APPLIANCE_CATALOG, matchCatalogKey } from "@/lib/appliance-catalog";
import type { BoxDetection } from "@/lib/energy";

export interface RawDetection {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // x, y, w, h in pixels
}

type Model = { detect: (input: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement, max?: number) => Promise<RawDetection[]> };

let modelPromise: Promise<Model> | null = null;
let failed = false;

export function detectorFailed() {
  return failed;
}

export async function initializeDetector(): Promise<Model | null> {
  if (failed) return null;
  if (!modelPromise) {
    modelPromise = (async () => {
      const tf = await import("@tensorflow/tfjs");
      await tf.ready();
      const cocoSsd = await import("@tensorflow-models/coco-ssd");
      return (await cocoSsd.load({ base: "lite_mobilenet_v2" })) as unknown as Model;
    })();
  }
  try {
    return await modelPromise;
  } catch (e) {
    console.error("[objectDetection] failed to load model", e);
    failed = true;
    modelPromise = null;
    return null;
  }
}

/** Map a generic model class into an electronics label; returns null if not electronics. */
export function normalizeDetection(raw: RawDetection, frameW: number, frameH: number): BoxDetection | null {
  const mapped = COCO_TO_ELECTRONICS[raw.class];
  if (mapped === undefined || mapped === "") return null;
  const key = mapped || matchCatalogKey(raw.class);
  const entry = APPLIANCE_CATALOG[key];
  if (!entry) return null;
  const [x, y, w, h] = raw.bbox;
  return {
    id: `${key}-${Math.round(x)}-${Math.round(y)}`,
    label: entry.name,
    score: raw.score,
    x: x / frameW,
    y: y / frameH,
    w: w / frameW,
    h: h / frameH,
  };
}

export async function detectObjects(
  source: HTMLVideoElement | HTMLCanvasElement | HTMLImageElement,
  frameW: number,
  frameH: number,
): Promise<BoxDetection[]> {
  const model = await initializeDetector();
  if (!model) return [];
  const raw = await model.detect(source, 20);
  return raw
    .filter((r) => r.score > 0.45)
    .map((r) => normalizeDetection(r, frameW, frameH))
    .filter((d): d is BoxDetection => d !== null);
}

/**
 * Smooths detections between frames so boxes stay attached to objects
 * instead of flickering. Simple IoU matching + exponential smoothing.
 */
export class DetectionTracker {
  private tracks: (BoxDetection & { missed: number })[] = [];

  private static iou(a: BoxDetection, b: BoxDetection) {
    const x1 = Math.max(a.x, b.x);
    const y1 = Math.max(a.y, b.y);
    const x2 = Math.min(a.x + a.w, b.x + b.w);
    const y2 = Math.min(a.y + a.h, b.y + b.h);
    const inter = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
    const union = a.w * a.h + b.w * b.h - inter;
    return union > 0 ? inter / union : 0;
  }

  trackDetections(incoming: BoxDetection[], smoothing = 0.55): BoxDetection[] {
    const used = new Set<number>();
    for (const det of incoming) {
      let best = -1;
      let bestIou = 0.25;
      this.tracks.forEach((t, i) => {
        if (used.has(i) || t.label !== det.label) return;
        const iou = DetectionTracker.iou(t, det);
        if (iou > bestIou) {
          bestIou = iou;
          best = i;
        }
      });
      if (best >= 0) {
        const t = this.tracks[best]!;
        t.x = t.x * smoothing + det.x * (1 - smoothing);
        t.y = t.y * smoothing + det.y * (1 - smoothing);
        t.w = t.w * smoothing + det.w * (1 - smoothing);
        t.h = t.h * smoothing + det.h * (1 - smoothing);
        t.score = t.score * 0.7 + det.score * 0.3;
        t.missed = 0;
        used.add(best);
      } else {
        this.tracks.push({ ...det, missed: 0 });
      }
    }
    this.tracks.forEach((t, i) => {
      if (!used.has(i) && !incoming.some((d) => d.id === t.id)) t.missed += 1;
    });
    this.tracks = this.tracks.filter((t) => t.missed < 6);
    return this.tracks.map(({ missed: _missed, ...rest }) => rest);
  }

  reset() {
    this.tracks = [];
  }
}
