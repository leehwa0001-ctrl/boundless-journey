// 手機操控優化（2026-10-13 作者：手機版的操控幫我優化，而且好像不能橫式玩）
// 只在觸控裝置（R.touch）生效，電腦版完全不動。
// - 橫式：瀏海那一側的安全區（左右）也讓開；iOS 轉橫時字會自動放大，關掉；弓箭手的續力條在手機上移到不擋按鈕的地方。
// - 按鈕：照拇指大小重新排（大小、透明度可調），可以左右對調（左手模式）。
// - 浮動搖桿：左半邊畫面任何地方按下去就是搖桿的中心。
// - 技能按鈕：點一下照舊直接放；按住拖曳可以瞄準方向，拖到上方「取消」放開就不放。
// - 右搖桿：按住不拖＝自動瞄準最近的敵人攻擊（弓箭手就是按住續力、放開射出）。
// - 有東西可以互動時「互動」鈕會亮；擋掉雙擊放大、雙指縮放、長按選單、選取文字。
// - 震動回饋（可關）。設定在畫面右上「操控」。
(function (R) {
  if (!R || !R.touch) return;
  const W = () => R.W, $ = id => document.getElementById(id);
  const KEY = 'tf_mobile_ctl';
  const DEF = { size: 1, alpha: 1, lefty: false, float: true, autoAim: true, vibe: true };
  let O = Object.assign({}, DEF); try { Object.assign(O, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { }
  const saveO = () => { try { localStorage.setItem(KEY, JSON.stringify(O)); } catch (e) { } apply(); };
  const buzz = ms => { if (O.vibe && navigator.vibrate) try { navigator.vibrate(ms); } catch (e) { } };

  // ---------- 版面 ----------
  const css = document.createElement('style');
  const SL = 'env(safe-area-inset-left)', SR = 'env(safe-area-inset-right)';
  css.textContent = ''
    + 'html{-webkit-text-size-adjust:100%;text-size-adjust:100%}'
    + 'body.touch{touch-action:manipulation;-webkit-tap-highlight-color:transparent}'
    + 'body.touch #run,body.touch #run *{-webkit-touch-callout:none;-webkit-user-select:none;user-select:none}'
    + 'body.touch #run{position:fixed;inset:0;height:100dvh}'
    // 上方 HUD 讓開瀏海
    + 'body.touch #r-tl{margin-left:' + SL + '}body.touch #r-tr{margin-right:' + SR + '}'
    // 按鈕：照 --u（按鈕大小）重新排
    + 'body.touch{--mcu:calc(52px * var(--mbs,1));--mcg:8px}'
    + 'body.touch #r-br .act{width:var(--mcu);height:var(--mcu);font-size:calc(11px * var(--mbs,1));border-radius:12px;opacity:var(--mba,1)}'
    + 'body.touch #r-br .act.big{width:calc(var(--mcu) * 1.25);height:calc(var(--mcu) * 1.25)}'
    + 'body.touch .joy{opacity:var(--mba,1)}'
    + 'body.touch #r-skill{right:var(--r);bottom:var(--b)}'
    + 'body.touch #r-skill2{right:calc(var(--r) + var(--mcu) * 1.25 + var(--mcg));bottom:var(--b)}'
    + 'body.touch #r-skill3{right:calc(var(--r) + var(--mcu) * 2.25 + var(--mcg) * 2);bottom:var(--b)}'
    + 'body.touch #r-skill4{right:calc(var(--r) + var(--mcu) * 1.25 + var(--mcg));bottom:calc(var(--b) + var(--mcu) + var(--mcg))}'
    + 'body.touch #r-skill5{right:calc(var(--r) + var(--mcu) * 2.25 + var(--mcg) * 2);bottom:calc(var(--b) + var(--mcu) + var(--mcg))}'
    + 'body.touch #r-br [data-tact="dodge"]{right:calc(var(--r) + var(--js) + var(--mcg));bottom:calc(var(--b0) + var(--mcu) + var(--mcg))}'
    + 'body.touch #r-br [data-tact="use"]{right:calc(var(--r) + var(--js) + var(--mcg));bottom:var(--b0)}'
    + 'body.touch #r-br [data-tact="run"]{left:var(--l);bottom:var(--b)}'
    + 'body.touch #r-br [data-tact="hp"]{left:calc(var(--l) + var(--mcu) + var(--mcg));bottom:var(--b)}'
    + 'body.touch #r-br [data-tact="bag"]{left:calc(var(--l) + var(--mcu) * 2 + var(--mcg) * 2);bottom:var(--b)}'
    + 'body.touch #r-br [data-tact="order"]{left:calc(var(--l) + var(--js) + var(--mcg));bottom:var(--b0)}'
    + 'body.touch #run.town #r-br [data-tact="use"]{right:var(--r);bottom:var(--b0);width:calc(var(--mcu) * 1.25);height:calc(var(--mcu) * 1.25)}'
    // 有東西可以互動：互動鈕亮起來
    + 'body.touch #r-br [data-tact="use"].mc-hot{border-color:#E8C46A;box-shadow:0 0 0 2px rgba(232,196,106,.55),0 0 14px rgba(232,196,106,.6);color:#FFE6A0}'
    + 'body.touch #r-br .act.mc-down{filter:brightness(1.35);transform:scale(.94)}'
    // 浮動搖桿
    + 'body.touch #joy-l.mc-float{transition:none}'
    // 技能拖曳瞄準
    + '#mc-aim{position:fixed;z-index:60;pointer-events:none;left:0;top:0;width:0;height:0}'
    + '#mc-aim i{position:absolute;height:4px;background:linear-gradient(90deg,rgba(232,196,106,.2),#E8C46A);border-radius:2px;transform-origin:0 50%}'
    + '#mc-aim b{position:absolute;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;border:2px solid #E8C46A;background:rgba(232,196,106,.25)}'
    + '#mc-cancel{position:fixed;z-index:60;left:50%;top:calc(10px + env(safe-area-inset-top));transform:translateX(-50%);padding:10px 22px;border-radius:24px;background:rgba(20,14,16,.85);border:2px solid #8A3A3A;color:#F0C8C8;font:700 14px system-ui;pointer-events:none}'
    + '#mc-cancel.on{background:#B23A3A;color:#fff;border-color:#FF8A8A}'
    // 設定
    + '#mc-set{position:fixed;inset:0;z-index:80;display:grid;place-items:center;background:rgba(0,0,0,.55)}'
    + '#mc-set .box{width:min(360px,92vw);max-height:92dvh;overflow:auto;background:#1A1620;border:1px solid #6A5A3A;border-radius:12px;padding:14px 16px;color:#EDE4D0;font:14px system-ui}'
    + '#mc-set h3{margin:0 0 8px;color:#E8C46A;font-size:16px}#mc-set .r{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0}'
    + '#mc-set .seg{display:flex;gap:4px}#mc-set .seg button,#mc-set .ok{min-width:44px;min-height:38px;border-radius:8px;border:1px solid #5A4A3A;background:#2A2430;color:#EDE4D0;font:600 13px system-ui}'
    + '#mc-set .seg button.on{background:#7A5A2A;border-color:#E8C46A}#mc-set .ok{width:100%;margin-top:10px}'
    // 左手模式：按鈕整排鏡射、搖桿對調
    + 'body.touch.mc-lefty #r-br{transform:scaleX(-1)}body.touch.mc-lefty #r-br>*{transform:scaleX(-1)}body.touch.mc-lefty #r-br>.mc-down{transform:scaleX(-1) scale(.94)}'
    + 'body.touch.mc-lefty #joy-l:not(.mc-float){left:auto;right:calc(var(--e) + ' + SR + ')}body.touch.mc-lefty #joy-r{right:auto;left:calc(var(--e) + ' + SL + ')}'
    // 弓箭手續力條：手機直式放在左邊中間（角色卡下面）、橫式放上方中間，不擋按鈕
    + 'body.touch #arch-hud{left:calc(8px + ' + SL + ');top:42%;width:170px;padding:5px 8px;font-size:12px}'
    + 'body.touch.mc-lefty #arch-hud{left:auto;right:calc(8px + ' + SR + ')}'
    + '@media (orientation:landscape) and (max-height:520px){'
    + 'body.touch{--mcu:calc(46px * var(--mbs,1));--mcg:6px}'
    + 'body.touch #arch-hud,body.touch.mc-lefty #arch-hud{left:50%;right:auto;top:calc(6px + env(safe-area-inset-top));bottom:auto;transform:translateX(-50%);width:200px}'
    + 'body.touch #arch-hud>*:not(:first-child):not(:nth-child(2)){display:none}'
    + 'body.touch #r-tl{margin-left:' + SL + '}'
    + 'body.touch.mc-lefty #r-br .ul-btn{top:auto!important;bottom:var(--b)!important;right:calc(var(--r) + var(--mcu) * 3.25 + var(--mcg) * 3)!important;left:auto!important}'
    + '#hub>.bar{padding-top:4px;padding-bottom:4px;padding-left:max(12px,' + SL + ');padding-right:max(12px,' + SR + ');min-height:0}#hub>.bar h1{font-size:18px}#hub>.bar .tab,#hub>.bar .iconbtn{min-height:34px;padding-top:4px;padding-bottom:4px}'
    + '#hub .hub-stat{padding:3px 16px;font-size:12px;padding-left:max(16px,' + SL + ')}#hub .hub-body{padding:10px max(12px,' + SR + ') 10px max(12px,' + SL + ')}'
    + '.sheet,.sheet.wide{box-sizing:border-box;max-height:calc(100dvh - 12px - env(safe-area-inset-top) - env(safe-area-inset-bottom))!important}'
    + '}';
  document.head.appendChild(css);
  const apply = () => {
    const b = document.body; if (!b) return;
    b.style.setProperty('--mbs', O.size); b.style.setProperty('--mba', O.alpha);
    b.classList.toggle('mc-lefty', !!O.lefty);
  };

  // ---------- 擋掉瀏覽器手勢 ----------
  const inPlay = () => { const r = $('run'); return !!r && !r.hidden && (!!W().run || !!W().town); };
  ['gesturestart', 'gesturechange'].forEach(t => document.addEventListener(t, e => { if (inPlay()) e.preventDefault(); }, { passive: false }));
  document.addEventListener('touchmove', e => { if (inPlay() && e.touches.length > 1) e.preventDefault(); }, { passive: false });
  document.addEventListener('contextmenu', e => { if (inPlay()) e.preventDefault(); });
  document.addEventListener('selectstart', e => { if (inPlay() && !(e.target.closest && e.target.closest('input,textarea'))) e.preventDefault(); });

  // ---------- 右搖桿按住不拖：自動瞄準 ----------
  const I = R.input; let rawFire = !!I.fire, holdR = null;
  Object.defineProperty(I, 'fire', { configurable: true, get: () => rawFire || autoFire(), set: v => { rawFire = !!v; } });
  function autoFire() {
    if (!holdR || !W().run || W().town) return false;
    const s = I.aimStick; if (s && Math.hypot(s.x, s.y) > 0.35) return false;
    return true;
  }
  const aimNearest = () => {
    const P = W().P; if (!P || !R.nearestEnemy) return;
    const t = R.nearestEnemy(P.x, P.z, 16); if (!t) return;
    P.aimA = Math.atan2(t.x - P.x, t.z - P.z); P.aimX = t.x; P.aimZ = t.z;
  };
  const tick = () => { requestAnimationFrame(tick); if (holdR && O.autoAim && autoFire()) aimNearest(); };
  requestAnimationFrame(tick);
  const watchR = () => {
    const el = $('joy-r'); if (!el) return;
    el.addEventListener('touchstart', e => { holdR = e.changedTouches[0].identifier; if (O.autoAim) aimNearest(); buzz(8); }, { passive: true });
    const end = e => { for (const t of e.changedTouches) if (t.identifier === holdR) holdR = null; };
    el.addEventListener('touchend', end); el.addEventListener('touchcancel', end);
  };

  // ---------- 浮動搖桿：左半邊任何地方按下去 ----------
  const watchFloat = () => {
    const cv = $('gl'), joy = $('joy-l'), knob = $('knob-l'); if (!cv || !joy) return;
    let id = null, cx = 0, cy = 0;
    const side = x => O.lefty ? x > innerWidth * 0.55 : x < innerWidth * 0.45;
    const upd = t => { const m = joy.offsetWidth / 2 - 8; let dx = t.clientX - cx, dy = t.clientY - cy; const d = Math.hypot(dx, dy); if (d > m) { dx = dx / d * m; dy = dy / d * m; } knob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)'; I.moveStick = { x: dx / m, y: dy / m }; };
    cv.addEventListener('touchstart', e => {
      if (!O.float || id !== null || !inPlay() || (R.sheetOpen && R.sheetOpen())) return;
      const t = e.changedTouches[0]; if (!side(t.clientX)) return;
      e.preventDefault(); id = t.identifier; cx = t.clientX; cy = t.clientY;
      const h = joy.offsetWidth / 2; joy.classList.add('mc-float');
      joy.style.left = (cx - h) + 'px'; joy.style.top = (cy - h) + 'px'; joy.style.right = 'auto'; joy.style.bottom = 'auto';
      upd(t);
    }, { passive: false });
    cv.addEventListener('touchmove', e => { for (const t of e.changedTouches) if (t.identifier === id) { e.preventDefault(); upd(t); } }, { passive: false });
    const end = e => { for (const t of e.changedTouches) if (t.identifier === id) { id = null; knob.style.transform = ''; I.moveStick = null; joy.classList.remove('mc-float'); joy.style.left = joy.style.top = joy.style.right = joy.style.bottom = ''; } };
    cv.addEventListener('touchend', end); cv.addEventListener('touchcancel', end);
  };

  // ---------- 技能鈕：點一下照舊、按住拖曳瞄準、拖到「取消」不放 ----------
  const watchSkills = () => {
    let cur = null, aimEl = null, canEl = null;
    const ui = on => {
      if (on && !aimEl) { aimEl = document.createElement('div'); aimEl.id = 'mc-aim'; aimEl.innerHTML = '<i></i><b></b>'; canEl = document.createElement('div'); canEl.id = 'mc-cancel'; canEl.textContent = '✕ 拖到這裡取消'; document.body.append(aimEl, canEl); }
      if (aimEl) { aimEl.hidden = !on; canEl.hidden = !on; }
    };
    const inCancel = t => { if (!canEl || canEl.hidden) return false; const r = canEl.getBoundingClientRect(); return t.clientX > r.left - 30 && t.clientX < r.right + 30 && t.clientY < r.bottom + 40; };
    window.addEventListener('touchstart', e => {
      const b = e.target.closest && e.target.closest('#r-br [data-tact^="skill"]'); if (!b || !inPlay() || W().town) return;
      e.stopImmediatePropagation(); e.preventDefault();
      if (cur) return;
      const t = e.changedTouches[0], r = b.getBoundingClientRect();
      cur = { id: t.identifier, b, a: b.dataset.tact, x: r.left + r.width / 2, y: r.top + r.height / 2, drag: false, cancel: false };
      b.classList.add('mc-down'); buzz(10);
    }, { capture: true, passive: false });
    window.addEventListener('touchmove', e => {
      if (!cur) return;
      for (const t of e.changedTouches) if (t.identifier === cur.id) {
        e.preventDefault();
        const dx = t.clientX - cur.x, dy = t.clientY - cur.y, d = Math.hypot(dx, dy);
        if (!cur.drag && d > 22) { cur.drag = true; ui(true); }
        if (!cur.drag) return;
        const m = Math.min(1, d / 110); I.aimStick = { x: dx / (d || 1) * Math.max(m, 0.3), y: dy / (d || 1) * Math.max(m, 0.3) };
        const L = Math.min(d, 110); aimEl.style.left = cur.x + 'px'; aimEl.style.top = cur.y + 'px';
        const i = aimEl.firstChild, bb = aimEl.lastChild; i.style.width = L + 'px'; i.style.transform = 'rotate(' + Math.atan2(dy, dx) + 'rad)'; bb.style.left = dx / (d || 1) * L + 'px'; bb.style.top = dy / (d || 1) * L + 'px';
        const c = inCancel(t); if (c !== cur.cancel) { cur.cancel = c; canEl.classList.toggle('on', c); if (c) buzz(15); }
      }
    }, { capture: true, passive: false });
    const end = e => {
      if (!cur) return;
      for (const t of e.changedTouches) if (t.identifier === cur.id) {
        const c = cur; cur = null; c.b.classList.remove('mc-down'); ui(false);
        if (c.drag && c.cancel) { I.aimStick = null; R.toast && R.toast('取消施放'); return; }
        if (c.drag) {
          // 拖曳時 I.aimStick 每一格已經讓遊戲把 P.aimA 轉成世界方向；這裡照拖多遠決定距離再放技能
          const P = W().P, s = I.aimStick, mag = s ? Math.hypot(s.x, s.y) : 0;
          if (P && P.aimA != null) { const dist = 2 + mag * 8; P.aimX = P.x + Math.sin(P.aimA) * dist; P.aimZ = P.z + Math.cos(P.aimA) * dist; }
          R.tact(c.a); I.aimStick = null;
        } else { if (O.autoAim) aimNearest(); R.tact(c.a); }
        buzz(12);
      }
    };
    window.addEventListener('touchend', end, true); window.addEventListener('touchcancel', e => { if (cur) { cur.b.classList.remove('mc-down'); cur = null; ui(false); I.aimStick = null; } }, true);
  };

  // ---------- 其他按鈕：按下的回饋、震動 ----------
  const watchBtns = () => {
    document.addEventListener('touchstart', e => { const b = e.target.closest && e.target.closest('#r-br .act'); if (b && !/^skill/.test(b.dataset.tact || '')) { b.classList.add('mc-down'); buzz(8); } }, { passive: true, capture: true });
    const up = () => document.querySelectorAll('#r-br .mc-down').forEach(b => { if (!b.matches('[data-tact^="skill"]')) b.classList.remove('mc-down'); });
    document.addEventListener('touchend', up, true); document.addEventListener('touchcancel', up, true);
    const pr = $('r-prompt'); if (pr) { const f = () => document.querySelectorAll('#r-br [data-tact="use"]').forEach(b => b.classList.toggle('mc-hot', !pr.hidden)); new MutationObserver(f).observe(pr, { attributes: true, attributeFilter: ['hidden'] }); f(); }
  };

  // ---------- 設定 ----------
  R.mobileSettings = () => {
    let el = $('mc-set'); if (el) el.remove();
    el = document.createElement('div'); el.id = 'mc-set';
    const seg = (k, opts) => '<div class="seg">' + opts.map(([v, n]) => '<button type="button" data-k="' + k + '" data-v="' + v + '"' + (String(O[k]) === String(v) ? ' class="on"' : '') + '>' + n + '</button>').join('') + '</div>';
    el.innerHTML = '<div class="box" role="dialog" aria-label="手機操控"><h3>手機操控</h3>'
      + '<div class="r"><span>按鈕大小</span>' + seg('size', [[0.85, '小'], [1, '中'], [1.2, '大'], [1.4, '特大']]) + '</div>'
      + '<div class="r"><span>按鈕透明度</span>' + seg('alpha', [[1, '不透明'], [0.75, '75%'], [0.5, '50%']]) + '</div>'
      + '<div class="r"><span>左手模式（左右對調）</span>' + seg('lefty', [[false, '關'], [true, '開']]) + '</div>'
      + '<div class="r"><span>浮動搖桿（半邊畫面都能推）</span>' + seg('float', [[false, '關'], [true, '開']]) + '</div>'
      + '<div class="r"><span>自動瞄準最近的敵人</span>' + seg('autoAim', [[false, '關'], [true, '開']]) + '</div>'
      + '<div class="r"><span>震動</span>' + seg('vibe', [[false, '關'], [true, '開']]) + '</div>'
      + '<p style="color:#A89C88;font-size:12px;margin:6px 0">技能鈕：點一下直接放；按住拖曳可以瞄準，拖到上方「取消」放開就不放。右搖桿按住不拖會自動打最近的敵人。</p>'
      + '<button type="button" class="ok">好了</button></div>';
    el.addEventListener('click', e => {
      const b = e.target.closest('button'); if (e.target === el || (b && b.classList.contains('ok'))) { el.remove(); return; }
      if (b && b.dataset.k) { const v = b.dataset.v; O[b.dataset.k] = v === 'true' ? true : v === 'false' ? false : +v; saveO(); R.mobileSettings(); }
    });
    document.body.appendChild(el);
  };
  const addBtn = () => {
    const cam = document.querySelector('#r-tr .r-cam'); if (!cam || $('mc-btn')) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'mc-btn'; b.className = 'mini'; b.textContent = '操控'; b.setAttribute('aria-label', '手機操控設定');
    b.addEventListener('touchstart', e => { e.preventDefault(); R.mobileSettings(); }, { passive: false }); b.addEventListener('click', () => R.mobileSettings());
    cam.insertBefore(b, $('r-pause') || null);
  };

  const init = () => { apply(); watchR(); watchFloat(); watchSkills(); watchBtns(); addBtn(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  // 轉向後重算（landscape.js 也會送 resize，這裡補 visualViewport）
  if (window.visualViewport) visualViewport.addEventListener('resize', () => { try { window.dispatchEvent(new Event('resize')); } catch (e) { } });
})(window.R);
