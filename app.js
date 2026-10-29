import { firebaseConfig } from "./firebase-config.js";
const SDK = "https://www.gstatic.com/firebasejs/10.12.2/";

/* ================= game data ================= */
const STATS = {
  STR: { name: "Strength", hint: "Exercise, movement" },
  INT: { name: "Intelligence", hint: "Reading, learning" },
  HLT: { name: "Health", hint: "Sleep, food, water, mind" },
};
const CLASSES = {
  warrior: { name: "Warrior", stat: "STR", tunic: "#b8423a" },
  scholar: { name: "Scholar", stat: "INT", tunic: "#3a6fc4" },
  druid: { name: "Druid", stat: "HLT", tunic: "#2f8f5a" },
};
const DIFF = {
  easy: { name: "Easy", xp: 10, gold: 5 },
  medium: { name: "Medium", xp: 25, gold: 12 },
  hard: { name: "Hard", xp: 50, gold: 25 },
};
const TITLES = [
  { lv: 1, t: "Novice" }, { lv: 3, t: "Habit Squire" }, { lv: 5, t: "Streak Knight" },
  { lv: 8, t: "Keeper of Routines" }, { lv: 12, t: "Archmage of Mornings" }, { lv: 20, t: "Legend of the Daily Grind" },
];
const STREAK_TITLES = [{ d: 7, t: "Week Warden" }, { d: 30, t: "Moon Marathoner" }];
const GEAR = [
  { id: "sword", slot: "hand", name: "Iron Sword", cost: 40, lv: 1, desc: "A trusty blade for your first dungeon." },
  { id: "shield", slot: "off", name: "Oak Shield", cost: 60, lv: 2, desc: "Blocks excuses. Mostly." },
  { id: "cape", slot: "back", name: "Hero's Cape", cost: 100, lv: 3, desc: "Flutters dramatically on morning walks." },
  { id: "hat", slot: "head", name: "Wizard Hat", cost: 150, lv: 4, desc: "Pointy. Increases perceived wisdom." },
  { id: "staff", slot: "hand", name: "Arcane Staff", cost: 150, lv: 5, desc: "Topped with a glowing focus orb." },
  { id: "helm", slot: "head", name: "Knight Helm", cost: 220, lv: 6, desc: "Steel visor for the hardest quests." },
  { id: "goldcape", slot: "back", name: "Royal Mantle", cost: 300, lv: 8, desc: "Golden trim earned through consistency." },
  { id: "crown", slot: "head", name: "Golden Crown", cost: 500, lv: 10, desc: "Ruler of your own routine." },
  { id: "dye_shadow", slot: "dye", name: "Shadow Dye", cost: 30, lv: 2, desc: "Recolours your tunic midnight black.", color: "#2a2a3a" },
  { id: "dye_gold", slot: "dye", name: "Sunlit Dye", cost: 80, lv: 5, desc: "Recolours your tunic warm gold.", color: "#d4a017" },
];
const SLOTS = ["head", "back", "hand", "off", "dye"];

const dkey = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const today = () => dkey(new Date());
const uid = () => Math.random().toString(36).slice(2, 9);

function freshState(name) {
  return {
    v: 1, at: Date.now(), name: name || "Adventurer", cls: "warrior", xp: 0, gold: 0,
    statXp: { STR: 0, INT: 0, HLT: 0 },
    quests: [
      { id: uid(), name: "Walk for 20 minutes", stat: "STR", diff: "medium" },
      { id: uid(), name: "Read 10 pages", stat: "INT", diff: "easy" },
      { id: uid(), name: "Drink 2 litres of water", stat: "HLT", diff: "easy" },
      { id: uid(), name: "In bed by 11pm", stat: "HLT", diff: "medium" },
      { id: uid(), name: "10 minutes of meditation", stat: "HLT", diff: "easy" },
      { id: uid(), name: "Gym session", stat: "STR", diff: "hard" },
    ],
    treasures: [
      { id: uid(), name: "One episode of a show", cost: 40 },
      { id: uid(), name: "A fancy coffee", cost: 60 },
      { id: uid(), name: "Weekend lie-in", cost: 120 },
      { id: uid(), name: "Takeaway night", cost: 250 },
    ],
    owned: [], equip: {}, title: "Novice", days: {}, clears: {}, log: [],
  };
}

