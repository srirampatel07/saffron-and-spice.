import sharp from 'sharp';
import path from 'node:path';

const names = [
  'pexels-thali-29148133.jpg',
  'pexels-thali-8148149.jpg',
  'pexels-indian-meal-34080434.jpg',
  'pexels-sadya-5410418.jpg',
  'pexels-spices-618491.jpg',
  'pexels-thali-36388454.jpg',
];
const cells = [];
for (let i = 0; i < names.length; i += 1) {
  const f = path.join('C:/Users/ramya/AppData/Local/Temp/opencode', names[i]);
  const meta = await sharp(f).metadata();
  const img = await sharp(f).resize(620, 465, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();
  cells.push({ input: img, left: (i % 3) * 620, top: Math.floor(i / 3) * 505 });
  const label = Buffer.from(
    `<svg width="620" height="40"><rect width="100%" height="100%" fill="#1f1713"/><text x="10" y="25" fill="white" font-family="Arial" font-size="16">${names[i]}  ${meta.width}x${meta.height}</text></svg>`,
  );
  cells.push({ input: label, left: (i % 3) * 620, top: Math.floor(i / 3) * 505 + 465 });
}
await sharp({ create: { width: 1860, height: 1010, channels: 3, background: '#1f1713' } })
  .composite(cells)
  .jpeg({ quality: 88 })
  .toFile('C:/Users/ramya/AppData/Local/Temp/opencode/pexels-scenes-sheet.jpg');
