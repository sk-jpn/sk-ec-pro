import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export async function GET() {
  const image = await readFile(join(process.cwd(), "public", "ec", "stay", "og-image.jpg"));

  return new Response(new Uint8Array(image), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "public, max-age=3600, s-maxage=31536000, immutable",
    },
  });
}
