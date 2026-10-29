import { firebaseConfig } from "./firebase-config.js";
const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";

/* ================= game data ================= */
const STATS = {
  STR: { name: "Strength", hint: "Physical power" },
  INT: { name: "Intelligence", hint: "Knowledge and focus" },
  HLT: { name: "Health", hint: "Stamina and resilience" },
};
const TUNIC = "#b8423a";
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
const GEAR = [
  { id: "sword", slot: "hand", name: "Iron Sword", desc: "A trusty blade for your first dungeon." },
  { id: "shield", slot: "off", name: "Oak Shield", desc: "Blocks excuses. Mostly." },
  { id: "cape", slot: "back", name: "Hero's Cape", desc: "Flutters dramatically on morning walks." },
  { id: "dye_shadow", slot: "dye", name: "Shadow Dye", desc: "Recolours your tunic midnight black.", color: "#2a2a3a" },
  { id: "helm", slot: "head", name: "Knight Helm", desc: "Steel visor for the hardest quests." },
  { id: "hat", slot: "head", name: "Wizard Hat", desc: "Pointy. Increases perceived wisdom." },
  { id: "dye_gold", slot: "dye", name: "Sunlit Dye", desc: "Recolours your tunic warm gold.", color: "#d4a017" },
  { id: "staff", slot: "hand", name: "Arcane Staff", desc: "Topped with a glowing focus orb." },
  { id: "goldcape", slot: "back", name: "Royal Mantle", desc: "Golden trim earned through consistency." },
  { id: "crown", slot: "head", name: "Golden Crown", desc: "Ruler of your own routine." },
];
// Each challenge unlocks one piece of gear. goal(c) returns [progress, target] from the player's counts.
const CHALLENGES = [
  { id: "first", name: "First Steps", goal: "Complete your first quest", gear: "sword", prog: (c) => [c.total, 1] },
  { id: "sweep", name: "Clean Sweep", goal: "Complete every quest in a single day", gear: "shield", prog: (c) => [c.clears, 1] },
  { id: "streak3", name: "Momentum", goal: "Reach a 3-day streak", gear: "cape", prog: (c) => [c.best, 3] },
  { id: "q25", name: "Quest Hunter", goal: "Complete 25 quests", gear: "dye_shadow", prog: (c) => [c.total, 25] },
  { id: "str5", name: "Iron Will", goal: "Reach Strength level 5", gear: "helm", prog: (c) => [c.STR, 5] },
  { id: "int5", name: "Bookworm", goal: "Reach Intelligence level 5", gear: "hat", prog: (c) => [c.INT, 5] },
  { id: "hlt5", name: "Glowing", goal: "Reach Health level 5", gear: "dye_gold", prog: (c) => [c.HLT, 5] },
  { id: "clear10", name: "Unstoppable", goal: "Get 10 full clears", gear: "staff", prog: (c) => [c.clears, 10] },
  { id: "streak14", name: "Fortnight Hero", goal: "Reach a 14-day streak", gear: "goldcape", prog: (c) => [c.best, 14] },
  { id: "lv10", name: "Ruler of Routine", goal: "Reach level 10", gear: "crown", prog: (c) => [c.level, 10] },
];
const SLOTS = ["head", "back", "hand", "off", "dye"];

