// 各城自己的玩法（2026-10-26 作者：各城都只是換皮──公會分館、設施、委託全都一樣）
// 這個檔是共用的底：
// - 地方委託：每座城有自己的委託（R.cityQuests[城] 登記；要真的交出東西或做到一件事才算完成，做完加這座城的聲望）。
//   聲望每 5 點一級（最多 5 級）：這座城買賣貨物的價錢好 2%／級、委託報酬多 5%／級。
// - 貨物：各城出產的東西在出產地便宜、在需要它的城貴（每天的行情不一樣）。車站大廳的「貨運窗口」買賣；貨箱 10 箱，船屋的船再加。
// - 南瀧・外貿公司：每天三張外貿訂單（把幾箱貨送到某座城，期限內交貨拿報酬）。
// - 征遠・船屋：買自己的船（貨箱變多；渦旗出海釣大魚、西見潛得更深都看船，citysea.js）。
// 放在 azukicities.js、cityhelp.js 後面，citysea.js、cityland.js 前面。
(function (R) {
  const S = () => R.S, esc = s => R.esc(s), $ = id => document.getElementById(id);
  const C2 = () => { const s = S(); s.city2 = s.city2 || {}; const c = s.city2; c.cargo = c.cargo || {}; c.rep = c.rep || {}; c.qday = c.qday || {}; c.qpick = c.qpick || {}; c.qdone = c.qdone || {}; c.orders = c.orders || []; c.boat = c.boat || 0; return c; };
  R.city2 = C2;
  const cityName = id => { const c = R.azuki && R.azuki.byId(id); return c ? c.name : id; };
  const hsh = (a, b, c) => { let x = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791); x = Math.imul(x ^ (x >>> 13), 1274126177); return ((x ^ (x >>> 16)) >>> 0) / 4294967296; };
  const sid = s => { let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) | 0; return Math.abs(h); };
  const ok = (t, c) => { R.sfx && R.sfx('coin'); R.toast(t, c || '#E8C04A'); };

  // ---------- 聲望 ----------
  const repLv = id => Math.min(5, Math.floor((C2().rep[id] || 0) / 5));
  R.cityRep = (id, n) => { const c = C2(); c.rep[id] = (c.rep[id] || 0) + (n || 1); };
  R.cityRepLv = repLv;

  // ---------- 貨物 ----------
  // [名字, 基本價, 出產的城, 需要的城]
  const GOODS = {
    steel: ['征遠鋼材', 60, 'zhengyuan', ['jishan', 'futing', 'bannan']],
    timber: ['古森木材', 45, 'gusen', ['zhengyuan', 'bannan', 'nanlong']],
    tea: ['古森茶', 30, 'gusen', ['huangling', 'nanlong', 'banbei']],
    fishdry: ['銀旗魚乾', 35, 'woqi', ['yuebei', 'futing', 'gusen']],
    medicine: ['英尼爾斯藥品', 70, 'banbei', ['futing', 'xijian', 'gusen']],
    salvage: ['沉船古物', 90, 'xijian', ['nanlong', 'huangling', 'banbei']],
    electro: ['日下森電器', 80, 'bannan', ['woqi', 'gusen', 'zhengyuan']],
    spice: ['德克斯凡香料', 55, 'nanlong', ['yuebei', 'woqi', 'banbei']],
    ration: ['軍用口糧', 25, 'futing', ['xijian', 'zhengyuan', 'woqi']]
  };
  R.CITY_GOODS = GOODS;
  const BOATS = [['沒有船', 0, 0], ['小漁船「海鷗號」', 800, 10], ['貨船「征遠丸」', 3000, 25], ['快速汽船「武聖二號」', 8000, 45]];
  R.CITY_BOATS = BOATS;
  const cap = () => 10 + BOATS[C2().boat][2];
  const load = () => Object.values(C2().cargo).reduce((a, b) => a + b, 0);
  const price = (city, g) => {
    const G = GOODS[g], day = (S().day || 1), f = 0.85 + 0.3 * hsh(day, sid(city), sid(g));
    const k = G[2] === city ? 0.7 : G[3].includes(city) ? 1.4 : 1;
    return Math.max(5, Math.round(G[1] * k * f));
  };
  const luck = () => (C2().statueDay === (S().day || 1) ? 0.05 : 0);   // 南瀧：摸過卸貨第一雕像的腳
  const buyP = (city, g) => Math.round(price(city, g) * 1.06 * (1 - repLv(city) * 0.02 - luck()));
  const sellP = (city, g) => Math.round(price(city, g) * 0.94 * (1 + repLv(city) * 0.02 + luck()));
  R.cityPrice = { buy: buyP, sell: sellP };

  R.cityTrade = (city) => {
    const id = city.id || city, s = S(), c = C2();
    const due = c.orders.filter(o => o.mine && o.to === id && !o.done && (c.cargo[o.g] || 0) >= o.n);
    const row = g => {
      const G = GOODS[g], have = c.cargo[g] || 0, mine = G[2] === id, want = G[3].includes(id);
      return '<tr><td><b>' + esc(G[0]) + '</b><small>' + (mine ? '　這裡出產' : want ? '　這裡需要' : '') + '</small></td><td>' + (mine ? buyP(id, g) : '－') + '</td><td>' + sellP(id, g) + '</td><td>' + have + '</td><td>'
        + (mine ? '<button type="button" class="btn" data-cb="' + g + '"' + (s.gold < buyP(id, g) || load() >= cap() ? ' disabled' : '') + '>買 1</button><button type="button" class="btn" data-cb5="' + g + '"' + (s.gold < buyP(id, g) * 5 || load() + 5 > cap() ? ' disabled' : '') + '>買 5</button>' : '')
        + (have ? '<button type="button" class="btn" data-cs="' + g + '">賣 1</button><button type="button" class="btn" data-csa="' + g + '">全賣</button>' : '') + '</td></tr>';
    };
    const list = Object.keys(GOODS).filter(g => GOODS[g][2] === id || c.cargo[g]);
    R.sheet('<p class="kicker">' + esc(cityName(id)) + '・車站</p><h2>貨運窗口</h2><p class="note">貨箱 ' + load() + '／' + cap() + '（征遠的船屋可以買船加貨箱）・費拉 ' + s.gold + '・這座城的聲望 ' + repLv(id) + ' 級（買賣價錢好 ' + repLv(id) * 2 + '%）</p>'
      + (list.length ? '<table class="ct-t"><tr><th>貨物</th><th>買</th><th>賣</th><th>你有</th><th></th></tr>' + list.map(row).join('') + '</table>' : '<p>這座城沒有出產能運的貨。</p>')
      + (due.length ? '<h3>外貿訂單：可以交貨</h3>' + due.map(o => '<div class="row"><span>' + o.n + ' 箱' + esc(GOODS[o.g][0]) + ' → 報酬 ' + o.pay + ' 費拉</span><button type="button" class="btn pri" data-co="' + o.k + '">交貨</button></div>').join('') : '')
      + '<p class="note">每種貨在出產的城便宜、在需要它的城收得貴；每天的價錢會變。</p>',
      '<div class="row"><button type="button" class="btn" id="ct-guide">全部的行情</button><button type="button" class="btn pri" id="ct-x">好了</button></div>');
    $('ct-x').onclick = R.closeSheet;
    $('ct-guide').onclick = () => guide(id);
    const again = () => { R.save(); R.cityTrade(id); };
    document.querySelectorAll('[data-cb],[data-cb5]').forEach(b => { b.onclick = () => { const g = b.dataset.cb || b.dataset.cb5, n = b.dataset.cb5 ? 5 : 1, p = buyP(id, g) * n; if (s.gold < p || load() + n > cap()) return; s.gold -= p; c.cargo[g] = (c.cargo[g] || 0) + n; R.sfx && R.sfx('coin'); again(); }; });
    document.querySelectorAll('[data-cs],[data-csa]').forEach(b => { b.onclick = () => { const g = b.dataset.cs || b.dataset.csa, n = b.dataset.csa ? c.cargo[g] : 1; s.gold += sellP(id, g) * n; c.cargo[g] -= n; if (!c.cargo[g]) delete c.cargo[g]; ok('賣了 ' + n + ' 箱' + GOODS[g][0] + '，+' + sellP(id, g) * n + ' 費拉。'); again(); }; });
    document.querySelectorAll('[data-co]').forEach(b => { b.onclick = () => { const o = c.orders.find(x => x.k === b.dataset.co); if (!o || (c.cargo[o.g] || 0) < o.n) return; c.cargo[o.g] -= o.n; if (!c.cargo[o.g]) delete c.cargo[o.g]; o.done = true; s.gold += o.pay; R.cityRep('nanlong', 2); R.cityRep(id, 1); ok('外貿訂單交貨：+' + o.pay + ' 費拉（南瀧的聲望 +2）'); again(); }; });
  };
  const guide = id => {
    R.sheet('<h2>各城的貨物行情</h2><p class="note">今天的價錢。買只能在出產的城，賣哪裡都可以──在需要它的城最好。</p><table class="ct-t"><tr><th>貨物</th><th>出產（買）</th><th>收得最貴的城（賣）</th></tr>'
      + Object.keys(GOODS).map(g => { const G = GOODS[g], best = G[3].map(cc => [cc, sellP(cc, g)]).sort((a, b) => b[1] - a[1])[0]; return '<tr><td>' + esc(G[0]) + '</td><td>' + esc(cityName(G[2])) + ' ' + buyP(G[2], g) + '</td><td>' + esc(cityName(best[0])) + ' ' + best[1] + '</td></tr>'; }).join('') + '</table>',
      '<div class="row"><button type="button" class="btn pri" id="ct-b">回貨運窗口</button></div>');
    $('ct-b').onclick = () => R.cityTrade(id);
  };

  // ---------- 南瀧・外貿公司：訂單 ----------
  const orders = () => {
    const c = C2(), day = S().day || 1;
    c.orders = c.orders.filter(o => !o.done && o.until >= day);
    if (c.orderDay !== day) {
      c.orderDay = day; const keys = Object.keys(GOODS);
      for (let i = c.orders.length; i < 3; i++) { const g = keys[Math.floor(Math.random() * keys.length)], G = GOODS[g], to = G[3][Math.floor(Math.random() * G[3].length)], n = 3 + Math.floor(Math.random() * 6), d = 3 + Math.floor(Math.random() * 4); c.orders.push({ k: day + '_' + i + '_' + g, g, to, n, until: day + d, pay: Math.round(G[1] * n * (0.9 + Math.random() * 0.5)) }); }
    }
    return c.orders;
  };
  R.CITY_FAC['nanlong:cargo'] = city => {
    const L = orders(), day = S().day || 1, c = C2();
    R.sheet('<p class="kicker">南瀧・外貿公司</p><h2>外貿訂單</h2><p>「外國船下週要來。誰能把貨湊齊送到，我們照單付錢──比自己拿去賣好賺。」</p>'
      + L.map(o => '<div class="row ct-o"><span><b>' + o.n + ' 箱' + esc(GOODS[o.g][0]) + '</b> 送到 <b>' + esc(cityName(o.to)) + '</b>（' + esc(cityName(GOODS[o.g][2])) + '出產）・期限還有 ' + (o.until - day) + ' 天・報酬 <b>' + o.pay + '</b> 費拉</span>' + (o.mine ? '<small>已接</small>' : '<button type="button" class="btn" data-oo="' + o.k + '">接</button>') + '</div>').join('')
      + '<p class="note">接了以後，把貨運到目的地，在那座城車站的貨運窗口交貨。你的貨箱 ' + load() + '／' + cap() + '。</p>',
      '<div class="row"><button type="button" class="btn pri" id="ct-x">好了</button></div>');
    $('ct-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-oo]').forEach(b => { b.onclick = () => { const o = c.orders.find(x => x.k === b.dataset.oo); if (o) { o.mine = true; R.save(); ok('接下訂單：' + o.n + ' 箱' + GOODS[o.g][0] + ' → ' + cityName(o.to)); R.CITY_FAC['nanlong:cargo'](city); } }; });
  };

  // ---------- 征遠・船屋 ----------
  R.CITY_FAC['zhengyuan:house'] = city => {
    const s = S(), c = C2(), next = BOATS[c.boat + 1];
    R.sheet('<p class="kicker">征遠・船屋區</p><h2>船屋「老錨」</h2><p>「武聖號以前就是在對面那個船塢下水的。要買船？征遠的船是全國最好的。」</p>'
      + '<p>你的船：<b>' + esc(BOATS[c.boat][0]) + '</b>（貨箱 ' + cap() + '）</p>'
      + '<ul class="ct-ul"><li>貨箱變多：貨物一次運得多。</li><li>渦旗出海：船越大，越能出到深海釣大魚。</li><li>西見潛水：船越大，越能潛到深處的沉船。</li></ul>'
      + (next ? '<p>下一艘：<b>' + esc(next[0]) + '</b>　' + next[1] + ' 費拉（貨箱 +' + next[2] + '）' + (c.boat >= 1 ? '（舊船折價收回）' : '') + '</p>' : '<p>已經是最好的船了。</p>'),
      '<div class="row">' + (next ? '<button type="button" class="btn pri" id="ct-boat"' + (s.gold < next[1] - BOATS[c.boat][1] / 2 ? ' disabled' : '') + '>買下（' + (next[1] - Math.round(BOATS[c.boat][1] / 2)) + ' 費拉）</button>' : '') + '<button type="button" class="btn" id="ct-x">好了</button></div>');
    $('ct-x').onclick = R.closeSheet;
    if ($('ct-boat')) $('ct-boat').onclick = () => { const p = next[1] - Math.round(BOATS[c.boat][1] / 2); if (s.gold < p) return; s.gold -= p; c.boat++; R.cityRep('zhengyuan', 3); R.save(); R.sfx && R.sfx('levelup'); R.banner && R.banner('船屋「老錨」', '買下了' + BOATS[c.boat][0]); R.CITY_FAC['zhengyuan:house'](city); };
  };
  R.cityBoat = () => C2().boat;
  R.CITY_FAC['zhengyuan:yard'] = R.CITY_FAC['zhengyuan:house'];   // 造船廠：船也是在這裡下水的
  // 鋼鐵廠：鐵礦三份煉成一箱征遠鋼材（加工費 10）
  R.CITY_FAC['zhengyuan:steel'] = city => {
    const s = S(), c = C2(), M = s.mats = s.mats || {}, have = M.iron || 0, load = Object.values(c.cargo).reduce((a, n) => a + n, 0), n = Math.min(Math.floor(have / 3), cap() - load, Math.floor(s.gold / 10));
    R.sheet('<p class="kicker">征遠・鋼鐵廠</p><h2>鋼鐵廠</h2><p>「遺跡裡挖的鐵礦也收。三份煉一箱，加工費 10。」爐子的熱氣隔著玻璃都感覺得到。</p><p class="note">你有鐵礦 ' + have + '・貨箱 ' + load + '／' + cap() + '</p>',
      '<div class="row"><button type="button" class="btn pri" id="sl-1"' + (n >= 1 ? '' : ' disabled') + '>煉一箱</button><button type="button" class="btn" id="sl-a"' + (n >= 2 ? '' : ' disabled') + '>能煉的全煉（' + n + ' 箱）</button><button type="button" class="btn" id="sl-x">好了</button></div>');
    $('sl-x').onclick = R.closeSheet;
    const go = k => { if (k < 1) return; M.iron -= k * 3; s.gold -= k * 10; c.cargo.steel = (c.cargo.steel || 0) + k; R.cityRep('zhengyuan', 1); R.save(); ok('煉出 ' + k + ' 箱征遠鋼材。'); R.CITY_FAC['zhengyuan:steel'](city); };
    $('sl-1').onclick = () => go(Math.min(1, n)); $('sl-a').onclick = () => go(n);
  };
  // 舊艦遺址：武聖號的姊妹艦「武德號」擱在岸邊，公會的監看站在旁邊；找得到艦上的銘牌就送去博物館
  R.CITY_FAC['zhengyuan:wreck'] = city => {
    const s = S(), c = C2();
    if (c.plate && !c.plateGiven) { R.townTalk('舊艦遺址・監看站', ['「銘牌找到了？送去軍艦博物館吧，館長找了好多年。」']); return; }
    if (c.wreckDay === s.day) { R.townTalk('舊艦遺址・監看站', ['退潮的時間過了。明天再來找。']); return; }
    c.wreckDay = s.day; const found = !c.plate && Math.random() < 0.34; if (found) c.plate = 1; const iron = c.plate && !found ? 1 + Math.floor(Math.random() * 3) : 0; if (iron) { s.mats = s.mats || {}; s.mats.iron = (s.mats.iron || 0) + iron; } R.save(); R.sfx && R.sfx('pick');
    R.townTalk('舊艦遺址・監看站', ['武聖號的姊妹艦「武德號」，會戰的最後一年擱淺在這裡。艦體已經被遺跡的魔力侵蝕了一半。', '公會的監看員讓你趁退潮在外圍找找看。'].concat(found ? ['在砲塔的殘骸底下，摸到一塊刻著「武德」的銅銘牌！（拿去軍艦博物館）'] : iron ? ['撿了一些還能用的艦體鐵片。（鐵礦 +' + iron + '，鋼鐵廠收）'] : ['只找到生鏽的鉚釘。（一天能找一次）']));
  };
  // 軍艦博物館：武聖號的展覽；看完回答館長三個問題，答對有獎（一天一次）；把武德號的銘牌捐出來
  const QUIZ = [
    ['武聖號以前是什麼船？', ['昭旭最大的戰列艦', '殖民地航線的貨船', '漁業公司的捕鯨船'], 0],
    ['會戰以後，征遠的造船廠主要造什麼？', ['新的戰列艦', '商業、民用的船', '只修不造'], 1],
    ['擱淺在征遠岸邊的舊艦叫什麼？', ['武德號', '武聖二號', '海鷗號'], 0],
    ['征遠在昭旭的哪個方位？', ['東南', '西北', '正南'], 1]
  ];
  R.CITY_FAC['zhengyuan:museum'] = city => {
    const s = S(), c = C2();
    R.sheet('<p class="kicker">征遠・軍艦博物館</p><h2>軍艦博物館</h2><p>大廳正中間是武聖號的模型，比人還高。說明牌：「昭旭最大的戰列艦。第二次大陸會戰之後，征遠只造商船與民用船──但仍是全國最大的造船廠。」</p>'
      + '<p class="note">' + (c.plateGiven ? '大廳角落多了一塊銅銘牌：「武德號（由勇者捐贈）」。' : '館長說：「武聖號的姊妹艦武德號還擱在岸邊。要是有人能把它的銘牌帶回來……」') + '</p>',
      '<div class="row">' + (c.plate && !c.plateGiven ? '<button type="button" class="btn pri" id="mu-plate">把武德號的銘牌交給館長</button>' : '') + '<button type="button" class="btn" id="mu-q"' + (c.quizDay === s.day ? ' disabled' : '') + '>館長的問題（一天一次）</button><button type="button" class="btn" id="mu-x">好了</button></div>');
    $('mu-x').onclick = R.closeSheet;
    if ($('mu-plate')) $('mu-plate').onclick = () => { c.plateGiven = 1; s.gold += 500; R.cityRep('zhengyuan', 5); R.save(); R.townTalk('軍艦博物館・館長', ['館長的手在抖。「……真的是武德號的。我父親是這艘船上的機關兵。」', '「這塊銘牌會掛在大廳。謝謝你。」（+500 費拉，征遠的聲望 +5）']); };
    $('mu-q').onclick = () => {
      const q = QUIZ[Math.floor(Math.random() * QUIZ.length)];
      R.sheet('<p class="kicker">軍艦博物館・館長</p><h2>館長的問題</h2><p>「' + esc(q[0]) + '」</p>', '<div class="row">' + q[1].map((a, i) => '<button type="button" class="btn" data-mq="' + i + '">' + esc(a) + '</button>').join('') + '</div>');
      document.querySelectorAll('[data-mq]').forEach(b => { b.onclick = () => { c.quizDay = s.day; const okA = +b.dataset.mq === q[2]; if (okA) { s.gold += 50; R.cityRep('zhengyuan', 1); } R.save(); R.townTalk('軍艦博物館・館長', okA ? ['「對。你有認真看說明牌。」（+50 費拉）'] : ['「不對。答案是「' + q[1][q[2]] + '」。明天再來。」']); }; });
    };
  };
  // 海軍訓練所：操艇（指針在綠區的時候划；十槳，越準越快）
  R.CITY_FAC['zhengyuan:train'] = city => {
    const s = S(), c = C2();
    R.sheet('<p class="kicker">征遠・海軍訓練所</p><h2>操艇訓練</h2><p class="note">教官喊口令。指針走到綠色的地方按「划」（空白鍵），一共十槳；越準船越快。報名 12 費拉。</p><canvas id="rw-cv" width="360" height="120" class="fs-cv"></canvas><p class="note" id="rw-msg">按「開始」。</p>',
      '<div class="row"><button type="button" class="btn pri" id="rw-go">開始（12 費拉）</button><button type="button" class="btn" id="rw-p">划（空白鍵）</button><button type="button" class="btn" id="rw-x">離開</button></div>');
    const cv = $('rw-cv'), x = cv.getContext('2d'), msg = t => { const m = $('rw-msg'); if (m) m.textContent = t; };
    let on = false, t = 0, k = 0, n = 0, good = 0, raf = 0, last = 0, flash = 0;
    const zone = () => [0.42 - n * 0.006, 0.58 + n * -0.006];
    const draw = () => { x.fillStyle = '#1E4A6A'; x.fillRect(0, 0, 360, 120); x.fillStyle = '#333'; x.fillRect(20, 50, 320, 20); const [a, b] = zone(); x.fillStyle = '#5AD87A'; x.fillRect(20 + a * 320, 50, (b - a) * 320, 20); x.fillStyle = flash > 0 ? '#FFE04A' : '#FFF'; x.fillRect(20 + k * 320 - 2, 44, 4, 32); x.fillStyle = '#FFF'; x.font = '12px sans-serif'; x.fillText('第 ' + n + '／10 槳　準 ' + good, 8, 16); };
    const loop = now => { const dt = Math.min(0.05, (now - last) / 1000); last = now; if (!$('rw-cv')) { off(); return; } if (on) { t += dt; k = (Math.sin(t * (2.4 + n * 0.25)) + 1) / 2; flash -= dt; } draw(); raf = requestAnimationFrame(loop); };
    const stroke = () => { if (!on) return; const [a, b] = zone(), hit = k >= a && k <= b; if (hit) { good++; flash = 0.2; R.sfx && R.sfx('pick'); } n++; if (n >= 10) { on = false; const rk = good >= 9 ? 'S' : good >= 7 ? 'A' : good >= 5 ? 'B' : 'C'; if (rk === 'S' || rk === 'A') { c.rowDay = s.day; s.buff = { kind: 'food', b: { hp: 0.04, skillCd: 0.04 }, until: s.day }; R.ateFood && R.ateFood(s.buff); R.cityRep('zhengyuan', 1); } R.save(); msg('划完了：準 ' + good + '／10，評價 ' + rk + (rk === 'S' || rk === 'A' ? '。教官點頭。（今天下遺跡：生命、技能冷卻稍好）' : '。教官：「再來。」')); $('rw-go').disabled = false; } };
    const kd = e => { if (e.code === 'Space') { e.preventDefault(); e.stopPropagation(); if (!e.repeat) stroke(); } };
    const off = () => { cancelAnimationFrame(raf); removeEventListener('keydown', kd, true); };
    addEventListener('keydown', kd, true);
    $('rw-p').onclick = stroke;
    $('rw-go').onclick = () => { if (on || s.gold < 12) return; s.gold -= 12; R.save(); on = true; t = 0; n = 0; good = 0; $('rw-go').disabled = true; msg('一、二！'); };
    $('rw-x').onclick = () => { off(); R.closeSheet(); };
    last = performance.now(); raf = requestAnimationFrame(loop);
  };
  R.CITY_ACT.zhengyuan = R.CITY_FAC['zhengyuan:house'];
  R.CITY_FAC['nanlong:yard'] = R.CITY_FAC['zhengyuan:house'];   // 南瀧的造船廠也接征遠船屋的訂單
  R.CITY_FAC['nanlong:consul'] = city => R.CITY_FAC['nanlong:cargo'](city);   // 德克斯凡領事館：外貿訂單
  R.CITY_FAC['zhengyuan:harbor'] = city => R.cityTrade(city);
  R.CITY_ACT.nanlong = R.CITY_FAC['nanlong:cargo'];

  // ---------- 世界中央銀行：各城的分館都是同一個戶頭（bank.js） ----------
  ['huangling', 'jishan', 'nanlong', 'banbei'].forEach(id => { R.CITY_FAC[id + ':bank'] = city => R.bankSheet && R.bankSheet(city.name + '分館'); });

  // ---------- 南瀧 ----------
  // 卸貨第一雕像：摸一下搬運工的腳，今天買賣貨物價錢好 5%
  R.CITY_FAC['nanlong:statue'] = city => {
    const s = S(), c = C2();
    if (c.statueDay === s.day) { R.townTalk('卸貨第一雕像', ['雕像的腳被摸得發亮。你今天已經摸過了。']); return; }
    c.statueDay = s.day; R.save(); R.sfx && R.sfx('pick');
    R.townTalk('卸貨第一雕像', ['扛著貨箱的搬運工銅像。腳尖被幾十年來的人摸得發亮。', '傳說摸了他的腳，今天做生意就順。', '（今天在各城的貨運窗口買賣，價錢好 5%。）']);
  };
  // 湍遊國際大學：魔力學院的公開課（三天一次，經驗書 ×1）、聖教學院的晚禱（理智回復）
  R.CITY_FAC['nanlong:uni'] = city => {
    const s = S(), c = C2(), next = (c.lecture || -9) + 3;
    R.sheet('<p class="kicker">南瀧・湍遊國際大學</p><h2>湍遊國際大學</h2><p>附設魔力學院分院和聖教學院。外國留學生比本地學生多。</p>',
      '<div class="row"><button type="button" class="btn pri" id="un-l"' + (s.day < next || s.gold < 60 ? ' disabled' : '') + '>魔力學院的公開課（60 費拉・經驗書 ×1' + (s.day < next ? '・第 ' + next + ' 天再開' : '') + '）</button><button type="button" class="btn" id="un-p"' + (c.prayDay === s.day ? ' disabled' : '') + '>聖教學院的晚禱（理智回復）</button><button type="button" class="btn" id="un-x">好了</button></div>');
    $('un-x').onclick = R.closeSheet;
    $('un-l').onclick = () => { if (s.day < next || s.gold < 60) return; s.gold -= 60; c.lecture = s.day; s.xpBooks = (s.xpBooks || 0) + 1; R.cityRep('nanlong', 1); R.save(); R.townTalk('魔力學院・公開課', ['教授在黑板上畫魔力迴路。「遺跡裡的魔力，是從地底往上滲的──」', '你抄了滿滿三頁。（經驗書 +1）']); };
    $('un-p').onclick = () => { if (c.prayDay === s.day) return; c.prayDay = s.day; if (R.sanAdd) R.sanAdd(10); R.save(); R.townTalk('聖教學院・晚禱', ['燭光、管風琴、聽不懂的外國話。', '心裡安靜了一點。（理智回復）']); };
  };
  // 商業區拱廊：德克斯凡的舶來品店（每天換三件飾品）
  R.CITY_FAC['nanlong:mall'] = city => {
    const s = S(), c = C2(), lv = Math.max(1, ((s.classes || {})[s.cls] || {}).lv || 1);
    if (c.mallDay !== s.day || !c.mall) { const pool = Object.keys(R.ACC || {}); c.mallDay = s.day; c.mall = pool.length ? [0, 1, 2].map(() => { const r = Math.random() < 0.25 ? 3 : 2; return { base: pool[Math.floor(Math.random() * pool.length)], r, p: r === 3 ? 900 : 300 }; }) : []; R.save(); }
    const nm = o => { const a = R.ACC[o.base]; return (o.r === 3 ? '【史詩】' : '【稀有】') + (a ? a.name : o.base); };
    R.sheet('<p class="kicker">南瀧・商業區拱廊</p><h2>舶來品店「海風」</h2><p>「德克斯凡的船昨天剛到。今天就這三件，明天又換。」</p>'
      + (c.mall.length ? c.mall.map((o, i) => '<button type="button" class="btn" data-ml="' + i + '"' + (o.sold || s.gold < o.p ? ' disabled' : '') + '><b>' + esc(nm(o)) + '</b><br><small>' + (o.sold ? '賣掉了' : o.p + ' 費拉') + '</small></button>').join('') : '<p>今天沒有貨。</p>'),
      '<div class="row"><button type="button" class="btn pri" id="ml-x">好了</button></div>');
    $('ml-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-ml]').forEach(b => { b.onclick = () => { const o = c.mall[+b.dataset.ml]; if (o.sold || s.gold < o.p) return; const it = R.makeItem({ kind: 'acc', base: o.base, ilvl: lv, rarity: o.r, identified: true }); if (!it) return; s.gold -= o.p; o.sold = 1; if (!(R.giveItem && R.giveItem(it))) s.stash.push(it); R.save(); ok('買了' + R.itemName(it) + '。'); R.CITY_FAC['nanlong:mall'](city); }; });
  };

  // ---------- 機場：有機場的城之間搭魔導飛機（當天到，票價是電車的兩倍半） ----------
  const AIR = { huangling: 'airport', xijian: 'air', banbei: 'air', bannan: 'air', yuebei: 'air' };
  const fly = city => {
    const s = S(), from = city.id, to = Object.keys(AIR).filter(k => k !== from).map(k => R.azuki.byId(k)).filter(Boolean);
    const fare = c => Math.max(60, Math.round(c.fare * 2.5));
    R.sheet('<p class="kicker">' + esc(city.name) + '・機場</p><h2>魔導飛機</h2><p>「國內線，當天就到。」比電車貴，但不用等上好幾天。費拉 ' + s.gold + '</p><div class="az-grid">'
      + to.map(c => '<button type="button" class="btn" data-fly="' + c.id + '"' + (s.gold < fare(c) ? ' disabled' : '') + '><b>' + esc(c.name) + '</b><br><small>' + fare(c) + ' 費拉・當天（電車要 ' + c.days + ' 天）</small></button>').join('') + '</div>',
      '<div class="row"><button type="button" class="btn pri" id="fly-x">不搭了</button></div>');
    $('fly-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-fly]').forEach(b => { b.onclick = () => { const c = R.azuki.byId(b.dataset.fly); R.travelAzuki(c.id, from, { fare: fare(c), days: 0, how: '魔導飛機' }); }; });
  };
  Object.keys(AIR).forEach(id => { R.CITY_FAC[id + ':' + AIR[id]] = fly; });

  // ---------- 地方委託（每座城自己的） ----------
  // R.cityQuests[城] = [{ k, name, desc, pay, need: () => [現在, 要], take: () => 交出 }]：要的東西夠了才能交
  R.cityQuests = R.cityQuests || {};
  const qsheet = city => {
    const id = city.id, L = R.cityQuests[id], c = C2(), day = S().day || 1, s = S();
    if (c.qday[id] !== day) { c.qday[id] = day; c.qpick[id] = L.map((q, i) => i).sort(() => Math.random() - 0.5).slice(0, 3).map(i => L[i].k); c.qdone[id] = []; R.save(); }
    const today = c.qpick[id].map(k => L.find(q => q.k === k)).filter(Boolean), lv = repLv(id);
    R.sheet('<p class="kicker">' + esc(city.guild || city.name) + '</p><h2>今日地方委託</h2><p class="note">這座城自己的委託：東西備齊了才能交。聲望 ' + lv + ' 級（報酬 +' + lv * 5 + '%）・' + (c.rep[id] || 0) + ' 點</p>'
      + today.map(q => { const [h, n] = q.need(), done = c.qdone[id].includes(q.k); return '<div class="cq' + (done ? ' done' : '') + '"><b>' + esc(q.name) + '</b><small>' + Math.round(q.pay * (1 + lv * 0.05)) + ' 費拉</small><p>' + esc(q.desc) + '</p><p class="note">' + (done ? '已完成' : '進度 ' + Math.min(h, n) + '／' + n) + '</p>' + (done ? '' : '<button type="button" class="btn' + (h >= n ? ' pri' : '') + '" data-cq="' + q.k + '"' + (h >= n ? '' : ' disabled') + '>交差</button>') + '</div>'; }).join(''),
      '<div class="row"><button type="button" class="btn pri" id="cq-x">好了</button></div>');
    $('cq-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-cq]').forEach(b => { b.onclick = () => { const q = L.find(x => x.k === b.dataset.cq); if (!q || q.need()[0] < q.need()[1]) return; q.take(); const p = Math.round(q.pay * (1 + lv * 0.05)); s.gold += p; c.qdone[id].push(q.k); R.cityRep(id, 1); if (R.addDeed) R.addDeed(city.name + '：完成地方委託「' + q.name + '」。'); R.save(); ok(city.name + '・委託完成：+' + p + ' 費拉（聲望 +1）'); qsheet(city); }; });
  };
  R.cityQuestSheet = qsheet;
  const reg = id => { R.CITY_QUESTS[id] = qsheet; };
  // 貨物類的委託（每座城都可以用）
  R.cqCargo = (k, g, n, pay, name, desc) => ({ k, name, desc, pay, need: () => [C2().cargo[g] || 0, n], take: () => { const c = C2(); c.cargo[g] -= n; if (!c.cargo[g]) delete c.cargo[g]; } });
  R.cqMat = (k, m, n, pay, name, desc) => ({ k, name, desc, pay, need: () => [(S().mats || {})[m] || 0, n], take: () => { S().mats[m] -= n; } });
  R.cityQuestReg = (id, list) => { R.cityQuests[id] = (R.cityQuests[id] || []).concat(list); reg(id); };
  // 南瀧、征遠
  R.cityQuestReg('nanlong', [
    R.cqCargo('nl_spice', 'tea', 4, 260, '湍遊大學的茶會', '留學生辦茶會，要 4 箱古森茶。'),
    R.cqCargo('nl_timber', 'timber', 5, 330, '商業區拱廊翻修', '拱廊的木樑要換，要 5 箱古森木材。'),
    R.cqCargo('nl_salv', 'salvage', 2, 300, '領事館的收藏', '德克斯凡領事想要兩件沉船古物擺在大廳。'),
    { k: 'nl_order', name: '外貿訂單跑一趟', desc: '完成一張外貿公司的訂單（在目的地交貨）。', pay: 150, need: () => [C2().orders.filter(o => o.done && o.until >= (S().day || 1) - 3).length ? 1 : 0, 1], take: () => { const o = C2().orders.find(x => x.done); if (o) o.until = -1; } }
  ]);
  R.cityQuestReg('zhengyuan', [
    R.cqCargo('zy_timber', 'timber', 6, 380, '船塢的龍骨', '造船廠新的商船要古森木做龍骨，6 箱。'),
    R.cqCargo('zy_elec', 'electro', 3, 330, '軍艦博物館的燈', '博物館的展示燈壞了一半，要 3 箱日下森電器。'),
    R.cqCargo('zy_ration', 'ration', 4, 160, '海軍訓練所的補給', '新兵出海訓練，要 4 箱軍用口糧。'),
    R.cqMat('zy_iron', 'iron', 6, 140, '鋼鐵廠的爐子', '鋼鐵廠缺鐵礦，交 6 份。'),
    { k: 'zy_row', name: '訓練所的助教', desc: '今天在海軍訓練所的操艇拿到 A 以上，給新兵示範。', pay: 110, need: () => [C2().rowDay === S().day ? 1 : 0, 1], take: () => { } },
    { k: 'zy_boat', name: '試航', desc: '有一艘自己的船（船屋買的），開出港跑一圈給造船廠的師傅看。', pay: 120, need: () => [C2().boat ? 1 : 0, 1], take: () => { } }
  ]);
  const css = document.createElement('style');
  css.textContent = '.ct-t{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0}.ct-t td,.ct-t th{padding:4px 6px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left}.ct-t td small{opacity:.7}.ct-t .btn{padding:2px 8px;margin:1px}.ct-o{justify-content:space-between;gap:8px;border-bottom:1px solid rgba(255,255,255,.08);padding:4px 0}.ct-ul{margin:4px 0;padding-left:18px}'
    + '.cq{border-left:3px solid #3E9A5A;padding:4px 0 6px 10px;margin:6px 0}.cq.done{opacity:.55}.cq>b{font-size:14px}.cq>small{float:right;color:var(--gold,#C9A13A)}.cq p{margin:3px 0}';
  document.head.appendChild(css);
})(window.R);
