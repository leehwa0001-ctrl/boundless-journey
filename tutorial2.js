// 新手教學 2（2026-10-13 作者：「新手教學也幫我優化一下」）
// - 一步一步的小提示卡（不是一大段文字）：框出畫面上真的按鈕／區域、箭頭指過去、顯示「第 2／5 步」；玩家做到了就自己跳下一步。
// - 每一段都可以「跳過這段」「關掉教學」；城裡選單的「新手教學」可以重看任何一段、打開／關掉自動提示。
// - 段落：基本操作（城裡）→ 戰鬥（第一次進遺跡）→ 遺跡（樓層、營火、樓梯、BOSS：走到旁邊才提示）→ 公會／倉庫／鐵匠鋪／白藤堂（第一次打開）
//   → 職業（弓箭手續力、術陣師陣紋、吟遊詩人樂譜：第一次用這個職業進遺跡）。電腦和手機的說法、手勢分開寫。
// - 舊存檔不強迫：第一次進城問一次要不要看，不要就只在選單裡。存在 R.S.tut2。原本的「東鶴指南」（guide.js）照舊。
// 放在 darktheme.js 後面、main.js 前面。
(function (R) {
  const W = R.W, $ = id => document.getElementById(id), esc = s => R.esc ? R.esc(s) : String(s);
  const touch = () => !!R.touch, T = (d, m) => touch() ? m : d;
  const S = () => R.S;
  const st = () => { const s = S(); if (!s) return null; if (!s.tut2) s.tut2 = { seen: {}, on: 1 }; return s.tut2; };
  const save = () => { try { R.save && R.save(); } catch (e) { } };
  const inHub = k => { const h = $('hub'); return !!(h && !h.hidden && getComputedStyle(h).display !== 'none') && (!k || ctxHub === k); };
  const inRun = () => !!(W.run && !W.town) && !(R.sheetOpen && R.sheetOpen());
  const tabOn = sel => { const b = document.querySelector(sel); return !!(b && (b.classList.contains('on') || b.getAttribute('aria-selected') === 'true')); };
  const byText = (sel, re) => [...document.querySelectorAll(sel)].find(e => re.test(e.textContent) && e.offsetParent !== null);
  // 玩家做了什麼（只記錄，不攔按鍵）
  const ev = {}; const hit = k => { ev[k] = (ev[k] || 0) + 1; };
  addEventListener('keydown', e => {
    const k = (e.key || '').toLowerCase();
    if (/^(w|a|s|d|arrowup|arrowdown|arrowleft|arrowright)$/.test(k)) hit('move');
    if (k === 'shift') hit('run'); if (k === ' ') hit('act'); if (k === 't') hit('ft'); if (k === 'x') hit('cls');
    if (/^[3-6]$/.test(k) || k === 'r') hit('skill'); if (k === 'r') hit('rot');
    if (k === 'm' || k === 'tab') hit('map'); if (k === '1') hit('pot'); if (k === 'shift') hit('dodge');
  }, true);
  addEventListener('mousedown', e => { if (e.button === 0 && e.target && e.target.id === 'gl') hit('fire'); }, true);
  addEventListener('pointerdown', e => { const t = e.target; if (!t || !t.closest) return; if (t.closest('#joy-l')) hit('move'); if (t.closest('#joy-r')) hit('fire'); if (t.closest('[id^="r-skill"]')) hit('skill'); if (t.closest('#core-g')) hit('cls'); if (t.closest('#r-pot')) hit('pot'); if (t.closest('#r-map,#b-map')) hit('map'); if (t.closest('.tk-it')) hit('drag'); if (t.closest('[data-tkrot],[data-tkrotin]')) hit('rot'); }, true);
  let reN = 0; const poll = () => { const I = R.input || {}; const rn = (R.elemDbg && R.elemDbg.react) || 0; if (rn > reN) hit('react'); reN = rn;   // 2026-10-14 術士「引爆」：真的引爆（classcore.js 的 R.elemDbg.react）才跳下一步
    if (I.moveStick) hit('move'); if (I.fire) hit('fire'); if (I.run) hit('run'); };
  const since = k => { const v = ev[k] || 0; return () => (ev[k] || 0) > v; };
  // ---------- 段落 ----------
  // 每一步：t 標題、d 說明（函式，電腦／手機分開）、el 要框起來的東西、go 開始時記錄、ok 做到了沒（沒有＝按「下一步」）
  const step = (t, d, el, ok) => ({ t, d, el, ok });
  const evStep = (t, d, el, k) => ({ t, d, el, k });
  const CH = {
    basics: { n: '基本操作', ctx: () => !!W.town && !inHub() && !(R.sheetOpen && R.sheetOpen()), steps: [
      evStep('走路', () => T('<kbd>W A S D</kbd> 走路。', '左下拖曳走路。'), () => touch() ? '#joy-l' : null, 'move'),
      evStep('跑步', () => T('按住 <kbd>Shift</kbd> 跑步。', '搖桿推到底就跑。'), () => touch() ? '#joy-l' : null, 'run'),
      step('互動', () => T('出現提示時按 <kbd>空白鍵</kbd> 互動。', '出現提示時點「互動」。'), '#r-prompt'),
      evStep('馬車', () => T('<kbd>T</kbd> 叫馬車，直接到目的地。', '點「馬車」直接到目的地。'), null, 'ft'),
      step('下一步', () => '左上角寫著下一步。先去<b>公會</b>接委託！', '#gd-box')
    ] },
    combat: { n: '戰鬥', ctx: inRun, steps: [
      evStep('普攻', () => T('<kbd>左鍵</kbd> 攻擊。', '右搖桿瞄準、放開出手。'), () => touch() ? '#joy-r' : null, 'fire'),
      evStep('技能', () => T('<kbd>R</kbd>、<kbd>3</kbd>～<kbd>6</kbd> 放技能。', '點技能鈕放技能。'), '#r-skill', 'skill'),
      step('血和魔力', () => '紅＝生命，藍＝魔力。', '#r-hp'),
      step('喝藥', () => T('<kbd>1</kbd> 回血，<kbd>2</kbd> 回魔。', '點藥瓶喝藥。'), '#r-pot'),
      step('翻滾', () => T('點一下 <kbd>Shift</kbd> 翻滾，不會受傷。', '點翻滾鈕閃開。'), '#r-dodge-cd'),
      evStep('地圖', () => T('<kbd>Tab</kbd> 看地圖。', '點地圖鈕看地圖。'), () => touch() ? '#r-map' : null, 'map')
    ] },
    ruin: { n: '遺跡', ctx: inRun, steps: [
      step('房間', () => '進房間門會關，清完才開。', '#r-where'),
      step('往下', () => '找樓梯往下，越深越好拿。', null),
      step('營火', () => '休息、存檔、回城。', null),
      step('BOSS', () => '打倒 BOSS，回城繳委託。', '#r-boss')
    ] },
    guild: { n: '公會', ctx: () => inHub('guild'), steps: [
      step('狀態列', () => '手上的委託在這裡繳交。', '.gh-bar'),
      step('分頁', () => T('點暖簾或 <kbd>1</kbd>～<kbd>7</kbd> 換分頁。', '點暖簾換分頁。'), '.gh-noren'),
      step('委託', () => '挑一張委託接下來。', '.gh-tab[data-ght="quest"]', () => tabOn('.gh-tab[data-ght="quest"]')),
      step('鎖住的', () => '鎖住的會寫原因。', () => byText('#hub .quest', /需|未開放|段位/)),
      step('條款', () => '加條款：更難、報酬更多。', () => byText('#hub h3, #hub .gh-cf-card', /條款/)),
      step('勇者證', () => '看你的等級和成績。', '.gh-tab[data-ght="card"]', () => tabOn('.gh-tab[data-ght="card"]'))
    ] },
    stash: { n: '倉庫', ctx: () => inHub('stash'), steps: [
      step('格子', () => '裝備要自己排進格子。', '.tk-grid'),
      evStep('搬動', () => '按住裝備拖過去。', '.tk-grid', 'drag'),
      evStep('旋轉', () => T('拖著時按 <kbd>R</kbd> 旋轉。', '點「旋轉」轉 90 度。'), () => document.querySelector('[data-tkrot]') || '.tk-grid', 'rot'),
      step('箱子', () => '箱子裡還能再放東西。', () => document.querySelector('.tk-box') || '.tk-grid')
    ] },
    smith: { n: '鐵匠鋪', ctx: () => inHub('smith'), steps: [
      step('鑑定', () => '帶回來的裝備先<b>鑑定</b>。', '#hub .gh-noren, #hub .subtabs'),
      step('強化、分解', () => '強化變強，分解拿素材。', null)
    ] },
    shop: { n: '白藤堂', ctx: () => inHub('shop'), steps: [
      step('買藥', () => '在這裡買藥。', '[data-hkt="med"]'),
      step('背包', () => '大背包能多帶東西回來。', '[data-hkt="bag"]')
    ] },
    archer: { n: '弓箭手：續力', ctx: inRun, steps: [
      evStep('續力', () => T('按住 <kbd>左鍵</kbd> 蓄力，放開射出。', '按住右搖桿蓄力，放開射出。'), () => touch() ? '#joy-r' : null, 'fire'),
      evStep('箭矢', () => T('按技能鍵換上箭矢，射出才扣魔力。', '點技能換上箭矢，射出才扣魔力。'), '#r-skill', 'skill')
    ] },
    arraymage: { n: '術陣師：陣紋', ctx: inRun, steps: [
      evStep('畫陣紋', () => T('<kbd>X</kbd> 打開陣紋，拖過節點畫線。', '點職業條，拖過節點畫線。'), '#core-g', 'cls'),
      step('施法', () => T('按技能看範圍，<kbd>左鍵</kbd> 放出。', '點技能看範圍，再點一下放出。'), '#r-skill')
    ] },
    mage: { n: '術士：元素反應', ctx: inRun, steps: [   // 2026-10-13 術士：元素反應（elemreact.js）
      evStep('換元素', () => T('<kbd>X</kbd> 換普攻元素。', '點職業條換普攻元素。'), '#core-g', 'cls'),
      evStep('上元素', () => T('<kbd>左鍵</kbd> 打中，敵人頭上出現元素。', '普攻打中，敵人頭上出現元素。'), () => touch() ? '#joy-r' : null, 'fire'),
      evStep('引爆', () => T('再用不同元素的技能打，就會引爆。', '再用不同元素的技能打，就會引爆。'), '#r-skill', 'react'),
      step('反應表', () => T('按住 <kbd>X</kbd> 看反應表。', '長按職業條看反應表。'), '#core-g')
    ] },
    summoner: { n: '召喚師：意念與收回', ctx: inRun, steps: [   // 2026-10-13 召喚師
      evStep('意念', () => T('<kbd>X</kbd> 換意念：集火、護衛、狂奔。', '點職業條換意念。'), '#core-g', 'cls'),
      evStep('協同', () => T('<kbd>左鍵</kbd> 打中，召喚物一起撲上去。', '普攻打中，召喚物一起撲上去。'), () => touch() ? '#joy-r' : null, 'fire'),
      step('收回', () => T('按住 <kbd>X</kbd> 收回全部。', '長按職業條收回全部。'), '#core-g'),
      step('解除一招', () => '按住技能鍵，只收回那一招的。', '#r-skill2'),
      step('魔力', () => '召喚物在場會慢慢吃魔力。', null)
    ] },
    scroll: { n: '符卷師：卷軸', ctx: inRun, steps: [   // 2026-10-13 符卷師重做
      step('寫卷軸', () => '回城在白藤堂的書桌寫卷軸。', null),
      evStep('撕卷', () => T('按技能鍵撕卷軸，不耗魔力。', '點技能撕卷軸，不耗魔力。'), '#r-skill', 'skill')
    ] },
    bard: { n: '吟遊詩人：樂譜', ctx: inRun, steps: [
      evStep('和弦', () => T('<kbd>X</kbd> 換和弦。', '點職業條換和弦。'), '#core-g', 'cls'),
      step('寫樂譜', () => T('按住 <kbd>X</kbd> 錄樂譜：出手會變音符。', '長按職業條錄樂譜。'), '#core-g'),
      step('演奏', () => '之後出手會先演奏，再發出攻擊。', null)
    ] },
    blade: { n: '刀客：收刀與刀意', ctx: inRun, steps: [   // 2026-10-13 刀客重製
      evStep('收刀', () => T('<kbd>X</kbd> 收刀，集滿刀意。', '點職業條收刀，集滿刀意。'), '#core-g', 'cls'),
      step('居合', () => '刀意滿了，下一刀是大範圍「居合」。', '#core-g'),
      step('反切', () => '拔刀時刀意滿，被打會自動反砍。', null)
    ] },
    warrior: { n: '戰士：怒氣', ctx: inRun, steps: [   // 2026-10-13 每個職業都有職業教學
      evStep('怒氣', () => T('<kbd>左鍵</kbd> 打人、被打都會漲怒氣。', '打人、被打都會漲怒氣。'), () => touch() ? '#joy-r' : null, 'fire'),
      evStep('怒吼', () => T('怒氣 50 以上按 <kbd>X</kbd> 怒吼。', '怒氣 50 以上點職業條怒吼。'), '#core-g', 'cls')
    ] },
    gunner: { n: '槍手：換彈與彈種', ctx: inRun, steps: [
      evStep('完美換彈', () => T('換彈時指針到金格按 <kbd>X</kbd>。', '換彈時指針到金格點職業條。'), '#core-g', 'cls'),
      step('換彈種', () => T('彈匣滿時按 <kbd>X</kbd> 換子彈。', '彈匣滿時點職業條換子彈。'), '#core-g')
    ] },
    knight: { n: '騎士：舉盾', ctx: inRun, steps: [
      evStep('舉盾', () => T('按住 <kbd>X</kbd> 舉盾。', '按住職業條舉盾。'), '#core-g', 'cls'),
      step('完美防禦', () => '被打的前一刻舉盾，對方會暈。', '#core-g')
    ] },
    priest: { n: '牧師：信仰與神蹟', ctx: inRun, steps: [
      evStep('信仰', () => T('補血、祝福會攢信仰。', '補血、祝福會攢信仰。'), '#r-skill', 'skill'),
      step('神蹟', () => T('信仰滿了按 <kbd>X</kbd> 放神蹟。', '信仰滿了點職業條放神蹟。'), '#core-g')
    ] },
    enchanter: { n: '附魔師：刻印', ctx: inRun, steps: [
      evStep('換刻印', () => T('<kbd>X</kbd> 換武器刻印。', '點職業條換武器刻印。'), '#core-g', 'cls'),
      evStep('攢力量', () => T('<kbd>左鍵</kbd> 打中攢力量，滿了自動放。', '普攻打中攢力量，滿了自動放。'), () => touch() ? '#joy-r' : null, 'fire')
    ] },
    monk: { n: '武術家：四法與勢', ctx: inRun, steps: [   // 2026-10-13 作者：武術家也要職業提示（monkstance.js）
      evStep('換法', () => T('<kbd>X</kbd> 換拳、掌、步、腿四法。', '點職業條換四法。'), '#core-g', 'cls'),
      evStep('攢勢', () => T('<kbd>左鍵</kbd> 打中攢「勢」。', '普攻打中攢「勢」。'), () => touch() ? '#joy-r' : null, 'fire'),
      step('爆發', () => '勢滿了再換法，就會爆發。', null)
    ] }
  };
  const ok = id => CH[id].ctx() && !(R.sheetOpen && R.sheetOpen());
  const ORDER = ['basics', 'combat', 'ruin', 'guild', 'stash', 'smith', 'shop', 'warrior', 'archer', 'gunner', 'mage', 'priest', 'knight', 'blade', 'monk', 'bard', 'summoner', 'arraymage', 'enchanter', 'scroll'];
  // ---------- 畫面 ----------
  const css = document.createElement('style'); css.id = 'tu2-css';
  css.textContent = '#tu2-ring{position:fixed;z-index:9998;pointer-events:none;border:2px solid #C9A13A;border-radius:10px;box-shadow:0 0 0 3px rgba(201,161,58,.25),0 0 18px rgba(201,161,58,.45);transition:all .2s;animation:tu2p 1.4s infinite}'
    + '@keyframes tu2p{50%{box-shadow:0 0 0 6px rgba(201,161,58,.12),0 0 24px rgba(201,161,58,.55)}}'
    + '#tu2-arrow{position:fixed;z-index:9998;pointer-events:none;color:#C9A13A;font-size:22px;line-height:1;text-shadow:0 1px 3px #000;transition:all .2s}'
    + '#tu2-card{position:fixed;z-index:9999;width:min(340px,calc(100vw - 20px));background:linear-gradient(180deg,#26202E,#1C1822);color:#E8E0D0;border:1px solid rgba(201,161,58,.45);border-top:3px solid #A8442F;border-radius:6px;box-shadow:0 6px 20px rgba(0,0,0,.55);padding:10px 12px;font-size:14px;line-height:1.55;transition:top .2s,left .2s}'
    + '#tu2-card .tu2-h{display:flex;justify-content:space-between;align-items:baseline;gap:8px;margin-bottom:4px}#tu2-card .tu2-h small{color:#B5AA96;font-size:11px}#tu2-card b.tu2-t{font-size:15px;color:#F0D890}'
    + '#tu2-card kbd{background:#3A3240;border:1px solid #5A5060;border-bottom-width:2px;border-radius:3px;padding:0 5px;font-size:12px;color:#F0E6D0}'
    + '#tu2-card .tu2-dots{display:flex;gap:4px;margin:6px 0 2px}#tu2-card .tu2-dots i{flex:1;height:3px;border-radius:2px;background:#3A3240}#tu2-card .tu2-dots i.on{background:#C9A13A}'
    + '#tu2-card .tu2-row{display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;margin-top:6px}#tu2-card button{background:#2E2836;color:#E8E0D0;border:1px solid #5A5060;border-radius:4px;padding:4px 10px;font-size:13px;cursor:pointer;min-height:32px}#tu2-card button.pri{background:#7A3424;border-color:#A8442F}#tu2-card button.lnk{background:none;border:none;color:#B5AA96;text-decoration:underline;padding:4px 2px}'
    + '#tu2-card .tu2-wait{color:#9FC59A;font-size:12px}#tu2-card.ok{border-top-color:#5E9A58}'
    + '.tu2-list{display:grid;gap:6px;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));margin:6px 0}.tu2-list>div{background:#221D29;border:1px solid rgba(201,161,58,.3);border-radius:6px;padding:6px 10px;display:flex;justify-content:space-between;align-items:center;gap:6px}.tu2-list small{color:#9FC59A}'
    + '@media (pointer:coarse){#tu2-card button{min-height:40px;padding:6px 12px}}';
  document.head.appendChild(css);
  let card = null, ring = null, arrow = null, cur = null, ctxHub = null; const queue = [];
  const mk = () => {
    if (card && card.isConnected) return;
    ring = document.createElement('div'); ring.id = 'tu2-ring'; arrow = document.createElement('div'); arrow.id = 'tu2-arrow';
    card = document.createElement('div'); card.id = 'tu2-card'; card.setAttribute('role', 'dialog'); card.setAttribute('aria-live', 'polite');
    document.body.append(ring, arrow, card);
  };
  const hide = () => { if (card) { card.hidden = true; ring.hidden = true; arrow.hidden = true; } };
  const resolve = el => { if (!el) return null; let e = typeof el === 'function' ? el() : el; if (typeof e === 'string') e = [...document.querySelectorAll(e)].find(x => x.offsetParent !== null || getComputedStyle(x).position === 'fixed'); if (!e || !e.getBoundingClientRect) return null; const r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2 ? r : null; };
  const render = () => {
    mk(); const c = CH[cur.id], s = c.steps[cur.i], n = c.steps.length, auto = s.k || s.ok;
    card.classList.remove('ok'); card.hidden = false;
    card.innerHTML = '<div class="tu2-h"><b class="tu2-t">' + esc(s.t) + '</b><small>' + esc(c.n) + '・' + (cur.i + 1) + '／' + n + '</small></div><div>' + s.d() + '</div>'
      + '<div class="tu2-dots">' + c.steps.map((_, i) => '<i class="' + (i <= cur.i ? 'on' : '') + '"></i>').join('') + '</div>'
      + '<div class="tu2-row">' + (auto ? '<span class="tu2-wait" style="margin-right:auto">做到了會自己跳下一步</span>' : '')
      + '<button type="button" class="lnk" data-tu="off">關掉教學</button><button type="button" class="lnk" data-tu="skip">跳過這段</button>'
      + (cur.i ? '<button type="button" data-tu="prev">上一步</button>' : '') + '<button type="button" class="pri" data-tu="next">' + (cur.i === n - 1 ? '完成' : auto ? '略過' : '下一步') + '</button></div>';
    card.querySelectorAll('[data-tu]').forEach(b => { b.onclick = e => { e.stopPropagation(); const a = b.dataset.tu; if (a === 'next') go(1); else if (a === 'prev') go(-1); else if (a === 'skip') end(true); else if (a === 'off') { const t = st(); if (t) { t.on = 0; save(); } queue.length = 0; end(true); R.toast && R.toast('教學關掉了。城裡的選單「新手教學」可以重看、重新打開。'); } }; });
    cur.mark = s.k ? since(s.k) : null; place();
  };
  const place = () => {
    if (!cur || !card || card.hidden) return; const s = CH[cur.id].steps[cur.i], r = resolve(s.el), vw = innerWidth, vh = innerHeight, cw = card.offsetWidth, ch = card.offsetHeight;
    let x, y;
    if (r) {
      Object.assign(ring.style, { left: r.left - 6 + 'px', top: r.top - 6 + 'px', width: r.width + 12 + 'px', height: r.height + 12 + 'px' }); ring.hidden = false;
      const below = r.bottom + ch + 24 < vh, above = r.top - ch - 24 > 0;
      x = Math.max(10, Math.min(vw - cw - 10, r.left + r.width / 2 - cw / 2));
      if (r.top > vh * 0.5 && above) { y = r.top - ch - 22; arrow.textContent = '▼'; arrow.style.top = r.top - 26 + 'px'; }
      else if (below) { y = r.bottom + 22; arrow.textContent = '▲'; arrow.style.top = r.bottom + 2 + 'px'; }
      else { y = above ? r.top - ch - 22 : 10; arrow.textContent = '▼'; arrow.style.top = r.top - 26 + 'px'; }
      arrow.style.left = r.left + r.width / 2 - 8 + 'px'; arrow.hidden = false;
    } else { ring.hidden = true; arrow.hidden = true; x = (vw - cw) / 2; y = touch() ? 10 : Math.max(10, vh * 0.16); }
    card.style.left = x + 'px'; card.style.top = Math.max(6, Math.min(vh - ch - 6, y)) + 'px';
  };
  const go = d => { if (!cur) return; const n = CH[cur.id].steps.length; cur.i += d; if (cur.i < 0) cur.i = 0; if (cur.i >= n) { end(false); return; } render(); };
  const end = skipped => { if (!cur) return; const t = st(); if (t) { t.seen[cur.id] = skipped ? 's' : 1; save(); } const id = cur.id; cur = null; hide(); if (!skipped && R.toast) R.toast('「' + CH[id].n + '」教學完成！'); setTimeout(pump, 600); };
  const start = (id, force) => { const t = st(); if (!t || !CH[id]) return; if (!force && (t.seen[id] || !t.on)) return; if (cur) { if (cur.id === id) return; if (force) { cur = null; } else { if (queue.indexOf(id) < 0) queue.push(id); return; } } if (!ok(id)) { if (force) R.toast && R.toast('到「' + CH[id].n + '」的地方才看得到這段教學，到了會自己開始。'); if (queue.indexOf(id) < 0) queue.push(id); if (force) t.seen[id] = 0; return; } cur = { id, i: 0 }; render(); };
  const pump = () => { if (cur) return; for (let k = 0; k < queue.length; k++) { const id = queue[k], t = st(); if (!t || t.seen[id]) { queue.splice(k--, 1); continue; } if (ok(id)) { queue.splice(k, 1); cur = { id, i: 0 }; render(); return; } } };
  const want = id => { const t = st(); if (t && t.on && !t.seen[id] && queue.indexOf(id) < 0) queue.push(id); };
  setInterval(() => {
    poll();
    if (cur) {
      const c = CH[cur.id], s = c.steps[cur.i];
      if (!ok(cur.id)) { hide(); if (queue.indexOf(cur.id) < 0) queue.unshift(cur.id); cur = null; return; }
      if (card.hidden) render();
      const did = (cur.mark && cur.mark()) || (s.ok && s.ok());
      if (did && !cur.wait) { cur.wait = 1; card.classList.add('ok'); setTimeout(() => { if (cur) { cur.wait = 0; go(1); } }, 650); }
      place();
    } else pump();
  }, 250);
  addEventListener('resize', () => place());
  // 遺跡裡走到東西旁邊的一次性提示
  const once = (k, txt) => { const t = st(); if (!t || !t.on) return; t.hint = t.hint || {}; if (t.hint[k]) return; t.hint[k] = 1; save(); R.toast && R.toast(txt); };
  const pr = () => { const p = $('r-prompt'); if (!p || p.hidden || !inRun()) return; const s = p.textContent; if (/樓梯|往下/.test(s)) once('stairs', '樓梯：越下面越難，也越好拿。'); else if (/營火/.test(s)) once('camp', '營火：休息、存檔、回城。'); else if (/寶箱/.test(s)) once('chest', '寶箱：裡面多半是裝備。'); };
  setInterval(pr, 700);
  // ---------- 接上遊戲 ----------
  const hub0 = R.hub; if (hub0) R.hub = (t, f) => { const r = hub0(t, f); ctxHub = t; if (CH[t]) { want(t); } return r; };
  const lf0 = R.loadFloor; if (lf0) R.loadFloor = (...a) => { const r = lf0(...a); try { ctxHub = null; want('combat'); want('ruin'); const c = R.S && R.S.cls; if (CH[c]) want(c); if (W.F && W.F.boss) once('boss', 'BOSS 層！'); } catch (e) { } return r; };
  const offer = () => {
    const t = st(); if (!t) return; mk(); cur = null; card.hidden = false; ring.hidden = true; arrow.hidden = true;
    card.innerHTML = '<div class="tu2-h"><b class="tu2-t">新版新手教學</b><small>只問這一次</small></div><div>要開著一步一步的小提示嗎？</div><div class="tu2-row"><button type="button" data-o="0">不用了</button><button type="button" class="pri" data-o="1">好，開著</button></div>';
    card.style.left = (innerWidth - card.offsetWidth) / 2 + 'px'; card.style.top = (touch() ? 10 : innerHeight * 0.16) + 'px';
    card.querySelectorAll('[data-o]').forEach(b => { b.onclick = () => { t.offered = 1; t.on = b.dataset.o === '1' ? 1 : 0; if (t.on) ['basics'].forEach(k => { t.seen[k] = 's'; }); save(); hide(); R.toast && R.toast(t.on ? '好！選單「新手教學」可以重看。' : '選單「新手教學」隨時能開。'); }; });
  };
  const isOld = s => !!(s && ((s.lv || 1) > 1 || (s.day || 1) > 1 || (s.tut && Object.keys(s.tut).some(k => k !== 'seen'))));
  const en0 = R.enterTownNow; if (en0) R.enterTownNow = (...a) => {
    const r = en0(...a); ctxHub = null;
    try { const s = S(); if (s && W.town && !W.town.hosu) { if (!s.tut2) { const old = isOld(s); st(); if (old) { s.tut2.on = 0; save(); setTimeout(offer, 1500); } else { save(); want('basics'); } } else want('basics'); } } catch (e) { }
    return r;
  };
  // 原本的「東鶴指南」第一次進城會自己打開：新玩家有了一步一步的教學，就先不跳（選單裡照樣有）
  R.tutSheet = () => {
    const t = st(); if (!t) return;
    R.sheet('<p class="kicker">說明</p><h2>新手教學</h2><p class="note">點「看」重看一段；在那個地方才會出現的段落，到了會自己開始。</p><div class="tu2-list">'
      + ORDER.map(id => '<div><span>' + esc(CH[id].n) + (t.seen[id] === 1 ? ' <small>✓</small>' : '') + '</span><button type="button" class="mini" data-tus="' + id + '">看</button></div>').join('') + '</div>',
      '<div class="row"><button type="button" class="btn" id="tu2-tg">' + (t.on ? '關掉自動提示' : '打開自動提示') + '</button><button type="button" class="btn" id="tu2-rs">全部重來</button>' + (R.guideSheet ? '<button type="button" class="btn" id="tu2-gd">東鶴指南</button>' : '') + '<button type="button" class="btn pri" id="tu2-x">關閉</button></div>');
    $('tu2-x').onclick = R.closeSheet; if ($('tu2-gd')) $('tu2-gd').onclick = () => { R.closeSheet(); setTimeout(R.guideSheet, 50); };
    $('tu2-tg').onclick = () => { t.on = t.on ? 0 : 1; save(); R.closeSheet(); setTimeout(R.tutSheet, 30); };
    $('tu2-rs').onclick = () => { t.seen = {}; t.hint = {}; t.on = 1; save(); R.closeSheet(); R.toast && R.toast('教學重新開始：到每個地方都會再出現一次。'); want('basics'); };
    document.querySelectorAll('[data-tus]').forEach(b => { b.onclick = () => { t.on = 1; R.closeSheet(); setTimeout(() => start(b.dataset.tus, true), 80); }; });
  };
  const tm = R.townMenu; if (tm) R.townMenu = (...a) => { const r = tm(...a), row = $('r-sheet') && $('r-sheet').querySelector('.row'); if (row && !row.querySelector('#tu2-open')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'tu2-open'; b.textContent = '新手教學'; b.onclick = () => { R.closeSheet(); setTimeout(R.tutSheet, 50); }; row.insertBefore(b, row.children[1] || null); } return r; };
  // 2026-10-13 遺跡的暫停選單（Esc）：「職業教學」＝馬上重看這個職業的教學
  const ps = R.pauseSheet; if (ps) R.pauseSheet = (...a) => { const r = ps(...a); try { const c = R.S && R.S.cls, sh = $('r-sheet'); if (CH[c] && sh && !sh.querySelector('#tu2-cls')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'tu2-cls'; b.textContent = '職業教學'; b.onclick = () => { R.closeSheet(); if (W.paused) W.paused = false; const t = st(); if (t) t.on = 1; setTimeout(() => start(c, true), 120); }; const row = sh.querySelector('.row') || sh; row.appendChild(b); } } catch (e) { } return r; };
  R.tut2 = { start: id => start(id, true), chapters: CH, ev };
})(window.R);
