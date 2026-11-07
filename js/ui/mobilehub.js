// 手機版的公會、鐵匠鋪、倉庫、白藤堂（2026-10-27 作者：去設計手機版）
// 原本手機上最上面有兩排按鈕＋一排狀態，加上招牌、狀態列，要往下滑半個畫面才看到東西。改成手機 App 的樣子：
// - 四家店的分頁搬到畫面最下面（大拇指按得到），每一顆有家紋字（令・鍛・蔵・藥），選中的那家用店的主色（hubtheme.js 的 --hb-acc）。
// - 上面只剩一排：城市名、地圖、圖鑑、標題、✕（「回到街上」跟 ✕ 是同一件事，手機上藏起來）。
// - 日期、錢、藥水那一排縮成一行、可以橫著滑；招牌、狀態列、說明文字縮小。
// 只在窄的畫面（640px 以下）搬；畫面變寬（桌機）就搬回原本的位置。按鈕本身沒換，點了照樣是 R.hub(...)。
// 2026-10-27 作者：手機應該要橫式遊玩 → 橫的手機（高度 500px 以下）：店家改成左邊一條直的欄，日期、錢併進上面那一排，內容區盡量高。
(function (R) {
  const $ = id => document.getElementById(id);
  const mq = matchMedia('(max-width:640px)'), mql = matchMedia('(max-height:500px) and (orientation:landscape)');
  const MON = { guild: '令', smith: '鍛', stash: '蔵', shop: '藥' };
  let nav = null;
  const place = () => {
    const hub = $('hub'), bar = hub && hub.querySelector(':scope > .bar'); if (!hub || !bar) return;
    const tabs = [...document.querySelectorAll('#hub [data-htab]')];
    const land = mql.matches, stat = $('hub-stat');
    if (mq.matches || land) {
      if (!nav) { nav = document.createElement('nav'); nav.id = 'hub-nav'; nav.setAttribute('aria-label', '店家'); }
      if (nav.parentNode !== hub) hub.appendChild(nav);
      tabs.forEach(b => {
        if (!b.querySelector('.mh-mon')) { const t = b.textContent; b.innerHTML = '<span class="mh-mon" aria-hidden="true">' + (MON[b.dataset.htab] || '・') + '</span><span class="mh-lab">' + t + '</span>'; }
        if (b.parentNode !== nav) nav.appendChild(b);
      });
      hub.classList.add('mh-on'); hub.classList.toggle('mh-land', land);
      if (stat) { if (land) { if (stat.parentNode !== bar) bar.insertBefore(stat, bar.querySelector('.grow')); } else if (stat.parentNode === bar) bar.after(stat); }
    } else {
      const grow = bar.querySelector('.grow');
      tabs.forEach(b => { const l = b.querySelector('.mh-lab'); if (l) b.textContent = l.textContent; bar.insertBefore(b, grow); });
      if (nav && nav.parentNode) nav.remove();
      hub.classList.remove('mh-on', 'mh-land');
      if (stat && stat.parentNode === bar) bar.after(stat);
    }
  };
  [mq, mql].forEach(m => { if (m.addEventListener) m.addEventListener('change', place); else if (m.addListener) m.addListener(place); });
  const hub0 = R.hub;
  if (hub0) R.hub = (t, f) => { const r = hub0(t, f); try { place(); } catch (e) { console.warn('[mobilehub]', e); } return r; };
  const css = document.createElement('style'); css.id = 'mobilehub';
  css.textContent = [
    '#hub.mh-on>.bar{flex-wrap:nowrap;gap:6px;padding:6px 10px;padding-top:max(6px,env(safe-area-inset-top))}',
    '#hub.mh-on>.bar h1{font-size:16px;margin-right:auto}',
    '#hub.mh-on>.bar .grow,#hub.mh-on>.bar #h-street{display:none}',
    '#hub.mh-on>.bar .iconbtn{height:30px;padding:0 9px;font-size:13px}',
    '#hub.mh-on>.bar .cx-x{position:static;width:34px;height:34px;flex:0 0 auto}',
    '#hub.mh-on .hub-stat{flex-wrap:nowrap;overflow-x:auto;white-space:nowrap;gap:14px;padding:5px 12px;font-size:12px;scrollbar-width:none}',
    '#hub.mh-on .hub-stat::-webkit-scrollbar{display:none}',
    '#hub.mh-on .hub-stat b{font-size:13px}',
    '#hub.mh-on .hub-body{padding:10px 10px 16px}',
    // 下面的店家列
    '#hub-nav{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;padding:6px 8px;padding-bottom:max(6px,env(safe-area-inset-bottom));background:linear-gradient(180deg,#1B1720,#120F16);border-top:1px solid var(--hb-edge,var(--line));box-shadow:0 -6px 18px rgba(0,0,0,.45);flex:0 0 auto}',
    '#hub-nav .tab{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;min-height:52px;padding:4px 2px;border-radius:10px;border:1px solid transparent;background:transparent;color:#B9AE9A;font-size:12px;font-weight:700;letter-spacing:.04em}',
    '#hub-nav .mh-mon{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;font-family:var(--serif);font-size:15px;font-weight:900;background:rgba(255,255,255,.06);color:#D8CCB4}',
    '#hub-nav .tab[aria-selected="true"]{background:color-mix(in srgb,var(--hb-acc,#C9A13A) 16%,transparent);border-color:color-mix(in srgb,var(--hb-acc,#C9A13A) 55%,transparent);color:#FFF4E2}',
    '#hub-nav .tab[aria-selected="true"] .mh-mon{background:var(--hb-acc-d,#7A3426);color:#FFF6EA;box-shadow:0 0 10px color-mix(in srgb,var(--hb-acc,#C9A13A) 55%,transparent)}',
    // 招牌、狀態列、分頁縮小
    '#hub.mh-on .gh-board{padding:6px 12px 6px 6px}',
    '#hub.mh-on .gh-board h2{font-size:18px}',
    '#hub.mh-on .gh-kamon{width:30px;height:30px;font-size:16px}',
    '#hub.mh-on .gh-sign .note,#hub.mh-on .gh-sign>p{font-size:13px;margin:6px 0}',
    '#hub.mh-on .gh-sum{padding:8px;gap:8px;grid-template-columns:repeat(2,minmax(0,1fr))}',
    '#hub.mh-on .gh-s{padding:2px 0 2px 8px}',
    '#hub.mh-on .gh-s b{font-size:14px}',
    '#hub.mh-on .gh-s small{font-size:11px}',
    '#hub.mh-on .gh-s-task{grid-column:1/-1}',
    '#hub.mh-on .gh-noren,#hub.mh-on .subtabs{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}',
    '#hub.mh-on .gh-tab,#hub.mh-on .subtabs .tab{flex:0 0 auto;padding:8px 12px;font-size:14px}',
    '#hub.mh-on .recipes{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
    '#hub.mh-on .recipe{padding:8px}',
    '#hub.mh-on .recipe b{font-size:14px}',
    '#hub.mh-on .recipe small,#hub.mh-on .note{font-size:13px}',
    '#hub.mh-on .recipe .btn{min-height:36px}',
    // ---------- 橫的手機 ----------
    '#hub.mh-land{display:grid;grid-template-columns:auto minmax(0,1fr);grid-template-rows:auto minmax(0,1fr)}',
    '#hub.mh-land>.bar{grid-column:2;grid-row:1;padding:4px 10px;padding-right:max(10px,env(safe-area-inset-right))}',
    '#hub.mh-land>.bar h1{margin-right:0}',
    '#hub.mh-land>.bar .hub-stat{flex:1;min-width:0;border:0;background:transparent;padding:0 6px}',
    '#hub.mh-land>.hub-body{grid-column:2;grid-row:2;padding:8px 12px 12px;padding-right:max(12px,env(safe-area-inset-right))}',
    '#hub.mh-land>#hub-nav{grid-column:1;grid-row:1/3;grid-template-columns:none;grid-auto-rows:minmax(0,1fr);width:74px;padding:6px 5px;padding-left:max(5px,env(safe-area-inset-left));padding-bottom:max(6px,env(safe-area-inset-bottom));border-top:0;border-right:1px solid var(--hb-edge,var(--line));box-shadow:6px 0 18px rgba(0,0,0,.4)}',
    '#hub.mh-land #hub-nav .tab{min-height:0}',
    '#hub.mh-land .gh-sign{display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px}',
    '#hub.mh-land .gh-sign>.note,#hub.mh-land .gh-sign>p{flex:1 1 260px;margin:0}',
    '#hub.mh-land .gh-sum{grid-template-columns:repeat(3,minmax(0,1fr));margin:8px 0}',
    '#hub.mh-land .gh-s-task{grid-column:auto}',
    '#hub.mh-land .recipes{grid-template-columns:repeat(auto-fill,minmax(190px,1fr))}'
  ].join('\n');
  document.head.appendChild(css);
})(window.R = window.R || {});
