// 古森（自然）的 3D 城（2026-10-20 作者：剩下的城市地圖照《昭旭重要城市》的順序做；2026-10-21 重蓋：豐富度對齊吉山、奉主，修掉房子壓在人行道上的 bug）
// 設定：北州（＝北海道）的自然城市；人文與生態調和，看得到大古森木與古森精靈部落。
// 地圖（北是 -z）：
//   北：古森川（東西向）的北岸是大古森木（巨大的根、樹冠、飄著的精靈燈）和根系步道；東北的會客橋（風鈴）通往精靈部落
//   中：苔屋頂的老街巷（照 CK.H.grid 自動排：木造的店、民家）、公會古森分館、自然保護協會、生態平衡公司
//   西：梯田；東：茶園和茶廠、植樹場、小動物園、古森木造；南：古森站（木造）
(function (R) {
  const CK = R.CK, W = R.W, S = () => R.S; if (!CK || !CK.H) return;
  const H = CK.H, az = () => R.azuki, C = 'gusen', RZ = [-62, -50];
  const CUT = { north: [-150, -140, 150, -62], rice: [-150, -38, -76.5, 5.5], tea: [76.5, -38, 150, 5.5], plant: [76.5, 18.5, 150, 46], zoo: [76.5, 58, 150, 84], guild: [-30, 18.5, -6.5, 46], nature: [6.5, 18.5, 30, 46], eco: [6.5, 58, 30, 84], station: [-46, 100, 46, 150] };
  CK.define({
    id: C, name: '古森', seed: 7001, stationName: '古森站', fog: 1.5, snow: 1.5,
    walk: [-150, -140, 150, 150], spawn: [0, 108, 0], camYaw: 0, banner: '北州・大古森木的城', plaza: [0, 108],
    guards: [[-12, 100, Math.PI]], patrols: [[[-146, 12], [146, 12]]],
    gossip: ['「大古森木還在做夢。精靈是這樣說的。」', '「會客橋上的風鈴響的時候，部落的人就知道有客人。」', '「茶廠炒茶的味道，整條老街都聞得到。」', '「植樹場今天種的樹，十年後才成林。」'],
    firstTip: '第一次來古森：Tab 看地圖。大古森木根系步道（過了古森川的北邊）、梯田黃昏（西邊）、精靈部落會客橋（東北）都有觀光章；公會古森分館在老街巷；回東鶴到南邊的古森站。',
    mapNote: '北邊過了川是大古森木，東北是會客橋和精靈部落，西邊是梯田，東邊是茶廠和植樹場，南邊是古森站。',
    ads: ['古森茶', '自然保護協會', '古森木家具'], vendLines: ['熱的古森茶。瓶子是木頭色的。', '野菜湯罐頭。'], carCols: ['#4A5A3A', '#E8E4DC', '#6A4A2A', '#2A2A30'],
    build(B) {
      const M = CK.M, g = B.g, P = B.part, rr = B.rr, pk = B.pk, rnd = B.rnd, TH = THREE;
      const moss = (x0, z0, x1, z1, h) => B.roof((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, { type: 'gable', y: h, h: Math.min(x1 - x0, z1 - z0) * 0.3, o: 0.5, mat: 'mossRoof', ry: (x1 - x0) >= (z1 - z0) ? 0 : Math.PI / 2 });
      const wood = (r, h, face, col) => { B.bld({ r, h, style: 'house', face, col: col || '#8A6A4A', top: false, plain: 1 }); moss(r[0], r[1], r[2], r[3], h); };
      B.water([[-170, RZ[0]], [170, RZ[0]], [170, RZ[1]], [-170, RZ[1]]], { level: -1.4, bank: 'ishi', name: '古森川' });
      H.grid(B, {
        city: C, bounds: [-150, -140, 150, 150], cuts: Object.values(CUT).concat([[-150, RZ[0], 150, RZ[1]]]),
        hz: [[-44, 3, 3, '川沿道'], [12, 3, 3.5, '森通'], [52, 3, 3, '茶屋通'], [92, 4, 4, '站前通']],
        vx: [[0, 3, 3.5, '古森大道', 'y', -44, 96], [-70, 3, 3.5, '梯田道', null, -44, 150], [70, 3, 3.5, '茶園道', null, -44, 150], [-110, 3, 3.5, '西通', null, 12, 150], [110, 3, 3.5, '東通', null, 92, 150]],
        pal: [{ style: 'house', w: 5, h: [5, 8], shop: 0.4, cols: ['#8A6A4A', '#7A5A3A', '#9A7A5A', '#6A5A4A'], extra: { roof: 'gable', roofMat: 'mossRoof' } }, { style: 'machiya', w: 3, shop: 0.5 }, { style: 'kura', w: 1, h: [6, 7] }],
        shops: ['古森茶', '木工・古森', '野菜', '熊鈴', '精靈的布', '鹿肉乾', '蜂蜜', '登山用品', '木雕', '蕎麥麵', '溫泉饅頭', '民宿・森', '山菜料理', '藥草'],
        trees: ['pine', 'cedar', 'bare'], inner: 'grass',
        lines: [['背著大包包的登山客', ['「大古森木在北邊，走古森大道一直到底，過了橋就是。」', '「部落的會客橋，風鈴的聲音很好聽。」']], ['梯田的農夫', ['「冬天的梯田結冰，像一層一層的鏡子。」', '「黃昏的時候來。水光把天空切成一塊一塊。」']], ['木工師傅', ['「古森木的家具很香。十年後還香。」']], ['自然保護協會的人', ['「不要在樹根上走。走步道。」']], ['熊鈴店的老闆', ['「山裡一定要掛熊鈴。遺跡生物聽到也會躲。」']], ['茶廠的工人', ['「炒茶的時候整條街都香。」']], ['民宿的阿姨', ['「晚上可以聽到樹在響。精靈說那是樹在打呼。」']], ['小孩', ['「我看過精靈！耳朵是尖的！」']], ['植樹場的志工', ['「今天種一百棵。十年後來看。」']]],
        talkers: 9, steals: 3
      });
      // ---------- 北：大古森木 ----------
      B.zone(CUT.north, 'grass', 0.02);
      B.bridge(-6, RZ[0] - 0.5, 6, RZ[1] + 0.5, { rise: 0.6, deck: 0.14, mat: 'woodD', railMat: 'woodB', rail: true });
      const TX = 0, TZ = -106, bark = M('barkD');
      P(g.cyl24, bark, TX, 34, TZ, 16, 68, 16); P(g.cyl24, bark, TX, 2, TZ, 22, 4, 22);
      for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2, x = TX + Math.cos(a) * 13, z = TZ + Math.sin(a) * 13; P(g.cyl, bark, x, 2.4, z, 2.6, 13, 2.6, Math.sin(a) * 1.1, 0, -Math.cos(a) * 1.1); B.solid(x - 1.4, z - 1.4, x + 1.4, z + 1.4, 'deco'); }
      B.solid(TX - 9, TZ - 9, TX + 9, TZ + 9, 'house');
      [[0, 66, 0, 46], [-14, 58, 6, 30], [14, 60, -6, 32], [4, 74, 10, 30], [-8, 72, -10, 28], [10, 52, 16, 26], [-16, 54, -14, 24]].forEach(([dx, y, dz, s]) => P(g.ico, M('leafCedar'), TX + dx, y, TZ + dz, s, s * 0.6, s));
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2, x = TX + Math.cos(a) * 21, z = TZ + Math.sin(a) * 21; P(g.box, M('planks'), x, 0.08, z, 3.4, 0.12, 2.2, 0, -a, 0); if (i % 4 === 0) H.gas(B, TX + Math.cos(a) * 25, TZ + Math.sin(a) * 25); }
      const glow = CK.mat('elfGlow', { col: '#E8F8C8', em: '#C8F08A', ei: 2, snow: 0 }), gl = [];
      for (let i = 0; i < 24; i++) { const m = new TH.Mesh(new TH.SphereGeometry(0.35, 6, 4), glow); B.group.add(m); gl.push({ m, a: rnd() * 6.28, r: 12 + rnd() * 14, y: 10 + rnd() * 40, sp: 0.1 + rnd() * 0.2 }); }
      W.town.anim.push((dt, t) => gl.forEach(o => { const a = o.a + t * o.sp; o.m.position.set(TX + Math.cos(a) * o.r, o.y + Math.sin(t + o.a) * 1.5, TZ + Math.sin(a) * o.r); }));
      H.sight(B, TX, TZ + 22, C, 'gs_tree', 3);
      B.walk([[0, -66], [0, -84]], 2); B.walk([[-20, -106], [-20, -130]], 1);
      B.talker(8, -80, Math.PI, '大古森木的守林人', ['「根像房屋的樑。精靈說樹還在做夢。」', '「不要大聲說話。樹會醒。」']);
      for (let i = 0; i < 30; i++) { const x = rr(-146, 146), z = rr(-138, -66); if (Math.hypot(x - TX, z - TZ) < 30 || (x > 56 && x < 104) || Math.abs(x) < 4) continue; B.tree(x, z, pk(['cedar', 'pine', 'cedar']), rr(1.2, 1.8)); }
      B.area('大古森木', [-40, -140, 40, -62]); B.label('大古森木', TX, TZ - 26, 1);
      // ---------- 東北：會客橋、精靈部落 ----------
      B.bridge(76, -92, 84, -62, { rise: 0.8, deck: 0.2, mat: 'woodD', railMat: 'woodB', rail: true });
      B.bridge(76, RZ[0] - 0.5, 84, RZ[1] + 0.5, { rise: 0.6, deck: 0.2, mat: 'woodD', railMat: 'woodB', rail: true });
      for (let z = -88; z <= -64; z += 4) [75.6, 84.4].forEach(x => { P(g.cyl8, M('bronze'), x, 2.2, z, 0.18, 0.3, 0.18); B.lampAt(x, z); });
      B.box(M('woodB'), 74, 0, -96, 86, 0.6, -92); B.box(M('woodB'), 74, 0, -96.4, 75, 4, -95.6); B.box(M('woodB'), 85, 0, -96.4, 86, 4, -95.6); B.box(M('woodB'), 73.6, 4, -96.6, 86.4, 4.5, -95.4);
      B.fence(60, -96, 74, -96, 1.4, 'woodB'); B.fence(86, -96, 100, -96, 1.4, 'woodB');
      for (let i = 0; i < 6; i++) { const x = 64 + i * 10, z = -120 - (i % 2) * 10; [[-2, -2], [2, -2], [-2, 2], [2, 2]].forEach(([a, b]) => P(g.cyl8, M('woodB'), x + a, 1.6, z + b, 0.3, 3.2, 0.3)); P(g.cyl24, M('woodD'), x, 4.2, z, 6, 2.4, 6); P(g.cone, M('mossRoof'), x, 6.6, z, 7.4, 2.6, 7.4); P(g.sph, glow, x, 3, z + 3.1, 0.3, 0.3, 0.3); B.lampAt(x, z); }
      H.sight(B, 80, -90, C, 'gs_elf'); H.fac(B, 80, -78, C, 'elf', '#9AE07A');
      B.talker(80, -94.2, 0, '部落的守橋人', ['「（精靈語，點了點頭）」', '「……外來的人，到這裡為止。風鈴替你打過招呼了。」', '「大古森木在做夢。不要在樹下大聲說話。」']);
      B.area('會客橋・精靈部落', [56, -140, 104, -62]); B.label('精靈部落', 84, -126);
      // ---------- 西：梯田 ----------
      { const [x0, z0, x1, z1] = CUT.rice; for (let i = 0; i < 3; i++) { const a0 = z0 + i * 14.5, h = (2 - i) * 0.8 + 0.4; B.terrace(x0, a0, x1 - 2, a0 + 14, h, { wall: 'ishi', top: 'soil', open: [] }); B.Bt.yOff = h; B.box(M('glass'), x0 + 2, 0.02, a0 + 1, x1 - 4, 0.1, a0 + 13); B.Bt.yOff = 0; }
        H.sight(B, x1 + 1.4, (z0 + z1) / 2, C, 'gs_rice'); H.fac(B, x1 + 1.4, z1 - 4, C, 'rice', '#9AE07A');
        B.area('梯田', CUT.rice); B.label('梯田', (x0 + x1) / 2, (z0 + z1) / 2); }
      // ---------- 東：茶園、茶廠、植樹場、動物園 ----------
      { const [x0, z0, x1, z1] = CUT.tea; B.zone(CUT.tea, 'grass', 0.02);
        for (let z = z0 + 3; z <= z1 - 4; z += 4) B.hedge(x0 + 3, z, x0 + 36, z + 1.6, 0.9);
        wood([x0 + 42, z0 + 4, x1 - 4, z1 - 4], 8, 'w', '#6A5A4A'); B.chimney(x1 - 10, z0 + 8, 18);
        B.sign('古森茶廠', 'w', x0 + 42, (z0 + z1) / 2, 5.6, { size: 0.7, bg: '#3A4A2A', fg: '#F4ECD8', box: 1 });
        B.smoke(x1 - 10, 18, z0 + 8, { s: 1.4, rise: 6, drift: 1, n: 4, col: '#E8E8E8', per: 4, op: 0.35 });
        H.door(B, x0 + 40.4, (z0 + z1) / 2, 'gs_tea', '走進古森茶廠的茶室（茶套餐、野菜飯）', '#9AE07A', -Math.PI / 2); H.fac(B, x0 + 40.4, z0 + 6, C, 'tea', '#9AE07A');
        B.area('茶園・茶廠', CUT.tea); B.label('茶園', x0 + 20, (z0 + z1) / 2); }
      { const [x0, z0, x1, z1] = CUT.plant; B.zone(CUT.plant, 'soil', 0.02); for (let x = x0 + 4; x <= x1 - 4; x += 5) for (let z = z0 + 4; z <= z1 - 4; z += 5) B.tree(x + rr(-1, 1), z + rr(-1, 1), 'pine', rr(0.3, 0.5));
        H.fac(B, x0 - 1, (z0 + z1) / 2 - 6, C, 'plant', '#9AE07A'); B.inter(x0 - 1, (z0 + z1) / 2 + 6, 2.4, '植樹場幫忙（種一天樹苗）', () => az().act(C), '#9AE07A');
        B.label('植樹場', (x0 + x1) / 2, (z0 + z1) / 2); }
      { const [x0, z0, x1, z1] = CUT.zoo; B.zone(CUT.zoo, 'grass', 0.02);
        B.fence(x0 + 2, z0 + 2, x1 - 2, z0 + 2, 1.2, 'woodB'); B.fence(x0 + 2, z1 - 2, x1 - 2, z1 - 2, 1.2, 'woodB'); B.fence(x0 + 2, z0 + 2, x0 + 2, (z0 + z1) / 2 - 3, 1.2, 'woodB'); B.fence(x0 + 2, (z0 + z1) / 2 + 3, x0 + 2, z1 - 2, 1.2, 'woodB'); B.fence(x1 - 2, z0 + 2, x1 - 2, z1 - 2, 1.2, 'woodB');
        [[x0 + 20, z0 + 8], [x0 + 40, z0 + 14], [x0 + 56, z0 + 20]].forEach(([x, z], i) => { const c = ['#8A6A4A', '#E8E4DC', '#5A4A3A'][i]; P(g.box, M('paint', { col: c }), x, 0.6, z, 1.6, 1.0, 0.8); P(g.box, M('paint', { col: c }), x + 0.9, 1.1, z, 0.6, 0.6, 0.6); B.solid(x - 1, z - 0.6, x + 1.4, z + 0.6, 'deco'); });
        H.fac(B, x0 - 1, (z0 + z1) / 2, C, 'zoo', '#C8A060'); B.label('動物園', (x0 + x1) / 2, (z0 + z1) / 2); }
      // ---------- 中：公會、協會、生態平衡公司 ----------
      H.guild(B, [CUT.guild[0] + 1, CUT.guild[1] + 1, CUT.guild[2] - 1, CUT.guild[3] - 1], 'e', { p: 'gs', name: '公會古森分館', h: 8, style: 'house', col: '#7A5A3A', roof: 'mossRoof' });
      { const [x0, z0, x1, z1] = CUT.nature; wood([x0 + 1, z0 + 1, x1 - 1, z1 - 1], 7, 'w', '#8A7A5A'); B.sign('自然保護協會', 'w', x0 + 1, (z0 + z1) / 2, 4.6, { size: 0.5, bg: '#2A4A2A', fg: '#F4ECD8', box: 1 }); H.fac(B, x0 - 0.8, (z0 + z1) / 2, C, 'nature', '#9AE07A'); }
      { const [x0, z0, x1, z1] = CUT.eco; wood([x0 + 1, z0 + 1, x1 - 1, z1 - 1], 9, 'w', '#9A9A8A'); B.sign('生態平衡公司', 'w', x0 + 1, (z0 + z1) / 2, 6, { size: 0.5, bg: '#1A3A4A', fg: '#F4ECD8', box: 1 }); H.fac(B, x0 - 0.8, (z0 + z1) / 2, C, 'eco', '#7AC8E8'); H.fac(B, x0 - 0.8, z0 + 4, C, 'wood', '#C8A060'); }
      H.fac(B, -5.6, -20, C, 'street', '#C8A060');
      // ---------- 南：古森站（木造） ----------
      H.station(B, { p: 'gs', name: '古森站', w: 60, d: 18, h: 8, col: '#8A6A4A', style: 'house', roof: 'mossRoof', tt: ['往岳北：每天一班', '往板北（渡輪接駁）：每天兩班', '往東鶴：經板北，兩天', '森林巴士：植樹場、梯田'] });
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
