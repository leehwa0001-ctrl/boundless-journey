// 圖鑑變成攤在木桌上的一本書，切分頁會真的翻頁（2026-10-22 作者：想要真的在翻紙本書頁的感覺；照作者傳的參考圖）
// 參考圖：木頭桌面（羅盤、墨水瓶、羽毛筆、地圖、蠟燭）上攤開一本紫色封面的書；書的上緣插著一排書籤分頁，兩端 A／D 鍵換頁；
//   左頁是羊皮紙，照地區分段的小頭像（深褐色的格子、金色細框，選到的那一格亮金邊），底下是收集進度；
//   右頁是一塊深色的框（四角的括弧、撕紙邊）：名字的布條、撕紙邊框著的大圖、生命值、說明、底下的擊敗次數；右上角紅色的 ✕ 闔上書。
// - 只換外觀和多翻頁的動畫，內容照 dexui.js（書本外框、分級分頁）和 dexruins.js（左頁、右頁的內容）原本的。
// - 書籤：dexui.js 的分級分頁搬到書的上緣；右邊多一個「地圖」書籤（＝原本右上角的地圖鈕）；✕＝原本的「東鶴／標題」。
// - 翻頁：切分級分頁、選遺跡、回上一層、切小分頁（小怪／領主體／遺跡詳情）、右頁「出現的遺跡」跳過去——
//   先把兩頁原本的樣子拍下來（複製一份），換好內容後，一張紙從右頁沿著書脊翻到左頁（往回是左翻到右），翻的時候有陰影、紙的聲音。
//   點小頭像只換右頁：不翻，右頁的字像墨水一樣浮出來。
// - A／D 或 ← →：換分級分頁（打字的時候不算）；Esc 闔上書。
// - 窄的畫面（手機、寬不到 780）照舊，不變成書。
// 放在 dexui.js、dexruins.js、loading.js 後面。
(function (R) {
  const $ = id => document.getElementById(id);
  const wide = () => window.matchMedia && window.matchMedia('(min-width: 780px)').matches;
  const scr = () => $('bestiary');
  const on = () => { const s = scr(); return !!(s && !s.hidden && s.classList.contains('bk-on')); };

  // ---------- 撕紙邊：每條邊抖一抖的多邊形（clip-path） ----------
  const rough = (n, j, seed) => {
    let s = seed || 7; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    const p = [], J = () => (rnd() * j).toFixed(1) + 'px';
    for (let i = 0; i <= n; i++) p.push((i / n * 100).toFixed(2) + '% ' + J());
    for (let i = 0; i <= n; i++) p.push('calc(100% - ' + J() + ') ' + (i / n * 100).toFixed(2) + '%');
    for (let i = n; i >= 0; i--) p.push((i / n * 100).toFixed(2) + '% calc(100% - ' + J() + ')');
    for (let i = n; i >= 0; i--) p.push(J() + ' ' + (i / n * 100).toFixed(2) + '%');
    return 'polygon(' + p.join(',') + ')';
  };
  // 右頁的深色框：撕紙邊的 SVG（拉滿整頁）＋四角的括弧
  const panel = () => {
    let s = 5; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; }, n = 40, j = () => (rnd() * 6).toFixed(1), pts = [];
    for (let i = 0; i <= n; i++) pts.push((i * 1000 / n).toFixed(0) + ',' + j());
    for (let i = 0; i <= n; i++) pts.push((1000 - j()) + ',' + (i * 1000 / n).toFixed(0));
    for (let i = n; i >= 0; i--) pts.push((i * 1000 / n).toFixed(0) + ',' + (1000 - j()));
    for (let i = n; i >= 0; i--) pts.push(j() + ',' + (i * 1000 / n).toFixed(0));
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" preserveAspectRatio="none"><polygon points="' + pts.join(' ') + '" fill="#3A2A33"/><polygon points="' + pts.join(' ') + '" fill="none" stroke="#2A1C24" stroke-width="6" transform="translate(30 30) scale(.94)"/></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  };
  const corner = r => 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M2 22 V2 H22 M7 15 V7 H15" fill="none" stroke="#7A6070" stroke-width="2.5" transform="rotate(' + r + ' 12 12)"/></svg>') + '")';
  const PANEL_BG = corner(0) + ' 30px 30px/22px no-repeat,' + corner(90) + ' calc(100% - 30px) 30px/22px no-repeat,' + corner(270) + ' 30px calc(100% - 30px)/22px no-repeat,' + corner(180) + ' calc(100% - 30px) calc(100% - 30px)/22px no-repeat,' + panel() + ' center/calc(100% - 28px) calc(100% - 28px) no-repeat';

  // ---------- 桌上的東西（卡通的粗黑線） ----------
  const O = 'stroke="#24160C" stroke-width="5" stroke-linejoin="round"';
  const DESK = '<div class="bk-desk" aria-hidden="true">'
    // 羅盤（左上，露出一半）
    + '<svg class="bk-p bk-compass" viewBox="0 0 200 200"><circle cx="100" cy="100" r="92" fill="#C8963E" ' + O + '/><circle cx="100" cy="100" r="74" fill="#E9D3A1" ' + O + '/><path d="M100 34 L114 100 L100 166 L86 100 Z" fill="#B23A2E" ' + O + '/><path d="M100 100 L114 100 L100 166 Z" fill="#E9D3A1" stroke="#24160C" stroke-width="3"/><text x="100" y="58" text-anchor="middle" font-size="26" font-weight="900" fill="#24160C">N</text></svg>'
    // 墨水瓶
    + '<svg class="bk-p bk-ink" viewBox="0 0 160 130"><path d="M20 60 Q20 30 50 30 L110 30 Q140 30 140 60 L140 110 Q140 124 126 124 L34 124 Q20 124 20 110 Z" fill="#232A5A" ' + O + '/><rect x="56" y="8" width="48" height="26" rx="4" fill="#3B3046" ' + O + '/><path d="M36 54 Q40 42 56 42" fill="none" stroke="#5A66A8" stroke-width="6" stroke-linecap="round"/></svg>'
    // 羽毛筆
    + '<svg class="bk-p bk-quill" viewBox="0 0 300 80"><path d="M10 66 L120 40" stroke="#24160C" stroke-width="7" stroke-linecap="round"/><path d="M110 42 Q200 -4 292 8 Q230 30 208 48 Q160 60 110 42 Z" fill="#EFE6D6" ' + O + '/><path d="M120 42 Q200 22 270 14" fill="none" stroke="#B9AE9C" stroke-width="3"/></svg>'
    // 地圖（右邊，斜放）
    + '<svg class="bk-p bk-map" viewBox="0 0 260 340"><path d="M12 16 L240 6 L250 320 L20 332 Z" fill="#D8BC86" ' + O + '/><path d="M40 70 Q90 40 130 80 T220 90" fill="none" stroke="#7A5A34" stroke-width="4" stroke-dasharray="10 8"/><path d="M60 200 l30 -50 l30 50 z M120 210 l24 -40 l24 40 z" fill="none" stroke="#7A5A34" stroke-width="4"/><path d="M150 260 l14 14 m0 -14 l-14 14" stroke="#9A2A20" stroke-width="5"/><circle cx="70" cy="280" r="22" fill="none" stroke="#7A5A34" stroke-width="4"/></svg>'
    // 蠟燭（左邊）
    + '<svg class="bk-p bk-candle" viewBox="0 0 120 220"><ellipse cx="60" cy="40" rx="40" ry="50" fill="#FFB43A" opacity=".25"/><path d="M60 14 Q74 34 60 52 Q46 34 60 14 Z" fill="#FFD25A" stroke="#24160C" stroke-width="4"/><rect x="36" y="56" width="48" height="140" rx="6" fill="#F1E2C0" ' + O + '/><path d="M44 60 q4 24 0 40" stroke="#D9C69C" stroke-width="5" fill="none"/><rect x="18" y="190" width="84" height="20" rx="6" fill="#8A6A3A" ' + O + '/></svg>'
    // 闔上的書（左下）
    + '<svg class="bk-p bk-tome" viewBox="0 0 220 300"><rect x="10" y="10" width="200" height="280" rx="10" fill="#2E4A6A" ' + O + '/><rect x="30" y="10" width="14" height="280" fill="#22384F"/><rect x="70" y="60" width="110" height="40" rx="4" fill="none" stroke="#C8963E" stroke-width="4"/></svg>'
    + '</div>';

  // ---------- 翻頁的紙聲（短的噪音，聲音照音效音量；靜音就不出聲） ----------
  let ac = null;
  const paper = () => {
    try {
      if (R.isMuted && R.isMuted()) return;
      let v = 0.8; try { v = (JSON.parse(localStorage.getItem('ruins1433-vol') || '{}').sfx ?? 0.8); } catch (e) { }
      if (v <= 0) return;
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const t = ac.currentTime, d = 0.42, b = ac.createBuffer(1, Math.floor(ac.sampleRate * d), ac.sampleRate), x = b.getChannelData(0);
      for (let i = 0; i < x.length; i++) { const k = i / x.length; x[i] = (Math.random() * 2 - 1) * Math.pow(Math.sin(Math.PI * Math.min(1, k * 1.4)), 2) * (0.6 + 0.4 * Math.random()); }
      const src = ac.createBufferSource(); src.buffer = b;
      const f = ac.createBiquadFilter(); f.type = 'bandpass'; f.Q.value = 0.8; f.frequency.setValueAtTime(2600, t); f.frequency.exponentialRampToValueAtTime(900, t + d);
      const g = ac.createGain(); g.gain.value = 0.16 * v;
      src.connect(f); f.connect(g); g.connect(ac.destination); src.start(t);
    } catch (e) { }
  };

  // ---------- 把書擺好（dexui.js 每次打開圖鑑都重做一次外框） ----------
  const dress = () => {
    const s = scr(), host = $('cards'), book = host && host.querySelector('.dx-book');
    if (!s) return;
    s.classList.toggle('bk-on', wide());
    if (!s.querySelector('.bk-desk')) s.insertAdjacentHTML('afterbegin', DESK);
    if (!book || book.dataset.bk === '1') return;
    book.dataset.bk = '1';
    const tabs = book.querySelector('.dx-gtabs');
    const strip = document.createElement('div'); strip.className = 'bk-tabs';
    strip.innerHTML = '<kbd class="bk-key" data-bkk="-1" title="上一個分頁（A 或 ←）">A</kbd>';
    if (tabs) strip.appendChild(tabs);
    strip.insertAdjacentHTML('beforeend', '<span class="bk-gap"></span><button type="button" class="dx-tab bk-maptab" title="攤開地圖">地圖</button><kbd class="bk-key" data-bkk="1" title="下一個分頁（D 或 →）">D</kbd>');
    book.prepend(strip);
    book.insertAdjacentHTML('beforeend', '<button type="button" class="bk-x" title="闔上書（Esc）" aria-label="闔上書">✕</button><i class="bk-spine" aria-hidden="true"></i>');
    strip.querySelector('.bk-maptab').onclick = () => { const b = $('b-map'); if (b) b.click(); };
    strip.querySelectorAll('[data-bkk]').forEach(k => { k.onclick = () => step(+k.dataset.bkk); });
    book.querySelector('.bk-x').onclick = () => { const b = $('b-back'); if (b) b.click(); };
    book.style.setProperty('--rough2', rough(14, 4, 29));
  };
  const step = d => {
    const t = [...document.querySelectorAll('#cards .dx-gtabs [data-dxg]')], i = t.findIndex(x => x.classList.contains('on'));
    if (!t.length) return; const n = t[(Math.max(0, i) + d + t.length) % t.length]; if (n) n.click();
  };

  // ---------- 翻頁 ----------
  // 複製一頁：連捲動的位置一起（複製出來的東西不會記得捲到哪裡）
  const snap = page => {
    const c = page.cloneNode(true), a = [page, ...page.querySelectorAll('*')], b = [c, ...c.querySelectorAll('*')], sc = [];
    for (let i = 0; i < a.length; i++) if (a[i].scrollTop || a[i].scrollLeft) sc.push([i, a[i].scrollTop, a[i].scrollLeft]);
    c.removeAttribute('id'); c.querySelectorAll('[id]').forEach(x => x.removeAttribute('id'));
    return { el: c, fix: () => { const bb = [c, ...c.querySelectorAll('*')]; sc.forEach(([i, t, l]) => { if (bb[i]) { bb[i].scrollTop = t; bb[i].scrollLeft = l; } }); } };
  };
  const scrolls = page => [page, ...page.querySelectorAll('*')].filter(x => x.scrollTop || x.scrollLeft).map(x => [x, x.scrollTop, x.scrollLeft]);
  let flipping = null;
  const flip = (book, dir, oldL, oldR) => {
    const L = book.querySelector('.dx-left'), Rp = book.querySelector('.dx-right'); if (!L || !Rp) return;
    if (flipping) { flipping.forEach(x => x.remove()); flipping = null; }
    const br = book.getBoundingClientRect(), box = el => { const r = el.getBoundingClientRect(); return { left: r.left - br.left, top: r.top - br.top, width: r.width, height: r.height }; };
    const put = (el, r) => { Object.assign(el.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px' }); };
    const fwd = dir > 0;
    // 底下：還沒被翻過來蓋住的那一頁，先照舊
    const under = document.createElement('div'); under.className = 'bk-under'; put(under, box(fwd ? L : Rp));
    const old = fwd ? oldL : oldR; under.appendChild(old.el);
    // 翻的那張紙：正面＝這一邊原本的頁，背面＝翻過去那一邊的新頁
    const leaf = document.createElement('div'); leaf.className = 'bk-leaf ' + (fwd ? 'fwd' : 'back'); put(leaf, box(fwd ? Rp : L));
    const front = document.createElement('div'), back = document.createElement('div'); front.className = 'bk-face bk-front'; back.className = 'bk-face bk-back';
    const fr = fwd ? oldR : oldL, nw = snap(fwd ? L : Rp);
    front.appendChild(fr.el); back.appendChild(nw.el); leaf.append(front, back);
    book.append(under, leaf); old.fix(); fr.fix(); nw.fix();
    flipping = [under, leaf];
    paper();
    const ms = 620, rot = fwd ? -180 : 180;
    const an = leaf.animate([{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(' + rot / 2 + 'deg) scaleY(1.015)', offset: 0.5 }, { transform: 'rotateY(' + rot + 'deg)' }], { duration: ms, easing: 'cubic-bezier(.45,.05,.35,1)' });
    front.animate([{ '--sh': 0 }, { '--sh': 0.55 }], { duration: ms / 2, fill: 'forwards' });
    back.animate([{ '--sh': 0.55 }, { '--sh': 0 }], { duration: ms / 2, delay: ms / 2, fill: 'both' });
    const done = () => { under.remove(); leaf.remove(); if (flipping && flipping[1] === leaf) flipping = null; };
    an.onfinish = done; an.oncancel = done; setTimeout(done, ms + 250);   // 分頁在背景的時候動畫不會跑完：時間到一定收掉
  };

  // 哪些按鈕會換左頁（要翻頁），往前還是往回
  const kindOf = t => {
    const b = t.closest('[data-dxg],[data-drs],[data-drup],[data-drsub],[data-drgo],[data-drm],[data-drk],[data-drf],[data-drback]'); if (!b) return null;
    const idx = (sel, el) => [...el.parentNode.querySelectorAll(sel)].indexOf(el);
    if (b.dataset.dxg) { const t2 = [...b.parentNode.querySelectorAll('[data-dxg]')], cur = t2.findIndex(x => x.classList.contains('on')); return b.classList.contains('on') ? null : { b, dir: t2.indexOf(b) > cur ? 1 : -1 }; }
    if (b.dataset.drsub) { if (b.classList.contains('on')) return null; const cur = [...b.parentNode.querySelectorAll('[data-drsub]')].findIndex(x => x.classList.contains('on')); return { b, dir: idx('[data-drsub]', b) > cur ? 1 : -1 }; }
    if (b.dataset.drup) return { b, dir: -1 };
    if (b.dataset.drs || b.dataset.drgo) return { b, dir: 1 };
    return { b, dir: 0 };   // 只換右頁
  };
  let pend = null;
  document.addEventListener('click', e => {
    if (!on()) return; const book = e.target.closest && e.target.closest('#cards .dx-book'); if (!book) return;
    const k = kindOf(e.target); if (!k) return;
    const L = book.querySelector('.dx-left'), Rp = book.querySelector('.dx-right');
    pend = k.dir ? { book, dir: k.dir, oldL: snap(L), oldR: snap(Rp) } : { book, dir: 0, keep: scrolls(L) };
  }, true);
  document.addEventListener('click', () => {
    const p = pend; pend = null; if (!p) return;
    if (p.dir) { flip(p.book, p.dir, p.oldL, p.oldR); return; }
    // 只換右頁：左頁捲到哪裡照舊（dexruins.js 會整個重畫左頁）；右頁的字像墨水一樣浮出來
    const L = p.book.querySelector('.dx-left'), Rp = p.book.querySelector('.dx-right');
    p.keep.forEach(([el, t, l]) => {
      if (!el.isConnected) { const cls = typeof el.className === 'string' && el.className.split(' ')[0]; el = cls && L.querySelector('.' + cls); }   // 重畫過的捲動框：找同一種的
      if (el) { el.scrollTop = t; el.scrollLeft = l; }
    });
    if (Rp) { Rp.classList.remove('bk-fresh'); void Rp.offsetWidth; Rp.classList.add('bk-fresh'); }
  });

  // ---------- 鍵盤 ----------
  document.addEventListener('keydown', e => {
    if (!on() || e.ctrlKey || e.metaKey || e.altKey) return;
    const tg = e.target; if (tg && (tg.tagName === 'INPUT' || tg.tagName === 'TEXTAREA' || tg.isContentEditable)) return;
    if (document.querySelector('.dr-pop, #dr-x')) return;
    const k = e.key.toLowerCase();
    if (k === 'a' || k === 'arrowleft') { e.preventDefault(); step(-1); }
    else if (k === 'd' || k === 'arrowright') { e.preventDefault(); step(1); }
    else if (k === 'escape') { const b = $('b-back'); if (b) { e.preventDefault(); b.click(); } }
  });

  // 看著圖鑑的外框（dexui.js 每次打開都重寫 #cards）
  const watch = () => {
    const host = $('cards'); if (!host) return setTimeout(watch, 300);
    new MutationObserver(dress).observe(host, { childList: true });
    const s = scr(); if (s) new MutationObserver(dress).observe(s, { attributes: true, attributeFilter: ['hidden'] });
    window.addEventListener('resize', () => { const s2 = scr(); if (s2) s2.classList.toggle('bk-on', wide()); });
    dress();
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();

  // ---------- 樣子 ----------
  const INK = '#24160C', PAPER = '#D7B37A', PAPER2 = '#C49A5E', GOLD = '#E2B65C';
  // 2026-10-22 作者：圖鑑的背景（質感）再精細一點——紙的纖維和斑點、更細的木紋和木節、封面的皮革紋（都是 SVG 的雜訊，畫一次就好）
  const svg = (w, h, body) => 'url("data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="' + w + '" height="' + h + '">' + body + '</svg>') + '")';
  const noise = (id, bf, oct, seed, mat) => '<filter id="' + id + '" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="' + bf + '" numOctaves="' + oct + '" seed="' + seed + '" stitchTiles="stitch"/><feColorMatrix values="' + mat + '"/></filter>';
  const FIBER = svg(300, 300, noise('f', '.9 .55', 4, 3, '0 0 0 0 .32 0 0 0 0 .2 0 0 0 0 .08 0 0 0 .9 -.32') + '<rect width="300" height="300" filter="url(#f)"/>');
  const STAIN = svg(520, 520, noise('s', '.012', 3, 8, '0 0 0 0 .45 0 0 0 0 .28 0 0 0 0 .1 0 0 0 1.6 -.78') + '<rect width="520" height="520" filter="url(#s)"/>');
  const GRAIN = svg(480, 480, noise('g', '.004 .22', 4, 5, '0 0 0 0 .16 0 0 0 0 .08 0 0 0 0 .03 0 0 0 1.25 -.42') + '<rect width="480" height="480" filter="url(#g)"/>');
  const KNOT = svg(900, 700, '<g fill="none" stroke="rgba(30,14,4,.35)" stroke-width="2"><ellipse cx="180" cy="220" rx="16" ry="34"/><ellipse cx="180" cy="220" rx="9" ry="20"/><ellipse cx="640" cy="520" rx="12" ry="28"/><ellipse cx="640" cy="520" rx="6" ry="15"/></g><g fill="rgba(30,14,4,.5)"><ellipse cx="180" cy="220" rx="4" ry="8"/><ellipse cx="640" cy="520" rx="3" ry="6"/></g>');
  const LEATHER = svg(200, 200, noise('l', '.45', 3, 11, '0 0 0 0 .05 0 0 0 0 .03 0 0 0 0 .12 0 0 0 1.4 -.5') + '<rect width="200" height="200" filter="url(#l)"/>');
  const PAGE_L = STAIN + ',' + FIBER + ',linear-gradient(90deg,' + PAPER2 + ' 0,' + PAPER + ' 6%,' + PAPER + ' 88%,#A87E46 100%)';
  const PAGE_R = STAIN + ',' + FIBER + ',linear-gradient(270deg,' + PAPER2 + ' 0,' + PAPER + ' 6%,' + PAPER + ' 88%,#A87E46 100%)';
  const css = document.createElement('style');
  css.textContent = [
    // 桌子：木板＋木紋
    '#bestiary.bk-on{background:#3A2414 url("assets/art/dex/dex-desk.webp") center/cover no-repeat;overflow:hidden}',   // 2026-10-22 作者：圖鑑背後沒有質感——換成畫的木桌（羅盤、墨水瓶、蠟燭、地圖）
    '#bestiary.bk-on .dx-book .dx-left{background-blend-mode:normal,multiply}',
    '#bestiary.bk-on .dx-book .dx-left{background-image:linear-gradient(90deg,rgba(140,100,50,.55) 0,rgba(0,0,0,0) 6%,rgba(0,0,0,0) 88%,rgba(150,105,55,.6) 100%),url("assets/art/dex/dex-paper.webp");background-size:auto,320px}',
    '#bestiary.bk-on::before{content:"";position:absolute;inset:0;pointer-events:none;opacity:.12;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'240\' height=\'240\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'.012 .32\' numOctaves=\'3\' seed=\'4\'/%3E%3CfeColorMatrix values=\'0 0 0 0 .2 0 0 0 0 .1 0 0 0 0 .04 0 0 0 1.1 -.35\'/%3E%3C/filter%3E%3Crect width=\'240\' height=\'240\' filter=\'url(%23n)\'/%3E%3C/svg%3E");mix-blend-mode:multiply}',
    '#bestiary.bk-on::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,rgba(255,200,120,.12),rgba(0,0,0,.5) 85%)}',
    '#bestiary:not(.bk-on) .bk-desk{display:none}.bk-desk{position:absolute;inset:0;pointer-events:none;overflow:hidden}',
    '.bk-p{position:absolute;filter:drop-shadow(0 6px 4px rgba(0,0,0,.35))}',
    '.bk-compass{width:190px;left:22%;top:-110px}.bk-ink{width:120px;left:50%;top:-34px}.bk-quill{width:230px;left:60%;top:-8px;transform:rotate(-18deg)}',
    '.bk-map{width:260px;right:-60px;top:16%;transform:rotate(8deg)}.bk-candle{width:90px;left:-14px;top:12%}.bk-tome{width:200px;left:-120px;bottom:-60px;transform:rotate(-12deg)}',
    '.bk-candle path:first-of-type{animation:bkflame 1.6s ease-in-out infinite;transform-origin:60px 52px}@keyframes bkflame{0%,100%{transform:scale(1,1)}50%{transform:scale(.92,1.08)}}',
    // 版面：書擺在中間，上面那條、說明藏起來
    '#bestiary.bk-on>.bar,#bestiary.bk-on .b-intro{display:none}',
    '#bestiary.bk-on .b-body{position:relative;z-index:1;flex:1;min-height:0;display:flex;align-items:center;justify-content:center;padding:84px 24px 22px;overflow:hidden;max-width:none}',
    '#bestiary.bk-on #cards{width:min(1240px,100%);height:100%;max-height:820px;display:block}',
    // 書：紫色封面＋兩頁羊皮紙
    '#bestiary.bk-on .dx-book{position:relative;height:100%;box-sizing:border-box;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0;align-items:stretch;padding:14px 16px 20px;border:4px solid ' + INK + ';border-radius:14px;background:#4B3F86 linear-gradient(180deg,#5A4D9A,#3F3474);box-shadow:0 0 0 2px #2A2150 inset,0 18px 30px rgba(0,0,0,.55);perspective:2200px;color:#3A2414;overflow:visible}',
    '#bestiary.bk-on .dx-page{position:relative;min-height:0;height:100%;box-sizing:border-box;padding:22px 22px 18px 26px;border:3px solid ' + INK + ';background:' + PAPER + ';overflow:auto;scrollbar-width:thin;scrollbar-color:#7A5634 transparent}',
    '#bestiary.bk-on .dx-left{border-radius:8px 2px 2px 8px;border-right-width:1.5px;background:linear-gradient(90deg,' + PAPER2 + ' 0,' + PAPER + ' 6%,' + PAPER + ' 88%,#B08850 100%);box-shadow:-5px 5px 0 -1px #B9935E,-9px 9px 0 -2px ' + INK + '}',
    '#bestiary.bk-on .dx-right{position:relative;top:auto;max-height:none;border-radius:2px 8px 8px 2px;border-left-width:1.5px;padding:22px 26px 18px 22px;background:linear-gradient(270deg,' + PAPER2 + ' 0,' + PAPER + ' 6%,' + PAPER + ' 88%,#B08850 100%);box-shadow:5px 5px 0 -1px #B9935E,9px 9px 0 -2px ' + INK + '}',
    '.bk-spine{position:absolute;left:50%;top:10px;bottom:14px;width:30px;margin-left:-15px;pointer-events:none;z-index:3;background:linear-gradient(90deg,rgba(60,34,12,0),rgba(60,34,12,.45) 45%,rgba(20,10,4,.6) 50%,rgba(60,34,12,.45) 55%,rgba(60,34,12,0))}',
    '#bestiary:not(.bk-on) .bk-spine,#bestiary:not(.bk-on) .bk-x,#bestiary:not(.bk-on) .bk-key,#bestiary:not(.bk-on) .bk-maptab,#bestiary:not(.bk-on) .bk-gap{display:none}',
    '#bestiary:not(.bk-on) .bk-tabs{display:contents}',
    // 書籤分頁
    '#bestiary.bk-on .bk-tabs{position:absolute;left:46px;right:46px;bottom:100%;display:flex;align-items:flex-end;gap:6px;z-index:0}',
    '#bestiary.bk-on .bk-tabs .dx-gtabs{display:flex;flex-wrap:nowrap;gap:6px;margin:0}',
    '#bestiary.bk-on .bk-gap{flex:1}',
    '#bestiary.bk-on .bk-tabs .dx-tab{flex:none;min-width:0;width:108px;height:52px;margin:0 0 -6px;padding:14px 2px 6px;white-space:nowrap;border:0;border-radius:0;font-family:"LXGW WenKai TC",var(--serif);font-size:14px;font-weight:700;color:#4A2E18;cursor:pointer;background:#A57A48;clip-path:polygon(0 0,50% 22%,100% 0,100% 100%,0 100%);box-shadow:none;filter:drop-shadow(0 -1px 0 ' + INK + ');transition:height .15s,background .15s}',
    '#bestiary.bk-on .bk-tabs .dx-tab::before{content:"";display:block;width:10px;height:10px;margin:0 auto 3px;border-radius:50%;background:var(--gc,#C9A13A);border:2px solid ' + INK + '}',
    '#bestiary.bk-on .bk-tabs .dx-tab:hover{background:#B88C58;height:56px}',
    '#bestiary.bk-on .bk-tabs .dx-tab.on{background:' + PAPER + ';height:62px;color:#2A180A}',
    '#bestiary.bk-on .bk-tabs .bk-maptab::before{background:#6A9A5A}',
    '.bk-key{display:grid;place-items:center;width:30px;height:32px;margin:0 2px 14px;border:3px solid ' + INK + ';border-radius:6px;background:#2C2630;color:#F4ECDC;font:900 15px/1 var(--sans,sans-serif);box-shadow:0 3px 0 ' + INK + ';cursor:pointer;user-select:none}',
    '.bk-key:active{transform:translateY(2px);box-shadow:0 1px 0 ' + INK + '}',
    '.bk-x{position:absolute;right:-18px;top:-22px;z-index:6;width:50px;height:50px;border:4px solid ' + INK + ';border-radius:8px;background:#C2364A;color:#fff;font:900 26px/1 sans-serif;cursor:pointer;box-shadow:0 0 0 3px #E35A6E inset,0 4px 0 ' + INK + '}',
    '.bk-x:hover{background:#D84458}.bk-x:active{transform:translateY(2px)}',
    // 左頁：分段標題、格子
    '#bestiary.bk-on .dx-left .dx-h,#bestiary.bk-on .dr-h,#bestiary.bk-on .dr-rg{font-family:"LXGW WenKai TC",var(--serif);color:#F2C66A;font-size:18px;font-weight:700;letter-spacing:.04em;text-shadow:0 2px 0 #6A4420,0 0 2px #6A4420;border:0;margin:12px 0 6px}',
    '#bestiary.bk-on .dx-left .note,#bestiary.bk-on .dx-left small,#bestiary.bk-on .dx-left p{color:#5A3A1E}',
    '#bestiary.bk-on .dr-th,#bestiary.bk-on .dx-th{border:2px solid ' + INK + ';border-radius:5px;background:#3B2516;box-shadow:0 0 0 1px #9A7440 inset,0 0 0 3px #3B2516 inset,0 0 0 4px rgba(226,182,92,.35) inset}',
    '#bestiary.bk-on .dr-th:hover,#bestiary.bk-on .dr-th.sel,#bestiary.bk-on .dx-th:hover,#bestiary.bk-on .dx-th.sel{border-color:' + INK + ';background:#5A3A20;box-shadow:0 0 0 2px #F6D27A inset,0 0 10px 2px rgba(246,210,122,.75)}',
    '#bestiary.bk-on .dr-th.dr-empty{background:rgba(59,37,22,.18);border:2px dashed rgba(36,22,12,.35);box-shadow:none}',
    '#bestiary.bk-on .dr-cols,#bestiary.bk-on .dr-ruin,#bestiary.bk-on .dr-layers{border:0;background:none;padding:2px 0}',
    '#bestiary.bk-on .dr-sec{background:none;border:0}#bestiary.bk-on .dr-sec span{color:#8A4A1E;font-family:"LXGW WenKai TC",var(--serif);font-size:14px}',
    '#bestiary.bk-on .dr-legend span{background:rgba(59,37,22,.15);color:#5A3A1E}',
    // 左頁的按鈕：小分頁、遺跡、場地效果、核心
    '#bestiary.bk-on .dr-subs{border-bottom:3px solid ' + INK + '}',
    '#bestiary.bk-on .dr-sub{border:3px solid ' + INK + ';border-bottom:0;background:#B08A56;color:#3A2414;opacity:1;font-family:"LXGW WenKai TC",var(--serif);font-size:15px}',
    '#bestiary.bk-on .dr-sub.on{background:#E9CF9C;border-color:' + INK + '}',
    '#bestiary.bk-on .dr-site,#bestiary.bk-on .dr-fc,#bestiary.bk-on .dr-corecard,#bestiary.bk-on .dr-lord,#bestiary.bk-on .dr-ginfo,#bestiary.bk-on .dr-head{border:2px solid ' + INK + ';border-left:6px solid var(--rc,var(--gc,#7A5634));background:#E6C996;color:#3A2414}',
    '#bestiary.bk-on .dr-site:hover,#bestiary.bk-on .dr-fc:hover,#bestiary.bk-on .dr-fc.sel,#bestiary.bk-on .dr-corecard:hover,#bestiary.bk-on .dr-corecard.sel{background:#F2DDB0;box-shadow:0 0 0 2px #F6D27A}',
    '#bestiary.bk-on .dr-site small,#bestiary.bk-on .dr-fc small,#bestiary.bk-on .dr-lt small,#bestiary.bk-on .dr-head small{color:#6A4A2A;opacity:1}',
    '#bestiary.bk-on .dx-left .btn,#bestiary.bk-on .dx-right .btn{background:#4A3020;color:#F4E4C4;border:2px solid ' + INK + '}',
    '#bestiary.bk-on .dx-count{font-family:"LXGW WenKai TC",var(--serif);color:#F2C66A;font-size:17px;text-shadow:0 2px 0 #6A4420}#bestiary.bk-on .dx-count b{color:#FFE29A}',
    '#bestiary.bk-on .dx-left .dx-tabs:not(.dx-gtabs) .dx-tab{border:3px solid ' + INK + ';background:#B08A56;color:#3A2414}#bestiary.bk-on .dx-left .dx-tabs:not(.dx-gtabs) .dx-tab.on{background:#E9CF9C}',
    // 右頁：深色的框（撕紙邊、四角的括弧）
    '#bestiary.bk-on .dx-right{color:#D9B58A;padding:44px 50px 36px 46px;background:' + PANEL_BG + ',' + PAGE_R + '}',
    '#bestiary.bk-on .dx-right p,#bestiary.bk-on .dx-right li{color:#D9B58A;line-height:1.6}#bestiary.bk-on .dx-right .note{color:#B79A7A}#bestiary.bk-on .dx-right b{color:#F2D49A}',
    '#bestiary.bk-on .dx-right .dx-h{font-family:"LXGW WenKai TC",var(--serif);color:' + GOLD + ';font-size:16px;border-bottom:1px solid rgba(226,182,92,.3);padding-bottom:3px;margin:14px 0 6px}',
    // 名字的布條（燕尾）
    '#bestiary.bk-on .dx-banner{position:relative;margin:0 auto 14px;max-width:88%;padding:9px 40px;background:#22161C;color:#F6E2B6;font-family:"LXGW WenKai TC",var(--serif);font-size:22px;letter-spacing:.12em;border-radius:0;clip-path:polygon(0 0,100% 0,94% 50%,100% 100%,0 100%,6% 50%)}',
    '#bestiary.bk-on .dx-right .dx-portrait{position:relative}',
    // 大圖：撕紙邊的淡色紙框著
    '#bestiary.bk-on .dx-portrait{width:min(240px,74%);margin:0 auto 12px;border:0;border-radius:0;padding:10px;background:#E4CDA0;clip-path:var(--rough2);box-shadow:none}',
    '#bestiary.bk-on .dx-portrait::before{content:"";position:absolute;inset:10px;background:radial-gradient(circle at 50% 55%,color-mix(in srgb,var(--bg) 75%,#fff 25%),var(--bg) 75%);z-index:0}',
    '#bestiary.bk-on .dx-portrait img{position:relative;z-index:1;filter:drop-shadow(0 6px 3px rgba(0,0,0,.4))}#bestiary.bk-on .dx-portrait.unseen img{filter:brightness(0) opacity(.75)}',
    '#bestiary.bk-on .dexstat{display:flex;flex-wrap:wrap;justify-content:center;gap:6px 14px;margin:8px 0 10px;font-family:"LXGW WenKai TC",var(--serif);font-size:16px;color:#E8C88E}#bestiary.bk-on .dexstat span{background:none;border:0;padding:0}#bestiary.bk-on .dexstat b{color:#FFE2A0}',
    '#bestiary.bk-on .dx-var small{color:#B79A7A}#bestiary.bk-on .dr-site.sm{background:#4A3640;border:2px solid #1A1014;border-left:6px solid var(--rc);color:#F2D49A}#bestiary.bk-on .dr-site.sm small{color:#C9AA88}',
    '#bestiary.bk-on .dx-right .dr-info{border-left-color:var(--rc)}#bestiary.bk-on .dx-right .dr-layer{color:#F4E9CD}',
    // 墨水浮出來（點小頭像換右頁）
    '#bestiary.bk-on .dx-right.bk-fresh>*{animation:bkink .42s ease-out both}#bestiary.bk-on .dx-right.bk-fresh>*:nth-child(2){animation-delay:.05s}#bestiary.bk-on .dx-right.bk-fresh>*:nth-child(n+3){animation-delay:.1s}',
    '@keyframes bkink{from{opacity:0;filter:blur(3px)}to{opacity:1;filter:none}}',
    // 翻頁：底下那一頁、翻的那張紙
    '.bk-under,.bk-leaf{position:absolute;z-index:4;pointer-events:none}',
    '.bk-under>*,.bk-face>*{position:absolute!important;inset:0;width:100%!important;height:100%!important;margin:0!important;overflow:hidden!important}',
    '.bk-leaf{transform-style:preserve-3d;z-index:5}.bk-leaf.fwd{transform-origin:0 50%}.bk-leaf.back{transform-origin:100% 50%}',
    '.bk-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;--sh:0}.bk-back{transform:rotateY(180deg)}',
    '.bk-face::after{content:"";position:absolute;inset:0;z-index:9;pointer-events:none;opacity:var(--sh);background:linear-gradient(90deg,rgba(40,20,6,.9),rgba(40,20,6,.2) 60%,rgba(255,240,210,.25))}',
    '.bk-leaf.back .bk-face::after{background:linear-gradient(270deg,rgba(40,20,6,.9),rgba(40,20,6,.2) 60%,rgba(255,240,210,.25))}',
    '.bk-face{box-shadow:0 8px 16px rgba(0,0,0,.35)}',   // 不能用 filter：filter 會把 3D 壓平，背面就透出來
    '@property --sh{syntax:"<number>";inherits:true;initial-value:0}',
    '@media (prefers-reduced-motion:reduce){.bk-leaf{display:none}}',
    // 2026-10-22 修：瘦高的圖示（高過格子）會凸出框外——圖示一律縮進格子裡
    '.dr-th img,.dx-th img{width:100%;height:100%;max-width:100%;max-height:100%;object-fit:contain;min-width:0;min-height:0}',
    // 2026-10-22 質感：桌子（細木紋＋木節＋木板接縫的亮邊）、紙（纖維＋斑點）、封面（皮革紋＋縫線）
    '#bestiary.bk-on{background:' + KNOT + ',' + GRAIN + ',repeating-linear-gradient(90deg,rgba(0,0,0,0) 0 234px,rgba(255,220,170,.10) 234px 235px,rgba(24,12,4,.6) 235px 239px,rgba(255,220,170,.06) 239px 240px),linear-gradient(180deg,#7A4E2C,#5A371E) #6B4426}',
    '#bestiary.bk-on::before{opacity:.22}',
    '#bestiary.bk-on .dx-left{background:' + PAGE_L + '}',
    '#bestiary.bk-on .dx-book{background:' + LEATHER + ',linear-gradient(180deg,#5A4D9A,#3F3474)}',
    '#bestiary.bk-on .dx-book::before{content:"";position:absolute;inset:6px;border:2px dashed rgba(220,200,255,.28);border-radius:10px;pointer-events:none}',
    // 格子：深色的木框裡淡淡的光、選到的那格更亮
    '#bestiary.bk-on .dr-th:not(.dr-empty),#bestiary.bk-on .dx-th{background:radial-gradient(circle at 50% 40%,#5A3A22,#2E1C10 75%)}',
    // 書頁的厚度：頁緣一條一條的線
    '#bestiary.bk-on .dx-left{box-shadow:-3px 3px 0 -1px #C9A46C,-5px 5px 0 -1px #B08A54,-7px 7px 0 -1px #C9A46C,-9px 9px 0 -2px ' + INK + '}',
    '#bestiary.bk-on .dx-right{box-shadow:3px 3px 0 -1px #C9A46C,5px 5px 0 -1px #B08A54,7px 7px 0 -1px #C9A46C,9px 9px 0 -2px ' + INK + '}'
  ].join('\n');
  document.head.appendChild(css);
})(window.R);
