// 海邊的城（2026-10-26 作者：各城不要換皮）
// - 渦旗：出海釣魚（真的釣：等浮標沉下去、拉線，張力條別拉斷）。船越大（征遠的船屋）出得越遠、魚越大；秋天銀旗魚順著渦流下來。
//   海魚市集：每天的魚價不一樣，把魚賣掉；壽司「渦潮」：拿自己釣的魚請師傅捏，比一般小吃強的加成。
// - 西見：水下訓練營的潛水打撈（真的潛：左右上下游、氧氣、會漂的舊水雷——會戰時被轟炸封鎖留下的）。
//   撈到的沉船古物裝進貨箱（citylife.js 的貨物，南瀧、皇嶺收得貴），貝殼、魔力水晶、寶箱的費拉直接拿。船越大潛得越深。
// 放在 citylife.js 後面。
(function (R) {
  const S = () => R.S, esc = s => R.esc(s), $ = id => document.getElementById(id), rnd = Math.random;
  const C2 = () => R.city2(), ok = (t, c) => { R.sfx && R.sfx('coin'); R.toast(t, c || '#E8C04A'); };
  const autumn = () => !!(R.dateOf && R.dateOf(S().day || 0).season === '秋');   // calendar.js 的季節
  const pay = n => { const s = S(); if (s.gold < n) { R.toast('錢不夠（要 ' + n + ' 費拉）。', '#FF9A6A'); return false; } s.gold -= n; return true; };

  // ================= 渦旗：釣魚 =================
  // [名字, 價錢, 力氣（拉的難度）, 最小船, 權重, 秋天才有]
  const FISH = {
    aji: ['竹筴魚', 12, 0.5, 0, 10], saba: ['鯖魚', 18, 0.7, 0, 8], tai: ['真鯛', 45, 1.0, 0, 4], tako: ['章魚', 30, 1.2, 0, 3],
    kajiki: ['銀旗魚', 160, 1.9, 1, 6, 1], buri: ['鰤魚', 70, 1.4, 1, 4], katsuo: ['鰹魚', 60, 1.3, 1, 4],
    maguro: ['藍鰭鮪', 320, 2.4, 2, 2], shiira: ['鬼頭刀', 90, 1.6, 2, 3], uzu: ['渦流王', 900, 3.2, 3, 0.6, 1]
  };
  R.CITY_FISH = FISH;
  const box = () => { const c = C2(); c.fish = c.fish || {}; return c.fish; };
  const fishPrice = k => { const d = S().day || 1, f = 0.75 + 0.5 * Math.abs(Math.sin(d * 12.9898 + k.length * 78.233)); return Math.round(FISH[k][1] * f * (1 + R.cityRepLv('woqi') * 0.02)); };
  const pickFish = () => {
    const b = R.cityBoat(), aut = autumn(), L = Object.keys(FISH).filter(k => FISH[k][3] <= b && (!FISH[k][5] || aut || k === 'uzu' && b >= 3));
    let t = L.reduce((s, k) => s + FISH[k][4] * (k === 'kajiki' && aut ? 2 : 1), 0), r = rnd() * t;
    for (const k of L) { r -= FISH[k][4] * (k === 'kajiki' && aut ? 2 : 1); if (r <= 0) return k; } return L[0];
  };
  const fishing = city => {
    const s = S(), BAIT = 15, b = R.cityBoat();
    R.sheet('<p class="kicker">渦旗漁港' + (b ? '・' + esc(R.CITY_BOATS[b][0]) : '・防波堤') + '</p><h2>出海釣魚</h2><p class="note">' + (autumn() ? '秋天：銀旗魚順著渦流下來了！' : '銀旗魚要秋天才多。') + (b ? '' : '沒有船只能在防波堤釣小魚（征遠的船屋買船）。') + '一趟 5 竿，魚餌 ' + BAIT + ' 費拉。</p>'
      + '<canvas id="fs-cv" width="360" height="240" class="fs-cv"></canvas><p class="note" id="fs-msg">按「拋竿」。浮標沉下去的時候馬上按「拉」；拉的時候按住：張力條到紅色會斷線，放開讓魚游一下。</p>',
      '<div class="row"><button type="button" class="btn pri" id="fs-go">拋竿</button><button type="button" class="btn" id="fs-reel">按住拉（空白鍵）</button><button type="button" class="btn" id="fs-x">回港</button></div>');
    const cv = $('fs-cv'), x = cv.getContext('2d'), msg = t => { const m = $('fs-msg'); if (m) m.textContent = t; };
    let paid = false, casts = 5, st = 'idle', t = 0, wait = 0, fish = null, ten = 0, dist = 1, hold = false, raf = 0, last = performance.now(), got = [], slack = 0;
    const draw = () => {
      x.fillStyle = '#7AB8D8'; x.fillRect(0, 0, 360, 80); x.fillStyle = '#1E5A7A'; x.fillRect(0, 80, 360, 160);
      for (let i = 0; i < 6; i++) { x.strokeStyle = 'rgba(255,255,255,.18)'; x.beginPath(); x.arc(180 + Math.sin(t * 0.7 + i) * 90, 150 + i * 14, 30 + i * 8, Math.PI * 0.1 + t * 0.3, Math.PI * 0.6 + t * 0.3); x.stroke(); }   // 渦流
      x.fillStyle = '#5A3A22'; x.fillRect(0, 60, 70, 24); x.strokeStyle = '#EEE'; x.beginPath(); x.moveTo(60, 40); x.lineTo(150 + dist * 120, st === 'bite' || st === 'fight' ? 92 : 86); x.stroke();
      const by = st === 'bite' ? 94 + Math.sin(t * 40) * 3 : st === 'fight' ? 92 : 84 + Math.sin(t * 3) * 1.5; x.fillStyle = '#E83A3A'; x.beginPath(); x.arc(150 + dist * 120, by, 5, 0, 7); x.fill();
      if (st === 'fight') { x.fillStyle = 'rgba(0,0,0,.4)'; x.fillRect(20, 210, 320, 14); x.fillStyle = ten > 0.8 ? '#FF4A3A' : ten > 0.55 ? '#E8C04A' : '#5AD87A'; x.fillRect(20, 210, 320 * Math.min(1, ten), 14); x.fillStyle = '#FFF'; x.font = '12px sans-serif'; x.fillText('張力', 22, 205); x.fillText('距離 ' + Math.round(dist * 100) + 'm', 280, 205); }
      if (st === 'bite') { x.fillStyle = '#FFE04A'; x.font = 'bold 28px sans-serif'; x.fillText('！', 140 + dist * 120, 70); }
      x.fillStyle = '#FFF'; x.font = '12px sans-serif'; x.fillText('剩 ' + casts + ' 竿　釣到 ' + got.length + ' 條', 8, 16);
    };
    const step = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      if (!$('fs-cv')) { cancelAnimationFrame(raf); off(); return; }
      if (st === 'wait') { wait -= dt; if (wait <= 0) { st = 'bite'; wait = 0.9; R.sfx && R.sfx('pick'); msg('咬了！快按「拉」！'); } }
      else if (st === 'bite') { wait -= dt; if (wait <= 0) { st = 'idle'; msg('……魚跑了。再拋一次。'); end(); } }
      else if (st === 'fight') {
        const F = FISH[fish], surge = Math.sin(t * (2 + F[2])) > 0.92 ? F[2] * 0.9 : 0;
        if (hold) { ten += dt * (0.4 + F[2] * 0.25 + surge); dist -= dt * 0.25 / Math.sqrt(F[2]); } else { ten -= dt * 0.9; dist += dt * 0.02 * F[2]; }   // 大魚：一拉一放大約 20 秒
        ten = Math.max(0, ten); dist = Math.min(1.2, dist);
        slack = ten < 0.05 ? slack + dt : 0;
        if (ten >= 1) { st = 'idle'; msg('啪——線斷了。是' + F[0] + '……'); R.sfx && R.sfx('hurt'); end(); }
        else if (slack > 2.5) { st = 'idle'; msg('線鬆太久，' + F[0] + '跑掉了。'); end(); }
        else if (dist <= 0) { st = 'idle'; got.push(fish); box()[fish] = (box()[fish] || 0) + 1; const lg = C2().fishLog = C2().fishLog || {}; lg[fish] = (lg[fish] || 0) + 1; R.save(); msg('釣到' + F[0] + '！（市價約 ' + fishPrice(fish) + ' 費拉）'); R.sfx && R.sfx(F[1] >= 150 ? 'chest' : 'coin'); end(); }
      }
      draw(); raf = requestAnimationFrame(step);
    };
    const end = () => { dist = 1; ten = 0; if (casts <= 0) { msg((got.length ? '今天釣到：' + got.map(k => FISH[k][0]).join('、') + '。拿去魚市集賣、或到壽司店請師傅捏。' : '今天沒釣到。') + '（回港再出一趟要再買魚餌）'); $('fs-go').disabled = true; if (got.length) R.cityRep('woqi', 1); } };
    $('fs-go').onclick = () => { if (st !== 'idle' || casts <= 0) return; if (!paid) { if (!pay(BAIT)) return; paid = true; R.save(); } casts--; st = 'wait'; wait = 1 + rnd() * 3.5; fish = pickFish(); msg('浮標在渦流裡晃……'); };
    const pull = on => { hold = on; if (on && st === 'bite') { st = 'fight'; ten = 0.2; msg('拉！按住收線，張力太高就放開。'); } };
    const rb = $('fs-reel'); rb.onpointerdown = () => pull(true); rb.onpointerup = rb.onpointerleave = () => pull(false);
    const kd = e => { if (e.code === 'Space') { e.preventDefault(); e.stopPropagation(); pull(true); } }, ku = e => { if (e.code === 'Space') { e.stopPropagation(); pull(false); } };
    const off = () => { removeEventListener('keydown', kd, true); removeEventListener('keyup', ku, true); };
    addEventListener('keydown', kd, true); addEventListener('keyup', ku, true);
    $('fs-x').onclick = () => { cancelAnimationFrame(raf); off(); R.closeSheet(); };
    raf = requestAnimationFrame(step);
  };
  R.CITY_ACT.woqi = fishing;
  R.CITY_FAC['woqi:port'] = fishing;
  // 海魚市集
  const market = city => {
    const s = S(), B = box(), ks = Object.keys(B).filter(k => B[k] > 0);
    R.sheet('<p class="kicker">渦旗・海魚市集</p><h2>海魚市集</h2><p>「今天的行情寫在黑板上！自己釣的也收！」</p><table class="ct-t"><tr><th>魚</th><th>今天的價錢</th><th>你有</th><th></th></tr>'
      + Object.keys(FISH).map(k => '<tr><td>' + esc(FISH[k][0]) + (FISH[k][5] ? '<small>　秋</small>' : '') + '</td><td>' + fishPrice(k) + '</td><td>' + (B[k] || 0) + '</td><td>' + (B[k] ? '<button type="button" class="btn" data-fm="' + k + '">全賣</button>' : '') + '</td></tr>').join('') + '</table>',
      '<div class="row">' + (ks.length ? '<button type="button" class="btn" id="fm-all">全部賣掉</button>' : '') + '<button type="button" class="btn pri" id="fm-x">好了</button></div>');
    $('fm-x').onclick = R.closeSheet;
    const sell = k => { const n = B[k] || 0; if (!n) return 0; const g = fishPrice(k) * n; s.gold += g; delete B[k]; return g; };
    document.querySelectorAll('[data-fm]').forEach(b => { b.onclick = () => { const g = sell(b.dataset.fm); R.save(); ok('賣了 ' + g + ' 費拉。'); market(city); }; });
    if ($('fm-all')) $('fm-all').onclick = () => { const g = ks.reduce((a, k) => a + sell(k), 0); R.save(); ok('全部賣了：+' + g + ' 費拉。'); market(city); };
  };
  R.CITY_FAC['woqi:market'] = market;
  // 壽司「渦潮」：拿自己的魚捏
  const sushi = city => {
    const s = S(), B = box(), ks = Object.keys(B).filter(k => B[k] > 0);
    R.sheet('<p class="kicker">渦旗・壽司「渦潮」</p><h2>壽司・渦潮</h2><p>「自己釣的魚？拿來，我捏給你。捏工 20 費拉。」（吃了今天下遺跡有加成，魚越好加越多）</p>'
      + (ks.length ? ks.map(k => { const v = FISH[k][1], b = Math.min(0.14, 0.02 + v / 3000); return '<button type="button" class="btn" data-su="' + k + '"' + (s.gold < 20 ? ' disabled' : '') + '><b>' + esc(FISH[k][0]) + '握壽司</b><br><small>生命、魔力 +' + Math.round(b * 100) + '%' + (v >= 150 ? '、傷害 +' + Math.round(b * 60) + '%' : '') + '</small></button>'; }).join('') : '<p>你身上沒有魚。去漁港釣幾條再來。</p>'),
      '<div class="row"><button type="button" class="btn pri" id="su-x">好了</button></div>');
    $('su-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-su]').forEach(b => { b.onclick = () => { const k = b.dataset.su; if (!B[k] || !pay(20)) return; B[k]--; const v = FISH[k][1], bb = Math.min(0.14, 0.02 + v / 3000), buf = { hp: bb, mp: bb }; if (v >= 150) buf.dmg = bb * 0.6; s.buff = { kind: 'food', b: buf, until: s.day }; R.ateFood && R.ateFood(s.buff); R.save(); ok('「' + FISH[k][0] + '，今天最好的一貫。」'); R.closeSheet(); }; });
  };
  R.CITY_FAC['woqi:sushi'] = sushi;
  R.CITY_FAC['woqi:hall'] = city => R.cityQuestSheet(city);
  // 魚拓：每一種釣到過的魚（漁業會館、渦旗分館的牆上）
  R.woqiPrints = () => { const lg = C2().fishLog || {}, ks = Object.keys(FISH); R.townTalk('魚拓牆', [ks.filter(k => lg[k]).length + '／' + ks.length + ' 種'].concat(ks.map(k => lg[k] ? '【' + FISH[k][0] + '】釣到 ' + lg[k] + ' 條' : '【？？？】' + (FISH[k][3] ? '（要' + R.CITY_BOATS[FISH[k][3]][0] + '以上的船）' : '') + (FISH[k][5] ? '（秋天）' : '')))); };
  // 物流倉庫：貨箱放不下的貨寄在這裡（寄放不限量；每箱每天 1 費拉，領的時候一起算）
  R.CITY_FAC['woqi:logi'] = city => {
    const s = S(), c = C2(), W2 = c.depot = c.depot || {}, G = R.CITY_GOODS, day = s.day || 0, fee = Object.values(W2).reduce((a, d) => a + d.n * Math.max(0, day - d.d), 0);
    const load = Object.values(c.cargo).reduce((a, n) => a + n, 0), cap = 10 + R.CITY_BOATS[c.boat][2];
    R.sheet('<p class="kicker">渦旗・物流倉庫</p><h2>物流倉庫</h2><p>「放不下的貨寄在這裡。一箱一天 1 費拉，領的時候一起算。」貨箱 ' + load + '／' + cap + '</p><table class="ct-t"><tr><th>貨物</th><th>貨箱裡</th><th>寄放的</th><th></th></tr>'
      + Object.keys(G).filter(g => c.cargo[g] || (W2[g] && W2[g].n)).map(g => '<tr><td>' + esc(G[g][0]) + '</td><td>' + (c.cargo[g] || 0) + '</td><td>' + ((W2[g] && W2[g].n) || 0) + '</td><td>' + (c.cargo[g] ? '<button type="button" class="btn" data-dp="' + g + '">寄放</button>' : '') + (W2[g] && W2[g].n ? '<button type="button" class="btn" data-dg="' + g + '">領回</button>' : '') + '</td></tr>').join('') + '</table>'
      + (fee ? '<p class="note">目前的寄放費 ' + fee + ' 費拉（領回的時候付）。</p>' : ''),
      '<div class="row"><button type="button" class="btn pri" id="dp-x">好了</button></div>');
    $('dp-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-dp]').forEach(b => { b.onclick = () => { const g = b.dataset.dp, n = c.cargo[g]; const d = W2[g] || { n: 0, d: day }; d.n += n; d.d = day; W2[g] = d; delete c.cargo[g]; R.save(); R.CITY_FAC['woqi:logi'](city); }; });
    document.querySelectorAll('[data-dg]').forEach(b => { b.onclick = () => { const g = b.dataset.dg, d = W2[g], room = cap - load, n = Math.min(d.n, room), f = d.n * Math.max(0, day - d.d); if (n <= 0) { R.toast('貨箱滿了。', '#FF9A6A'); return; } if (s.gold < f) { R.toast('寄放費 ' + f + ' 費拉，錢不夠。', '#FF9A6A'); return; } s.gold -= f; d.n -= n; d.d = day; c.cargo[g] = (c.cargo[g] || 0) + n; if (!d.n) delete W2[g]; R.save(); ok('領回 ' + n + ' 箱' + G[g][0] + (f ? '（寄放費 ' + f + '）' : '')); R.CITY_FAC['woqi:logi'](city); }; });
  };
  // 華爾納外貿協會：每天收一種魚，價錢是市集的 1.6 倍（法蘭克漁業公司要的）
  R.CITY_FAC['woqi:trade'] = city => {
    const s = S(), c = C2(), B = box(), day = s.day || 0, ks = Object.keys(FISH).filter(k => FISH[k][1] >= 30);
    if (c.wantDay !== day) { c.wantDay = day; c.want = ks[Math.floor(rnd() * ks.length)]; c.wantN = 2 + Math.floor(rnd() * 3); c.wantDone = 0; R.save(); }
    const k = c.want, p = Math.round(fishPrice(k) * 1.6), have = B[k] || 0;
    R.sheet('<p class="kicker">渦旗・華爾納外貿協會</p><h2>華爾納外貿協會</h2><p>「法蘭克漁業公司今天要' + esc(FISH[k][0]) + '，' + c.wantN + ' 條。一條 ' + p + ' 費拉——市集的一倍六。」</p><p class="note">你有 ' + have + ' 條' + esc(FISH[k][0]) + '。' + (c.wantDone ? '今天已經交過了。' : '') + '</p>',
      '<div class="row"><button type="button" class="btn pri" id="wt-ok"' + (c.wantDone || have < c.wantN ? ' disabled' : '') + '>交 ' + c.wantN + ' 條（' + p * c.wantN + ' 費拉）</button><button type="button" class="btn" id="wt-x">好了</button></div>');
    $('wt-x').onclick = R.closeSheet;
    $('wt-ok').onclick = () => { if (c.wantDone || (B[k] || 0) < c.wantN) return; B[k] -= c.wantN; c.wantDone = 1; s.gold += p * c.wantN; R.cityRep('woqi', 2); R.save(); ok('交貨：+' + p * c.wantN + ' 費拉（渦旗的聲望 +2）'); R.closeSheet(); };
  };
  R.cityQuestReg('woqi', [
    { k: 'wq_kajiki', name: '漁業會館：秋汛的第一條', desc: '會館要一條銀旗魚供在神龕（秋天才釣得到）。', pay: 300, need: () => [box().kajiki || 0, 1], take: () => { box().kajiki--; } },
    { k: 'wq_aji', name: '物流倉庫的便當', desc: '倉庫工人的午餐，要 3 條竹筴魚。', pay: 70, need: () => [box().aji || 0, 3], take: () => { box().aji -= 3; } },
    { k: 'wq_tai', name: '華爾納外貿協會的宴會', desc: '協會招待外國客人，要 2 條真鯛。', pay: 150, need: () => [box().tai || 0, 2], take: () => { box().tai -= 2; } },
    R.cqCargo('wq_elec', 'electro', 3, 300, '魚市的冷凍庫', '市集的冷凍庫壞了，要 3 箱日下森電器。'),
    R.cqCargo('wq_spice', 'spice', 3, 220, '壽司店的醬', '師傅要試新的醬，要 3 箱德克斯凡香料。')
  ]);

  // ================= 西見：潛水打撈 =================
  const diving = city => {
    const s = S(), FEE = 18, b = R.cityBoat(), maxD = [0.45, 0.65, 0.85, 1][b];
    R.sheet('<p class="kicker">西見海洋大學・水下訓練營</p><h2>潛水打撈</h2><p class="note">會戰的時候西見港被轟炸封鎖，港外沉了很多船——也還漂著舊水雷。' + (b ? '' : '沒有自己的船只能從岸邊下水（征遠的船屋買船潛得更深）。') + '裝備租借 ' + FEE + ' 費拉。</p>'
      + '<canvas id="dv-cv" width="360" height="420" class="fs-cv"></canvas><p class="note" id="dv-msg">WASD／方向鍵游（手機按下面的鍵）。碰到東西就撈起來；氧氣用完會被拉上去、撈到的掉一半。游回水面就上岸。</p>',
      '<div class="row dv-pad"><button type="button" class="btn" data-dv="l">←</button><button type="button" class="btn" data-dv="u">↑</button><button type="button" class="btn" data-dv="d">↓</button><button type="button" class="btn" data-dv="r">→</button><button type="button" class="btn" id="dv-x">放棄</button></div>');
    if (!pay(FEE)) { R.closeSheet(); return; }
    R.save();
    const cv = $('dv-cv'), x = cv.getContext('2d'), Wd = 360, Ht = 420, top = 30, floorY = top + (Ht - top - 10) * maxD;
    const msg = t => { const m = $('dv-msg'); if (m) m.textContent = t; };
    const P = { x: 180, y: top + 4 }, key = {}, bag = [], cc = C2(); let defused = 0;
    let o2 = 30, t = 0, raf = 0, last = performance.now(), done = false, stun = 0;
    const items = [], mines = [];
    const kinds = d => d < 0.35 ? ['shell', 'shell', 'gold'] : d < 0.6 ? ['shell', 'gold', 'salvage', 'crystal'] : ['salvage', 'salvage', 'crystal', 'chest', 'gold'];
    for (let i = 0; i < 14; i++) { const y = top + 30 + rnd() * (floorY - top - 40), d = (y - top) / (Ht - top), k = kinds(d)[Math.floor(rnd() * kinds(d).length)]; items.push({ x: 20 + rnd() * 320, y, k }); }
    for (let i = 0; i < 3 + b * 2; i++) mines.push({ x: 30 + rnd() * 300, y: top + 60 + rnd() * (floorY - top - 70), ph: rnd() * 6 });
    const LOOT = { shell: ['貝殼（甲殼）', '#E8DCC8'], gold: ['錢袋', '#E8C04A'], salvage: ['沉船古物', '#C88A4A'], crystal: ['魔力水晶', '#8AD8FF'], chest: ['沉船的寶箱', '#FFB83A'] };
    const finish = (lost) => {
      if (done) return; done = true; cancelAnimationFrame(raf); off();
      const keep = lost ? bag.filter((_, i) => i % 2 === 0) : bag, c = C2(); let g = 0, sv = 0, sh = 0, cr = 0, over = 0;
      keep.forEach(k => { if (k === 'gold') g += 20 + Math.floor(rnd() * 40); else if (k === 'chest') g += 80 + Math.floor(rnd() * 160); else if (k === 'shell') sh++; else if (k === 'crystal') cr++; else if (k === 'salvage') { if (Object.values(c.cargo).reduce((a, n) => a + n, 0) < 10 + R.CITY_BOATS[c.boat][2]) { c.cargo.salvage = (c.cargo.salvage || 0) + 1; sv++; } else { over++; g += 40; } } });
      if (defused) { g += defused * 35; c.mines = (c.mines || 0) + defused; R.cityRep('xijian', defused); }   // 掃雷的賞金
      const ph = PHOTOS.findIndex((_, i) => !(c.photos || []).includes(i)); let gotPhoto = '';
      if (ph >= 0 && keep.some(k => k === 'salvage' || k === 'chest') && rnd() < 0.3) { c.photos = (c.photos || []).concat(ph); gotPhoto = '。沉船裡夾著一張泛黃的舊照片（拿去艾美利亞領事館問問）'; }
      s.gold += g; s.mats = s.mats || {}; if (sh) s.mats.shell = (s.mats.shell || 0) + sh; if (cr) s.mats.crystal = (s.mats.crystal || 0) + cr;
      if (keep.length) { R.cityRep('xijian', 1); c.diveDay = s.day; } R.save();
      msg((lost ? '氧氣用完，被拉上去了——撈到的掉了一半。' : '上岸了。') + (keep.length ? '費拉 +' + g + (sh ? '、甲殼 ' + sh : '') + (cr ? '、魔力水晶 ' + cr : '') + (sv ? '、沉船古物 ' + sv + ' 箱（裝進貨箱）' : '') + (over ? '（貨箱滿了，' + over + ' 件古物當場賣給大學）' : '') : '什麼也沒撈到。') + (defused ? '　拆了 ' + defused + ' 顆水雷，港務局的賞金已經算進去。' : '') + gotPhoto);
      $('dv-x').textContent = '好了'; ok(lost ? '被拉上岸了' : '打撈結束', lost ? '#FF9A6A' : undefined);
    };
    const step = now => {
      const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
      if (!$('dv-cv')) { cancelAnimationFrame(raf); off(); return; }
      if (!done) {
        const sp = stun > 0 ? 30 : 90; stun -= dt;
        P.x += ((key.r ? 1 : 0) - (key.l ? 1 : 0)) * sp * dt; P.y += ((key.d ? 1 : 0) - (key.u ? 1 : 0)) * sp * dt + 6 * dt;
        P.x = Math.max(8, Math.min(Wd - 8, P.x)); P.y = Math.max(top, Math.min(floorY - 6, P.y));
        o2 -= dt * (1 + (P.y - top) / (Ht - top) * 0.6);
        items.forEach(it => { if (!it.got && Math.hypot(it.x - P.x, it.y - P.y) < 13) { it.got = 1; bag.push(it.k); R.sfx && R.sfx('pick'); msg('撈到' + LOOT[it.k][0] + '！'); } });
        mines.forEach(m => { if (m.off) return; m.x += Math.sin(t * 0.6 + m.ph) * 8 * dt; if (!m.boom && Math.hypot(m.x - P.x, m.y - (P.y)) < 15) { if ((cc.defuse || 0) > 0) { cc.defuse--; m.off = 1; defused++; R.sfx && R.sfx('pick'); msg('用港務局的工具拆掉一顆舊水雷（剩 ' + cc.defuse + ' 次）。'); return; } m.boom = 0.6; o2 -= 8; stun = 1.2; R.sfx && R.sfx('hurt'); R.shake && R.shake(0.3); msg('碰到舊水雷！氧氣漏了一大截。'); } if (m.boom) m.boom -= dt; });   // 港務局的掃雷工具：碰到就拆掉
        if (o2 <= 0) finish(true); else if (P.y <= top + 1 && t > 1.5 && (bag.length || t > 3)) finish(false);
      }
      // 畫
      const g = x.createLinearGradient(0, top, 0, Ht); g.addColorStop(0, '#2A7AA8'); g.addColorStop(1, '#061A2E'); x.fillStyle = g; x.fillRect(0, 0, Wd, Ht);
      x.fillStyle = '#9AC8E0'; x.fillRect(0, 0, Wd, top); x.fillStyle = '#3A2A1A'; x.fillRect(0, floorY, Wd, Ht - floorY);
      if (maxD < 1) { x.fillStyle = 'rgba(0,0,0,.55)'; x.fillRect(0, floorY, Wd, Ht - floorY); x.fillStyle = '#AAA'; x.font = '11px sans-serif'; x.fillText('（更深的地方要有船才潛得到）', 90, floorY + 18); }
      x.fillStyle = '#4A3A2E'; for (let i = 0; i < 3; i++) { const wx = 60 + i * 110, wy = floorY - 18; x.fillRect(wx, wy, 50, 18); x.fillRect(wx + 30, wy - 16, 6, 16); }   // 沉船
      items.forEach(it => { if (it.got) return; x.fillStyle = LOOT[it.k][1]; x.beginPath(); x.arc(it.x, it.y, it.k === 'chest' ? 7 : 5, 0, 7); x.fill(); });
      mines.forEach(m => { x.fillStyle = m.boom > 0 ? '#FF6A3A' : '#2A2A2A'; x.beginPath(); x.arc(m.x, m.y, 8, 0, 7); x.fill(); x.strokeStyle = '#555'; for (let a = 0; a < 6; a++) { x.beginPath(); x.moveTo(m.x, m.y); x.lineTo(m.x + Math.cos(a) * 12, m.y + Math.sin(a) * 12); x.stroke(); } x.strokeStyle = '#333'; x.beginPath(); x.moveTo(m.x, m.y + 8); x.lineTo(m.x, floorY); x.stroke(); });
      x.fillStyle = stun > 0 ? '#FF9A6A' : '#FFD24A'; x.beginPath(); x.ellipse(P.x, P.y, 7, 10, 0, 0, 7); x.fill(); x.fillStyle = '#7AD8FF'; x.fillRect(P.x - 4, P.y - 7, 8, 4);
      x.fillStyle = 'rgba(0,0,0,.5)'; x.fillRect(8, 6, 150, 12); x.fillStyle = o2 > 10 ? '#7AD8FF' : '#FF5A3A'; x.fillRect(8, 6, 150 * Math.max(0, o2) / 30, 12); x.fillStyle = '#FFF'; x.font = '11px sans-serif'; x.fillText('氧氣', 162, 16); x.fillText('撈到 ' + bag.length + ' 件　深度 ' + Math.round((P.y - top) / 3) + 'm', 210, 16);
      raf = requestAnimationFrame(step);
    };
    const map = { ArrowLeft: 'l', KeyA: 'l', ArrowRight: 'r', KeyD: 'r', ArrowUp: 'u', KeyW: 'u', ArrowDown: 'd', KeyS: 'd' };
    const kd = e => { if (map[e.code]) { key[map[e.code]] = 1; e.preventDefault(); e.stopPropagation(); } }, ku = e => { if (map[e.code]) { key[map[e.code]] = 0; e.stopPropagation(); } };
    const off = () => { removeEventListener('keydown', kd, true); removeEventListener('keyup', ku, true); };
    addEventListener('keydown', kd, true); addEventListener('keyup', ku, true);
    document.querySelectorAll('[data-dv]').forEach(b => { const k = b.dataset.dv; b.onpointerdown = () => { key[k] = 1; }; b.onpointerup = b.onpointerleave = () => { key[k] = 0; }; });
    $('dv-x').onclick = () => { if (!done) finish(true); cancelAnimationFrame(raf); off(); R.closeSheet(); };
    raf = requestAnimationFrame(step);
  };
  R.CITY_ACT.xijian = diving;
  // 港務局：掃雷委託（拆彈工具三次份；潛水的時候碰到舊水雷就拆掉，一顆 35 費拉）
  R.CITY_FAC['xijian:port'] = city => {
    const s = S(), c = C2();
    R.sheet('<p class="kicker">西見港・港務局</p><h2>掃雷委託</h2><p>「會戰的時候艾美利亞在港外佈了幾百顆水雷。七十年了，還沒清完。」港務局出租拆彈工具（三次份 40 費拉）：潛水的時候碰到舊水雷就是拆掉，一顆賞金 35 費拉。</p><p class="note">你的工具還剩 ' + (c.defuse || 0) + ' 次・已經拆了 ' + (c.mines || 0) + ' 顆。</p>',
      '<div class="row"><button type="button" class="btn pri" id="pt-kit"' + (s.gold < 40 ? ' disabled' : '') + '>租拆彈工具（40）</button><button type="button" class="btn" id="pt-x">好了</button></div>');
    $('pt-x').onclick = R.closeSheet;
    $('pt-kit').onclick = () => { if (!pay(40)) return; c.defuse = (c.defuse || 0) + 3; R.save(); ok('拆彈工具 +3 次。到海洋大學的水下訓練營下水。'); R.CITY_FAC['xijian:port'](city); };
  };
  // 沉船裡的舊照片：拿到艾美利亞領事館，一張一張問出會戰時候的事
  const PHOTOS = [
    ['燈塔', '港口的紅白燈塔，還沒被炸之前。', '「這座燈塔……第一天就倒了。我們的轟炸機把它當成目標。」領事看了很久。'],
    ['最後一班', '一艘貨船的船員合照，背面寫著「殖民地航線・最後一班」。', '「船名對得上。它在封鎖線外面被擊沉，船員……大部分沒有回來。」'],
    ['天空', '一排魔導轟炸機飛過港口上空。拍照的人手在抖。', '「那是我們的第七轟炸團。」領事把照片翻過去，沒有再看。'],
    ['小船', '封鎖期間，漁民在半夜偷偷划小船出海。', '「封鎖的時候，西見的人靠這種小船活下來。我們的巡邏艇……有時候假裝沒看到。」'],
    ['飛行員', '一個艾美利亞飛行員坐在漁港，旁邊圍著西見的小孩。', '「他是我的祖父。墜機以後被西見的漁民救起來。這張照片，我們家只聽說過，沒見過。」領事的聲音變了。'],
    ['第一艘船', '戰後第一艘進港的貨船，碼頭上擠滿了人。', '「這是和平以後的第一艘。照片裡每個人都在笑。」']
  ];
  R.CITY_FAC['xijian:consul'] = city => {
    const s = S(), c = C2(), have = c.photos || [], told = c.photoTold || [];
    const fresh = have.filter(i => !told.includes(i));
    R.sheet('<p class="kicker">西見・艾美利亞領事館</p><h2>領事館</h2><p>「轟炸西見的是我們。現在我們在這裡蓋領事館——很奇怪，對吧。如果你在沉船裡找到當年的照片，請拿來給我看。」</p>'
      + (have.length ? have.map(i => '<div class="cq' + (told.includes(i) ? '' : ' xjp-new') + '"><b>舊照片「' + PHOTOS[i][0] + '」</b><p>' + PHOTOS[i][1] + '</p>' + (told.includes(i) ? '<p class="note">' + PHOTOS[i][2] + '</p>' : '') + '</div>').join('') : '<p class="note">你還沒有舊照片。潛水打撈的時候，沉船裡的古物、寶箱有時候夾著照片。</p>')
      + '<p class="note">' + have.length + '／' + PHOTOS.length + ' 張</p>',
      '<div class="row">' + (fresh.length ? '<button type="button" class="btn pri" id="cs-show">把新的照片給領事看（' + fresh.length + '）</button>' : '') + '<button type="button" class="btn" id="cs-x">好了</button></div>');
    $('cs-x').onclick = R.closeSheet;
    if ($('cs-show')) $('cs-show').onclick = () => { c.photoTold = told.concat(fresh); const g = fresh.length * 100; s.gold += g; R.cityRep('xijian', fresh.length * 2); const all = c.photoTold.length >= PHOTOS.length; if (all) { s.mats = s.mats || {}; s.mats.crystal = (s.mats.crystal || 0) + 5; } R.save(); R.townTalk('艾美利亞領事館', fresh.map(i => PHOTOS[i][2]).concat(['「謝謝你。這是領事館的一點心意。」（+' + g + ' 費拉）'], all ? ['「六張都齊了。我想把它們掛在大廳——兩個國家的人都看得到的地方。」（魔力水晶 ×5）'] : [])); };
  };
  // 海灘公園：退潮的時候撿東西（一天一次）
  R.CITY_FAC['xijian:beach'] = city => {
    const s = S(), c = C2();
    if (c.beachDay === s.day) { R.townTalk('海灘公園', ['今天已經撿過了。潮水要明天才會再帶東西上來。']); return; }
    c.beachDay = s.day; const sh = 1 + Math.floor(rnd() * 3), g = Math.floor(rnd() * 25); s.mats = s.mats || {}; s.mats.shell = (s.mats.shell || 0) + sh; s.gold += g;
    const bottle = rnd() < 0.15; if (bottle) s.gold += 60; R.save(); R.sfx && R.sfx('pick');
    R.townTalk('海灘公園', ['退潮了。沙灘上散著貝殼和被沖上來的東西。', '撿到甲殼 ×' + sh + (g ? '、' + g + ' 費拉的零錢' : '') + '。'].concat(bottle ? ['還有一個漂流瓶：「給撿到的人——拿去買杯咖啡吧。」裡面塞著 60 費拉。'] : []));
  };
  R.CITY_FAC['xijian:uni'] = diving;
  // 漁港拍賣場：西見也收魚（價錢比渦旗低一點）
  R.CITY_FAC['xijian:fish'] = city => { const B = box(), ks = Object.keys(B).filter(k => B[k] > 0); if (!ks.length) { R.townTalk('漁港拍賣場', ['「沒有魚？渦旗那邊的人比較會釣。」']); return; } const g = ks.reduce((a, k) => a + Math.round(fishPrice(k) * 0.85) * B[k], 0); R.sheet('<p class="kicker">西見・漁港拍賣場</p><h2>拍賣場</h2><p>「全部收，' + g + ' 費拉。渦旗的行情比較好就是了。」</p>', '<div class="row"><button type="button" class="btn pri" id="fx-ok">賣</button><button type="button" class="btn" id="fx-no">算了</button></div>'); $('fx-no').onclick = R.closeSheet; $('fx-ok').onclick = () => { ks.forEach(k => delete B[k]); S().gold += g; R.save(); ok('+' + g + ' 費拉'); R.closeSheet(); }; };
  R.cityQuestReg('xijian', [
    R.cqCargo('xj_salv', 'salvage', 2, 260, '海洋大學的研究', '大學要研究會戰時沉船的魔導機關，交 2 箱沉船古物。'),
    R.cqMat('xj_shell', 'shell', 6, 120, '海灘公園的步道', '公園要用貝殼鋪步道，交 6 個甲殼。'),
    R.cqCargo('xj_med', 'medicine', 3, 290, '艾美利亞領事館的醫務室', '領事館的醫務室缺藥，交 3 箱英尼爾斯藥品。'),
    R.cqCargo('xj_ration', 'ration', 4, 170, '軍艦停靠處的補給', '軍艦補給，交 4 箱軍用口糧。'),
    { k: 'xj_mine', name: '港務局：清一顆水雷', desc: '用港務局的拆彈工具，在潛水的時候拆掉一顆舊水雷。', pay: 80, need: () => [(C2().mines || 0) > (C2().minesQ || 0) ? 1 : 0, 1], take: () => { C2().minesQ = C2().mines; } },
    { k: 'xj_dive', name: '水下訓練營的教練', desc: '今天去水下訓練營潛一次水，至少撈起一件東西。', pay: 90, need: () => [C2().diveDay === S().day ? 1 : 0, 1], take: () => { } }
  ]);
  const css = document.createElement('style');
  css.textContent = '.fs-cv{display:block;width:min(360px,100%);margin:6px auto;border:3px solid #2A4A5A;border-radius:8px;image-rendering:auto}.dv-pad .btn{min-width:3em}';
  document.head.appendChild(css);
})(window.R);
