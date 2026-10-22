import {
  cardamom,
  chilli,
  coriander,
  creamSwirl,
  leaf,
  makeRng,
  marigold,
  rosePetal,
  starAnise,
  steam,
  wrapSvg,
} from './art-core.mjs';

function grainCluster(rand, cx, cy, radius, count) {
  const tones = ['#f8ead0', '#f1dfbf', '#e7cfa4', '#fdf5e2'];
  let grains = '';
  for (let index = 0; index < count; index += 1) {
    const angle = rand() * Math.PI * 2;
    const distance = Math.sqrt(rand()) * radius;
    const x = cx + Math.cos(angle) * distance;
    const y = cy + Math.sin(angle) * distance * 0.82;
    grains += `<ellipse cx="${Math.round(x)}" cy="${Math.round(y)}" rx="${4 + rand() * 4}" ry="${1.5 + rand() * 1.2}" fill="${tones[Math.floor(rand() * tones.length)]}" transform="rotate(${Math.round(rand() * 180)} ${Math.round(x)} ${Math.round(y)})" opacity=".9" />`;
  }
  return grains;
}

function bowl({ x, y, r, fillId, garnish = 'herb', cream = false, rim = true }) {
  let contents = `<circle cx="${x}" cy="${y}" r="${r - 10}" fill="url(#${fillId})" />`;
  if (cream) contents += creamSwirl(x, y - 2, r / 180, -8);
  if (garnish === 'herb') {
    contents += coriander(x + r * 0.18, y - r * 0.22, r / 160, -18);
    contents += `<circle cx="${x - r * 0.28}" cy="${y + r * 0.3}" r="${r * 0.035}" fill="#8e2f25" opacity=".8" />`;
  }
  if (garnish === 'chilli') contents += chilli(x + r * 0.25, y + r * 0.18, r / 260, 16);
  return `<g filter="url(#dropShadow)">
    <circle cx="${x}" cy="${y}" r="${r}" fill="url(#brass)" />
    <circle cx="${x}" cy="${y}" r="${r - 6}" fill="#4d2817" />
    ${contents}
    ${rim ? `<circle cx="${x}" cy="${y}" r="${r - 2}" fill="none" stroke="#f0d39a" stroke-width="1.4" opacity=".55" />` : ''}
  </g>`;
}

function pendant(x, y, glowId) {
  return `<g>
    <path d="M${x} 0V${y - 48}" stroke="#7e5a33" stroke-width="2" opacity=".8" />
    <circle cx="${x}" cy="${y}" r="70" fill="url(#${glowId})" opacity=".85" />
    <path d="M${x - 38} ${y + 16}C${x - 30} ${y - 25} ${x + 30} ${y - 25} ${x + 38} ${y + 16}C${x + 22} ${y + 33} ${x - 22} ${y + 33} ${x - 38} ${y + 16}Z" fill="url(#brass)" />
    <circle cx="${x}" cy="${y + 18}" r="9" fill="#ffe3ae" />
    <path d="M${x - 20} ${y + 22}C${x - 10} ${y + 28} ${x + 10} ${y + 28} ${x + 20} ${y + 22}" stroke="#8a541f" stroke-width="1.5" opacity=".65" fill="none" />
  </g>`;
}

