/**
 * WattNow energy model.
 * Everything here produces ESTIMATES, never measurements.
 */

export type ApplianceStatus = "active" | "off" | "unknown" | "likely_active" | "likely_off";
export type Confidence = "high" | "medium" | "low";
export type ApplianceSource = "live_detector" | "ai_image" | "user_added" | "demo";

export interface Appliance {
  id: string;
  name: string;
  category: string;
  quantity: number;
  detectionConfidence?: number;
  powerMinWatts: number;
  powerMaxWatts: number;
  typicalWatts: number;
  status: ApplianceStatus;
  confidence: Confidence;
  reason?: string;
  hoursPerDay: number;
  included?: boolean;
  source: ApplianceSource;
}

export interface BoxDetection {
  id: string;
  label: string;
  score: number;
  /** normalized 0..1 relative to the captured/preview frame */
  x: number;
  y: number;
  w: number;
  h: number;
}

export type RoomType =
  | "bedroom"
  | "classroom"
  | "living_room"
  | "office"
  | "kitchen"
  | "school_room"
  | "meeting_room"
  | "other";

export const ROOM_TYPES: { value: RoomType; label: string }[] = [
  { value: "bedroom", label: "Bedroom" },
  { value: "classroom", label: "Classroom" },
  { value: "living_room", label: "Living room" },
  { value: "office", label: "Office" },
  { value: "kitchen", label: "Kitchen" },
  { value: "school_room", label: "School room" },
  { value: "meeting_room", label: "Meeting room" },
  { value: "other", label: "Other" },
];

/**
 * Configurable Indonesian electricity tariff.
 * PLN tariffs change and vary by customer category — this is an EXAMPLE default.
 */
export const TARIFF_CONFIG = {
  defaultRpPerKwh: 1700,
  currency: "IDR",
  label: "Example Indonesian household tariff (configurable)",
  presets: [
    { label: "Subsidised R-1 / 900 VA", value: 1352 },
    { label: "Household R-1 / 1300–2200 VA", value: 1700 },
    { label: "Household R-2 / 3500–5500 VA", value: 1699.53 },
    { label: "Business / B-2", value: 1444.7 },
  ],
};

export const DAYS_PER_MONTH = 30;

export interface ApplianceEnergy {
  dailyKwhMin: number;
  dailyKwhMax: number;
  monthlyKwhMin: number;
  monthlyKwhMax: number;
  dailyCostMin: number;
  dailyCostMax: number;
  monthlyCostMin: number;
  monthlyCostMax: number;
  yearlyCostMin: number;
  yearlyCostMax: number;
  activePowerMin: number;
  activePowerMax: number;
}

export function isRunning(a: Appliance): boolean {
  return a.included !== false && (a.status === "active" || a.status === "likely_active");
}

export function computeApplianceEnergy(a: Appliance, tariff: number): ApplianceEnergy {
  const running = isRunning(a);
  const qty = Math.max(0, a.quantity || 0);
  const hours = running ? a.hoursPerDay : 0;
  const dailyKwhMin = (a.powerMinWatts * qty * hours) / 1000;
  const dailyKwhMax = (a.powerMaxWatts * qty * hours) / 1000;
  const dailyCostMin = dailyKwhMin * tariff;
  const dailyCostMax = dailyKwhMax * tariff;
  return {
    dailyKwhMin,
    dailyKwhMax,
    monthlyKwhMin: dailyKwhMin * DAYS_PER_MONTH,
    monthlyKwhMax: dailyKwhMax * DAYS_PER_MONTH,
    dailyCostMin,
    dailyCostMax,
    monthlyCostMin: dailyCostMin * DAYS_PER_MONTH,
    monthlyCostMax: dailyCostMax * DAYS_PER_MONTH,
    yearlyCostMin: dailyCostMin * 365,
    yearlyCostMax: dailyCostMax * 365,
    activePowerMin: running ? a.powerMinWatts * qty : 0,
    activePowerMax: running ? a.powerMaxWatts * qty : 0,
  };
}

export interface RoomTotals {
  devices: number;
  units: number;
  activePowerMin: number;
  activePowerMax: number;
  monthlyKwhMin: number;
  monthlyKwhMax: number;
  monthlyCostMin: number;
  monthlyCostMax: number;
  dailyKwhMin: number;
  dailyKwhMax: number;
  yearlyCostMin: number;
  yearlyCostMax: number;
  breakdown: {
    appliance: Appliance;
    energy: ApplianceEnergy;
    sharePct: number;
  }[];
}

