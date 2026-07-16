export const ESTIMATE_IMAGE_BUCKET = "estimate-images";
export const MAX_IMAGES_PER_PRODUCT = 1;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

type AcceptedImageType = typeof ACCEPTED_IMAGE_TYPES[number];

function detectedType(bytes: Uint8Array): AcceptedImageType | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 && bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) return "image/png";
  const riff = String.fromCharCode(...bytes.slice(0, 4)) === "RIFF";
  const webp = String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return riff && webp ? "image/webp" : null;
}

export async function validateEstimateImage(file: File) {
  if (file.size < 12 || file.size > MAX_IMAGE_BYTES) throw new Error("画像は1枚10MB以内にしてください。");
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type as AcceptedImageType)) throw new Error("jpg・jpeg・png・webp形式の画像を選択してください。");
  const buffer = new Uint8Array(await file.arrayBuffer());
  const type = detectedType(buffer);
  if (!type || type !== file.type) throw new Error("画像ファイルの形式を確認できませんでした。");
  return { buffer, mimeType: type, extension: type === "image/jpeg" ? "jpg" : type === "image/png" ? "png" : "webp" };
}
