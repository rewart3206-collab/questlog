import { firebaseConfig } from "./firebase-config.js";
import { heroSVG, heroBackSVG, itemSVG, flameSVG } from "./art.js";
import { setupDungeon, SPELLS, levelStats, LEVEL_GAIN, CHARMS, CHARM_OF, ALL_DUNGEONS, MAX_LEVEL, rewardFor, RELIC_ORDER, RELIC_NOUN, RELIC_BONUS, FAMILY_NAMES } from "./dungeon.js";
const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";

/* ================= game data ================= */
const QUEST_XP = 20;
const CLEAR_XP = 20;         // bonus for completing every quest in a day        // every quest is worth the same
const MAX_EXTRA_QUESTS = 2; // on top of the 3 core quests
// The three core quests are the same for every player and can't be edited or removed.
const CORE_QUESTS = [
  { name: "Exercise", desc: "Training, climbing or a walk" },
  { name: "Drink 2.5L of water", desc: "" },
  { name: "15 minutes of work or study", desc: "" },
];
const defaultQuests = () => CORE_QUESTS.map((c) => ({ id: uid(), ...c, core: true }));
const TITLES = [
  { lv: 1, t: "Novice" }, { lv: 3, t: "Habit Squire" }, { lv: 5, t: "Streak Knight" },
  { lv: 8, t: "Keeper of Routines" }, { lv: 12, t: "Archmage of Mornings" }, { lv: 20, t: "Legend of the Daily Grind" },
];
const STREAK_TITLES = [{ d: 7, t: "Week Warden" }, { d: 30, t: "Moon Marathoner" }];
// Gear by slot. Armour is drawn over the T-shirt; pants recolour the trousers.
// Every slot has one design per rarity: all commons look alike, all uncommons look alike, and so on.
const GEAR_NAMES = {
  head: ["Leather Cap", "Iron Helm", "Knight Helm", "Wizard Hat", "Celestial Helm"],
  shirt: ["Leather Vest", "Chainmail", "Steel Plate", "Shadow Plate", "Celestial Plate"],
  pants: ["Traveller's Trousers", "Ranger Trousers", "Royal Leggings", "Shadow Greaves", "Celestial Greaves"],
  back: ["Traveller's Cloak", "Ranger Cloak", "Hero's Cape", "Royal Mantle", "Celestial Wings"],
  hand: ["Iron Sword", "Steel Sword", "Knight's Blade", "Runeblade", "Golden Blade"],
  off: ["Wooden Shield", "Iron Buckler", "Knight's Shield", "Dragon Shield", "Golden Aegis"],
};
// Item ids from earlier versions: [slot, rarity of the matching design]. Used for old saves and old guild profiles.
const OLD_GEAR = {
  helm: ["head", 2], hat: ["head", 3], crown: ["head", 4],
  armour_leather: ["shirt", 0], armour_chain: ["shirt", 1], armour_plate: ["shirt", 2],
  dye_shadow: ["shirt", 0], shirt_forest: ["shirt", 1], dye_gold: ["shirt", 2],
  pants_shadow: ["pants", 3], pants_royal: ["pants", 2], pants_ember: ["pants", 4],
  cape: ["back", 2], goldcape: ["back", 3], cape_forest: ["back", 1],
  sword: ["hand", 0], staff: ["hand", 2], sword_gold: ["hand", 4],
  shield: ["off", 0], shield_steel: ["off", 1], shield_royal: ["off", 2],
};
const GEAR_SLOTS = [
  { slot: "head", name: "Helmet" }, { slot: "shirt", name: "Armour" }, { slot: "pants", name: "Pants" },
  { slot: "back", name: "Cape" }, { slot: "hand", name: "Sword" }, { slot: "off", name: "Shield" },
];
// Chests can give any rarity. Items sell for gold; three legendaries of the same slot merge into a
// stronger one (Legendary +1, +2 …). Each slot powers one part of dungeon combat.
const RARITIES = [
  { name: "Common", colour: "#b9c0cf", drop: 60, sell: 20 }, { name: "Uncommon", colour: "#5fd36a", drop: 25, sell: 50 },
  { name: "Rare", colour: "#4fa8ff", drop: 10, sell: 120 }, { name: "Epic", colour: "#b46cff", drop: 4, sell: 300 },
  { name: "Legendary", colour: "#ffb020", drop: 1, sell: 800 },
];
const LEG = RARITIES.length - 1;
const SLOT_STATS = {
  // big jumps between rarities: each dungeon needs gear of its own rarity
  hand: { key: "dmg", label: "Attack damage", vals: [2, 4, 7, 11, 16], plus: 3 },
  off: { key: "block", label: "Shield block", vals: [1, 3, 5, 8, 12], plus: 2 },
  head: { key: "hp", label: "Max HP", vals: [4, 10, 18, 30, 45], plus: 8 },
  shirt: { key: "def", label: "Defence", vals: [1, 2, 4, 6, 9], plus: 2 },
  pants: { key: "hp", label: "Max HP", vals: [3, 8, 14, 24, 36], plus: 6 },
  back: { key: "crit", label: "Crit chance", vals: [3, 6, 10, 15, 20], plus: 3, pct: true },
};
const CHEST_PRICE = 100;
const statVal = (slot, r, p) => SLOT_STATS[slot].vals[r] + (r === LEG ? (p || 0) * SLOT_STATS[slot].plus : 0);
const statText = (slot, r, p) => "+" + statVal(slot, r, p) + (SLOT_STATS[slot].pct ? "% " : " ") + SLOT_STATS[slot].label;
const relicName = (slot, fam) => CHARMS[fam].name.split(" ")[0] + " " + RELIC_NOUN[slot];
const RELIC_COLOUR = "#ff7a3a";
const itemName = (it) => it.relic ? relicName(it.slot, it.relic) : GEAR_NAMES[it.slot][it.r] + (it.p ? " +" + it.p : "");
const rarityName = (it) => it.relic ? "Relic" : RARITIES[it.r].name + (it.p ? " +" + it.p : "");
const rarityColour = (it) => it.relic ? RELIC_COLOUR : RARITIES[it.r].colour;
const relicText = (it) => it.relic ? RELIC_BONUS[it.slot] + " against " + FAMILY_NAMES[it.relic] : "";
// Relics are only at full power against their own kind of monster. Against anything else they
// count as a Rare item, so regular Epic and Legendary gear beats them there.
const RELIC_OFF_RARITY = 2;
const sv = (slot, v) => "+" + v + (SLOT_STATS[slot].pct ? "% " : " ") + SLOT_STATS[slot].label;
function itemStatText(it) {
  if (!it.relic) return statText(it.slot, it.r, it.p);
  return sv(it.slot, statVal(it.slot, it.r, it.p)) + " against " + FAMILY_NAMES[it.relic] + " (" + sv(it.slot, statVal(it.slot, RELIC_OFF_RARITY, 0)).replace(/^\+/, "+") + " against others). " + relicText(it);
}
const sellPrice = (it) => RARITIES[it.r].sell * (it.r === LEG ? 1 + 2 * (it.p || 0) : 1);
const SLOTS = ["head", "shirt", "pants", "back", "hand", "off"];

const dkey = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => dkey(new Date());
const uid = () => Math.random().toString(36).slice(2, 9);

const TK_MAX = 6, TK_EVERY = 4 * 60 * 60 * 1000;
// While testing: unlimited dungeon runs. Set to false to bring back the 4-hour ticket timer.
const TK_UNLIMITED = true;
// While testing: unlimited gold, so chests are free. Set to false to go back to spending real gold.
const GOLD_UNLIMITED = true;
// While testing: every rarity of every slot (plus a Legendary +1 of each) shows in the gear menus.
// These test items are never saved into the inventory, so setting this to false removes them cleanly
// (anything equipped from them simply comes off).
const GEAR_TEST = true;
function freshState(name) {
  return {
    v: 1, at: Date.now(), name: name || "Adventurer", xp: 0,
    attr: { INT: 1 }, qv: 2,
    quests: defaultQuests(),
    treasures: [
      { id: uid(), name: "One episode of a show", every: 5, base: 0 },
      { id: uid(), name: "A fancy coffee", every: 8, base: 0 },
      { id: uid(), name: "Weekend lie-in", every: 15, base: 0 },
      { id: uid(), name: "Takeaway night", every: 30, base: 0 },
    ],
    tk: { n: TK_MAX, at: Date.now() }, inv: [], gold: 0, chests: 0, spells: ["fireball", "poison"], spell: "fireball", equip: {}, title: "Novice", days: {}, clears: {}, clearXp: {}, log: [],
  };
}

// Older saves used four attributes (Vitality, Spirit) and a Monk class: fold them into Health / Druid.
function migrate(st) {
  if (!st || st.v !== 1) return st;
  const old = { VIT: "HLT", SPI: "HLT" };
  (st.quests || []).forEach((q) => { if (old[q.stat]) q.stat = old[q.stat]; });
  const sx = st.statXp || {};
  if (!("HLT" in sx)) st.statXp = { STR: sx.STR || 0, INT: sx.INT || 0, HLT: (sx.VIT || 0) + (sx.SPI || 0) };
  delete st.cls;
  if (!st.clearXp) st.clearXp = {};
  st.look = normLook(st.look);
  if (st.equip && st.equip.dye) { st.equip.shirt = st.equip.dye; delete st.equip.dye; }
  // v2 quests: three core quests worth the same XP, attributes raised with skill points.
  if (st.qv !== 2) {
    st.quests = defaultQuests();
    st.attr = { INT: 1 };
    st.qv = 2;
  }
  // Attributes v3: only Intelligence is left. Points spent on Strength or Health come back to spend again.
  if (st.attr && Object.keys(st.attr).some((k) => k !== "INT")) {
    st.attr = { INT: st.attr.INT || 1 };
    st.attrLog = (st.attrLog || []).filter((k) => k === "INT");
  }
  // Gear v2: gear lives in an inventory with rarities. Anything already unlocked becomes a common copy
  // (worn items stay worn), and gear bought with gold in the first version too.
  if (!st.inv) {
    const ids = [...new Set([...(st.unlocked || []), ...(st.owned || [])])].filter((id) => OLD_GEAR[id]);
    st.inv = ids.map((id) => ({ u: uid(), id, r: 0 }));
    const eq = {};
    Object.entries(st.equip || {}).forEach(([slot, id]) => { const it = st.inv.find((x) => x.id === id); if (it) eq[slot] = it.u; });
    st.equip = eq; st.gold = st.gold || 0; st.chests = st.chests || 0;
    delete st.unlocked; delete st.owned;
  }
  // Armour v3: tunics become armour, spells are owned and equipped, old dice runs are refunded.
  // Gear v3: designs follow rarity, so an item is just a slot and a rarity (plus a + level for legendaries).
  (st.inv || []).forEach((it) => { if (it.id) { const o = OLD_GEAR[it.id]; it.slot = o ? o[0] : "hand"; delete it.id; } });
  if (!st.seen) { st.seen = {}; (st.inv || []).forEach((it) => { const l = (st.seen[it.slot] = st.seen[it.slot] || []); if (!l.includes(it.r)) l.push(it.r); }); }
  if (!st.vanity) st.vanity = {};
  // Charms v1: anyone who already cleared a dungeon gets its charm.
  if (!st.charms) {
    const d = st.dungeon || {}, cb = d.clearsBy || {};
    st.charms = CHARM_OF.filter((k, i) => (cb[["cave", "crypt", "forge", "keep", "citadel"][i]] || 0) > 0 || (i === 0 && !d.clearsBy && d.clears > 0));
  }
  if (!st.spells) { st.spells = ["fireball"]; st.spell = "fireball"; }
  // Starter spells: everyone has Fireball and Poison Cloud from day one.
  if (!st.spells.includes("poison")) st.spells.push("poison");
  // Spell chests replaced research: anything being researched is cancelled and its gold refunded.
  const RCOST = { heal: 200, poison: 300, frost: 600, ward: 900, lightning: 1200, drain: 2000 };
  if (st.research) { if (!GOLD_UNLIMITED) st.gold = (st.gold || 0) + (RCOST[st.research.key] || 0); delete st.research; }
  if (st.spellChests == null) st.spellChests = 0;
  if (!st.frags) st.frags = {};
  if (st.run && st.run.dice) { delete st.run; if (st.dungeon && st.dungeon.spent) st.dungeon.spent--; }
  if (st.look) delete st.look.outfit;
  // Tickets v2: a timer instead of quests. Everyone starts with a full stack.
  if (!st.tk) st.tk = { n: TK_MAX, at: Date.now() };
  // Core quests always use the standard wording, even if renamed in an earlier version.
  st.quests.filter((q) => q.core).forEach((q, i) => { if (CORE_QUESTS[i]) Object.assign(q, CORE_QUESTS[i]); });
  const total = Object.values(st.days || {}).reduce((n, d) => n + Object.keys(d).length, 0);
  (st.treasures || []).forEach((t) => {
    if (t.every == null) { t.every = Math.max(3, Math.round((t.cost || 40) / 8)); t.base = total; delete t.cost; }
  });
  return st;
}