export function renderHeroSvg() {
  const rand = makeRng(74123);
  const content = `
    ${pendant(212, 250, 'lampGlow')}
    ${pendant(800, 198, 'lampGlow')}
    <ellipse cx="500" cy="760" rx="510" ry="390" fill="#000" opacity=".2" filter="url(#softBlur)" />
    <g transform="translate(45 950) rotate(-14)">
      <path d="M0 0H330L365 220H-30Z" fill="#f1e3cc" opacity=".16" />
      <path d="M12 15H318L347 208H-16Z" fill="none" stroke="#f3d8a2" stroke-width="1" opacity=".25" />
    </g>
    <path d="M96 995C235 944 352 1010 468 1075" fill="none" stroke="#efdfc3" stroke-width="1.2" opacity=".16" />
    <path d="M78 1028C231 974 366 1048 474 1104" fill="none" stroke="#efdfc3" stroke-width="1.2" opacity=".1" />

    <g filter="url(#dropShadow)">
      <circle cx="500" cy="718" r="382" fill="url(#brass)" />
      <circle cx="500" cy="718" r="362" fill="#71451e" />
      <circle cx="500" cy="718" r="348" fill="#503016" opacity=".7" />
      <circle cx="500" cy="718" r="305" fill="none" stroke="#f0d29b" stroke-width="2" opacity=".36" />
      <circle cx="500" cy="718" r="292" fill="none" stroke="#2c160b" stroke-width="1.4" opacity=".4" />
    </g>
    <circle cx="500" cy="718" r="342" fill="url(#tableGlow)" opacity=".3" />

    ${bowl({ x: 344, y: 590, r: 102, fillId: 'heroCurryRed', garnish: 'herb', cream: true })}
    ${bowl({ x: 656, y: 590, r: 102, fillId: 'heroDal', garnish: 'chilli', cream: true })}
    ${bowl({ x: 344, y: 842, r: 102, fillId: 'heroGreen', garnish: 'chilli' })}
    ${bowl({ x: 656, y: 842, r: 102, fillId: 'heroRaita', garnish: 'herb', cream: true })}

    <g filter="url(#dropShadow)">
      <circle cx="500" cy="714" r="154" fill="url(#brass)" />
      <circle cx="500" cy="714" r="144" fill="#452715" />
      <ellipse cx="500" cy="716" rx="132" ry="122" fill="url(#riceGrad)" />
      ${grainCluster(rand, 500, 714, 120, 110)}
      ${coriander(482, 636, 0.85, -20)}
      ${starAnise(560, 654, 0.5, 15)}
      ${creamSwirl(500, 704, 0.34, 22, '#d29a4e')}
    </g>
    <path d="M357 747C420 778 575 778 638 744" fill="none" stroke="#e9c48b" stroke-width="1.6" opacity=".3" />

    <g transform="translate(832 989)" filter="url(#dropShadow)">
      <ellipse cx="0" cy="0" rx="93" ry="57" fill="#dfcbaa" opacity=".95" />
      <path d="M-71 -9C-54 -47 -15 -62 24 -48C61 -57 87 -29 82 3C78 39 39 56 -1 51C-42 57 -78 34 -78 5C-78 -1 -75 -5 -71 -9Z" fill="url(#naanHero)" />
      <path d="M-35 -22C-10 -31 18 -26 42 -14" stroke="#f5dfb1" stroke-width="6" opacity=".25" fill="none" stroke-linecap="round" />
    </g>
    <g transform="translate(314 1010)" filter="url(#dropShadow)">
      <circle r="70" fill="#ecdfc8" />
      <circle r="59" fill="#87301e" />
      ${creamSwirl(0, -4, 0.42, 18, '#e6bd82')}
    </g>

    <path d="M435 1098C488 1128 565 1125 607 1098" fill="none" stroke="#d3a35f" stroke-width="1.2" opacity=".2" />
    ${steam(390, 440, 0.8, 0.1)}
    ${steam(618, 420, 0.65, 0.08)}
    ${marigold(723, 1064, 16, '#d69532')}
    ${marigold(764, 1089, 11, '#b87328')}
    ${starAnise(255, 1050, 1.3, 14)}
    ${chilli(730, 1114, 1, -10)}
    <g transform="translate(140 1096)" opacity=".9">
      <path d="M0 0L32 0M12 -5V55M0 55H32" stroke="#d9bd8e" stroke-width="3" opacity=".48" />
    </g>
  `;

  return wrapSvg({
    width: 1000,
    height: 1250,
    bg: ['#4a1a17', '#170809'],
    glow: '#b7623d',
    accent: '#e7bd7b',
    content,
    extraDefs: `
      <radialGradient id="lampGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#ffdca6" stop-opacity=".55" />
        <stop offset=".45" stop-color="#f0a94f" stop-opacity=".22" />
        <stop offset="1" stop-color="#f0a94f" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="heroCurryRed" cx="35%" cy="30%" r="78%">
        <stop offset="0" stop-color="#e8974c" /><stop offset=".55" stop-color="#bd5123" /><stop offset="1" stop-color="#7e2b12" />
      </radialGradient>
      <radialGradient id="heroDal" cx="35%" cy="30%" r="78%">
        <stop offset="0" stop-color="#75503c" /><stop offset=".55" stop-color="#43251a" /><stop offset="1" stop-color="#24110c" />
      </radialGradient>
      <radialGradient id="heroGreen" cx="35%" cy="30%" r="78%">
        <stop offset="0" stop-color="#a4a85b" /><stop offset=".55" stop-color="#65723b" /><stop offset="1" stop-color="#384522" />
      </radialGradient>
      <radialGradient id="heroRaita" cx="35%" cy="30%" r="78%">
        <stop offset="0" stop-color="#fffdf3" /><stop offset=".6" stop-color="#eee2c8" /><stop offset="1" stop-color="#c5ae89" />
      </radialGradient>
      <linearGradient id="naanHero" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#f1d19b" /><stop offset=".55" stop-color="#d6a35e" /><stop offset="1" stop-color="#a06731" />
      </linearGradient>`,
  });
}

