import {
  CATEGORY_VISUALS,
  cardamom,
  chilli,
  coriander,
  creamSwirl,
  hashString,
  leaf,
  limeWedge,
  makeRng,
  marigold,
  oilDots,
  onionRing,
  plate,
  renderDecor,
  rosePetal,
  starAnise,
  steam,
  wrapSvg,
} from './art-core.mjs';

const CX = 480;
const CY = 372;

function curryColors(slug) {
  if (slug.includes('dal-makhani')) return { light: '#80543d', mid: '#4b2a1d', dark: '#27130e', cream: true, dal: true };
  if (slug.includes('paneer')) return { light: '#db8a4a', mid: '#a8421e', dark: '#6d2411', cream: true, paneer: true };
  if (slug.includes('laal-maas')) return { light: '#b54a2a', mid: '#7e1f13', dark: '#4c100b', cream: false, mutton: true };
  if (slug.includes('prawn')) return { light: '#e0874f', mid: '#bf552b', dark: '#753015', cream: true, prawn: true };
  if (slug.includes('kurma')) return { light: '#d9a250', mid: '#a9732d', dark: '#68441b', cream: true, veg: true };
  return { light: '#db8244', mid: '#b6461f', dark: '#762610', cream: true, chicken: true };
}

function renderStarters(item, rand) {
  const slug = item.slug;
  let body = '';

  if (slug.includes('samosa')) {
    body += `<path d="M355 440C345 385 388 338 447 341C503 343 540 389 527 444C485 474 399 475 355 440Z" fill="#d6a55f" opacity=".26" />`;
    for (let index = 0; index < 3; index += 1) {
      const x = 395 + index * 76;
      const y = 420 - (index % 2) * 28;
      body += `<g transform="translate(${x} ${y}) rotate(${-10 + index * 12})">
        <path d="M0 54L42 -42L90 50Z" fill="url(#foodGold)" />
        <path d="M15 44L44 -23L75 42Z" fill="#c98b44" opacity=".55" />
        <path d="M42 -42L90 50" stroke="#8f5524" stroke-width="2" opacity=".6" />
        <path d="M20 30C38 36 56 34 70 24" fill="none" stroke="#f2d59b" stroke-width="2" opacity=".4" />
      </g>`;
    }
    body += `<path d="M360 350C400 320 580 318 611 357" fill="none" stroke="#f8eed8" stroke-width="9" stroke-linecap="round" opacity=".55" />`;
    body += `<path d="M365 458C430 487 545 485 592 452" fill="none" stroke="#6f2b18" stroke-width="7" stroke-linecap="round" opacity=".62" />`;
    for (let index = 0; index < 15; index += 1) {
      body += `<path d="M${370 + index * 15} ${352 + rand() * 16}C${381 + index * 15} ${367 + rand() * 12} ${389 + index * 15} ${377 + rand() * 10} ${401 + index * 15} ${386 + rand() * 12}" stroke="#e3bd72" stroke-width="2.2" opacity=".75" />`;
    }
    body += coriander(578, 340, 0.9, 20);
    body += leaf(345, 430, 0.8, -140, '#36532d');
  } else if (slug.includes('chettinad')) {
    body += `<g filter="url(#dropShadow)">
      <circle cx="${CX}" cy="${CY}" r="190" fill="url(#brass)" />
      <circle cx="${CX}" cy="${CY}" r="172" fill="#2a120c" />
      <circle cx="${CX}" cy="${CY}" r="160" fill="url(#foodBrown)" />
    </g>`;
    body += creamSwirl(CX + 5, CY - 8, 0.65, 8, '#d4a57a');
    for (let index = 0; index < 9; index += 1) {
      const angle = rand() * Math.PI * 2;
      const distance = Math.sqrt(rand()) * 120;
      body += `<ellipse cx="${CX + Math.cos(angle) * distance}" cy="${CY + Math.sin(angle) * distance}" rx="${12 + rand() * 9}" ry="${8 + rand() * 5}" fill="url(#foodBrown)" transform="rotate(${rand() * 180} ${CX + Math.cos(angle) * distance} ${CY + Math.sin(angle) * distance})" />`;
    }
    body += coriander(480, 335, 1.2, 8);
    body += leaf(560, 425, 0.9, 140, '#425d2d');
    body += `<path d="M398 423C430 406 466 405 495 416" stroke="#f5e8ca" stroke-width="2" opacity=".3" fill="none" />`;
  } else if (slug.includes('paneer')) {
    body += `<path d="M330 420C346 368 438 333 524 350C596 365 634 406 624 451C565 490 394 485 330 420Z" fill="url(#foodGreen)" opacity=".88" />`;
    for (let index = 0; index < 4; index += 1) {
      const x = 380 + (index % 2) * 118;
      const y = 350 + Math.floor(index / 2) * 82;
      body += `<g transform="translate(${x} ${y}) rotate(${-12 + index * 7})">
        <rect x="-48" y="-37" width="96" height="74" rx="12" fill="url(#foodCream)" stroke="#e3c79c" stroke-width="2" />
        <path d="M-34 -19C-8 -28 22 -23 35 -11" stroke="#a77534" stroke-width="4" opacity=".34" fill="none" />
        <path d="M-28 16C-2 8 17 11 34 20" stroke="#b77a31" stroke-width="3" opacity=".28" fill="none" />
        <path d="M-38 -30L-26 -38M36 30L44 22" stroke="#7d4b1d" stroke-width="3" opacity=".4" />
      </g>`;
    }
    for (let index = 0; index < 8; index += 1) {
      body += leaf(365 + rand() * 230, 320 + rand() * 120, 0.55, rand() * 360, rand() > 0.5 ? '#4f6737' : '#657c44');
    }
    body += `<path d="M363 440C390 421 445 406 511 410C560 412 595 426 604 445" fill="none" stroke="#f8eed7" stroke-width="5" opacity=".55" stroke-linecap="round" />`;
    body += limeWedge(570, 455, 0.62, 35);
  } else {
    const dahi = slug.includes('dahi');
    body += `<ellipse cx="480" cy="382" rx="230" ry="176" fill="#c99753" opacity=".28" />`;
    body += `<ellipse cx="480" cy="376" rx="218" ry="163" fill="#e0b26c" opacity=".75" />`;
    for (let index = 0; index < 18; index += 1) {
      const angle = rand() * Math.PI * 2;
      const distance = Math.sqrt(rand()) * 180;
      const x = 480 + Math.cos(angle) * distance;
      const y = 376 + Math.sin(angle) * distance * 0.7;
      body += `<ellipse cx="${x}" cy="${y}" rx="${2 + rand() * 8}" ry="${1 + rand() * 3}" fill="#9c612c" opacity=".35" transform="rotate(${rand() * 180} ${x} ${y})" />`;
    }
    const patties = [
      [405, 340, -12],
      [538, 366, 11],
      [459, 434, 4],
    ];
    for (const [x, y, rotate] of patties) {
      body += `<g transform="translate(${x} ${y}) rotate(${rotate})">
        <ellipse rx="82" ry="55" fill="url(#${dahi ? 'foodCream' : 'foodBrown'})" filter="url(#dropShadow)" />
        <ellipse rx="70" ry="43" fill="none" stroke="#f5e8cf" stroke-width="1.5" opacity="${dahi ? 0.3 : 0.16}" />
        <path d="M-45 -9C-18 -22 12 -21 35 -8" fill="none" stroke="#583018" stroke-width="3" opacity=".22" />
        <path d="M-27 17C-5 7 16 7 31 14" fill="none" stroke="#583018" stroke-width="2" opacity=".2" />
      </g>`;
    }
    body += `<path d="M349 450C385 426 450 418 501 424C552 430 598 450 611 466" fill="none" stroke="#f8eed8" stroke-width="5" stroke-linecap="round" opacity=".5" />`;
    if (dahi) {
      for (let index = 0; index < 12; index += 1) {
        body += `<circle cx="${380 + rand() * 210}" cy="${320 + rand() * 140}" r="${2 + rand() * 3}" fill="#8f2630" opacity=".8" />`;
      }
    }
    body += coriander(555, 310, 1, -8);
    body += onionRing(600, 448, 0.8, 25);
    body += chilli(340, 425, 0.7, -28);
  }

  return { content: body, defs: '' };
}

