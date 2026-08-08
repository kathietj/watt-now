import type { Appliance, ApplianceStatus, Confidence } from "./energy";
import { uid } from "./energy";

export interface CatalogEntry {
  name: string;
  category: string;
  min: number;
  max: number;
  typical: number;
  suggestedHours: number;
  defaultStatus: ApplianceStatus;
}

/**
 * Typical appliance power ranges for Indonesian households.
 * These are ESTIMATES, not measurements.
 */
export const APPLIANCE_CATALOG: Record<string, CatalogEntry> = {
  air_conditioner: { name: "Split Air Conditioner", category: "Cooling", min: 400, max: 800, typical: 600, suggestedHours: 8, defaultStatus: "unknown" },
  fan: { name: "Fan", category: "Cooling", min: 30, max: 75, typical: 50, suggestedHours: 8, defaultStatus: "unknown" },
  ceiling_fan: { name: "Ceiling Fan", category: "Cooling", min: 45, max: 90, typical: 65, suggestedHours: 8, defaultStatus: "unknown" },
  light: { name: "Light / Lamp", category: "Lighting", min: 8, max: 24, typical: 15, suggestedHours: 6, defaultStatus: "unknown" },
  ceiling_light: { name: "Ceiling Light", category: "Lighting", min: 10, max: 36, typical: 20, suggestedHours: 6, defaultStatus: "unknown" },
  television: { name: "LED Television", category: "Entertainment", min: 60, max: 120, typical: 90, suggestedHours: 4, defaultStatus: "unknown" },
  monitor: { name: "Computer Monitor", category: "Work", min: 20, max: 45, typical: 30, suggestedHours: 6, defaultStatus: "unknown" },
  laptop: { name: "Laptop", category: "Work", min: 30, max: 80, typical: 50, suggestedHours: 6, defaultStatus: "unknown" },
  desktop: { name: "Desktop Computer", category: "Work", min: 120, max: 300, typical: 180, suggestedHours: 6, defaultStatus: "unknown" },
  speaker: { name: "Speaker", category: "Entertainment", min: 10, max: 60, typical: 25, suggestedHours: 3, defaultStatus: "unknown" },
  socket: { name: "Electric Socket / Outlet", category: "Infrastructure", min: 0, max: 5, typical: 1, suggestedHours: 24, defaultStatus: "unknown" },
  power_strip: { name: "Power Strip", category: "Infrastructure", min: 1, max: 10, typical: 3, suggestedHours: 24, defaultStatus: "unknown" },
  router: { name: "Wi-Fi Router", category: "Networking", min: 6, max: 18, typical: 10, suggestedHours: 24, defaultStatus: "likely_active" },
  air_purifier: { name: "Air Purifier", category: "Air quality", min: 20, max: 60, typical: 35, suggestedHours: 8, defaultStatus: "unknown" },
  vacuum: { name: "Vacuum Cleaner", category: "Cleaning", min: 400, max: 1200, typical: 700, suggestedHours: 0.5, defaultStatus: "off" },
  refrigerator: { name: "Refrigerator", category: "Kitchen", min: 60, max: 200, typical: 110, suggestedHours: 24, defaultStatus: "likely_active" },
  microwave: { name: "Microwave", category: "Kitchen", min: 700, max: 1200, typical: 900, suggestedHours: 0.3, defaultStatus: "off" },
  rice_cooker: { name: "Rice Cooker", category: "Kitchen", min: 300, max: 700, typical: 400, suggestedHours: 2, defaultStatus: "unknown" },
  kettle: { name: "Electric Kettle", category: "Kitchen", min: 800, max: 1800, typical: 1200, suggestedHours: 0.3, defaultStatus: "off" },
  water_dispenser: { name: "Water Dispenser", category: "Kitchen", min: 100, max: 550, typical: 250, suggestedHours: 8, defaultStatus: "unknown" },
  projector: { name: "Projector", category: "Presentation", min: 150, max: 350, typical: 240, suggestedHours: 3, defaultStatus: "unknown" },
  printer: { name: "Printer", category: "Work", min: 10, max: 500, typical: 40, suggestedHours: 0.5, defaultStatus: "off" },
  charger: { name: "Charger", category: "Small electronics", min: 5, max: 45, typical: 18, suggestedHours: 4, defaultStatus: "unknown" },
  game_console: { name: "Game Console", category: "Entertainment", min: 70, max: 200, typical: 120, suggestedHours: 2, defaultStatus: "unknown" },
  cctv: { name: "CCTV Camera", category: "Security", min: 4, max: 15, typical: 8, suggestedHours: 24, defaultStatus: "likely_active" },
  phone: { name: "Smartphone (charging)", category: "Small electronics", min: 5, max: 20, typical: 10, suggestedHours: 4, defaultStatus: "unknown" },
  water_heater: { name: "Water Heater", category: "Bathroom", min: 350, max: 1500, typical: 800, suggestedHours: 1, defaultStatus: "unknown" },
  washing_machine: { name: "Washing Machine", category: "Laundry", min: 250, max: 700, typical: 400, suggestedHours: 1, defaultStatus: "off" },
  other: { name: "Electronic Device", category: "Other", min: 10, max: 100, typical: 40, suggestedHours: 4, defaultStatus: "unknown" },
};

