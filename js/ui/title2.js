// 標題畫面整理（2026-10-21 作者：遊戲主畫面得改一下；選「整理版面」）
// 原本：說明一大段、六顆一樣大的按鈕、三格存檔和存檔轉移排在下面——一個畫面放不下，要往下捲。
// 現在（照原本的元素搬，不換功能、不換 onclick）：
//   佩特拉核心的立繪、標題 → 一張大的「繼續冒險」（目前的角色）→「新的冒險」「選擇存檔」並排 →
//   一排小字的連結：攤開地圖・遺跡生物圖鑑・種族一覽・更新公告（有新的會亮紅點）。
//   存檔三格和存檔轉移收進「選擇存檔」的面板（按了才出來，「返回」收回去）。
//   說明那一段縮成一行；沒有存檔的時候「新的冒險」變成最大那一顆。
// 標題畫面的元素是 main.js、savecode.js、news.js、racelist.js 畫的（會重畫）：用 MutationObserver 看著，每次重畫完再排一次。
// 放在 main.js、savecode.js、news.js 後面。
(function (R) {
  const $ = id => document.getElementById(id);
  let busy = false;
  const arrange = () => {
    const T = $('title'), wrap = T && T.querySelector('.t-wrap'), btns = T && T.querySelector('.t-btns'); if (!wrap || !btns || busy) return;
    busy = true;
    try {
      T.classList.add('t2');
      const go = $('t-go'), nw = $('t-new');
      // 繼續冒險：第一行的字換掉（小字的角色資料照舊）
      if (go && go.firstChild && go.firstChild.nodeType === 3 && go.firstChild.textContent !== '繼續冒險') go.firstChild.textContent = '繼續冒險';
      // 選擇存檔
      let pick = $('t2-pick'); if (!pick) { pick = document.createElement('button'); pick.type = 'button'; pick.id = 't2-pick'; pick.innerHTML = '選擇存檔<small>三格存檔・匯出、匯入</small>'; pick.onclick = () => open(true); }
      // 主要的兩排
      let main = $('t2-main'); if (!main) { main = document.createElement('div'); main.id = 't2-main'; main.className = 't2-main'; btns.before(main); }
      let pair = $('t2-pair'); if (!pair) { pair = document.createElement('div'); pair.id = 't2-pair'; pair.className = 't2-pair'; }
      const has = go && !go.hidden;
      if (has) { if (go.parentNode !== main || main.firstChild !== go) main.prepend(go); if (nw && nw.parentNode !== pair) pair.prepend(nw); }
      else if (nw && nw.parentNode !== main) main.prepend(nw);
      if (pick.parentNode !== pair) pair.appendChild(pick);
      if (pair.parentNode !== main) main.appendChild(pair);
      main.classList.toggle('t2-nosave', !has);
      // 其他按鈕：一排小字的連結（標題右邊的小字拿掉，滑鼠移上去看得到）
      btns.classList.add('t2-links');
      [...btns.querySelectorAll('button')].forEach(b => { if (b === go || b === nw || b === pick) return; const sm = b.querySelector('small'); if (sm && sm.textContent && !b.title) b.title = sm.textContent; b.classList.add('t2-link'); });
      // 存檔、存檔轉移：收進面板
      let panel = $('t2-saves'); if (!panel) { panel = document.createElement('div'); panel.id = 't2-saves'; panel.className = 't2-saves'; panel.hidden = true; panel.innerHTML = '<div class="t2-saves-head"><b>選擇存檔</b><button type="button" class="t2-back" id="t2-back">返回</button></div>'; wrap.appendChild(panel); panel.querySelector('#t2-back').onclick = () => open(false); }
      ['t-slots', 't-transfer'].forEach(id => { const el = $(id); if (el && el.parentNode !== panel) panel.appendChild(el); });
    } catch (e) { console.warn('[title2]', e); }
    busy = false;
  };
  const open = on => { const p = $('t2-saves'), m = $('t2-main'), l = document.querySelector('#title .t2-links'); if (!p) return; p.hidden = !on; if (m) m.hidden = on; if (l) l.hidden = on; const s = document.querySelector('#title .t-sub'); if (s) s.hidden = on; if (on) { const b = $('t2-back'); if (b) b.focus(); } };
  R.titleSaves = open;
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const p = $('t2-saves'), T = $('title'); if (p && !p.hidden && T && !T.hidden) { e.preventDefault(); open(false); } } });
  const start = () => {
    const T = $('title'); if (!T) return setTimeout(start, 200);
    arrange();
    let t = null; new MutationObserver(() => { if (busy) return; clearTimeout(t); t = setTimeout(arrange, 30); }).observe(T, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  const gt0 = R.goTitle; if (gt0) R.goTitle = (...a) => { const r = gt0(...a); open(false); arrange(); return r; };
  const css = document.createElement('style');
  css.textContent = '#title.t2 .t-wrap{gap:12px;width:min(520px,100%)}'
    + '#title.t2 .t-core{width:min(380px,80vw);margin:-10px 0 -18px}'
    + '#title.t2 .t-sub{font-size:13.5px;max-width:30em;color:#B8AE9C;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}'
    + '.t2-main{display:grid;gap:10px;width:min(420px,100%)}'
    + '.t2-main>button,.t2-pair>button{display:flex;flex-direction:column;align-items:flex-start;gap:2px;background:var(--bg2);border:1px solid var(--line);border-radius:10px;padding:10px 16px;font-weight:900;font-size:16px;color:inherit;cursor:pointer;text-align:left}'
    + '.t2-main>button small,.t2-pair>button small{font-weight:500;font-size:12px;color:var(--dim)}'
    + '.t2-main>button:first-child{padding:16px 20px;font-size:22px;letter-spacing:.08em;background:linear-gradient(180deg,#6A2420,#4A1614);border-color:var(--red);box-shadow:0 8px 30px rgba(184,50,42,.25)}'
    + '.t2-main>button:first-child small{font-size:13px;color:#E8D4C0;letter-spacing:0}'
    + '.t2-main>button:hover,.t2-pair>button:hover{border-color:var(--gold)}'
    + '.t2-pair{display:grid;grid-template-columns:1fr 1fr;gap:10px}'
    + '#title.t2 .t2-links{gap:2px 4px}#title.t2 .t2-links .t2-link{min-width:0;background:none;border:0;padding:4px 10px;font-weight:700;font-size:13.5px;color:#C8BCA8;flex-direction:row;align-items:center}'
    + '#title.t2 .t2-links .t2-link small{display:none}#title.t2 .t2-links .t2-link:hover{color:var(--gold)}'
    + '#title.t2 .t2-links .t2-link+.t2-link::before{content:"・";margin-right:8px;color:#5A5262}'
    + '.t2-saves{width:100%;display:grid;gap:12px;text-align:left}.t2-saves-head{display:flex;justify-content:space-between;align-items:center}.t2-saves-head b{font-family:var(--serif);font-size:20px;letter-spacing:.1em}'
    + '.t2-back{background:none;border:1px solid var(--line);color:inherit;border-radius:8px;padding:6px 14px;font:inherit;cursor:pointer}.t2-back:hover{border-color:var(--gold)}';
  document.head.appendChild(css);
})(window.R);
