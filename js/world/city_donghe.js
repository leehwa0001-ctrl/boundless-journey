// 東鶴重蓋成精緻城市（2026-10-10 作者：先讓引擎會蓋斜路，再照東鶴的地圖原樣重蓋）——第一階段：照 city.js 的地圖蓋出整座城
// - 座標跟原本的東鶴一樣（世界座標＝(示意圖 − 500) × 0.44 公尺），所以原本的位置、互動、劇情的座標都可以直接用。
// - 路：city.js 的每一條路都用 B.street（citykit8.js）照原本的折線蓋——主幹道、副幹道有人行道，巷子、舊城的石板路人車共用，拱廊只能走路，城外是泥土路。
// - 水：霜溪、鶴川、外濠照折線外擴成水面（Clipper 合併）；橋照 city.js 的橋；東邊是海。
// - 鐵路、東鶴站、月台、站前廣場；舊城的城牆和四個城門（櫓門）；田、公園、小學、墓地、雜木林、超市。（2026-10-26 地圖整張重新設計，全部照 city.js）
// - 房子：city.js 自動排好的每一塊地（舊城的町家、土藏、站前的店和雜居大樓、住宅、公寓、倉庫……）照種類、樓層、顏色、門的方向蓋；
//   設施（公會、鐵匠鋪、神社、寺、縣廳、百貨……）照 city.js 的位置和大小蓋，掛招牌。
// - 互動、門：先在背景照原本的流程把舊的東鶴蓋一次，收下所有特別的互動（走進店裡、參拜、看委託、攤子、劇情人物……）放到同樣的位置，
//   再把舊的場景丟掉（CK.dongheHarvest）。走進店裡用原本的室內（interior.js、interiors2.js），裡面的櫃台都照舊。
// - 第二階段（2026-10-10）：海岸（護岸、消波塊、東濱海水浴場、東鶴漁港的碼頭和漁船、魚市場的棚子、紅白燈塔）、跨海的鐵橋、東鶴港（照 coast.js、harbor.js）。
// - 2026-10-10 作者選 A：東鶴預設改用精緻版（dhswitch.js 接上所有進東鶴的路；跑不動自動換回像素版）。R.enterDongheCK() 留著測試用。
// 放在 citykit*.js（含 citykit8.js）、city.js、town.js 和所有包 R.enterTownNow 的檔案後面。
(function (R) {
  const CK = R.CK, W = R.W, C = R.CITY; if (!CK || !C) return;
  const S = C.S, WX = s => (s - 500) * S, WZ = s => (s - 500) * S, w2 = p => [WX(p[0]), WZ(p[1])];
  const rectW = r => [WX(r[0]), WZ(r[1]), WX(r[2]), WZ(r[3])];
  const FACE = ['s', 'n', 'w', 'e'];
  // 路的種類 → 車道寬、人行道寬（公尺；city.js 的寬是含人行道的示意圖單位，人行道主幹道 8、副幹道 6）
  const RK = { main: [32, 8], sub: [16, 6], lane: [11, 0], old: [18, 0], olane: [10, 0], arcade: [18, 0], dirt: [16, 0] };
  // ---------- 收下舊東鶴的互動 ----------
  const GENERIC = /^(扒走路人的錢包|和路人說話|坐一下|把司機拉下來搶車|摸摸|看競選海報|偷聽他們聊天|和長椅上|和玩雪的學生|和等公車|和剛下電車|租腳踏車|郵局：送包裹|計程車行：開計程車|屋台|聽街頭藝人|翻垃圾桶|德克斯凡的自動販賣機|自動販賣機|紅色的郵筒|公共電話|垃圾集中處|德克斯凡中古車行)/;
  const STEAL = /^(偷|摸走|順手|撬開)/;
  const lbl = it => { try { return typeof it.label === 'string' ? it.label : String(it.label || ''); } catch (e) { return ''; } };
  CK.dongheHarvest = (from, at) => {
    // 收東西用的像素版不會畫出來：人物共用同一張貼圖（不然要替兩百多個路人各畫一張，幾秒鐘），也不編譯著色器
    if (R.initGL) R.initGL();
    const mh0 = R.makeHeroSprite, cp0 = W.renderer && W.renderer.compile;
    R.makeHeroSprite = (cls, base, look) => { const h = mh0(cls, base, Object.assign({}, look || {}, { pool: (look && look.pool) || 'dh_harvest' })); if (!(look && look.pool)) h.look0 = look || null; return h; };
    if (cp0) W.renderer.compile = () => { };
    CK.harvesting = true;   // 路人、貓狗收了也用不到（streetlife.js、townlife.js 看到就不蓋）
    const cs0 = R.buildCityscape; R.buildCityscape = null;   // 街景（路面、路燈、販賣機）只有販賣機、電話亭的互動，收了也丟掉（GENERIC）
    try { (CK._enterPixel || R.enterTownNow)(from, at); } finally { R.makeHeroSprite = mh0; if (cp0) W.renderer.compile = cp0; R.buildCityscape = cs0; CK.harvesting = false; }   // 像素版原本的那一套（dhswitch.js 包住 R.enterTownNow 以後，這裡要直接叫原本的）
    const tw = W.town, out = { inter: [], npcs: [], steals: [] };
    (tw.inter || []).forEach(it => { const l = lbl(it); if (!l || (it.follow && !it.person && !it.job)) return;   /* 2026-10-16 修正：私人委託的交件（jobs.js 標 job）也要收下，不然精緻版東鶴交不了件 */   /* 劇情人物（people.js）的對話跟著那個人：留著，蓋好以後改指向新的人 */ if (STEAL.test(l)) { out.steals.push(it); return; } if (GENERIC.test(l)) return; out.inter.push(it); });
    // 站著不動的人（店員、攤販、衛兵、今天在城裡的劇情人物）：記下外觀，精緻版照原樣重建
    (tw.npcs || []).forEach(n => { if (n.walk || n.off || !n.h || !n.near) return; out.npcs.push({ x: n.x, z: n.z, rot: n.rot || 0, opt: n.h.look0 !== undefined ? n.h.look0 : (n.h.opt || null), base: n.h.base || null, kind: n.h.kind, name: n.name || '', person: n.person || null, watch: n.watch, src: n }); });
    return out;
  };
  R.enterDongheCK = (from, at) => {
    R.three.then(() => CK.clipperReady).then(() => {
      let H = null; try { H = CK.dongheHarvest(from, at); } catch (e) { console.warn('[donghe] harvest', e); }
      CK._dongheH = H; CK.enter('donghe', at ? { at } : undefined); CK._dongheH = null;
    });
  };
  // ---------- 水面：折線外擴（Clipper），合併成不重疊的幾塊 ----------
  const waterPolys = () => {
    const L = window.ClipperLib; if (!L) return [];
    const co = new L.ClipperOffset(2, 25), SC = 100; const paths = [];
    C.water.forEach(w => { if (!w.pts || w.pts.length < 2) return; const c = new L.ClipperOffset(2, 25); c.AddPath(w.pts.map(p => ({ X: Math.round(WX(p[0]) * SC), Y: Math.round(WZ(p[1]) * SC) })), L.JoinType.jtRound, L.EndType.etOpenButt); const o = new L.Paths(); c.Execute(o, w.w / 2 * S * SC); o.forEach(p => paths.push(p)); });
    void co;
    const cl = new L.Clipper(); cl.AddPaths(paths, L.PolyType.ptSubject, true); const tree = new L.PolyTree(); cl.Execute(L.ClipType.ctUnion, tree, L.PolyFillType.pftNonZero, L.PolyFillType.pftNonZero);
    return L.JS.PolyTreeToExPolygons(tree).map(e => e.outer.map(p => [p.X / SC, p.Y / SC]));
  };
  const OLDSHOP = ['豆腐店', '雜貨・丸屋', '酒屋', '茶屋', '米屋', '乾物屋', '漬物', '下駄屋', '筆墨', '提燈屋', '針灸', '菓子', '燒餅', '蕎麥'];
  // ---------- 設施：樣子、高度、名字 ----------
  const FAC = {
    guild: { style: 'brick', h: 10.5, name: '公會東鶴分館', col: '#9C978D', sign: ['#2E4A34', '#F4E9CD'] },
    store: { style: 'kura', h: 6.2, name: '倉庫' }, pharmacy: { style: 'house', h: 5.6, name: '白藤堂', col: '#E6E0D2', sign: ['#4A3A5A', '#F4ECD8'], roof: 'gable' },
    tavern: { style: 'machiya', h: 6.6, name: '赤提燈', noren: '#8A2A24' }, smith: { style: 'house', h: 5.4, name: '老岩的鐵匠鋪', col: '#6A5040', roof: 'gable', chimney: 1 },
    coach: { style: 'house', h: 5.2, name: '驛站', col: '#8A6A4A', roof: 'gable' }, exchange: { style: 'shop', h: 3.4, name: '西市兌換所' },
    firetower: { tower: 'fire' }, clock: { tower: 'clock' }, factory: { style: 'factory', h: 12, name: '德克斯凡選礦廠', chimney: 2 }, farmhouse: { style: 'house', h: 5, roof: 'gable', name: '北郊農舍' },
    dexTrade: { style: 'glass', h: 7, name: '德克斯凡商行', sign: ['#1E3A5A', '#FFFFFF'] }, dexParts: { style: 'shop', h: 6, name: '魔導燈具・零件行' }, cafe: { style: 'glass', h: 6.5, name: '德克斯凡咖啡館', sign: ['#3A2A1C', '#FFE8B0'] },
    pref: { style: 'office', h: 16, name: '東鶴縣廳', col: '#C8C4BA' }, guardHQ: { style: 'brick', h: 8, name: '東鶴衛兵詰所', col: '#8A8478' }, bank: { style: 'brick', h: 11, name: '世界中央銀行・東鶴分行', col: '#E2DCD0' },
    hospital: { style: 'office', h: 14, name: '東鶴醫院', col: '#EEF0F2' }, post: { style: 'office', h: 7.5, name: '東鶴郵局', col: '#D84A3A' }, paper: { style: 'office', h: 9, name: '東鶴日報社', col: '#B8BCC0' },
    theater: { style: 'brick', h: 11, name: '劇場「東鶴座」', col: '#B8A07A' }, dept: { style: 'glass', h: 22, name: '德克斯凡百貨', col: '#A8B8C8' },
    koban: { style: 'house', h: 3.6, name: '崗亭', col: '#E8E4DC', roof: 'flat' }, bath: { style: 'house', h: 6.4, name: '錢湯「松之湯」', col: '#D8CCB4', roof: 'gable', chimney: 1 },
    temple: { temple: 1 }, hotel: { style: 'office', h: 13, name: '東鶴旅館', col: '#C8C0B4' }, pachinko: { style: 'shop', h: 9, name: '柏青哥「銀河」', neon: 1, sign: ['#0E0E14', '#FFD24A'] },
    game: { style: 'shop', h: 8, name: '遊樂場', neon: 1, sign: ['#0E0E14', '#5AE8FF'] }, mahjong: { style: 'shop', h: 6.4, name: '雀莊「東風」', sign: ['#2A4A2E', '#FFFFFF'] }, karaoke: { style: 'shop', h: 8, name: '卡拉 OK「歌聲」', neon: 1, sign: ['#0E0E14', '#FF5AB8'] },
    beachHut: { style: 'house', h: 3.6, name: '海之家', roof: 'flat' }, shrine: { shrine: 1 }, suga: { stall: '糰子' }, board: { prop: 'board' }, news: { prop: 'news' }, clockPillar: { prop: 'clockPillar' }
  };

  // ---------- 海岸、漁港、海水浴場、東鶴港（照 coast.js、harbor.js 原本的位置蓋；互動是背景收下來的那些） ----------
  // 海裡整片擋住，只留沙灘、碼頭、防波堤、填出來的埠頭走得上去。
  const X0 = WX(C.COAST || 975);
  const PIERS = [[846, 854], [892, 900]], BREAK = [924, 931], BEACH = [112, 206];   // 防波堤（coast.js 的 934～941 太靠南，走不到）
  const HB = { cargo: [0, 180, 40, 110], ferry: [0, 140, -62, -36], mid: [0, 90, -12, 14], bwOut: [226, 232, -98, 62], bwN: [0, 232, -98, -92] };   // 東鶴港（x 從海岸線算起）
  const hr = k => { const [a, b, c, d] = HB[k]; return [X0 + (a === 0 ? -0.8 : a), c, X0 + b, d]; };
  const RAIL_X1 = X0 + 360;
  function seaside(B) {
    const M = CK.M, g = B.g, P = B.part, rnd = B.rnd, tw = W.town, TH = THREE;
    const zB0 = WZ(BEACH[0]), zB1 = WZ(BEACH[1]), walk = tw.city.walk;
    const own = (col, o) => CK.mat('dhSea' + col + (o ? JSON.stringify(o) : ''), Object.assign({ col, rough: 0.6, snow: 0 }, o || {}));
    const mesh = (geo, mat, x, y, z, sx, sy, sz, par) => { const m = new TH.Mesh(geo, mat); m.position.set(x, y, z); m.scale.set(sx, sy, sz); m.castShadow = true; m.receiveShadow = true; (par || B.group).add(m); return m; };
    const ok = [];   // 走得上去的地方（海裡）
    // ---- 護岸、消波塊 ----
    [[WZ(40), zB0], [zB1, WZ(1000)]].forEach(([a, b]) => B.box(M('concD'), X0 - 1.2, -1.6, a, X0, 0.2, b));
    { const gaps = PIERS.concat([BREAK]).map(([a, b]) => [WZ(a), WZ(b)]).concat([[HB.bwN[2], HB.cargo[3]], [WZ(C.RAIL.y0), WZ(C.RAIL.y1)]]), tm = M('concD');
      for (let z = WZ(60); z < WZ(990); z += 2.8) {
        if ((z > zB0 - 3 && z < zB1 + 3) || gaps.some(([a, b]) => z > a - 3 && z < b + 3) || rnd() < 0.3) continue;
        const bx = X0 + 1.2 + rnd() * 1.6, yaw = rnd() * 6.28;
        [[0, 0], [1.91, 0], [1.91, 2.09], [1.91, 4.19]].forEach(([tl, ro]) => { const q = new TH.Quaternion().setFromEuler(new TH.Euler(tl, ro + yaw, 0, 'YXZ')), v = new TH.Vector3(0, 0.45, 0).applyQuaternion(q); const e = new TH.Euler().setFromQuaternion(q); P(g.cyl8, tm, bx + v.x * 1.25, -0.45 + v.y * 1.25, z + v.z * 1.25, 0.5, 1.15, 0.5, e.x, e.y, e.z); });
      } }
    // ---- 東濱海水浴場：沙灘、海之家（照原本的設施）、收起來的陽傘 ----
    const sandM = CK.mat('dhSand|{"ground":1}', { tex: 'sand', col: '#B4A486', snow: 0.4, ground: 1 });   // 沙子＋雪原本整片發白
    B.zone([[WX(948), zB0], [X0, zB0], [X0, zB1], [WX(948), zB1]], 'dhSand', 0.04);
    B.box(sandM, X0 - 0.2, -1.5, zB0, X0 + 5, 0.04, zB1); P(g.box, sandM, X0 + 6.4, -0.85, (zB0 + zB1) / 2, 3.4, 0.4, zB1 - zB0, 0, 0, -0.32);
    ok.push([X0 - 1, zB0, X0 + 4.6, zB1]);
    for (let i = 0; i < 4; i++) { const ux = X0 - 2 - i * 2.6, uz = (zB0 + zB1) / 2 + (i % 2 ? 4 : -3); P(g.cyl8, M('white'), ux, 0.9, uz, 0.08, 1.8, 0.08); P(g.cone8, M('paint', { col: ['#C8323A', '#3A6ACF', '#F2C84A', '#3A8A5A'][i] }), ux, 1.45, uz, 0.42, 1.1, 0.42); B.solid(ux - 0.2, uz - 0.2, ux + 0.2, uz + 0.2, 'deco'); }
    B.area('東濱海水浴場', [WX(945), zB0, X0 + 5, zB1]); B.label('東濱海水浴場', X0 - 6, (zB0 + zB1) / 2);
    // ---- 東鶴漁港：兩座碼頭（木棧板）、漁船、防波堤、紅白燈塔、魚市場的棚子 ----
    const xe = WX(998), boats = [];
    PIERS.forEach(([a, b], i) => {
      const za = WZ(a), zb = WZ(b), cz = (za + zb) / 2;
      B.box(M('concD'), X0 - 0.2, -1.8, za + 0.3, xe, -0.2, zb - 0.3); B.plaza(X0 - 0.2, za, xe, zb, 'planks', { noCurb: true }); ok.push([X0 - 1, za, xe, zb]);
      for (let x = X0 + 1; x < xe; x += 2.2) [za + 0.3, zb - 0.3].forEach(z => P(g.cyl8, M('black'), x, 0.35, z, 0.25, 0.4, 0.25));
      for (let x = X0 + 1; x < xe; x += 3) [za + 0.2, zb - 0.2].forEach(z => P(g.cyl8, M('woodD'), x, -0.9, z, 0.3, 1.6, 0.3));
      [[X0 + 5, za - 1.4, ['#3A6A9A', '#C8A040'][i]], [X0 + 9.5, zb + 1.4, ['#9A968E', '#3A8A5A'][i]]].forEach(([x, z, col]) => {
        const bt = CK.makeShip('fishing', { col, L: 7.5 + i });   // 2026-10-22 船重做（shipkit.js）
        bt.position.set(x, -1.2, z); bt.rotation.y = rnd() < 0.5 ? 0 : Math.PI; B.group.add(bt); boats.push({ bt, ph: rnd() * 6 });
      });
    });
    { const bw0 = WZ(BREAK[0]), bw1 = WZ(BREAK[1]), bxe = WX(999), lhx = WX(996), lhz = (bw0 + bw1) / 2;
      B.box(M('concD'), X0 - 0.2, -1.8, bw0, bxe, -0.1, bw1); B.plaza(X0 - 0.2, bw0, bxe, bw1, 'conc', { noCurb: true }); ok.push([X0 - 1, bw0, bxe, bw1]);
      B.box(M('concD'), X0, 0.12, bw1 - 0.5, bxe - 2, 1.0, bw1); B.solid(X0, bw1 - 0.5, bxe - 2, bw1, 'wall');   // 外海那一側的胸牆
      P(g.cyl, M('white'), lhx, 3.6, lhz, 1.5, 7, 1.5); [2.2, 4.6].forEach(y => P(g.cyl, M('red'), lhx, 0.1 + y, lhz, 1.62, 0.6, 1.62));
      P(g.cyl, CK.mat('dhLhLamp', { col: '#FFE8A0', em: '#FFE8A0', ei: 0.4, lamp: true, snow: 0 }), lhx, 7.5, lhz, 1.2, 0.8, 1.2); P(g.cone, M('red'), lhx, 8.3, lhz, 1.7, 0.8, 1.7);
      B.solid(lhx - 0.9, lhz - 0.9, lhx + 0.9, lhz + 0.9, 'deco');
      // 晚上轉的光
      const beam = new TH.Mesh(new TH.PlaneGeometry(26, 1.4), new TH.MeshBasicMaterial({ color: '#FFF0C0', transparent: true, opacity: 0.22, depthWrite: false, side: TH.DoubleSide, fog: false })); beam.geometry.translate(13, 0, 0); beam.position.set(lhx, 7.5, lhz); beam.visible = false; B.group.add(beam);
      tw.anim.push((dt, t) => { const on = ((tw.L && tw.L.lampK) || 0) > 0.3; beam.visible = on; if (on) beam.rotation.y = t * 0.8; });
      tw.inter.forEach(it => { const l = lbl(it); if (/^在燈塔下看海|^觀光景點：東鶴燈塔/.test(l) && Math.abs(it.z - WZ(937.5)) < 3) it.z += lhz - WZ(937.5); });   // 收下來的位置是舊的防波堤
    }
    { const [fx, fy] = C.FAC.fishMarket, [fw, fd] = C.FS.fishMarket, cx = WX(fx), cz = WZ(fy), w = fw * S, d = fd * S;
      B.plaza(cx - w / 2, cz - d / 2, cx + w / 2, cz + d / 2, 'conc', { noCurb: true });
      [-1, 1].forEach(sd => P(g.box, M('corr', { col: '#3E4E60' }), cx, 3.35, cz + sd * (d / 4 + 0.15), w + 0.8, 0.18, d / 2 + 0.6, sd * 0.22, 0, 0)); B.box(M('steelD'), cx - w / 2 - 0.45, 3.55, cz - 0.15, cx + w / 2 + 0.45, 3.7, cz + 0.15);
      for (let x = cx - w / 2; x <= cx + w / 2 + 0.01; x += w / 4) [cz - d / 2 + 0.3, cz + d / 2 - 0.3].forEach(z => { P(g.box, M('steelD'), x, 1.6, z, 0.2, 3.2, 0.2); B.solid(x - 0.15, z - 0.15, x + 0.15, z + 0.15, 'deco'); });
      for (let i = 0; i < 6; i++) { const bx = cx - w / 2 + 1.6 + (i % 3) * (w - 3.2) / 2, bz = cz - d / 4 + Math.floor(i / 3) * d / 2; B.box(M('blue'), bx - 0.8, 0.12, bz - 0.45, bx + 0.8, 0.82, bz + 0.45); B.box(own('#E8F2F8', { rough: 0.2 }), bx - 0.7, 0.82, bz - 0.35, bx + 0.7, 0.86, bz + 0.35); for (let f = 0; f < 3; f++) P(g.box, own(['#9AA8B8', '#C88A6A', '#7A8A9A'][f]), bx - 0.4 + f * 0.4, 0.9, bz, 0.3, 0.08, 0.55); B.solid(bx - 0.8, bz - 0.45, bx + 0.8, bz + 0.45, 'deco'); }
      B.box(M('blue'), cx - w * 0.3, 3.1, cz + d / 2 + 0.3, cx + w * 0.3, 3.6, cz + d / 2 + 0.36);
      B.person(cx + 1, cz + d / 2 - 1.2, 0); B.label('東鶴魚市場', cx, cz);
    }
    B.area('東鶴漁港', [X0 - 30, WZ(820), WX(1000), WZ(1000)]); B.label('東鶴漁港', X0 - 4, WZ(880));
    // ---- 跨海的鐵橋（鐵路一路通到港區外面） ----
    { const RL = C.RAIL, z0 = WZ(RL.y0 + 4), z1 = WZ(RL.y1 - 4);
      B.box(M('concD'), X0 - 1, -0.5, z0, RAIL_X1, -0.02, z1); for (let x = X0 + 4; x < RAIL_X1; x += 10) B.box(M('concD'), x - 0.6, -2.4, z0 + 1, x + 0.6, -0.5, z1 - 1);
      [z0, z1].forEach(z => B.box(M('steelD'), X0, 0, z - 0.06, RAIL_X1, 1.1, z + 0.06)); }
    // ---- 東鶴港：填出來的埠頭 ----
    Object.keys(HB).forEach(k => {
      const [a, c, b, d] = hr(k), bw = k.indexOf('bw') === 0;
      B.box(M('concD'), a, -2.2, c, b, -0.02, d); B.plaza(a, c, b, d, 'concD', { noCurb: true }); ok.push([a, c, b, d]);
      if (bw) return;
      for (let x = a + 4; x < b - 1; x += 9) [c + 0.5, d - 0.5].forEach(z => P(g.cyl8, M('black'), x, 0.4, z, 0.35, 0.5, 0.35));
      for (let z = c + 3; z < d - 1; z += 8) P(g.cyl8, M('black'), b - 0.5, 0.4, z, 0.35, 0.5, 0.35);
      [c, d].forEach(z => B.box(M('rubber'), a + 1, -0.6, z + (z === c ? -0.2 : 0), b, 0.1, z + (z === c ? 0 : 0.2)));
    });
    // 外防波堤的胸牆
    { const [a, c, b, d] = hr('bwOut'); B.box(M('concD'), b - 0.6, 0.12, c, b, 1.2, d); B.solid(b - 0.6, c, b, d, 'wall'); }
    const CC = ['#C8323A', '#2E5A8A', '#3A8A5A', '#E0A030', '#8A8A92', '#6A3A8A', '#C86A2A', '#2E8A8A'];
    { const [a, c, b, d] = hr('cargo');
      B.box(M('asph'), a + 2, 0.12, c + 3, b - 2, 0.14, d - 5);
      for (let x = a + 10; x < b - 6; x += 12) B.box(M('lineY'), x - 2.5, 0.14, c + 8.9, x + 2.5, 0.15, c + 9.1);
      // 貨櫃：一排排疊一到三層
      for (let row = 0; row < 9; row++) for (let col = 0; col < 18; col++) {
        const x = a + 18 + col * 7.2, z = c + 22 + row * 2.9 + (row > 4 ? 4 : 0); if (x > b - 14) continue;
        const h = 1 + Math.floor(rnd() * 3); for (let k = 0; k < h; k++) P(g.box, M('corr', { col: CC[Math.floor(rnd() * CC.length)] }), x, 0.14 + 1.3 + k * 2.62, z, 6, 2.6, 2.44);
      }
      B.solid(a + 14, c + 20, b - 10, c + 22 + 9 * 2.9 + 4, 'deco');
      for (let row = 0; row < 9; row++) { const z = c + 22 + row * 2.9 + (row > 4 ? 4 : 0); B.foot([a + 15, z - 1.22, Math.min(b - 14, a + 18 + 17 * 7.2) + 3, z + 1.22], 'factory', 2); }   // 小地圖：一排排的貨櫃（高度 2：晚上窗戶的光不灑在貨櫃旁邊，ckpix.js）
      // 起重機（紅白的門架，懸臂伸到船上；頂上的紅燈會閃）
      const blink = [];
      [0.22, 0.47, 0.72].forEach(fx => {
        const x = a + (b - a) * fx, z0 = c + 3, z1 = c + 15;
        [x - 7, x + 7].forEach(lx => [z0, z1].forEach(lz => { B.box(M('red'), lx - 0.5, 0, lz - 0.5, lx + 0.5, 22, lz + 0.5); B.solid(lx - 0.6, lz - 0.6, lx + 0.6, lz + 0.6, 'deco'); }));
        [z0, z1].forEach(lz => B.box(M('white'), x - 7.5, 21.8, lz - 0.6, x + 7.5, 23.2, lz + 0.6)); B.foot([x - 7.5, z0 - 0.5, x + 7.5, z1 + 0.5], 'tower', 2);   // 小地圖：起重機
        B.box(M('red'), x - 1.1, 24.2, (z0 + z1) / 2 - 39, x + 1.1, 25.8, (z0 + z1) / 2 + 11); B.box(M('white'), x - 2, 22.3, z1 - 4, x + 2, 25.3, z1); B.box(M('steelD'), x - 1.3, 20.7, z0 - 9.2, x + 1.3, 22.3, z0 - 6.8);
        P(g.cyl8, M('steelD'), x, 22.9, z0 - 8, 0.06, 2.2, 0.06);
        blink.push(mesh(g.sph, own('#FF3A2A', { em: '#FF3A2A', ei: 2 }), x, 26.2, (z0 + z1) / 2 - 38, 0.8, 0.8, 0.8));
      });
      tw.anim.push((dt, t) => { const on = Math.floor(t * 1.2) % 2 === 0; blink.forEach(L => { L.visible = on; }); });
      // 大貨輪（靠在埠頭北邊）
      B.ship('cargo', a + 95, c - 9, 0, { y: -1.2, L: 100, col: '#2A2A30', funnel: '#C8323A', stripe: '#F2F0EA', boxes: CC, seed: 3, solid: false });   // 2026-10-22 船重做（shipkit.js）
      // 港務局（港區的入口）
      B.bld({ r: [a + 2, c + 23, a + 12, c + 31], h: 10, style: 'office', face: 'n', col: '#C8C4BC', name: '東鶴港務局', signCol: ['#2E3A48', '#FFFFFF'] });   // 原本在 c+2～c+10，壓在國道一號通進港區的路口
      tw.inter.forEach(it => { if (/^東鶴港務局/.test(lbl(it))) { it.x = a + 7; it.z = c + 21.5; } });
      // 紅燈塔（貨櫃埠頭的東南角）
      lighthouse(b - 2, d - 2, '#C8323A');
    }
    function lighthouse(x, z, col) {
      P(g.cyl, own(col), x, 4.5, z, 1.9, 9, 1.9); B.box(M('steelD'), x - 1.1, 9.25, z - 1.1, x + 1.1, 9.55, z + 1.1);
      P(g.cyl8, CK.mat('dhHbLamp' + col, { col: col === '#C8323A' ? '#FF5A4A' : '#FFF4C8', em: col === '#C8323A' ? '#FF5A4A' : '#FFF4C8', ei: 0.3, lamp: true, snow: 0 }), x, 10.2, z, 1.4, 1, 1.4); P(g.cone, M('steelD'), x, 11.1, z, 1.9, 0.9, 1.9);
      B.solid(x - 1.3, z - 1.3, x + 1.3, z + 1.3, 'deco');
    }
    { const [a, , b, d] = hr('bwOut'); lighthouse((a + b) / 2 - 0.3, d - 2, '#F2F0EA'); }
    // 客船埠頭：航站、往北州的渡輪
    { const [a, c, , d] = hr('ferry'), m = (c + d) / 2;
      B.bld({ r: [a + 5.8, m - 8, a + 27.8, m + 8], h: 7, style: 'glass', face: 's', col: '#9AB8C8', name: '東鶴港客船航站', signCol: ['#2E5A8A', '#FFFFFF'] });
      B.ship('ferry', a + 77.8, c - 7, 0, { y: -1.2, L: 68, col: '#F2F0EA', stripe: '#2E5A9A', funnel: '#2E5A9A', solid: false }); }   // 2026-10-22 船重做（shipkit.js）：往北州的渡輪
    // 中央埠頭：兩棟紅磚倉庫
    { const [a, c, , d] = hr('mid'), m = (c + d) / 2;
      [a + 22.8, a + 58.8].forEach(x => B.bld({ r: [x - 14, m - 9, x + 14, m + 9], h: 8, style: 'brick', face: 's', col: '#9A4A36', roof: 'flat' })); }
    // 拖船（港灣裡繞圈）、外海等著進港的貨輪
    const tugs = [];
    [[X0 + 200, -20, 16, 0.12], [X0 + 170, -78, 12, -0.16]].forEach(([cx, cz, r, sp]) => { const t = CK.makeShip('tug', { col: '#C8323A', funnel: '#2A2A30', stripe: '#F2F0EA' }); B.group.add(t); tugs.push({ t, cx, cz, r, sp, a: rnd() * 6 }); });
    B.ship('cargo', X0 + 330, -30, 0.3, { y: -1.2, L: 112, col: '#3A4A5A', funnel: '#2E5A9A', seed: 9, solid: false });   // 外海等著進港的貨輪
    tw.anim.push((dt, t) => {
      boats.forEach(o => { o.bt.position.y = -1.2 + Math.sin(t * 1.1 + o.ph) * 0.08; o.bt.rotation.z = Math.sin(t * 0.9 + o.ph) * 0.04; });
      tugs.forEach(o => { o.a += dt * o.sp; o.t.position.set(o.cx + Math.cos(o.a) * o.r, -1.2 + Math.sin(t * 1.3 + o.r) * 0.06, o.cz + Math.sin(o.a) * o.r); o.t.rotation.y = -o.a + (o.sp > 0 ? 0 : Math.PI); });
    });
    B.area('東鶴港', [X0, -100, X0 + 262, 146]); B.label('東鶴港', X0 + 120, 20, 1);
    // ---- 海：走得上去的地方以外全部擋住（照 z 切成一條條，每條扣掉碼頭、埠頭） ----
    { const xa = X0 - 0.3, xb = walk[2] + 1, zs = new Set([walk[1] - 1, walk[3] + 1]); ok.forEach(r => { zs.add(r[1]); zs.add(r[3]); });
      const Z = [...zs].sort((p, q) => p - q);
      for (let i = 0; i < Z.length - 1; i++) {
        const za = Z[i], zb = Z[i + 1], zm = (za + zb) / 2; if (zb - za < 1e-3) continue;
        const cuts = ok.filter(r => zm > r[1] && zm < r[3]).map(r => [r[0], r[2]]).sort((p, q) => p[0] - q[0]);
        let x = xa; cuts.forEach(([p, q]) => { if (p > x) R.addBox(x, p, za, zb, 'water'); x = Math.max(x, q); }); if (x < xb) R.addBox(x, xb, za, zb, 'water');
      } }
  }

  CK.define({
    id: 'donghe', name: '東鶴', seed: 1433, stationName: '東鶴站', fog: 1.1, sea: true,
    land: [[-700, -700], [WX(C.COAST || 975), -700], [WX(C.COAST || 975), 700], [-700, 700]],
    walk: [WX(0) - 3, WZ(40), X0 + 265, WZ(998)], spawn: [WX((C.PLAZA[0] + C.PLAZA[2]) / 2), WZ(C.PLAZA[1] + 12), 0], camYaw: 0,
    banner: '',
    plaza: [WX((C.PLAZA[0] + C.PLAZA[2]) / 2), WZ((C.PLAZA[1] + C.PLAZA[3]) / 2)], plazaName: '站前廣場',
    gossip: ['「西市口的糰子攤，今天的醬油糰子特別香。」', '「德克斯凡的魔導路燈，晚上比月亮還亮。」', '「北門外面的外濠，冬天會結一層薄冰。」', '「議會選舉快到了，海報貼得到處都是。」', '「站前商店街的拱廊，下雪天走起來最舒服。」'],
    guards: [[WX(312), WZ(92), 0], [WX(452), WZ(902), Math.PI], [WX(296), WZ(248), 0]],
    patrols: [[[WX(220), WZ(456)], [WX(640), WZ(456)]], [[WX(330), WZ(132)], [WX(330), WZ(240)]], [[WX(344), WZ(500)], [WX(344), WZ(740)]]],
    alleys: [rectW([404, 566, 532, 578]), rectW([620, 684, 740, 692]), rectW([404, 752, 736, 764])],
    brawl: [[WX(236), WZ(318)], [WX(520), WZ(900)]],
    // 平交道：任何一節車廂離平交道 40 公尺內（而且在軌道上）就放下柵欄；站在軌道上被電車推開
    tick(dt, tw, P) {
      const X = tw.xings; if (!X || !X.length || !tw.trains) return;
      const zr = WZ(C.RAIL.y), cars = []; tw.trains.forEach(tr => tr.cars.forEach(g => cars.push(g.position)));
      let ring = false; tw._xt = (tw._xt || 0) + dt;
      X.forEach(c => {
        const on = cars.some(q => Math.abs(q.z - zr) < 8 && Math.abs(q.x - c.x) < 40);
        c.k = Math.max(0, Math.min(1, c.k + (on ? dt : -dt) / 1.4));
        c.arms.forEach(({ piv, sd }) => { piv.rotation.z = -sd * Math.PI / 2 * (1 - c.k); });
        const blink = Math.floor(tw._xt * 2.4) % 2;
        c.lamps.forEach((lm, i) => { lm.material.emissiveIntensity = on ? ((i % 2 === 0) === !!blink ? 2 : 0.05) : 0; });
        c.boxes.forEach(b => { b.on = c.k > 0.6; });
        if (on && P && Math.abs(P.x - c.x) + Math.abs(P.z - zr) < 45) ring = true;
      });
      tw._bell = (tw._bell || 0) - dt; if (ring && tw._bell <= 0) { tw._bell = 0.55; R.sfx && R.sfx('crossing'); }
      if (P) cars.forEach(q => { if (Math.abs(P.x - q.x) < 9.5 && Math.abs(P.z - q.z) < 1.7) { const sd = P.z >= q.z ? 1 : -1; P.z = q.z + sd * 1.8; tw._hit = (tw._hit || 0) - dt; if (tw._hit <= 0) { tw._hit = 3; R.toast && R.toast('電車經過！差點被撞到。'); R.shake && R.shake(0.3); } } });
    },
    mapNote: '北邊靠山的是舊城（城牆、外濠圍著），鶴川從北山斜斜穿過城中間流進東鶴港；河東是官廳街，南邊是鐵路、東鶴站和站前，東南角是漁港。',
    firstTip: '東鶴換成精緻版了：照原本的地圖蓋的，店都走得進去，Tab 看地圖。電腦跑不動的話，暫停選單可以換回像素版。',
    build(B) {
      const M = CK.M, g = B.g, P = B.part, rnd = B.rnd, rr = B.rr, pk = B.pk, tw = W.town;
      // 收下來的互動（門口、院子裡的東西）落在房子裡面的話，把最靠近它的那一面牆往內縮，讓出 1.6 公尺（房子至少留一半）
      const HP = CK._dongheH ? CK._dongheH.inter.filter(it => !it.follow).map(it => [it.x, it.z]).concat(CK._dongheH.npcs.map(n => [n.x, n.z])) : [];
      const clearOf = r0 => { const r = r0.slice(); HP.forEach(([x, z]) => { if (x < r[0] - 0.6 || x > r[2] + 0.6 || z < r[1] - 0.6 || z > r[3] + 0.6) return; const d = [x - r[0], r[2] - x, z - r[1], r[3] - z], k = d.indexOf(Math.min(...d)), W0 = r0[2] - r0[0], D0 = r0[3] - r0[1];
        if (k === 0 && r0[2] - (x + 1.6) >= W0 / 2) r[0] = Math.max(r[0], x + 1.6); else if (k === 1 && (x - 1.6) - r0[0] >= W0 / 2) r[2] = Math.min(r[2], x - 1.6); else if (k === 2 && r0[3] - (z + 1.6) >= D0 / 2) r[1] = Math.max(r[1], z + 1.6); else if (k === 3 && (z - 1.6) - r0[1] >= D0 / 2) r[3] = Math.min(r[3], z - 1.6); }); return r; };
      const bld0 = B.bld; B.bld = o => (o && o.r && HP.length && !B.Bt.getFrame() ? bld0(Object.assign({}, o, { r: clearOf(o.r) })) : bld0(o));
      // ---------- 地面 ----------
      (C.FIELDS || []).forEach(r => B.zone(rectW(r), 'soil', 0.02));
      (C.GREENS || []).forEach(r => B.zone(rectW(r), 'grass', 0.02));
      (C.PARKS || []).forEach(r => { B.zone(rectW(r), 'grass', 0.02); const q = rectW(r); B.trees([q[0] + 2, q[1] + 2, q[2] - 2, q[3] - 2], Math.max(2, Math.round((q[2] - q[0]) * (q[3] - q[1]) / 120)), () => (rnd() < 0.6 ? 'pine' : 'round'), 1); });
      { const Z = C.Z || {}; if (Z.school) { B.zone(rectW(Z.school), 'gravel', 0.02); } if (Z.park) B.zone(rectW(Z.park), 'grass', 0.02); if (Z.grove) { B.zone(rectW(Z.grove), 'grass', 0.02); const q = rectW(Z.grove); B.trees(q, 18, () => (rnd() < 0.5 ? 'cedar' : 'round'), 1.1); } if (Z.grave) B.zone(rectW(Z.grave), 'gravel', 0.02); if (Z.ruins) B.zone(rectW(Z.ruins), 'soil', 0.02); if (Z.market) B.plaza(...rectW(Z.market), 'asph'); }
      // 西市口（橢圓的廣場）
      if (C.SQUARE) { const [cx, cy, rx, ry] = C.SQUARE, pts = []; for (let i = 0; i < 28; i++) { const a = i / 28 * Math.PI * 2; pts.push([WX(cx + Math.cos(a) * rx), WZ(cy + Math.sin(a) * ry)]); } B.zone(pts, 'gran', 0.03); }
      // ---------- 路 ----------
      C.roads.forEach(rd => { const k = RK[rd.kind] || RK.lane; if (rd.pts.length < 2) return; B.street(rd.pts.map(w2), { w: k[0] * S, sw: k[1] * S, kind: rd.kind === 'arcade' ? 'arcade' : rd.kind, name: rd.name || '', line: rd.kind === 'main' ? 'y' : rd.kind === 'sub' ? 'w' : 'none' }); });
      // 拱廊（站前商店街）的屋頂
      C.roads.filter(r => r.kind === 'arcade').forEach(rd => { const a = w2(rd.pts[0]), b = w2(rd.pts[rd.pts.length - 1]), z = (a[1] + b[1]) / 2, half = RK.arcade[0] * S / 2, roofM = CK.mat('dhArcade', { col: '#D8E6EE', op: 0.3, side: 1, rough: 0.2, snow: 0 }); B.box(roofM, Math.min(a[0], b[0]), 6.6, z - half, Math.max(a[0], b[0]), 6.75, z + half); for (let x = Math.min(a[0], b[0]); x <= Math.max(a[0], b[0]); x += 6) [-1, 1].forEach(sd => B.box(M('steelD'), x - 0.1, 0, z + sd * (half - 0.2) - 0.1, x + 0.1, 6.7, z + sd * (half - 0.2) + 0.1)); });
      // ---------- 水、橋、海 ----------
      waterPolys().forEach(poly => B.water(poly, { level: -1.4, bank: 'ishi' }));
      (C.bridges || []).forEach(b => {
        if (!b.ok) return; const ax = Math.abs(Math.cos(b.ang)) > Math.abs(Math.sin(b.ang)), hl = b.len / 2, hw = b.wid / 2;
        const r = ax ? [WX(b.sx - hl), WZ(b.sy - hw), WX(b.sx + hl), WZ(b.sy + hw)] : [WX(b.sx - hw), WZ(b.sy - hl), WX(b.sx + hw), WZ(b.sy + hl)];
        B.bridge(r[0], r[1], r[2], r[3], { road: true, axis: ax ? 'x' : 'z', mat: b.kind === 'stream' && b.wid < 14 ? 'woodD' : 'asph', railMat: b.kind === 'moat' ? 'ishi' : 'conc', deck: 0.12 });
        if (b.name) B.label(b.name, (r[0] + r[2]) / 2, (r[1] + r[3]) / 2);
      });
      // ---------- 鐵路、東鶴站、站前廣場 ----------
      { const RL = C.RAIL, x0 = WX(-60), x1 = WX((C.COAST || 975) - 4);
        RL.t.forEach((t, i) => B.rail([[x0, WZ(t)], [RAIL_X1, WZ(t)]], { col: i ? '#3E7A48' : '#C8C0A8', stripe: i ? '#F4F0E6' : '#2E5A9A', cars: 4, v: 13 }));
        B.bridge(WX(C.BRIDGE[0] - 2), WZ(RL.y0), WX(C.BRIDGE[1] + 2), WZ(RL.y1), { axis: 'x', mat: 'concD', railMat: 'steelD', deck: 0.12 });   // 鐵橋
        // 柵欄（平交道留缺口）
        [RL.fn, RL.fs].forEach(y => { let a = x0; (C.CROSS || []).slice().sort((p, q) => p - q).concat([1e9]).forEach(cx => { const b = Math.min(x1, cx === 1e9 ? x1 : WX(cx - 14)); if (b > a + 2) B.fence(a, WZ(y) - 0.05, b, WZ(y) + 0.05, 1.2, 'steelD'); a = cx === 1e9 ? x1 : WX(cx + 14); }); });
        // 平交道（2026-10-26 修正：原本只是擺著不會動的桿子）：電車快到了柵欄放下、紅燈交互閃、噹噹響，柵欄放下時過不去（tick 裡動）
        tw.xings = [];
        { const TH = THREE, armM = CK.mat('xingArm', { col: '#F2D21A', rough: 0.5 }), poleM = M('black'), stripeM = M('black');
          (C.CROSS || []).forEach(cx => {
            const rd = C.roads.find(q => q.kind !== 'arcade' && q.kind !== 'dirt' && q.pts.some(pt => Math.abs(pt[0] - cx) < 3)), hw = ((rd ? rd.w : 15) / 2) * S, x = WX(cx), c = { x, k: 0, arms: [], lamps: [], boxes: [] };
            [[x + hw + 0.4, WZ(RL.fs + 1), 1], [x - hw - 0.4, WZ(RL.fn - 1), -1]].forEach(([px, pz, sd]) => {
              P(g.box, poleM, px, 1.6, pz, 0.14, 3.2, 0.14); P(g.box, M('steelD'), px, 0.35, pz, 0.4, 0.7, 0.4);
              [0.6, -0.6].forEach(r => P(g.box, M('white'), px, 2.95, pz, 0.95, 0.12, 0.04, 0, 0, r));   // 叉叉的標誌
              [-0.22, 0.22].forEach(o => { const lm = new TH.Mesh(new TH.BoxGeometry(0.22, 0.22, 0.1), new TH.MeshStandardMaterial({ color: '#4A1A18', emissive: '#FF2A1A', emissiveIntensity: 0 })); lm.position.set(px + o, 2.35, pz + sd * 0.1); B.group.add(lm); c.lamps.push(lm); });
              const piv = new TH.Group(); piv.position.set(px, 1.0, pz); B.group.add(piv);
              const L = hw * 2 + 0.3, arm = new TH.Mesh(new TH.BoxGeometry(L, 0.1, 0.1), armM); arm.position.x = -sd * L / 2; piv.add(arm);
              for (let i = 0; i < Math.floor(L / 1.2); i++) { const st = new TH.Mesh(new TH.BoxGeometry(0.4, 0.11, 0.11), stripeM); st.position.x = -sd * (0.6 + i * 1.2); piv.add(st); }
              piv.rotation.z = -sd * Math.PI / 2; c.arms.push({ piv, sd });
              const bx = R.addBox(x - hw, x + hw, pz - 0.15, pz + 0.15, 'deco'); if (bx) { bx.on = false; c.boxes.push(bx); }
            });
            tw.xings.push(c);
          }); }
        // 車：柵欄放下（或正在放下）的時候，停在柵欄前面；已經在軌道上的照開出去
        { const zn = WZ(RL.fn - 1), zs = WZ(RL.fs + 1); tw.carStop = (x, z, ux, uz) => { if (z > zn && z < zs) return false; return tw.xings.some(c => c.k > 0.05 && Math.abs(x - c.x) < 9 && [zn, zs].some(zb => { const al = (zb - z) * uz; return Math.abs(uz) > 0.5 && al > 0.5 && al < 9; })); }; }
        // 月台、雨棚
        const pl = rectW(C.PLAT); B.box(M('conc'), pl[0], 0, pl[1], pl[2], 0.9, pl[3]); B.solid(pl[0], pl[1], pl[2], pl[3], 'house');
        B.box(M('roofG'), pl[0] + 2, 3.8, pl[1] + 0.2, pl[2] - 2, 4.05, pl[3] - 0.2); for (let x = pl[0] + 4; x < pl[2] - 2; x += 8) B.box(M('steelD'), x - 0.1, 0.9, (pl[1] + pl[3]) / 2 - 0.1, x + 0.1, 3.8, (pl[1] + pl[3]) / 2 + 0.1);
        B.sign('東鶴', 's', pl[3], (pl[0] + pl[2]) / 2, 2.4, { size: 0.7, bg: '#F4F4F8', fg: '#1A2A5A', box: 1 });
        // 站房
        const st = rectW(C.STATION); B.bld({ r: st, h: 8.5, style: 'office', face: 's', col: '#D8D4CC', top: false }); if (CK.H && CK.H.stationRoof) CK.H.stationRoof(B, st[0], st[1], st[2], st[3], 8.5, 's');   /* 2026-10-26：屋頂（civickit.js） */
        B.sign('東鶴站', 's', st[3], (st[0] + st[2]) / 2, 6.4, { size: 1.3, bg: '#1A2A5A', fg: '#FFFFFF', box: 1, lit: 1 });
        B.box(M('glassL'), st[0] + 4, 3.6, st[3], st[2] - 4, 3.75, st[3] + 3); B.box(M('shopLit'), st[0] + 5, 0.3, st[3] - 0.02, st[2] - 5, 3.2, st[3] + 0.05);
        const pz = rectW(C.PLAZA); B.plaza(pz[0], pz[1], pz[2], pz[3], 'gran');
        B.label('東鶴站', (st[0] + st[2]) / 2, (st[1] + st[3]) / 2, 1);
      }
      // ---------- 舊城的城牆、城門 ----------
      { const [x0, y0, x1, y1] = C.OLD.map((v, i) => (i % 2 ? WZ(v) : WX(v))), th = 1.3, H = 4.6, gw = (C.GW || 22) * S / 2;
        const gaps = { n: (C.GATES.n || []).map(v => WX(v)), s: (C.GATES.s || []).map(v => WX(v)), w: (C.GATES.w || []).map(v => WZ(v)), e: (C.GATES.e || []).map(v => WZ(v)) };
        const wall = (a0, a1, c, along, side) => { let a = a0; gaps[side].slice().sort((p, q) => p - q).concat([1e9]).forEach(gc => { const b = gc === 1e9 ? a1 : gc - gw; if (b > a + 0.5) { if (along === 'x') { B.box(M('ishi'), a, 0, c - th, b, H, c + th); B.box(M('kerb'), a, H, c - th - 0.1, b, H + 0.25, c + th + 0.1); B.solid(a, c - th, b, c + th, 'wall'); } else { B.box(M('ishi'), c - th, 0, a, c + th, H, b); B.box(M('kerb'), c - th - 0.1, H, a, c + th + 0.1, H + 0.25, b); B.solid(c - th, a, c + th, b, 'wall'); } } if (gc !== 1e9) { a = gc + gw; if (along === 'x') B.yaguraGate(gc, c, 0, gw * 2, H, { d: th * 2 + 1.2 }); else B.yaguraGate(c, gc, Math.PI / 2, gw * 2, H, { d: th * 2 + 1.2 }); } }); };
        wall(x0, x1, y0, 'x', 'n'); wall(x0, x1, y1, 'x', 's'); wall(y0, y1, x0, 'z', 'w'); wall(y0, y1, x1, 'z', 'e');
        B.label('舊城', (x0 + x1) / 2, (y0 + y1) / 2 + 20, 1);
      }
      // ---------- 房子（city.js 排好的每一塊地） ----------
      C.lots.forEach((l, i) => {
        const r = rectW(l.r), face = FACE[l.f] || 's', t = l.type, col = l.col;
        if (r[2] - r[0] < 2 || r[3] - r[1] < 2) return;
        if (t === 'parking') { B.plaza(r[0], r[1], r[2], r[3], 'asph', { noCurb: true }); const ax = r[2] - r[0] > r[3] - r[1]; for (let a = (ax ? r[0] : r[1]) + 2.5; a < (ax ? r[2] : r[3]) - 1; a += 2.6) { if (ax) P(g.box, M('lineW'), a, 0.13, (r[1] + r[3]) / 2, 0.1, 0.01, (r[3] - r[1]) * 0.7); else P(g.box, M('lineW'), (r[0] + r[2]) / 2, 0.13, a, (r[2] - r[0]) * 0.7, 0.01, 0.1); } return; }
        if (t === 'garden') { B.zone(r, 'grass', 0.02); B.trees([r[0] + 1, r[1] + 1, r[2] - 1, r[3] - 1], 2 + (i % 3), () => (rnd() < 0.5 ? 'pine' : 'round'), 0.9); return; }
        if (t === 'vacant') { B.zone(r, 'soil', 0.02); return; }
        const o = { r, face, col };
        if (t === 'oldhouse') Object.assign(o, { style: 'machiya', h: l.floors === 1 ? 3.6 : 6.2 }, l.shop ? { name: OLDSHOP[i % OLDSHOP.length] } : {});
        else if (t === 'kura') Object.assign(o, { style: 'kura', h: 6 });
        else if (t === 'house') Object.assign(o, { style: 'house', h: (l.floors || 2) * 2.9 + 0.4 });
        else if (t === 'shop') Object.assign(o, { style: 'shop', h: l.low ? 3.8 : 6.6, name: l.name, signCol: [l.sc || '#2A2A30', '#F4ECD8'], awnCol: l.awn, roof: 'flat' });
        else if (t === 'midrise') Object.assign(o, { style: i % 2 ? 'apt' : 'office', h: (l.floors || 3) * 3.1, ad: i % 5 === 0 });
        else if (t === 'office') Object.assign(o, { style: 'office', h: (l.floors || 3) * 3.4 });
        else if (t === 'conbini') Object.assign(o, { style: 'shop', h: 3.8, name: '德克斯凡便利商店', signCol: ['#1E3A5A', '#FFFFFF'], roof: 'flat', top: false });
        else if (t === 'clinic') Object.assign(o, { style: 'house', h: 6.2, name: '內科診所', roof: 'flat' });
        else if (t === 'apt') Object.assign(o, { style: 'apt', h: (l.floors || 2) * 2.9 });
        else if (t === 'warehouse') Object.assign(o, { style: 'factory', h: 6.5, top: false });
        else if (t === 'factory') Object.assign(o, { style: 'factory', h: 9, top: false });
        else if (t === 'farm') Object.assign(o, { style: 'house', h: 5, roof: 'gable' });
        else Object.assign(o, { style: 'house', h: 6 });
        B.bld(o);
        if (t === 'factory') B.chimney(r[0] + 2, r[1] + 2, 16, { r: 0.8 });
      });
      // ---------- 設施 ----------
      Object.keys(FAC).forEach(k => {
        const p = C.FAC[k], sz = C.FS && C.FS[k], f = FAC[k]; if (!p || typeof p[0] !== 'number') return;
        const a = (C.FACE && C.FACE[k]) || 0, side = Math.abs(Math.sin(a)) > 0.5, face = a > 0.5 ? 'e' : a < -0.5 ? 'w' : 's';
        const wu = sz ? (side ? sz[1] : sz[0]) - 3 : 10, du = sz ? (side ? sz[0] : sz[1]) - 3 : 8, cx = WX(p[0]), cz = WZ(p[1]), hw = wu * S / 2, hd = du * S / 2, r = [cx - hw, cz - hd, cx + hw, cz + hd];
        if (f.prop === 'board') { P(g.box, M('woodB'), cx - 1.1, 1.1, cz, 0.2, 2.2, 0.2); P(g.box, M('woodB'), cx + 1.1, 1.1, cz, 0.2, 2.2, 0.2); P(g.box, M('woodD'), cx, 1.7, cz, 2.6, 1.3, 0.12); for (let i = 0; i < 5; i++) P(g.box, M('white'), cx - 0.9 + i * 0.45, 1.7 + (i % 2 ? 0.2 : -0.2), cz + 0.08, 0.5, 0.55, 0.02); B.solid(cx - 1.3, cz - 0.2, cx + 1.3, cz + 0.2, 'deco'); return; }
        if (f.prop === 'news') { P(g.box, M('woodB'), cx, 1.2, cz, 2.4, 2.4, 0.16); P(g.box, M('white'), cx, 1.35, cz + 0.09, 2.1, 1.6, 0.02); B.solid(cx - 1.2, cz - 0.15, cx + 1.2, cz + 0.15, 'deco'); return; }
        if (f.prop === 'clockPillar') { P(g.box, M('steelD'), cx, 2.4, cz, 0.4, 4.8, 0.4); P(g.cyl24, M('white'), cx, 5.1, cz, 1.4, 0.3, 1.4, Math.PI / 2, 0, 0); B.solid(cx - 0.3, cz - 0.3, cx + 0.3, cz + 0.3, 'deco'); return; }
        if (f.stall) { B.box(M('woodD'), cx - 1.6, 0, cz - 0.8, cx + 1.6, 0.9, cz + 0.8); B.box(CK.mat('dhStallRoof', { col: '#C83A3A', tex: 'paint', rough: 0.8 }), cx - 1.9, 2.3, cz - 1.1, cx + 1.9, 2.42, cz + 1.1); [-1.5, 1.5].forEach(o => B.box(M('woodB'), cx + o - 0.06, 0.9, cz - 0.06, cx + o + 0.06, 2.3, cz + 0.06)); B.solid(cx - 1.6, cz - 0.8, cx + 1.6, cz + 0.8, 'deco'); return; }
        if (f.tower === 'fire') { [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz2]) => P(g.box, M('steelD'), cx + sx * 1.1, 6, cz + sz2 * 1.1, 0.2, 12, 0.2, sz2 * 0.05, 0, -sx * 0.05)); B.box(M('woodD'), cx - 1.4, 11.6, cz - 1.4, cx + 1.4, 11.8, cz + 1.4); B.roof(cx, cz, 3, 3, { type: 'hip', y: 13, h: 1, o: 0.2, mat: 'kawara' }); P(g.sph, M('bronze'), cx, 12.6, cz, 0.6, 0.7, 0.6); B.solid(cx - 1.3, cz - 1.3, cx + 1.3, cz + 1.3, 'deco'); B.label('火見櫓', cx, cz); return; }
        if (f.tower === 'clock') { B.box(M('brick'), cx - 2.2, 0, cz - 2.2, cx + 2.2, 14, cz + 2.2); B.solid(cx - 2.2, cz - 2.2, cx + 2.2, cz + 2.2, 'house'); P(g.cyl24, M('white'), cx, 11.5, cz + 2.25, 2.4, 0.15, 2.4, Math.PI / 2, 0, 0); B.roof(cx, cz, 5, 5, { type: 'hip', y: 14, h: 3, o: 0.3, mat: 'copper' }); B.label('鐘樓', cx, cz); return; }
        if (f.shrine) { const [x0, z0, x1, z1] = r; B.zone(r, 'gravel', 0.025); { const jw = Math.max(5, Math.min(8, x1 - x0 - 6)), jd = jw * 0.72; B.jinja(cx, z0 + 1.4 + jd / 2, { w: jw, d: jd, face: 's', mat: 'kawara', honden: false, komainu: false, temizu: x1 - x0 > jw + 9, name: '東鶴神社' }); }   /* 2026-10-22 神社重做（shrinekit.js） */ B.torii(cx, z1 - 1.5, 0, 4.4, 4.6, 'verm'); [-2.6, 2.6].forEach(o => B.lantern(cx + o, (z0 + z1) / 2 + 2, 1)); B.trees([x0 + 1, z0 + 1, x0 + 3, z1 - 1], 3, 'cedar', 1.2); B.trees([x1 - 3, z0 + 1, x1 - 1, z1 - 1], 3, 'cedar', 1.2); B.label('東鶴神社', cx, cz); return; }
        if (f.temple) { const [x0, z0, x1, z1] = r; B.zone(r, 'gravel', 0.025); B.hondo(cx - 7, z0 + 1, cx + 7, z0 + 10, { face: 's', h: 6.2 }); B.solid(cx - 7.4, z0 + 0.6, cx + 7.4, z0 + 10.4, 'house'); B.foot([cx - 7.4, z0 + 0.6, cx + 7.4, z0 + 10.4], 'temple', 10); B.shoro(x0 + 4, z1 - 4, { s: 0.62 });   /* 2026-10-26：本堂、鐘樓改用 templekit.js */ B.solid(x0 + 2, z1 - 6, x0 + 6, z1 - 2, 'house'); B.label('東鶴寺', cx, cz); void x1; return; }
        const o = { r, h: f.h || 6, style: f.style || 'house', face, col: f.col, name: f.name, signCol: f.sign, roof: f.roof || 'flat', neon: f.neon, noren: f.noren, top: f.style === 'glass' ? true : undefined };
        B.bld(o);
        if (f.chimney) for (let i = 0; i < f.chimney; i++) B.chimney(r[0] + 2 + i * 4, r[1] + 2, f.style === 'factory' ? 24 : 9, { r: f.style === 'factory' ? 1.6 : 0.5 });
        if (f.name && f.h >= 9) B.label(f.name.replace(/「|」/g, ''), cx, cz);
      });
      // 望月家（道場）：圍牆、正屋、道場
      { const d = C.FAC.dojo; if (d) { const [x0, z0, x1, z1] = rectW(d); B.zone([x0, z0, x1, z1], 'gravel', 0.025); B.dobei(x0, z0, x1, z1, 0, { gaps: [[WX(C.SPOTS.dojoGate[0] - 4), z1 - 1, WX(C.SPOTS.dojoGate[0] + 4), z1 + 1]] }); B.bld({ r: [x0 + 2, z0 + 2, x0 + (x1 - x0) * 0.55, z0 + (z1 - z0) * 0.5], h: 4.4, style: 'machiya', face: 's' }); B.bld({ r: [x0 + (x1 - x0) * 0.6, z0 + 2, x1 - 2, z0 + (z1 - z0) * 0.55], h: 5.2, style: 'house', face: 's', col: '#C8B898', roof: 'gable', plain: 1 }); B.label('望月家道場', (x0 + x1) / 2, (z0 + z1) / 2); } }
      // 攤子（西市街）
      (C.FAC.stalls || []).forEach(([sx, sy]) => { const x = WX(sx), z = WZ(sy); B.box(M('woodD'), x - 1.8, 0, z - 0.8, x + 1.8, 0.9, z + 0.8); B.box(CK.mat('dhStall2', { col: '#3A6A8A', tex: 'paint', rough: 0.8 }), x - 2.1, 2.3, z - 1.1, x + 2.1, 2.42, z + 1.1); [-1.7, 1.7].forEach(o => B.box(M('woodB'), x + o - 0.06, 0.9, z - 0.06, x + o + 0.06, 2.3, z + 0.06)); B.solid(x - 1.8, z - 0.8, x + 1.8, z + 0.8, 'deco'); });
      // 公團住宅（兩棟）
      (C.FAC.danchi || []).forEach(([sx, sy]) => B.bld({ r: rectW([sx - 20, sy - 10, sx + 20, sy + 10]), h: 2.9 * 5, style: 'apt', face: 's', col: '#E2DCD0' }));
      // 公車站
      (C.FAC.busStop || []).forEach(([sx, sy]) => B.busStop(WX(sx), WZ(sy), 0, '東鶴巴士'));
      // ---------- 街上的東西 ----------
      C.roads.filter(rd => rd.kind === 'main' || rd.kind === 'sub').forEach(rd => {
        const k = RK[rd.kind], off = (k[0] / 2 + k[1] * 0.12) * S, pts = rd.pts.map(w2);   // 2026-10-22 路燈靠路緣（原本 0.3：路人走在人行道中間、左右 0.6 公尺，靠這一側的會穿過燈柱）
        let acc = 0; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1) continue; const ux = (b[0] - a[0]) / L, uz = (b[1] - a[1]) / L; for (let t = (24 - acc % 24) % 24; t < L; t += 24) { const sd = (Math.floor((acc + t) / 24) % 2) ? 1 : -1, x = a[0] + ux * t - uz * off * sd, z = a[1] + uz * t + ux * off * sd; if (CK.streetDist(x, z, B.D.lines)[1] < k[0] * S / 2 + 0.3) continue; B.lamp(x, z, Math.atan2(uz * sd, -ux * sd)); } acc += L; }
      });
      // ---------- 路人、車 ----------
      C.roads.filter(rd => rd.kind === 'main' || rd.kind === 'sub').forEach(rd => { const k = RK[rd.kind], o = (k[0] / 2 + k[1] * 0.5) * S; [-1, 1].forEach(sd => { const pts = C.offsetLine(rd.pts, sd * o / S).map(w2); let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (L > 30) B.walk(pts, Math.max(2, Math.round(L / 26))); }); });
      C.roads.filter(rd => rd.kind === 'old' || rd.kind === 'arcade').forEach(rd => { const pts = rd.pts.map(w2); let L = 0; for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (L > 20) B.walk(pts, Math.max(2, Math.round(L / 18))); });
      (C.carRoutes || []).forEach(cr => B.route(cr.path.map(w2), cr.n || 1));
      // ---------- 地名 ----------
      (C.DISTRICTS || []).slice().sort((a, b) => a.r - b.r).forEach(d => { const k = d.r * 0.75; B.area(d.n, [WX(d.x - k), WZ(d.y - k), WX(d.x + k), WZ(d.y + k)]); });
      (C.AREAS || []).forEach(d => { const k = d.r * 0.75; B.area(d.n, [WX(d.x - k), WZ(d.y - k), WX(d.x + k), WZ(d.y + k)]); });
      ['西市口', '站前商店街', '官廳街', '新商區', '寺町', '城西', '城南', '河東'].forEach(n => { const d = (C.DISTRICTS || []).find(q => q.n === n); if (d) B.label(n, WX(d.x), WZ(d.y)); });
      // ---------- 收下的互動、劇情人物 ----------
      const H = CK._dongheH;
      if (H) {
        H.inter.forEach(it => tw.inter.push(it));
        const CLS = { gun: 'gunner', bow: 'archer', staff: 'mage', magic: 'mage' };
        H.npcs.forEach(n => {
          let p = null;
          if (n.opt) { try { const o = Object.assign({}, n.opt); delete o.pool; const h = R.makeHero(CLS[n.kind] || 'warrior', n.base, o); h.g.position.set(n.x, CK.heightAt(n.x, n.z), n.z); h.g.rotation.y = n.rot; B.group.add(h.g); p = { h, x: n.x, z: n.z, rot: n.rot }; tw.npcs.push(p); } catch (e) { console.warn('[donghe npc]', e); } }
          if (!p) p = B.person(n.x, n.z, n.rot);
          if (!p) return; p.near = 1; if (n.name) p.name = n.name; if (n.person) p.person = n.person; if (n.watch) p.watch = n.watch;
          B.solid(n.x - 0.35, n.z - 0.35, n.x + 0.35, n.z + 0.35, 'npc');
          H.inter.forEach(it => { if (it.follow === n.src) it.follow = p; });
        });
        H.steals.forEach(it => { const l = lbl(it); B.steal(it.x, it.z, l, 'donghe', () => (Math.random() < 0.5 ? { gold: 3 + Math.floor(Math.random() * 10) } : { gift: 'dango', n: 1 }), { time: 1.2 }); });
      }
      // ---------- 海岸、漁港、海水浴場、東鶴港 ----------
      seaside(B);
      void rr; void pk;
    }
  });
})(window.R);