export function renderStorySvg() {
  const content = `
    <ellipse cx="450" cy="610" rx="380" ry="300" fill="#000" opacity=".2" filter="url(#softBlur)" />
    <g transform="translate(450 585)" filter="url(#dropShadow)">
      <circle r="246" fill="url(#stone)" />
      <circle r="232" fill="#2b2420" />
      <circle r="208" fill="#1c1714" />
      <ellipse cx="-42" cy="-48" rx="110" ry="70" fill="#fff" opacity=".035" />
      <path d="M-34 -60C32 -44 87 6 96 72C69 39 21 6 -37 -18Z" fill="url(#stoneLight)" opacity=".5" />
    </g>
    <g transform="translate(545 420) rotate(38)" filter="url(#dropShadow)">
      <rect x="-25" y="-240" width="50" height="330" rx="25" fill="url(#pestle)" />
      <ellipse cy="-222" rx="34" ry="42" fill="#8b5a30" />
      <path d="M-12 -215C-4 -230 8 -234 17 -225" fill="none" stroke="#e2b67e" stroke-width="3" opacity=".45" />
    </g>
    <g transform="translate(242 376)" filter="url(#dropShadow)">
      <circle r="86" fill="url(#brass)" />
      <circle r="72" fill="#daa438" />
      <ellipse cx="-18" cy="-20" rx="40" ry="25" fill="#f6ce65" opacity=".5" />
    </g>
    <g transform="translate(694 434)" filter="url(#dropShadow)">
      <circle r="76" fill="url(#brass)" />
      <circle r="63" fill="#98301a" />
      <ellipse cx="-14" cy="-16" rx="34" ry="22" fill="#d0602e" opacity=".55" />
    </g>
    <g transform="translate(250 730)" filter="url(#dropShadow)">
      <circle r="61" fill="url(#brass)" />
      <circle r="49" fill="#786a39" />
      ${cardamom(-12, -8, 1.8, 24)}
      ${cardamom(9, 10, 1.5, -22)}
    </g>
    <g transform="translate(689 736)" filter="url(#dropShadow)">
      <circle r="66" fill="#e6d4b4" />
      <circle r="54" fill="#f8efdd" />
      ${creamSwirl(0, -2, 0.5, 12, '#ddc09a')}
    </g>

    <path d="M84 918C218 848 380 894 468 952C555 1010 700 1012 812 928" fill="none" stroke="#f1dec0" stroke-width="2" opacity=".18" />
    <path d="M64 956C212 880 378 930 476 988C573 1044 708 1042 826 960" fill="none" stroke="#f1dec0" stroke-width="1.2" opacity=".1" />
    <path d="M114 1000L790 1000" stroke="#f3e2c5" stroke-width="1" opacity=".1" />

    ${starAnise(155, 260, 1.5, 18)}
    ${starAnise(735, 255, 1.1, -10)}
    ${chilli(748, 865, 1.35, -28)}
    ${chilli(587, 955, 1.1, 18)}
    ${cardamom(319, 930, 1.6, -18)}
    ${cardamom(352, 968, 1.3, 12)}
    ${leaf(684, 943, 1.25, 170, '#435a31')}
    ${leaf(703, 961, 1, -160, '#55703b')}
    ${marigold(807, 820, 17, '#ce8c2d')}
    ${marigold(846, 850, 12, '#b87328')}
    ${rosePetal(135, 884, 1, 25, '#b56353')}
    <g transform="translate(940 585) rotate(12)">
      <path d="M0 0C-34 -4 -64 18 -72 48C-38 42 -12 24 0 0Z" fill="#d9bd90" opacity=".55" />
      <rect x="-7" y="36" width="14" height="132" rx="7" fill="#b38b55" opacity=".6" />
    </g>
    <g transform="translate(125 1060)" opacity=".5">
      <ellipse rx="150" ry="28" fill="#e9d7b9" opacity=".14" />
      <path d="M-120 -2H120" stroke="#f0dfc2" stroke-width="1.4" opacity=".4" />
    </g>
  `;

  return wrapSvg({
    width: 900,
    height: 1100,
    bg: ['#34251a', '#130d08'],
    glow: '#a3703d',
    accent: '#dfb87c',
    content,
    extraDefs: `
      <radialGradient id="stone" cx="36%" cy="28%" r="80%">
        <stop offset="0" stop-color="#887d70" /><stop offset=".55" stop-color="#4d453d" /><stop offset="1" stop-color="#2a2420" />
      </radialGradient>
      <linearGradient id="stoneLight" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#fff" stop-opacity=".35" /><stop offset="1" stop-color="#fff" stop-opacity="0" />
      </linearGradient>
      <linearGradient id="pestle" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#c69764" /><stop offset=".55" stop-color="#8f5f36" /><stop offset="1" stop-color="#55351e" />
      </linearGradient>`,
  });
}

