// 背包放不下就不能拿（2026-10-18 作者：倉庫大改第三階段；作者選「逐一檢查，放不下就不能拿」）
// - 商店、換東西的按鈕：按下去之前先看背包放不放得下（document 的 capture 階段先檢查，放不下就擋掉，錢不會被扣）。
//   規則在下面的 SHOP（按鈕 → 會拿到什麼、幾個）。裝備（黑市、當鋪贖回）先看背包還有沒有 3 格空位。
// - 打造、做飾品、拆解：R.craft／R.craftNamed／R.salvage 先看背包空位，不夠就不做。
// - 禮物（R.addGift：魚、糰子、茶……）：放不下就不拿，跳提示。
// - 新的裝備（買的、做的、獎勵、交易）：放進 R.S.stash 的時候自動放進背包；背包放不下的放進倉庫、跳提示（任務獎勵不會不見）。
//   （R.S.stash 換成會通知的陣列：誰 push 都看得到；遺跡裡不管，回來的時候 carry.js 會放進背包。）
// - 其他沒辦法先擋的（小遊戲的彩金、拆出來的素材……）：放進背包的數字，放不下的列在背包的「放不下」區；
//   背包還有放不下的東西時不能下遺跡（先放回倉庫或賣掉）。
// - 錢：wallet.js（背包放不下的錢存進勇者證）。
// 放在 index.html 最後面（R.startRun、R.addGift、R.craft 最外層）。
(function (R) {
  const S = () => R.S, W = () => R.W || {};
  const fits = (key, n) => !R.bagCanAdd || R.bagCanAdd(key, n);
  const nameOf = key => { const m = R.stackMeta && R.stackMeta(key); return m ? m.name : ''; };
  const gearRoom = () => !R.bagFreeCells || R.bagFreeCells() >= 3;
  // ---------- 商店按鈕：會拿到什麼 ----------
  const num = (el, re) => { const m = (el.textContent || '').match(re); return m ? +m[1] : 1; };
  const SHOP = [
    ['[data-buy]', el => { const k = String(el.dataset.buy).split(':')[0]; return k === 'hp' || k === 'mp' ? ['pot:' + k, 1] : null; }],
    ['[data-herb]', () => ['pot:hp', 1]],
    ['[data-mbuy]', el => { const [k, q] = String(el.dataset.mbuy).split(':'); return ['mat:' + k, +q || 1]; }],
    ['[data-bomb]', el => { const [id, m] = String(el.dataset.bomb).split(':'), T = R.BOMB_TYPES && R.BOMB_TYPES[id]; return T ? ['bomb:' + T.key, +m || 1] : null; }],
    ['[data-pb]', el => ['mat:parchment', +el.dataset.pb || 1]],
    ['[data-gb]', el => ['gift:' + el.dataset.gb, 1]],
    ['[data-plush]', el => ['gift:' + el.dataset.plush, 1]],
    ['[data-mb]', el => { const k = el.dataset.mb; return k === 'hood' ? null : k === 'potion' ? ['pot:hp', 1] : ['gift:' + k, 1]; }],
    ['#fm-buy', () => ['gift:fish', 1]],
    ['#sl-buy', el => ['medals', num(el, /＝\s*(\d+)/)]],
    ['#pc-buy', el => ['pachiBalls', num(el, /＝\s*(\d+)/)]],
    ['#cl-c1', () => ['clawCoins', 1]], ['#cl-c4', () => ['clawCoins', 4]],
    ['[data-bm],[data-bmb],[data-bmp],[data-pwr]', () => 'gear']
  ];
  document.addEventListener('click', e => {
    if (!R.S || !R.bagCanAdd || (W().run && !W().town)) return;   // 遺跡裡的商人照舊（第四階段再改）
    const t = e.target && e.target.closest ? e.target : null; if (!t) return;
    for (const [sel, f] of SHOP) {
      const el = t.closest(sel); if (!el || el.disabled) continue;
      const g = f(el); if (!g) return;
      if (g === 'gear' ? !gearRoom() : !fits(g[0], g[1])) { e.preventDefault(); e.stopImmediatePropagation(); R.bagFullMsg && R.bagFullMsg(g === 'gear' ? '裝備' : nameOf(g[0])); }
      return;
    }
  }, true);
  // ---------- 打造、做飾品、拆解 ----------
  const guard = (name, ok, what) => { const f = R[name]; if (f) R[name] = (...a) => { if (R.S && !(W().run && !W().town) && !ok(...a)) { R.bagFullMsg && R.bagFullMsg(what); return null; } return f(...a); }; };
  guard('craft', () => gearRoom(), '打造好的裝備');
  guard('craftNamed', () => gearRoom(), '做好的飾品');
  guard('salvage', () => !R.bagFreeCells || R.bagFreeCells() >= 2, '拆出來的素材');
  // ---------- 禮物 ----------
  const ag0 = R.addGift;
  if (ag0) R.addGift = (k, n) => { n = n || 1; if (R.S && R.bagCanAdd && !(W().run && !W().town) && !fits('gift:' + k, n)) { R.bagFullMsg && R.bagFullMsg(nameOf('gift:' + k)); return false; } return ag0(k, n); };
  // ---------- 新的裝備自動放進背包 ----------
  let off = 0;
  R.noBagRoute = f => { off++; try { return f(); } finally { off--; } };   // 搬家、放回之類自己會處理的時候不要自動放
  const route = L => {
    const s = S(); if (!s || off || (W().run && !W().town)) return;
    const eq = R.equippedIds ? R.equippedIds() : new Set(), have = new Set((s.stash || []).map(it => it.id)), miss = [];
    L.forEach(it => {
      if (!it || !have.has(it.id) || eq.has(it.id) || (R.inBag && R.inBag(it.id))) return;
      if (R.bagCanFitItem && R.bagCanFitItem(it)) { R.toBag(it.id); } else miss.push(it);
    });
    if (miss.length && R.toast) R.toast('背包放不下：' + miss.map(it => R.itemName(it)).join('、') + '，先放進倉庫了。', '#FF9A6A');
  };
  const hook = a => {
    if (!Array.isArray(a) || a.__bagHook) return a;
    Object.defineProperty(a, '__bagHook', { value: 1, enumerable: false });
    Object.defineProperty(a, 'push', { enumerable: false, configurable: true, value: function (...items) { const r = Array.prototype.push.apply(this, items); if (this === (R.S && R.S.__stashArr)) { try { route(items); } catch (e) { console.warn('[bagrules]', e); } } return r; } });
    return a;
  };
  const ensure = s => {
    if (!s || typeof s !== 'object' || s.__stashHook) return s;
    let arr = hook(Array.isArray(s.stash) ? s.stash : []);
    Object.defineProperty(s, '__stashHook', { value: 1, enumerable: false });
    Object.defineProperty(s, '__stashArr', { enumerable: false, configurable: true, get: () => arr });
    Object.defineProperty(s, 'stash', { enumerable: true, configurable: true, get: () => arr, set: v => { arr = hook(Array.isArray(v) ? v : []); } });
    return s;
  };
  const wrap = name => { const f = R[name]; if (f) R[name] = (...a) => ensure(f(...a)); };
  wrap('loadSlot'); wrap('freshSave');
  const sv0 = R.save; if (sv0) R.save = (...a) => { ensure(R.S); return sv0(...a); };
  ensure(R.S);
  R.stashHookEnsure = ensure;
  // ---------- 背包還有放不下的東西：不能下遺跡 ----------
  const sr0 = R.startRun;
  if (sr0) R.startRun = (...a) => {
    try {
      const id = String(a[0] || '');
      if (R.S && R.bagOverflow && !/train/.test(id) && R.bagOverflow() > 0) {
        if (R.toast) R.toast('背包裡有放不下的東西：先整理、放回倉庫或賣掉，才能下遺跡。', '#FF9A6A');
        return null;
      }
    } catch (e) { console.warn('[bagrules]', e); }
    return sr0(...a);
  };
})(window.R = window.R || {});
