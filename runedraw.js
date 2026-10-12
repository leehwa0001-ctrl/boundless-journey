// 術陣師：自己畫陣紋＋新的施法流程（作者 2026-10-12）
// 一、陣紋（X 職業鍵打開繪製畫面）：正六邊形，六個頂點＋正中央共 7 個節點。
//   D 傷害（頂端，紅）、A 範圍（右上，紫）、S 速度（右下，黃）、B 格擋（底端，藍）、H 治療（左下，綠）、C 冷卻（左上，白）、M 魔力（中央，黑）。
//   點一下節點＝核心 Core（普攻加成）；按住左鍵拖過不同節點＝線段 Line（技能加成，效果看起點）；
//   拖回起點＝閉環 Loop（以自己為中心的光環，效果看起點；起點兩邊夾角要 ≥ 60°）。每個節點只能屬於一個圖形。右鍵刪掉圖形。
//   能用的節點：2 個，每 5 級 +1（最多 7）。存在 R.S.runeDraw。主畫面左邊顯示目前的陣紋與加成。
//   數值照作者的草案（PC＝圖形裡的節點數）。隊友效果只作用在身邊的 NPC 隊友（連線玩家另外的機制不動）。
// 二、施法：按技能 → 預覽範圍（50% 透明）→ 左鍵確認（再按同一個技能鍵取消）→ 1 秒蓄力（法陣越來越亮）→ 放出。
//   ★1 起每一招可以在陣紋畫面選【快速施法】（不用左鍵確認，攻擊法術在滑鼠處、增益法術在腳下）或【手動施法】。
//   普攻：半徑 2 公尺的地面法陣，0.5 秒後爆開（直接放在滑鼠處）。
// 三、法陣・癒：耗魔 25、持續 −30%（7→5 秒）、範圍 −30%、冷卻 20 秒。
// 放在 skillvar.js 之後、main.js 前面（index.html 最後面）。
(function (R) {
  if (!R || !R.CORE || !R.coreKit) return;
  const W = () => R.W, S = () => R.S, $ = id => document.getElementById(id);
  const isRM = P => !!(P && P.cls === 'arraymage' && W() && W().run && !W().town && P === W().P);
  // ---------- 節點 ----------
  const NODES = [
    { k: 'D', n: '傷害', c: '#E8443A', a: 90 }, { k: 'A', n: '範圍', c: '#A05AE8', a: 30 }, { k: 'S', n: '速度', c: '#F2D23A', a: -30 },
    { k: 'B', n: '格擋', c: '#3A7AE8', a: -90 }, { k: 'H', n: '治療', c: '#4AC85A', a: -150 }, { k: 'C', n: '冷卻', c: '#F4F4F4', a: 150 }, { k: 'M', n: '魔力', c: '#1A1A1A', a: null }
  ];
  const npos = (i, cx, cy, rad) => { const a = NODES[i].a; return a == null ? [cx, cy] : [cx + Math.cos(a * Math.PI / 180) * rad, cy - Math.sin(a * Math.PI / 180) * rad]; };
  const unit = i => npos(i, 0, 0, 1);
  const angOK = (s, b, c) => { const p = unit(s), q = unit(b), r = unit(c), v1 = [q[0] - p[0], q[1] - p[1]], v2 = [r[0] - p[0], r[1] - p[1]]; const cs = (v1[0] * v2[0] + v1[1] * v2[1]) / (Math.hypot(...v1) * Math.hypot(...v2)); return Math.acos(Math.max(-1, Math.min(1, cs))) * 180 / Math.PI >= 59.9; };
  const cap = P => Math.min(7, 2 + Math.floor(((P && P.lv) || 1) / 5));
  const shapes = () => { const s = S(); if (!s) return []; if (!Array.isArray(s.runeDraw)) s.runeDraw = []; s.runeDraw = s.runeDraw.filter(x => x && ['core', 'line', 'loop'].includes(x.t) && Array.isArray(x.n) && x.n.length && x.n.every(i => i >= 0 && i < 7)); return s.runeDraw; };
  const used = L => L.reduce((t, x) => t + x.n.length, 0);
  // ---------- 加成 ----------
  const pct = v => Math.round(v * 1000) / 10 + '%';
  const eff = () => {
    const P = W() && W().P, L = shapes(), E = { naDmg: 0, skDmg: 0, loopDmg: 0, naArea: 0, skArea: 0, loopArea: 0, atkSpd: 0, naWind: 0, skWind: 0, skDur: 0, loopWind: 0,
      coreShield: 0, lineShield: 0, loopShield: 0, naHeal: 0, skHeal: 0, loopHeal: 0, coreCd: 0, lineHaste: 0, loopHaste: 0, naMp: 0, skMp: 0, loopMp: 0, auras: [], lines: [] };
    let budget = cap(P);
    L.forEach(sh => {
      if ((budget -= sh.n.length) < 0) return;   // 等級不夠的部分不生效
      const k = NODES[sh.n[0]].k, pc = sh.n.length, t = sh.t;
      const add = s => E.lines.push([NODES[sh.n[0]].c, ({ core: '核心', line: '線段', loop: '閉環' })[t] + '・' + NODES[sh.n[0]].n + (t === 'core' ? '' : ' ' + pc), s]);
      if (k === 'D') { if (t === 'core') { E.naDmg += 0.25; add('普攻傷害 +25%'); } else if (t === 'line') { E.skDmg += pc * 0.1; add('技能傷害 +' + pc * 10 + '%'); } else { E.loopDmg += 0.15 * pc / 2; add('傷害 +' + pct(0.15 * pc / 2) + '（隊友減半）'); } }
      if (k === 'A') { if (t === 'core') { E.naArea += 0.4; add('普攻範圍 +40%'); } else if (t === 'line') { E.skArea += pc * 0.1; add('技能範圍 +' + pc * 10 + '%'); } else { E.loopArea += 0.2 * pc / 2; add('攻擊範圍 +' + pct(0.2 * pc / 2) + '（隊友減半）'); } }
      if (k === 'S') { if (t === 'core') { E.atkSpd += 0.2; E.naWind += 0.5; add('攻速 +20%、普攻前搖 −50%'); } else if (t === 'line') { E.skWind += pc * 0.1; E.skDur += pc * 0.05; add('技能前搖 −' + pc * 10 + '%、持續 +' + pc * 5 + '%'); } else { E.atkSpd += 0.2 * pc / 2; E.loopWind += pc * 0.1; add('攻速 +' + pct(0.2 * pc / 2) + '、所有前搖 −' + pc * 10 + '%'); } }
      if (k === 'B') { if (t === 'core') { E.coreShield = 0.01; add('普攻護盾 1% 魔上限（5 層）'); } else if (t === 'line') { E.lineShield = pc * 0.03; add('技能護盾 ' + pc * 3 + '% 魔上限（2 層）'); } else { E.loopShield = (2 + pc) / 1000; add('每秒護盾 ' + pct((2 + pc) / 1000) + ' 魔上限（10 層）'); } }
      if (k === 'H') { if (t === 'core') { E.naHeal = 0.01; add('普攻回復 1% 魔上限'); } else if (t === 'line') { E.skHeal += pc * 0.1; add('技能治療 +' + pc * 10 + '%'); } else { E.loopHeal = pc * 0.01; add('每 5 秒治療 ' + pc + '% 魔上限'); } }
      if (k === 'C') { if (t === 'core') { E.coreCd = 1; add('普攻減技能冷卻'); } else if (t === 'line') { E.lineHaste += 10 + pc * 10; add('技能急速 +' + (10 + pc * 10)); } else { E.loopHaste += 10 * pc; add('技能急速 +' + 10 * pc + '（範圍內）'); } }
      if (k === 'M') { if (t === 'core') { E.naMp = 0.75; add('普攻耗魔 −75%'); } else if (t === 'line') { E.skMp = Math.min(0.9, pc * 0.1); add('技能耗魔 −' + pc * 10 + '%'); } else { E.loopMp = 1 + pc / 2; add('每秒回魔 +' + (1 + pc / 2)); } }
      if (t === 'loop') E.auras.push({ k, pc });
    });
    const ar = 1 + E.skArea + E.loopArea; E.auras.forEach(a => { a.r = a.pc * ar; });
    E.charge = Math.max(0.2, 1 - E.skWind - E.loopWind);
    E.naDelay = Math.max(0.1, 0.5 * (1 - E.naWind) * (1 - Math.min(0.8, E.loopWind)));
    return E;
  };
  let EC = null, ecT = -1; const E = () => { const t = R.coreTime(); if (!EC || t !== ecT) { EC = eff(); ecT = t; } return EC; };
  const dirty = () => { EC = null; hudSig = ''; };
  const auraOf = (k) => E().auras.find(a => a.k === k);

  // ---------- 地面法陣（自己的 mesh） ----------
  const ground = (x, z, r, col, op) => {
    const T = window.THREE, w = W(); if (!T || !w || !w.scene) return { set() { }, rm() { }, move() { } };
    const g = new T.Group(), c = new T.Color(col);
    const m1 = new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op * 0.35, depthWrite: false, side: T.DoubleSide });
    const m2 = new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide });
    const m3 = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide });
    const d = new T.Mesh(new T.CircleGeometry(1, 40), m1), ring = new T.Mesh(new T.RingGeometry(0.9, 1, 48), m2), inner = new T.Mesh(new T.RingGeometry(0.55, 0.62, 6), m2), glow = new T.Mesh(new T.RingGeometry(0.85, 1, 48), m3);
    [d, ring, inner, glow].forEach(m => { m.rotation.x = -Math.PI / 2; g.add(m); });
    g.scale.set(r, 1, r); g.position.set(x, 0.07, z); w.scene.add(g);
    return {
      g, move(x2, z2, r2) { g.position.set(x2, 0.07, z2); if (r2) g.scale.set(r2, 1, r2); },
      set(o, k) { m1.opacity = o * 0.35; m2.opacity = o; inner.rotation.z += 0.05; if (k != null) { m3.opacity = k; glow.scale.setScalar(1.6 - 0.6 * k); } },
      rm() { try { w.scene.remove(g); [d, ring, inner, glow].forEach(m => { m.geometry.dispose(); }); m1.dispose(); m2.dispose(); m3.dispose(); } catch (e) { } }
    };
  };
  const tick = (f) => { const w = W(); if (!w || !w.dyn) return; const run = w.run; w.dyn.push(dt => (W().run === run ? f(dt) : (f(-1), false))); };   // f(-1)＝換樓層，清掉

  // ---------- 施法分類 ----------
  const SELF_T = { buff: 1, heal: 1, guard: 1, parry: 1, orbit: 1, storm: 1 };
  const libOf = id => R.SKILL_LIB && R.SKILL_LIB[id];
  const isSelf = L => { if (!L) return true; const p = L.p || {}; if (p.self) return true; if (SELF_T[L.type]) return true; if (L.type === 'combo') return !(p.parts || []).some(x => !SELF_T[x[0]] && !(x[1] && x[1].self)); return false; };
  const aimPt = (P, max) => { const ax = P.aimX != null ? P.aimX : P.x + Math.sin(P.aimA) * 6, az = P.aimZ != null ? P.aimZ : P.z + Math.cos(P.aimA) * 6, d = Math.hypot(ax - P.x, az - P.z), k = d > max ? max / d : 1; return [P.x + (ax - P.x) * k, P.z + (az - P.z) * k]; };
  const skR = L => { const p = (L && L.p) || {}; const q = L && L.type === 'combo' ? Object.assign({}, ...(p.parts || []).map(x => x[1] || {})) : p; return (q.r || (L && L.type === 'blink' ? 0.9 : 1.6)) * (1 + E().skArea + E().loopArea); };
  const skRange = L => { const p = (L && L.p) || {}; const q = L && L.type === 'combo' ? Object.assign({}, ...(p.parts || []).map(x => x[1] || {})) : p; return q.range || q.range0 || 10; };
  const rankOf = id => (R.skillRank ? R.skillRank(id) || 0 : 0);
  const coarse = () => { try { return matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches; } catch (e) { return false; } };
  const quick = id => { if (coarse()) return true; const s = S(); return rankOf(id) >= 1 && !!(s && s.rmQuick && s.rmQuick[id]); };   // 手機沒有滑鼠可以確認：一律快速施法
  const cdOf = (P, i) => (i === 0 ? P.skillCd || 0 : (P.skCd && P.skCd[i]) || 0);
  const setCd = (P, i, v) => { if (i === 0) P.skillCd = v; else { P.skCd = P.skCd || []; P.skCd[i] = v; } };

  // ---------- 施法流程 ----------
  let pend = null, chg = null;   // pend：等左鍵確認；chg：蓄力中
  const us0 = R.useSkill, cs0 = R.castSlot;
  const idOf = (P, i) => (i === 0 ? P.skill : R.slotSkill ? R.slotSkill(P, i) : null);
  const clearPend = () => { if (pend) { pend.m.rm(); pend = null; } };
  const release = (i, x, z, self) => {
    const P = W().P; if (!P) return;
    const ax = P.aimX, az = P.aimZ, aa = P.aimA;
    if (!self) { P.aimX = x; P.aimZ = z; P.aimA = Math.atan2(x - P.x, z - P.z); }
    const c0 = cdOf(P, i), mp0 = P.mp, id = idOf(P, i);
    try { inCast = true; if (i === 0) us0(); else cs0(i); } finally { inCast = false; if (!self) { P.aimX = ax; P.aimZ = az; P.aimA = aa; } }
    const c1 = cdOf(P, i);
    if (c1 > c0 + 0.01) {
      const e = E(), sk = R.SKILLS[id], h = Math.max(0, P.haste || 0), add = e.lineHaste + e.loopHaste;
      if (add > 0) setCd(P, i, c1 * (100 + h) / (100 + h + add));
      if (e.skMp > 0 && sk && P.mp < mp0) P.mp = Math.min(P.mpMax, P.mp + (mp0 - P.mp) * e.skMp);
      if (e.lineShield > 0) shieldAdd(P, P.mpMax * e.lineShield, P.mpMax * e.lineShield * 2);
    }
  };
  let inCast = false;
  const startCharge = (i, id, x, z, self) => {
    const P = W().P, L = libOf(id), col = R.SKILL_LIB && L && L.p && L.p.color || '#7AC8E8';
    const r = skR(L), m = pend && pend.i === i ? pend.m : ground(self ? P.x : x, self ? P.z : z, r, col, 0.5);
    pend = null;
    const dur = E().charge; let t = 0;
    chg = { i, m };
    R.num && R.num(P.x, 2.6, P.z, '蓄陣…', 'heal');
    tick(dt => {
      if (dt < 0) { m.rm(); chg = null; return false; }
      if (W().paused) return true;
      const P2 = W().P; if (!P2 || P2.dead) { m.rm(); chg = null; return false; }
      t += dt; const k = Math.min(1, t / dur);
      if (self) m.move(P2.x, P2.z);
      m.set(0.5 + 0.5 * k, k);
      if (t >= dur) { m.rm(); chg = null; release(i, x, z, self); R.fx && R.fx('pillar', self ? P2.x : x, 0, self ? P2.z : z, { color: col }); return false; }
      return true;
    });
  };
  const ready = (P, i, id) => {
    const sk = R.SKILLS[id]; if (!sk) return false;
    if (cdOf(P, i) > 0) return false;
    if (P.dead || P.knockT > 0 || P.jump || P.stance > 0) return false;
    if (P.mp < sk.mp) { R.toast && R.toast('魔力不夠'); return false; }
    return true;
  };
  const press = i => {
    const w = W(), P = w.P; if (!P || !w.run || w.paused) return;
    const id = idOf(P, i);
    if (!id) return i === 0 ? us0() : cs0(i);   // 沒裝技能：讓原本的提示出來
    if (!libOf(id)) return i === 0 ? us0() : cs0(i);   // 不是技能書的技能：照舊
    if (chg) return;   // 蓄力中不能換
    if (pend && pend.i === i) { clearPend(); R.toast && R.toast('取消施法', '#C8C0B0'); return; }
    if (!ready(P, i, id)) return;
    clearPend();
    const L = libOf(id), self = isSelf(L);
    if (quick(id)) { const [x, z] = self ? [P.x, P.z] : aimPt(P, skRange(L)); startCharge(i, id, x, z, self); return; }
    const col = (L.p && L.p.color) || '#7AC8E8', [x, z] = self ? [P.x, P.z] : aimPt(P, skRange(L));
    pend = { i, id, self, L, m: ground(x, z, skR(L), col, 0.5) };
    tick(dt => {
      if (dt < 0) { clearPend(); return false; }
      if (!pend || pend.id !== id || pend.i !== i) return false;
      const P2 = W().P; if (!P2 || P2.dead) { clearPend(); return false; }
      const [x2, z2] = pend.self ? [P2.x, P2.z] : aimPt(P2, skRange(L)); pend.m.move(x2, z2, skR(L)); pend.m.set(0.5);
      return true;
    });
  };
  const confirm = () => {
    const P = W().P; if (!pend || !P) return;
    const p = pend; if (!ready(P, p.i, p.id)) { clearPend(); return; }
    const [x, z] = p.self ? [P.x, P.z] : aimPt(P, skRange(p.L));
    startCharge(p.i, p.id, x, z, p.self);
  };
  R.useSkill = (...a) => { const P = W() && W().P; if (!isRM(P) || inCast) return R._rmUs0 ? R._rmUs0(...a) : us0(...a); return press(0); };
  R._rmUs0 = us0;
  R.castSlot = i => { const P = W() && W().P; if (!isRM(P) || inCast) return cs0(i); if (i === 0) return R.useSkill(); return press(i); };
  // 左鍵：有技能在等確認＝確認；否則照舊普攻
  window.addEventListener('mousedown', e => {
    if (!pend || e.button !== 0) return; const w = W(); if (!w || !w.run || w.paused || !e.target || e.target.tagName !== 'CANVAS') return;
    e.stopPropagation(); e.preventDefault(); if (R.input) R.input.fire = false; confirm();
  }, true);
  window.addEventListener('keydown', e => { if (e.key === 'Escape' && pend) { clearPend(); e.stopPropagation(); } }, true);

  // ---------- 普攻：地面法陣 ----------
  let naCap = null;
  const fi0 = R.fire;
  R.fire = o => {
    if (naCap && o && o.owner === 'p' && o.primary) { naCap.dmg += o.dmg || 0; if (!naCap.n++) naCap.splash = o.radius || 0; return { dead: true, hit: new Set(), mesh: null }; }
    return fi0(o);
  };
  const at0 = R.attack;
  R.attack = (...a) => {
    const P = W() && W().P; if (!isRM(P) || !P.ws || P.ws.kind !== 'magic') return at0(...a);
    if (pend || chg) return;
    const cd0 = P.atkCd || 0, mp0 = P.mp; naCap = { dmg: 0, n: 0 };
    let cap0; try { at0(...a); } finally { cap0 = naCap; naCap = null; }
    if (!cap0.n) return;
    const e = E();
    if ((P.atkCd || 0) > cd0 + 0.001 && e.atkSpd > 0) P.atkCd /= 1 + e.atkSpd;
    if (e.naMp > 0 && P.mp < mp0) P.mp += (mp0 - P.mp) * e.naMp;
    const [x, z] = aimPt(P, (P.ws.range || 12)), r = 2 * (1 + e.naArea + e.loopArea), dmg = cap0.dmg * (1 + e.naDmg), dl = e.naDelay;
    const m = ground(x, z, r, '#7AC8E8', 0.45); let t = 0;
    tick(dt => {
      if (dt < 0) { m.rm(); return false; }
      if (W().paused) return true;
      t += dt; m.set(0.45 + 0.55 * Math.min(1, t / dl), Math.min(1, t / dl));
      if (t < dl) return true;
      m.rm(); R.fx && R.fx('ring', x, 0.1, z, { r, color: '#9AE8FF' });
      const n = R.aoe(x, z, r, dmg, { primary: true });
      const P2 = W().P; if (!P2) return false; const e2 = E();
      if (e2.coreShield) shieldAdd(P2, P2.mpMax * e2.coreShield, P2.mpMax * e2.coreShield * 5);
      if (e2.naHeal && R.healP) R.healP(P2.mpMax * e2.naHeal, true);
      if (e2.coreCd) { const v = 1 / (2 + e2.atkSpd); P2.skillCd = Math.max(0, (P2.skillCd || 0) - v); if (P2.skCd) P2.skCd = P2.skCd.map(c => Math.max(0, (c || 0) - v)); }
      return false;
    });
  };
  const shieldAdd = (u, amt, max) => { if (!(amt > 0)) return; const cur = u.shield || 0; u.shield = cur >= max ? cur : Math.min(max, cur + amt); if (u === W().P) { u.buff = u.buff || {}; u.buff.shieldT = Math.max(u.buff.shieldT || 0, 6); } else u.shieldT = Math.max(u.shieldT || 0, 6); };

  // ---------- 技能的參數：傷害、範圍、持續、治療 ----------
  const T = R.SKILL_TYPES;
  if (T) Object.keys(T).forEach(k => {
    const f = T[k];
    T[k] = (s, P, w, pw) => {
      if (!isRM(P) || !s || s._rm) return f(s, P, w, pw);
      const e = E(); s = Object.assign({}, s, { _rm: 1 });
      const ar = 1 + e.skArea + e.loopArea; if (ar !== 1) { if (s.r) s.r *= ar; if (s.hitR) s.hitR *= ar; }
      if (e.skDur) { if (s.t) s.t *= 1 + e.skDur; if (s.life) s.life *= 1 + e.skDur; }
      if (e.skHeal) { if (s.pct) s.pct *= 1 + e.skHeal; if (s.allies) s.allies *= 1 + e.skHeal; if (s.zone === 'sanct') s.healK = (s.healK || 1) * (1 + e.skHeal); }
      return f(s, P, w, (pw || 0) * (1 + e.skDmg));
    };
  });
  // 閉環的傷害光環：你打的全部傷害（反傷除外）
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (en, raw, o) => { const P = W() && W().P; if (isRM(P) && !(o && (o.reflect || o.thorns))) { const l = E().loopDmg; if (l) raw *= 1 + l; } return he0(en, raw, o); };
  const ah0 = R.allyHit;
  if (ah0) R.allyHit = (en, dmg, by) => { const P = W() && W().P, a = isRM(P) && auraOf('D'); if (a && by && by.x != null && Math.hypot(by.x - P.x, by.z - P.z) <= a.r && !by.rival) dmg *= 1 + E().loopDmg / 2; return ah0(en, dmg, by); };

  // ---------- 閉環的光環（每幀） ----------
  let auraT = { B: 0, H: 0 }, auraMesh = null, auraSig = '';
  const allies = P => (W().allies || []).filter(a => !a.downed && !a.rival);
  const st0 = R.step;
  R.step = dt => {
    const r = st0(dt);
    try {
      const w = W(), P = w && w.P;
      if (!isRM(P) || w.paused) { if (auraMesh && (!isRM(P))) { auraMesh.rm(); auraMesh = null; auraSig = ''; } return r; }
      const e = E();
      // 光環外觀：腳下畫目前的陣紋
      const big = e.auras.reduce((m, a) => Math.max(m, a.r), 0), sig = big + JSON.stringify(shapes()) + (w.run && w.run.floor);
      if (sig !== auraSig || (auraMesh && auraMesh.run !== w.run)) { if (auraMesh) auraMesh.rm(); auraMesh = big ? runeMesh(big) : null; if (auraMesh) auraMesh.run = w.run; auraSig = sig; }
      if (auraMesh) { auraMesh.g.position.set(P.x, 0.06, P.z); auraMesh.g.rotation.y += dt * 0.3; }
      const inR = (u, a) => Math.hypot(u.x - P.x, u.z - P.z) <= a.r;
      const b = auraOf('B'); if (b && (auraT.B += dt) >= 1) { auraT.B = 0; const amt = P.mpMax * e.loopShield; shieldAdd(P, amt, amt * 10); allies(P).forEach(al => { if (inR(al, b)) shieldAdd(al, amt, amt * 10); }); }
      const h = auraOf('H'); if (h && (auraT.H += dt) >= 5) { auraT.H = 0; const amt = P.mpMax * e.loopHeal; R.healP && R.healP(amt); allies(P).forEach(al => { if (inR(al, h)) { al.hp = Math.min(al.hpMax, al.hp + amt); R.fx && R.fx('ring', al.x, 0.1, al.z, { r: 1, color: '#4AC85A' }); } }); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: h.r, color: '#4AC85A' }); }
      if (e.loopMp) P.mp = Math.min(P.mpMax, P.mp + e.loopMp * dt);
    } catch (err) { console.warn('[runedraw]', err); }
    return r;
  };
  const drawRune = (ctx, cx, cy, rad, L, o) => {
    o = o || {}; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = o.frame || 'rgba(160,200,230,.35)'; ctx.lineWidth = o.fw || 1.5; ctx.beginPath();
    for (let i = 0; i < 6; i++) { const [x, y] = npos(i, cx, cy, rad); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); ctx.stroke();
    L.forEach(sh => {
      const c = NODES[sh.n[0]].c; ctx.strokeStyle = c === '#1A1A1A' ? '#5A5A6A' : c; ctx.lineWidth = o.lw || 4;
      if (sh.t === 'core') { const [x, y] = npos(sh.n[0], cx, cy, rad); ctx.beginPath(); ctx.arc(x, y, o.cr || 14, 0, 7); ctx.stroke(); return; }
      ctx.beginPath(); sh.n.forEach((i, j) => { const [x, y] = npos(i, cx, cy, rad); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); if (sh.t === 'loop') { ctx.closePath(); ctx.fillStyle = (c === '#1A1A1A' ? '#5A5A6A' : c) + '33'; ctx.fill(); } ctx.stroke();
    });
    if (o.nodes !== false) NODES.forEach((N, i) => { const [x, y] = npos(i, cx, cy, rad); ctx.fillStyle = N.c; ctx.strokeStyle = '#DDE'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, o.nr || 6, 0, 7); ctx.fill(); ctx.stroke(); });
  };
  const runeMesh = r => {
    const T3 = window.THREE, w = W(); if (!T3 || !w.scene) return null;
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const ctx = cv.getContext('2d');
    ctx.strokeStyle = 'rgba(122,200,232,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(128, 128, 124, 0, 7); ctx.stroke();
    drawRune(ctx, 128, 128, 100, shapes(), { frame: 'rgba(122,200,232,.8)', fw: 3, lw: 7, cr: 18, nodes: false });
    const tex = new T3.CanvasTexture(cv), mat = new T3.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.45, depthWrite: false, side: T3.DoubleSide });
    const m = new T3.Mesh(new T3.PlaneGeometry(2 * r, 2 * r), mat); m.rotation.x = -Math.PI / 2; const g = new T3.Group(); g.add(m); w.scene.add(g);
    return { g, rm() { try { w.scene.remove(g); m.geometry.dispose(); mat.dispose(); tex.dispose(); } catch (e) { } } };
  };

  // ---------- 繪製畫面 ----------
  const css = document.createElement('style');
  css.textContent = '#rd-ov{position:fixed;inset:0;z-index:9000;background:rgba(6,8,14,.78);display:flex;align-items:center;justify-content:center;color:#E8E2D4;font-size:13px}'
    + '#rd-box{display:flex;gap:16px;background:rgba(18,22,32,.96);border:1px solid #4A8AA8;border-radius:10px;padding:14px 16px;max-width:96vw;max-height:94vh;overflow:auto}'
    + '#rd-box h3{margin:0 0 6px;color:#9AE8FF;font-size:16px}#rd-cv{background:#0C1018;border-radius:8px;cursor:crosshair;touch-action:none}'
    + '#rd-side{width:300px;display:flex;flex-direction:column;gap:6px}#rd-side .l{display:flex;gap:6px;align-items:flex-start;line-height:1.35}#rd-side .l i{width:10px;height:10px;border-radius:50%;flex:none;margin-top:3px;border:1px solid #889}'
    + '#rd-side .q{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:2px 0;border-bottom:1px solid rgba(255,255,255,.06)}#rd-side .q button{font-size:11px;padding:2px 7px;border-radius:5px;border:1px solid #4A8AA8;background:#132030;color:#CFE;cursor:pointer}#rd-side .q button.on{background:#4A8AA8;color:#fff}#rd-side .q button:disabled{opacity:.4;cursor:default}'
    + '#rd-side .sm{color:#9A94A0;font-size:11.5px}#rd-btn{display:flex;gap:8px;margin-top:4px}#rd-btn button{padding:4px 12px;border-radius:6px;border:1px solid #6A8AA0;background:#1C2A38;color:#EEF;cursor:pointer}'
    + '#rd-hud{position:fixed;left:8px;top:34%;z-index:6;width:150px;padding:5px 6px;border-radius:8px;background:rgba(14,18,26,.82);border:1px solid #4A8AA8;color:#E8E2D4;font-size:10.5px;pointer-events:none}#rd-hud .t{color:#9AE8FF;font-weight:600;margin-bottom:2px}#rd-hud .l{display:flex;gap:4px;line-height:1.3}#rd-hud .l i{width:7px;height:7px;border-radius:50%;flex:none;margin-top:3px;border:1px solid #889}';
  document.head.appendChild(css);
  let ov = null, drag = null, wasPaused = false;
  const SZ = 360, CX = 180, CY = 180, RAD = 130, HIT = 20;
  const nodeAt = (x, y) => { for (let i = 0; i < 7; i++) { const [nx, ny] = npos(i, CX, CY, RAD); if (Math.hypot(nx - x, ny - y) < HIT) return i; } return -1; };
  const occ = () => { const s = new Set(); shapes().forEach(sh => sh.n.forEach(i => s.add(i))); return s; };
  const segD = (px, py, a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], l = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - a[0]) * dx + (py - a[1]) * dy) / l)); return Math.hypot(px - a[0] - t * dx, py - a[1] - t * dy); };
  const shapeAt = (x, y) => shapes().findIndex(sh => {
    if (sh.n.some(i => { const [nx, ny] = npos(i, CX, CY, RAD); return Math.hypot(nx - x, ny - y) < HIT; })) return true;
    const pts = sh.n.map(i => npos(i, CX, CY, RAD)); if (sh.t === 'loop') pts.push(pts[0]);
    for (let j = 0; j + 1 < pts.length; j++) if (segD(x, y, pts[j], pts[j + 1]) < 8) return true; return false;
  });
  const canAdd = (i, P) => { if (!drag) return false; const p = drag.path, o = occ(); if (p.includes(i) || o.has(i)) return false; return used(shapes()) + p.length < cap(P); };
  const canClose = i => drag && drag.path.length >= 3 && i === drag.path[0] && angOK(drag.path[0], drag.path[1], drag.path[drag.path.length - 1]);
  const paint = () => {
    if (!ov) return; const P = W().P, cv = ov.querySelector('#rd-cv'), ctx = cv.getContext('2d'); ctx.clearRect(0, 0, SZ, SZ);
    drawRune(ctx, CX, CY, RAD, shapes(), { nr: 0 });
    if (drag && drag.path.length) {
      const c = NODES[drag.path[0]].c; ctx.strokeStyle = c === '#1A1A1A' ? '#7A7A8A' : c; ctx.lineWidth = 4; ctx.setLineDash([6, 5]); ctx.beginPath();
      drag.path.forEach((i, j) => { const [x, y] = npos(i, CX, CY, RAD); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.lineTo(drag.mx, drag.my); ctx.stroke(); ctx.setLineDash([]);
    }
    const o = occ();
    NODES.forEach((N, i) => {
      const [x, y] = npos(i, CX, CY, RAD), glow = drag && drag.moved && (canAdd(i, P) || canClose(i));
      if (glow) { ctx.fillStyle = 'rgba(255,240,170,.35)'; ctx.beginPath(); ctx.arc(x, y, 19, 0, 7); ctx.fill(); }
      ctx.fillStyle = N.c; ctx.strokeStyle = glow ? '#FFF0A0' : o.has(i) ? '#FFFFFF' : '#8A90A0'; ctx.lineWidth = glow ? 3 : 1.5; ctx.beginPath(); ctx.arc(x, y, 10, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = N.k === 'C' || N.k === 'S' ? '#222' : '#FFF'; ctx.font = 'bold 11px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(N.k, x, y + 0.5);
      const [lx, ly] = N.a == null ? [x, y + 22] : npos(i, CX, CY, RAD + 26); ctx.fillStyle = '#B8C0CC'; ctx.font = '11px sans-serif'; ctx.fillText(N.n, lx, ly);
    });
  };
  const side = () => {
    if (!ov) return; const P = W().P, e = eff(), L = shapes();
    const q = (R.loadoutOf ? R.loadoutOf('arraymage') : []).filter(id => id && libOf(id));
    const s = S(); s.rmQuick = s.rmQuick || {};
    ov.querySelector('#rd-side').innerHTML = '<h3>陣紋</h3><div class="sm">節點 ' + used(L) + '／' + cap(P) + '（每 5 級 +1，最多 7）。點節點＝核心（普攻）；按住左鍵拖過節點＝線段（技能）；拖回起點＝閉環（光環，起點夾角 ≥ 60°）。右鍵刪掉圖形。效果看起點的顏色。</div>'
      + (e.lines.length ? e.lines.map(l => '<div class="l"><i style="background:' + l[0] + '"></i><span><b>' + l[1] + '</b>：' + l[2] + '</span></div>').join('') : '<div class="sm">還沒畫任何陣紋。</div>')
      + (e.auras.length ? '<div class="sm">光環半徑：' + e.auras.map(a => a.k + ' ' + (Math.round(a.r * 10) / 10) + 'm').join('、') + '</div>' : '')
      + '<h3 style="margin-top:6px">施法方式</h3><div class="sm">技能熟練度 ★1 起可選。快速施法：按下就蓄力（攻擊在滑鼠處、增益在腳下）；手動：先預覽、左鍵確認。蓄力 ' + (Math.round(e.charge * 100) / 100) + ' 秒。</div>'
      + q.map(id => { const ok = rankOf(id) >= 1, on = ok && s.rmQuick[id]; return '<div class="q"><span>' + R.esc((R.SKILLS[id] || {}).name || id) + '</span><span><button data-q="' + id + '" data-v="0" class="' + (on ? '' : 'on') + '"' + (ok ? '' : ' disabled') + '>手動施法</button> <button data-q="' + id + '" data-v="1" class="' + (on ? 'on' : '') + '"' + (ok ? '' : ' disabled title="熟練度 ★1 才能選"') + '>快速施法</button></span></div>'; }).join('')
      + '<div id="rd-btn"><button data-a="clear">全部清掉</button><button data-a="close">完成（X）</button></div>';
  };
  const refresh = () => { dirty(); paint(); side(); };
  const close = () => { if (!ov) return; ov.remove(); ov = null; drag = null; const w = W(); if (w) w.paused = wasPaused; if (R.input) { R.input.fire = false; R.input.keys = {}; } };
  const open = () => {
    const w = W(); if (ov || !w || !w.run) return;
    clearPend(); wasPaused = !!w.paused; w.paused = true; if (R.input) R.input.fire = false;
    ov = document.createElement('div'); ov.id = 'rd-ov';
    ov.innerHTML = '<div id="rd-box"><canvas id="rd-cv" width="' + SZ + '" height="' + SZ + '"></canvas><div id="rd-side"></div></div>';
    document.body.appendChild(ov);
    const cv = ov.querySelector('#rd-cv'), pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * SZ / r.width, (e.clientY - r.top) * SZ / r.height]; };
    cv.addEventListener('contextmenu', e => { e.preventDefault(); const [x, y] = pos(e), k = shapeAt(x, y); if (k >= 0) { shapes().splice(k, 1); refresh(); } });
    cv.addEventListener('pointerdown', e => {
      if (e.button !== 0) return; const [x, y] = pos(e), i = nodeAt(x, y); if (i < 0) return;
      if (occ().has(i)) { R.toast && R.toast('這個節點已經用掉了（右鍵刪掉那個圖形）', '#C8C0B0'); return; }
      if (used(shapes()) >= cap(W().P)) { R.toast && R.toast('節點用完了（每 5 級多 1 個）', '#C8C0B0'); return; }
      drag = { path: [i], mx: x, my: y, moved: false }; cv.setPointerCapture && cv.setPointerCapture(e.pointerId); paint();
    });
    cv.addEventListener('pointermove', e => {
      if (!drag) return; const [x, y] = pos(e); drag.mx = x; drag.my = y; const i = nodeAt(x, y);
      if (i !== drag.path[0] || drag.path.length > 1) drag.moved = drag.moved || i !== drag.path[drag.path.length - 1] || Math.hypot(x - npos(drag.path[0], CX, CY, RAD)[0], y - npos(drag.path[0], CX, CY, RAD)[1]) > HIT;
      if (i >= 0 && canClose(i)) { shapes().push({ t: 'loop', n: drag.path.slice() }); drag = null; refresh(); return; }
      if (i >= 0 && canAdd(i, W().P)) drag.path.push(i);
      paint();
    });
    const up = () => {
      if (!drag) return; const p = drag.path;
      if (p.length === 1 && !drag.moved) shapes().push({ t: 'core', n: [p[0]] });
      else if (p.length >= 2) shapes().push({ t: 'line', n: p.slice() });
      drag = null; refresh();   // 拖了卻沒連到別的節點：放開＝取消
    };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', () => { drag = null; paint(); });
    ov.addEventListener('click', e => {
      const b = e.target.closest && e.target.closest('button'); if (!b) { if (e.target === ov) close(); return; }
      if (b.dataset.q) { const s = S(); s.rmQuick = s.rmQuick || {}; s.rmQuick[b.dataset.q] = b.dataset.v === '1'; side(); return; }
      if (b.dataset.a === 'clear') { S().runeDraw = []; refresh(); } if (b.dataset.a === 'close') close();
    });
    refresh();
  };
  window.addEventListener('keydown', e => { if (!ov) return; const k = e.key.toLowerCase(); e.stopPropagation(); if (k === 'escape' || k === 'x') { e.preventDefault(); close(); } }, true);
  R.runeDrawOpen = () => !!ov; R.runeDraw = { open, close, eff, angOK, cap };

  // ---------- 職業鍵、量表 ----------
  const C = R.CORE.arraymage;
  if (C) {
    C.act = P => { if (chg) return; open(); };
    const help0 = C.help;
    C.help = P => '陣紋：X 打開繪製畫面，在六邊形上畫核心（普攻）、線段（技能）、閉環（光環）。施法：按技能先預覽、左鍵確認、蓄力 1 秒放出（★1 起可改快速施法）；普攻是地面法陣 0.5 秒後爆開。法陣類技能仍會留下閉環的點。' + (help0 ? '｜' + help0(P).replace(/X 陣眼：[^。]*。/, '') : '');
    C.gauge = P => { const e = E(), L = shapes(), sk = pend ? (R.SKILLS[pend.id] || {}).name : null; return { name: '陣紋 ' + used(L) + '／' + cap(P), v: used(L), max: cap(P), text: chg ? '蓄陣中…' : sk ? sk + '：左鍵施放、再按一次取消' : (e.lines.length ? e.lines.length + ' 個圖形生效' : '還沒畫陣紋'), x: '陣紋' }; };
  }
  // ---------- 主畫面左邊：陣紋與加成 ----------
  let hud = null, hudSig = '', hudT = 0;
  const st1 = R.step;
  R.step = dt => {
    const r = st1(dt);
    try {
      if ((hudT -= dt) > 0) return r; hudT = 0.25;
      const P = W() && W().P, show = isRM(P) && !W().town;
      if (!hud || !hud.isConnected) { const host = $('run'); if (!host) return r; hud = document.createElement('div'); hud.id = 'rd-hud'; hud.className = 'dungeon-only'; host.appendChild(hud); }
      hud.hidden = !show; if (!show) return r;
      const L = shapes(), sig = JSON.stringify(L) + cap(P); if (sig === hudSig) return r; hudSig = sig; EC = null;
      const e = E();
      hud.innerHTML = '<div class="t">陣紋 ' + used(L) + '／' + cap(P) + '（X）</div><canvas width="136" height="120"></canvas>' + (e.lines.length ? e.lines.map(l => '<div class="l"><i style="background:' + l[0] + '"></i><span>' + l[2] + '</span></div>').join('') : '<div class="l">按 X 畫陣紋</div>');
      const ctx = hud.querySelector('canvas').getContext('2d'); drawRune(ctx, 68, 60, 48, L, { lw: 3, cr: 7, nr: 3.5 });
    } catch (err) { console.warn('[runedraw hud]', err); }
    return r;
  };
  const lf0 = R.loadFloor;
  if (lf0) R.loadFloor = (...a) => { pend = null; chg = null; if (auraMesh) { auraMesh.rm(); auraMesh = null; auraSig = ''; } return lf0(...a); };

  // ---------- 法陣・癒 ----------
  const hl = R.SKILL_LIB && R.SKILL_LIB.ry_heal;
  if (hl && !hl._rd) {
    hl._rd = 1; hl.mp = 25; hl.cd = 20; hl.p = Object.assign({}, hl.p, { r: Math.round(hl.p.r * 0.7 * 10) / 10, life: Math.round(hl.p.life * 0.7) });
    const sk = R.SKILLS.ry_heal; if (sk) { sk.mp = 25; sk.cd = 20; sk.desc = String(sk.desc || '').replace(/癒陣 \d+ 秒/, '癒陣 ' + hl.p.life + ' 秒'); }
    hl.desc = String(hl.desc || '').replace(/癒陣 \d+ 秒/, '癒陣 ' + hl.p.life + ' 秒');
  }
})(window.R);