// Older saves used four attributes (Vitality, Spirit) and a Monk class: fold them into Health / Druid.
function migrate(st) {
  if (!st || st.v !== 1) return st;
  const old = { VIT: "HLT", SPI: "HLT" };
  (st.quests || []).forEach((q) => { if (old[q.stat]) q.stat = old[q.stat]; if (!STATS[q.stat]) q.stat = "HLT"; });
  const sx = st.statXp || {};
  if (!("HLT" in sx)) st.statXp = { STR: sx.STR || 0, INT: sx.INT || 0, HLT: (sx.VIT || 0) + (sx.SPI || 0) };
  if (!CLASSES[st.cls]) st.cls = "druid";
  return st;
}

/* ================= levels ================= */
const needFor = (l) => 60 + 40 * l;
function levelInfo(xp) { let l = 1, r = xp; while (r >= needFor(l)) { r -= needFor(l); l++; } return { level: l, into: r, need: needFor(l) }; }
function statLevel(x) { let l = 1, r = x; while (r >= 30 + 20 * l) { r -= 30 + 20 * l; l++; } return { level: l, into: r, need: 30 + 20 * l }; }

/* ================= sprite ================= */
const BASE = [
  "................", "................", "................", "................", "................",
  ".....oooooo.....", "....oHHHHHHo....", "....oHSSSSHo....", "....oSeSSeSo....", "....oSSSSSSo....",
  ".....oSSSSo.....", "...ooTTTTTToo...", "..oSoTTTTTToSo..", "..oSoTTTTTToSo..", "..ooobbbbbbooo..",
  "....oPPPPPPo....", "....oPPooPPo....", "....oPPooPPo....", "...oBBBooBBBo...", "...oooo..oooo...",
];
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
  const pal = { o: "#0b0d1f", H: "#5a3a22", S: "#f1c9a0", e: "#0b0d1f", T: dye ? dye.color : (CLASSES[cls] || CLASSES.warrior).tunic, b: "#6b4a2a", P: "#3a3f63", B: "#4a2f1e" };
  const layers = SLOTS.filter((s) => s !== "dye").map((s) => OVER[equip[s]]).filter(Boolean);
  const paint = (rows, p) => { for (const y in rows) { const r = rows[y]; for (let x = 0; x < 16; x++) { const c = r[x]; if (c && c !== "." && p[c]) { ctx.fillStyle = p[c]; ctx.fillRect(x, +y, 1, 1); } } } };
  layers.filter((l) => l.z === 0).forEach((l) => paint(l.rows, l.pal));
  paint(Object.fromEntries(BASE.map((r, i) => [i, r])), pal);
  layers.filter((l) => l.z === 1).forEach((l) => paint(l.rows, { ...pal, ...l.pal }));
}
function gearIcon(g) {
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
  const equip = {}; SLOTS.forEach((s) => { equip[s] = S.equip[s] || null; });
  try {
    await Promise.all([
      fb.setDoc(userRef, { save: JSON.stringify(S), at: S.at }),
      fb.setDoc(profileRef, {
        name: S.name.slice(0, 24), xp: S.xp, level: L.level, cls: S.cls, title: S.title,
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
    S.xp = Math.max(0, S.xp - r.xp); S.gold = Math.max(0, S.gold - r.gold); S.statXp[q.stat] = Math.max(0, (S.statXp[q.stat] || 0) - r.xp);
    if (S.clears[k]) { S.gold = Math.max(0, S.gold - S.clears[k]); delete S.clears[k]; }
    toast("Quest undone");
  } else {
    const d = DIFF[q.diff], bonus = CLASSES[S.cls].stat === q.stat ? 1.2 : 1;
    const xp = Math.round(d.xp * bonus), gold = d.gold;
    S.days[k][q.id] = { xp, gold }; S.xp += xp; S.gold += gold; S.statXp[q.stat] = (S.statXp[q.stat] || 0) + xp;
    logEvent("Completed “" + q.name + "” (+" + xp + " XP, +" + gold + " gold)");
    if (ev) floatText(ev, "+" + xp + " XP");
    if (S.quests.length && S.quests.every((x) => S.days[k][x.id]) && !S.clears[k]) {
      const b = Math.max(10, S.quests.length * 4); S.clears[k] = b; S.gold += b;
      logEvent("Full clear bonus! +" + b + " gold"); toast("Full clear! +" + b + " bonus gold");
    }
  }
  const after = levelInfo(S.xp).level;
  if (after > before) logEvent("Reached level " + after);
  save(); render();
  if (after > before) levelUp(after);
}
function levelUp(L) {
  const newGear = GEAR.filter((g) => g.lv === L).map((g) => g.name);
  const newTitle = TITLES.filter((t) => t.lv === L).map((t) => t.t);
  const el = $("#lvlup"); el.innerHTML = "";
  const w = document.createElement("div"); w.className = "win";
  w.innerHTML = '<div class="title-tag">LEVEL UP</div><h1></h1><canvas width="16" height="20" class="sprite"></canvas><p class="muted" style="margin:0"></p><button class="btn gold">Onward</button>';
  w.querySelector("h1").textContent = "Level " + L;
  drawSprite(w.querySelector("canvas"), S.cls, S.equip);
  const parts = [];
  if (newTitle.length) parts.push("New title: " + newTitle.join(", "));
  if (newGear.length) parts.push("Unlocked in the shop: " + newGear.join(", "));
  w.querySelector("p").textContent = parts.join(". ") || "Your attributes grow stronger.";
  el.appendChild(w); el.hidden = false;
  const ok = w.querySelector("button"); ok.focus(); ok.onclick = () => { el.hidden = true; };
}
function buyGear(g) {
  if (S.owned.includes(g.id)) { S.equip[g.slot] = S.equip[g.slot] === g.id ? null : g.id; save(); render(); return; }
  if (S.gold < g.cost) { toast("You need " + (g.cost - S.gold) + " more gold"); return; }
  S.gold -= g.cost; S.owned.push(g.id); S.equip[g.slot] = g.id;
  logEvent("Bought " + g.name + " for " + g.cost + " gold");
  save(); render(); toast(g.name + " equipped");
}
function claim(t) {
  if (S.gold < t.cost) { toast("You need " + (t.cost - S.gold) + " more gold"); return; }
  S.gold -= t.cost; logEvent("Claimed treasure: " + t.name + " (−" + t.cost + " gold)");
  save(); render(); toast("Enjoy it: " + t.name);
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
  const isNew = !q; q = q || { id: uid(), name: "", stat: "STR", diff: "easy" };
  let stat = q.stat, diff = q.diff;
  openSheet((w, close) => {
    w.innerHTML = "<h2>" + (isNew ? "New quest" : "Edit quest") + '</h2><label for="qn">Quest<input id="qn" maxlength="60" placeholder="e.g. Stretch for 5 minutes" autocomplete="off"></label><div><div class="note" style="margin-bottom:4px">Attribute it trains</div><div class="seg three" id="qs"></div></div><div><div class="note" style="margin-bottom:4px">Difficulty</div><div class="seg three" id="qd"></div></div><div class="actions"></div>';
    w.querySelector("#qn").value = q.name;
    segment(w.querySelector("#qs"), Object.fromEntries(Object.keys(STATS).map((k) => [k, { label: k, cls: k }])), stat, (k) => (stat = k));
    segment(w.querySelector("#qd"), Object.fromEntries(Object.entries(DIFF).map(([k, d]) => [k, { label: d.name + " · " + d.xp + "xp" }])), diff, (k) => (diff = k));
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
      Object.assign(q, { name: n, stat, diff }); if (isNew) S.quests.push(q);
      save(); render(); close(); toast(isNew ? "Quest added" : "Quest saved");
    };
    a.appendChild(ok);
  });
}
function treasureForm(t) {
  const isNew = !t; t = t || { id: uid(), name: "", cost: 50 };
  openSheet((w, close) => {
    w.innerHTML = "<h2>" + (isNew ? "New treasure" : "Edit treasure") + '</h2><label for="tn">Reward<input id="tn" maxlength="60" placeholder="e.g. Cinema trip" autocomplete="off"></label><label for="tc">Cost in gold<input id="tc" type="number" min="1" max="99999" inputmode="numeric"></label><div class="actions"></div>';
    w.querySelector("#tn").value = t.name; w.querySelector("#tc").value = t.cost;
    const a = w.querySelector(".actions");
    if (!isNew) {
      const del = document.createElement("button"); del.className = "btn ghost"; del.textContent = "Delete";
      armedDelete(del, () => { S.treasures = S.treasures.filter((x) => x.id !== t.id); save(); render(); close(); });
      a.appendChild(del);
    }
    const c = document.createElement("button"); c.className = "btn ghost"; c.textContent = "Cancel"; c.onclick = close; a.appendChild(c);
    const ok = document.createElement("button"); ok.className = "btn gold"; ok.textContent = isNew ? "Add treasure" : "Save";
    ok.onclick = () => {
      const n = w.querySelector("#tn").value.trim(); const cost = Math.max(1, parseInt(w.querySelector("#tc").value, 10) || 0);
      if (!n) { w.querySelector("#tn").focus(); return; }
      Object.assign(t, { name: n, cost }); if (isNew) S.treasures.push(t);
      save(); render(); close();
    };
    a.appendChild(ok);
  });
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
  $("#classname").textContent = CLASSES[S.cls].name;
  $("#gold").textContent = S.gold; document.querySelectorAll(".goldmirror").forEach((e) => (e.textContent = S.gold));
  $("#streak").textContent = dayStreak() + "-day streak";
  drawSprite($("#sprite"), S.cls, S.equip);

  // quests
  $("#today").textContent = new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "short" });
  const done = doneToday(); const ql = $("#qlist"); ql.innerHTML = "";
  if (!S.quests.length) ql.innerHTML = '<li class="muted" style="padding:10px 2px">No quests yet. Add a daily habit to start earning XP.</li>';
  S.quests.forEach((q) => {
    const li = document.createElement("li"); li.className = "q" + (done[q.id] ? " done" : "");
    const d = DIFF[q.diff], bonus = CLASSES[S.cls].stat === q.stat, st = questStreak(q.id);
    li.innerHTML = '<button class="check"></button><div class="qmain"><div class="qname"></div><div class="qmeta"><span class="chip ' + q.stat + '">' + q.stat + '</span><span class="num">' + Math.round(d.xp * (bonus ? 1.2 : 1)) + " XP · " + d.gold + "g</span>" + (st > 1 ? '<span class="flame num">' + st + "d streak</span>" : "") + '</div></div><button class="iconbtn">Edit</button>';
    li.querySelector(".qname").textContent = q.name;
    const chk = li.querySelector(".check");
    chk.textContent = done[q.id] ? "✓" : "";
    chk.setAttribute("aria-label", (done[q.id] ? "Undo " : "Complete ") + q.name);
    chk.setAttribute("aria-pressed", String(!!done[q.id]));
    chk.onclick = (e) => toggleQuest(q, e);
    const ed = li.querySelector(".iconbtn"); ed.setAttribute("aria-label", "Edit " + q.name); ed.onclick = () => questForm(q);
    ql.appendChild(li);
  });
  const n = S.quests.filter((q) => done[q.id]).length;
  $("#clearmsg").textContent = S.clears[today()] ? "★ Full clear today" : S.quests.length ? n + " of " + S.quests.length + " done · clear all for bonus gold" : "";

  // attributes
  const sg = $("#stats"); sg.innerHTML = "";
  Object.entries(STATS).forEach(([k, s]) => {
    const sl = statLevel(S.statXp[k] || 0);
    const el = document.createElement("div"); el.className = "stat " + k;
    el.innerHTML = '<span class="px stat-name">' + s.name + '</span><span class="stat-lv num">LV ' + sl.level + "</span><small>" + s.hint + '</small><div class="bar"><i style="width:' + (sl.into / sl.need) * 100 + '%"></i></div>';
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
  segment($("#classSeg"), Object.fromEntries(Object.entries(CLASSES).map(([k, c]) => [k, { label: c.name, cls: c.stat }])), S.cls, (k) => { S.cls = k; save(); render(); });
  $("#acct").textContent = me ? "Signed in as " + (me.email || me.displayName || "Google user") + ". Your progress syncs to every device you sign in on." : "";

  // gear
  const gg = $("#gear"); gg.innerHTML = "";
  GEAR.forEach((g) => {
    const own = S.owned.includes(g.id), eq = S.equip[g.slot] === g.id, locked = L.level < g.lv;
    const el = document.createElement("div"); el.className = "item" + (locked ? " locked" : "") + (eq ? " equipped" : "");
    el.appendChild(gearIcon(g));
    const h = document.createElement("span"); h.className = "px"; h.textContent = g.name;
    const p = document.createElement("p"); p.textContent = locked ? "Unlocks at level " + g.lv : g.desc;
    const b = document.createElement("button"); b.className = "btn" + (eq ? " gold" : own ? " ghost" : "");
    b.innerHTML = locked ? "LV " + g.lv : own ? (eq ? "Unequip" : "Equip") : '<i class="coin"></i>' + g.cost;
    b.disabled = locked; b.onclick = () => buyGear(g);
    el.append(h, p, b); gg.appendChild(el);
  });

  // treasures
  const tl = $("#tlist"); tl.innerHTML = "";
  if (!S.treasures.length) tl.innerHTML = '<li class="muted">Add a reward you would genuinely look forward to.</li>';
  S.treasures.forEach((t) => {
    const li = document.createElement("li"); li.className = "t";
    li.innerHTML = '<span class="tname"></span><button class="iconbtn">Edit</button><button class="btn gold"><i class="coin"></i>' + t.cost + "</button>";
    li.querySelector(".tname").textContent = t.name;
    li.querySelector(".iconbtn").onclick = () => treasureForm(t);
    const b = li.querySelector(".btn"); b.setAttribute("aria-label", "Claim " + t.name + " for " + t.cost + " gold"); b.onclick = () => claim(t);
    tl.appendChild(li);
  });

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
    const s = document.createElement("span"); s.textContent = (p.title || "Novice") + " · " + ((CLASSES[p.cls] || {}).name || "Hero");
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
const TABS = ["quests", "hero", "shop", "guild", "log"];
function showTab(t) {
  document.querySelectorAll(".nav button").forEach((x) => x.setAttribute("aria-current", String(x.dataset.tab === t)));
  TABS.forEach((p) => ($("#p-" + p).hidden = p !== t));
  history.replaceState(null, "", "#" + t); window.scrollTo(0, 0);
  if (t === "guild") { const box = $("#chatlog"); box.scrollTop = box.scrollHeight; updateUnread(); }
}
document.querySelectorAll(".nav button").forEach((b) => (b.onclick = () => showTab(b.dataset.tab)));
$("#addq").onclick = () => questForm(null);
$("#addt").onclick = () => treasureForm(null);
$("#nameIn").addEventListener("input", (e) => { S.name = e.target.value.trim() || "Adventurer"; $("#hname").textContent = S.name; save(); });
let resetArmed = false;
$("#resetBtn").onclick = () => {
  const b = $("#resetBtn");
  if (!resetArmed) {
    resetArmed = true; b.textContent = "Tap again to erase all progress"; b.className = "btn danger";
    setTimeout(() => { resetArmed = false; b.textContent = "Start a new save"; b.className = "btn ghost"; }, 4000);
    return;
  }
  S = freshState(S.name); save(); render(); resetArmed = false; b.textContent = "Start a new save"; b.className = "btn ghost"; toast("New save started");
};
$("#invite").onclick = async () => {
  const link = location.origin + location.pathname;
  try { await navigator.clipboard.writeText(link); toast("Invite link copied"); }
  catch (e) { toast(link); }
};
document.addEventListener("keydown", (e) => { if (e.key === "Escape") { $("#sheet").hidden = true; $("#lvlup").hidden = true; } });
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
  render();
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
