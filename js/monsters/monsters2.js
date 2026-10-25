// 遺跡生物（第二批）：參考日本妖怪重新設計，名字都是自己取的（不用妖怪的原名）。
// 每一種有自己的點陣圖（R.BEAST_ART，朝右畫）和行為（combat.js 的 R.AI_X 掛勾）。
// 分到哪些分級、哪種遺跡形式比較常見，在最下面調整 R.GRADES、R.TYPES。
(function (R) {
  const W = () => R.W, ART = R.BEAST_ART, rnd = Math.random;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z), angTo = (a, b) => Math.atan2(b.x - a.x, b.z - a.z), wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  const later = (f, ms) => { const run = W().run; setTimeout(() => { if (W().run === run && run && !run.done) f(); }, ms); };
  const targets = () => { const w = W(); return [w.P].concat((w.allies || []).filter(a => !a.downed), R.netTargets ? R.netTargets() : []).filter(t => t && !t.dead); };   // 多人連線：房主這邊也算別人（net2.js）

  // ---------- 資料 ----------
  const NEW = {
    nopperabo: { name: '無面影', hp: 32, dmg: 12, speed: 3, xp: 9, size: 0.65, ai: 'blink', color: '#3A3048', eye: '#F2E6D8',
      desc: '穿著和服、臉上什麼都沒有的人形。會在你背後浮出來：腳下出現小圈就快轉身或翻滾。' },
    rokuro: { name: '伸頸', hp: 42, dmg: 12, speed: 2.6, xp: 10, size: 0.7, ai: 'reach', color: '#5A3A4A', eye: '#FF5A5A',
      desc: '跪坐著的人形，脖子可以伸得很長。總是離你三、四公尺；地上拉出一條直線，就是脖子要甩過來了。' },
    tanuki: { name: '鼓腹狸', hp: 60, dmg: 9, speed: 2.6, xp: 9, size: 0.8, ai: 'drum', color: '#8A6A4A', eye: '#2A1A10',
      desc: '圓滾滾的狸形遺跡生物。拍肚子會打出一圈往外擴的震波——翻滾穿過去，或拉開距離。' },
    kitsune: { name: '幻尾狐', hp: 36, dmg: 9, speed: 4.2, xp: 11, size: 0.7, ai: 'decoy', color: '#E8D8C0', eye: '#B89AFF',
      desc: '三條尾巴燒著紫色的火。會變出幻影擾亂人，幻影一碰就散；真身一直保持距離吐火。' },
    tengu: { name: '嵐翼', hp: 44, dmg: 9, speed: 4.4, xp: 11, size: 0.8, ai: 'gust', fly: 1, color: '#C8323A', eye: '#FFE08A',
      desc: '紅臉、長鼻、黑翅膀的人形，飛在半空。扇出一道狂風把人吹退，也會射出羽毛。' },
    nue: { name: '夜鳴獸', hp: 240, dmg: 18, speed: 3.2, xp: 32, size: 1.4, ai: 'thunder', elite: 1, coreChance: 0.2, color: '#C8A040', eye: '#FF3A3A',
      desc: '猿的臉、虎的身子、蛇的尾巴，夜裡會發出怪聲。腳下出現圈就是要落雷了，一次三道。摩爾斯級以上才看得到。' },
    hitotsume: { name: '獨目童', hp: 22, dmg: 5, speed: 5.4, xp: 8, size: 0.5, ai: 'thief', color: '#4A6A9A', eye: '#1A1A1A',
      desc: '只有一隻大眼睛的小孩模樣。會衝過來搶走你身上的魔力水晶，然後一路逃跑——追上去打倒牠就能拿回來，讓牠跑遠就沒了。' },
    enenra: { name: '纏煙', hp: 30, dmg: 7, speed: 2.4, xp: 8, size: 0.8, ai: 'smoke', fly: 1, color: '#8A8A92', eye: '#FFD04A',
      desc: '有臉的一團煙。走過的地方留下一片濃煙，站在裡面會看不清楚、喘不過氣。' },
    jinmenju: { name: '面果樹', hp: 90, dmg: 8, speed: 0, xp: 12, size: 1.1, ai: 'turret', armor: 0.2, color: '#4A6A3A', eye: '#F2E6C8',
      desc: '結著一顆顆人臉果實的樹，不會走動。果實會吐種子，樹根會從腳下竄出來把人纏住。' },
    raiju: { name: '紫電鼬', hp: 28, dmg: 9, speed: 5, xp: 9, size: 0.6, ai: 'zap', color: '#5A4ACF', eye: '#FFE04A',
      desc: '全身帶電的鼬。直線衝刺，留下一條會電人的痕跡，過一下才會散。' },
    tesso: { name: '鐵齒鼠', hp: 10, dmg: 4, speed: 5.2, xp: 2, size: 0.4, ai: 'chase', pack: 4, color: '#6A6A72', eye: '#FF5A5A',
      desc: '牙齒像鐵一樣硬的老鼠，四隻一群。一隻很弱，一群會把人圍住。' },
    mikoshi: { name: '高仰影', hp: 80, dmg: 12, speed: 2.4, xp: 14, size: 0.8, ai: 'grow', color: '#3A3A48', eye: '#FFD04A',
      desc: '僧人模樣的黑影。你越盯著牠看，牠就長得越高、打得越痛；把準心移開，牠會縮回去，縮小的時候特別脆弱。' },
    baku: { name: '吞夢獸', hp: 70, dmg: 9, speed: 2.8, xp: 12, size: 0.9, ai: 'drain', armor: 0.1, color: '#2A2A30', eye: '#E8E4DC',
      desc: '黑白兩色、鼻子長長的獸。咬中的時候會吸走你的魔力，拿去補自己。' },
    funa: { name: '杓靈', hp: 26, dmg: 8, speed: 3, xp: 8, size: 0.55, ai: 'kite', shoot: 0.6, freeze: 1, fly: 1, env: 'deep', color: '#BFD8E8', eye: '#1A2A3A',
      desc: '只在深海環境出現。拿著長杓的白影，潑出冰冷的海水，被潑中會變慢。' },
    kyorinrin: { name: '飛卷', hp: 24, dmg: 7, speed: 3.6, xp: 8, size: 0.6, ai: 'kite', shoot: 0.45, fan: 5, shot: 'spirit', fly: 1, color: '#F0E8D0', eye: '#2A1A10',
      desc: '長了眼睛的經卷，在空中飄著，一次甩出五張紙片。' },
    okubi: { name: '懸首', hp: 200, dmg: 16, speed: 2.6, xp: 30, size: 1.5, ai: 'slam', fly: 1, ownY: 1, elite: 1, coreChance: 0.2, color: '#F2E6D8', eye: '#C83A3A',
      desc: '只有一顆巨大的頭，飄在半空跟著人。地上出現大圈就是要砸下來了；砸完會在地上喘一下，那時候最好打。摩爾斯級以上才看得到。' },
    // 幻尾狐的幻影：一碰就散，不給經驗、不掉東西、不進圖鑑
    kitsune_ghost: { name: '幻尾狐的幻影', hp: 1, dmg: 0, speed: 4.6, xp: 0, size: 0.7, ai: 'ghostfox', noDex: 1, noLoot: 1, color: '#E8D8C0', eye: '#B89AFF', desc: '' }
  };
  Object.keys(NEW).forEach(id => { R.ENEMIES[id] = Object.assign({ ref: '' }, NEW[id]); });

  // ---------- 點陣圖：用形狀畫，轉成字串（朝右） ----------
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
  const art = (w, h, draw) => [0, 1].map(fr => { const G = grid(w, h); draw(G, fr); return G.rows(); });
  const add = (id, pal, w, h, draw) => { const [a, b] = art(w, h, draw); ART[id] = { pal, a, b }; };

  const fox = (G, fr) => {
    [[1, 1], [0, 5], [1, 10]].forEach(([tx, ty], i) => { const sx = 5, sy = 6 + (i - 1) * 0.5, oy = fr ? (i - 1) : 0; G.line(sx, sy, tx, ty + oy, 't'); G.line(sx, sy + 1, tx + 1, ty + oy + 1, 't'); G.p(tx, ty + oy, 'f'); G.p(tx + 1, ty + oy, 'f'); });
    G.ell(9, 7, 4, 2, 'a'); G.disc(13.5, 5, 2, 'a'); G.p(15, 6, 'a'); G.p(16, 6, 'n'); G.p(12, 2, 'a'); G.p(14, 2, 'a'); G.p(12, 3, 'a'); G.p(14, 3, 'a'); G.p(14, 5, 'e');
    if (fr) { G.rect(6, 9, 1, 2, 'a'); G.rect(12, 9, 1, 2, 'a'); } else { G.rect(7, 9, 1, 2, 'a'); G.rect(11, 9, 1, 2, 'a'); }
  };
  add('kitsune_ghost', { a: '#C8B8E8', t: '#B8A8D8', f: '#E0D0FF', n: '#4A3A6A', e: '#FFFFFF' }, 17, 12, fox);

  // ---------- 行為（R.AI_X：combat.js 每一格呼叫，回傳這一格有沒有在走） ----------
  const AI = R.AI_X = R.AI_X || {};
  const hit = (H, t, dmg, src, o) => H.hurtT(t, dmg, src, o);
  // 往外推（翻滾、跳在空中的時候不推）
  const push = (t, a, len) => { const w = W(), P = w.P; if (t === P) { if (P.iframe > 0 || P.air > 0) return; let left = 0.3; P.knockT = Math.max(P.knockT || 0, 0.3); w.dyn.push(dt => { left -= dt; if (left <= 0 || P.dead) return false; P.x += Math.sin(a) * len / 0.3 * dt; P.z += Math.cos(a) * len / 0.3 * dt; R.collide(P, 0.42); return true; }); } else { t.x += Math.sin(a) * len; t.z += Math.cos(a) * len; R.collide(t, 0.4); } };
  const side = e => e.side || (e.side = rnd() < 0.5 ? 1 : -1);

  // 無面影：在你背後浮出來，停一下再砍
  AI.blink = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a;
    if (e.bk) { e.bk.t -= dt; if (e.bk.t <= 0) { const b = e.bk; e.bk = null; R.fx('blink', e.x, 1, e.z); e.x = b.x; e.z = b.z; e.m.g.position.x = e.x; e.m.g.position.z = e.z; R.fx('blink', e.x, 1, e.z); e.strike = 0.35; } return false; }
    if (e.strike > 0) { e.strike -= dt; if (e.strike <= 0) { const a2 = angTo(e, P); R.fx('swing', e.x, 1.1, e.z, { a: a2, range: 1.8, arc: 1.4 }); if (dist(e, P) < 1.9) hit(H, P, e.dmg * 1.3, e); e.cd = 3.2; } return false; }
    if (e.cd <= 0 && d < 14) { const fa = P.aimA != null ? P.aimA : P.yaw || 0, [x, z] = R.nearestFloor(P.x - Math.sin(fa) * 1.5, P.z - Math.cos(fa) * 1.5); e.bk = { t: 0.6, x, z }; R.fx('mark', x, 0, z, { r: 0.9, t: 0.6 }); return false; }
    if (walk && d > 1.6) { H.move(e, a, sp * 0.6, dt); return true; }
    return false;
  };
  // 伸頸：保持三、四公尺，地上拉出直線後脖子甩過來
  AI.reach = (e, P, d, a, sp, dt, walk, H) => {
    if (e.rch) { e.yaw = e.rch.a; e.rch.t -= dt; if (e.rch.t <= 0) { const r = e.rch; e.rch = null; R.fx('slash', e.x, 1.4, e.z, { a: r.a, len: 5.5 }); targets().forEach(t => { const dx = t.x - e.x, dz = t.z - e.z, al = dx * Math.sin(r.a) + dz * Math.cos(r.a), sd = Math.abs(dx * Math.cos(r.a) - dz * Math.sin(r.a)); if (al > 0 && al < 5.8 && sd < 0.9) hit(H, t, e.dmg * 1.3, e, { knock: 0.3 }); }); e.cd = 2.2; } return false; }
    e.yaw = a; let mv = false; const want = d < 2.8 ? a + Math.PI : d > 4.6 ? a : null;
    if (want != null && walk) { H.move(e, want, sp, dt); mv = true; }
    if (e.cd <= 0 && d < 5.5) { e.rch = { a, t: 0.65 }; R.fx('aim', e.x, 0.3, e.z, { a, len: 5.5, t: 0.65 }); }
    return mv;
  };
  // 鼓腹狸：拍肚子，一圈震波往外擴
  const wave = (e, H) => {
    const w = W(), run = w.run, done = new Set(); let r = 0.6;
    R.fx('ring', e.x, 0.1, e.z, { r: 7, color: '#C8A060' }); R.shake(0.15);
    w.dyn.push(dt => { if (w.run !== run) return false; r += dt * 6; targets().forEach(t => { if (done.has(t)) return; const dd = Math.hypot(t.x - e.x, t.z - e.z); if (Math.abs(dd - r) < 0.5 && !(t.iframe > 0) && !(t.air > 0)) { done.add(t); hit(H, t, e.dmg, e, { knock: 0.4 }); } }); return r < 7; });
  };
  AI.drum = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a;
    if (e.drumT > 0) { e.drumT -= dt; if (e.drumT <= 0) wave(e, H); return false; }
    let mv = false;
    if (walk && d > 5) { H.move(e, a, sp, dt); mv = true; } else if (walk && d < 3) { H.move(e, a + Math.PI, sp * 0.7, dt); mv = true; }
    if (e.cd <= 0 && d < 9) { e.cd = 3.6; e.drumT = 0.6; R.fx('ring', e.x, 0.1, e.z, { r: 1, color: '#C8A060' }); }
    return mv;
  };
  // 幻尾狐：保持距離吐紫火，每八秒變出兩個幻影
  AI.decoy = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a; const want = d < 6 ? a + Math.PI : d > 9 ? a : a + Math.PI / 2 * side(e); let mv = false;
    if (walk) { H.move(e, want, sp * (d > 6 && d < 9 ? 0.6 : 1), dt); mv = true; }
    if (e.cd <= 0 && d < 13) { e.cd = 1.7 + rnd() * 0.5; R.fire({ kind: 'spirit', owner: 'e', x: e.x, z: e.z, a, speed: 8, dmg: e.dmg, life: 2.2, src: e }); }
    e.ghT = (e.ghT == null ? 3 : e.ghT) - dt;
    if (e.ghT <= 0) { e.ghT = 8; for (let i = 0; i < 2; i++) { const [x, z] = R.nearestFloor(e.x + (rnd() - 0.5) * 4, e.z + (rnd() - 0.5) * 4), g = R.spawnEnemy('kitsune_ghost', x, z, e.room, { aggro: true }); g.side = i ? 1 : -1; } R.fx('poof', e.x, 1, e.z, { color: '#B89AFF', n: 12 }); }
    return mv;
  };
  AI.ghostfox = (e, P, d, a, sp, dt, walk, H) => {
    e.life = (e.life == null ? 10 : e.life) - dt; if (e.life <= 0) { quietKill(e); return false; }
    e.yaw = a; const want = d < 3 ? a + Math.PI / 2 * side(e) + 0.6 * side(e) : a + Math.PI / 3 * side(e);
    if (walk) { H.move(e, want, sp, dt); return true; } return false;
  };
  // 嵐翼：狂風（直線，把人吹退）或三根羽毛
  AI.gust = (e, P, d, a, sp, dt, walk, H) => {
    if (e.gst) { e.yaw = e.gst.a; e.gst.t -= dt; if (e.gst.t <= 0) { const g = e.gst; e.gst = null; for (let k = 1; k <= 5; k++) R.fx('poof', e.x + Math.sin(g.a) * k * 2, 0.8, e.z + Math.cos(g.a) * k * 2, { color: '#DDE6EE', n: 4 }); targets().forEach(t => { const dx = t.x - e.x, dz = t.z - e.z, al = dx * Math.sin(g.a) + dz * Math.cos(g.a), sd = Math.abs(dx * Math.cos(g.a) - dz * Math.sin(g.a)); if (al > 0 && al < 10 && sd < 1.4) { hit(H, t, e.dmg * 0.6, e); push(t, g.a, 4); } }); e.cd = 2.6; } return false; }
    e.yaw = a; const want = d < 6 ? a + Math.PI : d > 10 ? a : a + Math.PI / 2 * side(e); let mv = false;
    if (walk) { H.move(e, want, sp * (d > 6 && d < 10 ? 0.6 : 1), dt); mv = true; }
    if (e.cd <= 0 && d < 11) {
      if (rnd() < 0.5) { e.gst = { a, t: 0.55 }; R.fx('aim', e.x, 0.3, e.z, { a, len: 10, t: 0.55 }); }
      else { e.cd = 1.8; for (let i = -1; i <= 1; i++) R.fire({ kind: 'feather', owner: 'e', x: e.x, z: e.z, a: a + i * 0.24, speed: 11, dmg: e.dmg, life: 2, src: e }); }
    }
    return mv;
  };
  // 夜鳴獸：腳下三個圈，0.9 秒後落雷；靠近會咬
  AI.thunder = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a; let mv = false; e.mcd = (e.mcd || 0) - dt;
    if (walk && d > 2) { H.move(e, a, sp, dt); mv = true; } else if (e.mcd <= 0) { e.mcd = 1.1; hit(H, P, e.dmg, e); }
    if (e.cd <= 0 && d < 14) {
      e.cd = 4.2; const pts = [[P.x, P.z]]; for (let i = 0; i < 2; i++) { const r2 = 1.5 + rnd() * 2, aa = rnd() * 6.28; pts.push(R.nearestFloor(P.x + Math.sin(aa) * r2, P.z + Math.cos(aa) * r2)); }
      pts.forEach(([x, z]) => R.fx('mark', x, 0, z, { r: 1.6, t: 0.9 }));
      later(() => { pts.forEach(([x, z]) => { R.fx('pillar', x, 0, z, { r: 0.8, color: '#C8B4FF' }); targets().forEach(t => { if (Math.hypot(t.x - x, t.z - z) < 1.6) { hit(H, t, e.dmg * 1.2, e); if (t === W().P) t.stumble = Math.max(t.stumble || 0, 0.6); } }); }); R.shake(0.3); R.sfx && R.sfx('thunder'); }, 900);
    }
    return mv;
  };
  // 獨目童：搶魔力水晶就跑；打倒牠拿回來，跑太遠就沒了
  AI.thief = (e, P, d, a, sp, dt, walk, H) => {
    const w = W(), Pl = w.P, run = w.run;
    if (e.loot != null) {
      const a2 = Math.atan2(e.x - Pl.x, e.z - Pl.z); e.yaw = a2;
      if (walk) H.move(e, a2 + Math.sin(e.t * 4) * 0.5, sp * 1.45, dt);
      if (dist(e, Pl) > 22) { e.goneT = (e.goneT || 0) + dt; if (e.goneT > 5) { quietKill(e); R.toast(e.loot ? '獨目童帶著 ' + e.loot + ' 顆魔力水晶跑掉了。' : '獨目童跑掉了。'); } } else e.goneT = 0;
      return true;
    }
    e.yaw = a;
    if (d > 0.9) { if (walk) { H.move(e, a, sp * 1.15, dt); return true; } return false; }
    if (e.cd <= 0) { e.cd = 1; if (P === Pl) { const n = Math.min(2, run.mats.crystal || 0); if (n) { run.mats.crystal -= n; e.loot = n; R.num(e.x, 2, e.z, '偷！', 'hurt'); R.toast('獨目童搶走了魔力水晶 ×' + n + '！追上去打倒牠就能拿回來'); } else { hit(H, P, e.dmg, e); e.loot = 0; } } else hit(H, P, e.dmg, e); }
    return false;
  };
  // 纏煙：飄過去；每四秒半留下一片濃煙（站在裡面看不清楚、慢慢受傷）
  const cloud = (x, z, e, H) => {
    const w = W(), run = w.run; let left = 5, fx = 0, tick = 0;
    w.dyn.push(dt => {
      if (w.run !== run) return false; left -= dt; fx -= dt; tick -= dt;
      if (fx <= 0) { fx = 0.45; R.fx('poof', x + (rnd() - 0.5) * 3, 0.6 + rnd(), z + (rnd() - 0.5) * 3, { color: '#7A7A84', n: 6 }); }
      const P = w.P; if (P && !P.dead && Math.hypot(P.x - x, P.z - z) < 2.6) { P.blindT = Math.max(P.blindT || 0, 0.7); if (tick <= 0) { tick = 1; hit(H, P, e.dmg * 0.35, e); } }
      return left > 0;
    });
  };
  AI.smoke = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a; e.mcd = (e.mcd || 0) - dt; let mv = false;
    if (walk && d > 1.2) { H.move(e, a, sp, dt); mv = true; } else if (d <= 1.2 && e.mcd <= 0) { e.mcd = 1.2; hit(H, P, e.dmg, e); }
    if (e.cd <= 0) { e.cd = 4.5; cloud(e.x, e.z, e, H); }
    return mv;
  };
  // 面果樹：不會走；果實吐三顆種子，樹根從腳下竄出來
  AI.turret = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a;
    if (e.cd <= 0 && d < 13) { e.cd = 2.4; for (let i = -1; i <= 1; i++) R.fire({ kind: 'seed', owner: 'e', x: e.x, z: e.z, a: a + i * 0.25, speed: 7.5, dmg: e.dmg, life: 2, src: e }); }
    e.rootT = (e.rootT == null ? 4 : e.rootT) - dt;
    if (e.rootT <= 0 && d < 12) { e.rootT = 6; const x = P.x, z = P.z; R.fx('mark', x, 0, z, { r: 1.5, t: 0.8 }); later(() => { R.fx('ring', x, 0.1, z, { r: 1.5, color: '#6A8A3A' }); R.fx('dust', x, 0.15, z, {}); targets().forEach(t => { if (Math.hypot(t.x - x, t.z - z) < 1.5) { hit(H, t, e.dmg * 1.3, e); if (t === W().P) t.slowT = Math.max(t.slowT || 0, 2); } }); }, 800); }
    return false;
  };
  // 紫電鼬：直線衝刺，留下一條會電人的痕跡
  const trail = (x, z, e, H) => {
    const w = W(), run = w.run; let left = 2.2, cd = 0;
    R.fx('ring', x, 0.05, z, { r: 0.5, color: '#C8B4FF' });
    w.dyn.push(dt => { if (w.run !== run) return false; left -= dt; cd -= dt; const P = w.P; if (cd <= 0 && P && !P.dead && Math.hypot(P.x - x, P.z - z) < 0.75) { cd = 0.5; hit(H, P, e.dmg * 0.4, e); R.fx('spark', P.x, 0.4, P.z, { a: 0 }); } return left > 0; });
  };
  AI.zap = (e, P, d, a, sp, dt, walk, H) => {
    if (e.dsh) {
      const ox = e.x, oz = e.z; H.move(e, e.dsh.a, 14, dt); e.dsh.t -= dt; e.yaw = e.dsh.a;
      if (R.pointBlocked(e.x, e.z)) { e.x = ox; e.z = oz; e.dsh.t = 0; }
      e.dsh.lay -= dt; if (e.dsh.lay <= 0) { e.dsh.lay = 0.07; trail(e.x, e.z, e, H); }
      if (!e.dsh.hit && dist(e, P) < 1) { e.dsh.hit = true; hit(H, P, e.dmg, e); }
      if (e.dsh.t <= 0) { e.dsh = null; e.cd = 2.2; }
      return true;
    }
    e.yaw = a; let mv = false; const want = d > 7 ? a : a + Math.PI / 2 * side(e);
    if (walk) { H.move(e, want, sp * 0.6, dt); mv = true; }
    if (e.cd <= 0 && d < 12) { e.dsh = { a, t: 0.55, lay: 0, hit: false }; R.fx('aim', e.x, 0.3, e.z, { a, len: 7.5, t: 0.25 }); }
    return mv;
  };
  // 高仰影：準心對著牠就長大（最大 2.2 倍，越大越痛），移開就縮小
  AI.grow = (e, P, d, a, sp, dt, walk, H) => {
    const Pl = W().P, look = Pl && !Pl.dead && Pl.aimA != null && Math.abs(wrap(Pl.aimA - angTo(Pl, e))) < 0.55 && dist(e, Pl) < 14;
    e.gs = Math.max(0.8, Math.min(2.2, (e.gs || 1) + (look ? 0.4 : -0.5) * dt)); e.m.g.scale.setScalar(e.gs);
    e.yaw = a;
    if (e.slm > 0) { e.slm -= dt; if (e.slm <= 0) { const r = 1.6 * e.gs, x = e.x + Math.sin(e.yaw) * 1.2, z = e.z + Math.cos(e.yaw) * 1.2; R.fx('boom', x, 0.3, z, { r, color: '#3A3A48' }); R.shake(0.2 * e.gs); targets().forEach(t => { if (Math.hypot(t.x - x, t.z - z) < r) hit(H, t, e.dmg * e.gs, e, { knock: 0.4 }); }); e.cd = 2.5; } return false; }
    let mv = false; if (walk && d > 1.5) { H.move(e, a, sp, dt); mv = true; }
    if (e.cd <= 0 && d < 1.8 * e.gs + 1) { e.slm = 0.7; R.fx('mark', e.x + Math.sin(a) * 1.2, 0, e.z + Math.cos(a) * 1.2, { r: 1.6 * e.gs, t: 0.7 }); }
    return mv;
  };
  // 吞夢獸：咬中吸走魔力，補自己
  AI.drain = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a;
    if (d > e.def.size + 0.8) { if (walk) { H.move(e, a, sp, dt); return true; } return false; }
    if (e.cd <= 0) { e.cd = 1.3; hit(H, P, e.dmg, e); const Pl = W().P; if (P === Pl) { const m = Math.min(Pl.mp, 14); if (m > 0) { Pl.mp -= m; R.num(Pl.x, 2.6, Pl.z, '魔力 −' + Math.round(m), 'hurt'); e.hp = Math.min(e.hpMax, e.hp + e.hpMax * 0.06); R.fx('ring', e.x, 0.1, e.z, { r: 1, color: '#9A7AFF' }); } } }
    return false;
  };
  // 懸首：飄在半空跟著你，地上出現大圈就砸下來；砸完在地上喘 1.8 秒
  AI.slam = (e, P, d, a, sp, dt, walk, H) => {
    e.yaw = a; if (e.hy == null) e.hy = 2;
    if (e.grd > 0) { e.grd -= dt; if (e.grd < 0.5) e.hy = Math.min(2, e.hy + dt * 4); e.m.g.position.y = e.hy; return false; }
    if (e.drop) {
      const dx = e.drop.x - e.x, dz = e.drop.z - e.z, dd = Math.hypot(dx, dz); if (dd > 0.1) { const k = Math.min(dd, 10 * dt); e.x += dx / dd * k; e.z += dz / dd * k; }
      e.drop.t -= dt;
      if (e.drop.t <= 0) { e.hy -= dt * 12; if (e.hy <= 0) { e.hy = 0; R.fx('boom', e.x, 0.3, e.z, { r: 2.4, color: '#E8D8C8' }); R.shake(0.5); targets().forEach(t => { if (Math.hypot(t.x - e.x, t.z - e.z) < 2.4) hit(H, t, e.dmg * 1.6, e, { knock: 0.5 }); }); e.drop = null; e.grd = 1.8; e.cd = 3.2; } }
      e.m.g.position.y = e.hy; return true;
    }
    e.hy = Math.min(2, e.hy + dt * 3); let mv = false; if (walk && d > 1) { H.move(e, a, sp, dt); mv = true; }
    if (e.cd <= 0 && d < 10) { e.drop = { x: P.x, z: P.z, t: 0.9 }; R.fx('mark', P.x, 0, P.z, { r: 2.4, t: 1.1 }); }
    e.m.g.position.y = e.hy + Math.sin(e.t * 2) * 0.15;
    return mv;
  };

  // ---------- 受傷、倒下：高仰影縮小時脆弱、懸首在地上脆弱；幻影一碰就散；獨目童還東西 ----------
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => {
    if (e && !e.dead) { const ai = e.def.ai; if (ai === 'grow') raw *= (e.gs || 1) < 1.1 ? 1.6 : (e.gs || 1) > 1.7 ? 0.7 : 1; else if (ai === 'slam') raw *= e.grd > 0 ? 1.5 : (e.hy || 0) > 1 ? 0.75 : 1; }
    return he0(e, raw, o);
  };
  const quietKill = e => { if (e.dead) return; e.dead = true; e.hp = 0; R.fx('poof', e.x, 1, e.z, { color: e.def.color, n: 10 }); W().scene.remove(e.m.g); };
  const ke0 = R.killEnemy;
  R.killEnemy = (e, by) => {
    if (e.dead) return;
    if (e.def.noLoot) { quietKill(e); return; }
    if (e.def.ai === 'thief' && e.loot > 0) { const run = W().run; run.mats.crystal = (run.mats.crystal || 0) + e.loot; R.toast('從獨目童手上拿回了魔力水晶 ×' + e.loot); e.loot = 0; }
    return ke0(e, by);
  };
  // 成群出現（鐵齒鼠）：生一隻，旁邊再生幾隻；睡著、醒著跟第一隻一樣
  // 2026-10-14 修正：旁邊那幾隻原本用最裡面的 se0 生，跳過後面所有包裝（IS、難度、深度、連線同步）→ 沒有 IS、比較弱。改走最外層的 R.spawnEnemy（packed 擋住不會再生一群）
  const se0 = R.spawnEnemy;
  R.spawnEnemy = (id, x, z, room, o) => {
    const e = se0(id, x, z, room, o), d = R.ENEMIES[id];
    if (d && d.pack && !(o && o.packed)) {
      const extra = []; for (let i = 1; i < d.pack; i++) { const [px, pz] = R.nearestFloor(x + (rnd() - 0.5) * 2.4, z + (rnd() - 0.5) * 2.4); extra.push(R.spawnEnemy(id, px, pz, room, Object.assign({}, o, { packed: true }))); }
      Promise.resolve().then(() => extra.forEach(k => { if (!k) return; k.dormant = e.dormant; k.aggro = e.aggro; }));
    }
    return e;
  };

  // ---------- 分到哪裡 ----------
  const G = id => R.GRADES.find(g => g.id === id), addPool = (gid, ids) => { const g = G(gid); if (g) ids.forEach(i => { if (!g.pool.includes(i)) g.pool.push(i); }); };
  addPool('hamilia', ['tesso', 'tanuki']);
  addPool('amile', ['tesso', 'tanuki', 'nopperabo', 'hitotsume', 'enenra', 'jinmenju', 'baku', 'kyorinrin']);
  addPool('mors', ['tesso', 'tanuki', 'nopperabo', 'rokuro', 'kitsune', 'tengu', 'nue', 'hitotsume', 'enenra', 'jinmenju', 'raiju', 'mikoshi', 'baku', 'kyorinrin', 'okubi']);
  addPool('kesent', ['nopperabo', 'rokuro', 'kitsune', 'tengu', 'nue', 'hitotsume', 'enenra', 'jinmenju', 'raiju', 'mikoshi', 'baku', 'kyorinrin', 'okubi', 'tanuki']);
  const fav = (t, o) => { const T = R.TYPES[t]; if (T) T.favor = Object.assign({}, T.favor, o); };
  fav('tower', { tengu: 2, kyorinrin: 2 });
  fav('city', { tanuki: 2, hitotsume: 1, nopperabo: 1 });
  fav('maze', { tesso: 2, jinmenju: 2, raiju: 1 });
  fav('tomb', { rokuro: 2, mikoshi: 2, okubi: 1 });
  fav('island', { kitsune: 1, jinmenju: 1 });
})(window.R);
