// 背包的新版面（2026-10-18 作者給的版面圖）：
//   左上「裝備＋角色」：左邊一排頭部、上衣、褲子、鞋子，中間是角色，右邊一排武器、護符、飾品、飾品
//   左下「角色素質」（charsheet.js 的 R.charSheetHtml）
//   右邊「背包格」（raid.js 的格子＋選到的東西的說明），右下「任務道具背包格」（questbag.js 的任務道具）
// - 不改 raid.js：包住 R.bagSheet，畫完以後把原本的格子、裝備欄、說明搬到新的位置（按鈕、拖曳都是原本的，搬過去照樣能用）。
// - 放在 questbag.js、gearcmp.js 後面（它們先把任務道具、比較按鈕放進去，這裡再搬）。
// - 角色可以點一下轉方向（正面→右→背面→左）。
(function (R) {
  const bs0 = R.bagSheet; if (!bs0) return;
  const $ = id => document.getElementById(id);
  const LEFT = [['head', '頭部'], ['body', '上衣'], ['legs', '褲子'], ['feet', '鞋子']], RIGHT = [['weapon', '武器'], ['charm', '護符'], ['acc', '飾品'], ['acc2', '飾品']];
  const DIR_ROW = [0, 2, 1, 3];   // 人物圖的列：0 正面、1 背面、2 朝右、3 朝左
  let dir = 0;
  const lookOf = () => {
    const S = R.S, P = R.W && R.W.P, cls = S.cls, eq = R.equipped(cls);
    return Object.assign({ weapon: P && P.item ? P.item.base : eq.weapon ? eq.weapon.base : null, shield: false, eq: R.gearShown ? R.gearShown(eq) : eq }, R.CLASSES[cls] ? R.CLASSES[cls].look : {}, R.playerLook ? R.playerLook() : {});
  };
  const drawFace = cv => {
    try {
      const sh = R.heroSheetCanvas(lookOf()), q = sh._ck || 1, fw = 24 * q, fh = 30 * q, x = cv.getContext('2d');
      x.clearRect(0, 0, cv.width, cv.height); x.imageSmoothingEnabled = false;
      const k = Math.min(cv.width / fw, cv.height / fh), w = fw * k, h = fh * k;
      x.drawImage(sh, 0, DIR_ROW[dir] * fh, fw, fh, (cv.width - w) / 2, cv.height - h, w, h);
    } catch (e) { console.warn('[baglayout]', e); }
  };
  const slotCol = (box, list) => {
    const col = document.createElement('div'); col.className = 'bl-col';
    list.forEach(([k, name]) => {
      const el = box.querySelector('.mc-slot[data-slot="' + k + '"]'); if (!el) return;
      const em = el.querySelector('.mc-empty'); if (em) em.textContent = '';   // 名字寫在格子下面
      const w = document.createElement('div'); w.className = 'bl-slot'; w.appendChild(el);
      const lb = document.createElement('small'); lb.textContent = name; w.appendChild(lb); col.appendChild(w);
    });
    return col;
  };
  const sec = (cls, title) => { const s = document.createElement('section'); s.className = 'bl-sec ' + cls; if (title) { const h = document.createElement('h3'); h.textContent = title; s.appendChild(h); } return s; };
  R.bagSheet = (...a) => {
    const r = bs0(...a);
    try {
      const sh = $('r-sheet'), wrap = sh && sh.querySelector('.tk-wrap'); if (!wrap) return r;
      sh.classList.add('bl-on');
      const L = document.createElement('div'); L.className = 'bl';
      const left = document.createElement('div'); left.className = 'bl-left';
      const right = document.createElement('div'); right.className = 'bl-right';
      // 左上：裝備＋角色
      const eqs = sec('bl-eq');
      const mid = document.createElement('div'); mid.className = 'bl-face'; mid.title = '點一下轉方向';
      const cv = document.createElement('canvas'); cv.width = 144; cv.height = 180; mid.appendChild(cv);
      const nm = document.createElement('small'); nm.textContent = (R.S.name || '') + (R.CLASSES[R.S.cls] ? '・' + R.CLASSES[R.S.cls].name : ''); mid.appendChild(nm);
      mid.onclick = () => { dir = (dir + 1) % 4; drawFace(cv); };
      eqs.appendChild(slotCol(wrap, LEFT)); eqs.appendChild(mid); eqs.appendChild(slotCol(wrap, RIGHT));
      // 左下：角色素質
      const st = sec('bl-stats', '角色素質');
      const cs = document.createElement('div'); cs.innerHTML = R.charSheetHtml ? R.charSheetHtml(R.S.cls, { live: !(R.W.run && R.W.run.townBag) }) : '';
      const det = cs.querySelector('details');   // 外面那一層摺疊拿掉（標題已經寫「角色素質」了），裡面的照原本
      if (det) { [...det.childNodes].forEach(n => { if (n.nodeName !== 'SUMMARY') st.appendChild(n); }); } else while (cs.firstChild) st.appendChild(cs.firstChild);
      left.appendChild(eqs); left.appendChild(st);
      // 右上：背包格（格子＋說明＋暫時放不下的、素材）
      const bag = sec('bl-bag');
      const gw = wrap.querySelector('.tk-gridwrap'), side = wrap.querySelector('.tk-side');
      if (gw) bag.appendChild(gw);
      if (side) bag.appendChild(side);
      [...sh.querySelectorAll(':scope > div > p.note, :scope > p.note')].forEach(p => { if (!p.closest('.bl')) { p.classList.add('bl-note'); bag.appendChild(p); } });
      // 右下：任務道具
      const qs = sec('bl-quest');
      const qb = sh.querySelector('.qb-box'); if (qb) qs.appendChild(qb); else qs.innerHTML = '<h3>任務道具</h3><p class="note">任務道具會放在這裡。</p>';
      right.appendChild(bag); right.appendChild(qs);
      L.appendChild(left); L.appendChild(right);
      wrap.replaceWith(L);
      drawFace(cv);
    } catch (e) { console.warn('[baglayout]', e); }
    return r;
  };
  // 其他畫面用到 r-sheet 的時候拿掉版面的 class
  const sheet0 = R.sheet; R.sheet = (...a) => { const sh = $('r-sheet'); if (sh) sh.classList.remove('bl-on'); return sheet0(...a); };
  const css = document.createElement('style');
  css.textContent = [
    '#r-sheet.bl-on{width:min(96vw,1180px);max-width:min(96vw,1180px)}',
    '#r-sheet.bl-on .bl{display:grid;grid-template-columns:minmax(330px,41%) 1fr;gap:10px;height:min(74vh,640px);min-height:0}',
    '#r-sheet.bl-on .bl-left,#r-sheet.bl-on .bl-right{display:flex;flex-direction:column;gap:10px;min-height:0;min-width:0}',
    '#r-sheet.bl-on .bl-sec{background:var(--bg2,rgba(0,0,0,.25));border:1px solid var(--line,#5A4A30);border-radius:10px;padding:8px 10px;min-height:0}',
    '#r-sheet.bl-on .bl-sec>h3{margin:0 0 6px;font-size:14px;color:var(--gold,#C9A13A)}',
    // 裝備＋角色
    '#r-sheet.bl-on .bl-eq{display:grid;grid-template-columns:auto 1fr auto;gap:10px;align-items:stretch;flex:0 0 auto}',
    '#r-sheet.bl-on .bl-col{display:flex;flex-direction:column;justify-content:space-between;gap:6px}',
    '#r-sheet.bl-on .bl-slot{display:flex;flex-direction:column;align-items:center;gap:1px}',
    '#r-sheet.bl-on .bl-slot small{font-size:11px;opacity:.75}',
    '#r-sheet.bl-on .bl-slot .mc-slot{width:52px;height:52px}',
    '#r-sheet.bl-on .bl-face{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;border-radius:8px;background:radial-gradient(ellipse at 50% 85%,rgba(201,161,58,.18),rgba(0,0,0,.25) 70%);cursor:pointer;padding:6px}',
    '#r-sheet.bl-on .bl-face canvas{width:100%;max-width:200px;height:auto;aspect-ratio:4/5;image-rendering:pixelated}',
    '#r-sheet.bl-on .bl-face small{opacity:.8}',
    // 角色素質
    '#r-sheet.bl-on .bl-stats{flex:1 1 auto;overflow:auto}',
    '#r-sheet.bl-on .bl-stats .cs-box{background:none;border:0;padding:0;margin:0}',
    // 背包格
    '#r-sheet.bl-on .bl-bag{flex:1 1 auto;display:flex;flex-direction:column;gap:6px;overflow:hidden}',
    '#r-sheet.bl-on .bl-bag .tk-gridwrap{flex:1 1 auto;overflow:auto;min-height:120px;display:flex;justify-content:center;align-items:flex-start}',
    '#r-sheet.bl-on .bl-bag .tk-side{flex:0 1 auto;max-height:38%;overflow:auto;width:auto;max-width:none;border-top:1px solid var(--line,#5A4A30);padding-top:6px}',
    '#r-sheet.bl-on .bl-bag .bl-note{margin:0;font-size:12px;max-height:5.5em;overflow:auto}',
    // 任務道具
    '#r-sheet.bl-on .bl-quest{flex:0 0 auto;max-height:24%;overflow:auto}',
    '#r-sheet.bl-on .bl-quest .qb-box{margin:0}',
    '#r-sheet.bl-on .bl-quest .qb-box h3{margin:0 0 6px;font-size:14px;color:var(--gold,#C9A13A)}',
    '#r-sheet.bl-on .bl-quest .qb-list{flex-wrap:nowrap;overflow-x:auto}',
    '#r-sheet.bl-on .bl-quest .qb-it{min-width:170px}',
    // 窄的畫面：上下排
    '@media (max-width:820px){#r-sheet.bl-on .bl{grid-template-columns:1fr;height:auto}#r-sheet.bl-on .bl-stats{max-height:40vh}#r-sheet.bl-on .bl-bag .tk-gridwrap{max-height:55vh}}'
  ].join('');
  document.head.appendChild(css);
})(window.R = window.R || {});
