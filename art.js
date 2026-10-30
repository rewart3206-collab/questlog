// Questlog hero art: a taller, cooler cartoon adventurer for an idle-RPG look.
// Thick dark outline, flat colours with one shadow and one highlight tone per material.
// Front facing; the viewer's left is the shield arm, the right hand holds the weapon.

const INK = "#1c1430";
const SW = 2.6;
const st = (f, x = "") => `fill="${f}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${x}`;
const ff = (f, x = "") => `fill="${f}" stroke="none" ${x}`;
const ol = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round"/>`;
export function shade(hex, a) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (a < 0 ? c * a : (255 - c) * a))));
  return "#" + ((1 << 24) | (f(n >> 16) << 16) | (f((n >> 8) & 255) << 8) | f(n & 255)).toString(16).slice(1);
}
// a shape with optional shadow and highlight regions, then its outline
const part = (d, c, dark, light) => `<path d="${d}" ${ff(c)}/>${dark ? `<path d="${dark}" ${ff(shade(c, -0.3))}/>` : ""}${light ? `<path d="${light}" ${ff(shade(c, 0.3))}/>` : ""}${ol(d)}`;
// a limb: thick rounded stroke over a slightly thicker outline stroke
const limb = (d, c, w) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + SW * 2}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
const GOLD = "#f2b631", STEEL = "#c3cddd", LEATHER = "#8a5430", DLEATHER = "#5e3a22";

const TEE = "#4f86d8", PANTS = "#5a4636", SHOE = "#4a2f1c";
/* ---------------- head ---------------- */
function head(p) {
  const s = p.skin, sd = shade(s, -0.22), f = p.body === "f";
  const H = f
    ? "M33 27 Q33 9 50 9 Q67 9 67 27 L67 35 Q65 46 57 51 Q50 54 43 51 Q35 46 33 35 Z"
    : "M33 27 Q33 9 50 9 Q67 9 67 27 L67 35 Q66 47 57 51 Q50 54 43 51 Q34 47 33 35 Z";
  const eye = (cx, m, side) => `
    <path d="M${cx - 5} 33 Q${cx} 29.5 ${cx + 5} 33 Q${cx} 35.5 ${cx - 5} 33 Z" ${ff("#ffffff")}/>
    <circle cx="${cx + m}" cy="33" r="2.4" ${ff("#3b2414")}/><circle cx="${cx + m}" cy="33" r="1.2" ${ff(INK)}/>
    <circle cx="${cx + m + 0.8}" cy="32.2" r=".7" ${ff("#fff")}/>
    <path d="M${cx - 5.5} 32.8 Q${cx} 28.8 ${cx + 5.5} 32.2" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>
    ${f ? `<path d="M${cx + side * 5.2} 32.4 l${side * 2.6} -1.8" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>` : ""}`;
  const brow = shade(p.hairColor, -0.35);
  return `
    <path d="M44 48 L56 48 L57 58 L43 58 Z" ${st(sd)}/>
    <ellipse cx="32.5" cy="34" rx="3.6" ry="5.2" ${st(s)}/><ellipse cx="67.5" cy="34" rx="3.6" ry="5.2" ${st(s)}/>
    ${part(H, s, "M33 27 Q33 12 42 10 Q37 22 38 36 Q39 46 45 52 Q36 48 33 36 Z", null)}
    ${eye(42, 0.3, -1)}${eye(58, -0.3, 1)}
    <path d="M36.5 27.5 Q41 25.5 47 27.5" fill="none" stroke="${brow}" stroke-width="${f ? 2.2 : 2.8}" stroke-linecap="round"/>
    <path d="M53 27.5 Q59 25.5 63.5 27.5" fill="none" stroke="${brow}" stroke-width="${f ? 2.2 : 2.8}" stroke-linecap="round"/>
    <path d="M50 35 L48.6 40.5 L51.4 40.5" fill="none" stroke="${sd}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
    ${f ? `<path d="M46.5 44.5 Q50 46.5 53.5 44.5" fill="none" stroke="#b84a4a" stroke-width="2" stroke-linecap="round"/>`
        : `<path d="M45.5 45 Q50 46.8 54.5 44.2" fill="none" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`}`;
}

