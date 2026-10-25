// 各城自己的玩法（2026-10-26 作者：各城都只是換皮——公會分館、設施、委託全都一樣）
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
  const buyP = (city, g) => Math.round(price(city, g) * 1.06 * (1 - repLv(city) * 0.02));
  const sellP = (city, g) => Math.round(price(city, g) * 0.94 * (1 + repLv(city) * 0.02));
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
    R.sheet('<h2>各城的貨物行情</h2><p class="note">今天的價錢。買只能在出產的城，賣哪裡都可以——在需要它的城最好。</p><table class="ct-t"><tr><th>貨物</th><th>出產（買）</th><th>收得最貴的城（賣）</th></tr>'
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
    R.sheet('<p class="kicker">南瀧・外貿公司</p><h2>外貿訂單</h2><p>「外國船下週要來。誰能把貨湊齊送到，我們照單付錢——比自己拿去賣好賺。」</p>'
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
  R.CITY_ACT.zhengyuan = R.CITY_FAC['zhengyuan:house'];
  R.CITY_ACT.nanlong = R.CITY_FAC['nanlong:cargo'];

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
    { k: 'zy_boat', name: '試航', desc: '有一艘自己的船（船屋買的），開出港跑一圈給造船廠的師傅看。', pay: 120, need: () => [C2().boat ? 1 : 0, 1], take: () => { } }
  ]);
  const css = document.createElement('style');
  css.textContent = '.ct-t{width:100%;border-collapse:collapse;font-size:13px;margin:6px 0}.ct-t td,.ct-t th{padding:4px 6px;border-bottom:1px solid rgba(255,255,255,.08);text-align:left}.ct-t td small{opacity:.7}.ct-t .btn{padding:2px 8px;margin:1px}.ct-o{justify-content:space-between;gap:8px;border-bottom:1px solid rgba(255,255,255,.08);padding:4px 0}.ct-ul{margin:4px 0;padding-left:18px}'
    + '.cq{border-left:3px solid #3E9A5A;padding:4px 0 6px 10px;margin:6px 0}.cq.done{opacity:.55}.cq>b{font-size:14px}.cq>small{float:right;color:var(--gold,#C9A13A)}.cq p{margin:3px 0}';
  document.head.appendChild(css);
})(window.R);
