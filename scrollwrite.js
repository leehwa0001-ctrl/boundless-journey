// 符卷師：自己寫卷軸（2026-10-04 作者：卷軸派改為可以自己寫卷軸，他的裝備可以有毛筆、牛皮紙，要戰鬥前可以放在背包裡有寫好的卷軸，
//   高級的可以寫得更快；卷軸派的攻擊會扣錢）
// - 白藤堂多一張「符卷師的書桌」：買牛皮紙（素材 parchment，一張 4 費拉），一張紙寫一張卷軸。
//   寫的時候有進度條：職業等級越高、手上拿毛筆（稀有度越高越快）、轉職過的，寫得越快。
//   寫好的卷軸（R.S.scrolls）放在背包裡，最多 20＋等級／2 張，下遺跡自動帶著。
// - 遺跡裡，符卷師放技能：先用寫好的卷軸（一張，冷卻 −20%：預先寫好的零前搖）；沒有就現場寫——扣錢（4＋等級／8 費拉），沒錢就放不出來。
// - 普攻：卷軸、符紙、牛皮紙是真的紙，每打 6 下扣 1 費拉（紙錢）；毛筆是在空中寫字，不扣錢。
// - 新武器「牛皮紙」（一次兩張、比卷軸重）。遺跡裡左上角顯示卷軸還有幾張。
// 2026-10-13 作者：符卷師重做（諾克薩派）——
// - 符卷書：用跟術士同一套咒文編排（活力-聚合-定點-控制）編咒（城裡選單、暫停選單、書桌的「符卷書」），在書桌上把咒「寫」到牛皮紙上：
//   一張紙寫一張咒卷（S.scrollBag：咒文 → 張數）。寫的時間照咒文長度（每文 +8%）。
// - 戰鬥中：綁了咒的技能格＝撕開一張那句咒的卷軸：零前搖、不耗魔力（紙錢在寫的時候已經付了），冷卻照咒；
//   0.6 秒內連撕＝齊發：每多一張傷害 +15%（最多 +45%；諾克薩的傳人 +30%、最多 +90%）。
//   沒綁咒的格照舊放原本的技能（先用一般卷軸 S.scrolls、冷卻 −20%；沒有也照放）。戰鬥中所有扣錢的都拿掉了（現寫、普攻紙錢）。
// - 魔力濃的遺跡（克森特級以上）：撕卷時 4% 失敗（卷軸燒掉）、每 8 秒 3% 機率背包裡的一張咒卷自己發動。
// - 轉職：封印師可以寫「斷序符」（咒文 Mmˊ×3，撕開打斷附近敵人 1.2 秒）；抄寫師可以寫 Gmˊ 雙用卷（一張紙撕兩次、寫的時間 ×2）；
//   諾克薩的傳人：齊發加成加倍，連撕第 3 張起 25% 不消耗。
// - 舊存檔：一般卷軸 S.scrolls 照留（展卷、原本的技能還是用它），什麼都不會掉。
// 放在 classes2.js、gearmore.js、skillbook.js、skillpoints.js、hub.js 後面。
(function (R) {
  const W = () => R.W, S = () => R.S, $ = id => document.getElementById(id), esc = s => R.esc(s);
  const PRICE = 4, PAPER = { scrollb: 1, talisman: 1, parchment: 1 };
  R.WEAPONS.parchment = { name: '牛皮紙', cls: ['scroll'], kind: 'magic', dmg: 13, pellets: 2, rate: 1.5, speed: 18, range: 13, mp: 1.5, spread: 0.3 };
  if (R.WEAPON_LOOK) R.WEAPON_LOOK.parchment = 'scrollb';
  R.ICON_EXTRA = Object.assign(R.ICON_EXTRA || {}, { parchment: ({ rc }) => { rc(2, 3, 12, 10, '#D8C098'); rc(2, 3, 12, 1, '#A8885A'); rc(2, 12, 12, 1, '#A8885A'); rc(4, 6, 8, 1, '#5A3A2A'); rc(4, 8, 6, 1, '#5A3A2A'); rc(10, 9, 2, 2, '#C83A3A'); } });
  R.MATS.parchment = R.MATS.parchment || { name: '牛皮紙', color: '#D8C098', value: 2, desc: '符卷師寫卷軸用的紙。白藤堂有賣。' };
  const lvOf = () => { const s = S(); return s && s.classes[s.cls] ? s.classes[s.cls].lv : 1; };
  const cap = () => 20 + Math.floor(lvOf() / 2);
  const improv = () => 4 + Math.floor(lvOf() / 8);
  // 寫一張要幾秒
  const secPer = () => {
    const s = S(), st = s.classes[s.cls] || {}, eq = R.equipped(s.cls), wp = eq && eq.weapon;
    const brush = wp && wp.base === 'brush' ? 0.5 + 0.15 * (wp.rarity || 0) : 0;
    return Math.max(0.35, 2.4 / (1 + (lvOf() - 1) / 30 + brush + (st.adv ? 0.3 : 0)));
  };
  R.scrollInfo = () => ({ have: (S() && S().scrolls) || 0, cap: cap(), sec: secPer(), improv: improv() });
  // ---------- 書桌 ----------
  let job = null;
  const desk = () => {
    const s = S(), have = s.scrolls || 0, paper = s.mats.parchment || 0, room = Math.max(0, cap() - have), can = Math.min(room, paper), sp = secPer();
    const wb = n => '<button type="button" class="btn' + (n === can ? ' pri' : '') + '" data-sw="' + n + '"' + (can < 1 || job ? ' disabled' : '') + '>寫 ' + n + ' 張</button>';
    R.sheet('<p class="kicker">白藤堂・二樓</p><h2>符卷師的書桌</h2><p class="note">掌櫃：「桌子借你用，紙要買。」一張牛皮紙寫一張卷軸。寫好的放在背包裡，下遺跡自動帶著；放技能時先用寫好的（冷卻短一點），用完了照樣能放（沒有卷軸的冷卻加成）——每次 ' + improv() + ' 費拉。</p>'
      + '<div class="recipes"><div class="recipe"><b>寫好的卷軸 ' + have + '／' + cap() + ' 張</b><small>寫一張要 ' + sp.toFixed(1) + ' 秒（等級越高、拿著毛筆、轉職過的，寫得越快）</small><div class="meter" style="margin:6px 0"><i id="sw-bar" style="width:0%"></i></div><small id="sw-st">' + (job ? '寫字中……' : '') + '</small></div>'
      + '<div class="recipe"><b>牛皮紙 ' + paper + ' 張</b><small>一張 ' + PRICE + ' 費拉（身上 ' + s.gold + ' 費拉）</small><div class="row"><button type="button" class="btn" data-pb="5"' + (s.gold < PRICE * 5 ? ' disabled' : '') + '>買 5 張</button><button type="button" class="btn" data-pb="20"' + (s.gold < PRICE * 20 ? ' disabled' : '') + '>買 20 張</button></div></div></div>'
      + '<div class="row">' + [1, 5].filter(n => n < can).map(wb).join('') + (can >= 1 ? wb(can) : '<small>' + (room < 1 ? '背包裡的卷軸滿了。' : '沒有牛皮紙。') + '</small>') + '</div>',
      '<div class="row">' + (job ? '<button type="button" class="btn" id="sw-stop">停筆</button>' : '') + '<button type="button" class="btn" id="sw-x">好了</button></div>');
    $('sw-x').onclick = () => { stop(); R.closeSheet(); R.hub(); };
    const sb = $('sw-stop'); if (sb) sb.onclick = () => { stop(); desk(); };
    document.querySelectorAll('[data-pb]').forEach(b => { b.onclick = () => { const n = +b.dataset.pb; if (s.gold < PRICE * n) return; s.gold -= PRICE * n; s.mats.parchment = (s.mats.parchment || 0) + n; R.save(); R.sfx && R.sfx('coin'); desk(); }; });
    document.querySelectorAll('[data-sw]').forEach(b => { b.onclick = () => start(+b.dataset.sw); });
    try { inject(); } catch (e) { console.warn('[scrollwrite]', e); }
  };
  // ---------- 書桌：把符卷書裡的咒寫成咒卷 ----------
  let job2 = null, dbl = false;
  const glyphN = code => (String(code).match(/[A-Z][a-zˊ]*/g) || []).length;
  const inject = () => {
    const s = S(), rc = document.querySelector('#r-sheet .recipes') || document.querySelector('.recipes'); if (!rc || s.cls !== 'scroll' || !R.spellBook || !R.spellKit) return;
    const K = R.spellKit, b = R.spellBook(), B = bagS(), paper = s.mats.parchment || 0, adv = (s.classes.scroll && s.classes.scroll.adv) || '';
    const d = document.createElement('div'); d.className = 'recipe'; d.id = 'sw-spells';
    const row = (x, i) => {
      let r = null; try { r = K.evalSpell(K.parse(x.code, x.n), { P: W().P || { lv: lvOf(), adv } }); } catch (e) { }
      const dx = r && K.hasSt(r.sp, 'Dx'), bad = !r || r.errs.length || (dx && adv !== 'sealer');
      const t = secPer() * (1 + 0.08 * glyphN(x.code)) * (dbl ? 2 : 1);
      return '<div style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:3px 0"><b style="min-width:6em">' + esc(x.n) + '</b><small style="opacity:.75">' + esc(x.code) + '・' + (B[x.code] || 0) + ' 張・' + t.toFixed(1) + ' 秒' + (dx ? (adv === 'sealer' ? '・斷序符' : '・斷序符只有封印師能寫') : '') + (r && r.errs.length ? '・咒文有誤' : '') + '</small>'
        + [1, 5].map(n => '<button type="button" class="btn" data-sk="' + i + '" data-n="' + n + '"' + (bad || paper < 1 || job2 || job ? ' disabled' : '') + '>寫 ' + n + '</button>').join('') + '</div>';
    };
    d.innerHTML = '<b>咒卷（符卷書裡的咒）</b><small>一張牛皮紙寫一張；寫好的咒卷綁在技能格上，戰鬥中撕開＝零前搖、不耗魔力。</small>'
      + b.spells.map(row).join('')
      + '<div class="row">' + (adv === 'scribe' ? '<label style="font-size:12px"><input type="checkbox" id="sw-dbl"' + (dbl ? ' checked' : '') + '> Gmˊ 雙用卷（撕兩次、寫的時間 ×2）</label>' : '') + '<button type="button" class="btn" id="sw-book">符卷書（編咒、綁技能格）</button>' + (job2 ? '<button type="button" class="btn" id="sw-stop2">停筆</button>' : '') + '</div>'
      + '<div class="meter" style="margin:6px 0"><i id="sw-bar2" style="width:0%"></i></div><small id="sw-st2"></small>';
    rc.appendChild(d);
    const cb = $('sw-dbl'); if (cb) cb.onchange = () => { dbl = cb.checked; desk(); };
    $('sw-book').onclick = () => { R.closeSheet && R.closeSheet(); R.openSpellBook && R.openSpellBook(); };
    const st2 = $('sw-stop2'); if (st2) st2.onclick = () => { stop2(); desk(); };
    d.querySelectorAll('[data-sk]').forEach(btn => { btn.onclick = () => start2(b.spells[+btn.dataset.sk], +btn.dataset.n); });
  };
  const bagS = () => { const s = S(); s.scrollBag = s.scrollBag && typeof s.scrollBag === 'object' ? s.scrollBag : {}; return s.scrollBag; };
  const stop2 = () => { if (job2) { clearInterval(job2.iv); job2 = null; } };
  const start2 = (x, n) => {
    stop2(); const s = S(), sp = secPer() * (1 + 0.08 * glyphN(x.code)) * (dbl ? 2 : 1), uses = dbl ? 2 : 1; let left = n, t = 0;
    job2 = { iv: setInterval(() => {
      const bar = $('sw-bar2'), st = $('sw-st2'); if (!bar) { stop2(); return; }
      t += 0.1; bar.style.width = Math.min(100, t / sp * 100) + '%';
      if (t >= sp) {
        t = 0; const B = bagS();
        if ((s.mats.parchment || 0) < 1) left = 0; else { s.mats.parchment--; B[x.code] = (B[x.code] || 0) + uses; left--; R.sfx && R.sfx('pick'); }
        if (st) st.textContent = '「' + x.n + '」寫好了 ' + (n - left) + '／' + n + ' 張';
        if (left <= 0) { stop2(); R.save(); R.toast('咒卷寫好了：「' + x.n + '」' + (B[x.code] || 0) + ' 張。', '#C8A85A'); desk(); }
      }
    }, 100) };
    desk();
  };
  const stop = () => { if (job) { clearInterval(job.iv); job = null; } };
  const start = n => {
    stop(); const s = S(), sp = secPer(); let left = n, t = 0;
    job = { iv: setInterval(() => {
      const bar = $('sw-bar'), st = $('sw-st'); if (!bar) { stop(); return; }
      t += 0.1; bar.style.width = Math.min(100, t / sp * 100) + '%';
      if (t >= sp) {
        t = 0; if ((s.mats.parchment || 0) < 1 || (s.scrolls || 0) >= cap()) { left = 0; } else { s.mats.parchment--; s.scrolls = (s.scrolls || 0) + 1; left--; R.sfx && R.sfx('pick'); }
        if (st) st.textContent = '寫好了 ' + (n - left) + '／' + n + ' 張（背包裡 ' + (s.scrolls || 0) + ' 張）';
        if (left <= 0) { stop(); R.save(); R.toast('卷軸寫好了：背包裡有 ' + (s.scrolls || 0) + ' 張。', '#C8A85A'); desk(); }
      }
    }, 100) };
    desk();
  };
  R.scrollDesk = desk;
  const hub0 = R.hub;
  R.hub = (t, f) => {
    hub0(t, f);
    try {
      const body = $('hub-body'), h2 = body && body.querySelector('h2'); if (!h2 || h2.textContent !== '白藤堂' || body.querySelector('#sw-open')) return;
      const s = S(), mine = s.cls === 'scroll';
      const d = document.createElement('div'); d.className = 'recipe';
      d.innerHTML = '<b>符卷師的書桌</b><small>' + (mine ? '寫好的卷軸 ' + (s.scrolls || 0) + '／' + cap() + ' 張・牛皮紙 ' + (s.mats.parchment || 0) + ' 張' : '符卷師才用得到：買牛皮紙、自己寫卷軸。') + '</small><button type="button" class="btn' + (mine ? ' pri' : '') + '" id="sw-open">' + (mine ? '寫卷軸' : '看看') + '</button>';
      h2.parentNode.insertBefore(d, h2.nextSibling.nextSibling || null);
      $('sw-open').onclick = desk;
    } catch (e) { console.warn('[scrollwrite]', e); }
  };
  // ---------- 遺跡裡：沒綁咒的技能先用一般卷軸（冷卻 −20%）；不扣錢 ----------
  const cdOf = (P, i) => (i === 0 ? P.skillCd || 0 : (P.skCd && P.skCd[i]) || 0);
  const cdSet = (P, i, v) => { if (i === 0) P.skillCd = v; else if (P.skCd) P.skCd[i] = v; };
  const wrapCast = (fn, slotOf) => (...a) => {
    const w = W(), P = w.P, s = S(), i = slotOf(...a);
    if (!P || P.cls !== 'scroll' || !w.run || !s || i == null) return fn(...a);
    const K = R.spellKit; if (K && K.boundK(P, i) >= 0) return fn(...a);   // 咒卷格：spellcraft.js 處理
    const before = cdOf(P, i), have = (s.scrolls || 0) > 0;
    const r = fn(...a);
    if (have && cdOf(P, i) > before + 0.01) { s.scrolls--; cdSet(P, i, cdOf(P, i) * 0.8); }
    return r;
  };
  R.useSkill = wrapCast(R.useSkill, () => 0);
  const cs0 = R.castSlot;
  if (cs0) { const w2 = wrapCast(cs0, i => (i === 0 ? null : i)); R.castSlot = i => (i === 0 ? cs0(i) : w2(i)); }   // 第一格會再叫 R.useSkill，不要算兩次
  // ---------- 咒卷：撕開 ----------
  const bag = bagS;
  R.scrollBag = bag;
  const CT = () => (R.coreTime ? R.coreTime() : performance.now() / 1000);
  const manaRich = () => { const r = W().run; return !!(r && r.grade && (r.grade.lv || 0) >= 4); };
  const TR = { t: -9, n: 0 };
  const tearOne = (P, sp, why, slot) => {
    const K = R.spellKit, r = K.evalSpell(sp, K.ctxFor(P, -1, true));
    if (r.errs.length) return false;
    const st = (R.S && R.S.classes && P.adv) || '', nx = P.adv === 'noxa';
    if (why !== 'self') { if (CT() - TR.t < 0.6) TR.n++; else TR.n = 1; TR.t = CT(); }
    const per = nx ? 0.3 : 0.15, cap = nx ? 0.9 : 0.45, k = why === 'self' ? 1 : 1 + Math.min(cap, per * (TR.n - 1));
    r.dmg *= k; r.cast = 0;
    if (K.hasSt(sp, 'Dx')) {   // 斷序符
      const big = P.adv === 'sealer';
      (W().enemies || []).forEach(e => { if (!e.dead && Math.hypot(e.x - P.x, e.z - P.z) < (big ? 7 : 5) + e.def.size * 0.5) { e.st.stun = Math.max(e.st.stun || 0, e.def.boss ? 0.4 : big ? 1.2 : 0.6); if (e.cd != null) e.cd = Math.max(e.cd, big ? 1.5 : 0.8); } });
      R.fx && R.fx('ring', P.x, 0.1, P.z, { r: big ? 7 : 5, color: '#F2E6A0' }); R.num && R.num(P.x, 2.6, P.z, '斷序符', 'crit');
    } else K.release(P, r, slot == null ? 0 : slot);
    if (TR.n >= 2 && why !== 'self') R.num && R.num(P.x, 3, P.z, '齊發 ×' + TR.n, 'crit');
    return r;
  };
  R.scrollTear = (P, slot, k) => {
    const K = R.spellKit, s = S(); if (!K || !s) return;
    if ((P.lv || 1) < K.UNLOCK(slot)) { R.toast('職業等級 ' + K.UNLOCK(slot) + ' 才會打開這一格'); return; }
    if (K.cdGet(P, slot) > 0 || P.dead || P.knockT > 0) return;
    const x = R.spellBook().spells[k]; if (!x) return;
    const B = bag(), n = B[x.code] || 0;
    if (n < 1) { R.toast('沒有寫好的「' + x.n + '」卷軸（到白藤堂的書桌寫）'); return; }
    const sp = K.curSpell(k); if (!sp) return;
    const keep = P.adv === 'noxa' && CT() - TR.t < 0.6 && TR.n >= 2 && Math.random() < 0.25;
    if (!keep) { B[x.code] = n - 1; if (B[x.code] <= 0) delete B[x.code]; }
    if (manaRich() && Math.random() < 0.04) { R.num && R.num(P.x, 2.6, P.z, '卷軸燒掉了', 'hurt'); R.fx && R.fx('poof', P.x, 1.2, P.z, { color: '#C8A85A', n: 10 }); K.cdSet(P, slot, 0.5); return; }
    const r = tearOne(P, sp, 'tear', slot); if (!r) { R.toast('這句咒有誤，撕不開'); return; }
    K.cdSet(P, slot, r.cd * (P.skillCdMult || 1)); R.sfx && R.sfx('skill');
  };
  // 魔力濃的遺跡：咒卷自己發動
  let selfT = 8;
  const st9 = R.step;
  R.step = dt => {
    const r = st9(dt);
    try {
      const w = W(), P = w && w.P, s = S();
      if (P && P.cls === 'scroll' && w.run && !w.paused && !P.dead && manaRich() && R.spellKit) {
        selfT -= dt; if (selfT <= 0) { selfT = 8; const B = bag(), L = Object.keys(B).filter(c => B[c] > 0); if (L.length && Math.random() < 0.03) { const c = L[Math.floor(Math.random() * L.length)]; B[c]--; if (B[c] <= 0) delete B[c]; R.toast('魔力太濃：一張咒卷自己發動了', '#E8C878'); tearOne(P, R.spellKit.parse(c), 'self', 0); } }
      }
    } catch (e) { }
    return r;
  };
  // ---------- 左上角 ----------
  const st0 = R.step; let hudT = 0;
  R.step = dt => {
    st0(dt); hudT -= dt; if (hudT > 0) return; hudT = 0.5;
    const w = W(), s = S(), on = !!(w.run && !w.run.done && s && s.cls === 'scroll'); let el = $('r-scrolls');
    if (!on) { if (el) el.hidden = true; return; }
    if (!el) { const tl = $('r-tl'); if (!tl) return; el = document.createElement('div'); el.id = 'r-scrolls'; el.className = 'glass r-misc'; tl.appendChild(el); }
    el.hidden = false; const n = s.scrolls || 0, B = bag(), m = Object.values(B).reduce((a, b) => a + b, 0), txt = '卷軸 <b>' + n + '</b>・咒卷 <b>' + m + '</b>';
    if (el.dataset.t !== txt) { el.innerHTML = txt; el.dataset.t = txt; }
  };
  // 職業核心說明
  const patchCore = () => { const CS = R.CORE && R.CORE.scroll; if (!CS || CS._swDone) return; CS._swDone = 1;
    const h0 = CS.help, g0 = CS.gauge.bind(CS);
    CS.help = P => '諾克薩派：在白藤堂的書桌把符卷書裡的咒寫成咒卷，技能格綁上咒＝撕開那張咒卷（零前搖、不耗魔力）；0.6 秒內連撕＝齊發（每張 +' + (P.adv === 'noxa' ? 30 : 15) + '%）。克森特級以上的遺跡魔力太濃，咒卷偶爾會失敗或自己發動。 ' + (typeof h0 === 'function' ? h0(P) : '')
      + ({ sealer: '封印師：可以寫斷序符（Mmˊ×3），打斷附近的敵人 1.2 秒。', scribe: '抄寫師：可以寫 Gmˊ 雙用卷。', noxa: '諾克薩的傳人：齊發加成加倍，連撕第 3 張起 25% 不消耗。' }[P.adv] || '');
    CS.gauge = function (P) { const g = g0(P), B = bagS(), m = Object.values(B).reduce((a, b) => a + b, 0); g.text = '卷軸 ' + ((S() && S().scrolls) || 0) + '・咒卷 ' + m + ' 張'; return g; };
  };
  patchCore(); window.addEventListener('load', patchCore); const st8 = R.step; R.step = dt => { patchCore(); return st8(dt); };
})(window.R);
