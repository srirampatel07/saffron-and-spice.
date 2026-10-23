import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const imageDir = path.join(root, 'client', 'public', 'images');

const variants = {
  'hero-thali': [640, 800, 1120],
  'story-spice': [480, 720],
  'visit-room': [640, 960],
};

let written = 0;
for (const [name, widths] of Object.entries(variants)) {
  const input = path.join(imageDir, `${name}.webp`);
  if (!fs.existsSync(input)) throw new Error(`Missing source image: ${input}`);
  const metadata = await sharp(input).metadata();
  for (const width of widths) {
    if (width >= metadata.width) continue;
    const output = path.join(imageDir, `${name}-${width}.webp`);
    const info = await sharp(input).resize({ width, withoutEnlargement: true }).webp({ quality: 68, effort: 6 }).toFile(output);
    console.log(`[images] ${path.basename(output)} ${info.width}x${info.height} ${(info.size / 1024).toFixed(0)} KiB`);
    written += 1;
  }
}
console.log(`[images] wrote ${written} responsive variants.`);
