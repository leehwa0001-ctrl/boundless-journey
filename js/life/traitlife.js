// 特質的效果：城裡、花費、委託、好感度、犯罪、組隊（2026-10-15 作者《特質與熟練度》＋審查問題的答案）
// - 花費 R.cost(n, kind)：'goods' 商品（商店、市場、鐵匠的素材、餐廳、攤販）、'service' 花費（租車、擴建、霧島保險、黑市）、
//   'smith' 老岩的工（鑑定、精煉、重鑄、強化、附魔）、'hire' 僱用勇者（有單獨寫的就不吃「所有花費」）。
//   良民 商品 −5%、巧言 商品 −10%／僱用 −15%、受歡迎的 所有花費 −15%／僱用 −20%、低情商 商品 +5%／僱用 +5%、惡名遠洋 商人兩倍價（老岩也是）。
//   銀行、股票不算（Q25、F15）。
// - 好感度 R.affMul（people.js 的 gain，小數照算）：巧言 +10%、受歡迎的 +15%、低情商 −8%、惡名遠洋 −60%；低情商送到不喜歡的禮物 −1（people.js）。
// - 組隊：怕生、惡名遠洋 公會大廳的勇者全部不肯同行；怕生的重要角色要好感度 10 才肯（R.partyAffNeed）；
//   怕生、默默無名、惡名遠洋 遺跡裡遇到的勇者不會跟你組隊（不跳出邀請）。
// - 委託（guildtask.js 的 post）：「反饋率」＝五軌的第五項「反饋」（作者 2026-10-15）。良民 反饋 +10、英雄後裔 反饋 +35（最高 100，先加再封頂，F14）；
//   默默無名 反饋最高 70、惡名遠洋 反饋最高 25；其他四項照算，成績＝五項平均。
//   默默無名：完成 50 件 B 級以上、成績 60% 以上 → 解除（永久效果：名聲不帶來優惠——現在名聲本來就沒有優惠）；
//   惡名遠洋：完成 100 件 A 級以上、成績 70% 以上 → 解除。以前的紀錄也算（Q04）。
//   越戰越勇：完成一次遺跡的討伐委託、成績 70% 以上 +1 點（最多 150；以前的紀錄也算）。
// - 犯罪：良民 不能偷、扒、搶車、對勇者動手（props.js、streetcrime.js、vehicles.js、ckmove.js、這裡）、打不到遺跡裡的勇者（燒、毒、反傷這些被動的傷害照算）、
//   連線打不到其他玩家（pvp.js）。扒手 偷到的費拉 +35%、太靠近路人 15% 自己動手（同一個人離開畫面或進出建築前只判定一次，Q18、F12）、
//   被抓多關兩天、罰款 +45%；惡名遠洋 被抓的懲罰 ×3。邊緣／矚目 偷竊被發現 ∓15%、遺跡生物注意到你的距離 ∓10%（combat.js）。
// - 窮凶極「餓」：上次出遺跡以後在城裡吃過三種不同的東西才不餓（R.ateFood，各家餐廳、攤販、咖啡、販賣機都算；R.traitHungry 給 traitfx.js 的全屬性用）。
// - 黑市熟人：在遺跡倒下，回城後黑市商人把你掉的裝備（霧島還沒找回來的）用賣價 × 2.25 賣回給你（吃折扣）；錢不夠可以付 35% 訂金保留一天
//   （城裡的選單多一個「黑市」）。買回來的從霧島的清單拿掉（Q16）；沒買、沒保留的，有保險的照舊等霧島，沒保險的就沒了。隊友撿走的不能買。
// 放在 traitfx.js 後面（main.js 前面）。
(function (R) {
  const W = () => R.W, S = () => R.S, has = id => !!(R.hasTrait && R.hasTrait(id)), esc = s => R.esc(s), $ = id => document.getElementById(id);
  const tr = () => { const s = S(); s.traits = s.traits || { list: [], v: 1 }; return s.traits; };

  // ---------- 花費 ----------
  const goodsMul = () => (1 - (has('liangmin') ? 0.05 : 0) - (has('qiaoyan') ? 0.1 : 0) - (has('huanying') ? 0.15 : 0) + (has('diqingshang') ? 0.05 : 0)) * (has('eming') ? 2 : 1);
  const serviceMul = () => 1 - (has('huanying') ? 0.15 : 0);
  const hireMul = () => 1 - (has('qiaoyan') ? 0.15 : 0) - (has('huanying') ? 0.2 : 0) + (has('diqingshang') ? 0.05 : 0);
  R.spendMul = kind => (kind === 'service' ? serviceMul() : kind === 'smith' ? serviceMul() * (has('eming') ? 2 : 1) : kind === 'hire' ? hireMul() : goodsMul());
  R.cost = (n, kind) => (n > 0 ? Math.max(1, Math.round(n * R.spendMul(kind || 'goods'))) : n);
  const pm0 = R.priceMul;
  R.priceMul = shop => { const m = pm0 ? pm0(shop) : 1; return m == null ? m : m * goodsMul(); };
  ['idPrice', 'upgradePrice', 'refinePrice', 'reforgePrice', 'refinePlusPrice'].forEach(k => {
    const f = R[k]; if (typeof f !== 'function') return;
    R[k] = (...a) => { const v = f(...a); if (typeof v === 'number') return R.cost(v, 'smith'); if (v && typeof v === 'object' && typeof v.gold === 'number') return Object.assign({}, v, { gold: R.cost(v.gold, 'smith') }); return v; };
  });

  // ---------- 好感度、組隊 ----------
  R.affMul = () => Math.max(0, 1 + (has('qiaoyan') ? 0.1 : 0) + (has('huanying') ? 0.15 : 0) - (has('diqingshang') ? 0.08 : 0) - (has('eming') ? 0.6 : 0));
  R.partyAffNeed = () => (has('pasheng') ? 10 : 3);
  const noHeroes = () => has('pasheng') || has('eming');
  const NO_LINE = () => (has('eming') ? '「你就是那個……抱歉，我不想跟你扯上關係。」' : '（你張了張嘴，最後什麼也沒說出口。）');
  const fixRoster = () => { const s = S(); if (!s) return; (s.roster || []).forEach(m => { m.fee = R.cost((40 + (m.lv || 1) * 25) * (m.feeMul || 1), 'hire'); if (noHeroes()) { m.refuse = true; m.line = NO_LINE(); } }); };
  const mr0 = R.makeRecruit; if (mr0) R.makeRecruit = (...a) => { const m = mr0(...a); try { m.fee = R.cost(m.fee, 'hire'); if (noHeroes()) { m.refuse = true; m.line = NO_LINE(); } } catch (e) { } return m; };
  const sr0 = R.syncRecruitLv; if (sr0) R.syncRecruitLv = (...a) => { const r = sr0(...a); try { fixRoster(); } catch (e) { } return r; };
  const er0 = R.ensureRoster; if (er0) R.ensureRoster = (...a) => { const r = er0(...a); try { fixRoster(); } catch (e) { } return r; };
  const hi0 = R.hire; if (hi0) R.hire = i => { if (noHeroes()) { R.toast && R.toast(has('eming') ? '沒有勇者願意跟你同行。' : '你開不了口邀請別人。', '#F0A060'); return false; } return hi0(i); };
  const spr0 = R.spawnRivals;
  if (spr0) R.spawnRivals = (...a) => { const r = spr0(...a); try { const pa = W().rivalParty; if (pa && pa.mode === 'party' && (has('pasheng') || has('momo') || has('eming'))) pa.met = true; } catch (e) { } return r; };

  // ---------- 委託 ----------
  const LET = ['F', 'E', 'D', 'C', 'B', 'A', 'AA', 'S', 'SS', 'SSS', 'X', 'G'];
  const li = t => LET.indexOf(String(t.letter || 'F').split('～')[0]);
  R.traitTaskAxes = (s, t) => {
    if (s[4] == null) return s;
    let f = Math.min(100, s[4] + (has('liangmin') ? 10 : 0) + (has('yingxiong') ? 35 : 0));
    if (has('eming')) f = Math.min(25, f); if (has('momo')) f = Math.min(70, f);
    const o = s.slice(); o[4] = Math.max(1, f); return o;
  };
  R.traitTaskAvg = avg => avg;
  const raw = t => t.avg;
  const tally = () => {
    const ts = (S().tasks || []).filter(t => t.avg != null && !t.failed);
    return { momo: ts.filter(t => li(t) >= li({ letter: 'B' }) && raw(t) >= 60).length, eming: ts.filter(t => li(t) >= li({ letter: 'A' }) && raw(t) >= 70).length,
      yz: ts.filter(t => t.kind === 'hunt' && t.grade !== 'hunt' && raw(t) >= 70).length };
  };
  const drop = (id, msg) => { const T = tr(); T.list = T.list.filter(x => x !== id); if (id === 'momo') T.momoPerm = true; R.save && R.save(); setTimeout(() => R.banner && R.banner('特質解除：' + R.TRAITS[id].name, msg), 2400); };
  const check = () => {
    const c = tally(), T = tr();
    if (has('momo') && c.momo >= 50) drop('momo', '你的名字開始在公會裡被提起了。');
    if (has('eming') && c.eming >= 100) drop('eming', '一百件委託之後，大家終於願意正眼看你。');
    if (has('yuezhan')) T.yz = Math.min(150, c.yz);
  };
  R.onTaskPosted = () => { try { check(); } catch (e) { console.warn('[traitlife]', e); } };
  const tas0 = R.traitApplyStart; if (tas0) R.traitApplyStart = (...a) => { const r = tas0(...a); try { check(); } catch (e) { } return r; };

  // ---------- 犯罪 ----------
  R.stealGold = g => Math.round(g * (has('pashou') ? 1.35 : 1));
  R.aggroMul = () => 1 - (has('bianyuan') ? 0.1 : 0) + (has('zhumu') ? 0.1 : 0);
  let ck = R.crimeK;
  Object.defineProperty(R, 'crimeK', { configurable: true, get: () => { const m = 1 - (has('bianyuan') ? 0.15 : 0) + (has('zhumu') ? 0.15 : 0); return ck && m !== 1 ? Object.assign({}, ck, { seen: (ck.seen || 1) * m }) : ck; }, set: v => { ck = v; } });
  const ap0 = R.arrestPunish;
  if (ap0) R.arrestPunish = (...a) => {
    const s = S(), g0 = s.gold, d0 = s.day, r = ap0(...a);
    try {
      const paid = Math.max(0, g0 - s.gold), served = Math.max(0, s.day - d0);
      const fine = Math.round(paid * ((has('pashou') ? 0.45 : 0) + (has('eming') ? 2 : 0))), days = (has('pashou') ? 2 : 0) + (has('eming') ? served * 2 : 0);
      if (fine || days) { s.wallet = Math.max(0, (s.wallet || 0) - fine); if (days && R.advanceDays) R.advanceDays(days); R.save && R.save(); setTimeout(() => R.toast && R.toast((has('eming') ? '惡名遠洋：衛兵特別「照顧」你。' : '扒手的前科：') + (fine ? '罰款多 ' + fine + ' 費拉' : '') + (fine && days ? '、' : '') + (days ? '多關 ' + days + ' 天' : '') + '。', '#F0A060'), 600); }
    } catch (e) { console.warn('[traitlife]', e); }
    return r;
  };
  // 良民：對勇者動手的選項拿掉；打不到遺跡裡的勇者（被動的燒、毒、反傷照算）
  const ni0 = R.nearestInteract;
  if (ni0) R.nearestInteract = (...a) => { const r = ni0(...a); if (r && has('liangmin') && /^對.*動手$/.test(r.label || '')) return null; return r; };
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => { if (e && e.def && e.def.human && has('liangmin') && !e.questTarget && !(o && (o.dot || o.burn || o.reflect || o.thorns || o.poison))) return; return he0(e, raw, o); };
  // 扒手：太靠近路人時 15% 自己動手（每個人只判定一次；離開 25 公尺或換地圖才重算）
  const autoPick = () => {
    const w = W(), tw = w.town, P = w.P; if (!tw || !P || w.run || w.inside || !has('pashou') || !R.pickForce) return;
    [].concat(tw.npcs || [], tw.walkers || []).forEach(n => {
      if (!n || n.x == null) return; const d = Math.hypot(n.x - P.x, n.z - P.z);
      if (d > 25) { n._ppRoll = false; return; }
      if (d < 1.4 && !n._ppRoll) { n._ppRoll = true; if (Math.random() < 0.15 && R.pickForce(n)) R.toast && R.toast('（手自己伸了出去……）', '#E8A03A'); }
    });
  };
  const ts0 = R.townStep;
  if (ts0) R.townStep = dt => { const r = ts0(dt); try { autoPick(); } catch (e) { } return r; };

  // ---------- 窮凶極「餓」 ----------
  R.ateFood = buff => { try { const s = S(); if (!s || !buff || (W() && W().run)) return; const T = tr(), k = buff.kind + ':' + JSON.stringify(buff.b || {}); T.ate = T.ate || []; if (T.ate.indexOf(k) < 0) { T.ate.push(k); if (has('qiongxiong')) R.toast && R.toast('吃過 ' + Math.min(3, T.ate.length) + '／3 種（窮凶極「餓」）', '#E8C04A'); } } catch (e) { } };
  R.traitHungry = () => has('qiongxiong') && ((tr().ate || []).length < 3);
  const end0 = R.endRun;
  R.endRun = (...a) => { const r = end0(...a); try { if (S()) tr().ate = []; } catch (e) { } return r; };
  const st0 = R.startRun;
  R.startRun = (...a) => { const r = st0(...a); try { if (R.traitHungry()) setTimeout(() => R.toast && R.toast('肚子好餓……（窮凶極「餓」：這一趟全屬性 −35%，下次先在城裡吃三種不同的東西）', '#F0A060'), 1500); } catch (e) { } return r; };

  // ---------- 黑市熟人 ----------
  const rs0 = R.results;
  R.results = (ok, full, lost) => {
    const s = S(), before = !ok && s && has('heishi') ? Object.values(R.equipped(s.cls) || {}).filter(Boolean) : null;
    const r = rs0(ok, full, lost);
    try {
      if (before) {
        const gone = before.filter(it => !R.itemById(it.id));
        if (gone.length) { tr().bm = { day: s.day, list: gone.map(it => ({ it, price: R.cost(Math.round(R.sellPrice(it) * 2.25), 'service') })) }; R.save && R.save(); }
      }
    } catch (e) { console.warn('[traitlife]', e); }
    return r;
  };
  const insDrop = it => { (S().insReturn || []).forEach(x => { x.list = (x.list || []).filter(o => o.id !== it.id); }); };
  R.blackDealer = () => {
    const s = S(), T = tr(), bm = T.bm, hold = (T.bmHold || []).filter(x => x.until >= s.day); T.bmHold = hold;
    const rows = [];
    (bm ? bm.list : []).forEach((x, i) => rows.push('<div class="recipe"><b style="color:' + R.rarityColor(x.it) + '">' + esc(R.itemName(x.it)) + '</b><small>' + x.price + ' 費拉（訂金 ' + Math.ceil(x.price * 0.35) + '）</small><button type="button" class="btn pri" data-bmb="' + i + '"' + (s.gold < x.price ? ' disabled' : '') + '>買回來</button><button type="button" class="btn" data-bmh="' + i + '"' + (s.gold < Math.ceil(x.price * 0.35) ? ' disabled' : '') + '>付訂金保留一天</button></div>'));
    hold.forEach((x, i) => rows.push('<div class="recipe"><b style="color:' + R.rarityColor(x.it) + '">' + esc(R.itemName(x.it)) + '</b><small>保留到第 ' + x.until + ' 天，還要付 ' + (x.price - x.paid) + ' 費拉</small><button type="button" class="btn pri" data-bmp="' + i + '"' + (s.gold < x.price - x.paid ? ' disabled' : '') + '>付清帶走</button></div>'));
    R.sheet('<p class="kicker">黑市</p><h2>老相識的黑市商人</h2><p>「聽說你在下面栽了。你掉的東西，我先幫你收著了——價錢嘛，你懂的。」</p>' + (rows.length ? '<div class="recipes">' + rows.join('') + '</div>' : '<p class="note">現在沒有你的東西。</p>')
      + '<p class="note">身上有 ' + s.gold + ' 費拉。關掉以後，沒買也沒保留的就不在了（有保險的照舊等霧島）。</p>', '<div class="row"><button type="button" class="btn" id="bm2-x">走了</button></div>');
    $('bm2-x').onclick = () => { T.bm = null; R.save && R.save(); R.closeSheet(); };
    document.querySelectorAll('[data-bmb]').forEach(b => { b.onclick = () => { const x = bm.list[+b.dataset.bmb]; if (!x || s.gold < x.price) return; s.gold -= x.price; s.stash.push(x.it); insDrop(x.it); bm.list = bm.list.filter(y => y !== x); R.save && R.save(); R.sfx && R.sfx('coin'); R.blackDealer(); }; });
    document.querySelectorAll('[data-bmh]').forEach(b => { b.onclick = () => { const x = bm.list[+b.dataset.bmh], dep = x ? Math.ceil(x.price * 0.35) : 0; if (!x || s.gold < dep) return; s.gold -= dep; insDrop(x.it); hold.push({ it: x.it, price: x.price, paid: dep, until: s.day + 1 }); bm.list = bm.list.filter(y => y !== x); R.save && R.save(); R.blackDealer(); }; });
    document.querySelectorAll('[data-bmp]').forEach(b => { b.onclick = () => { const x = hold[+b.dataset.bmp]; if (!x || s.gold < x.price - x.paid) return; s.gold -= x.price - x.paid; s.stash.push(x.it); T.bmHold = hold.filter(y => y !== x); R.save && R.save(); R.sfx && R.sfx('coin'); R.blackDealer(); }; });
  };
  const hasBM = () => { const s = S(); if (!s || !s.traits) return false; const T = s.traits; return !!((T.bm && T.bm.list.length) || (T.bmHold || []).some(x => x.until >= s.day)); };
  const en0 = R.enterTownNow;
  if (en0) R.enterTownNow = (...a) => { const r = en0(...a); try { const T = S() && S().traits; if (T && T.bm && T.bm.list.length && !T.bm.shown) { T.bm.shown = true; setTimeout(() => { if (!(R.sheetOpen && R.sheetOpen())) R.blackDealer(); else R.toast && R.toast('黑市商人在等你（選單裡的「黑市」）。', '#E8C04A'); }, 2200); } } catch (e) { } return r; };
  const tm0 = R.townMenu;
  if (tm0) R.townMenu = (...a) => { const r = tm0(...a); try { if (hasBM()) { const row = $('r-sheet') && $('r-sheet').querySelector('.row'); if (row && !$('tm-bm')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'tm-bm'; b.textContent = '黑市'; b.onclick = () => R.blackDealer(); row.appendChild(b); } } } catch (e) { } return r; };
})(window.R);
