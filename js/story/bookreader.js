// 可以翻閱的書（2026-10-18 作者：東鶴書房 x=4.7 z=-3.9 新增一本可閱讀的書，內容是作者給的圖）
// - R.BOOKS[id] = { title, sub, pages: [{ img, cap? }] }：一頁一張圖（assets/books/<id>/），打開書的時候才載入那一頁的圖。
// - R.openBook(id, where)：打開；← → 翻頁、Esc 或「闔上書」關掉；點圖可以放大看。
// - 書放在哪裡：interiors2.js 的書店 furnish 裡 c.inter(...) 呼叫 R.openBook。
(function (R) {
  R.BOOKS = R.BOOKS || {};
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let el = null, pg = 0, B = null, big = false;
  const css = () => {
    if (document.getElementById('bk-css')) return; const s = document.createElement('style'); s.id = 'bk-css';
    s.textContent = '#bk-book{position:fixed;inset:0;z-index:9000;background:rgba(10,8,6,.78);display:flex;align-items:center;justify-content:center;font-family:"Noto Serif TC","Noto Serif JP",serif}'
      + '#bk-book .bk-p{width:min(980px,96vw);max-height:96vh;display:flex;flex-direction:column;background:#F3EAD6;border:3px solid #3A2A1C;outline:6px solid #6B4A2E;box-shadow:0 10px 40px #000;color:#2A1E14;padding:14px 18px}'
      + '#bk-book .bk-hd{display:flex;align-items:center;gap:10px;border-bottom:2px solid #8A2A24;padding-bottom:8px}#bk-book .bk-hd b{font-size:20px;letter-spacing:.15em}#bk-book .bk-hd i{font-style:normal;color:#8A2A24;font-size:13px}'
      + '#bk-book .bk-x{margin-left:auto}#bk-book button{font:inherit;background:#2E3A4A;color:#F3EAD6;border:1px solid #1A222C;padding:6px 14px;cursor:pointer;border-radius:2px}#bk-book button:disabled{opacity:.35;cursor:default}'
      + '#bk-book .bk-c{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:10px 0;overflow:auto}'
      + '#bk-book .bk-c img{max-width:100%;max-height:72vh;object-fit:contain;border:2px solid #3A2A1C;background:#D8CCB0;cursor:zoom-in}'
      + '#bk-book.big .bk-c img{max-height:none;cursor:zoom-out}#bk-book .bk-cap{margin-top:8px;line-height:1.8;font-size:15px;color:#2A1E14;max-width:760px}'
      + '#bk-book .bk-empty{padding:60px 0;color:#6B4A2E}'
      + '#bk-book .bk-ft{display:flex;align-items:center;justify-content:space-between;border-top:1px solid #8A6A44;padding-top:8px}';
    document.head.appendChild(s);
  };
  const draw = () => {
    const P = B.pages || [], p = P[pg];
    el.classList.toggle('big', big);
    el.querySelector('.bk-c').innerHTML = p ? '<img alt="' + esc(B.title) + ' 第 ' + (pg + 1) + ' 頁" src="' + esc(p.img) + '">' + (p.cap ? '<div class="bk-cap">' + esc(p.cap) + '</div>' : '') : '<div class="bk-empty">（這本書還沒有內容。）</div>';
    const im = el.querySelector('.bk-c img'); if (im) im.onclick = () => { big = !big; draw(); };
    el.querySelector('.bk-pn').textContent = P.length ? (pg + 1) + ' / ' + P.length : '';
    el.querySelector('[data-k=prev]').disabled = pg <= 0; el.querySelector('[data-k=next]').disabled = pg >= P.length - 1;
    const nx = P[pg + 1]; if (nx) { const i = new Image(); i.src = nx.img; }   // 先載下一頁
  };
  const go = d => { const n = Math.max(0, Math.min((B.pages || []).length - 1, pg + d)); if (n !== pg) { pg = n; big = false; draw(); } };
  const key = e => {
    if (!el) return; const k = e.key;
    if (k === 'Escape') close(); else if (k === 'ArrowLeft' || k === 'a') go(-1); else if (k === 'ArrowRight' || k === 'd') go(1); else return;
    e.preventDefault(); e.stopPropagation();
  };
  const close = () => { if (!el) return; el.remove(); el = null; window.removeEventListener('keydown', key, true); };
  R.openBook = (id, where) => {
    B = R.BOOKS[id]; if (!B) return;
    css(); close(); pg = 0; big = false; el = document.createElement('div'); el.id = 'bk-book';
    el.innerHTML = '<div class="bk-p"><div class="bk-hd"><b>' + esc(B.title) + '</b><i>' + esc([where, B.sub].filter(Boolean).join('・')) + '</i><button class="bk-x" data-k="close">闔上書</button></div><div class="bk-c"></div><div class="bk-ft"><button data-k="prev">◀ 上一頁</button><span class="bk-pn"></span><button data-k="next">下一頁 ▶</button></div></div>';
    el.addEventListener('click', e => { if (e.target === el) return close(); const b = e.target.closest('button'); if (!b) return; if (b.dataset.k === 'prev') go(-1); else if (b.dataset.k === 'next') go(1); else if (b.dataset.k === 'close') close(); });
    ['keydown', 'keyup', 'mousedown', 'wheel', 'touchstart'].forEach(t => el.addEventListener(t, e => e.stopPropagation()));
    document.body.appendChild(el); window.addEventListener('keydown', key, true); draw();
  };
  R.bookOpen = () => !!el; R.closeBook = close;
  // ---------- 書 ----------
  // 東鶴書房 x=4.7 z=-3.9 的書架（2026-10-18 作者：圖等一下給）
  R.BOOKS.dhshelf = R.BOOKS.dhshelf || { title: '獸的誘惑', sub: '', pages: [] };   // 圖：assets/books/dhshelf/p01.webp…（作者給的圖切成一格一頁）
})(window.R = window.R || {});
