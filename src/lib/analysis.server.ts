import { z } from "zod";

/**
 * WattNow AI backend.
 *
 * Provider order:
 * 1. Direct Gemini API when GEMINI_API_KEY / GOOGLE_API_KEY is available.
 * 2. Lovable AI gateway when LOVABLE_API_KEY is available.
 *
 * Keeping both providers makes the exported project portable while preserving
 * compatibility with Lovable Cloud. AI credentials stay server-side.
 */

const STATUS_VALUES = ["active", "off", "unknown", "likely_active", "likely_off"] as const;
const CONFIDENCE_VALUES = ["high", "medium", "low"] as const;

const DeviceSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().min(1).max(200).default(1),
  powerMinWatts: z.number().min(0).max(10000),
  powerMaxWatts: z.number().min(0).max(15000),
  typicalWatts: z.number().min(0).max(15000),
  status: z.enum(STATUS_VALUES).default("unknown"),
  confidence: z.enum(CONFIDENCE_VALUES).default("medium"),
  suggestedHoursPerDay: z.number().min(0).max(24).default(4),
  reason: z.string().default(""),
});

export const AnalysisSchema = z.object({
  roomGuess: z.string().optional().default(""),
  devices: z.array(DeviceSchema).default([]),
  observations: z.array(z.string()).default([]),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

const CoachingSchema = z.object({
  verdict: z.string().optional().default(""),
  blindSpot: z.string().optional().default(""),
  recommendations: z
    .array(
      z.object({
        title: z.string().default("Energy-saving opportunity"),
        impact: z.string().default("Medium"),
        body: z.string().default(""),
        changeHint: z.string().optional().default(""),
      }),
    )
    .max(3)
    .default([]),
  oneChange: z
    .object({ title: z.string().default("One change"), body: z.string().default("") })
    .optional(),
  warnings: z.array(z.string()).default([]),
});

export type CoachingResult = z.infer<typeof CoachingSchema>;

export const SYSTEM_PROMPT = `You are WattNow's energy-efficiency vision assistant for indoor spaces in Indonesia.

Identify electrical and electronic appliances that are actually visible in the image, including air conditioners, lamps/lights, televisions, monitors, laptops, desktop computers, speakers, fans, ceiling fans, sockets, power strips, routers, air purifiers, vacuum cleaners, refrigerators, microwaves, rice cookers, kettles, water dispensers, projectors, printers, chargers, game consoles, water heaters, washing machines and similar electrical devices.

For each visible appliance:
1. Give a general appliance name, not an invented exact brand/model.
2. Count visible units of the same type.
3. Estimate a broad, realistic electrical input power range in watts for typical appliances used in Indonesia.
4. Give a reasonable midpoint estimate (typicalWatts).
5. Set status to one of exactly: active, off, unknown, likely_active, likely_off. Use unknown unless visual evidence supports another status.
6. Set confidence to one of exactly: high, medium, low.
7. Suggest a realistic daily usage duration between 0 and 24 hours.
8. Briefly explain why the appliance was identified.

Important scientific rules:
- A camera cannot measure exact power. Treat all wattages as estimates.
- Do not infer hidden devices that are not visible.
- Do not count passive furniture or non-electrical objects.
- A wall socket or power strip itself consumes approximately zero unless it contains active electronics; if included, keep its estimated own consumption near zero.
- Prefer a wider range rather than false precision.
- Add short observations about possible energy-saving opportunities only when supported by the image.
- Return JSON only.`;

const COACH_SYSTEM_PROMPT = `You are WattNow's energy coach for Indonesian users. You receive JSON containing appliances estimated from a room photo, user-edited daily usage hours, monthly kWh and Rupiah cost estimates.

Return JSON only with these keys:
- verdict: 2-3 sentences. Begin exactly with "Based on the appliances detected and your estimated usage". Never call estimates measurements.
- blindSpot: one concise sentence naming the appliance that contributes the largest share, with its approximate percentage when available.
- recommendations: up to 3 objects with {title, impact, body, changeHint}. impact should normally be High, Medium, Low, or Low–Medium. Each recommendation must reference devices and numbers present in the input.
- oneChange: {title, body} containing the single strongest realistic change.
- warnings: short carefully-worded possible-energy-waste notes; may be empty.

Do not invent appliances that are not in the input. Costs are Indonesian Rupiah.`;

const ROOM_JSON_SCHEMA = {
  type: "object",
  properties: {
    roomGuess: { type: "string" },
    devices: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          quantity: { type: "number" },
          powerMinWatts: { type: "number" },
          powerMaxWatts: { type: "number" },
          typicalWatts: { type: "number" },
          status: { type: "string", enum: [...STATUS_VALUES] },
          confidence: { type: "string", enum: [...CONFIDENCE_VALUES] },
          suggestedHoursPerDay: { type: "number" },
          reason: { type: "string" },
        },
        required: [
          "name",
          "quantity",
          "powerMinWatts",
          "powerMaxWatts",
          "typicalWatts",
          "status",
          "confidence",
          "suggestedHoursPerDay",
          "reason",
        ],
      },
    },
    observations: { type: "array", items: { type: "string" } },
  },
  required: ["roomGuess", "devices", "observations"],
} as const;

