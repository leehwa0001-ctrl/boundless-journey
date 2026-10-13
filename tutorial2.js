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
  const poll = () => { const I = R.input || {}; if (I.moveStick) hit('move'); if (I.fire) hit('fire'); if (I.run) hit('run'); };
  const since = k => { const v = ev[k] || 0; return () => (ev[k] || 0) > v; };
  // ---------- 段落 ----------
  // 每一步：t 標題、d 說明（函式，電腦／手機分開）、el 要框起來的東西、go 開始時記錄、ok 做到了沒（沒有＝按「下一步」）
  const step = (t, d, el, ok) => ({ t, d, el, ok });
  const evStep = (t, d, el, k) => ({ t, d, el, k });
  const CH = {
    basics: { n: '基本操作', ctx: () => !!W.town && !inHub() && !(R.sheetOpen && R.sheetOpen()), steps: [
      evStep('走路', () => T('用 <kbd>W A S D</kbd> 或方向鍵走路。', '用左手拇指在畫面左下拖曳就能走，手指按哪裡搖桿就在哪裡。'), () => touch() ? '#joy-l' : null, 'move'),
      evStep('跑步', () => T('按住 <kbd>Shift</kbd> 跑起來。', '把搖桿推到最外圈就會跑。'), () => touch() ? '#joy-l' : null, 'run'),
      step('互動', () => T('走到門口、人、告示板旁邊，畫面下方會出現提示，按 <kbd>空白鍵</kbd> 互動。', '走近門口或人，下方出現提示時點「互動」。'), '#r-prompt'),
      evStep('接駁馬車', () => T('按 <kbd>T</kbd> 叫公會的接駁馬車，選地點直接過去。在店裡、家裡叫也會先自己走出門。', '點「馬車」叫公會的接駁馬車，選地點直接過去。'), null, 'ft'),
      step('下一步去哪', () => '左上角的小框會寫新手的下一步，旁邊的「前往」可以直接搭車過去。先去<b>公會東鶴分館</b>接委託吧！', '#gd-box')
    ] },
    combat: { n: '戰鬥', ctx: inRun, steps: [
      evStep('普通攻擊', () => T('用滑鼠瞄準，按 <kbd>左鍵</kbd> 攻擊。', '右邊的搖桿拖曳瞄準、放開出手；也可以直接點敵人。'), () => touch() ? '#joy-r' : null, 'fire'),
      evStep('技能', () => T('技能在下方的技能列：<kbd>右鍵</kbd>（或 <kbd>R</kbd>）、<kbd>3</kbd> <kbd>4</kbd> <kbd>5</kbd> <kbd>6</kbd> 施放，圓圈轉完才能再用。', '點下方的技能鈕施放，圓圈轉完才能再用。'), '#r-skill', 'skill'),
      step('血量和魔力', () => '左下是生命（紅）和魔力（藍）。生命見底就會被抬回城裡，背包裡沒帶出來的東西會掉一些。', '#r-hp'),
      step('回復藥', () => T('快沒血時按 <kbd>1</kbd> 或點藥瓶喝回復藥（<kbd>2</kbd> 是魔力藥）。藥在白藤堂買。', '快沒血時點藥瓶喝回復藥。藥在白藤堂買。'), '#r-pot'),
      step('閃避', () => T('點一下 <kbd>Shift</kbd> 翻滾，翻滾中不會受傷（按住是跑步）。', '點翻滾鈕閃開，翻滾中不會受傷。'), '#r-dodge-cd'),
      evStep('地圖', () => T('按 <kbd>Tab</kbd> 或 <kbd>M</kbd> 看這一層的地圖。', '點地圖鈕看這一層的地圖。'), () => touch() ? '#r-map' : null, 'map')
    ] },
    ruin: { n: '遺跡', ctx: inRun, steps: [
      step('樓層', () => '遺跡一層一層往下：每一層由好幾間房間和走廊組成，打開房間的門會關上，清完才打開。', '#r-where'),
      step('樓梯', () => '離入口最遠的房間有往下的樓梯。越深越難，掉的東西也越好。', null),
      step('營火', () => '營火旁邊可以休息回血、存檔，也能從這裡回城。', null),
      step('BOSS', () => '最後一層的最深處是 BOSS 房，打倒就能帶著戰利品回城。回城後記得去公會<b>繳交委託</b>、去鐵匠鋪<b>鑑定</b>。', '#r-boss')
    ] },
    guild: { n: '公會', ctx: () => inHub('guild'), steps: [
      step('上方狀態列', () => '這裡一直顯示段位進度、手上的委託，可以直接「繳交」或「放棄」。', '.gh-bar'),
      step('分頁', () => T('上面的暖簾是分頁，數字鍵 <kbd>1</kbd>～<kbd>7</kbd> 也能切換，按 <kbd>/</kbd> 跳到搜尋。', '點上面的暖簾切換分頁。'), '.gh-noren'),
      step('委託', () => '點「委託」分頁：每張委託單寫了等級和報酬，可以篩選、排序、只看接得了的。', '.gh-tab[data-ght="quest"]', () => tabOn('.gh-tab[data-ght="quest"]')),
      step('鎖住的委託', () => '鎖住的委託會寫原因，例如「需 Lv38」或段位不夠。多解委託升段位就會開放。', () => byText('#hub .quest', /需|未開放|段位/)),
      step('加注條款', () => '接委託前可以加條款，讓遺跡更難、報酬更多。總倍率固定顯示在下面，「全部不加」一鍵取消。', () => byText('#hub h3, #hub .gh-cf-card', /條款/)),
      step('勇者證', () => '「勇者證」分頁看等級、熟練度和任務成績（五軌制）。', '.gh-tab[data-ght="card"]', () => tabOn('.gh-tab[data-ght="card"]'))
    ] },
    stash: { n: '倉庫', ctx: () => inHub('stash'), steps: [
      step('格子倉庫', () => '每件裝備佔的格子大小不一樣，要自己排放。上面的容量條快滿會變紅。', '.tk-grid'),
      evStep('搬動', () => T('按住裝備拖到別的格子放開。', '按住裝備拖到別的格子放開。'), '.tk-grid', 'drag'),
      evStep('旋轉', () => T('拖著裝備時按 <kbd>R</kbd> 轉 90 度，塞得更緊。', '點「旋轉」把選到的裝備轉 90 度。'), () => document.querySelector('[data-tkrot]') || '.tk-grid', 'rot'),
      step('箱子', () => '箱子放在倉庫裡，點開可以在裡面再放東西，整理小件裝備很好用。加大倉庫在下方的卡片買。', () => document.querySelector('.tk-box') || '.tk-grid'),
      step('換裝與批次賣出', () => T('滑鼠移到裝備上，右邊會跟身上的比較。上鎖的裝備批次賣出時會跳過。', '點裝備看詳細數值和身上那件的比較。上鎖的裝備批次賣出時會跳過。'), null)
    ] },
    smith: { n: '鐵匠鋪', ctx: () => inHub('smith'), steps: [
      step('分頁', () => '鑑定、強化、製作、分解分在不同分頁。從遺跡帶回來的<b>未鑑定</b>裝備要先鑑定才有完整數值。', '#hub .gh-noren, #hub .subtabs'),
      step('強化預覽', () => '強化前會顯示數值變化；按不了的按鈕會寫原因，例如還差多少費拉。', null),
      step('分解', () => '分解拿素材，不能復原所以會先確認。上鎖、穿在身上的不會被分解。', null)
    ] },
    shop: { n: '白藤堂', ctx: () => inHub('shop'), steps: [
      step('買藥', () => '「藥品」分頁買回復藥、魔力藥，可以一次買 5 瓶或用身上的錢買滿。', '[data-hkt="med"]'),
      step('藥草', () => '遺跡裡撿的藥草 3 株換 1 瓶回復藥，「全部換」一鍵換完。', null),
      step('背包', () => '「背包」分頁買更大的背包，在遺跡裡能多帶東西回來。', '[data-hkt="bag"]')
    ] },
    archer: { n: '弓箭手：續力', ctx: inRun, steps: [
      evStep('續力', () => T('按住 <kbd>左鍵</kbd> 續力、放開射出。沒蓄力＝沒傷害，蓄滿＝100%（普攻 2 秒、技能 4 秒）。', '按住右邊搖桿續力、放開射出。沒蓄力＝沒傷害，蓄滿＝100%。'), () => touch() ? '#joy-r' : null, 'fire'),
      step('續力條', () => '左下角角色資訊上方的續力條顯示蓄了幾 %，和現在搭上的箭矢。', () => byText('#run div', /續力|蓄力/) ),
      evStep('換箭矢', () => T('傷害型技能是一種箭矢：按技能鍵「換上」，再按一次卸下，射出去才扣魔力和冷卻。', '點技能鈕「換上」箭矢，再點一次卸下，射出去才扣魔力和冷卻。'), '#r-skill', 'skill'),
      step('武器差別', () => '長弓能蓄到 120%；十字弩會自己蓄滿，點一下就射。攻速越高蓄得越快。', null)
    ] },
    arraymage: { n: '術陣師：陣紋', ctx: inRun, steps: [
      evStep('畫陣紋', () => T('按 <kbd>X</kbd> 打開陣紋畫面：點節點＝核心（普攻加成），拖過節點＝線段（技能加成），拖回起點＝閉環（腳下光環），右鍵刪掉。', '點職業條打開陣紋畫面：點節點＝核心，拖過節點＝線段，拖回起點＝閉環。'), '#core-g', 'cls'),
      step('施法', () => T('按技能會先顯示 50% 透明的範圍，<kbd>左鍵</kbd> 確認後蓄力放出。技能中心只要在普攻範圍內，哪裡都能放（增益、回復也是）。', '點技能先顯示範圍，再點一下確認。技能中心只要在普攻範圍內，哪裡都能放。'), '#r-skill'),
      step('節點數', () => '能用的節點一開始 2 個，每 5 級多 1 個，最多 7 個。', null)
    ] },
    mage: { n: '術士：普攻上元素、技能引爆', ctx: inRun, steps: [   // 2026-10-13 術士：元素反應（elemreact.js）
      evStep('換元素', () => T('點一下 <kbd>X</kbd> 換普攻的元素：火 → 冰 → 雷 → 木。', '點一下職業條換普攻的元素：火 → 冰 → 雷 → 木。'), '#core-g', 'cls'),
      evStep('上元素', () => T('用 <kbd>左鍵</kbd> 普攻打中敵人，牠頭上會出現元素小方塊（留 5 秒）。', '用右搖桿普攻打中敵人，牠頭上會出現元素小方塊（留 5 秒）。'), () => touch() ? '#joy-r' : null, 'fire'),
      evStep('技能引爆', () => T('再用技能（<kbd>右鍵</kbd>）打牠：技能的元素跟方塊不一樣就會引爆，例如火＋冰＝蒸發。', '再點技能鈕打牠：技能的元素跟方塊不一樣就會引爆，例如火＋冰＝蒸發。'), '#r-skill', 'skill'),
      step('反應表', () => T('按住 <kbd>X</kbd> 會跳出反應表，放開就關。表上也能直接點「風」「金」：風會把元素傳給旁邊的敵人，金會打破護甲。', '長按職業條會跳出反應表，點外面就關。表上也能直接點「風」「金」：風會把元素傳給旁邊的敵人，金會打破護甲。'), '#core-g'),
      step('法術書', () => '技能是你自己配的法術：暫停選單（Esc）→「法術書」，每一句選元素、形狀、效果，再綁到技能格。', null)
    ] },
    summoner: { n: '召喚師：意念與收回', ctx: inRun, steps: [   // 2026-10-13 召喚師
      evStep('意念', () => T('點一下 <kbd>X</kbd> 換意念：集火 → 護衛 → 狂奔。', '點一下職業條換意念。'), '#core-g', 'cls'),
      evStep('協同攻擊', () => T('普攻不花魔力。用 <kbd>左鍵</kbd> 普攻打中敵人時，召喚物會馬上一起撲上去（2.5 秒一次）。', '普攻不花魔力。用右搖桿普攻打中敵人時，召喚物會馬上一起撲上去（2.5 秒一次）。'), () => touch() ? '#joy-r' : null, 'fire'),
      step('收回', () => T('按住 <kbd>X</kbd> 0.5 秒＝收回所有召喚物，退回一半魔力。', '長按職業條＝收回所有召喚物，退回一半魔力。'), '#core-g'),
      step('魔力', () => '召喚物不限時間，但每隻每秒吃一點魔力；職業條下面寫著現在每秒吃多少。魔力見底時最弱的那隻先散掉。', null),
      step('帶召喚獸', () => '每次進遺跡，休息區會問你這一趟要帶哪些召喚獸（最多五格）。進去之後就不能換，在休息區可以按左下角的按鈕再改。你的身體很脆弱，讓召喚物站在前面。', null),
      step('轉職', () => '轉職三選一：萬獸師（召喚物一直疊，人海戰術）、死靈法師（讓倒下的敵人站起來替你打；「獻祭」只有它有）、式神使（式神少但很強，替你分擔傷害）。', null)
    ] },
    scroll: { n: '符卷師：卷軸', ctx: inRun, steps: [   // 2026-10-13 符卷師重做
      step('寫卷軸', () => '回城到白藤堂的「符卷師的書桌」：在符卷書裡配法術、綁技能格，再寫到牛皮紙上。', null),
      evStep('撕卷', () => T('按技能鍵撕開一張寫好的卷軸：馬上放出、不耗魔力。快速連撕＝齊發。', '點技能鈕撕開一張卷軸；連點＝齊發。'), '#r-skill', 'skill'),
      step('卷軸數', () => '左上角顯示卷軸的張數。戰鬥中不會扣錢。', () => document.getElementById('r-scrolls'))
    ] },
    bard: { n: '吟遊詩人：樂譜', ctx: inRun, steps: [
      evStep('和弦', () => T('按一下 <kbd>X</kbd> 換和弦（大調／小調）。', '點一下職業條換和弦。'), '#core-g', 'cls'),
      step('寫樂譜', () => T('按住 <kbd>X</kbd> 0.45 秒開始錄：10 秒內的普攻、技能會寫成音符。', '長按職業條開始錄：10 秒內的普攻、技能會寫成音符。'), '#core-g'),
      step('演奏', () => '之後每次出手都會先照樂譜演奏 2 秒再發出攻擊；樂譜是空的，普攻就不會出手。', null)
    ] },
    blade: { n: '刀客：收刀與刀意', ctx: inRun, steps: [   // 2026-10-13 刀客重製
      step('先衝再砍', () => '刀客的普攻會先往前衝再出手，前面有敵人就停在牠前面。橫斬、直劈、突刺會照周圍敵人數自動選。', null),
      evStep('收刀', () => T('按 <kbd>X</kbd> 收刀（讀條 2 秒，走路變慢）。收刀時不能普攻和放技能，大招可以。', '點職業條收刀（讀條 2 秒，走路變慢）。收刀時不能普攻和放技能，大招可以。'), '#core-g', 'cls'),
      step('居合', () => '收刀 4 秒刀意集滿，下一次普攻或技能就是「居合」：大範圍、傷害 ×2，之後 5 秒「殘心」減傷 20%。', '#core-g'),
      step('反切', () => T('拔刀時普攻打中也會漲刀意。拔刀＋刀意滿＝「刀意渾圓」，這時被打會自動「反切」：不受傷、回砍一刀。再按 <kbd>X</kbd> 拔刀。', '拔刀時普攻打中也會漲刀意。拔刀＋刀意滿＝「刀意渾圓」，這時被打會自動「反切」：不受傷、回砍一刀。再點職業條拔刀。'), null)
    ] },
    warrior: { n: '戰士：怒氣', ctx: inRun, steps: [   // 2026-10-13 每個職業都有職業教學
      step('怒氣', () => '戰士用「怒氣」放技能，不用魔力。打中敵人、被敵人打都會漲；4 秒沒打也沒被打就慢慢掉。', '#core-g'),
      evStep('先打', () => T('用 <kbd>左鍵</kbd> 普攻打幾下，看職業條的怒氣漲起來。', '用右搖桿普攻打幾下，看職業條的怒氣漲起來。'), () => touch() ? '#joy-r' : null, 'fire'),
      evStep('怒吼', () => T('怒氣到 50 以上時按 <kbd>X</kbd> 怒吼：把怒氣全部吼出去，越多越痛，之後 6 秒傷害提高。', '怒氣到 50 以上時點職業條怒吼：把怒氣全部吼出去，越多越痛，之後 6 秒傷害提高。'), '#core-g', 'cls')
    ] },
    gunner: { n: '槍手：換彈與彈種', ctx: inRun, steps: [
      step('彈匣', () => '槍手的子彈有限，職業條寫著還剩幾發。打完會自動換彈。', '#core-g'),
      evStep('完美換彈', () => T('換彈時職業條會出現金色的一格，指針走到金色那一格時按 <kbd>X</kbd>：馬上換好，這一匣傷害 +25%。按錯會卡彈一下。', '換彈時職業條會出現金色的一格，指針走到金色那一格時點職業條：馬上換好，這一匣傷害 +25%。'), '#core-g', 'cls'),
      step('換彈種', () => T('彈匣是滿的時候按 <kbd>X</kbd> 換子彈：一般 → 穿甲（打硬的）→ 燃燒 → 冰凍（讓敵人變慢）。', '彈匣是滿的時候點職業條換子彈：一般 → 穿甲（打硬的）→ 燃燒 → 冰凍（讓敵人變慢）。'), '#core-g')
    ] },
    knight: { n: '騎士：舉盾', ctx: inRun, steps: [
      evStep('舉盾', () => T('按住 <kbd>X</kbd> 舉盾，擋住前面打來的攻擊 80%。放開就放下盾。', '按住職業條舉盾，擋住前面打來的攻擊 80%。放開就放下盾。'), '#core-g', 'cls'),
      step('完美防禦', () => '敵人快打到你的時候才舉盾（剛舉起的一瞬間被打）＝完美防禦：幾乎不受傷，對方暈 1.5 秒，還會回體力。', '#core-g'),
      step('自動盾擊', () => '舉著盾被打到，會自動用盾撞回去。舉盾時身邊的隊友也比較不痛。舉盾會花體力，體力沒了就舉不起來。', null)
    ] },
    priest: { n: '牧師：信仰與神蹟', ctx: inRun, steps: [
      step('信仰', () => '補血、給護盾、放祝福都會攢「信仰」（職業條）。補過頭的量會變成一道光，打最近的敵人。', '#core-g'),
      evStep('補血', () => T('用技能（<kbd>右鍵</kbd>、<kbd>3</kbd>～<kbd>6</kbd>）補血或祝福，看信仰漲起來。', '點技能鈕補血或祝福，看信仰漲起來。'), '#r-skill', 'skill'),
      step('神蹟', () => T('信仰滿 100 時按 <kbd>X</kbd> 放神蹟：自己和隊友回 30% 生命、清掉壞狀態，周圍的敵人也會被打。', '信仰滿 100 時點職業條放神蹟：自己和隊友回 30% 生命、清掉壞狀態，周圍的敵人也會被打。'), '#core-g')
    ] },
    enchanter: { n: '附魔師：刻印', ctx: inRun, steps: [
      evStep('換刻印', () => T('按 <kbd>X</kbd> 換武器上的刻印：焰 → 霜 → 雷 → 風 → 金。', '點職業條換武器上的刻印：焰 → 霜 → 雷 → 風 → 金。'), '#core-g', 'cls'),
      step('刻印的效果', () => '焰：技能更痛、會燒。霜：讓敵人變慢。雷：技能冷卻更快、打得更快。風：普攻會射出劍氣。金：打破護甲。', '#core-g'),
      evStep('攢力量', () => T('用 <kbd>左鍵</kbd> 普攻打中敵人會攢刻印的力量，攢滿了自動放出來。', '用右搖桿普攻打中敵人會攢刻印的力量，攢滿了自動放出來。'), () => touch() ? '#joy-r' : null, 'fire')
    ] },
    monk: { n: '武術家：四法與勢', ctx: inRun, steps: [   // 2026-10-13 作者：武術家也要職業提示（monkstance.js）
      evStep('換法', () => T('按 <kbd>X</kbd> 依序換「法」：拳法 → 掌法 → 步法 → 腿法 → 拳法。', '點職業條依序換「法」：拳法 → 掌法 → 步法 → 腿法 → 拳法。'), '#core-g', 'cls'),
      step('四種法', () => '拳法出拳快；掌法把敵人打飛；步法每一拳往前跨一步；腿法很慢但一腳很重、範圍大。', '#core-g'),
      evStep('攢勢', () => T('普攻打中會累積「勢」（每下 +10，滿 100）。先用 <kbd>左鍵</kbd> 打幾下看看。', '用右搖桿普攻打中敵人，累積「勢」（每下 +10，滿 100）。'), () => touch() ? '#joy-r' : null, 'fire'),
      step('勢爆發', () => '勢滿了再換法，換過去的那一法會「爆發」：掌法一掌把敵人打飛撞牆、步法瞬間閃到敵人面前、腿法兩腳超重擊、拳法一陣子多揮一下。畫面下方會顯示爆發還剩多久。', null),
      step('攻速', () => '裝備和天賦的攻速對武術家沒用，會換成普攻傷害。詳細的接法在職業說明「？」→「技能機制說明」。', null)
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
  const pr = () => { const p = $('r-prompt'); if (!p || p.hidden || !inRun()) return; const s = p.textContent; if (/樓梯|往下/.test(s)) once('stairs', '樓梯：往下一層更難、掉的東西更好。下去之前先確認血和藥。'); else if (/營火/.test(s)) once('camp', '營火：休息回血、存檔，也可以從這裡回城。'); else if (/寶箱/.test(s)) once('chest', '寶箱：常放在死路，裡面多半是未鑑定的裝備。'); };
  setInterval(pr, 700);
  // ---------- 接上遊戲 ----------
  const hub0 = R.hub; if (hub0) R.hub = (t, f) => { const r = hub0(t, f); ctxHub = t; if (CH[t]) { want(t); } return r; };
  const lf0 = R.loadFloor; if (lf0) R.loadFloor = (...a) => { const r = lf0(...a); try { ctxHub = null; want('combat'); want('ruin'); const c = R.S && R.S.cls; if (CH[c]) want(c); if (W.F && W.F.boss) once('boss', 'BOSS 層！打倒 BOSS 就能帶著戰利品回城。'); } catch (e) { } return r; };
  const offer = () => {
    const t = st(); if (!t) return; mk(); cur = null; card.hidden = false; ring.hidden = true; arrow.hidden = true;
    card.innerHTML = '<div class="tu2-h"><b class="tu2-t">新版新手教學</b><small>只問這一次</small></div><div>教學改成一步一步的小提示，也加了公會、倉庫、鐵匠鋪、白藤堂和各職業的說明。要開著嗎？</div><div class="tu2-row"><button type="button" data-o="0">不用了</button><button type="button" class="pri" data-o="1">好，開著</button></div>';
    card.style.left = (innerWidth - card.offsetWidth) / 2 + 'px'; card.style.top = (touch() ? 10 : innerHeight * 0.16) + 'px';
    card.querySelectorAll('[data-o]').forEach(b => { b.onclick = () => { t.offered = 1; t.on = b.dataset.o === '1' ? 1 : 0; if (t.on) ['basics'].forEach(k => { t.seen[k] = 's'; }); save(); hide(); R.toast && R.toast(t.on ? '好！到新的地方會出現小提示。城裡的選單「新手教學」可以重看。' : '城裡的選單「新手教學」隨時可以打開。'); }; });
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
