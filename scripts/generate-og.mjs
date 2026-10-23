import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const input = path.join(root, 'client', 'public', 'images', 'hero-thali.webp');
const output = path.join(root, 'client', 'public', 'og-share.jpg');

const overlay = Buffer.from(`
<svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#2b1114" stop-opacity="0.92" />
      <stop offset="0.58" stop-color="#2b1114" stop-opacity="0.55" />
      <stop offset="1" stop-color="#2b1114" stop-opacity="0.08" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#shade)" />
  <rect x="64" y="64" width="1072" height="502" fill="none" stroke="#edc477" stroke-opacity="0.55" stroke-width="1.5" />
  <text x="96" y="148" fill="#edc477" font-family="Arial, sans-serif" font-size="21" letter-spacing="5">SAFFRON &amp; SPICE</text>
  <text x="96" y="268" fill="#fff8ec" font-family="Georgia, 'Times New Roman', serif" font-size="72">Modern Indian</text>
  <text x="96" y="348" fill="#fff8ec" font-family="Georgia, 'Times New Roman', serif" font-size="72" font-style="italic">kitchen.</text>
  <text x="96" y="428" fill="#f4e4c8" font-family="Arial, sans-serif" font-size="26">Slow-cooked classics, delivered warm in Bengaluru.</text>
  <line x1="96" y1="474" x2="432" y2="474" stroke="#bf7611" stroke-width="3" />
</svg>
`);

await sharp(input)
  .resize(1200, 630, { fit: 'cover', position: 'centre' })
  .modulate({ brightness: 0.82, saturation: 0.92 })
  .composite([{ input: overlay }])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(output);

console.log(`[seo] wrote ${path.relative(root, output)} (1200x630)`);
