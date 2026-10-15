// 熟練度改版（2026-10-15 作者《特質與熟練度》第三、四節）：新的四種熟練度、力量和體質的效果、閃避率
// 點數、等級、升級的說明、勇者證的雷達圖在 prof.js；這裡管「怎麼練」和「效果」。
// - 智力：書店翻書 +0.1、鑑定 +0.5、法系職業（術士、牧師、召喚師、術陣師、附魔師、符卷師、吟遊詩人，含轉職）每放一招技能 +1、解開解謎房 +0.5。
//   每級：技能急速 +5、大招需要的累積 −1%、暴擊率 +0.2%。
// - 精神：睡一晚 +0.2、理智累積掉 40 點 +1、偷竊／扒竊成功 +2。
//   每級：理智上限 +5、理智每分鐘自然恢復 0.2、理智扣的量 −0.5%、牧師的傷害 +1%、召喚師的傷害 +1%（理智的部分接 san.js）。
// - 技巧：槍手換彈 +0.5（完美換彈 +1；開始換彈時彈匣剩 35% 以下才算）、弓箭手拉滿弓射出 +1.5、
//   近戰系職業（戰士、刀客、騎士、武術家、附魔師、術陣師、符卷師、吟遊詩人，含轉職）每放一招技能 +0.5、挖礦、開寶箱 +0.5。
//   每級：槍手換彈速度 +0.5%、弓箭手拉弓速度 +0.5%、技能急速 +4、閃避率 +0.5%、挖礦和開寶箱的速度 +1%。
//   每 5 級：吟遊詩人的樂譜多 1 拍（作者：沒有樂譜延長 4 拍、有 6 拍，多一個音符＝多一拍；bardchord.js 的 R.bardExtraBeats）。
// - 精確：弓箭手拉滿弓射中 +5、槍手 6 公尺外打中 +1、技能打中 +0.1（一招打到幾隻就算幾次）、暴擊 +0.5、破甲或打倒精英 +0.5。
//   每級：弓箭手、槍手的攻擊距離 +1%、技能急速 +2、暴擊率 +0.3%、暴擊傷害 +2%、穿透 +1%、所有技能的範圍和距離 +1%。
// - 力量（R.strOf：職業的底＋種族＋職業等級＋力量的鍛鍊）每點：物理傷害 +2%、暴擊率 +0.5%、物理武器的攻擊速度 +0.7%。
// - 體質（R.conOf）每點：生命上限 +25（體力的部分在 stamina.js）。生命上限最低 1。
// - 閃避率（敏捷、技巧）：被遺跡生物打到的時候有機率完全不受傷、跳「閃避」，最高 80%。
//   包在 R.hurtPlayer 最外面：閃避成功就什麼都不觸發（格擋、反切、反傷、受擊回魔、受傷練體力都不算）。
// 放在所有包 R.calcPlayer、R.hurtEnemy、R.hurtPlayer、R.killEnemy、R.useSkill、R.castSlot、R.useChest、R.identify 的檔案後面（main.js 前面）。
(function (R) {
  const W = () => R.W, S = () => R.S;
  const lv = k => (R.profLv && R.profLv[k] ? R.profLv[k]() : 0);
  const gain = (k, v) => { if (R.profGain) R.profGain(k, null, v); };
  const pc = v => (Math.round(v * 10) / 10) + '%';
  const INT_CLS = { mage: 1, priest: 1, summoner: 1, arraymage: 1, enchanter: 1, scroll: 1, bard: 1 };
  const TECH_CLS = { warrior: 1, blade: 1, knight: 1, monk: 1, enchanter: 1, arraymage: 1, scroll: 1, bard: 1 };

  // ---------- 升級的說明、怎麼練（勇者證的一覽用） ----------
  Object.assign(R.PROF_LINE, {
    int: n => '技能急速 +' + 5 * n + '、大招需要的累積 −' + n + '%、暴擊率 +' + pc(0.2 * n),
    spi: n => '理智上限 +' + 5 * n + '、理智每分鐘恢復 ' + (Math.round(0.2 * n * 10) / 10) + '、理智扣的量 −' + pc(0.5 * n) + '、牧師和召喚師的傷害 +' + n + '%',
    tech: n => '槍手換彈速度 +' + pc(0.5 * n) + '、弓箭手拉弓速度 +' + pc(0.5 * n) + '、技能急速 +' + 4 * n + '、閃避率 +' + pc(0.5 * n) + '、挖礦和開寶箱的速度 +' + n + '%' + (n >= 5 ? '、吟遊詩人的樂譜 +' + Math.floor(n / 5) + ' 拍' : ''),
    prec: n => '弓箭手和槍手的攻擊距離 +' + n + '%、技能急速 +' + 2 * n + '、暴擊率 +' + pc(0.3 * n) + '、暴擊傷害 +' + 2 * n + '%、穿透 +' + n + '%、技能的範圍和距離 +' + n + '%'
  });
  Object.assign(R.PROF_HOW, {
    int: '書店翻書 +0.1、鑑定 +0.5、法系職業放技能 +1、解開解謎房 +0.5',
    spi: '睡一晚 +0.2、理智累積掉 40 點 +1、偷竊或扒竊成功 +2',
    tech: '槍手換彈 +0.5（完美換彈 +1；彈匣剩 35% 以下才算）、弓箭手拉滿弓射出 +1.5、近戰系職業放技能 +0.5、挖礦和開寶箱 +0.5',
    prec: '弓箭手拉滿弓射中 +5、槍手 6 公尺外打中 +1、技能打中 +0.1、暴擊 +0.5、破甲或打倒精英 +0.5'
  });

  // ---------- 效果：算玩家數值 ----------
  const cp0 = R.calcPlayer;
  R.calcPlayer = cls => {
    const P = cp0(cls);
    try {
      const il = lv('int'), sl = lv('spi'), tl = lv('tech'), pl = lv('prec');
      const str = R.strOf ? R.strOf(cls) : 0, con = R.conOf ? R.conOf() : 0, ws = P.ws;
      P.haste += 5 * il + 4 * tl + 2 * pl;   // haste.js 的急速（這時候還是急速的接收器）
      if (ws) {
        ws.crit = Math.max(0, (ws.crit || 0) + 0.002 * il + 0.003 * pl + 0.005 * str);
        if (ws.kind !== 'magic') ws.rate *= Math.max(0.1, 1 + 0.007 * str);
        if (ws.kind === 'gun' && ws.reload) ws.reload /= 1 + 0.005 * tl;
        if ((ws.kind === 'gun' || ws.kind === 'bow') && ws.range) ws.range *= 1 + 0.01 * pl;
      }
      P.critMult = (P.critMult || 1.5) + 0.02 * pl;
      if (pl) P.pen = Math.min(0.95, (P.pen || 0) + 0.01 * pl);
      P.rangeMult = (P.rangeMult || 1) * (1 + 0.01 * pl);   // skillrange.js：技能的範圍、距離
      P.drawSpd = 1 + 0.005 * tl;   // archerdraw.js：拉弓速度
      P.dodgeRate = (P.dodgeRate || 0) + 0.005 * tl;
      P.physMul = Math.max(0.1, 1 + 0.02 * str);
      P.spiMul = cls === 'priest' || cls === 'summoner' ? 1 + 0.01 * sl : 1;
      P.ultNeed = Math.max(0.5, 1 - 0.01 * il);
      P.hpMax = Math.max(1, Math.round(P.hpMax + 25 * con));
      P.str = str; P.con = con;
    } catch (e) { console.warn('[prof2]', e); }
    return P;
  };

  // ---------- 放技能：記下來（技能打中才算精確；法系、近戰系每放一招練智力、技巧） ----------
  let cast = { id: 0, t: -99 }, snap = null;
  const cds = P => [P.skillCd || 0].concat(P.skCd ? Array.from(P.skCd, v => v || 0) : []);
  const checkCast = () => {
    const w = W(), P = w.P, run = w.run; if (!P || !run) { snap = null; return; }
    const now = cds(P), was = snap; snap = now; if (!was || was.P !== P) { snap.P = P; return; } snap.P = P;
    let n = 0; now.forEach((v, i) => { if (v > (was[i] || 0) + 0.01) n++; }); if (!n) return;
    cast = { id: cast.id + 1, t: run.t };
    if (INT_CLS[P.cls]) gain('int', n); if (TECH_CLS[P.cls]) gain('tech', 0.5 * n);
  };
  const us0 = R.useSkill;
  if (us0) R.useSkill = (...a) => { const r = us0(...a); try { checkCast(); } catch (e) { } return r; };
  const cs0 = R.castSlot;
  if (cs0) R.castSlot = i => { const r = cs0(i); try { checkCast(); } catch (e) { } return r; };

  // ---------- 普攻：一下記一次（槍手 6 公尺外打中） ----------
  let shot = { id: 0, t: -99 };
  const at0 = R.attack;
  R.attack = (...a) => { const P = W().P, run = W().run, cd0 = P ? P.atkCd : 0, r = at0(...a); if (P && run && P.atkCd > cd0 + 0.001) shot = { id: shot.id + 1, t: run.t, hit: false }; return r; };

  // ---------- 打敵人：力量、魔法、精神的傷害；精確怎麼練 ----------
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => {
    const P = W().P, run = W().run;
    if (!e || e.dead || !P || !run || !(raw > 0)) return he0(e, raw, o);
    o = o || {};
    const ref = !!(o.reflect || o.thorns), dot = !!(o.dot || o.burn);
    let k = 1;
    if (!ref) {
      const mag = R.isMagHit ? R.isMagHit(o) : P.ws && P.ws.kind === 'magic';
      if (mag) { if (!o.primary) k *= P.magicProfMul || 1; } else k *= P.physMul || 1;
      k *= P.spiMul || 1;
    }
    const hp0 = e.hp, brk0 = e._brk || 0; R.lastCrit = false;
    const r = he0(e, raw * k, o);
    try {
      if (!ref && !dot && hp0 > e.hp && !(R.inTraining && R.inTraining())) {
        if (R.lastCrit) gain('prec', 0.5);
        if ((e._brk || 0) > brk0) gain('prec', 0.5);   // 破甲（elements1008.js）
        if (!o.primary && run.t - cast.t < 6 && e._pfCast !== cast.id) { e._pfCast = cast.id; gain('prec', 0.1); }   // 一招打到幾隻算幾次
        if (o.primary && P.cls === 'gunner' && !shot.hit && run.t - shot.t < 1.5 && Math.hypot(e.x - P.x, e.z - P.z) >= 6) { shot.hit = true; gain('prec', 1); }
        const al = R.archerLast;
        if (P.cls === 'archer' && al && al.full && !al.hit && performance.now() - al.t < 2500) { al.hit = true; gain('prec', 5); }   // 2026-10-16 作者：+1 → +5
      }
    } catch (err) { console.warn('[prof2]', err); }
    return r;
  };
  const ke0 = R.killEnemy;
  R.killEnemy = (e, by) => { const was = e && !e.dead, r = ke0(e, by); try { if (was && e.dead && !by && W().run && (e.elite || (e.def && e.def.elite))) gain('prec', 0.5); } catch (err) { } return r; };

  // ---------- 閃避（包在最外面：閃掉了就什麼都不觸發） ----------
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => {
    const w = W(), P = w.P;
    if (P && w.run && !w.run.done && !P.dead && raw > 0 && src && src.def && !(o && o.reflect) && !((P.iframe || 0) > 0)) {
      const ch = Math.min(0.8, P.dodgeRate || 0);
      if (ch > 0 && Math.random() < ch) { R.num && R.num(P.x, 2.4, P.z, '閃避', 'heal'); return; }
    }
    return hp0(raw, src, o);
  };

  // ---------- 每一幀：換彈、拉滿弓、大招的累積、放技能 ----------
  let rl = null, arc = null, ult = { P: null, v: 0 };
  const st0 = R.step;
  R.step = dt => {
    st0(dt);
    try {
      const w = W(), P = w.P, run = w.run; if (!P || !run || run.done) { rl = null; return; }
      checkCast();
      // 槍手換彈：開始的時候彈匣剩 35% 以下才算，換好的時候給（完美換彈 +1）
      const ws = P.ws || {};
      if (P.cls === 'gunner' && ws.kind === 'gun') {
        if (P.reloadT > 0 && !rl) rl = { ok: (P.ammo || 0) <= (ws.mag || 0) * 0.35 };
        else if (!(P.reloadT > 0) && rl) { if (rl.ok) gain('tech', P._perfect ? 1 : 0.5); rl = null; }
      }
      // 弓箭手拉滿弓射出
      const al = R.archerLast; if (al && al !== arc) { arc = al; if (al.full && P.cls === 'archer') gain('tech', 1.5); }
      // 大招需要的累積 −1%／級：新累積的部分放大
      if (ult.P !== P) ult = { P, v: P.ult || 0 };
      const u = P.ult || 0;
      if (u > ult.v + 1e-9 && !P.ulting && (P.ultNeed || 1) < 1) P.ult = Math.min(100, ult.v + (u - ult.v) / P.ultNeed);
      ult.v = P.ult || 0;
    } catch (e) { console.warn('[prof2]', e); }
  };

  // ---------- 技巧：挖礦、開寶箱 ----------
  R.workSpeed = () => 1 + 0.01 * lv('tech');
  R.bardExtraBeats = () => Math.floor(lv('tech') / 5);
  R.onWorkDone = () => gain('tech', 0.5);
  const uc0 = R.useChest;
  if (uc0) R.useChest = c => { const was = c && c.state, r = uc0(c); try { if (was === 'closed' && c.state === 'open') gain('tech', 0.5); } catch (e) { } return r; };

  // ---------- 智力：讀書、鑑定、解謎 ----------
  const BOOK = /書房|書店|書局|圖書館/;
  const kz0 = R.openKuzeBook;
  if (kz0) R.openKuzeBook = (...a) => { gain('int', 0.1); return kz0(...a); };
  const tt0 = R.townTalk;
  if (tt0) R.townTalk = (who, lines) => { if (BOOK.test(who || '')) gain('int', 0.1); return tt0(who, lines); };
  const kit = R.INTERIOR_KIT;
  if (kit && kit.talk) { const t0 = kit.talk; kit.talk = (who, lines) => { if (BOOK.test(who || '')) gain('int', 0.1); return t0(who, lines); }; }
  const id0 = R.identify;
  if (id0) R.identify = it => { const r = id0(it); if (r) gain('int', 0.5); return r; };
  R.onPuzzleSolved = () => gain('int', 0.5);

  // ---------- 精神：睡覺、理智、偷竊 ----------
  R.sanMax = () => 100 + 5 * lv('spi');
  R.sanLossMul = () => Math.max(0, 1 - 0.005 * lv('spi'));
  R.onSanLoss = d => {
    const s = S(); if (!s || !(d > 0)) return; s.prof = s.prof || { w: {}, ver: 2 };
    s.prof.sanAcc = (s.prof.sanAcc || 0) + d;
    if (s.prof.sanAcc >= 40) { const n = Math.floor(s.prof.sanAcc / 40); s.prof.sanAcc -= n * 40; gain('spi', n); }
  };
  let inEnd = false;
  const er0 = R.endRun;
  if (er0) R.endRun = (...a) => { inEnd = true; try { return er0(...a); } finally { inEnd = false; } };
  const ad0 = R.advanceDays;
  if (ad0) R.advanceDays = n => { const rolling = !!(W().town && W().town.rolling), r = ad0(n); if (!inEnd && !rolling && n > 0) gain('spi', 0.2); return r; };   // 熬夜到天亮不算睡
  let thief = null;
  setInterval(() => {
    try {
      const s = S(); if (!s) { thief = null; return; }
      const st = s.stats || {}, n = (st.stolen || 0) + (st.picked || 0);
      if (!thief || thief.s !== s) thief = { s, n }; else if (n > thief.n) { gain('spi', 2 * (n - thief.n)); thief.n = n; }
      // 理智自然恢復：每級每分鐘 0.2（暫停、切到別的分頁的時候不算）
      const sl = lv('spi'), w = W();
      if (sl && R.sanAdd && !(w && w.paused) && !document.hidden) R.sanAdd(0.2 * sl / 60);
    } catch (e) { }
  }, 1000);

  // ---------- 角色總數值：力量的加成（力量本身那一行在 charsheet.js）、體質、閃避率 ----------
  const ch0 = R.charSheetHtml;
  if (ch0) R.charSheetHtml = (cls, opt) => {
    const h = ch0(cls, opt);
    try {
      const P = opt && opt.live && W().P && W().run ? W().P : R.calcPlayer(cls || S().cls), str = R.strOf ? R.strOf(cls || S().cls) : 0, con = R.conOf ? R.conOf() : 0;
      const row = (a, b, c) => '<div class="cs-row"><span>' + a + '</span><b>' + b + '</b>' + (c ? '<small>' + c + '</small>' : '') + '</div>';
      return h.replace('<h4>基本</h4>', '<h4>基本</h4>' + row('力量的加成', '物理傷害 +' + 2 * str + '%', '力量 ' + str + '：暴擊率 +' + pc(0.5 * str) + '、物理武器攻速 +' + pc(0.7 * str))
        + row('體質', con, '生命上限 +' + 25 * con + '、體力上限 +' + 5 * con + '、體力回復 +' + pc(0.2 * con))
        + (P.dodgeRate ? row('閃避率', pc(Math.min(80, P.dodgeRate * 100)), '被打到的時候完全不受傷（最高 80%）') : ''));
    } catch (e) { return h; }
  };
})(window.R);