function renderTandoor(item) {
  const slug = item.slug;
  const broccoli = slug.includes('broccoli');
  const prawn = slug.includes('jhinga');
  const potato = slug.includes('aloo');
  let body = '';

  body += `<path d="M330 490C380 440 556 268 634 239" stroke="#c9c1b5" stroke-width="5" stroke-linecap="round" opacity=".8" />`;
  body += `<circle cx="632" cy="239" r="11" fill="none" stroke="#d8cec0" stroke-width="4" opacity=".8" />`;
  for (let index = 0; index < 3; index += 1) {
    const offset = index * 58;
    body += `<path d="M305 ${493 + offset}C380 ${438 + offset} 537 ${286 + offset} 614 ${239 + offset}" stroke="#b9afa2" stroke-width="3" stroke-linecap="round" opacity=".58" />`;
    body += `<circle cx="614" cy="${239 + offset}" r="7" fill="none" stroke="#d3c8b7" stroke-width="3" opacity=".65" />`;
    for (let piece = 0; piece < 3; piece += 1) {
      const t = 0.24 + piece * 0.22;
      const x = 322 + t * 290;
      const y = 478 + offset - t * 233;
      if (broccoli) {
        body += `<g transform="translate(${x} ${y}) rotate(-38)"><circle r="34" fill="url(#foodGreen)" /><circle cx="-17" cy="-10" r="15" fill="#607944" /><circle cx="17" cy="-12" r="13" fill="#4a6536" /><circle cx="2" cy="16" r="14" fill="#55703b" /><path d="M-25 19C-12 28 11 25 25 15" stroke="#d9a35a" stroke-width="2" fill="none" opacity=".5" /></g>`;
      } else if (prawn) {
        body += `<path d="M${x - 24} ${y + 10}C${x - 6} ${y + 38} ${x + 42} ${y + 24} ${x + 30} ${y - 14}C${x + 22} ${y - 38} ${x - 8} ${y - 30} ${x - 3} ${y - 10}" fill="url(#foodRed)" stroke="#e6a16b" stroke-width="2" transform="rotate(-12 ${x} ${y})" />`;
      } else if (potato) {
        body += `<g transform="translate(${x} ${y})"><ellipse rx="32" ry="25" fill="url(#foodGold)" /><path d="M-18 -8C-6 -16 10 -16 20 -7" fill="none" stroke="#f2d59d" stroke-width="2" opacity=".4" /><path d="M-22 9C-7 16 9 15 23 7" fill="none" stroke="#6d3d1b" stroke-width="2" opacity=".25" /></g>`;
      } else {
        body += `<g transform="translate(${x} ${y}) rotate(-38)">
          <rect x="-34" y="-24" width="68" height="48" rx="15" fill="url(#foodBrown)" />
          <path d="M-22 -12C-4 -20 14 -19 26 -9" stroke="#e1ad76" stroke-width="3" opacity=".28" fill="none" />
          <path d="M-16 12L14 5M-8 17L20 10" stroke="#4b2412" stroke-width="2" opacity=".4" />
        </g>`;
      }
    }
  }

  body += limeWedge(310, 262, 0.62, -18);
  body += onionRing(638, 510, 1, -14);
  body += coriander(650, 455, 1.1, 38);
  body += steam(510, 150, 0.85, 0.1);
  body += `<g opacity=".65">${marigold(683, 586, 11, '#d69838')}${starAnise(335, 585, 0.75, 12)}</g>`;
  return { content: body, defs: '' };
}

