// 其他領主體的房間（2026-10-19 作者：照每一隻的特性佈置；接在 lordarena.js 的 R.LORD_ARENA 上）
// - 萬骸之王：骨堆墓場。骨堆可以躲；牠出招時身邊的骨堆碎掉，骨片往四面飛。
// - 千棘狼王：黑森林的空地。枯樹可以擋刺；牆邊一圈刺藤，碰到會被刺。
// - 深淵之主：半淹水的石廳。淺水會變慢、深水更慢；觸手從深水冒出來（地上先亮）。
// - 天狂風神：斷崖上的平台。每隔一陣子一陣強風把人往外吹；被吹到崖邊會受傷、被彈回來。
// - 亡骸天災：崩塌的龍巢。一座座肋骨拱門可以躲；牠撞到或出招會打斷。
// - 噬骨千足：礦坑。礦車軌道、木樑；牠出招時附近的木樑塌下來（地上先亮）。
// - 無主大鎧：王座廳。兩排鎧甲，打起來以後每隔一陣子有兩具活過來。
// - 萬雷之王：雷雲下的山頂。雷每隔一陣子劈你站的地方（地上先亮）；站在避雷石柱旁邊，雷會被石柱引走一大半。
// - 沙海吞天：流沙場。中間的流沙漩渦把人往中間拉，捲到中心會受傷；站在石台上不會被拉。
// - 千面之森：樹根盤成的大廳。樹根上的人臉眼睛一亮，附近就會冒出尖根（會被纏住）。
// - 緋喙屍鷲：沙漠裡的屍骨場。枯樹上停著屍鴉，打起來以後一隻一隻俯衝下來啄你。
// 放在 lordarena.js 後面。
(function (R) {
  const LA = R.LORD_ARENA; if (!LA) return;
  const W = () => R.W, rnd = Math.random;
  const C = h => new THREE.Color(h).convertSRGBToLinear();
  const M = (h, o) => new THREE.MeshLambertMaterial(Object.assign({ color: C(h) }, o && o.em ? { emissive: C(o.em), emissiveIntensity: o.ei || 0.6 } : {}, o && o.op ? { transparent: true, opacity: o.op } : {}));
  const B = (h, o) => new THREE.MeshBasicMaterial(Object.assign({ color: C(h) }, o && o.op ? { transparent: true, opacity: o.op } : {}));
  const doorsOf = (F, r) => { const t = F.tile; return (r.doors || []).map(k => { const tx = k % t.nx, tz = (k - tx) / t.nx; return { x: t.cX(tx), z: t.cZ(tz) }; }); };
  const lordOf = r => (W().enemies || []).find(e => !e.dead && e.room === r.i && /^領主體/.test((e.def && e.def.name) || ''));
  const fighting = (F, r) => !(F.lordGate && F.lordGate.down) && !!lordOf(r);
  const inRoom = (r, p) => R.roomIndexAt(p.x, p.z) === r.i;
  const ell = (r, p, k) => { const dx = (p.x - r.x) / (r.hx * k), dz = (p.z - r.z) / (r.hz * k); return dx * dx + dz * dz; };
  const free = (F, r, x, z, rad) => R.roomIndexAt(x, z) === r.i && !doorsOf(F, r).some(d => Math.hypot(d.x - x, d.z - z) < 3.6) && ![...R.boxesNear(x, z)].some(c => x + rad > c.x0 && x - rad < c.x1 && z + rad > c.z0 && z - rad < c.z1);
  // 沿著橢圓找 n 個空位
  const ring = (F, r, n, k0, k1, rad, gap) => { const out = []; for (let i = 0; i < n * 6 && out.length < n; i++) { const a = rnd() * Math.PI * 2, k = k0 + rnd() * (k1 - k0), x = r.x + Math.sin(a) * r.hx * k, z = r.z + Math.cos(a) * r.hz * k; if (free(F, r, x, z, rad) && !out.some(o => Math.hypot(o.x - x, o.z - z) < gap)) out.push({ x, z, a }); } return out; };
  const box = (x, z, h) => R.addBox(x - h, x + h, z - h, z + h, 'deco');
  const mesh = (geo, mat, x, y, z, g) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; g.add(m); return m; };
  const flat = (geo, mat, x, y, z, g) => { const m = new THREE.Mesh(geo, mat); m.rotation.x = -Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; };
  // 地上先亮一圈，過一下再打
  const tele = (x, z, rad, ms, col, fn) => { const run = W().run; R.fx && R.fx('mark', x, 0, z, { r: rad, t: ms / 1000, color: col }); setTimeout(() => { if (W().run === run && run && !run.done) fn(); }, ms); };
  const hitP = (x, z, rad, frac, name, o) => { const P = W().P; if (!P || P.dead || Math.hypot(P.x - x, P.z - z) > rad) return false; P.iframe = 0; R.hurtPlayer(P.hpMax * frac + 2, { name }, o || {}); return true; };
  const breakProp = q => { if (q.gone) return; q.gone = true; if (q.box) q.box.on = false; if (q.boxes) q.boxes.forEach(b => { b.on = false; }); q.g.visible = false; };
  // 領主體出招（lordlogic.js 每出一招 e.lastMove 會換）
  const moved = (A, L) => { if (!L || L.lastMove == null || L.lastMove === A.lm) return false; const first = A.lm === undefined; A.lm = L.lastMove; return !first; };
  const every = (A, k, dt, sec) => { A[k] = (A[k] == null ? sec * 0.6 : A[k]) - dt; if (A[k] > 0) return false; A[k] = sec * (0.85 + rnd() * 0.3); return true; };
  const shard = (x, z, n, L, col) => { for (let i = 0; i < n; i++) R.fire({ kind: 'feather', owner: 'e', x, z, a: i / n * Math.PI * 2 + rnd() * 0.3, speed: 8, dmg: (L ? L.dmg : 15) * 0.45, life: 1.1, src: L || null }); R.fx && R.fx('poof', x, 0.8, z, { color: col, n: 18 }); };
  // 房間的外圈（矩形扣掉中間的橢圓）
  const band = (r, k, mat, y, g) => { const T = THREE, sh = new T.Shape(), hx = r.hx + 0.5, hz = r.hz + 0.5; sh.moveTo(-hx, -hz); sh.lineTo(hx, -hz); sh.lineTo(hx, hz); sh.lineTo(-hx, hz); sh.lineTo(-hx, -hz); const h = new T.Path(); h.absellipse(0, 0, r.hx * k, r.hz * k, 0, Math.PI * 2, false, 0); sh.holes.push(h); return flat(new T.ShapeGeometry(sh, 48), mat, r.x, y, r.z, g); };
  const disc = (r, k, mat, y, g) => { const m = flat(new THREE.CircleGeometry(1, 48), mat, r.x, y, r.z, g); m.scale.set(r.hx * k, r.hz * k, 1); return m; };
  const L = (id, kind, build, step) => { LA.ARENA[id] = kind; LA.BUILD[kind] = build; LA.STEP[kind] = step; };

  // ---------- 萬骸之王：骨堆墓場 ----------
  L('gashadokuro', 'bones', (F, r) => {
    const g = new THREE.Group(), A = { kind: 'bones', r, g, piles: [] }, bone = M('#E8E0CC'), boneD = M('#B8AE98');
    disc(r, 0.85, M('#4A443C'), 0.022, g);
    ring(F, r, 8, 0.4, 0.8, 1.5, 6).forEach(({ x, z }) => {
      const pg = new THREE.Group(); for (let i = 0; i < 5; i++) { const b = mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2 + rnd() * 0.6, 6), i % 2 ? bone : boneD, (rnd() - 0.5) * 0.9, 0.25 + i * 0.12, (rnd() - 0.5) * 0.9, pg); b.rotation.set(Math.PI / 2 * rnd(), rnd() * 3, Math.PI / 2); }
      mesh(new THREE.SphereGeometry(0.38, 8, 6), bone, 0.1, 0.95, 0, pg); pg.position.set(x, 0, z); pg.scale.setScalar(1.7); g.add(pg); A.piles.push({ x, z, g: pg, box: box(x, z, 1.1) });
    });
    ring(F, r, 5, 0.85, 0.95, 1.5, 7).forEach(({ x, z, a }) => { const b = mesh(new THREE.CylinderGeometry(0.35, 0.45, 5, 8), bone, x, 0.4, z, g); b.rotation.set(1.2, a, 0); });   // 半埋在地上的巨骨
    return A;
  }, (A, F, P, dt) => {
    const Lr = lordOf(A.r); if (!moved(A, Lr)) return;
    A.piles.forEach(q => { if (!q.gone && Math.hypot(Lr.x - q.x, Lr.z - q.z) < (Lr.BR || 3) + 6) { breakProp(q); shard(q.x, q.z, 8, Lr, '#E8E0CC'); } });
  });

  // ---------- 千棘狼王：黑森林 ----------
  L('spikewolf', 'thorn', (F, r) => {
    const g = new THREE.Group(), A = { kind: 'thorn', r, g, doors: doorsOf(F, r) }, bark = M('#2A2220'), barkL = M('#3A302A'), vine = M('#3A1A1A'), spike = M('#8A6A5A');
    disc(r, 0.9, M('#2A2E24'), 0.022, g); band(r, 0.9, vine, 0.026, g);
    for (let i = 0; i < 40; i++) { const a = i / 40 * Math.PI * 2, x = r.x + Math.sin(a) * r.hx * 0.95, z = r.z + Math.cos(a) * r.hz * 0.95; if (!inRoom(r, { x, z })) continue; const c = mesh(new THREE.ConeGeometry(0.18, 0.9, 5), spike, x, 0.45, z, g); c.rotation.z = (rnd() - 0.5) * 0.8; }
    ring(F, r, 7, 0.35, 0.75, 1.2, 6).forEach(({ x, z }) => {
      const tg = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.35, 0.55, 5, 7), bark, 0, 2.5, 0, tg);
      for (let k = 0; k < 3; k++) { const b = mesh(new THREE.CylinderGeometry(0.08, 0.16, 2.2, 5), barkL, 0, 3.4 + k * 0.5, 0, tg); b.rotation.set(0, k * 2.1, 0.9); b.position.x = Math.cos(k * 2.1) * 0.7; b.position.z = -Math.sin(k * 2.1) * 0.7; }
      tg.position.set(x, 0, z); g.add(tg); box(x, z, 0.55);
    });
    return A;
  }, (A, F, P, dt) => {
    if (!fighting(F, A.r) || P.dead || P.air || !inRoom(A.r, P) || ell(A.r, P, 0.9) < 1 || A.doors.some(d => Math.hypot(d.x - P.x, d.z - P.z) < 3)) { A.t = 0; return; }
    A.t = (A.t || 0) - dt; if (A.t > 0) return; A.t = 0.8; P.iframe = 0; R.hurtPlayer(P.hpMax * 0.05 + 2, { name: '刺藤' }); P.slowT = Math.max(P.slowT || 0, 0.5);
    if (!A.told) { A.told = true; R.toast && R.toast('牆邊的刺藤會刺人！', '#C86A5A'); }
  });

  // ---------- 深淵之主：半淹水的石廳 ----------
  LA.NOENV.flood = 1;
  L('kraken', 'flood', (F, r) => {
    const g = new THREE.Group(), A = { kind: 'flood', r, g };
    disc(r, 0.88, M('#3A7A8A', { op: 0.8, em: '#1A4A5A', ei: 0.3 }), 0.022, g); A.deep = disc(r, 0.5, M('#0E2A3A', { op: 0.92, em: '#08303A', ei: 0.5 }), 0.026, g);
    for (let i = 0; i < 14; i++) { const a = rnd() * Math.PI * 2, k = 0.55 + rnd() * 0.3; const m = flat(new THREE.RingGeometry(0.4, 0.5, 16), B('#A8E0F0', { op: 0.5 }), r.x + Math.sin(a) * r.hx * k, 0.03, r.z + Math.cos(a) * r.hz * k, g); m.userData.wave = rnd() * 6; (A.waves = A.waves || []).push(m); }
    F.lights && F.lights.push({ x: r.x, y: 1, z: r.z, col: '#3AA8C8', I: 1.1, flick: 0 });
    return A;
  }, (A, F, P, dt) => {
    A.t = (A.t || 0) + dt; (A.waves || []).forEach(m => { const s = 1 + ((A.t + m.userData.wave) % 2); m.scale.set(s, s, 1); m.material.opacity = 0.5 * (1 - ((A.t + m.userData.wave) % 2) / 2); });
    if (P.dead || !inRoom(A.r, P)) return;
    const d = ell(A.r, P, 0.5); if (!P.air) { if (d < 1) P.slowT = Math.max(P.slowT || 0, 0.5); else if (ell(A.r, P, 0.88) < 1) P.slowT = Math.max(P.slowT || 0, 0.2); }
    if (!fighting(F, A.r) || !every(A, 'tk', dt, 6)) return;
    // 觸手：從深水裡離你最近的地方冒出來
    let x = P.x, z = P.z; if (d >= 1) { const s = 1 / Math.sqrt(d) * 0.95; x = A.r.x + (P.x - A.r.x) * s; z = A.r.z + (P.z - A.r.z) * s; }
    const Lr = lordOf(A.r);
    tele(x, z, 2.2, 1000, '#3AA8C8', () => {
      const t = mesh(new THREE.CylinderGeometry(0.15, 0.6, 4.5, 8), M('#5A2A4A', { em: '#3A1A2A', ei: 0.3 }), x, 2.2, z, A.g); setTimeout(() => { A.g.remove(t); }, 700);
      R.fx && R.fx('poof', x, 0.4, z, { color: '#A8E0F0', n: 20 }); if (hitP(x, z, 2.2, 0.1, '觸手', { knock: 0.5 })) R.shake && R.shake(0.3);
    });
    if (Lr && !A.told) { A.told = true; R.toast && R.toast('深水會冒出觸手——地上亮起來就快閃', '#3AA8C8'); }
  });

  // ---------- 天狂風神：斷崖上的平台 ----------
  LA.NOENV.cliff = 1;
  L('windelder', 'cliff', (F, r) => {
    const g = new THREE.Group(), A = { kind: 'cliff', r, g }, rail = M('#8A8478');
    band(r, 0.86, M('#0A0E1A'), 0.03, g);
    for (let i = 0; i < 16; i++) { const a = rnd() * Math.PI * 2, k = 0.9 + rnd() * 0.08, x = r.x + Math.sin(a) * r.hx * k, z = r.z + Math.cos(a) * r.hz * k; const c = mesh(new THREE.SphereGeometry(0.8 + rnd(), 8, 5), M('#E8ECF4', { op: 0.55 }), x, 0.1, z, g); c.scale.y = 0.25; }
    const n = Math.round((r.hx + r.hz) * 0.7); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, x = r.x + Math.sin(a) * r.hx * 0.85, z = r.z + Math.cos(a) * r.hz * 0.85; if (inRoom(r, { x, z })) mesh(new THREE.BoxGeometry(0.4, 0.7, 0.4), rail, x, 0.35, z, g); }
    return A;
  }, (A, F, P, dt) => {
    if (P.dead || !inRoom(A.r, P)) return;
    if (A.push > 0) { A.push -= dt; P.x += A.dx * 6 * dt; P.z += A.dz * 6 * dt; R.collide && R.collide(P, 0.42); if (rnd() < dt * 20) R.fx && R.fx('poof', P.x - A.dx, 1, P.z - A.dz, { color: '#E8ECF4', n: 2 }); }
    if (ell(A.r, P, 0.86) > 1 && !P.air) {   // 被吹到崖邊：受傷、彈回裡面
      A.edge = (A.edge || 0) - dt; if (A.edge <= 0) { A.edge = 0.6; P.iframe = 0; R.hurtPlayer(P.hpMax * 0.08 + 2, { name: '斷崖的邊' }); const a = Math.atan2(A.r.x - P.x, A.r.z - P.z); P.x += Math.sin(a) * 2.5; P.z += Math.cos(a) * 2.5; R.collide && R.collide(P, 0.42); R.toast && R.toast('差點掉下去！', '#E8ECF4'); }
    }
    if (!fighting(F, A.r) || !every(A, 'gt', dt, 7)) return;
    const a = Math.atan2(P.x - A.r.x, P.z - A.r.z) + (rnd() - 0.5) * 0.8; A.dx = Math.sin(a); A.dz = Math.cos(a);
    R.banner && R.banner('強風', '要被吹到崖邊了——往裡面走'); R.fx && R.fx('aim', P.x, 0.3, P.z, { a, len: 6, t: 0.6 });
    setTimeout(() => { A.push = 1.1; }, 600);
  });

  // ---------- 亡骸天災：崩塌的龍巢 ----------
  L('bonewyvern', 'ribs', (F, r) => {
    const g = new THREE.Group(), A = { kind: 'ribs', r, g, ribs: [] }, bone = M('#D8D0BC');
    disc(r, 0.85, M('#3A342E'), 0.022, g);
    ring(F, r, 6, 0.45, 0.75, 1.6, 7).forEach(({ x, z, a }) => {
      const rg = new THREE.Group(); const arc = mesh(new THREE.TorusGeometry(2.2, 0.24, 6, 14, Math.PI), bone, 0, 0, 0, rg); arc.rotation.y = a; rg.position.set(x, 0, z); g.add(rg);
      const ox = Math.cos(a) * 2.2, oz = -Math.sin(a) * 2.2; A.ribs.push({ x, z, g: rg, boxes: [box(x + ox, z + oz, 0.4), box(x - ox, z - oz, 0.4)] });
    });
    return A;
  }, (A, F, P, dt) => {
    const Lr = lordOf(A.r); if (!Lr) return; const br = (Lr.BR || 3) + 1.5;
    A.ribs.forEach(q => { if (!q.gone && Math.hypot(Lr.x - q.x, Lr.z - q.z) < br) { breakProp(q); R.fx && R.fx('poof', q.x, 1.5, q.z, { color: '#D8D0BC', n: 20 }); } });
    if (moved(A, Lr)) A.ribs.forEach(q => { if (!q.gone && Math.hypot(Lr.x - q.x, Lr.z - q.z) < br + 6 && rnd() < 0.4) { breakProp(q); R.fx && R.fx('poof', q.x, 1.5, q.z, { color: '#D8D0BC', n: 20 }); } });
  });

  // ---------- 噬骨千足：礦坑 ----------
  L('omukade', 'mine', (F, r) => {
    const g = new THREE.Group(), A = { kind: 'mine', r, g, beams: [] }, wood = M('#6A4A2A'), rail = M('#4A4A50'), tie = M('#3A2A1A');
    disc(r, 0.88, M('#3A3028'), 0.022, g);
    [[1, 0], [0, 1]].forEach(([ax, az], j) => { const len = (ax ? r.hx : r.hz) * 1.7, off = (j ? 3 : -3); [-0.6, 0.6].forEach(o => { const m = mesh(new THREE.BoxGeometry(ax ? len : 0.12, 0.08, ax ? 0.12 : len), rail, r.x + (az ? o + off : 0), 0.05, r.z + (ax ? o + off : 0), g); m.castShadow = false; }); for (let u = -len / 2; u < len / 2; u += 1.4) mesh(new THREE.BoxGeometry(ax ? 0.3 : 1.6, 0.05, ax ? 1.6 : 0.3), tie, r.x + (ax ? u : off), 0.03, r.z + (ax ? off : u), g); });
    ring(F, r, 7, 0.35, 0.8, 1.6, 6).forEach(({ x, z, a }) => {
      const bg = new THREE.Group(), ox = Math.cos(a) * 1.4, oz = -Math.sin(a) * 1.4;
      mesh(new THREE.BoxGeometry(0.35, 3.6, 0.35), wood, ox, 1.8, oz, bg); mesh(new THREE.BoxGeometry(0.35, 3.6, 0.35), wood, -ox, 1.8, -oz, bg); const top = mesh(new THREE.BoxGeometry(3.4, 0.35, 0.4), wood, 0, 3.6, 0, bg); top.rotation.y = a;
      bg.position.set(x, 0, z); g.add(bg); A.beams.push({ x, z, g: bg, boxes: [box(x + ox, z + oz, 0.25), box(x - ox, z - oz, 0.25)] });
    });
    return A;
  }, (A, F, P, dt) => {
    const Lr = lordOf(A.r); if (!moved(A, Lr)) return;
    const q = A.beams.filter(b => !b.gone).sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z))[0]; if (!q || Math.hypot(q.x - P.x, q.z - P.z) > 12) return;
    q.gone = true; tele(q.x, q.z, 2.6, 1200, '#C8A060', () => { breakProp(q); R.fx && R.fx('poof', q.x, 1, q.z, { color: '#8A7050', n: 26 }); R.shake && R.shake(0.3); hitP(q.x, q.z, 2.6, 0.15, '塌下來的木樑'); });
    if (!A.told) { A.told = true; R.toast && R.toast('木樑要塌了——快離開亮起來的地方', '#C8A060'); }
  });

  // ---------- 無主大鎧：王座廳 ----------
  L('muhyo', 'throne', (F, r) => {
    const g = new THREE.Group(), A = { kind: 'throne', r, g, st: [] }, along = r.hx >= r.hz, armor = M('#2A2A34'), trim = M('#8A6A2A', { em: '#4A3010', ei: 0.4 }), blade = M('#C8CCD8');
    const carpet = flat(new THREE.PlaneGeometry(along ? r.hx * 1.7 : 3.2, along ? 3.2 : r.hz * 1.7), M('#6A1A1A'), r.x, 0.024, r.z, g); carpet.receiveShadow = true;
    // 王座在長邊的一頭
    const tx = r.x + (along ? r.hx * 0.82 : 0), tz = r.z + (along ? 0 : r.hz * 0.82);
    if (inRoom(r, { x: tx, z: tz })) { mesh(new THREE.BoxGeometry(2.4, 1, 2.4), armor, tx, 0.5, tz, g); mesh(new THREE.BoxGeometry(along ? 0.5 : 2.4, 3.6, along ? 2.4 : 0.5), trim, tx + (along ? 1 : 0), 2.3, tz + (along ? 0 : 1), g); box(tx, tz, 1.2); }
    const n = Math.max(3, Math.round((along ? r.hx : r.hz) / 6)), Lh = (along ? r.hx : r.hz) * 0.7, Wd = (along ? r.hz : r.hx) * 0.55;
    for (let i = 0; i < n; i++) [-1, 1].forEach(sd => {
      const u = -Lh + (2 * Lh) * (i + 0.5) / n, x = r.x + (along ? u : sd * Wd), z = r.z + (along ? sd * Wd : u); if (!free(F, r, x, z, 0.8)) return;
      const sg = new THREE.Group(); mesh(new THREE.BoxGeometry(0.9, 1.4, 0.6), armor, 0, 1.3, 0, sg); mesh(new THREE.SphereGeometry(0.34, 8, 6), armor, 0, 2.25, 0, sg); mesh(new THREE.BoxGeometry(1, 0.12, 0.7), trim, 0, 1.95, 0, sg); mesh(new THREE.BoxGeometry(0.4, 0.6, 0.4), armor, 0, 0.3, 0, sg);
      const sw = mesh(new THREE.BoxGeometry(0.1, 1.8, 0.2), blade, 0.6, 1.2, 0, sg); sw.rotation.z = 0.15;
      sg.position.set(x, 0, z); sg.rotation.y = along ? (sd > 0 ? Math.PI : 0) : (sd > 0 ? -Math.PI / 2 : Math.PI / 2); g.add(sg); A.st.push({ x, z, g: sg, box: box(x, z, 0.5) });
    });
    return A;
  }, (A, F, P, dt) => {
    if (!fighting(F, A.r) || !every(A, 'aw', dt, 14)) return;
    const left = A.st.filter(q => !q.gone); if (!left.length) return; const id = R.ENEMIES.ashigaru ? 'ashigaru' : null; if (!id) return;
    left.sort(() => rnd() - 0.5).slice(0, 2).forEach(q => { breakProp(q); R.fx && R.fx('poof', q.x, 1.2, q.z, { color: '#8A6A2A', n: 14 }); R.spawnEnemy(id, q.x, q.z, A.r.i, { aggro: true, noAffix: true }); });
    R.toast && R.toast('兩旁的鎧甲活過來了！', '#C8A040');
  });

  // ---------- 萬雷之王：雷雲下的山頂 ----------
  L('thunderape', 'summit', (F, r) => {
    const g = new THREE.Group(), A = { kind: 'summit', r, g, rods: [] }, stone = M('#5A5A62'), tip = M('#E8E0A0', { em: '#FFE84A', ei: 0.8 });
    disc(r, 0.88, M('#4A4A50'), 0.022, g);
    for (let i = 0; i < 12; i++) { const [x, z] = R.roomPoint(r, {}); if (!free(F, r, x, z, 0.6)) continue; const rk = mesh(new THREE.DodecahedronGeometry(0.4 + rnd() * 0.5, 0), stone, x, 0.2, z, g); rk.scale.y = 0.5; }
    ring(F, r, 5, 0.35, 0.7, 1, 8).forEach(({ x, z }) => {
      const rg = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.4, 0.6, 4, 7), stone, 0, 2, 0, rg); const t = mesh(new THREE.ConeGeometry(0.22, 1.2, 6), tip, 0, 4.6, 0, rg);
      rg.position.set(x, 0, z); g.add(rg); box(x, z, 0.55); A.rods.push({ x, z, tip: t });
      F.lights && F.lights.push({ x, y: 4.5, z, col: '#FFE84A', I: 0.7, flick: rnd() * 10 });
    });
    return A;
  }, (A, F, P, dt) => {
    A.rods.forEach(q => { if (q.fl > 0) { q.fl -= dt; q.tip.material.emissiveIntensity = 0.8 + q.fl * 6; } });
    if (!fighting(F, A.r) || !every(A, 'zt', dt, 5) || P.dead || !inRoom(A.r, P)) return;
    const x = P.x, z = P.z;
    tele(x, z, 2.2, 1200, '#FFE84A', () => {
      const rod = A.rods.find(q => Math.hypot(q.x - x, q.z - z) < 3.8);
      const bolt = mesh(new THREE.BoxGeometry(0.25, 14, 0.25), B('#FFF8C0'), rod ? rod.x : x, 7, rod ? rod.z : z, A.g); setTimeout(() => A.g.remove(bolt), 180);
      R.fx && R.fx('ring', x, 0.1, z, { r: 2.2, color: '#FFE84A' }); R.shake && R.shake(0.25);
      if (rod) { rod.fl = 0.4; hitP(x, z, 2.2, 0.03, '落雷（被石柱引走）'); } else hitP(x, z, 2.2, 0.12, '落雷');
    });
    if (!A.told) { A.told = true; R.toast && R.toast('雷會劈你站的地方——站到避雷石柱旁邊，雷會被引走', '#FFE84A'); }
  });

  // ---------- 沙海吞天：流沙場 ----------
  L('sandwhale', 'sand', (F, r) => {
    const g = new THREE.Group(), A = { kind: 'sand', r, g, rocks: [], swirl: [] };
    disc(r, 0.9, M('#C8A868'), 0.022, g);
    for (let i = 0; i < 5; i++) { const m = flat(new THREE.RingGeometry(0.6 + i * 0.85, 0.9 + i * 0.85, 40, 1, 0, Math.PI * 1.5), M(i % 2 ? '#8A6A3A' : '#A8884A'), r.x, 0.026 + i * 0.001, r.z, g); A.swirl.push(m); }
    ring(F, r, 6, 0.4, 0.78, 1.6, 6).forEach(({ x, z }) => { const s = mesh(new THREE.CylinderGeometry(1.3, 1.5, 0.35, 10), M('#7A7068'), x, 0.17, z, g); s.castShadow = false; A.rocks.push({ x, z }); });
    return A;
  }, (A, F, P, dt) => {
    A.swirl.forEach((m, i) => { m.rotation.z += dt * (0.6 + i * 0.25); });
    if (P.dead || P.air || !inRoom(A.r, P) || ell(A.r, P, 0.85) > 1 || A.rocks.some(q => Math.hypot(q.x - P.x, q.z - P.z) < 1.5)) { A.hot = 0; return; }
    const d = Math.hypot(A.r.x - P.x, A.r.z - P.z) || 1, k = fighting(F, A.r) ? 2.2 : 1.2;
    P.x += (A.r.x - P.x) / d * k * dt; P.z += (A.r.z - P.z) / d * k * dt; R.collide && R.collide(P, 0.42);
    if (!A.told) { A.told = true; R.toast && R.toast('流沙在把你往中間拉——站到石台上就不會被拉', '#D8B878'); }
    if (d < 2.4) { A.hot = (A.hot || 0) - dt; if (A.hot <= 0) { A.hot = 0.6; P.iframe = 0; R.hurtPlayer(P.hpMax * 0.06 + 2, { name: '流沙的中心' }); } }
  });

  // ---------- 千面之森：樹根大廳 ----------
  L('faceforest', 'roots', (F, r) => {
    const g = new THREE.Group(), A = { kind: 'roots', r, g, faces: [] }, root = M('#4A3424'), face = M('#8A7A5A'), eye = M('#3A5A2A', { em: '#9AFF6A', ei: 0.2 });
    disc(r, 0.9, M('#2E2A20'), 0.022, g);
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * Math.PI * 2 + rnd() * 0.3, x0 = r.x + Math.sin(a) * r.hx * 0.95, z0 = r.z + Math.cos(a) * r.hz * 0.95, x1 = r.x + Math.sin(a) * r.hx * 0.45, z1 = r.z + Math.cos(a) * r.hz * 0.45, len = Math.hypot(x1 - x0, z1 - z0);
      const rt = mesh(new THREE.CylinderGeometry(0.25, 0.6, len, 7), root, (x0 + x1) / 2, 0.25, (z0 + z1) / 2, g); rt.rotation.set(Math.PI / 2, 0, 0); rt.rotation.y = 0; rt.lookAt(x1, 0.25, z1); rt.rotateX(Math.PI / 2);
      if (!inRoom(r, { x: x1, z: z1 })) continue;
      const fg = new THREE.Group(); mesh(new THREE.SphereGeometry(0.55, 8, 6), face, 0, 0.5, 0, fg); const e1 = mesh(new THREE.SphereGeometry(0.1, 6, 4), eye.clone(), -0.18, 0.62, 0.45, fg), e2 = mesh(new THREE.SphereGeometry(0.1, 6, 4), e1.material, 0.18, 0.62, 0.45, fg);
      fg.position.set(x1, 0, z1); fg.lookAt(r.x, 0, r.z); g.add(fg); A.faces.push({ x: x1, z: z1, m: e1.material });
    }
    return A;
  }, (A, F, P, dt) => {
    A.faces.forEach(f => { if (f.lit > 0) { f.lit -= dt; f.m.emissiveIntensity = 0.2 + Math.min(1, f.lit) * 1.5; } });
    if (!fighting(F, A.r) || !every(A, 'rt', dt, 7) || P.dead || !inRoom(A.r, P)) return;
    A.faces.slice().sort((a, b) => Math.hypot(a.x - P.x, a.z - P.z) - Math.hypot(b.x - P.x, b.z - P.z)).slice(0, 2).forEach(f => { f.lit = 1.2; });
    [[0, 0], [rnd() * 6 - 3, rnd() * 6 - 3], [rnd() * 6 - 3, rnd() * 6 - 3]].forEach(([ox, oz]) => {
      const x = P.x + ox, z = P.z + oz; tele(x, z, 1.6, 1000, '#9AFF6A', () => {
        const sp = mesh(new THREE.ConeGeometry(0.5, 2.6, 6), M('#4A3424'), x, 1.3, z, A.g); setTimeout(() => A.g.remove(sp), 600);
        if (hitP(x, z, 1.6, 0.1, '尖根')) { const P2 = W().P; P2.slowT = Math.max(P2.slowT || 0, 1.2); }
      });
    });
    if (!A.told) { A.told = true; R.toast && R.toast('樹根上的臉眼睛一亮，附近就會冒出尖根', '#9AFF6A'); }
  });

  // ---------- 緋喙屍鷲：屍骨場 ----------
  L('carrionvulture', 'carrion', (F, r) => {
    const g = new THREE.Group(), A = { kind: 'carrion', r, g, crows: [] }, bone = M('#D8CCB0'), bark = M('#3A2E24'), crow = M('#141016');
    disc(r, 0.9, M('#B89868'), 0.022, g);
    ring(F, r, 3, 0.55, 0.8, 2.4, 10).forEach(({ x, z, a }) => {   // 大獸的骨架：一排肋骨＋頭骨
      const sg = new THREE.Group(); for (let i = 0; i < 6; i++) { const rb = mesh(new THREE.TorusGeometry(1.1 - Math.abs(i - 2.5) * 0.12, 0.09, 5, 10, Math.PI), bone, (i - 2.5) * 0.55, 0, 0, sg); rb.rotation.y = Math.PI / 2; }
      mesh(new THREE.BoxGeometry(3.6, 0.15, 0.15), bone, 0, 0.1, 0, sg); mesh(new THREE.SphereGeometry(0.5, 8, 6), bone, 2.2, 0.35, 0, sg); sg.position.set(x, 0, z); sg.rotation.y = a; g.add(sg); box(x, z, 1);
    });
    ring(F, r, 3, 0.4, 0.75, 1.2, 8).forEach(({ x, z }) => {
      const tg = new THREE.Group(); mesh(new THREE.CylinderGeometry(0.25, 0.4, 4.2, 6), bark, 0, 2.1, 0, tg);
      for (let k = 0; k < 3; k++) { const ang = k * 2.1, b = mesh(new THREE.CylinderGeometry(0.06, 0.12, 2, 5), bark, Math.cos(ang) * 0.7, 3.3 + k * 0.3, -Math.sin(ang) * 0.7, tg); b.rotation.set(0, ang, 0.9); const c = mesh(new THREE.BoxGeometry(0.35, 0.3, 0.2), crow, Math.cos(ang) * 1.3, 3.9 + k * 0.3, -Math.sin(ang) * 1.3, tg); A.crows.push({ x: x + Math.cos(ang) * 1.3, z: z - Math.sin(ang) * 1.3, m: c }); }
      tg.position.set(x, 0, z); g.add(tg); box(x, z, 0.4);
    });
    return A;
  }, (A, F, P, dt) => {
    if (!fighting(F, A.r) || !every(A, 'cw', dt, 9) || P.dead || !inRoom(A.r, P)) return;
    const c = A.crows.find(q => !q.gone); if (!c) return; c.gone = true; c.m.visible = false; const Lr = lordOf(A.r);
    R.fire({ kind: 'feather', owner: 'e', x: c.x, z: c.z, a: Math.atan2(P.x - c.x, P.z - c.z), speed: 11, dmg: (Lr ? Lr.dmg : 15) * 0.5, life: 3, src: Lr || null });
    R.fx && R.fx('poof', c.x, 3.5, c.z, { color: '#141016', n: 8 });
    if (!A.told) { A.told = true; R.toast && R.toast('枯樹上的屍鴉俯衝下來了！', '#C83A2A'); }
  });
})(window.R);
