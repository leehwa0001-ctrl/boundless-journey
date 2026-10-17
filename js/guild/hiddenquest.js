// 隱藏任務（2026-10-16 作者：在遊戲中做一個隱藏任務表單，現在不用填東西，歸類在任務一類）
// - 「手上的委託」（城裡選單、L 鍵，R.questLog）最下面多一個「隱藏任務」：一張表（任務、線索、狀態）。
// - 任務寫在 R.HIDDEN_QUESTS（現在是空的）：{ id, name, hint, reward }。hint＝還沒完成時給的線索，reward＝寫給玩家看的報酬。
// - 進度存在 R.S.hiddenQ：{ id: { found: 第幾天, done: 第幾天 } }。還沒發現的任務不列出來（表上只寫「還有 N 件沒發現」）。
// - 之後做任務的時候：觸發條件的地方呼叫 R.hiddenFound(id)（發現）、R.hiddenDone(id)（完成）。
// - 分章的任務（2026-10-17）：q.chapters＝[{ name, intro, goal }]（goal 可以是函式，回傳現在的進度文字），進度的 ch＝第幾章（0 起）。
//   R.hiddenChapter(id, n) 換到第 n 章；表上寫這一章的名字、任務介紹、任務內容。
// 放在 jobs.js、turnin.js、errands.js 後面（都包住 R.questLog）。
(function (R) {
  const S = () => R.S, $ = id => document.getElementById(id), esc = s => (R.esc ? R.esc(s) : String(s));
  R.HIDDEN_QUESTS = R.HIDDEN_QUESTS || [];
  const st = () => { const s = S(); if (!s) return {}; s.hiddenQ = s.hiddenQ || {}; return s.hiddenQ; };
  const byId = id => R.HIDDEN_QUESTS.find(q => q.id === id);
  R.hiddenFound = id => {
    const q = byId(id), m = st(); if (!q || m[id]) return false;
    m[id] = { found: (S() && S().day) || 0 }; R.save && R.save();
    R.toast && R.toast('發現了隱藏任務「' + q.name + '」。', '#C9A13A');
    return true;
  };
  R.hiddenDone = id => {
    const q = byId(id), m = st(); if (!q || (m[id] && m[id].done != null)) return false;
    m[id] = Object.assign(m[id] || { found: (S() && S().day) || 0 }, { done: (S() && S().day) || 0 }); R.save && R.save();
    R.toast && R.toast('完成了隱藏任務「' + q.name + '」。', '#E8C04A');
    return true;
  };
  R.hiddenChapter = (id, n) => {
    const q = byId(id), m = st(); if (!q || !q.chapters || !q.chapters[n] || !m[id] || m[id].done != null) return false;
    m[id].ch = n; R.save && R.save();
    R.toast && R.toast('隱藏任務更新：「' + q.chapters[n].name + '」', '#C9A13A');
    return true;
  };
  R.hiddenState = id => st()[id] || null;
  const chOf = (q, p) => (q.chapters ? q.chapters[Math.max(0, Math.min(q.chapters.length - 1, p.ch || 0))] : null);
  const css = document.createElement('style');
  css.textContent = '.hq-box{margin-top:10px}.hq-tab{width:100%;border-collapse:collapse;font-size:13px}.hq-tab th,.hq-tab td{border-bottom:1px solid #352E42;padding:4px 6px;text-align:left;vertical-align:top}'
    + '.hq-tab th{color:#C9B27A;font-weight:600;white-space:nowrap}.hq-ok{color:#8FD08A}.hq-now{color:#E8C04A}';
  document.head.appendChild(css);
  const table = () => {
    const m = st(), list = R.HIDDEN_QUESTS, seen = list.filter(q => m[q.id]), hidden = list.length - seen.length;
    const rows = seen.map(q => { const p = m[q.id], done = p.done != null, c = !done && chOf(q, p), goal = c && (typeof c.goal === 'function' ? c.goal() : c.goal);
      const info = done ? esc(q.reward ? '報酬：' + q.reward : '—') : c ? esc('任務介紹：' + (c.intro || '—')) + '<br>' + esc('任務內容：' + (goal || '—')).replace(/\n/g, '<br>') : esc(q.hint || '—');
      return '<tr><td><b>' + esc(c ? c.name : q.name) + '</b></td><td>' + info + '</td><td class="' + (done ? 'hq-ok' : 'hq-now') + '">' + (done ? '完成' : '進行中') + '</td></tr>'; }).join('');
    return '<h3>隱藏任務（' + seen.filter(q => m[q.id].done != null).length + '／' + list.length + '）</h3>'
      + '<table class="hq-tab"><thead><tr><th>任務</th><th>線索／報酬</th><th>狀態</th></tr></thead><tbody>'
      + (rows || '<tr><td colspan="3" class="note">' + (list.length ? '還沒有發現任何隱藏任務。' : '目前還沒有隱藏任務。') + '</td></tr>') + '</tbody></table>'
      + (seen.length && hidden > 0 ? '<p class="note">還有 ' + hidden + ' 件沒發現。</p>' : '');
  };
  const ql0 = R.questLog;
  if (ql0) R.questLog = (...a) => {
    const r = ql0(...a);
    try {
      const sh = $('r-sheet');
      if (sh && !sh.querySelector('.hq-box')) {
        const d = document.createElement('div'); d.className = 'hq-box'; d.innerHTML = table();
        const btn = $('ql-x'), row = btn && btn.closest('.row');
        if (row && row.parentNode) row.parentNode.insertBefore(d, row); else sh.appendChild(d);
      }
    } catch (e) { console.warn('[hiddenquest]', e); }
    return r;
  };
})(window.R);
