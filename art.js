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

/* ---------------- gear designs ----------------
   Every slot has one design per rarity (0 common … 4 legendary), so all commons look alike, all
   uncommons look alike and so on. A design id is the slot plus the rarity, e.g. "hand3". */
const R_GLOW = [null, null, null, "#b46cff", "#ffcf4a"];
export const DESIGN_SLOTS = ["head", "shirt", "pants", "back", "hand", "off"];
const des = (id) => { const m = /^(head|shirt|pants|back|hand|off)([0-4])$/.exec(id || ""); return m ? [m[1], +m[2]] : null; };

// swords: drawn in the right hand with the grip centred on (74, 100)
const SWORDS = [
  { blade: "#c9d0dc", len: 0, w: 0, guard: "#8a5430", grip: "#5b3920" },
  { blade: "#e6ecf6", len: 3, w: 0, guard: STEEL, grip: "#3a3a4a", gem: "#5fd36a" },
  { blade: "#eef3fb", len: 7, w: 1, guard: GOLD, grip: "#5b3920", gem: "#4fa8ff" },
  { blade: "#d9c6ff", len: 9, w: 1, guard: "#3a2a5e", grip: "#241a3a", gem: "#c58bff", runes: "#8a3fd6", glow: "#b46cff" },
  { blade: "#ffe27a", len: 11, w: 1.5, guard: "#c8851a", grip: "#5a1a1a", gem: "#e8233f", wing: true, glow: "#ffcf4a" },
];
function swordArt(r) {
  const s = SWORDS[r], top = 44 - s.len, L = 70 - s.w, Rr = 78 + s.w;
  const blade = `M74 ${top} L${Rr} ${top + 6} L${Rr} 92 L${L} 92 L${L} ${top + 6} Z`;
  const glow = s.glow ? `<path d="${blade}" fill="none" stroke="${s.glow}" stroke-width="7" opacity=".4" stroke-linejoin="round"/>` : "";
  const runes = s.runes ? `<path d="M74 ${top + 14} l-2 3 l2 3 M74 ${top + 28} l2 3 l-2 3 M74 ${top + 42} l-2 3 l2 3" fill="none" stroke="${s.runes}" stroke-width="1.6" stroke-linecap="round"/>` : "";
  const guard = s.wing
    ? `<path d="M60 88 Q66 94 74 92 Q82 94 88 88 L86 96 Q80 99 74 97 Q68 99 62 96 Z" ${st(s.guard)}/>`
    : `<rect x="${r >= 2 ? 62 : 64}" y="91" width="${r >= 2 ? 24 : 20}" height="5" rx="2" ${st(s.guard)}/>`;
  return `${glow}<path d="${blade}" ${st(s.blade)}/><path d="M74 ${top + 6} L74 90" stroke="${shade(s.blade, -0.3)}" stroke-width="1.8"/>${runes}
    ${guard}<rect x="71.5" y="95" width="5" height="10" ${st(s.grip)}/><circle cx="74" cy="107" r="3" ${st(s.guard)}/>
    ${s.gem ? `<circle cx="74" cy="93.5" r="2.2" ${st(s.gem, 'stroke-width="1.4"')}/>` : ""}`;
}
// shields: held on the left arm, centred around (24, 100)
const HEATER = "M11 80 L37 80 L37 100 Q37 115 24 121 Q11 115 11 100 Z";
const KITE = "M10 78 L38 78 L38 98 Q38 116 24 124 Q10 116 10 98 Z";
const SHIELDS = [
  { col: "#a8642c", shape: HEATER },
  { col: STEEL, round: true },
  { col: "#2f56c8", shape: HEATER },
  { col: "#5a2a8a", shape: KITE, glow: "#b46cff" },
  { col: "#f2b631", shape: KITE, glow: "#ffcf4a" },
];
function shieldArt(r) {
  const s = SHIELDS[r];
  if (s.round) return `<circle cx="24" cy="98" r="15" ${st(STEEL)}/><path d="M12 92 Q16 84 24 83" fill="none" stroke="#fff" stroke-width="2.4" opacity=".7" stroke-linecap="round"/>
    <circle cx="24" cy="98" r="10" fill="none" stroke="${shade(STEEL, -0.3)}" stroke-width="2.4"/><circle cx="24" cy="98" r="4" ${st("#5fd36a")}/>`;
  const glow = s.glow ? `<path d="${s.shape}" fill="none" stroke="${s.glow}" stroke-width="7" opacity=".4"/>` : "";
  const face = `${glow}<path d="${s.shape}" ${ff(s.col)}/><path d="M11 80 L17 80 L17 116 Q12 110 11 100 Z" ${ff(shade(s.col, -0.3))}/>${ol(s.shape)}`;
  if (r === 0) return face + `<path d="M19 81 L19 117 M29 81 L29 117" stroke="${shade(s.col, -0.4)}" stroke-width="1.8"/><path d="M11 92 L37 92" stroke="#6c7686" stroke-width="3.4"/>`;
  if (r === 2) return face + `<path d="M24 84 L24 115 M14 96 L34 96" stroke="#e6ecf6" stroke-width="4"/><path d="M11 80 L37 80" stroke="#e6ecf6" stroke-width="3"/>`;
  if (r === 3) return face + `<path d="${s.shape}" fill="none" stroke="${GOLD}" stroke-width="2.4" transform="translate(24 100) scale(.82) translate(-24 -100)"/>
    <ellipse cx="24" cy="98" rx="7" ry="9" ${st("#ffd34a")}/><ellipse cx="24" cy="98" rx="2" ry="7" ${ff(INK)}/>`;
  return face + `<path d="${s.shape}" fill="none" stroke="#fff6c8" stroke-width="2.4" transform="translate(24 100) scale(.82) translate(-24 -100)"/>
    <path d="M24 86 L27 95 L36 96 L29 101 L31 110 L24 105 L17 110 L19 101 L12 96 L21 95 Z" ${st("#fff1a8", 'stroke-width="1.6"')}/><circle cx="24" cy="99" r="3.6" ${st("#e8233f", 'stroke-width="1.6"')}/>`;
}
function shieldBackArt(r) {
  const s = SHIELDS[r], d = shade(s.col, -0.45);
  const face = s.round ? `<circle cx="24" cy="98" r="15" ${st(d)}/>` : `<path d="${s.shape}" ${st(d)}/>`;
  const rim = s.round ? "" : `<path d="${s.shape}" fill="none" stroke="${shade(s.col, -0.1)}" stroke-width="2" transform="translate(24 100) scale(.9) translate(-24 -100)"/>`;
  return face + rim + `<rect x="15" y="91" width="18" height="6" rx="2" ${st(DLEATHER)}/><rect x="15" y="102" width="18" height="6" rx="2" ${st(DLEATHER)}/>`;
}
// headgear
function headArt(r, back) {
  if (r === 0) {
    const cap = back ? "M30 34 Q28 4 50 3 Q72 4 70 34 Q60 38 50 38 Q40 38 30 34 Z" : "M30 30 Q30 3 50 3 Q70 3 70 30 L66 30 Q63 15 50 14 Q37 15 34 30 Z";
    return part(cap, LEATHER, "M30 30 Q30 6 42 4 Q35 14 34 30 Z", "M50 5 Q62 6 66 14 Q58 9 50 9 Z") + `<path d="M31 ${back ? 30 : 24} Q50 ${back ? 34 : 18} 69 ${back ? 30 : 24}" fill="none" stroke="${DLEATHER}" stroke-width="3" stroke-linecap="round"/>`;
  }
  if (r === 1 || r === 2) {
    const plume = r === 2 ? `<path d="M50 2 Q46 -8 54 -14 Q59 -4 53 2 Z" ${st("#c42a3e")}/>` : "";
    const band = r === 2 ? `<path d="M28 ${back ? 34 : 24} L72 ${back ? 34 : 24}" stroke="${GOLD}" stroke-width="3"/>` : "";
    if (back) return part("M28 36 Q28 2 50 2 Q72 2 72 36 L72 46 Q50 54 28 46 Z", STEEL, "M28 36 Q28 8 40 4 Q34 22 36 50 Q31 49 28 46 Z", "M54 5 Q66 8 68 20 L62 20 Q60 11 54 8 Z") +
      `<path d="M50 2 L50 50" stroke="${shade(STEEL, -0.3)}" stroke-width="2.4"/>${band}${plume}`;
    return part("M28 34 Q28 2 50 2 Q72 2 72 34 L72 44 L64 44 L64 24 L36 24 L36 44 L28 44 Z", STEEL,
      "M28 34 Q28 8 40 4 Q34 16 36 24 L36 44 L28 44 Z", "M54 5 Q66 8 68 20 L62 20 Q60 11 54 8 Z") +
      `<path d="M28 24 L72 24" stroke="${INK}" stroke-width="${SW}"/>${band}${plume}`;
  }
  if (r === 3) return `<ellipse cx="50" cy="12" rx="30" ry="6.5" ${st("#3f3596")}/>` +
    part("M34 10 Q42 -10 58 -24 Q53 -12 57 -2 Q62 5 66 10 Z", "#4a3fb0", "M34 10 Q42 -10 58 -24 Q47 -8 42 10 Z", null) +
    `<path d="M35 7 Q50 12 65 7" fill="none" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/><path d="M52 -6 l1.5 3 3 .5 -2.2 2 .6 3 -2.9 -1.5 -2.9 1.5 .6 -3 -2.2 -2 3 -.5 z" ${ff("#ffe27a")}/>`;
  return `<path d="M32 12 L30 -8 L41 1 L50 -12 L59 1 L70 -8 L68 12 Z" fill="none" stroke="#ffcf4a" stroke-width="7" opacity=".35" stroke-linejoin="round"/>` +
    part("M32 12 L30 -8 L41 1 L50 -12 L59 1 L70 -8 L68 12 Z", "#f2bf2e", "M32 12 L30 -8 L36 -3 L37 12 Z", null) +
    `<rect x="31" y="7" width="38" height="6" rx="2" ${st("#e0a520")}/><circle cx="40" cy="10" r="1.8" ${ff("#4fa8ff")}/><circle cx="60" cy="10" r="1.8" ${ff("#5fd36a")}/>` +
    `<rect x="47.5" y="-1" width="5" height="5" transform="rotate(45 50 1.5)" ${st("#d8233f")}/>`;
}
// armour pieces, drawn over the T-shirt
const PLATES = [null, null, { col: STEEL, trim: GOLD, gem: GOLD }, { col: "#5c5884", trim: "#c58bff", gem: "#b46cff" }, { col: "#f2c94a", trim: "#fff6c8", gem: "#e8233f" }];
function armourArt(r, back) {
  if (r === 0) {
    const torso = back
      ? part("M35 56 Q50 52 65 56 L64 88 L36 88 Z", LEATHER, "M35 56 Q38 55 41 54 L41 88 L36 88 Z", null) + `<path d="M38 64 L62 64 M38 76 L62 76" stroke="${DLEATHER}" stroke-width="2.4" stroke-linecap="round"/>`
      : part("M35 56 Q41 54 45 55 L48 88 L35 88 Z", LEATHER, "M35 56 Q38 55 40 55 L40 88 L35 88 Z", null) +
        part("M65 56 Q59 54 55 55 L52 88 L65 88 Z", LEATHER, null, "M60 57 Q63 57 64 60 L63 66 Q61 62 59 60 Z") +
        `<path d="M37 66 L45 66 M37 74 L46 74 M63 66 L55 66 M63 74 L54 74" stroke="${DLEATHER}" stroke-width="2" stroke-linecap="round"/><circle cx="47" cy="70" r="1.6" ${ff(GOLD)}/><circle cx="53" cy="70" r="1.6" ${ff(GOLD)}/>`;
    return { torso, arms: `<rect x="23" y="82" width="9" height="11" rx="2" transform="rotate(-6 27 88)" ${st(DLEATHER)}/><rect x="68" y="82" width="9" height="11" rx="2" transform="rotate(6 73 88)" ${st(DLEATHER)}/>` };
  }
  if (r === 1) {
    const torso = part("M32 60 Q34 53 43 53 L57 53 Q66 53 68 60 L67 90 L33 90 Z", "#9aa4b5", "M32 60 Q34 54 40 53 Q37 70 39 90 L33 90 Z", null) +
      `<path d="M36 62 Q50 66 64 62 M35 70 Q50 74 65 70 M35 78 Q50 82 65 78" fill="none" stroke="#6c7686" stroke-width="1.6" stroke-dasharray="2 2"/>` +
      (back ? "" : part("M44 56 L56 56 L57 92 L50 96 L43 92 Z", "#8a2f36", "M44 56 L47 56 L46 94 L43 92 Z", null) + `<path d="M50 62 L53 66 L50 70 L47 66 Z" ${ff(GOLD)}/>`);
    return { torso, arms: part("M33 56 Q24 58 23 74 L35 74 Q35 64 37 60 Z", "#8a94a5", null, null) + part("M67 56 Q76 58 77 74 L65 74 Q65 64 63 60 Z", "#9aa4b5", null, null) };
  }
  const p = PLATES[r], dk = shade(p.col, -0.3);
  const torso = back
    ? part("M34 58 Q50 52 66 58 L65 86 Q50 90 35 86 Z", p.col, "M34 58 Q38 56 42 55 Q39 70 41 89 Q37 87 35 86 Z", null) +
      `<path d="M50 56 L50 88" stroke="${dk}" stroke-width="2.4"/><path d="M35 86 Q50 90 65 86" fill="none" stroke="${p.trim}" stroke-width="2.4"/>`
    : part("M34 58 Q50 51 66 58 L65 84 Q50 92 35 84 Z", p.col, "M34 58 Q38 56 42 55 Q39 70 41 89 Q37 87 35 84 Z", "M56 57 Q62 58 64 61 L63 72 Q60 66 56 62 Z") +
      `<path d="M35 84 Q50 92 65 84" fill="none" stroke="${p.trim}" stroke-width="2.4"/><path d="M50 62 L54 68 L50 76 L46 68 Z" ${st(p.gem)}/>`;
  const glow = r === 4 ? `<path d="M34 58 Q50 51 66 58 L65 86 Q50 92 35 86 Z" fill="none" stroke="#ffcf4a" stroke-width="6" opacity=".35"/>` : "";
  const arms = part("M22 58 Q30 48 41 55 L39 66 Q30 63 23 67 Z", p.col, "M22 58 Q25 54 29 52 L30 64 Q26 65 23 67 Z", null) +
    part("M78 58 Q70 48 59 55 L61 66 Q70 63 77 67 Z", p.col, null, "M70 52 Q75 54 77 57 L73 58 Q71 55 68 54 Z") +
    `<path d="M24 64 Q30 61 38 63 M76 64 Q70 61 62 63" fill="none" stroke="${p.trim}" stroke-width="2" stroke-linecap="round"/>` +
    `<rect x="22" y="82" width="10" height="13" rx="3" transform="rotate(-6 27 88)" ${st(p.col)}/><rect x="68" y="82" width="10" height="13" rx="3" transform="rotate(6 73 88)" ${st(p.col)}/>`;
  return { torso: glow + torso, arms };
}
// trousers: a colour per rarity; rare and up get a trim stripe, epic and up knee guards
const PANTS_COL = ["#7a6448", "#2f6b3c", "#2f4fb0", "#4a2a7a", "#c8962a"];
const PANTS_TRIM = [null, null, GOLD, "#c58bff", "#fff1a8"];
// capes
const CAPES = ["#7a5a3a", "#2f6b3c", "#c8362f", "#6a34b0", "#ff8a2a"];
function capeArt(r) {
  const c = CAPES[r], dark = "M33 56 L40 56 L32 138 Q25 136 20 132 Z";
  if (r === 0) return part(CAPE_D, c, dark, null) + `<path d="M28 100 L26 112 M72 100 L74 112" stroke="${shade(c, -0.35)}" stroke-width="2" stroke-linecap="round"/>`;
  if (r === 1) return part(CAPE_D, c, dark, null) + `<path d="M24 120 L30 132 M40 124 L42 136 M60 124 L58 136 M76 120 L70 132" stroke="${shade(c, -0.35)}" stroke-width="2.4" stroke-linecap="round"/>`;
  if (r === 2) return part(CAPE_D, c, dark, null) + `<path d="M22 128 Q50 136 78 128" fill="none" stroke="${GOLD}" stroke-width="2.4"/>`;
  if (r === 3) return part(CAPE_D, c, dark, null) + `<path d="M21 128 Q50 136 79 128 L80 132 Q50 140 20 132 Z" ${st(GOLD)}/>`;
  return `<path d="${CAPE_D}" fill="none" stroke="#ffcf4a" stroke-width="7" opacity=".35"/>` +
    `<defs><linearGradient id="phx" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd34a"/><stop offset="1" stop-color="#e8452a"/></linearGradient></defs>` +
    `<path d="${CAPE_D}" fill="url(#phx)"/><path d="${dark}" ${ff("#c8501a", 'opacity=".6"')}/>${ol(CAPE_D)}` +
    `<path d="M22 126 Q28 116 32 128 Q38 112 44 128 Q50 110 56 128 Q62 112 68 128 Q72 116 78 126" fill="none" stroke="#fff1a8" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
}
const CAPE_D = "M33 56 L67 56 L80 132 Q50 140 20 132 Z";

/* ---------------- body ---------------- */
// Everyone wears a T-shirt and trousers; armour (from chests) goes over the T-shirt.
function legsArt(p, back) {
  const pr = p.pants != null ? p.pants : -1, pc = pr >= 0 ? PANTS_COL[pr] : PANTS, trim = pr >= 0 ? PANTS_TRIM[pr] : null;
  let s = limb("M44 94 L42 128", pc, 12) + limb("M56 94 L58 128", pc, 12);
  if (trim) s += `<path d="M38.5 100 L37 126 M61.5 100 L63 126" stroke="${trim}" stroke-width="2" stroke-linecap="round"/>`;
  if (pr >= 3) s += `<ellipse cx="42.6" cy="113" rx="6.4" ry="5" ${st(pr === 4 ? "#f2c94a" : "#7a74a8")}/><ellipse cx="57.4" cy="113" rx="6.4" ry="5" ${st(pr === 4 ? "#f2c94a" : "#7a74a8")}/>`;
  if (!back) s += `<path d="M38 120 Q42 124 47 120 M53 120 Q58 124 62 120" fill="none" stroke="${shade(pc, -0.35)}" stroke-width="2" stroke-linecap="round"/>`;
  s += back
    ? part("M33 126 L48 126 L48 146 L32 146 Q30 140 33 137 Z", SHOE, "M33 140 L48 140 L48 146 L32 146 Z", null) + part("M52 126 L67 126 L67 137 Q70 140 68 146 L52 146 Z", SHOE, "M52 140 L67 140 L68 146 L52 146 Z", null)
    : part("M33 126 L48 126 L48 146 L30 146 Q29 140 33 137 Z", SHOE, "M33 126 L38 126 L38 146 L30 146 Q29 140 33 137 Z", null) + part("M52 126 L67 126 L67 137 Q71 140 70 146 L52 146 Z", SHOE, "M52 126 L56 126 L56 146 L52 146 Z", null);
  s += part("M34 86 L66 86 L67 100 L52 102 L50 96 L48 102 L33 100 Z", pc, back ? "M34 86 L66 86 L66 90 L34 90 Z" : "M34 86 L39 86 L38 101 L33 100 Z", null);
  if (back) s += `<path d="M50 88 L50 97" stroke="${shade(pc, -0.35)}" stroke-width="2"/>`;
  return s;
}
function torsoArt(p, back) {
  const f = p.body === "f", tee = TEE;
  let s = part(f ? "M33 60 Q35 53 43 53 L57 53 Q65 53 67 60 L66 90 L34 90 Z" : "M32 60 Q34 53 43 53 L57 53 Q66 53 68 60 L67 90 L33 90 Z", tee,
    "M32 60 Q34 54 40 53 Q37 70 39 90 L33 90 Z", back ? null : "M58 56 Q63 57 65 61 L64 68 Q61 63 57 60 Z");
  s += back ? `<path d="M43 74 Q50 77 57 74" fill="none" stroke="${shade(tee, -0.3)}" stroke-width="2" stroke-linecap="round"/>` : `<path d="M44 53 Q50 59 56 53" ${st(p.skin)}/>`;
  s += `<rect x="33" y="86" width="34" height="5" rx="1.5" ${st("#3b2a1e")}/>` + (back ? "" : `<rect x="47" y="85" width="6" height="7" rx="1.5" ${st("#c9a06a")}/>`);
  return s;
}
const sleeveL = () => part("M33 56 Q26 58 25 70 L35 72 Q35 64 37 60 Z", shade(TEE, -0.3), null, null);
const sleeveR = () => part("M67 56 Q74 58 75 70 L65 72 Q65 64 63 60 Z", TEE, null, null);
const handAt = (x, y, c) => `<circle cx="${x}" cy="${y}" r="5" ${st(c)}/>`;

/* ---------------- public ---------------- */
// p: { body, hair, hairColor, skin, head, shirt, pants, back, hand, off }
// Gear fields are design ids ("hand3") or rarities already split out by heroParts in the app.
function split(p) {
  const r = (k) => { const d = des(p[k]); return d && d[0] === k ? d[1] : null; };
  return { ...p, head: r("head"), shirt: r("shirt"), pants: r("pants"), back: r("back"), hand: r("hand"), off: r("off") };
}
export function heroSVG(p0, opts = {}) {
  const p = split(p0), s = p.skin;
  const arm = p.shirt != null ? armourArt(p.shirt, false) : null;
  const box = opts.head ? "24 -14 52 70" : "4 -26 92 178";
  const shadow = opts.head ? "" : `<ellipse cx="50" cy="147" rx="30" ry="4.5" fill="#000" opacity=".3"/>`;
  return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    ${shadow}${p.back != null ? capeArt(p.back) : ""}${hairBack(p.hair, p.hairColor)}
    ${legsArt(p, false)}${torsoArt(p, false)}${arm ? arm.torso : ""}
    ${sleeveL()}${limb("M30 72 L27 96", s, 9)}${handAt(27, 99, s)}
    ${sleeveR()}${limb("M70 72 L73 96", s, 9)}
    ${arm ? arm.arms : ""}${p.off != null ? shieldArt(p.off) : ""}
    ${head(p)}${p.head === 1 || p.head === 2 ? "" : hairFront(p.hair, p.hairColor)}${p.head != null ? headArt(p.head, false) : ""}
    ${p.hand != null ? swordArt(p.hand) : ""}${handAt(73, 99, s)}
  </svg>`;
}
// Seen from behind in the dungeon. The sword and shield are held out in front of the hero, so the
// body hides part of them: they are drawn first and everything else goes on top.
const HEAD_D = "M33 27 Q33 9 50 9 Q67 9 67 27 L67 35 Q66 47 57 51 Q50 54 43 51 Q34 47 33 35 Z";
function hairBackView(style, c) {
  const d = shade(c, -0.3), l = shade(c, 0.25);
  const cap = "M31 36 Q28 22 31 14 Q38 2 50 2 Q62 2 69 14 Q72 22 69 36 Q66 48 50 50 Q34 48 31 36 Z";
  const strands = `<path d="M42 10 Q40 26 44 44 M50 6 Q50 26 50 48 M58 10 Q60 26 56 44" fill="none" stroke="${d}" stroke-width="1.8" stroke-linecap="round"/>`;
  const shine = `<path d="M40 10 Q50 5 60 10 Q50 9 40 14 Z" ${ff(l)}/>`;
  const capPart = part(cap, c, "M31 36 Q28 22 31 14 Q36 6 42 4 Q36 20 38 46 Q33 42 31 36 Z", null) + strands + shine;
  switch (style) {
    case "short": return capPart;
    case "long": return part("M30 22 Q30 2 50 2 Q70 2 70 22 L73 74 Q50 82 27 74 Z", c, "M30 22 Q30 6 40 3 Q34 30 36 78 Q31 77 27 74 Z", null) +
      `<path d="M42 12 Q40 40 42 76 M50 8 Q50 40 50 78 M58 12 Q60 40 58 76" fill="none" stroke="${d}" stroke-width="1.8" stroke-linecap="round"/>` + shine;
    case "ponytail": return capPart + `<circle cx="50" cy="40" r="4" ${st("#c42a3e")}/>` +
      part("M45 42 Q42 58 46 72 Q50 78 54 72 Q58 58 55 42 Z", c, "M45 42 Q42 58 46 72 Q48 74 49 72 Q47 58 49 42 Z", null);
    case "bun": return capPart + `<circle cx="50" cy="16" r="10" ${st(c)}/><path d="M44 12 Q50 8 56 12" fill="none" stroke="${d}" stroke-width="1.8" stroke-linecap="round"/>`;
    case "spiky": return part("M31 36 L27 22 L20 18 L29 13 L27 0 L38 6 L42 -6 L50 2 L58 -8 L62 4 L73 -2 L71 12 L80 18 L71 24 L69 36 Q66 48 50 50 Q34 48 31 36 Z",
      c, "M31 36 L27 22 L20 18 L29 13 L27 0 L36 5 Q34 24 38 46 Q33 42 31 36 Z", null) + strands;
    default: return "";
  }
}
export function heroBackSVG(p0) {
  const p = split(p0), s = p.skin, sd = shade(s, -0.22);
  const arm = p.shirt != null ? armourArt(p.shirt, true) : null;
  // held out in front: shield on the left arm, sword angled up past the right shoulder
  const shield = p.off != null ? `<g transform="translate(-5 -14)">${shieldBackArt(p.off)}</g>` : "";
  const sword = p.hand != null ? `<g transform="translate(-8 -8) rotate(28 74 100)">${swordArt(p.hand)}</g>` : "";
  const headBack = `<path d="M44 48 L56 48 L57 58 L43 58 Z" ${st(sd)}/>` +
    `<ellipse cx="32.5" cy="34" rx="3.6" ry="5.2" ${st(s)}/><ellipse cx="67.5" cy="34" rx="3.6" ry="5.2" ${st(s)}/>` + part(HEAD_D, s, "M33 27 Q33 12 42 10 Q37 22 38 36 Q39 46 45 52 Q36 48 33 35 Z", null);
  const helm = p.head === 1 || p.head === 2;
  return `<svg viewBox="4 -26 92 178" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    <ellipse cx="50" cy="147" rx="30" ry="4.5" fill="#000" opacity=".3"/>
    ${shield}${sword}
    ${legsArt(p, true)}${torsoArt(p, true)}${arm ? arm.torso : ""}
    ${p.back != null ? capeArt(p.back) : ""}
    ${sleeveL()}${limb("M30 70 L26 84", s, 9)}${handAt(24, 87, s)}
    ${sleeveR()}${limb("M70 70 L67 84", s, 9)}${handAt(66, 87, s)}
    ${arm ? arm.arms.replace(/<rect[^>]*\/>/g, "") : ""}
    ${headBack}${helm ? "" : hairBackView(p.hair, p.hairColor)}${p.head != null ? headArt(p.head, true) : ""}
  </svg>`;
}
// a single gear icon for menus
const ICON_BOX = { hand: [42, 40, 64, 64], off: [6, 74, 36, 52], head: [24, -26, 52, 74], back: [14, 52, 72, 92] };
export function itemSVG(id) {
  const d = des(id); if (!d) return "";
  const [slot, r] = d;
  const wrap = (box, inner) => `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
  if (slot === "shirt") { const a = armourArt(r, false); return wrap("18 46 64 50", a.torso + (r === 0 ? "" : a.arms.replace(/<rect[^>]*\/>/g, ""))); }
  if (slot === "pants") {
    const c = PANTS_COL[r], t = PANTS_TRIM[r];
    return wrap("0 0 60 60", `<path d="M16 8 L44 8 L48 54 L34 54 L30 26 L26 54 L12 54 Z" ${st(c)}/><path d="M16 8 L22 8 L19 54 L12 54 Z" ${ff(shade(c, -0.3))}/>` +
      (t ? `<path d="M15 14 L13 52 M45 14 L47 52" stroke="${t}" stroke-width="2.4"/>` : "") +
      (r >= 3 ? `<ellipse cx="19" cy="38" rx="5.5" ry="4.5" ${st(r === 4 ? "#f2c94a" : "#7a74a8")}/><ellipse cx="41" cy="38" rx="5.5" ry="4.5" ${st(r === 4 ? "#f2c94a" : "#7a74a8")}/>` : "") +
      `<rect x="15" y="6" width="30" height="7" rx="1.5" ${st(DLEATHER)}/><rect x="27" y="5" width="6" height="9" rx="1.5" ${st(GOLD)}/>`);
  }
  const [x, y, w, h] = ICON_BOX[slot];
  const inner = slot === "hand" ? `<g transform="rotate(40 74 72)">${swordArt(r)}</g>` : slot === "off" ? shieldArt(r) : slot === "head" ? headArt(r, false) : capeArt(r);
  return wrap(`${x} ${y} ${w} ${h}`, inner);
}

export function flameSVG() {
  return `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 2c2 4 7 6 7 12a7 7 0 0 1-14 0c0-4 3-6 3-9 2 2 3 2 4-3z" fill="#ff7a2b" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M12 12c1.4 2 3 3 3 5a3 3 0 0 1-6 0c0-2 2-3 3-5z" fill="#ffd34a"/></svg>`;
}