export const CATALOG_KEYS = Object.keys(APPLIANCE_CATALOG);

/**
 * Maps generic pretrained detector classes (COCO) to WattSight electronics keys.
 * A custom electronics model can later add: air_conditioner, socket, router,
 * air_purifier, ceiling_light — classes COCO does not know.
 */
export const COCO_TO_ELECTRONICS: Record<string, string> = {
  tv: "television",
  laptop: "laptop",
  "cell phone": "phone",
  mouse: "other",
  keyboard: "other",
  remote: "other",
  refrigerator: "refrigerator",
  microwave: "microwave",
  oven: "other",
  toaster: "other",
  "hair drier": "other",
  clock: "other",
  book: "",
};

export function matchCatalogKey(rawName: string): string {
  const n = rawName.toLowerCase();
  const direct = CATALOG_KEYS.find((k) => k.replace(/_/g, " ") === n);
  if (direct) return direct;
  const rules: [RegExp, string][] = [
    [/air.?cond|\bac\b|\bpk\b|split/, "air_conditioner"],
    [/ceiling fan/, "ceiling_fan"],
    [/fan/, "fan"],
    [/ceiling light|downlight/, "ceiling_light"],
    [/light|lamp|bulb|lampu/, "light"],
    [/tv|television|televisi/, "television"],
    [/monitor|display/, "monitor"],
    [/laptop|notebook/, "laptop"],
    [/desktop|\bpc\b|computer/, "desktop"],
    [/speaker|sound/, "speaker"],
    [/power strip|extension/, "power_strip"],
    [/socket|outlet|stop ?kontak/, "socket"],
    [/router|wi-?fi|modem/, "router"],
    [/purifier/, "air_purifier"],
    [/vacuum/, "vacuum"],
    [/fridge|refriger|kulkas/, "refrigerator"],
    [/microwave/, "microwave"],
    [/rice/, "rice_cooker"],
    [/kettle|teko/, "kettle"],
    [/dispenser/, "water_dispenser"],
    [/projector/, "projector"],
    [/printer|scanner/, "printer"],
    [/charger/, "charger"],
    [/console|playstation|xbox|nintendo/, "game_console"],
    [/cctv|camera/, "cctv"],
    [/water heater|heater/, "water_heater"],
    [/washing/, "washing_machine"],
    [/phone/, "phone"],
  ];
  for (const [re, key] of rules) if (re.test(n)) return key;
  return "other";
}

export function makeAppliance(
  rawName: string,
  opts: Partial<Appliance> & { quantity?: number } = {},
): Appliance {
  const key = matchCatalogKey(rawName);
  const fallback = APPLIANCE_CATALOG["other"] as CatalogEntry;
  const c: CatalogEntry = APPLIANCE_CATALOG[key] ?? fallback;
  return {
    id: uid(),
    name: opts.name ?? c.name,
    category: c.category,
    quantity: opts.quantity ?? 1,
    powerMinWatts: opts.powerMinWatts ?? c.min,
    powerMaxWatts: opts.powerMaxWatts ?? c.max,
    typicalWatts: opts.typicalWatts ?? c.typical,
    status: opts.status ?? c.defaultStatus,
    confidence: (opts.confidence ?? "medium") as Confidence,
    hoursPerDay: opts.hoursPerDay ?? c.suggestedHours,
    detectionConfidence: opts.detectionConfidence ?? 0,
    reason: opts.reason ?? "",
    included: true,
    source: opts.source ?? "user_added",
  };

}

/* ---------- Demo mode scenes ---------- */

export interface DemoScene {
  id: string;
  title: string;
  description: string;
  image: string;
  roomType: string;
  occupants: number;
  boxes: { label: string; score: number; x: number; y: number; w: number; h: number }[];
  devices: { raw: string; quantity: number; status: ApplianceStatus; confidence: Confidence; detection?: number }[];
}

