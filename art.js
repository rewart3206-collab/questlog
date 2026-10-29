// Questlog cartoon art: a chunky chibi hero, gear and the streak flame, all as inline SVG.
// Everything shares one thick dark outline so it reads like a mobile game sticker.

const INK = "#1d1530";
const SW = 3.2; // outline width

const st = (fill, extra = "") => `fill="${fill}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra}`;
const noStroke = (fill, extra = "") => `fill="${fill}" stroke="none" ${extra}`;

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/* ---------- gear pieces (drawn in hero coordinates) ---------- */
const ITEMS = {
  sword: () => `
    <path d="M86.5 44 L91.5 52 L91.5 96 L81.5 96 L81.5 52 Z" ${st("#e6ecf7")}/>
    <path d="M86.5 50 L86.5 94" stroke="#b9c3d8" stroke-width="2" fill="none"/>
    <rect x="74" y="94" width="25" height="7" rx="3.5" ${st("#e0a53a")}/>
    <rect x="83" y="100" width="7" height="13" rx="2" ${st("#7a4a25")}/>`,
  staff: () => `
    <rect x="83.5" y="38" width="6" height="86" rx="3" ${st("#9a6331")}/>
    <circle cx="86.5" cy="32" r="14" ${noStroke("#6ff0ff", 'opacity=".25"')}/>
    <circle cx="86.5" cy="32" r="9.5" ${st("#62e6ff")}/>
    <circle cx="83.5" cy="29" r="3" ${noStroke("#ffffff")}/>`,
  shield: () => `
    <circle cx="30" cy="97" r="16" ${st("#b06f34")}/>
    <circle cx="30" cy="97" r="11" fill="none" stroke="#f4c542" stroke-width="3"/>
    <circle cx="30" cy="97" r="4.5" ${st("#f4c542")}/>`,
  cape: () => `<path d="M42 72 L78 72 L92 124 Q60 132 28 124 Z" ${st("#d8403a")}/>
    <path d="M60 76 L60 126" stroke="${shade("#d8403a", -0.25)}" stroke-width="3" fill="none"/>`,
  goldcape: () => `<path d="M42 72 L78 72 L92 124 Q60 132 28 124 Z" ${st("#7b3fc4")}/>
    <path d="M31 116 Q60 124 89 116 L92 124 Q60 132 28 124 Z" ${st("#f4c542")}/>`,
  hat: () => `
    <path d="M38 22 Q50 -6 76 -14 Q70 -4 74 6 Q80 14 84 22 Z" ${st("#5446c9")}/>
    <ellipse cx="60" cy="23" rx="40" ry="8" ${st("#5446c9")}/>
    <path d="M42 18 Q60 22 80 18" stroke="#f4c542" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M62 2 l2.2 4.6 5 .7 -3.6 3.5 .9 5 -4.5 -2.4 -4.5 2.4 .9 -5 -3.6 -3.5 5 -.7 Z" ${noStroke("#ffd84a")}/>`,
  helm: () => `
    <path d="M27 50 Q27 12 60 12 Q93 12 93 50 L93 58 Q88 60 84 56 L84 40 L36 40 L36 56 Q32 60 27 58 Z" ${st("#b8c3d6")}/>
    <path d="M36 40 L84 40" stroke="${INK}" stroke-width="${SW}"/>
    <path d="M40 20 Q60 12 80 20" stroke="#ffffff" stroke-width="3" fill="none" opacity=".6"/>
    <path d="M60 12 Q58 0 66 -6 Q70 4 64 12 Z" ${st("#e0314b")}/>`,
  crown: () => `
    <path d="M38 24 L36 4 L48 14 L60 -2 L72 14 L84 4 L82 24 Z" ${st("#ffcc33")}/>
    <circle cx="60" cy="16" r="3.6" ${st("#e0314b")}/>
    <circle cx="46" cy="19" r="2.6" ${noStroke("#4cc3ff")}/><circle cx="74" cy="19" r="2.6" ${noStroke("#4cc3ff")}/>`,
};
// Icon framing for each item when shown on its own: [x, y, w, h] of the viewBox.
const ITEM_BOX = {
  sword: [62, 40, 50, 76], staff: [62, 14, 50, 112], shield: [8, 75, 44, 44], cape: [22, 66, 76, 70],
  goldcape: [22, 66, 76, 70], hat: [16, -20, 88, 52], helm: [20, -12, 80, 74], crown: [30, -8, 60, 38],
};