/* ---------------- hair ---------------- */
const CAP = "M31 34 L30 22 Q30 4 50 3 Q70 4 70 22 L69 34 L66 26 L63 22 L60 17 L56 22 L52 15 L47 21 L42 16 L39 23 L35 21 L34 29 Z";
const CAP_DARK = "M31 34 L30 22 Q30 8 40 4 Q34 14 35 21 L34 29 Z";
const CAP_LIGHT = "M44 7 Q54 4 62 9 Q54 8 46 10 Z";
function hairBack(style, c) {
  const d = shade(c, -0.25);
  if (style === "long") return part("M30 22 Q30 3 50 3 Q70 3 70 22 L73 74 Q66 80 60 72 L58 50 L42 50 L40 72 Q34 80 27 74 Z", d, null, null);
  if (style === "ponytail") return part("M62 10 Q80 12 80 34 Q80 54 86 68 Q72 70 70 54 Q69 36 60 24 Z", d, null, null);
  if (style === "bun") return part("M40 4 Q40 -10 50 -10 Q60 -10 60 4 Z", d, null, null) + `<circle cx="50" cy="-4" r="8" ${st(d)}/>`;
  return "";
}
function hairFront(style, c) {
  const streak = `<path d="M52 15 Q58 8 66 12" fill="none" stroke="${shade(c, -0.3)}" stroke-width="1.6" stroke-linecap="round"/>`;
  switch (style) {
    case "short": case "long": case "bun": case "ponytail":
      return part(CAP, c, CAP_DARK, CAP_LIGHT) + streak;
    case "spiky":
      return part("M31 34 L28 20 L22 16 L30 12 L28 0 L38 6 L42 -6 L50 2 L58 -8 L62 4 L72 -2 L70 10 L78 14 L70 22 L69 34 L66 26 L63 22 L60 17 L56 22 L52 15 L47 21 L42 16 L39 23 L35 21 L34 29 Z",
        c, "M31 34 L28 20 L22 16 L30 12 L28 0 L36 5 Q33 14 35 21 L34 29 Z", "M46 4 L50 2 L54 6 Q50 7 47 8 Z") + streak;
    default:
      return `<path d="M42 14 Q50 11 58 14" fill="none" stroke="#ffffff" stroke-width="2.4" opacity=".45" stroke-linecap="round"/>`;
  }
}

