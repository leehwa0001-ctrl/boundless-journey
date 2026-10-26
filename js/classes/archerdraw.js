// 弓箭手重做：所有普攻、傷害型技能都要續力（2026-10-13 作者）
// - 按住左鍵續力、放開發射；傷害型技能＝一種「箭矢」：按技能鍵換上（再按一次卸下），發射前都可以換。
// - 傷害與範圍照續力 %：0% 沒有效果，100%＝原本的 100%。沒有攻速加成時普攻 2 秒、技能 4 秒蓄滿。
// - 普攻每一發＝武器（不含攻速）2 秒的傷害：每秒傷害 20 的武器 → 一發 40。技能傷害 ×2.4（2026-10-13 翻倍）；蓄滿 100% 的箭 +20% 護甲穿透。
// - 短弓照舊；長弓續力時間 ×1.2、能續到 120%；弩續力時間 ×1.2、會自己蓄滿，蓄滿後點一下左鍵直接射出。
// - 每 1% 攻速＝續力速度 +0.75%（遊俠再 +0.25%）。
// - 遊俠：續力時間減半，普攻蓄滿自動射出再重新續力。破魔弓手：續力時間 ×2，蓄滿＝再 +150%（短弓 250%、長弓 290%），箭速 ×2。
//   魔弓手：蓄滿＝原本的 0.75 倍（短弓 75%、長弓 90%），可以連續蓄滿 3 次：技能連放、普攻箭矢數量加倍。
// - 非傷害型技能（強化、位移等）照舊直接放。冷卻和魔力在射出去的時候才扣。
// 放在所有包 R.useSkill／castSlot／attack／fire／hurtEnemy 的檔案後面（runedraw.js 之後）。
(function (R) {
  const W = () => R.W;
  const isA = P => !!(P && P.cls === 'archer' && P.ws && P.ws.kind === 'bow');
  const live = () => { const w = W(); return !!(w && w.run && !w.run.done && w.P && !w.P.dead && !w.paused); };
  const toast = (t, c) => R.toast && R.toast(t, c || '#9AE07A');
  const S = { p: 0, n: 0, load: null, hold: false, firing: false, cued: 0 };
  const slotId = (P, i) => (i === 0 ? P.skill : R.slotSkill ? R.slotSkill(P, i) : null);
  const reset = () => { S.p = 0; S.n = 0; S.cued = 0; S.load = null; S.hold = false; };
  R.archerReset = () => { reset(); hud(null); };
  R.archerDraw = S;

  // ---------- 武器、轉職的參數 ----------
  const baseOf = P => (P.item && P.item.base) || '';
  const wtype = P => { const b = baseOf(P), nm = (R.WEAPONS[b] && R.WEAPONS[b].name) || ''; if (b === 'crossbow' || /弩/.test(nm)) return 'cross'; if (b === 'longbow' || /長弓/.test(nm) || (R.WEAPONS[b] && R.WEAPONS[b].charge)) return 'long'; return 'short'; };
  const defRate = P => { const w = R.WEAPONS[baseOf(P)]; return (w && w.rate) || (P.ws && P.ws.rate) || 1; };
  const atkPct = P => Math.max(0, (P.ws.rate || 1) / defRate(P) - 1) * 100;
  const capOf = P => (wtype(P) === 'long' ? 1.2 : 1);
  const timeOf = P => {
    let t = 2;
    if (S.load != null) { const sk = R.SKILLS[slotId(P, S.load)], cd = (sk && sk.cd) || 0; t = cd <= 10 ? 2.5 : cd <= 20 ? 3 : 4; }   // 技能看「基礎冷卻」：10 秒內 2.5 秒、20 秒內 3 秒、更長 4 秒
    if (wtype(P) !== 'short') t *= 1.2;
    if (P.adv === 'ranger') t *= 0.5; else if (P.adv === 'hama') t *= 2;
    return t;
  };
  const speedOf = P => (1 + atkPct(P) * (P.adv === 'ranger' ? 1 : 0.75) / 100) * (P.drawSpd || 1);   // P.drawSpd：熟練度「技巧」（prof2.js）
  R.archerInfo = P => ({ type: wtype(P), cap: capOf(P), time: timeOf(P), speed: speedOf(P), atkPct: atkPct(P), hitAt100: (P.ws.dmg || 0) * defRate(P) * 2 });

  // ---------- 哪些技能算「箭矢」（傷害型） ----------
  const DMG_BUILTIN = { volley: 1, homing: 1, trap: 1, hamaya: 1, pin: 1 };
  const NOT_DMG = { leap: 1 };
  const kOf = p => !!p && ((p.k || 0) > 0 || (Array.isArray(p.parts) && p.parts.some(q => q && q[1] && (q[1].k || 0) > 0)));
  const isDmg = id => {
    if (!id || NOT_DMG[id]) return false; if (DMG_BUILTIN[id]) return true;
    const L = R.SKILL_LIB && R.SKILL_LIB[id];
    if (L) return kOf(L.p) || kOf(L);
    const d = (R.SKILLS[id] && R.SKILLS[id].desc) || '';
    return /傷害|射|箭|穿/.test(d) && !/^\d+ 秒內/.test(d);
  };
  R.archerIsArrow = isDmg;
  const cdOf = (P, i) => (i === 0 ? P.skillCd || 0 : (P.skCd && P.skCd[i]) || 0);
  const setCd = (P, i, v) => { if (i === 0) P.skillCd = v; else { P.skCd = P.skCd || [0, 0, 0]; P.skCd[i] = v; } };
  const nameOf = id => (R.SKILLS[id] && R.SKILLS[id].name) || id;

  // ---------- 續力的倍率：在這段時間裡打出去的傷害、範圍都照倍率 ----------
  let CTX = null;
  const within = (c, f) => {
    const prev = CTX, w = W(), dyn = w && w.dyn; CTX = c;
    let had = false; if (dyn) { had = Object.prototype.hasOwnProperty.call(dyn, 'push'); dyn.push = function (...fs) { return Array.prototype.push.apply(this, fs.map(g => (typeof g === 'function' ? (...a) => within(c, () => g(...a)) : g))); }; }
    try { return f(); } finally { CTX = prev; if (dyn && !had) delete dyn.push; }
  };
  const st0 = window.setTimeout;
  window.setTimeout = function (fn, ms, ...a) { if (CTX && typeof fn === 'function') { const c = CTX, g = fn; fn = (...b) => within(c, () => g(...b)); } return st0.call(window, fn, ms, ...a); };
  const fi0 = R.fire;
  R.fire = o => {
    if (CTX && o && o.owner === 'p') {
      o = Object.assign({}, o); o.dmg = (o.dmg || 0) * CTX.dmg; o.life = (o.life || 1.5) * CTX.area; if (o.radius) o.radius *= CTX.area;
      if (CTX.spd !== 1 && o.speed) { o.speed *= CTX.spd; o.life /= CTX.spd; }
      o._arch = 1; if (CTX.pen) { o.xPen = CTX.pen; if (o.pierce !== 99) o.pierce = (o.pierce || 0) + 1; }   // 2026-10-14 作者：弓本身不再貫穿；蓄滿 100% 的箭（普攻、技能箭）貫穿 +1，詞條照加
    }
    return fi0(o);
  };
  const he0 = R.hurtEnemy;
  // 2026-10-13：蓄滿的箭額外 +20% 護甲穿透（上限 95%）。投射物／爆炸用 o.xPen 帶過來（combat.js 傳下去）
  const withPen = (add, f) => { const P = W() && W().P; if (!P || !(add > 0)) return f(); const p0 = P.pen; P.pen = Math.min(0.95, (p0 || 0) + add); try { return f(); } finally { P.pen = p0; } };
  R.hurtEnemy = (e, raw, o) => withPen((o && o.xPen) || (CTX && CTX.pen) || 0, () => he0(e, CTX && !(o && (o.reflect || o.thorns)) ? raw * CTX.dmg : raw, o));
  const ao0 = R.aoe;
  R.aoe = (x, z, r, dmg, o) => ao0(x, z, CTX ? r * CTX.area : r, dmg, CTX && CTX.pen ? Object.assign({}, o, { xPen: CTX.pen }) : o);
  const az0 = R.addZone;
  if (az0) R.addZone = z => { if (CTX && z && z.dmg != null) { z.dmg *= CTX.dmg; if (z.r) z.r *= CTX.area; } return az0(z); };
  const me0 = R.melee;
  if (me0) R.melee = (a, range, ...rest) => me0(a, CTX ? range * CTX.area : range, ...rest);

  // ---------- 普攻、技能：攔下來改成「換箭」和「續力發射」 ----------
  const us0 = R.useSkill, cs0 = R.castSlot, at0 = R.attack;
  // 蓄滿提示／拒絕提示
  const cue = (P, n) => {
    try { R.sfx && R.sfx('archFull'); } catch (e) { }
    try { R.num && R.num(P.x, 2.5, P.z, n > 1 ? '蓄滿！×' + n : '蓄滿！', 'crit'); } catch (e) { }
    try { R.fx && R.fx('ring', P.x, 0.15, P.z, { r: 1.6, color: '#FFE08A' }); } catch (e) { }
    if (el) { el.classList.remove('ah-flash'); void el.offsetWidth; el.classList.add('ah-flash'); }
  };
  let denyT = 0;
  const deny = msg => { const t = performance.now(); if (t - denyT < 600) return; denyT = t; try { R.sfx && R.sfx('archDeny'); } catch (e) { } toast(msg, '#FFB45A'); };
  const loadArrow = i => {
    const P = W().P, id = slotId(P, i);
    if (wtype(P) !== 'cross') {   // 弩以外：續力中、蓄滿後都不能換箭（弩會自己蓄，隨時能換）
      const full = P.adv === 'arcane' ? S.n >= 1 : S.p >= capOf(P) - 1e-6;
      if (full) { deny('已經蓄滿，不能再換箭（放開射出）'); return; }
      if (S.hold && S.p > 0) { deny('續力中不能換箭，先放開'); return; }
    }
    if (S.load === i) { S.load = null; toast('卸下箭矢：普攻', '#C8C0B0'); return; }
    if (cdOf(P, i) > 0) { toast(nameOf(id) + ' 還在冷卻（' + cdOf(P, i).toFixed(1) + ' 秒）', '#FFB45A'); return; }
    const sk = R.SKILLS[id]; if (sk && P.mp < sk.mp) { toast('魔力不夠', '#FFB45A'); return; }
    S.load = i; toast('換上箭矢：' + nameOf(id));
  };
  const intercept = i => { const w = W(), P = w && w.P; if (S.firing || !isA(P) || !live()) return false; const id = slotId(P, i); if (!id || !isDmg(id)) return false; loadArrow(i); return true; };
  R.useSkill = (...a) => (intercept(0) ? undefined : us0(...a));
  R.castSlot = i => (i === 0 ? R.useSkill() : intercept(i) ? undefined : cs0(i));
  R.attack = (...a) => { const P = W().P; if (!S.firing && isA(P) && W().run) return; return at0(...a); };

  const shootNormal = (P, c) => {
    const ws = P.ws, ch = ws.charge, a0 = P.aimA;
    S.firing = true;
    try {
      within(c, () => {
        const n = c.reps || 1;
        for (let k = 0; k < n; k++) { P.atkCd = 0; ws.charge = 0; P.aimA = a0 + (n > 1 ? (k - (n - 1) / 2) * 0.09 : 0); at0(); }
      });
    } finally { ws.charge = ch; P.aimA = a0; P.charging = false; P.charge = 0; S.firing = false; }
  };
  const castOnce = (P, i) => { S.firing = true; try { if (i === 0) us0(); else cs0(i); } finally { S.firing = false; } };
  const shootSkill = (P, i, c) => {
    const id = slotId(P, i), sk = R.SKILLS[id];
    const cd0 = cdOf(P, i), mp0 = P.mp;
    within(c, () => castOnce(P, i));
    const ok = cdOf(P, i) > cd0 + 0.01 || P.mp < mp0 - 0.01;
    if (!ok) return false;
    const cdAfter = cdOf(P, i), reps = c.reps || 1;
    for (let k = 1; k < reps; k++) st0(() => {
      const w = W(); if (!live() || w.P !== P) return;
      const cdNow = cdOf(P, i), mpNow = P.mp; setCd(P, i, 0); if (sk) P.mp += sk.mp;
      within(c, () => castOnce(P, i));
      setCd(P, i, Math.max(cdNow, cdAfter)); P.mp = Math.min(P.mp, mpNow);
    }, 280 * k);
    return true;
  };
  // 這一箭的倍率
  const multOf = P => {
    const cap = capOf(P), c = Math.min(S.p, cap);
    if (P.adv === 'arcane') return S.n >= 1 ? { k: 0.75 * cap, reps: S.n } : { k: 0.75 * c, reps: 1 };
    if (P.adv === 'hama' && c >= cap - 1e-6) return { k: 2 * cap + 0.5, reps: 1 };
    return { k: c, reps: 1 };
  };
  R.archerMult = multOf;
  const fire = P => {
    const m = multOf(P);
    if (m.k < 0.01) { S.p = 0; S.n = 0; S.cued = 0; return; }
    const spd = P.adv === 'hama' ? 2 : 1;
    const cap = capOf(P), pen = (P.adv === 'arcane' ? S.n >= 1 : S.p >= cap - 1e-6) ? 0.2 : 0;   // 蓄滿 100%：+20% 護甲穿透
    if (S.load != null) {
      const i = S.load, id = slotId(P, i);
      if (!id || !isDmg(id)) { S.load = null; return; }
      if (cdOf(P, i) > 0) { toast(nameOf(id) + ' 還在冷卻', '#FFB45A'); return; }
      const ok = shootSkill(P, i, { dmg: m.k * 2.4, area: m.k, spd, reps: m.reps, pen }   /* 2026-10-13：技能傷害翻倍（1.2→2.4） */);
      if (!ok) { toast(nameOf(id) + ' 放不出來', '#FFB45A'); return; }
      S.load = null;
    } else shootNormal(P, { dmg: m.k * 2 * defRate(P), area: m.k, spd, reps: m.reps, pen });
    R.archerLast = { k: m.k, reps: m.reps, t: performance.now(), full: pen > 0 };   // full：拉滿弓（熟練度 prof2.js 看這個）
    S.p = 0; S.n = 0; S.cued = 0;
  };
  R.archerFire = () => { const P = W().P; if (isA(P)) fire(P); };

  // 2026-10-14 作者：主世界（城裡）不顯示續力條──城裡不跑 R.step，回城後續力條會留在畫面上；這裡另外每 0.25 秒檢查一次，不在戰鬥區（遺跡、狩獵場、訓練場）就收掉、清掉續力
  setInterval(() => { try { const w = W(), P = w && w.P; if (!el || el.style.display === 'none') return; if (!isA(P) || !w.run || w.run.done || w.town || P.dead) { reset(); hud(null); } } catch (e) { } }, 250);
  // ---------- 每一幀：續力 ----------
  const sp0 = R.step;
  R.step = dt => {
    const r = sp0(dt);
    try {
      const w = W(), P = w && w.P;
      if (!isA(P) || !w.run || P.dead || w.run.done) { reset(); hud(null); return r; }
      if (w.paused || (R.sheetOpen && R.sheetOpen())) { hud(null); return r; }
      const I = R.input || {}, hold = !!(I.fire || (I.keys && I.keys.f)) && !(R.sheetOpen && R.sheetOpen());
      P.charging = false;
      const cross = wtype(P) === 'cross', cap = capOf(P), arc = P.adv === 'arcane';
      if (S.load != null && !slotId(P, S.load)) S.load = null;
      const busy = P.knockT > 0 || P.stance > 0;
      if ((hold || cross) && !busy) {
        S.p += dt * speedOf(P) / timeOf(P);
        if (S.p >= cap) { if (arc && S.n < 3) { S.n++; S.p = S.n < 3 ? 0 : cap; } else S.p = cap; }
      }
      const full = arc ? S.n >= 1 : S.p >= cap - 1e-6;
      const lvl = arc ? S.n : (full ? 1 : 0);
      if (lvl > S.cued) { S.cued = lvl; cue(P, arc ? S.n : 1); }
      if (cross) { if (hold && !S.hold && full) fire(P); }
      else {
        if (!hold && S.hold) fire(P);
        else if (hold && P.adv === 'ranger' && S.load == null && full) fire(P);
      }
      S.hold = hold;
      hud(P);
    } catch (e) { console.warn('[archerdraw]', e); }
    return r;
  };

  // ---------- 畫面左側：續力條＋搭載的箭矢 ----------
  let el = null, last = '';
  const css = () => {
    const s = document.createElement('style');
    s.textContent = '#arch-hud{position:fixed;left:12px;bottom:190px;width:210px;z-index:30;pointer-events:none;font:13px/1.35 system-ui,sans-serif;color:#E8E2D0;background:rgba(18,22,20,.78);border:1px solid #6A7A58;border-radius:8px;padding:8px 10px;box-shadow:0 2px 10px rgba(0,0,0,.4)}'
      + '#arch-hud .ah-t{display:flex;justify-content:space-between;font-weight:700}#arch-hud .ah-t span{color:#BFE89A}'
      + '#arch-hud .ah-bar{position:relative;height:12px;margin:6px 0 4px;background:#2A2F28;border-radius:6px;overflow:hidden;border:1px solid #4A5442}'
      + '#arch-hud .ah-bar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#5E9A48,#BFE89A)}#arch-hud .ah-bar i.full{background:linear-gradient(90deg,#C8A040,#FFE08A)}'
      + '#arch-hud .ah-bar em{position:absolute;top:-2px;bottom:-2px;width:2px;background:#FFE08A}#arch-hud .ah-pips{display:flex;gap:4px;margin-bottom:4px}#arch-hud .ah-pips b{flex:1;height:6px;border-radius:3px;background:#333A30;border:1px solid #5A6650}#arch-hud .ah-pips b.on{background:#B89AFF}'
      + '#arch-hud .ah-l{display:flex;align-items:center;gap:6px;margin-top:4px}#arch-hud .ah-l i{width:22px;height:22px;border-radius:5px;display:grid;place-items:center;background:#2E3A28;border:1px solid #7A9A5A;font-style:normal}#arch-hud small{color:#A8A898}'
      + '#arch-hud.ah-flash{animation:ahF .5s ease-out}@keyframes ahF{0%{box-shadow:0 0 0 0 rgba(255,224,138,.95);border-color:#FFE08A}100%{box-shadow:0 0 0 14px rgba(255,224,138,0);border-color:#6A7A58}}'
      + '#arch-hud.ah-sm{width:170px;font-size:11px;padding:5px 8px}#arch-hud.ah-sm .ah-l small{display:none}#arch-hud.ah-sm .ah-bar{height:9px;margin:4px 0 3px}';
    document.head.appendChild(s);
  };
  const KEYN = i => (i === 0 ? 'R' : String(i + 2));
  function hud(P) {
    if (!P) { if (el) el.style.display = 'none'; return; }
    if (!el) { css(); el = document.createElement('div'); el.id = 'arch-hud'; document.body.appendChild(el); }
    el.style.display = '';
    const cap = capOf(P), arc = P.adv === 'arcane', m = multOf(P), max = cap;
    const pct = Math.round(m.k * 100), id = S.load != null ? slotId(P, S.load) : null;
    const t = wtype(P), wn = { short: '短弓', long: '長弓', cross: '弩' }[t];
    const marks = (cap > 1 ? '<em style="left:' + (100 / cap).toFixed(1) + '%"></em>' : '');
    const full = arc ? S.n >= 1 : S.p >= cap - 1e-6;
    const h = '<div class="ah-t"><b>續力・' + wn + '</b><span>' + pct + '%' + (m.reps > 1 ? ' ×' + m.reps : '') + '</span></div>'
      + '<div class="ah-bar"><i class="' + (full ? 'full' : '') + '" style="width:' + Math.min(100, S.p / max * 100).toFixed(1) + '%"></i>' + marks + '</div>'
      + (arc ? '<div class="ah-pips">' + [0, 1, 2].map(k => '<b class="' + (S.n > k ? 'on' : '') + '"></b>').join('') + '</div>' : '')
      + '<div class="ah-l"><i>' + (id ? '✦' : '➶') + '</i><div>' + (id ? R.esc(nameOf(id)) + ' <small>（' + KEYN(S.load) + '）</small>' : '普攻') + '<br><small>' + (t === 'cross' ? '蓄滿後點左鍵射出' : '按住左鍵續力、放開射出') + '</small></div></div>';
    if (h !== last) { el.innerHTML = h; last = h; }
    place();
  }
  // 貼在左下角角色資訊（#r-bl）上方；隊伍面板疊在上面時再往上
  function place() {
    const sm = !!R.touch || window.innerWidth <= 720 || window.innerHeight <= 480;
    el.classList.toggle('ah-sm', sm);
    let top = null, left = 12;
    const bl = document.getElementById('r-bl');
    if (bl && bl.offsetParent !== null) { const b = bl.getBoundingClientRect(); if (b.height) { top = b.top; left = Math.max(4, b.left); } }
    const pt = document.getElementById('r-party');
    if (pt && !pt.hidden && pt.offsetParent !== null && pt.classList.contains('hf-dock')) { const b = pt.getBoundingClientRect(); if (b.height && (top == null || b.top < top)) top = b.top; }
    const bot = top == null ? 190 : Math.max(8, window.innerHeight - top + 6);
    const bs = bot + 'px', ls = left + 'px';
    if (el.style.bottom !== bs) el.style.bottom = bs;
    if (el.style.left !== ls) el.style.left = ls;
  }

  // ---------- 說明文字 ----------
  const A = '按住左鍵續力、放開射出：傷害與範圍照續力（0%＝沒有、100%＝原本）。普攻 2 秒蓄滿、一發＝武器 2 秒的傷害；傷害型技能是「箭矢」：要在續力前按技能鍵換上（再按一次卸下），續力中、蓄滿後都不能換（弩例外），射出時才扣冷卻、魔力，傷害 +20%；蓄滿時間看技能基礎冷卻：10 秒內 2.5 秒、20 秒內 3 秒、更長 4 秒。蓄滿時會響一聲、跳「蓄滿！」。每 1% 攻速＝續力快 0.75%。長弓：續力慢 20%、能續到 120%。弩：續力慢 20%，會自己蓄滿，蓄滿後點左鍵射出。';
  try {
    if (R.CLASSES && R.CLASSES.archer) R.CLASSES.archer.desc = '短弓、長弓、弩。所有普攻、傷害型技能都要按住左鍵續力。';
    const ADD = { ranger: '續力：續力時間減半，普攻蓄滿自動射出；每 1% 攻速續力再快 0.25%。', hama: '續力：續力時間加倍，蓄滿時效果再 +150%（短弓 250%、長弓 290%），箭速 ×2。', arcane: '續力：蓄滿只有 0.75 倍（短弓 75%、長弓 90%），但能連續蓄滿 3 次：技能連放、普攻箭數加倍。' };
    ((R.ADV && R.ADV.archer) || []).forEach(a => { if (ADD[a.id] && a.desc.indexOf('續力：') < 0) a.desc += ADD[a.id]; });
    const reg = (R.REG || []).find(g => g.cls === 'archer');
    if (reg) reg.list.forEach(x => { x[1] = { shortbow: '射得快，續力沒有特別。', longbow: '續力慢 20%，能續到 120%。', crossbow: '會自己蓄滿，點一下就射。' }[x[0]] || x[1]; });
    const C = R.CORE && R.CORE.archer;
    if (C) {
      C.name = '續力';
      C.help = P => A + ({ arcane: '魔弓手：蓄滿 0.75 倍，可連續蓄滿 3 次（技能連放、普攻箭數加倍）。', ranger: '遊俠：續力時間減半，普攻蓄滿自動射出。', hama: '破魔弓手：續力時間加倍，蓄滿效果 +150%、箭速 ×2。' }[P && P.adv] || '');
      C.act = () => toast('弓箭手改成按住左鍵續力（畫面左邊的續力條）');
      C.step = () => { }; delete C.gauge;
    }
  } catch (e) { console.warn('[archerdraw] desc', e); }
})(window.R);

