# Image inventory

All imagery is local. The storefront loads **35 original SVG illustrations** from `client/public/images/` and does not depend on a stock-photo service, image CDN, or remote artwork.

These files are art-directed placeholders for this demo, not photographs. [PROGRESS.md](PROGRESS.md) records the visual QA status, and the briefs below can be used when replacing them with licensed photography.

## How the assets fit together

| Group | Files | Size | Where it appears |
| --- | --- | --- | --- |
| Dish artwork | 32 | 960 × 720 (4:3) | Menu cards, homepage chef's picks, cart thumbnails, receipts |
| Editorial scenes | 3 | Portrait / landscape | Homepage hero, kitchen story, visit section; story image also appears on the tracking page |

Each dish image path is stored in the menu catalogue (`server/src/data/menu.js`) as `item.image`. The card uses the dish name as its `alt` text; decorative scene images used beside copy are treated as decorative where appropriate. The three scene images have descriptive `alt` text on the homepage. A new dish needs a matching SVG here and an `image` path in the menu seed.

Regenerate every placeholder with:

```bash
npm run generate:images
```

The generator reads the menu catalogue, so it creates one dish illustration per item plus the three scene illustrations.

## Editorial scenes

| File | Aspect | Used on | Art direction / purpose |
| --- | --- | --- | --- |
| `/images/hero-thali.svg` | 4:5 portrait | Homepage hero | Overhead Indian thali: butter chicken, dal makhani, seasonal vegetables, raita and saffron rice, framed by warm linen and brass. This is the first brand impression and must feel abundant, not like a menu cut-out. |
| `/images/story-spice.svg` | 9:11 portrait | Homepage “Our story”; tracking page support panel | Stone mortar of whole spices with bowls of turmeric, chilli and cardamom. Communicates the hand-ground spice blends and slow-kitchen craft. |
| `/images/visit-room.svg` | 3:2 landscape | Homepage “Visit us” | Warmly lit dining arches, pendant lamps and set tables at Saffron & Spice. Used to make the Bengaluru address feel like a real place. |

## Dish artwork

All paths below are relative to `client/public/images/`. Each is used as the primary dish-card image and as the cart/receipt thumbnail. The alt text is the dish name. “Sold out” items still need artwork because the menu displays them with a sold-out overlay. Prices are in the menu seed, not in the assets.

### Small plates

| File | Dish | Visual brief |
| --- | --- | --- |
| `dish-amritsari-paneer-tikka.svg` | Amritsari Paneer Tikka | Charred cottage cheese with ajwain and mint chutney; bright, shareable plate. |
| `dish-lucknowi-galouti-kebab.svg` | Lucknowi Galouti Kebab | Fine-ground lamb kebabs with saffron and rose; tender, rich, served with ulte tawa paratha. |
| `dish-dahi-ke-kebab.svg` | Dahi Ke Kebab | Crisp yoghurt-and-cashew kebabs with green chilli and pomegranate. |
| `dish-chettinad-pepper-chicken.svg` | Chettinad Pepper Chicken | Tamil-style pepper chicken with curry leaf and coconut; dark, glossy, fiery. |
| `dish-samosa-chaat.svg` | Samosa Chaat | Crushed samosa with chana masala, tamarind, whipped yoghurt and sev; layered and colourful. |

### From the tandoor

| File | Dish | Visual brief |
| --- | --- | --- |
| `dish-murgh-malai-tikka.svg` | Murgh Malai Tikka | Creamy cardamom chicken thigh with charred edges from the tandoor. |
| `dish-tandoori-broccoli.svg` | Tandoori Broccoli | Spiced broccoli florets, smoked yoghurt and toasted almond. |
| `dish-kashmiri-seekh-kebab.svg` | Kashmiri Seekh Kebab | Hand-minced lamb skewers with Kashmiri chilli, fennel and mint. |
| `dish-bharwan-aloo.svg` | Bharwan Aloo | Tandoor-roasted baby potatoes stuffed with raisins and paneer. |
| `dish-tandoori-jhinga.svg` | Tandoori Jhinga | Tiger prawns with carom seed, lime and burnt-garlic butter. |
| `dish-sarson-salmon-tikka.svg` | Sarson Salmon Tikka *(seeded sold out)* | Salmon with mustard, dill and honey, pickled fennel; still needs a full-colour image for the sold-out menu state. |