function renderCurry(item, rand) {
  const colors = curryColors(item.slug);
  const slug = item.slug;
  let body = '';

  body += `<g opacity=".85">
    <path d="M${CX - 196} ${CY - 26}h-36c-24 0-24 62 0 62h36" fill="none" stroke="url(#brass)" stroke-width="20" stroke-linecap="round" />
    <path d="M${CX + 196} ${CY - 26}h36c24 0 24 62 0 62h-36" fill="none" stroke="url(#brass)" stroke-width="20" stroke-linecap="round" />
  </g>`;
  body += `<g filter="url(#dropShadow)">
    <circle cx="${CX}" cy="${CY}" r="196" fill="url(#brass)" />
    <circle cx="${CX}" cy="${CY}" r="179" fill="#5a3419" />
    <circle cx="${CX}" cy="${CY}" r="168" fill="url(#curryGrad)" />
    <ellipse cx="${CX - 34}" cy="${CY - 42}" rx="118" ry="98" fill="#f6c387" opacity=".08" />
  </g>`;

  body += oilDots(rand, CX, CY, 142, '#f4c47f', 20);
  if (colors.dal) {
    for (let index = 0; index < 32; index += 1) {
      const angle = rand() * Math.PI * 2;
      const distance = Math.sqrt(rand()) * 135;
      body += `<ellipse cx="${CX + Math.cos(angle) * distance}" cy="${CY + Math.sin(angle) * distance}" rx="${2 + rand() * 3}" ry="1.4" fill="#2a130d" opacity=".55" />`;
    }
  }
  if (colors.cream) body += creamSwirl(CX + 2, CY - 16, 0.93, -4);

  if (slug.includes('butter-chicken') || slug.includes('laal-maas')) {
    for (let index = 0; index < 5; index += 1) {
      const angle = -0.3 + index * 0.9 + rand() * 0.3;
      const distance = 30 + rand() * 78;
      const x = CX + Math.cos(angle) * distance;
      const y = CY + Math.sin(angle) * distance;
      body += `<g transform="translate(${x} ${y}) rotate(${rand() * 180})"><ellipse rx="${24 + rand() * 12}" ry="${18 + rand() * 9}" fill="url(#${slug.includes('laal') ? 'foodBrown' : 'foodRed'})" /><path d="M-18 -5C-4 -13 12 -12 22 -4" stroke="#f2c69b" stroke-width="2" opacity=".3" fill="none" /></g>`;
    }
  } else if (colors.paneer) {
    for (let index = 0; index < 7; index += 1) {
      const angle = rand() * Math.PI * 2;
      const distance = 30 + rand() * 100;
      const x = CX + Math.cos(angle) * distance;
      const y = CY + Math.sin(angle) * distance;
      body += `<g transform="translate(${x} ${y}) rotate(${rand() * 40 - 20})"><rect x="-23" y="-18" width="46" height="36" rx="5" fill="url(#foodCream)" stroke="#c3975b" stroke-width="1.4" /><path d="M-13 -7C0 -12 10 -11 17 -5" stroke="#b47732" stroke-width="2" opacity=".3" fill="none" /></g>`;
    }
  } else if (colors.prawn) {
    for (let index = 0; index < 6; index += 1) {
      const angle = rand() * Math.PI * 2;
      const distance = 36 + rand() * 100;
      const x = CX + Math.cos(angle) * distance;
      const y = CY + Math.sin(angle) * distance;
      body += `<path d="M${x - 22} ${y + 4}C${x - 8} ${y + 28} ${x + 32} ${y + 18} ${x + 22} ${y - 10}C${x + 16} ${y - 28} ${x - 7} ${y - 20} ${x - 4} ${y - 4}" fill="url(#foodRed)" stroke="#f1b587" stroke-width="1.6" transform="rotate(${rand() * 180} ${x} ${y})" />`;
    }
  } else if (colors.veg) {
    for (let index = 0; index < 14; index += 1) {
      const angle = rand() * Math.PI * 2;
      const distance = Math.sqrt(rand()) * 130;
      const x = CX + Math.cos(angle) * distance;
      const y = CY + Math.sin(angle) * distance;
      if (rand() > 0.5) {
        body += `<circle cx="${x}" cy="${y}" r="${4 + rand() * 4}" fill="#6d8543" opacity=".9" />`;
      } else {
        body += `<rect x="${x - 8}" y="${y - 6}" width="${14 + rand() * 8}" height="${10 + rand() * 6}" rx="3" fill="${rand() > 0.5 ? '#c9813c' : '#d9ad62'}" transform="rotate(${rand() * 180} ${x} ${y})" />`;
      }
    }
  }

  body += coriander(CX + 26, CY - 60, 1.25, -18);
  body += coriander(CX - 100, CY + 48, 0.8, 42);
  body += chilli(CX + 120, CY + 92, 0.72, 18);
  body += steam(CX - 12, CY - 220, 0.9, 0.13);

  const sideRice = !slug.includes('dal-makhani');
  if (sideRice) {
    body += `<g transform="translate(716 554)" filter="url(#dropShadow)"><circle r="72" fill="#f2e4cd" /><circle r="61" fill="url(#riceGrad)" />${riceGrainCluster(rand, 0, 0, 52, 30)}<ellipse cx="-10" cy="-14" rx="24" ry="14" fill="#fff6e2" opacity=".45" /></g>`;
    body += `<path d="M646 546C672 530 706 524 738 529" stroke="#c7a76e" stroke-width="1.5" opacity=".4" fill="none" />`;
  }

  return {
    content: body,
    defs: `<radialGradient id="curryGrad" cx="36%" cy="28%" r="78%">
      <stop offset="0" stop-color="${colors.light}" />
      <stop offset=".55" stop-color="${colors.mid}" />
      <stop offset="1" stop-color="${colors.dark}" />
    </radialGradient>`,
  };
}

