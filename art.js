// Questlog cartoon art: a chunky, determined hero seen from a 3/4 angle, plus gear and the streak flame.
// Flat colours with a darker side tone and one thick dark outline, like a mobile action game sticker.
// The hero faces right; the "near" limbs are on the viewer's side, the "far" limbs sit behind the body.

const INK = "#1b1530";
const SW = 3.4; // outline width

const st = (fill, extra = "") => `fill="${fill}" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round" stroke-linecap="round" ${extra}`;
const noStroke = (fill, extra = "") => `fill="${fill}" stroke="none" ${extra}`;

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const f = (c) => Math.max(0, Math.min(255, Math.round(c + (amt < 0 ? c * amt : (255 - c) * amt))));
  const r = f(n >> 16), g = f((n >> 8) & 255), b = f(n & 255);
  return "#" + ((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1);
}

/* ---------- gear (hero coordinates) ---------- */
// hand items sit in the far hand at (86, 100); the shield rides on the near arm.
const ITEMS = {
  sword: () => `
    <path d="M84 40 L90 48 L90 92 L80 92 L80 48 Z" ${st("#e3e9f5")}/>
    <path d="M85 47 L85 90" stroke="#aeb9cf" stroke-width="2.4" fill="none"/>
    <rect x="73" y="91" width="24" height="7" rx="2.5" ${st("#c98a2e")}/>
    <rect x="81.5" y="97" width="7" height="12" rx="2" ${st("#5e3a1f")}/>`,
  staff: () => `
    <rect x="82.5" y="34" width="6" height="90" rx="3" ${st("#8a5a2b")}/>
    <circle cx="85.5" cy="27" r="14" ${noStroke("#5ff0ff", 'opacity=".22"')}/>
    <path d="M85.5 16 L95 27 L85.5 38 L76 27 Z" ${st("#4fe3ff")}/>
    <path d="M85.5 20 L90 27 L85.5 27 Z" ${noStroke("#ffffff", 'opacity=".75"')}/>`,
  shield: () => `
    <path d="M38 78 L60 78 L60 98 Q60 112 49 118 Q38 112 38 98 Z" ${st("#9c6230")}/>
    <path d="M38 78 L44 78 L44 112 Q40 108 38 98 Z" ${noStroke(shade("#9c6230", -0.3))}/>
    <path d="M38 78 L60 78 L60 98 Q60 112 49 118 Q38 112 38 98 Z" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
    <path d="M49 82 L49 112 M41 92 L57 92" stroke="#e8b33a" stroke-width="4" stroke-linecap="round"/>`,
  cape: () => `<path d="M44 70 L62 70 L56 118 Q38 128 18 116 Q30 100 36 74 Z" ${st("#c8362f")}/>
    <path d="M40 80 Q34 102 26 114" stroke="${shade("#c8362f", -0.3)}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
  goldcape: () => `<path d="M44 70 L62 70 L56 118 Q38 128 18 116 Q30 100 36 74 Z" ${st("#6a34b0")}/>
    <path d="M21 112 Q38 120 56.6 112 L56 118 Q38 128 18 116 Z" ${st("#f1b829")}/>`,
  hat: () => `
    <ellipse cx="58" cy="17" rx="40" ry="8.5" ${st("#3f3596")}/>
    <path d="M36 15 Q44 -4 34 -20 Q56 -12 68 2 Q74 9 80 15 Z" ${st("#4a3fb0")}/>
    <path d="M38 12 Q58 17 78 12" stroke="#e8b33a" stroke-width="4.5" fill="none" stroke-linecap="round"/>`,
  helm: () => `
    <path d="M26 56 L26 30 Q26 4 58 4 Q92 4 92 30 L92 36 L70 36 Q66 46 66 60 L26 60 Z" ${st("#a9b4c8")}/>
    <path d="M26 56 L26 30 Q26 12 40 7 Q32 20 34 60 L26 60 Z" ${noStroke(shade("#a9b4c8", -0.28))}/>
    <path d="M26 56 L26 30 Q26 4 58 4 Q92 4 92 30 L92 36 L70 36 Q66 46 66 60 L26 60 Z" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
    <path d="M44 12 Q60 6 78 10" stroke="#ffffff" stroke-width="3" fill="none" opacity=".55" stroke-linecap="round"/>
    <path d="M40 6 Q30 -8 16 -6 Q26 2 34 12 Z" ${st("#c3283e")}/>`,
  crown: () => `
    <path d="M36 16 L34 -4 L46 6 L57 -10 L68 6 L80 -4 L80 16 Z" ${st("#f2bb2a")}/>
    <path d="M36 16 L34 -4 L42 3 L42 16 Z" ${noStroke(shade("#f2bb2a", -0.25))}/>
    <path d="M36 16 L34 -4 L46 6 L57 -10 L68 6 L80 -4 L80 16 Z" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
    <rect x="53" y="5" width="8" height="8" rx="1.5" transform="rotate(45 57 9)" ${st("#d8233f")}/>`,
};
// viewBox for each item shown alone: [x, y, w, h]
const ITEM_BOX = {
  sword: [58, 36, 54, 76], staff: [60, 10, 52, 116], shield: [24, 74, 50, 48], cape: [12, 64, 56, 66],
  goldcape: [12, 64, 56, 66], hat: [14, -24, 88, 46], helm: [10, -12, 88, 76], crown: [28, -14, 58, 34],
};

/* ---------- hair (hero coordinates, head spans x 28..90, y 10..66) ---------- */
function hairBack(style, c) {
  const d = shade(c, -0.22);
  if (style === "long") return `<path d="M28 30 Q26 8 56 8 L60 66 L44 96 Q30 98 22 88 Q28 72 26 50 Z" ${st(d)}/>`;
  if (style === "ponytail") return `<path d="M34 22 Q14 22 10 46 Q8 66 16 82 Q26 70 26 56 Q28 42 40 34 Z" ${st(d)}/>`;
  if (style === "bun") return `<circle cx="36" cy="10" r="12" ${st(d)}/>`;
  return "";
}
function hairFront(style, c) {
  const d = shade(c, -0.22), hi = shade(c, 0.3);
  // covers the crown and the back of the head, with a fringe falling over the front of the face
  const cap = `<path d="M27 52 L26 30 Q26 6 58 6 Q90 6 91 28 Q84 22 76 24 Q74 30 66 28 Q62 34 56 30 L50 34 Q46 44 48 56 Q36 58 27 52 Z" ${st(c)}/>
    <path d="M27 52 L26 30 Q26 12 40 8 Q34 24 36 54 Q30 55 27 52 Z" ${noStroke(d)}/>
    <path d="M27 52 L26 30 Q26 6 58 6 Q90 6 91 28 Q84 22 76 24 Q74 30 66 28 Q62 34 56 30 L50 34 Q46 44 48 56 Q36 58 27 52 Z" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
    <path d="M50 13 Q62 10 74 13" stroke="${hi}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`;
  switch (style) {
    case "short": case "bun": case "ponytail": return cap;
    case "long": return cap + `<path d="M48 56 Q44 70 46 84" stroke="${INK}" stroke-width="${SW}" fill="none" stroke-linecap="round"/>`;
    case "spiky": return `<path d="M27 54 L24 34 L12 30 L24 22 L16 8 L32 12 L34 -4 L48 8 L58 -8 L66 8 L82 0 L80 14 L94 18 L90 28 Q84 22 76 24 Q74 30 66 28 Q60 34 54 30 Q46 42 48 56 Q36 58 27 54 Z" ${st(c)}/>
      <path d="M27 54 L24 34 L12 30 L24 22 L16 8 L32 12 L34 -4 L40 8 Q32 24 36 56 Z" ${noStroke(d)}/>
      <path d="M27 54 L24 34 L12 30 L24 22 L16 8 L32 12 L34 -4 L48 8 L58 -8 L66 8 L82 0 L80 14 L94 18 L90 28 Q84 22 76 24 Q74 30 66 28 Q60 34 54 30 Q46 42 48 56 Q36 58 27 54 Z" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>`;
    default: return `<path d="M46 16 Q58 12 70 15" stroke="#ffffff" stroke-width="3.5" fill="none" opacity=".35" stroke-linecap="round"/>`;
  }
}

