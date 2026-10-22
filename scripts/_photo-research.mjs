import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { menuItems } from '../server/src/data/menu.js';

const outDir = 'C:/Users/ramya/AppData/Local/Temp/opencode/photo-candidates';
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const queryMap = {
  'amritsari-paneer-tikka': ['Amritsari paneer tikka', 'paneer tikka', 'grilled paneer skewers'],
  'lucknowi-galouti-kebab': ['galouti kebab', 'galawati kebab', 'lucknowi kebab'],
  'dahi-ke-kebab': ['dahi ke kebab', 'dahi kebab', 'yogurt kebab'],
  'chettinad-pepper-chicken': ['chettinad chicken', 'pepper chicken india', 'chettinad pepper chicken'],
  'samosa-chaat': ['samosa chaat', 'samosa chole', 'chaat samosa'],
  'murgh-malai-tikka': ['malai tikka', 'murgh malai tikka', 'creamy chicken tikka'],
  'tandoori-broccoli': ['tandoori broccoli', 'roasted broccoli indian', 'broccoli tikka'],
  'kashmiri-seekh-kebab': ['seekh kebab', 'kashmiri seekh kebab', 'minced lamb kebab'],
  'bharwan-aloo': ['bharwan aloo', 'stuffed potato indian', 'potato stuffed paneer'],
  'tandoori-jhinga': ['tandoori prawns', 'tandoori shrimp', 'grilled prawns india'],
  'sarson-salmon-tikka': ['salmon tikka', 'tandoori salmon', 'grilled salmon indian'],
  'butter-chicken': ['butter chicken', 'murgh makhani', 'chicken makhani'],
  'dal-makhani': ['dal makhani', 'black lentils indian', 'makhani dal'],
  'paneer-lababdar': ['paneer lababdar', 'paneer butter masala', 'paneer curry'],
  'laal-maas': ['laal maas', 'lal maas', 'rajasthani mutton curry'],
  'malabar-prawn-curry': ['malabar prawn curry', 'prawn curry kerala', 'prawn coconut curry'],
  'tamil-nadu-vegetable-kurma': ['vegetable kurma', 'kurma indian', 'vegetable korma'],
  'hyderabadi-dum-biryani': ['hyderabadi biryani', 'dum biryani', 'chicken biryani'],
  'awadhi-lamb-biryani': ['awadhi biryani', 'lamb biryani', 'mutton biryani lucknow'],
  'subz-biryani': ['vegetable biryani', 'subz biryani', 'veg biryani'],
  'paneer-tikka-biryani': ['paneer tikka biryani', 'paneer biryani', 'vegetable biryani paneer'],
  'jeera-pulao': ['jeera rice', 'cumin rice', 'jeera pulao'],
  'garlic-naan': ['garlic naan', 'naan bread', 'tandoori naan'],
  'laccha-paratha': ['laccha paratha', 'lachha paratha', 'layered paratha'],
  'peshawari-naan': ['peshawari naan', 'stuffed naan', 'naan bread'],
  'burnt-onion-raita': ['onion raita', 'raita', 'yogurt raita'],
  'papad-and-pickle': ['papad pickle', 'papad', 'indian papad'],
  'gulab-jamun-cheesecake': ['gulab jamun cheesecake', 'gulab jamun', 'cheesecake'],
  'kesar-pista-kulfi': ['kulfi', 'kesar pista kulfi', 'indian ice cream'],
  'shahi-tukda': ['shahi tukda', 'double ka meetha', 'shahi toast'],
  'mango-cardamom-lassi': ['mango lassi', 'lassi', 'mango yogurt drink'],
  'nimbu-pudina-soda': ['mint lime soda', 'nimbu soda', 'mint lemonade'],
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
  const res = await fetch(url, { headers: { 'user-agent': 'SaffronSpicePhotoResearch/1.0 (local demo)' } });
  if (!res.ok) throw new Error(`Search failed ${res.status}: ${query}`);
  const data = await res.json();
  return Object.values(data.query?.pages || {}).map((page) => {
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
  }).filter(Boolean);
}

const summary = {};
for (const item of menuItems) {
  const queries = queryMap[item.slug] || [item.name];
  const seen = new Set();
  const candidates = [];
  for (const query of queries) {
    let results = [];
    try {
      results = await search(query);
    } catch (error) {
      console.error(item.slug, error.message);
    }
    for (const result of results) {
      if (seen.has(result.title)) continue;
      seen.add(result.title);
      if (!allowedLicense(result.license)) continue;
      if (!result.thumb || !result.artist) continue;
      if (result.width < 900 || result.height < 500) continue;
      if (result.width / result.height > 2.4 || result.width / result.height < 0.5) continue;
      if (/\b(ai[- ]generated|logo|poster|map|book cover|restaurant sign)\b/i.test(`${result.title} ${result.description}`)) continue;
      candidates.push({ ...result, query });
      if (candidates.length >= 5) break;
    }
    if (candidates.length >= 5) break;
  }
  const dishDir = path.join(outDir, item.slug);
  fs.mkdirSync(dishDir, { recursive: true });
  const downloaded = [];
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    try {
      const res = await fetch(candidate.thumb, { headers: { 'user-agent': 'SaffronSpicePhotoResearch/1.0 (local demo)' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buffer = Buffer.from(await res.arrayBuffer());
      const file = path.join(dishDir, `candidate-${i + 1}.jpg`);
      await sharp(buffer).jpeg({ quality: 86 }).toFile(file);
      downloaded.push({ ...candidate, localFile: file });
    } catch (error) {
      console.error(item.slug, 'download', error.message);
    }
  }
  summary[item.slug] = { name: item.name, candidateCount: downloaded.length, candidates: downloaded };
  console.log(`${item.slug}: ${downloaded.length} candidates`);
}

fs.writeFileSync(path.join(outDir, 'candidates.json'), JSON.stringify(summary, null, 2));

const categories = [
  ['Small plates', ['amritsari-paneer-tikka', 'lucknowi-galouti-kebab', 'dahi-ke-kebab', 'chettinad-pepper-chicken', 'samosa-chaat']],
  ['Tandoor', ['murgh-malai-tikka', 'tandoori-broccoli', 'kashmiri-seekh-kebab', 'bharwan-aloo', 'tandoori-jhinga', 'sarson-salmon-tikka']],
  ['Curries', ['butter-chicken', 'dal-makhani', 'paneer-lababdar', 'laal-maas', 'malabar-prawn-curry', 'tamil-nadu-vegetable-kurma']],
  ['Biryani', ['hyderabadi-dum-biryani', 'awadhi-lamb-biryani', 'subz-biryani', 'paneer-tikka-biryani', 'jeera-pulao']],
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
      const candidate = item.candidates[col];
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
        <text x="10" y="21" fill="#f5c978" font-family="Arial" font-size="15" font-weight="bold">${row + 1}.${col + 1}  ${item.name}</text>
        <text x="10" y="43" fill="#ffffff" font-family="Arial" font-size="11">${shortTitle.replace(/[<>&]/g, '')}</text>
        <text x="10" y="61" fill="#c9b8a7" font-family="Arial" font-size="11">${candidate ? candidate.license : ''}</text>
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
