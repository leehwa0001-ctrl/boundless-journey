// 刪掉的武器種類（2026-10-14 作者：已經無用、廢除、舊制的武器代碼完全移除，避免數值衝突或堆疊）
// - 「雙槍（舊制）」dualpistol 整個刪掉（gearmore.js、guns1008.js、heldicon.js、sprites.js、balance20261006.js、items.js 都不再提到它）。
//   2026-10-08 起手槍 pistol 就是「雙槍」，舊制的那一把只是留給舊存檔用。
// - 舊存檔：身上、倉庫、任何地方的 dualpistol 換成 pistol（稀有度、詞綴、強化、附魔照舊，數值照現在的雙槍）；
//   武器熟練度 dualpistol 的點數併進 pistol（取兩者比較高的那個，不相加）。
// - 保險：R.weaponStats 碰到還沒換的（例如連線時舊版本的隊友丟過來的）也當場換掉。
// 放在所有包 R.migrate、R.weaponStats 的檔案後面（main.js 前面）。
(function (R) {
  const GONE = { dualpistol: 'pistol' };
  const fixItem = it => { if (it && it.kind === 'weapon' && GONE[it.base]) it.base = GONE[it.base]; };
  const walk = (o, seen) => {
    if (!o || typeof o !== 'object' || seen.has(o)) return; seen.add(o);
    if (o.kind === 'weapon' && typeof o.base === 'string') { fixItem(o); return; }
    (Array.isArray(o) ? o : Object.values(o)).forEach(v => walk(v, seen));
  };
  const fixProf = s => {
    const w = s && s.prof && s.prof.w; if (!w) return;
    Object.keys(GONE).forEach(k => { if (w[k] == null) return; const to = GONE[k]; w[to] = Math.max(w[to] || 0, w[k] || 0); delete w[k]; });
  };
  const mg0 = R.migrate;
  R.migrate = s => { s = mg0 ? mg0(s) : s; try { walk(s, new Set()); fixProf(s); } catch (e) { console.warn('[weaponprune]', e); } return s; };
  const ws0 = R.weaponStats;
  if (ws0) R.weaponStats = it => { fixItem(it); return ws0(it); };
})(window.R);
