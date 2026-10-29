// Questlog hero art: detailed "hi-bit" pixel art.
// The hero is described as vector shapes (easy to customise: body, hair, skin, pose, gear, dye),
// then rasterised onto a small pixel grid and every pixel is snapped to the sprite's own palette,
// so the result is crisp pixel art with 1px outlines and banded shading rather than smooth vectors.

const INK = "#20182e";      // outline
const SW = 1.6;             // outline width in vector units (about 1 pixel after scaling)

const st = (fill, extra = "") => `fill="${fill}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra}`;
const fillOnly = (fill, extra = "") => `fill="${fill}" stroke="none" ${extra}`;
const outline = (d) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`;

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}
// a filled shape with a shadow band, highlight band and outline
function shaded(d, base, shadowD, lightD) {
  return `<path d="${d}" ${fillOnly(base)}/>` +
    (shadowD ? `<path d="${shadowD}" ${fillOnly(shade(base, -0.28))}/>` : "") +
    (lightD ? `<path d="${lightD}" ${fillOnly(shade(base, 0.22))}/>` : "") + outline(d);
}

/* ---------- gear (hero coordinates: figure centred on x = 48, feet at y ≈ 146) ---------- */
const GOLD = "#e0a83a", STEEL = "#b7c1d3";
const SHIELD = "M13 66 L35 66 L35 84 Q35 96 24 102 Q13 96 13 84 Z";
const CAPE = "M33 50 L63 50 L76 128 Q48 135 20 128 Z";
const HELM = "M28 30 Q28 2 48 2 Q68 2 68 30 L68 40 L61 40 L61 22 L35 22 L35 40 L28 40 Z";
const CROWN = "M33 10 L32 -4 L40 3 L48 -8 L56 3 L64 -4 L63 10 Z";
const ITEMS = {
  sword: () => `
    <path d="M71 34 L74 38 L74 75 L68 75 L68 38 Z" ${st("#e6ecf6")}/>
    <path d="M71 38 L71 74" stroke="#9aa6bd" stroke-width="1.2" fill="none"/>
    <rect x="63" y="75" width="16" height="4" rx="1.5" ${st(GOLD)}/>
    <rect x="69" y="79" width="4" height="9" ${st("#5b3920")}/>
    <circle cx="71" cy="89.5" r="2.2" ${st(GOLD)}/>`,
  staff: () => `
    <rect x="69.5" y="20" width="3.4" height="126" ${st("#8b5a2e")}/>
    <path d="M71.2 8 L77 16 L71.2 24 L65.4 16 Z" ${st("#4fd9f5")}/>
    <path d="M71.2 11 L74 16 L71.2 16 Z" ${fillOnly("#ffffff")}/>
    <path d="M67 22 L75.4 22" stroke="${GOLD}" stroke-width="2.4"/>`,
  shield: () => shaded(SHIELD, "#a0612c", "M13 66 L18 66 L18 99 Q14 94 13 84 Z", "M30 66 L35 66 L35 76 L30 76 Z") +
    `<path d="M24 69 L24 98 M16 79 L32 79" stroke="${GOLD}" stroke-width="2.6"/>
     <rect x="21.5" y="76.5" width="5" height="5" ${st("#3a6bd8")}/>`,
  cape: () => shaded(CAPE, "#b8342c", "M33 50 L40 50 L30 131 Q24 130 20 128 Z", null) +
    `<path d="M22 124 Q48 131 74 124" stroke="${GOLD}" stroke-width="2" fill="none"/>`,
  goldcape: () => shaded(CAPE, "#7a3cc4", "M33 50 L40 50 L30 131 Q24 130 20 128 Z", null) +
    `<path d="M21 125 Q48 132 75 125 L76 128 Q48 135 20 128 Z" ${st(GOLD)}/>`,
  hat: () => `
    <ellipse cx="48" cy="12" rx="27" ry="5.5" ${st("#3b3192")}/>
    ${shaded("M33 10 Q40 -8 56 -20 Q51 -8 56 0 Q60 6 63 10 Z", "#4a3db0", "M33 10 Q40 -8 56 -20 Q46 -6 42 10 Z", null)}
    <path d="M34 8 Q48 12 62 8" stroke="${GOLD}" stroke-width="2.6" fill="none"/>`,
  helm: () => shaded(HELM, STEEL, "M28 30 Q28 6 40 3 Q33 14 34 22 L35 22 L35 40 L28 40 Z", "M50 4 Q62 6 64 18 L58 18 Q56 9 50 7 Z") +
    `<path d="M48 2 Q44 -8 52 -14 Q57 -4 51 2 Z" ${st("#c42a3e")}/>
     <path d="M28 22 L68 22" stroke="${INK}" stroke-width="${SW}"/>`,
  crown: () => shaded(CROWN, "#f2bf2e", "M33 10 L32 -4 L37 1 L38 10 Z", null) +
    `<rect x="45.5" y="2" width="5" height="5" transform="rotate(45 48 4.5)" ${st("#d8233f")}/>`,
};
// viewBox for each item shown on its own: [x, y, w, h]
const ITEM_BOX = {
  sword: [54, 32, 34, 60], staff: [50, 4, 42, 70], shield: [9, 63, 30, 42], cape: [16, 46, 64, 92],
  goldcape: [16, 46, 64, 92], hat: [18, -22, 60, 40], helm: [24, -16, 48, 58], crown: [28, -10, 40, 22],
};

/* ---------- hair (head spans x 31..65, y 8..46) ---------- */
function hairBack(style, c) {
  const d = shade(c, -0.3);
  if (style === "long") return `<path d="M29 24 Q28 2 48 2 Q68 2 67 24 L70 72 Q62 76 58 70 L58 44 L38 44 L38 70 Q34 76 26 72 Z" ${st(d)}/>`;
  if (style === "ponytail") return `<path d="M60 10 Q78 12 78 34 Q78 52 84 64 Q70 66 68 50 Q67 34 58 24 Z" ${st(d)}/>`;
  if (style === "bun") return `<circle cx="48" cy="1" r="7.5" ${st(d)}/>`;
  return "";
}
function hairFront(style, c) {
  const d = shade(c, -0.3), hi = shade(c, 0.3);
  // tousled cap with a spiky fringe
  const CAP = "M29 30 Q27 4 48 3 Q69 4 67 30 L65 24 L62 28 L60 19 L55 25 L52 16 L47 24 L43 15 L40 24 L36 18 L34 27 L31 23 Z";
  const SPIKY = "M29 30 L22 18 L29 16 L24 2 L36 8 L38 -6 L46 4 L52 -8 L56 4 L66 -2 L64 10 L74 12 L67 20 L67 30 L65 24 L62 28 L60 19 L55 25 L52 16 L47 24 L43 15 L40 24 L36 18 L34 27 L31 23 Z";
  const shine = `<path d="M38 8 Q46 4 55 6 L54 9 Q46 7 39 11 Z" ${fillOnly(hi)}/>`;
  switch (style) {
    case "short": case "bun": case "ponytail": case "long":
      return shaded(CAP, c, "M29 30 Q27 10 37 5 Q32 14 33 24 L31 23 Z M60 19 L62 28 L65 24 L67 30 L66 16 Q63 18 60 19 Z", null) + shine;
    case "spiky":
      return shaded(SPIKY, c, "M29 30 L22 18 L29 16 L24 2 L33 7 Q30 16 32 25 L31 23 Z", null) + shine;
    default:
      return `<path d="M40 11 Q47 8 54 10" stroke="#ffffff" stroke-width="1.6" fill="none" opacity=".4"/>`;
  }
}

/* ---------- poses ---------- */
export const POSES = {
  stand: "Standing", crossed: "Arms crossed", behind: "Behind back",
  hips: "Hands on hips", fist: "Fist pump", think: "Thinking",
};

/* ---------- the hero as vector shapes ---------- */
// p: { body:"m"|"f", hair, hairColor, skin, tunic, pose, head, back, hand, off }
export function heroVector(p, opts = {}) {
  const female = p.body === "f";
  const skin = p.skin, skinD = shade(skin, -0.22), skinL = shade(skin, 0.18);
  const main = p.tunic, mainD = shade(main, -0.3), mainL = shade(main, 0.2);
  const cloth = "#ece3d0", clothD = "#c2b49a";          // undershirt
  const pants = "#3a2b2b", pantsD = "#271c1d";
  const leather = "#7a4a26", leatherD = "#56331a";
  const glove = "#2f2a33";
  const box = opts.head ? "24 -14 48 62" : "0 -24 96 174";
  const item = (k) => (k && ITEMS[k] ? ITEMS[k]() : "");
  const pose = POSES[p.pose] ? p.pose : "stand";
  const holds = pose === "stand";

  // legs: baggy trousers tucked into cuffed boots, feet apart
  const legL = `M37 86 L48 86 L46 116 L35 116 Z`, legR = `M48 86 L59 86 L61 116 L50 116 Z`;
  const bootL = `M33 114 L46 114 L46 138 L47 144 L28 144 Q27 139 33 137 Z`;
  const bootR = `M50 114 L63 114 L63 137 Q69 139 68 144 L49 144 L50 138 Z`;
  const legs = (female
      ? `<path d="M38 96 L47 96 L46 116 L36 116 Z" ${st(skin)}/><path d="M49 96 L58 96 L60 116 L50 116 Z" ${st(skin)}/>`
      : shaded(legL, pants, "M37 86 L41 86 L39 116 L35 116 Z", null) + shaded(legR, pants, "M48 86 L52 86 L53 116 L50 116 Z", null) +
        `<rect x="38" y="100" width="6" height="6" transform="rotate(45 41 103)" ${st(GOLD)}/><rect x="52" y="100" width="6" height="6" transform="rotate(45 55 103)" ${st(GOLD)}/>`) +
    shaded(bootL, leather, "M33 114 L37 114 L37 143 L28 144 Q27 139 33 137 Z", "M42 118 L45 118 L45 134 L42 134 Z") +
    shaded(bootR, leather, "M50 114 L54 114 L54 144 L49 144 L50 138 Z", "M59 118 L62 118 L62 134 L59 134 Z") +
    `<path d="M33 118 L46 118 M50 118 L63 118" stroke="${GOLD}" stroke-width="2"/>
     <path d="M28 144 L47 144 M49 144 L68 144" stroke="${leatherD}" stroke-width="2"/>`;

  // torso: white undershirt, coloured tabard over it, leather belt with pouch
  const SHIRT = "M31 54 Q32 47 40 47 L56 47 Q64 47 65 54 L66 86 L30 86 Z";
  const TABARD = female ? "M38 47 L58 47 L60 86 L70 112 Q48 118 26 112 L36 86 Z" : "M39 47 L57 47 L58 86 L56 108 L48 113 L40 108 L38 86 Z";
  const torso = shaded(SHIRT, cloth, "M31 54 Q32 47 40 47 L41 47 Q36 60 36 86 L30 86 Z", null) +
    shaded(TABARD, main, female ? "M38 47 L42 47 L40 86 L33 114 Q29 113 26 112 L36 86 Z" : "M39 47 L43 47 L43 110 L40 108 L38 86 Z", "M53 49 L56 49 L57 70 L54 70 Z") +
    `<path d="M48 90 L48 109" stroke="${GOLD}" stroke-width="1.6"/>
     <path d="M44 96 L48 92 L52 96 L48 100 Z" ${fillOnly(GOLD)}/>
     <path d="M41 47 L48 56 L55 47" ${st(clothD)}/>
     <path d="M39 47 Q48 53 57 47 L58 50 Q48 57 38 50 Z" ${st(mainD)}/>
     <path d="M33 52 L62 79" stroke="${leatherD}" stroke-width="2.4"/>
     <rect x="30" y="82" width="36" height="5" ${st(leather)}/>
     <rect x="45" y="81" width="6" height="7" ${st(GOLD)}/><rect x="47" y="83" width="2" height="3" ${fillOnly(leatherD)}/>
     <rect x="27" y="84" width="8" height="9" rx="1.5" ${st(leatherD)}/>`;

  // arms: sleeve to the elbow, gloved forearm; a bent arm is a stroked path over an outline stroke
  const limb = (d, fill, w) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + SW * 2}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const arm = (sx, sy, ex, ey, hx, hy, far) =>
    limb(`M${sx} ${sy} L${ex} ${ey}`, far ? clothD : cloth, 8) + limb(`M${ex} ${ey} L${hx} ${hy}`, glove, 7) +
    `<circle cx="${hx}" cy="${hy}" r="3.6" ${st(far ? skinD : skin)}/>`;
  const fist = (x, y) => `<rect x="${x - 4}" y="${y - 4}" width="8" height="8" rx="2" ${st(glove)}/><path d="M${x - 3} ${y - 1} L${x + 3} ${y - 1} M${x - 3} ${y + 1.5} L${x + 3} ${y + 1.5}" stroke="${shade(glove, 0.4)}" stroke-width=".9"/>`;
  const pads = `${shaded("M27 49 Q34 44 40 49 L39 57 Q32 56 26 58 Z", STEEL, "M27 49 Q30 47 32 47 L31 57 L26 58 Z", null)}
    ${shaded("M56 49 Q62 44 69 49 L70 58 Q64 56 57 57 Z", STEEL, null, "M62 47 Q66 47 68 49 L66 52 Q63 50 61 50 Z")}
    <path d="M32 50 L34 53 L32 55 L30 53 Z M64 50 L66 53 L64 55 L62 53 Z" ${fillOnly(GOLD)}/>`;
  let back = "", front = "";
  switch (pose) {
    case "crossed":
      front = arm(66, 54, 68, 68, 40, 69, false) + arm(30, 54, 28, 70, 56, 73, true);
      break;
    case "behind":
      back = arm(30, 54, 33, 70, 38, 84, true) + arm(66, 54, 63, 70, 58, 84, true);
      break;
    case "hips":
      front = arm(30, 54, 21, 68, 32, 82, true) + arm(66, 54, 75, 68, 64, 82, false);
      break;
    case "fist":
      front = limb("M30 54 L21 44", cloth, 8) + limb("M21 44 L23 30", glove, 7) + fist(23, 27) + arm(66, 54, 70, 70, 71, 84, false);
      break;
    case "think":
      front = arm(66, 54, 67, 70, 44, 72, false) + limb("M30 54 L29 69", clothD, 8) + limb("M29 69 L44 48", glove, 7) + `<circle cx="45" cy="46" r="3.6" ${st(skin)}/>`;
      break;
    default:
      front = arm(30, 54, 27, 70, 25, 84, true) + item(p.off) + arm(66, 54, 69, 70, 71, 84, false) + item(p.hand) + `<circle cx="71" cy="84" r="3.6" ${st(skin)}/>`;
  }
  // gear carried on the back when the hands are busy
  const slung = holds ? "" :
    (p.hand === "staff" ? `<g transform="translate(-34 22) rotate(-24 71 16)">${ITEMS.staff()}</g>` :
      p.hand && ITEMS[p.hand] ? `<g transform="translate(-6 -38) rotate(-135 71 88)">${ITEMS[p.hand]()}</g>` : "") +
    (p.off && ITEMS[p.off] ? `<g transform="translate(24 -12)">${ITEMS[p.off]()}</g>` : "");

  // head: anime-style face, eyes with iris and a highlight, determined brows and a small smile
  const HEAD = "M31 22 Q31 8 48 8 Q65 8 65 22 L65 32 Q65 44 48 46 Q31 44 31 32 Z";
  const eye = (x, flip) => `
    <rect x="${x - 3}" y="27" width="6" height="7" rx="1.2" ${fillOnly("#ffffff")}/>
    <rect x="${x - 2 + (flip ? 0 : 0.5)}" y="28" width="4" height="6" rx="1" ${fillOnly("#6b3d1f")}/>
    <rect x="${x - 1}" y="30" width="2" height="3" ${fillOnly(INK)}/>
    <rect x="${x + (flip ? -1.5 : 0.5)}" y="28.5" width="1.5" height="1.5" ${fillOnly("#ffffff")}/>
    <path d="M${x - 3.6} 27 L${x + 3.6} 27" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`;
  const lash = female ? `<path d="M36.5 27 L34.5 25.5 M59.5 27 L61.5 25.5" stroke="${INK}" stroke-width="1.2" stroke-linecap="round"/>` : "";
  const head = `
    <rect x="44" y="42" width="8" height="7" ${st(skinD)}/>
    <ellipse cx="31" cy="30" rx="2.6" ry="4" ${st(skin)}/><ellipse cx="65" cy="30" rx="2.6" ry="4" ${st(skin)}/>
    ${shaded(HEAD, skin, "M31 22 Q31 10 38 9 Q34 24 36 43 Q31 40 31 32 Z", "M58 14 Q63 17 63 24 L61 24 Q60 18 57 16 Z")}
    ${eye(40, false)}${eye(56, true)}${lash}
    <path d="M35.5 22.5 L43.5 21.5 M52.5 21.5 L60.5 22.5" stroke="${shade(p.hairColor, -0.35)}" stroke-width="2.2" stroke-linecap="round"/>
    <path d="M48 33 L48.8 36.5 L47.2 36.5" ${fillOnly(skinD)}/>
    <path d="M44.5 40 Q48 42.5 52 39.5" stroke="${INK}" stroke-width="1.3" fill="none" stroke-linecap="round"/>
    <rect x="35" y="35" width="3" height="1.5" ${fillOnly("#e8907a")}/><rect x="58" y="35" width="3" height="1.5" ${fillOnly("#e8907a")}/>`;

  return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges">
    ${item(p.back)}${slung}${hairBack(p.hair, p.hairColor)}${back}
    ${legs}
    ${torso}${pads}
    ${head}
    ${hairFront(p.hair, p.hairColor)}
    ${item(p.head)}
    ${front}
  </svg>`;
}

