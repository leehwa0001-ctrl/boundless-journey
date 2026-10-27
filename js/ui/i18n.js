// 英文、德文版（2026-10-27 作者：研究英文和德文版本）
// 遊戲裡的字直接寫在 436 個 .js 檔裡（約 29 萬個中文字），沒有翻譯表。要一次全部改成「查表」等於重寫整個遊戲，
// 所以先用「畫面上翻譯」：選了 English／Deutsch，就在字顯示出來的時候換掉（MutationObserver 看著整個畫面）。
// - 中文（預設）：這個檔什麼都不做，跟以前一模一樣。
// - 查法（tr）：整句對得上 → 用整句的翻譯；對不上 → 套句型（「鐵礦 0／4」「買 5」「（物品等級 4）」……，裡面的名詞再查一次）；
//   再對不上 → 用「・」「、」切開，每一段都查得到才換；還是不行就留中文（慢慢補字典）。
// - 字典在 i18n-en.js、i18n-de.js（R.I18N.en／R.I18N.de）：WORDS 是名詞、介面字，PATTERNS 是句型。
// - 畫在 canvas 上的字（3D 招牌、小地圖的字）、存檔裡的名字不換。
// - 換語言：標題畫面右下、暫停選單「設定 → 畫面」；換了重新載入一次（記在 localStorage 'tfl_lang'）。
(function (R) {
  const LANGS = [['zh', '中文'], ['en', 'English'], ['de', 'Deutsch']];
  const get = () => { try { return localStorage.getItem('tfl_lang') || 'zh'; } catch (e) { return 'zh'; } };
  const lang = /[?&]lang=(en|de|zh)/.test(location.search) ? RegExp.$1 : get();
  R.lang = lang;
  R.LANGS = LANGS;
  R.setLang = l => { try { localStorage.setItem('tfl_lang', l); } catch (e) { } location.reload(); };
  R.I18N = R.I18N || {};
  // 換語言的按鈕（標題畫面）
  const picker = () => {
    const t = document.getElementById('title'); if (!t || t.querySelector('.lang-pick')) return;
    const d = document.createElement('div'); d.className = 'lang-pick'; d.setAttribute('translate', 'no');
    d.innerHTML = LANGS.map(([k, n]) => '<button type="button" data-lang="' + k + '"' + (k === lang ? ' aria-pressed="true"' : '') + '>' + n + '</button>').join('');
    d.querySelectorAll('[data-lang]').forEach(b => { b.onclick = () => { if (b.dataset.lang !== lang) R.setLang(b.dataset.lang); }; });
    t.appendChild(d);
  };
  const css = document.createElement('style');
  css.textContent = '.lang-pick{position:absolute;right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom));display:flex;gap:4px;z-index:5}'
    + '.lang-pick button{background:rgba(20,16,24,.75);color:#D8CCB4;border:1px solid rgba(201,161,58,.35);border-radius:999px;padding:5px 11px;font-size:12px;font-weight:700;cursor:pointer}'
    + '.lang-pick button[aria-pressed="true"]{background:#C9A13A;color:#1A140C;border-color:#C9A13A}'
    + 'html[lang="en"] body,html[lang="de"] body{word-break:normal;overflow-wrap:break-word;hyphens:auto}'
    // 標題的大字是照中文排的（字距很寬）：英文、德文字距收窄、字小一點，不然一個字會被拆成兩行
    + 'html[lang="en"] #title .t-name,html[lang="de"] #title .t-name{font-size:clamp(34px,6.2vw,60px);letter-spacing:.02em;line-height:1.05}'
    + 'html[lang="en"] #title .t-name small,html[lang="de"] #title .t-name small{font-size:clamp(13px,1.6vw,17px);letter-spacing:.06em;margin-top:8px}';
  document.head.appendChild(css);
  const tryPick = () => { try { picker(); } catch (e) { } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryPick); else tryPick();
  setTimeout(tryPick, 1500);
  R.tr = s => s;
  if (lang === 'zh') return;

  // ---------- 翻譯 ----------
  document.documentElement.lang = lang;
  const D = () => R.I18N[lang] || { WORDS: {}, PATTERNS: [] };
  const CJK = /[㐀-鿿！-～]/;
  const cache = new Map(), subCache = new Map();
  const tr = s => {
    if (cache.has(s)) return cache.get(s);
    const out = tr0(s, 0); cache.set(s, out); return out;
  };
  const tr0 = (s, depth) => {
    if (!s || !CJK.test(s)) return s;
    const W = D().WORDS;
    if (Object.prototype.hasOwnProperty.call(W, s)) return W[s];
    if (depth > 4) return null;
    // 子句也記起來（2026-10-27：句型多了以後，同一段會被不同句型一再拆開來查，不記的話會卡住整個畫面）
    const sub = x => { if (x == null || x === '') return x; const key = (depth + 1) + '\u0001' + x; if (subCache.has(key)) return subCache.get(key); const t = tr0(x, depth + 1); subCache.set(key, t); return t; };
    for (const [re, fn] of D().PATTERNS) {
      const m = s.match(re); if (!m) continue;
      const r = fn(m, sub); if (r != null && !CJK.test(r)) return r;
    }
    // 句尾的「。」：先翻前面，再補句點（2026-10-27 第二階段：技能、被動的說明多半是這樣）
    if (/。$/.test(s)) { const t = sub(s.slice(0, -1)); if (t != null) return t + '.'; }
    for (const [sep, join] of [['。', '. '], ['；', '; '], ['・', ' · '], ['、', ', '], ['，', ', '], ['：', ': ']]) {
      if (s.indexOf(sep) < 0) continue;
      const parts = s.split(sep), outs = parts.map(p => p.trim() ? sub(p.trim()) : '');
      // 英文：逗號、分號後面那一段的開頭改小寫（HP、MP 這種縮寫不動）；德文的名詞本來就大寫，不改
      if (outs.every(o => o != null)) return outs.map((o, i) => (lang === 'en' && i && (join === ', ' || join === '; ') ? o.replace(/^([A-Z])(?=[a-z])/, c => c.toLowerCase()) : o)).join(join).replace(/^ · | · $/g, '');
    }
    return null;
  };
  R.tr = s => { const t = tr(String(s).trim()); return t == null ? s : t; };
  const orig = new WeakMap();
  const doText = n => {
    const v = n.nodeValue; if (!v || !CJK.test(v)) return;
    const k = v.trim(); const t = tr(k); if (t == null) return;
    const nv = v.replace(k, t); if (nv !== v) { orig.set(n, v); n.nodeValue = nv; }
  };
  const ATTRS = ['title', 'placeholder', 'aria-label', 'alt'];
  const doAttrs = el => { for (const a of ATTRS) { const v = el.getAttribute && el.getAttribute(a); if (v && CJK.test(v)) { const t = tr(v.trim()); if (t != null) el.setAttribute(a, t); } } };
  const SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, CANVAS: 1 };
  const walk = root => {
    if (root.nodeType === 3) { if (root.parentNode && !SKIP[root.parentNode.nodeName]) doText(root); return; }
    if (root.nodeType !== 1 || SKIP[root.nodeName] || (root.closest && root.closest('[translate="no"]'))) return;
    doAttrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
    let n; while ((n = w.nextNode())) { if (n.nodeType === 3) { if (!SKIP[n.parentNode.nodeName]) doText(n); } else doAttrs(n); }
  };
  let queue = new Set(), sched = false;
  const flush = () => { sched = false; const q = queue; queue = new Set(); obs.disconnect(); try { q.forEach(walk); } finally { obs.observe(document.body, OPT); } };
  const OPT = { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS };
  const obs = new MutationObserver(ms => {
    for (const m of ms) {
      if (m.type === 'childList') m.addedNodes.forEach(n => queue.add(n));
      else if (m.type === 'characterData') queue.add(m.target);
      else queue.add(m.target);
    }
    if (!sched) { sched = true; queueMicrotask(flush); }
  });
  const start = () => { walk(document.body); obs.observe(document.body, OPT); document.title = R.tr(document.title); };
  if (document.body) start(); else document.addEventListener('DOMContentLoaded', start);
  // 遊戲直接跳出來的短訊息（R.say、R.toast）也查一下
  const wrapMsg = k => { const f = R[k]; if (typeof f !== 'function' || f.__tr) return; R[k] = function (m, ...a) { return f.call(this, typeof m === 'string' ? R.tr(m) : m, ...a); }; R[k].__tr = 1; };
  addEventListener('load', () => { wrapMsg('say'); wrapMsg('toast'); });
  // 開發用：還沒翻到的字（R.i18nMissing() 列出畫面上還是中文的字）
  R.i18nMissing = () => { const s = new Set(); const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { const v = n.nodeValue.trim(); if (v && CJK.test(v) && !SKIP[n.parentNode.nodeName]) s.add(v); } return [...s]; };
})(window.R = window.R || {});
