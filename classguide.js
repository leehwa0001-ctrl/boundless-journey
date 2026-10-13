// 技能機制說明（2026-10-13 作者：每個職業的「？」說明，在【知道了】左邊多一個「技能機制說明」，用圖一步一步講技能怎麼放、怎麼操控）
// - 每個職業幾頁：一頁一件事、短句；圖是這裡用 SVG 畫的示意圖（不用另外下載圖檔）；確切數字收在「更多細節」裡（照遊戲裡的說明即時產生）。
// - 電腦（鍵盤滑鼠）和手機（觸控）的說法分開寫（R.touch）。
// - 視窗 #cg-modal 疊在職業說明上面；Esc／「返回」回到職業說明。左右鍵、滑動換頁。
// 放在 classinfo.js 後面。
(function (R) {
  if (!R) return;
  const $ = id => document.getElementById(id), esc = s => (R.esc ? R.esc(String(s == null ? '' : s)) : String(s));
  const touch = () => !!R.touch, T = (d, m) => (touch() ? m : d);
  const K = s => '<kbd>' + s + '</kbd>';
  const CLS_KEY = () => T(K('X'), '職業條'), ULT_KEY = () => T(K('V'), '大招鈕'), ATK = () => T(K('左鍵'), '右搖桿'), SKL = () => T(K('右鍵') + '／' + K('Q') + K('E') + K('R'), '技能鈕'), DODGE = () => T(K('Ctrl') + '／' + K('C'), '翻滾鈕');

  // ---------- 畫圖用的小零件（SVG） ----------
  const GOLD = '#C9A85A', INK = '#E8E0D0', DIM = '#8A8096', BG = '#15121B';
  const svg = (inner, h) => '<svg class="cg-svg" viewBox="0 0 320 ' + (h || 150) + '" xmlns="http://www.w3.org/2000/svg" role="img"><rect x="1" y="1" width="318" height="' + ((h || 150) - 2) + '" rx="8" fill="' + BG + '" stroke="rgba(201,168,90,.35)"/>' + inner + '</svg>';
  const tx = (x, y, s, o) => { o = o || {}; return '<text x="' + x + '" y="' + y + '" fill="' + (o.c || INK) + '" font-size="' + (o.s || 12) + '" text-anchor="' + (o.a || 'middle') + '"' + (o.b ? ' font-weight="700"' : '') + ' font-family="system-ui,sans-serif">' + esc(s) + '</text>'; };
  const key = (x, y, s, on, w) => { w = w || 30; return '<rect x="' + (x - w / 2) + '" y="' + (y - 14) + '" width="' + w + '" height="26" rx="4" fill="' + (on ? '#5A3A1A' : '#2E2836') + '" stroke="' + (on ? GOLD : '#5A5060') + '" stroke-width="' + (on ? 2 : 1) + '"/>' + tx(x, y + 4, s, { s: 12, b: 1, c: on ? '#F0D890' : INK }); };
  // 電腦畫按鍵／滑鼠，手機畫手指點的圓鈕
  const inp = (x, y, desk, mob, on) => touch() ? '<circle cx="' + x + '" cy="' + y + '" r="16" fill="' + (on ? '#5A3A1A' : '#2E2836') + '" stroke="' + GOLD + '"/>' + tx(x, y + 4, mob, { s: 10, b: 1 }) + '<circle cx="' + (x + 9) + '" cy="' + (y + 13) + '" r="6" fill="rgba(240,216,144,.35)"/>' : key(x, y, desk, on, Math.max(30, desk.length * 9 + 12));
  const mouse = (x, y, side) => '<rect x="' + (x - 14) + '" y="' + (y - 20) + '" width="28" height="40" rx="14" fill="#2E2836" stroke="#5A5060"/>' + (side ? '<path d="M' + (side === 'L' ? x - 14 : x) + ' ' + (y - 6) + ' v-8 a14 14 0 0 ' + (side === 'L' ? '1 14 -6' : '1 14 14') + ' v' + (side === 'L' ? 14 : 0) + ' z" fill="' + GOLD + '" opacity=".8"/>' : '') + '<line x1="' + x + '" y1="' + (y - 20) + '" x2="' + x + '" y2="' + (y - 4) + '" stroke="#5A5060"/>';
  const atkIn = (x, y) => touch() ? '<circle cx="' + x + '" cy="' + y + '" r="20" fill="none" stroke="' + GOLD + '" stroke-dasharray="3 3"/><circle cx="' + x + '" cy="' + y + '" r="9" fill="' + GOLD + '" opacity=".7"/>' + tx(x, y + 34, '右搖桿', { s: 10, c: DIM }) : mouse(x, y, 'L') + tx(x, y + 34, '左鍵', { s: 10, c: DIM });
  const bar = (x, y, w, p, col, lab) => '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="10" rx="5" fill="#2E2836" stroke="#5A5060"/><rect x="' + x + '" y="' + y + '" width="' + Math.max(0, Math.min(1, p)) * w + '" height="10" rx="5" fill="' + col + '"/>' + (lab ? tx(x + w / 2, y - 4, lab, { s: 10, c: DIM }) : '');
  const me = (x, y, c) => '<circle cx="' + x + '" cy="' + y + '" r="9" fill="' + (c || '#5A9AE8') + '" stroke="#fff" stroke-width="1.5"/>';
  const foe = (x, y, r) => '<circle cx="' + x + '" cy="' + y + '" r="' + (r || 8) + '" fill="#A8442F" stroke="#3A1510"/><circle cx="' + (x - 2) + '" cy="' + (y - 2) + '" r="1.6" fill="#fff"/><circle cx="' + (x + 3) + '" cy="' + (y - 2) + '" r="1.6" fill="#fff"/>';
  const arr = (x1, y1, x2, y2, c, dash) => { const a = Math.atan2(y2 - y1, x2 - x1), h = 7; return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + (c || GOLD) + '" stroke-width="2"' + (dash ? ' stroke-dasharray="4 3"' : '') + '/><path d="M' + x2 + ' ' + y2 + ' L' + (x2 - h * Math.cos(a - 0.45)) + ' ' + (y2 - h * Math.sin(a - 0.45)) + ' L' + (x2 - h * Math.cos(a + 0.45)) + ' ' + (y2 - h * Math.sin(a + 0.45)) + ' z" fill="' + (c || GOLD) + '"/>'; };
  const ring = (x, y, r, c, op) => '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + (c || GOLD) + '" fill-opacity="' + (op == null ? 0.12 : op) + '" stroke="' + (c || GOLD) + '"/>';
  const step3 = (a, b, c) => [a, b, c].map((s, i) => '<g>' + '<circle cx="' + (55 + i * 105) + '" cy="28" r="11" fill="#7A3424" stroke="' + GOLD + '"/>' + tx(55 + i * 105, 32, String(i + 1), { s: 12, b: 1 }) + tx(55 + i * 105, 136, s, { s: 11 }) + '</g>').join('') + arr(92, 80, 120, 80, DIM) + arr(197, 80, 225, 80, DIM);
  const bubble = (x, y, s, c) => '<rect x="' + (x - s.length * 6.5 - 6) + '" y="' + (y - 13) + '" width="' + (s.length * 13 + 12) + '" height="20" rx="10" fill="' + (c || '#3A2A18') + '" stroke="' + GOLD + '"/>' + tx(x, y + 2, s, { s: 11, b: 1, c: '#F0D890' });

  // 共通的頁：大招、轉職路線（照 classinfo.js 的介紹）、更多細節
  const ultPage = (cls, extra) => {
    const U = R.ULTS && R.ULTS[cls];
    return { t: '大招：' + ((U && U.name) || '大招'), img: svg(foe(220, 60) + foe(250, 90) + foe(205, 100) + ring(230, 85, 48, '#F0D890', 0.15) + me(90, 85) + bar(40, 125, 100, 1, '#F0D890', '大招能量滿了') + inp(90, 40, 'V', '大招', true) + arr(110, 80, 175, 80)),
      b: ['打中敵人、被打都會累積大招能量。', '能量條滿了按 ' + ULT_KEY() + '。', extra || ''].filter(Boolean) };
  };
  const ADV_NOTE = {   // 轉職後玩法真的不一樣的地方（不同的才寫）
    archer: { arcane: '魔弓手：蓄滿只到 75%，但可以連續蓄滿 3 次——技能連放、普攻箭數加倍。', ranger: '遊俠：蓄力時間減半，普攻蓄滿會自動射出再重新蓄。', hama: '破魔弓手：蓄力要 2 倍時間，但蓄滿傷害大幅提高、箭飛得更快。' },
    bard: { aria: '詠嘆詩人：增益音符（綠色）的效果 ×1.5。', drummer: '戰鼓手：攻擊音符（紅色）的效果 ×1.5，演奏時多一小節鼓聲。', serane: '奏域師：八分音符（普攻）給的攻速維持兩倍久，開頭的和弦換成管風琴。二轉的「演奏場」跟著你的音符、鼓點脈動，場裡吃到現在和弦的加成。' },
    monk: { fistsaint: '拳聖：拳法的攻速再快一點。', staffmonk: '棍僧：腿法範圍更大、掌法打得更遠。拿長棍時四法叫連棍、甩棍、跳棍、怒棍，效果一樣。', inner: '內修者：「勢」的上限更多。' },
    blade: { kensei: '劍豪：居合加成 ×1.5、殘心效果加倍且持續 10 秒、收刀拔刀快一倍。', shadow: '影刃：反切砍 2 刀、無敵 1 秒、反切後也進殘心；普攻衝刺快 10 倍、距離 2 倍。', yoto: '妖刀使：刀意渾圓效果加倍、渾圓時吸血；但每次普攻扣 1% 目前生命，放技能扣 10%（不會扣到死）。' },
    knight: { dragoon: '龍騎士：龍躍跳起來落下，空中不會受傷。' },
    mage: { elementalist: '元素師：在法術書選一個拿手元素，那個元素的法術傷害 +30%、魔力 −20%。', hexer: '咒術師：法術多一種效果「詛咒」：打到的敵人受到的傷害 +30%。', waixiu: '外修者：法術多一種形狀「罩」：瞬間的魔力護盾，順便震開身邊的敵人。', harmonic: '諧鳴：展開魔法場，在裡面放法術會變強，飛進來的敵人投射物也會被改掉。' },
    summoner: { beastlord: '萬獸師：人海戰術——召喚技能重放會一直疊（最多 12 隻），每隻少吃一半魔力；倒下時退回 80% 魔力。', medium: '死靈法師：「起屍」讓剛倒下的敵人站起來當亡者（最多 4 隻；牆、眼球、砲台、圖騰、水晶、物品、領主不行）；「獻祭」炸掉亡者，每隻回 5% 生命、5% 魔力。', shikigami: '式神使：式神最多 2 隻但很強（傷害 ×2.5、血量 ×3）；你受到的傷害 30% 由式神分擔。' },
    scroll: { sealer: '封印師：可以寫封印符，撕開定住身邊的敵人 1.2 秒。', scribe: '抄寫師：可以寫雙用卷，一張紙撕兩次。', noxa: '諾克薩的傳人：齊發加成加倍，連撕第 3 張起 25% 不消耗。' },
    arraymage: { eidanora: '艾達諾拉的傳人：法陣不會散，長時間讓敵人變慢。' }
  };
  const advPage = cls => {
    const A = (R.ADV && R.ADV[cls] || []).filter(a => !a.legacy); if (!A.length) return null;
    const N = ADV_NOTE[cls] || {};
    return { t: '轉職路線（Lv ' + (R.PROMOTE_LV || 30) + '）', img: svg(A.map((a, i) => { const x = 60 + i * (200 / Math.max(1, A.length - 1)); return arr(160, 40, x, 82, DIM) + '<rect x="' + (x - 42) + '" y="86" width="84" height="30" rx="6" fill="#221D29" stroke="' + GOLD + '"/>' + tx(x, 106, a.name, { s: 12, b: 1 }); }).join('') + bubble(160, 28, (R.CLASSES[cls] || {}).name || ''), 130),
      b: ['到 Lv ' + (R.PROMOTE_LV || 30) + ' 去公會轉職，三選一（交一顆魔力核心）。'].concat(A.map(a => '<b>' + esc(a.name) + '</b>：' + esc(String(N[a.id] || '').replace(/^[^：]+：/, '') || (R.ADV_INTRO && R.ADV_INTRO[a.id]) || a.desc || ''))) };
  };
  const fakeP = cls => ({ cls, adv: '', lv: 1, ws: {}, item: null, hp: 1, hpMax: 1, mp: 0, mpMax: 0, x: 0, z: 0 });
  const detail = cls => { const W = R.W, P = W && W.P && W.P.cls === cls ? W.P : fakeP(cls), c = R.CORE && R.CORE[cls]; let t = ''; try { t = c && c.help ? c.help(P) : ''; } catch (e) { t = ''; } return t; };

  // ---------- 每個職業的頁 ----------
  const G = {
    gunner: () => [
      { t: '開槍', img: svg(me(60, 75) + arr(75, 75, 230, 75, '#F0D890', 1) + foe(250, 75) + atkIn(150, 120) + bar(40, 20, 120, 0.6, '#E8C04A', '彈匣')), b: ['用 ' + ATK() + ' 瞄準開槍。', '每一槍用掉一發子彈，彈匣空了要換彈。'] },
      { t: '完美換彈', img: svg('<rect x="40" y="60" width="240" height="18" rx="9" fill="#2E2836" stroke="#5A5060"/><rect x="150" y="60" width="30" height="18" fill="' + GOLD + '"/>' + arr(110, 50, 160, 58) + tx(165, 100, '換彈時，指針走到金色格子再按一次', { s: 11 }) + inp(160, 125, 'X', '職業', true)), b: ['換彈的時候畫面會出現一條進度條。', '指針走到金色那一格時，再按一次 ' + CLS_KEY() + '。', '按中＝馬上換好，這一匣更痛；按錯會卡彈一下。'] },
      { t: '換彈種', img: svg(['一般', '穿甲', '燃燒', '冰凍'].map((s, i) => bubble(50 + i * 75, 70, s, ['#2E2836', '#3A3A50', '#5A2A1A', '#1A3A5A'][i])).join('') + [0, 1, 2].map(i => arr(72 + i * 75, 70, 103 + i * 75, 70, DIM)).join('') + tx(160, 115, '彈匣滿的時候按 X 依序換', { s: 11, c: DIM })), b: ['彈匣是滿的時候按 ' + CLS_KEY() + '，換下一種子彈。', '穿甲打有甲的、燃燒會燒傷、冰凍讓敵人變慢。'] },
      ultPage('gunner'), advPage('gunner')
    ],
    archer: () => [
      { t: '按住續力、放開射出', img: svg(step3('按住', '條慢慢變滿', '放開＝射出') + atkIn(55, 75) + bar(125, 75, 70, 0.7, '#9AE07A') + me(250, 80, '#5AA85A') + arr(262, 80, 300, 80, '#F0D890')), b: ['按住 ' + ATK() + ' 開始續力。', '續力條越滿，打得越痛、範圍越大。', '放開就射出去。沒蓄＝沒傷害。'] },
      { t: '技能是一種「箭矢」', img: svg(inp(60, 60, 'Q', '技能', true) + arr(80, 60, 120, 60) + bubble(170, 60, '換上火箭', '#5A2A1A') + arr(205, 60, 240, 60) + atkIn(270, 60) + tx(160, 125, '換上 → 按住續力 → 放開才射出、才扣魔力', { s: 11 })), b: ['傷害型技能不會馬上放：按 ' + SKL() + ' 是「換上」那種箭。', '再按一次同一個技能＝卸下。', '要在續力「之前」換：續力中、蓄滿後都不能換（弩例外）。', '接著像普攻一樣續力、放開才射出，這時才扣魔力和冷卻。', '強化、位移之類的技能照常直接放。'] },
      { t: '蓄滿的提示與技能蓄力時間', img: svg(bar(40, 60, 160, 1, '#FFE08A') + tx(240, 66, '叮！蓄滿！', { b: 1, c: GOLD }) + tx(160, 110, '普攻 2 秒；技能看基礎冷卻：≤10 秒 2.5 秒、≤20 秒 3 秒、更長 4 秒', { s: 10 })), b: ['蓄滿時會「叮」一聲、頭上跳「蓄滿！」、腳下閃金光，這時放開最划算。', '普攻 2 秒蓄滿。', '技能箭看技能原本的冷卻：10 秒以內 2.5 秒、20 秒以內 3 秒、更長 4 秒。', '長弓慢 20%、攻速越高越快，這些照樣算。'] },
      { t: '三種弓', img: svg(tx(60, 30, '短弓', { b: 1 }) + bar(20, 50, 80, 1, '#9AE07A') + tx(60, 80, '標準', { s: 11, c: DIM }) + tx(160, 30, '長弓', { b: 1 }) + bar(120, 50, 80, 1, '#E8C04A') + '<rect x="200" y="50" width="16" height="10" rx="3" fill="#F0D890"/>' + tx(160, 80, '蓄得慢、能蓄過頭', { s: 11, c: DIM }) + tx(265, 30, '十字弩', { b: 1 }) + bar(225, 50, 80, 1, '#7AC8FF') + tx(265, 80, '自己蓄滿、點一下射', { s: 11, c: DIM }) + tx(160, 125, '攻速越高，蓄得越快', { s: 11 })), b: ['短弓：照標準的速度蓄力。', '長弓：蓄得比較慢，但能蓄到 120%。', '十字弩：會自己蓄滿，蓄滿後點一下就射。'] },
      ultPage('archer'), advPage('archer')
    ],
    warrior: () => [
      { t: '怒氣代替魔力', img: svg(me(70, 75, '#C85A3A') + foe(130, 75) + arr(85, 70, 118, 70) + bar(180, 70, 110, 0.65, '#E8443A', '怒氣') + tx(235, 105, '打人、挨打都會漲', { s: 11 }) + tx(235, 125, '停手一陣子會慢慢掉', { s: 11, c: DIM })), b: ['戰士沒有魔力，技能用「怒氣」。', '打中敵人、被打都會漲怒氣。', '一陣子沒打沒被打，怒氣會慢慢掉。'] },
      { t: '怒吼', img: svg(me(160, 80, '#C85A3A') + ring(160, 80, 45, '#E8443A', 0.12) + ring(160, 80, 25, '#E8443A', 0.12) + inp(60, 80, 'X', '職業', true) + bar(225, 110, 70, 0.6, '#E8443A', '50 以上') + tx(160, 140, '一口氣吼光怒氣：越多越痛，之後一陣子傷害提高', { s: 10 })), b: ['怒氣夠多（一半以上）時按 ' + CLS_KEY() + ' 怒吼。', '怒氣全部吼出去，越多越痛。', '吼完的一陣子打得更痛。'] },
      ultPage('warrior'), advPage('warrior')
    ],
    mage: () => [   // 2026-10-13 術士：自己配法術（三選）
      { t: '配法術', img: svg(bubble(60, 50, '火・冰・雷', '#3A2A4A') + bubble(160, 50, '彈扇柱球牆', '#2A2A4A') + bubble(260, 50, '爆炸穿透…', '#2A3A4A') + tx(160, 95, '元素 ＋ 形狀 ＋ 效果', { b: 1 }) + tx(160, 120, '魔力、傷害自動算好', { s: 10, c: DIM })), b: ['在暫停選單或城裡選單打開「法術書」。', '每一句法術點三下：元素、形狀、效果，旁邊會顯示魔力、傷害、範圍。', '綁到技能格，按技能鍵就放。'] },
      { t: '換元素', img: svg(bubble(70, 60, '火', '#5A2A1A') + bubble(160, 60, '冰', '#1A3A5A') + bubble(250, 60, '雷', '#4A4A1A') + arr(88, 60, 140, 60, DIM) + arr(178, 60, 230, 60, DIM) + inp(160, 115, 'X', '職業', true)), b: ['按一下 ' + CLS_KEY() + '：剛剛放的那一句法術換成下一個元素。', '普攻也會跟著換。'] },
      { t: '元素反應', img: svg(foe(160, 60, 12) + tx(160, 30, '同一隻身上碰到兩種元素就引爆', { s: 11 }) + tx(60, 100, '火＋冰', { b: 1 }) + tx(60, 120, '蒸發：大傷害', { s: 10, c: DIM }) + tx(160, 100, '冰＋雷', { b: 1 }) + tx(160, 120, '碎冰：暈眩', { s: 10, c: DIM }) + tx(260, 100, '雷＋火', { b: 1 }) + tx(260, 120, '過載：大爆炸', { s: 10, c: DIM })), b: ['先用一種元素打，再用另一種元素打同一隻就引爆。'] },
      { t: '留下地形', img: svg(me(70, 85) + '<rect x="141" y="55" width="18" height="60" rx="3" fill="#9AD8FF"/>' + foe(250, 85) + arr(240, 80, 175, 80, '#E8443A') + tx(160, 135, '牆、球＋爆炸 → 留下 8 秒的地形', { s: 10 })), b: ['火＝熔岩（燒人）、冰＝冰刺（擋路、變慢）、雷＝雷柱（擋路、電人）。', '擋得住敵人和敵人的投射物，你和隊友可以穿過去。', '別種元素的法術打到地形會把它引爆。'] },
      ultPage('mage'), advPage('mage')
    ],
    priest: () => [
      { t: '補血攢信仰', img: svg(me(80, 80, '#E8E0A0') + me(130, 60, '#5A9AE8') + ring(80, 80, 40, '#9AE07A', 0.1) + bar(190, 40, 100, 0.5, '#F0D890', '信仰') + arr(200, 80, 260, 95, '#F0D890', 1) + foe(275, 100) + tx(230, 135, '補過頭的量變成光打敵人', { s: 10, c: DIM })), b: ['補血、祝福都會攢「信仰」：補自己、補隊友、給護盾都算（連線隊友也算）。', '補隊友攢得比補自己少一半；神蹟自己補的不算。', '補過頭的部分會化成一道光，去打最近的敵人。'] },
      { t: '神蹟', img: svg(me(160, 80, '#E8E0A0') + ring(160, 80, 50, '#F0D890', 0.15) + inp(60, 80, 'X', '職業', true) + bar(225, 115, 70, 1, '#F0D890', '信仰滿')), b: ['信仰滿了按 ' + CLS_KEY() + ' 放神蹟。', '大家回血、清掉負面狀態，還會震傷周圍。'] },
      ultPage('priest'), advPage('priest')
    ],
    blade: () => [   // 2026-10-13 刀客重製：收刀／刀意／居合／殘心／渾圓／反切；普攻先衝再砍
      { t: '普攻：先衝再砍', img: svg(me(50, 80, '#7A7AE8') + arr(62, 80, 190, 80, '#F0D890', true) + foe(250, 80) + tx(220, 52, '停在敵人前 2 公尺', { s: 10, c: DIM }) + tx(160, 130, '衝刺速度＝移動速度 ×3', { s: 11 })), b: ['每次普攻都會先往前衝一段，再出手。', '前面有敵人就停在牠前面約 2 公尺，不會撞進怪堆。', '攻擊距離越長，衝得越遠、砍得越大。'] },
      { t: '三種斬法（自動選）', img: svg('<path d="M60 95 L30 55 A50 50 0 0 1 90 55 Z" fill="' + GOLD + '" fill-opacity=".2" stroke="' + GOLD + '"/>' + me(60, 95, '#7A7AE8') + tx(60, 135, '橫斬 120°', { s: 11 }) + '<rect x="155" y="35" width="10" height="60" fill="' + GOLD + '" fill-opacity=".3" stroke="' + GOLD + '"/>' + me(160, 105, '#7A7AE8') + tx(160, 135, '直劈 +40%', { s: 11 }) + '<rect x="255" y="20" width="10" height="75" fill="#9AD8FF" fill-opacity=".3" stroke="#9AD8FF"/>' + me(260, 105, '#7A7AE8') + tx(260, 135, '突刺 長1.2・穿透', { s: 11 })), b: ['<b>橫斬</b>：前方 120 度，衝 1 公尺。', '<b>直劈</b>：細長一刀、傷害 +40%，衝 2 公尺。', '<b>突刺</b>：更長、穿透 +40%，衝 4 公尺。', '只有 1 隻敵人：遠就突刺、近就直劈；2～4 隻：三種輪流；5 隻以上：橫斬。翻滾後下一刀一定是突刺。'] },
      { t: '收刀（' + T('X', '職業條') + '）', img: svg(step3('按 ' + T('X', '職業條'), '讀條 2 秒', '收刀狀態') + inp(55, 80, 'X', '職業', true) + bar(110, 75, 100, 0.6, '#9AB0D0', '移動 −50%') + me(265, 80, '#7A7AE8')), b: ['按 ' + CLS_KEY() + ' 收刀，讀條 2 秒（不會被打斷，期間走路變慢一半）。', '收刀時不能普攻、不能放技能，大招可以。', '再按一次拔刀，一樣讀 2 秒。左邊的職業條會寫【收刀】或【拔刀】。'] },
      { t: '刀意', img: svg(me(80, 80, '#7A7AE8') + bar(130, 45, 150, 1, '#DDEEFF', '刀意 100／100') + tx(205, 90, '收刀 4 秒集滿・普攻打中 +15', { s: 11 }) + tx(205, 115, '滿了：移動 +25%', { s: 11, c: '#F0D890' })), b: ['刀意不會自己漲。', '收刀狀態下 4 秒集滿；拔刀時普攻打中每刀 +15（約 7 刀滿）。', '刀意滿了移動 +25%，再看你是收刀還是拔刀，效果不一樣（下兩頁）。'] },
      { t: '居合 → 殘心', img: svg(step3('收刀＋刀意滿', '普攻或技能', '居合！進殘心') + me(55, 80, '#7A7AE8') + arr(70, 80, 150, 80, '#F0D890') + '<path d="M235 80 L205 50 A40 40 0 0 1 265 50 Z" fill="#F0D890" fill-opacity=".3" stroke="#F0D890"/>' + me(235, 80, '#7A7AE8')), b: ['收刀中刀意滿了，下一次普攻或技能就是<b>居合</b>：用掉全部刀意、直接拔刀。', '普攻居合：必定橫斬、衝 4 公尺、範圍 +40%、傷害 ×2、穿透 +40%。技能居合：傷害 +40%。', '之後進入<b>殘心</b> 5 秒：收刀、拔刀快一倍，刀意 +40%，受到傷害 −20%。'] },
      { t: '刀意渾圓 → 反切', img: svg(me(110, 80, '#7A7AE8') + ring(110, 80, 26, '#FFE08A') + foe(200, 80) + arr(188, 80, 130, 80, '#E8503A', true) + tx(110, 130, '渾圓：攻速+25% 範圍+10% 傷害+10%', { s: 10 }) + bubble(240, 40, '反切！')), b: ['拔刀中刀意滿了＝<b>刀意渾圓</b>：攻速 +25%、範圍 +10%、所有傷害 +10%。', '渾圓時被打到＝<b>反切</b>：這一下完全不痛、無敵 0.4 秒、原地回砍一刀橫斬。', '反切後刀意歸零，要重新累積。雙刀不能反切。'] },
      { t: '武器差別', img: svg(tx(160, 45, '刀：1 秒一刀・傷害 ×2.5', { s: 12 }) + tx(160, 80, '雙刀：1.5 秒一次、砍 2 下・收刀 ×1.5・不能反切', { s: 12 }) + tx(160, 115, '野太刀：1.5 秒一刀・傷害 ×2', { s: 12 })), b: ['刀最平均。', '雙刀一次砍兩下，但收刀比較慢，也不能反切。', '野太刀慢但重、距離長，衝得也比較遠。', '這些倍率只算在普攻上，技能威力照舊。'] },
      ultPage('blade'), advPage('blade')
    ],
    knight: () => [   // 2026-10-13：防禦改成按住職業鍵（另一位作者正在改），文字照新的寫
      { t: '按住防禦', img: svg(me(150, 80, '#5A7AE8') + '<path d="M168 60 q14 20 0 40" stroke="' + GOLD + '" stroke-width="4" fill="none"/>' + foe(240, 80) + arr(225, 80, 175, 80, '#A8442F') + inp(60, 80, 'X', '防禦', true) + tx(60, 115, '按住', { s: 11, c: DIM }) + tx(200, 130, '一般防禦擋下 80% 傷害', { s: 11 })), b: ['按住 ' + CLS_KEY() + ' 舉盾防禦，放開就收盾。', '防禦時擋下 80% 的傷害。', '身邊的隊友也會少受一些傷害。'] },
      { t: '完美格擋', img: svg(step3('敵人出手', '剛好舉盾', '完美格擋') + foe(55, 80) + inp(160, 80, 'X', '防禦', true) + me(265, 80, '#5A7AE8') + ring(265, 80, 28, '#F0D890', 0.2)), b: ['敵人打過來的前一刻才舉盾＝完美格擋。', '完美格擋擋下 90% 的傷害，敵人還會暈眩。', '看準時機比一直按著更好用。'] },
      { t: '盾擊反制', img: svg(me(120, 80, '#5A7AE8') + foe(200, 80) + arr(135, 80, 185, 80, '#F0D890') + bubble(160, 40, '盾擊！') + tx(160, 125, '防禦中被打就自動盾擊（每 0.5 秒最多一次）', { s: 11 })), b: ['防禦中被打到，會自動用盾回擊。', '每 0.5 秒最多觸發一次。'] },
      ultPage('knight'), advPage('knight')
    ],
    monk: () => [   // 2026-10-13 作者：武術家要講得特別清楚（monkstance.js）
      { t: '四種「法」輪流換', img: svg(['拳法', '掌法', '步法', '腿法'].map((s, i) => bubble(48 + i * 75, 55, s, ['#5A2A1A', '#1A3A5A', '#1A4A2A', '#4A3A10'][i])).join('') + [0, 1, 2].map(i => arr(72 + i * 75, 55, 100 + i * 75, 55, DIM)).join('') + '<path d="M273 70 q0 30 -113 30 q-112 0 -112 -28" stroke="' + DIM + '" fill="none" stroke-dasharray="4 3"/>' + inp(160, 125, 'X', '職業', true)), b: ['按 ' + CLS_KEY() + ' 換「法」，順序固定：拳法 → 掌法 → 步法 → 腿法 → 又回到拳法。', '可以一直用同一種，也可以常常換來接招。'] },
      { t: '每一種法的特色', img: svg(tx(80, 35, '拳法', { b: 1, c: '#FF8A5A' }) + tx(80, 52, '出拳最快', { s: 11 }) + tx(240, 35, '掌法', { b: 1, c: '#7AC8FF' }) + tx(240, 52, '把敵人打飛', { s: 11 }) + tx(80, 95, '步法', { b: 1, c: '#8AE07A' }) + tx(80, 112, '每一拳往前跨一步', { s: 11 }) + tx(80, 128, '技能冷卻更快', { s: 10, c: DIM }) + tx(240, 95, '腿法', { b: 1, c: '#E8C04A' }) + tx(240, 112, '很慢，但一腳很重', { s: 11 }) + tx(240, 128, '範圍更大', { s: 10, c: DIM })), b: ['拳法：出拳快，適合一直打。', '掌法：把敵人打飛，拉開距離。', '步法：每一拳往準心跨一步，前面有敵人就停在牠面前。', '腿法：很慢，但傷害很高、範圍更大。'] },
      { t: '打中攢「勢」', img: svg(me(70, 75, '#E8A05A') + foe(130, 75) + arr(85, 75, 118, 75) + tx(130, 50, '+10', { b: 1, c: '#F0D890' }) + bar(170, 70, 120, 1, '#F0D890', '勢（滿 100）') + tx(230, 110, '10 下打中就滿', { s: 11 })), b: ['普攻打中一次，「勢」+10。', '勢最多 100，畫面上的職業條看得到。', '勢滿了，下一次換法會「爆發」。'] },
      { t: '勢滿再換法＝爆發', img: svg(bar(30, 40, 90, 1, '#F0D890', '勢滿') + arr(130, 45, 170, 45) + inp(200, 45, 'X', '職業', true) + arr(225, 45, 260, 45) + bubble(285, 45, '爆發', '#7A3424') + tx(160, 100, '「換過去的那一法」會爆發', { s: 12, b: 1 }) + tx(160, 122, '例：掌法 → 步法 ＝ 步勢爆發', { s: 11, c: DIM })), b: ['勢滿了以後按 ' + CLS_KEY() + ' 換法。', '換過去的那一法會爆發一次強力效果。', '爆發還剩幾秒、幾下，畫面下方的狀態格會顯示。'] },
      { t: '四種爆發', img: svg(tx(80, 30, '掌勢爆發（拳→掌）', { b: 1, c: '#7AC8FF', s: 11 }) + tx(80, 47, '下一掌超大範圍打飛', { s: 10 }) + tx(80, 62, '撞牆暈眩、勢馬上回滿', { s: 10, c: DIM }) + tx(240, 30, '步勢爆發（掌→步）', { b: 1, c: '#8AE07A', s: 11 }) + tx(240, 47, '接下來 3 拳瞬間閃到', { s: 10 }) + tx(240, 62, '敵人面前、更痛', { s: 10, c: DIM }) + tx(80, 95, '腿勢爆發（步→腿）', { b: 1, c: '#E8C04A', s: 11 }) + tx(80, 112, '下兩腳傷害 ×2、暈眩', { s: 10 }) + tx(80, 127, '打倒敵人回一半勢', { s: 10, c: DIM }) + tx(240, 95, '拳勢爆發（腿→拳）', { b: 1, c: '#FF8A5A', s: 11 }) + tx(240, 112, '一陣子每拳多揮一下', { s: 10 }) + tx(240, 127, '換別的法也留著', { s: 10, c: DIM })), b: ['掌勢：下一掌範圍很大、把敵人打很遠；撞到牆的敵人會暈，你的勢馬上回滿。', '步勢：接下來 3 拳會瞬間閃到準心方向的敵人面前（沒有敵人就往準心閃，也能用來逃）。', '腿勢：下兩腳傷害加倍、讓敵人暈眩。', '拳勢：幾秒內每一拳都多揮一下。'] },
      { t: '推薦接法', img: svg(step3('拳法連打攢勢', '換掌法打飛撞牆', '勢回滿→換步法閃過去') + ['#FF8A5A', '#7AC8FF', '#8AE07A'].map((c, i) => '<circle cx="' + (55 + i * 105) + '" cy="80" r="18" fill="' + c + '" opacity=".35" stroke="' + c + '"/>').join('')), b: ['用拳法打 10 下把勢攢滿。', '換成掌法：下一掌把敵人打到牆上，勢馬上又滿。', '再換步法：3 拳閃到敵人面前連打。接著換腿法收尾。', '不用一次記住，先試「拳法攢滿 → 換掌法」就好。'] },
      { t: '注意：攻速', img: svg(bubble(90, 70, '攻速 +10%') + arr(150, 70, 190, 70) + bubble(250, 70, '普攻傷害 +7.5%') + tx(160, 120, '裝備、天賦的攻速會換成傷害', { s: 11 })), b: ['裝備和天賦給的攻速對武術家沒用。', '它會自動換成普攻傷害，不會浪費。'] },
      ultPage('monk'), advPage('monk')
    ],
    bard: () => [
      { t: '換和弦', img: svg(['C', 'Am', 'Cmaj7', 'Fmaj9', 'Dm11'].map((s, i) => bubble(40 + i * 60, 55, s, '#2E2836')).join('') + tx(40, 85, '傷害', { s: 10, c: DIM }) + tx(100, 85, '恢復', { s: 10, c: DIM }) + tx(160, 85, '範圍', { s: 10, c: DIM }) + tx(220, 85, '急速', { s: 10, c: DIM }) + tx(280, 85, '回魔', { s: 10, c: DIM }) + inp(160, 120, 'X', '點一下', true)), b: ['點一下 ' + CLS_KEY() + ' 換和弦。', '一開始有 C（傷害）和 Am（恢復與護盾）。', '升級後會學到更多和弦。'] },
      { t: '寫樂譜', img: svg([0, 1, 2, 3, 4].map(i => '<line x1="30" y1="' + (40 + i * 10) + '" x2="290" y2="' + (40 + i * 10) + '" stroke="#5A5060"/>').join('') + '<circle cx="70" cy="70" r="6" fill="#E8C04A"/><circle cx="110" cy="60" r="6" fill="#E8C04A"/><circle cx="160" cy="55" r="7" fill="#E8443A"/><circle cx="230" cy="65" r="8" fill="none" stroke="#5AE8A0" stroke-width="3"/>' + tx(70, 105, '普攻＝八分', { s: 10 }) + tx(160, 105, '技能＝四分', { s: 10 }) + tx(230, 105, '大技能＝二分', { s: 10 }) + inp(40, 125, 'X', '長按', true) + tx(180, 135, '金＝普攻　紅＝攻擊　綠＝增益', { s: 10, c: DIM })), b: ['按住 ' + CLS_KEY() + ' 開始錄樂譜（10 秒）。', '這段時間按的普攻、技能都會寫成音符。', '寫滿一個小節（4 拍）就結束。'] },
      { t: '出手＝先演奏再發出', img: svg(step3('按普攻或技能', '演奏 2 秒', '發出音符／技能') + atkIn(55, 75) + '<path d="M140 80 q10 -20 20 0 t20 0" stroke="' + GOLD + '" fill="none" stroke-width="2"/>' + me(250, 80, '#E8A0E0') + arr(262, 80, 300, 70, '#E8443A')), b: ['之後每次出手，都會先照樂譜演奏一段。', '演奏時可以走路、翻滾，但不能普攻。', '演奏中按的下一招會記住，演奏完馬上接著放。', '樂譜是空的話，普攻不會發出攻擊。'] },
      { t: '音符的效果', img: svg('<circle cx="80" cy="60" r="8" fill="#E8443A"/>' + ring(80, 60, 26, '#E8443A') + tx(80, 110, '攻擊音符：撞到就炸', { s: 11 }) + '<circle cx="230" cy="60" r="8" fill="#5AE8A0"/>' + me(230, 60, '#E8A0E0') + ring(230, 60, 24, '#5AE8A0') + tx(230, 110, '增益音符：給護盾', { s: 11 }) + tx(160, 135, '普攻護盾和技能護盾可以疊在一起', { s: 10, c: DIM })), b: ['普攻演奏時，音符會一顆一顆射出去。', '紅色攻擊音符撞到敵人或牆會炸開。', '綠色增益音符給你和隊友護盾。', '普攻給的護盾和技能給的護盾分開算、可以疊。'] },
      { t: '技能照樂譜變強', img: svg(bubble(80, 50, '紅音符多') + arr(130, 50, 170, 50) + tx(240, 54, '傷害、範圍↑', { s: 11 }) + bubble(80, 95, '綠音符多') + arr(130, 95, 170, 95) + tx(240, 99, '恢復↑、冷卻↓', { s: 11 }) + tx(160, 135, '五線譜下面會列出這份樂譜的加成', { s: 10, c: DIM })), b: ['放技能時，樂譜裡的音符決定加成。', '同一種音符重複放，效果會越來越少。', '五線譜底下會直接寫出這份樂譜的加成。'] },
      ultPage('bard'), advPage('bard')
    ],
    summoner: () => [
      { t: '召喚物集火', img: svg(me(60, 80, '#A05AE8') + '<circle cx="110" cy="50" r="7" fill="#C8A0FF"/><circle cx="110" cy="110" r="7" fill="#C8A0FF"/>' + arr(118, 52, 225, 75, '#C8A0FF', 1) + arr(118, 108, 225, 85, '#C8A0FF', 1) + foe(240, 80, 10) + tx(240, 115, '你最後打的那一隻', { s: 11 })), b: ['召喚物會一起打你最後打的那一隻。', '先打你想先解決的敵人就好。'] },
      { t: '收回與魔力', img: svg(inp(70, 75, 'X', '長按', true) + tx(210, 55, '按住 0.5 秒＝收回', { b: 1 }) + tx(210, 80, '退回一半召喚魔力', { s: 11 }) + bar(140, 100, 140, 0.6, '#5A8AE8', '魔力') + tx(210, 132, '召喚物不限時間，每秒吃一點魔力', { s: 10, c: DIM })), b: ['召喚物不會自己消失，但在場時每隻每秒吃一點魔力（小隻約 0.6、大隻約 2）。', '魔力見底時，最弱的那隻先散掉。', '按住 ' + CLS_KEY() + ' 收回全部：不會爆炸，退回一半魔力。', '召喚技能放出來後技能格會一直亮著：點一下沒有效果，按住那個技能鍵 0.5 秒只解除那一格的召喚物；召喚物都走了才開始冷卻（萬獸師點一下再疊一隻）。', '「獻祭」只有轉職死靈法師才有，炸的是叫起來的亡者，不是你的召喚物。'] },
      { t: '帶召喚獸進遺跡', img: svg(tx(160, 40, '休息區：選這一趟要帶的', { s: 12 }) + '<rect x="60" y="60" width="40" height="40" rx="6" fill="#232A1C" stroke="#B8E07A"/><rect x="110" y="60" width="40" height="40" rx="6" fill="#232A1C" stroke="#B8E07A"/><rect x="160" y="60" width="40" height="40" rx="6" fill="#232A1C" stroke="#B8E07A"/><rect x="210" y="60" width="40" height="40" rx="6" fill="#1A1820" stroke="#3A3644"/>' + tx(160, 125, '最多五格・進去就鎖住', { s: 11 })), b: ['召喚師身體脆弱（生命 −25%、防禦 −40%），但召喚物很強（傷害 +40%、血量 +30%）。', '進遺跡時，第 0 層的休息區會問你這一趟要帶哪些召喚獸（技能格最多五格，照等級開）。', '進了遺跡就不能換；在休息區可以按左下角「換攜帶的召喚獸」再改。', '轉職補身體：萬獸師每隻召喚獸讓你受到的傷害 −2%（最多 −20%）；死靈法師的亡者打出去的傷害 10% 回成你的生命；式神使替你分擔 30% 的傷害。'] },
      { t: '協同攻擊', img: svg(me(60, 80, '#A05AE8') + arr(80, 80, 220, 80, '#B8E07A', 1) + foe(240, 80, 10) + '<circle cx="215" cy="55" r="7" fill="#A88A5A"/><circle cx="215" cy="105" r="7" fill="#A88A5A"/>' + tx(160, 135, '普攻打中 → 召喚物一起撲上去', { s: 11 })), b: ['召喚師的普攻不吃魔力。', '普攻打中敵人時，所有召喚物會馬上一起撲上去打那一隻（2.5 秒一次，職業條上會寫還要等幾秒）。', '護衛的時候只打你身邊的敵人。', '召喚物有血量：顯示在召喚牠的技能格上面，被打倒就散掉；離開戰鬥會慢慢回血。'] },
      { t: '材質', img: svg(tx(160, 30, '召喚物的身體用這一層的元素捏成', { s: 11 }) + '<circle cx="70" cy="80" r="12" fill="#A88A5A"/><circle cx="130" cy="80" r="12" fill="#5AA84A"/><circle cx="190" cy="80" r="12" fill="#9AD8FF"/><circle cx="250" cy="80" r="12" fill="#FF6A3A"/>' + tx(160, 120, '土・木・冰・火……各有各的效果', { s: 10, c: DIM })), b: ['材質看遺跡的環境：雪地多冰、火山多火、森林多木。', '火燒、冰慢、雷連鎖、土耐打、金破甲、水回血、木定身、風跑得快。'] },
      { t: '意念', img: svg(inp(60, 70, 'X', '職業', true) + tx(200, 60, '集火 → 護衛 → 狂奔', { b: 1 }) + tx(200, 95, '點一下換', { s: 11, c: DIM })), b: ['點一下 ' + CLS_KEY() + ' 換意念：集火你打的那隻、護衛你身邊、狂奔各打各的。', '召喚物的傷害一律 +50%；職業條上的長條是協同攻擊的冷卻，滿了就能再觸發。', '同一招召喚技能在場上只會有一組，重放會換掉舊的（萬獸師例外）；召喚物一直待著，直到魔力用完或你收回。'] },
      { t: '轉職：死靈法師', img: svg(foe(110, 80, 10) + arr(130, 80, 200, 80, '#9A5AD8', 1) + '<circle cx="225" cy="80" r="11" fill="#4A2A5E" stroke="#9A5AD8"/>' + tx(160, 130, '倒下的敵人 → 你的亡者', { s: 11 })), b: ['死靈法師用「起屍」讓剛倒下的敵人站起來替你打（最多 4 隻），樣子和招式照牠原本的。', '牆、眼球、砲台、圖騰、水晶、物品和領主叫不起來。', '「獻祭」只有死靈法師能用：炸掉亡者，每隻回 5% 生命、5% 魔力；一般召喚物不會被炸。'] },
      ultPage('summoner'), advPage('summoner')
    ],
    arraymage: () => [
      { t: '畫陣紋', img: svg((() => { const c = [160, 72], r = 46, pts = [90, 30, -30, -90, -150, 150].map(a => [c[0] + Math.cos(a * Math.PI / 180) * r, c[1] - Math.sin(a * Math.PI / 180) * r]), col = ['#E8443A', '#A05AE8', '#F2D23A', '#3A7AE8', '#4AC85A', '#F4F4F4']; return '<polygon points="' + pts.map(p => p.join(',')).join(' ') + '" fill="none" stroke="#5A5060"/>' + '<polyline points="' + [pts[1], pts[2], c].map(p => p.join(',')).join(' ') + '" stroke="' + GOLD + '" stroke-width="3" fill="none"/>' + pts.map((p, i) => '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="7" fill="' + col[i] + '"/>').join('') + '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="7" fill="#222" stroke="#888"/>' + ['傷', '範', '速', '擋', '治', '冷'].map((s, i) => tx(pts[i][0] + (pts[i][0] > 160 ? 16 : pts[i][0] < 160 ? -16 : 0), pts[i][1] + (i === 0 ? -10 : i === 3 ? 20 : 4), s, { s: 10, c: DIM })).join(''); })() + inp(40, 125, 'X', '職業', true) + tx(255, 135, '點＝核心　拖＝線段', { s: 10, c: DIM })), b: ['按 ' + CLS_KEY() + ' 打開陣紋畫面：一個六邊形，7 個點。', '點一下一個點＝「核心」：加強普攻。', '按住拖過幾個點＝「線段」：加強技能，效果看起點的顏色。', '拖回起點＝「閉環」：腳下的光環。' + T('右鍵刪掉。', '')] },
      { t: '能用的點', img: svg(bar(40, 60, 240, 2 / 7, GOLD, '一開始 2 個點，每 5 級多 1 個，最多 7 個') + tx(160, 110, '每個點只能用在一個圖形裡', { s: 11 })), b: ['一開始只能用 2 個點。', '每升 5 級多 1 個，最多 7 個。'] },
      { t: '放技能', img: svg(step3('按技能＝看範圍', '確認位置', '蓄力 1 秒放出') + ring(55, 80, 22, '#A05AE8', 0.08) + inp(160, 80, '左鍵', '再點', true) + ring(265, 80, 22, '#A05AE8', 0.4)), b: ['按 ' + SKL() + ' 先顯示半透明的範圍。', T('按 ' + K('左鍵'), '再點一下') + ' 確認，蓄力 1 秒後放出。再按同一個技能＝取消。', '技能中心只要在普攻射程內，哪裡都能放；放下去就定在那裡，走開也不會跟著跑。', '蓄力的時候也能照樣普攻，兩邊不會互相擋。', '一星以後可以在陣紋畫面改成「快速施法」。'] },
      { t: '核心・線段・Loop', img: svg(ring(70, 80, 14, '#E8443A', 0.3) + '<polyline points="130,100 160,55 190,100" stroke="#A05AE8" stroke-width="3" fill="none"/>' + '<polygon points="230,100 260,55 290,100" fill="rgba(242,210,58,.15)" stroke="#F2D23A" stroke-width="2"/>' + tx(70, 130, '核心＝普攻', { s: 10 }) + tx(160, 130, '線段＝技能', { s: 10 }) + tx(260, 130, 'Loop＝光環', { s: 10 })), b: ['點一下節點＝核心（Core）：加強普攻。', '按住拖過幾個節點＝線段（Line）：加強技能，經過的節點越多越強。', '拖回起點＝Loop：以你為中心的光環，起點兩邊的夾角要 ≥ 60°。', '效果看起點節點的顏色；右鍵刪掉圖形。'] },
      { t: '普攻與核心', img: svg(me(110, 80, '#9AE8FF') + ring(110, 80, 34, '#4AC85A', 0.15) + foe(230, 80) + ring(230, 80, 30, '#9AE8FF', 0.12) + tx(110, 130, '自己在法陣裡', { s: 10, c: DIM }) + tx(230, 130, '或打中敵人', { s: 10, c: DIM })), b: ['普攻耗魔 1.5，每個核心再 +0.25（魔力核心照樣 −75%）。', '治療核心：每 2 下普攻，第 2 下回復 1% 魔力上限的生命。', '治療、格擋核心要「打中敵人」或「自己站在這下普攻的法陣裡」才有效。'] },
      ultPage('arraymage'), advPage('arraymage')
    ],
    enchanter: () => [
      { t: '換刻印', img: svg(['焰', '霜', '雷', '風', '金'].map((s, i) => bubble(40 + i * 60, 60, s, ['#5A2A1A', '#1A3A5A', '#4A4A1A', '#1A4A3A', '#4A3A10'][i])).join('') + inp(160, 115, 'X', '職業', true)), b: ['按 ' + CLS_KEY() + ' 依序換武器上的刻印：焰、霜、雷、風、金。', '刻著的刻印會改變你的技能和普攻。'] },
      { t: '刻印有什麼不同', img: svg(tx(80, 35, '焰：技能更痛、燒傷', { s: 11 }) + tx(240, 35, '霜：變慢、定身', { s: 11 }) + tx(80, 75, '雷：冷卻快、攻速快', { s: 11 }) + tx(240, 75, '風：揮刀放劍氣', { s: 11 }) + tx(160, 115, '金：破甲、範圍小但更痛', { s: 11 })), b: ['焰：技能更痛，會燃燒。', '霜：讓敵人變慢，範圍技會定身。', '雷：技能冷卻快、攻速快。', '風：每一揮放出劍氣。金：破甲、更痛但範圍小。'] },
      { t: '攢滿自動釋放', img: svg(me(70, 80, '#E8C04A') + foe(130, 80) + bar(170, 50, 120, 1, '#E8C04A', '刻印的力量') + ring(230, 100, 26, '#F0D890') + tx(230, 140, '滿了自動放出刻印的招', { s: 10 })), b: ['普攻打中會攢「刻印的力量」。', '攢滿了自動放出現在這個刻印的招式。', '換刻印不會清掉攢的力量。'] },
      ultPage('enchanter'), advPage('enchanter')
    ],
    scroll: () => [   // 2026-10-13 符卷師重做（諾克薩派）
      { t: '寫卷軸', img: svg(tx(160, 30, '白藤堂・符卷師的書桌', { s: 11 }) + bubble(80, 70, '符卷書', '#3A2E1A') + arr(115, 70, 165, 70, DIM) + '<rect x="185" y="52" width="70" height="36" rx="3" fill="#D8C098"/>' + tx(220, 75, '卷軸', { c: '#3A2A1A', b: 1 }) + tx(160, 122, '紙錢在寫的時候付，戰鬥中不扣錢', { s: 10, c: DIM })), b: ['在符卷書裡跟術士一樣配法術（元素＋形狀＋效果），綁到技能格。', '到書桌把法術寫到牛皮紙上：一張紙一張卷軸。'] },
      { t: '撕卷與齊發', img: svg(me(70, 80) + arr(85, 80, 150, 60, '#E8C878') + arr(85, 80, 150, 80, '#E8C878') + arr(85, 80, 150, 100, '#E8C878') + foe(240, 80, 12) + tx(160, 135, '0.6 秒內連撕＝齊發，每張傷害加成', { s: 10 })), b: ['按技能鍵＝撕開一張卷軸：馬上放出、不耗魔力。', '0.6 秒內連撕好幾張＝齊發，傷害一張比一張高。', '克森特級以上的遺跡魔力太濃，偶爾會失敗或自己發動。'] },
      { t: '連鎖', img: svg(['技能 A', '技能 B', '技能 C'].map((s, i) => bubble(55 + i * 90, 55, s)).join('') + arr(85, 55, 112, 55, DIM) + arr(175, 55, 202, 55, DIM) + arr(235, 70, 235, 100) + tx(235, 120, 'C 免費再放一次', { s: 11, b: 1 })), b: ['短時間內放出三種「不同」的技能＝連鎖。', '最後那一招會免費再放一次。'] },
      { t: '展卷', img: svg(inp(70, 75, 'X', '職業', true) + arr(95, 75, 140, 75) + tx(220, 70, '用掉 3 張卷軸', { s: 12 }) + tx(220, 92, '所有技能冷卻歸零', { s: 12, b: 1 })), b: ['按 ' + CLS_KEY() + ' 展卷：用掉 3 張寫好的卷軸。', '所有技能的冷卻馬上歸零（隔一段時間才能再用）。'] },
      ultPage('scroll'), advPage('scroll')
    ]
  };
  const common = cls => ({ t: '基本操作', img: svg(atkIn(60, 70) + tx(60, 125, '普攻', { s: 11 }) + inp(140, 70, T('Q', ''), '技能', false) + tx(140, 125, '技能', { s: 11 }) + inp(210, 70, 'X', '職業', true) + tx(210, 125, '職業特效', { s: 11, b: 1 }) + inp(275, 70, 'V', '大招', false) + tx(275, 125, '大招', { s: 11 })),
    b: ['普攻：' + ATK() + '。技能：' + SKL() + '。', '每個職業都有一個「職業特效」，用 ' + CLS_KEY() + ' 操作——這份說明主要就是講它。', '翻滾：' + DODGE() + '，翻滾中不會受傷。'] });
  R.classGuidePages = cls => { const f = G[cls]; if (!f) return []; return [common(cls)].concat(f().filter(Boolean)); };

  // ---------- 視窗 ----------
  let cur = null;
  const close = () => { const m = $('cg-modal'); if (m) m.hidden = true; cur = null; };
  const render = () => {
    const m = $('cg-modal'); if (!m || !cur) return;
    const P = cur.pages, i = cur.i, p = P[i], d = R.CLASSES[cur.cls] || {}, last = i === P.length - 1, det = cur.cls === 'knight' ? '' : detail(cur.cls);   // 騎士的防禦正在改成按住職業鍵，舊的數字先不列
    m.firstChild.innerHTML = '<div class="cg-h"><small>' + esc(d.name || '') + '・技能機制說明　' + (i + 1) + ' / ' + P.length + '</small><button type="button" class="cg-x" data-cg="x" aria-label="關閉">✕</button></div>'
      + '<b class="cg-t">' + esc(p.t) + '</b>' + (p.img || '') + '<ol class="cg-b">' + p.b.map(s => '<li>' + s + '</li>').join('') + '</ol>'
      + (last && det ? '<details class="cg-more"><summary>更多細節（確切數字）</summary><p>' + esc(det) + '</p></details>' : '')
      + '<div class="cg-dots">' + P.map((_, j) => '<i class="' + (j === i ? 'on' : '') + '" data-cgp="' + j + '"></i>').join('') + '</div>'
      + '<div class="cg-row"><button type="button" data-cg="back">返回職業說明</button><span style="flex:1"></span><button type="button" data-cg="prev"' + (i ? '' : ' disabled') + '>上一頁</button><button type="button" class="pri" data-cg="' + (last ? 'x' : 'next') + '">' + (last ? '看完了' : '下一頁') + '</button></div>';
  };
  R.showClassGuide = cls => {
    const pages = R.classGuidePages(cls); if (!pages.length) return;
    let m = $('cg-modal'); if (!m) { m = document.createElement('div'); m.id = 'cg-modal'; m.innerHTML = '<div class="cg-card" role="dialog" aria-modal="true"></div>'; m.onclick = ev => { if (ev.target === m) close(); }; document.body.appendChild(m); swipe(m); }
    cur = { cls, pages, i: 0 }; m.hidden = false; render();
  };
  const go = d => { if (!cur) return; cur.i = Math.max(0, Math.min(cur.pages.length - 1, cur.i + d)); render(); };
  const swipe = m => { let x0 = null; m.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true }); m.addEventListener('touchend', e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null; if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1); }, { passive: true }); };
  document.addEventListener('click', ev => {
    const t = ev.target; if (!t || !t.closest) return;
    const g = t.closest('[data-cigd]'); if (g) { ev.preventDefault(); ev.stopPropagation(); R.showClassGuide(g.dataset.cigd); return; }
    const b = t.closest('#cg-modal [data-cg]'), dot = t.closest('#cg-modal [data-cgp]');
    if (dot && cur) { cur.i = +dot.dataset.cgp; render(); return; }
    if (!b) return; ev.preventDefault(); ev.stopPropagation();
    const a = b.dataset.cg; if (a === 'next') go(1); else if (a === 'prev') go(-1); else close();
  }, true);
  document.addEventListener('keydown', ev => {
    const m = $('cg-modal'); if (!m || m.hidden) return;
    if (ev.key === 'Escape') { ev.stopPropagation(); ev.preventDefault(); close(); } else if (ev.key === 'ArrowRight') { ev.stopPropagation(); go(1); } else if (ev.key === 'ArrowLeft') { ev.stopPropagation(); go(-1); }
  }, true);
  const css = document.createElement('style');
  css.textContent = '#cg-modal{position:fixed;inset:0;z-index:9100;display:flex;align-items:center;justify-content:center;padding:12px;background:rgba(8,6,12,.55)}#cg-modal[hidden]{display:none}'
    + '.cg-card{width:min(440px,100%);max-height:calc(100vh - 24px);overflow:auto;background:linear-gradient(180deg,#26202E,#1C1822);color:#E8E0D0;border:1px solid rgba(201,161,58,.45);border-top:3px solid #A8442F;border-radius:8px;box-shadow:0 8px 28px rgba(0,0,0,.6);padding:12px 14px;font-size:14px;line-height:1.6}'
    + '.cg-h{display:flex;justify-content:space-between;align-items:center}.cg-h small{color:#B5AA96;font-size:11.5px}.cg-x{background:none;border:none;color:#B5AA96;font-size:16px;cursor:pointer;padding:2px 6px}'
    + '.cg-t{display:block;font-size:16px;color:#F0D890;margin:2px 0 8px}.cg-svg{display:block;width:100%;height:auto;margin:0 0 8px}.cg-b{margin:0;padding-left:20px}.cg-b li{margin:3px 0}'
    + '.cg-card kbd{background:#3A3240;border:1px solid #5A5060;border-bottom-width:2px;border-radius:3px;padding:0 5px;font-size:12px;color:#F0E6D0}'
    + '.cg-more{margin-top:8px;border:1px solid rgba(201,161,58,.25);border-radius:6px;padding:4px 10px;background:#1A1620}.cg-more summary{cursor:pointer;color:#C9A85A;font-size:13px}.cg-more p{font-size:12.5px;color:#C8BEB0;margin:6px 0}'
    + '.cg-dots{display:flex;gap:4px;margin:10px 0 4px}.cg-dots i{flex:1;height:4px;border-radius:2px;background:#3A3240;cursor:pointer}.cg-dots i.on{background:#C9A13A}'
    + '.cg-row{display:flex;gap:6px;align-items:center;margin-top:6px}.cg-row button{background:#2E2836;color:#E8E0D0;border:1px solid #5A5060;border-radius:4px;padding:5px 12px;font-size:13px;cursor:pointer;min-height:34px}.cg-row button.pri{background:#7A3424;border-color:#A8442F}.cg-row button:disabled{opacity:.4;cursor:default}'
    + '#ci-modal .ci-box .row{gap:8px}.ci-gd{background:#2E2836;color:#F0D890;border:1px solid #C9A85A}'
    + '@media (pointer:coarse){.cg-row button{min-height:42px}}';
  document.head.appendChild(css);
})(window.R);