/* ---------- pixelising ---------- */
// Rasterise an SVG at a small pixel size, make every pixel fully opaque or fully clear,
// and snap colours to the palette used in the SVG so anti-aliased edges become clean pixels.
const cache = new Map();
function paletteOf(svg) {
  const set = new Set((svg.match(/#[0-9a-fA-F]{6}\b/g) || []).map((h) => h.toLowerCase()));
  return [...set].map((h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
}
export function pixelize(svg, w, h, shadow) {
  const key = w + "x" + h + (shadow ? "s" : "") + svg;
  if (cache.has(key)) return cache.get(key);
  const job = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas"); c.width = w; c.height = h;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h), px = data.data, pal = paletteOf(svg);
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] < 110) { px[i + 3] = 0; continue; }
        const a = px[i + 3] / 255;
        const r = px[i] / a, g = px[i + 1] / a, b = px[i + 2] / a; // undo premultiplied edge darkening
        let best = pal[0], bd = Infinity;
        for (const q of pal) { const dd = (q[0] - r) ** 2 + (q[1] - g) ** 2 + (q[2] - b) ** 2; if (dd < bd) { bd = dd; best = q; } }
        px[i] = best[0]; px[i + 1] = best[1]; px[i + 2] = best[2]; px[i + 3] = 255;
      }
      const out = document.createElement("canvas"); out.width = w; out.height = h;
      const o = out.getContext("2d");
      if (shadow) { // flat pixel shadow under the feet
        o.fillStyle = "rgba(10,6,30,.35)";
        const cx = w / 2, cy = h - 3, rx = w * 0.33;
        for (let y = -2; y <= 2; y++) { const half = Math.round(rx * Math.sqrt(1 - (y / 2.6) ** 2)); o.fillRect(Math.round(cx - half), cy + y, half * 2, 1); }
      }
      ctx.putImageData(data, 0, 0);
      o.drawImage(c, 0, 0);
      resolve(out.toDataURL());
    };
    img.onerror = () => resolve("");
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
  });
  cache.set(key, job);
  return job;
}