const COACH_JSON_SCHEMA = {
  type: "object",
  properties: {
    verdict: { type: "string" },
    blindSpot: { type: "string" },
    recommendations: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          impact: { type: "string" },
          body: { type: "string" },
          changeHint: { type: "string" },
        },
        required: ["title", "impact", "body", "changeHint"],
      },
    },
    oneChange: {
      type: "object",
      properties: { title: { type: "string" }, body: { type: "string" } },
      required: ["title", "body"],
    },
    warnings: { type: "array", items: { type: "string" } },
  },
  required: ["verdict", "blindSpot", "recommendations", "oneChange", "warnings"],
} as const;

const GEMINI_MODEL = process.env["GEMINI_MODEL"] || "gemini-3.6-flash";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const REQUEST_TIMEOUT_MS = 45_000;

/* eslint-disable @typescript-eslint/no-explicit-any */
type LooseObj = any;

class AiBackendError extends Error {
  code: string;
  status?: number | undefined;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "AiBackendError";
    this.code = code;
    this.status = status;
  }
}

function env(name: string): string {
  return String(process.env[name] ?? "").trim();
}

function getGeminiKey(): string {
  return env("GEMINI_API_KEY") || env("GOOGLE_GENERATIVE_AI_API_KEY") || env("GOOGLE_API_KEY");
}

function errorForStatus(status: number, body: string): AiBackendError {
  if (status === 401 || status === 403) return new AiBackendError("AI_AUTH", "The AI API key was rejected.", status);
  if (status === 402) return new AiBackendError("NO_CREDITS", "The AI provider has no remaining credits.", status);
  if (status === 413) return new AiBackendError("IMAGE_TOO_LARGE", "The captured image is too large for AI analysis.", status);
  if (status === 429) return new AiBackendError("RATE_LIMIT", "The AI service is temporarily rate limited.", status);
  if (status >= 500) return new AiBackendError("AI_TEMPORARY", `The AI service is temporarily unavailable (${status}).`, status);
  return new AiBackendError("AI_REQUEST", `AI request failed (${status})${body ? `: ${body.slice(0, 500)}` : ""}`, status);
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new AiBackendError("AI_TIMEOUT", "AI analysis timed out. Please try again.");
    }
    throw new AiBackendError(
      "AI_NETWORK",
      error instanceof Error ? `Could not reach the AI service: ${error.message}` : "Could not reach the AI service.",
    );
  } finally {
    clearTimeout(timer);
  }
}

async function withTransientRetry<T>(fn: () => Promise<T>): Promise<T> {
  let last: unknown;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      last = error;
      const code = error instanceof AiBackendError ? error.code : "";
      if (!["AI_TEMPORARY", "AI_NETWORK", "AI_TIMEOUT"].includes(code) || attempt === 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 700 + Math.random() * 500));
    }
  }
  throw last;
}

function parseDataUrl(dataUrl: string): { mimeType: string; base64: string } {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/s.exec(dataUrl);
  if (!match) throw new AiBackendError("INVALID_IMAGE", "The captured image format is invalid.");
  return { mimeType: match[1]!, base64: match[2]! };
}

function extractJsonText(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "{}";

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) return fenced[1].trim();

  const firstObject = trimmed.indexOf("{");
  const lastObject = trimmed.lastIndexOf("}");
  if (firstObject >= 0 && lastObject > firstObject) return trimmed.slice(firstObject, lastObject + 1);

  const firstArray = trimmed.indexOf("[");
  const lastArray = trimmed.lastIndexOf("]");
  if (firstArray >= 0 && lastArray > firstArray) return trimmed.slice(firstArray, lastArray + 1);

  return trimmed;
}

function jsonFromText(input: string): unknown {
  const text = extractJsonText(input);
  try {
    return JSON.parse(text);
  } catch (error) {
    throw new AiBackendError(
      "AI_BAD_JSON",
      `AI returned an unreadable response: ${error instanceof Error ? error.message : "invalid JSON"}`,
    );
  }
}

function toNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^0-9.+-]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function normalizeStatus(value: unknown): (typeof STATUS_VALUES)[number] {
  const v = String(value ?? "").toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (STATUS_VALUES.includes(v as (typeof STATUS_VALUES)[number])) return v as (typeof STATUS_VALUES)[number];
  if (["on", "running", "turned_on", "powered_on"].includes(v)) return "likely_active";
  if (["inactive", "turned_off", "powered_off"].includes(v)) return "likely_off";
  return "unknown";
}

function normalizeConfidence(value: unknown): (typeof CONFIDENCE_VALUES)[number] {
  const v = String(value ?? "").toLowerCase();
  if (v.includes("high") || v.includes("strong")) return "high";
  if (v.includes("low") || v.includes("weak")) return "low";
  return "medium";
}

function normalizeAnalysis(raw: unknown): AnalysisResult {
  const obj = raw && typeof raw === "object" ? (raw as LooseObj) : {};
  const rawDevices = Array.isArray(obj.devices) ? obj.devices : [];
  const devices = rawDevices
    .map((item: any) => {
      const d = item && typeof item === "object" ? (item as LooseObj) : {};
      const name = String(d.name ?? d.device ?? d.appliance ?? "Electronic Device").trim() || "Electronic Device";
      const minRaw = Math.max(0, toNumber(d.powerMinWatts ?? d.minWatts ?? d.minimumWatts, 10));
      const maxRaw = Math.max(minRaw, toNumber(d.powerMaxWatts ?? d.maxWatts ?? d.maximumWatts, Math.max(minRaw, 100)));
      const typicalRaw = toNumber(d.typicalWatts ?? d.midpointWatts ?? d.watts, (minRaw + maxRaw) / 2);
      const normalized = {
        name,
        quantity: Math.min(200, Math.max(1, Math.round(toNumber(d.quantity ?? d.count, 1)))),
        powerMinWatts: Math.min(10000, minRaw),
        powerMaxWatts: Math.min(15000, maxRaw),
        typicalWatts: Math.min(15000, Math.max(minRaw, Math.min(maxRaw, typicalRaw))),
        status: normalizeStatus(d.status ?? d.operatingStatus),
        confidence: normalizeConfidence(d.confidence),
        suggestedHoursPerDay: Math.min(24, Math.max(0, toNumber(d.suggestedHoursPerDay ?? d.hoursPerDay, 4))),
        reason: String(d.reason ?? d.explanation ?? "").trim(),
      };
      const parsed = DeviceSchema.safeParse(normalized);
      if (!parsed.success) {
        console.warn("[WattNow AI] Dropping invalid device", parsed.error.flatten(), normalized);
        return null;
      }
      return parsed.data;
    })
    .filter((device: any): device is z.infer<typeof DeviceSchema> => device !== null);

  const observations = Array.isArray(obj.observations)
    ? obj.observations.map((v: any) => String(v)).filter(Boolean).slice(0, 8)
    : [];

  return AnalysisSchema.parse({
    roomGuess: String(obj.roomGuess ?? obj.room_type ?? obj.roomType ?? ""),
    devices,
    observations,
  });
}

function normalizeCoaching(raw: unknown): CoachingResult {
  const obj = raw && typeof raw === "object" ? (raw as LooseObj) : {};
  const recs = Array.isArray(obj.recommendations) ? obj.recommendations : [];
  const recommendations = recs.slice(0, 3).map((item: any) => {
    const r = item && typeof item === "object" ? (item as LooseObj) : {};
    return {
      title: String(r.title ?? "Energy-saving opportunity"),
      impact: String(r.impact ?? "Medium"),
      body: String(r.body ?? r.description ?? ""),
      changeHint: String(r.changeHint ?? r.change_hint ?? ""),
    };
  });
  const one = obj.oneChange && typeof obj.oneChange === "object" ? (obj.oneChange as LooseObj) : undefined;

  return CoachingSchema.parse({
    verdict: String(obj.verdict ?? ""),
    blindSpot: String(obj.blindSpot ?? obj.blind_spot ?? ""),
    recommendations,
    oneChange: one ? { title: String(one.title ?? "One change"), body: String(one.body ?? "") } : undefined,
    warnings: Array.isArray(obj.warnings) ? obj.warnings.map((v: any) => String(v)).filter(Boolean).slice(0, 6) : [],
  });
}