// 弓箭手換上技能箭的時候，地上畫出這支技能射出去會打到哪裡、多大（2026-10-15 作者）
// - 淡淡的外框＝蓄滿 100% 的範圍；裡面填色的＝現在蓄到的範圍（範圍照續力 % 變大，跟真的射出去一樣）。
// - 落點型（箭雨、投網、陷阱、標記）：準心處（照技能距離收進來）的圓；連射型：每一支箭飛出去的路線；自己身邊的：腳下的圓；直線、旋風：一條帶子。
(function (R) {
  const W = () => R.W, MAXL = 18;
  const BI = { volley: { type: 'at', p: { range: 12, r: 2.8 } }, trap: { type: 'at', p: { range: 8, r: 1.2 } }, homing: { type: 'shots', p: { n: 8, spread: 0.63, sp: 20, life: 1.6 } }, hamaya: { type: 'line', p: { len: 27, width: 0.5 } }, l30_archer: { type: 'at', p: { range: 14, r: 4 } } };
  let G = null, cFill, cRing, lines = [], lineFill = [];
  const mk = () => {
    const TH = window.THREE, w = W(); if (!TH || !w.scene) return false; if (G && G.parent === w.scene) return true;
    G = new TH.Group(); G.renderOrder = 3;
    const mat = (op) => new TH.MeshBasicMaterial({ color: '#9AE07A', transparent: true, opacity: op, depthWrite: false, side: TH.DoubleSide });
    cFill = new TH.Mesh(new TH.CircleGeometry(1, 40), mat(0.22)); cRing = new TH.Mesh(new TH.RingGeometry(0.95, 1, 48), mat(0.55));
    [cFill, cRing].forEach(m => { m.rotation.x = -Math.PI / 2; G.add(m); });
    const pg = new TH.PlaneGeometry(1, 1); pg.translate(0, 0.5, 0);
    lines = []; lineFill = [];
    for (let i = 0; i < MAXL; i++) { const o = new TH.Mesh(pg, mat(0.18)), f = new TH.Mesh(pg, mat(0.4)); [o, f].forEach(m => { m.rotation.x = -Math.PI / 2; G.add(m); }); lines.push(o); lineFill.push(f); }
    w.scene.add(G); return true;
  };
  const hideAll = () => { if (G) G.visible = false; };
  const specOf = id => { if (BI[id]) return BI[id]; const L = R.SKILL_LIB && R.SKILL_LIB[id]; if (L) return L.type === 'combo' ? ((L.p.parts || []).map(x => ({ type: x[0], p: x[1] || {} })).find(x => x.type !== 'buff') || null) : { type: L.type, p: L.p || {} }; return BI[id] || null; };
  const step0 = R.step;
  R.step = dt => {
    const r = step0(dt);
    try {
      const w = W(), P = w.P, S = R.archerDraw;
      if (!w.run || !P || P.dead || P.cls !== 'archer' || !S || S.load == null) { hideAll(); return r; }
      const id = P.cls === 'archer' ? (S.load === 0 ? P.skill : R.slotSkill ? R.slotSkill(P, S.load) : null) : null, sp = id && specOf(id);
      if (!sp || !mk()) { hideAll(); return r; }
      G.visible = true; const y = R.inTraining && R.inTraining() ? 0.27 : 0.07, k = Math.max(0.05, S.p || 0), p = sp.p, a = P.aimA;
      cFill.visible = cRing.visible = false; lines.forEach(m => { m.visible = false; }); lineFill.forEach(m => { m.visible = false; });
      const circle = (x, z, rr) => { cRing.visible = cFill.visible = true; cRing.position.set(x, y, z); cRing.scale.set(rr, rr, 1); cFill.position.set(x, y + 0.005, z); cFill.scale.set(rr * k, rr * k, 1); };
      const strip = (i, x, z, ang, len, wid) => { if (i >= MAXL) return; const o = lines[i], f = lineFill[i]; [o, f].forEach(m => { m.visible = true; m.position.set(x, y, z); m.rotation.z = ang + Math.PI; }); o.scale.set(wid, len, 1); f.scale.set(wid, len * k, 1); f.position.y = y + 0.005; };
      const aim = range => { const ax = P.aimX != null ? P.aimX : P.x + Math.sin(a) * range, az = P.aimZ != null ? P.aimZ : P.z + Math.cos(a) * range, d = Math.hypot(ax - P.x, az - P.z), q = d > range ? range / d : 1; return [P.x + (ax - P.x) * q, P.z + (az - P.z) * q]; };
      const t = sp.type;
      if (t === 'at' || t === 'mark' || t === 'zone' || t === 'hook') { const [x, z] = aim(p.range || 10); circle(x, z, (p.r || 1.5) + (p.scatter || 0)); }
      else if (t === 'nova' || t === 'aura' || t === 'storm') circle(P.x, P.z, p.r || 3);
      else if (t === 'chainx') circle(P.x, P.z, p.range || 10);
      else if (t === 'shots' || t === 'shotx') { const n = Math.min(MAXL, p.n || 1), spr = p.spread || 0.3, len = (p.sp || (t === 'shotx' ? 26 : 28)) * (p.life || 0.9); for (let i = 0; i < n; i++) { const aa = a + (n > 1 ? (spr >= 6 ? i / n * Math.PI * 2 : (i - (n - 1) / 2) * spr / (n - 1) * 2) : 0); strip(i, P.x, P.z, aa, len, 0.35); } }
      else if (t === 'line') strip(0, P.x, P.z, a, p.len || 6, (p.width || 0.6) * 2);
      else if (t === 'wave') strip(0, P.x, P.z, a, (p.n || 4) * (p.step || 1.5), (p.r || 1.2) * 2);
      else if (t === 'dash') strip(0, P.x, P.z, p.side ? a + Math.PI / 2 : a, p.len || 4, 0.8);
      else hideAll();
    } catch (e) { hideAll(); }
    return r;
  };
})(window.R);