function riceGrainCluster(rand, cx, cy, radius, count) {
  const tones = ['#f7e8c7', '#efdcb4', '#e3c998', '#fbf1d9', '#d9bb83'];
  let grains = '';
  for (let index = 0; index < count; index += 1) {
    const angle = rand() * Math.PI * 2;
    const distance = Math.sqrt(rand()) * radius;
    const x = cx + Math.cos(angle) * distance;
    const y = cy + Math.sin(angle) * distance * 0.82;
    grains += `<ellipse cx="${Math.round(x * 10) / 10}" cy="${Math.round(y * 10) / 10}" rx="${5 + rand() * 4}" ry="${1.6 + rand() * 1.3}" fill="${tones[Math.floor(rand() * tones.length)]}" transform="rotate(${Math.round(rand() * 180)} ${Math.round(x)} ${Math.round(y)})" opacity=".88" />`;
  }
  return grains;
}

function renderBiryani(item, rand) {
  const slug = item.slug;
  const veg = item.isVeg;
  const isPulao = slug.includes('pulao');
  let body = '';

  body += `<g opacity=".8">
    <path d="M${CX - 224} ${CY - 20}h-38c-26 0-26 66 0 66h38" fill="none" stroke="url(#brass)" stroke-width="22" stroke-linecap="round" />
    <path d="M${CX + 224} ${CY - 20}h38c26 0 26 66 0 66h-38" fill="none" stroke="url(#brass)" stroke-width="22" stroke-linecap="round" />
  </g>`;
  body += `<g filter="url(#dropShadow)">
    <circle cx="${CX}" cy="${CY}" r="228" fill="url(#brass)" />
    <circle cx="${CX}" cy="${CY}" r="212" fill="#6d4624" />
    <circle cx="${CX}" cy="${CY}" r="199" fill="#2a160d" />
    <circle cx="${CX}" cy="${CY}" r="187" fill="#412414" />
  </g>`;
  body += `<g clip-path="url(#riceClip)">
    <circle cx="${CX}" cy="${CY}" r="182" fill="#472817" />
    <ellipse cx="${CX}" cy="${CY + 8}" rx="166" ry="156" fill="url(#riceGrad)" />
    ${riceGrainCluster(rand, CX, CY, 150, 160)}
    <ellipse cx="${CX - 38}" cy="${CY - 42}" rx="80" ry="48" fill="#fff6e2" opacity=".18" />
  </g>`;

  for (let index = 0; index < 13; index += 1) {
    const angle = rand() * Math.PI * 2;
    const distance = Math.sqrt(rand()) * 138;
    const x = CX + Math.cos(angle) * distance;
    const y = CY + Math.sin(angle) * distance;
    if (rand() > 0.45) {
      body += `<circle cx="${x}" cy="${y}" r="${4 + rand() * 2.6}" fill="#6d8a45" />`;
    } else {
      body += `<rect x="${x - 6}" y="${y - 4}" width="${10 + rand() * 5}" height="${7 + rand() * 4}" rx="2" fill="#d88632" transform="rotate(${rand() * 180} ${x} ${y})" opacity=".9" />`;
    }
  }

  if (!isPulao) {
    for (let index = 0; index < 7; index += 1) {
      const x = CX - 120 + rand() * 230;
      const y = CY - 100 + rand() * 190;
      body += `<path d="M${x} ${y}c${8 + rand() * 10} ${-4 + rand() * 8} ${16 + rand() * 8} ${3 + rand() * 8} ${24 + rand() * 10} ${-2 + rand() * 6}" fill="none" stroke="#b8651e" stroke-width="2" opacity=".8" />`;
    }
    for (let index = 0; index < 9; index += 1) {
      const angle = rand() * Math.PI * 2;
      const distance = 30 + rand() * 120;
      const x = CX + Math.cos(angle) * distance;
      const y = CY + Math.sin(angle) * distance;
      body += `<path d="M${x - 17} ${y}C${x - 8} ${y - 10} ${x + 4} ${y - 11} ${x + 15} ${y - 2}" fill="none" stroke="#d3944a" stroke-width="2.5" stroke-linecap="round" opacity=".8" />`;
    }
  }

  if (!veg && !isPulao) {
    for (const [x, y, rotate] of [
      [397, 300, -18],
      [559, 425, 14],
    ]) {
      body += `<g transform="translate(${x} ${y}) rotate(${rotate})"><ellipse rx="${48 + rand() * 8}" ry="${31 + rand() * 6}" fill="url(#foodBrown)" stroke="#d7a36b" stroke-width="1.5" /><path d="M-30 -5C-13 -15 8 -15 26 -6" fill="none" stroke="#f0cf9e" stroke-width="2" opacity=".3" /><path d="M12 -14L37 -32" stroke="#e8dcc4" stroke-width="5" stroke-linecap="round" opacity=".65" /></g>`;
    }
  }

  if (slug.includes('paneer')) {
    for (let index = 0; index < 5; index += 1) {
      const x = CX - 90 + rand() * 180;
      const y = CY - 70 + rand() * 150;
      body += `<rect x="${x - 15}" y="${y - 12}" width="30" height="24" rx="4" fill="url(#foodCream)" stroke="#b98447" stroke-width="1.4" transform="rotate(${rand() * 40 - 20} ${x} ${y})" />`;
    }
  }

  body += `<g transform="translate(744 550)" filter="url(#dropShadow)">
    <circle r="72" fill="#f1e3cc" />
    <circle r="61" fill="#fff8e8" />
    ${creamSwirl(0, -2, 0.48, 20, '#e8d1aa')}
    ${coriander(-18, -12, 0.55, 10)}
    <ellipse cx="18" cy="22" rx="12" ry="5" fill="#d8c39f" opacity=".65" />
  </g>`;
  body += `<g transform="translate(696 590)">${onionRing(0, 0, 0.55, 18)}</g>`;
  body += coriander(CX - 80, CY - 90, 1, 22);
  body += steam(CX, CY - 250, 0.95, 0.12);

  return {
    content: body,
    defs: `<clipPath id="riceClip"><circle cx="${CX}" cy="${CY}" r="184" /></clipPath>`,
  };
}

