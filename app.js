import { firebaseConfig } from "./firebase-config.js";
import { heroSVG, itemSVG, flameSVG } from "./art.js";
import { setupDungeon, SPELLS } from "./dungeon.js";
const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";

/* ================= game data ================= */
const STATS = {
  STR: { name: "Strength", hint: "Attack damage in the dungeon" },
  INT: { name: "Intelligence", hint: "Spell power in the dungeon" },
  HLT: { name: "Health", hint: "Max HP in the dungeon" },
};
const QUEST_XP = 20;        // every quest is worth the same
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
const GEAR = [
  { id: "helm", slot: "head", name: "Knight Helm", desc: "Steel visor for the hardest quests." },
  { id: "hat", slot: "head", name: "Wizard Hat", desc: "Pointy. Increases perceived wisdom." },
  { id: "crown", slot: "head", name: "Golden Crown", desc: "Ruler of your own routine." },
  { id: "armour_leather", slot: "shirt", name: "Leather Vest", desc: "Light, quiet and better than nothing." },
  { id: "armour_chain", slot: "shirt", name: "Chainmail", desc: "Rings of steel under a red tabard." },
  { id: "armour_plate", slot: "shirt", name: "Steel Plate", desc: "Heavy, shiny and very hard to hit through." },
  { id: "pants_shadow", slot: "pants", name: "Shadow Trousers", desc: "Dark and quiet, worn by new adventurers.", color: "#23233a" },
  { id: "pants_royal", slot: "pants", name: "Royal Leggings", desc: "Regal blue for a rising star.", color: "#3a46b8" },
  { id: "pants_ember", slot: "pants", name: "Ember Breeches", desc: "Glowing red, like a week-long streak.", color: "#9a2d1c" },
  { id: "cape", slot: "back", name: "Hero's Cape", desc: "Flutters dramatically on morning walks." },
  { id: "goldcape", slot: "back", name: "Royal Mantle", desc: "Golden trim earned through consistency." },
  { id: "cape_forest", slot: "back", name: "Ranger Cloak", desc: "Green and weathered from fifty quests." },
  { id: "sword", slot: "hand", name: "Iron Sword", desc: "A trusty blade for your first dungeon." },
  { id: "staff", slot: "hand", name: "Arcane Staff", desc: "Topped with a glowing focus orb." },
  { id: "sword_gold", slot: "hand", name: "Golden Blade", desc: "Forged from a hundred finished quests." },
  { id: "shield", slot: "off", name: "Oak Shield", desc: "Blocks excuses. Mostly." },
  { id: "shield_steel", slot: "off", name: "Steel Buckler", desc: "Light, round and well trained." },
  { id: "shield_royal", slot: "off", name: "Royal Aegis", desc: "Carried by those with perfect weeks." },
];
const GEAR_SLOTS = [
  { slot: "head", name: "Helmet" }, { slot: "shirt", name: "Armour" }, { slot: "pants", name: "Pants" },
  { slot: "back", name: "Cape" }, { slot: "hand", name: "Sword" }, { slot: "off", name: "Shield" },
];
// Gear comes from chests as common items. Merging 3 items of the same slot and rarity turns the one
// you choose into the next rarity. Each slot powers one part of dungeon combat.
const RARITIES = [
  { name: "Common", colour: "#b9c0cf" }, { name: "Uncommon", colour: "#5fd36a" }, { name: "Rare", colour: "#4fa8ff" },
  { name: "Epic", colour: "#b46cff" }, { name: "Legendary", colour: "#ffb020" },
];
const SLOT_STATS = {
  hand: { key: "dmg", label: "Attack damage", vals: [1, 2, 3, 5, 7] },
  off: { key: "block", label: "Shield block", vals: [1, 2, 3, 4, 6] },
  head: { key: "hp", label: "Max HP", vals: [3, 6, 9, 13, 18] },
  shirt: { key: "def", label: "Defence", vals: [1, 2, 3, 4, 6] },
  pants: { key: "hp", label: "Max HP", vals: [2, 4, 6, 9, 12] },
  back: { key: "crit", label: "Crit chance", vals: [5, 8, 12, 16, 22], pct: true },
};
const CHEST_PRICE = 100;
const statText = (slot, r) => "+" + SLOT_STATS[slot].vals[r] + (SLOT_STATS[slot].pct ? "% " : " ") + SLOT_STATS[slot].label;
const SLOTS = ["head", "shirt", "pants", "back", "hand", "off"];

