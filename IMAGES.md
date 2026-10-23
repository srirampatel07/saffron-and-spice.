# Image inventory

**Status: final.** The storefront now uses local, licensed food photography for the dishes and editorial scenes, with the original generated SVGs retained as graceful fallbacks.

## Summary

- **32 photographs:** 29 dish photos and 3 editorial scenes, all local WebP files.
- **29 dish photos** are 800 × 600 (4:3), quality 78, and under 150 KB each.
- **Hero** is 1920 × 2400 (4:5), quality 28, and 343,142 B — under the 350 KB target.
- **Story** is 900 × 1100; **visit** is 1200 × 900.
- **3 dishes remain illustrated:** Laal Maas, Peshawari Naan and Gulab Jamun Cheesecake. Reasons are listed below.
- **35 SVG illustrations** remain in `client/public/images/` as error fallbacks.
- **No image is hotlinked.** Every photograph is served from this workspace.

**Responsive derivatives:** `npm run generate:responsive` writes compressed variants for the hero (`640/800/1120`), story (`480/720`), and visit (`640/960`) scenes. They are performance derivatives of the three source scene photos, not additional photographs; the counts and weights below describe the source set.

### Weight

| Measure | Bytes |
| --- | ---: |
| Original SVG set (35 files) | 752,845 |
| Final WebP photos (32 files) | 25,04,682 |
| Retained SVG fallbacks (35 files) | 7,52,845 |
| Total on disk (photos + fallbacks) | 32,57,527 |
| Dish photos only (29 files) | 17,83,486 |
| Scenes only (3 files) | 7,21,196 |

The comparison is not page-for-page: the original SVGs were small illustrations, while the photos carry substantially more detail. The deployed folder now includes both the photo set and the fallback SVGs. The page loads the WebP first; a missing or corrupt photo swaps to its SVG without a broken-image icon or retry loop.

## How the assets fit together

| Group | Files | Size | Where it appears |
| --- | --- | --- | --- |
| Dish photos | 29 WebP + 29 SVG fallbacks | 800 × 600 | Menu cards, homepage chef's picks, cart thumbnails, checkout summary, receipts |
| Editorial scenes | 3 WebP + 3 SVG fallbacks | 1920 × 2400, 900 × 1100, 1200 × 900 | Homepage hero, kitchen story, visit section; story also appears on tracking |
| Illustrated dishes | 3 SVG | 960 × 720 | Laal Maas, Peshawari Naan, Gulab Jamun Cheesecake |

The menu catalogue paths live in `server/src/data/menu.js`. The client uses the shared `SafeImage` component, which attempts a WebP and falls back to the matching SVG if the image fails. Dish cards use `loading="lazy"` and `decoding="async"`; the hero is eager with high fetch priority; story and visit images are lazy.

## Editorial scenes

| File | Status | Dimensions | Size | Used on | Notes |
| --- | --- | --- | ---: | --- | --- |
| `story-spice.webp` | Photo (WebP) | 900 × 1100 | 1,92,238 B | Homepage story; tracking page | Wikimedia Commons; sara marlowe. `.svg` fallback retained. |
| `visit-room.webp` | Photo (WebP) | 1200 × 900 | 1,85,816 B | Homepage visit section | Pexels; Abhishek Shekhawat. `.svg` fallback retained. |
| `hero-thali.webp` | Photo (WebP) | 1920 × 2400 | 3,43,142 B | Homepage hero | Pexels; Gursher Gill. `.svg` fallback retained. |

## Dish photography

