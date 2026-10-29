// Questlog cartoon art: a chunky, determined hero facing the viewer, plus gear and the streak flame.
// Flat colours with a darker side tone and one thick dark outline, like a mobile action game sticker.
// Viewer's left is the hero's right; the shield arm is on the viewer's left, the weapon hand on the right.

const INK = "#1b1530";
const SW = 3.4; // outline width

const st = (fill, extra = "") => `fill="${fill}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra}`;
const noStroke = (fill, extra = "") => `fill="${fill}" stroke="none" ${extra}`;
const outlineOnly = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`;

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/* ---------- gear (hero coordinates) ---------- */
// weapon hand at (87.5, 102); shield on the other arm around (32, 98)
const SHIELD = "M20 80 L44 80 L44 98 Q44 112 32 118 Q20 112 20 98 Z";
const CAPE = "M42 70 L78 70 L94 124 Q60 133 26 124 Z";
const HELM = "M26 58 L26 30 Q26 4 60 4 Q94 4 94 30 L94 58 L84 58 L84 34 L36 34 L36 58 Z";
const CROWN = "M38 16 L36 -4 L48 6 L60 -10 L72 6 L84 -4 L82 16 Z";
const ITEMS = {
  sword: () => `
    <path d="M87.5 40 L92.5 48 L92.5 92 L82.5 92 L82.5 48 Z" ${st("#e3e9f5")}/>
    <path d="M87.5 47 L87.5 90" stroke="#aeb9cf" stroke-width="2.4" fill="none"/>
    <rect x="75" y="91" width="25" height="7" rx="2.5" ${st("#c98a2e")}/>
    <rect x="84" y="97" width="7" height="12" rx="2" ${st("#5e3a1f")}/>`,
  staff: () => `
    <rect x="84.5" y="34" width="6" height="90" rx="3" ${st("#8a5a2b")}/>
    <circle cx="87.5" cy="27" r="14" ${noStroke("#5ff0ff", 'opacity=".22"')}/>
    <path d="M87.5 16 L97 27 L87.5 38 L78 27 Z" ${st("#4fe3ff")}/>
    <path d="M87.5 20 L92 27 L87.5 27 Z" ${noStroke("#ffffff", 'opacity=".75"')}/>`,
  shield: () => `
    <path d="${SHIELD}" ${noStroke("#9c6230")}/>
    <path d="M20 80 L26 80 L26 113 Q22 108 20 98 Z" ${noStroke(shade("#9c6230", -0.3))}/>
    ${outlineOnly(SHIELD)}
    <path d="M32 84 L32 112 M24 94 L40 94" stroke="#e8b33a" stroke-width="4" stroke-linecap="round"/>`,
  cape: () => `<path d="${CAPE}" ${st("#c8362f")}/>
    <path d="M36 92 L30 118 M84 92 L90 118" stroke="${shade("#c8362f", -0.3)}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  goldcape: () => `<path d="${CAPE}" ${st("#6a34b0")}/>
    <path d="M28.5 117 Q60 126 91.5 117 L94 124 Q60 133 26 124 Z" ${st("#f1b829")}/>`,
  hat: () => `
    <ellipse cx="60" cy="17" rx="40" ry="8.5" ${st("#3f3596")}/>
    <path d="M38 15 Q50 -8 72 -20 Q64 -6 70 4 Q76 10 82 15 Z" ${st("#4a3fb0")}/>
    <path d="M40 12 Q60 17 80 12" stroke="#e8b33a" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
  helm: () => `
    <path d="${HELM}" ${noStroke("#a9b4c8")}/>
    <path d="M26 58 L26 30 Q26 10 40 6 Q32 20 34 34 L36 34 L36 58 Z" ${noStroke(shade("#a9b4c8", -0.28))}/>
    ${outlineOnly(HELM)}
    <path d="M44 14 Q60 8 78 12" stroke="#ffffff" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>
    <path d="M60 5 Q54 -8 64 -16 Q72 -4 64 5 Z" ${st("#c3283e")}/>`,
  crown: () => `
    <path d="${CROWN}" ${noStroke("#f2bb2a")}/>
    <path d="M38 16 L36 -4 L44 3 L44 16 Z" ${noStroke(shade("#f2bb2a", -0.25))}/>
    ${outlineOnly(CROWN)}
    <rect x="56" y="3" width="8" height="8" rx="1.5" transform="rotate(45 60 7)" ${st("#d8233f")}/>`,
};
// viewBox for each item shown alone: [x, y, w, h]
const ITEM_BOX = {
  sword: [62, 36, 52, 76], staff: [62, 10, 52, 116], shield: [12, 76, 40, 46], cape: [20, 64, 80, 74],
  goldcape: [20, 64, 80, 74], hat: [16, -24, 88, 46], helm: [20, -20, 80, 82], crown: [30, -14, 60, 34],
};