/* ================= levels ================= */
const needFor = (l) => 60 + 40 * l;
function levelInfo(xp) { let l = 1, r = xp; while (r >= needFor(l)) { r -= needFor(l); l++; } return { level: l, into: r, need: needFor(l) }; }
function statLevel(x) { let l = 1, r = x; while (r >= 30 + 20 * l) { r -= 30 + 20 * l; l++; } return { level: l, into: r, need: 30 + 20 * l }; }

/* ================= sprite ================= */
const HAIRSTYLES = {
  short: { name: "Short" }, long: { name: "Long" }, spiky: { name: "Spiky" },
  bun: { name: "Bun" }, ponytail: { name: "Ponytail" }, bald: { name: "Bald" },
};
const HAIR_COLOURS = { brown: "#5a3a22", black: "#1f1a24", blonde: "#e0b84c", ginger: "#c2582a", silver: "#c9ccd6", pink: "#e27fb5", blue: "#4c78d6" };
const SKIN_TONES = { s1: "#f6d7b8", s2: "#f1c9a0", s3: "#d9a77c", s4: "#b07a50", s5: "#7d5235", s6: "#5a3824" };
const DEFAULT_LOOK = { body: "m", hair: "short", hc: "brown", skin: "s2" };
// Works with old saves/profiles that only stored "m"/"f".
function normLook(l) {
  if (l && typeof l === "object") {
    return {
      body: l.body === "f" ? "f" : "m",
      hair: HAIRSTYLES[l.hair] ? l.hair : "short",
      hc: HAIR_COLOURS[l.hc] ? l.hc : "brown",
      skin: SKIN_TONES[l.skin] ? l.skin : "s2",
    };
  }
  return l === "f" ? { ...DEFAULT_LOOK, body: "f", hair: "long" } : { ...DEFAULT_LOOK };
}
// Turn saved gear + look into what the art needs. Gear values are design ids ("hand3");
// ids from older versions (in old saves or friends' guild cards) are translated.
function toDesign(slot, v) {
  if (v == null) return null;
  if (new RegExp("^" + slot + "([0-4]|_(slime|bone|imp|golem|dragon))$").test(v)) return v;
  const o = OLD_GEAR[v]; return o && o[0] === slot ? slot + o[1] : null;
}
function heroParts(equip) {
  equip = equip || {};
  const look = normLook(equip.body ? { body: equip.body, hair: equip.hair, hc: equip.hc, skin: equip.skin } : equip.look);
  const out = { body: look.body, hair: look.hair, hairColor: HAIR_COLOURS[look.hc], skin: SKIN_TONES[look.skin] };
  SLOTS.forEach((slot) => (out[slot] = toDesign(slot, equip[slot] != null ? equip[slot] : slot === "shirt" ? equip.armour : null)));
  return out;
}
function drawSprite(el, cls, equip, opts) { el.innerHTML = heroSVG(heroParts(equip), opts || {}); }
// r: a rarity number, or a monster family ("slime") for a relic
function gearIcon(slot, r, relic) {
  if (typeof r === "string") { relic = r; }
  const d = document.createElement("div"); d.className = "gear-icon";
  const col = relic ? RELIC_COLOUR : r != null ? RARITIES[r].colour : null;
  if (col) { d.style.borderColor = col; d.style.boxShadow = "0 0 0 2px " + col + "55, inset 0 0 14px " + col + "66"; }
  d.innerHTML = itemSVG(slot + (relic ? "_" + relic : r == null ? 0 : r));
  return d;
}
function testItems(slot) {
  if (!GEAR_TEST) return [];
  const out = [0, 1, 2, 3, 4].map((r) => ({ u: "t-" + slot + r, slot, r, test: true }));
  out.push({ u: "t-" + slot + "4p1", slot, r: LEG, p: 1, test: true });
  return out;
}
const testItem = (u) => { const m = /^t-(head|shirt|pants|back|hand|off)/.exec(u || ""); return m ? testItems(m[1]).find((x) => x.u === u) || null : null; };
// Relics: gear from the prestige dungeons. Kept forever (never in the inventory, so prestige can't
// remove them). Each is a Legendary +(level-1) item with a bonus against its own kind of monster.
const relicLevel = (slot) => RELIC_ORDER.indexOf(slot) + 2;
const hasRelic = (slot, fam) => GEAR_TEST || (S.relics || []).includes(slot + ":" + fam);
function relicItems(slot) {
  if (!RELIC_ORDER.includes(slot)) return [];
  return CHARM_OF.filter((fam) => hasRelic(slot, fam)).map((fam) => ({ u: "r-" + slot + "-" + fam, slot, r: LEG, p: relicLevel(slot) - 1, relic: fam }));
}
const relicItem = (u) => { const m = /^r-(head|shirt|pants|back|hand|off)-(\w+)$/.exec(u || ""); return m ? relicItems(m[1]).find((x) => x.u === u) || null : null; };
const invItem = (u) => (u == null ? null : String(u).startsWith("t-") ? testItem(u) : String(u).startsWith("r-") ? relicItem(u) : S.inv.find((x) => x.u === u));
// worn relics as { family: { slot: true } } for the dungeon
function relicBonus() {
  const out = {};
  SLOTS.forEach((slot) => { const it = invItem(S.equip[slot]); if (it && it.relic) (out[it.relic] = out[it.relic] || {})[slot] = true; });
  return out;
}
// slot -> design id that shows on the hero: a vanity look if one is chosen, otherwise the worn item
function lookIds() {
  const out = {}, v = S.vanity || {};
  SLOTS.forEach((slot) => {
    if (v[slot] === -1) out[slot] = null;
    else if (v[slot] != null) out[slot] = slot + (typeof v[slot] === "string" ? "_" : "") + v[slot];
    else { const it = invItem(S.equip[slot]); out[slot] = it ? slot + (it.relic ? "_" + it.relic : it.r) : null; }
  });
  return out;
}
// Celestial set bonus: wear the legendary helmet, armour and pants, all at +1 or higher, for a chance
// to dodge any monster hit. Returns the lowest + level of the three (0 = no bonus).
const SET_SLOTS = ["head", "shirt", "pants"];
function celestialLevel() {
  const its = SET_SLOTS.map((s) => invItem(S.equip[s]));
  if (its.some((it) => !it || it.relic || it.r !== LEG || !(it.p >= 1))) return 0;
  return Math.min(...its.map((it) => it.p));
}
const dodgeFor = (lvl) => (lvl ? Math.min(35, 10 + 5 * lvl) : 0);
// combined dungeon bonuses from everything worn (vanity never changes stats)
// fam: the kind of monster you're about to fight (null = any other), for relics
function gearBonus(fam) {
  const b = { dmg: 0, block: 0, hp: 0, def: 0, crit: 0 };
  SLOTS.forEach((slot) => {
    const it = invItem(S.equip[slot]); if (!it) return;
    const full = !it.relic || (fam && it.relic === fam);
    b[SLOT_STATS[slot].key] += full ? statVal(slot, it.r, it.p) : statVal(slot, RELIC_OFF_RARITY, 0);
  });
  b.dodge = dodgeFor(celestialLevel());
  // charms only work against their own kind of monster, so the dungeon applies them per fight
  b.charm = equippedCharm();
  return b;
}
// Charms: one per dungeon, earned on its first clear. S.charms lists the ones you have.
const hasCharm = (k) => GEAR_TEST || (S.charms || []).includes(k);
const equippedCharm = () => { const k = S.equip && S.equip.charm; return k && CHARMS[k] && hasCharm(k) ? k : null; };
function earnReward(n) {
  const rw = rewardFor(n);
  if (rw.type === "charm") return earnCharm(rw.key);
  const id = rw.slot + ":" + rw.fam;
  if ((S.relics || []).includes(id)) return;
  (S.relics = S.relics || []).push(id);
  logEvent("Earned the " + rw.name);
  save();
  const it = relicItems(rw.slot).find((x) => x.relic === rw.fam) || { u: "r-" + rw.slot + "-" + rw.fam, slot: rw.slot, r: LEG, p: rw.level - 1, relic: rw.fam };
  revealItem("NEW RELIC", it, true);
}
function hasReward(n) {
  const rw = rewardFor(n);
  return rw.type === "charm" ? hasCharm(rw.key) : hasRelic(rw.slot, rw.fam);
}
// Prestige: after clearing the newest dungeon, start over with a harder dungeon added to the list.
const MAX_PRESTIGE = 5 * MAX_LEVEL - 5;
const dungeonCount = () => Math.min(5 * MAX_LEVEL, 5 + (S.prestige || 0));
function canPrestige() {
  const P = S.prestige || 0; if (P >= MAX_PRESTIGE) return false;
  const newest = ALL_DUNGEONS[4 + P], cb = (S.dungeon && S.dungeon.clearsBy) || {};
  return (cb[newest.id] || 0) > 0;
}
function openPrestige() {
  if (!canPrestige()) return;
  const P = S.prestige || 0, next = ALL_DUNGEONS[5 + P];
  openSheet((w, close) => {
    sheetHead(w, "Prestige " + (P + 1), close);
    const p = document.createElement("div"); p.className = "stack"; p.style.marginTop = "10px";
    p.innerHTML = '<p class="note" style="margin:0"></p><ul class="prest-list"></ul><p class="note" style="margin:0"></p>';
    p.children[0].textContent = "Start your adventure again and unlock the " + next.name + ", a harder dungeon than any before it.";
    const ul = p.children[1];
    [["Resets", "your gear from chests, gold, chests, tickets and dungeon progress. Dungeons lock again until you clear them in order."],
     ["Keeps", "your level, spells, charms, relics, vanity looks, quests and streaks."],
     ["Unlocks", next.name + ". Its first clear gives the " + rewardFor(5 + P).name + "."]].forEach(([k, v]) => {
      const li = document.createElement("li"); const b = document.createElement("b"); b.textContent = k + " "; li.append(b, v); ul.appendChild(li);
    });
    p.children[2].textContent = "Your prestige shows next to your level, and the guild ranks prestige first.";
    w.appendChild(p);
    const go = armedButton("Prestige now", "gold big", () => { close(); doPrestige(); });
    go.style.width = "100%"; go.style.marginTop = "12px"; w.appendChild(go);
  });
}
function doPrestige() {
  if (!canPrestige()) return;
  S.prestige = (S.prestige || 0) + 1;
  S.inv = [];
  const keep = {};
  Object.entries(S.equip || {}).forEach(([slot, v]) => { if (slot === "charm" || String(v).startsWith("r-")) keep[slot] = v; });
  S.equip = keep;
  S.gold = 0; S.chests = 0;
  S.tk = { n: TK_MAX, at: Date.now() };
  S.dungeon = S.dungeon || {};
  S.dungeon.clearsBy = {}; S.dungeon.bestBy = {}; S.dungeon.best = 0;
  S.run = null;
  logEvent("Prestige " + S.prestige + "! The " + ALL_DUNGEONS[4 + S.prestige].name + " has opened");
  save(); render();
  queueModal((w, done) => {
    w.innerHTML = '<div class="title-tag">PRESTIGE</div><h1></h1><p class="muted" style="margin:0"></p><button class="btn gold">Onward</button>';
    w.querySelector("h1").textContent = "Prestige " + S.prestige;
    w.querySelector("p").textContent = "A fresh start, and the " + ALL_DUNGEONS[4 + S.prestige].name + " awaits once you fight your way back.";
    w.querySelector("button").onclick = done;
  });
}
function earnCharm(k) {
  if (!CHARMS[k] || (S.charms || []).includes(k)) return;
  (S.charms = S.charms || []).push(k);
  logEvent("Earned the " + CHARMS[k].name);
  save();
  queueModal((w, done) => {
    w.innerHTML = '<div class="title-tag">NEW CHARM</div><div class="chest-reveal"><div class="chest-burst" style="background:radial-gradient(circle,#ffcf4aaa 0,transparent 65%)"></div><div class="gear-icon unlock-icon"></div></div><h1></h1><p class="muted" style="margin:0"></p><div class="actions" style="justify-content:center"><button class="btn gold">Equip</button><button class="btn ghost">Keep</button></div>';
    w.querySelector(".gear-icon").innerHTML = CHARMS[k].icon;
    w.querySelector("h1").textContent = CHARMS[k].name;
    w.querySelector("p").textContent = CHARMS[k].desc + ". Find it in Hero, then Gear.";
    const [eq, keep] = w.querySelectorAll("button");
    eq.onclick = () => { S.equip.charm = k; save(); render(); done(); };
    keep.onclick = done;
  });
}
// every design you've ever owned can be used as a vanity look
function markSeen(it) { S.seen = S.seen || {}; const l = (S.seen[it.slot] = S.seen[it.slot] || []); if (!l.includes(it.r)) l.push(it.r); }
const heroLook = () => ({ ...lookIds(), ...normLook(S.look) });
let S = null;
let me = null;          // Firebase user
let userRef = null, profileRef = null;
let unsubs = [];
let saveTimer = null;
let fb = null;            // Firebase write helpers, set once the SDK loads

