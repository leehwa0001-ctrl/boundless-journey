// 隱藏任務「舊帝國武士的殘響」（一）（二）（三）、隱藏任務精英怪「刀鬼之影-久世 玄悟」、「破損刀刃」、「虛幻的妖刀-寺川參狹」（2026-10-17 作者的三份企劃）
// - 刀鬼之影和《傳奇人物誌》裡已故的刀鬼・久世玄悟不是同一個（作者 2026-10-17）：是妖刀留下的影子，打倒不扣理智（R.ENEMIES 的 phantom）。
// （一）皇嶺的書店・積學堂翻《傳奇人物誌》才會觸發（東鶴書房的那本不會）：紙條掉出來的小劇情 → 發現隱藏任務。
// 刀鬼之影：拿到（一）之後，每一趟吉山近郊・工廠遺跡（不論從第 1 層走下去、還是用存檔點下去，重新進遺跡就算一趟）45% 會出現，一趟最多一次；
//   畫面上的第 13 層以後（2026-10-18 作者：原本 18 層）、最深那層前面隨機挑一層（第一次到 13 層以後的那一層才挑，用存檔點跳過去也挑得到）。
//   那一層沒有任何遺跡生物、沒有別的勇者，只有他；樓層提示「這層充斥著血腥味」，不提示他在。
//   數值：生命 16000、攻擊 25～45（每一下隨機）、移速 4.3、攻速每秒 2.5、IS 1，不受遺跡分級、深度加成；組隊照連線人數加（每多一人生命 +50%，跟 net2.js 一樣）。
//   外型：精靈族、武者胴、布褲、草鞋、紅色綁帶；用妖刀使的招（啜血、妖氣、飢渴、妖斬・四方、蝕月、妖刀解放、千刃・妖刀），每 4～8 秒一招。
//   還沒打倒他就按「走下樓層通道」：他會瞬移到你面前直接砍下去（不會下樓）。
//   那一層受到的傷害最多扣到 1：生命到 1 就進入無敵，畫面暗下去，這一層重新長過（不會再有他），你在入口的營火旁用 1 點生命醒過來，
//   提示「剛剛……是幻覺嗎？但是……胸口的刀傷……」（負面狀態也清掉）。多人連線：隊員失敗只會回到營火旁，房主失敗才整層重來。
//   打倒：變成一道強光消失，地上留下藍色的「破損刀刃」，有接任務的人走過去撿（沒撿就離開這一層也會自動收進任務道具包：必定拿到）。
// （二）撿到破損刀刃（放進任務道具包 questbag.js）→ 小劇情 → 去東鶴找老岩。多人連線：每個人自己的遊戲裡有接任務的才拿得到。
// （三）帶著破損刀刃走進東鶴老岩的鐵匠鋪 → 老岩的小劇情；之後帶齊異變核心 ×6、高純度魔力水晶 ×35、餘燼核 ×20、鐵礦 ×200 再走進去，
//   老岩修好給你「虛幻的妖刀-寺川參狹」，任務完成；不夠：「我一個鐵匠可下不了遺跡幫你收集」。
// 寺川參狹：神話品質的刀（刀客），普攻傷害 480（2026-10-18 作者：原本傳說、250）、每秒 2.3 刀（強化、詞綴照算），最多強化到 +10、詞綴最多 8 條；
//   綁在身上：一直上鎖（解不開）、不能賣、不能拆、不能交易、不能典當、不能丟，倒下也不會掉（affixplus、nettrade、ruinmarket、raid 各改了一行）。
// 放在 index.html 最後面（main.js 前面）：包 R.hurtPlayer、R.onPlayerDown、R.descend、R.loadFloor 的最外面。
(function (R) {
  const W = () => R.W, S = () => R.S, $ = id => document.getElementById(id), rnd = Math.random;
  const esc = s => (R.esc ? R.esc(s) : String(s));
  const QID = 'kuze_echo', EID = 'kuze_shadow', SITE = 'js-factory', BLADE = 'brokenblade', UNIQ = 'terakawa', ODD = 0.45, FROM = 13;
  const NEED = { mutacore: 6, purecry: 35, ember: 20, iron: 200 };
  const PURPLE = '#B83AE8';
  const matName = k => (R.MATS && R.MATS[k] ? R.MATS[k].name : k);
  const have = k => ((S() && S().mats && S().mats[k]) || 0);
  const enough = () => Object.keys(NEED).every(k => have(k) >= NEED[k]);
  const matLines = () => Object.keys(NEED).map(k => matName(k) + ' ×' + NEED[k] + '（' + Math.min(have(k), NEED[k]) + '／' + NEED[k] + '）').join('\n');

  // ---------- 任務、道具、生物 ----------
  const CH = [
    { name: '舊帝國武士的殘響（一）', intro: '在吉山的內部探索，以滿足那微弱的好奇心', goal: '前往吉山近郊-工廠遺跡內探索' },
    { name: '舊帝國武士的殘響（二）', intro: '在打敗了疑似久世玄悟的幻影後，你獲得了「破損刀刃」', goal: '前往東鶴城，親自去到鐵匠鋪找老岩' },
    { name: '舊帝國武士的殘響（三）', intro: '雖然這把刀並不是真正的寺川參狹，但似乎也有著類似的威力，至少老岩是這麼說的……可以收集老岩所需的材料，將其修復', goal: () => '擁有：\n' + matLines() + '\n再次前往老岩的鐵匠鋪' }
  ];
  R.HIDDEN_QUESTS = R.HIDDEN_QUESTS || [];
  if (!R.HIDDEN_QUESTS.some(q => q.id === QID)) R.HIDDEN_QUESTS.push({ id: QID, name: '舊帝國武士的殘響', hint: '', reward: '虛幻的妖刀-寺川參狹', chapters: CH });
  const qs = () => (R.hiddenState ? R.hiddenState(QID) : null);
  const onCh = n => { const p = qs(); return !!(p && p.done == null && (p.ch || 0) === n); };
  R.QITEMS = R.QITEMS || {};
  R.QITEMS[BLADE] = { name: '破損刀刃', rarity: 2, desc: '攻擊：0・無法裝備・無法販賣・無法丟棄', get note() { return onCh(2) ? '老岩說：材料自己帶來，就幫你修好。' : '刀身鮮紅，斷得只剩一截。帶回東鶴給老岩看看。'; } };
  R.ENEMIES[EID] = { name: '刀鬼之影-久世 玄悟', ref: '', human: 1, phantom: 1, elite: 1, noDex: 1, hp: 16000, dmg: 35, speed: 4.3, xp: 400, size: 0.75, ai: 'kuzeboss', color: PURPLE, eye: '#FF3A3A', desc: '' };
  const look = () => {
    const rc = R.RACES && R.RACES.elf;
    return { cls: 'blade', name: '久世 玄悟', lv: 30, look: { race: rc ? 'elf' : undefined, skin: rc && rc.skins ? rc.skins[0] : undefined, hair: '#1A1714', hs: 'ponytail', top: '#3A2A34', cloak: '#2A1A22', acc: 'headband', accCol: '#C8202A',
      eq: { body: { base: 'body_dou' }, legs: { base: 'legs_light' }, feet: { base: 'feet_light' } } } };
  };

  // ---------- 多人連線 ----------
  const coop = () => { const run = W().run, N = R.net; return !!(run && run.coop && !run.coop.solo && N && N.room); };
  const isGuest = () => coop() && !W().run.coop.host;
  const players = () => (coop() ? Math.max(1, (R.net.members || []).length) : 1);
  const kuzeHere = () => (W().enemies || []).find(e => e.id === EID && !e.dead) || null;

  // ---------- 對話（紙條、自言自語、老岩） ----------
  const css = () => {
    if ($('kzq-css')) return; const s = document.createElement('style'); s.id = 'kzq-css';
    s.textContent = '#kzq-talk{position:fixed;inset:0;z-index:9100;background:rgba(8,6,10,.55);display:flex;align-items:flex-end;justify-content:center;padding:16px;font-family:"Noto Serif TC","Noto Serif JP",serif}'
      + '#kzq-talk .kzq-p{width:min(720px,100%);max-height:80vh;overflow:auto;margin-bottom:6vh;background:#1C1820;border:1px solid #5A4A6A;border-left:4px solid #8A2A24;border-radius:6px;padding:14px 18px;color:#EDE6D6;box-shadow:0 8px 30px #000;line-height:1.85;font-size:16px}'
      + '#kzq-talk .kzq-p.note{background:#F3EAD6 repeating-linear-gradient(0deg,transparent 0 27px,rgba(120,90,50,.07) 27px 28px);color:#2A1E14;border:2px solid #6B4A2E;border-left:4px solid #8A2A24}'
      + '#kzq-talk .kzq-p.note p{color:#2A1E14}#kzq-talk .kzq-p.sys{border-left-color:#C9A13A}#kzq-talk .kzq-p.sys h4{margin:0 0 4px;color:#E8C04A;font-size:15px}'
      + '#kzq-talk .kzq-who{margin:0 0 4px;color:#E8C04A;font-weight:700;letter-spacing:.1em}#kzq-talk .kzq-p.note .kzq-who{color:#8A2A24}#kzq-talk p{margin:0 0 6px}'
      + '#kzq-talk .kzq-ft{display:flex;align-items:center;justify-content:space-between;margin-top:8px;font-size:13px;opacity:.85}'
      + '#kzq-talk button{font:inherit;font-size:14px;background:#2E3A4A;color:#F3EAD6;border:1px solid #1A222C;padding:6px 16px;cursor:pointer;border-radius:3px}'
      + '#kzq-flash{position:fixed;inset:0;z-index:8000;background:#FFFFFF;pointer-events:none;opacity:0;transition:opacity .9s ease-out}';
    document.head.appendChild(s);
  };
  // pages：[{ who, lines, cls: 'note'|'sys', h }]
  const talk = (pages, done) => {
    css(); const old = $('kzq-talk'); if (old) old.remove();
    const w = W(), el = document.createElement('div'); el.id = 'kzq-talk';
    let i = 0; const held = !!w.run && !w.paused; if (held) w.paused = true;
    const draw = () => {
      const p = pages[i];
      el.innerHTML = '<div class="kzq-p ' + (p.cls || '') + '">' + (p.h ? '<h4>' + esc(p.h) + '</h4>' : '') + (p.who ? '<p class="kzq-who">' + esc(p.who) + '</p>' : '')
        + p.lines.map(l => '<p>' + esc(l) + '</p>').join('') + '<div class="kzq-ft"><span>' + (i + 1) + '／' + pages.length + '</span><button type="button" class="kzq-next">' + (i < pages.length - 1 ? '下一頁 ▶' : esc(p.end || '好')) + '</button></div></div>';
      el.querySelector('.kzq-next').onclick = next;
    };
    const close = () => { el.remove(); window.removeEventListener('keydown', key, true); if (held && W().run) W().paused = false; try { if (done) done(); } catch (e) { console.warn('[kuzeshadow]', e); } };
    const next = () => { if (i < pages.length - 1) { i++; draw(); } else close(); };
    const key = ev => { if (!el.parentNode) return; if (ev.key === 'Enter' || ev.key === ' ' || ev.key === 'ArrowRight') next(); ev.preventDefault(); ev.stopPropagation(); };
    ['keydown', 'keyup', 'mousedown', 'wheel', 'touchstart'].forEach(t => el.addEventListener(t, e => e.stopPropagation()));
    if (R.input) { R.input.keys = {}; R.input.fire = false; }
    document.body.appendChild(el); window.addEventListener('keydown', key, true); draw();
  };
  const gotPage = n => ({ cls: 'sys', h: '獲得隱藏任務', lines: ['「' + CH[n].name + '」', '任務介紹：' + CH[n].intro, '任務內容：' + (typeof CH[n].goal === 'function' ? CH[n].goal() : CH[n].goal)] });
  const NOTE = () => [
    { lines: ['一張紙條從書中掉了出來，好奇的你將其拿了起來，上面寫著一段關於久世家的傳說。'] },
    { cls: 'note', who: '傳說的妖刀-寺川參狹', lines: ['曾有人言，刀鬼-久世玄悟並非真正的刀鬼，真正的刀鬼其實是他的佩刀之一，也就是『寺川參狹』。',
      '傳說中，寺川參狹的誕生，來自於一座深山內的寺廟中，是住持在殺害了多名和尚後，以其鮮血打造而成。故刀身鮮紅。能劈山成峽；劈峽成川，故得名『寺川參狹』。'] },
    { lines: ['你看著那張紙條，心想著這是荒誕的傳說。'] },
    { lines: ['可紙條的末尾，一段話卻將你的目光吸引。'] },
    { cls: 'note', lines: ['曾有人言「寺川參狹」被封印在了吉山的山區，而那地區在幾年前被發現了有遺跡的存在，傳說中的妖刀或許能再次現身。'] },
    { lines: ['看完後，你在內心吐槽了一番，但還是將紙條放入了口袋中。'] },
    gotPage(0)
  ];
  const AFTER = () => [
    { lines: ['「原來這小紙條上說的是真的啊？但感覺那人也不像久世玄悟書上的樣子啊？算了，不管了。」'] },
    { lines: ['「這刀刃……帶回去給老岩看一下。」'] },
    gotPage(1)
  ];
  const IWA = () => [
    { who: '老岩', lines: ['「小勇者，站在門口……」'] },
    { who: '老岩', lines: ['「你手上的東西，給我慢慢的將它放下來。」'] },
    { lines: ['你看著老岩一臉嚴肅的樣子，乖乖的將「破損刀刃」放在了地上。'] },
    { who: '老岩', lines: ['「你從哪裡獲得的那玩意？」'] },
    { lines: ['（你解釋了一番。）'] },
    { who: '老岩', lines: ['「原來如此，那看來並不是正品，只是有著相同的味道而已。」'] },
    { who: '老岩', lines: ['「沒嚇到你吧？」'] },
    { who: '老岩', lines: ['「作為補償，我幫你把這把刀修好吧，不過材料你自己帶來，就看你需不需要了。」'] },
    gotPage(2)
  ];
  const FIXED = () => [
    { who: '老岩', lines: ['「材料都帶夠了吧，等我一會兒。」'] },
    { lines: ['（一段時間過後）'] },
    { who: '老岩', lines: ['「拿去，修好了。」'] },
    { cls: 'sys', h: '獲得', lines: ['「虛幻的妖刀-寺川參狹」', '完成隱藏任務「舊帝國武士的殘響」'], end: '收下' }
  ];
  const SHORT = () => [
    { who: '老岩', lines: ['「我一個鐵匠可下不了遺跡幫你收集。」'] },
    { cls: 'sys', h: '還需要的材料', lines: matLines().split('\n') }
  ];

  // ---------- （一）皇嶺的書店・積學堂 ----------
  const ob0 = R.openKuzeBook;
  if (ob0) R.openKuzeBook = (where, ...a) => {
    const r = ob0(where, ...a);
    try { if (where === '書店・積學堂' && !qs()) setTimeout(() => { if (!qs()) talk(NOTE(), () => { if (R.hiddenFound) R.hiddenFound(QID); }); }, 500); } catch (e) { console.warn('[kuzeshadow]', e); }
    return r;
  };

  // ---------- 刀鬼之影：出不出現、哪一層 ----------
  const dispNo = (run, f) => (run.grade && run.grade.floor0 && !(run.site && run.site.id === 'kanko') ? f : f + 1);   // 畫面上的層數（ruinplus.js 的第 0 層）
  const plan = (run, f) => {
    const K = run && run.kz; if (!K || K.state !== 'wait' || isGuest()) return false;
    if (dispNo(run, f) < FROM) return false;
    const last = run.floors - 1;   // 最深那層有核心，不放
    if (K.at == null) { const c = []; for (let i = f; i < last; i++) c.push(i); if (!c.length) { K.state = 'none'; return false; } K.at = c[Math.floor(rnd() * c.length)]; }
    if (f > K.at) { K.state = 'none'; return false; }
    return f === K.at;
  };
  const sr0 = R.startRun;
  R.startRun = (...a) => {
    const r = sr0(...a);
    try { const run = W().run; if (run && run.site && run.site.id === SITE && !run.kz) run.kz = { state: onCh(0) && !isGuest() && rnd() < ODD ? 'wait' : 'none' }; } catch (e) { console.warn('[kuzeshadow]', e); }
    return r;
  };
  let pre = false;   // 正在長刀鬼之影的那一層：別的遺跡生物、別的勇者都不生
  const blockOn = () => pre || !!(W().F && W().F.kzBlock);
  const vanish = e => { e.dead = true; e.hp = 0; if (e.m && e.m.g && e.m.g.parent) e.m.g.parent.remove(e.m.g); const L = W().enemies || [], i = L.indexOf(e); if (i >= 0) L.splice(i, 1); };
  const se0 = R.spawnEnemy;
  R.spawnEnemy = (id, x, z, room, o) => {
    const e = se0(id, x, z, room, o);
    try { if (e && id !== EID && blockOn() && !isGuest() && !(o && o.netMirror)) vanish(e); } catch (err) { console.warn('[kuzeshadow]', err); }
    return e;
  };
  const pf0 = R.populateFloor;
  R.populateFloor = (...a) => { if (pre) { ((W().F && W().F.rooms) || []).forEach(r => { r.cleared = true; }); return; } return pf0(...a); };
  const rv0 = R.spawnRivals;
  if (rv0) R.spawnRivals = (...a) => { if (pre) { W().rivalParty = null; W().rivals = []; return; } return rv0(...a); };
  const setup = () => {
    const w = W(), run = w.run, F = w.F; if (!run || !F || !F.rooms || !F.rooms.length) return;
    F.kzBlock = true; F.rooms.forEach(r => { r.cleared = true; });
    (w.enemies || []).slice().forEach(vanish);
    (w.rivals || []).forEach(a => { if (a.h && a.h.g && a.h.g.parent) a.h.g.parent.remove(a.h.g); }); w.rivals = []; w.rivalParty = null;
    const s0 = F.rooms[0]; let room = s0, bd = -1;
    F.rooms.forEach((r, i) => { if (i === 0) return; const d = Math.hypot(r.x - s0.x, r.z - s0.z); if (d > bd) { bd = d; room = r; } });
    const [x, z] = R.roomPoint ? R.roomPoint(room, { min: 1 }) : [room.x, room.z];
    const e = R.spawnEnemy(EID, x, z, room.i, { human: look(), quiet: true }); if (!e) return;
    const k = 1 + 0.5 * (players() - 1);   // 組隊：跟 net2.js 一樣每多一人生命 +50%（不受分級、深度）
    e.hp = e.hpMax = 16000 * k; e.dmg = 35; e.speed = 4.3; e.is = 1; e.hostile = 1; e.aggro = false; e.dormant = false; e.kzNext = 2.5; e.title = R.ENEMIES[EID].name;
    F.kuze = e; run.kz.state = 'on';
    setTimeout(() => { if (W().F === F) R.banner('這層充斥著血腥味', R.floorLabel ? R.floorLabel(run) : ''); }, 900);
  };
  // 離開這一層：沒撿的破損刀刃自動收進任務道具包（必定拿到）；他還在就算這一趟錯過了
  const leaveFloor = () => {
    const w = W(), F = w.F, run = w.run;
    if (F && F.kzDrop && !F.kzDrop.taken) { F.kzDrop.taken = true; giveBlade(); }
    if (run && run.kz && run.kz.state === 'on' && F && F.kuze && !F.kuze.dead) run.kz.state = 'gone';
  };
  const lf0 = R.loadFloor;
  R.loadFloor = (f, o) => {
    try { leaveFloor(); } catch (e) { console.warn('[kuzeshadow]', e); }
    let go = false; try { go = plan(W().run, f); } catch (e) { console.warn('[kuzeshadow]', e); }
    pre = go; let r;
    try { r = lf0(f, o); } finally { pre = false; }
    if (go) try { setup(); } catch (e) { console.warn('[kuzeshadow]', e); }
    return r;
  };
  const ex0 = R.extract;
  if (ex0) R.extract = (...a) => { try { leaveFloor(); } catch (e) { console.warn('[kuzeshadow]', e); } return ex0(...a); };

  // ---------- 刀鬼之影的招（妖刀使） ----------
  const later = (e, f, ms) => { const run = W().run; setTimeout(() => { if (W().run === run && run && !run.done && !e.dead) f(); }, ms); };
  const targets = () => { const w = W(); return [w.P].concat((w.allies || []).filter(a => !a.downed), R.netTargets ? R.netTargets() : []).filter(t => t && !t.dead); };
  const hit = (t, dmg, e, o) => (t.ally ? R.hurtAlly(t, dmg, e) : R.hurtPlayer(dmg, e, o));
  const roll = e => (25 + rnd() * 20) * (e.kzBuffT > 0 ? e.kzBuffK || 1 : 1);   // 攻擊 25～45，每一下隨機
  const heal = (e, v) => { e.hp = Math.min(e.hpMax, e.hp + v); };
  const say = (e, n) => { R.num && R.num(e.x, 3.2, e.z, n, 'crit'); };
  const along = (x0, z0, a, len, wd, f) => { const bx = Math.sin(a), bz = Math.cos(a); targets().forEach(t => { const dx = t.x - x0, dz = t.z - z0, al = dx * bx + dz * bz, sd = Math.abs(dx * bz - dz * bx); if (al > -0.6 && al < len + 0.6 && sd < wd) f(t); }); };
  const near = (x, z, r, f) => targets().forEach(t => { if (Math.hypot(t.x - x, t.z - z) < r) f(t); });
  const SK = {
    drink: { n: '啜血', go: e => { R.fx('mark', e.x, 0, e.z, { r: 3.2, t: 0.55 }); e.kzBusy = 0.85;
      later(e, () => { R.fx('swing', e.x, 0, e.z, { a: e.yaw, arc: 6.28, range: 3.2, color: PURPLE }); near(e.x, e.z, 3.4, t => { hit(t, roll(e) * 1.2, e); heal(e, e.hpMax * 0.005); }); }, 550); } },
    mad: { n: '妖氣', go: e => { e.kzBuffT = 6; e.kzBuffK = 1.35; e.kzFrail = 6; e.kzBusy = 0.4; R.fx('ring', e.x, 0.1, e.z, { r: 2.2, color: PURPLE }); R.fx('poof', e.x, 1, e.z, { color: PURPLE, n: 18 }); } },
    hunger: { n: '飢渴', go: e => { e.kzAura = { t: 5, tick: 0 }; e.kzBusy = 0.3; } },
    four: { n: '妖斬・四方', go: e => { const x0 = e.x, z0 = e.z, A = [0, 1, 2, 3].map(i => e.yaw + i * Math.PI / 2); A.forEach(a => R.fx('aim', x0, 0.3, z0, { a, len: 4.8, t: 0.6 })); e.kzBusy = 0.95;
      later(e, () => { const got = new Set(); A.forEach(a => { R.fx('slash', x0 + Math.sin(a) * 2.4, 1, z0 + Math.cos(a) * 2.4, { a, len: 4.8, w: 1.2, color: PURPLE }); along(x0, z0, a, 4.8, 1.0, t => { if (got.has(t)) return; got.add(t); hit(t, roll(e) * 1.5, e); }); }); }, 600); } },
    eclipse: { n: '蝕月', go: e => { e.kzBuffT = 6; e.kzBuffK = 1.3; const x0 = e.x, z0 = e.z; R.fx('mark', x0, 0, z0, { r: 4.5, t: 0.8 }); e.kzBusy = 1.1;
      later(e, () => { R.fx('boom', x0, 0.3, z0, { r: 4.5, color: PURPLE }); R.fx('ring', x0, 0.1, z0, { r: 5, color: '#FF6AA8' }); near(x0, z0, 4.6, t => hit(t, roll(e) * 2, e, { knock: 0.4 })); R.shake && R.shake(0.35); }, 800); } },
    release: { n: '妖刀解放', go: e => { const x0 = e.x, z0 = e.z, a = e.yaw; R.fx('aim', x0, 0.3, z0, { a, len: 10, t: 0.8 }); e.kzBusy = 1.1;
      later(e, () => { R.fx('slash', x0 + Math.sin(a) * 5, 1, z0 + Math.cos(a) * 5, { a, len: 10, w: 2.4, color: '#FF3A5A' }); along(x0, z0, a, 10, 1.4, t => hit(t, roll(e) * 2, e, { knock: 0.6 })); R.shake && R.shake(0.4); }, 800); } },
    ult: { n: '千刃・妖刀', go: e => { e.kzBusy = 2.5;
      [0, 1, 2].forEach(i => later(e, () => { const L = targets(); if (!L.length) return; const t = L[Math.floor(rnd() * L.length)], a0 = Math.atan2(t.x - e.x, t.z - e.z);
        R.fx('blink', e.x, 1, e.z); const [x, z] = R.nearestFloor ? R.nearestFloor(t.x - Math.sin(a0) * 1.3, t.z - Math.cos(a0) * 1.3) : [t.x, t.z]; e.x = x; e.z = z; e.yaw = Math.atan2(t.x - x, t.z - z); e.m.g.position.set(x, 0, z);
        R.fx('blink', x, 1, z); R.fx('slash', x, 1, z, { a: e.yaw, len: 3.2, w: 1.2, color: PURPLE }); near(x + Math.sin(e.yaw) * 1.3, z + Math.cos(e.yaw) * 1.3, 2, tt => hit(tt, roll(e), e)); }, i * 450));
      later(e, () => R.fx('mark', e.x, 0, e.z, { r: 6, t: 0.6 }), 1450);
      later(e, () => { R.fx('boom', e.x, 0.3, e.z, { r: 6, color: PURPLE }); near(e.x, e.z, 6.1, t => hit(t, roll(e) * 1.6, e, { knock: 0.5 })); R.shake && R.shake(0.5); }, 2050); } }
  };
  const POOL = ['drink', 'mad', 'hunger', 'four', 'eclipse', 'release'];
  const pickSk = e => { const L = POOL.concat(e.kzHalf ? ['ult'] : []).filter(k => k !== e.kzLast && !(k === 'mad' && e.kzBuffT > 0) && !(k === 'hunger' && e.kzAura)); const k = L[Math.floor(rnd() * L.length)] || 'drink'; e.kzLast = k; return k; };
  const cast = (e, k) => { const s = SK[k]; if (!s) return; say(e, s.n); s.go(e); };
  const AI = R.AI_X = R.AI_X || {};
  AI.kuzeboss = (e, P, d, a, sp, dt, walk, H) => {
    e.kzBuffT = Math.max(0, (e.kzBuffT || 0) - dt); e.kzFrail = Math.max(0, (e.kzFrail || 0) - dt);
    if (e.kzAura) { const A = e.kzAura; A.t -= dt; A.tick -= dt; if (A.tick <= 0) { A.tick = 0.5; R.fx('ring', e.x, 0.1, e.z, { r: 3, color: PURPLE }); near(e.x, e.z, 3.2, t => { hit(t, roll(e) * 0.5, e); heal(e, e.hpMax * 0.002); }); } if (A.t <= 0) e.kzAura = null; }
    if (e.kzRest > 0) { e.kzRest -= dt; return false; }
    if (e.kzBusy > 0) { e.kzBusy -= dt; return false; }
    e.yaw = a;
    if (!e.kzHalf && e.hp < e.hpMax * 0.5) { e.kzHalf = 1; cast(e, 'ult'); return false; }
    e.kzNext = (e.kzNext == null ? 3 : e.kzNext) - dt;
    if (e.kzNext <= 0 && d < 14) { e.kzNext = 4 + rnd() * 4; cast(e, pickSk(e)); return false; }   // 每 4～8 秒一招
    let mv = false;
    if (d > 1.7 && walk) { H.move(e, a, sp * (e.kzBuffT > 0 ? 1.12 : 1), dt); mv = true; }
    if (d < 2.5 && e.cd <= 0) { e.cd = 1 / 2.5; if (e.m) e.m.swing = 0.22; R.fx('swing', e.x, 0, e.z, { a, arc: 1.6, range: 2.4, color: '#E8D8F0' }); H.hurtT(P, roll(e), e); }   // 攻速每秒 2.5
    return mv;
  };
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => he0(e, e && e.id === EID && e.kzFrail > 0 && raw > 0 ? raw * 1.15 : raw, o);   // 妖氣：受到的傷害 +15%
  const bb0 = R.bossForBar;
  if (bb0) R.bossForBar = () => { const b = bb0(); if (b) return b; const w = W(), P = w.P, k = kuzeHere(); return k && P && k.aggro && Math.hypot(k.x - P.x, k.z - P.z) < 30 ? k : null; };

  // ---------- 還沒打倒他就要下樓：瞬移到面前砍下去 ----------
  const de0 = R.descend;
  R.descend = (...a) => {
    try {
      const w = W(), F = w.F, e = F && F.kuze, P = w.P;
      if (e && !e.dead && P && !P.dead && !isGuest()) {
        if (fail || (R.stairBusy && R.stairBusy())) return;
        const s = F.stairs, ang = s ? Math.atan2(s.x - P.x, s.z - P.z) : (P.yaw || 0);
        const [x, z] = R.nearestFloor ? R.nearestFloor(P.x + Math.sin(ang) * 1.6, P.z + Math.cos(ang) * 1.6) : [P.x, P.z];
        R.fx('blink', e.x, 1, e.z); e.x = x; e.z = z; e.room = -1; e.aggro = true; e.dormant = false; e.kzBusy = 0; e.kzRest = 0;
        e.yaw = Math.atan2(P.x - x, P.z - z); if (e.m && e.m.g) { e.m.g.position.set(x, 0, z); e.m.g.rotation.y = e.yaw; e.m.swing = 0.22; }
        R.fx('blink', x, 1, z); R.fx('slash', x, 1, z, { a: e.yaw, len: 3.6, w: 1.4, color: '#FF3A5A' }); R.shake && R.shake(0.35);
        R.hurtPlayer(roll(e) * 1.5, e, { knock: 0.5 }); e.cd = 0.6; e.kzNext = Math.max(e.kzNext || 0, 2);
        return;
      }
    } catch (err) { console.warn('[kuzeshadow]', err); }
    return de0(...a);
  };

  // ---------- 生命最多扣到 1：無敵 → 整層重來、在營火旁醒過來 ----------
  let fail = null;
  const guardOn = () => !!(fail || (W().run && !W().run.done && kuzeHere()));
  const revive = run => {
    const w = W();
    if (!isGuest() && w.run === run) { if (run.kz) run.kz.state = 'failed'; R.loadFloor(run.floor); }   // 這一層重新長過，不會再有他
    const P = w.P, F = w.F; if (!P || !F || !F.rooms) return;
    const c = F.camp, r0 = F.rooms[0], [x, z] = R.nearestFloor ? (c ? R.nearestFloor(c.x + 1.3, c.z + 1.3) : R.nearestFloor(r0.x, r0.z + 2)) : [r0.x, r0.z];
    P.x = x; P.z = z; if (P.h && P.h.g) P.h.g.position.set(x, 0, z);
    Object.assign(P, { hp: 1, dead: false, iframe: 2, slowT: 0, blindT: 0, knockT: 0, stumble: 0, dbf: {}, jump: null, air: 0, dashT: 0 });
    if (R.setDown && P.h) R.setDown(P.h, false);
    R.placeCam && R.placeCam(null);
    setTimeout(() => R.toast && R.toast('剛剛……是幻覺嗎？但是……胸口的刀傷……', '#C8A0D8'), 500);
  };
  const startFail = () => {
    const w = W(), P = w.P, run = w.run; if (fail || !P || !run) return;
    fail = { run }; P.hp = 1; P.dead = false; P.iframe = 99;
    R.shake && R.shake(0.5);
    const e = kuzeHere(); if (e) e.kzRest = 3;
    setTimeout(() => {
      if (W().run !== run || run.done) { fail = null; return; }
      R.fade(() => { try { revive(run); } catch (err) { console.warn('[kuzeshadow]', err); } finally { fail = null; } });
    }, 900);
  };
  const hp0 = R.hurtPlayer;
  R.hurtPlayer = (raw, src, o) => {
    const P = W().P;
    if (!P || !guardOn()) return hp0(raw, src, o);
    if (fail) return;   // 無敵
    const r = hp0(raw, src, o);
    if (P.hp <= 1) { P.hp = 1; P.dead = false; startFail(); }
    return r;
  };
  const pd0 = R.onPlayerDown;
  R.onPlayerDown = (...a) => {
    try { if (guardOn()) { const P = W().P; if (P) { P.hp = 1; P.dead = false; } startFail(); return; } } catch (e) { console.warn('[kuzeshadow]', e); }
    try {
      leaveFloor();
      const run = W().run, s = S(); if (run && s && run.bag) run.bag = run.bag.filter(it => { if (it && it.bound) { s.stash.push(it); return false; } return true; });   // 綁定的刀倒下也不會掉
    } catch (e) { console.warn('[kuzeshadow]', e); }
    return pd0(...a);
  };
  const ue0 = R.updateEnemies;
  R.updateEnemies = dt => {
    const r = ue0(dt);
    try {
      const w = W(), F = w.F, P = w.P;
      if (fail && P) { P.hp = Math.max(1, P.hp); P.iframe = Math.max(P.iframe || 0, 0.5); }
      else if (P && !P.dead && guardOn() && P.hp <= 1) startFail();   // 直接改生命的（燒、毒、陷阱）
      if (F && !F.kzSeen && isGuest() && kuzeHere()) { F.kzSeen = 1; R.banner('這層充斥著血腥味', R.floorLabel ? R.floorLabel(w.run) : ''); }
      const d = F && F.kzDrop; if (d && !d.taken && d.g) { d.t = (d.t || 0) + dt; d.g.position.y = 0.25 + Math.sin(d.t * 2.4) * 0.08; d.g.rotation.y += dt * 0.8; }
    } catch (e) { console.warn('[kuzeshadow]', e); }
    return r;
  };

  // ---------- 打倒：一道強光、留下破損刀刃 ----------
  const flash = () => { css(); let el = $('kzq-flash'); if (!el) { el = document.createElement('div'); el.id = 'kzq-flash'; document.body.appendChild(el); } el.style.transition = 'none'; el.style.opacity = '0.85'; void el.offsetWidth; el.style.transition = ''; el.style.opacity = '0'; };
  const dropMesh = (x, z) => {
    const TH = window.THREE, F = W().F; if (!TH || !F || !F.group) return null;
    const g = new TH.Group(), blue = new TH.MeshBasicMaterial({ color: '#5BA8F2' });
    const blade = new TH.Mesh(new TH.BoxGeometry(0.07, 0.03, 0.85), new TH.MeshBasicMaterial({ color: '#C8303A' })); blade.position.z = 0.25; g.add(blade);
    const tsuba = new TH.Mesh(new TH.CylinderGeometry(0.11, 0.11, 0.03, 10), new TH.MeshBasicMaterial({ color: '#2A2420' })); tsuba.rotation.x = Math.PI / 2; tsuba.position.z = -0.18; g.add(tsuba);
    const grip = new TH.Mesh(new TH.BoxGeometry(0.06, 0.05, 0.32), new TH.MeshBasicMaterial({ color: '#3A2A3A' })); grip.position.z = -0.36; g.add(grip);
    const ring = new TH.Mesh(new TH.TorusGeometry(0.55, 0.04, 6, 24), blue); ring.rotation.x = Math.PI / 2; ring.position.y = -0.2; g.add(ring);
    const L = new TH.PointLight('#5BA8F2', 1.2, 6, 1.6); L.position.y = 0.6; g.add(L);
    g.position.set(x, 0.25, z); F.group.add(g); return g;
  };
  const giveBlade = () => {
    if (!onCh(0) || !R.qItemAdd) return;
    if (!R.qItemHas(BLADE)) R.qItemAdd(BLADE);
    talk(AFTER(), () => { if (R.hiddenChapter) R.hiddenChapter(QID, 1); });
  };
  const pickBlade = () => { const F = W().F, d = F && F.kzDrop; if (!d || d.taken) return; d.taken = true; if (d.g && d.g.parent) d.g.parent.remove(d.g); giveBlade(); };
  const ni0 = R.nearestInteract;
  if (ni0) R.nearestInteract = (...a) => {
    const b = ni0(...a);
    try { const w = W(), d = w.F && w.F.kzDrop, P = w.P; if (d && !d.taken && P) { const dd = Math.hypot(d.x - P.x, d.z - P.z); if (dd < 2 && (!b || dd < 1.4 || dd < Math.hypot(b.x - P.x, b.z - P.z))) return { x: d.x, z: d.z, r: 2, label: '撿起「破損刀刃」', act: pickBlade }; } } catch (e) { console.warn('[kuzeshadow]', e); }
    return b;
  };
  const down = e => {
    const w = W(), F = w.F, run = w.run;
    R.fx('pillar', e.x, 0, e.z, { r: 1.8, color: '#FFFFFF' }); R.fx('ring', e.x, 0.1, e.z, { r: 5, color: '#FFF6D8' }); R.fx('poof', e.x, 1.2, e.z, { color: '#FFFFFF', n: 50 });
    R.shake && R.shake(0.6); flash();
    if (run && run.kz) run.kz.state = 'down';
    if (F && F.kuze === e) F.kuze = null;
    if (!onCh(0)) return;   // 沒有接任務的人不會掉
    const [x, z] = R.nearestFloor ? R.nearestFloor(e.x, e.z) : [e.x, e.z];
    setTimeout(() => { if (W().F !== F || !F) return; F.kzDrop = { x, z, g: dropMesh(x, z), taken: false }; R.fx('ring', x, 0.1, z, { r: 1.4, color: '#5BA8F2' }); }, 900);
  };
  const ke0 = R.killEnemy;
  R.killEnemy = (e, by) => {
    const was = !!(e && !e.dead && e.id === EID), r = ke0(e, by);
    try { if (was && e.dead) down(e); } catch (err) { console.warn('[kuzeshadow]', err); }
    return r;
  };

  // ---------- （二）（三）東鶴、老岩的鐵匠鋪 ----------
  const makeBlade = () => {
    const s = S(), lv = s && s.classes && s.classes[s.cls] ? s.classes[s.cls].lv : 10;
    const cursed = x => x.affixes.some(a => { const d = R.affixDef(x, a.id); return d && d.curse; });
    let it = null; for (let i = 0; i < 12 && (!it || cursed(it)); i++) it = R.makeItem({ kind: 'weapon', base: 'katana', ilvl: Math.max(10, lv || 10), rarity: 5, identified: true });   // 不出詛咒詞綴
    if (cursed(it)) it.affixes = it.affixes.filter(a => { const d = R.affixDef(it, a.id); return !(d && d.curse); });
    Object.assign(it,{ legend: null, uniq: UNIQ, locked: true, bound: 1, affixMax: 8, topped: 1 });
    s.stash.push(it); R.save && R.save(); return it;
  };
  const finish = () => {
    if (!onCh(2) || !enough()) return;
    const s = S(); Object.keys(NEED).forEach(k => { s.mats[k] -= NEED[k]; });
    R.qItemTake(BLADE); makeBlade(); if (R.hiddenDone) R.hiddenDone(QID);
    R.sfx && R.sfx('magic');
  };
  const smithy = () => {
    const ins = W().inside; if (!ins || ins.kind !== 'smith' || $('kzq-talk')) return;
    if (onCh(1) && R.qItemHas(BLADE)) talk(IWA(), () => { if (R.hiddenChapter) R.hiddenChapter(QID, 2); });
    else if (onCh(2)) { if (enough()) talk(FIXED(), finish); else talk(SHORT()); }
  };
  const ei0 = R.enterInterior;
  if (ei0) R.enterInterior = (kind, ...a) => {
    const r = ei0(kind, ...a);
    try { if (kind === 'smith' && (onCh(1) || onCh(2))) { let n = 0; const wait = () => { const ins = W().inside; if (ins && ins.kind === 'smith') { setTimeout(smithy, 450); return; } if (++n < 40) setTimeout(wait, 100); }; setTimeout(wait, 100); } } catch (e) { console.warn('[kuzeshadow]', e); }
    return r;
  };

  // ---------- 寺川參狹：數值、名字、說明、綁定 ----------
  const isU = it => !!(it && it.uniq === UNIQ);
  const ws0 = R.weaponStats;
  R.weaponStats = it => {
    if (isU(it) && it.rarity < 5) it.rarity = 5;   // 舊存檔拿到的是傳說：換成神話
    const ws = ws0(it); if (!isU(it) || !ws) return ws;
    try {
      // 強化、詞綴照算：跟一把沒強化、沒詞綴的同一把比，乘上去
      const plain = ws0(Object.assign({}, it, { plus: 0, affixes: [], enchant: null, sockets: null }));
      const kd = plain && plain.dmg > 0 ? ws.dmg / plain.dmg : 1, kr = plain && plain.rate > 0 ? ws.rate / plain.rate : 1;
      const real = R.bladeWeaponReal ? R.bladeWeaponReal('katana', { dmg: 1, rate: 1 }) : null;   // 刀客的普攻：刀的傷害、攻速換算（classcore.js）
      const fd = real && real.dmg > 0 ? real.dmg : 1, fr = real && real.rate > 0 ? real.rate : 1;
      ws.dmg = 480 / fd * kd; ws.rate = 2.3 / fr * kr;
    } catch (e) { console.warn('[kuzeshadow]', e); }
    return ws;
  };
  const nm0 = R.itemName;
  R.itemName = it => (isU(it) ? '虛幻的妖刀-寺川參狹' + (it.plus ? ' +' + it.plus : '') : nm0(it));
  const il0 = R.itemLines;
  if (il0) R.itemLines = it => { const L = il0(it); try { if (isU(it) && Array.isArray(L)) L.push('並不是真正的寺川參狹，卻有著相同的味道（老岩修好的）', '綁在身上：無法販賣、無法交易、無法丟棄', '強化最多 +10・詞綴最多 8 條'); } catch (e) { console.warn('[kuzeshadow]', e); } return L; };
  const rp0 = R.refinePlus;
  if (rp0) R.refinePlus = it => (isU(it) ? null : rp0(it));   // 最多 +10（refineplus.js 的極限精煉不行）
  const hub0 = R.hub;
  if (hub0) R.hub = (t, f) => {
    const r = hub0(t, f);
    try { document.querySelectorAll('#hub-body [data-rfp]').forEach(b => { const it = R.itemById && R.itemById(b.dataset.rfp); if (isU(it)) { b.disabled = true; b.onclick = null; b.className = 'btn'; b.textContent = '這把刀最多強化到 +10'; } }); } catch (e) { console.warn('[kuzeshadow]', e); }
    return r;
  };
  // 上鎖的按鈕：綁定的解不開
  document.addEventListener('click', ev => {
    const b = ev.target && ev.target.closest && ev.target.closest('[data-lock]'); if (!b) return;
    const it = R.itemById && R.itemById(b.dataset.lock); if (!it || !it.bound) return;
    ev.preventDefault(); ev.stopPropagation(); it.locked = true;
    R.toast && R.toast('「' + R.itemName(it) + '」綁在你身上：解不開鎖，不能賣、不能交易。', '#FF9A6A');
  }, true);
})(window.R);
