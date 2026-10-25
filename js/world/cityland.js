// 內陸、北州的城（2026-10-26 作者：各城不要換皮）
// - 府廳：戰爭公園的越野障礙賽（真的跑：跳、滑過鐵絲網）。照成績拿軍功章，軍部旁的軍需處換府廳軍規的裝備、野戰藥包。
// - 板北：英尼爾斯製藥廠調藥劑（用素材調；藥劑是第二格加成，跟吃的分開算，撐三天）。地下賭場＝骰寶。
// - 板南：通天道一千階（真的爬：左右腳照節奏踩）。爬到頂蓋仰天寺的朱印。妖物寺：供奉遺跡生物的素材，換住持加持過的護符。
// - 古森：植樹場有你自己的六塊地：種下樹苗，過幾天長大，砍下來是古森木材（貨物）；自然保護協會看你種了多少給委託。
// 放在 citylife.js 後面。
(function (R) {
  const S = () => R.S, W = R.W, esc = s => R.esc(s), $ = id => document.getElementById(id), rnd = Math.random;
  const C2 = () => R.city2(), ok = (t, c) => { R.sfx && R.sfx('coin'); R.toast(t, c || '#E8C04A'); };
  const pay = n => { const s = S(); if (s.gold < n) { R.toast('錢不夠（要 ' + n + ' 費拉）。', '#FF9A6A'); return false; } s.gold -= n; return true; };
  const lvNow = () => { const s = S(); return Math.max(1, ((s.classes || {})[s.cls] || {}).lv || 1); };
  const mats = () => { const s = S(); s.mats = s.mats || {}; return s.mats; };
  const matName = k => (R.MATS[k] || {}).name || k;

  // ---------- 藥劑：第二格加成（三天） ----------
  const cp = R.calcPlayer;
  R.calcPlayer = cls => {
    const P = cp(cls), s = S(), t = s && s.tonic; if (!t || !W.run || t.until < s.day) return P;
    const b = t.b; if (b.hp) P.hpMax = Math.round(P.hpMax * (1 + b.hp)); if (b.mp) P.mpMax = Math.round(P.mpMax * (1 + b.mp)); if (b.dmg) P.dmgMult *= 1 + b.dmg; if (b.skillCd) P.skillCdMult *= 1 - b.skillCd; if (b.regen) P.regen += b.regen;
    return P;
  };
  const tonicText = b => [b.hp && '生命 +' + Math.round(b.hp * 100) + '%', b.mp && '魔力 +' + Math.round(b.mp * 100) + '%', b.dmg && '傷害 +' + Math.round(b.dmg * 100) + '%', b.skillCd && '技能冷卻 −' + Math.round(b.skillCd * 100) + '%', b.regen && '回血 +' + b.regen].filter(Boolean).join('、');
  const drink = (name, b, days) => { const s = S(); s.tonic = { name, b, until: (s.day || 0) + (days || 3) - 1 }; R.save(); };

  // ================= 府廳：越野障礙賽、軍需處 =================
  const medal = () => C2().medal || 0;
  const course = city => {
    const s = S(), FEE = 10;
    R.sheet('<p class="kicker">府廳・戰爭公園</p><h2>越野障礙賽</h2><p class="note">新兵每天跑的那條。跳過矮牆和彈坑（空白鍵／↑），滑過鐵絲網（↓）。撞到會慢下來；跑完 60 秒照距離給軍功章。報名費 ' + FEE + ' 費拉。</p>'
      + '<canvas id="oc-cv" width="420" height="200" class="fs-cv"></canvas><p class="note" id="oc-msg">按「開跑」。</p>',
      '<div class="row"><button type="button" class="btn pri" id="oc-go">開跑</button><button type="button" class="btn" id="oc-j">跳（↑）</button><button type="button" class="btn" id="oc-s">滑（↓）</button><button type="button" class="btn" id="oc-x">離開</button></div>');
    const cv = $('oc-cv'), x = cv.getContext('2d'), msg = t => { const m = $('oc-msg'); if (m) m.textContent = t; };
    let run = false, t = 0, dist = 0, sp = 0, y = 0, vy = 0, slide = 0, hits = 0, obs = [], nextO = 1.2, raf = 0, last = 0, hitT = 0;
    const G = 150;
    const draw = () => {
      x.fillStyle = '#8AA8B8'; x.fillRect(0, 0, 420, 200); x.fillStyle = '#5A6A4A'; x.fillRect(0, G, 420, 50);
      for (let i = 0; i < 8; i++) { const fx = ((i * 70 - dist * 8) % 560 + 560) % 560 - 70; x.fillStyle = '#4A5A3A'; x.fillRect(fx, G - 30, 4, 30); }
      obs.forEach(o => { const ox = 80 + (o.x - dist) * 30; if (o.k === 'wall') { x.fillStyle = '#7A6A5A'; x.fillRect(ox, G - 22, 16, 22); } else if (o.k === 'pit') { x.fillStyle = '#2A2018'; x.fillRect(ox, G, 30, 10); } else { x.strokeStyle = '#CCC'; x.lineWidth = 2; x.beginPath(); for (let k = 0; k < 6; k++) { x.moveTo(ox + k * 6, G - 34); x.lineTo(ox + k * 6 + 6, G - 26); } x.stroke(); x.fillStyle = '#555'; x.fillRect(ox, G - 34, 2, 34); x.fillRect(ox + 34, G - 34, 2, 34); } });
      const h = slide > 0 ? 12 : 26; x.fillStyle = hitT > 0 ? '#FF7A5A' : '#3A4A6A'; x.fillRect(70, G - h - y, 14, h); x.fillStyle = '#E8C8A0'; x.fillRect(72, G - h - y - 8, 10, 8);
      x.fillStyle = '#FFF'; x.font = '12px sans-serif'; x.fillText('時間 ' + Math.max(0, 60 - t).toFixed(1) + '　距離 ' + Math.round(dist * 10) + 'm　撞到 ' + hits, 8, 16);
    };
    const end = () => {
      run = false; cancelAnimationFrame(raf); const m = Math.round(dist * 10), rk = m >= 1500 ? 'S' : m >= 1200 ? 'A' : m >= 900 ? 'B' : 'C', got = { S: 3, A: 2, B: 1, C: 0 }[rk], c = C2();
      c.medal = (c.medal || 0) + got; c.ocBest = Math.max(c.ocBest || 0, m); if (rk === 'S' || rk === 'A') c.ocDay = s.day; if (got) R.cityRep('futing', 1); R.save();
      msg('跑完了：' + m + ' 公尺，評價 ' + rk + (got ? '，軍功章 +' + got + '（現在 ' + c.medal + ' 枚）' : '（沒有軍功章）') + '・最佳 ' + c.ocBest + ' 公尺');
      $('oc-go').disabled = false; $('oc-go').textContent = '再跑一次（' + FEE + ' 費拉）';
    };
    const step = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (!$('oc-cv')) { off(); return; }
      if (run) {
        t += dt; sp = Math.min(9, sp + dt * 0.9); hitT -= dt; slide -= dt;
        dist += sp * dt; vy -= 900 * dt; y = Math.max(0, y + vy * dt); if (y === 0) vy = 0;
        nextO -= dt; if (nextO <= 0) { nextO = 0.9 + rnd() * 1.2 - Math.min(0.5, t / 120); obs.push({ x: dist + 13, k: ['wall', 'pit', 'wire'][Math.floor(rnd() * 3)] }); }
        obs.forEach(o => { const ox = 80 + (o.x - dist) * 30; if (!o.hit && ox < 84 && ox > 56) { const bad = o.k === 'wire' ? slide <= 0 : y < 18; if (bad) { o.hit = 1; hits++; hitT = 0.4; sp *= 0.4; R.sfx && R.sfx('hurt'); } } });
        obs = obs.filter(o => o.x > dist - 4);
        if (t >= 60) end();
      }
      draw(); raf = requestAnimationFrame(step);
    };
    const jump = () => { if (run && y === 0) vy = 330; }, duck = () => { if (run) slide = 0.6; };
    const kd = e => { if (['Space', 'ArrowUp', 'KeyW'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); jump(); } else if (['ArrowDown', 'KeyS'].includes(e.code)) { e.preventDefault(); e.stopPropagation(); duck(); } };
    const off = () => { cancelAnimationFrame(raf); removeEventListener('keydown', kd, true); };
    addEventListener('keydown', kd, true);
    $('oc-j').onclick = jump; $('oc-s').onclick = duck;
    $('oc-go').onclick = () => { if (run || !pay(FEE)) return; R.save(); run = true; t = 0; dist = 0; sp = 3; y = 0; vy = 0; hits = 0; obs = []; nextO = 1.2; $('oc-go').disabled = true; msg('跑！'); };
    $('oc-x').onclick = () => { off(); R.closeSheet(); };
    last = performance.now(); raf = requestAnimationFrame(step);
  };
  R.CITY_ACT.futing = course;
  R.CITY_FAC['futing:park'] = course;
  // 軍需處：軍功章換東西
  const SHOP = [
    ['armor', '府廳軍規護具（隨機部位、史詩）', 8], ['weapon', '府廳軍規武器（隨機、史詩）', 10], ['armor4', '府廳軍規護具（傳說）', 24],
    ['tonic', '野戰藥包（藥劑：生命 +10%、傷害 +5%，三天）', 3], ['ration', '軍用口糧 2 箱（貨物）', 1]
  ];
  const quarter = city => {
    const c = C2();
    R.sheet('<p class="kicker">府廳・軍部正面</p><h2>軍需處</h2><p>「軍功章帶來了嗎？分會特劃區的勇者，我們照新兵的規矩換。」你有 <b>' + medal() + '</b> 枚軍功章（戰爭公園的越野障礙賽拿）。</p>'
      + SHOP.map(([k, n, p]) => '<button type="button" class="btn" data-mq="' + k + '"' + (medal() < p ? ' disabled' : '') + '><b>' + esc(n) + '</b><br><small>' + p + ' 枚</small></button>').join(''),
      '<div class="row"><button type="button" class="btn pri" id="mq-x">好了</button></div>');
    $('mq-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-mq]').forEach(b => { b.onclick = () => {
      const [k, n, p] = SHOP.find(q => q[0] === b.dataset.mq); if (medal() < p) return;
      let it = null;
      if (k === 'armor' || k === 'armor4' || k === 'weapon') { const kind = k === 'weapon' ? 'weapon' : 'armor', pool = Object.keys(kind === 'weapon' ? R.WEAPONS : R.ARMOR); it = R.makeItem({ kind, base: pool[Math.floor(rnd() * pool.length)], ilvl: lvNow(), rarity: k === 'armor4' ? 4 : 3, identified: true }); if (!it) return; it.mil = 1; if (!(R.giveItem && R.giveItem(it))) S().stash.push(it); /* 背包放不下就放倉庫 */ }
      else if (k === 'tonic') drink('野戰藥包', { hp: 0.1, dmg: 0.05 });
      else if (k === 'ration') { const cc = C2(); cc.cargo.ration = (cc.cargo.ration || 0) + 2; }
      c.medal -= p; R.save(); ok('換到了：' + (it ? R.itemName(it) : n)); quarter(city);
    }; });
  };
  R.CITY_FAC['futing:hq'] = quarter;
  const nm0 = R.itemName; if (nm0) R.itemName = it => (it && it.mil ? '府廳軍規・' : '') + nm0(it);
  R.cityQuestReg('futing', [
    R.cqCargo('ft_med', 'medicine', 4, 340, '軍醫院的補給', '演習的傷兵多，軍醫院要 4 箱英尼爾斯藥品。'),
    R.cqCargo('ft_steel', 'steel', 4, 300, '靶場的新靶', '靶場要換鋼靶，4 箱征遠鋼材。'),
    R.cqCargo('ft_fish', 'fishdry', 5, 200, '軍營的伙房', '伙房要 5 箱銀旗魚乾。'),
    { k: 'ft_oc', name: '跟新兵跑一趟', desc: '今天在戰爭公園的越野障礙賽跑出 A 以上。', pay: 120, need: () => [C2().ocDay === S().day ? 1 : 0, 1], take: () => { } }
  ]);

  // ================= 板北：製藥廠、地下賭場 =================
  // [名字, 素材, 加成]
  const RX = [
    ['鐵壁劑', { herb: 3, shell: 2 }, { hp: 0.12 }], ['靈泉劑', { herb: 2, crystal: 1 }, { mp: 0.12, regen: 0.2 }],
    ['狂血劑', { herb: 2, core: 1 }, { dmg: 0.08 }], ['迅風劑', { crystal: 2, shell: 1 }, { skillCd: 0.08 }],
    ['萬全劑', { herb: 4, crystal: 2, core: 1 }, { hp: 0.08, mp: 0.08, dmg: 0.05 }]
  ];
  const pharma = city => {
    const s = S(), M = mats(), t = s.tonic && s.tonic.until >= s.day ? s.tonic : null;
    R.sheet('<p class="kicker">板北・英尼爾斯製藥廠</p><h2>調藥室</h2><p>「素材帶來，我們的藥劑師幫你調。一次只喝得下一瓶——喝了撐三天，跟吃的東西分開算。」調製費 30 費拉。</p>'
      + (t ? '<p class="note">現在喝著：<b>' + esc(t.name) + '</b>（' + tonicText(t.b) + '，到第 ' + t.until + ' 天）。再喝會換掉。</p>' : '')
      + RX.map((r, i) => { const can = Object.keys(r[1]).every(k => (M[k] || 0) >= r[1][k]); return '<button type="button" class="btn" data-rx="' + i + '"' + (can && s.gold >= 30 ? '' : ' disabled') + '><b>' + esc(r[0]) + '</b>：' + tonicText(r[2]) + '<br><small>' + Object.keys(r[1]).map(k => matName(k) + ' ' + (M[k] || 0) + '／' + r[1][k]).join('、') + '</small></button>'; }).join(''),
      '<div class="row"><button type="button" class="btn pri" id="rx-x">好了</button></div>');
    $('rx-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-rx]').forEach(b => { b.onclick = () => { const r = RX[+b.dataset.rx]; if (!Object.keys(r[1]).every(k => (M[k] || 0) >= r[1][k]) || !pay(30)) return; Object.keys(r[1]).forEach(k => { M[k] -= r[1][k]; }); drink(r[0], r[2]); R.cityRep('banbei', 1); C2().rxDay = s.day; R.save(); ok('喝下' + r[0] + '：' + tonicText(r[2]) + '（三天）'); pharma(city); }; });
  };
  R.CITY_FAC['banbei:pharma'] = pharma;
  if (R.sicbo) R.CITY_ACT.banbei = R.CITY_FAC['banbei:casino'] = () => R.sicbo('板北・地下賭場');
  R.cityQuestReg('banbei', [
    R.cqCargo('bb_tea', 'tea', 4, 240, '港灣酒店的下午茶', '酒店的外國客人要喝昭旭茶，4 箱古森茶。'),
    R.cqCargo('bb_spice', 'spice', 4, 300, '夜店街的新菜單', '夜店的廚師要 4 箱德克斯凡香料。'),
    R.cqCargo('bb_salv', 'salvage', 1, 200, '朝日科技的拆解', '朝日科技要一件沉船古物拆開研究。'),
    R.cqMat('bb_herb', 'herb', 6, 110, '製藥廠的原料', '製藥廠缺藥草，交 6 份。'),
    { k: 'bb_rx', name: '藥劑試飲', desc: '今天在製藥廠調一瓶藥劑喝下去，告訴他們效果。', pay: 80, need: () => [C2().rxDay === S().day ? 1 : 0, 1], take: () => { } }
  ]);

  // ================= 板南：通天道、妖物寺 =================
  const stairs = city => {
    const s = S(), c = C2();
    R.sheet('<p class="kicker">板南・通天道</p><h2>通天道一千階</h2><p class="note">左右腳輪流踩（← → 或 A D）。照著石階上的燈踩，踩錯會滑一下。60 秒內爬到頂，就能在仰天寺蓋朱印。</p>'
      + '<canvas id="st-cv" width="360" height="220" class="fs-cv"></canvas><p class="note" id="st-msg">按「開始爬」。</p>',
      '<div class="row"><button type="button" class="btn pri" id="st-go">開始爬</button><button type="button" class="btn" id="st-l">左腳 ←</button><button type="button" class="btn" id="st-r">右腳 →</button><button type="button" class="btn" id="st-x">離開</button></div>');
    const cv = $('st-cv'), x = cv.getContext('2d'), msg = t => { const m = $('st-msg'); if (m) m.textContent = t; };
    let on = false, t = 0, step = 0, want = 'l', slip = 0, combo = 0, raf = 0, last = 0;
    const GOAL = 1000;
    const draw = () => {
      x.fillStyle = '#2A3A4A'; x.fillRect(0, 0, 360, 220);
      for (let i = 0; i < 9; i++) { const y = 200 - i * 22, w = 220 - i * 16; x.fillStyle = i % 2 ? '#7A7468' : '#8A8478'; x.fillRect(180 - w / 2, y, w, 18); }
      x.fillStyle = '#C8302A'; x.fillRect(160, 8, 40, 6); x.fillRect(166, 8, 4, 22); x.fillRect(190, 8, 4, 22);   // 頂上的鳥居
      x.fillStyle = want === 'l' ? '#FFD24A' : '#555'; x.beginPath(); x.arc(140, 160, 14, 0, 7); x.fill(); x.fillStyle = want === 'r' ? '#FFD24A' : '#555'; x.beginPath(); x.arc(220, 160, 14, 0, 7); x.fill();
      x.fillStyle = slip > 0 ? '#FF7A5A' : '#E8E4DC'; x.fillRect(172, 168 - (step % 2) * 3, 16, 28);
      x.fillStyle = '#FFF'; x.font = '12px sans-serif'; x.fillText('第 ' + step + '／' + GOAL + ' 階　剩 ' + Math.max(0, 60 - t).toFixed(1) + ' 秒　連續 ' + combo, 8, 16);
    };
    const end = win => {
      on = false; $('st-go').disabled = false; $('st-go').textContent = '再爬一次';
      if (win) { c.stairDay = s.day; c.stairBest = Math.min(c.stairBest || 99, t); if (R.sanAdd) R.sanAdd(10); s.buff = { kind: 'food', b: { hp: 0.05, regen: 0.2 }, until: s.day }; R.ateFood && R.ateFood(s.buff); R.cityRep('bannan', 1); const sg = R.azuki && R.azuki.byId('bannan'); const sight = sg && sg.sights.find(q => /仰天寺|通天道/.test(q[1])); R.save(); msg('爬到頂了！' + t.toFixed(1) + ' 秒（最快 ' + c.stairBest.toFixed(1) + '）。仰天寺的僧人蓋了朱印：理智回復，今天下遺跡生命、回血稍好。'); if (sight) setTimeout(() => R.azuki.stamp('bannan', sight[0]), 1200); }
      else { R.save(); msg('時間到，爬到第 ' + step + ' 階。腿好痠。'); }
    };
    const press = k => { if (!on) return; if (k === want) { combo++; step += combo > 20 ? 3 : combo > 8 ? 2 : 1; want = want === 'l' ? 'r' : 'l'; } else { combo = 0; slip = 0.35; step = Math.max(0, step - 2); R.sfx && R.sfx('hurt'); } if (step >= GOAL) end(true); };
    const loop = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!$('st-cv')) { off(); return; } if (on) { t += dt; slip -= dt; if (t >= 60) end(false); } draw(); raf = requestAnimationFrame(loop); };
    const kd = e => { const k = ['ArrowLeft', 'KeyA'].includes(e.code) ? 'l' : ['ArrowRight', 'KeyD'].includes(e.code) ? 'r' : null; if (k) { e.preventDefault(); e.stopPropagation(); if (!e.repeat) press(k); } };
    const off = () => { cancelAnimationFrame(raf); removeEventListener('keydown', kd, true); };
    addEventListener('keydown', kd, true);
    $('st-l').onclick = () => press('l'); $('st-r').onclick = () => press('r');
    $('st-go').onclick = () => { if (on) return; on = true; t = 0; step = 0; want = 'l'; combo = 0; $('st-go').disabled = true; msg('左、右、左、右……'); };
    $('st-x').onclick = () => { off(); R.closeSheet(); };
    last = performance.now(); raf = requestAnimationFrame(loop);
  };
  R.CITY_ACT.bannan = stairs;
  R.CITY_FAC['bannan:road'] = stairs;
  // 妖物寺：供奉遺跡生物的素材（普通怪的 mm_、領主體的部位）→ 加持過的護符
  const shrine = city => {
    const M = mats(), lordMat = k => R.MATS[k] && R.MATS[k].lord && R.MATS[k].tier <= 2, offer = Object.keys(M).filter(k => M[k] > 0 && (/^mm_/.test(k) || lordMat(k) || k === 'mutacore')), pts = offer.reduce((a, k) => a + M[k] * (k === 'mutacore' ? 12 : lordMat(k) ? 4 : 1), 0), c = C2();   // 領主體的源晶、王冠這些貴的（tier 3、4）不收
    R.sheet('<p class="kicker">板南・妖物寺</p><h2>妖物寺</h2><p>「遺跡生物身上留下的東西，放在外面會招來不好的東西。交給寺裡供奉——住持會為你加持一枚護符。」</p>'
      + '<p class="note">供奉的功德：普通遺跡生物的素材 1、領主體的部位 4、異變核心 12。累積 ' + (c.yokai || 0) + '／30 換一枚加持護符（史詩；60 換傳說）。</p>'
      + (offer.length ? '<p>你身上可以供奉的：' + offer.map(k => esc(matName(k)) + '×' + M[k]).join('、') + '（共 ' + pts + ' 功德）</p>' : '<p>你身上沒有遺跡生物的素材。</p>'),
      '<div class="row">' + (offer.length ? '<button type="button" class="btn" id="yk-all">全部供奉（+' + pts + '）</button>' : '') + '<button type="button" class="btn pri" id="yk-get"' + ((c.yokai || 0) >= 30 ? '' : ' disabled') + '>請住持加持護符</button><button type="button" class="btn" id="yk-x">好了</button></div>');
    $('yk-x').onclick = R.closeSheet;
    if ($('yk-all')) $('yk-all').onclick = () => { offer.forEach(k => { M[k] = 0; }); c.yokai = (c.yokai || 0) + pts; c.yokaiDay = S().day; R.cityRep('bannan', 1); R.save(); ok('供奉了 ' + pts + ' 功德。'); shrine(city); };
    $('yk-get').onclick = () => { if ((c.yokai || 0) < 30) return; const big = c.yokai >= 60, pool = Object.keys(R.CHARM2 || {}), base = pool.length ? pool[Math.floor(rnd() * pool.length)] : 'charm'; const it = R.makeItem({ kind: 'charm', base, ilvl: lvNow(), rarity: big ? 4 : 3, identified: true }); if (!it) { R.toast('住持搖搖頭：「今天不是好日子。」'); return; } it.yokai = 1; if (!(R.giveItem && R.giveItem(it))) S().stash.push(it); /* 背包放不下就放倉庫 */ c.yokai -= big ? 60 : 30; R.save(); R.sfx && R.sfx('chest'); R.banner && R.banner('妖物寺', '住持為你加持了' + R.itemName(it)); shrine(city); };
  };
  R.CITY_FAC['bannan:yokai'] = shrine;
  const nm1 = R.itemName; if (nm1) R.itemName = it => (it && it.yokai ? '妖物寺加持・' : '') + nm1(it);
  R.cityQuestReg('bannan', [
    R.cqCargo('bn_steel', 'steel', 3, 260, '板南城的修繕', '天守的鐵門要換，3 箱征遠鋼材。'),
    R.cqCargo('bn_timber', 'timber', 4, 260, '仰天寺的大梁', '寺裡的大梁蛀了，4 箱古森木材。'),
    R.cqCargo('bn_ration', 'ration', 3, 140, '舊陸軍營地的巡守', '封鎖區巡守的口糧，3 箱。'),
    { k: 'bn_stair', name: '替老奶奶上香', desc: '老奶奶爬不動通天道了。今天替她爬到頂（60 秒內）。', pay: 110, need: () => [C2().stairDay === S().day ? 1 : 0, 1], take: () => { } },
    { k: 'bn_yokai', name: '妖物寺的供奉', desc: '今天到妖物寺供奉一次遺跡生物的素材。', pay: 90, need: () => [C2().yokaiDay === S().day ? 1 : 0, 1], take: () => { } }
  ]);

  // ================= 古森：植樹場 =================
  // 一棵樹：{ d: 種下的那一天 }；長 4 天可以砍（古森木材 2 箱，三成多一個魔力水晶）
  const GROW = 4, PLOTS = 6, SAP = 20;
  const plots = () => { const c = C2(); c.trees = c.trees || []; while (c.trees.length < PLOTS) c.trees.push(null); return c.trees; };
  const grove = city => {
    const s = S(), T = plots(), day = s.day || 0, c = C2();
    const stage = tr => { const a = day - tr.d; return a >= GROW ? ['長大了', '#3A8A3A'] : a >= 2 ? ['小樹', '#6AA85A'] : ['樹苗', '#9AC87A']; };
    R.sheet('<p class="kicker">古森・植樹場</p><h2>你的六塊地</h2><p>「古森木要四天才長得夠粗。砍一棵，協會就讓你再種一棵——這是規矩。」樹苗 ' + SAP + ' 費拉。種了 ' + (c.planted || 0) + ' 棵、砍了 ' + (c.cut || 0) + ' 棵。</p><div class="gv">'
      + T.map((tr, i) => tr ? '<button type="button" class="btn gv-p" data-gv="' + i + '" style="--gv:' + stage(tr)[1] + '"><b>' + stage(tr)[0] + '</b><small>' + (day - tr.d >= GROW ? '可以砍了' : '再 ' + (GROW - (day - tr.d)) + ' 天') + '</small></button>' : '<button type="button" class="btn gv-p" data-gv="' + i + '"' + (s.gold < SAP ? ' disabled' : '') + '><b>空地</b><small>種一棵（' + SAP + '）</small></button>').join('')
      + '</div><p class="note">砍下來的古森木材裝進貨箱（貨箱 ' + Object.values(c.cargo).reduce((a, n) => a + n, 0) + '／' + (10 + R.CITY_BOATS[c.boat][2]) + '），征遠、板南、南瀧收得貴。</p>',
      '<div class="row"><button type="button" class="btn pri" id="gv-x">好了</button></div>');
    $('gv-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-gv]').forEach(b => { b.onclick = () => {
      const i = +b.dataset.gv, tr = T[i];
      if (!tr) { if (!pay(SAP)) return; T[i] = { d: day }; c.planted = (c.planted || 0) + 1; c.plantDay = day; R.cityRep('gusen', 1); R.save(); ok('種下一棵古森木的樹苗。'); }
      else if (day - tr.d >= GROW) { const load = Object.values(c.cargo).reduce((a, n) => a + n, 0), room = 10 + R.CITY_BOATS[c.boat][2] - load; if (room < 2) { R.toast('貨箱放不下（要 2 箱的空位）。', '#FF9A6A'); return; } T[i] = null; c.cargo.timber = (c.cargo.timber || 0) + 2; c.cut = (c.cut || 0) + 1; let extra = ''; if (rnd() < 0.3) { mats().crystal = (mats().crystal || 0) + 1; extra = '，樹心裡還有一個魔力水晶'; } R.save(); ok('砍下一棵古森木：木材 2 箱' + extra + '。'); }
      else { R.townTalk('植樹場', ['「還太細了，再等 ' + (GROW - (day - tr.d)) + ' 天。」']); return; }
      grove(city);
    }; });
  };
  R.CITY_ACT.gusen = grove;
  R.CITY_FAC['gusen:plant'] = grove;
  R.CITY_FAC['gusen:nature'] = city => R.cityQuestSheet(city);
  R.cityQuestReg('gusen', [
    { k: 'gs_plant', name: '自然保護協會：今天的樹苗', desc: '今天在植樹場種下至少一棵樹苗。', pay: 70, need: () => [C2().plantDay === S().day ? 1 : 0, 1], take: () => { } },
    R.cqCargo('gs_elec', 'electro', 2, 250, '精靈部落的燈', '精靈長老想試試「不用火的燈」，2 箱日下森電器。'),
    R.cqCargo('gs_med', 'medicine', 3, 290, '動物園的獸醫', '動物園的獸醫缺藥，3 箱英尼爾斯藥品。'),
    R.cqCargo('gs_fish', 'fishdry', 3, 150, '老街巷的冬糧', '老街巷的人家要 3 箱銀旗魚乾過冬。'),
    R.cqMat('gs_herb', 'herb', 4, 90, '茶廠的配方', '茶廠要試新的藥草茶，交 4 份藥草。')
  ]);

  const css = document.createElement('style');
  css.textContent = '.gv{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:8px 0}.gv-p{border-left:4px solid var(--gv,#6A5A4A);text-align:left}.gv-p small{display:block;opacity:.8}';
  document.head.appendChild(css);
})(window.R);
