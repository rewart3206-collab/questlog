// Questlog dungeon.
// Each run costs one ticket (one refills every 4 hours, up to 6) and has 5 floors: a random monster on floors 1–4 and a dragon on floor 5.
// There are five dungeons, unlocked by player level; each is tougher and pays more gold.
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
const poisonStacks = (sp) => 5 + 2 * sp;

/* ---------------- monsters ---------------- */
// charge: turns of building before the special fires. mult: special damage as a multiple of a normal hit.
const ENEMIES = {
  slime: { name: "Slime", hp: 16, atk: [3, 5], charge: 3, mult: 2.5, special: "Body Slam", twist: null, desc: "A wobbly blob. No tricks." },
  skeleton: { name: "Skeleton", hp: 18, atk: [3, 6], charge: 4, mult: 3, special: "Bone Storm", twist: "nopoison", desc: "Bones don't bleed: immune to poison." },
  imp: { name: "Mirror Imp", hp: 16, atk: [3, 6], charge: 3, mult: 2.5, special: "Hex Blast", twist: "dodge", desc: "Slippery: dodges 1 in 4 attacks. Spells always hit." },
  golem: { name: "Stone Golem", hp: 24, atk: [4, 7], charge: 4, mult: 3, special: "Earthquake", twist: "armour", desc: "Armoured: attacks deal less. Spells ignore armour." },
  dragon: { name: "Ember Dragon", hp: 48, atk: [4, 8], charge: 3, mult: 0, special: "Fire Breath", twist: "breath", desc: "Breathes fire when its flames have built up." },
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
const breathOf = (t) => 15 + Math.round(3.6 * t);
const goldFor = (floor, t) => 10 * floor * (1 + t) + (floor === FLOORS ? 25 * (1 + t) : 0);
function twistText(key, t) {
  if (key === "golem") return "Armoured: attacks deal " + armourOf(t) + " less. Spells ignore armour.";
  return ENEMIES[key].desc;
}
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));

const SWORD_ICON = itemSVG("hand0");
const SHIELD_ICON = itemSVG("off0");

