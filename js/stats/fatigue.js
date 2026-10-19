// 疲憊值（2026-10-18 作者：新增角色數值「疲憊值」；作者的規格＋「其他都加」）
// - R.S.fat：上限＝2400＋體質每點 150＋力量每點 50＋職業等級每 5 級 50＋種族（耐打的種族 +200、身子弱的 −100）。最低 −500。
//   0 以上：正常（0 以下會打呵欠）；
//   −150「疲乏-好累……」：全數值 −2%、移動速度再 −5%；
//   −300「疲乏-快睡著了……」：全數值 −5%、偶爾眼前一黑、翻滾冷卻 +20%；越接近 −500 畫面四周越暗；
//   −500「疲乏-不行了」：倒下。遺跡裡＝倒下（背包留在遺跡、錢包掉 5％）；城裡＝被送回家（沒有家就送到附近的診所），收 100 費拉，過半天。
// - 時間：城裡、遺跡裡都是真實 45 秒＝遊戲裡 1 小時（作者沒指定，先照城裡的時間；遺跡用 W.run 的經過時間算）。
// - 會掉：每小時 −100（背包裝到 75% 以上或裝備太重 ×1.25；暴風雪、雪地、沙漠、火山、熔岩 ×1.5、凍傷很高 ×1.75；城裡半夜 0～5 點每小時再 −50）；
//   物理武器普攻一次 −3、每用掉 300 魔力 −5、每用掉 250 體力 −5、放一次技能 −2～5、跑步每秒 −0.5、翻滾一次 −3、
//   受到傷害每少 10% 生命 −5、打工一次 −150～300、玩小遊戲（麻將、柏青哥、拉霸、夾娃娃、卡拉 OK）每一分鐘左右 −20～30。
//   全部的消耗：特質「耐勞」−15%、「易累」+15%、喝過咖啡／茶（喫茶）2 小時內 −30%、泡過溫泉半天內 −20%、理智低於 40 +25%。
// - 會回：營火（遺跡每層的營火、第 0 層休息區的營火）+450、回復藥 +50、睡覺（家、宿屋、旅館）回滿、小帳篷（遺跡裡）回 80%、
//   吃飯（餐廳、定食屋、屋台、赤提燈……）+200～400、喫茶 +150、自己吃禮物（糰子 +80、銅鑼燒 +120、驅寒茶 +150）、提神藥 +300、乾糧 +150、
//   溫泉 +600、坐在長椅或椅子上不會掉而且每小時 +50、吟遊詩人和牧師放技能 +15（不扣）。
//   在家裡的棉被睡：起來 6 小時「精神飽滿」，全數值 +3%。
// - 道具在 js/items/fatigueitems.js（白藤堂賣）；背包畫面的「隨身用品」可以吃、喝、搭帳篷。
// - 顯示：左上角「疲憊」（城裡、遺跡）、遺跡的狀態圖示、角色總數值。
// 放在 stashbag.js 後面（包 R.bagSheet 的最外面）、main.js 前面。
(function (R) {
  const W = () => R.W || {}, S = () => R.S, $ = id => document.getElementById(id), rnd = Math.random;
  const has = id => !!(R.hasTrait && R.hasTrait(id));
  const MIN = -500;
  const live = () => { const w = W(); return !!(w.run && !w.town && w.P && !w.run.done); };
  // ---------- 上限 ----------
  const raceAdd = () => {
    const s = S(), r = R.raceOf && R.raceOf(), id = String((s && s.race) || '').replace(/_m$/, ''), b = (r && r.b) || {};
    if ((b.hp || 0) >= 0.1) return 200;   // 狼人、樹人、黑石、巨人、龍人……
    if ((b.hp || 0) < 0 || id === 'phantom' || id === 'shade') return -100;   // 吸血、幻魔、暗影
    return 0;
  };
  const MAX = () => {
    const s = S(); if (!s) return 2400;
    let con = 0, str = 0; try { con = R.conOf ? R.conOf() : 0; str = R.strOf ? R.strOf(s.cls) : 0; } catch (e) { }
    const lv = (s.classes && s.classes[s.cls] && s.classes[s.cls].lv) || 1;
    return Math.max(600, Math.round(2400 + 150 * con + 50 * str + 50 * Math.floor(lv / 5) + raceAdd()));
  };
  const T = () => { const s = S(); s.fatT = s.fatT || { clock: 0 }; return s.fatT; };   // clock：醒著的遊戲小時（加成的時間照這個算）
  const get = () => { const s = S(); if (!s) return 0; if (s.fat == null || !isFinite(s.fat)) s.fat = MAX(); return s.fat; };
  const set = v => { const s = S(); if (!s) return; s.fat = Math.max(MIN, Math.min(MAX(), v)); };
  const until = k => { const t = T(); return t[k] != null && t[k] > t.clock; };
  const fresh = () => until('fresh');
  const costMul = () => (has('nailao') ? 0.85 : 1) * (has('yilei') ? 1.15 : 1) * (until('cafe') ? 0.7 : 1) * (until('onsen') ? 0.8 : 1) * ((R.sanValue ? R.sanValue() : 100) < 40 ? 1.25 : 1);
  const spend = v => { if (v > 0 && S()) set(get() - v * costMul()); };
  const gain = v => { if (v > 0 && S()) set(get() + v); };
  const fmt = v => Math.round(v).toLocaleString('zh-TW');
  const say = (txt, n) => R.toast && R.toast(txt + (n ? '（疲憊值 +' + fmt(n) + '，現在 ' + fmt(get()) + '）' : ''), '#E8D080');
  R.fatValue = get; R.fatMax = MAX; R.fatAdd = d => (d >= 0 ? gain(d) : spend(-d));
  // ---------- 階段 ----------
  const tierName = v => (v <= MIN ? '疲乏-不行了' : v <= -300 ? '疲乏-快睡著了……' : v <= -150 ? '疲乏-好累……' : v < 0 ? '有點睏' : '正常');
  const tierCol = v => (v <= -300 ? '#F06A6A' : v <= -150 ? '#F0A060' : v < 0 ? '#E8D07A' : '#9AE0B0');
  R.fatTier = () => tierName(get());
  // ---------- 數值：全數值、移動速度、翻滾冷卻 ----------
  const eff = () => { const v = get(); return { a: (v <= -300 ? -0.05 : v <= -150 ? -0.02 : 0) + (fresh() ? 0.03 : 0), sp: v <= -150 ? 0.95 : 1, roll: v <= -300 ? 1.2 : 1 }; };
  const same = (x, y) => x && y && x.a === y.a && x.sp === y.sp && x.roll === y.roll;
  const apply = (P, e, sign) => {
    const k = Math.pow(1 + e.a, sign), sp = Math.pow(e.sp, sign), rl = Math.pow(e.roll, sign), ws = P.ws || {};
    P.hpMax *= k; P.dmgMult *= k; P.def = (P.def || 0) * k; P.mdef = (P.mdef || 0) * k; P.speed *= k * sp;
    if (ws.range) ws.range *= k; if (ws.rate) ws.rate *= k; if (P.haste) P.haste *= k; if (P.dodgeCdMax) P.dodgeCdMax *= rl;
  };
  const cp0 = R.calcPlayer;
  R.calcPlayer = cls => {
    const P = cp0(cls);
    try { if (S()) { const e = eff(); apply(P, e, 1); P._fat = e; } } catch (err) { console.warn('[fatigue]', err); }
    return P;
  };
  const patch = P => {   // 遺跡裡疲憊值換階段：把舊的拿掉、套新的（calcPlayer 只在出發和升級時算）
    const e = eff(); if (same(P._fat, e)) return;
    if (P._fat) apply(P, P._fat, -1); apply(P, e, 1); P._fat = e;
    P.hpMax = Math.round(P.hpMax); if (P.hp > P.hpMax) P.hp = P.hpMax;
  };
  // ---------- 每小時的消耗 ----------
  let bagT = 0, bagFull = false;
  const bagCheck = () => {
    const w = W(), s = S(); if (performance.now() - bagT < 2000) return bagFull; bagT = performance.now();
    try {
      if (w.run && !w.run.townBag) { const Pk = R.PACKS && R.PACKS[w.run.packId], free = R.raidFreeCells ? R.raidFreeCells() : Infinity; bagFull = !!(Pk && isFinite(free) && free <= Pk.w * Pk.h * 0.25) || !!(w.P && w.P.tooHeavy > 0); }
      else { const Pk = R.PACKS && R.PACKS[s.pack || 'sack'], free = R.bagFreeCells ? R.bagFreeCells() : Infinity; bagFull = !!(Pk && isFinite(free) && free <= Pk.w * Pk.h * 0.25); }
    } catch (e) { bagFull = false; }
    return bagFull;
  };
  const envMul = () => {
    const w = W(), run = w.run;
    if (run && !w.town) {
      const fs = R.frostState && R.frostState(); if (fs && fs.v > 60) return 1.75;
      return run.env === 'snow' || run.env === 'desert' || run.env === 'volcano' || run.biome === 'lava' ? 1.5 : 1;
    }
    try { if ((R.eventsToday && R.eventsToday().blizzard) || (R.weatherNow && R.weatherNow() === '暴風雪')) return 1.5; } catch (e) { }
    return 1;
  };
  const hourly = (hrs, hour) => {
    T().clock += hrs;
    const late = hour != null && hour % 24 < 5 ? 50 : 0;
    spend(hrs * (100 * (bagCheck() ? 1.25 : 1) * envMul() + late) * (W().run && !W().town ? 0.5 : 1));   // 2026-10-19：遺跡、狩獵場裡每小時的消耗減半（原本邊打邊跑十分鐘就倒）
  };
  // ---------- 遺跡裡 ----------
  let fxT = 0, lastV = null;
  const acc = { mp: 0, st: 0 };
  const st0 = R.step;
  R.step = dt => {
    st0(dt);
    try {
      const w = W(), P = w.P;
      if (live() && !w.paused && !P.dead) {
        hourly(dt / 45, null);
        if (P._fm != null && P.mp < P._fm) acc.mp += P._fm - P.mp; P._fm = P.mp;
        if (P.stam != null) { if (P._fs != null && P.stam < P._fs) { acc.st += P._fs - P.stam; if (R.running && R.running()) spend(0.5 * dt); } P._fs = P.stam; }
        while (acc.mp >= 300) { acc.mp -= 300; spend(5); }
        while (acc.st >= 250) { acc.st -= 250; spend(5); }
        patch(P);
        warn(get());
        if (get() <= MIN) downInRuin();
      }
      fxT -= dt; if (fxT <= 0) { fxT = 0.25; fx(); }
    } catch (e) { console.warn('[fatigue]', e); }
  };
  // 2026-10-19 作者：滿血突然倒下像 bug——快不行的時候跳大的警告，倒下時講清楚原因
  let warned = 0;
  const warn = v => {
    const lv = v <= -450 ? 2 : v <= -300 ? 1 : 0; if (lv <= warned) { if (v > -250) warned = 0; return; } warned = lv;
    R.banner && R.banner(lv === 2 ? '快撐不住了！' : '好想睡……', '疲憊值 ' + fmt(v) + '（到 −500 會直接倒下，跟血量無關）。' + (lv === 2 ? '馬上喝提神藥、吃乾糧、找營火，或是趕快回地面。' : '找營火休息、喝提神藥或吃乾糧可以回復。'));
  };
  const downInRuin = () => {
    const w = W(), P = w.P; if (!P || P.dead || w.run.done) return;
    R.toast && R.toast('眼皮再也撐不開了……（疲乏-不行了：倒下）', '#F06A6A');
    set(MAX() * 0.3); P.hp = 0;
    try { R.onPlayerDown(); } catch (e) { console.warn('[fatigue]', e); }
    warned = 0;
    setTimeout(() => { R.banner && R.banner('因為太累倒下了', '疲憊值降到 −500：不是被打倒的。下次記得在營火休息、帶提神藥或乾糧。'); const b = document.querySelector('#r-sheet h2'); if (b && !document.getElementById('fat-why')) { const p = document.createElement('p'); p.id = 'fat-why'; p.className = 'note'; p.style.color = '#F06A6A'; p.textContent = '倒下的原因：疲憊值降到 −500（太累了），不是被打倒的。'; b.after(p); } }, 1200);
  };
  // 普攻（物理武器）
  const at0 = R.attack;
  if (at0) R.attack = (...a) => {
    const P = W().P, b = P ? P.atkCd : 1, r = at0(...a);
    try { if (P && live() && b <= 0 && P.atkCd > 0 && P.ws && P.ws.kind !== 'magic') spend(3); } catch (e) { }
    return r;
  };
  const rb0 = R.releaseBow;
  if (rb0) R.releaseBow = (...a) => { const P = W().P, ch = P && P.charging, r = rb0(...a); try { if (ch && live() && !P.charging) spend(3); } catch (e) { } return r; };
  // 技能
  const castFx = () => { const c = S().cls; if (c === 'bard' || c === 'priest') gain(15); else spend(2 + Math.floor(rnd() * 4)); };
  const us0 = R.useSkill;
  if (us0) R.useSkill = (...a) => { const P = W().P, b = P ? P.skillCd || 0 : 0, r = us0(...a); try { if (P && live() && (P.skillCd || 0) > b + 0.01) castFx(); } catch (e) { } return r; };
  const cs0 = R.castSlot;
  if (cs0) R.castSlot = (i, ...a) => {
    if (!i) return cs0(i, ...a);   // 0＝R.useSkill（上面算過）
    const P = W().P, b = P && P.skCd ? P.skCd[i] || 0 : 0, r = cs0(i, ...a);
    try { if (P && live() && P.skCd && (P.skCd[i] || 0) > b + 0.01) castFx(); } catch (e) { }
    return r;
  };
  // 翻滾
  const dg0 = R.dodge;
  if (dg0) R.dodge = (...a) => { const P = W().P, b = P ? P.dodgeCd || 0 : 0, r = dg0(...a); try { if (P && live() && (P.dodgeCd || 0) > b + 0.01) spend(3); } catch (e) { } return r; };
  // 受傷
  const hp0 = R.hurtPlayer;
  if (hp0) R.hurtPlayer = (...a) => { const P = W().P, b = P ? P.hp : 0, r = hp0(...a); try { if (P && live() && P.hp < b && P.hpMax > 0) spend(50 * (b - Math.max(0, P.hp)) / P.hpMax); } catch (e) { } return r; };
  // 回復藥
  const dr0 = R.drink;
  if (dr0) R.drink = k => { const s = S(), b = s && s.potions ? s.potions[k] || 0 : 0, r = dr0(k); try { if (k === 'hp' && s.potions && (s.potions[k] || 0) < b) gain(50); } catch (e) { } return r; };
  // 營火（每層樓梯區的營火：restfloor.js；第 0 層休息區：ruinplus.js）
  const in0 = R.interact;
  if (in0) R.interact = (...a) => {
    const w = W(); let it = null, C = null, used = false;
    try { it = R.nearestInteract && R.nearestInteract(); C = w.F && w.F.camp; used = !!(C && C.used); } catch (e) { }
    const r = in0(...a);
    try {
      if (it && live() && /營火旁休息/.test(it.label || '')) {
        const ok = /這一層一次/.test(it.label) ? !!(C && !used && C.used) : !(w.F && w.F.fatRest);
        if (ok) { if (w.F) w.F.fatRest = 1; gain(450); setTimeout(() => say('坐在火邊，肩膀慢慢放鬆了。', 450), 900); }
      }
    } catch (e) { console.warn('[fatigue]', e); }
    return r;
  };
  // ---------- 睡覺 ----------
  let inEndRun = false, noRest = 0, homeT = 0;
  const er0 = R.endRun;
  R.endRun = (...a) => { inEndRun = true; try { return er0(...a); } finally { inEndRun = false; } };
  document.addEventListener('click', e => { if (e.target && e.target.closest && e.target.closest('#hm-zz')) homeT = performance.now(); }, true);   // 家裡的棉被（home.js）
  const ad0 = R.advanceDays;
  R.advanceDays = n => {
    const r = ad0(n);
    try {
      const w = W();
      if (S() && n > 0 && !inEndRun && !noRest && !(w.town && w.town.rolling)) {
        const t = T(), home = performance.now() - homeT < 4000;
        set(MAX()); t.cafe = t.onsen = null; t.fresh = home ? t.clock + 6 : null;
        setTimeout(() => R.toast && R.toast('睡飽了，疲憊值回滿（' + fmt(get()) + '）' + (home ? '。自己的棉被最好睡：精神飽滿 6 小時（全數值 +3%）' : '') + '。', '#E8D080'), 2300);
      }
    } catch (e) { console.warn('[fatigue]', e); }
    return r;
  };
  // ---------- 吃東西、喝東西、溫泉 ----------
  const af0 = R.ateFood;
  R.ateFood = buff => {
    const r = af0 ? af0(buff) : undefined;
    try {
      const w = W(); if (!S() || !buff || (w.run && !w.town)) return r;
      const k = buff.kind;
      if (k === 'cafe') { gain(150); T().cafe = T().clock + 2; setTimeout(() => say('熱熱的喝下去，整個人醒過來了。接下來 2 小時疲憊值的消耗 −30%', 150), 600); }
      else if (k === 'drink') { gain(60); setTimeout(() => say('冰涼的飲料。', 60), 600); }
      else { const n = Math.round(k === 'yatai' ? 200 + rnd() * 100 : 250 + rnd() * 150); gain(n); setTimeout(() => say('吃飽了。', n), 600); }
    } catch (e) { console.warn('[fatigue]', e); }
    return r;
  };
  const on0 = R.onsen;
  if (on0) R.onsen = (...a) => { const s = S(), b = s && s.onsenDay, r = on0(...a); try { if (s && s.onsenDay !== b) { gain(600); T().onsen = T().clock + 12; setTimeout(() => say('泡得全身都軟了。接下來半天疲憊值的消耗 −20%', 600), 800); } } catch (e) { } return r; };
  // ---------- 城裡：每小時、坐著、打工、小遊戲（1 秒看一次） ----------
  const GAMES = ['ka-cv', 'cl-cv', 'mj-cv', 'pc-cv', 'sl-cv'];
  let lastH = null, lastJob = null, playT = 0, saveT = 0;
  setInterval(() => {
    try {
      const s = S(), w = W(); if (!s) return;
      if (!w.run && w.town) {
        const h = s.hour; if (lastH != null && h > lastH && h - lastH < 0.5) {
          const d = h - lastH;
          if (w.P && w.P.sit) { T().clock += d; gain(50 * d); } else hourly(d, h);
        }
        lastH = h;
        const jg = (s.stats && s.stats.jobGold) || 0; if (lastJob != null && jg > lastJob) { const n = 150 + Math.floor(rnd() * 151); spend(n); setTimeout(() => R.toast && R.toast('打工結束，腰好痠。（疲憊值 −' + n + '）', '#E8D080'), 1200); } lastJob = jg;
        if (GAMES.some(id => { const c = $(id); return c && c.isConnected && c.getClientRects().length > 0; })) { if (++playT >= 60) { playT = 0; spend(20 + Math.floor(rnd() * 11)); } }
        if (get() <= MIN && !w.paused) downInTown();
        if (++saveT >= 30) { saveT = 0; R.save && R.save(); }
      } else lastH = null;
      if (!w.run) fx();
    } catch (e) { console.warn('[fatigue]', e); }
  }, 1000);
  let downing = false;
  const downInTown = () => {
    if (downing || !R.fade) return; downing = true;
    R.toast && R.toast('眼前一黑……（疲乏-不行了）', '#F06A6A');
    R.fade(() => {
      try {
        const s = S(), w = W(), fee = Math.min(s.wallet || 0, 100); s.wallet = (s.wallet || 0) - fee;
        const h = (s.hour || 8) + 12, main = w.town && !w.town.ck && !w.town.hosu, d = main && s.home && R.homeDebug && R.homeDebug.door && R.homeDebug.door();
        set(MAX() * 0.5); const t = T(); t.cafe = t.onsen = t.fresh = null;
        noRest++; try { if (h >= 24) { if (d) s.pendingHour = h - 24; else s.hour = h - 24; R.advanceDays(1); } else if (d) s.pendingHour = h; else s.hour = h; } finally { noRest--; }
        lastH = null;
        if (d) R.enterTownNow(w.town.from, [d[0], d[1] + 1.2]);
        R.save && R.save();
        setTimeout(() => R.toast && R.toast((d ? '醒來的時候躺在自己家裡。好像是路過的人把你扛回來的' : '醒來的時候躺在附近診所的床上') + '。過了半天' + (fee ? '，付了 ' + fee + ' 費拉的謝禮' : '') + '。（疲憊值 ' + fmt(get()) + '）', '#E8D080'), 1500);
      } catch (e) { console.warn('[fatigue]', e); }
      downing = false;
    });
  };
  // ---------- 隨身用品：背包畫面裡吃、喝、搭帳篷 ----------
  const USE = [
    ['pot', 'wake', '喝', 300], ['pot', 'ration', '吃', 150], ['pot', 'tent', '搭起來睡', 0],
    ['gift', 'dango', '自己吃', 80], ['gift', 'dorayaki', '自己吃', 120], ['gift', 'tea', '自己泡來喝', 150]
  ];
  const owned = ([g, k]) => Math.floor(((g === 'pot' ? S().potions : S().gifts) || {})[k] || 0);
  const nameOf = ([g, k]) => (g === 'pot' ? (R.FAT_ITEMS && R.FAT_ITEMS[k] ? R.FAT_ITEMS[k].name : k) : k === 'tea' ? '驅寒茶' : (R.GIFTS && R.GIFTS[k] ? R.GIFTS[k].name : k));
  const use = row => {
    const s = S(), [g, k, , n] = row, box = g === 'pot' ? s.potions : s.gifts; if (!box || !(box[k] > 0)) return;
    if (k === 'tent') {
      const w = W(), P = w.P;
      if (!live()) { R.toast && R.toast('小帳篷是在遺跡裡過夜用的。城裡回家睡吧。'); return; }
      const awake = (w.enemies || []).some(e => !e.dead && !e.dormant && e.aggro && !(e.def && e.def.ai === 'luck') && Math.hypot(e.x - P.x, e.z - P.z) < 12);
      if (awake) { R.toast && R.toast('附近有遺跡生物在動，搭不了帳篷。', '#FF9A6A'); return; }
      box[k]--; R.closeSheet && R.closeSheet();
      const go = () => { const b = get(); set(b + MAX() * 0.8); T().cafe = T().onsen = null; R.save && R.save(); R.toast && R.toast('在硬硬的地上睡了一晚，背有點痛……疲憊值 ' + fmt(b) + ' → ' + fmt(get()) + '（小帳篷用壞了）', '#E8D080'); };
      if (R.fade) R.fade(go); else go();
      return;
    }
    box[k]--; gain(n); R.save && R.save(); R.sfx && R.sfx('drink');
    say(nameOf(row) + '：' + (k === 'wake' ? '苦得皺起眉頭，眼睛卻睜開了。' : k === 'ration' ? '嚼了好久才吞下去。' : '甜甜的，好像有點力氣了。'), n);
    R.bagSheet();
  };
  const bs0 = R.bagSheet;
  if (bs0) R.bagSheet = (...a) => {
    const r = bs0(...a);
    try {
      const sh = $('r-sheet'), m = $('r-modal'); if (!sh || !m || m.hidden || !S()) return r;
      const side = sh.querySelector('.tk-side'); if (!side || sh.querySelector('.fat-use')) return r;
      const L = USE.filter(x => owned(x) > 0), v = get();
      const box = document.createElement('div'); box.className = 'fat-use';
      box.innerHTML = '<h4>疲憊值 <b style="color:' + tierCol(v) + '">' + fmt(v) + '／' + fmt(MAX()) + '</b>・' + tierName(v) + '</h4>'
        + (L.length ? '<div class="fat-btns">' + L.map(x => '<button type="button" class="mini" data-fatuse="' + x[0] + ':' + x[1] + '" title="' + (x[3] ? '疲憊值 +' + x[3] : '遺跡裡：恢復 80%') + '">' + x[2] + nameOf(x) + '（' + owned(x) + '）</button>').join('') + '</div>'
          : '<p class="note">沒有隨身用品。白藤堂有賣提神藥、乾糧、小帳篷；糰子、銅鑼燒、驅寒茶也可以自己吃。</p>');
      side.appendChild(box);
      box.querySelectorAll('[data-fatuse]').forEach(b => { b.onclick = () => { const [g, k] = b.dataset.fatuse.split(':'); use(USE.find(x => x[0] === g && x[1] === k)); }; });
    } catch (e) { console.warn('[fatigue]', e); }
    return r;
  };
  // ---------- 顯示 ----------
  const YAWN = ['（打了一個大大的呵欠。）', '（眼皮有點重。）', '（揉了揉眼睛。）', '（腳步慢了下來。）'];
  let yawnT = 40, blinkT = 25, lastTxt = '';
  const veil = () => { let el = $('fat-fx'); if (!el) { el = document.createElement('div'); el.id = 'fat-fx'; el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:4;transition:opacity 1s;opacity:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 40%,rgba(10,6,4,.92) 100%)'; document.body.appendChild(el); } return el; };
  const blink = () => { let el = $('fat-blink'); if (!el) { el = document.createElement('div'); el.id = 'fat-blink'; el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:6;background:#000;opacity:0;transition:opacity .25s'; document.body.appendChild(el); } el.style.opacity = 0.92; setTimeout(() => { el.style.opacity = 0; }, 380); };
  const fx = () => {
    const s = S(), scr = $('run'), on = !!(s && scr && !scr.hidden && !W().paused), v = s ? get() : 0;
    veil().style.opacity = on && v <= -300 ? Math.min(0.75, 0.15 + (-300 - v) / 200 * 0.6) : 0;
    if (on && v < 0) {
      yawnT -= 0.25; if (yawnT <= 0) { yawnT = (v <= -300 ? 30 : 60) + rnd() * 60; R.toast && R.toast(YAWN[Math.floor(rnd() * YAWN.length)] + (v <= -150 ? '該找個地方休息了。' : ''), '#C8B898'); }
      if (v <= -300) { blinkT -= 0.25; if (blinkT <= 0) { blinkT = 15 + rnd() * 25; blink(); } }
    }
    // 左上角
    let el = $('r-fat');
    if (!el) { const tl = $('r-tl'); if (!tl) return; el = document.createElement('div'); el.id = 'r-fat'; el.className = 'glass r-misc'; el.style.cursor = 'pointer'; el.onclick = () => R.toast && R.toast('疲憊值：時間過去、打架、跑步、放技能都會掉；睡覺、營火、吃東西、溫泉、坐著休息會回來。0 以下會累，−150 全數值 −2%、−300 全數值 −5%，到 −500 會倒下。現在 ' + fmt(get()) + '／' + fmt(MAX()) + '（' + tierName(get()) + '）' + (fresh() ? '・精神飽滿' : '') + '。', '#E8D080'); tl.appendChild(el); }
    el.hidden = !(s && scr && !scr.hidden); if (el.hidden) return;
    const txt = '疲憊 <b style="color:' + tierCol(v) + '">' + fmt(v) + '</b>／' + fmt(MAX()) + (v < 0 ? '・' + tierName(v) : fresh() ? '・精神飽滿' : '');
    if (txt !== lastTxt) { el.innerHTML = txt; lastTxt = txt; }
    if (lastV != null && Math.sign(lastV + 0.001) !== Math.sign(v + 0.001) && v < 0) R.toast && R.toast('有點累了……（疲憊值 0 以下）', '#E8D07A');
    if (lastV != null && lastV > -150 && v <= -150) R.toast && R.toast('疲乏-好累……（全數值 −2%、移動速度 −5%）', '#F0A060');
    if (lastV != null && lastV > -300 && v <= -300) R.toast && R.toast('疲乏-快睡著了……（全數值 −5%、翻滾冷卻 +20%）。快去睡覺或休息！', '#F06A6A');
    lastV = v;
  };
  R.fatHud = fx;
  // 遺跡的狀態圖示
  (R.STATUS_EXTRA = R.STATUS_EXTRA || []).push((P, run, add) => {
    const v = get();
    if (v <= -150) add('fatigue', tierName(v), 'down', tierCol(v), v <= -300 ? ['全數值 −5%、移動速度 −5%', '翻滾冷卻 +20%、偶爾眼前一黑', '到 −500 會倒下'] : ['全數值 −2%、移動速度 −5%'], null, null, true, '疲憊值 ' + fmt(v) + '：睡覺、營火、吃東西可以回復');
    if (fresh()) add('fresh', '精神飽滿', 'star', '#FFE08A', ['全數值 +3%'], null, null, false, '在家裡的棉被睡過；醒著 ' + Math.max(0, T().fresh - T().clock).toFixed(1) + ' 小時內有效');
  });
  // 角色總數值
  const ch0 = R.charSheetHtml;
  if (ch0) R.charSheetHtml = (cls, opt) => { const h = ch0(cls, opt), v = get(); return h.replace('<h4>基本</h4>', '<h4>基本</h4><div class="cs-row"><span>疲憊值</span><b style="color:' + tierCol(v) + '">' + fmt(v) + '／' + fmt(MAX()) + '</b><small>' + tierName(v) + (fresh() ? '・精神飽滿（全數值 +3%）' : v <= -300 ? '：全數值 −5%' : v <= -150 ? '：全數值 −2%' : '') + '</small></div>'); };
  const css = document.createElement('style');
  css.textContent = '.fat-use{margin-top:8px;border-top:1px solid var(--line,#5A4A30);padding-top:6px}.fat-use h4{margin:0 0 4px;font-size:13px}.fat-btns{display:flex;flex-wrap:wrap;gap:4px}';
  document.head.appendChild(css);
})(window.R = window.R || {});
