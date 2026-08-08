import { APPLIANCE_CATALOG, makeAppliance, matchCatalogKey } from "./appliance-catalog";
import type { Appliance, BoxDetection, Confidence, ApplianceStatus } from "./energy";

export interface AiDevice {
  name: string;
  quantity: number;
  powerMinWatts: number;
  powerMaxWatts: number;
  typicalWatts: number;
  status?: string;
  confidence?: string;
  suggestedHoursPerDay?: number;
  reason?: string;
}

const STATUSES: ApplianceStatus[] = ["active", "off", "unknown", "likely_active", "likely_off"];

/**
 * Merges fast live-detector boxes with the deeper AI photo analysis,
 * de-duplicating by appliance category.
 */
export function mergeDetections(boxes: BoxDetection[], aiDevices: AiDevice[]): Appliance[] {
  const byKey = new Map<string, Appliance>();

  for (const box of boxes) {
    const key = matchCatalogKey(box.label);
    const existing = byKey.get(key);
    if (existing) {
      existing.quantity += 1;
      existing.detectionConfidence = Math.max(existing.detectionConfidence ?? 0, box.score);
    } else {
      byKey.set(
        key,
        makeAppliance(box.label, {
          detectionConfidence: box.score,
          confidence: box.score > 0.8 ? "high" : box.score > 0.6 ? "medium" : "low",
          source: "live_detector",
        }),
      );
    }
  }

  for (const d of aiDevices) {
    const key = matchCatalogKey(d.name);
    const catalog = APPLIANCE_CATALOG[key];
    const status = (STATUSES.includes(d.status as ApplianceStatus) ? d.status : "unknown") as ApplianceStatus;
    const confidence = (["high", "medium", "low"].includes(d.confidence ?? "")
      ? d.confidence
      : "medium") as Confidence;
    const hours =
      typeof d.suggestedHoursPerDay === "number" && d.suggestedHoursPerDay > 0
        ? d.suggestedHoursPerDay
        : (catalog?.suggestedHours ?? 4);

    const existing = byKey.get(key);
    if (existing) {
      existing.quantity = Math.max(existing.quantity, Math.round(d.quantity) || 1);
      existing.powerMinWatts = d.powerMinWatts || existing.powerMinWatts;
      existing.powerMaxWatts = Math.max(d.powerMaxWatts || 0, existing.powerMinWatts);
      existing.typicalWatts = d.typicalWatts || existing.typicalWatts;
      existing.status = status;
      existing.hoursPerDay = hours;
      existing.reason = d.reason ?? existing.reason ?? "";
      existing.name = d.name || existing.name;
    } else {
      byKey.set(
        key,
        makeAppliance(d.name, {
          name: d.name,
          quantity: Math.round(d.quantity) || 1,
          powerMinWatts: d.powerMinWatts,
          powerMaxWatts: Math.max(d.powerMaxWatts, d.powerMinWatts),
          typicalWatts: d.typicalWatts,
          status,
          confidence,
          hoursPerDay: hours,
          reason: d.reason ?? "",
          source: "ai_image",
        }),
      );
    }
  }

  return [...byKey.values()];
}