| File | Dish | Status | Dimensions | Size | Match note / fallback |
| --- | --- | --- | --- | ---: | --- |
| `dish-amritsari-paneer-tikka.webp` | Amritsari Paneer Tikka | Photo (WebP) | 800 × 600 | 34,054 B | Commons file is titled “Paneer Tikka Masala”; visually a close paneer tikka match. `.svg` fallback retained. |
| `dish-lucknowi-galouti-kebab.webp` | Lucknowi Galouti Kebab | Photo (WebP) | 800 × 600 | 65,260 B | Direct dish match. `.svg` fallback retained. |
| `dish-dahi-ke-kebab.webp` | Dahi Ke Kebab | Photo (WebP) | 800 × 600 | 62,970 B | Direct dish match. `.svg` fallback retained. |
| `dish-chettinad-pepper-chicken.webp` | Chettinad Pepper Chicken | Photo (WebP) | 800 × 600 | 1,12,614 B | Direct dish match. `.svg` fallback retained. |
| `dish-samosa-chaat.webp` | Samosa Chaat | Photo (WebP) | 800 × 600 | 46,942 B | Crop removes a hand and napkin from the edge of the original Commons photo. `.svg` fallback retained. |
| `dish-murgh-malai-tikka.webp` | Murgh Malai Tikka | Photo (WebP) | 800 × 600 | 49,140 B | Direct dish match. `.svg` fallback retained. |
| `dish-tandoori-broccoli.webp` | Tandoori Broccoli | Photo (WebP) | 800 × 600 | 94,584 B | Commons restaurant-set photo; crop keeps the focus on the charred broccoli with no visible branding. `.svg` fallback retained. |
| `dish-kashmiri-seekh-kebab.webp` | Kashmiri Seekh Kebab | Photo (WebP) | 800 × 600 | 1,35,168 B | Commons file is a generic seekh kebab; close regional match. `.svg` fallback retained. |
| `dish-bharwan-aloo.webp` | Bharwan Aloo | Photo (WebP) | 800 × 600 | 97,866 B | Direct dish match. `.svg` fallback retained. |
| `dish-tandoori-jhinga.webp` | Tandoori Jhinga | Photo (WebP) | 800 × 600 | 32,030 B | Direct dish match. `.svg` fallback retained. |
| `dish-sarson-salmon-tikka.webp` | Sarson Salmon Tikka | Photo (WebP) | 800 × 600 | 1,26,806 B | Commons file is titled “Salmon kebabs”; crop removes a hand at the edge. `.svg` fallback retained. |
| `dish-butter-chicken.webp` | Butter Chicken | Photo (WebP) | 800 × 600 | 43,260 B | Direct dish match. `.svg` fallback retained. |
| `dish-dal-makhani.webp` | Dal Makhani | Photo (WebP) | 800 × 600 | 15,814 B | Direct dish match. `.svg` fallback retained. |
| `dish-paneer-lababdar.webp` | Paneer Lababdar | Photo (WebP) | 800 × 600 | 35,288 B | Pexels photo is titled paneer butter masala; visually a close paneer-in-tomato gravy match. `.svg` fallback retained. |
| `dish-malabar-prawn-curry.webp` | Malabar Prawn Curry | Photo (WebP) | 800 × 600 | 33,916 B | Commons file is a generic prawn curry; close coastal curry match. `.svg` fallback retained. |
| `dish-tamil-nadu-vegetable-kurma.webp` | Tamil Nadu Vegetable Kurma | Photo (WebP) | 800 × 600 | 67,754 B | Direct dish match. `.svg` fallback retained. |
| `dish-hyderabadi-dum-biryani.webp` | Hyderabadi Dum Biryani | Photo (WebP) | 800 × 600 | 92,410 B | Direct dish match. `.svg` fallback retained. |
| `dish-awadhi-lamb-biryani.webp` | Awadhi Lamb Biryani | Photo (WebP) | 800 × 600 | 49,116 B | Direct dish match. `.svg` fallback retained. |
| `dish-subz-biryani.webp` | Subz Biryani | Photo (WebP) | 800 × 600 | 58,216 B | Direct dish match. `.svg` fallback retained. |
| `dish-paneer-tikka-biryani.webp` | Paneer Tikka Biryani | Photo (WebP) | 800 × 600 | 58,754 B | Direct dish match. `.svg` fallback retained. |
| `dish-jeera-pulao.webp` | Jeera Pulao | Photo (WebP) | 800 × 600 | 51,598 B | Direct dish match. `.svg` fallback retained. |
| `dish-garlic-naan.webp` | Garlic Naan | Photo (WebP) | 800 × 600 | 71,906 B | Pexels file is titled cheese garlic naan; visually reads as garlic naan. `.svg` fallback retained. |
| `dish-laccha-paratha.webp` | Laccha Paratha | Photo (WebP) | 800 × 600 | 30,016 B | Direct dish match. `.svg` fallback retained. |
| `dish-burnt-onion-raita.webp` | Burnt Onion Raita | Photo (WebP) | 800 × 600 | 85,868 B | Pexels raita is a generic Indian raita; onion is not independently verified. `.svg` fallback retained. |
| `dish-papad-and-pickle.webp` | Papad & Pickle | Photo (WebP) | 800 × 600 | 79,904 B | Commons file is titled “Dal dhokli”; papad and pickle are prominent, but the source also shows a dal bowl. `.svg` fallback retained. |
| `dish-kesar-pista-kulfi.webp` | Kesar Pista Kulfi | Photo (WebP) | 800 × 600 | 38,752 B | Direct dish match. `.svg` fallback retained. |
| `dish-shahi-tukda.webp` | Shahi Tukda | Photo (WebP) | 800 × 600 | 42,128 B | Direct dish match. `.svg` fallback retained. |
| `dish-mango-cardamom-lassi.webp` | Mango & Cardamom Lassi | Photo (WebP) | 800 × 600 | 23,556 B | Crop centres the glass and removes a jar at the edge. `.svg` fallback retained. |
| `dish-nimbu-pudina-soda.webp` | Nimbu Pudina Soda | Photo (WebP) | 800 × 600 | 47,796 B | Direct dish match. `.svg` fallback retained. |

## Placeholders

| File | Dish | Why it remains illustrated |
| --- | --- | --- |
| `dish-laal-maas.svg` | Laal Maas | No licensed photo matched the fiery Rajasthani mathania-chilli character without becoming a generic mutton curry. |
| `dish-peshawari-naan.svg` | Peshawari Naan | Available candidates were plain or garlic naan, or sweet stuffed breads that would misrepresent the dish. |
| `dish-gulab-jamun-cheesecake.svg` | Gulab Jamun Cheesecake | No licensed photo showed this specific fusion dessert; a generic cheesecake or gulab jamun would be inaccurate. |

## Licences and attribution

All photos are from Pexels, Wikimedia Commons, or the public domain. Wikimedia Commons files are CC0 1.0, CC BY 2.0, or CC BY-SA 4.0; Pexels files use the Pexels License. The full per-file attribution is in [CREDITS.md](CREDITS.md) and on the public `/credits` page. There are no paid-stock, Google Images, delivery-app, or AI-generated images.

## Replacing an image

- Keep the existing path or update every reference in `server/src/data/menu.js`, components, and CSS.
- Preserve the 4:3 dish crop so cards, cart thumbnails, and receipts stay balanced.
- Keep the dish photo under 150 KB and the hero under 350 KB; convert to WebP locally.
- Keep the matching SVG fallback, or update the `SafeImage` fallback rule if the extension changes.
- Add the new photographer, source page, and licence to `CREDITS.md` and `client/src/data/photoCredits.js`.

## Regenerating the fallbacks

The original illustrations can still be regenerated with:

```bash
npm run generate:images
```

The generator reads the menu catalogue and writes the SVG fallbacks; it does not replace the WebP photography.