/* ---------------- base clothes and armour ---------------- */
// Everyone wears a T-shirt and trousers. Armour (from chests) is drawn over the T-shirt.
function base(p) {
  const pc = p.pantsColor || PANTS, skin = p.skin, tee = TEE, teeD = shade(tee, -0.3);
  const f = p.body === "f";
  const legs = limb("M44 94 L42 128", pc, 12) + limb("M56 94 L58 128", pc, 12) +
    `<path d="M38 120 Q42 124 47 120 M53 120 Q58 124 62 120" fill="none" stroke="${shade(pc, -0.35)}" stroke-width="2" stroke-linecap="round"/>` +
    part("M33 126 L48 126 L48 146 L30 146 Q29 140 33 137 Z", SHOE, "M33 126 L38 126 L38 146 L30 146 Q29 140 33 137 Z", null) +
    part("M52 126 L67 126 L67 137 Q71 140 70 146 L52 146 Z", SHOE, "M52 126 L56 126 L56 146 L52 146 Z", null);
  const shorts = part("M34 86 L66 86 L67 100 L52 102 L50 96 L48 102 L33 100 Z", pc, "M34 86 L39 86 L38 101 L33 100 Z", null);
  const torso = part(f ? "M33 60 Q35 53 43 53 L57 53 Q65 53 67 60 L66 90 L34 90 Z" : "M32 60 Q34 53 43 53 L57 53 Q66 53 68 60 L67 90 L33 90 Z", tee,
      "M32 60 Q34 54 40 53 Q37 70 39 90 L33 90 Z", "M58 56 Q63 57 65 61 L64 68 Q61 63 57 60 Z") +
    `<path d="M44 53 Q50 59 56 53" ${st(skin)}/>` +
    `<rect x="33" y="86" width="34" height="5" rx="1.5" ${st("#3b2a1e")}/><rect x="47" y="85" width="6" height="7" rx="1.5" ${st("#c9a06a")}/>`;
  const sleeve = (d, c) => part(d, c, null, null);
  const armL = sleeve("M33 56 Q26 58 25 70 L35 72 Q35 64 37 60 Z", teeD) + limb("M30 72 L27 96", skin, 9);
  const armR = sleeve("M67 56 Q74 58 75 70 L65 72 Q65 64 63 60 Z", tee) + limb("M70 72 L73 96", skin, 9);
  return { legs: legs + shorts, torso, armL, armR, handL: [27, 99, skin], handR: [73, 99, skin] };
}
const ARMOUR = {
  // leather vest over the T-shirt, with bracers
  armour_leather: () => ({
    torso: part("M35 56 Q41 54 45 55 L48 88 L35 88 Z", LEATHER, "M35 56 Q38 55 40 55 L40 88 L35 88 Z", null) +
      part("M65 56 Q59 54 55 55 L52 88 L65 88 Z", LEATHER, null, "M60 57 Q63 57 64 60 L63 66 Q61 62 59 60 Z") +
      `<path d="M37 66 L45 66 M37 74 L46 74 M63 66 L55 66 M63 74 L54 74" stroke="${DLEATHER}" stroke-width="2" stroke-linecap="round"/>
       <circle cx="47" cy="70" r="1.6" ${ff(GOLD)}/><circle cx="53" cy="70" r="1.6" ${ff(GOLD)}/>`,
    arms: `<rect x="23" y="82" width="9" height="11" rx="2" transform="rotate(-6 27 88)" ${st(DLEATHER)}/><rect x="68" y="82" width="9" height="11" rx="2" transform="rotate(6 73 88)" ${st(DLEATHER)}/>`,
  }),
  // chainmail shirt with a grey sleeve and a cloth tabard strip
  armour_chain: () => ({
    torso: part("M32 60 Q34 53 43 53 L57 53 Q66 53 68 60 L67 90 L33 90 Z", "#9aa4b5", "M32 60 Q34 54 40 53 Q37 70 39 90 L33 90 Z", null) +
      `<path d="M36 62 Q50 66 64 62 M35 70 Q50 74 65 70 M35 78 Q50 82 65 78" fill="none" stroke="#6c7686" stroke-width="1.6" stroke-dasharray="2 2"/>` +
      part("M44 56 L56 56 L57 92 L50 96 L43 92 Z", "#8a2f36", "M44 56 L47 56 L46 94 L43 92 Z", null) +
      `<path d="M50 62 L53 66 L50 70 L47 66 Z" ${ff(GOLD)}/>`,
    arms: part("M33 56 Q24 58 23 74 L35 74 Q35 64 37 60 Z", "#8a94a5", null, null) + part("M67 56 Q76 58 77 74 L65 74 Q65 64 63 60 Z", "#9aa4b5", null, null),
  }),
  // steel breastplate, pauldrons and gauntlets
  armour_plate: () => ({
    torso: part("M34 58 Q50 51 66 58 L65 84 Q50 92 35 84 Z", STEEL, "M34 58 Q38 56 42 55 Q39 70 41 89 Q37 87 35 84 Z", "M56 57 Q62 58 64 61 L63 72 Q60 66 56 62 Z") +
      `<path d="M35 84 Q50 92 65 84" fill="none" stroke="${GOLD}" stroke-width="2.4"/><path d="M50 62 L54 68 L50 76 L46 68 Z" ${st(GOLD)}/>`,
    arms: part("M22 58 Q30 48 41 55 L39 66 Q30 63 23 67 Z", STEEL, "M22 58 Q25 54 29 52 L30 64 Q26 65 23 67 Z", null) +
      part("M78 58 Q70 48 59 55 L61 66 Q70 63 77 67 Z", STEEL, null, "M70 52 Q75 54 77 57 L73 58 Q71 55 68 54 Z") +
      `<rect x="22" y="82" width="10" height="13" rx="3" transform="rotate(-6 27 88)" ${st(STEEL)}/><rect x="68" y="82" width="10" height="13" rx="3" transform="rotate(6 73 88)" ${st(STEEL)}/>`,
  }),
};
export const ARMOUR_IDS = Object.keys(ARMOUR);