function naanPath(x, y, scale, rotate, light = false) {
  return `<g transform="translate(${x} ${y}) rotate(${rotate}) scale(${scale})">
    <path d="M-98 -5C-106 -48 -67 -78 -18 -69C16 -85 74 -69 91 -31C111 9 82 58 36 65C-5 77 -55 66 -80 35C-94 21 -100 8 -98 -5Z" fill="${light ? 'url(#naanLight)' : 'url(#naanGrad)'}" />
    <path d="M-74 -22C-51 -47 -15 -55 20 -47C50 -60 77 -33 76 -6C75 30 49 46 18 48C-20 58 -63 40 -74 14C-80 2 -79 -12 -74 -22Z" fill="#f0c98b" opacity=".2" />
  </g>`;
}

function renderBreads(item, rand) {
  const slug = item.slug;
  let body = '';

  if (slug.includes('raita')) {
    body += `<g filter="url(#dropShadow)">
      <circle cx="${CX}" cy="${CY}" r="190" fill="url(#brass)" />
      <circle cx="${CX}" cy="${CY}" r="174" fill="#fff9ea" />
      <circle cx="${CX}" cy="${CY}" r="156" fill="url(#foodCream)" />
    </g>`;
    body += creamSwirl(CX, CY - 4, 1.15, 12, '#fdf7e9');
    for (let index = 0; index < 22; index += 1) {
      const angle = rand() * Math.PI * 2;
      const distance = 30 + rand() * 112;
      const x = CX + Math.cos(angle) * distance;
      const y = CY + Math.sin(angle) * distance;
      body += `<path d="M${x} ${y}c${8 + rand() * 10} -${4 + rand() * 5} ${17 + rand() * 8} ${4 + rand() * 5} ${26 + rand() * 9} -3" fill="none" stroke="#a97a45" stroke-width="2.2" stroke-linecap="round" opacity=".65" transform="rotate(${rand() * 360} ${x} ${y})" />`;
    }
    body += coriander(CX - 20, CY - 48, 1, -20);
    body += `<g opacity=".55">${starAnise(690, 588, 0.85, 20)}${cardamom(600, 290, 1.1, 30)}</g>`;
  } else if (slug.includes('papad')) {
    body += `<circle cx="${CX}" cy="${CY}" r="208" fill="#e9d8ba" stroke="#c1a67d" stroke-width="2" opacity=".9" />`;
    body += `<circle cx="${CX}" cy="${CY}" r="178" fill="#d7b177" />`;
    for (let index = 0; index < 70; index += 1) {
      const angle = rand() * Math.PI * 2;
      const distance = Math.sqrt(rand()) * 170;
      body += `<circle cx="${CX + Math.cos(angle) * distance}" cy="${CY + Math.sin(angle) * distance}" r="${0.8 + rand() * 2.8}" fill="#845022" opacity="${(0.18 + rand() * 0.3).toFixed(2)}" />`;
    }
    body += `<g transform="translate(697 568)" filter="url(#dropShadow)"><circle r="72" fill="#f2e4cd" /><circle r="61" fill="#88301c" />${creamSwirl(0, -4, 0.42, 20, '#e7bf83')}</g>`;
    body += limeWedge(316, 520, 0.6, -40);
  } else {
    if (slug.includes('laccha')) {
      body += `<g filter="url(#dropShadow)"><ellipse cx="${CX}" cy="${CY}" rx="222" ry="194" fill="url(#naanGrad)" /><ellipse cx="${CX}" cy="${CY}" rx="208" ry="180" fill="#d5a565" /></g>`;
      for (let index = 1; index < 8; index += 1) {
        body += `<ellipse cx="${CX}" cy="${CY}" rx="${26 * index}" ry="${22 * index}" fill="none" stroke="#a9733c" stroke-width="2.2" opacity=".45" transform="rotate(${index * 8} ${CX} ${CY})" />`;
      }
      for (let index = 0; index < 22; index += 1) {
        const angle = rand() * Math.PI * 2;
        const distance = 24 + rand() * 160;
        body += `<ellipse cx="${CX + Math.cos(angle) * distance}" cy="${CY + Math.sin(angle) * distance}" rx="${3 + rand() * 7}" ry="${1 + rand() * 2}" fill="#f5d9a4" opacity=".5" transform="rotate(${rand() * 180} ${CX + Math.cos(angle) * distance} ${CY + Math.sin(angle) * distance})" />`;
      }
      body += `<ellipse cx="${CX}" cy="${CY - 30}" rx="48" ry="20" fill="#f8e4bd" opacity=".32" />`;
    } else {
      body += naanPath(436, 388, 1.08, -12);
      body += naanPath(527, 322, 0.86, 18, true);
      for (let index = 0; index < 30; index += 1) {
        const angle = rand() * Math.PI * 2;
        const distance = Math.sqrt(rand()) * 150;
        const x = CX + Math.cos(angle) * distance;
        const y = CY + Math.sin(angle) * distance * 0.75;
        body += `<ellipse cx="${x}" cy="${y}" rx="${2 + rand() * 6}" ry="${1 + rand() * 2.2}" fill="#7c4a24" opacity="${(0.16 + rand() * 0.3).toFixed(2)}" transform="rotate(${rand() * 180} ${x} ${y})" />`;
      }
      body += `<path d="M358 312C400 277 449 264 502 277" fill="none" stroke="#f5dda9" stroke-width="8" opacity=".26" stroke-linecap="round" />`;
      if (slug.includes('garlic')) {
        for (let index = 0; index < 24; index += 1) {
          body += `<circle cx="${382 + rand() * 190}" cy="${290 + rand() * 150}" r="${1.5 + rand() * 3}" fill="#f4e6bf" opacity=".8" />`;
          body += leaf(382 + rand() * 190, 290 + rand() * 150, 0.24, rand() * 360, '#5f743e');
        }
      }
      if (slug.includes('peshawari')) {
        for (let index = 0; index < 18; index += 1) {
          const x = 380 + rand() * 200;
          const y = 300 + rand() * 140;
          if (rand() > 0.55) body += `<ellipse cx="${x}" cy="${y}" rx="${3 + rand() * 3}" ry="${2 + rand() * 2}" fill="#e9d8b3" />`;
          else body += `<path d="M${x} ${y}c4 -5 9 -6 13 -2" fill="none" stroke="#8f5f2d" stroke-width="2" opacity=".75" />`;
        }
      }
      body += `<g transform="translate(698 560)" filter="url(#dropShadow)"><circle r="65" fill="#f0e2ca" /><circle r="54" fill="#fdf7e9" />${creamSwirl(0, -2, 0.42, 12, '#e8d2ac')}<circle cx="10" cy="16" r="3" fill="#7e9a50" /></g>`;
      body += `<g transform="translate(662 626)">${limeWedge(0, 0, 0.48, -18)}</g>`;
    }
    body += steam(CX, 170, 0.8, 0.08);
  }

  return {
    content: body,
    defs: `<linearGradient id="naanGrad" x1=".1" y1="0" x2=".9" y2="1">
      <stop offset="0" stop-color="#f3d49e" /><stop offset=".52" stop-color="#d6a25f" /><stop offset="1" stop-color="#a66b35" />
    </linearGradient>
    <linearGradient id="naanLight" x1=".1" y1="0" x2=".9" y2="1">
      <stop offset="0" stop-color="#f9e2b6" /><stop offset=".6" stop-color="#e3b876" /><stop offset="1" stop-color="#b57c3d" />
    </linearGradient>`,
  };
}

