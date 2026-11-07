// 關閉按鈕統一在右上角（2026-10-14 作者：頁面的關閉鍵要一致放在右上角）
// - #r-sheet（遊戲裡的視窗：背包、地圖、技能書、Esc 選單、委託……）和 #hub-sheet（公會、鐵匠鋪、倉庫、白藤堂上的小視窗）：
//   每次內容換掉就在右上角放一顆 ✕。按下去＝按原本那個「關上／關閉／好了／走了……」鍵（各視窗自己的關閉邏輯照舊），
//   原本純關閉的鍵藏起來；找不到就直接關掉視窗。
// - 東鶴的公會／鐵匠鋪／倉庫／白藤堂整頁（#hub）：上方列最右邊多一顆 ✕＝回到街上。
(function (R) {
  const PURE = /^(關上|關閉|好|好了|知道了|走了|離開|收起|收起來|回去|算了|不用了|先不要|看看就好|再逛逛|關掉)(（.*）)?$/;
  const findClose = sh => {
    const bs = [...sh.querySelectorAll('button')].filter(b => !b.classList.contains('cx-x') && !b.closest('.cx-keep'));
    const t = b => b.textContent.trim();
    return bs.find(b => /-x$/.test(b.id) && PURE.test(t(b))) || bs.find(b => PURE.test(t(b)) && b.closest('.row')) || bs.find(b => /-x$/.test(b.id)) || null;
  };
  const fallback = sh => { if (sh.id === 'hub-sheet') { R.hubSheetClose ? R.hubSheetClose() : (document.getElementById('hub-modal').hidden = true); } else if (R.closeSheet) R.closeSheet(); };
  const fix = sh => {
    if (!sh) return;
    let x = sh.querySelector(':scope > .cx-x, :scope > .ps-m > .cx-x');   // 2026-10-15：暫停選單三欄排版（pauselayout.js）會把 ✕ 收進中間那欄，那顆也算──不然每開一次多一顆
    const tgt = findClose(sh);
    sh.querySelectorAll('.cx-hid').forEach(b => { if (b !== tgt) b.classList.remove('cx-hid'); });
    if (!x) { x = document.createElement('button'); x.type = 'button'; x.className = 'cx-x'; x.textContent = '✕'; x.setAttribute('aria-label', '關閉'); sh.prepend(x);
      x.addEventListener('click', e => { e.stopPropagation(); const t = findClose(sh); if (t) t.click(); else fallback(sh); }); }
    x.title = tgt ? tgt.textContent.trim() : '關閉';
    if (tgt && PURE.test(tgt.textContent.trim())) {
      tgt.classList.add('cx-hid');

    }
  };
  const watch = id => {
    const sh = document.getElementById(id); if (!sh) return;
    let q = false; new MutationObserver(() => { if (q) return; q = true; queueMicrotask(() => { q = false; fix(sh); }); }).observe(sh, { childList: true });
    fix(sh);
  };
  const init = () => {
    watch('r-sheet'); watch('hub-sheet');
    const bar = document.querySelector('#hub > .bar'), st = document.getElementById('h-street');
    if (bar && st && !bar.querySelector('.cx-hub')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'cx-x cx-hub'; b.textContent = '✕'; b.title = '回到街上'; b.setAttribute('aria-label', '回到街上'); b.addEventListener('click', () => st.click()); bar.appendChild(b); }
  };
  const css = document.createElement('style');
  css.textContent = '#r-sheet,#hub-sheet{position:relative}'
    + '.cx-x{position:sticky;top:0;float:right;z-index:30;margin:-6px -6px 4px 8px;width:34px;height:34px;border-radius:8px;border:1px solid #6A5638;background:#1A1620;color:#E8DCC0;font-size:18px;line-height:1;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.5)}'
    + '.cx-x:hover{background:#2A2230;border-color:#C8A060;color:#FFE08A}.cx-x:focus-visible{outline:2px solid #FFE08A}'
    + '.cx-hub{position:static;float:none;margin:0 0 0 8px;flex:none}'
    + '.cx-hid{display:none!important}.row.cx-empty:not(:has(> :not(.cx-hid))){display:none}'
    + 'body.touch .cx-x{width:40px;height:40px}';
  document.head.appendChild(css);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})(window.R);
