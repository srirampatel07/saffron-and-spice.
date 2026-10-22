/** Shared SVG art primitives for the locally generated food artwork. */

export const CATEGORY_VISUALS = {
  'small-plates': {
    bgs: [
      ['#3a151a', '#160809'],
      ['#351a16', '#140907'],
      ['#3f1d1c', '#180a0a'],
    ],
    glow: '#9f4636',
    accent: '#e0b06b',
    plate: 'cream',
  },
  tandoor: {
    bgs: [
      ['#2f1711', '#120805'],
      ['#3a1d12', '#160a07'],
      ['#29150f', '#100705'],
    ],
    glow: '#9c4a25',
    accent: '#e5aa67',
    plate: 'cream',
  },
  curries: {
    bgs: [
      ['#3d1a13', '#180a07'],
      ['#472112', '#1c0c06'],
      ['#351713', '#150806'],
    ],
    glow: '#b0572d',
    accent: '#e2b479',
    plate: 'brass',
  },
  biryani: {
    bgs: [
      ['#382313', '#160d06'],
      ['#422814', '#1a0f07'],
      ['#332014', '#140c07'],
    ],
    glow: '#a87836',
    accent: '#e8c184',
    plate: 'brass',
  },
  breads: {
    bgs: [
      ['#372917', '#161008'],
      ['#3e2c18', '#180f08'],
      ['#332516', '#150d07'],
    ],
    glow: '#9f7840',
    accent: '#e4bf85',
    plate: 'board',
  },
  desserts: {
    bgs: [
      ['#3b1926', '#170a10'],
      ['#43202a', '#1b0c11'],
      ['#351720', '#15080d'],
    ],
    glow: '#a8586b',
    accent: '#efc3a5',
    plate: 'cream',
  },
};

