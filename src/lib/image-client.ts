/** Browser-only image helpers used before sending a still frame to the AI backend. */

export async function fileToDataUrl(file: File): Promise<string> {
  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });
}

/**
 * Resizes large phone photos before a server-function request.
 * This prevents 413/body-size errors and makes AI vision calls faster/cheaper.
 */
export async function prepareImageForAnalysis(
  dataUrl: string,
  maxDimension = 1280,
  quality = 0.82,
): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();

  const largest = Math.max(img.naturalWidth, img.naturalHeight);
  if (!largest) throw new Error("Image dimensions are unavailable.");
  const scale = Math.min(1, maxDimension / largest);
  const width = Math.max(1, Math.round(img.naturalWidth * scale));
  const height = Math.max(1, Math.round(img.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is unavailable in this browser.");
  ctx.drawImage(img, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}