export const DEMO_SCENES: DemoScene[] = [
  {
    id: "classroom",
    title: "Classroom Demo",
    description: "A 30-seat classroom with AC, projector and ceiling lights.",
    image: "/demo/classroom.jpg",
    roomType: "classroom",
    occupants: 30,
    boxes: [
      { label: "Air Conditioner", score: 0.94, x: 0.06, y: 0.08, w: 0.24, h: 0.16 },
      { label: "Projector", score: 0.88, x: 0.44, y: 0.05, w: 0.14, h: 0.1 },
      { label: "Ceiling Light", score: 0.81, x: 0.24, y: 0.02, w: 0.12, h: 0.06 },
      { label: "Ceiling Light", score: 0.79, x: 0.66, y: 0.03, w: 0.12, h: 0.06 },
      { label: "Desktop Computer", score: 0.86, x: 0.62, y: 0.55, w: 0.2, h: 0.24 },
      { label: "Speaker", score: 0.73, x: 0.86, y: 0.18, w: 0.1, h: 0.12 },
    ],
    devices: [
      { raw: "air conditioner", quantity: 1, status: "likely_active", confidence: "high", detection: 0.94 },
      { raw: "ceiling light", quantity: 8, status: "likely_active", confidence: "medium", detection: 0.81 },
      { raw: "projector", quantity: 1, status: "likely_active", confidence: "high", detection: 0.88 },
      { raw: "desktop computer", quantity: 1, status: "likely_active", confidence: "medium", detection: 0.86 },
      { raw: "speaker", quantity: 2, status: "unknown", confidence: "low", detection: 0.73 },
    ],
  },
  {
    id: "bedroom",
    title: "Bedroom Demo",
    description: "A bedroom with AC, TV, fan, router and chargers.",
    image: "/demo/bedroom.jpg",
    roomType: "bedroom",
    occupants: 2,
    boxes: [
      { label: "Air Conditioner", score: 0.92, x: 0.08, y: 0.06, w: 0.22, h: 0.14 },
      { label: "Television", score: 0.87, x: 0.52, y: 0.32, w: 0.3, h: 0.2 },
      { label: "Fan", score: 0.83, x: 0.2, y: 0.55, w: 0.14, h: 0.28 },
      { label: "Wi-Fi Router", score: 0.66, x: 0.84, y: 0.6, w: 0.1, h: 0.08 },
    ],
    devices: [
      { raw: "air conditioner", quantity: 1, status: "likely_active", confidence: "high", detection: 0.92 },
      { raw: "television", quantity: 1, status: "likely_off", confidence: "medium", detection: 0.87 },
      { raw: "fan", quantity: 1, status: "likely_active", confidence: "medium", detection: 0.83 },
      { raw: "light", quantity: 3, status: "unknown", confidence: "low" },
      { raw: "router", quantity: 1, status: "likely_active", confidence: "medium", detection: 0.66 },
      { raw: "charger", quantity: 2, status: "unknown", confidence: "low" },
    ],
  },
  {
    id: "office",
    title: "Office Demo",
    description: "A small office with workstations, monitors and a dispenser.",
    image: "/demo/office.jpg",
    roomType: "office",
    occupants: 6,
    boxes: [
      { label: "Air Conditioner", score: 0.9, x: 0.62, y: 0.05, w: 0.24, h: 0.14 },
      { label: "Monitor", score: 0.91, x: 0.12, y: 0.42, w: 0.22, h: 0.2 },
      { label: "Monitor", score: 0.89, x: 0.42, y: 0.44, w: 0.2, h: 0.18 },
      { label: "Laptop", score: 0.84, x: 0.68, y: 0.55, w: 0.18, h: 0.14 },
      { label: "Water Dispenser", score: 0.7, x: 0.02, y: 0.5, w: 0.1, h: 0.34 },
    ],
    devices: [
      { raw: "air conditioner", quantity: 1, status: "likely_active", confidence: "high", detection: 0.9 },
      { raw: "monitor", quantity: 4, status: "likely_active", confidence: "high", detection: 0.91 },
      { raw: "laptop", quantity: 3, status: "likely_active", confidence: "medium", detection: 0.84 },
      { raw: "ceiling light", quantity: 6, status: "likely_active", confidence: "medium" },
      { raw: "water dispenser", quantity: 1, status: "unknown", confidence: "low", detection: 0.7 },
      { raw: "router", quantity: 1, status: "likely_active", confidence: "medium" },
      { raw: "printer", quantity: 1, status: "likely_off", confidence: "low" },
    ],
  },
];
