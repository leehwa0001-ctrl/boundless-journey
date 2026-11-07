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
  // 小佩特拉核心（2026-10-21 作者：小佩特拉有點醜）：點陣畫──有明暗的眼球、血絲、紅色虹膜和直的瞳孔、兩邊的骨翼和翼膜。
  // 眼球、虹膜、左右翼各是一層，用 CSS 動（翅膀拍、眼睛左右看、整顆上下浮）──畫面卡住的時候動畫照樣跑。
  let PT = null;
  const parts = () => {
    if (PT) return PT;
    const cv = (w, h, f, flip) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); if (flip) { g.translate(w, 0); g.scale(-1, 1); } const px = (x, y, col) => { g.fillStyle = col; g.fillRect(x, y, 1, 1); }; f(px, g); return c.toDataURL(); };
    const line = (px, x0, y0, x1, y1, col) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)); for (let i = 0; i <= n; i++) px(Math.round(x0 + (x1 - x0) * i / n), Math.round(y0 + (y1 - y0) * i / n), col); };
    const ball = cv(22, 22, px => {
      for (let y = 0; y < 22; y++) for (let x = 0; x < 22; x++) {
        const dx = x - 10.5, dy = y - 10.5, d = Math.hypot(dx, dy); if (d > 10.6) continue;
        const lit = (-dx - dy) / 15;   // 光從左上來
        px(x, y, d > 9.7 ? '#4A2A2C' : lit > 0.45 ? '#FFF6EC' : lit > 0.05 ? '#EFE2D6' : lit > -0.45 ? '#D9C6B8' : '#B89A8E');
      }
      // 血絲：從邊上往裡長
      [[[2, 9], [5, 10], [6, 8]], [[3, 15], [6, 14], [7, 16]], [[17, 4], [15, 6], [14, 5]], [[19, 13], [16, 13], [15, 15]], [[9, 19], [10, 16]], [[12, 2], [12, 4], [10, 5]]].forEach(v => { for (let i = 1; i < v.length; i++) line(px, v[i - 1][0], v[i - 1][1], v[i][0], v[i][1], i === 1 ? '#B8363C' : '#D46A6A'); });
    });
    const iris = cv(12, 12, px => {
      for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) { const d = Math.hypot(x - 5.5, y - 5.5); if (d > 5.8) continue; px(x, y, d > 4.9 ? '#3A0810' : d > 3.6 ? '#9A1C2A' : d > 2.4 ? '#C8343E' : '#E0505A'); }
      for (let y = 2; y <= 9; y++) { px(5, y, '#100406'); px(6, y, '#100406'); } px(5, 1, '#3A0810'); px(6, 10, '#3A0810');
      px(8, 3, '#FFFFFF'); px(8, 4, '#FFD8D8');   // 反光點在右上，離瞳孔遠一點（不要看起來像「1」）
    });
    const drawWing = (px, g) => {
      const J = [27, 11], tips = [[2, 1], [0, 7], [1, 13], [5, 19], [12, 21]];
      // 翼膜：骨頭和骨頭之間塗暗紅
      g.fillStyle = '#5A2630'; g.beginPath(); g.moveTo(J[0], J[1]); tips.forEach(t => g.lineTo(t[0] + 2, t[1] + (t[1] < 11 ? 1 : -1))); g.closePath(); g.fill();
      for (let i = 0; i < tips.length - 1; i++) { const a = tips[i], b = tips[i + 1]; line(px, a[0] + 2, a[1] + 1, (a[0] + b[0]) / 2 + 5, (a[1] + b[1]) / 2, '#3A1820'); }
      // 骨頭：亮的一條＋下面一條暗的
      tips.forEach(t => { line(px, J[0], J[1] + 1, t[0], t[1] + 1, '#8A7A70'); line(px, J[0], J[1], t[0], t[1], '#F0E6DA'); px(t[0], t[1], '#2A2020'); });
      px(J[0], J[1], '#F0E6DA'); px(J[0] - 1, J[1], '#F0E6DA'); px(J[0] - 1, J[1] - 1, '#D8CABC');
    };
    const wing = cv(28, 22, drawWing), wingR = cv(28, 22, drawWing, true);   // 右翼：整張左右翻過來畫
    return (PT = { ball, iris, wing, wingR });
  };
  const petra = () => { const t = parts(); return '<div class="ld-petra" aria-hidden="true"><img class="ld-wl" src="' + t.wing + '" alt=""><img class="ld-wr" src="' + t.wingR + '" alt=""><div class="ld-ball"><img src="' + t.ball + '" alt=""><img class="ld-iris" src="' + t.iris + '" alt=""></div></div>'; };
  let el = null;
  const ensure = () => {
    if (el) return el;
    el = document.createElement('div'); el.id = 'r-loading'; el.hidden = true; el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<div class="ld-box">' + petra() + '<b class="ld-t">讀取中</b><div class="ld-bar"><i></i></div><small class="ld-p"></small></div>';
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
  // 從標題、遺跡回來進東鶴（R.enterTown 本來就是非同步的：等 3D 引擎載好才進）──東鶴蓋城要好幾秒
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
    + '.ld-petra{position:relative;width:180px;height:72px;image-rendering:pixelated;filter:drop-shadow(0 0 14px rgba(200,50,58,.4))}.ld-petra img{position:absolute;image-rendering:pixelated}'
    + '.ld-wl,.ld-wr{width:84px;height:66px;top:2px}.ld-wl{right:50%;margin-right:22px;transform-origin:100% 50%;animation:ldflap 1.6s ease-in-out infinite}.ld-wr{left:50%;margin-left:22px;transform-origin:0 50%;animation:ldflapr 1.6s ease-in-out infinite}'
    + '.ld-ball{position:absolute;left:50%;top:3px;width:66px;height:66px;margin-left:-33px;animation:ldbob 2.2s ease-in-out infinite}.ld-ball>img:first-child{width:66px;height:66px;left:0;top:0}'
    + '.ld-iris{width:30px;height:30px;left:18px;top:18px;animation:ldiris 3s steps(1,end) infinite}'
    + '@keyframes ldflap{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(12deg)}}@keyframes ldflapr{0%,100%{transform:rotate(4deg)}50%{transform:rotate(-12deg)}}'
    + '@keyframes ldbob{0%,100%{transform:translateY(-3px)}50%{transform:translateY(3px)}}'
    + '@keyframes ldiris{0%{transform:translate(-10px,0)}30%{transform:translate(0,4px)}55%{transform:translate(10px,-3px)}80%{transform:translate(0,0)}}'
    + '.ld-t{font-family:var(--serif);font-size:20px;letter-spacing:.12em}.ld-p{font-size:12px;color:#8E8496;letter-spacing:.1em}'
    + '.ld-bar{width:100%;height:6px;border-radius:3px;background:#221E2A;overflow:hidden;border:1px solid #352E42}.ld-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#8A1A2A,#C8323A);transition:width .15s}'
  document.head.appendChild(css);
})(window.R);
