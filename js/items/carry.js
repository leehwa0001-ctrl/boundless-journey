// 背包跟著角色走（2026-10-18 作者：倉庫與背包大改第二階段；規則見交接.md 第二節第 9 項）
// - 背包裡的裝備：R.S.bagIds（裝備的 id；裝備本身照舊在 R.S.stash）；位置記在倉庫格的 R.S.tg.pos（g:'bag'）。
// - 背包裡會疊的東西＝原本的數字（R.S.gold、R.S.mats……），倉庫裡的在 R.S.vault（stacks.js）。
// - 下遺跡：背包裡的裝備、素材帶進去（佔遺跡背包的格子）；回來的時候背包裡的東西（帶去的＋撿到的）留在背包，不再直接送進倉庫。
//   第四階段：錢（錢包＋這趟撿到的，一格 1000）、藥水、炸彈、卷軸、禮物……也佔遺跡背包的格子（R.carryCells，raid.js 算空位時加進去）；
//   倒下：背包裡的東西全部留在遺跡，錢包只掉 5％。
// - 舊存檔第一次（R.S.inv2）：原本的東西全部放進倉庫，背包留 1000 費拉、回復藥和魔力藥各一格（10 瓶），不然一出門什麼都買不了。
// 放在 raid.js、stacks.js 後面、tarkovstash.js 前面。
(function (R) {
  const S = () => R.S, W = () => R.W;
  const ids = () => { const s = S(); if (!Array.isArray(s.bagIds)) s.bagIds = []; return s.bagIds; };
  R.bagIds = ids;
  R.inBag = id => ids().some(x => String(x) === String(id));
  R.toBag = id => { if (!R.inBag(id)) ids().push(id); };
  R.fromBag = id => { const s = S(); s.bagIds = ids().filter(x => String(x) !== String(id)); };
  // 背包裡的裝備（沒穿在身上、還在 R.S.stash 裡的）
  R.bagGear = () => { const eq = R.equippedIds ? R.equippedIds() : new Set(), set = new Set(ids().map(String)); return (S().stash || []).filter(it => set.has(String(it.id)) && !eq.has(it.id)); };
  // ---------- 舊存檔 ----------
  const migrate = (s0) => {
    const s = s0 || S(); if (!s || s.inv2) return;
    const keep0 = R.S; R.S = s; try { migrate1(s); } finally { R.S = keep0; }
  };
  const migrate1 = s => {
    s.vault = s.vault || {}; s.bagIds = [];
    const keep = { gold: 1000, 'pot:hp': 10, 'pot:mp': 10 };
    R.stackList('bag').map(x => x.key).filter((k, i, a) => a.indexOf(k) === i).forEach(k => {
      const n = R.stackCount(k, 'bag'), stay = Math.min(n, keep[k] || 0);
      if (n - stay > 0) { R.stackAdd(k, 'bag', -(n - stay)); R.stackAdd(k, 'stash', n - stay); }
    });
    s.inv2 = 1;
  };
  R.carryMigrate = migrate;
  const ls0 = R.loadSlot; if (ls0) R.loadSlot = (...a) => { const r = ls0(...a); try { migrate(r); } catch (e) { console.warn('[carry]', e); } return r; };
  const fs0 = R.freshSave; if (fs0) R.freshSave = (...a) => { const s = fs0(...a); s.inv2 = 1; s.vault = s.vault || {}; s.bagIds = []; return s; };   // 新的存檔：東西本來就在背包
  // ---------- 下遺跡：背包裡的裝備、素材帶進去 ----------
  // 帶進去的記在 R.S.carry（存檔裡）：回來（R.extract）、倒下（R.onPlayerDown）就清掉；
  // 用別的方式離開的（練習場、存讀檔……）回到城裡時照原樣放回背包，不會不見。
  const sr0 = R.startRun;
  R.startRun = (...a) => {
    const r = sr0(...a);
    try {
      const run = W().run, s = S(); if (!run || run.carried) return r;
      run.carried = true; migrate(); restore();
      const gear = R.bagGear(), pos = (s.tg && s.tg.pos) || {}, mats = {};
      if (gear.length) {
        s.stash = s.stash.filter(it => !gear.includes(it));
        run.bag = (run.bag || []).concat(gear);
        const P = R.PACKS && R.PACKS[run.packId], at = new Map(); let ok = !!P;
        if (P) gear.forEach(it => { const p = pos[it.id]; if (p && p.g === 'bag') at.set(it, { x: p.x, y: p.y, r: p.r || 0 }); else ok = false; });
        run.grid = ok ? { w: P.w, h: P.h, at } : null;   // 有沒放好的，讓 raid.js 自己重排
      }
      Object.keys(s.mats || {}).forEach(k => { const n = s.mats[k] || 0; if (n > 0) { run.mats[k] = (run.mats[k] || 0) + n; mats[k] = n; s.mats[k] = 0; } });   // 素材佔遺跡背包的格子
      s.carry = { items: gear, mats };
      s.bagIds = [];
    } catch (e) { console.warn('[carry]', e); }
    return r;
  };
  // 沒有好好回來也沒有倒下（練習場、讀檔……）：放回背包
  const restore = () => {
    const s = S(); if (!s || !s.carry) return;
    const c = s.carry; s.carry = null;
    const have = new Set((s.stash || []).map(it => String(it.id)));
    const put = () => (c.items || []).forEach(it => { if (!have.has(String(it.id))) s.stash.push(it); R.toBag(it.id); });
    if (R.noBagRoute) R.noBagRoute(put); else put();
    Object.keys(c.mats || {}).forEach(k => { s.mats[k] = (s.mats[k] || 0) + c.mats[k]; });
  };
  const et0 = R.enterTown; if (et0) R.enterTown = (...a) => { try { restore(); } catch (e) { console.warn('[carry]', e); } return et0(...a); };
  // 倒下（2026-10-18 第四階段）：帶進去的東西留在遺跡——背包裡的裝備、素材（raid.js 原本就會丟）、藥水、炸彈、卷軸、禮物……全部；錢包只掉 5％
  const pd0 = R.onPlayerDown; if (pd0) R.onPlayerDown = (...a) => {
    const s = S(), run = W().run;
    const safe = run && !(run.site && run.site.kind === 'ruin' && run.site.id !== 'kanko' && run.grade && run.grade.id !== 'hamilia');   // 哈米莉亞級、觀光、狩獵場倒下不會掉（跟 raid.js 一樣）：帶進去的回城時放回背包
    if (s && run && !run.done && !safe) {
      s.carry = null;
      try {
        R.stackList('bag').map(x => x.key).filter((k, i, L) => L.indexOf(k) === i && k !== 'gold').forEach(k => R.stackAdd(k, 'bag', -R.stackCount(k, 'bag')));
        const lost = Math.floor((s.wallet || 0) * 0.05); s.wallet = (s.wallet || 0) - lost; run.walletLost = lost;
        setTimeout(() => { if (R.toast) R.toast('背包裡的東西留在遺跡了' + (lost ? '；錢包掉了 ' + lost.toLocaleString('zh-TW') + ' 費拉' : '') + '。', '#FF9A6A'); }, 1600);
      } catch (e) { console.warn('[carry]', e); }
    }
    return pd0(...a);
  };
  // ---------- 遺跡背包裡帶著的東西（第四階段）：錢（錢包＋這趟撿到的）、藥水、炸彈……一疊佔一格 ----------
  const carried = () => {
    const s = S(), run = W().run; if (!s || !run) return [];
    const L = [], gm = R.stackMeta && R.stackMeta('gold'), gold = (s.wallet || 0) + Math.round(run.gold || 0);
    if (gm) for (let left = gold; left > 0; left -= gm.per) L.push(Object.assign({ key: 'gold', n: Math.min(gm.per, left) }, gm));
    (R.stackList ? R.stackList('bag') : []).forEach(x => { if (x.key !== 'gold' && x.cat !== 'mat') L.push(x); });
    return L;
  };
  R.carryStacks = carried;
  R.carryCells = extra => {
    const s = S(), run = W().run; if (!s || !run) return 0;
    if (!extra) return carried().length;
    const per = (R.stackMeta && R.stackMeta(extra.k) || {}).per || 1, cur = extra.k === 'gold' ? (s.wallet || 0) + Math.round(run.gold || 0) : R.stackCount(extra.k, 'bag');
    return carried().length + Math.ceil((cur + extra.n) / per) - Math.ceil(cur / per);
  };
  // 遺跡裡加東西（商人）：放不放得下
  R.raidCanAdd = (key, n) => { const run = W().run; if (!run || !R.raidFreeCells) return true; const per = (R.stackMeta && R.stackMeta(key) || {}).per || 1, cur = key === 'gold' ? (S().wallet || 0) + Math.round(run.gold || 0) : R.stackCount(key, 'bag'); return Math.ceil((cur + n) / per) - Math.ceil(cur / per) <= R.raidFreeCells(); };
  // ---------- 回來：背包裡的東西留在背包 ----------
  const ex0 = R.extract;
  R.extract = (...a) => {
    const run = W().run, at = run && run.grid && run.grid.at, keep = run && !run.done ? (run.bag || []).map(it => [it, at && at.get(it)]) : null;
    const r = ex0(...a);
    try {
      if (keep) {
        const s = S(), g = s.tg = s.tg || {}; g.pos = g.pos || {}; s.carry = null;
        keep.forEach(([it, p]) => { R.toBag(it.id); if (p) g.pos[it.id] = { g: 'bag', x: p.x, y: p.y, r: p.r || 0 }; else delete g.pos[it.id]; });
      }
    } catch (e) { console.warn('[carry]', e); }
    return r;
  };
})(window.R = window.R || {});
