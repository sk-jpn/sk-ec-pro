import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const source = "/tmp/sk-ec-logo/logo-chroma.png";
const output = "public/brand";

const { data, info } = await sharp(source)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let i = 0; i < data.length; i += 4) {
  const red = data[i];
  const green = data[i + 1];
  const blue = data[i + 2];
  const isChromaKey =
    red > 100 &&
    blue > 100 &&
    red > green * 1.35 &&
    blue > green * 1.35;

  if (isChromaKey) {
    data[i] = 0;
    data[i + 1] = 0;
    data[i + 2] = 0;
    data[i + 3] = 0;
  }
}

const master = await sharp(data, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .resize({ width: 1200, withoutEnlargement: true })
  .png()
  .toBuffer();

await sharp(master).toFile(`${output}/sk-ec-pro-logo.png`);

const masterMeta = await sharp(master).metadata();
const markHeight = Math.round((masterMeta.height ?? 800) * 0.58);
const mark = await sharp(master)
  .extract({ left: 0, top: 0, width: masterMeta.width ?? 1200, height: markHeight })
  .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .png()
  .toBuffer();

async function squareIcon(size, path) {
  const inset = Math.round(size * 0.14);
  const resized = await sharp(mark)
    .resize(size - inset * 2, size - inset * 2, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: "#ffffff" },
  })
    .composite([{ input: resized, gravity: "center" }])
    .png()
    .toFile(path);
}

await squareIcon(512, `${output}/icon-512.png`);
await squareIcon(180, `${output}/apple-touch-icon.png`);
await squareIcon(64, `${output}/favicon.png`);
await squareIcon(512, "app/icon.png");
await squareIcon(180, "app/apple-icon.png");

const ogLogo = await sharp(master)
  .resize({
    width: 720,
    height: 460,
    fit: "contain",
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  })
  .png()
  .toBuffer();

await sharp({
  create: { width: 1200, height: 630, channels: 4, background: "#f8fbff" },
})
  .composite([{ input: ogLogo, gravity: "center" }])
  .png()
  .toFile(`${output}/og.png`);

await sharp(`${output}/og.png`).toFile("app/opengraph-image.png");

const favicon = await readFile(`${output}/favicon.png`);
const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
icoHeader.writeUInt8(64, 6);
icoHeader.writeUInt8(64, 7);
icoHeader.writeUInt8(0, 8);
icoHeader.writeUInt8(0, 9);
icoHeader.writeUInt16LE(1, 10);
icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(favicon.length, 14);
icoHeader.writeUInt32LE(22, 18);
await writeFile("app/favicon.ico", Buffer.concat([icoHeader, favicon]));