### Curries & mains

| File | Dish | Visual brief |
| --- | --- | --- |
| `dish-butter-chicken.svg` | Butter Chicken | Tandoori chicken in tomato, fenugreek and cultured-butter gravy; the signature dish. |
| `dish-dal-makhani.svg` | Dal Makhani | Overnight black urad with tomato, ginger and cream; dark, silky, slow-cooked. |
| `dish-paneer-lababdar.svg` | Paneer Lababdar | Paneer in a silky tomato-cashew gravy with kasuri methi. |
| `dish-laal-maas.svg` | Laal Maas | Fiery Rajasthani mutton with mathania chilli and smoked ghee; deep red. |
| `dish-malabar-prawn-curry.svg` | Malabar Prawn Curry *(seeded sold out)* | Prawns in coconut milk with kokum and curry leaf; coastal, golden. |
| `dish-tamil-nadu-vegetable-kurma.svg` | Tamil Nadu Vegetable Kurma | Seasonal vegetables with coconut, fennel and cashew. |

### Biryani & rice

| File | Dish | Visual brief |
| --- | --- | --- |
| `dish-hyderabadi-dum-biryani.svg` | Hyderabadi Dum Biryani | Saffron basmati and chicken sealed under dough; served with mirchi ka salan. |
| `dish-awadhi-lamb-biryani.svg` | Awadhi Lamb Biryani | Lucknow-style lamb with rose water, fried onion and burani raita. |
| `dish-subz-biryani.svg` | Subz Biryani | Seasonal vegetables, whole spices, saffron and mint. |
| `dish-paneer-tikka-biryani.svg` | Paneer Tikka Biryani | Charred paneer layered through fragrant rice with crisp onion. |
| `dish-jeera-pulao.svg` | Jeera Pulao | Basmati tossed with roasted cumin and ghee. |

### Breads & sides

| File | Dish | Visual brief |
| --- | --- | --- |
| `dish-garlic-naan.svg` | Garlic Naan | Tandoori naan with confit garlic and coriander butter. |
| `dish-laccha-paratha.svg` | Laccha Paratha | Flaky whole-wheat paratha brushed with ghee; visible layers. |
| `dish-peshawari-naan.svg` | Peshawari Naan | Naan filled with coconut, sultanas and almonds. |
| `dish-burnt-onion-raita.svg` | Burnt Onion Raita | Hung yoghurt with charred onion and roasted cumin. |
| `dish-papad-and-pickle.svg` | Papad & Pickle | Lentil papad with house mango pickle and lemon. |

### Desserts & drinks

| File | Dish | Visual brief |
| --- | --- | --- |
| `dish-gulab-jamun-cheesecake.svg` | Gulab Jamun Cheesecake | Baked cheesecake with rose syrup and pistachio crumb. |
| `dish-kesar-pista-kulfi.svg` | Kesar Pista Kulfi | Slow-reduced milk with saffron, pistachio and falooda. |
| `dish-shahi-tukda.svg` | Shahi Tukda | Ghee-fried brioche with saffron rabri and almond. |
| `dish-mango-cardamom-lassi.svg` | Mango & Cardamom Lassi | Alphonso mango, cardamom and cultured yoghurt. |
| `dish-nimbu-pudina-soda.svg` | Nimbu Pudina Soda | Fresh lime, mint, black salt and soda. |

## Replacement notes

- Keep the same filenames or update the `image` path in `server/src/data/menu.js` and rerun `npm run seed`.
- Preserve the 4:3 crop for dish images so cards, cart thumbnails and receipt lines stay balanced.
- Keep food photography warm and natural: soft window light, cream ceramics, brass and linen, saffron and maroon accents. Avoid blue-hour or high-contrast neon grades.
- Provide a licence or written permission for every replacement photograph. The current SVGs are generated specifically for this demo and carry no third-party licence obligations.
- If using raster photography, export responsive AVIF/WebP variants and update `src`/`srcSet` in `DishCard.jsx` and the scene components rather than dropping in very large files.