export function renderVisitSvg() {
  const arch = (x, width, top, height, opacity) => `
    <g opacity="${opacity}">
      <path d="M${x} ${650}V${top + 110}C${x} ${top + 20} ${x + width * 0.28} ${top} ${x + width / 2} ${top}C${x + width * 0.72} ${top} ${x + width} ${top + 20} ${x + width} ${top + 110}V650Z" fill="url(#archGlow)" stroke="#d7ad73" stroke-width="1.4" />
      <path d="M${x + 18} 650V${top + 120}C${x + 18} ${top + 44} ${x + width * 0.3} ${top + 24} ${x + width / 2} ${top + 24}C${x + width * 0.7} ${top + 24} ${x + width - 18} ${top + 44} ${x + width - 18} ${top + 120}V650Z" fill="none" stroke="#f1d7ab" stroke-width=".8" opacity=".22" />
      <path d="M${x + width / 2} ${top + 24}V650" stroke="#e8c996" stroke-width="1" opacity=".13" />
      <path d="M${x + 18} ${top + 260}H${x + width - 18}" stroke="#e8c996" stroke-width="1" opacity=".1" />
    </g>`;

  const table = (x, y, scale) => `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <ellipse cy="16" rx="112" ry="22" fill="#000" opacity=".32" filter="url(#softBlur)" />
      <path d="M-10 12h20v92h-20z" fill="#2b1510" opacity=".8" />
      <ellipse rx="105" ry="31" fill="#e6d3b3" />
      <ellipse rx="99" ry="27" fill="#f5e9d4" />
      <ellipse cx="-33" cy="-4" rx="21" ry="11" fill="#d8b474" />
      <ellipse cx="33" cy="-4" rx="21" ry="11" fill="#d8b474" />
      <circle cx="0" cy="-6" r="4" fill="#ffe4a8" />
      <circle cx="0" cy="-6" r="28" fill="url(#candleGlow)" />
      <path d="M0 -5V-23" stroke="#f4d59d" stroke-width="2" />
      <path d="M-45 8C-18 1 18 1 45 8" stroke="#c8a575" stroke-width="1" opacity=".3" fill="none" />
    </g>`;

  const plant = (x, y, scale) => `
    <g transform="translate(${x} ${y}) scale(${scale})">
      <path d="M-26 0H26L18 84H-18Z" fill="#4b2a1b" />
      <path d="M0 -5C-10 -44 -40 -58 -55 -78M0 -5C4 -50 28 -70 48 -86M0 -5C-2 -60 -10 -84 -8 -108M0 -5C18 -40 21 -55 20 -76" fill="none" stroke="#53613a" stroke-width="3" />
      ${leaf(-38, -65, 1.1, -155, '#3f5733')}
      ${leaf(24, -74, 1.2, -30, '#4d673b')}
      ${leaf(-5, -96, 1.05, -115, '#567140')}
      ${leaf(13, -46, 0.8, 20, '#425b33')}
    </g>`;

  const content = `
    <path d="M0 645H1200V800H0Z" fill="#180b09" opacity=".7" />
    <path d="M0 660C244 638 378 676 600 658C810 642 965 654 1200 640V800H0Z" fill="url(#floorGlow)" opacity=".8" />
    ${arch(100, 300, 200, 450, 0.8)}
    ${arch(450, 300, 120, 530, 1)}
    ${arch(800, 300, 210, 440, 0.72)}

    <g opacity=".9">
      <path d="M600 0V188" stroke="#6f4c2b" stroke-width="2" />
      <circle cx="600" cy="202" r="78" fill="url(#candleGlow)" />
      <path d="M566 226C574 186 626 186 634 226C620 241 580 241 566 226Z" fill="url(#brass)" />
      <circle cx="600" cy="231" r="8" fill="#ffe6b1" />
      <path d="M252 0V154" stroke="#6f4c2b" stroke-width="2" />
      <circle cx="252" cy="170" r="55" fill="url(#candleGlow)" />
      <path d="M228 184C234 156 270 156 276 184C266 195 238 195 228 184Z" fill="url(#brass)" />
      <circle cx="252" cy="188" r="6" fill="#ffe6b1" />
      <path d="M946 0V176" stroke="#6f4c2b" stroke-width="2" />
      <circle cx="946" cy="192" r="58" fill="url(#candleGlow)" />
      <path d="M921 206C927 178 965 178 971 206C961 218 931 218 921 206Z" fill="url(#brass)" />
      <circle cx="946" cy="210" r="6" fill="#ffe6b1" />
    </g>

    ${plant(78, 620, 1.05)}
    ${plant(1125, 630, 0.95)}
    ${table(294, 648, 0.92)}
    ${table(872, 622, 0.78)}
    ${table(598, 708, 1.04)}

    <ellipse cx="600" cy="735" rx="140" ry="14" fill="#000" opacity=".2" filter="url(#softBlur)" />
    <path d="M470 706C516 690 566 687 604 692" fill="none" stroke="#f3dfbb" stroke-width="1" opacity=".16" />
    ${steam(600, 520, 0.7, 0.05)}

    <g opacity=".55">
      ${starAnise(1044, 690, 1.2, 12)}
      ${marigold(160, 704, 14, '#c8882b')}
      ${rosePetal(988, 735, 1, 22, '#b8665a')}
    </g>
    <path d="M0 641H1200" stroke="#e5c28e" stroke-width="1" opacity=".1" />
  `;

  return wrapSvg({
    width: 1200,
    height: 800,
    bg: ['#2d1411', '#100706'],
    glow: '#9a5f38',
    accent: '#d7b077',
    content,
    extraDefs: `
      <radialGradient id="candleGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0" stop-color="#ffd48b" stop-opacity=".55" /><stop offset=".55" stop-color="#e7a153" stop-opacity=".18" /><stop offset="1" stop-color="#e7a153" stop-opacity="0" />
      </radialGradient>
      <linearGradient id="archGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#7d4b31" stop-opacity=".7" /><stop offset=".55" stop-color="#48251a" stop-opacity=".55" /><stop offset="1" stop-color="#1b0d09" stop-opacity=".8" />
      </linearGradient>
      <linearGradient id="floorGlow" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#6d3d28" stop-opacity=".45" /><stop offset="1" stop-color="#170b08" stop-opacity="0" />
      </linearGradient>`,
  });
}
