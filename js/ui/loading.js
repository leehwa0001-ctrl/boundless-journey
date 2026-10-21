// 加載頁面、圖鑑不卡（2026-10-21 作者：在主畫面開圖鑑會卡；跑東西的時候可以加個加載頁面）
// 第一次打開圖鑑要把一百五十幾隻遺跡生物的點陣圖畫出來（monlabel.js 的 R.beastIconURL → sprites.js 的 beastSheet），
// 一口氣做完，畫面卡五秒左右（之後有快取就快了）。
// - R.loading.show(字, 進度 0～1)／set(進度, 字)／hide()：全畫面的加載頁（暗底、標題字、進度條、轉圈的小佩特拉之眼）。
// - R.warmDex(進度回呼)：分批畫圖示（每批做到 12 毫秒就讓出來，畫面不會停），做完就記住，之後不用再做。
// - 在標題畫面閒著的時候，背景慢慢先畫（requestIdleCallback，每次一點點）；
//   按「遺跡生物圖鑑」時還沒畫完，先出現加載頁「整理圖鑑中……」照進度跑，跑完再打開。
// 放在 monlabel.js、main.js 後面。
(function (R) {
  const $ = id => document.getElementById(id);
  // ---------- 加載頁 ----------
  let el = null;
  const ensure = () => {
    if (el) return el;
    el = document.createElement('div'); el.id = 'r-loading'; el.hidden = true; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<div class="ld-box"><div class="ld-eye" aria-hidden="true"><i></i></div><b class="ld-t">讀取中</b><div class="ld-bar"><i></i></div><small class="ld-p"></small></div>';
    document.body.appendChild(el);
    return el;
  };
  const set = (p, t) => { const e = ensure(); if (t != null) e.querySelector('.ld-t').textContent = t; if (p != null) { const v = Math.max(0, Math.min(1, p)); e.querySelector('.ld-bar i').style.width = Math.round(v * 100) + '%'; e.querySelector('.ld-p').textContent = Math.round(v * 100) + '%'; } };
  R.loading = {
    show: (t, p) => { const e = ensure(); set(p == null ? 0 : p, t || '讀取中'); e.hidden = false; e.classList.remove('ld-out'); },
    set,
    hide: () => { if (!el || el.hidden) return; el.classList.add('ld-out'); setTimeout(() => { if (el.classList.contains('ld-out')) el.hidden = true; }, 220); }
  };
  const frame = () => new Promise(r => setTimeout(r, 0));   // 讓瀏覽器畫一格（requestAnimationFrame 在背景分頁不會跑，用 setTimeout）
  // 真的畫出一格：requestAnimationFrame 之後再 setTimeout（背景分頁 rAF 不跑：60 毫秒後自己走）
  const paint = () => new Promise(r => { let done = false; const go = () => { if (!done) { done = true; setTimeout(r, 0); } }; requestAnimationFrame(go); setTimeout(go, 60); });
  // ---------- 跑重的東西（進城、進遺跡、下一層）：先把加載頁放上去、畫出一格，再跑 ----------
  // 加載頁晚 0.15 秒才淡入（CSS 動畫在畫面卡住的時候照樣跑）：很快就做完的（進店、換房間）根本看不到，不會閃一下。
  let depth = 0;
  R.loading.around = (fn, text) => {
    const e = ensure(); depth++;
    if (depth === 1) { set(null, text || '讀取中……'); e.classList.add('ld-wait', 'ld-ind'); e.classList.remove('ld-out'); e.hidden = false; }
    const end = () => { if (--depth > 0) return; e.classList.remove('ld-wait', 'ld-ind'); e.hidden = true; };
    return paint().then(() => { try { return fn(); } finally { setTimeout(end, 30); } });
  };
  // ---------- 圖鑑的圖示：分批畫 ----------
  let warmed = false, warming = null, idx = 0;
  // 圖鑑的卡片用 3 倍的圖示；書本的左頁（dexruins.js）用 2 倍，連荒、獰、淵的變種（_v1～_v3，noDex）也要
  const ids = () => Object.keys(R.ENEMIES || {}).filter(id => !R.ENEMIES[id].human);
  const one = id => { try { R.beastIconURL(id, 2); if (!R.ENEMIES[id].noDex) R.beastIconURL(id, 3); } catch (e) { } };
  // budget：每一批最多幾毫秒；idle：閒著的時候慢慢做（拿 requestIdleCallback 給的時間）
  const step = (list, budget) => { const t0 = performance.now(); while (idx < list.length && performance.now() - t0 < budget) one(list[idx++]); return idx >= list.length; };
  R.warmDex = onP => {
    if (warmed || !R.beastIconURL) return Promise.resolve();
    if (warming && !onP) return warming;
    const list = ids();
    warming = (async () => { while (!step(list, 12)) { if (onP) onP(idx / list.length); await frame(); } warmed = true; if (onP) onP(1); })();
    return warming;
  };
  // 標題畫面閒著：背景慢慢畫（每次只用瀏覽器說閒著的那一點時間）
  const idleWarm = () => {
    if (warmed || !R.beastIconURL || !R.ENEMIES) return;
    const list = ids(), ric = window.requestIdleCallback || (cb => setTimeout(() => cb({ timeRemaining: () => 8 }), 60));
    const go = dl => { if (warmed || warming) return; const T = $('title'); if (T && !T.hidden) { step(list, Math.max(2, Math.min(10, dl.timeRemaining() - 1))); if (idx >= list.length) { warmed = true; return; } } ric(go, { timeout: 2000 }); };
    ric(go, { timeout: 2000 });
  };
  // ---------- 打開圖鑑：還沒畫完就先出加載頁 ----------
  let pass = false;
  const gate = e => {
    if (pass || warmed || !R.beastIconURL) return;
    const b = e.currentTarget; e.stopImmediatePropagation(); e.preventDefault();
    R.loading.show('整理圖鑑中……', idx / Math.max(1, ids().length));
    frame().then(() => R.warmDex(p => set(p))).then(() => { set(1, '翻開圖鑑'); return frame(); }).then(() => { pass = true; try { b.click(); } finally { pass = false; } R.loading.hide(); });
  };
  const hook = () => {
    const bs = ['t-best', 'h-best', 'm-best'].map($).filter(Boolean);
    if (!bs.length) return setTimeout(hook, 300);
    bs.forEach(b => b.addEventListener('click', gate, true));
    document.addEventListener('click', e => { const b = e.target && e.target.closest && e.target.closest('[data-best]'); if (b && !pass && !warmed) { e.stopImmediatePropagation(); e.preventDefault(); R.loading.show('整理圖鑑中……', 0); frame().then(() => R.warmDex(p => set(p))).then(() => { pass = true; try { b.click(); } finally { pass = false; } R.loading.hide(); }); } }, true);
    setTimeout(idleWarm, 2500);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', hook); else hook();
  // R.openBest（城裡、別的地方叫的）也一樣
  const ob0 = R.openBest;
  if (ob0) R.openBest = (...a) => { if (warmed || !R.beastIconURL) return ob0(...a); R.loading.show('整理圖鑑中……', 0); frame().then(() => R.warmDex(p => set(p))).then(() => { ob0(...a); R.loading.hide(); }); };
  // R.fade（進城、進店、睡一晚、下樓梯……都走這裡：先變黑、跑、再亮起來）：黑掉那一刻改成先放加載頁再跑
  const fd0 = R.fade;
  if (fd0) R.fade = f => fd0(() => { R.loading.around(f); });
  // 從標題、遺跡回來進東鶴（R.enterTown 本來就是非同步的：等 3D 引擎載好才進）——東鶴蓋城要好幾秒
  const et0 = R.enterTown;
  if (et0) R.enterTown = (...a) => R.loading.around(() => et0(...a), '前往東鶴……').then(p => p);
  // 進遺跡：委託書的出發、繼續委託、不接委託，繼續探索、狩獵
  let passRun = false;
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('#tk-go,#tk-free,#tk-cont,#rs-go,[data-hunt]'); if (!b || passRun) return;
    e.stopImmediatePropagation(); e.preventDefault();
    R.loading.around(() => { passRun = true; try { b.click(); } finally { passRun = false; } }, '進入遺跡……');
  }, true);
  const css = document.createElement('style');
  css.textContent = '#r-loading.ld-wait{opacity:0;animation:ldin .2s ease .15s forwards}@keyframes ldin{to{opacity:1}}'
    + '#r-loading.ld-ind .ld-bar i{width:35%!important;animation:ldbar 1.1s ease-in-out infinite}#r-loading.ld-ind .ld-p{visibility:hidden}@keyframes ldbar{0%{transform:translateX(-100%)}100%{transform:translateX(290%)}}'
    + '#r-loading{position:fixed;inset:0;z-index:9000;display:grid;place-items:center;background:rgba(8,7,12,.88);transition:opacity .2s}#r-loading[hidden]{display:none}#r-loading.ld-out{opacity:0}'
    + '.ld-box{display:grid;justify-items:center;gap:10px;width:min(320px,80vw);color:#E8DFCF;text-align:center}'
    + '.ld-t{font-family:var(--serif);font-size:20px;letter-spacing:.12em}.ld-p{font-size:12px;color:#8E8496;letter-spacing:.1em}'
    + '.ld-bar{width:100%;height:6px;border-radius:3px;background:#221E2A;overflow:hidden;border:1px solid #352E42}.ld-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#8A1A2A,#C8323A);transition:width .15s}'
    + '.ld-eye{width:44px;height:44px;border-radius:50%;background:#EDE0D6;display:grid;place-items:center;box-shadow:0 0 18px rgba(200,50,58,.45);animation:ldlook 2.4s ease-in-out infinite}'
    + '.ld-eye i{width:18px;height:18px;border-radius:50%;background:radial-gradient(circle,#140A0C 0 35%,#8A1A2A 40% 100%);animation:ldiris 2.4s ease-in-out infinite}'
    + '@keyframes ldlook{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}@keyframes ldiris{0%,100%{transform:translateX(-7px)}50%{transform:translateX(7px)}}';
  document.head.appendChild(css);
})(window.R);