export function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function makeRng(seed) {
  let state = seed >>> 0;
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const n = (value) => Math.round(value * 10) / 10;

export function commonDefs() {
  return `
    <linearGradient id="bg" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="#3d1c16" />
      <stop offset="1" stop-color="#140806" />
    </linearGradient>
    <radialGradient id="tableGlow" cx="50%" cy="42%" r="65%">
      <stop offset="0" stop-color="#a45a3a" stop-opacity=".5" />
      <stop offset=".55" stop-color="#7e3d2b" stop-opacity=".18" />
      <stop offset="1" stop-color="#7e3d2b" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="plateCream" x1=".2" y1="0" x2=".8" y2="1">
      <stop offset="0" stop-color="#fff9ec" />
      <stop offset=".55" stop-color="#f1e3cb" />
      <stop offset="1" stop-color="#d9c4a4" />
    </linearGradient>
    <linearGradient id="plateDark" x1=".2" y1="0" x2=".8" y2="1">
      <stop offset="0" stop-color="#57453d" />
      <stop offset=".6" stop-color="#30251f" />
      <stop offset="1" stop-color="#1b1512" />
    </linearGradient>
    <linearGradient id="brass" x1=".15" y1="0" x2=".8" y2="1">
      <stop offset="0" stop-color="#f4d9a0" />
      <stop offset=".35" stop-color="#d3a255" />
      <stop offset=".72" stop-color="#a87532" />
      <stop offset="1" stop-color="#755020" />
    </linearGradient>
    <linearGradient id="wood" x1=".1" y1="0" x2=".9" y2="1">
      <stop offset="0" stop-color="#9b6e43" />
      <stop offset=".55" stop-color="#6c4629" />
      <stop offset="1" stop-color="#402719" />
    </linearGradient>
    <radialGradient id="foodGold" cx="38%" cy="30%" r="78%">
      <stop offset="0" stop-color="#f6cd88" />
      <stop offset=".55" stop-color="#cf8a43" />
      <stop offset="1" stop-color="#82471f" />
    </radialGradient>
    <radialGradient id="foodCream" cx="38%" cy="28%" r="78%">
      <stop offset="0" stop-color="#fff8e9" />
      <stop offset=".6" stop-color="#eed9b5" />
      <stop offset="1" stop-color="#c3a67d" />
    </radialGradient>
    <radialGradient id="foodBrown" cx="35%" cy="25%" r="80%">
      <stop offset="0" stop-color="#b87945" />
      <stop offset=".55" stop-color="#7c4524" />
      <stop offset="1" stop-color="#422112" />
    </radialGradient>
    <radialGradient id="foodRed" cx="38%" cy="28%" r="80%">
      <stop offset="0" stop-color="#e07740" />
      <stop offset=".55" stop-color="#b6401c" />
      <stop offset="1" stop-color="#701d0f" />
    </radialGradient>
    <radialGradient id="foodGreen" cx="38%" cy="28%" r="80%">
      <stop offset="0" stop-color="#8b9a56" />
      <stop offset=".6" stop-color="#516334" />
      <stop offset="1" stop-color="#27351c" />
    </radialGradient>
    <radialGradient id="riceGrad" cx="35%" cy="26%" r="80%">
      <stop offset="0" stop-color="#fff8e4" />
      <stop offset=".6" stop-color="#eedcb8" />
      <stop offset="1" stop-color="#c5a875" />
    </radialGradient>
    <radialGradient id="vignette" cx="50%" cy="44%" r="72%">
      <stop offset=".52" stop-color="#000" stop-opacity="0" />
      <stop offset="1" stop-color="#000" stop-opacity=".48" />
    </radialGradient>
    <filter id="dropShadow" x="-35%" y="-35%" width="170%" height="180%">
      <feDropShadow dx="0" dy="18" stdDeviation="18" flood-color="#0a0302" flood-opacity=".6" />
    </filter>
    <filter id="softBlur" x="-30%" y="-60%" width="160%" height="230%">
      <feGaussianBlur stdDeviation="18" />
    </filter>
    <filter id="grain">
      <feTurbulence type="fractalNoise" baseFrequency=".82" numOctaves="3" stitchTiles="stitch" />
      <feColorMatrix type="saturate" values="0" />
    </filter>`;
}

export function wrapSvg({ width, height, bg, glow, accent, content, extraDefs = '' }) {
  const [top, bottom] = bg;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img">
  <defs>
    <linearGradient id="sceneBackground" x1="0" y1="0" x2="0.8" y2="1">
      <stop offset="0" stop-color="${top}" />
      <stop offset="1" stop-color="${bottom}" />
    </linearGradient>
    <radialGradient id="sceneGlow" cx="50%" cy="42%" r="64%">
      <stop offset="0" stop-color="${glow}" stop-opacity=".48" />
      <stop offset=".58" stop-color="${glow}" stop-opacity=".16" />
      <stop offset="1" stop-color="${glow}" stop-opacity="0" />
    </radialGradient>
    ${commonDefs()}
    ${extraDefs}
  </defs>
  <rect width="${width}" height="${height}" fill="url(#sceneBackground)" />
  <rect width="${width}" height="${height}" fill="url(#sceneGlow)" />
  <g fill="none" stroke="${accent}">
    <path d="M${width * 0.055} ${height} V${height * 0.38} C${width * 0.055} ${height * 0.16} ${width * 0.28} ${height * 0.07} ${width / 2} ${height * 0.07} C${width * 0.72} ${height * 0.07} ${width * 0.945} ${height * 0.16} ${width * 0.945} ${height * 0.38} V${height}" stroke-width="1.6" opacity=".15" />
    <path d="M${width * 0.1} ${height} V${height * 0.4} C${width * 0.1} ${height * 0.21} ${width * 0.3} ${height * 0.12} ${width / 2} ${height * 0.12} C${width * 0.7} ${height * 0.12} ${width * 0.9} ${height * 0.21} ${width * 0.9} ${height * 0.4} V${height}" stroke-width="1" opacity=".08" />
    <circle cx="${width / 2}" cy="${height * 0.48}" r="${width * 0.44}" stroke-width="1" opacity=".06" />
  </g>
  ${content}
  <rect width="${width}" height="${height}" filter="url(#grain)" opacity=".075" style="mix-blend-mode:overlay" />
  <rect width="${width}" height="${height}" fill="url(#vignette)" />
</svg>`;
}

export function plate({ cx = 480, cy = 370, r = 252, type = 'cream', accent = '#e0b06b' }) {
  if (type === 'board') {
    return `<ellipse cx="${cx}" cy="${cy + r * 0.92}" rx="${r * 1.02}" ry="${r * 0.16}" fill="#0a0302" opacity=".4" filter="url(#softBlur)" />
      <ellipse cx="${cx}" cy="${cy}" rx="${r + 22}" ry="${r * 0.86}" fill="url(#wood)" filter="url(#dropShadow)" />
      <ellipse cx="${cx}" cy="${cy}" rx="${r + 8}" ry="${r * 0.86 - 12}" fill="none" stroke="${accent}" stroke-width="2" opacity=".22" />
      <path d="M${cx - r - 10} ${cy - r * 0.5} C${cx - r * 0.2} ${cy - r * 0.7} ${cx + r * 0.2} ${cy - r * 0.7} ${cx + r + 10} ${cy - r * 0.5}" fill="none" stroke="#f1dbb2" stroke-width="1" opacity=".1" />`;
  }

  const fill = type === 'brass' ? 'url(#brass)' : type === 'dark' ? 'url(#plateDark)' : 'url(#plateCream)';
  return `<ellipse cx="${cx}" cy="${cy + r * 0.94}" rx="${r * 0.92}" ry="${r * 0.16}" fill="#0a0302" opacity=".38" filter="url(#softBlur)" />
    <g filter="url(#dropShadow)">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" />
      <circle cx="${cx}" cy="${cy}" r="${r - 9}" fill="none" stroke="${accent}" stroke-width="1.8" opacity=".35" />
      <circle cx="${cx}" cy="${cy}" r="${r - 18}" fill="none" stroke="#1a0c07" stroke-width="1" opacity=".16" />
    </g>`;
}

export function leaf(x, y, scale = 1, rotate = 0, color = '#4e6b3c') {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${rotate}) scale(${scale})">
    <path d="M0 0C10 -14 28 -18 39 -7C28 6 11 10 0 0Z" fill="${color}" />
    <path d="M5 -1C15 -5 25 -7 34 -6" stroke="#e3eccb" stroke-width="1" opacity=".32" fill="none" />
  </g>`;
}

export function marigold(x, y, r = 16, color = '#d8912f') {
  let petals = '';
  for (let index = 0; index < 9; index += 1) {
    petals += `<ellipse cx="${r * 0.55}" cy="0" rx="${r * 0.55}" ry="${r * 0.27}" fill="${color}" transform="rotate(${index * 40})" opacity=".92" />`;
  }
  return `<g transform="translate(${n(x)} ${n(y)})">${petals}<circle r="${r * 0.25}" fill="#7f3b12" /></g>`;
}

export function rosePetal(x, y, scale = 1, rotate = 0, color = '#c2707b') {
  return `<path d="M0 0C8 -14 27 -16 34 -3C28 11 10 12 0 0Z" transform="translate(${n(x)} ${n(y)}) rotate(${rotate}) scale(${scale})" fill="${color}" opacity=".9" />`;
}

export function starAnise(x, y, scale = 1, rotate = 0, color = '#8d552e') {
  let arms = '';
  for (let index = 0; index < 8; index += 1) {
    arms += `<path d="M0 0L${8 * scale} ${-8 * scale}L${18 * scale} ${-4 * scale}L${12 * scale} ${2 * scale}Z" transform="rotate(${index * 45})" opacity=".9" />`;
  }
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${rotate})" fill="${color}">${arms}<circle r="${2.2 * scale}" fill="#4b2714" /></g>`;
}