const dkey = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => dkey(new Date());
const uid = () => Math.random().toString(36).slice(2, 9);

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
    unlocked: [], equip: {}, title: "Novice", days: {}, clears: {}, clearXp: {}, log: [],
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
  // Gold economy replaced by challenges: keep anything already bought, convert gold-priced rewards to quest counts.
  if (!st.unlocked) st.unlocked = (st.owned || []).slice();
  if (!st.clearXp) st.clearXp = {};
  st.look = normLook(st.look);
  // v2 quests: three core quests worth the same XP, attributes raised with skill points.
  if (st.qv !== 2) {
    st.quests = defaultQuests();
    st.attr = { STR: 1, INT: 1, HLT: 1 };
    st.qv = 2;
  }
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
// Bodies are drawn bald; hair is a separate layer so styles and colours can be mixed freely.
const BODIES = {
  m: [
    "................", "................", "................", "................", "................",
    ".....oooooo.....", "....oSSSSSSo....", "....oSSSSSSo....", "....oSeSSeSo....", "....oSSSSSSo....",
    ".....oSSSSo.....", "...ooTTTTTToo...", "..oSoTTTTTToSo..", "..oSoTTTTTToSo..", "..ooobbbbbbooo..",
    "....oPPPPPPo....", "....oPPooPPo....", "....oPPooPPo....", "...oBBBooBBBo...", "...oooo..oooo...",
  ],
  f: [
    "................", "................", "................", "................", "................",
    ".....oooooo.....", "....oSSSSSSo....", "....oSSSSSSo....", "....oSeSSeSo....", "....ocSSSSco....",
    ".....oSSSSo.....", "...ooTTTTTToo...", "..oSoTTTTTToSo..", "..oSoTTTTTToSo..", "..ooobbbbbbooo..",
    "...oTTTTTTTTo...", "...oTTTTTTTTo...", "....oSSooSSo....", "...oBBBooBBBo...", "...oooo..oooo...",
  ],
};
const HAIRSTYLES = {
  short: { name: "Short", rows: { 5: ".....oooooo.....", 6: "....oHHHHHHo....", 7: "....oH....Ho...." } },
  long: { name: "Long", rows: { 5: ".....oooooo.....", 6: "....oHHHHHHo....", 7: "...oHH....HHo...", 8: "...oH......Ho...", 9: "...oH......Ho...", 10: "...oHo....oHo..." } },
  spiky: { name: "Spiky", rows: { 3: ".....o.oo.o.....", 4: "....oHoHHoHo....", 5: "....oHHHHHHo....", 6: "....oHHHHHHo....", 7: "....oH....Ho...." } },
  bun: { name: "Bun", rows: { 2: "......oooo......", 3: ".....oHHHHo.....", 4: ".....ooHHoo.....", 5: "....oHHHHHHo....", 6: "....oHHHHHHo....", 7: "....oH....Ho...." } },
  ponytail: { name: "Ponytail", rows: { 5: ".....oooooo.....", 6: "....oHHHHHHoo...", 7: "....oH....HoHo..", 8: "...........oHo..", 9: "...........oHo..", 10: "............o..." } },
  bald: { name: "Bald", rows: {} },
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
const OVER = {
  cape: { z: 0, rows: { 14: "..CC........CC..", 15: "..CC........CC..", 16: "..CC........CC..", 17: "...C........C...", 18: "...C........C..." }, pal: { C: "#c0392b" } },
  goldcape: { z: 0, rows: { 14: "..CC........CC..", 15: "..CC........CC..", 16: "..CC........CC..", 17: "..CY........YC..", 18: "..YY........YY.." }, pal: { C: "#6b2fa0", Y: "#f4c542" } },
  hat: { z: 1, rows: { 0: "........W.......", 1: ".......WW.......", 2: "......WWWW......", 3: "......WYWW......", 4: ".....WWWWWW.....", 5: "...WWWWWWWWWW..." }, pal: { W: "#4a3aa8", Y: "#f4c542" } },
  helm: { z: 1, rows: { 4: ".....oooooo.....", 5: "....oMMMMMMo....", 6: "....oMMMMMMo....", 7: "....oMoooooMo...", 8: "....oMeSSeMo...." }, pal: { M: "#aab4c8" } },
  crown: { z: 1, rows: { 2: ".....G.GG.G.....", 3: ".....GGGGGG.....", 4: ".....GrGGrG....." }, pal: { G: "#f4c542", r: "#e0314b" } },
  sword: { z: 1, rows: { 6: ".............I..", 7: ".............I..", 8: ".............I..", 9: ".............I..", 10: ".............I..", 11: ".............I..", 12: "............hhh.", 13: ".............h.." }, pal: { I: "#d6dbe8", h: "#a0742c" } },
  staff: { z: 1, rows: { 3: ".............O..", 4: "............OOO.", 5: ".............O..", 6: ".............w..", 7: ".............w..", 8: ".............w..", 9: ".............w..", 10: ".............w..", 11: ".............w..", 12: ".............w..", 13: ".............w..", 14: ".............w..", 15: ".............w..", 16: ".............w.." }, pal: { O: "#6ff0ff", w: "#8a5a2b" } },
  shield: { z: 1, rows: { 12: "AAAA............", 13: "AYYA............", 14: "AAAA............", 15: ".AA............." }, pal: { A: "#8a5a2b", Y: "#f4c542" } },
};
function drawSprite(canvas, cls, equip) {
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 16, 20);
  equip = equip || {};
  const dye = equip.dye ? GEAR.find((g) => g.id === equip.dye) : null;
  const look = normLook(equip.body ? { body: equip.body, hair: equip.hair, hc: equip.hc, skin: equip.skin } : equip.look);
  const pal = { o: "#0b0d1f", H: HAIR_COLOURS[look.hc], S: SKIN_TONES[look.skin], e: "#0b0d1f", T: dye ? dye.color : TUNIC, b: "#6b4a2a", P: "#3a3f63", B: "#4a2f1e", c: "#ec9a8c" };
  const layers = SLOTS.filter((s) => s !== "dye").map((s) => OVER[equip[s]]).filter(Boolean);
  const paint = (rows, p) => { for (const y in rows) { const r = rows[y]; for (let x = 0; x < 16; x++) { const c = r[x]; if (c && c !== "." && p[c]) { ctx.fillStyle = p[c]; ctx.fillRect(x, +y, 1, 1); } } } };
  layers.filter((l) => l.z === 0).forEach((l) => paint(l.rows, l.pal));
  const rows = Object.fromEntries(BODIES[look.body].map((r, i) => [i, r]));
  paint(rows, pal);
  paint(HAIRSTYLES[look.hair].rows, pal);
  layers.filter((l) => l.z === 1).forEach((l) => paint(l.rows, { ...pal, ...l.pal }));
}
// Gear icons: draw the item at its spot on the hero, then crop to the item and centre it in a square.
function gearIcon(g) {
  const raw = gearIconRaw(g), rctx = raw.getContext("2d");
  const px = rctx.getImageData(0, 0, 16, 20).data;
  let x0 = 16, y0 = 20, x1 = -1, y1 = -1;
  for (let y = 0; y < 20; y++) for (let x = 0; x < 16; x++) if (px[(y * 16 + x) * 4 + 3]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  if (x1 < 0) return raw;
  const w = x1 - x0 + 1, h = y1 - y0 + 1, size = Math.max(w, h) + 2;
  const c = document.createElement("canvas"); c.width = size; c.height = size;
  c.getContext("2d").drawImage(raw, x0, y0, w, h, Math.floor((size - w) / 2), Math.floor((size - h) / 2), w, h);
  return c;
}
function gearIconRaw(g) {
  const c = document.createElement("canvas"); c.width = 16; c.height = 20;
  const ctx = c.getContext("2d");
  if (g.slot === "dye") {
    ctx.fillStyle = "#0b0d1f"; ctx.fillRect(4, 5, 8, 12); ctx.fillStyle = g.color; ctx.fillRect(5, 6, 6, 10); ctx.fillStyle = "#ffffff55"; ctx.fillRect(6, 7, 1, 6);
  } else {
    const l = OVER[g.id];
    for (const y in l.rows) { const r = l.rows[y]; for (let x = 0; x < 16; x++) { const ch = r[x]; const col = l.pal[ch] || (ch === "o" ? "#0b0d1f" : null); if (col) { ctx.fillStyle = col; ctx.fillRect(x, +y, 1, 1); } } }
  }
  return c;
}

/* ================= state ================= */
// The hero's look travels inside the gear map so friends' Guild sprites show it too.
const heroLook = () => ({ ...S.equip, ...normLook(S.look) });
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
  const fresh = checkUnlocks();
  save(); render(); toast(STATS[k].name + " is now level " + S.attr[k]);
  fresh.forEach(showUnlock);
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
  };
}
// Unlocks are permanent: once a challenge is met, its gear stays yours even if a quest is later undone.
// Challenges follow your progress both ways: meeting a goal unlocks its gear, and undoing the
// quest that met it locks the gear again (and takes it off). Gear bought with gold in older
// versions stays yours.
function checkUnlocks() {
  const c = counts(), fresh = [], lost = [];
  CHALLENGES.forEach((ch) => {
    const [have, need] = ch.prog(c);
    const g = GEAR.find((x) => x.id === ch.gear);
    if (have >= need && !S.unlocked.includes(ch.gear)) {
      S.unlocked.push(ch.gear); fresh.push(ch);
      logEvent("Challenge complete: " + ch.name + ". Unlocked " + g.name);
    } else if (have < need && S.unlocked.includes(ch.gear) && !(S.owned || []).includes(ch.gear)) {
      S.unlocked = S.unlocked.filter((id) => id !== ch.gear);
      if (S.equip[g.slot] === g.id) S.equip[g.slot] = null;
      lost.push(ch);
      logEvent("Challenge undone: " + ch.name + ". " + g.name + " locked again");
    }
  });
  if (lost.length) toast(lost.map((ch) => GEAR.find((x) => x.id === ch.gear).name).join(", ") + " locked again");
  return fresh;
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
  const equip = {}; SLOTS.forEach((s) => { equip[s] = S.equip[s] || null; }); const lk = normLook(S.look); Object.assign(equip, lk); equip.look = lk.body;
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
  const fresh = checkUnlocks();
  save(); render();
  if (after > before) levelUp(after);
  fresh.forEach(showUnlock);
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
    w.innerHTML = '<div class="title-tag">LEVEL UP</div><h1></h1><canvas width="16" height="20" class="sprite"></canvas><p class="muted" style="margin:0"></p><button class="btn gold">Onward</button>';
    w.querySelector("h1").textContent = "Level " + L;
    drawSprite(w.querySelector("canvas"), null, heroLook());
    w.querySelector("p").textContent = newTitle.length ? "New title unlocked: " + newTitle.join(", ") : "Your hero grows stronger.";
    w.querySelector("button").onclick = done;
  });
}
function showUnlock(ch) {
  const g = GEAR.find((x) => x.id === ch.gear);
  queueModal((w, done) => {
    w.innerHTML = '<div class="title-tag">CHALLENGE COMPLETE</div><h1></h1><p class="muted" style="margin:0"></p><canvas class="unlock-icon"></canvas><p style="margin:0"></p><div class="actions" style="justify-content:center"><button class="btn gold">Equip now</button><button class="btn ghost">Later</button></div>';
    w.querySelector("h1").textContent = ch.name;
    w.querySelectorAll("p")[0].textContent = ch.goal;
    const icon = gearIcon(g); icon.className = "unlock-icon";
    w.querySelector("canvas").replaceWith(icon);
    w.querySelectorAll("p")[1].textContent = "Unlocked: " + g.name;
    const [equipBtn, laterBtn] = w.querySelectorAll("button");
    equipBtn.onclick = () => { S.equip[g.slot] = g.id; save(); render(); done(); };
    laterBtn.onclick = done;
  });
}
function toggleGear(g) {
  if (!S.unlocked.includes(g.id)) return;
  S.equip[g.slot] = S.equip[g.slot] === g.id ? null : g.id; save(); render();
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
  btn.onclick = () => { if (!armed) { armed = true; btn.textContent = "Tap again to delete"; btn.className = "btn danger"; return; } onConfirm(); };
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
const FLAME = [
  "....o.......", "...oRo......", "...oRo...o..", "..oRRo..oRo.", "..oRRRo.oRo.", ".oRRORRooRRo", ".oRROORRRRRo",
  "oRROOOORRRRo", "oRROOYOORRRo", "oRROYYYOORRo", "oRROYYYYORRo", "oRRROYYORRRo", ".oRRROORRRo.", "..oooooooo..",
];
const FLAME_PAL = { o: "#3a1500", R: "#e8531e", O: "#ff9f43", Y: "#ffd23f" };
// Flicker frames: the base flame, one with the tips leaning the other way, one with the hot core lower.
const FLAME_FRAMES = [
  FLAME,
  [".......o....", "......oRo...", "..o...oRo...", ".oRo..oRRo..", ".oRo.oRRRo..", ...FLAME.slice(5)],
  [...FLAME.slice(0, 8), "oRROOOOORRRo", "oRROOYOORRRo", "oRROYYYOORRo", ...FLAME.slice(11)],
];
function drawFlame(i) {
  const ctx = $("#flame").getContext("2d");
  ctx.clearRect(0, 0, 12, 14);
  FLAME_FRAMES[i].forEach((r, y) => [...r].forEach((ch, x) => { if (FLAME_PAL[ch]) { ctx.fillStyle = FLAME_PAL[ch]; ctx.fillRect(x, y, 1, 1); } }));
}
let flameDrawn = false;
function renderStreak() {
  if (!flameDrawn) { drawFlame(0); flameDrawn = true; }
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
  drawSprite($("#lookPreview"), null, { ...S.equip, ...lk });
  segment($("#lookSeg"), { m: { label: "Male" }, f: { label: "Female" } }, lk.body, (k) => setLook({ body: k }));
  const st = $("#hairStyles"); st.innerHTML = "";
  Object.entries(HAIRSTYLES).forEach(([k, h]) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "style-btn"; b.setAttribute("aria-pressed", String(k === lk.hair));
    const full = document.createElement("canvas"); full.width = 16; full.height = 20; drawSprite(full, null, { ...lk, hair: k });
    const c = document.createElement("canvas"); c.width = 14; c.height = 11; c.getContext("2d").drawImage(full, 1, 2, 14, 11, 0, 0, 14, 11);
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
  const tq = totalQuests(); $("#qtotal").textContent = tq + (tq === 1 ? " quest done" : " quests done");
  renderStreak();
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
  $("#acct").textContent = me ? "Signed in as " + (me.email || me.displayName || "Google user") + ". Your progress syncs to every device you sign in on." : "";

  // challenges → gear
  const c = counts(); const gg = $("#gear"); gg.innerHTML = "";
  let doneCount = 0;
  CHALLENGES.forEach((ch) => {
    const g = GEAR.find((x) => x.id === ch.gear);
    const [have, need] = ch.prog(c);
    const own = S.unlocked.includes(g.id), eq = S.equip[g.slot] === g.id;
    if (own) doneCount++;
    const li = document.createElement("li"); li.className = "ch" + (own ? " done" : " locked") + (eq ? " equipped" : "");
    li.appendChild(gearIcon(g));
    const info = document.createElement("div"); info.style.minWidth = "0";
    const nm = document.createElement("div"); nm.className = "ch-name"; nm.textContent = g.name;
    const goal = document.createElement("div"); goal.className = "ch-goal"; goal.textContent = ch.name + ": " + ch.goal;
    info.append(nm, goal);
    if (!own) {
      const bar = document.createElement("div"); bar.className = "bar"; bar.innerHTML = '<i style="width:' + Math.min(100, (have / need) * 100) + '%"></i>';
      const pr = document.createElement("div"); pr.className = "ch-prog num"; pr.textContent = Math.min(have, need) + " / " + need;
      info.append(bar, pr);
    }
    const b = document.createElement("button"); b.className = "btn" + (eq ? " gold" : " ghost");
    b.textContent = own ? (eq ? "Unequip" : "Equip") : "Locked"; b.disabled = !own;
    b.setAttribute("aria-label", (own ? (eq ? "Unequip " : "Equip ") : "Locked: ") + g.name);
    b.onclick = () => toggleGear(g);
    li.append(info, b); gg.appendChild(li);
  });
  $("#chcount").textContent = doneCount + " / " + CHALLENGES.length + " complete";


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
    const c = document.createElement("canvas"); c.width = 16; c.height = 20; drawSprite(c, p.cls, p.equip);
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
      const c = document.createElement("canvas"); c.width = 16; c.height = 20;
      const p = guildProfiles[m.uid];
      if (!cont) drawSprite(c, p ? p.cls : "warrior", p ? p.equip : {});
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
const TABS = ["quests", "hero", "rewards", "guild", "log"];
function showTab(t) {
  document.querySelectorAll(".nav button").forEach((x) => x.setAttribute("aria-current", String(x.dataset.tab === t)));
  TABS.forEach((p) => ($("#p-" + p).hidden = p !== t));
  history.replaceState(null, "", "#" + t); window.scrollTo(0, 0);
  if (t === "guild") { const box = $("#chatlog"); box.scrollTop = box.scrollHeight; updateUnread(); }
}
document.querySelectorAll(".nav button").forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
$("#addq").onclick = () => questForm(null);
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
const rollover = () => { if (today() !== lastDay) { lastDay = today(); render(); } };
setInterval(rollover, 60000);
document.addEventListener("visibilitychange", () => { if (!document.hidden) rollover(); });

// install prompt
let deferredInstall = null;
window.addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); deferredInstall = e; $("#installBtn").hidden = false; });
$("#installBtn").onclick = async () => { if (!deferredInstall) return; deferredInstall.prompt(); await deferredInstall.userChoice; deferredInstall = null; $("#installBtn").hidden = true; };
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const isStandalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
if (isIOS && !isStandalone) $("#iosHint").hidden = false;

