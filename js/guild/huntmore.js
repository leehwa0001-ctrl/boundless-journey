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
    plainwolf: { name: '原野狼', hp: 140, dmg: 14, speed: 4.6, xp: 18, size: 0.9, ai: 'chase', color: '#7A7468', eye: '#E8A040', desc: '灰褐色的狼，背上一條深色的鞍紋。三四頭一群，會從兩邊包抄。', drop: [['wolfpelt', 1], ['meat', 1]] },
    branchstag: { name: '枝角鹿', hp: 420, dmg: 22, speed: 3.8, xp: 40, size: 1.4, ai: 'charge', color: '#7A5A3A', eye: '#E8C060', desc: '鹿角長得像冬天光禿禿的樹枝，上面還掛著幾片枯葉。低頭衝過來的時候，正面的傷害被鹿角擋掉一半。', drop: [['stagantler', 1], ['meat', 2]] },
    swifthorn: { name: '疾角羚', hp: 120, dmg: 12, speed: 6.2, xp: 22, size: 1.0, ai: 'kite', color: '#C89A5A', eye: '#3A2A1A', flee: 1, desc: '細長的羚羊，跑得比人快得多，一受傷就往遠處逃。', drop: [['swifthornpiece', 1], ['meat', 1]] },
    crageagle: { name: '岩鷲', hp: 110, dmg: 16, speed: 5.2, xp: 24, size: 1.0, ai: 'swoop', fly: 1, color: '#4A3A2A', eye: '#F0C040', desc: '白頭的大鷲，在高處盤旋，看準了就俯衝下來抓人。', drop: [['eaglefeather', 2]] },
    stoneape: { name: '投石猿', hp: 130, dmg: 10, speed: 4.2, xp: 18, size: 0.8, ai: 'kite', shoot: 0.6, color: '#8A8A88', eye: '#C83A2A', desc: '紅臉的山猿，抓起石頭就丟，被追就往後跳。', drop: [['apefur', 1]] },
    bambootiger: { name: '竹影虎', hp: 380, dmg: 26, speed: 5.4, xp: 45, size: 1.3, ai: 'pounce', color: '#9A9A4A', eye: '#E8E05A', desc: '金綠色的虎，身上的直紋像竹子的影子。伏低身子就是要撲過來了。', drop: [['tigerpelt', 1], ['meat', 2]] },
    snowhare: { name: '雪原兔', hp: 40, dmg: 0, speed: 6, xp: 6, size: 0.5, ai: 'kite', flee: 1, harmless: 1, color: '#EEF2F6', eye: '#6AA8E8', desc: '大大的白兔，耳朵很長。不會攻擊人，一看到人就跑。', drop: [['harefur', 1], ['meat', 1]] },
    reedheron: { name: '蘆鷺', hp: 100, dmg: 15, speed: 3.6, xp: 16, size: 0.9, ai: 'charge', color: '#7A8AA0', eye: '#F0D040', desc: '灰藍色的高大水鳥，長喙像槍一樣往前刺。', drop: [['heronplume', 1]] }
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
