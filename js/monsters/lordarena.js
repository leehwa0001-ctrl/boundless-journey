// 領主體的房間照牠的特性佈置（2026-10-19 作者：參考《元氣騎士》，Boss 的房間配合 Boss 的特性再設計過）
// 原本每一隻都是同一種城堡大廳（lordfloor.js 的 hall）；有自己的房間的領主體改成：
// - 熔獄之顎：熔岩池中間的石島，石橋連到每一個門口。站進熔岩會被燙傷；開打以後熔岩慢慢漫上來（石島縮小、石橋變窄），打倒牠就停。
// - 永凍之冠：冰湖。中間的冰面會滑（停不下來、轉向慢）；周圍一圈冰柱可以躲，牠撞到或出招震到就碎掉。
// - 巢織蛛：整間掛著蛛網（走進去會變慢），牆邊有卵囊——不打破的話過一陣子孵出小蜘蛛。
// 其他的領主體照舊是城堡大廳。
// 做法：蓋樓層的時候先決定這一間是哪一隻領主體（跟 run.js 進房間時的挑法一樣），記在 r.lordId；進房間時照這個生。
// 放在 lordfloor.js、lordwing.js、lordlogic.js、monsters3.js（雷晶蛛）後面。
(function (R) {
  const W = () => R.W, rnd = Math.random;
  // 顏色要轉成線性（renderer 是 sRGB 輸出；直接用十六進位會變得很淡）
  const C = h => new THREE.Color(h).convertSRGBToLinear();
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const ARENA = { lavajaw: 'lava', frostdeer: 'ice', tsuchigumo: 'web' };
  const pickLord = run => {
    const g = run.grade; if (!g || !g.lords || !g.lords.length) return null;
    // 這座遺跡對應的領主體（region.js 的 R.SITE_LORD）優先：原本遺跡型態的領主（塔型＝亡骸天災……）七成會蓋過去，火山遺跡反而很少遇到熔獄之顎
    const SL = R.SITE_LORD && run.site && R.SITE_LORD[run.site.id]; if (SL && g.lords.includes(SL) && rnd() < 0.75) return SL;
    const tl = R.TYPES && R.TYPES[run.type] && R.TYPES[run.type].lord;
    return tl && g.lords.includes(tl) && rnd() < 0.7 ? tl : g.lords[Math.floor(rnd() * g.lords.length)];
  };
  const doorsOf = (F, r) => { const t = F.tile; return (r.doors || []).map(k => { const tx = k % t.nx, tz = (k - tx) / t.nx; return { x: t.cX(tx), z: t.cZ(tz) }; }); };
  const segDist = (p, a, b) => { const vx = b.x - a.x, vz = b.z - a.z, L2 = vx * vx + vz * vz || 1, u = Math.max(0, Math.min(1, ((p.x - a.x) * vx + (p.z - a.z) * vz) / L2)); return Math.hypot(p.x - a.x - vx * u, p.z - a.z - vz * u); };
  const lordOf = r => (W().enemies || []).find(e => !e.dead && e.room === r.i && /^領主體/.test((e.def && e.def.name) || ''));
  const fighting = (F, r) => !(F.lordGate && F.lordGate.down) && !!lordOf(r);

  // ---------- 熔岩池 ----------
  const buildLava = (F, r) => {
    const T = THREE, g = new T.Group(), A = { kind: 'lava', r, g, k: 1, rx: Math.max(3, r.hx * 0.6), rz: Math.max(3, r.hz * 0.6), bw: 2.8, doors: doorsOf(F, r) };
    const lavaM = new T.MeshLambertMaterial({ color: C('#B8320C'), emissive: C('#FF5A1A'), emissiveIntensity: 0.85 });
    const lava = new T.Mesh(new T.PlaneGeometry(r.hx * 2 + 2, r.hz * 2 + 2), lavaM); lava.rotation.x = -Math.PI / 2; lava.position.set(r.x, 0.02, r.z); g.add(lava);
    // 熔岩上的亮紋：幾條會流動的亮橘色帶
    A.streaks = []; for (let i = 0; i < 9; i++) { const s = new T.Mesh(new T.PlaneGeometry(0.35 + rnd() * 0.4, 2 + rnd() * 3), new T.MeshBasicMaterial({ color: C(rnd() < 0.5 ? '#FFC04A' : '#FF8A2A'), transparent: true, opacity: 0.7 })); s.rotation.x = -Math.PI / 2; s.rotation.z = rnd() * Math.PI; s.position.set(r.x + (rnd() - 0.5) * r.hx * 1.8, 0.03, r.z + (rnd() - 0.5) * r.hz * 1.8); g.add(s); A.streaks.push(s); }
    const rock = new T.MeshLambertMaterial({ color: C('#4A3E38') }), rim = new T.MeshLambertMaterial({ color: C('#2A2220') });
    A.island = new T.Group();
    const top = new T.Mesh(new T.CylinderGeometry(1, 1.04, 0.14, 40), rock); top.position.y = 0.07; A.island.add(top);
    const edge = new T.Mesh(new T.TorusGeometry(1.02, 0.03, 4, 40), rim); edge.rotation.x = Math.PI / 2; edge.position.y = 0.14; A.island.add(edge);
    A.island.position.set(r.x, 0, r.z); A.island.scale.set(A.rx, 1, A.rz); g.add(A.island);
    A.bridges = A.doors.map(d => { const len = Math.hypot(d.x - r.x, d.z - r.z) + 1.2, b = new T.Mesh(new T.BoxGeometry(1, 0.12, len), rock); b.position.set((d.x + r.x) / 2, 0.06, (d.z + r.z) / 2); b.rotation.y = Math.atan2(d.x - r.x, d.z - r.z); b.scale.x = A.bw; g.add(b); return b; });
    F.lights && [0, 1, 2, 3].forEach(i => { const a = i / 4 * Math.PI * 2 + 0.6; F.lights.push({ x: r.x + Math.sin(a) * r.hx * 0.85, y: 0.8, z: r.z + Math.cos(a) * r.hz * 0.85, col: '#FF6A2A', I: 1.3, flick: rnd() * 10 }); });
    return A;
  };
  const safeLava = (A, p) => {
    if (A.env && !inCore(A, p)) return true;
    const dx = (p.x - A.r.x) / (A.rx * A.k), dz = (p.z - A.r.z) / (A.rz * A.k);
    if (dx * dx + dz * dz < 1) return true;
    const w = A.bw * (0.55 + 0.45 * A.k) / 2; return A.doors.some(d => segDist(p, A.r, d) < w);
  };
  const stepLava = (A, F, P, dt) => {
    const on = fighting(F, A.r);
    if (on) A.k = Math.max(0.72, A.k - dt / 75 * 0.28);   // 開打後 75 秒內漫上來：石島剩七成、石橋剩一半多
    A.island.scale.set(A.rx * A.k, 1, A.rz * A.k); A.bridges.forEach(b => { b.scale.x = A.bw * (0.55 + 0.45 * A.k); });
    A.t = (A.t || 0) + dt; A.streaks.forEach((s, i) => { s.material.opacity = 0.45 + 0.3 * Math.sin(A.t * 1.7 + i); });
    if (rnd() < dt * 2.5) { const a = rnd() * Math.PI * 2, x = A.r.x + Math.sin(a) * A.r.hx * (0.7 + rnd() * 0.3), z = A.r.z + Math.cos(a) * A.r.hz * (0.7 + rnd() * 0.3); R.fx && R.fx('poof', x, 0.2, z, { color: C(rnd() < 0.5 ? '#FFB04A' : '#FF5A1A'), n: 3 }); }
    if (!on || P.dead || P.air || (P.jump && P.y > 0.2) || R.roomIndexAt(P.x, P.z) !== A.r.i || safeLava(A, P)) { A.hot = 0; return; }
    A.hot = (A.hot || 0) - dt;
    if (!A.warned) { A.warned = true; R.toast && R.toast('腳下是熔岩！站回石島或石橋上', '#FF7A3A'); }
    if (A.hot <= 0) { A.hot = 0.5; P.iframe = 0; R.hurtPlayer(P.hpMax * 0.06 + 3, { name: '熔岩' }); P.slowT = Math.max(P.slowT || 0, 0.4); }
  };

  // ---------- 冰湖 ----------
  const buildIce = (F, r) => {
    const T = THREE, g = new T.Group(), A = { kind: 'ice', r, g, rx: Math.max(3, r.hx * 0.72), rz: Math.max(3, r.hz * 0.72), v: { x: 0, z: 0 }, pillars: [] };
    const ice = new T.Mesh(new T.CircleGeometry(1, 48), new T.MeshLambertMaterial({ color: C('#6FA8D8'), emissive: C('#2A5A8A'), emissiveIntensity: 0.35, transparent: true, opacity: 0.92 }));
    ice.rotation.x = -Math.PI / 2; ice.position.set(r.x, 0.025, r.z); ice.scale.set(A.rx, A.rz, 1); g.add(ice);
    const crack = new T.MeshBasicMaterial({ color: C('#F4FBFF'), transparent: true, opacity: 0.8 });
    for (let i = 0; i < 10; i++) { const a = rnd() * Math.PI * 2, L = 1 + rnd() * 2.5, c = new T.Mesh(new T.PlaneGeometry(0.06, L), crack), d = rnd() * 0.7; c.rotation.x = -Math.PI / 2; c.rotation.z = rnd() * Math.PI; c.position.set(r.x + Math.sin(a) * A.rx * d, 0.03, r.z + Math.cos(a) * A.rz * d); g.add(c); }
    const rimM = new T.Mesh(new T.RingGeometry(0.97, 1, 48), new T.MeshBasicMaterial({ color: C('#E8F6FF') })); rimM.rotation.x = -Math.PI / 2; rimM.position.set(r.x, 0.03, r.z); rimM.scale.set(A.rx, A.rz, 1); g.add(rimM);
    // 冰柱：一圈 6～8 根，每根是三塊冰晶
    const cryM = new T.MeshLambertMaterial({ color: C('#D8F2FF'), emissive: C('#6AB8FF'), emissiveIntensity: 0.45, transparent: true, opacity: 0.88 });
    const N = 6 + Math.floor(rnd() * 3), clear = (x, z) => ![...R.boxesNear(x, z)].some(c => x + 0.7 > c.x0 && x - 0.7 < c.x1 && z + 0.7 > c.z0 && z - 0.7 < c.z1);
    for (let i = 0; i < N; i++) {
      const a = (i + 0.5) / N * Math.PI * 2, x = r.x + Math.sin(a) * A.rx * 0.92, z = r.z + Math.cos(a) * A.rz * 0.92;
      if (R.roomIndexAt(x, z) !== r.i || !clear(x, z) || doorsOf(F, r).some(d => Math.hypot(d.x - x, d.z - z) < 3.2)) continue;
      const p = new T.Group(); [[0, 3.8, 0, 0.75], [0.5, 2.4, 0.3, 0.48], [-0.45, 1.8, -0.3, 0.42]].forEach(([ox, h, oz, w]) => { const c = new T.Mesh(new T.OctahedronGeometry(1, 0), cryM); c.scale.set(w, h / 2, w); c.position.set(ox, h / 2, oz); p.add(c); });
      p.position.set(x, 0, z); g.add(p); const box = R.addBox(x - 0.75, x + 0.75, z - 0.75, z + 0.75, 'deco'); A.pillars.push({ x, z, p, box });
      F.lights && i % 3 === 0 && F.lights.push({ x, y: 1.5, z, col: '#9AD8FF', I: 0.9, flick: 0 });
    }
    return A;
  };
  const onIce = (A, p) => { const dx = (p.x - A.r.x) / A.rx, dz = (p.z - A.r.z) / A.rz; return dx * dx + dz * dz < 1; };
  const shatter = (A, q) => { if (q.gone) return; q.gone = true; q.box.on = false; q.p.visible = false; R.fx && R.fx('poof', q.x, 1.2, q.z, { color: C('#D8F2FF'), n: 22 }); R.shake && R.shake(0.2); };
  const stepIce = (A, F, P, dt) => {
    const L = lordOf(A.r);
    if (L) {
      const br = (L.def.size || 1) * 0.9 + 1;
      A.pillars.forEach(q => { if (!q.gone && Math.hypot(L.x - q.x, L.z - q.z) < br) shatter(A, q); });
      if (L.lastMove != null && L.lastMove !== A.lm) { if (A.lm !== undefined) A.pillars.forEach(q => { if (!q.gone && Math.hypot(L.x - q.x, L.z - q.z) < br + 5 && rnd() < 0.5) shatter(A, q); }); A.lm = L.lastMove; }
    }
    // 滑：腳下是冰的時候，實際的移動往「慣性」那邊拉——放開方向鍵還會滑一段、轉彎慢半拍
    const last = A.last; A.last = { x: P.x, z: P.z };
    if (!last || P.dead || !dt || R.roomIndexAt(P.x, P.z) !== A.r.i || !onIce(A, P) || P.air) { A.v.x = A.v.z = 0; return; }
    const vx = (P.x - last.x) / dt, vz = (P.z - last.z) / dt;
    if (Math.hypot(vx, vz) > 25) { A.v.x = vx; A.v.z = vz; return; }   // 被傳送、瞬移：不算
    const k = Math.min(1, dt * 2.6); A.v.x += (vx - A.v.x) * k; A.v.z += (vz - A.v.z) * k;
    P.x = last.x + A.v.x * dt; P.z = last.z + A.v.z * dt; R.collide && R.collide(P, 0.42); A.last = { x: P.x, z: P.z };
    if (!A.told) { A.told = true; R.toast && R.toast('冰面很滑：停不太下來，轉彎要早一點', '#9AD8FF'); }
  };

  // ---------- 蛛網巢 ----------
  R.ENEMIES.lr_eggsac = { name: '蛛卵囊', hp: 90, dmg: 0, speed: 0, xp: 6, size: 0.9, ai: 'eggsac', color: '#E8E0D0', eye: '#B08AFF', noDex: 1,
    desc: '巢織蛛產在牆邊的卵囊，裡面的小蜘蛛隔著薄膜在動。不打破的話，過一陣子會孵出來。' };
  (() => { if (!R.BEAST_ART) return; const rows = fr => { const w = 18, h = 18, g = Array.from({ length: h }, () => Array(w).fill('.')), p = (x, y, c) => { if (x >= 0 && y >= 0 && x < w && y < h) g[y][x] = c; };
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (x - 9) / (fr ? 7.4 : 7), dy = (y - 10) / (fr ? 7 : 7.4), d = dx * dx + dy * dy; if (d <= 1) p(x, y, d > 0.75 ? 'd' : (x + y) % 5 === 0 ? 's' : 'w'); }
    [[7, 9], [10, 11], [8, 13], [11, 8]].forEach(([x, y]) => p(x, y, 'e')); for (let x = 2; x < 16; x += 3) p(x, 17, 'd'); return g.map(r => r.join('')); };
    R.BEAST_ART.lr_eggsac = { pal: { w: '#E8E0D0', s: '#C8C0B0', d: '#8A8070', e: '#B08AFF' }, a: rows(0), b: rows(1) }; })();
  const AI = R.AI_X = R.AI_X || {};
  AI.eggsac = (e, P, d, a, sp, dt) => {
    e.hatch = (e.hatch == null ? 18 + rnd() * 8 : e.hatch) - dt;
    if (e.hatch < 3 && !e.warned) { e.warned = true; R.fx && R.fx('ring', e.x, 0.1, e.z, { r: 1.4, color: C('#B08AFF') }); }
    if (e.hatch <= 0 && !e.dead) {
      e.dead = true; e.hp = 0; if (e.m && e.m.g && e.m.g.parent) e.m.g.parent.remove(e.m.g);
      R.fx && R.fx('poof', e.x, 0.6, e.z, { color: C('#E8E0D0'), n: 16 });
      const id = R.ENEMIES.thunderspider ? 'thunderspider' : 'kodama';
      for (let i = 0; i < 3; i++) { const an = i / 3 * Math.PI * 2, p = R.nearestFloor(e.x + Math.sin(an) * 0.9, e.z + Math.cos(an) * 0.9); R.spawnEnemy(id, p[0], p[1], e.room, { aggro: true, noAffix: true }); }
      R.toast && R.toast('卵囊孵化了！', '#B08AFF');
    }
    return false;
  };
  const buildWeb = (F, r) => {
    const T = THREE, g = new T.Group(), A = { kind: 'web', r, g, webs: [] }, lineM = new T.MeshBasicMaterial({ color: C('#F0F0F0'), transparent: true, opacity: 0.55 });
    const n = Math.max(6, Math.min(14, Math.round((r.hx * r.hz) / 30)));
    for (let i = 0; i < n; i++) {
      const [x, z] = R.roomPoint(r, {}); if (Math.hypot(x - r.x, z - r.z) < 3 || A.webs.some(w => Math.hypot(w.x - x, w.z - z) < 4)) continue;
      const rad = 1.5 + rnd() * 0.8, w = new T.Group();
      for (let s = 0; s < 8; s++) { const l = new T.Mesh(new T.PlaneGeometry(0.05, rad * 2), lineM); l.rotation.x = -Math.PI / 2; l.rotation.z = s / 8 * Math.PI; w.add(l); }
      [0.35, 0.65, 0.95].forEach(k => { const ring = new T.Mesh(new T.RingGeometry(rad * k - 0.03, rad * k, 8), lineM); ring.rotation.x = -Math.PI / 2; w.add(ring); });
      w.position.set(x, 0.04, z); g.add(w); A.webs.push({ x, z, rad });
    }
    // 牆角垂下來的蛛絲（從頭頂斜斜拉到地上）
    for (let i = 0; i < 10; i++) { const [x, z] = R.roomPoint(r, { edge: true }), h = 4 + rnd() * 2, l = new T.Mesh(new T.PlaneGeometry(0.04, h), lineM); l.position.set(x, h / 2, z); l.rotation.z = (rnd() - 0.5) * 0.6; l.rotation.y = rnd() * Math.PI; g.add(l); }
    F.lights && F.lights.push({ x: r.x, y: 3, z: r.z, col: '#B08AFF', I: 0.9, flick: 0 });
    return A;
  };
  const stepWeb = (A, F, P) => {
    if (P.dead || R.roomIndexAt(P.x, P.z) !== A.r.i || P.air) return;
    if (A.webs.some(w => Math.hypot(P.x - w.x, P.z - w.z) < w.rad)) { P.slowT = Math.max(P.slowT || 0, 0.35); if (!A.told) { A.told = true; R.toast && R.toast('被蛛網黏住，走不快', '#E8E8E8'); } }
  };
  // ---------- 克森特級以上：外圈疊上這座遺跡的環境（2026-10-19 作者：中間維持岩漿池、外側全部是積雪……） ----------
  // 房間正中間 78% 的橢圓是領主體自己的場地，外面一圈換成遺跡的環境；積雪、沙、淺水會讓人變慢。跟領主體本來的環境一樣就不疊（火山的熔岩池、凍原的冰湖）。
  const ENVR = {
    snow: { col: '#E8F0F8', slow: 0.25, n: '積雪', bump: '#F6FAFF' }, desert: { col: '#C8A868', slow: 0.2, n: '沙地', bump: '#D8B878' },
    volcano: { col: '#3A2A24', crack: '#FF6A2A', n: '焦土' }, deep: { col: '#2A5A6A', slow: 0.3, n: '淺水', op: 0.85 }, forge: { col: '#55555C', n: '鐵板', crack: '#8A8A92' }
  };
  const NATIVE = { lava: 'volcano', ice: 'snow' }, KI = 0.78;
  const buildEnv = (F, r, A, run) => {
    const env = run.env, E = ENVR[env]; if (!E || (run.grade.lv || 0) < 4 || NATIVE[A.kind] === env) return;
    const T = THREE, sh = new T.Shape(), hx = r.hx + 0.5, hz = r.hz + 0.5;
    sh.moveTo(-hx, -hz); sh.lineTo(hx, -hz); sh.lineTo(hx, hz); sh.lineTo(-hx, hz); sh.lineTo(-hx, -hz);
    const hole = new T.Path(); hole.absellipse(0, 0, r.hx * KI, r.hz * KI, 0, Math.PI * 2, false, 0); sh.holes.push(hole);
    const m = new T.Mesh(new T.ShapeGeometry(sh, 48), new T.MeshLambertMaterial({ color: C(E.col), transparent: !!E.op, opacity: E.op || 1 }));
    m.rotation.x = -Math.PI / 2; m.position.set(r.x, 0.024, r.z); A.g.add(m);
    // 外圈的小東西：雪堆、沙丘、地上的裂縫
    for (let i = 0; i < 18; i++) {
      const a = rnd() * Math.PI * 2, k = KI + 0.05 + rnd() * 0.2, x = r.x + Math.sin(a) * r.hx * k, z = r.z + Math.cos(a) * r.hz * k; if (R.roomIndexAt(x, z) !== r.i) continue;
      if (E.bump) { const b = new T.Mesh(new T.SphereGeometry(0.5 + rnd() * 0.6, 8, 5), new T.MeshLambertMaterial({ color: C(E.bump) })); b.scale.y = 0.35; b.position.set(x, 0.03, z); A.g.add(b); }
      if (E.crack) { const c = new T.Mesh(new T.PlaneGeometry(0.08, 1 + rnd() * 2), new T.MeshBasicMaterial({ color: C(E.crack) })); c.rotation.x = -Math.PI / 2; c.rotation.z = rnd() * Math.PI; c.position.set(x, 0.03, z); A.g.add(c); }
    }
    A.env = E;
  };
  const inCore = (A, p) => { const dx = (p.x - A.r.x) / (A.r.hx * KI), dz = (p.z - A.r.z) / (A.r.hz * KI); return dx * dx + dz * dz < 1; };
  const stepEnv = (A, P) => {
    if (!A.env || P.dead || P.air || R.roomIndexAt(P.x, P.z) !== A.r.i || inCore(A, P)) return;
    if (A.env.slow) P.slowT = Math.max(P.slowT || 0, A.env.slow);
    if (!A.envTold) { A.envTold = true; R.toast && R.toast('房間外圈是' + A.env.n + (A.env.slow ? '：走起來比較慢' : ''), '#C8D8E8'); }
  };
  const BUILD = { lava: buildLava, ice: buildIce, web: buildWeb }, STEP = { lava: stepLava, ice: stepIce, web: stepWeb };

  // ---------- 蓋樓層：先決定是哪一隻，再蓋牠的房間 ----------
  const bf0 = R.buildFloor;
  R.buildFloor = (scene, run, F) => {
    const lr = (F && F.rooms || []).filter(r => r.type === 'lord');
    lr.forEach(r => { r.lordId = r.lordId || pickLord(run); r.arena = ARENA[r.lordId] || null; });
    const out = bf0(scene, run, F);
    F.arenas = [];
    try { lr.forEach(r => { if (!r.arena || !window.THREE) return; const A = BUILD[r.arena](F, r); buildEnv(F, r, A, run); F.group.add(A.g); F.arenas.push(A); }); } catch (e) { console.warn('[lordarena]', e); }
    return out;
  };
  // 進領主房：照蓋的時候挑好的那一隻生
  const en0 = R.enterRoom;
  R.enterRoom = r => {
    const run = W().run;
    if (!r || r.type !== 'lord' || !r.lordId || r.cleared || r.locked || !run || !run.grade) return en0(r);
    const g = run.grade, L0 = g.lords; g.lords = [r.lordId];
    let out; try { out = en0(r); } finally { g.lords = L0; }
    try {
      if (r.arena === 'web' && !r.eggs) { r.eggs = 1; const n = 3 + (run.grade.lv >= 5 ? 1 : 0); for (let i = 0; i < n; i++) { const [x, z] = R.roomPoint(r, { edge: true }); R.spawnEnemy('lr_eggsac', x, z, r.i, { aggro: true, noAffix: true }); } }
    } catch (e) { console.warn('[lordarena]', e); }
    return out;
  };
  const st0 = R.step;
  R.step = dt => {
    const r = st0(dt), w = W();
    try { const F = w.F, P = w.P; if (w.run && F && F.arenas && F.arenas.length && P && !w.paused) F.arenas.forEach(A => { STEP[A.kind](A, F, P, dt); stepEnv(A, P); }); } catch (e) { console.warn('[lordarena]', e); }
    return r;
  };
})(window.R);