function extractGeminiText(json: unknown): string {
  const root = json && typeof json === "object" ? (json as LooseObj) : {};
  const candidates = Array.isArray(root.candidates) ? root.candidates : [];
  const first = candidates[0] && typeof candidates[0] === "object" ? (candidates[0] as LooseObj) : {};
  const content = first.content && typeof first.content === "object" ? (first.content as LooseObj) : {};
  const parts = Array.isArray(content.parts) ? content.parts : [];
  return parts
    .map((part: any) => (part && typeof part === "object" ? String((part as LooseObj).text ?? "") : ""))
    .join("")
    .trim();
}

async function callGeminiJson(args: {
  prompt: string;
  imageDataUrl?: string;
  schema: unknown;
}): Promise<unknown> {
  const apiKey = getGeminiKey();
  if (!apiKey) throw new AiBackendError("AI_NOT_CONFIGURED", "No Gemini API key is configured.");

  const parts: LooseObj[] = [{ text: args.prompt }];
  if (args.imageDataUrl) {
    const { mimeType, base64 } = parseDataUrl(args.imageDataUrl);
    parts.push({ inline_data: { mime_type: mimeType, data: base64 } });
  }

  return withTransientRetry(async () => {
    const res = await fetchWithTimeout(`${GEMINI_ENDPOINT}/${encodeURIComponent(GEMINI_MODEL)}:generateContent`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts }],
        generationConfig: {
          temperature: 0.1,
          response_mime_type: "application/json",
          response_schema: args.schema,
        },
      }),
    });

    const bodyText = await res.text();
    if (!res.ok) throw errorForStatus(res.status, bodyText);

    let responseJson: unknown;
    try {
      responseJson = JSON.parse(bodyText);
    } catch {
      throw new AiBackendError("AI_BAD_RESPONSE", "Gemini returned a non-JSON API response.");
    }

    const outputText = extractGeminiText(responseJson);
    if (!outputText) {
      const root = responseJson && typeof responseJson === "object" ? (responseJson as LooseObj) : {};
      const feedback = root.promptFeedback ? ` Prompt feedback: ${JSON.stringify(root.promptFeedback).slice(0, 300)}` : "";
      throw new AiBackendError("AI_EMPTY", `Gemini returned no analysis.${feedback}`);
    }
    return jsonFromText(outputText);
  });
}

function extractLovableText(json: unknown): string {
  const root = json && typeof json === "object" ? (json as LooseObj) : {};
  const choices = Array.isArray(root.choices) ? root.choices : [];
  const first = choices[0] && typeof choices[0] === "object" ? (choices[0] as LooseObj) : {};
  const message = first.message && typeof first.message === "object" ? (first.message as LooseObj) : {};
  const content = message.content;
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((part: any) => (part && typeof part === "object" ? String((part as LooseObj).text ?? "") : ""))
      .join("")
      .trim();
  }
  return "";
}

async function callLovableJson(args: { prompt: string; imageDataUrl?: string }): Promise<unknown> {
  const apiKey = env("LOVABLE_API_KEY");
  if (!apiKey) throw new AiBackendError("AI_NOT_CONFIGURED", "Lovable AI is not configured.");

  const userContent: unknown = args.imageDataUrl
    ? [
        { type: "text", text: args.prompt },
        { type: "image_url", image_url: { url: args.imageDataUrl } },
      ]
    : args.prompt;

  // Lovable's supported-model list changes over time. Try the current default
  // first, then a stable low-cost fallback only when the model identifier is
  // rejected (400/404), not on billing/rate-limit failures.
  const models = ["google/gemini-3-flash", "google/gemini-2.5-flash"];
  let lastError: unknown;

  for (const model of models) {
    try {
      return await withTransientRetry(async () => {
        const res = await fetchWithTimeout(LOVABLE_GATEWAY, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "system",
                content: "Return valid JSON only. Do not wrap the JSON in markdown fences.",
              },
              { role: "user", content: userContent },
            ],
            temperature: 0.1,
          }),
        });

        const bodyText = await res.text();
        if (!res.ok) throw errorForStatus(res.status, bodyText);
        let responseJson: unknown;
        try {
          responseJson = JSON.parse(bodyText);
        } catch {
          throw new AiBackendError("AI_BAD_RESPONSE", "Lovable AI returned a non-JSON API response.");
        }
        const outputText = extractLovableText(responseJson);
        if (!outputText) throw new AiBackendError("AI_EMPTY", "Lovable AI returned no analysis.");
        return jsonFromText(outputText);
      });
    } catch (error) {
      lastError = error;
      const status = error instanceof AiBackendError ? error.status : undefined;
      if (status !== 400 && status !== 404) throw error;
    }
  }
  throw lastError;
}

