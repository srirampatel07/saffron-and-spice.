import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { menuItems } from '../server/src/data/menu.js';

const outDir = 'C:/Users/ramya/AppData/Local/Temp/opencode/photo-candidates';
const dataPath = path.join(outDir, 'candidates.json');
const summary = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const missingQueries = {
  'kashmiri-seekh-kebab': ['seekh kebab', 'mutton seekh kebab', 'lamb seekh kebab'],
  'bharwan-aloo': ['bharwan aloo', 'stuffed aloo', 'stuffed potato'],
  'tandoori-jhinga': ['tandoori prawns', 'tandoori shrimp', 'grilled shrimp'],
  'sarson-salmon-tikka': ['salmon tikka', 'tandoori salmon', 'salmon kebab'],
  'butter-chicken': ['butter chicken', 'murgh makhani', 'chicken makhani'],
  'dal-makhani': ['dal makhani', 'black lentils', 'lentil curry'],
  'laal-maas': ['laal maas', 'lal maas', 'rajasthani laal maas', 'rajasthani mutton curry'],
  'subz-biryani': ['vegetable biryani', 'veg biryani', 'vegetable dum biryani'],
  'paneer-tikka-biryani': ['paneer biryani', 'paneer tikka biryani', 'paneer rice'],
  'jeera-pulao': ['jeera rice', 'cumin rice', 'jeera pulao'],
  'garlic-naan': ['garlic naan', 'naan bread', 'naan'],
  'laccha-paratha': ['laccha paratha', 'lachha paratha', 'paratha'],
  'peshawari-naan': ['peshawari naan', 'stuffed naan', 'naan bread'],
  'burnt-onion-raita': ['onion raita', 'raita', 'yogurt raita'],
  'papad-and-pickle': ['papad pickle', 'papad', 'pickle papad'],
  'gulab-jamun-cheesecake': ['gulab jamun cheesecake', 'gulab jamun', 'cheesecake'],
  'kesar-pista-kulfi': ['kulfi', 'kesar pista kulfi', 'pistachio kulfi'],
  'shahi-tukda': ['shahi tukda', 'shahi tukra', 'double ka meetha'],
  'mango-cardamom-lassi': ['mango lassi', 'lassi', 'mango yogurt drink'],
  'nimbu-pudina-soda': ['mint lime soda', 'lemon soda india', 'nimbu pani'],
};

const allowedLicense = (license = '') =>
  /^CC0\b/i.test(license) ||
  /^CC BY(?:-SA)?(?: \d+(?:\.\d+)?(?:,.*)?)?$/i.test(license.trim());

function stripHtml(value = '') {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url, attempt = 1) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'SaffronSpicePhotoResearch/1.0 (local demo; contact: local)',
    },
  });
  if (res.status === 429 && attempt <= 5) {
    const wait = attempt * 4000;
    console.log(`  rate limited; retrying in ${wait / 1000}s`);
    await sleep(wait);
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
    gsrlimit: '12',
    prop: 'imageinfo',
    iiprop: 'url|size|mime|extmetadata',
    iiurlwidth: '700',
  });
  const res = await request(url.toString());
  const data = await res.json();
  return Object.values(data.query?.pages || {})
    .map((page) => {
      const info = page.imageinfo?.[0];
      if (!info) return null;
      const meta = info.extmetadata || {};
      const license = stripHtml(meta.LicenseShortName?.value || '');
      const description = stripHtml(meta.ImageDescription?.value || '');
      return {
        title: page.title,
        page: info.descriptionurl,
        license,
        licenseUrl: stripHtml(meta.LicenseUrl?.value || ''),
        artist: stripHtml(meta.Artist?.value || ''),
        credit: stripHtml(meta.Credit?.value || ''),
        description,
        width: info.width,
        height: info.height,
        mime: info.mime,
        thumb: (info.thumburl || '').split('?')[0],
        original: info.url,
      };
    })
    .filter(Boolean);
}

