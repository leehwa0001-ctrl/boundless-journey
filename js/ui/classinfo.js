// 職業說明的「？」（2026-10-08 作者：每個職業多一個問號，按下去顯示這個職業的特色、職業效果、技能等等）
// - 出現在：捏角最後一步選武器（每一類的標題旁邊）、公會登記處的「武器登記」（每一列）。
// - 內容：基本數值、武器、職業特效（classcore.js 的 help）、大招、技能書的技能、三條轉職路線（被動、路線大招、路線技能）。
// - 視窗是自己開的（#ci-modal，最上層；Esc、點外面、「知道了」關掉）。
// - 用 MutationObserver 找畫面上的 .reg-group、.cls-row 補上按鈕（不改 creator.js、hub.js 原本的字串）。
// 放在 classcore.js、monkstance.js、ult.js、ultpath.js、skillbook.js、creator.js、hub.js 後面。
(function (R) {
  const esc = s => R.esc(String(s == null ? '' : s)), $ = id => document.getElementById(id);
  const fakeP = cls => ({ cls, adv: '', lv: 1, ws: {}, item: null, hp: 1, hpMax: 1, mp: 0, mpMax: 0, x: 0, z: 0 });
  const helpOf = cls => { const c = R.CORE && R.CORE[cls]; if (!c) return null; let t = ''; try { t = c.help ? c.help(fakeP(cls)) : ''; } catch (e) { t = ''; } return { name: c.name || '', t }; };
  const skillsOf = (cls, adv) => Object.values(R.SKILL_LIB || {}).filter(s => s && s.cls === cls && (adv ? s.adv === adv : !s.adv)).sort((a, b) => (a.lv || 0) - (b.lv || 0));
  const chip = s => '<span class="ci-sk"><i>Lv ' + (s.lv || 1) + '</i>' + esc(s.name) + '</span>';
  // ---------- 說明的文字（2026-10-09 作者：介紹用省略的語氣講特色，不要直接講數值） ----------
  const CORE_T = {
    gunner: '抓準時機換彈，這一匣更痛。彈匣滿時可換彈種。',
    archer: '按住左鍵蓄力，越滿越痛。技能是箭矢，先換上再射。',
    warrior: '用怒氣放技能。怒氣夠多就吼出去，之後更痛。',
    mage: '普攻替敵人上元素，用不同元素的技能打就會引爆。法術自己配。',
    priest: '補血、祝福攢信仰，滿了放「神蹟」。',
    blade: 'X 收刀攢刀意，滿了出「居合」；拔刀時被打會「反切」。',
    knight: '按住 X 舉盾；剛舉盾就被打＝完美格擋，對方暈。',
    monk: 'X 換四種法。普攻攢「勢」，滿了換法就爆發。',
    bard: 'X 換和弦，按住 X 錄樂譜。出手前先照樂譜演奏。',   // 2026-10-11：照和弦與樂譜（bardchord.js）改寫；同日再改：演奏照樂譜耗魔、技能照最大魔力
    summoner: '身體較脆，召喚物很強。X 換意念、按住 X 收回。',
    arraymage: 'X 畫陣紋：核心加強普攻、線段加強技能、Loop 變光環。',
    enchanter: 'X 換武器刻印。普攻攢力量，滿了自動放出。',
    scroll: '在書桌寫卷軸，戰鬥中撕開＝馬上放、不耗魔力。'
  };
  const ULT_T = {
    gunner: '朝準心扇形狂掃一陣，掃射時不會受傷；結束後射速變快一陣子。',
    archer: '一大片箭雨落下，落點的敵人變慢；之後一陣子更容易暴擊、跑得更快。',
    warrior: '跳起來劈下、整片地裂開，武器越長範圍越大；落地後一陣子更耐打。',
    mage: '三重咒：下一句法術傷害 ×3、不耗魔力，技能冷卻全部歸零。',
    priest: '光柱降下，自己和隊友回滿；一陣子內倒下會原地站起來一次。',
    blade: '在附近的敵人之間來回閃斬；之後一陣子更容易暴擊、跑得更快，翻滾也馬上能用。',
    knight: '幾秒內什麼都打不穿，附近的遺跡生物只能打你；結束時多一層護盾。',
    monk: '閃到附近的敵人面前各打一拳，最後一拳打在地上；回一些生命，之後一陣子更耐打、跑得更快。',
    bard: '回復自己和附近隊友的生命與魔力、連續震擊周圍的敵人，大家一起拿到樂譜的加成，之後一陣子跑得更快。',   // 2026-10-11：大招拿掉增傷減傷
    summoner: '自己多一層大護盾，召喚物 8 秒內攻擊、速度翻倍。',
    arraymage: '以你為中心畫出巨大的法陣連爆三次，自己也拿到護盾。',
    enchanter: '把各種元素一起灌進武器，周圍一圈魔力爆發，附魔也維持得更久。',
    scroll: '把身上的卷軸全部撕開、四面八方連發，魔力回滿、技能冷卻縮短。'
  };
  const ADV_T = {
    sniper: '蓄力射出貫穿一切的子彈，射程更遠、更容易暴擊。大招最後補一發必定暴擊的狙擊彈。',
    magigun: '子彈帶上火、冰、雷，燃燒、減速、麻痺輪流來。大招掃射時前方的敵人輪流被元素打中。',
    bomber: '丟出爆裂核心大範圍炸開，爆炸特別痛，但會引來佩特拉的注意。大招朝準心一路連炸。',
    arcane: '箭會追著敵人跑，技能一口氣射出一群追蹤箭。大招落下時再對周圍放出大量追蹤魔箭。',
    ranger: '放捕獸夾定住敵人，跑得快、翻滾得勤。大招先夾住落點的敵人，再讓你跑得更快。',
    hama: '專打遺跡生物，破魔矢一箭射穿一整排，弱小的一擊就散。大招最後落下巨大的破魔矢並破甲。',
    berserker: '越殘血越兇，狂怒時又快又痛還會吸血。大招先把周圍的敵人吸過來再劈。',
    gladiator: '攻擊更快，迴旋連斬把周圍一圈掃開。大招落地後再接迴旋斬。',
    onimusha: '戴上鬼面，大範圍斬擊把敵人嚇得愣住；生命低時更耐打、更兇。大招留下一片持續燃燒的鬼火。',
    elementalist: '隕石砸下大範圍燃燒，攻擊常順手點燃或冰住敵人。大招的隕星輪流帶火、冰、雷，最後再落一顆大的。',
    hexer: '詛咒一片敵人，讓牠們受傷更重、走得更慢；被詛咒的敵人死掉時詛咒會傳下去。大招先詛咒落點再砸下隕星。',
    waixiu: '體外常駐一層魔力罩擋傷害、施法更快，還能把魔力罩炸開震飛敵人；但魔力外放，比較容易被佩特拉注意到。大招先補滿魔力罩再炸開。',
    bishop: '展開聖域回血又灼傷敵人，治療更強。大招再展開更大的聖域並給大家護盾。',
    druid: '藤蔓纏住周圍的敵人並持續回血，平時也會慢慢自己回。大招纏住一大片敵人並大量回復。',
    shinkan: '張開結界擋下所有投射物，範圍內的遺跡生物會變弱，也比較不會引來佩特拉。大招的結界還會讓敵人變慢。',
    kensei: '暴擊打得特別痛，居合一刀斬出一直線、必定暴擊。大招斬完再補一記遠距離的一閃。',
    shadow: '影步閃到敵人背後重擊並隱身，從背後打特別痛。大招斬完隱身，隱身時更容易暴擊。',
    yoto: '妖刀吸遺跡生物的魔力質，打倒越多越強，還能一口氣解放成大範圍斬擊。大招閃斬時打倒敵人會回血，最後放出一圈妖氣斬。',
    templar: '堡壘大幅減傷並反彈傷害，平時也比較耐打。大招城塞期間一直震傷身邊的敵人。',
    paladin: '聖光衝鋒並回復自己，擋下攻擊也會回血。大招城塞期間連隊友一起持續回血，結束時放出一圈聖光。',
    dragoon: '長槍打得更遠，龍躍跳起來落下震飛敵人、空中不會受傷。大招結束時再跳一次把周圍擊飛。',
    fistsaint: '出拳更快、更容易暴擊，百裂拳一口氣打出一大串。大招閃到每隻敵人面前時多打好幾拳。',
    staffmonk: '攻擊範圍更大、更耐打，風車棍掃開身邊所有敵人。大招最後長棍一圈比一圈大地掄開。',
    inner: '把魔力質注進全身強化肉體和五感：站著不動會回生命和魔力，攻擊也不會引來佩特拉；氣勁一掌震退周圍的敵人，還能震碎行壁。大招回復自己並讓周圍的敵人暈眩。',
    aria: '治療更強，頌歌回血還給護盾，隊友也比較耐打。大招給大家護盾並清掉負面狀態。',
    drummer: '技能冷卻更快、更容易暴擊，雷鼓一圈一圈震飛周圍的敵人。大招多敲幾下並大幅縮短技能冷卻。',
    serane: '瑟蘭派：用共振圍出「奏域」，裡面回血、灼傷敵人；魔力更多，也比較不會引來佩特拉。大招在腳下展開更久的奏域。',
    beastlord: '人海戰術：召喚技能重放會一直疊上去（最多 12 隻），每隻便宜一半，倒下也只損失兩成魔力。',
    medium: '死靈法師：讓剛倒下的敵人站起來替你打（用牠原本的樣子），最多 4 隻；只有死靈法師能用「獻祭」，炸掉亡者回生命和魔力。',
    shikigami: '式神很少但很強（最多 2 隻），你受到的傷害有 30% 由式神分擔；護符結界讓式神回血、分擔更多。',
    grandarray: '法陣更大、技能更痛，能在準心處畫出巨大的法陣爆開。大招最後再爆一次更大的。',
    warder: '立起結界燈持續回復，平時也更耐打。大招一陣子內大量回血並減傷。',
    eidanora: '抑制圈：法陣不散，長時間持續傷害並讓敵人變慢，技能也更省魔力。大招爆完留下一片抑制圈。',
    runesmith: '一次刻上好幾種元素，打得更穿、更容易燃燒。大招再刻上毒和金，讓敵人中毒、破甲。',
    spellblade: '把附魔的斬擊打出去穿過一整排敵人，法術也算進近戰傷害、魔力更多。大招期間普攻也會順手打出劍氣。',
    entian: '恩特安的作品撕得開魔力罩，無視更多護甲，一刀直線必定暴擊。大招朝準心撕開一道長長的裂口並破甲。',
    scribe: '技能冷卻更快，疊卷一次撕開好幾張火卷在準心連爆。大招再連爆一輪火卷。',
    sealer: '封印符把敵人封住並讓牠受傷更重，也更容易暴擊。大招封住一大片敵人並詛咒。',
    noxa: '一次把預先寫好的卷軸全放出去，魔力更多，在魔力濃的遺跡更強。大招再放一輪並回魔力。'
  };
  R.ADV_INTRO = ADV_T;   // 2026-10-10：公會的轉職畫面也用這份（不講數值的路線介紹）
  // 沒寫到的（之後新加的職業、路線）：照原本的說明，把數字拿掉
  const noNum = s => String(s || '').replace(/[（(][^）)]*\d[^）)]*[）)]/g, '').replace(/[+＋−\-×x]?\s*\d+(\.\d+)?\s*(%|％|秒|公尺|倍|隻|下|層|點|發|支|拳|圈|張)?/g, '').replace(/[、，]\s*[、，]/g, '，').replace(/\s{2,}/g, ' ');
  // 生命、魔力、移動：跟其他職業比（高／中／低、快／普通／慢）
  const tierOf = (cls, k, words) => { const vs = R.CLASS_IDS.map(c => R.CLASSES[c] && R.CLASSES[c][k]).filter(v => v != null).sort((a, b) => a - b), v = R.CLASSES[cls][k], i = vs.indexOf(v) / Math.max(1, vs.length - 1); return i >= 0.67 ? words[0] : i >= 0.34 ? words[1] : words[2]; };
  R.classInfo = cls => {
    const d = R.CLASSES[cls]; if (!d) return '';
    const g = R.regGroup ? R.regGroup(cls) : null, core = helpOf(cls), U = R.ULTS && R.ULTS[cls], P = R.ULT_PATHS && R.ULT_PATHS[cls];
    const sig = R.SKILLS && R.SKILLS[d.skill];
    const base = skillsOf(cls, '');
    let h = '<div class="ci" style="--c:' + d.color + '"><h2>' + esc(d.name) + (g ? '<small>公會分類：' + esc(g.group) + '</small>' : '') + '</h2>'
      + '<p>' + esc(d.desc) + '</p><p class="ci-st"><span>生命 <b>' + tierOf(cls, 'hp', ['高', '中', '低']) + '</b></span><span>魔力 <b>' + tierOf(cls, 'mp', ['高', '中', '低']) + '</b></span><span>移動 <b>' + tierOf(cls, 'speed', ['快', '普通', '慢']) + '</b></span>' + (d.shield ? '<span>帶盾</span>' : '') + '</p>';
    if (g && g.list) h += '<h3>武器</h3><ul class="ci-w">' + g.list.map(([w, line]) => '<li><b>' + esc(R.regName ? R.regName(cls, w) : w) + '</b>　' + esc(line) + '</li>').join('') + '</ul>';
    if (core) h += '<h3>職業特效：' + esc(core.name) + '</h3><p>' + esc(CORE_T[cls] || noNum(core.t)) + '</p>';
    if (U) h += '<h3>大招：' + esc(U.name) + '</h3><p>' + esc(ULT_T[cls] || noNum(String(U.sub || '').replace(/｜/g, '；'))) + '</p><p class="note">打中、被打會累積大招能量，滿了按 V。</p>';
    h += '<h3>技能</h3>' + (sig ? '<p>一開始的技能：<b>' + esc(sig.name) + '</b></p>' : '')
      + '<p class="note">職業等級升上去會學到新技能，到技能書換上（詳細的數值在技能書裡看）。</p><div class="ci-sks">' + base.map(chip).join('') + '</div>';
    const advs = R.ADV && (R.ADV[cls] || []).filter(a => !a.legacy);   // 2026-10-09：刪掉（legacy）的轉職路線不列
    if (advs && advs.length) {
      h += '<h3>轉職（Lv ' + (R.PROMOTE_LV || 30) + '，交一顆魔力核心）</h3><div class="ci-advs">' + advs.map(a => {
        const pu = P && P[a.id], sk = skillsOf(cls, a.id);
        return '<div class="ci-adv"><b>' + esc(a.name) + '</b><small>' + esc(a.path || '') + '</small><p>' + esc(ADV_T[a.id] || noNum(a.desc || '')) + '</p>'
          + (pu ? '<p class="note">路線大招「' + esc(pu.name) + '」</p>' : '')
          + (sk.length ? '<div class="ci-sks">' + sk.map(chip).join('') + '</div>' : '') + '</div>';
      }).join('') + '</div>';
    }
    return h + '</div>';
  };
  // 2026-10-13 作者：【知道了】左邊多一個「技能機制說明」（classguide.js）
  const FOOT = cls => '<div class="row">' + (R.showClassGuide ? '<button type="button" class="btn ci-gd" data-cigd="' + esc(cls) + '">技能機制說明</button>' : '') + '<button type="button" class="btn pri" data-ciclose="1">知道了</button></div>';
  // 自己的視窗（最上層）：捏角畫面、公會頁面都蓋得過去，遊戲也不用暫停
  const close = () => { const m = $('ci-modal'); if (m) m.hidden = true; };
  R.showClassInfo = cls => {
    const html = R.classInfo(cls); if (!html) return;
    let m = $('ci-modal'); if (!m) { m = document.createElement('div'); m.id = 'ci-modal'; m.innerHTML = '<div class="ci-box" role="dialog" aria-modal="true"></div>'; m.onclick = ev => { if (ev.target === m) close(); }; document.body.appendChild(m); }
    const box = m.firstChild; box.innerHTML = html + FOOT(cls); m.hidden = false; box.scrollTop = 0;
  };
  document.addEventListener('keydown', ev => { const m = $('ci-modal'); if (ev.key === 'Escape' && m && !m.hidden) { ev.stopPropagation(); close(); } }, true);
  document.addEventListener('click', ev => {
    const q = ev.target.closest && ev.target.closest('[data-clsq]');
    if (q) { ev.preventDefault(); ev.stopPropagation(); R.showClassInfo(q.dataset.clsq); return; }
    const c = ev.target.closest && ev.target.closest('[data-ciclose]');
    if (c) { ev.preventDefault(); ev.stopPropagation(); close(); }
  }, true);
  // 畫面上的職業列表補上「？」
  const btn = cls => { const b = document.createElement('button'); b.type = 'button'; b.className = 'cls-q'; b.dataset.clsq = cls; b.textContent = '?'; b.title = '這個職業的說明'; return b; };
  const scan = () => {
    document.querySelectorAll('.reg-group:not([data-q])').forEach(gp => { gp.dataset.q = 1; const c = gp.querySelector('[data-cls]'), h = gp.querySelector('h4'); if (c && h) h.appendChild(btn(c.dataset.cls)); });
    document.querySelectorAll('.cls-grid').forEach(gr => { gr.querySelectorAll('.cls-row').forEach((row, i) => { if (row.dataset.q) return; row.dataset.q = 1; const cls = R.CLASS_IDS[i]; const b = row.querySelector('b'); if (cls && b) b.after(btn(cls)); }); });
  };
  let queued = false;
  new MutationObserver(() => { if (queued) return; queued = true; setTimeout(() => { queued = false; scan(); }, 0); }).observe(document.body, { childList: true, subtree: true });
  const css = document.createElement('style');
  css.textContent = '#ci-modal{position:fixed;inset:0;z-index:9000;display:flex;align-items:center;justify-content:center;padding:16px;background:rgba(8,6,4,.62)}#ci-modal[hidden]{display:none}'
    + '.ci-box{width:min(720px,100%);max-height:calc(100vh - 32px);overflow:auto;padding:16px 18px;border-radius:10px;border:1px solid #5A4A38;background:#1C1714;color:#EDE6DA;box-shadow:0 10px 40px rgba(0,0,0,.6);font-size:14px}.ci-box .row{display:flex;justify-content:flex-end;margin-top:12px}.ci-box .note{opacity:.7;font-size:12.5px}'
    + '.cls-q{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;margin-left:6px;padding:0;border-radius:50%;border:1px solid var(--c,#C9A85A);background:rgba(0,0,0,.25);color:var(--c,#E8D8A8);font:700 12px/1 system-ui,sans-serif;cursor:pointer;vertical-align:middle;flex:none}.cls-q:hover{background:var(--c,#C9A85A);color:#140F0A}'
    + '.ci h2{border-left:4px solid var(--c);padding-left:10px}.ci h2 small{display:block;font-size:12px;opacity:.7;font-weight:400}.ci h3{margin:14px 0 4px;color:var(--c);filter:brightness(1.35)}.ci p{margin:4px 0;line-height:1.6}'
    + '.ci-st{display:flex;flex-wrap:wrap;gap:6px 14px}.ci-w{margin:4px 0;padding-left:18px;line-height:1.6}.ci-sks{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}'
    + '.ci-sk{display:inline-flex;gap:5px;align-items:baseline;padding:2px 8px;border-radius:12px;border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.05);font-size:12.5px;cursor:help}.ci-sk i{font-style:normal;font-size:10.5px;opacity:.65}'
    + '.ci-advs{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px}.ci-adv{padding:8px 10px;border-radius:8px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.04)}.ci-adv small{margin-left:8px;opacity:.7}.ci-adv p{font-size:13px}';
  document.head.appendChild(css);
  // 2026-10-17 作者：所有轉職的說明都要說清楚轉職後實際拿到的加成（照程式裡現在的效果寫；鍵是「職業:轉職」，內修者、式神使、外修者有重複的代號）
  const ADV_FULL = {
    "gunner:sniper": "技能「穿心」：蓄力後射出貫穿一切的子彈。被動：暴擊率 +5%、射程 +30%。槍械特性：普攻打敵人背後、或打暈眩中的敵人，傷害 ×1.5（弱點）。",
    "gunner:magigun": "技能「元素彈匣」：接下來 12 發子彈輪流帶火、冰、雷。被動：普攻 25% 機率附帶隨機元素。槍械特性：特殊彈種的效果加倍（穿甲彈打護甲 +30% → +60%、燃燒彈燃燒機率 18% → 36%、冰凍彈變慢機率 25% → 50%）。",
    "gunner:bomber": "技能「爆裂核心」：丟出礦坑用的爆裂核心，大範圍爆炸。槍械特性：燃燒彈打倒的敵人會炸開（半徑 2 公尺、0.6 倍威力）。",
    "archer:arcane": "技能「追跡箭雨」：一口氣射出 8 支追蹤箭。續力：蓄滿只有 0.75 倍（短弓 75%、長弓 90%），但能連續蓄滿 3 次：技能連放、普攻箭數加倍。弓術特性：完美射擊多分出兩支會追蹤的箭。",
    "archer:ranger": "技能「捕獸夾」：丟出陷阱，踩到的敵人被定住。被動：移動 +10%、翻滾冷卻 −30%。續力：續力時間減半，普攻蓄滿自動射出；每 1% 攻速續力再快 0.25%。弓術特性：完美射擊在準心處放一個捕獸夾（12 秒）。",
    "archer:hama": "技能「破魔矢」：一箭射穿直線上的所有遺跡生物，喚群燈、游焰一擊就散。被動：對遺跡生物傷害 +20%。續力：續力時間加倍，蓄滿時效果再 +150%（短弓 250%、長弓 290%），箭速 ×2。弓術特性：完美箭射中的敵人留下破魔印 8 秒（你對牠的傷害 +20%）。",
    "warrior:berserker": "技能「狂怒」：6 秒內傷害 +50%、攻速 +30%、吸血。被動：生命越低傷害越高（最多 +40%）。怒氣：不會隨時間掉；生命三成以下被打，怒氣漲兩倍。",
    "warrior:gladiator": "技能「迴旋連斬」：連續三次環形斬擊並擊退。被動：攻速 +20%。怒氣：6 秒內放三種不同的技能，下一下普攻變成「終幕」（4 倍傷害、大範圍）。",
    "warrior:onimusha": "戴上遺跡裡撿到的鬼面，把佩特拉的惡意變成力氣。技能「鬼斬」：往前大範圍斬擊，打中的敵人被嚇得愣住。被動：生命低於一半時，受到的傷害 −20%、傷害 +15%。怒氣：怒吼時戴上鬼面（扣 10% 最大生命，6 秒內傷害 +30%、吸血系數 +100）。",
    "warrior:inner": "透過吐納吸收遺跡裡的殘存魔力質。技能「氣勁」：蓄氣一掌震退周圍敵人，打中的行壁直接碎裂。被動：站著不動時回復生命與魔力；攻擊不會讓佩特拉的注意上升。怒氣：站著不動每秒 +8 怒氣。",
    "mage:elementalist": "技能「隕石」：在準心處落下隕石，大範圍傷害並燃燒。法術書：選一個拿手元素，那個元素的法術傷害 +30%、魔力消耗 −20%。被動：命中時 10% 機率燃燒。元素反應：反應的威力 ×1.5。",
    "mage:hexer": "法術多一種效果「詛咒」（受到的傷害 +30%）。技能「咒縛」：詛咒一片範圍的敵人：受到的傷害 +30%、移動變慢。被動：被詛咒的敵人死掉時，詛咒會傳給旁邊的敵人。元素反應：反應時順便詛咒周圍 4 公尺的敵人 4 秒。",
    "mage:shikigami": "技能「式神」：放出三隻紙式神環繞你並自動攻擊 10 秒。被動：常駐一隻式神。元素反應：反應時回 6 點魔力。",
    "mage:waixiu": "外修派（東方派）的氣道：體外常駐一層無形的魔力罩，不用咒語就能快速施法。技能「氣爆」：把魔力罩一口氣炸開，震飛周圍的敵人。被動：魔力罩會自己慢慢長回來（最多擋生命的 15%）、技能急速 +37.5；但魔力外放像黑夜裡的燈火，佩特拉的注意上升 +20%。元素反應：反應時回 6 點魔力。",
    "priest:bishop": "技能「聖域」：展開 6 秒的聖域，回復生命並灼傷敵人。神蹟（X）：扶起倒下的隊友（回到 40% 生命）。",
    "priest:druid": "技能「蔓生」：藤蔓纏住周圍敵人並持續回復。被動：每秒回復 1% 生命。神蹟（X）：讓周圍 5 公尺的遺跡生物定身 3 秒。",
    "priest:shinkan": "技能「結界」：張開結界，擋下所有投射物 5 秒，範圍內的遺跡生物會變弱。被動：佩特拉的注意上升 −40%。神蹟（X）：張開 6 秒大結界。",
    "blade:kensei": "技能「居合」：短暫架勢後一刀斬出一直線，必定暴擊。被動：暴擊傷害 +50%。刀意：居合加成 ×1.5、殘心效果 ×2 且 10 秒、收刀時間 ×0.5。",
    "blade:shadow": "技能「影步」：瞬移到最近的敵人背後重擊並隱身 2 秒。被動：從背後攻擊 +50%。刀意：反切砍 2 刀、無敵 1 秒、反切後也進殘心；普攻衝刺快 10 倍、距離 ×2。",
    "blade:yoto": "刀會吸遺跡生物的魔力質：這一趟每擊倒一隻，傷害 +1%（最多 +60%）。技能「妖刀解放」：消耗累積的魔力質，斬出一道大範圍的斬擊。刀意：刀意渾圓的效果 ×1.25、渾圓時吸血系數 +75（無念．刀意渾圓 +150）；每次普攻扣 1% 目前生命；放技能照那一招的基礎冷卻扣目前生命：16 秒以下 5%、16～30 秒 10%、30 秒以上 15%（不會扣到死）。",
    "knight:templar": "技能「堡壘」：5 秒內受到的傷害 −70%，並反彈 30%。被動：受到的傷害 −15%。格擋：完美防禦把那一下的傷害整個彈回去。",
    "knight:paladin": "技能「聖光衝鋒」：衝鋒並放出聖光震波，回復自己。被動：擋下攻擊時回復 2 點生命。格擋：完美防禦回復 8% 最大生命。",
    "knight:dragoon": "技能「龍躍」：高高跳起，落在準心處震飛周圍敵人，跳在空中時不會受傷。被動：長槍的攻擊距離 +25%。格擋：完美防禦後的反制變成龍躍（跳到準心處砸下：3 倍威力、暈眩 1 秒）。",
    "monk:fistsaint": "技能「百裂拳」：一口氣打出八拳。被動：攻速 +20%、暴擊率 +5%。四法：拳法的攻速加成再 +15%。",
    "monk:staffmonk": "技能「風車棍」：長棍掄四圈，掃開身邊所有敵人。被動：攻擊範圍 +20%、受到的傷害 −10%。四法：腿法範圍再 +30%、掌法擊退再 +50%。",
    "monk:inner": "內修派：把魔力質注進全身的細胞，強化肉體和五感。技能「氣勁」：蓄氣一掌震退周圍敵人，打中的行壁直接碎裂。被動：站著不動時回復生命與魔力；攻擊不會讓佩特拉的注意上升。四法：得到的勢 +50%。",
    "monk:waixiu": "外修派（東方派）的氣道：體外常駐一層無形的魔力罩。技能「氣爆」：把魔力罩一口氣炸開，震飛周圍的敵人。被動：魔力罩會自己慢慢長回來（最多擋生命的 15%）、技能急速 +37.5；但佩特拉的注意上升 +20%。四法：步法不減攻速。",
    "bard:aria": "技能「頌歌」：回復自己與附近隊友的生命，並提供護盾。被動：治療 +30%、隊友受到的傷害 −15%。演奏：增益音符（綠色）的效果 ×1.5。",
    "bard:drummer": "技能「雷鼓」：連敲三下，一圈一圈的鼓聲震飛周圍的敵人。被動：技能急速 +30、暴擊率 +6%。演奏：攻擊音符（紅色）的效果 ×1.5，演奏時多一小節鼓聲。",
    "bard:serane": "諧鳴奏域派系「瑟蘭派」：用共振圍出一個閉環的「奏域」。技能「奏域」：腳下展開 8 秒的奏域，裡面回血、灼傷敵人。被動：佩特拉的注意上升 −20%、魔力 +20%。演奏：普攻給的攻速增益維持 16 秒（原本 8 秒）。",
    "summoner:beastlord": "人海戰術。技能「百獸」：一口氣召喚四隻土狼；召喚技能可以一直重放，召喚物會一直疊上去（最多 12 隻）。被動：每隻少吃一半魔力；召喚物倒下時，損失的魔力退回 80%；身邊每一隻召喚物讓你受到的傷害 −2%（最多 −20%）。執念：漲得快 1.5 倍。",
    "summoner:medium": "讓倒下的敵人爬起來替你打。技能「起屍」：附近剛倒下的敵人（你或召喚物打倒的）站起來變成你的亡者，用牠原本的樣子和簡化的招式（最多 4 隻）。被動：打倒的敵人有 25% 機率自己爬起來；亡者造成的傷害 10% 回復成你的生命。「獻祭」只有死靈法師能用：炸掉亡者，每隻回 5% 生命、5% 魔力。執念的獻祭（X）：每炸掉一隻回 4% 生命。牆、眼球、砲台、圖騰、水晶、物品和領主不會被叫起來。",
    "summoner:shikigami": "式神很少，但很強（最多 2 隻，傷害 ×2.5、血量 ×3）。技能「式神・白狐」：折一隻很強的白狐式神。被動：你受到的傷害有 30% 由在場的式神分擔；收回召喚物退回 80% 魔力（原本 50%）。執念：獻祭只要 30（原本 50）。",
    "arraymage:grandarray": "技能「大法陣」：準心處畫一個巨大的法陣，一秒後爆開。被動：傷害 +15%。",
    "arraymage:warder": "技能「守護陣」：腳下立一座結界燈 10 秒，一直回復你。被動：受到的傷害 −12%、防禦 +3。",
    "arraymage:eidanora": "術陣派的開創者「艾達諾拉」的抑制圈：法陣不散。技能「抑制圈」：準心處放一個長時間的法陣，持續傷害、讓敵人變慢。被動：技能急速 +25。",
    "enchanter:runesmith": "技能「三重附魔」：焰、霜、雷一次刻上去 10 秒。被動：穿透 +15%、燃燒機率 +10%。刻印：釋放的傷害 ×1.5、刻印攢得快一半。",
    "enchanter:spellblade": "技能「劍氣」：把附魔的斬擊打出去，穿過一整排敵人。被動：傷害 +10%、魔力 +25%。刻印：釋放時多打出一道往前的劍氣。",
    "enchanter:entian": "「附魔之父」恩特安的作品撕得開魔力罩。技能「撕裂」：一刀直線，必定暴擊。被動：穿透 +30%（無視更多護甲）。刻印：釋放打到的敵人破防（5 秒內你對牠的傷害 +20%）。",
    "scroll:scribe": "技能「疊卷」：一次撕開五張火卷，準心處連爆。被動：技能急速 +37.5。卷軸：展卷只要 2 張（原本 3 張）；可以寫雙用卷（一張紙撕兩次）。",
    "scroll:sealer": "技能「封印符」：準心處的敵人被封住 3 秒、受到的傷害 +30%。被動：暴擊率 +8%。卷軸：連鎖的那一招會暈眩 0.8 秒；可以寫封印符（撕開定住身邊的敵人 1.2 秒）。",
    "scroll:noxa": "卷軸派「諾克薩派」：預載的咒文。技能「預載・全開」：把預先寫好的卷軸一次全放出去，四面八方。被動：魔力 +30%；克森特級以上的遺跡傷害 +10%。卷軸：兩種不同的技能就能連鎖（原本三種）；齊發加成加倍，連撕第 3 張起 25% 不消耗。"
  };
  R.ADV_FULL = ADV_FULL;
  { const st = document.createElement('style'); st.textContent = '.promo-card small.promo-fx{color:inherit;opacity:.85;font-size:12.5px;line-height:1.55;border-top:1px dashed var(--line);padding-top:5px;margin-top:2px}'; document.head.appendChild(st); }
  setTimeout(() => { Object.keys(R.ADV || {}).forEach(cls => (R.ADV[cls] || []).forEach(a => { const t = ADV_FULL[cls + ':' + a.id]; if (t) a.desc = t; })); }, 0);
})(window.R);
