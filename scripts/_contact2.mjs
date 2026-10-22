import sharp from 'sharp';
import path from 'node:path';
const names = ['pexels-room-32657750.jpg', 'pexels-room-776538.jpg', 'pexels-room-14853491.jpg', 'pexels-room-30479386.jpg'];
const cells = [];
for (let i = 0; i < names.length; i += 1) {
  const f = path.join('C:/Users/ramya/AppData/Local/Temp/opencode', names[i]);
  const meta = await sharp(f).metadata();
  const img = await sharp(f).resize(700, 525, { fit: 'cover' }).jpeg({ quality: 88 }).toBuffer();
  cells.push({ input: img, left: (i % 2) * 700, top: Math.floor(i / 2) * 565 });
  const label = Buffer.from(`<svg width="700" height="40"><rect width="100%" height="100%" fill="#1f1713"/><text x="10" y="25" fill="white" font-family="Arial" font-size="16">${names[i]} ${meta.width}x${meta.height}</text></svg>`);
  cells.push({ input: label, left: (i % 2) * 700, top: Math.floor(i / 2) * 565 + 525 });
}
await sharp({ create: { width: 1400, height: 1130, channels: 3, background: '#1f1713' } }).composite(cells).jpeg({ quality: 88 }).toFile('C:/Users/ramya/AppData/Local/Temp/opencode/interiors-sheet.jpg');
