// 剩下八座城共用的蓋城工具（2026-10-20 作者：剩下的城市地圖一次做完，照《昭旭重要城市》的順序）
// CK.H：車站（入口好找：門框、亮著的門、雨棚中間留開口、燈箱、地墊）、公會分館、觀光章、設施、瓦斯燈、吃東西的選單、
//   每座城都有的房間（公會分館、車站大廳、食堂）。城的資料（設施、觀光章、名物）照 azukicities.js 的 R.AZUKI_CITIES。
// 放在 citykit*.js、azukicities.js 後面，city_futing.js 這些城的前面。
(function (R) {
  const CK = R.CK, W = R.W, S = () => R.S; if (!CK) return;
  const az = () => R.azuki, pick = a => a[Math.floor(Math.random() * a.length)];
  const H = CK.H = {};
  H.pick = pick;
  // 紅瓦（南方島嶼、納瓦那種）、苔的屋頂（古森）
  if (CK.MDEF) Object.assign(CK.MDEF, { kawaraRed: { tex: 'kawara', col: '#D07050', snow: 0.5, nk: 1.6 }, mossRoof: { tex: 'grass', col: '#7A9A62', rough: 0.95, snow: 1.2 } });
  H.city = id => (R.AZUKI_CITIES || []).find(c => c.id === id) || {};
  // ---- 觀光章、設施、吃東西 ----
  H.sight = (B, x, z, city, sid, r) => { const sg = (H.city(city).sights || []).find(s => s[0] === sid), it = B.inter(x, z, r || 2.6, '觀光景點：' + (sg ? sg[1] : sid) + '（觀光章）', () => az().stamp(city, sid), '#E8C04A'); it.sight = sid; return it; };
  H.fac = (B, x, z, city, fid, icon, r) => { const f = (H.city(city).fac || []).find(q => q[0] === fid); return B.inter(x, z, r || 2.4, (f ? f[1] : fid) + '（看看）', () => az().fac(city, fid), icon || '#C8A060'); };
  H.door = (B, x, z, roomId, label, icon, ry, r) => B.inter(x, z, r || 2.6, label, () => { const [wx, wz] = B.toWorld(x, z); CK.enterRoom(roomId, { x: wx, z: wz, yaw: (ry || 0) + B.yaw() }); }, icon || '#C8A060');
  H.eat = (city, title, say, menu) => {
    const s = S(), nm = H.city(city).name || '';
    R.sheet('<p class="kicker">' + R.esc(nm) + '</p><h2>' + R.esc(title) + '</h2><p>' + R.esc(say) + '</p><p class="note">吃了之後，今天下遺跡有加成（一天算最後吃的那一餐）。費拉 ' + s.gold + '</p><div class="dn-menu">'
      + menu.map((m, i) => '<button type="button" class="btn" data-ckh="' + i + '"' + (s.gold < R.cost(m[1]) ? ' disabled' : '') + '><b>' + R.esc(m[0]) + '</b>　' + R.cost(m[1]) + ' 費拉<br><small>' + R.esc(m[2]) + '</small></button>').join('') + '</div>',
      '<div class="row"><button type="button" class="btn pri" id="ckh-x">不吃了</button></div>');
    document.getElementById('ckh-x').onclick = R.closeSheet;
    document.querySelectorAll('[data-ckh]').forEach(b => { b.onclick = () => { const m = menu[+b.dataset.ckh]; if (s.gold < R.cost(m[1])) return; s.gold -= R.cost(m[1]); s.buff = { kind: 'food', b: m[3], until: s.day }; R.ateFood && R.ateFood(s.buff); R.save(); R.sfx && R.sfx('coin'); R.closeSheet(); R.toast('吃了' + m[0] + '。今天下遺跡有加成。', '#E8C04A'); }; });
  };
  H.menu = city => (H.city(city).food || []).map(f => [f[0], f[1], f[2], f[3]]);
  // ---- 瓦斯燈（老街、港邊） ----
  H.gas = (B, x, z) => { const M = CK.M, g = B.g, P = B.part; P(g.cyl8, M('black'), x, 1.8, z, 0.14, 3.6, 0.14); P(g.box, M('black'), x, 3.62, z, 0.52, 0.06, 0.52); P(g.box, M('lamp'), x, 3.95, z, 0.38, 0.6, 0.38); P(g.cone, M('black'), x, 4.38, z, 0.66, 0.3, 0.66); B.lampAt(x, z); B.solid(x - 0.16, z - 0.16, x + 0.16, z + 0.16, 'deco'); };
  // ---- 車站（正面朝北，z0＝正面那一條線；入口在正中間） ----
  // o：{ p（房間的前綴）, name, w, d, h, col, style（brick／glass／wood）, roof（材質，沒有＝平頂）, bg, fg, tt（時刻表）}
  H.station = (B, o) => {
    const M = CK.M, g = B.g, P = B.part, cx = o.cx || 0, z0 = o.z0 || 124, w = o.w || 70, d = o.d || 22, h = o.h || 10, x0 = cx - w / 2, x1 = cx + w / 2;
    B.bld({ r: [x0, z0, x1, z0 + d], h, style: o.style || 'brick', face: 'n', col: o.col || '#A0503A', top: false, plain: 1 });
    if (o.roof) B.roof(cx, z0 + d / 2, w, d, { type: 'hip', y: h, h: Math.min(6, d * 0.3), o: 0.6, mat: o.roof });
    B.box(M('steelD'), cx - 4.4, 0.3, z0 - 0.3, cx - 3.8, 4.4, z0 + 0.2); B.box(M('steelD'), cx + 3.8, 0.3, z0 - 0.3, cx + 4.4, 4.4, z0 + 0.2); B.box(M('steelD'), cx - 4.4, 4.0, z0 - 0.3, cx + 4.4, 4.4, z0 + 0.2);
    B.box(M('winLit'), cx - 3.75, 0.3, z0 - 0.12, cx + 3.75, 3.95, z0 - 0.06);
    [-1, 1].forEach(sd => { B.box(M('metal'), sd < 0 ? x0 + 2 : cx + 5, 4.6, z0 - 5, sd < 0 ? cx - 5 : x1 - 2, 4.9, z0); [0.3, 0.7].forEach(t => { const x = sd < 0 ? x0 + 2 + (cx - 5 - x0 - 2) * t : cx + 5 + (x1 - 2 - cx - 5) * t; P(g.cyl8, M('metal'), x, 2.3, z0 - 4.4, 0.3, 4.6, 0.3); B.solid(x - 0.2, z0 - 4.6, x + 0.2, z0 - 4.2, 'deco'); }); B.sign('入口', 'n', z0 - 5.05, cx + sd * 7.5, 4.0, { size: 0.9, bg: '#C8A040', fg: '#1A1A1A', box: 1, lit: 1 }); });
    B.sign('入口・售票口', 'n', z0 - 0.35, cx, 5.0, { size: 0.7, bg: '#C8A040', fg: '#1A1A1A', box: 1, lit: 1 });
    B.sign(o.name, 'n', z0 - 0.3, cx, Math.min(h - 1.2, 8.4), { size: 1.8, bg: o.bg || '#F4ECD8', fg: o.fg || '#2A1A10', box: 1, lit: 1 });
    B.box(M('rubber'), cx - 3.2, 0.12, z0 - 7, cx + 3.2, 0.15, z0); [-1, 1].forEach(sd => B.box(M('lineY'), cx + sd * 3.3 - 0.12, 0.12, z0 - 7, cx + sd * 3.3 + 0.12, 0.155, z0));
    H.door(B, cx, z0 - 2, o.p + '_station', '走進' + o.name + '（售票口：回東鶴、轉往他城）', '#5A8AC8', Math.PI, 4.2);
    B.inter(cx - 12, z0 - 2, 2.4, o.name + '的時刻表', () => R.townTalk(o.name + '的時刻表', o.tt || ['往東鶴：每天四班']), '#5A8AC8');
    B.plaza(cx - w / 2 - 6, z0 - 28, cx + w / 2 + 6, z0, 'gran');
    B.area(o.name, [cx - w / 2 - 8, z0 - 28, cx + w / 2 + 8, z0 + d + 2]); B.label(o.name, cx, z0 + d / 2, 1);
  };
  // ---- 公會分館（石造、綠旗、招牌、門） ----
  H.guild = (B, r, face, o) => {
    const M = CK.M, [x0, z0, x1, z1] = r, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, h = o.h || 12;
    B.bld({ r, h, style: o.style || 'brick', face, col: o.col || '#D0C8B8', top: false, plain: 1 });
    if (o.roof) B.roof(cx, cz, x1 - x0, z1 - z0, { type: 'hip', y: h, h: Math.min(x1 - x0, z1 - z0) * 0.22, o: 0.5, mat: o.roof });
    const at = { s: [cx, z1 + 1.6, 0], n: [cx, z0 - 1.6, Math.PI], e: [x1 + 1.6, cz, Math.PI / 2], w: [x0 - 1.6, cz, -Math.PI / 2] }[face];
    const fx = { s: [x0 + 1.2, z1 + 1], n: [x0 + 1.2, z0 - 1], e: [x1 + 1, z0 + 1.2], w: [x0 - 1, z0 + 1.2] }[face];
    B.flag(fx[0], fx[1], h - 1, '#2E6A3E');
    B.sign(o.name, face, face === 's' ? z1 : face === 'n' ? z0 : face === 'e' ? x1 : x0, face === 's' || face === 'n' ? cx : cz, 5.6, { size: 0.62, bg: '#2E5A3A', fg: '#F4ECD8', box: 1, lit: 1 });
    H.door(B, at[0], at[1], o.p + '_guild', '走進' + o.name + '（地方委託）', '#3E9A5A', at[2]);
    B.label(o.name, cx, cz);
    void M;
  };
  // ---- 一般的街道家具、路人、車 ----
  H.street = (B, o) => {
    (o.lampsX || []).forEach(([z, x0, x1, step]) => { for (let x = x0; x <= x1; x += step || 16) B.lamp(x, z, Math.PI); });
    (o.lampsZ || []).forEach(([x, z0, z1, step, ry]) => { for (let z = z0; z <= z1; z += step || 16) B.lamp(x, z, ry == null ? Math.PI / 2 : ry); });
    (o.walks || []).forEach(([a, b, c, d]) => B.walk([[a, b], [c, d]], Math.max(2, Math.round(Math.hypot(c - a, d - b) / 20))));
    (o.routes || []).forEach(rt => B.route(rt[0], rt[1] || 2, rt[2]));
    (o.vends || []).forEach(([x, z, ry]) => B.vend(x, z, ry, B.pk(['#E8E4DC', '#2E5A9A', '#8A2A2A'])));
    if (o.vendFood) B.inter(o.vendFood[0], o.vendFood[1], 1.8, '自動販賣機', () => az().food(o.city), '#E8A03A');
  };
  // ---- 遠景：草地、山、樹林 ----
  H.far = (B, o) => {
    o = o || {}; const z0 = o.coast == null ? -1000 : o.coast;
    [[-1000, 165, 1000, 980], [-1000, z0, -165, 165], [165, z0, 1000, 165]].concat(o.coast == null ? [[-165, -1000, 165, -130]] : []).forEach(r => B.zone(r, o.ground || 'grass', 0.01));
    CK.mountains(B, { r0: o.r0 || 480, r1: 2500, h: o.mh || 420, seed: o.seed || 7, low: o.low || [], snow: o.snow == null ? 260 : o.snow });
    if (o.forest !== false) { B.forest([-640, -100, -190, 640], 260, { skip: (x, z) => Math.hypot(x, z) > 600 || (o.coast != null && z < o.coast + 10) }); B.forest([190, -100, 640, 640], 260, { skip: (x, z) => Math.hypot(x, z) > 600 || (o.coast != null && z < o.coast + 10) }); }
  };
  // ================= 街區產生器（2026-10-20 作者：八座城太單調、bug 多，豐富度要跟吉山、奉主對齊） =================
  // 原本的 bug：沿著大道排房子的時候沒有留人行道（B.road 的 sw 在車道外面），房子壓在人行道上 → 路人穿牆、販賣機和 NPC 被夾在牆裡。
  // 這裡照吉山的做法：先畫道路網格，算出每一個街區（扣掉人行道），沿著街區四邊排滿房子（面朝外、貼著人行道外緣），
  // 再沿著每條路放路燈、販賣機、路人、車、說話的人、可以偷的東西。地標的範圍放進 cuts，那裡不自動蓋房子。
  // o：{ bounds:[x0,z0,x1,z1],
  //      hz:[[z, hw, sw, name, line]]（東西向，一律從 x0 拉到 x1）, vx:[[x, hw, sw, name, line, z0, z1]]（南北向，可以只有一段）,
  //      water:[rect]（河、運河：路經過的地方變橋；不蓋房子）, cuts:[rect]（地標：不蓋房子）,
  //      pal:[{ style, w, h:[min,max], cols, shop（機率）, neon, top }], shops:[店名], depth, lotW:[min,max], inner（中庭的地面）,
  //      lines:[說話的人的台詞]（每一句一個人）, talkers, steals, city }
  H.grid = (B, o) => {
    const { overlap: ov, subAll } = CK.util, rnd = B.rnd, rr = B.rr, pk = B.pk, M = CK.M, g = B.g, P = B.part;
    const [X0, Z0, X1, Z1] = o.bounds, water = o.water || [], cuts = (o.cuts || []).concat(water);
    const HZ = (o.hz || []).map(([z, hw, sw, name, line]) => ({ z, hw, sw, name, line, r: [X0, z - hw, X1, z + hw] }));
    const VX = (o.vx || []).map(([x, hw, sw, name, line, z0, z1]) => ({ x, hw, sw, name, line, r: [x - hw, z0 == null ? Z0 : z0, x + hw, z1 == null ? Z1 : z1] }));
    // ---- 道路：遇到水就變橋 ----
    const draw = (rd, vert) => {
      const pieces = subAll([rd.r], water); pieces.forEach(p => B.road(p[0], p[1], p[2], p[3], { sw: rd.sw, name: rd.name, line: rd.line || 'w' }));
      water.forEach(w => { if (!ov(rd.r, w)) return; const s = rd.sw; if (vert) B.bridge(rd.r[0] - s, Math.max(w[1], rd.r[1]), rd.r[2] + s, Math.min(w[3], rd.r[3]), { rise: 0.5, deck: 0.14, mat: 'gran', railMat: o.railMat || 'steelD', rail: true }); else B.bridge(Math.max(w[0], rd.r[0]), rd.r[1] - s, Math.min(w[2], rd.r[2]), rd.r[3] + s, { rise: 0.5, deck: 0.14, mat: 'gran', railMat: o.railMat || 'steelD', rail: true }); });
    };
    HZ.forEach(rd => draw(rd, false)); VX.forEach(rd => draw(rd, true));
    // 開發用：地標範圍蓋到道路（含人行道）就在 console 提示
    (o.cuts || []).forEach(c => HZ.concat(VX).forEach(rd => { const s = rd.sw, fr = [rd.r[0] - (rd.x != null ? s : 0), rd.r[1] - (rd.z != null ? s : 0), rd.r[2] + (rd.x != null ? s : 0), rd.r[3] + (rd.z != null ? s : 0)], ox = Math.min(c[2], fr[2]) - Math.max(c[0], fr[0]), oz = Math.min(c[3], fr[3]) - Math.max(c[1], fr[1]); if (ox > 0.2 && oz > 0.2) console.warn('[cityhelp] 地標範圍蓋到路：' + rd.name + ' ' + c.join(',')); }));
    // ---- 街區：先照東西向的路切成一條一條，再照蓋住那一條的南北向路切成一塊一塊 ----
    const zs = [{ e: Z0 }].concat(HZ.slice().sort((a, b) => a.z - b.z).map(rd => ({ a: rd.z - rd.hw - rd.sw, b: rd.z + rd.hw + rd.sw }))).concat([{ s: Z1 }]);
    const blocks = [];
    for (let i = 0; i < zs.length - 1; i++) {
      const za = zs[i].e != null ? zs[i].e : zs[i].b, zb = zs[i + 1].s != null ? zs[i + 1].s : zs[i + 1].a; if (zb - za < 6) continue;
      const vs = VX.filter(rd => rd.r[1] <= za + 1 && rd.r[3] >= zb - 1).sort((a, b) => a.x - b.x);
      let xa = X0; vs.forEach(rd => { const e = rd.x - rd.hw - rd.sw; if (e - xa >= 6) blocks.push([xa, za, e, zb]); xa = rd.x + rd.hw + rd.sw; }); if (X1 - xa >= 6) blocks.push([xa, za, X1, zb]);
    }
    // ---- 每一塊：四邊排房子 ----
    let si = 0; const fronts = [];
    const pal = o.pal || [{ style: 'house', w: 1, h: [6, 10] }], tot = pal.reduce((a, p) => a + (p.w || 1), 0);
    const pickPal = () => { let t = rnd() * tot; for (const p of pal) { t -= p.w || 1; if (t <= 0) return p; } return pal[0]; };
    const lot = (side, lr) => {
      if (cuts.some(c => ov(lr, c))) return null;
      const p = pickPal(), spec = { style: p.style, h: p.style === 'machiya' ? 6.4 : rr(p.h[0], p.h[1]), top: p.top == null ? false : p.top };
      if (p.cols) spec.col = pk(p.cols);
      if (p.style === 'apt' || p.style === 'office') spec.h = (p.style === 'apt' ? 2.9 : 3.5) * Math.max(2, Math.round(spec.h / (p.style === 'apt' ? 2.9 : 3.5)));
      const outward = (side === 's' && lr[3] >= Z1 - 0.5) || (side === 'n' && lr[1] <= Z0 + 0.5) || (side === 'e' && lr[2] >= X1 - 0.5) || (side === 'w' && lr[0] <= X0 + 0.5);   // 面朝地圖外面（沒有路）：不開店
      if (!outward && p.shop && rnd() < p.shop && o.shops && o.shops.length) { const nm = o.shops[si++ % o.shops.length]; spec.name = nm; spec.vsign = nm.split('・')[0].slice(0, 3); if (p.neon) spec.neon = 1; spec.noren = pk(['#2A3A5A', '#5A2A2A', '#2E2E2E', '#4A5A3A', '#6A4A2A']); fronts.push({ side, r: lr }); }
      if (p.extra) Object.assign(spec, p.extra);
      return spec;
    };
    const base = { style: 'house', h: 8 }, lw = o.lotW || [7, 12];
    blocks.forEach(r => {
      const w = r[2] - r[0], d = r[3] - r[1]; if (w < 7 || d < 7) { if (!cuts.some(c => ov(r, c))) for (let i = 0; i < 2; i++) B.tree(rr(r[0] + 1, r[2] - 1), rr(r[1] + 1, r[3] - 1), pk(['round', 'pine', 'bare']), rr(0.9, 1.2)); return; }
      const dd = Math.min(o.depth || 14, d / 2, w / 2);
      B.row('s', r[3], r[0], r[2], dd, base, lw[0], lw[1], (i, lr) => lot('s', lr));
      B.row('n', r[1], r[0], r[2], dd, base, lw[0], lw[1], (i, lr) => lot('n', lr));
      if (d - 2 * dd >= lw[0]) { B.row('e', r[2], r[1] + dd, r[3] - dd, dd, base, lw[0], lw[1], (i, lr) => lot('e', lr)); B.row('w', r[0], r[1] + dd, r[3] - dd, dd, base, lw[0], lw[1], (i, lr) => lot('w', lr)); }
      const inner = [r[0] + dd, r[1] + dd, r[2] - dd, r[3] - dd];
      if (inner[2] - inner[0] > 6 && inner[3] - inner[1] > 6 && !cuts.some(c => ov(inner, c))) { B.zone(inner, o.inner || 'gravel', 0.02); const n = Math.min(6, Math.floor((inner[2] - inner[0]) * (inner[3] - inner[1]) / 80)); for (let i = 0; i < n; i++) B.tree(rr(inner[0] + 1.5, inner[2] - 1.5), rr(inner[1] + 1.5, inner[3] - 1.5), pk(o.trees || ['round', 'bare', 'pine']), rr(0.9, 1.3)); }
    });
    // ---- 街上的東西：沿著每條路的兩邊人行道 ----
    const roads = HZ.map(rd => ({ rd, v: false })).concat(VX.map(rd => ({ rd, v: true })));
    const nearCross = (rd, v, t) => (v ? HZ : VX).some(c => { if (v) return Math.abs(t - c.z) < c.hw + c.sw + 2.5 && rd.x >= c.r[0] && rd.x <= c.r[2]; return Math.abs(t - c.x) < c.hw + c.sw + 2.5 && rd.z >= c.r[1] && rd.z <= c.r[3]; });
    const inWater = (x, z) => water.some(w => x > w[0] - 1 && x < w[2] + 1 && z > w[1] - 1 && z < w[3] + 1);
    const inCut = (x, z, m) => (o.cuts || []).some(c => x > c[0] - m && x < c[2] + m && z > c[1] - m && z < c[3] + m);
    let nt = 0, nv = 0; const lines = (o.lines || []).slice(), maxT = o.talkers || 10, maxV = o.vends || 6;
    roads.forEach(({ rd, v }) => {
      const a0 = v ? rd.r[1] : rd.r[0], a1 = v ? rd.r[3] : rd.r[2], L = a1 - a0;
      [-1, 1].forEach(sd => {
        const off = rd.hw + 0.6, side = (v ? rd.x : rd.z) + sd * off, mid = (v ? rd.x : rd.z) + sd * (rd.hw + rd.sw / 2), edge = (v ? rd.x : rd.z) + sd * (rd.hw + rd.sw - 0.6);
        const ry = v ? (sd < 0 ? Math.PI / 2 : -Math.PI / 2) : (sd < 0 ? 0 : Math.PI);
        for (let t = a0 + 6 + (sd > 0 ? 9 : 0); t < a1 - 4; t += o.lampEvery || 18) { const x = v ? side : t, z = v ? t : side; if (nearCross(rd, v, t) || inWater(x, z) || inCut(x, z, 0.5)) continue; B.lamp(x, z, ry); }
        // 路人：照人行道的中線，水（橋）和地標中間斷開
        let seg = null; const flush = () => { if (seg && seg[1] - seg[0] > 12) { const p0 = seg[0], p1 = seg[1]; B.walk(v ? [[mid, p0], [mid, p1]] : [[p0, mid], [p1, mid]], Math.max(1, Math.round((p1 - p0) / 22))); } seg = null; };
        for (let t = a0 + 1; t <= a1 - 1; t += 1) { const x = v ? mid : t, z = v ? t : mid, ok = !inWater(x, z) && !inCut(x, z, 0.8) && !nearCross(rd, v, t); /* 路口斷開：別的路的人行道上常有長椅 */ if (ok) { if (!seg) seg = [t, t]; seg[1] = t; } else flush(); } flush();
        // 販賣機、說話的人（貼著房子那一邊）
        if (rd.sw >= 3.5 && L > 40) for (let k = 0; k < 2; k++) {
          const t = rr(a0 + 10, a1 - 10), x = v ? edge : t, z = v ? t : edge; if (nearCross(rd, v, t) || inWater(x, z) || inCut(x, z, 1.5)) continue;
          if (k === 0 && nv < maxV && rnd() < 0.5) { B.vend(x, z, ry, pk(['#E8E4DC', '#2E5A9A', '#8A2A2A', '#1A1A20'])); B.inter(x + (v ? -sd * 1.2 : 0), z + (v ? 0 : -sd * 1.2), 1.8, '自動販賣機', () => az().food(o.city), '#E8A03A'); nv++; }
          else if (nt < maxT && lines.length) { const ln = lines.splice(Math.floor(rnd() * lines.length), 1)[0]; B.talker(x, z, ry + Math.PI, ln[0], ln[1]); nt++; }
        }
      });
      // 車：每條路一個來回
      if (rd.hw >= 3 && L > 60) { const q = rd.hw / 2, p = v ? [[rd.x - q, rd.r[1] + 2], [rd.x - q, rd.r[3] - 2], [rd.x + q, rd.r[3] - 2], [rd.x + q, rd.r[1] + 2]] : [[rd.r[0] + 2, rd.z + q], [rd.r[2] - 2, rd.z + q], [rd.r[2] - 2, rd.z - q], [rd.r[0] + 2, rd.z - q]]; if (!water.some(w => ov(rd.r, w)) || o.carsOnBridge) B.route(p, Math.max(1, Math.round(L / 70)), rd.hw < 4 ? { kinds: ['car'] } : undefined); }
    });
    const shops = fronts.slice();   // 開店的那幾格（citydress.js 在店門口插旗子）
    // ---- 可以偷的東西：店門口 ----
    for (let k = 0; k < Math.min(o.steals || 4, fronts.length); k++) { const f = fronts.splice(Math.floor(rnd() * fronts.length), 1)[0], r = f.r, x = f.side === 'e' ? r[2] + 0.8 : f.side === 'w' ? r[0] - 0.8 : (r[0] + r[2]) / 2, z = f.side === 's' ? r[3] + 0.8 : f.side === 'n' ? r[1] - 0.8 : (r[1] + r[3]) / 2; B.steal(x, z, pk(['順手拿走店門口的試吃', '摸走店門口零錢盒裡的零錢', '偷拿一個店門口的小東西']), 'shop', () => ({ gold: 2 + Math.floor(Math.random() * 10) }), { time: 1.2 }); }
    void M; void g; void P;
    return { blocks, HZ, VX, shops };
  };
  // ---- 每座城都有的房間：公會分館、車站大廳、食堂 ----
  // o：{ p, city, guild:{ name, hint, lines, board }, station:{ name, hint, dest, lines }, food:{ id, name, hint, say, lines, floor } }
  H.rooms = o => {
    const p = o.p, city = o.city, G = o.guild, St = o.station, F = o.food;
    CK.defineRoom({ id: p + '_guild', name: G.name, hint: G.hint || '委託板上貼滿了地方委託', w: 16, d: 12, h: 4.4, floor: G.floor || 'wfloor', wall: 'plaster', wain: 'woodD', build(B, K) {
      K.counter(0, -3.6, 8, 0.9, { mat: 'woodB', top: 'wood' }); K.register(-2.6, -3.6);
      K.wallSign(G.name, 'n', 0, 3.3, { size: 0.62, bg: '#2E5A3A', fg: '#F4ECD8' });
      K.board(-5.6, -5.9, 3); K.board(5.6, -5.9, 3);
      B.inter(0, -2.5, 2.2, '櫃台：今日地方委託', () => az().quest(city), '#3E9A5A');
      B.inter(-5.6, -4.9, 2, '委託板（看看）', () => R.townTalk(G.name + '・委託板', [pick(G.board)]));
      B.talker(2.4, -4.6, 0, '分館的館員', G.lines);
      B.talker(-4.6, 2, Math.PI / 2, '休息的勇者', G.lines2 || ['「這裡的委託跟東鶴不一樣。先看清楚再接。」']);
      K.bench(-5.4, 0.5, 3, Math.PI / 2); K.bench(5.4, 0.5, 3, -Math.PI / 2);
      K.plant(-7.2, 4.8); K.plant(7.2, 4.8); K.rug(0, 1.5, 4, 6, '#2E5A3A'); K.lamp(-3.5, 0); K.lamp(3.5, 0);
    } });
    CK.defineRoom({ id: p + '_station', name: St.name + '・大廳', hint: St.hint || '「往東鶴的魔導電車，即將進站——」', w: 22, d: 12, h: 6, floor: 'gran', wall: 'plaster', wain: 'woodB', trim: 'steelD', amb: 1.0, build(B, K) {
      K.counter(-7, 1.0, 5, 0.9, { mat: 'woodB', top: 'wood' });
      K.wallSign(St.name, 'n', 0, 4.8, { size: 1.0, bg: '#F4ECD8', fg: '#2A1A10' });
      K.wallSign(St.dest || '東鶴　皇嶺　吉山', 'n', 0, 3.8, { size: 0.42, bg: '#2A2420', fg: '#F4D88A', lit: 1 });
      B.inter(-7, 2.2, 2.4, '售票口（回東鶴、轉往他城）', () => CK.ticket(), '#5A8AC8');
      B.talker(-7, 0, 0, '售票口的站務員', St.lines || ['「往東鶴的票嗎？」']);
      K.shelf(8, 1.5, 4, -Math.PI / 2, { cols: ['#E8E4DC', '#C83A3A', '#2E5A9A', '#E8B830'] });
      B.inter(6.6, 1.5, 2, '車站的小賣店', () => az().food(city), '#E8A03A');
      K.bench(-2, 3.8, 4, 0); K.bench(3, 3.8, 4, 0);
      if (St.waiting) B.talker(1, 2, Math.PI, '等車的人', St.waiting);
      K.lamp(-7, 0); K.lamp(0, 2); K.lamp(7, 0);
    } });
    if (F) CK.defineRoom({ id: F.id, name: F.name, hint: F.hint, w: 12, d: 9, h: 3.4, floor: F.floor || 'wfloor', wall: 'plaster', wain: 'woodB', build(B, K) {
      K.counter(0, -2.6, 8, 0.7, { mat: 'woodB', top: 'woodD' });
      K.wallSign(F.name, 'n', 0, 2.6, { size: 0.5, bg: F.bg || '#2A2420', fg: '#F4ECD8', lit: 1 });
      B.inter(0, -1.4, 2.2, '點菜', () => H.eat(city, F.name, F.say, F.menu || H.menu(city)), '#E8A03A');
      B.talker(0, -3.6, 0, F.cook || '店的老闆', F.lines);
      if (F.floor === 'tatami') [[-3, 1.8], [0, 1.8], [3, 1.8]].forEach(([x, z]) => { K.lowTable(x, z, 1.6, 1); K.cushion(x - 0.6, z + 0.9); K.cushion(x + 0.6, z + 0.9); });
      else [[-3, 2], [0, 2.2], [3, 2]].forEach(([x, z]) => K.cafeSet(x, z, { top: 'wood' }));
      K.lamp(-2, -1); K.lamp(2, -1);
    } });
  };
})(window.R);
