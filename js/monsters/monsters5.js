// 遺跡生物（第五批）：再加二十五種，名字和樣子都是自己想的（不用妖怪的原名）。總數到一百二十五。
// 新的行為：
//  mine（孢子團：沿路留下孢子，靠近就爆）、split（分裂膠：打倒會分成兩隻小的）、healer（引魂燈：躲在後面幫同伴補血）、
//  aegis（盾甲蟲：幫附近的同伴罩上護盾，傷害減半）、orbit（環刃鳥：繞著你轉，突然穿過來）、laser（稜鏡眼：先拉一條紅線，再射出光束）。
// 極端環境的四種（深淵鰩、熔岩龜、砂蠕蟲、霜岩像）照 env 出現，不放進一般的生物池。
(function (R) {
  const W = () => R.W, ART = R.BEAST_ART, rnd = Math.random;
  const targets = () => { const w = W(); return [w.P].concat((w.allies || []).filter(a => !a.downed), R.netTargets ? R.netTargets() : []).filter(t => t && !t.dead); };   // 多人連線：房主這邊也算別人（net2.js）
  const dist2 = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);

  // ---------- 資料 ----------
  const NEW = {
    glowslug: { name: '熒光蛞蝓', hp: 34, dmg: 6, speed: 1.4, xp: 5, size: 0.6, ai: 'chase', color: '#7AE0B0', eye: '#1A3020', desc: '身體會發光的大蛞蝓，爬得很慢。遺跡的通道裡常常一整排，像路燈一樣。' },
    pebblemite: { name: '礫甲蟎', hp: 18, dmg: 5, speed: 4.6, xp: 4, size: 0.45, ai: 'skitter', color: '#8A8478', eye: '#FF5A3A', desc: '背上黏滿碎石的小蟎，鑽來鑽去，一窩一窩地出現。' },
    ruinrat: { name: '遺跡鼠', hp: 16, dmg: 5, speed: 4.2, xp: 3, size: 0.45, ai: 'chase', color: '#6A5A4A', eye: '#FF3A3A', desc: '吃魔力水晶碎屑長大的老鼠，眼睛發紅。單隻不可怕，一群就麻煩了。' },
    sporepuff: { name: '孢子團', hp: 30, dmg: 10, speed: 1.6, xp: 7, size: 0.7, ai: 'mine', color: '#9ACF6A', eye: '#3A2A1A', desc: '一團軟軟的菌，走過的地方會留下孢子。孢子靠近就會爆開，爆到的人會變慢。' },
    jellylamp: { name: '水母燈', hp: 26, dmg: 8, speed: 3.6, xp: 6, size: 0.6, ai: 'swoop', fly: 1, color: '#BFE8FF', eye: '#3A6ACF', desc: '飄在半空中的透明水母，發著淡藍的光。在頭上繞圈，再垂下觸手往下撲。' },
    splitgel: { name: '分裂膠', hp: 44, dmg: 8, speed: 2.2, xp: 8, size: 0.8, ai: 'split', color: '#C88AE0', eye: '#2A1A3A', desc: '紫色的膠狀生物。打倒之後會分成兩隻小的，小的再打倒才算數。' },
    splitgel_s: { name: '分裂膠（小）', hp: 16, dmg: 5, speed: 3.2, xp: 2, size: 0.45, ai: 'chase', noDex: 1, color: '#D8A8F0', eye: '#2A1A3A', desc: '' },
    crystmantis: { name: '晶刃螳螂', hp: 70, dmg: 15, speed: 3.6, xp: 13, size: 0.9, ai: 'pounce', color: '#7FD8E8', eye: '#FF5A6A', desc: '兩隻前腳是魔力結晶長成的刀。蹲低之後會撲過來，一刀很痛。' },
    lanternwisp: { name: '引魂燈', hp: 40, dmg: 0, speed: 3, xp: 12, size: 0.6, ai: 'healer', fly: 1, color: '#FFD08A', eye: '#8A3A1A', desc: '提著燈籠的小小魂火，不會攻擊人，但會躲在後面幫同伴補血。先打掉牠。' },
    shieldbeetle: { name: '盾甲蟲', hp: 110, dmg: 12, speed: 1.8, xp: 16, size: 1, ai: 'aegis', armor: 0.3, color: '#5A7A9A', eye: '#FFE04A', desc: '殼像盾牌一樣的大甲蟲。會幫附近的同伴罩上一層光（傷害減半）。' },
    ringbird: { name: '環刃鳥', hp: 46, dmg: 12, speed: 4.4, xp: 11, size: 0.7, ai: 'orbit', fly: 1, color: '#C8C8D0', eye: '#C83A3A', desc: '翅膀邊緣像刀刃的銀色鳥。繞著你轉圈，冷不防地從中間穿過去。' },
    prismeye: { name: '稜鏡眼', hp: 60, dmg: 18, speed: 1.8, xp: 14, size: 0.8, ai: 'laser', fly: 1, color: '#E8E0FF', eye: '#FF3A6A', desc: '長在稜鏡裡的眼睛。地上拉出一條紅線，就是光束要射過來了——離開那條線。' },
    gearsentry: { name: '齒輪哨兵', hp: 90, dmg: 10, speed: 0, xp: 13, size: 0.9, ai: 'turret', armor: 0.25, color: '#9A8A6A', eye: '#FF5A3A', desc: '古代的齒輪機關，釘在地上轉個不停，看到人就射出鐵釘。' },
    tarbeast: { name: '瀝青獸', hp: 120, dmg: 16, speed: 2.4, xp: 16, size: 1.1, ai: 'charge', color: '#2A2420', eye: '#FFB04A', desc: '全身沾滿黑色瀝青的野獸。低頭衝撞之後會黏在地上一下，那時候打。' },
    echoshade: { name: '回聲影', hp: 50, dmg: 13, speed: 3, xp: 12, size: 0.8, ai: 'blink', color: '#4A4A6A', eye: '#BFE8FF', desc: '你自己的腳步聲變成的影子。會突然出現在你背後。' },
    bonefiddler: { name: '骨琴師', hp: 56, dmg: 11, speed: 2.6, xp: 13, size: 0.8, ai: 'kite', shoot: 0.5, fan: 3, shot: 'spirit', color: '#E8E0CC', eye: '#7FD8FF', desc: '抱著骨頭做的琴的骷髏。邊退邊拉琴，琴聲變成三道魂火飛過來。' },
    voidmoth: { name: '虛空蛾', hp: 48, dmg: 9, speed: 2.8, xp: 12, size: 0.8, ai: 'smoke', fly: 1, color: '#3A2A5A', eye: '#E8C0FF', desc: '翅膀上有星空花紋的大蛾。灑下的鱗粉讓人看不清楚、喘不過氣。' },
    starspider: { name: '星紋蛛', hp: 80, dmg: 13, speed: 2.8, xp: 15, size: 1, ai: 'kite', shoot: 0.5, fan: 2, shot: 'web', color: '#2A2A3A', eye: '#FFE04A', desc: '背上有發光星紋的蜘蛛，噴出的絲黏到會走不動。' },
    mirrorwraith: { name: '鏡魂', hp: 60, dmg: 13, speed: 2.6, xp: 14, size: 0.8, ai: 'swap', color: '#BFD8E8', eye: '#3A6ACF', desc: '被困在碎鏡子裡的影子。會和你交換位置。' },
    clockknight: { name: '時計騎士', hp: 240, dmg: 20, speed: 2.8, xp: 30, size: 1.3, ai: 'charge', armor: 0.35, elite: 1, coreChance: 0.22, color: '#8A7A5A', eye: '#FF8A3A', desc: '胸口嵌著大時鐘的鎧甲騎士。時鐘每響一聲就衝一次。克森特級才看得到。' },
    twinhound: { name: '雙首犬', hp: 210, dmg: 20, speed: 4.4, xp: 28, size: 1.3, ai: 'pounce', elite: 1, coreChance: 0.2, color: '#4A3A3A', eye: '#FF3A3A', desc: '兩顆頭的大黑犬。一顆頭盯著你，另一顆頭盯著你的隊友。摩爾斯級以上才看得到。' },
    thornqueen: { name: '荊棘女王', hp: 300, dmg: 20, speed: 1.6, xp: 38, size: 1.6, ai: 'hydra', elite: 1, coreChance: 0.3, color: '#6A3A4A', eye: '#FF5A8A', desc: '下半身是一整叢荊棘的女人。地上一次出現好幾個圈，荊棘就要從那裡刺上來。克森特級才看得到。' },
    abyssray: { name: '深淵鰩', hp: 200, dmg: 18, speed: 4.6, xp: 28, size: 1.6, ai: 'swoop', fly: 1, elite: 1, env: 'deep', coreChance: 0.2, color: '#1A3A4A', eye: '#7FFFE0', desc: '只在深海環境出現。在黑水上方滑翔的巨大鰩魚，俯衝下來的時候尾巴會電人。' },
    magmaturtle: { name: '熔岩龜', hp: 320, dmg: 20, speed: 1.4, xp: 32, size: 1.6, ai: 'guard', armor: 0.45, elite: 1, env: 'volcano', coreChance: 0.25, color: '#4A3A2A', eye: '#FFB04A', desc: '只在火山環境出現。殼上流著岩漿的大烏龜，正面幾乎打不動，繞到後面打。' },
    dunewyrm: { name: '砂蠕蟲', hp: 260, dmg: 20, speed: 3.2, xp: 30, size: 1.5, ai: 'burrow', elite: 1, env: 'desert', coreChance: 0.22, color: '#C8A870', eye: '#3A2A1A', desc: '只在沙漠環境出現。在沙底下游的巨大蠕蟲，從腳下張開大嘴咬上來。' },
    frostgolem: { name: '霜岩像', hp: 300, dmg: 22, speed: 2, xp: 32, size: 1.6, ai: 'slam', elite: 1, env: 'snow', coreChance: 0.25, color: '#BFD8E8', eye: '#3A6ACF', desc: '只在凍原環境出現。冰和岩石堆成的巨像，地上出現大圈就是要壓下來了。' }
  };
  Object.keys(NEW).forEach(id => { R.ENEMIES[id] = Object.assign({ ref: '' }, NEW[id]); });

  // ---------- 點陣圖 ----------
  const grid = (w, h) => {
    const g = Array.from({ length: h }, () => Array(w).fill('.'));
    const o = {
      p(x, y, c) { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < h && x >= 0 && x < w) g[y][x] = c; },
      rect(x, y, ww, hh, c) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) o.p(x + i, y + j, c); },
      line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) o.p(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); },
      ell(cx, cy, rx, ry, c) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1.05) o.p(x, y, c); } },
      disc(cx, cy, r, c) { o.ell(cx, cy, r, r, c); },
      rows: () => g.map(r => r.join(''))
    };
    return o;
  };
  const add = (id, pal, w, h, draw) => { const fr = [0, 1].map(f => { const G = grid(w, h); draw(G, f); return G.rows(); }); ART[id] = { pal, a: fr[0], b: fr[1] }; };
  const legs = (G, fr, xs, y, len, c) => xs.forEach((x, i) => G.rect(x, y, 1, (i + fr) % 2 ? len : len - 1, c));

  add('splitgel_s', { a: '#D8A8F0', A: '#A878C8', e: '#2A1A3A' }, 9, 7, (G, fr) => { G.ell(4, 4, fr ? 4 : 3.6, fr ? 2.6 : 3, 'a'); G.ell(4, 5, 3, 1, 'A'); G.p(3, 3, 'e'); G.p(5, 3, 'e'); });

  // ---------- 新的行為 ----------
  const AI = R.AI_X = R.AI_X || {};
  const hit = (H, t, dmg, src, o) => H.hurtT(t, dmg, src, o);
  // 孢子團：沿路留下孢子（12 秒），有人靠近 0.4 秒後爆開
  const spores = [];
  AI.mine = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a; let mv = false; if (walk && d > 2) { H.move(e, a + Math.sin(e.t) * 0.6, sp, dt); mv = true; } else if (e.cd <= 0 && d <= 1.4) { e.cd = 1.2; hit(H, P, e.dmg * 0.6, e); }
    e.spT = (e.spT == null ? 1.5 : e.spT) - dt;
    if (e.spT <= 0 && spores.length < 40) { e.spT = 2.2; const TH = THREE, m = new TH.Mesh(new TH.SphereGeometry(0.22, 6, 5), new TH.MeshBasicMaterial({ color: '#B8F07A' })); m.position.set(e.x, 0.25, e.z); W().scene.add(m); spores.push({ x: e.x, z: e.z, m, t: 12, fuse: -1, dmg: e.dmg, src: e }); }
    return mv;
  };
  const stepSpores = dt => {
    for (let i = spores.length - 1; i >= 0; i--) {
      const s = spores[i]; s.t -= dt; const near = targets().some(t => Math.hypot(t.x - s.x, t.z - s.z) < 1.4);
      if (s.fuse < 0 && near) s.fuse = 0.4;
      if (s.fuse >= 0) { s.fuse -= dt; s.m.scale.setScalar(1 + (0.4 - s.fuse) * 2); }
      else s.m.scale.setScalar(1 + Math.sin(s.t * 6) * 0.15);
      if (s.fuse >= 0 && s.fuse <= 0) { R.fx('boom', s.x, 0.3, s.z, { r: 1.6, color: '#9ACF6A' }); targets().forEach(t => { if (Math.hypot(t.x - s.x, t.z - s.z) < 1.7) { if (t === W().P) { R.hurtPlayer(s.dmg, s.src); t.slowT = Math.max(t.slowT || 0, 1.5); } else if (R.hurtAlly) R.hurtAlly(t, s.dmg, s.src); } }); s.t = 0; }
      if (s.t <= 0) { if (s.m.parent) s.m.parent.remove(s.m); s.m.geometry.dispose(); s.m.material.dispose(); spores.splice(i, 1); }
    }
  };
  // 分裂膠：一般的追人；打倒時分成兩隻小的（在 killEnemy 裡）
  AI.split = (e, P, d, a, sp, dt, walk, H) => { e.yaw = a; if (d > e.def.size + 0.7) { if (walk) { H.move(e, a, sp, dt); return true; } } else if (e.cd <= 0) { e.cd = 1; hit(H, P, e.dmg, e); } return false; };
  // 引魂燈：離你六到九公尺，每三秒幫最需要的同伴補血
  AI.healer = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a; const want = d < 6 ? a + Math.PI : d > 9 ? a : a + Math.PI / 2 * (e.side || (e.side = rnd() < 0.5 ? 1 : -1)); let mv = false; if (walk) { H.move(e, want, sp * (d > 6 && d < 9 ? 0.4 : 1), dt); mv = true; }
    if (e.cd <= 0) { const w = W(), hurt = w.enemies.filter(o => !o.dead && o !== e && !o.def.boss && dist2(o, e) < 9 && o.hp < o.hpMax).sort((p, q) => p.hp / p.hpMax - q.hp / q.hpMax)[0]; if (hurt) { e.cd = 3; const n = Math.round(hurt.hpMax * 0.25); hurt.hp = Math.min(hurt.hpMax, hurt.hp + n); R.fx('ring', hurt.x, 0.1, hurt.z, { r: 1.2, color: '#9AE8B0' }); R.fx('bolt', e.x, 1, e.z, { to: hurt }); R.num(hurt.x, 1.6 + hurt.def.size * 0.5, hurt.z, '+' + n, 'heal'); } else e.cd = 1; }
    return mv;
  };
  // 盾甲蟲：慢慢靠近；每五秒幫附近的同伴罩上護盾（四秒、傷害減半）
  AI.aegis = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a; let mv = false; if (walk && d > 1.8) { H.move(e, a, sp, dt); mv = true; } else if (e.cd <= 0 && d <= 1.8) { e.cd = 1.1; hit(H, P, e.dmg, e); }
    e.agT = (e.agT == null ? 2 : e.agT) - dt;
    if (e.agT <= 0) { e.agT = 5; R.fx('ring', e.x, 0.1, e.z, { r: 7, color: '#8AB0D0' }); W().enemies.forEach(o => { if (!o.dead && dist2(o, e) < 7) { o.aegisT = 4; R.fx('block', o.x, 1 + o.def.size * 0.4, o.z); } }); }
    return mv;
  };
  // 環刃鳥：在四公尺外繞圈，每兩秒半穿過你一次
  AI.orbit = (e, P, d, a, sp, dt, walk, H) => {
    if (e.ds) { e.ds.t -= dt; e.yaw = e.ds.a; if (walk) H.move(e, e.ds.a, sp * 3.2, dt); if (!e.ds.hit && d < 1.2) { e.ds.hit = 1; hit(H, P, e.dmg, e); } if (e.ds.t <= 0) e.ds = null; return true; }
    e.yaw = a; if (!walk) return false;
    if (d > 6) H.move(e, a, sp, dt); else H.move(e, a + Math.PI / 2 * (e.side || (e.side = rnd() < 0.5 ? 1 : -1)) * (d < 3 ? 1.4 : 1), sp, dt);
    if (e.cd <= 0 && d < 6.5) { e.cd = 2.5 + rnd(); e.ds = { a, t: 0.45 }; R.fx('aim', e.x, 0.3, e.z, { a, len: 4, t: 0.2 }); }
    return true;
  };
  // 稜鏡眼：離你六到十公尺；先拉紅線（0.9 秒），再射出一道十四公尺的光束
  AI.laser = (e, P, d, a, sp, dt, walk, H) => {
    if (e.lz) { e.yaw = e.lz.a; e.lz.t -= dt; if (e.lz.t <= 0) { const s = e.lz; e.lz = null; R.fx('beam', e.x, 1, e.z, { a: s.a, len: 14 }); R.fx('aim', e.x, 0.3, e.z, { a: s.a, len: 14, t: 0.15 }); R.shake(0.12); targets().forEach(t => { const dx = t.x - e.x, dz = t.z - e.z, al = dx * Math.sin(s.a) + dz * Math.cos(s.a), sd = Math.abs(dx * Math.cos(s.a) - dz * Math.sin(s.a)); if (al > 0 && al < 14 && sd < 0.8 && !(t.iframe > 0)) hit(H, t, e.dmg, e); }); } return false; }
    e.yaw = a; let mv = false; const want = d < 6 ? a + Math.PI : d > 10 ? a : a + Math.PI / 2 * (e.side || (e.side = rnd() < 0.5 ? 1 : -1));
    if (walk) { H.move(e, want, sp * (d > 6 && d < 10 ? 0.4 : 1), dt); mv = true; }
    if (e.cd <= 0 && d < 12) { e.cd = 3.6; e.lz = { a, t: 0.9 }; R.fx('aim', e.x, 0.3, e.z, { a, len: 14, t: 0.9 }); }
    return mv;
  };
  // 護盾：傷害減半
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => he0(e, e && e.aegisT > 0 ? raw * 0.5 : raw, o);
  // 分裂
  const kill0 = R.killEnemy;
  R.killEnemy = (e, by) => {
    const r = kill0(e, by);
    if (e && e.id === 'splitgel' && W().run) { [-1, 1].forEach(s => { const [x, z] = R.nearestFloor(e.x + s * 0.8, e.z + 0.3); const c = R.spawnEnemy('splitgel_s', x, z, e.room, { aggro: true }); if (c) c.cd = 0.6; }); }
    return r;
  };
  // 每一格：孢子、護盾倒數
  const step0 = R.step;
  R.step = dt => { step0(dt); const w = W(); if (!w.run) { if (spores.length) spores.splice(0).forEach(s => s.m.parent && s.m.parent.remove(s.m)); return; } stepSpores(dt); (w.enemies || []).forEach(e => { if (e.aegisT > 0) e.aegisT -= dt; }); };
  const lf0 = R.loadFloor; if (lf0) R.loadFloor = (...a) => { spores.splice(0).forEach(s => { if (s.m.parent) s.m.parent.remove(s.m); }); return lf0(...a); };

  // ---------- 生物池 ----------
  const G = id => R.GRADES.find(g => g.id === id), addPool = (gid, ids) => { const g = G(gid); if (g) ids.forEach(i => { if (!g.pool.includes(i)) g.pool.push(i); }); };
  addPool('hamilia', ['glowslug', 'ruinrat', 'pebblemite']);
  addPool('amile', ['glowslug', 'ruinrat', 'pebblemite', 'sporepuff', 'jellylamp', 'splitgel', 'lanternwisp']);
  addPool('mors', ['sporepuff', 'jellylamp', 'splitgel', 'lanternwisp', 'crystmantis', 'shieldbeetle', 'ringbird', 'prismeye', 'gearsentry', 'tarbeast', 'echoshade', 'bonefiddler', 'voidmoth', 'starspider', 'mirrorwraith', 'twinhound']);
  addPool('kesent', ['crystmantis', 'shieldbeetle', 'ringbird', 'prismeye', 'gearsentry', 'tarbeast', 'echoshade', 'bonefiddler', 'voidmoth', 'starspider', 'mirrorwraith', 'twinhound', 'clockknight', 'thornqueen']);
  const kaso = G('kaso'); if (kaso && kaso.pool) ['crystmantis', 'shieldbeetle', 'ringbird', 'prismeye', 'voidmoth', 'starspider', 'twinhound', 'clockknight', 'thornqueen', 'lanternwisp'].forEach(i => { if (!kaso.pool.includes(i)) kaso.pool.push(i); });
  const fav = (t, o) => { const T0 = R.TYPES[t]; if (T0) T0.favor = Object.assign({}, T0.favor, o); };
  fav('tomb', { bonefiddler: 2, echoshade: 1 });
  fav('city', { gearsentry: 2, clockknight: 1, mirrorwraith: 1 });
  fav('maze', { sporepuff: 2, starspider: 1, glowslug: 1 });
  fav('tower', { ringbird: 2, prismeye: 1, voidmoth: 1 });
  fav('island', { jellylamp: 2, splitgel: 1 });
})(window.R);
