// 更多狩獵場、野獸、狩獵委託（2026-10-22 作者：狩獵考核不要只有一張地圖，陸地上的生物、任務、地圖可以多點）
// - 狩獵考核照舊在湯山村後山（hunt.js）。考核合格兩次以後，公會多開三座狩獵場的委託：
//   東鶴近郊・枯木林（深秋，落葉的樹）：原野狼（成群）、枝角鹿（低頭衝撞，正面鹿角擋傷害）、雪原兔（只會逃）。
//   南瀧・竹林溪谷（竹林、溪邊）：竹影虎（伏低撲擊）、投石猿（保持距離丟石頭）、蘆鷺（長喙突刺）。
//   板北・高原草地（草地、稀疏的樹）：疾角羚（跑很快、會逃）、岩鷲（從空中俯衝）、原野狼。
// - 委託有兩種，每天每座狩獵場隨機一種：
//   狩獵：打倒指定的獵物（多殺的扣環境分，先打到你的算自衛）。
//   驅趕：把指定的野獸打到剩四成血，牠就會逃走（算一頭）；打死的不算，還扣環境分。
// - 野獸不是遺跡生物：沒有魔力水晶，打倒掉毛皮、角、羽毛、肉（素材，可以賣給公會）。
// - 地面、樹的樣子：site.ground（地面顏色）、site.trees（bare 落葉的樹、bamboo 竹林、grass 草地上稀疏的樹）；hunt.js 照這兩個蓋。
// 放在 hunt.js、huntspider.js 後面。
(function (R) {
  const W = () => R.W, S = () => R.S, $ = id => document.getElementById(id), rnd = Math.random, pick = a => a[Math.floor(rnd() * a.length)];
  const T3 = () => window.THREE;
  // ---------- 野獸 ----------
  const WILD = {
    plainwolf: { name: '原野狼', hp: 140, dmg: 14, speed: 4.6, xp: 18, size: 0.9, ai: 'chase', color: '#7A7468', eye: '#E8A040', desc: '灰褐色的狼，背上一條深色的鞍紋。三四頭一群，帶頭的頭狼特別大。有狼受了重傷就會長嚎，附近的狼一起變快、變兇；先打倒頭狼，剩下的會夾著尾巴逃走。', drop: [['wolfpelt', 1], ['meat', 1]] },
    branchstag: { name: '枝角鹿', hp: 420, dmg: 22, speed: 3.8, xp: 40, size: 1.4, ai: 'charge', color: '#7A5A3A', eye: '#E8C060', desc: '鹿角長得像冬天光禿禿的樹枝，上面還掛著幾片枯葉。正面的傷害被鹿角擋掉一半；被牠衝到會被鹿角勾住，動作變慢。從側面或背後下手。', drop: [['stagantler', 1], ['meat', 2]] },
    swifthorn: { name: '疾角羚', hp: 120, dmg: 12, speed: 6.2, xp: 22, size: 1.0, ai: 'kite', color: '#C89A5A', eye: '#3A2A1A', flee: 1, desc: '細長的羚羊，跑起來太快，刀和箭都只能擦過（傷害六成）。每隔一陣子會停下來低頭吃草──那幾秒才是下手的時候（傷害 ×1.5）。一受傷就往遠處逃。', drop: [['swifthornpiece', 1], ['meat', 1]] },
    crageagle: { name: '岩鷲', hp: 110, dmg: 16, speed: 5.2, xp: 24, size: 1.0, ai: 'swoop', fly: 1, color: '#4A3A2A', eye: '#F0C040', desc: '白頭的大鷲。在高處盤旋的時候近戰打不到，只能用遠程；俯衝抓完人會停在地上喘一下，那時候近戰也打得到，而且特別痛。', drop: [['eaglefeather', 2]] },
    stoneape: { name: '投石猿', hp: 130, dmg: 10, speed: 4.2, xp: 18, size: 0.8, ai: 'kite', shoot: 0.6, color: '#8A8A88', eye: '#C83A2A', desc: '紅臉的山猿，抓起石頭就丟。被牠打到，牠會順手搶走一瓶回復藥就跑──打倒牠才拿得回來。', drop: [['apefur', 1]] },
    bambootiger: { name: '竹影虎', hp: 380, dmg: 26, speed: 5.4, xp: 45, size: 1.3, ai: 'pounce', color: '#9A9A4A', eye: '#E8E05A', desc: '金綠色的虎，身上的直紋像竹子的影子。離你遠的時候藏在竹影裡幾乎看不見，第一下撲擊特別重（×1.6）。看到地上的草在動就要小心。', drop: [['tigerpelt', 1], ['meat', 2]] },
    snowhare: { name: '雪原兔', hp: 40, dmg: 0, speed: 6, xp: 6, size: 0.5, ai: 'kite', flee: 1, harmless: 1, color: '#EEF2F6', eye: '#6AA8E8', desc: '大大的白兔，耳朵很長。不會攻擊人，一看到人就跑；被追太久會鑽進地洞不見。', drop: [['harefur', 1], ['meat', 1]] },
    reedheron: { name: '蘆鷺', hp: 100, dmg: 15, speed: 3.6, xp: 16, size: 0.9, ai: 'charge', color: '#7A8AA0', eye: '#F0D040', desc: '灰藍色的高大水鳥，長喙像槍一樣往前刺。從正面近戰打牠，常常會被長喙撥開（三成五）；繞到側面或背後。', drop: [['heronplume', 1]] }
  };
  Object.keys(WILD).forEach(id => { const w = WILD[id]; R.ENEMIES[id] = Object.assign({ ref: '', wild: 1, noDex: 1 }, w); delete R.ENEMIES[id].drop; });
  Object.assign(R.MATS, {
    wolfpelt: { name: '原野狼的毛皮', color: '#7A7468', value: 20, desc: '灰褐色的毛皮，背上那條深色的鞍紋很好認。' },
    stagantler: { name: '枝角鹿的角', color: '#7A5A3A', value: 35, desc: '像樹枝一樣分岔的鹿角，磨過以後很光滑。' },
    swifthornpiece: { name: '疾角羚的角', color: '#5A4A3A', value: 28, desc: '螺旋狀的細長羚角，又輕又硬。' },
    eaglefeather: { name: '岩鷲的羽毛', color: '#4A3A2A', value: 12, desc: '又長又挺的飛羽，箭師喜歡拿來做箭羽。' },
    apefur: { name: '投石猿的毛', color: '#8A8A88', value: 10, desc: '灰色的粗毛。' },
    tigerpelt: { name: '竹影虎的毛皮', color: '#9A9A4A', value: 60, desc: '金綠色帶直紋的毛皮，在南瀧的市場很搶手。' },
    harefur: { name: '雪原兔的毛', color: '#EEF2F6', value: 8, desc: '又白又軟，冬天縫在衣領上。' },
    heronplume: { name: '蘆鷺的飾羽', color: '#7A8AA0', value: 14, desc: '頸後那幾根長長的飾羽。' }
  });
  // 枝角鹿正面、驅趕：傷害打折、逃走
  const ed0 = R.enemyDefend;
  R.enemyDefend = (e, dmg, o, crit) => {
    dmg = ed0 ? ed0(e, dmg, o, crit) : dmg;
    if (!e || e.id !== 'branchstag') return dmg;
    const P = W().P; if (!P) return dmg; const a = Math.atan2(P.x - e.x, P.z - e.z), off = Math.abs(Math.atan2(Math.sin(a - e.yaw), Math.cos(a - e.yaw)));
    if (off < 0.9) { if (rnd() < 0.4) R.num(e.x, 1.8 * e.def.size + 0.9, e.z, '鹿角', ''); return dmg * 0.5; }
    return dmg;
  };
  // 雪原兔不會打人
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => (src && src.def && src.def.harmless ? undefined : hp0(raw, src, o));

  // 圖鑑：野獸的掉落（每一頭都會掉）
  R.dexWildDrops = id => { const w = WILD[id]; if (!w) return ''; return '<h4 class="dx-h">掉落素材</h4><p>' + w.drop.map(([m, n]) => (R.matIconTag ? R.matIconTag(m, 'chip') : '') + R.esc((R.MATS[m] || {}).name || m) + ' ×' + n + '（100%）').join('、') + '</p>'; };
  // ---------- 狩獵場 ----------
  const GROUNDS = [
    { id: 'tk-autumnwood', name: '東鶴近郊・枯木林', short: '枯木林', ground: '#8A7A5A', trees: 'bare', fog: '#C8BEA8', floors: ['林緣', '林間'], desc: '東鶴郊外的落葉林。深秋，地上鋪滿枯葉。', beasts: ['plainwolf', 'branchstag', 'snowhare'] },
    { id: 'nl-bamboo', name: '南瀧・竹林溪谷', short: '竹林溪谷', ground: '#6A7A4A', trees: 'bamboo', fog: '#B8C8A8', floors: ['竹林', '溪谷'], desc: '南瀧北邊的竹林，溪水從谷底流過。', beasts: ['bambootiger', 'stoneape', 'reedheron'] },
    { id: 'bb-highland', name: '板北・高原草地', short: '高原草地', ground: '#7A9A4A', trees: 'grass', fog: '#C8D8C0', floors: ['草坡', '高原'], desc: '板北東邊的高原，草長得到膝蓋。', beasts: ['swifthorn', 'crageagle', 'plainwolf'] }
  ];
  const GMAP = {}; GROUNDS.forEach(g => { GMAP[g.id] = g; if (!R.SITES.find(s => s.id === g.id)) R.SITES.push({ id: g.id, kind: 'hunt', outdoor: 1, grade: 'hunt', type: 'forest', name: g.name + '・狩獵場', src: '', desc: g.desc, status: 'open', ground: g.ground, trees: g.trees }); });
  const gOf = run => run && run.site && GMAP[run.site.id];
  // 今天的委託（每座狩獵場一種，照日子固定）
  const jobOf = gid => {
    const s = S(), day = (s && s.day) || 0, g = GMAP[gid], seed = (day * 7 + gid.length * 13) % 97, kind = seed % 3 === 0 ? 'drive' : 'hunt';
    const main = g.beasts[seed % 2], side = g.beasts[(seed + 1) % 2];
    return kind === 'drive' ? { kind, need: { [main]: 3 }, side } : { kind, need: { [main]: main === 'plainwolf' ? 4 : 2, [side]: 1 } };
  };
  const nm = id => (R.ENEMIES[id] || {}).name || id;
  const needTxt = need => Object.keys(need).map(k => nm(k) + ' ' + need[k] + ' 頭').join('、');
  // 野獸放在哪裡
  R.huntSpawn = (run, F, rooms, put) => {
    const g = gOf(run); if (!g) return; const job = run.huntJob || jobOf(g.id); run.huntJob = job;
    const list = [];
    Object.keys(job.need).forEach(k => { for (let i = 0; i < job.need[k] + (run.floor ? 1 : 0); i++) list.push(k); });
    if (job.side) list.push(job.side);
    g.beasts.forEach(k => { if (!list.includes(k)) list.push(k); });
    if (g.beasts.includes('snowhare') || rnd() < 0.5) list.push('snowhare');
    // 這一層放一半多一點（第二層放剩下的）
    const here = run.floor === 0 ? list.slice(0, Math.ceil(list.length * 0.55)) : list.slice(Math.ceil(list.length * 0.55));
    here.forEach((k, i) => { put(k, rooms[i % Math.max(1, rooms.length)]); if (k === 'plainwolf') put('plainwolf', rooms[i % Math.max(1, rooms.length)]); });
  };
  // 打倒、驅趕
  const ke0 = R.killEnemy;
  R.killEnemy = (e, by) => {
    const was = e && !e.dead, w = was && WILD[e.id]; const r = ke0(e, by);
    if (w && e.dead) { const run = W().run; w.drop.forEach(([m, n], i) => R.dropMat(m, n, e.x + i * 0.6, e.z)); if (run && run.huntJob && run.huntJob.kind === 'drive' && run.huntJob.need[e.id]) { run.huntBad = (run.huntBad || 0) + 1; R.toast && R.toast('驅趕委託：打死的不算，還扣環境分', '#FF9A6A'); } }
    return r;
  };
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => {
    const r = he0(e, raw, o), run = W().run;
    try {
      if (e && !e.dead && e.def && e.def.wild && run && gOf(run)) {
        const job = run.huntJob;
        if (job && job.kind === 'drive' && job.need[e.id] && e.hp <= e.hpMax * 0.4 && !e.driven) {   // 驅趕：剩四成血就逃走
          e.driven = 1; run.huntDriven = run.huntDriven || {}; run.huntDriven[e.id] = (run.huntDriven[e.id] || 0) + 1;
          R.fx && R.fx('poof', e.x, 0.8, e.z, { color: '#E8E4DC', n: 18 }); e.dead = true; if (e.m && e.m.g && e.m.g.parent) e.m.g.parent.remove(e.m.g);
          R.toast && R.toast(e.def.name + '逃走了（' + run.huntDriven[e.id] + '／' + job.need[e.id] + '）', '#9AE07A');
        } else if (e.def.flee && e.hp < e.hpMax * 0.7 && !e.fleeT) e.fleeT = 3;   // 疾角羚、雪原兔：受傷就跑更遠
      }
    } catch (err) { console.warn('[huntmore]', err); }
    return r;
  };
  // ---------- 樹：落葉的樹、竹林、草地 ----------
  R.huntTreeField = (kind, list, group) => {
    if (kind === 'bare') { list.forEach(t => { t.bare = true; t.s = 0.9 + rnd() * 0.5; }); return null; }
    if (kind === 'grass') { const keep = list.filter((t, i) => i % 5 === 0); keep.forEach(t => { t.bare = true; t.s = 0.8 + rnd() * 0.4; }); list.length = 0; keep.forEach(t => list.push(t)); return null; }
    if (kind !== 'bamboo' || !T3()) return null;
    // 竹子：一叢三到五根細長的綠竿，竿頂一團葉子
    const TH = T3(), C = h => new TH.Color(h).convertSRGBToLinear(), stems = [], dummy = new TH.Object3D();
    list.forEach(t => { const n = 3 + Math.floor(rnd() * 3); for (let i = 0; i < n; i++) stems.push({ t, x: t.x + (rnd() - 0.5) * 1.2, z: t.z + (rnd() - 0.5) * 1.2, h: 5 + rnd() * 4, lean: (rnd() - 0.5) * 0.2 }); });
    const stem = new TH.InstancedMesh(new TH.CylinderGeometry(0.09, 0.12, 1, 6), new TH.MeshLambertMaterial({ color: C('#6A9A4A') }), stems.length);
    const leaf = new TH.InstancedMesh(new TH.ConeGeometry(0.9, 1.8, 6), new TH.MeshLambertMaterial({ color: C('#4A7A3A') }), stems.length);
    stem.frustumCulled = leaf.frustumCulled = false; group.add(stem); group.add(leaf);
    const update = (yaw, force) => {
      stems.forEach((s, i) => { const k = s.t.hide ? 0.05 : 1; dummy.position.set(s.x, s.h * k / 2, s.z); dummy.rotation.set(s.lean, 0, s.lean); dummy.scale.set(1, s.h * k, 1); dummy.updateMatrix(); stem.setMatrixAt(i, dummy.matrix);
        dummy.position.set(s.x + s.lean * s.h * 0.5, s.h * k, s.z); dummy.rotation.set(Math.PI, 0, 0); dummy.scale.setScalar(k); dummy.updateMatrix(); leaf.setMatrixAt(i, dummy.matrix); });
      stem.instanceMatrix.needsUpdate = leaf.instanceMatrix.needsUpdate = true;
    };
    update(0, true); return { update, out: [{ im: stem }, { im: leaf }] };
  };
  // 空地的地面、霧的顏色
  const th0 = R.theme;
  R.theme = run => { const t = th0(run), g = gOf(run); return g ? Object.assign({}, t, { floor: g.ground, top: g.ground, fog: g.fog, wall: '#3A4A2E' }) : t; };
  // ---------- 進狩獵場：天色、地名 ----------
  const lf0 = R.loadFloor;
  R.loadFloor = (f, o) => {
    const r = lf0(f, o), run = W().run, g = gOf(run); if (!g) return r;
    const sc = W().scene; if (sc) sc.children.forEach(c => { if (c.isHemisphereLight) c.intensity = 0.55; }); if (sc && sc.fog) { sc.fog.color.set(g.fog); if (sc.background && sc.background.isColor) sc.background.set(g.fog); }
    if (f === 0 && run.huntJob) setTimeout(() => R.banner && R.banner(g.name, (run.huntJob.kind === 'drive' ? '驅趕：' : '狩獵：') + needTxt(run.huntJob.need)), 1500);
    return r;
  };
  const fl0 = R.floorLabel;
  R.floorLabel = run => { const g = gOf(run); return g ? (g.floors[run.floor] || '深處') : fl0(run); };
  // ---------- 委託書 ----------
  const ts0 = R.taskSpec;
  R.taskSpec = site => {
    const g = site && GMAP[site.id]; if (!g) return ts0(site);
    const job = jobOf(g.id), n = Object.values(job.need).reduce((a, b) => a + b, 0);
    return { kind: 'hunt', need: n, limitH: 8, letter: 'D', floors: 2, lines: job.kind === 'drive'
      ? ['任務分級：D 級（野獸驅趕，' + g.short + '附近的居民委託）', '目標：把' + needTxt(job.need) + '趕走（打到剩四成血，牠就會逃）', '打死的不算，還扣環境分。時限：8 小時。']
      : ['任務分級：D 級（野獸狩獵，' + g.short + '附近的居民委託）', '目標：' + needTxt(job.need), '多殺的獵物扣環境分（先打到你的算自衛）。時限：8 小時。'] };
  };
  const sr0 = R.startRun;
  R.startRun = id => { const r = sr0(id), run = W().run; if (run && GMAP[id] && !run.huntJob) run.huntJob = jobOf(id); return r; };
  // ---------- 回到地面：完成度、走完 ----------
  const ex0 = R.extract;
  R.extract = how => {
    const run = W().run, g = gOf(run); if (!g || run.done) return ex0(how);
    const job = run.huntJob || jobOf(g.id), k = run.huntKills || {}, dv = run.huntDriven || {}, def = run.huntDefend || {};
    let got = 0, need = 0, extra = 0;
    Object.keys(job.need).forEach(id => { need += job.need[id]; got += Math.min(job.need[id], job.kind === 'drive' ? dv[id] || 0 : k[id] || 0); if (job.kind === 'hunt') extra += Math.max(0, (k[id] || 0) - job.need[id] - (def[id] || 0)); });
    Object.keys(k).forEach(id => { if (!job.need[id] && id !== 'snowhare') extra += Math.max(0, k[id] - (def[id] || 0)); });
    extra += run.huntBad || 0; run.kills = got;
    const Fh = W().F; if (got >= need && Fh && run.floor === run.floors - 1) { const rm = Fh.rooms.find(x => x.type !== 'start' && x.type !== 'stairs'); if (rm) { rm.type = 'deep'; rm.visited = true; rm.cleared = true; } }
    const r = ex0(how);
    const s = S(), t = s.tasks && s.tasks[s.tasks.length - 1]; if (t && t.day === s.day && !t.hunt) { t.hunt = 1; t.site = g.short + (job.kind === 'drive' ? '・驅趕委託' : '・狩獵委託'); if (extra && t.s) t.s[3] = Math.max(1, t.s[3] - 12 * extra); R.save && R.save(); }
    return r;
  };
  // ---------- 野獸的小動作：疾角羚、雪原兔受傷會逃遠一點 ----------
  const st0 = R.step;
  R.step = dt => {
    const r = st0(dt), w = W(); if (!w.run || !gOf(w.run) || w.paused || !w.P) return r;
    (w.enemies || []).forEach(e => { if (e.dead || !(e.fleeT > 0)) return; e.fleeT -= dt; const a = Math.atan2(e.x - w.P.x, e.z - w.P.z), sp = (e.def.speed || 5) * 1.2 * dt; e.x += Math.sin(a) * sp; e.z += Math.cos(a) * sp; if (R.collide) R.collide(e, 0.4); });
    return r;
  };
  // ---------- 每種野獸的特色（2026-10-22 作者：陸地上的生物要有特色，像土鎧豬、蓑背熊那樣） ----------
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const near = e => { const P = W().P; return P && dist(P, e) < 3.6; };   // 近戰（離牠很近才打得到的）
  const front = e => { const P = W().P; if (!P) return false; const a = Math.atan2(P.x - e.x, P.z - e.z); return Math.abs(Math.atan2(Math.sin(a - e.yaw), Math.cos(a - e.yaw))) < 0.9; };
  const say = (e, t) => R.num && R.num(e.x, 1.8 * (e.def.size || 1) + 0.9, e.z, t, '');
  const alpha = (e, k) => { const m = e.m && e.m.sp && e.m.sp.mat; if (!m) return; m.transparent = true; m.opacity = k; };
  // 頭狼：每一層第一頭狼大一號、血多六成
  const se1 = R.spawnEnemy;
  R.spawnEnemy = (id, x, z, room, o) => {
    const e = se1(id, x, z, room, o), run = W().run;
    try { if (e && id === 'plainwolf' && gOf(run)) { const F = W().F; if (F && !F.wolfLead) { F.wolfLead = e; e.lead = 1; e.hp = e.hpMax = Math.round(e.hpMax * 1.6); if (e.m && e.m.g) e.m.g.scale.multiplyScalar(1.25); e.def = Object.assign({}, e.def, { name: '原野狼（頭狼）' }); } } } catch (err) { }
    return e;
  };
  const ed1 = R.enemyDefend;
  R.enemyDefend = (e, dmg, o, crit) => {
    dmg = ed1 ? ed1(e, dmg, o, crit) : dmg; if (!e || !e.def || !WILD[e.id]) return dmg;
    if (e.id === 'swifthorn') { if (e.graze > 0) { if (rnd() < 0.3) say(e, '吃草中'); return dmg * 1.5; } if (rnd() < 0.25) say(e, '擦過'); return dmg * 0.6; }
    if (e.id === 'crageagle') { if (e.soar > 0 && near(e)) { if (rnd() < 0.4) say(e, '在空中，打不到'); return dmg * 0.1; } if (e.perch > 0) return dmg * 1.5; }
    if (e.id === 'reedheron' && near(e) && front(e) && rnd() < 0.35) { say(e, '長喙撥開'); R.fx && R.fx('block', e.x, 0.9, e.z); return 0; }
    if (e.id === 'bambootiger' && e.hide) { e.hide = 0; alpha(e, 1); say(e, '被看到了'); }
    return dmg;
  };
  const hp1 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => {
    try {
      if (src && src.def && WILD[src.id]) {
        const P = W().P;
        if (src.id === 'bambootiger' && src.hide) { raw *= 1.6; src.hide = 0; alpha(src, 1); R.toast && R.toast('竹影虎從竹影裡撲出來了！', '#E8E05A'); }
        if (src.id === 'branchstag' && P) { P.slowT = Math.max(P.slowT || 0, 1.5); say(P, '被鹿角勾住'); }
        if (src.id === 'stoneape' && !src.stole && S().potions && (S().potions.hp || 0) > 0 && rnd() < 0.5) { S().potions.hp--; src.stole = (src.stole || 0) + 1; src.fleeT = 4; R.toast && R.toast('投石猿搶走了一瓶回復藥！打倒牠才拿得回來', '#FF9A6A'); }
        if (src.id === 'crageagle') { src.perch = 2.5; src.soar = 0; if (src.st) src.st.root = 2.5; say(src, '停在地上'); }
      }
    } catch (err) { }
    return hp1(raw, src, o);
  };
  const ke1 = R.killEnemy;
  R.killEnemy = (e, by) => {
    const was = e && !e.dead, r = ke1(e, by), w = W();
    try {
      if (was && e.dead && e.id === 'stoneape' && e.stole) { S().potions.hp = (S().potions.hp || 0) + e.stole; R.toast && R.toast('拿回了被搶走的回復藥（' + e.stole + ' 瓶）', '#9AE07A'); }
      if (was && e.dead && e.lead) {   // 頭狼倒下：剩下的狼逃走
        (w.enemies || []).forEach(o => { if (!o.dead && o.id === 'plainwolf') { o.fleeT = 3; o.gone = 3; } });
        R.banner && R.banner('頭狼倒下了', '剩下的狼夾著尾巴逃走了');
      }
    } catch (err) { }
    return r;
  };
  const st1 = R.step;
  R.step = dt => {
    const r = st1(dt), w = W(); if (!w.run || !gOf(w.run) || w.paused || !w.P) return r;
    const P = w.P;
    try {
      (w.enemies || []).forEach(e => {
        if (e.dead || !WILD[e.id]) return;
        // 逃走的狼：跑一下就不見（驅趕委託算趕走了一頭）
        if (e.gone != null) { e.gone -= dt; if (e.gone <= 0) { e.dead = true; if (e.m && e.m.g && e.m.g.parent) e.m.g.parent.remove(e.m.g); const job = w.run.huntJob; if (job && job.kind === 'drive' && job.need[e.id]) { w.run.huntDriven = w.run.huntDriven || {}; w.run.huntDriven[e.id] = (w.run.huntDriven[e.id] || 0) + 1; } } return; }
        if (e.id === 'plainwolf') {
          if (!e.howled && e.hp < e.hpMax * 0.5) { e.howled = 1; say(e, '嗷──'); R.fx && R.fx('ring', e.x, 0.1, e.z, { r: 6, color: '#E8A040' }); (w.enemies || []).forEach(o => { if (!o.dead && o.id === 'plainwolf' && dist(o, e) < 18) o.rage = 6; }); }
          if (e.rage != null) { if (!e.baseSp) { e.baseSp = e.speed; e.baseDmg = e.dmg; } e.rage -= dt; e.speed = e.baseSp * (e.rage > 0 ? 1.35 : 1); e.dmg = e.baseDmg * (e.rage > 0 ? 1.25 : 1); if (e.rage <= 0) e.rage = null; }
        }
        if (e.id === 'swifthorn') {
          e.grazeT = (e.grazeT == null ? 4 + rnd() * 4 : e.grazeT) - dt;
          if (e.graze > 0) { e.graze -= dt; if (e.st) e.st.root = Math.max(e.st.root || 0, 0.2); }
          else if (e.grazeT <= 0 && !(e.fleeT > 0)) { e.grazeT = 10 + rnd() * 4; e.graze = 3; say(e, '低頭吃草'); }
        }
        if (e.id === 'crageagle') {
          if (e.perch > 0) e.perch -= dt;
          else { e.soarT = (e.soarT == null ? 0 : e.soarT) - dt; if (e.soarT <= 0) { e.soar = 4 + rnd() * 2; e.soarT = e.soar + 3; } if (e.soar > 0) e.soar -= dt; }
          if (e.m && e.m.g) e.m.g.position.y = e.soar > 0 ? 2.2 : 0;
        }
        if (e.id === 'bambootiger') {
          const d = dist(P, e);
          if (!e.hidden0) { e.hidden0 = 1; e.hide = 1; }
          if (e.hide) alpha(e, d < 6 ? 0.5 : 0.12); else if (d > 14 && !(e.st && e.st.root > 0)) { e.hideT = (e.hideT || 0) + dt; if (e.hideT > 5) { e.hideT = 0; e.hide = 1; } }
        }
        if (e.id === 'snowhare') { if (dist(P, e) < 9) { e.chase = (e.chase || 0) + dt; if (e.chase > 6) { R.fx && R.fx('poof', e.x, 0.3, e.z, { color: '#EEF2F6', n: 12 }); say(e, '鑽進地洞了'); e.dead = true; if (e.m && e.m.g && e.m.g.parent) e.m.g.parent.remove(e.m.g); } } }
      });
    } catch (err) { console.warn('[huntmore]', err); }
    return r;
  };
  // ---------- 公會：委託告示板上多三張 ----------
  const hub0 = R.hub;
  R.hub = (t, f) => {
    hub0(t, f);
    try {
      const body = $('hub-body'), qs = body && body.querySelector('.quests'); if (!qs) return;
      const ok = ((S().hunt && S().hunt.passed) || 0) >= 2;
      GROUNDS.forEach(g => {
        const job = jobOf(g.id), card = document.createElement('div'); card.className = 'quest'; card.style.setProperty('--c', (R.GRADE_COLOR && R.GRADE_COLOR.hunt) || '#5A8A4A');
        card.innerHTML = '<b>' + R.esc(g.name) + '・狩獵場</b><small>D 級・' + (job.kind === 'drive' ? '驅趕' : '狩獵') + '：' + R.esc(needTxt(job.need)) + '</small>'
          + (ok ? '<button type="button" class="btn pri" data-hm2="' + g.id + '">接' + (job.kind === 'drive' ? '驅趕' : '狩獵') + '委託</button>' : '<small style="opacity:.7">狩獵考核合格兩次以後開放</small>');
        qs.insertBefore(card, qs.querySelector('[data-map]') || null);
        const b = card.querySelector('[data-hm2]'); if (b) b.onclick = () => R.startRun(g.id);
      });
    } catch (e) { console.warn('[huntmore]', e); }
  };
})(window.R);
