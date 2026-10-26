// 無境之旅：東鶴的都市計畫（照 1990 年代日本地方都市的樣子）
// 道路分三級：主幹道（四線道、中央線、人行道、行道樹、紅綠燈、天橋）→ 副幹道（雙線道、T 字路口、錯開的路口）→ 巷子（窄、會轉彎、有死巷）。
// 舊城（城牆、城門、外濠）在中間；北邊是鐵路、東鶴站、站前廣場、拱廊商店街、百貨公司；東邊是官廳街、新商區、選礦廠；
// 西邊、南邊是住宅區（公寓、錢湯、寺、小學）；西河岸對面是河西；南渠外是田。房子最高六層樓，沒有高樓大廈。
// 座標：示意圖的 1 單位＝0.44 公尺（整張 440 公尺見方）。town.js、suburbs.js、civic.js 都照這一份擺東西。
// 這個檔案只有資料（不碰 three.js）：道路、水、鐵路、分區、每一塊地（自動沿著路排）、路人走的路網、車的路線、紅綠燈、小地圖。
(function (R) {
  const S = 0.44, WX = sx => (sx - 500) * S, WZ = sy => (sy - 500) * S, HALF = 500 * S;
  let seed = 1; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const C = R.CITY = { S, WX, WZ, HALF };

  // ---------- 地形（2026-10-26 整張重新設計）----------
  // 北邊是北山的山腳：舊城（城下町，四面有外濠）靠山；鶴川從北山流下來，斜斜穿過城的中間，在東鶴港出海；
  // 河東是官廳街（縣廳、銀行、醫院、郵局）；河南、舊城南邊是住宅區；鐵路在南邊東西向，東鶴站門朝南，站前是商店街、百貨公司；
  // 東南角是漁港，東北角是海水浴場；最西邊是霜溪，霜溪和外濠之間是城西遺跡。
  C.stream = [[40, 0], [46, 260], [34, 520], [46, 780], [38, 1000]];                                                       // 霜溪（北 → 南，城的西邊）
  C.river = [[520, 0], [528, 130], [566, 270], [640, 370], [700, 440], [716, 520], [760, 552], [860, 560], [1000, 560]];   // 鶴川（北山 → 東鶴港）
  C.OLD = [200, 120, 440, 400];                                          // 舊城的城牆
  C.water = [
    { kind: 'stream', pts: C.stream, w: 18 },
    { kind: 'river', pts: C.river, w: 46 },
    { kind: 'moat', pts: [[352, 416], [456, 416], [456, 104], [184, 104], [184, 416], [288, 416]], w: 18 }   // 外濠：城牆外繞一圈，南門前留一段土橋（大手通從這裡進城；整圈接起來的話水面會把舊城整個蓋掉）
  ];
  C.GATES = { n: [320], s: [320], w: [260], e: [260] };                  // 四個城門：本町通（南北）、西市街（東西）在西市口交叉
  C.GW = 22;

  // ---------- 鐵路、車站（城的南邊）----------
  C.RAIL = { y: 790, t: [780, 800], y0: 770, y1: 810, fn: 767, fs: 813 };
  C.BRIDGE = [18, 62];                                                   // 鐵橋（過霜溪）
  C.PLAT = [440, 785, 600, 795];                                         // 島式月台
  C.STATION = [470, 822, 570, 850];                                      // 站房（門朝南）
  C.PLAZA = [420, 854, 620, 912];                                        // 站前廣場（公車、計程車的圓環）

  // ---------- 道路 ----------
  // kind：main 主幹道、sub 副幹道、lane 巷子、old 舊城的石板路、olane 舊城的小路、arcade 拱廊商店街（只能走路）、dirt 城外的泥土路
  const RW = { main: 48, sub: 28, lane: 11, old: 18, olane: 10, arcade: 18, dirt: 16 };
  C.RW = RW;
  C.roads = [];
  const road = (kind, pts, name, o) => { const r = Object.assign({ kind, pts, w: RW[kind], name: name || '' }, o || {}); C.roads.push(r); return r; };
  // 主幹道：國道一號東西橫過舊城南邊（過鶴川的新大橋，盡頭是東鶴港的渡輪碼頭）；大手通從南門直直往南到鐵路邊
  road('main', [[0, 480], [200, 476], [600, 474], [860, 480], [1000, 488]], '國道一號');
  road('sub', [[320, 416], [320, 750]], '大手通');
  // 副幹道
  road('lane', [[80, 140], [80, 1000]], '河西通');                        // 霜溪東岸，過平交道一路到南郊
  road('sub', [[400, 476], [400, 1000]], '站西通');                      // 國道 → 平交道 → 站前
  road('sub', [[760, 476], [760, 1000]], '站東通');                      // 國道 → 過鶴川 → 平交道 → 南郊
  road('sub', [[860, 480], [860, 750]], '港通');                         // 國道 → 過鶴川 → 新商區、選礦廠
  road('lane', [[80, 620], [170, 612], [300, 626], [420, 614], [560, 628], [700, 616], [860, 626], [972, 620]], '中央通');
  road('lane', [[80, 750], [972, 750]], '線路沿');
  road('lane', [[230, 476], [234, 560], [228, 640], [230, 750]], '學校通');
  road('lane', [[560, 476], [556, 560], [564, 650], [560, 750]], '寺町通');
  road('lane', [[80, 940], [200, 934], [400, 942], [620, 936], [760, 944], [972, 938]], '站前南通');
  road('lane', [[760, 872], [930, 872]], '漁港通');
  road('sub', [[80, 260], [176, 260]], '西門通');
  road('sub', [[464, 260], [680, 260]], '東門通');                       // 東門 → 鶴橋 → 官廳街
  road('sub', [[680, 120], [680, 340], [790, 440], [860, 480]], '官廳通');
  road('lane', [[680, 230], [972, 230]], '北濱通');                       // 往海水浴場
  road('sub', [[680, 340], [972, 340]], '縣廳通');
  // 舊城：石板路（北門 → 西市口 → 南門；西門 → 西市口 → 東門，十字）
  road('old', [[320, 92], [320, 416]], '本町通');
  road('old', [[176, 260], [464, 260]], '西市街');
  road('olane', [[204, 180], [311, 180]], '參道');
  road('olane', [[329, 196], [436, 196]], '鍛冶町');
  road('olane', [[250, 124], [250, 251]], '');
  road('olane', [[414, 124], [414, 186]], '');
  road('olane', [[204, 325], [311, 325]], '後巷');
  road('olane', [[204, 388], [436, 388]], '城牆下');
  road('olane', [[258, 269], [258, 320]], '');
  // 拱廊商店街（站前廣場往西）
  road('arcade', [[180, 884], [420, 884]], '站前商店街');
  // 巷子（住宅區）：故意不排成格子——轉彎、錯開、有的走到一半就沒路了
  [
    [[96, 330], [168, 330]], [[96, 400], [168, 404]], [[482, 124], [486, 300], [490, 440]],
    [[96, 548], [160, 552], [230, 548]], [[230, 552], [276, 546], [320, 550]], [[320, 560], [360, 556], [400, 560]], [[400, 548], [480, 552], [560, 546]], [[560, 560], [610, 566], [660, 556]],
    [[96, 690], [160, 686], [230, 690]], [[230, 694], [276, 690], [320, 686]], [[320, 684], [360, 690], [400, 688]], [[400, 694], [480, 690], [560, 696]], [[560, 686], [660, 690], [760, 684]], [[760, 690], [860, 694]],
    [[480, 476], [484, 548]], [[480, 620], [476, 690]], [[276, 620], [280, 690], [276, 750]], [[640, 620], [644, 690], [640, 750]], [[810, 620], [806, 690], [810, 750]], [[920, 620], [924, 650]],
    [[150, 620], [146, 690]], [[160, 690], [156, 750]], [[360, 620], [364, 684]],
    [[460, 940], [460, 1000]], [[560, 940], [556, 1000]], [[660, 940], [664, 1000]], [[820, 830], [820, 872]], [[920, 940], [924, 1000]],
    [[160, 830], [124, 836]], [[240, 940], [236, 1000]], [[330, 940], [334, 1000]], [[620, 830], [620, 872]], [[700, 830], [760, 830]],
    [[720, 120], [720, 230]], [[820, 120], [820, 230]], [[940, 230], [940, 340]], [[600, 120], [680, 120]], [[760, 340], [756, 400]]
  ].forEach(p => road('lane', p));
  // 城外的泥土路：往遺跡、湯山村（從北門出去）
  road('dirt', [[320, 92], [320, 60], [420, 40], [560, 52]], '往北山礦坑');
  road('dirt', [[560, 52], [680, 58], [800, 66]], '往霜溪石窟');
  road('dirt', [[320, 60], [220, 50], [150, 74]], '往湯山村');
  road('dirt', [[80, 172], [118, 172]], '往城西遺跡');

  // ---------- 海：東鶴靠海（作者）。海岸線在示意圖 x = 975，以東是海（coast.js 蓋海、防波堤、漁港、燈塔、海水浴場）----------
  // 伸進海裡的路、河、渠都切在海岸線上；國道一號的盡頭就是漁港
  C.COAST = 975;
  const clipX = (pts, X) => {
    const runs = []; let cur = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], inP = p[0] <= X;
      if (i > 0) { const q = pts[i - 1], inQ = q[0] <= X; if (inQ !== inP) { const t = (X - q[0]) / (p[0] - q[0]), m = [X, q[1] + (p[1] - q[1]) * t]; if (inQ) { cur.push(m); runs.push(cur); cur = []; } else cur = [m]; } }
      if (inP) cur.push(p);
    }
    if (cur.length) runs.push(cur);
    return runs.sort((a, b) => b.length - a.length)[0] || [];
  };
  C.roads.forEach(r => { r.pts = clipX(r.pts, C.COAST - 3); });
  C.roads = C.roads.filter(r => r.pts.length >= 2 && Math.hypot(r.pts[r.pts.length - 1][0] - r.pts[0][0], r.pts[r.pts.length - 1][1] - r.pts[0][1]) > 6);
  C.water.forEach(w => { w.pts = clipX(w.pts, C.COAST); });

  // ---------- 幾何 ----------
  const segDist = (px, py, ax, ay, bx, by) => { const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / L)); return Math.hypot(px - (ax + dx * t), py - (ay + dy * t)); };
  const lineDist = (px, py, pts) => { let d = 1e9; for (let i = 0; i < pts.length - 1; i++) d = Math.min(d, segDist(px, py, pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1])); return d; };
  const segX = (a, b, c, d) => {
    const r = [b[0] - a[0], b[1] - a[1]], s = [d[0] - c[0], d[1] - c[1]], den = r[0] * s[1] - r[1] * s[0]; if (Math.abs(den) < 1e-9) return null;
    const t = ((c[0] - a[0]) * s[1] - (c[1] - a[1]) * s[0]) / den, u = ((c[0] - a[0]) * r[1] - (c[1] - a[1]) * r[0]) / den;
    return t >= -1e-6 && t <= 1 + 1e-6 && u >= -1e-6 && u <= 1 + 1e-6 ? [a[0] + r[0] * t, a[1] + r[1] * t, Math.atan2(r[1], r[0]), t, u] : null;
  };
  C.segDist = segDist; C.lineDist = lineDist; C.segX = segX;
  // 這個點在不在車道上（人行道不算；拱廊商店街、泥土路不算）：路燈、電線桿、樹、反射鏡、腳踏車擺之前先問
  C.inCarriage = (sx, sy, pad) => C.roads.some(rd => rd.kind !== 'dirt' && rd.kind !== 'arcade' && lineDist(sx, sy, rd.pts) < rd.w / 2 - (rd.kind === 'main' ? 4 : rd.kind === 'sub' ? 3 : 0.5) - (pad || 0));
  // 折線往旁邊平移（o > 0：往行進方向的右手邊）
  const offsetLine = (pts, o) => pts.map((p, i) => {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
    return [p[0] - dy / L * o, p[1] + dx / L * o];
  });
  C.offsetLine = offsetLine;

  // ---------- 橋：路和水交叉的地方 ----------
  C.bridges = [];
  C.roads.forEach(rd => {
    if (rd.kind === 'arcade') return;
    for (let i = 0; i < rd.pts.length - 1; i++) C.water.forEach(wt => { for (let j = 0; j < wt.pts.length - 1; j++) { const h = segX(rd.pts[i], rd.pts[i + 1], wt.pts[j], wt.pts[j + 1]); if (h && !C.bridges.some(b => Math.hypot(b.sx - h[0], b.sy - h[1]) < 20)) C.bridges.push({ sx: h[0], sy: h[1], ang: h[2], len: wt.w + 10, wid: rd.w - (rd.kind === 'main' ? 4 : 0), ok: true, kind: wt.kind, road: rd }); } });
  });
  C.bridges.forEach(b => {
    if (b.kind === 'river') b.name = b.sy < 120 ? '北山橋' : b.sy < 300 ? '鶴橋' : b.sy < 500 ? '新大橋' : b.sx < 800 ? '鶴川橋' : '河口橋';
    if (b.kind === 'moat') b.name = b.sy < 110 ? '北門橋' : b.sy > 410 ? '南門橋' : b.sx < 190 ? '西門橋' : '東門橋';
    if (b.kind === 'stream') b.name = '霜溪橋';
  });

  // ---------- 平交道 ----------
  C.CROSS = [];
  C.roads.forEach(rd => { if (rd.kind === 'arcade') return; for (let i = 0; i < rd.pts.length - 1; i++) { const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1]; if ((ay - C.RAIL.y) * (by - C.RAIL.y) < 0) C.CROSS.push(ax + (bx - ax) * (C.RAIL.y - ay) / (by - ay)); } });


  // ---------- 分區 ----------
  // res 住宅、com 商業（站前）、old 舊城、civic 官廳街、ind 工業、farm 田、kasai 河西（住宅）
  C.ZONES = [
    { k: 'farm', r: [0, 0, 1000, 100] },
    { k: 'old', r: C.OLD },
    { k: 'civic', r: [580, 100, 1000, 466] },
    { k: 'ind', r: [860, 580, 1000, 767] },
    { k: 'com', r: [580, 580, 860, 767] },
    { k: 'ind', r: [800, 813, 1000, 1000] },
    { k: 'com', r: [100, 813, 800, 1000] },
    { k: 'res', r: [0, 0, 1000, 1000] }
  ];
  const zoneAt = (x, y) => { for (const z of C.ZONES) if (x >= z.r[0] && x < z.r[2] && y >= z.r[1] && y < z.r[3]) return z.k; return 'res'; };
  C.zoneAt = zoneAt;

  // ---------- 設施的位置（門朝南，除了另外註明的） ----------
  // [x, y]：建築物中心（示意圖座標）；town.js、civic.js、suburbs.js 照這裡蓋
  C.FAC = {
    // 舊城（西市口在本町通和西市街的十字路口）
    guild: [280, 222], board: [304, 240], news: [348, 244], store: [226, 222], pharmacy: [284, 296], tavern: [236, 296],
    exchange: [368, 290], shrine: [276, 150], smith: [362, 150], suga: [340, 290], dojo: [356, 316, 432, 376],
    stalls: [[342, 222], [366, 222], [390, 222]], park: [257, 359], alley: [204, 311, 325],
    coach: [520, 424], firetower: [880, 912], clock: [830, 650], factory: [920, 690], farmhouse: [590, 140],
    dexTrade: [700, 590], dexParts: [724, 591], cafe: [790, 650],
    fishMarket: [952, 872], beachHut: [958, 168],   // coast.js：魚市場、海水浴場的小屋
    // civic.js：河東的官廳街
    pref: [800, 290], guardHQ: [720, 290], bank: [880, 290], hospital: [760, 170], post: [860, 175], paper: [920, 175], theater: [900, 410], dept: [700, 880],
    // 站前（suburbs.js）
    koban: [436, 928], busStop: [[580, 924], [600, 924]], clockPillar: [520, 924],
    // 錢湯、寺、公團住宅、旅館、柏青哥、電玩店、雀莊、卡拉 OK
    bath: [260, 690], temple: [170, 690], danchi: [[440, 572], [440, 594]], hotel: [350, 856], pachinko: [290, 856], game: [230, 856],
    mahjong: [250, 916], karaoke: [320, 916]   // 雀莊「東風」（mahjong.js）、卡拉 OK「歌聲」（karaoke.js）
  };
  // 特別的區域（suburbs.js）：城西遺跡在霜溪和外濠之間；小學、兒童公園在城西；墓地、雜木林、超市在站前的西邊
  C.Z = { ruins: [100, 130, 168, 240], school: [100, 500, 200, 590], park: [240, 500, 300, 540], grove: [124, 950, 200, 996], grave: [100, 830, 170, 920], market: [210, 958, 290, 996] };
  // 特別的空地：西市口廣場、站前廣場、外濠公園、縣廳前廣場、小學的操場……（不蓋一般的房子）
  C.SQUARE = [320, 260, 26, 22];   // 西市口（橢圓：寬 23 公尺、深 19 公尺）
  C.PARKS = [[214, 340, 300, 378], [590, 500, 668, 540], [770, 356, 840, 384], [200, 432, 300, 446]];   // 舊城的小公園、鶴川河畔公園、縣廳前、外濠公園

  // ---------- 佔用的格子：路、水、鐵路、城牆、設施（2 單位一格）----------
  const GS = 2, GN = 500, occ = new Uint8Array(GN * GN);
  const setR = (x0, y0, x1, y1, v) => { for (let gy = Math.max(0, Math.floor(y0 / GS)); gy <= Math.min(GN - 1, Math.floor((y1 - 0.01) / GS)); gy++) for (let gx = Math.max(0, Math.floor(x0 / GS)); gx <= Math.min(GN - 1, Math.floor((x1 - 0.01) / GS)); gx++) occ[gy * GN + gx] = v; };
  const freeR = (x0, y0, x1, y1) => { if (x0 < 2 || y0 < 2 || x1 > 998 || y1 > 998) return false; for (let gy = Math.floor(y0 / GS); gy <= Math.floor((y1 - 0.01) / GS); gy++) for (let gx = Math.floor(x0 / GS); gx <= Math.floor((x1 - 0.01) / GS); gx++) if (occ[gy * GN + gx]) return false; return true; };
  const stamp = (pts, half, v) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), n = Math.ceil(L / 1.5);
      for (let k = 0; k <= n; k++) { const x = ax + (bx - ax) * k / n, y = ay + (by - ay) * k / n; for (let gy = Math.floor((y - half) / GS); gy <= Math.floor((y + half) / GS); gy++) for (let gx = Math.floor((x - half) / GS); gx <= Math.floor((x + half) / GS); gx++) { if (gx < 0 || gy < 0 || gx >= GN || gy >= GN) continue; if (Math.hypot(gx * GS + 1 - x, gy * GS + 1 - y) <= half + 1) occ[gy * GN + gx] = v; } }
    }
  };
  C.water.forEach(w => stamp(w.pts, w.w / 2 + 6, 2));
  C.roads.forEach(r => stamp(r.pts, r.w / 2 + (r.kind === 'main' ? 3 : 2), 1));
  setR(0, C.RAIL.fn - 6, 1000, C.RAIL.fs + 6, 3);
  { const [x0, y0, x1, y1] = C.OLD; setR(x0 - 4, y0 - 4, x1 + 4, y0 + 4, 3); setR(x0 - 4, y1 - 4, x1 + 4, y1 + 4, 3); setR(x0 - 4, y0, x0 + 4, y1, 3); setR(x1 - 4, y0, x1 + 4, y1, 3); }
  setR(...C.STATION, 3); setR(C.PLAZA[0], C.PLAZA[1], C.PLAZA[2], C.PLAZA[3], 3); setR(C.PLAT[0] - 4, C.PLAT[1], C.PLAT[2] + 4, C.PLAT[3], 3);
  { const [cx, cy, rx, ry] = C.SQUARE; setR(cx - rx - 4, cy - ry - 4, cx + rx + 4, cy + ry + 4, 3); }
  C.PARKS.forEach(r => setR(...r, 3));
  Object.values(C.Z).forEach(r => setR(r[0] - 2, r[1] - 2, r[2] + 2, r[3] + 2, 3));
  // 設施的地（size：寬、深，示意圖單位；門朝南）
  const FS = {
    guild: [32, 24], board: [8, 4], news: [8, 4], store: [18, 16], pharmacy: [18, 14], tavern: [22, 19], exchange: [8, 7], shrine: [30, 34], smith: [42, 30], suga: [14, 10],
    coach: [40, 24], firetower: [8, 8], clock: [12, 12], factory: [44, 46], farmhouse: [18, 14], dexTrade: [20, 16], dexParts: [16, 14], cafe: [22, 16], fishMarket: [28, 22], beachHut: [10, 8],
    pref: [70, 44], guardHQ: [34, 26], bank: [48, 34], hospital: [62, 40], post: [30, 22], paper: [30, 24], theater: [40, 30], dept: [70, 56],
    koban: [8, 8], clockPillar: [18, 8], bath: [30, 26], temple: [56, 44], hotel: [38, 30], pachinko: [40, 30], game: [32, 28], mahjong: [24, 18], karaoke: [20, 16]
  };
  C.FS = FS; C._occ = occ; C._freeR = freeR;
  setR(C.COAST - 1, 0, 1000, 1000, 2); setR(948, 110, C.COAST, 206, 3);   // 海、海水浴場的沙灘：不蓋房子
  // 門朝哪邊：預設朝南；百貨公司朝西對著站前廣場（civic.js 的 faceAt 整棟轉過去）
  C.FACE = { dept: -Math.PI / 2 };
  // 設施的地＋門前的前庭（8 單位，約 3.5 公尺）：一般的房子不會蓋在門口
  C.footR = (k, F) => { const p = C.FAC[k], [w0, d0] = FS[k], a = C.FACE[k] || 0, side = Math.abs(Math.sin(a)) > 0.5, w = side ? d0 : w0, d = side ? w0 : d0, f = F == null ? 8 : F, r = [p[0] - w / 2 - 2, p[1] - d / 2 - 2, p[0] + w / 2 + 2, p[1] + d / 2 + 2], dx = Math.round(Math.sin(a)), dy = Math.round(Math.cos(a)); if (dx > 0) r[2] += f; if (dx < 0) r[0] -= f; if (dy > 0) r[3] += f; if (dy < 0) r[1] -= f; return r; };
  Object.keys(FS).forEach(k => { const p = C.FAC[k]; if (!p || typeof p[0] !== 'number') return; setR(...C.footR(k), 3); });
  C.FAC.stalls.forEach(([x, y]) => setR(x - 9, y - 8, x + 9, y + 12, 3));
  { const [x0, y0, x1, y1] = C.FAC.dojo; setR(x0 - 2, y0 - 2, x1 + 2, y1 + 2, 3); }
  C.FAC.danchi.forEach(([x, y]) => setR(x - 22, y - 12, x + 22, y + 12, 3));
  C.FAC.busStop.forEach(([x, y]) => setR(x - 6, y - 3, x + 6, y + 3, 3));
  // 巷子不能從設施底下穿過：碰到設施（含公團住宅）的那一段切掉，巷子走到設施前就斷（不然路面、電線桿、電線都會穿過建築）
  {
    const facR = Object.keys(FS).filter(k => C.FAC[k] && typeof C.FAC[k][0] === 'number').map(k => { const r = C.footR(k, 3); return [r[0] - 1, r[1] - 1, r[2] + 1, r[3] + 1]; })
      .concat(C.FAC.danchi.map(([x, y]) => [x - 26, y - 15, x + 26, y + 15]), [[C.FAC.dojo[0] - 3, C.FAC.dojo[1] - 3, C.FAC.dojo[2] + 3, C.FAC.dojo[3] + 3]]);
    const inside = (x, y) => facR.some(r => x > r[0] && x < r[2] && y > r[1] && y < r[3]);
    // 取樣後只留轉彎的點（點太多的話，找路口的時候會很慢）
    const simplify = pts => pts.filter((p, i) => i === 0 || i === pts.length - 1 || Math.abs((p[0] - pts[i - 1][0]) * (pts[i + 1][1] - p[1]) - (p[1] - pts[i - 1][1]) * (pts[i + 1][0] - p[0])) > 0.01);
    const kept = [];
    C.roads.forEach(rd => {
      if (rd.kind !== 'lane' && rd.kind !== 'olane') { kept.push(rd); return; }
      let cur = [];
      const flush = () => { let L = 0; for (let i = 0; i < cur.length - 1; i++) L += Math.hypot(cur[i + 1][0] - cur[i][0], cur[i + 1][1] - cur[i][1]); if (L > 10) kept.push(Object.assign({}, rd, { pts: simplify(cur) })); cur = []; };
      for (let i = 0; i < rd.pts.length - 1; i++) { const [ax, ay] = rd.pts[i], [bx, by] = rd.pts[i + 1], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay) / 2)); for (let k = i ? 1 : 0; k <= n; k++) { const x = ax + (bx - ax) * k / n, y = ay + (by - ay) * k / n; if (inside(x, y)) flush(); else cur.push([x, y]); } }
      flush();
    });
    C.roads = kept;
  }
  // 田（北郊、南渠外）
  C.FIELDS = [[190, 30, 500, 92], [580, 30, 940, 100], [440, 960, 460, 1000]];
  C.FIELDS = C.FIELDS.map(r => [r[0], r[1], Math.min(r[2], r[1] < 300 ? 944 : C.COAST - 2), r[3]]).filter(r => r[2] - r[0] > 10);   // 田不要伸進沙灘、海裡
  C.FIELDS.forEach(r => setR(...r, 3));
  C.GREENS = [[560, 100, 596, 124]];

  // ---------- 用地：沿著路一塊一塊排房子（門朝路） ----------
  // f：門朝哪邊（0 南、1 北、2 西、3 東）
  C.lots = [];
  const lot = o => { C.lots.push(o); setR(o.r[0], o.r[1], o.r[2], o.r[3], 4); return o; };   // 2026-10-26：房子挨著房子（原本四周各多佔 1 單位，排起來很散）
  const WALLS = ['#E8E2D4', '#D8D2C4', '#C8CCD0', '#E0D6C0', '#B8BCC2', '#D4C8B4', '#F0ECE4', '#C4B8A4', '#D8C8B8', '#B8C4C8'];
  const OLDC = ['#B8A688', '#A89478', '#C8BCA2', '#8E7A62', '#D0C4AA', '#9A9286'];
  // 站前、商店街的店名（拱廊裡、大馬路邊）
  const SHOPS = [['甘味處・和菓子', '#8A2A24', 'wagashi'], ['東鶴書房', '#2E4A3A', 'book'], ['理髮店', '#2E3A5A', 'barber'], ['定食屋・小町', '#5A3A1E', 'diner'], ['時計・眼鏡', '#3A3A44', 'watch'], ['八百屋', '#3E5A2E'], ['寫真館', '#4A3A2E', 'photo'],
    ['魚屋', '#2E4A6A'], ['德克斯凡家電', '#1E3A5A', 'dex'], ['酒屋', '#5A2A2A'], ['金物店', '#4A4A40'], ['布團店', '#5A4A6A'], ['麵包坊', '#7A4A2A'], ['花屋', '#3A5A4A'], ['唱片行', '#3A2A4A', 'record'], ['藥妝店', '#2E5A6A'], ['文具店', '#4A5A2E'], ['洋服店', '#5A3A4A'], ['拉麵・龍', '#8A2A1E', 'ramen'], ['喫茶・星', '#4A3424', 'kissa']];
  let shopI = 0;
  const lotKind = (zone, w, d, rd) => {
    const r0 = rnd();
    if (zone === 'old') return r0 < 0.12 ? { type: 'kura' } : { type: 'oldhouse', shop: r0 < 0.55, floors: r0 < 0.75 ? 2 : 1 };
    if (zone === 'com') {
      if (rd.kind === 'arcade') { const s = SHOPS[shopI++ % SHOPS.length]; return { type: 'shop', name: s[0], sc: s[1], kind: s[2], low: false, awn: pick(['#C83A3A', '#3A6A8A', '#E8A03A', '#3E7A48', '#8A3A6A']) }; }
      if (r0 < 0.16) return { type: 'midrise', floors: 3 + Math.floor(rnd() * 2) };        // 雜居大樓：3～4 層（2026-10-26：少一點，多一點兩層的店）
      if (r0 < 0.62) { const s = SHOPS[shopI++ % SHOPS.length]; return { type: 'shop', name: s[0], sc: s[1], kind: s[2], awn: pick(['#C83A3A', '#3A6A8A', '#E8A03A', '#3E7A48']) }; }
      if (r0 < 0.67) return { type: 'conbini' };
      if (r0 < 0.7) return { type: 'parking', big: 1 };
      if (r0 < 0.88) return { type: 'oldhouse', shop: true, floors: 2 };
      return { type: 'office', floors: 3 + Math.floor(rnd() * 3) };
    }
    if (zone === 'civic') return r0 < 0.55 ? { type: 'office', floors: 3 + Math.floor(rnd() * 3) } : r0 < 0.72 ? { type: 'midrise', floors: 3 + Math.floor(rnd() * 3) } : r0 < 0.85 ? { type: 'parking', big: 1 } : { type: 'house', floors: 2 };
    if (zone === 'ind') return r0 < 0.6 ? { type: 'warehouse' } : r0 < 0.8 ? { type: 'factory' } : { type: 'parking', big: 1 };
    if (zone === 'farm') return r0 < 0.6 ? { type: 'farm' } : r0 < 0.8 ? { type: 'warehouse' } : { type: 'garden' };
    // 住宅區
    if (rd.kind === 'main') return r0 < 0.35 ? { type: 'midrise', floors: 3 + Math.floor(rnd() * 3) } : r0 < 0.55 ? { type: 'shop', name: (() => { const s = SHOPS[shopI++ % SHOPS.length]; return s[0]; })(), sc: '#3A3A44', awn: pick(['#C83A3A', '#3A6A8A']) } : r0 < 0.7 ? { type: 'conbini' } : r0 < 0.85 ? { type: 'apt', floors: 3 } : { type: 'parking', big: 1 };
    if (r0 < 0.02) return { type: 'parking' };
    if (r0 < 0.06) return { type: 'garden' };
    if (r0 < 0.1) return { type: 'oldhouse', shop: false, floors: rnd() < 0.5 ? 2 : 1 };
    if (r0 < 0.12) return { type: 'vacant' };
    if (r0 < 0.24 && w > 34) return { type: 'apt', floors: rnd() < 0.6 ? 2 : 3 };
    if (r0 < 0.28 && rd.kind === 'sub') { const s = SHOPS[shopI++ % SHOPS.length]; return { type: 'shop', name: s[0], sc: s[1], kind: s[2], low: true, awn: pick(['#C83A3A', '#3A6A8A', '#E8A03A']) }; }
    if (r0 < 0.3 && rd.kind === 'sub') return { type: 'conbini' };
    if (r0 < 0.3 && rnd() < 0.25) return { type: 'clinic' };
    return { type: 'house', floors: rnd() < 0.85 ? 2 : 1 };
  };
  // 塞滿街區：每一種分區的房子大小（示意圖單位：寬 × 深）、房子之間的空隙
  const SIZES = {
    old: [[12, 20], [10, 18], [12, 16], [10, 14], [8, 12]],
    com: [[18, 24], [14, 22], [12, 18], [10, 14]],
    civic: [[40, 30], [32, 26], [24, 22], [16, 16]],
    ind: [[52, 36], [40, 30], [28, 24], [18, 16]],
    res: [[16, 18], [14, 16], [16, 14], [12, 14], [10, 12]],
    farm: [[28, 22], [22, 18]]
  };
  const GAP = { old: 0.2, com: 0.3, civic: 1.2, ind: 1.5, res: 0.6, farm: 8 };   // 2026-10-26：日本的街房子挨著房子（原本住宅區空隙太大、看起來散）
  // 一塊地往四個方向看，最近的路在哪一邊（0 南、1 北、2 西、3 東）、離多遠
  const roadSide = r => {
    const cx = (r[0] + r[2]) / 2, cy = (r[1] + r[3]) / 2, best = [1e9, 0];
    const cellAt = (x, y) => { const gx = Math.floor(x / GS), gy = Math.floor(y / GS); return gx >= 0 && gy >= 0 && gx < GN && gy < GN ? occ[gy * GN + gx] : 9; };
    const dirs = [[0, 1, r[3], 0], [0, -1, r[1], 1], [-1, 0, r[0], 2], [1, 0, r[2], 3]];
    dirs.forEach(([dx, dy, edge, f]) => {
      for (let s = 1; s < 30; s += 1.5) {
        const v = dx ? [-0.3, 0, 0.3].map(k => cellAt(edge + dx * s, cy + (r[3] - r[1]) * k)) : [-0.3, 0, 0.3].map(k => cellAt(cx + (r[2] - r[0]) * k, edge + dy * s));
        if (v.includes(1)) { if (s < best[0]) { best[0] = s; best[1] = f; } break; }
        if (v.some(c => c >= 3)) break;   // 先碰到別的房子、設施：這一邊不是門口
      }
    });
    return best;
  };
  const nearRoad = (x, y) => { let b = null, bd = 1e9; C.roads.forEach(rd => { const d = lineDist(x, y, rd.pts) - rd.w / 2; if (d < bd) { bd = d; b = rd; } }); return b; };
  seed = 20361;
  for (let gy = 0; gy < GN; gy++) for (let gx = 0; gx < GN; gx++) {
    if (occ[gy * GN + gx]) continue;
    const x = gx * GS, y = gy * GS, zone = zoneAt(x + 4, y + 4); if (y < 70 || (zone === 'farm' && rnd() < 0.97)) continue;
    if (rnd() < 0.015) continue;   // 偶爾留一點空地
    const gap = GAP[zone] || 1, list = SIZES[zone] || SIZES.res;
    let placed = null;
    for (let k = 0; k < list.length && !placed; k++) {
      const [w0, d0] = list[k], jw = w0 * (0.92 + rnd() * 0.16), jd = d0 * (0.92 + rnd() * 0.16);
      for (const [w, d] of rnd() < 0.5 ? [[jw, jd], [jd, jw]] : [[jd, jw], [jw, jd]]) { const r = [x + gap, y + gap, x + gap + w, y + gap + d]; if (freeR(r[0] - gap, r[1] - gap, r[2] + gap, r[3] + gap)) { placed = r; break; } }
    }
    if (!placed) continue;
    const [dist, f] = roadSide(placed), mid = f === 0 ? [(placed[0] + placed[2]) / 2, placed[3] + dist] : f === 1 ? [(placed[0] + placed[2]) / 2, placed[1] - dist] : f === 2 ? [placed[0] - dist, (placed[1] + placed[3]) / 2] : [placed[2] + dist, (placed[1] + placed[3]) / 2];
    const rd = dist < 1e8 ? nearRoad(mid[0], mid[1]) : null, back = !rd || dist > 14;
    const k = lotKind(zone, placed[2] - placed[0], placed[3] - placed[1], rd || { kind: 'lane' });
    if (back && (k.type === 'shop' || k.type === 'conbini' || k.type === 'clinic')) { k.type = zone === 'old' ? 'oldhouse' : zone === 'com' ? 'midrise' : 'house'; k.floors = k.floors || (k.type === 'midrise' ? 3 : 2); }   // 改成住家要補層數（不然高度是 NaN）
    lot(Object.assign({ r: placed, f: back ? (rnd() < 0.5 ? 0 : 1) : f, zone, col: zone === 'old' ? pick(OLDC) : pick(WALLS), yard: rnd(), road: rd ? rd.kind : null, back }, k));
  }

  // ---------- 路人走的路網：大路走兩邊的人行道、小路走中間 ----------
  C.nodes = []; C.adj = [];
  const hash = new Map(), hk = (x, y) => Math.floor(x / 20) + ',' + Math.floor(y / 20);
  const addNode = (x, y) => { const i = C.nodes.length; C.nodes.push([x, y]); C.adj.push([]); const k = hk(x, y); if (!hash.has(k)) hash.set(k, []); hash.get(k).push(i); return i; };
  const link = (a, b) => { if (a === b || C.adj[a].includes(b)) return; C.adj[a].push(b); C.adj[b].push(a); };
  const chains = [];
  C.roads.forEach(rd => {
    if (rd.kind === 'dirt') return;
    const offs = rd.kind === 'main' ? [-(rd.w / 2 - 4), rd.w / 2 - 4] : rd.kind === 'sub' ? [-(rd.w / 2 - 3), rd.w / 2 - 3] : [0];
    offs.forEach(o => {
      const pts = o ? offsetLine(rd.pts, o) : rd.pts, ids = [];
      for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay), n = Math.max(1, Math.round(L / 18)); for (let k = i ? 1 : 0; k <= n; k++) ids.push(addNode(ax + (bx - ax) * k / n, ay + (by - ay) * k / n)); }
      for (let i = 0; i < ids.length - 1; i++) link(ids[i], ids[i + 1]);
      chains.push(ids);
    });
  });
  // 路口：不同的路靠得很近的點連起來
  C.nodes.forEach(([x, y], i) => { const gx = Math.floor(x / 20), gy = Math.floor(y / 20); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) (hash.get((gx + dx) + ',' + (gy + dy)) || []).forEach(j => { if (j > i && Math.hypot(C.nodes[j][0] - x, C.nodes[j][1] - y) < 16 && !C.adj[i].includes(j)) link(i, j); }); });
  // 鐵路：只能從平交道過——跨過軌道的連線拿掉（平交道那裡的保留）
  C.adj.forEach((nb, i) => { C.adj[i] = nb.filter(j => { const a = C.nodes[i], b = C.nodes[j]; if ((a[1] - C.RAIL.y) * (b[1] - C.RAIL.y) >= 0) return true; return C.CROSS.some(cx => Math.abs((a[0] + b[0]) / 2 - cx) < 16); }); });

  // ---------- 車：靠左行駛（主幹道、副幹道），到頭就迴轉 ----------
  C.carRoutes = [];
  C.roads.filter(r => (r.kind === 'main' || r.kind === 'sub') && r.name && !r.broken).forEach(rd => {
    let L = 0; for (let i = 0; i < rd.pts.length - 1; i++) L += Math.hypot(rd.pts[i + 1][0] - rd.pts[i][0], rd.pts[i + 1][1] - rd.pts[i][1]);
    if (L < 120) return;
    const lane = rd.kind === 'main' ? 9 : 4, fw = offsetLine(rd.pts, -lane), bw = offsetLine(rd.pts.slice().reverse(), -lane);
    C.carRoutes.push({ name: rd.name, path: fw.concat(bw), n: rd.kind === 'main' ? 3 : L > 400 ? 2 : 1, main: rd.kind === 'main' });
  });

  // ---------- 路口：紅綠燈（主幹道和別的路交叉）、斑馬線 ----------
  C.junctions = [];
  for (let i = 0; i < C.roads.length; i++) for (let j = i + 1; j < C.roads.length; j++) {
    const a = C.roads[i], b = C.roads[j]; if (a.kind === 'dirt' || b.kind === 'dirt' || a.kind === 'arcade' || b.kind === 'arcade') continue;
    for (let p = 0; p < a.pts.length - 1; p++) for (let q = 0; q < b.pts.length - 1; q++) {
      const h = segX(a.pts[p], a.pts[p + 1], b.pts[q], b.pts[q + 1]); if (!h) continue;
      if (C.junctions.some(J => Math.hypot(J.x - h[0], J.y - h[1]) < 14)) continue;
      const ang2 = Math.atan2(b.pts[q + 1][1] - b.pts[q][1], b.pts[q + 1][0] - b.pts[q][0]);
      C.junctions.push({ x: h[0], y: h[1], a, b, angA: h[2], angB: ang2, signal: (a.kind === 'main' && (b.kind === 'main' || b.kind === 'sub')) || (b.kind === 'main' && a.kind === 'sub') });
    }
  }

  // ---------- 地名 ----------
  C.DISTRICTS = [
    { n: '西市口', x: 320, y: 260, r: 50 }, { n: '公會東鶴分館前', x: 280, y: 244, r: 20 }, { n: '東鶴神社', x: 276, y: 150, r: 30 }, { n: '後巷', x: 258, y: 325, r: 36 },
    { n: '白藤堂前', x: 284, y: 312, r: 14 }, { n: '赤提燈前', x: 236, y: 314, r: 14 }, { n: '望月家道場', x: 394, y: 346, r: 40 }, { n: '本町通', x: 320, y: 170, r: 36 },
    { n: '西市街', x: 400, y: 260, r: 40 }, { n: '鍛冶町', x: 380, y: 196, r: 36 }, { n: '城牆下', x: 320, y: 388, r: 60 }, { n: '舊城', x: 320, y: 260, r: 170 },
    { n: '東鶴站', x: 520, y: 820, r: 50 }, { n: '站前廣場', x: 520, y: 884, r: 50 }, { n: '站前商店街', x: 300, y: 884, r: 120 }, { n: '站前南通', x: 520, y: 940, r: 40 },
    { n: '德克斯凡百貨', x: 700, y: 880, r: 40 }, { n: '國道一號', x: 500, y: 476, r: 40 }, { n: '大手通', x: 320, y: 600, r: 40 }, { n: '外濠公園', x: 250, y: 440, r: 50 },
    { n: '官廳街', x: 800, y: 280, r: 120 }, { n: '新商區', x: 760, y: 640, r: 90 }, { n: '德克斯凡選礦廠', x: 920, y: 690, r: 50 }, { n: '城西', x: 160, y: 600, r: 120 },
    { n: '寺町', x: 200, y: 690, r: 70 }, { n: '城南', x: 440, y: 650, r: 130 }, { n: '鶴川河畔公園', x: 630, y: 520, r: 40 }, { n: '河東', x: 900, y: 420, r: 80 },
    { n: '東鶴小學', x: 150, y: 545, r: 50 }, { n: '兒童公園', x: 270, y: 520, r: 30 }, { n: '站前超市', x: 250, y: 977, r: 36 }, { n: '鶴橋', x: 563, y: 260, r: 30 },
    { n: '新大橋', x: 707, y: 474, r: 36 }, { n: '平交道', x: 400, y: 790, r: 20 }, { n: '漁港通', x: 840, y: 872, r: 50 }, { n: '城西遺跡', x: 134, y: 185, r: 50 }
  ];
  C.AREAS = [
    { n: '霜溪', x: 40, y: 500, r: 60 }, { n: '霜溪石窟', x: 800, y: 70, r: 60 }, { n: '北山礦坑', x: 560, y: 52, r: 70 }, { n: '湯山村', x: 130, y: 60, r: 80 },
    { n: '北郊的田', x: 700, y: 64, r: 140 }, { n: '城下的田', x: 340, y: 60, r: 120 }, { n: '鐵橋', x: 40, y: 790, r: 30 }, { n: '鶴川', x: 540, y: 120, r: 50 }
  ];
  C.inCity = (sx, sy) => sy > 100 && sx > 60;
  C.areaName = (sx, sy) => {
    const near = list => list.filter(v => Math.hypot(v.x - sx, v.y - sy) < v.r).sort((p, q) => Math.hypot(p.x - sx, p.y - sy) / p.r - Math.hypot(q.x - sx, q.y - sy) / q.r)[0];
    const d = near(C.DISTRICTS); if (d && C.inCity(sx, sy)) return '東鶴・' + d.n;
    const a = near(C.AREAS); return a ? a.n : C.inCity(sx, sy) ? '東鶴' : '東鶴近郊';
  };
  // 劇情人物、委託人的位置（people.js、jobs.js）
  C.SPOTS = {
    nanbashi: [684, 512, Math.PI / 2], dojo: [394, 362, Math.PI], dojoGate: [394, 384, 0], plaza: [320, 288, 0], plazaW: [292, 264, 0], market: [366, 236, Math.PI],
    northGate: [326, 84, 0], wallN: [260, 116, 0], survey: [150, 196, Math.PI * 0.8], survey2: [158, 204, Math.PI], survey3: [136, 204, Math.PI * 0.5],
    alley: [226, 329, 0], alley2: [290, 329, Math.PI], sugaSide: [354, 296, 0]
  };
  C.TARGET = { '湯山村': [140, 74], '北郊農舍': [590, 156], '驛站': [520, 446], '神社': [276, 172], '調查點': [150, 204] };
  C.gatherSpot = [300, 300];
  C.fishSpot = [686, 512];   // 鶴川河畔公園的岸邊（town.js）

  // ---------- 小地圖：畫一張示意的地圖（只給小地圖、大地圖用） ----------
  C.paintMap = N => {
    N = N || 1024; const c = document.createElement('canvas'); c.width = c.height = N; const g = c.getContext('2d'), k = N / 1000;
    const rect = (r, col) => { g.fillStyle = col; g.fillRect(r[0] * k, r[1] * k, (r[2] - r[0]) * k, (r[3] - r[1]) * k); };
    const poly = (pts, w, col, cap) => { g.strokeStyle = col; g.lineWidth = w * k; g.lineCap = cap || 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x * k, y * k) : g.moveTo(x * k, y * k))); g.stroke(); };
    g.fillStyle = '#E2E9EE'; g.fillRect(0, 0, N, N);
    rect([0, 0, 1000, 40], '#B8C0C8');
    C.FIELDS.forEach(r => rect(r, '#D2D4C2')); C.GREENS.forEach(r => rect(r, '#C8D8D0'));
    rect([C.OLD[0], C.OLD[1], C.OLD[2], C.OLD[3]], '#C8BFAE');
    C.PARKS.forEach(r => rect(r, '#C8D4C0'));
    Object.entries(C.Z).forEach(([k2, r]) => rect(r, k2 === 'ruins' ? '#B8AE9C' : k2 === 'grave' ? '#B4B0A8' : k2 === 'market' ? '#8A8C92' : '#CFD8C4'));
    C.water.forEach(w => { poly(w.pts, w.w + 4, '#E6F2F6', 'butt'); poly(w.pts, w.w, '#6E9AAE', 'butt'); });
    rect([0, C.RAIL.y0, 1000, C.RAIL.y1], '#9A968E'); C.RAIL.t.forEach(t => rect([0, t - 1, 1000, t + 1], '#5A5A62'));
    const col = { main: '#4A4C52', sub: '#6A6C72', lane: '#8E8C88', old: '#8E8676', olane: '#9A9284', arcade: '#B89A7A', dirt: '#9C8670' };
    ['dirt', 'lane', 'olane', 'old', 'arcade', 'sub', 'main'].forEach(kind => C.roads.filter(r => r.kind === kind).forEach(r => { if (kind === 'main' || kind === 'sub') poly(r.pts, r.w + 2, '#A8A49C', 'butt'); poly(r.pts, kind === 'main' ? r.w - 14 : kind === 'sub' ? r.w - 10 : r.w, col[kind], kind === 'dirt' ? 'round' : 'butt'); }));
    { const [cx, cy, rx, ry] = C.SQUARE; g.fillStyle = '#A49C8C'; g.beginPath(); g.ellipse(cx * k, cy * k, rx * k, ry * k, 0, 0, 7); g.fill(); }
    rect(C.PLAZA, '#ABA79F'); rect(C.PLAT, '#B4B0A6');
    C.bridges.forEach(b => { g.save(); g.translate(b.sx * k, b.sy * k); g.rotate(b.ang); g.fillStyle = b.ok ? '#8A7A64' : '#7A3A2A'; g.fillRect(-b.len / 2 * k, -b.wid / 2 * k, b.len * k, b.wid * k); g.restore(); });
    // 房子（屋頂的顏色）
    C.lots.forEach(l => { const t = l.type; if (t === 'parking' || t === 'vacant') rect(l.r, '#7E8086'); else if (t === 'garden') rect(l.r, '#B8A890'); else rect(l.r, t === 'midrise' || t === 'office' ? '#6E7078' : t === 'oldhouse' || t === 'kura' ? '#5E5650' : t === 'apt' ? '#7A7C82' : t === 'shop' ? '#6A5A50' : t === 'warehouse' || t === 'factory' ? '#7A7E84' : '#5A5456'); });
    Object.keys(C.FS).forEach(k2 => { const p = C.FAC[k2]; if (!p) return; const [w, d] = C.FS[k2]; rect([p[0] - w / 2, p[1] - d / 2, p[0] + w / 2, p[1] + d / 2], '#4E4A48'); });
    rect(C.STATION, '#5A5C62');
    // 城牆
    { const [x0, y0, x1, y1] = C.OLD; g.strokeStyle = '#6E6A60'; g.lineWidth = 3 * k; g.strokeRect(x0 * k, y0 * k, (x1 - x0) * k, (y1 - y0) * k); }
    return c;
  };
})(window.R);
