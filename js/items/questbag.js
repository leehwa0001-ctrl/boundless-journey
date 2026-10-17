// 任務道具包（2026-10-17 作者：在背包內額外開一個任務道具包，只會裝入任務道具）
// - 任務道具放在 R.S.qitems：[{ id, n, day }]；種類寫在 R.QITEMS：{ id: { name, rarity, desc, note } }。
// - 不佔背包格子、不能賣、不能丟、不能交易、倒下也不會掉（存在 R.S，不在 run.bag）。
// - 看得到的地方：遺跡裡的背包（I）最下面、倉庫頁面最下面、「手上的委託」的隱藏任務表下面。
// - 其他檔案用：R.qItemAdd(id)、R.qItemHas(id)、R.qItemTake(id)、R.qItemBoxHtml()。
// 放在 raid.js、gearcmp.js（包 R.bagSheet）、tarkovstash.js、smithstash.js（包 R.hub）後面。
(function (R) {
  const S = () => R.S, $ = id => document.getElementById(id), esc = s => (R.esc ? R.esc(s) : String(s));
  R.QITEMS = R.QITEMS || {};
  const list = () => { const s = S(); if (!s) return []; s.qitems = s.qitems || []; return s.qitems; };
  R.qItemHas = id => list().some(q => q.id === id && (q.n || 1) > 0);
  R.qItemAdd = (id, quiet) => {
    const d = R.QITEMS[id], L = list(); if (!d) return false;
    const q = L.find(x => x.id === id); if (q) q.n = (q.n || 1) + 1; else L.push({ id, n: 1, day: (S() && S().day) || 0 });
    R.save && R.save();
    if (!quiet && R.toast) R.toast('獲得了「' + d.name + '」（放進任務道具包）', R.RARITY && R.RARITY[d.rarity || 0] ? R.RARITY[d.rarity || 0].color : '#C9A13A');
    return true;
  };
  R.qItemTake = id => { const L = list(), i = L.findIndex(x => x.id === id); if (i < 0) return false; L[i].n = (L[i].n || 1) - 1; if (L[i].n <= 0) L.splice(i, 1); R.save && R.save(); return true; };
  const col = d => (R.RARITY && R.RARITY[d.rarity || 0] ? R.RARITY[d.rarity || 0].color : '#C8B88A');
  const rname = d => (R.RARITY && R.RARITY[d.rarity || 0] ? R.RARITY[d.rarity || 0].name : '');
  R.qItemBoxHtml = () => {
    const L = list().filter(q => R.QITEMS[q.id]);
    return '<div class="qb-box"><h3>任務道具包（' + L.length + '）</h3>'
      + (L.length ? '<div class="qb-list">' + L.map(q => { const d = R.QITEMS[q.id]; return '<div class="qb-it" style="--c:' + col(d) + '"><b>' + esc(d.name) + (q.n > 1 ? ' ×' + q.n : '') + '</b><small>' + esc([rname(d), d.desc].filter(Boolean).join('・')) + '</small>' + (d.note ? '<small class="qb-note">' + esc(d.note) + '</small>' : '') + '</div>'; }).join('') + '</div>'
        : '<p class="note">任務道具會放在這裡（不佔背包格子、不能賣、不能丟）。</p>') + '</div>';
  };
  const css = document.createElement('style');
  css.textContent = '.qb-box{margin-top:10px}.qb-list{display:flex;flex-wrap:wrap;gap:8px}.qb-it{display:flex;flex-direction:column;gap:2px;min-width:180px;max-width:320px;padding:6px 10px;border-radius:6px;border:1px solid var(--c);background:rgba(0,0,0,.18)}'
    + '.qb-it b{color:var(--c)}.qb-it small{opacity:.85}.qb-it .qb-note{color:#E8C04A}';
  document.head.appendChild(css);
  const put = (root, before) => { if (!root || root.querySelector('.qb-box')) return; const d = document.createElement('div'); d.innerHTML = R.qItemBoxHtml(); const box = d.firstChild; if (before && before.parentNode) before.parentNode.insertBefore(box, before); else root.appendChild(box); };
  // 遺跡裡的背包：放在「關上」那一列前面
  const bs0 = R.bagSheet;
  if (bs0) R.bagSheet = (...a) => {
    const r = bs0(...a);
    try { const sh = $('r-sheet'), x = $('bag-x'); if (sh && x) put(sh, x.closest('.row')); } catch (e) { console.warn('[questbag]', e); }
    return r;
  };
  // 倉庫頁面：放在最下面
  const hub0 = R.hub;
  if (hub0) R.hub = (t, f) => {
    const r = hub0(t, f);
    try { const tb = document.querySelector('[data-htab][aria-selected="true"]'), body = $('hub-body'); if (tb && tb.dataset.htab === 'stash' && body) put(body); } catch (e) { console.warn('[questbag]', e); }
    return r;
  };
  // 「手上的委託」：隱藏任務表下面（hiddenquest.js 先放好表）
  const ql0 = R.questLog;
  if (ql0) R.questLog = (...a) => {
    const r = ql0(...a);
    try { const sh = $('r-sheet'), hq = sh && sh.querySelector('.hq-box'); if (hq && list().length) put(hq); } catch (e) { console.warn('[questbag]', e); }
    return r;
  };
})(window.R);
