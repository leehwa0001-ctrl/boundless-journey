// 遺跡生物（第三批）：補到七十種（作者）。名字都是自己取的，不用妖怪的原名。
// 每一種有自己的點陣圖（R.BEAST_ART，朝右畫）；行為大多沿用原本的（combat.js、monsters2.js），新的五種：
//  quills（晶刺蝟：縮成一團射出一圈晶刺）、mortar（酸泡：遠遠拋出酸液，落地留下酸池）、sting（裂地蠍：拉一條線再甩尾）、
//  spin（鐘擺刃：轉起來砍一圈）、rally（號角骸：吹號角讓附近的生物變兇——先打牠）。泥偶打倒會裂成兩個小泥偶。
// 分到哪些分級在最下面；凍原、火山、沙漠、深海各多一種只在那個環境出現的生物。
(function (R) {
  const W = () => R.W, ART = R.BEAST_ART, rnd = Math.random;
  const later = (f, ms) => { const run = W().run; setTimeout(() => { if (W().run === run && run && !run.done) f(); }, ms); };
  const targets = () => { const w = W(); return [w.P].concat((w.allies || []).filter(a => !a.downed), R.netTargets ? R.netTargets() : []).filter(t => t && !t.dead); };   // 多人連線：房主這邊也算別人（net2.js）

  // ---------- 資料 ----------
  const NEW = {
    mossball: { name: '苔團', hp: 18, dmg: 5, speed: 2.2, xp: 3, size: 0.6, ai: 'chase', color: '#4A7A3A', eye: '#F2F0D0', desc: '長滿青苔的圓球，滾來滾去。哈米莉亞級的遺跡裡最常見，不太會主動惹人。' },
    lampmoth: { name: '燈蛾', hp: 12, dmg: 5, speed: 4.5, xp: 3, size: 0.6, ai: 'swoop', fly: 1, color: '#D8CCB0', eye: '#FFE070', desc: '肚子會發光的大蛾。繞著光飛，突然俯衝下來撞人。' },
    stonesnail: { name: '石蝸', hp: 40, dmg: 7, speed: 1.4, xp: 5, size: 0.8, ai: 'chase', armor: 0.4, color: '#8A8478', eye: '#1A1410', desc: '背著石殼的蝸牛，很慢、很硬。殼擋掉四成的傷害。' },
    crysthog: { name: '晶刺蝟', hp: 38, dmg: 8, speed: 2.6, xp: 8, size: 0.6, ai: 'quills', color: '#6A5A4A', eye: '#9AE0FF', desc: '背上長著水晶刺。靠得太近，牠會縮成一團把刺射向四面八方——腳下出現藍圈就退開。' },
    shadelizard: { name: '影蜥', hp: 30, dmg: 11, speed: 3.8, xp: 8, size: 0.7, ai: 'pounce', color: '#2A2434', eye: '#FFD04A', desc: '貼著地面爬的黑蜥蜴，在暗處很難看見。蹲低之後會撲過來。' },
    bonebird: { name: '骨鳥', hp: 22, dmg: 8, speed: 3.6, xp: 8, size: 0.6, ai: 'kite', shoot: 0.5, shot: 'feather', fly: 1, color: '#E8E0CC', eye: '#FF5A3A', desc: '只剩骨架的鳥，飛在半空，射出削尖的骨羽。' },
    muddoll: { name: '泥偶', hp: 46, dmg: 9, speed: 2.2, xp: 9, size: 0.8, ai: 'chase', color: '#7A5A3A', eye: '#FFB04A', desc: '泥巴捏成的人形。打倒之後會裂成兩個小泥偶，小的也要打。' },
    muddoll_s: { name: '小泥偶', hp: 14, dmg: 5, speed: 3, xp: 2, size: 0.5, ai: 'chase', noDex: 1, color: '#7A5A3A', eye: '#FFB04A', desc: '' },
    bellcricket: { name: '鈴蟲', hp: 9, dmg: 4, speed: 5, xp: 2, size: 0.4, ai: 'chase', pack: 3, color: '#6A8A3A', eye: '#E8D86A', desc: '翅膀會發出鈴聲的蟋蟀，三隻一群。很弱，但跳得很快。' },
    rustknight: { name: '鏽甲兵', hp: 70, dmg: 12, speed: 2.2, xp: 11, size: 0.8, ai: 'guard', armor: 0.15, color: '#8A5A3A', eye: '#FFB04A', desc: '生鏽的鎧甲裡沒有人。舉著盾的時候從正面打不太進去，繞到旁邊或背後。' },
    acidbubble: { name: '酸泡', hp: 26, dmg: 8, speed: 2, xp: 8, size: 0.65, ai: 'mortar', color: '#8AE04A', eye: '#1A3010', desc: '會冒泡的綠色黏液。遠遠地把酸液拋過來，落地的地方會留下一攤酸，站在上面會一直受傷。' },
    echobat: { name: '回音蝠', hp: 14, dmg: 6, speed: 5.2, xp: 3, size: 0.5, ai: 'swoop', fly: 1, pack: 3, color: '#2A2430', eye: '#FF5A5A', desc: '靠回音找人的蝙蝠，三隻一群，輪流俯衝。' },
    mirrorgolem: { name: '鏡魔像', hp: 180, dmg: 18, speed: 2.6, xp: 26, size: 1.3, ai: 'charge', armor: 0.3, elite: 1, coreChance: 0.18, color: '#B8C8D8', eye: '#7FD8FF', desc: '胸口嵌著一面大鏡子的石像。低頭之後會往前猛衝，撞牆會暈一下——那時候打牠。摩爾斯級以上才看得到。' },
    riftscorp: { name: '裂地蠍', hp: 64, dmg: 14, speed: 3, xp: 13, size: 0.9, ai: 'sting', color: '#8A3A2A', eye: '#FFD04A', desc: '紅色的大蠍子，總是保持兩、三公尺。地上拉出一條線就是要甩尾了，被刺中會變慢。' },
    mistwisp: { name: '霧燈靈', hp: 30, dmg: 12, speed: 3, xp: 11, size: 0.6, ai: 'blink', fly: 1, color: '#C8D8E8', eye: '#3A4A6A', desc: '提燈一樣的白霧。會在你背後亮起來：腳下出現小圈就快轉身或翻滾。' },
    bonehound: { name: '蝕骨犬', hp: 34, dmg: 11, speed: 4.6, xp: 10, size: 0.75, ai: 'pounce', pack: 2, color: '#E8E0CC', eye: '#C83A3A', desc: '只剩骨頭的獵犬，兩隻一起。一隻引開你，另一隻從旁邊撲上來。' },
    thunderspider: { name: '雷晶蛛', hp: 40, dmg: 11, speed: 4.6, xp: 11, size: 0.7, ai: 'zap', color: '#3A3060', eye: '#FFE04A', desc: '背上長著雷晶的蜘蛛。直線衝刺，留下一條會電人的痕跡。' },
    bladewheel: { name: '鐘擺刃', hp: 90, dmg: 14, speed: 1.6, xp: 14, size: 1, ai: 'spin', armor: 0.25, color: '#8A8A92', eye: '#FFD04A', desc: '一圈刀刃圍著一顆眼睛的機關生物。地上出現大圈就是要轉起來了，轉的時候靠近會被砍。' },
    blackmaw: { name: '黑泥巨口', hp: 80, dmg: 18, speed: 2.4, xp: 14, size: 1.2, ai: 'ambush', color: '#1A1418', eye: '#FFD04A', desc: '平常是一攤黑泥，人走近才張開一張大嘴咬下去。看到地上有不自然的黑泥就繞開。' },
    hornbones: { name: '號角骸', hp: 50, dmg: 6, speed: 2.4, xp: 14, size: 0.8, ai: 'rally', color: '#5A3A4A', eye: '#C8A040', desc: '吹著骨號角的骸骨。號角一響，附近的遺跡生物都會變快、變痛——先打牠。' },
    ashcrow: { name: '灰燼鴉', hp: 26, dmg: 9, speed: 4, xp: 10, size: 0.6, ai: 'kite', shoot: 0.45, fan: 3, shot: 'fire', fly: 1, color: '#2A2A30', eye: '#FFD04A', desc: '羽毛末端燒著火的烏鴉，一次甩出三團火星。' },
    bonecentipede: { name: '白骨百足', hp: 260, dmg: 20, speed: 3.4, xp: 34, size: 1.5, ai: 'charge', armor: 0.2, elite: 1, coreChance: 0.22, color: '#E8E0CC', eye: '#C83A3A', desc: '一節一節的白骨連成的百足。會低頭猛衝，衝完要喘一下。克森特級才看得到。' },
    icewarden: { name: '冰棺守', hp: 110, dmg: 15, speed: 2, xp: 18, size: 1, ai: 'guard', armor: 0.3, env: 'snow', color: '#CFE6FF', eye: '#3A8AFF', desc: '只在凍原環境出現。棺材一樣的冰塊站起來守著路，正面幾乎打不動。' },
    lavaturtle: { name: '熔岩龜', hp: 140, dmg: 15, speed: 1.6, xp: 20, size: 1.1, ai: 'drum', armor: 0.35, env: 'volcano', color: '#3A2A24', eye: '#FFD04A', desc: '只在火山環境出現。殼上流著熔岩，跺腳打出一圈往外擴的熱浪——翻滾穿過去。' },
    sandsinker: { name: '沙沉蟲', hp: 70, dmg: 14, speed: 3, xp: 14, size: 1, ai: 'burrow', env: 'desert', color: '#C8A870', eye: '#1A1410', desc: '只在沙漠環境出現。在沙子底下游，從腳下鑽出來咬人。' },
    abyssarm: { name: '深淵觸手', hp: 100, dmg: 12, speed: 0, xp: 15, size: 1.1, ai: 'turret', env: 'deep', color: '#3A5A6A', eye: '#FFD04A', desc: '只在深海環境出現。從地板裂縫伸出來的觸手，不會移動；會吐東西，也會從你腳下纏上來。' },
    voidwalker: { name: '虛空行者', hp: 220, dmg: 22, speed: 3.2, xp: 32, size: 1.1, ai: 'blink', elite: 1, coreChance: 0.22, color: '#140E1C', eye: '#8A5AFF', desc: '胸口開著一個洞的高大人影，一眨眼就到你背後。克森特級才看得到。' },
    twinshade: { name: '雙生影', hp: 44, dmg: 12, speed: 4.2, xp: 12, size: 0.6, ai: 'pounce', pack: 2, color: '#2A2434', eye: '#FF8AE0', desc: '小孩模樣的影子，總是兩個一起出現，一前一後撲過來。' },
    corebeast: { name: '晶核獸', hp: 260, dmg: 20, speed: 3, xp: 34, size: 1.4, ai: 'thunder', elite: 1, coreChance: 0.28, color: '#5A3A6A', eye: '#FFE04A', desc: '背上長滿粉紅晶柱的四腳獸，體內有一顆很大的魔力核心。腳下出現圈就是要落雷了。克森特級才看得到。' },
    judgeeye: { name: '審判之眼', hp: 60, dmg: 12, speed: 2.4, xp: 16, size: 0.8, ai: 'kite', shoot: 0.35, fan: 7, shot: 'ering', fly: 1, color: '#F0E8E0', eye: '#C83A3A', desc: '套著金環的大眼睛，飄在半空，一次射出七發扇形的光彈。' }
  };
  Object.keys(NEW).forEach(id => { R.ENEMIES[id] = Object.assign({ ref: '' }, NEW[id]); });

  // ---------- 點陣圖（同 monsters2.js 的畫法：用形狀畫，轉成字串，朝右） ----------
  const grid = (w, h) => {
    const g = Array.from({ length: h }, () => Array(w).fill('.'));
    const o = {
      p(x, y, c) { x = Math.round(x); y = Math.round(y); if (y >= 0 && y < h && x >= 0 && x < w) g[y][x] = c; },
      rect(x, y, ww, hh, c) { for (let j = 0; j < hh; j++) for (let i = 0; i < ww; i++) o.p(x + i, y + j, c); },
      line(x0, y0, x1, y1, c) { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let i = 0; i <= n; i++) o.p(x0 + (x1 - x0) * i / n, y0 + (y1 - y0) * i / n, c); },
      ell(cx, cy, rx, ry, c, f) { for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) { const k = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2; if (k <= 1.05 && (!f || f(x, y))) o.p(x, y, c); } },
      disc(cx, cy, r, c) { o.ell(cx, cy, r, r, c); },
      rows: () => g.map(r => r.join(''))
    };
    return o;
  };
  const add = (id, pal, w, h, draw) => { const fr = [0, 1].map(f => { const G = grid(w, h); draw(G, f); return G.rows(); }); ART[id] = { pal, a: fr[0], b: fr[1] }; };

  const mud = (G, fr, s) => {
    const k = s || 1; G.ell(6 * k, 10 * k, 4.5 * k, 5 * k, 'm'); G.disc(6 * k, 4 * k, 3 * k, 'm'); G.p(3 * k, 14 * k, 'M'); G.p(9 * k, 15 * k, 'M');
    G.p(7 * k, 4 * k, 'e'); G.p(9 * k, 4 * k, 'e'); G.line(6 * k, 6 * k, 8 * k, 6 * k, 'd');
    G.line(2 * k, 9 * k, 0, (fr ? 12 : 11) * k, 'M'); G.line(10 * k, 9 * k, 12 * k, (fr ? 11 : 12) * k, 'M'); G.rect(4 * k, 15 * k, 2, 2, 'd'); G.rect(7 * k, 15 * k, 2, 2, 'd');
  };
  add('muddoll_s', { m: '#7A5A3A', M: '#5A4028', d: '#3A2818', e: '#FFB04A' }, 9, 12, (G, fr) => mud(G, fr, 0.68));

  // ---------- 新的行為（R.AI_X） ----------
  const AI = R.AI_X = R.AI_X || {};
  const hit = (H, t, dmg, src, o) => H.hurtT(t, dmg, src, o);
  // 晶刺蝟：靠近就縮起來，0.5 秒後射出一圈晶刺
  AI.quills = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a;
    if (e.curl > 0) { e.curl -= dt; if (e.curl <= 0) { for (let i = 0; i < 10; i++) R.fire({ kind: 'eorb', owner: 'e', x: e.x, z: e.z, a: i / 10 * Math.PI * 2 + e.t, speed: 8, dmg: e.dmg, life: 1.4, src: e }); } return false; }
    let mv = false; if (walk && d > 2.5) { H.move(e, a, sp, dt); mv = true; }
    if (e.cd <= 0 && d < 4.5) { e.cd = 3.5; e.curl = 0.5; R.fx('ring', e.x, 0.1, e.z, { r: 1.2, color: '#9AE0FF' }); }
    return mv;
  };
  // 酸泡：保持距離，拋出酸液：落地處先出現圈，炸開後留下一攤酸
  AI.mortar = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a; let mv = false; const want = d < 5.5 ? a + Math.PI : d > 9 ? a : null;
    if (want != null && walk) { H.move(e, want, sp, dt); mv = true; }
    if (e.cd <= 0 && d < 12) {
      e.cd = 2.8 + rnd() * 0.6; const x = P.x, z = P.z; R.fx('mark', x, 0, z, { r: 1.4, t: 1 });
      later(() => { if (e.dead) return; R.fx('boom', x, 0.3, z, { r: 1.4, color: '#8AE04A' }); targets().forEach(t => { if (Math.hypot(t.x - x, t.z - z) < 1.4) hit(H, t, e.dmg, e); }); const zn = R.addZone({ kind: 'lava', x, z, r: 1.3, life: 3.5, dmg: e.dmg * 0.35 }); if (zn && zn.mesh) zn.mesh.material.color.set('#8AE04A'); }, 1000);
    }
    return mv;
  };
  // 裂地蠍：保持兩、三公尺；拉一條線，再甩尾（被刺中會變慢）
  AI.sting = (e, P, d, a, sp, dt, walk, H) => {
    if (e.stg) {
      e.yaw = e.stg.a; e.stg.t -= dt;
      if (e.stg.t <= 0) { const s = e.stg; e.stg = null; R.fx('slash', e.x, 1, e.z, { a: s.a, len: 4.6 }); targets().forEach(t => { const dx = t.x - e.x, dz = t.z - e.z, al = dx * Math.sin(s.a) + dz * Math.cos(s.a), sd = Math.abs(dx * Math.cos(s.a) - dz * Math.sin(s.a)); if (al > 0 && al < 4.8 && sd < 0.8) { hit(H, t, e.dmg * 1.3, e); if (t === W().P) t.slowT = Math.max(t.slowT || 0, 1.6); } }); e.cd = 2.2; }
      return false;
    }
    e.yaw = a; let mv = false; const want = d < 2.2 ? a + Math.PI : d > 3.8 ? a : null;
    if (want != null && walk) { H.move(e, want, sp, dt); mv = true; }
    if (e.cd <= 0 && d < 4.8) { e.stg = { a, t: 0.55 }; R.fx('aim', e.x, 0.3, e.z, { a, len: 4.6, t: 0.55 }); }
    return mv;
  };
  // 鐘擺刃：慢慢靠近；地上出現大圈 0.6 秒後轉 1.2 秒，圈裡每 0.3 秒被砍一下
  AI.spin = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a;
    if (e.spinW > 0) { e.spinW -= dt; if (e.spinW <= 0) e.spinT = 1.2; return false; }
    if (e.spinT > 0) { e.spinT -= dt; e.tick = (e.tick || 0) - dt; if (e.tick <= 0) { e.tick = 0.3; R.fx('ring', e.x, 0.1, e.z, { r: 2.6, color: '#C8C8D0' }); targets().forEach(t => { if (Math.hypot(t.x - e.x, t.z - e.z) < 2.6) hit(H, t, e.dmg * 0.6, e); }); } if (walk) H.move(e, a, sp * 1.4, dt); return true; }
    let mv = false; if (walk && d > 1.8) { H.move(e, a, sp, dt); mv = true; }
    if (e.cd <= 0 && d < 5) { e.cd = 3.8; e.spinW = 0.6; R.fx('mark', e.x, 0, e.z, { r: 2.6, t: 0.6 }); }
    return mv;
  };
  // 號角骸：離你遠遠的，每七秒吹一次號角：九公尺內的生物五秒內變快、變痛
  let rallyMsg = 0;
  AI.rally = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a; let mv = false; const want = d < 6 ? a + Math.PI : d > 10 ? a : null;
    if (want != null && walk) { H.move(e, want, sp, dt); mv = true; }
    if (e.cd <= 0 && d < 16) {
      e.cd = 7; R.fx('ring', e.x, 0.1, e.z, { r: 9, color: '#C8A040' }); if (R.playSfx) R.playSfx('alarm', 400);
      W().enemies.forEach(o => { if (o.dead || o === e || o.rallied || Math.hypot(o.x - e.x, o.z - e.z) > 9) return; o.rallied = 1; o.speed *= 1.3; o.dmg *= 1.2; R.fx('ring', o.x, 0.1, o.z, { r: 0.9, color: '#FFB04A' }); later(() => { if (o.dead || !o.rallied) return; o.rallied = 0; o.speed /= 1.3; o.dmg /= 1.2; }, 5000); });
      if (performance.now() - rallyMsg > 15000) { rallyMsg = performance.now(); R.toast('號角骸吹響了號角——附近的生物變兇了。先打牠！'); }
    }
    return mv;
  };
  // 泥偶：打倒會裂成兩個小泥偶
  const ke = R.killEnemy;
  R.killEnemy = (e, by) => {
    const split = e && !e.dead && e.id === 'muddoll';
    const r = ke(e, by);
    if (split && e.dead) for (let i = 0; i < 2; i++) { const [x, z] = R.nearestFloor(e.x + (i ? 0.8 : -0.8), e.z + (rnd() - 0.5)); R.spawnEnemy('muddoll_s', x, z, e.room, { aggro: true }); }
    return r;
  };

  // ---------- 分到哪裡 ----------
  const G = id => R.GRADES.find(g => g.id === id), addPool = (gid, ids) => { const g = G(gid); if (g) ids.forEach(i => { if (!g.pool.includes(i)) g.pool.push(i); }); };
  addPool('hamilia', ['mossball', 'lampmoth', 'stonesnail']);
  addPool('amile', ['mossball', 'lampmoth', 'stonesnail', 'crysthog', 'shadelizard', 'bonebird', 'muddoll', 'bellcricket', 'rustknight', 'acidbubble', 'echobat']);
  addPool('mors', ['crysthog', 'shadelizard', 'bonebird', 'muddoll', 'bellcricket', 'rustknight', 'acidbubble', 'echobat', 'mirrorgolem', 'riftscorp', 'mistwisp', 'bonehound', 'thunderspider', 'bladewheel', 'blackmaw', 'hornbones', 'ashcrow']);
  addPool('kesent', ['rustknight', 'acidbubble', 'mirrorgolem', 'riftscorp', 'mistwisp', 'bonehound', 'thunderspider', 'bladewheel', 'blackmaw', 'hornbones', 'ashcrow', 'bonecentipede', 'voidwalker', 'twinshade', 'corebeast', 'judgeeye']);
  const fav = (t, o) => { const T0 = R.TYPES[t]; if (T0) T0.favor = Object.assign({}, T0.favor, o); };
  fav('tower', { echobat: 2, bonebird: 2, ashcrow: 1, judgeeye: 1 });
  fav('city', { rustknight: 2, muddoll: 1, hornbones: 1 });
  fav('maze', { bellcricket: 2, shadelizard: 2, bladewheel: 1 });
  fav('tomb', { bonehound: 2, hornbones: 2, bonecentipede: 1, voidwalker: 1 });
  fav('island', { acidbubble: 1, crysthog: 1, mistwisp: 1 });
})(window.R);
