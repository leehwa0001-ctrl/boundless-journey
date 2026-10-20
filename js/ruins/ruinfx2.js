// 遺跡畫面升級（二）（2026-10-20 作者：繼續做遺跡的優化；照公會分館那套——玩家喜歡）
// 交接單第 3～5 步的省效能版本，都是蓋樓層的時候一次鋪好：
// 1. 牆角變暗：每一格挨著牆的地板，沿牆邊鋪一條柔邊的暗影（烤好的，一個 InstancedMesh）。
// 2. 光圈：每一個光源（F.lights：火把、蠟燭、營火、水晶）在地上照出一圈自己顏色的光，會輕微閃動。
//    原本同時只有最近的 6 盞（W.pool）真的打光，遠一點的火把只是一團火；現在每一支都看得出照亮了腳下。
// 3. 浮塵：玩家身邊一小片空氣裡飄的亮點，照環境換——一般是灰塵、火山是往上飄的火星、凍原是雪、深海是氣泡、密林和樹根是螢火、晶洞是閃光。
// - 只在「遺跡畫質」中、高（R.ruinGfx() > 0）而且是像素版；低畫質跟以前一樣。
// 放在 dungeon.js、dread.js、fogarc.js、island.js、ruinsites.js 後面（包 R.loadFloor、R.step 最外面：別人改完光源以後才鋪）。
(function (R) {
  const W = () => R.W, T = () => THREE;
  const on = () => !!(R.ruinGfx && R.ruinGfx() > 0 && R.pixelOn && R.pixelOn());
  let TX = null;
  const tex = () => {
    if (TX) return TX; const TH = T();
    const mk = (w, h, f, white) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), img = g.createImageData(w, h); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const i = (y * w + x) * 4, v = white ? 255 : 0; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = Math.round(255 * Math.max(0, Math.min(1, f(x / (w - 1), y / (h - 1))))); } g.putImageData(img, 0, 0); const t = new TH.CanvasTexture(c); t.userData.shared = true; return t; };
    const ss = x => x * x * (3 - 2 * x);
    TX = { edge: mk(4, 32, (u, v) => ss(1 - v) * ss(1 - v)), pool: mk(64, 64, (u, v) => { const d = Math.hypot(u - 0.5, v - 0.5) * 2; return d >= 1 ? 0 : Math.pow(1 - d, 1.6); }, true) };
    return TX;
  };
  // 浮塵的樣子：顏色、數量、怎麼飄（vy＋往上、－往下）、亮度
  const DUST = {
    base: { col: '#D8D0C0', n: 40, vy: 0.05, op: 0.45 },
    volcano: { col: '#FF8A3A', n: 22, vy: 0.7, op: 0.65 },   // 2026-10-20 作者：火星調少一點（火山原本的特效就很多）
    lava: { col: '#FF8A3A', n: 20, vy: 0.65, op: 0.6 },
    forge: { col: '#FFA040', n: 20, vy: 0.6, op: 0.6 },
    snow: { col: '#F4F8FF', n: 90, vy: -0.7, op: 0.8 },
    deep: { col: '#8AE8F0', n: 50, vy: 0.45, op: 0.6 },
    desert: { col: '#E8D0A0', n: 60, vy: 0.0, op: 0.45, wind: 1.2 },
    forest: { col: '#D8F07A', n: 26, vy: 0.08, op: 0.9, fly: 1 },
    roots: { col: '#D8F07A', n: 30, vy: 0.08, op: 0.9, fly: 1 },
    crystal: { col: '#C8A8FF', n: 36, vy: 0.1, op: 0.8, tw: 1 },
    factory: { col: '#FFB04A', n: 30, vy: -0.4, op: 0.8 },
    tomb: { col: '#FFE0A0', n: 30, vy: 0.15, op: 0.6 },
    ship: { col: '#A8C8D0', n: 40, vy: 0.3, op: 0.5 }
  };
  const dustKey = run => { if (!run) return 'base'; if (run.env && DUST[run.env]) return run.env; if (run.biome && DUST[run.biome]) return run.biome; return 'base'; };
  // ---------- 蓋好一層以後 ----------
  const build = () => {
    const w = W(), F = w.F, run = w.run; if (!F || !F.group || !F.tile || !run || !on()) return;
    const TH = T(), tx = tex(), t = F.tile, TS = t.TS || 2, nx = t.nx, nz = t.nz, TT = t.T, FLOOR = R.TILE ? R.TILE.FLOOR : 1, WALL = R.TILE ? R.TILE.WALL : 2;
    const fx = F.rfx = { t: 0 };
    // 1. 牆角變暗
    const N4 = [[0, -1, 0], [0, 1, Math.PI], [-1, 0, Math.PI / 2], [1, 0, -Math.PI / 2]], list = [];
    for (let tz = 0; tz < nz; tz++) for (let ix = 0; ix < nx; ix++) {
      if (TT[tz * nx + ix] !== FLOOR) continue;
      N4.forEach(([dx, dz, ry]) => { const x2 = ix + dx, z2 = tz + dz; if (x2 < 0 || z2 < 0 || x2 >= nx || z2 >= nz || TT[z2 * nx + x2] !== WALL) return; list.push([t.cX(ix) + dx * (TS / 2 - 0.45), t.cZ(tz) + dz * (TS / 2 - 0.45), ry]); });
    }
    if (list.length) {
      const geo = new TH.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
      const m = new TH.InstancedMesh(geo, new TH.MeshBasicMaterial({ color: 0x000000, map: tx.edge, transparent: true, opacity: 0.5, depthWrite: false }), list.length), o = new TH.Object3D();
      list.forEach(([x, z, ry], i) => { o.position.set(x, 0.012, z); o.rotation.set(0, ry, 0); o.scale.set(TS, 1, 0.9); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
      m.renderOrder = 1; m.frustumCulled = false; F.group.add(m); fx.ao = m;
    }
    // 2. 光圈
    const Ls = (F.lights || []).filter(L => L && L.I > 0.05);
    if (Ls.length) {
      const geo = new TH.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
      const m = new TH.InstancedMesh(geo, new TH.MeshBasicMaterial({ map: tx.pool, transparent: true, opacity: 0.32, depthWrite: false, blending: TH.AdditiveBlending }), Ls.length), o = new TH.Object3D(), c = new TH.Color();
      Ls.forEach((L, i) => { const r = 3.2 + Math.min(2.4, L.I * 2.2); o.position.set(L.x, 0.02, L.z); o.scale.set(r * 2, 1, r * 2); o.updateMatrix(); m.setMatrixAt(i, o.matrix); c.set(L.col || '#FFB060').convertSRGBToLinear(); m.setColorAt(i, c); });
      m.renderOrder = 2; m.frustumCulled = false; F.group.add(m); fx.pool = m;
    }
    // 3. 浮塵
    const D = DUST[dustKey(run)] || DUST.base, n = D.n, arr = new Float32Array(n * 3), seed = [];
    for (let i = 0; i < n; i++) seed.push([Math.random() * 16 - 8, Math.random() * 4, Math.random() * 16 - 8, Math.random() * 6.28]);
    const pg = new TH.BufferGeometry(); pg.setAttribute('position', new TH.BufferAttribute(arr, 3));
    const pts = new TH.Points(pg, new TH.PointsMaterial({ color: new TH.Color(D.col).convertSRGBToLinear(), size: 2, sizeAttenuation: false, transparent: true, opacity: D.op, depthWrite: false, blending: TH.AdditiveBlending }));
    pts.frustumCulled = false; pts.renderOrder = 4; F.group.add(pts); fx.dust = { pts, arr, seed, D };
    // 4. 地面和牆根的痕跡（交接單第 6 步）
    marks(F, run, list);
  };
  // ---------- 痕跡：手刻的點陣貼花（一格＝1/12 公尺；地板、牆的貼圖在 sprites.js，那邊不動，疊一層上去） ----------
  // 每一種：怎麼畫（24×24 像素＝2 公尺）、怎麼疊（暗＝黑色半透明、亮＝加法、色＝吃光的顏色）
  const MK = {};
  const PX = 24;
  const mkTex = (key, draw) => {
    if (MK[key]) return MK[key];
    const c = document.createElement('canvas'); c.width = c.height = PX; const g = c.getContext('2d'), img = g.createImageData(PX, PX);
    let sd = 1 + key.length * 7919; const sr = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    const put = (x, y, r, gg, b, a) => { if (x < 0 || y < 0 || x >= PX || y >= PX) return; const i = (y * PX + x) * 4; img.data[i] = r; img.data[i + 1] = gg; img.data[i + 2] = b; img.data[i + 3] = a; };
    draw(put, sr);
    g.putImageData(img, 0, 0);
    const t = new (T().CanvasTexture)(c); t.magFilter = t.minFilter = T().NearestFilter; t.generateMipmaps = false; t.userData.shared = true;
    return (MK[key] = t);
  };
  // 裂縫：從中間往兩邊走的一條細線，偶爾分岔
  const drawCrack = (put, sr, col) => { const walk = (x, y, dx, n) => { for (let i = 0; i < n; i++) { put(x, y, col[0], col[1], col[2], col[3]); x += dx; y += sr() < 0.45 ? (sr() < 0.5 ? 1 : -1) : 0; if (sr() < 0.08 && n > 6) walk(x, y, dx, Math.floor(n / 3)); } }; const y0 = 8 + Math.floor(sr() * 8); walk(12, y0, 1, 11); walk(11, y0, -1, 11); };
  // 一團（污漬、青苔、霜、積沙）：幾個圓疊起來，邊緣一格一格的
  const drawBlob = (put, sr, pick, edge) => { const cs = []; for (let i = 0; i < 4; i++) cs.push([6 + sr() * 12, 6 + sr() * 12, 3 + sr() * 4]); for (let y = 0; y < PX; y++) for (let x = 0; x < PX; x++) { let d = 9; cs.forEach(([cx, cy, r]) => { d = Math.min(d, Math.hypot(x - cx, y - cy) / r); }); if (d < 1 - (edge ? sr() * 0.35 : 0)) { const p = pick(d, x, y); if (p) put(x, y, p[0], p[1], p[2], p[3]); } } };
  const TEX = {
    crack: () => mkTex('crack', (p, r) => drawCrack(p, r, [0, 0, 0, 200])),
    glow: () => mkTex('glow', (p, r) => drawCrack(p, r, [255, 255, 255, 255])),
    stain: () => mkTex('stain', (p, r) => drawBlob(p, r, d => [0, 0, 0, d < 0.6 ? 90 : 55], true)),
    moss: () => mkTex('moss', (p, r) => drawBlob(p, r, d => (r() < 0.15 ? null : r() < 0.35 ? [120, 168, 82, 255] : [78, 122, 58, 255]), true)),
    algae: () => mkTex('algae', (p, r) => drawBlob(p, r, d => (r() < 0.15 ? null : r() < 0.35 ? [90, 168, 150, 255] : [48, 110, 104, 255]), true)),
    frost: () => mkTex('frost', (p, r) => drawBlob(p, r, d => (r() < 0.1 ? null : d < 0.5 ? [244, 248, 255, 255] : [214, 228, 242, 255]), true)),
    sand: () => mkTex('sand', (p, r) => drawBlob(p, r, d => (r() < 0.08 ? null : d < 0.55 ? [226, 200, 150, 255] : [204, 178, 128, 255]), true)),
    ash: () => mkTex('ash', (p, r) => drawBlob(p, r, d => (r() < 0.2 ? null : [30, 24, 22, d < 0.5 ? 170 : 110]), true)),
    rust: () => mkTex('rust', (p, r) => drawBlob(p, r, d => (r() < 0.2 ? null : d < 0.5 ? [138, 72, 34, 210] : [110, 60, 30, 150]), true)),
    puddle: () => mkTex('puddle', (p, r) => drawBlob(p, r, d => (d > 0.82 ? [180, 220, 230, 120] : [20, 40, 52, 120]), false)),
    // 牆根：往上淡掉的一條（青苔、霜、積沙）、往下流的水痕／鏽痕
    wallMoss: () => mkTex('wallMoss', (p, r) => { for (let x = 0; x < PX; x++) { const h = 4 + Math.floor(r() * 9); for (let y = PX - h; y < PX; y++) if (r() > 0.18) p(x, y, ...(r() < 0.4 ? [120, 168, 82] : [78, 122, 58]), 255); } }),
    wallFrost: () => mkTex('wallFrost', (p, r) => { for (let x = 0; x < PX; x++) { const h = 3 + Math.floor(r() * 7); for (let y = PX - h; y < PX; y++) if (r() > 0.1) p(x, y, 236, 244, 255, 255); } }),
    wallSand: () => mkTex('wallSand', (p, r) => { let h = 5; for (let x = 0; x < PX; x++) { h = Math.max(2, Math.min(10, h + (r() < 0.5 ? 1 : -1))); for (let y = PX - h; y < PX; y++) p(x, y, 214, 188, 138, 255); } }),
    drip: () => mkTex('drip', (p, r) => { for (let k = 0; k < 4; k++) { const x = 2 + Math.floor(r() * 20), y0 = Math.floor(r() * 6), L = 8 + Math.floor(r() * 12); for (let y = y0; y < Math.min(PX, y0 + L); y++) { p(x, y, 0, 0, 0, Math.round(110 * (1 - (y - y0) / L))); if (r() < 0.3) p(x + 1, y, 0, 0, 0, 60); } } }),
    rustDrip: () => mkTex('rustDrip', (p, r) => { for (let k = 0; k < 4; k++) { const x = 2 + Math.floor(r() * 20), y0 = Math.floor(r() * 6), L = 8 + Math.floor(r() * 12); for (let y = y0; y < Math.min(PX, y0 + L); y++) p(x, y, 130, 66, 30, Math.round(200 * (1 - (y - y0) / L))); } })
  };
  // 每種環境：地上（全部的地板格 open、靠牆的格 edge 的機率）、牆根（靠牆的面 wall）
  const SET = {
    base: { open: [['crack', 0.05], ['stain', 0.05]], edge: [['moss', 0.2]], wall: [['wallMoss', 0.1], ['drip', 0.12]] },
    snow: { open: [['crack', 0.03], ['frost', 0.06]], edge: [['frost', 0.32]], wall: [['wallFrost', 0.22]] },
    volcano: { open: [['glow', 0.05], ['ash', 0.1]], edge: [['ash', 0.2]], wall: [['drip', 0.18]] },
    desert: { open: [['crack', 0.05], ['sand', 0.06]], edge: [['sand', 0.32]], wall: [['wallSand', 0.25]] },
    deep: { open: [['puddle', 0.08], ['stain', 0.05]], edge: [['algae', 0.26]], wall: [['wallMoss', 0.05], ['drip', 0.2]] },
    forest: { open: [['moss', 0.12], ['crack', 0.03]], edge: [['moss', 0.45]], wall: [['wallMoss', 0.3]] },
    crystal: { open: [['crack', 0.06], ['glow', 0.03]], edge: [['stain', 0.12]], wall: [['drip', 0.1]] },
    metal: { open: [['rust', 0.06], ['stain', 0.07]], edge: [['rust', 0.18]], wall: [['rustDrip', 0.2]] }
  };
  const setKey = run => { const e = run.env, b = run.biome; if (e === 'snow') return 'snow'; if (e === 'volcano' || b === 'lava') return 'volcano'; if (e === 'desert') return 'desert'; if (e === 'deep') return 'deep'; if (b === 'forest' || b === 'roots') return 'forest'; if (b === 'crystal') return 'crystal'; if (b === 'factory' || b === 'ship') return 'metal'; return 'base'; };
  const GLOW = { volcano: '#FF6A1A', crystal: '#B88AFF' };
  const marks = (F, run, edges) => {
    const TH = T(), t = F.tile, TS = t.TS || 2, nx = t.nx, nz = t.nz, TT = t.T, FLOOR = R.TILE ? R.TILE.FLOOR : 1, WALL = R.TILE ? R.TILE.WALL : 2, sk = setKey(run), S = SET[sk];
    const lists = {};   // 種類 → [[x, y, z, ry, 平躺?, 尺寸]]
    const add = (k, v) => (lists[k] = lists[k] || []).push(v);
    const nearWall = (ix, tz) => [[0, -1], [0, 1], [-1, 0], [1, 0]].some(([dx, dz]) => { const a = ix + dx, b = tz + dz; return a >= 0 && b >= 0 && a < nx && b < nz && TT[b * nx + a] === WALL; });
    for (let tz = 0; tz < nz; tz++) for (let ix = 0; ix < nx; ix++) {
      if (TT[tz * nx + ix] !== FLOOR) continue;
      const pool = nearWall(ix, tz) ? S.edge.concat(S.open) : S.open;
      for (const [k, p] of pool) if (Math.random() < p) { add(k, [t.cX(ix) + (Math.random() - 0.5) * TS * 0.4, 0, t.cZ(tz) + (Math.random() - 0.5) * TS * 0.4, Math.floor(Math.random() * 4) * Math.PI / 2, 1, TS * (0.8 + Math.random() * 0.5)]); break; }
    }
    // 牆根：ruinfx2 的牆角清單（牆角暗影的位置往牆那邊推回去，貼在牆面上）
    (edges || []).forEach(([x, z, ry]) => { for (const [k, p] of S.wall) if (Math.random() < p) { const dx = -Math.sin(ry), dz = -Math.cos(ry); add(k, [x + dx * 0.44, 0, z + dz * 0.44, ry, 0, TS]); break; } });
    const flatG = new TH.PlaneGeometry(1, 1); flatG.rotateX(-Math.PI / 2);
    const upG = new TH.PlaneGeometry(1, 1);
    Object.keys(lists).forEach((k, ki) => {
      const L = lists[k], flat = L[0][4] === 1, kind = k === 'glow' ? 'add' : /^(crack|stain|ash|drip|puddle)$/.test(k) ? 'dark' : 'lit';
      let mat;
      if (kind === 'add') mat = new TH.MeshBasicMaterial({ color: new TH.Color(GLOW[sk] || '#FFB060').convertSRGBToLinear(), map: TEX[k](), transparent: true, depthWrite: false, blending: TH.AdditiveBlending });
      else if (kind === 'dark') mat = new TH.MeshBasicMaterial({ map: TEX[k](), transparent: true, depthWrite: false });
      else mat = new TH.MeshLambertMaterial({ map: TEX[k](), transparent: true, alphaTest: 0.5, depthWrite: false });
      const m = new TH.InstancedMesh(flat ? flatG : upG, mat, L.length), o = new TH.Object3D();
      L.forEach(([x, y, z, ry, f, s], i) => { if (f) { o.position.set(x, 0.014 + ki * 0.0008, z); o.rotation.set(0, ry, 0); o.scale.set(s, 1, s); } else { o.position.set(x, s * 0.5 * 0.75, z); o.rotation.set(0, ry, 0); o.scale.set(s, s * 0.75, 1); } o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
      m.renderOrder = 1; m.frustumCulled = false; F.group.add(m);
    });
  };
  // ---------- 每一格：光圈閃動、浮塵飄 ----------
  const step = dt => {
    const w = W(), F = w.F, fx = F && F.rfx, P = w.P; if (!fx || !P) return;
    fx.t += dt;
    if (fx.pool) fx.pool.material.opacity = 0.32 * (0.9 + Math.sin(fx.t * 7.3) * 0.05 + Math.sin(fx.t * 13.1) * 0.04);
    const d = fx.dust; if (!d) return;
    const { arr, seed, D } = d, px = P.x, pz = P.z;
    for (let i = 0; i < seed.length; i++) {
      const s = seed[i];
      s[1] += D.vy * dt * (0.6 + (i % 5) * 0.12); if (s[1] > 4) s[1] -= 4; if (s[1] < 0) s[1] += 4;
      s[0] += ((D.wind || 0) + Math.sin(fx.t * 0.6 + s[3]) * (D.fly ? 0.5 : 0.15)) * dt; s[2] += Math.cos(fx.t * 0.5 + s[3] * 1.3) * (D.fly ? 0.5 : 0.12) * dt;
      // 繞著玩家的一塊 16×16 公尺：跑出去的從另一邊回來
      let x = s[0], z = s[2]; x = ((x + 8) % 16 + 16) % 16 - 8; z = ((z + 8) % 16 + 16) % 16 - 8; s[0] = x; s[2] = z;
      arr[i * 3] = px + x; arr[i * 3 + 1] = 0.3 + s[1] + (D.fly ? Math.sin(fx.t * 1.3 + s[3]) * 0.3 : 0); arr[i * 3 + 2] = pz + z;
    }
    d.pts.geometry.attributes.position.needsUpdate = true;
    if (D.tw || D.fly) d.pts.material.opacity = D.op * (0.7 + Math.sin(fx.t * (D.fly ? 2.1 : 5.3)) * 0.3);
  };
  const lf0 = R.loadFloor;
  R.loadFloor = (f, o) => { const r = lf0(f, o); try { build(); } catch (e) { console.warn('[ruinfx2]', e); } return r; };
  const st0 = R.step;
  if (st0) R.step = (dt, ...a) => { const r = st0(dt, ...a); try { if (W().run) step(dt || 0); } catch (e) { console.warn('[ruinfx2]', e); } return r; };
})(window.R);