/* ================= animation ================= */
// The streak flame flickers. Paused when the app is hidden or motion is reduced.
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");
let flameFrame = 0;
setInterval(() => {
  if (document.hidden || reduceMotion.matches || !S || $("#screen-game").hidden) return;
  if ($("#streakBadge").classList.contains("out")) { if (flameFrame) { flameFrame = 0; drawFlame(0); } return; }
  flameFrame = (flameFrame + 1 + Math.floor(Math.random() * 2)) % FLAME_FRAMES.length;
  drawFlame(flameFrame);
}, 150);

/* ================= Firebase ================= */
drawSprite($("#titleSprite"), "warrior", { hand: "sword", back: "cape" });
const titleStatus = $("#titleStatus"), titleErr = $("#titleErr"), signinBtn = $("#signin");
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
    { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut },
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

  signinBtn.onclick = async () => {
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
        if (!S) S = freshState((user.displayName || "").split(" ")[0] || "Adventurer");
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
  // Challenges count past progress too, so check for anything already earned.
  const fresh = checkUnlocks();
  render();
  if (fresh.length) { save(); fresh.forEach(showUnlock); }
  if (!entered) {
    entered = true;
    const h = location.hash.slice(1); if (TABS.includes(h)) showTab(h);
  }
}

function friendlyAuthError(e) {
  const map = {
    "auth/unauthorized-domain": "This web address isn't allowed to sign in yet. Add it under Firebase → Authentication → Settings → Authorized domains.",
    "auth/network-request-failed": "No connection. Check your internet and try again.",
    "auth/operation-not-allowed": "Google sign-in is switched off. Enable it under Firebase → Authentication → Sign-in method.",
  };
  return map[e.code] || "Sign-in failed (" + (e.code || e.message) + ").";
}
