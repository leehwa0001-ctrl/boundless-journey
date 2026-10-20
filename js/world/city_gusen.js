// 古森（自然）的 3D 城（2026-10-20 作者：剩下的城市地圖照《昭旭重要城市》的順序一次做完）
// 設定：北州（＝北海道）的自然城市；人文與生態調和，看得到大古森木與古森精靈部落。
// 樣子：北邊正中間是大古森木（巨大的樹幹、拱起來的根、高高的樹冠），根系步道繞著它；
//   一條川從西往東流過城的北邊，東北的「會客橋」掛著風鈴通往精靈部落（對岸林子裡的高腳圓屋，外來者只能到橋上）；
//   西邊是梯田（一層一層的水面）；東邊是茶廠和茶園、植樹場、小動物園；中間是木格子窗的老街巷，屋頂長了苔；雪很多。
(function (R) {
  const CK = R.CK, W = R.W, S = () => R.S; if (!CK || !CK.H) return;
  const H = CK.H, az = () => R.azuki, C = 'gusen', RZ = [-62, -50];
  CK.define({
    id: C, name: '古森', seed: 7001, stationName: '古森站', fog: 1.5, snow: 1.5,
    walk: [-150, -140, 150, 150], spawn: [0, 108, 0], camYaw: 0, banner: '北州・大古森木的城', plaza: [0, 108],
    guards: [[-10, 100, Math.PI]], patrols: [[[-140, 12], [140, 12]]],
    gossip: ['「大古森木還在做夢。精靈是這樣說的。」', '「會客橋上的風鈴響的時候，部落的人就知道有客人。」', '「茶廠炒茶的味道，整條老街都聞得到。」', '「植樹場今天種的樹，十年後才成林。」'],
    firstTip: '第一次來古森：Tab 看地圖。大古森木根系步道（北邊正中間）、梯田黃昏（西邊）、精靈部落會客橋（東北）都有觀光章；公會古森分館在老街巷；回東鶴到南邊的古森站。',
    mapNote: '北邊是大古森木和川，東北是會客橋和精靈部落，西邊是梯田，東邊是茶廠和植樹場，南邊是古森站。',
    ads: ['古森茶', '自然保護協會', '古森木家具'], vendLines: ['熱的古森茶。瓶子是木頭色的。', '野菜湯罐頭。'], carCols: ['#4A5A3A', '#E8E4DC', '#6A4A2A', '#2A2A30'],
    build(B) {
      const M = CK.M, g = B.g, P = B.part, rr = B.rr, pk = B.pk, rnd = B.rnd, TH = THREE;
      const moss = (x0, z0, x1, z1, h) => B.roof((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, { type: 'gable', y: h, h: Math.min(x1 - x0, z1 - z0) * 0.3, o: 0.5, mat: 'mossRoof', ry: (x1 - x0) >= (z1 - z0) ? 0 : Math.PI / 2 });
      const wood = (r, h, face, col) => { B.bld({ r, h, style: 'house', face, col: col || '#8A6A4A', top: false }); moss(r[0], r[1], r[2], r[3], h); };
      B.road(-150, 88, 150, 96, { sw: 4, name: '站前通' });
      B.road(-150, 8, 150, 16, { sw: 3, name: '森通' });
      B.road(-6, -44, 6, 88, { sw: 3, name: '古森大道' });
      B.road(-150, -48, 150, -42, { sw: 2.5, name: '川沿道' });
      // ---------- 北：川、大古森木 ----------
      B.water([[-170, RZ[0]], [170, RZ[0]], [170, RZ[1]], [-170, RZ[1]]], { level: -1.4, bank: 'ishi', name: '古森川' });
      B.bridge(-6, RZ[0] - 0.5, 6, RZ[1] + 0.5, { rise: 0.6, deck: 0.14, mat: 'woodD', railMat: 'woodB', rail: true });
      B.zone([-150, -140, 150, RZ[0]], 'grass', 0.02);
      const TX = 0, TZ = -104, bark = M('barkD');
      P(g.cyl24, bark, TX, 34, TZ, 16, 68, 16); P(g.cyl24, bark, TX, 2, TZ, 22, 4, 22);
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, x = TX + Math.cos(a) * 13, z = TZ + Math.sin(a) * 13; P(g.cyl, bark, x, 2.4, z, 2.6, 13, 2.6, Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); B.solid(x - 1.4, z - 1.4, x + 1.4, z + 1.4, 'deco'); }
      B.solid(TX - 9, TZ - 9, TX + 9, TZ + 9, 'house');
      [[0, 66, 0, 46], [-14, 58, 6, 30], [14, 60, -6, 32], [4, 74, 10, 30], [-8, 72, -10, 28], [10, 52, 16, 26], [-16, 54, -14, 24]].forEach(([dx, y, dz, s]) => P(g.ico, M('leafCedar'), TX + dx, y, TZ + dz, s, s * 0.6, s));
      // 根系步道（木板）繞著樹
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, x = TX + Math.cos(a) * 21, z = TZ + Math.sin(a) * 21; P(g.box, M('planks'), x, 0.25, z, 3.4, 0.12, 2.2, 0, -a, 0); if (i % 4 === 0) H.gas(B, TX + Math.cos(a) * 24, TZ + Math.sin(a) * 24); }
      // 樹上發光的小東西（精靈的燈）
      const glow = CK.mat('elfGlow', { col: '#E8F8C8', em: '#C8F08A', ei: 2, snow: 0 }), gl = [];
      for (let i = 0; i < 24; i++) { const m = new TH.Mesh(new TH.SphereGeometry(0.35, 6, 4), glow); B.group.add(m); gl.push({ m, a: rnd() * 6.28, r: 12 + rnd() * 14, y: 10 + rnd() * 40, sp: 0.1 + rnd() * 0.2 }); }
      W.town.anim.push((dt, t) => gl.forEach(o => { const a = o.a + t * o.sp; o.m.position.set(TX + Math.cos(a) * o.r, o.y + Math.sin(t + o.a) * 1.5, TZ + Math.sin(a) * o.r); }));
      H.sight(B, TX, TZ + 22, C, 'gs_tree', 3);
      B.area('大古森木', [-40, -140, 40, -64]); B.label('大古森木', TX, TZ - 26, 1);
      // ---------- 東北：會客橋（風鈴）、對岸的精靈部落 ----------
      B.bridge(76, -88, 84, RZ[1] + 0.5, { rise: 0.8, deck: 0.2, mat: 'woodD', railMat: 'woodB', rail: true });
      for (let z = -84; z <= -54; z += 4) [75.6, 84.4].forEach(x => { P(g.cyl8, M('bronze'), x, 2.2, z, 0.18, 0.3, 0.18); B.lampAt(x, z); });
      B.box(M('woodB'), 74, 0, -92, 86, 0.6, -88); B.box(M('woodB'), 74, 0, -92.4, 75, 4, -91.6); B.box(M('woodB'), 85, 0, -92.4, 86, 4, -91.6); B.box(M('woodB'), 73.6, 4, -92.6, 86.4, 4.5, -91.4);
      B.fence(66, -92, 74, -92, 1.4, 'woodB'); B.fence(86, -92, 96, -92, 1.4, 'woodB');
      for (let i = 0; i < 6; i++) { const x = 64 + i * 10, z = -118 - (i % 2) * 10; [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([a, b]) => P(g.cyl8, M('woodB'), x + a, 1.6, z + b, 0.3, 3.2, 0.3)); P(g.cyl24, M('woodD'), x, 4.2, z, 6, 2.4, 6); P(g.cone, M('mossRoof'), x, 6.6, z, 7.4, 2.6, 7.4); P(g.sph, glow, x, 3, z + 3.1, 0.3, 0.3, 0.3); B.lampAt(x, z); }
      H.sight(B, 80, -86, C, 'gs_elf'); H.fac(B, 80, -76, C, 'elf', '#9AE07A');
      B.talker(80, -90.2, 0, '部落的守橋人', ['「（精靈語，點了點頭）」', '「……外來的人，到這裡為止。風鈴替你打過招呼了。」', '「大古森木在做夢。不要在樹下大聲說話。」']);
      B.area('會客橋・精靈部落', [60, -140, 110, -50]); B.label('精靈部落', 84, -122);
      // ---------- 西：梯田（一層一層的水面） ----------
      for (let i = 0; i < 6; i++) { const z0 = -40 + i * 14, h = (5 - i) * 0.8 + 0.4; B.terrace(-150, z0, -76, z0 + 14, h, { wall: 'ishi', top: 'soil', open: [] }); B.Bt.yOff = h; B.box(M('glass'), -148, 0.02, z0 + 1, -78, 0.1, z0 + 13); B.Bt.yOff = 0; }
      H.sight(B, -70, 0, C, 'gs_rice'); H.fac(B, -70, 20, C, 'rice', '#9AE07A');
      B.area('梯田', [-152, -42, -68, 46]); B.label('梯田', -112, 0);
      // ---------- 東：茶廠、茶園、植樹場、動物園、木造公司 ----------
      B.zone([30, -40, 146, 4], 'grass', 0.02);
      for (let z = -36; z <= 0; z += 4) B.hedge(34, z, 90, z + 1.6, 0.9);   // 茶園
      wood([96, -40, 140, -14], 8, 'w', '#6A5A4A'); B.chimney(130, -44, 18);
      B.sign('古森茶廠', 'w', 96, -27, 5.6, { size: 0.7, bg: '#3A4A2A', fg: '#F4ECD8', box: 1 });
      B.smoke(130, 18, -44, { s: 1.4, rise: 6, drift: 1, n: 4, col: '#E8E8E8', per: 4, op: 0.35 });
      H.door(B, 94.4, -27, 'gs_tea', '走進古森茶廠的茶室（茶套餐、野菜飯）', '#9AE07A', -Math.PI / 2); H.fac(B, 94.4, -20, C, 'tea', '#9AE07A');
      for (let x = 46; x <= 88; x += 5) for (let z = 24; z <= 46; z += 5) B.tree(x + rr(-1, 1), z + rr(-1, 1), 'pine', rr(0.3, 0.5));   // 植樹場的樹苗
      H.fac(B, 60, 20, C, 'plant', '#9AE07A'); B.inter(48, 20, 2.4, '植樹場幫忙（種一天樹苗）', () => az().act(C), '#9AE07A');
      B.fence(96, 24, 140, 24, 1.2, 'woodB'); B.fence(96, 54, 140, 54, 1.2, 'woodB'); B.fence(96, 24, 96, 36, 1.2, 'woodB'); B.fence(96, 42, 96, 54, 1.2, 'woodB'); B.fence(140, 24, 140, 54, 1.2, 'woodB');
      [[106, 30], [124, 36], [114, 48]].forEach(([x, z], i) => { P(g.box, M('paint', { col: ['#8A6A4A', '#E8E4DC', '#5A4A3A'][i] }), x, 0.6, z, 1.6, 1.0, 0.8); P(g.box, M('paint', { col: ['#8A6A4A', '#E8E4DC', '#5A4A3A'][i] }), x + 0.9, 1.1, z, 0.6, 0.6, 0.6); });
      H.fac(B, 94, 39, C, 'zoo', '#C8A060');
      wood([96, 60, 140, 84], 7, 'w', '#9A7A5A'); B.sign('古森木造', 'w', 96, 72, 4.6, { size: 0.55, bg: '#3A2A1A', fg: '#F4ECD8', box: 1 }); H.fac(B, 94, 72, C, 'wood', '#C8A060');
      B.area('茶廠・植樹場', [28, -42, 148, 88]); B.label('茶園', 62, -18); B.label('植樹場', 62, 34); B.label('動物園', 118, 39);
      // ---------- 中：老街巷（木格子窗、苔的屋頂）、公會、協會 ----------
      const SH = ['古森茶', '木工', '野菜', '熊鈴', '精靈的布', '鹿肉乾', '蜂蜜'];
      B.row('e', -6, -40, 4, 10, { style: 'machiya', h: 6.4 }, 6, 9, i => (i % 2 ? { name: SH[i % SH.length], noren: pk(['#4A5A3A', '#5A3A2A']) } : {}));
      B.row('w', 6, -40, 4, 10, { style: 'machiya', h: 6.4 }, 6, 9, i => (i % 2 ? {} : { name: SH[(i + 3) % SH.length], noren: pk(['#4A5A3A', '#5A3A2A']) }));
      H.fac(B, 0, -20, C, 'street', '#C8A060');
      H.guild(B, [-40, 20, -16, 44], 'e', { p: 'gs', name: '公會古森分館', h: 8, style: 'house', col: '#7A5A3A', roof: 'mossRoof' });
      wood([16, 20, 40, 40], 7, 'w', '#8A7A5A'); B.sign('自然保護協會', 'w', 16, 30, 4.6, { size: 0.5, bg: '#2A4A2A', fg: '#F4ECD8', box: 1 }); H.fac(B, 14, 30, C, 'nature', '#9AE07A');
      wood([16, 50, 40, 76], 9, 'w', '#9A9A8A'); B.sign('生態平衡公司', 'w', 16, 63, 6, { size: 0.5, bg: '#1A3A4A', fg: '#F4ECD8', box: 1 }); H.fac(B, 14, 63, C, 'eco', '#7AC8E8');
      for (let z = 24; z < 86; z += 16) wood([-64, z, -46, z + 12], 6, 'e');
      B.row('e', -6, 50, 86, 10, { style: 'machiya', h: 6.4 }, 6, 9, () => ({}));
      for (let i = 0; i < 18; i++) { const x = rr(-60, 60), z = rr(-40, 84); if (Math.abs(x) < 20) continue; if (rnd() < 0.5) B.tree(x, z, pk(['pine', 'cedar', 'bare']), rr(1, 1.4)); }
      // ---------- 南：古森站（木造） ----------
      H.station(B, { p: 'gs', name: '古森站', w: 60, d: 18, h: 8, col: '#8A6A4A', style: 'house', roof: 'mossRoof', tt: ['往岳北：每天一班', '往板北（渡輪接駁）：每天兩班', '往東鶴：經板北，兩天', '森林巴士：植樹場、梯田'] });
      H.street(B, { city: C, lampsX: [[86.6, -140, 140, 20], [6.4, -60, 140, 20]], lampsZ: [[-8.4, -36, 84, 16]], walks: [[-8, 86, -8, -40], [8, -40, 8, 86], [-140, 92, 140, 92], [-140, 12, 140, 12], [-140, -45, 140, -45], [TX - 21, TZ, TX + 21, TZ]], routes: [[[[-146, 92], [146, 92], [146, 94], [-146, 94]], 2]], vends: [[-9, 60, Math.PI / 2]], vendFood: [-7.8, 60] });
      B.talker(-4, 114, Math.PI, '背著大包包的登山客', ['「大古森木在北邊，走古森大道一直到底。」', '「部落的會客橋，風鈴的聲音很好聽。」']);
      B.talker(-70, 30, Math.PI / 2, '梯田的農夫', ['「冬天的梯田結冰，像一層一層的鏡子。」', '「黃昏的時候來。水光把天空切成一塊一塊。」']);
      H.far(B, { seed: 41, snow: 120, mh: 480 });
      B.forest([-640, -640, 640, -150], 600, { skip: (x, z) => Math.hypot(x, z) > 620 });
    },
    tick() { }
  });
  H.rooms({
    p: 'gs', city: C,
    guild: { name: '公會古森分館', hint: '木造的館舍，屋頂長了苔，暖爐燒的是古森木', board: ['古森樹根迷宮：大古森木的根往地下長成了迷宮。精靈說不要砍根。', '植樹場護衛：新種的樹苗晚上被拔起來。', '部落的委託（透過守橋人）：林子裡有東西不是動物。'], lines: ['「古森的委託，要先問過精靈部落。」', '「樹根迷宮在大古森木下面。進去不要用火。」', '「這裡的冬天很長。裝備帶夠。」'] },
    station: { name: '古森站', hint: '木頭的大廳，暖爐和古森茶的香味', dest: '岳北　板北　東鶴（經板北）', lines: ['「往東鶴要經板北，兩天。」', '「往岳北每天一班。」'], waiting: ['「我是來看大古森木的。看完就回去。」'] },
    food: { id: 'gs_tea', name: '古森茶廠・茶室', hint: '炒茶的香味，窗外是茶園', floor: 'tatami', bg: '#3A4A2A', say: '「今天剛炒的茶。配野菜飯。」', cook: '茶廠的師傅', lines: ['「古森茶要用古森川的水泡。」', '「梯田的野菜，是部落的人拿來換茶的。」'] }
  });
})(window.R);
