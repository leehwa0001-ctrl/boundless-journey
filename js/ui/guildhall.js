// 公會大廳的介面重做（2026-10-13 作者：公會的介面不方便，改成方便的、更像公會再帶點日式風格，能加的人性化都加）
// 只改畫面，不動遊戲邏輯：其他檔案照舊把各自的區塊（勇者證、委託板、階位、序號……）塞進公會頁面，
// 這個檔案包在 R.hub 最外面，把那些區塊照標題分到「暖簾」分頁裡，再加上：
// - 上方常駐的狀態列：段位與升階進度條、手上的委託（一鍵繳交／放棄）、委託板件數、錢
// - 遺跡委託：和紙委託單、分級篩選、排序、搜尋、顯示未開放（附原因）、層數／討伐數／時限預覽、段位不符的標示
// - 放棄委託改用公會風格的確認視窗；加注條款的總倍率常駐在下方，可一鍵全部不加
// - 快捷鍵：1～7 換分頁、/ 搜尋、Esc 關視窗；分頁、篩選、排序都記住（localStorage）
// 要放在所有包 R.hub 的檔案後面（main.js 前面）。
(function (R) {
  const $ = id => document.getElementById(id), esc = s => R.esc(s);
  const KEY = 'tfl_guildui';
  const ui = (() => { try { return Object.assign({ tab: 'quest', grade: 'all', sort: 'def', q: '', locked: 0, ok: 0 }, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch (e) { return { tab: 'quest', grade: 'all', sort: 'def', q: '', locked: 0 }; } })();
  const keep = () => { try { localStorage.setItem(KEY, JSON.stringify(ui)); } catch (e) { } };
  // 分頁：[id, 名字, 標題的開頭]
  const TABS = [
    ['quest', '委託', /^(遺跡委託|手上的委託|委託板|特別討伐|狩獵)/],
    ['card', '勇者證', /^(勇者證|公會階位|任務成績|稱號|熟練度|技能點|被動|轉職)/],
    ['party', '隊伍', /^(同行的勇者|多人連線|隊伍|交易|友傷)/],
    ['cls', '武器登記', /^(武器登記|職業|二次轉職)/],
    ['sell', '收購', /^(撿到的勇者證|素材收購|手邊的素材)/],
    ['redeem', '兌換', /^(序號兌換|種族|抽選|自選)/],
    ['etc', '其他', null]
  ];
  const tabOf = t => { for (const [id, , re] of TABS) if (re && re.test(t)) return id; return 'etc'; };
  const isGuild = () => { const b = document.querySelector('[data-htab="guild"]'); return b && b.getAttribute('aria-selected') === 'true'; };
  const hubOn = () => { const h = $('hub'); return h && !h.hidden; };

  // ---------- 確認視窗 ----------
  R.ghConfirm = (title, text, yes, onYes) => {
    let d = $('gh-confirm'); if (d) d.remove();
    d = document.createElement('div'); d.id = 'gh-confirm'; d.className = 'gh-cf';
    d.innerHTML = '<div class="gh-cf-card" role="alertdialog" aria-modal="true"><h3>' + esc(title) + '</h3><p>' + esc(text) + '</p><div class="row"><button type="button" class="btn red" id="gh-cf-yes">' + esc(yes) + '</button><button type="button" class="btn" id="gh-cf-no">取消（Esc）</button></div></div>';
    document.body.appendChild(d);
    const close = () => d.remove();
    d.querySelector('#gh-cf-no').onclick = close; d.onclick = e => { if (e.target === d) close(); };
    d.querySelector('#gh-cf-yes').onclick = () => { close(); onYes(); };
    setTimeout(() => d.querySelector('#gh-cf-no').focus(), 0);
  };
  // 換遺跡時「放棄手上的委託」原本沒有確認：先問一次
  let dropOk = false;
  document.addEventListener('click', e => {
    const b = e.target && e.target.closest && e.target.closest('#tk-drop'); if (!b || dropOk) return;
    e.preventDefault(); e.stopImmediatePropagation();
    const h = R.S && R.S.heldTask;
    R.ghConfirm('放棄手上的委託？', '「' + (h ? h.site : '') + '」的委託會記為失敗，扣住的報酬' + (h && h.pay ? ' ' + h.pay + ' 費拉' : '') + '也拿不到。', '放棄並接這張', () => { dropOk = true; try { b.click(); } finally { dropOk = false; } });
  }, true);

  // ---------- 把頁面分塊 ----------
  const split = body => {
    const blocks = [], head = [];
    const sec = body.querySelector('section.panel-doc');
    const tops = [];
    [...body.children].forEach(c => { if (c === sec) tops.push(...sec.children); else tops.push(c); });
    let cur = null;
    tops.forEach(el => {
      if (el.tagName === 'H3') { cur = { title: el.textContent.trim(), els: [el] }; blocks.push(cur); return; }
      const h3 = el.querySelector && el.querySelector('h3');
      if (h3) { cur = null; blocks.push({ title: h3.textContent.trim(), els: [el] }); return; }
      if (el.tagName === 'H2' && !blocks.length) { head.push(el); return; }
      if (cur) cur.els.push(el); else if (!blocks.length) head.push(el); else blocks[blocks.length - 1].els.push(el);
    });
    return { head, blocks, sec };
  };

  // ---------- 遺跡委託：工具列、委託單 ----------
  const GORD = () => (R.GRADES || []).map(g => g.id);
  const siteOf = id => (R.SITES || []).find(s => s.id === id);
  const specOf = s => { try { return R.taskSpec ? R.taskSpec(s) : null; } catch (e) { return null; } };
  const floorsOf = s => { try { return R.floorsFor ? R.floorsFor(s) : (specOf(s) || {}).floors; } catch (e) { return 0; } };
  const lockWhy = s => {
    const g = R.gradeById(s.grade);
    if (s.grade === 'kaso') return '需要卡索級的特別授權';
    if (g && g.unlock) { const u = R.gradeById(g.unlock); return '先走完一座' + (u ? u.name : '') + '遺跡'; }
    return '還沒開放';
  };
  const slipInfo = (s, card) => {
    const sp = s.id === 'kanko' ? null : specOf(s), g = R.gradeById(s.grade), fl = floorsOf(s), held = R.S.heldTask;
    if (card.querySelector('.gh-meta')) return;
    const m = document.createElement('div'); m.className = 'gh-meta';
    m.innerHTML = (fl ? '<span title="遺跡的層數">⛩ ' + fl + ' 層</span>' : '')
      + (sp && !sp.lines ? '<span title="委託內容">' + (sp.kind === 'patrol' ? '巡查到底' : '討伐 ' + sp.need + ' 隻') + '</span><span title="時限：超過每小時扣 3% 的效率分">⌛ ' + sp.limitH + ' 小時</span>' : '')
      + (g && g.loot != null ? '<span title="寶箱等級">寶 ' + '★'.repeat(g.loot + 1) + '</span>' : '');
    const btn = card.querySelector('[data-go]'); card.insertBefore(m, btn || null);
    if (sp && sp.blocked) { card.classList.add('gh-blocked'); const t = document.createElement('em'); t.className = 'gh-why'; t.textContent = '段位不符：只能不接委託下去'; t.title = sp.blocked; card.insertBefore(t, btn || null); if (btn) btn.title = sp.blocked; }
    if (held && held.siteId === s.id) { card.classList.add('gh-held'); const st = document.createElement('i'); st.className = 'gh-hanko'; st.textContent = '受領'; st.title = '手上的委託：' + (R.heldLine ? R.heldLine(held) : ''); card.appendChild(st); if (btn) btn.textContent = '繼續委託'; }
  };
  const questTools = blk => {
    const wrap = blk.els.map(e => e.classList && e.classList.contains('quests') ? e : e.querySelector && e.querySelector('.quests')).find(Boolean); if (!wrap) return;
    const cards = [...wrap.querySelectorAll('.quest')];
    const ruins = [];
    cards.forEach((c, i) => { const b = c.querySelector('[data-go]'), s = b && siteOf(b.dataset.go); c.dataset.i = i; if (!c.hasAttribute('tabindex')) c.tabIndex = 0; if (s && s.kind === 'ruin') { c.dataset.g = s.grade; c.dataset.n = s.name; c.dataset.f = floorsOf(s) || 0; slipInfo(s, c); ruins.push(c); } else { c.dataset.g = 'other'; c.dataset.n = c.textContent; } });
    // 未開放的遺跡（看得到原因）
    const shown = new Set(cards.map(c => { const b = c.querySelector('[data-go]'); return b && b.dataset.go; }));
    const locked = (R.SITES || []).filter(s => s.kind === 'ruin' && !shown.has(s.id) && s.status !== 'open');
    locked.forEach(s => {
      const g = R.gradeById(s.grade), c = document.createElement('div'); c.className = 'quest gh-lock'; c.tabIndex = 0; c.style.setProperty('--c', (R.GRADE_COLOR || {})[s.grade] || '#777');
      c.dataset.g = s.grade; c.dataset.n = s.name; c.dataset.f = floorsOf(s) || 0; c.dataset.i = 900;
      c.innerHTML = '<b>' + esc(s.name) + '</b><small>' + esc(g ? g.name : '') + (R.TYPES && R.TYPES[s.type] ? '・' + esc(R.TYPES[s.type].name) : '') + '</small><em class="gh-why">🔒 ' + esc(lockWhy(s)) + '</em><button type="button" class="btn" disabled>未開放</button>';
      wrap.insertBefore(c, wrap.querySelector('[data-map]'));
    });
    const grades = GORD().filter(g => cards.concat([...wrap.querySelectorAll('.gh-lock')]).some(c => c.dataset.g === g));
    const bar = document.createElement('div'); bar.className = 'gh-tools';
    bar.innerHTML = '<div class="gh-chips" role="group" aria-label="分級">' + [['all', '全部']].concat(grades.map(g => [g, (R.gradeById(g) || {}).name || g])).map(([k, n]) => '<button type="button" class="gh-chip' + (ui.grade === k ? ' on' : '') + '" data-ghg="' + k + '"' + (k !== 'all' ? ' style="--c:' + ((R.GRADE_COLOR || {})[k] || '#888') + '"' : '') + '>' + esc(n) + '</button>').join('') + '</div>'
      + '<div class="gh-tr"><input type="search" id="gh-q" placeholder="搜尋遺跡（/）" value="' + esc(ui.q) + '"><select id="gh-sort" title="排序"><option value="def">預設順序</option><option value="gup">分級：低→高</option><option value="gdn">分級：高→低</option><option value="fup">層數：少→多</option><option value="fdn">層數：多→少</option><option value="name">名稱</option></select>'
      + '<label class="gh-ck" title="只列出你的段位接得了的委託"><input type="checkbox" id="gh-ok"' + (ui.ok ? ' checked' : '') + '> 只看能接的</label><label class="gh-ck" title="也列出還不能去的遺跡，看要怎麼開放"><input type="checkbox" id="gh-lk"' + (ui.locked ? ' checked' : '') + '> 顯示未開放</label><span class="gh-cnt" id="gh-cnt"></span></div>';
    wrap.before(bar);
    bar.querySelector('#gh-sort').value = ui.sort;
    const apply = () => {
      const all = [...wrap.querySelectorAll('.quest')], q = ui.q.trim(), go = GORD();
      let n = 0;
      all.forEach(c => { const lk = c.classList.contains('gh-lock'); const bl = c.classList.contains('gh-blocked'); const vis = (!lk || ui.locked) && (!ui.ok || !bl && !lk) && (ui.grade === 'all' || c.dataset.g === ui.grade || c.dataset.g === 'other' && ui.grade === 'all') && (!q || (c.dataset.n || '').includes(q)); c.hidden = !vis; if (vis && !lk && !bl) n++; });
      const gi = c => { const i = go.indexOf(c.dataset.g); return i < 0 ? 99 : i; };
      const cmp = { def: (a, b) => a.dataset.i - b.dataset.i, gup: (a, b) => gi(a) - gi(b) || a.dataset.i - b.dataset.i, gdn: (a, b) => gi(b) - gi(a) || a.dataset.i - b.dataset.i, fup: (a, b) => a.dataset.f - b.dataset.f, fdn: (a, b) => b.dataset.f - a.dataset.f, name: (a, b) => (a.dataset.n || '').localeCompare(b.dataset.n || '', 'zh-Hant') }[ui.sort] || (() => 0);
      const mapBtn = wrap.querySelector('[data-map]');
      all.sort(cmp).forEach(c => wrap.insertBefore(c, mapBtn || null));
      const cnt = bar.querySelector('#gh-cnt'); cnt.textContent = '可接 ' + n + ' 件';
      bar.querySelectorAll('[data-ghg]').forEach(b => b.classList.toggle('on', b.dataset.ghg === ui.grade));
      // 2026-10-27：清單空了要說為什麼（記住的篩選是「克森特級」、新人什麼都看不到），附一顆按鈕回到全部
      let none = wrap.querySelector('.gh-none'); if (none) none.remove();
      if (!all.some(c => !c.hidden)) {
        const gname = ui.grade === 'all' ? '' : ((R.gradeById(ui.grade) || {}).name || ui.grade), hid = all.filter(c => c.classList.contains('gh-lock') && (ui.grade === 'all' || c.dataset.g === ui.grade)).length;
        const why = q ? '沒有名字裡有「' + q + '」的遺跡' : (gname ? gname + '沒有你現在能接的委託' : '現在沒有能接的委託') + (hid && !ui.locked ? '（另外有 ' + hid + ' 件還沒開放）' : '');
        none = document.createElement('div'); none.className = 'note gh-none';
        none.innerHTML = '<p>' + esc(why) + '。</p><button type="button" class="btn">看全部的委託</button>';
        none.querySelector('button').onclick = () => { ui.grade = 'all'; ui.q = ''; ui.ok = 0; const qi = bar.querySelector('#gh-q'), oi = bar.querySelector('#gh-ok'); if (qi) qi.value = ''; if (oi) oi.checked = false; keep(); apply(); };
        wrap.prepend(none);
      }
    };
    bar.querySelectorAll('[data-ghg]').forEach(b => { b.onclick = () => { ui.grade = b.dataset.ghg; keep(); apply(); }; });
    bar.querySelector('#gh-sort').onchange = e => { ui.sort = e.target.value; keep(); apply(); };
    bar.querySelector('#gh-q').oninput = e => { ui.q = e.target.value; keep(); apply(); };
    bar.querySelector('#gh-lk').onchange = e => { ui.locked = e.target.checked ? 1 : 0; keep(); apply(); };
    bar.querySelector('#gh-ok').onchange = e => { ui.ok = e.target.checked ? 1 : 0; keep(); apply(); };
    apply();
  };

  // ---------- 上方的狀態列 ----------
  const summary = (body, blocks, show) => {
    const S = R.S, h = S.heldTask, el = document.createElement('div'); el.className = 'gh-sum';
    const rk = body.querySelector('.rk-box'), badge = rk && rk.querySelector('.rk-badge'), req = rk ? [...rk.querySelectorAll('.rk-req li')] : [], ok = req.filter(l => l.classList.contains('ok')).length;
    const steps = rk ? [...rk.querySelectorAll('.rk-steps i')] : [], si = steps.findIndex(i => i.classList.contains('cur'));
    const pct = req.length ? Math.round(ok / req.length * 100) : 100;
    const qb = body.querySelector('.qb-box'), qbn = qb ? qb.querySelectorAll('[data-qbdone],[data-qbgive],.qb-held, .qb-mine li').length : 0;
    el.innerHTML = '<div class="gh-s gh-s-rank" data-ghjump="card" title="段位與升階條件（點一下看勇者證）"><small>段位</small><b>' + (badge ? esc([...badge.children].map(x => x.textContent).join('・')) : '—') + '</b>'
      + (req.length ? '<span class="gh-bar" title="升階條件 ' + ok + '／' + req.length + '"><i style="width:' + pct + '%"></i></span><small>升階條件 ' + ok + '／' + req.length + (steps.length ? '・第 ' + (si + 1) + '／' + steps.length + ' 階' : '') + '</small>' : '') + '</div>'
      + '<div class="gh-s gh-s-task">' + (h ? '<small>手上的委託</small><b>' + esc((h.letter ? h.letter + ' 級・' : '') + h.site) + '</b><small>' + esc(R.heldLine ? R.heldLine(h) : '') + (h.pay ? '・扣住 ' + h.pay + ' 費拉' : '') + '</small><span class="row"><button type="button" class="mini gold" data-ghti="go" title="結算五軌成績、領報酬">繳交</button><button type="button" class="mini" data-ghti="drop" title="記為失敗，報酬拿不到">放棄</button></span>' : '<small>手上的委託</small><b>沒有</b><small>到「委託」分頁挑一張遺跡委託</small>') + '</div>'
      + '<div class="gh-s"><small>錢包</small><b>' + S.gold + ' 費拉</b><small>' + esc(R.clsName(S.cls)) + ' Lv ' + S.classes[S.cls].lv + '</small></div>';
    el.querySelectorAll('[data-ghjump]').forEach(b => { b.onclick = () => show(b.dataset.ghjump); });
    const ti = body.querySelector('.ti-box');
    el.querySelectorAll('[data-ghti]').forEach(b => { b.onclick = () => { const t = ti && ti.querySelector(b.dataset.ghti === 'go' ? '#ti-go' : '#ti-drop'); if (t) t.click(); }; });
    return el;
  };

  // ---------- 主體 ----------
  let lastFocus = null;
  const build = () => {
    const hub = $('hub'), body = $('hub-body'); if (!hub || !body) return;
    if (!isGuild()) { hub.classList.remove('gh-on'); return; }
    if (body.querySelector('.gh-root')) return;
    hub.classList.add('gh-on');
    const { head, blocks, sec } = split(body);
    if (!blocks.length) return;
    const h2 = head.find(e => e.tagName === 'H2'), at = h2 ? h2.textContent : '';
    const fTab = /委託告示板/.test(at) ? 'quest' : /・登記處/.test(at) ? 'card' : /收購窗口/.test(at) ? 'sell' : null;
    if (fTab && fTab !== lastFocus) ui.tab = fTab;
    lastFocus = fTab;
    const root = document.createElement('div'); root.className = 'gh-root';
    const sign = document.createElement('header'); sign.className = 'gh-sign';
    sign.innerHTML = '<div class="gh-board"><span class="gh-kamon">令</span><h2>' + esc(at || '公會東鶴分館') + '</h2></div>';
    head.forEach(e => { if (e !== h2) sign.appendChild(e); });
    const groups = {}; TABS.forEach(t => { groups[t[0]] = []; });
    blocks.forEach(b => groups[tabOf(b.title)].push(b));
    // 勇者證分頁：熟練度、任務成績（五軌制）往上排，緊接在勇者證後面（2026-10-13 作者：熟練度和五軌制的介面往上調）
    { const pri = t => /^勇者證/.test(t) ? 0 : /^熟練度/.test(t) ? 1 : /^任務成績/.test(t) ? 2 : 3; groups.card = groups.card.map((b, i) => [b, i]).sort((x, y) => pri(x[0].title) - pri(y[0].title) || x[1] - y[1]).map(x => x[0]); }
    const tabs = TABS.filter(t => groups[t[0]].length);
    if (!groups[ui.tab] || !groups[ui.tab].length) ui.tab = tabs[0][0];
    const nav = document.createElement('nav'); nav.className = 'gh-noren'; nav.setAttribute('role', 'tablist');
    tabs.forEach(([id, name], i) => {
      const b = document.createElement('button'); b.type = 'button'; b.className = 'gh-tab'; b.dataset.ght = id; b.setAttribute('role', 'tab'); b.title = name + '（快捷鍵 ' + (i + 1) + '）';
      const badge = id === 'quest' && R.S.heldTask ? '<i class="gh-dot" title="有手上的委託"></i>' : id === 'redeem' && blocks.some(x => /抽選|自選/.test(x.title)) ? '' : '';
      b.innerHTML = '<kbd>' + (i + 1) + '</kbd>' + esc(name) + badge; nav.appendChild(b);
    });
    const panes = document.createElement('div'); panes.className = 'gh-panes';
    tabs.forEach(([id]) => { const p = document.createElement('section'); p.className = 'gh-pane panel-doc'; p.dataset.ghp = id; p.setAttribute('role', 'tabpanel'); groups[id].forEach(b => { const card = document.createElement('div'); card.className = 'gh-card'; b.els.forEach(e => card.appendChild(e)); p.appendChild(card); }); panes.appendChild(p); });
    const show = id => { ui.tab = id; keep(); nav.querySelectorAll('[data-ght]').forEach(b => { const on = b.dataset.ght === id; b.setAttribute('aria-selected', on); b.classList.toggle('on', on); }); panes.querySelectorAll('[data-ghp]').forEach(p => { p.hidden = p.dataset.ghp !== id; }); };
    nav.querySelectorAll('[data-ght]').forEach(b => { b.onclick = () => show(b.dataset.ght); });
    root.append(sign, summary(panes, blocks, show), nav, panes);
    const keepTop = [...body.children].filter(c => c !== sec && !head.includes(c) && !blocks.some(b => b.els.includes(c)));
    body.innerHTML = ''; keepTop.forEach(c => sign.appendChild(c)); body.appendChild(root);
    // 委託
    const qb = groups.quest.find(b => /^遺跡委託/.test(b.title)); if (qb) try { questTools(qb); } catch (e) { console.warn('[guildhall]', e); }
    // 放棄委託：公會風格的確認
    const drop = body.querySelector('#ti-drop'); if (drop) drop.onclick = () => { const h = R.S.heldTask; R.ghConfirm('放棄這張委託？', '「' + (h ? h.site : '') + '」會記為失敗，扣住的報酬' + (h && h.pay ? ' ' + h.pay + ' 費拉' : '') + '也拿不到。', '放棄委託', () => { R.dropHeldTask(); R.hub(); R.toast && R.toast('放棄了委託。', '#C8B88A'); }); };
    show(ui.tab);
  };
  const hub0 = R.hub;
  R.hub = (t, f) => { const r = hub0(t, f); try { build(); } catch (e) { console.warn('[guildhall]', e); } return r; };

  // ---------- 加注條款：總倍率常駐、一鍵全部不加 ----------
  const pactPlus = () => {
    document.querySelectorAll('#pact-box').forEach(box => {
      if (box.querySelector('.gh-pmul')) return;
      const sum = box.querySelector('.pact-sum'); if (!sum) return;
      const b = sum.querySelector('b'), pts = b ? +b.textContent || 0 : 0;
      const m = document.createElement('div'); m.className = 'gh-pmul';
      m.innerHTML = '<span>報酬 <b>×' + (1 + pts * 0.1).toFixed(1) + '</b></span><span>經驗 <b>×' + (1 + pts * 0.05).toFixed(2) + '</b></span><span>寶物 <b>×' + (1 + pts * 0.03).toFixed(2) + '</b></span>' + (box.querySelector('.pact-row.on') ? '<button type="button" class="mini" data-ghpclr="1">全部不加</button>' : '');
      sum.appendChild(m);
      const c = m.querySelector('[data-ghpclr]'); if (c) c.onclick = () => { for (let i = 0; i < 40; i++) { const bx = document.querySelector('#pact-box'), on = bx && bx.querySelector('.pact-row.on [data-pact$=":0"]'); if (!on) break; on.click(); } };
    });
  };
  new MutationObserver(() => { try { pactPlus(); } catch (e) { } }).observe(document.body, { childList: true, subtree: true });

  // ---------- 快捷鍵 ----------
  window.addEventListener('keydown', e => {
    const cf = $('gh-confirm');
    if (cf) { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cf.remove(); } return; }
    if (!hubOn() || !isGuild()) return;
    const m = $('hub-modal');
    if (e.key === 'Escape' && m && !m.hidden) { e.preventDefault(); e.stopPropagation(); m.hidden = true; $('hub-sheet').innerHTML = ''; return; }
    const tg = e.target, typing = tg && ((tg.tagName === 'INPUT' && !/^(checkbox|radio|button)$/.test(tg.type)) || tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || tg.isContentEditable);
    if (typing) { if (e.key === 'Escape') tg.blur(); return; }
    if (m && !m.hidden) return;
    if (/^[1-7]$/.test(e.key) && !e.ctrlKey && !e.altKey && !e.metaKey) { const b = document.querySelectorAll('.gh-noren [data-ght]')[+e.key - 1]; if (b) { e.preventDefault(); e.stopPropagation(); b.click(); } }
    else if (e.key === '/') { const q = $('gh-q'); if (q) { e.preventDefault(); e.stopPropagation(); q.focus(); } }
  }, true);

  // ---------- 樣式：木造告示板、和紙委託單、暖簾分頁、印章 ----------
  const css = document.createElement('style');
  css.textContent = [
    '#hub.gh-on{--gh-wood:#4A2F1C;--gh-wood2:#6B4527;--gh-ai:#22305A;--gh-shu:#C2412D;--gh-washi:#F2E8D2;--gh-sumi:#1E1A17}',
    '#hub.gh-on .hub-body{background:radial-gradient(ellipse at 50% 0,rgba(194,65,45,.08),transparent 60%),repeating-linear-gradient(90deg,#16121A 0 120px,#181320 120px 121px)}',
    '.gh-root{max-width:1080px;margin:0 auto;padding:0 10px 40px;font-family:"Noto Serif TC","Noto Serif CJK TC","Songti TC",serif}',
    '.gh-sign{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:6px 0 8px}',
    '.gh-board{display:flex;align-items:center;gap:12px;padding:8px 22px 8px 10px;border-radius:6px;background:repeating-linear-gradient(0deg,var(--gh-wood) 0 5px,var(--gh-wood2) 5px 7px,var(--gh-wood) 7px 13px);border:2px solid #2A1A0E;box-shadow:inset 0 0 0 2px rgba(255,220,160,.12),0 4px 10px rgba(0,0,0,.5)}',
    '.gh-board h2{margin:0;color:#F6E7C4;font-size:clamp(20px,3vw,28px);letter-spacing:.18em;text-shadow:1px 1px 0 #1A0E06,0 0 8px rgba(0,0,0,.6)}',
    '.gh-kamon{display:inline-grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--gh-shu);color:#FFF4E6;font-weight:900;font-size:20px;box-shadow:inset 0 0 0 3px rgba(255,255,255,.25)}',
    '.gh-sign>.note{flex-basis:100%;margin:0;color:var(--dim)}',
    '.gh-sum{position:sticky;top:0;z-index:5;display:grid;grid-template-columns:1.1fr 1.6fr .9fr;gap:8px;margin:0 0 10px;padding:8px;border-radius:8px;background:rgba(22,18,28,.94);border:1px solid rgba(201,161,58,.35);backdrop-filter:blur(4px)}',
    '.gh-s{display:flex;flex-direction:column;gap:2px;min-width:0;padding:4px 10px;border-left:3px solid var(--gh-ai)}',
    '.gh-s small{color:var(--dim);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.gh-s b{color:#F3E4BE;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.gh-s-rank{cursor:pointer;border-left-color:var(--gold)}.gh-s-task{border-left-color:var(--gh-shu)}.gh-s .row{display:flex;gap:6px;margin-top:2px}',
    '.gh-bar{display:block;height:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden}.gh-bar i{display:block;height:100%;background:linear-gradient(90deg,#B8862A,#F0CF6A)}',
    '.gh-noren{display:flex;gap:4px;overflow-x:auto;padding:0 2px;border-bottom:4px solid var(--gh-ai);scrollbar-width:thin}',
    '.gh-tab{position:relative;flex:0 0 auto;min-height:42px;padding:8px 16px 10px;border:0;border-radius:4px 4px 0 0;background:linear-gradient(180deg,#2E3C68,#1F2A4C);color:#DDE3F5;font-weight:700;font-size:15px;letter-spacing:.08em;cursor:pointer;',
    '  -webkit-mask:linear-gradient(#000,#000) top/100% 70% no-repeat,linear-gradient(90deg,#000 0 46%,transparent 46% 54%,#000 54%) bottom/100% 31% no-repeat}',
    '.gh-tab:hover{background:linear-gradient(180deg,#3A4A80,#26335C)}',
    '.gh-tab.on{background:linear-gradient(180deg,var(--gh-shu),#962F20);color:#FFF6E8;-webkit-mask:none}',
    '.gh-tab kbd{font:11px monospace;opacity:.6;margin-right:6px;border:1px solid currentColor;border-radius:3px;padding:0 3px}',
    '.gh-dot{position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:#F0CF6A;box-shadow:0 0 6px #F0CF6A}',
    '.gh-pane.panel-doc{margin:0;padding:12px 0 0;max-width:none;background:none;border:0;box-shadow:none}',
    '.gh-card{margin:0 0 14px;padding:12px 14px;border-radius:8px;background:linear-gradient(180deg,rgba(34,48,90,.22),rgba(26,22,32,.6));border:1px solid rgba(237,230,214,.12);border-top:3px solid var(--gh-ai)}',
    '.gh-card>h3:first-child,.gh-card>div>h3:first-child{margin-top:0}',
    '#hub.gh-on .gh-card h3{font-size:18px;letter-spacing:.14em;color:#F3E4BE;padding-left:12px;border-left:4px solid var(--gh-shu);text-shadow:0 1px 0 #000}',
    // 告示板＋和紙委託單
    '.gh-pane[data-ghp="quest"] .gh-card:first-child{background:repeating-linear-gradient(0deg,#3E2716 0 6px,#47301C 6px 8px,#3E2716 8px 15px);border:3px solid #24160B;box-shadow:inset 0 0 30px rgba(0,0,0,.5)}',
    '.gh-tools{display:flex;flex-direction:column;gap:8px;margin:4px 0 10px;padding:8px;border-radius:6px;background:rgba(0,0,0,.35)}',
    '.gh-chips{display:flex;flex-wrap:wrap;gap:6px}.gh-chip{min-height:34px;padding:4px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:#EEE3C8;font-weight:700;cursor:pointer;box-shadow:inset 3px 0 0 var(--c,#999)}',
    '.gh-chip.on{background:var(--gh-washi);color:var(--gh-sumi);border-color:var(--c,#C9A13A)}',
    '.gh-tr{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.gh-tr input[type=search],.gh-tr select{min-height:34px;padding:4px 10px;border-radius:6px;border:1px solid #8A7A5A;background:var(--gh-washi);color:var(--gh-sumi);font:inherit}.gh-tr input[type=search]{flex:1 1 160px}',
    '.gh-ck{display:flex;gap:4px;align-items:center;color:#EEE3C8;font-size:14px;cursor:pointer}.gh-cnt{margin-left:auto;color:#F0CF6A;font-weight:700}',
    '#hub.gh-on .quests{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px 12px}',
    '#hub.gh-on .quest{position:relative;padding:16px 14px 12px;border:0;border-radius:2px;background:linear-gradient(180deg,rgba(0,0,0,.04),transparent 30%),var(--gh-washi);color:var(--gh-sumi);box-shadow:0 3px 6px rgba(0,0,0,.45);border-top:7px solid var(--c);transform:rotate(-.4deg);transition:transform .12s}',
    '#hub.gh-on .quest:nth-child(even){transform:rotate(.5deg)}',
    // 任務單 hover／鍵盤焦點：白框畫在委託單外圈，難度色頂邊不變；已接（gh-held）白框稍粗
    '#hub.gh-on .quest:hover,#hub.gh-on .quest:focus-visible{transform:rotate(0) translateY(-2px);box-shadow:0 6px 12px rgba(0,0,0,.5);outline:2px solid #fff;outline-offset:3px}',
    '#hub.gh-on .ft-row:hover,#hub.gh-on .ft-row:focus-visible,#hub.gh-on .qb-row:hover,#hub.gh-on .er-row:hover{outline:2px solid #fff;outline-offset:2px}',
    '#hub.gh-on .quest::before{content:"";position:absolute;top:-11px;left:50%;width:12px;height:12px;margin-left:-6px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#F08070,#8E2416);box-shadow:0 2px 2px rgba(0,0,0,.5)}',
    '#hub.gh-on .quest b{color:var(--gh-sumi);font-size:16px}#hub.gh-on .quest small{color:#5A4E40}#hub.gh-on .quest .note{color:#5A4E40}',
    '#hub.gh-on .quest .btn{min-height:38px;margin-top:6px}',
    '.gh-meta{display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 2px}.gh-meta span{font-size:12px;padding:1px 7px;border-radius:3px;background:rgba(34,48,90,.1);border:1px solid rgba(34,48,90,.25);color:#2A3358}',
    '.gh-why{display:block;font-style:normal;font-size:12px;color:var(--gh-shu);font-weight:700;margin:4px 0}',
    '#hub.gh-on .quest.gh-lock{filter:grayscale(.7);opacity:.7}#hub.gh-on .quest.gh-blocked{background:linear-gradient(135deg,transparent 0 47%,rgba(194,65,45,.1) 47% 53%,transparent 53%),var(--gh-washi)}',
    '.gh-hanko{position:absolute;right:10px;top:12px;width:46px;height:46px;display:grid;place-items:center;border:3px solid var(--gh-shu);border-radius:50%;color:var(--gh-shu);font-style:normal;font-weight:900;font-size:15px;letter-spacing:.1em;transform:rotate(-14deg);opacity:.85;box-shadow:inset 0 0 0 2px rgba(194,65,45,.3);pointer-events:auto}',
    '#hub.gh-on .quest.gh-held{outline:3px solid #fff;outline-offset:3px;box-shadow:0 3px 6px rgba(0,0,0,.45)}',
    // 確認視窗
    '.gh-cf{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;background:rgba(8,6,10,.6)}',
    '.gh-cf-card{max-width:min(420px,92vw);padding:18px 20px;border-radius:4px;background:var(--gh-washi,#F2E8D2);color:#1E1A17;border-top:8px solid #C2412D;box-shadow:0 10px 30px rgba(0,0,0,.6);font-family:"Noto Serif TC",serif}',
    '.gh-cf-card h3{margin:0 0 8px;font-size:19px;letter-spacing:.1em}.gh-cf-card .row{display:flex;gap:8px;justify-content:flex-end;margin-top:14px}.gh-cf-card .btn{min-height:40px}.gh-cf-card .btn.red{background:#C2412D;color:#FFF;border-color:#7A2214}',
    // 加注條款
    '.pact-sum{position:sticky;bottom:0;z-index:2;padding:8px 10px;border-radius:6px;background:rgba(20,16,24,.95);border:1px solid rgba(201,161,58,.5)}',
    '.gh-pmul{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:4px;font-size:14px}.gh-pmul b{color:#F0CF6A;font-size:16px}.gh-pmul .mini{margin-left:auto}',
    // 手機
    '@media (max-width:720px){.gh-sum{grid-template-columns:1fr 1fr;position:static}.gh-s-task{grid-column:1/-1;order:-1}.gh-tab{font-size:14px;padding:8px 12px 10px}.gh-tab kbd{display:none}#hub.gh-on .quests{grid-template-columns:1fr}#hub.gh-on .gh-root button.mini{min-height:36px;padding:4px 10px}.gh-board h2{letter-spacing:.08em}}'
  ].join('\n');
  document.head.appendChild(css);
})(window.R);
