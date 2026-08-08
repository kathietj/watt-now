import { createServerFn } from "@tanstack/react-start";

export const analyzeRoom = createServerFn({ method: "POST" })
  .inputValidator((input: { image: string; hint?: string }) => {
    if (!input?.image?.startsWith("data:image/")) throw new Error("A captured image is required");
    return { image: input.image, hint: input.hint ?? "" };
  })
  .handler(async ({ data }) => {
    const { analyzeRoomImage } = await import("./analysis.server");
    return analyzeRoomImage(data.image, data.hint);
  });

export const coachRoom = createServerFn({ method: "POST" })
  .inputValidator((input: { summary: unknown }) => input)
  .handler(async ({ data }) => {
    const { generateCoaching } = await import("./analysis.server");
    return generateCoaching(data.summary);
  });
