// 2026-10-13 畫面上的按鍵提示跟著「按鍵設定」走（作者：職業鍵換了鍵位就不能顯示是 X 鍵，要顯示更改後的，其他鍵位也是）
// - 很多檔案把按鍵直接寫在字裡（「按住 X」「X：換成冰」「R／右鍵」「<kbd>G</kbd>」……）。這裡不去一個個改字串，
//   而是看著畫面上的文字：只要某個動作被換了鍵，就把那個預設鍵的字母換成新的鍵名。沒換過鍵的人完全不動。
// - 只換「單獨出現」的大寫字母／Tab／Shift／空白（前後不是英文、數字，後面不是「級」「～」），數字鍵只換 <kbd> 裡的。
// - 換鍵之後馬上重新整理（每 0.4 秒對一次設定）。手機（沒有鍵盤）不動。
// - R.keyLabel('reload') → 目前職業鍵的名字；R.keyText('按住 X') → 換好的字。
(function (R) {
  const DEF = { x: 'reload', r: 'skill1', f: 'auto', g: 'bomb', i: 'bag', c: 'order', t: 'race', h: 'hood', q: 'rotl', e: 'rotr', m: 'bigmap', tab: 'map', shift: 'dodge', '空白': 'use',
    1: 'hp', 2: 'mp', 3: 'skill2', 4: 'skill3', 5: 'skill4', 6: 'skill5' };
  const DEFCODE = { reload: 'KeyX', skill1: 'KeyR', auto: 'KeyF', bomb: 'KeyG', bag: 'KeyI', order: 'KeyC', race: 'KeyT', hood: 'KeyH', rotl: 'KeyQ', rotr: 'KeyE', bigmap: 'KeyM', map: 'Tab', dodge: 'ShiftLeft', use: 'Space', hp: 'Digit1', mp: 'Digit2', skill2: 'Digit3', skill3: 'Digit4', skill4: 'Digit5', skill5: 'Digit6' };
  const binds = () => (R.keyBinds ? R.keyBinds() : {});
  R.keyLabel = act => (R.keyName ? R.keyName(act) : '');
  let changed = {};   // 預設字（小寫）→ 新的名字
  const calc = () => { const b = binds(), o = {}; Object.keys(DEF).forEach(k => { const a = DEF[k]; if (b[a] && b[a] !== DEFCODE[a]) o[String(k).toLowerCase()] = R.keyLabel(a); }); return o; };
  const any = () => Object.keys(changed).length > 0;
  const RE = /(^|[^A-Za-z0-9_～~])(X|R|F|G|I|C|T|H|Q|E|M|Tab|TAB|Shift|SHIFT|空白)(?![A-Za-z0-9_]|\s*[級～~+＋])/g;
  const sub = (s, inKbd) => {
    if (!any()) return s;
    if (inKbd) { const t = s.trim().toLowerCase(); if (changed[t] != null) return s.replace(s.trim(), changed[t]); }
    return s.replace(RE, (m, pre, k) => { const n = changed[k.toLowerCase()]; return n != null ? pre + n : m; });
  };
  R.keyText = s => sub(String(s), false);
  const SKIP = new Set(['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'CODE']);
  const seen = new WeakMap();   // 文字節點 → { o: 原本的字, out: 換好的字 }
  // 2026-10-13 作者：「我說的是技能那些的，沒叫你介面也改」——只改技能、戰鬥、職業的提示（白名單），公會、鐵匠鋪、倉庫、商店、Esc 選單的分頁快捷鍵一律不動
  const SCOPE = '[id^="r-skill"],#core-g,#er-panel,#tu2-card,#sb-host,#sp-host,[data-keyhint]';
  const inRunNow = () => { const w = R.W; return !!(w && w.run && !w.town); };
  const inScope = p => !!(p.closest(SCOPE) || (inRunNow() && p.closest('#r-toast')));
  const skipNode = n => { const p = n.parentElement; return !p || SKIP.has(p.tagName) || !inScope(p) || p.closest('.keys,.keyrow,[data-nokeyhint]') || (p.tagName === 'KBD' && p.closest('[data-tact],[id^="r-skill"]')); };   // 快捷欄上的 kbd 由 keybinds.js 自己標
  const fix = n => {
    if (n.nodeType !== 3) return;
    let st = seen.get(n); const d = n.data;
    if (skipNode(n)) { if (st && d === st.out && st.o !== d) { n.data = st.o; st.out = st.o; } return; }   // 不在白名單：換回原本的字
    if (!st || d !== st.out) { st = { o: d, out: d }; seen.set(n, st); }
    const out = sub(st.o, n.parentElement.tagName === 'KBD');
    if (out !== d) { st.out = out; n.data = out; } else st.out = d;
  };
  const walk = root => { if (!root) return; if (root.nodeType === 3) return fix(root); const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) fix(n); };
  let mo = null;
  const observe = () => {
    if (mo) return; mo = new MutationObserver(list => { if (!any()) return; for (const m of list) { if (m.type === 'characterData') fix(m.target); else m.addedNodes.forEach(walk); } });
    mo.observe(document.body, { subtree: true, childList: true, characterData: true });
  };
  // 換鍵（或恢復預設）之後：把畫面上所有記得原文的字重新算一次
  const refresh = () => {
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) { const st = seen.get(n); if (st && n.data === st.out && st.o !== st.out) { n.data = st.o; st.out = st.o; } fix(n); }
  };
  let last = '';
  const poll = () => { if (R.touch) return; const s = JSON.stringify(binds()); if (s === last) return; last = s; changed = calc(); if (any()) observe(); refresh(); };
  const start = () => { poll(); setInterval(poll, 400); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  R.keyHintRefresh = () => { last = ''; poll(); };
  R._keyHintState = () => ({ changed, any: any() });
})(window.R);
