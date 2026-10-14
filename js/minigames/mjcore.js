// 討伐令 1433：雀莊「東風」的規則引擎（2026-10-13，作者：改成像雀魂一樣、可以連線）
// 瀏覽器（mahjong2.js）和 Cloudflare Worker（server-cf/worker.js 的 MjTable）共用這一份：純邏輯、不碰畫面。
// 規則：日式立直麻將・四人東風戰（雀魂段位戰的設定）
//   25000 持點、30000 返點、順位馬 +15/+5/−5/−15、頭名拿 OKA +20；東四局莊家連莊（和了或聽牌），本場每場 300；
//   東四局結束沒人到 30000 → 進南場延長（有人到 30000 就結束，最多到南四局）；All Last 莊家第一且 ≥30000 自動結束；有人被擊飛（<0）結束。
//   赤寶牌三張（五萬、五筒、五索各一張）、表寶牌／裏寶牌／槓寶牌（槓了立刻翻）；吃碰槓（暗槓、加槓、明槓）、搶槓、嶺上開花、食替禁止。
//   立直（需門清、≥1000 點、牌山 ≥4 張）、兩立直、一發；振聽：捨牌振聽、同巡振聽、立直後振聽。雙響（兩家同時榮和）可以，三家和流局。
//   流局：聽牌的人平分 3000 罰符；九種九牌可以宣告流局。役和符照標準計算（含符數、切上滿貫不採用）、累計役滿、雙倍役滿。
// 牌：0..135，種類 id = t >> 2（0–8 萬、9–17 筒、18–26 索、27–30 東南西北、31–33 白發中）；赤牌是 t = 16、52、88。
(function (root, factory) {
  const M = factory();
  if (typeof module === 'object' && module.exports) module.exports = M;
  root.MJCore = M;
  if (root.R) root.R.MJ = M;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const NUM = ['一', '二', '三', '四', '五', '六', '七', '八', '九'], HON = ['東', '南', '西', '北', '白', '發', '中'], SUIT = ['萬', '筒', '索'], WIND = ['東', '南', '西', '北'];
  const tname = id => id < 27 ? NUM[id % 9] + SUIT[(id / 9) | 0] : HON[id - 27];
  const RED = new Set([16, 52, 88]);
  const isRed = t => RED.has(t);
  const isTerm = i => i >= 27 || i % 9 === 0 || i % 9 === 8;
  const isHonor = i => i >= 27;
  const counts = tiles => { const c = new Array(34).fill(0); tiles.forEach(t => c[t >> 2]++); return c; };
  const doraOf = i => (i < 27 ? ((i / 9) | 0) * 9 + (i % 9 + 1) % 9 : i < 31 ? 27 + (i - 27 + 1) % 4 : 31 + (i - 31 + 1) % 3);
  const START = 25000, RETURN = 30000, UMA = [15, 5, -5, -15];

  // ---------------- 向聽數 ----------------
  const suitMemo = new Map();
  const suitOpts = (arr, honor) => {
    const key = (honor ? 'h' : 's') + arr.join('');
    if (suitMemo.has(key)) return suitMemo.get(key);
    const res = new Set(), a = arr.slice(), n = a.length;
    const rec = (i, m, t, p) => {
      while (i < n && !a[i]) i++;
      if (i >= n) { res.add(m * 100 + Math.min(t, 8) * 10 + p); return; }
      if (a[i] >= 3) { a[i] -= 3; rec(i, m + 1, t, p); a[i] += 3; }
      if (!honor && i <= 6 && a[i + 1] && a[i + 2]) { a[i]--; a[i + 1]--; a[i + 2]--; rec(i, m + 1, t, p); a[i]++; a[i + 1]++; a[i + 2]++; }
      if (a[i] >= 2) { a[i] -= 2; if (!p) rec(i, m, t, 1); rec(i, m, t + 1, p); a[i] += 2; }
      if (!honor && i <= 7 && a[i + 1]) { a[i]--; a[i + 1]--; rec(i, m, t + 1, p); a[i]++; a[i + 1]++; }
      if (!honor && i <= 6 && a[i + 2]) { a[i]--; a[i + 2]--; rec(i, m, t + 1, p); a[i]++; a[i + 2]++; }
      a[i]--; rec(i, m, t, p); a[i]++;
    };
    rec(0, 0, 0, 0);
    const out = [...res].map(v => [(v / 100) | 0, ((v / 10) | 0) % 10, v % 10]);
    if (suitMemo.size > 200000) suitMemo.clear();
    suitMemo.set(key, out); return out;
  };
  const shantenN = (c, nm) => {
    nm = nm || 0; let acc = [[0, 0, 0]];
    [[0, 9, 0], [9, 18, 0], [18, 27, 0], [27, 34, 1]].forEach(([a, b, h]) => {
      const opts = suitOpts(c.slice(a, b), h), nx = new Map();
      acc.forEach(([m, t, p]) => opts.forEach(([m2, t2, p2]) => { if (p + p2 > 1) return; nx.set((m + m2) * 100 + Math.min(t + t2, 8) * 10 + p + p2, 1); }));
      acc = [...nx.keys()].map(v => [(v / 100) | 0, ((v / 10) | 0) % 10, v % 10]);
    });
    let best = 8; acc.forEach(([m, t, p]) => { const need = 4 - nm, mm = Math.min(m, need), s = 8 - 2 * (mm + nm) - Math.min(t, need - mm) - p; if (s < best) best = s; });
    return best;
  };
  const shantenC = c => { let pr = 0, kinds = 0; c.forEach(v => { if (v) kinds++; if (v >= 2) pr++; }); return 6 - pr + Math.max(0, 7 - kinds); };
  const shantenK = c => { let k = 0, pr = 0; [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33].forEach(i => { if (c[i]) k++; if (c[i] >= 2) pr = 1; }); return 13 - k - pr; };
  const shanten = (c, nm) => (nm ? shantenN(c, nm) : Math.min(shantenN(c, 0), shantenC(c), shantenK(c)));

  // ---------------- 和了形 ----------------
  const decomps = c => {
    const out = [];
    const dfs = (i, ms, pair) => {
      while (i < 34 && !c[i]) i++;
      if (i === 34) { out.push({ pair, ms: ms.slice() }); return; }
      if (c[i] >= 3) { c[i] -= 3; ms.push(['k', i]); dfs(i, ms, pair); ms.pop(); c[i] += 3; }
      if (i < 27 && i % 9 <= 6 && c[i + 1] && c[i + 2]) { c[i]--; c[i + 1]--; c[i + 2]--; ms.push(['s', i]); dfs(i, ms, pair); ms.pop(); c[i]++; c[i + 1]++; c[i + 2]++; }
    };
    for (let p = 0; p < 34; p++) if (c[p] >= 2) { c[p] -= 2; dfs(0, [], p); c[p] += 2; }
    return out;
  };
  const KOKU = [0, 8, 9, 17, 18, 26, 27, 28, 29, 30, 31, 32, 33];
  const isKokushi = c => KOKU.every(i => c[i] >= 1) && KOKU.some(i => c[i] === 2) && c.reduce((a, v) => a + v, 0) === 14;
  const isChiitoi = c => c.filter(v => v === 2).length === 7;
  const isAgari = (c, nm) => (!nm && (isChiitoi(c) || isKokushi(c))) || decomps(c.slice()).length > 0;
  const waitsOfC = (c, nm) => { const w = []; for (let k = 0; k < 34; k++) { if (c[k] >= 4) continue; c[k]++; if (isAgari(c, nm)) w.push(k); c[k]--; } return w; };

  // ---------------- 役・符・點數 ----------------
  // o: { c（34 格，含和的那張）, melds[{type:'chi'|'pon'|'minkan'|'ankan', tiles:[...]}], win（種類）, tsumo, riichi, dbl, ippatsu, haitei, houtei, rinshan, chankan,
  //      tenhou, chiihou, seatW, roundW, doraInd[], uraInd[], aka（赤牌張數）, dealer }
  const Y = (n, h) => [n, h];
  const evalWin = o => {
    const c = o.c, M = o.melds || [], menzen = M.every(m => m.type === 'ankan');
    const all = c.slice(); M.forEach(m => { const id = m.tiles[0] >> 2; all[id] += m.tiles.length; });
    const ids = []; all.forEach((v, i) => { if (v) ids.push(i); });
    const suits = new Set(ids.filter(i => i < 27).map(i => (i / 9) | 0)), honors = ids.some(isHonor);
    const allSimple = ids.every(i => !isTerm(i)), allTH = ids.every(isTerm), allHonor = ids.every(isHonor);
    const GREEN = new Set([19, 20, 21, 23, 25, 32]);
    const yh = k => (k >= 31 ? 1 : 0) + (k === 27 + o.seatW ? 1 : 0) + (k === 27 + o.roundW ? 1 : 0);
    const doraN = () => { let d = 0; (o.doraInd || []).forEach(x => { d += all[doraOf(x)]; }); return d; };
    const uraN = () => { if (!o.riichi) return 0; let d = 0; (o.uraInd || []).forEach(x => { d += all[doraOf(x)]; }); return d; };
    const situ = () => {
      const y = [];
      if (o.dbl) y.push(Y('兩立直', 2)); else if (o.riichi) y.push(Y('立直', 1));
      if (o.riichi && o.ippatsu) y.push(Y('一發', 1));
      if (o.tsumo && menzen) y.push(Y('門前清自摸和', 1));
      if (o.haitei) y.push(Y('海底摸月', 1)); if (o.houtei) y.push(Y('河底撈魚', 1));
      if (o.rinshan) y.push(Y('嶺上開花', 1)); if (o.chankan) y.push(Y('搶槓', 1));
      return y;
    };
    const ykmSitu = () => { const y = []; if (o.tenhou) y.push(Y('天和', 1)); if (o.chiihou) y.push(Y('地和', 1)); return y; };
    const cands = [];
    const finish = (yaku, fu, ykm) => {
      if (ykm.length) { const n = ykm.reduce((s, v) => s + v[1], 0); cands.push({ yaku: ykm.map(v => [v[0], v[1] > 1 ? '雙倍役滿' : '役滿']), han: 13 * n, fu, yakuman: n }); return; }
      const han = yaku.reduce((s, v) => s + v[1], 0); if (!han) return;
      const extra = [], d = doraN(), u = uraN(), a = o.aka || 0;
      if (d) extra.push(Y('寶牌', d)); if (a) extra.push(Y('赤寶牌', a)); if (u) extra.push(Y('裏寶牌', u));
      cands.push({ yaku: yaku.concat(extra), han: han + d + u + a, fu, yakuman: 0 });
    };
    // 國士無雙
    if (!M.length && isKokushi(c)) {
      const before = c.slice(); before[o.win]--; const j13 = KOKU.every(i => before[i] === 1);
      finish([], 0, ykmSitu().concat([Y(j13 ? '國士無雙十三面' : '國士無雙', j13 ? 2 : 1)]));
    }
    // 七對子
    if (!M.length && isChiitoi(c)) {
      const y = situ(); y.push(Y('七對子', 2));
      if (allSimple) y.push(Y('斷么九', 1)); if (allTH) y.push(Y('混老頭', 2));
      if (suits.size === 1 && !honors) y.push(Y('清一色', 6)); else if (suits.size <= 1 && honors && !allHonor) y.push(Y('混一色', 3));
      const ym = ykmSitu(); if (allHonor) ym.push(Y('字一色', 1));
      finish(y, 25, ym);
    }
    // 一般形
    const mGroups = M.map(m => { const ts = m.tiles.map(t => t >> 2), id = Math.min(...ts); return { kind: m.type === 'chi' ? 's' : 'k', id, open: m.type !== 'ankan', kan: m.type === 'minkan' || m.type === 'ankan' }; });
    decomps(c.slice()).forEach(d => {
      // 和的那張放在哪一組（每種放法都算一次，取點數高的）
      const places = [];
      if (d.pair === o.win) places.push({ g: -1, wait: 'tanki' });
      d.ms.forEach((g, gi) => {
        if (g[0] === 'k' && g[1] === o.win) places.push({ g: gi, wait: 'shanpon' });
        if (g[0] === 's' && o.win >= g[1] && o.win <= g[1] + 2) {
          const p = o.win - g[1], n = g[1] % 9;
          places.push({ g: gi, wait: p === 1 ? 'kanchan' : (p === 0 && n === 6) || (p === 2 && n === 0) ? 'penchan' : 'ryanmen' });
        }
      });
      const seen = new Set();
      places.forEach(pl => {
        const k = pl.wait + (pl.g >= 0 ? d.ms[pl.g].join() : 'p'); if (seen.has(k)) return; seen.add(k);
        const groups = d.ms.map((g, gi) => ({ kind: g[0], id: g[1], open: g[0] === 'k' && !o.tsumo && gi === pl.g, kan: false, closedPart: true })).concat(mGroups);
        const seqs = groups.filter(g => g.kind === 's').map(g => g.id), trips = groups.filter(g => g.kind === 'k');
        const tripIds = trips.map(g => g.id), anko = trips.filter(g => !g.open).length, kans = groups.filter(g => g.kan).length;
        const y = situ(), ym = ykmSitu();
        const pinfu = menzen && !M.length && trips.length === 0 && !yh(d.pair) && pl.wait === 'ryanmen';
        if (allSimple) y.push(Y('斷么九', 1));
        if (pinfu) y.push(Y('平和', 1));
        if (menzen) { const sc = {}; groups.filter(g => g.kind === 's' && g.closedPart).forEach(g => { sc[g.id] = (sc[g.id] || 0) + 1; }); const pk = Object.values(sc).reduce((s, v) => s + Math.floor(v / 2), 0); if (pk >= 2) y.push(Y('二盃口', 3)); else if (pk === 1) y.push(Y('一盃口', 1)); }
        tripIds.forEach(k => { if (k === 31) y.push(Y('役牌・白', 1)); if (k === 32) y.push(Y('役牌・發', 1)); if (k === 33) y.push(Y('役牌・中', 1)); if (k === 27 + o.seatW) y.push(Y('自風・' + HON[k - 27], 1)); if (k === 27 + o.roundW) y.push(Y('場風・' + HON[k - 27], 1)); });
        const grpTerm = g => g.kind === 's' ? (g.id % 9 === 0 || g.id % 9 === 6) : isTerm(g.id);
        if (seqs.length && groups.every(grpTerm) && isTerm(d.pair)) { if (honors) y.push(Y('混全帶么九', menzen ? 2 : 1)); else y.push(Y('純全帶么九', menzen ? 3 : 2)); }
        for (let s = 0; s < 3; s++) if ([0, 3, 6].every(n => seqs.includes(s * 9 + n))) y.push(Y('一氣通貫', menzen ? 2 : 1));
        for (let n = 0; n < 7; n++) if ([0, 9, 18].every(b => seqs.includes(b + n))) { y.push(Y('三色同順', menzen ? 2 : 1)); break; }
        for (let n = 0; n < 9; n++) if ([0, 9, 18].every(b => tripIds.includes(b + n))) { y.push(Y('三色同刻', 2)); break; }
        if (trips.length === 4) y.push(Y('對對和', 2));
        if (anko === 3) y.push(Y('三暗刻', 2));
        if (kans === 3) y.push(Y('三槓子', 2));
        if (allTH) y.push(Y('混老頭', 2));
        const dr = tripIds.filter(k => k >= 31).length; if (dr === 2 && d.pair >= 31) y.push(Y('小三元', 2));
        if (suits.size === 1 && !honors) y.push(Y('清一色', menzen ? 6 : 5)); else if (suits.size === 1 && honors) y.push(Y('混一色', menzen ? 3 : 2));
        // 役滿
        if (anko === 4) ym.push(Y(pl.wait === 'tanki' ? '四暗刻單騎' : '四暗刻', pl.wait === 'tanki' ? 2 : 1));
        if (dr === 3) ym.push(Y('大三元', 1));
        const wt = tripIds.filter(k => k >= 27 && k <= 30).length;
        if (wt === 4) ym.push(Y('大四喜', 2)); else if (wt === 3 && d.pair >= 27 && d.pair <= 30) ym.push(Y('小四喜', 1));
        if (allHonor) ym.push(Y('字一色', 1));
        if (ids.every(i => i < 27 && isTerm(i))) ym.push(Y('清老頭', 1));
        if (ids.every(i => GREEN.has(i))) ym.push(Y('綠一色', 1));
        if (kans === 4) ym.push(Y('四槓子', 1));
        if (menzen && !M.length && suits.size === 1 && !honors) {
          const b = [...suits][0] * 9, cc = c.slice(b, b + 9), base = [3, 1, 1, 1, 1, 1, 1, 1, 3];
          if (cc.every((v, i) => v >= base[i])) { const bf = cc.slice(); bf[o.win - b]--; const j = bf.every((v, i) => v === base[i]); ym.push(Y(j ? '純正九蓮寶燈' : '九蓮寶燈', j ? 2 : 1)); }
        }
        // 符
        let fu;
        if (pinfu) fu = o.tsumo ? 20 : 30;
        else {
          fu = 20; if (menzen && !o.tsumo) fu += 10; if (o.tsumo) fu += 2;
          groups.forEach(g => { if (g.kind !== 'k') return; let v = g.kan ? (g.open ? 8 : 16) : (g.open ? 2 : 4); if (isTerm(g.id)) v *= 2; fu += v; });
          fu += 2 * yh(d.pair);
          if (pl.wait === 'kanchan' || pl.wait === 'penchan' || pl.wait === 'tanki') fu += 2;
          if (fu === 20) fu = 30;   // 副露的平和形榮和
          fu = Math.ceil(fu / 10) * 10;
        }
        finish(y, fu, ym);
      });
    });
    if (!cands.length) return null;
    cands.forEach(r => { r.base = baseOf(r.han, r.fu, r.yakuman); r.rank = rankName(r.han, r.yakuman); });
    cands.sort((a, b) => b.base - a.base || b.han - a.han || b.fu - a.fu);
    return cands[0];
  };
  const baseOf = (han, fu, ykm) => ykm ? 8000 * ykm : han >= 13 ? 8000 : han >= 11 ? 6000 : han >= 8 ? 4000 : han >= 6 ? 3000 : han >= 5 ? 2000 : Math.min(2000, fu * Math.pow(2, han + 2));
  const rankName = (han, ykm) => ykm ? (ykm > 1 ? ykm + '倍役滿' : '役滿') : han >= 13 ? '累計役滿' : han >= 11 ? '三倍滿' : han >= 8 ? '倍滿' : han >= 6 ? '跳滿' : han >= 5 ? '滿貫' : '';
  const up100 = v => Math.ceil(v / 100) * 100;
  // 付的點數（不含本場）：{ ron, tsumoKo, tsumoOya }
  const payOf = (base, dealer) => dealer ? { ron: up100(base * 6), tsumoAll: up100(base * 2) } : { ron: up100(base * 4), tsumoOya: up100(base * 2), tsumoKo: up100(base) };

  // ---------------- 一場 ----------------
  const mulberry = s => () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const newMatch = opt => {
    opt = opt || {};
    const G = { seats: [], round: 0, honba: 0, kyotaku: 0, ext: false, phase: 'idle', seq: 0, ev: [], rngSeed: opt.seed == null ? (Math.random() * 1e9) | 0 : opt.seed, hands: 0 };
    for (let i = 0; i < 4; i++) G.seats.push({ i, name: (opt.names && opt.names[i]) || ('席' + (i + 1)), pts: START, bot: !!(opt.bots && opt.bots[i]) });
    G.rng = mulberry(G.rngSeed);
    return G;
  };
  const ev = (G, e) => { G.seq++; e.n = G.seq; G.ev.push(e); if (G.ev.length > 40) G.ev.shift(); };
  const seatW = (G, s) => (s - G.dealer + 4) % 4;
  const roundW = G => (G.round >= 4 ? 1 : 0);
  const liveLeft = G => G.wall.length - G.kanN;   // 槓一次少一張（王牌補回）
  const startHand = G => {
    const rng = G.rng || Math.random, w = []; for (let t = 0; t < 136; t++) w.push(t);
    for (let i = w.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [w[i], w[j]] = [w[j], w[i]]; }
    G.dead = w.splice(0, 14); G.wall = w; G.kanN = 0;
    G.doraInd = [G.dead[4] >> 2]; G.uraInd = [G.dead[5] >> 2];
    G.dealer = G.round % 4; G.turn = G.dealer; G.drawn = null; G.last = null; G.result = null; G.claim = null; G.firstGo = true; G.rinshan = false; G.pendingKakan = null;
    G.seats.forEach(s => { s.hand = G.wall.splice(0, 13); s.hand.sort((a, b) => a - b); s.river = []; s.melds = []; s.riichi = false; s.dbl = false; s.ippatsu = false; s.furitenTemp = false; s.furitenRiichi = false; s.riichiAt = -1; s.kuikae = []; s.discards = []; });
    G.hands++;
    ev(G, { k: 'deal', round: G.round, honba: G.honba });
    draw(G, G.dealer);
  };
  const draw = (G, s, rin) => {
    const o = G.seats[s];
    let t;
    if (rin) { t = G.dead[G.kanN]; G.kanN++; G.doraInd.push(G.dead[4 + 2 * G.kanN] >> 2); G.uraInd.push(G.dead[5 + 2 * G.kanN] >> 2); ev(G, { k: 'dora', ind: G.doraInd.slice() }); }
    else t = G.wall.shift();
    o.hand.push(t); G.drawn = t; G.turn = s; G.rinshan = !!rin; o.furitenTemp = false; o.kuikae = [];
    G.phase = 'turn';
    ev(G, { k: 'draw', s });
  };
  const isOpen = o => o.melds.some(m => m.type !== 'ankan');
  const waitsOf = o => { const c = counts(o.hand); return waitsOfC(c, o.melds.length); };
  const furiten = (G, s) => { const o = G.seats[s]; if (o.furitenTemp || o.furitenRiichi) return true; const w = waitsOf(o); return o.discards.some(t => w.includes(t >> 2)); };
  const winInfo = (G, s, tile, opt) => {
    const o = G.seats[s], tsumo = opt.tsumo, tiles = tsumo ? o.hand : o.hand.concat([tile]), c = counts(tiles);
    if (!isAgari(c, o.melds.length)) return null;
    const allT = tiles.concat(...o.melds.map(m => m.tiles)), aka = allT.filter(isRed).length;
    const last = liveLeft(G) === 0;
    const noCalls = G.seats.every(x => !x.melds.length);
    const r = evalWin({ c, melds: o.melds, win: tile >> 2, tsumo, riichi: o.riichi, dbl: o.dbl, ippatsu: o.ippatsu, haitei: tsumo && last && !G.rinshan, houtei: !tsumo && last && !opt.chankan,
      rinshan: tsumo && G.rinshan, chankan: !!opt.chankan, tenhou: tsumo && G.firstGo && s === G.dealer && o.river.length === 0 && noCalls, chiihou: tsumo && G.firstGo && s !== G.dealer && o.river.length === 0 && noCalls,
      seatW: seatW(G, s), roundW: roundW(G), doraInd: G.doraInd, uraInd: G.uraInd.slice(0, G.doraInd.length), aka });
    return r;
  };
  // 打了某張之後聽不聽
  const tenpaiAfter = (o, t) => { const c = counts(o.hand); c[t >> 2]--; return shanten(c, o.melds.length) === 0; };

  // ---------------- 選項 ----------------
  const options = (G, s) => {
    if (G.phase === 'turn' && G.turn === s) {
      const o = G.seats[s], out = { kind: 'turn', discard: [], riichi: [], tsumo: false, kans: [], kyuushu: false };
      if (o.riichi) out.discard = [G.drawn];
      else out.discard = o.hand.filter(t => !o.kuikae.includes(t >> 2));
      if (!out.discard.length) out.discard = o.hand.slice();
      if (G.drawn != null && winInfo(G, s, G.drawn, { tsumo: true })) out.tsumo = true;
      if (!o.riichi && !isOpen(o) && o.pts >= 1000 && liveLeft(G) >= 4 && G.drawn != null) { const seen = {}; o.hand.forEach(t => { if (seen[t >> 2] == null) seen[t >> 2] = tenpaiAfter(o, t); if (seen[t >> 2]) out.riichi.push(t); }); }
      if (G.drawn != null && liveLeft(G) > 0 && G.kanN < 4) {
        const c = counts(o.hand);
        for (let k = 0; k < 34; k++) if (c[k] === 4) {
          if (o.riichi) { if ((G.drawn >> 2) !== k) continue; const h = o.hand.filter(t => t >> 2 !== k); const w0 = waitsOfC(counts(o.hand.filter(t => t !== G.drawn)), o.melds.length).join(), w1 = waitsOfC(counts(h), o.melds.length + 1).join(); if (w0 !== w1) continue; }
          out.kans.push({ kind: 'ankan', id: k });
        }
        if (!o.riichi) o.melds.forEach(m => { if (m.type === 'pon' && c[m.tiles[0] >> 2]) out.kans.push({ kind: 'kakan', id: m.tiles[0] >> 2 }); });
      }
      if (G.firstGo && o.river.length === 0 && G.seats.every(x => !x.melds.length)) { const c = counts(o.hand); if (KOKU.filter(i => c[i]).length >= 9) out.kyuushu = true; }
      return out;
    }
    if (G.phase === 'claim' && G.claim && G.claim.opts[s] && !G.claim.resp[s]) return G.claim.opts[s];
    return null;
  };
  const claimOpts = (G, from, tile, chankan) => {
    const opts = {}, id = tile >> 2, last = liveLeft(G) === 0;
    for (let k = 1; k <= 3; k++) {
      const j = (from + k) % 4, o = G.seats[j], op = { kind: 'claim', tile, from, ron: false, pon: [], chi: [], kan: false, chankan: !!chankan };
      const y = winInfo(G, j, tile, { tsumo: false, chankan }); if (y && !furiten(G, j)) op.ron = true;
      if (!chankan && !o.riichi && !last) {
        const same = o.hand.filter(t => t >> 2 === id);
        if (same.length >= 2) {
          // 碰：有赤牌時分兩種
          const reds = same.filter(isRed), plain = same.filter(t => !isRed(t));
          if (plain.length >= 2) op.pon.push([plain[0], plain[1]]); if (reds.length && plain.length) op.pon.push([reds[0], plain[0]]);
        }
        if (same.length >= 3 && G.kanN < 4) op.kan = true;
        if (k === 1 && id < 27) {
          const n = id % 9;
          [[-2, -1], [-1, 1], [1, 2]].forEach(([a, b]) => {
            if (n + a < 0 || n + b > 8) return; const A = o.hand.filter(t => t >> 2 === id + a), B = o.hand.filter(t => t >> 2 === id + b); if (!A.length || !B.length) return;
            const pickT = arr => [arr.find(t => !isRed(t)), arr.find(isRed)].filter(v => v != null);
            pickT(A).forEach(x => pickT(B).forEach(y2 => op.chi.push([x, y2])));
          });
          // 食替：吃完沒有能打的牌就不能吃
          op.chi = op.chi.filter(u => { const rest = o.hand.filter(t => !u.includes(t)), kk = kuikaeOf('chi', id, u.map(t => t >> 2)); return rest.some(t => !kk.includes(t >> 2)); });
        }
      }
      if (op.ron || op.pon.length || op.chi.length || op.kan) opts[j] = op;
    }
    return opts;
  };
  const kuikaeOf = (type, id, used) => {
    if (type === 'pon') return [id];
    const lo = Math.min(id, ...used), hi = Math.max(id, ...used), out = [id];
    if (id === lo && hi % 9 < 8) out.push(hi + 1);
    if (id === hi && lo % 9 > 0) out.push(lo - 1);
    return out;
  };

  // ---------------- 動作 ----------------
  const act = (G, s, a) => {
    if (!a || G.phase === 'result' || G.phase === 'over') return false;
    const op = options(G, s); if (!op) return false;
    const o = G.seats[s];
    if (op.kind === 'turn') {
      if (a.t === 'discard') {
        const t = a.tile; if (!o.hand.includes(t)) return false;
        if (a.riichi) { if (!op.riichi.includes(t)) return false; } else if (!op.discard.includes(t)) return false;
        doDiscard(G, s, t, !!a.riichi); return true;
      }
      if (a.t === 'tsumo' && op.tsumo) { const y = winInfo(G, s, G.drawn, { tsumo: true }); settleWins(G, [{ s, y }], s, true); return true; }
      if (a.t === 'kan') { const k = op.kans.find(x => x.kind === a.kind && x.id === a.id); if (!k) return false; doSelfKan(G, s, k); return true; }
      if (a.t === 'kyuushu' && op.kyuushu) { G.result = { kind: 'abort', why: '九種九牌', by: s }; endHand(G, true, true); return true; }
      return false;
    }
    // claim
    const C = G.claim; if (C.resp[s]) return false;
    let r = null;
    if (a.t === 'pass') r = { t: 'pass' };
    else if (a.t === 'ron' && op.ron) r = { t: 'ron' };
    else if (a.t === 'pon' && op.pon.length) { const u = op.pon.find(p => a.use && p.join() === a.use.join()) || op.pon[0]; r = { t: 'pon', use: u }; }
    else if (a.t === 'chi' && op.chi.length) { const u = op.chi.find(p => a.use && p.join() === a.use.join()) || op.chi[0]; r = { t: 'chi', use: u }; }
    else if (a.t === 'kan' && op.kan) r = { t: 'kan' };
    if (!r) return false;
    if (r.t !== 'ron' && op.ron) { if (o.riichi) o.furitenRiichi = true; else o.furitenTemp = true; }   // 見逃し
    C.resp[s] = r;
    resolveClaim(G);
    return true;
  };
  const doDiscard = (G, s, t, riichi) => {
    const o = G.seats[s]; o.hand.splice(o.hand.indexOf(t), 1); o.hand.sort((a, b) => a - b);
    const tsumogiri = t === G.drawn;
    o.river.push({ t, tg: tsumogiri, r: !!riichi }); o.discards.push(t);
    if (o.ippatsu && !riichi) o.ippatsu = false;
    if (riichi) { o.riichi = true; o.ippatsu = true; o.riichiAt = o.river.length - 1; o.dbl = G.firstGo && o.river.length === 1 && G.seats.every(x => !x.melds.length); o.riichiPending = true; }
    o.furitenTemp = false; o.kuikae = [];
    G.drawn = null; G.rinshan = false; G.last = { s, t };
    ev(G, { k: 'discard', s, t, riichi: !!riichi, tg: tsumogiri });
    // 東家打完第一巡（大家都打過一張）就不是第一巡
    if (G.firstGo && G.seats.every(x => x.river.length >= 1)) G.firstGo = false;
    const opts = claimOpts(G, s, t, false);
    G.claim = { kind: 'discard', from: s, tile: t, opts, resp: {} };
    G.phase = 'claim';
    resolveClaim(G);
  };
  const finalizeRiichi = (G, s) => { const o = G.seats[s]; if (o.riichiPending) { o.riichiPending = false; o.pts -= 1000; G.kyotaku++; ev(G, { k: 'stick', s }); } };
  const resolveClaim = G => {
    const C = G.claim; const need = Object.keys(C.opts).map(Number);
    // 有人可能榮和的時候，等所有人回應；否則也等所有人（簡單、公平）
    if (need.some(j => !C.resp[j])) {
      // 已經有人榮和，而且剩下沒回的都沒有榮和選項 → 直接結算
      const rons = need.filter(j => C.resp[j] && C.resp[j].t === 'ron');
      if (!rons.length || need.some(j => !C.resp[j] && C.opts[j].ron)) return;
    }
    const order = [1, 2, 3].map(k => (C.from + k) % 4);
    const rons = order.filter(j => C.resp[j] && C.resp[j].t === 'ron');
    if (rons.length >= 3) { G.claim = null; G.result = { kind: 'abort', why: '三家和' }; endHand(G, true, true); return; }
    if (rons.length) {
      G.claim = null;
      const wins = rons.map(j => ({ s: j, y: winInfo(G, j, C.tile, { tsumo: false, chankan: C.kind === 'chankan' }) }));
      settleWins(G, wins, C.from, false, C.tile); return;
    }
    // 沒人和：立直成立
    if (C.kind === 'discard') finalizeRiichi(G, C.from);
    if (C.kind === 'chankan') { G.claim = null; const pk = G.pendingKakan; G.pendingKakan = null; draw(G, pk.s, true); return; }
    const pk = order.find(j => C.resp[j] && (C.resp[j].t === 'pon' || C.resp[j].t === 'kan'));
    const ch = order.find(j => C.resp[j] && C.resp[j].t === 'chi');
    const who = pk != null ? pk : ch;
    G.claim = null;
    if (who != null) {
      const r = G.claim0 = C.resp[who], o = G.seats[who], from = C.from, t = C.tile, id = t >> 2;
      G.seats.forEach(x => { x.ippatsu = false; }); G.firstGo = false;
      G.seats[from].river[G.seats[from].river.length - 1].taken = true;
      if (r.t === 'kan') {
        const ts = o.hand.filter(x => x >> 2 === id).slice(0, 3); ts.forEach(x => o.hand.splice(o.hand.indexOf(x), 1));
        o.melds.push({ type: 'minkan', tiles: ts.concat([t]), from, called: t });
        ev(G, { k: 'call', s: who, c: 'kan' });
        draw(G, who, true); return;
      }
      r.use.forEach(x => o.hand.splice(o.hand.indexOf(x), 1));
      o.melds.push({ type: r.t, tiles: r.use.concat([t]).sort((a, b) => a - b), from, called: t });
      o.kuikae = kuikaeOf(r.t, id, r.use.map(x => x >> 2));
      G.turn = who; G.drawn = null; G.phase = 'turn';
      ev(G, { k: 'call', s: who, c: r.t });
      return;
    }
    // 下一家摸牌
    if (liveLeft(G) <= 0) { exhaust(G); return; }
    // 四家立直 → 流局
    if (G.seats.every(x => x.riichi)) { G.result = { kind: 'abort', why: '四家立直' }; endHand(G, true, true); return; }
    draw(G, (C.from + 1) % 4);
  };
  const doSelfKan = (G, s, k) => {
    const o = G.seats[s];
    G.seats.forEach(x => { x.ippatsu = false; });
    if (k.kind === 'ankan') {
      const ts = o.hand.filter(t => t >> 2 === k.id); ts.forEach(t => o.hand.splice(o.hand.indexOf(t), 1));
      o.melds.push({ type: 'ankan', tiles: ts });
      ev(G, { k: 'call', s, c: 'ankan' }); G.firstGo = false;
      draw(G, s, true); return;
    }
    const m = o.melds.find(x => x.type === 'pon' && x.tiles[0] >> 2 === k.id), t = o.hand.find(x => x >> 2 === k.id);
    o.hand.splice(o.hand.indexOf(t), 1); m.tiles.push(t); m.type = 'minkan'; m.kakan = t;
    ev(G, { k: 'call', s, c: 'kakan' });
    // 搶槓
    const opts = claimOpts(G, s, t, true);
    G.pendingKakan = { s, t };
    G.drawn = null;
    if (Object.keys(opts).length) { G.claim = { kind: 'chankan', from: s, tile: t, opts, resp: {} }; G.phase = 'claim'; return; }
    G.pendingKakan = null; draw(G, s, true);
  };
  const exhaust = G => {
    const ten = G.seats.map(o => shanten(counts(o.hand), o.melds.length) === 0), n = ten.filter(Boolean).length, delta = [0, 0, 0, 0];
    if (n > 0 && n < 4) ten.forEach((t, i) => { delta[i] = t ? 3000 / n : -3000 / (4 - n); });
    delta.forEach((d, i) => { G.seats[i].pts += d; });
    G.result = { kind: 'draw', ten, delta, hands: G.seats.map((o, i) => ten[i] ? o.hand.slice() : null) };
    ev(G, { k: 'ryuukyoku' });
    endHand(G, ten[G.dealer], true);
  };
  const settleWins = (G, wins, from, tsumo, tile) => {
    const delta = [0, 0, 0, 0], list = [];
    // 本場、供託給離放槍者最近的那家（頭跳）
    wins.forEach((w, wi) => {
      const dealer = w.s === G.dealer, p = payOf(w.y.base, dealer), hb = wi === 0 ? G.honba : 0;
      let gain = 0;
      if (tsumo) G.seats.forEach(o => { if (o.i === w.s) return; const v = (dealer ? p.tsumoAll : o.i === G.dealer ? p.tsumoOya : p.tsumoKo) + hb * 100; delta[o.i] -= v; gain += v; });
      else { const v = p.ron + hb * 300; delta[from] -= v; gain += v; }
      const sticks = wi === 0 ? G.kyotaku * 1000 : 0; gain += sticks; delta[w.s] += gain;
      const o = G.seats[w.s];
      list.push({ s: w.s, y: w.y, hand: (tsumo ? o.hand : o.hand.concat([tile])).slice().sort((a, b) => a - b), winT: tsumo ? G.drawn : tile, melds: o.melds.map(m => ({ type: m.type, tiles: m.tiles.slice(), called: m.called })), riichi: o.riichi, pts: p, gain: gain - sticks, sticks, honba: hb });
    });
    G.kyotaku = 0;
    delta.forEach((d, i) => { G.seats[i].pts += d; });
    G.result = { kind: tsumo ? 'tsumo' : 'ron', from, wins: list, delta, doraInd: G.doraInd.slice(), uraInd: G.uraInd.slice(0, G.doraInd.length) };
    G.claim = null;
    ev(G, { k: tsumo ? 'tsumo' : 'ron', s: wins.map(w => w.s), from });
    endHand(G, wins.some(w => w.s === G.dealer), false);
  };
  // renchan：莊家連莊；draw：流局（本場 +1）
  const endHand = (G, renchan, isDraw) => {
    G.phase = 'result';
    const r = G.result; r.renchan = !!renchan; r.isDraw = !!isDraw;
    // 決定下一局
    let round = G.round, honba = G.honba;
    if (renchan) honba++; else { round++; honba = isDraw ? honba + 1 : 0; }
    const pts = G.seats.map(o => o.pts), top = Math.max(...pts), bust = pts.some(p => p < 0);
    const allLast = G.round >= 3;
    let over = bust;
    if (!over && allLast) {
      const dealerTop = pts[G.dealer] === top && pts.filter(p => p === top).length === 1 && pts[G.dealer] >= RETURN;
      if (G.round >= 4 && top >= RETURN) over = true;    // 延長（南場）中有人到 30000：立刻結束
      else if (renchan && dealerTop) over = true;       // 莊家第一：和了止め／聽牌止め
      else if (!renchan && round >= 4 && top >= RETURN) over = true;
      else if (round >= 8) over = true;                 // 南四局結束
    }
    r.next = { round, honba }; r.over = over;
  };
  const nextHand = G => {
    if (G.phase !== 'result') return false;
    const r = G.result;
    if (r.over) { finishMatch(G); return true; }
    G.round = r.next.round; G.honba = r.next.honba; startHand(G); return true;
  };
  const finishMatch = G => {
    const ord = G.seats.slice().sort((a, b) => b.pts - a.pts || a.i - b.i);
    if (G.kyotaku) { ord[0].pts += G.kyotaku * 1000; G.kyotaku = 0; }
    const rank = ord.map(o => o.i);
    const score = ord.map((o, k) => Math.round(((o.pts - RETURN) / 1000 + UMA[k] + (k === 0 ? (RETURN - START) * 4 / 1000 : 0)) * 10) / 10);
    G.final = { rank, pts: ord.map(o => o.pts), score };
    G.phase = 'over';
    ev(G, { k: 'over' });
  };

  // ---------------- 電腦 ----------------
  const visibleOf = (G, s) => { const v = new Array(34).fill(0); G.seats.forEach(o => { o.river.forEach(r => { if (!r.taken) v[r.t >> 2]++; }); o.melds.forEach(m => m.tiles.forEach(t => v[t >> 2]++)); }); G.doraInd.forEach(i => v[i]++); G.seats[s].hand.forEach(t => v[t >> 2]++); return v; };
  const botChoose = (G, s, pool) => {
    const o = G.seats[s], c = counts(o.hand), vis = visibleOf(G, s), threats = G.seats.filter(x => x.i !== s && x.riichi), nm = o.melds.length;
    const dora = G.doraInd.map(doraOf), sw = seatW(G, s);
    const danger = id => threats.reduce((mx, t) => { const rv = t.discards.map(x => x >> 2); let d = 6; if (rv.includes(id)) d = 0; else if (id >= 27) d = vis[id] >= 3 ? 0.3 : vis[id] === 2 ? 1.5 : 3; else { const n = id % 9; const suji = (n >= 3 && rv.includes(id - 3)) || (n <= 5 && rv.includes(id + 3)); d = suji ? (isTerm(id) ? 1.5 : 3) : isTerm(id) ? 3.5 : 6; } return Math.max(mx, d); }, 0);
    const val = id => id >= 27 ? (vis[id] >= 3 ? -1 : (id >= 31 || id === 27 + sw || id === 27 + roundW(G)) ? 1.5 : 0) : [1, 2, 3, 4, 4, 4, 3, 2, 1][id % 9] + (dora.includes(id) ? 3 : 0);
    let best = null; const seen = {};
    pool.forEach(t => {
      const id = t >> 2; if (seen[id] && !isRed(t)) return; seen[id] = 1;
      c[id]--; const sh = shanten(c, nm); let uk = 0;
      if (sh <= 3) for (let k = 0; k < 34; k++) { const lf = Math.max(0, 4 - vis[k]); if (lf <= 0) continue; c[k]++; if (shanten(c, nm) < sh) uk += lf; c[k]--; }
      c[id]++;
      const dg = threats.length ? danger(id) : 0;
      const score = -sh * 1000 + uk * 4 - val(id) * 3 - (isRed(t) ? 8 : 0) - dg * (sh >= 2 ? 2000 : sh === 1 ? 60 : 15);
      if (!best || score > best.score) best = { t, score };
    });
    return best.t;
  };
  const botAct = (G, s) => {
    const op = options(G, s); if (!op) return null; const o = G.seats[s];
    if (op.kind === 'turn') {
      if (op.tsumo) return { t: 'tsumo' };
      if (op.kyuushu && shanten(counts(o.hand), 0) >= 4) return { t: 'kyuushu' };
      for (const k of op.kans) { const c = counts(o.hand); const before = shanten(c, o.melds.length); c[k.id] -= k.kind === 'ankan' ? 4 : 1; if (shanten(c, o.melds.length + (k.kind === 'ankan' ? 1 : 0)) <= before && (o.riichi || G.rng() < 0.7)) return { t: 'kan', kind: k.kind, id: k.id }; }
      if (o.riichi) return { t: 'discard', tile: G.drawn };
      const t = botChoose(G, s, op.discard);
      if (op.riichi.includes(t) && G.rng() < 0.9) return { t: 'discard', tile: t, riichi: true };
      return { t: 'discard', tile: t };
    }
    if (op.ron) return { t: 'ron' };
    if (o.riichi) return { t: 'pass' };
    const id = op.tile >> 2, sh0 = shanten(counts(o.hand), o.melds.length), sw = seatW(G, s);
    const yakuhai = k => k >= 31 || k === 27 + sw || k === 27 + roundW(G);
    const shAfter = used => { const c = counts(o.hand); used.forEach(t => c[t >> 2]--); let best = 9; for (let k = 0; k < 34; k++) { if (!c[k]) continue; c[k]--; best = Math.min(best, shanten(c, o.melds.length + 1)); c[k]++; } return best; };
    const hasYaku = () => o.melds.some(m => m.type !== 'chi' && yakuhai(m.tiles[0] >> 2)) || (o.melds.every(m => m.tiles.every(t => !isTerm(t >> 2))) && o.hand.filter(t => isTerm(t >> 2)).length <= 2 && !isTerm(id));
    const danger = G.seats.some(x => x.i !== s && x.riichi);
    if (op.pon.length && yakuhai(id) && shAfter(op.pon[0]) <= sh0) return { t: 'pon', use: op.pon[0] };
    if (danger && sh0 >= 2) return { t: 'pass' };
    if (op.pon.length && hasYaku() && !isTerm(id) && shAfter(op.pon[0]) < sh0) return { t: 'pon', use: op.pon[0] };
    if (op.chi.length && hasYaku()) { const u = op.chi.find(u2 => u2.every(t => !isTerm(t >> 2)) && shAfter(u2) < sh0); if (u && G.rng() < 0.8) return { t: 'chi', use: u }; }
    return { t: 'pass' };
  };

  // ---------------- 給玩家看的（藏起別人的手牌、牌山） ----------------
  const view = (G, me) => {
    const V = { round: G.round, honba: G.honba, kyotaku: G.kyotaku, dealer: G.dealer, turn: G.turn, phase: G.phase, left: G.wall ? liveLeft(G) : 0, doraInd: (G.doraInd || []).slice(), me, seq: G.seq, ev: G.ev.slice(-12), hands: G.hands,
      drawn: G.turn === me ? G.drawn : null, lastD: G.last, roundW: G.wall ? roundW(G) : 0 };
    V.seats = G.seats.map((o, i) => ({ i, name: o.name, pts: o.pts, bot: o.bot, away: !!o.away, riichi: !!o.riichi, river: (o.river || []).map(r => ({ t: r.t, tg: r.tg, r: r.r, taken: !!r.taken })), riichiAt: o.riichiAt,
      melds: (o.melds || []).map(m => ({ type: m.type, tiles: m.tiles.slice(), from: m.from, called: m.called, kakan: m.kakan })), n: (o.hand || []).length, hand: i === me || G.phase === 'over' ? (o.hand || []).slice() : null, wind: G.wall ? seatW(G, i) : i }));
    if (G.result) { V.result = JSON.parse(JSON.stringify(G.result)); if (V.result.kind === 'draw') V.result.hands = G.result.hands; }
    if (G.final) V.final = G.final;
    if (me != null && G.seats[me] && G.seats[me].hand) { const o = G.seats[me]; V.furiten = G.phase !== 'over' ? furiten(G, me) : false; V.kuikae = o.kuikae || []; }
    V.opts = me != null ? options(G, me) : null;
    return V;
  };

  // 測試、提示用：手牌（13 張）的聽牌
  const waits13 = (hand, nm) => waitsOfC(counts(hand), nm || 0);
  // 打掉 t 之後的聽牌（提示）
  const waitsIfDiscard = (hand, t, nm) => { const h = hand.slice(); h.splice(h.indexOf(t), 1); const c = counts(h); return shanten(c, nm || 0) === 0 ? waitsOfC(c, nm || 0) : []; };

  return { NUM, HON, SUIT, WIND, tname, isRed, isTerm, counts, doraOf, shanten, isAgari, evalWin, baseOf, payOf, rankName, newMatch, startHand, nextHand, options, act, botAct, view, waits13, waitsIfDiscard, seatW, START, RETURN, UMA, liveLeft };
});
