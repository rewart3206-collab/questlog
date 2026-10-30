// Questlog dungeon.
// Each run costs one ticket (one refills every 4 hours, up to 6) and has 5 floors: four themed monsters, then the boss.
// There are five themed dungeons with fixed fights and a boss; clearing one opens the next.
// Each turn the hero chooses one action:
//   Attack – weapon damage, may crit (capes add crit chance). Every attack charges the equipped spell.
//   Spell  – usable once charged. Fireball is the starter spell; others come from chests.
//   Shield – take only a quarter of this turn's damage, less the shield's block bonus.
// Monsters charge a special attack over several turns. The build-up shows only as a growing glow
// around the monster, so the player has to read it and shield at the right moment.
// Intelligence adds spell power; attack, HP and the rest come from gear. Dungeons give gold, not XP.

import { itemSVG } from "./art.js";

const fmtWait = (ms) => { const m = Math.max(1, Math.ceil(ms / 60000)), h = Math.floor(m / 60); return h ? h + "h " + (m % 60) + "m" : m + "m"; };

const INK = "#1c1430";
const FLOORS = 5;
const st = (f, w = 2.6) => `fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/* ---------------- spells ---------------- */
const FIRE_ICON = `<svg viewBox="0 0 40 40"><path d="M22 4 C26 12 34 14 34 24 A13 13 0 0 1 8 24 C8 18 12 15 13 10 C16 15 19 14 22 4 Z" ${st("#ff6a2b", 2.2)}/><path d="M21 16 C24 21 28 22 28 27 A7 7 0 0 1 14 27 C14 23 18 21 21 16 Z" fill="#ffd34a"/></svg>`;
const POISON_ICON = `<svg viewBox="0 0 40 40"><path d="M15 5 L25 5 L25 12 Q34 16 34 26 Q34 36 20 36 Q6 36 6 26 Q6 16 15 12 Z" ${st("#5fd36a", 2.2)}/><rect x="14" y="3" width="12" height="5" rx="2" ${st("#3a6b3a", 2)}/><circle cx="16" cy="24" r="3" fill="#2a6b2a"/><circle cx="24" cy="28" r="2.4" fill="#2a6b2a"/><circle cx="22" cy="20" r="1.8" fill="#b8ff9a"/></svg>`;
export const SPELLS = {
  fireball: { name: "Fireball", charge: 3, icon: FIRE_ICON, desc: "Charges in 3 attacks. A blast of fire that ignores armour and can crit." },
  poison: { name: "Poison Cloud", charge: 2, icon: POISON_ICON, desc: "Charges in 2 attacks. Poisons the monster, hurting it every turn." },
};
const fireDmg = (sp) => 12 + 3 * sp;

/* ---------------- charms ----------------
   One charm per dungeon, earned the first time you clear it. A charm sits in its own slot,
   isn't drawn on the hero and gives one special effect. */
const charmIcon = (col, emblem) => `<svg viewBox="0 0 40 44"><path d="M10 4 Q20 16 30 4" fill="none" stroke="#c9a06a" stroke-width="2.6" stroke-linecap="round"/>
  <circle cx="20" cy="27" r="13" ${st(col, 2.4)}/><circle cx="20" cy="27" r="9.5" fill="none" stroke="#fff" stroke-width="1.4" opacity=".45"/>${emblem}
  <rect x="17" y="11" width="6" height="5" rx="1.5" ${st("#f2b631", 1.8)}/></svg>`;
export const CHARMS = {
  slime: { name: "Slime Charm", from: 0, desc: "+20 max HP", icon: charmIcon("#5fd36a", `<path d="M20 19 Q27 27 26 31 A6 6 0 0 1 14 31 Q13 27 20 19 Z" ${st("#b5f5a0", 1.8)}/>`) },
  bone: { name: "Bone Charm", from: 1, desc: "+3 defence", icon: charmIcon("#d9d2bf", `<path d="M14 23 L26 31 M14 31 L26 23" stroke="${INK}" stroke-width="4" stroke-linecap="round"/><path d="M14 23 L26 31 M14 31 L26 23" stroke="#fff8e6" stroke-width="2" stroke-linecap="round"/>`) },
  imp: { name: "Imp Charm", from: 2, desc: "+10% chance to dodge a hit", icon: charmIcon("#8a4fd6", `<path d="M13 22 L16 30 L20 24 L24 30 L27 22" fill="none" stroke="#ffe14a" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/><circle cx="20" cy="33" r="2" fill="#ffe14a"/>`) },
  golem: { name: "Golem Charm", from: 3, desc: "Your shield blocks 90% of a hit instead of 75%", icon: charmIcon("#a3a6b5", `<rect x="14" y="21" width="12" height="12" rx="2" ${st("#7d8090", 1.8)}/><rect x="16.5" y="25" width="2.6" height="2" fill="#5ff0ff"/><rect x="21" y="25" width="2.6" height="2" fill="#5ff0ff"/>`) },
  dragon: { name: "Dragon Charm", from: 4, desc: "Spells are 50% stronger", icon: charmIcon("#e2443f", `<path d="M20 18 C23 23 27 24 27 29 A7 7 0 0 1 13 29 C13 26 15 25 16 22 C18 25 19 24 20 18 Z" ${st("#ffcf4a", 1.8)}/>`) },
};
export const CHARM_OF = ["slime", "bone", "imp", "golem", "dragon"];
const poisonStacks = (sp) => 5 + 2 * sp;

/* ---------------- monsters ---------------- */
// charge: turns of building before the special fires. mult: special damage as a multiple of a normal hit.
const ENEMIES = {
  slime: { name: "Slime", hp: 16, atk: [3, 5], charge: 3, mult: 2.5, special: "Body Slam", twist: null, desc: "A wobbly blob. No tricks." },
  skeleton: { name: "Skeleton", hp: 18, atk: [3, 6], charge: 4, mult: 3, special: "Bone Storm", twist: "nopoison", desc: "Bones don't bleed: immune to poison." },
  imp: { name: "Mirror Imp", hp: 16, atk: [3, 6], charge: 3, mult: 2.5, special: "Hex Blast", twist: "dodge", desc: "Slippery: dodges 1 in 4 attacks. Spells always hit." },
  golem: { name: "Stone Golem", hp: 24, atk: [4, 7], charge: 4, mult: 3, special: "Earthquake", twist: "armour", desc: "Armoured: attacks deal less. Spells ignore armour." },
  dragon: { name: "Elder Dragon", hp: 48, atk: [4, 8], charge: 3, mult: 0, special: "Fire Breath", twist: "breath", desc: "Breathes fire when its flames have built up." },
  whelp: { name: "Dragon Whelp", art: "dragon", hp: 20, atk: [4, 7], charge: 3, mult: 2.5, special: "Flame Spit", twist: null, desc: "A young dragon. Its flames build up fast." },
  // bosses guard floor 5 of each dungeon
  king_slime: { name: "King Slime", art: "slime", crown: [60, 31], hp: 44, atk: [4, 6], charge: 3, mult: 3, special: "Royal Slam", twist: null, desc: "The biggest blob of them all." },
  skeleton_king: { name: "Skeleton King", art: "skeleton", crown: [60, 10], hp: 46, atk: [4, 7], charge: 4, mult: 3, special: "Bone Storm", twist: "nopoison", desc: "Bones don't bleed: immune to poison." },
  imp_queen: { name: "Imp Queen", art: "imp", crown: [60, 22], hp: 42, atk: [4, 7], charge: 3, mult: 3, special: "Hex Storm", twist: "dodge", desc: "Slippery: dodges 1 in 4 attacks. Spells always hit." },
  golem_titan: { name: "Golem Titan", art: "golem", crown: [65, 11], hp: 52, atk: [5, 8], charge: 4, mult: 3, special: "Earthquake", twist: "armour", desc: "Armoured: attacks deal less. Spells ignore armour." },
};

const ENEMY_ART = {
  slime: `<svg viewBox="0 0 120 120"><ellipse cx="60" cy="110" rx="40" ry="6" fill="#000" opacity=".3"/>
    <path d="M18 104 Q14 60 44 40 Q60 22 76 40 Q106 60 102 104 Z" ${st("#5fd36a", 3.4)}/>
    <path d="M28 92 Q26 66 46 50" fill="none" stroke="#b5f5a0" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="48" cy="72" rx="7" ry="9" fill="#fff" stroke="${INK}" stroke-width="2.4"/><ellipse cx="74" cy="72" rx="7" ry="9" fill="#fff" stroke="${INK}" stroke-width="2.4"/>
    <circle cx="50" cy="74" r="3.6" fill="${INK}"/><circle cx="72" cy="74" r="3.6" fill="${INK}"/>
    <path d="M52 90 Q61 96 70 90" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></svg>`,
  skeleton: `<svg viewBox="0 0 120 140"><ellipse cx="60" cy="132" rx="30" ry="5" fill="#000" opacity=".3"/>
    <path d="M44 128 L48 100 M76 128 L72 100" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M44 128 L48 100 M76 128 L72 100" stroke="#ece6d6" stroke-width="5" stroke-linecap="round"/>
    <rect x="44" y="58" width="32" height="44" rx="8" ${st("#ece6d6")}/>
    <path d="M48 68 L72 68 M48 78 L72 78 M48 88 L72 88" stroke="#a89f88" stroke-width="3" stroke-linecap="round"/>
    <path d="M44 64 L26 92 M76 64 L94 92" stroke="${INK}" stroke-width="9" stroke-linecap="round"/><path d="M44 64 L26 92 M76 64 L94 92" stroke="#ece6d6" stroke-width="5" stroke-linecap="round"/>
    <path d="M34 34 Q34 8 60 8 Q86 8 86 34 Q86 46 76 50 L76 58 L44 58 L44 50 Q34 46 34 34 Z" ${st("#f4efe2", 3)}/>
    <ellipse cx="49" cy="33" rx="7" ry="8" fill="${INK}"/><ellipse cx="71" cy="33" rx="7" ry="8" fill="${INK}"/>
    <circle cx="49" cy="34" r="2.4" fill="#ff5a5a"/><circle cx="71" cy="34" r="2.4" fill="#ff5a5a"/>
    <path d="M57 44 L60 40 L63 44 Z" fill="${INK}"/><path d="M50 52 L50 57 M56 52 L56 57 M62 52 L62 57 M68 52 L68 57" stroke="${INK}" stroke-width="2"/></svg>`,
  imp: `<svg viewBox="0 0 120 130"><ellipse cx="60" cy="122" rx="32" ry="5" fill="#000" opacity=".3"/>
    <path d="M30 70 Q8 50 14 30 Q30 46 40 52 Z" ${st("#5a2f8a")}/><path d="M90 70 Q112 50 106 30 Q90 46 80 52 Z" ${st("#5a2f8a")}/>
    <path d="M42 118 L46 96 M78 118 L74 96" stroke="${INK}" stroke-width="10" stroke-linecap="round"/><path d="M42 118 L46 96 M78 118 L74 96" stroke="#8a4fd6" stroke-width="6" stroke-linecap="round"/>
    <path d="M38 64 Q60 54 82 64 L80 100 Q60 108 40 100 Z" ${st("#8a4fd6")}/>
    <path d="M36 40 L28 12 L48 28 Z M84 40 L92 12 L72 28 Z" ${st("#3a1f5e")}/>
    <ellipse cx="60" cy="42" rx="26" ry="22" ${st("#a46cf0", 3)}/>
    <path d="M46 38 L56 42 M74 38 L64 42" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <ellipse cx="51" cy="45" rx="4" ry="4.6" fill="#ffe14a" stroke="${INK}" stroke-width="2"/><ellipse cx="69" cy="45" rx="4" ry="4.6" fill="#ffe14a" stroke="${INK}" stroke-width="2"/>
    <path d="M50 54 Q60 60 70 54" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><path d="M54 55 L56 59 L58 56 M62 56 L64 59 L66 55" fill="#fff" stroke="${INK}" stroke-width="1.2"/>
    <ellipse cx="92" cy="86" rx="15" ry="19" ${st("#c3e9ff", 3)}/><path d="M86 74 Q90 72 94 74" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round"/>
    <rect x="88" y="104" width="8" height="10" rx="2" ${st("#f2b631")}/></svg>`,
  golem: `<svg viewBox="0 0 130 140"><ellipse cx="65" cy="132" rx="42" ry="6" fill="#000" opacity=".3"/>
    <rect x="38" y="104" width="20" height="26" rx="4" ${st("#8d8f9e")}/><rect x="72" y="104" width="20" height="26" rx="4" ${st("#8d8f9e")}/>
    <path d="M28 52 Q30 40 44 40 L86 40 Q100 40 102 52 L104 106 L26 106 Z" ${st("#a3a6b5", 3.2)}/>
    <path d="M28 52 Q30 40 44 40 L50 40 Q40 60 42 106 L26 106 Z" fill="#7d8090"/>
    <path d="M60 60 L70 70 L62 82 M84 92 L76 98" fill="none" stroke="#6c6e7c" stroke-width="2.6" stroke-linecap="round"/>
    <rect x="8" y="50" width="22" height="50" rx="9" ${st("#8d8f9e")}/><rect x="100" y="50" width="22" height="50" rx="9" ${st("#8d8f9e")}/>
    <rect x="4" y="96" width="30" height="22" rx="7" ${st("#a3a6b5")}/><rect x="96" y="96" width="30" height="22" rx="7" ${st("#a3a6b5")}/>
    <rect x="44" y="10" width="42" height="34" rx="8" ${st("#b4b7c5", 3)}/>
    <rect x="50" y="22" width="11" height="7" rx="2" fill="#5ff0ff" stroke="${INK}" stroke-width="2"/><rect x="69" y="22" width="11" height="7" rx="2" fill="#5ff0ff" stroke="${INK}" stroke-width="2"/>
    <path d="M54 36 L76 36" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>
    <path d="M30 60 Q14 70 22 84" fill="none" stroke="#7bc96a" stroke-width="4" stroke-linecap="round"/></svg>`,
  dragon: `<svg viewBox="0 0 150 140"><ellipse cx="75" cy="132" rx="50" ry="6" fill="#000" opacity=".3"/>
    <path d="M44 62 Q10 30 4 62 Q20 60 26 76 Q34 64 44 74 Z" ${st("#b8262f")}/><path d="M106 62 Q140 30 146 62 Q130 60 124 76 Q116 64 106 74 Z" ${st("#b8262f")}/>
    <path d="M104 112 Q138 114 140 92 Q148 108 136 122 Q118 130 100 124 Z" ${st("#e2443f")}/>
    <rect x="50" y="106" width="18" height="22" rx="6" ${st("#c9373a")}/><rect x="82" y="106" width="18" height="22" rx="6" ${st("#c9373a")}/>
    <path d="M44 74 Q46 56 75 56 Q104 56 106 74 L108 112 Q75 122 42 112 Z" ${st("#e2443f", 3.2)}/>
    <path d="M58 70 L92 70 L94 112 Q75 118 56 112 Z" ${st("#ffc96b")}/><path d="M60 82 L90 82 M60 94 L91 94 M60 106 L92 106" stroke="#d98a2a" stroke-width="2.4"/>
    <path d="M52 30 L44 8 L60 22 Z M98 30 L106 8 L90 22 Z" ${st("#f2e2b6")}/>
    <path d="M46 40 Q46 18 75 18 Q104 18 104 40 Q104 52 96 58 L54 58 Q46 52 46 40 Z" ${st("#e2443f", 3.2)}/>
    <ellipse cx="75" cy="50" rx="20" ry="10" ${st("#f07a5a")}/><circle cx="68" cy="48" r="2" fill="${INK}"/><circle cx="82" cy="48" r="2" fill="${INK}"/>
    <path d="M56 32 L66 36 M94 32 L84 36" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>
    <ellipse cx="62" cy="38" rx="4" ry="4.4" fill="#ffe14a" stroke="${INK}" stroke-width="2"/><ellipse cx="88" cy="38" rx="4" ry="4.4" fill="#ffe14a" stroke="${INK}" stroke-width="2"/>
    <path d="M62 38 L62 38.1 M88 38 L88 38.1" stroke="${INK}" stroke-width="3" stroke-linecap="round"/></svg>`,
};

/* ---------------- dungeons ---------------- */
// Each dungeon has a theme and the same five fights every run, ending with its boss.
// Clearing a dungeon opens the next one. t = tier: monsters get more HP and hit harder each tier.
// fx is a CSS filter that recolours the monster for each variant.
export const DUNGEONS = [
  { id: "cave", name: "Slime Cave", bg: "#2a4a3a,#3f7a52", floors: [
    { key: "slime", name: "Green Slime" }, { key: "slime", name: "Green Slime" },
    { key: "slime", name: "Blue Slime", fx: "hue-rotate(95deg)" }, { key: "slime", name: "Red Slime", fx: "hue-rotate(-115deg) saturate(1.3)" },
    { key: "king_slime", name: "King Slime", fx: "hue-rotate(160deg) saturate(1.3)" }] },
  { id: "crypt", name: "Bone Crypt", bg: "#1f2a4a,#3a4f7a", floors: [
    { key: "skeleton", name: "Skeleton" }, { key: "skeleton", name: "Skeleton" },
    { key: "skeleton", name: "Mossy Skeleton", fx: "sepia(.7) hue-rotate(50deg) saturate(1.6)" }, { key: "skeleton", name: "Skeleton Knight", fx: "brightness(.75) contrast(1.2)" },
    { key: "skeleton_king", name: "Skeleton King" }] },
  { id: "forge", name: "Imp Hollow", bg: "#2a1440,#5a2a7a", floors: [
    { key: "imp", name: "Mirror Imp" }, { key: "imp", name: "Mirror Imp" },
    { key: "imp", name: "Fire Imp", fx: "hue-rotate(95deg) saturate(1.4)" }, { key: "imp", name: "Shadow Imp", fx: "brightness(.6) contrast(1.3)" },
    { key: "imp_queen", name: "Imp Queen", fx: "hue-rotate(-40deg) saturate(1.3)" }] },
  { id: "keep", name: "Golem Forge", bg: "#4a1a10,#8a3a1a", floors: [
    { key: "golem", name: "Stone Golem" }, { key: "golem", name: "Stone Golem" },
    { key: "golem", name: "Iron Golem", fx: "sepia(.5) hue-rotate(170deg) saturate(1.8)" }, { key: "golem", name: "Magma Golem", fx: "sepia(1) saturate(3) hue-rotate(-25deg)" },
    { key: "golem_titan", name: "Golem Titan", fx: "sepia(.6) saturate(1.6) hue-rotate(-10deg) brightness(.95)" }] },
  { id: "citadel", name: "Dragon Peak", bg: "#14081f,#3a1a4a", floors: [
    { key: "whelp", name: "Dragon Whelp" }, { key: "whelp", name: "Dragon Whelp" },
    { key: "whelp", name: "Frost Drake", fx: "hue-rotate(190deg)" }, { key: "whelp", name: "Shadow Drake", fx: "hue-rotate(250deg) brightness(.8)" },
    { key: "dragon", name: "Elder Dragon" }] },
];
const BOSS_OF = (t) => DUNGEONS[t].floors[FLOORS - 1];
// a monster's picture: its base art, a crown for bosses, recoloured for its variant
const CROWN = `<path d="M-18 0 L-21 -17 L-9 -8 L0 -22 L9 -8 L21 -17 L18 0 Z" ${st("#f2bf2e", 2.6)}/><rect x="-19" y="-3" width="38" height="6" rx="2" ${st("#e0a520", 2.2)}/><circle cx="0" cy="-12" r="2.6" fill="#e8233f"/><circle cx="-10" cy="0" r="1.8" fill="#4fa8ff"/><circle cx="10" cy="0" r="1.8" fill="#5fd36a"/>`;
// The colour filter goes on the body only, so a boss's crown stays gold: the crown is a second
// picture with the same frame laid over the top.
function artFor(key, fx) {
  const e = ENEMIES[key], svg = ENEMY_ART[e.art || key];
  const body = (s) => `<div class="dbody" style="filter:${fx || "none"}">${s}</div>`;
  if (!e.crown) return body(svg);
  // make room above the head, then put the crown on
  let box = "";
  const tall = svg.replace(/viewBox="0 0 (\d+) (\d+)"/, (m, w, h) => { box = `0 -24 ${w} ${+h + 24}`; return `viewBox="${box}"`; });
  return body(tall) + `<svg class="dcrown" viewBox="${box}" aria-hidden="true"><g transform="translate(${e.crown[0]} ${e.crown[1]})">${CROWN}</g></svg>`;
}
const enemyName = (en) => en.name || ENEMIES[en.key].name;
// Dungeon i opens once the one before it has been cleared (or if you've already played it).
function isOpen(d, i) {
  if (i === 0) return true;
  const prev = DUNGEONS[i - 1].id, cb = d.clearsBy || {};
  return (cb[prev] || 0) > 0 || (i === 1 && !d.clearsBy && d.clears > 0) || ((d.bestBy || {})[DUNGEONS[i].id] || 0) > 0;
}
// Per-dungeon difficulty, tuned with a simulation: each dungeon is a fair fight with gear of its
// rarity (common, uncommon, rare, epic, legendary) and very hard with gear one rarity lower.
const TIER_HP = [1, 1.5, 2.25, 3, 5.2];       // monster HP multiplier
const TIER_ATK = [0, 3, 6, 8, 16];            // added to monster attacks
const armourOf = (t) => [3, 5, 8, 12, 17][t];
const breathOf = (t) => [15, 24, 36, 46, 75][t];
const goldFor = (floor, t) => 10 * floor * (1 + t) + (floor === FLOORS ? 25 * (1 + t) : 0);
function twistText(key, t) {
  if (ENEMIES[key].twist === "armour") return "Armoured: attacks deal " + armourOf(t) + " less. Spells ignore armour.";
  return ENEMIES[key].desc;
}
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

const SWORD_ICON = itemSVG("hand0");
const SHIELD_ICON = itemSVG("off0");

/* ---------------- module ---------------- */
// ctx: { getS, save, render, toast, logEvent, addXp, addGold, addChest, drawHero(el), dayStreak,
//        tickets(), spendTicket(), nextTicketIn(), ticketMax, gearBonus(), level(), earnCharm(k), hasCharm(k) }
export function setupDungeon(ctx) {
  const $ = (s) => document.querySelector(s);
  const D = () => {
    const S = ctx.getS();
    S.dungeon = S.dungeon || { spent: 0, runs: 0, clears: 0, best: 0, xp: 0 };
    return S.dungeon;
  };
  // the hero's combat numbers, from attributes and worn gear
  const hero = () => {
    const S = ctx.getS(), a = S.attr, g = ctx.gearBonus(), L = ctx.level();
    const spell = SPELLS[S.spell] ? S.spell : "fireball";
    return {
      // level gives a little (2 HP a level, +1 attack every 4 levels); gear does most of the work
      maxHp: 40 + 2 * (L - 1) + g.hp,
      atk: 5 + Math.floor((L - 1) / 4) + g.dmg,
      shieldTake: g.charm === "golem" ? 0.1 : 0.25,
      spellMul: g.charm === "dragon" ? 1.5 : 1,
      charm: g.charm || null,
      sp: a.INT - 1,
      crit: 5 + g.crit,
      def: g.def,
      block: g.block,
      dodge: g.dodge || 0,
      spell,
    };
  };

  function makeEnemy(floor, t) {
    const f = DUNGEONS[t].floors[floor - 1], key = f.key;
    // tuned by simulation so each dungeon is a fair fight around its unlock level with matching gear
    const e = ENEMIES[key], scale = (1 + 0.15 * (floor - 1)) * TIER_HP[t];
    const boss = floor === FLOORS;
    const bump = (boss ? 0 : Math.floor((floor - 1) / 2)) + TIER_ATK[t];
    const hp = Math.round(e.hp * scale);
    return { key, name: f.name, fx: f.fx || "", boss, hp, maxHp: hp, atk: [e.atk[0] + bump, e.atk[1] + bump], poison: 0, charge: 0 };
  }
  function specialDmg(r) {
    const en = r.enemy, e = ENEMIES[en.key];
    if (en.key === "dragon") return breathOf(r.tier || 0);
    return Math.round(((en.atk[0] + en.atk[1]) / 2) * e.mult);
  }
  function startFloor(run) {
    run.enemy = makeEnemy(run.floor, run.tier || 0);
    run.turn = 1; run.state = "fight";
    run.msg = "Floor " + run.floor + ": " + (run.floor === FLOORS ? "the boss, " : "a ") + enemyName(run.enemy) + (run.floor === FLOORS ? ", blocks the way!" : " appears!");
  }

  /* -------- starting and leaving -------- */
  function enter(t) {
    const S = ctx.getS();
    if (S.run) { openBattle(); return; }
    const dg = DUNGEONS[t];
    if (!isOpen(D(), t)) { ctx.toast("Clear the " + DUNGEONS[t - 1].name + " to open the " + dg.name); return; }
    if (!ctx.spendTicket()) { ctx.toast("No tickets left. Next one in " + fmtWait(ctx.nextTicketIn())); return; }
    const h = hero(), d = D();
    d.runs++;
    S.run = { tier: t, floor: 1, hp: h.maxHp, maxHp: h.maxHp, atk: h.atk, sp: h.sp, crit: h.crit, def: h.def, blockBonus: h.block, dodge: h.dodge, shieldTake: h.shieldTake, spellMul: h.spellMul,
      spell: h.spell, charge: 0, xp: 0, gold: 0 };
    startFloor(S.run);
    ctx.logEvent("Entered the " + dg.name);
    ctx.save(); ctx.render(); openBattle();
  }
  function endRun(outcome) {
    const S = ctx.getS(), run = S.run, d = D();
    if (!run) return;
    const reached = outcome === "clear" ? FLOORS : run.floor - 1;
    const t = run.tier || 0, name = DUNGEONS[t].name;
    d.best = Math.max(d.best, reached);
    d.bestBy = d.bestBy || {}; d.bestBy[DUNGEONS[t].id] = Math.max(d.bestBy[DUNGEONS[t].id] || 0, reached);
    if (outcome === "clear") { d.clears++; d.clearsBy = d.clearsBy || {}; d.clearsBy[DUNGEONS[t].id] = (d.clearsBy[DUNGEONS[t].id] || 0) + 1; }
    ctx.logEvent(outcome === "clear" ? "Cleared the " + name + "! (+" + run.gold + " gold, +1 chest)" : outcome === "fled" ? "Fled the " + name + " on floor " + run.floor : "Defeated in the " + name + " on floor " + run.floor + " (+" + run.gold + " gold)");
    S.run = null;
    ctx.save(); ctx.render(); closeBattle();
  }

  /* -------- combat -------- */
  const run = () => ctx.getS().run;
  const spellOf = (r) => SPELLS[r.spell] || SPELLS.fireball;
  // the hero's turn
  async function act(kind) {
    const r = run();
    if (!r || r.state !== "fight" || busy) return;
    const en = r.enemy, E = ENEMIES[en.key], t = r.tier || 0, name = enemyName(en);
    const sp = spellOf(r);
    if (kind === "spell" && r.charge < sp.charge) { ctx.toast(sp.name + " needs " + (sp.charge - r.charge) + " more " + (sp.charge - r.charge === 1 ? "attack" : "attacks") + " to charge"); return; }
    busy = true;
    let msg = "", shielding = false;
    if (kind === "attack") {
      const dodged = E.twist === "dodge" && Math.random() < 0.25;
      const crit = !dodged && Math.random() * 100 < r.crit;
      await play(crit ? "crit" : "attack", dodged);
      r.charge = Math.min(sp.charge, r.charge + 1);
      if (dodged) { pop("enemy", "Dodged!", "block"); msg = "The " + name + " dodges your attack."; }
      else {
        let dmg = r.atk + rnd(-1, 1);
        if (crit) dmg *= 2;
        if (E.twist === "armour") dmg = Math.max(1, dmg - armourOf(t));
        en.hp = Math.max(0, en.hp - dmg);
        pop("enemy", (crit ? "CRIT -" : "-") + dmg, crit ? "crit" : "hit");
        msg = crit ? "Critical hit for " + dmg + "!" : "You hit for " + dmg + ".";
      }
    } else if (kind === "spell") {
      r.charge = 0;
      if (r.spell === "poison") {
        await play("poison");
        if (E.twist === "nopoison") { pop("enemy", "Immune", "block"); msg = "Poison does nothing to the " + name + "."; }
        else { const n = Math.round(poisonStacks(r.sp) * (r.spellMul || 1)); en.poison += n; pop("enemy", "+" + n + " poison", "poison"); msg = "Poison Cloud! The " + name + " has " + en.poison + " poison."; }
      } else {
        const crit = Math.random() * 100 < r.crit;
        await play("fireball");
        const dmg = Math.round(fireDmg(r.sp) * (r.spellMul || 1)) * (crit ? 2 : 1);
        en.hp = Math.max(0, en.hp - dmg);
        pop("enemy", (crit ? "CRIT -" : "-") + dmg, crit ? "crit" : "hit");
        msg = (crit ? "Critical Fireball for " : "Fireball blasts for ") + dmg + "!";
      }
    } else {
      shielding = true; shieldUp = true;
      await play("shield");
      msg = "You raise your shield.";
    }
    r.msg = msg; paint();
    if (en.hp <= 0) { busy = false; return winFloor(); }
    // poison ticks on the monster
    if (en.poison > 0) {
      await wait(380); await play("tick");
      const p = en.poison; en.hp = Math.max(0, en.hp - p); en.poison--;
      pop("enemy", "-" + p, "poison"); r.msg = msg + " Poison deals " + p + "."; paint();
      if (en.hp <= 0) { await wait(300); busy = false; return winFloor(); }
    }
    await wait(450);
    // the monster's turn: release the special once it is fully charged, otherwise attack and build up
    const special = en.charge >= E.charge;
    let dmg = special ? specialDmg(r) : rnd(en.atk[0], en.atk[1]);
    // Celestial set: a chance to slip out of the way of any hit, specials included
    const evade = (r.dodge || 0) > 0 && Math.random() * 100 < r.dodge;
    await play(special ? (en.key === "dragon" ? "breath" : "special") : "enemy", shielding && !evade);
    let line;
    if (evade) {
      dmg = 0; line = "You vanish in a flash of light and dodge it!";
      const h = document.getElementById("dHero"); if (h && !reduce()) restart(h, "blink");
    } else if (shielding) {
      dmg = Math.max(0, Math.round(dmg * (r.shieldTake || 0.25)) - (r.blockBonus || 0));
      line = dmg ? "You block most of it and take " + dmg + "." : "Your shield blocks it all!";
    } else {
      dmg = Math.max(1, dmg - (r.def || 0));
      line = "You take " + dmg + ".";
    }
    r.hp = Math.max(0, r.hp - dmg); shieldUp = false;
    pop("you", evade ? "Dodged!" : dmg ? "-" + dmg : "Blocked!", evade ? "evade" : dmg ? (special && !shielding ? "crit" : "bad") : "block");
    en.charge = special ? 0 : en.charge + 1;
    r.msg = (special ? "The " + name + " unleashes " + E.special + "! " : "The " + name + " attacks. ") + line;
    if (r.hp <= 0) { r.state = "lost"; busy = false; save(); paint(); return; }
    r.turn++;
    busy = false; save(); paint();
  }
  function winFloor() {
    const r = run();
    const t = r.tier || 0, gold = goldFor(r.floor, t);
    r.gold = (r.gold || 0) + gold;
    ctx.addGold(gold);
    if (r.floor === FLOORS) { ctx.addChest(); ctx.earnCharm(CHARM_OF[t]); }
    r.goldGain = gold;
    r.state = r.floor === FLOORS ? "cleared" : "won";
    ctx.logEvent("Defeated the " + enemyName(r.enemy) + " on floor " + r.floor + " (+" + gold + " gold)");
    save(); paint(); ctx.render();
  }
  function nextFloor() {
    const r = run(); if (!r || r.state !== "won") return;
    r.floor++;
    const healed = Math.min(Math.round(r.maxHp * 0.4), r.maxHp - r.hp); r.hp += healed;
    startFloor(r);
    if (healed) r.msg += " You rest and heal " + healed + ".";
    save(); paint();
  }

  /* -------- animation -------- */
  // Number pop-ups and hit flashes are queued while the state changes, then played on the newly
  // drawn screen. Attack moves (lunges, projectiles, fire breath) play on the current screen first.
  let shieldUp = false, busy = false, fx = [], resultShown = false;
  const reduce = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((res) => setTimeout(res, reduce() ? 0 : ms));
  function pop(who, text, kind) { fx.push({ who, text, kind }); }
  function restart(el, cls) { if (!el) return; const c = cls.split(" "); el.classList.remove(...c); void el.offsetWidth; el.classList.add(...c); }
  function overlay(host, cls, ms, html = "") {
    if (!host) return null;
    const el = document.createElement("div"); el.className = cls; el.innerHTML = html;
    host.appendChild(el); setTimeout(() => el.remove(), ms);
    return el;
  }
  function flushFx() {
    const list = fx; fx = [];
    list.forEach((f) => {
      const unit = document.getElementById(f.who === "you" ? "dHero" : "dEnemy");
      if (!unit) return;
      const el = overlay(unit, "dpop " + f.kind, 1000);
      el.textContent = f.text;
      if (f.kind === "hit" || f.kind === "bad" || f.kind === "crit") { restart(unit, "shake"); restart(unit.querySelector(".dhero,.denemy"), "hitflash"); }
    });
  }
  const FIRE_SVG = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="13" fill="#ff7a2b" stroke="#1c1430" stroke-width="2.4"/><circle cx="20" cy="20" r="7" fill="#ffe14a"/></svg>';
  const POISON_SVG = '<svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="12" fill="#7cf05a" stroke="#1c1430" stroke-width="2.4"/><circle cx="16" cy="17" r="3" fill="#d6ffc4"/><circle cx="24" cy="24" r="2.4" fill="#2a6b2a"/></svg>';
  async function play(kind, flag) { try { await playFx(kind, flag); } catch (e) { console.warn(e); } }
  async function playFx(kind, flag) {
    if (reduce()) return;
    const arena = document.querySelector(".darena"), hero = $("#dHero"), enemy = $("#dEnemy");
    if (!arena || !hero || !enemy) return;
    switch (kind) {
      case "attack":
        restart(hero, "lunge-r"); await wait(210);
        if (flag) restart(enemy, "dodge"); else overlay(enemy, "slash", 360);
        await wait(220); break;
      case "crit":
        restart(hero, "lunge-r big"); await wait(230);
        overlay(enemy, "slash crit", 420); overlay(enemy, "slash crit s2", 420); restart(arena, "quake");
        await wait(260); break;
      case "fireball":
        restart(hero, "cast"); await wait(160);
        overlay(arena, "proj fire", 500, FIRE_SVG); await wait(410);
        overlay(enemy, "burst", 450); await wait(170); break;
      case "poison":
        restart(hero, "cast green"); await wait(160);
        overlay(arena, "proj fire green", 500, POISON_SVG); await wait(410);
        overlay(enemy, "poison-cloud", 900); await wait(200); break;
      case "tick": overlay(enemy, "bubbles", 700, "<i></i><i></i><i></i>"); await wait(300); break;
      case "shield": ctx.drawHero(hero.querySelector(".dhero"), { back: true, guard: true }); restart(hero, "brace"); await wait(300); break;
      case "enemy":
        restart(enemy, "lunge-l"); await wait(230);
        overlay(hero, "slash claw", 360); if (flag) overlay(hero, "shield-hit", 400); await wait(200); break;
      case "special":
        restart(enemy, "windup"); await wait(380);
        restart(enemy, "lunge-l big"); await wait(220);
        overlay(arena, "shockwave", 600); overlay(hero, "slash claw big", 420); restart(arena, "quake");
        if (flag) overlay(hero, "shield-hit", 500); await wait(320); break;
      case "breath":
        restart(enemy, "rear"); await wait(220);
        overlay(arena, "breathfx", 750); restart(arena, "quake"); if (flag) overlay(hero, "shield-hit", 600); await wait(600); break;
    }
  }
  const save = () => ctx.save();

  /* -------- battle screen -------- */
  function openBattle() { $("#dungeon").hidden = false; document.body.classList.add("in-dungeon"); paint(); }
  function closeBattle() { $("#dungeon").hidden = true; document.body.classList.remove("in-dungeon"); }
  function bar(cur, max, cls) { return `<div class="dbar ${cls}"><i style="width:${Math.max(0, (cur / max) * 100)}%"></i><span class="num">${cur} / ${max}</span></div>`; }
  function paint() {
    const r = run(), box = $("#dungeon");
    if (!r) { closeBattle(); return; }
    const en = r.enemy, t = r.tier || 0, dg = DUNGEONS[t], E = ENEMIES[en.key];
    const sp = spellOf(r), ready = r.charge >= sp.charge;
    // how charged the monster's special is, shown only as a glow: 0 none, 1 faint, 2 strong, 3 about to fire
    const lvl = en.charge >= E.charge ? 3 : Math.min(2, Math.floor((en.charge / E.charge) * 3));
    const pips = Array.from({ length: sp.charge }, (_, k) => `<i class="${k < r.charge ? "on" : ""}"></i>`).join("");
    box.innerHTML = `
      <div class="darena dfield" style="--sky1:${dg.bg.split(",")[0]};--sky2:${dg.bg.split(",")[1]}">
        <div class="dtop">
          <button class="iconbtn" id="dFlee">Flee</button>
          <div class="dfloor"><small>${dg.name}</small><span>Floor</span> ${r.floor} / ${FLOORS}</div>
          <div class="drr num">Turn ${r.turn}</div>
        </div>
        <div class="dinfo foe">
          <div class="dinfo-name"><b>${enemyName(en)}</b>${en.poison ? `<span class="dpois num">☠ ${en.poison}</span>` : ""}</div>
          ${bar(en.hp, en.maxHp, "ehp")}
        </div>
        <div class="dpad foe"></div>
        <div class="dunit foe charge-${lvl}${en.boss ? " boss" : ""}" id="dEnemy"><div class="aura"></div><div class="denemy">${artFor(en.key, en.fx)}</div>${lvl === 3 ? '<div class="sparks"><i></i><i></i><i></i><i></i></div>' : ""}</div>
        <div class="dpad you"></div>
        <div class="dunit you" id="dHero">${r.dodge ? '<div class="holo l"></div><div class="holo r"></div>' : ""}<div class="dhero"></div></div>
        <div class="dinfo you">
          <div class="dinfo-name"><b>You</b><small class="num">Lv ${ctx.level()}</small></div>
          ${bar(r.hp, r.maxHp, "hp")}
        </div>
      </div>
      <div class="dpanel">
        <div class="dbox"><p class="dmsg" aria-live="polite"></p><p class="dtwist">${twistText(en.key, t)}</p></div>
        <div class="dacts">
          <button class="dact shd" id="dShield" type="button"><span class="dact-ic">${SHIELD_ICON}</span><b>Shield</b><small>Block ${(r.shieldTake || 0.25) < 0.25 ? "90%" : "¾"}${r.blockBonus ? " +" + r.blockBonus : ""}</small></button>
          <button class="dact spl${ready ? " ready" : ""}" id="dSpell" type="button"${ready ? "" : ' aria-disabled="true"'}><span class="dact-ic">${sp.icon}</span><b></b><span class="pips">${pips}</span></button>
          <button class="dact atk" id="dAttack" type="button"><span class="dact-ic">${SWORD_ICON}</span><b>Attack</b><small class="num">${r.atk - 1}–${r.atk + 1} dmg · ${r.crit}% crit</small></button>
        </div>
      </div>
      ${r.state !== "fight" ? resultCard(r).replace('class="dresult"', 'class="dresult' + (resultShown ? "" : " late") + '"') : ""}`;
    box.querySelector(".dmsg").textContent = r.msg || "Attack to charge your spell. Shield when the monster is about to strike hard.";
    box.querySelector("#dSpell b").textContent = sp.name;
    box.querySelector("#dSpell").setAttribute("aria-label", sp.name + (ready ? ", ready" : ", charging " + r.charge + " of " + sp.charge));
    ctx.drawHero(box.querySelector(".dhero"), { back: true, guard: shieldUp && busy });
    box.querySelectorAll("#dHero .holo").forEach((el) => ctx.drawHero(el, { back: true }));
    box.querySelector("#dAttack").onclick = () => act("attack");
    box.querySelector("#dSpell").onclick = () => act("spell");
    box.querySelector("#dShield").onclick = () => act("shield");
    const flee = box.querySelector("#dFlee");
    let armed = false;
    flee.onclick = () => { if (busy) return; if (!armed) { armed = true; flee.textContent = "Sure?"; flee.classList.add("danger"); setTimeout(() => { armed = false; flee.textContent = "Flee"; flee.classList.remove("danger"); }, 3000); return; } endRun("fled"); };
    // knockouts play once when a fight ends
    if (r.state !== "fight") {
      const loser = box.querySelector(r.state === "lost" ? "#dHero" : "#dEnemy");
      if (loser) loser.classList.add(resultShown ? "down" : "ko");
      resultShown = true;
    } else resultShown = false;
    flushFx();
    const go = box.querySelector("#dResult");
    if (go) go.onclick = () => (r.state === "won" ? nextFloor() : endRun(r.state === "cleared" ? "clear" : "lost"));
  }
  function resultCard(r) {
    if (r.state === "won") return `<div class="dresult"><div class="win"><div class="title-tag">FLOOR CLEARED</div><h1>Victory!</h1><p class="gain"><span class="g-gold">+${r.goldGain} gold</span></p><button class="btn gold big" id="dResult">Next floor</button></div></div>`;
    if (r.state === "cleared") return `<div class="dresult"><div class="win"><div class="title-tag">DUNGEON CLEARED</div><h1>Champion!</h1><p>You beat all ${FLOORS} floors of the ${DUNGEONS[r.tier || 0].name}.</p><p class="gain"><span class="g-gold">+${r.gold} gold</span></p><p class="g-chest">+1 free chest. Open it in the Shop.</p><button class="btn gold big" id="dResult">Claim and leave</button></div></div>`;
    return `<div class="dresult"><div class="win"><div class="title-tag">DEFEATED</div><h1>Knocked out</h1><p>You fell on floor ${r.floor}. You keep the ${r.gold || 0} gold you earned.</p><button class="btn big" id="dResult">Leave dungeon</button></div></div>`;
  }

  /* -------- dungeon tab -------- */
  function renderTab() {
    const S = ctx.getS(); if (!S) return;
    const h = hero(), d = D(), t = ctx.tickets(), wait = ctx.nextTicketIn(), sp = SPELLS[h.spell];
    $("#dTickets").textContent = ctx.unlimited ? "∞" : t;
    $("#dToday").textContent = ctx.unlimited ? "Unlimited tickets for now" : t >= ctx.ticketMax ? "Tickets full (" + t + " / " + ctx.ticketMax + ")" : "Next ticket in " + fmtWait(wait) + " · " + t + " / " + ctx.ticketMax;
    $("#dStats").innerHTML = `
      <div><b class="num">${h.maxHp}</b><span>Max HP</span><small>Level, helmet, pants${h.charm === "slime" ? ", charm" : ""}</small></div>
      <div><b class="num">${h.atk}</b><span>Attack</span><small>Level, sword</small></div>
      <div><b class="num">${h.crit}%</b><span>Crit chance</span><small>Cape</small></div>
      ${h.dodge ? `<div><b class="num">${h.dodge}%</b><span>Dodge</span><small>${h.charm === "imp" ? "Charm" : ""}${h.charm === "imp" && h.dodge > 10 ? ", " : ""}${h.dodge > (h.charm === "imp" ? 10 : 0) ? "Celestial set" : ""}</small></div>` : ""}
      <div><b class="num">${h.def}</b><span>Defence</span><small>Armour${h.charm === "bone" ? ", charm" : ""}</small></div>
      <div><b class="num">+${h.block}</b><span>Shield block</span><small>Shield</small></div>
      ${h.charm ? `<div><b class="num">✦</b><span>${CHARMS[h.charm].name}</span><small>${CHARMS[h.charm].desc}</small></div>` : ""}
      <div><b class="num">${Math.round((h.spell === "poison" ? poisonStacks(h.sp) : fireDmg(h.sp)) * h.spellMul)}</b><span>${sp.name}</span><small>Intelligence · ${h.spell === "poison" ? "poison" : "damage"}</small></div>`;
    $("#dRecord").textContent = "Runs " + d.runs + " · Clears " + d.clears + " · Best floor " + d.best + " / " + FLOORS;
    const cont = $("#dContinue");
    cont.hidden = !S.run;
    if (S.run) cont.querySelector("span").textContent = DUNGEONS[S.run.tier || 0].name + ", floor " + S.run.floor;
    const lv = ctx.level(), list = $("#dList"); list.innerHTML = "";
    DUNGEONS.forEach((dg, i) => {
      const locked = !isOpen(d, i), best = (d.bestBy || {})[dg.id] || (i === 0 ? d.best : 0), clears = (d.clearsBy || {})[dg.id] || (i === 0 && !d.clearsBy ? d.clears : 0);
      const li = document.createElement("li"); li.className = "dcard" + (locked ? " locked" : "");
      li.style.background = "linear-gradient(135deg," + dg.bg + ")";
      const boss = BOSS_OF(i);
      li.innerHTML = `<div class="dcard-art">${artFor(boss.key, boss.fx)}</div>
        <div class="dcard-info"><b></b><small class="num"></small><small class="num dgold"></small></div>
        <button class="btn${locked ? " ghost" : ""}" type="button"></button>`;
      li.querySelector("b").textContent = dg.name;
      li.querySelectorAll("small")[0].textContent = locked ? "Clear the " + DUNGEONS[i - 1].name + " to open" : ("Boss: " + boss.name + " · best floor " + best + "/" + FLOORS + (clears ? " · cleared " + clears + "×" : ""));
      const charmKey = CHARM_OF[i], hasCharm = ctx.hasCharm(charmKey);
      li.querySelectorAll("small")[1].textContent = (hasCharm ? "" : CHARMS[charmKey].name + " · ") + "Up to " + Array.from({ length: FLOORS }, (_, f) => goldFor(f + 1, i)).reduce((a, b) => a + b, 0) + " gold + chest";
      const b = li.querySelector("button");
      b.textContent = locked ? "Locked" : "Enter";
      b.disabled = locked || !!S.run || t < 1;
      b.setAttribute("aria-label", locked ? dg.name + " opens when you clear the " + DUNGEONS[i - 1].name : "Enter " + dg.name + " for 1 ticket");
      b.onclick = () => enter(i);
      list.appendChild(li);
    });
  }

  $("#dContinue").querySelector("button").onclick = () => enter(0);
  return { renderTab, resume: () => { if (run() && !$("#dungeon").hidden && !busy) paint(); } };
}

// for balance testing
export const _test = { ENEMIES, SPELLS, fireDmg, poisonStacks, breathOf, armourOf };