/* ---------- hair (hero coordinates, head spans x 29..91, y 10..66) ---------- */
const CAP = "M28 50 L27 30 Q27 6 60 6 Q93 6 93 30 L92 50 Q88 34 80 30 Q74 36 67 30 Q60 36 53 30 Q46 36 40 30 Q32 34 28 50 Z";
const SPIKY = "M28 50 L20 32 L31 30 L28 10 L43 18 L50 -2 L60 12 L70 -2 L77 18 L92 10 L89 30 L100 32 L92 50 Q88 34 80 30 Q70 36 60 30 Q50 36 40 30 Q32 34 28 50 Z";
function hairBack(style, c) {
  const d = shade(c, -0.22);
  if (style === "long") return `<path d="M27 30 Q26 6 60 6 Q94 6 93 30 L97 96 Q87 102 80 92 L80 60 L40 60 L40 92 Q33 102 23 96 Z" ${st(d)}/>`;
  if (style === "ponytail") return `<path d="M78 16 Q104 22 104 54 Q102 76 110 88 Q92 90 90 68 Q88 48 76 34 Z" ${st(d)}/>`;
  if (style === "bun") return `<circle cx="60" cy="2" r="12" ${st(d)}/>`;
  return "";
}
function hairFront(style, c) {
  const d = shade(c, -0.22), hi = shade(c, 0.3);
  const shaped = (path, dark) => `<path d="${path}" ${noStroke(c)}/>${dark}${outlineOnly(path)}`;
  switch (style) {
    case "short": case "bun": case "ponytail": case "long":
      return shaped(CAP, `<path d="M28 50 L27 30 Q27 10 42 7 Q34 20 35 34 Q30 40 28 50 Z" ${noStroke(d)}/>`) +
        `<path d="M48 13 Q60 10 72 13" stroke="${hi}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
    case "spiky":
      return shaped(SPIKY, `<path d="M28 50 L20 32 L31 30 L28 10 L40 16 Q34 26 35 34 Q30 40 28 50 Z" ${noStroke(d)}/>`);
    default:
      return `<path d="M48 16 Q60 12 72 15" stroke="#ffffff" stroke-width="3.5" fill="none" opacity=".35" stroke-linecap="round"/>`;
  }
}

/* ---------- poses ---------- */
export const POSES = {
  stand: "Standing", crossed: "Arms crossed", behind: "Behind back",
  hips: "Hands on hips", fist: "Fist pump", think: "Thinking",
};

/* ---------- the hero ---------- */
// p: { body:"m"|"f", hair, hairColor, skin, tunic, pose, head, back, hand, off }
export function heroSVG(p, opts = {}) {
  const female = p.body === "f";
  const skin = p.skin, skinD = shade(skin, -0.2);
  const tunic = p.tunic, tunicD = shade(tunic, -0.3);
  const pants = "#343c6e", boot = "#4a2f1c";
  const box = opts.head ? "14 -22 92 92" : "-2 -26 124 162";
  const item = (k) => (k && ITEMS[k] ? ITEMS[k]() : "");
  const pose = POSES[p.pose] ? p.pose : "stand";
  const holds = pose === "stand"; // only standing holds gear; other poses carry it on the back

  // legs and boots, straight on
  const leg = (x) => `<rect x="${x}" y="${female ? 104 : 96}" width="13" height="${female ? 14 : 22}" rx="5" ${st(female ? skin : pants)}/>
    <path d="M${x - 3} 127 L${x - 3} 117 Q${x - 3} 112 ${x + 3} 112 L${x + 10} 112 Q${x + 16} 112 ${x + 16} 117 L${x + 16} 127 Z" ${st(boot)}/>`;
  const legs = leg(46) + leg(61);

  // torso with a darker strip down the hero's right side (viewer's left)
  const bottom = female ? 104 : 100;
  const T = `M38 78 Q38 68 48 68 L72 68 Q82 68 82 78 L82 ${bottom} L38 ${bottom} Z`;
  const torso = `<path d="${T}" ${noStroke(tunic)}/>
    <path d="M38 78 Q38 68 48 68 L49 68 Q45 76 45 ${bottom} L38 ${bottom} Z" ${noStroke(tunicD)}/>
    ${outlineOnly(T)}
    <path d="M54 68 L60 80 L66 68 Z" ${st(skinD)}/>`;
  const SK = "M37 96 L83 96 L91 115 Q60 123 29 115 Z";
  const skirt = female ? `<path d="${SK}" ${noStroke(tunic)}/><path d="M37 96 L44 96 L40 118 Q34 117 29 115 Z" ${noStroke(tunicD)}/>${outlineOnly(SK)}` : "";
  const by = female ? 92 : 88;
  const belt = `<path d="M37 ${by} L83 ${by} L83 ${by + 8} L37 ${by + 8} Z" ${st("#5a3820")}/><rect x="55" y="${by - 1}" width="10" height="10" rx="1.5" ${st("#e8b33a")}/>`;

  // arms: a bent arm is a thick rounded stroke drawn twice, outline underneath and sleeve on top
  const limb = (d, fill, w = 13) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + SW * 2}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const hand = (x, y, c = skin, r = 6.8) => `<circle cx="${x}" cy="${y}" r="${r}" ${st(c)}/>`;
  const armL = (x) => `<rect x="${x}" y="72" width="13" height="28" rx="6.5" ${st(tunicD)}/>`;
  const armR = (x) => `<rect x="${x}" y="72" width="13" height="28" rx="6.5" ${st(tunic)}/>`;
  let behindArms = "", frontArms = "";
  switch (pose) {
    case "crossed":
      frontArms = limb("M86 76 L84 86 L46 86", tunic) + hand(44, 86) + limb("M34 76 L36 92 L76 92", tunicD) + hand(78, 92);
      break;
    case "behind":
      behindArms = limb("M33 76 L42 98", tunicD) + limb("M87 76 L78 98", tunic);
      break;
    case "hips":
      frontArms = limb("M33 76 L21 87 L37 96", tunicD) + hand(38, 96) + limb("M87 76 L99 87 L83 96", tunic) + hand(82, 96);
      break;
    case "fist":
      frontArms = limb("M33 76 L21 60 L25 44", tunicD) + hand(25, 40, skin, 7.6) +
        `<path d="M21 37.5 L29 37.5 M21 41.5 L29 41.5" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>` +
        armR(81) + hand(87.5, 102);
      break;
    case "think":
      frontArms = limb("M87 76 L86 88 L60 92", tunic) + hand(58, 92) + limb("M33 76 L38 92 L56 66", tunicD) + hand(58, 62);
      break;
    default:
      frontArms = armL(26) + hand(32.5, 102) + item(p.off) + armR(81) + item(p.hand) + hand(87.5, 102);
  }
  // gear carried on the back in non-standing poses: weapon diagonal with the grip over the shoulder, shield behind
  const slungWeapon = !holds && p.hand && ITEMS[p.hand]
    ? (p.hand === "staff"
      ? `<g transform="translate(10 12) rotate(28 87.5 27)">${ITEMS.staff()}</g>`
      : `<g transform="translate(8 -36) rotate(-140 87.5 103)">${ITEMS[p.hand]()}</g>`)
    : "";
  const slungShield = !holds && p.off && ITEMS[p.off] ? `<g transform="translate(46 -10)">${ITEMS[p.off]()}</g>` : "";

  const lash = female ? `<path d="M47 40 L43.5 37.5 M73 40 L76.5 37.5" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>` : "";
  const H = "M29 27 Q29 10 46 10 L74 10 Q91 10 91 27 L91 49 Q91 66 74 66 L46 66 Q29 66 29 49 Z";
  const head = `
    <rect x="52" y="60" width="16" height="10" rx="3" ${st(skinD)}/>
    <ellipse cx="29" cy="42" rx="5.5" ry="7.5" ${st(skin)}/><ellipse cx="91" cy="42" rx="5.5" ry="7.5" ${st(skin)}/>
    <path d="${H}" ${noStroke(skin)}/>
    <path d="M29 27 Q29 10 46 10 L44 10 Q36 30 38 66 L46 66 Q29 66 29 49 Z" ${noStroke(skinD)}/>
    ${outlineOnly(H)}
    <path d="M43 33 L54 35.5" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M66 35.5 L77 33" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>
    <rect x="46.5" y="39" width="5.5" height="9" rx="2.7" ${noStroke(INK)}/>
    <rect x="68" y="39" width="5.5" height="9" rx="2.7" ${noStroke(INK)}/>
    ${lash}
    <path d="M54 56 L66 56" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;

  const shadow = opts.head ? "" : `<ellipse cx="60" cy="128" rx="34" ry="5.5" fill="#000" opacity=".28"/>`;
  return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    ${shadow}
    ${item(p.back)}${slungShield}${slungWeapon}${hairBack(p.hair, p.hairColor)}${behindArms}
    ${legs}
    ${torso}${skirt}${belt}
    ${head}
    ${hairFront(p.hair, p.hairColor)}
    ${item(p.head)}
    ${frontArms}
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
