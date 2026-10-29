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

export const OUTFITS = {
  knight: { name: "Knight", colour: "#c8323a" },
  ranger: { name: "Ranger", colour: "#c8323a" },
  adventurer: { name: "Adventurer", colour: "#2f5fc4" },
};

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

/* ---------------- outfits ---------------- */
function knight(p) {
  const t = p.tunic;
  const pc = p.pants || "#4b5163";
  const legs = limb("M44 96 L42 128", pc, 11) + limb("M56 96 L58 128", pc, 11) +
    part("M34 124 L48 124 L48 146 L31 146 Q30 140 34 137 Z", STEEL, "M34 124 L39 124 L39 146 L31 146 Q30 140 34 137 Z", "M44 126 L47 126 L47 140 L44 140 Z") +
    part("M52 124 L66 124 L66 137 Q70 140 69 146 L52 146 Z", STEEL, "M52 124 L56 124 L56 146 L52 146 Z", "M62 126 L65 126 L65 140 L62 140 Z") +
    `<path d="M34 130 L48 130 M52 130 L66 130" stroke="${GOLD}" stroke-width="2.4"/>`;
  const torso = part("M31 62 Q33 54 42 53 L58 53 Q67 54 69 62 L67 96 L33 96 Z", "#5a6173", null, null) +
    part("M34 58 Q50 52 66 58 L65 84 Q50 92 35 84 Z", STEEL, "M34 58 Q38 56 42 55 Q39 70 41 89 Q37 87 35 84 Z", "M56 57 Q62 58 64 61 L63 72 Q60 66 56 62 Z") +
    `<path d="M35 84 Q50 92 65 84" fill="none" stroke="${GOLD}" stroke-width="2.4"/>
     <path d="M50 62 L54 68 L50 76 L46 68 Z" ${st(GOLD)}/>
     <rect x="33" y="88" width="34" height="7" rx="1.5" ${st(DLEATHER)}/><rect x="46" y="87" width="8" height="9" rx="1.5" ${st(GOLD)}/>` +
    part(p.body === "f" ? "M37 95 L63 95 L66 124 L50 128 L34 124 Z" : "M39 95 L61 95 L59 120 L50 125 L41 120 Z", t,
      p.body === "f" ? "M37 95 L42 95 L40 126 L34 124 Z" : "M39 95 L44 95 L44 122 L41 120 Z", null) +
    `<path d="M41 98 L59 98" stroke="${GOLD}" stroke-width="2"/><path d="M50 102 L50 118 M45 108 L55 108" stroke="${GOLD}" stroke-width="2.4" stroke-linecap="round"/>`;
  const armL = limb("M31 60 L27 80", "#5a6173", 10) + limb("M27 80 L26 96", STEEL, 10);
  const armR = limb("M69 60 L73 80", "#5a6173", 10) + limb("M73 80 L74 96", STEEL, 10);
  const pads = part("M22 58 Q30 48 41 55 L39 66 Q30 63 23 67 Z", STEEL, "M22 58 Q25 54 29 52 L30 64 Q26 65 23 67 Z", null) +
    part("M78 58 Q70 48 59 55 L61 66 Q70 63 77 67 Z", STEEL, null, "M70 52 Q75 54 77 57 L73 58 Q71 55 68 54 Z") +
    `<path d="M24 64 Q31 61 39 64 M76 64 Q69 61 61 64" fill="none" stroke="${GOLD}" stroke-width="2"/>`;
  return { back: "", legs, torso, armL, armR, pads, handL: [26, 99, STEEL], handR: [74, 99, STEEL] };
}
function ranger(p) {
  const t = p.tunic, green = "#3f6b45";
  const pc = p.pants || "#3b3d2e";
  const legs = limb("M44 96 L42 126", pc, 11) + limb("M56 96 L58 126", pc, 11) +
    part("M35 116 L48 116 L48 146 L31 146 Q30 140 35 137 Z", LEATHER, "M35 116 L39 116 L39 146 L31 146 Q30 140 35 137 Z", null) +
    part("M52 116 L65 116 L65 137 Q70 140 69 146 L52 146 Z", LEATHER, "M52 116 L56 116 L56 146 L52 146 Z", null) +
    `<path d="M35 122 L48 124 M35 130 L48 132 M52 124 L65 122 M52 132 L65 130" stroke="${DLEATHER}" stroke-width="2.2"/>
     <path d="M34 116 L49 116 M51 116 L66 116" stroke="${DLEATHER}" stroke-width="3"/>`;
  const cloak = part("M30 56 L70 56 L82 134 Q50 141 18 134 Z", green, "M30 56 L37 56 L30 139 Q23 137 18 134 Z", null);
  const torso = part("M32 62 Q34 54 42 53 L58 53 Q66 54 68 62 L66 98 L34 98 Z", LEATHER, "M32 62 Q34 55 40 53 Q37 70 39 98 L34 98 Z", "M57 56 Q63 57 65 61 L64 70 Q61 64 57 60 Z") +
    `<path d="M50 56 L50 96" stroke="${DLEATHER}" stroke-width="2"/>
     <path d="M44 62 L56 62 M44 70 L56 70 M44 78 L56 78" stroke="${GOLD}" stroke-width="1.8" stroke-linecap="round"/>
     <path d="M34 58 L66 90" stroke="${DLEATHER}" stroke-width="4.5" stroke-linecap="round"/><path d="M34 58 L66 90" stroke="${LEATHER}" stroke-width="2" stroke-linecap="round"/>
     <rect x="32" y="88" width="36" height="7" rx="1.5" ${st(DLEATHER)}/><rect x="46" y="87" width="8" height="9" rx="2" ${st(GOLD)}/>
     <rect x="58" y="93" width="9" height="10" rx="2" ${st(LEATHER)}/><rect x="33" y="93" width="8" height="9" rx="2" ${st(LEATHER)}/>` +
    part(p.body === "f" ? "M38 95 L62 95 L65 122 L50 126 L35 122 Z" : "M42 95 L58 95 L57 118 L50 122 L43 118 Z", t,
      p.body === "f" ? "M38 95 L43 95 L41 124 L35 122 Z" : "M42 95 L46 95 L46 120 L43 118 Z", null);
  const armL = limb("M32 60 L28 80", green, 10) + limb("M28 80 L27 96", DLEATHER, 9) + `<path d="M23 84 L32 84 M23 90 L32 90" stroke="${GOLD}" stroke-width="1.6"/>`;
  const armR = limb("M68 60 L72 80", green, 10) + limb("M72 80 L73 96", DLEATHER, 9) + `<path d="M68 84 L77 84 M68 90 L77 90" stroke="${GOLD}" stroke-width="1.6"/>`;
  const pads = part("M27 60 Q34 46 50 50 Q66 46 73 60 Q66 66 58 60 Q50 64 42 60 Q34 66 27 60 Z", green, "M27 60 Q32 50 40 49 Q38 56 42 60 Q34 66 27 60 Z", null) +
    `<circle cx="50" cy="60" r="3.4" ${st(GOLD)}/>`;
  return { back: cloak, legs, torso, armL, armR, pads, handL: [27, 99, p.skin], handR: [73, 99, p.skin] };
}
function adventurer(p) {
  const t = p.tunic, shirt = "#eee6d6", shd = "#c9bba0";
  const pc = p.pants || "#3a2c2c";
  const legs = limb("M44 96 L41 126", pc, 12) + limb("M56 96 L59 126", pc, 12) +
    `<rect x="36" y="106" width="9" height="8" rx="2" transform="rotate(8 40 110)" ${st(LEATHER)}/><rect x="55" y="106" width="9" height="8" rx="2" transform="rotate(-8 60 110)" ${st(LEATHER)}/>` +
    part("M33 120 L48 120 L48 146 L29 146 Q28 139 33 136 Z", LEATHER, "M33 120 L38 120 L38 146 L29 146 Q28 139 33 136 Z", null) +
    part("M52 120 L67 120 L67 136 Q72 139 71 146 L52 146 Z", LEATHER, "M52 120 L56 120 L56 146 L52 146 Z", null) +
    `<path d="M33 125 L48 125 M52 125 L67 125" stroke="${GOLD}" stroke-width="2.4"/><path d="M29 146 L48 146 M52 146 L71 146" stroke="${DLEATHER}" stroke-width="3"/>`;
  const torso = part("M31 62 Q33 54 42 53 L58 53 Q67 54 69 62 L67 96 L33 96 Z", shirt, "M31 62 Q33 55 40 53 Q37 70 39 96 L33 96 Z", null) +
    `<path d="M33 56 L64 92" stroke="${DLEATHER}" stroke-width="5" stroke-linecap="round"/><path d="M33 56 L64 92" stroke="${LEATHER}" stroke-width="2.4" stroke-linecap="round"/>
     <rect x="31" y="88" width="38" height="7" rx="1.5" ${st(LEATHER)}/><rect x="46" y="87" width="8" height="9" rx="1.5" ${st(GOLD)}/>
     <circle cx="38" cy="98" r="4" ${st(GOLD)}/><circle cx="38" cy="98" r="2" ${ff("#3a6bd8")}/>
     <rect x="58" y="92" width="10" height="11" rx="2" ${st(LEATHER)}/>` +
    part(p.body === "f" ? "M38 95 L62 95 L65 124 L50 128 L35 124 Z" : "M42 95 L58 95 L57 122 L50 127 L43 122 Z", t,
      p.body === "f" ? "M38 95 L43 95 L41 126 L35 124 Z" : "M42 95 L46 95 L46 125 L43 122 Z", null) +
    `<path d="M50 101 L53 106 L50 111 L47 106 Z" ${st(GOLD)}/>`;
  const scarf = part("M38 52 Q50 60 62 52 L64 58 Q50 67 36 58 Z", t, "M38 52 Q42 55 46 57 L44 63 Q40 61 36 58 Z", null) + part("M57 59 L64 76 L58 78 L53 62 Z", t, null, null);
  const armL = limb("M31 60 L28 76", shirt, 10) + limb("M28 76 L27 95", "#2f2a33", 9) + `<path d="M23 77 L32 77" stroke="${shd}" stroke-width="2.5"/>`;
  const armR = limb("M69 60 L72 76", shirt, 10) + limb("M72 76 L73 95", "#2f2a33", 9) + `<path d="M68 77 L77 77" stroke="${shd}" stroke-width="2.5"/>`;
  const pads = part("M21 58 Q29 47 41 54 L39 66 Q30 62 22 67 Z", STEEL, "M21 58 Q24 53 28 51 L29 63 Q25 65 22 67 Z", null) + `<path d="M28 56 L31 59 L28 62 L25 59 Z" ${ff(GOLD)}/>` + scarf;
  return { back: "", legs, torso, armL, armR, pads, handL: [27, 98, p.skin], handR: [73, 98, p.skin] };
}

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
  const o = (OUTFITS[p.outfit] ? { knight, ranger, adventurer }[p.outfit] : knight)(p);
  const it = (k) => (k && ITEMS[k] ? ITEMS[k]() : "");
  const hand = ([x, y, c]) => `<circle cx="${x}" cy="${y}" r="5" ${st(c)}/>`;
  const box = opts.head ? "24 -14 52 70" : "4 -26 92 178";
  const shadow = opts.head ? "" : `<ellipse cx="50" cy="147" rx="30" ry="4.5" fill="#000" opacity=".3"/>`;
  return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    ${shadow}${it(p.back)}${o.back}${hairBack(p.hair, p.hairColor)}
    ${o.legs}${o.torso}
    ${o.armL}${hand(o.handL)}${it(p.off)}
    ${o.armR}
    ${o.pads}
    ${head(p)}${hairFront(p.hair, p.hairColor)}${it(p.head)}
    ${it(p.hand)}${hand(o.handR)}
  </svg>`;
}
export function itemSVG(id, colour) {
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
