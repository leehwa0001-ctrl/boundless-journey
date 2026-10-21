// 標題畫面（2026-10-21 作者：主畫面要像真的遊戲主畫面；選「A：城市夜景當背景」）
// - 背景：最後離開的地點（下面的 PLACE）；沒有的話三座城的夜景（岳北運河、吉山霓虹十字路口、皇嶺大通；遊戲裡用像素畫法實際拍的 1920×1080，assets/title/），
//   慢慢平移、二十秒換一張（淡入淡出），上面飄雪。左邊壓暗一點讓字看得清楚。
// - 左邊：標題、直排的選單（繼續冒險／新的冒險／選擇存檔／攤開地圖／遺跡生物圖鑑／種族一覽），↑↓ 選、Enter 確定，滑鼠移上去也會選。
// - 右下：更新公告的卡片（日期、第一條的開頭、沒點過有紅點）；左下：版本（最新一次更新的日期）。
// - 存檔三格和存檔轉移收進「選擇存檔」（選單的位置換成存檔，「返回」或 Esc 收回）。
// 按鈕都是原本的（main.js、news.js、racelist.js、savecode.js 畫的，onclick 不變），只搬位置、換樣子；標題畫面重畫時用 MutationObserver 再排一次。
// 放在 main.js、savecode.js、news.js 後面。
(function (R) {
  const $ = id => document.getElementById(id);
  const SHOTS = ['assets/title/night-yuebei.jpg', 'assets/title/night-jishan.jpg', 'assets/title/night-huangling.jpg'];
  // 2026-10-21 作者：依離開的地點換背景（存檔裡的 R.S.lastPlace，runsave.js 記的）：遺跡＝佩特拉核心、東鶴＝雪景、皇嶺＝皇城，其他城市＝那座城的夜景。
  //   最後玩的那一格存檔（R.slot，saves.js 記在 ruins1433-last）沒有 lastPlace（舊存檔、新的冒險）就照原本三張輪流。圖都在 assets/title/（遊戲裡實際拍的 1920×1080）。
  const PLACE = { ruin: 'ruin-petra', donghe: 'donghe-snow', huangling: 'huangling-castle', jishan: 'night-jishan', yuebei: 'night-yuebei', hosu: 'night-hosu', futing: 'night-futing', xijian: 'night-xijian',
    nanlong: 'night-nanlong', woqi: 'night-woqi', zhengyuan: 'night-zhengyuan', banbei: 'night-banbei', bannan: 'night-bannan', gusen: 'night-gusen' };
  const shotsNow = () => {
    let lp = R.S && R.S.lastPlace;
    if (!lp) { try { const s = JSON.parse(localStorage.getItem('ruins1433-slot' + (R.slot || 1)) || 'null'); lp = s && s.lastPlace; } catch (e) { } }
    const f = lp && PLACE[lp.id];
    return f ? ['assets/title/' + f + '.jpg'] : SHOTS;
  };
  const shotsHtml = L => L.map((s, i) => '<div class="t2-shot' + (i ? '' : ' on') + '" style="background-image:url(' + s + ')"></div>').join('');
  // 標題畫面再出現（回到標題、換存檔）時，最後的地點可能變了：換圖
  const syncBg = () => { const b = $('t2-bg'); if (!b) return; const L = shotsNow(), k = L.join('|'); if (b.dataset.k === k) return; b.dataset.k = k; b.querySelectorAll('.t2-shot').forEach(x => x.remove()); b.insertAdjacentHTML('afterbegin', shotsHtml(L)); };
  let busy = false, sel = 0;
  // ---------- 背景：夜景＋飄雪 ----------
  const bg = T => {
    if ($('t2-bg')) return;
    const b = document.createElement('div'); b.id = 't2-bg'; b.setAttribute('aria-hidden', 'true');
    const L0 = shotsNow(); b.dataset.k = L0.join('|');
    b.innerHTML = shotsHtml(L0) + '<canvas id="t2-snow"></canvas><div class="t2-shade"></div>';
    T.prepend(b);
    let k = 0; setInterval(() => { if (T.hidden) return; const s = b.querySelectorAll('.t2-shot'); if (s.length < 2) return; k = Math.min(k, s.length - 1); s[k].classList.remove('on'); k = (k + 1) % s.length; s[k].classList.add('on'); }, 20000);
    // 雪：一格一格的小白點，慢慢往下飄、左右晃
    const cv = $('t2-snow'), g = cv.getContext('2d'), N = 90, fl = [];
    const size = () => { cv.width = Math.ceil(cv.clientWidth / 3); cv.height = Math.ceil(cv.clientHeight / 3); };
    for (let i = 0; i < N; i++) fl.push({ x: Math.random(), y: Math.random(), v: 0.02 + Math.random() * 0.04, p: Math.random() * 6, s: Math.random() < 0.2 ? 2 : 1 });
    let last = 0;
    const tick = now => {
      requestAnimationFrame(tick); if (T.hidden || document.hidden) return;
      const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
      if (cv.width !== Math.ceil(cv.clientWidth / 3)) size();
      g.clearRect(0, 0, cv.width, cv.height); g.fillStyle = 'rgba(240,244,250,.75)';
      fl.forEach(f => { f.y += f.v * dt; f.p += dt * 0.6; if (f.y > 1) { f.y = 0; f.x = Math.random(); } const x = (f.x + Math.sin(f.p) * 0.01) * cv.width, y = f.y * cv.height; g.fillRect(Math.round(x), Math.round(y), f.s, f.s); });
    };
    requestAnimationFrame(tick);
  };
  // ---------- 排版 ----------
  const items = () => [...document.querySelectorAll('#t2-menu > button:not([hidden])')];
  const focus = i => { const it = items(); if (!it.length) return; sel = (i + it.length) % it.length; it.forEach((b, j) => b.classList.toggle('sel', j === sel)); };
  const arrange = () => {
    const T = $('title'), wrap = T && T.querySelector('.t-wrap'), btns = T && T.querySelector('.t-btns'); if (!wrap || !btns || busy) return;
    busy = true;
    try {
      T.classList.add('t2'); bg(T); syncBg();
      const go = $('t-go'), nw = $('t-new'), news = $('t-news');
      if (go && go.firstChild && go.firstChild.nodeType === 3 && go.firstChild.textContent !== '繼續冒險') go.firstChild.textContent = '繼續冒險';
      let pick = $('t2-pick'); if (!pick) { pick = document.createElement('button'); pick.type = 'button'; pick.id = 't2-pick'; pick.innerHTML = '選擇存檔<small>三格存檔・匯出、匯入</small>'; pick.onclick = () => open(true); }
      let menu = $('t2-menu'); if (!menu) { menu = document.createElement('nav'); menu.id = 't2-menu'; menu.className = 't2-menu'; menu.setAttribute('aria-label', '主選單'); btns.before(menu); }
      // 選單的順序：繼續冒險、新的冒險、選擇存檔、其他（地圖、圖鑑、種族……；更新公告放右下的卡片）
      const order = [go, nw, pick].concat([...btns.querySelectorAll('button')].filter(b => b !== news && b !== go && b !== nw && b !== pick)).filter(Boolean);
      order.forEach((b, i) => { if (menu.children[i] !== b) menu.insertBefore(b, menu.children[i] || null); if (!b.dataset.t2) { b.dataset.t2 = 1; b.addEventListener('mouseenter', () => focus(items().indexOf(b))); b.addEventListener('focus', () => focus(items().indexOf(b))); } });
      btns.classList.add('t2-old');
      // 更新公告：右下的卡片（點了就是原本的按鈕）；紅點留到自己點過為止
      if (news) {
        const sm = news.querySelector('small'), ver = sm ? sm.textContent : '', top = R.UPDATES && R.UPDATES[0];
        let clicked = ''; try { clicked = localStorage.getItem('tfl-news-click') || ''; } catch (e) { }
        let card = $('t2-news'); if (!card) { card = document.createElement('button'); card.type = 'button'; card.id = 't2-news'; card.className = 't2-news'; T.appendChild(card); card.onclick = () => { try { localStorage.setItem('tfl-news-click', ver); } catch (e) { } card.classList.remove('new'); news.click(); }; }
        const first = top && top.items && top.items[0] ? String(top.items[0]).replace(/<[^>]+>/g, '') : '';
        const html = '<span class="t2-news-k">更新公告<i class="news-dot"></i></span><b>' + (R.esc ? R.esc(ver) : ver) + '</b><small>' + (R.esc ? R.esc(first.slice(0, 46)) : first.slice(0, 46)) + (first.length > 46 ? '……' : '') + '</small>';
        if (card.dataset.h !== html) { card.innerHTML = html; card.dataset.h = html; }
        card.classList.toggle('new', !!ver && clicked !== ver);
      }
      // 版本
      let ver = $('t2-ver'); if (!ver) { ver = document.createElement('div'); ver.id = 't2-ver'; ver.className = 't2-ver'; T.appendChild(ver); }
      const v = 'v' + (R.UPDATES && R.UPDATES[0] ? R.UPDATES[0].d.replace(/-/g, '.') : ''); if (ver.textContent !== v) ver.textContent = v;
      // 存檔、存檔轉移：收進面板
      let panel = $('t2-saves'); if (!panel) { panel = document.createElement('div'); panel.id = 't2-saves'; panel.className = 't2-saves'; panel.hidden = true; panel.innerHTML = '<div class="t2-saves-head"><b>選擇存檔</b><button type="button" class="t2-back" id="t2-back">返回</button></div>'; wrap.appendChild(panel); panel.querySelector('#t2-back').onclick = () => open(false); }
      ['t-slots', 't-transfer'].forEach(id => { const el = $(id); if (el && el.parentNode !== panel) panel.appendChild(el); });
      focus(Math.min(sel, items().length - 1));
    } catch (e) { console.warn('[title2]', e); }
    busy = false;
  };
  const open = on => { const p = $('t2-saves'), m = $('t2-menu'); if (!p) return; p.hidden = !on; if (m) m.hidden = on; if (on) { const b = $('t2-back'); if (b) b.focus(); } else focus(sel); };
  R.titleSaves = open;
  // 鍵盤：↑↓ 選、Enter／空白確定、Esc 收回存檔
  document.addEventListener('keydown', e => {
    const T = $('title'); if (!T || T.hidden || !T.classList.contains('t2') || document.querySelector('.news-ov') || (R.sheetOpen && R.sheetOpen())) return;
    const p = $('t2-saves');
    if (e.key === 'Escape' && p && !p.hidden) { e.preventDefault(); open(false); return; }
    if (p && !p.hidden) return;
    if (e.key === 'ArrowDown' || e.key === 's') { e.preventDefault(); focus(sel + 1); }
    else if (e.key === 'ArrowUp' || e.key === 'w') { e.preventDefault(); focus(sel - 1); }
    else if (e.key === 'Enter' || e.key === ' ') { const it = items()[sel]; if (it && document.activeElement !== it) { e.preventDefault(); it.click(); } }
  });
  const start = () => {
    const T = $('title'); if (!T) return setTimeout(start, 200);
    arrange();
    let t = null; new MutationObserver(() => { if (busy) return; clearTimeout(t); t = setTimeout(arrange, 30); }).observe(T, { childList: true, subtree: true, attributes: true, attributeFilter: ['hidden'] });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  const gt0 = R.goTitle; if (gt0) R.goTitle = (...a) => { const r = gt0(...a); open(false); arrange(); return r; };
  const css = document.createElement('style');
  css.textContent = '#title.t2{position:relative;overflow:hidden;justify-content:center;align-items:flex-start;background:#0B0A10;min-height:100vh;min-height:100dvh;box-sizing:border-box;padding-bottom:56px}'
    + '#t2-bg{position:absolute;inset:0;z-index:0;pointer-events:none}'
    + '.t2-shot{position:absolute;inset:-6%;background:center/cover no-repeat;image-rendering:pixelated;opacity:0;transition:opacity 2.5s ease;animation:t2pan 46s ease-in-out infinite alternate}'
    + '.t2-shot.on{opacity:1}.t2-shot:nth-child(2){animation-delay:-15s}.t2-shot:nth-child(3){animation-delay:-30s}'
    + '@keyframes t2pan{from{transform:translate(-2.5%,-1.5%) scale(1.04)}to{transform:translate(2.5%,1.5%) scale(1.1)}}'
    + '#t2-snow{position:absolute;inset:0;width:100%;height:100%;image-rendering:pixelated}'
    + '.t2-shade{position:absolute;inset:0;background:linear-gradient(90deg,rgba(8,7,12,.92) 0%,rgba(8,7,12,.72) 32%,rgba(8,7,12,.15) 62%,rgba(8,7,12,.35) 100%),linear-gradient(0deg,rgba(8,7,12,.6),transparent 30%)}'
    + '#title.t2 .t-wrap{position:relative;z-index:1;width:min(440px,100%);margin:0 0 0 max(5vw,24px);justify-items:start;text-align:left;gap:10px}'
    + '#title.t2 .t-core,#title.t2 .t-sub,#title.t2 .t2-old{display:none}'
    + '#title.t2 .t-kicker{letter-spacing:.2em}#title.t2 .t-name{font-size:clamp(40px,7vw,76px);text-align:left;text-shadow:0 4px 24px rgba(0,0,0,.6)}#title.t2 .t-name small{letter-spacing:.35em}'
    + '.t2-menu{display:grid;gap:2px;margin-top:18px;width:100%}'
    + '.t2-menu>button{display:flex;flex-direction:column;align-items:flex-start;gap:1px;background:none;border:0;border-left:3px solid transparent;color:#D8CEBC;font:inherit;font-weight:900;font-size:19px;letter-spacing:.06em;padding:8px 14px;cursor:pointer;text-align:left;border-radius:0;transition:color .15s,border-color .15s,background .15s,padding .15s}'
    + '.t2-menu>button small{font-weight:500;font-size:12px;color:#8E8496;letter-spacing:0}'
    + '.t2-menu>button.sel,.t2-menu>button:focus-visible{color:#F4E2B0;border-left-color:#C8323A;background:linear-gradient(90deg,rgba(200,50,58,.22),transparent);padding-left:20px;outline:none}'
    + '.t2-menu>button.sel small{color:#C8B898}'
    + '#t-go{font-size:26px!important}'
    + '.t2-news{position:absolute;z-index:1;right:max(3vw,16px);bottom:max(4vh,16px);width:min(300px,80vw);display:grid;gap:3px;text-align:left;background:rgba(14,12,20,.78);border:1px solid #3A3244;border-radius:10px;padding:12px 14px;color:#E8DFCF;font:inherit;cursor:pointer}'
    + '.t2-news:hover{border-color:#C9B27A}.t2-news-k{font-size:12px;letter-spacing:.15em;color:#C9B27A}.t2-news b{font-size:15px}.t2-news small{font-size:12.5px;color:#A89CB0;line-height:1.45}'
    + '.t2-news .news-dot{display:none;width:8px;height:8px;border-radius:50%;background:#FF5A4A;margin-left:6px;vertical-align:middle}.t2-news.new .news-dot{display:inline-block}'
    + '.t2-ver{position:absolute;z-index:1;left:max(5vw,24px);bottom:max(3vh,12px);font-size:12px;color:#7A7084;letter-spacing:.1em}'
    + '.t2-saves{width:min(640px,92vw);display:grid;gap:12px;text-align:left;margin-top:12px;background:rgba(14,12,20,.86);border:1px solid #3A3244;border-radius:12px;padding:14px}'
    + '.t2-saves-head{display:flex;justify-content:space-between;align-items:center}.t2-saves-head b{font-family:var(--serif);font-size:20px;letter-spacing:.1em}'
    + '.t2-back{background:none;border:1px solid var(--line);color:inherit;border-radius:8px;padding:6px 14px;font:inherit;cursor:pointer}.t2-back:hover{border-color:var(--gold)}'
    + '@media (max-width:720px){#title.t2 .t-wrap{margin:0 auto;padding:0 16px}.t2-shade{background:rgba(8,7,12,.7)}.t2-news{position:relative;right:auto;bottom:auto;margin:16px auto 0}#title.t2{flex-direction:column}}';
  document.head.appendChild(css);
})(window.R);
