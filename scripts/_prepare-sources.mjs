import { writeFile } from 'node:fs/promises';
import path from 'node:path';

const tmp = 'C:/Users/ramya/AppData/Local/Temp/opencode';

const commons = [
  ['amritsari-paneer-tikka', 'File:Paneer Tikka Masala.jpg', 'Rohitvalecha', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Paneer_Tikka_Masala.jpg'],
  ['lucknowi-galouti-kebab', 'File:Mouth Watering Gauloti Kababs.jpg', 'Fatimahope', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Mouth_Watering_Gauloti_Kababs.jpg'],
  ['dahi-ke-kebab', 'File:Dahi Kebab.jpg', 'Anupam Mondal', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Dahi_Kebab.jpg'],
  ['chettinad-pepper-chicken', 'File:Chicken Chettinad.jpg', 'Thamizhpparithi Maari', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Chicken_Chettinad.jpg'],
  ['samosa-chaat', 'File:Samosa Chat.jpg', 'Darshandkt', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Samosa_Chat.jpg'],
  ['murgh-malai-tikka', 'File:Chicken Malai Tikka.JPG', 'Renupradhul', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Chicken_Malai_Tikka.JPG'],
  ['tandoori-broccoli', 'File:Cerulean Restaurant - 2015-10-15 - Edsel Little 01.jpg', 'Edsel Little', 'CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0/', 'https://commons.wikimedia.org/wiki/File:Cerulean_Restaurant_-_2015-10-15_-_Edsel_Little_01.jpg'],
  ['kashmiri-seekh-kebab', 'File:Seekh Kabab 2.JPG', 'Miansari66', 'CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/', 'https://commons.wikimedia.org/wiki/File:Seekh_Kabab_2.JPG'],
  ['bharwan-aloo', 'File:Stuffed potatoes.jpg', 'Bearas', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Stuffed_potatoes.jpg'],
  ['tandoori-jhinga', 'File:Tandoori Prawns Jhinga.jpg', 'Affaf Ali', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Tandoori_Prawns_Jhinga.jpg'],
  ['sarson-salmon-tikka', 'File:Salmon kebabs.jpg', 'rjp from London, UK', 'CC BY-SA 2.0', 'https://creativecommons.org/licenses/by-sa/2.0/', 'https://commons.wikimedia.org/wiki/File:Salmon_kebabs.jpg'],
  ['malabar-prawn-curry', 'File:Prawn Curry.JPG', 'Ravirajdayal', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Prawn_Curry.JPG'],
  ['tamil-nadu-vegetable-kurma', 'File:Vegetable Kurma India.jpg', 'Divya Kudua', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0/', 'https://commons.wikimedia.org/wiki/File:Vegetable_Kurma_India.jpg'],
  ['hyderabadi-dum-biryani', 'File:Hyderabadi Chicken Biryani.jpg', 'Garrett Ziegler', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0/', 'https://commons.wikimedia.org/wiki/File:Hyderabadi_Chicken_Biryani.jpg'],
  ['awadhi-lamb-biryani', 'File:Mutton Biryani at Idris.JPG', 'Pranaykuma12', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Mutton_Biryani_at_Idris.JPG'],
  ['subz-biryani', 'File:Vegetable Biryani & Pomegranate Raita.jpg', 'Monali.mishra', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Vegetable_Biryani_%26_Pomegranate_Raita.jpg'],
  ['jeera-pulao', 'File:Jeera Rice India.jpg', 'Divya Kudua', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0/', 'https://commons.wikimedia.org/wiki/File:Jeera_Rice_India.jpg'],
  ['laccha-paratha', 'File:Laccha Paratha.JPG', 'Durvankur Patil', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Laccha_Paratha.JPG'],
  ['burnt-onion-raita', 'File:Raita for Thalassery biriyani.jpg', 'Andrea Nguyen', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0/', 'https://commons.wikimedia.org/wiki/File:Raita_for_Thalassery_biriyani.jpg'],
  ['papad-and-pickle', 'File:Dal dhokli.JPG', 'Kanikatwl', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0/', 'https://commons.wikimedia.org/wiki/File:Dal_dhokli.JPG'],
  ['shahi-tukda', 'File:Shahi Tukray (Shahi Tukda).JPG', 'Miansari66', 'CC0 1.0', 'https://creativecommons.org/publicdomain/zero/1.0/', 'https://commons.wikimedia.org/wiki/File:Shahi_Tukray_(Shahi_Tukda).JPG'],
  ['story-spice', 'File:Indian spices for sale at the Anjuna flea-market, Anjuna Beach, Goa.jpg', 'sara marlowe', 'CC BY 2.0', 'https://creativecommons.org/licenses/by/2.0/', 'https://commons.wikimedia.org/wiki/File:Indian_spices_for_sale_at_the_Anjuna_flea-market,_Anjuna_Beach,_Goa.jpg'],
];

const pexels = [
  ['hero-thali', 8148149, 2600, 'Gursher Gill', 'https://www.pexels.com/photo/8148149/'],
  ['visit-room', 32657750, 1800, 'Abhishek Shekhawat', 'https://www.pexels.com/photo/32657750/'],
  ['butter-chicken', 40262820, 1800, 'Mohammad Fahim', 'https://www.pexels.com/photo/delicious-butter-chicken-curry-with-cream-40262820/'],
  ['dal-makhani', 28674557, 1800, 'Kunal Lakhotia', 'https://www.pexels.com/photo/rich-dal-makhani-in-traditional-brass-pan-28674557/'],
  ['paneer-lababdar', 11188417, 1800, 'Harish .P', 'https://www.pexels.com/photo/11188417/'],
  ['paneer-tikka-biryani', 9609859, 1800, 'Prabal Pratap Singh', 'https://www.pexels.com/photo/9609859/'],
  ['garlic-naan', 10337726, 1800, 'Alberta Studios', 'https://www.pexels.com/photo/a-plate-of-a-cheese-garlic-naan-10337726/'],
  ['kesar-pista-kulfi', 36576778, 1800, 'Kunal Lakhotia', 'https://www.pexels.com/photo/delicious-kulfi-ice-cream-with-nuts-and-vermicelli-36576778/'],
  ['mango-cardamom-lassi', 14930476, 1800, 'Shameel Mukkath', 'https://www.pexels.com/photo/mango-lassi-recipe-14930476/'],
  ['nimbu-pudina-soda', 5668200, 1800, 'Denys Gromov', 'https://www.pexels.com/photo/close-up-photo-of-mint-and-lime-cold-drink-5668200/'],
];

const UA = 'SaffronSpicePhotoUpgrade/1.0 (local demo project; contact: demo@example.com)';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJson(url, tries = 4) {
  for (let attempt = 1; attempt <= tries; attempt += 1) {
    const response = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' } });
    if (response.ok) return response.json();
    if (response.status === 429 && attempt < tries) {
      await sleep(3000 * attempt);
      continue;
    }
    throw new Error(`HTTP ${response.status} for ${url}`);
  }
  throw new Error(`Failed ${url}`);
}

const downloads = [];

for (const [slug, title, artist, license, licenseUrl, page] of commons) {
  const api = new URL('https://commons.wikimedia.org/w/api.php');
  api.searchParams.set('action', 'query');
  api.searchParams.set('titles', title);
  api.searchParams.set('prop', 'imageinfo');
  api.searchParams.set('iiprop', 'url|size|mime');
  api.searchParams.set('format', 'json');
  const data = await fetchJson(api);
  const pageData = Object.values(data.query.pages)[0];
  if (!pageData || pageData.missing !== undefined) throw new Error(`Missing Commons file: ${title}`);
  const info = pageData.imageinfo[0];
  const targetWidth = Math.max(400, Math.min(1600, info.width - 1));
  const downloadUrl = `https://commons.wikimedia.org/wiki/Special:Redirect/file/${encodeURIComponent(
    title.replace(/^File:/, ''),
  )}?width=${targetWidth}`;
  downloads.push({
    slug,
    use: slug,
    localPath: path.join(tmp, 'originals', `${slug}.jpg`),
    width: info.width,
    height: info.height,
    source: 'Wikimedia Commons',
    page,
    originalUrl: info.url,
    downloadUrl,
    photographer: artist,
    license,
    licenseUrl,
  });
  console.log(`commons ${slug} ${info.width}x${info.height}`);
  await sleep(700);
}

for (const [slug, id, width, photographer, page] of pexels) {
  const downloadUrl = `https://images.pexels.com/photos/${id}/pexels-photo-${id}.jpeg?auto=compress&cs=tinysrgb&w=${width}`;
  downloads.push({
    slug,
    use: slug,
    localPath: path.join(tmp, 'originals', `${slug}.jpg`),
    width: null,
    height: null,
    source: 'Pexels',
    page,
    originalUrl: `https://www.pexels.com/photo/${id}/`,
    downloadUrl,
    photographer,
    license: 'Pexels License',
    licenseUrl: 'https://www.pexels.com/license/',
    pexelsId: id,
  });
  console.log(`pexels ${slug} id=${id}`);
}

await writeFile(path.join(tmp, 'source-downloads.json'), JSON.stringify(downloads, null, 2));
console.log(`wrote ${downloads.length} download entries`);