async function callAvailableAiJson(args: {
  prompt: string;
  imageDataUrl?: string;
  schema: unknown;
}): Promise<unknown> {
  if (getGeminiKey()) return callGeminiJson(args);
  if (env("LOVABLE_API_KEY")) return callLovableJson(args);
  throw new AiBackendError(
    "AI_NOT_CONFIGURED",
    "No AI backend is configured. Add GEMINI_API_KEY to your server environment or run the project with Lovable AI enabled.",
  );
}

export async function analyzeRoomImage(imageDataUrl: string, hint: string): Promise<AnalysisResult> {
  const prompt = `${SYSTEM_PROMPT}\n\nAnalyze this room photo and list the electrical appliances you can see. ${hint || ""}`;
  const raw = await callAvailableAiJson({ prompt, imageDataUrl, schema: ROOM_JSON_SCHEMA });
  return normalizeAnalysis(raw);
}

function localCoachingFallback(payload: unknown): CoachingResult {
  const root = payload && typeof payload === "object" ? (payload as LooseObj) : {};
  const totals = root.totals && typeof root.totals === "object" ? (root.totals as LooseObj) : {};
  const devices = Array.isArray(root.devices) ? root.devices : [];
  const rows = devices
    .map((item: any) => (item && typeof item === "object" ? (item as LooseObj) : {}))
    .sort((a: any, b: any) => toNumber(b.sharePct, 0) - toNumber(a.sharePct, 0));
  const top = rows[0];
  const topName = top ? String(top.name ?? "the largest appliance") : "the largest appliance";
  const topShare = top ? Math.round(toNumber(top.sharePct, 0)) : 0;
  const monthlyMin = Math.round(toNumber(totals.monthlyCostMinRp, 0));
  const monthlyMax = Math.round(toNumber(totals.monthlyCostMaxRp, 0));
  const rp = (n: number) => `Rp ${new Intl.NumberFormat("id-ID").format(n)}`;

  const recommendations = rows.slice(0, 3).map((d: any, index: number) => {
    const name = String(d.name ?? "Device");
    const hours = toNumber(d.hoursPerDay, 0);
    const share = Math.round(toNumber(d.sharePct, 0));
    const reducedHours = Math.max(0, Math.round((hours - Math.min(2, hours * 0.2)) * 10) / 10);
    return {
      title: index === 0 ? `Start with ${name}` : `Review ${name} usage`,
      impact: share >= 40 ? "High" : share >= 15 ? "Medium" : "Low–Medium",
      body: `${name} contributes about ${share}% of the current estimate and is set to ${hours} h/day. If practical, reducing unnecessary runtime is more useful than focusing first on very small loads.`,
      changeHint: hours > 0 ? `Try ${reducedHours} h/day in the What-If simulator.` : "Confirm whether this device is actually active.",
    };
  });

  return CoachingSchema.parse({
    verdict: `Based on the appliances detected and your estimated usage, this room is estimated at roughly ${rp(monthlyMin)}–${rp(monthlyMax)} per month. The result is an estimate based on appliance types and usage hours, not a meter reading.`,
    blindSpot: top ? `${topName} is the current energy blind spot at approximately ${topShare}% of estimated monthly consumption.` : "No clear energy blind spot could be determined.",
    recommendations,
    oneChange: top
      ? {
          title: `If you change only one thing: review ${topName}`,
          body: `It currently has the largest estimated contribution. Confirm its actual operating hours and reduce unnecessary runtime where comfort and safety allow.`,
        }
      : { title: "Confirm device usage", body: "Add or correct the devices and daily hours to improve the estimate." },
    warnings: [],
  });
}

export async function generateCoaching(payload: unknown): Promise<CoachingResult> {
  try {
    const raw = await callAvailableAiJson({
      prompt: `${COACH_SYSTEM_PROMPT}\n\nInput data:\n${JSON.stringify(payload)}`,
      schema: COACH_JSON_SCHEMA,
    });
    const normalized = normalizeCoaching(raw);
    // If the AI returned structurally valid but empty coaching, use the local
    // deterministic fallback so the results page never becomes blank.
    if (!normalized.verdict || !normalized.oneChange?.body) return localCoachingFallback(payload);
    return normalized;
  } catch (error) {
    console.error("[WattNow coaching] AI unavailable; using local fallback", error);
    return localCoachingFallback(payload);
  }
}
