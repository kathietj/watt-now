import { z } from "zod";

export const AnalysisSchema = z.object({
  roomGuess: z.string().optional().default(""),
  devices: z
    .array(
      z.object({
        name: z.string(),
        quantity: z.number().min(1).max(200).default(1),
        powerMinWatts: z.number().min(0).max(6000),
        powerMaxWatts: z.number().min(0).max(9000),
        typicalWatts: z.number().min(0).max(9000),
        status: z
          .enum(["active", "off", "unknown", "likely_active", "likely_off"])
          .default("unknown"),
        confidence: z.enum(["high", "medium", "low"]).default("medium"),
        suggestedHoursPerDay: z.number().min(0).max(24).default(4),
        reason: z.string().default(""),
      }),
    )
    .default([]),
  observations: z.array(z.string()).default([]),
});

export type AnalysisResult = z.infer<typeof AnalysisSchema>;

export const SYSTEM_PROMPT = `You are an energy-efficiency assistant analyzing photographs of indoor spaces in Indonesia.

Identify electrical and electronic appliances visible in the image (air conditioners, lights, televisions, monitors, laptops, desktops, speakers, fans, ceiling fans, sockets, power strips, routers, air purifiers, vacuum cleaners, refrigerators, microwaves, rice cookers, kettles, water dispensers, projectors, printers, chargers, game consoles and similar).

For every appliance:
1. Identify the general appliance type (e.g. "Split Air Conditioner", "LED Television", "Ceiling Light").
2. Estimate quantity visible.
3. Estimate the likely wattage RANGE based on typical appliances available in Indonesia.
4. Give a reasonable midpoint estimate (typicalWatts).
5. Determine whether the appliance visually appears active, inactive, or cannot be determined (use "unknown" when unclear).
6. Provide a confidence level: high, medium, or low.
7. Suggest a typical daily usage duration in hours for this appliance type.

Rules:
- Do not invent exact brands, models or specifications when they are not visible.
- Never represent estimated electricity usage as a measured value.
- Prefer broad ranges when uncertain.
- Also add short "observations" about possible energy waste, daylight availability, or combined cooling devices. Word them carefully as possibilities, never accusations.
- Return structured JSON only.`;

const GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

export async function analyzeRoomImage(imageDataUrl: string, hint: string) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze this room photo and list the electrical appliances you can see. ${hint}`,
            },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "room_analysis",
          strict: false,
          schema: {
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
                    status: { type: "string" },
                    confidence: { type: "string" },
                    suggestedHoursPerDay: { type: "number" },
                    reason: { type: "string" },
                  },
                  required: ["name", "quantity", "powerMinWatts", "powerMaxWatts", "typicalWatts"],
                },
              },
              observations: { type: "array", items: { type: "string" } },
            },
            required: ["devices"],
          },
        },
      },
    }),
  });

  if (res.status === 429) throw new Error("RATE_LIMIT");
  if (res.status === 402) throw new Error("NO_CREDITS");
  if (!res.ok) throw new Error(`AI request failed (${res.status}): ${await res.text()}`);

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? "{}";
  const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return AnalysisSchema.parse(JSON.parse(cleaned));
}

export async function generateCoaching(payload: unknown) {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new Error("AI is not configured");

  const res = await fetch(GATEWAY, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": apiKey },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        {
          role: "system",
          content: `You are WattSight's energy coach for Indonesian users. You receive a JSON summary of appliances estimated from a room photo, with wattage ranges, daily hours, monthly kWh and Rupiah cost estimates.

Write output as JSON with keys:
- "verdict": 2-3 sentences summarising the room's estimated energy use. Always begin with "Based on the appliances detected and your estimated usage". Never claim accuracy.
- "blindSpot": one sentence naming the single appliance the user most likely underestimates, with its approximate share of consumption.
- "recommendations": array of up to 3 objects { "title", "impact" ("High"|"Medium"|"Low"|"Low–Medium"), "body", "changeHint" } — each MUST reference the specific appliances actually detected, with concrete numbers. No generic advice.
- "oneChange": { "title", "body" } — the single strongest recommendation.
- "warnings": array of short carefully-worded possible-energy-waste notes (may be empty).

Costs are in Indonesian Rupiah. Return JSON only.`,
        },
        { role: "user", content: JSON.stringify(payload) },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (res.status === 429) throw new Error("RATE_LIMIT");
  if (res.status === 402) throw new Error("NO_CREDITS");
  if (!res.ok) throw new Error(`AI request failed (${res.status})`);

  const json = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = json.choices?.[0]?.message?.content ?? "{}";
  const cleaned = content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned) as {
    verdict?: string;
    blindSpot?: string;
    recommendations?: { title: string; impact: string; body: string; changeHint?: string }[];
    oneChange?: { title: string; body: string };
    warnings?: string[];
  };
}