export function cardamom(x, y, scale = 1, rotate = 0) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${rotate}) scale(${scale})">
    <ellipse rx="10" ry="5" fill="#7c8c51" />
    <path d="M-7 0H7" stroke="#d1d8ad" stroke-width="1" opacity=".38" />
  </g>`;
}

export function chilli(x, y, scale = 1, rotate = 0) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${rotate}) scale(${scale})">
    <path d="M0 0C20 3 38 -8 46 -25C42 -7 25 12 2 9Z" fill="#8f2b1e" />
    <path d="M0 0C-8 -4 -8 -14 -2 -17" fill="none" stroke="#546234" stroke-width="3" stroke-linecap="round" />
  </g>`;
}

export function limeWedge(x, y, scale = 1, rotate = 0) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${rotate}) scale(${scale})">
    <path d="M0 0A52 52 0 0 1 52 52L0 52Z" fill="#a6b449" />
    <path d="M6 12A34 34 0 0 1 40 46" fill="none" stroke="#f0f0c6" stroke-width="2" opacity=".65" />
    <path d="M0 8L44 52M12 4L48 40M4 18L36 50" stroke="#e8edc3" stroke-width="1.2" opacity=".55" />
    <path d="M0 0A52 52 0 0 1 52 52" fill="none" stroke="#4c5e22" stroke-width="4" opacity=".7" />
  </g>`;
}

export function onionRing(x, y, scale = 1, rotate = 0) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${rotate}) scale(${scale})" fill="none">
    <ellipse rx="28" ry="13" stroke="#d8c1a1" stroke-width="4" opacity=".8" />
    <ellipse rx="16" ry="7" stroke="#b99670" stroke-width="2.5" opacity=".7" />
  </g>`;
}

