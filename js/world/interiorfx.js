// 室內畫面精進（2026-10-20 作者：玩家喜歡公會分館裡的風格，在那個風格上精進；先拿公會一樓試一次）
// 同一個畫風（簡單的方塊、點陣貼圖、人物清楚），多加四樣：
// 1. 光：桌上的蠟燭、吊燈有燈具也有一圈暖光（會輕微閃）；白天窗戶照進一道斜的光，光裡飄著灰塵；屋裡的底光壓暗一點，讓暖光跳出來。
// 2. 牆角變暗（烤好的，不吃效能）：牆根、家具底下鋪一層淡淡的暗影（照碰撞盒的位置自動鋪）。
// 3. 小東西：桌上的杯子、盤子、蠟燭，角落的木箱、酒桶，地上的污漬。
// 4. 調色＋光暈：跟遺跡同一套（ruinfx.js），火、蠟燭、窗戶透出像素格的光暈。
// - 只在「遺跡畫質」中、高（R.ruinGfx() > 0）的時候加；低畫質跟以前一樣。
// - 目前只有公會一樓（SAMPLE）；看過覺得對，再套到其他室內、遺跡。
// 放在 interior.js 和所有包 R.interiorHud 的檔案後面（進屋 enterNow 最後會呼叫 R.interiorHud(true)）。
(function (R) {
  const W = R.W, T = () => THREE;
  const SAMPLE = { guild: 1 };
  const on = () => !!(R.ruinGfx && R.ruinGfx() > 0 && R.pixelOn && R.pixelOn());
  R.interiorFxOn = kind => on() && !!SAMPLE[kind];
  // ---------- 共用的貼圖：柔邊的暗影 ----------
  let TX = null;
  const tex = () => {
    if (TX) return TX; const TH = T();
    const mk = (w, h, f) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), img = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const a = f(x / (w - 1), y / (h - 1)), i = (y * w + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = 0; img.data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, a))); } g.putImageData(img, 0, 0); const t = new TH.CanvasTexture(c); t.userData.shared = true; return t; };
    const ss = x => x * x * (3 - 2 * x);
    TX = {
      blob: mk(32, 32, (u, v) => { const d = Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5)) * 2; return ss(Math.max(0, 1 - d)) * 1.15; }),   // 方形柔邊（家具底下）
      edge: mk(4, 32, (u, v) => ss(1 - v)),   // 一邊深一邊淡（牆根）
      beam: (() => { const t = mk(8, 32, (u, v) => ss(Math.min(1, v * 1.6)) * ss(Math.min(1, (1 - v) * 4)) * ss(1 - Math.abs(u - 0.5) * 2) * 1.4); return t; })()
    };
    // 光束、光斑要的是白色、透明度漸層
    [TX.beam].forEach(t => { const g = t.image.getContext('2d'), d = g.getImageData(0, 0, t.image.width, t.image.height); for (let i = 0; i < d.data.length; i += 4) { d.data[i] = d.data[i + 1] = d.data[i + 2] = 255; } g.putImageData(d, 0, 0); t.needsUpdate = true; });
    return TX;
  };
  const darkMat = (map, a) => new (T().MeshBasicMaterial)({ color: 0x000000, map, transparent: true, opacity: a, depthWrite: false });
  // ---------- 主程式：屋子蓋好以後 ----------
  const apply = ins => {
    if (!ins || ins.ifx || !R.interiorFxOn(ins.kind)) return; ins.ifx = { dust: [] };
    const TH = T(), g = ins.group, sc = ins.scene, tx = tex(), HW = ins.pl.w / 2, HD = ins.pl.d / 2, WH = ins.pl.h;
    const geo = o => { ins.geos.push(o); return o; };
    const mesh = (gm, m, x, y, z) => { const o = new TH.Mesh(geo(gm), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
    const kit = R.INTERIOR_KIT, lam = kit && kit.lam ? kit.lam : c => new TH.MeshLambertMaterial({ color: c });
    const box = (w, h, d, c, x, y, z) => mesh(new TH.BoxGeometry(w, h, d), typeof c === 'string' ? lam(c) : c, x, y, z);
    const cyl = (r0, r1, h, c, x, y, z, n) => mesh(new TH.CylinderGeometry(r0, r1, h, n || 8), typeof c === 'string' ? lam(c, { tex: 0 }) : c, x, y, z);
    const light = (x, y, z, col, I, dist, flicker) => { const l = new TH.PointLight(new TH.Color(col).convertSRGBToLinear(), I, dist, 1.8); l.position.set(x, y, z); sc.add(l); ins.lights.push({ l, I, x, flicker }); return l; };
    const flame = (x, y, z, s) => { const f = mesh(new TH.ConeGeometry(0.06 * s, 0.2 * s, 5), lam('#FFB04A', { em: '#FF8A2A', ei: 1.4 }), x, y, z); f.castShadow = false; ins.flames.push(f); return f; };
    // 1. 底光壓暗、原本的燈亮一點（暖光才跳得出來）
    sc.children.forEach(o => { if (o.isHemisphereLight) o.intensity *= 0.62; if (o.isDirectionalLight) o.intensity *= 0.7; });
    ins.lights.forEach(L => { L.I *= L.flicker ? 1.05 : 1.3; L.l.intensity = L.I; L.l.decay = 1.8; });   // 暖爐本來就夠亮（加太多會把吧台老闆的臉照成一片橘）
    // 2. 牆角變暗：照碰撞盒鋪（牆的兩側長邊、家具底下）
    const flatQ = (w, d, m, x, z, y, ry) => { const o = new TH.Mesh(geo(new TH.PlaneGeometry(w, d)), m); o.rotation.x = -Math.PI / 2; if (ry) o.rotation.z = ry; o.position.set(x, y, z); o.renderOrder = 1; g.add(o); return o; };
    const edgeM = darkMat(tx.edge, 0.42), blobM = darkMat(tx.blob, 0.5);
    let k = 0;
    (R.col.list || []).forEach(c => {
      const w = c.x1 - c.x0, d = c.z1 - c.z0, y = 0.011 + (k++ % 20) * 0.0004;
      if (c.tag === 'wall') {
        const W0 = 0.85;   // 牆根的暗影往屋裡伸 85 公分
        if (w >= d) { if (c.z1 > -HD - 0.2 && c.z1 < HD) flatQ(w, W0, edgeM, (c.x0 + c.x1) / 2, c.z1 + W0 / 2, y); if (c.z0 < HD + 0.2 && c.z0 > -HD) flatQ(w, W0, edgeM, (c.x0 + c.x1) / 2, c.z0 - W0 / 2, y, Math.PI); }
        else { if (c.x1 < HW && c.x1 > -HW - 0.2) flatQ(d, W0, edgeM, c.x1 + W0 / 2, (c.z0 + c.z1) / 2, y, Math.PI / 2); if (c.x0 > -HW && c.x0 < HW + 0.2) flatQ(d, W0, edgeM, c.x0 - W0 / 2, (c.z0 + c.z1) / 2, y, -Math.PI / 2); }
      } else if (/^(table|bench|desk|bar|shelf|stool|pot|board|fire|stairs|crate|barrel)$/.test(c.tag)) {
        const m = 0.38; flatQ(w + m * 2, d + m * 2, blobM, (c.x0 + c.x1) / 2, (c.z0 + c.z1) / 2, y);
      }
    });
    if (ins.kind === 'guild') furnishGuild(ins, { box, cyl, light, flame, mesh, lam, flatQ, HW, HD, WH, TH });
  };
  // ---------- 公會一樓 ----------
  const furnishGuild = (ins, c) => {
    const { box, cyl, light, flame, mesh, lam, flatQ, HW, HD, WH, TH } = c, tx = tex();
    const block = (x0, x1, z0, z1, tag) => R.addBox(x0, x1, z0, z1, tag);
    const candle = (x, y, z) => { cyl(0.06, 0.07, 0.2, '#EDE4D0', x, y + 0.1, z, 6); cyl(0.12, 0.12, 0.03, '#8A6A3A', x, y + 0.015, z, 8); flame(x, y + 0.29, z, 1); light(x, y + 0.35, z, '#FFB060', 0.8, 4.5, true); };
    const mug = (x, y, z, col) => { cyl(0.07, 0.065, 0.16, col || '#C8B89A', x, y + 0.08, z, 7); };
    const plate = (x, y, z) => { cyl(0.16, 0.14, 0.025, '#B8B0A0', x, y + 0.012, z, 10); };
    // 長桌（大廳）：杯子、盤子、蠟燭
    [[-9.5, 1.2], [-9.5, 5.6]].forEach(([x, z], i) => { const y = 0.92; candle(x + 0.2, y, z); mug(x - 0.8, y, z - 0.3); mug(x + 0.9, y, z + 0.35, '#8A6A4A'); plate(x - 0.3, y, z + 0.35); if (i) { plate(x + 0.6, y, z - 0.35); mug(x - 0.95, y, z + 0.3); } });
    // 圓桌（酒場）：蠟燭
    [[10, 0.5], [12.8, 4.5], [9.2, 5.8]].forEach(([x, z]) => candle(x - 0.15, 0.91, z - 0.25));
    // 吧台上：杯子一排、一根蠟燭
    for (let i = 0; i < 4; i++) mug(8.6 + i * 0.5, 1.2, -5.9 + (i % 2) * 0.12, i % 2 ? '#8A6A4A' : '#C8B89A');
    candle(13.4, 1.2, -5.85);
    // 吊燈：原本只有光、看不到燈；補上掛下來的燈籠
    const lantern = (x, y, z) => { box(0.02, WH - y - 0.2, 0.02, '#2A2018', x, (WH + y + 0.2) / 2, z); box(0.36, 0.06, 0.36, '#3A2A1C', x, y + 0.24, z); box(0.36, 0.06, 0.36, '#3A2A1C', x, y - 0.24, z); const core = box(0.28, 0.42, 0.28, lam('#FFE0A0', { em: '#FFC060', ei: 1.3 }), x, y, z); core.castShadow = false; };
    [[0, 3.6, -6.2], [-8, 3.6, 3.4], [0, 3.6, 4], [11, 3.4, 0]].forEach(([x, y, z]) => lantern(x, y + 0.3, z));
    // 角落：木箱（大廳西南）、酒桶（吧台和暖爐中間）
    const crate = (x, z, s, y) => { box(0.8 * s, 0.8 * s, 0.8 * s, '#7A5A3A', x, (y || 0) + 0.4 * s, z); box(0.84 * s, 0.08, 0.84 * s, '#5A3E28', x, (y || 0) + 0.8 * s - 0.02, z); };
    crate(-13.9, -2.6, 1); crate(-13.0, -2.5, 0.8); crate(-13.8, -2.6, 0.7, 0.8); block(-14.35, -12.55, -3.05, -2.05, 'crate');
    const barrel = (x, z) => { cyl(0.38, 0.34, 0.95, '#6A4A2E', x, 0.475, z, 10); [0.2, 0.75].forEach(y => cyl(0.395, 0.395, 0.05, '#3A2A1C', x, y, z, 10)); };
    barrel(14.45, -5.15); barrel(14.35, -4.35); block(13.95, 14.85, -5.55, -3.95, 'barrel');
    // 地上的污漬（酒場：吧台前、圓桌旁）
    const stainM = darkMat(tx.blob, 0.22);
    [[9.6, -4.9, 0.9], [11.4, 1.2, 0.7], [12.1, 5.2, 0.6], [-9.0, 3.4, 0.6]].forEach(([x, z, s], i) => flatQ(s * 1.3, s, stainM, x, z, 0.0125 + i * 0.0003, i));
    // 窗戶照進來的光（白天）：地上一塊光斑＋一道斜的光束＋光裡的灰塵
    const h = R.S && R.S.hour != null ? R.S.hour : 12, day = h >= 7 && h < 17, dusk = (h >= 16 && h < 18) || (h >= 6 && h < 8);
    if (day || dusk) {
      const col = dusk ? '#FFC890' : '#FFF0D2', a = dusk ? 0.16 : 0.2;
      const beamM = new TH.MeshBasicMaterial({ color: new TH.Color(col).convertSRGBToLinear(), map: tx.beam, transparent: true, opacity: a, depthWrite: false, blending: TH.AdditiveBlending, side: TH.DoubleSide });
      const patchM = new TH.MeshBasicMaterial({ color: new TH.Color(col).convertSRGBToLinear(), map: tx.blob, transparent: true, opacity: a * 1.1, depthWrite: false, blending: TH.AdditiveBlending });
      // [窗戶中心 x, y, z, 往屋裡的方向 nx, nz]：西牆的窗、北牆的窗
      [[-HW + 0.1, 2.9, 4.5, 1, 0], [-4.8, 2.9, -HD + 0.1, 0, 1]].forEach(([wx, wy, wz, nx, nz]) => {
        const reach = 2.6, fx = wx + nx * reach, fz = wz + nz * reach;   // 光斑落在離牆 2.6 公尺的地上
        const p = flatQ(1.5, 2.0, patchM, fx, fz, 0.016, nx ? Math.PI / 2 : 0); p.renderOrder = 2;
        // 光束：從窗戶斜斜地落到光斑（一片立著的面，朝鏡頭那邊看得到）
        const len = Math.hypot(reach, wy), b = new TH.Mesh(new TH.PlaneGeometry(1.3, len), beamM); ins.geos.push(b.geometry);
        const u = new TH.Vector3(-nz, 0, nx), v = new TH.Vector3(wx - fx, wy, wz - fz).normalize(), n = new TH.Vector3().crossVectors(u, v);
        b.quaternion.setFromRotationMatrix(new TH.Matrix4().makeBasis(u, v, n)); b.position.set((wx + fx) / 2, wy / 2, (wz + fz) / 2); b.renderOrder = 3; ins.group.add(b);
        // 灰塵：光束裡慢慢飄的小亮點
        const N = 18, arr = new Float32Array(N * 3), seed = [];
        for (let i = 0; i < N; i++) { const t = Math.random(), s = (Math.random() - 0.5) * 1.1; seed.push([t, s, Math.random() * 6]); }
        const pg = new TH.BufferGeometry(); pg.setAttribute('position', new TH.BufferAttribute(arr, 3)); ins.geos.push(pg);
        const pts = new TH.Points(pg, new TH.PointsMaterial({ color: new TH.Color('#FFF4DC').convertSRGBToLinear(), size: 2, sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false, blending: TH.AdditiveBlending }));
        pts.renderOrder = 4; ins.group.add(pts);
        ins.ifx.dust.push({ pts, arr, seed, wx, wy, wz, fx, fz, nx, nz });
      });
    }
  };
  // 灰塵慢慢飄（沿著光束上下、左右晃）
  const stepDust = (ins, dt) => {
    const f = ins.ifx; if (!f || !f.dust.length) return; f.t = (f.t || 0) + dt;
    f.dust.forEach(D => { const { arr, seed, wx, wy, wz, fx, fz, nx, nz } = D; for (let i = 0; i < seed.length; i++) { const s = seed[i]; s[0] = (s[0] + dt * 0.012) % 1; const t = s[0], px = -nz, pz = nx, wob = Math.sin(f.t * 0.7 + s[2]) * 0.12; arr[i * 3] = wx + (fx - wx) * t + px * (s[1] + wob); arr[i * 3 + 1] = wy * (1 - t) + 0.2 + Math.sin(f.t * 0.5 + s[2] * 2) * 0.15; arr[i * 3 + 2] = wz + (fz - wz) * t + pz * (s[1] + wob); } D.pts.geometry.attributes.position.needsUpdate = true; });
  };
  // ---------- 接上：進屋（enterNow 最後呼叫 R.interiorHud(true)）、每一格（R.interiorHud(false, dt)） ----------
  const hud0 = R.interiorHud;
  if (hud0) R.interiorHud = (force, dt) => {
    const r = hud0(force, dt);
    try { const ins = W.inside; if (ins) { if (force) apply(ins); else if (dt) stepDust(ins, dt); } } catch (e) { console.warn('[interiorfx]', e); }
    return r;
  };
})(window.R);