function doneToday() { return S.days[today()] || {}; }
function questStreak(qid) {
  let n = 0; const d = new Date();
  if (!(S.days[dkey(d)] || {})[qid]) d.setDate(d.getDate() - 1);
  while ((S.days[dkey(d)] || {})[qid]) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function dayStreak() {
  const has = (k) => S.days[k] && Object.keys(S.days[k]).length > 0;
  let n = 0; const d = new Date();
  if (!has(dkey(d))) d.setDate(d.getDate() - 1);
  while (has(dkey(d))) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
function bestStreak() {
  const keys = Object.keys(S.days).filter((k) => Object.keys(S.days[k]).length).sort();
  let best = 0, run = 0, prev = null;
  for (const k of keys) { const d = new Date(k + "T12:00:00"); run = prev && (d - prev) / 864e5 < 1.5 ? run + 1 : 1; best = Math.max(best, run); prev = d; }
  return best;
}
function totalQuests() { return Object.values(S.days).reduce((n, d) => n + Object.keys(d).length, 0); }
function counts() {
  return {
    total: totalQuests(), clears: Object.keys(S.clears).length, best: bestStreak(),
    level: levelInfo(S.xp).level,
  };
}
function unlockedTitles() {
  const L = levelInfo(S.xp).level, bs = bestStreak();
  return TITLES.filter((t) => L >= t.lv).map((t) => t.t).concat(STREAK_TITLES.filter((t) => bs >= t.d).map((t) => t.t));
}

/* ================= saving ================= */
const localKey = () => "questlog:" + me.uid;
function setSync(text, off) { const el = $("#sync"); el.textContent = text; el.classList.toggle("off", !!off); }
function save() {
  S.at = Date.now();
  try { localStorage.setItem(localKey(), JSON.stringify(S)); } catch (e) {}
  setSync(navigator.onLine ? "Saving…" : "Offline · will sync when you reconnect", !navigator.onLine);
  clearTimeout(saveTimer);
  saveTimer = setTimeout(pushToCloud, 800);
}
async function pushToCloud() {
  if (!userRef || !fb) return;
  const L = levelInfo(S.xp);
  const equip = lookIds(); const lk = normLook(S.look); Object.assign(equip, lk); equip.look = lk.body; equip.prest = S.prestige || 0;
  try {
    await Promise.all([
      fb.setDoc(userRef, { save: JSON.stringify(S), at: S.at }),
      fb.setDoc(profileRef, {
        name: S.name.slice(0, 24), xp: S.xp, level: L.level, title: S.title,
        // prestige rides along in the equip map so the existing Firestore rules accept it
        streak: dayStreak(), equip, updatedAt: fb.serverTimestamp(),
      }),
    ]);
    setSync("Saved to the cloud");
  } catch (e) {
    console.error(e);
    setSync("Couldn't save: " + (e.code || e.message), true);
  }
}
window.addEventListener("online", () => { if (S) pushToCloud(); });
window.addEventListener("offline", () => { if (S) setSync("Offline · will sync when you reconnect", true); });

/* ================= actions ================= */
function logEvent(text) { S.log.unshift({ t: Date.now(), text }); S.log = S.log.slice(0, 60); }
function toggleQuest(q, ev) {
  const k = today(); S.days[k] = S.days[k] || {};
  const before = levelInfo(S.xp).level;
  if (S.days[k][q.id]) {
    const r = S.days[k][q.id]; delete S.days[k][q.id];
    S.xp = Math.max(0, S.xp - r.xp);
    if (S.clears[k]) { delete S.clears[k]; if (S.clearXp[k]) { S.xp = Math.max(0, S.xp - S.clearXp[k]); delete S.clearXp[k]; } }
    toast("Quest undone");
  } else {
    const xp = QUEST_XP;
    S.days[k][q.id] = { xp }; S.xp += xp;
    logEvent("Completed “" + q.name + "” (+" + xp + " XP)");
    if (ev) floatText(ev, "+" + xp + " XP");
    if (S.quests.length && S.quests.every((x) => S.days[k][x.id]) && !S.clears[k]) {
      S.clears[k] = 1; S.clearXp[k] = CLEAR_XP; S.xp += CLEAR_XP;
      logEvent("Full clear! (+" + CLEAR_XP + " bonus XP)"); toast("Full clear! +" + CLEAR_XP + " bonus XP");
    }
  }
  const after = levelInfo(S.xp).level;
  if (after > before) logEvent("Reached level " + after);
  save(); render();
  if (after > before) levelUp(after);
}
// Pop-up cards (level up, challenge complete) queue so several can show one after another.
const modalQueue = [];
function queueModal(build) {
  modalQueue.push(build);
  if ($("#lvlup").hidden) nextModal();
}
function nextModal() {
  const el = $("#lvlup");
  const build = modalQueue.shift();
  if (!build) { el.hidden = true; return; }
  el.innerHTML = "";
  const w = document.createElement("div"); w.className = "win";
  el.appendChild(w); build(w, nextModal); el.hidden = false;
  const b = w.querySelector("button"); if (b) b.focus();
}
function levelUp(L) {
  const newTitle = TITLES.filter((t) => t.lv === L).map((t) => t.t);
  queueModal((w, done) => {
    w.innerHTML = '<div class="title-tag">LEVEL UP</div><h1></h1><div class="sprite"></div><p class="muted" style="margin:0"></p><button class="btn gold">Onward</button>';
    w.querySelector("h1").textContent = "Level " + L;
    drawSprite(w.querySelector(".sprite"), null, heroLook());
    w.querySelector("p").textContent = "+" + LEVEL_GAIN.hp + " HP, +" + LEVEL_GAIN.atk + " attack and stronger spells." + (newTitle.length ? " New title: " + newTitle.join(", ") : "");
    w.querySelector("button").onclick = done;
  });
}
// Chests: buy with gold or earn by clearing a dungeon. Each gives one random item of any rarity.
function buyChest() {
  if (GOLD_UNLIMITED) { logEvent("Opened a chest (free while testing)"); openChest(true); return; }
  if (S.gold < CHEST_PRICE) { toast("You need " + (CHEST_PRICE - S.gold) + " more gold. Earn gold in the dungeon"); return; }
  S.gold -= CHEST_PRICE; logEvent("Bought a chest (-" + CHEST_PRICE + " gold)"); openChest(true);
}
function rollRarity() {
  let n = Math.random() * 100;
  for (let r = 0; r < RARITIES.length; r++) { n -= RARITIES[r].drop; if (n < 0) return r; }
  return 0;
}
function openChest(bought) {
  if (!bought) { if (S.chests < 1) return; S.chests--; }
  const item = { u: uid(), slot: SLOTS[Math.floor(Math.random() * SLOTS.length)], r: rollRarity() };
  S.inv.push(item); markSeen(item);
  logEvent("Opened a chest: " + RARITIES[item.r].name + " " + itemName(item));
  save(); render();
  revealItem("CHEST OPENED", item, true);
}
// Spell chests: clearing a dungeon gives one. Each holds a fragment of a spell you don't know yet;
// 5 fragments of a spell teach it to you. S.frags = { spell: fragments }, S.spellChests = unopened.
const FRAGS_NEEDED = 5;
function openSpellChest() {
  if ((S.spellChests || 0) < 1) return;
  S.spellChests--;
  const pool = Object.keys(SPELLS).filter((k) => !S.spells.includes(k));
  if (!pool.length) {
    S.gold = (S.gold || 0) + 150; logEvent("Opened a spell chest: you know every spell, so it held 150 gold");
    save(); render(); toast("You know every spell. +150 gold instead"); return;
  }
  const k = pool[Math.floor(Math.random() * pool.length)];
  S.frags = S.frags || {};
  const n = (S.frags[k] || 0) + 1, learned = n >= FRAGS_NEEDED;
  if (learned) { delete S.frags[k]; S.spells.push(k); logEvent("Collected 5 fragments: learned " + SPELLS[k].name); }
  else { S.frags[k] = n; logEvent("Opened a spell chest: " + SPELLS[k].name + " fragment (" + n + "/" + FRAGS_NEEDED + ")"); }
  save(); render();
  if (learned) { revealSpell(k, "SPELL LEARNED"); return; }
  queueModal((w, done) => {
    w.innerHTML = '<div class="title-tag">SPELL CHEST</div><div class="chest-reveal"><div class="chest-burst" style="background:radial-gradient(circle,#b46cffaa 0,transparent 65%)"></div><div class="gear-icon unlock-icon frag-icon"></div></div><h1></h1><p class="muted" style="margin:0"></p><div class="frag-bar"><i></i><span class="num"></span></div><button class="btn gold">Nice</button>';
    w.querySelector(".gear-icon").innerHTML = SPELLS[k].icon;
    w.querySelector("h1").textContent = SPELLS[k].name + " fragment";
    w.querySelector("p").textContent = SPELLS[k].desc;
    w.querySelector(".frag-bar i").style.width = (n / FRAGS_NEEDED) * 100 + "%";
    w.querySelector(".frag-bar span").textContent = n + " / " + FRAGS_NEEDED + " fragments";
    w.querySelector("button").onclick = done;
  });
}
function revealSpell(k, tag) {
  const sp = SPELLS[k];
  queueModal((w, done) => {
    w.innerHTML = '<div class="title-tag"></div><div class="chest-reveal"><div class="chest-burst" style="background:radial-gradient(circle,#b46cffaa 0,transparent 65%)"></div><div class="gear-icon unlock-icon"></div></div><h1></h1><p class="muted" style="margin:0"></p><div class="actions" style="justify-content:center"><button class="btn gold">Equip</button><button class="btn ghost">Keep</button></div>';
    w.querySelector(".title-tag").textContent = tag || "NEW SPELL";
    w.querySelector(".gear-icon").innerHTML = sp.icon;
    w.querySelector("h1").textContent = sp.name;
    w.querySelector("p").textContent = sp.desc;
    const [eq, keep] = w.querySelectorAll("button");
    eq.onclick = () => { S.spell = k; save(); render(); done(); };
    keep.onclick = done;
  });
}
function renderSpells() {
  const box = $("#spellList"); box.innerHTML = ""; const unknown = [];
  Object.entries(SPELLS).filter(([k]) => !S.spells.includes(k)).forEach(([k, sp]) => {
    const n = (S.frags || {})[k] || 0;
    const li = document.createElement("li"); li.className = "ch locked frag-row";
    const ic = document.createElement("div"); ic.className = "gear-icon"; ic.innerHTML = sp.icon; li.appendChild(ic);
    const mid = document.createElement("div"); mid.style.minWidth = "0";
    const nm = document.createElement("div"); nm.className = "ch-name"; nm.textContent = sp.name;
    const sub = document.createElement("div"); sub.className = "ch-goal"; sub.textContent = sp.desc;
    const bar = document.createElement("div"); bar.className = "frag-bar"; bar.innerHTML = '<i></i><span class="num"></span>';
    bar.firstChild.style.width = (n / FRAGS_NEEDED) * 100 + "%"; bar.lastChild.textContent = n + " / " + FRAGS_NEEDED + " fragments";
    mid.append(nm, sub, bar); li.append(mid, document.createElement("span")); unknown.push(li);
  });
  Object.entries(SPELLS).filter(([k]) => S.spells.includes(k)).forEach(([k, sp]) => {
    const own = S.spells.includes(k), eq = S.spell === k;
    const li = document.createElement("li"); li.className = "ch" + (own ? " done" : " locked") + (eq ? " equipped" : "");
    const ic = document.createElement("div"); ic.className = "gear-icon"; ic.innerHTML = sp.icon; li.appendChild(ic);
    const mid = document.createElement("div"); mid.style.minWidth = "0";
    const nm = document.createElement("div"); nm.className = "ch-name"; nm.textContent = own ? sp.name : "???";
    const sub = document.createElement("div"); sub.className = "ch-goal"; sub.textContent = own ? sp.desc : "Find it in a chest.";
    mid.append(nm, sub);
    const b = document.createElement("button"); b.className = "btn" + (eq ? " gold" : " ghost");
    b.textContent = !own ? "Locked" : eq ? "Equipped" : "Equip"; b.disabled = !own || eq;
    b.onclick = () => { S.spell = k; save(); render(); };
    li.append(mid, b); box.appendChild(li);
  });
  unknown.forEach((li) => box.appendChild(li));
}
function revealItem(tagText, item, offerEquip) {
  queueModal((w, done) => {
    w.innerHTML = '<div class="title-tag"></div><div class="chest-reveal"><div class="chest-burst"></div><div class="reveal-slot"></div></div><h1></h1><span class="rarity-tag"></span><p class="muted" style="margin:0"></p><div class="actions" style="justify-content:center"></div>';
    w.querySelector(".title-tag").textContent = tagText;
    const R = RARITIES[item.r];
    const icon = gearIcon(item.slot, item.r, item.relic); icon.classList.add("unlock-icon");
    w.querySelector(".reveal-slot").replaceWith(icon);
    w.querySelector(".chest-burst").style.background = "radial-gradient(circle," + R.colour + "aa 0,transparent 65%)";
    w.querySelector("h1").textContent = itemName(item);
    const tag = w.querySelector(".rarity-tag"); tag.textContent = rarityName(item); tag.style.background = rarityColour(item);
    w.querySelector("p").textContent = itemStatText(item);
    const a = w.querySelector(".actions");
    if (offerEquip && S.equip[item.slot] !== item.u) {
      const eq = document.createElement("button"); eq.className = "btn gold"; eq.textContent = "Equip";
      eq.onclick = () => { S.equip[item.slot] = item.u; save(); render(); done(); };
      a.appendChild(eq);
    }
    if (offerEquip && !item.relic) {
      const s = armedButton("Sell " + sellPrice(item), "sell", () => { sellItem(item); done(); });
      s.setAttribute("aria-label", "Sell " + rarityName(item) + " " + itemName(item) + " for " + sellPrice(item) + " gold");
      a.appendChild(s);
    }
    const ok = document.createElement("button"); ok.className = "btn ghost"; ok.textContent = offerEquip ? "Keep" : "Nice";
    ok.onclick = done; a.appendChild(ok);
  });
}
function toggleGear(it) { S.equip[it.slot] = S.equip[it.slot] === it.u ? null : it.u; save(); render(); }
function sellItem(it) {
  if (S.equip[it.slot] === it.u) { toast("Unequip it first"); return; }
  const g = sellPrice(it);
  S.inv = S.inv.filter((x) => x.u !== it.u);
  S.gold = (S.gold || 0) + g;
  logEvent("Sold " + RARITIES[it.r].name + " " + itemName(it) + " (+" + g + " gold)");
  save(); render(); toast("Sold for " + g + " gold");
}
// Legendary merge: the chosen legendary goes up one + level by using up two other unworn legendaries
// of the same slot, lowest + levels first.
function mergeFodder(it) {
  if (it.r !== LEG) return [];
  return S.inv.filter((x) => x.u !== it.u && x.slot === it.slot && x.r === LEG && S.equip[x.slot] !== x.u).sort((a, b) => (a.p || 0) - (b.p || 0));
}
function mergeItem(it, chosen) {
  const fod = mergeFodder(it).map((x) => x.u);
  const used = (chosen || fod).filter((u) => fod.includes(u)).slice(0, 2);
  if (used.length < 2) return;
  S.inv = S.inv.filter((x) => !used.includes(x.u));
  it.p = (it.p || 0) + 1;
  logEvent("Merged into " + itemName(it));
  save(); render();
  revealItem("MERGE COMPLETE", it, false);
}

/* ================= UI helpers ================= */
function $(s) { return document.querySelector(s); }
let toastT;
function toast(m) { const t = $("#toast"); t.textContent = m; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2200); }
function floatText(ev, txt) {
  const r = ev.currentTarget.getBoundingClientRect();
  const f = document.createElement("div"); f.className = "float"; f.textContent = txt;
  f.style.left = r.left + "px"; f.style.top = r.top - 6 + "px";
  document.body.appendChild(f); setTimeout(() => f.remove(), 1000);
}
/* ================= dungeon ================= */
// Tickets refill on a timer: one every 4 hours, holding up to 6. Each dungeon run spends one.
// S.tk = { n: tickets held, at: when the current 4-hour countdown started }.
function refillTickets() {
  const tk = S.tk || (S.tk = { n: TK_MAX, at: Date.now() }), now = Date.now();
  if (tk.n >= TK_MAX) { tk.n = TK_MAX; tk.at = now; return tk; }
  const gained = Math.floor(Math.max(0, now - tk.at) / TK_EVERY);
  if (gained) { tk.n = Math.min(TK_MAX, tk.n + gained); tk.at = tk.n >= TK_MAX ? now : tk.at + gained * TK_EVERY; }
  return tk;
}
const ticketsLeft = () => (TK_UNLIMITED ? Infinity : refillTickets().n);
function spendTicket() {
  if (TK_UNLIMITED) return true;
  const tk = refillTickets(); if (tk.n < 1) return false;
  if (tk.n >= TK_MAX) tk.at = Date.now(); // the countdown starts once you drop below full
  tk.n--; return true;
}
const nextTicketIn = () => { if (TK_UNLIMITED) return 0; const tk = refillTickets(); return tk.n >= TK_MAX ? 0 : Math.max(0, tk.at + TK_EVERY - Date.now()); };
function addXp(n, reason) {
  const before = levelInfo(S.xp).level;
  S.xp += n; logEvent(reason + " (+" + n + " XP)");
  const after = levelInfo(S.xp).level;
  if (after > before) logEvent("Reached level " + after);
  render();
  if (after > before) levelUp(after);
}
const dungeon = setupDungeon({
  getS: () => S, save: () => save(), render: () => render(), toast: (m) => toast(m), logEvent: (t) => logEvent(t),
  addXp, dayStreak: () => dayStreak(), tickets: ticketsLeft, spendTicket, nextTicketIn, ticketMax: TK_MAX, unlimited: TK_UNLIMITED,
  gearBonus: (fam) => gearBonus(fam || null), wearsRelic: () => SLOTS.some((s) => { const it = invItem(S.equip[s]); return it && it.relic; }), level: () => levelInfo(S.xp).level,
  addGold: (n) => { S.gold = (S.gold || 0) + n; },
  addChest: () => { S.spellChests = (S.spellChests || 0) + 1; },
  earnReward: (n) => earnReward(n), hasReward: (n) => hasReward(n),
  relicBonus: () => relicBonus(), dungeonCount: () => dungeonCount(),
  drawHero: (el, o) => { el.innerHTML = o && o.back ? heroBackSVG(heroParts(heroLook()), o) : heroSVG(heroParts(heroLook()), {}); },
});

/* ================= gear menus ================= */
function slotButton(slot, name, icon, sub, subColour, onClick, badge) {
  const b = document.createElement("button"); b.type = "button"; b.className = "style-btn slot-btn";
  const t = document.createElement("span"); t.className = "slot-name"; t.textContent = name;
  const c = document.createElement("small"); c.textContent = sub; if (subColour) c.style.color = subColour;
  if (badge) { const dot = document.createElement("span"); dot.className = "merge-dot"; dot.textContent = badge; b.appendChild(dot); }
  b.append(icon, t, c); b.onclick = onClick;
  return b;
}
function renderGearSlots() {
  const box = $("#gearSlots"); box.innerHTML = "";
  GEAR_SLOTS.forEach(({ slot, name }) => {
    const mine = S.inv.filter((x) => x.slot === slot);
    const worn = invItem(S.equip[slot]);
    const icon = worn ? gearIcon(slot, worn.r, worn.relic) : Object.assign(document.createElement("div"), { className: "gear-icon empty" });
    const canMerge = mine.some((x) => mergeFodder(x).length >= 2);
    const b = slotButton(slot, name, icon, worn ? rarityName(worn) : mine.length + " owned", worn && rarityColour(worn), () => openGearMenu(slot), canMerge && "Merge");
    b.setAttribute("aria-label", name + ": " + (worn ? rarityName(worn) + " " + itemName(worn) : "nothing equipped") + ", " + mine.length + " owned");
    box.appendChild(b);
  });
  const ck = equippedCharm(), owned = CHARM_OF.filter(hasCharm).length;
  const cicon = document.createElement("div"); cicon.className = "gear-icon" + (ck ? " charm-icon" : " empty"); if (ck) cicon.innerHTML = CHARMS[ck].icon;
  const cb = slotButton("charm", "Charm", cicon, ck ? CHARMS[ck].name : owned + " found", ck ? "#ffcf4a" : null, () => openCharmMenu());
  cb.setAttribute("aria-label", "Charm: " + (ck ? CHARMS[ck].name : "nothing equipped") + ", " + owned + " found");
  box.appendChild(cb);
  const vb = $("#vanitySlots"); if (!vb) return; vb.innerHTML = "";
  const v = S.vanity || {};
  GEAR_SLOTS.forEach(({ slot, name }) => {
    const on = v[slot] != null;
    const icon = v[slot] == null || v[slot] === -1 ? Object.assign(document.createElement("div"), { className: "gear-icon empty" }) : gearIcon(slot, v[slot]);
    const rel = typeof v[slot] === "string";
    const sub = !on ? "Shows gear" : v[slot] === -1 ? "Hidden" : rel ? relicName(slot, v[slot]) : GEAR_NAMES[slot][v[slot]];
    const b = slotButton(slot, name, icon, sub, on && v[slot] !== -1 ? (rel ? RELIC_COLOUR : RARITIES[v[slot]].colour) : null, () => openVanityMenu(slot));
    b.setAttribute("aria-label", name + " look: " + sub);
    vb.appendChild(b);
  });
}
function sheetHead(w, title, close) {
  const head = document.createElement("div"); head.className = "spread";
  const h = document.createElement("h2"); h.textContent = title;
  const x = document.createElement("button"); x.className = "iconbtn"; x.textContent = "Close"; x.onclick = close;
  head.append(h, x); w.appendChild(head);
}
function armedButton(label, cls, onGo) {
  const m = document.createElement("button"); m.className = "btn " + cls; m.textContent = label;
  let armed = false;
  m.onclick = () => {
    if (!armed) { armed = true; m.textContent = "Sure?"; m.classList.add("danger"); setTimeout(() => { armed = false; m.textContent = label; m.classList.remove("danger"); }, 3000); return; }
    onGo();
  };
  return m;
}
function openGearMenu(slot) {
  const info = GEAR_SLOTS.find((x) => x.slot === slot), st = SLOT_STATS[slot];
  openSheet((w, close) => {
    sheetHead(w, info.name, close);
    const note = document.createElement("p"); note.className = "note";
    note.textContent = info.name + " gear adds " + st.label + " in the dungeon. Sell what you don't need for gold. Three legendaries make a Legendary +1." +
      (SET_SLOTS.includes(slot) ? " Celestial set: wear the Celestial Helm, Plate and Greaves, all at +1 or higher, for a chance to dodge any hit (more at higher + levels)." : "");
    w.appendChild(note);
    const list = document.createElement("ul"); list.className = "clist gear-menu";
    const mine = S.inv.filter((x) => x.slot === slot).sort((a, b) => b.r - a.r || (b.p || 0) - (a.p || 0)).concat(testItems(slot).reverse());
    mine.unshift(...relicItems(slot));
    if (!mine.length) {
      const li = document.createElement("li"); li.className = "ch locked";
      li.appendChild(gearIcon(slot, null));
      const mid = document.createElement("div"); mid.innerHTML = '<div class="ch-name">Nothing yet</div><div class="ch-goal">Open chests in the Shop to find some.</div>';
      li.append(mid, document.createElement("span")); list.appendChild(li);
    }
    mine.forEach((it) => {
      const eq = S.equip[slot] === it.u, R = RARITIES[it.r];
      const li = document.createElement("li"); li.className = "ch done" + (eq ? " equipped" : "");
      li.appendChild(gearIcon(slot, it.r, it.relic));
      const mid = document.createElement("div"); mid.style.minWidth = "0";
      const nm = document.createElement("div"); nm.className = "ch-name"; nm.textContent = itemName(it);
      const rt = document.createElement("span"); rt.className = "rarity-tag small"; rt.textContent = rarityName(it); rt.style.background = rarityColour(it);
      const sub = document.createElement("div"); sub.className = "ch-goal"; sub.textContent = itemStatText(it);
      mid.append(nm, rt, sub);
      if (it.test) { const tt = document.createElement("span"); tt.className = "rarity-tag small test-tag"; tt.textContent = "Test"; rt.after(tt); }
      const btns = document.createElement("div"); btns.className = "gear-btns";
      const b = document.createElement("button"); b.className = "btn" + (eq ? " gold" : " ghost");
      b.textContent = eq ? "Unequip" : "Equip"; b.setAttribute("aria-label", (eq ? "Unequip " : "Equip ") + rarityName(it) + " " + itemName(it));
      b.onclick = () => { toggleGear(it); openGearMenu(slot); };
      btns.appendChild(b);
      if (!eq && !it.test && !it.relic) {
        const s = armedButton("Sell " + sellPrice(it), "sell", () => { sellItem(it); openGearMenu(slot); });
        s.setAttribute("aria-label", "Sell " + rarityName(it) + " " + itemName(it) + " for " + sellPrice(it) + " gold");
        btns.appendChild(s);
      }
      if (it.r === LEG && !it.test && !it.relic) {
        const have = Math.min(3, 1 + mergeFodder(it).length);
        const m = document.createElement("button"); m.className = "btn merge";
        m.textContent = "Merge " + have + "/3";
        m.onclick = () => openMergeMenu(it);
        m.setAttribute("aria-label", "Merge: you have " + have + " of the 3 legendary " + info.name.toLowerCase() + " items needed");
        btns.appendChild(m);
      }
      li.append(mid, btns); list.appendChild(li);
    });
    w.appendChild(list);
  });
}
function openCharmMenu() {
  openSheet((w, close) => {
    sheetHead(w, "Charms", close);
    const note = document.createElement("p"); note.className = "note";
    note.textContent = "Clear a dungeon for the first time to earn its charm. You can wear one at a time. Charms don't show on your hero.";
    w.appendChild(note);
    const list = document.createElement("ul"); list.className = "clist gear-menu";
    CHARM_OF.forEach((k, i) => {
      const c = CHARMS[k], own = hasCharm(k), eq = S.equip.charm === k && own;
      const li = document.createElement("li"); li.className = "ch" + (own ? " done" : " locked") + (eq ? " equipped" : "");
      const ic = document.createElement("div"); ic.className = "gear-icon charm-icon"; ic.innerHTML = c.icon; li.appendChild(ic);
      const mid = document.createElement("div"); mid.style.minWidth = "0";
      const nm = document.createElement("div"); nm.className = "ch-name"; nm.textContent = own ? c.name : "???";
      const sub = document.createElement("div"); sub.className = "ch-goal"; sub.textContent = own ? c.desc : "Clear dungeon " + (i + 1) + " to earn it.";
      mid.append(nm, sub);
      const b = document.createElement("button"); b.className = "btn" + (eq ? " gold" : " ghost");
      b.textContent = !own ? "Locked" : eq ? "Unequip" : "Equip"; b.disabled = !own;
      b.onclick = () => { S.equip.charm = eq ? null : k; save(); render(); openCharmMenu(); };
      li.append(mid, b); list.appendChild(li);
    });
    w.appendChild(list);
  });
}
// Merge screen: shows the item being upgraded and lets you pick the two legendaries to use up.
function openMergeMenu(it) {
  const info = GEAR_SLOTS.find((x) => x.slot === it.slot);
  const picked = [];
  openSheet((w, close) => {
    const head = document.createElement("div"); head.className = "spread";
    const h = document.createElement("h2"); h.textContent = "Merge";
    const back = document.createElement("button"); back.className = "iconbtn"; back.textContent = "Back";
    back.onclick = () => openGearMenu(it.slot);
    head.append(h, back); w.appendChild(head);
    // the item being upgraded, now and after
    const top = document.createElement("div"); top.className = "merge-top";
    const icon = gearIcon(it.slot, it.r, it.relic); icon.classList.add("merge-icon");
    const txt = document.createElement("div"); txt.style.minWidth = "0";
    const nm = document.createElement("div"); nm.className = "ch-name"; nm.textContent = itemName(it);
    const arrow = document.createElement("div"); arrow.className = "merge-after";
    arrow.innerHTML = '<span class="num"></span><span class="merge-arrow">→</span><b class="num"></b>';
    arrow.children[0].textContent = statText(it.slot, it.r, it.p);
    arrow.children[2].textContent = GEAR_NAMES[it.slot][it.r] + " +" + ((it.p || 0) + 1) + ": " + statText(it.slot, it.r, (it.p || 0) + 1);
    txt.append(nm, arrow); top.append(icon, txt); w.appendChild(top);
    const pool = mergeFodder(it);
    const note = document.createElement("p"); note.className = "note";
    note.textContent = pool.length >= 2
      ? "Pick 2 other legendary " + info.name.toLowerCase() + " items to merge in. They'll be used up."
      : "You need 2 more legendary " + info.name.toLowerCase() + " items to merge. Find them in chests. Items you're wearing can't be merged in.";
    w.appendChild(note);
    const list = document.createElement("ul"); list.className = "clist gear-menu";
    const go = document.createElement("button"); go.className = "btn merge big"; go.style.width = "100%"; go.style.marginTop = "12px";
    const refresh = () => {
      go.textContent = picked.length === 2 ? "Merge into " + GEAR_NAMES[it.slot][it.r] + " +" + ((it.p || 0) + 1) : "Merge (" + (1 + picked.length) + "/3)";
      go.disabled = picked.length !== 2;
      [...list.children].forEach((li) => {
        const u = li.dataset.u, on = picked.includes(u), b = li.querySelector("button");
        li.classList.toggle("equipped", on);
        b.textContent = on ? "Selected" : "Select"; b.className = "btn" + (on ? " gold" : " ghost");
        b.disabled = !on && picked.length >= 2;
        b.setAttribute("aria-pressed", String(on));
      });
    };
    pool.forEach((x) => {
      const li = document.createElement("li"); li.className = "ch done"; li.dataset.u = x.u;
      li.appendChild(gearIcon(x.slot, x.r, x.relic));
      const mid = document.createElement("div"); mid.style.minWidth = "0";
      const n2 = document.createElement("div"); n2.className = "ch-name"; n2.textContent = itemName(x);
      const rt = document.createElement("span"); rt.className = "rarity-tag small"; rt.textContent = rarityName(x); rt.style.background = RARITIES[x.r].colour;
      const sub = document.createElement("div"); sub.className = "ch-goal"; sub.textContent = statText(x.slot, x.r, x.p);
      mid.append(n2, rt, sub);
      const b = document.createElement("button");
      b.onclick = () => { const i = picked.indexOf(x.u); if (i >= 0) picked.splice(i, 1); else if (picked.length < 2) picked.push(x.u); refresh(); };
      li.append(mid, b); list.appendChild(li);
    });
    go.onclick = () => { if (picked.length !== 2) return; close(); mergeItem(it, picked.slice()); };
    w.append(list, go);
    refresh();
  });
}
// Vanity: pick a look for each slot that shows over your gear. It never changes stats.
function openVanityMenu(slot) {
  const info = GEAR_SLOTS.find((x) => x.slot === slot);
  openSheet((w, close) => {
    sheetHead(w, info.name + " look", close);
    const note = document.createElement("p"); note.className = "note";
    note.textContent = "Choose how your " + info.name.toLowerCase() + " looks. Your stats always come from the gear you have equipped.";
    w.appendChild(note);
    const list = document.createElement("ul"); list.className = "clist gear-menu";
    const cur = (S.vanity || {})[slot], seen = GEAR_TEST ? [0, 1, 2, 3, 4] : (S.seen || {})[slot] || [];
    const pick = (val) => { S.vanity = S.vanity || {}; if (val == null) delete S.vanity[slot]; else S.vanity[slot] = val; save(); render(); openVanityMenu(slot); };
    const row = (icon, name, sub, val, locked, colour) => {
      const on = val === cur || (val == null && cur == null);
      const li = document.createElement("li"); li.className = "ch" + (locked ? " locked" : " done") + (on ? " equipped" : "");
      li.appendChild(icon);
      const mid = document.createElement("div"); mid.style.minWidth = "0";
      const nm = document.createElement("div"); nm.className = "ch-name"; nm.textContent = name;
      const s2 = document.createElement("div"); s2.className = "ch-goal"; s2.textContent = sub; if (colour) s2.style.color = colour;
      mid.append(nm, s2);
      const b = document.createElement("button"); b.className = "btn" + (on ? " gold" : " ghost");
      b.textContent = locked ? "Locked" : on ? "Showing" : "Show"; b.disabled = locked || on;
      b.onclick = () => pick(val);
      li.append(mid, b); list.appendChild(li);
    };
    row(Object.assign(document.createElement("div"), { className: "gear-icon empty" }), "My gear", "Show whatever is equipped", null, false);
    row(Object.assign(document.createElement("div"), { className: "gear-icon empty" }), "Hidden", "Show nothing in this slot", -1, false);
    RARITIES.forEach((R, r) => {
      const own = seen.includes(r);
      row(gearIcon(slot, own ? r : null), own ? GEAR_NAMES[slot][r] : "???", own ? R.name + " look" : "Find a " + R.name.toLowerCase() + " " + info.name.toLowerCase() + " to unlock", r, !own, own ? R.colour : null);
    });
    // relic set looks, once you've earned them
    if (RELIC_ORDER.includes(slot)) CHARM_OF.forEach((fam) => {
      const own = hasRelic(slot, fam);
      row(gearIcon(slot, null, own ? fam : null), own ? relicName(slot, fam) : "???", own ? "Relic look" : "Earn it in a prestige dungeon", fam, !own, own ? RELIC_COLOUR : null);
    });
    w.appendChild(list);
  });
}

function openSheet(build) {
  const sh = $("#sheet"); sh.innerHTML = "";
  const w = document.createElement("div"); w.className = "win"; sh.appendChild(w);
  const close = () => (sh.hidden = true);
  build(w, close); sh.hidden = false;
  sh.onclick = (e) => { if (e.target === sh) close(); };
  const f = w.querySelector("input"); if (f) f.focus();
}
function segment(container, opts, value, onPick) {
  container.innerHTML = "";
  Object.entries(opts).forEach(([k, o]) => {
    const b = document.createElement("button"); b.type = "button"; b.textContent = o.label; if (o.cls) b.className = o.cls;
    b.setAttribute("aria-pressed", String(k === value));
    b.onclick = () => { [...container.children].forEach((c) => c.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", "true"); onPick(k); };
    container.appendChild(b);
  });
}
function armedDelete(btn, onConfirm) {
  let armed = false;
  btn.onclick = () => { if (!armed) { armed = true; btn.textContent = "Sure?"; btn.className = "btn danger"; return; } onConfirm(); };
}
function questForm(q) {
  const isNew = !q; q = q || { id: uid(), name: "", desc: "", core: false };
  openSheet((w, close) => {
    w.innerHTML = "<h2>" + (isNew ? "New quest" : "Edit quest") + '</h2><label for="qn">Quest<input id="qn" maxlength="60" placeholder="e.g. Stretch for 5 minutes" autocomplete="off"></label><label for="qdesc">Details (optional)<input id="qdesc" maxlength="80" placeholder="e.g. Before bed" autocomplete="off"></label><p class="note"></p><div class="actions"></div>';
    w.querySelector("#qn").value = q.name; w.querySelector("#qdesc").value = q.desc || "";
    w.querySelector("p.note").textContent = "Every quest is worth " + QUEST_XP + " XP.";
    const a = w.querySelector(".actions");
    if (!isNew) {
      const del = document.createElement("button"); del.className = "btn ghost"; del.textContent = "Delete";
      armedDelete(del, () => { S.quests = S.quests.filter((x) => x.id !== q.id); save(); render(); close(); toast("Quest removed"); });
      a.appendChild(del);
    }
    const cancel = document.createElement("button"); cancel.className = "btn ghost"; cancel.textContent = "Cancel"; cancel.onclick = close; a.appendChild(cancel);
    const ok = document.createElement("button"); ok.className = "btn gold"; ok.textContent = isNew ? "Add quest" : "Save";
    ok.onclick = () => {
      const n = w.querySelector("#qn").value.trim(); if (!n) { w.querySelector("#qn").focus(); return; }
      Object.assign(q, { name: n, desc: w.querySelector("#qdesc").value.trim() });
      if (isNew) S.quests.push(q);
      save(); render(); close(); toast(isNew ? "Quest added" : "Quest saved");
    };
    a.appendChild(ok);
  });
}

/* ================= streak badge ================= */
let flameDrawn = false;
function renderStreak() {
  if (!flameDrawn) { $("#flame").innerHTML = flameSVG(); flameDrawn = true; }
  const n = dayStreak(), doneToday = Object.keys(S.days[today()] || {}).length > 0;
  const badge = $("#streakBadge"), num = $("#streakNum");
  num.textContent = n; num.classList.toggle("long", n > 99);
  badge.classList.toggle("out", n === 0);
  badge.classList.toggle("waiting", n > 0 && !doneToday);
  const label = n + "-day streak" + (n > 0 && !doneToday ? ". Complete a quest today to keep it going" : "");
  badge.setAttribute("aria-label", label); badge.title = label;
}

/* ================= appearance ================= */
function setLook(change) { S.look = { ...normLook(S.look), ...change }; save(); render(); }
function swatches(container, options, current, onPick, labels) {
  container.innerHTML = "";
  Object.entries(options).forEach(([k, colour], i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "sw";
    b.style.background = colour; b.setAttribute("aria-pressed", String(k === current));
    b.setAttribute("aria-label", labels ? labels[i] : k);
    b.onclick = () => onPick(k); container.appendChild(b);
  });
}
function renderAppearance() {
  const lk = normLook(S.look);
  drawSprite($("#lookPreview"), null, { ...lookIds(), ...lk });
  segment($("#lookSeg"), { m: { label: "Male" }, f: { label: "Female" } }, lk.body, (k) => setLook({ body: k }));
  const st = $("#hairStyles"); st.innerHTML = "";
  Object.entries(HAIRSTYLES).forEach(([k, h]) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "style-btn"; b.setAttribute("aria-pressed", String(k === lk.hair));
    const c = document.createElement("div"); c.className = "style-head"; drawSprite(c, null, { ...lk, hair: k }, { head: true });
    const t = document.createElement("span"); t.textContent = h.name;
    b.append(c, t); b.onclick = () => setLook({ hair: k }); st.appendChild(b);
  });
  swatches($("#hairColours"), HAIR_COLOURS, lk.hc, (k) => setLook({ hc: k }), ["Brown", "Black", "Blonde", "Ginger", "Silver", "Pink", "Blue"]);
  swatches($("#skinTones"), SKIN_TONES, lk.skin, (k) => setLook({ skin: k }), ["Skin tone 1", "Skin tone 2", "Skin tone 3", "Skin tone 4", "Skin tone 5", "Skin tone 6"]);
}

/* ================= render ================= */
function render() {
  if (!S) return;
  const L = levelInfo(S.xp);
  const titles = unlockedTitles(); if (!titles.includes(S.title)) S.title = titles[titles.length - 1] || "Novice";
  $("#lvl").textContent = "LV " + L.level;
  $("#prest").hidden = !S.prestige; $("#prest").textContent = "★ " + (S.prestige || 0);
  $("#prest").setAttribute("aria-label", "Prestige " + (S.prestige || 0));
  const pb = $("#prestigeBox"); pb.hidden = !canPrestige();
  if (!pb.hidden) pb.querySelector("p").textContent = "You've conquered the " + ALL_DUNGEONS[4 + (S.prestige || 0)].name + ". Prestige to start again and unlock the " + ALL_DUNGEONS[5 + (S.prestige || 0)].name + ".";
  $("#htitle").textContent = S.title;
  $("#hname").textContent = S.name;
  $("#xpbar i").style.width = (L.into / L.need) * 100 + "%";
  $("#xpbar").setAttribute("aria-valuenow", L.into); $("#xpbar").setAttribute("aria-valuemax", L.need);
  $("#xptext").textContent = L.into + " / " + L.need + " XP to LV " + (L.level + 1);
  $("#goldTop").textContent = GOLD_UNLIMITED ? "∞" : S.gold;
  // shop
  $("#shopGold").textContent = GOLD_UNLIMITED ? "∞" : S.gold;
  $("#buyChest").classList.toggle("short", !GOLD_UNLIMITED && S.gold < CHEST_PRICE);
  const sc = S.spellChests || 0;
  $("#chestCount").textContent = sc + (sc === 1 ? " spell chest" : " spell chests");
  $("#openSpellChest").disabled = sc < 1;
  $("#openSpellChest").textContent = sc ? "Open a spell chest" : "No spell chests to open";
  $("#openChest").hidden = S.chests < 1;
  $("#openChest").textContent = "Open a gear chest (" + S.chests + ")";
  $("#shopDot").hidden = sc + S.chests < 1;
  // short status lines under the main menu buttons
  { const doneN = S.quests.filter((q) => (S.days[today()] || {})[q.id]).length;
    $("#questsSub").textContent = doneN + " / " + S.quests.length + " done today";
    $("#heroSub").textContent = "Gear, spells, looks";
    $("#dungeonSub").textContent = canPrestige() ? "Prestige ready!" : TK_UNLIMITED ? "Unlimited tickets" : ticketsLeft() + " tickets";
    const nc = S.chests + (S.spellChests || 0);
    $("#shopSub").textContent = nc ? nc + (nc === 1 ? " chest to open" : " chests to open") : "Chests";
    $("#guildSub").textContent = "Friends and chat";
    $("#logSub").textContent = "Your history"; }
  const rl = $("#rarityList"); rl.innerHTML = "";
  RARITIES.forEach((R, i) => {
    const li = document.createElement("li");
    li.innerHTML = '<span class="rarity-tag"></span><span></span><span class="muted num"></span>';
    li.children[0].textContent = R.name; li.children[0].style.background = R.colour;
    li.children[1].textContent = R.drop + "% of chests";
    li.children[2].textContent = "Sells for " + R.sell;
    rl.appendChild(li);
  });
  renderStreak();
  $("#tkTop").textContent = TK_UNLIMITED ? "∞" : ticketsLeft();
  dungeon.renderTab();
  dungeon.resume();
  drawSprite($("#sprite"), null, heroLook());
  if (celestialLevel()) ["l", "r"].forEach((side) => {
    const h = document.createElement("div"); h.className = "holo " + side; h.innerHTML = heroSVG(heroParts(heroLook()), {});
    $("#sprite").prepend(h);
  });

  // quests
  $("#today").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
  const done = doneToday(); const ql = $("#qlist"); ql.innerHTML = "";
  if (!S.quests.length) ql.innerHTML = '<li class="muted" style="padding:10px 2px">No quests yet. Add a daily habit to start earning XP.</li>';
  S.quests.forEach((q) => {
    const li = document.createElement("li"); li.className = "q" + (done[q.id] ? " done" : "");
    const st = questStreak(q.id);
    li.innerHTML = '<button class="check"></button><div class="qmain"><div class="qname"></div><div class="qdesc"></div><div class="qmeta"><span class="num">' + QUEST_XP + " XP</span>" + (st > 1 ? '<span class="flame num">' + st + "d streak</span>" : "") + '</div></div><button class="iconbtn">Edit</button>';
    li.querySelector(".qname").textContent = q.name;
    const qd = li.querySelector(".qdesc"); if (q.desc) qd.textContent = q.desc; else qd.remove();
    const chk = li.querySelector(".check");
    chk.textContent = done[q.id] ? "✓" : "";
    chk.setAttribute("aria-label", (done[q.id] ? "Undo " : "Complete ") + q.name);
    chk.setAttribute("aria-pressed", String(!!done[q.id]));
    chk.onclick = (e) => toggleQuest(q, e);
    const ed = li.querySelector(".iconbtn");
    if (q.core) ed.remove();
    else { ed.setAttribute("aria-label", "Edit " + q.name); ed.onclick = () => questForm(q); }
    ql.appendChild(li);
  });
  const n = S.quests.filter((q) => done[q.id]).length;
  $("#clearmsg").textContent = S.clears[today()] ? "★ Full clear today" : S.quests.length ? n + " of " + S.quests.length + " done · clear all for +" + CLEAR_XP + " bonus XP" : "";
  const extras = S.quests.filter((q) => !q.core).length;
  const addBtn = $("#addq");
  addBtn.hidden = extras >= MAX_EXTRA_QUESTS;
  addBtn.textContent = "+ Add your own quest (" + extras + "/" + MAX_EXTRA_QUESTS + ")";

  // what your level gives you in the dungeon
  const LS = levelStats(L.level);
  $("#heroDot").hidden = true;
  $("#lvlStatsLv").textContent = "LV " + L.level;
  $("#lvlStats").innerHTML = "";
  [["Max HP", LS.hp, LEVEL_GAIN.hp], ["Attack", LS.atk, LEVEL_GAIN.atk], ["Spell power", L.level - 1, 1]].forEach(([n, v, g]) => {
    const el = document.createElement("div"); el.innerHTML = '<b class="num"></b><span></span><small class="num"></small>';
    el.children[0].textContent = n === "Spell power" ? "+" + v : v; el.children[1].textContent = n; el.children[2].textContent = "+" + g + " next level";
    $("#lvlStats").appendChild(el);
  });

  // titles
  const tg = $("#titles"); tg.innerHTML = "";
  TITLES.map((t) => ({ t: t.t, req: "Reach level " + t.lv })).concat(STREAK_TITLES.map((t) => ({ t: t.t, req: t.d + "-day streak" }))).forEach((t) => {
    const own = titles.includes(t.t), worn = S.title === t.t;
    const el = document.createElement("div"); el.className = "item" + (own ? "" : " locked") + (worn ? " equipped" : "");
    const h = document.createElement("span"); h.className = "px"; h.textContent = t.t;
    const p = document.createElement("p"); p.textContent = t.req;
    const b = document.createElement("button"); b.className = "btn" + (worn ? " gold" : " ghost");
    b.textContent = own ? (worn ? "Worn" : "Wear") : "Locked"; b.disabled = !own;
    b.onclick = () => { S.title = t.t; save(); render(); };
    el.append(h, p, b); tg.appendChild(el);
  });
  if (document.activeElement !== $("#nameIn")) $("#nameIn").value = S.name;
  renderAppearance();
  renderGearSlots();
  renderSpells();
  const uname = usernameOf(me);
  $("#acct").textContent = me ? "Signed in as " + (uname || me.email || me.displayName || "Google user") + ". Your progress syncs to every device you sign in on." : "";
  $("#linkForm").hidden = !me || !!uname;



  // log
  const hm = $("#heat"); hm.innerHTML = ""; const now = new Date();
  for (let i = 27; i >= 0; i--) {
    const d = new Date(now); d.setDate(now.getDate() - i); const k = dkey(d);
    const c = Object.keys(S.days[k] || {}).length, f = c / Math.max(1, S.quests.length);
    const cell = document.createElement("div"); if (i === 0) cell.classList.add("today");
    if (c) cell.style.background = S.clears[k] ? "var(--xp)" : f >= 0.5 ? "#3fa46a" : "#2a6b47";
    cell.title = d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) + ": " + c + " quests";
    hm.appendChild(cell);
  }
  const ev = $("#events"); ev.innerHTML = "";
  if (!S.log.length) ev.innerHTML = '<li class="muted">Your deeds will be recorded here.</li>';
  S.log.slice(0, 25).forEach((e) => {
    const li = document.createElement("li"); const a = document.createElement("span"); a.textContent = e.text;
    const b = document.createElement("span"); b.className = "muted num"; b.textContent = new Date(e.t).toLocaleDateString(undefined, { day: "numeric", month: "short" });
    li.append(a, b); ev.appendChild(li);
  });
}

function renderGuild(profiles) {
  const hadAvatars = Object.keys(guildProfiles).length;
  profiles.forEach((p) => { guildProfiles[p.id] = p; });
  if (!hadAvatars && chatMsgs.length) renderChat(chatMsgs);
  const gl = $("#glist"); gl.innerHTML = "";
  if (!profiles.length) { gl.innerHTML = '<li class="muted">No heroes yet. Copy the invite link and send it to your friends.</li>'; return; }
  const prestOf = (p) => (p.equip && p.equip.prest) || 0;
  profiles = profiles.slice().sort((a, b) => prestOf(b) - prestOf(a) || (b.xp || 0) - (a.xp || 0));
  profiles.forEach((p, i) => {
    const li = document.createElement("li"); li.className = "g" + (me && p.id === me.uid ? " me" : "");
    const rank = document.createElement("span"); rank.className = "rank"; rank.textContent = i + 1;
    const c = document.createElement("div"); c.className = "g-av"; drawSprite(c, null, p.equip, { head: true });
    const who = document.createElement("div"); who.className = "who";
    const b = document.createElement("b"); b.textContent = (p.name || "Adventurer") + (me && p.id === me.uid ? " (you)" : "");
    const s = document.createElement("span"); s.textContent = p.title || "Novice";
    who.append(b, s);
    const lv = document.createElement("div"); lv.className = "lv num"; lv.textContent = (prestOf(p) ? "★" + prestOf(p) + " " : "") + "LV " + (p.level || 1);
    if (p.streak) { const sm = document.createElement("small"); sm.textContent = p.streak + "-day streak"; lv.appendChild(sm); }
    li.append(rank, c, who, lv); gl.appendChild(li);
  });
}

/* ================= guild chat ================= */
let chatCol = null, chatMsgs = [], chatFirst = true;
const guildProfiles = {};
const seenKey = () => "questlog-chatseen:" + (me ? me.uid : "");
const msgTime = (m) => (m.at && m.at.toMillis ? m.at.toMillis() : Date.now());
function fmtChatTime(ms) {
  const d = new Date(ms), now = new Date();
  const t = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
  if (dkey(d) === dkey(now)) return t;
  const y = new Date(now); y.setDate(now.getDate() - 1);
  if (dkey(d) === dkey(y)) return "Yesterday " + t;
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" }) + " " + t;
}
function renderChat(msgs) {
  chatMsgs = msgs;
  const box = $("#chatlog");
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  box.innerHTML = "";
  if (!msgs.length) {
    const p = document.createElement("p"); p.className = "muted chat-empty";
    p.textContent = "No messages yet. Say hello to your guild!";
    box.appendChild(p);
  }
  let prev = null;
  msgs.forEach((m) => {
    const mine = me && m.uid === me.uid;
    const cont = prev && prev.uid === m.uid && msgTime(m) - msgTime(prev) < 5 * 60e3;
    const row = document.createElement("div");
    row.className = "msg" + (mine ? " mine" : "") + (cont ? " cont" : "");
    if (!mine) {
      const c = document.createElement("div"); c.className = "msg-av";
      const p = guildProfiles[m.uid];
      if (!cont) drawSprite(c, null, p ? p.equip : {}, { head: true });
      row.appendChild(c);
    }
    const bubble = document.createElement("div"); bubble.className = "bubble";
    if (!cont) {
      const who = document.createElement("div"); who.className = "who";
      const nm = document.createElement("span"); nm.textContent = mine ? "You" : (m.name || "Adventurer");
      const tm = document.createElement("time"); tm.textContent = fmtChatTime(msgTime(m));
      who.append(nm, tm); bubble.appendChild(who);
    }
    const text = document.createElement("div"); text.className = "text"; text.textContent = m.text;
    bubble.appendChild(text);
    if (mine) {
      const del = document.createElement("button"); del.className = "msg-del"; del.type = "button"; del.textContent = "Delete";
      let armed = false;
      del.onclick = async () => {
        if (!armed) { armed = true; del.textContent = "Tap again to delete"; setTimeout(() => { armed = false; del.textContent = "Delete"; }, 3000); return; }
        try { await fb.deleteDoc(fb.doc(chatCol, m.id)); } catch (e) { toast("Couldn't delete that message"); }
      };
      bubble.appendChild(del);
    }
    row.appendChild(bubble); box.appendChild(row);
    prev = m;
  });
  if (chatFirst || nearBottom || (msgs.length && me && msgs[msgs.length - 1].uid === me.uid)) box.scrollTop = box.scrollHeight;
  chatFirst = false;
  updateUnread();
}
function updateUnread() {
  const dot = $("#guildDot");
  const others = chatMsgs.filter((m) => !me || m.uid !== me.uid);
  const newest = others.length ? msgTime(others[others.length - 1]) : 0;
  let seen = 0; try { seen = +localStorage.getItem(seenKey()) || 0; } catch (e) {}
  const viewing = !$("#p-guild").hidden && !document.hidden;
  if (viewing && newest > seen) { try { localStorage.setItem(seenKey(), String(newest)); } catch (e) {} seen = newest; }
  dot.hidden = !(newest > seen);
}
document.addEventListener("visibilitychange", () => { if (!document.hidden) updateUnread(); });
$("#chatForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const inp = $("#chatIn"), text = inp.value.trim();
  if (!text) return;
  if (!chatCol || !fb || !me || !S) { toast("Chat is still connecting"); return; }
  inp.value = "";
  try {
    await fb.addDoc(chatCol, { uid: me.uid, name: S.name.slice(0, 24), text: text.slice(0, 500), at: fb.serverTimestamp() });
  } catch (err) {
    console.error(err);
    if (!inp.value) inp.value = text;
    toast(err.code === "permission-denied" ? "Chat isn't switched on yet. The Firebase rules need updating." : "Message not sent. Check your connection.");
  }
});

