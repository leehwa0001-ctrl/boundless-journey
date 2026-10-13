// 2026-10-14 召喚師：召喚技能放出來之後技能格一直亮著（作者：「讓召喚師所有召喚生物的技能在召喚後維持長亮的狀態，要按住該技能按鍵才會解除召喚物(只點擊的話無任何效果)，並在召喚物被解除或被殺死後才進入冷卻。」）
// - 這一格的召喚物還在場：技能格亮綠框、不顯示冷卻；點一下沒反應（萬獸師例外：點一下再疊一隻，維持萬獸師的人海戰術）。
// - 按住這一格的技能鍵（R／右鍵、3～6，跟著按鍵設定）0.5 秒＝解除這一格的召喚物（退回一半召喚魔力，式神使 80%，跟按住 X 收回一樣）；手機長按技能格。
// - 這一格的召喚物都走了（解除、被打倒、魔力見底散掉、按住 X 收回全部）才開始算冷卻。
// 放在 summoncraft.js、skillbook.js、skills.js 等所有包 R.castSlot／R.useSkill 的檔案後面（包在最外層）。
(function (R) {
  const W = () => R.W, $ = id => document.getElementById(id);
  const isS = P => !!(P && P.cls === 'summoner'), adv = P => (P && P.adv) || '';
  const live = () => { const w = W(); return !!(w && w.run && !w.run.done && w.P && !w.P.dead); };
  const pets = () => (R.PETS || []).filter(p => !p.gone && p.left > 0);
  const mine = i => pets().filter(p => p.slot === i);
  const cdGet = (P, i) => (i === 0 ? P.skillCd || 0 : (P.skCd && P.skCd[i]) || 0);
  const cdSet = (P, i, v) => { if (i === 0) P.skillCd = v; else { P.skCd = P.skCd || [0, 0, 0, 0, 0]; P.skCd[i] = v; } };
  const slotEl = i => $(i === 0 ? 'r-skill' : 'r-skill' + (i + 1));
  const ACT = {}, HOLD = {};   // ACT[i]：這一格的召喚物在場；HOLD[i]：等召喚物走了才開始的冷卻
  R.summonSlotLive = i => !!ACT[i];
  let depth = 0;
  const wrap = (f, slotOf) => function (...a) {
    const P = W() && W().P; if (!isS(P) || depth || !live()) return f.apply(this, a);
    const i = slotOf(a);
    if (ACT[i] && mine(i).length && adv(P) !== 'beastlord') return;   // 點一下：沒有任何效果
    const n0 = mine(i).length; depth++; let r; try { r = f.apply(this, a); } finally { depth--; }
    if (mine(i).length > n0) { const cd = cdGet(P, i); HOLD[i] = Math.max(HOLD[i] || 0, cd); cdSet(P, i, 0); ACT[i] = 1; }
    return r;
  };
  if (R.castSlot) R.castSlot = wrap(R.castSlot, a => (typeof a[0] === 'number' ? a[0] : 0));
  if (R.useSkill) R.useSkill = wrap(R.useSkill, () => 0);
  // 解除這一格
  const dismiss = i => {
    const P = W().P, L = mine(i); if (!isS(P) || !L.length) return;
    const k = adv(P) === 'shikigami' ? 0.8 : 0.5; let mp = 0;
    L.forEach(p => { mp += (p.mp0 || 0) * k; p.left = 0; R.fx && R.fx('poof', p.x, 0.6, p.z, { color: '#B8E07A', n: 8 }); });
    P.mp = Math.min(P.mpMax, P.mp + mp);
    R.num && R.num(P.x, 2.8, P.z, '解除 ×' + L.length + (mp >= 1 ? '（+' + Math.round(mp) + ' 魔力）' : ''), 'heal');
  };
  // 每一刻：在場就亮著、冷卻壓住；走光了才開始冷卻
  const tick = () => {
    const w = W(), P = w && w.P, on = isS(P) && live();
    for (let i = 0; i < 5; i++) {
      const el = slotEl(i);
      if (on && ACT[i]) {
        if (mine(i).length) cdSet(P, i, 0);
        else { cdSet(P, i, Math.max(cdGet(P, i), HOLD[i] || 0)); delete ACT[i]; delete HOLD[i]; }
      } else if (!on) { delete ACT[i]; delete HOLD[i]; }
      if (el) el.classList.toggle('sm-live', !!(on && ACT[i]));
      litBox(i, el, !!(on && ACT[i]));
    }
    drawRing();
  };
  // 亮框＋「在場」（放在 body 上，不會被快捷列裁掉）
  const lits = [];
  const litBox = (i, el, on) => {
    let d = lits[i];
    if (!on || !el || !el.offsetParent) { if (d) d.style.display = 'none'; return; }
    if (!d) { d = lits[i] = document.createElement('div'); d.className = 'sm-lit'; d.innerHTML = '<em>在場</em>'; document.body.appendChild(d); }
    const rc = el.getBoundingClientRect(), L = mine(i), is = L.length && L[0].is != null ? '　[IS：' + L[0].is + ']' : '', tx = '在場' + (L.length && L[0].ghost ? '・無敵' : '') + is;
    if (d.firstChild.textContent !== tx) d.firstChild.textContent = tx;
    Object.assign(d.style, { display: 'block', left: (rc.left - 3) + 'px', top: (rc.top - 3) + 'px', width: (rc.width + 6) + 'px', height: (rc.height + 6) + 'px' });
  };
  // 按住的進度圈
  let hold = null, ring = null;   // hold = { i, t0 }
  const HOLD_MS = 500;
  const drawRing = () => {
    if (!hold) { if (ring) ring.style.display = 'none'; return; }
    const el = slotEl(hold.i); if (!el || !el.offsetParent) return;
    if (!ring) { ring = document.createElement('div'); ring.className = 'sm-ring'; document.body.appendChild(ring); }
    const rc = el.getBoundingClientRect(), s = Math.max(rc.width, rc.height) + 10, f = Math.min(1, (performance.now() - hold.t0) / HOLD_MS);
    Object.assign(ring.style, { display: 'block', left: (rc.left + rc.width / 2 - s / 2) + 'px', top: (rc.top + rc.height / 2 - s / 2) + 'px', width: s + 'px', height: s + 'px', background: 'conic-gradient(#B8E07A ' + (f * 360) + 'deg, rgba(20,24,18,.55) 0deg)' });
  };
  const startHold = i => { const P = W().P; if (!isS(P) || !live() || !ACT[i] || !mine(i).length || hold) return; hold = { i, t0: performance.now() }; hold.T = setTimeout(() => { const h = hold; hold = null; drawRing(); if (h && ACT[h.i]) dismiss(h.i); }, HOLD_MS); drawRing(); };
  const endHold = i => { if (!hold || (i != null && hold.i !== i)) return; const h = hold; clearTimeout(h.T); hold = null; drawRing(); if (performance.now() - h.t0 >= HOLD_MS && ACT[h.i]) dismiss(h.i); };   // 計時器被延遲（電腦很忙）也照放開的時間算
  const KEY = { r: 0, '3': 1, '4': 2, '5': 3, '6': 4 };   // keybinds.js 會把換過的鍵轉成這些邏輯鍵
  const typing = e => { const t = e.target; return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable); };
  let keyHeld = false;
  window.addEventListener('keydown', e => { const i = KEY[(e.key || '').toLowerCase()]; if (i == null || e.repeat || typing(e)) return; if (ACT[i]) keyHeld = true; startHold(i); }, true);
  window.addEventListener('keyup', e => { const i = KEY[(e.key || '').toLowerCase()]; if (i != null) { keyHeld = false; endHold(i); } }, true);
  window.addEventListener('mousedown', e => { if (e.button === 2 && e.target && e.target.id === 'gl') startHold(0); }, true);
  window.addEventListener('mouseup', e => { if (e.button === 2) endHold(0); }, true);
  // 手機／滑鼠：長按技能格
  const slotOfEl = t => { const b = t && t.closest && t.closest('#r-skill,#r-skill2,#r-skill3,#r-skill4,#r-skill5'); if (!b) return null; return b.id === 'r-skill' ? 0 : +b.id.slice(7) - 1; };
  ['pointerdown', 'touchstart'].forEach(t => window.addEventListener(t, e => { const i = slotOfEl(e.target); if (i != null && ACT[i]) startHold(i); }, { capture: true, passive: true }));
  ['pointerup', 'pointercancel', 'touchend', 'touchcancel'].forEach(t => window.addEventListener(t, () => { if (hold && !keyHeld) endHold(); }, true));
  window.addEventListener('blur', () => endHold());
  // 技能說明
  const hint = '放出來之後技能格會一直亮著；點一下沒有效果（萬獸師：點一下再疊一隻），按住這個技能鍵 0.5 秒（手機長按技能格）解除這一格的召喚物，召喚物都走了（解除或被打倒）才開始冷卻。';
  const descFix = () => { const L = R.SKILL_LIB || {}; Object.keys(L).forEach(id => { const sk = R.SKILLS && R.SKILLS[id]; if (!sk || sk._shold || !L[id] || L[id].cls !== 'summoner' || !(R.isSummonSkill && R.isSummonSkill(id))) return; sk._shold = 1; sk.desc = String(sk.desc || '') + hint; }); };
  try { descFix(); } catch (e) { }
  try {
    const css = document.createElement('style');
    css.textContent = '.sm-live{filter:none!important;opacity:1!important}'
      + '.sm-lit{position:fixed;z-index:40;pointer-events:none;display:none;border:2px solid #B8E07A;border-radius:8px;box-shadow:0 0 10px 2px rgba(184,224,122,.6),inset 0 0 10px rgba(184,224,122,.35);animation:smlit 1.4s ease-in-out infinite}'
      + '.sm-lit em{position:absolute;left:50%;top:-9px;transform:translateX(-50%);font:bold 10px/1.3 sans-serif;font-style:normal;color:#0d140a;background:#B8E07A;border-radius:3px;padding:0 4px;white-space:nowrap}'
      + '@keyframes smlit{50%{box-shadow:0 0 16px 4px rgba(184,224,122,.85),inset 0 0 12px rgba(184,224,122,.5)}}'
      + '.sm-ring{position:fixed;z-index:41;pointer-events:none;border-radius:50%;display:none;-webkit-mask:radial-gradient(circle,transparent 62%,#000 64%);mask:radial-gradient(circle,transparent 62%,#000 64%)}';
    document.head.appendChild(css);
  } catch (e) { }
  setInterval(tick, 50);
})(window.R);
