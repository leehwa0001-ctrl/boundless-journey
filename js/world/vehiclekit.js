// 車子重做：不再是方塊拼的（2026-10-22 作者：除了房子，車子和火車、神社、軍艦那些也要重做）
// - 車身用側面的輪廓擠出來（THREE.ExtrudeGeometry、圓角）：斜的引擎蓋、擋風玻璃、車頂、後車廂、輪拱；
//   玻璃是另外一塊（窄一點），車頂一片車身色，中柱；保險桿、水箱護罩、大燈、尾燈、車牌、後照鏡、車門的縫、輪胎＋輪框。
// - 五種：轎車（car）、計程車（taxi：車頂的燈、側面一條色帶）、貨車（truck：平頭的駕駛室＋貨櫃）、
//   一廂車（van、德克斯凡的貨車 dex）、跑車（sport：低、長引擎蓋、尾翼）。
// - 路上跑的車（CK.makeCar，精緻城市的材質＋合成一塊）、停著能開的車（R.VEH.carMesh，Lambert 材質）共用同一套形狀；
//   腳踏車（R.VEH.bikeMesh）也換成細管子的車架。
// - 形狀算一次就記起來（同一種車只建一次幾何）。車頭朝 -z（跟原本一樣）。
// - 電車（CK.makeTrain）：見下面的說明。
// 放在 citykit3.js、vehicles.js 後面。
(function (R) {
  const CK = R.CK;
  const T = () => window.THREE;
  // ---------- 形狀 ----------
  // 側面輪廓（z＝長度方向，-z 是車頭；y＝高度）擠出成寬 w 的車身，置中
  const sideGeo = (pts, w, o) => {
    const TH = T(), sh = new TH.Shape(); o = o || {};
    pts.forEach((p, i) => { if (p.arc) sh.absarc(p.arc[0], p.arc[1], p.arc[2], Math.PI, 0, true); else if (i === 0) sh.moveTo(p[0], p[1]); else sh.lineTo(p[0], p[1]); });
    const bv = o.bevel == null ? 0.06 : o.bevel;
    const g = new TH.ExtrudeGeometry(sh, { depth: Math.max(0.01, w - bv * 2), bevelEnabled: bv > 0, bevelSize: bv, bevelThickness: bv, bevelOffset: -bv, bevelSegments: 2, curveSegments: 8 });   // bevelOffset：圓角往內收，外緣剛好在輪廓上（不然會把貼在表面的燈、窗包進去）
    g.rotateY(-Math.PI / 2); g.translate((w - bv * 2) / 2, 0, 0); g.computeVertexNormals();
    return g;
  };
  const arc = (z, r) => ({ arc: [z, 0.33, r] });   // 輪拱（底邊從車頭往車尾走，繞過輪子的上面）
  const SPECS = {
    car: () => ({
      w: 1.74, wheels: [-1.38, 1.4], wr: 0.34,
      body: [[2.16, 0.36], [2.2, 0.5], [2.19, 0.84], [2.0, 0.98], [1.3, 1.0], [-0.95, 1.0], [-1.95, 0.93], [-2.18, 0.82], [-2.2, 0.5], [-2.14, 0.36], [-1.82, 0.32], arc(-1.38, 0.43), [-0.95, 0.32], [0.97, 0.32], arc(1.4, 0.43), [1.83, 0.32]],
      glass: [[-0.92, 0.98], [-0.25, 1.45], [0.82, 1.47], [1.32, 0.99]], roof: [-0.24, 0.84, 1.45], bpillar: 0.3, gw: 1.56,
      head: -2.19, tail: 2.19, lampY: 0.8, mirror: -0.82, doors: [-0.2, 0.78], belt: 1.0
    }),
    sport: () => ({
      w: 1.84, wheels: [-1.3, 1.3], wr: 0.33,
      body: [[1.98, 0.32], [2.04, 0.5], [2.02, 0.74], [1.85, 0.86], [0.6, 0.9], [-0.55, 0.84], [-1.85, 0.68], [-2.06, 0.56], [-2.06, 0.4], [-1.95, 0.3], [-1.73, 0.3], arc(-1.3, 0.42), [-0.88, 0.3], [0.88, 0.3], arc(1.3, 0.42), [1.72, 0.3]],
      glass: [[-0.52, 0.84], [0.05, 1.18], [0.55, 1.19], [1.55, 0.88]], roof: [0.03, 0.55, 1.17], bpillar: null, gw: 1.6,
      head: -2.05, tail: 2.03, lampY: 0.62, mirror: -0.45, doors: [0.15], belt: 0.86, spoiler: 1.85
    }),
    van: () => ({
      w: 1.76, wheels: [-1.45, 1.45], wr: 0.34,
      body: [[2.2, 0.36], [2.24, 0.5], [2.22, 1.92], [2.12, 2.0], [-1.35, 1.98], [-1.95, 1.2], [-2.22, 0.95], [-2.24, 0.5], [-2.18, 0.36], [-1.88, 0.32], arc(-1.45, 0.43), [-1.02, 0.32], [1.02, 0.32], arc(1.45, 0.43), [1.88, 0.32]],
      glass: null, wind: [-1.63, 1.6, 0.92, 0.9], side: [[-1.25, 1.95], [-0.1, 1.95], [0.9, 1.95]],
      head: -2.23, tail: 2.23, lampY: 0.78, mirror: -1.6, doors: [-0.35, 0.55], belt: 1.25
    }),
    truck: () => ({
      w: 1.9, wheels: [-1.95, 1.45], wr: 0.36, dual: true,
      body: [[-1.18, 0.36], [-1.18, 2.02], [-1.3, 2.1], [-2.42, 2.06], [-2.6, 1.86], [-2.64, 1.05], [-2.62, 0.5], [-2.55, 0.36], [-2.4, 0.32], arc(-1.95, 0.45), [-1.5, 0.32]],
      glass: null, wind: [-2.65, 1.45, 0.75, 0.05], side: [[-1.95, 1.55]],
      head: -2.63, tail: 2.62, lampY: 0.62, mirror: -2.55, doors: [-1.25], belt: 1.25, cargo: [-1.05, 2.6, 0.62, 2.7]
    })
  };
  const KIND = { car: 'car', taxi: 'car', sedan: 'car', sport: 'sport', van: 'van', dex: 'van', truck: 'truck' };
  const CACHE = {};
  // 一台車的零件：[形狀, 材質名, x, y, z, rx, ry, rz]；材質名之後換成真的材質
  const parts = kind => {
    const key = kind; if (CACHE[key]) return CACHE[key];
    const TH = T(), S = SPECS[KIND[kind] || 'car'](), out = [], w = S.w;
    const B = (sx, sy, sz) => new TH.BoxGeometry(sx, sy, sz);
    const add = (geo, m, x, y, z, rx, ry, rz) => out.push([geo, m, x || 0, y || 0, z || 0, rx || 0, ry || 0, rz || 0]);
    add(sideGeo(S.body, w), 'body');
    // 玻璃（車廂）＋車頂＋中柱
    if (S.glass) { add(sideGeo(S.glass, S.gw, { bevel: 0.03 }), 'glass'); const [r0, r1, ry] = S.roof; add(B(S.gw + 0.04, 0.06, r1 - r0), 'body', 0, ry + 0.03, (r0 + r1) / 2); if (S.bpillar != null) [-1, 1].forEach(s => add(B(0.03, 0.44, 0.12), 'body', s * (S.gw / 2 + 0.005), 1.22, S.bpillar)); }
    // 一廂車、貨車：斜的擋風玻璃、側窗
    if (S.wind) { const [z, y, h, wd] = S.wind; add(B(w - 0.24, h, 0.04), 'glass', 0, y, z, wd); /* 往後倒（上緣朝車尾） */ }
    if (S.side) S.side.forEach(([z, y]) => [-1, 1].forEach(s => add(B(0.02, 0.5, 0.85), 'glass', s * (w / 2 + 0.002), y - 0.32, z)));
    // 貨車的貨櫃：箱子＋直的肋條＋後門的縫
    if (S.cargo) { const [z0, z1, y0, y1] = S.cargo; add(B(w + 0.14, y1 - y0, z1 - z0), 'white', 0, (y0 + y1) / 2, (z0 + z1) / 2); for (let z = z0 + 0.4; z < z1; z += 0.55) [-1, 1].forEach(s => add(B(0.03, y1 - y0 - 0.1, 0.06), 'chrome', s * (w / 2 + 0.085), (y0 + y1) / 2, z)); add(B(0.03, y1 - y0 - 0.15, 0.02), 'dark', 0, (y0 + y1) / 2, z1 + 0.01); add(B(w + 0.1, 0.12, z1 - z0 + 1.6), 'dark', 0, 0.48, (z0 + z1) / 2 - 0.6); }
    // 輪胎、輪框（貨車後面是雙輪）
    S.wheels.forEach((z, i) => [-1, 1].forEach(s => { const x = s * (w / 2 - 0.13); add(new TH.CylinderGeometry(S.wr, S.wr, 0.26, 16), 'tire', x, S.wr - 0.02, z, 0, 0, Math.PI / 2); add(new TH.CylinderGeometry(S.wr * 0.58, S.wr * 0.58, 0.27, 10), 'hub', x, S.wr - 0.02, z, 0, 0, Math.PI / 2); if (S.dual && i === 1) add(new TH.CylinderGeometry(S.wr, S.wr, 0.24, 16), 'tire', x - s * 0.26, S.wr - 0.02, z, 0, 0, Math.PI / 2); }));
    // 保險桿、水箱護罩、燈、車牌
    const fz = S.head, rz = S.tail, bw = w + 0.04;
    add(B(bw, 0.2, 0.16), 'dark', 0, 0.44, fz + 0.03); add(B(bw, 0.2, 0.16), 'dark', 0, 0.44, rz - 0.03);
    add(B(w * 0.5, 0.18, 0.04), 'dark', 0, S.lampY - 0.04, fz - 0.01);
    [-1, 1].forEach(s => { add(B(0.36, 0.14, 0.05), 'head', s * (w / 2 - 0.3), S.lampY, fz - 0.005); add(B(0.3, 0.14, 0.05), 'tail', s * (w / 2 - 0.26), S.lampY + 0.04, rz + 0.005); });
    add(B(0.48, 0.14, 0.03), 'white', 0, 0.62, fz - 0.03); add(B(0.48, 0.14, 0.03), 'white', 0, 0.7, rz + 0.03);
    // 後照鏡、車門的縫、門把
    [-1, 1].forEach(s => { add(B(0.14, 0.1, 0.16), 'body', s * (w / 2 + 0.07), (S.belt || 1) + 0.06, S.mirror); S.doors.forEach(z => { add(B(0.01, 0.56, 0.02), 'dark', s * (w / 2 + 0.003), (S.belt || 1) - 0.32, z); add(B(0.02, 0.04, 0.14), 'chrome', s * (w / 2 + 0.01), (S.belt || 1) - 0.12, z + 0.25); }); });
    if (S.spoiler) { add(B(w - 0.1, 0.05, 0.32), 'dark', 0, 1.06, S.spoiler); [-1, 1].forEach(s => add(B(0.05, 0.18, 0.12), 'dark', s * 0.6, 0.96, S.spoiler)); }
    // 計程車：車頂的燈、側面的色帶
    if (kind === 'taxi') { add(new TH.CylinderGeometry(0.16, 0.26, 0.22, 4, 1), 'sign', 0, 1.6, 0.25, 0, Math.PI / 4, 0); [-1, 1].forEach(s => add(B(0.012, 0.08, 3.6), 'stripe', s * (w / 2 + 0.004), 0.82, 0)); }
    CACHE[key] = out; return out;
  };
  // ---------- 精緻城市：路上跑的車 ----------
  const ckMats = col => ({
    body: CK.mat('carPaint|' + col, { col, rough: 0.28, metal: 0.55, env: 1.2, snow: 0.8 }), glass: CK.M('glass'), tire: CK.M('rubber'), hub: CK.M('metal'), chrome: CK.M('metal'),
    dark: CK.mat('carTrim', { col: '#1C1C20', rough: 0.6, snow: 0.5 }), white: CK.M('white'),
    head: CK.mat('carHead', { col: '#FFF8E8', em: '#FFF4D8', ei: 0, lamp: true, snow: 0 }), tail: CK.mat('carTail', { col: '#8A1A1A', em: '#FF2A1A', ei: 0.6, neon: true, snow: 0 }),
    sign: CK.mat('taxiSign', { col: '#FFD84A', em: '#FFC830', ei: 0.4, neon: true }), stripe: CK.mat('taxiStripe', { col: '#E8C030', rough: 0.4, snow: 0 })
  });
  const build = (kind, mats, merge) => {
    const TH = T(), grp = new TH.Group();
    parts(kind).forEach(([geo, m, x, y, z, rx, ry, rz]) => { const o = new TH.Mesh(geo, mats[m] || mats.body); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; grp.add(o); });
    return merge ? merge(grp) : grp;
  };
  if (CK && CK.makeCar) {
    const mk0 = CK.makeCar;
    // 合成一塊：同一種材質一次畫完（跟 citykit3.js 的 mergeGroup 一樣）
    const merge = grp => { const Bt = CK.batch(); grp.children.slice().forEach(o => { if (!o.isMesh) return; Bt.add(o.geometry, o.material, o.position.x, o.position.y, o.position.z, 1, 1, 1, o.rotation.x, o.rotation.y, o.rotation.z, { uv: 'keep' }); grp.remove(o); }); Bt.flush(grp); return grp; };
    CK.makeCar = (col, kind) => { try { const g = build(kind || 'car', ckMats(col), merge); g.userData.kind = kind || 'car'; return g; } catch (e) { console.warn('[vehiclekit]', e); return mk0(col, kind); } };

    // ---------- 電車（2026-10-22）：斷面擠出來的車身（圓的車頂、側面往裡收）、一扇一扇的窗、三對車門、色帶、
    // 車頂的冷氣機和集電弓、車底的機器和轉向架、連通道；第一節有車頭（大擋風玻璃、頭燈、行先顯示、排障器），最後一節有尾燈。
    // 一節 17.6 公尺、車頭朝 -z（citykit3.js 照 18.2 公尺一節排，車頭在 -z）。
    const mt0 = CK.makeTrain, TL = 17.4;
    let TG = null;
    const trainGeo = () => {
      if (TG) return TG; const TH = T(), sh = new TH.Shape();
      [[-1.4, 1.0], [1.4, 1.0], [1.45, 1.25], [1.46, 2.95], [1.32, 3.28], [0.82, 3.48], [0, 3.55], [-0.82, 3.48], [-1.32, 3.28], [-1.46, 2.95], [-1.45, 1.25]].forEach((p, k) => k ? sh.lineTo(p[0], p[1]) : sh.moveTo(p[0], p[1]));
      const g = new TH.ExtrudeGeometry(sh, { depth: TL - 0.16, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelOffset: -0.08, bevelSegments: 2, curveSegments: 6 });
      g.translate(0, 0, -(TL - 0.16) / 2); g.computeVertexNormals(); TG = g; return g;
    };
    CK.makeTrain = (col, n, o) => {
      try {
        o = o || {}; n = n || 4; const TH = T(), cars = [];
        const body = CK.mat('trainPaint|' + (col || '#E8E4DC'), { col: col || '#E8E4DC', rough: 0.3, metal: 0.5, env: 1.2, snow: 0.35 }), stripe = CK.mat('trainPaint|' + (o.stripe || '#2E5A9A'), { col: o.stripe || '#2E5A9A', rough: 0.3, metal: 0.5, env: 1.2, snow: 0.2 });   // 跑來跑去的電車，雪積得少
        const pane = CK.mat('trainPane', { col: '#3A4A58', em: '#FFE8C0', ei: 0, rough: 0.08, metal: 0.2, env: 1.4, lamp: true, snow: 0 }), dark = CK.mat('carTrim', { col: '#1C1C20', rough: 0.6, snow: 0.5 }), steel = CK.M('steelD'), metal = CK.M('metal');
        const head = CK.mat('carHead', { col: '#FFF8E8', em: '#FFF4D8', ei: 0, lamp: true, snow: 0 }), tail = CK.mat('carTail', { col: '#8A1A1A', em: '#FF2A1A', ei: 0.6, neon: true, snow: 0 }), led = CK.mat('trainLed', { col: '#2A1A0A', em: '#FFA030', ei: 1.4, neon: true, snow: 0 });
        const Bx = (sx, sy, sz) => new TH.BoxGeometry(sx, sy, sz);
        const DOORS = [-5.6, 0, 5.6], hz = TL / 2;
        for (let k = 0; k < n; k++) {
          const grp = new TH.Group(), add = (geo, m, x, y, z, rx, ry, rz) => { const ob = new TH.Mesh(geo, m); ob.position.set(x, y, z); ob.rotation.set(rx || 0, ry || 0, rz || 0); ob.castShadow = true; grp.add(ob); return ob; };
          add(trainGeo(), body, 0, 0, 0);
          [-1, 1].forEach(sd => {
            const x = sd * 1.465;
            add(Bx(0.02, 0.26, TL - 0.4), stripe, x + sd * 0.002, 1.48, 0);   // 色帶
            // 窗：門和門之間平均排；兩端（車頭那一端留給駕駛室）
            const segs = [[-hz + (k === 0 ? 2.6 : 0.8), DOORS[0] - 0.9], [DOORS[0] + 0.9, DOORS[1] - 0.9], [DOORS[1] + 0.9, DOORS[2] - 0.9], [DOORS[2] + 0.9, hz - (k === n - 1 ? 1.4 : 0.8)]];
            segs.forEach(([z0, z1]) => { const L = z1 - z0, m = Math.max(1, Math.round(L / 1.5)), w = L / m; for (let j = 0; j < m; j++) add(Bx(0.03, 0.82, w - 0.22), pane, x, 2.42, z0 + w * (j + 0.5)); });
            // 車門：兩扇（中間一條縫），上面有窗
            DOORS.forEach(z => { add(Bx(0.03, 1.95, 1.34), steel, x - sd * 0.002, 2.0, z); [-1, 1].forEach(h => add(Bx(0.035, 0.75, 0.48), pane, x, 2.4, z + h * 0.32)); add(Bx(0.04, 1.95, 0.03), dark, x, 2.0, z); });
          });
          // 車頂：冷氣機、集電弓（第二節）
          [-4.2, 4.2].forEach(z => { add(Bx(1.7, 0.32, 2.4), metal, 0, 3.66, z); add(Bx(1.5, 0.05, 2.2), dark, 0, 3.83, z); });
          if (k === (n >= 2 ? 1 : 0)) { const pz = -1.2; add(Bx(1.0, 0.12, 1.0), steel, 0, 3.62, pz); [[-0.5, 0.35], [0.5, -0.35]].forEach(([dz, a]) => add(Bx(0.06, 0.06, 1.25), steel, 0, 3.98, pz + dz * 0.55, a, 0, 0)); [[-0.5, -0.5], [0.5, 0.5]].forEach(([dz, a]) => add(Bx(0.06, 0.06, 1.0), steel, 0, 4.42, pz + dz * 0.45, a, 0, 0)); add(Bx(1.7, 0.05, 0.12), metal, 0, 4.66, pz); }
          // 車底：機器箱、轉向架（框＋四個輪子）
          add(Bx(2.3, 0.4, TL - 5.5), dark, 0, 0.78, 0);
          [-6.2, 6.2].forEach(z => { add(Bx(2.1, 0.32, 2.6), steel, 0, 0.55, z); [-0.95, 0.95].forEach(dz => [-0.74, 0.74].forEach(x => add(new TH.CylinderGeometry(0.43, 0.43, 0.14, 14), dark, x, 0.43, z + dz, 0, 0, Math.PI / 2))); });
          // 連通道（車頭、最後一節的外側沒有）
          if (k > 0) add(Bx(1.2, 2.3, 0.5), dark, 0, 2.15, -hz - 0.25);
          if (k < n - 1) add(Bx(1.2, 2.3, 0.5), dark, 0, 2.15, hz + 0.25);
          // 車頭：大擋風玻璃（往後倒一點）、頭燈、行先顯示、排障器、連結器
          if (k === 0) {
            const fz = -hz - 0.09;
            add(Bx(2.5, 1.05, 0.05), pane, 0, 2.5, fz + 0.06, 0.12, 0, 0); add(Bx(2.7, 0.08, 0.08), dark, 0, 1.95, fz);
            add(Bx(1.3, 0.24, 0.05), led, 0, 3.18, fz + 0.05);
            [-1, 1].forEach(sd => { add(Bx(0.34, 0.2, 0.06), head, sd * 0.95, 1.55, fz); add(Bx(0.18, 0.12, 0.06), tail, sd * 0.95, 1.3, fz); });
            add(Bx(2.6, 0.5, 0.5), dark, 0, 0.62, fz - 0.15); add(Bx(0.3, 0.25, 0.6), steel, 0, 0.95, fz - 0.4);
          }
          // 最後一節：後面的窗、尾燈
          if (k === n - 1) { const rz = hz + 0.09; add(Bx(2.3, 0.95, 0.05), pane, 0, 2.5, rz - 0.04); [-1, 1].forEach(sd => add(Bx(0.3, 0.18, 0.06), tail, sd * 0.95, 1.5, rz)); add(Bx(2.6, 0.45, 0.4), dark, 0, 0.62, rz + 0.1); }
          cars.push(merge(grp));
        }
        return cars;
      } catch (e) { console.warn('[vehiclekit] train', e); return mt0(col, n, o); }
    };
  }
  // ---------- 停著能開的車、腳踏車（vehicles.js） ----------
  const V = R.VEH;
  if (V && V.carMesh) {
    const cm0 = V.carMesh, lam = V.lam;
    const lmats = col => ({ body: lam(col), glass: lam('#7A98B0', { em: '#203040', ei: 0.4 }), tire: lam('#18181C'), hub: lam('#B8BCC2'), chrome: lam('#C8CCD0'), dark: lam('#1C1C20'), white: lam('#F2F2EE'), head: lam('#FFF4C8', { em: '#FFE8A0', ei: 1 }), tail: lam('#C8282A', { em: '#FF2A2A', ei: 0.8 }), sign: lam('#FFD84A', { em: '#FFC830', ei: 0.6 }), stripe: lam('#E8C030') });
    // 精緻城市裡用跟路上的車一樣的材質（Lambert 在精緻城市的光底下會發白）
    V.carMesh = (model, col) => { try { const c = col || (V.MODELS[model] || {}).col || '#3A5A8A', ck = CK && R.inCity3D && R.inCity3D(); return build(model === 'sedan' ? 'car' : model, ck ? ckMats(c) : lmats(c)); } catch (e) { console.warn('[vehiclekit]', e); return cm0(model, col); } };
    const bk0 = V.bikeMesh;
    V.bikeMesh = col => {
      try {
        const TH = T(), g = new TH.Group(), fr = lam(col || '#3A6ACF'), dk = lam('#1A1A20'), ch = lam('#C8C8D0');
        const tube = (a, b, r, m) => { const d = new TH.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(), o = new TH.Mesh(new TH.CylinderGeometry(r, r, L, 6), m); o.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); o.quaternion.setFromUnitVectors(new TH.Vector3(0, 1, 0), d.normalize()); o.castShadow = true; g.add(o); return o; };
        [-0.55, 0.55].forEach(z => { const w = new TH.Mesh(new TH.TorusGeometry(0.33, 0.035, 6, 18), dk); w.rotation.y = Math.PI / 2; w.position.set(0, 0.36, z); g.add(w); for (let k = 0; k < 4; k++) { const a = k * Math.PI / 4; tube([0, 0.36 + Math.sin(a) * 0.31, z + Math.cos(a) * 0.31], [0, 0.36 - Math.sin(a) * 0.31, z - Math.cos(a) * 0.31], 0.008, ch); } });
        const bb = [0, 0.38, 0.05], seat = [0, 0.8, 0.22], head = [0, 0.86, -0.36];
        tube(bb, seat, 0.025, fr); tube(bb, head, 0.028, fr); tube(seat, head, 0.022, fr); tube(bb, [0, 0.36, 0.55], 0.018, fr); tube(seat, [0, 0.36, 0.55], 0.016, fr); tube(head, [0, 0.36, -0.55], 0.02, ch);
        const st = new TH.Mesh(new TH.BoxGeometry(0.14, 0.05, 0.26), dk); st.position.set(0, 0.84, 0.24); g.add(st);
        tube([-0.28, 0.92, -0.38], [0.28, 0.92, -0.38], 0.016, ch);
        const bs = new TH.Mesh(new TH.BoxGeometry(0.34, 0.2, 0.26), lam('#9A9AA2')); bs.position.set(0, 0.8, -0.62); g.add(bs);   // 菜籃
        return g;
      } catch (e) { console.warn('[vehiclekit]', e); return bk0(col); }
    };
  }
})(window.R);