/* ---------------- module ---------------- */
// ctx: { getS, save, render, toast, logEvent, addXp, addGold, addChest, drawHero(el), dayStreak,
//        tickets(), spendTicket(), nextTicketIn(), ticketMax, gearBonus(), level() }
export function setupDungeon(ctx) {
  const $ = (s) => document.querySelector(s);
  const D = () => {
    const S = ctx.getS();
    S.dungeon = S.dungeon || { spent: 0, runs: 0, clears: 0, best: 0, xp: 0 };
    return S.dungeon;
  };
  // the hero's combat numbers, from attributes and worn gear
  const hero = () => {
    const S = ctx.getS(), a = S.attr, g = ctx.gearBonus();
    const spell = SPELLS[S.spell] ? S.spell : "fireball";
    return {
      maxHp: 40 + g.hp,
      atk: 5 + g.dmg,
      sp: a.INT - 1,
      crit: 5 + g.crit,
      def: g.def,
      block: g.block,
      spell,
    };
  };

  function makeEnemy(floor, t) {
    let key = "dragon";
    if (floor < FLOORS) {
      const pool = floor === 1 ? ["slime", "skeleton", "imp"] : ["slime", "skeleton", "imp", "golem"];
      key = pool[rnd(0, pool.length - 1)];
    }
    // tuned by simulation so each dungeon is a fair fight around its unlock level with matching gear
    const e = ENEMIES[key], scale = (1 + 0.15 * (floor - 1)) * (1 + 0.5 * t);
    const bump = (key === "dragon" ? 0 : Math.floor((floor - 1) / 2)) + Math.round(1.2 * t);
    const hp = Math.round(e.hp * scale);
    return { key, hp, maxHp: hp, atk: [e.atk[0] + bump, e.atk[1] + bump], poison: 0, charge: 0 };
  }
  function specialDmg(r) {
    const en = r.enemy, e = ENEMIES[en.key];
    if (en.key === "dragon") return breathOf(r.tier || 0);
    return Math.round(((en.atk[0] + en.atk[1]) / 2) * e.mult);
  }
  function startFloor(run) {
    run.enemy = makeEnemy(run.floor, run.tier || 0);
    run.turn = 1; run.state = "fight";
    run.msg = "Floor " + run.floor + ": " + (run.floor === FLOORS ? "the " : "a ") + enemyName(run.enemy.key, run.tier || 0) + " appears!";
  }

  /* -------- starting and leaving -------- */
  function enter(t) {
    const S = ctx.getS();
    if (S.run) { openBattle(); return; }
    const dg = DUNGEONS[t];
    if (ctx.level() < dg.lv) { ctx.toast(dg.name + " opens at level " + dg.lv); return; }
    if (!ctx.spendTicket()) { ctx.toast("No tickets left. Next one in " + fmtWait(ctx.nextTicketIn())); return; }
    const h = hero(), d = D();
    d.runs++;
    S.run = { tier: t, floor: 1, hp: h.maxHp, maxHp: h.maxHp, atk: h.atk, sp: h.sp, crit: h.crit, def: h.def, blockBonus: h.block,
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
    const en = r.enemy, E = ENEMIES[en.key], t = r.tier || 0, name = enemyName(en.key, t);
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
        else { const n = poisonStacks(r.sp); en.poison += n; pop("enemy", "+" + n + " poison", "poison"); msg = "Poison Cloud! The " + name + " has " + en.poison + " poison."; }
      } else {
        const crit = Math.random() * 100 < r.crit;
        await play("fireball");
        const dmg = fireDmg(r.sp) * (crit ? 2 : 1);
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
    await play(special ? (en.key === "dragon" ? "breath" : "special") : "enemy", shielding);
    let line;
    if (shielding) {
      dmg = Math.max(0, Math.round(dmg * 0.25) - (r.blockBonus || 0));
      line = dmg ? "You block most of it and take " + dmg + "." : "Your shield blocks it all!";
    } else {
      dmg = Math.max(1, dmg - (r.def || 0));
      line = "You take " + dmg + ".";
    }
    r.hp = Math.max(0, r.hp - dmg); shieldUp = false;
    pop("you", dmg ? "-" + dmg : "Blocked!", dmg ? (special && !shielding ? "crit" : "bad") : "block");
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
    if (r.floor === FLOORS) ctx.addChest();
    r.goldGain = gold;
    r.state = r.floor === FLOORS ? "cleared" : "won";
    ctx.logEvent("Defeated the " + enemyName(r.enemy.key, t) + " on floor " + r.floor + " (+" + gold + " gold)");
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
      case "shield": overlay(hero, "bubble hold", 2000); await wait(260); break;
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
          <div class="dinfo-name"><b>${enemyName(en.key, t)}</b>${en.poison ? `<span class="dpois num">☠ ${en.poison}</span>` : ""}</div>
          ${bar(en.hp, en.maxHp, "ehp")}
        </div>
        <div class="dpad foe"></div>
        <div class="dunit foe charge-${lvl}" id="dEnemy"><div class="aura"></div><div class="denemy" style="filter:hue-rotate(${dg.hue}deg)${t === 4 ? " brightness(.8)" : ""}">${ENEMY_ART[en.key]}</div>${lvl === 3 ? '<div class="sparks"><i></i><i></i><i></i><i></i></div>' : ""}</div>
        <div class="dpad you"></div>
        <div class="dunit you" id="dHero"><div class="dhero"></div>${shieldUp && busy ? '<div class="bubble up"></div>' : ""}</div>
        <div class="dinfo you">
          <div class="dinfo-name"><b>You</b><small class="num">Lv ${ctx.level()}</small></div>
          ${bar(r.hp, r.maxHp, "hp")}
        </div>
      </div>
      <div class="dpanel">
        <div class="dbox"><p class="dmsg" aria-live="polite"></p><p class="dtwist">${twistText(en.key, t)}</p></div>
        <div class="dacts">
          <button class="dact shd" id="dShield" type="button"><span class="dact-ic">${SHIELD_ICON}</span><b>Shield</b><small>Block ¾${r.blockBonus ? " +" + r.blockBonus : ""}</small></button>
          <button class="dact spl${ready ? " ready" : ""}" id="dSpell" type="button"${ready ? "" : ' aria-disabled="true"'}><span class="dact-ic">${sp.icon}</span><b></b><span class="pips">${pips}</span></button>
          <button class="dact atk" id="dAttack" type="button"><span class="dact-ic">${SWORD_ICON}</span><b>Attack</b><small class="num">${r.atk - 1}–${r.atk + 1} dmg · ${r.crit}% crit</small></button>
        </div>
      </div>
      ${r.state !== "fight" ? resultCard(r).replace('class="dresult"', 'class="dresult' + (resultShown ? "" : " late") + '"') : ""}`;
    box.querySelector(".dmsg").textContent = r.msg || "Attack to charge your spell. Shield when the monster is about to strike hard.";
    box.querySelector("#dSpell b").textContent = sp.name;
    box.querySelector("#dSpell").setAttribute("aria-label", sp.name + (ready ? ", ready" : ", charging " + r.charge + " of " + sp.charge));
    ctx.drawHero(box.querySelector(".dhero"), { back: true });
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
      <div><b class="num">${h.maxHp}</b><span>Max HP</span><small>Helmet, pants</small></div>
      <div><b class="num">${h.atk}</b><span>Attack</span><small>Sword</small></div>
      <div><b class="num">${h.crit}%</b><span>Crit chance</span><small>Cape</small></div>
      <div><b class="num">${h.def}</b><span>Defence</span><small>Armour</small></div>
      <div><b class="num">+${h.block}</b><span>Shield block</span><small>Shield</small></div>
      <div><b class="num">${h.spell === "poison" ? poisonStacks(h.sp) : fireDmg(h.sp)}</b><span>${sp.name}</span><small>Intelligence · ${h.spell === "poison" ? "poison" : "damage"}</small></div>`;
    $("#dRecord").textContent = "Runs " + d.runs + " · Clears " + d.clears + " · Best floor " + d.best + " / " + FLOORS;
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
  return { renderTab, resume: () => { if (run() && !$("#dungeon").hidden && !busy) paint(); } };
}

// for balance testing
export const _test = { ENEMIES, SPELLS, fireDmg, poisonStacks, breathOf, armourOf };