/* ---------- poses ---------- */
export const POSES = {
  stand: "Standing", crossed: "Arms crossed", behind: "Behind back",
  hips: "Hands on hips", fist: "Fist pump", think: "Thinking",
};

/* ---------- the hero ---------- */
// p: { body:"m"|"f", hair, hairColor, skin, tunic, head, back, hand, off }
export function heroSVG(p, opts = {}) {
  const female = p.body === "f";
  const skin = p.skin, skinD = shade(skin, -0.2);
  const tunic = p.tunic, tunicD = shade(tunic, -0.3);
  const pants = "#343c6e", pantsD = shade(pants, -0.3), boot = "#4a2f1c", bootD = shade(boot, -0.3);
  const box = opts.head ? "14 -22 92 92" : "-2 -26 124 162";
  const item = (k) => (k && ITEMS[k] ? ITEMS[k]() : "");

  // legs pivot at the hip; boots point forward (right)
  const leg = (x, far) => {
    const lf = female ? (far ? skinD : skin) : (far ? pantsD : pants);
    return `<rect x="${x}" y="96" width="13" height="22" rx="5" ${st(lf)}/>
      <path d="M${x - 2} 127 L${x - 2} 116 Q${x - 2} 112 ${x + 4} 112 L${x + 11} 112 Q${x + 15} 112 ${x + 16} 116 Q${x + 22} 118 ${x + 22} 124 L${x + 22} 127 Z" ${st(far ? bootD : boot)}/>`;
  };
  const legs = `<g class="leg-f">${leg(58, true)}</g><g class="leg-n">${leg(46, false)}</g>`;

  // torso: front panel plus a darker side panel on the left (the side turned away)
  const bottom = female ? 104 : 100;
  const torso = `<path d="M38 78 Q38 68 48 68 L74 68 Q82 68 82 78 L82 ${bottom} L38 ${bottom} Z" ${st(tunic)}/>
    <path d="M38 78 Q38 68 48 68 L52 68 Q48 76 48 ${bottom} L38 ${bottom} Z" ${noStroke(tunicD)}/>
    <path d="M38 78 Q38 68 48 68 L74 68 Q82 68 82 78 L82 ${bottom} L38 ${bottom} Z" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>
    <path d="M64 70 L60 84 L68 84 Z" ${noStroke(tunicD)}/>`;
  const skirt = female ? `<path d="M37 96 L83 96 L90 114 Q62 122 32 114 Z" ${st(tunic)}/>
    <path d="M37 96 L48 96 L44 117 Q37 116 32 114 Z" ${noStroke(tunicD)}/>
    <path d="M37 96 L83 96 L90 114 Q62 122 32 114 Z" fill="none" stroke="${INK}" stroke-width="${SW}" stroke-linejoin="round"/>` : "";
  const by = female ? 92 : 88;
  const belt = `<path d="M37 ${by} L83 ${by} L83 ${by + 8} L37 ${by + 8} Z" ${st("#5a3820")}/><rect x="64" y="${by - 1}" width="10" height="10" rx="1.5" ${st("#e8b33a")}/>`;

  // arms pivot at the shoulder
  // Arms by pose. A bent arm is a thick rounded stroke drawn twice: dark outline underneath, sleeve colour on top.
  const limb = (d, fill, w = 13) => `<path d="${d}" fill="none" stroke="${INK}" stroke-width="${w + SW * 2}" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="${d}" fill="none" stroke="${fill}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;
  const hand = (x, y, c, r = 6.8) => `<circle cx="${x}" cy="${y}" r="${r}" ${st(c)}/>`;
  const pose = POSES[p.pose] ? p.pose : "stand";
  const holds = pose === "stand"; // only the plain standing pose holds gear; other poses carry it on the back
  // gear carried on the back: weapon slung diagonally, shield flat against the back
  // sword: hilt pokes up over the back shoulder; staff: orb above the back shoulder; shield: against the back
  const slungWeapon = !holds && p.hand && ITEMS[p.hand]
    ? (p.hand === "staff"
      ? `<g transform="translate(-64 32) rotate(-30 85 27)">${ITEMS.staff()}</g>`
      : `<g transform="translate(-63 -31) rotate(140 85 103)">${ITEMS[p.hand]()}</g>`)
    : "";
  const slungShield = !holds && p.off && ITEMS[p.off] ? `<g transform="translate(-12 -8)">${ITEMS[p.off]()}</g>` : "";
  let armFar, armNear;
  switch (pose) {
    case "crossed":
      armFar = limb("M84 74 L86 82", tunicD);
      armNear = limb("M86 76 L84 84 L52 84", tunicD) + hand(52, 84, skinD) + limb("M48 74 L46 89 L78 91", tunic) + hand(80, 91, skin);
      break;
    case "behind":
      armFar = limb("M84 74 L80 98", tunicD);
      armNear = limb("M48 74 L43 90", tunic);
      break;
    case "hips":
      armFar = limb("M84 74 L95 86 L84 95", tunicD) + hand(84, 95, skinD);
      armNear = limb("M48 74 L35 85 L41 96", tunic) + hand(42, 96, skin);
      break;
    case "fist":
      armFar = `<g class="arm-f"><rect x="78" y="70" width="13" height="28" rx="6" ${st(tunicD)}/>${hand(85, 102, skinD, 6.5)}</g>`;
      armNear = limb("M48 74 L36 60 L40 44", tunic) + hand(40, 40, skin, 7.6) + `<path d="M36 37 L44 37 M36 41 L44 41" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>`;
      break;
    case "think":
      armFar = limb("M84 74 L86 84 L60 90", tunicD) + hand(58, 90, skinD);
      armNear = limb("M48 74 L46 90 L66 70", tunic) + hand(68, 66, skin);
      break;
    default:
      armFar = `<g class="arm-f"><rect x="78" y="70" width="13" height="28" rx="6" ${st(tunicD)}/>${item(p.hand)}<circle cx="85" cy="102" r="6.5" ${st(skinD)}/></g>`;
      armNear = `<g class="arm-n"><rect x="42" y="70" width="14" height="30" rx="6.5" ${st(tunic)}/><circle cx="49" cy="103" r="7" ${st(skin)}/>${item(p.off)}</g>`;
  }
  // with hands behind the back, the near arm sits behind the torso too
  const armBehind = pose === "behind" ? limb("M48 74 L40 98", tunic) + hand(44, 100, skin) : "";

  // boxy head turned to the right: ear on the left, both eyes on the right half
  const head = `
    <rect x="52" y="60" width="16" height="10" rx="3" ${st(skinD)}/>
    <rect x="28" y="10" width="62" height="56" rx="17" ${st(skin)}/>
    <path d="M28 40 L28 27 Q28 10 45 10 L44 10 Q34 30 38 66 L36 66 Q28 66 28 50 Z" ${noStroke(skinD)}/>
    <rect x="28" y="10" width="62" height="56" rx="17" fill="none" stroke="${INK}" stroke-width="${SW}"/>
    <ellipse cx="44" cy="42" rx="6" ry="7.5" ${st(skin)}/>
    <path d="M44 38 Q41 42 44 46" stroke="${skinD}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M64 33 L74 35" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>
    <path d="M81 35 L87 33" stroke="${INK}" stroke-width="3.6" stroke-linecap="round"/>
    <rect x="66.5" y="39" width="5.5" height="9" rx="2.7" ${noStroke(INK)}/>
    <rect x="81" y="39" width="4.5" height="8.5" rx="2.2" ${noStroke(INK)}/>
    ${female ? `<path d="M66 40 L62.5 37.5 M81 40 L78.5 37.8" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>` : ""}
    <path d="M71 56 L82 55" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`;

  const shadow = opts.head ? "" : `<ellipse cx="58" cy="128" rx="34" ry="5.5" fill="#000" opacity=".28"/>`;
  return `<svg viewBox="${box}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
    ${shadow}
    <g class="upper">${item(p.back)}${slungShield}${slungWeapon}${hairBack(p.hair, p.hairColor)}${pose === "crossed" || pose === "think" ? "" : armFar}${armBehind}</g>
    ${legs}
    <g class="upper">
      ${torso}${skirt}${belt}
      ${head}
      ${hairFront(p.hair, p.hairColor)}
      ${item(p.head)}
      ${pose === "crossed" || pose === "think" ? armFar : ""}
      ${armNear}
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
