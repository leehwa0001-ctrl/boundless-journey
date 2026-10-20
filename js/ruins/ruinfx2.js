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