/* ---------------- gear ---------------- */
const SHIELD_D = "M12 80 L36 80 L36 100 Q36 114 24 120 Q12 114 12 100 Z";
const CAPE_D = "M33 56 L67 56 L80 132 Q50 140 20 132 Z";
const ITEMS = {
  sword: () => `<path d="M74 44 L78 50 L78 92 L70 92 L70 50 Z" ${st("#e6ecf6")}/><path d="M74 50 L74 90" stroke="#9fadc6" stroke-width="1.8"/>
    <rect x="64" y="91" width="20" height="5" rx="2" ${st(GOLD)}/><rect x="71.5" y="95" width="5" height="10" ${st("#5b3920")}/>`,
  staff: () => `<rect x="71" y="26" width="5" height="120" rx="2.5" ${st("#8a5a2b")}/>
    <circle cx="73.5" cy="20" r="11" ${ff("#5ff0ff", 'opacity=".25"')}/>
    <path d="M73.5 10 L81 20 L73.5 30 L66 20 Z" ${st("#4fe3ff")}/><path d="M73.5 13 L77 20 L73.5 20 Z" ${ff("#fff", 'opacity=".8"')}/>
    <rect x="68" y="28" width="11" height="4" rx="1.5" ${st(GOLD)}/>`,
  shield: () => `<path d="${SHIELD_D}" ${ff("#a8642c")}/><path d="M12 80 L18 80 L18 116 Q13 110 12 100 Z" ${ff(shade("#a8642c", -0.3))}/>${ol(SHIELD_D)}
    <path d="M24 84 L24 114 M15 96 L33 96" stroke="${GOLD}" stroke-width="3"/>`,
  cape: () => part(CAPE_D, "#c8362f", "M33 56 L40 56 L32 138 Q25 136 20 132 Z", null) + `<path d="M22 128 Q50 136 78 128" fill="none" stroke="${GOLD}" stroke-width="2.4"/>`,
  goldcape: () => part(CAPE_D, "#6a34b0", "M33 56 L40 56 L32 138 Q25 136 20 132 Z", null) + `<path d="M21 128 Q50 136 79 128 L80 132 Q50 140 20 132 Z" ${st(GOLD)}/>`,
  cape_forest: () => part(CAPE_D, "#2f6b3c", "M33 56 L40 56 L32 138 Q25 136 20 132 Z", null) + `<path d="M24 120 L30 132 M40 124 L42 136 M60 124 L58 136 M76 120 L70 132" stroke="${shade("#2f6b3c", -0.35)}" stroke-width="2.4" stroke-linecap="round"/>`,
  sword_gold: () => `<path d="M74 40 L79 48 L79 92 L69 92 L69 48 Z" ${st("#ffe27a")}/><path d="M74 48 L74 90" stroke="#d99a1a" stroke-width="2"/>
    <path d="M62 90 Q74 96 86 90 L86 96 Q74 100 62 96 Z" ${st("#7a4bd6")}/><rect x="71.5" y="96" width="5" height="10" ${st("#3a1f5e")}/><circle cx="74" cy="108" r="3" ${st("#ffe27a")}/>`,
  shield_steel: () => `<circle cx="24" cy="98" r="15" ${st(STEEL)}/><path d="M12 92 Q16 84 24 83" fill="none" stroke="#fff" stroke-width="2.4" opacity=".7" stroke-linecap="round"/>
    <circle cx="24" cy="98" r="10" fill="none" stroke="${shade(STEEL, -0.3)}" stroke-width="2.4"/><circle cx="24" cy="98" r="4" ${st(GOLD)}/>`,
  shield_royal: () => `<path d="${SHIELD_D}" ${ff("#2f56c8")}/><path d="M12 80 L18 80 L18 116 Q13 110 12 100 Z" ${ff(shade("#2f56c8", -0.3))}/>${ol(SHIELD_D)}
    <path d="M14 80 L34 80" stroke="${GOLD}" stroke-width="3"/><path d="M17 92 L17 104 L31 104 L31 92 L27.5 97 L24 90 L20.5 97 Z" ${st(GOLD)}/>`,
  hat: () => `<ellipse cx="50" cy="12" rx="30" ry="6.5" ${st("#3f3596")}/>` +
    part("M34 10 Q42 -10 58 -24 Q53 -12 57 -2 Q62 5 66 10 Z", "#4a3fb0", "M34 10 Q42 -10 58 -24 Q47 -8 42 10 Z", null) +
    `<path d="M35 7 Q50 12 65 7" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>`,
  helm: () => part("M28 34 Q28 2 50 2 Q72 2 72 34 L72 44 L64 44 L64 24 L36 24 L36 44 L28 44 Z", STEEL,
      "M28 34 Q28 8 40 4 Q34 16 36 24 L36 44 L28 44 Z", "M54 5 Q66 8 68 20 L62 20 Q60 11 54 8 Z") +
    `<path d="M28 24 L72 24" stroke="${INK}" stroke-width="${SW}"/><path d="M50 2 Q46 -8 54 -14 Q59 -4 53 2 Z" ${st("#c42a3e")}/>`,
  crown: () => part("M34 10 L32 -6 L42 2 L50 -10 L58 2 L68 -6 L66 10 Z", "#f2bf2e", "M34 10 L32 -6 L37 -2 L38 10 Z", null) +
    `<rect x="47.5" y="-2" width="5" height="5" transform="rotate(45 50 0.5)" ${st("#d8233f")}/>`,
};
// how each item is framed when shown on its own: [x, y, w, h]
const ITEM_BOX = {
  cape_forest: [14, 52, 72, 92], sword_gold: [58, 36, 32, 76], shield_steel: [6, 80, 36, 36], shield_royal: [8, 76, 32, 48],
  sword: [60, 40, 28, 68], staff: [58, 6, 30, 70], shield: [8, 76, 32, 48], cape: [14, 52, 72, 92],
  goldcape: [14, 52, 72, 92], hat: [16, -28, 68, 44], helm: [22, -18, 56, 66], crown: [28, -14, 44, 28],
};

