import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const outDir = 'C:/Users/ramya/AppData/Local/Temp/opencode/photo-candidates';
const dataPath = path.join(outDir, 'scene-candidates.json');
const allowedLicense = (license = '') =>
  /^CC0\b/i.test(license) ||
  /^CC BY(?:-SA)?(?: \d+(?:\.\d+)?(?:,.*)?)?$/i.test(license.trim());

const stripHtml = (value = '') =>
  value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();

const groups = {
  'scene-hero': {
    name: 'Hero scene',
    queries: ['Indian thali', 'Indian food spread', 'Indian food table', 'thali', 'Indian meal'],
    minWidth: 1400,
    minHeight: 900,
  },
  'scene-story': {
    name: 'Spice story scene',
    queries: ['Indian spices', 'spices market India', 'spice bowls', 'turmeric spices', 'Indian spice shop'],
    minWidth: 1000,
    minHeight: 700,
  },
  'scene-visit': {
    name: 'Dining room scene',
    queries: ['Indian restaurant interior', 'restaurant interior India', 'restaurant dining room', 'Indian restaurant dining', 'warm restaurant interior'],
    minWidth: 1400,
    minHeight: 900,
  },
  'laal-maas-extra': {
    name: 'Laal Maas extra',
    queries: ['laal maas mutton', 'lal maas rajasthan', 'rajasthani mutton', 'mutton curry red', 'laal maas recipe'],
    minWidth: 800,
    minHeight: 500,
  },
  'bharwan-aloo-extra': {
    name: 'Bharwan Aloo extra',
    queries: ['bharwa aloo', 'stuffed potatoes', 'stuffed aloo', 'aloo stuffing', 'potato curry whole'],
    minWidth: 800,
    minHeight: 500,
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function request(url, attempt = 1) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'SaffronSpicePhotoResearch/1.0 (local demo)' },
  });
  if (res.status === 429 && attempt <= 5) {
    await sleep(attempt * 5000);
    return request(url, attempt + 1);
  }
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res;
}

async function search(query) {
  const url = new URL('https://commons.wikimedia.org/w/api.php');
  url.search = new URLSearchParams({
    action: 'query',
    format: 'json',
    generator: 'search',
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: '6',
    gsrlimit: '15',
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '1000',
  });
  const res = await request(url.toString());
  const data = await res.json();
  return Object.values(data.query?.pages || {})
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info) return null;
      const meta = info.extmetadata || {};
      return {
        title: page.title,
        page: info.descriptionurl,
        license: stripHtml(meta.LicenseShortName?.value || ''),
        licenseUrl: stripHtml(meta.LicenseUrl?.value || ''),
        artist: stripHtml(meta.Artist?.value || ''),
        credit: stripHtml(meta.Credit?.value || ''),
        description: stripHtml(meta.ImageDescription?.value || ''),
        width: info.width,
        height: info.height,
        thumb: (info.thumburl || '').split('?')[0],
        original: info.url,
      };
    })
    .filter(Boolean);
}

const summary = fs.existsSync(dataPath) ? JSON.parse(fs.readFileSync(dataPath, 'utf8')) : {};
for (const [slug, group] of Object.entries(groups)) {
  if (summary[slug]?.candidates?.length) continue;
  const seen = new Set();
  const candidates = [];
  for (const query of group.queries) {
    let results = [];
    try {
      results = await search(query);
    } catch (error) {
      console.error(error.message);
    }
    for (const result of results) {
      if (seen.has(result.title)) continue;
      seen.add(result.title);
      if (!allowedLicense(result.license)) continue;
      if (!result.thumb || !result.artist) continue;
      if (result.width < group.minWidth || result.height < group.minHeight) continue;
      if (result.width / result.height > 2.6 || result.width / result.height < 0.55) continue;
      if (/\b(ai[- ]generated|logo|poster|map|book|menu|portrait|people)\b/i.test(`${result.title} ${result.description}`)) continue;
      candidates.push({ ...result, query });
      if (candidates.length >= 5) break;
    }
    if (candidates.length >= 5) break;
    await sleep(1800);
  }
  const dir = path.join(outDir, slug);
  fs.mkdirSync(dir, { recursive: true });
  const downloaded = [];
  for (let i = 0; i < candidates.length; i += 1) {
    try {
      const res = await request(candidates[i].thumb);
      const buffer = Buffer.from(await res.arrayBuffer());
      const file = path.join(dir, `candidate-${i + 1}.jpg`);
      await sharp(buffer).jpeg({ quality: 88 }).toFile(file);
      downloaded.push({ ...candidates[i], localFile: file });
    } catch (error) {
      console.error(slug, i + 1, error.message);
    }
    await sleep(500);
  }
  summary[slug] = { name: group.name, candidates: downloaded };
  fs.writeFileSync(dataPath, JSON.stringify(summary, null, 2));
  console.log(slug, downloaded.length);
  await sleep(1200);
}

function escapeXml(value = '') {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
const cellW = 380;
const cellH = 285;
const labelH = 72;
const slugs = Object.keys(groups);
const parts = [];
for (let row = 0; row < slugs.length; row += 1) {
  const slug = slugs[row];
  for (let col = 0; col < 5; col += 1) {
    const candidate = summary[slug]?.candidates?.[col];
    const x = col * cellW;
    const y = row * (cellH + labelH);
    let image = sharp({ create: { width: cellW, height: cellH, channels: 3, background: '#eee8dd' } });
    if (candidate) {
      const resized = await sharp(candidate.localFile)
        .resize(cellW, cellH, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 86 })
        .toBuffer();
      image = sharp(resized);
    }
    parts.push({ input: await image.png().toBuffer(), left: x, top: y });
    const title = candidate ? candidate.title.replace(/^File:/, '').replace(/\.[^.]+$/, '').slice(0, 50) : 'NO CANDIDATE';
    const label = `<svg width="${cellW}" height="${labelH}">
      <rect width="100%" height="100%" fill="#1f1713"/>
      <text x="10" y="21" fill="#f5c978" font-family="Arial" font-size="15" font-weight="bold">${escapeXml(`${row + 1}.${col + 1}  ${groups[slug].name}`)}</text>
      <text x="10" y="43" fill="#ffffff" font-family="Arial" font-size="11">${escapeXml(title)}</text>
      <text x="10" y="61" fill="#c9b8a7" font-family="Arial" font-size="11">${escapeXml(candidate?.license || '')} ${candidate ? `${candidate.width}x${candidate.height}` : ''}</text>
    </svg>`;
    parts.push({ input: Buffer.from(label), left: x, top: y + cellH });
  }
}
const sheetPath = path.join(outDir, 'scenes-sheet.jpg');
await sharp({ create: { width: cellW * 5, height: slugs.length * (cellH + labelH), channels: 3, background: '#1f1713' } })
  .composite(parts)
  .jpeg({ quality: 88 })
  .toFile(sheetPath);
console.log('Wrote', sheetPath);