export function computeRoomTotals(appliances: Appliance[], tariff: number): RoomTotals {
  const rows = appliances.map((appliance) => ({
    appliance,
    energy: computeApplianceEnergy(appliance, tariff),
  }));
  const sum = (fn: (r: (typeof rows)[number]) => number) => rows.reduce((t, r) => t + fn(r), 0);
  const midTotal = sum((r) => (r.energy.monthlyKwhMin + r.energy.monthlyKwhMax) / 2) || 1;

  const breakdown = rows
    .map((r) => ({
      ...r,
      sharePct: (((r.energy.monthlyKwhMin + r.energy.monthlyKwhMax) / 2) / midTotal) * 100,
    }))
    .sort((a, b) => b.energy.monthlyKwhMax - a.energy.monthlyKwhMax);

  const included = appliances.filter((a) => a.included !== false);

  return {
    devices: included.length,
    units: included.reduce((t, a) => t + (a.quantity || 0), 0),
    activePowerMin: sum((r) => r.energy.activePowerMin),
    activePowerMax: sum((r) => r.energy.activePowerMax),
    monthlyKwhMin: sum((r) => r.energy.monthlyKwhMin),
    monthlyKwhMax: sum((r) => r.energy.monthlyKwhMax),
    monthlyCostMin: sum((r) => r.energy.monthlyCostMin),
    monthlyCostMax: sum((r) => r.energy.monthlyCostMax),
    dailyKwhMin: sum((r) => r.energy.dailyKwhMin),
    dailyKwhMax: sum((r) => r.energy.dailyKwhMax),
    yearlyCostMin: sum((r) => r.energy.yearlyCostMin),
    yearlyCostMax: sum((r) => r.energy.yearlyCostMax),
    breakdown,
  };
}

/** Rough expected monthly kWh per room type, used to score in context. */
const ROOM_BASELINE_KWH: Record<RoomType, number> = {
  bedroom: 120,
  classroom: 260,
  living_room: 200,
  office: 220,
  kitchen: 180,
  school_room: 260,
  meeting_room: 200,
  other: 200,
};

export interface ScoreResult {
  score: number;
  band: string;
  bandTone: "good" | "ok" | "warn" | "bad";
  notes: string[];
}

export function computeWattNowScore(
  appliances: Appliance[],
  totals: RoomTotals,
  roomType: RoomType,
  occupants: number,
): ScoreResult {
  const notes: string[] = [];
  const baseline = ROOM_BASELINE_KWH[roomType] * Math.max(1, Math.min(occupants || 1, 40)) ** 0.35;
  const midMonthly = (totals.monthlyKwhMin + totals.monthlyKwhMax) / 2;

  let score = 100;

  const ratio = midMonthly / baseline;
  score -= Math.min(55, Math.max(0, (ratio - 0.6) * 55));
  notes.push(
    `Estimated ${Math.round(midMonthly)} kWh/month vs a typical ${Math.round(baseline)} kWh for this room type.`,
  );

  const top = totals.breakdown[0];
  if (top && top.sharePct > 55) {
    score -= 8;
    notes.push(`${top.appliance.name} dominates with roughly ${Math.round(top.sharePct)}% of the estimate.`);
  }

  const longRunners = appliances.filter((a) => isRunning(a) && a.hoursPerDay >= 12 && a.typicalWatts >= 150);
  if (longRunners.length) {
    score -= Math.min(12, longRunners.length * 6);
    notes.push(`${longRunners.length} high-power appliance(s) estimated to run 12h/day or more.`);
  }

  const standby = appliances.filter((a) => a.included !== false && a.status !== "active" && a.status !== "likely_active");
  if (standby.length >= 3) {
    score -= 5;
    notes.push(`${standby.length} devices are idle or unknown — standby load may add up.`);
  }

  const unknown = appliances.filter((a) => a.status === "unknown").length;
  if (unknown) notes.push(`${unknown} device(s) have an unknown operating status, so the estimate is less certain.`);

  score = Math.max(0, Math.min(100, Math.round(score)));

  const band =
    score >= 90
      ? "Excellent"
      : score >= 75
        ? "Efficient"
        : score >= 60
          ? "Moderate"
          : score >= 40
            ? "High Consumption"
            : "Very High Consumption";
  const bandTone: ScoreResult["bandTone"] =
    score >= 75 ? "good" : score >= 60 ? "ok" : score >= 40 ? "warn" : "bad";

  return { score, band, bandTone, notes };
}

/* ---------- formatting ---------- */

export function formatRp(value: number): string {
  const rounded = value >= 10000 ? Math.round(value / 1000) * 1000 : Math.round(value);
  return "Rp " + new Intl.NumberFormat("id-ID").format(rounded);
}

export function formatRpRange(min: number, max: number): string {
  if (Math.round(min) === Math.round(max)) return formatRp(min);
  return `${formatRp(min)}–${formatRp(max)}`;
}

export function formatKwhRange(min: number, max: number): string {
  const f = (v: number) => (v >= 100 ? Math.round(v).toString() : v.toFixed(1));
  return min.toFixed(0) === max.toFixed(0) ? `${f(min)} kWh` : `${f(min)}–${f(max)} kWh`;
}

export function formatPowerRange(minW: number, maxW: number): string {
  if (maxW >= 1000) return `${(minW / 1000).toFixed(1)}–${(maxW / 1000).toFixed(1)} kW`;
  return `${Math.round(minW)}–${Math.round(maxW)} W`;
}

export const STATUS_LABEL: Record<ApplianceStatus, string> = {
  active: "Active",
  off: "Off",
  unknown: "Unknown",
  likely_active: "Likely active",
  likely_off: "Likely off",
};

export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}
