import sharp from 'sharp';
import path from 'node:path';
const tmp = 'C:/Users/ramya/AppData/Local/Temp/opencode';
const items = [
  ['pexels-thali-29148133.jpg', 'hero-29148133', 4, 5, 'centre'],
  ['pexels-thali-8148149.jpg', 'hero-8148149', 4, 5, 'centre'],
  ['photo-candidates/scene-story/candidate-4.jpg', 'story-spice-market', 9, 11, 'centre'],
  ['pexels-room-32657750.jpg', 'visit-32657750', 4, 3, 'centre'],
];
const cellW = 500;
const cellH = 625;
const labelH = 40;
const parts = [];
for (let i = 0; i < items.length; i += 1) {
  const [name, label, aw, ah, position] = items[i];
  const f = path.join(tmp, name);
  const cropH = ah * 100;
  const cropW = aw * 100;
  const buf = await sharp(f).resize(cropW, cropH, { fit: 'cover', position }).jpeg({ quality: 90 }).toBuffer();
  const x = (i % 2) * cellW;
  const y = Math.floor(i / 2) * (cellH + labelH);
  parts.push({ input: buf, left: x, top: y });
  parts.push({
    input: Buffer.from(`<svg width="${cellW}" height="${labelH}"><rect width="100%" height="100%" fill="#1f1713"/><text x="10" y="26" fill="white" font-family="Arial" font-size="16">${label}</text></svg>`),
    left: x,
    top: y + cellH,
  });
}
await sharp({ create: { width: cellW * 2, height: 2 * (cellH + labelH), channels: 3, background: '#1f1713' } })
  .composite(parts)
  .jpeg({ quality: 90 })
  .toFile(path.join(tmp, 'scene-crops.jpg'));
