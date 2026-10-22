// 住家重做：不再是方塊屋（2026-10-22 作者：重新製作房子的建模，現在都太像方塊屋了）
// 原本 B.bld 的 style 'house'（沒有店名的一般住家）＝一個貼了窗戶圖的方塊＋隨機的屋頂。這裡換成照日本郊外住宅蓋的：
// - 四種格局（照地塊的大小、樓層隨機挑）：
//   L 形（主屋＋往後退的側翼，各自的屋頂）、下屋（一樓整塊、二樓縮進去，一樓那一圈是低的寄棟屋簷）、
//   山牆朝街（妻入的切妻，二樓陽台）、現代（方盒＋單斜屋頂、木板的牆面、橫的長窗）。
// - 窗戶是真的：凸出來的窗框、玻璃（晚上有一部分會亮，跟原本的窗戶一起照時間）、窗台、二樓有的有雨戶的箱子；
//   一樓的側面、後面有落地窗。玄關：門、門框、小雨遮、台階、門燈。牆有基礎（深色的一圈）、落水管、冷氣室外機、屋頂的通氣管。
// - 前院：房子往後退一點，前面一道矮的磚牆（門口留開口）＋門柱上的信箱、一兩叢灌木。
// - 店面（style 'shop'、七公尺以下、沒有霓虹的）：一樓縮進去的店面玻璃、柱、招牌的帶子、布雨遮或瓦的庇；二樓住家的窗；
//   屋頂是斜的（切妻、寄棟）或「看板建築」（正面一道高的立面藏住屋頂）。整塊地照舊是店（門、互動的位置不變）。便利商店照舊。
// - 碰撞、地圖的輪廓照每一塊量體（B.solid、D.foot）。地塊太小、太大、有店名的、轉了奇怪角度的框，照舊用原本的方塊。
// 放在 citykit*.js 後面（包住 CK.extendBuilder，所有用 B.bld 的城市都換）。
(function (R) {
  const CK = R.CK; if (!CK || !CK.extendBuilder) return;
  if (CK.MDEF) Object.assign(CK.MDEF, {
    hRoofNavy: { tex: 'kawara', col: '#5A6474', snow: 1.1, nk: 1.6 }, hRoofBrown: { tex: 'kawara', col: '#8A6A58', snow: 1.1, nk: 1.6 },
    hRoofBlack: { tex: 'kawara', col: '#4A4C52', snow: 1.1, nk: 1.6 }, hRoofGreen: { tex: 'kawara', col: '#6A7E6A', snow: 1.1, nk: 1.6 },
    hRoofTerra: { tex: 'kawara', col: '#B87A5E', snow: 1.0, nk: 1.6 }, hRoofMetal: { tex: 'corrugated', col: '#6E7680', snow: 1.1 }
  });
  const ROOFS = ['kawara', 'hRoofNavy', 'hRoofBrown', 'hRoofBlack', 'hRoofGreen', 'hRoofTerra', 'hRoofNavy', 'hRoofBlack'];
  const WALLS = ['#EEE8DC', '#E6DCC8', '#D8CDB8', '#F2EEE6', '#CFC6B4', '#E4D6C0', '#D6D2CA', '#C8B8A0', '#BFC4C2', '#E8E0D0'];
  const DARK = ['#8A7A6A', '#6E6A66', '#A08870', '#7A6A5A', '#5A5E64', '#9A8C7C', '#6A5A4E'];
  const DOORS = ['#5A4232', '#3A2E28', '#6E5240', '#2E3036', '#7A5A3E', '#4A3A30'];
  const eb0 = CK.extendBuilder;
  CK.extendBuilder = B => {
    eb0(B);
    const M = CK.M, g = B.g, P = B.part, BOX = B.box, D = B.D, rnd = B.rnd, rr = B.rr, pk = B.pk;
    const winOn = () => { const m = CK.mat('winLit|house', { col: '#55636E', em: '#FFD9A0', ei: 0, rough: 0.1, metal: 0.2, env: 1.4, snow: 0 }); m.userData.win = true; return m; };
    const house = o => {
      const [x0, z0, x1, z1] = o.r, f = o.face || 's';
      const rot = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[f], ew = f === 'e' || f === 'w';
      const W0 = ew ? z1 - z0 : x1 - x0, D0 = ew ? x1 - x0 : z1 - z0;
      const fr0 = B.Bt.getFrame(), [wcx, wcz] = B.toWorld((x0 + x1) / 2, (z0 + z1) / 2), a0 = (fr0 ? fr0.a : 0) + rot;
      B.Bt.setFrame(wcx, wcz, a0);
      const fl = Math.max(1, Math.min(3, Math.round(((o.h || 6.2) - 0.4) / 2.9))), FH = 2.85, BASE = 0.45;
      // 前院、兩邊、後面留的空間
      const sb = Math.max(0.9, Math.min(2.6, D0 * 0.2)), LX0 = -W0 / 2, LX1 = W0 / 2, LZ0 = -D0 / 2, LZ1 = D0 / 2;
      const X0 = LX0 + 0.35, X1 = LX1 - 0.35, Z0 = LZ0 + 0.35, Z1 = LZ1 - sb, w = X1 - X0, d = Z1 - Z0;
      const col = o.col && WALLS.indexOf(o.col) >= 0 ? o.col : pk(WALLS), wall = M('plaster', { col }), wall2 = M('plaster', { col: pk(WALLS) });
      const trim = rnd() < 0.5 ? M('white') : M('woodB'), frameM = M('metal', { col: pk(['#E8E6E0', '#3A3C40', '#8A8C8E', '#5A4A3E']) }), glass = M('glass'), lit = winOn();
      const roofM = o.roofMat && /^(kawara|hRoof)/.test(o.roofMat) ? o.roofMat : pk(ROOFS), mir = rnd() < 0.5 ? -1 : 1;
      const foot = [];   // 量體（碰撞、地圖輪廓）
      const two = rnd() < 0.4 ? M('plaster', { col: pk(DARK) }) : null;
      // 一面牆上的盒子：face 's'＝+z（前）、'n'＝-z、'e'＝+x、'w'＝-x；c＝牆的位置；沿著牆 a0～a1；o0～o1＝往外凸多少
      const fb = (fc, c, aa, ab, y0, y1, o0, o1, m) => {
        const sg = fc === 's' || fc === 'e' ? 1 : -1;
        if (fc === 's' || fc === 'n') BOX(m, Math.min(aa, ab), y0, Math.min(c + sg * o0, c + sg * o1), Math.max(aa, ab), y1, Math.max(c + sg * o0, c + sg * o1));
        else BOX(m, Math.min(c + sg * o0, c + sg * o1), y0, Math.min(aa, ab), Math.max(c + sg * o0, c + sg * o1), y1, Math.max(aa, ab));
      };
      // 一扇窗：中心 a、寬 ww、下緣 y、高 hh
      const win = (fc, c, a, ww, y, hh, kind) => {
        fb(fc, c, a - ww / 2 - 0.07, a + ww / 2 + 0.07, y - 0.07, y + hh + 0.07, 0, 0.06, frameM);
        fb(fc, c, a - ww / 2, a + ww / 2, y, y + hh, 0.06, 0.075, rnd() < 0.55 ? lit : glass);
        if (ww > 1.0) fb(fc, c, a - 0.03, a + 0.03, y, y + hh, 0.075, 0.095, frameM);   // 中間的框（拉窗）
        if (kind !== 'tall' && hh < 1.6) fb(fc, c, a - ww / 2 - 0.12, a + ww / 2 + 0.12, y - 0.13, y - 0.05, 0, 0.16, trim);   // 窗台
        if (kind === 'shutter') fb(fc, c, a - ww / 2 - 0.1, a + ww / 2 + 0.1, y + hh + 0.08, y + hh + 0.3, 0, 0.2, frameM);   // 雨戶的箱子
        if (kind === 'grille') for (let k = -1; k <= 1; k++) fb(fc, c, a + k * ww / 3 - 0.02, a + k * ww / 3 + 0.02, y, y + hh, 0.1, 0.13, frameM);   // 面格子
      };
      // 一面牆的窗戶（skip：門那一段不放）
      const wins = (fc, c, aa, ab, y0, floors, skip, big) => {
        const L = ab - aa, n = Math.max(0, Math.floor((L - 0.6) / 2.5)); if (!n) return;
        for (let k = 0; k < n; k++) {
          const a = aa + L * (k + 0.5) / n; if (skip && a > skip[0] - 0.9 && a < skip[1] + 0.9) continue;
          for (let fi = 0; fi < floors; fi++) {
            const y = y0 + fi * FH; if (rnd() < 0.18) continue;
            if (fi === 0 && big && rnd() < 0.55) { win(fc, c, a, Math.min(1.7, L / n - 0.5), y + 0.1, 1.95, 'tall'); continue; }
            const t = rnd(), ww = Math.min(L / n - 0.6, t < 0.3 ? 0.7 : t < 0.75 ? 1.2 : 1.6), hh = t < 0.3 ? 1.3 : 1.1;
            win(fc, c, a, ww, y + 0.95, hh, fi > 0 && rnd() < 0.35 ? 'shutter' : fi === 0 && fc === 's' && rnd() < 0.3 ? 'grille' : null);
          }
        }
      };
      // 量體：牆、基礎、四面的窗
      const vol = (ax0, az0, ax1, az1, floors, o2) => {
        o2 = o2 || {}; const h = floors * FH, wm = o2.wall || wall;
        BOX(M('concD'), ax0 - 0.04, 0, az0 - 0.04, ax1 + 0.04, BASE, az1 + 0.04);
        BOX(wm, ax0, BASE, az0, ax1, BASE + h, az1);
        if (floors > 1 && o2.band !== false) { const y = BASE + FH; BOX(trim, ax0 - 0.05, y - 0.06, az0 - 0.05, ax1 + 0.05, y + 0.06, az1 + 0.05); }   // 樓層之間的線腳
        if (!o2.lowWall && two && floors > 1 && o2.two !== false) o2.lowWall = two;
        if (o2.lowWall) { BOX(o2.lowWall, ax0 - 0.02, BASE, az0 - 0.02, ax1 + 0.02, BASE + FH, az1 + 0.02); }   // 一樓換材質（磚、深色的板）
        if (!o2.noWin) { wins('s', az1, ax0, ax1, BASE, floors, o2.door, false); wins('n', az0, ax0, ax1, BASE, floors, null, true); wins('e', ax1, az0, az1, BASE, floors, null, true); wins('w', ax0, az0, az1, BASE, floors, null, true); }
        foot.push([ax0, az0, ax1, az1]); B.solid(ax0, az0, ax1, az1, 'house');
        return BASE + h;
      };
      // 屋頂：切妻（自己補上和牆同色的山牆）、寄棟；ridgeZ＝脊沿著 z（山牆朝街）
      const roof = (ax0, az0, ax1, az1, y, type, ridgeZ, o2) => {
        o2 = o2 || {}; const cx = (ax0 + ax1) / 2, cz = (az0 + az1) / 2, rw = ridgeZ ? az1 - az0 : ax1 - ax0, rd = ridgeZ ? ax1 - ax0 : az1 - az0, ov = o2.ov || 0.55, H = o2.h || rd * (o2.pitch || 0.3);
        const ry = ridgeZ ? Math.PI / 2 : 0, rf = B.roof(cx, cz, rw, rd, { type, y, ry, h: H, o: ov, mat: o2.mat || roofM, under: 'white', edge: o2.edge || 'woodD', ridge: false, gableWall: false, sori: 0 });
        // 脊（細的、跟屋頂同一種瓦）
        if (rf.rl > 0.05) P(g.box, M(o2.mat || roofM), cx, y + rf.H + 0.06, cz, rf.rl * 2 + 0.1, 0.16, 0.26, 0, ry, 0, { noFac: true });
        if (type === 'gable') [-1, 1].forEach(sd => { const ex = cx + Math.cos(ry) * sd * (rw / 2), ez = cz - Math.sin(ry) * sd * (rw / 2); P(g.prism, o2.wall || wall, ex, y, ez, rd, rf.H * (rd / 2) / (rd / 2 + ov), 0.2, 0, ry + Math.PI / 2, 0); });
        return rf;
      };
      // 玄關：門、門框、雨遮、台階、門燈
      const door = (a, c, canopy) => {
        const dc = M('wood', { col: pk(DOORS) });
        fb('s', c, a - 0.62, a + 0.62, BASE, BASE + 2.3, 0, 0.06, trim);
        fb('s', c, a - 0.5, a + 0.5, BASE, BASE + 2.15, 0.06, 0.1, dc);
        fb('s', c, a + 0.28, a + 0.36, BASE + 0.95, BASE + 1.15, 0.1, 0.14, M('gold'));   // 門把
        fb('s', c, a - 0.85, a + 0.85, 0, BASE, 0, 0.9, M('concD'));   // 台階
        fb('s', c, a - 0.7, a + 0.7, 0, BASE * 0.5, 0.9, 1.35, M('concD'));
        if (canopy === 'roof') { B.roof(a, c + 0.55, 2.0, 1.2, { type: 'gable', y: BASE + 2.55, h: 0.45, o: 0.15, mat: roofM, under: 'white', ridge: false, gableWall: false }); }
        else fb('s', c, a - 0.95, a + 0.95, BASE + 2.45, BASE + 2.58, 0, 1.05, canopy === 'glass' ? M('glassL') : trim);
        fb('s', c, a + 0.75, a + 0.95, BASE + 1.75, BASE + 2.0, 0, 0.14, lit);   // 門燈：白天不亮，晚上跟窗戶一起亮
        fb('s', c, a - 0.95, a - 0.7, BASE + 1.45, BASE + 1.62, 0, 0.03, M('black'));   // 門牌
      };
      // 陽台：二樓前面
      const balcony = (aa, ab, c, y, dep) => {
        fb('s', c, aa, ab, y - 0.16, y, 0, dep, M('curb'));
        const solid = rnd() < 0.5, rm = solid ? wall2 : frameM;
        if (solid) { fb('s', c, aa, ab, y, y + 1.05, dep - 0.1, dep, rm); fb('s', c, aa - 0.02, aa + 0.08, y, y + 1.05, 0, dep, rm); fb('s', c, ab - 0.08, ab + 0.02, y, y + 1.05, 0, dep, rm); }
        else { fb('s', c, aa, ab, y + 1.0, y + 1.08, dep - 0.08, dep, rm); for (let a = aa + 0.05; a <= ab; a += 0.32) fb('s', c, a, a + 0.04, y, y + 1.0, dep - 0.06, dep - 0.02, rm); fb('s', c, aa, ab, y, y + 0.06, dep - 0.08, dep, rm); }
        // 晒衣竿
        if (rnd() < 0.5) { fb('s', c, aa + 0.2, ab - 0.2, y + 1.55, y + 1.6, dep * 0.5, dep * 0.5 + 0.05, M('metal')); }
        // 落地窗
        win('s', c, (aa + ab) / 2, Math.min(1.8, ab - aa - 0.8), y + 0.05, 1.95, 'tall');
      };
      // 凸窗：一樓的牆上凸出去一塊（玻璃三面、上面一片小屋頂）
      const bay = (fc, c, a) => {
        const ww = 2.0, dep = 0.55, y0 = BASE + 0.6, y1 = BASE + 2.2;
        fb(fc, c, a - ww / 2, a + ww / 2, y0 - 0.12, y0, 0, dep + 0.06, trim);
        fb(fc, c, a - ww / 2, a + ww / 2, y0, y1, dep - 0.04, dep, rnd() < 0.6 ? lit : glass);
        fb(fc, c, a - ww / 2, a - ww / 2 + 0.08, y0, y1, 0, dep, frameM); fb(fc, c, a + ww / 2 - 0.08, a + ww / 2, y0, y1, 0, dep, frameM);
        fb(fc, c, a - 0.04, a + 0.04, y0, y1, dep, dep + 0.02, frameM);
        fb(fc, c, a - ww / 2 - 0.1, a + ww / 2 + 0.1, y1, y1 + 0.14, 0, dep + 0.15, M(roofM));
      };
      const pipe = (x, z, y1) => P(g.cyl8, frameM, x, y1 / 2, z, 0.1, y1, 0.1);
      const acUnit = (fc, c, a) => { fb(fc, c, a - 0.42, a + 0.42, 0.05, 0.65, 0.05, 0.35, M('metal', { col: '#D8D8D4' })); fb(fc, c, a - 0.3, a + 0.1, 0.15, 0.55, 0.35, 0.37, M('steelD')); };

      // ---------- 挑一種格局 ----------
      const kinds = ['L', 'tsuma'];
      if (fl >= 2) kinds.push('skirt', 'skirt');
      if (w >= 7) kinds.push('L');
      kinds.push('modern');
      const kind = pk(kinds), roofType = rnd() < 0.55 ? 'gable' : 'hip';
      const mx = a => mir > 0 ? a : -a;   // 左右對調
      if (kind === 'L' && w >= 6.5 && d >= 6) {
        // 主屋（一側，整個深度）＋側翼（另一側，往後退）
        const mw = w * rr(0.52, 0.64), sx0 = mx(X0), sx1 = mx(X0 + mw), mX0 = Math.min(sx0, sx1), mX1 = Math.max(sx0, sx1);
        const wx0 = mx(X0 + mw), wx1 = mx(X1), wX0 = Math.min(wx0, wx1), wX1 = Math.max(wx0, wx1), wZ1 = Z1 - Math.min(2.2, d * 0.3);
        const wfl = fl > 1 && rnd() < 0.55 ? fl - 1 : fl;
        const da = (wX0 + wX1) / 2;
        const yM = vol(mX0, Z0, mX1, Z1, fl);
        const yW = vol(wX0, Z0, wX1, wZ1, wfl, { door: [da - 0.6, da + 0.6] });
        const ridgeZ = rnd() < 0.6;
        roof(mX0, Z0, mX1, Z1, yM, roofType, ridgeZ);
        roof(wX0, Z0, wX1, wZ1, yW, rnd() < 0.5 ? roofType : 'gable', !ridgeZ, { pitch: 0.28 });
        door(da, wZ1, pk(['flat', 'roof', 'glass']));
        if (fl > 1 && mX1 - mX0 > 3.2 && rnd() < 0.7) balcony(mX0 + 0.5, mX1 - 0.5, Z1, BASE + FH, 0.9);
        pipe(mx(X0) + (mir > 0 ? 0.08 : -0.08), Z1 + 0.08, yM);
        acUnit('e', X1, Z0 + d * 0.4);
        if (rnd() < 0.5 && d > 6) bay(mir > 0 ? 'w' : 'e', mir > 0 ? X0 : X1, Z0 + d * 0.6);
      } else if (kind === 'skirt' && fl >= 2 && w >= 5.5 && d >= 6) {
        // 一樓整塊、二樓縮進去；一樓那一圈是低的寄棟屋簷（下屋）
        const ins = Math.min(1.6, w * 0.22), s0 = mx(X0 + ins), s1 = mx(X1), uX0 = Math.min(s0, s1), uX1 = Math.max(s0, s1), uZ1 = Z1 - Math.min(1.5, d * 0.2);
        const da = mir > 0 ? X0 + 1.3 : X1 - 1.3;
        const y1 = vol(X0, Z0, X1, Z1, 1, { door: [da - 0.6, da + 0.6], lowWall: rnd() < 0.35 ? M('brick', { col: pk(['#B8A08A', '#A8907A', '#9A8A80']) }) : null });
        B.roof((X0 + X1) / 2, (Z0 + Z1) / 2, w, d, { type: 'hip', y: y1, h: 0.8, o: 0.5, mat: roofM, under: 'white', edge: 'woodD', ridge: false, gableWall: false });
        // 二樓（從一樓的屋簷裡長出來）
        BOX(wall, uX0, y1, Z0 + 0.3, uX1, y1 + (fl - 1) * FH, uZ1);
        wins('s', uZ1, uX0, uX1, y1 - 0.0, fl - 1, null, false); wins('e', uX1, Z0 + 0.3, uZ1, y1, fl - 1, null, false); wins('w', uX0, Z0 + 0.3, uZ1, y1, fl - 1, null, false); wins('n', Z0 + 0.3, uX0, uX1, y1, fl - 1, null, false);
        roof(uX0, Z0 + 0.3, uX1, uZ1, y1 + (fl - 1) * FH, roofType, rnd() < 0.4);
        door(da, Z1, 'flat');
        pipe(X1 - 0.08, Z1 + 0.08, y1);
        acUnit('w', X0, Z0 + d * 0.5);
      } else if (kind === 'modern' && w >= 5 && d >= 5) {
        // 方盒＋單斜屋頂、前面一塊木板牆、橫的長窗
        const h = BASE + fl * FH, da = mx(X1 - 1.2);
        vol(X0, Z0, X1, Z1, fl, { noWin: true, band: false, wall: M('plaster', { col: pk(['#F2F0EA', '#D8D6D0', '#4A4C50', '#E8E4DC', '#6A6460']) }) });
        const wood = M('wood', { col: pk(['#B08A64', '#8A6A4E', '#C8A27A']) }), pa0 = mx(X0), pa1 = mx(X0 + w * 0.4);
        fb('s', Z1, Math.min(pa0, pa1), Math.max(pa0, pa1), BASE, h, 0, 0.08, wood);
        for (let fi = 0; fi < fl; fi++) { const y = BASE + fi * FH + 0.9, s0 = mx(X0 + w * 0.45), s1 = mx(X1 - 0.5); if (fi > 0 || rnd() < 0.6) win('s', Z1, (s0 + s1) / 2, Math.abs(s1 - s0) - 0.2, y, 0.75, null); }
        wins('e', X1, Z0, Z1, BASE, fl, null, true); wins('w', X0, Z0, Z1, BASE, fl, null, true); wins('n', Z0, X0, X1, BASE, fl, null, true);
        // 單斜：前高後低
        const rise = Math.min(1.6, d * 0.16), dd = d + 0.8, ang = Math.atan2(rise, dd);
        P(g.box, M('hRoofMetal'), (X0 + X1) / 2, h + rise / 2 + 0.1, (Z0 + Z1) / 2, w + 0.6, 0.14, Math.hypot(dd, rise), -ang, 0, 0);
        // 斜下來的牆（兩側補成梯形：前面整高、後面沒有）
        const steps = 4; for (let k = 0; k < steps; k++) { const za = Z0 + d * k / steps, zb = Z0 + d * (k + 1) / steps, hh = rise * (k + 0.5) / steps; BOX(wall, X0, h, za, X0 + 0.01, h + hh, zb); BOX(wall, X1 - 0.01, h, za, X1, h + hh, zb); }
        BOX(M('steelD'), X0 - 0.3, h - 0.05, Z1, X1 + 0.3, h + rise + 0.2, Z1 + 0.06);   // 前面的簷板
        door(da, Z1, 'flat');
        acUnit('e', X1, Z0 + d * 0.6);
      } else {
        // 山牆朝街（妻入）、二樓陽台
        const da = mir > 0 ? X0 + Math.min(1.4, w * 0.25) : X1 - Math.min(1.4, w * 0.25);
        const y = vol(X0, Z0, X1, Z1, fl, { door: [da - 0.6, da + 0.6] });
        const ridgeZ = w < d + 1 || rnd() < 0.6;
        roof(X0, Z0, X1, Z1, y, ridgeZ || rnd() < 0.6 ? 'gable' : 'hip', ridgeZ, { pitch: 0.34 });
        door(da, Z1, pk(['roof', 'flat']));
        if (fl > 1 && w > 4.5) { const b0 = mir > 0 ? da + 1.1 : X0 + 0.4, b1 = mir > 0 ? X1 - 0.4 : da - 1.1; if (b1 - b0 > 2) balcony(b0, b1, Z1, BASE + FH, 0.85); }
        pipe(X1 - 0.08, Z1 + 0.08, y); pipe(X0 + 0.08, Z0 - 0.08, y);
        acUnit('w', X0, Z0 + d * 0.3);
        if (rnd() < 0.5 && d > 6) bay('e', X1, Z0 + d * 0.55);
        // 屋頂的通氣管
        if (rnd() < 0.5) P(g.cyl8, M('steelD'), X0 + w * 0.7, y + 1.2, Z0 + d * 0.3, 0.14, 1.6, 0.14);
      }
      // ---------- 前院：矮牆、門柱、信箱、灌木 ----------
      if (sb >= 1.1 && rnd() < 0.85) {
        const gm = pk([M('brick', { col: '#A89080' }), M('concD'), M('ashlar'), M('plaster', { col: '#D8D0C0' })]), gz = LZ1 - 0.15, hw = rr(0.7, 1.1);
        const ga = mir > 0 ? X0 + 1.3 : X1 - 1.3, gw = 1.1;
        [[LX0 + 0.1, ga - gw], [ga + gw, LX1 - 0.1]].forEach(([a, b]) => { if (b - a > 0.3) { BOX(gm, a, 0, gz - 0.1, b, hw, gz + 0.1); BOX(M('curb'), a - 0.03, hw, gz - 0.13, b + 0.03, hw + 0.06, gz + 0.13); B.solid(a, gz - 0.1, b, gz + 0.1, 'fence'); } });
        BOX(gm, ga - gw - 0.25, 0, gz - 0.2, ga - gw, 1.3, gz + 0.2); BOX(gm, ga + gw, 0, gz - 0.2, ga + gw + 0.25, 1.3, gz + 0.2);   // 門柱
        BOX(M('steelD'), ga + gw + 0.02, 0.9, gz + 0.2, ga + gw + 0.24, 1.18, gz + 0.32);   // 信箱
        // 前院的地（石板小路）、灌木
        BOX(M('gran'), ga - 0.55, 0.01, Z1 + 1.3, ga + 0.55, 0.05, gz - 0.1);
        const sh = rnd() < 0.5 ? 1 : 2; for (let k = 0; k < sh; k++) { const sx = mir > 0 ? rr(ga + gw + 0.8, LX1 - 0.6) : rr(LX0 + 0.6, ga - gw - 0.8), sz = rr(Z1 + 0.6, gz - 0.6), s = rr(0.5, 0.9); if (Math.abs(sx) < W0 / 2 - 0.3) P(g.hemi, M('hedge'), sx, 0, sz, s * 1.4, s * 1.2, s * 1.4); }
      }
      // 地圖的輪廓、碰撞（量體已經加了）
      foot.forEach(q => { const pts = [[q[0], q[1]], [q[2], q[1]], [q[2], q[3]], [q[0], q[3]]].map(p => B.toWorld(p[0], p[1])); D.foot.push(Math.abs(Math.sin(a0 * 2)) < 1e-6 ? { r: [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))], kind: 'house', h: BASE + fl * FH } : { poly: pts, kind: 'house', h: BASE + fl * FH }); });
      if (fr0) B.Bt.setFrame(fr0.x, fr0.z, fr0.a); else B.Bt.setFrame(null);
      return { r: o.r, h: BASE + fl * FH };
    };
    // ---------- 店面：一樓店舖、二樓住家（店舗併用住宅）；斜屋頂或看板建築（正面一道高的立面） ----------
    const shop = o => {
      const [x0, z0, x1, z1] = o.r, f = o.face || 's';
      const rot = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[f], ew = f === 'e' || f === 'w';
      const w = (ew ? z1 - z0 : x1 - x0) - 0.1, d = (ew ? x1 - x0 : z1 - z0) - 0.1;
      const fr0 = B.Bt.getFrame(), [wcx, wcz] = B.toWorld((x0 + x1) / 2, (z0 + z1) / 2), a0 = (fr0 ? fr0.a : 0) + rot;
      B.Bt.setFrame(wcx, wcz, a0);
      const X0 = -w / 2, X1 = w / 2, Z0 = -d / 2, Z1 = d / 2, H1 = 3.6, two = (o.h || 6.6) >= 5.5, H = two ? H1 + 2.9 : H1 + 0.2;
      const col = pk(WALLS), wall = M('plaster', { col }), frameM = M('metal', { col: pk(['#3A3C40', '#8A8C8E', '#5A4A3E', '#2E3036']) }), lit = winOn(), trim = M(pk(['white', 'woodB', 'curb']));
      const fb = (fc, c, aa, ab, y0, y1, o0, o1, m) => { const sg = fc === 's' || fc === 'e' ? 1 : -1; if (fc === 's' || fc === 'n') BOX(m, Math.min(aa, ab), y0, Math.min(c + sg * o0, c + sg * o1), Math.max(aa, ab), y1, Math.max(c + sg * o0, c + sg * o1)); else BOX(m, Math.min(c + sg * o0, c + sg * o1), y0, Math.min(aa, ab), Math.max(c + sg * o0, c + sg * o1), y1, Math.max(aa, ab)); };
      const win = (fc, c, a, ww, y, hh) => { fb(fc, c, a - ww / 2 - 0.07, a + ww / 2 + 0.07, y - 0.07, y + hh + 0.07, 0, 0.06, frameM); fb(fc, c, a - ww / 2, a + ww / 2, y, y + hh, 0.06, 0.075, rnd() < 0.5 ? lit : M('glass')); fb(fc, c, a - ww / 2 - 0.1, a + ww / 2 + 0.1, y - 0.12, y - 0.05, 0, 0.14, trim); };
      BOX(M('concD'), X0, 0, Z0, X1, 0.2, Z1);
      BOX(wall, X0, 0.2, Z0, X1, H, Z1 - 0.35);   // 店面往裡縮一點，雨遮下面像一條走廊
      BOX(wall, X0, H1, Z1 - 0.35, X1, H, Z1);
      [X0, X1 - 0.3].forEach(x => BOX(wall, x, 0.2, Z1 - 0.35, x + 0.3, H1, Z1));   // 兩邊的柱
      // 店面：亮著的玻璃、直的框、門
      const g0 = X0 + 0.3, g1 = X1 - 0.3, gz = Z1 - 0.35;
      BOX(M('concD'), g0, 0.2, gz - 0.02, g1, 0.55, gz + 0.04);
      BOX(M('shopLit'), g0, 0.55, gz - 0.02, g1, H1 - 0.75, gz + 0.02);
      const n = Math.max(2, Math.round((g1 - g0) / 1.5)); for (let k = 0; k <= n; k++) { const x = g0 + (g1 - g0) * k / n; BOX(frameM, x - 0.04, 0.55, gz, x + 0.04, H1 - 0.75, gz + 0.06); }
      const dx = rnd() < 0.5 ? g0 + (g1 - g0) / n / 2 : (g0 + g1) / 2;
      BOX(M('glassL'), dx - 0.55, 0.2, gz + 0.03, dx + 0.55, 2.4, gz + 0.06);
      // 招牌的帶子
      BOX(M(o.bandMat || 'steelD'), X0, H1 - 0.75, Z1 - 0.02, X1, H1, Z1 + 0.06);
      if (o.name) B.sign(o.name, 's', Z1 + 0.06, 0, H1 - 0.38, { bg: (o.signCol && o.signCol[0]) || '#2A2A30', fg: (o.signCol && o.signCol[1]) || '#F4ECD8', size: Math.min(0.62, (w - 0.8) / ([...o.name].length + 0.6)), lit: 1 });
      // 雨遮：斜的布或一片瓦的庇
      const awn = CK.mat('awn|' + (o.awnCol || 'h'), { tex: 'paint', col: o.awnCol || pk(['#9A2A2A', '#2A4A6A', '#3E6A48', '#7A5A3A', '#B88A3A']), rough: 0.8 });
      if (rnd() < 0.6) { P(g.box, awn, 0, H1 + 0.05, Z1 + 0.55, w - 0.2, 0.06, 1.3, 0.32, 0, 0); for (let x = X0 + 0.35; x < X1 - 0.1; x += 0.5) P(g.box, awn, x, H1 - 0.12, Z1 + 1.15, 0.5, 0.25, 0.03); }
      else B.roof(0, Z1 + 0.35, w + 0.2, 1.0, { type: 'gable', y: H1 + 0.02, h: 0.35, o: 0.1, mat: pk(ROOFS), under: 'woodD', ridge: false, gableWall: false });
      // 二樓的窗、（有的）花台
      if (two) {
        const m = Math.max(1, Math.floor((w - 0.6) / 2.2)); for (let k = 0; k < m; k++) { const a = X0 + w * (k + 0.5) / m; win('s', Z1, a, Math.min(1.4, w / m - 0.7), H1 + 0.9, 1.15); if (rnd() < 0.3) fb('s', Z1, a - 0.7, a + 0.7, H1 + 0.6, H1 + 0.8, 0, 0.3, frameM); }
        const sm = Math.floor((d - 1) / 2.6); for (let k = 0; k < sm; k++) { const a = Z0 + 0.8 + (d - 1.6) * (k + 0.5) / Math.max(1, sm); if (rnd() < 0.6) win('e', X1, a, 0.9, H1 + 0.9, 1.1); if (rnd() < 0.6) win('w', X0, a, 0.9, H1 + 0.9, 1.1); }
      }
      // 屋頂
      const kanban = two && rnd() < 0.4;
      if (kanban) {
        // 看板建築：屋頂藏在正面的高牆後面；牆上一條飾帶、上緣壓頂
        const fh = H + 1.1, pm = rnd() < 0.5 ? M('copper') : M('plaster', { col: pk(WALLS) });
        BOX(pm, X0, H1, Z1 - 0.2, X1, fh, Z1 + 0.04);
        BOX(M('curb'), X0 - 0.06, fh, Z1 - 0.26, X1 + 0.06, fh + 0.14, Z1 + 0.12);
        BOX(M('curb'), X0, H + 0.3, Z1 + 0.04, X1, H + 0.42, Z1 + 0.12);
        const kn = Math.max(2, Math.round(w / 2)); for (let k = 0; k < kn; k++) win('s', Z1 + 0.04, X0 + w * (k + 0.5) / kn, Math.min(1.2, w / 3), H1 + 0.9, 1.1);
        BOX(M('roofG'), X0 + 0.1, H, Z0 + 0.1, X1 - 0.1, H + 0.1, Z1 - 0.3);
      } else if (two) {
        const ridgeX = rnd() < 0.75, rw = ridgeX ? w : d, rd = ridgeX ? d : w, ry = ridgeX ? 0 : Math.PI / 2, type = rnd() < 0.6 ? 'gable' : 'hip';
        const rf = B.roof(0, 0, rw, rd, { type, y: H, ry, h: rd * 0.28, o: 0.45, mat: pk(ROOFS), under: 'white', edge: 'woodD', ridge: false, gableWall: false });
        if (type === 'gable') [-1, 1].forEach(sd => P(g.prism, wall, Math.cos(ry) * sd * (rw / 2), H, -Math.sin(ry) * sd * (rw / 2), rd, rf.H * (rd / 2) / (rd / 2 + 0.45), 0.2, 0, ry + Math.PI / 2, 0));
        if (rf.rl > 0.05) P(g.box, M('black'), 0, H + rf.H + 0.05, 0, rf.rl * 2, 0.14, 0.22, 0, ry, 0, { noFac: true });
      } else {
        B.roof(0, -0.2, w, d - 0.4, { type: 'hip', y: H, h: Math.min(1.4, d * 0.18), o: 0.3, mat: pk(ROOFS), under: 'white', edge: 'woodD', ridge: false, gableWall: false });
      }
      // 側面：冷氣室外機、落水管
      if (rnd() < 0.6) fb('e', X1, Z0 + 0.8, Z0 + 1.6, 0.2, 0.8, 0, 0.32, M('metal', { col: '#D8D8D4' }));
      P(g.cyl8, frameM, X1 - 0.08, H / 2, Z1 - 0.3, 0.09, H, 0.09);
      B.solid(X0, Z0, X1, Z1, 'house');
      const pts = [[X0, Z0], [X1, Z0], [X1, Z1], [X0, Z1]].map(p => B.toWorld(p[0], p[1]));
      D.foot.push(Math.abs(Math.sin(a0 * 2)) < 1e-6 ? { r: [Math.min(...pts.map(p => p[0])), Math.min(...pts.map(p => p[1])), Math.max(...pts.map(p => p[0])), Math.max(...pts.map(p => p[1]))], kind: 'shop', h: H } : { poly: pts, kind: 'shop', h: H });
      if (fr0) B.Bt.setFrame(fr0.x, fr0.z, fr0.a); else B.Bt.setFrame(null);
      return { r: o.r, h: H };
    };
    const bld0 = B.bld;
    B.bld = o => {
      if (o && o.style === 'house' && !o.name && !o.shop && !o.chimney && !o.vsign && R.CK.houseNew !== false && o.r) {
        const w = Math.abs(o.r[2] - o.r[0]), d = Math.abs(o.r[3] - o.r[1]);
        if (Math.min(w, d) >= 5 && Math.max(w, d) <= 26 && (o.h || 6) <= 10) { const fr = B.Bt.getFrame(); try { return house(o); } catch (e) { console.warn('[housekit]', e); if (fr) B.Bt.setFrame(fr.x, fr.z, fr.a); else B.Bt.setFrame(null); } }
      }
      if (o && o.style === 'shop' && !o.neon && !o.vsign && !o.ad && R.CK.houseNew !== false && o.r && (o.h || 6) <= 7 && !/便利商店/.test(o.name || '')) {
        const w = Math.abs(o.r[2] - o.r[0]), d = Math.abs(o.r[3] - o.r[1]), ew = o.face === 'e' || o.face === 'w', fw = ew ? d : w;
        if (fw >= 3.5 && Math.min(w, d) >= 3.5 && Math.max(w, d) <= 22) { const fr = B.Bt.getFrame(); try { return shop(o); } catch (e) { console.warn('[housekit] shop', e); if (fr) B.Bt.setFrame(fr.x, fr.z, fr.a); else B.Bt.setFrame(null); } }
      }
      return bld0(o);
    };
    B.house = house;
  };
})(window.R);