/* ---------- hair (drawn in hero coordinates) ---------- */
function hairBack(style, c) {
  if (style === "long") return `<path d="M27 44 Q26 10 60 10 Q94 10 93 44 L96 92 Q88 100 80 90 L80 62 L40 62 L40 90 Q32 100 24 92 Z" ${st(c)}/>`;
  if (style === "ponytail") return `<path d="M84 26 Q108 30 106 62 Q104 80 112 92 Q94 92 92 70 Q90 50 80 40 Z" ${st(c)}/>`;
  return "";
}
function hairFront(style, c) {
  const hi = shade(c, 0.35);
  const fringe = `<path d="M29 48 Q27 14 60 13 Q93 14 91 48 Q86 36 78 33 Q72 42 62 34 Q52 42 44 34 Q36 37 29 48 Z" ${st(c)}/>
    <path d="M42 22 Q52 17 62 18" stroke="${hi}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  switch (style) {
    case "short": return fringe;
    case "long": return `<path d="M28 50 Q26 12 60 12 Q94 12 92 50 Q88 34 74 30 Q64 40 44 34 Q34 38 28 50 Z" ${st(c)}/>
      <path d="M44 22 Q54 16 66 18" stroke="${hi}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case "spiky": return `<path d="M28 50 L24 26 L38 30 L38 8 L52 22 L60 2 L68 22 L82 8 L82 30 L96 26 L92 50 Q86 36 76 35 Q60 44 44 35 Q34 36 28 50 Z" ${st(c)}/>
      <path d="M46 24 L52 16" stroke="${hi}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    case "bun": return `<circle cx="60" cy="10" r="12" ${st(c)}/>${fringe}`;
    case "ponytail": return fringe;
    default: return `<ellipse cx="48" cy="24" rx="9" ry="4" transform="rotate(-20 48 24)" ${noStroke("#ffffff", 'opacity=".35"')}/>`;
  }
}

