// Questlog dice dungeon.
// Each run costs one ticket and has 5 floors: a random monster on floors 1–4 and a dragon on floor 5.
// There are five dungeons, unlocked by player level; each is tougher and pays more gold.
// Every turn you roll dice and choose which ability each die powers. Abilities have conditions and
// monsters have twists, so the choice of where each die goes is the game.
// Attributes power the hero: Strength adds Sword and Twin Strike damage, Intelligence gives rerolls,
// Health raises max HP and Potion healing. A 7-day streak adds an extra die.

import { itemSVG } from "./art.js";

const INK = "#1c1430";
const FLOORS = 5;
const st = (f, w = 2.6) => `fill="${f}" stroke="${INK}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;

/* ---------------- monsters ---------------- */
const ENEMIES = {
  slime: { name: "Slime", hp: 14, atk: [3, 5], twist: null, desc: "A wobbly blob. No tricks." },
  skeleton: { name: "Skeleton", hp: 16, atk: [3, 6], twist: "odd", desc: "Bone armour: Sword and Twin Strike do nothing with odd dice." },
  imp: { name: "Mirror Imp", hp: 15, atk: [3, 6], twist: "mirror", desc: "Any attack made with a 6 is reflected back at you." },
  golem: { name: "Stone Golem", hp: 22, atk: [4, 7], twist: "armour", desc: "Armour 3: Sword and Twin Strike deal 3 less. Poison and Fireball ignore it." },
  dragon: { name: "Ember Dragon", hp: 46, atk: [4, 8], twist: "breath", desc: "Every third turn it breathes fire for 14. Shield blocks double against fire." },
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
// t = tier. Monsters get more HP and hit harder each tier; gold scales with tier.
export const DUNGEONS = [
  { id: "cave", name: "Mossy Cave", lv: 1, prefix: "", boss: "Ember Dragon", hue: 0, bg: "#3a2a6b,#5a3f9a" },
  { id: "crypt", name: "Forgotten Crypt", lv: 5, prefix: "Crypt", boss: "Bone Dragon", hue: 150, bg: "#1f2a4a,#3a4f7a" },
  { id: "forge", name: "Molten Forge", lv: 10, prefix: "Magma", boss: "Magma Dragon", hue: -25, bg: "#4a1a10,#8a3a1a" },
  { id: "keep", name: "Frozen Keep", lv: 15, prefix: "Frost", boss: "Frost Dragon", hue: 190, bg: "#1a3a5a,#4a8ab0" },
  { id: "citadel", name: "Shadow Citadel", lv: 20, prefix: "Shadow", boss: "Shadow Dragon", hue: 250, bg: "#14081f,#3a1a4a" },
];
const enemyName = (key, t) => key === "dragon" ? DUNGEONS[t].boss : (DUNGEONS[t].prefix ? DUNGEONS[t].prefix + " " : "") + ENEMIES[key].name;
const armourOf = (t) => 3 + t;
const breathOf = (t) => 14 + 5 * t;
const goldFor = (floor, t) => 10 * floor * (1 + t) + (floor === FLOORS ? 25 * (1 + t) : 0);
const xpFor = (floor, t) => Math.round(floor * 3 * (1 + 0.5 * t)) + (floor === FLOORS ? 15 : 0);
function twistText(key, t) {
  if (key === "golem") return "Armour " + armourOf(t) + ": Sword and Twin Strike deal " + armourOf(t) + " less. Poison and Fireball ignore it.";
  if (key === "dragon") return "Every third turn it breathes fire for " + breathOf(t) + ". Shield blocks double against fire.";
  return ENEMIES[key].desc;
}

/* ---------------- abilities ---------------- */
const ICONS = {
  sword: itemSVG("sword"),
  shield: itemSVG("shield"),
  dagger: `<svg viewBox="0 0 40 40"><path d="M20 4 L24 10 L24 26 L16 26 L16 10 Z" ${st("#d6dce8", 2.2)}/><rect x="11" y="25" width="18" height="4" rx="1.5" ${st("#7a4bd6", 2)}/><rect x="17.5" y="29" width="5" height="8" ${st("#3a1f5e", 2)}/><path d="M24 16 Q30 18 28 24 Q26 28 24 24" ${st("#5fd36a", 2)}/></svg>`,
  fireball: `<svg viewBox="0 0 40 40"><path d="M22 4 C26 12 34 14 34 24 A13 13 0 0 1 8 24 C8 18 12 15 13 10 C16 15 19 14 22 4 Z" ${st("#ff6a2b", 2.2)}/><path d="M21 16 C24 21 28 22 28 27 A7 7 0 0 1 14 27 C14 23 18 21 21 16 Z" fill="#ffd34a"/></svg>`,
  twin: `<svg viewBox="0 0 40 40"><g transform="rotate(-28 20 20)"><path d="M20 3 L23 7 L23 26 L17 26 L17 7 Z" ${st("#e6ecf6", 2)}/><rect x="13" y="25" width="14" height="3.5" rx="1.2" ${st("#f2b631", 2)}/></g><g transform="rotate(28 20 20)"><path d="M20 3 L23 7 L23 26 L17 26 L17 7 Z" ${st("#e6ecf6", 2)}/><rect x="13" y="25" width="14" height="3.5" rx="1.2" ${st("#f2b631", 2)}/></g></svg>`,
  potion: `<svg viewBox="0 0 40 40"><rect x="16" y="3" width="8" height="6" rx="2" ${st("#c9a06a", 2)}/><path d="M16 9 L24 9 L24 13 Q33 17 33 26 Q33 36 20 36 Q7 36 7 26 Q7 17 16 13 Z" ${st("#e8eefc", 2.2)}/><path d="M9 26 Q20 22 31 26 Q30 34 20 34 Q10 34 9 26 Z" fill="#ff5a7a"/></svg>`,
};
const ABILITIES = [
  { id: "sword", name: "Sword", rule: (h) => `Any die. Deal its value${h.str ? " +" + h.str : ""}.` },
  { id: "shield", name: "Shield", rule: (h) => `4 or lower. Block that much${h.block ? " +" + h.block : ""}.` },
  { id: "dagger", name: "Poison Dagger", rule: () => "Any die. +2 poison." },
  { id: "fireball", name: "Fireball", rule: (h) => `Exactly 6. Deal ${12 + h.fire}, ignores armour.` },
  { id: "twin", name: "Twin Strike", rule: (h) => `Two matching dice. Deal double +${2 + h.str}.` },
  { id: "potion", name: "Potion", rule: (h) => `1 or 2. Heal ${h.heal}.` },
];

/* ---------------- helpers ---------------- */
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const roll = () => rnd(1, 6);
const PIPS = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
function dieFace(v) {
  const pos = [[10, 10], [20, 10], [30, 10], [10, 20], [20, 20], [30, 20], [10, 30], [20, 30], [30, 30]];
  return `<svg viewBox="0 0 40 40" aria-hidden="true"><rect x="2" y="2" width="36" height="36" rx="9" fill="#fff" stroke="${INK}" stroke-width="3"/>
    <rect x="5" y="5" width="30" height="7" rx="3.5" fill="#fff" opacity=".0"/>
    ${(PIPS[v] || []).map((i) => `<circle cx="${pos[i][0]}" cy="${pos[i][1]}" r="3.6" fill="${v === 6 ? "#e2384a" : INK}"/>`).join("")}</svg>`;
}

/* ---------------- module ---------------- */
// ctx: { getS, save, render, toast, logEvent, addXp, drawHero(el), dayStreak, tickets() }
export function setupDungeon(ctx) {
  const $ = (s) => document.querySelector(s);
  const D = () => {
    const S = ctx.getS();
    S.dungeon = S.dungeon || { spent: 0, runs: 0, clears: 0, best: 0, xp: 0 };
    return S.dungeon;
  };
  const hero = () => {
    const a = ctx.getS().attr, g = ctx.gearBonus();
    return {
      str: a.STR - 1 + g.dmg,
      maxHp: 24 + 4 * (a.HLT - 1) + g.hp,
      heal: 6 + (a.HLT - 1) + g.heal,
      block: g.block, fire: g.fire,
      rerolls: 1 + Math.floor((a.INT - 1) / 2),
      dice: 3 + (ctx.dayStreak() >= 7 ? 1 : 0),
    };
  };

  function makeEnemy(floor, t) {
    let key = "dragon";
    if (floor < FLOORS) {
      const pool = floor === 1 ? ["slime", "skeleton", "imp"] : ["slime", "skeleton", "imp", "golem"];
      key = pool[rnd(0, pool.length - 1)];
    }
    const e = ENEMIES[key], scale = (1 + 0.18 * (floor - 1)) * (1 + 0.85 * t);
    const bump = (key === "dragon" ? 0 : Math.floor((floor - 1) / 2)) + 2 * t;
    const hp = Math.round(e.hp * scale);
    return { key, hp, maxHp: hp, atk: [e.atk[0] + bump, e.atk[1] + bump], poison: 0 };
  }
  function intentFor(run) {
    const en = run.enemy;
    if (en.key === "dragon" && run.turn % 3 === 0) return { kind: "breath", value: breathOf(run.tier || 0) };
    return { kind: "attack", value: rnd(en.atk[0], en.atk[1]) };
  }
  function newTurn(run) {
    run.dice = Array.from({ length: run.diceCount }, () => ({ v: roll(), used: false }));
    run.used = {}; run.block = 0; run.split = false; run.twin = null; run.sel = null;
    run.intent = intentFor(run);
  }
  function startFloor(run) {
    run.enemy = makeEnemy(run.floor, run.tier || 0);
    run.turn = 1; run.rerolls = run.rerollMax; run.state = "fight";
    newTurn(run);
    run.msg = "Floor " + run.floor + ": " + (run.floor === FLOORS ? "the " : "a ") + enemyName(run.enemy.key, run.tier || 0) + " appears!";
  }

  /* -------- starting and leaving -------- */
  function enter(t) {
    const S = ctx.getS();
    if (S.run) { openBattle(); return; }
    const dg = DUNGEONS[t];
    if (ctx.level() < dg.lv) { ctx.toast(dg.name + " opens at level " + dg.lv); return; }
    if (ctx.tickets() < 1) { ctx.toast("You need a ticket. Complete a quest to earn one"); return; }
    const h = hero(), d = D();
    d.spent++; d.runs++;
    S.run = { tier: t, floor: 1, hp: h.maxHp, maxHp: h.maxHp, str: h.str, heal: h.heal, blockBonus: h.block, fire: h.fire, rerollMax: h.rerolls, diceCount: h.dice, xp: 0, gold: 0 };
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
  function hitEnemy(amount, kind, die) {
    const r = run(), en = r.enemy, tw = ENEMIES[en.key].twist;
    const physical = kind === "sword" || kind === "twin";
    if (tw === "mirror" && die === 6 && kind !== "dagger") {
      r.hp -= amount; pop("you", "-" + amount, "bad");
      return "The Mirror Imp reflects your 6! You take " + amount + ".";
    }
    if (tw === "odd" && physical && die % 2 === 1) return "Odd dice bounce off the Skeleton's bones. No damage.";
    if (tw === "armour" && physical) amount = Math.max(0, amount - armourOf(r.tier || 0));
    en.hp = Math.max(0, en.hp - amount);
    pop("enemy", "-" + amount, "hit");
    return null;
  }
  function useDie(abId) {
    const r = run();
    if (!r || r.state !== "fight") return;
    const i = r.sel;
    if (i == null) { ctx.toast("Tap a die first, then an ability"); return; }
    const d = r.dice[i], v = d.v;
    if (r.used[abId]) { ctx.toast("Each ability can be used once per turn"); return; }
    let msg = "";
    switch (abId) {
      case "sword": {
        const dmg = v + r.str;
        msg = hitEnemy(dmg, "sword", v) || "Sword hits for " + (ENEMIES[r.enemy.key].twist === "armour" ? Math.max(0, dmg - armourOf(r.tier || 0)) : dmg) + ".";
        break;
      }
      case "shield":
        if (v > 4) { ctx.toast("Shield only takes a 4 or lower"); return; }
        { const b = v + (r.blockBonus || 0); r.block += b; msg = "You raise your shield to block " + b + "."; pop("you", "+" + b + " block", "block"); }
        break;
      case "dagger":
        r.enemy.poison += 2; msg = "Poison dagger! The " + enemyName(r.enemy.key, r.tier || 0) + " has " + r.enemy.poison + " poison."; pop("enemy", "+2 poison", "poison");
        break;
      case "fireball":
        if (v !== 6) { ctx.toast("Fireball needs exactly a 6"); return; }
        { const fb = 12 + (r.fire || 0); msg = hitEnemy(fb, "fireball", v) || "Fireball blasts for " + fb + "!"; }
        break;
      case "potion":
        if (v > 2) { ctx.toast("Potion only takes a 1 or 2"); return; }
        { const before = r.hp; r.hp = Math.min(r.maxHp, r.hp + r.heal); pop("you", "+" + (r.hp - before), "heal"); msg = "You drink a potion and heal " + (r.hp - before) + "."; }
        break;
      case "twin":
        if (r.twin == null) { r.twin = i; d.used = true; r.sel = null; r.msg = "Twin Strike is ready. Add a matching " + v + "."; save(); paint(); return; }
        if (r.dice[r.twin].v !== v) { ctx.toast("Twin Strike needs two matching dice"); return; }
        { const dmg = v * 2 + 2 + r.str; msg = hitEnemy(dmg, "twin", v) || "Twin Strike hits for " + (ENEMIES[r.enemy.key].twist === "armour" ? Math.max(0, dmg - armourOf(r.tier || 0)) : dmg) + "!"; }
        r.twin = null;
        break;
    }
    d.used = true; r.used[abId] = true; r.sel = null; r.msg = msg;
    afterAction();
  }
  function cancelTwin() {
    const r = run(); if (!r || r.twin == null) return;
    r.dice[r.twin].used = false; r.twin = null; r.msg = "Twin Strike cancelled."; save(); paint();
  }
  function splitDie() {
    const r = run(); if (!r || r.state !== "fight") return;
    if (r.split) { ctx.toast("You can split once per turn"); return; }
    if (r.sel == null) { ctx.toast("Tap a die to split first"); return; }
    const v = r.dice[r.sel].v;
    if (v < 2) { ctx.toast("A 1 can't be split"); return; }
    r.dice.splice(r.sel, 1, { v: Math.ceil(v / 2), used: false }, { v: Math.floor(v / 2), used: false });
    r.split = true; r.sel = null; r.msg = "Split a " + v + " into " + Math.ceil(v / 2) + " and " + Math.floor(v / 2) + ".";
    save(); paint();
  }
  function reroll() {
    const r = run(); if (!r || r.state !== "fight") return;
    if (r.rerolls < 1) { ctx.toast("No rerolls left this fight. Intelligence gives more"); return; }
    if (!r.dice.some((d) => !d.used)) { ctx.toast("No dice left to reroll"); return; }
    r.dice.forEach((d) => { if (!d.used) d.v = roll(); });
    r.rerolls--; r.sel = null; r.msg = "You reroll your unused dice."; shake("#dtray");
    save(); paint();
  }
  function endTurn() {
    const r = run(); if (!r || r.state !== "fight") return;
    if (r.twin != null) cancelTwin();
    const en = r.enemy, name = enemyName(en.key, r.tier || 0);
    const lines = [];
    if (en.poison > 0) {
      const p = en.poison; en.hp = Math.max(0, en.hp - p); en.poison--; pop("enemy", "-" + p, "poison");
      lines.push("Poison deals " + p + ".");
    }
    if (en.hp <= 0) { r.msg = lines.join(" "); return winFloor(); }
    let dmg = r.intent.value, block = r.block;
    if (r.intent.kind === "breath") block *= 2;
    dmg = Math.max(0, dmg - block);
    r.hp = Math.max(0, r.hp - dmg);
    shake("#dHero"); if (dmg) pop("you", "-" + dmg, "bad");
    lines.push((r.intent.kind === "breath" ? "The " + name + " breathes fire" : "The " + name + " attacks") + (dmg ? " for " + dmg + "." : ", but you block it all!"));
    r.msg = lines.join(" ");
    if (r.hp <= 0) { r.state = "lost"; save(); paint(); return; }
    r.turn++; newTurn(r);
    save(); paint();
  }
  function afterAction() {
    const r = run();
    if (r.hp <= 0) { r.state = "lost"; save(); paint(); return; }
    if (r.enemy.hp <= 0) return winFloor();
    save(); paint();
  }
  function winFloor() {
    const r = run();
    const t = r.tier || 0, xp = xpFor(r.floor, t), gold = goldFor(r.floor, t);
    r.xp += xp; r.gold = (r.gold || 0) + gold; D().xp += xp;
    ctx.addGold(gold);
    if (r.floor === FLOORS) ctx.addChest();
    ctx.addXp(xp, "Defeated the " + enemyName(r.enemy.key, t) + " on floor " + r.floor + " (+" + gold + " gold)");
    r.gain = xp; r.goldGain = gold;
    r.state = r.floor === FLOORS ? "cleared" : "won";
    save(); paint();
  }
  function nextFloor() {
    const r = run(); if (!r || r.state !== "won") return;
    r.floor++; const healed = Math.min(5, r.maxHp - r.hp); r.hp += healed;
    startFloor(r);
    if (healed) r.msg += " You rest and heal " + healed + ".";
    save(); paint();
  }

  /* -------- effects -------- */
  function pop(who, text, kind) {
    const host = document.getElementById(who === "you" ? "dHero" : "dEnemy");
    if (!host) return;
    const f = document.createElement("div"); f.className = "dpop " + kind; f.textContent = text;
    host.appendChild(f); setTimeout(() => f.remove(), 900);
    if (who === "enemy" && kind === "hit") shake("#dEnemy");
  }
  function shake(sel) { const el = $(sel); if (!el) return; el.classList.remove("shake"); void el.offsetWidth; el.classList.add("shake"); }
  const save = () => ctx.save();

  /* -------- battle screen -------- */
  function openBattle() { $("#dungeon").hidden = false; document.body.classList.add("in-dungeon"); paint(); }
  function closeBattle() { $("#dungeon").hidden = true; document.body.classList.remove("in-dungeon"); }
  function bar(cur, max, cls) { return `<div class="dbar ${cls}"><i style="width:${Math.max(0, (cur / max) * 100)}%"></i><span class="num">${cur} / ${max}</span></div>`; }
  function paint() {
    const r = run(), box = $("#dungeon");
    if (!r) { closeBattle(); return; }
    const en = r.enemy, t = r.tier || 0, dg = DUNGEONS[t];
    const E = { name: enemyName(en.key, t), desc: twistText(en.key, t) };
    const h = { str: r.str, heal: r.heal, block: r.blockBonus || 0, fire: r.fire || 0 };
    const intent = r.intent.kind === "breath" ? `<b class="breath">Fire breath ${r.intent.value}</b>` : `<b>Attacks for ${r.intent.value}</b>`;
    box.innerHTML = `
      <div class="dtop">
        <button class="iconbtn" id="dFlee">Flee</button>
        <div class="dfloor"><small>${dg.name}</small><span>Floor</span> ${r.floor} / ${FLOORS}</div>
        <div class="drr num">Rerolls ${r.rerolls}</div>
      </div>
      <div class="darena" style="background:linear-gradient(${dg.bg.split(",")[0]} 0,${dg.bg.split(",")[1]} 55%,#2f8f45 55%,#1f5a2c)">
        <div class="dside">
          <div class="dunit" id="dHero"><div class="dhero"></div>${r.block ? `<div class="dblock num">${r.intent.kind === "breath" ? r.block * 2 : r.block}</div>` : ""}</div>
          ${bar(r.hp, r.maxHp, "hp")}
          <div class="dname">You</div>
        </div>
        <div class="dvs">VS</div>
        <div class="dside">
          <div class="dintent">${intent}</div>
          <div class="dunit" id="dEnemy"><div class="denemy" style="filter:hue-rotate(${dg.hue}deg)${t === 4 ? " brightness(.8)" : ""}">${ENEMY_ART[en.key]}</div>${en.poison ? `<div class="dpoison num">${en.poison}</div>` : ""}</div>
          ${bar(en.hp, en.maxHp, "ehp")}
          <div class="dname">${E.name}</div>
        </div>
      </div>
      <p class="dtwist">${E.desc}</p>
      <p class="dmsg" aria-live="polite"></p>
      <div class="dtray" id="dtray" role="group" aria-label="Your dice"></div>
      <div class="dabilities" id="dabs"></div>
      <div class="dactions">
        <button class="btn ghost" id="dSplit"${r.split ? " disabled" : ""}>Split</button>
        <button class="btn ghost" id="dReroll"${r.rerolls < 1 ? " disabled" : ""}>Reroll (${r.rerolls})</button>
        <button class="btn" id="dEnd">End turn</button>
      </div>
      ${r.state !== "fight" ? resultCard(r) : ""}`;
    box.querySelector(".dmsg").textContent = r.msg || "Tap a die, then tap an ability to use it.";
    ctx.drawHero(box.querySelector(".dhero"));
    const tray = box.querySelector("#dtray");
    r.dice.forEach((d, i) => {
      const b = document.createElement("button"); b.type = "button";
      b.className = "die" + (d.used ? " used" : "") + (r.sel === i ? " sel" : "") + (r.twin === i ? " held" : "");
      b.innerHTML = dieFace(d.v); b.setAttribute("aria-label", "Die showing " + d.v + (d.used ? ", used" : ""));
      b.disabled = d.used && r.twin !== i;
      b.onclick = () => { if (r.twin === i) return cancelTwin(); r.sel = r.sel === i ? null : i; paint(); };
      tray.appendChild(b);
    });
    const abs = box.querySelector("#dabs");
    const selV = r.sel != null ? r.dice[r.sel].v : null;
    ABILITIES.forEach((a) => {
      const b = document.createElement("button"); b.type = "button";
      const fits = selV == null ? null :
        a.id === "shield" ? selV <= 4 : a.id === "fireball" ? selV === 6 : a.id === "potion" ? selV <= 2 :
        a.id === "twin" ? (r.twin == null ? r.dice.some((x, j) => j !== r.sel && !x.used && x.v === selV) : r.dice[r.twin].v === selV) : true;
      b.className = "dab" + (r.used[a.id] ? " used" : "") + (fits === true && !r.used[a.id] ? " fits" : "") + (fits === false ? " nofit" : "") + (a.id === "twin" && r.twin != null ? " armed" : "");
      b.innerHTML = `<span class="dab-ic">${ICONS[a.id]}</span><span class="dab-t"><b></b><small></small></span>`;
      b.querySelector("b").textContent = a.name + (a.id === "twin" && r.twin != null ? " (" + r.dice[r.twin].v + " held)" : "");
      b.querySelector("small").textContent = r.used[a.id] ? "Used this turn" : a.rule(h);
      b.disabled = !!r.used[a.id];
      b.onclick = () => useDie(a.id);
      abs.appendChild(b);
    });
    box.querySelector("#dSplit").onclick = splitDie;
    box.querySelector("#dReroll").onclick = reroll;
    box.querySelector("#dEnd").onclick = endTurn;
    const flee = box.querySelector("#dFlee");
    let armed = false;
    flee.onclick = () => { if (!armed) { armed = true; flee.textContent = "Sure?"; flee.classList.add("danger"); setTimeout(() => { armed = false; flee.textContent = "Flee"; flee.classList.remove("danger"); }, 3000); return; } endRun("fled"); };
    const go = box.querySelector("#dResult");
    if (go) go.onclick = () => (r.state === "won" ? nextFloor() : endRun(r.state === "cleared" ? "clear" : "lost"));
  }
  function resultCard(r) {
    if (r.state === "won") return `<div class="dresult"><div class="win"><div class="title-tag">FLOOR CLEARED</div><h1>Victory!</h1><p class="gain"><span class="g-gold">+${r.goldGain} gold</span> <span>+${r.gain} XP</span></p><button class="btn gold big" id="dResult">Next floor</button></div></div>`;
    if (r.state === "cleared") return `<div class="dresult"><div class="win"><div class="title-tag">DUNGEON CLEARED</div><h1>Champion!</h1><p>You beat all ${FLOORS} floors of the ${DUNGEONS[r.tier || 0].name}.</p><p class="gain"><span class="g-gold">+${r.gold} gold</span> <span>+${r.xp} XP</span></p><p class="g-chest">+1 free chest. Open it in the Shop.</p><button class="btn gold big" id="dResult">Claim and leave</button></div></div>`;
    return `<div class="dresult"><div class="win"><div class="title-tag">DEFEATED</div><h1>Knocked out</h1><p>You fell on floor ${r.floor}. You keep the ${r.gold || 0} gold and ${r.xp} XP you earned.</p><button class="btn big" id="dResult">Leave dungeon</button></div></div>`;
  }

  /* -------- dungeon tab -------- */
  function renderTab() {
    const S = ctx.getS(); if (!S) return;
    const h = hero(), d = D(), t = ctx.tickets(), today = ctx.ticketsToday();
    $("#dTickets").textContent = t;
    $("#dToday").textContent = today + " / 3 earned today";
    $("#dStats").innerHTML = `
      <div><b class="num">${h.maxHp}</b><span>Max HP</span><small>Health, helmet, shirt</small></div>
      <div><b class="num">+${h.str}</b><span>Sword bonus</span><small>Strength, sword</small></div>
      <div><b class="num">+${h.block}</b><span>Shield bonus</span><small>Shield</small></div>
      <div><b class="num">${12 + h.fire}</b><span>Fireball</span><small>Cape</small></div>
      <div><b class="num">${h.heal}</b><span>Potion heal</span><small>Health, pants</small></div>
      <div><b class="num">${h.rerolls}</b><span>Rerolls / fight</span><small>Intelligence</small></div>
      <div><b class="num">${h.dice}</b><span>Dice</span><small>${h.dice > 3 ? "7-day streak bonus" : "4 with a 7-day streak"}</small></div>`;
    $("#dRecord").textContent = "Runs " + d.runs + " · Clears " + d.clears + " · " + d.xp + " XP earned";
    const cont = $("#dContinue");
    cont.hidden = !S.run;
    if (S.run) cont.querySelector("span").textContent = DUNGEONS[S.run.tier || 0].name + ", floor " + S.run.floor;
    const lv = ctx.level(), list = $("#dList"); list.innerHTML = "";
    DUNGEONS.forEach((dg, i) => {
      const locked = lv < dg.lv, best = (d.bestBy || {})[dg.id] || (i === 0 ? d.best : 0), clears = (d.clearsBy || {})[dg.id] || (i === 0 && !d.clearsBy ? d.clears : 0);
      const li = document.createElement("li"); li.className = "dcard" + (locked ? " locked" : "");
      li.style.background = "linear-gradient(135deg," + dg.bg + ")";
      const diff = locked ? "" : lv >= dg.lv + 8 ? "Easy" : lv >= dg.lv + 3 ? "Fair" : "Hard";
      li.innerHTML = `<div class="dcard-art" style="filter:hue-rotate(${dg.hue}deg)">${ENEMY_ART.dragon}</div>
        <div class="dcard-info"><b></b><small class="num"></small><small class="num dgold"></small></div>
        <button class="btn${locked ? " ghost" : ""}" type="button"></button>`;
      li.querySelector("b").textContent = dg.name;
      li.querySelectorAll("small")[0].textContent = locked ? "Opens at level " + dg.lv : (diff + " · best floor " + best + "/" + FLOORS + (clears ? " · cleared " + clears + "×" : ""));
      li.querySelectorAll("small")[1].textContent = "Up to " + Array.from({ length: FLOORS }, (_, f) => goldFor(f + 1, i)).reduce((a, b) => a + b, 0) + " gold + chest";
      const b = li.querySelector("button");
      b.textContent = locked ? "Lv " + dg.lv : "Enter";
      b.disabled = locked || !!S.run || t < 1;
      b.setAttribute("aria-label", locked ? dg.name + " opens at level " + dg.lv : "Enter " + dg.name + " for 1 ticket");
      b.onclick = () => enter(i);
      list.appendChild(li);
    });
  }

  $("#dContinue").querySelector("button").onclick = () => enter(0);
  return { renderTab, resume: () => { if (run() && !$("#dungeon").hidden) paint(); } };
}