for (const [slug, queries] of Object.entries(missingQueries)) {
  if (summary[slug]?.candidateCount > 0) {
    console.log(`${slug}: already has candidates, skipping`);
    continue;
  }
  const item = menuItems.find((entry) => entry.slug === slug);
  if (!item) {
    console.error(`Unknown slug ${slug}`);
    continue;
  }
  const seen = new Set();
  const candidates = [];
  for (const query of queries) {
    console.log(`${slug}: searching "${query}"`);
    let results = [];
    try {
      results = await search(query);
    } catch (error) {
      console.error(`  ${error.message}`);
    }
    for (const result of results) {
      if (seen.has(result.title)) continue;
      seen.add(result.title);
      if (!allowedLicense(result.license)) continue;
      if (!result.thumb || !result.artist) continue;
      if (result.width < 800 || result.height < 450) continue;
      if (result.width / result.height > 2.6 || result.width / result.height < 0.45) continue;
      if (/\b(ai[- ]generated|logo|poster|map|book cover|restaurant sign|menu)\b/i.test(`${result.title} ${result.description}`)) continue;
      candidates.push({ ...result, query });
      if (candidates.length >= 5) break;
    }
    if (candidates.length >= 5) break;
    await sleep(1800);
  }
  const dishDir = path.join(outDir, slug);
  fs.mkdirSync(dishDir, { recursive: true });
  const downloaded = [];
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    try {
      const res = await request(candidate.thumb);
      const buffer = Buffer.from(await res.arrayBuffer());
      const file = path.join(dishDir, `candidate-${i + 1}.jpg`);
      await sharp(buffer).jpeg({ quality: 86 }).toFile(file);
      downloaded.push({ ...candidate, localFile: file });
    } catch (error) {
      console.error(`  download ${i + 1}: ${error.message}`);
    }
    await sleep(400);
  }
  summary[slug] = { name: item.name, candidateCount: downloaded.length, candidates: downloaded };
  fs.writeFileSync(dataPath, JSON.stringify(summary, null, 2));
  console.log(`${slug}: ${downloaded.length} candidates`);
  await sleep(1200);
}

function escapeXml(value = '') {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const categories = [
  ['Tandoor rest', ['kashmiri-seekh-kebab', 'bharwan-aloo', 'tandoori-jhinga', 'sarson-salmon-tikka']],
  ['Curries rest', ['butter-chicken', 'dal-makhani', 'laal-maas']],
  ['Biryani rest', ['subz-biryani', 'paneer-tikka-biryani', 'jeera-pulao']],
  ['Breads', ['garlic-naan', 'laccha-paratha', 'peshawari-naan', 'burnt-onion-raita', 'papad-and-pickle']],
  ['Desserts', ['gulab-jamun-cheesecake', 'kesar-pista-kulfi', 'shahi-tukda', 'mango-cardamom-lassi', 'nimbu-pudina-soda']],
];

const cellW = 380;
const cellH = 285;
const labelH = 72;
const gridW = cellW * 5;
for (const [categoryName, slugs] of categories) {
  const parts = [];
  for (let row = 0; row < slugs.length; row += 1) {
    const slug = slugs[row];
    const item = summary[slug];
    for (let col = 0; col < 5; col += 1) {
      const candidate = item?.candidates?.[col];
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
      const shortTitle = candidate
        ? candidate.title.replace(/^File:/, '').replace(/\.[^.]+$/, '').slice(0, 48)
        : 'NO CANDIDATE';
      const label = `<svg width="${cellW}" height="${labelH}">
        <rect width="100%" height="100%" fill="#1f1713"/>
        <text x="10" y="21" fill="#f5c978" font-family="Arial" font-size="15" font-weight="bold">${escapeXml(`${row + 1}.${col + 1}  ${item?.name || slug}`)}</text>
        <text x="10" y="43" fill="#ffffff" font-family="Arial" font-size="11">${escapeXml(shortTitle)}</text>
        <text x="10" y="61" fill="#c9b8a7" font-family="Arial" font-size="11">${escapeXml(candidate?.license || '')}</text>
      </svg>`;
      parts.push({ input: Buffer.from(label), left: x, top: y + cellH });
    }
  }
  const height = slugs.length * (cellH + labelH);
  const sheetPath = path.join(outDir, `${categoryName.toLowerCase().replace(/\s+/g, '-')}-sheet.jpg`);
  await sharp({ create: { width: gridW, height, channels: 3, background: '#1f1713' } })
    .composite(parts)
    .jpeg({ quality: 88 })
    .toFile(sheetPath);
  console.log('Wrote', sheetPath);
}

fs.writeFileSync(dataPath, JSON.stringify(summary, null, 2));
