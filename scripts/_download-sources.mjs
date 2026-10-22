import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const tmp = 'C:/Users/ramya/AppData/Local/Temp/opencode';
const dir = path.join(tmp, 'originals');
await mkdir(dir, { recursive: true });

const downloads = JSON.parse(await readFile(path.join(tmp, 'source-downloads.json'), 'utf8'));
const UA = 'SaffronSpicePhotoUpgrade/1.0 (local demo project; contact: demo@example.com)';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const finalManifest = [];

for (const entry of downloads) {
  const outPath = path.join(dir, `${entry.slug}.jpg`);
  let buffer;
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(entry.downloadUrl, {
        headers: {
          'User-Agent': UA,
          Accept: 'image/jpeg,image/*,*/*',
          Referer: entry.source === 'Wikimedia Commons' ? 'https://commons.wikimedia.org/' : 'https://www.pexels.com/',
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      buffer = Buffer.from(await response.arrayBuffer());
      if (buffer.length < 1000) throw new Error(`Too small: ${buffer.length}`);
      break;
    } catch (error) {
      lastError = error;
      await sleep(1500 * attempt);
    }
  }
  if (!buffer) {
    console.log(`FAILED ${entry.slug}: ${lastError?.message}`);
    continue;
  }
  const meta = await sharp(buffer).metadata();
  await writeFile(outPath, buffer);
  finalManifest.push({
    ...entry,
    localPath: outPath,
    width: meta.width,
    height: meta.height,
    bytes: buffer.length,
  });
  console.log(`ok ${entry.slug} ${meta.width}x${meta.height} ${buffer.length} bytes`);
  await sleep(400);
}

await writeFile(path.join(tmp, 'final-sources.json'), JSON.stringify(finalManifest, null, 2));
console.log(`downloaded ${finalManifest.length}/${downloads.length}`);
