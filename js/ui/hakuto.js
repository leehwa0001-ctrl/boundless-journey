// 白藤堂的介面重做（2026-10-13 作者：「百藤堂也要改」＝白藤堂）：跟公會、鐵匠鋪一樣的風格與方便
// 只改畫面，不動價格與邏輯。白藤堂頁面原本是：最上面（標題外面）一塊背包、藥品四張卡、符卷師的書桌、遺跡用炸藥。
// - 招牌＋常駐狀態列（錢包、身上的藥、藥草、樹枝、現在的背包）＋暖簾分頁：藥品／炸藥／背包／符卷（符卷師才有）
// - 藥品可以一次買 5、買到滿錢包（照原本一瓶一瓶買）；藥草可以一次全部換；按不了的鈕寫原因
// - 背包卡片顯示比現在的多幾格；買背包要確認；大量購買會先確認總價
// - 數字鍵 1～4 換分頁、記住上次的分頁
// 要放在 guildhall.js、smithstash.js 後面（用 R.ghConfirm 與同一套樣式）。
(function (R) {
  const $ = id => document.getElementById(id), esc = s => R.esc(s), S = () => R.S;
  const KEY = 'tfl_hakuto';
  let tab = 'med'; try { tab = localStorage.getItem(KEY) || 'med'; } catch (e) { }
  const keep = () => { try { localStorage.setItem(KEY, tab); } catch (e) { } };
  const isShop = () => { const t = document.querySelector('[data-htab][aria-selected="true"]'); return t && t.dataset.htab === 'shop'; };
  const hubOn = () => { const h = $('hub'); return h && !h.hidden; };
  const confirmDo = (t, x, y, fn) => R.ghConfirm ? R.ghConfirm(t, x, y, fn) : (window.confirm(t + '\n' + x) && fn());
  const TABS = [['med', '藥品'], ['bomb', '炸藥'], ['bag', '背包'], ['scroll', '符卷'], ['etc', '其他']];
  const say = m => R.say ? R.say(m) : R.toast && R.toast(m);
  const why = (b, t) => { if (!t) return; b.title = t; const p = b.closest('.recipe, .pk-card, div'); if (p && !p.querySelector('.hs-why')) { const e = document.createElement('em'); e.className = 'hs-why'; e.textContent = t; b.after(e); } };
  const cells = s => { const m = (s || '').match(/[=＝]\s*(\d+)\s*格/); return m ? +m[1] : 0; };

  // 一直按同一顆（每按一次頁面重畫，所以每次重新找）
  const press = (sel, n) => { let k = 0; for (; k < n; k++) { const b = document.querySelector('#hub-body ' + sel); if (!b || b.disabled) break; b.click(); } return k; };

  const build = () => {
    const hub = $('hub'), body = $('hub-body'); if (!hub || !body) return;
    hub.classList.toggle('hk-on', isShop()); if (!isShop()) return;
    hub.classList.add('hs-on');
    if (body.querySelector('.hk-root')) return;
    const s = S(), sec = body.querySelector('section.panel-doc'); if (!sec) return;
    const groups = { med: [], bomb: [], bag: [], scroll: [], etc: [] };
    let intro = [];
    [...body.children].forEach(c => {
      if (c === sec) {
        [...sec.children].forEach(x => {
          if (x.tagName === 'H2') return;
          if (x.tagName === 'P' && !groups.med.length) { intro.push(x); return; }
          if (/符卷/.test(x.textContent) && x.classList.contains('recipe')) groups.scroll.push(x);
          else if (x.classList.contains('recipes')) groups.med.push(x);
          else if (x.classList.contains('bomb-shop') || (x.querySelector && x.querySelector('[data-bomb]'))) groups.bomb.push(x);
          else if (x.querySelector && x.querySelector('[data-pkbuy]')) groups.bag.push(x);
          else groups.etc.push(x);
        });
      } else if (c.classList.contains('pk-box') || (c.querySelector && c.querySelector('[data-pkbuy]'))) groups.bag.push(c);
      else groups.etc.push(c);
    });
    const tabs = TABS.filter(([k]) => groups[k].length);
    if (!groups[tab] || !groups[tab].length) tab = tabs[0][0];
    const root = document.createElement('div'); root.className = 'hk-root gh-root';
    const head = document.createElement('header'); head.className = 'gh-sign';
    head.innerHTML = '<div class="gh-board hk-board"><span class="gh-kamon">藥</span><h2>白藤堂</h2></div>'; intro.forEach(p => head.appendChild(p));
    const bagNow = body.querySelector('.pk-box .pk-card.cur, .pk-box .cur, .pk-box [aria-current]');
    const bagTxt = ((body.querySelector('.pk-box > .note') || {}).textContent || '').match(/現在背的是\s*([^。]+)/);
    const sum = document.createElement('div'); sum.className = 'gh-sum hk-sum';
    sum.innerHTML = '<div class="gh-s"><small>錢包</small><b>' + s.gold + ' 費拉</b></div><div class="gh-s"><small>身上的藥</small><b>回復藥 ' + s.potions.hp + '・魔力藥 ' + s.potions.mp + '</b></div>'
      + '<div class="gh-s"><small>素材</small><b>藥草 ' + (s.mats.herb || 0) + '・樹枝 ' + (s.mats.branch || 0) + '</b></div>' + (bagTxt ? '<div class="gh-s"><small>現在的背包</small><b>' + esc(bagTxt[1]) + '</b></div>' : '');
    const nav = document.createElement('nav'); nav.className = 'gh-noren';
    tabs.forEach(([k, n], i) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'gh-tab'; b.dataset.hkt = k; b.title = n + '（快捷鍵 ' + (i + 1) + '）'; b.innerHTML = '<kbd>' + (i + 1) + '</kbd>' + esc(n); nav.appendChild(b); });
    const panes = document.createElement('div');
    tabs.forEach(([k]) => { const p = document.createElement('section'); p.className = 'gh-pane panel-doc hk-pane'; p.dataset.hkp = k; groups[k].forEach(e => { const c = document.createElement('div'); c.className = 'gh-card'; c.appendChild(e); p.appendChild(c); }); panes.appendChild(p); });
    const show = k => { tab = k; keep(); nav.querySelectorAll('[data-hkt]').forEach(b => b.classList.toggle('on', b.dataset.hkt === k)); panes.querySelectorAll('[data-hkp]').forEach(p => { p.hidden = p.dataset.hkp !== k; }); };
    nav.querySelectorAll('[data-hkt]').forEach(b => { b.onclick = () => show(b.dataset.hkt); });
    root.append(head, sum, nav, panes); body.innerHTML = ''; body.appendChild(root);
    enhance(root); show(tab);
  };

  const enhance = root => {
    const s = S();
    // 藥品：一次買多瓶
    root.querySelectorAll('[data-buy]').forEach(b => {
      const [k, p] = b.dataset.buy.split(':'), price = +p, can = Math.floor(s.gold / price);
      if (b.disabled) why(b, '還差 ' + (price - s.gold) + ' 費拉');
      const row = document.createElement('div'); row.className = 'hk-bulk';
      const n5 = Math.min(5, can);
      row.innerHTML = '<button type="button" class="mini" data-hkn="5"' + (can < 2 ? ' disabled' : '') + '>買 ' + (n5 >= 2 ? n5 : 5) + ' 瓶（' + (n5 >= 2 ? n5 : 5) * price + ' 費拉）</button><button type="button" class="mini" data-hkn="max"' + (can < 2 ? ' disabled' : '') + '>錢包買滿（' + can + ' 瓶・' + can * price + ' 費拉）</button>';
      b.after(row);
      row.querySelectorAll('[data-hkn]').forEach(x => { x.onclick = () => {
        const n = x.dataset.hkn === 'max' ? can : n5, nm = k === 'hp' ? '回復藥' : '魔力藥';
        const go = () => { const got = press('[data-buy^="' + k + ':"]', n); say('買了 ' + got + ' 瓶' + nm + '（' + got * price + ' 費拉）'); };
        if (n * price >= 200) confirmDo('買 ' + n + ' 瓶' + nm + '？', '一共 ' + n * price + ' 費拉，買完剩 ' + (s.gold - n * price) + ' 費拉。', '買', go); else go();
      }; });
    });
    // 藥草：全部換
    const hb = root.querySelector('[data-herb]');
    if (hb) {
      const n = Math.floor((s.mats.herb || 0) / 3);
      if (hb.disabled) why(hb, '藥草還差 ' + (3 - (s.mats.herb || 0)) + ' 株');
      else if (n >= 2) { const x = document.createElement('button'); x.type = 'button'; x.className = 'mini'; x.textContent = '全部換（' + n + ' 瓶，用掉 ' + n * 3 + ' 株）'; x.onclick = () => { const got = press('[data-herb]', n); say('換了 ' + got + ' 瓶回復藥'); }; hb.after(x); }
    }
    const br = root.querySelector('[data-branch]'); if (br && br.disabled) why(br, '沒有樹枝');
    if (br && !br.disabled) br.textContent = '全部賣掉（' + (s.mats.branch || 0) + ' 費拉）';
    // 炸藥：錢不夠的原因
    root.querySelectorAll('[data-bomb]').forEach(b => { if (!b.disabled) return; const c = b.closest('.recipe'), m = c && c.textContent.match(/一顆\s*(\d+)\s*費拉/); if (m) { const n = +b.dataset.bomb.split(':')[1] || 1, need = +m[1] * (n > 1 ? 1 : 1) - s.gold; if (need > 0) why(b, '還差 ' + need + ' 費拉'); } });
    // 背包：比現在多幾格、錢不夠的原因
    const cards = [...root.querySelectorAll('.pk-list > *')], curCard = cards.find(c => !c.querySelector('[data-pkbuy]')) || null, curCells = curCard ? cells(curCard.textContent) : 0;
    cards.forEach(c => {
      const b = c.querySelector('[data-pkbuy]'), n = cells(c.textContent); if (!b) { c.classList.add('hk-cur'); return; }
      if (curCells && n) { const d = document.createElement('em'); d.className = 'hk-diff' + (n > curCells ? ' up' : ''); d.textContent = n > curCells ? '比現在多 ' + (n - curCells) + ' 格' : n === curCells ? '跟現在一樣大' : '比現在少 ' + (curCells - n) + ' 格'; b.before(d); }
      const m = c.textContent.match(/(\d+)\s*費拉/); if (b.disabled && m && s.gold < +m[1]) why(b, '還差 ' + (+m[1] - s.gold) + ' 費拉');
    });
  };
  // 買背包：先確認（不能退）
  let pkOk = false;
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('[data-pkbuy]'); if (!b || pkOk || !hubOn() || !isShop()) return;
    const c = b.parentElement && b.parentElement.parentElement, name = c && c.querySelector('b') ? c.querySelector('b').textContent : '背包', m = c && c.textContent.match(/(\d+)\s*費拉/);
    e.preventDefault(); e.stopImmediatePropagation();
    confirmDo('買「' + name + '」？', (m ? '要 ' + m[1] + ' 費拉，' : '') + '買了不能退。', '買', () => { pkOk = true; try { b.click(); } finally { pkOk = false; } });
  }, true);

  const hub0 = R.hub;
  R.hub = (t, f) => { const r = hub0(t, f); try { build(); } catch (e) { console.warn('[hakuto]', e); } return r; };
  window.addEventListener('keydown', e => {
    if (!hubOn() || !isShop() || $('gh-confirm')) return;
    const m = $('hub-modal'); if (m && !m.hidden) return;
    const tg = e.target; if (tg && (/TEXTAREA|SELECT/.test(tg.tagName) || (tg.tagName === 'INPUT' && !/^(checkbox|radio|button)$/.test(tg.type)))) return;
    if (e.ctrlKey || e.altKey || e.metaKey || !/^[1-5]$/.test(e.key)) return;
    const b = document.querySelectorAll('.hk-root [data-hkt]')[+e.key - 1]; if (b) { e.preventDefault(); e.stopPropagation(); b.click(); }
  }, true);

  const css = document.createElement('style');
  css.textContent = [
    '#hub.hk-on .hub-body{background:radial-gradient(ellipse at 50% 0,rgba(140,110,200,.10),transparent 60%),repeating-linear-gradient(90deg,#16121A 0 120px,#181320 120px 121px)}',
    '.hk-board .gh-kamon{background:#6E4A9E}',
    '.hk-sum{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}',
    '.hk-pane .gh-card{border-top-color:#6E4A9E}',
    '#hub.hk-on .gh-tab.on{background:linear-gradient(180deg,#7A52A8,#4E3274)}',
    '#hub.hk-on .recipes{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}',
    '#hub.hk-on .recipe{padding:12px 14px;border-radius:2px;background:var(--gh-washi);color:var(--gh-sumi);border-top:6px solid #6E4A9E;box-shadow:0 3px 6px rgba(0,0,0,.4)}',
    '#hub.hk-on .recipe b{color:var(--gh-sumi)!important}#hub.hk-on .recipe small{color:#5A4E40}#hub.hk-on .recipe .hs-why{color:#B0301E}',
    '#hub.hk-on .recipe .btn{min-height:40px}',
    '.hk-bulk{display:flex;flex-wrap:wrap;gap:6px;margin-top:6px}.hk-bulk .mini,.hk-pane .mini{min-height:34px}',
    '#hub.hk-on .bomb-shop{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:10px}',
    '#hub.hk-on .pk-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px}',
    '#hub.hk-on .pk-list>*.hk-cur{box-shadow:0 0 0 2px #F0CF6A}',
    '.hk-diff{display:block;font-style:normal;font-size:12px;font-weight:700;color:#C8B88A;margin:4px 0}.hk-diff.up{color:#9AE08A}',
    '@media (max-width:720px){#hub.hk-on .recipes,#hub.hk-on .bomb-shop,#hub.hk-on .pk-list{grid-template-columns:1fr}}'
  ].join('\n');
  document.head.appendChild(css);
})(window.R);
