import sharp from 'sharp';
import path from 'node:path';

const dir = 'C:/Users/ramya/AppData/Local/Temp/opencode';
const names = process.argv.slice(2);
const cellW = 620;
const cellH = 465;
const labelH = 36;
const cols = names.length > 4 ? 3 : 2;
const rows = Math.ceil(names.length / cols);
const cells = [];
for (let i = 0; i < names.length; i += 1) {
  const f = path.isAbsolute(names[i]) ? names[i] : path.join(dir, names[i]);
  const meta = await sharp(f).metadata();
  const img = await sharp(f).resize(cellW, cellH, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();
  const x = (i % cols) * cellW;
  const y = Math.floor(i / cols) * (cellH + labelH);
  cells.push({ input: img, left: x, top: y });
  const label = Buffer.from(
    `<svg width="${cellW}" height="${labelH}"><rect width="100%" height="100%" fill="#1f1713"/><text x="10" y="24" fill="white" font-family="Arial" font-size="15">${path.basename(names[i])} ${meta.width}x${meta.height}</text></svg>`,
  );
  cells.push({ input: label, left: x, top: y + cellH });
}
await sharp({ create: { width: cols * cellW, height: rows * (cellH + labelH), channels: 3, background: '#1f1713' } })
  .composite(cells)
  .jpeg({ quality: 88 })
  .toFile(path.join(dir, 'contact-args.jpg'));
console.log(path.join(dir, 'contact-args.jpg'));
