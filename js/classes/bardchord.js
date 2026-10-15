// 吟遊詩人重做：X＝和弦、樂譜，出手先演奏（2026-10-10 作者）
// - X（職業鍵；手機點職業條）：點一下換和弦；按住 0.45 秒重新錄製樂譜（錄的時候再按住一次＝提早寫完）。沒有撕掉樂譜。
//   2026-10-11 作者：製作樂譜、更換和弦的按鍵改成 X——原本在 R（右鍵、手機的 R 鈕），技能改放 3～6、最多四招；現在 R 變回一般的技能格（跟其他職業一樣五格）。
// - 寫樂譜：10 秒內記下出手——普攻一下＝八分音符（半拍）、基礎冷卻 13 秒以內的技能＝四分音符（一拍）、13 秒以上＝二分音符（兩拍）；
//   一個小節 4 拍（被動「樂譜延長」多 2 拍），下一個音放不下就寫完。攻擊技能的音符是紅的、增益（守、治）是綠的、普攻是金的；音高照和弦，
//   演奏的時候整段樂譜一起升高或降低 1～2 個音階（每次演奏隨機選一個方向，同一段不會忽升忽降）。
//   2026-10-11 作者：每一拍彈一個和弦（固定的進行，不跟著選的和弦、也不升降）：4 拍 C→F→G→C；6 拍（樂譜延長）C→Em→F→G→Am→C。
//   每半拍一個一半音量的協奏音 do-re-mi-fa-mi-re（一直繞），跟著這段演奏的升降一起升降。
//   寫樂譜的時候普攻、技能照常放出去（普攻是一發普通的音符）。
// - 出手的順序：按下技能或普攻 → 演奏（照樂譜彈出聲音，2 秒；這段時間可以走、翻滾，不能普攻）→ 發出攻擊；下一次技能或普攻再演奏、再發出。
//   樂譜是空的：普攻不會發出任何攻擊；技能照常馬上放。攻速每 +1% 演奏快 1%（+100% 攻速只要一半的時間）。
//   2026-10-11 作者：每次演奏花魔力（後來改成照樂譜算，見下面第二批）；普攻本身不再耗魔力。
//   普攻：演奏完照樂譜一個一個往前方射出音符（每個隔 0.2 秒、吃攻速；方向在前方 5 度內飄）。射的期間可以馬上開始下一次演奏，
//         但一次只能有一段演奏。攻擊音符碰到敵人、撞牆或飛到最遠都會炸開（四分半徑 2 公尺、二分 4 公尺，二分傷害兩倍，算技能傷害）；
//         四分增益音符每個給你和隊友最大魔力 10% 的護盾，二分的再回同樣多的生命（2026-10-11 作者）。
//   技能（2026-10-11 作者）：每個八分音符你和隊友攻速 +10%（8 秒）；攻擊四分每個傷害與範圍 +10%；增益四分每個冷卻 −10%、恢復與護盾 +10%；
//         攻擊二分每個耗魔 +20%、傷害與範圍 +30%、冷卻 +10%；增益二分每個增益效果 +25%，周圍的友軍（含你）得到你最大魔力 10% 的護盾、回復你最大魔力 10% 的生命。
//         同一種音符重複：第二個效果減半、第三個起只剩 1/4（例：八分音符 2 個攻速 +15%、4 個 +20%、8 個 +30%）。
//   （2026-10-13 修：普攻護盾、技能護盾分開記、可以疊；被打時照比例一起扣，各自 6 秒後只拿掉自己剩的）
//   普攻、技能的音符效果各算各的、可以疊；但護盾只會刷新——新的一段演奏換掉上一段演奏給的護盾（普攻、技能分開算），攻速也是刷新。
// - 和弦（一直有效）：大三和弦 傷害 +(10+等級/2)%、小三和弦 恢復與護盾 +(10+等級/2)%（等級算到 40 為止，最多 +30%）；
//   20 級七和弦 範圍 +(10+等級/2)%（2026-10-11 作者：大三和弦與七和弦的效果交換）、30 級九和弦 技能急速 +(40+等級×1.5)、40 級十一和弦 每次演奏完回復 5% 最大魔力。
// - 被動（passives.js）：快速演奏（1 級）演奏時間 −20%、節奏加速（15 級）演奏時間 −30%、樂譜延長（30 級）、絕對音感（26 級）音符效果 +25%。
// - 原本的「樂句」（三個音湊曲子）拿掉。轉職：詠嘆詩人增益音符 ×1.5、戰鼓手攻擊音符 ×1.5、奏域師八分音符的攻速維持兩倍久；
//   傳說：萬曲之琴音符效果 +50%、迴響長笛普攻演奏完射出兩輪音符。和弦、樂譜存在存檔（R.S.bardScore）。
// - 2026-10-11 作者：普攻改成演奏的期間每經過一個音符、發出聲音的那一下就發出那顆音符的普攻（不再等演奏完一次全部發出）；
//   技能的演奏也一樣，每經過一個音符就發出一顆普攻音符，演奏完才放出技能。音符與普攻本身的效果不變。
// - 2026-10-11 作者：技能「和弦」改名「三重奏」，射出的音符撞到敵人炸開（半徑 3 公尺）。
// - 聲音（2026-10-11 作者）：只有演奏的時候有聲音；發出攻擊、音符打中敵人都不出聲。
// - 和弦各有顏色：五線譜的外框（演奏中）、底下的字跟著和弦的顏色；五線譜底下列出現在這份樂譜演奏完技能會得到的加成。
// - 大招狂想曲（2026-10-11 作者）：拿掉增傷、減傷；回復你和隊友「你最大魔力 35%」的生命與魔力，並讓你和隊友得到一倍的樂譜技能加成（10 秒，跟一般技能演奏的加成分開、可以疊）；震擊傷害減半。
// - 2026-10-11 作者（第二批）：
//   和弦換成：大三 C、小三 Cm、七 Cmaj7、九 Cmaj9、十一 Dm11，每個和弦自己一組 4 拍／6 拍的和弦進行（CH 的 prog）；和弦、協奏音小聲 10%、主旋律大聲 5%。
//   每次演奏的魔力照樂譜算：八分 0.5、四分 1.5、二分 5（HUD 武器那一行顯示「每次演奏耗魔」）。寫樂譜的時候普攻只記音符、不發出攻擊。
//   普攻的加成套在演奏發出的音符上：一次普攻射幾發（多重、子彈 +1…），經過一個音符就發出幾顆那個音符（增益音符的護盾一顆音符算一次）。
//   技能數值照最大魔力（拿掉 bard1008.js「效果隨魔力上限變強」的倍率）：治療、護盾＝最大魔力的 %（隊友也照你的最大魔力），
//   強化的 +% 每 100 點最大魔力算一次，技能傷害 × 最大魔力 ÷ 100。終曲改成前方 90 度、半徑 6 公尺的扇形聲波（新的型 cone）；
//   安可：你和隊友回復「你最大魔力 30%」的生命、你再回 15% 魔力，冷卻 30 秒。技能說明照參數重寫（descOf）。
// - 2026-10-12 作者（第三批）：
//   每次演奏只在開頭彈一次主和弦（C、Am、Cmaj7、Fmaj9、Dm11），延音整個小節、音量比原本的和弦大 10%；拿掉每一拍換一個的和弦進行。
//   小三和弦改 Am、九和弦改 Fmaj9。攻速每 +1% 演奏只快 0.5%。
//   演奏中按普攻、技能會記下一個（技能可以蓋掉普攻、普攻蓋不掉技能），演奏完、技能放出去馬上接著做。
//   2026-10-15 作者：普攻要不要接著演奏，改成看「演奏期間有沒有再按一次左鍵（放開再按）」或「最後一拍時左鍵還按著」——
//   以前按住左鍵每一格都在叫普攻，點一下的那幾格落在演奏裡就被記成下一次，所以點一下會演奏兩次。技能照舊優先。
//   寫樂譜的時候放不下的音符略過（不會中斷寫譜）。同一個音符（普攻）、同一招技能打到同一隻敵人：第二下起只剩 20%（三下＝1.4 倍）。
//   增益二分音符的護盾自己一格（half），下一段演奏不會把它換掉；兩段演奏的二分護盾還是不疊（新的換掉舊的）。
//   技能傷害的魔力倍率改成 (200＋最大魔力)÷300（原本 最大魔力÷100）。
//   戰鼓手：每次演奏加一小節鼓（4/4、八分；大鼓 3、7，小鼓 1、2、5、6，踩鈸每個八分，最後一拍過門；樂譜延長 6 拍：大鼓 3、7、11，小鼓 1、2、5、6、9、10）。
//   （2026-10-12 作者：「悲嘆詩人」是吟遊詩人的筆誤，沒有這個轉職）（2026-10-13 作者）樂譜、和弦都是大調（C、Am、Cmaj7、Fmaj9、Dm11），最後一拍再彈一次和弦收尾；主和弦到第四拍漸弱歸零；伴奏 Do-So-Mi-So。
//   奏域師：開頭的和弦用管風琴。
// 放在最後面（main.js 前面）：包在 R.attack、R.castSlot、R.useSkill、R.fire、R.updateShots、R.hurtEnemy、R.calcPlayer、R.step、R.hudTick 最外面。
(function (R) {
  const W = () => R.W, $ = id => document.getElementById(id);
  R.SLOT_OFF = Object.assign(R.SLOT_OFF || {}, { bard: 0 });   // 2026-10-11：R 變回技能格
  R.SLOT_NOTE = Object.assign(R.SLOT_NOTE || {}, { bard: '吟遊詩人的 X（職業鍵）是和弦：點一下換和弦、按住寫樂譜。' });
  const IS = P => !!P && P.cls === 'bard';
  const ME = () => { const w = W(), P = w.P; return IS(P) && w.run && !w.run.done && !P.dead ? P : null; };
  const now = () => performance.now() / 1000;
  const toast = (t, c) => R.toast && R.toast(t, c || '#FFB8E0');
  const leg = P => (R.legOf ? R.legOf(P) : null);
  const inst = P => (R.bardDebug && R.bardDebug.instOf ? R.bardDebug.instOf(P) : 'pluck');
  const melody = (P, notes, v) => { try { R.playMelody && R.playMelody(inst(P), notes, v || 0.09); } catch (e) { } };

  // ---------- 和弦 ----------
  // 2026-10-11 作者：小三和弦改 Cm、七和弦改 Cmaj7、九和弦改 Cmaj9、十一和弦改 Dm11；每個和弦一組 4 拍／6 拍的和弦進行（prog），conc＝協奏音
  const CMAJ_SC = [0, 2, 4, 5, 7, 9, 11];
  const CH = [
    { id: 'maj', name: '大三和弦', sym: 'C', col: '#FF8A5A', lv: 1, tones: [60, 64, 67, 72, 76, 79, 84], sc: CMAJ_SC, prog: { 4: ['C', 'F', 'G', 'C'], 6: ['C', 'Em', 'F', 'G', 'Am', 'C'] } },
    { id: 'min', name: '小三和弦', sym: 'Am', col: '#5AE8B0', lv: 1, tones: [57, 60, 64, 69, 72, 76, 81], sc: CMAJ_SC, conc: [57, 59, 60, 62, 60, 59], prog: { 4: ['Cm', 'Dm', 'Bdim', 'Cm'], 6: ['Cm', 'Em', 'Dm', 'Bdim', 'Am', 'Cm'] } },
    { id: 'sev', name: '七和弦', sym: 'Cmaj7', col: '#C08AFF', lv: 20, tones: [60, 64, 67, 71, 72, 76, 79], sc: CMAJ_SC, prog: { 4: ['Cmaj7', 'Am7', 'Dm7', 'Cmaj7'], 6: ['Cmaj7', 'Am7', 'Dm7', 'G7', 'Em7', 'Cmaj7'] } },
    { id: 'nin', name: '九和弦', sym: 'Fmaj9', col: '#6AB8FF', lv: 30, tones: [65, 69, 72, 76, 79, 81, 84], sc: [0, 2, 4, 5, 7, 9, 10], prog: { 4: ['Cmaj9', 'Am9', 'Dm9', 'Cmaj9'], 6: ['Cmaj9', 'Fmaj9', 'Em9', 'Am9', 'Dm9', 'Cmaj9'] } },
    { id: 'ele', name: '十一和弦', sym: 'Dm11', col: '#FFD86A', lv: 40, tones: [62, 65, 69, 72, 74, 76, 79], sc: CMAJ_SC, prog: { 4: ['Dm11', 'G11sus', 'Cmaj9#11', 'Dm11'], 6: ['Dm11', 'G11sus', 'Cmaj9#11', 'Fmaj9#11', 'G11sus', 'Dm11'] } }
  ];
  // 演奏的時候整段一起升高或降低 d 個音階（沿著和弦的音階走，不會走出調）；d 每段演奏選一次（±1、±2）
  const pickShift = () => (Math.random() < 0.5 ? -1 : 1) * (Math.random() < 0.5 ? 1 : 2);
  const vary = (m, c, d) => {
    const sc = c.sc || [0, 2, 4, 5, 7, 9, 11], all = [];
    for (let o = 3; o <= 8; o++) sc.forEach(p => all.push(o * 12 + p));
    let k = 0; all.forEach((x, j) => { if (Math.abs(x - m) < Math.abs(all[k] - m)) k = j; });
    if (d == null) d = pickShift();
    return all[Math.max(0, Math.min(all.length - 1, k + d))];
  };
  const L40 = P => Math.min(40, P.lv || 1);
  const pctOf = P => 10 + L40(P) / 2;
  const hasteOf = P => 40 + L40(P) * 1.5;
  const SV = () => { const s = R.S || {}; s.bardScore = s.bardScore || { chord: 'maj', notes: null }; return s.bardScore; };
  const chordOf = P => { let c = CH.find(x => x.id === SV().chord); c = c && (P.lv || 1) >= c.lv ? c : CH[0]; return c; };   // 2026-10-13 作者：和弦、樂譜改回大調（Am 本來就是小三和弦）
  const chordDesc = (c, P) => (c.id === 'maj' ? '傷害 +' + pctOf(P) + '%' : c.id === 'min' ? '恢復與護盾 +' + pctOf(P) + '%' : c.id === 'sev' ? '範圍 +' + pctOf(P) + '%' : c.id === 'nin' ? '技能急速 +' + hasteOf(P) : '每次演奏回復 5% 最大魔力');
  const areaK = P => (chordOf(P).id === 'sev' ? 1 + pctOf(P) / 100 : 1);   // 2026-10-11：大三和弦與七和弦交換
  const healK = P => (chordOf(P).id === 'min' ? 1 + pctOf(P) / 100 : 1);
  const dmgK = P => (chordOf(P).id === 'maj' ? 1 + pctOf(P) / 100 : 1);
  const syncHaste = P => { if (!P || !('haste' in P)) return; const want = IS(P) && chordOf(P).id === 'nin' ? hasteOf(P) : 0, had = P._bdHaste || 0; if (want !== had) { P.haste = (P.haste || 0) - had + want; P._bdHaste = want; } };
  const nextChord = P => {
    const av = CH.filter(c => (P.lv || 1) >= c.lv), i = av.findIndex(c => c.id === chordOf(P).id); let c = av[(i + 1) % av.length];
    SV().chord = c.id; syncHaste(P); c = chordOf(P);
    toast('和弦：' + c.sym + ' ' + c.name + '（' + chordDesc(c, P) + '）', c.col);
    melody(P, c.tones.slice(0, 4).map((m, k) => [m, k * 0.06, 0.5]), 0.08);
    R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 1.6, color: c.col });
  };

  // ---------- 音符 ----------
  // d＝拍數（0.5 八分、1 四分、2 二分）；k＝'a' 攻擊、'b' 增益、'n' 普攻
  const COL = { a: '#FF6A5A', b: '#5AE8A0', n: '#FFE08A' };
  const noteOfSkill = id => { const s = R.SKILLS[id]; if (!s) return null; const t = R.bardNoteOf ? R.bardNoteOf(id) : '攻'; return { d: s.cd <= 13 ? 1 : 2, k: t === '攻' ? 'a' : 'b' }; };
  const midiOf = (n, i, c) => c.tones[(n.d < 1 ? 1 + i % 3 : n.k === 'a' ? 3 + i % 4 : i % 3) % c.tones.length];
  const capOf = P => 4 + (P.pv && P.pv.bdExtend ? 2 : 0);
  // 音符效果的倍率：絕對音感 ×1.25、萬曲之琴 ×1.5、詠嘆詩人增益 ×1.5、戰鼓手攻擊 ×1.5
  const nk = (P, k) => (P.pv && P.pv.bdPitch ? 1.25 : 1) * (leg(P) === 'lg_allsong' ? 1.5 : 1) * (k === 'b' && P.adv === 'aria' ? 1.5 : 1) * (k === 'a' && P.adv === 'drummer' ? 1.5 : 1);
  const tally = notes => { const c = { e: 0, aq: 0, bq: 0, ah: 0, bh: 0 }; (notes || []).forEach(n => { if (n.d < 1) c.e++; else if (n.d < 2) c[n.k === 'a' ? 'aq' : 'bq']++; else c[n.k === 'a' ? 'ah' : 'bh']++; }); return c; };

  // ---------- 這一趟的狀態 ----------
  // q＝演奏完還沒射出去的音符（一個一個射）、qT＝下一個還要等幾秒、qO＝射出去的樣子（照那一下普攻）
  // pid＝第幾段演奏（護盾照這個刷新）；ally＝電腦隊友身上的攻速、傷害加成（時間到還原）
  const ST = { run: null, rec: null, perf: null, cast: null, release: null, inRel: false, press: null, lastShotT: 0, hintT: -99, ally: [], q: [], qT: 0, qO: null, pid: 0, buf: null, bufGo: false, src: null, curSrc: null, inUS: false, hl: new Map() };
  // ---------- 同一個音符、同一招打到同一隻敵人：第二下起 20%（2026-10-12 作者） ----------
  // 來源：音符射出去的那一發（'n段號:第幾個'）、技能這一次施放（'k段號'，包含它之後用 setTimeout 排的波）
  const withSrc = (src, f) => {
    const prev = ST.src, st0 = window.setTimeout; ST.src = src;
    window.setTimeout = function (cb, ms, ...a) { return st0.call(window, () => withSrc(src, () => (typeof cb === 'function' ? cb(...a) : 0)), ms); };
    try { return f(); } finally { ST.src = prev; window.setTimeout = st0; }
  };
  // 子彈打中敵人的時候 combat.js 會先讀 s.dmg 再呼叫 R.hurtEnemy：在讀的那一下記下這一發的來源
  const tagShot = (s, src) => { if (!s || s.bdSrc || !src) return; let v = s.dmg; s.bdSrc = src; try { Object.defineProperty(s, 'dmg', { configurable: true, enumerable: true, get() { if (ST.inUS) ST.curSrc = src; return v; }, set(x) { v = x; } }); } catch (e) { } };
  const reset = () => { ST.buf = null; ST.bufGo = false; ST.src = null; ST.curSrc = null; ST.hl.clear(); ST.rec = null; ST.perf = null; ST.cast = null; ST.release = null; ST.inRel = false; ST.press = null; ST.ally.forEach(b => { if (b.a && b.a.st) b.a.st[b.key] /= b.k; }); ST.ally = []; ST.q = []; ST.qT = 0; ST.qO = null; };

  // ---------- 寫樂譜 ----------
  const REC_T = 10, HOLD = 0.45;
  const startRec = P => {
    ST.rec = { t: 0, notes: [], beats: 0 }; ST.perf = null; ST.buf = null;
    toast((SV().notes ? '重新錄製樂譜' : '開始寫樂譜') + '：10 秒內的普攻、技能都會記成音符（普攻只記音符、不發出攻擊；一個小節 ' + capOf(P) + ' 拍；再按住 X 提早寫完）');
    R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 2.6, color: '#FFB8E0' }); melody(P, [[72, 0, 0.15], [79, 0.12, 0.35]], 0.08);
  };
  const endRec = (P, why) => {
    const r = ST.rec; if (!r) return; ST.rec = null;
    if (!r.notes.length) { toast(SV().notes ? '沒有記到音符，保留原本的樂譜' : '樂譜是空的（' + (why || '10 秒內沒有出手') + '）'); return; }
    SV().notes = r.notes.slice(); ST.perf = null; if (R.save) try { R.save(); } catch (e) { }
    toast('樂譜寫好了：' + r.notes.length + ' 個音符、' + r.beats + ' 拍' + (why ? '（' + why + '）' : '') + '——之後每次出手都會先演奏再發出');
  };
  const addNote = (P, n) => {
    const r = ST.rec; if (!r) return; const cap = capOf(P);
    // 2026-10-12 作者：放不下的音符略過，不中斷寫譜（還可以補比較短的音符）
    if (r.beats + n.d > cap + 1e-6) { const t = now(); if (t - (ST.ovT || 0) > 1.2) { ST.ovT = t; toast('這個音符放不下（還剩 ' + (cap - r.beats) + ' 拍），略過——可以補比較短的音符，或按住 X 寫完'); } return; }
    r.notes.push(n); r.beats += n.d;
    melody(P, [[midiOf(n, r.notes.length - 1, chordOf(P)), 0, 0.12 + n.d * 0.15]], 0.07);
    if (R.num) R.num(P.x, 2.4, P.z, n.d < 1 ? '♪' : n.d < 2 ? '♩' : '♫', n.k === 'a' ? 'crit' : 'heal');
    if (r.beats >= cap - 1e-6) endRec(P, '小節寫滿了');
  };

  // ---------- 演奏：按下 → 演奏 → 發出 ----------
  // 演奏時間：2 秒 × 快速演奏 0.8 × 節奏加速 0.7 ÷ 攻速（攻速每 +1% 快 1%）
  const baseRate = P => { const b = R.WEAPONS && P.item && R.WEAPONS[P.item.base]; return (b && b.rate) || (P.ws && P.ws.rate) || 1; };
  // 2026-10-12 作者：攻速每 +1% 演奏快 0.5%（原本 1%）
  const spdK = P => Math.max(0.25, 1 + ((P.ws && P.ws.rate ? P.ws.rate : 1) / baseRate(P) - 1) * 0.5);
  const perfDur = P => Math.max(0.3, Math.min(4, 2 * (P.pv && P.pv.bdFast ? 0.8 : 1) * (P.pv && P.pv.bdRhythm ? 0.7 : 1) / spdK(P)));
  // 每次演奏的魔力（2026-10-11 作者：照樂譜算——八分 0.5、四分 1.5、二分 5）
  const perfCost = notes => Math.round((notes || []).reduce((a, n) => a + (n.d < 1 ? 0.5 : n.d < 2 ? 1.5 : 5), 0) * 10) / 10;
  R.bardPerfCost = () => perfCost(SV().notes);
  // 30 級「大合奏」（lv30.js）：把樂譜裡的音符立刻照順序發出 times 輪（每個隔 0.1 秒），不耗魔、不用演奏
  R.bardEncore = (P, times) => { const notes = SV().notes; if (!notes || !notes.length) return false; const run = W().run; let k = 0;
    for (let r = 0; r < times; r++) notes.forEach(n => { const pid = ++ST.pid; setTimeout(() => { if (W().run === run && !P.dead) noteAtk(P, n, pid); }, (k++) * 100); }); return true; };
  // 每一拍的和弦（低音區）：照和弦的 prog（CH）
  const CHD = { C: [48, 52, 55], Em: [47, 52, 55], F: [48, 53, 57], G: [47, 50, 55], Am: [48, 52, 57],
    Cm: [48, 51, 55], Dm: [50, 53, 57], Bdim: [47, 50, 53],
    Cmaj7: [48, 52, 55, 59], Am7: [45, 48, 52, 55], Dm7: [50, 53, 57, 60], G7: [43, 47, 50, 53], Em7: [47, 50, 52, 55],
    Cmaj9: [48, 52, 55, 59, 62], Am9: [45, 48, 52, 55, 59], Dm9: [50, 53, 57, 60, 64], Fmaj9: [41, 45, 48, 52, 55], Em9: [40, 47, 50, 54, 55],
    Dm11: [38, 45, 48, 53, 55, 64], Cm7: [48, 51, 55, 58], Fm9: [41, 44, 48, 51, 55], G11sus: [43, 48, 50, 53, 57], 'Cmaj9#11': [48, 52, 55, 59, 62, 66], 'Fmaj9#11': [41, 45, 48, 52, 55, 59] };
  // 協奏音 do-re-mi-fa-mi-re（再回到 do 一直繞），C 大調
  const ARP = [60, 67, 64, 67];
  // 戰鼓手的鼓點（2026-10-12 作者）：4/4、直拍、八分音符；位置照八分音符數（第 1 個八分＝1）；最後一拍加四下十六分的筒鼓過門
  const DRUM = { 4: { k: [3, 7], s: [1, 2, 5, 6] }, 6: { k: [3, 7, 11], s: [1, 2, 5, 6, 9, 10] } };
  const drums = (cap, bt) => {
    if (!R.playDrums) return; const pat = DRUM[cap] || DRUM[4], e8 = bt / 2, n8 = cap * 2, H = [];
    for (let i = 1; i <= n8; i++) { const t = (i - 1) * e8; H.push(['h', t, i % 2 ? 0.9 : 0.6]); if (pat.k.includes(i)) H.push(['k', t, 1.1]); if (pat.s.includes(i)) H.push(['s', t, 0.85]); }
    [220, 180, 150, 120].forEach((f, j) => H.push(['t', (cap - 1) * bt + j * bt / 4, 0.8, f]));
    try { R.playDrums(H, 0.2 * 0.9); } catch (e) { }
  };
  // 普攻鍵現在有沒有按著（滑鼠左鍵、F、手機右搖桿）
  const atkHeld = () => { const I = R.input; return !!(I && (I.fire || (I.keys && I.keys.f))); };
  // 演奏中又按了一次普攻（放開再按）：記下來，演奏完接著演奏（蓋不掉記著的技能）
  const atkAgain = () => { if (ST.perf && !ST.rec && !ST.buf) ST.buf = { kind: 'atk' }; };
  const startPerf = (P, what) => {
    const notes = SV().notes; if (!notes || !notes.length || ST.rec || ST.perf) return false;
    const cost = perfCost(notes);
    if (P.mp < cost) { const t = now(); if (t - ST.hintT > 2) { ST.hintT = t; toast('魔力不夠（這段樂譜演奏一次要 ' + cost + ' 點魔力）'); } return false; }
    P.mp -= cost;
    const dur = perfDur(P), cap = Math.max(capOf(P), notes.reduce((a, n) => a + n.d, 0)), bt = dur / cap, c = chordOf(P), dv = pickShift();
    let at = 0; const times = notes.map(n => { const t = at; at += n.d * bt; return t; });
    const mid = notes.map((n, i) => vary(midiOf(n, i, c), c, dv));
    ST.perf = Object.assign({ t: 0, dur, notes: notes.slice(), times, mid, shown: 0, pid: ++ST.pid, held: atkHeld() }, what);   // held：上一格普攻鍵有沒有按著（看「放開再按」用）
    // 2026-10-12 作者：只在開頭彈一次主和弦（照選的和弦），延音整個小節；音量比原本每拍的和弦大 10%。奏域師用管風琴。
    // 最後一拍再彈一次和弦收尾（2026-10-13 改回大調）。戰鼓手：加一小節鼓。
    const len = i => Math.max(0.08, notes[i].d * bt * 0.9), bar = cap * bt;
    melody(P, notes.map((n, i) => [mid[i], times[i], len(i)]), 0.085 * 1.05);
    const tonic = CHD[c.sym] || CHD.C, chV = n => 0.085 * 0.9 * 1.1 * Math.sqrt(3 / n), chI = P.adv === 'serane' ? 'organ' : inst(P);
    try { R.playMelody && R.playMelody(chI, tonic.map(m => [m, 0, bar]), chV(tonic.length), 3 * bt); } catch (e) { }   // 2026-10-13：主和弦音量線性變小，第四拍歸零
    if (cap > 1) { const end = CHD[c.sym] || CHD.C; try { R.playMelody && R.playMelody(inst(P), end.map(m => [m, (cap - 1) * bt, bt]), chV(end.length)); } catch (e) { } }
    if (P.adv === 'drummer') drums(cap, bt);
    const cc = ARP, conc = [];   // 2026-10-13 作者：伴奏 Do-So-Mi-So，每半拍一個音，跟著整段的升降一起變
     for (let h = 0; h < cap * 2; h++) conc.push([vary(cc[h % cc.length], c, dv), h * bt / 2, bt / 2 * 0.9]);
    melody(P, conc, 0.0425 * 0.9);
    R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 1.2, color: c.col });
    return true;
  };
  // key＝'atk:段號'、'skill:段號'、'ult:段號'：同一個 key 累加，換了段號就把上一段給的護盾換掉（netaid.js 的 R.keyedShield）
  const shieldAll = (P, sh, hl, range, key) => {
    if (sh > 0) { if (R.keyedShield && key) R.keyedShield(P, sh, key, null, 6); else P.shield = Math.min(P.hpMax, (P.shield || 0) + sh); P.buff = P.buff || {}; P.buff.shieldT = Math.max(P.buff.shieldT || 0, 6); }
    if (hl > 0 && R.healP) R.healP(hl);
    if (R.nearAllies && R.aidAlly) R.nearAllies(P, range || 8).forEach(al => R.aidAlly(al, { shieldAbs: sh, shKey: key, healAbs: hl, shieldT: 6, quiet: true }));
    if (sh > 0 || hl > 0) R.fx && R.fx('ring', P.x, 0.1, P.z, { r: range ? 3 : 1.6, color: '#5AE8A0' });
  };
  // 攻速：自己（P.sb，時間到 skillbook.js 會還原）、電腦隊友（a.st.rate，這裡自己還原）、連線隊友（netaid.js 送過去）
  const applyRate = (P, k, t) => {
    if (!(k > 1)) return;
    if (P.ws) { P.sb = P.sb || {}; const id = 'bd:score', old = P.sb[id]; if (old && old.rate) P.ws.rate /= old.rate; P.sb[id] = { left: t, t, rate: k, color: '#FFE08A' }; P.ws.rate *= k; }
    (R.nearAllies ? R.nearAllies(P, 9) : []).forEach(al => {
      if (al.remote != null) { R.aidAlly && R.aidAlly(al, { rateK: k, rateT: t }); return; }
      allyMod(al, 'rate', k, t);
    });
  };
  // 電腦隊友身上的加成：同一種刷新（不疊），時間到還原
  function allyMod(al, key, k, t) {
    if (!(k > 1) || !al || !al.st || !al.st[key]) return;
    const old = ST.ally.find(b => b.a === al && b.key === key);
    if (old) { al.st[key] /= old.k; old.k = k; old.left = t; } else ST.ally.push({ a: al, key, k, left: t });
    al.st[key] *= k;
  }

  // ---------- 音符的樣子（顏色照種類：攻擊紅、增益綠、普攻金；二分的大一點） ----------
  const TEX = {};
  const noteMat = (glyph, col) => {
    const k = glyph + col; if (TEX[k]) return TEX[k];
    const TH = THREE, c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
    g.font = 'bold 50px "Segoe UI Symbol","Noto Sans Symbols","Apple Symbols",serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.shadowColor = col; g.shadowBlur = 18; g.lineJoin = 'round'; g.lineWidth = 7; g.strokeStyle = '#1A1020'; g.strokeText(glyph, 32, 34); g.shadowBlur = 0; g.fillStyle = col; g.fillText(glyph, 32, 34);
    const t = new TH.CanvasTexture(c); t.userData.shared = true;
    const m = new TH.SpriteMaterial({ map: t, transparent: true, depthWrite: false, fog: false, toneMapped: false }); m.userData.shared = true;
    return (TEX[k] = m);
  };
  const dress = (s, n) => {
    if (!s || !window.THREE) return; const col = COL[n.d < 1 ? 'n' : n.k] || COL.n, glyph = n.d < 1 ? '♪' : n.d < 2 ? '♩' : '♫';
    s.ncol = col;
    if (s.mesh && s.mesh.isSprite) { s.mesh.material = noteMat(glyph, col); const k = n.d >= 2 ? 1.7 : n.d >= 1 ? 1.45 : 1.25; s.mesh.scale.set(k, k, 1); }
  };
  // 普攻（2026-10-11 作者）：演奏中經過一個音符，就借原本的普攻發出那一顆——一次普攻射幾發（多重、子彈 +1…）就發出幾顆（普攻的加成套在音符上）；
  // 方向照那一發、再在 5 度內飄。迴響長笛：同一顆隔一下再補一輪（ST.q）。
  const GAP = 0.2, SPREAD = 5 * Math.PI / 180;
  const gapOf = P => GAP / spdK(P);
  // 發出攻擊的那一下不出聲：武器、技能的音效和旋律先關掉（2026-10-11 作者：發出攻擊時沒有聲音）
  const hush = f => { const sf = R.sfx, pm = R.playMelody, ps = R.playSfx; R.sfx = () => { }; R.playMelody = () => { }; if (ps) R.playSfx = () => { }; try { return f(); } finally { R.sfx = sf; R.playMelody = pm; if (ps) R.playSfx = ps; } };
  const noteShot = (P, o, n) => {
    const a = (o.a != null ? o.a : P.aimA) + (Math.random() - 0.5) * SPREAD;
    const s = hush(() => fi0(Object.assign({}, o, { a, _bd: 1 })));
    if (s) {
      dress(s, n);
      // 攻擊音符：四分半徑 2 公尺、二分 4 公尺（傷害兩倍）；碰到敵人、撞牆、飛到最遠都炸
      if (n.d >= 1 && n.k === 'a') { const big = n.d >= 2 ? 2 : 1, m = nk(P, 'a'); s.bdBoom = { r: 2 * big * areaK(P), dmg: (s.dmg || 0) * big * m, col: '#FF6A5A', wall: 1 }; }
      tagShot(s, ST.rel && ST.rel.src);
    }
    return s;
  };
  const noteAtk = (P, n, pid, echo) => {
    const cd = P.atkCd; ST.rel = { n, k: 0, src: 'n' + pid + ':' + (ST.nIdx = (ST.nIdx || 0) + 1) + (echo ? 'e' : '') }; ST.inRel = true; P.atkCd = 0;
    try { hush(() => freeMp(P, () => at0())); } catch (e) { } finally { ST.rel = null; ST.inRel = false; P.atkCd = cd; }
    // 增益音符：你和隊友最大魔力 10% 的護盾（二分再回同樣多的生命）——一顆音符算一次（不照發數）；同一段演奏累加，下一段演奏刷新
    if (n.d >= 1 && n.k === 'b') { const v = P.mpMax * 0.1 * healK(P) * nk(P, 'b'); shieldAll(P, v, n.d >= 2 ? v : 0, 8, (n.d >= 2 ? 'half:' : 'atk:') + pid); }
    if (!echo && leg(P) === 'lg_echo') { if (!ST.q.length) ST.qT = gapOf(P); ST.q.push({ n, pid }); }
  };
  const fireNote = P => { const it = ST.q.shift(); if (it) noteAtk(P, it.n, it.pid, true); };
  // 技能：照樂譜算倍率
  // 同一種音符重複：第一個全額、第二個一半、第三個起 1/4（2 個＝1.5、4 個＝2、8 個＝3）
  const dim = n => (n <= 0 ? 0 : n === 1 ? 1 : 1.5 + 0.25 * (n - 2));
  const castMods = (P, notes) => {
    const c = tally(notes), a = nk(P, 'a'), b = nk(P, 'b'), e = nk(P, 'n');
    const atk = (0.1 * dim(c.aq) + 0.3 * dim(c.ah)) * a, cdCut = 0.1 * dim(c.bq) * b, cdAdd = 0.1 * dim(c.ah);
    return { c, dmg: 1 + atk, area: 1 + atk, heal: 1 + 0.1 * dim(c.bq) * b, buff: 1 + 0.25 * dim(c.bh) * b, cdCut, cdAdd,
      cd: Math.max(0.3, 1 - cdCut + cdAdd), mpx: 0.2 * dim(c.ah), rate: 1 + 0.1 * dim(c.e) * e, ally: dim(c.bh) * b };
  };
  // 這份樂譜演奏完放技能會得到的加成（五線譜底下列出來）
  const pctS = x => { const v = Math.round(x * 1000) / 10; return (v % 1 ? v.toFixed(1) : String(v)) + '%'; };
  const gainsOf = P => {
    const notes = SV().notes; if (!notes || !notes.length) return ['樂譜是空的'];
    const m = castMods(P, notes), L = [];
    if (m.rate > 1) L.push('攻速 +' + pctS(m.rate - 1) + '（' + (P.adv === 'serane' ? 16 : 8) + ' 秒）');
    if (m.dmg > 1) L.push('傷害與範圍 +' + pctS(m.dmg - 1));
    if (m.heal > 1) L.push('恢復與護盾 +' + pctS(m.heal - 1));
    if (m.buff > 1) L.push('增益 +' + pctS(m.buff - 1));
    if (m.cd < 1) L.push('冷卻 −' + pctS(1 - m.cd)); else if (m.cd > 1) L.push('冷卻 +' + pctS(m.cd - 1));
    if (m.mpx > 0) L.push('耗魔 +' + pctS(m.mpx));
    if (m.ally > 0) L.push('友軍護盾與回血各 ' + pctS(0.1 * m.ally * healK(P)) + ' 魔力上限');
    return L.length ? L : ['沒有加成'];
  };
  const post = (P, i, id, m, pid) => {
    const sk = R.SKILLS[id] || {};
    if (i === 0) { if (P.skillCd > 0) P.skillCd *= m.cd; } else if (P.skCd && P.skCd[i] > 0) P.skCd[i] *= m.cd;
    if (m.mpx > 0) P.mp = Math.max(0, P.mp - (sk.mp || 0) * m.mpx);
    applyRate(P, m.rate, P.adv === 'serane' ? 16 : 8);
    // 增益二分音符的護盾（2026-10-12 作者）：自己一格 half，不會被下一段演奏的其他護盾換掉；兩段演奏的二分護盾不疊（新的換掉舊的）
    if (m.ally > 0) shieldAll(P, P.mpMax * 0.1 * m.ally * healK(P), P.mpMax * 0.1 * m.ally * healK(P), 9, 'half:' + pid);
    if (R.num) R.num(P.x, 2.6, P.z, '♫ ' + (sk.name || ''), 'crit');
  };

  // ---------- 大招狂想曲（classes2b.js 的 R.ULTS.bard 呼叫；2026-10-11 作者：拿掉增傷、減傷） ----------
  // 回復：你最大魔力 35%（× 小三和弦、增益四分的恢復加成）的生命與魔力，給你和 12 公尺內的隊友；
  // 一倍的樂譜技能加成 10 秒（2026-10-11 作者：原本兩倍，減半）：攻速、傷害（增益二分的「增益 +%」乘在上面）、你自己的技能冷卻減少、增益二分的護盾與回血。
  // 掛在自己的 id（bd:ult、ult:段號），跟一般技能演奏的加成分開、可以疊。
  R.bardUlt = P => {
    const m = castMods(P, SV().notes || []), hk = healK(P), c = chordOf(P), pid = ++ST.pid;
    const H = P.mpMax * 0.35 * hk * m.heal, bk = m.buff;
    const rate = 1 + (m.rate - 1) * bk, dmg = 1 + (m.dmg - 1) * bk, sh = P.mpMax * 0.1 * m.ally * hk, t = 10;
    if (R.healP) R.healP(H + sh); P.mp = Math.min(P.mpMax, P.mp + H);
    if (sh > 0) shieldAll(P, sh, 0, 0.01, 'ult:' + pid);
    // 直接掛在 P.sb（不走 SKILL_TYPES.buff：那裡吟遊詩人的增益會再照魔力上限放大，就不是剛好兩倍了）；時間到 skillbook.js 會還原攻速
    if (rate > 1 || dmg > 1) { P.sb = P.sb || {}; const old = P.sb['bd:ult']; if (old && old.rate && P.ws) P.ws.rate /= old.rate; P.sb['bd:ult'] = Object.assign({ left: t, t, color: c.col }, rate > 1 && P.ws ? { rate } : {}, dmg > 1 ? { dmg } : {}); if (rate > 1 && P.ws) P.ws.rate *= rate; R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 2, color: c.col }); }
    if (m.cdCut > 0) { const f = Math.max(0.1, 1 - m.cdCut); if (P.skillCd > 0) P.skillCd *= f; if (P.skCd) P.skCd = P.skCd.map(x => (x || 0) * f); }
    (R.nearAllies ? R.nearAllies(P, 12) : []).forEach(al => {
      if (!R.aidAlly) return;
      R.aidAlly(al, Object.assign({ healAbs: H + sh, mpAbs: H, shieldAbs: sh, shKey: 'ult:' + pid, shieldT: t }, al.remote != null ? { rateK: rate, rateT: t, dmgK: dmg, dmgT: t } : {}));
      if (al.remote == null) { allyMod(al, 'rate', rate, t); allyMod(al, 'dmg', dmg, t); }
    });
    R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 12, color: c.col });
    if (R.num) R.num(P.x, 2.8, P.z, '♫ 狂想曲', 'heal');
  };

  // ---------- 技能的型：和弦（範圍、恢復）＋樂譜（傷害、範圍、恢復、增益） ----------
  const T = R.SKILL_TYPES || {};
  const AREA = ['r', 'width', 'radius'], PCT = ['pct', 'allies', 'shield', 'allyShield', 'heal', 'regen', 'selfHeal'], MUL = ['dmg', 'speed', 'rate'], ADD = ['crit', 'def'];
  // 回傳 [改過的參數, 改過的威力]；沒有要改的回傳 null
  const scaleArgs = (type, s, P, pw) => {
    const m = ST.cast, ak = areaK(P) * (m ? m.area : 1), hk = healK(P) * (m ? m.heal : 1), bk = m ? m.buff : 1, dk = m ? m.dmg : 1;
    if (ak === 1 && hk === 1 && bk === 1 && dk === 1) return null;
    s = Object.assign({}, s);
    if (ak !== 1) AREA.forEach(k => { if (typeof s[k] === 'number') s[k] *= ak; });
    if (hk !== 1) PCT.forEach(k => { if (typeof s[k] === 'number') s[k] *= hk; });   // 回的量照最大魔力算（mpArgs），超過生命上限的部分 healP 會截掉
    if (bk !== 1 && (type === 'buff' || type === 'aura')) { MUL.forEach(k => { if (typeof s[k] === 'number' && s[k] > 1) s[k] = 1 + (s[k] - 1) * bk; }); ADD.forEach(k => { if (typeof s[k] === 'number') s[k] *= bk; }); }
    return [s, typeof pw === 'number' ? pw * dk : pw];
  };
  // 照最大魔力（2026-10-11 作者：拿掉「效果隨魔力上限變強」，所有技能的數值都跟最大魔力掛勾）：
  // - 自己回的生命、護盾、每秒回血、吸回來的血：原本是「生命上限的 %」→ 改成「最大魔力的 %」（參數 × 最大魔力 ÷ 生命上限）；奏域、聖詠圈回的量也是
  // - 隊友回的生命、護盾：「你最大魔力的 %」（固定量，R.aidAlly 送給電腦隊友和連線隊友）
  // - 強化：傷害、移動、攻速的 +%，暴擊率、減傷，每 100 點最大魔力算一次（減傷最多 75%）；技能傷害 × 最大魔力 ÷ 100
  const mpArgs = (type, s, P, pw) => {
    const mp = P.mpMax || 0, K = mp / 100, toHp = P.hpMax > 0 ? mp / P.hpMax : 1, o = Object.assign({}, s);
    ['pct', 'shield', 'regen', 'selfHeal'].forEach(k => { if (typeof o[k] === 'number') o[k] *= toHp; });
    if (type === 'zone' && o.zone === 'sanct') o.healK = (o.healK || 1) * toHp;
    if (type === 'buff' || type === 'aura') {
      MUL.forEach(k => { if (typeof o[k] === 'number' && o[k] > 1) o[k] = 1 + (o[k] - 1) * K; });
      if (typeof o.crit === 'number') o.crit = Math.min(1, o.crit * K); if (typeof o.def === 'number') o.def = Math.min(0.75, o.def * K);
    }
    let ally = null;
    if (type === 'heal' && (o.allies > 0 || o.allyShield > 0)) { ally = { h: (o.allies || 0) * mp, s: (o.allyShield || 0) * mp }; o.allies = 0; o.allyShield = 0; }
    return [o, typeof pw === 'number' ? pw * (200 + mp) / 300 : pw, ally];   // 2026-10-12 作者：技能傷害 ×(200＋最大魔力)÷300
  };
  // 終曲（2026-10-11 作者）：朝前方 arc（90 度）、半徑 r 的扇形聲波，連續 waves 波（每一波照你當下的位置和方向）
  const later = (R.SKILL_KIT && R.SKILL_KIT.later) || ((f, ms) => setTimeout(f, ms));
  const fan = (x, z, a, arc, r, col) => {
    const w = W(); if (!window.THREE || !w.scene || !w.dyn) return;
    const TH = THREE, mk = (r0, r1) => { const m = new TH.Mesh(new TH.RingGeometry(r0, r1, 28, 1, a - Math.PI / 2 - arc / 2, arc), new TH.MeshBasicMaterial({ color: col || '#FFB8E0', transparent: true, opacity: 0, depthWrite: false, side: TH.DoubleSide, blending: TH.AdditiveBlending, fog: false })); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.12, z); w.scene.add(m); return m; };
    const parts = [[mk(0.15, 1), 0.28], [mk(0.88, 1), 0.95], [mk(0.6, 0.66), 0.7], [mk(0.34, 0.39), 0.5]];   // 淡的扇面、外緣一道亮的聲波、裡面兩道細的
    let t = 0; const life = 0.42, run = w.run;
    w.dyn.push(dt => {
      t += dt; const k = Math.min(1, t / life), sc = r * (0.3 + 0.7 * Math.sqrt(k)), done = k >= 1 || W().run !== run;
      parts.forEach(([m, op]) => { m.scale.set(sc, sc, 1); m.material.opacity = op * (1 - k); if (done) { if (m.parent) m.parent.remove(m); m.geometry.dispose(); m.material.dispose(); } });
      return !done;
    });
  };
  if (!T.cone) T.cone = (s, P, w, pw) => {
    const arc = s.arc || Math.PI / 2, r = s.r || 6, n = s.waves || 1;
    const one = () => {
      const w2 = W(), a = P.aimA, inArc = (x, z, pad) => { const dx = x - P.x, dz = z - P.z, d = Math.hypot(dx, dz); if (d > r + pad) return false; if (d < 0.6) return true; let da = Math.atan2(dx, dz) - a; while (da > Math.PI) da -= Math.PI * 2; while (da < -Math.PI) da += Math.PI * 2; return Math.abs(da) <= arc / 2 + Math.atan2(pad, d); };
      fan(P.x, P.z, a, arc, r, s.color);
      (w2.enemies || []).forEach(e => { if (!e.dead && inArc(e.x, e.z, e.def.size * 0.5)) R.hurtEnemy(e, pw * s.k, { kb: s.kb, stun: s.stun }); });
      ((w2.F && w2.F.props) || []).forEach(p => { if (p.alive && inArc(p.x, p.z, 0.4) && R.hitProp) R.hitProp(p, pw * s.k, true); });
      if (R.shake) R.shake(0.08);
    };
    const src = ST.src, one2 = () => { const pv = ST.src; ST.src = src || pv; try { one(); } finally { ST.src = pv; } };
    for (let i = 0; i < n; i++) { if (i === 0) one2(); else later(one2, i * (s.gap || 300)); }
  };
  Object.keys(T).forEach(type => {
    const f = T[type]; if (type === 'combo' || typeof f !== 'function') return;
    T[type] = function (s, P, w, pw, ...a) {
      if (!IS(P) || P !== W().P || !s || typeof s !== 'object') return f.call(this, s, P, w, pw, ...a);
      if (s.trio) ST.trioT = now() + 0.4;   // 三重奏：接下來射出的音符撞到敵人會炸開
      const r = scaleArgs(type, s, P, pw) || [s, pw], [s2, pw2, ally] = mpArgs(type, r[0], P, r[1]);
      // 2026-10-13 修：技能護盾不再用「取較大」蓋過普攻護盾，改成自己一格（skill:段號）疊上去
      let skSh = 0, s3 = s2; if (s2 && typeof s2.shield === 'number' && s2.shield > 0 && R.keyedShield) { skSh = P.hpMax * s2.shield; s3 = Object.assign({}, s2); delete s3.shield; }
      const out = f.call(this, s3, P, w, pw2, ...a);
      if (skSh > 0 && out !== false) { R.keyedShield(P, skSh, 'skill:' + (ST.skN = (ST.skN || 0) + 1), null, 6); P.buff = P.buff || {}; P.buff.shieldT = Math.max(P.buff.shieldT || 0, 6); }
      // 隊友：照你的最大魔力回固定量（電腦隊友、連線隊友都走 R.aidAlly）
      if (ally && out !== false && R.nearAllies && R.aidAlly) R.nearAllies(P, 7).forEach(al => { R.aidAlly(al, { healAbs: ally.h, shieldAbs: ally.s, shieldT: 6 }); if (R.fx) R.fx('ring', al.x, 0.1, al.z, { r: 1.2, color: '#FFE8A0' }); });
      return out;
    };
  });

  // ---------- 接到遊戲裡 ----------
  // 技能：寫樂譜的時候照常放、記下來；有樂譜就先演奏（演奏完才真的放出去）；沒有樂譜照常放
  // 2026-10-11：R 變回技能格（第一格走 R.useSkill，冷卻在 P.skillCd；其他格走 R.castSlot，冷卻在 P.skCd）
  const us0 = R.useSkill, cs0 = R.castSlot;
  const cdOf = (P, i) => (i === 0 ? P.skillCd || 0 : (P.skCd && P.skCd[i]) || 0);
  const raw = i => (i === 0 ? us0() : cs0(i));
  const castNow = (P, i) => { const c0 = cdOf(P, i); raw(i); return cdOf(P, i) > c0 + 0.01; };
  const slotCast = (P, i) => {
    const id = i === 0 ? P.skill : R.slotSkill ? R.slotSkill(P, i) : null;
    if (ST.rec) { if (castNow(P, i) && id) { const n = noteOfSkill(id); if (n) addNote(P, n); } return; }
    const notes = SV().notes;
    if (!notes || !notes.length || !id) return raw(i);
    if (P.dead) return;
    if (ST.perf) { ST.buf = { kind: 'skill', i }; return; }   // 2026-10-12 作者：演奏中按的技能記下來（蓋掉記著的普攻），演奏完馬上放
    const sk = R.SKILLS[id]; if (!sk) return raw(i);
    if (cdOf(P, i) > 0) return raw(i);   // 還在冷卻：照原本的（不放）
    const m = castMods(P, notes);
    const pc = perfCost(notes);
    if (P.mp < sk.mp * (1 + m.mpx) + pc) { toast('魔力不夠（技能 ' + Math.ceil(sk.mp * (1 + m.mpx)) + '＋演奏 ' + pc + '）'); return; }
    startPerf(P, { kind: 'skill', i, id });
  };
  R.useSkill = (...a) => { const P = W().P; if (!IS(P) || !W().run) return us0(...a); return slotCast(P, 0); };
  R.castSlot = i => { const P = W().P; if (!IS(P) || !(i >= 1) || !W().run) return cs0(i); return slotCast(P, i); };
  // 普攻：寫樂譜的時候照常射一發（記成八分音符）；有樂譜就先演奏（演奏的時候不能普攻）、演奏完一個一個射出樂譜的音；樂譜是空的就不射
  const at0 = R.attack;
  window.addEventListener('mousedown', e => { if (e.button === 0 && e.target && e.target.id === 'gl' && IS(W().P) && W().run && !W().paused) atkAgain(); }, true);
  window.addEventListener('keydown', e => { if ((e.key === 'f' || e.key === 'F') && !e.repeat && IS(W().P) && W().run && !W().paused && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName))) atkAgain(); }, true);
  // 普攻不耗魔力（2026-10-11 作者：魔力改成每次演奏照樂譜花）：借原本的普攻之前把魔力補到夠扣，扣完還原
  const freeMp = (P, f) => { const mp0 = P.mp, need = (P.ws && P.ws.mp) || 0; if (P.mp < need) P.mp = need; try { return f(); } finally { P.mp = mp0; } };
  R.attack = (...a) => {
    const P = W().P; if (!IS(P) || !W().run || ST.release) return at0(...a);
    // 寫樂譜的時候（2026-10-11 作者）：普攻只記一個八分音符、不發出攻擊（照攻速算下一下）
    if (ST.rec) { if (P.atkCd > 0 || P.dead || P.knockT > 0 || P.stance > 0) return; P.atkCd = 1 / Math.max(0.2, (P.ws && P.ws.rate) || 1); if (P.h) P.h.recoil = 1; addNote(P, { d: 0.5, k: 'n' }); return; }
    if (ST.perf && !P.dead) return;   // 2026-10-15：演奏中不靠這裡記下一次（按住左鍵每一格都會叫到），改看 atkAgain（放開再按）和最後一拍還按著
    if (P.atkCd > 0 || P.dead || P.knockT > 0 || P.stance > 0) return;
    if (!SV().notes || !SV().notes.length) { const t = now(); if (t - ST.hintT > 4) { ST.hintT = t; toast('樂譜是空的，普攻不會發出攻擊——按住 X 寫一段樂譜（寫的時候普攻只記音符）'); } P.atkCd = 0.3; return; }
    if (!startPerf(P, { kind: 'atk' })) P.atkCd = 0.3;
  };
  const perfDone = P => {
    const p = ST.perf; ST.perf = null;
    if (chordOf(P).id === 'ele') P.mp = Math.min(P.mpMax, P.mp + P.mpMax * 0.05);
    // 普攻：借原本的普攻算出那一發的樣子（位置、速度、傷害），換成音符的佇列；射的期間馬上可以開始下一次演奏
    if (p.kind === 'atk') P.atkCd = 0;   // 音符已經在演奏中一顆一顆發出去了
    else if (p.kind === 'skill') {
      ST.cast = castMods(P, p.notes); let ok = false;
      try { ok = hush(() => withSrc('k' + p.pid, () => castNow(P, p.i))); } finally { const m = ST.cast; ST.cast = null; if (ok) post(P, p.i, p.id, m, p.pid); }
    }
  };
  // 普攻的每一發（primary）：經過音符的那一下換成那顆音符（射幾發就換幾顆）；演奏中其他時候不射
  const fi0 = R.fire;
  R.fire = o => {
    const P = W().P;
    if (!o || o._bd || o.owner !== 'p' || !o.primary || !IS(P) || !W().run) return fi0(o);
    if (ST.inRel) { const r = ST.rel; if (!r) return null; r.k++; return noteShot(P, o, r.n); }
    if (ST.perf && !ST.rec) return null;
    return fi0(o);
  };
  // 三重奏的音符：撞到敵人炸開半徑 3 公尺（傷害照那一發）
  const fiT = R.fire;
  R.fire = o => { const s = fiT(o); try { if (s && ST.src && o && o.owner === 'p' && !o._bd) tagShot(s, ST.src); } catch (e) { } try { const P = W().P; if (s && o && o.owner === 'p' && !o.primary && !o._bd && IS(P) && now() < (ST.trioT || 0)) { dress(s, { d: 1, k: 'a' }); s.bdBoom = { r: 3, dmg: s.dmg || 0, col: '#FF6A5A', wall: 1 }; } } catch (e) { } return s; };
  // 攻擊音符、三重奏的音符：碰到敵人的那一下炸開；撞牆、飛到最遠（從子彈裡消失）也炸（2026-10-11 作者）。打中不出聲（聲音只在演奏）
  const boom = s => { const b = s.bdBoom; s.bdBoom = null; if (R.bardSonic) R.bardSonic(s.x, s.z, b.r, b.col); else R.fx && R.fx('boom', s.x, 0.6, s.z, { r: b.r, color: b.col });   /* 2026-10-14 bardsonic.js：音波，不是火焰爆炸 */ const pv = ST.src; ST.src = s.bdSrc || pv; try { R.aoe(s.x, s.z, b.r, b.dmg, { props: true }); } finally { ST.src = pv; } };
  const up0 = R.updateShots;
  R.updateShots = dt => {
    const arr = W().shots || [], run = W().run;
    const live = arr.filter(s => s.bdBoom && !s.dead).map(s => [s, s.hit ? s.hit.size : 0]);
    let r; ST.inUS = true; try { r = up0(dt); } finally { ST.inUS = false; ST.curSrc = null; }
    const after = W().shots || [];
    live.forEach(([s, n]) => {
      if (!s.bdBoom) return;
      if (s.hit && s.hit.size > n) return boom(s);
      if (s.bdBoom.wall && W().run === run && (s.dead || after.indexOf(s) < 0)) boom(s);
    });
    return r;
  };
  // 七和弦：傷害
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => { const P = W().P; if (IS(P) && e && !e.dead && !e.petHit && !(o && (o.reflect || o.thorns))) { const k = dmgK(P); if (k !== 1) raw *= k;
    const src = (ST.inUS && ST.curSrc) || ST.src; ST.curSrc = null;
    if (src) { let h = ST.hl.get(src); if (!h) ST.hl.set(src, h = { t: now(), seen: new WeakSet() }); if (h.seen.has(e)) raw *= 0.2; else h.seen.add(e); } } return he0(e, raw, o); };
  // 九和弦：技能急速（重新算數值的時候補上）
  const cp0 = R.calcPlayer;
  // 2026-10-12：沒有「悲嘆詩人」這個轉職了；存檔裡轉成它的吟遊詩人改回未轉職，退還那顆魔力核心
  const unLament = () => { try { const S = R.S, st = S && S.classes && S.classes.bard; if (st && st.adv === 'lament') { st.adv = null; S.mats = S.mats || {}; S.mats.core = (S.mats.core || 0) + 1; } } catch (e) { } };
  R.calcPlayer = cls => { unLament(); const P = cp0(cls); try { P._bdHaste = 0; if (IS(P)) syncHaste(P); } catch (e) { } return P; };

  // ---------- 按鍵：點一下換和弦、按住寫樂譜 ----------
  const inGame = () => { const run = $('run'); return run && !run.hidden && !(R.sheetOpen && R.sheetOpen()) && !W().paused; };
  const press = src => { if (!ME() || !inGame() || ST.press) return; ST.press = { t0: now(), src, held: false }; };
  const release = src => { const p = ST.press; if (!p || p.src !== src) return; ST.press = null; const P = ME(); if (P && !p.held) nextChord(P); };
  // 2026-10-11：X（職業鍵；keybinds.js 改過鍵的也會送 key＝x 的事件過來）。手機沒有 X 鈕：點、按住職業條（#core-g）
  window.addEventListener('keydown', e => { if ((e.key || '').toLowerCase() === 'x' && !e.repeat && !/INPUT|TEXTAREA|SELECT/.test((e.target && e.target.tagName) || '')) press('k'); });
  window.addEventListener('keyup', e => { if ((e.key || '').toLowerCase() === 'x') release('k'); });
  window.addEventListener('blur', () => { ST.press = null; });
  document.addEventListener('pointerdown', e => { if (ME() && e.target && e.target.closest && e.target.closest('#core-g')) { e.preventDefault(); press('p'); } });
  ['pointerup', 'pointercancel'].forEach(t => document.addEventListener(t, () => release('p')));

  // ---------- 每一幀 ----------
  const st0 = R.step;
  R.step = dt => {
    st0(dt);
    const w = W(), P = w.P; if (!IS(P) || !w.run) return;
    if (ST.run !== w.run) { ST.run = w.run; reset(); }
    if (P.dead) { ST.q = []; ST.perf = null; }
    if (w.paused || P.dead) return;
    if (ST.press && !ST.press.held && now() - ST.press.t0 >= HOLD) { ST.press.held = true; if (ST.rec) endRec(P, '提早寫完'); else startRec(P); }
    if (ST.rec) { ST.rec.t += dt; if (ST.rec.t >= REC_T) endRec(P); }
    if (ST.perf) {
      const p = ST.perf; p.t += dt;
      { const h = atkHeld(); if (h && !p.held) atkAgain(); p.held = h; }   // 演奏中放開再按（手機的右搖桿也算）
      while (p.shown < p.notes.length && p.t >= p.times[p.shown]) { const k = p.shown++, n = p.notes[k]; if (R.num) R.num(P.x + (Math.random() - 0.5) * 0.8, 2.2, P.z, n.d < 1 ? '♪' : n.d < 2 ? '♩' : '♫', n.k === 'a' ? 'crit' : 'heal'); noteAtk(P, n, p.pid); }
      if (p.t >= p.dur) { const go = p.kind === 'atk' && atkHeld() && !ST.buf; perfDone(P); if (go) ST.buf = { kind: 'atk' }; ST.bufGo = true; }   // 最後一拍左鍵還按著＝接著演奏
    }
    // 演奏中記下的那一下：演奏完（技能放出去）馬上接著做
    if (ST.bufGo && !ST.perf) { ST.bufGo = false; const b = ST.buf; ST.buf = null; if (b) { try { if (b.kind === 'skill') { if (b.i === 0) R.useSkill(); else R.castSlot(b.i); } else R.attack(); } catch (e) { } } }
    if (ST.hl.size) { const t = now(); ST.hl.forEach((v, k) => { if (t - v.t > 12) ST.hl.delete(k); }); }
    if (ST.q.length) { ST.qT -= dt; while (ST.q.length && ST.qT <= 0) { fireNote(P); ST.qT += gapOf(P); } } else ST.qT = 0;
    for (let k = ST.ally.length - 1; k >= 0; k--) { const b = ST.ally[k]; b.left -= dt; if (b.left <= 0 || !b.a || b.a.dead) { if (b.a && b.a.st) b.a.st[b.key] /= b.k; ST.ally.splice(k, 1); } }
  };

  // ---------- 職業鍵（X）、職業特效的條 ----------
  const status = P => {
    if (ST.rec) return '寫樂譜中 ' + Math.max(0, REC_T - ST.rec.t).toFixed(1) + ' 秒・' + ST.rec.beats + '／' + capOf(P) + ' 拍';
    if (!SV().notes) return '樂譜是空的：按住 X 寫樂譜';
    if (ST.q.length && !ST.perf) return '射出音符中（還有 ' + ST.q.length + ' 個）——可以開始下一次演奏';
    if (ST.perf) return '演奏中' + (ST.perf.kind === 'skill' && R.SKILLS[ST.perf.id] ? '（' + R.SKILLS[ST.perf.id].name + '）' : '（普攻）') + ' ' + Math.max(0, ST.perf.dur - ST.perf.t).toFixed(1) + ' 秒';
    return '出手會先演奏 ' + perfDur(P).toFixed(1) + ' 秒（耗魔 ' + perfCost(SV().notes) + '）再發出';
  };
  const C = R.CORE && R.CORE.bard;
  if (C) Object.assign(C, {
    name: '和弦', col: '#FFB8E0',   // 職業條的顏色跟著和弦（gauge 回傳的 col）
    help: P => '和弦與樂譜：X 點一下換和弦（C 大三＝傷害、Am 小三＝恢復與護盾、20 級 Cmaj7 七和弦＝範圍、30 級 Fmaj9 九和弦＝技能急速、40 級 Dm11 十一和弦＝演奏回魔）；技能數值照最大魔力（治療、護盾＝最大魔力的 %，強化的 +% 每 100 點最大魔力算一次，技能傷害 ×（200＋最大魔力）÷ 300）；按住 X 重新錄製 10 秒的樂譜——普攻是八分音符、基礎冷卻 13 秒以內的技能是四分、以上是二分（一個小節 '
      + capOf(P) + ' 拍）。寫樂譜的時候普攻只記音符、不發出攻擊。之後每次出手：按下 → 演奏（' + perfDur(P).toFixed(1) + ' 秒，可以走、翻滾，不能普攻；攻速每 +1% 演奏快 0.5%；演奏中按的技能，或放開再按一次普攻，會記一個、演奏完馬上接著放（技能優先）；最後一拍左鍵還按著也會接著演奏；耗魔照樂譜：八分 0.5、四分 1.5、二分 5，這份 ' + perfCost(SV().notes) + ' 點）→ 發出。普攻演奏中經過一個音符就射出那一顆（一次普攻射幾發就射幾顆；普攻本身不耗魔力；攻擊音符碰到敵人、撞牆、飛完都會炸開，四分 2 公尺、二分 4 公尺；增益音符給你和隊友最大魔力 10% 的護盾，二分再回同樣多的生命；樂譜是空的就不射），技能照音符加攻速、傷害、範圍、恢復、增益（同一種音符第二個減半、第三個起 1/4）。普攻音符的護盾每段演奏刷新；技能給的護盾另外算、可以跟普攻護盾疊在一起（各自時間到才消失）。'
      + ({ aria: '詠嘆詩人：增益音符效果 ×1.5。', drummer: '戰鼓手：攻擊音符效果 ×1.5；每次演奏打一小節鼓。', serane: '奏域師：八分音符的攻速維持兩倍久；開頭的和弦用管風琴。' }[P && P.adv] || ''),
    step() { }, onCast() { }, play() { },
    act() { },
    gauge(P) { const c = chordOf(P); return { name: '和弦 ' + c.sym, col: c.col, text: c.name + '・' + chordDesc(c, P), sub: status(P), x: ST.rec ? '按住寫完' : '換和弦／按住寫樂譜' }; }
  });

  // ---------- 畫面：左邊的五線譜（2026-10-11：R 鈕變回技能，不再畫和弦） ----------
  const css = document.createElement('style');
  css.textContent = '#bd-staff{position:fixed;z-index:30;pointer-events:none;display:none;filter:drop-shadow(0 4px 10px rgba(0,0,0,.6))}'
    + '#bd-staff canvas{display:block;width:236px}';
  document.head.appendChild(css);
  const box = document.createElement('div'); box.id = 'bd-staff'; const can = document.createElement('canvas'); box.appendChild(can); document.body.appendChild(box);
  const DPR = () => Math.min(2, window.devicePixelRatio || 1);
  // 五線譜：E4（64）在最下面那條線，每半格一個音階（照白鍵粗略換算）
  const STEP = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
  const posOf = m => { const o = Math.floor(m / 12) - 5, d = o * 7 + STEP[((m % 12) + 12) % 12]; return d - 2; };   // E4＝0
  let drawKey = '';
  const draw = P => {
    const c = chordOf(P), notes = ST.rec ? ST.rec.notes : SV().notes || [], cap = Math.max(capOf(P), notes.reduce((a, n) => a + n.d, 0));
    const key = [c.id, notes.map(n => n.d + n.k).join(''), cap, ST.rec ? Math.ceil(ST.rec.t * 4) : -1, ST.perf ? Math.floor(ST.perf.t / ST.perf.dur * 24) : -1, P.lv, P.adv, (P.ws && P.ws.rate || 0).toFixed(2), ST.q.length].join('|');
    if (key === drawKey) return; drawKey = key;
    // 底下的技能加成：先量好要幾行
    const d = DPR(), Wd = 236, g = can.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.font = '11px "Segoe UI","Microsoft JhengHei",sans-serif';
    const lines = []; let cur = '技能演奏：';
    gainsOf(P).forEach((t, i) => { const add = (i ? '・' : '') + t; if (g.measureText(cur + add).width > Wd - 20 && cur !== '技能演奏：') { lines.push(cur); cur = t; } else cur += add; });
    lines.push(cur);
    const Hd = 80 + lines.length * 14;
    if (can.width !== Wd * d || can.height !== Hd * d) { can.width = Wd * d; can.height = Hd * d; can.style.height = Hd + 'px'; }
    g.setTransform(d, 0, 0, d, 0, 0); g.clearRect(0, 0, Wd, Hd);
    const rr = (x, y, w, h, r) => { g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
    const bg = g.createLinearGradient(0, 0, 0, Hd); bg.addColorStop(0, 'rgba(46,32,40,.94)'); bg.addColorStop(1, 'rgba(18,12,16,.94)');
    rr(1, 1, Wd - 2, Hd - 2, 8); g.fillStyle = bg; g.fill(); g.lineWidth = ST.perf ? 2 : 1.5; g.strokeStyle = ST.rec ? '#FF6A8A' : ST.perf ? c.col : '#7A5A48'; g.stroke();
    g.font = 'bold 12px "Segoe UI","Microsoft JhengHei",sans-serif'; g.textBaseline = 'middle'; g.textAlign = 'left';
    g.fillStyle = c.col; g.fillText(c.sym + '  ' + c.name, 10, 12); g.fillStyle = '#C8B8A8'; g.font = '11px "Segoe UI","Microsoft JhengHei",sans-serif'; g.textAlign = 'right'; g.fillText(chordDesc(c, P), Wd - 10, 12);
    const x0 = 30, x1 = Wd - 10, yb = 50, sp = 5; g.strokeStyle = 'rgba(232,216,200,.55)'; g.lineWidth = 1;
    for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(x0 - 18, yb - i * sp + 0.5); g.lineTo(x1, yb - i * sp + 0.5); g.stroke(); }
    g.beginPath(); g.moveTo(x1 + 0.5, yb - 4 * sp); g.lineTo(x1 + 0.5, yb); g.stroke();
    g.fillStyle = 'rgba(232,216,200,.8)'; g.font = '30px "Segoe UI Symbol","Noto Music","Noto Sans Symbols",serif'; g.textAlign = 'center'; g.fillText('𝄞', x0 - 10, yb - 9);
    let beat = 0;
    notes.forEach((n, i) => {
      const x = x0 + 8 + (beat + n.d / 2) / cap * (x1 - x0 - 14), y = yb - posOf(midiOf(n, i, c)) * (sp / 2), col = COL[n.d < 1 ? 'n' : n.k];
      beat += n.d;
      g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 1.4;
      g.beginPath(); g.ellipse(x, y, 3.6, 2.6, -0.4, 0, Math.PI * 2); if (n.d >= 2) g.stroke(); else g.fill();
      g.beginPath(); g.moveTo(x + 3.3, y); g.lineTo(x + 3.3, y - 15); g.stroke();
      if (n.d < 1) { g.beginPath(); g.moveTo(x + 3.3, y - 15); g.quadraticCurveTo(x + 9, y - 10, x + 7, y - 5); g.stroke(); }
    });
    if (ST.perf) { const x = x0 + 8 + (ST.perf.t / ST.perf.dur) * (x1 - x0 - 14); g.strokeStyle = c.col; g.lineWidth = 2; g.beginPath(); g.moveTo(x, yb - 4 * sp - 4); g.lineTo(x, yb + 4); g.stroke(); }
    g.font = '11px "Segoe UI","Microsoft JhengHei",sans-serif'; g.textAlign = 'left'; g.fillStyle = ST.rec ? '#FF8AA8' : ST.perf ? c.col : '#B8A898';
    g.fillText((ST.rec ? '● ' : '') + status(P), 10, 68);
    // 技能加成（顏色跟著和弦）
    g.strokeStyle = 'rgba(232,216,200,.18)'; g.lineWidth = 1; g.beginPath(); g.moveTo(10, 78.5); g.lineTo(Wd - 10, 78.5); g.stroke();
    g.fillStyle = c.col; lines.forEach((t, i) => g.fillText(t, 10, 87 + i * 14));
    if (ST.rec) { g.fillStyle = 'rgba(255,106,138,.85)'; g.fillRect(10, 74, (Wd - 20) * (1 - ST.rec.t / REC_T), 2); }
  };
  // 只在遺跡裡、這一趟還沒結束的時候顯示（結算畫面、回到城裡、換職業都收起來）
  const shown = () => { const w = W(), P = w.P, run = $('run'); return IS(P) && !!w.run && !w.run.done && !w.town && !!run && !run.hidden && !run.classList.contains('town'); };
  const hide = () => { if (box.style.display !== 'none') box.style.display = 'none'; const b = $('r-skill'); if (b && b.classList.contains('bd-on')) b.classList.remove('bd-on', 'rec', 'perf'); };
  // 這一趟結束以後遊戲就不再呼叫 R.hudTick，所以另外每 0.2 秒檢查一次，不該出現就收起來
  setInterval(() => { try { if (!shown()) hide(); } catch (e) { } }, 200);
  const ht0 = R.hudTick;
  R.hudTick = dt => {
    ht0(dt);
    const w = W(), P = w.P, b = $('r-skill'), on = shown();
    if (!on) { hide(); return; }
    if (b && b.classList.contains('bd-on')) b.classList.remove('bd-on', 'rec', 'perf');   // 舊版留下的和弦樣子
    try {
      draw(P);
      // 武器那一行（hud.js 寫「每發 X 魔力」）：吟遊詩人的普攻不耗魔，改寫成每次演奏耗魔（2026-10-11 作者）
      const sm = $('r-weapon') && $('r-weapon').querySelector('small'); if (sm && /每發 [\d.]+ 魔力/.test(sm.innerHTML)) sm.innerHTML = sm.innerHTML.replace(/每發 [\d.]+ 魔力/, SV().notes && SV().notes.length ? '每次演奏耗魔 ' + perfCost(SV().notes) : '每次演奏耗魔 0（樂譜是空的）');
      // 放在畫面左邊、職業特效的條（#core-g）正上方，不擋中間的技能列；左上的資訊框底下留空
      const vis = el => { if (!el) return null; const q = el.getBoundingClientRect(); return q.width && q.height ? q : null; }, r = vis($('core-g')), rt = vis($('r-tl'));
      const top0 = rt && rt.height ? rt.bottom + 6 : 6;
      const bh = box.getBoundingClientRect().height || 90, y = r && r.height ? r.top - bh - 6 : window.innerHeight / 2 - bh / 2;
      box.style.display = 'block'; box.style.left = (r && r.width ? r.left : 12) + 'px'; box.style.top = Math.max(top0, y) + 'px';
    } catch (e) { }
  };
  { const L = R.SKILL_LIB && R.SKILL_LIB.bd_chord, K = R.SKILLS && R.SKILLS.bd_chord, d = '一次撥三條弦，三個音符扇形飛出去，撞到敵人炸開（半徑 3 公尺）。';
    if (L) { L.name = '三重奏'; L.desc = d; L.p = Object.assign({}, L.p, { trio: 1 }); } if (K) { K.name = '三重奏'; K.desc = d; } }
  // 武器說明：吟遊詩人的樂器普攻不耗魔力，改寫「每發消耗魔力」那一行（2026-10-11 作者：每次演奏照樂譜耗魔）
  { const il0 = R.itemLines; if (typeof il0 === 'function') R.itemLines = function (it) { const L = il0.apply(this, arguments); try { const w = it && it.kind === 'weapon' && R.WEAPONS[it.base]; if (w && (w.cls || []).includes('bard') && Array.isArray(L)) return L.map(t => (/^每發消耗魔力/.test(t) ? '普攻不耗魔力；每次演奏照樂譜耗魔（八分 0.5、四分 1.5、二分 5）' : t)); } catch (e) { } return L; }; }
  // 終曲：前方 90 度、半徑 6 公尺的扇形聲波（四波）；安可：你和隊友回「你最大魔力 30%」的生命、你再回 15% 魔力，冷卻 30 秒（2026-10-11 作者）
  { const L = R.SKILL_LIB || {}, SK = R.SKILLS || {};
    if (L.bd_finale) { L.bd_finale.type = 'cone'; L.bd_finale.p = { r: 6, arc: Math.PI / 2, k: 0.9, waves: 4, gap: 300, kb: 0.5, color: '#FFB8E0' }; }
    if (L.bd_encore) { L.bd_encore.p = { pct: 0.3, allies: 0.3, mp: 0.15, color: '#FFE8A0' }; L.bd_encore.cd = 30; if (SK.bd_encore) SK.bd_encore.cd = 30; } }
  // 技能說明：照參數寫出照最大魔力算的數字（治療、護盾＝最大魔力的 %；強化 +% 每 100 點最大魔力；有傷害的加一句）
  const fmt = x => { const v = Math.round(x * 1000) / 10; return String(v % 1 ? v.toFixed(1) : v); };
  const healTxt = p => {
    const L = [];
    if (p.pct && p.allies && Math.abs(p.pct - p.allies) < 1e-6) L.push('你和附近隊友回復「你最大魔力 ' + fmt(p.pct) + '%」的生命');
    else { if (p.pct) L.push('你回復「最大魔力 ' + fmt(p.pct) + '%」的生命'); if (p.allies) L.push('附近隊友回復「你最大魔力 ' + fmt(p.allies) + '%」的生命'); }
    if (p.shield && p.allyShield && Math.abs(p.shield - p.allyShield) < 1e-6) L.push('你和隊友得到「你最大魔力 ' + fmt(p.shield) + '%」的護盾');
    else { if (p.shield) L.push('你得到「最大魔力 ' + fmt(p.shield) + '%」的護盾'); if (p.allyShield) L.push('隊友得到「你最大魔力 ' + fmt(p.allyShield) + '%」的護盾'); }
    if (p.mp) L.push('你再回復「最大魔力 ' + fmt(p.mp) + '%」的魔力');
    if (p.cleanse) L.push('清掉不良狀態');
    return L.join('，');
  };
  const buffTxt = p => {
    const L = [];
    if (p.dmg > 1) L.push('傷害 +' + fmt(p.dmg - 1) + '%'); if (p.speed > 1) L.push('移動 +' + fmt(p.speed - 1) + '%'); if (p.rate > 1) L.push('攻速 +' + fmt(p.rate - 1) + '%');
    if (p.crit) L.push('暴擊率 +' + fmt(p.crit) + '%'); if (p.def) L.push('受到的傷害 −' + fmt(p.def) + '%');
    let t = (p.t ? p.t + ' 秒內' : '') + L.join('、') + (L.length ? '（每 100 點最大魔力）' : '');
    if (p.regen) t += (L.length ? '，' : '') + '每秒回復「最大魔力 ' + fmt(p.regen) + '%」的生命';
    return t;
  };
  const partTxt = (type, p) => (type === 'heal' ? healTxt(p) : type === 'buff' ? buffTxt(p) : type === 'guard' ? (p.t ? p.t + ' 秒內不受傷' : '') + (p.cleanse ? '、解除不良狀態' : '')
    : type === 'zone' && p.zone === 'sanct' ? '站在裡面（半徑 ' + p.r + ' 公尺）每 0.5 秒回復「最大魔力 ' + fmt(0.05 * (p.healK || 1)) + '%」的生命、灼傷進來的敵人' : '');
  const SUPT = ['heal', 'buff', 'guard'];
  const descOf = l => {
    const S = R.SKILLS[l.id]; if (!S) return;
    let d = String(S.desc || '').replace(/（效果隨魔力上限變強）/g, '').replace(/（傷害 × 最大魔力 ÷ 100）/g, '').replace(/（傷害 ×（200＋最大魔力）÷ 300）/g, '');   // 重寫第二次的時候先拿掉上次加的
    const parts = l.type === 'combo' ? (l.p.parts || []) : [[l.type, l.p]];
    const sup = parts.filter(([t, p]) => SUPT.includes(t) || (t === 'zone' && p && p.zone === 'sanct')).map(([t, p]) => partTxt(t, p || {})).filter(Boolean);
    const hurt = parts.some(([t, p]) => p && p.k > 0);
    if (l.id === 'bd_finale') d = '整首曲子的高潮：朝前方 90 度、半徑 6 公尺的扇形，連續四波聲波。';
    if (l.id === 'bd_encore') d = '觀眾喊安可：';
    if (sup.length) {
      // 原本的說明：前面的（二轉…）留著、冒號前的那句留著；組合技留第一個傷害的子句；數字的部分換成照最大魔力的
      const pre = (d.match(/^（[^）]*）/) || [''])[0], body = d.slice(pre.length), hasC = /[：:]/.test(body), head = hasC ? body.split(/[：:]/)[0] : '';
      const keepDmg = l.type === 'combo' ? parts.filter(([t, p]) => !SUPT.includes(t) && t !== 'zone').length : 0;
      const dmgClause = keepDmg && hasC ? (body.split(/[：:]/)[1] || '').split(/[，；、,。]/)[0] : '';
      d = pre + (head ? head + '：' : '') + (dmgClause && !/回復|生命|護盾/.test(dmgClause) ? dmgClause + '；' : '') + sup.join('；') + '。';
    }
    if (hurt) d = d.replace(/。?$/, '。') + '（傷害 ×（200＋最大魔力）÷ 300）';
    S.desc = d;
  };
  const redesc = () => Object.values(R.SKILL_LIB || {}).forEach(l => { if (l && l.cls === 'bard' && l.p) try { descOf(l); } catch (e) { } });
  redesc(); setTimeout(redesc, 0);
  R.bardChord = { ST, SV, vary, dim, gainsOf, scaleArgs, mpArgs, chordOf, castMods, tally, nextChord, startRec, endRec, perfDur, capOf, spdK, perfCost, descOf, CH, CHD };
})(window.R);