/* ---------------- public ---------------- */
// p: { body, hair, hairColor, skin, tunic, outfit, head, back, hand, off }
export function heroSVG(p, opts = {}) {
  const o = base(p), arm = p.armour && ARMOUR[p.armour] ? ARMOUR[p.armour]() : null;
  const it = (k) => (k && ITEMS[k] ? ITEMS[k]() : "");
  const hand = ([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5" ${st(c)}/>`;
  const box = opts.head ? "24 -14 52 70" : "4 -26 92 178";
  const shadow = opts.head ? "" : `<ellipse cx="50" cy="147" rx="30" ry="4.5" fill="#000" opacity=".3"/>`;
  return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    ${shadow}${it(p.back)}${hairBack(p.hair, p.hairColor)}
    ${o.legs}${o.torso}${arm ? arm.torso : ""}
    ${o.armL}${hand(o.handL)}
    ${o.armR}
    ${arm ? arm.arms : ""}${it(p.off)}
    ${head(p)}${hairFront(p.hair, p.hairColor)}${it(p.head)}
    ${it(p.hand)}${hand(o.handR)}
  </svg>`;
}
export function itemSVG(id, colour) {
  if (ARMOUR[id]) {
    const a = ARMOUR[id]();
    return `<svg viewBox="18 46 64 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${a.torso}${id === "armour_leather" ? "" : a.arms.replace(/<rect[^>]*>/g, "")}</svg>`;
  }
  if (id.startsWith("dye") || id.startsWith("shirt")) {
    return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20 8 L40 8 L52 16 L48 28 L42 26 L42 54 L18 54 L18 26 L12 28 L8 16 Z" ${st(colour)}/>
      <path d="M18 26 L18 54 L24 54 L24 22 Z" ${ff(shade(colour, -0.3))}/>
      <path d="M24 8 L30 18 L36 8" ${st(shade(colour, -0.3))}/>
      <path d="M30 26 L34 32 L30 40 L26 32 Z" ${st(GOLD)}/>
    </svg>`;
  }
  if (id.startsWith("pants")) {
    return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 8 L44 8 L48 54 L34 54 L30 26 L26 54 L12 54 Z" ${st(colour)}/>
      <path d="M16 8 L22 8 L19 54 L12 54 Z" ${ff(shade(colour, -0.3))}/>
      <rect x="15" y="6" width="30" height="7" rx="1.5" ${st(DLEATHER)}/><rect x="27" y="5" width="6" height="9" rx="1.5" ${st(GOLD)}/>
    </svg>`;
  }
  if (id.startsWith("dye")) {
    return `<svg viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="23" y="6" width="14" height="10" rx="3" ${st("#c9a06a")}/>
      <path d="M24 16 L36 16 L36 22 Q50 28 50 40 Q50 54 30 54 Q10 54 10 40 Q10 28 24 22 Z" ${st("#e8eefc")}/>
      <path d="M12.5 40 Q14 34 20 36 Q30 40 40 36 Q47 34 47.5 40 Q47 51 30 51 Q13 51 12.5 40 Z" ${ff(colour)}/>
      <ellipse cx="20" cy="30" rx="3" ry="5" ${ff("#ffffff", 'opacity=".7"')}/>
    </svg>`;
  }
  const [x, y, w, h] = ITEM_BOX[id];
  return `<svg viewBox="${x} ${y} ${w} ${h}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${ITEMS[id]()}</svg>`;
}
export function flameSVG() {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2c2 4 7 6 7 12a7 7 0 0 1-14 0c0-4 3-6 3-9 2 2 3 2 4-3z" fill="#ff7a2b" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M12 12c1.4 2 3 3 3 5a3 3 0 0 1-6 0c0-2 2-3 3-5z" fill="#ffd34a"/></svg>`;
}
