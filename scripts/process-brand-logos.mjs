import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const sourceDirectory = path.join(process.cwd(), "public", "logos", "Brands.Logo");
const outputDirectory = path.join(process.cwd(), "public", "logos", "brands");

const logos = [
  ["Al Fakher.png", "al-fakher"],
  ["dr vape.png", "dr-vapes"],
  ["Geek vape.png", "geekvape"],
  ["ivg.png", "ivg"],
  ["lost.jpg", "lostvape"],
  ["nasty.png", "nasty"],
  ["nexa.png", "nexa"],
  ["oxbar.png", "oxbar"],
  ["pod_salt.png", "pod-salt"],
  ["ripe vape.png", "ripe-vapes"],
  ["smok.png", "smok"],
  ["uwell.png", "uwell"],
  ["vaporesso.png", "vaporesso"],
  ["VGOD.png", "vgod", "dark-on-light"],
  ["voopoo.png", "voopoo"],
  ["vozol.webp", "vozol"],
  ["waka.webp", "waka"],
];

function clamp(value) {
  return Math.max(0, Math.min(255, value));
}

function cornerBackground(data, width, height) {
  const samples = [];
  const sampleSize = Math.max(2, Math.min(12, Math.floor(Math.min(width, height) / 30)));
  const corners = [
    [0, 0],
    [width - sampleSize, 0],
    [0, height - sampleSize],
    [width - sampleSize, height - sampleSize],
  ];

  for (const [startX, startY] of corners) {
    for (let y = startY; y < startY + sampleSize; y += 1) {
      for (let x = startX; x < startX + sampleSize; x += 1) {
        const offset = (y * width + x) * 4;
        samples.push([data[offset], data[offset + 1], data[offset + 2], data[offset + 3]]);
      }
    }
  }

  const transparentRatio = samples.filter((sample) => sample[3] < 32).length / samples.length;
  const opaque = samples.filter((sample) => sample[3] > 192);
  const average = opaque.length
    ? opaque.reduce(
        (result, sample) => result.map((value, index) => value + sample[index] / opaque.length),
        [0, 0, 0, 0],
      )
    : [0, 0, 0, 0];

  return { transparentRatio, color: average };
}

async function createWhiteLogo(sourceName, slug, mode = "auto") {
  const source = await readFile(path.join(sourceDirectory, sourceName));
  const { data, info } = await sharp(source)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const background = cornerBackground(data, info.width, info.height);
  const output = Buffer.alloc(info.width * info.height * 4);
  const useExistingAlpha = background.transparentRatio > 0.35;

  for (let offset = 0; offset < data.length; offset += 4) {
    const sourceAlpha = data[offset + 3];
    let alpha = sourceAlpha;

    if (mode === "dark-on-light") {
      const luminance = data[offset] * 0.2126 + data[offset + 1] * 0.7152 + data[offset + 2] * 0.0722;
      alpha = Math.round((clamp((205 - luminance) * 4) * sourceAlpha) / 255);
    } else if (!useExistingAlpha) {
      const red = data[offset] - background.color[0];
      const green = data[offset + 1] - background.color[1];
      const blue = data[offset + 2] - background.color[2];
      const distance = Math.sqrt(red * red + green * green + blue * blue);
      alpha = Math.round((clamp((distance - 4) * 7) * sourceAlpha) / 255);
    }

    output[offset] = 255;
    output[offset + 1] = 255;
    output[offset + 2] = 255;
    output[offset + 3] = alpha;
  }

  await sharp(output, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 }, threshold: 4 })
    .resize(480, 132, { fit: "inside", withoutEnlargement: false })
    .webp({ lossless: true, effort: 6 })
    .toFile(path.join(outputDirectory, `${slug}.webp`));
}

await mkdir(outputDirectory, { recursive: true });
await Promise.all(logos.map(([sourceName, slug, mode]) => createWhiteLogo(sourceName, slug, mode)));
console.log(`Processed ${logos.length} brand logos into ${outputDirectory}`);