/* ================= navigation ================= */
// The main menu shows the hero with a button for each screen; each screen has a Back button.
const TABS = ["quests", "hero", "dungeon", "shop", "guild", "log"];
const TAB_TITLES = { quests: "Quests", hero: "Hero", dungeon: "Dungeon", shop: "Shop", guild: "Guild", log: "Log" };
let curTab = null;
function showTab(t, fromHistory) {
  if (!TABS.includes(t)) t = null;
  curTab = t;
  $("#home").hidden = !!t;
  $("#screenHead").hidden = !t;
  if (t) $("#screenTitle").textContent = TAB_TITLES[t];
  TABS.forEach((p) => ($("#p-" + p).hidden = p !== t));
  if (!fromHistory) {
    if (t) history.pushState({ tab: t }, "", "#" + t);
    else history.replaceState(null, "", location.pathname + location.search);
  }
  window.scrollTo(0, 0);
  if (t === "guild") { const box = $("#chatlog"); box.scrollTop = box.scrollHeight; updateUnread(); }
}
document.querySelectorAll(".menu-btn").forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
$("#backBtn").onclick = () => { if (history.state && history.state.tab) history.back(); else showTab(null); };
window.addEventListener("popstate", () => showTab(location.hash.slice(1), true));
$("#addq").onclick = () => questForm(null);
$("#buyChest").onclick = () => buyChest();
$("#prestigeBtn").onclick = () => openPrestige();
$("#openChest").onclick = () => openChest(false);
$("#openSpellChest").onclick = () => openSpellChest();
$("#nameIn").addEventListener("input", (e) => { S.name = e.target.value.trim() || "Adventurer"; $("#hname").textContent = S.name; save(); });
let resetArmed = false;
$("#resetBtn").onclick = () => {
  const b = $("#resetBtn");
  if (!resetArmed) {
    resetArmed = true; b.textContent = "Tap again to erase all progress"; b.className = "btn danger";
    setTimeout(() => { resetArmed = false; b.textContent = "Start a new save"; b.className = "btn ghost"; }, 4000);
    return;
  }
  const look = S.look; S = freshState(S.name); S.look = look; save(); render(); resetArmed = false; b.textContent = "Start a new save"; b.className = "btn ghost"; toast("New save started");
};
$("#invite").onclick = async () => {
  const link = location.origin + location.pathname;
  try { await navigator.clipboard.writeText(link); toast("Invite link copied"); }
  catch (e) { toast(link); }
};
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { $("#sheet").hidden = true; if (!$("#lvlup").hidden) nextModal(); } });
let lastDay = today();
let lastTk = null;
const rollover = () => {
  if (today() !== lastDay) { lastDay = today(); render(); return; }
  // keep the ticket count and countdown fresh while the app is open
  if (!S) return;
  const n = ticketsLeft();
  if (n !== lastTk) { lastTk = n; save(); }
  $("#tkTop").textContent = TK_UNLIMITED ? "∞" : n; dungeon.renderTab();

};
setInterval(rollover, 60000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) rollover(); });

