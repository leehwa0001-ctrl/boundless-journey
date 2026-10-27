// 橫著拿手機玩（2026-10-27 作者：手機應該要能橫式遊玩）
// 直的、橫的都能玩，不鎖方向。橫的時候：
// - 瀏海、圓角在左右兩邊：遊戲畫面（3D）照樣滿版，HUD、搖桿、按鈕往內縮到安全範圍（env(safe-area-inset-*)）。
// - 畫面只有 360～430px 高：視窗（暫停選單、背包、對話……）最高到螢幕高度、裡面捲動，標題、按鈕縮小一點。
// 公會、鐵匠鋪、倉庫、白藤堂的橫式版面在 mobilehub.js。
(function () {
  const L = '@media (orientation:landscape) and (max-height:500px)';
  const css = document.createElement('style'); css.id = 'mobileland';
  css.textContent = [
    L + '{',
    '#r-tl,#joy-l{translate:env(safe-area-inset-left) 0}',
    '#r-tr,#joy-r{translate:calc(-1 * env(safe-area-inset-right)) 0}',
    '#r-br{left:env(safe-area-inset-left)!important;right:env(safe-area-inset-right)!important}',
    '#r-modal .sheet,#r-sheet{max-height:calc(100dvh - 12px);overflow:auto;margin-top:6px;margin-bottom:6px}',
    '#r-sheet h2{font-size:18px;margin:4px 0 8px}',
    '#r-sheet .btn{min-height:36px;padding-top:6px;padding-bottom:6px}',
    '#r-sheet p{margin:6px 0}',
    '}'
  ].join('\n');
  document.head.appendChild(css);
})();