// Public helpers: return SVG strings for the app to pixelise at the right size.
export function heroSVG(p, opts = {}) { return heroVector(p, opts); }
export const HERO_PX = { w: 66, h: 120 };     // full figure pixel size
export const HEAD_PX = { w: 40, h: 52 };      // head portrait pixel size

/* ---------- single item icons ---------- */
export function itemSVG(id, colour) {
  if (id.startsWith("dye")) {
    return `<svg viewBox="0 0 30 30" xmlns="http://www.w3.org/2000/svg">
      <rect x="12" y="3" width="6" height="5" ${st("#b08a55")}/>
      <path d="M12 8 L18 8 L18 11 Q25 14 25 20 Q25 27 15 27 Q5 27 5 20 Q5 14 12 11 Z" ${st("#e8eefc")}/>
      <path d="M6.5 19 L23.5 19 Q23 25.5 15 25.5 Q7 25.5 6.5 19 Z" ${fillOnly(colour)}/>
      <rect x="9" y="13" width="2" height="4" ${fillOnly("#ffffff")}/>
    </svg>`;
  }
  const [x, y, w, h] = ITEM_BOX[id];
  return `<svg viewBox="${x} ${y} ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${ITEMS[id]()}</svg>`;
}

/* ---------- streak flame (pixelised too) ---------- */
export function flameSVG() {
  return `<svg viewBox="0 0 60 72" xmlns="http://www.w3.org/2000/svg">
    <path d="M30 3 C37 17 53 24 53 46 C53 61 43 69 30 69 C17 69 7 61 7 46 C7 33 15 27 17 15 C22 25 25 25 26 19 C27 13 28 8 30 3 Z" fill="#ff6a2b" stroke="${INK}" stroke-width="3.2"/>
    <path d="M30 22 C35 31 45 36 45 50 C45 60 38 65 30 65 C22 65 15 60 15 50 C15 42 20 38 22 31 C25 37 28 34 30 22 Z" fill="#ffb23d"/>
    <path d="M30 38 C34 44 39 47 39 54 C39 60 35 63 30 63 C25 63 21 60 21 54 C21 48 26 46 30 38 Z" fill="#ffe98a"/>
  </svg>`;
}