// install prompt
let deferredInstall = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstall = e; $("#installBtn").hidden = false; });
$("#installBtn").onclick = async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $("#installBtn").hidden = true; };
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
if (isIOS && !isStandalone) $("#iosHint").hidden = false;

/* ================= Firebase ================= */
drawSprite($("#titleSprite"), null, { hand: "sword", off: "shield", back: "cape" });
const titleStatus = $("#titleStatus"), titleErr = $("#titleErr"), signinBtn = $("#authSubmit");
// Usernames are stored as hidden emails so Firebase's email + password sign-in can be used.
const USER_DOMAIN = "@questlog.player";
const cleanUsername = (u) => u.trim().toLowerCase();
const validUsername = (u) => /^[a-z0-9_]{3,20}$/.test(u);
const usernameOf = (user) => user && user.email && user.email.endsWith(USER_DOMAIN) ? user.email.slice(0, -USER_DOMAIN.length) : null;
let authMode = "signin";
function setAuthMode(m) {
  authMode = m;
  document.querySelectorAll("#authTabs button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
  $("#authPass2Row").hidden = m !== "create";
  $("#authHint").hidden = m !== "create";
  $("#authPass").autocomplete = m === "create" ? "new-password" : "current-password";
  signinBtn.textContent = m === "create" ? "Create account" : "Sign in";
  titleErr.hidden = true;
}
document.querySelectorAll("#authTabs button").forEach((b) => (b.onclick = () => setAuthMode(b.dataset.mode)));
function showError(msg) { titleErr.textContent = msg; titleErr.hidden = false; }

if (!firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith("PASTE")) {
  titleStatus.hidden = true;
  showError("Firebase isn't set up yet. Paste your project's config into firebase-config.js (see README.md).");
} else {
  startFirebase().catch((e) => {
    console.error(e);
    titleStatus.hidden = true;
    showError("Couldn't reach Google to sign you in. Check your connection and reload.");
  });
}

async function startFirebase() {
  const [
    { initializeApp },
    { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut,
      signInWithEmailAndPassword, createUserWithEmailAndPassword, EmailAuthProvider, linkWithCredential },
    { initializeFirestore, persistentLocalCache, persistentMultipleTabManager, doc, setDoc, addDoc, deleteDoc, onSnapshot, collection, query, orderBy, limit, serverTimestamp },
  ] = await Promise.all([import(SDK + "firebase-app.js"), import(SDK + "firebase-auth.js"), import(SDK + "firebase-firestore.js")]);
  fb = { setDoc, addDoc, deleteDoc, doc, serverTimestamp };
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
    ignoreUndefinedProperties: true,
  });
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  getRedirectResult(auth).catch((e) => showError(friendlyAuthError(e)));

  $("#authForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    titleErr.hidden = true;
    const name = cleanUsername($("#authUser").value), pw = $("#authPass").value;
    if (!validUsername(name)) { showError("Usernames are 3 to 20 letters, numbers or underscores, with no spaces."); return; }
    if (pw.length < 6) { showError("Passwords need at least 6 characters."); return; }
    if (authMode === "create" && pw !== $("#authPass2").value) { showError("The two passwords don't match."); return; }
    signinBtn.disabled = true;
    try {
      if (authMode === "create") { pendingName = $("#authUser").value.trim(); await createUserWithEmailAndPassword(auth, name + USER_DOMAIN, pw); }
      else await signInWithEmailAndPassword(auth, name + USER_DOMAIN, pw);
    } catch (err) {
      signinBtn.disabled = false;
      showError(friendlyAuthError(err));
    }
  });
  // Older accounts made with Google can still sign in, then add a username in Hero → Account.
  const gBtn = $("#googleSignin");
  if (gBtn) gBtn.onclick = async () => {
    titleErr.hidden = true;
    // Pop-up first everywhere (most reliable on GitHub Pages, including the iPhone home-screen app);
    // fall back to a full-page redirect only if the pop-up can't open.
    try {
      await signInWithPopup(auth, provider);
    } catch (e) {
      if (["auth/popup-blocked", "auth/operation-not-supported-in-environment", "auth/cancelled-popup-request"].includes(e.code)) {
        await signInWithRedirect(auth, provider);
      } else if (e.code !== "auth/popup-closed-by-user") {
        showError(friendlyAuthError(e));
      }
    }
  };
  $("#signout").onclick = async () => { await pushToCloud(); await signOut(auth); };
  $("#linkForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const note = $("#linkNote"), name = cleanUsername($("#linkUser").value), pw = $("#linkPass").value;
    const say = (t) => { note.textContent = t; note.hidden = false; };
    if (!validUsername(name)) { say("Usernames are 3 to 20 letters, numbers or underscores, with no spaces."); return; }
    if (pw.length < 6) { say("Passwords need at least 6 characters."); return; }
    try {
      await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(name + USER_DOMAIN, pw));
      await auth.currentUser.reload(); me = auth.currentUser;
      toast("Username set. Sign in with " + name + " from now on");
      render();
    } catch (err) { say(friendlyAuthError(err)); }
  });

  onAuthStateChanged(auth, (user) => {
    unsubs.forEach((u) => u()); unsubs = [];
    me = user;
    if (!user) {
      S = null; userRef = profileRef = null; chatCol = null; chatMsgs = [];
      $("#chatlog").innerHTML = ""; $("#guildDot").hidden = true;
      $("#screen-game").hidden = true; $("#screen-title").hidden = false;
      titleStatus.hidden = true; signinBtn.disabled = false;
      return;
    }
    titleStatus.textContent = "LOADING YOUR SAVE…"; titleStatus.hidden = false; signinBtn.disabled = true;
    userRef = doc(db, "users", user.uid);
    profileRef = doc(db, "profiles", user.uid);

    // instant start from this device's copy
    try { const raw = localStorage.getItem(localKey()); if (raw) { const s = JSON.parse(raw); if (s && s.v === 1) { S = migrate(s); enterGame(); } } } catch (e) {}

    unsubs.push(onSnapshot(userRef, { includeMetadataChanges: false }, (snap) => {
      if (snap.metadata.hasPendingWrites) return;
      if (snap.exists()) {
        let remote = null; try { remote = JSON.parse(snap.data().save); } catch (e) {}
        if (remote && remote.v === 1 && (!S || (remote.at || 0) > (S.at || 0))) {
          S = migrate(remote); try { localStorage.setItem(localKey(), JSON.stringify(S)); } catch (e) {}
          enterGame(); setSync("Saved to the cloud");
        } else if (S && (S.at || 0) > (snap.data().at || 0)) {
          pushToCloud();
        }
      } else if (!snap.metadata.fromCache) {
        if (!S) S = freshState(pendingName || usernameOf(user) || (user.displayName || "").split(" ")[0] || "Adventurer");
        enterGame(); save();
      }
    }, (e) => { console.error(e); showError("Couldn't load your save: " + (e.code || e.message)); }));

    unsubs.push(onSnapshot(query(collection(db, "profiles"), orderBy("xp", "desc"), limit(50)), (qs) => {
      renderGuild(qs.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, (e) => console.error(e)));

    chatCol = collection(db, "messages");
    chatFirst = true;
    unsubs.push(onSnapshot(query(chatCol, orderBy("at", "desc"), limit(80)), (qs) => {
      $("#chatNote").hidden = true;
      renderChat(qs.docs.map((d) => ({ id: d.id, ...d.data({ serverTimestamps: "estimate" }) })).reverse());
    }, (e) => {
      console.error(e);
      const n = $("#chatNote");
      n.textContent = e.code === "permission-denied"
        ? "Chat isn't switched on yet. The Firebase rules need updating to allow messages."
        : "Couldn't load the chat: " + (e.code || e.message);
      n.hidden = false;
    }));
  });
}

let entered = false;
function enterGame() {
  $("#screen-title").hidden = true; $("#screen-game").hidden = false;
  render();
  if (!entered) {
    entered = true;
    const h = location.hash.slice(1); showTab(TABS.includes(h) ? h : null, true);
  }
}

let pendingName = "";
function friendlyAuthError(e) {
  const map = {
    "auth/email-already-in-use": "That username is taken. Try another one.",
    "auth/invalid-credential": "Wrong username or password.",
    "auth/wrong-password": "Wrong username or password.",
    "auth/user-not-found": "Wrong username or password.",
    "auth/invalid-email": "Usernames are 3 to 20 letters, numbers or underscores, with no spaces.",
    "auth/weak-password": "Passwords need at least 6 characters.",
    "auth/too-many-requests": "Too many tries. Wait a minute and try again.",
    "auth/credential-already-in-use": "That username is taken. Try another one.",
    "auth/provider-already-linked": "This account already has a username.",
    "auth/unauthorized-domain": "This web address isn't allowed to sign in yet. Add it under Firebase → Authentication → Settings → Authorized domains.",
    "auth/network-request-failed": "No connection. Check your internet and try again.",
    "auth/operation-not-allowed": "Username sign-in isn't switched on yet. Turn on Email/Password under Firebase → Authentication → Sign-in method.",
  };
  return map[e.code] || "Sign-in failed (" + (e.code || e.message) + ").";
}
