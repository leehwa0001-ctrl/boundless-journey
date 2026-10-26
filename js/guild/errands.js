// 新人段・初心階的跑腿委託（2026-10-13 作者：初心階的任務要多一點，例如跑跑腿之類的，可能陸地上走走）
// - 公會「委託」分頁多一塊「委託板・初心跑腿」：新人段才接得到。東鶴城裡送東西、貼公告、到城外的農家、燈塔、調查點走走，
//   以及搭電車把信送到其他城市（皇嶺、吉山、西見、板南）。不用下遺跡。
// - 一次最多接 3 張；每張每天只能做一次（隔天又會出現）。目的地自動設成地圖上的目的地（雷達、大地圖有路線），走到旁邊就算到了。
// - 每一步做完回公會繳交：付一點報酬（城際的另外補車資），登錄一件 F 級的任務成績（五軌：完成度 100、效率看幾天內繳交、創傷 90、環境 95、反饋隔天），
//   算進新人段升階的件數（ranks.js 的 F 級件數）。
// - 存檔：R.S.errands = [{ eid, step, day0, done }]、R.S.errandDay = { day, ids: [今天做完的] }。
// 放在 questboard.js 後面、guildhall.js 前面（委託板的標題開頭是「委託板」，會被分到「委託」分頁）。
(function (R) {
  const W = () => R.W, S = () => R.S, $ = id => document.getElementById(id), esc = s => R.esc(s);
  const MAX = 3;
  // 每一步：at＝東鶴裡設施的標籤（W.town.inter 的 label），fb＝找不到時的座標；city＝到那座城就算；say＝到了之後的話
  const E = [
    { id: 'kencho', name: '把公會的文書送到東鶴縣廳', who: '公會的櫃台', pay: 18, steps: [
      { at: /^走進東鶴縣廳/, fb: [132, -87], txt: '東鶴縣廳', say: ['縣廳的職員：「公會的月報？辛苦了，蓋個章給你。」'] }] },
    { id: 'clinic', name: '白藤堂的藥送去東鶴醫院', who: '白藤堂', pay: 22, steps: [
      { at: /^走進白藤堂/, fb: [-95, -85], txt: '白藤堂（拿藥）', say: ['白藤堂的老闆娘：「這箱是醫院訂的退燒藥，別摔了。」'] },
      { at: /^走進東鶴醫院/, fb: [114, -140], txt: '東鶴醫院', say: ['護理師：「剛好用完了，幫大忙了！」'] }] },
    { id: 'ore', name: '鐵匠鋪的帳單送到選礦廠', who: '老岩的鐵匠鋪', pay: 24, steps: [
      { at: /^走進老岩的鐵匠鋪/, fb: [-61, -146], txt: '老岩的鐵匠鋪（拿帳單）', say: ['老岩：「上個月的礦錢，叫他們老實點算。」'] },
      { at: /^和選礦廠的警衛說話/, fb: [185, 96], txt: '選礦廠的警衛', say: ['警衛：「老岩的帳單啊……我拿進去給主任。」'] }] },
    { id: 'school', name: '郵局的包裹送到河西小學', who: '東鶴郵局', pay: 26, steps: [
      { at: /^走進東鶴郵局/, fb: [158, -136], txt: '東鶴郵局（拿包裹）', say: ['郵局：「小學訂的粉筆和教科書，有點重。」'] },
      { at: /^河西小學的校門/, fb: [-130, 26], txt: '河西小學的校門', say: ['老師：「謝謝勇者大哥哥（姊姊）！」小朋友在窗邊揮手。'] }] },
    { id: 'notice', name: '在城裡張貼公會的告示', who: '公會的櫃台', pay: 28, steps: [
      { at: /^看瓦版/, fb: [-67, -110], txt: '瓦版（貼第 1 張）', say: ['（把「遺跡附近請勿單獨進入」的告示貼好。）'] },
      { at: /^私人委託的木板/, fb: [-101, -78], txt: '私人委託的木板（第 2 張）', say: ['（貼在最顯眼的地方。）'] },
      { at: /^站前的時鐘柱/, fb: [9, 190], txt: '站前的時鐘柱（第 3 張）', say: ['（等電車的人湊過來看。）'] },
      { at: /^公車站的站牌/, fb: [35, 190], txt: '公車站的站牌（第 4 張）', say: ['（四張都貼好了。）'] }] },
    { id: 'farm', name: '探望北郊農舍的老農夫', who: '公會的櫃台', pay: 30, steps: [
      { at: /^敲北郊農舍的門/, fb: [-97, -137], txt: '北郊農舍', say: ['老農夫：「腰不好而已，公會還派人來看啊。順便幫我把柴搬進去吧。」', '（搬了一會兒柴。老農夫塞給你一顆蘋果。）'] }] },
    { id: 'herb', name: '到城外的農家幫忙採藥草', who: '白藤堂', pay: 34, herb: 2, steps: [
      { at: /^敲農家的門/, fb: [-156, -180], txt: '湯山村旁的農家（採藥草）', say: ['農家的阿姨：「田埂邊的藥草隨便採，順便拔拔草就好。」', '（採了一籃藥草。）'] },
      { at: /^走進白藤堂/, fb: [-13, 55], txt: '白藤堂（交藥草）', say: ['白藤堂的老闆娘：「品相不錯。多的兩株你留著。」（藥草 +2）'] }] },
    { id: 'makabe', name: '把便當送到城西的調查點', who: '赤提燈', pay: 30, steps: [
      { at: /^走進赤提燈/, fb: [-31, 53], txt: '赤提燈（拿便當）', say: ['老闆：「調查點的真壁主任又忘了吃飯，拿去給他。」'] },
      { at: /^和調查點主任真壁說話/, fb: [-172, -73], txt: '城西的調查點（真壁主任）', say: ['真壁：「喔，赤提燈的便當！遺跡的事不用你管，你只要送到這裡就好。」'] }] },
    { id: 'fish', name: '魚市場的鮮魚送到赤提燈', who: '東鶴魚市場', pay: 20, steps: [
      { at: /^東鶴魚市場/, fb: [199, 169], txt: '東鶴魚市場（拿魚）', say: ['魚販：「今天早上的鰤魚，趁新鮮送過去！」'] },
      { at: /^走進赤提燈/, fb: [-31, 53], txt: '赤提燈', say: ['老闆：「好魚！今晚的定食有著落了。」'] }] },
    { id: 'sutra', name: '書房的經書送到東鶴寺', who: '東鶴書房', pay: 22, steps: [
      { at: /^走進東鶴書房/, fb: [-2, -75], txt: '東鶴書房（拿經書）', say: ['書房的老闆：「住持訂的經書，用布包好了。」'] },
      { at: /^走進東鶴寺/, fb: [-13, 188], txt: '東鶴寺', say: ['住持：「阿彌陀佛，路上辛苦了。喝杯茶再走吧。」'] }] },
    { id: 'light', name: '巡視東鶴的兩座燈塔', who: '東鶴港務局', pay: 40, steps: [
      { at: /^東鶴港務局/, fb: [215, 62], txt: '東鶴港務局（拿巡視表）', say: ['港務局：「兩座燈塔的燈有沒有亮、門有沒有鎖好，看一下就好。」'] },
      { at: /^在燈塔下看海/, fb: [216, 188], txt: '東鶴燈塔', say: ['（燈塔的門鎖得好好的。）'] },
      { at: /^在白燈塔下看海/, fb: [438, 57], txt: '港外的白燈塔', say: ['（海風很大。白燈塔也沒問題。）'] }] },
    { id: 'huangling', name: '搭電車把公會的信送到皇嶺', who: '公會的櫃台', pay: 45, fare: 90, steps: [
      { at: /^走進東鶴站/, fb: [9, 154], txt: '東鶴站（買票去皇嶺）', say: ['（在售票口買往皇嶺的票。）'] },
      { city: 'huangling', txt: '皇嶺（公會昭旭分館）', say: ['昭旭分館的館員：「東鶴分館的信，收到了。回去幫我問候分館長。」'] }] },
    { id: 'jishan', name: '搭電車把零件送到吉山', who: '德克斯凡商行', pay: 40, fare: 70, steps: [
      { at: /^走進德克斯凡商行/, fb: [145, -85], txt: '德克斯凡商行（拿零件）', say: ['店員：「吉山的工廠急著要這批魔導零件。」'] },
      { at: /^走進東鶴站/, fb: [9, 154], txt: '東鶴站（買票去吉山）', say: ['（在售票口買往吉山的票。）'] },
      { city: 'jishan', txt: '吉山', say: ['工廠的師傅：「來得正好，生產線停一天就虧大了。」'] }] },
    { id: 'bannan', name: '到板南的寺院求朱印給東鶴寺', who: '東鶴寺', pay: 35, fare: 55, steps: [
      { at: /^走進東鶴寺/, fb: [-13, 188], txt: '東鶴寺（拿朱印帳）', say: ['住持：「板南的寺院跟本寺有緣，麻煩你幫我求一個朱印。」'] },
      { city: 'bannan', txt: '板南', say: ['（在板南的寺院蓋好了朱印。）'] },
      { at: /^走進東鶴寺/, fb: [-13, 188], txt: '東鶴寺（交朱印帳）', say: ['住持：「多謝。這一路也算是修行了。」'] }] },
    { id: 'xijian', name: '把海洋大學的樣本送到西見', who: '東鶴魚市場', pay: 38, fare: 65, steps: [
      { at: /^東鶴魚市場/, fb: [199, 169], txt: '東鶴魚市場（拿樣本）', say: ['魚販：「西見的海洋大學要這箱怪魚做研究，冰塊別化了。」'] },
      { city: 'xijian', txt: '西見', say: ['海洋大學的研究生：「哇，就是這種！謝謝你跑這一趟。」'] }] }
  ];
  R.ERRANDS = E;
  const byId = id => E.find(e => e.id === id);
  const novice = () => { const r = S() && S().rank; return !r || !r.dan; };
  const mine = () => { const s = S(); s.errands = s.errands || []; return s.errands; };
  const today = () => { const s = S(), d = s.day || 0; if (!s.errandDay || s.errandDay.day !== d) s.errandDay = { day: d, ids: [] }; return s.errandDay.ids; };
  const total = e => e.pay + (e.fare || 0);
  const ck = () => { const t = W().town; return t && t.ck ? t.ck : null; };
  const inDonghe = () => { const t = W().town; return !!(t && (ck() === 'donghe' || (!t.ck && !t.hosu && !t.az))) && !t.room; };
  const target = st => {
    const t = W().town; if (!st.at || !t || !inDonghe()) return null;
    const it = (t.inter || []).find(i => typeof i.label === 'string' && !i.follow && st.at.test(i.label));
    return it ? [it.x, it.z] : (t.ck ? st.fb : null);
  };
  const wp = q => {
    const e = byId(q.eid), st = e && e.steps[q.step]; if (!st || !R.setWaypoint) return;
    const p = target(st); if (!p) return;
    const C = R.CITY, toS = v => (ck() ? v : v / C.S + 500);
    R.setWaypoint(toS(p[0]), toS(p[1]), '跑腿：' + st.txt);
  };
  // 2026-10-14 作者：「委託按下去要有指示（指引地圖）」——點「手上的委託」裡的一行：設好這一站的目的地、打開地圖給你看；
  //   要搭電車的站、或人不在東鶴的時候，先指到售票口；跑完了指回公會。畫面上的方向箭頭在 questguide.js。
  // 售票口在車站裡面（精緻版的城，站房是走進去的房間）：外面找不到就指到車站門口
  const interAt = re => { const t = W().town; return t && (t.inter || []).find(i => typeof i.label === 'string' && !i.follow && re.test(i.label)); };
  const wpAt = (it, name) => { const C = R.CITY, toS = v => (ck() ? v : v / C.S + 500); R.setWaypoint(toS(it.x), toS(it.z), name); return true; };
  const guide = q => {
    const e = byId(q.eid), st = e && e.steps[q.step], t = W().town; if (!e) return false;
    if (!t || W().run) { R.toast && R.toast('回到城裡才能指路。', '#E8C04A'); return false; }
    const say = m => { R.toast && R.toast(m, '#7FE0FF'); };
    if (!inDonghe()) { const it = (interAt(/售票口/) || interAt(/^走進\S*站(（|$)/)); if (it) { wpAt(it, '跑腿：先回東鶴（售票口）'); say('先到售票口搭車回東鶴。'); return true; } say('先回東鶴。'); return false; }
    if (q.done || !st) { const it = interAt(/^走進公會東鶴分館/); if (it) { wpAt(it, '跑腿：回公會繳交'); say('跑完了，回公會分館繳交。'); return true; } return false; }
    if (st.city) { const it = (interAt(/售票口/) || interAt(/^走進\S*站(（|$)/)); if (it) { wpAt(it, '跑腿：搭電車去' + st.txt); say('到東鶴站的售票口搭電車去' + st.txt + '。'); return true; } return false; }
    if (!target(st)) return false; wp(q); say('目的地：' + st.txt + '（地圖、雷達上有路線，畫面上有箭頭）'); return true;
  };
  R.errandGuide = eid => { const q = mine().find(x => x.eid === eid); return q ? guide(q) : false; };
  const advance = (q, e) => {
    const st = e.steps[q.step]; q.step++;
    if (e.herb && q.step >= e.steps.length) { const s = S(); s.mats = s.mats || {}; s.mats.herb = (s.mats.herb || 0) + e.herb; }
    if (R.townTalk) R.townTalk(e.name, st.say.concat([q.step >= e.steps.length ? '（跑腿完成。回公會的登記處繳交，領報酬。）' : '（下一站：' + e.steps[q.step].txt + '）']));
    R.sfx && R.sfx('pick'); R.save && R.save();
    if (q.step < e.steps.length) wp(q); else { q.done = 1; R.toast && R.toast('跑腿完成：' + e.name + '。回公會繳交。', '#E8C04A'); }
  };
  // 到城市了（選單式的城市據點，或可以走的 3D 城）
  const arrive = id => { if (!S()) return; mine().forEach(q => { const e = byId(q.eid), st = e && !q.done && e.steps[q.step]; if (st && st.city === id) advance(q, e); }); };
  let hubWrapped = null;
  const wrapHub = () => { if (R.cityHub && R.cityHub !== hubWrapped) { const h0 = R.cityHub; hubWrapped = R.cityHub = (id, ...a) => { const r = h0(id, ...a); try { arrive(id); } catch (err) { console.warn('[errands]', err); } return r; }; } };
  // 每半秒看一次：走到目的地旁邊
  setInterval(() => {
    try {
      wrapHub(); const s = S(), P = W() && W().P; if (!s || !s.errands || !s.errands.length || !P || W().run) return;
      const c = ck(); if (c && c !== 'donghe') arrive(c);
      s.errands.forEach(q => {
        const e = byId(q.eid), st = e && !q.done && e.steps[q.step]; if (!st || !st.at) return;
        const p = target(st); if (p && Math.hypot(p[0] - P.x, p[1] - P.z) < 6) advance(q, e);
      });
    } catch (err) { console.warn('[errands]', err); }
  }, 500);

  // ---------- 繳交 ----------
  const clamp = v => Math.max(1, Math.min(100, Math.round(v)));
  const turnIn = q => {
    const s = S(), e = byId(q.eid); if (!e || !q.done) return 0;
    const d = (s.day || 0) - (q.day0 || 0), eff = d <= 1 ? 100 : clamp(100 - 10 * (d - 1));
    s.tasks = s.tasks || [];
    s.tasks.push({ id: s.tasks.length + 1, site: '跑腿・' + e.name, grade: 'hamilia', letter: 'F', kind: 'board', need: 1, done: 1, limitH: 0, h: 0, s: [100, eff, 90, 95, null], day: s.day, ready: (s.day || 0) + 1, failed: false, rkTag: 1, board: 1, errand: 1 });
    s.gold += total(e); s.errands = mine().filter(x => x !== q);
    s.stats = s.stats || {}; s.stats.errands = (s.stats.errands || 0) + 1;
    return total(e);
  };
  const stepLine = (q, e) => e.steps.map((st, i) => '<span class="er-st' + (i < q.step ? ' ok' : i === q.step ? ' now' : '') + '">' + (i < q.step ? '✓ ' : '') + esc(st.txt) + '</span>').join('<i>→</i>');
  const box = () => {
    const qs = mine(), took = qs.map(q => q.eid), done = today(), full = qs.length >= MAX;
    const held = q => { const e = byId(q.eid); if (!e) return ''; return '<div class="ft-row er-row"><b>F 級・' + esc(e.name) + '</b><small>委託人：' + esc(e.who) + '・報酬 ' + e.pay + ' 費拉' + (e.fare ? '＋車資 ' + e.fare : '') + '</small><div class="er-steps">' + stepLine(q, e) + '</div><div class="row">'
      + (q.done ? '<button type="button" class="btn gold" data-erin="' + q.eid + '">繳交（' + total(e) + ' 費拉）</button>' : '<button type="button" class="mini" data-erwp="' + q.eid + '">標在地圖上</button>') + '<button type="button" class="mini" data-erdrop="' + q.eid + '">放棄</button></div></div>'; };
    const offer = e => '<div class="ft-row er-row"><b>F 級・' + esc(e.name) + '</b><small>委託人：' + esc(e.who) + '・' + e.steps.length + ' 站・報酬 ' + e.pay + ' 費拉' + (e.fare ? '＋車資 ' + e.fare + '（搭電車，會過 1 天以上）' : '') + (e.herb ? '＋藥草 ' + e.herb : '') + '</small><div class="er-steps">' + e.steps.map(st => '<span class="er-st">' + esc(st.txt) + '</span>').join('<i>→</i>') + '</div><div class="row"><button type="button" class="btn" data-ertake="' + e.id + '"' + (full ? ' disabled' : '') + '>接下</button></div></div>';
    const off = novice() ? E.filter(e => !took.includes(e.id) && !done.includes(e.id)) : [];   // 升到冒險段以後不再接新的，手上的照樣能繳交、放棄
    return '<h3>委託板・初心跑腿（新人段）</h3><p class="note">城裡城外跑跑腿：送東西、貼告示、探望農家、巡燈塔，也有搭電車送信到別的城市。不用下遺跡。一次最多接 ' + MAX + ' 張，目的地會標在地圖上，走到旁邊就算到了；做完回這裡繳交，每張算一件 F 級的任務、算進升階的件數。每張每天做一次。</p>'
      + (qs.length ? '<p><b>手上的跑腿（' + qs.length + '／' + MAX + '）</b></p><div class="ft-list">' + qs.map(held).join('') + '</div>' : '')
      + '<p><b>今天的跑腿</b>' + (done.length ? '（今天做完 ' + done.length + ' 張）' : '') + '</p>' + (off.length ? '<div class="ft-list">' + off.map(offer).join('') + '</div>' : '<p class="note">今天的跑腿都做完了，明天再來。</p>');
  };
  const hub0 = R.hub;
  R.hub = (t, f) => {
    hub0(t, f);
    try {
      const body = $('hub-body'), card = body && body.querySelector('.hero-card'), s = S(); if (!card || !s || (!novice() && !mine().length)) return;   // 2026-10-16 修正：升段以後手上的跑腿還要能繳交（原本整個框不見，跑腿卡著）
      const el = document.createElement('div'); el.className = 'ft-box er-box'; el.innerHTML = box(); card.after(el);
      const again = () => { R.save(); R.hub(t, f); };
      el.querySelectorAll('[data-ertake]').forEach(b => { b.onclick = () => { if (mine().length >= MAX || mine().some(q => q.eid === b.dataset.ertake)) return; const q = { eid: b.dataset.ertake, step: 0, day0: s.day || 0 }; mine().push(q); wp(q); R.sfx && R.sfx('click'); R.toast && R.toast('接下跑腿：' + byId(q.eid).name + '。第一站：' + byId(q.eid).steps[0].txt, '#E8C04A'); again(); }; });
      el.querySelectorAll('[data-erwp]').forEach(b => { b.onclick = () => { const q = mine().find(x => x.eid === b.dataset.erwp); if (!q) return; const st = byId(q.eid).steps[q.step]; if (st.city) R.toast && R.toast('到東鶴站的售票口搭電車去' + st.txt + '。', '#E8C04A'); else { wp(q); R.toast && R.toast('標好了：' + st.txt, '#E8C04A'); } }; });
      el.querySelectorAll('[data-erdrop]').forEach(b => { b.onclick = () => { s.errands = mine().filter(q => q.eid !== b.dataset.erdrop); const w = s.ckWaypoint || s.waypoint; if (w && /^跑腿：/.test(w.name || '') && R.clearWaypoint) R.clearWaypoint(); again(); }; });
      el.querySelectorAll('[data-erin]').forEach(b => { b.onclick = () => { const q = mine().find(x => x.eid === b.dataset.erin); const g = q ? turnIn(q) : 0; if (g) { today().push(q.eid); R.sfx && R.sfx('coin'); R.toast && R.toast('繳交了跑腿（+' + g + ' 費拉）。成績明天以後登錄到勇者證。', '#E8C04A'); } again(); }; });
    } catch (err) { console.warn('[errands]', err); }
  };
  const css = document.createElement('style');
  css.textContent = '.er-row .row{margin-top:4px;gap:6px}.er-steps{display:flex;flex-wrap:wrap;gap:2px 6px;font-size:12px;margin-top:3px;opacity:.9}.er-steps i{opacity:.5;font-style:normal}.er-st.ok{color:#8FD08A}.er-st.now{color:#E8C04A;font-weight:bold}'
    + '.ql-go{cursor:pointer;padding:6px 8px;margin:4px 0;border:1px solid #3E3550;border-radius:6px;background:#1E1A26;display:flex;flex-wrap:wrap;gap:4px;align-items:center}.ql-go:hover,.ql-go:focus{border-color:#C9A13A;background:#262030;outline:none}.ql-go:active{background:#2E2638}.ql-arrow{margin-left:auto;color:#E8C04A;font-size:12px;white-space:nowrap}';
  document.head.appendChild(css);
  // 城裡的「手上的委託」也列出跑腿（2026-10-13 修正：以前只看私人委託，接了跑腿／遺跡委託還是寫「沒有私人委託」）
  const ql0 = R.questLog;
  if (ql0) R.questLog = (...a) => {
    const r = ql0(...a);
    try {
      const qs = (S() && S().errands) || [], sh = $('r-sheet');
      if (qs.length && sh) {
        const d = document.createElement('div'); d.className = 'ql-errands';
        d.innerHTML = '<h3>初心跑腿（' + qs.length + '／' + MAX + '）</h3>' + qs.map(q => { const e = byId(q.eid); if (!e) return ''; const st = e.steps[q.step];
          return '<p class="ql-go" role="button" tabindex="0" data-erguide="' + esc(q.eid) + '" title="點一下：在地圖上指路"><b>F 級・' + esc(e.name) + '</b>：' + (q.done || !st ? '都跑完了，回公會分館繳交（' + total(e) + ' 費拉）' : '第 ' + (q.step + 1) + '／' + e.steps.length + ' 站・下一站：' + esc(st.txt)) + '<span class="ql-arrow">指路 ➜</span></p>'; }).join('');
        d.querySelectorAll('[data-erguide]').forEach(p => { const go = () => { if (R.errandGuide(p.dataset.erguide)) { R.sfx && R.sfx('click'); R.closeSheet && R.closeSheet(); setTimeout(() => { if (!(R.sheetOpen && R.sheetOpen()) && R.bigMap) R.bigMap(); }, 80); } }; p.onclick = go; p.onkeydown = ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); go(); } }; });
        const after = sh.querySelector('h2'); const ref = sh.querySelector('.ql-priv') || sh.querySelector('.row:last-child');
        if (ref && ref.parentNode) ref.parentNode.insertBefore(d, ref); else if (after) after.after(d); else sh.appendChild(d);
      }
    } catch (err) { console.warn('[errands]', err); }
    return r;
  };
})(window.R);
