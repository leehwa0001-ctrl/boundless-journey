// Esc 選單：分頁、每個畫面同一個樣子（2026-10-21 作者：不同畫面 Esc 後的介面都不一樣；選「分頁式」）
// escmenu.js（2026-10-13）已經把按鈕分進區塊（遊戲／角色／設定／社群・回報／其他／離開），可是外面還是各長各的：
// 城裡的選單上面一大段操作說明和畫質說明、標題只有城名；遺跡的暫停選單分三欄（pauselayout.js：左邊角色總數值）、標題是「暫停」。
// 這裡在 escmenu.js 排好之後，把它變成同一個樣子：
//   上面：在哪裡（地名或遺跡・第幾層）＋日期時間；
//   一排分頁：遊戲（繼續、快速移動、離開……）／角色／地圖・委託（從「遊戲」裡挑出地圖、委託、手冊、瓦版、指南）／設定／說明（社群・回報、操作說明）／數值（遺跡裡的角色總數值）。
// 只搬區塊、顯示或藏起來，不動按鈕（escmenu.js 用 MutationObserver 排按鈕：在 .em-wrap 裡面的按鈕它不會再搬）。上次停在哪一頁，下次還是那一頁；← → 換分頁。
// 放在 escmenu.js、pauselayout.js 和所有包 R.townMenu、R.pauseSheet 的檔案後面（index.html 最後）。
(function (R) {
  const W = R.W, $ = id => document.getElementById(id), esc = s => (R.esc ? R.esc(s) : String(s));
  const TABS = [['game', '遊戲'], ['char', '角色'], ['map', '地圖・委託'], ['set', '設定'], ['help', '說明'], ['stat', '數值']];
  const MAPRE = /地圖|委託|手冊|瓦版|指南|圖鑑|觀光|日誌|任務/;
  let cur = 'game', busy = false;
  const where = () => {
    const run = W.run;
    if (run && run.site) return run.site.name + '・' + (R.floorLabel ? R.floorLabel(run) : '第 ' + ((run.floor || 0) + 1) + ' 層');
    try { if (R.townArea) return R.townArea(); } catch (e) { }
    return W.town && W.town.city ? W.town.city.name : '';
  };
  const apply = () => {
    const sh = $('r-sheet'), w = sh && sh.querySelector('.em-wrap'); if (!w || busy) return;
    busy = true;
    try {
      // pauselayout.js 的三欄拆回來
      if (sh.classList.contains('ps-lay')) { const m = sh.querySelector(':scope > .ps-m'), l = sh.querySelector(':scope > .ps-l'); if (m) [...m.children].forEach(x => sh.appendChild(x)); if (l) [...l.children].forEach(x => sh.appendChild(x)); if (m) m.remove(); if (l) l.remove(); sh.classList.remove('ps-lay'); }
      sh.classList.add('eu-menu');
      // 標題：在哪裡＋日期
      let head = sh.querySelector(':scope > .eu-head'); if (!head) { head = document.createElement('div'); head.className = 'eu-head'; sh.prepend(head); const x = sh.querySelector('.cx-x'); if (x) sh.prepend(x); }
      // 2026-10-21 修：沒變就不要動 DOM──每動一次，escmenu.js 的 MutationObserver 就重排、又叫醒這裡，一秒重畫一百多次，滑鼠按下去到放開之間按鈕就被換掉，按不了
      const hh = '<p class="kicker">' + (W.run ? '暫停' : '選單') + '</p><h2>' + esc(where()) + '</h2><p class="note">' + esc(R.dateLabel ? R.dateLabel() : '') + '</p>';
      if (head.dataset.h !== hh) { head.innerHTML = hh; head.dataset.h = hh; }
      [...sh.querySelectorAll(':scope > h2, :scope > .kicker, :scope > p.kicker')].forEach(h => h.remove());
      // 區塊：地圖・委託、說明、數值（都放在 .em-wrap 裡面）
      const sec = (k, name) => { let s = w.querySelector('.eu-sec-' + k); if (!s) { s = document.createElement('section'); s.className = 'em-sec eu-sec-' + k; s.innerHTML = '<h4>' + name + '</h4><div class="em-btns"></div>'; w.appendChild(s); } return s; };
      const mapS = sec('map', '地圖・委託'), helpS = sec('help', '說明'), statS = sec('stat', '角色總數值');
      const mv = (b, to) => { if (to && b.parentNode !== to) to.appendChild(b); };
      w.querySelectorAll('.em-game .em-btns > button').forEach(b => { if (MAPRE.test(b.textContent)) mv(b, mapS.querySelector('.em-btns')); });
      w.querySelectorAll('.em-game .em-btns > button, .em-other .em-btns > button, .em-char .em-btns > button').forEach(b => { const t = b.textContent; if (/教學/.test(t)) mv(b, helpS.querySelector('.em-btns')); else if (/畫法|像素版|精緻版/.test(t)) mv(b, w.querySelector('.em-s-screen .em-btns')); });
      const here = where();
      [...sh.querySelectorAll(':scope > p, p.note, details')].forEach(n => { if (n.closest('.em-wrap') || n.closest('.eu-head') || n.closest('.cs-box')) return; if (n.textContent.trim() === here) { n.remove(); return; } helpS.appendChild(n); });   // 跟標題一樣的那一行（遺跡的暫停選單）拿掉
      const cs = sh.querySelector('.cs-box'); if (cs && !cs.closest('.eu-sec-stat')) statS.appendChild(cs);
      // 每一頁有哪些區塊
      const PAGE = { game: '.em-game, .em-other, .em-leave', char: '.em-char', map: '.eu-sec-map', set: '.em-set', help: '.em-social, .eu-sec-help', stat: '.eu-sec-stat' };
      const filled = s => !!(s.querySelector('button, input, .cs-box, p, details') && (s.classList.contains('em-set') ? [...s.querySelectorAll('.em-sub')].some(x => x.querySelector('button, input')) : true));
      // 分頁那一排放在 .em-wrap 裡面最上面：escmenu.js 不會去搬 .em-wrap 裡面的按鈕（放外面會被當成選單按鈕收進區塊）
      let tabs = w.querySelector(':scope > .eu-tabs'); if (!tabs) { tabs = document.createElement('div'); tabs.className = 'eu-tabs'; tabs.setAttribute('role', 'tablist'); } if (w.firstChild !== tabs) w.prepend(tabs);
      // 同名的按鈕只留一個（快速移動、回報穿模、觀光手冊有兩個檔案各加一次）
      const seen = new Set(); w.querySelectorAll('.em-sec button').forEach(b => { const t = b.textContent.trim(); b.hidden = !!t && seen.has(t); if (t) seen.add(t); });
      const pages = TABS.filter(([k]) => [...w.querySelectorAll(PAGE[k])].some(filled));
      if (!pages.some(p => p[0] === cur)) cur = 'game';
      const sig = pages.map(p => p[0]).join(',');
      if (tabs.dataset.sig !== sig) { tabs.dataset.sig = sig; tabs.innerHTML = ''; pages.forEach(([k, name]) => { const t = document.createElement('button'); t.type = 'button'; t.className = 'eu-tab'; t.textContent = name; t.dataset.k = k; t.setAttribute('role', 'tab'); t.onclick = () => { cur = k; apply(); }; tabs.appendChild(t); }); }
      tabs.querySelectorAll('.eu-tab').forEach(t => { const o = t.dataset.k === cur; t.classList.toggle('on', o); t.setAttribute('aria-selected', o ? 'true' : 'false'); });
      const on = new Set(w.querySelectorAll(PAGE[cur]));
      w.querySelectorAll('.em-sub').forEach(x => { x.hidden = !x.querySelector('button:not([hidden]), input'); });   // 搬進來的按鈕（畫法）要看得到
      w.querySelectorAll(':scope > .em-sec').forEach(s => { s.hidden = false; s.classList.toggle('eu-off', !on.has(s) || !filled(s)); });
      // 空的 row 拿掉（escmenu.js 的 .mt-wrap 也是）
      sh.querySelectorAll(':scope > .row').forEach(r => { if (!r.children.length) r.remove(); });
    } catch (e) { console.warn('[escunify]', e); }
    busy = false;
  };
  // escmenu.js 排完（MutationObserver＋20 毫秒）、pauselayout.js 的 setTimeout 之後再套
  const later = () => { [0, 40, 120, 300].forEach(t => setTimeout(apply, t)); };
  // 打開的時候馬上排好（先叫 escmenu.js 排區塊，再變分頁），不要讓舊的樣子先閃一下
  ['townMenu', 'pauseSheet'].forEach(n => { const f0 = R[n]; if (f0) R[n] = (...a) => { const r = f0(...a); try { if (R.escMenuOrganize) R.escMenuOrganize(); apply(); } catch (e) { } later(); return r; }; });
  // 選單開著的時候，有按鈕被加進來或換字（開關），也再套一次（escmenu.js 會先把新按鈕排進區塊）
  // MutationObserver 的回呼在畫面重畫之前跑：在這裡直接排，pauselayout.js 晚一點拆成三欄、escmenu.js 晚一點補的按鈕都不會先被看到（apply 沒變就不動 DOM，不會一直互相叫醒）
  const start = () => { const sh = $('r-sheet'); if (!sh) return setTimeout(start, 300);
    new MutationObserver(() => { if (!busy && sh.querySelector('.em-wrap') && sh.classList.contains('eu-menu')) apply(); }).observe(sh, { childList: true, subtree: true });
    new MutationObserver(() => { if (!busy && sh.classList.contains('ps-lay') && sh.querySelector('.em-wrap')) apply(); }).observe(sh, { attributes: true, attributeFilter: ['class'] }); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  const sh0 = R.sheet; R.sheet = (...a) => { const sh = $('r-sheet'); if (sh) sh.classList.remove('eu-menu'); return sh0(...a); };
  document.addEventListener('keydown', e => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return; const sh = $('r-sheet'); if (!sh || !sh.classList.contains('eu-menu') || !(R.sheetOpen && R.sheetOpen())) return;
    const t = [...sh.querySelectorAll('.eu-tab')], i = t.findIndex(x => x.classList.contains('on')); if (i < 0) return;
    e.preventDefault(); t[(i + (e.key === 'ArrowRight' ? 1 : t.length - 1)) % t.length].click();
  });
  const css = document.createElement('style');
  css.textContent = '.sheet.eu-menu{width:min(620px,100%)}.eu-head h2{margin:2px 0 0}.eu-head .note{margin:2px 0 6px}'
    + '.eu-tabs{display:flex;gap:4px;flex-wrap:wrap;border-bottom:1px solid #352E42;margin:4px 0 0;padding-bottom:6px}'
    + '.eu-tab{background:none;border:1px solid transparent;color:inherit;opacity:.7;padding:6px 12px;border-radius:8px;font:inherit;cursor:pointer}'
    + '.eu-tab:hover{opacity:1;background:#17141E}.eu-tab.on{opacity:1;border-color:#352E42;background:#17141E;font-weight:700;color:#E8D49A}'
    + '.eu-menu .em-wrap{grid-template-columns:1fr;max-height:min(66vh,600px);overflow:auto}.eu-menu .eu-tabs{position:sticky;top:0;z-index:1;background:var(--bg,#120F18)}.eu-menu .em-sec.eu-off{display:none}'
    + '.eu-menu .eu-sec-stat .cs-box{margin:0;border:0;padding:0;background:none}.eu-menu .eu-sec-help p.note{margin:4px 0}';
  document.head.appendChild(css);
})(window.R);