/* ---------- the hero ---------- */
// p: { body:"m"|"f", hair, hairColor, skin, tunic, head, back, hand, off }
export function heroSVG(p, opts = {}) {
  const skin = p.skin, tunic = p.tunic, tunicDark = shade(tunic, -0.28);
  const pants = "#3b4377", boot = "#5b3a22";
  const female = p.body === "f";
  const box = opts.head ? "12 -18 96 96" : "0 -22 120 158";
  const backItem = p.back && ITEMS[p.back] ? ITEMS[p.back]() : "";
  const headItem = p.head && ITEMS[p.head] ? ITEMS[p.head]() : "";
  const handItem = p.hand && ITEMS[p.hand] ? ITEMS[p.hand]() : "";
  const offItem = p.off && ITEMS[p.off] ? ITEMS[p.off]() : "";
  const legFill = female ? skin : pants;
  const leg = (x) => `<rect x="${x}" y="${female ? 106 : 94}" width="12" height="${female ? 14 : 26}" rx="5" ${st(legFill)}/>
      <path d="M${x - 3} 124 Q${x - 3} 112 ${x + 6} 112 Q${x + 15} 112 ${x + 15} 124 Z" ${st(boot)}/>`;
  const bottom = female ? 108 : 100;
  const torso = `<path d="M40 80 Q40 70 50 70 L70 70 Q80 70 80 80 L82 ${bottom - 4} Q82 ${bottom} 77 ${bottom} L43 ${bottom} Q38 ${bottom} 38 ${bottom - 4} Z" ${st(tunic)}/>
      <path d="M44 74 Q50 72 56 73" stroke="${shade(tunic, 0.35)}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  const skirt = female ? `<path d="M40 98 L80 98 L90 116 Q60 124 30 116 Z" ${st(tunic)}/>
      <path d="M46 104 L42 116 M60 104 L60 119 M74 104 L78 116" stroke="${tunicDark}" stroke-width="2.5" fill="none" stroke-linecap="round"/>` : "";
  const by = female ? 94 : 88;
  const belt = `<rect x="38" y="${by}" width="44" height="8" rx="3" ${st("#6b4428")}/><rect x="55" y="${by - 1}" width="10" height="10" rx="2" ${st("#f4c542")}/>`;
  const armL = `<g class="arm-l"><rect x="27" y="74" width="13" height="26" rx="6.5" ${st(tunic)}/><circle cx="33.5" cy="102" r="6.5" ${st(skin)}/></g>`;
  const armR = `<g class="arm-r"><rect x="80" y="74" width="13" height="26" rx="6.5" ${st(tunic)}/>${handItem}<circle cx="86.5" cy="102" r="6.5" ${st(skin)}/></g>`;
  const lash = female ? `<path d="M42.6 48.5 l-3.6 -1.6 M42.4 51.5 l-3.8 .2 M77.4 48.5 l3.6 -1.6 M77.6 51.5 l3.8 .2" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>` : "";
  const head = `
    <rect x="53" y="66" width="14" height="8" rx="3" ${st(skin)}/>
    <circle cx="30" cy="52" r="6.5" ${st(skin)}/><circle cx="90" cy="52" r="6.5" ${st(skin)}/>
    <ellipse cx="60" cy="44" rx="31" ry="29" ${st(skin)}/>
    <ellipse cx="47" cy="52" rx="5" ry="6.6" ${noStroke(INK)}/><ellipse cx="73" cy="52" rx="5" ry="6.6" ${noStroke(INK)}/>
    <circle cx="48.8" cy="49.4" r="1.9" ${noStroke("#ffffff")}/><circle cx="74.8" cy="49.4" r="1.9" ${noStroke("#ffffff")}/>
    ${lash}
    <ellipse cx="39" cy="61" rx="5.5" ry="3.2" ${noStroke("#ff7f7f", `opacity="${female ? 0.55 : 0.35}"`)}/>
    <ellipse cx="81" cy="61" rx="5.5" ry="3.2" ${noStroke("#ff7f7f", `opacity="${female ? 0.55 : 0.35}"`)}/>
    <path d="M55 62 Q60 67 65 62" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  const shadow = opts.head ? "" : `<ellipse cx="60" cy="127" rx="30" ry="5" fill="#000" opacity=".28"/>`;
  return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    ${shadow}
    <g class="upper">${backItem}${hairBack(p.hair, p.hairColor)}</g>
    <g class="leg-l">${leg(46)}</g><g class="leg-r">${leg(62)}</g>
    <g class="upper">
      ${torso}${skirt}${belt}
      ${armL}${offItem}${armR}
      ${head}
      ${hairFront(p.hair, p.hairColor)}
      ${headItem}
    </g>
  </svg>`;
}

/* ---------- single item icons ---------- */
export function itemSVG(id, colour) {
  if (id.startsWith("dye")) {
    return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="23" y="6" width="14" height="10" rx="3" ${st("#c9a06a")}/>
      <path d="M24 16 L36 16 L36 22 Q50 28 50 40 Q50 54 30 54 Q10 54 10 40 Q10 28 24 22 Z" ${st("#e8eefc")}/>
      <path d="M12.5 40 Q14 34 20 36 Q30 40 40 36 Q47 34 47.5 40 Q47 51 30 51 Q13 51 12.5 40 Z" ${noStroke(colour)}/>
      <ellipse cx="20" cy="30" rx="3" ry="5" ${noStroke("#ffffff", 'opacity=".7"')}/>
    </svg>`;
  }
  const [x, y, w, h] = ITEM_BOX[id];
  return `<svg viewBox="${x} ${y} ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${ITEMS[id]()}</svg>`;
}

/* ---------- streak flame ---------- */
export function flameSVG() {
  return `<svg viewBox="0 0 60 72" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="flame-svg">
    <g class="fl-outer"><path d="M30 3 C37 17 53 24 53 46 C53 61 43 69 30 69 C17 69 7 61 7 46 C7 33 15 27 17 15 C22 25 25 25 26 19 C27 13 28 8 30 3 Z" ${st("#ff6a2b")}/></g>
    <g class="fl-mid"><path d="M30 22 C35 31 45 36 45 50 C45 60 38 65 30 65 C22 65 15 60 15 50 C15 42 20 38 22 31 C25 37 28 34 30 22 Z" ${noStroke("#ffb23d")}/></g>
    <g class="fl-core"><path d="M30 38 C34 44 39 47 39 54 C39 60 35 63 30 63 C25 63 21 60 21 54 C21 48 26 46 30 38 Z" ${noStroke("#ffe98a")}/></g>
  </svg>`;
}
