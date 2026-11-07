// 倉庫頁面裡的背包（2026-10-18 作者：倉庫頁面左邊的背包內物品，直接改顯示新的背包畫面）
// - 倉庫頁面（衣櫃）原本中間那欄是「背包：經驗書、抽選券」和身上的裝備卡片、右邊「身上的東西」「角色總數值」；
//   改成直接放新的背包畫面（baglayout.js：裝備＋角色、勇者證、角色素質、背包格、任務道具），在倉庫格旁邊。
// - 怎麼放：背包畫面是 R.bagSheet 畫在 #r-sheet（視窗）裡的；這裡畫的時候暫時把頁面上的空位叫做 r-sheet，畫完換回來
//   （原本的按鈕、拖曳、點一下看說明都照用；之後再按什麼重畫，也是畫回這個空位，不會跳出視窗）。
// - 我的套裝、篩選、批次賣出、裝備詳細照舊留著。
// 放在 townbar.js 後面（包住最外層的 R.bagSheet、R.hub）。
(function (R) {
  const $ = id => document.getElementById(id);
  let host = null, busy = false;
  const live = () => host && host.isConnected;
  const render = () => {
    const real = $('r-sheet'), modal = $('r-modal'); if (!real || !modal || !live()) return;
    const hid = modal.hidden, W = R.W || {}, pz = W.paused;
    busy = true; real.id = 'r-sheet-off'; host.id = 'r-sheet';
    try { bs1(); } catch (e) { console.warn('[stashbag]', e); }
    finally { host.id = ''; real.id = 'r-sheet'; modal.hidden = hid; W.paused = pz; busy = false; }
    // 頁面裡不用拖動視窗、不用關上鈕
    host.classList.remove('tk-win'); host.style.transform = '';
    const hd = host.querySelector('.tk-head'); if (hd) { hd.onpointerdown = null; hd.style.cursor = 'default'; hd.removeAttribute('title'); }
    const x = host.querySelector('#bag-x'); if (x) { const row = x.closest('.row'); (row || x).remove(); }
    const sb = host.querySelector('#tb-stash'); if (sb) { const row = sb.closest('.row'); (row || sb).remove(); }   // 已經在倉庫了

  };
  const bs1 = R.bagSheet;
  R.bagSheet = (...a) => {
    const hub = $('hub'); if (!busy && live() && hub && !hub.hidden) { render(); return; }   // 倉庫頁面開著：畫在頁面裡
    return bs1(...a);
  };
  const hub0 = R.hub;
  R.hub = (t, f) => {
    const r = hub0(t, f);
    try {
      const tab = document.querySelector('[data-htab][aria-selected="true"]'), body = $('hub-body'); host = null;
      if (!tab || tab.dataset.htab !== 'stash' || !body) return r;
      const cols = body.querySelector('.sw-cols'), M = body.querySelector('.sw-m'), sec = M && M.querySelector('.sx-stash'); if (!cols || !sec) return r;
      // 原本的「背包：經驗書、抽選券」、身上的裝備卡片拿掉（新的背包畫面都有）
      [...sec.querySelectorAll(':scope > div')].forEach(d => { const h = d.querySelector(':scope > h3'); if (h && /^背包/.test(h.textContent || '')) d.hidden = true; });
      sec.querySelectorAll(':scope > .slots').forEach(d => { d.hidden = true; });
      body.querySelectorAll('.sw-r .hs-own, .sw-r details.cs-box').forEach(d => { if (!d.classList.contains('sw-detail')) d.hidden = true; });
      host = document.createElement('div'); host.className = 'sb-host';
      const after = sec.querySelector(':scope > .gh-board'); const note = after && after.nextElementSibling && after.nextElementSibling.matches('p.note') ? after.nextElementSibling : after;
      if (note) note.after(host); else sec.prepend(host);
      cols.classList.add('sb-on');
      render();
      // 2026-10-27：任務道具包已經在背包畫面的右下（baglayout.js），questbag.js 另外放在頁面最下面的那份拿掉（原本倉庫頁看得到兩份）
      body.querySelectorAll('.qb-box').forEach(b => { if (!host.contains(b)) b.remove(); });
    } catch (e) { console.warn('[stashbag]', e); }
    return r;
  };
  const css = document.createElement('style');
  css.textContent = '.sw-cols.sb-on{grid-template-columns:minmax(0,640px) minmax(0,1fr)}.sw-cols.sb-on .sw-r{grid-column:2;position:static;max-height:none}'
    + '.sb-host{container-type:inline-size;margin:6px 0 12px;padding:8px;border:1px solid var(--line,#5A4A30);border-radius:10px;background:rgba(0,0,0,.18)}'
    + '.sb-host .tk-head{cursor:default}.sb-host .tk-head h2{font-size:18px;margin:0}'
    + '.sb-host.bl-on .bl{height:auto;grid-template-columns:minmax(300px,44%) 1fr}.sb-host.bl-on .bl-stats{max-height:340px}.sb-host.bl-on .bl-bag .tk-gridwrap{max-height:420px}'
    + '@container (max-width:680px){.sb-host.bl-on .bl{grid-template-columns:1fr}}'
    + '@media (max-width:1100px){.sw-cols.sb-on{grid-template-columns:1fr}.sw-cols.sb-on .sw-r{grid-column:auto}}';
  document.head.appendChild(css);
})(window.R = window.R || {});
