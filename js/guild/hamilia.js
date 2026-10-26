// 哈米莉亞級遺跡價值化（2026-10-15 作者《特質與熟練度》第五節＋審查問題 Q46～Q50；報酬、失敗、放棄、重新接取照 Q48 交給 Claude 設計）
// 委託都走公會原本的流程（委託書 → run.task → 回到地面記在手上 → 繳交打五軌成績），只是換掉評分：
// - 保衛（霜溪石窟）：委託人在隨機一層（第 1～7 層）等你；跟著他逛 5～10 分鐘（委託書寫 1～2 小時，Q47），只能在那一層。
//   腳下 7.5 公尺的藍圈（2026-10-19 原本 5 公尺）：走出去先倒數 5 秒，倒數完每秒反饋 −1%；回到圈裡每秒倒數 +1。
//   每 45～75 秒有 40% 冒出 1～5 隻會攻擊委託人的遺跡生物：委託人停下、時間暫停，打完才繼續；牠們打委託人固定 1～2 點，委託人每少 1 點完成度 −1%。
//   委託人倒下＝失敗（「你這樣子也算勇者？」）。時間到：照委託人的目的說一句話（採藥的才說材料採完），可以選「陪委託人回去」或「繼續探索」。效率固定 100%。
// - 搜索（霜溪石窟，每天輪：戒指、小孩的玩具、野餐籃）：放在第 5～7 層隨機一層的房間裡（一定在走得到的地板上、不在擋住的地方），
//   頭上黃色星星、小地圖和 Tab 地圖都有標記；靠近按互動撿起來（不佔背包）。撿到後可以選「回去交給委託人」或「繼續探索」。
// - 救援（任何哈米莉亞級遺跡）：每天第一次打開哈米莉亞級的委託書時 45% 跳出公會的緊急委託；倒下的民眾在第 4～7 層，8 分鐘內找到。
//   有治療藥水：「給予藥水」（反饋 100%）或「簡單包紮」（反饋 70～100%）；沒有就直接包紮。效率看抵達時間（一半時間內 100%，到時限 50%）。
//   救起來以後「陪他回去」或「繼續探索」（沒親自送出去：反饋 −10）。超過時間＝失敗（公會的人接手了）。
// 共同（Claude 的設計，Q48）：
// - 報酬（完成才有，乘「完成度 ÷ 100」）：保衛 180、搜索 120、救援 200 費拉，加在這一趟原本的報酬上；回到城裡自動繳交（不用回櫃台）。
// - 失敗：上面各自的失敗條件、委託沒完成就離開遺跡、在遺跡倒下 → 記為失敗（成績進勇者證、沒有報酬）。
// - 放棄：公會櫃台的「放棄手上的委託」照舊（記為失敗）。
// - 重新接取：每一種每天只能接一次（成功、失敗都算），救援每天最多觸發一次。
// - 越戰越勇不算這些委託（Q50；它只算討伐委託）。
// - 多人連線：目前只有房主那邊有委託人、物品、倒下的民眾（隊友看不到）；同步之後再做。
// 哈米莉亞級（所有哈米莉亞級遺跡）的生成（Q46、Q49）：房間少兩成五、每層多一條往下的樓梯、每層多一個寶箱房、解謎房最多一間（一半機率沒有）、
//   寶箱有機會開出鐵礦、甲殼、魔晶礦（作者說的「藍色素材」：樹枝、藥草、鐵礦、甲殼、魔晶礦）。
// 放在 guildtask.js、pact.js、ranks.js、turnin.js、questboard.js、hunt.js、stairs2.js、puzzle.js、traitlife.js 後面（main.js 前面）。
(function (R) {
  const W = () => R.W, S = () => R.S, $ = id => document.getElementById(id), esc = s => R.esc(s), rnd = Math.random;
  const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1)), pick = a => a[Math.floor(rnd() * a.length)];
  const ID = 'dh-sokkutsu', KINDS = { escort: 1, search: 1, rescue: 1 };
  const PAY = { escort: 180, search: 120, rescue: 200 };
  const ITEMS = { ring: ['戒指', '一個村民委託勇者在深層的地方幫他找一個戒指，那是前些時候和愛人下遺跡時弄丟的，那很重要。'], toy: ['小孩的玩具', '村裡的孩子跟著大人下遺跡，把最喜歡的木頭小馬弄丟了，哭了一整晚。'], basket: ['野餐籃', '一家人在遺跡的淺層野餐，被嚇了一跳，籃子忘在深處了。'] };
  const PURPOSE = {
    gather: ['採藥的村民', ['需要的材料採集完了。']],
    tour: ['想看看遺跡的村民', ['謝謝你，我今天很開心。', '原來遺跡長這樣。']],
    timid: ['膽小的村民', ['謝謝勇者，你真可靠。']],
    elder: ['退休的老獵人', ['辛苦你了，小勇者，之後一起喝一杯。']]
  };
  const ESCORT_T = [300, 600], RESCUE_T = 480, LEASH = 7.5,   /* 2026-10-19 作者：圈半徑 +50%（5→7.5） */ LEASH_CD = 5;
  const isHamiSite = site => !!(site && site.grade === 'hamilia' && site.kind === 'ruin');
  const run = () => W().run, hami = () => { const r = run(); return r && r.task && r.task.hami; };
  const HM = () => { const s = S(); s.hami = s.hami || {}; if (s.hami.day !== s.day) { s.hami = { day: s.day, done: {}, roll: null }; } return s.hami; };
  const searchOf = () => ['ring', 'toy', 'basket'][((S().day || 0) % 3 + 3) % 3];
  let pending = null;

  // ---------- 委託書 ----------
  const ts0 = R.taskSpec;
  R.taskSpec = site => {
    if (!pending || !isHamiSite(site) || (pending.kind !== 'rescue' && site.id !== ID)) return ts0(site);
    const k = pending.kind, it = ITEMS[pending.sub] || ITEMS.ring;
    const L = {
      escort: ['任務分級：F 級（哈米莉亞級・保衛委託，村民委託）', '「一個村民想要到遺跡內探索，但是擔心會受到攻擊，雖然知道哈米莉亞級的生物都很溫馴，但還是有些擔心，所以想委託勇者保護。」', '委託人在第 ' + pending.floor + ' 層等你；跟著他走，不要離開他身邊 5 公尺（藍圈）。', '時間：約 1～2 小時（委託人逛完就結束）；這段時間不能上下樓。', '報酬：' + PAY.escort + ' 費拉（照完成度）。委託人倒下、沒逛完就離開遺跡＝失敗。'],
      search: ['任務分級：F 級（哈米莉亞級・搜索委託）', '「' + it[1] + '」', '找到「' + it[0] + '」：在第 5～7 層的某一處，頭上有黃色的星星。', '時限：10 小時。報酬：' + PAY.search + ' 費拉。沒找到就離開遺跡＝失敗。'],
      rescue: ['任務分級：F 級（公會的緊急委託・救援）', '「公會的緊急委託，在哈米莉亞級的深處，有民眾回報有人昏迷，雖然已經報案，但為了民眾安全，還請勇者前去協助。」', '倒下的民眾在第 ' + pending.floor + ' 層附近。限時 8 分鐘（約 5 小時）。', '報酬：' + PAY.rescue + ' 費拉。超過時間、沒救到就離開遺跡＝失敗。']
    }[k];
    return { kind: k, need: 1, limitH: k === 'search' ? 10 : k === 'rescue' ? 6 : 8, letter: 'F', floors: 7, lines: L, hamiPend: Object.assign({}, pending) };
  };
  // 救援：每天第一次打開哈米莉亞級的委託書，45%
  (R.taskExtras = R.taskExtras || []).push({
    html: (site, sp) => {
      if (!isHamiSite(site) || pending) return '';
      const h = HM(); if (h.roll == null) { h.roll = rnd() < 0.45; R.save && R.save(); }
      if (!h.roll || h.done.rescue || (R.repTier && R.repTier() <= -75)) return '';   // 信譽值太低：公會不派救援（repute.js）
      return '<div class="hm-urgent" style="border:1px solid #E07A5A;border-radius:8px;padding:8px 10px;margin:8px 0;background:rgba(224,122,90,.12)"><b style="color:#F09A7A">公會的緊急委託・救援</b><p class="note" style="margin:4px 0">在哈米莉亞級的深處，有民眾回報有人昏迷。限時 8 分鐘，報酬 ' + PAY.rescue + ' 費拉。</p><button type="button" class="btn" id="hm-rescue">接下緊急委託</button></div>';
    },
    bind: (box, site) => { const b = box && box.querySelector('#hm-rescue'); if (!b) return; b.onclick = () => { pending = { kind: 'rescue', floor: ri(4, 7) }; const no = box.querySelector('#tk-no') || $('tk-no'); if (no) no.click(); else if (R.closeSheet) R.closeSheet(); setTimeout(() => R.startRun(site.id), 80); }; }
  });
  // 公會的委託板：霜溪石窟的保衛、搜索
  const hub0 = R.hub;
  R.hub = (t, f) => {
    hub0(t, f);
    try {
      const body = $('hub-body'), qs = body && body.querySelector('.quests'); if (!qs || qs.querySelector('.hm-card')) return;
      const h = HM(), it = ITEMS[searchOf()];
      const card = document.createElement('div'); card.className = 'quest hm-card'; card.style.setProperty('--c', (R.GRADE_COLOR && R.GRADE_COLOR.hamilia) || '#8AC07A');
      card.innerHTML = '<b>霜溪石窟・村民的委託</b><small>F 級・每一種每天一次</small>'
        + '<button type="button" class="btn pri" data-hm="escort"' + (h.done.escort ? ' disabled' : '') + '>保衛委託（' + PAY.escort + ' 費拉）' + (h.done.escort ? '・今天接過了' : '') + '</button>'
        + '<button type="button" class="btn" data-hm="search"' + (h.done.search ? ' disabled' : '') + '>搜索：' + esc(it[0]) + '（' + PAY.search + ' 費拉）' + (h.done.search ? '・今天接過了' : '') + '</button>';
      qs.insertBefore(card, qs.querySelector('[data-map]') || null);
      card.querySelectorAll('[data-hm]').forEach(b => { b.onclick = () => { const k = b.dataset.hm; pending = k === 'escort' ? { kind: k, floor: ri(1, 7), purpose: pick(Object.keys(PURPOSE)) } : { kind: k, sub: searchOf(), floor: ri(5, 7) }; R.startRun(ID); }; });
    } catch (e) { console.warn('[hamilia]', e); }
  };
  const sr0 = R.startRun;
  R.startRun = id => {
    const r = sr0(id), ru = run();
    try {
      const tk = ru && ru.task;
      if (tk && KINDS[tk.kind] && tk.hamiPend && !tk.hami) {
        const p = tk.hamiPend, mx = Math.max(1, (ru.floors || 8) - 1);
        tk.hami = { kind: p.kind, sub: p.sub, purpose: p.purpose, floor: Math.min(mx, p.floor || 1), fbLoss: 0, t: 0, dur: ri(ESCORT_T[0], ESCORT_T[1]), left: RESCUE_T, hp: 100 };
        HM().done[p.kind] = true; pending = null; R.save && R.save();
      } else if (ru && ru.site) pending = null;
    } catch (e) { console.warn('[hamilia]', e); }
    return r;
  };

  // ---------- 場景裡的東西 ----------
  let obj = null;   // 這一層的委託人／物品／倒下的民眾
  const TH = () => window.THREE;
  const label = (txt, col, size) => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128; const g = c.getContext('2d');
    g.font = 'bold ' + (size || 96) + 'px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 8; g.strokeStyle = '#1A1410'; g.strokeText(txt, 64, 68); g.fillStyle = col; g.fillText(txt, 64, 68);
    const sp = new (TH().Sprite)(new (TH().SpriteMaterial)({ map: new (TH().CanvasTexture)(c), transparent: true, depthWrite: false, fog: false })); sp.scale.set(1.1, 1.1, 1); return sp;
  };
  const okSpot = (x, z) => (!R.isFloor || R.isFloor(x, z)) && !(R.pointBlocked && R.pointBlocked(x, z));
  const farSpot = () => {
    const F = W().F, P = W().P, rooms = (F.rooms || []).filter(r => r.i !== 0 && r.type !== 'puzzle').sort((a, b) => (b.dist || 0) - (a.dist || 0));
    for (const r of rooms.slice(0, 6).concat(rooms)) { for (let i = 0; i < 6; i++) { const p = R.roomPoint ? R.roomPoint(r, { away: P, min: 6 }) : [r.x, r.z]; if (p && okSpot(p[0], p[1])) return p; } }
    const q = R.nearestFloor ? R.nearestFloor(P.x + 6, P.z) : [P.x, P.z]; return q;
  };
  const npcModel = (look, x, z) => { const h = R.makeHero('warrior', null, Object.assign({ lite: 1, weapon: null, shield: false }, look)); h.g.position.set(x, 0, z); W().F.group.add(h.g); return h; };
  const spawnHere = () => {
    obj = null; const ru = run(), hm = hami(); if (!ru || !hm || hm.done || hm.failed || ru.floor !== hm.floor || !W().F || !W().F.group) return;
    const P = W().P;
    if (hm.kind === 'escort') {
      const q = R.openFloorNear ? R.openFloorNear(P.x + 1.5, P.z + 1) : [P.x + 1.5, P.z + 1], h = npcModel({ top: '#7A8A5A', cloak: '#5A4A34', hair: '#4A3A2A' }, q[0], q[1]);
      const ring = new (TH().Mesh)(new (TH().RingGeometry)(LEASH - 0.12, LEASH, 64), new (TH().MeshBasicMaterial)({ color: '#5AA8FF', transparent: true, opacity: 0.55, side: 2, depthWrite: false }));
      ring.rotation.x = -Math.PI / 2; ring.position.set(q[0], 0.06, q[1]); W().F.group.add(ring);
      const tag = label('委', '#9FD8FF', 72); tag.position.set(q[0], 2.3, q[1]); W().F.group.add(tag);
      obj = { kind: 'escort', h, ring, tag, x: q[0], z: q[1], ally: true, dead: false, downed: false, invis: 0, buff: {}, iframe: 0, hp: hm.hp, hpMax: 100, name: PURPOSE[hm.purpose || 'tour'][0], wait: 2, path: null, cd: LEASH_CD, enc: null, nextEnc: ri(45, 75) };
      setTimeout(() => R.banner && R.banner('保衛委託：' + obj.name, '跟著他，不要離開藍圈（7.5 公尺）；你走出圈圈，他會停下來等你。這段時間不能上下樓。'), 1200);
    } else if (hm.kind === 'search' && !hm.got) {
      const p = farSpot(), it = ITEMS[hm.sub] || ITEMS.ring, star = label('★', '#FFE04A'); star.position.set(p[0], 1.4, p[1]); W().F.group.add(star);
      obj = { kind: 'search', star, x: p[0], z: p[1], name: it[0] };
      setTimeout(() => R.toast && R.toast('這一層有「' + it[0] + '」的線索：找黃色的星星（Tab 地圖、小地圖都有）。', '#FFE04A'), 1500);
    } else if (hm.kind === 'rescue' && !hm.saved) {
      const p = farSpot(), h = npcModel({ top: '#8A6A5A', cloak: '#4A3A30', hair: '#2A2420' }, p[0], p[1]); if (R.setDown) R.setDown(h, true);
      const star = label('！', '#FF8A6A'); star.position.set(p[0], 1.6, p[1]); W().F.group.add(star);
      obj = { kind: 'rescue', h, star, x: p[0], z: p[1], name: '倒下的民眾' };
      setTimeout(() => R.banner && R.banner('救援委託', '倒下的民眾就在這一層：找紅色的「！」。'), 1200);
    }
  };
  R.hamiDebug = { obj: () => obj, encounter: () => obj && encounter(), pending: () => pending };   // 測試用
  const lf0 = R.loadFloor;
  R.loadFloor = (f, o) => { const r = lf0(f, o); try { spawnHere(); } catch (e) { console.warn('[hamilia]', e); } return r; };

  // ---------- 保衛：遺跡生物打委託人 ----------
  const pt0 = R.pickTarget;
  R.pickTarget = e => (e && e._hmTg && obj && obj.kind === 'escort' && obj.hp > 0 ? obj : pt0(e));
  const ha0 = R.hurtAlly;
  R.hurtAlly = (a, raw, src) => {
    if (!obj || a !== obj) return ha0(a, raw, src);
    if (obj.iframe > 0 || obj.hp <= 0) return;
    const d = rnd() < 0.5 ? 1 : 2; obj.hp = Math.max(0, obj.hp - d); obj.iframe = 0.6; const hm = hami(); if (hm) hm.hp = obj.hp;
    R.num && R.num(obj.x, 2, obj.z, '-' + d, 'hurt');
  };
  const encounter = () => {
    const ru = run(), n = ri(1, 5), list = [];
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, q = R.openFloorNear ? R.openFloorNear(obj.x + Math.sin(a) * 6, obj.z + Math.cos(a) * 6, obj) : [obj.x + 3, obj.z];
      const id = R.pickEnemyId ? R.pickEnemyId(ru.grade.pool, ru) : (ru.grade.pool || [])[0]; if (!id || !q) continue;
      const room = R.roomIndexAt ? R.roomIndexAt(q[0], q[1]) : -1, e = R.spawnEnemy(id, q[0], q[1], room, { aggro: true });
      if (e) { e.aggro = true; e.provoked = true; e.dormant = false; e._hmTg = 1; list.push(e); }
    }
    if (list.length) { obj.enc = list; R.banner && R.banner('有遺跡生物衝著委託人來了！', '委託人停下來了（時間暫停）──把牠們打倒。'); }
  };
  const moveNpc = (o, dt) => {
    if (o.wait > 0) { o.wait -= dt; if (R.animHero) R.animHero(o.h, 0, dt, false); return; }
    if (!o.path || !o.path.length) {
      const F = W().F, rooms = (F.rooms || []).filter(r => r.type !== 'puzzle'), r = pick(rooms), p = R.roomPoint ? R.roomPoint(r, {}) : [r.x, r.z];
      o.path = (R.summonPath && R.summonPath(o.x, o.z, p[0], p[1])) || [{ x: p[0], z: p[1] }];
    }
    const g = o.path[0], dx = g.x - o.x, dz = g.z - o.z, d = Math.hypot(dx, dz);
    if (d < 0.4) { o.path.shift(); if (!o.path.length) o.wait = 2 + rnd() * 4; return; }
    const sp = Math.min(6, d / dt);   /* 2026-10-19 作者：委託人走快一倍（3→6） */ o.x += dx / d * sp * dt; o.z += dz / d * sp * dt;
    o.h.g.rotation.y = Math.atan2(dx, dz); if (R.animHero) R.animHero(o.h, sp, dt, false);
  };
  const finishEscort = () => {
    const hm = hami(), P = PURPOSE[hm.purpose || 'tour'], line = pick(P[1]); hm.done = true; hm.ok = true;
    R.sheet('<p class="kicker">保衛委託</p><h2>' + esc(P[0]) + '</h2><p>「' + esc(line) + '」</p><p class="note">委託完成。回到城裡會自動繳交。</p>',
      '<div class="row"><button type="button" class="btn pri" id="hm-back">陪委託人回去</button><button type="button" class="btn" id="hm-stay">繼續探索</button></div>');
    $('hm-back').onclick = () => { R.closeSheet(); hm.back = 1; leave(); };
    $('hm-stay').onclick = () => { R.closeSheet(); goneNpc(); R.toast && R.toast('委託人自己沿著來的路回去了。', '#9FD8FF'); };
  };
  const goneNpc = () => { if (!obj) return; ['h', 'ring', 'tag', 'star'].forEach(k => { const m = obj[k]; const g = m && (m.g || m); if (g && g.parent) g.parent.remove(g); }); obj = null; };
  const leave = () => { R.setReturnDest && R.setReturnDest('guild'); R.extract('exit'); };

  // ---------- 每一幀 ----------
  const st0 = R.step;
  R.step = dt => {
    st0(dt);
    try {
      const ru = run(), hm = hami(), P = W().P; if (!ru || ru.done || !hm || !P || W().paused) return;
      if (hm.kind === 'rescue' && !hm.saved && !hm.failed) { hm.left -= dt; if (hm.left <= 0) { hm.failed = true; goneNpc(); R.banner && R.banner('救援委託：失敗', '時間到了。公會的人先一步把民眾接走了。'); } }
      if (obj && obj.kind === 'escort' && !hm.done && !hm.failed) {
        const o = obj; o.iframe = Math.max(0, o.iframe - dt);
        if (o.enc) { if (o.enc.every(e => e.dead)) { o.enc = null; R.toast && R.toast('危機解除，委託人鬆了一口氣。', '#9AE07A'); } if (R.animHero) R.animHero(o.h, 0, dt, false); }
        else { hm.t += dt; o.nextEnc -= dt; if (o.nextEnc <= 0) { o.nextEnc = ri(45, 75); if (rnd() < 0.4) encounter(); } if (!o.enc) { if (Math.hypot(P.x - o.x, P.z - o.z) <= LEASH) moveNpc(o, dt); else if (R.animHero) R.animHero(o.h, 0, dt, false); } }   /* 2026-10-19 作者：你離開圈圈，委託人就停下來等你 */
        o.h.g.position.set(o.x, 0, o.z); o.ring.position.set(o.x, 0.06, o.z); o.tag.position.set(o.x, 2.3, o.z);
        const d = Math.hypot(P.x - o.x, P.z - o.z);
        if (d > LEASH) { o.cd = Math.max(0, o.cd - dt); if (o.cd <= 0) hm.fbLoss += dt; } else o.cd = Math.min(LEASH_CD, o.cd + dt);
        o.ring.material.color.set(d > LEASH ? '#FF7A5A' : '#5AA8FF');
        if (o.hp <= 0) { hm.failed = true; R.banner && R.banner('「你這樣子也算勇者？」', '委託人倒下了……保衛委託失敗。'); goneNpc(); }
        else if (hm.t >= hm.dur) finishEscort();
      }
      if (obj && obj.star) obj.star.position.y = (obj.kind === 'search' ? 1.4 : 1.6) + Math.sin(performance.now() / 300) * 0.12;
      // HUD
      const el = $('r-task'); if (el) {
        const txt = hm.kind === 'escort' ? (hm.failed ? '保衛：失敗' : hm.done ? '保衛：完成' : ru.floor !== hm.floor ? '保衛：委託人在第 ' + hm.floor + ' 層' : '保衛 <b>' + Math.max(0, Math.ceil((hm.dur - hm.t) / 60)) + ' 分</b>・委託人 <b>' + Math.round(obj ? obj.hp : hm.hp) + '</b>' + (obj && obj.enc ? '・<b style="color:#FF8A6A">遇襲</b>' : '') + (obj && obj.cd < LEASH_CD ? '・<b style="color:#FF8A6A">回到圈裡 ' + Math.ceil(obj.cd) + '</b>' : ''))
          : hm.kind === 'search' ? (hm.got ? '搜索：找到了' : '搜索「' + esc((ITEMS[hm.sub] || ITEMS.ring)[0]) + '」・第 ' + hm.floor + ' 層')
          : (hm.failed ? '救援：失敗' : hm.saved ? '救援：完成' : '救援・第 ' + hm.floor + ' 層・剩 <b>' + Math.max(0, Math.ceil(hm.left)) + '</b> 秒');
        const html = '<span>委託 ' + txt + '</span>'; if (el.innerHTML !== html) el.innerHTML = html;   // guildtask.js 每一格會蓋掉，這裡再蓋回來
      }
    } catch (e) { console.warn('[hamilia]', e); }
  };
  // 保衛中不能上下樓
  const blocked = () => { const hm = hami(); return !!(hm && hm.kind === 'escort' && !hm.done && !hm.failed && obj && obj.kind === 'escort'); };
  const de0 = R.descend; R.descend = (...a) => { if (blocked()) { R.toast && R.toast('保衛委託：委託人還在這一層，不能離開。', '#FFB45A'); return; } return de0(...a); };
  const as0 = R.ascend; R.ascend = (...a) => { if (blocked()) { R.toast && R.toast('保衛委託：委託人還在這一層，不能離開。', '#FFB45A'); return; } return as0(...a); };

  // ---------- 互動：撿東西、救人 ----------
  const ni0 = R.nearestInteract;
  R.nearestInteract = (...a) => {
    const best = ni0(...a), P = W().P, hm = hami(); if (!obj || !P || !hm) return best;
    const d = Math.hypot(P.x - obj.x, P.z - obj.z);
    if (obj.kind === 'search' && d < 1.8) return { x: obj.x, z: obj.z, r: 1.8, label: '撿起「' + obj.name + '」', act: () => {
      hm.got = true; hm.ok = true; hm.done = true; goneNpc(); R.sfx && R.sfx('pick');
      R.sheet('<p class="kicker">搜索委託</p><h2>找到了</h2><p>是委託人說的那個沒錯。（任務道具，不佔背包）</p>', '<div class="row"><button type="button" class="btn pri" id="hm-back">回去交給委託人</button><button type="button" class="btn" id="hm-stay">繼續探索</button></div>');
      $('hm-back').onclick = () => { R.closeSheet(); leave(); }; $('hm-stay').onclick = () => R.closeSheet();
    } };
    if (obj.kind === 'rescue' && d < 1.8 && !hm.saved && !hm.failed) return { x: obj.x, z: obj.z, r: 1.8, label: '救援倒下的民眾', act: () => rescue(hm) };
    return best;
  };
  const hpPot = () => { const p = S().potions || {}; return Object.keys(p).find(k => /^hp/.test(k) && p[k] > 0); };
  const rescue = hm => {
    hm.found = RESCUE_T - hm.left;
    const done = (fb, how) => {
      hm.saved = true; hm.ok = true; hm.done = true; hm.fb = fb; if (R.repAdd) R.repAdd(3);   // 信譽值 +3 if (obj && obj.h && R.setDown) R.setDown(obj.h, false); if (obj && obj.star && obj.star.parent) obj.star.parent.remove(obj.star);
      R.sheet('<p class="kicker">救援委託</p><h2>' + esc(how) + '</h2><p>民眾慢慢睜開眼睛：「……謝、謝謝你。」</p>', '<div class="row"><button type="button" class="btn pri" id="hm-back">陪他回去</button><button type="button" class="btn" id="hm-stay">繼續探索（公會的人會來接他）</button></div>');
      $('hm-back').onclick = () => { R.closeSheet(); hm.back = 1; leave(); };
      $('hm-stay').onclick = () => { R.closeSheet(); hm.fb = Math.max(1, hm.fb - 10); goneNpc(); };
    };
    const k = hpPot();
    if (!k) { done(ri(70, 100), '簡單包紮'); return; }
    R.sheet('<p class="kicker">救援委託</p><h2>倒下的民眾</h2><p>呼吸很淺，額頭有傷。要怎麼處理？</p>', '<div class="row"><button type="button" class="btn pri" id="hm-pot">給予藥水</button><button type="button" class="btn" id="hm-band">簡單包紮</button></div>');
    $('hm-pot').onclick = () => { S().potions[k]--; R.closeSheet(); done(100, '給了一瓶治療藥水'); };
    $('hm-band').onclick = () => { R.closeSheet(); done(ri(70, 100), '簡單包紮'); };
  };

  // ---------- 地圖上的標記 ----------
  const cd0 = R.coopDraw;
  R.coopDraw = (g, pt, sz, font) => {
    if (cd0) cd0(g, pt, sz, font);
    try { if (!obj || !run()) return; const [x, y] = pt(obj.x, obj.z); g.save(); g.font = font || 'bold 12px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = obj.kind === 'search' ? '#FFE04A' : obj.kind === 'rescue' ? '#FF8A6A' : '#9FD8FF'; g.fillText(obj.kind === 'search' ? '★' : obj.kind === 'rescue' ? '！' : '委', x, y); g.restore(); } catch (e) { }
  };
  const mm0 = R.drawMinimap;
  if (mm0) R.drawMinimap = (...a) => {
    const r = mm0(...a);
    try {
      const cv = $('r-map'), P = W().P, cam = W().cam; if (!obj || !cv || !P || !cam || (R.coopMates && R.coopMates().length)) return r;   // 有連線隊友時 coopmap.js 會呼叫 R.coopDraw
      const g = cv.getContext('2d'), s = cv.width, yaw = cam.yaw, pt = (wx, wz) => { const dx = (wx - P.x) / 1.3, dz = (wz - P.z) / 1.3; let x = s / 2 + dx * Math.cos(yaw) - dz * Math.sin(yaw), y = s / 2 + dx * Math.sin(yaw) + dz * Math.cos(yaw); x = Math.max(8, Math.min(s - 8, x)); y = Math.max(8, Math.min(s - 8, y)); return [x, y]; };
      R.coopDraw(g, pt, 6, 'bold 13px sans-serif');
    } catch (e) { }
    return r;
  };

  // ---------- 結算：成績、報酬 ----------
  const result = hm => {
    const ok = !!(hm.ok && !hm.failed), comp = !ok ? 1 : hm.kind === 'escort' ? Math.max(1, Math.round(hm.hp)) : 100;
    const eff = hm.kind === 'escort' ? 100 : hm.kind === 'rescue' ? (ok ? Math.max(50, Math.round(100 - 50 * Math.max(0, (hm.found || 0) - RESCUE_T / 2) / (RESCUE_T / 2))) : 1) : null;
    const fb = hm.kind === 'escort' ? Math.max(1, Math.round(100 - hm.fbLoss)) : hm.kind === 'rescue' && ok ? hm.fb : null;
    return { ok, comp, eff, fb, pay: ok ? Math.round(PAY[hm.kind] * comp / 100) : 0 };
  };
  const LBL = { escort: '保衛委託', search: '搜索委託', rescue: '救援委託' };
  const patch = (t, hm) => {
    if (!t || !hm || t.hamiTag) return; const rs = result(hm); t.hamiTag = 1;
    t.site = (t.site || '') + '・' + LBL[hm.kind] + (hm.kind === 'search' ? '（' + (ITEMS[hm.sub] || ITEMS.ring)[0] + '）' : '');
    t.s[0] = rs.comp; if (rs.eff != null) t.s[1] = rs.eff; if (rs.fb != null) t.hamiFb = rs.fb;
    if (!rs.ok) t.failed = true;
  };
  const ex0 = R.extract;
  R.extract = how => {
    const ru = run(), hm = hami(), s = S(); if (!ru || ru.done || !hm) return ex0(how);
    const r = ex0(how);
    try {
      const h = s.heldTask;
      if (h && h.siteId === ru.site.id && !h.hami) {
        h.hami = Object.assign({}, hm); const rs = result(hm);
        if (!rs.ok) { setTimeout(() => R.toast && R.toast(LBL[hm.kind] + '沒有完成就離開了遺跡：記為失敗。', '#FF9A6A'), 1800); const t0 = (s.tasks || []).length; R.dropHeldTask(); patch(s.tasks[t0], hm); }
        else h.pay = (h.pay || 0) + rs.pay;
        R.save && R.save();
      }
    } catch (e) { console.warn('[hamilia]', e); }
    return r;
  };
  const pd0 = R.onPlayerDown;
  R.onPlayerDown = (...a) => { const hm = hami(), s = S(), n0 = (s && s.tasks || []).length, r = pd0(...a); try { if (hm && s.tasks && s.tasks.length > n0) { hm.failed = true; patch(s.tasks[s.tasks.length - 1], hm); R.save && R.save(); } } catch (e) { } return r; };
  const ti0 = R.turnInTask;
  R.turnInTask = (...a) => { const s = S(), h = s && s.heldTask, hm = h && h.hami, t = ti0(...a); try { if (hm && t) { patch(t, hm); R.save && R.save(); } } catch (e) { } return t; };
  // 回到城裡自動繳交
  const en0 = R.enterTownNow;
  if (en0) R.enterTownNow = (...a) => {
    const r = en0(...a);
    try { const s = S(), h = s && s.heldTask; if (h && h.hami && result(h.hami).ok) { const pay = h.pay || 0, t = R.turnInTask(); if (t) setTimeout(() => R.banner && R.banner(LBL[h.hami.kind] + '完成', '公會轉交了報酬：' + pay + ' 費拉。成績明天登錄到勇者證。'), 1500); } } catch (e) { console.warn('[hamilia]', e); }
    return r;
  };
  const hl0 = R.heldLine;
  R.heldLine = h => (h && h.hami ? LBL[h.hami.kind] + (result(h.hami).ok ? '：完成，等你繳交' : '：沒有完成') : hl0(h));
  // 反饋：保衛照出圈的時間扣、救援照處理方式（traitlife.js 的 R.traitTaskAxes 在打反饋的時候呼叫）
  const ta0 = R.traitTaskAxes;
  R.traitTaskAxes = (s, t) => { let o = s; if (t && t.hamiFb != null && s && s[4] != null) { o = s.slice(); o[4] = t.hamiFb; } return ta0 ? ta0(o, t) : o; };

  // ---------- 哈米莉亞級的生成（Q46、Q49） ----------
  const isHami = ru => !!(ru && ru.grade && ru.grade.id === 'hamilia' && ru.site && ru.site.kind === 'ruin');
  const rpf0 = R.roomsPerFloor;
  if (rpf0) R.roomsPerFloor = (ru, f) => { const n = rpf0(ru, f); return isHami(ru) ? Math.max(5, Math.round(n * 0.75)) : n; };
  const gf0 = R.genFloor;
  R.genFloor = (ru, f) => {
    const F = gf0(ru, f);
    try {
      if (!isHami(ru) || !F || !F.rooms) return F;
      const rooms = F.rooms, linkN = r => Object.keys(r.links || {}).length;
      // 解謎房最多一間（一半沒有）
      const pz = rooms.filter(r => r.type === 'puzzle'), keep = rnd() < 0.5 ? 1 : 0;
      pz.slice(keep).forEach(r => { r.type = 'fight'; delete r.puzzle; r.cleared = false; });
      // 多一個寶箱房
      const c1 = rooms.filter(r => r.type === 'fight' && r.i !== 0 && (r.dist || 0) >= 2).sort((a, b) => linkN(a) - linkN(b) || (b.dist || 0) - (a.dist || 0))[0];
      if (c1) c1.type = 'chest';
      // 多一條往下的樓梯（最後一層沒有樓梯）
      if (!F.last && f < ru.floors - 1) {
        const st = rooms.filter(r => r.type === 'stairs'), near = r => st.some(s2 => s2 === r || Object.values(s2.links || {}).includes(r.i));
        const c2 = rooms.filter(r => r.type === 'fight' && r.i !== 0 && (r.dist || 0) >= 2 && !near(r)).sort((a, b) => (b.dist || 0) - (a.dist || 0))[0];
        if (c2) { c2.type = 'stairs'; c2.alt = 1; }
      }
    } catch (e) { console.warn('[hamilia]', e); }
    return F;
  };
  const rc0 = R.rollChest;
  R.rollChest = (g, floor, cls, tier) => { const out = rc0(g, floor, cls, tier); try { if (g === 0 && rnd() < 0.35) out.push({ mat: pick(['iron', 'shell', 'manaore']), n: ri(1, 2) }); } catch (e) { } return out; };
})(window.R);