function renderDesserts(item, rand) {
  const slug = item.slug;
  let body = '';
  let extraDefs = `<linearGradient id="glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fffdf8" stop-opacity=".7" /><stop offset="1" stop-color="#fffdf8" stop-opacity=".15" /></linearGradient>`;

  if (slug.includes('lassi') || slug.includes('soda')) {
    const lassi = slug.includes('lassi');
    const drink = lassi ? '#f0cd83' : '#cdd7a3';
    const inner = lassi ? '#f8e4b7' : '#e8eec8';
    body += `<g filter="url(#dropShadow)">
      <circle cx="${CX}" cy="${CY}" r="158" fill="url(#brass)" />
      <circle cx="${CX}" cy="${CY}" r="144" fill="#d9b979" />
      <circle cx="${CX}" cy="${CY}" r="128" fill="${drink}" />
      <circle cx="${CX}" cy="${CY}" r="108" fill="${inner}" opacity=".8" />
    </g>`;
    body += `<circle cx="${CX - 30}" cy="${CY - 30}" r="62" fill="#fffdf5" opacity=".16" />`;
    if (lassi) {
      body += `<g transform="translate(${CX} ${CY})">
        <circle cx="-38" cy="-24" r="24" fill="#f1c56e" opacity=".8" />
        <rect x="-54" y="-42" width="30" height="30" rx="5" fill="#f4b94e" transform="rotate(18)" />
        ${cardamom(41, -34, 1.2, 20)}
        ${cardamom(24, 46, 1, -12)}
        ${starAnise(49, 29, 0.62, 8)}
      </g>`;
    } else {
      body += `<g transform="translate(${CX} ${CY})">
        <circle cx="-50" cy="-24" r="31" fill="#98b54e" opacity=".9" />
        <circle cx="-50" cy="-24" r="23" fill="#d9e6a5" opacity=".8" />
        <path d="M-72 -24h44M-50 -46v44" stroke="#f5f7df" stroke-width="1.5" opacity=".55" />
        <circle cx="44" cy="30" r="28" fill="#8fac45" opacity=".85" />
        <circle cx="44" cy="30" r="20" fill="#dbe8a8" opacity=".75" />
        <path d="M26 30h36M44 12v36" stroke="#f5f7df" stroke-width="1.4" opacity=".5" />
        ${coriander(4, -34, 0.85, 20)}
        <circle cx="-4" cy="15" r="4" fill="#eef4ce" opacity=".7" />
        <circle cx="18" cy="-14" r="2.5" fill="#f6f8df" opacity=".8" />
        <circle cx="-24" cy="34" r="3" fill="#f6f8df" opacity=".7" />
        <circle cx="63" cy="-28" r="2" fill="#f6f8df" opacity=".7" />
      </g>`;
    }
    body += `<g transform="translate(${CX + 60} ${CY + 80}) rotate(24)"><rect x="-10" y="-190" width="20" height="240" rx="10" fill="${lassi ? '#b86d42' : '#3f5d3b'}" opacity=".9" /><path d="M-10 -80H10" stroke="#f3dfc1" stroke-width="2" opacity=".4" /></g>`;
    body += `<g transform="translate(710 560)" opacity=".8">
      ${cardamom(0, 0, 1.3, 20)}
      ${marigold(56, 18, 9, '#d4a24a')}
      ${rosePetal(-52, 30, 0.8, 24)}
    </g>`;
    body += steam(CX, CY - 190, 0.75, 0.08);
  } else if (slug.includes('cheesecake')) {
    body += `<g filter="url(#dropShadow)">
      <path d="M480 208L652 492C580 532 394 532 308 492Z" fill="#f0d7ad" />
      <path d="M480 208L652 492C634 500 609 508 582 514L480 264Z" fill="#f7e6c8" opacity=".7" />
      <path d="M308 492C396 532 568 530 652 492L640 518C566 552 396 552 320 518Z" fill="#8d5a2f" />
    </g>`;
    body += `<path d="M474 222C492 300 505 378 541 473" fill="none" stroke="#b84f3d" stroke-width="10" opacity=".55" stroke-linecap="round" />`;
    body += `<path d="M397 288C448 321 507 330 574 309" fill="none" stroke="#fdf5e2" stroke-width="11" stroke-linecap="round" opacity=".35" />`;
    for (let index = 0; index < 18; index += 1) {
      const angle = rand() * Math.PI * 2;
      const distance = Math.sqrt(rand()) * 150;
      body += `<circle cx="${CX + Math.cos(angle) * distance}" cy="${CY + 30 + Math.sin(angle) * distance * 0.62}" r="${2 + rand() * 3}" fill="${rand() > 0.55 ? '#8f6536' : '#d6bd83'}" opacity=".7" />`;
    }
    body += rosePetal(590, 458, 1, 18);
    body += rosePetal(575, 478, 0.7, 50);
    body += starAnise(348, 430, 0.7, 12);
  } else if (slug.includes('kulfi')) {
    body += `<g transform="translate(${CX} ${CY}) rotate(-26)" filter="url(#dropShadow)">
      <rect x="-54" y="-160" width="108" height="260" rx="54" fill="url(#foodCream)" />
      <path d="M-22 -118C6 -132 32 -128 45 -110C15 -102 -4 -100 -26 -108Z" fill="#d8b077" opacity=".55" />
      <path d="M-18 -80C-18 10 -17 45 -16 68" stroke="#8c5a30" stroke-width="12" stroke-linecap="round" opacity=".8" />
      <rect x="-10" y="94" width="20" height="86" rx="10" fill="#c89a5c" />
    </g>`;
    for (let index = 0; index < 26; index += 1) {
      const angle = rand() * Math.PI * 2;
      const distance = Math.sqrt(rand()) * 150;
      body += `<circle cx="${CX + Math.cos(angle) * distance}" cy="${CY + Math.sin(angle) * distance * 0.7}" r="${1.6 + rand() * 2.3}" fill="${rand() > 0.5 ? '#7f9b50' : '#f8ecd6'}" opacity=".8" />`;
    }
    body += `<path d="M350 454C390 490 522 496 606 456" fill="none" stroke="#d39b4d" stroke-width="3" opacity=".5" />`;
    body += rosePetal(344, 330, 0.9, -20);
    body += `<g transform="translate(620 514)">${starAnise(0, 0, 0.75, 8)}</g>`;
  } else {
    body += `<g filter="url(#dropShadow)">
      <rect x="352" y="290" width="256" height="182" rx="22" fill="url(#foodCream)" transform="rotate(-6 480 380)" />
      <rect x="382" y="252" width="222" height="164" rx="20" fill="#f5e2c2" transform="rotate(7 493 334)" />
    </g>`;
    body += `<path d="M385 326C432 348 505 351 566 327" fill="none" stroke="#b98c4c" stroke-width="8" opacity=".35" stroke-linecap="round" />`;
    body += creamSwirl(CX, 320, 0.65, -10, '#fbf1da');
    body += `<path d="M410 388C460 404 515 403 560 386" stroke="#f5d596" stroke-width="4" opacity=".7" fill="none" />`;
    for (let index = 0; index < 14; index += 1) {
      body += `<path d="M${380 + rand() * 200} ${300 + rand() * 150}c6 -8 15 -11 23 -5" fill="none" stroke="#b56c28" stroke-width="1.6" opacity=".4" />`;
    }
    body += `<g transform="translate(608 456)">${starAnise(0, 0, 0.8, 20)}</g>`;
    body += rosePetal(336, 436, 0.9, -20);
    body += rosePetal(362, 460, 0.65, 30);
  }

  body += `<g transform="translate(718 584)" opacity=".9">${marigold(0, 0, 10, '#c68a4b')}</g>`;
  return { content: body, defs: extraDefs };
}

export function renderDishSvg(item) {
  const visual = CATEGORY_VISUALS[item.category];
  const seed = hashString(item.slug);
  const rand = makeRng(seed);
  const bg = visual.bgs[seed % visual.bgs.length];
  let art;

  if (item.category === 'small-plates') art = renderStarters(item, rand);
  else if (item.category === 'tandoor') art = renderTandoor(item);
  else if (item.category === 'curries') art = renderCurry(item, rand);
  else if (item.category === 'biryani') art = renderBiryani(item, rand);
  else if (item.category === 'breads') art = renderBreads(item, rand);
  else art = renderDesserts(item, rand);

  const plateMarkup = plate({
    cx: CX,
    cy: CY,
    r: 252,
    type: visual.plate,
    accent: visual.accent,
  });
  const decor = renderDecor(rand, visual.accent, item.category === 'desserts' ? 'dessert' : 'savoury');

  return wrapSvg({
    width: 960,
    height: 720,
    bg,
    glow: visual.glow,
    accent: visual.accent,
    content: `${decor}${plateMarkup}${art.content}`,
    extraDefs: art.defs,
  });
}
