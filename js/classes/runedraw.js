// 術陣師：自己畫陣紋＋新的施法流程（作者 2026-10-12）
// 一、陣紋（X 職業鍵打開繪製畫面）：正六邊形，六個頂點＋正中央共 7 個節點。
//   D 傷害（頂端，紅）、A 範圍（右上，紫）、S 速度（右下，黃）、B 格擋（底端，藍）、H 治療（左下，綠）、C 冷卻（左上，白）、M 魔力（中央，黑）。
//   點一下節點＝核心 Core（普攻加成）；按住左鍵拖過不同節點＝線段 Line（技能加成，效果看起點）；
//   拖回起點＝Loop（以自己為中心的光環，效果看起點；起點兩邊夾角要 ≥ 60°）。每個節點只能屬於一個圖形。右鍵刪掉圖形。
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
  // 2026-10-14 作者：術陣師的被動（passives.js 的 ry1～ry10）在這裡生效
  const pv = id => { const P = W() && W().P; return !!(P && P.cls === 'arraymage' && R.passivesOf && R.passivesOf('arraymage').includes(id)); };
  R.ryPv = pv;
  const eff = () => {
    const P = W() && W().P, L = shapes(), E = { naDmg: 0, skDmg: 0, loopDmg: 0, naArea: 0, skArea: 0, loopArea: 0, atkSpd: 0, naWind: 0, skWind: 0, skDur: 0, loopWind: 0,
      coreShield: 0, lineShield: 0, loopShield: 0, naHeal: 0, skHeal: 0, loopHeal: 0, coreCd: 0, lineHaste: 0, loopHaste: 0, naMp: 0, nCore: 0, skMp: 0, loopMp: 0, auras: [], lines: [] };
    let budget = cap(P);
    // 2026-10-14 傳說：閉環羅盤（Loop +40%、光環半徑 +50%）、連鎖陣盤（Line +40%、技能蓄力 −20%）；跟被動相加，不相乘
    const leg = R.legOf ? R.legOf(P) : null, legLoop = leg === 'lg_compass', legLine = leg === 'lg_chaindisc';
    const coreM = pv('ry7') ? 2 : 1, lineM = 1 + (pv('ry8') ? 0.5 : 0) + (legLine ? 0.4 : 0), loopM = 1 + (pv('ry9') ? 0.3 : 0) + (legLoop ? 0.4 : 0);
    const r1 = v => Math.round(v * 100) / 100;
    // 一個節點 k 在圖形 t 裡發揮效果；m＝倍率（被動、連接節點 30%）
    const one = (k, t, pc, m, add) => {
      if (t === 'core') {
        if (k === 'D') { E.naDmg += 0.25 * m; add('普攻傷害 +' + pct(0.25 * m)); }
        if (k === 'A') { E.naArea += 0.4 * m; add('普攻範圍 +' + pct(0.4 * m)); }
        if (k === 'S') { E.atkSpd += 0.2 * m; E.naWind += 0.5 * m; add('攻速 +' + pct(0.2 * m) + '、普攻前搖 −' + pct(Math.min(0.9, 0.5 * m))); }
        if (k === 'B') { E.coreShield += 0.01 * m; add('普攻護盾 ' + pct(0.01 * m) + ' 魔上限（5 層）'); }
        if (k === 'H') { E.naHeal += 0.01 * m; add('每 2 下普攻回復 ' + pct(0.01 * m) + ' 魔上限'); }
        if (k === 'C') { E.coreCd += m; add('普攻減技能冷卻' + (m > 1 ? '（×' + m + '）' : '')); }
        if (k === 'M') { E.naMp += 0.75 * m; add('普攻耗魔 −' + pct(Math.min(1, 0.75 * m))); }
      } else if (t === 'line') {
        if (k === 'D') { E.skDmg += pc * 0.1 * m; add('技能傷害 +' + pct(pc * 0.1 * m)); }
        if (k === 'A') { E.skArea += pc * 0.1 * m; add('技能範圍 +' + pct(pc * 0.1 * m)); }
        if (k === 'S') { E.skWind += pc * 0.1 * m; E.skDur += pc * 0.05 * m; add('技能前搖 −' + pct(pc * 0.1 * m) + '、持續 +' + pct(pc * 0.05 * m)); }
        if (k === 'B') { E.lineShield += pc * 0.03 * m; add('技能護盾 ' + pct(pc * 0.03 * m) + ' 魔上限（2 層）'); }
        if (k === 'H') { E.skHeal += pc * 0.1 * m; add('技能治療 +' + pct(pc * 0.1 * m)); }
        if (k === 'C') { E.lineHaste += (10 + pc * 10) * m; add('技能急速 +' + r1((10 + pc * 10) * m)); }
        if (k === 'M') { E.skMp += pc * 0.1 * m; add('技能耗魔 −' + pct(Math.min(0.9, pc * 0.1 * m))); }
      } else {
        if (k === 'D') { E.loopDmg += 0.15 * pc / 2 * m; add('傷害 +' + pct(0.15 * pc / 2 * m) + '（隊友減半）'); }
        if (k === 'A') { E.loopArea += 0.2 * pc / 2 * m; add('攻擊範圍 +' + pct(0.2 * pc / 2 * m) + '（隊友減半）'); }
        if (k === 'S') { E.atkSpd += 0.2 * pc / 2 * m; E.loopWind += pc * 0.1 * m; add('攻速 +' + pct(0.2 * pc / 2 * m) + '、所有前搖 −' + pct(pc * 0.1 * m)); }
        if (k === 'B') { E.loopShield += (2 + pc) / 1000 * m; add('每秒護盾 ' + pct((2 + pc) / 1000 * m) + ' 魔上限（10 層）'); }
        if (k === 'H') { E.loopHeal += pc * 0.01 * m; add('每 5 秒治療 ' + pct(pc * 0.01 * m) + ' 魔上限'); }
        if (k === 'C') { E.loopHaste += 10 * pc * m; add('技能急速 +' + r1(10 * pc * m) + '（範圍內）'); }
        if (k === 'M') { E.loopMp += (1 + pc / 2) * m; add('每秒回魔 +' + r1((1 + pc / 2) * m)); }
        if (!E.auras.some(a => a.k === k)) E.auras.push({ k, pc }); else { const a = E.auras.find(a => a.k === k); a.pc = Math.max(a.pc, pc); }
      }
    };
    L.forEach(sh => {
      if ((budget -= sh.n.length) < 0) return;   // 等級不夠的部分不生效
      const k = NODES[sh.n[0]].k, pc = sh.n.length, t = sh.t;
      if (t === 'core') E.nCore++;
      const lab = ({ core: '核心', line: '線段', loop: 'Loop' })[t] + '・' + NODES[sh.n[0]].n + (t === 'core' ? '' : ' ' + pc);
      const m = t === 'core' ? coreM : t === 'line' ? lineM : loopM;
      one(k, t, pc, m, s => E.lines.push([NODES[sh.n[0]].c, lab, s]));
      // 複合結構／永續陣：起點以外的節點也發揮自己的效果（30%）
      if ((t === 'line' && pv('ry8')) || (t === 'loop' && pv('ry9'))) sh.n.slice(1).forEach(i => one(NODES[i].k, t, pc, m * 0.3, s => E.lines.push([NODES[i].c, lab + '→' + NODES[i].n + '（30%）', s])));
    });
    E.naWind = Math.min(0.9, E.naWind); E.naMp = Math.min(1, E.naMp);
    const ar = 1 + E.skArea + E.loopArea; E.auras.forEach(a => { a.r = a.pc * ar * (legLoop ? 1.5 : 1); });
    // 攻擊範圍每 +1%，普攻與技能的蓄陣前搖 +0.5%（射程加成 rangeMult＋Loop 的攻擊範圍）
    E.rangeUp = Math.max(0, ((P && P.rangeMult) || 1) - 1 + E.loopArea); E.windMul = 1 + 0.5 * E.rangeUp;
    E.pvArea = pv('ry2') ? 0.3 : 0;   // 抑制圈：技能範圍 +30%（另外乘）
    E.charge = Math.max(0.2, 1 - E.skWind - E.loopWind) * E.windMul * (pv('ry1') ? 0.75 : 1) * (pv('ry3') ? 2 : 1) * (legLine ? 0.8 : 1);
    E.naDelay = Math.max(0.1, 0.5 * (1 - E.naWind) * (1 - Math.min(0.8, E.loopWind))) * E.windMul;
    E.reach = pv('ry4') ? 1.5 : 1;   // 定點
    E.multi = pv('ry3');   // 閉環（被動）
    E.slowIn = pv('ry6');   // 陣地
    E.echo = pv('ry10');   // 艾達諾拉
    return E;
  };
  let EC = null, ecT = -1; const E = () => { const t = R.coreTime(); if (!EC || t !== ecT) { EC = eff(); ecT = t; } return EC; };
  const dirty = () => { EC = null; hudSig = ''; };
  const auraOf = (k) => E().auras.find(a => a.k === k);

  // ---------- 地面法陣（自己的 mesh） ----------
  const ground = (x, z, r, col, op, plain) => {
    const T = window.THREE, w = W(); if (!T || !w || !w.scene) return { set() { }, rm() { }, move() { } };
    const g = new T.Group(), c = new T.Color(col);
    const m1 = new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op * 0.35, depthWrite: false, side: T.DoubleSide });
    const m2 = new T.MeshBasicMaterial({ color: c, transparent: true, opacity: op, depthWrite: false, side: T.DoubleSide });
    const m3 = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, side: T.DoubleSide });
    const d = new T.Mesh(new T.CircleGeometry(1, 40), m1), ring = new T.Mesh(new T.RingGeometry(0.9, 1, 48), m2), inner = new T.Mesh(new T.RingGeometry(0.55, 0.62, 6), m2), glow = new T.Mesh(new T.RingGeometry(0.85, 1, 48), m3);
    if (plain) inner.visible = false;
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
  const skR = L => { const p = (L && L.p) || {}; const q = L && L.type === 'combo' ? Object.assign({}, ...(p.parts || []).map(x => x[1] || {})) : p; return (q.r || (L && L.type === 'blink' ? 0.9 : 1.6)) * (1 + E().skArea + E().loopArea) * (1 + E().pvArea); };
  const skRange = () => { const P = W() && W().P; return ((P && P.ws && P.ws.range) || 12) * E().reach; };   // 所有技能：圓心在普攻射程內都能放
  const BODY_T = { guard: 1, parry: 1, orbit: 1, storm: 1 };   // 這幾型本來就是貼身的，只能在腳下
  const bodyOnly = L => { if (!L) return true; if (BODY_T[L.type]) return true; if (L.type === 'combo') return (L.p && L.p.parts || []).some(x => BODY_T[x[0]]); return false; };
  const rankOf = id => (R.skillRank ? R.skillRank(id) || 0 : 0);
  const coarse = () => { try { return matchMedia('(pointer: coarse)').matches && !matchMedia('(pointer: fine)').matches; } catch (e) { return false; } };
  const quick = id => { if (coarse()) return true; const s = S(); return rankOf(id) >= 1 && !!(s && s.rmQuick && s.rmQuick[id]); };   // 手機沒有滑鼠可以確認：一律快速施法
  const cdOf = (P, i) => (i === 0 ? P.skillCd || 0 : (P.skCd && P.skCd[i]) || 0);
  const setCd = (P, i, v) => { if (i === 0) P.skillCd = v; else { P.skCd = P.skCd || []; P.skCd[i] = v; } };

  // ---------- 施法流程 ----------
  let pend = null, chgs = [], live = [];   // live：還在蓄力的法陣（技能＋普攻），給陣地用   // pend：等左鍵確認；chg：蓄力中
  const us0 = R.useSkill, cs0 = R.castSlot;
  const idOf = (P, i) => (i === 0 ? P.skill : R.slotSkill ? R.slotSkill(P, i) : null);
  const clearPend = () => { if (pend) { pend.m.rm(); pend = null; } };
  const release = (i, x, z, self, off, echo) => {
    const P = W().P; if (!P) return;
    const ax = P.aimX, az = P.aimZ, aa = P.aimA;
    if (!self) { P.aimX = x; P.aimZ = z; P.aimA = Math.atan2(x - P.x, z - P.z); }
    // 增益／回復放在遠處：施放那一瞬間以法陣中心為準（範圍內的隊友吃到效果）
    // 2026-10-13：放下去的位置不再變。走遠了（超過放下時的距離）就把施法點暫時挪到「放下時的相對位置」，落點照舊在原地
    const px = P.x, pz = P.z, remote = self && x != null && Math.hypot(x - P.x, z - P.z) > 0.5;
    if (remote) { P.x = x; P.z = z; }
    else if (!self && x != null && off && Math.hypot(x - P.x, z - P.z) > off.d + 0.05) { P.x = x - off.dx; P.z = z - off.dz; P.aimA = Math.atan2(off.dx, off.dz); }
    const c0 = cdOf(P, i), mp0 = P.mp, id = idOf(P, i);
    if (echo) setCd(P, i, 0);
    // 2026-10-15 修：傳送陣（blink 型）以前照技能本身的 8 公尺從腳下算，法陣畫在比較遠的地方就傳不到法陣裡——改成直接傳到法陣中心
    const Lb = libOf(id), gate = !self && x != null && Lb && Lb.type === 'blink' && !(Lb.p && (Lb.p.back || Lb.p.behind));
    if (gate) { P.x = px; P.z = pz; P._blinkTo = [x, z]; }
    try { inCast = true; if (i === 0) us0(); else cs0(i); } finally { inCast = false; P._blinkTo = null; if (remote) { P.x = px; P.z = pz; } if (!self) { P.aimX = ax; P.aimZ = az; P.aimA = aa; } }
    if (echo) { setCd(P, i, c0); P.mp = mp0; return; }   // 艾達諾拉的再發動：不再耗魔、不動冷卻
    const c1 = cdOf(P, i);
    if (c1 > c0 + 0.01) {
      const e = E(), sk = R.SKILLS[id], h = Math.max(0, P.haste || 0), add = e.lineHaste + e.loopHaste;
      if (add > 0) setCd(P, i, c1 * (100 + h) / (100 + h + add));
      if (e.skMp > 0 && sk && P.mp < mp0) P.mp = Math.min(P.mpMax, P.mp + (mp0 - P.mp) * e.skMp);
      if (e.lineShield > 0) shieldAdd(P, P.mpMax * e.lineShield, P.mpMax * e.lineShield * 2);
      if (e.echo) {   // 艾達諾拉：耗魔 +80%，0.1 秒後再發動一次
        if (P.mp < mp0) P.mp = Math.max(0, P.mp - (mp0 - P.mp) * 0.8);
      }
      return true;
    }
    return false;
  };
  let inCast = false;
  const startCharge = (i, id, x, z, self) => {
    const P = W().P, L = libOf(id), col = R.SKILL_LIB && L && L.p && L.p.color || '#7AC8E8';
    // 2026-10-13：放下就定住（腳下的也不跟著走）；記下放下時跟自己的相對位置
    const off = { dx: x - P.x, dz: z - P.z, d: Math.hypot(x - P.x, z - P.z) };
    const r = skR(L), m = pend && pend.i === i ? pend.m : ground(x, z, r, col, 0.5, true);
    if (pend && pend.i === i) m.move(x, z);
    pend = null;
    const dur = E().charge; let t = 0, fired = 0;
    const me = { i, m, x, z, r }; chgs.push(me); live.push(me);
    const done = () => { chgs = chgs.filter(c => c !== me); live = live.filter(c => c !== me); };
    R.num && R.num(P.x, 2.6, P.z, '蓄陣…', 'heal');
    tick(dt => {
      if (dt < 0) { if (!fired) m.rm(); done(); return false; }
      if (W().paused) return true;
      const P2 = W().P; if (!P2 || P2.dead) { if (!fired) m.rm(); done(); return false; }
      t += dt; const k = Math.min(1, t / dur);
      m.set(0.5, 0);   // 預備中：原本技能特效的 50% 透明
      if (fired) { if (t >= dur + 0.1) { release(i, x, z, self, off, true); return false; } return true; }   // 艾達諾拉：0.1 秒後再發動
      if (t >= dur) { m.rm(); done(); fired = 1; return !!(release(i, x, z, self, off) && E().echo); }
      return true;
    });
  };
  const ready = (P, i, id) => {
    const sk = R.SKILLS[id]; if (!sk) return false;
    if (cdOf(P, i) > 0) return false;
    if (P.dead || P.knockT > 0 || P.jump || P.stance > 0) return false;
    if (P.mp < sk.mp * (E().echo ? 1.8 : 1)) { R.toast && R.toast('魔力不夠'); return false; }
    return true;
  };
  const press = i => {
    const w = W(), P = w.P; if (!P || !w.run || w.paused) return;
    const id = idOf(P, i);
    if (!id) return i === 0 ? us0() : cs0(i);   // 沒裝技能：讓原本的提示出來
    if (!libOf(id)) return i === 0 ? us0() : cs0(i);   // 不是技能書的技能：照舊
    if (chgs.some(c => c.i === i)) return;   // 同一個技能蓄力中
    if (chgs.length && !E().multi) return;   // 蓄力中不能放別的（被動「閉環」可以）
    if (pend && pend.i === i) { clearPend(); R.toast && R.toast('取消施法', '#C8C0B0'); return; }
    if (!ready(P, i, id)) return;
    clearPend();
    const L = libOf(id), self = isSelf(L);
    const body = self && bodyOnly(L), feet = body || (self && quick(id));
    if (quick(id)) { const [x, z] = feet ? [P.x, P.z] : aimPt(P, skRange(L)); startCharge(i, id, x, z, self); return; }
    const col = (L.p && L.p.color) || '#7AC8E8', [x, z] = body ? [P.x, P.z] : aimPt(P, skRange(L));
    pend = { i, id, self, body, L, m: ground(x, z, skR(L), col, 0.5, true) };
    tick(dt => {
      if (dt < 0) { clearPend(); return false; }
      if (!pend || pend.id !== id || pend.i !== i) return false;
      const P2 = W().P; if (!P2 || P2.dead) { clearPend(); return false; }
      const [x2, z2] = pend.body ? [P2.x, P2.z] : aimPt(P2, skRange(L)); pend.m.move(x2, z2, skR(L)); pend.m.set(0.5);
      return true;
    });
  };
  const confirm = () => {
    const P = W().P; if (!pend || !P) return;
    const p = pend; if (!ready(P, p.i, p.id)) { clearPend(); return; }
    const [x, z] = p.body ? [P.x, P.z] : aimPt(P, skRange(p.L));
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
  let naCap = null, naN = 0;
  const fi0 = R.fire;
  R.fire = o => {
    if (naCap && o && o.owner === 'p' && o.primary) { naCap.dmg += o.dmg || 0; if (!naCap.n++) naCap.splash = o.radius || 0; return { dead: true, hit: new Set(), mesh: null }; }
    return fi0(o);
  };
  const at0 = R.attack;
  R.attack = (...a) => {
    const P = W() && W().P; if (!isRM(P) || !P.ws || P.ws.kind !== 'magic') return at0(...a);
    // 2026-10-13：普攻和技能可以同時放、同時蓄力（不再互相擋）。普攻耗魔＝1.5＋每個核心 0.25（魔力核心再 −75%）
    const e0 = E(), cost = (1.5 + 0.25 * e0.nCore) * (1 - e0.naMp) * (e0.echo ? 1.8 : 1);
    if ((P.atkCd || 0) <= 0 && P.mp < cost) { R.toast && R.toast('魔力不夠'); P.atkCd = 0.4; return; }
    const cd0 = P.atkCd || 0, mp0 = P.mp; naCap = { dmg: 0, n: 0 };
    let cap0; try { at0(...a); } finally { cap0 = naCap; naCap = null; }
    if (!cap0.n) return;
    const e = E();
    if ((P.atkCd || 0) > cd0 + 0.001 && e.atkSpd > 0) P.atkCd /= 1 + e.atkSpd;
    if (P.mp < mp0) P.mp = Math.max(0, mp0 - cost);
    const nth = (naN = (naN + 1) % 2) === 0;   // 第 2、4、6…下
    const [x, z] = aimPt(P, (P.ws.range || 12) * e.reach), r = 2 * (1 + e.naArea + e.loopArea), dmg = cap0.dmg * (1 + e.naDmg), dl = e.naDelay;
    const m = naRune(x, z, r); let t = 0, fired = 0;
    const me = { x, z, r }; live.push(me);
    const boom = () => {
      R.fx && R.fx('ring', x, 0.1, z, { r, color: '#9AE8FF' });
      const n = R.aoe(x, z, r, dmg, { primary: true });
      const P2 = W().P; if (!P2) return; const e2 = E();
      // 癒／防核心：打中遺跡生物，或自己站在這次普攻的法陣範圍內，才有效
      const okHit = n > 0 || Math.hypot(P2.x - x, P2.z - z) <= r;
      if (e2.coreShield && okHit) shieldAdd(P2, P2.mpMax * e2.coreShield, P2.mpMax * e2.coreShield * 5);
      if (e2.naHeal && nth && okHit && R.healP) R.healP(P2.mpMax * e2.naHeal * (R.runeInCombat() ? 1 : 0.5), true);   // 非戰鬥減半
      if (e2.coreCd) { const v = e2.coreCd / (2 + e2.atkSpd); P2.skillCd = Math.max(0, (P2.skillCd || 0) - v); if (P2.skCd) P2.skCd = P2.skCd.map(c => Math.max(0, (c || 0) - v)); }
    };
    tick(dt => {
      if (dt < 0) { if (!fired) m.rm(); live = live.filter(c => c !== me); return false; }
      if (W().paused) return true;
      t += dt; m.set(0.45 + 0.55 * Math.min(1, t / dl), Math.min(1, t / dl));
      if (t < dl) return true;
      if (fired) { if (t >= dl + 0.1) { boom(); return false; } return true; }   // 艾達諾拉：0.1 秒後再發動
      m.rm(); live = live.filter(c => c !== me); boom(); fired = 1;
      return !!E().echo;
    });
  };
  // 普攻的地面法陣：畫目前的陣紋（跟 Loop 腳下的一樣）
  const naRune = (x, z, r) => {
    const rm = runeMesh(r); if (!rm) return { set() { }, rm() { } };
    rm.g.position.set(x, 0.07, z);
    return { set(o, k) { rm.mat.opacity = Math.min(1, o); rm.g.rotation.y += 0.03; }, rm: rm.rm };
  };
  const shieldAdd = (u, amt, max) => { if (!(amt > 0)) return; const cur = u.shield || 0; u.shield = cur >= max ? cur : Math.min(max, cur + amt); if (u === W().P) { u.buff = u.buff || {}; u.buff.shieldT = Math.max(u.buff.shieldT || 0, 6); } else u.shieldT = Math.max(u.shieldT || 0, 6); };

  // ---------- 技能的參數：傷害、範圍、持續、治療 ----------
  const T = R.SKILL_TYPES;
  if (T) Object.keys(T).forEach(k => {
    const f = T[k];
    T[k] = (s, P, w, pw) => {
      if (!isRM(P) || !s || s._rm) return f(s, P, w, pw);
      const e = E(); s = Object.assign({}, s, { _rm: 1 });
      // 2026-10-13：所有傷害型技能範圍半徑 ×1.5；法陣・爆蓄力完立刻爆（不再多等 0.6 秒）
      const dmgSk = (s.k || 0) > 0 && s.zone !== 'sanct' && s.type !== 'buff';
      const ar = (1 + e.skArea + e.loopArea) * (1 + e.pvArea) * (dmgSk ? 1.5 : 1); if (ar !== 1) { if (s.r) s.r *= ar; if (s.hitR) s.hitR *= ar; }
      if (s._id === 'ry_burst') s.delay = 1;
      if (e.skDur) { if (s.t) s.t *= 1 + e.skDur; if (s.life) s.life *= 1 + e.skDur; }
      if (e.skHeal) { if (s.pct) s.pct *= 1 + e.skHeal; if (s.allies) s.allies *= 1 + e.skHeal; if (s.zone === 'sanct') s.healK = (s.healK || 1) * (1 + e.skHeal); }
      return f(s, P, w, (pw || 0) * (1 + e.skDmg));
    };
  });
  // Loop 的傷害光環：你打的全部傷害（反傷除外）
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (en, raw, o) => { const P = W() && W().P; if (isRM(P) && !(o && (o.reflect || o.thorns))) { const l = E().loopDmg; if (l) raw *= 1 + l; } return he0(en, raw, o); };
  const ah0 = R.allyHit;
  if (ah0) R.allyHit = (en, dmg, by) => { const P = W() && W().P, a = isRM(P) && auraOf('D'); if (a && by && by.x != null && Math.hypot(by.x - P.x, by.z - P.z) <= a.r && !by.rival) dmg *= 1 + E().loopDmg / 2; return ah0(en, dmg, by); };

  // ---------- 戰鬥中判定（2026-10-13）：癒陣／癒核心在非戰鬥時治療量減半 ----------
  // 戰鬥中＝在遺跡裡，且 5 秒內打到或被打到，或 14 公尺內有活著的遺跡生物
  let lastFight = -1e9;
  const nowS = () => performance.now() / 1000;
  const he1 = R.hurtEnemy; R.hurtEnemy = (en, raw, o) => { lastFight = nowS(); return he1(en, raw, o); };
  const hp1 = R.hurtPlayer; if (hp1) R.hurtPlayer = (...a) => { lastFight = nowS(); return hp1(...a); };
  R.runeInCombat = () => {
    const w = W(), P = w && w.P; if (!w || !w.run || !P) return false;
    if (nowS() - lastFight < 5) return true;
    return (w.enemies || []).some(en => !en.dead && Math.hypot(en.x - P.x, en.z - P.z) < 14);
  };
  const az1 = R.addZone;
  if (az1) R.addZone = z => { const r = az1(z); if (z && z.kind === 'sanct' && healCast) z._ryHeal = z.healK || 1; return r; };
  let healCast = false;
  const hT = T && T.zone; if (hT) T.zone = (s, ...a) => { const f = s && s._id === 'ry_heal'; healCast = healCast || f; try { return hT(s, ...a); } finally { if (f) healCast = false; } };

  // ---------- Loop 的光環（每幀） ----------
  let auraT = { B: 0, H: 0 }, auraMesh = null, auraSig = '';
  const allies = P => (W().allies || []).filter(a => !a.downed && !a.rival);
  const st0 = R.step;
  R.step = dt => {
    const r = st0(dt);
    try {
      { const w0 = W(); if (w0 && w0.zones) { const k = R.runeInCombat() ? 1 : 0.5; w0.zones.forEach(z => { if (z._ryHeal) z.healK = z._ryHeal * k; }); } }
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
      const c = NODES[sh.n[0]].c, cc = c === '#1A1A1A' ? '#8A8AA0' : c;
      const path = () => { ctx.beginPath(); if (sh.t === 'core') { const [x, y] = npos(sh.n[0], cx, cy, rad); ctx.arc(x, y, o.cr || 14, 0, 7); return; } sh.n.forEach((i, j) => { const [x, y] = npos(i, cx, cy, rad); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); if (sh.t === 'loop') ctx.closePath(); };
      if (o.glow) { path(); ctx.strokeStyle = 'rgba(0,0,0,.55)'; ctx.lineWidth = (o.lw || 4) + 4; ctx.stroke(); }   // 深色描邊，地面上也看得清楚
      path(); if (sh.t === 'loop') { ctx.fillStyle = cc + '33'; ctx.fill(); }
      ctx.strokeStyle = cc; ctx.lineWidth = sh.t === 'core' ? Math.max(2, (o.lw || 4) * 0.6) : (o.lw || 4); ctx.stroke();
    });
    if (o.nodes !== false) NODES.forEach((N, i) => { const [x, y] = npos(i, cx, cy, rad); ctx.fillStyle = N.c; ctx.strokeStyle = '#DDE'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, o.nr || 6, 0, 7); ctx.fill(); ctx.stroke(); });
  };
  const runeMesh = r => {
    const T3 = window.THREE, w = W(); if (!T3 || !w.scene) return null;
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const ctx = cv.getContext('2d');
    ctx.strokeStyle = 'rgba(122,200,232,.9)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(128, 128, 124, 0, 7); ctx.stroke();
    drawRune(ctx, 128, 128, 100, shapes(), { frame: 'rgba(122,200,232,.8)', fw: 3, lw: 6, cr: 8, nodes: false, glow: 1 });
    const tex = new T3.CanvasTexture(cv), mat = new T3.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.45, depthWrite: false, side: T3.DoubleSide });
    const m = new T3.Mesh(new T3.PlaneGeometry(2 * r, 2 * r), mat); m.rotation.x = -Math.PI / 2; const g = new T3.Group(); g.add(m); w.scene.add(g);
    return { g, mat, rm() { try { w.scene.remove(g); m.geometry.dispose(); mat.dispose(); tex.dispose(); } catch (e) { } } };
  };

  // ---------- 繪製畫面 ----------
  const css = document.createElement('style');
  css.textContent = '#rd-ov{position:fixed;inset:0;z-index:9000;background:rgba(6,8,14,.78);display:flex;align-items:center;justify-content:center;color:#E8E2D4;font-size:13px}'
    + '#rd-box{display:flex;gap:18px;background:linear-gradient(160deg,rgba(20,28,40,.97),rgba(12,16,24,.97));border:1px solid #3E7A98;border-radius:14px;padding:18px 20px;box-shadow:0 18px 60px rgba(0,0,0,.55),0 0 0 1px rgba(154,232,255,.06) inset;max-width:96vw;max-height:94vh;overflow:auto}'
    + '#rd-box h3{margin:0 0 4px;color:#9AE8FF;font-size:16px;letter-spacing:.08em;padding-bottom:4px;border-bottom:1px solid rgba(154,232,255,.18)}#rd-cv{flex:none;align-self:flex-start;width:360px;height:360px;background:#0A0E16;border:1px solid #23384A;border-radius:12px;cursor:crosshair;touch-action:none;box-shadow:inset 0 0 40px rgba(60,140,190,.12)}@media (max-width:720px){#rd-box{flex-direction:column;align-items:center}#rd-cv{width:min(360px,86vw);height:auto;aspect-ratio:1}#rd-side{width:min(360px,86vw)!important}}'
    + '#rd-side{width:320px;display:flex;flex-direction:column;gap:7px;line-height:1.5}#rd-side .l{display:flex;gap:6px;align-items:flex-start;line-height:1.35}#rd-side .l i{width:10px;height:10px;border-radius:50%;flex:none;margin-top:3px;border:1px solid #889}'
    + '#rd-side .q{display:flex;justify-content:space-between;align-items:center;gap:6px;padding:5px 8px;border-radius:8px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05)}#rd-side .q>span:first-child{font-weight:600}#rd-side .q>span:last-child{display:flex;border:1px solid #3E7A98;border-radius:7px;overflow:hidden}#rd-side .q button{font-size:11px;padding:3px 9px;border:0;background:#101C28;color:#9FC4D8;cursor:pointer}#rd-side .q button.on{background:#3E8AB0;color:#fff}#rd-side .q button:disabled{opacity:.4;cursor:default}'
    + '#rd-side .sm{color:#A8A2B0;font-size:11.5px}#rd-btn{display:flex;gap:8px;margin-top:6px}#rd-btn button{flex:1;padding:7px 12px;border-radius:8px;border:1px solid #4E7A92;background:#16222E;color:#E6F2FA;cursor:pointer;font-weight:600}#rd-btn button:hover{border-color:#9AE8FF}#rd-btn button[data-a=close]{background:#2C6A8A;border-color:#5AAED0}'
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
    if (!ov) return; const P = W().P, cv = ov.querySelector('#rd-cv'), ctx = cv.getContext('2d'); ctx.setTransform(cv._dpr || 1, 0, 0, cv._dpr || 1, 0, 0); ctx.clearRect(0, 0, SZ, SZ);
    { const g = ctx.createRadialGradient(CX, CY, 10, CX, CY, SZ * 0.6); g.addColorStop(0, 'rgba(40,90,120,.22)'); g.addColorStop(1, 'rgba(10,14,22,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, SZ, SZ);
      ctx.strokeStyle = 'rgba(154,232,255,.10)'; ctx.lineWidth = 1; [RAD + 34, RAD + 28, RAD * 0.5].forEach(r => { ctx.beginPath(); ctx.arc(CX, CY, r, 0, 7); ctx.stroke(); });
      ctx.setLineDash([3, 6]); ctx.beginPath(); for (let i = 0; i <= 6; i++) { const [x, y] = npos(i % 6, CX, CY, RAD); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } for (let i = 0; i < 6; i++) { const [x, y] = npos(i, CX, CY, RAD); ctx.moveTo(CX, CY); ctx.lineTo(x, y); } ctx.stroke(); ctx.setLineDash([]); }
    drawRune(ctx, CX, CY, RAD, shapes(), { nr: 0 });
    if (drag && drag.path.length) {
      const c = NODES[drag.path[0]].c; ctx.strokeStyle = c === '#1A1A1A' ? '#7A7A8A' : c; ctx.lineWidth = 4; ctx.setLineDash([6, 5]); ctx.beginPath();
      drag.path.forEach((i, j) => { const [x, y] = npos(i, CX, CY, RAD); j ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.lineTo(drag.mx, drag.my); ctx.stroke(); ctx.setLineDash([]);
    }
    const o = occ();
    NODES.forEach((N, i) => {
      const [x, y] = npos(i, CX, CY, RAD), glow = drag && drag.moved && (canAdd(i, P) || canClose(i));
      if (glow) { ctx.fillStyle = 'rgba(255,240,170,.35)'; ctx.beginPath(); ctx.arc(x, y, 19, 0, 7); ctx.fill(); }
      { const cc = N.c === '#1A1A1A' ? '#8A8AA0' : N.c; ctx.save(); ctx.shadowColor = cc; ctx.shadowBlur = o.has(i) ? 14 : 6; ctx.fillStyle = N.c; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill(); ctx.restore();
        const hg = ctx.createRadialGradient(x - 4, y - 4, 1, x, y, 12); hg.addColorStop(0, 'rgba(255,255,255,.45)'); hg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.fill();
        ctx.strokeStyle = glow ? '#FFF0A0' : o.has(i) ? '#FFFFFF' : 'rgba(220,230,240,.55)'; ctx.lineWidth = glow ? 3 : 1.5; ctx.beginPath(); ctx.arc(x, y, 12, 0, 7); ctx.stroke(); }
      ctx.fillStyle = N.k === 'C' || N.k === 'S' ? '#222' : '#FFF'; ctx.font = 'bold 12px "Segoe UI",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(N.k, x, y + 0.5);
      const [lx, ly] = N.a == null ? [x, y + 25] : npos(i, CX, CY, RAD + 30); ctx.fillStyle = '#D6DEE8'; ctx.font = '600 12.5px "Microsoft JhengHei","Noto Sans TC",sans-serif'; ctx.fillText(N.n, lx, ly);
    });
  };
  const side = () => {
    if (!ov) return; const P = W().P, e = eff(), L = shapes();
    const q = (R.loadoutOf ? R.loadoutOf('arraymage') : []).filter(id => id && libOf(id));
    const s = S(); s.rmQuick = s.rmQuick || {};
    ov.querySelector('#rd-side').innerHTML = '<h3>陣紋</h3><div class="sm">節點 ' + used(L) + '／' + cap(P) + '（每 5 級 +1，最多 7）。點節點＝核心（普攻）；按住左鍵拖過節點＝線段（技能）；拖回起點＝Loop（光環，起點夾角 ≥ 60°）。右鍵刪掉圖形。效果看起點的顏色。</div>'
      + (e.lines.length ? e.lines.map(l => '<div class="l"><i style="background:' + l[0] + '"></i><span><b>' + l[1] + '</b>：' + l[2] + '</span></div>').join('') : '<div class="sm">還沒畫任何陣紋。</div>')
      + (e.auras.length ? '<div class="sm">光環半徑：' + e.auras.map(a => a.k + ' ' + (Math.round(a.r * 10) / 10) + 'm').join('、') + '</div>' : '')
      + '<h3 style="margin-top:6px">施法方式</h3><div class="sm">技能熟練度 ★1 起可選。快速施法：按下就蓄力（攻擊在滑鼠處、增益在腳下）；手動：先預覽（技能原本範圍的 50% 透明）、左鍵確認。所有技能（攻擊、增益、回復）的中心都能放在普攻射程內，放下就定住；蓄力時也能普攻。普攻耗魔 1.5＋每個核心 0.25。蓄力 ' + (Math.round(e.charge * 100) / 100) + ' 秒' + (e.rangeUp > 0 ? '（攻擊範圍 +' + Math.round(e.rangeUp * 100) + '%，前搖 +' + Math.round(e.rangeUp * 50) + '%）' : '') + '。</div><div class="sm">陣紋只會畫在普攻法陣和 Loop 腳下的光環上：核心是小空心圈，線段和 Loop 畫成線。每 +1% 攻擊範圍，普攻和技能的蓄陣前搖 +0.5%。</div>'
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
    const cv = ov.querySelector('#rd-cv'), DPR = Math.min(3, window.devicePixelRatio || 1); cv.width = cv.height = Math.round(SZ * DPR); cv._dpr = DPR;
    const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * SZ / r.width, (e.clientY - r.top) * SZ / r.height]; };
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
  R.runeDrawOpen = () => !!ov; R.runeDraw = { open, close, eff, angOK, cap, dbg: () => ({ chgs: chgs.map(c => ({ i: c.i, x: c.x, z: c.z, r: c.r })), live: live.length, pend: pend && { i: pend.i } }) };

  // ---------- 職業鍵、量表 ----------
  const C = R.CORE.arraymage;
  if (C) {
    C.act = P => { if (chgs.length) return; open(); };
    // 2026-10-14 作者：拿掉原本的「閉環」三角形機制（法陣留點、三點連成三角形重創定身、X 放陣眼）與它的說明
    delete C.onCast; delete C.point; delete C.close; delete C.aimPt; C.name = '陣紋';
    C.help = P => { const e = E(); return '陣紋：X 打開。點節點＝核心（普攻），拖線＝線段（技能），拖回起點＝Loop（光環）。'
      + '普攻：在滑鼠處放一個畫著你陣紋的法陣，' + (Math.round(e.naDelay * 100) / 100) + ' 秒後爆開，耗魔 1.5＋每個核心 0.25。'
      + '技能：按技能鍵先看範圍、左鍵確認（再按一次取消；熟練度 ★1 起可以改成按下就放的快速施法），蓄力 ' + (Math.round(e.charge * 100) / 100) + ' 秒後放出。法陣的中心能放在普攻射程內，放下就不會跟著你移動；增益和回復會作用在那個圈裡的隊友。蓄力時也能普攻。攻擊範圍每 +1%，普攻和技能的蓄力 +0.5%。'; };
    C.gauge = P => { const e = E(), L = shapes(), sk = pend ? (R.SKILLS[pend.id] || {}).name : null; return { name: '陣紋 ' + used(L) + '／' + cap(P), v: used(L), max: cap(P), text: chgs.length ? '蓄陣中…' + (chgs.length > 1 ? '×' + chgs.length : '') : sk ? sk + '：左鍵施放、再按一次取消' : (e.lines.length ? e.lines.length + ' 個圖形生效' : '還沒畫陣紋'), x: '陣紋' }; };
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
  // ---------- 被動「陣地」：還在蓄力的法陣裡，敵人移動 −40% ----------
  const st2 = R.step;
  R.step = dt => {
    const w = W(), P = w && w.P;
    if (!isRM(P) || !live.length || !E().slowIn) return st2(dt);
    const L = (w.enemies || []).filter(en => !en.dead && en.speed > 0 && live.some(c => Math.hypot(en.x - c.x, en.z - c.z) <= c.r)), sv = L.map(en => { const s0 = en.speed; en.speed = s0 * 0.6; en._ryJd = 1; return s0; });
    try { return st2(dt); } finally { L.forEach((en, i) => { if (Math.abs(en.speed - sv[i] * 0.6) < 1e-9) en.speed = sv[i]; }); }
  };
  const lf0 = R.loadFloor;
  if (lf0) R.loadFloor = (...a) => { pend = null; chgs = []; live = []; if (auraMesh) { auraMesh.rm(); auraMesh = null; auraSig = ''; } return lf0(...a); };

  // ---------- 法陣・癒 ----------
  const hl = R.SKILL_LIB && R.SKILL_LIB.ry_heal;
  if (hl && !hl._rd) {
    hl._rd = 1; hl.mp = 25; hl.cd = 20; hl.p = Object.assign({}, hl.p, { r: Math.round(hl.p.r * 0.7 * 10) / 10, life: Math.round(hl.p.life * 0.7) });
    const sk = R.SKILLS.ry_heal; if (sk) { sk.mp = 25; sk.cd = 20; sk.desc = String(sk.desc || '').replace(/癒陣 \d+ 秒/, '癒陣 ' + hl.p.life + ' 秒'); }
    hl.desc = String(hl.desc || '').replace(/癒陣 \d+ 秒/, '癒陣 ' + hl.p.life + ' 秒');
  }
})(window.R);
