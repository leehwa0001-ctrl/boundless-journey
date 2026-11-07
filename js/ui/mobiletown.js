// 手機版城裡左上角（2026-10-27 作者：城裡左上的指引、錢、疲憊、信譽四塊疊在一起，手機上偏擠，可以收成一塊）
// - 錢（r-town）、疲憊（r-fat）、信譽（r-rep）、理智（r-san）收進同一塊「#tl-stat」，排成一兩行；元素本身沒換（其他程式照 id 更新數字照樣有效）。
// - 新手指引（gd-box）字縮小、按鈕放同一行。
// 只在手機（body.touch）上搬；電腦版不動。遺跡裡生命、魔力那塊（r-bl）在上面，這塊跟在後面。
(function (R) {
  const $ = id => document.getElementById(id);
  const IDS = ['r-town', 'r-san', 'r-fat', 'r-rep'];
  const pack = () => {
    if (!document.body.classList.contains('touch')) return false;
    const tl = $('r-tl'), fat = $('r-fat'); if (!tl || !fat) return false;
    let box = $('tl-stat');
    if (!box) { box = document.createElement('div'); box.id = 'tl-stat'; box.className = 'glass'; fat.before(box); }
    IDS.forEach(id => { const e = $(id); if (e && e.parentNode !== box) box.appendChild(e); });
    return true;
  };
  let n = 0; const iv = setInterval(() => { if (pack() || ++n > 60) clearInterval(iv); }, 500);
  const css = document.createElement('style'); css.id = 'mobiletown';
  css.textContent = [
    'body.touch #tl-stat{display:flex;flex-wrap:wrap;align-items:center;gap:2px 12px;padding:5px 9px;font-size:12px;line-height:1.5}',
    'body.touch #tl-stat>.glass{background:none!important;border:0!important;box-shadow:none!important;padding:0!important;margin:0!important;min-height:0;font-size:12px;backdrop-filter:none}',
    'body.touch #tl-stat>#r-town>span{display:inline-flex;gap:8px;align-items:center}',
    'body.touch #tl-stat:not(:has(>:not([hidden]):not([style*="display: none"])))' + '{display:none}',
    'body.touch #gd-box{padding:5px 9px;gap:2px}',
    'body.touch #gd-box small{font-size:10.5px}',
    'body.touch #gd-box b{font-size:12.5px;line-height:1.4}',
    'body.touch #gd-box>span{display:inline-flex;gap:6px;margin-top:2px}',
    'body.touch #gd-box .mini{min-height:24px;padding:1px 8px;font-size:11.5px}'
  ].join('\n');
  document.head.appendChild(css);
})(window.R = window.R || {});
