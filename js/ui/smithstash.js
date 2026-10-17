// 鐵匠鋪、倉庫的介面重做（2026-10-13 作者：「鐵匠鋪和倉庫也要」——跟公會一樣方便、公會風再帶點日式）
// 只改畫面，不動遊戲邏輯；配色、確認視窗沿用 guildhall.js（R.ghConfirm、gh-board 招牌）。
// 鐵匠鋪：暖簾分頁＋數字鍵、記住上次的分頁；裝備卡片的搜尋／稀有度篩選／排序／藏起裝備中；
//   按不了的鈕寫原因（還差多少費拉、水晶、素材）；強化前→後預覽；分解要確認，可一次分解篩出來的全部。
// 倉庫：衣櫃（簞笥）樣式的格子、容量條、買箱子的卡片更清楚、批次賣出（勾選、略過上鎖與裝備中、要確認）、/ 搜尋。
// 要放在 guildhall.js、tarkovstash.js 後面（main.js 前面）。
(function (R) {
  const $ = id => document.getElementById(id), esc = s => R.esc(s), S = () => R.S;
  const KEY = 'tfl_smithstash';
  const ui = (() => { try { return Object.assign({ sub: 0, q: '', rar: 'all', sort: 'def', hideEq: 0 }, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return { sub: 0, q: '', rar: 'all', sort: 'def', hideEq: 0 }; } })();
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(ui)); } catch (e) { } };
  const tabOf = () => { const t = document.querySelector('[data-htab][aria-selected="true"]'); return t ? t.dataset.htab : ''; };
  const hubOn = () => { const h = $('hub'); return h && !h.hidden; };
  const confirmDo = (title, text, yes, fn) => R.ghConfirm ? R.ghConfirm(title, text, yes, fn) : (window.confirm(title + '\n' + text) && fn());
  const sign = (sec, mon) => {
    const h2 = sec && sec.querySelector(':scope > h2'); if (!h2 || h2.closest('.gh-board')) return;
    const b = document.createElement('div'); b.className = 'gh-board'; b.innerHTML = '<span class="gh-kamon">' + mon + '</span>'; h2.before(b); b.appendChild(h2);
  };
  const itemOfCard = cd => { const b = cd.querySelector('[data-ident],[data-up],[data-salv],[data-sell],[data-equip],[data-lock],[data-refine],[data-reforge],[data-ench],[data-gem],[data-iid]'); if (!b) return null; const id = b.dataset.ident || b.dataset.up || b.dataset.salv || b.dataset.sell || b.dataset.equip || b.dataset.lock || b.dataset.refine || b.dataset.reforge || b.dataset.ench || b.dataset.gem || b.dataset.iid; return R.itemById ? R.itemById(id) : null; };

  // ---------- 鐵匠鋪 ----------
  let smithFresh = true;   // 從別的分頁切進來：跳回上次的分頁
  const why = (b, txt) => { if (!txt || b.parentElement.querySelector('.hs-why')) return; const e = document.createElement('em'); e.className = 'hs-why'; e.textContent = txt; b.title = txt; b.after(e); };
  const reasons = body => {
    const s = S();
    body.querySelectorAll('button[disabled]').forEach(b => {
      const t = b.textContent, out = [];
      const g = t.match(/(\d+)\s*費拉/); if (g && s.gold < +g[1]) out.push('還差 ' + (+g[1] - s.gold) + ' 費拉');
      const c = t.match(/魔力水晶\s*(\d+)/); if (c && (s.mats.crystal || 0) < +c[1]) out.push('魔力水晶還差 ' + (+c[1] - (s.mats.crystal || 0)));
      if (b.dataset.craft != null && R.RECIPES) { const rc = R.RECIPES[+b.dataset.craft]; if (rc) { Object.keys(rc.mats).forEach(k => { const h = s.mats[k] || 0; if (h < rc.mats[k]) out.push((R.MATS[k] ? R.MATS[k].name : k) + '還差 ' + (rc.mats[k] - h)); }); if (s.gold < rc.gold) out.push('還差 ' + (rc.gold - s.gold) + ' 費拉'); } }
      if (out.length) why(b, out.join('・'));
    });
  };
  const upPreview = body => body.querySelectorAll('[data-up]').forEach(b => {
    const it = R.itemById(b.dataset.up); if (!it || b.parentElement.querySelector('.hs-pre')) return;
    const p = it.plus || 0, e = document.createElement('div'); e.className = 'hs-pre';
    e.innerHTML = '<b>+' + p + '</b> → <b class="up">+' + (p + 1) + '</b>　' + (it.kind === 'weapon' ? '武器傷害 ×' + (1 + 0.08 * p).toFixed(2) + ' → <b class="up">×' + (1 + 0.08 * (p + 1)).toFixed(2) + '</b>' : it.kind === 'acc' || it.kind === 'charm' ? '詞綴效果 ×' + (1 + 0.08 * p).toFixed(2) + ' → <b class="up">×' + (1 + 0.08 * (p + 1)).toFixed(2) + '</b>' : '防禦 +' + (1.5 * p).toFixed(1) + ' → <b class="up">+' + (1.5 * (p + 1)).toFixed(1) + '</b>');
    b.parentElement.before(e);
  });
  const RAR = () => (R.RARITY || []).map((r, i) => [String(i), r.name]);
  const listTools = (box, onBatch) => {
    if (box.previousElementSibling && box.previousElementSibling.classList.contains('hs-tools')) return;
    const cards = [...box.querySelectorAll(':scope > .item-card')]; if (cards.length < 2 && !onBatch) return;
    const eq = R.equippedIds ? R.equippedIds() : new Set();
    cards.forEach((c, i) => { const it = itemOfCard(c); c.dataset.i = i; c.dataset.r = it ? (it.identified ? it.rarity : -1) : -1; c.dataset.n = it ? R.itemName(it) : c.textContent; c.dataset.p = it ? it.plus || 0 : 0; c.dataset.lv = it ? it.ilvl || 0 : 0; c.dataset.eq = it && eq.has(it.id) ? 1 : 0; });
    const bar = document.createElement('div'); bar.className = 'hs-tools gh-tools';
    bar.innerHTML = '<div class="gh-tr"><input type="search" class="hs-q" placeholder="搜尋名稱、詞綴（/）" value="' + esc(ui.q) + '"><select class="hs-rar" title="稀有度"><option value="all">全部稀有度</option><option value="-1">未鑑定</option>' + RAR().map(([k, n]) => '<option value="' + k + '">' + esc(n) + '</option>').join('') + '</select>'
      + '<select class="hs-sort" title="排序"><option value="def">預設順序</option><option value="rdn">稀有度高→低</option><option value="rup">稀有度低→高</option><option value="lv">物品等級高→低</option><option value="plus">強化高→低</option><option value="name">名稱</option></select>'
      + '<label class="gh-ck"><input type="checkbox" class="hs-eq"' + (ui.hideEq ? ' checked' : '') + '> 藏起裝備中</label><span class="gh-cnt hs-cnt"></span>' + (onBatch ? '<button type="button" class="mini hs-batch">' + onBatch.label + '</button>' : '') + '</div>';
    box.before(bar);
    bar.querySelector('.hs-rar').value = ui.rar; bar.querySelector('.hs-sort').value = ui.sort;
    const vis = () => cards.filter(c => !c.hidden);
    const apply = () => {
      const q = ui.q.trim();
      cards.forEach(c => { c.hidden = !((ui.rar === 'all' || c.dataset.r === ui.rar) && (!ui.hideEq || c.dataset.eq !== '1') && (!q || c.textContent.includes(q))); });
      const f = { def: (a, b) => a.dataset.i - b.dataset.i, rdn: (a, b) => b.dataset.r - a.dataset.r, rup: (a, b) => a.dataset.r - b.dataset.r, lv: (a, b) => b.dataset.lv - a.dataset.lv, plus: (a, b) => b.dataset.p - a.dataset.p, name: (a, b) => a.dataset.n.localeCompare(b.dataset.n, 'zh-Hant') }[ui.sort];
      cards.slice().sort((a, b) => f(a, b) || a.dataset.i - b.dataset.i).forEach(c => box.appendChild(c));
      const n = vis().length; bar.querySelector('.hs-cnt').textContent = n + '／' + cards.length + ' 件';
      const bt = bar.querySelector('.hs-batch'); if (bt) { bt.disabled = !n; bt.textContent = onBatch.label + '（' + n + '）'; }
    };
    bar.querySelector('.hs-q').oninput = e => { ui.q = e.target.value; keep(); apply(); };
    bar.querySelector('.hs-rar').onchange = e => { ui.rar = e.target.value; keep(); apply(); };
    bar.querySelector('.hs-sort').onchange = e => { ui.sort = e.target.value; keep(); apply(); };
    bar.querySelector('.hs-eq').onchange = e => { ui.hideEq = e.target.checked ? 1 : 0; keep(); apply(); };
    if (onBatch) bar.querySelector('.hs-batch').onclick = () => onBatch.run(vis().map(itemOfCard).filter(Boolean));
    apply();
  };
  const smith = body => {
    const sec = body.querySelector('section.panel-doc'); if (!sec) return;
    sign(sec, '鍛');
    const tabs = [...sec.querySelectorAll('.subtabs .tab')];
    tabs.forEach((b, i) => { if (!b.querySelector('kbd')) b.insertAdjacentHTML('afterbegin', '<kbd>' + (i + 1) + '</kbd>'); b.title = (b.title ? b.title + '・' : '') + '快捷鍵 ' + (i + 1); });
    const on = tabs.findIndex(b => b.classList.contains('on'));
    if (smithFresh) { smithFresh = false; if (ui.sub && ui.sub !== on && tabs[ui.sub]) { tabs[ui.sub].click(); return; } }
    if (on >= 0) { ui.sub = on; keep(); }
    reasons(sec); upPreview(sec);
    sec.querySelectorAll('.items').forEach(box => {
      const salv = box.querySelector('[data-salv]');
      listTools(box, salv ? { label: '分解篩出來的全部', run: list => {
        const eq = R.equippedIds(), ok = list.filter(it => !it.locked && !eq.has(it.id)); if (!ok.length) return;
        const best = ok.reduce((a, it) => (!a || (it.rarity || 0) > (a.rarity || 0) ? it : a), null);
        confirmDo('一次分解 ' + ok.length + ' 件？', '分解了就拿不回來（上鎖、裝備中的不會動）。最好的一件：' + R.itemName(best) + '。', '全部分解', () => {
          const got = {}; ok.forEach(it => { const g = R.salvage(it) || {}; Object.keys(g).forEach(k => { got[k] = (got[k] || 0) + g[k]; }); });
          R.hub(); R.say && R.say('分解了 ' + ok.length + ' 件：' + Object.keys(got).map(k => (R.MATS[k] ? R.MATS[k].name : k) + ' ×' + got[k]).join('、'));
        });
      } } : null);
    });
  };
  // 分解單件：先確認（精良以上、或有強化過的）
  let salvOk = false;
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('[data-salv]'); if (!b || salvOk || !hubOn()) return;
    const it = R.itemById(b.dataset.salv); if (!it) return;
    e.preventDefault(); e.stopImmediatePropagation();
    confirmDo('分解「' + R.itemName(it) + '」？', '分解了就拿不回來' + (it.plus ? '（強化 +' + it.plus + ' 也一起沒了）' : '') + '。', '分解', () => { salvOk = true; try { b.click(); } finally { salvOk = false; } });
  }, true);

  // ---------- 倉庫 ----------
  const cap = () => {
    const g = document.querySelector('.tk-stash [data-tkg="main"]'), out = $('hs-cap'); if (!out) return;
    if (!g) { out.hidden = true; return; }
    const cs = parseFloat(getComputedStyle(g).getPropertyValue('--cs')) || 0; if (!cs) return;
    const W = Math.round(g.clientWidth / cs), H = Math.round(g.clientHeight / cs);
    let used = 0; g.querySelectorAll(':scope > .tk-it').forEach(el => { used += Math.round(el.offsetWidth / cs) * Math.round(el.offsetHeight / cs); });
    const over = document.querySelectorAll('.tk-stash [data-tkg="over"] .tk-it').length, pct = Math.min(100, Math.round(used / Math.max(1, W * H) * 100));
    out.hidden = false;
    out.innerHTML = '<small>倉庫容量</small><span class="gh-bar' + (pct >= 90 ? ' full' : '') + '"><i style="width:' + pct + '%"></i></span><b>' + used + '／' + (W * H) + ' 格（' + pct + '%）</b>' + (over ? '<em class="hs-why">暫放區還有 ' + over + ' 件放不下</em>' : '');
  };
  const sellPanel = (stashEl) => {
    if ($('hs-sell')) return;
    const s = S(), eq = R.equippedIds(), list = s.stash.filter(it => !it.locked && !eq.has(it.id));
    const d = document.createElement('details'); d.id = 'hs-sell'; d.className = 'hs-sell';
    const row = it => '<label class="hs-srow" style="--c:' + R.rarityColor(it) + '"><input type="checkbox" value="' + it.id + '"><b>' + esc(R.itemName(it)) + '</b><small>' + (it.identified ? esc(R.RARITY[it.rarity].name) : '未鑑定') + '・Lv ' + (it.ilvl || 1) + (it.plus ? '・+' + it.plus : '') + '</small><span>' + R.sellPrice(it) + ' 費拉</span></label>';
    d.innerHTML = '<summary>批次賣出（可以賣的 ' + list.length + ' 件；上鎖、裝備中的不列）</summary>'
      + '<div class="gh-chips">' + [['un', '未鑑定']].concat(RAR().map(([k, n]) => [k, n + '以下'])).map(([k, n]) => '<button type="button" class="gh-chip" data-hspick="' + k + '">勾' + esc(n) + '</button>').join('') + '<button type="button" class="gh-chip" data-hspick="none">全部取消</button></div>'
      + '<div class="hs-slist">' + (list.map(row).join('') || '<p class="note">沒有可以賣的東西。</p>') + '</div><div class="row"><span class="hs-stot">已勾 0 件・0 費拉</span><button type="button" class="btn red" id="hs-sellgo" disabled>賣掉勾選的</button></div>';
    stashEl.before(d);
    const boxes = () => [...d.querySelectorAll('.hs-slist input')];
    const sum = () => { const sel = boxes().filter(x => x.checked).map(x => R.itemById(x.value)).filter(Boolean), tot = sel.reduce((a, it) => a + R.sellPrice(it), 0); d.querySelector('.hs-stot').textContent = '已勾 ' + sel.length + ' 件・' + tot + ' 費拉'; d.querySelector('#hs-sellgo').disabled = !sel.length; return { sel, tot }; };
    d.querySelector('.hs-slist').onchange = sum;
    d.querySelectorAll('[data-hspick]').forEach(b => { b.onclick = () => { const k = b.dataset.hspick; boxes().forEach(x => { const it = R.itemById(x.value); x.checked = k === 'none' ? false : k === 'un' ? !it.identified : it.identified && it.rarity <= +k; }); sum(); }; });
    d.querySelector('#hs-sellgo').onclick = () => {
      const { sel, tot } = sum(); if (!sel.length) return;
      const best = sel.reduce((a, it) => (!a || (it.identified ? it.rarity : -1) > (a.identified ? a.rarity : -1) ? it : a), null);
      confirmDo('賣掉 ' + sel.length + ' 件？', '共 ' + tot + ' 費拉，賣了就拿不回來。最好的一件：' + R.itemName(best) + '。', '賣掉', () => {
        let got = 0, n = 0; sel.forEach(it => { if (!it.locked && !R.equippedIds().has(it.id)) { got += R.sell(it); n++; } });
        R.save && R.save(); R.hub('stash'); R.say && R.say('賣了 ' + n + ' 件，拿到 ' + got + ' 費拉');
      });
    };
  };
  const shopCards = () => document.querySelectorAll('.tk-shop [data-tkbuy], .tk-bar [data-tkup]').forEach(b => {
    if (!b.disabled) return; const m = b.textContent.match(/(\d+)\s*費拉/); if (m && S().gold < +m[1]) b.title = (b.title ? b.title + '\n' : '') + '還差 ' + (+m[1] - S().gold) + ' 費拉';
  });
  // 寬版三欄（2026-10-13 作者：衣櫃放左邊，右邊跟以前一樣詳細裝備數值；角色數值自己點才展開；左右往外拓寬）
  let csOpen = 0; try { csOpen = +localStorage.getItem('tfl_stash_cs') || 0; } catch (e) { }
  let pickId = null;
  const detail = (panel, id) => {
    const it = id && R.itemById(id), body = $('hub-body');
    if (!it) { panel.innerHTML = '<h3>裝備詳細</h3><p class="note">把滑鼠移到衣櫃裡的東西上（手機：點一下），這裡會顯示完整的數值、詞綴，和現在穿著的比較。</p>'; return; }
    const orig = [...body.querySelectorAll('.item-card')].find(c => !panel.contains(c) && c.querySelector('[data-equip="' + id + '"],[data-sell="' + id + '"],[data-lock="' + id + '"]'));
    panel.innerHTML = '<h3>裝備詳細</h3>';
    if (orig) { const cl = orig.cloneNode(true); cl.hidden = false; cl.removeAttribute('data-tk-shown'); panel.appendChild(cl); }
    else panel.insertAdjacentHTML('beforeend', '<div class="item-card" style="--c:' + R.rarityColor(it) + '"><b>' + esc(R.itemName(it)) + '</b>' + (R.itemInfo ? R.itemInfo(it) : '') + '</div>');
    try {
      const k = R.slotOf && R.slotOf(it), eq = k && R.equipped ? R.equipped(S().cls) : null, e = eq && (eq[k] || (k === 'acc' && (eq.acc || eq.acc2)));
      if (e && e.id !== it.id) panel.insertAdjacentHTML('beforeend', '<h4 class="sw-vs">現在穿著的</h4><div class="item-card sw-eq" style="--c:' + R.rarityColor(e) + '"><b>' + esc(R.itemName(e)) + '</b>' + (R.itemInfo ? R.itemInfo(e) : '') + '</div>');
    } catch (er) { }
    // 卡片上的鈕：轉給原本那張卡（事件都綁在原本的卡上）
    panel.querySelectorAll('button').forEach(b => {
      const keyA = [...b.attributes].find(a => /^data-/.test(a.name)); if (!keyA) { b.disabled = true; return; }
      const fw = ev => { const t = [...body.querySelectorAll('[' + keyA.name + '="' + keyA.value + '"]')].find(x => !panel.contains(x)); if (!t) return; ev.preventDefault(); ev.stopPropagation(); t.dispatchEvent(new ev.constructor(ev.type, ev)); };
      ['click', 'pointerdown', 'pointerup', 'pointerleave', 'mousedown', 'mouseup', 'touchstart', 'touchend'].forEach(tp => b.addEventListener(tp, fw));
    });
  };
  const wideLayout = body => {
    const st = body.querySelector('.tk-stash'); if (!st || body.querySelector('.sw-cols')) return;
    const old = body.querySelector('.st-cols'), left = old && old.querySelector('.st-left'), mid = old && old.querySelector('.st-right');
    const cols = document.createElement('div'); cols.className = 'sw-cols';
    const L = document.createElement('div'); L.className = 'sw-l'; const M = document.createElement('div'); M.className = 'sw-m'; const Rt = document.createElement('div'); Rt.className = 'sw-r';
    const cap = $('hs-cap'); L.innerHTML = '<div class="gh-board sw-sign"><span class="gh-kamon">蔵</span><h2>衣櫃</h2></div>'; if (cap) L.appendChild(cap); L.appendChild(st);
    if (mid) while (mid.firstChild) M.appendChild(mid.firstChild); else [...body.children].forEach(c => { if (c !== cols) M.appendChild(c); });
    const panel = document.createElement('div'); panel.className = 'sw-detail'; Rt.appendChild(panel);
    if (left) while (left.firstChild) Rt.appendChild(left.firstChild);
    Rt.querySelectorAll('details.cs-box:not(.hs-own)').forEach(d => { d.open = !!csOpen; d.addEventListener('toggle', () => { csOpen = d.open ? 1 : 0; try { localStorage.setItem('tfl_stash_cs', csOpen); } catch (e) { } }); });
    cols.append(L, M, Rt); if (old) old.replaceWith(cols); else body.appendChild(cols);
    detail(panel, pickId && R.itemById(pickId) ? pickId : null);
    const hov = e => { const el = e.target.closest && e.target.closest('.tk-it[data-tk]'); if (!el || el.dataset.tk === pickId) return; pickId = el.dataset.tk; detail(panel, pickId); };
    st.addEventListener('mouseover', hov); st.addEventListener('pointerup', hov);
  };
  let capObs = null;
  const stash = body => {
    const sec = body.querySelector('section.panel-doc'); if (sec) sign(sec, '蔵');
    const st = body.querySelector('.tk-stash'); if (!st) return;
    if (!$('hs-cap')) { const c = document.createElement('div'); c.id = 'hs-cap'; c.className = 'hs-cap'; st.before(c); }
    try { sellPanel(st); } catch (e) { console.warn('[smithstash]', e); }
    try { wideLayout(body); } catch (e) { console.warn('[smithstash]', e); }
    cap(); shopCards();
    if (capObs) capObs.disconnect();
    capObs = new MutationObserver(() => { cap(); shopCards(); }); capObs.observe(st, { childList: true, subtree: true });
  };

  const hub0 = R.hub;
  R.hub = (t, f) => {
    if (t === 'smith' && !f && (tabOf() !== 'smith' || !hubOn())) smithFresh = true;
    const r = hub0(t, f);
    try {
      const hub = $('hub'), body = $('hub-body'), tab = tabOf();
      hub.classList.toggle('hs-smith', tab === 'smith'); hub.classList.toggle('hs-stash', tab === 'stash'); hub.classList.toggle('hs-on', tab === 'smith' || tab === 'stash');
      if (tab === 'smith') smith(body); else if (tab === 'stash') stash(body);
    } catch (e) { console.warn('[smithstash]', e); }
    return r;
  };

  window.addEventListener('keydown', e => {
    if (!hubOn() || $('gh-confirm')) return;
    const tab = tabOf(); if (tab !== 'smith' && tab !== 'stash') return;
    const m = $('hub-modal'); if (m && !m.hidden) return;
    const tg = e.target, typing = tg && ((tg.tagName === 'INPUT' && !/^(checkbox|radio|button)$/.test(tg.type)) || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable);
    if (typing) { if (e.key === 'Escape') tg.blur(); return; }
    if (e.ctrlKey || e.altKey || e.metaKey) return;
    if (tab === 'smith' && /^[1-9]$/.test(e.key)) { const b = document.querySelectorAll('#hub-body .subtabs .tab')[+e.key - 1]; if (b) { e.preventDefault(); e.stopPropagation(); b.click(); } }
    else if (e.key === '/') { const q = tab === 'smith' ? document.querySelector('#hub-body .hs-q') : $('st-q'); if (q) { e.preventDefault(); e.stopPropagation(); q.focus(); } }
  }, true);

  const css = document.createElement('style');
  css.textContent = [
    '#hub.hs-on{--gh-wood:#4A2F1C;--gh-wood2:#6B4527;--gh-ai:#22305A;--gh-shu:#C2412D;--gh-washi:#F2E8D2;--gh-sumi:#1E1A17}',
    '#hub.hs-on .hub-body{background:radial-gradient(ellipse at 50% 0,rgba(194,65,45,.08),transparent 60%),repeating-linear-gradient(90deg,#16121A 0 120px,#181320 120px 121px)}',
    '#hub.hs-smith .hub-body{background:radial-gradient(ellipse at 50% 100%,rgba(255,120,40,.10),transparent 55%),repeating-linear-gradient(90deg,#16121A 0 120px,#181320 120px 121px)}',
    '#hub.hs-on .panel-doc>.gh-board{display:inline-flex;margin:4px 0 8px}#hub.hs-on .gh-board h2{margin:0}',
    '#hub.hs-on .panel-doc h3{letter-spacing:.12em;padding-left:10px;border-left:4px solid var(--gh-shu)}',
    // 暖簾分頁
    '#hub.hs-smith .subtabs{display:flex;gap:4px;flex-wrap:nowrap;overflow-x:auto;border-bottom:4px solid var(--gh-ai);margin:6px 0 10px;padding:0 2px;scrollbar-width:thin}',
    '#hub.hs-smith .subtabs .tab{flex:0 0 auto;min-height:42px;padding:8px 14px 10px;border:0;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#2E3C68,#1F2A4C);color:#DDE3F5;font-weight:700;letter-spacing:.06em;-webkit-mask:linear-gradient(#000,#000) top/100% 70% no-repeat,linear-gradient(90deg,#000 0 46%,transparent 46% 54%,#000 54%) bottom/100% 31% no-repeat}',
    '#hub.hs-smith .subtabs .tab.on{background:linear-gradient(180deg,var(--gh-shu),#962F20);color:#FFF6E8;-webkit-mask:none}',
    '#hub.hs-smith .subtabs .tab kbd{font:11px monospace;opacity:.6;margin-right:6px;border:1px solid currentColor;border-radius:3px;padding:0 3px}',
    '#hub.hs-on .item-card{border-top:3px solid var(--c,#888);box-shadow:0 3px 8px rgba(0,0,0,.35)}',
    '#hub.hs-smith .recipe,#hub.hs-smith .cf-box{border-top:3px solid var(--gh-shu)}',
    '.hs-why{display:block;font-style:normal;font-size:12px;color:#FF9A7A;font-weight:700;margin:3px 0}',
    '.hs-pre{font-size:13px;margin:6px 0 2px;padding:4px 8px;border-radius:4px;background:rgba(240,207,106,.08);border:1px dashed rgba(240,207,106,.35)}.hs-pre .up{color:#9AE08A}',
    '#hub.hs-on .gh-tools{display:flex;flex-direction:column;gap:8px;margin:4px 0 10px;padding:8px;border-radius:6px;background:rgba(0,0,0,.35)}',
    '#hub.hs-on .gh-tr{display:flex;flex-wrap:wrap;gap:8px;align-items:center}#hub.hs-on .gh-tr input[type=search],#hub.hs-on .gh-tr select{min-height:34px;padding:4px 10px;border-radius:6px;border:1px solid #8A7A5A;background:var(--gh-washi);color:var(--gh-sumi);font:inherit}#hub.hs-on .gh-tr input[type=search]{flex:1 1 160px}',
    '#hub.hs-on .gh-ck{display:flex;gap:4px;align-items:center;color:#EEE3C8;font-size:14px;cursor:pointer}#hub.hs-on .gh-cnt{margin-left:auto;color:#F0CF6A;font-weight:700}',
    '#hub.hs-on .gh-chips{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}#hub.hs-on .gh-chip{min-height:32px;padding:4px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:#EEE3C8;font-weight:700;cursor:pointer}',
    // 倉庫：簞笥
    '#hub.hs-stash .tk-grid{border:6px solid #3A2414;border-radius:3px;background-color:#2A1C12;background-image:linear-gradient(rgba(255,220,160,.10) 1px,transparent 1px),linear-gradient(90deg,rgba(255,220,160,.10) 1px,transparent 1px);box-shadow:inset 0 0 18px rgba(0,0,0,.6),0 0 0 2px #7A5A30,0 6px 14px rgba(0,0,0,.5)}',
    '#hub.hs-stash .tk-it{border-width:2px;border-radius:2px;background:radial-gradient(circle at 50% 40%,rgba(255,255,255,.10),rgba(0,0,0,.35)),color-mix(in srgb,var(--c,#888) 18%,transparent)}',
    '#hub.hs-stash .tk-it:hover{box-shadow:0 0 0 2px #F0CF6A;z-index:2}',
    '#hub.hs-stash .tk-bar{gap:6px}#hub.hs-stash .tk-bar .mini{min-height:34px;padding:4px 12px}',
    '#hub.hs-stash .tk-shop{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin:8px 0}',
    '#hub.hs-stash .tk-shop .mini{min-height:52px;padding:6px 10px;text-align:left;border-radius:4px;background:linear-gradient(180deg,#5A3A20,#3E2716);color:#F6E7C4;border:1px solid #8A6A3A;box-shadow:inset 0 0 0 2px rgba(255,220,160,.08);white-space:normal}',
    '#hub.hs-stash .tk-shop .mini:disabled{opacity:.5;filter:grayscale(.6)}',
    '.hs-cap{display:flex;flex-wrap:wrap;gap:8px;align-items:center;margin:6px 0;padding:6px 10px;border-radius:6px;background:rgba(0,0,0,.35);border-left:3px solid var(--gold,#C9A13A)}.hs-cap .gh-bar{flex:1 1 160px;display:block;height:8px;border-radius:4px;background:rgba(255,255,255,.1);overflow:hidden}.hs-cap .gh-bar i{display:block;height:100%;background:linear-gradient(90deg,#B8862A,#F0CF6A)}.hs-cap .gh-bar.full i{background:linear-gradient(90deg,#962F20,#E0604A)}.hs-cap small{color:var(--dim)}',
    '.hs-sell{margin:8px 0;padding:8px 10px;border-radius:6px;background:rgba(34,48,90,.2);border:1px solid rgba(237,230,214,.15)}.hs-sell summary{cursor:pointer;font-weight:700;color:#F3E4BE}',
    '.hs-slist{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:4px;max-height:320px;overflow:auto;margin:6px 0}',
    '.hs-srow{display:grid;grid-template-columns:auto 1fr auto;grid-template-rows:auto auto;column-gap:8px;align-items:center;padding:4px 8px;border-radius:4px;background:rgba(0,0,0,.3);border-left:4px solid var(--c);cursor:pointer}.hs-srow input{grid-row:1/3}.hs-srow b{color:var(--c)}.hs-srow small{grid-column:2;color:var(--dim)}.hs-srow span{grid-row:1/3;grid-column:3;color:#F0CF6A}',
    '.hs-sell .row{display:flex;gap:10px;align-items:center;justify-content:flex-end}.hs-sell .btn.red{background:#C2412D;color:#FFF;border-color:#7A2214}.hs-sell .btn.red:disabled{opacity:.5}',
    '#hub.hs-stash .hub-body{padding-left:1vw;padding-right:1vw}',
    '.sw-cols{display:grid;grid-template-columns:minmax(0,640px) minmax(300px,1fr) minmax(320px,28%);gap:16px;align-items:start;width:100%;max-width:98vw;margin:0 auto}',
    '.sw-cols .panel-doc{max-width:none;margin:0}.sw-l{min-width:0}.sw-l .tk-wrap{flex-direction:column}.sw-sign{display:inline-flex;margin:0 0 6px}',
    '.sw-r{position:sticky;top:0;display:flex;flex-direction:column;gap:10px;max-height:calc(100vh - 140px);overflow:auto}',
    '.sw-detail{padding:10px 12px;border-radius:8px;background:linear-gradient(180deg,rgba(30,36,60,.35),rgba(22,19,28,.8));border:1px solid rgba(201,161,58,.35)}.sw-detail h3{margin:0 0 6px}.sw-detail .item-card{margin:0 0 8px}.sw-vs{margin:8px 0 4px;color:#C8B88A;font-size:13px}.sw-eq{opacity:.9}',
    '@media (max-width:1100px){.sw-cols{grid-template-columns:minmax(0,640px) 1fr}.sw-r{grid-column:1/-1;position:static;max-height:none}}',
    '@media (max-width:760px){.sw-cols{grid-template-columns:1fr}.sw-l{overflow-x:auto}}',
    '@media (max-width:720px){#hub.hs-on .item-card .btn,#hub.hs-on .item-card .mini{min-height:40px}#hub.hs-smith .subtabs .tab kbd{display:none}.hs-slist{grid-template-columns:1fr}}'
  ].join('\n');
  document.head.appendChild(css);
})(window.R);