const dkey = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => dkey(new Date());
const uid = () => Math.random().toString(36).slice(2, 9);

const TK_MAX = 6, TK_EVERY = 4 * 60 * 60 * 1000;
function freshState(name) {
  return {
    v: 1, at: Date.now(), name: name || "Adventurer", xp: 0,
    attr: { STR: 1, INT: 1, HLT: 1 }, qv: 2,
    quests: defaultQuests(),
    treasures: [
      { id: uid(), name: "One episode of a show", every: 5, base: 0 },
      { id: uid(), name: "A fancy coffee", every: 8, base: 0 },
      { id: uid(), name: "Weekend lie-in", every: 15, base: 0 },
      { id: uid(), name: "Takeaway night", every: 30, base: 0 },
    ],
    tk: { n: TK_MAX, at: Date.now() }, inv: [], gold: 0, chests: 0, spells: ["fireball"], spell: "fireball", equip: {}, title: "Novice", days: {}, clears: {}, clearXp: {}, log: [],
  };
}

// Older saves used four attributes (Vitality, Spirit) and a Monk class: fold them into Health / Druid.
function migrate(st) {
  if (!st || st.v !== 1) return st;
  const old = { VIT: "HLT", SPI: "HLT" };
  (st.quests || []).forEach((q) => { if (old[q.stat]) q.stat = old[q.stat]; if (!STATS[q.stat]) q.stat = "HLT"; });
  const sx = st.statXp || {};
  if (!("HLT" in sx)) st.statXp = { STR: sx.STR || 0, INT: sx.INT || 0, HLT: (sx.VIT || 0) + (sx.SPI || 0) };
  delete st.cls;
  if (!st.clearXp) st.clearXp = {};
  st.look = normLook(st.look);
  if (st.equip && st.equip.dye) { st.equip.shirt = st.equip.dye; delete st.equip.dye; }
  // v2 quests: three core quests worth the same XP, attributes raised with skill points.
  if (st.qv !== 2) {
    st.quests = defaultQuests();
    st.attr = { STR: 1, INT: 1, HLT: 1 };
    st.qv = 2;
  }
  // Gear v2: gear lives in an inventory with rarities. Anything already unlocked becomes a common copy
  // (worn items stay worn), and gear bought with gold in the first version too.
  if (!st.inv) {
    const ids = [...new Set([...(st.unlocked || []), ...(st.owned || [])])].filter((id) => GEAR.some((g) => g.id === id));
    st.inv = ids.map((id) => ({ u: uid(), id, r: 0 }));
    const eq = {};
    Object.entries(st.equip || {}).forEach(([slot, id]) => { const it = st.inv.find((x) => x.id === id); if (it) eq[slot] = it.u; });
    st.equip = eq; st.gold = st.gold || 0; st.chests = st.chests || 0;
    delete st.unlocked; delete st.owned;
  }
  // Armour v3: tunics become armour, spells are owned and equipped, old dice runs are refunded.
  (st.inv || []).forEach((it) => { if (ARMOUR_RENAME[it.id]) it.id = ARMOUR_RENAME[it.id]; });
  if (!st.spells) { st.spells = ["fireball"]; st.spell = "fireball"; }
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
// The coloured tunics of earlier versions became armour pieces of the same rarity.
const ARMOUR_RENAME = { dye_shadow: "armour_leather", shirt_forest: "armour_chain", dye_gold: "armour_plate" };
// Turn saved gear + look into what the art needs, then draw the hero into an element.
function heroParts(equip) {
  equip = equip || {};
  const look = normLook(equip.body ? { body: equip.body, hair: equip.hair, hc: equip.hc, skin: equip.skin } : equip.look);
  const armour = ARMOUR_RENAME[equip.shirt] || equip.shirt;
  const pants = GEAR.find((g) => g.id === equip.pants);
  return {
    body: look.body, hair: look.hair, hairColor: HAIR_COLOURS[look.hc], skin: SKIN_TONES[look.skin],
    armour, pantsColor: pants ? pants.color : null, head: equip.head, back: equip.back, hand: equip.hand, off: equip.off,
  };
}
function drawSprite(el, cls, equip, opts) { el.innerHTML = heroSVG(heroParts(equip), opts || {}); }
function gearIcon(g, r) {
  const d = document.createElement("div"); d.className = "gear-icon";
  if (r != null) { d.style.borderColor = RARITIES[r].colour; d.style.boxShadow = "0 0 0 2px " + RARITIES[r].colour + "55, inset 0 0 14px " + RARITIES[r].colour + "66"; }
  d.innerHTML = itemSVG(g.id, g.color);
  return d;
}
const invItem = (u) => (u == null ? null : S.inv.find((x) => x.u === u));
// slot -> gear template id of what's worn (what the art and the guild need)
function equipIds() {
  const out = {};
  SLOTS.forEach((slot) => { const it = invItem(S.equip[slot]); out[slot] = it ? it.id : null; });
  return out;
}
// combined dungeon bonuses from everything worn
function gearBonus() {
  const b = { dmg: 0, block: 0, hp: 0, def: 0, crit: 0 };
  SLOTS.forEach((slot) => { const it = invItem(S.equip[slot]); if (it) b[SLOT_STATS[slot].key] += SLOT_STATS[slot].vals[it.r]; });
  return b;
}
const heroLook = () => ({ ...equipIds(), ...normLook(S.look) });
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
// One skill point per full-clear day; each point raises an attribute by one level.
function skillPoints() {
  const earned = Object.keys(S.clears).length;
  const spent = Object.values(S.attr).reduce((n, l) => n + (l - 1), 0);
  return Math.max(0, earned - spent);
}
function upgradeAttr(k) {
  if (skillPoints() < 1) { toast("Complete every quest in a day to earn a skill point"); return; }
  S.attr[k]++; (S.attrLog = S.attrLog || []).push(k);
  logEvent(STATS[k].name + " upgraded to level " + S.attr[k]);
  save(); render(); toast(STATS[k].name + " is now level " + S.attr[k]);
}
// If undoing a quest takes away a full clear whose skill point was already spent,
// take back the most recent upgrade(s) so attributes never exceed the points earned.
function refundSkillPoints() {
  const earned = Object.keys(S.clears).length;
  let spent = Object.values(S.attr).reduce((n, l) => n + (l - 1), 0);
  S.attrLog = S.attrLog || [];
  const undone = [];
  while (spent > earned) {
    let k = S.attrLog.pop();
    if (!k || S.attr[k] <= 1) k = Object.keys(S.attr).sort((a, b) => S.attr[b] - S.attr[a])[0];
    if (S.attr[k] <= 1) break;
    S.attr[k]--; spent--; undone.push(k);
    logEvent(STATS[k].name + " back to level " + S.attr[k] + " (skill point taken back)");
  }
  return undone;
}
function totalQuests() { return Object.values(S.days).reduce((n, d) => n + Object.keys(d).length, 0); }
function counts() {
  return {
    total: totalQuests(), clears: Object.keys(S.clears).length, best: bestStreak(),
    level: levelInfo(S.xp).level,
    STR: S.attr.STR, INT: S.attr.INT, HLT: S.attr.HLT,
    spent: Object.values(S.attr).reduce((n, l) => n + (l - 1), 0),
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
  const equip = equipIds(); const lk = normLook(S.look); Object.assign(equip, lk); equip.look = lk.body;
  try {
    await Promise.all([
      fb.setDoc(userRef, { save: JSON.stringify(S), at: S.at }),
      fb.setDoc(profileRef, {
        name: S.name.slice(0, 24), xp: S.xp, level: L.level, title: S.title,
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
      S.clears[k] = 1;
      logEvent("Full clear! Earned a skill point"); toast("Full clear! +1 skill point. Spend it in the Hero tab");
    }
  }
  const after = levelInfo(S.xp).level;
  if (after > before) logEvent("Reached level " + after);
  const refunded = refundSkillPoints();
  if (refunded.length) toast("Skill point taken back from " + refunded.map((k) => STATS[k].name).join(", "));
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
    w.querySelector("p").textContent = newTitle.length ? "New title unlocked: " + newTitle.join(", ") : "Your hero grows stronger.";
    w.querySelector("button").onclick = done;
  });
}
// Chests: buy with gold or earn by clearing a dungeon; each gives one random common item.
function buyChest() {
  if (S.gold < CHEST_PRICE) { toast("You need " + (CHEST_PRICE - S.gold) + " more gold. Earn gold in the dungeon"); return; }
  S.gold -= CHEST_PRICE; logEvent("Bought a chest (-" + CHEST_PRICE + " gold)"); openChest(true);
}
function openChest(bought) {
  if (!bought) { if (S.chests < 1) return; S.chests--; }
  // 1 in 8 chests holds a spell you don't have yet, while there are any left to find
  const missing = Object.keys(SPELLS).filter((k) => !S.spells.includes(k));
  if (missing.length && Math.random() < 0.125) {
    const k = missing[Math.floor(Math.random() * missing.length)];
    S.spells.push(k); logEvent("Opened a chest: learned " + SPELLS[k].name);
    save(); render(); revealSpell(k); return;
  }
  const g = GEAR[Math.floor(Math.random() * GEAR.length)];
  const item = { u: uid(), id: g.id, r: 0 };
  S.inv.push(item);
  logEvent("Opened a chest: " + g.name);
  save(); render();
  revealItem("CHEST OPENED", g, item, true);
}
function revealSpell(k) {
  const sp = SPELLS[k];
  queueModal((w, done) => {
    w.innerHTML = '<div class="title-tag">NEW SPELL</div><div class="chest-reveal"><div class="chest-burst" style="background:radial-gradient(circle,#b46cffaa 0,transparent 65%)"></div><div class="gear-icon unlock-icon"></div></div><h1></h1><p class="muted" style="margin:0"></p><div class="actions" style="justify-content:center"><button class="btn gold">Equip</button><button class="btn ghost">Keep</button></div>';
    w.querySelector(".gear-icon").innerHTML = sp.icon;
    w.querySelector("h1").textContent = sp.name;
    w.querySelector("p").textContent = sp.desc;
    const [eq, keep] = w.querySelectorAll("button");
    eq.onclick = () => { S.spell = k; save(); render(); done(); };
    keep.onclick = done;
  });
}
function renderSpells() {
  const box = $("#spellList"); box.innerHTML = "";
  Object.entries(SPELLS).forEach(([k, sp]) => {
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
}
function revealItem(tagText, g, item, offerEquip) {
  queueModal((w, done) => {
    w.innerHTML = '<div class="title-tag"></div><div class="chest-reveal"><div class="chest-burst"></div><div class="reveal-slot"></div></div><h1></h1><span class="rarity-tag"></span><p class="muted" style="margin:0"></p><div class="actions" style="justify-content:center"></div>';
    w.querySelector(".title-tag").textContent = tagText;
    const R = RARITIES[item.r];
    const icon = gearIcon(g, item.r); icon.classList.add("unlock-icon");
    w.querySelector(".reveal-slot").replaceWith(icon);
    w.querySelector(".chest-burst").style.background = "radial-gradient(circle," + R.colour + "aa 0,transparent 65%)";
    w.querySelector("h1").textContent = g.name;
    const tag = w.querySelector(".rarity-tag"); tag.textContent = R.name; tag.style.background = R.colour;
    w.querySelector("p").textContent = statText(g.slot, item.r);
    const a = w.querySelector(".actions");
    if (offerEquip && S.equip[g.slot] !== item.u) {
      const eq = document.createElement("button"); eq.className = "btn gold"; eq.textContent = "Equip";
      eq.onclick = () => { S.equip[g.slot] = item.u; save(); render(); done(); };
      a.appendChild(eq);
    }
    const ok = document.createElement("button"); ok.className = "btn ghost"; ok.textContent = offerEquip ? "Keep" : "Nice";
    ok.onclick = done; a.appendChild(ok);
  });
}
function toggleGear(it) {
  const g = GEAR.find((x) => x.id === it.id);
  S.equip[g.slot] = S.equip[g.slot] === it.u ? null : it.u; save(); render();
}
// Merge: the chosen item goes up one rarity by using up two other items of the same slot and rarity.
// Unworn copies are used, preferring copies of the same item.
const slotOf = (it) => GEAR.find((y) => y.id === it.id).slot;
function mergeFodder(it) {
  const slot = slotOf(it);
  const pool = S.inv.filter((x) => x.u !== it.u && x.r === it.r && slotOf(x) === slot && S.equip[slot] !== x.u);
  // use copies of the same item first, then items you have spares of, and unique looks last
  const copies = (x) => S.inv.filter((y) => y.id === x.id && y.r === x.r).length;
  const rank = (x) => (x.id === it.id ? 0 : copies(x) > 1 ? 1 : 2);
  return pool.sort((a, b) => rank(a) - rank(b));
}
function mergeItem(it) {
  const fod = mergeFodder(it);
  if (it.r >= RARITIES.length - 1 || fod.length < 2) return;
  const used = fod.slice(0, 2).map((x) => x.u);
  S.inv = S.inv.filter((x) => !used.includes(x.u));
  it.r++;
  const g = GEAR.find((x) => x.id === it.id);
  logEvent("Merged into " + RARITIES[it.r].name + " " + g.name);
  save(); render();
  revealItem("MERGE COMPLETE", g, it, false);
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
const ticketsLeft = () => refillTickets().n;
function spendTicket() {
  const tk = refillTickets(); if (tk.n < 1) return false;
  if (tk.n >= TK_MAX) tk.at = Date.now(); // the countdown starts once you drop below full
  tk.n--; return true;
}
const nextTicketIn = () => { const tk = refillTickets(); return tk.n >= TK_MAX ? 0 : Math.max(0, tk.at + TK_EVERY - Date.now()); };
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
  addXp, dayStreak: () => dayStreak(), tickets: ticketsLeft, spendTicket, nextTicketIn, ticketMax: TK_MAX,
  gearBonus: () => gearBonus(), level: () => levelInfo(S.xp).level,
  addGold: (n) => { S.gold = (S.gold || 0) + n; },
  addChest: () => { S.chests = (S.chests || 0) + 1; },
  drawHero: (el) => drawSprite(el, null, heroLook()),
});

/* ================= gear menus ================= */
function renderGearSlots() {
  const box = $("#gearSlots"); box.innerHTML = "";
  GEAR_SLOTS.forEach(({ slot, name }) => {
    const mine = S.inv.filter((x) => slotOf(x) === slot);
    const worn = invItem(S.equip[slot]);
    const g = worn && GEAR.find((x) => x.id === worn.id);
    const b = document.createElement("button"); b.type = "button"; b.className = "style-btn slot-btn";
    b.setAttribute("aria-label", name + ": " + (g ? RARITIES[worn.r].name + " " + g.name : "nothing equipped") + ", " + mine.length + " owned");
    const icon = g ? gearIcon(g, worn.r) : Object.assign(document.createElement("div"), { className: "gear-icon empty" });
    const t = document.createElement("span"); t.className = "slot-name"; t.textContent = name;
    const c = document.createElement("small"); c.textContent = g ? RARITIES[worn.r].name : mine.length + " owned";
    if (g) c.style.color = RARITIES[worn.r].colour;
    const canMerge = mine.some((x) => x.r < RARITIES.length - 1 && mergeFodder(x).length >= 2);
    if (canMerge) { const dot = document.createElement("span"); dot.className = "merge-dot"; dot.textContent = "Merge"; b.appendChild(dot); }
    b.append(icon, t, c); b.onclick = () => openGearMenu(slot); box.appendChild(b);
  });
}
function openGearMenu(slot) {
  const info = GEAR_SLOTS.find((x) => x.slot === slot), st = SLOT_STATS[slot];
  openSheet((w, close) => {
    const head = document.createElement("div"); head.className = "spread";
    const h = document.createElement("h2"); h.textContent = info.name;
    const x = document.createElement("button"); x.className = "iconbtn"; x.textContent = "Close"; x.onclick = close;
    head.append(h, x); w.appendChild(head);
    const note = document.createElement("p"); note.className = "note";
    note.textContent = info.name + " gear adds " + st.label + " in the dungeon. Merge 3 of the same rarity to upgrade one.";
    w.appendChild(note);
    const list = document.createElement("ul"); list.className = "clist gear-menu";
    GEAR.filter((g) => g.slot === slot).forEach((g) => {
      const copies = S.inv.filter((it) => it.id === g.id).sort((a, b) => b.r - a.r);
      if (!copies.length) {
        const li = document.createElement("li"); li.className = "ch locked";
        li.appendChild(gearIcon(g));
        const mid = document.createElement("div"); mid.style.minWidth = "0";
        mid.innerHTML = '<div class="ch-name">???</div><div class="ch-goal">Find it in a chest.</div>';
        li.append(mid, document.createElement("span")); list.appendChild(li);
        return;
      }
      copies.forEach((it) => {
        const eq = S.equip[slot] === it.u, R = RARITIES[it.r];
        const li = document.createElement("li"); li.className = "ch done" + (eq ? " equipped" : "");
        li.appendChild(gearIcon(g, it.r));
        const mid = document.createElement("div"); mid.style.minWidth = "0";
        const nm = document.createElement("div"); nm.className = "ch-name"; nm.textContent = g.name;
        const rt = document.createElement("span"); rt.className = "rarity-tag small"; rt.textContent = R.name; rt.style.background = R.colour;
        const sub = document.createElement("div"); sub.className = "ch-goal"; sub.textContent = statText(slot, it.r);
        mid.append(nm, rt, sub);
        const btns = document.createElement("div"); btns.className = "gear-btns";
        const b = document.createElement("button"); b.className = "btn" + (eq ? " gold" : " ghost");
        b.textContent = eq ? "Unequip" : "Equip"; b.setAttribute("aria-label", (eq ? "Unequip " : "Equip ") + R.name + " " + g.name);
        b.onclick = () => { toggleGear(it); openGearMenu(slot); };
        btns.appendChild(b);
        if (it.r < RARITIES.length - 1) {
          const have = mergeFodder(it).length;
          const m = document.createElement("button"); m.className = "btn merge";
          m.textContent = have >= 2 ? "Merge" : "Merge " + Math.min(have, 2) + "/2";
          m.disabled = have < 2;
          m.setAttribute("aria-label", "Merge two other " + R.name + " " + info.name.toLowerCase() + " items into this one");
          let armed = false;
          m.onclick = () => {
            if (!armed) { armed = true; m.textContent = "Sure?"; m.classList.add("danger"); return; }
            mergeItem(it); openGearMenu(slot);
          };
          btns.appendChild(m);
        }
        li.append(mid, btns); list.appendChild(li);
      });
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
  drawSprite($("#lookPreview"), null, { ...equipIds(), ...lk });
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
  $("#htitle").textContent = S.title;
  $("#hname").textContent = S.name;
  $("#xpbar i").style.width = (L.into / L.need) * 100 + "%";
  $("#xpbar").setAttribute("aria-valuenow", L.into); $("#xpbar").setAttribute("aria-valuemax", L.need);
  $("#xptext").textContent = L.into + " / " + L.need + " XP to LV " + (L.level + 1);
  $("#goldTop").textContent = S.gold;
  // shop
  $("#shopGold").textContent = S.gold;
  $("#buyChest").classList.toggle("short", S.gold < CHEST_PRICE);
  $("#chestCount").textContent = S.chests + (S.chests === 1 ? " chest" : " chests");
  $("#openChest").disabled = S.chests < 1;
  $("#openChest").textContent = S.chests ? "Open a chest" : "No chests to open";
  $("#shopDot").hidden = S.chests < 1;
  const rl = $("#rarityList"); rl.innerHTML = "";
  RARITIES.forEach((R, i) => {
    const li = document.createElement("li");
    li.innerHTML = '<span class="rarity-tag"></span><span></span><span class="muted num"></span>';
    li.children[0].textContent = R.name; li.children[0].style.background = R.colour;
    li.children[1].textContent = "Sword +" + SLOT_STATS.hand.vals[i] + " · Helmet +" + SLOT_STATS.head.vals[i] + " HP";
    li.children[2].textContent = i ? Math.pow(3, i) + " commons" : "from chests";
    rl.appendChild(li);
  });
  renderStreak();
  $("#tkTop").textContent = ticketsLeft();
  dungeon.renderTab();
  dungeon.resume();
  drawSprite($("#sprite"), null, heroLook());

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
  $("#clearmsg").textContent = S.clears[today()] ? "★ Full clear today" : S.quests.length ? n + " of " + S.quests.length + " done · clear all for a skill point" : "";
  const extras = S.quests.filter((q) => !q.core).length;
  const addBtn = $("#addq");
  addBtn.hidden = extras >= MAX_EXTRA_QUESTS;
  addBtn.textContent = "+ Add your own quest (" + extras + "/" + MAX_EXTRA_QUESTS + ")";

  // attributes
  const sp = skillPoints();
  $("#sp").textContent = sp; $("#spWrap").classList.toggle("has", sp > 0);
  $("#spTop").textContent = sp; $("#spPill").classList.toggle("has", sp > 0);
  $("#heroDot").hidden = sp < 1;
  const sg = $("#stats"); sg.innerHTML = "";
  Object.entries(STATS).forEach(([k, s]) => {
    const el = document.createElement("div"); el.className = "stat " + k;
    el.innerHTML = '<div class="stat-info"><span class="px stat-name">' + s.name + '</span><small>' + s.hint + '</small></div><span class="stat-lv num">LV ' + S.attr[k] + '</span><button class="btn up" type="button">+1</button>';
    const b = el.querySelector(".up"); b.disabled = sp < 1; b.setAttribute("aria-label", "Upgrade " + s.name);
    b.onclick = () => upgradeAttr(k);
    sg.appendChild(el);
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
  profiles.forEach((p, i) => {
    const li = document.createElement("li"); li.className = "g" + (me && p.id === me.uid ? " me" : "");
    const rank = document.createElement("span"); rank.className = "rank"; rank.textContent = i + 1;
    const c = document.createElement("div"); c.className = "g-av"; drawSprite(c, null, p.equip, { head: true });
    const who = document.createElement("div"); who.className = "who";
    const b = document.createElement("b"); b.textContent = (p.name || "Adventurer") + (me && p.id === me.uid ? " (you)" : "");
    const s = document.createElement("span"); s.textContent = p.title || "Novice";
    who.append(b, s);
    const lv = document.createElement("div"); lv.className = "lv num"; lv.textContent = "LV " + (p.level || 1);
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
const TABS = ["quests", "hero", "dungeon", "shop", "guild", "log"];
function showTab(t) {
  document.querySelectorAll(".nav button").forEach((x) => x.setAttribute("aria-current", String(x.dataset.tab === t)));
  TABS.forEach((p) => ($("#p-" + p).hidden = p !== t));
  history.replaceState(null, "", "#" + t); window.scrollTo(0, 0);
  if (t === "guild") { const box = $("#chatlog"); box.scrollTop = box.scrollHeight; updateUnread(); }
}
document.querySelectorAll(".nav button").forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
$("#addq").onclick = () => questForm(null);
$("#buyChest").onclick = () => buyChest();
$("#openChest").onclick = () => openChest(false);
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
  $("#tkTop").textContent = n; dungeon.renderTab();
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
    const h = location.hash.slice(1); if (TABS.includes(h)) showTab(h);
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
