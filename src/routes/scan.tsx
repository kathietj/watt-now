import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import {
  Camera,
  ImageUp,
  RefreshCw,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { DetectionOverlay } from "@/components/detection-overlay";
import { DetectionTracker, detectObjects, initializeDetector } from "@/services/objectDetection";
import type { BoxDetection } from "@/lib/energy";
import { uid } from "@/lib/energy";
import { DEMO_SCENES, makeAppliance } from "@/lib/appliance-catalog";
import { mergeDetections } from "@/lib/merge-detections";
import { analyzeRoom } from "@/lib/analysis.functions";
import { newScan, updateCurrent } from "@/lib/scan-store";

export const Route = createFileRoute("/scan")({
  head: () => ({
    meta: [
      { title: "Scan a Room — WattSight" },
      {
        name: "description",
        content:
          "Use your device camera to detect electronics in a room, then capture one frame for an AI energy estimate.",
      },
      { property: "og:title", content: "Scan a Room — WattSight" },
      {
        property: "og:description",
        content: "Live electronics detection in your browser. No app download required.",
      },
    ],
  }),
  component: ScanPage,
});

const STAGES = [
  "Objects identified",
  "Appliance types estimated",
  "Electricity ranges calculated",
  "Cost estimated",
  "Energy opportunities found",
];

function ScanPage() {
  const navigate = useNavigate();
  const analyze = useServerFn(analyzeRoom);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const trackerRef = useRef(new DetectionTracker());
  const runningRef = useRef(false);

  const [facing, setFacing] = useState<"environment" | "user">("environment");
  const [streaming, setStreaming] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [boxes, setBoxes] = useState<BoxDetection[]>([]);
  const [modelState, setModelState] = useState<"idle" | "loading" | "ready" | "unavailable">("idle");
  const [analyzing, setAnalyzing] = useState(false);
  const [stage, setStage] = useState(0);

  const stopStream = useCallback(() => {
    const v = videoRef.current;
    const stream = v?.srcObject as MediaStream | null;
    stream?.getTracks().forEach((t) => t.stop());
    if (v) v.srcObject = null;
    runningRef.current = false;
    setStreaming(false);
  }, []);

  const startCamera = useCallback(
    async (mode: "environment" | "user") => {
      setPermissionError(null);
      try {
        if (!navigator.mediaDevices?.getUserMedia) throw new Error("unsupported");
        stopStream();
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode }, width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        const v = videoRef.current;
        if (!v) return;
        v.srcObject = stream;
        await v.play().catch(() => undefined);
        trackerRef.current.reset();
        setStreaming(true);
      } catch (err) {
        console.error(err);
        setPermissionError(
          "Camera access is needed to scan your room. You can enable it in your browser permissions.",
        );
        setStreaming(false);
      }
    },
    [stopStream],
  );

  useEffect(() => {
    void startCamera(facing);
    return stopStream;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [facing]);

  // Live detection loop — throttled to ~3 fps so phones stay responsive.
  useEffect(() => {
    if (!streaming) return;
    let cancelled = false;
    runningRef.current = true;

    (async () => {
      setModelState((s) => (s === "ready" ? s : "loading"));
      const model = await initializeDetector();
      if (cancelled) return;
      if (!model) {
        setModelState("unavailable");
        return;
      }
      setModelState("ready");

      const scratch = document.createElement("canvas");
      scratch.width = 320;
      scratch.height = 240;
      const ctx = scratch.getContext("2d");

      while (!cancelled && runningRef.current) {
        const v = videoRef.current;
        if (v && v.readyState >= 2 && ctx) {
          ctx.drawImage(v, 0, 0, scratch.width, scratch.height);
          try {
            const dets = await detectObjects(scratch, scratch.width, scratch.height);
            if (!cancelled) setBoxes(trackerRef.current.trackDetections(dets));
          } catch (e) {
            console.error("[scan] detection error", e);
          }
        }
        await new Promise((r) => setTimeout(r, 280));
      }
    })();

    return () => {
      cancelled = true;
      runningRef.current = false;
    };
  }, [streaming]);

  const grabFrame = useCallback((): string | null => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return null;
    const canvas = document.createElement("canvas");
    const maxW = 1024;
    const scale = Math.min(1, maxW / v.videoWidth);
    canvas.width = Math.round(v.videoWidth * scale);
    canvas.height = Math.round(v.videoHeight * scale);
    canvas.getContext("2d")?.drawImage(v, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.82);
  }, []);

  const runAnalysis = useCallback(
    async (image: string, currentBoxes: BoxDetection[]) => {
      setAnalyzing(true);
      setStage(0);
      const timer = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 900);

      const scan = newScan({ image, boxes: currentBoxes, title: "Room scan" });

      try {
        const result = await analyze({
          data: {
            image,
            hint: currentBoxes.length
              ? `A live detector already found: ${currentBoxes.map((b) => b.label).join(", ")}. Include those and anything it missed.`
              : "",
          },
        });
        const appliances = mergeDetections(currentBoxes, result.devices);
        updateCurrent({
          appliances,
          id: scan.id,
        });
      } catch (err) {
        console.error(err);
        const message = err instanceof Error ? err.message : "";
        if (message.includes("RATE_LIMIT")) toast.error("AI is busy right now — please retry in a moment.");
        else if (message.includes("NO_CREDITS")) toast.error("AI credits are exhausted for this workspace.");
        else toast.error("Deeper AI analysis was unavailable — showing live detections only.");
        updateCurrent({ appliances: mergeDetections(currentBoxes, []) });
      } finally {
        clearInterval(timer);
        setStage(STAGES.length - 1);
        setAnalyzing(false);
        stopStream();
        void navigate({ to: "/review" });
      }
    },
    [analyze, navigate, stopStream],
  );

  const onCapture = useCallback(async () => {
    const image = grabFrame();
    if (!image) {
      toast.error("Camera frame not ready yet.");
      return;
    }
    await runAnalysis(image, boxes);
  }, [boxes, grabFrame, runAnalysis]);

  const onUpload = useCallback(
    async (file: File) => {
      const reader = new FileReader();
      const dataUrl: string = await new Promise((resolve, reject) => {
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      let uploadBoxes: BoxDetection[] = [];
      try {
        const img = new Image();
        img.src = dataUrl;
        await img.decode();
        uploadBoxes = await detectObjects(img, img.naturalWidth, img.naturalHeight);
      } catch {
        /* detector optional on upload */
      }
      await runAnalysis(dataUrl, uploadBoxes);
    },
    [runAnalysis],
  );

  const startDemo = useCallback(
    (sceneId: string) => {
      const scene = DEMO_SCENES.find((s) => s.id === sceneId);
      if (!scene) return;
      stopStream();
      newScan({
        title: scene.title,
        image: scene.image,
        demo: true,
        roomType: scene.roomType as never,
        occupants: scene.occupants,
        boxes: scene.boxes.map((b) => ({ ...b, id: uid() })),
        appliances: scene.devices.map((d) =>
          makeAppliance(d.raw, {
            quantity: d.quantity,
            status: d.status,
            confidence: d.confidence,
            detectionConfidence: d.detection ?? 0,
            source: "demo",
          }),
        ),
      });
      void navigate({ to: "/review" });
    },
    [navigate, stopStream],
  );

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 border-b border-border/60 px-4 py-3">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Back
        </Link>
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-widest">
          <span className="font-display text-sm font-bold normal-case tracking-normal">WattSight</span>
          <span className="inline-flex items-center gap-1.5 text-primary">
            <span className={`size-2 rounded-full bg-primary ${streaming ? "animate-live" : "opacity-30"}`} />
            {streaming ? "Live" : "Paused"}
          </span>
          <span className="rounded-full bg-surface-2 px-2 py-1 text-foreground">
            {boxes.length} device{boxes.length === 1 ? "" : "s"}
          </span>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <div className="relative flex-1 bg-black" ref={wrapRef}>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="h-full max-h-[70vh] w-full object-contain"
          />
          <DetectionOverlay boxes={boxes} />

          {streaming && (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 h-16 animate-scanline bg-gradient-to-b from-primary/25 to-transparent" />
              <div className="pointer-events-none absolute inset-x-0 top-3 text-center">
                <span className="rounded-full bg-background/70 px-3 py-1 font-mono text-xs text-primary backdrop-blur">
                  {boxes.length > 0
                    ? `${boxes.length} electronic device${boxes.length === 1 ? "" : "s"} detected`
                    : "Scanning room..."}
                </span>
              </div>
              <div className="pointer-events-none absolute inset-x-0 bottom-3 space-y-1 px-4 text-center text-xs text-white/70">
                <p>Move slowly around the room</p>
                <p>Keep electronics visible for better detection</p>
              </div>
            </>
          )}

          {permissionError && (
            <div className="absolute inset-0 grid place-items-center bg-background/95 px-6 text-center">
              <div className="max-w-md">
                <h2 className="text-xl font-semibold">Camera unavailable</h2>
                <p className="mt-2 text-sm text-muted-foreground">{permissionError}</p>
                <div className="mt-5 flex flex-wrap justify-center gap-3">
                  <button
                    onClick={() => void startCamera(facing)}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm hover:bg-accent"
                  >
                    <RefreshCw className="size-4" /> Try again
                  </button>
                  <UploadButton onFile={onUpload} label="Upload Photo Instead" primary />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="no-print border-t border-border/60 bg-surface/60 px-4 py-5">
          <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
            <UploadButton onFile={onUpload} label="Gallery" />

            <div className="flex flex-col items-center gap-2">
              <button
                onClick={() => void onCapture()}
                disabled={!streaming || analyzing}
                aria-label="Capture and analyze"
                className="grid size-20 place-items-center rounded-full border-4 border-primary bg-primary/15 text-primary transition-transform hover:scale-105 disabled:opacity-40"
              >
                <Camera className="size-8" />
              </button>
              <span className="text-xs font-medium">Capture &amp; Analyze</span>
            </div>

            <button
              onClick={() => setFacing((f) => (f === "environment" ? "user" : "environment"))}
              className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <RefreshCw className="size-5" />
              Switch camera
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            {modelState === "loading" && "Loading on-device detector…"}
            {modelState === "unavailable" &&
              "On-device detection unsupported here — capture a photo and AI will analyze it."}
            {modelState === "ready" && "On-device detection running locally in your browser."}
          </p>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 text-primary" />
            Your image is used only to analyze the room and is not publicly shared.
          </p>
        </div>

        {/* Demo mode */}
        <section className="border-t border-border/60 px-4 py-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-watt/20 px-2.5 py-1 font-mono text-xs uppercase tracking-widest text-watt">
                Demo mode
              </span>
              <p className="text-sm text-muted-foreground">
                No camera? Try a prepared room with realistic detections.
              </p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {DEMO_SCENES.map((scene) => (
                <button
                  key={scene.id}
                  onClick={() => startDemo(scene.id)}
                  className="panel overflow-hidden text-left transition-colors hover:border-primary"
                >
                  <img
                    src={scene.image}
                    alt={scene.title}
                    loading="lazy"
                    width={1024}
                    height={768}
                    className="h-28 w-full object-cover"
                  />
                  <div className="p-3">
                    <p className="font-semibold">{scene.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{scene.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      {analyzing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-background/95 px-6 backdrop-blur">
          <div className="w-full max-w-sm">
            <p className="flex items-center gap-2 font-display text-xl font-bold">
              <Sparkles className="size-5 text-primary" /> Scanning Electronics…
            </p>
            <ul className="mt-6 space-y-3">
              {STAGES.map((label, i) => (
                <li key={label} className="flex items-center gap-3 text-sm">
                  {i < stage ? (
                    <CheckCircle2 className="size-5 text-primary" />
                  ) : i === stage ? (
                    <Loader2 className="size-5 animate-spin text-primary" />
                  ) : (
                    <span className="size-5 rounded-full border border-border" />
                  )}
                  <span className={i <= stage ? "text-foreground" : "text-muted-foreground"}>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function UploadButton({
  onFile,
  label,
  primary = false,
}: {
  onFile: (file: File) => void | Promise<void>;
  label: string;
  primary?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        className={
          primary
            ? "inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground"
            : "flex flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs text-muted-foreground hover:bg-accent hover:text-foreground"
        }
      >
        <ImageUp className={primary ? "size-4" : "size-5"} />
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = "";
        }}
      />
    </>
  );
}