export function coriander(x, y, scale = 1, rotate = 0) {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${rotate}) scale(${scale})">
    ${leaf(0, 0, 0.72, -32, '#55703a')}
    ${leaf(2, 4, 0.62, 24, '#668147')}
    ${leaf(12, -2, 0.5, 92, '#476233')}
  </g>`;
}

export function creamSwirl(x, y, scale = 1, rotate = 0, color = '#f8ead2') {
  return `<g transform="translate(${n(x)} ${n(y)}) rotate(${rotate}) scale(${scale})" fill="none" stroke="${color}" stroke-linecap="round">
    <path d="M-70 -10C-50 -36 -6 -43 24 -25C55 -7 62 18 35 30C12 40 -22 32 -27 12C-31 -4 -10 -15 8 -8" stroke-width="7" opacity=".78" />
    <path d="M-52 20C-34 8 -8 8 10 17" stroke-width="4" opacity=".55" />
  </g>`;
}

export function steam(x, y, scale = 1, opacity = 0.16) {
  return `<g transform="translate(${n(x)} ${n(y)}) scale(${scale})" fill="none" stroke="#f8ecd9" stroke-linecap="round" opacity="${opacity}">
    <path d="M0 60C-26 30 18 18 -8 -14C-30 -40 -4 -62 8 -82" stroke-width="5" />
    <path d="M38 66C16 38 54 20 30 -8C12 -30 32 -52 44 -74" stroke-width="3.5" />
  </g>`;
}

export function oilDots(rand, cx, cy, radius, color, count = 14) {
  let dots = '';
  for (let index = 0; index < count; index += 1) {
    const angle = rand() * Math.PI * 2;
    const distance = Math.sqrt(rand()) * radius;
    const size = 2 + rand() * 5;
    dots += `<circle cx="${n(cx + Math.cos(angle) * distance)}" cy="${n(cy + Math.sin(angle) * distance)}" r="${n(size)}" fill="${color}" opacity="${(0.18 + rand() * 0.35).toFixed(2)}" />`;
  }
  return dots;
}

export function renderDecor(rand, accent, mode = 'savoury') {
  let output = `<g opacity=".78">`;
  const spots = [
    [88, 136],
    [872, 116],
    [92, 590],
    [858, 592],
    [162, 656],
  ];
  for (const [x, y] of spots) {
    const choice = rand();
    if (mode === 'dessert') {
      output += choice > 0.45 ? rosePetal(x, y, 0.8 + rand() * 0.4, rand() * 360) : cardamom(x, y, 0.9, rand() * 360);
    } else if (choice < 0.3) {
      output += starAnise(x, y, 0.8 + rand() * 0.25, rand() * 90);
    } else if (choice < 0.55) {
      output += cardamom(x, y, 1, rand() * 180);
    } else if (choice < 0.75) {
      output += chilli(x, y, 0.6 + rand() * 0.25, rand() * 120 - 60);
    } else {
      output += marigold(x, y, 9 + rand() * 6, rand() > 0.5 ? '#cf8b2b' : '#b76c27');
    }
  }

  let dust = '';
  for (let index = 0; index < 28; index += 1) {
    const x = 50 + rand() * 860;
    const y = 40 + rand() * 640;
    const distanceToCentre = Math.hypot(x - 480, y - 370);
    if (distanceToCentre < 300) continue;
    dust += `<circle cx="${n(x)}" cy="${n(y)}" r="${n(0.8 + rand() * 2)}" fill="${accent}" opacity="${(0.15 + rand() * 0.35).toFixed(2)}" />`;
  }
  output += dust;
  output += `</g>`;
  return output;
}
