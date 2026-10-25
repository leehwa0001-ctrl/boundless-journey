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
    const P = cp(cls), s = S(), t = s && s.tonic, om = s && s.city2 && s.city2.omi; if (!W.run) return P;
    if (om && om.day === s.day) { const b = om.b; if (b.hp) P.hpMax = Math.round(P.hpMax * (1 + b.hp)); if (b.dmg) P.dmgMult *= 1 + b.dmg; if (b.regen) P.regen += b.regen; }   // 府廳軍神社的武運籤（當天）
    if (!t || t.until < s.day) return P;
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
  // 射擊場：30 秒，窗口裡跳出來的靶——紅的是敵兵靶，戴白盔的是新兵（打到扣分）
  const range = () => {
    const s = S(), c = C2();
    R.sheet('<p class="kicker">府廳・軍營</p><h2>射擊場</h2><p class="note">30 秒。點紅色的敵兵靶（+10），別打到戴白盔的新兵（−20）。照新兵的標準給軍功章：200 分以上 3 枚、140 以上 2 枚、80 以上 1 枚。一次 10 費拉。</p><canvas id="rg-cv" width="360" height="220" class="fs-cv" style="cursor:crosshair"></canvas><p class="note" id="rg-msg">按「開始」。</p>',
      '<div class="row"><button type="button" class="btn pri" id="rg-go">開始（10 費拉）</button><button type="button" class="btn" id="rg-x">離開</button></div>');
    const cv = $('rg-cv'), x = cv.getContext('2d'), msg = t => { const m = $('rg-msg'); if (m) m.textContent = t; };
    const SLOT = [[50, 70], [130, 70], [210, 70], [290, 70], [90, 150], [180, 150], [270, 150]];
    let on = false, t = 0, score = 0, pops = [], next = 0, raf = 0, last = 0, fx = [];
    const draw = () => {
      x.fillStyle = '#6A7A5A'; x.fillRect(0, 0, 360, 220); x.fillStyle = '#4A3A2A'; SLOT.forEach(([a, b]) => x.fillRect(a - 22, b - 26, 44, 52));
      pops.forEach(p => { const [a, b] = SLOT[p.i], up = Math.min(1, p.t / 0.15, (p.life - p.t) / 0.15); x.save(); x.beginPath(); x.rect(a - 22, b - 26, 44, 52); x.clip(); const y = b + 26 - 48 * up; x.fillStyle = p.bad ? '#E8E4DC' : '#C83A3A'; x.fillRect(a - 12, y + 14, 24, 32); x.beginPath(); x.arc(a, y + 9, 9, 0, 7); x.fill(); if (p.bad) { x.fillStyle = '#FFFFFF'; x.fillRect(a - 10, y, 20, 6); } x.restore(); });
      fx.forEach(f => { x.fillStyle = f.c; x.font = 'bold 14px sans-serif'; x.fillText(f.t, f.x, f.y - (0.6 - f.l) * 30); });
      x.fillStyle = '#FFF'; x.font = '12px sans-serif'; x.fillText('分數 ' + score + '　剩 ' + Math.max(0, 30 - t).toFixed(1) + ' 秒', 8, 16);
    };
    const end = () => { on = false; const got = score >= 200 ? 3 : score >= 140 ? 2 : score >= 80 ? 1 : 0; c.medal = (c.medal || 0) + got; if (got >= 2) c.rangeDay = s.day; if (got) R.cityRep('futing', 1); R.save(); msg('結束：' + score + ' 分' + (got ? '，軍功章 +' + got + '（現在 ' + c.medal + ' 枚）' : '。教官搖頭：「新兵都比你準。」')); $('rg-go').disabled = false; };
    const loop = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!$('rg-cv')) return;
      if (on) { t += dt; next -= dt; if (next <= 0) { next = Math.max(0.35, 0.9 - t / 50); const free = SLOT.map((_, i) => i).filter(i => !pops.some(p => p.i === i)); if (free.length) pops.push({ i: free[Math.floor(rnd() * free.length)], t: 0, life: 1.4 - Math.min(0.6, t / 50), bad: rnd() < 0.25 }); } pops.forEach(p => { p.t += dt; }); pops = pops.filter(p => p.t < p.life); if (t >= 30) end(); }
      fx.forEach(f => { f.l -= dt; }); fx = fx.filter(f => f.l > 0); draw(); raf = requestAnimationFrame(loop);
    };
    cv.onpointerdown = e => { if (!on) return; const r = cv.getBoundingClientRect(), mx = (e.clientX - r.left) * 360 / r.width, my = (e.clientY - r.top) * 220 / r.height; const p = pops.find(q => { const [a, b] = SLOT[q.i]; return Math.abs(mx - a) < 16 && my > b - 26 && my < b + 26 && q.t > 0.1; }); R.sfx && R.sfx('gun'); if (!p) return; pops = pops.filter(q => q !== p); score += p.bad ? -20 : 10; fx.push({ t: p.bad ? '−20' : '+10', c: p.bad ? '#FF5A3A' : '#FFE04A', x: SLOT[p.i][0] - 10, y: SLOT[p.i][1] - 30, l: 0.6 }); };
    $('rg-go').onclick = () => { if (on || !pay(10)) return; R.save(); on = true; t = 0; score = 0; pops = []; next = 0.5; $('rg-go').disabled = true; msg('射！'); };
    $('rg-x').onclick = () => { cancelAnimationFrame(raf); R.closeSheet(); };
    last = performance.now(); raf = requestAnimationFrame(loop);
  };
  // 軍神社：武運籤（一天一次，當天下遺跡有效）
  const OMI = [['大吉', { dmg: 0.06, hp: 0.04 }, '「武運長久。今天的你，誰也擋不住。」'], ['吉', { dmg: 0.03 }, '「出手要快。」'], ['中吉', { hp: 0.04 }, '「守得住，就贏了。」'], ['末吉', { regen: 0.2 }, '「慢慢來，傷會好的。」'], ['凶', {}, '「今天別逞強。」——把籤綁在神社的樹上。']];
  const omikuji = () => {
    const s = S(), c = C2();
    if (c.omi && c.omi.day === s.day) { R.townTalk('軍神社', ['今天已經抽過了：' + c.omi.name + '。']); return; }
    if (!pay(10)) return;
    const r = rnd(), o = OMI[r < 0.12 ? 0 : r < 0.4 ? 1 : r < 0.65 ? 2 : r < 0.88 ? 3 : 4];
    c.omi = { day: s.day, name: o[0], b: o[1] }; R.save(); R.sfx && R.sfx('pick');
    R.townTalk('軍神社・武運籤', ['【' + o[0] + '】' + o[2], tonicText(o[1]) ? '今天下遺跡：' + tonicText(o[1]) + '。' : '今天沒有加成。']);
  };
  // 軍眷宿舍：太太託你把信交給軍營的教官（一天一封）
  const pick = a => a[Math.floor(rnd() * a.length)];
  const letter = () => {
    const s = S(), c = C2();
    if (c.ftLetterDone === s.day) { R.townTalk('軍眷宿舍', ['「謝謝你。他回信說這個月會回家。」']); return; }
    if (c.ftLetter === s.day) { R.townTalk('軍眷宿舍', ['「信交給操場上帶隊的教官就好。他是我先生。」']); return; }
    c.ftLetter = s.day; R.save();
    R.townTalk('軍眷宿舍', ['「勇者先生……可以幫我把這封信拿到軍營嗎？」', '「操場上帶隊的教官就是我先生。宿舍的人不能進營區。」', '（收下一封信。軍營在西北邊。）']);
  };
  const letterTo = () => {
    const s = S(), c = C2();
    if (c.ftLetter !== s.day) { R.townTalk('帶隊的教官', [pick(['「勇者？黃線外面一步都不准踩。」', '「新兵！再跑三圈！」', '「射擊場借你用，10 費拉。打到新兵的靶要扣分。」'])]); return; }
    c.ftLetter = 0; c.ftLetterDone = s.day; s.gold += 60; R.cityRep('futing', 1); R.save(); R.sfx && R.sfx('coin');
    R.townTalk('帶隊的教官', ['「……我太太的字。」', '（教官把信收進胸口的口袋，轉過去喊了一聲「全員休息五分鐘」。）', '「拿著。跑腿費。」（+60 費拉，府廳的聲望 +1）']);
  };
  // 作戰桌：附近的遺跡
  const intel = () => {
    const me = (R.SITES || []).find(x => x.id === 'futing'), near = (R.SITES || []).filter(x => x.kind === 'ruin' && me && Math.hypot((x.x || 0) - (me.x || 0), (x.z || 0) - (me.z || 0)) < 0.9);
    R.townTalk('作戰桌', near.length ? near.map(x => '【' + x.name + '】' + (((R.GRADES || []).find(g => g.id === x.grade) || {}).name || '') + (x.status === 'lock' ? '（還沒開放）' : '') + '：' + (x.desc || '')) : ['「附近沒有登記的遺跡。」']);
  };
  R.futing = { range, omikuji, letter, letterTo, intel };
  R.CITY_FAC['futing:camp'] = range;
  const nm0 = R.itemName; if (nm0) R.itemName = it => (it && it.mil ? '府廳軍規・' : '') + nm0(it);
  R.cityQuestReg('futing', [
    R.cqCargo('ft_med', 'medicine', 4, 340, '軍醫院的補給', '演習的傷兵多，軍醫院要 4 箱英尼爾斯藥品。'),
    R.cqCargo('ft_steel', 'steel', 4, 300, '靶場的新靶', '靶場要換鋼靶，4 箱征遠鋼材。'),
    R.cqCargo('ft_fish', 'fishdry', 5, 200, '軍營的伙房', '伙房要 5 箱銀旗魚乾。'),
    { k: 'ft_oc', name: '跟新兵跑一趟', desc: '今天在戰爭公園的越野障礙賽跑出 A 以上。', pay: 120, need: () => [C2().ocDay === S().day ? 1 : 0, 1], take: () => { } },
    { k: 'ft_range', name: '射擊場的考核', desc: '今天在軍營的射擊場拿到 140 分以上。', pay: 120, need: () => [C2().rangeDay === S().day ? 1 : 0, 1], take: () => { } },
    { k: 'ft_letter', name: '軍眷的信', desc: '今天幫軍眷宿舍的太太把信送到軍營。', pay: 50, need: () => [C2().ftLetterDone === S().day ? 1 : 0, 1], take: () => { } }
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
  // 艾美利亞造車廠：新車（送到東鶴的停車位；舊車折價一半）
  R.CITY_FAC['banbei:car'] = city => {
    const s = S(), V = R.VEH, L = V ? Object.keys(V.MODELS).filter(k => V.MODELS[k].emelia) : [];
    const trade = s.car && V ? Math.floor(((V.MODELS[s.car.model] || {}).price || 0) / 2) : 0;
    R.sheet('<p class="kicker">板北・艾美利亞造車廠</p><h2>展示間</h2><p>「會戰以後，艾美利亞在板北蓋的第一間工廠就是這裡。」新車送到你在東鶴的停車位。' + (s.car ? '（舊車折價 ' + trade + ' 費拉）' : '') + '</p>'
      + L.map(k => { const M = V.MODELS[k], cost = M.price - trade, mine = s.car && s.car.model === k; return '<button type="button" class="btn" data-ec="' + k + '"' + (mine || s.gold < cost ? ' disabled' : '') + '><b>' + esc(M.name) + '</b><br><small>最高 ' + Math.round(M.max * 3.6) + ' km/h・' + (mine ? '你的車' : cost + ' 費拉') + '</small></button>'; }).join(''),
      '<div class="row"><button type="button" class="btn pri" id="ec-x">看看就好</button></div>');
    $('ec-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-ec]').forEach(b => { b.onclick = () => { const k = b.dataset.ec, M = V.MODELS[k], cost = M.price - trade; if (s.gold < cost) return; s.gold -= cost; s.car = { model: k, col: M.col }; s.carPos = null; R.cityRep('banbei', 2); R.save(); R.sfx && R.sfx('levelup'); R.townTalk('艾美利亞造車廠', ['「' + M.name + '，好眼光。」', '（車會送到東鶴的停車位。）']); }; });
  };
  // 渡輪港：夜船去岳北、古森（電車的一半價錢，在船上睡一晚：理智回復）
  R.CITY_FAC['banbei:ferry'] = city => {
    const s = S(), to = ['yuebei', 'gusen'].map(id => R.azuki.byId(id)).filter(Boolean), fare = c => Math.max(20, Math.round(c.fare / 2));
    R.sheet('<p class="kicker">板北・渡輪港</p><h2>夜船</h2><p>「晚上十點開船，早上到北州。船艙的床很窄，但睡得著。」</p><div class="az-grid">'
      + to.map(c => '<button type="button" class="btn" data-fe="' + c.id + '"' + (s.gold < fare(c) ? ' disabled' : '') + '><b>往' + esc(c.name) + '</b><br><small>' + fare(c) + ' 費拉・一晚（理智回復）</small></button>').join('') + '</div>',
      '<div class="row"><button type="button" class="btn pri" id="fe-x">不搭了</button></div>');
    $('fe-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-fe]').forEach(b => { b.onclick = () => { const c = R.azuki.byId(b.dataset.fe); if (R.sanAdd) R.sanAdd(15); R.travelAzuki(c.id, 'banbei', { fare: fare(c), days: 1, how: '夜船' }); }; });
  };
  // 夜店街：爵士酒吧裡的情報販子（今天哪條貨物路線最好賺）
  R.CITY_FAC['banbei:club'] = city => {
    const s = S(), c = C2(), G = R.CITY_GOODS, P = R.cityPrice;
    if (c.tipDay === s.day) { R.townTalk('夜店街・爵士酒吧', ['薩克斯風在吹慢歌。情報販子朝你舉了舉杯：「今天的已經賣你了。」']); return; }
    R.sheet('<p class="kicker">板北・夜店街</p><h2>爵士酒吧「藍燈」</h2><p>吧台最裡面坐著一個戴帽子的男人。「想知道今天哪條路最好賺？30 費拉。」</p>',
      '<div class="row"><button type="button" class="btn pri" id="tp-ok"' + (s.gold < 30 ? ' disabled' : '') + '>買情報（30）</button><button type="button" class="btn" id="tp-l">只聽音樂（理智回復一點）</button><button type="button" class="btn" id="tp-x">走了</button></div>');
    $('tp-x').onclick = R.closeSheet;
    $('tp-l').onclick = () => { if (R.sanAdd) R.sanAdd(4); R.townTalk('爵士酒吧「藍燈」', ['一首慢歌、一杯熱的。外面港口的霧笛很遠。']); };
    $('tp-ok').onclick = () => {
      if (!pay(30)) return; c.tipDay = s.day; R.save();
      const best = Object.keys(G).map(g => { const from = G[g][2], b = P.buy(from, g), dest = G[g][3].map(t => [t, P.sell(t, g)]).sort((a, z) => z[1] - a[1])[0]; return [g, from, dest[0], dest[1] - b]; }).sort((a, z) => z[3] - a[3]).slice(0, 2);
      const nm = id => (R.azuki.byId(id) || {}).name || id;
      R.townTalk('情報販子', best.map(([g, f, t, d]) => '「' + G[g][0] + '：在' + nm(f) + '買、運到' + nm(t) + '賣，今天一箱賺 ' + d + '。」').concat(['「明天就不一定了。」']));
    };
  };
  // 朝日科技板北所：釣魚的魔導聲納、潛水推進器
  const GADGET = [['sonar', '魔導聲納', 1500, '渦旗出海：魚咬餌的時候多 0.6 秒反應，還看得出是什麼魚。'], ['thruster', '潛水推進器', 1800, '西見潛水：游得快 35%。']];
  R.CITY_FAC['banbei:tech'] = city => {
    const s = S(), c = C2();
    R.sheet('<p class="kicker">板北・朝日科技板北所</p><h2>朝日科技・展示區</h2><p>「民用的魔導具。軍規的我們不能賣。」</p>'
      + GADGET.map(([k, n, p, d]) => '<button type="button" class="btn" data-gd="' + k + '"' + (c[k] || s.gold < p ? ' disabled' : '') + '><b>' + esc(n) + '</b>　' + (c[k] ? '已經有了' : p + ' 費拉') + '<br><small>' + esc(d) + '</small></button>').join(''),
      '<div class="row"><button type="button" class="btn pri" id="gd-x">好了</button></div>');
    $('gd-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-gd]').forEach(b => { b.onclick = () => { const g = GADGET.find(q => q[0] === b.dataset.gd); if (c[g[0]] || !pay(g[2])) return; c[g[0]] = 1; R.cityRep('banbei', 1); R.save(); ok('買了' + g[1] + '。'); R.CITY_FAC['banbei:tech'](city); }; });
  };
  // 港灣酒店：住一晚（理智、疲勞回滿；過一天）
  R.CITY_FAC['banbei:hotel'] = city => {
    const s = S(), P = 180;
    R.sheet('<p class="kicker">板北・港灣酒店</p><h2>櫃台</h2><p>「海景房，看得到大橋的藍燈。一晚 ' + P + ' 費拉，含早餐。」</p>',
      '<div class="row"><button type="button" class="btn pri" id="ht-ok"' + (s.gold < P ? ' disabled' : '') + '>住一晚（' + P + '）</button><button type="button" class="btn" id="ht-x">不了</button></div>');
    $('ht-x').onclick = R.closeSheet;
    $('ht-ok').onclick = () => { if (!pay(P)) return; R.closeSheet(); R.fade(() => { R.advanceDays(1); s.hour = 8; if (R.sanAdd) R.sanAdd(100); if (R.fatAdd && R.fatMax) R.fatAdd(R.fatMax()); s.buff = { kind: 'food', b: { hp: 0.05, mp: 0.05 }, until: s.day }; R.ateFood && R.ateFood(s.buff); R.save(); R.banner && R.banner('港灣酒店', '一覺到天亮。窗外的大橋在晨霧裡。（理智回滿、早餐的加成）'); }); };
  };
  if (R.sicbo) { R.CITY_ACT.banbei = R.CITY_FAC['banbei:casino'] = () => R.sicbo('板北・地下賭場'); R.CITY_ACT.jishan = R.CITY_FAC['jishan:casino'] = () => R.sicbo('吉山・地下賭場'); }
  R.cityQuestReg('banbei', [
    R.cqCargo('bb_tea', 'tea', 4, 240, '港灣酒店的下午茶', '酒店的外國客人要喝昭旭茶，4 箱古森茶。'),
    R.cqCargo('bb_spice', 'spice', 4, 300, '夜店街的新菜單', '夜店的廚師要 4 箱德克斯凡香料。'),
    R.cqCargo('bb_salv', 'salvage', 1, 200, '朝日科技的拆解', '朝日科技要一件沉船古物拆開研究。'),
    R.cqCargo('bb_steel', 'steel', 4, 320, '造車廠的車架', '艾美利亞造車廠的新車架，要 4 箱征遠鋼材。'),
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
  // 板南城：天守的武具庫（每天兩件古式的武器，史詩）
  R.CITY_FAC['bannan:castle'] = city => {
    const s = S(), c = C2(), lv = lvNow(), pool = ['katana', 'spear', 'longbow', 'dualblades', 'staffpole'].filter(k => R.WEAPONS[k]);
    if (c.armDay !== s.day || !c.arm) { c.armDay = s.day; c.arm = [0, 1].map(() => ({ base: pool[Math.floor(rnd() * pool.length)], p: 700 + Math.floor(rnd() * 400) })); R.save(); }
    R.sheet('<p class="kicker">板南・板南城</p><h2>天守的武具庫</h2><p>「昭光帝國北方防禦線的時候，這裡的武具都是實戰用的。現在照古法打，賣給勇者。」</p>'
      + c.arm.map((o, i) => '<button type="button" class="btn" data-ar="' + i + '"' + (o.sold || s.gold < o.p ? ' disabled' : '') + '><b>板南城古式・' + esc((R.WEAPONS[o.base] || {}).name || o.base) + '（史詩）</b><br><small>' + (o.sold ? '賣掉了' : o.p + ' 費拉') + '</small></button>').join(''),
      '<div class="row"><button type="button" class="btn pri" id="ar-x">好了</button></div>');
    $('ar-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-ar]').forEach(b => { b.onclick = () => { const o = c.arm[+b.dataset.ar]; if (o.sold || !pay(o.p)) return; const it = R.makeItem({ kind: 'weapon', base: o.base, ilvl: lv, rarity: 3, identified: true }); if (!it) { s.gold += o.p; return; } it.bannan = 1; o.sold = 1; if (!(R.giveItem && R.giveItem(it))) s.stash.push(it); R.cityRep('bannan', 1); R.save(); ok('買了' + R.itemName(it) + '。'); R.CITY_FAC['bannan:castle'](city); }; });
  };
  const nm2 = R.itemName; if (nm2) R.itemName = it => (it && it.bannan ? '板南城古式・' : '') + nm2(it);
  // 仰天寺：撞大鐘（一天一次）
  R.CITY_FAC['bannan:temple'] = city => {
    const s = S(), c = C2();
    if (c.bellDay === s.day) { R.townTalk('仰天寺', ['鐘聲還在山谷裡迴盪。今天已經撞過了。']); return; }
    c.bellDay = s.day; if (R.sanAdd) R.sanAdd(8); R.save(); R.sfx && R.sfx('magic');
    R.townTalk('仰天寺', ['你拉起撞木，往大鐘撞過去——', '咚——————', '整座山都在回應。心裡有什麼東西放下了。（理智回復）']);
  };
  // 板南中樞鐵路：周遊券（七天內電車半價）
  R.railPass = () => { const s = S(), c = s && s.city2; return !!(c && c.railUntil >= (s.day || 0)); };
  R.CITY_FAC['bannan:rail'] = city => {
    const s = S(), c = C2(), P = 300, on = R.railPass();
    R.sheet('<p class="kicker">板南・板南中樞鐵路</p><h2>周遊券</h2><p>「天宮島的鐵路都從板南過。周遊券七天內搭電車半價——跑貨的人都買。」</p><p class="note">' + (on ? '你的周遊券到第 ' + c.railUntil + ' 天。' : '你沒有周遊券。') + '</p>',
      '<div class="row"><button type="button" class="btn pri" id="rp-ok"' + (s.gold < P ? ' disabled' : '') + '>' + (on ? '延長七天' : '買周遊券') + '（' + P + '）</button><button type="button" class="btn" id="rp-x">好了</button></div>');
    $('rp-x').onclick = R.closeSheet;
    $('rp-ok').onclick = () => { if (!pay(P)) return; c.railUntil = Math.max(c.railUntil || 0, s.day || 0) + 7; R.save(); ok('周遊券到第 ' + c.railUntil + ' 天：電車半價。'); R.CITY_FAC['bannan:rail'](city); };
  };
  R.CITY_FAC['bannan:corp'] = city => R.cityTrade(city);   // 日下森電器的工廠直營：就是貨運窗口
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