// ---------- 鐵匠鋪：打造完「立刻裝備」、鐵匠鋪裡也能直接穿上（2026-10-13 作者：打造好還要回家才能換上） ----------
(function (R) {
  const $ = id => document.getElementById(id), esc = s => R.esc(s), S = () => R.S;
  let fresh = null;   // 剛打造好的那件 id
  ['craft', 'craftNamed'].forEach(fn => { const f0 = R[fn]; if (typeof f0 !== 'function') return; R[fn] = (...a) => { const it = f0(...a); if (it && it.id) fresh = it.id; return it; }; });
  const say = (t, c) => { const el = $('hub-msg'); if (el) { el.textContent = t; el.style.color = c || ''; el.classList.remove('on'); void el.offsetWidth; el.classList.add('on'); } else if (R.toast) R.toast(t, c); };
  const why = it => {
    const s = S(); if (!it) return '找不到這件';
    if (R.equippedIds().has(it.id)) return '已經穿在身上';
    if (!R.canUse(it, s.cls)) return (R.CLASSES[s.cls] ? R.CLASSES[s.cls].name : '目前職業') + '不能用' + (it.kind === 'armor' ? '（可能太重）' : '');
    if (it.reqLv && (s.classes[s.cls] || {}).lv < it.reqLv) return '等級不夠（要 ' + it.reqLv + ' 級）';
    if (!R.slotOf(it)) return '不能穿';
    return '';
  };
  R.smithEquip = id => {
    const s = S(), it = R.itemById(id), no = why(it); if (no) { say(no, '#FFB45A'); return false; }
    const e = s.equip[s.cls] = s.equip[s.cls] || {}; (R.GEAR_KEYS || []).forEach(k => { if (!(k in e)) e[k] = null; });
    const k = R.slotOf(it), oldId = e[k], old = oldId && R.itemById(oldId);
    e[k] = it.id; if (fresh === id) fresh = null;
    let msg = '穿上了：' + R.itemName(it);
    if (old) { const ok = R.stashTryPlace ? R.stashTryPlace(old) : true; msg += ok ? '（換下的' + R.itemName(old) + '放回倉庫）' : '（倉庫格子滿了，換下的' + R.itemName(old) + '先放在倉庫的「暫放區」，不會不見）'; }
    R.save && R.save(); R.hub(); say(msg, R.rarityColor ? R.rarityColor(it) : ''); return true;
  };
  const deco = body => {
    const sec = body.querySelector('section') || body;
    const old = body.querySelector('.ss-fresh'); if (old) old.remove();
    const it = fresh && R.itemById(fresh);
    if (it && !R.equippedIds().has(it.id)) {
      const no = why(it), d = document.createElement('div'); d.className = 'ss-fresh';
      d.innerHTML = '<span>剛打造好：<b style="color:' + (R.rarityColor ? R.rarityColor(it) : '') + '">' + esc(R.itemName(it)) + '</b></span>'
        + (no ? '<small>' + esc(no) + '，已放進倉庫</small>' : '<button type="button" class="btn pri" data-ssequip="' + it.id + '">立刻裝備</button>') + '<button type="button" class="mini" data-ssdismiss>收起</button>';
      sec.prepend(d);
    }
    // 鐵匠鋪裡的裝備卡片：沒穿、能用的加一顆「穿上」
    const eq = R.equippedIds();
    body.querySelectorAll('.item-card').forEach(cd => {
      if (cd.querySelector('[data-equip],[data-ssequip]')) return;
      const b = cd.querySelector('[data-up],[data-salv],[data-refine],[data-reforge],[data-ench],[data-gem],[data-ident],[data-iid],[data-lock]'); if (!b) return;
      const id = b.dataset.up || b.dataset.salv || b.dataset.refine || b.dataset.reforge || b.dataset.ench || b.dataset.gem || b.dataset.ident || b.dataset.iid || b.dataset.lock, it2 = R.itemById(id);
      if (!it2 || eq.has(it2.id) || why(it2)) return;
      const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn'; btn.dataset.ssequip = it2.id; btn.textContent = '穿上（' + ((R.GEAR_NAME && R.GEAR_NAME[R.slotOf(it2)]) || '') + '）';
      b.parentNode.insertBefore(btn, b);
    });
  };
  document.addEventListener('click', e => {
    const b = e.target.closest && e.target.closest('[data-ssequip],[data-ssdismiss]'); if (!b || !b.closest('#hub')) return;
    e.preventDefault(); e.stopPropagation();
    if (b.dataset.ssequip) R.smithEquip(b.dataset.ssequip); else { fresh = null; const f = b.closest('.ss-fresh'); if (f) f.remove(); }
  }, true);
  const hub0 = R.hub;
  R.hub = (t, f) => {
    const r = hub0(t, f);
    try { const tb = document.querySelector('[data-htab][aria-selected="true"]'), body = $('hub-body'); if (tb && tb.dataset.htab === 'smith' && body) deco(body); else if (tb && tb.dataset.htab !== 'smith') fresh = null; } catch (e) { console.warn('[smithstash equip]', e); }
    return r;
  };
  const css = document.createElement('style');
  css.textContent = '.ss-fresh{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin:0 0 10px;padding:8px 12px;border-radius:8px;background:rgba(201,161,58,.14);border:1px solid rgba(201,161,58,.6)}.ss-fresh small{color:#FFB45A}.ss-fresh .mini{margin-left:auto}';
  document.head.appendChild(css);
})(window.R);
