// 遺跡生物的手繪新圖（2026-10-09 作者：怪物手繪要整個重繪、不要用舊圖；之後選定「照第一版的雨傘那樣畫」）
// - 像素繪圖工具（painter）：一層一層畫上去，光從左上來；每種材質 5 階色帶（陰影偏冷、亮面偏暖）；
//   前面的形狀蓋到後面的地方加一條接觸陰影（細線、亮面、花紋不加：nocast）、背光那一側有一點反光、外框用那個材質最暗的顏色。
// - 畫法跟獨腳傘一樣：大塊乾淨的形狀、一塊斜的亮面、眼睛牙齒一格一格點出來。
//   動物、生物的輪廓用平滑的曲線（shape）：曲線先變成像素形狀，再照形狀的邊緣上光（左上邊亮、右下邊暗、中間平塗）。
// - 密度是原本的 2 倍（1 像素＝1/24 公尺；遊戲畫面本來就是用這個密度畫的），看板大小不變；不再經過 beasthd.js 的放大。
// - R.BEAST_HD[id]＝{ w, h, mats: {材質: 底色}, draw(P, 第幾幀, 材質編號, role) }；sprites.js 的 beastSheet 先找這裡，沒有才用舊圖。
// 放在 sprites.js 後面。
(function (R) {
  const RES = 2;
  // ---------- 顏色 ----------
  const hx2rgb = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const rgb2hsl = ([r, g, b]) => { r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; if (mx === mn) return [0, 0, l]; const d = mx - mn, s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); let h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [h * 60, s, l]; };
  const hsl2hex = (h, s, l) => { h = ((h % 360) + 360) % 360; s = Math.max(0, Math.min(1, s)); l = Math.max(0, Math.min(1, l)); const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2; const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]; return '#' + [r, g, b].map(v => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join(''); };
  const toward = (h, t, k) => { const d = ((t - h + 540) % 360) - 180; return h + d * k; };
  const ramp = hex => { const [h, s, l] = rgb2hsl(hx2rgb(hex)); return [
    hsl2hex(toward(h, 250, 0.22), s * 1.05 + 0.04, l * 0.42),
    hsl2hex(toward(h, 250, 0.12), s * 1.02 + 0.02, l * 0.68),
    hsl2hex(h, s, l),
    hsl2hex(toward(h, 50, 0.08), s * 0.95, l + (1 - l) * 0.28),
    hsl2hex(toward(h, 50, 0.14), s * 0.8, l + (1 - l) * 0.58)]; };
  // ---------- 畫筆 ----------
  const LX = -0.48, LY = -0.66, LZ = 0.58;   // 光從左上前方來（x 往右、y 往下、z 朝鏡頭）
  const TONE = [0.06, 0.25, 0.5, 0.73, 0.94];   // 平塗（o.tone）：色帶第幾階
  // 粗細漸變的一條（腳、尾巴）→ Path2D
  const limbPath = (pts, w0, w1) => {
    const L = [], Rr = [];
    for (let i = 0; i < pts.length; i++) {
      const p = pts[i], q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)];
      const dx = q[0] - o[0], dy = q[1] - o[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, w = (w0 + (w1 - w0) * i / (pts.length - 1)) / 2;
      L.push([p[0] + nx * w, p[1] + ny * w]); Rr.unshift([p[0] - nx * w, p[1] - ny * w]);
    }
    const all = L.concat(Rr), pp = new Path2D(); pp.moveTo(all[0][0], all[0][1]);
    for (let i = 1; i < all.length; i++) { const a = all[i - 1], b = all[i]; pp.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
    pp.closePath(); return pp;
  };
  // 一縷（煙、火、鬃毛）：根部粗、尖端細的水滴形
  const wispPath = (x0, y0, x1, y1, w, bend) => {
    const dx = x1 - x0, dy = y1 - y0, d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, b = bend || 0, mx = (x0 + x1) / 2 + nx * b, my = (y0 + y1) / 2 + ny * b, p = new Path2D();
    p.moveTo(x0 + nx * w / 2, y0 + ny * w / 2); p.quadraticCurveTo(mx + nx * w / 3, my + ny * w / 3, x1, y1); p.quadraticCurveTo(mx - nx * w / 3, my - ny * w / 3, x0 - nx * w / 2, y0 - ny * w / 2); p.closePath(); return p;
  };
  const painter = (W, H) => {
    const N = W * H, mat = new Int16Array(N).fill(-1), sh = new Float32Array(N), lay = new Int16Array(N).fill(-1), over = new Array(N);
    let L = 0, curBare = 0; const noCast = new Set(), bare = new Uint8Array(N);
    const begin = o => { L++; if (o && o.nocast) noCast.add(L); curBare = o && o.bare ? 1 : 0; };
    const lam = (nx, ny, nz) => Math.max(0, nx * LX + ny * LY + nz * LZ);
    const set = (x, y, m, s) => { x = Math.floor(x); y = Math.floor(y); if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return; const i = y * W + x; mat[i] = m; sh[i] = s; lay[i] = L; over[i] = undefined; bare[i] = curBare; };
    const P = {
      W, H, limbPath, wispPath,
      ell(cx, cy, rx, ry, m, o) { o = o || {}; begin(o); const fl = o.flat || 1, b = o.bias || 0;
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const nx = (x + 0.5 - cx) / rx, ny = (y + 0.5 - cy) / ry, d = nx * nx + ny * ny; if (d > 1) continue;
          set(x, y, m, o.tone != null ? TONE[o.tone] : lam(nx / fl, ny / fl, Math.sqrt(1 - d)) + b); } },
      poly(pts, m, o) { o = o || {}; begin(o); const b = o.bias || 0; let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9; pts.forEach(([x, y]) => { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); });
        for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) { const yy = y + 0.5, xs = [];
          for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + (yy - ay) / (by - ay) * (bx - ax)); }
          xs.sort((p, q) => p - q);
          for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) {
            const s = o.tone != null ? TONE[o.tone] : o.n ? lam(o.n[0], o.n[1], o.n[2]) : 0.78 - 0.5 * (yy - y0) / Math.max(1, y1 - y0) - 0.18 * (x + 0.5 - x0) / Math.max(1, x1 - x0);
            set(x, y, m, s + b); } } },
      tube(x0, y0, x1, y1, r0, r1, m, o) { o = o || {}; begin(o); const b = o.bias || 0, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len, px = -uy, py = ux, rm = Math.max(r0, r1);
        for (let y = Math.floor(Math.min(y0, y1) - rm); y <= Math.ceil(Math.max(y0, y1) + rm); y++) for (let x = Math.floor(Math.min(x0, x1) - rm); x <= Math.ceil(Math.max(x0, x1) + rm); x++) {
          const qx = x + 0.5 - x0, qy = y + 0.5 - y0, t = Math.max(0, Math.min(1, (qx * ux + qy * uy) / len)), r = r0 + (r1 - r0) * t, cx = qx - ux * t * len, cy = qy - uy * t * len, d = Math.hypot(cx, cy);
          if (d > r) continue; const u = (cx * px + cy * py) / r; set(x, y, m, o.tone != null ? TONE[o.tone] : lam(px * u, py * u, Math.sqrt(Math.max(0, 1 - u * u))) + b); } },
      path(pts, r0, r1, m, o) { for (let i = 0; i + 1 < pts.length; i++) { const k0 = i / (pts.length - 1), k1 = (i + 1) / (pts.length - 1); P.tube(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], r0 + (r1 - r0) * k0, r0 + (r1 - r0) * k1, m, o); } },
      // 平滑曲線的形狀：d＝SVG 路徑字串或 Path2D；o.k＝座標縮放（畫在 8 倍的座標上就給 0.25）；
      // 照邊緣上光：左上邊亮、右下邊暗、中間平塗；o.edge＝邊緣的寬度（像素），o.vg＝上下的明暗差
      shape(d, m, o) {
        o = o || {}; begin(o);
        const c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d');
        x.setTransform(o.k || 1, 0, 0, o.k || 1, o.dx || 0, o.dy || 0); x.fillStyle = '#FFFFFF'; x.fill(typeof d === 'string' ? new Path2D(d) : d);
        const a = x.getImageData(0, 0, W, H).data, M = new Float32Array(N); let y0 = H, y1 = 0;
        for (let i = 0; i < N; i++) if (a[i * 4 + 3] > 120) { M[i] = 1; const y = (i / W) | 0; y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
        if (o.band) {   // 像素畫的分色：沿著輪廓一圈一圈（最上面一排最亮、往下變暗、最下面一排最暗；左邊緣亮一階、右邊緣暗一階）
          for (let i = 0; i < N; i++) {
            if (!M[i]) continue; const xx = i % W, yy = (i - xx) / W;
            let dt = 0; while (dt < 40 && yy - dt - 1 >= 0 && M[i - (dt + 1) * W]) dt++;
            let db = 0; while (db < 40 && yy + db + 1 < H && M[i + (db + 1) * W]) db++;
            const p = dt / Math.max(1, dt + db);
            let k = dt === 0 ? (o.top == null ? 4 : o.top) : p < (o.hi || 0.3) ? 3 : p < (o.lo || 0.7) ? 2 : 1;
            if (db === 0 && dt > 1) k = Math.min(k, 1);
            if (!(xx > 0 && M[i - 1]) && dt > 0 && k < 4) k++;
            if (!(xx < W - 1 && M[i + 1]) && k > 0) k--;
            set(xx, yy, m, TONE[Math.max(0, Math.min(4, k + (o.shift || 0)))]);
          }
          return;
        }
        const r = o.edge || 2.5, B = blur(blur(M, W, H, r), W, H, r), b = o.bias || 0, vg = o.vg == null ? 0.16 : o.vg;
        for (let i = 0; i < N; i++) {
          if (!M[i]) continue; const xx = i % W, yy = (i - xx) / W;
          const gx = (B[i - 1] || 0) - (B[i + 1] || 0), gy = (B[i - W] || 0) - (B[i + W] || 0);
          let nx = gx * 2.4, ny = gy * 2.4; const l2 = nx * nx + ny * ny; if (l2 > 0.85) { const k = Math.sqrt(0.85 / l2); nx *= k; ny *= k; }
          const nz = Math.sqrt(Math.max(0.05, 1 - nx * nx - ny * ny));
          const s = o.tone != null ? TONE[o.tone] : lam(nx, ny, nz) + vg * (0.5 - (yy - y0) / Math.max(1, y1 - y0)) + b;
          set(xx, yy, m, s);
        }
      },
      px(x, y, hex) { x = Math.floor(x); y = Math.floor(y); if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return; const i = y * W + x; over[i] = hex; if (mat[i] < 0) { mat[i] = -2; lay[i] = ++L; bare[i] = 0; } },
      dot(x, y, hex, hi) { P.px(x, y, hex); P.px(x + 1, y, hex); P.px(x, y + 1, hex); P.px(x + 1, y + 1, hex); if (hi) P.px(x, y, hi); },
      render(ramps) {
        const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d'), img = ctx.createImageData(W, H), d = img.data;
        const put = (i, hex) => { const [r, g, b] = hx2rgb(hex); d[i * 4] = r; d[i * 4 + 1] = g; d[i * 4 + 2] = b; d[i * 4 + 3] = 255; };
        const idxOf = i => { const v = 0.2 + 0.8 * sh[i]; return v < 0.3 ? 0 : v < 0.5 ? 1 : v < 0.7 ? 2 : v < 0.87 ? 3 : 4; };
        for (let i = 0; i < N; i++) {
          if (mat[i] === -1) continue;
          if (over[i]) { put(i, over[i]); continue; }
          const rp = ramps[mat[i]]; if (!rp) continue;
          let k = idxOf(i); const x = i % W, y = (i - x) / W;
          for (const j of [i - W, i + 1, i - 1, i + W]) { if (j < 0 || j >= N || mat[j] < 0 || mat[j] === mat[i]) continue; if (lay[j] > lay[i] && !noCast.has(lay[j]) && (j === i - W || j === i - 1 || j === i + 1)) { k = Math.max(0, k - 1); break; } }
          if (k <= 1 && x + 1 < W && mat[i + 1] === -1 && y > 0 && mat[i - W] !== -1) k += 1;   // 反光：背光那一側
          put(i, rp[k]);
        }
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
          const i = y * W + x; if (mat[i] !== -1) continue;
          const nb = [[i + W, 'up'], [i + 1, 'lf'], [i - 1, 'rt'], [i - W, 'dn']].find(([j]) => j >= 0 && j < N && mat[j] !== -1 && !bare[j] && Math.abs((j % W) - x) <= 1);
          if (!nb) continue; const j = nb[0], rp = ramps[mat[j]];
          const [r, g, b] = hx2rgb(rp ? rp[0] : '#141018'), k = nb[1] === 'up' || nb[1] === 'lf' ? 0.78 : 0.5;
          d[i * 4] = r * k; d[i * 4 + 1] = g * k; d[i * 4 + 2] = b * k; d[i * 4 + 3] = 255;
        }
        ctx.putImageData(img, 0, 0); return c;
      }
    };
    return P;
  };
  // 方塊模糊（算邊緣的方向用）
  const blur = (src, W, H, r) => {
    const out = new Float32Array(src.length), tmp = new Float32Array(src.length), R2 = Math.max(1, Math.round(r)), n = R2 * 2 + 1;
    for (let y = 0; y < H; y++) { let s = 0; for (let x = -R2; x <= R2; x++) s += src[y * W + Math.min(W - 1, Math.max(0, x))]; for (let x = 0; x < W; x++) { tmp[y * W + x] = s / n; s += src[y * W + Math.min(W - 1, x + R2 + 1)] - src[y * W + Math.max(0, x - R2)]; } }
    for (let x = 0; x < W; x++) { let s = 0; for (let y = -R2; y <= R2; y++) s += tmp[Math.min(H - 1, Math.max(0, y)) * W + x]; for (let y = 0; y < H; y++) { out[y * W + x] = s / n; s += tmp[Math.min(H - 1, y + R2 + 1) * W + x] - tmp[Math.max(0, y - R2) * W + x]; } }
    return out;
  };
  R.beastPainter = painter; R.beastRamp = ramp;
  // ---------- 手點的像素圖（2026-10-10 作者：要像 SFC／GBA 時代 RPG 的怪物）----------
  // layers＝[[列, 起點x, '字串'], ...]：一格一個字，空白＝不蓋；後面的蓋前面的（先畫遠的、再畫近的）。
  // pal＝{字: 顏色}；ol＝{字: [亮側外框, 暗側外框]}——外框自動加在空格上：
  // 東西在下面或右邊（形狀的上緣、左緣，受光）用亮側那個顏色，東西在上面或左邊（下緣、右緣）用暗側那個顏色，都是那個材質最深的同色系，不用全黑。
  // ol.bare＝不描邊的字（細細的腳這類，描了邊會變粗）。
  const pixArt = (W, H, pal, ol, layers) => {
    const g = Array.from({ length: H }, () => Array(W).fill(''));
    layers.forEach(([y, x, s]) => { if (y < 0 || y >= H) return; for (let i = 0; i < s.length; i++) if (s[i] !== ' ' && x + i >= 0 && x + i < W) g[y][x + i] = s[i]; });
    const c = document.createElement('canvas'); c.width = W; c.height = H; const ctx = c.getContext('2d');
    const bare = ol.bare || '', at = (x, y) => { const k = x >= 0 && y >= 0 && x < W && y < H ? g[y][x] : ''; return k && !bare.includes(k) ? k : ''; };
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const ch = g[y][x];
      if (ch) { ctx.fillStyle = pal[ch] || '#FF00FF'; ctx.fillRect(x, y, 1, 1); continue; }
      const up = at(x, y - 1), lf = at(x - 1, y), dn = at(x, y + 1), rt = at(x + 1, y);
      const dark = up || lf, k = dark || dn || rt; if (!k) continue;
      const o = ol[k] || ol['*']; ctx.fillStyle = dark ? o[1] : o[0]; ctx.fillRect(x, y, 1, 1);
    }
    return c;
  };
  R.beastPixArt = pixArt;
  // ---------- 捏形狀的工具（手點的怪物用）：大塊先照弧面分五階，再一格一格補細節 ----------
  // 材質＝5 個字（暗→亮），例：'abcde'。光從左上前方來，陰影偏冷、亮面偏暖（顏色由 def.m 的底色自動排出 5 階）。
  // ell 橢球（身體、頭、大腿；rot＝轉幾度）、limb 一段一段的圓柱（腳、脖子、尾巴、觸手）、poly 多邊形（甲殼、刀、角：照多邊形自己的上下左右分亮暗）、
  // rows 直接點字、rim＝這一塊蓋在別的東西上時，背光那一側（下、右）描一條最暗那一階的內線。
  const sculpt = (W, H) => {
    const g = Array.from({ length: H }, () => Array(W).fill('')), who = Array.from({ length: H }, () => Array(W).fill(0));
    let part = 0; const LX = -0.5, LY = -0.65, LZ = 0.57;
    // 5 個字的材質照舊；7 個字以上（2026-10-10 照《時空之鑰》《FF6》的 boss：一塊塊肌肉各自上光、層次多）就照亮度平均分
    const tone = (d, r) => { if (r.length <= 5) return d > 0.8 ? r[4] : d > 0.58 ? r[3] : d > 0.3 ? r[2] : d > 0.05 ? r[1] : r[0]; const t = Math.max(0, Math.min(0.999, (d + 0.12) / 1.02)); return r[Math.floor(Math.pow(t, 1.25) * r.length)]; };
    const put = (x, y, ch) => { x = Math.floor(x); y = Math.floor(y); if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return; g[y][x] = ch; who[y][x] = part; };
    const rim = (dark, sides) => {   // sides：哪幾側碰到別的東西要描（預設下、右＝背光那側；'l' 左、't' 上）
      const S = typeof sides === 'string' ? sides : 'rb', o = (x, y) => who[y][x] && who[y][x] !== part && g[y][x];
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { if (who[y][x] !== part) continue; if ((S.includes('b') && o(x, y + 1)) || (S.includes('r') && o(x + 1, y)) || (S.includes('l') && o(x - 1, y)) || (S.includes('t') && o(x, y - 1))) g[y][x] = dark; }
    };
    const K = {
      W, H, g,
      ell(cx, cy, rx, ry, r, o) {
        part++; o = o || {}; const a = (o.rot || 0) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), R0 = Math.max(rx, ry);
        for (let y = Math.floor(cy - R0); y <= Math.ceil(cy + R0); y++) for (let x = Math.floor(cx - R0); x <= Math.ceil(cx + R0); x++) {
          const dx = x + 0.5 - cx, dy = y + 0.5 - cy, lx = dx * ca + dy * sa, ly = -dx * sa + dy * ca, u = lx / rx, v = ly / ry, q = u * u + v * v; if (q > 1) continue;
          const nz = Math.sqrt(1 - q), nx = u * ca - v * sa, ny = u * sa + v * ca;
          put(x, y, o.flat != null ? r[o.flat] : tone(LX * nx + LY * ny + LZ * nz - (o.down == null ? 0.18 : o.down) * (v + 1) / 2 + (o.bias || 0), r));
        }
        if (o.rim) rim(r[0], o.rim); return K;
      },
      limb(pts, w0, w1, r, o) {
        part++; o = o || {};
        for (let i = 0; i + 1 < pts.length; i++) {
          const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], ka = i / (pts.length - 1), kb = (i + 1) / (pts.length - 1);
          const wa = (w0 + (w1 - w0) * ka) / 2, wb = (w0 + (w1 - w0) * kb) / 2, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, px = -dy / len, py = dx / len, M = Math.max(wa, wb) + 1;
          for (let y = Math.floor(Math.min(y0, y1) - M); y <= Math.ceil(Math.max(y0, y1) + M); y++) for (let x = Math.floor(Math.min(x0, x1) - M); x <= Math.ceil(Math.max(x0, x1) + M); x++) {
            const qx = x + 0.5 - x0, qy = y + 0.5 - y0, t = Math.max(0, Math.min(1, (qx * dx + qy * dy) / (len * len))), w = wa + (wb - wa) * t;
            const cx = qx - dx * t, cy = qy - dy * t; if (Math.hypot(cx, cy) > w) continue; const s = Math.max(-1, Math.min(1, (cx * px + cy * py) / w));
            put(x, y, o.flat != null ? r[o.flat] : tone(LX * px * s + LY * py * s + LZ * Math.sqrt(1 - s * s) + (o.bias || 0), r));
          }
        }
        if (o.rim) rim(r[0], o.rim); return K;
      },
      poly(pts, r, o) {
        part++; o = o || {}; let y0 = 1e9, y1 = -1e9, x0 = 1e9, x1 = -1e9; pts.forEach(([x, y]) => { y0 = Math.min(y0, y); y1 = Math.max(y1, y); x0 = Math.min(x0, x); x1 = Math.max(x1, x); });
        for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) {
          const yy = y + 0.5, xs = [];
          for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + (yy - ay) / (by - ay) * (bx - ax)); }
          xs.sort((p, q) => p - q);
          for (let k = 0; k + 1 < xs.length; k += 2) for (let x = Math.ceil(xs[k] - 0.5); x <= Math.floor(xs[k + 1] - 0.5); x++) {
            const fy = (yy - y0) / Math.max(1, y1 - y0), fx = (x + 0.5 - x0) / Math.max(1, x1 - x0);
            put(x, y, o.flat != null ? r[o.flat] : tone(0.95 - 0.75 * fy - 0.35 * fx + (o.bias || 0), r));
          }
        }
        if (o.rim) rim(r[0], o.rim); return K;
      },
      rows(y0, x0, list) { part++; list.forEach((s, i) => { for (let k = 0; k < s.length; k++) if (s[k] !== ' ' && s[k] !== '.') put(x0 + k, y0 + i, s[k]); }); return K; },
      // 2026-10-10 作者：不要球體畫法，照一開始的狼那樣——輪廓一列一列手寫（spans＝[列, 起點x, 終點x, 區塊字]），
      // 上色：每一塊大部分平塗中間色（ramp 第 2 階），受光的上緣亮一條（第 3 階）、背光的下緣最暗（第 0 階）、下面第二排和右緣暗一階（第 1 階）；
      // 細細的（一列不到 6 格寬）左緣亮一條；前面的區塊蓋在後面的上面時，後面那一塊貼著的那一格暗一階（接觸陰影）。細節（眼睛、肌肉線、花紋）再用 rows 點。
      // 輪廓的小工具（只給形狀、不上色）：ps＝多邊形（頂點一個個手放，有棱有角）、ls＝粗細漸變的一條（腳、尾巴、脖子、觸手）
      ps(pts, c) {
        const out = []; let y0 = 1e9, y1 = -1e9; pts.forEach(([, y]) => { y0 = Math.min(y0, y); y1 = Math.max(y1, y); });
        for (let y = Math.floor(y0); y <= Math.ceil(y1); y++) { const yy = y + 0.5, xs = [];
          for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= yy && by > yy) || (by <= yy && ay > yy)) xs.push(ax + (yy - ay) / (by - ay) * (bx - ax)); }
          xs.sort((p, q) => p - q); for (let k = 0; k + 1 < xs.length; k += 2) { const a = Math.ceil(xs[k] - 0.5), b = Math.floor(xs[k + 1] - 0.5); if (b >= a) out.push([y, a, b, c]); } }
        return out;
      },
      ls(pts, w0, w1, c) {
        const m = new Map();
        for (let i = 0; i + 1 < pts.length; i++) {
          const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], ka = i / (pts.length - 1), kb = (i + 1) / (pts.length - 1), wa = (w0 + (w1 - w0) * ka) / 2, wb = (w0 + (w1 - w0) * kb) / 2, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, M = Math.max(wa, wb) + 1;
          for (let y = Math.floor(Math.min(y0, y1) - M); y <= Math.ceil(Math.max(y0, y1) + M); y++) for (let x = Math.floor(Math.min(x0, x1) - M); x <= Math.ceil(Math.max(x0, x1) + M); x++) {
            const qx = x + 0.5 - x0, qy = y + 0.5 - y0, t = Math.max(0, Math.min(1, (qx * dx + qy * dy) / (len * len))), w = wa + (wb - wa) * t;
            if (Math.hypot(qx - dx * t, qy - dy * t) <= w) { if (!m.has(y)) m.set(y, new Set()); m.get(y).add(x); } }
        }
        const out = []; m.forEach((set, y) => { const xs = [...set].sort((a, b) => a - b); let a = xs[0], p = xs[0]; for (let i = 1; i <= xs.length; i++) { if (i < xs.length && xs[i] === p + 1) { p = xs[i]; continue; } out.push([y, a, p, c]); a = p = xs[i]; } });
        return out;
      },
      // og＝多邊形的圓（真的是圓的東西才用：苔團、泡泡、圓肚子），n 個頂點、rot 度
      og(cx, cy, rx, ry, c, rot, n) { n = n || 12; const a0 = (rot || 0) * Math.PI / 180; return K.ps(Array.from({ length: n }, (_, i) => { const a = i / n * 6.2832; const x = Math.cos(a) * rx, y = Math.sin(a) * ry; return [cx + x * Math.cos(a0) - y * Math.sin(a0), cy + x * Math.sin(a0) + y * Math.cos(a0)]; }), c); },
      // order＝由後到前的區塊字，reg＝{區塊字: 5 個材質字（暗→亮）}
      cel(order, reg, spans) {
        part++; const Rg = Array.from({ length: H }, () => Array(W).fill('')), oi = c => order.indexOf(c);
        spans.slice().sort((a, b) => oi(a[3]) - oi(b[3])).forEach(([y, x0, x1, c]) => { y = Math.round(y); for (let x = Math.round(x0); x <= Math.round(x1); x++) if (x >= 1 && y >= 1 && x < W - 1 && y < H - 1) Rg[y][x] = c; });
        const at = (x, y) => (Rg[y] && Rg[y][x]) || '';
        for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
          const c = Rg[y][x]; if (!c) continue; const r = reg[c];
          let wide = 0; for (let k = x; at(k, y) === c; k++) wide++; for (let k = x - 1; at(k, y) === c; k--) wide++;
          let tall = 0; for (let k = y; at(x, k) === c; k++) tall++; for (let k = y - 1; at(x, k) === c; k--) tall++;
          const up = at(x, y - 1), dn = at(x, y + 1), lf = at(x - 1, y), rt = at(x + 1, y), dn2 = at(x, y + 2);
          let t = 2;
          if (!up) t = 3; else if (!dn) t = 0; else if (!dn2 && tall >= 5) t = 1; else if (!rt) t = 1; else if (!lf && wide <= 5) t = 3;
          const front = k => k && k !== c && oi(k) > oi(c); if (front(dn) || front(rt)) t = Math.min(t, 1);
          put(x, y, r[t]);
        }
        return K;
      },
      px(x, y, ch) { part++; put(x, y, ch); return K; },
      // 皮膚、毛的顆粒感：這個材質裡隨機撒一點亮一階、暗一階的像素（固定的亂數，每次畫都一樣）
      speckle(chars, p, seed) { let s = seed || 7; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const c = g[y][x], i = c ? chars.indexOf(c) : -1; if (i < 1 || i >= chars.length - 1) continue; const r = rnd(); if (r < p) g[y][x] = chars[i + 1]; else if (r < p * 1.8) g[y][x] = chars[i - 1]; } return K; },
      at: (x, y) => (g[y] && g[y][x]) || '',
      layers: () => g.map((r, y) => [y, 0, r.map(c => c || ' ').join('')])
    };
    return K;
  };
  // def.m＝{ '5 個字': 底色 } → 調色盤和外框（外框用那個材質最暗那一階再壓暗：受光那側淺一點、背光那側深一點）
  const dk = (hex, k) => '#' + [1, 3, 5].map(i => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');
  // 6 階以上：從近黑（偏冷、更飽和）到很亮（偏暖、淡一點），底色在正中間——對比強，像《時空之鑰》《FF6》的怪物
  const rampN = (hex, n) => { const [h, s, l] = rgb2hsl(hx2rgb(hex)); return Array.from({ length: n }, (_, i) => { const t = i / (n - 1); return t < 0.5 ? hsl2hex(toward(h, 250, (0.5 - t) * 0.5), Math.min(1, s * 1.08 + 0.06 * (0.5 - t) * 2), l * (0.2 + 1.6 * t)) : hsl2hex(toward(h, 50, (t - 0.5) * 0.3), s * (1 - (t - 0.5) * 0.6), l + (1 - l) * (t - 0.5) * 1.5); }); };
  const autoPal = (m, extra) => {
    const pal = {}, ol = {};
    Object.keys(m).forEach(chars => { const n = chars.length, rp = n > 5 ? rampN(m[chars], n) : ramp(m[chars]); [...chars].forEach((c, i) => { pal[c] = n > 5 ? rp[i] : rp[n === 1 ? 2 : Math.round(i * 4 / (n - 1))]; ol[c] = [dk(rp[0], 0.78), dk(rp[0], 0.52)]; }); });
    Object.assign(pal, extra || {}); ol['*'] = ol['*'] || ['#2A2230', '#141018'];
    return { pal, ol };
  };
  R.beastSculpt = sculpt;

  const HD = R.BEAST_HD = R.BEAST_HD || {};
  // ---------- 獨腳傘（作者選定的第一版畫法）：紅色的油紙傘成了精，傘面上一隻紅虹膜的大眼睛，傘緣伸出長舌頭；一隻木腳踩著木屐跳 ----------
  HD.kasa = { w: 36, h: 46, mats: { paper: '#D8583E', paperL: '#F08A64', rib: '#7A3A28', wood: '#9A7652', tongue: '#E8404A', geta: '#5A3E26', iris: '#C8302A' },
    draw(P, f, M) {
      const s = f ? 2 : 0, top = 3 + s, rim = 22 + s;
      P.tube(18, rim - 1, 18, 39, 1.6, 1.4, M.wood);
      P.poly([[11, 40], [25, 40], [25, 42], [11, 42]], M.geta); P.poly([[12, 42], [15, 42], [15, 44], [12, 44]], M.geta); P.poly([[21, 42], [24, 42], [24, 44], [21, 44]], M.geta);
      P.poly([[18, top], [34, rim], [30, rim - 1], [26, rim + 1], [22, rim], [18, rim + 1], [14, rim], [10, rim + 1], [6, rim - 1], [2, rim]], M.paper, { bias: 0.12 });
      P.poly([[18, top], [27, rim], [22, rim], [18, rim + 1]], M.paperL, { bias: 0.12, nocast: 1 });
      [[4, rim], [11, rim + 1], [25, rim + 1], [32, rim]].forEach(([c2, d2]) => P.tube(18, top + 1, c2, d2, 0.5, 0.5, M.rib, { bias: 0.1, nocast: 1 }));
      P.tube(18, top - 2, 18, top + 1, 1, 1, M.wood);
      for (let y = -4; y <= 4; y++) for (let x = -5; x <= 5; x++) { const e = (x * x) / 26 + (y * y) / 17; if (e > 1) continue; const r = Math.hypot(x, y * 1.2); P.px(18 + x, 13 + s + y, r < 1.6 ? '#120808' : r < 3.2 ? (y < 0 ? '#E8483A' : '#A8201A') : (y > 2 ? '#D8D0C4' : '#FBF6EE')); }
      P.px(17, 11 + s, '#FFFFFF'); P.px(16, 12 + s, '#FFFFFF');
      P.tube(15, rim - 1, 21, rim - 1, 0.6, 0.6, M.rib, { bias: -0.4 });
      P.path([[19, rim], [21, rim + 4], [20, rim + 8 - (f ? 1 : 0)]], 1.7, 1.2, M.tongue);
    } };
  // 橢圓的 Path2D（給 shape 用；大腿、膝蓋、腳掌）
  const oval = (cx, cy, rx, ry, rot) => { const p = new Path2D(); p.ellipse(cx, cy, rx, ry, rot || 0, 0, Math.PI * 2); return p; };
  // ---------- 尾隨犬：瘦長的影子狼犬（深胸細腰）、尖耳朵；背上的毛像黑煙往後飄，尾巴整條是一團煙；紫紅色的眼睛發光 ----------
  // 2026-10-10 作者：要像 SFC／GBA 時代 RPG 的怪物——一格一格手點（pixArt）。
  // 姿勢壓低、頭放到背的高度往前伸（在後面跟著你）；肩膀的煙毛豎起來、尾巴是三條往後飄的煙；齜牙（一顆小犬齒）。
  // 毛：1 最暗 → 5 最亮（陰影偏藍紫、亮面偏暖）；x y z 是遠的那一側（腳、耳朵）；煙：a 最暗 → d 最亮；E e r 眼睛的光；n 鼻子、m 牙肉、w 牙、p 耳朵內側。
  HD.okuriinu = { w: 48, h: 30,
    pal: role => Object.assign({ 1: '#262040', 2: '#3B3360', 3: '#57508A', 4: '#7A72AE', 5: '#A69ED0', x: '#1E1830', y: '#2C2648', z: '#3E3762',
      a: '#1A1024', b: '#2B1B3E', c: '#432C5E', d: '#6A4890', n: '#0C0812', m: '#6A1E3E', w: '#E2DAEC', v: '#9A90B4', p: '#8A527E' },
      role === 'leader' ? { E: '#FFA080', e: '#F04A3A', r: '#8A1E1E', 1: '#1C1730', 2: '#2C2648', 3: '#433C6C', 4: '#5E5690', 5: '#8078AE' } : { E: '#FF8AFF', e: '#D24AF0', r: '#7A2296' }),   // 帶頭的：毛色更深、眼睛是紅的
    eyes: 'Eer', spikeOn: 'bcd',
    ol: { '*': ['#2A2246', '#140E22'], a: ['#1E1228', '#0C0612'], b: ['#1E1228', '#0C0612'], c: ['#1E1228', '#0C0612'], d: ['#1E1228', '#0C0612'], x: ['#1A1428', '#0E0A18'], y: ['#1A1428', '#0E0A18'], z: ['#1A1428', '#0E0A18'] },
    pix(f) {
      const L = [];
      // 尾巴的煙（三條）
      L.push(f ? [3, 5, 'd'] : [3, 4, 'd'], f ? [4, 5, 'dc'] : [4, 4, 'dc'], [5, 5, 'dc'], [6, 5, 'dcb'], [7, 6, 'dcb'],
        f ? [8, 2, ' '] : [8, 1, 'd'], [8, 6, 'dccb'], f ? [9, 2, 'dc'] : [9, 1, 'dcb'], [9, 7, 'dcbb'], [10, 2, 'dcbb'], [10, 8, 'dcbbb'],
        [11, 3, 'dccbbbbbbbbaa'], [12, 5, 'cbbbbbbba'], [13, 6, 'bbbbbba'], [14, 5, 'cbbbbba'], [15, 3, 'dccbbbbba'], [16, 2, 'dcbb'], f ? [17, 3, 'd'] : [17, 2, 'db']);
      // 背上豎起來的煙毛：三團大小不一、尖端往後捲（肩膀那團最大，旁邊多一小撮）
      L.push(f ? [2, 26, 'd'] : [2, 27, 'd'], f ? [3, 26, 'dcc'] : [3, 27, 'dc'], [4, 28, 'dcc'], [4, 32, 'd'], f ? [5, 19, 'd'] : [5, 20, 'd'], [5, 28, 'dccbdc'],
        [6, 20, 'dc'], [6, 29, 'dccbcb'], [7, 21, 'dcc'], [7, 29, 'dccbbbb'], f ? [8, 13, 'd'] : [8, 14, 'd'], [8, 21, 'dccbbbbcbbbbbba'],
        [9, 14, 'dcc'], [9, 18, 'dcbbbbbbbbbbbbbbaa'], [10, 15, 'dccbbbbbbbbbbbbba'], [11, 13, 'abbbbbb']);
      // 遠的耳朵
      L.push([4, 37, 'z'], [5, 36, 'zy'], [6, 36, 'zzy'], [7, 36, 'zyx'], [8, 35, 'zzyy']);
      // 遠的兩隻腳
      L.push([21, 28, 'zyx'], [22, 28, 'zyx'], [23, 28, 'zyx'], [24, 28, 'zyx']);
      L.push(...(f ? [[25, 29, 'zyx'], [26, 29, 'zyx'], [27, 29, 'zzyx']] : [[25, 28, 'zyx'], [26, 28, 'zyx'], [27, 28, 'zzyx']]));
      L.push([18, 20, 'yx'], [19, 19, 'zyx'], [20, 18, 'zyx'], [21, 18, 'zyx'], [22, 18, 'zyx'], [23, 18, 'zyx'], [24, 19, 'zyx']);
      L.push(...(f ? [[25, 18, 'zyx'], [26, 18, 'zyx'], [27, 18, 'zzyx']] : [[25, 19, 'zyx'], [26, 19, 'zyx'], [27, 19, 'zzyx']]));
      // 身體（背最亮、側面中間、肚子和大腿下面暗；後腿的大腿用一條暗線分開）
      L.push([10, 31, '444'],
        [11, 14, '34444444444444555544'],
        [12, 13, '344444444444444444333'],
        [13, 12, '3444' + '3333333333333' + '444' + '3333'],
        [14, 12, '344332' + '3333333333' + '3' + '44' + '33' + '433'],
        [15, 12, '2343323' + '333333333' + '2333' + '23433'],
        [16, 12, '2' + '3333' + '22' + '33333333' + '3' + '22' + '3' + '2' + '33' + '4' + '33' + '22'],
        [17, 12, '22333' + '22222222222' + '3333333' + '43' + '22'],
        [18, 12, '12332221'], [18, 24, '222233333333421'],
        [19, 12, '1222221'], [19, 28, '2233333321'],
        [20, 13, '12221'], [20, 30, '2223321'],
        [21, 31, '11332']);
      // 近的兩隻腳（前腳直、後腳有往後凸的腳踝）
      L.push([22, 33, '432'], [23, 33, '432'], [24, 33, '332']);
      L.push(...(f ? [[25, 32, '332'], [26, 32, '332'], [27, 32, '34332']] : [[25, 33, '332'], [26, 33, '332'], [27, 33, '34332']]));
      L.push([21, 12, '2321'], [22, 11, '3321'], [23, 11, '321']);
      L.push(...(f ? [[24, 13, '321'], [25, 13, '332'], [26, 14, '332'], [27, 14, '34332']] : [[24, 12, '321'], [25, 12, '332'], [26, 13, '332'], [27, 13, '34332']]));
      // 近的耳朵（內側暗粉紫）
      L.push([3, 40, '4'], [4, 40, '43'], [5, 39, '4p3'], [6, 39, '4pp3'], [7, 39, '4pp2'], [8, 39, '44p3']);
      // 頭：眉骨壓在眼睛上、發光的眼睛、往前伸的口鼻、鼻子；齜牙（牙肉、嘴線、一顆小犬齒）
      L.push([9, 35, '344552233'],
        [10, 34, '34444rEe3443'],
        [11, 34, '334332r34444n'],
        [12, 34, '333333333332n'],
        [13, 36, '221wmmm111'],   // 齜牙：一顆上犬齒放在嘴的最後面（嘴角旁），兩格長、尖端蓋在下唇上（半深色收尖）；前面露出暗紅的牙肉
        [14, 36, '221v2222'],
        [15, 37, '12211']);
      return L;
    } };
  // ---------- 礦殼（2026-10-09 作者：原本的比較可愛）：照原本 22×12 的圖放大兩倍——
  // 扁扁的梯形圓頂殼（上面窄、下面寬）、背上三顆往前斜的結晶（紫、灰白、小紫）、前端一隻小黃眼睛、肚子深色、底下六隻細細的小腳。
  // 2026-10-10 改成手點（pixArt）：殼的明暗沿著圓頂的弧線一圈一圈（左上最亮、右下最暗），結晶分亮面、中間、暗面三面，小腳不描邊。
  HD.kousaku = { w: 48, h: 28, eyes: 'Yy', spikeOn: '2345',
    pal: () => ({ 1: '#2E2018', 2: '#4A3628', 3: '#6E5440', 4: '#8E7258', 5: '#B0937A', b: '#3E2C20', B: '#2E2018', k: '#3A2A1E',
      P: '#4A34C8', Q: '#7A62FF', R: '#B4A2FF', G: '#6E7886', H: '#A4AEBA', I: '#D6DEE6', Y: '#FFD24A', y: '#D89A28', l: '#54402E' }),
    ol: { '*': ['#3A2818', '#1E140C'], P: ['#2A1C78', '#1C1250'], Q: ['#2A1C78', '#1C1250'], R: ['#2A1C78', '#1C1250'], G: ['#3A424C', '#262C34'], H: ['#3A424C', '#262C34'], I: ['#3A424C', '#262C34'], bare: 'l' },
    pix(f) {
      const L = [];
      // 小細腳（兩幀整排往前挪一步，像原本那樣碎步走）
      [9, 15, 21, 29, 35, 41].forEach(x => { const d = f ? 2 : 0; L.push([22, x + d, 'll'], [23, x + d, 'l'], [24, x + d - 1, 'l'], [25, x + d - 1, 'l']); });
      // 殼：圓頂，照弧面的方向分五階（光從左上前方來）
      const rows = { 8: [13, 34], 9: [11, 36], 10: [10, 38], 11: [9, 39], 12: [8, 40], 13: [7, 41], 14: [6, 42], 15: [6, 43], 16: [6, 44], 17: [6, 45], 18: [6, 45], 19: [6, 45], 20: [7, 44], 21: [9, 42] };
      for (const yy in rows) {
        const [a, b] = rows[yy], y = +yy; let s = '';
        for (let x = a; x <= b; x++) {
          const u = (x + 0.5 - 26) / 21, v = (y + 0.5 - 21) / 14, nz = Math.sqrt(Math.max(0, 1 - u * u - v * v));
          const d = -0.45 * u - 0.65 * v + 0.45 * nz - 0.3 * (y - 8) / 13;   // 越下面越暗（殼的下半部被上面擋住）
          s += y >= 20 ? (x > 30 ? 'B' : 'b') : y >= 18 && (x - a < 4 || b - x < 4) ? 'b' : d > 0.8 ? '5' : d > 0.6 ? '4' : d > 0.33 ? '3' : d > 0.04 ? '2' : '1';
        }
        L.push([y, a, s]);
      }
      // 殼上幾道小裂紋、幾點亮的砂粒
      L.push([12, 17, '2'], [13, 18, '2'], [13, 19, '2'], [15, 30, '22'], [16, 31, '2'], [11, 24, '5'], [14, 12, '4'], [16, 22, '4']);
      // 結晶（往前斜；左邊的面亮、中間、右邊的面暗）
      L.push([2, 18, 'R'], [3, 17, 'RQ'], [4, 16, 'RRQP'], [5, 15, 'RRQQP'], [6, 15, 'RQQPP'], [7, 14, 'RQQQPP']);
      L.push([2, 30, 'I'], [3, 29, 'IH'], [4, 28, 'IIHG'], [5, 27, 'IIHHG'], [6, 27, 'IHHGG'], [7, 26, 'IHHHGG']);
      L.push([4, 36, 'R'], [5, 35, 'RQ'], [6, 35, 'RQP'], [7, 34, 'RQQP'], [8, 35, 'QPP'], [9, 36, 'QP']);
      // 小黃眼睛
      L.push([16, 43, '2YY'], [17, 43, '2Yy']);
      return L;
    } };
  // ---------- 霜冠鹿（領主體）：雪白的鹿，脖子一圈結霜的鬃毛，冰晶的鹿角，細長的腳和蹄，發藍光的眼睛 ----------
  // 2026-10-10 改成手點（pixArt）：大塊的身體、脖子、頭、腳先照形狀的弧面分五階（左上亮、右下暗，陰影偏藍），
  // 近的部位蓋在遠的上面時，背光的那一側（下、右）描一條深色的內線；鬃毛、鹿角、眼睛、鼻子、耳朵、蹄再一格一格點。
  // 毛：a 最暗 → e 最亮；f g h 是遠的那一側（腳）；鬃毛 o n m；冰：P 最暗 → S 最亮；蹄 K L；眼睛 E F G；鼻子 N；耳朵內側 p q。
  HD.frostdeer = { w: 70, h: 64,
    pal: () => ({ a: '#3C5A8C', b: '#6A8CC0', c: '#A6C2E6', d: '#D6E6F8', e: '#F4FAFF', f: '#2E4470', g: '#52709E', h: '#7E9CC8',
      o: '#5E96D0', n: '#A0CCF0', m: '#E0F2FF', P: '#1E6AB8', Q: '#3AA2E8', R: '#8ED8FF', S: '#D4F2FF', K: '#2A3448', L: '#4A5670',
      E: '#7ACCFF', F: '#1A4AA8', G: '#2A7AFF', N: '#2A3448', p: '#D49AB4', q: '#B07890' }),
    ol: { '*': ['#3A4E78', '#1E2A48'], P: ['#14406E', '#0C2A4C'], Q: ['#14406E', '#0C2A4C'], R: ['#14406E', '#0C2A4C'], S: ['#14406E', '#0C2A4C'], K: ['#161C28', '#0E1218'], L: ['#161C28', '#0E1218'] },
    pix(f) {
      const W = 70, H = 64, g = Array.from({ length: H }, () => Array(W).fill('')), who = Array.from({ length: H }, () => Array(W).fill(0));
      let part = 0;
      const LX = -0.5, LY = -0.65, LZ = 0.57;
      const tone = (d, r) => d > 0.8 ? r[4] : d > 0.58 ? r[3] : d > 0.3 ? r[2] : d > 0.05 ? r[1] : r[0];
      const put = (x, y, ch) => { if (x < 1 || y < 1 || x >= W - 1 || y >= H - 1) return; g[y][x] = ch; who[y][x] = part; };
      // 內線：這一塊的邊緣碰到「別的、先畫的」東西，下側、右側那一格換成最暗的那一階
      const rim = (dark) => { for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { if (who[y][x] !== part) continue; const dn = who[y + 1][x], rt = who[y][x + 1]; if ((dn && dn !== part && g[y + 1][x]) || (rt && rt !== part && g[y][x + 1])) g[y][x] = dark; } };
      // 橢球（身體、頭、大腿）：v 往下多暗一點
      const ell = (cx, cy, rx, ry, r, o) => { part++; o = o || {};
        for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
          const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry, q = u * u + v * v; if (q > 1) continue;
          const nz = Math.sqrt(1 - q); put(x, y, tone(LX * u + LY * v + LZ * nz - (o.down || 0.18) * (v + 1) / 2 + (o.bias || 0), r)); }
        if (o.rim) rim(r[0]); };
      // 一段一段的圓柱（腳、脖子）：照橫切面的方向上光
      const limb = (pts, w0, w1, r, o) => { part++; o = o || {};
        for (let i = 0; i + 1 < pts.length; i++) { const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], ka = i / (pts.length - 1), kb = (i + 1) / (pts.length - 1);
          const wa = (w0 + (w1 - w0) * ka) / 2, wb = (w0 + (w1 - w0) * kb) / 2, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, px = -dy / len, py = dx / len;
          for (let y = Math.floor(Math.min(y0, y1) - 4); y <= Math.ceil(Math.max(y0, y1) + 4); y++) for (let x = Math.floor(Math.min(x0, x1) - 4); x <= Math.ceil(Math.max(x0, x1) + 4); x++) {
            const qx = x + 0.5 - x0, qy = y + 0.5 - y0, t = Math.max(0, Math.min(1, (qx * dx + qy * dy) / (len * len))), w = wa + (wb - wa) * t;
            const cx = qx - dx * t, cy = qy - dy * t, s = (cx * px + cy * py) / w; if (Math.abs(s) > 1 || Math.hypot(cx, cy) > w) continue;
            put(x, y, tone(LX * px * s + LY * py * s + LZ * Math.sqrt(1 - s * s) + (o.bias || 0), r)); } }
        if (o.rim) rim(r[0]); };
      const rows = (y0, x0, list) => list.forEach((s, i) => { for (let k = 0; k < s.length; k++) if (s[k] !== ' ') put(x0 + k, y0 + i, s[k]); });
      const FUR = 'abcde', FAR = 'ffggh', MANE = 'onnmm';
      // 遠的兩隻腳＋蹄
      const fH = f ? [[25, 42], [23, 50], [24.6, 55], [24.2, 59]] : [[25, 42], [24, 50], [26, 55], [26.2, 59]];
      const fF = f ? [[42, 42], [42.8, 50], [43.6, 59]] : [[42, 42], [41.2, 50], [40.4, 59]];
      limb(fH, 4.2, 2.4, FAR); limb(fF, 4, 2.4, FAR);
      part++; [fH[3][0], fF[2][0]].forEach(x => rows(59, Math.round(x) - 1, ['LKK', 'LKKK']));
      // 尾巴（白的一小撮，往上翹）
      part++; rows(27, 7, [' m', 'mmn', 'mnno', ' nno']);
      // 身體、後腿的大腿、肩膀
      ell(30, 36, 21, 9.5, FUR, { down: 0.3 });
      ell(21, 37, 7, 7.5, FUR, { rim: 1, down: 0.25, bias: 0.04 });
      ell(44, 35, 6, 7.5, FUR, { rim: 1, down: 0.25, bias: 0.04 });
      // 肚子下面一排霜毛（鋸齒往下）
      part++; rows(45, 24, [' mn  mn  mn  mn  mn', '  o   o   o   o   o']);
      // 背上長出來的小冰晶
      part++; rows(23, 24, ['  S          ', ' SR    S     ', ' RQ   SR   R ', 'RQQP  RQ  RQ ', '      QP  QP ']);
      // 近的兩隻腳＋蹄
      const nH = f ? [[20, 42], [18.6, 50], [20, 55], [20, 59]] : [[20, 42], [17.6, 50], [19, 55], [18.6, 59]];
      const nF = f ? [[46, 42], [45.4, 50], [44.4, 59]] : [[46, 42], [46.8, 50], [46.6, 59]];
      limb(nH, 4.6, 2.6, FUR, { rim: 1 }); limb(nF, 4.4, 2.6, FUR, { rim: 1 });
      part++; [nH[3][0], nF[2][0]].forEach(x => rows(59, Math.round(x) - 1, ['LLK', 'LLKK']));
      // 脖子
      limb([[44, 33], [48, 25], [52, 17]], 11, 7, FUR, { bias: 0.04 });
      // 頭、口鼻
      ell(57.5, 14.5, 6, 4.6, FUR, { down: 0.2, bias: 0.06 });
      ell(63.5, 16.8, 4.2, 2.8, FUR, { rim: 1, down: 0.15 });
      // 脖子後面的霜鬃毛：四個尖往後、凸出脖子的輪廓；喉嚨下面一大團霜毛，尖往下（冰藍色的陰影，跟白毛分得開）
      part++;
      const sw = f ? 1 : 0;
      rows(14, 47, ['mmmn']); rows(15, 45 - sw, ['mmmnn']); rows(16, 46, ['nno']);
      rows(18, 45, ['mmn']); rows(19, 43 - sw, ['mmnn']); rows(20, 44, ['nno']);
      rows(22, 43, ['mmn']); rows(23, 41 - sw, ['mmnn']); rows(24, 42, ['nno']);
      rows(26, 41, ['mmn']); rows(27, 39 - sw, ['mmnn']); rows(28, 40, ['nno']);
      rows(19, 47, ['      mm', '     mmmn', '    mmmnn', '   mmmmnn', '   mmnmno', '  mmnmnno', '  mnnmnno', ' mnnonnoo', ' nno nno', f ? '  o   o' : ' no   no']);
      // 耳朵（往後；內側粉色）
      part++; rows(9, 47, ['dd     ', ' dcdd  ', '  cpqcd', '   cqqc', '     cc']);
      // 冰晶鹿角：兩支主幹往兩邊斜（近的那支在右、暗面深一點），各分出一內一外兩根尖；每一段左邊亮（R）、右邊暗（Q／P），尖端最亮（S）
      part++;
      rows(1, 44, [
        '....S.................S...',
        '....RQ...............RQ...',
        '.....RQ.....S.S.....RQ....',
        '..S..RQ....RP.RQ....RP..S.',
        '...RQ.RQ...Q...Q...RP.RQ..',
        '.....RQRQ.RP...RQ.RPQQ....',
        '........RQQ.....RRP.......',
        '.........RQ.....RP........',
        '..........RQ...RP.........',
        '..........RQ...RP.........',
        '...........RQ.RP..........'].map(r => r.split('.').join(' ')));
      // 眼睛（發藍光，上面一條眼皮）、鼻頭、鼻孔、嘴
      part++;
      rows(12, 57, ['bbb', 'FGE', ' F ']);
      rows(15, 66, [' N', 'NN', 'N ']);
      rows(19, 61, ['bbbb']);
      // 轉成 pixArt 的格式
      return g.map((r, y) => [y, 0, r.map(c => c || ' ').join('')]);
    } };

  // ==== 巢織蛛 ====
  // ---------- 領主體・巢織蛛：黑紫色的大蜘蛛，腹部有紅褐色的斜紋，前面一團紅眼、一對淡色的螯牙；八隻腳的膝蓋高過身體 ----------
  HD.tsuchigumo = { w: 128, h: 84, eyes: 'Rr',
    m: { abcde: '#38323F', fghij: '#423B4B', klmno: '#3A3443', KLMNO: '#221E28', pqrst: '#8E3A26', uvwxy: '#B8A890' },
    x: () => ({ R: '#FF5A3A', r: '#B01E1E', z: '#160C12' }),
    pix(f, K) {
      const s = f ? 1 : -1;
      // 遠的四隻腳（暗）：膝蓋往上，腳尖落地
      [[[90, 48], [112, 28], [118, 34], [119, 79]], [[86, 50], [100, 26], [106, 32], [100, 79]], [[80, 50], [66, 26], [60, 32], [52, 79]], [[76, 48], [50, 24], [40, 30], [22, 79]]].forEach((p, i) => {
        if (f) p[3][1] -= i % 2 ? 0 : 2; K.limb(p, 4, 2, 'KLMNO');
      });
      // 腹部（後面那一大顆）＋紅褐色的斜紋、尾端的絲疣
      K.ell(42, 45, 29, 21, 'abcde', { rot: -8, down: 0.25 });
      for (let y = 0; y < K.H; y++) for (let x = 0; x < 72; x++) { const c = K.g[y][x], i = c ? 'abcde'.indexOf(c) : -1; if (i >= 0 && ((x * 0.8 + y * 0.55) % 15 + 15) % 15 < 3.2 && x > 18 && x < 64) K.g[y][x] = 'pqrst'[i]; }
      K.ell(14, 52, 4, 3.4, 'abcde', { rim: 1 });
      // 頭胸
      K.ell(84, 50, 16, 12, 'fghij', { rim: 1, bias: 0.04 });
      // 螯牙（一對，往下彎、尖端淡色）
      K.limb([[97, 55], [101, 60], [99, 64]], 3.6, 2, 'fghij', { rim: 1 }); K.limb([[93, 57], [96, 62], [94, 66]], 3.4, 2, 'fghij', { rim: 1 });
      K.rows(63, 98, ['vw', 'u']); K.rows(65, 93, ['vw', 'u']);
      // 近的四隻腳（亮一點；一節一節，關節處淡一圈）
      const near = [[[94, 50], [110, 22], [116, 28], [124, 79]], [[88, 54], [98, 26], [104, 32], [108, 79]], [[80, 55], [70, 28], [64, 34], [62, 79]], [[76, 53], [54, 20], [44, 28], [32, 79]]];
      near.forEach((p, i) => { if (f) { p[1][0] += i < 2 ? s : -s; p[3][1] -= i % 2 ? 2 : 0; } K.limb(p, 5, 2.4, 'klmno', { rim: 1 }); [p[1], p[2]].forEach(([x, y]) => K.rows(Math.round(y) - 1, Math.round(x) - 1, ['mn', 'nm'])); });
      // 眼睛：兩顆大的、四顆小的（紅光）
      K.rows(43, 92, ['  zz zz', ' zRrzRr', ' zrrzrr', '  zz zz']);
      K.rows(41, 98, ['Rz', 'rz']); K.rows(47, 99, ['Rz']); K.rows(40, 88, ['Rz']);
      return K.layers();
    } };
  // ==== 巢織蛛 完 ====
  // ==== 千節蟲 ====
  // ---------- 領主體・千節蟲：紅褐色的大蜈蚣，一節一節的背甲（接縫深色）、每節一對黃色的腳；頭有一對往前彎的觸角、一對深色的毒顎 ----------
  HD.omukade = { w: 144, h: 52, eyes: 'R',
    m: { abcde: '#8A2E1E', klmno: '#A23A22', fghij: '#D8AA44', FGHIJ: '#7A5A26', pqrst: '#3A1A14' },
    x: () => ({ R: '#FFD84A', z: '#160A08' }),
    pix(f, K) {
      const N = 14, X0 = 14, DX = 8.2, cy = i => 29 + Math.sin(i * 0.7 + (f ? 0.9 : 0)) * 1.6;
      // 遠的腳（暗）
      for (let i = 0; i < N; i++) { const x = X0 + i * DX, y = cy(i), k = (i + f) % 2 ? 1 : -1; K.limb([[x - 1, y + 3], [x - 4 + k, 40], [x - 6 + k * 2, 48]], 2.4, 1.6, 'FGHIJ'); }
      // 尾巴的一對尾鬚（往後）
      K.limb([[X0 - 2, cy(0) - 1], [X0 - 9, cy(0) - 5], [X0 - 12, cy(0) - 4]], 2.6, 1.4, 'fghij'); K.limb([[X0 - 2, cy(0) + 2], [X0 - 10, cy(0) + 4], [X0 - 13, cy(0) + 7]], 2.6, 1.4, 'FGHIJ');
      // 身體一節一節（左邊的接縫描深色）
      for (let i = 0; i < N; i++) { const x = X0 + i * DX, y = cy(i), r = 6 + Math.min(i, 3) * 0.35 - Math.max(0, i - 11) * 0.2; K.ell(x, y, r + 0.6, r + 0.8, 'abcde', { rim: 'l', down: 0.3 }); K.rows(Math.round(y - r + 1), Math.round(x - 1), ['dd']); }
      // 近的腳（黃色、一節一節）
      for (let i = 0; i < N; i++) { const x = X0 + i * DX, y = cy(i), k = (i + f) % 2 ? -1 : 1; K.limb([[x + 1, y + 4], [x + 4 + k, 40], [x + 3 + k * 2, 49]], 2.8, 1.6, 'fghij', { rim: 1 }); K.px(x + 4 + k, 40, 'h'); }
      // 頭、觸角、毒顎
      const hx = X0 + N * DX + 2, hy = cy(N) - 1;
      K.limb([[hx + 3, hy - 4], [hx + 7, hy - 12], [hx + 11, hy - 16 + (f ? 1 : 0)]], 2.4, 1.4, 'fghij');
      K.limb([[hx + 1, hy - 5], [hx + 2, hy - 15], [hx + 6, hy - 21 + (f ? 1 : 0)]], 2.2, 1.2, 'FGHIJ');
      K.ell(hx, hy, 8.4, 7.2, 'klmno', { rim: 'l', bias: 0.05 });
      K.limb([[hx + 5, hy + 4], [hx + 10, hy + 6], [hx + 11, hy + 10]], 3, 1.6, 'pqrst', { rim: 1 }); K.limb([[hx + 2, hy + 5], [hx + 6, hy + 9], [hx + 6, hy + 12]], 2.6, 1.4, 'pqrst', { rim: 1 });
      K.rows(Math.round(hy - 3), Math.round(hx + 3), ['zz', 'zR']);
      return K.layers();
    } };
  // ==== 千節蟲 完 ====
  // ==== 地出巨骸 ====
  // ---------- 領主體・地出巨骸：從地上的黑洞裡爬出來的巨大骷髏上半身；大頭骨、紅光的眼窩、一排牙，肋骨一根一根，兩手撐在洞口 ----------
  HD.gashadokuro = { w: 152, h: 128, eyes: 'Rr',
    m: { abcde: '#E0D4B6', fghij: '#B8AA8C', VWXYZ: '#4A3A2E' },
    x: () => ({ R: '#FF5A3A', r: '#A81E1E', z: '#120A0C', y: '#2A1C18' }),
    pix(f, K) {
      const d = f ? 1 : 0, C = 76;
      // 洞口（外圈是土）
      K.ell(C, 116, 58, 10, 'VWXYZ', { flat: 2 }); K.ell(C, 115, 55, 8.4, 'VWXYZ', { flat: 1 });
      // 脊椎、肋骨（一根一根往兩邊彎下來）
      K.limb([[C, 112], [C, 50 + d]], 7, 6, 'fghij');
      for (let i = 0; i < 7; i++) { const y = 56 + d + i * 7.2, w = 30 - i * 1.6;
        K.limb([[C - 3, y], [C - w * 0.6, y - 1], [C - w, y + 5], [C - w + 3, y + 11]], 4, 2.6, 'abcde', { rim: 1 });
        K.limb([[C + 3, y], [C + w * 0.6, y - 1], [C + w, y + 5], [C + w - 3, y + 11]], 4, 2.6, 'abcde', { rim: 1 }); }
      for (let y = 52 + d; y < 108; y += 4) K.rows(y, C - 2, ['ihhi']);   // 一節一節的脊椎
      // 鎖骨、肩膀、手臂（上臂、前臂），手撐在洞口
      const arm = s => { const sx = C + s * 32, el = [C + s * 50, 80 + d], wr = [C + s * 58, 104];
        K.limb([[C + s * 4, 50 + d], [C + s * 20, 47 + d], [sx, 52 + d]], 4.4, 4, 'abcde', { rim: 1 });
        K.ell(sx, 53 + d, 5.4, 5, 'abcde', { rim: 1 });
        K.limb([[sx, 54 + d], el], 7, 5.4, 'abcde', { rim: 1 }); K.ell(el[0], el[1], 4.2, 4, 'abcde', { rim: 1 });
        K.limb([el, wr], 5.4, 4.4, 'abcde', { rim: 1 }); K.limb([[el[0] + s * 2, el[1] + 1], [wr[0] + s * 2, wr[1] - 1]], 3, 2.6, 'fghij');
        [-2, 0, 2, 4].forEach(k => K.limb([[wr[0], wr[1]], [wr[0] + s * (6 + k), 110 + Math.abs(k)], [wr[0] + s * (9 + k * 1.5), 114 + Math.abs(k) * 0.5]], 2.6, 1.8, 'abcde', { rim: 1 })); };
      arm(-1); arm(1);
      // 洞裡面（蓋住脊椎的下面）
      K.ell(C, 117, 46, 6.4, 'VWXYZ', { flat: 0 }); K.rows(112, C - 30, ['y'.repeat(60)]);
      // 頭骨：上面圓的頭蓋、兩邊顴骨、下面窄一點的上顎；下顎另外一塊（張開一點）
      K.ell(C, 25 + d, 22, 19, 'abcde', { down: 0.2, bias: 0.04 });
      K.ell(C - 12, 37 + d, 7, 6, 'abcde', { down: 0.3 }); K.ell(C + 12, 37 + d, 7, 6, 'abcde', { down: 0.3 });
      K.ell(C, 40 + d, 13, 7, 'abcde', { down: 0.3 });
      K.ell(C, 52 + d * 2, 12, 5, 'abcde', { rim: 1, down: 0.35 });
      // 眼窩（大、上緣壓深的眉骨）＋裡面的紅光
      [-1, 1].forEach(s => { const ex = C + s * 9.5; K.ell(ex, 30 + d, 7, 7.4, 'aaabb', { flat: 1 }); K.ell(ex, 31 + d, 6, 6.4, 'zzzzz', { flat: 0 }); K.rows(31 + d, ex - 2, ['rRRr', 'rRRr', ' rr ']); K.rows(22 + d, ex - 6, ['  bbbbbbb', ' b       b']); });
      // 鼻腔（倒三角）
      K.rows(38 + d, C - 3, ['zzzzzz', ' zzzz ', '  zz  ']);
      // 上排牙、下排牙（一顆一顆，中間有暗縫）
      K.rows(44 + d, C - 11, ['a'.repeat(23), 'z'.repeat(23), 'z'.repeat(23), 'z'.repeat(23)]);
      for (let x = C - 10; x <= C + 8; x += 3) K.rows(45 + d, x, ['ed', 'dc', 'cb']);
      K.rows(48 + d, C - 11, ['z'.repeat(23), ' ' + 'z'.repeat(21), ' ' + 'z'.repeat(21)]);
      for (let x = C - 9; x <= C + 7; x += 3) K.rows(49 + d * 2, x, ['dc', 'cb']);
      // 頭骨的裂紋
      K.rows(8 + d, C - 4, ['a', ' a', ' a', 'a', ' a']); K.rows(12 + d, C + 12, ['a', ' a', '  a', '  aa']);
      return K.layers();
    } };
  // ==== 地出巨骸 完 ====
  // ==== 熔顎蜥 ====
  // ---------- 領主體・熔顎蜥：岩石一樣的暗色厚皮、身上一條條發光的岩漿裂紋、背上一排岩刺；張著大嘴，嘴裡是熔岩的橘光，一排尖牙 ----------
  HD.lavajaw = { w: 68, h: 44, eyes: 'Y',
    m: { abcde: '#4A3430', fghij: '#2E201E', ABCDE: '#5A3E36' },
    x: () => ({ L: '#FFB43A', l: '#E0601E', M: '#FF8A2A', N: '#8A1E10', Y: '#FFE04A', w: '#E8DCC4', z: '#1A0E0C' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      // 遠的兩隻腳（暗）、尾巴
      K.limb([[22, 30], [18 + d, 36], [20 + d, 41]], 5, 3.4, 'fghij'); K.limb([[40, 30], [44 - d, 36], [43 - d, 41]], 5, 3.4, 'fghij');
      K.limb([[16, 27], [8, 29], [3, 26 - d]], 10, 3, 'abcde', { bias: -0.02 });
      // 身體
      K.ell(31, 26, 18, 8.6, 'abcde', { down: 0.3 });
      // 背上的岩刺
      [[18, 18], [23, 17], [28, 16.5], [33, 16.5], [38, 17], [9, 22]].forEach(([x, y], i) => K.poly([[x - 2, y + 2], [x - 0.5, y - 3 - (i % 2)], [x + 2, y + 2]], 'ABCDE'));
      // 近的兩隻腳（爪子淡色）
      K.limb([[24, 31], [20 - d, 36], [22 - d, 41]], 6, 4, 'abcde', { rim: 1 }); K.rows(41, 21 - d, ['w w']);
      K.limb([[42, 31], [46 + d, 36], [46 + d, 41]], 6, 4, 'abcde', { rim: 1 }); K.rows(41, 45 + d, ['w w']);
      // 頭（上顎）、張開的下顎、嘴裡的熔岩光、牙
      K.poly([[44, 26], [50, 28 + d], [64, 30 + d], [62, 33 + d], [48, 33], [44, 30]], 'abcde', { rim: 1 });
      K.poly([[47, 27], [60, 27 + d], [58, 30 + d], [48, 31]], 'NNMMM', { flat: 0 }); K.rows(28 + d, 50, ['MMMM', ' NMM']);
      K.ell(52, 21, 10, 6.2, 'abcde', { rim: 1, bias: 0.04 }); K.poly([[54, 18], [65, 22], [64, 26], [52, 26]], 'abcde', { rim: 1 });
      for (let x = 52; x <= 62; x += 3) { K.rows(26, x, ['w', 'w']); K.rows(30 + d, x + 1, ['w']); }
      // 岩漿的裂紋（亮橘、邊上暗橘）
      K.rows(20, 16, ['  lLl', ' l   lLl', 'l       lLLl']);
      K.rows(26, 22, ['lLl      lLl', '   lLLl     lLl']);
      K.rows(30, 30, ['lLLl']); K.rows(16, 48, ['lL']);
      K.rows(24, 6, ['lLl', '   lL']);
      // 眼睛（黃光）、鼻孔
      K.rows(18, 56, ['zY', 'zz']); K.px(63, 21, 'z');
      return K.layers();
    } };
  // ==== 熔顎蜥 完 ====
  // ==== 沙暴鯨與深淵王蛸 ====
  // 捲起來的一條（觸手、尾巴）：從 (x, y) 朝 a 度出發，每一步轉 curl 度、越來越短
  const curlPts = (x, y, a, len, curl, n) => { const p = [[x, y]]; let ang = a * Math.PI / 180; for (let i = 0; i < n; i++) { const l = len * (1 - i / (n + 2)); x += Math.cos(ang) * l; y += Math.sin(ang) * l; p.push([x, y]); ang += curl * Math.PI / 180 * 2.2 * Math.pow((i + 1) / n, 1.6); } return p; };   // 根部直、越到尖端捲越多
  // ---------- 領主體・沙暴鯨：在沙裡游的大鯨（頭大、身體往尾巴收細），下半身埋在起伏的沙丘裡、旁邊飛起沙；喉嚨幾條淺色的褶紋、長長的嘴線、背上幾顆藤壺，尾鰭翹起來 ----------
  HD.sandwhale = { w: 72, h: 40,
    m: { abcde: '#7E6A58', fghij: '#D2B88E', klmno: '#5E4E42', pqrst: '#E8DCC0' },
    x: () => ({ z: '#1E140E', y: '#3E2E22' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      // 尾鰭（翹起來）
      K.poly([[6, 15 - d], [0, 5 - d], [5, 7 - d], [9, 13 - d]], 'abcde'); K.poly([[7, 14 - d], [14, 5 - d], [13, 10 - d], [10, 15 - d]], 'abcde', { rim: 1 });
      // 身體：頭粗、往尾巴收細（一整條）
      K.limb([[59, 19], [52, 19], [42, 20], [31, 21], [21, 21], [12, 18], [7, 14 - d]], 21, 4, 'abcde');
      // 肚子（嘴線以下）：奶油色，一條一條的褶紋（只用亮的兩階，下緣一點陰影）
      const bel = x => (x > 45 ? 21.5 + (66 - x) * 0.09 : 23.3 + (45 - x) * 0.09);
      for (let y = 0; y < K.H; y++) for (let x = 12; x < 70; x++) { const c = K.g[y][x]; if (!c || !'abcde'.includes(c) || y < bel(x)) continue; const below = K.g[y + 1] && 'abcde'.includes(K.g[y + 1][x] || '-'); K.g[y][x] = !below ? 'r' : (y - Math.round(bel(x))) % 2 ? 's' : 't'; }
      // 背鰭、胸鰭
      K.poly([[30, 12], [35, 6 + d], [38, 11.5]], 'abcde', { rim: 1 }); K.poly([[46, 26], [40, 33], [37, 32], [42, 25]], 'klmno', { rim: 1 });
      // 嘴線、眼睛、藤壺
      K.rows(20, 50, ['             yyy', '        yyyyy', '   yyyyy', 'yyy']); K.rows(17, 47, ['zz', 'zy']);
      [[36, 13], [42, 11], [48, 10], [39, 15], [56, 11]].forEach(([x, y]) => K.rows(y, x, ['nm', 'ml']));
      // 沙浪（蓋住肚子下面）＋飛起來的沙
      K.ell(38, 37, 36, 4, 'fghij', { down: 0.5 });
      K.ell(14, 35, 9, 3.4, 'fghij', { rim: 1 }); K.ell(58, 34, 11, 4, 'fghij', { rim: 1 });
      [[4, 30], [68, 28], [24, 31], [50, 31], [70, 32], [30, 29]].forEach(([x, y], i) => K.rows(y - ((i + d) % 2) * 2, x, ['i', ' j']));
      return K.layers();
    } };
  // ---------- 領主體・深淵王蛸：深紫色的大章魚，頭（外套膜）上一塊塊暗斑；兩顆大大的黃眼睛（橫的瞳孔），底下的觸手往兩邊捲、尖端捲起來，內側一排淡粉色的吸盤 ----------
  HD.kraken = { w: 64, h: 60, eyes: 'Y',
    m: { abcde: '#6A3A7A', fghij: '#4A2858', pqrst: '#E8A8C8' },
    x: () => ({ Y: '#FFD84A', z: '#160A1C' }),
    pix(f, K) {
      const d = f ? 5 : 0;
      // 後面的觸手（暗）
      K.limb(curlPts(26, 36, 140, 5.4, 22 - d, 6), 7, 1.6, 'fghij'); K.limb(curlPts(38, 36, 40, 5.4, -22 + d, 6), 7, 1.6, 'fghij');
      K.limb(curlPts(30, 38, 100, 5.4, 18 + d, 6), 7, 1.6, 'fghij'); K.limb(curlPts(34, 38, 80, 5.4, -18 - d, 6), 7, 1.6, 'fghij');
      // 頭（外套膜）＋暗斑
      K.ell(32, 18, 17, 16.5, 'abcde', { down: 0.2, bias: 0.03 });
      [[24, 9, 2.2], [36, 6, 1.8], [43, 14, 2], [27, 16, 1.6], [39, 21, 1.4]].forEach(([x, y, r]) => K.ell(x, y, r * 1.3, r, 'aaabb', { flat: 1 }));
      // 前面的觸手（往兩邊捲、尖端往上捲；內側吸盤）
      const T = [curlPts(24, 33, 158, 6.4, 24 - d, 7), curlPts(28, 36, 118, 6.2, 20 + d, 7), curlPts(36, 36, 62, 6.2, -20 - d, 7), curlPts(40, 33, 22, 6.4, -24 + d, 7)];
      T.forEach((p, i) => { K.limb(p, 8, 1.6, 'abcde', { rim: 1 }); for (let k = 1; k < p.length - 2; k++) { const [x, y] = p[k], [x2, y2] = p[k + 1], nx = -(y2 - y), ny = x2 - x, L = Math.hypot(nx, ny) || 1, sgn = i % 2 ? 1 : -1; K.rows(Math.round(y + ny / L * 2.2 * sgn), Math.round(x + nx / L * 2.2 * sgn), ['s']); } });
      K.ell(32, 34, 10, 4.4, 'abcde', { rim: 1 });
      // 眼睛（大、黃色、橫的瞳孔）
      [24, 40].forEach(x => K.rows(21, x - 4, ['  zzzz  ', ' zYYYYz ', 'zYYYYYYz', 'zYzzzzYz', 'zYYYYYYz', ' zYYYYz ', '  zzzz  ']));
      return K.layers();
    } };
  // ==== 沙暴鯨與深淵王蛸 完 ====
  // ==== 領主二 ====
  // ---------- 領主體・萬面樹：一棵圓圓的大樹，濃綠的樹冠一團一團，裡面嵌著好幾張蒼白的臉（黑眼窩、張著嘴）；粗樹幹上也有一張大臉，樹根往外爬 ----------
  HD.faceforest = { w: 68, h: 68,
    m: { abcde: '#3E7A3A', klmno: '#6A4A2E', pqrst: '#E4DCC8' },
    x: () => ({ z: '#140C0A', y: '#2A1A12' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      // 樹根、樹幹
      [[[30, 60], [22, 63], [14, 65]], [[38, 60], [46, 63], [54, 65]], [[34, 61], [34, 65]]].forEach(p => K.limb(p, 5, 2.4, 'klmno', { rim: 1 }));
      K.limb([[34, 63], [33, 50], [34, 40]], 15, 11, 'klmno');
      for (let y = 42; y < 62; y += 3) K.rows(y, 29 + (y % 2), ['l', '', ' l']);
      // 樹幹上的大臉
      K.rows(47, 29, ['zz  zz', 'zz  zz', '', ' yzzy', '  zz']);
      // 樹冠：一團一團（每團亮的那面朝左上）
      K.ell(34, 27, 29, 19, 'abcde', { down: 0.3 });
      [[14, 31, 11, 10], [54, 31, 11, 10], [22, 13, 12, 10], [46, 13, 12, 10], [34, 8, 11, 7], [34, 36, 13, 8]].forEach(([x, y, rx, ry]) => K.ell(x, y + (x < 34 ? d : -d) * 0.5, rx, ry, 'abcde', { rim: 1, down: 0.25 }));
      // 葉子的亮點（一小撮一小撮）
      [[10, 26], [20, 8], [40, 6], [50, 24], [28, 22], [16, 38], [44, 34]].forEach(([x, y]) => K.rows(y, x, ['de', 'd']));
      // 嵌在樹冠裡的臉（蒼白、黑眼窩、張嘴）
      [[16, 28], [30, 16], [48, 18], [42, 32], [24, 36], [56, 30]].forEach(([x, y], i) => { K.ell(x, y, 3.6, 4.2, 'pqrst', { rim: 1, bias: 0.05 }); K.rows(y - 1, x - 2, ['z z', '', i % 2 ? ' z' : ' zz'].map(s => s.padEnd(3, ' '))); });
      return K.layers();
    } };
  // ---------- 領主體・朽翼龍：只剩骨頭的翼龍——長脖子、角往後的頭骨、一根根的肋骨、骨頭撐著破破爛爛的暗色翼膜；眼窩裡一點青綠色的鬼火 ----------
  HD.bonewyvern = { w: 72, h: 52, eyes: 'GV',
    m: { abcde: '#E2D8C0', fghij: '#4A3E52', klmno: '#B8AC94' },
    x: () => ({ G: '#7AFFD8', V: '#2AB89A', z: '#140E12' }),
    pix(f, K) {
      const d = f ? 2 : 0;
      // 翅膀：骨頭撐開、中間是破爛的翼膜
      const sh = [36, 22], el = [26, 8 - d], tips = [[4, 4 - d], [8, 16 - d], [14, 26 - d * 0.5], [22, 30]];
      tips.forEach((t, i) => { if (i + 1 < tips.length) K.poly([el, t, tips[i + 1], [(t[0] + tips[i + 1][0]) / 2 + 3, (t[1] + tips[i + 1][1]) / 2 - 1]], 'fghij', { flat: i % 2 ? 1 : 2 }); });
      K.poly([sh, el, [22, 30], [30, 30]], 'fghij', { flat: 1 });
      K.limb([sh, el], 3.4, 2.6, 'abcde'); tips.forEach(t => K.limb([el, t], 2.4, 1.2, 'abcde'));
      // 尾巴（一節一節）、後腳、前腳
      K.limb([[22, 30], [12, 32], [4, 30 - d * 0.5], [1, 26]], 4, 1.6, 'klmno');
      for (let x = 4; x < 22; x += 3) K.px(x, 31 - (x < 10 ? 1 : 0), 'm');
      K.limb([[22, 31], [26, 40], [21, 48]], 3.6, 2.4, 'klmno'); K.rows(48, 18, ['kk kk']);
      K.limb([[38, 29], [43, 38], [41, 48]], 3.6, 2.4, 'abcde', { rim: 1 }); K.rows(48, 39, ['aa aa']);
      // 脊椎、肋骨
      K.limb([[22, 29], [30, 27], [38, 24], [45, 18], [52, 13]], 4.2, 3.4, 'abcde');
      for (let x = 24; x <= 38; x += 3) K.limb([[x, 27 - (x - 24) * 0.2], [x - 1, 33], [x + 1, 36]], 2, 1.6, 'abcde', { rim: 1 });
      for (let i = 0; i < 6; i++) K.px(40 + i * 2, 21 - i * 1.5, 'c');
      // 頭骨（往後的角、眼窩、牙）
      K.poly([[50, 9], [58, 7], [68, 12 + d * 0.3], [67, 15], [56, 16], [50, 14]], 'abcde', { rim: 1 });
      K.poly([[56, 16], [66, 16], [64, 19], [56, 18]], 'klmno', { rim: 1 });
      K.limb([[52, 9], [46, 4], [42, 3]], 2.6, 1.2, 'klmno'); K.limb([[54, 8], [50, 2], [47, 1]], 2.2, 1, 'abcde');
      K.rows(10, 55, ['zzz', 'zGz', ' zz']); K.rows(15, 58, ['a a a a']); K.px(66, 12, 'z');
      return K.layers();
    } };
  // ---------- 領主體・雷鳴猿：藍紫色的大猿，駝著背、長手臂撐地；胸口灰藍、臉是淺色的；頭上和肩膀竄著黃色的閃電，眼睛發黃光 ----------
  HD.thunderape = { w: 60, h: 60, eyes: 'Y',
    m: { abcde: '#4A4A8E', fghij: '#33336A', pqrst: '#A8B4D8' },
    x: () => ({ Y: '#FFE24A', y: '#E8A82A', z: '#12122A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      // 遠的手臂、腳（暗）
      K.limb([[22, 26], [14, 40], [14, 54]], 9, 7, 'fghij'); K.ell(14, 55, 4.6, 3.4, 'fghij');
      K.limb([[24, 44], [20, 52], [22, 57]], 8, 6, 'fghij');
      // 身體（駝背）、胸口
      K.ell(30, 33, 17, 15, 'abcde', { down: 0.25 });
      K.ell(33, 36, 8, 9, 'pqrst', { down: 0.3 });
      // 近的腳
      K.limb([[36, 44], [40, 51], [37, 57]], 9, 7, 'abcde', { rim: 1 }); K.rows(57, 33, ['rrrrrrr']);
      // 近的長手臂（拳頭撐地）
      K.limb([[42, 25], [50, 38 + d], [50, 53]], 10, 8, 'abcde', { rim: 1 }); K.ell(50, 54, 5.4, 4, 'abcde', { rim: 1 }); K.rows(55, 47, ['r r r']);
      // 頭、臉、眉骨、眼睛、嘴
      K.ell(35, 16, 9.5, 8.5, 'abcde', { rim: 1, bias: 0.03 });
      K.ell(39, 19, 6, 5.2, 'pqrst', { down: 0.3 });
      K.rows(14, 33, ['bbbbbbbb']); K.rows(15, 35, ['zY  zY']); K.rows(21, 37, ['zzzz']);
      // 閃電（頭上、肩膀）
      K.rows(1 + d, 31, ['  Y', ' Yy', 'YY', ' YY', '  Y']); K.rows(3 - d, 38, ['Y', 'yY', ' YY', 'YY', 'Y']);
      K.rows(18 + d, 16, ['  Y', ' YY', 'YY', ' Yy']); K.rows(16 - d, 46, ['Y', 'YY', ' YY', 'yY']);
      return K.layers();
    } };
  // ---------- 領主體・緋面風翁：戴著紅色長鼻面具的老翁，白長髮、白袍、紅腰帶；背後一大片黑色的羽毛披風，手上一把大大的綠色葉扇 ----------
  HD.windelder = { w: 64, h: 60, eyes: 'Y',
    m: { abcde: '#E6E0D4', fghij: '#2E2C3A', pqrst: '#C8302A', klmno: '#4E8A3A' },
    x: () => ({ Y: '#FFD84A', z: '#140A0A', u: '#8A6A3A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      // 背後的羽毛披風（一根一根往外張）
      [[200, 22], [215, 24], [230, 25], [245, 24], [260, 20], [185, 18]].forEach(([a, l], i) => { const r = a * Math.PI / 180; K.limb([[28, 24], [28 + Math.cos(r) * l * 0.55, 24 + Math.sin(r) * l * 0.55 - d], [28 + Math.cos(r) * l, 24 + Math.sin(r) * l - d * 2]], 7, 2.4, 'fghij', { rim: i ? 1 : 0 }); });
      // 白袍（下擺寬）、袖子、腰帶
      K.poly([[22, 24], [36, 24], [42, 56], [16, 56]], 'abcde');
      for (let x = 20; x < 40; x += 5) K.rows(36, x, ['c', 'c', 'b', 'b', 'c', 'c', 'b', 'b', 'c', 'c']);
      K.rows(33, 21, ['ppppppppppppppp', 'rrrrrrrrrrrrrrr']);
      K.limb([[34, 27], [42, 34], [46, 32]], 7, 6, 'abcde', { rim: 1 });
      // 葉扇（握在右手）
      K.limb([[46, 32], [50, 26]], 2, 2, 'u'.repeat(5), { flat: 2 });
      K.ell(54, 17 + d, 9, 11, 'klmno', { rot: 20, rim: 1 }); K.limb([[50, 26], [55, 16 + d], [58, 7 + d]], 1.2, 1, 'mmmmm', { flat: 0 });
      [[52, 20], [54, 15], [56, 11]].forEach(([x, y]) => K.rows(y + d, x - 3, ['m  m']));
      // 頭：白長髮、紅面具、長鼻子、眉毛、眼睛
      K.ell(29, 15, 8.5, 9, 'abcde', { bias: 0.04 }); K.limb([[24, 18], [21, 26], [22, 32]], 6, 3, 'abcde');
      K.ell(31, 15, 6, 6.4, 'pqrst', { rim: 1, bias: 0.04 });
      K.limb([[35, 15], [41, 18], [44, 21]], 3.4, 1.8, 'pqrst', { rim: 1 });
      K.rows(12, 28, ['eee eee']); K.rows(13, 29, ['zY zY']); K.rows(19, 29, ['zzzz']);
      K.limb([[29, 21], [30, 27], [28, 31]], 4, 1.6, 'abcde');   // 白鬍子
      return K.layers();
    } };
  // ---------- 領主體・棘背狼：黑色的大狼，背上一排銀色的尖棘（往後斜），紅眼睛、齜牙（一顆尖犬齒在嘴的最後面） ----------
  HD.spikewolf = { w: 70, h: 46, eyes: 'RQ',
    m: { abcde: '#34343E', fghij: '#202028', pqrst: '#A8A8B8' },
    x: () => ({ R: '#FF4A3A', Q: '#A81E1E', z: '#0A0A0E', w: '#E8E0D4', M: '#6A1E2A', v: '#9A9088' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      // 遠的腳（暗）
      K.limb([[22, 30], [18 - d, 37], [20 - d, 43]], 5.4, 3.4, 'fghij'); K.limb([[48, 30], [50 + d, 37], [52 + d, 43]], 5.4, 3.4, 'fghij');
      // 尾巴、身體
      K.limb([[14, 24], [7, 22], [3, 16 + d]], 7, 3, 'abcde');
      K.ell(34, 25, 21, 9.4, 'abcde', { down: 0.3 });
      K.ell(18, 26, 8, 8, 'abcde', { rim: 1, down: 0.3 });
      // 背上的銀棘（往後斜，左面亮右面暗）
      for (let i = 0; i < 8; i++) { const x = 16 + i * 4.4, y = 17 - Math.sin(i / 7 * Math.PI) * 2.4, h = 7 + Math.sin(i / 7 * Math.PI) * 4; K.poly([[x - 2, y + 2], [x - 4.5, y - h], [x + 2.4, y + 2]], 'pqrst'); }
      // 近的腳
      K.limb([[24, 31], [22 + d, 38], [24 + d, 43]], 6, 3.8, 'abcde', { rim: 1 }); K.limb([[46, 31], [46 - d, 38], [48 - d, 43]], 6, 3.8, 'abcde', { rim: 1 });
      // 頭（壓低往前）、耳朵
      K.ell(53, 22, 9, 7.4, 'abcde', { rim: 1, bias: 0.04 });
      K.poly([[56, 20], [68, 23], [67, 27], [56, 28]], 'abcde', { rim: 1 });
      K.poly([[48, 17], [49, 8], [53, 15]], 'abcde', { rim: 1 }); K.poly([[52, 16], [55, 8], [57, 16]], 'abcde', { rim: 1 });
      // 眼睛、鼻子、嘴（牙肉、最後面一顆犬齒）
      K.rows(20, 55, ['zRQ']); K.rows(23, 66, ['zz']);
      K.rows(26, 56, ['wMMMzzzzz']); K.px(56, 27, 'v');
      return K.layers();
    } };
  // ==== 領主二 完 ====
  // ==== A1 ====
  // ---------- 三連貂：灰白的鼬，脖子圍著一條巾（絆＝藍、斬＝紅、癒＝綠），前腳是一把彎鐮刀；尾巴往後翹 ----------
  HD.kamaitachi = { w: 36, h: 20, eyes: 'E',
    m: { abcde: '#C9D6E0', fghij: '#8A9AA6', klmno: '#DDE6EE' },
    x: role => ({ s: { trip: '#3A6ACF', cut: '#C8323A', heal: '#3E9A5A' }[role] || '#C8323A', S: { trip: '#7A9AF0', cut: '#F06A6A', heal: '#7ACF8A' }[role] || '#F06A6A', E: '#1A6A8A', z: '#20242A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[8, 11], [3, 6], [2, 2 + d]], 4.4, 2, 'fghij');   // 尾巴
      K.limb([[12, 17], [10 + d, 19]], 2, 1.6, 'fghij'); K.limb([[22, 17], [24 - d, 19]], 2, 1.6, 'fghij');   // 遠的腳
      K.limb([[8, 11], [16, 12], [25, 10]], 7, 6.4, 'abcde');   // 身體
      K.limb([[11, 15], [9 - d, 19]], 2.2, 1.8, 'abcde', { rim: 1 }); K.limb([[20, 15], [22 + d, 19]], 2.2, 1.8, 'abcde', { rim: 1 });
      K.ell(29, 6, 4.6, 3.8, 'abcde', { rim: 1, bias: 0.04 }); K.limb([[31, 6], [34, 7]], 3, 2, 'abcde');   // 頭、鼻子
      K.poly([[26, 3], [27, 0.5], [29, 3]], 'abcde');
      K.rows(5, 30, ['zE']); K.px(34, 6, 'z');
      K.rows(8, 24, ['sssS', ' sss']); K.rows(10, 24, ['  s', '   s']);   // 巾
      K.poly([[26, 12], [33, 12], [35, 16], [32, 14], [27, 14]], 'klmno', { rim: 1 });   // 鐮刀
      return K.layers();
    } };
  // ---------- 游焰：藍色的鬼火，下面圓、上面幾條火舌往上竄；核心亮、外圈暗；兩顆深色的眼睛 ----------
  HD.onibi = { w: 26, h: 30,
    m: { abcde: '#3A8ACF', fghij: '#9FE4FF' },
    x: () => ({ z: '#10283A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.poly([[6, 18], [7 + d, 4], [11, 12], [13, 1 + d], [16, 11], [19 - d, 5], [20, 18]], 'abcde');
      K.ell(13, 20, 9, 8, 'abcde', { down: 0.1 });
      K.poly([[9, 19], [11, 9 + d], [13, 14], [15, 8 - d], [17, 19]], 'fghij'); K.ell(13, 21, 5.4, 5, 'fghij', { down: 0.05 });
      K.rows(19, 9, ['zz  zz', 'zz  zz']);
      return K.layers();
    } };
  // ---------- 行壁：會走路的石牆，一塊塊石磚（灰縫、裂紋），正面一張兇臉（粗眉、紅眼、一排牙），底下兩隻短腳 ----------
  HD.nurikabe = { w: 60, h: 68, eyes: 'R',
    m: { abcde: '#8A8476', fghij: '#5E584C' },
    x: () => ({ R: '#FF6A4A', z: '#2A2420', w: '#E8E0D0' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.poly([[6, 60 - d], [20, 60 - d], [20, 66 - d], [6, 66 - d]], 'fghij', { rim: 1 }); K.poly([[38, 60 + d - 1], [52, 60 + d - 1], [52, 66], [38, 66]], 'fghij', { rim: 1 });
      K.poly([[3, 4], [56, 2], [57, 58], [2, 60]], 'abcde');
      // 石磚的縫（一排一排錯開）
      for (let y = 12; y < 58; y += 11) K.rows(y, 4, ['g'.repeat(52)]);
      for (let r = 0; r < 6; r++) for (let x = (r % 2 ? 12 : 22); x < 56; x += 20) K.rows(r * 11 + 2, x, Array(10).fill('g'));
      K.rows(6, 8, ['h  ', ' h', '  h']); K.rows(40, 44, ['h', ' h', ' hh', '   h']);
      // 臉（粗眉往中間壓、紅眼、咬緊的一排大牙）
      K.rows(16, 9, ['zzzz                   zzzz', 'zzzzzzzz           zzzzzzzz', '   zzzzzzz       zzzzzzz', '       zzz       zzz']);
      K.rows(21, 13, ['zzzzzzz           zzzzzzz', 'zRRRRwz           zwRRRRz', 'zRRRRRz           zRRRRRz', 'zzzzzzz           zzzzzzz']);
      K.rows(34, 14, ['zzzzzzzzzzzzzzzzzzzzzzzzzzzzz', 'zwwwzwwwzwwwzwwwzwwwzwwwzwwwz', 'zwwwzwwwzwwwzwwwzwwwzwwwzwwwz', 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzz', 'zwwwzwwwzwwwzwwwzwwwzwwwzwwwz', 'zzzzzzzzzzzzzzzzzzzzzzzzzzzzz']);
      return K.layers();
    } };
  // ---------- 喚群燈：會叫同伴的紙燈籠——橘色的燈籠紙一圈圈竹骨、上下深色的木蓋，一張大嘴（紅唇、舌頭），兩顆圓眼 ----------
  HD.chochin = { w: 26, h: 34,
    m: { abcde: '#F2B45A', fghij: '#6A3A1A', pqrst: '#E04A3A' },
    x: () => ({ z: '#2A1A10', w: '#FFF0D8', m: '#8A1A1A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[13, 1], [13, 4]], 2, 2, 'fghij');
      K.ell(13, 17, 10.4, 12.4, 'abcde', { down: 0.25 });
      for (let y = 8; y < 28; y += 3) K.rows(y, 3, ['b'.repeat(20)]);
      K.poly([[6, 3], [20, 3], [21, 6], [5, 6]], 'fghij', { rim: 1 }); K.poly([[6, 28], [20, 28], [21, 31], [5, 31]], 'fghij', { rim: 1 });
      K.rows(12, 7, ['wwz  wwz', 'wzz  wzz']);
      K.ell(13, 21 + d * 0.5, 6, 3.2 + d * 0.6, 'pqrst', { rim: 1 }); K.ell(13, 21.4 + d * 0.5, 4.2, 1.6 + d * 0.6, 'mmmmm', { flat: 0 }); K.rows(22 + d, 12, ['rs']);
      return K.layers();
    } };
  // ---------- 填隙肉芽：小小的肉色怪，大頭大肚子、細手細腳，駝背；凹進去的黃眼睛、裂開的嘴 ----------
  HD.gaki = { w: 26, h: 28, eyes: 'Y',
    m: { abcde: '#B88A8A', fghij: '#8A6060' },
    x: () => ({ Y: '#FFE0A0', z: '#2A1010' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[10, 18], [8 - d, 23], [9 - d, 26]], 2.4, 2, 'fghij'); K.limb([[9, 12], [5, 16], [5, 20 + d]], 2.2, 1.8, 'fghij');
      K.ell(13, 17, 6.4, 6.4, 'abcde', { down: 0.25 });
      K.limb([[15, 21], [16 + d, 24], [15 + d, 26]], 2.6, 2.2, 'abcde', { rim: 1 }); K.limb([[17, 12], [21, 16], [21, 20 - d]], 2.4, 1.8, 'abcde', { rim: 1 });
      K.ell(14, 7, 6.4, 5.6, 'abcde', { rim: 1, bias: 0.04 });
      K.rows(5, 12, ['zz zz', 'zY zY']); K.rows(9, 12, ['zzzzz', ' z z']);
      return K.layers();
    } };
  // ---------- 焰輪：著火的木頭車輪（輪框、輻條、輪軸），一圈火焰往外竄；中間一張兇臉 ----------
  HD.wanyudo = { w: 52, h: 52, eyes: 'Y',
    m: { abcde: '#8A5A32', fghij: '#FF8A2A', klmno: '#FFE07A', pqrst: '#B87A52' },
    x: () => ({ Y: '#FFE04A', z: '#2A140A' }),
    pix(f, K) {
      const C = 26, a0 = f ? 0.2 : 0;
      for (let i = 0; i < 12; i++) { const a = a0 + i * Math.PI / 6, r1 = 18, r2 = 24 + (i % 2) * 2; K.poly([[C + Math.cos(a - 0.2) * r1, C + Math.sin(a - 0.2) * r1], [C + Math.cos(a + 0.12) * r2, C + Math.sin(a + 0.12) * r2], [C + Math.cos(a + 0.3) * r1, C + Math.sin(a + 0.3) * r1]], 'fghij'); }
      for (let i = 0; i < 12; i++) { const a = a0 + i * Math.PI / 6 + 0.05, r1 = 18, r2 = 21.5; K.poly([[C + Math.cos(a - 0.12) * r1, C + Math.sin(a - 0.12) * r1], [C + Math.cos(a) * r2, C + Math.sin(a) * r2], [C + Math.cos(a + 0.14) * r1, C + Math.sin(a + 0.14) * r1]], 'klmno'); }
      K.ell(C, C, 19, 19, 'abcde'); K.ell(C, C, 15, 15, 'abcde', { flat: 0 });
      for (let i = 0; i < 8; i++) { const a = -a0 + i * Math.PI / 4; K.limb([[C, C], [C + Math.cos(a) * 15, C + Math.sin(a) * 15]], 3, 3, 'abcde'); }
      K.ell(C, C, 9, 9.4, 'pqrst', { rim: 1, bias: 0.04 });
      K.rows(22, C - 6, ['zz      zz', ' zzz  zzz', '  zY  Yz']); K.rows(30, C - 4, ['zzzzzzzz', ' zzzzzz']);
      return K.layers();
    } };
  // ---------- 砂幕者：彎著腰的老婆婆，沙色的斗篷兜帽遮住臉（只看得到發光的眼睛），手上提著一袋沙，沙一直漏下來 ----------
  HD.sunakake = { w: 30, h: 32, eyes: 'Y',
    m: { abcde: '#D8B890', fghij: '#A88A5E', klmno: '#8A6A3A' },
    x: () => ({ Y: '#FFE07A', z: '#2A1A10' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.poly([[6, 30], [9, 14], [16, 9], [22, 14], [24, 30]], 'abcde');
      K.ell(15, 10, 7, 6.4, 'abcde', { rim: 1, bias: 0.05 }); K.ell(17, 11, 4.4, 4, 'zzzzz', { flat: 0 }); K.rows(11, 16, ['Y Y']);
      for (let x = 9; x < 24; x += 4) K.rows(18, x, ['c', 'b', 'b', 'c', 'c', 'b']);
      K.limb([[20, 16], [25, 20]], 3.4, 3, 'abcde', { rim: 1 }); K.ell(25, 23, 3.6, 3.8, 'klmno', { rim: 1 });
      [[24, 27 + d], [26, 29 - d], [25, 30 + d]].forEach(([x, y]) => K.px(x, y, 'h'));
      K.rows(29, 7, ['g'.repeat(17)]);
      return K.layers();
    } };
  // ---------- 鉤尾鯊：青灰色的鯊魚，背鰭高、尾巴末端一根倒鉤；白肚子、一排尖牙 ----------
  HD.isonade = { w: 52, h: 22, eyes: 'E',
    m: { abcde: '#3E6A7A', pqrst: '#C8DCE0', klmno: '#2A4A58' },
    x: () => ({ z: '#0A1418', w: '#F0ECE0', E: '#0A1418' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.poly([[8, 11], [1, 3 - d], [4, 10], [1, 18 + d], [8, 13]], 'klmno');   // 尾鰭
      K.limb([[4, 9 - d], [2, 4 - d], [5, 2 - d]], 2, 1.4, 'klmno');   // 倒鉤
      K.limb([[46, 11], [36, 11], [22, 11], [10, 12]], 10, 4, 'abcde');
      for (let y = 0; y < K.H; y++) for (let x = 8; x < 50; x++) { const c = K.g[y][x]; if (c && 'abcde'.includes(c) && y >= 12) K.g[y][x] = y >= 15 ? 'r' : 's'; }
      K.poly([[22, 7], [27, 0.5 + d], [31, 7]], 'abcde', { rim: 1 }); K.poly([[30, 14], [26, 20], [24, 19], [27, 13]], 'klmno', { rim: 1 });
      K.rows(12, 41, ['zzzzzz', 'wzwzw']); K.rows(9, 42, ['EE']);
      [36, 38, 40].forEach(x => K.rows(9, x - 3, ['k', ' k']));
      return K.layers();
    } };
  // ==== A1 完 ====
  // ==== A2 ====
  // ---------- 霜衣：黑長髮、蒼白的臉，白色的和服（陰影偏冰藍），下擺化成冷霧；淡藍色的眼睛 ----------
  HD.yukionna = { w: 28, h: 40, eyes: 'E',
    m: { abcde: '#E8F0F6', fghij: '#1A1A22', pqrst: '#F4F8FA', klmno: '#8AB4DC' },
    x: () => ({ E: '#5FB8FF', z: '#2A2A3A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.poly([[8, 8], [20, 8], [22, 30], [6, 30]], 'fghij');   // 背後的長髮
      K.poly([[9, 13], [19, 13], [23, 35], [5, 35]], 'abcde');   // 和服
      K.rows(14, 13, ['mm', 'mm', ' mm', ' mm']); K.rows(20, 7, ['    nnnnnnnnnn']);   // 衣襟、腰帶
      K.rows(24, 9, ['  b', ' b', 'b']); K.rows(25, 17, ['b', ' b', '  b']);
      [[5, 35], [9, 37], [14, 36], [19, 37], [23, 35]].forEach(([x, y], i) => K.ell(x, y + ((i + d) % 2), 3.4, 2.2, 'klmno', { down: 0 }));   // 下擺的冷霧
      K.limb([[19, 16], [23, 22], [21, 26]], 3, 2.4, 'abcde', { rim: 1 });
      K.ell(14, 8.5, 5.4, 6.4, 'pqrst', { bias: 0.05 });   // 臉
      K.poly([[8, 2], [20, 2], [20, 6], [17, 4], [11, 4], [8, 7]], 'fghij'); K.limb([[9, 4], [8, 14]], 3, 2, 'fghij'); K.limb([[19, 4], [20, 14]], 3, 2, 'fghij');
      K.rows(8, 11, ['zE zE']); K.px(14, 12, 'n');
      return K.layers();
    } };
  // ---------- 群瞳：一顆肉色的大球，表面長滿大大小小的眼睛（白眼球、紅色的瞳孔），有的眼皮半閉 ----------
  HD.hyakume = { w: 56, h: 56,
    m: { abcde: '#B48A82', pqrst: '#F0E8E0' },
    x: () => ({ R: '#C8303A', z: '#2A1214' }),
    pix(f, K) {
      K.ell(28, 28, 25, 25, 'abcde', { down: 0.25 });
      const eyes = [[18, 14, 4], [32, 10, 3.4], [42, 20, 4.4], [12, 28, 3.6], [27, 26, 5.4], [40, 34, 3.8], [20, 40, 4.2], [33, 44, 3.2], [9, 40, 2.8], [46, 44, 2.6], [44, 10, 2.4], [8, 18, 2.4]];
      eyes.forEach(([x, y, r], i) => {
        K.ell(x, y, r + 1, r * 0.8 + 1, 'aaabb', { flat: 1 }); K.ell(x, y, r, r * 0.8, 'pqrst', { down: 0.3 });
        const lid = (i + f) % 5 === 0; const pr = Math.max(1, Math.round(r * 0.45));
        K.ell(x + 0.5, y, pr + 0.6, pr + 0.6, 'RRRRR', { flat: 0 }); K.ell(x + 0.5, y, pr * 0.5, pr * 0.5 + 0.3, 'zzzzz', { flat: 0 });
        if (lid) K.ell(x, y - r * 0.35, r + 0.6, r * 0.55, 'abcde', { rim: 1 });
      });
      return K.layers();
    } };
  // ---------- 根童：白白的小精靈，大大的圓頭、黑洞一樣的眼睛和嘴；頭會往旁邊歪 ----------
  HD.kodama = { w: 26, h: 32,
    m: { abcde: '#E8ECF4' },
    x: () => ({ z: '#141414' }),
    pix(f, K) {
      const t = f ? 1 : 0;
      K.ell(13, 24, 6, 6.4, 'abcde', { down: 0.3 }); K.limb([[9, 27], [8, 30]], 2.4, 2, 'abcde', { rim: 1 }); K.limb([[17, 27], [18, 30]], 2.4, 2, 'abcde', { rim: 1 });
      K.limb([[8, 21], [5, 25]], 2.2, 1.8, 'abcde', { rim: 1 }); K.limb([[18, 21], [21, 25]], 2.2, 1.8, 'abcde', { rim: 1 });
      K.ell(13 + t, 10, 9.4, 8.8, 'abcde', { rim: 1, rot: t ? 10 : -6, bias: 0.04 });
      K.rows(8, 8 + t, ['zz   zz', 'zz   zz']); K.rows(13, 11 + t, [' zz', 'zzzz', ' zz']);
      return K.layers();
    } };
  // ---------- 纏身布：一長條在空中飄的白布，波浪狀、兩頭磨破成鬚鬚；前端兩個黑洞眼睛 ----------
  HD.ittan = { w: 52, h: 22,
    m: { abcde: '#F2F0E8', fghij: '#B8B4A8' },
    x: () => ({ z: '#1A1A1A' }),
    pix(f, K) {
      const ph = f ? 1.4 : 0, pts = []; for (let i = 0; i <= 10; i++) { const x = 4 + i * 4.4; pts.push([x, 11 + Math.sin(i * 0.8 + ph) * 4]); }
      K.limb(pts, 7, 5, 'abcde');
      for (let i = 1; i < 10; i += 2) { const [x, y] = pts[i]; K.px(x, y + 2, 'g'); K.px(x + 1, y + 2, 'g'); }
      [[-2, 0], [-3, 2], [-2, -2]].forEach(([dx, dy]) => K.limb([[pts[0][0], pts[0][1] + dy], [pts[0][0] + dx - 2, pts[0][1] + dy * 2]], 1.4, 1, 'fghij'));
      const [hx, hy] = pts[10]; K.rows(Math.round(hy) - 1, Math.round(hx) - 3, ['zz zz']);
      return K.layers();
    } };
  // ---------- 盤頂蛙：綠色的蛙人——背著褐色的硬殼、頭頂一個裝水的盤子（一圈頭髮）、黃色的鳥喙；手腳有蹼 ----------
  HD.kappa = { w: 32, h: 40, eyes: 'E',
    m: { abcde: '#5A8A5A', klmno: '#7A5A3A', pqrst: '#BFE0F0', fghij: '#E8C04A', uvwxy: '#2E4E2E' },
    x: () => ({ E: '#F0D84A', z: '#102010' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[12, 30], [10 - d, 35], [11 - d, 38]], 4, 3, 'uvwxy'); K.rows(38, 8 - d, ['wxw']);
      K.ell(10, 22, 7, 9, 'klmno', { down: 0.3 }); for (let y = 16; y < 30; y += 3) K.rows(y, 5, ['l    l', ' lmml']);   // 背殼
      K.ell(16, 23, 7.4, 8.4, 'abcde', { down: 0.25 }); K.ell(18, 25, 4, 5.4, 'fghij', { flat: 3 });   // 身體、肚子
      K.limb([[19, 31], [21 + d, 35], [20 + d, 38]], 4.4, 3.4, 'abcde', { rim: 1 }); K.rows(38, 18 + d, ['cbcb']);
      K.limb([[21, 19], [26, 24], [27, 28]], 3.6, 2.8, 'abcde', { rim: 1 }); K.rows(28, 25, ['cbc']);
      K.ell(17, 10, 7.4, 6.6, 'abcde', { rim: 1, bias: 0.04 });   // 頭
      K.limb([[22, 11], [27, 12]], 3.6, 2.4, 'fghij', { rim: 1 });   // 喙
      K.rows(3, 11, ['uvvvvvvvvu']); K.ell(17, 3.6, 5.4, 1.8, 'pqrst', { rim: 1 });   // 頭髮、盤子
      K.rows(8, 18, ['zE']);
      return K.layers();
    } };
  // ---------- 鑽口蛇：粗粗短短、像一截木頭的褐色大蛇，身上一圈圈的紋，淺色的肚子；前端一張圓圓的大嘴（一圈尖牙）、小眼睛 ----------
  HD.nozuchi = { w: 48, h: 24, eyes: 'E',
    m: { abcde: '#8A7450', pqrst: '#C8B488', klmno: '#5A4A32' },
    x: () => ({ E: '#E8C04A', z: '#2A1408', M: '#7A2A1A', w: '#E8E0D0' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[4, 14 - d], [14, 12 + d], [28, 12 - d], [40, 12]], 9, 15, 'abcde');
      for (let y = 0; y < K.H; y++) for (let x = 2; x < 44; x++) { const c = K.g[y][x]; if (c && 'abcde'.includes(c) && y >= 15) K.g[y][x] = 's'; }
      for (let x = 8; x < 38; x += 5) K.rows(6, x, ['l', 'l', ' l', ' l', ' l', 'l']);
      K.ell(41, 12, 4.4, 7, 'abcde', { rim: 1 }); K.ell(43, 12, 2.6, 5, 'MMMMM', { flat: 0 }); K.ell(44, 12, 1.4, 3, 'zzzzz', { flat: 0 });
      [[42, 7], [44, 8], [45, 11], [45, 14], [44, 16], [42, 17]].forEach(([x, y]) => K.px(x, y, 'w'));
      K.rows(7, 36, ['zE']);
      return K.layers();
    } };
  // ---------- 影撲貓：壓低身子、準備撲上來的黑貓；尾巴尖端分岔成兩條，綠色發光的眼睛、粉紅的鼻子 ----------
  HD.bakeneko = { w: 40, h: 26, eyes: 'E',
    m: { abcde: '#3A3440', fghij: '#221E26' },
    x: () => ({ E: '#9AFF6A', z: '#0E0C10', n: '#E87A9A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[7, 14], [3, 8], [5, 3 - d]], 3.4, 2, 'fghij'); K.limb([[7, 14], [2, 10], [1, 5 + d]], 3, 1.8, 'abcde');   // 兩條尾巴
      K.limb([[12, 19], [10 - d, 24]], 3, 2.6, 'fghij'); K.limb([[26, 19], [28 + d, 24]], 3, 2.6, 'fghij');
      K.limb([[8, 15], [18, 16], [27, 15]], 9, 8, 'abcde');
      K.limb([[14, 19], [12 + d, 24]], 3.4, 2.8, 'abcde', { rim: 1 }); K.limb([[28, 18], [31 - d, 24]], 3.4, 2.8, 'abcde', { rim: 1 });
      K.ell(32, 13, 6.4, 5.6, 'abcde', { rim: 1, bias: 0.04 });
      K.poly([[27, 10], [28, 3], [31, 8]], 'abcde'); K.poly([[33, 8], [36, 3], [37, 10]], 'abcde');
      K.rows(11, 30, ['EE EE', 'zE zE']); K.px(36, 14, 'n'); K.rows(15, 34, ['z z']);
      return K.layers();
    } };
  // ---------- 守墓骨兵：戴著暗色頭盔的骷髏武士，一手舉刀、一手拿圓木盾；頭盔前面一片金色的前立 ----------
  HD.honemusha = { w: 44, h: 56,
    m: { abcde: '#E8E0D0', fghij: '#3A3440', klmno: '#8A5A2E', pqrst: '#C8CCD4', uvwxy: '#D8A830' },
    x: () => ({ R: '#FF5A3A', z: '#141014' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[18, 38], [16 - d, 46], [17 - d, 53]], 3.4, 3, 'abcde'); K.limb([[24, 38], [26 + d, 46], [25 + d, 53]], 3.4, 3, 'abcde', { rim: 1 });
      K.poly([[15, 32], [27, 32], [28, 39], [14, 39]], 'fghij', { rim: 1 });   // 腰甲
      K.limb([[21, 20], [21, 34]], 3, 3, 'abcde');   // 脊椎
      for (let y = 22; y < 31; y += 2.6) K.limb([[16, y], [21, y - 1], [26, y]], 1.8, 1.8, 'abcde');
      K.limb([[16, 20], [10, 27], [8, 32]], 2.8, 2.4, 'abcde');   // 拿盾的手
      K.ell(8, 31, 7, 8, 'klmno', { rim: 1 }); K.ell(8, 31, 2, 2, 'uvwxy', { flat: 3 });
      K.limb([[26, 20], [32, 14 - d], [33, 10 - d]], 2.8, 2.4, 'abcde', { rim: 1 });   // 舉刀的手
      K.poly([[32, 11 - d], [34, 9 - d], [41, 1], [40, 1]], 'pqrst', { rim: 1 }); K.limb([[31, 12 - d], [36, 8 - d]], 2, 2, 'klmno');
      K.ell(21, 13, 6, 6.4, 'abcde', { bias: 0.04 });   // 頭骨
      K.rows(12, 18, ['zz zz', 'zR zR']); K.rows(16, 19, ['zazaz']);
      K.poly([[13, 9], [21, 3], [29, 9], [30, 12], [12, 12]], 'fghij', { rim: 1 }); K.poly([[18, 4], [21, 1], [24, 4]], 'uvwxy');   // 頭盔、前立
      return K.layers();
    } };
  // ==== A2 完 ====
  // ==== B1 ====
  // ---------- 三羽鴉：烏鴉頭的人形——黑羽毛的頭、黃色的鳥喙，白衣紅領，背後一對黑翅膀、一束黑尾羽 ----------
  HD.karasu = { w: 48, h: 44, eyes: 'E',
    m: { abcde: '#2E2A3A', pqrst: '#ECE8E0', klmno: '#C8302A', fghij: '#E8B83A' },
    x: () => ({ E: '#FFD84A', z: '#0E0C12' }),
    pix(f, K) {
      const d = f ? 2 : 0;
      K.poly([[18, 16], [3, 4 + d], [5, 14 + d], [2, 22 + d], [10, 22], [18, 26]], 'abcde', { rim: 1 });   // 翅膀
      for (let i = 0; i < 4; i++) K.rows(10 + i * 3 + d, 5 + i, ['bb']);
      K.poly([[16, 30], [8, 40], [12, 40], [18, 34]], 'abcde');   // 尾羽
      K.limb([[21, 34], [20, 41]], 3, 2.4, 'fghij'); K.limb([[27, 34], [28, 41]], 3, 2.4, 'fghij', { rim: 1 });
      K.poly([[17, 18], [31, 18], [33, 35], [15, 35]], 'pqrst');   // 白衣
      K.rows(18, 20, ['nnnnnnnn', ' nnnnnn', '  nnnn']); K.rows(26, 16, ['s'.repeat(17)]);
      K.limb([[30, 20], [35, 26], [34, 30]], 3.6, 3, 'pqrst', { rim: 1 });
      K.ell(25, 11, 6.4, 6.4, 'abcde', { rim: 1, bias: 0.05 });   // 頭（後面一撮翹起來的羽冠）
      K.poly([[19, 8], [14, 2], [20, 5], [18, 0.5], [23, 5]], 'abcde');
      K.poly([[29, 9], [41, 13], [29, 14]], 'fghij', { rim: 1 }); K.rows(13, 30, ['ggggggggg']);   // 尖尖的長鳥喙
      K.rows(9, 26, ['zzz', 'zE']);
      return K.layers();
    } };
  // ---------- 蛛身牛：蜘蛛的身體（暗紫、毛茸茸）、牛的頭——一對往上彎的白牛角、紅眼睛、鼻環一樣的鼻孔；八隻腳 ----------
  HD.ushioni = { w: 80, h: 56, eyes: 'R',
    m: { abcde: '#3E3448', fghij: '#2A2232', klmno: '#E8E0D0' },
    x: () => ({ R: '#FF3A3A', z: '#100A14' }),
    pix(f, K) {
      const s = f ? 1 : -1;
      [[[52, 30], [66, 14], [72, 20], [76, 52]], [[46, 32], [56, 14], [60, 22], [62, 53]], [[34, 32], [24, 14], [18, 20], [12, 53]], [[30, 30], [14, 10], [6, 18], [2, 52]]].forEach((p, i) => { if (f) p[3][1] -= i % 2 ? 1 : 0; K.limb(p, 3.6, 2, 'fghij'); });
      K.ell(30, 30, 20, 14, 'abcde', { down: 0.3 });
      for (let i = 0; i < 18; i++) K.px(14 + (i * 7) % 32, 20 + (i * 5) % 18, 'c');   // 毛
      [[[50, 32], [62, 18], [68, 24], [72, 53]], [[44, 34], [52, 18], [56, 26], [56, 53]], [[36, 34], [28, 18], [22, 26], [20, 53]], [[30, 32], [18, 14], [10, 22], [6, 53]]].forEach((p, i) => { if (f) p[1][0] += i < 2 ? s : -s; K.limb(p, 4.4, 2.4, 'abcde', { rim: 1 }); });
      K.ell(58, 26, 11, 9, 'abcde', { rim: 1, bias: 0.04 });   // 牛頭
      K.limb([[54, 19], [50, 10], [53, 4]], 3.4, 1.6, 'klmno'); K.limb([[63, 19], [68, 10], [65, 4]], 3.4, 1.6, 'klmno', { rim: 1 });
      K.ell(64, 30, 6, 4.4, 'abcde', { rim: 1 }); K.rows(30, 64, ['z z']); K.rows(24, 56, ['zR  zR']);
      return K.layers();
    } };
  // ---------- 無面影：黑長髮、暗色和服紅腰帶，臉是一片光滑的白（什麼都沒有） ----------
  HD.nopperabo = { w: 28, h: 44,
    m: { abcde: '#3A3248', fghij: '#141018', pqrst: '#F2EEE6', klmno: '#C8303A' },
    x: () => ({}),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.poly([[7, 8], [21, 8], [22, 26], [6, 26]], 'fghij');
      K.poly([[8, 16], [20, 16], [22, 42], [6, 42]], 'abcde');
      K.rows(26, 7, ['nnnnnnnnnnnnnn', 'mmmmmmmmmmmmmm']); K.rows(17, 13, ['ss', ' ss', '  s']);
      K.limb([[19, 19], [22, 26], [21 + d, 31]], 3.4, 3, 'abcde', { rim: 1 }); K.ell(21 + d, 32, 1.6, 1.6, 'pqrst');
      K.ell(14, 9, 5.6, 7, 'pqrst', { bias: 0.06 });
      K.poly([[8, 2], [20, 2], [21, 8], [18, 5], [10, 5], [8, 10]], 'fghij'); K.limb([[9, 6], [8, 20]], 3, 2.4, 'fghij'); K.limb([[19, 6], [20, 20]], 3, 2.4, 'fghij');
      return K.layers();
    } };
  // ---------- 伸頸：穿暗色和服的女人，脖子長長地往上伸、彎來彎去，頭在最上面（黑髮、白臉、細細的眼睛） ----------
  HD.rokuro = { w: 32, h: 46,
    m: { abcde: '#4A3048', fghij: '#141018', pqrst: '#F2E8E0', klmno: '#C8A04A' },
    x: () => ({ z: '#2A1418', R: '#C8303A' }),
    pix(f, K) {
      const d = f ? 2 : 0;
      K.poly([[6, 30], [18, 30], [20, 44], [4, 44]], 'abcde'); K.rows(36, 5, ['nnnnnnnnnnnnnn']);
      K.ell(12, 30, 5, 3, 'abcde');
      K.limb([[12, 29], [14, 22], [10 + d, 16], [15 + d, 10], [20, 7]], 3, 2.6, 'pqrst');
      K.ell(22, 7, 5, 5.4, 'pqrst', { rim: 1, bias: 0.05 });
      K.poly([[17, 1], [27, 1], [28, 6], [25, 3], [19, 3], [17, 8]], 'fghij'); K.limb([[18, 3], [15, 10]], 3, 2, 'fghij');
      K.rows(7, 21, ['zz zz']); K.rows(10, 22, ['RR']);
      return K.layers();
    } };
  // ---------- 鼓腹狸：圓滾滾的狸，大肚子（淺色、會拍打）、黑眼圈、蓬蓬的條紋尾巴 ----------
  HD.tanuki = { w: 32, h: 30, eyes: 'E',
    m: { abcde: '#8A6A44', pqrst: '#E0C8A0', fghij: '#3A2A1C' },
    x: () => ({ E: '#F0E0A0', z: '#140C08' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[8, 20], [3, 16], [3, 10]], 7, 5, 'abcde'); K.rows(13, 1, ['ggg', '', 'ggg']);   // 尾巴
      K.ell(16, 19, 9, 9, 'abcde', { down: 0.25 }); K.ell(18, 21, 6, 6.4 - d * 0.4, 'pqrst', { down: 0.3 });   // 身體、肚子
      K.limb([[12, 26], [11, 29]], 3.6, 3, 'fghij'); K.limb([[21, 26], [22, 29]], 3.6, 3, 'fghij');
      K.limb([[23, 15], [26, 19 - d * 2]], 3, 2.6, 'abcde', { rim: 1 });
      K.ell(18, 8, 7, 6, 'abcde', { rim: 1, bias: 0.04 }); K.ell(14, 3, 2.2, 2.2, 'abcde'); K.ell(22, 3, 2.2, 2.2, 'abcde');
      K.rows(7, 13, ['ggg  ggg', 'gEz  gEz']); K.ell(19.5, 11, 2.6, 1.8, 'pqrst'); K.px(19, 10, 'z');
      return K.layers();
    } };
  // ---------- 幻尾狐：奶油白的狐狸，好幾條淡紫色的尾巴像扇子一樣張開；細長的眼睛、尖耳朵 ----------
  HD.kitsune = { w: 36, h: 26, eyes: 'E',
    m: { abcde: '#F0E4CC', klmno: '#B8A0E0', fghij: '#C8B490' },
    x: () => ({ E: '#C83A6A', z: '#2A1A14' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      [[140, 10], [165, 11], [190, 11], [215, 10]].forEach(([a, l], i) => { const r = (a + (f ? 6 : 0)) * Math.PI / 180; K.limb([[9, 14], [9 + Math.cos(r) * l * 0.5, 14 + Math.sin(r) * l * 0.5], [9 + Math.cos(r) * l, 14 + Math.sin(r) * l]], 4.4, 2, 'klmno', { rim: i ? 1 : 0 }); });
      K.limb([[13, 19], [12 - d, 24]], 2.4, 2, 'fghij'); K.limb([[24, 19], [26 + d, 24]], 2.4, 2, 'fghij');
      K.limb([[9, 15], [18, 16], [26, 14]], 7, 6.4, 'abcde');
      K.limb([[15, 19], [14 + d, 24]], 2.6, 2.2, 'abcde', { rim: 1 }); K.limb([[25, 18], [28 - d, 24]], 2.6, 2.2, 'abcde', { rim: 1 });
      K.ell(29, 10, 5, 4.4, 'abcde', { rim: 1, bias: 0.04 }); K.limb([[31, 11], [35, 12]], 3, 1.6, 'abcde');
      K.poly([[25, 7], [26, 1], [29, 6]], 'abcde'); K.poly([[29, 6], [32, 1], [33, 8]], 'abcde');
      K.rows(9, 29, ['zE']); K.px(35, 12, 'z');
      return K.layers();
    } };
  // ---------- 嵐翼：紅臉長鼻的山中怪人，背上一對大黑翅膀，白衣、手上一把羽扇；腳踩高齒木屐 ----------
  HD.tengu = { w: 36, h: 38, eyes: 'E',
    m: { abcde: '#ECE6DA', fghij: '#2A2A34', pqrst: '#C8302A', klmno: '#8A6A3A' },
    x: () => ({ E: '#FFD84A', z: '#140A0A' }),
    pix(f, K) {
      const d = f ? 2 : 0;
      K.poly([[16, 14], [2, 4 + d], [4, 14 + d], [1, 24 + d], [12, 22]], 'fghij', { rim: 1 }); K.poly([[20, 14], [34, 4 + d], [32, 14 + d], [35, 24 + d], [24, 22]], 'fghij', { rim: 1 });
      K.poly([[12, 16], [24, 16], [26, 32], [10, 32]], 'abcde'); K.rows(22, 11, ['ffffffffffffff']);
      K.rows(33, 12, ['ll  ll', 'l   l ', 'l   l']);
      K.limb([[23, 18], [28, 22], [29, 18]], 3, 2.6, 'abcde', { rim: 1 }); K.poly([[28, 18], [33, 10], [34, 14], [30, 19]], 'klmno', { rim: 1 });
      K.ell(18, 10, 5.4, 5.6, 'pqrst', { rim: 1, bias: 0.05 }); K.limb([[21, 10], [27, 13]], 2.6, 1.4, 'pqrst', { rim: 1 });
      K.poly([[12, 6], [24, 6], [22, 3], [14, 3]], 'fghij'); K.rows(9, 16, ['zE']); K.rows(6, 15, ['eee']);
      return K.layers();
    } };
  // ---------- 夜鳴獸：猴子的臉、老虎的身體（橘黃色、黑條紋）、蛇的尾巴（綠色、末端是蛇頭） ----------
  HD.nue = { w: 56, h: 36, eyes: 'E',
    m: { abcde: '#D8A040', klmno: '#8A5A3A', pqrst: '#4E8A4A', fghij: '#E8C8A0' },
    x: () => ({ E: '#FFE04A', z: '#1A100A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[10, 18], [4, 14], [6, 6 - d], [12, 4 - d]], 5, 3.4, 'pqrst'); K.ell(14, 4 - d, 3.4, 2.4, 'pqrst', { rim: 1 }); K.px(15, 3 - d, 'z');   // 蛇尾
      K.limb([[16, 26], [14 - d, 33]], 4, 3, 'klmno'); K.limb([[36, 26], [38 + d, 33]], 4, 3, 'klmno');
      K.limb([[11, 19], [24, 20], [38, 18]], 13, 12, 'abcde');
      for (let x = 14; x < 38; x += 5) K.rows(13, x, ['z', 'z', ' z', ' z', 'z']);   // 虎紋
      K.limb([[18, 26], [17 + d, 33]], 4.4, 3.4, 'abcde', { rim: 1 }); K.limb([[38, 25], [41 - d, 33]], 4.4, 3.4, 'abcde', { rim: 1 });
      K.ell(44, 14, 7.4, 7, 'klmno', { rim: 1, bias: 0.04 }); K.ell(46, 16, 4.6, 4, 'fghij', { down: 0.2 });   // 猴臉
      K.rows(13, 43, ['zE zE']); K.rows(18, 45, ['zzz']);
      return K.layers();
    } };
  // ==== B1 完 ====
  // ==== B2 ====
  // ---------- 獨目童：光頭的小孩，臉中間一隻大眼睛，藍色的短和服 ----------
  HD.hitotsume = { w: 26, h: 32, eyes: 'E',
    m: { abcde: '#E8D4C4', pqrst: '#4A6A9A', fghij: '#2A3A5A' },
    x: () => ({ E: '#3A2A1A', W: '#FFFFFF', z: '#1A1010' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[10, 24], [9, 30]], 3, 2.6, 'abcde'); K.limb([[16, 24], [17, 30 - d]], 3, 2.6, 'abcde', { rim: 1 });
      K.poly([[7, 14], [19, 14], [20, 26], [6, 26]], 'pqrst'); K.rows(20, 6, ['fffffffffffffff']);
      K.limb([[18, 16], [21, 21]], 2.6, 2.4, 'pqrst', { rim: 1 });
      K.ell(13, 8, 7, 6.6, 'abcde', { rim: 1, bias: 0.16, down: 0.1 });
      K.rows(6, 10, [' zzzz', 'zWEEWz', 'zWEEWz', ' zzzz']); K.rows(12, 12, ['zz']);
      return K.layers();
    } };
  // ---------- 纏煙：一團灰色的煙，邊緣一縷縷往後飄，裡面兩顆黃眼睛 ----------
  HD.enenra = { w: 36, h: 26, eyes: 'Y',
    m: { abcde: '#8A8E9A', fghij: '#5E626E' },
    x: () => ({ Y: '#FFD84A', z: '#22242A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[14, 14], [6, 10 - d], [2, 12 - d]], 7, 2, 'fghij'); K.limb([[14, 17], [5, 20 + d], [1, 18 + d]], 6, 2, 'fghij');
      K.ell(16, 16, 9, 7, 'abcde', { down: 0.2 }); K.ell(24, 13, 9, 8, 'abcde', { rim: 1, down: 0.2 }); K.ell(10, 13, 6, 5, 'abcde', { rim: 1 });
      K.ell(28, 18, 6, 4.6, 'abcde', { rim: 1 });
      K.rows(12, 24, ['zz zz', 'zY zY']);
      return K.layers();
    } };
  // ---------- 面果樹：小一點的樹，樹冠裡結著一顆顆人臉一樣的果子；粗樹幹 ----------
  HD.jinmenju = { w: 44, h: 52,
    m: { abcde: '#4E7A3A', klmno: '#6A4A2E', pqrst: '#E8D0A0' },
    x: () => ({ z: '#1A0E0A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[22, 50], [21, 36], [22, 28]], 9, 6, 'klmno'); K.limb([[18, 49], [12, 50]], 3, 2, 'klmno'); K.limb([[26, 49], [32, 50]], 3, 2, 'klmno');
      K.ell(22, 18, 19, 14, 'abcde', { down: 0.3 });
      [[10, 20, 8, 7], [34, 20, 8, 7], [16, 8, 9, 7], [30, 8, 9, 7]].forEach(([x, y, rx, ry]) => K.ell(x, y, rx, ry, 'abcde', { rim: 1, down: 0.25 }));
      [[12, 18], [24, 12], [32, 22], [20, 26]].forEach(([x, y], i) => { K.ell(x, y + (i % 2 ? d : 0), 3.4, 3.6, 'pqrst', { rim: 1 }); K.rows(y - 1 + (i % 2 ? d : 0), x - 2, ['z z', ' z ']); });
      return K.layers();
    } };
  // ---------- 紫電鼬：紫色的鼬，身上竄著黃色的電光，尾巴尖是一道閃電 ----------
  HD.raiju = { w: 36, h: 22, eyes: 'E',
    m: { abcde: '#6A4ACF', fghij: '#3E2A8A' },
    x: () => ({ E: '#FFE04A', Y: '#FFE04A', y: '#E8A82A', z: '#140A2A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[8, 12], [3, 8], [2, 3 - d]], 3.4, 2, 'abcde'); K.rows(1 - d + 1, 0, [' Y', 'Yy', ' Y']);
      K.limb([[11, 16], [9 - d, 21]], 2.2, 1.8, 'fghij'); K.limb([[22, 16], [24 + d, 21]], 2.2, 1.8, 'fghij');
      K.limb([[8, 12], [16, 13], [25, 11]], 7, 6.4, 'abcde');
      K.limb([[13, 16], [11 + d, 21]], 2.4, 2, 'abcde', { rim: 1 }); K.limb([[23, 15], [26 - d, 21]], 2.4, 2, 'abcde', { rim: 1 });
      K.ell(28, 8, 4.6, 4, 'abcde', { rim: 1, bias: 0.04 }); K.limb([[30, 9], [34, 10]], 3, 1.6, 'abcde');
      K.poly([[25, 5], [26, 1], [28, 4]], 'abcde'); K.rows(7, 28, ['zE']); K.px(34, 10, 'z');
      K.rows(8 + d, 12, ['Y', 'yY', ' Y']); K.rows(9 - d, 19, ['Y', 'Yy', ' Y']);
      return K.layers();
    } };
  // ---------- 鐵齒鼠：灰色的大老鼠，門牙是鐵灰色的（又長又亮），細長的尾巴 ----------
  HD.tesso = { w: 26, h: 16, eyes: 'E',
    m: { abcde: '#8A8A92', fghij: '#C8A0A0', klmno: '#B0B8C4' },
    x: () => ({ E: '#C8303A', z: '#141418' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[6, 10], [2, 12], [1, 8 - d]], 1.6, 1, 'fghij');
      K.limb([[8, 13], [7 - d, 15]], 2, 1.6, 'abcde'); K.limb([[15, 13], [16 + d, 15]], 2, 1.6, 'abcde', { rim: 1 });
      K.ell(12, 10, 7, 4.4, 'abcde', { down: 0.25 });
      K.ell(19, 8, 4.2, 3.4, 'abcde', { rim: 1, bias: 0.04 }); K.limb([[21, 9], [24, 10]], 2.4, 1.4, 'abcde');
      K.ell(16, 4.6, 2, 2, 'fghij', { rim: 1 }); K.rows(7, 20, ['zE']); K.px(24, 10, 'z'); K.rows(11, 22, ['nn', 'nn']);
      return K.layers();
    } };
  // ---------- 高仰影：細細高高、像圓錐一樣往上收的黑影，頂上一顆小頭、兩顆金色的眼睛；越往上看越高 ----------
  HD.mikoshi = { w: 28, h: 56, eyes: 'Y',
    m: { abcde: '#2E2A3A', fghij: '#1A1822' },
    x: () => ({ Y: '#FFD84A', z: '#0A080E' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.poly([[13, 8], [15, 8], [25, 54], [3, 54]], 'abcde');
      for (let y = 16; y < 54; y += 6) K.rows(y, 14 - Math.floor((y - 8) * 0.22), ['f'.repeat(Math.floor((y - 8) * 0.44) + 1)]);
      K.ell(14, 6 - d, 4, 4.4, 'abcde', { rim: 1, bias: 0.05 }); K.rows(5 - d, 12, ['Y Y']);
      return K.layers();
    } };
  // ---------- 吞夢獸：黑白兩色的貘——前半身和腳是黑的、中間一圈白，長長的鼻子往下垂；小眼睛 ----------
  HD.baku = { w: 44, h: 30, eyes: 'E',
    m: { abcde: '#2A2A30', pqrst: '#ECEAE4' },
    x: () => ({ E: '#C8A0FF', z: '#0A0A0E' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[12, 22], [11 - d, 28]], 4.4, 4, 'abcde'); K.limb([[30, 22], [32 + d, 28]], 4.4, 4, 'abcde');
      K.ell(22, 16, 16, 9, 'abcde', { down: 0.25 });
      for (let y = 0; y < K.H; y++) for (let x = 12; x < 28; x++) { const c = K.g[y][x], i = c ? 'abcde'.indexOf(c) : -1; if (i >= 0) K.g[y][x] = 'pqrst'[i]; }
      K.limb([[14, 22], [13 + d, 28]], 4.6, 4.2, 'abcde', { rim: 1 }); K.limb([[32, 22], [34 - d, 28]], 4.6, 4.2, 'abcde', { rim: 1 });
      K.ell(37, 13, 6, 5.4, 'abcde', { rim: 1, bias: 0.04 }); K.limb([[41, 15], [43, 18], [43, 20 - d]], 3.4, 2.4, 'abcde', { rim: 1 });
      K.ell(34, 8, 2, 2, 'abcde'); K.rows(12, 37, ['E']);
      return K.layers();
    } };
  // ---------- 杓靈：淡藍色的幽靈，下半身是飄的尾巴，手上拿著一支長柄的杓子（舀水） ----------
  HD.funa = { w: 28, h: 34, eyes: 'E',
    m: { abcde: '#B8D8F0', klmno: '#8A6A42' },
    x: () => ({ E: '#1A3A5A', z: '#1A3A5A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[11, 18], [10 + d, 26], [13 - d, 31], [9, 33]], 10, 2, 'abcde');
      K.ell(12, 13, 7.4, 8, 'abcde', { down: 0.2, bias: 0.04 });
      K.limb([[16, 16], [20, 17]], 3, 2.6, 'abcde', { rim: 1 });
      K.limb([[19, 22], [23, 8]], 1.6, 1.6, 'klmno'); K.ell(24, 6, 3.4, 2.4, 'klmno', { rim: 1 }); K.ell(24, 5.6, 2.2, 1.2, 'kkkkk', { flat: 0 });
      K.rows(11, 9, ['E  E', 'E  E']); K.rows(15, 10, [' zz']);
      return K.layers();
    } };
  // ==== B2 完 ====
  // ==== C1 ====
  // ---------- 懸首：飄在空中的大頭——一大蓬亂糟糟的黑髮、蒼白的臉、紅眼睛、一條緊閉的嘴 ----------
  HD.okubi = { w: 48, h: 44, eyes: 'R',
    m: { abcde: '#2A2230', pqrst: '#ECE6E2' },
    x: () => ({ R: '#C8303A', z: '#2A1418' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      [[10, 16, 9], [36, 14, 9], [16, 8, 9], [30, 7, 9], [8, 28, 7], [40, 27, 7], [23, 5, 8]].forEach(([x, y, r]) => K.ell(x, y + d, r, r * 0.9, 'abcde', { rim: 1, down: 0.25 }));
      K.ell(24, 24 + d, 13, 14, 'pqrst', { down: 0.12, bias: 0.16 });
      K.ell(24, 11 + d, 14, 6, 'abcde', { down: 0.3 }); K.limb([[12, 14 + d], [11, 26 + d]], 4, 2, 'abcde'); K.limb([[36, 14 + d], [37, 26 + d]], 4, 2, 'abcde');
      K.rows(21 + d, 16, ['zzzz    zzzz', 'zRRz    zRRz', ' zz      zz']); K.rows(31 + d, 19, ['zzzzzzzzzz']); K.rows(26 + d, 23, ['s', 'ss']);
      return K.layers();
    } };
  // ---------- 苔團：一團綠苔，表面毛毛的（亮點、暗點）、兩顆小眼睛，偶爾冒一根小芽 ----------
  HD.mossball = { w: 28, h: 24, eyes: 'E',
    m: { abcde: '#4E8A3E', klmno: '#7AB84A' },
    x: () => ({ E: '#F0F0A0', z: '#142010' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.ell(14, 14 + d * 0.5, 11, 9 - d * 0.5, 'abcde', { down: 0.3 });
      for (let i = 0; i < 22; i++) { const x = 5 + (i * 7) % 18, y = 7 + (i * 5) % 13; K.px(x, y, i % 3 ? 'd' : 'b'); }
      K.limb([[16, 6], [17, 2], [19, 1]], 1.4, 1, 'klmno'); K.ell(19.5, 1.8, 1.4, 1, 'klmno');
      K.rows(12, 9, ['zz  zz', 'zE  zE']);
      return K.layers();
    } };
  // ---------- 燈蛾：奶油色的大翅膀（有眼紋），肚子是一盞發黃光的小燈籠，羽毛一樣的觸角 ----------
  HD.lampmoth = { w: 32, h: 28,
    m: { abcde: '#E0D4B4', klmno: '#8A7A5A', fghij: '#FFD84A' },
    x: () => ({ z: '#2A2014' }),
    pix(f, K) {
      const d = f ? 2 : 0;
      K.ell(8, 10 + d, 7, 6 - d * 0.6, 'abcde', { rot: -20, rim: 1 }); K.ell(24, 10 + d, 7, 6 - d * 0.6, 'abcde', { rot: 20, rim: 1 });
      K.ell(9, 18, 5, 4, 'abcde', { rot: 20, rim: 1 }); K.ell(23, 18, 5, 4, 'abcde', { rot: -20, rim: 1 });
      [[7, 10], [25, 10]].forEach(([x, y]) => K.rows(y - 1 + d, x - 1, [' l', 'lzl', ' l']));
      K.limb([[16, 8], [16, 16]], 4, 3, 'klmno'); K.ell(16, 20, 3.4, 4.4, 'fghij', { down: 0.1, bias: 0.15 }); K.rows(17, 14, ['lllll']);
      K.limb([[15, 7], [11, 2], [9, 2]], 1.2, 1, 'klmno'); K.limb([[17, 7], [21, 2], [23, 2]], 1.2, 1, 'klmno');
      return K.layers();
    } };
  // ---------- 石蝸：背著灰色石頭殼的蝸牛（殼上一圈圈的螺紋），淺褐色的身體、兩根眼柄 ----------
  HD.stonesnail = { w: 34, h: 24, eyes: 'E',
    m: { abcde: '#8E8A84', pqrst: '#C8B494' },
    x: () => ({ E: '#2A1A10', z: '#3A3430' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[4, 20], [18, 20], [27 + d, 19]], 5, 6, 'pqrst'); K.limb([[27 + d, 17], [29 + d, 10]], 1.6, 1.2, 'pqrst'); K.limb([[29 + d, 17], [32 + d, 11]], 1.6, 1.2, 'pqrst');
      K.rows(9, 28 + d, ['E  ', '   E']);
      K.ell(15, 12, 10, 9, 'abcde', { down: 0.25 });
      K.rows(6, 11, ['  zzzz', ' z    z', 'z  zz  z', 'z z  z z', 'z  z  z', ' z   z', '  zzz']);
      return K.layers();
    } };
  // ---------- 晶刺蝟：棕灰色的刺蝟，背上一根根藍色的水晶刺（亮面朝左上） ----------
  HD.crysthog = { w: 30, h: 22, eyes: 'E',
    m: { abcde: '#6A5E58', pqrst: '#5AB8F0', fghij: '#C8B8A8' },
    x: () => ({ E: '#14100E', z: '#14100E' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.ell(14, 15, 11, 6, 'abcde', { down: 0.3 });
      for (let i = 0; i < 7; i++) { const x = 6 + i * 2.6, h = 6 + Math.sin(i / 6 * Math.PI) * 3; K.poly([[x - 1.6, 14], [x - 1.2 - (i < 4 ? 1 : -1), 14 - h - (i === 3 ? d : 0)], [x + 1.6, 14]], 'pqrst'); }
      K.ell(24, 16, 4.4, 3.6, 'fghij', { rim: 1 }); K.px(28, 16, 'z'); K.rows(15, 24, ['E']);
      K.limb([[9, 20], [8, 21]], 2, 2, 'abcde'); K.limb([[19, 20], [20, 21]], 2, 2, 'abcde');
      return K.layers();
    } };
  // ---------- 影蜥：貼著地面爬的黑紫色蜥蜴，背上一排淡紫色的斑點，眼睛發紫光 ----------
  HD.shadelizard = { w: 38, h: 18, eyes: 'E',
    m: { abcde: '#3A2A4A', klmno: '#8A6AB8' },
    x: () => ({ E: '#C88AFF', z: '#0E0814' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[10, 11], [4, 12], [1, 9 - d]], 4, 1.4, 'abcde');
      K.limb([[12, 13], [9 - d, 16]], 2, 1.6, 'abcde'); K.limb([[25, 13], [28 + d, 16]], 2, 1.6, 'abcde');
      K.ell(19, 10, 10, 4, 'abcde', { down: 0.3 }); K.ell(31, 9, 5, 3.4, 'abcde', { rim: 1 }); K.limb([[34, 10], [37, 10]], 2.4, 1.4, 'abcde');
      K.limb([[15, 13], [13 + d, 16]], 2.2, 1.8, 'abcde', { rim: 1 }); K.limb([[27, 13], [30 - d, 16]], 2.2, 1.8, 'abcde', { rim: 1 });
      [12, 16, 20, 24].forEach(x => K.px(x, 7, 'n')); K.rows(8, 31, ['zE']);
      return K.layers();
    } };
  // ---------- 骨鳥：只剩骨頭的鳥——尖尖的頭骨長喙、一根根的翅骨、細長的腳；眼窩裡一點紅光 ----------
  HD.bonebird = { w: 34, h: 28, eyes: 'R',
    m: { abcde: '#E2D8C4' },
    x: () => ({ R: '#FF4A3A', z: '#1A1210' }),
    pix(f, K) {
      const d = f ? 2 : 0;
      [[2, 4 + d], [4, 8 + d], [6, 12 + d]].forEach(t => K.limb([[14, 12], t], 1.6, 1, 'abcde'));
      K.limb([[14, 12], [8, 6 + d]], 2.2, 1.6, 'abcde');
      K.limb([[12, 15], [7, 19], [4, 18]], 2, 1.2, 'abcde');   // 尾
      K.limb([[13, 15], [22, 12]], 2.6, 2.4, 'abcde');
      for (let x = 14; x <= 20; x += 2) K.limb([[x, 13], [x, 17]], 1.4, 1.2, 'abcde');
      K.limb([[16, 17], [15, 22], [17, 26]], 1.6, 1.2, 'abcde'); K.limb([[19, 16], [21, 22], [20, 26]], 1.6, 1.2, 'abcde', { rim: 1 });
      K.limb([[21, 12], [24, 7]], 2, 2, 'abcde'); K.ell(25, 6, 3.4, 3, 'abcde', { rim: 1 }); K.poly([[27, 5], [33, 8], [27, 8]], 'abcde', { rim: 1 });
      K.rows(5, 25, ['zR']);
      return K.layers();
    } };
  // ---------- 泥偶：褐色的泥巴捏成的人偶，身上有手指捏過的凹痕，一隻橘色的獨眼；走路會掉泥塊 ----------
  HD.muddoll = { w: 30, h: 36, eyes: 'Y',
    m: { abcde: '#7A5A3A' },
    x: () => ({ Y: '#FF9A3A', z: '#2A1A0E' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[11, 26], [10 - d, 34]], 5, 4.4, 'abcde'); K.limb([[19, 26], [20 + d, 34]], 5, 4.4, 'abcde', { rim: 1 });
      K.ell(15, 20, 9, 9, 'abcde', { down: 0.25 });
      K.limb([[7, 16], [4, 23], [5, 27]], 4, 3.4, 'abcde', { rim: 1 }); K.limb([[23, 16], [26, 23], [25, 27]], 4, 3.4, 'abcde', { rim: 1 });
      K.ell(15, 8, 6.4, 6.4, 'abcde', { rim: 1, bias: 0.04 });
      K.rows(6, 15, ['zz', 'zY']); [[11, 18], [18, 22], [13, 25], [9, 10]].forEach(([x, y]) => K.rows(y, x, ['bb', ' b']));
      K.px(6 + d * 2, 30 + d, 'b'); K.px(24 - d, 31, 'b');
      return K.layers();
    } };
  // ==== C1 完 ====
  // ==== C2 ====
  // ---------- 鈴蟲：綠色的蟋蟀，長長的後腿、兩根長觸角，翅膀上一條淺色的紋 ----------
  HD.bellcricket = { w: 28, h: 20, eyes: 'E',
    m: { abcde: '#5A8A3A', klmno: '#3A5A26', pqrst: '#B8D87A' },
    x: () => ({ E: '#14200E' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[10, 12], [5, 6 - d], [3, 17]], 2.4, 1.4, 'klmno');
      K.ell(14, 12, 8, 4, 'abcde', { down: 0.3 }); K.rows(10, 9, ['rrrrrrrr']);
      K.limb([[12, 14], [8, 9 + d], [7, 18]], 2.8, 1.6, 'abcde', { rim: 1 }); K.limb([[18, 14], [20, 18]], 1.6, 1.2, 'abcde', { rim: 1 }); K.limb([[16, 15], [16, 18]], 1.6, 1.2, 'abcde', { rim: 1 });
      K.ell(22, 10, 3.6, 3, 'abcde', { rim: 1 }); K.rows(9, 23, ['E']);
      K.limb([[24, 8], [26, 3], [24, 1]], 1, 1, 'klmno'); K.limb([[23, 8], [22, 2], [19, 1]], 1, 1, 'klmno');
      return K.layers();
    } };
  // ---------- 鏽甲兵：一身生鏽的鎧甲（鐵鏽橘、斑駁），頭盔的縫裡一點黃光，拿著一面缺角的盾和一把短劍 ----------
  HD.rustknight = { w: 32, h: 44, eyes: 'Y',
    m: { abcde: '#8A5A3A', klmno: '#B8BCC4', fghij: '#5A3A28' },
    x: () => ({ Y: '#FFD84A', z: '#140C08', O: '#C8783A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[12, 30], [11 - d, 42]], 4.4, 4, 'fghij'); K.limb([[18, 30], [19 + d, 42]], 4.4, 4, 'abcde', { rim: 1 });
      K.poly([[8, 14], [22, 14], [23, 31], [7, 31]], 'abcde'); K.rows(20, 8, ['gggggggggggggg']); K.rows(25, 8, ['gggggggggggggg']);
      [[10, 17], [18, 22], [12, 27], [20, 16]].forEach(([x, y]) => K.rows(y, x, ['OO', ' O']));
      K.limb([[22, 16], [26, 22], [27, 26]], 3.4, 3, 'abcde', { rim: 1 }); K.poly([[26, 24], [29, 24], [28, 40], [27, 40]], 'klmno', { rim: 1 });
      K.poly([[1, 16], [10, 16], [10, 30], [5, 33], [1, 29]], 'klmno', { rim: 1 }); K.rows(16, 1, ['zz']); K.rows(18, 4, ['m', 'm', 'm', 'm', 'm']);
      K.poly([[9, 3], [21, 3], [22, 13], [8, 13]], 'abcde', { rim: 1 }); K.rows(7, 10, ['zzzzzzzzzz', 'zzYzzzYzzz']); K.rows(3, 14, ['O']);
      return K.layers();
    } };
  // ---------- 酸泡：一團黃綠色的酸液，表面冒著小泡泡，下面一攤滴在地上；兩顆小眼睛 ----------
  HD.acidbubble = { w: 26, h: 26, eyes: 'E',
    m: { abcde: '#6ACF3A', klmno: '#B8F07A' },
    x: () => ({ E: '#14300A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.ell(13, 23, 11, 2.4, 'abcde', { flat: 1 });
      K.ell(13, 15 + d * 0.5, 9.4, 9 - d * 0.5, 'abcde', { down: 0.2 });
      K.ell(9, 10, 2.4, 2.4, 'klmno', { rim: 1 }); K.ell(18, 8 - d, 1.6, 1.6, 'klmno', { rim: 1 }); K.ell(15, 4 - d * 2, 1.4, 1.4, 'klmno', { rim: 1 });
      K.rows(15, 9, ['EE  EE']);
      return K.layers();
    } };
  // ---------- 回音蝠：深紫色的蝙蝠，翅膀張開（翼膜上一根根指骨），大耳朵、紅眼睛、小尖牙 ----------
  HD.echobat = { w: 34, h: 22, eyes: 'R',
    m: { abcde: '#3A2A4A', klmno: '#5A3A6A' },
    x: () => ({ R: '#FF4A6A', w: '#E8E0E8', z: '#0E0814' }),
    pix(f, K) {
      const d = f ? 4 : 0;
      K.poly([[16, 10], [2, 4 + d], [4, 10 + d], [7, 9 + d], [9, 14], [12, 13], [15, 15]], 'klmno', { rim: 1 }); K.poly([[18, 10], [32, 4 + d], [30, 10 + d], [27, 9 + d], [25, 14], [22, 13], [19, 15]], 'klmno', { rim: 1 });
      K.limb([[16, 10], [2, 4 + d]], 1.2, 1, 'abcde'); K.limb([[18, 10], [32, 4 + d]], 1.2, 1, 'abcde');
      K.ell(17, 12, 4.4, 5.4, 'abcde', { down: 0.2 }); K.poly([[13, 9], [13, 3], [16, 8]], 'abcde'); K.poly([[18, 8], [21, 3], [21, 9]], 'abcde');
      K.rows(10, 15, ['R R']); K.rows(14, 16, ['w w']);
      return K.layers();
    } };
  // ---------- 鏡魔像：灰色石頭疊成的魔像，胸口嵌著一大片會反光的鏡子（淡藍、有斜的亮痕）；方頭、一隻藍眼睛 ----------
  HD.mirrorgolem = { w: 44, h: 50, eyes: 'E',
    m: { abcde: '#8A929E', pqrst: '#A8D8F0', fghij: '#5A626E' },
    x: () => ({ E: '#5AB8FF', z: '#1A1E24' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.poly([[12, 36], [19, 36], [19, 48], [11, 48]], 'fghij', { rim: 1 }); K.poly([[25, 36], [32, 36], [33, 48], [25, 48]], 'abcde', { rim: 1 });
      K.poly([[8, 14], [36, 14], [34, 37], [10, 37]], 'abcde');
      K.poly([[13, 18], [31, 18], [30, 33], [14, 33]], 'pqrst'); K.rows(19, 16, ['t   t', ' t   t', '  t   t', '   t   t']);
      K.ell(5, 22 + d, 5, 9, 'fghij', { rim: 1 }); K.ell(39, 22 - d, 5, 9, 'abcde', { rim: 1 }); K.rows(30 - d, 36, ['bbbbbb']);
      K.poly([[14, 3], [30, 3], [30, 14], [14, 14]], 'abcde', { rim: 1 }); K.rows(7, 20, ['zzzz', 'zEEz', 'zzzz']);
      return K.layers();
    } };
  // ---------- 裂地蠍：鐵鏽紅的大蠍子，一節一節的尾巴高高翹起、末端一根毒針；一對大鉗子、四對腳 ----------
  HD.riftscorp = { w: 46, h: 26, eyes: 'E',
    m: { abcde: '#8A3A22', klmno: '#5A2214', pqrst: '#E8B83A' },
    x: () => ({ E: '#FFD84A', z: '#140806' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      for (let i = 0; i < 4; i++) { const x = 14 + i * 5; K.limb([[x, 18], [x - 3, 22], [x - 4 + d * (i % 2 ? 1 : -1), 25]], 1.6, 1.2, 'klmno'); }
      K.ell(22, 17, 11, 5, 'abcde', { down: 0.3 }); for (let x = 14; x < 30; x += 4) K.rows(13, x, ['b', 'b', 'b']);
      const tail = [[12, 16], [6, 13], [4, 7], [8, 3 - d], [14, 2 - d]]; tail.forEach(([x, y], i) => K.ell(x, y, 3.2 - i * 0.3, 2.8 - i * 0.3, 'abcde', { rim: 'l' }));
      K.poly([[15, 1 - d], [19, 3 - d], [15, 4 - d]], 'pqrst');
      K.limb([[30, 16], [36, 12], [40, 12]], 3, 2.6, 'abcde'); K.ell(42, 11, 3.4, 2.6, 'abcde', { rim: 1 }); K.poly([[43, 9], [46, 8], [44, 11]], 'abcde');
      K.limb([[30, 19], [36, 21], [40, 20]], 3, 2.6, 'abcde', { rim: 1 }); K.ell(42, 20, 3.4, 2.6, 'abcde', { rim: 1 }); K.poly([[43, 18], [46, 17], [44, 20]], 'abcde');
      for (let i = 0; i < 4; i++) { const x = 16 + i * 5; K.limb([[x, 19], [x + 3, 22], [x + 4 - d * (i % 2 ? 1 : -1), 25]], 1.8, 1.4, 'abcde', { rim: 1 }); }
      K.rows(14, 31, ['EzE']);
      return K.layers();
    } };
  // ---------- 霧燈靈：淡藍白色的霧氣精靈，上半身圓、下半身拖成一縷霧；黑黑的眼睛、張開的小嘴 ----------
  HD.mistwisp = { w: 26, h: 36, eyes: 'E',
    m: { abcde: '#D4E2F0', klmno: '#9AB4D0' },
    x: () => ({ E: '#1A2A3A', z: '#1A2A3A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[13, 20], [11 + d, 27], [14 - d, 32], [12, 35]], 10, 1.4, 'klmno');
      K.ell(13, 13, 9, 9.4, 'abcde', { down: 0.2, bias: 0.05 });
      K.limb([[5, 14], [2, 18 + d]], 2.4, 1.4, 'abcde'); K.limb([[21, 14], [24, 18 - d]], 2.4, 1.4, 'abcde');
      K.rows(11, 9, ['EE  EE', 'EE  EE']); K.rows(16, 12, ['zz', 'zz']);
      return K.layers();
    } };
  // ---------- 蝕骨犬：只剩骨頭的狗——頭骨、肋骨、脊椎一節一節，細細的腳骨；眼窩裡紅光、齜著牙 ----------
  HD.bonehound = { w: 38, h: 26, eyes: 'R',
    m: { abcde: '#E2D8C4', fghij: '#A89C88' },
    x: () => ({ R: '#FF3A3A', z: '#1A1210' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[10, 18], [8 - d, 25]], 1.8, 1.4, 'fghij'); K.limb([[26, 18], [28 + d, 25]], 1.8, 1.4, 'fghij');
      K.limb([[8, 10], [3, 6], [2, 2 + d]], 1.6, 1.2, 'abcde');
      K.limb([[7, 11], [18, 10], [28, 9]], 2.6, 2.4, 'abcde');
      for (let x = 15; x <= 25; x += 2.5) K.limb([[x, 10.5], [x - 0.5, 15], [x + 0.5, 17]], 1.4, 1.2, 'abcde');
      K.ell(9, 13, 3.4, 3.4, 'abcde', { rim: 1 });
      K.limb([[10, 15], [12 + d, 20], [10 + d, 25]], 2, 1.6, 'abcde', { rim: 1 }); K.limb([[26, 12], [27 - d, 19], [26 - d, 25]], 2, 1.6, 'abcde', { rim: 1 });
      K.ell(31, 8, 4.4, 3.6, 'abcde', { rim: 1 }); K.poly([[33, 7], [38, 9], [37, 11], [33, 11]], 'abcde', { rim: 1 });
      K.rows(6, 30, ['zR']); K.rows(10, 33, ['zazaz']);
      return K.layers();
    } };
  // ==== C2 完 ====
  // ==== D1 ====
  // ---------- 雷晶蛛：深紫色的蜘蛛，背上長著一塊發光的青色水晶，八隻腳 ----------
  HD.thunderspider = { w: 32, h: 22, eyes: 'E',
    m: { abcde: '#3E2E6A', fghij: '#241A44', pqrst: '#5AE0FF' },
    x: () => ({ E: '#FFE04A', z: '#0E0A1A' }),
    pix(f, K) {
      const s = f ? 1 : -1;
      [[[18, 13], [24, 6], [28, 20]], [[16, 13], [20, 5], [22, 20]], [[13, 13], [8, 5], [6, 20]], [[11, 13], [4, 6], [2, 20]]].forEach(p => K.limb(p, 1.8, 1.2, 'fghij'));
      K.ell(13, 14, 8, 5.6, 'abcde', { down: 0.3 }); K.ell(22, 15, 4.6, 3.6, 'abcde', { rim: 1 });
      [[[20, 15], [27, 8], [31, 20]], [[17, 15], [22, 7 + (s > 0 ? 1 : 0)], [25, 20]], [[11, 15], [6, 7], [4, 20]], [[9, 15], [2, 8 + (s < 0 ? 1 : 0)], [1, 20]]].forEach(p => K.limb(p, 2.2, 1.4, 'abcde', { rim: 1 }));
      K.poly([[9, 11], [12, 4], [15, 3], [17, 10]], 'pqrst'); K.poly([[9, 11], [12, 4], [13, 10]], 'pqrst', { flat: 4 });
      K.rows(14, 24, ['EE']);
      return K.layers();
    } };
  // ---------- 鐘擺刃：轉個不停的金屬刃輪——四片彎刃（亮面朝左上）、中間一顆黃色的軸心 ----------
  HD.bladewheel = { w: 36, h: 36,
    m: { abcde: '#9AA0AC', fghij: '#E8B83A', klmno: '#5A606C' },
    x: () => ({ z: '#1A1C22' }),
    pix(f, K) {
      const C = 18, a0 = f ? Math.PI / 8 : 0;
      for (let i = 0; i < 4; i++) { const a = a0 + i * Math.PI / 2, p = r => [C + Math.cos(a) * r, C + Math.sin(a) * r], q = (r, o) => [C + Math.cos(a + o) * r, C + Math.sin(a + o) * r];
        K.poly([q(6, -0.5), p(17), q(12, 0.45), q(6, 0.6)], 'abcde', { rim: 1 }); }
      K.ell(C, C, 7, 7, 'klmno', { rim: 1 }); K.ell(C, C, 3.4, 3.4, 'fghij', { rim: 1 }); K.px(C, C, 'z');
      return K.layers();
    } };
  // ---------- 黑泥巨口：一攤黑泥，整個前面裂開成一張大嘴（紅色的嘴裡、上下一排尖牙），上面兩顆黃眼睛 ----------
  HD.blackmaw = { w: 46, h: 30, eyes: 'Y',
    m: { abcde: '#2A2630', pqrst: '#B8303A' },
    x: () => ({ Y: '#FFD84A', w: '#ECE4D8', z: '#0A080C' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.ell(23, 22, 22, 7, 'abcde', { down: 0.3 }); K.ell(22, 15, 18, 11, 'abcde', { down: 0.25 });
      K.ell(26, 16, 13, 5 + d, 'pqrst', { flat: 1 }); K.ell(27, 17, 10, 3 + d, 'zzzzz', { flat: 0 });
      for (let x = 15; x <= 37; x += 3) { K.poly([[x, 11 - d * 0.3], [x + 2, 11 - d * 0.3], [x + 1, 15]], 'wwwww', { flat: 2 }); K.poly([[x + 1, 21 + d], [x + 3, 21 + d], [x + 2, 17 + d]], 'wwwww', { flat: 2 }); }
      K.rows(5, 16, ['zzz      zzz', 'zYz      zYz']);
      [[4, 26], [42, 27], [10, 29]].forEach(([x, y]) => K.px(x, y, 'b'));
      return K.layers();
    } };
  // ---------- 號角骸：披著破舊紫袍的骷髏，舉著一支金色的號角在吹；眼窩紅光 ----------
  HD.hornbones = { w: 32, h: 42, eyes: 'R',
    m: { abcde: '#E2D8C4', fghij: '#5A3A5A', klmno: '#E8B83A' },
    x: () => ({ R: '#FF4A3A', z: '#1A1012' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[12, 32], [11, 40]], 2.4, 2, 'abcde'); K.limb([[18, 32], [19, 40]], 2.4, 2, 'abcde', { rim: 1 });
      K.poly([[8, 14], [22, 14], [24, 34], [21, 32], [18, 35], [14, 32], [10, 35], [6, 33]], 'fghij'); K.rows(22, 9, ['i', ' i', 'i']); K.rows(24, 19, ['i', 'i', ' i']);
      K.limb([[20, 16], [24, 12], [21, 9]], 2.4, 2, 'abcde', { rim: 1 });
      K.limb([[19, 9], [24, 5 - d], [29, 2 - d]], 2, 4.4, 'klmno', { rim: 1 }); K.ell(29, 2.6 - d, 2.4, 3, 'klmno', { rim: 1 });
      K.ell(15, 9, 5.4, 5.6, 'abcde', { rim: 1, bias: 0.04 }); K.rows(8, 12, ['zz zz', 'zR zR']); K.rows(12, 13, ['zazaz']);
      return K.layers();
    } };
  // ---------- 灰燼鴉：黑灰色的烏鴉，羽毛邊緣燒成橘紅色的餘燼，飛的時候掉火星 ----------
  HD.ashcrow = { w: 34, h: 26, eyes: 'E',
    m: { abcde: '#3A3640', klmno: '#E8702A' },
    x: () => ({ E: '#FFB43A', z: '#0E0C10', y: '#4A4450' }),
    pix(f, K) {
      const d = f ? 4 : 0;
      K.poly([[14, 12], [2, 4 + d], [6, 10 + d], [3, 14 + d], [12, 16]], 'abcde', { rim: 1 }); K.rows(5 + d, 3, ['n', ' nn', '   n']);
      K.poly([[10, 15], [3, 20], [6, 22], [12, 18]], 'abcde');
      K.ell(17, 14, 7, 5, 'abcde', { down: 0.25 }); K.limb([[18, 18], [17, 24]], 1.4, 1, 'yyyyy'); K.limb([[20, 18], [21, 24]], 1.4, 1, 'yyyyy');
      K.ell(25, 10, 4.4, 4, 'abcde', { rim: 1 }); K.poly([[28, 9], [33, 11], [28, 12]], 'yyyyy', { flat: 2 });
      K.rows(9, 25, ['E']); [[8, 21], [14, 23], [5, 18]].forEach(([x, y], i) => K.px(x, y + (f && i % 2 ? 1 : 0), 'n'));
      return K.layers();
    } };
  // ---------- 白骨百足：骨頭串成的蜈蚣——一節一節的脊椎、每節兩隻骨腳；頭骨前面一對骨顎、紅眼 ----------
  HD.bonecentipede = { w: 54, h: 24, eyes: 'R',
    m: { abcde: '#E2D8C4', fghij: '#A89C88' },
    x: () => ({ R: '#FF3A3A', z: '#1A1210' }),
    pix(f, K) {
      const N = 9, cy = i => 12 + Math.sin(i * 0.8 + (f ? 1 : 0)) * 1.2;
      for (let i = 0; i < N; i++) { const x = 6 + i * 5, y = cy(i), k = (i + f) % 2 ? 1 : -1; K.limb([[x, y + 2], [x - 2 + k, 18], [x - 3 + k, 22]], 1.4, 1, 'fghij'); }
      for (let i = 0; i < N; i++) { const x = 6 + i * 5, y = cy(i); K.ell(x, y, 3, 3.4, 'abcde', { rim: 'l' }); K.px(x - 1, y - 1, 'e'); }
      for (let i = 0; i < N; i++) { const x = 6 + i * 5, y = cy(i), k = (i + f) % 2 ? -1 : 1; K.limb([[x + 1, y + 2], [x + 3 + k, 18], [x + 2 + k, 22]], 1.6, 1.2, 'abcde', { rim: 1 }); }
      K.ell(50, cy(N) - 1, 4, 3.6, 'abcde', { rim: 'l' }); K.rows(Math.round(cy(N)) - 2, 50, ['zR']);
      K.limb([[52, cy(N) + 1], [54, cy(N) + 4], [52, cy(N) + 6]], 1.4, 1, 'abcde');
      return K.layers();
    } };
  // ---------- 冰棺守：一具直立的冰棺（半透明的淡藍、邊緣有霜），裡面隱約看得到一個人影；棺上一隻藍色的眼睛 ----------
  HD.icewarden = { w: 32, h: 46, eyes: 'E',
    m: { abcde: '#A8D8F0', fghij: '#5A8AB8', klmno: '#E8F6FF' },
    x: () => ({ E: '#2A7AFF', z: '#1A2A4A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.poly([[8, 2], [24, 2], [27, 10], [25, 44], [7, 44], [5, 10]], 'abcde');
      K.ell(16, 18, 4, 4.6, 'fghij', { flat: 1 }); K.poly([[11, 22], [21, 22], [22, 38], [10, 38]], 'fghij', { flat: 1 });   // 裡面的人影
      K.rows(4, 8, ['nnnnnnnnnnnnnnnn']); K.rows(6, 7, ['o', 'n', 'o']); K.rows(30, 24, ['o', 'n', ' o']);
      K.rows(8, 9, ['o', ' o', '  o']); K.rows(40, 20, ['oo', ' o']);
      K.rows(13 + d, 14, ['zzzz', 'zEEz', 'zzzz']);
      return K.layers();
    } };
  // ---------- 踏焰龜：岩石一樣的深褐色龜殼，殼的縫裡流著發光的熔岩；粗短的腳、慢吞吞的頭 ----------
  HD.lavaturtle = { w: 46, h: 30, eyes: 'Y',
    m: { abcde: '#5A3A2A', fghij: '#7A5A44' },
    x: () => ({ L: '#FFB43A', l: '#E0601E', Y: '#FFD84A', z: '#140A06' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[10, 22], [9 - d, 28]], 5, 4.4, 'fghij'); K.limb([[32, 22], [34 + d, 28]], 5, 4.4, 'fghij');
      K.ell(21, 16, 17, 11, 'abcde', { down: 0.3 });
      K.rows(9, 11, ['lLl   lLLl', '   lLl    lL', '  l   lLl   lLl', ' lL      l', 'lL   lLLl     lL']); K.rows(18, 14, ['lLLl   lLl']);
      K.limb([[13, 23], [12 + d, 28]], 5.4, 4.6, 'fghij', { rim: 1 }); K.limb([[30, 23], [31 - d, 28]], 5.4, 4.6, 'fghij', { rim: 1 });
      K.limb([[36, 18], [41, 16 - d]], 5, 4.4, 'fghij', { rim: 1 }); K.ell(42, 15 - d, 3.6, 3, 'fghij', { rim: 1 }); K.rows(14 - d, 42, ['Y']);
      return K.layers();
    } };
  // ==== D1 完 ====
  // ==== D2 ====
  // ---------- 沙沉蟲：沙色的大蟲，一節一節（接縫深色），前端整個是一張圓嘴、一圈尖牙 ----------
  HD.sandsinker = { w: 46, h: 26,
    m: { abcde: '#C8A870', fghij: '#8A6A42' },
    x: () => ({ z: '#2A1408', M: '#7A2A1A', w: '#F0E8D8' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      for (let i = 0; i < 6; i++) { const x = 6 + i * 6, y = 15 + Math.sin(i * 0.9 + d) * 1.2, r = 5 + i * 0.5; K.ell(x, y, r, r, 'abcde', { rim: 'l', down: 0.3 }); }
      K.ell(40, 13, 5, 8, 'abcde', { rim: 'l' }); K.ell(42, 13, 3, 6, 'MMMMM', { flat: 0 }); K.ell(43, 13, 1.6, 3.6, 'zzzzz', { flat: 0 });
      [[40, 6], [43, 7], [44, 10], [44, 16], [43, 19], [40, 20]].forEach(([x, y]) => K.px(x, y, 'w'));
      [[4, 23], [18, 24], [30, 23]].forEach(([x, y]) => K.rows(y, x, ['hh  h']));
      return K.layers();
    } };
  // ---------- 深淵觸手：從一灘黑水裡伸出來的深青色觸手，扭來扭去；身上一排發光的青色斑點、內側吸盤 ----------
  HD.abyssarm = { w: 30, h: 50,
    m: { abcde: '#2E5A6A', fghij: '#1A2A34', pqrst: '#7AE0E8' },
    x: () => ({}),
    pix(f, K) {
      const s = f ? 1 : -1;
      K.ell(15, 46, 13, 3, 'fghij', { flat: 0 });
      const p = []; for (let i = 0; i <= 8; i++) p.push([15 + Math.sin(i * 0.8 + (f ? 0.6 : 0)) * (2 + i * 0.6) * s, 46 - i * 5.2]);
      K.limb(p, 9, 2.4, 'abcde');
      p.slice(1, 7).forEach(([x, y], i) => { K.px(x - 1, y, 's'); if (i % 2) K.px(x + 2, y + 1, 'r'); });
      return K.layers();
    } };
  // ---------- 虛空行者：高高的黑影，罩著一件邊緣碎掉的長袍，胸口一顆發紫光的核，兜帽裡兩點紫光 ----------
  HD.voidwalker = { w: 36, h: 52, eyes: 'V',
    m: { abcde: '#2A2234', pqrst: '#9A5AFF' },
    x: () => ({ V: '#C88AFF', z: '#0A0610' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.poly([[10, 12], [26, 12], [31, 46], [27, 43 + d], [24, 48], [20, 44], [16, 49 - d], [12, 44], [8, 48], [5, 46]], 'abcde');
      K.limb([[10, 16], [5, 26], [4, 34 + d]], 4, 2.4, 'abcde', { rim: 1 }); K.limb([[26, 16], [31, 26], [32, 34 - d]], 4, 2.4, 'abcde', { rim: 1 });
      K.ell(18, 26, 4, 4.4, 'pqrst', { down: 0.1, bias: 0.1 }); K.rows(25, 17, ['tt', 'tt']);
      K.ell(18, 8, 7, 7.4, 'abcde', { rim: 1, bias: 0.04 }); K.ell(18, 10, 4.4, 4, 'zzzzz', { flat: 0 }); K.rows(9, 16, ['V V']);
      return K.layers();
    } };
  // ---------- 雙生影：兩個疊在一起的小黑影（一前一後、錯開半步），紫色的眼睛 ----------
  HD.twinshade = { w: 26, h: 38, eyes: 'V',
    m: { abcde: '#2E2838', fghij: '#1C1824' },
    x: () => ({ V: '#C88AFF' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.ell(16, 8 - d, 5, 5.4, 'fghij'); K.poly([[11, 12 - d], [21, 12 - d], [23, 34], [9, 34]], 'fghij'); K.rows(7 - d, 15, ['V V']);
      K.ell(10, 10 + d, 5.4, 5.6, 'abcde', { rim: 1 }); K.poly([[5, 14 + d], [15, 14 + d], [17, 36], [3, 36]], 'abcde', { rim: 1 }); K.rows(9 + d, 8, ['V V']);
      return K.layers();
    } };
  // ---------- 晶核獸：紫色的四腳獸，背上長著一排粉紅色的水晶，胸口一顆發光的晶核 ----------
  HD.corebeast = { w: 52, h: 40, eyes: 'E',
    m: { abcde: '#5A3A7A', fghij: '#3A2452', pqrst: '#FF8AC8' },
    x: () => ({ E: '#FFE04A', z: '#140A1C' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[14, 28], [12 - d, 37]], 5, 4.4, 'fghij'); K.limb([[34, 28], [36 + d, 37]], 5, 4.4, 'fghij');
      K.ell(24, 22, 16, 10, 'abcde', { down: 0.3 });
      [[12, 13, 7], [18, 11, 10], [24, 11, 12], [30, 12, 9], [35, 14, 6]].forEach(([x, y, h]) => K.poly([[x - 2.4, y + 2], [x - 1, y - h], [x + 2.4, y + 2]], 'pqrst'));
      K.limb([[16, 28], [15 + d, 37]], 5.4, 4.6, 'abcde', { rim: 1 }); K.limb([[36, 28], [37 - d, 37]], 5.4, 4.6, 'abcde', { rim: 1 });
      K.ell(42, 18, 7, 6, 'abcde', { rim: 1, bias: 0.04 }); K.poly([[46, 17], [51, 19], [49, 23], [45, 22]], 'abcde', { rim: 1 });
      K.ell(30, 25, 3.6, 3.6, 'pqrst', { bias: 0.15 }); K.rows(16, 43, ['zE']);
      return K.layers();
    } };
  // ---------- 審判之眼：一顆大眼睛（白眼球、紅色的虹膜），兩邊一對金色的翅膀狀外框 ----------
  HD.judgeeye = { w: 36, h: 36, eyes: 'R',
    m: { abcde: '#F0E8DC', klmno: '#E8B83A' },
    x: () => ({ R: '#C8303A', r: '#7A1A20', z: '#140A0A' }),
    pix(f, K) {
      const d = f ? 2 : 0;
      K.poly([[10, 18], [1, 8 + d], [4, 16], [1, 24 - d], [8, 22]], 'klmno', { rim: 1 }); K.poly([[26, 18], [35, 8 + d], [32, 16], [35, 24 - d], [28, 22]], 'klmno', { rim: 1 });
      K.ell(18, 18, 11, 10, 'klmno', { rim: 1 }); K.ell(18, 18, 9, 8, 'abcde', { down: 0.25 });
      K.ell(18, 18, 4.4, 4.4, 'RRRRR', { flat: 0 }); K.ell(18, 18, 2.6, 2.6, 'rrrrr', { flat: 0 }); K.ell(18, 18, 1.4, 1.6, 'zzzzz', { flat: 0 });
      return K.layers();
    } };
  // ---------- 福影童：穿紅色和服的小女孩，黑色的妹妹頭，白白的臉；手裡捧著東西 ----------
  HD.fukudo = { w: 26, h: 36, eyes: 'E',
    m: { abcde: '#C8303A', fghij: '#141018', pqrst: '#F2E8E0', klmno: '#E8B83A' },
    x: () => ({ E: '#1A1014' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.poly([[7, 14], [19, 14], [21, 34], [5, 34]], 'abcde'); K.rows(22, 6, ['mmmmmmmmmmmmmm']);
      [[9, 26], [16, 18], [12, 30]].forEach(([x, y]) => K.rows(y, x, ['l', 'lll', ' l']));
      K.ell(13, 19, 3.4, 2.4, 'pqrst', { rim: 1 });
      K.ell(13, 8, 6, 6.4, 'pqrst', { bias: 0.08 });
      K.poly([[6, 2], [20, 2], [21, 11], [18, 6], [8, 6], [5, 11]], 'fghij'); K.poly([[6, 6], [9, 6], [9, 12], [6, 12]], 'fghij'); K.poly([[17, 6], [20, 6], [20, 12], [17, 12]], 'fghij');
      K.rows(9, 10, ['E  E']); K.px(13, 12, 'b');
      return K.layers();
    } };
  // ---------- 淘豆聲：戴著斗笠、蹲著的小矮人，手裡一個藍色的笊籬，裡面裝著紅豆 ----------
  HD.azuki = { w: 30, h: 28, eyes: 'E',
    m: { abcde: '#7A6A4A', fghij: '#C8A060', pqrst: '#4A7AB8' },
    x: () => ({ E: '#F0E0A0', z: '#1A140A', R: '#8A2A2A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.ell(12, 18, 7, 8, 'abcde', { down: 0.25 }); K.limb([[9, 24], [8, 27]], 3, 2.6, 'abcde'); K.limb([[15, 24], [16, 27]], 3, 2.6, 'abcde', { rim: 1 });
      K.ell(12, 10, 5, 4.6, 'abcde', { rim: 1 }); K.poly([[2, 9], [12, 3], [22, 9]], 'fghij', { rim: 1 }); K.rows(10, 10, ['zE zE']);
      K.limb([[17, 17], [21, 20]], 2.6, 2.4, 'abcde', { rim: 1 }); K.ell(24, 21, 5, 3, 'pqrst', { rim: 1 }); K.rows(19 - d, 22, ['RRR', ' RR']);
      return K.layers();
    } };
  // ==== D2 完 ====
  // ==== E1 ====
  // ---------- 長舌穢：綠色、黏黏的蛙形怪，蹲著；一條粉紅色的長舌頭伸出來甩 ----------
  HD.akane = { w: 34, h: 26, eyes: 'E',
    m: { abcde: '#6A8A3A', pqrst: '#E87A9A', fghij: '#A8C060' },
    x: () => ({ E: '#F0E04A', z: '#14200A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[8, 18], [4, 22], [7, 24]], 4, 3, 'abcde');
      K.ell(13, 17, 9, 7, 'abcde', { down: 0.3 }); K.ell(14, 19, 5, 4, 'fghij', { flat: 2 });
      K.limb([[18, 20], [22, 24]], 3.4, 2.6, 'abcde', { rim: 1 }); K.limb([[10, 21], [10, 24]], 3, 2.6, 'abcde', { rim: 1 });
      K.ell(18, 10, 6.4, 5.4, 'abcde', { rim: 1, bias: 0.04 }); K.ell(15, 6, 2.4, 2.4, 'abcde', { rim: 1 }); K.ell(21, 6, 2.4, 2.4, 'abcde', { rim: 1 });
      K.rows(5, 14, ['zE   zE']);
      K.limb([[22, 12], [27, 13 + d], [31, 10 + d * 2], [33, 12 + d]], 2.4, 1.6, 'pqrst', { rim: 1 });
      return K.layers();
    } };
  // ---------- 黑潮僧：一大顆深藍黑色的圓滾滾海怪，像光頭的和尚；兩顆黃眼睛、一條嘴，底下一圈小觸手 ----------
  HD.umiso = { w: 48, h: 44, eyes: 'Y',
    m: { abcde: '#1E3050', fghij: '#14203A' },
    x: () => ({ Y: '#FFD84A', z: '#080C14' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      for (let i = 0; i < 7; i++) { const x = 8 + i * 5.4; K.limb([[x, 36], [x + ((i + d) % 2 ? 1 : -1), 41], [x + ((i + d) % 2 ? 2 : -2), 43]], 3, 1.4, 'fghij'); }
      K.ell(24, 21, 21, 19, 'abcde', { down: 0.25, bias: 0.04 });
      K.rows(18, 13, ['zzzz        zzzz', 'zYYz        zYYz', 'zzzz        zzzz']); K.rows(28, 18, ['zzzzzzzzzzzz']);
      return K.layers();
    } };
  // ---------- 濕鱗女：黑長髮、蒼白臉的女人，脖子以下是一條盤起來的青綠色蛇身（鱗片一片片） ----------
  HD.nureo = { w: 36, h: 40, eyes: 'E',
    m: { abcde: '#3E7A6A', fghij: '#14141A', pqrst: '#F0E8E0', klmno: '#8AC8A0' },
    x: () => ({ E: '#C8303A', z: '#1A1012' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[6, 34], [14, 37], [26, 36], [32, 32], [30, 27], [22, 27], [14, 28]], 7, 6, 'abcde', { rim: 1 });
      K.limb([[16, 29], [15, 20], [17, 14]], 6, 5, 'abcde');
      for (let x = 8; x < 30; x += 3) K.px(x, 35, 'n'); for (let y = 18; y < 28; y += 3) K.px(15, y, 'n');
      K.limb([[30, 30], [34, 33 + d]], 3, 1.4, 'abcde');
      K.ell(18, 9, 5.4, 6, 'pqrst', { bias: 0.08 });
      K.poly([[12, 3], [24, 3], [26, 18], [22, 9], [14, 9], [10, 18]], 'fghij'); K.rows(9, 16, ['E E']);
      return K.layers();
    } };
  // ---------- 附犬靈：半透明的白色狗靈，趴著、尾巴捲起來，一隻紅眼睛 ----------
  HD.inugami = { w: 34, h: 22, eyes: 'R',
    m: { abcde: '#E8E4DC', klmno: '#B8B4AC' },
    x: () => ({ R: '#E83A3A', z: '#2A2420' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[6, 14], [2, 10], [4, 6 - d]], 4, 2.4, 'klmno');
      K.ell(15, 15, 10, 5, 'abcde', { down: 0.3 }); K.limb([[20, 19], [28, 20]], 3, 2.6, 'abcde', { rim: 1 });
      K.ell(26, 11, 5.4, 4.6, 'abcde', { rim: 1, bias: 0.04 }); K.limb([[29, 12], [33, 13]], 3.4, 2, 'abcde'); K.poly([[22, 9], [23, 3], [26, 8]], 'abcde');
      K.rows(10, 27, ['zR']); K.px(33, 13, 'z');
      return K.layers();
    } };
  // ---------- 八首蟒：一團黑土裡竄出好幾條綠色的大蛇，每一條都昂著頭、紅眼睛、吐著信 ----------
  HD.yamata = { w: 56, h: 46, eyes: 'R',
    m: { abcde: '#4E7A3A', fghij: '#3A2A1E', klmno: '#A8C878' },
    x: () => ({ R: '#FF3A3A', z: '#0E140A', t: '#E83A5A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.ell(28, 41, 26, 5, 'fghij', { down: 0.3 });
      [[8, 12, 0], [18, 6, 1], [28, 3, 0], [38, 6, 1], [48, 12, 0]].forEach(([x, y, k], i) => {
        const hy = y + (k ? d : -d) + 2; K.limb([[x + (i - 2) * -2, 40], [x - 3, 28], [x + 2, 18], [x, hy + 3]], 6, 4.4, 'abcde', { rim: 1 });
        for (let yy = hy + 6; yy < 38; yy += 3) K.px(x + (i - 2) * -1, yy, 'n');
        K.ell(x + 2, hy, 5.4, 3.6, 'abcde', { rim: 1, bias: 0.04 }); K.poly([[x + 4, hy], [x + 9, hy + 1], [x + 8, hy + 3], [x + 3, hy + 3]], 'abcde', { rim: 1 }); K.rows(hy - 2, x + 2, ['zR']); K.rows(hy + 2, x + 9, ['t', ' t']); K.rows(hy + 1, x + 4, ['zzzz']);
      });
      return K.layers();
    } };
  // ---------- 赤角巨人：紅皮膚的大個子，頭上兩根白角、黃色的虎紋腰布，扛著一根帶刺的鐵棒；獠牙外露 ----------
  HD.akaoni = { w: 44, h: 52, eyes: 'Y',
    m: { abcde: '#C83A2A', fghij: '#E8C04A', klmno: '#4A4A54', pqrst: '#ECE4D4' },
    x: () => ({ Y: '#FFE04A', z: '#1A0A08' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[16, 36], [14 - d, 50]], 7, 6, 'abcde'); K.limb([[26, 36], [28 + d, 50]], 7, 6, 'abcde', { rim: 1 });
      K.ell(21, 24, 11, 12, 'abcde', { down: 0.25 }); K.rows(20, 15, ['bb  bb', ' b  b']);
      K.poly([[10, 32], [32, 32], [33, 39], [9, 39]], 'fghij', { rim: 1 }); for (let x = 11; x < 32; x += 4) K.rows(33, x, ['z', ' z', 'z']);
      K.limb([[11, 18], [6, 28], [7, 34]], 6, 5, 'abcde', { rim: 1 });
      K.limb([[32, 16], [37, 10], [36, 6]], 6, 5, 'abcde', { rim: 1 });
      K.limb([[30, 12 - d], [42, 1]], 4, 6, 'klmno', { rim: 1 }); [[36, 6], [39, 3], [33, 9]].forEach(([x, y]) => K.px(x + 2, y - 2 - d, 'o'));
      K.ell(21, 9, 7, 7, 'abcde', { rim: 1, bias: 0.04 });
      K.poly([[14, 5], [12, -1], [17, 3]], 'pqrst'); K.poly([[26, 3], [30, -1], [28, 5]], 'pqrst');
      K.rows(7, 17, ['zzz zzz', 'zYz zYz']); K.rows(12, 18, ['zzzzzz', 'r    r']);
      return K.layers();
    } };
  // ---------- 嶺婆：住在山裡的老婆婆，灰白的亂髮、橄欖色的破衣服，駝背，拿著一把柴刀；眼睛發黃光 ----------
  HD.mineba = { w: 30, h: 42, eyes: 'Y',
    m: { abcde: '#6A6A4A', pqrst: '#D8C8B4', klmno: '#C8C8C8', fghij: '#9AA0AC' },
    x: () => ({ Y: '#FFD84A', z: '#1A1A10' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[11, 32], [10, 40]], 3, 2.6, 'pqrst'); K.limb([[17, 32], [18 + d, 40]], 3, 2.6, 'pqrst', { rim: 1 });
      K.poly([[7, 14], [19, 12], [23, 34], [17, 32], [13, 35], [6, 33]], 'abcde'); K.rows(22, 9, ['b', ' b', 'b']);
      K.limb([[19, 16], [24, 22], [24, 26]], 3, 2.6, 'abcde', { rim: 1 }); K.poly([[24, 26], [27, 20], [29, 21], [26, 28]], 'fghij', { rim: 1 }); K.limb([[23, 26], [25, 30]], 1.6, 1.6, 'abcde');
      K.ell(15, 9, 5.4, 6, 'pqrst', { bias: 0.04 });
      K.ell(13, 6, 7, 5.4, 'klmno', { down: 0.3 }); K.limb([[8, 8], [6, 16]], 3, 1.6, 'klmno'); K.limb([[18, 7], [21, 14]], 2.6, 1.4, 'klmno');
      K.rows(9, 15, ['zY zY']); K.rows(13, 16, ['zzz']);
      return K.layers();
    } };
  // ---------- 雪粒童：雪做的小孩，圓滾滾的白身體，戴著一頂斗笠；臉頰有點藍 ----------
  HD.yukiko = { w: 26, h: 30, eyes: 'E',
    m: { abcde: '#E8F0F8', fghij: '#C8A060' },
    x: () => ({ E: '#2A3A5A', z: '#2A3A5A', p: '#9AC0E8' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.ell(13, 21, 8, 7, 'abcde', { down: 0.25 }); K.limb([[10, 26], [9, 29]], 3, 2.6, 'abcde'); K.limb([[16, 26], [17, 29 - d]], 3, 2.6, 'abcde', { rim: 1 });
      K.ell(13, 11, 6, 5.6, 'abcde', { rim: 1, bias: 0.04 });
      K.poly([[3, 8], [13, 2], [23, 8], [22, 9], [4, 9]], 'fghij', { rim: 1 }); K.rows(5, 10, ['ggggg']);
      K.rows(11, 10, ['E  E']); K.rows(13, 9, ['p    p']); K.rows(14, 12, ['zz']);
      return K.layers();
    } };
  // ==== E1 完 ====
  // ==== E2 ====
  // ---------- 獨足鍛：只有一隻腳、一隻眼睛的鍛冶匠，褐色的工作服、皮圍裙，舉著一把大鐵鎚；獨眼是火紅色的 ----------
  HD.datara = { w: 30, h: 44, eyes: 'Y',
    m: { abcde: '#6A4A32', klmno: '#5A5A64', pqrst: '#C89A72', fghij: '#3A2A1E' },
    x: () => ({ Y: '#FF9A3A', z: '#140A06' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[14, 32], [14, 42]], 5, 4.4, 'pqrst', { rim: 1 }); K.ell(14, 42, 4, 1.6, 'fghij');
      K.poly([[7, 14], [21, 14], [22, 33], [6, 33]], 'abcde'); K.poly([[9, 20], [19, 20], [19, 32], [9, 32]], 'fghij', { flat: 2 });
      K.limb([[20, 16], [25, 12], [24, 7 - d]], 3.4, 3, 'pqrst', { rim: 1 }); K.limb([[24, 9 - d], [24, 1]], 1.6, 1.6, 'abcde'); K.poly([[19, 1 - d], [29, 1 - d], [29, 6 - d], [19, 6 - d]], 'klmno', { rim: 1 });
      K.limb([[8, 16], [5, 24], [7, 28]], 3.4, 3, 'pqrst');
      K.ell(14, 8, 6, 6.4, 'pqrst', { rim: 1, bias: 0.04 }); K.poly([[8, 4], [20, 4], [19, 2], [9, 2]], 'fghij');
      K.rows(6, 12, ['zzzz', 'zYYz', 'zzzz']); K.rows(12, 13, ['zzz']);
      return K.layers();
    } };
  // ---------- 抱嬰鳥：白色的大水鳥（像鷺），彎彎的長脖子、懷裡抱著一團布包；紅眼 ----------
  HD.ubume = { w: 38, h: 30, eyes: 'R',
    m: { abcde: '#ECE8E0', fghij: '#E8B83A', klmno: '#B8A8C8' },
    x: () => ({ R: '#E83A3A', z: '#1A1414' }),
    pix(f, K) {
      const d = f ? 2 : 0;
      K.poly([[14, 12], [2, 6 + d], [5, 12 + d], [3, 18 + d], [12, 18]], 'abcde', { rim: 1 });
      K.limb([[16, 22], [15, 29]], 1.4, 1, 'fghij'); K.limb([[20, 22], [21, 29]], 1.4, 1, 'fghij');
      K.ell(18, 16, 8, 6.4, 'abcde', { down: 0.3 }); K.ell(21, 18, 4, 3.4, 'klmno', { rim: 1 });
      K.limb([[22, 12], [26, 6], [29, 5]], 3, 2.4, 'abcde', { rim: 1 }); K.ell(30, 5, 3, 2.6, 'abcde', { rim: 1 }); K.poly([[32, 4], [38, 6], [32, 7]], 'fghij');
      K.rows(4, 30, ['R']);
      return K.layers();
    } };
  // ---------- 焚車貓：拖著一個著火車輪的黑貓——後面一個燒得正旺的木輪（橘紅的火），前面一隻黑貓，綠眼 ----------
  HD.kasha = { w: 44, h: 32, eyes: 'E',
    m: { abcde: '#2E2A34', klmno: '#7A4A2A', fghij: '#FF8A2A', pqrst: '#FFE07A' },
    x: () => ({ E: '#9AFF6A', z: '#0E0C10' }),
    pix(f, K) {
      const d = f ? 1 : 0, C = [12, 18];
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + (f ? 0.4 : 0); K.poly([[C[0] + Math.cos(a - 0.3) * 9, C[1] + Math.sin(a - 0.3) * 9], [C[0] + Math.cos(a) * 14, C[1] + Math.sin(a) * 14], [C[0] + Math.cos(a + 0.3) * 9, C[1] + Math.sin(a + 0.3) * 9]], i % 2 ? 'fghij' : 'pqrst'); }
      K.ell(C[0], C[1], 10, 10, 'klmno'); K.ell(C[0], C[1], 7, 7, 'klmno', { flat: 0 }); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - (f ? 0.4 : 0); K.limb([C, [C[0] + Math.cos(a) * 7, C[1] + Math.sin(a) * 7]], 2, 2, 'klmno'); }
      K.limb([[24, 26], [23 - d, 31]], 2.6, 2.2, 'abcde'); K.limb([[36, 26], [38 + d, 31]], 2.6, 2.2, 'abcde');
      K.limb([[22, 22], [30, 22], [37, 20]], 8, 7, 'abcde'); K.limb([[22, 21], [18, 16], [19, 11 - d]], 2.4, 1.6, 'abcde');
      K.limb([[26, 26], [25 + d, 31]], 2.8, 2.4, 'abcde', { rim: 1 }); K.limb([[37, 25], [39 - d, 31]], 2.8, 2.4, 'abcde', { rim: 1 });
      K.ell(39, 16, 5, 4.4, 'abcde', { rim: 1 }); K.poly([[35, 13], [36, 8], [38, 12]], 'abcde'); K.poly([[40, 12], [42, 8], [43, 14]], 'abcde');
      K.rows(15, 38, ['zE zE']);
      return K.layers();
    } };
  // ---------- 墜桶：從樹上掉下來的大頭——頭頂一根髮髻、粗眉毛、瞪大的眼睛、咧開的嘴 ----------
  HD.tsurube = { w: 32, h: 38, eyes: 'E',
    m: { abcde: '#E8C8A8', fghij: '#1A1418' },
    x: () => ({ E: '#2A1A10', W: '#F8F4EC', z: '#2A1010', m: '#8A2A2A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[16, 1], [16, 6]], 1.6, 1.6, 'fghij'); K.ell(16, 7, 3, 2.4, 'fghij');
      K.ell(16, 22 + d, 13, 13, 'abcde', { down: 0.25, bias: 0.08 });
      K.ell(16, 13 + d, 13, 5.4, 'fghij', { down: 0.3 }); K.limb([[4, 14 + d], [4, 22 + d]], 3, 2, 'fghij'); K.limb([[28, 14 + d], [28, 22 + d]], 3, 2, 'fghij');
      K.rows(17 + d, 7, ['zzzzz     zzzzz']); K.rows(19 + d, 8, ['WWWE      WWWE', 'WWEE      WWEE']);
      K.rows(28 + d, 10, ['zzzzzzzzzzzz', ' zmmmmmmmmz', '  zzzzzzzz']);
      return K.layers();
    } };
  // ---------- 預言犢：小牛的身體（米色、短腿），臉卻是一張人臉（黑髮、平靜的表情） ----------
  HD.kudan = { w: 38, h: 28, eyes: 'E',
    m: { abcde: '#C8A878', pqrst: '#F0D8C0', fghij: '#1A1418' },
    x: () => ({ E: '#1A1014', z: '#2A1A14' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[8, 20], [7 - d, 27]], 3.4, 3, 'abcde'); K.limb([[24, 20], [26 + d, 27]], 3.4, 3, 'abcde');
      K.limb([[6, 14], [2, 18]], 1.6, 1.2, 'abcde');
      K.ell(16, 15, 11, 7, 'abcde', { down: 0.3 }); [[10, 12], [18, 16]].forEach(([x, y]) => K.ell(x, y, 3, 2.2, 'aabbb', { flat: 1 }));
      K.limb([[10, 21], [9 + d, 27]], 3.6, 3.2, 'abcde', { rim: 1 }); K.limb([[23, 21], [24 - d, 27]], 3.6, 3.2, 'abcde', { rim: 1 });
      K.ell(30, 12, 5.6, 6, 'pqrst', { rim: 1, bias: 0.06 }); K.poly([[24, 6], [36, 6], [36, 11], [33, 8], [27, 8], [24, 11]], 'fghij');
      K.rows(11, 28, ['E E']); K.rows(15, 29, ['zz']); K.poly([[24, 7], [21, 4], [25, 6]], 'abcde');
      return K.layers();
    } };
  // ---------- 翻枕影：小小的光頭人影，穿著紫白條紋的睡衣，半瞇著眼；手裡抱著一顆枕頭 ----------
  HD.makura = { w: 26, h: 34, eyes: 'E',
    m: { abcde: '#E8E4F0', klmno: '#6A4A8A', pqrst: '#D8C0A8' },
    x: () => ({ E: '#2A1A2A', z: '#2A1A2A' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.poly([[7, 13], [19, 13], [20, 32], [6, 32]], 'abcde'); for (let y = 15; y < 32; y += 3) K.rows(y, 6, ['mmmmmmmmmmmmmmm']);
      K.ell(16, 21 - d, 5, 3.4, 'abcde', { rim: 1 }); K.rows(20 - d, 13, ['l     l']);
      K.ell(13, 7, 5.4, 5.6, 'pqrst', { rim: 1, bias: 0.06 }); K.rows(7, 10, ['zz zz']); K.rows(10, 12, ['zz']);
      return K.layers();
    } };
  // ---------- 捧盤童：戴著大斗笠的小孩，藍色的衣服，雙手捧著一盤白白方方的豆腐 ----------
  HD.tofuko = { w: 30, h: 32, eyes: 'E',
    m: { abcde: '#4A6AA8', fghij: '#C8A060', pqrst: '#F0E0C8', klmno: '#F4F2EC' },
    x: () => ({ E: '#1A1410', z: '#1A1410' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[11, 26], [10, 31]], 2.6, 2.2, 'pqrst'); K.limb([[17, 26], [18 + d, 31]], 2.6, 2.2, 'pqrst', { rim: 1 });
      K.poly([[8, 14], [20, 14], [21, 27], [7, 27]], 'abcde');
      K.poly([[16, 17 - d], [28, 17 - d], [27, 19 - d], [17, 19 - d]], 'fghij', { rim: 1 }); K.poly([[19, 13 - d], [25, 13 - d], [25, 17 - d], [19, 17 - d]], 'klmno', { rim: 1 });
      K.limb([[18, 17], [21, 18 - d]], 2.4, 2, 'pqrst', { rim: 1 });
      K.ell(14, 9, 5, 5, 'pqrst', { rim: 1, bias: 0.06 }); K.poly([[2, 7], [14, 1], [26, 7], [25, 8], [3, 8]], 'fghij', { rim: 1 });
      K.rows(10, 12, ['E E']); K.px(14, 12, 'z');
      return K.layers();
    } };
  // ---------- 陶片將：青花瓷碎片拼成的武士——白底藍紋的盔甲（一片一片有裂縫），頭盔、圓盾；縫裡透出藍光 ----------
  HD.setosho = { w: 34, h: 46, eyes: 'B',
    m: { abcde: '#E8ECF0', pqrst: '#3A6AB8' },
    x: () => ({ B: '#5AC8FF', z: '#1A2030' }),
    pix(f, K) {
      const d = f ? 1 : 0;
      K.limb([[13, 32], [12 - d, 44]], 4.4, 4, 'abcde'); K.limb([[20, 32], [21 + d, 44]], 4.4, 4, 'abcde', { rim: 1 });
      K.poly([[8, 14], [24, 14], [25, 33], [7, 33]], 'abcde'); K.rows(16, 9, ['q  qq  q', ' qq  qq', '', 'q q q q q', '', '  qqq  qq']); K.rows(26, 9, ['zz   z  zz', ' z  zz   z']);
      K.limb([[24, 16], [28, 24], [27, 30]], 3.6, 3, 'abcde', { rim: 1 });
      K.ell(6, 24, 6, 7, 'abcde', { rim: 1 }); K.rows(20, 3, [' qqq', 'q   q', 'q q q', 'q   q', ' qqq']);
      K.ell(16, 8, 6, 6, 'abcde', { rim: 1, bias: 0.04 }); K.poly([[9, 6], [16, 1], [23, 6], [24, 8], [8, 8]], 'pqrst', { rim: 1 });
      K.rows(9, 13, ['zzzzzz', 'zBzzBz']);
      return K.layers();
    } };
  // ==== E2 完 ====
  // ==== 樣本・狼的畫法 ====
  // ==== 2026-10-10 作者：不要球體畫法，照一開始的狼那樣（輪廓一列一列、平塗＋上緣亮邊＋下緣右緣暗邊、細節一格一格）——樣本三隻 ====
  // ---------- 三連貂：灰白的鼬，脖子圍著一條巾（絆＝藍、斬＝紅、癒＝綠），前腳舉著一把彎鐮刀；尾巴往後翹 ----------
  HD.kamaitachi = { w: 36, h: 20, eyes: 'E',
    m: { abcde: '#C9D6E0', fghij: '#8A9AA6', klmno: '#8AA4C4' },
    x: role => ({ s: { trip: '#3A6ACF', cut: '#C8323A', heal: '#3E9A5A' }[role] || '#C8323A', S: { trip: '#7A9AF0', cut: '#F06A6A', heal: '#7ACF8A' }[role] || '#F06A6A', E: '#1A4A6A', z: '#20242A', p: '#E8A0B0' }),
    pix(f, K) {
      const sp = [];
      // 尾巴（往後上翹）
      (f ? [[3, 2, 3], [4, 2, 4]] : [[3, 1, 2], [4, 1, 3]]).forEach(r => sp.push([...r, 'T']));
      [[5, 2, 4], [6, 3, 5], [7, 4, 6], [8, 5, 8], [9, 6, 8]].forEach(r => sp.push([...r, 'T']));
      // 身體（背拱起來）
      [[8, 9, 24], [9, 7, 26], [10, 6, 27], [11, 6, 27], [12, 6, 27], [13, 7, 26], [14, 9, 24]].forEach(r => sp.push([...r, 'B']));
      // 頭（耳朵、往前收尖的口鼻）
      [[2, 28, 29], [3, 27, 30], [4, 26, 32], [5, 25, 33], [6, 25, 34], [7, 25, 34], [8, 25, 33], [9, 26, 31]].forEach(r => sp.push([...r, 'H']));
      // 腳（遠的暗、近的亮；兩幀前後換）
      (f ? [[15, 10, 11], [16, 10, 11], [17, 10, 11], [18, 10, 12], [15, 21, 22], [16, 22, 23], [17, 22, 23], [18, 22, 24]] : [[15, 10, 11], [16, 10, 11], [17, 9, 10], [18, 9, 11], [15, 21, 22], [16, 21, 22], [17, 21, 22], [18, 21, 23]]).forEach(r => sp.push([...r, 'F']));
      (f ? [[15, 12, 13], [16, 12, 13], [17, 11, 12], [18, 11, 13], [15, 24, 25], [16, 24, 25], [17, 24, 25], [18, 24, 26]] : [[15, 12, 13], [16, 12, 13], [17, 12, 13], [18, 12, 14], [15, 24, 25], [16, 24, 25], [17, 25, 26], [18, 25, 27]]).forEach(r => sp.push([...r, 'N']));
      // 舉著的鐮刀（月牙形）＋拿刀的前腳
      [[13, 26, 29]].forEach(r => sp.push([...r, 'N']));
      [[10, 30, 32], [11, 30, 33], [12, 31, 34], [13, 32, 34], [14, 33, 34], [15, 34, 34]].forEach(r => sp.push([...r, 'K']));
      K.cel('TFBNHK', { T: 'fghij', F: 'fghij', B: 'abcde', N: 'abcde', H: 'abcde', K: 'klmno' }, sp);
      // 細節：巾（往後飄）、眼睛、鼻子、耳朵內側、背上的亮毛
      K.rows(9, 24, ['sSs', 'sSss', ' ss']); K.rows(f ? 7 : 8, 20, ['ss', ' s']);
      K.rows(5, 30, ['zEE']); K.px(34, 6, 'z'); K.px(28, 3, 'p');
      K.rows(9, 12, ['e    e']); K.rows(8, 16, ['ee']);
      return K.layers();
    } };
  // ---------- 游焰：藍色的鬼火（2026-10-10 作者：像寶石——不要深色外框、不要對稱的水滴形）：
  // 火是發光的，不描黑邊；三條高低不一、往兩邊歪的火舌，上面飄兩點小火星；從邊緣往裡一層層變亮，最亮的芯在下半部（火的根），火舌尖比較暗；兩顆深色的眼睛 ----------
  HD.onibi = { w: 26, h: 30,
    pal: () => ({ 2: '#1E4E9E', 3: '#3A86D2', 4: '#6CC0F4', 5: '#A8E4FF', 6: '#DDF6FF', z: '#0E1E36' }),
    ol: { '*': ['#1E4E9E', '#1E4E9E'], bare: '23456z' },
    pix(f) {
      const W = 26, H = 30, m = Array.from({ length: H }, () => Array(W).fill(0)), sp = (y, x0, x1) => { for (let x = x0; x <= x1; x++) m[y][x] = 1; };
      // 火舌（兩幀左右搖）
      const L = f ? [[7, 4, 4], [8, 4, 5], [9, 5, 7]] : [[7, 5, 5], [8, 5, 6], [9, 6, 7]];   // 左邊矮、往左歪
      const C = f ? [[3, 12, 12], [4, 11, 12], [5, 11, 13], [6, 10, 13], [7, 10, 13], [8, 10, 14], [9, 9, 14]] : [[3, 11, 11], [4, 11, 12], [5, 11, 12], [6, 10, 13], [7, 10, 13], [8, 10, 14], [9, 9, 14]];
      const Rt = f ? [[5, 20, 20], [6, 20, 20], [7, 19, 20], [8, 18, 20], [9, 17, 20]] : [[5, 21, 21], [6, 20, 21], [7, 19, 20], [8, 18, 20], [9, 17, 20]];   // 右邊細、往右歪
      [...L, ...C, ...Rt].forEach(([y, x0, x1]) => sp(y, x0, x1));
      [[10, 6, 15], [10, 17, 21], [11, 6, 21], [12, 6, 21], [13, 6, 20], [14, 5, 21], [15, 4, 21], [16, 4, 22], [17, 4, 22], [18, 4, 22], [19, 4, 22], [20, 4, 22], [21, 4, 21], [22, 5, 21], [23, 5, 20], [24, 6, 20], [25, 7, 19], [26, 8, 17], [27, 10, 15]].forEach(([y, x0, x1]) => sp(y, x0, x1));
      // 從邊緣往裡的距離 → 一層層變亮；最亮的芯在下半部；火舌尖（上面）最多到第 4 階
      const out = Array.from({ length: H }, () => Array(W).fill(' '));
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
        if (!m[y][x]) continue; let d = 0;
        for (let r = 1; r < 6; r++) { let ok = true; for (let dy = -r; dy <= r && ok; dy++) for (let dx = -r; dx <= r; dx++) { const yy = y + dy, xx = x + dx; if (yy < 0 || yy >= H || xx < 0 || xx >= W || !m[yy][xx]) { ok = false; break; } } if (!ok) break; d = r; }
        let t = d === 0 ? 2 : d === 1 ? 3 : d <= 3 ? 4 : 5;
        if (y < 11) t = Math.min(t, 4);
        const cx = (x + 0.5 - 13) / 4.4, cy = (y + 0.5 - 21.5) / 3.4; if (cx * cx + cy * cy < 1) t = 6;
        out[y][x] = String(t);
      }
      // 小火星、眼睛
      (f ? [[1, 15], [2, 4]] : [[1, 14], [3, 4]]).forEach(([y, x]) => { out[y][x] = '3'; });
      [[17, 9], [18, 9], [19, 9], [17, 10], [18, 10], [19, 10], [17, 15], [18, 15], [19, 15], [17, 16], [18, 16], [19, 16]].forEach(([y, x]) => { out[y][x] = 'z'; });
      return out.map((r, y) => [y, 0, r.join('')]);
    } };
  // ---------- 領主體・熔顎蜥：岩石一樣的暗色厚皮、身上一條條發光的岩漿裂紋、背上一排往後斜的岩刺；張著大嘴（嘴裡熔岩的橘光、上下一排尖牙） ----------
  HD.lavajaw = { w: 68, h: 44, eyes: 'Y',
    m: { abcde: '#5A3E36', fghij: '#33231F', ABCDE: '#6A4A40' },
    x: () => ({ L: '#FFB43A', l: '#E0601E', M: '#FF8A2A', N: '#8A1E10', Y: '#FFE04A', w: '#E8DCC4', z: '#1A0E0C' }),
    pix(f, K) {
      const d = f ? 1 : 0, sp = [];
      // 尾巴
      [[21, 9, 14], [22, 6, 14], [23, 4, 14], [24, 2, 13], [25, 1, 10], [26, 1, 6], [27 - d, 1, 3]].forEach(r => sp.push([...r, 'T']));
      // 遠的兩隻腳
      const legF = (x, k) => { for (let y = 29; y <= 37; y++) sp.push([y, x - 1 + Math.floor((y - 29) * k), x + 5 + Math.floor((y - 29) * k), 'F']); sp.push([38, x + Math.floor(9 * k) - 2, x + 6 + Math.floor(9 * k), 'F']); };
      legF(18 - d, -0.3); legF(40 + d, 0.3);
      // 身體
      [[18, 22, 38], [19, 18, 42], [20, 16, 44], [21, 15, 45], [22, 14, 46], [23, 14, 46], [24, 14, 46], [25, 14, 46], [26, 14, 46], [27, 14, 46], [28, 15, 45], [29, 17, 43], [30, 20, 40]].forEach(r => sp.push([...r, 'B']));
      // 背上的岩刺（往後斜）
      [[20, 19, 6], [25, 18, 8], [30, 18, 8], [35, 18, 7], [40, 19, 5]].forEach(([cx, b, h]) => { for (let k = 0; k < h; k++) { const w = Math.max(1, Math.round(3 - k * 3 / h)), x0 = cx - 1 - Math.floor(k * 0.45); sp.push([b - k, x0, x0 + w - 1, 'S']); } });
      // 近的兩隻腳
      const legN = (x, k) => { for (let y = 30; y <= 37; y++) sp.push([y, x - 1 + Math.floor((y - 30) * k), x + 6 + Math.floor((y - 30) * k), 'N']); sp.push([38, x + Math.floor(8 * k) - 2, x + 8 + Math.floor(8 * k), 'N']); };
      legN(22 + d, -0.35); legN(44 - d, 0.3);
      // 頭（上顎）、張開的下顎
      [[13, 48, 56], [14, 46, 58], [15, 45, 60], [16, 44, 62], [17, 44, 64], [18, 44, 65], [19, 44, 66], [20, 44, 66], [21, 45, 65], [22, 44, 50], [23, 44, 49]].forEach(r => sp.push([...r, 'H']));
      [[24 + d, 48, 58], [25 + d, 47, 62], [26 + d, 47, 63], [27 + d, 48, 63], [28 + d, 50, 62]].forEach(r => sp.push([...r, 'J']));
      K.cel('TFBSNHJ', { T: 'abcde', F: 'fghij', B: 'abcde', S: 'ABCDE', N: 'abcde', H: 'abcde', J: 'abcde' }, sp);
      // 嘴裡的熔岩光、上下的尖牙
      K.rows(22, 51, ['NNMMMMMMMMMMMM']); K.rows(23, 50, ['NNNMMMMMMMMMMM']); if (d) K.rows(24, 50, ['NNMMMMMMMMMMM']);
      for (let x = 52; x <= 63; x += 3) { K.px(x, 22, 'w'); K.px(x + 1, 23 + d, 'w'); }
      // 眼睛（黃光、壓低的眉）、鼻孔
      K.rows(15, 54, ['aaa', ' zY']); K.px(64, 18, 'z');
      // 岩漿的裂紋
      [[20, 18, 'lLl'], [21, 21, 'lLLl'], [23, 26, 'lLl'], [24, 29, 'lLLLl'], [26, 33, 'lLl'], [22, 36, 'lLl'], [27, 20, 'lLLl'], [25, 40, 'lL'], [23, 6, 'lLl'], [16, 49, 'lLl']].forEach(([y, x, s]) => K.rows(y, x, [s]));
      // 爪子、背上的亮點
      K.rows(39, 19 + d, ['w w w']); K.rows(39, 46 - d, ['w w w']); K.rows(19, 24, ['e   e    e']);
      return K.layers();
    } };
  // ==== 樣本・狼的畫法 完 ====
  // ==== 巨獸一 ====
  // ==== 2026-10-10 作者：其他也要照狼的畫法；巨獸太可愛了——頭小、眼睛細長往上斜壓在眉骨下、張嘴露牙、輪廓有棱角、爪子和刺，顏色暗、重點色是血紅和病態的綠 ====
  // 腳上的剛毛：沿著一條腳的上側每隔幾格冒一根
  const bristle = (K, p, w, ch, step) => { for (let i = 0; i + 1 < p.length; i++) { const [x0, y0] = p[i], [x1, y1] = p[i + 1], L = Math.hypot(x1 - x0, y1 - y0) || 1; let nx = -(y1 - y0) / L, ny = (x1 - x0) / L; if (ny > 0) { nx = -nx; ny = -ny; } for (let t = step / 2; t < L; t += step) K.px(x0 + (x1 - x0) * t / L + nx * (w / 2 + 0.6), y0 + (y1 - y0) * t / L + ny * (w / 2 + 0.6), ch); } };
  // ---------- 領主體・巢織蛛：黑色的巨蛛，前面一對腳高高舉起來；腹部背上一排血紅的箭頭紋、側面一個沙漏紋；八顆紅眼擠在眉骨下面，一對大螯牙滴著綠色的毒；腳上一根根剛毛 ----------
  HD.tsuchigumo = { w: 128, h: 84, eyes: 'RQ',
    m: { abcde: '#2E2A36', fghij: '#1A1720', klmno: '#36303E', uvwxy: '#C8B8A0' },
    x: () => ({ R: '#FF3A2A', Q: '#9A1414', M: '#B01E1E', N: '#5A0E0E', G: '#7AE04A', z: '#0C0A10' }),
    pix(f, K) {
      const d = f ? 2 : 0, S = [];
      [[[94, 40], [104, 22 + d], [112, 12 + d], [118, 17 + d]], [[88, 44], [100, 30], [108, 36], [110, 79]], [[78, 46], [64, 28], [56, 34], [48, 79]], [[72, 44], [46, 22], [34, 30], [20, 79]]].forEach(p => { S.push(...K.ls(p, 8.4, 3.6, 'F')); S.push(...K.og(p[1][0], p[1][1], 4, 4, 'F', 0, 8)); });
      S.push(...K.ps([[20, 38], [28, 26], [44, 19], [60, 21], [70, 31], [73, 44], [66, 56], [50, 62], [32, 60], [20, 52], [15, 45]], 'A'), ...K.ps([[11, 43], [17, 41], [19, 50], [13, 51]], 'A'));
      S.push(...K.ps([[67, 40], [76, 33], [90, 30], [100, 34], [106, 43], [101, 52], [88, 56], [74, 54], [66, 48]], 'B'));
      S.push(...K.ls([[99, 50], [105, 58], [103, 67]], 8.4, 2.4, 'K'), ...K.ls([[93, 52], [98, 60], [96, 68]], 7.4, 2.4, 'K'));
      const near = [[[96, 40], [108, 17 - d], [118, 7 - d], [125, 13 - d]], [[92, 46], [106, 28], [114, 34], [120, 79]], [[80, 50], [70, 26], [62, 32], [58, 79]], [[74, 48], [52, 18], [40, 26], [30, 79]]];
      near.forEach(p => { S.push(...K.ls(p, 10, 4, 'N')); S.push(...K.og(p[1][0], p[1][1], 5, 5, 'N', 0, 8), ...K.og(p[2][0], p[2][1], 4, 4, 'N', 0, 8)); });
      K.cel('FABNK', { F: 'fghij', A: 'abcde', B: 'abcde', N: 'klmno', K: 'uvwxy' }, S);
      near.forEach(p => bristle(K, p, 10, 'k', 4));
      [[44, 19], [52, 19.5], [30, 24], [60, 21]].forEach(([x, y]) => K.rows(y - 2, x, ['k', 'k']));   // 腹部的剛毛
      // 血紅的箭頭紋（指向頭）、側面的沙漏紋
      [[24, 33], [36, 28], [49, 26]].forEach(([x, y]) => K.rows(y - 2, x, ['NM', ' NMM', '  NMM', ' NMM', 'NM']));
      K.rows(42, 40, ['NMMMMN', ' NMMN', '  MM', ' NMMN', 'NMMMMN']);
      // 眉骨、八顆眼睛、毒液
      K.rows(33, 87, ['aaaaaaaaaaaaaa', ' aaaa    aaaa']);
      K.rows(35, 89, ['zRz  zRz  zRz', '', ' zRRz  zRRz', ' zQRz  zQRz']);
      K.rows(67 - d / 2, 102, ['G', 'G']); K.px(96, 68, 'G');
      return K.layers();
    } };
  // ---------- 領主體・千節蟲：暗紅黑色的巨大蜈蚣，一節一節的背甲邊緣帶刺（接縫看得出來）、橘色的尖腳；頭上觸角往後掃，一對深色的大毒顎張開，眼睛細長發黃光 ----------
  HD.omukade = { w: 144, h: 52, eyes: 'R',
    m: { abcde: '#5A1C16', klmno: '#C86A2A', fghij: '#6A3A1A', pqrst: '#2A0E0A' },
    x: () => ({ R: '#FFD04A', z: '#120604' }),
    pix(f, K) {
      const N = 13, X0 = 14, DX = 8.4, cy = i => 28 + Math.sin(i * 0.7 + (f ? 0.9 : 0)) * 1.6, S = [];
      for (let i = 0; i < N; i++) { const x = X0 + i * DX, y = cy(i), k = (i + f) % 2 ? 1 : -1; S.push(...K.ls([[x - 1, y + 3], [x - 5 + k, 38], [x - 8 + k * 2, 48]], 4.6, 2.2, 'F')); }
      S.push(...K.ls([[X0 - 2, cy(0) - 1], [X0 - 9, cy(0) - 6], [X0 - 12, cy(0) - 9]], 2.6, 1, 'F'), ...K.ls([[X0 - 2, cy(0) + 2], [X0 - 10, cy(0) + 5], [X0 - 13, cy(0) + 9]], 2.6, 1, 'F'));
      for (let i = 0; i < N; i++) { const x = X0 + i * DX, y = cy(i), r = 7.2 + Math.min(i, 3) * 0.3 - Math.max(0, i - 10) * 0.3, L = i % 2 ? 'C' : 'B';
        S.push(...K.ps([[x - r, y - r + 2], [x - 1, y - r], [x + r - 1, y - r + 2], [x + r, y + r - 1], [x - r + 1, y + r]], L), ...K.ps([[x - 2.4, y - r + 0.5], [x - 1, y - r - 4.5], [x + 1, y - r + 0.5]], L)); }
      for (let i = 0; i < N; i++) { const x = X0 + i * DX, y = cy(i), k = (i + f) % 2 ? -1 : 1; S.push(...K.ls([[x + 1, y + 4], [x + 5 + k, 38], [x + 4 + k * 2, 49]], 5.4, 2.4, 'N')); S.push(...K.og(x + 5 + k, 38, 2.6, 2.6, 'N', 0, 6)); }
      const hx = X0 + N * DX + 1, hy = cy(N) - 1;
      S.push(...K.ls([[hx + 2, hy - 5], [hx - 4, hy - 14], [hx - 12, hy - 18 + (f ? 1 : 0)]], 2.4, 1, 'F'), ...K.ls([[hx + 4, hy - 5], [hx + 1, hy - 16], [hx - 5, hy - 22 + (f ? 1 : 0)]], 2.4, 1, 'N'));
      S.push(...K.ps([[hx - 7, hy - 6], [hx + 4, hy - 8], [hx + 10, hy - 3], [hx + 9, hy + 4], [hx + 2, hy + 7], [hx - 7, hy + 6]], 'H'));
      S.push(...K.ls([[hx + 6, hy + 3], [hx + 13, hy + 3], [hx + 15, hy + 8], [hx + 12, hy + 12]], 5.4, 1.8, 'P'), ...K.ls([[hx + 4, hy + 5], [hx + 10, hy + 8], [hx + 10, hy + 13], [hx + 7, hy + 14]], 5, 1.8, 'P'));
      K.cel('FBCNHP', { F: 'fghij', B: 'abcde', C: 'abcde', N: 'klmno', H: 'abcde', P: 'pqrst' }, S);
      K.rows(Math.round(hy - 5), Math.round(hx), ['aaaaa', ' zzRR', '  zz']);
      return K.layers();
    } };
  // ---------- 領主體・地出巨骸：從地上的黑洞裡爬出來的巨大骷髏——有棱角的頭骨、往中間壓的眉骨、深深的眼窩裡一點紅光、裂開的頭蓋骨、上下兩排尖牙（下顎張開）；肋骨一根根、細長的骨爪摳著洞口 ----------
  HD.gashadokuro = { w: 152, h: 128, eyes: 'RQ',
    m: { abcde: '#D8CCAA', fghij: '#9A8E72', VWXYZ: '#4A3A2E', pqrst: '#120A0C' },
    x: () => ({ R: '#FF3A2A', Q: '#8A1414', z: '#0E0808' }),
    pix(f, K) {
      const d = f ? 1 : 0, C = 76, S = [], ring = (cx, cy, rx, ry, n) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.283) * rx, cy + Math.sin(i / n * 6.283) * ry]);
      S.push(...K.ps(ring(C, 116, 60, 10.5, 20), 'V'));
      S.push(...K.ls([[C, 112], [C, 50 + d]], 13, 11, 'S'));
      for (let i = 0; i < 7; i++) { const y = 56 + d + i * 7.2, w = 31 - i * 1.6; S.push(...K.ls([[C - 3, y], [C - w * 0.6, y - 1], [C - w, y + 5], [C - w + 3, y + 11]], 6.6, 4.2, 'R'), ...K.ls([[C + 3, y], [C + w * 0.6, y - 1], [C + w, y + 5], [C + w - 3, y + 11]], 6.6, 4.2, 'R')); }
      [-1, 1].forEach(s => { const sh = [C + s * 32, 52 + d], el = [C + s * 50, 80 + d], wr = [C + s * 57, 103];
        S.push(...K.ls([[C + s * 4, 50 + d], [C + s * 20, 46 + d], sh], 7.4, 6.4, 'A'), ...K.og(sh[0], sh[1], 8, 7, 'A', 0, 10));
        S.push(...K.ls([sh, el], 12, 9, 'A'), ...K.og(el[0], el[1], 7, 6.4, 'A', 0, 10), ...K.ls([el, wr], 9.6, 7.4, 'A'), ...K.og(wr[0], wr[1], 6, 5.4, 'A', 0, 10));
        [-3, 0, 3, 6].forEach(k => S.push(...K.ls([wr, [wr[0] + s * (5 + k), 107 + Math.abs(k)], [wr[0] + s * (9 + k * 1.4), 112 + Math.abs(k) * 0.5], [wr[0] + s * (8 + k * 1.4), 116]], 4.8, 2, 'A'))); });
      S.push(...K.ps(ring(C, 117, 48, 6.6, 18), 'X'));
      // 頭骨（有棱角）、顴骨、下顎（張開）
      S.push(...K.ps([[52, 30], [54, 14], [64, 4], [76, 2], [88, 4], [98, 14], [100, 30], [96, 37], [91, 40], [89, 47], [63, 47], [61, 40], [56, 37]].map(([x, y]) => [x, y + d]), 'H'));   // 頭蓋寬、顴骨下面收窄
      S.push(...K.ps([[63, 49 + d * 2], [89, 49 + d * 2], [87, 58 + d * 2], [76, 61 + d * 2], [65, 58 + d * 2]], 'J'));
      K.cel('VSRAXHJ', { V: 'VWXYZ', S: 'fghij', R: 'abcde', A: 'abcde', X: 'ppppp', H: 'abcde', J: 'abcde' }, S);
      // 眉骨（又粗又往中間壓）、大大的深眼窩（斜的）＋裡面一點紅光
      K.rows(13 + d, 55, ['aaaa                                aaaa', ' aaaaaa                          aaaaaa', '    aaaaaaa                  aaaaaaa', '        aaaaaa          aaaaaa']);
      K.rows(17 + d, 59, ['  zzzzzz', ' zzzzzzzzz', 'zzzzzzzzzzz', 'zzzzzzzzzzzz', 'zzzzRRzzzzzz', 'zzzzQRzzzzz', ' zzzzzzzzz', '  zzzzzz']);
      K.rows(17 + d, 81, ['    zzzzzz', ' zzzzzzzzz', 'zzzzzzzzzzz', 'zzzzzzzzzzzz', 'zzzzzzRRzzzz', ' zzzzzRQzzzz', '  zzzzzzzzz', '    zzzzzz']);
      K.rows(27 + d, 72, [' zzzz', 'zzzzzz', 'zzzzzz', ' zzzz', '  zz']);   // 倒心形的鼻腔
      // 上排、下排的大尖牙（一顆一顆，中間暗縫）
      K.rows(40 + d, 62, Array(7).fill('z'.repeat(28)));
      for (let x = 62; x <= 86; x += 4) K.rows(40 + d, x, ['edd', 'dcc', 'dcc', 'dcb', ' cb', ' b']);
      K.rows(48 + d * 2, 65, ['z'.repeat(23), ' ' + 'z'.repeat(21)]);
      for (let x = 66; x <= 84; x += 4) K.rows(46 + d * 2, x, ['  ', ' c', 'dcc', 'cbb']);
      // 頭蓋骨的裂紋、肋骨間的黑
      K.rows(5 + d, C - 6, ['a', ' a', ' aa', '   a', '  a', '  a']); K.rows(10 + d, C + 13, ['a', ' a', ' a', '  aa', '    a']);
      return K.layers();
    } };
  // ---------- 領主體・霜冠鹿：冰原的巨鹿，壓低頭往前衝的姿勢——冰晶鹿角往前叉、鼻子噴出白霜；眼睛細長發青光壓在眉下；背上一排往後的冰刺、胸口一團結霜的鬃毛；蹄子深色 ----------
  HD.frostdeer = { w: 70, h: 64, eyes: 'GV',
    m: { abcde: '#B8CCE4', fghij: '#7C92B4', klmno: '#E8F2FC', PQRST: '#3A90D8' },
    x: () => ({ G: '#7AF0FF', V: '#2A8ACF', z: '#141E30', K: '#2A3448', W: '#D8F0FF' }),
    pix(f, K) {
      const d = f ? 1 : 0, S = [];
      S.push(...K.ls([[25, 42], [23, 50], [26, 55], [26 - d, 60]], 8.4, 5.4, 'F'), ...K.ls([[45, 42], [46 + d, 51], [47 + d, 60]], 8.4, 5.4, 'F'));
      S.push(...K.ps([[8, 31], [16, 23], [32, 20], [46, 21], [54, 27], [56, 38], [49, 46], [22, 47], [11, 43]], 'B'));
      S.push(...K.ps([[8, 30], [3, 25], [6, 31]], 'B'));   // 尾巴
      [[18, 25], [25, 22.5], [32, 22], [39, 22.5]].forEach(([x, y], i) => S.push(...K.ps([[x - 2, y + 1], [x - 4, y - 6 - (i % 2) * 2], [x + 2, y + 1]], 'I')));
      S.push(...K.ls([[21, 42], [17, 50], [20, 55], [19 + d, 60]], 9.6, 5.6, 'N'), ...K.og(17, 50, 4.4, 4.4, 'N', 0, 8), ...K.ls([[48, 42], [50 - d, 51], [49 - d, 60]], 9.6, 5.6, 'N'), ...K.og(50 - d, 51, 4.4, 4.4, 'N', 0, 8));
      S.push(...K.ps([[43, 24], [52, 19], [60, 24], [59, 36], [49, 40]], 'K'));   // 脖子（往前低）
      S.push(...K.ps([[53, 25], [60, 22], [66, 25], [69, 31], [67, 36], [61, 37], [55, 33]], 'H'));   // 頭（壓低）
      S.push(...K.ps([[52, 23], [47, 18], [54, 21]], 'H'));   // 耳朵往後貼
      S.push(...K.ps([[47, 30], [54, 33], [56, 40], [53, 38], [52, 43], [49, 38], [47, 42], [45, 36]], 'M'));   // 胸口的霜鬃
      // 冰晶鹿角：往前叉、每一枝都是尖的
      [[[57, 22], [56, 14], [60, 7], [67, 3]], [[56, 16], [50, 10], [48, 4]], [[59, 10], [63, 9], [67, 10]], [[61, 22], [64, 15], [68, 12]]].forEach(p => S.push(...K.ls(p, 4.6, 1.6, 'I')));
      K.cel('FBINKHM', { F: 'fghij', B: 'abcde', I: 'PQRST', N: 'abcde', K: 'abcde', H: 'abcde', M: 'klmno' }, S);
      K.rows(26, 58, ['aaaa', ' zGG', '  zz']);   // 壓低的眉、細長的青光眼
      K.rows(33, 67, ['z']); K.rows(35, 61, ['aaaaa']);   // 鼻孔、嘴線
      K.rows(34 - d, 68, ['W', ' W']); K.rows(37 + d, 67, ['W W']);   // 噴出的白霜
      [[16, 60], [20 + d, 60], [24, 60], [26 - d, 60], [46, 60], [48 + d, 60], [48 - d, 60]].forEach(([x, y]) => K.rows(y, x - 2, ['KKKK', 'KKKK']));   // 蹄
      K.rows(27, 22, ['e   e   e']);
      return K.layers();
    } };
  // ==== 巨獸一 完 ====
  // ==== 巨獸二 ====
  // ---------- 領主體・沙暴鯨：從沙裡衝出來的巨鯨——張開的大嘴（暗紅的嘴裡、上下一排尖牙），小小的紅眼、背上一排骨刺、身上的舊傷疤；淺色的肚子，下半身埋在沙浪裡 ----------
  HD.sandwhale = { w: 72, h: 40, eyes: 'R',
    m: { abcde: '#6A5A4C', pqrst: '#D8CCB0', uvwxy: '#E8DCC0', fghij: '#C8A870' },
    x: () => ({ Q: '#7A1E1E', z: '#140A08', R: '#FF3A2A', W: '#F0E8D8' }),
    pix(f, K) {
      const d = f ? 1 : 0, S = [];
      S.push(...K.ps([[8, 24], [1, 15 - d], [4, 16 - d], [10, 21]], 'T'), ...K.ps([[8, 27], [1, 33 + d], [6, 32 + d], [11, 28]], 'T'));
      [[20, 17.5], [28, 15], [36, 13.5], [44, 12], [52, 11.5]].forEach(([x, y]) => S.push(...K.ps([[x - 2, y + 1], [x - 4.5, y - 4.5], [x + 2, y + 1]], 'S')));
      S.push(...K.ps([[6, 24], [14, 19], [28, 15], [44, 12], [58, 11], [66, 13], [70, 16], [69, 20], [58, 21], [44, 23], [28, 26], [12, 28]], 'B'));
      S.push(...K.ps([[12, 28], [28, 26], [41, 25], [41, 31], [28, 32], [14, 31]], 'P'));
      S.push(...K.ps([[40, 25 + d], [56, 24 + d], [68, 25 + d], [66, 30 + d], [52, 32], [40, 31]], 'J'));
      S.push(...K.ps([[0, 36], [10, 32], [22, 34], [34, 31], [48, 33], [60, 30], [71, 33], [71, 39], [0, 39]], 'D'));
      K.cel('TSBPJD', { T: 'abcde', S: 'uvwxy', B: 'abcde', P: 'pqrst', J: 'abcde', D: 'fghij' }, S);
      // 嘴裡（暗紅）、上下的尖牙
      for (let y = 21; y <= 23 + d; y++) K.rows(y, 45, [(y === 21 ? 'zz' : 'zzz') + 'Q'.repeat(y === 21 ? 22 : 20)]);
      for (let x = 47; x <= 66; x += 3) { K.rows(21, x, ['W', 'W']); K.rows(23 + d, x + 1, ['W']); K.px(x + 1, 22 + d, 'W'); }
      K.rows(14, 56, ['aaa', ' zR']);   // 壓低的眉、小紅眼
      K.rows(16, 30, ['a', ' a', '  a']); K.rows(18, 22, ['a', ' a']);   // 舊傷疤
      [[36, 15], [41, 14], [48, 14]].forEach(([x, y]) => K.rows(y, x, ['e', 'c']));
      [[6, 30], [64, 27], [24, 31], [50, 30], [70, 31], [36, 28]].forEach(([x, y], i) => K.px(x, y - ((i + d) % 2) * 2, i % 2 ? 'h' : 'i'));
      return K.layers();
    } };
  // ---------- 領主體・深淵王蛸：深紫黑色的巨蛸——頭罩一樣有稜角的外套膜、上面一排棘；細長發黃光的眼睛（橫的瞳孔、厚厚的眼皮）、兩眼中間一張骨色的鳥喙；觸手往外攤開，外側一排倒鉤、內側吸盤 ----------
  HD.kraken = { w: 64, h: 60, eyes: 'Y',
    m: { abcde: '#4A2458', fghij: '#2A1434', pqrst: '#D890B8' },
    x: () => ({ Y: '#FFD84A', z: '#0C0610', w: '#E8DCC4' }),
    pix(f, K) {
      const d = f ? 5 : 0, S = [];
      [curlPts(25, 32, 140, 5.4, 20 - d, 6), curlPts(39, 32, 40, 5.4, -20 + d, 6), curlPts(29, 34, 100, 5.4, 16 + d, 6), curlPts(35, 34, 80, 5.4, -16 - d, 6)].forEach(p => S.push(...K.ls(p, 10, 2.4, 'U')));
      S.push(...K.ps([[32, 3], [40, 6], [46, 12], [48, 20], [46, 28], [40, 33], [24, 33], [18, 28], [16, 20], [18, 12], [24, 6]], 'M'));
      // 外套膜邊緣往外長的棘（有稜有角，不再是圓頂）
      [[[19, 13], [11, 8], [18, 17]], [[23, 7], [17, 1], [25, 6]], [[30, 4], [32, 0.5], [34, 4]], [[45, 13], [53, 8], [46, 17]], [[41, 7], [47, 1], [39, 6]], [[17, 22], [11, 22], [17, 26]], [[47, 22], [53, 22], [47, 26]]].forEach(p => S.push(...K.ps(p, 'M')));
      const T = [curlPts(22, 31, 158, 6.4, 22 - d, 7), curlPts(27, 33, 118, 6.2, 18 + d, 7), curlPts(37, 33, 62, 6.2, -18 - d, 7), curlPts(42, 31, 22, 6.4, -22 + d, 7)];
      T.forEach(p => S.push(...K.ls(p, 11, 2.6, 'T')));
      K.cel('UMT', { U: 'fghij', M: 'abcde', T: 'abcde' }, S);
      T.forEach((p, i) => { for (let k = 1; k < p.length - 1; k++) { const [x, y] = p[k], [x2, y2] = p[k + 1], L = Math.hypot(x2 - x, y2 - y) || 1, nx = -(y2 - y) / L, ny = (x2 - x) / L, s = i < 2 ? -1 : 1, w = 4 - k * 0.4; K.px(x + nx * w * s * 0.7, y + ny * w * s * 0.7, 's'); if (k % 2) K.px(x - nx * (w * 0.7 + 1) * s, y - ny * (w * 0.7 + 1) * s, 'w'); } });
      // 厚眼皮、細長的黃眼（橫的瞳孔）、鳥喙
      K.rows(20, 17, ['aa', 'aaaaa', ' aaaaaaaa', '  zYYYYaa', '   zYzzYz', '    zzzz']); K.rows(20, 38, ['        aa', '     aaaaa', ' aaaaaaaa', ' aaYYYYz', ' zYzzYz', '  zzzz']);   // 往中間斜下壓的眼皮＋細長的黃眼
      K.rows(29, 29, ['zzzzzz', ' zwwz', '  wz', '  z']);
      return K.layers();
    } };
  // ---------- 領主體・萬面樹：一棵扭曲的枯樹，枝幹像爪子一樣往外抓；黑綠色的葉叢裡嵌著好幾張痛苦的蒼白人臉（黑眼窩、尖叫的嘴）；樹幹上一張大臉——發紅光的斜眼、裂開的大嘴；樹根像觸手爬開 ----------
  HD.faceforest = { w: 68, h: 68, eyes: 'R',
    m: { abcde: '#2E4A2A', klmno: '#3E2E26', pqrst: '#C8C8B0' },
    x: () => ({ R: '#FF3A2A', z: '#0E0A08', w: '#D8D0B8' }),
    pix(f, K) {
      const d = f ? 1 : 0, S = [];
      [[[28, 63], [20, 64], [12, 66], [7, 64]], [[40, 63], [48, 63], [56, 66], [62, 63]], [[34, 64], [33, 66]]].forEach(p => S.push(...K.ls(p, 8, 2.6, 'R')));
      [[[30, 33], [21, 23], [13, 19 + d], [6, 11 + d]], [[38, 33], [48, 23], [56, 17 - d], [62, 9 - d]], [[34, 31], [34, 19], [30, 8]], [[21, 23], [18, 13], [20, 7]], [[48, 23], [52, 12], [49, 6]]].forEach(p => S.push(...K.ls(p, 7.4, 2, 'R')));
      S.push(...K.ps([[22, 66], [26, 54], [24, 42], [22, 33], [30, 29], [35, 31], [42, 28], [46, 34], [43, 43], [43, 54], [47, 66]], 'T'));
      const clump = (x, y, r) => K.ps([[x - r, y], [x - r * 0.6, y - r * 0.8], [x, y - r * 0.6], [x + r * 0.5, y - r], [x + r, y - r * 0.2], [x + r * 0.8, y + r * 0.6], [x + r * 0.1, y + r * 0.8], [x - r * 0.7, y + r * 0.7]], 'C');
      [[13, 16, 7], [31, 11, 8], [52, 13, 7], [21, 26, 6], [46, 26, 6], [60, 18, 4]].forEach(([x, y, r]) => S.push(...clump(x, y + (x < 34 ? d : -d) * 0.5, r)));
      K.cel('RTC', { R: 'klmno', T: 'klmno', C: 'abcde' }, S);
      // 葉叢裡的人臉（蒼白、黑眼窩、尖叫的嘴）
      [[13, 16], [31, 11], [52, 13], [21, 26], [46, 26]].forEach(([x, y], i) => { y += Math.round((x < 34 ? d : -d) * 0.5); K.rows(y - 3, x - 2, [' rrr', 'rqrqr', 'rzrzr', 'rrrrr', ' rzr', ' rzr', '  r'].map(s => s.replace(/r/g, i % 2 ? 's' : 'r'))); });
      // 樹幹上的大臉：壓低的斜眉、紅眼、裂開的大嘴（一排尖牙）
      K.rows(37, 28, ['kk       kk', ' kkk   kkk', '  zRR zRR', '   zz  zz']);
      K.rows(45, 29, ['zzzzzzzzzz', 'zwzwzzwzwz', 'zzzzzzzzzz', ' zwzzwzwz', '  zzzzzz']);
      [[29, 52], [37, 56], [32, 60]].forEach(([x, y]) => K.rows(y, x, ['k', ' k', ' k']));   // 樹皮的裂紋
      return K.layers();
    } };
  // ---------- 領主體・朽翼龍：只剩骨頭的翼龍往前撲——張開的長顎（一排尖牙）、往後的角、眼窩裡青綠色的鬼火；骨翼高高舉起、翼膜破破爛爛；尾巴末端一根骨刺 ----------
  HD.bonewyvern = { w: 72, h: 52, eyes: 'GV',
    m: { abcde: '#D8CCB0', fghij: '#3A2E44', klmno: '#9A8E78' },
    x: () => ({ G: '#7AFFD8', V: '#2AB89A', z: '#0E0A0E' }),
    pix(f, K) {
      const d = f ? 2 : 0, S = [], sh = [36, 22], el = [27, 5 - d];
      const tips = [[3, 3 - d], [6, 14 - d], [12, 24 - d], [22, 30]];
      // 破爛的翼膜（每兩根翼骨中間一片，下緣鋸齒）
      tips.forEach((t, i) => { if (i + 1 < tips.length) { const u = tips[i + 1], mx = (t[0] + u[0]) / 2, my = (t[1] + u[1]) / 2; S.push(...K.ps([el, t, [mx - 1, my - 2], [mx + 2, my + 2], u], 'W')); } });
      S.push(...K.ps([sh, el, [22, 30], [30, 31]], 'W'));
      S.push(...K.ls([sh, el], 6, 4.4, 'A'), ...K.og(el[0], el[1], 3.6, 3.6, 'A', 0, 8)); tips.forEach(t => S.push(...K.ls([el, t], 4, 1.8, 'A')));
      S.push(...K.ls([[22, 30], [12, 32], [5, 30 - d * 0.5], [1, 25]], 6.6, 2.4, 'L'), ...K.ps([[1, 26], [0, 20], [3, 24]], 'L'));
      S.push(...K.ls([[22, 31], [26, 40], [21, 48]], 6.4, 4, 'L'), ...K.og(26, 40, 3.4, 3.4, 'L', 0, 8), ...K.ls([[38, 29], [43, 38], [40, 48]], 6.4, 4, 'A'), ...K.og(43, 38, 3.4, 3.4, 'A', 0, 8));
      S.push(...K.ls([[22, 29], [30, 27], [38, 24], [45, 18], [52, 13]], 7.4, 5.6, 'A'));
      for (let x = 24; x <= 38; x += 3) S.push(...K.ls([[x, 27.5 - (x - 24) * 0.2], [x - 1, 33], [x + 1, 37]], 3.4, 2.4, 'A'));
      S.push(...K.ps([[50, 9], [58, 6], [70, 11], [70, 14], [58, 15], [50, 15]], 'H'), ...K.ps([[55, 17 + d * 0.5], [69, 19 + d], [67, 22 + d], [55, 20]], 'J'));
      S.push(...K.ls([[52, 9], [46, 4], [41, 3]], 2.6, 1, 'L'), ...K.ls([[54, 8], [50, 2], [46, 1]], 2.2, 1, 'A'));
      K.cel('WLAHJ', { W: 'fghij', L: 'klmno', A: 'abcde', H: 'abcde', J: 'abcde' }, S);
      K.rows(9, 54, ['aaaa', ' zzz', ' zGz', '  z']); K.px(68, 12, 'z');
      K.rows(15, 56, ['zzzzzzzzzzzz', 'cz cz cz cz', '  c  c  c  c']); [[40, 45], [21, 48]].forEach(([x, y]) => K.rows(y, x - 2, ['a a a']));
      return K.layers();
    } };
  // ==== 巨獸二 完 ====
  // ==== 巨獸三 ====
  // ---------- 領主體・雷鳴猿：駝背的巨猿——寬大的肩背、壓得很低的小頭、垂到地上的長手臂和大拳頭；背上的毛一撮撮豎起；粗眉骨下細長的黃眼、張嘴露獠牙；肩膀和拳頭上竄著閃電 ----------
  HD.thunderape = { w: 60, h: 60, eyes: 'Y',
    m: { abcde: '#2E2E50', fghij: '#1C1C34', pqrst: '#6E6E90' },
    x: () => ({ Y: '#FFE04A', L: '#FFF07A', l: '#E8A82A', w: '#E8E0D0', z: '#0A0A14', M: '#7A1E2A' }),
    pix(f, K) {
      const d = f ? 1 : 0, S = [];
      S.push(...K.ls([[20, 24], [12, 36], [10, 48], [10, 53]], 12, 9.6, 'F'), ...K.ps([[4, 51], [15, 51], [16, 58], [4, 58]], 'F'));
      S.push(...K.ls([[22, 44], [18, 52], [20, 57]], 11, 8.4, 'F'));
      S.push(...K.ps([[10, 40], [12, 26], [18, 16], [30, 12], [42, 14], [50, 22], [50, 34], [44, 44], [26, 46], [14, 46]], 'B'));
      [[19, 16], [25, 13], [32, 12], [39, 13], [14, 22]].forEach(([x, y], i) => S.push(...K.ps([[x - 2, y + 2], [x - 5, y - 4 - (i % 2) * 2], [x + 2, y + 1]], 'B')));
      S.push(...K.ps([[36, 24], [46, 26], [47, 38], [39, 43], [32, 36]], 'C'));
      S.push(...K.ls([[34, 44], [38, 50], [36, 57]], 12, 9.4, 'L'), ...K.ps([[30, 55], [41, 55], [42, 58], [30, 58]], 'L'));
      S.push(...K.ps([[40, 17], [48, 14], [54, 18], [55, 24], [51, 29], [43, 28], [39, 23]], 'H'));
      S.push(...K.ls([[44, 22], [52, 32 + d], [54, 44], [53, 51]], 13.4, 10.4, 'A'), ...K.ps([[47, 49], [58, 49], [59, 57], [46, 57]], 'A'));
      K.cel('FBCLHA', { F: 'fghij', B: 'abcde', C: 'pqrst', L: 'abcde', H: 'abcde', A: 'abcde' }, S);
      // 臉：粗眉骨、細長的黃眼、張開的嘴（暗紅）＋獠牙、鼻孔
      K.rows(18, 43, ['aaaaaaaaaaa', ' aaa   aaa', '  zYY zYY']); K.rows(22, 51, ['zz']);
      K.rows(24, 44, ['zzzzzzzzz', 'wzMMMMMzw', ' wzMMMzw', '  zzzzz']);
      K.rows(52, 48, ['z  z  z']); K.rows(55, 6, ['z  z  z']);   // 拳頭的指縫
      K.rows(30, 50, ['a', ' a', 'a']); K.rows(26, 22, ['e  e', ' e  e']);
      // 閃電（肩膀、拳頭）
      K.rows(6 + d, 30, ['  L', ' Ll', 'LL', ' LL', '  l']); K.rows(9 - d, 44, ['L', 'lL', ' LL', 'LL', 'l']);
      K.rows(44 + d, 57, ['L', 'Ll', ' L']); K.rows(46 - d, 2, [' L', 'lL', 'L']); K.rows(18 + d, 8, ['  L', ' LL', 'Ll', ' L']);
      return K.layers();
    } };
  // ---------- 領主體・緋面風翁：背後一大片破破爛爛的黑羽翅膀張開，白髮亂飛；紅面具上刻著往中間壓的怒眉、細長發光的眼、往下勾的長鼻；破爛的白袍，舉起一把大葉扇 ----------
  HD.windelder = { w: 64, h: 60, eyes: 'Y',
    m: { abcde: '#C8C4BC', fghij: '#1E1C26', klmno: '#ECE8E0', pqrst: '#B8281E', uvwxy: '#3E5A2E' },
    x: () => ({ Y: '#FFD84A', z: '#120808', R: '#C8302A' }),
    pix(f, K) {
      const d = f ? 2 : 0, S = [];
      // 黑羽翅膀（一根根羽毛往外張，尖端參差）
      [[150, 26], [165, 28], [180, 29], [195, 28], [210, 25], [225, 21], [240, 16]].forEach(([a, l]) => { const r = a * Math.PI / 180; S.push(...K.ls([[27, 24], [27 + Math.cos(r) * l * 0.6, 24 + Math.sin(r) * l * 0.6 - d * 0.5], [27 + Math.cos(r) * l, 24 + Math.sin(r) * l - d]], 9.4, 2, 'W')); });
      [[-25, 18], [-10, 20], [5, 20], [20, 17]].forEach(([a, l]) => { const r = a * Math.PI / 180; S.push(...K.ls([[38, 24], [38 + Math.cos(r) * l * 0.6, 24 + Math.sin(r) * l * 0.6 - d * 0.5], [38 + Math.cos(r) * l, 24 + Math.sin(r) * l - d]], 8.4, 2, 'W')); });
      S.push(...K.ps([[22, 22], [38, 22], [44, 56], [40, 52], [36, 57], [31, 53], [26, 57], [22, 52], [17, 56]], 'R'));
      S.push(...K.ps([[19, 9], [23, 2], [27, 6], [31, 0.5], [35, 5], [40, 2], [41, 12], [38, 21], [33, 25], [26, 25], [20, 19], [15, 18], [19, 14]], 'H'));
      S.push(...K.ls([[37, 27], [44, 22], [48, 16]], 8.4, 7, 'A'));
      S.push(...K.ps([[46, 15], [49, 3], [57, 1], [62, 6], [58, 13], [50, 17]], 'F'));
      S.push(...K.ps([[25, 8], [36, 8], [38, 14], [36, 20], [26, 20], [24, 14]], 'M'), ...K.ls([[36, 13], [42, 15], [45, 20]], 3.6, 1.2, 'M'));
      K.cel('WRHAFM', { W: 'fghij', R: 'abcde', H: 'klmno', A: 'abcde', F: 'uvwxy', M: 'pqrst' }, S);
      // 面具：往中間壓的怒眉、細長的發光眼、緊閉的嘴；白鬍子、紅腰帶、扇子的葉脈
      K.rows(10, 25, ['zz      zz', ' zzz  zzz', '  zYYzzYY']); K.rows(17, 28, ['zzzzz']);
      K.rows(20, 27, ['l l l', 'l l l', ' l l', ' l']); K.rows(31, 22, ['RRRRRRRRRRRRRRRRRR']);
      K.rows(4, 51, ['v', ' v', '  v', '   v']); K.rows(7, 56, ['v', ' v']);
      [[24, 40], [32, 44], [38, 48]].forEach(([x, y]) => K.rows(y, x, ['b', 'b', ' b']));
      return K.layers();
    } };
  // ---------- 領主體・棘背狼：黑色的巨狼壓低頭往前，背上一排銀色的尖棘（肩膀最高、往後斜）；細長的紅眼壓在眉下，張著嘴露出犬齒；粗尾巴 ----------
  HD.spikewolf = { w: 70, h: 46, eyes: 'RQ',
    m: { abcde: '#2A2A32', fghij: '#18181E', pqrst: '#B0B0BE' },
    x: () => ({ R: '#FF3A2A', Q: '#8A1414', z: '#0A0A0E', w: '#E8E0D4', M: '#6A1420' }),
    pix(f, K) {
      const d = f ? 1 : 0, S = [];
      S.push(...K.ls([[14, 24], [7, 21], [2, 15 + d]], 10, 3.6, 'T'));
      S.push(...K.ls([[22, 32], [19 - d, 38], [20 - d, 44]], 8.4, 5.4, 'F'), ...K.ls([[46, 32], [48 + d, 38], [50 + d, 44]], 8.4, 5.4, 'F'));
      for (let i = 0; i < 9; i++) { const x = 18 + i * 4.2, k = Math.sin(i / 8 * Math.PI), y = 20 - k * 2, h = 6 + k * 7; S.push(...K.ps([[x - 2, y + 2], [x - 5, y - h], [x + 2.4, y + 2]], 'S')); }
      S.push(...K.ps([[13, 24], [21, 16], [40, 15], [52, 16], [57, 23], [56, 33], [47, 36], [24, 36], [13, 32]], 'B'));
      S.push(...K.ls([[26, 32], [23 + d, 38], [25 + d, 44]], 9.6, 6, 'N'), ...K.ls([[48, 32], [47 - d, 38], [49 - d, 44]], 9.6, 6, 'N'));
      S.push(...K.ps([[52, 20], [60, 19], [66, 22], [69, 26], [68, 29], [62, 30], [55, 30], [51, 26]], 'H'), ...K.ps([[54, 20], [53, 11], [58, 18]], 'H'), ...K.ps([[58, 30], [67, 30 + d], [66, 33 + d], [59, 33]], 'J'));
      K.cel('TFSBNHJ', { T: 'abcde', F: 'fghij', S: 'pqrst', B: 'abcde', N: 'abcde', H: 'abcde', J: 'abcde' }, S);
      K.rows(21, 57, ['aaaa', ' zRR', '  zz']); K.rows(23, 68, ['z']);
      K.rows(30, 59, ['wMMMMzzz', ' w']); if (d) K.rows(31, 60, ['MMMzz']);
      K.rows(22, 26, ['e   e   e']); [[22, 44], [48, 44]].forEach(([x, y]) => K.rows(y, x - 2, ['a a a']));
      return K.layers();
    } };
  // ==== 巨獸三 完 ====
  // ==== 巨獸・壓迫感 ====
  // ==== 2026-10-10 作者：除了兩隻蟲都沒有 boss 的感覺、不是單純加粗——要有壓迫感：正面朝玩家、張開的大輪廓（角、手、翅膀），暗色調只有邊緣亮、眼睛發光，細節多 ====
  const mirror = (sp, W) => sp.map(([y, a, b, c]) => [y, W - 1 - b, W - 1 - a, c]);   // 左半邊畫好，鏡射成右半邊
  // ---------- 領主體・霜冠鹿（正面）：低著頭正對你，一對巨大的冰晶鹿角像王冠一樣往兩邊張開；胸口一大圈結霜的鬃毛，前腳張開站穩；細長發青光的眼睛，鼻子噴出白霧 ----------
  HD.frostdeer = { w: 72, h: 64, eyes: 'GV',
    m: { abcde: '#3E5070', klmno: '#B8D4EC', PQRST: '#3A8CD8' },
    x: () => ({ G: '#9AF4FF', V: '#3AB8E8', z: '#0C1220', K: '#141A26', W: '#E0F4FF' }),
    pix(f, K) {
      const d = f ? 1 : 0, L = [];
      // 冰角（左半邊）：主幹往外上方彎，一根根往上、往外的尖
      L.push(...K.ls([[32, 15], [26, 9 - d], [18, 5 - d], [10, 4 - d], [3, 8 - d]], 6, 2.4, 'A'));
      [[[25, 9 - d], [22, 1]], [[17, 5 - d], [14, 1]], [[10, 4 - d], [7, 1]], [[21, 7 - d], [17, 13]], [[29, 12], [24, 16]], [[6, 5 - d], [1, 10]]].forEach(p => L.push(...K.ls(p, 3.6, 1.2, 'A')));
      // 耳朵（往兩邊）
      L.push(...K.ps([[30, 18], [20, 15], [18, 18], [28, 23]], 'E'));
      // 前腳（張開站穩）＋膝蓋
      L.push(...K.ls([[19, 42], [17, 51], [16, 59]], 10, 7, 'L'), ...K.og(17, 51, 5, 4.4, 'L', 0, 8));
      const S = [...L, ...mirror(L, 72)];
      // 身體（肩膀寬）、胸口的霜鬃、頭（正面、長臉往下收）
      S.push(...K.ps([[21, 29], [50, 29], [59, 36], [61, 46], [56, 51], [15, 51], [10, 46], [12, 36]], 'B'));
      S.push(...K.ps([[23, 27], [48, 27], [54, 34], [51, 40], [55, 47], [48, 45], [46, 53], [41, 47], [35.5, 56], [30, 47], [25, 53], [23, 45], [16, 47], [20, 40], [17, 34]], 'N'));
      S.push(...K.ps([[29, 13 + d], [42, 13 + d], [45, 20 + d], [44, 29 + d], [41, 37 + d], [39, 41 + d], [32, 41 + d], [30, 37 + d], [27, 29 + d], [26, 20 + d]], 'H'));
      K.cel('AELBNH', { A: 'PQRST', E: 'abcde', L: 'abcde', B: 'abcde', N: 'klmno', H: 'abcde' }, S);
      // 冰角上的晶面（亮的一條）、肩上的冰刺
      [[20, 5], [12, 4], [51, 5], [59, 4]].forEach(([x, y]) => K.rows(y - d, x, ['TS']));
      // 臉：往中間壓的眉、細長的青光眼、鼻樑、鼻孔
      K.rows(19 + d, 28, ['aaa         aaa', ' aaaa     aaaa', '  zGGa   aGGz', '   zz     zz']);
      K.rows(24 + d, 34, ['b', 'b', 'b', 'b', 'b', 'b']); K.rows(37 + d, 33, ['zz zz']);
      // 噴出的白霧、蹄
      K.rows(42 + d, 30, [' W   W', 'WW W WW', ' W   W']); K.rows(46 - d, 27, ['W         W']);
      [[16, 59], [55, 59]].forEach(([x, y]) => K.rows(y, x - 4, ['KKKKKKKK', 'KKKKKKKK', ' KKK KKK']));
      // 鬃毛的線、身上的舊傷
      [[28, 32], [42, 32], [35, 38]].forEach(([x, y]) => K.rows(y, x, ['m', ' m', 'm']));
      K.rows(40, 12, ['a', ' a', '  a']);
      return K.layers();
    } };
  // ---------- 領主體・雷鳴猿（正面）：張開雙臂高舉過頭、握緊兩顆大拳頭，拳頭之間拉出閃電；寬大的肩背、壓在肩膀中間的小頭在怒吼（張大的嘴、獠牙），短而粗的腿岔開站 ----------
  HD.thunderape = { w: 68, h: 64, eyes: 'Y',
    m: { abcde: '#2C2C4A', pqrst: '#66668A' },
    x: () => ({ Y: '#FFE04A', L: '#FFF27A', l: '#E8A82A', w: '#E8E0D0', z: '#08080E', M: '#8A1E2A' }),
    pix(f, K) {
      const d = f ? 1 : 0, L = [];
      L.push(...K.ls([[25, 44], [18, 52], [18, 61]], 13, 10, 'G'), ...K.ps([[10, 58], [24, 58], [25, 62], [9, 62]], 'G'));   // 腿、腳
      L.push(...K.ls([[13, 21], [6, 13 - d], [8, 6 - d]], 14, 12, 'A'), ...K.ps([[2, 1 - d], [14, 1 - d], [15, 9 - d], [1, 9 - d]], 'F'));   // 高舉的手臂、拳頭
      [[12, 16], [17, 12], [23, 10]].forEach(([x, y], i) => L.push(...K.ps([[x - 2, y + 2], [x - 5, y - 4 - (i % 2) * 2], [x + 2, y + 1]], 'B')));   // 肩膀上豎起來的毛
      const S = [...L, ...mirror(L, 68)];
      S.push(...K.ps([[8, 19], [20, 12], [34, 14], [47, 12], [59, 19], [56, 31], [46, 41], [42, 47], [26, 47], [22, 41], [12, 31]], 'B'));
      S.push(...K.ps([[22, 23], [33.5, 25], [45, 23], [46, 33], [40, 39], [27, 39], [21, 33]], 'C'));
      S.push(...K.ps([[27, 11 + d], [33.5, 8 + d], [40, 11 + d], [42, 19 + d], [38, 25 + d], [29, 25 + d], [25, 19 + d]], 'H'));
      K.cel('GBCAFH', { G: 'abcde', B: 'abcde', C: 'pqrst', A: 'abcde', F: 'abcde', H: 'abcde' }, S);
      // 怒吼的臉：粗眉骨壓下來、細長的黃眼、張大的嘴（暗紅、上下獠牙）
      K.rows(13 + d, 26, ['aaaaa    aaaaa', ' aaaaaa aaaaaa', '  zYYa   aYYz']);
      K.rows(18 + d, 29, ['zzzzzzzzz', 'wzMMMMMzw', 'wMMMMMMMw', 'zMMMMMMMz', ' wMMMMMw', '  zzzzz']);
      // 胸肌的線、拳頭的指縫、身上的傷
      K.rows(30, 33, ['q', 'q', 'q']); K.rows(29, 23, ['qqqq        qqqq']);
      [[3, 5], [52, 5]].forEach(([x, y]) => K.rows(y - d, x, ['z  z  z  z']));
      K.rows(24, 12, ['a', ' a', 'a']); K.rows(34, 52, ['a', ' a', '  a']);
      // 閃電：兩個拳頭之間、從手臂竄到地上
      K.rows(3 - d, 15, ['  L  ', ' LlL     LL       LlL     L', 'L   LL  L  LL   LL   LL  L lL', '      LL     LlL       L    ']);
      K.rows(30 + d, 4, ['L', 'lL', ' L', 'L', 'lL']); K.rows(26 - d, 62, [' L', 'Ll', 'L', ' L', 'lL']);
      return K.layers();
    } };
  // ---------- 領主體・地出巨骸（往前探）：從冒著黑紫瘴氣的大洞裡探出上半身，頭骨往前壓、下顎張得很大；一隻手撐在洞口，另一隻巨大的骨手朝你伸過來（越近越大）；肋骨又寬又粗，骨頭上一道道裂痕 ----------
  HD.gashadokuro = { w: 152, h: 128, eyes: 'RQ',
    m: { abcde: '#B8AC8C', fghij: '#7E745E', VWXYZ: '#3A2E26', pqrst: '#120A0C', uvwxy: '#3A2448' },
    x: () => ({ R: '#FF3A2A', Q: '#8A1414', z: '#0A0606', O: '#C8302A' }),
    ol: { bare: 'uvwxy' },
    pix(f, K) {
      const d = f ? 1 : 0, C = 76, S = [], ring = (cx, cy, rx, ry, n) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.283) * rx, cy + Math.sin(i / n * 6.283) * ry]);
      // 瘴氣（黑紫色，不描邊，往上飄）
      [[[16, 120], [10, 100], [18, 84 - d], [12, 68 - d], [24, 76], [30, 98], [40, 114]], [[136, 120], [142, 98], [134, 82 + d], [140, 64 + d], [128, 74], [122, 96], [112, 114]], [[52, 118], [46, 98], [52, 88], [58, 100], [62, 116]]].forEach(p => S.push(...K.ps(p, 'M')));
      S.push(...K.ps(ring(C, 117, 66, 11, 22), 'V'));
      // 脊椎、又寬又粗的肋骨
      S.push(...K.ls([[C, 112], [C, 52 + d]], 14, 12, 'S'));
      for (let i = 0; i < 6; i++) { const y = 58 + d + i * 8.4, w = 38 - i * 2; S.push(...K.ls([[C - 4, y], [C - w * 0.6, y - 2], [C - w, y + 5], [C - w + 4, y + 12]], 7, 4.4, 'R'), ...K.ls([[C + 4, y], [C + w * 0.6, y - 2], [C + w, y + 5], [C + w - 4, y + 12]], 7, 4.4, 'R')); }
      // 撐在洞口的左手（畫面左）
      const shL = [42, 54 + d], elL = [22, 80], wrL = [16, 104];
      S.push(...K.ls([[C - 6, 52 + d], [C - 22, 47 + d], shL], 8, 7, 'A'), ...K.og(shL[0], shL[1], 10, 9, 'A', 0, 10), ...K.ls([shL, elL], 13, 10, 'A'), ...K.og(elL[0], elL[1], 7.4, 7, 'A', 0, 10), ...K.ls([elL, wrL], 10, 8, 'A'), ...K.og(wrL[0], wrL[1], 6.4, 6, 'A', 0, 10));
      [-4, 0, 4, 8].forEach(k => S.push(...K.ls([wrL, [wrL[0] - 4 - k * 0.6, 110 + Math.abs(k) * 0.5], [wrL[0] - 6 - k, 116], [wrL[0] - 5 - k, 121]], 5.4, 2.2, 'A')));
      // 朝你伸過來的右手（越近越大）
      const shR = [110, 54 + d], elR = [128, 74], wrR = [118, 94];
      S.push(...K.ls([[C + 6, 52 + d], [C + 22, 47 + d], shR], 8, 7, 'B'), ...K.og(shR[0], shR[1], 10, 9, 'B', 0, 10), ...K.ls([shR, elR], 13, 11, 'B'), ...K.og(elR[0], elR[1], 8, 7.4, 'B', 0, 10), ...K.ls([elR, wrR], 12, 11, 'B'));
      S.push(...K.og(118, 102, 15, 11, 'P', -10, 12));
      [[[106, 106], [100, 114], [98, 122]], [[114, 110], [111, 119], [111, 126]], [[123, 110], [124, 119], [127, 126]], [[131, 106], [137, 113], [141, 120]], [[104, 98], [96, 100], [91, 106]]].forEach(p => S.push(...K.ls(p, 8, 3.6, 'P')));
      S.push(...K.ps(ring(C, 118, 52, 7, 20), 'X'));
      // 頭骨（往前壓）、張得很大的下顎
      S.push(...K.ps([[52, 30], [54, 14], [64, 5], [76, 3], [88, 5], [98, 14], [100, 30], [96, 38], [91, 41], [89, 48], [63, 48], [61, 41], [56, 38]].map(([x, y]) => [x, y + d]), 'H'));
      S.push(...K.ps([[60, 56 + d * 2], [92, 56 + d * 2], [90, 70 + d * 2], [76, 75 + d * 2], [62, 70 + d * 2]], 'J'));
      K.cel('MVSRAXBPHJ', { M: 'uvwxy', V: 'VWXYZ', S: 'fghij', R: 'abcde', A: 'fghij', X: 'ppppp', B: 'abcde', P: 'abcde', H: 'abcde', J: 'abcde' }, S);
      // 眉骨、眼窩、紅光、鼻腔
      K.rows(13 + d, 55, ['aaaa                                aaaa', ' aaaaaa                          aaaaaa', '    aaaaaaa                  aaaaaaa', '        aaaaaa          aaaaaa']);
      K.rows(17 + d, 59, ['  zzzzzz', ' zzzzzzzzz', 'zzzzzzzzzzz', 'zzzzzzzzzzzz', 'zzzzRRzzzzzz', 'zzzzQRzzzzz', ' zzzzzzzzz', '  zzzzzz']);
      K.rows(17 + d, 81, ['    zzzzzz', ' zzzzzzzzz', 'zzzzzzzzzzz', 'zzzzzzzzzzzz', 'zzzzzzRRzzzz', ' zzzzzRQzzzz', '  zzzzzzzzz', '    zzzzzz']);
      K.rows(27 + d, 72, [' zzzz', 'zzzzzz', 'zzzzzz', ' zzzz', '  zz']);
      // 張大的嘴：上排長牙、嘴裡（深處一點紅）、下排牙
      K.rows(41 + d, 62, Array(15).fill('z'.repeat(28))); K.rows(48 + d, 72, ['OOOO', ' OO']);
      for (let x = 62; x <= 86; x += 4) K.rows(41 + d, x, ['edd', 'dcc', 'dcc', 'dcb', ' cb', ' b']);
      for (let x = 64; x <= 86; x += 4) K.rows(51 + d * 2, x, ['  b', ' cb', 'dcc', 'dcc']);
      // 骨頭上的裂痕
      K.rows(5 + d, C - 6, ['a', ' a', ' aa', '   a', '  a']); K.rows(9 + d, C + 13, ['a', ' a', ' a', '  aa']);
      [[30, 66], [124, 62], [118, 100], [70, 66], [88, 82]].forEach(([x, y]) => K.rows(y, x, ['a', 'a', ' a']));
      return K.layers();
    } };
  // ==== 巨獸・壓迫感 完 ====
  // ==== 時空之鑰樣本 ====
  // ==== 2026-10-10 作者：《時空之鑰》那種會動的大型 boss（FF6 也不錯）——正面、上半身巨大、頭小；每一塊肌肉各自上光（左上一團亮、塊和塊之間深色的縫）、
  //      皮膚有顆粒感、一隻怪一組同色系 7 階（近黑到很亮）＋一兩個重點色；畫得更精細（res 3：遊戲裡一樣大，格子更細） ====
  // ---------- 領主體・雷鳴猿：正面半蹲、兩隻粗手臂往兩邊撐、拳頭抵在地上；寬大的肩膀和背、壓在兩肩中間的小頭在怒吼；肩膀和拳頭竄著閃電 ----------
  HD.thunderape = { w: 96, h: 96, res: 3, eyes: 'Y',
    m: { abcdefg: '#2A2860', hijklmn: '#625E92' },
    x: () => ({ Y: '#FFE04A', L: '#FFF27A', O: '#E8A82A', w: '#ECE4D4', z: '#06060C', M: '#8A1E2A' }),
    ol: { bare: 'LO' },
    pix(f, K) {
      const d = f ? 1 : 0, F = 'abcdefg', S = 'hijklmn', cre = { rim: 'lrtb' };
      const both = fn => { fn(1); fn(-1); }, X = (s, x) => 48 + s * (x - 48);
      // 背、斜方肌（在頭後面）
      K.ell(48, 42 - d, 31, 21, F, { down: 0.35 }); K.ell(48, 28 - d, 19, 9, F, { down: 0.2 });
      // 腿：大腿（往外斜）、小腿、腳
      both(s => { K.ell(X(s, 32), 72, 10, 12, F, Object.assign({ rot: 25 * s }, cre)); K.limb([[X(s, 29), 78], [X(s, 24), 86], [X(s, 25), 91]], 14, 12, F, cre); K.ell(X(s, 23), 92, 10, 4, F, cre); });
      // 腰、腹肌
      K.ell(48, 68, 19, 9, F, cre);
      K.ell(48, 56, 12, 9, S, cre); [[43, 53], [53, 53], [43, 60], [53, 60]].forEach(([x, y]) => K.ell(x, y, 4.4, 3.4, S, cre));
      // 胸肌
      both(s => K.ell(X(s, 38), 43 - d, 12, 9, S, cre));
      // 肩膀（三角肌）、上臂、前臂、拳頭
      both(s => {
        K.ell(X(s, 20), 33 - d, 15, 13, F, cre);
        K.limb([[X(s, 15), 38 - d], [X(s, 9), 52], [X(s, 9), 59]], 16, 14, F, cre);
        K.limb([[X(s, 9), 59], [X(s, 11), 72], [X(s, 13), 80]], 16, 13, F, cre);
        K.ell(X(s, 13), 84, 10, 7.4, F, cre);
      });
      // 頭（小、壓在兩肩中間）、口鼻、眉骨
      K.ell(48, 27 - d, 10, 10, F, cre); K.ell(48, 33 - d, 7.4, 6, S, cre);
      K.limb([[38, 23 - d], [48, 26 - d], [58, 23 - d]], 4.4, 4.4, F, { bias: 0.2 });
      K.speckle(F, 0.07, 11); K.speckle(S, 0.05, 23);
      // 臉：細長的黃眼（往中間壓）、怒吼張開的嘴（暗紅、上下獠牙）、鼻孔
      K.rows(26 - d, 40, ['zzY     Yzz', ' zYY   YYz']); K.rows(30 - d, 46, ['z  z']);
      K.rows(33 - d, 43, ['zzzzzzzzzz', 'wzMMMMMMzw', 'wMMMMMMMMw', 'zMMMMMMMMz', ' wMMMMMMw', '  zzzzzz']);
      // 拳頭的指節、腳爪
      both(s => { [-4, -1, 2, 5].forEach(k => K.rows(81, Math.round(X(s, 13 + k)), ['a', 'a'])); [-5, 0, 5].forEach(k => K.px(X(s, 23 + k), 95, 'w')); });
      // 肩膀上豎起來的毛（尖）
      both(s => [[14, 22], [20, 19], [26, 20]].forEach(([x, y]) => K.poly([[X(s, x) - 2, y + 3 - d], [X(s, x) - 3 * s, y - 4 - d], [X(s, x) + 2, y + 3 - d]], F, { flat: 1 })));
      // 閃電（肩膀、拳頭、地上）
      const bolt = (x, y, pts) => { let cx = x, cy = y; pts.forEach(([dx, dy]) => { const n = Math.max(Math.abs(dx), Math.abs(dy)); for (let i = 0; i <= n; i++) K.px(cx + dx * i / n, cy + dy * i / n, i % 3 ? 'L' : 'O'); cx += dx; cy += dy; }); };
      if (f) { bolt(6, 22, [[-3, 4], [3, 3], [-4, 5]]); bolt(84, 64, [[4, 3], [-2, 4], [5, 4]]); bolt(30, 12, [[-4, -3], [2, -4], [-3, -3]]); }
      else { bolt(90, 22, [[3, 4], [-3, 3], [4, 5]]); bolt(12, 64, [[-4, 3], [2, 4], [-5, 4]]); bolt(66, 12, [[4, -3], [-2, -4], [3, -3]]); }
      return K.layers();
    } };
  // ==== 時空之鑰樣本 完 ====
  // ==== 雷鳴猿・手點 ====
  // ---------- 領主體・雷鳴猿（2026-10-10 重畫）：不用橢圓、不用任何形狀工具、也不描舊圖——跟尾隨犬一樣一格一格點。
  // 照第一版手點的畫法（手臂直直撐地、胸口大塊淺色、肩膀一撮一撮亮的毛尖），頭型改成尖頂、眉骨凸、臉頰寬、下巴收（不是方盒子）。
  // 光從左上來：左半邊（x 0～35）一格一格點在 half，右半邊照鏡子翻過去，再照「這一面朝哪」換顏色——朝外的那一面背光、變暗。
  // 明暗照「面」分（朝上最亮、朝前中間、朝下和縫最暗），交界是一撮一撮往下的毛尖，不是一圈一圈的光暈。
  // 面的字：毛 T 朝上、O 朝外、F 朝前、I 朝內、B 朝下、K 縫；皮 t 朝上、o 朝外、f 朝前、b 朝下、k 縫；
  // 閃電：Y 尖毛尖端帶的電（兩邊一樣亮）、U 毛上發光的電紋（右半邊暗一點）、Z X 身體外面跳的閃電（不描邊）。
  // 其他照原樣：E e 眼睛、z 眼窩、m 嘴裡、M 舌頭、w 牙、v 牙的暗面。
  // 身體 72×64，四周各留 4 格給閃電竄出去（整張 80×68）。
  HD.thunderape = { w: 80, h: 68, eyes: 'Ee', spikeOn: '345',
    pal: () => ({ 1: '#13112C', 2: '#232150', 3: '#363474', 4: '#52509C', 5: '#7C7CC6',
      6: '#2C2240', 7: '#4A3A64', 8: '#6E5C8A', 9: '#9886B0', A: '#C4B6D4',
      U: '#9AE6FF', V: '#5AA8E0',
      E: '#FFF27A', e: '#F0A830', z: '#0A0814', m: '#4A0E1E', M: '#8A2234', w: '#ECE4D4', v: '#A89C9A', Z: '#FFF8B0', X: '#F0B838' }),
    ol: { '*': ['#2E2A5C', '#08071A'], bare: 'ZX' },
    // 每個面在左半邊、右半邊的顏色
    face: { Y: 'UU', U: 'UV',
      T: '54', O: '42', F: '33', I: '23', B: '21', K: '11', t: 'A9', o: '97', f: '98', b: '77', k: '66' },
    half: [
      // 肩上的三根尖毛（尖端帶電）
      [2, 18, 'Y'],
      [3, 18, 'YF'],
      [4, 17, 'TTF'],
      [5, 11, 'Y'], [5, 17, 'TTFB'],
      [6, 11, 'TF'], [6, 17, 'TTTFB'], [6, 24, 'Y'],
      [7, 10, 'TTF'], [7, 16, 'TTTFFB'], [7, 24, 'TF'],
      [8, 10, 'TTTF'], [8, 16, 'TTTTFFB'], [8, 23, 'TTFB'],
      // 肩膀頂（平的、往外斜下去）
      [9, 9, 'TTTTTTTTTTTTTTTFBB'], [9, 27, 'KKK'],
      [10, 7, 'TTTTTTTTTTTTTTTTFFBK'], [10, 27, 'KKK'],
      [11, 5, 'OOTTTTTTTTTTTTTTTFFFI'], [11, 26, 'K'],
      // 肩膀：上面一撮一撮亮的毛尖往下垂；外側一直線
      [12, 3, 'OOO'], [12, 6, 'TTTTFTTTTFTTTTFTT'], [12, 23, 'FFI'], [12, 26, 'K'],
      [13, 2, 'OOOO'], [13, 6, 'TTTFFTTTFFTTTFFTT'], [13, 23, 'FII'], [13, 26, 'K'],
      [14, 2, 'OOOO'], [14, 6, 'FTFFFFTFFFFTFFFFT'], [14, 23, 'III'], [14, 26, 'K'],
      [15, 2, 'OOO'], [15, 5, 'FFFFFFFFFF'], [15, 15, 'IK'], [15, 17, 'FFFFFF'], [15, 23, 'III'], [15, 26, 'K'],
      [16, 1, 'OOOO'], [16, 5, 'FFFFFFFFF'], [16, 14, 'IIK'], [16, 17, 'FFFFFF'], [16, 23, 'IIK'], [16, 26, 'K'],
      [17, 0, 'OOOOO'], [17, 5, 'FFFFFFFFF'], [17, 14, 'IIK'], [17, 17, 'FFFFFI'], [17, 23, 'IKK'],
      [18, 0, 'O'], [18, 2, 'OOO'], [18, 5, 'FFFFFFFFF'], [18, 14, 'IIK'], [18, 17, 'FFFFII'], [18, 23, 'IKK'], [18, 26, 'K'],
      [19, 2, 'OOO'], [19, 5, 'FFFFFFFFF'], [19, 14, 'IIK'], [19, 17, 'FFFIII'], [19, 23, 'IKK'],
      [20, 1, 'OOOO'], [20, 5, 'FFFFFFFFF'], [20, 14, 'IIK'], [20, 17, 'FFIIII'], [20, 23, 'IKK'], [20, 26, 'K'],
      [21, 0, 'OOOOO'], [21, 5, 'FFFFFFFFF'], [21, 14, 'IIK'], [21, 17, 'KIIIIIIII'],
      [22, 0, 'O'], [22, 2, 'OOO'], [22, 5, 'FFFFFFFFF'], [22, 14, 'IIK'], [22, 17, 'KIttIttIk'], [22, 26, 'K'],
      // 胸口（皮）：上緣亮、下緣一道斜斜的胸肌下的縫；肩膀下緣的陰影也是一撮一撮的
      [23, 2, 'OOO'], [23, 5, 'FFFFFFFFF'], [23, 14, 'IIK'], [23, 17, 'Kttttttttttk'],
      [24, 3, 'OO'], [24, 5, 'FFFFFFFF'], [24, 13, 'IIIK'], [24, 17, 'Kttttttttt'],
      [25, 3, 'OO'], [25, 5, 'FBFFFBFFFB'], [25, 15, 'IK'], [25, 17, 'Kfffffffff'],
      [26, 3, 'OO'], [26, 5, 'BBBFBBBFBBB'], [26, 16, 'K'], [26, 17, 'Kfffffffffff'],
      [27, 3, 'BBBBBBBBBBBB'], [27, 15, 'KK'], [27, 17, 'kfffffffffffffffffb'],
      [28, 3, 'OOTTTTTTTFII'], [28, 17, 'Kkffffffffffffbbbbb'],
      [29, 3, 'OOFTTTFFTTII'], [29, 17, 'KIbbbbbbbbbkkkkkkkk'],
      // 上臂、腰側的毛、腹肌（三排、上緣亮、下緣暗、縫的角暗一點）
      [30, 3, 'OOFFTFFFTFII'], [30, 17, 'KIkkkkkkkkk'], [30, 28, 'ftttttf'], [30, 35, 'b'],
      [31, 3, 'OOFFFFFFFFII'], [31, 17, 'KIIFFFFFFIk'], [31, 28, 'fffffff'], [31, 35, 'b'],
      [32, 3, 'OOFFFFFFFFII'], [32, 17, 'KIIFFFFFFIk'], [32, 28, 'fffffff'], [32, 35, 'b'],
      [33, 3, 'OOFFFFFFFFI'], [33, 17, 'KIIFFFFFFIk'], [33, 28, 'bbbbbbb'], [33, 35, 'b'],
      [34, 3, 'OOFFFFFFFFI'], [34, 18, 'KIFFFFFFIk'], [34, 28, 'kbbbbbk'], [34, 35, 'k'],
      [35, 3, 'OOFFFFFFFFI'], [35, 18, 'KIFFFFFFIk'], [35, 28, 'ftttttf'], [35, 35, 'b'],
      [36, 2, 'OOOFFFFFFFFI'], [36, 18, 'KIFFFFFFIk'], [36, 28, 'fffffff'], [36, 35, 'b'],
      [37, 1, 'OBBBBBBBBBBBB'], [37, 19, 'KFFFFFFIk'], [37, 28, 'fffffff'], [37, 35, 'b'],
      [38, 2, 'BBBBBBBBBBBBK'], [38, 19, 'KFFFFFFIk'], [38, 28, 'bbbbbbb'], [38, 35, 'b'],
      // 前臂（很粗，上面亮的毛尖往下垂）
      [39, 2, 'OTTTTTTTTTTTTI'], [39, 19, 'KFFFFFFIk'], [39, 28, 'kbbbbbk'], [39, 35, 'k'],
      [40, 1, 'OOTTTFTTTTFTTII'], [40, 19, 'KFFFFFFIk'], [40, 28, 'ftttttf'], [40, 35, 'b'],
      [41, 1, 'OOTTTFFTTTFFTII'], [41, 18, 'KFFFFFFFIk'], [41, 28, 'fffffff'], [41, 35, 'b'],
      [42, 1, 'OOFTFFFFTFFFFII'], [42, 17, 'KFFFFFFFFIk'], [42, 28, 'bbbbbbb'], [42, 35, 'b'],
      // 大腿（蹲著往前頂，上面亮）、兩腿中間的暗處
      [43, 1, 'OOOFFFFFFFFFFII'], [43, 17, 'OTTTTTTTTTTI'], [43, 29, 'KIIIIII'],
      [44, 1, 'OOOFFFFFFFFFFII'], [44, 17, 'OOTTTTTTTTTI'], [44, 29, 'KFFFFFF'],
      [45, 1, 'OOOFFFFFFFFFFII'], [45, 17, 'OFTTTFFTTTFI'], [45, 29, 'KIIIIII'],
      [46, 1, 'OOOFFFFFFFFFFII'], [46, 17, 'OFFTFFFFTFFI'], [46, 29, 'KKIIIII'],
      [47, 1, 'OOFFFFFFFFFII'], [47, 17, 'OOFFFFFFFFII'], [47, 29, 'KKKIIII'],
      [48, 1, 'OOFFFFFFFFFII'], [48, 17, 'OOFFFFFFFFII'], [48, 29, 'KKKKIII'],
      [49, 1, 'OOFFFFFFFFFII'], [49, 17, 'OOFFFFFFFFII'], [49, 29, 'KKKKKKK'],
      [50, 1, 'OOFFFFFFFFFII'], [50, 17, 'OOFFFFFFFFII'], [50, 29, 'KKKKKKK'],
      // 拳頭（手背的毛＋四根指節撐在地上）、小腿、腳（四根腳趾）
      [51, 0, 'OTTTTTTTTTTTTI'], [51, 17, 'OBFFBBFFBBFI'], [51, 29, 'KKKKKKK'],
      [52, 0, 'OOTTTTTTTTTTII'], [52, 17, 'BBBBBBBBBBBB'], [52, 29, 'KKKKKK'],
      [53, 0, 'OOFFFFFFFFFFII'], [53, 18, 'OBBBBBBBBIK'],
      [54, 0, 'OOFFFFFFFFFFII'], [54, 18, 'OOFFFFFFIIK'],
      [55, 0, 'OBBBBBBBBBBBBK'], [55, 18, 'OOFFFFFFIIK'],
      [56, 0, 'ottktttktttktb'], [56, 18, 'OOFFFFFFIIK'],
      [57, 0, 'offkfffkfffkfb'], [57, 16, 'OTTTTTTTTTTTTTI'],
      [58, 0, 'offkfffkfffkfb'], [58, 16, 'OOFFFFFFFFFFFII'],
      [59, 0, 'offkfffkfffkfb'], [59, 16, 'ottktttktttkttb'],
      [60, 0, 'obbkbbbkbbbkbk'], [60, 16, 'offkfffkfffkffb'],
      [61, 0, 'bbb'], [61, 4, 'bbb'], [61, 8, 'bbb'], [61, 12, 'bb'], [61, 16, 'obbkbbbkbbbkbbk'],
      [62, 16, 'bbb'], [62, 20, 'bbb'], [62, 24, 'bbb'], [62, 28, 'bbb'],
      // 頭（第一版的臉，頭型改過）：頭頂收成尖尖的骨冠；眉骨比額頭往兩邊凸出兩格；眼睛以下的臉頰往外變寬（鬢毛一撮撮往外翹），
      // 再往下巴收窄——不是一個方盒子。眉骨、發光的眼睛、扁鼻子、張開的嘴和獠牙照第一版。
      [6, 35, 'T'],
      [7, 34, 'TT'],
      [8, 32, 'TTTT'],
      [9, 31, 'TTTTT'],
      [10, 30, 'OTTTTT'],
      [11, 29, 'OTTTFFF'],
      [12, 27, 'OFttttttt'],
      [13, 27, 'OFffffffk'],
      [14, 25, 'KOOFbzzzbfk'],
      [15, 25, 'KOOFfzEEzff'],
      [16, 24, 'KOOOFfbezbtt'],
      [17, 25, 'OOOFbffffff'],
      [18, 24, 'OOOOFbttfbkf'],
      [19, 25, 'OOOFbtttttt'],
      [20, 26, 'OOFbfwwmvv'],
      [21, 25, 'OOOFbfwmmmm'],
      [22, 27, 'OFbbvmvMM'],
      [23, 28, 'KbbfmwMM'],
      [24, 27, 'bkbffffff'],
      [25, 27, 'kkkkbbbbb'],
      [26, 29, 'bkkkkkk'],
      // 毛上發光的電紋：從肩膀頂一路彎折劈到手肘、前臂劈到手腕、大腿一道（中間分一個岔）
      [13, 14, 'U'], [14, 13, 'U'], [15, 13, 'U'], [16, 12, 'U'], [17, 11, 'U'], [18, 11, 'U'], [19, 10, 'U'], [20, 10, 'U'], [21, 9, 'U'], [22, 9, 'U'], [23, 8, 'U'],
      [24, 8, 'U'], [25, 8, 'U'], [26, 7, 'U'], [27, 7, 'U'], [28, 8, 'U'], [29, 8, 'U'], [30, 7, 'U'], [31, 6, 'U'], [32, 6, 'U'], [33, 7, 'U'], [34, 6, 'U'],
      [19, 12, 'U'], [20, 13, 'U'], [21, 13, 'U'],
      [39, 10, 'U'], [40, 10, 'U'], [41, 9, 'U'], [42, 9, 'U'], [43, 8, 'U'], [44, 8, 'U'], [45, 7, 'U'], [46, 7, 'U'], [47, 8, 'U'], [48, 7, 'U'], [49, 6, 'U'], [45, 9, 'U'], [46, 10, 'U'],
      [45, 24, 'U'], [46, 24, 'U'], [47, 23, 'U'], [48, 23, 'U'], [49, 22, 'U'], [50, 22, 'U'], [51, 21, 'U'],
    ],
    // 身體外面跳的電（整張 80×68 的座標，Z 亮的芯、X 外圍的光）：天上一道劈到肩上的尖毛（中間分岔）、三根尖毛之間兩道電弧、頭頂一點、
    // 另一邊肩膀外面和手肘外面、拳頭打地濺起來的火花。第二幀照鏡子翻到另一邊（上半身的跟著往下沉一格）。
    bolt: [[0, 74, 'ZZX'], [1, 73, 'ZZX'], [2, 71, 'ZZZX'], [3, 70, 'ZZ'], [3, 74, 'ZX'], [4, 69, 'ZZ'], [4, 75, 'X'], [5, 68, 'ZZ'], [6, 67, 'ZZ'], [7, 66, 'Z'], [8, 65, 'Z'],
      [9, 52, 'Z'], [8, 53, 'Z'], [9, 54, 'Z'], [8, 55, 'X'],
      [5, 58, 'Z'], [6, 59, 'Z'], [5, 60, 'Z'], [6, 61, 'Z'], [7, 62, 'Z'], [8, 63, 'X'],
      [7, 38, 'X'], [8, 39, 'ZZ'], [9, 41, 'X'],
      [17, 3, 'X'], [18, 2, 'Z'], [19, 1, 'Z'], [20, 1, 'ZZ'], [21, 2, 'Z'], [22, 1, 'Z'], [23, 0, 'Z'], [24, 1, 'X'],
      [40, 2, 'X'], [41, 1, 'Z'], [42, 2, 'Z'], [43, 1, 'X'],
      [45, 77, 'Z'], [46, 78, 'Z'], [47, 77, 'X'],
      [61, 77, 'Z'], [62, 76, 'Z'], [62, 78, 'X'], [63, 77, 'ZZ'], [65, 77, 'X'], [66, 76, 'Z'], [66, 78, 'Z'], [67, 77, 'X'],
      [63, 60, 'X'], [64, 61, 'Z'], [65, 60, 'Z'], [66, 61, 'X']],
    pix(f) {
      const g = Array.from({ length: 64 }, () => Array(36).fill(' '));
      this.half.forEach(([y, x, s]) => { for (let i = 0; i < s.length; i++) if (s[i] !== ' ') g[y][x + i] = s[i]; });
      const c = (ch, side) => (this.face[ch] ? this.face[ch][side] : ch);
      let rows = g.map(r => r.map(ch => c(ch, 0)).join('') + r.slice().reverse().map(ch => c(ch, 1)).join(''));
      if (f) rows = [' '.repeat(72)].concat(rows.slice(0, 32), rows.slice(33));   // 第二幀：上半身往下沉一格（呼吸），拳頭和腳不動
      const bolt = f ? this.bolt.map(([y, x, t]) => [y < 36 ? y + 1 : y, this.w - x - t.length, t.split('').reverse().join('')]) : this.bolt;
      return rows.map((s, y) => [y + 4, 4, s]).concat(bolt);
    } };
  // ==== 雷鳴猿・手點 完 ====
  // ==== 手點共用 ====
  // ---------- 一格一格點的怪物共用（2026-10-10 作者認可雷鳴猿的畫法之後，其他隻照同一套）----------
  // rows＝一列一列的字（空白或 . 是透明）；sym＝只點左半邊，右半邊照鏡子翻過去、用 face 的第二個顏色（朝外的那一面背光）；
  // face＝面的字 → 左半邊、右半邊的顏色字（沒寫的字照原樣）；pad＝上、左、右留給特效的格數（腳底不留，腳才會踩在地上）；
  // breath＝第二幀把這一列拿掉、上面整個往下沉一格（呼吸）；f1＝第二幀另外蓋上去的格子（' ' 不動、'.' 擦掉）；
  // fx＝身體外面的特效（整張的座標）；fx2＝第二幀的特效（沒寫就把 fx 左右翻過去，上半身的跟著沉一格）。
  const hand = def => Object.assign(def, {
    pix(f) {
      const P = this.pad || 0, BW = this.w - P * 2, BH = this.h - P, HW = this.sym ? BW / 2 : BW;
      const g = Array.from({ length: BH }, (_, y) => Array.from({ length: HW }, (_, x) => { const ch = (this.rows[y] || '')[x]; return ch && ch !== '.' ? ch : ' '; }));
      (f && this.f1 || []).forEach(([y, x, s]) => { for (let i = 0; i < s.length; i++) if (s[i] !== ' ' && y >= 0 && y < BH && x + i >= 0 && x + i < HW) g[y][x + i] = s[i] === '.' ? ' ' : s[i]; });
      const c = (ch, side) => (this.face[ch] ? this.face[ch][side] : ch);
      let rows = g.map(r => r.map(ch => c(ch, 0)).join('') + (this.sym ? r.slice().reverse().map(ch => c(ch, 1)).join('') : ''));
      if (f && this.breath != null) rows = [' '.repeat(BW)].concat(rows.slice(0, this.breath), rows.slice(this.breath + 1));
      const fx = this.fx || [], cut = this.breath != null ? this.breath + P : -1;
      const fxf = !f ? fx : this.fx2 || fx.map(([y, x, t]) => [y < cut ? y + 1 : y, this.w - x - t.length, t.split('').reverse().join('')]);
      return rows.map((s, y) => [y + P, P, s]).concat(fxf);
    } });
  // ==== 手點共用 完 ====
  // ==== 霜冠鹿・手點 ====
  // ---------- 領主體・霜冠鹿 v12（2026-10-11 作者給的參考圖：昂首、巨大的白霜鬃毛、寬大的冰角垂著冰柱、細長的灰藍腿、深藍蹄）----------
  // 參考圖縮小當底稿（輪廓、亮暗），頭、腳、蹄一格一格點。光從左上來。
  // 字：1～5 毛（灰藍，暗→亮）、6～9 霜毛（暗→亮）、a～d q 冰（暗→亮）、h k 蹄（深藍）、E 眼睛的亮點、z 眼睛、n 鼻頭、p 耳朵裡；Z X 冷霧和冰光（不描邊）。
  HD.frostdeer = hand({ w: 108, h: 116, pad: 4, breath: 66, eyes: 'E', spikeOn: '45',
    pal: () => ({"1":"#1A1E2C","2":"#283044","3":"#3A445E","4":"#55607E","5":"#76829E","6":"#8C96B4","7":"#A9B3CC","8":"#CCD4E6","9":"#EEF2FA","a":"#2A3C70","b":"#4664A6","c":"#7A9AD6","d":"#B0C8F2","q":"#EEF6FF","h":"#2C3E86","k":"#121A3A","E":"#E8FCFF","e":"#5AB4FF","z":"#05070C","n":"#05070C","p":"#B86A78","Z":"#E8F8FF","X":"#7AB8E0"}),
    ol: { '*': ['#1C2734', '#04070C'], bare: 'ZX' },
    face: {},
    rows: [
      '....................................................................................................',
      '.................................................................................c..................',
      '.................................................................................bc.................',
      '............................................................c....................qd.................',
      '.........q..................................................q....................qb.................',
      '.........qa.....ad..........................................dq..................aqd.................',
      '.........cq.....qc..........................................aqq......q.........acda.................',
      '.........aqb...aqa...........................................cq.....qd.........qqbdcq...............',
      '..........cqaccqc..............q.......................d.....cqq..bqqa.........bqcqd.............d..',
      '..........adqcqqa..............qc......................q.....qdqcqqdq..........dqqc........a...bdc..',
      '..........qdqqddca.............dq......................q.....bbddqdbd..........qqq.........qaadqqa..',
      '.d........cadqddca...d.........aqb....................cq......adqda......d....cqqd........aqqqdcca..',
      '.da.........bddda....q.........aqc....................qd......dqdb.......q...cqqdqc......aqqqcba....',
      '.aqb........adqd....aq..........dqdq................ccqq......qqqa......cq..dqqbcqa.....aqqcbc......',
      '..dqa..d.....cqq....aqq.........adqb................aqda.....bqdqa.....bqqdqqdcbacqcqdqqqqbacb......',
      '..acqcadd....bdqa....dq........aadqa................aqd......qqdda....aqqqdqcddqqqqqqqdcaaccq.......',
      '..aabdqqqa...ccqqac..cqa.......dacqb...............aqdd....aqqdqqadaacqqqqddqqqddqdccqbababqq.......',
      '....abacqqaaacbcqqd..acca......aqqqca.............addcaaaaqqqcdbbqqqqqqdcadcaaaaaaaabcdca..bc.......',
      '.....cqcbdqqqqddbqqqcaccqadc....adqdcb...........bbbdqdqqqqdbcqdqqqqddcbcdqqccddcbabcdba............',
      '.....bdqbccccccbbddqqqqbdqdbqa....abdqc.....cccdqcddqqqqddccaccdddbcddbaaaccaaaadqdqddaa............',
      '......bdacbqabbabdccdbcccdqqqqqqcdaabdd577775qqqqcbbcccbccccbccccddcdaa.........adccdqqab...........',
      '......cbacadcdcdbaacdcccbadcccbdqdca567777765.dc33baaaabqcb..aabcqqdd............bqcbdqqba..aq...abd',
      '.........daccccb....ca............56777765544.3445543...........acqa..............baacdqqqbdqcaacqq.',
      '.........addcdb.................567776543zE3434ppp432............aqa................aabcbdqqqqqqqb..',
      '..........dqqbb................nn776665543zz3.3pp432..............d...................adbaabbbaab...',
      '..........bcdab...............nn8765555544344..3332...............d...................aqddqdaa......',
      '...........ada.................8811244555544333244................c....................cdqcca.......',
      '...........ad...................776.344444333222..................a....................ccqab........',
      '............c......................776667766...5.......................................bbqaa........',
      '............b...............8.....78754673678872........................................ad..........',
      '...........................7788....86533777887886........................................d..........',
      '...........................887887866222666789888886......................................c..........',
      '...........................87887667765166677899877.......................................c..........',
      '...............................8878867687888789867..................................................',
      '...............................868869668888887868866................................................',
      '..............................6774676998878888988876................................................',
      '.............................6686666779868888789988777..............................................',
      '............................68876678878688888878986767..............................................',
      '..........................813877778888697888887786876...............................................',
      '.........................6688778778888789988788668888...............................................',
      '..........................6787888898887769868888677888..............................................',
      '........................6688877788888887786887886667788.............................................',
      '.......................58878887688788888868887887667733.............................................',
      '.......................5138788768888888888888778787783..............................................',
      '.......................4677788888888888887888677888886..............................................',
      '......................61687788888999888767878667888876..............................................',
      '.......................98887887887899877868778778888787.............................................',
      '.....................7789986789888789868878668887788777.............................................',
      '....................51778986878998778688876788888878786.............................................',
      '.....................588786686789868688886678878871778786667........................................',
      '....................6877767688998688898887888888861577788766........................................',
      '.....................7767876787799877899877888878614447888865.......................................',
      '.....................4188786688789868789866788866612514476731.......................................',
      '.....................44877889788786888786778888736135433322545445...................................',
      '....................61677887799887898886878818861614234445666666555.................................',
      '......................5778687798687899887888178115253443344567866567................................',
      '.....................6177678878688777986887118632234435242224466655786887...........................',
      '......................577778886888787868881127443354556466541352354488788866........................',
      '.....................2878766888888676667881324433853636666654245253468767886........................',
      '....................6547896688888767676685133344578464665555542555222786687876......................',
      '.....................5187699877878668861823424556676666554555344455226756788715.....................',
      '......................486779868678778851633313766666666554455154456456625476877.....................',
      '.....................6566678687678778811454216646666665544544154447435623467687.....................',
      '......................551786676777878341334156655553555534433144447443432466678.....................',
      '.......................5168778778887812243333544555555433334422544645353216766411...................',
      '.......................4177787988887811123224545444444212445432444654444213466511...................',
      '......................6...878769987781132323342145.4332222222114545544443111466.....................',
      '......................7...766778986676123112222253..4332222221144445434241..566.....................',
      '.....................7..88616777866666311142113121..4332222221144445433341..437.....................',
      '.....................7.6...16668676776661145133412...433222221134335433331...27.....................',
      '.....................6......6667876667761225344212...4332222211.5344534441....6.....................',
      '..........................886766866766651235322212...4332222211.1523533422....5.....................',
      '........................68..6666677777651254212566....433222211.1354452332....4.....................',
      '.........................7..7..6667777662343216566....433222211.41353333441.........................',
      '........................7..6.685478766662344236464.....43322211.45124444135.........................',
      '........................7.......167766664242156665.....43322211.355111344222........................',
      '........................6........66816665132167254......4332211.355511144522........................',
      '...............................88.381666513216615.......4332211..355631244311.......................',
      '.............................687.61616766122366..........433211...36663115325.......................',
      '..............................7....766544321535..........433211...466665123253......................',
      '.................................3321.5443................433111..536666..133551....................',
      '.................................3321.5443.................4331111426664..1156156...................',
      '.................................3321.5443.................4331222116654....566166..................',
      '.................................3321.5443..................43321241563.....157776..................',
      '.................................3321.5443..................43322231565......56777..................',
      '.................................3321.5443...................321232..6.......35667..................',
      '.................................3321.5443...................32133............1667..................',
      '.................................3321.5443...................32132.............577..................',
      '.................................3321.5443..................32144..............2771.................',
      '.................................433255432..................32143...............685.................',
      '.................................433255432..................32143................86.................',
      '.................................433255432..................3214.................87.................',
      '..................................432.543...................6654.................78.................',
      '..................................432.543..................665.3.................68.................',
      '..................................432.543..................665.1..................86................',
      '..................................432.654..................665....................88................',
      '..................................432.654..................665....................786...............',
      '..................................543.654..................665....................7875..............',
      '..................................543.765.................665.....................6665..............',
      '..................................543.765.................665.....................4661..............',
      '.................................6654.765.................665.....................366...............',
      '.................................66548876................hhk......................477...............',
      '.................................654.8876...............hhkk.....................hhhk...............',
      '.................................654.8876..............hhhkk....................hhhkk...............',
      '................................hhk..876...............kkkkk...................hhhhkk...............',
      '...............................hhkk..876.......................................kkkkkk...............',
      '..............................hhhkk..876............................................................',
      '..............................kkkkk..876............................................................',
      '.....................................hhhk...........................................................',
      '....................................hhhkk...........................................................',
      '...................................hhhhkk...........................................................',
      '...................................kkkkkk...........................................................'],
    // 鼻孔呼出來的冷霧、角尖旁邊的冰光（兩幀不一樣）
    fx: [[30, 29, 'X'], [31, 27, 'XZ'], [33, 26, 'Z'], [4, 85, 'X'], [3, 84, 'XZX'], [4, 86, 'X']],
    fx2: [[31, 28, 'Z'], [32, 26, 'ZX'], [34, 27, 'X'], [9, 5, 'X'], [8, 4, 'XZX'], [9, 6, 'X']] });
  // ==== 霜冠鹿・手點 完 ====
  // ==== 熔顎蜥・手點 ====
  // ---------- 領主體・熔顎蜥 v3（2026-10-11 作者給的參考圖：岩塊一樣的黑色厚皮、一條條發光的岩漿裂紋；背上一排金字塔一樣的大岩刺；張著大嘴、嘴裡整片熔岩的光和尖牙；尾巴末端一顆方岩塊）----------
  // 一塊一塊點：身體、頭、腳、尾巴各是一塊岩（左上亮、右下暗），用岩漿的裂紋切成一片一片；岩刺左面亮右面暗。只有岩漿和眼睛發光。
  // 字：1～5 岩石（暗→亮）、o O Y W 岩漿（暗紅→亮黃）、E e 眼睛。
  HD.lavajaw = hand({ w: 130, h: 84, pad: 4, breath: 40, eyes: 'Ee', spikeOn: '45',
    pal: () => ({"1":"#0E0B0B","2":"#1C1717","3":"#2A2323","4":"#3E3535","5":"#5A4E4C","o":"#8A260E","O":"#F06A1A","Y":"#FFB040","W":"#FFE8A0","E":"#FFD04A","e":"#FF8A2A"}),
    rows: [
      '......................................................................................................555.................',
      '....................................................................................................555555555.............',
      '.................................................................................................5555555555555555.........',
      '......................................5........................................................555oo5555555555555524......',
      '.....................5...............45......................................................5555555oo5555555555244.......',
      '....................45...............45.............5.......................................4455555555oo55555524422.......',
      '....................45..............4452...........45.......................................33444555555555555442222.......',
      '...................4452............44452...........45.......................................33333444555555544222222.......',
      '...................44522...........44452..........4452......................................3333333344455442o222222.......',
      '..................4445o2..........4444522.........4452......................................3333333333344222o222222.......',
      '..................44452o2.........4444522........4445o2.....................................33333333333312222o22222.......',
      '.................444452o2........444445222.......44452o............5.........................333O333333312222o22222.......',
      '................45444522o2.......544445222......444452o2..........45.........................3333O333333122222o2222.......',
      '................45444522o22.....45444452222....44444522o.........445.........................33333O33333122222o2222.......',
      '...............454444522222.....54444452222....45444522o.........4452........................333333O333312222222222.......',
      '...............4544411OOOY222..4544444522222..45444452222.......44452........................3333333O3331222222222........',
      '...........554444333333221222222444444522222..45444452222......44445o2........................333333O33312222222..........',
      '.........11444443333332221OO2O12222444522222.4544444522222....4444452o..........5.............22333O3333122222............',
      '.......33O444443333332221O11221OOO12O252222224544444522222....4544452o2........45.............22223O333312222.............',
      '.....333O144443333322221O1222222212YO2122222254444445222222..454444522o2......445............22222221333122...............',
      '....OO11O44443333322222O555542222222O112O222224444445222222.4544444522o2.....44452..........22222222...31.................',
      '...512OO144433333222222111111222221O122254444444522222224544444522222....44452.........122222222....1.................',
      '..55551244433333222221122eEEe222222121222444444452222245444444522222...44445o2.......1O22222222......................',
      '..55555O14333322222212222111122221O22222222224445224544444445222222.4544452o2.....33O2222222.......................',
      '.555555O1333322222212222222222222212222222222O122222444444452222...5444452o2....333O1222222.......................',
      '5555555O13332222221Y122222222222O1222222O12O12222222222O4445555443454444522o2..33321O222222.......................',
      '5555555O111OOO2O2O1OO222222222212222222242122222222222212555554434544444522o2.3331OO1OO122........................',
      '.555555YOOO11133333212O12222222Y1222222224O1222222222222O55554334544444452222233OY2222212O........................',
      '..5112OO13333333332222122122221O22222222221O222222222222O155433333444444522231OO1222222221........................',
      '...2113Y13333333322222222OO111O22222222224422222222222221O113333333333445122O21222222222.........................',
      '....4331O333333322222222211OO212222222222444O122222222222212OOO1333333333322222222222222222.........................',
      '.....3o55422oo32222222211YO22O122222222244443O12222222222222O14111OO113333311222222222222222..........................',
      '......o55422o5554222oooooooooo2122222224444331212222222222222O2214333311OO11122222222222222222..........................',
      '.....oo55422oo55422oo5554222oo55422ooo4444333Y12222222222222221Y1O23333333331O2122222222222211OO..........................',
      '.....oo55422oo55422ooo55422ooo55422ooo4433331O5112122222222221O221O133333333331O222222222222112...........................',
      '.....ooo542ooo55422OOO55422Ooo55422oooo33333215544OY122222222Y22221Y33333333333Y222222222222551...........................',
      '.....ooo542ooo55422OOO55422OOO55422oooo3333215544444OO22222O1222222123333333333O1222222222222551..........................',
      '.....ooo542oOO55422OOO55422OOOO542ooooo3331O5544444441OO222122222222O13333333331O22222222222225422........................',
      '....oooo542OOO55422YYY55422OOOO542oooooo33O1544444444441O2O2222222222O13333333312222222222222244122.......................',
      '....oooo542OOO55422YYY55422YOOO542Oooooo31O544444444444332222222222221O13333333321222222222222244O122.....................',
      '....oooo542OOOO542YYYY55422YYYO542OOooooOO544444444444333O122222222222OO13333333O222222222222222412122....................',
      '....ooooo4OOOOY542YYYYY542YYYYY542OOoooooY144444444433333Y12222222222212213333331O12222222222222112Y2222..................',
      '....ooooO4OOOYY542YWWWW542YYYYY542OOOoooo12444444443333331O2222222222221O21133331O1222222222222O2O2O1222O.................',
      '...oooooO4OOYYY542WWWWW542WYYYYY4OOOOoooo2O1444444333333311YO122222222212Y2113331221222222221OO1111OO11O1................',
      '...ooooOOOOOYYY542WWWWW542WWYYYY4OOOOOoooo1O444433O2O111O21443222222222212O211333OO122222212O44333221OO1................',
      '...ooooOOOOOYYY542WWWWW542WWWYYY4OOOOOoooo2214555555511Y1444322222222222112Y211331O122221O1444332222211...............',
      '...ooooOOOOOYYYY4WWWWWW542WWWYYYYOOOOOooo22121155555555O14422222222222221122OO1111OO11OO144444322222111...............',
      '...ooooOOOOOYYYY4WWWWWW542WWWYYYYOOOOOooo222OO11555555512422222222222222211OOOO1112OO21444444421111YO2O1...............',
      '...ooooOOOOOYYYY4WWWWWWW4WWWYYYYYOOOOOoo22221O2155555555O122222221O22222211O2OOO11O21444444442O2OOOOO11O1..............',
      '...oooooOOOOYYYY4YWWWWWW4WWY4YYYYOOOOooo221OO11O1555555411222222121222222211OOO2OO2444444444421111122441O12..............',
      '...oooooOOOO4YYYYYYWWWWW4WYY4YYYOOOOOooo1OO1222OOO5555441O2222212122222222111OO22O444444444442222212144432O2..............',
      '...ooooooOOO4OYYYYYYYYYY4YYY4YYOOOOO4ooO1332222512O554444O12221O122222OOOOO111121Y4444444444222221O14443331O1.............',
      '...ooooooOOO4OOYYYYYYYYYYYY542OOOOOO4oo3332222255552214441O221O1222222222222222212144444444422222214443331112.............',
      '....ooooooO542OOOYYY4YYYYYY542OOOOO54233322222255544OO2111O1OY12222222222222222211O4444444.222221O444333311YO.............',
      '....ooooooo542OOOOOY4YYYYYO542OOOOo5423322222225544441OOO12O2122222222222222222111OO444.....2221O444333311222O............',
      '....ooooooo542OOOOO542OOOOO542OOOoo54232222222254444441Y2YOO122222222222222222211OO2........222O1443333312OOOY............',
      '....ooooooo542OOOOO542OOOO55422oooo542222222222444444411OOO2122222222221O2222211O............221443333312O2211............',
      '....oooooo55422ooOO542OOOO55422ooo5542222233222Y444444411OO122222222222OO22222...............1O44333333OOO111.............',
      '....oooooo55422oooo542oooo55422ooo5542244333221144444111OOO1222222222212O.....................14333331O133333.............',
      '....oooooo55422ooo55422ooo55422221O14444333332O2OO2OOY111111O2222222212OO.....................11111YO23333333.............',
      '....oooooo55422O14554221O211OO11OO144443333331O21111111131111O122112O1......................112OOO13333333.............',
      '....22222222212144322222221O2OOOO144443333333O12O1111113111111OYOO1......................OOO2213333333..............',
      '...2222222222O1443222222222221O14444433333333O12211111311111111O.....................124O11333333124............',
      '...222222222124432222222222222O444443333333333...O111311111111122.....................124...124...1244...........',
      '..2222222222O433222222222222221144433333333333...21131111111111O22.....................124...124....144...........',
      '...22222222O133222222222222222224433333333333....2O311111111111Y1222.....................12....124....124...........',
      '....2222221O332222222222222222221333333333........22OOO11111112OOO1222......................22....124.....22...........',
      '..124.2222O33222222222222222222223333333..........112Y2Y2OOOOO111O2Y12222......................22.....22.....22...........',
      '..124..22O13222222222222222222222OO22.............11OO2OO2OOOO222211OO22.......................2......22.....22...........',
      '.1144..124...114...................................11OOO22OOO12222222122..............................22..................',
      '.114...124...114...................................11O22OOOO11112222222...................................................',
      '.224...124...114...................................1112YOOOO11111222222...................................................',
      '.22....12....114.................................1241122O2O22O11111124....................................................',
      '.22....22....122................................1124...124...114...124....................................................',
      '.......22.....22................................1144...124...114...124....................................................',
      '.......22.....2.................................124....124...114....124...................................................',
      '................................................22.....14....114....122...................................................',
      '................................................22.....22....122.....22...................................................',
      '................................................22.....22.....22.....2....................................................',
      '.......................................................2......2...........................................................'],
    ol: { '*': ['#1A1414', '#050303'] },
    face: {}, fx: [], fx2: [] });
  // ==== 熔顎蜥・手點 完 ====
  // ==== 沙暴鯨・手點 ====
  // ---------- 領主體・沙暴鯨 v3（2026-10-11 作者給的參考圖：從沙裡衝出來的巨大座頭鯨，沙色的皮、長嘴線、喉嚨淺色的褶紋、沙殼和藤壺；長胸鰭往右下伸，尾鰭在右上翹起，底下捲起一團沙塵）----------
  // 輪廓、鰭、尾巴照參考圖描；皮的明暗拿參考圖縮小的亮暗；嘴線、褶紋、眼睛、藤壺、沙塵一格一格點。光從左上來。
  // 字：1 2 深色的紋和縫、a～e 沙色的皮（暗→亮）、f F 喉嚨的褶紋、u v w 沙塵（暗→亮）、E 眼睛的亮點、z 眼睛。
  HD.sandwhale = hand({ w: 136, h: 96, pad: 4, eyes: 'E', spikeOn: 'de',
    pal: () => ({"1":"#241A10","2":"#4A3820","a":"#6E5432","b":"#94723F","c":"#B8924E","d":"#D4AE62","e":"#EACB84","f":"#A0804E","F":"#D6BC8A","u":"#8A6E46","v":"#B49466","w":"#D8BC8A","E":"#F4E8C8","z":"#120C06"}),
    rows: [
      '.......................................................................................................dd.......................',
      '......................................................................................................dddddd....................',
      '......................................................................................................dbdddddd..................',
      '.....................................................................................................dddbdddddd.................',
      '.......................ddddeeeeeddddeede.............................................................ddddbdddddd................',
      '................ccbbbbbeeeeedeeeddddddddddddeccdedddddd.............................................ddddddbdddddd...............',
      '.............bccccbbbccbceeddddddddddddddddddcdd22deedddddd.........................................dddddddbdddddd..............',
      '............bcccccccbcccbcbbdcddddddddddddddddedddddeeddddddddd....................................dddddddddbdddddd.............',
      '...........bbcccddddcccccb22222222222deddddddd2dddddddddddddeedddde...................d............ddddddccccbbccccc............',
      '..........cccccdddd2222222cccccccccdd222222222dddddddddddddeeedddddddda...............db............dddddccccccbbbcccc..........',
      '.........cccccd2222ddbccccccbccccccccceddddddddddddeedddddeeeedddddddddddaa..........ddb............dddddcccccccccbbcccc........',
      '........ccccccdddddddbdccccccbcccccbcc2eeeeedddddddeeddddddceddcddddddddddaaaa......dddb............dddddcccccccccccbbccbb......',
      '........ccccccdcdddddddddddccbccccccccccbccecbdddddedddddeddcdcccddddddddddaaaa.....dddbb............ddddcccccccccccccbbbbb.....',
      '........bccccbcccddddddddddbbbbbbbbbbbccbbccbbbdddbcddddeeeddddcccbddddddddddaaa...ddddbb............ddddcccccccccccccccbbbb....',
      '........abcccbcccddbbbbbbbbccccccbccccbbbbbbbbbcccbbddddeeededddcbbcccedddddddaaaa...ddbb............ddddcccccccccccccccbbbbb...',
      '........abbbccccddddcccccccccccccbbcccccbbcbbbbbbcbbbbbcdeddeedddddccc2dddddddddeaa.....bb............dddcccccccc.ccccccbbbbbb..',
      '.........abbbcccdddcccccccccccccccbbccccccccbbcccbbbbbbbdddddeedddddccddddcddddd2aaaa..................ddccccccc....ccccbbbbbbb.',
      '.........2bbbccdcdccccbccdccccccccbbbccccccccccccccccbbbddddddedddeddddddcccdddddddaab..................cccccbcc.......cbbbbbbbb',
      '.........12bbbaacccccbbcccbddccccccbbbcbccccccccccccccbbdddcdddddd2dddddccccdddddddcbbb................aacccbbbc................',
      '.........f122baaaaaabbbccbbbddcccccbbbbbbcccccccccccccdbddcccddddddddddddcccbcddddccbbbba..........b..aaaabbbbc.................',
      '.........fe112aaaaaaaaabbbbbdddcccccbbbbbcccccccbccbcccbddbcccddddddddddddcccccddccccbbbaa........db..aaaaabbcc.................',
      '.........Ffea12aaadaaaabbbbbcccdcccccccbacedccccbbbbcccbbbbbcccccccddddddddeccbcddccccbaaaaa.....ddb.aaaaaaaaaa.................',
      '.........FFfea12adddaaaaaabbcccccccccccbac22ccccbbbbbccccbbbbbeecccdddddddddcccbbbdccddaaaaaa...dddb.aaaaaaaaa..................',
      '.........fFFFef122bbccaaaaaaaccccccccccbbccccccccccbbcccccbbbaaeddedcddddddddddbbbbdddddaaaaaa.ddddbbaaaaaaaaa..................',
      '..........fFFFee112bbaaaaaeaadcccccccccbbcccccccccccbbccccbbaaaadd22ccddddddddddebccdddddaeaaaa.dddbbaaaaaaaaa..................',
      '..........fffFFfec12bbaaaa2aaacccbccccccccccccccccccbbcccbbababbbdddcddddccddddddebbbddddd2aaaaa.ddbbaaaaaaaa...................',
      '..........FfffFFfec122aaaaaaaaacccccccccccccccccccccbbbcbba2222bbcdccccdddddddddddebbbddddddaaaa...bbaaaaaaaa...................',
      '..........FFFffFFFef1122baaccaacbbcccccccccbbccccccccbeccb2zzE2aabcdccccddddddcccddddbbddccddaaaa..abaaaaaaa....................',
      '..........fFFFffFFFefd112bbbaaacbccccccccccbbbcccccccc2cbb2zzz2aaabdddcdbbededcdccccddddcccdddaaaa.aaaaaaaaa....................',
      '..........fffFFfffFFeefc122bbaaaabccbccccccbbbbccbccccccbba222aaaabbdddbbbee22dddccccdeeccddddcaaa.abaaaaaaa....................',
      '...........fffFFfffFFFeef1122baababcdbccccccbbbbbbbccccbbbbccbbaaabbbbbacceddbdddddcccdeedcddcccaacdbbaaaaa.....................',
      '...........FFffFFFffFFFFefb112aaaaabbbbccccccdbbbbbccccbbbbcccbbcccbbbbacccccbbbedddccdddddcccccccccbbbaaaa.....................',
      '...........FFFffFFFfffFFFeefb122aaaaabbbcccccddcbbbbbccbbaaccccccccabbbaddccccbbbcdedccdddccccccccbbbbbaaaa.....................',
      '............FFFfffFFffffFFFeef1122aaabbbbbbbcccccbbbbbcbbcaaccbbbbaaaabbddccccbbcccdddccdccdccccccbbbbbaaa......................',
      '............fFFFfffFFFfffFFFFeff1122aabbbbbbbcccccbbbbcbccaaabbbbbaaaaabaaaccccbccccccdcccccdcccccdbbbbaaa......................',
      '............ffFFFFffFFFFfffFFFeeff1122aabddcbccccccccbbcccaaaaabaaaaaabbbaaaccccccccccccccccccdcccddbbaaaa......................',
      '.............ffFFFFfffFFFffffFFFeeff1122addbbbbccccccdbccbbaaaaaaaaaabbbbbaaacccbbbbcbbccccccdddccbdbaaaa.......................',
      '.............FffFFFFffffFFFfffFFFFeeff11222ccbbcccccdddccbbaaaabbccaaabaaaaaaaabcbbbbbbccccccddddcbbccc.a.......................',
      '.............FFfffFFFFfffFFFFfffFFFFeeff111222bccccccdddccbbabbbbccaaaaaaaaaaaaaccbbbbbbcbbbcddbbcccccc.........................',
      '.............fFFfffFFFFFfffFFFffffFFFFeeffb11122cccccadddcccbaaaaccaaaaaaaaaaaaaaccbbbbbbbbbbddbbccccc..........................',
      '..............fFFFffFFFFFffffFFFffffFFFFeeeffa11222cccacddcccbaaacccaaaaaaaaaaabcabbbbbbbbbbbbbbbbbccc..........................',
      '..............ffFFFfffFFFFFfffFFFFffffFFFFFeefff111222cadddcccaabbccaabaaabbccbcccacccbbbbbbbbbbaadbc...........................',
      '..............FfffFFffffFFFFFfffFFFFffffFFFFFeeefff111222adcccbbbbccbbbbbbbbccccccccccbbbbbbbbbbbaaab...........................',
      '...............FfffFFFfffFFFFFffffFFFFfffffFFFFFeeefff1112222cbbbbccbbbbbbbbdddddcbdcbbbbbbbbbbbbbbaa...........................',
      '...............FFFffFFFFfffFFFFFffffFFFFffffffFFFFFeeffcb111122bbbbccbbccccccdddccdddcbbbbbbabbbbbbb............................',
      '...............fFFFfffFFFffffFFFFFffffFFFFFfffffFFFFFeefcbaaa11bbbbcccacceeeeeecdddddccabbbbbbbbbbbb............................',
      '................ffFFffffFFFfffFFFFFFffffFFFFFFfffffFFFFFFcddaaabbbbbccaaccccccceeeeeeeccabbbbbbbbbb.............................',
      '................fffFFFfffFFFFfffFFFFFFfffffFFFFFffffffFFFFddaaabaabbbcbbcccccccccccdddeccbbbbbbbbbb.............................',
      '................ffffFFFFfffFFFffffFFFFFFffffffFFFFFffffffFddaaaaaaababbbbbcccccccccccddeeaabbbbbbb..............................',
      '.................FffffFFFffffFFFffffFFFFFFFfffffFFFFFFfffffcbbaacaabbbbbbbbbccc2cccccccddeaabbbbbb..............................',
      '.................FFfffffFFFfffFFFFffffFFFFFFFFfffffFFFFFFfffcccaaacbbbbbbbbbbcccccccccccddeaaababb..............................',
      '..................FFfffffFFFFfffFFFFffffFFFFFFFFffffffFFFFFFfccaaacbbbbbbbbbbbbcccccccccccdeccbaa...............................',
      '..................2FFFfffffFFFffffFFFFfffffFFFFFFFFffffffFFFFccccccbbbaaaabbbbbbcccccccccccdeeca................................',
      '...................2FFFFfffffFFFffffFFFFffffffFFFFFFFFffffffFbccccbbbbbaaabbbbbbbbccc2cccccccde.................................',
      '...................222FFFfffffFFFFffffFFFFFfffffFFFFFFFFFffffbbbccbbebbaaabbbbbbbbbcccccccccccde................................',
      '...................c2222FFFfffffFFFFffffFFFFFFfffffFFFFFFFFFbccbccbaaaabaaabbbbbbbbbbcccccccccccee..............................',
      '..................ccff222FFFFfffffFFFFfffffFFFFFffffffFFFFFFbacccccbaaabbaaabbbbbbbbbbccccccccccc.e.............................',
      '................ccccbfff222FFFffffffFFFFffffffFFFFFffffffFFFdaabbbccaaaaabaaabbbbbbbbbbbcccccccccc.e............................',
      '...............ccccbb2fff2222FFFffffffFFFFFfffffFFFFFFffffffddbbbbbbcbababaaaaabbbbbbbbbbbc2ccccccc.e...........................',
      '..............ccccbbbb22fff222FFFFffffffFFFFFFfffffFFFFFFfffdccbbbbbbbaaababaaaabbbbbbbbbbbccccccccc.e..........................',
      '............cccccbbbbb222ffff222FFFFfffffffFFFFFffffffFFFFFFdcccbbabbbaabbbbbaaaaabbbbbbbbbbbcccccccc.e.........................',
      '...........cccccbbbbbbb2222fff2222FFFFffffffffFFFFFffffffFFFccccccccbbaabbbbbbbbbaabbbbbbbbbbbcccccccc.e........................',
      '..........cccccbbbbbbb.f22222fff2222FFFFffffffffFFFFFFfffffcccccccccbbbbbbbbbbbb..aaabbbbbbbbbbbccccccc.e.......................',
      '.........cccccbbbbbbb...f22222ffff2222FFFFFffffffffFFFFFFffccccccccccbbbbbbbbc......aabbbbbbbbbbb2cccccc.e......................',
      '.....v..cccccbbbbbb.....fff22222ffff2222FFFFFFffffffffFFFFFcccccccccccbbbcbbb........aaabbbbbbbbbbbcccccc.e.....................',
      '.......cccccbbbbbb.......ffff22222ffff22222FFFFFfffffffffFFccccbcccccccbbbb...........aaabbbbbbbbbbbcccccc.e....................',
      '......cccccbbbbb..........2fff222222ffff222222FFFFFfffffffcccccbcccccccbc..............aaaabbbbbbbbbbbccccc.e...................',
      '.....cccccbbbbb............22fff222222fffff22222FFFFFFfffccccccccccccccb................aaaaabbbbbbbbbb2cccc.e..................',
      '.....ccccbbbbb..............22ffff222222ffffff22222FFFFFcccccccccccbbc...................aaaaabbbbbbbbbbbcccc.e.................',
      '....ccccbbbb...............v..22ffff2222222fffff222222Fccccccccccbbb.v....................aaaaaabbbbbbbbbbbccc.e................',
      '...ccccwwww.........w..........222ffff22222222fffff222ccccbbbbcccbb.........................aaaaabbbbbbbbbbbccc.e...............',
      'w..cwwwwwwwwwvv.v..........w.....222ffff22222222fffffbccccbbbbbcc................w...........aaaaaabbbbbbbbbbbcc.e..............',
      '..wwwwwwwwwvvvv...................2222fffff22222222fbbbbcwwwwwwwv..................w..........aaaaaabbbbbbbbb2bcc.e.............',
      'wwwwwwwwwwvvvvvv...................f2222ffffff22222ccbbbwwwwwwwvvvv............................aaaaaaabbbbbbbbbbbc.e............',
      'wwwwwwwwvvvvvvvv..................w..f22222fffff22cccbwwwwwwwvvvvvvv.........www.................aaaaaabbbbbbbbbbbc.e...........',
      'wwwwwwvvvvvvvvuuu....wwwwww.........w.ff222222fff.wwwwwwwwwvvvvvvvvv...wwwwwwwwww...w.............aaaaaaabbbbbbbbbbb.e..........',
      '.wwwwvvvvvvvuuuuu..wwwwwwwwvv.....................wwwwwwwwvvvvvvvvu.v..wwwwwwwwvvv.................aaaaaaabbbbbbbbbbb.e.........',
      '...vvvvvvvuuuuuu.wwwwwwwwvvvvvvv....v.wwwwwww.....wwwwwwvvvvvvvvuuu....wwwwwwwvvvv...........wwwwvv..aaaaaaabbbbbbb2bb.e........',
      '....vvvvvuuuuuu..wwwwwwwvvvvvvvvu...wwwwwwwwwvv...wwwwvvvvvvvvvuuuu....wwwwwvvvvvvvv....wwwwwwwvvvv...aaaaaaabbbbbbbbbb.e.......',
      'w.....vuuuuuuuu...wwwwvvvvvvvvuuuu.wwwwwwwwwvvvvvvvwwvvvvvvvvuuuuuuw...wwwvvvvvvvvuuuwwwwwwwwwvvvv.....aaawwwwwwbbbbbbbbe.......',
      '.......uuuuuuuu.v.wwvvvvvvvvvuuuuu.wwwwwwwvvvvvvvv.vvvvvvvvuuuuuuuuuw..wwvvvvvvvuuuuuwwwwwwwvvvvvvv.....awwwwwwwvbbbbbbbbew....v',
      '.........uuuuu...wwwvvvvvvvuuuuuuu.wwwwwvvvvvvvvu.....vvvuuuuuuuuu....wvvvvvvvuuuuuu.wwwwwvvvvvvvvuuuwwwwwwwwwvvvvbbbbbbb2e.....',
      '............wwwwwwwwwvvvvuuuuuuuuu..wwwvvvvvvvuuu.....vvuuuuuuu.....vvvvvvvvvuuuuu....wwwvvvvvvvuuuuuuwwwwwwwvvvvvaabbbbbbbw.w..',
      '............wwwwwwwvvvvuuuuuuu.......vvvvvvvuuuuuu.......uuuu..........vvvvuuuuu..v....vvvvvvvuuuuuuuu.wwwwvvvvvvvuuabbbbwwww...',
      '............wwwwwvvvvvuuuu....w......vvvvvvuuuuuuuwww.......................uuu.........vvvvvuuuuuuuuu.wwvvvvvvvuuuuuaabwwwwvv..',
      '............wwwwvvvvvuuu.............vvvvuuuuuu.wwwwwvv..............................v...vvuuuuuuuuuu...vvvvvvuuuuuuaaawwwvvvvv.',
      '............wwvvvvvvuuu..............vvu..uuuu.wwwwvvvvvv.......................wwwwwwwvv.uuuuuuuuuu.....vvvvuuuuuuaaaawwvvvvuu.',
      '...........wvvvvvvuuuu......................uwwwwwvvvvvuuu.....................wwwwwwvvvvvvu.............vvuuuuuuu...aavvvvuuuuu',
      '.............vvvuuuu.........................wwwvvvvvvuuuu....................wwwwwwvvvvvuu...............uuuu.........aavuu....',
      '...............uuu.............................vvvvvuuuuu.....................wwwwvvvvvvuuu................u..............a.....',
      '...............u................................vvuuuuuu......................wwvvvvvvuuuuu.....................................',
      '.................................................uuuuuu........................vvvvvuuu.........................................'],
    ol: { '*': ['#2A1E12', '#0A0604'], bare: 'uvw' },
    face: {}, fx: [], fx2: [] });
  // ==== 沙暴鯨・手點 完 ====
  // ==== 巢織蛛・手點 ====
  // ---------- 領主體・巢織蛛 v2（2026-10-11 作者給的參考圖：黑色岩塊一樣的巨大腹部、纏著蛛絲掛著三顆白卵囊；盔甲頭、深眼窩裡紅眼、四根毒牙；八隻黑腳一節一節、關節暗紅，最前面一對長腳的下半截是血紅的鉤爪）----------
  // 腹部照參考圖縮小當底稿；頭、八隻腳、蛛絲一格一格點。光從左上來。
  // 字：1～5 身體（黑，暗→亮）、6～9 卵囊和蛛絲（暗→亮）、r R S 暗紅的關節和鉤爪（暗→亮）、E e 紅眼。
  HD.tsuchigumo = hand({ w: 146, h: 124, pad: 4, breath: 60, eyes: 'Ee', spikeOn: '45',
    pal: () => ({"1":"#09080B","2":"#131117","3":"#1E1B24","4":"#2F2B37","5":"#4A4654","6":"#7A766C","7":"#A8A294","8":"#D2CCBC","9":"#F0ECE0","r":"#4A1220","R":"#8A2234","S":"#C8405A","E":"#FF3A30","e":"#B81818"}),
    rows: [
      '..........................................................................................................................................',
      '..........................................................................................................................................',
      '..........................................................................................................................................',
      '...........................................................................................555............................................',
      '.........................................................................................44555............................................',
      '.......................................................................................5644555555.........................................',
      '.......................................................................................66522555555........................................',
      '.......................................................................................56522555511........................................',
      '........................................................................................6611555522........................................',
      '.....................................................................................5..626155554.........................................',
      '............................................................................555556555522621655554..5......................................',
      '............................................................................555556555512611165555..544....................................',
      '............................................................................55555655611126116544555545..55................................',
      '............................................................................5555563361112611161445555555555...............................',
      '............................................................................22221633611116115161166555555552..............................',
      '............................................................................22226111811116155166615555511152..............................',
      '..........................................................................511221611181111615661165511111115...............................',
      '..........................................................................522211615181133666511116555111155...............................',
      '.........................................................................5112111615181666615511111655122115...............................',
      '.........................................................................51121136156861126155..221165122115...............................',
      '..........................................................................112113666581....555..221116112311...............................',
      '..........................................................................151166655584....555..331326122317...............................',
      '...................................................................36.....166611655584155655553333321623317...............................',
      '.............................................................22133332..33661111611555515265515113..116333175..............................',
      '............................................................3211122226166151111611555552265115113..116223175..............................',
      '............................................................3311122226611151155611775622265115111..136222185..............................',
      '............................................................3333355661611111155711775623356115513311316321855.............................',
      '............................................................1111166211155111111617775722256115555221216321855.............................',
      '.........................................................2111116622211155511211178775771156125555551216111711.............................',
      '.........................................................25536622211111155222557788778711562255555512161117125............................',
      '....................................................3..22255652211115111552145578888787615622551155111161171255...........................',
      '....................................................33322255112111115565552147788899888655633555115115565171222...........................',
      '..................................................3333311....11111555565552188888898888775633355415555565111233...........................',
      '..................................................3333311....1661115665511118888899888877762235545555556117113322.........................',
      '..................................................332221..33251111555451116888999999889777722..544555655617113322.........................',
      '.................................................2332222..31255551555451157887799999889987741..55511165571711533222.......................',
      '............................................33...223122331111555515431..1678888999999898877411157515155565651511111.......................',
      '..........................3.................11111222113331251555555431..1688898899999988887111117555555515651515555115....................',
      '............................45R............313111222333311255555555555557777898899988899877111115555555545665511555115....................',
      '..........................224RRr4..........11322222..22311255555555555556787799888888889888111115555555547775111552215....................',
      '........................22222Rr34..........11122222..22311255555455555556788899988988888886611144444431577776111322115....................',
      '......................222223334444.........11111122..33111444554455522565588788889988888876611..4444431577776111321115....................',
      '....................222223334444344........121113323333115444555555522565577788899888555877611..2555231678877111111115....................',
      '..................22223333344442344........12113332332315544.......125656677768888888855555651..2552231677888111222315....................',
      '.................322333344444.222344.......11133...322115554.......156656666566888888878655651332252611688888811111315.......3............',
      '.................rrR444444.....223344.....2212.....3231155533...226661115577577888877778655651111252266688888871111325....................',
      '................rrrRRR44........22344.....2112..55332311112333366611155555556777888777775556551221511166889887771113255.3R4...............',
      '................rrRRR4..........223344....2132135331221123226661155...5515556777787755555557551111511578889887775113255.RRr24.............',
      '...............rrrRRR............22334...11132133311221126665555555...511155656655755555551651111551157888888877511335522r2444............',
      '...............223RR.............223344..112222332222266655555555555....111555555555555551156115155115777888877761113322223344............',
      '..............22334R..............223344.332222222316651115555555555....1311555555555555511565551551157788888777621152222223344...........',
      '.............222344...............222344.112222222315555115555555552211113111155556555115115555555555557788787776621222332223444..........',
      '.............223344................22334R111221111155555555555557552255553111115556651111117755555555555666766665262223344223344..........',
      '.............22344.................2223RR1111311111555555555555575555555532221155555511111177551111155556677766551222334455223344.........',
      '............223344..................2rrRRR22232221111..555555555555555555522211555552211111885511111555556777655222233445552233444........',
      '...........222344....................rrR4442232111222..55555555555555555555555555555221111888871111155555566665222333444155.223344........',
      '...........22334.....................r223442111111222...5555555555555555555445555555222111899871122155555556652223344411115..223RRR.......',
      '...........22344......................223344111133322...5555555555555555555555555555233158899881112155555556rr233344431111...2rrRRR.......',
      '..........22344........................223441111333....222553355544..553332665555.....3158899887111115555552rrr34441611111....rrRRRR......',
      '..........22344........................223344111333....222555..5.....233666156533.....31688888875112155115222RR44411161111....rrrR444.....',
      '.........22344..........................22344411133......1555..5...22666331133662.....31668888775122155112233RRRR111161111.....rr2344.....',
      '.........22344..........................222344111333223..1155..3366662311551322161....116678886651222152223344R51111116511......223344....',
      '.........2234............................22334422333223..311556661112211155111111622215167788665551121222334445111111165.........22334....',
      '.........2234............................222344R11322233333666132111255555555115116221516666665515121222334445511111..5..........22334....',
      '.....2...2344............................222334R11322222366211111555555555555515111661511556555511122223444455511113..............2334....',
      '........22344............................3222RRR41322233222211221...5555555555451111161111555551112222344455..33111325............2334....',
      '........2234.............................32rrrR441132111222211111.4455444454444444111161111555111rr233444155..31112225............22344...',
      '........2234..............................2.rr334413312221111112244544444454444444411122211551112rrr34444555.311112215............22344...',
      '.......22344..............................23222344422112121155114444444444544444444411221115512222rRR441441..31112211.............22344.2.',
      '.......22344..............................332222344211121211111333331111135311113333352111115122233RRR55441..1111111...............2344...',
      '....3..2234...............................13222233441111111111131111333333533333111111111111522233444155...11111222................2244...',
      '.......2234.....................4R22222....112222344411111111133333333333E3e3333333331111111222334441......1111122.................2244...',
      '.......2234...................32RRr222222222r12223344111555111333331111333333311113333111112223344411.....1111133..................2234...',
      '......2234.....................rr3433333222rr222223344111122..333331Ee133333331eE13333155522233444.11....1111113...................2234...',
      '......2234....................22RRR44444333Rr222223344424455..222221eE122222221Ee1222222222233444..2233111121113....................2344..',
      '......2234....................233R....44444R4333322334425455553222221122222222211222255512333444222222222r2222224R2.................2244.3',
      '......2334...................22344.........R4444422233335555533222222222E222e2222222255555334455222222222r222233RRrR................2234..',
      '......rRS...................22244........4R22222442244443315521122222222222222222222155555544412333333333R3333442rRR................2234..',
      '......rRS...................2234........2RRr222222r224442221125522111111111111111112111111142222344444444R444444rr344...............2234..',
      '......rRS...................2344........rrR4333333R3222222211552111111111111111111155111111222224444422222RRr4...2234...............2234..',
      '......rRS..................2234........22RR444444R44333333315552111111111111111111155551111533333333R333332RRR...22344...............234..',
      '......rRRS................22344.......2224R.......44444444422....RRR1111111111111.RRR...222r44444444R44444rrR44...2334..............2234..',
      '......rRRS................2234........2234..........RRr234433....RRR111111111111..RRR...333r444r...........2344...22344.............2234..',
      '......rRRS................234........22344..........rRR444444....RRR.1RRR1111RRR..RRR...444R4rRR...........2234....2244.............rrRS..',
      '....2.rRRS...............rrR4........2244...........rRR.....4....224..RRR....RRR..R22...4....rRRR...........2344....234.............rrRS..',
      '......rRRS...............rRR........2234............234.........224...224....R22...224.......r334...........2244....2234............rRSS..',
      '......rRRS...........3..234R........2244...........2234.........224...24......22...224........234............2344....2RR.3..........rRS...',
      '......rRRS.............2234........2234............223..........224..224......224..224........234............2234....rr44...........rRS...',
      '......rrRS.............234.........2344............224...........22..222......224..22.........224.............234.....234...........rRS.2.',
      '.......rRS.............234........rr34.............234...........22...22......22...22.........224.............2244....2244.........rrRS...',
      '.......rRS............234.........rRR..............234............22..22......22..222.........224..............2rR.....234.........rrRS...',
      '.......rRS............234........224R..............234............22...2......2...22...........234.............2rRR....234.........rrSS...',
      '.......rRS...........224........2234...............234.............2..............22...........244..............234.....244........rRS....',
      '.......rRS...........234........234................rR..........................................rrR..............2244....234........rRS....',
      '.......rRS..........224.........234................rR..........................................rrR...............234....224........rRS....',
      '.......rRS..........234........224.................24..........................................224................34.....234.......rRS....',
      '........RSS.........24.........234................224...........................................24................244....224......rrRS....',
      '........rRS........334.........24.................224...........................................23................224.....33......rrR.....',
      '........rrS........33.........224.................224...........................................23.................23.....333.....rrS.....',
      '.........rSS......333.........23..................23............................................234................23......33.....rRS.....',
      '.........rRS......33.........224..................23............................................234................234.....33....rrSS.....',
      '..........rS.....333.........334..................23............................................234................233.....33....rRS......',
      '..........rSS....33..........33...................33.............................................33.................33......33..rrS.......',
      '..........rRS....33.........333...................33.............................................33.................33......33..rSS.......',
      '..........rRS...33..........33....................33.............................................33..................33......3.rRS........',
      '...........rSS..33..........33...................333.............................................33..................33.......rrSS........',
      '...........rrS.............33....................33..............................................333.................33.......rRS.........',
      '............rR.............33....................33...............................................33..................33.....rRS..........',
      '............rRS...........33.....................33...............................................33..................33.....rRS..........',
      '............rRS...........33.....................33...............................................33..................33....rRS...........',
      '.............rRS..........33.....................33...............................................33...................3...rrS............',
      '.............rrRR................................33................................................3.......................RRS............',
      '...............RR................................3.................................................3......................RRR.............',
      '...............RRR.......................................................................................................RRR..............',
      '................RRR......................................................................................................RR...............',
      '.................RRR....................................................................................................RR................',
      '..................RR...................................................................................................RRR................',
      '...................RR..................................................................................................RR.................',
      '...................RRR....................................................................................................................',
      '....................RR....................................................................................................................'],
    ol: { '*': ['#1A1620', '#040306'] },
    face: {}, fx: [], fx2: [] });
  // ==== 巢織蛛・手點 完 ====
  // ==== 千節蟲・手點 ====
  // ---------- 領主體・千節蟲 v2（2026-10-11 作者給的參考圖：S 形盤著的巨大蜈蚣，暗青綠的甲片、銅橘的邊和龜裂紋、銅褐的尖腳；右上一段淡黃的尾節往上捲成鉤）----------
  // 一節一節點：每一節＝一塊甲片（照參考圖的位置）＋底下暗的肚子＋一對腳。光從左上來。
  // 字：1～3 暗的肚子、t T G 青綠的甲片（暗→亮）、c C O 銅橘的邊、裂紋和腳（暗→亮）、w W Y 淡黃的尾節（暗→亮）、E e 眼睛。
  HD.omukade = hand({ w: 148, h: 133, pad: 4, breath: 60, eyes: 'Ee', spikeOn: 'GT',
    pal: () => ({"1":"#140E0A","2":"#24180F","3":"#3A2A1C","t":"#1C2522","T":"#303F39","G":"#4A5E54","c":"#5A3214","C":"#9A5A22","O":"#D88A3A","w":"#9A7E46","W":"#C8A866","Y":"#EAD49A","E":"#FFD84A","e":"#E8862A"}),
    rows: [
      '..................................................C.........................................................................................',
      '.......................................C.........O...........C..............................................................................',
      '......................................OOOOOOO...OOOOOO......O...............................................................................',
      '....................................OOOGGGGGOOOOOOGGGGOOO..O................................................................................',
      '.............................OOOOOOOOcGGGCGGGGOcGGGGGGGGOOOOOOOOO......C....................................................................',
      '............................OOGGccGOcGGGcGGGGGOcGGGGGGGCOcOGGGGGOO....O.....................................................................',
      '..........................OOGGGcGGGOcGGcTTTGGGOcGGTTTGcGOccGGGGCGcOO.O..........................................C...........................',
      '.........................OOGGGGcGGGOcTTcTTTTTTOcTTTTTcTTOccGGGcGGcGOOOOOOO................................C.....ccc.......YYYW..............',
      '........................OGGGGGTTTTTOcccTTTTTTTOcTTTTccTTOccTccTTGGGOcGGGGOO.................................ccccCCcccc...YYYWWW.............',
      '........................GGGGGTTTTTTOcTTTTTTTTTOcTTTTcTTTOcccTTTTTTGOcGGGGcGO.....C.......................cccccCCOOOCcccccYYWWWWW............',
      '.............C..........GGGTTTTTTTTOcTTTTTTTTTOcTTTTcTTTOcccTTTTTTTOcGGGGGccOO..O.......................cCCOOOOO..OOOCCCccWWWWWWw...........',
      '..............O.........GGTTTCTTCTTOcTTTTTTTTTOcTTTcTTTTOccTTTTTTTTOcGGGGGGGGOOO......................CcCOO..........OOOCCWWWWWww...........',
      '..............OOOOOOOO..TTTTcTTOTTTOcTTTTTTTCTOcTTTTcTTTOccTTTTTTTTOcTTTTTGGGOcOOOO...................cCO..............OOOWWWWwww...........',
      '.............OGGGGGGGGOOOOOOOOcTTTTOcTTTccccTTOcTTTTTcTTOccTTTTTTTTOcTTTTTTTGOcGGOOO.................CCO...............WWWWWWwwww...........',
      '...........OOGGGGGGGGGGGGGGGGGOcTTTOcTTTTTcTTTOcTTTccTcTOccTTTcTTTTOcTTTTTTTCOcGGGGOO...............CCC.................WWWWwwwwYwccWW......',
      '..........OGGGGGGGGGGGGGGGGGGGGOcTTOcTTTTTccTTOcTTcTTTcTOccTTTTccTTOcTTTTTTcTOcGGGGGOO....C........CCC...................WWwwwwYwcYWWWW.....',
      '........OOGGGGGGGGGGGGGGGGGGGGGGOcTOcTTTTTTccTOcTTTTTTTcOccTTTTTTcTOcTTTTTTTcOcTGGGGGcO..O.........CC.....................wwwwYwcYWWWWWW....',
      '.......OGGGGGGGGGGGGGGGGGGGGGGGGOcTOcTTTTTTtttOcttTTTTTTOccTTTTTTcTOcTTTTTTTcOcTTTTGGGOOO..........CC........................wccYWWWWWWWW...',
      '.....OOGGGGGGGGGGGGGGGGGGGGGGGGGGOcOctttttttttOcttttttttOccTTTTTTTcOcTTTcTTcTOcTTTTTGGOcO..........CC........................cYYWWWWWWWWw...',
      '....OGGGGGGGGGGGGGGGGccccccccGGGGGOOctttttttttOcttttttttOccttTTTTCTOcTTTTccTTOcTTTTTTGOcOOOO.......CC........................YYWWWWWWWWww...',
      '...OGGGGGGGGGGcccccccOOOOOOOOcGGGGGOctttttttttOcttttttttOcctttttcttOcTTTTTTcTOcTTTTTTTOcGGGGO......C.........................YWWWWWWWWwww...',
      '...OGGGGGGGGccOOOOOOOGGGGGGGGGccGGGGOtttttttttccttttttttOccttttctttOcTTTTTTcTOcTTTTTTTOcGGGGOO...............................WWWWWWWWwwww...',
      '...OGGGGGGccOOGGGGGGGGGGGGGGGGGGcGGGOcctttccccc2cccttttccccttttctttOcttTTTTTcOcTTTcTTTOcGGGGGOO....C.........................WWWWWWWwwwww...',
      '...OGGGGGcGOGGGGGGGGGGGGGGGGGGGGGcGGO22cccc22222222cccccc22cttttcctOctttCTTTTOcTTTTcTTOcTTTccGOO..O...........................WWWWWwwwwc....',
      '...OGGGccOOGGGGGGGGGGGGGGGGGGGGGGGcO2211111c1111111111c12222cctttttOcttctttttOcTTTTTcTOcTTcTGGGO.O.............................WWWYYYwcWWW..',
      '...OGccGOGGGGGGGGGGGGGGGGGGGGGGGGGGO1111cc1cc111111c1ccc111111ccccccctttcttttOcTTTccTcOcTTTccGGOO...............................WYYYwcWWWWW.',
      '...OcGOOGGGGGGGGGGGGGGGGGGGGGGGGGGGO1111cCccc......cCccc111111111c222cttcttttOcTTcTTTcOcTTTTTTcOcOO.............................YYwccWWWWWWW',
      '...OTOTTTTTTTTTTTTTTTTTTTTTTTTTTTTTO...cCccc......cCccc.....11c1ccc112cccttttOcttTTTTTOcTCTTTTTOcGOO...........................YYwcWWWWWWWWWw',
      '...OTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTO....cCcc.......cCccc.......cOccc1111ccttttOctttTTTTOccTTTTTTOcGGGO..........................YYcWWWWWWWWWww',
      '...OTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTO....cOcc.......cOcc.......cCccc..11111cccccctttttTTOcTTcTTTcOcGGGO..........................YYWWWWWWWWWwww',
      '...CTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTC...cCOcc......cCOcc.......cOcc......1111cc2ctttttttOcTTTcTTTOcTGGGO....C....................YWWWWWWWWWwwww',
      '...CTTTTTTTTTTTTTTTTTTTTTTTTTTTTTTC...cOOcc......cOOcc......cCccc.......cCccc12cttttttOcTTTTcTTOcTTTGGO..O.....................WWWWWWWWWwwwww',
      '...CTTTTTTTTTTTTTccccccccccccccTTC....cO..c......CO.cc......cOOcc.......cOccc111ctttttOcTTccTcTOcTTTGGOOO......................WWWWWWWWwwwwww',
      '...CTTTTTTTTTTTccTTTTTTTTTTTTTTTTC....CO..cc.....CO..c......cO.cc......cCccc.1111cttttOctcTTTcTOcTTTTGOO........................WWWWWWwwwcww',
      '...CTTTTTTTTTccTTTTTTTTTTTETTTTTC.....CC.........CC.........CO.cc......cOcc....111ccctOcttTTTTcOcTTTTTOc.......................YYYYWWWwccww.',
      '...CTTTTTETccTTTTTTTTTTTTTTTTTTCc.....CC.........CC.........CO.cc.....cCOcc......111cccctttTTTTOcTTCTTOc......................YYYYWWWwcWwwO.',
      '...CTTTTTccTTTTTTTTTTTTTTTTTTTC.......CC.........C.........CCC........cCOcc.......c1cccctttttTTOcTcTTTOc.....................YYYYWWWwcWWWOO.',
      '...CTTTTcTTTTTTTTTTTTTTTTTTTTC.......CC.........CC.........CC.........cOOcc......cCcccc1tttttttOcTTcTTOc....................YYYYWWwccWWWWWCO',
      '....CtttttttttttttttttttttttC.........C..........C.........CC.........CO..c......cCccc111ttttttOcTcccTOc...................YYYYWWwcWWWWWWWwO',
      '.....CtttttttttttttttttttttCC..............................CC.........CO..c......cccc..11ctttttOcTTccTOc...................YYYWWWcWWWWWWWwwC',
      '......CtttctttttttttttttttCCOO..............................C.........CC........cCcc....11cctttOcTTTTcOc...................YYWWWWWWWWWWWwwwc',
      '.......CtccCtttttttttttttCcCOO........................................CC........cOccc.....1ccctOctTTTcOc...................YWWWWWWWWWWWwwwwc',
      '........ccCOOtttttttttttC.ccCOO......................................CC.........CO.cc......11ccccttTTTOc.............YYYYYWWWWWWWWWWWWwwwwwC',
      '.......ccCCOOtttttttttCC..ccCCO......................................CC........cCO.cc......COcccctttTTOc............YYYYYWWWWWWWWwcWWwwwwww.',
      '.......cCCOOttttttCCCC.....ccCOO...............................................COO.cc.....cCccc1tttttTOc..........YYYYYYWWWWWWWwccWWwwwwww..',
      '......ccCOOCttCCCC..........ccCOO..............................................CC.........cccc111tttttOc.........YYYYYYWWWWWWWwcWWWwwwwww.O.',
      '.....ccCOO..CC...............ccOO..............................................CC........cCccc..1cttttOc........YYYYYYWWWWWWWwcWWwwwwwwwcOO.',
      '....OcCOO....................ccCOO.............................................CC........cOcc...11ctttOc...YYYYYWWWYYWWWWWWwccWWwwwwwww.cCCO',
      '....cCOO......................cccO.............................................CC........COcc.....1cttOc..YYYYYWWWWWWWWWWWwcWWWwww.......cCO',
      '....cCO........................cCO.............................................CC.......cOO.cc.....1ccOc.YYYYYWWWWWWWWWWWWcWWWwwww........cC',
      '....cCC........................cCO......................................................CO..cc.OOOOOOOOOYYYYYWWWWWWWWWWwcWWWWwwwww........cc',
      '.....CC........................cCO..........................................C...........CO...OOGGGGGcGOOYYYYWWWWWWWWWwccWWWWwwwwww.........c',
      '.....cC........................cC............................................O....OOOOOOOOOOOGGGGGccGGGGYYYWWWWWWWWWwcwWWWWwwwwwww.........C',
      '.....cCO......................ccO...............................C......OOOOO..O.OOOGGGGGOOOOGGGGGcGGGGGGYYWWWWWWWWWwcwwWWWwwwwwwww..........',
      '.....cCO......................ccO............................O...O...OOOGcGOOOOOOGGGGGGGGGcOGGGGTTcTTGGGYWWWWWWWWwccwwwWWwwwwwwww...........',
      '.....cCcc....................ccCO...................C......OOOOOOOOOOOGGcGGGGGcOGGGGGGGGGGcOGGTTTTTTTTTTWWWWWWWWwcWwwwwWwwwwwwww............',
      '......OOCC..................CCOO.....................O...OOGGGGGGGOOGGGcGGGGGGcOGGGGTTTTGGcOTTTTTTTTTTTTWWWWWWWWcWwwwwwwwwwwww.O............',
      '.......OCCC................CCCO.................OOOOOOOOOGGGGGGGGGcOGGGGcTGGGGcOGTTTTTTTTTcOTTTTTTTTTTTTWWWWWWWWWwwwwwwwwwwwwcOO............',
      '.........CCCC............CCCC............C....OOOGGGOOOOGGGGGGGGGGcOGGTTTTTTTTcOTTCTTTTTTTcOTTTTTTTTTTTTWWWWWWWWwwwwwww......cCCO...........',
      '...........CC............CC...............O..OOGGGGGGGcOGGGGTTTTTCcOTTTTTTTTTTcOTcTTTTTTTTcOTTTTTTTTTTTTWWWWWWWwwwwwww........cCO...........',
      '...........................................OOGGGGGGGGGcOGGTTTTTTcTcOTTTTTTTTTTcOcTTTTTTTTTcOTTTTTTTTTTTT.WWWWWwwwwwwwO.........cCO..........',
      '.....................................OOOOOOcOGGGGTGGGGcOTTTTTTTcTTcOTTTTTTTTTTcOcTTTTTTTTTcOTTTTTTTTTTTT..WWWwwwwwwwO..........ccO..........',
      '..............................C.....OGGCGGGcOGGTTTTTTTcOTTTTTTTcTTcOTTTTTTTTTTcOcTTTTTTTTTcOTTcccTTTTTTT...WwwwwwwwO............cC..........',
      '...............................O..OOGGcGGGGcOGTTTTTTTTcOTTTTTccTTTcOTTTTTTTTTTcOTTcTTTTTTTcOTTTTcTTTTTTT.........cOO............CCC.........',
      '................................OOOGccGGGGGcOTTTTTTTTTcOTTTTTTTTTTcOTTTTTTTTTTcOTTTccTTTTTcOTTTTTcTTTTTT.........CO..............CC.........',
      '................................OOGcGGTTTTCcOTTTTTTTTTcOTTcTTTTTTTcOTTcccTTTCTcOTTTTTcTTTTcOTTTTTcTTTTTt.........CC..............CC.........',
      '.............................OOOcOCcTTTTTcTcOTTTTTTTTTcOTTTcTTTTTTcOTTTTTcTcTTcOTTTCTcTTTTcOTTTTTTTTTttt........CCC..............CC.........',
      '...........................OOOGGcOGTTTTTcTTcOTTTTTTTTTcOTTTTcTTTTTcOTTTTTcTcTTcOTTcTTTcTTTcOTTTTTTtttCtt........CC..........................',
      '..........................OOGGGGcOTTTTTcTTTcOTTTTTTTTTcOTTccTcTTTTcOTTTTTTccTTcOTTTcTTTTTTcOttttttttcttt........CC..........................',
      '.........................OOGGGGGcOTTTTTcTTTcOTcTTTTTTTcOTcTTTcTTTTcOTTTTTTTcTTcOTTTcTTTtttcOtttttttttctt....................................',
      '....................C...OOGGGGGTcOTTTTTTTTTcOTTccTTTTTcOcTTTTTcTTTcOTTTCTTTTttcOttctttttttcOtttttttttct.....................................',
      '.....................O.OOGGGTTTTcOTcTTTTTTTcOTTTTcTTTTcOcTTTTTTTTTcOttctttttttcOttttttttttcOttttttttcc2.....................................',
      '......................OOGGGTTTTTcOTTcTTTTTTcOTTTTcTTTTcOcTTTTTTtttcOtcttttttttcOttttttttttcOttttttcc222.....................................',
      '......................OOGGTTTTTTcOTTTcTTTTTcOTTTTTcTTTcOttttttttttcOtcttttttttcOtttttttttccccccccc21111.....................................',
      '......................cOGTTTTTTTcOTcccTTTTTcOTTTTTTTttcOttttttttttcOttccttttttccccttttccc222222111c1111.....................................',
      '....................OOcOTTTTTTTTcOcTTTcTTTTcOTTTTTttttcOttttttttttcctttttttccc2ccccccc222211111OOccc11......................................',
      '....................OGcOTTTTTTTTcOTTTTcTTTTcOtttttttttcOtttttttttcccccccccc22222221111c1111111cCOccc........................................',
      '...................OGGcOTTTTTTTTcOTTTTTTTttcOtttttttttccctttttcc2222222211111111111OOccc1111..ccO.ccc.......................................',
      '...................GGGcOTcTTTTTTcOTTTTTTtttcOtttttttttcccccccc22111111111ccc111111cCOccc.......cOOccc.......................................',
      '..................OGGTcOTTcTTTTTcOTTTTtttttcOttttttcc222221111c1111111cCOccc1......cOOccc......ccO.cc.......................................',
      '..............C..OGGTTcOCTTcTTTTcOtttttttttcccccccc221111111Occc1111..cCOOccc......cCO.cc.......cOOcc.......................................',
      '...............O.OGTTTcOTcccTTTTcOtttttttttccccccc11111111cCOcccc......cCOccc.......cO.ccc......cCOcc.......................................',
      '................OOGTTTcOcTTTcTTtcOtttttttc2221111ccc1111...cCOccc......cCO.ccc......cCOcc........cOcc.......................................',
      '................cOTTTTcOTcTTcTtCcOCttttcc211111COcccc......ccO.ccc......COOcc.......cCOcc........COc........................................',
      '................cOTTTTcOTcTTTCctcOtcccc21111111cCOccc.......cCO.cc......cCOcc........cOcc........CCc........................................',
      '................cOTTTTcOcTTTccttCccccc111111...cCO.ccc......cCOccc.......COcc........cCcc........CC.........................................',
      '................cOTTTTOOOTtctctOc22111ccc.......cCOccc......cCCcc........cOcc........CCc.........CC.........................................',
      '................cOcOOOOGOOOOtcOOOOOOOOccc...C...cCO.cc.......cOcc........cOcc........CCC..........CC........................................',
      '................OOOOGGGGGccOOOOOGCGGGOOOcc.O..O..cO.cc.......cOcc........CCC..........CC..........CC........................................',
      '................OGGGGGGGGGGGOcGGcGGGGGGOOOOOOOOOOcCOc...C.....Ccc.........CC..........CC....................................................',
      '................GGGGGGGGGGGGOcccGGGGGGGGOOGGGGGcOOOcc..O......CC..........CC..........CC....................................................',
      '................GGGGGTCTTTGGOcGGGTTTGGGGOcGGGGcGGccOOOOOOOOOO.CC....C.....CC................................................................',
      '................GGTTTcTTTTTTOcTTTTTTTTGGOcGGGcGGGGGGOOOGGGccOOOC...O..O...CC...C............................................................',
      '................TTTTTcTTTTTTOcTTTTTTTTTTOcGTcTTTGGGGOcGGGcGGGGOOOOOOOOOOO.....O.............................................................',
      '................TTTTTcTTTTTTOcTTTTTTTTTTOcTTTTTTTTGGOcGGGGcGGcGOOOGGGGGGOOO..O..OOO........C................................................',
      '................TTTTTTcTTTTTOcTTTTTTTTTTOcTTTTTTTTTTOcGGTTTTGcGOccGGGGGGcGGOOOOOOOGOO.....O.................................................',
      '................TTTTTTTTTTTTOcTTTTcTTTTTOcTTTTTTTTTTOcTTTTTTTTGOccGGGGGcGGGOcGGGGGGGGOOO.O..................................................',
      '................TTTTTTcTTTTTOcTTTTCcTTTTOcTTTTTTTTTTOcTTTTTTTTTOccGTTTTcGGGOcGGGGGGGGGGOOOOOOOOO.......C....................................',
      '................TTTTTTTccTTTOcTTTcTTcTTTOcTTTTcTTTTTOcTTTTTTTTTOccTTTTTcTTGOcGGGGGGGGGGOcGGGGGGGOO....O.....................................',
      '................TTTTTTTTTcTTOcTTcTccTcTTOcTTTTTcTTTTOcTTTTTTTTTOccTTTTTTTTTOcGTTTTTTGGGOcGGGGGGGGGOO.O......................................',
      '................TTTTTTTTTcTTOcTTccTTTcTTOcTTTTTTcTTTOcTTTTTTTTTOccTTTTTTTTTOcTTTTTTTTTGOcGGGGGGGGGGOO.......................................',
      '................TTTTTTTTTTcTOcTTTccTTTcTOcTTTCccTcTTOcTTTTcTTTTOccTTTTTTTTTOcTTTTTTTTTTOcGTTTTTGGGCOc.......................................',
      '................ttttttTTtttcOctttTTTTTTTOcTTccTTTcTTOcTTTTTccTTOccTTTTcTTTTOcTTTTTTTTTTOcTTTTTTTTcGOc.......................................',
      '................tttttttttttcOcttttttttttOctTTcTTTTcTOcTTTTTcTcTOccTTTTTcTTTOcTTTTTTTTTTOcTTTTTTTcTTOc.......................................',
      '................ttttttttttttOcttttttttttOctttcTTTTTTOcTTTTcTTcTOccTTTTTTcTTOcTTTTTTTTTTOcTTTTTTTcTTOc.......................................',
      '................ttttttttttttOcttttttttttOctttcttttttOcTTTTcTTTcOccTTTTccTcTOcTTTTTTTTTcOcTTTTTccTTTOc.......................................',
      '................cctttttttttcccctttttttttOcttttttttttOctttTcTTTTOccTTTcTTTcTOcTTTTcccTcTOcTTTTcTCTTTOc.......................................',
      '................1.2ccccccccc222ccctttttcccttttttttttOctttttttttOccTTTTTTTTcOcTTTTcTTccTOcTTTTTcTTTCOc.......................................',
      '..................22cCcc222222222cccccccccctttttttttOctttttttttOcctttTTTTTTOcTTTcTTTccTOcTTTTTccTcTOc.......................................',
      '..................11cOcc1cc1111111111c222222ccttttttOctttttttttOcctttttttttOcttTcTTTTcTOcTTTTccTcTTOc.......................................',
      '..................11cCccccc1111111c1ccc1111112cccccccccttttttttOcctttttttttOctttcTTTTTTOcTTTccTTcTTOcc......................................',
      '..................11.CCOccc.......cOccc1111111111c22222ccttttttOcctttttttttOcttttttttttOctTTTTTTccTOcccc....................................',
      '.....................CCccc........Cccc...11111c1ccc111112ccccccccccttttttttOcttttttttttOcttttTTTTTTOcCCcc...................................',
      '.....................CCcc........cCccc........cOccc1111111111c22222ccctttccccttttttttttOcttttttttttOcOOCcc..................................',
      '.....................CCcc........cOcc........cCccc...11111c1ccc111112ccccccc22cttttttttOcttttttttttOc.OOOCcc................................',
      '....................cCCcc.......cCOcc........cOcc.........COccc111111111cc122222cctccccccttttttttttOcO..OOOcc...............................',
      '....................cOOcc.......cOOcc........cccc........cCccc...11111C1ccc1111111ccccc22ccttttttttOcOO...OOCO..............................',
      '....................cO.cc.......cO.cc.......cCOcc........cOcc........cCccc1111111111cc11222ccttttttOccOO...OcCO.............................',
      '....................CO..c.......CO.cc.......cOOcc.......cCccc........cCccc.....11cCCccc111111ccccccccccOO....cCC............................',
      '....................CO..c.......CO.cc.......CO.cc.......cOcc.........cccc........cCccc1111111111c22222ccO.....CCC...........................',
      '....................CC..........CC..........CO.cc.......COccc.......cCcc.........cOcc......11ccccc1112.cCO....CCC...........................',
      '....................CC.........CCC..........OO.cc.......CO.cc.......cOcc........cCccc........cCccc1111..CC.....CCC..........................',
      '....................C...........C..........CCC.........cCO.cc.......COcc........cOcc.........Cccc..111..CCC.....CCC.........................',
      '...................CC..........CC..........CC..........COO.cc......cCO.cc.......COcc........cCccc........CC......CC.........................',
      '...................CC..........CC..........CC..........CC..........cOO.cc......cCOcc........cOcc.........CC.................................',
      '...............................CC..........CC..........CC..........cO..cc......cOO.c.......cCOcc..........CC................................',
      '...........................................CC..........CC..........CC..........cO..cc......cOOcc..........CC................................',
      '...........................................CC..........CC..........CC..........CO..cc......cOOcc..........CC................................',
      '.......................................................CC..........CC..........CC..........CO.cc............................................'],
    ol: { '*': ['#1A120C', '#060403'] },
    face: {}, fx: [], fx2: [] });
  // ==== 千節蟲・手點 完 ====
  // ==== 地出巨骸・手點 ====
  // ---------- 領主體・地出巨骸 v2（2026-10-11 作者給的參考圖：從土裡爬出來、駝背的巨大骷髏，一隻粗手臂撐在前面、巨大的骨手五指張開按著地；頭骨低低往前看；右邊一副肋骨、後面一隻骨腳；骨頭上掛著泥土，腳邊碎石）----------
  // 泥土和碎石照參考圖縮小當底稿；骨頭一根一根點、頭骨一格一格點。光從左上來。
  // 字：1～3 縫隙和陰影（暗→亮）、5～8 骨頭（暗→亮）、s S 泥土、E e 眼窩裡暗紅的光。
  HD.gashadokuro = hand({ w: 141, h: 131, pad: 4, breath: 50, eyes: 'Ee', spikeOn: '78',
    pal: () => ({"1":"#120D0A","2":"#1E1712","3":"#2E241C","5":"#7A664C","6":"#A08A68","7":"#C8B48E","8":"#E8D8B4","s":"#4A3422","S":"#6E4E30","E":"#FF4A2A","e":"#9A1E14"}),
    rows: [
      '....................................................SSSSSsSs.........................................................................',
      '.................................................8.ssSSSSsss33.......................................................................',
      '................................................888333sSSsssss.......................................................................',
      '............................................5..8887733sSSSsssss.SSS..................................................................',
      '............................................558887777sssSSSSssssSS33.................................................................',
      '...........................................55888777777ssSSSSSssss22..........7.......................................................',
      '...........................................588877777775ssssSSssss22.........87.......7...............................................',
      '..........................................28887777777555ssssSSssss...7......877.....87...............................................',
      '..........................................2587777777555sssSSSSSsss.S87...55877755...877..............................................',
      '..........................................5557777775558sssSSSSS1ss1S87755556775765587775.....7.......................................',
      '..........................................555677775558sssssSSS1111587775667775877666775555..87.......................................',
      '.........................................s555667755588sssssssS155555775777888888777775775555877......................................',
      '....................................S....5555667555s88Ssssssss1556677578888.sSS.8888888876687775.....................................',
      '....................................SSSSS5556667758sSSSSsssss11677788888....sSs......888877777555....................................',
      '...................................ssSSSS5556677788Ssssssss111188888sSSS....SSs..........888857655...................................',
      '...................................sssSSS5556677788ssSssss11..188..ssSSSSSsSSSS.............8887755..................................',
      '..................................221SSS55566677788sSsssss11..11...ssSSSSSSSSSS....SS.........8877885................................',
      '..................................2111ss55566677888SssSssss111111SssssSSS556777653sS...33......8677885...............................',
      '...................................22sss55566777888ssSssSss1111111ssssS567888887765S...SS......556778858.............................',
      '...................................2222255566777888sSssSssssssss1111ss5788888888776S...S11..SSSS556788887............................',
      '....................................222255566777888SssSsssssssss1111s578888888887765SSSSSSSSSSSss566788777...........................',
      '....................................222255566777888ssSssSssssssS11sss78888888887776651SSS8SSSsss..566788755..........................',
      '....................................2..S55566777888sSssSssssssssssss57888888887777665122877SSss...55677885...........................',
      '....................................2..S55566777888SssSsssss1sssssss578888887777776651387775SS.....5567888...........................',
      '......................................ss55566777888ssSss2s111sssssss57888877777666551223775SSSSss..55567888..........................',
      '......................................sss5566777888sSssS111112sssSSs578887776666555S5223s311555555555556788..........................',
      '......................................SSs5566787888SssSs1111122sssSS57877666655555555sssSS855555777888556788.........................',
      '....................................sss..5566887888SSSss1111122ssssS5776111166511115Sssss87777788888S88566788........................',
      '....................................2s...5568877788SSss111111sssssss576111111611111165ss877888811SSSSSS8567888.......................',
      '....................................22...5588777558SSsS11111ssss11ss56111e111611e1116S1ss77511111SSSSS11855788.......................',
      '....................................22s..55577755888Sss11111sss111ss5611111116111116SS11ss3s11111SSs5555.55778.......................',
      '....................................22s.Ss5567557888Ssss11111sss11Ss5661111166611116SS1122ss1555555555775555788......................',
      '...................................221ssss5566577888Sssss11111ssSSSSs5661166676611665S1122185555577788887555678......................',
      '...................................211sssS5566777888sssss1111111Sssss5776667117677665S1111877777888882S88875678......................',
      '...................................111ssSss566777888ss111sss11111ssss576677111177665..21187788888SS1222SS8856688.....................',
      '...................................s11sSssS566777888ss111ssss1111sssss5676671176665s..331S7751sss111222SSS885688.....................',
      '...................................s21sssSs566778888ss11111111111sssss55667777766655s111...3111ss1115555SSSS56788....................',
      '...................................2221sSssS6677888sssss1111111111sssss5181818181855s222....8555555555755SSS.5788....................',
      '...................................2222SssSs6677888Ssssss....s2111sssss5717171717155s221112855555777888855...5678....................',
      '....................................2221sSss6677888Sss11sss..sssssSSsss5818181818155112111877777888881888755.5568....................',
      '....................................2221Sss56677888Sss11ssssssssssSSssss566666666655111111178888sss..11S8875555......................',
      '....................................ssssssS66777888Sss11sssssssss22Sssss155555555Sss1111111s3sSssss..SSSs888758S.....................',
      '....................................sssssS566777888Sss111sssssss11..s1ss111ssss111ss1111211ss8ssssss5555ssS8558s.....................',
      '....................................ssssss566777888Ssssss2ssss1111..s11111ssss111111111111118755555555855sSs578s.....................',
      '......................................ss5556677788SSsssssss11113331sss111sssSS11111111111118755557777888755s57S......................',
      '......................................s25556677888SSSssssss11133331sss111ssSS112111111111111777778888ss8875558S......................',
      '.....................................ss25556677888SSSs1sssss1333311..1111sssS11121111111...118888ssSSsss888558S......................',
      '.......................................25556677888SSS1112ssss333311..11111sSsssS12211122....111ssssSS11SSS88751......................',
      '..................................sss..15556687888Sss11122sss333321ss1ss111SS...1s11111211..1811SSSS555SSSS8558SSS...................',
      '..................................sssss15566888888ssss1122sss33333...1ss11211...ss11111111..875555555755SSSS578SSS...................',
      '..............................ss1..ssss1556888778Sssss11..sss........11s..11111sss11111111187555577788875sSS58SSSS...................',
      '...........................SSSss1..Sssss158887777SSssss1..1..........111..11111ssss11111ssss77778888818875ss58ss11...................',
      '...........................SSSSS11ssssSSS888777775Sssss...1..........11132211111sss1111ssssss8888111SSS8875sssss11...................',
      '...........................SSSSSSsssssSS88877777555sssS...1...........3332211111sss111111ssss821121SSS1188755ssss1...................',
      '...........................SSSSSsssssSSSS877777555ssssss..1...........3333ss1111sss1111111ss8771225588111S558ssss....................',
      '..........................sSSSSsssssSS5567788755566788ss..............3333ss11111ss1SS111118775555558811SS578sssS....................',
      '.........................ssSSs.ssssssS5567788555567788sss.............32sss111111s...111111s75557785588SSS578ssSS....................',
      '.........................sssSs.sssssss5567788555567788sss3............22sss111112s..111111sss77788815788SSS8ssss.....................',
      '........................11sssS222222ss55677885S5567788ss33............223331113322ss1111111ss888811125588SSSsss......................',
      '........................221ssss2s..11s5567788SS5567788ss33............3333333333122s1111111s877111122S5588Sssss......................',
      '.........................21ssssss..11s55677s8sS5567788ss33............3333..33..111..11111187775111SSSS558S1sss......................',
      '..........................11111ss..1s556678S8sS556778Sss33.............333..22..333..ssss111775111SSS22578S1sss......................',
      '..........................21111ss..1S556678ssSS556778ss133.............3383332..33331ssss11113111SS332255822sss.....8................',
      '..........................2111sssss1S556678sSSS556778ss113.............3887332..33311sss11111S111ss...SSSS2.....555887...............',
      '..........................2111Sssssss556678SssS556778s111..............88777ss..11111sss11118ss1122...SS333..5555588777S.............',
      '..........................21..SSsssss556678ssSS5567881112.............8877755s..11..33ss1118771111222SSS5555555668877755S............',
      '..........................2s..11sss1S556778sSSS5567881112..............77755556783...1111187775111SSS5555555666667567788S............',
      '..........................2s..1ss111S556778SSSS5567881111..............3755855788....211111775s5555555566666777777557788S............',
      '..........................33SS1ss111S5567788SSS5567881221.............33557855788....22111553555555566666777778888557788S............',
      '..........................33SS...11ss5567788SSS556788222..............35567855788...115555555555666667777778888888557788ss...........',
      '..........................11ss....ss15567788SSS556788211..............3556785678855555555555556667777778888888.sss557788sss..........',
      '..........................11ss1....s1556778ssSS556788111..............3556785678355555566666667777788888888.....ss556788SSS..........',
      '........................2221ss1....ss556778ssSS5567881122.............3556785678.6666667777777788888888.........sss557788SS..........',
      '........................22ss111..sss5566788ssSS5667881222.............2556785678.777777777888888888.............SSs556788SS..........',
      '........................2sss112ssssss566788ssSS5667881122.............2556785678.77788888888888.................SSs556788SS..........',
      '.........................222122sssss5567788ssSS5667881122............22567785678.888888888ss.....................Ss5567783...........',
      '.........................222112sssss5567788SssS56678811222...........21567785678....883222ss.....................Sss56778............',
      '..........................11111sssss5566788sss556778811122...........s1567885678......322222......................ss56678............',
      '..........................11111sssss5567788ssS556778s11122...........22567885678......112222.......................s566788...........',
      '..........................11ssssssss5567788ssS556778s1112s...........15567885678......111222.......................s566788...........',
      '..........................s2ss2ssss15567788ssS55677811112s...........155678.5678......11112.......................ss566788...........',
      '.........................sss222ssss15567788ssS55677811122s..........2155678.5678...11111111.......................ss566788...........',
      '.........................ssss221sss15567788sss556788111222..........125567855678...11112211......................22..56788...........',
      '.........................Sssss21sss155677811sS55678811122s..........115577855678...11112221.......................2..56778...........',
      '........................sSsss211sss155677811SS5567881...2s..........115577855788...11112222.......................1..557783..........',
      '........................sssss111sssS55677811SS556788s...2s..........11567885578....111112221......................1..557788..........',
      '........................sssss111sssS5567881SSS5677881...2s..........11567885678....111111211.........................5577881.........',
      '........................1ssss2211ssS5567881SSS5677811...2s..........115678.5678....111ssssss..........................57788s.........',
      '........................2ssss22211ss556788SSS55677811....1.........1155678.5678....122sssssss.........................55688..........',
      '..............sss.......2ssss2221..S556788SSS5567781.....1s........1155678.5678....122s112sss.........................55688..........',
      '..............ssssSS11222sssss221..S566788SSS556788...33311........1155678.5678....112211111s.........................55688..s.......',
      '..............s..s2111ssssssss211SSS556788SSS556788...33311.......11155678.5678....111111111ss...............3........5568883s.......',
      '.................ss11ssssssss1111SSS556788SSS55678833333311.....311115678855788...22111111111s........................55678833.......',
      '..............ssssssssssssss21111SSS556888SSS55688833s33311...3331111557885578...222221111111s.........................5678833.......',
      '...........22sssssss22sssss221111SS5568878SSS55887811ss3311.111331111567885578...222221111111Ss.............1..........56678s3.......',
      '..............sssss22211sss111111SSS588777ssS588777112ss11111111111115678s5678...22211122211Sssss..1111111..11....SSs..56678s........',
      '......ss......ssSss221111ss11111SSSS8877755ss8877755112211122111111115678s5678.122221112222SSssssssss11111..111...sSs..56678s........',
      '.....ssssSSSS...11s111111ss1111SSSS58888588885888858811111122112211155678.5678112222211sssssS11sssssss11....ssssSSss11.566788........',
      '.....sssSSSSSSS.12s11111111111SSSS858888588885888858881111111112111155678.56781111222ssssssss11sssssss......ssssssss11..56888s.......',
      '.....3333SS33...22ssssSS1111111Ss88588885888858888588881s1111111115555678.55581111..2ssssssss11sssssss......ssssssss11ss58878s..s....',
      '.....3333s333...11sssSSSSsss111177757777577775777757777sss1111113556sss22216551111........ssss11sssss1111sssssssss......88777s..sss..',
      '.....3...s3.....11ssSSSSSSsss111777577775777757777577775s111111155677s5672776551111.......sssss11ss22211ssssssssss.....8877755ssss2..',
      '....33..........11sssSSSSssssss5777577775777757777577775s22111155777.s567.177755111....1sssssss111s2221ssssssssSSs....5555555sssss2..',
      '......SSSSS.....11ssssSSsssss555677577775777757777577775722211157733..567.11177511111221ssssss1111SSSSSSssssssSSS....S66665555sss33..',
      '...1.Ssssss2111111ssssssssss5566766566665666656666566665882211173..335571....11732111111ssssSS111Sssssss2ssssSSs...11S767665555553311',
      '...11Ssssss2111111ssssssss556677786556665666656666566667888SS1333..11257....ss2222211111ssssSS111Sssssss2ssssSSS..sss.777777777655512',
      '...11Ssssss2111sssssssss555667788855676655666566665865567888S222222112.....sss2222211....ss...111Sssssss2sssssSs....s...2ss7777766652',
      '...ssS222222sssssssssss58567788885567786555778656788ss5567888s22222211....Ssss11111.............sSssssss2sssSSSS........222sssSS77662',
      '...ssssSsssssssssssSSS587777888s55677888556788S557888s5566788s222ss2.....2S1ss1111s.....sss..s..sS2222222ssSssss2.....22s11111SSS1712',
      '.SSS.sSS1sssssssssssS587775888s556778811556788S556788ss556778822.......ss222ssss11ss.222ssSSSsss1ss..sssss.Sssss2s....2ss1111sSSS11ss',
      'Ssss2sSS1..sssssssSS55677588ss586778811155678ss156688sss5568778s..s..s.ss222sSS22sss.222sSsss2221ss..sssss.S22222...s.2ss111ss.....ss',
      'Ssss2s222..ssssssSS5567758S..5877788s11155778S1155678ssss5877758..sssssss.....222sss.....S222222ssss111sss......s..ss.sss111ss.......',
      'S2222......sssssS55667888Ss.5877758s111158788S115568881sss577588Sssssssss.....s22ssss.....ssssssssss111sss11...ssssss.sssssSSs.......',
      '.....s....sssssSS8677888Sss1557758s111158778SS1115877811sss556788Sssssss.....ssssssSS..s.ssssssssssssssSss11111ssssss.sssssSSSss.....',
      '.....sSssssssss5877788SSs11556758ss111187775SS11187775111sss557788ssssss...SsssssssSS..s..ssssssss..sss...ssssssssss..sssssssSSsss...',
      '...ssSssssssss5877758SSss1556788Ss1111157758SS11157758111111s558778sssss...SSssssssss..s...sss...s....s......sssssss.11..sssss...sss.',
      '...ss22ssssSs5567758SSSs1586788SSs111255658SSSS11555781111111587775ssss1.SSSSssSSS.....ss....................ss......................',
      '.ssss2222sss5667858SSSS15877888SSS111155778SsSS11157781111111SS775882s11sssssssS..............ss....................22...............',
      '.ssss22221s5577888SSSSs5877758SSSS111158788SSss11157888ss1111ss556788111sssssssS.....................................................',
      '.ss.....ss56778811SSSss567758SSSSs11118778sSSss11258778ssss11sss55678111ssss11ss...ss................22..............................',
      '........sss6788111sSss567758SSSSs111187775ssSss12287775sssss11sss5668S...sss...s.....................22..............................',
      '........sss588111Ssss5677881ssSss111157758sssssss227758s11ss11ssSS55.................................................................',
      '......22sss11...1Sss56788811sSsss11155658sSsSssss..5578111..sss11.....Sss............................................................',
      '.................S...6888...SS......55788.SSS......5678...............SS.............................................................',
      '.....................58.....SS......5678....S......5578..............................................................................',
      '............................S.......5678....S......5568..............................................................................',
      '............................S........5...............5...............................................................................'],
    ol: { '*': ['#1A140F', '#050403'] },
    face: {}, fx: [], fx2: [] });
  // ==== 地出巨骸・手點 完 ====
  // ==== 深淵王蛸・手點 ====
  // ---------- 領主體・深淵王蛸 v3（2026-10-11 作者給的參考圖：深紫黑色的巨蛸，高高尖尖的頭罩、兩邊一對鰭，一對發紅光的眼睛；八條粗觸手往兩邊攤開、尖端捲起來，內側一排白色的吸盤）----------
  // 照參考圖縮小當底稿（輪廓、亮暗）。光從左上來。
  // 字：1～5 紫黑的身體（暗→亮）、p P 觸手內側的紫、v w W 吸盤（暗→亮）、E e 眼睛。
  HD.kraken = hand({ w: 110, h: 101, pad: 4, breath: 44, eyes: 'Ee', spikeOn: '45',
    pal: () => ({"1":"#0C0A16","2":"#16122A","3":"#221C3C","4":"#32294F","5":"#463A66","p":"#4A2A7A","P":"#7A4AB0","v":"#8A8496","w":"#BEB8C8","W":"#E8E4EE","E":"#FF5A2A","e":"#B82A14"}),
    rows: [
      '......................................................4545.44.........................................',
      '.......................................................5544333........................................',
      '...................................................111..554222........................................',
      '...............................................1..111...454422211111..................................',
      '...............................................111111..4433441211311..................................',
      '.................................................12122333524411123....................................',
      '..................................................211233352222112.....................................',
      '..................................................112222552222111.....................................',
      '..................................................111122544331111.....................................',
      '..................................................122121113331111.....................................',
      '..................................................122441113333211.....................................',
      '.................................................11224334433332111....................................',
      '.................................................12222333433332111....................................',
      '.................................................12222335533322111....................................',
      '................................................1111133355333311111...................................',
      '...............................................111111334554433214411..................................',
      '...............................................133111344433433211411..................................',
      '.............................................11111111333352232321144..................................',
      '.............................................112111111335522323211243.................................',
      '..........................................333122113221455522333311243322..............................',
      '..........................................33311212333444452333331111134411............................',
      '..................................552333331122221233444445333333311122225523222pp.....................',
      '..................................55232311133321223333444534333331112223112332211.....................',
      '...................................522222333331122233344444433332211222333221111......................',
      '.....................................2233122332122333344454433332211122322211.........................',
      '.......................................331222221222333445543333222111222222...........................',
      '........................................22222212222333444444343222111222222...........................',
      '.........................................223221222223444554434422211112222............................',
      '........................3WW3.............22322123223344455444332222112222.............................',
      '.....................w3555443355..........1132123223334554444333222112211.............................',
      '.....................w34544555544.........113221122334455544442231211121..............................',
      '..................3W44444433335435.........11222223333455554322131113131..............................',
      '..................W344444411133335.........41232233334455554332111113331..............................',
      '..................224422211..3333..........4523122443444554443211111333...............................',
      '................552342222.......4...........533114443345554443341111333...............................',
      '................5223122.........441.........333114443345554443441113333...............................',
      '................1233112.........221...........111344433555444345441111..........44441.................',
      '................1223211.........221...........1113553334554543354422..........544444133315............',
      '...............w1232211...55....21.............111113344554541111111.........55554444333155...........',
      '..............5w333221....55.52211.............1eEE14155555441EEe111.........55544422233332...........',
      '..............55322321.......5111.............1111114155554444111111........45551112222233211.........',
      '..............55333322.......1111..........23311422111555544441114111111...34551111.111122211.........',
      '..............552234322...................223112444415555453522214111111...344551...44112123235.......',
      '..............552234322...................211122114415555453524411111111....4........5511133235.......',
      '...............5333443111.................113322113444555443334221111112...............11132322.......',
      '...............53333333111..........411222113324333444444453333221311112...............551223225......',
      '...............555551131113........3444441111444114554444453533221333122411......55.....51223235......',
      '.............4444455443343322......32224111145511145444444435353311333214322...2255.....52223231......',
      '...........3345555555543443422....222221111145511155444441435354431355311333...22555.....1133241......',
      '.........2234455555555444454333..12211111111555145554245414444554311353211333..1144.....55133341......',
      '........224444433344444432553332212211133145552245v54245514413555411334211133111111.....55133331......',
      '.......2234332211144434432333332211111331145332345353345414413555411134221113322221.....552333315.....',
      '.......23333322221144334333333333344533111443213555443554144144554411333321112222221....552344315.....',
      '.......4442222211111113333333333444453111444321455543355524p2345544113333211111222211...55244431......',
      '......24333551111..1111133332233344331111442221445443155524p2335544111133331111122221..555244331......',
      '......242335555.......11333322333323111153322115554431p5514p43455444111333311..112221155552333355.....',
      '.....224233152.......553321123322221113553212155543351pp112p44445543112233311...121111555v5111445.....',
      '.....234455152.......552221223322222133532212145543351pp112pp44445534112333111..11155555w3553v33......',
      '....223335515........45222222333333115333221244554333ppp113pp154455541112233111551553ww3w53wv555......',
      '....124435111....5..545111.21311311335323121245534333pPpv13pp1544553551111132215553vv35555v3v555......',
      '....134431155....5..555111221111112233322121555433344PP5322pp334445v55511112211555555v3555553555533...',
      '...5133431155....554441111211115555511121111554443514PP5522ppp15445v555511155555555555v55555w3555344..',
      '...51234vv355....551111111113vw3ww3vv111155554444451ppP55224pp1555554555511555555555555535555w555544..',
      '...112343w313.........111111v3w55555vv55555553441511ppP55114pp3355554553vv3vv5555553w555355555555544..',
      '...1223214413........22215555w3vv5553555555553441511ppp5511ppP331pp445553555vv5555554111122ww55555433.',
      '...2222215555......33321155555v3v53v5555545444444522ppp5511ppPp41154444545455555555541122211153555533.',
      '....222255555.....233322555w55vv3522555444443345111pppW5511ppPp4215545444545335555511122221155w555533.',
      '....111w55555.....22315555w35v3vv522445444445555111ppp355144ppp321155544454333554551122222115555555333',
      '....122355551....122215553ww5vv3444244555354555111pppp441144ppp321111555544555554111222222222255W33333',
      '....112355511....1222155ww555544511145555352251111ppw35511433p533211115554555155111112222222..555W3443',
      '....112355vv11..112225555v555w35511115444pp221111pppww3w11121p5532111113315551111311122211....553W1243',
      '.....123355511..11222555v3vv5ww311114411ppp211111ppp3ww111121p55p2211111111122333311222111....55w31221',
      '......133555111111222555553vv3ww15444411ppp21113pppp551111111555p5331111111333333312222......W53w33321',
      '......11w35w1122122155455553vv5515453311ppp11233ppp555111111155545543111111333342211122......3ww33333.',
      '......11ww5w122211215545555v35551145311433412234pp553441112215554554311111133344221111.......W35w3113.',
      '.......11w551334411144455554v5wW1145111443414434pp55v411111214554455351111133442211111.......5555W113.',
      '.......1111v3534443154115554vv3W11155111552144333w331411121334555334555355322442214411..333155ww3W33..',
      '.......1153vv5344432511155553vw1111555555522444w55ww1111121443555334555355322442221222..3321WW55W33...',
      '.......115v3553333322114455555w11115533551114443553w..211211431vv535555555222222211111..22253w5522....',
      '......4442ww5vv3323222155555w55ww11555111111w3w55555..21222144115555pp4551211222211111..222553w544....',
      '......44422223v33232233355553w53W13335522111w555v11...21122144133155w44541111332321115422135555544..11',
      '....pp4444111v3332442222555543WW3....22221113ww3v11...111111443331153W444112234432115541113555W344..1.',
      '.11ppp4422111vv33w342222355541355....555555555vv1111111115554322441ww3555122224331114422213W53WW......',
      '.15pp332221113v555533232333541555w55555555v5551111111155444453333313wW5533222233344444422WW3553w......',
      '555533311111111553v552333335555W3w53555555vv51111111155555535533331w3W553223333333335544p3W55555.222..',
      '555533.......111553542232444455WW3wW5555555511111111555.555v5545555ww335521533333333333pp555555..112..',
      '555433..........5555411324544443WW44v3vv5551111111553v..155555455wW3W55552153333pp33333w55W311...112..',
      '554422...........5ww111324533...3W444W3WW5W115511155w3.11155555553wW35533115553pppppp33w53ww3....111..',
      '55544..............1111222222....44W5553wW3115w51154ww1111155555WW55443331155511w3111ww3455ww......1..',
      '55522...............121122211233355W535w3555553513v444v11111155w3w33343331111554wv1555554555111....1..',
      '.5552..............21211121552333553WW5wW5WW3Ww3ww3w.1v11111113ww3334433111115544v111w3w44.1111.......',
      '..55w5555555.......22222221113333...1155WW3WW3Ww3ww3w1111..v3ww3553331111...155143551ww551.1221.......',
      '....355555511..............113......115..55...11111w3w.....vw3ww223331111...11111555111511....1.......',
      '........11...........44.....11..............22111111v3.....3ww12233441111.....44451111111.............',
      '..................555.......111222.........122111111vv.....w3512111..1111..55.45555555555.............',
      '.............................1111.....1111111...2211555....ww511111........55445555555555.............',
      '......................44...........................155555..3ww31..55555.....54........................'],
    ol: { '*': ['#14102A', '#04030A'] },
    face: {}, fx: [], fx2: [] });
  // ==== 深淵王蛸・手點 完 ====
  // ==== 萬面樹・手點 ====
  // ---------- 領主體・萬面樹 v3（2026-10-11 作者給的參考圖：扭曲的灰褐色老樹，樹幹裡長出好幾張人臉、中間一張張嘴在叫、眼睛發橘光；樹皮上一塊塊青苔，光禿禿的枝幹往兩邊伸、末端幾片小葉；樹根像爪子一樣抓著地）----------
  // 樹幹的明暗拿參考圖縮小的亮暗；枝幹、樹根一根一根點，五張臉一格一格點。光從左上來。
  // 字：1～6 樹皮（暗→亮）、7 爪尖、m M l 青苔和葉子、z 眼窩、o 叫的嘴裡、E e 發光的眼睛。
  HD.faceforest = hand({ w: 118, h: 106, pad: 4, breath: 51, eyes: 'Ee', spikeOn: '56',
    pal: () => ({"1":"#16120E","2":"#2A231C","3":"#4A4136","4":"#665C4E","5":"#887E6C","6":"#A89E8A","7":"#D0C4A8","z":"#0A0806","o":"#3A1A10","m":"#4A5222","M":"#6E7A30","l":"#A4A044","E":"#FFA03A","e":"#C85A1A"}),
    rows: [
      '.........................................M................25.......543........................................',
      '........................................Ml...............3325.....55542233..........................Ml........',
      '........................................44..............233222...35555223322.......................4M.........',
      '....................lM4.................445............23332222.355555522222...............l4.....444.........',
      '..............M......444.................45............233332245555454442222...............44.....44......M...',
      '.............lM4......444................345..........23333334566665444442222.............444....444..334lM...',
      '...Ml.........44.......443................345.........33332345666666542443322.............44.....4453334444...',
      '..lM4443..M....44.......5433..............3355........33322532225522235344323............344...334454455......',
      '...444433M333..445.......545...............345.......333223531zz353zz13442222...........335.333335345.........',
      '......55l433433335.......5355..............3345......332233433115451135442222...........3453334545.345........',
      '........33455433345.......345...............3455.....3322345444556544444422245.........345534555....345.......',
      '.......345555554335533....3345..............3345....54222455444556544444422355.....33333454555.......344......',
      '.....44455.....553453333...345...............3345...55424555344566544224522254.333333344555...........444.....',
      '....4444.........55544433333345..............33455.55554444223211112322422222333333444555..............444....',
      '...444..............55554333345...............3345.5544433422445555445552222333344455mM.................444...',
      '.4M44..................5554333453.............33355444453334444433445555322244445555.....................444..',
      '.Ml......................5554345333............3343263455344422333355555322445555.........................444M',
      'lM.........................5554443333...........3332663424444224334555522245555............................4Ml',
      '.............................555434533..........34424644334422244356663222.5................................M.',
      '...............................533454333.........44244443344322444566222222...................................',
      '................................3455443333.......442544433343224455222222233..................................',
      '...............................345.55544333.....53442545544342225534443223345.................................',
      '...............................35...555443333455554325555444322555334332233355................................',
      '..............................445.....55444345666654235566433322533555322233453.........................M.....',
      '............................4444.......55544566666654335666433552235542222355422.......................lM.....',
      '.........................444444.........5553222552223322366433332222222222555322....................44444.....',
      '........................M444..............531zz353zz13424344333332222222225533322.................33444.......',
      '...........M...........lM..................33115451133442444333332222222324523322..............333444.........',
      '..........M................................44455654443344245554432222233323425222........3333333345...........',
      '.........l444.............................2444556544422222255444335534433222242223....333334445555............',
      '..........44444...........................2244566544222222255444533544444222222233....44445555................',
      '............44443.........................2232111123223223355533553344444222222233....5555....................',
      '..............4443........................22445555442222323255535553444442222222233...........................',
      '................543........................2244334435532223265555555555552223322233...........................',
      '.................543.......................2233333335522222425565555555552222322233...........................',
      '..................5433.....................22344554452232224356665445mM5555333222233..........................',
      '..................55433....................32325555553332223556665553525555532222233..........................',
      '...................55433.33333333333.......22222235553332334455555535665555222223344..........................',
      '...................355434443453333333333332.222233354332224445555544555545552222334..........................M',
      '...............3333335344443454444444333332.2222334444322444555455456666545442222343........................Ml',
      '.............334445555555533555555555444442.3323344444422433544444566666654442222333333...................4lM.',
      '..........3333455555......345......555555542222235544442443555454322255222345222232433333.............4444444.',
      '........33333355.........345............555222222555433344555555231EE353EE135222222554443333........334444....',
      '.....44l4455345..........34................3222222222233345555522331e545e113222222555554444335...333445.......',
      '....44M55..335..........444...............3332222222223344444455244455654446222222....555555455333445.........',
      '...444.....345..........44................3332222222224464444355354431134466222222.......55334334455..........',
      '.Ml44.....335..........444...............3343322222224455544435535431oo13466622222..........334455............',
      '.44.......345.........444................332433222244445554443322341oooo14666232222..........35555............',
      '.........444.........444.................242443325444255542233322241o11o14233333222...........33455...........',
      '.........44.........444.................22423334553342444332332222431oo1344232233233...........33455.........M',
      '........444.........M4..................222333345555524443335522244444444664422333332...........33455....4444l',
      '........44..............................222333355555424442335522245533336655422332332............3343344444l..',
      '.......4M..............................44223455554444233222223322555544662222233223332............3l34444.....',
      '.......Ml..............................55444455544444233222223422555544622223222223332..............555.......',
      '......lM...............................555445344444443334444444443245545222222223333322.............3345......',
      '......................................55555543424344443444444444222445322222222233333222.............345......',
      '......................................55555543223344425555544433222245332332222333333322..............345.....',
      '......................................555544455333222455554444332222444355522223333333222..............444....',
      '......................................554444453333234566665454333224444455565223333333333...............444...',
      '.....................................6544444443332245666666545442224444455332223333333333...............444...',
      '.....................................55544453343332322255222344422224442443332233455554332...............4Ml..',
      '.....................................5554443244444231zz353zz134322222222445663234566665432................M...',
      '....................................5555444424444333311545113444322222224556643456666665422...................',
      '....................................3555444422443334445565444342222222223553432322255222323...................',
      '....................................355554442233333444556544432222222222222333231zz353zz1333..................',
      '...................................224455554222343334456654444322332222222223333311545113332..................',
      '...................................224455554222442333211112355322332222222222334445565444332..................',
      '..................................22444555444222222344555544552222222222222223344455654443333.................',
      '..................................23355555544322222334433445322222222222222222334456654423333.................',
      '.................................4233345555442222232433333523222222322222222233332111123233333................',
      '.................................4223344455552222333332444332222223222222222223344555544333333................',
      '................................442223444555322223333223333332222332222222222333244334433333333...............',
      '................................432224425655323223332222334332223322222222222333333333333333333...............',
      '...............................4522224456544323222222222222322222222222233333334333333333333333...............',
      '...............................45222255555245252222222222222222222222222233333344333353333333333..............',
      '..............................344222255555544245322222222222222222322222222333344454553333333333..............',
      '.............................44432222444455442444222222222222222223322222222333344445333333333333.............',
      '............................544332222444455642444422222222222222223322222222233344444333222222333.............',
      '...........................33332332564455555644444222222222222222233222222222333334444442222222333............',
      '........................33333332225556655555544455222222222222222223222222223322234355442222223333............',
      '.....................33333333442555555645555544445522222222222222223332222222222234435444222233323............',
      '...................33333344445555534455444455444445522222222222222223322222222222244434442223333223...........',
      '...............333333444444555555333335443355544445552222222222222223332222222222244355555224433322...........',
      '............3333333344555555555552333334433356644455533522222222222233322222222222355555552544433322..........',
      '........3333344444455555555432563333344222335664433533345444422222222333322222222335545545555544433...........',
      '.....33333334444555555444444233333344455233336442233333452444222222222233322222222455544445355554433..........',
      '...334445555555555......366333334444455333344544332222333445522222222223332222222244554444553.5554433.........',
      '..334455555..............333344455555533334445433332222233555mM222222233322222222334455444......555433........',
      '.56755..................3334445555554333444555333442222333446622334455232222222233334455..........55443.......',
      '.577..................33344455555..33mM44555533344552233344556443344533222222222433334555...........5567......',
      '667..................333445555....33344455553334445552334455566333445333333222.....333455............566......',
      '666................33344555......333445555.333445555233345554433334553333...........33345.............566.....',
      '.66...............3345555......333445555..33344555...334555.....33455.................3445.............66.....',
      '..................34555.......33444555....3344555...334555......33455..................3455...........66......',
      '................33455........3334555.....334555....334455.......33455..................3567...................',
      '................3455.........34555......334555.....33455........3355....................567...................',
      '...............5675.........34455......334555.....33455.........345......................66...................',
      '...............577.........3345.......33455.......3455.........557.......................66...................',
      '..............667..........345.......33455.......5675..........567.......................66...................',
      '..............666.........557........3455........577...........66.............................................',
      '...............66.........567.......5575........667............66.............................................',
      '..........................66........567.........666............66.............................................'],
    ol: { '*': ['#1E1812', '#060504'] },
    face: {}, fx: [], fx2: [] });
  // ==== 萬面樹・手點 完 ====
  // ==== 朽翼龍・手點 ====
  // ---------- 領主體・朽翼龍 v3（2026-10-11 作者給的參考圖：只剩骨頭的龍，長頸彎下來、細長的頭骨、往後的角；一副肋骨；兩片骨翼撐著破破爛爛的暗橄欖綠翼膜；四條細長的骨腳；長骨尾往右捲、末端一片破爛的骨扇）----------
  // 一根一根點：骨頭兩端粗、關節凸（左上亮右下暗）；翼膜下緣一條條垂下來、到處是破洞；頭骨一格一格點。
  // 字：5～8 骨頭（暗→亮）、q g G 翼膜（暗→亮）、1 眼窩、E e 眼窩裡暗紅的光。
  HD.bonewyvern = hand({ w: 126, h: 116, pad: 4, breath: 50, eyes: 'Ee', spikeOn: '78',
    pal: () => ({"1":"#120D0A","5":"#6E604A","6":"#968668","7":"#BCAE8C","8":"#DCD0B0","q":"#211F16","g":"#33331F","G":"#4C4C2C","E":"#FF4A2A","e":"#9A1E14"}),
    rows: [
      '...............................................................5......................................................',
      '.............................................................7775558..................................................',
      '............................................................777775557.................................................',
      '............................................................777.888755................................................',
      '..................................................................887855..............................................',
      '.........................67....66.................................56788655............................................',
      '.......................6788..6787..................................578877655..........................................',
      '.....................67888.678765..................................57878877655........................................',
      '................5678888886788765.6.................................5588888877655......................................',
      '............567888888888888765887..................................5578788g8877665....................................',
      '.........5678888877711E7888657588...................................568678ggG8877655..................................',
      '......567888777665511e16776.55788...................................5578678gGGg8887655................................',
      '....5677766655555555555665..557788..................................55785788GGggG8887655..............................',
      '.....5...5.5.5..5555556665...567788.................................5568g5788GggGGG8887655............................',
      '.......56656.5667766655.......567788..6.............................566785578GggGGGGG888755...........................',
      '..........567777766............5678887..............................56578g5678g..GGGGGg888755.........................',
      '............5555...............558758...............................56578gg5788gGGGGGGggG88765........................',
      '................................56578...............................567688gg5788GGGGGGggG.888755......................',
      '.................................56788..............................567568ggG578..GGGGggG.gg88865.....................',
      '.................................56788..............................567558ggG5678GGGGGggGGg.gg88755...................',
      '..777............................55688..6..........................55578578gGG5688GGGGgg.GggggG888755.................',
      '..77777............8..............568887.........................5585578578.GGg5788.GGggGGggggGGG88765................',
      '....77777776555556557.............58758........................555668755568gGGgg578GGGggGGggggGGGGG8866...............',
      '......77777877777666855...........55578......................55566778555g688GGgg5678GGggGGggggG.GGGG887658............',
      '...........55556888886655..........5778....................555667778885gg578GGggG5688Gg.GGggggGGGGGGgg8878............',
      '........5567778885578877655........5778..................55566777888.Ggggg58GGggGG5788ggGGggggGG.GGGgggg578...........',
      '.......5788888ggG557888776655......56788.6.............55566778888GGGGgggg588GggGGG578ggGGggggGGGGGGggggg578..........',
      '.....55788GGggggG5578Gg88776655....578887.............5566778888GGGGGGgggg588GggGGG5588.GGggggGGGGGGgggggg578.........',
      '....5678.gGGg.gg56878Ggg88877655...58758............5566777888ggGGGGGGgg..568.ggGGGG5788GGgg.gGGGGGGgggg.gG578........',
      '...7788gggGGgggg57878Ggggg8887655..55578..........55566778888gggGGGGGGggggg578ggGGGGG578GGggggGGGGGGgg.gggGG578.......',
      '..7778ggggGGggg568.78Gggggg8887655..5778........55566778888Gggg.GGGGGGggggg578ggGGGGGG688Ggg.gGGGGGGggggggGGG578......',
      '.7777gggggGGggg578G78Gg.ggggg887755.5778.......5566777888gGGgg.gGGGGGGggggg5588gGGG.GG5688ggggGGG..GggggggGGGG677.....',
      '.77gggggggGGggg58GG78Gggg.gggg88776556788.6....567778888ggGGggggGGGGGGgggggg578gGGGGGGg578ggggGGGGGGggggggGGGGG777....',
      '...gggggg.GG.g578GG78Gggggggggg88776578887......778888GGggGGg.ggG.GGGGg.ggggG578GGGGGGgg578gggGGGGGGggggggGGGGGG777...',
      '....ggg.ggGGgg578GG78Ggggggggggg888758758..6....7888.GGGggGGgg.gGGGGGGggggggG568GGG.GGgg578gggGGGGGGgg.gggGGGGGGG777..',
      '.....gggggGGg567GGG78Ggg.gggggggG88856578.7......88gGGGGggGGggggGGGGGGggg.ggGG678GGGGGggG578ggGGGGGGgggggg.GG.GGGG777.',
      '....ggggggGGg568GGG77GggggggggggGG8885778..........gGGGGggGGggggGGGGGGgggggg.Gg68GGGGGggG.678gGGGGGGggggggGGGGGGGGg777',
      '.G.gggggggGGg678GGG67GggggggggggGGg..57788.6........G.GGggGG.gggGGGGGGggggggGGg578GGGGggGG5688..GGGGggggggGGGGGGGG.g77',
      '.Ggggg.gggGG568gGGG67GggggggggggGG...5688875.....6...GGGggGGggggGGGGGGggggggGGgg68GGGGggGGg578GGGGGGgggggg.GGGGG.Gg.g.',
      '.GggggggggG.578gGG.67Gggg.ggggggGG...587586555..7.....GGg.GGgg.gGGGGGGggggggG.gg578GGGggGGgg678GGGGGggggggGGGGGGG.gg..',
      '.Gg.ggggg.GG58ggGG.67G.g.ggggggg.G...8855777655.......GGggGGggggGGGGGGggggggGGggG688GGggGGg.658GGGGGgggggGGG.GGGGG.g..',
      '.GggggggggG568ggGGG67GggggggggggG.....55778777655......GggGGggggGGGGG.q.qqqqGGggG578GGqqGGqqq578GGGGqqggg.GGGGG.GGgg..',
      'GGGggggggg.57gggGG.67GggggggggggG.....5578855776655....6gg.GggggGGGGGGqqqqqqGGggGG588GqqGGqqqq588GGGqqgg...GGGGGGGg...',
      'GG.ggggggg568gggGGG67GggggggggggG.....577..5778776655.7..gGGggggGGGGGGqqqqqqGGggGG568GqqGGqqqq568GGGqqg.....GGGGGGg...',
      'G...gggggg578gggGG.67GggggggggggG....557..5578855777655...GGggggGGG...qq.qqqGGggGGG588qqGGqqqq.578G.qqgg...GGGGGGGg...',
      '.....ggggg58ggggGGG568ggggggggggG....57...557..5778776655..Gg6.........qqqqq.GggGG.568q..GqqqqGG68GGqqggg.GGG..GGGg...',
      'G....gggg568ggg.GGG568ggggg.gggg....577..557..557885577655..7..........qqq.qGG.gGGGG578qGG.qqqGG578Gqq.gggGGGG..GG....',
      'GG.ggg.gg578g.g.GG.568ggggggg.gg.....57..557..557.557787765.............qqqqGGgg.GGGG68q.GqqqqGGG58Gqqggg.GGG....G....',
      '.Gggggggg57GggggGGG568ggggggg.gg.....557.57..557..55788557655............qqG.GggG.GGG678GGqqq..GG578qqgggg.GG.........',
      '.Gggggqqq67GggqqG.G568g.qqggqqgg.....557557..557..577.55777755...........qq.GGggGGGG..67GGq.qqGGGG58qqg.ggGGG.........',
      '.Gggggqqq68GGgq.GGG568ggqqg.qqg.......55.57..57..557..5578877655...6.....q...GggG.GGGG777Gqqqq.GGG578qggggGGG.........',
      '.Gggggqqq77G.gqqGGG568gg.qggqq........555577557..577..577.8557655.7...........gg...GGGq77GqqqqG..GG58qggggGGG.........',
      '.Gggggqqq77...qqGGG568ggqqggqqg........55557.57.577..557..55777755...........Gg.....G.q777qqqqGGGGG678ggggGGG.........',
      '..ggggqq777....qGGG678ggqqggqq........55.555.577.57..57...557887755................GG.qq77q.qqGGGGGG67gg.gGG..........',
      '..ggg.q.77G....qGGG67Gggq.ggqq........5677555557.57.577..557..855765.......q.......GGGqq777qqqGGGGGG777g..GG..........',
      '..ggggqq77GG.gqqGG.77Gggqq.g.q........5678855555.557.57..577..5577665...............GGqqG77qqqGGGGGGq77...GG..........',
      '..ggg.qq77GGggqqGGG77Gggqqggqq.......55778.5555556778557557.5678887765...............Gqq.777q.GGGGG.q777...G..........',
      '..ggggqq77GGggqqGGG77Gggqqg.qq.......56788.5.55556788557.57.56788887765.............GGqqGG77..GGGGG.qq77..............',
      '...gggq777GGggqqG..77Gg.q.ggq.......55778.5556.556788555.57756788.8876................qq..777qGGGGGGqq777....68.......',
      '...gggq77qGGggqqGGG77.ggqq.gq.......56788.5566..56785555555756788..8888..............G.q...77qGGG..Gq.g77...5578......',
      '...gggq77qGGggqqGGG77..gqqgg........56788.5566..5678.5555555567856..7888.............Gq....77qGG...Gqqg777...578......',
      '...gggq77qGGggqqG.G77Gggqqggq......56788.5556...5678.....555567856.567888....................qGG....qqg.77...5676.....',
      '...gggq77qGGggqq.GG77Ggg.qggq......56788.5566...5678.......557785555567888...................qG.....qq..777...577.....',
      '....ggq77qGGggqqGGG77Gggqqgg......55788.55566..55788.......5577855555567788..........................q...77...5688....',
      '....ggq77qGGggqq.GG77Gggqqgg......56788.5566...56788......556788.....5567788.........................q...77....875....',
      '....gg77qqG.ggqqGGG77Gggqqgg.....55678.55566...5678.......556788......5567788.................................5658....',
      '....gg77.qGG.gqqGG.77Gggqqg......58788.5566....5678......555678........5567788................................578.....',
      '....gg77.qGGgg.qGGG77Gggqqgg.....8878..5566....5678.....5555878.........5567786..............................5678.....',
      '....gg77.qGGgg..GGG77G.gqqg.....88755.5566.....5878....55558888..........5567778.............................578......',
      '......77.qGGg...GGG77..gq.g....56755..5566.....8878...555688875...........5567855...........................6778......',
      '.....g7...GGg...GGG77Gggqqg...557858.55566....88755..55568887555...........55875655.........................7788......',
      '............g....GG77G..qqg..556788..5566.....5755...5566687555.............585776655......................5878.......',
      '...........G.....GG77G..qqg..56788...5566....55758..55666.55558..............888877655...................558758.......',
      '..........G......GG77....q..56788...5566.....56788.55666..55588................8887776556...............556758........',
      '...........G......G77......56788....5566....55778..5566...55788..................88877657..............557788.........',
      '..................G7......557788....5566....56788.5556....55788...................8888778555555.....6.567885..........',
      '..................G7.....557788....5566.....5678..5566.....5788.....................8888757765555555756788g57.........',
      '........................556788.....5566....56788..556......5788.......................8857777766666587788G5788........',
      '........................56788......556.....5678..5556......5788.........................8888888887887588.568578.......',
      '.......................56788......5556.....5788..5566......5688...............................888888588.56885568......',
      '......................56788.......5566....56788..556.......5788........................................568856578......',
      '.....................55788........556.....5678..5566.......5778.......................................5588.6757g......',
      '.....................5678........5566....55788..5566.......56788.....................................5578.56857.......',
      '....................56788........5566....5678...556.........5688.....................................578GG57857.......',
      '...................56788.........556....55788..5566.........5678....................................578GGG58g68.......',
      '..................55788.........5556....5678...5566.........56788..................................5688GG578g68.......',
      '.................55788..........5566....5788...556...........5678.................................5688GG.58gg77.......',
      '.................5678...........556....5678....566...........5678................................5688GGG578g777.......',
      '................86788...........556....5678...5566............6788..............................5578GGGG57gg77........',
      '...............88788............556...5578....556.............5887..............................578GGGG668gg77........',
      '..............85555............5566...5678....556.............85555............................578GGGGG67Ggg77........',
      '.............655655............556....5788....566............655655...........................578gGGGGG77Ggg77........',
      '...........666668866...........556...5678....5566..........666668866.........................578ggGGGG77GGgg77........',
      '..........66666668666..........566...5688....556..........66666668666......................5678gggGG.G77GGgg77........',
      '.............66.66.66.........5566..5578.....555.............66.66.66......................678ggggGGG777GGgg77........',
      '.............66..6............556...5688....55655............66..6.......................7778gggggGGG77.GGg77.........',
      '..............................555...878....5555555......................................7777gg.gggGG777GGGg77.........',
      '.............................55655.8878...55..5..55....................................777GGggggggGG77.GGGg77.........',
      '............................55555585555.......5.......................................777GGGggggggG777.GGGg7..........',
      '...........................55..5.655655..............................................777GGGGggggg.G77...GG77..........',
      '...............................666668866...........................................7777GGGGGg.gggg777...GG77..........',
      '..............................66666668666..........................................777GGGG.Gqqggg777.....G77..........',
      '.................................66.66.66........................................777qqGGG.GGqqggg77G.....G7...........',
      '.................................66..6..........................................777.qqGGGGGG...g777...................',
      '...............................................................................777qqqqGGGGGG....77G...................',
      '..............................................................................777G.qqqGGGGGG...77g....................',
      '............................................................................7777GGq.qqGGGGG....77g....................',
      '...........................................................................777qqGG...qG.GGG...........................',
      '.........................................................................G777Gqq......GGGG............................',
      '........................................................................GG77GGq.......GGG.............................',
      '......................................................................g.GGG............GG.............................',
      '.....................................................................G................................................'],
    ol: { '*': ['#1A1610', '#050403'] },
    face: {}, fx: [], fx2: [] });
  // ==== 朽翼龍・手點 完 ====
  // ==== 雷鳴猿・參考圖 ====
  // ---------- 領主體・雷鳴猿 v3（2026-10-11 作者給的參考圖：藍黑色的巨猿，駝背、兩個大拳頭撐地；肩膀和背上一大片往後豎起來的灰白尖毛；頭小、皺著眉；手臂和拳頭上竄著黃色的閃電）----------
  // 照參考圖縮小當底稿（輪廓、亮暗）。光從左上來。只有閃電和眼睛發光。
  // 字：1～5 藍黑的身體（暗→亮）、6～9 灰白的尖毛（暗→亮）、y Y W 閃電（暗→亮）、E e 眼睛、z 眼窩。
  HD.thunderape = hand({ w: 117, h: 102, pad: 4, breath: 42, eyes: 'Ee', spikeOn: '89',
    pal: () => ({"1":"#0E0F16","2":"#191B26","3":"#262A3A","4":"#363C52","5":"#4C5470","6":"#6E6E78","7":"#9A989E","8":"#C4C0BC","9":"#E8E4DC","y":"#B88A1E","Y":"#FFD24A","W":"#FFF4B8","E":"#FFE04A","e":"#C89A1A","z":"#05060A"}),
    rows: [
      '.....................................................8877799998887...........................................',
      '.................................................988888499999888988889.......................................',
      '.............................................99999999774998888899988899999...................................',
      '...........................................3999999777777998888999888889999.5.................................',
      '.........................................76887767973767897987999796878999..597...............................',
      '..........................................33999999777777998888999888889999..99...............................',
      '..........................................39999999999774998888899988899999..799..............................',
      '..........................................299997998888849999988898888999988877997............................',
      '....................................888777799997788888877799998887883333368877997............................',
      '.......................................999799888888888877779998897733333344877999............................',
      '.............................66........999866688888888999999998817733344444522999............................',
      '.....................9999999969999977799996666666888889999999988174333444455228883339........................',
      '........................9999999999999999997666666675888899999988114333344445228888779........................',
      '........................4466889999889988887755566499668889999998824333334444431778779........................',
      '.......................444455599998778888889977743339978899899988233443344444337788793.......................',
      '.......................444455533999777888899977733339999998877988233444445555337888793.......................',
      '.......................44445..33399977999999999783299999988877988123344422222222888693.......................',
      '........................2277..66778777799777789999999999988855699113332223333322288893688....................',
      '........................77779999777777777777388999899999988555599111322333444433228996688....................',
      '........................47788999997997377333533999889999888555888111422344555543226996691....................',
      '......................8898887788976663333335559999996699888555884111421111111111126977991....................',
      '...................7748888877787776553345555555999999669998855794413321zE13331Ez12487999.....................',
      '...................774887769987777752244555555555555775599988499441332133345433312888999.....................',
      '................44......44499777777222445555555555553355699984994113322344565443228889933....................',
      '........................44498777777324445555555554454445569999994113322345111543228889334....................',
      '........................4499887733335545555555544444444559998994411332234555554322888333433..................',
      '.......................99998886653335555555555444555445559998844411332231111111322888633355..................',
      '.....................999998886665225555355555444555544555999784441133322344444332288892255533................',
      '....................6888888666662225555555544455555555431199966641133332233333322188995455533................',
      '....................6888888667771134455555444555555555331119966641113311777881111559994555533................',
      '...................77777888876653344455555445555544333331118997741111111118887111573444455533................',
      '..................8777778888766633442255554455554444333211889977211121111556643117734444455333...............',
      '................998822118888766611112225544443334444332222889998811121111555443377733444445333...............',
      '...............9993322118888764411213334344443332143322222289999811111111455443377773444444433...............',
      '.....................2988888644441333344333443322213222222279999941111111444443377774444444444...............',
      '.....................29888884444443344422334433221112221111794477411111114444433571113344433.................',
      '.....................28888844444444344222444443111111211111444477411111111444435551113334....................',
      '...................9998874444433344553221445444111111111115442577444111111111455511111333....................',
      '...................9988777444433345553114445544441111111155522277444111111211155111111222.321................',
      '...................9777776644511145553444445555544111111155572677444111111111111111111112.311................',
      '..................997777866661211155334444455555544111111555444775541111113311111111111113311................',
      '..................9877777666611223333355545555555444111115544444445111111322211111111114433115...............',
      '...............8888YY7777666611123333555555555555444111115444444445111111122211111333344433115...............',
      '..............788877787776664411333355555555555454441111114444444441111111121111113333344433142..............',
      '..............788777388777644411533355555535555444441111114444444441111111111111113333444433442..............',
      '..............774422888777754445533555555553554454441111111444444111122111111111113333444434442..............',
      '.............7.....2888944753115535555555554444454441111111145411111122211121111213344444443444..5...........',
      '.............7......88894453311544554455555444441144111113315511111111111..211111334444444433343355..........',
      '....................8885555633355455444555554441112111111335511111211.......1111.333344444333333355..........',
      '...................88866555533354455545555555541122111111115511111111.......1111.333334..333333335533..5.....',
      '...................8876655553344444555555555555411111111111151111211........1111.233..1..111143334434..5.....',
      '...................27776553333444444555555555554411111111111111111..........1111.222..111111444444444435.....',
      '...................2755553333444444455555555555444311111221111111................12221111113444444444333.....',
      '.................888555553333444444444455557755544223221122111111...............11111111111334444444333322...',
      '.................88855555333334y4444444455577754442332211111111111..............11111111111334445547333222...',
      '.................48855555533334y4444444445587744443342211111111111..............11111111113344455552222222...',
      '.................488555551166yyyyy55114444687744444442111111111111..............11211111133444455442222222...',
      '.................485555111166yyyyyy5114444465664444441111111111111.............11122111113344445444y22222....',
      '.................985551111166yyyyyYY644444116666444444111111112211...11........11222111113444444444yy222.....',
      '................89844312215566666yYy664444111666534444111111112221...22.........12..331113444444444yyy22.....',
      '................883443322555566644Yy655444411667533444111111112.......212.......22..3311444444444444Yy77.....',
      '...............9933333331155533244YY555554441667443344111111112........12.......22..3311444444443446Yy554....',
      '...............9933333331144433224YYY565556644444444311111111..........12.......22233441344444444446Yy444....',
      '..............77333333334444455111YYYYyy555694444444411111111....3....111.......2..334413344334444yyY5344....',
      '.............7773333333344445551133666WWW555574445555111111111...33...221..........3344..333333444yYY53333...',
      '.............7443334433344444422133366WWWYY555544555511111111122........11.........1444..333333544YYY53333...',
      '............444443344333222444224433366WWWy755555555551111111111111......2........1114443333333577YY6623333..',
      '............44444333333222224424443336655Wy555445555551111111111111......21.......1222223334335577YW6644533..',
      '...........551113333333222222144443333355YY555444555551111111111111.....111.......1222223334435554WW5544555..',
      '...........551113333333322221114555333333WW55554455555111111111111112211111.......2212223334455544WW5544555..',
      '...........533144323333322221114554444533Wy55555555555111111111111111111111.........11113333555445555555555..',
      '...........534444333333322222111554444553Wy5555555555441111111111111111111..........1111333355544555YY55y55..',
      '...........33444333353332222211155444455yWYY555555555451111111111111111111............111114455555555yyyyy5..',
      '.........3333344333344331112211155444555yWWY555555555555111112111111111111............111114445555555yWW555..',
      '.........3333344333444331111111155555555YWWWYYY555555555411122211111111111.............11114445555555yWY554..',
      '.........333333222221111111111115555555YYWYYWWW555555555441112111111111111.............11114445555555yYY554..',
      '..........33333221111111111111115555555YWW55yy5555555555511111111111111111.............111444555554455YW55444',
      '..........223332111111111111111133YY555WYY55y55555YYY553511111111111111122............11111445552444553Wy5555',
      '.........222222211111111111111533355YYYWY555555555YY55433111111111111111..............11111135523344553yy555.',
      '........1112222111111111111155543555YWWYY553555455YY5543331111111111112...............31551133335554453yy555.',
      '.........112222111111111111155445555YYWY55333554555W5544334411111111112..............44555513335555445YY5555.',
      '......441112221111111111111155455555YWYy55334445555W5554434441111111111............555555553244555555555555..',
      '......4311112211111111111111555555YYYWYy5533444555YY5555444441111121112............555544533244553355YY111...',
      '......3331111111111111111111445555555WYy5533444555Y5555554444511111112222..........5544444445544533YYYY111...',
      '.....44333111111111111111114444yyy555yWy555334455555555554444551111111221..........444444444554443yY554333...',
      '.....43333331111111111111144444yyy445yWy5553444555555555554444511111111112.........444443444444443yY5543335..',
      '4...333333333111121111111144444444455yWy555444555555555Y554444411111111112........5541111444444443yYyy41155..',
      '4...334443333111111111111114444444455YY5555444555555555Y555544441111111111........5551111154454443yyyy4111...',
      '....344433433311111111111111114443455555555444555555555Y555514444122111111........551111115555544yy4455551...',
      '....44455555335111111111111111111335Y555555445555554455YY555545551121111121.11....551111114455555yy445554....',
      '....45555555555511111111111122111115Y5555555555555544555Y555115551111111111.......551111114445555y4445544....',
      '....55555554555511111111111122...115Y5555555555555555555Y44411355...................111111444455Y44355544....',
      '....55555444155411111111111.......1Y55555555555555333355y44411355...................1..11134445yY43355555....',
      '......551444155411111111111.......1Y44555555555555333333y443333111..............222....44433444yy13555555....',
      '4.......11.....1111111111.........yy4444555555544..44111553333111...............22222144443355441135511111...',
      '4..............4444444444.........yy4444553355..4..441115533341......444........222111144433221112111111111..',
      '4.....444444444444444444444................255.......115555334......4.......555555551111..1111111111111111...',
      '................444444444444...............255.......11554533....444..........44445511...11111111111.........',
    ],
    ol: { '*': ['#141622', '#040408'] },
    face: {}, fx: [], fx2: [] });
  // ==== 雷鳴猿・參考圖 完 ====
  // ==== 緋面風翁・手點 ====
  // ---------- 領主體・緋面風翁 v3（2026-10-11 作者給的參考圖：用大翅膀把自己包起來的鳥人，緋紅的臉、長長往下勾的鳥喙、亂飛的白髮；黑色和緋紅的羽毛、翅膀下半截一大片奶白的長羽；細紅的鳥腳、彎爪）----------
  // 照參考圖縮小當底稿（輪廓、亮暗）。光從左上來。
  // 字：1～4 黑羽（暗→亮）、r R S 緋紅（暗→亮）、6～9 奶白的長羽和白髮（暗→亮）、E e 眼睛。
  HD.windelder = hand({ w: 113, h: 104, pad: 4, breath: 40, eyes: 'Ee', spikeOn: '89',
    pal: () => ({"1":"#0C0A0C","2":"#18141A","3":"#262028","4":"#3A3238","5":"#6A5E50","6":"#8E8270","7":"#B8AC94","8":"#DCD0B4","9":"#F2EAD6","r":"#5A1418","R":"#8E2228","S":"#C23A3A","E":"#FFE89A","e":"#E8A040"}),
    rows: [
      '...............................................11..4478877779.4849S84444.................................',
      '...............................................1....4444466989899889R944.................................',
      '.....................................................4444698999SSS998894.................................',
      '.............................................1.....4444476489SSSSSSS9984.................................',
      '.............................................1....4446667689SRSSSSSSR984.................................',
      '......................................234444......444644429RSSS1E1SSSR8..................................',
      '.....................................3234444.....4444444221RSR111SS1ER...................................',
      '.....................................333334.....44111111111rRSSSSSSRRr...................................',
      '...................................223333.......111444....4RrRRSSSRRr1...................................',
      '..................................2222333..2...1118464....4RRrRRRSRrS........4...........................',
      '.......................................33312...117876444444R22rRRSRr1.......241..........................',
      '.......................................3331....4777788444444221rRRrR.......2231..........................',
      '................................2..22223431..114778844444444111rRSrR......22231..........................',
      '..............................112..22233411..44477774411344S1112rRrR......22331..........................',
      '..............................332...22333111144447332211333S1112rRrR.....111331..........................',
      '.............................23333..22331111111444333212222211112rrR....2221322..........................',
      '............................2223333331331111111144Rrr11...2211212r4R....221132...........................',
      '...........................112233334114311113331rRRr11..4..22221122r...2221111...........................',
      '..........................21224333341141111233rrrRRr11..4...2221112r2211111111...........................',
      '..........................2222444423314111123rrRRRRr11..4....2113111222111111111.........................',
      '..........................233211432332411133rrRRRR1122.......2113111121111113222.........................',
      '.........................22222113333321111rrrrRRRR112...2166.11133111111111132122........................',
      '.........................23122133331422111rRrRRRr1112...2177666433111111111122112........................',
      '........................223122233422111111rR1RRrr1111..111888666641111111211121222.......................',
      '.......................222222233342222111r221RRRRRR1111SSS748888766131111211121122.......................',
      '......................1112...233422222211r211RRRR4444444433444188876611111112211222......................',
      '.....................11122...334212223221111RRRRR4444344443341114887661111111211221......................',
      '.....................111..1..334222222223111RRRR..1123441133311114887661111112212121.....................',
      '.....................221..1..342214222232221RR1...11222211111111114488661111122322221....................',
      '.....................221.......22222222222321r1.2211222221111111416666664111132232221....................',
      '.........................1.....213222222232211112211222211112114416666664412322222221....................',
      '.......................311.....422213222322211112111222211..2144446666664442322222221....................',
      '...................222331323142142222222222211131111112111.......46666664442322222221....................',
      '...................222322331S1422132222222221113111111222........466666644422322221321...................',
      '..................22222222221421422122222222111311111222.........466664444422222222221...................',
      '.................2221112221R21S21422122222311122111112....2.....RRRR44r4444222222222212..................',
      '.................22212333121S21421222221S321112111111.....2.....RR774Rr44342222222221321.................',
      '................2211222321S21S21421222222221111111111...1124...4SS774RRR44R2222222132221.................',
      '................21132224141S21S14221222222211211111....111142..44S66SSSRrRS22222213222131................',
      '...............21223224121S1S1S21222122222211221111....111112..44SSSS766rRS22222213221221................',
      '...............21231223121S21S13212221R222211121..1....111..44...S44S7776RS222221222122131...............',
      '..............11133124121S1S1S212212221R22211222..1..222....4....S44S8776rS222212221222121...............',
      '..............1113333121S1S1S1R212212221S2212221.....222.........444R877SR1S222122212212211..............',
      '.............11333333121S1S19212122122221S212221.....222.........44rR844SS1S222122132132121..............',
      '.............1133334141S191S1S12213212221S212221.....22.........444rr444RS1S2212221321312211.............',
      '...............3Rr41331S191S1S2121221222212112211..1122...33.....44r2471RS1S2212213212212121.............',
      '...............RRr21413181S18141221321R2212111111..111111141.....44r22711S1S22122122121321...............',
      '...............RRR1R112191S181421213214222111122111222232221.....44Rrrr1441S22122122121311...............',
      '..............RRR1rR12181S1814121221221R221122222112222222221....1RRrrr3341R221221213213131..............',
      '..............RR11R131181S17141221212214221122222212222222221...21RRRrRrr414214212212122131..............',
      '.............RrR121221819191814121221221S21122222112222142221...121RSrRrR4142132122131212141.............',
      '............3RR1121317818191714121221221S2112222114S122222221...221SSRRRRS142132121221212131.............',
      '............3413412218191791712122121221421222211144422222131.2142216RRRRS1421R21212132121312............',
      '............3414134118191818141212122122141122211144422213221.42217216RRRS1421R21312141213131............',
      '............4134132121781818141212122122141122111444422132221.21222181RSSS1821314212141212131............',
      '...........41141341181819148141212212122141121114444421S221S1.14214219166S18213142121312121412...........',
      '...........4114141121781914141212121212rRS1111144444421S221S2142142172167S1S21R1412213131221313..........',
      '..........31121441121817814141212121221rRS1r1144441441S221S2122142192181782181R1412121412121313..........',
      '..........12214313217818171841212122121rRS1r..4rRS1781S21S21S21R212142171921S1R1412121412131313..........',
      '..........1241431221817818191211221213rrRS1...4rRS1781421S21S1R21S1221817121S1S14141213121311412.........',
      '.........1231431221781817819121213121RrrRS3..22rRS7741S1921S21R1S2121917212181814141213133131212.........',
      '.........2314431311817814149121213121RrrRS3..22rRS444S21921S1S1S21R141821911818141412114131312122........',
      '........12414412311718164141421213121RrrRS2211.rRS44672181721S1S1S13218191317171714113131313114131.......',
      '........121441231121881641212112131421rrSS1122.rRRS44419214181S21S13121819121181414213131412313122.......',
      '........121441231121891714212121213141rrS111334rRRS467192141S1S1S1S1S18141318181441412121331312312.......',
      '.......2314412311414916812112121213131rRS111444rRRS4641818192141S181S14141918181441212121331312312.......',
      '.......2114412311417918142121121213131rRS111444rRRS8641814181S1S1S1S1414121212181412121121312312122......',
      '.......2114113122148168142131212213121rRS114444rRRS84418121818181S1S1414119191711412121121412311312......',
      '.......1...1131..148168141131212212121rRS111444rrRS11818121918181S81S1414191917914121121213313122........',
      '4.................8144172123121212112rrRS111444.rRS1178121418141S181S1413212181914141121213314122........',
      '4.....1...........8144172131121212121rrRS311R44.RRS1178121419141S181741S1211912121131..12113133122.......',
      '4.....1.........11814418113121121..41rrSS311RR22RRS11121214181317S14181S11S1811419111..11213133122.......',
      '4...............12144178113121..1..41rrS..1RRR21RRS11121214181291S1417S1S1S1r91S18211.....11313122.......',
      '4....1.....12..118142172131221..1..41rRS..1RRR21RRS1112121417417181691S1S2121S21211R1.....12312312.......',
      '.....1.....12....1441781131121.....41rRS123RRR11rRS1112121491417178191SS1211S121131211....122123122......',
      '..........12.....144172113131......41rRS123RR111rRS111211219141671817S1S1191S11S1311S1.....12123122......',
      '..........12.....142142113131......21rRS122RR112rRS111211219112191641S1RS191RS1S21S141.....113123122.....',
      '..........2.....174114112111.......11rRS1233R112rRS11121131911219164191RS1821S1R21R211R.....12123122.....',
      '.........11...121721131121.........11rRS12r3R112rrS111121311412149141891821219211S11411R.....21..1231....',
      '.........11....147212311...........12rRS12r33221rrS111121311212149144181821171191R11R11S1.....1..3122....',
      '.........1.....144113121..........212rRS12r21221rrS141121311211219144178119171191rS1rS1641....31..122....',
      '.........1....224411312..........1212rRS..r21222rrS1411211213112189141781191691921S21S21721........231...',
      '.............2223123312..........1312rRS..Rr1222rrS1111211214123189118174192192191S21S171141........22...',
      '..............22222412...........131rrSS..Rr1222rrS111131121321211911817819217218211S1141181........231..',
      '........1.....12211412..........12112rS1222R1222rRS..1141121321121921441821171191191S81331781........312.',
      '........1.....12211222.........313114rS1222R1211rRS..11411213313211211218211811911811711131791.........12',
      '..............1221111........13123144rS111141111rRS12213112143132112112192117918917817811314821.........2',
      '..............222..11...211..2312214rrS113144112rRS121122112122132112113144179179178217214214181.........',
      '..............211..1.........2311214rrS113144111rRS111222112142134123113143188218218218214141141444......',
      '..............221..1......2312211214rrS111144111rRS111112112142112134113142219214218171171144....44......',
      '.............222..1122211123112121R4rrS11111RR12rRS121112112132112113212212218141181171168144............',
      '.............122....2111111112112112rRS11111RR11rRS221123122132111212312212121141191179177144............',
      '.............1444....122211112112112rRS111112111rRS222223123131211211312121121191119177817814............',
      '..............4......11111122333411rrrRS11112111rRS2222121223112123122311311..1831144178147817...........',
      '.........................112233231RRrrrRR...221rrrRS.....1222....11.....1311....31112188414917...........',
      '.................................RRR.RRRRR....RRrrrRR..................................891..8884.........',
      '................................RRR.RRR.RRR..RRR.RRRRR..................................88.....4.........',
      '................................RR...RR..RR.RRR.RRR.RRR..................................................',
      '......................................R.....RR...RR..RR..................................................',
      '..................................................R......................................................'],
    ol: { '*': ['#161216', '#040304'] },
    face: {}, fx: [], fx2: [] });
  // ==== 緋面風翁・手點 完 ====
  // ==== 棘背狼・手點 ====
  // ---------- 領主體・棘背狼 v3（2026-10-11 作者給的參考圖：壓低頭往前的大狼，灰白的毛、背上一片黑毛、身上一道道血紅；從脖子到尾巴一整排骨白、往後彎的大尖棘；細長的眼睛發黃光、齜牙；黑爪）----------
  // 照參考圖縮小當底稿（輪廓、亮暗）。光從左上來。
  // 字：1～5 黑毛和陰影（暗→亮）、6～9 灰白的毛（暗→亮）、w W 骨白的尖棘、r R 血紅、E e 眼睛、z 嘴裡。
  HD.spikewolf = hand({ w: 115, h: 93, pad: 4, breath: 45, eyes: 'Ee', spikeOn: 'wW',
    pal: () => ({"1":"#0C0B0C","2":"#1A1818","3":"#2C2A2A","4":"#444040","5":"#605A58","6":"#7E7874","7":"#A49E98","8":"#C8C2BA","9":"#E6E0D8","w":"#D2C6AC","W":"#F0E8D4","r":"#6A1A16","R":"#A42E26","E":"#FFD84A","e":"#E89A2A","z":"#060505"}),
    rows: [
      '.....................................................4.....................................................',
      '...........................................................................................................',
      '.................................................88..w.......55............................................',
      '..............................................w.888.ww....888..............................................',
      '.............................................ww.88..ww....888..............................................',
      '.............................................ww....www.....................................................',
      '............................................www44..ww......................................................',
      '............................................wwR4..7wwR77....w..............................................',
      '....................................w55....77w44..7wWR77...ww..............................................',
      '....................................w......7wW4..57W8777...ww..............................................',
      '...................................ww.....R7W8..577W877...ww...............................................',
      '...................................ww.....77W...5wWW774..7ww...............................................',
      '...................................ww.....wWW...7wW8774..7WW...............................................',
      '...........................w.......wW33777wW88667wW877737wW.........w......................................',
      '...........................ww.....rwW33777wW883r7wW887737wW...5...www......................................',
      '...........................ww....2rwW53337wW8811wwW11117wWW...5..www.......ww..............................',
      '...........................ww....27wW66337wW8811wwW1r127wW6677...ww55.....www55..88........................',
      '...........................www.5527wW661r7wWrrr7wwWrrr37wWr677..7ww5.....www853377.ww.....66666............',
      '...........................87W.5557wW611r7wWrrr7wwWrrr77wWrrr1.7WW5.....www8813377www..888776..............',
      '............................7W577177WW11r7wWrrr7wwWrrr77WW13117wW8.....7ww3888677www...8777................',
      '...................ww.......7wW77177wW11r7wWrrrRRwW1227wWW67777WW4....7wW3388877www777777..................',
      '...................ww.......7wW77177wW85rRRWrrrRRwW1227wWW6668wW444117wW3333887wWw777755...................',
      '....................ww......77W34417wW85RRRWWrrRRwW122RRW66117wW33411wwW336117wWWRR6685..ww................',
      '....................www....777wW321RRWWrrRRWW11rRRR447RRW66117wW334.7wW111117wWWrrR6884wwww................',
      '.....................7WW...817wWr22RRWWrrrrRR11rRRR44RRRW77177wW11..7wW11117wWW55rrrr7www..................',
      '.....................77WW..8177WW22RrRRrrrrRR11rRRR11rrRR471RRWW11.7wWW.1137wW155rrr77ww7..................',
      '......................7wWRR81RRRW22rrRRrrrrRR4rrrRR11rrRR411RRW11..RRW....7wWW885117wWW7733................',
      '....................4.77wWR81.RRWR2rrrRRrrrRR4rrRRR.rrrRR441RWW11.RRWW...RRwW....17wWWr2222................',
      '....................4477wWWrr3rrRR2rrrRR111117711...rrRRR44rrrR11.rwWW...RRWW....7wwWr22r22................',
      '....................66777wWr33rrRR211r22111187711...1111444rrRR64rrRR...rrWW....77WW..2rr2226wwww..........',
      '..................716888RRWW2..rrR211r22..1888774...1111188rrRR44rrRR..rrrRR..1RRwWW..777677wwwww..........',
      '.............wwww.711888RRwRR....2211111..1888744...1111188776663rrRR11rrRR..11RRWW.....77wWWw445..........',
      '..........55.wwww77777888rrRR......4r11...7888..45.....118877866336R.44rrRR111rrWW.....77wWW333............',
      '................WWww77R44rrrR......4r111117888..45......1188877556644444.R111rrRRR....77wWW5733............',
      '.................6WWWwRRr2r24......221111173335544..4....188877556555555..111rrRR....RRwWW158777...........',
      '.............8...688WWRrrr115......2211111..336664..411..188111133355555...111.R....rRRWW11117777..........',
      '.............88555888WWRr2115......22..111..336664..411..18811113333555....111.444.rrRWW11111166777........',
      '.............886688888RRR1111...............366644464...33331115533354.....11..4455.rRR1111rr166777........',
      '.............88668Rr331331111...........144466775446...4...5...4511344....111.4335...R.111111167777........',
      '.............88888Rr2211111153433......1144467777664...4...5...4411444.....1114335...5.111111117877.55.....',
      '............18888822221111115333344....1144477867664.444.......444444111...1115335..65.11rRR7777887........',
      '............188888222111111..333344....1144778667762111111....444444111111111155333364.1rrRR77ww777........',
      '.............88888111111111..433..11..11144778877622111111....4444..111111111157733374.1rrwwwWWWWww........',
      '.............8888811111111144433..111111144778876622111113..1.......11111111117772277446RRRWW133Wwww3......',
      '.............8863211111144144433..1111111556688866621111131111......111111111577128774446...444444www3.....',
      '............38863334411144114553555.11114456688766666111111111....11111111115578888774444...4444447777.....',
      '............388444444441441155555...11111466667776666611111111....11111111117788888874444.....445567777....',
      '............888444444444441155555..111111666666766666511111111....1111...11177788888844444rrrRR35667777....',
      '............8884444r4388666155555..111111166666663365511111111....1111.....177778888444444RRRRR77777R43....',
      '............8884444r4388666811115441111111556666233754411111111...1111.....177778888644444RRRwwwww77RR3..6.',
      '...........99334R4334668888811111111111111144466222264..11111.....1111.....17777888744455.RRRWWWWWW77R3..6.',
      '...........99334R33r4668887791111111111...11446622..64..11111......1........687888775444......2444WW7wr....',
      '...........99311132r99668877331...........11443662..55..111........1........68888875544......444444Wwww....',
      '...........9733EEe229968877711..........1111113556..55..11..................5668885555......rrr454444ww....',
      '...........731111rr89968766111......5..111111115556655......................5768886554......rrrRR44444ww...',
      '...........3331111555566666111...1115..111111111556655511....................6688663545555.RRRWR777444822..',
      '...........3331r11555666666111...11111111111111155667431111..................5689666557774..RRWWWw77W4466..',
      '..........7777rr88774666666444111111111111111111778874368...................15589666577774.....WWWWwW56666.',
      '..........7777RR8877445556644..1111111111.....777888...68................11115776666677744......4477wW6666.',
      '..........99RRR888114444446.....111111111.....777888....1111.................5776666544744....rrr4227ww777.',
      '.........89RR8883311444..........11111111.....778888....11.....................666633477222...rrrr225www775',
      '.........89999WW33zzz........4...11111.......66883335..11......................22663347722222RRRRRR245www35',
      '........7779WW6zzz..........44.11..11.......6666.3335.111......................222234445552111RRWww7746ww3.',
      '.......777WW8zz255..........44.11..1........666633311111........................22.1444454441112WWW774463..',
      '.......7WWzzW8115..........444..1..1........6664333111.............................11111444451122WW7wW463..',
      '....zz.Wzz888811...........422.............443rrr32211.............................11111221155552..77wW43..',
      '......zz42888111...........................333rr332222................................11..1155552...7wW43..',
      '.....11W1W21111..........................4453rr3332322................................1....155544....7ww7..',
      '......1112211............544..11.........44RRr333233.................................11.....556444....ww7..',
      '........................55522.1........6666R4433.....................................1........66442....ww..',
      '........................55331..........6666R4433..............................................55422.....w..',
      '......................6655331.........66667443333...................................2.........566222....5..',
      '.....................56664411........886675443333...................................2..........66622....4..',
      '....................3555644.........888RR554...................................................66622....4..',
      '....................3555334.........88885554...........................22222....4422...........66633.......',
      '....................5555333.......9988R133rr.........................1122221..222111............7663.......',
      '....................555331.......6999RR14222..........................111111112221111...........6665.......',
      '..................55555321.......6877RR4422...........................11..1111122...............666543.....',
      '..................55555..........8886RR44.............................1...1111111...............366643.....',
      '.................655555.........88886344..............................1...1111111...............376643.....',
      '..............5556661..........888884444........................................................372533.....',
      '..........55555566661..........88888311.......................................................5557255334...',
      '.........555555666661.........888886111.......................................................5532255554...',
      '.........144..5666611.........888776111.......................................................444411144....',
      '.........14...553331........7788777...1.....................................................11444411114....',
      '........111...5533..........7777777.........................................................1111111111111..',
      '.........11111..11.......77447777711............................................................1...1......',
      '4.........11...........887777777755...................................................................444..',
      '4....................77886665557755..................................................444444444444444444....'],
    ol: { '*': ['#1A1818', '#050404'] },
    face: {}, fx: [], fx2: [] });
  // ==== 棘背狼・手點 完 ====
  // ==== 新概念圖六隻 ====
  // ---------- 領主體・千節蟲 v4（2026-10-15 作者的新概念圖：直直立起來往下看的巨大蜈蚣，一節一節深色帶綠斑的甲殼、紅色的腳和大顎，後半身盤在地上）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：z E 眼睛、1～4 甲殼（暗→亮）、g G 甲殼上的綠斑、r R S 紅色的腳和大顎。
  HD.omukade = hand({ w: 119, h: 132, pad: 4, breath: 60, eyes: 'E', spikeOn: 'RS',
    pal: () => ({"1":"#121010","2":"#201C18","3":"#2E2A22","4":"#3E3A2C","r":"#6A1A12","R":"#A8321E","S":"#D8664A","g":"#2C3A1E","G":"#4A5A2C","z":"#080606","E":"#FF5A2A"}),
    rows: [
      '....................................................................................4444.......................',
      '.........................................................................444444433332222.......................',
      '..................................................................4443322222222................................',
      '...............................................................44..............................................',
      '............................................................44422..............................................',
      '..........................................................333..................................................',
      '...................44444.................................333...................................................',
      '.................444.....................................3.....................................................',
      '...............444.............................................................................................',
      '..............33.....................4443322.....44444.........................................................',
      '...................................4441111111334444rr1122......................................................',
      '..................................4441111444444444rr111222..44444..............................................',
      '.............................33444443111444444444443444444444334411............................................',
      '...........................44334444233444444444444444444442443331111...........................................',
      '...........................44444442244444444444r444444444422233211111.......444................................',
      '..........................444444432444444444244rr44444444442222224444444233444rRRrrrr44........................',
      '..........4...............444444333444444444244433444444444422222244444423rrr3333rrrr4444......................',
      '..........4...............4444443344444433444444322444411144422222224443322r33233333333344.....................',
      '..........4..............44444444444444444444444222222211112222222224443222233333.......3344...................',
      '.........44.............44444444444444444444444411112222111221122224444422222233..........444..................',
      '.........4...........44444444444444444442344334111122242111441122314444442334444...........444.................',
      '.........4........44r444443344444444222223443111111222411114411333114444443144444...........44.................',
      '.........4.......rr2r444443334444442222223311111111221111133111331111144444124444444...........................',
      '.........4.....3332224444433344444422224433111114112111111331122111111144442224444433..........................',
      '.........4....43..22444444444444444222244331111141111111111311221111113334422244443222..444....................',
      '.........43...4...4444444444444444322244433111111112221111r222rr112223333111244444422rrrr4RR44.................',
      '.........43.....zz4444444444444441144444433111131122r3311rr322rrrr2223311111144444422rrrr2244444...............',
      '.........44....zEEz44444444444444114444422211122112rrr311rr332rrrr22211111111444444412222223344444.............',
      '.........44.....zz4444444444444411144442222212221122rrr112333111rR2332r1111114444444122222233443333............',
      '.........33......44444433444444111144442222222222111rrr222333111223333rRR111222244441142222...433334...........',
      '..........r......444443334444441112243411122222221111rr211333112244333rRRR2222224444114422.......3444..........',
      '..........r......4444433344444411322333111222rr221111rrr11333122244333rrRRR222244444114444.........444.........',
      '.................1444433444444233444334442221rrr11111rrr111r22221rr23311RRr2222222111134444.........444........',
      '.................14443334444443344444344422211r3111111rr111121112rr333111rr222332111111344444........444.......',
      '.................4444334444444344444211111221133r11111rr1111111113333311rrr2211111113333344444........44.......',
      '.................4444444444444444422211111211133rr1131r31111111113322222rrr22111111133333443344........44......',
      '................3444444444444444222211111rr11222rrr131r3333311111rr22222rrr33322221122223333334.........4......',
      '................34444444444444422244122111r11222rrr222r3333111111rr11222rrR33333222222222333322.........44.....',
      '...............444444444444444112444422111222222rrr222r3..3441111rr11222rr22rrrrr22222244333322..........4.....',
      '............444444443333444441113444411111222222rr...24....443311r222222Rr222rrrr322222443333222.........4.....',
      '..........444444444433334444111333444411112224224r...24....4433142222111Rr23222rr311222444432222rrrrR..........',
      '..........44444444444444441111443344441332222r223....24....22..444422331r223322RR3111224444412222rrrRR.........',
      '..........22334444444444111114441113333333332r223.....4....2....4442233rr223333RR31222224441112222222244.......',
      '............3334444444441112222r11113311rrr3332232....4.........4422224r2233213RR322222244111112222222444......',
      '.............3333444444411122222RR1111111rrr322232..............222334422211224RR332221111111111122222244......',
      '.............4433444444111331333Rrrr111113rrr2.................422.222222211224RR333111111111144122..2222......',
      '............44444444441113311131rrrr1111133rr2.................42...22223322224Rrrr311111111124422.....222.....',
      '............443342444211233111114Rrrr112223rr33...............432...44rr3333224Rrrr222211111144442......223....',
      '............333222222212233114444RRr31122233rr3...............43....22222333334R312232221111144444.......33r...',
      '............33322222211111111444rRRrr1112233rr1...............42...33222233333R333333r2221111444444.......3r...',
      '............44R2222211111111114rrrrrrr112233rr1................2...333...222223333333r22221313444444......33r..',
      '...........44RR3322111111111111rrrrrRr322223331...................r33.....2224333332rrr2221333334444.......3r..',
      '...........44RRrrr11111111111111rrrRR3332223331...................r3......2233333222rrr32223333332244......334.',
      '............RRrrr111431111111111rrrRR33322...31..................43......43333333222rrr11222443331224.......14.',
      '............RRrrr111431111412111rrrrr33322...32..................43....4444333332222Rrr11222444441124.......13.',
      '............RRRrR111443111...122rrrrr33332...32...................3...3333333344222RRrr11244444441124.......33.',
      '............4RRRR11113331.....23rrrrr33333...22...................3..33333333344222RRrr11144444411123........3.',
      '...4........4RRR411113344.....334RRr333323...2......................332233333333224RR3311111122111123..........',
      '...4........4RRR411333344.....334RRr33322..........................4333....33333324R332111111221111233.........',
      '...4.........3R4422233..44....3344Rr23..2.........................4433......113111RR32222211122112223rr4.......',
      '...4.........34442222....4....3344444.............................444.......113112RR22222221122222222rr44......',
      '..44..........4444222.........3344444.............................33........143332RR2223322233322222232244.....',
      '..4...........444442..........3344433.............................3........114443rr222rr3333333322222322444....',
      '..4...........44444...........334443..............................3....44rr33444444322rrr233333332223433334....',
      '..4............4444............44444..............................3..4444r333444444322rrr233333333233444334....',
      '..3.............444............4444.................................rr33333333444433344411333333332324444322...',
      '..3.............444............4R44................................3r3333322334443333444111224433322244444224..',
      '..3..............444...........4R4................................4333....22444443344444111234443322244444214..',
      '..4...............44...........44................................4433......1444444444441122334443322444444411..',
      '..4................44.........444................................223.......11443222rrrr1123334444322444444422..',
      '..4.................44........44................................42.........11444222rrr211111144411114444444213.',
      '..4..................4..........................................4.........22444444r442211111111111111444444413.',
      '..4..................................................................44..2244444444342221111111111112444444413.',
      '..4.................................................................333rr334444444432222211111111122224444441..',
      '..4..............................................................43rr32r3344444444422223311132211222222444442..',
      '..4............................................................4443322223344444444322rr3333332222222222444442..',
      '...3......4444444444..........................................443332222333444444433rrrr333332222222222244444...',
      '...334444443444........444...................................444333222244444r44443RRrr2222222222223422224444...',
      '...34444242322........233333................................224433222224442rrr4444RRrr112222222222344422244....',
      '..3344432222222.22...2233333333.............................222444422211444211444rrrr1112222222222344442224....',
      '...4444432222224222222233332233333.........................222444443331144441443rrr311112222222222244444224....',
      '...4444332332222224422232222233333333.....44...33444444334424444444333444444444rrrr111112244222222444442222....',
      '..44444322222224224422232222224433333....3333...32444432223344444433334444444444422111111144122111444442222....',
      '..44444323222444444332233444444444432.....33....32222333223334r21133334444444444422111111111111111444442232r...',
      '.333444333333443444334444444443344332.....32....32222233223344222222234444444444112222111111111112444444332r...',
      '..333443333334444444444444443333333322....32....33222223222332222222234444444444113322212211111222334444343r...',
      '..33344333333444444444441143333222332233.332.....222222222432222222223r444444442rr3322222221112222234444343r...',
      '..333233333444444444444422233222222222222331.....22222222222222212223334444444RRrr22222222211222222244444411...',
      '...322334444444443324443222222222222222223311...322222222222222212223333444444RRr22222222222222242222rr44411...',
      '..222224444444444332333333212222222222222332122232222222222233222224444414244RR33112222222222224442222r444344..',
      '222444444444444222233333331122222223322222222222222223322222322222444444422RRrr31112222222222223312322234434444',
      '.22444444444442222233223331122222133322222222222211334322222122224444444422rrrr1111222332222222222233223433344.',
      '.2244444444442222222222223322322211332222233332333333422224444434444444443332211111134432222222222222223r3.....',
      '.4444444444442222222222222222222223333222223333344333222444444334444444433332211111134432221111133222223r......',
      '.444444444443222222222222211222222333333322233334443322444444411r444444444411122111112211111111444422223r......',
      '4344444444444422222233122211222222233233222233334444334444444211rr44444444111332211221111111112r4444223344.....',
      '3334444444444444222223311111224222442224444443344444334411433233rrr4444444rrr3322222211111111222r4442233344....',
      '333344444444444444442231111144441444424444444334444434411144444422rr4444rrrrr33322222111113222222r22222334422..',
      '33114444444444444444444444444444444444444444334444431441124444442211144rrrrr222322221111223322222222222233122..',
      '.222444444444444444444444444444444444444444424444413322111444444444114rr22211222222221222233222222222222331122.',
      '..2334114444444444444444444444444444444444424444211132231144444444443r22222122222222222223333211122222113311112',
      '..2331111443344444444444444444444444444442214333221132433244444444433322211122232222222222333111113322113321144',
      '.22232112444221144444332244444221144444222113333333333333344444444333322211112333222222122223112113333211444344',
      '.2222221224222114444211124444221114444422211333333333333334444444333332222111113332211111222211111333344444443.',
      '.12222222232221114422211144442221144444222213333333333333334444333333323222111111111111111221111133333444444444',
      '.12232222333221333422221144442222144444322224333333322rrr333443333333323322222111111111111124444444444444444444',
      '22233222333332133333222134444222224444433322433332322rrrrr3333333333r22232222221111114444444444444444444444433.',
      'r2233211333222133333322234444433224444433233333322332r33rr33112333332211222222221144444444444444444444421111...',
      '.22322213332221334333322244444333223333322133334443313333r3322111333221222222222344444444444442222244332111....',
      '.2233222233322113222222222244433322233333214422444311133333332214332211222224444444444333444442111113333311....',
      '222333322233331222222222222444r3332233332214422222111233333333244222211122444444444333333344444113311333311....',
      '3rr33322222r33112222r22222244rr3333333rr22133r22221142233333224422222211444444444443333333144444132113444411...',
      '.rr23322RR2222111rrr222222rR3rr311333rr2211333222222442233322222222222444444444444442331111114444222244444122..',
      '.r22..22RR2222211rr222222rr333221133rr2221233R222222222223222222222224444444443334444411111114444122214441122..',
      '4r.....2R2222221rr2222222rr33222222rr3223322RR222222222222222222222444444444433333444312111114341211111111122..',
      '3......rr322222rrr1122222rr31122222rr3113322rr222222222222212222224444444444333333333311444113441111111111112..',
      '4......rrr..222rr21111122rr211122223r222112222222211222222211122224443444443224433334312444rr34311122112111333.',
      '3......rr....2433221111144222211113332221112222..........2211222444444442442224rrRrr43122rrrr33311122rr221133r3',
      '3......r.....243322211124442221111233222211222............222224444444422244111rrrrr331122rrrr33111rrrr221133rr',
      '.......r......43222211122442222112233222211122............222224444444422333111222rrr322122rrrr2211rrrr222223rr',
      '.......3......422222111224422221122222222111222...........22224444422rr22333112222rrr22221111RR2211222rr222111r',
      '.......33.....422222222223322221122222222211222...........11444442222rr222311222222rr222222111R2221222rrr221113',
      '........222...222222222223332232222223332222222............444422222322222211222222rr222222111rr2222222rr22221.',
      '.............442222233333333223322222333222222.............4422222222222222222222222r2222221122r22222222r2222..',
      '............4444422444333333223334443333224444.............33222222221122222222222222222222222222222222222222..',
      '...........444444224444344444444444444444444444...........3344422212211112222222222222222222222222222222r22222.',
      '..............33...2243344444444444444444444444...........444444444444444444444444442422222222222222222222.....',
      '..............................333..3..33443444............44444444444444444444333..22332344432222224...33......'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ---------- 領主體・緋面風翁 v4（2026-10-15 作者的新概念圖：張開一對巨大黑翅膀的老人，紅臉、長鼻子、亂飛的白髮，破爛的灰色長袍綁著白帶子，手裡拿著羽毛扇，站在石頭上）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～5 黑羽和長袍（暗→亮）、6～9 白髮、白帶子（暗→亮）、r R S 紅臉和手、z 眼睛。
  HD.windelder = hand({ w: 100, h: 100, pad: 4, breath: 45, eyes: 'E', spikeOn: '89',
    pal: () => ({"1":"#0E0E10","2":"#1A1A1E","3":"#28282E","4":"#3A3A40","5":"#54545A","6":"#8A8680","7":"#ABA69E","8":"#CCC6BC","9":"#ECE6DA","r":"#5A1A14","R":"#94302A","S":"#C85A48","z":"#0A0808","E":"#FFD24A"}),
    rows: [
      '...........221111355..............................................................53..454...',
      '............1111111111..........................................................552222211...',
      '.............11111111111.......................................................1111111111...',
      '.............1111111111115553................................................551111111111...',
      '............2211111111111555334............................................55511111111121...',
      '......11222222111111112115553345.........................................555111111111111....',
      '.....1111111111111111122255444455.......................................555111111111111.....',
      '33311111111111111111112222542222555....................................55511111111112111....',
      '553111111111112211111122222222225555................................555531112211111111111223',
      '555445512111112211111222222222221115...............................665113111211111111111122.',
      '555222222122111111111222222211121113.............................56661111112222222221133112.',
      '43122222222...1111111112222111111113............................555111221112222222222233355.',
      '.311222222.....222211112222111111223.........................4555551112211122222222222224553',
      '...2222222.....22222222322221111222........................33455555112211122222222222214444.',
      '..............222222222222221111125.......................3333554451111112222222222223444445',
      '.............2222222222222211111115.....................533333344411111122222........3344445',
      '............22222222222222111111115....................553333324411111112211.............445',
      '............22222222222222121111115.....................21111122111111111112................',
      '.....55.....22211222211222221111111.....................11111122111111111112................',
      '....555....111111122111322221111111.....................1111122211111111211.................',
      '...55555..11111122211123222111211155....................3111122211112212222.................',
      '...555544111111222211222222111221115...................33111122211122222222.................',
      '..55554411111111221112222221112221155................533211112331122222222..................',
      '.555555111111111111122222211122211455...............5532211112231122222222..........555.....',
      '5555555111111111122222222111122211445...........9.8.9532211112222222222122.........555555...',
      '5555555....111122222222211111222114444.......6989898958822111222222..21122........24445555..',
      '545522......111222222222111111222222455.....3989898989892222222222....12222.....22222245555.',
      '.4222.........2222222222111111222222245.....38989RRS98982222222112.....222222....22222235555',
      '.222...........2222222331111112222222445...56698RRSSR9822222222111......2222222..22222255553',
      '.22....1.......11222223111111112222222455555669zERREzR922222222212.......222222..22222255555',
      '......11.......11222221111122211112222244522668RRRSRRR822222222212.........222......22215555',
      '.....1111......33222221111122211112222334422498RRRSRRR89222212222...........11.......3335555',
      '....111111111..333222211112211111112333333334948RRSRR84922221222.............1.........35555',
      '..2111111111...333111211121111111111133353333849RRSRr93822222...........................5555',
      '..222111111.....31111111111111111111113344332258rrSRr392222...........45......22...........5',
      '.222211111.......122111111111111144554444442229rrrSRr32822.......4....45.......22...........',
      '422211111...........11211111111134444444442222rrrrRRr22222.......4155..42......111..........',
      '32211111.............221111111133442422222222255rrrRr22122.......445...422.....1111.........',
      '.1111122.............111111111333442222222522255r4rRR111.........445...4222..5511112........',
      '1111111.......2......112111111333444221122222255443r111..........444...11244.552212222......',
      '111115.......22.....1111111111333444221112222555541112.................444...332222222......',
      '112555......11.....21111114443334445222111335555541112................445....322222222......',
      '3255544....111.....22111555443344445221113335555533112.........22..344455....2222222222.....',
      '.5555555..111.....2222133553455554443111233333333331122.......32333344455...222222222222....',
      '.555555511111....2222214443345555544411122333333333222244..33333333344455..42222222222222...',
      '4555555111112..112222114444455555544411111122443333222244443223333344455...43222222222222...',
      '5555551111122..12222211554411555554422111113244332111124444222333333444...444322222222222...',
      '555555111112..222222225555111555544422111113444222211114442222233334333...4444112222222222..',
      '5555221111....222222222221111552224442111155344222211144422222433334333..4444411122222222...',
      '555222111....1122222332222111552rr1143111555444411111144442233433333334444444444122222222...',
      '552222212....112222331122211555rrr1133551556444411111133444333433333344444444444332222233...',
      '4222222222..1122222221442255511rrr11222111444444411111334444333333333444444444233322222355..',
      '....222222211122222222445555111rrr122211144254444111113444444433333333444444422332222222255.',
      '.....22222111111122222445555111rrr1222554422254451111124444445543333333444422223222222222555',
      '.....22223311111222213444551111rrr1222554442254551111122444445543333333344522222222222222255',
      '....222223311111222443544111222rrr12222244442555551111233344444433333335555221111122222222..',
      '......2255111111224445511112222rrr1422224444255355511133334444443333335555555111112222232...',
      '.......55511111122444551111111rrr3344224444433336555113223344444422333335555511111222223....',
      '.......55111111111544511122111rrr3344455444333335555533223343344422222225555444111122222....',
      '......555111111115511111222233rrr14445555333333155553311333333444222222244444441111222222...',
      '......551111111111111111222235rrr134455553333321555541113rr1334422223344444442111111222222..',
      '......441111111111122222111555rrr333355553333322266441111r11133422222334444422211112222222..',
      '.....4441155111111122222666651222333355553333322266622111111113222222224444442221112222222..',
      '.....4443555111111133122666111122333333552333222266662211111223322222222444444223112222..22.',
      '.....444555511111113355566611111223333332222222222666222111222233222222244444422221222......',
      '....44455555111111166555661111111243333322222222222266221112222333233344444444222222223.....',
      '....44455555511116666455511142111224332222222233222266221112222342333444444222222222223.....',
      '....44..5555561166665111121142222222222222222114112266661122222242334444444222222222222.....',
      '...55....5556666666611112211422222222222222211141122666611222222233444444442222222222222....',
      '...5.....56666666666222221144122442223222441111111121666662232223333454444422222222..222....',
      '.........6666666666222222211115522111332211111221133111666623523333315444143333222....22....',
      '........666661166662222222211155221111221111132111331111666655533353324441133..222.....22...',
      '.......665541116661222242221133333341122111153311133221111555555333322244111....22..........',
      '........5554...441112144423313333331133111155532113222211155554123552221131......2..........',
      '....................144455331333311113311113552224444221115555112355223111..................',
      '.....................44555511225311113311113355224444221111666113355523111..................',
      '.....................4551111122551111rr1111115552444422111166611355555......................',
      '.....................455111122255111555111111555554444441116666655555.......................',
      '.....................441111222431113355511111555554444441116666655555.......................',
      '.....................44111122441111333321111155555544444111166665555........................',
      '.....................1221111444111445332133111555554444111111555555.........................',
      '.....................1221111143114444532233111115534441113111155445.........................',
      '.....................12211111433344444422111111333344411131115554455........................',
      '.....................222111144433444444421111113333444111111555555555.......................',
      '.....................222111444444444444442211114443444411111155555555.......................',
      '.....................2244444444444445533322111114411144111111555355555......................',
      '.....................2444433455522445533..11111111111111111111332255553322..................',
      '.....................244444355533345555...11111111111111111211332225555222..................',
      '.....................445444.2233333555....11111111224411111221232222555522..................',
      '......................3554...222333443....11111112224451111132233222255522..................',
      '......................3554..2222334443..........22224455111132233332225222..................',
      '.....................44554..2222334444...........2224455511122233322221222..................',
      '.....................44554..222233444............2224455521122213322221122..................',
      '.....................44455..221111442............12244554424222112.2222222..................',
      '.....................44454..221111122............1222554444455512...222222..................',
      '.....................45554...5555..11............1....55....55522...2...22..................'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ---------- 領主體・萬面樹 v4（2026-10-15 作者的新概念圖：巨大扭曲的老樹，樹幹和枝上長滿一張一張人臉，橄欖綠的樹冠，盤根往四面八方爬）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～6 樹皮和臉（暗→亮）、g G h 樹冠（暗→亮）。
  HD.faceforest = hand({ w: 116, h: 70, pad: 4, breath: 30, eyes: 'E', spikeOn: 'h',
    pal: () => ({"1":"#1E1A16","2":"#2E2822","3":"#463E34","4":"#625649","5":"#82766A","6":"#A49888","g":"#2E3418","G":"#4A5226","h":"#6E7638"}),
    rows: [
      '........................GGGG.111.GGG2GGGGGGGG2.....GGGG2GGGGGG..............................................',
      '........................1GG1111111GGGGGGGGGGGGGG1222GGGGGGGGGG22............................................',
      '.......................111111111111GGG111112GGGG1111111111GGGGGGG..............GG...........................',
      '.......................1111111111111111111112GGG1111111111GGGGGGGG............GGGGG.........................',
      '......................11111111111111111111111GGGG1111111111GGGGGGG2.....22GGGGGG22GGG.......................',
      '....................1111111111111111111111111GGG1111111111111GGGG22....2221GG11122GGG.......................',
      '................G...1111112222211111111111111GGG11111111111111GGG22....111111111111GGG......................',
      '...............GGG.G11111112221111111122111111G1111111111111222GGGG2..1111111111111GGGGG....................',
      '.............11GGGGGG111111122111111111111111111112411111112222GGGG222GG1111111111GGGGGGGG..................',
      '.............GGGGGGGG111111123334411111111111111114411111111221GGGG2GGGG12113311GGGGGGGGGGG.................',
      '.....22.....GGGG1111G1111111223444411111111111122333311111111111GG211GGG11133111GGGGGGGGGGG.................',
      '.....GGGGG11GGG11111GG111111222444411111111111222443321111111111222111G1113331111111GGG11GGG................',
      '....GGGGG2222111111GGGG11111122444331111111133322242221111111111121111111333311111111G11111111..............',
      '......GG222211111221GGG11111334444222GGGG11333332222221111111111111111111333111111111111111112222...........',
      '.......122211121GG11111111113344444222GGGG333333311121111111111111111111133322111111111111..................',
      '.......1111111211111111111112332244422233333332411112111111111111111111224422222221111211...................',
      '......111111111111111111111113322444333333333GG411222222211111111222444554422222111111111...................',
      '.....111111111111111GGGGG11111345543333334433G44222222322111211112222455654221111111111111...GGGGG..........',
      '22..111111111G111111GGGGG11111455654333311444444222223111122221132222426624211111111111111GGGGGGGGG.........',
      '.22111111111GG111111111111111142662433311114444442222111112221133322245565411111111111111GGGGG2GGGGGGG......',
      '.221111111111111111111111111114556543331111444444312211111122223333224455441111111111111GGGGG111GGGGGGG.....',
      '..111111111111111111111111111144554422211113334443GG211111122222GG3333422421111111111111GGG111111GGGGGGGG...',
      '...11111111111111112111111112144224222222233333444GGG1111111222GGGGG3345541111111111GGG1112111111GGGGGGGGG..',
      '........111111111222222111113314554112222223333444GGGh333333333312GG11144111111111111G11111131111GGGGGGGGG..',
      '.........111111112222322111133214411122222333333442GGh2233333455422221111111111111111111111111111GGG1111GG..',
      '.........11221211121122221213322211122GGGG33345544222222GG3345565422111111111111111111111121111111111111GGG.',
      '........111..111111111222222122222122GGGG1114556543222222GG3416614111111111h12221111111112211111111111111GG.',
      '......1111....11...11111222222222222211G1111426624442222222245565411111111hhh2221111111122111111111111111GG.',
      '.....1111.....1.....111GGG222222222221111111455654333312222244114411111111hhh222111111444444411111111111GGG.',
      '.....1.......11.....112GGGG22222222233111111445544333411113344114211111111hhh3221111144433444111111111111222',
      '..........22211.....111111GG111222223341111124224333441111333411421111111113332221111433111111111111....122.',
      '...........211......1111111111111222444311112455433444111113444422111111311333544443333311111433111.........',
      '............1........11111111111112244432211334433333311111144432211111G3333455444333331111GG344311.........',
      '......................111111111111224443321133333333341111114443311111GG333455654223311111124554411.........',
      '......................111111111111123333331113333333G411111133333112223333342662422221111114556541..........',
      '......................111111111111113333331111233333G411111133333222223333345565421222111114266241..........',
      '.....................111111111211111333334G11111113334441111GG3332222333222445544111122G11145565442.........',
      '................GGGGG11GG11113211111133334G2211111234444411GGGGG44222332222142241111112221244554422G........',
      '...............GGGGGGGGGGG113311111112233332211111224433444G22GGG4442222222145541111111222224224222GG.......',
      '............GGGGGGGGGGGGG23331111111122233433111112223333544222GG44422222211144111111111112245541111GG......',
      '...........GGG11GGGGGGG22233111111111122334433111111133335444422GG44222311111111112111111113344111111.......',
      '..........GGG1111GG1GGG22222111111111122244433331111111122144422GGG3322311111111122211111111132211111.......',
      '.........GGG112111111222332221111111112224443333311111112213343GGGGG4222111111111221111....1112221111111....',
      '.......GGGGG11211111122333321111111111222444333341111111223333332222444211111..1111111......11222111111122..',
      '........2GG11111111111233322111111111122144333334111111122333433222244443111....111111.......1122....1112...',
      '........11111111111111111222111111111112213333332111111122334442222244433444.....11111........12......12....',
      '........111211111111..111211111111111122213333332211111122234554222222333444......111..................2....',
      '..........121111221....111111111111122222333334422211111222455654222223334433......1........................',
      '...........1111........121111111111222222333333332211111122416614223223334443...............................',
      '...........1...........122211111111232222333333333211111122455654233422333443...............................',
      '.......................2222111111133332244444333333111111224411442234222333333..............................',
      '.......................222111G2222333333344433311331111122224114222244223333322.............................',
      '......................2222111GG2223333333333331113311111222241142222444223333233...22.......................',
      '....................2222221111212223333333333GG1111111122222244222224441133332233422222.....................',
      '...................22222221111244444444333333GGG11122112222221122222334111132223444222G2....................',
      '..............333333222222111444444444433333111111122223111222122322233311122211144222222333................',
      '.............33111112222221144433234444333321111112223311112223333222233411222211142222221133...............',
      '............331111112233221444432211144433221111222223211331223332222GGG4411222222122221111122..............',
      '...........3311111222113334444442111114444211123322222213331143322122GGG244444442211222244444443............',
      '.........22311111222224433222444GG111h23344112233321221133311444111122GGG33444442444222222233333GG...22.....',
      '........32211111122234442222244GG444G223334422223211...333311144333111GGGGG2222222444111122333322G222222....',
      '...22333332244412222433112223344G442111333344222211.....331111133333444GGGG11112224441111222333221233111....',
      '..2211111144441122211111122333443GG2111333444424411.....1111111133322444GGGG11111144411222211133311311111...',
      '..211111144411111211114422GGG34411122111333222224311....12231111333224444444111111224332222111113333113322..',
      '....3333322211333111144222GG224411122211133222222333.....2222233111222112222232211223333242441111.....3.....',
      '............23333343232222334212444....313112332..........23222222..231321243343.2212..241124223............'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ---------- 領主體・熔顎蜥 v4（2026-10-15 作者的新概念圖：整隻趴低的巨蜥，背上一排方塊狀的岩刺，張開的大嘴裡面熔岩發光、上下一排岩牙，肚子是淡色的一節一節）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～5 岩殼（暗→亮）、6～9 淡色的肚子和牙、y Y W 嘴裡的熔岩光。
  HD.lavajaw = hand({ w: 120, h: 82, pad: 4, breath: 30, eyes: 'YW', spikeOn: '45',
    pal: () => ({"1":"#140E0C","2":"#24180F","3":"#3A2618","4":"#563826","5":"#7A5038","6":"#6A5E52","7":"#958674","8":"#BCAE98","9":"#DCD0BC","y":"#8A2A0E","Y":"#E8601A","W":"#FFC060"}),
    rows: [
      '..................................................22............................................................',
      '...........................................5555522222...........................................................',
      '...........................................312222222322.........................................................',
      '..........................................2322222222333.........................................................',
      '.........................................22222222222333.........................................................',
      '.......................................2222222222222222.........................................................',
      '..................................44442222222222222222.........4442.............................................',
      '................................5554442223332222222222.....554444222............................................',
      '................................4444422223332222223322....44444222222...........................................',
      '................................4444222233333322223321...444422222222...........................................',
      '...............................44444222233333322222221...4442222222222..........................................',
      '..............................444445222233333322222222...4422222222222..........................................',
      '.......................4422233444445222222332222222223555222222222222...........................................',
      '......................44222331444442222222322222222222555522222222222...........................................',
      '.....................444223221444422244433222223333222222222222222222...........................................',
      '.....................422333222443322444432223333333222222222222222222...........................................',
      '.....................422333223333344434432233333333222222232222222211......5523.................................',
      '.....................4333332233333343344332333333332222223333333222111....22223.................................',
      '.....................3333322244433333343333333333332222333333333222113333322222.................................',
      '.....................33333325544433224423333333332332222333333333221113322222222................................',
      '....................333333325544512224422233323332333333333333333311112222222222................................',
      '...................443333336555553221444222222333333333233333333331112222222222.................................',
      '...................441333366553333334444422552333333332223333333321122222222222.................................',
      '..................55415555555333355444445555444343333442233333332212222222333333................................',
      '.................44555555555333111155555555444444435544222333322233322223333333333355...........................',
      '.............4444445555555533371WY1655555556644445555444232333223333333333333223333222..........................',
      '.........553355554455555555333771111155555666655555554454444333233333333333322222223223.........................',
      '........55544555544555555553333355511234556665555555yy555455444433342233333311222233323.........................',
      '.......35544444444755555555553445555523344555555555555555555544444442232233111223333222.........................',
      '.....33333334444413355555555554455555533455555555555555555555544444433332221122233332223........................',
      '.....333333311111122555555555555555555445555555555554455555554444444433332233222333222333322....................',
      '.....3211123311222221443333555555555554455555555555444455555544554444334433333223332223333222...................',
      '......211224332222332223333355555555555555545555555444445555555555544444444333223322211332222...................',
      '.......1444433222333yyyy3334445555555566554445555554444445555555544444444444442222222112222233..................',
      '........442232222333yyyyy3y42223556447777111455444544444444455555444444344444442222232222233233.................',
      '........442244223343yyyyyyyy2222333322111111222444184444444335555555444444444444433333222232224455..............',
      '........422244433344yyyyyyyy32221132211111222222211144444443355555555444444444444433332222322444222.............',
      '........4122333332432yyyyyyy32221132111333332222211224444444444555555444444444444444432222311222222.............',
      '.........1223332222222yyyyyy442221111133333332223332244445444444455544434444444444444422211222222233............',
      '.........12222222222214yyyy4443222111143333334444333333445545544445545444444444444444444443222222333322.........',
      '.........1222222222211133yyy43322221144444433444444333336555555445545544444444444444444334442222233332222.......',
      '.........22222222133111334yyy3332222244444444444444433333255554555544444444334444444444334444222222222222333333.',
      '.........222222222331111224yy4332222244444444444444443333222444455444444444334433444444444444333322222222333332.',
      '.........232233322221112222yy44222222444444444455544443322224444444445444333344334443444444444433322222223332222',
      '...........23333222221222222yy2y222224444445443355544444411144444444455553222444433334444..334444333332222222222',
      '............233222222132222233yy22222244444555534544444441111444444445555222244443333344......4.......2332233332',
      '............222222222232222233yyy2222255444455544554444433111144444555555222244444333333.................2333332',
      '............22.223322232222223yyyy22335555544544455455443331114444555555522224444433323...................3333..',
      '............2...33322222222222yyyy3333555554444445445555333414444455556552222224442222.....................3....',
      '............2...33322223332222yyyy3333455554444455444555534444222755566551122222222222..........................',
      '...............433322223332222yyyy3333445444444455444444444442222255555566552222222222..........................',
      '..............3433322233333222yyyy33y3444444444455544444444422222255555666665552222222..........................',
      '............335333222233333322yyyy33yy4444444445555444444444222222555556666655522222222.........................',
      '............35533322223y333422yyyy41yy44444444455544444444422223334555566666555222222222..3..............3322...',
      '...........335544422233yy33324yyYY31yy444444444444444554422222233224555566665555122222222232............2222....',
      '..........5534444333333yy432yy4yYY32yy444544444444445552222222133222255555555555552222222222222222222222222.....',
      '.........4554444333333yyy422yy44YY321146666445544445555111244413332225554455555555522222222222222222222222......',
      '.......444444333333333yy3322yy32YY3211166644555444433331114444225532223344455555555633122223322222222222........',
      '.....444444433333334433333yyyy32YY33313355444544444333311143342155553332444555554466552233333322222222..........',
      '....443344333334333y3333yyyyyy3111333333554333444444333114433321155553224444455544466522332332222322............',
      '....443333333333y34y3333yyyyyy311133222224433344441123334444333222255524444445554444655222222222................',
      '....442333333333yy4444yyyyyYyy224532222224444444441223334444333222233315444445544444555..222....................',
      '.....3332233333yyyy444yyyyYYY422443332222444444444443333544433322233333554335444444455..........................',
      '......33222143yyyyyyyyyyyyYY4442233332222444444322443335544444544433333555422444444445..........................',
      '......33223144yyyyyyyyYYyyy333333333223344444333224433445444444444333335554425544444442.........................',
      '.....232233344y54yyy33YY33433333333222234444433322544344444444444433333554444555444443222.......................',
      '.....22255334455445533333333323222222122444443333544334444444444433333355444435444444422222222..................',
      '.....33255333155555533333333333244423222444443334444333354444444233323355444334444444442222222..................',
      '.....33233333555555533333323333555444422444443344444433554444442333222333444444444444442222223..................',
      '33..332233333445533333333344555555444422244444554444444444443333222223333333444444444442222233..................',
      '.3333332231333222233223334455555544444423444445444444444222333222222233333334444444444552223333.................',
      '.333333331113332222...333433555556555555333444443344443322233..22222233333344444444445552222222.................',
      '2333333331111.............333355555555553333444433223322........2222233355544423444444555522222.................',
      '.32233333221...............33333544445553333333222333...........2222233555544433333444455544222.................',
      '.32233333222.................333344444533333333................332222355544441133334444445544222................',
      '222233333322..................3322223333333333.................222222244444411133334112445511433................',
      '2333333333333................444444444444444433....................33334444411113331112215511133................',
      '.....44.................444444444444444444444554544444...............3344343444433132.221..3..33................'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ---------- 領主體・沙暴鯨 v4（2026-10-15 作者的新概念圖：沙色的巨鯨從沙裡探出來，張開的大嘴掛著一排鯨鬚，下巴和肚子淡色、一條一條的溝，尾巴往上翹，身上一塊一塊深色的斑）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～8 沙色（暗→亮）。
  HD.sandwhale = hand({ w: 105, h: 96, pad: 4, breath: 40, eyes: 'E', spikeOn: '78',
    pal: () => ({"1":"#2A221C","2":"#3E342A","3":"#56483A","4":"#6E5E4A","5":"#8A765C","6":"#A8947A","7":"#C4B49A","8":"#E0D4BE"}),
    rows: [
      '...............................................................222...............................',
      '...............................................................225...............................',
      '...............................................................2555..............................',
      '................................................................5554444333.......................',
      '................................................................555444333344432233...............',
      '................................................................5554433333333333333333333333444..',
      '.................................................................554433333333333333333334444444..',
      '...................................................................4333333333333333333344444444..',
      '....................................................................344333333...33333334444444...',
      '......................................................................333333.....333333444433....',
      '........................................................................3333......33334444.......',
      '.........................................................................3233.....34444..........',
      '..........................................................................233....................',
      '..........................................................................443....................',
      '.........................................................................44434...................',
      '.........................................................................443444..................',
      '........................................................................5553444..................',
      '........................................................................54433444.................',
      '.......................................................................4444433343................',
      '.......................................................................4444443333................',
      '......................................................................55444443333................',
      '.....................................................................444444443333................',
      '....................................................................55444444433333...............',
      '...................................................................555444444433333...............',
      '..................................................................5554444444443333...............',
      '.................................................................55554444444443333...............',
      '................................................................555554444444433333...............',
      '.............................................................444544444444444433333...............',
      '............................................................66444444444444444333333..............',
      '..........................................................6665445555444444444433333..............',
      '.............776665544...................................66665555555544444444333333..............',
      '..........777765555556555333.........................4444466655555555544444443333333.............',
      '.......6667666655555555555566666....................44444455555555555544444443333333.............',
      '......6666655555555555555555555665544.............4444455555555544555544444444333333.............',
      '.....666665555555555555555555555555566522....665554444445555555544555544444444333333.............',
      '.....66664445555555555544444555555555555644666655534466665555555555554444444443333333............',
      '..........444555555555544444444455555555555566655566666665555555555554444444444333333............',
      '...........44433555555554444444444555455555556555665555555555555544444444444444333333............',
      '..............34455554444444444444444445555555556654445555555555544444444444444333333............',
      '...............34444444444444444444444445555555544444445555555555444444433444443333333...........',
      '...............33444443333444444444444444445555554445555555555555444444333334433333333...........',
      '..............333443333333333344444444444433333455445555665555555444443333334433333333...........',
      '......55...333353444333333333334443344444433333355555555444555555544443333333333333333...........',
      '.....355555333454444333333333334433334444444333445555555444444555544443333333333333333...........',
      '...44335555334445544333333333333333333444444433444555555554443333334444333333333333332...........',
      '...44331222222112222322262222333333333334444444444455555554433333333444333333334333332...........',
      '..331111111222222222222222222333322333333444444444455545544553333333333433333334333333...........',
      '...1111111112222222222222222224444223333333344444444444444445333333333333333333333333............',
      '....11111111233333323333322222444443333333333444444444444444443333333333333333333333.............',
      '.....2211111133333333344432223332443333333334444334444444444444443333333333333333333.............',
      '.....22112211133334444444522442222244333333443333344444444444444443343333334443333333............',
      '.....2212222111121444444663254222222443333322333333444444444444444444443333444333333333..........',
      '......112222111111144444662255322222244443333333333444444444444444444444333353333333333..........',
      '......122222211111133434662255551222222444333333334444444444444444444444333333333333333..........',
      '......22222221111111313366425555522222224444433333224444443334444444444333334433333334...........',
      '.......2332222111111111366225555542222222444433332118344433334444433333333334443333334...........',
      '........333222211111111166225555544222222244333333223333333334444443333333334443333334...........',
      '........333222221111111111125555544442222224433333333333333344444444333333334444333344...........',
      '.........33222222111111111115555544443322224443333333333333444444444433333334444444444...........',
      '.........32222222111111111115225444443332222444433333333333444444444443333334444444444...........',
      '.........2222222111111111111222222333333322224444333333333333444444444443333444434444............',
      '.........4455555555511131111211222233333222224444433333333333344444445444224444444444............',
      '....666778555555555555666655555222222233222221344443333333333344444555544224444444444............',
      '..66666655554454445555555555555555555523222221134444333333333344444555555554444444432............',
      '..444444333444444444444554444555555555544552211144444333333333444445555555544444443322...........',
      '..444333444444444444445555444555555555565555511114444433333333345554445554444454443322555........',
      '..4444334444444444444555555555555555555555555444223444433333333555544444444444554433555553...44..',
      '...4444444444444444555555555555555555555555554466224444443333333555444444444444544455555334455422',
      '....444444445554555555555555555555555555555555555544444443333322335543333334444444455555555555443',
      '....444444455555555555555556655566555555555555555554454433322212233543333333344444455555555555444',
      '.....44444455555555555556566665566655555555555555555444453322211223344433333344444444455555555444',
      '.....44444445555555555556666666556666665555665555555544555222221111334433333333344444445555555544',
      '......4444444555555555555666666555666666556665555445544555522221111114443333333333333445455555544',
      '.......444444455555555555566666655566666644666555445555555552222111111444333333333333334445554444',
      '........44444445555455555566556655556666664466555555555533554222211111143334333333333333444444444',
      '.........4444444455445555555555555555665555444555554555533544442221111123334433333333333444444444',
      '..........444444455444555555555555555555555544555554455555544443332211122335443333333333333333444',
      '...........33444444444444445555555555555555555555555455555554333332222222235544443333333333333344',
      '...........33344444444444444555545555555555555555555555544454433333222222225554443333333333333333',
      '...........33334444444444444444444455555555555555555555544444443333322222225555544444333333333333',
      '...........31111444444444444444444444445554455555545555544444444333322222223365554444443333333344',
      '..........2211111444444444444444444444445554444555556554444443333333222222233665555444.........33',
      '.........2211111111444444444444444444444455444455555556555444333333322222222266533555...........3',
      '........33111111111233444444444444444444444444455555555555555533322335222222266332226...........4',
      '......4432222222112223343334434444444444444444455555555555555555554455555444442222222...........4',
      '..44455222222222222222213333333334344444555555555455555555555555555555554444443222222...........6',
      '4454533222223322222221111333333334444444555555444444444444555555555544444444433332222...........7',
      '5444444445443322222221114554444444444444444444444444444444455555555445544444444444444...........6',
      '4444444444444444444555555554444444444444444444444444444444445555555555544444444444455...........4',
      '4444444444444444444445555445555555555554445554444444444444444444445555444444444444455...........4',
      '4444444444444444444444444455555555555555444444444444444444444444444444444444444444445...........4',
      '3333333333333333333333333333333333333333344444444444444444444444444444444444444444444...........3'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ---------- 領主體・朽翼龍 v4（2026-10-15 作者的新概念圖：高高站著的骨架飛龍，長脖子往前彎、頭低下來，兩片破爛的膜翼撐在地上，肋骨一根一根，身上掛著苔）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～6 骨頭和膜翼（暗→亮）、g G 苔、z E 眼窩和裡面的光。
  HD.bonewyvern = hand({ w: 112, h: 114, pad: 4, breath: 50, eyes: 'E', spikeOn: '56',
    pal: () => ({"1":"#1C1814","2":"#2E2620","3":"#463A30","4":"#66564A","5":"#8E7E6C","6":"#B8A890","g":"#4A5230","G":"#6A7440","z":"#0A0806","E":"#FFB04A"}),
    rows: [
      '.........................................................................333............................',
      '........................................................................23333...........................',
      '........................................................................233544..........................',
      '.......................................................................22244444.........................',
      '......................................................................2222444444........................',
      '.......................................................................22111444444......................',
      '...........................44...5511...................................3211144444244....................',
      '.........................55444444111...................................3221115334444....................',
      '......................444433334442222..................................3222115534442....................',
      '.....................33443333344422222.................................32222215344424...................',
      '....................43333333333344422222...............................32122115534444...................',
      '...................4433333333332244433222...............................21111126444444..................',
      '...................44333433331122244333222..............................22111126444444..................',
      '..................4443344433311222233344222.............................22211166633344..................',
      '..................44444441111111222333244332............................222111666333344.................',
      '.................3444444411111111223332243322...........................2221166663333444................',
      '................534444444133113112233322333333..........................2111166663333444................',
      '...............4544444444133.......333223333433........................421111666663334444...............',
      '...............444365555322.........1333333333322......................4111116666633422333..............',
      '...............44336555332..........11243333344433.....................4111116666633322333..............',
      '..............444466555333..........122433322444333....................41111166666333423333.............',
      '..............544466555333..........222333222444333....................411111666666333333333............',
      '..............54455555433............223343323444334...................4111111666663333233333...........',
      '..............54555554433............223343333344444223................41111116666633332233321..........',
      '..............45555554433............2...333332224444334...............4111111115565333223332133........',
      '..............55665544433.................3444222444444444.............4111111115555333222334422........',
      '.............45566654444...................24443444444444444...........51121111122553332222244311.......',
      '............44456665544....................244444444445544443..........511211112222223331122233122......',
      '............44zzzz62355.....................4444444244555553333........411111112222444441122233311......',
      '............22zEEz22335......................44444222445555533333......41111111224444444111323333.......',
      '............224zz41553........................4443322444334555334......41221111222444444411332333.......',
      '.............255444522.........................4433333333322554233.....312222222224444444444423333......',
      '.............25554422..........................44533333333223322223...33222222222244454444444233333.....',
      '..............5554432..........................3155333333322332222333333222222222244454444422333333.....',
      '..............555533...........................3115333333344342222255333312222222244444444422322333.....',
      '..............555523...........................32153344366444221122213333112222221444444444223221333....',
      '..............55552...........................222255324366444221112223333111111111444444444333331133....',
      '..............55552...........................2222445555544332221122233233112111111244444443333331133...',
      '..............5555............................22244445555433122221122354431222111112234444433333331133..',
      '.............45553...........................332114444454331112222112234422..2111122223444443333331112..',
      '.............44553..........................333111144444431111122211223312.....12112226644444433331112..',
      '.............44554.........................333111111664452261111222122331.......211224664444442333111...',
      '.............45554........................4433111111665552266111322112332........1...4564444444233111...',
      '..............4514.......................444311222555555666611142222223323............554444444433311...',
      '..............4114......................2244111..5555566611111142222213333............553444444443311...',
      '..............411.......................224411....51156651111111222311333.............553344444444411...',
      '.......................................2444111.....1155551111111122312233..............54444444444421...',
      '.....................................22233111......3355555551111122222243..............533444444444222..',
      '...................................3322331111.......355555551111141112222..............533324444344222..',
      '...................................3222311111.......335555111111111111222..............543325444334422..',
      '..................................2322211112........334445111111111111222..............444211344434422..',
      '...............................4412222222222.........11444452266111111222...............4444111144342...',
      '...........................3222411122222222..........11444442266111111222...............4444411114444...',
      '..........................3322211112..2222...........33444442211121111222...............5244411111444...',
      '.........................4432211122....22.............2244443312221112222...............5244222111134...',
      '........................4433311112.....22..............222443332231112222...............52352222111333..',
      '.......................454333111.......22...............22244322231122222...............53311222111332..',
      '.......................44443321........2.................2222222221122232...............53341122111322..',
      '.......................54444322...........................22222222112223................43211122111332..',
      '.......................54424..2.............................211222222223................44111122111132..',
      '......................55442....3.............................22232222223.................41111222211122.',
      '.....................454414....32.............................22332222233................4131..22221122.',
      '.....................444214....22..............................1222222233................511....2221122.',
      '....................444222.....222.............................1233222233................51.....2211322.',
      '...................3333222.....333..............................133322133................51.....2111322.',
      '...................4433333......33..............................133322331................511....2111222.',
      '..................444333323......3.............................1133322331................111...22111222.',
      '.................444433332334.................................111333233322...............311..222111222.',
      '................4444333333334................................21222333333333..............312..222211222.',
      '...............44444333323334...............................22222233333333322............322....2222222.',
      '..............4444433333333344..............................22222333333333332............422.....222222.',
      '..............44445333333333444.............................22223333333333332............422.....2..222.',
      '.............444455333333334444............................222223333323333332............421.....2..222.',
      '............5444443333333344444............................2222223333344233433...........321........212.',
      '...........555444433333334444444..........................222222233223342234333..........321........211.',
      '..........55554443333333344444433........................33222222112233322333334.........321........211.',
      '..........55545443344333334444433.......................33322222111221322233344444.......32.........211.',
      '.........555444433444333334444433......................443322211111122222233334444.......42.........2111',
      '..........54444433443333334444433.....................44332221111111112221133333222......42.........2111',
      '...........4555134443333334444333.....................4433211111111111122111113322.......43.........2111',
      '...........4555144443333334443334....................44333211111111111132221111113.......43.........2111',
      '...........4555144443333334443334...................44333....1111111111332211111444......44.........2111',
      '...........5442244333333344444444..................44443......1111111113333311114442.....43.........2111',
      '...........5442244333333444444433..................5344........21.111113333331224422.....43.........2111',
      '...........5522444333333444444433..................533.........2...11113313332222322.....533........2111',
      '...........55224443333443344444444..................33.............11222113322..3332.....533.........111',
      '..........44524444333444...4444444...................22............1222211332....332.....533.........111',
      '..........4442444433344.....444444...................333...........122221133......42.....532.........111',
      '..........444333443333......33344.....................33...........11222111.......43.....5322........111',
      '.........444433344333.........444......................33..........1122211........43.....532.........111',
      '.........455143443333..........44.......................2..........1122211........442....532.........112',
      '.........555134444333...........4.......................2.........22112211........442....532.........111',
      '........555234344433......3.......................................2222221.........122....532.........111',
      '.......4555233344433......3333...........................22.......2222211.........1222...532.........111',
      '.......45551333..333......3333............................2.......1222111.........1222...532.........11.',
      '......55555133....3........4444...........................2.......212212..........1222..4431............',
      '.....555551114....4........44444.........................22.......222112...........222..4311............',
      '.....555564114....4.........44444......................332.......1221112............222.3311............',
      '....5555562114....4.........444444.....................33........1221113................221.............',
      '....55555222......4..........44444444.................433.......22221113................422.............',
      '......55332..................344444454................44........222211..................222.........1...',
      '.......4311..................4444444544..............44........332223...................221.........1...',
      '.......4111.......1...........4444444454............442........442223...................2122.......11...',
      '.......4111.......1...........4444443344455........3422.......34422....22...............1122.......11...',
      '.......444........2...................33444444434423322.....233443.....21...............4113.......22...',
      '.......444........2....................55444433334233222...2234453.....21...............4113.......2....',
      '.......155........2........................4333332222222224455445......22...............41133......2....',
      '......11151.......22........................333222211133444455........1222..............11133344..12....',
      '...33111111111...22222......................3332221111133444........11132222............111133111111....',
      '314323.2112221221323323434.................33333.....3...2.............33.22............111111111111....'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ==== 新概念圖六隻 完 ====
  // ==== centiv5 ====
  // ---------- 領主體・千節蟲 v5（2026-10-16 作者：再照參考圖修；2026-10-15 作者的新概念圖：直直立起來往下看的巨大蜈蚣，一節一節深色帶綠斑的甲殼、紅色的腳和大顎，後半身盤在地上）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：z E 眼睛、1～5 甲殼（暗→亮）、g G 甲殼上的綠斑、r R S 紅色的腳和大顎（暗→亮）。
  HD.omukade = hand({ w: 119, h: 132, pad: 4, breath: 60, eyes: 'E', spikeOn: 'RS',
    pal: () => ({"1":"#121010","2":"#221E18","3":"#332E24","4":"#474030","5":"#625A40","r":"#7A2414","R":"#BA3E22","S":"#E8744A","g":"#33421F","G":"#56692F","z":"#080606","E":"#FF5A2A"}),
    rows: [
      '....................................................................................4444.......................',
      '.........................................................................44444rrr3332222.......................',
      '..................................................................rrr3322222222................................',
      '...............................................................rrrr............................................',
      '...............................................................22..............................................',
      '...........................................................rr..................................................',
      '.........................................................rrr...................................................',
      '........................................................rr.....................................................',
      '......................................................rrr......................................................',
      '.....................................441333.......5552111......................................................',
      '...................................55411111111555rrrr2121......................................................',
      '..................................5551111555555rr4rr111211...rr55..............................................',
      '.............................335555531114455554444r3355rr555rrrr111............................................',
      '.............................1355rr2344445554444444415552222rrr11111...........................................',
      '............................515552224455rr44444rr444114444221rr233111........rr................................',
      '..........................55555533244445554422rrr4444114444111222555555r233rrrrrrrrrr44........................',
      '..........r...............5555553344444445442rrr33444111444411222254455r2rrrrr2rrrrrrrr3.......................',
      '..........r...............5555453345555533444rrr32225511115512225222224422rrr32rrr333rr333.....................',
      '..........r..............55544444444444433444rr2222222211122222255222244222rr322r.......3344...................',
      '.........44.............5555rrr4444444444344444411112222111221122324225522222222..........444..................',
      '.........r...........5555555544444444224234rr44411132242111441133314555552335555............44.................',
      '.........r........rrrrr55555444555441114234rr111111322421111111341115555553155555..............................',
      '.........r......rrr2rr55553334554442222223rr111144122111113331234111115555512555RRR............................',
      '.........r.....333322r55553335444442222243r11111441214111133112331121114455222544rr33..........................',
      '.........r.....3..22255555334544443222244rr1111142111411223322231122111445523334443333..rrr....................',
      '.........r3.......5555554444444555322244rrr1111142222221rrr222rr111222rrr111333344432rrrrrRRr..................',
      '.........r3.....zz55555R4r44444rr114444RRr221223222rrrr11rrr22rrrrr222r21111153344432rrrr222rrrr...............',
      '.........rr....zEEz4555R4r44444rr114444R2222122322rrrrr11rrrr2rrrrr2211221111554444312222223334rr..............',
      '.........rr.....zz4555534444444411144rrr22221122211rrrr112rrr21rrrrrr2rrr121114444441222222333433rr............',
      '.........rr......r4555533444444111244rr2222222332111rrr2223r1112rrrrr2rrRr22212255541442222...433334...........',
      '..........r......r45555333455541112223r33122222222111rr2113r311222rrrrrRRr2222224455115555.......344R..........',
      '..........r......2445534444445113324331111222rr212111rr2113r31221rr2r22rRRr222244455115555.........RRR.........',
      '.................2445333444444223444334433221rrr11121rrr123r22221rr2321rRRrr223222211111555.........RRR........',
      '...........r.....25553334445443444551115533211rrr11211rr221r22112rr233111rrr2233211111111555.........R25.......',
      '...........r.....25553344455533444441111112211rrr11211rr111r11112rr333111rr22122111133311555r.........25.......',
      '...........r.....55554444455533444222111rr21122rrr1141rr111r11111rr23112rrr2r122111133311555rr.........55......',
      '...........rr...355555445555544422231122rrr1122rrrr141rr133312221rr23122rrrrrr2222112221133522.................',
      '...........4rr333555554444555442222312211rrrr22rrrr222rr133112221rr11222rRrrrrrrr2222222233322.................',
      '...........4r334455r33444555541124533221112rr222rrr221rr..11r2111rr11222rRr2rrrrrr2222222333222................',
      '...........43334455r333355552213345rr2122122r222rr...1r....4r211rr222222Rr22r2rrrr22222553332222r..............',
      '...........r33344453333355rr22453355rr121122rr22rr....R....442..rr221111Rr2rr2rrrr1122255rr33222rrrrR..........',
      '..........rr334454444453rr1112453355rrrrr222rrrrrr....R....22....rrr231rr22rr2rRRr11222445rr2222rrrrRR.........',
      '............33445555555rr11112rrrr2332rrrrr2rrrrrr...............rrr231rr23rr1rrrr122222255r1122rrr2222........',
      '.............334555555rr221222rrrr233211rrrrrrrrr2..............rrr322rr223321rRRr222244rr11112122222222.......',
      '.............444555555rr22r222rrrrr311112rrrr2r..2..............r22332r2221122rRRrr33211111111111222222rr......',
      '.............444555555111rr4133rrrrr11112rrrr2.................rr2..2222222333rRrrr3111111112244122..332rr.....',
      '.............444445R55112344131rrrrr11111rrrrr.................r2....222332232rRrrr311111122222522.....22rr....',
      '.............144421R521223411111rRRrr11112rrrr3................r2....rrrr34432rRrrr222221112222552......22r....',
      '.............111121R221133311rr1rrRrr1111223rr3...............rr....r2r2234432rRrr2rrr221111222555.......rrr...',
      '.............1R22222213331322rrrrrRrr1111223rr1................2...rr222233333Rrrr2rrrrr11111225555.......rr...',
      '............rrR222222131111211rrrrrrrr11122rrr1................2...r33...33222Rr33rrrrr3331413335555......rrr..',
      '............rRrrrr211111r111111rrrrRRrr2222rrr1...................r33.....2222R333r2rrr3331433333555.......rr..',
      '............rRrrrr1rrr1rr111111rrrrrRr33222rrr1...................r3......22223333r2rrrr2213333333255......rrr.',
      '............rRrrr111rr111111211rrrrRRr33r2...r1..................43......r33rr333222rrr11222443331225.......1r.',
      '............RRrrr11111111111211rrrrrrr33r2...r1..................43....rrrr333443222RRr11122455rr1124.......1r.',
      '............rRrRR111111111...122rrrrrr33r2...r1...................3...rrrrrr3rr4322RRrr22223355441124.......33.',
      '............rRrrr11111111.....23rrRrrr33r3...2....................3..rr233333333344RRrr11rrr555441223........3.',
      '............rRrRr1111144r.....23rRRrrrr333...2......................rr22333333r333rRRrr11111122111123..........',
      '............rrrR33113144r.....225RRr2r..3..........................rr33....333r333rRrr21111112211123rr.........',
      '.............rRR322233........225RRr2..............................rrr......11r111rRr222221112211223rrrr.......',
      '..............RRR2222.........222RRrr.............................rrr.......133131Rrr2rrr21111112222rrrrr......',
      '..............rRR2222.........22RRRrr.............................rr........14333rRr22rrr221111122222rrrrr.....',
      '..............rRR52...........325SR33......................................r1444rrr32rrrr2211133222233332r.....',
      '...............RS5............325SR3....................................rrrrr455rrr322rrr2rr1333322244332rr....',
      '................SS.............RRRR..................................rrrrrrrr45rrrr322rrr2r333333323344422rr...',
      '................SS..............RRR.................................rrr22rrrr44rrr2222rrr1333333332324444222...',
      '.................RR.............RRR................................rr333333rrr444322rrrr11122444332224444422...',
      '.................RR.............RR.................................333....rrrrrr433rrrrr11223444332233444421r..',
      '..................RR..............................................rr.......rrrrrrrrrrrrr12233454332224444441r..',
      '...................RR............................................22........11rrr222rrrr1111335554422244444422..',
      '.................................................................2.........11111222rrrr111113rr541114444444213.',
      '..........................................................................2255rrrrrrrr211111111111111444444413.',
      '......................................................................r..r25555rrrrrr2222111111111212444444413.',
      '...................................................................rrrrrrrr55RRrrrrrr222221131111122244444441..',
      '.................................................................rrrrr2rrrrrrRrrr44222rr2211332112212r3444441..',
      '................................................................rrr3r2232rrrrr4rr432rrrrr223322122313r334444...',
      '..........555555555............................................rrr33..232rrrrr4rr33rrrrrrr333222223332214444...',
      '......455553555........444.............................................44rrrrr44433RRrr222232222233442211554...',
      '...344432523222.3.....2443344...............................22.........4422rrrrr4rRRrr1122332222233444222r4....',
      '..3334432222222232...2223333333.............................22.........11442111rrrrrr11112233222233445522r4....',
      '...3r33442222222222222223333333333.........................2224.......1111r2rrrrrrrrr112244532222224445222r....',
      '...3r334423322rr22rr2222222223333333......44..44444444433rr2444444...111RRrRrrrrrrr11112334522332224442222r....',
      '..4rr3333232211r222r2222222222553333......333...11.....222334444rrrr331RRRRRRrrrr3212211115533222144442222rr...',
      '..44443332222444444444444433555555532.....33............2233rrrrrrrr33rRRRRRRrrrr32222111112211111444442232r...',
      '.333344333334444444444445555533355332.....32.....33.....22rrrr2222222rrrrRrrrrr2222332111111111212444433332r...',
      '..433444333334444444444444433333333322....42.....332....22rr222222222rrrrRrrrrr2223332213321112222r44433343r...',
      '..43344433333344553444441133333222332233.242.....222....22rr222222222rrrrrrrrrr2rrr332223221112222rrrrr3343r...',
      '..333344433455445533334412233222222222222211.....2223..222rr22221233rrrrrrrrrrRRrr223322322112222222rrrr333r...',
      '...333444444445555333333322222222222222223r12...32233332222222221333rrrrrrrrrrRrr22233322222222444222rrrr333...',
      '.........554444433333333332222222222222223r2222232222222222332223333rrr1112rrrrrr112322222222225544222rr55334..',
      '.......445444442223333333322222222223222233222rr22222rrr2222122223RRrrr5522RRrrr1112222222222223311332rr4444445',
      '.....454554444222233322333222233112r32222332112r22222rr222221222rRRR55R55rrrrrr22223224322222222222333rrr33344.',
      '....5445554442233232222333222333112rr1122333332333333rr22222r55rrrRRR5R5rrrr2211112334433222222222223rrrrr.....',
      '...544444543322332323223333r2332122rr2233333333344333222555rr41rrrrRR555rrr222222111344333211111332rrrrrr......',
      '...444445554422232223223221r2222222r2223332233334443322555544411rrrrrr4rr442112221111222111113rrrrrrrrrrr......',
      '..544444444333222222332222112222222222233222233344433r5553344111rrrr444r4411113321122211111113rrrrrrrrrrrr.....',
      '..5544444445555422112331121122222222222335222334444rrr43113341rrrrrr44444rrrr332222221112111222rrrrr22rrrrr....',
      '.3311444444rrr54554422r111112r21155442445555333444rrrr431155rrrr2rrrr4rrrrrrr2r33222212222222222rr22222rrrr12..',
      '.11155544444455455444rrrr4444r55555444444544335442211r4111rrrrRr22111rrrrrrr12r3222221222223332222222222rr112..',
      '.122244444454444222444444433444555144544444435552233332111rr55Rrrrr11rrrr222122222222222223333321rr22222331122.',
      '..232111155554442254444444445555511555455544r5442111422221rr555rrrrrrrr222111322222222222rrrr11111r222113311112',
      '..233111244444114255444425555555111555455221r3332211422231rrr55rrrrrrr2211222323322223322rrrr11331rr32113331145',
      '.223321124441111444443322554443311445522221143333333344431rrr5rr4rrrrrr222111134332223112r32213322r333111114345',
      '.23332212244111144442111333444311144442222114333333344333rrrr5r44rrrrr2221111134332211111232212222223344555433.',
      '.133322222332213344222113333422221444433222143333333322rrrrrr5rrrrr22rrr322111111111111122221111111135555444454',
      '.1333222233322133442223114334222211333333222rrr3333322rrrrrrrrrrrrr2rrr2322222111111221111124455555533344444455',
      '22233222333332134443223144444422221333333332rrrr33322rrrrrrrrrrrrrrrrr22332222211111121444125554444444r4444433.',
      'r22322213332221444333222444444432244444332122r3322332rrrrrr111222rrr2211322222221115555455555355444554r21111...',
      '.222222133332211443333224444444312243333221r22333r332rrrrrrr221122rr211222222112335554444555532222222442211....',
      '.222rrr12333221144322322223444411r223333331rr22RRr322rrrrrrr333322r2222222222555555355333354442122222444411....',
      '.2rrrrr22233rr1224322322r23rrrrrrrr2333r331rrrRR221222rrr3rr333rr221111144555545555331133344444122222444331....',
      '..rrrr2222rrrr1222rrrrr2rrrrrrrr33rrrrrr221rrrrr2212r22rr33322rr22222211455444445553311133444444222224445411...',
      '..r2rr222rrrr221rrrrrr22rrrRRrrr113rrrrr221rrRr2222rrr22rr3222r22222224444444444555522111114445522222444541....',
      '...2..22Rr222221rrrr22222rRrrr22113rrr22222rrRr222323r22rr3222322222255555444444r5555511111444444122244441122..',
      '.......2Rr22222rrr2222222rRr2222222rrr223322Rr22223233222223333222245555554443rrrr544312111144332121114411122..',
      '.......rrr22222rrr1123332rrr1122222rr2223322Rr22222232222211222222445555555333rrrrr43312111r44442121111311112..',
      '.......rrr..222rr21211222Rr21122223rr2211222rr222211222333211111224333222253224rrrrr431244rrr44412222113311333.',
      '.......rr....2Rr323211111R222211113rr2222112R33..........2212222255344422222224rRRrr43122rrrr33311222rr3311rrrr',
      '..............R3323311133R222211113R33333111R3............212222r54444422244112rrrrrr3122rrrrr33112rrrr3312rrrr',
      '..............r3222211333R222221112R32332113r3............222225r4444441114412222rrrrr221111rrr2212rrrrr212233r',
      '..............r2222221122R322221122332232113r22...........22222554222rr22rrr332222rrr2231111rrr221122rrr222111r',
      '..............r222222222233222211123r2222211222...........111rr552212rr222222222222rrr2322211rrr221222rrr121113',
      '..............2222332222233333332222r3333222222............11rr322213322222222222223rr2222221rrr1222222rr12221.',
      '.............442222233333333223332222333333322.............11rr332223223322222222223rr22211212rr1222222rr2222..',
      '............4444422444434333223333443333333322............rrrrr3332231332222222222222r222222222r22222222r2222..',
      '..........4444444224444344445555554444554445554...........rr4443311111111222222222222r222222322r22222332r22....',
      '..............33...2243344555555555555555555544...........555555555444455555555555555r222222332r22222222r2.....',
      '..............................333..3..33453555............55555555555555554444333..22332345432222224...33......',
    ],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ==== centiv5 完 ====
  // ==== tenguv5 ====
  // ---------- 領主體・緋面風翁 v6（2026-10-16 作者的第三版概念圖：張開一對巨大黑翅膀的天狗老人：紅臉、長鼻子、白色長髮，黑色金紋的長袍、紅色流蘇，手拿黑紅羽扇，紅色的鳥爪）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～6 黑羽和長袍（暗→亮）、7 8 9 白髮和衣領、r R S 紅臉紅爪紅流蘇、y Y 金紋。
  HD.windelder = hand({ w: 144, h: 101, pad: 4, breath: 45, eyes: 'E', spikeOn: '89',
    pal: () => ({"1":"#0B0A0A","2":"#151313","3":"#201C1B","4":"#2D2826","5":"#3D3633","6":"#534A45","7":"#B4AEA4","8":"#D2CCC0","9":"#ECE6DA","k":"#0B0C10","K":"#16181F","l":"#22252F","L":"#313542","m":"#474C5C","q":"#030304","r":"#5A1414","R":"#962A26","S":"#C85048","y":"#7A6232","Y":"#B89A52","z":"#0A0808","E":"#FFD24A"}),
    rows: [
      '.....................................9..................................................................................................',
      '....................................llK.................................................................................................',
      '...................................LLLKk................8777............................................................................',
      '.................................LLmmLkkm...........888887777...........................................................................',
      '...............................mmmmmmLkkm...........77888SRR4...........................................................................',
      '..............................mmmmmmLLkkm..........87788RSRR4...........................................................................',
      '............................llmmLLLmmLkkm..........8877RR99rr...........................................................................',
      '...........................mmmmmmmmmKKkkm..........777RRRRErr...........................................................................',
      '.........................llmmmmmmLmlKkkkk..........777RRRRRRr................llkkK......................................................',
      '........................lmmmKKmmlLmllkkkkk.........7mqRRRRRRR...............llkkkKKK....................................................',
      '......................mllmLLLLmmlLmlKkkkkLL.......mmqRRrRR66RR..............llKKklKKK...................................................',
      '......................mllmLLmLmmLLmlKkkkkkkkl9999KKlqRRrrR6................llKkKKlKKKk..................................................',
      '.....................llllmmmmmmmLmmkkkkkkkllllKK9LLlqq66r26................LKKkKKKKKkkkk................................................',
      '....................lllLmmmLLmmLmmmkkkkkklllqqqqqqqq45566266..............lLKKKKKKKKlllkk...............................................',
      '...................LLLLLmmmLmmmLLllkqqqqqqqq55442444455466666.............llKKKKKKKKkkllkk..............................................',
      '.................mmlLLLmmlLLmmmLLllq113111115544246665544666611..........lllKKKKKKKKKkKKkKkk............................................',
      '.................mlllLmmmlLLLmmLLmq111333114554333666555446663333......33qKlKKKKKKKKKKKKkKKkkk..........................................',
      '.................mKKlllLLmLKKLLqqq111222336411133344115544466634333...333qllKKKKKKKkKKKlkkkKkkkk........................................',
      '.................KKKlKKLmmLLLLq456112233336555133344115555446634453444443qlKKKKKKKKkkKKllkkKKKKK77......................................',
      '................KKKKLLLmmmLmLqq456112222566656131211115554443644454443333qKKKKKKKKKKKKKKKkkKKKKKKK......................................',
      '...............KlllLLLLmmmmmq5555511444456455644122rr15554443343444443343qKllKKKKlKkkKKKKKkKlkkKKKK.....................................',
      '...............KlLLLLLLmmmmq55466113334466445543122rrr5444343433334443343qKKKKllKlKKKKKKKKKKllkkkkk88...................................',
      '..............KKllLLLLKKmmq5554611133346666434433133rr5444334444332211333qllKKlllKKKKKKKKlKlllllKKkkk...................................',
      '...........mmKKKllLKKLLlLmq5554611114466666634433122rr4444343344314411443qKlllKKlKKlKKKKKllllllllKKKmm..................................',
      '...........mmKlKKKKllLLlLmq5555111114665666655412123rr3334344455314411113qKKlllKKKKlKKKKKlllllllllKKKm..................................',
      '............mmlllLLllLLlLLq5111111116655633355412113333336333411314411313qKllllllllllKKKKKlllllllllKKmm.................................',
      '............mllllLLLLLllLLq11151111166566661335111111144262556663133r33333qlllKKlllllKKKKKlllKKlllllKKmm................................',
      '............llLllLLLLLlLLLq11551116644556661335511114442222433553113r33333qlKKKKllKlllKKKKKKKKKKKKKllKKmm...............................',
      '............llLlLLLLLlLLmLq14551116655511165111511133112224433553313133353qllLKKKlKllKKKKKlKKKKlKKKKllKKK...............................',
      '...........lllllLLLLLlLLmkq54441116666111665111551111145rr4333666313115552qLlLLLLmmKlKKKKKlKlKKlllKKKKKKKk..............................',
      '..........lllllLLLLLlLLLkkq55511156611111665441151111345114331111155554442qKlllKKlLKKKKKlKlKllKlllKKKKKKKkk.............................',
      '.........KKllllLLLLLlLLkkkq55521656111332466441111111341114331331443344444qllllKllLLmmmllKllKlKKllllKKKKKkkk............................',
      '........lKKlllllLLLLLLkKKLq45526611111122466445111111663365336644444444344qllllllllllllKKlllKllKlllllKllKKKKK...........................',
      '.......llKlllllLLlllLLkLKLq45526111111122556645111115533365334434444443344qllllllllllllLLlllKlllKllllllllKKKKmm.........................',
      '.......llKlllllLLlkllLLLKLq45333116111111226644112215113365533434455544554qLLLlllllllllKllllllllKllllllllKKKKmm.........................',
      '.......llllllllLLkkllLLLKLq55311116211331126664111115133365334455555555555qLLLllllLLlllKlllllllllllllllllKKKKmm.........................',
      '.......llllllllLkkKKllLlKLq55113316226611111564441113343544444444444455555qKLLLLLLllllllKKllllllllKlllllllKKKKm.........................',
      '.......llllllLllkKKLlLLllLq54113326346441111554443333443544433433444333333qLLLlqlllllllllKKLLLllllKKlllllllKKKk.........................',
      '......llllllLLlkkKKLlLLklLq54111226343411111155444433334464666644444344355qqqLqrqlllKKLLlKKKKLmllllKlllllllKKKkK........................',
      '......llklllLLkkkLlLlLlkLLq54112236113411111336664443334466666646644444334433qrrqlllllllKKKKKKmllllKKlllllllKKKKK.......................',
      '......lkkllllkkkLLlLlLlkLlq5111443644422211115666rrr3335566665556664444434333rrrqLllllllllKKKlllllllllllllllKKKKKK......................',
      '.....kkkkllllkkkLlllLLKKLlq4111rr4644322666665443rrr33354466655666664444443rrr444qqqqqqqllKKKKlllllllllllllllKKKKK......................',
      '...llkkKllklkklLLllllLKlLlq4111114553366666662333rrrr6655556665666663333333333rrr3333333qqqqqKlllllllllKlllllKkKKKk.....................',
      '...lkkKKllklkllLLlllllKlLlq111111555333343333233rrrrr1222555445665544444334333rrr334333344444qqLlllllllKKlllllkkKKkk....................',
      '...kkkkllkkllllLLllLlkllllq11111145423224311112444r3311445555544355444333442rrrrr43433344421111qllllllllKKllllKKKKKKK...................',
      '..kkkkKkkklKlllLlllLkkllllq112111444222222111122111111111166535535534344333222r44443311122233344qllKllllllllllKKKKKKKK..................',
      '.kklllKkkklKlllLklLLkkllllq11233344423222111111211111111111663444223333333433rrrrr433333333333244qlKlllllllKlllKKKKKKKK.................',
      'kkkkllKkKlllllllkLLkkllllq1112533443332222111111111111111111111423434443334rrrrrrr3333333333322244qlKlKllllKKKlKKKKKKKKK................',
      'kkkklkkKKlKlllllkLLkkLKlLq111255343333122211114311441112233221112344333333333rrrr44333332222222334qlKlKlllllKKKKKKKKKKKKK...............',
      '...klkkKllKllllkkLkkkLKLLq1111154333311rr22444431rr44433255331112224443333333rrr333334434444333333qllllKllllKKllKKKKKKKKKK..............',
      '....kkKKllKllllkkKklLLKLLq1111154344111rr3333543344444333565511113341333333rrrrr3333111133223344334qlllKlllllKKlKKllKKKKKKK.............',
      '....kkKKlKlllllkkKKlLLkLkq1111154341111rr3333541144444343566511111441133322rr4443333333332223444434qllllllllllKlKKKlKKKKKKKK............',
      '....kKKKlKllllkkllKlLLkkq21211144411113rr313551116445434426652313133311112rr4433333333333332344444qllllllllllllllKKllKKKKKKKK...........',
      '...kkKKKKKllllkkllllLLkkq22211114111223rr314441116455444526662333133314112214433223333333322344444qlllllllllllllllKKllKKKK.KKK..........',
      '..kkkKlKkKKlllkKlllLlkkkq2221211111222rrr33441116645644452466223445531451241113333322233333234444qlLLllllllllllllllKKlllk...KKK.........',
      '..kkKKlKkKKllkkKlllLlkkkq2221212112222rrr35541336666644441446223r44451451241114433112211113344554qllllllLlllllllllllllllk....KKKK.......',
      '..kkKKlkkKllkkkllKlLlkkq22322212112222rrr35511446666655441146624r4465112224121111..1121155545545qlLlllllLlllllllllllllLll......KKK......',
      '.kkkKlkkKlllkkKllKlllkkq22322222122224rrrr4411444445564441115524r416611442422111....555555545545qlLlllLllLllllllllllllLlll.......KK.....',
      '.kkkKlkkKllkkkKlKKlllkKq23322232222244rrr3411335555556444111552rr411611442422111....55555554454qLlLLLlLllLlllllllllllllllll.......kk....',
      '.kkkKkkkKllkkkllKlllkkKq23322233332444rrr3111435555566462211533rrr21111442112211....55555555455qLLLLLlLLllLlllllllllllllllll.......kk...',
      '.mmkKkmkllkkkkllKlllkKq23332223333255rrrr3111445551111161211544rrr22211444r12224.....555555555qlLLLLLLLLLlLllllllllllllllmlll.......kk..',
      '..kkkkmkllkkkklKllllkKq23362233333445rrrr4114445555411111311544r3r24211464r52224.....555555qqqLLLLLLLLLLLLlllLLlllllllLLlmmllll......kk.',
      '..kkkmmklkkKkllKllllKKq33366335533444rrrr4114355555444411311444r3r34311464r52224.....55qqqqLLLLLLLLLLLLlLLLllLllmllllllLllmmllll........',
      '..kkk9kkkkkKkKlKlllKKqq22266344544444rrrrr124355555444512311145rrr34311311445144......5qLLLLLLmLLLLLLLLlLlmllLllmllllllLLlllllll........',
      '..kkk9kkkkKKkKKKllKKq6622263345545513rrrrr224455555444512211115rrr44411311115111......qmLLLlLLmLLLLLLLLLLlmmlllllmlllLllLLllllllK.......',
      '.kkkkmkkkKKKkKKKlKKKq444666336644511322211244455566645513211112rrr54441332335111q.......LLLlLLmmLLmLLLLLLlmmlllLlmmllLLllLlllllKKK......',
      '.kkkkmkkkKKKKKKKlKmmq224334466655111112212244445666655313311112rrr53451132322111ql.......LLmLLmmlLmLLLLLLLLmmllLLlmllLLLLLLllllKKKK.....',
      '.kkk9kkKKKKkKKKllKmmq114334665655111111112233666644666314311313rrr53451143311111qLL........mLllllLmmLLLLLLllllllLlllllLLmmllllll..KK....',
      '.k..9kkKKKKkKKKlKKKK9944336655551111111122226655544466224311313rrrr3451143441112qqLL........llllllmmLLLLLLlll.llLLllllLLlmmllll....KK...',
      '....9kKKKKKKKKKlKK77744433666551121111114444665555546622431131rrrrr344614344522222qLL.......llllllmmmlmLLLll...lLLlllllLllmmlll.........',
      '....9kKKKKKKKKKKK997744446655651121111135335555566666623431242rr33344463324452422qLLL........l...llmmlmmlLll...llLLllllllllmmlll........',
      '....kkKKKKkKKKKkk997q444665566112111113354356556655666234212422213224333224554422qKLLL............llmmmmlLLl....llLllllllllmmmlll.......',
      '....kKKKKKkKKKKkk89Lq446664412122111133364256666544664334212422113314345123554352qKKLLL...........l...mmmLLl.....llLllllllllm88lll......',
      '....kKKKkKkKkKKk88LLq111111112231111133662256666544664344213423113314345133545355qKKKLLLL...............LLLLl.....lLLllllllLl888lll.....',
      '....kkKKkKkKkKK888LLq111112222331111333665556666664464445213523222335445332545445qKKKLLLLm...............LLLl......LLlll..lLll8..lll....',
      '....kkkkkKkKkKk888kkq222112223311211336655666666666654445213522332r45445522544645qKKllllmm................LLl.......LLl....LLll...lKK...',
      '....kkkkkKKKkKk88kkkq331122333312213346655511111666554445213522344r455456225556456qKlllKKll................LLl.......LL.....LLl....KKK..',
      '....kkkkKKKKKkkk..klq32112233r1121144465551111111166622453135423444444456323455446qKllLKKKkk...............LLl.......LLL.....lll.....KK.',
      '......kkKKKkKkk....lq3211rr3rr1221144466111111111116622553135423443411111323455644qqllLLllKk................ll........LLl.....lll.....KK',
      '.......kkmKkKk.....kq222rrr3rr122144441111112233111223355314442343331132233354464444qllLLlKk.................ll........Lll.....lll......',
      '.......kkmkkKk.....kq322rrrrr223224441111111115112222445531444334332333223335656655qllllllK..................ll.........ll..............',
      '.......kkkkkK......kq3323222113322444221221111511111244663144444r332111222334656611qllllllK...................ll........................',
      '.......kkkkkk.......33323222113225544211111442222111111113144444r331111222534611111qlllmm...............................................',
      '.......kkkkkk.......33333333133225511111111442224111111113144454r311121333533112211qllll................................................',
      '.......kkkLkk.......3333333314332111111122133222411111111314445442211214444442222111qll.................................................',
      '..........Lkk.......2333333344342111111122113332111111233415445112211334221122222222qLl.................................................',
      '...........kk......q2334333644441122121112443232121111233435445112221332222112421112qLLL................................................',
      '...........kk......q33443336444412222211124432312221222111333113223213312224324211..LLLLL...............................................',
      '...........k......q33443333661111122221224443221232222212211111322332311124433311....LLLL...............................................',
      '...........k......Kq444343....11122331122454322133224222321111133333221111143333......LLLL..............................................',
      '.................Klq44444......1133331162253322132244332321...1113333...1614333..........ll.............................................',
      '................lKlLq4444.......1133311622rrr111..44432232.......333.....613332.........................................................',
      '................llLLq4444..........33111rrrrr11....44222..................133322........................................................',
      '...............lllLLlq33............1111rRrrr11...........................133444........................................................',
      '...............KKllllq33............111rrRrrR66..........................11344444.......................................................',
      '..............LKKllll..............334555555R666.......................3445554445444433333..............................................',
      '.............lL.................5123344323455351......................434454444554345334qqKl7...........................................'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ==== tenguv5 完 ====
  // ==== treev5 ====
  // ---------- 領主體・萬面樹 v8（2026-10-17 作者的第五版萬面樹：巨大的老樹，整個樹幹就是一張憤怒的大臉（濃眉、發橘光的眼睛、獠牙），旁邊四張小臉；左半邊茂密的黃綠色樹冠、右半邊是枯枝，盤根和青苔鋪滿地面）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～7 樹皮和臉（暗→亮）、g G h 樹冠（暗→亮）、z E 臉上發黃光的眼睛。
  HD.faceforest = hand({ w: 143, h: 96, pad: 4, breath: 30, eyes: 'E', spikeOn: 'h',
    pal: () => ({"1":"#16100C","2":"#261C14","3":"#3A2C20","4":"#52402E","5":"#6E5840","6":"#8C7456","7":"#AE9672","g":"#262810","G":"#3E4018","h":"#5C5C26","E":"#FFC040","z":"#080606"}),
    rows: [
      '.............................................................gGGGGhGGhG................................................................',
      '.........................................................hgGggGgGGhhhhhGGgg............................................................',
      '......................................................1gGhGGhhGghhGhgggggGGGGG.........................................................',
      '....................................................g11ggggGhhhhhGGGgggGGhGGggGG.......................................................',
      '...................................................ggggggggGggGhhGhhgGGGGhhggggGG......................................................',
      '......................................hh.........6GgGGgGGhGGggGGhhhGGggGGhhhGGgGGGh....................................................',
      '.....................................7GGGG......GGgggggggggGggGhhGhhgGGGGhhggggGGGGh..hh...............................................',
      '................................hhhh77GGGGG....gggggg11ggggGhhhhhGGGgggGGhGGggGGGGGhhhGGG.................6............................',
      '...............................GGGGGGGggGGGGGGGgggggg11gGhGGhhGghhGhgggggGGGGGGGGGGGGGGGGG...........66..56............................',
      '...............................GGGGGGGGGgGGGGGGGgggggGggGhgGggGgGGhhhhhGGggGGGGGGGgggGGGGG...........22235.............................',
      '..............................GGGGggGGGGgggGGGGGgggggGGGGgggggGGGGhGGhGhhgggGGGGGGGggggGGGG..........2223..............................',
      '............................GGGgGggggGGGGgGGGGGGggggggGGggggggGGgghhGGGGG122GGGGGgGGGGGGGGGGhh.......223...............................',
      '............................ggggg11ggGgggGGggGGGGg11gGGGGGGGggGggggGGGhhG122ggGgGgGGhhGGGGGGGG......2333...............................',
      '.............................7Gggggg11gGGGGgggggGgGGGGGGGGGGggggg1ggGgGhhhh11ggg1ggGGGGGGGGGGGG....223335..............................',
      '.............................7GgGGggggGGGGGGgg2111GGGgGggGGggg1111gghgGGhhhhh11g11gggGGGGGGgghhh...213555555...........................',
      '...................hhhhh....GGGGggGGGGGGGGGGGg2111GGgggggGGG1111gGGGhhhGGhGhhG2221ggGGGGGGGgGGGhh.111355555.......3....................',
      '...................GGhGhhhhGgggggggGGGGGGggGgg232GGGggggGGGGG11ggGGGGGGhhGGGGG2221gggGGggGggGGGGGG111252255.......3....................',
      '..................GGGgGGhGGGGgg11gGGgGggG11112232gGgg11gGGG1111gGGgGGGGGGhhGGG2221ggggG1ggggggGGGG1112355........552...................',
      '.................GGGgggGGGGGG3311GGgg11g22211gggggGgg211GGGggggGGgggGGGGgghhGG2221111111g2gggggGG2111335.........332221111.............',
      '................GGGGgggggGGGGGhh1ggg1111112GGGGGgggg2211GggggggGgg1gGGG11gGGGGGGG11gg111g2ggggg332121335........33333111...............',
      '...........hGGGhGGGGggggGGGhGGhhgggggGGGgggGGGGGGg122221112g2332211ggGG1gggGGGhGGG11g222ggggggg666122444.......333.....................',
      '.........hhhGGhhhGGGggGGGhhhhhhggggggGGGGgggGggGgg1221111121233322111G11gggGGGhGGGG23322ggggggg6661334422......34......................',
      '.........GGgGggGGggGgGGGGGhhGGhGGgggGGgGGGgggggg244221121121233222111111g222GGGGhhG2222222322226222334422.....334......................',
      '.........gggGGgggGGgggggGGGGGggGGGGGggggGGGGg11g2445551221212222222112233332ggGGGGGG222222322255222444422....3444......................',
      '..........gg44gggggGGGGGgg1gggGGGhhhGGGggGGGG1117744GG12gg212233222112233332ggGggGGGG322223hh1554G44433222..33444......................',
      '...........77ggggg11GGGGgg11GGGGGGhhGGGG11gGGgg477ggGgggggg112223321223333GGgGGGgGGG33555GGhh1334GG43332522233322......................',
      '...........7ggggg111GGggg1GGGGGGGGhhGGGGG1gGGGG44ggGgggggggg1112222122345544ggGGGGGGGG555GGGG1334GGGGGGG5322ggGGG......................',
      '...........GgggggggGGggg11ggGGGGGGG11ggGG11114444ggGgggggggg222222222244554GGGGGGGhhGGGGgGGGGGG32GGGGGGG232221GGGG.......55............',
      '..........GGgggg5GGGGGg11GGGGGGG1111222332242444554GgggggGgggg22211222443344GggGGGGGGgGggGGGG33321GGG222222111GGGGG......55............',
      '..........G555555GGGggg1GGGgGGG111122ggGG2242433444GgggGGGGGggg22122444433555gggGGGGGgGGggGG443321GGG22111g111G4hhh.......5............',
      '.........GG555GGggGg11g1GGGgggG122222211G3332433444G3ggGGGGGgggg2122432GGGG55G211GGGGgggggg3433311gGG22111g....4hhh.......5............',
      '.....GGGGGGGGGGGGGggggggGGGgg1122222211121112232434331gGggGGGggg2232332GGGG55G222GGGGggg2g23332111gGG22611................5............',
      '....GGGGGGGGGGGGgGGGGgggGGgg11222222212222222222233321ggggggGGgg2232GG2GGGG55GGG22GGGggg22233222111g3226611...............55...........',
      '..GGGGGGggGGGGgggGGgGG11Ggg22122gg2277211112222222222ggggggggGggg223GG2GG55555GG22GGGg3122222211111g3326GGhh..............55443........',
      '..GggggggGGGGggggggggg33ggg221gg43337222g11111122222ggggggg22233g2233G3hh555555522333G3122212211ggggg32GGGGG7.............344433233....',
      '.GgggggggGGGgggGGGg22333ggg211gg43332222gg1112222111ggg222g222233333333h4465555722334GG122111111gg2GGGGGGGGG77hh..........344433233....',
      'GGggggggGGGgggGGggg222111g22212g333ggggg222211221111ggg22222222333333335466555571133444221121111gG2ggGGGGGGGGGGhh........322443........',
      'GG55Ggggggg11gGg111111gg22gg222ggggggg332222111221111g33233333233453g335445555111122444222221122gG21ggGGGGGGGGgghh......333211.........',
      '.G55GgGgggg222gg1ggG11GGGGgg2222gggggg3322221gg222123331111333344453g255566555111222444222221112gg21ggggggGGhGGGhh3....3344111.........',
      '..GGGGGgg222gggg1GgGGGGhhGgg2222gggggg32211ggggg11123321111122445443325556651111122444221222gg11gg222ggggggGhGG4443355333111133........',
      '.GGGGGGg2222g22ggGhhhhhhhGGG772333gg2222111GGGgggg122221122223345443335555651111124422211122444153322211ggggGGGG4334432222111333.......',
      'GGGGggggggg222222GGhhhhghGGG222333332221gGGGGGGggg1122211223333222433355555zzz1132622421211244455431222222g1GGGG3333432222.....3.......',
      'Ggggggggggg33GGGGGGGggggGGggGGGG34422221gGGGGgggggg122211121445112333311511zEz223664442124333..55431ggg22111gGG2222221111..............',
      'Ggggggg444233GhhGGGggggggGGhGGGGG332211gggGGG11gg22222311111145442312311111zzz155644422124333...5g21ggg22211ggg2111222115..............',
      'Ggg7ggg44422GGggGGgggghGGhhhGhGG2222222ggGgggg344321123211111zzz42112331111123555544422232332...5g222661122ggg33211222..5..............',
      'GG77gg...22GGGGggggGhhhGGGGgGhGgg2222gGGGGgg13455432113221111zEz111144543333235555343322322g22...g2222211222233321112..................',
      'GG..g.....GGGGGggGGGGGGGGGGggGGGG2211gGGGgg134555543122221111zzz11124554333355533334343ggggg244..g222221.22222444111...................',
      '.........GGGGGGGGGGgGggGGGGGggGGG221111GGgg23115511311223222111112224554554442232111443ggGGGGGG....2223...4222224444G...hh.............',
      '........GGGGGGGGGGggggGGGgGGGgggG221111Ggggg3zE55Ez3112233322222222247745444443323111gggGGGGGGG.....113...422223444GGGGGGGG............',
      '.......GGgggGgggGggg1GGGGggGGg2222211111gggg34551543112222222221122337742266443333gg1gggg444GGG.....15....42222344GGgggGGGGGhh.........',
      '.....GGGGGGgGGggggg11G1GG1gGGg222g22211122gg341111431gg333322221221116633556433333g3333gg3443GG......5....11552133GGGgggGGGGGG.........',
      '....GggggGGGGGGgggg1111Gg1gGGggggg222222222223155131gg3333311322221112233556653332233ggg3455432...........gg552122224GG11GG1GGG........',
      '...GGGggGgGGGGgGGggg222ggg22222gG2222222222222333321gg3231111323222212244555554444433gg345555432..........ggg..2gg224GG11gg1g14........',
      '...ggGGGGgGgGGggGgg222211g232222G1112222222222g1221gg22231122223332233444551164224443gg311551132GGhh.......g....gg121331ggggg144.......',
      '...GgGGGggGgGGggG2222211123322222111122G33222gg21113323311113233322215531441161114543gg3zE55Ez3gGggG.......g....gg12133GGGggg1441......',
      '..GGGGGg1gg1gGggG222221112222222211112GG33222gg21113323111113233322211131411111121543GG34551543gGggG.......44...gg11111GGG4444111......',
      '.GGggGgg1g11ggggGggGG222222222333111gggggggggggg11122221111132322211111111141112215533G34111143gggggg...........gg11151G3344441........',
      'GGgggggggg122g22gggg221225222223333ggggggggggg11ggggg222111223211111111122141111211553GG3155131gggggg55.........5221151GG144hh.........',
      '6ggGGgggggg2g22gggg2221125222223333gggggggggg1gGgGgggg2211122321111333315544111111155334433331113221136.........522.111GG11GGG.........',
      '6ggGGGggggggg2gggggg22111....222333ggggggg11g1gGGGGggg2111223111134433315545511161115334522221133221136..........G...11GG12222.........',
      'GGGGGGggggggggggg55G2211......22222g33gg22111gGGGGGGgG2211223122334431122244555661115GGG542231..3221124..........G...11GG122222........',
      '.GG44gggggggggggg55G2222......11122g32221211ggGGgGG33G1112222333333211122234334655311GGGG4223....22..242............111GG..2125........',
      '..444ggggggggG43332g22244......1122222221111gggGgGG4333g11123332332222222233334333311GG5GG222....4.....244..........11......1254.......',
      '..gggggggggg5G43322g2gg44.......1g111g22gg11gg223334423g11122222212322324433344433312GG5GGGGGG...4......44..........4........2244......',
      '..gggggggggg5522222gggggg.......gg111gGGG111gg344332223gg1222223212323335533336633312GGGGGGGGGG.....................4.........1444.....',
      '..ggggggg44gG5..222ggGgggg......gg111gGG..1113455432223gg111233312223443453331655531GGGGGGGGGGG...............................14443....',
      '..GGGGgg344gG....32ggGggg.......5g111GG....33455554322g4gg1122311222345343GGG11553GGGGGGG4444GGG..............................15533....',
      '....Gggg33.......3444Gggg.......5g111G.....33115511313g4ggg222211333355533G3GG1113GGGG3234434GGGG.............................1255.....',
      '.....gggg........144..ggg.......GGG1......223zE55Ez313gGGg2222111333556641133GG111gGG3334554333GG33ggghh.....................1125......',
      '.....gggg........11.....44.......55....Ggg223455154313GGGGgg111112435564412G3hhhggggGG345555433GG33ggggGG....................1115......',
      '.....gg..........11..............5.....Ggg2g341111431GGGGGGg1gg222434554422GGGhhhggg2G311551133Gg333g2GGGG....................111......',
      '.................11..............5.....ggggg231551311GGGGGGGgg2332234554421ghhGGhhgg2G3zE55Ez33gg223g2133GG....................12......',
      '..................1...................gggggg22333311GGGGGGGgg12332333323411ggGGGhGhhgg345515431332222212g3G.....................2......',
      '.....................................gggggggggg2ggGGGhhhh44221gg332222234ggGGGGGGGhGg23411114314GG111112g3G.....................44.....',
      '.....................................gggggggggggGGGGhhhhhhGGG1222322222222gGhhGggGGGG23315513314GGG11112gGGG....................4......',
      '....................................gg11gGGggGGGGGGgGGGhhGGGG221222222332GGgGhhgg2GGGGG1333343144GG41112222GG...................3......',
      '..................................ggg11gggggGGGGGGggGGG42GGGG111112232222gggGGGGg2GGGGGhG11243gg44444441112gg22.................3......',
      '..................................2211GGGggGGGGGGgggG5542122GG111122342221ggGGGGgg22255hG11213gg44444441112442.........................',
      '........................g333.....22211ggggGGG5543gggGhh61122GG1gg124442221gggGGGgg22233555111gggGG344442222223.........................',
      '.......................1g333212222221GGgggGGG554312GGhh61112331441133332211GGGGGg12223355561ggggGG3444233222G33........................',
      '......................111111212gggGG1331ggG5G544112GGG461111222GGG4611222ggGG442g11113355566ggggG55gGG233222G332G......................',
      '....................2211111111GG3GGGgg11gGG525521122GG4hh1111122GG4hh1222GG5G42211gg111554465GG1111ggGG11112G332GG.....G...............',
      '....................22222233GGGG33ggg1111GGG246211123GG5511111123GG551344455G222GGGGg1GG53355GGGGGGggG4411G2gggg1334422GGG.............',
      '...................222222233GGG3332221111GG11466gg113225555GG11132255534415511GGGGGGgGG553144222G44G5GGGGGG222211133222233.............',
      '..........44333222322222223332221111111662111266gggg1122555555gg1122554441551GGGGGgg44GG31115522G44G5GGGGGGGGGG441122225332............',
      '.........2221122223332gg244333gggggg111h221112222GGG1112555225GG11125544ggggGGGG115542GG3113322222425GGGGgggGGG4411222251122...........',
      '........221111113333322554444Ggggghh111h3gGG112244GGGGgg11G222GGGGgg1144GGGGGGgg115112GG11112222222221GGhhggGGGGGGG2222g1112GG33222....',
      '......2222111333333333555gg44GGG662111113gGGGGG2443GGGgG11GGG23GGGgG11644GGGGGGg441111GGGGG11122hhgg111G443GGG33GGGGGGGg1111GG222222...',
      '..21122222221333333333111GG4GGGGGG21111ggggGGGGGGG33GGGGGGGGG233GGGGGG644GGGGGGG441ggg2GGGGGgg11111GG11GG333GGG11GGGGGGGGGGGGgg33322244',
      '2221112222GGGGG3GG4422GGGGGGGGGGGGGGGGGggggGGGGGGG33GG55hh555233GG55hh66hhGGGGGGGGGGGG2G44GGGGG6611G551GGGGGGG4444GGG44GGGGGG5533333333',
      '.....66555555554444444444444GGG45544G4444GGG55454455555555555555555555566666655444444GGG44GGG5544GGGGGG55544GG44455554444444555555.....',
      '.............................6644555555545555445555555555555555555555554455555544554445544443344455555554455566........................'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ==== treev5 完 ====
  // ==== lavav5 ====
  // ---------- 領主體・熔顎蜥 v6（2026-10-16 作者的第三版概念圖：整隻趴低的巨大岩蜥：背上一塊一塊方形的岩甲，裂縫裡透出熔岩的光，方方的長嘴裡一排黑牙、嘴縫和眼睛發光，前爪粗大）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～5 岩甲（暗→亮）、y Y W 裂縫和嘴裡的熔岩光。
  HD.lavajaw = hand({ w: 145, h: 79, pad: 4, breath: 30, eyes: 'YW', spikeOn: '45',
    pal: () => ({"1":"#0E0C0C","2":"#1C1817","3":"#2C2624","4":"#403634","5":"#584A46","y":"#8A2A0E","Y":"#E8601A","W":"#FFC060","z":"#050404"}),
    rows: [
      '.............................................................2112554444445...............................................................',
      '.............................................................111225443333344.............................................................',
      '.............................................................12112244444333111...........................................................',
      '................33...................................44......122222555544444411..........................................................',
      '...............333...................................42234..112222554544444555544........................................................',
      '...........3333333...................................22234422121314444554444454444.......................................................',
      '.........22344333...................................233334433121312155554554444444444....................................................',
      '........33333333.............................113333322443334411122211555555555445544444..................................................',
      '.....22333333333.............................12224432244444445542221112235444322355544444................................................',
      '.....2333343333..............................1222443214444444544332211113555334331122244444..............................................',
      '....3233344433...............................33333342111155444552222211115555544444422114444.............................................',
      '...33332343533..............................1133344421111555544443222111155555545455443344444............................................',
      '..233432343533........................33333311333344255544444444433113311555555555455444444444...........................................',
      '..23343344443........................2233333355533122555445344444541133115555555444444444443222..........................................',
      '..23333334444........................2233333331111122235555334455543112211155555554444444333422..........................................',
      '.223343433433.......................113333111112111112355555345555435112211555555554445443444442.........................................',
      '.233343433333...................4433213333332232143333211544444yyy44522322115555555445555544444522.......................................',
      '32333333433333..................2233244333311333343312211133444555455223221155555555555555554445533......................................',
      '323333334443334................33333222233333333333311111112233445554433112111113322111113444455533......................................',
      '3323333y44333343..........2233334432222233333333311311112212133445555433222111113355554433411111553......................................',
      '3224433yy3443433322..223322333344411222yyy333333111111111211114444553453222221115554444434444111113......................................',
      '3232433yy3344433334442333233323222222244y3333311122211111111114444353453223221115555554444444441113......................................',
      '333233333344334443334333444332223244333333322211144331111111314444354453233121115555554444444444443......................................',
      '3333243333yyy223333443222223343232233333332211114444441122113111443333332321yy211544555554445554453......................................',
      '33322433433yy223332223323333343332233333342244444444444422221111444333332221y2211554455555445544454......................................',
      '2332233444333yyyy333222233yy44332233333344455444555455442222111123355333333311221155555554433444444......................................',
      '2332323444333444y444yyy33344432222332333344444455453332222111111211533333yy333321115555555555455544......................................',
      '.3333222443334333333333333334333332222223yyy444554435533322111111115333yy444433221155555555555555554.....................................',
      '.3333232233333333333223333334332223355yyy4444yy55543343242112211111111y334444332211155555555555555543344333..............................',
      '.3333332233333333333333333333222333355y444444yyy5544444242111111112211y34445553321115555235555111144335553335............................',
      '.3333332222223333333333333222223334444444444444yy55444333222121221111122244344442111111223554444444411555333555544.......................',
      '..33333322232232232222222222222333444333224444333334333332222211111114444443334442211111445555444454555111344545444......................',
      '..3333333333233222222222222233223333333322444433333223333244111131111144544434444222111155555554555544441133444yy54......................',
      '...3333333332322222222222222332433444332234444344332113332442113311112445553343342221114555555544554444444334455y543.....................',
      '...3333343333333222222222243332444444444233333323333313355422113221222115555543342311224444555444444444444441244y553.....................',
      '....3333433333323322222222444yy5444244542222333233553yyy4422211421113111115555344231225543335555444443344455124444444..44................',
      '.....333333322323333222322344445555233542222223434445yy2442211143221311111154435411222554533355444445443334552444444344444...............',
      '......33333322323323234333333455555111144233224455545yy2112211223211111111111445221221244543331444455544444455433233344444...............',
      '.......333333332332333444444444445555111233333333454433111111112111111111112112221111122554zzzz1455455554333355322233344444..............',
      '........33333322334433345444444344455441211333234443222111111114122211111212111yyyy22133111zYWz14444445555443455322222454444.............',
      '.........3333334444444335345511344455441111112222223322211111114242221211211155yyy4233331113441122444444454444443332235544344............',
      '..........3344334334433333555113445554441111122223323222111122112423332211111554444333344111444221445545545544443221233444333............',
      '.............44334444111335551433455554441111112222232211111111121133333115111554445533341111333311555544445444451113233343444...........',
      '...............333422112114433443444444441111112223322111111111121133yyy155531224443333444111333311555554444444451113233344444...........',
      '................333222221443334433554434y1111112222221111111121121122yyy335431111555533554411115541122455333443345333222444444...........',
      '................333322224443331133554534yy31112233222211111112213311111yy224441111111133445111133411114444333444455552224444334..........',
      '...............33333122244443313333555333y3122233322111111112211331111222222331111111111555331113111224455344544445552233444344..........',
      '..............33333112233444144344445333333222331111111111111121322221222112311111122111445533111112221115555544554555333433343..........',
      '..............33333112111133144322434333234232211111111111111121123321111112233335555122y11133332211342111115555444455533333333..........',
      '.............333333321122113133322434333224333222211111111222111211322y22111122333355522yyyy33334444342112115555555555553333333..........',
      '.............333333322211112133444445333232233332211111233223311211133y22211111333323344yyyyyyyy3344332342111555555445553343333..........',
      '............333333311331221233344444533323211..3344444322331132211113yyy4421111333222244yyyyyyyyy3yy322342211112255555554444333..........',
      '...........333332231131122233333444443344211....344432322233112211122yyy112111133333334223yyyyyyyyyyy22222222332225555544433333..........',
      '..........3333333334321122233333344444344211.......4324443333112211123y31121111111333232333444yyyyyyyyy12222232223115113555543...........',
      '..........333333444432222224442244334444421.........4433332223311111333311221144333342322332241yyyyyyyy1y222222223111113311144...........',
      '.........3333224444111222224444444155444333.........3332323323333221222333211144323343332332241yyyy33yyyyy122222233311111111334..........',
      '........3343222334111112222444441113343434..........33222232233..221222221221122222224332333341yy3333yyyyy1y2222233332311111334..........',
      '.......44343323443111112223333114553223434...........332322334....23212111121122222224333333331yy33222yyyyyyy1222123323111134333.........',
      '......4443333234441111222233344345334444222...........32333344.....311122111111324222222233333yyy33222331yyyy1yy31233131111344333........',
      '......4443344334441122223333322355332444444...........332333333.......221111211324331111223344yyy322223311yyyyyy3yy311111113344333.......',
      '......44432333344332222333334423yy3324444344..........332333333333.....2112222112333333222233411y33222222244yyyyyyyy1111111332233333.....',
      '.....2242223232333322344455333335yy4333443344.........3323222311111........112211121332222233111y222222222222555yyyy1yyy134412233333333..',
      '.....22222222323332243344433522555543225533444..........11211111111.........12111121132222223111y22211222222224222yy1yyy135111111144221..',
      '.............3355522443444315244551411334433444................................11122122222222211y22112222222224112211yyyyy51411211222111.',
      '..............35544224553311425541111134444424344...............................111112221113333yy222222222212221222115522y114112112441122',
      '..............33333234444111425541111134334422311.....................................221114411yy2232222222122122222211112212112222141122',
      '.............1111111342211114432211111113344122113......................................11111111yy332222212221121122211231212111111114422',
      '............114111222521111255311111111133411221132........................................11111yy3323321112222112222122311.........1....',
      '...........11141111325211112553112211111334111111122................................................2233111223311121112111...............',
      '...........11111111321111112533111111111154211111112.................................................21111122221122111111................',
      '...........111111113211111125311111111111522111111111................................................44111113333122111111................',
      '..........111....1331111111241111111111111222......11...............................................4455...22221122123322................',
      '..........11......31111111114111115555111122.................................................................221111223222................',
      '..................311.....13311.........112........................................................................2111..................',
      '..................34.......524...........33..............................................................................................'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ==== lavav5 完 ====
  // ==== whalev5 ====
  // ---------- 領主體・沙暴鯨 v6（2026-10-16 作者的第三版概念圖：骨頭和鏽黃色甲殼組成的巨鯨：背上一排鏤空的骨棘，張開的大嘴裡兩排長長的骨牙，淡色的下顎和胸鰭，尾巴往上翹）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～8 骨和甲殼（暗→亮）、o O P 鏽黃色的斑。
  HD.sandwhale = hand({ w: 147, h: 76, pad: 4, breath: 40, eyes: 'E', spikeOn: '78',
    pal: () => ({"1":"#1A140E","2":"#2E2418","3":"#463826","4":"#625038","5":"#82704E","6":"#A49068","7":"#C2B088","8":"#DCCEA8","o":"#6A3E14","O":"#9A5E1E","P":"#C68A34","z":"#0A0806"}),
    rows: [
      '.........................................................................................................................................45',
      '...................5655....................................6444...66633..................................................................45',
      '............5555555565OOOOO................................64222.66P44..................................................................555',
      '...........311155OOOPPOPOOOOOOOO..........................56622666PP44........................................55.......................5555',
      '........2233OOOOOOOOOPOPPPOPOOOOOOOPP..............422OO2155551666PP444.......................................544555................4445554',
      '........2333OOO4ooOOOPOOOPPPOOOOOPPPPPPPOO66......4422OO2155551166PP44446.....................................5455566654..........555566444',
      '.......333334O444oooOOOOOPOOOOPOOOPPOPPOOOP33oOOOO4442PP11433311666PP44664.....................................4456666545555.....5555564444',
      '......22333344444oOooOO5OPOOOOPOOOOOOOPPOOPOOoOooOo344POO4433PP11111P444444477.................................44O4OO66666555..555665664444',
      '.....2233333OO444OOooOO5OOOOOOOOOOOOOOOPPPPPPOOOOOo344OOO4443PPPPP11PPP44444552.................................4O4OOOOO666555555566554444.',
      '.....2233OOOOOO4ooooOOOOOOOOOOOOPPOOOOOOOPPOOOOOPPPPPOOOO3344444PP11PPP344445522.................................444OOOO666665545566444444.',
      '....32233OOoPO4OOOoOOOOOooOOOOOOOPOPPOOOOPPPOOOOPOPPPPPPOPOO664444OO2PP34444o22334................................44444444466644666444444..',
      '....32233OOoPO4OOOOOOOOOo444OPPOOPPPPOOOOOOOOPPPPOOOOPPPPPOOOOOO55OO22PP11P4oo2344.................................44444444446446444OOO44..',
      '...44222PPPP8OPOOOOOOOOOoo44422OOoPPPPOOOOOOOOPPPPOOOOOOPPPPPPOOOOoo22OP11PPoo2334...................................33444OO4444444OO444...',
      '...55555P5588PPPPOOOOPPOOoO44ooOOoPOOOOOOOOOOPPPPPOOOOOOOOPPPPPOOOOOOOOP114P5553333....................................44444OO444444444....',
      '..455555555771111OPPPPPPPOOOOooO443OOOOOPOOOOPPPPPPOOOOOOOOOOOPPOOOOOOOPP4475155533444455................................4444443344444.....',
      '..4455555777777777PPPPPPOOOOooo443333OOPPPPPOPOOOPPPPOOOOOOOOOOPPPOOOOOOP337613753O55556644.................................333334444......',
      '.44466222222337777455666PPPPPOO444OOO222233PPPPPOPPPPPPPOOOOOOOOOPPOOOOOOOO6613753O4454654...................................33445444......',
      '.55441111122211111455555677OOPPPooOOO3322334555555PPPPPPPOOOOOOOOOPPPOOOOPO66337711P454654....................................344544.......',
      '.2222222113343331122256666733PPPOOOOOO3322342221222PPPPOOOOOOOOOOOPPOPPOOPO66337711P5565444....................................33544.......',
      '42112222113343334444221556725577OPPOOOOooO3322212224433444OOOOOOOOOOOPPPOPPOP3377222556555445..................................33444.......',
      '.212233211133333434423112222557611POPOOOOOOO332222222233332322OOOOOOOOPOOOOOPPPPP222516655555O.................................334444......',
      '..13333211133333434413333332222615PPPPOOPoo2223322233322322344OOOOOOOOPOOOPPOPPPP22271666655OOO44..............................334444......',
      '...3333221123424444413343444422225PPPPOOPOO28z332223oooooooOOOOoOOOOOOOOOOPPOOPOPP2O73374444OOO445544444.......................434444......',
      '....3332221234234455134444444262244PPPO44442223333OOoooooooOOOOooOOOoOOOOOPOOOPOOPOOO3374144O4OOO44444334444..................3455444......',
      '....334221111123444443454444416552233444444POOooooOOoOOOOOOOOOOo44OOoOOOOPPPOOOOOOOOO3366144444OOO4O443344444...............333454O44......',
      '....434222111333444422454445515553333111444444OOOOooOOOOOOOOoooo44OOoOOOOPPPOPOOOOOOOO366443444OOOOOO4433343344..........333355444O44......',
      '....444232111131144421555O555155545544113344443555ooooOOOOOOOoo444OoOOOOOOPOOPPOOOOOOOOOO4534443OO55OOOO444334444443335333355554OoO44......',
      '.....44232111111145411555OO551555444444222223334455554OooOOOOO44433ooOoOOooOOPOOOOOOOOOOO4534433OO56444OOOO554444443335355544oOOOo444......',
      '.....442321111111454111O5OOOO445555433324211344444555444OOOOOO444333oooOOoOOOPPOOOOOOOOOOOO4434334464444OOO444444444555554O44oOOO4354......',
      '.....444221211111455111O5556543555553442431111334333345544OOOOOO4333ooooOOOOOoooOOOOOOOOOOO44343344444444OO44444444444OO44OOO44OO4354......',
      '......4223221111115511155546553P5555333233321112222333344444444O44333o3OOOOOooo333OOOOOOOOO4O3343333344444OOO444444OO4OOO4OOOo444454.......',
      '.......223222111111611155544441P555534323332211112233322222224413443333OOOOOOOOOOooOOoOOOOOOOO4434333444444OOOO444444444O444Oo344454.......',
      '.......22322221111161115OO44441555554433433221111111122211222111344433311ooOOOOOOooOOoOoOOOOOOO4444444444444ooO44444444444433335454........',
      '.........332221111112111OO224415555545334432211111111111111133311224333ooooOOOOoo4oooOooOOOOooOO44444434444444444554444334433435454........',
      '..........3222211111211116644414455555514422211111211221122211333224433oooOOOOOOO44ooOooOOOOOOOOO444OO322244444O333334433333344544.........',
      '...........22221111111111664OO14455555514423221211221111112222233222433oOOOOOOOOO44o4OooO555OO3OOOoooOO22233333O44444443333344444..........',
      '............2221111111111666OO55664434444423221221111144115522223242433oOOOOPPOOO44o4422O5555O33ooooooOOO333333333553343333444444..........',
      '............2221111111111666665566333444432321111111177OOO565225324222222OOOOOOOO4444223O455553oo4oOOo3OO33333333355444445344444...........',
      '.............222111111111166671165O44454332211111111155OOO5655555533222222PPPOOOO54442234444444O44oOOo3OOO333333333554444544444............',
      '.............222211111111144671165OOO4544312111111OOO555665665555332222232PPPPPOO54545534344444Oooo6555OOOo3333333355444444444.............',
      '.............331111111111111671175OOO45443111555ooOO66666655444442222111343PPPPPO4454553334444444oo6655OOOooo43343355444444444.............',
      '.............331111111111111661177OOOO333318855OOoO6665644443334455522211433OOOOPPPP4453333334444o555555444oo443433444444422233............',
      '............11311111111221111711771133333774655OOO66665544223333433333221443ooOOPOPPP555522333345555454555545433444444444222233............',
      '...........211111111122121111711771133366OO465OO66665554433OO355433333211143oOOPPOPPO55555333334454445444554543444444333322223.............',
      '..........2222111111112111111111277788O666OO6OO5666554444OOO33333333332211444OOOPPOOO5555555223444444434444443444444333333443..............',
      '.........22222111221111122211111277766O66655OOO566555433oo44444333332222115467POOPOPP5555555443333443333444433444333333343443..............',
      '........223222222211122222211111177O66776655556655555433o444333332222222215467POOOOOPPOOOO3544433343333333443333333322344444...............',
      '.......3233222222212222211556677677O6676665o556655OO444334333333333233222114466PPOOOOOOOOO33325533333333344433333..........................',
      '.....6333422322222222222118866666OOO767666oo556555334333333333333222222222255555POOOOOOOOOO442554333333333333333...........................',
      '.....6434424333222222227766666666O6676665OO5555554443333333222333333222222222555POOOO44OOOOOO22443323333333333.............................',
      '.....443433444366332777766667666O6666665555445443442222332233222332222222222255666OOOO444OOO444443323333333................................',
      '.....44443422236OPP2766666677666O666665555555443332223323322223332223333322223666644OO4444OO334444333333...................................',
      '.....5544342222OOPP27667766666O66666665554554422223333222232222.......222233235566544OOOO4OO444444553......................................',
      '......554442222OOP677765566666OO666655554443422233222222223222................55665444OOO4OOOO444455.......................................',
      '......354444677PO666666656666OO655555544442332222111221121222..................5566644OOOO4OoOO44454.......................................',
      '......33664663OPOP66666556OOOO6655555443322233221121122221222..................55555544OO444oOO444544......................................',
      '.......4466553OPPP6665566OOOOO55555544333.....2222222222222222..................5555555OO4444oo4444455.....................................',
      '.......4455555OPP66665566OOO55555544443........2222222222222222..................544575655444oooo42255.....................................',
      '........4565555PP66656566OOO5555544433..........222222222222222...................4457666644454OO444455....................................',
      '........4465554P66665655455555454444............3332222222222222...................55776666OO544O4444555...................................',
      '.........455554P6666665444555544444..............3333322223223333...................5577666OOO444O4446655..................................',
      '..........45445556OO65544455443334................3332223233333333...................5576665OO444OO4433566.................................',
      '..........4542555666655445544344....................333333333333333...................55322576644444433366.................................',
      '...........552555O655554554333........................333333333333444..................332657776443P444444.................................',
      '............44355OO555544443...........................3333333333334444..................6656666443PPP44555................................',
      '.............43444O5544444.............................1111223333333222...................44665554PPOO43355................................',
      '................44444444...............................1111111111111112....................4477757766OO333666..............................',
      '..................4444.................................1222221222222222....................4433357666473PP7766.............................',
      '............................................................22...................2........11113333666476POO666.............................',
      '................................................................................22221111111111111117744666666777...........................',
      '...................................................................................21111111111111111144PPP666677...........................',
      '.......................................................................................2211111111111111116666677...........................'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ==== whalev5 完 ====
  // ==== wyvv5 ====
  // ---------- 領主體・朽翼龍 v6（2026-10-16 作者的第三版概念圖：張開兩片破爛膜翼的骨龍：尖刺很多的頭骨、一根根肋骨，翼骨撐在地上，褐色的膜翼破了好幾個洞，長長的骨尾巴往上捲，眼窩裡一點藍光）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～7 骨頭（暗→亮）、m M n 褐色的膜翼、z E 眼窩和藍光。
  HD.bonewyvern = hand({ w: 154, h: 91, pad: 4, breath: 50, eyes: 'E', spikeOn: '56',
    pal: () => ({"1":"#14100E","2":"#241C18","3":"#3A3028","4":"#56483A","5":"#7A6A56","6":"#A29276","7":"#C8BA9C","m":"#2A1812","M":"#46281C","n":"#643C28","z":"#06080A","E":"#7FD8FF"}),
    rows: [
      '...................................77..................................67.........................................................................',
      '...................................742...............................4467777......................................................................',
      '................................1177422..............................44117777445..................................................................',
      '...............................311766226..............................1117766665556...............................................................',
      '..............................33577777264.............................111777776665655.............................................................',
      '.............................3335777333246............................11445577663577773355........................................................',
      '.............................3333374344256...........................2133455576633117777744266....................................................',
      '............................113533442222566..........................2111463577631113777742222266.................................................',
      '...........................2114555433332337...........................151463537771233223377622222255..............................................',
      '..........................222347751111333377...........................5334433777722333333362222222223233.........................................',
      '.......................2222243777112111443777...........................335533377773333333333772233333235533333...................................',
      '......................22222343771122211444477........44.................633643111773333444433337773333333333333333333.............................',
      '....................2232222333711222221144355.....6644..................6636441111773334444444333773334433333333333333333.........................',
      '..................2223322221377112222221143755...6664............4.......636641111173333443344443447733443343333333333333333......................',
      '................22222222222177112222211111772222666........6632224..........6411111773333444444444447774444443333343333333333.....................',
      '...............2223322222211771122122111117722256662...44476432222n.........6411111177333344444nnnn42227744nn333224443223333......................',
      '............442222322223221771123212212211773365662222777777477233nn......755511112117733344n444nnnnn2227777nnM4432242222333......................',
      '...........4422233322233221771223222221216773365512227777744332225n33.....755611112111773333nnn444nnnn333777nnM3333322222223......................',
      '...........4222233222333327711222222221216773366715577773344331115534444...656111111117773444nn4443nnnn331111773333222222222......................',
      '...........22223322222MM2277112332222122166224467144777333171174422444444..655511122111777444nnn44311nn3444333773333233222222.....................',
      '..........222222222223333777122322222121166224462246777333176674422432227336655411221115577744nnn31111nn4443337773333332222222....................',
      '..........2233222222333237771223222551216664444222765134773722777224322773335554111111116676644nn32221nnn4nn33277633333332222222..................',
      '.........22333222223233277511223222711116644447777775134243332577424467773335655111122116676644nnnn22222444nn32156733333333332233.................',
      '.........23323222223233277522222222711115444777777111144243342577464466765534655511123311177644nMnMM222244444331567733333333333222................',
      '........223222222222333776622222222224115777777711111144223342221164467767544666551222322156774nMnnn2222444444335675334333333333222...............',
      '........232222232322333776622222271114775777773311117711221344131111777447544666221122333156777MMMnnnM233444444333755344344333333222..............',
      '.......3332222333323333766223222771176675661223337733111151314131111777441442255551111133216777M4MMnnMM333433333337742333343333333322.............',
      '.......233222233323334554223322777177666544114433733311115111112115777743144425555312112221177774MMMnn33333333333377423333333333223222............',
      '......2233223333223314554223222777777666522277336112111111334412115555443122413355312222222117774MMMMn333333333333777233433333322233322...........',
      '......33322233322332115522322227766777762222777763322221113341121153344411221131121112222222177744MM3n3333333333337772344434333223333322..........',
      '.....2233222333233221722223332276657777622277777333123331333111217114445511111111222122222221177743M3M33333333333327723344344333333333322.........',
      '....223332223332232277222333222776577776227777223331223333311111171144665111111222222222232311777733nM333333333332277333443333333333333322........',
      '....2333222222222222772223..222766777777255222223331223353341111733552215511111322322222233332277733nM3333333333222773333433433333333333322.......',
      '...2233322222223322277222....227777777772111233333334235533411177315555115511113223222233333321777733MM334433334222777333433433333333333332.......',
      '...2333322222223222771222....22777z777772666632234434235711477771115571111551111221122223333331177733444333111442227773334333333333333333333......',
      '..2233332222222322271132.....2777zEz777755133322244446347777777711155711111551112211122234333311777733444331144322277733333333333333333333333.....',
      '..2222333222222332771132.....66777777711111322222255666477777777135551111133511122222223344333327777334433331333323776333333333..333333333333.....',
      '..2332332252222222771333.....665577777111113222222555766777777771333211111115541222222233333333227777334333313333332761333333........333333332....',
      '.22323322252222222772333.....76577117771111222222332576677776677111121661111554122122333333333332777773333333333333277133333...........33233222...',
      '.22323322222222227712332...7777771116771111322222232546677776773333116611111444111123333333333332777773233333333333277122233............2223222...',
      '.22233325222223227712332...7676611116771123322222222544477776113333551115511111111123223333333332777777233333322333247122333.............2222222..',
      '.22233345222223377113333...766551122777422211232222221447744611771111111331111111112333333333333117777773333333333334722233...............222..22.',
      '.2..33242222222377123233..7766..12227774222...322..22144664463177333111133552231133333333333333311777777523323333333372233.................2....2.',
      '.....3211223222777123233..77.....237772222.....2....1124466633661113111111112233333333333333333111774667523323333333272233......................22',
      '.....3331223322772233222..6......23772222......2.....124466633565221111111112233337733333333331111554677553333333333272333......................22',
      '.....33112323227712332322.6.....327772323.............23367633555111111661112223667775333333311111444777753333333333273333........................',
      '.....33122323277712322322.......3277..323.............22337611651111115511662226677555333333111111114777773333233333263333........................',
      '.....33222233277723322233.......327....23.............2233771165133111111666222555555333333311111111425566333322333336333.........................',
      '....333222333777123323333.......377....33............3322227455111223111166333257555333333331111122242556443333333332633..........................',
      '....322223323777133333333.......37......2...........23332224455111223331111332267433333333333111222222555462233333322242..........................',
      '....4222233277771333333333......37......2..........323333111464221211333221112263433433333333512222222255466333333322542....................5.....',
      '....4222333377722333333333..............2.........4355523111464331121133211157663111433333335552222222277557333333322532....................55....',
      '...33222331777712333333333......................554555323111344431221144211157666755333333335552222333277517722333222433....................55....',
      '...322233117777133333333333....................55566553331113334333211122111166667573115333555522233332777117223322224233....................33...',
      '..2322231117777233333333333....................66774412221133333333222131111166777776115333555552233332277117722333223233....................336..',
      '..22222211777732333333333333..................557744412222....33443112231113366777776133335555555222333277112772333223233.....................36..',
      '..222222477477323333333333333................667774421222......2244111312213433777772223225555555222233M771227722322232333....................366.',
      '..222222477477423333333333223..............6677777112..........2244155311224434777772333332555555222223M777222222222232333....................336.',
      '.22223222777664233333333333333..............66777711.............4435441133433455773333332255555522222233772222272222323333....................36.',
      '.22333236777662233333333333333..............77777513..............3334433311134557733333314433555322223327713322722233333......................66.',
      '.223222367677123333333333333333.............22115533..............333443421213466776733331333366333222222571332222222332.....................6666.',
      '.23322135566613333333333333333332...........445266333.............333444422223355776737733332333333322223573332226622322.......................66.',
      '.2222216556412333333.......333332...........4452444433................4433223335567553355555223333364423337223332277232........................66.',
      '.222221666641233333.........33333...............44455533445............433333344466553356666223333364455337223332276332.....................55566.',
      '..22227117611333433..........33333..................5555445.............33333344443225556666222332232555537723332266322.....................556666',
      '...22271171133344............33333...................115543................33333333222222144423333232555537723333236222.....................55666.',
      '...2277177223333................332..................115513...................33333332342144433333333555537733333234422.....................655...',
      '...2277777223333.................32..................233313....................33..333343332233333343322227733333214322...................66633...',
      '...2661777233333.................333................424333..........................333334423333334443222277333332113333.............5..666443....',
      '...221177723.......................3................44423............................33334553333333333333177223322163334455...5555555556666555....',
      '..155117722........................................55522..............................333555733333333333317773332216113445564456555555553333......',
      '..11111772........................................5555.................................3356675333333333221777723222111343326555666555555223.......',
      '..51111771........................................555...................................3557555333333322217777232223233333244333355555555.........',
      '..51117771......................................66655....................................447555533333222217773232223223333333333...33..5..........',
      '..33137772....................................536664.....................................44776644433222221777322223322...333..3...................',
      '..32237742...................................5534444.....................................4415544442222222777711122311.............................',
      '.532277742..................................555666622....................................551144444222277777771112231..............................',
      '5535577751.................................45336622222...................................544764444222777777777772232..............................',
      '.533777551.........................34444477455533223322..................................644763222221177755777772222..............................',
      '.531165577.........................34221177115533223322................................66633113222211177755775552222..............................',
      '.2113666771........................112211121212232233..................................1223311333111117776576555222...............................',
      '2211366441144........................222112121222......................................1222211311111167776556411112...............................',
      '223225124113333........................................................................2222221322277761144666411133...............................',
      '..3235122213333.................................................................................2773331142266222332...............................',
      '....33112233..3..................................................................................333331332256112222...............................',
      '........223......................................................................................33333332225511...................................',
      '................................................................................................22.....2222511....................................'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ==== wyvv5 完 ====
  // ==== gashav5 ====
  // ---------- 領主體・地出巨骸 v5（2026-10-16 作者重傳的概念圖：從土裡爬出來、駝背的巨大骷髏：大頭骨、一根一根的肋骨，一隻巨大的骨手撐在前面，身上掛著爛泥和腐土）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～8 骨頭（暗→亮）、d D f 爛泥和腐土（暗→亮）。
  HD.gashadokuro = hand({ w: 132, h: 133, pad: 4, breath: 50, eyes: 'E', spikeOn: '78',
    pal: () => ({"1":"#14100C","2":"#2A221A","3":"#46382A","4":"#6A5840","5":"#8E7A5A","6":"#B09A74","7":"#CCB690","8":"#E6D4AE","d":"#3A2212","D":"#5E3A1E","f":"#86562E","z":"#080604","E":"#E8A050"}),
    rows: [
      '...................................................f........................................................................',
      '...................................................fff77....................................................................',
      '...................................................fffff4...................................................................',
      '..................................................ffffff4f..8...............................................................',
      '.................................................ffffff7ffff8...............................................................',
      '.........................................D..DDD2ffffff77fffff...............................................................',
      '........................................DDDDDDDD2ffff117fffff8..............................................................',
      '......................................12DDDDDDDDDffff11ffffff8..............................................................',
      '......................................1222111ffDDffffD1fffffff...8..........................................................',
      '......................................1222111ff66fffDDDffff222...8f.........................................................',
      '......................................112f111ff888fffDfffff2222..ff.........................................................',
      '.....................................1111ffffff888ffffdffff11222fff.........................................................',
      '...............................DDDDDDD21522fff118ff7fff1fff11122fff.........................................................',
      '...............................DDDDD2225522fff117777ff111ff11122fff.........................................................',
      '..............................DDDDDD2221522f88887777ff11111122222ff8......ff................................................',
      '..............................33DDDDD33886D88888777fff11111111322ff8f.....ff................................................',
      '..............................113DDDD33866678888677fff2111111132ffffff...fff................................................',
      '..............................113D11D33776678884488fff211111111fffffffffffff................................................',
      '..............................122312227777888884448ffff1111111ffDffffffffff55...............................................',
      '...............................23312227778888884444ffff1111111ffDDDD7fffff8888..............................................',
      '...............................111122277788888555111fff111111111DDDD7fffff888ff.....55......................................',
      '...............................111122225577888551111fff113311111fDDDffffffffffffff6775.....88...............................',
      '...............................111122255577866551111fff21DDD1111ffffffffffffffffff6778888855................................',
      '................................11122255566886651144f11211DD111ffDffffffffffffff222....8885.................................',
      '................................211222156666886614ff1111112211222ffffffffff77ff2112......88.................................',
      '...............................2211D22166666886644f112211123332221ffffff88877781111.........................................',
      '...............................222DD11166666886644111111112333222fffff88888777771111.............886688.....................',
      '...............................22fDD11166668888746111111112DDD8fffffff888887777771112......5......f8888.....................',
      '..............................2223f2211666688877f6111111112DDDDfffff77777887777771112......55.....77888.....................',
      '............................DD31133222226667777ff1111111112DD1Dfffff777778877777ff111......5522..885544.....................',
      '............................3331113112221167777ff111111111111111ffff77777787777ffff111....111222288554......................',
      '...........................113221DD111221117777fff111111111111116fff777778877777fff11111111111122833........................',
      '............................112213D111222111788fff11111111111111ffffff7778887777fff1111221111111883.........................',
      '.............................121132211122111188fff15111111111111fffffff778887777fff1122221111118883.........................',
      '..............................11122221111111188751151111111111888ffffff7888887777ff11122121111888f44........................',
      '..............................3112222f11111118855111ff11111111188ff5fff8888887777ff11111111fff88ff111....88.................',
      '..............................3112211ff2111ff8DD51111111111111444415ff7788888777fff211111fffff1ff1111fDD888.................',
      '..............................3111211ff2111ff88D21111111111111144411D21128821127fff1111ffffff111111122ff88ff................',
      '..............................1111111ff1111ff88441111111111111114111211112211112ff1111fff22111111111222fff..................',
      '..............................111211fff1111ff88441111122222211111111211112211112ff112133221111111111222ff...................',
      '..............................112211ff1111ff88771111112222222111111112112ff2112fff1222332211ff111111222f....................',
      '...............................22211ff1111f7877711111122222222111111f188ffffffffff111111221ffff1111112ff....................',
      '................................2211ff11117777771111112222f22211111ff111ffffffffff11111111fffff1111111ff1...................',
      '................................2222ff211177777f111111122ff11111111ff111212ffffff11111111ffffffff11111ff1...................',
      '................................2222ff211777777f1111111111111111111ff111212f1111111111111ffffffff5511ffff...................',
      '................................2221ff11177777fff1111111111111155522f11fffff11111111121111ffffffff544ffff...................',
      '...............................D32111111177787fff1111211221..1155521111ffff1111111111111111ff1111114ffffff..ff..............',
      '...............................D22111111177886fff111111111....1155111727272727111111111111111111111fffffffffff..............',
      '..............................DD22111f117778866ff11111111....111111111fff11111111111111111111111211ffffffffff...............',
      '.............................2222221ffffff78877ff1111131......111111111ffff111111111111111111111211fffffffff................',
      '.............................22222111ffffff777fff1111133......1111111111fff1111111111111111111112fff11ffDDff................',
      '............................2222221111ff7888fffff51111333......1611111111111111111111112211111177ff111ffDff.................',
      '.......................D..21DDD2221117774888ffff551..122........61111121111122211111111111111117711111ffffDD..88............',
      '......................DDDD211DD2221117744444444466....22........1111111111122222111111111ffffff1111111ffffD1ff88............',
      '......................DDDDDD132111fffff44444444446....22........511...1211122222111111111ffffff11111111fff11fff.............',
      '......................DDDDDDDD2111fffff111114444477....2........51.....21112222311111111111111111118111fff11ff..............',
      '.....................DDDDDDDDDDfffffff1111115222477....2........5......11111222311111111111111121188811ffffff...............',
      '....................DDDDDDDDDDDffffff111116652224744...................21111222211111111111111122188111ffff5................',
      '....................DDDDDDDDD2227ffff1111188771117455..................211111332111111111111111ffff11111fff4................',
      '....................DDDDDDDD22221ffff1111f7777111155..................2111111333111111111111111fff2111111ff44...............',
      '...................1222DDDDD222111fff111ff777f11111...................221111223311111111ffffffff1121ff111ff4ff..............',
      '...................1222DDDD6111111ffffffff777f4111....................211112221111111111fffffff1111ffff11ff4ff..............',
      '....................22222211111112fffffffff77f44ff.....................1112211111111111111111111111ffff1fffff...............',
      '....................11222211441122fff44ffff77744fff.....................12221111111111111111111111ffff11ffff................',
      '.....................2222111112ff22ff44ffff77Dfffff......................222211111111111111111111ffff1111fff................',
      '......................211DD1122ff44ffffffff87DffDf.......................2222211111111111111111111fff111212ff...............',
      '......................112DD44222ff4fffffff88ffffDD.......................1122221111111fffffffff1111ffff222fff...............',
      '......................2222114422ffffff111888fff441......................222221111111111fffffff22111..ff22..f................',
      '......................11221144444fffff111887fff4111....................ff22211111222111111111122............................',
      '.......................2221552244fffff111888fff1112...................ffff111112222221111111112.............................',
      '.......................2222551111fff44111188fff1112.................ffffDDD11122211111111121111.............................',
      '.......................444222111114444111f88fff22112...............fDffDDDD1122311111111fff1111.............................',
      '.......................1442221111144441118877f222112233...........fffDDD22D1222311111113fff211...................888........',
      '.......................13325211111444411188772222112333...........ffDDDD22D222231111111222222....................888........',
      '.......................13325221111f4444DD887722211122333..........fDffffDDD2122311111122222211................ff77DD........',
      '......................213222222111ff44fDD8888111111222333DD........22fffDDD2222222112222332111.............fffff77DD........',
      '......................221111ff2111ff44fD588881111122223333D........22ff22DD2222222222223331122............ffffffffff........',
      '......................221111ff1111f8DDDf55888111112222333DD.......222222DDD22222222222233322222...........4ffffffffff.......',
      '.....................3321111ff111fffDDfffffff11111222223DDDD....22112222DDD2222111112233332222............4fffffffffff......',
      '.....................2211111ff22ffffDDffff8fff1112222232DDD32..211112222DDD222211111222333222.............ffffffffffff......',
      '....................12211111ff22ffffDDD1188fff11112222222DD3222211112222DDD222211111222221122.............fff7ffffffff......',
      '....................111111111f11fffff211188ff111111222222222221111111121DDDD222231112222211122...........ffffff1111fff......',
      '....................111111111111fffff111188ff111122333222222222311111111DDDD22223222222222111ff.........fffffff11111ff......',
      '.....................111111f1111fffff111178ff111122233322222222311111111DDDD22223222222fff11111........ffffDDff11111........',
      '.....................2222122f111f7ffD111f88ff111112223D22211221111111111DDDD221122111111111111........ffffDDD1f1111.........',
      '....................22222112ff11777ff1118888111111123DD222112211111....1DDDD221121111111111111........fffDDD1111111.........',
      '....................22233111ffff777f2211888f1111111333D22221122111......22111111122222223311111......ffffDD22111114.........',
      '....................32233111ffff77ff221188fff11111133333332112211........21111111222222333111DDff..ffffffff22211114.........',
      '....................D3211111ffffffff211888fff1111112333333311211.........1111111112222233111fffffffffffff1111221114.........',
      '...................DD2211111fff77fff111888fff1111112223333311.............ff111211123344111fffffffffDDD221..12221ff1........',
      '...................DD2221111fff777ff111777fff221111122222331..............ff11113111114ffffffffffffDD33......2221ff11f......',
      '...................112221111ff7777ffff77777fff2111112222213..............11111113DDfffffffffffffff3DD3.........11ff11f......',
      '..................2113211111ff7777fff777777ffff..11122D2213............1111111111DDffffffffffffff3333...........1fff1ff.....',
      '.................22113111111f7777ffff777777fff......23DD2222...........11111111111222ffffffffffff333.............fff11......',
      '................232211111111ff7777fff887777fff.......3DDD222...........12211111111222fffffffffff222..............fff33......',
      '................221122211111ff7777ff8887777fff.......33DDD22............22211111112211fffffff22222...............ffff.......',
      '...............211113311111fff777ff8888877ffff.......33DD311............22211111211111fffffff2222................ffff.......',
      '..............2211113311111fff77fff88fff8ffffff......333331............222211111222111fffffff2222.................fffD......',
      '..............211111111111ffffffffffffffffDDfff......33332..............11111111122111fffffff3222f................DffD......',
      '..............111211111111ffffff22211111fDDD8fff.....22DD2..............1f111111112111fffffff33ffff...............DffD......',
      '..............12221111111fffDDD1222111111DDDffff.......DD2..........4.....11112211221DDffffff33fff................ffff......',
      '...............2211111111ffffDD112111177fDfff33.........32..........44.....11222112222Dffffff11111................ffff......',
      '...............331111111111ffff111111ff7ffffDDD.........322........444......1222113222f111fffD111..................Dff......',
      '.......DD..2..23333122111117fffff111fffffffffDD....................542.......22222322ff111ffffff...................Dfff.....',
      '......fDff222223333221111ffffffffffffff88ffffDD...................4422.......1222222Dff1122fffff...................Dfff.....',
      '......ffff121DD333222111fffffffffffffff88fffffDD..................44222......132211DDffDD22fffff...................Dfff.....',
      '......1111111D332222111ffffffffffffffff8fffffff777................222222....1122211DffffDD1ffffD...................DfffD....',
      '......2111111222222211fffffffffffffffff7ffffffff77f...77..........22222211111122222DDffff111ffDDD..................DfffDDf..',
      '......3311111121111ffff7ffDDf88744ffff7866fffffffffffffff..........2222111111122222ffffff111122DD..................ffffffff.',
      '...........11111111ffffffffff8844411ff66666222fffffffffff...........211111223222111ffffff1111222DD.................ffffffff.',
      '............fffffffffffffffff44444111176666222fffffffffff............1111..33322111ffffff1111222Dff...............fffffffff.',
      '............fffffffffffffffff44441111777f66211ffffff1fff88..................3332111ffffff1111133DDfDD..............fffffff..',
      '...........ffffffffffffffff7f842211117777f111111222221ff888..................111222ffffff1111133DDD22...............fffff...',
      '..........88ff222ff7fff11ff77f2221111777771111222222211ff8877....................22fffffff2211133D12...............ffffff...',
      '.........888ff222f77ff1111f77f22111111777711112221111111fffff.....................22111fffff11..................ff22ffffff..',
      '........888fff222884111111887411111111777711111111111111fffff......................21111ffDD1.................ffDf222fffffff',
      '.......f8fff11188881111111887111111111188711111111111111fffff..............................11................fffD2222fff11ff',
      '.....fffffff111888f11111118ff111111111f877111111112111111ffff...............................................fffD11111ff111ff',
      '....ffffffff11fffff1111118fff111111111ff7ff11122112211111ffffD..............................................ffDD11111ff111ff',
      '....ffffffff1f7ffff11115fffff1111..11fffffff1111..2211211ffffD......................................................1.......',
      '....ffff11ff4777ff111..5fffff111....fffffffff.1.......111fffff..............................................................',
      '....ffff11ff477ff111....f77ff11......fff7fff............1ffffff.............................................................',
      '...fffff1..fff7ff111....f77f11.......ffffff1.............1fffffff...........................................................',
      'ff21ffff....fDDff1.....fffff11........fffff1.............12DDfffDf..........................................................',
      '..21ff11...ffDDD2......ffffff.........ffffff..............2233ffffff........................................................',
      '...1.......ffDDD2......fffff..........ffffff...............23DDffffff.......................................................',
      '...........fDDDD.......ffffD.........1ffffff................11DDff11........................................................',
      '............11.........fff111........1Dfff22................................................................................',
      '.......................ff11...........11ff..................................................................................'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ==== gashav5 完 ====
  // ==== muhyov5 ====
  // ---------- 領主體・無主大鎧 v5（2026-10-16 作者重傳的概念圖：比人高好幾倍的空大鎧：黑漆的札板一片片用紅繩綁起來，鍬形的前立、紅色流蘇，面具裡只有兩點紅光；左手拿軍配，右手按著腰上的長刀）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～6 黑漆鎧甲（暗→亮）、r R S 紅繩和流蘇、y Y 金色的前立和飾件、z E 面具裡的紅光。
  HD.muhyo = hand({ w: 119, h: 124, pad: 4, breath: 60, eyes: 'E', spikeOn: 'yY',
    pal: () => ({"1":"#0C0B0E","2":"#18171C","3":"#26252C","4":"#37363E","5":"#4C4B54","6":"#6A6A72","r":"#4A1414","R":"#7A2222","S":"#A43A32","y":"#7A6232","Y":"#B89A52","z":"#000000","E":"#FF3A2A"}),
    rows: [
      '...........................................333...................33............................................',
      '............................................3333...............444.............................................',
      '.............................................344...............444.............................................',
      '.............................................344..............554..............................................',
      '..............................................44.....556......555..............................................',
      '..............................................44.....55645....55...............................................',
      '..............................................44....644645....55...............................................',
      '..............................................44....6444444..44................................................',
      '...................................................336666445544................................................',
      '..................................................33444644444445...............................................',
      '............................................556611333343342444555..............................................',
      '............................................2266111132233422211533.............................................',
      '...........................................44463111111111113111553.............................................',
      '................................2233........4333111zzzzzzz13312222..........2222...............................',
      '...............................2233333......4221111zEzzzEz11111122.......34422322..............................',
      '...............................222355333.....211122zzzzzzz1221222......2233443332..............................',
      '..............................22rr2533333....21111r11111111r11113.....334333rrr311.............................',
      '.............................2222221334432..221111r11111111r111333...114443rr223433............................',
      '.............................2344421rr431223321111r111111111r111133555114rrrr444433............................',
      '............................223444443333125222111r2221111111r11113355331444554444222...........................',
      '...........................1223334444421225222121r1113323311r221135533311444444433222..........................',
      '..........................11133334443321144rr112rr1332223332rr1111rr31111334444433332..........................',
      '.........................224443344422311142rr2223r1344445532rr111111433111334454444443.........................',
      '.........................224444444444111222rr222333334443333422111rr4131111444543443333........................',
      '........................1233334444444111112r4222355555555665422211rr1111111444443443333........................',
      '........................122233334431111111rr442234455555565544332rr333111111444443322222.......................',
      '.......................2443333334331111211rr211334444444666544222222233312214444444454433......................',
      '......................22444555333331112222rr2123444445556666552222223333112114554444533332.....................',
      '.....................3344233333555111133211211234444444444444443211111131121144444433443322....................',
      '.....................32222333333441112221112213344454556666643332111112233111144444333333322...................',
      '....................1111233223334111221122rr133345555666666644333111222223111144444443333322...................',
      '...................33334333334333111121122rr1445553322111112244441ryr222111111155444444444333..................',
      '..................33344444443443311111122rrr1111111333445544211122ryr3311211111154444455443332.................',
      '.................223332244433343111221111rRr1111334444556654444111rrr33112111111545554444443322................',
      '................2233333334443343111121111rRr1233344555555655543331rrrr221112122155533444444rr244...............',
      '................2443444334433341111111111rrr2233322222333221143331rrrr22111212111444554444443444...............',
      '...............4455555434433431111211122rrrrr112334434445551443112rrrr221111111115555553444434444..............',
      '...............1111335444444431111211121rrrrr1222333344443333322222112222111113311665553411111111..............',
      '.................111111444446311111113211111112222344444444443222111111221111111111661111122211................',
      '...................33111111661111111132111111332221122333344432221111111211111133111111111422..................',
      '....................222111111111111111111111111123333334444433211161111121111113331111112242...................',
      '....................22111111114322111111111111112122211112222221166111222111114466111111111....................',
      '....................22111111224311111111111111112122221133222111111441122111144466664111111....................',
      '.....................1112111111331111111132211112rr2r2rrrrrrr111111441112333546666444332211....................',
      '.....................11121111111311111133322111rrrr2r5533rrrrrr111114442553355666444432222.....................',
      '.....................312334431111121..122222rrrrrrr2555555rrrrrrr111144255334445444233222......................',
      '....................333233333111122....522rrrrrrrrr2544555rr22113111114411114445442233322......................',
      '....................34233645121111.....522111rrrrr223344331rrr11311111441411143344422112r......................',
      '....................34243645122111....2222rr44331r2133113311r22131111144441112333112221rr......................',
      '....................4334444rr21155....2222r311111rr111111111r2111111111122221211113322rrr......................',
      '....................4235444rr2111.....221113111r3rr111111211rrr111122112222211331......rr......................',
      '....................22454423322......111111223rr3rr111122221rrrrr333212222211111...............................',
      '....................2245442212.......111122223r22rr111112111rrrrr332211221114551...............................',
      '....................335544221.......1111115221222rr333333322rrrr1133211122244555...............................',
      '....................33554222.......22211455551rrrrr33555544rrr111133421111144455r..............................',
      '...................223444222.......222344533314rrrr111111111rrrrr244421111554455r..............................',
      '...................23344112.......11223445553141rrr111112222rrrrr244441144111445rr.............................',
      '...................2366411........11223333331r41rrr114455332rrrrr223343111112244rr.............................',
      '...................2311111.......111133333331r41rrr144444333222rr214433111111114rrr............................',
      '...................43361111.....1112222233311Rr1rrr133334331111rrr14443311111111rrr............................',
      '..................141361111.....1111334444411Rrrrrr134444444311rrr14444441111111rrr............................',
      '..................141311111.....2223333444411Rrrrrr144444444332rrr11444443311111r1r3...........................',
      '..................111111311....1122223444411rrr1111122333333332rrr1154433333311111r33..........................',
      '..................51111131....11222233344511rrr11113233443333112rr1154433333331111r333.........................',
      '............222..253111111....1122233444451111113443344443444322rrr115555543331111rr43.........................',
      '...........22222223331111.....1222233344441111333344444444433332rrr114454443344141rr444........................',
      '......224332332222233122.....22222333334411112333222222222222232rrr115444444334441111444.......................',
      '.....223433333322223311......23333333333511212333334424442444222rrr1153333333344211r11553......................',
      '...3333333333322221121......121111233333512212333343323342334332rrr1114444433333211r115533.....................',
      '..22333333333333321222......1222222333344123133344443234433343321111114444343334411r111553.....................',
      '..234333333yy333322322......222222332333212313333222322222222331111111434334434441rr1111333....................',
      '.333433344yyyyy44333222....2233322332333212213333444444444433331121221433332233341rrr111133....................',
      '.333433333yyyyy44333222...33222233343341113213333322223322112231121221454443333331rrr1..1133...................',
      '.3444333222yyyy25533333...33222333344441133124444455444455544244121121154444333344111....1322..................',
      '634443244444yy425533233...22222233334441133124333334334443333224122111144334443344111....11111.................',
      '.3443324yyyy114yyy3223...1122223333333441331344rr334444444344445123111144334433334411.....1221.................',
      '.344332yyyyy1yyyyy3333...122223333444462234134544444444445544455123143145555444333331......2222................',
      '..44432yyyyyyyyyyy3333...333333333rr4661rr4144544444445554444555123143116555554444344.......2111...............',
      '...4433yyyy33yyyyy3335..3322433344455661rr11211111111111111111111111133166555544443444......2111...............',
      '...4444yyyy33yyy223335..3334444444455444rr11211111111111111111112112233165555555445544.......1222..............',
      '....44455yy43344223335..33444442223344444r123111111111111111111121222rr445533333345544........222..............',
      '....44555444443333333..221111111111111144r123111111121111111111111321r34111111111111144........122.............',
      '....44155433223333322....11111111111122rr312311111112111111111111132113332222322111444.........1222............',
      '....4415443322333333......111111rr441223r31331131131r111121111111132113333rrr33211144...........222............',
      '....5515543334433333......1111rr5566RR23221422231131rr222211111311211244rrrrrrr551111............121...........',
      '....555..4444543333......1133rr55555RR555114122311rrrr1122211113312112555RRrrr5551111............1211..........',
      '....55....44454433.......4333221111111155114122311rrrr1663211123312311555111111111114.............2211.........',
      '....r3.....44444.........4311111111111111114112311rrrr2233111223411331111111111111114..............121.........',
      '....r3...................1111133111122111111113311rrrr2225112223443311111114155431111..............1211........',
      '....rr...................1111133111455111112233322rrrr12251323234431111114443534311144..............1155.......',
      '....rr....................222133111443311111244223rrrr1..1132323422111111444353431222...............1111.......',
      '....rr....................221134411443211111222123rrrr....13232111111222134333343122.................122.......',
      '...rrr....................221131133223223322111113rrr2....33231111221221133333113122.................1122......',
      '...rrr....................211131111111222131111113rrr2....23111111221222211111114111..................1222.....',
      '...rrr....................111131111111111131111111rrr2....2211111113311111111221411r...................1122....',
      '...rrr.....................221311111211121211111113rr2....2211111111322221211111111r...................1122....',
      '....11.....................211311332221121221111133333.....1112211222111112433314111....................123....',
      '............................13324432331111122211233333......1123222221111144344442111...................1133...',
      '............................133244444321111122312313........1133312221111344444442211....................1133..',
      '............................13323344222225112331331.........112221122221233333324321.....................1133..',
      '............................23222223211355...331333..........22221...21121333332433.......................1444.',
      '............................2322233312135.....3333............222.....331123333243.........................1444',
      '.............................31223321223.......333............12.......22222333333.........................1444',
      '.............................3133432222.........33............1........22223333333..........................44.',
      '.............................2143432211..........3......................1223344334..........................4..',
      '.............................224344222..................................1132345534.............................',
      '.............................144334223..................................1132345534.............................',
      '............................111r444333..................................11333332244............................',
      '...........................2111r442333..................................2233333RR44............................',
      '..........................2211114422211.................................221133311111...........................',
      '..........................221111111111...................................11111111111...........................',
      '..........................445554111113...................................144113445555..........................',
      '.........................4445544411113..................................32111334433344.........................',
      '.......................111441124411111..................................321113331114434........................',
      '......................4441544422443221..................................1211131234444344.......................',
      '......................4444522332133211..................................1212231232114333.......................',
      '.....................11144422322132211..................................11133223321143333......................',
      '....................1111223313331133111.................................111332333224433333.....................',
      '....................1111113312221111111.................................111111232222333333.....................',
      '....................1111111111221111..........................................221112111111.....................'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ==== muhyov5 完 ====
  // ==== apev6 ====
  // ---------- 領主體・雷鳴猿 v7（2026-10-17 作者的新參考圖・高解析：用拳頭撐地的巨大猩猩：深藍灰的毛，肩背上一大片往上炸開的奶白鬃毛，兩隻粗壯的前臂上爬滿發光的閃電裂紋，淺灰的臉、眉骨很重）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～5 深藍灰的毛（暗→亮）、6～9 奶白的鬃毛（暗→亮）、y Y W 閃電裂紋、E e z 眼睛。
  HD.thunderape = hand({ w: 145, h: 138, pad: 4, breath: 42, eyes: 'Ee', spikeOn: '89',
    pal: () => ({"1":"#0E0F16","2":"#191B26","3":"#262A3A","4":"#363C52","5":"#4C5470","6":"#6E6E78","7":"#9A989E","8":"#C4C0BC","9":"#E8E4DC","y":"#B88A1E","Y":"#FFD24A","W":"#FFF4B8","E":"#FFE04A","e":"#C89A1A","z":"#05060A"}),
    rows: [
      '............................................................................77...........................................................',
      '.............................................................................777.........................................................',
      '.......................................................69977......7..777......677....6...................................................',
      '.......................................................6677999....76677777....667....6...................................................',
      '.........................................79999977........7666977..666799977....777777777777..............................................',
      '.........................................7788999977......76666776666666696666..7777777777769.............................................',
      '..........................................6666666778888..776655768888666996667777777966778699............................................',
      '..........................................666666677778899774456558877886699977776677989978779............................................',
      '.............................................6665577889999788666648777766699977666777899777666...........................................',
      '.............................................6677577998999888885548877776669997666677789977676...........................................',
      '............................................776667665588988877755558997666666776666887899777768878.......................................',
      '............................................7777676655559888877555555556666667799447778977877788788......................................',
      '.....................................66788888777766667555888667887755888866662227733333377877779988......................................',
      '.......................................77666866677777777666877666667588888662222244333332227777999887....................................',
      '.......................................77886666677777776666677766667768888882222334333333333377777787....................................',
      '.......................................66766664466655566665566766866668877782222333334443334446777787....................................',
      '............................999...99.77687688844444455544665566688666Y899776644335533444343444678688788..................................',
      '...........................777555599..6688887777755455555665566577599YY99773225533333444343433378677788..................................',
      '...............................577777766778887665554555556885445555799Y69773222533311334333433366667777..................................',
      '................................77777766777666644477655444335225555799966778332223333333334433224667777..................................',
      '................................7887756666666668888866655433522277779888666822222433332234444222466777766................................',
      '...............................77766655777666667788886554433322228678887766773332444442355444332266776777................................',
      '..............................667766665577755YYY888888554441122W286777866667732224444443544444343377568877...7...........................',
      '...............................6777776555575YYYY88666WW59999555W226788766669512224444444444333343376568887...7...........................',
      '...............................776677665554477755555666555999955WW5766766649511224443112233333333116567886..87...........................',
      '..............................7776676655555666555555566655577799WW57766666499221114431151133332221165678766887...........................',
      '..........................777777788766757777766523332233655776699997766466774411111444555553222441165688778877...........................',
      '..........................7778877777777557744222234445336499755599977764666754111114444555662225555555Y5577667...........................',
      '.........................77777766555754444443344445555994442775548877775566754311114455555655555443338Y667996............................',
      '........................8888766666554554444244444554444445422885448888753667733113344555576555554432286669977............................',
      '........................888877666665455444222444444445555544446644889993344911143333441157775557444446668897.............................',
      '.......................788YY55556555565552224444455545555544444444466893344911143333441111775557114446669966.............................',
      '....................666776675555655566655223333455556655544444444444688881195111342244331e1122211115556676664............................',
      '..................666667766755554467765533333335555566555533455444446966899955113424444412212211e1358556763344...........................',
      '.......................7766666666665533333344434555555442466654444444977899933113322114555555442213385566635334..........................',
      '.......................777666766655553333345443455552334246654444444Y9775555333333311144335555444411877666353455.........................',
      '.......................777687777666555333445443444452434577755555444YY7757553111442221333555554331117766662244555........................',
      '.......................778888766666665334455444444444455576655555521YYY7775551133342255355511543312176655552445544.......................',
      '.......................5577866576666653334422445554335557765555553211117855551111444455555514443312446655444444544.......................',
      '....................7788777765576665511233222455553355566655555533311155855555111434225555518473414446699444555544.......................',
      '....................77887666667767655122332244444434555555442233443311555667753111342255666686744145479953355533343......................',
      '....................788876666YY7774455231114454334344555554422344332115557767531114422555566666441555799533456653435.....................',
      '...................7787766775557744444231113354344344333332434442322222659666511112433545556655433556711334445655445.....................',
      '..................8877YY755555575455522211222243344444333323344223222226696666111123334444455443336667113444455553336....................',
      '................99855YYY7557556656553211112322433334433332233332223321566YYYY6511111224445533332227767114444433443336....................',
      '................955556888777565566533111113332223333323322233111223221566YYYY7531111122333333332227755113334433443333....................',
      '................55557686677566555533311213323322233332322223311112211116Y777Y7533111111244455341277744122344443344333....................',
      '..............6665557666575575522334312223323322222322322211111111111177Y77788223111111233455341177722232234443343323....................',
      '.............66666....65555775522444212233323322224422322111111122111155866663322122111223333331175711233233343333322....................',
      '.............6........65666663334444222333333322455322211111122211111555866667333122111123332225555711222233333332225....................',
      '......................77777554544432233344433324453322113333111111111555666667555222111111132125653711111222332222255....................',
      '.....................877765554544332222455443344433555444444121111114565655677555331111111131155613111111222232232233....................',
      '.....................877667554544422222444333554444466554544421111134465555774554331111111132144513111221211222332226....................',
      '..................444776677555445411123343334444444565555544422111131455555774554431122211232335511111111111222332326....................',
      '..................4447766Y65444451112233433344444455555554443431111215544557445543312222212233355111111111122223423344...................',
      '.................33YYYY6YY65555661111123333355554455555544453433112215534557455543313332222332331111121122222223413444...................',
      '.................77YYYYYYY65555653111223333555545555555444454443111255334554445533333222222322331111222323334433313444...................',
      '................77YYYYYY66555565531114232255754455455555544444431112544455545455111222332222223111111233233344433134555..................',
      '...............6YYYYYYY776657765443134322255744455435554345433321112244445545455111222222222222111122244235544443444435..................',
      '..............6YYYYY777776555555453334334545555555333554345444421112244345444445112333222222112111222445535544443444433..................',
      '..............6YYYY7776665556665553344114544555555433334333334221112244344444441222333332221111112233445535455443444423..................',
      '..............77777..766555666554432331144244555554333444423332211111433445441411222223211111111122334445444554444444233.................',
      '.............77..6...66666y66665533243344424455555444333422333221121321155541111111222222111111122233444454454444324422336...............',
      '............77...6...6666Yy44665555344444554445555555444412222221223321155511113111122222211111122223344455544444324443336...............',
      '............7........666YY445665455344444554444455665444411222111233332555511233221111122...3312222233444444444433233333355..............',
      '....................77766645556546534445555545555556555441222211222333255511223222211........311222333444444444443232233355..............',
      '....................7767445555555653433334554555655544554411221121243335151112221233.........3112222333444333424222323333554.............',
      '....................776745555555555333333455555565555544444111111114343512212232122...........12222323333333322222233434354433...........',
      '....................766655556554755433333344455555566555444431221133443512222333311...........12222322333333222221333444444455...........',
      '...................7655655556114755455335445555555677555544433223333332222332333311...........111122222333232212213334444444556..........',
      '..................77655555555yyy555555435544444566667664444444323233332222222233................1122221222221112233344344555586..........',
      '..................884565554551yy5445Y443555544455667766544444431123432222222222..................441121121111112233444345555588....Y.....',
      '..................8846653345512y4433Y554455543355677665545545444113422222211222...................11112211111111123455455455668....Y.....',
      '.................77466644555212y4433yy544522433344477765545554444131111121112222..................111111221122213244554554456688...Y.....',
      '.................74467655552213Y4433yyy445522334455766655445555511112211111112222..................111122223322334445555555555877YYY.....',
      '.................22777666552113YYyyYYyyyyy5522243357655554455555111222111111111222.................111112222222333444444555Y44666YYY.....',
      '................3327755655522133YYyyYYYYYYY52553322775555555544511111111111112222222..............4112222222323343444455544Y4555555......',
      '................33875555511122234334555YYYY4445533332Y7766555435541111111122111222222.............4122222223322444455455444yy55555.......',
      '...............6688665552111132443444455YY66544445522YYY665444355411111122222212232223...........33122233222222454454444444yY555Y5.......',
      '...............7777765522122235555533325YY6655454552273YY654444554111111122233113333333..........371223334312245545544444444YYYYY5.......',
      '..............777777225232221144454222255YY665455555573335545444541111111222333223333444..........72233334311245444444444444yWYyy44......',
      '.............6667744223333221144444422355YYY666555555Y33355455444431111212223333233444444.........22233334311445444345544445yWY3344......',
      '..............667743343333332134445422355YWWYYY665665YY33334454333311112112333333333444411........22222334441444444345534445yWY3344......',
      '..............87733334333332233334532225555YYWWW666YYYY553444455333111122211233443334444447.......21222334441344443344334446yYy42444.....',
      '..............8813333443333223333333222244566YWW6666677554455333331111112233223444443333347.......11222334441344644434354556yYy42444.....',
      '.............78813334442332223313333222224455YWW9WW7666644455435531112111233333444444332221........223333444234465443355455YYYy42244.....',
      '............7771133344424333313133232422233355WW99Y7655554545445541112221123333444334422221........23333334423345544335545YYY5543244.....',
      '............77721433444443322132242334433333355WWWY75555545455554411122221223333433344444444.......43233334422345545355556YYY55334455....',
      '..............2244334444433221322413345442233456W9Y75554445455554411122222222333333334444444.......43223334422345555355556YYY55524555....',
      '..............3332333444432332313212345542234456Y9Y775544455655544112222221222233334444444444.......3223234422234455555656YWW55525555....',
      '.............33322334444332322113212345544333444Y99775554444655555111222221112222224444444444........223223342334455665644WWWY5544545....',
      '.............33323334444433322213312345544334554Y9Y555455445555554111122222211222123333444444........222222242234454YY7745YWWY6543544y...',
      '.............3322333444443332221321134664443455499Y555455545555554411111122222111122333443331........222222233233344YY5545YWWY6553522y...',
      '..........8.3332223444444433221132122yy55444355499YY55555555555445421111122222223222333333111.........22222233233444Y54455YWWWYY555655...',
      '.........88773322344444444332211221234354345355yYWYYY666Y444466445521111111222223322231111111..........11221332234445545566YYWWY666655...',
      '..........7743223333234444432221221234354355355yYW9WY666Y444455555551111111111113322221111111...........122133313344554456666YYYYYYyyy...',
      '..........4442225333234444222222121344454555555YWW9WYYYYYY44555555552211112112112212221111111............51123213344554455555yyYYYYYyy...',
      '..........433322533333444422222212134yy44555555YWW99WWYYYY444566YY554111112122212111111111111............5112321344555455555445Y9WY664...',
      '.........33333355333335554432223111333y4465555YYYWYYYWWWWYY66566YY44441111112221122111111111.............8822331333545555554445Y9WY564...',
      '........3333444553334555444321131123323y465555YYWWYyyWW55YYYY566YY77551111122221121111111116..............222222234444555554456YWWY555...',
      '.......33334444444334455433321221122423yYYYYYyYWWYY55yy54YYYYYYYYY42551111122221121111111116...............22112233445555554456YWWY5555..',
      '.......333333444332334443331112111124222YWWYYyYYYY555y4444YYWWW5554223311112222211111111131................221223334555445444455WWY44255.',
      '.......33333444332233112213111111111332344WWYYYYY5533344244YWWY554422345511111221111111113.................221222234555444444455WWWy3245Y',
      '......2233344433322221222131111111113113433WW9YY444333442444WWY554444445511111121122111153.................221144224554433344555WWWy3445Y',
      '.....32233443333332222211111111111223114434yW9YY4333355522244WWY55333335441111111121111153.................3345442245444344444222YYyy445.',
      '.....32222333333312222111111111113333314yy4yWWY44333344444244WWY5555334444111111111111111.................33345544344334554443222Yyyyyyy.',
      '....442211123333312211111111221133323334yyyy9YY4433322444555YYY4435444444431111111111111.................333555544344445555223442Yy3yyyy.',
      '....41112132333322221111111111113332333yYYyy9Yy4333324444555YWW4435554443331111111112211................33455555554434555532444YWWy34Yyy.',
      '....41222233232222211111111111114335522yYyyWWYyy5443244445544WWY55554444433111111111211...............4445455555543335575535544YW3324Y11.',
      '....44222223222222211111111111114433322yyyyyWWYy54333255445442YY55554444444551111111111...............355555555444335457722554YYY3225111.',
      '....432222222322211111111111144144..YYYyy5yyYWYy44433244445552YYY5554554334555211111221..............234554455554445544471155WWYy3115331.',
      '...333222221332221111111111214444....Yyy4544YWYY4553343444554455YYYY45553344452222222222.............234555555555555544455yyYYYyy3255331.',
      '...333322221111111111221111214........yy4444YWYYyy533434444554555YYY665432444523322122233............133333334455555555555yYWYY553253331.',
      '...33331111111111111122122222.........44444yYYYYyy3334446645534453YY665432222222211133333............1333333223355555444555YWY664223244..',
      '...3333211111121112111112222..........44454yYyyyyy3333446545534443YY3555222223222221223322...........1355333222555555544533YWYyy4233244..',
      '..4433321122222111221122222...........4445YYY4555533334455445334446Y34555212332111332334222..........1553331114544555555434YYYyy4233344..',
      '..2223344443322112221121155...........4444Y554455553444555444333346YY445541244221144433444433.......33555331114554455555444YY55y3233343..',
      '.2222555544332222221121211.............334Y544445533444555554433366YW4555412455211144444443333......35555311111555655555444Y555y3233233..',
      '6644455554434211122222122..............334Yy443555334444554554434666Wy5544124553311224443332224.....4555531111111566555554Yy54553355221..',
      '4443322224534333322222211..............33yYy553555344454554555334666Yy5533122455344111443334444....14555331144111445555664Yy54453554221..',
      '1144455445533353322222211..............33yYyyy5554433455555444223366Y441311124553411113443344411...14455322431111444555664Y444554444221..',
      '.144455545533355522224411................5545555544344555554432223333411111114551111113331111111....22333124311114445555444445555454222..',
      '.1554555466413555411444411................5455555555545555553322223331111134144111...5555............3333134415533345555444445555455222..',
      '..554551455413555411334411................444545555354433555334422333333333411111.....................233134415555444455244444552455444..',
      '..5145515444135444133344555...............33334445333223222113444311333333341121......................2331345553333333222244556424554446.',
      '..3155515444135554111345531...............3332444433311322321342133333335334132.......................2331345543333333242224566413311446.',
      '..3155115555133444111113331...............3332223322211212321332113555335434331........................22134444553333124112455331332222..',
      '.11122113444113441133111111...............3332211322211211111333213555345442231........................5553344443332211111341131122112...',
      '........33341122211.......................3433311132431113322333213354445432222.........................55333442233321133332112211222....',
      '..........................................3433311133432212332333311344445531111.........................553111122221111222321111111......',
      '.........................................5333332222342221233233331113344441133..................................2221332222244............',
      '........................................5511122221232221113333331111333311111............................................................',
      '............................................111111111211111333311111122211111............................................................',
      '......................................................445511111111551332.................................................................'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ==== apev6 完 ====
  // ==== krakenv6 ====
  // ---------- 領主體・深淵王蛸 v6（2026-10-17 作者的新參考圖：立在觸手上的巨大章魚：高聳的三角頭套、深藍紫的身體帶紫色亮面，八條觸手往外捲，觸手內側一排排大白吸盤，兩眼發橘紅光）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～5 深藍紫的身體（暗→亮）、p P 紫色亮面、w W 白吸盤、z E 發光的眼睛。
  HD.kraken = hand({ w: 109, h: 112, pad: 4, breath: 44, eyes: 'E', spikeOn: '45',
    pal: () => ({"1":"#0E0B16","2":"#1A1426","3":"#271E3A","4":"#362A50","5":"#4A3A68","p":"#5A2E8A","P":"#8A4ABE","w":"#B4ACC4","W":"#E2DCEA","E":"#FF5A2A","e":"#B82A14","z":"#08060C"}),
    rows: [
      '.....................................................55..............................................',
      '...................................................4443333...........................................',
      '..................................................144433331..........................................',
      '.................................................11222322111.........................................',
      '.............................................22111222222222222222....................................',
      '..........................................22221111222322211211222....................................',
      '..........................................11111112222322221211111....................................',
      '.............................................111122233522221111......................................',
      '..............................................1112222552222111.......................................',
      '..............................................1121122552221111.......................................',
      '..............................................1122222222231111.......................................',
      '..............................................1222443322333111.......................................',
      '.............................................11112423443322211.......................................',
      '............................................512233223433322211.......................................',
      '............................................5111312335333323311......................................',
      '............................................1111113345544321311......................................',
      '...........................................111111334444333211122.....................................',
      '...........................................1111113344444333211111....................................',
      '...........................................11112323334433332211144...................................',
      '..........................................4411223233354333332112444..................................',
      '........................................55411112223455443322211222444................................',
      '.......................................35221112223344544333321111114444..............................',
      '.............................555544221333211122233334444433222111212244111111........................',
      '..............................33144421123111122333344544333233111222211111122........................',
      '...............................11111222233112222233455444333221112222221111..........................',
      '................................112211222211112233344444333322111122222111...........................',
      '..................................211111221111223333444433332221111222111............................',
      '...................................1111111112222223444443333221111121111.............................',
      '....................................11111111221223344554333321211111111..............................',
      '.....................................111111122123333454432322122111111...............................',
      '......................................22211112123333554442332121111111...............................',
      '...................wwwww..............2121111112333445443322221111111................................',
      '................ww35544w54.............121111122233445544332221111111................................',
      '...............4ww355455545ww..........11211112223344544422122111211.................................',
      '.............w444444443344554..........11211112233334554432121111222.................................',
      '............ww3344221111244544.........11211114433345554433331111122.................................',
      '...........ww334442111112114444.........1121114333445544432331111122.................................',
      '...........ww333311111...112444.........3321133333344P4443233111222..................................',
      '...........443331111......12444..........332235332244P443333433122...................................',
      '..........553322111.......11333...........22225333244PP5433443111....................................',
      '.........ww51221111.......12232............1211143444PP5434541115...............42www................',
      '.........ww1122211.......553322............1111143344PP4424511115............224422255...............',
      '.........551122211.....52553112...........11111113444PP4421111111.........55554443444433.............',
      '.........552222213.....5255311...........1111eEE11455Pp4431EEe1111.......4445543332444333............',
      '.........552222213......51111.........1121111111114444p343111111111......44442222222222233...........',
      '.........552223211.......555..........1221111133314444p33311322121111....344111112222222333..........',
      '.........552223311....................1111111133333344p322333211211111..33411144443111113333.........',
      '.........5542233211..................2212221111233333433333222111111111223415544443441113333.........',
      '..........44222221111...............22222222111233334333333311111111112522215544444441112233.........',
      '..........442222222111..........3322222111231114433343332333111131111325133355555444444112222........',
      '..........55422222311111.......33332111111431114333333332335331133113321122255555544444112332........',
      '.........5554445533331111.....3331121111144113443333331333454331133112252222255555544441123221.......',
      '.......55354444553333333311..1231111111334311345433p3313334543311133122552222555555544411122211......',
      '......553355555555553344311111221111111344311455433p3313313555311233112252233335555544411122211......',
      '.....3334455555555544233321221111ww1112333213455422pp3133135544112231112221113355555445522222255.....',
      '.....3455444444445554222322211111112112332213444433pp113p134554411231111222122354455555522222155.....',
      '....33443322211224455441222222232222114431113344323Pp413p224554311223111112222344445555512222115.....',
      '..1134333224411454445441122222233311134331113444323PP414p233455331223311111112444444555412222215.....',
      '..1144333225511454224431122222333111134311114444442P5514p23445533111333211111144444455541222221......',
      '..4443335522221144233331121122221111143111114544442P5511p23345533211334215511123444445511222225......',
      '.22433335522222444443332121122111113343111145542244PP512p22444554211134222411123444444433111225......',
      '.22433333222222444333432111111111113322111345542234PP512pp1434454441122211411111113345555511525......',
      '.2243555322222254444342211122122111332121133444223PPP511pp13334555411112211111111555wwww5555525......',
      '.2243555332222555444322221122122211311121135533223PPP511pp1333445551111122111111555www555555555......',
      '.2443355114225555542222211122112233211111335432233PPP511pP114335555541112221115ww55w55555555555......',
      '3244335554444335554411211111112223221111135544233pPP4411pPp144245554441111115555555w555555w55555.....',
      '3144555554444333344222111111122221111111555333441pPPw511pPp1112454555544555555555555554555ww455555...',
      '1133555554444333333212111111332222111115554433441pPPw511pPP1114454555555555w55555555554544ww455544...',
      '1222555555444355322111111155w55555511155554333511pPP5511pPPp111P225455www5ww55555554451335555555522..',
      '122233334454111512111111155wwww555555555554333511pPw5511pPPp111P22445555555544555555111115555555522..',
      '13223335555511121211112555wwww5555555544433333311pPww5111PPP111123333444455554555551111111155WW55222.',
      '.33555555551111222111125wwwww5555553344332333311pPPwww111pPPp111233334333333555551111111111wwww55522.',
      '.43555555511111221111155www5555555433433223pp111pPP55511pppPp111133334322444554551111111111wwww55532.',
      '.43555551111112211115555ww555535544333333441111ppP55511122pPp31111155444554455411111222114431ww5w4322',
      '.2225555111111221111555www555535544433444441111pPPw5541122ppp31111115224554155111111122113331ww5w4442',
      '.2222ww551111122211155wwww554533114433443111111pPPwww41111pp433111111111554111111111111114433wWWW4444',
      '..222ww551111122111555ww55ww455111113444311111ppppw55111133p43331111111111112121111111114445wwwW11224',
      '..222w5551111111113555www55ww512221114pp311111pPpp441111122p33333311111112122221111111544445wwww11223',
      '...4555551111111113545555555w512221111pp311111pPww551111111p3344443111111222222111144454444wwwww11223',
      '...45ww55p2111111155455555555511211111pp3112ppppw5551111111ppp44553411111222211113444444444wWWww11233',
      '...44ww45p222221115445555ww5551133111333p112ppppww551111211ppPp4454451111122112433445444554444wwW1133',
      '....422455223322114455554wwww51113111333p122ppPP4444111122144Ppp335455411122112455545445544444WwW1333',
      '.....55555533331112215554wwwww11111114422133ppww55111111222455pp33555541112211245222224444wwwwWWW122.',
      '......55ww55333111211555555www11144444421233p55w55111111222115553pp55541111112111111224444wwwwww1122.',
      '......5ww55533221111155555555111122444411233355555111121111111455pPP5541111112111122222233Wwwww41122.',
      '......55w55551111111155555W5555112211111115ww555511111211331224455ww5551221211113311222223WW55w44234.',
      '.....211155552221111155535W5wwW11111221111555555112111111332221115ww5p542212222133322211222555533234.',
      '....2221255552222221155535wwwwW11111111555555551122111133432211115ww5p54221222111221111115555553324..',
      '..2222212555555521121255544www11122331555444555112112255543322311www55542212221111111144wwww5ww3224..',
      '..22422115555555533232225443wwww11355555555551111211533555532231155ww4542211233333333444Wwww5Ww122...',
      '.134422211111555532233223443wwwWW53555555551111112555555555355314www44533122123345545555WWWWWW1122...',
      '.133332111111555531122223444wwWWW52533355511111115554255555355354ww555531111123344345P55555ww12122...',
      '.153322113132555521122553344wwW555255511111111144554421555555435WWW555532122ppp333335PP5wwwww121122..',
      '33532244133325555222222223331WW55www55ww111111144w54111555555445ww3333222122pppppPPwww55www442211144.',
      '33532111333325555522212222231335555555ww111111111www1112255555ww5544322323555555pP5ww55wwww332322134.',
      '53322111133WWWWWW521111222233335WWW555wWwwwWW1155www1111211115ww522442332345555ww45ww55wWWw223311134.',
      '5333211113WWWWWWWWWW111133222332WWwwwwWWwwwwwwwww555ww332115www443333222124555555455ww55552114451134.',
      '55333311333WW5555WWWww1133322322WWW555wwWwWWWWwww5555ww55445www4433111211222235554555w55222224452244.',
      '55533444335555554WWwww1122223222111115WWW44WWWWWWww55ww55wwwww442221155ww2221355545www11222225555544.',
      '.5555433355ww55w44wwwwww2244322221122221122222222ww5www.5wwww33222331wwwwwww11555115531125553555554..',
      '..5555555555115w44..wWww2221113333222221111222222wwwww...55ww312222WWW....ww555111111355wwww331111...',
      '..554455445111554....Wwwww5511322223321115555551111www...wwww311wwWW.................................',
      '.......5445.............wwwww11211111555wwwwwwwww11155...www2211wwW..................................',
      '...............................................ww1115ww..55ww22wwww..................................',
      '................................................111153w..w55wwwwwww4.................................',
      '................................................555553w..w555w55ww544................................',
      '...............................................5555555....555555w5555................................',
      '.............................................................55544115................................'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ==== krakenv6 完 ====
  // ==== wolfv6 ====
  // ---------- 領主體・棘背狼 v6（2026-10-17 作者的新參考圖：壓低身子的灰白巨狼：身上深色斑紋，背上一排往後斜的骨刺、刺的根部帶紅，長吻、臉上一道紅痕，四肢細長、黑爪）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～6 灰白的毛（暗→亮）、7 8 骨刺、r R 紅痕、z E 眼睛。
  HD.spikewolf = hand({ w: 129, h: 110, pad: 4, breath: 40, eyes: 'E', spikeOn: '78',
    pal: () => ({"1":"#141214","2":"#2A2628","3":"#4A4446","4":"#7A7270","5":"#A8A09A","6":"#D6CEC4","7":"#D8C8A8","8":"#F0E6CC","r":"#6A1A14","R":"#A8321E","E":"#FFB040","z":"#080606"}),
    rows: [
      '...............................................................777.......................................................',
      '................................................................777......................................................',
      '.................................................................5547....................................................',
      '.....................................................5544.........5477...................................................',
      '.......................................................45888.......5588..................................................',
      '........................................................55888.......55RR.................................................',
      '.........................................................54488.......5Rrr................................................',
      '..........................................................4454R.......RRRR...............................................',
      '...........................................................454RR.......4R77..............................................',
      '............................................................555R77.....45777.............................................',
      '............................................................55557777...457777............................................',
      '............................................................557577666..55777766..........................................',
      '............................................................557757r67.555777666...R......................................',
      '.......................................................66...555557r777557777766..5RR.....................................',
      '........................................................777.555555RR775577777666655RR....................................',
      '.........................................................7766556655RR75575577666665RR......7.............................',
      '........................777..............................5555r55445Rr77575577766765555.....7.............................',
      '.........................7777...............66.....577666RRrrrrrrrrRrr357557777675555566...55............................',
      '..........................4477...66........554.....55577RRrrrrrrrrrRRr377rr7777675555666...477...........................',
      '...........................444r..666.........44...555577rrrrrrrrrrrrrrr7rrrrrr567755R6666.4477...........................',
      '...........55777777777.....444rr66566.........4444555511rrrrrrrrrrrrrrrrr1rrrr5658rrRR666665777..........................',
      '...............335577777..66555r5557766......5444775111333rrrrrrrrrrrrrrr1rrrrr458rrrr655665577..........................',
      '.................544447777666555555777666633555333555555577877rr111111rrrrrrrrr4587rrr6744655776.........................',
      '...................44444777665555rr777665633555553554455447877111111777rrrrrrrr4777rrr674r555776.........................',
      '.....................4544775555555rrr4665631115551177444445555111777777rrrrrrrr2777rrrr66rr55777.........................',
      '......................555575rr1155rrr4rr1662211111337731444555441778877rrrrrrrr2777111r66rrr47777........................',
      '......................555555rr1rrrrrr441112111111111173144117774444887711222rrRRR775211111r445777...5....................',
      '......................5544rrrrrrr1rrr431112221111111177441111774433117711111rrRrr775211441r4457776665....................',
      '....................66644rrrr44111111431112222111111111411115577411127711111rrRrrrrr117r41211577666657...................',
      '................777776rrrr1rrr1114111122222222111111211111175211411121111111RRrrrrrr117r2121157r666657...................',
      '.................73343rrr1121111142112222212222133212211111752111111111177rrrr1rrrr7166r2121157r676658...................',
      '.................55543rr666211222221223322111111132337711111121111111111777rrr11rrr71rr22222rrrr775658...................',
      '................5555411rr4411222222222223321112214433711114442111222211177771111111711r22212r11rr555786..................',
      '...............55555rr1111111133222233222221133255447711554441112222221177771122111111222211111rr555786..................',
      '..............RR7773rrrr11122333212232222211122254447711774441111122221337771221221r1112222211111447776..................',
      '............RR44433311111222233211112121111112255445557744411111122232117777R221111r11122222111222777766..7..............',
      '.............444551111111323333221112111112122255542557447511122122332111177R212111rr1122222222225777766667..............',
      '.............44555r2111113232222111111122222222555522774475111123233332211177112111rr11123323222255rr776677..............',
      '.............5555rr21111111122221211111233244455551177777711211233333623311171111111r122122232222rrrr155587..............',
      '.............55555521111222223112211111234244333221161155111221233113677221111111211r2221233222222rrr155587......7.......',
      '............777711121111122233112211111114345334422161117111221113333677744211111222122222232222121111558876....77.......',
      '...........7777111111112211223334211111113345445111122117141111113323377744211111222122332221221111111557776....77.......',
      '..........RR4431r111111221122443431111111333444531532111714211111442135774432111112222332222121111331115557667787........',
      '.........rr5553rrrr12211232124333311111112133315315311116122221114551357774321111222222323321221112221rrrR7667784........',
      '.........335555rr1114211332124433421111122113311114111116113311111155557754422111222223323333311112221rrrR7777774........',
      '........5555555511114211333122522421111111111313114321116111111111345557755442211222223322223221113321rrrr7777774........',
      '........6655544111124211155112511421112211111333114322111111111122345557775444311112223322233221111321rr2r7775776........',
      '........6575441111124411135533311422112222111233114332111111111122444453375544322122213322233222111331222r7775356........',
      '........357742111112241223553331744311222122122231133112111111111122356577554431112221132255332221132122227775355........',
      '.......3377722233212244223477335744331211111112231131112111111111112356577754331111221113355532111112112225575555........',
      '......44774333232212234222477225575331111111112221111111111111123322355577754343111111111155533111111112325r777555.......',
      '.....555744333232312234222557221575331111221112122211111111111123333457777554543111111111155542123211122322rr7755........',
      '....55555543333333111142255577715754421111212221112221111111111446634447775545431111133333255421232133332222r5575........',
      '....5rr5554455323211214433577777775542111222222111222211111111334662245775555522111112233323542223244333222255575........',
      '....rr55554454322222212333577777775552122222222212222111221111344366245755335521111111113323554222272233333rr7777........',
      '...rrr54454454222222222233377777776553122222222211121111121111344366555544444422111111223223554455577332233rr7777........',
      '..4rr554755522222222222233357777766753122222222222222111122112344666655334554322111111333221157875557222r333r35774.......',
      '..4445577544232122222342333557877667541222222222222222122122123346655243445533211111222332111178777772r2rr333357744......',
      '...444575533331122322343333447876657542223332222222332222111122266644245544211111111111122216777777442rr2rr33333774......',
      '....4r5751124222323344433334457876555422233323333224442112211211664435664442111111111111212167755777777r21r33333777......',
      '....4r7711224222323344533333557876654422233323333....11111211314444335664422111121122211111111155777777rr1111332777......',
      '....r7722334421222333555332255777775532233332323......11331123144335555434211212211222222221111557774577r2zE1122777......',
      '....r7723334421332533546622235577777532223323323......11122123333365544431112211111222222222111335554577r2111111777......',
      '....55333324323332533344423334477747222233323334.......1163323443364442221111111123333112222111444555377rr221111133......',
      '....55333324323332533354423333447744312333223334........363113446644332111222222223331111333344444454333rrrr1111133......',
      '...44533333333333253335555335544774431233322323.........33315545553322111122222221113111133333223334444433331111113......',
      '..44444432243333334433357733554477443122332232.........443345522266611114443333321112121322333433334344665777rrr773......',
      '.44444433124333333444447777755447774312222223..........266345522226671114444333331122122322244466333334115457r7r777......',
      '.54443443114333333444444774445444774422233............2221335522226677114444331111121122233345655333333111457R77777......',
      '5554534431133333225544443345524444444111................111115223266775444443111122221223334456..555333311155R777777.....',
      '554454543333333222422rrrr7754254433111...................1411144322177544444422222222211233444....55533331111R7777774....',
      '.44444533443553322422255663444552221......................441122322111664444422222222222233344.........33111147777754....',
      '..445543333355322211225553333233222.......................4433123311111554444222222222322223444.........31111447775555...',
      '..r665435633553311114443333332211...........................111113331111144444222222423322222555...........11447777555...',
      '..r65544565355222355444433333222.............................11112221111224322222222422322332244............2255777555...',
      '..474444455355266333444332223222..............................11112212213333222222222233222332244...........21477772322..',
      '..474444..3311133333433332223233...............................43122222rrr33332222222222222333244............14455523211.',
      '..44444....311133333333322223333...............................4312rr222rrr52244442222222223333345...........111155211113',
      '..55344.....11r3353323...22233333................................1222222rrr552444442222222223333355...........11111111113',
      '..44333.....rrr455322.....2233333.................................11142222r5524444442222222222334455...........111111111.',
      '..44333.....rrr444222......2333334.................................1142222rrr334444452222222222344455..........1111111...',
      '..443......22r5552222.......333334..................................2222233rr5544455552222222223344555...................',
      '..43.......111554222........3333444..................................2rr2222255444555577222222223344555..................',
      '...3.......1r155422..........3334444...................................222223354R47557777222221133455444.................',
      '...3......11r55532...........22344444...................................22523344RR7777774222222223444444.................',
      '...3......11155532...........334444433..................................33523322RR7777744422222222334455.................',
      '...3......22155422...........333344333333222...............................rrr221r77777444222222222244455................',
      '..........2255542............33324433334443223..............................11221r7r5554222221122111444555...............',
      '..........2455542............3332333322322333322.............................1113rrr47772227111111114444555..............',
      '.........33455542.............11223322232222232111............................113111457752777111111334444555.............',
      '........344555542.............11223323222222222111.............................131114577577773311133344444555............',
      '.......5133524431................25223233222441111..............................22rrr557777733331133331144555444455......',
      '.......51335255311................5211111112221111...............................111r4557777333333333111443334444555.....',
      '.......4444r1113223....................5511555...................................111145577744333666331224444344555555....',
      '.......4444r13332633..............................................................1114555777444466666112224444422555322..',
      '.......1134413331633..............................................................11115557777444666666122233452222553222.',
      '......11134413331411...............................................................1111554474444444444..2234451112221222.',
      '.....111332212231411................................................................11113444444444444.....22211112221222.',
      '.....111133212231221................................................................33433344444444444......221111122.....',
      '......11111111111221................................................................224333334444424444...................',
      '..........1....1....................................................................22223333331442233111.................',
      '.....................................................................................21131111114422421111................',
      '......................................................................................1131122214411421221................',
      '.......................................................................................121111114411111121................',
      '........................................................................................211113311111111244...............',
      '....................................................................................................1....................'],
    ol: { '*': ['#141210', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ==== wolfv6 完 ====
  // ==== vulturev1 ====
  // ---------- 領主體・緋喙屍鷲 v2（2026-10-18 作者的概念圖，沙漠的新領主體：像人一樣站著的巨大屍鷲——光禿的紅頭、頭頂一撮白羽，黑紅相間的大翅膀垂到地上，翅膀上一條條淡色的羽軸，紅色的長腿和爪子）----------
  // 概念圖本身就是像素圖：照它的像素格（2.4 倍）每格取中心點、配到最近的顏色（細的羽軸才不會被平均掉）。光從左上來。
  // 字：1～5 黑羽（暗→亮）、6～9 淡色的羽軸和頭頂的白羽（暗→亮）、r R S 紅色的頭、脖子、腿。
  HD.carrionvulture = hand({ w: 142, h: 131, pad: 4, breath: 53, eyes: 'E', spikeOn: '89',
    pal: () => ({"1":"#0C0B0D","2":"#17151A","3":"#242128","4":"#35313A","5":"#4E4954","6":"#8C8478","7":"#B0A898","8":"#D2CAB8","9":"#F0EADC","r":"#5E1210","R":"#9A221C","S":"#D04434","z":"#080606","E":"#FFD24A"}),
    rows: [
      '.............................................................2....222222222223.222.22222222...........................................',
      '............................................................2223.222322222222422334413322223..........................................',
      '...........................................................2111124457888777788148859688444441.........................................',
      '...........................................................2111331144444466998989998899594441.........................................',
      '..........................................................23113332244444469889998SSS999889441.........................................',
      '.........................................................211333333444444665889SSSSSSSS8998441.........................................',
      '........................................................211133332444444676488SSSSSSSSSS998441.........................................',
      '.................................................2222222211133324444666676898SRSSSSSSSS598441.........................................',
      '................................................223344444113333244446444429RRSSSr38rSSSR5811..........................................',
      '...............................................3323344444133333444444444223RRSRr11rRSRRSR1............................................',
      '..............................................22333333432333334411111111111rRRSSSSSSSRRRr1............................................',
      '.............................................222333332411333224411111111112rrRSSSSSSSRRrr1............................................',
      '............................................2222333331122333221114444111114RRrRRSSSSRRRr11........2...................................',
      '...........................................22222233331222132111185464112224RRrrRRRRSRrr51........241..................................',
      '............................................1111113333122132111787664444444rR2rrRRRSRrr11.......22411.................................',
      '.............................................22111333311122224777778844444444222rRRRrrr13.....22223111................................',
      '.........................................22..22222333311122244777778844444444221rrRRrRR1......22223111................................',
      '.......................................22211222222334311121144778884444444444111rrRSrRR1.....222223111................................',
      '......................................21112122222333411112444477777441113445511122rRrRR1.....222233111................................',
      '......................................233221312223333111124444774332211133rS511122rRrRr1....2111133111................................',
      '.....................................223333311222333111111114445333221122222211112rrrRr1...22221132211................................',
      '....................................22233333122223331111111124443333211222222111112rrRr1..222221132212................................',
      '...................................2222233333333133311111111124rRrr3111111222112112rrrr1..2222111321..................................',
      '..................................2111223333344114331111133312rRRrr111224112222211122rr1222222111111..................................',
      '.................................22112243333344114311111233rrrrRRrr1112241311222111123322111111111112.................................',
      '.................................2222224444423321411111223rrrRRRRrr111124133212111211222211111111111113...............................',
      '.................................2222224444423331411111233rrRRRRrr2111221133212111311112221111111111111...............................',
      '.................................22333211243233324111133rrrRRRRR211221331122222111311111211111111322221...............................',
      '................................22222221113333332111113rrrrRRRRr1112132221666111113311111111111113212211..............................',
      '................................2222222113333333221111rrrrRRRRr11112132222776666433311111111111112211121..............................',
      '...............................22231122233342221111111rrrrRRRrr111111221118887666654111111111111112112221.............................',
      '..............................2222322222333422211111123r31RRRrr211111111118888666664221111111211112112221.............................',
      '.............................22222222223333422222111132221RRRRRRr21111SSSS7558888876621311111211112111221.............................',
      '............................211112111123334222222211132111RRRRR44444444443344441888876661111111112211122211...........................',
      '...........................211112211223334212222322111111RRRRR544444344444333411148887666111111112211122111...........................',
      '...........................211111111223344222222222221111RRRRR1111133444123333111145887666111111112211212113..........................',
      '...........................211111111123343222222222221111RRrr211111234421123321111148887666211111122222122113.........................',
      '...........................222111111123422214222223322211RR11122111222221111111111114458866611111122222222211.........................',
      '...........................2221112133311222222222222223222r11122111222222111111111416666666641111232223222211.........................',
      '...........................2111111133332222322222222232221111122111222221111111114416666666644122222222222211.........................',
      '..........................22222211122222332222222222322221111122111222221111121344446666666644422322222222211.........................',
      '.........................222223312122222232221222222222221111111111222211111111344446666666644422322222222211.........................',
      '........................2222233313233142123222222222222221113311111112111113311111146666666644422322222222211.........................',
      '........................22222322233225142221322222222222211133111111122211333333332466666666444222322222133211........................',
      '.......................222222222222212422222222222222222211133111111222213233333332466666444444222222222222211........................',
      '......................222221112222133225223422222222222211122211111121112222333333rRR554444444422222222222221113......................',
      '......................22222112222212r21532242221222222311112211111111112222113332rRRRR544r4444422222222222222211......................',
      '......................22222123332122252144212222221253211112111111111333222113332rRR7774rr44434222222222222232111.....................',
      '....................22221112223321532r5211421222222222211111111111111322112441324rSS777rRRR5rr5222222222133222111.....................',
      '....................22211222223424r5r125114222222222222111211111111132111114411244SS666SSSRRrRS2222222212222212111....................',
      '...................2221223322421215rr31S2222221222222221112211111113321111112212444SSSSS766RrRS2222222213222222211....................',
      '...................222122222241121Sr2RrS2212222122222221111211111113321111111211244SSSSS7666rRS22222222122222222112...................',
      '...................222123212231121S22rSr2321222215r22221111211111113221111111441111R4rrS77776RS22222221222212212311...................',
      '..................211123321241222Sr551S21122122221rr2221112222121112222211322413332Sr44S87776rS22222112221122211211...................',
      '..................21112333321222SrRrrRrr22222122221r2221122221131122222213333133332444rS8777SR2S22221122211221222111..................',
      '.................211133333331211S1S11611221221122222r52112221113333222221333333333244rrR854RSS1SS22211221222232222111.................',
      '.................21133333333121rr2Rr3531221222122222152112221113333222212333333333344rr58444SS1SS22222221232132122111.................',
      '.................2113333344241SSr91SS2S12221322122222Rr112221113322222113322233323444rrr4444RS1SS221222213321311221111................',
      '..................1134r4411331RR291RR2S2112122212222212111221111211122112233313333144rr24711RS1SS221222132212211212111................',
      '...................2rRRr3123232373Rr3524112212221422212111111111211111111142113333244rr23711rS1SS22122212221212321111.................',
      '...................2rRRR1241121181R2281422121232142222111112211112222222222111333324r4rrrr11441SS2212221222121331111..................',
      '...................rRRRr1Rr112245r533324221222221432221111122211122222222222112333244RRrrr22441RR2212221222221331111..................',
      '..................2rRRR1rrr121882S18824122122222214422111222222112222222222221133321RRRrrr333415R22122212113213313111.................',
      '..................2rRr11522311881S17714122212112214422111222222212222222222221132211RRRRrRrrr414421422122112122213111.................',
      '.................2rrRr121122182151922414122122122212221112222221112222223222211322121RRRrRrr4414421322122112122121411.................',
      '................2rRRr112122278218191171411212221221rS2111222221144r222222222211222121RSSRRRRRR144213221222221211213111................',
      '...............223Rr111213327824649117141121222122115211222221114452222222222112222212SSRRRRRS1442132212122212112131123...............',
      '...............2234133412221819927911712112212212212321122221111444322222213311212422226RRRRRS1442152212122232112131121...............',
      '...............22341441342128199182882412212122212221411122211114444222213222114222173126RRRRS1442152223122141221313311...............',
      '...............22423441322122788181881412212122212221411122211144444222132222112122233161RRSSS1552132232122141221213311...............',
      '..............2331142234112318747248814122122122122214111211124444442123221331112221422392S6SS18821311421221312212133121..............',
      '..............24411411441126281191454241221221121222441111111344444421SS221SS1124321422492666S166213114212213122121221212.............',
      '..............244114114112227812914224221121211212rrRS1111114444444421S5221SS2142224212731667S15521R1141221131331221221311............',
      '.............2321121444111218177814114121121211221rrRS1r311444r4244425r221R321221142199218227822281R1141211214112121131311............',
      '.............2122114331321178178271444121121222221rrRS13311444RS14741Sr225r2122124212123117779212S1R1141211214112131131311............',
      '.............2112314331221183788181892221122122233rrRS112324rrRS177814221Sr12R1rr2251122182473222S1R11413112131121311232223...........',
      '............221233243222227817867819912112221221rrrrRSr11224rrRSr77514224R21rr1R22r51222281431212S1611414212131122221141221...........',
      '............212231432222177818227819922122131221rrrrRSr11222rrRS777415119215Rr1rrr52122391771121281811414212131233133121221...........',
      '............223114431121188278224149922122131221RrrrRS311222rrRS44445211922R52S2SS214223182239111828114141121144131331212211..........',
      '...........2124114412221177182654143322122131221RrrrRS322111rrRS44467222817421S1SS1Sr3321822822117171251411231331313311411211.........',
      '..........221213441232112248816641222211221312322rrrSS211221rrRRS4444127215225rR2r1S13312188492222181141421231331412221311221.........',
      '..........221214441233112118816632211211222212421rrrRR111221rrRRS44441991141261R22rR23222283391222181142332231221422231322221.........',
      '..........222214441233112229927724211212112132241rrrR2111334rrRRSr4671992242251R1rR251rR2811413228181144143121221332131233121.........',
      '.........2223144412311142349168812111212112131131rRRS1111444rrRRS4464188281992141rS181rS1411419118181144122121221332131233121.........',
      '.........2221144412311141479186222112112112131131rRRS1111444rrRRSS6641882418825145rRrRR241442221122284441221211121311231221221........',
      '.........2221144113222224784681142132111122131121rRRS1114444rrRRS884318813188271661S1SS1414411833317212412212111214112311221211.......',
      '.........2211141113112114882681142133121222131121rRRS1114444rrRRSS54518812188181881Sr5R2414311922917722412211111214212311221213.......',
      '.........2111111113111114882681141133121222121121rRRS1111444rrrRS211818812199181881S81rR1411419219179914122112112133313122211.........',
      '.........211...11111...1822441772123312122121112rrRRS111144411rRS11178112142282422R2821S141132122381992414311211213331412221..........',
      '........2111..........21822441772132112122121112rrRRS311144411RRS11178112142281421R182164242221128222212133111112123313322221.........',
      '........2111.........211821441771131121122111331rrRSRr111Rr222RRS11112112142181311SR333581SS115118113218111111111213313311221.........',
      '........2112........2211824442881132121111111441rrSSr312rRR222RRS11112112142181324SR144182RR21S117114419111112111212222312221.........',
      '........21.....222..2112144417881131121111112441rrSS111rRRR211RRS11112112141181299rS14427SrrR1S11491551822111.111111221312221.........',
      '.......211....2112121118144217321312221111112441rRSS121RRRR211RRS111121121411741772826691S1r521221R2111114511...3212221232121.........',
      '.......211....21121.1111444278211311221122132441rRSS123RRRR111RRS111121121447441771781691SSS22112R221113122111...2122212331221........',
      '.......21....311112..211444273111312211333332441rRSS123RRR2111rRS11112111229914166638217RrSS1182rS112213111311...31122123312211.......',
      '........1....21221....11443262111313311333332331rRSS12rRRR1112rRS1111211121991312671833SS1RR1191rR21SS12212411....11122222222213......',
      '.............21221....21432242111313311333332221rRSS122rRR1122rRS11112111219911212916432S1RRR1911RR1SS21511411....21113122312211......',
      '.............2211..22227411141112111113333332111rRSS1233rr1122rRS1111211131991121191644291rRS18322S1rr21Rr211511...1112122312221......',
      '............21111.211227311131112111133333332111rRSS1233rR1122rrS11111211311321211582442891r62322192211Rr12211423...1121111122211.....',
      '............21111.311247211231111133333333332112rRSS12r3332212rrS11111221311221212591443282182112631132R111411RR11...111112322211.....',
      '............21113..11147211232111133333333332112rRSS12r3322211rrS11111221311121112491444187432312711992r211r21R511....11112312221.....',
      '............2113...21144111312111333333333322112rRSS12r2212211rrS11411221311121122292444178811911721991rR21rS166411...23111112221.....',
      '............211...222244111312113333333333212112rRSS11r2212222rrS11411221121121122189224178811911691991rS221S21172111..111..112311....',
      '............21...2222231223312113333333333213112rRSS12Rr212222rrS111112211212312221891128177219226922222S221S12711411........12221....',
      '............23...212222224422123333333333321311rrSSS12Rrr12222rrS111112211211321222391118177519312722182222Rr144118111.......222311...',
      '...........222....12222224412133333333333221311rrSS222rrr12222rrS111113311211321111192118247818324721442222S31341187213.......223111..',
      '..........2111....212221144121333333333322121113rSr1222rr12222rRS111114411211321112193114422821117119911912S81332178811........131211.',
      '..........2211....212221112221333333332232231124rS112225512111rRS1121144112113313321122112228211182199118112711113177911.......3111121',
      '...........213....212221111113332223321322231244rS111114411112rRS112213311212331332111111211821117818841773278111314782112........1121',
      '..................21222111111332211112231122144rrS112314421112rRS112112211122222122211111123344117917791788227221422441811132......213',
      '..................22221111111332111112231122144rrS111314441122rRS1111122211221321133112211331441189117817881172214223218111223......2.',
      '..................22111121113333111122231112144rrS112314441112rRS11112222112214211341223113314322882128218812822241441141244411.......',
      '..................22221121112222222331221112144rrS111114441111rRS11111112112214211221334113314222292124218827111711444111114411.......',
      '.................222221211122221112331121121444rrS1111114rr112rRS111111121122132111211332122212222813411821271116814441....11.........',
      '.................22222131112111111111111112122rrRS1111111RR112rRS222111221222132111121123122212112324411911179217714441....3..........',
      '.................213221311111111111111211121122rRS1111111R4111rRS222112231222132111121123122212112114411842179747733441...............',
      '.................2144431..311222111111211121122rRS111111121111rRS222222231233131221121123122121112119911289177882782241...............',
      '.................314111....111111112223333411rrrrRSR1111121111rRS2222211212223112212321223111311111188311444278814788271..............',
      '..................31.......21111111222333331rRrrrrRR111112211rrrRR21111111222211111111111111131111.1133111222888315881712.............',
      '................................11111111112rRRRrrRRRRr11111rRrrrrRR213..1111112...1111.....111111....2111111118851114888433...........',
      '................................3111111111rRRRrrRRRRRR13211RRRrrrRRr13..311112.....11.......11113.....111111113882111888441...........',
      '........................................22RRR11RRR11RRr112RRRr1RRRRRr1........................................12881.3111441...........',
      '........................................2rRR1321RR111rR11RRR11RRRrrRR511........................................11......11............',
      '.........................................311....1R1131122RR1..rRR11rRR11..............................................................',
      '..........................................33.....133....3113..31r1131123..............................................................',
      '.................................................1.......11....1433.11................................................................'
],
    ol: { '*': ['#141010', '#040404'] },
    face: {}, fx: [], fx2: [] });
  // ==== vulturev1 完 ====
  // ---------- 荒、獰、淵（variants.js 的分級變種）：手點的圖照同一套改 ----------
  // 顏色照 R.variantShade（荒偏紅變暗、獰更暗、淵幾乎全黑帶紫）；眼睛（def.eyes 的字）換成那一級的眼睛顏色；
  // 背上長刺：def.spikeOn 的字是一欄最上面的那一格時往上長（荒每 4 欄 2 格高、獰淵每 3 欄 3～4 格高）；淵的外框換成紫色的光邊。
  const variantPix = (def, pal, ol, L, t) => {
    const T = R.VARIANT_TIER[t], P2 = {}, O2 = {}, eyes = def.eyes || '';
    Object.keys(pal).forEach(k => { P2[k] = eyes.includes(k) ? T.eye : R.variantShade(pal[k], t); });
    P2['^'] = T.spike;
    Object.keys(ol).forEach(k => { O2[k] = k === 'bare' ? ol[k] : t >= 3 ? ['#8A4AE8', '#5A2AA8'] : ol[k].map(c => R.variantShade(c, t)); });
    const W = def.w, H = def.h, g = Array.from({ length: H }, () => Array(W).fill(''));
    L.forEach(([y, x, s]) => { if (y < 0 || y >= H) return; for (let i = 0; i < s.length; i++) if (s[i] !== ' ' && x + i >= 0 && x + i < W) g[y][x + i] = s[i]; });
    const on = def.spikeOn || (def.m ? Object.keys(def.m)[0] : ''), step = t === 1 ? 4 : 3, add = [];   // 沒寫就長在第一個材質（通常是身體）上
    for (let x = 2; x < W - 2; x++) {
      if (x % step) continue; let y = 0; while (y < H && !g[y][x]) y++;
      if (y >= H || !on.includes(g[y][x])) continue;
      const hgt = t === 1 ? 2 : x % (step * 2) ? 3 : 4;
      for (let k = 1; k <= hgt && y - k >= 1; k++) add.push([y - k, x, '^']);
    }
    return [P2, O2, L.concat(add)];
  };
  // ---------- 組成精靈圖表（兩幀 × 原本／鏡像），給 sprites.js 的 beastSheet ----------
  const cache = {};
  R.beastHDSheet = (id, role) => {
    let def = HD[id], vt = 0;
    if (!def) { const m = /^(.+)_v([123])$/.exec(id); if (m && HD[m[1]] && HD[m[1]].pix && R.variantShade) { def = HD[m[1]]; vt = +m[2]; } }   // 荒、獰、淵：照手點的新圖改
    if (!def) return null;
    const key = id + ':' + (role || ''); if (cache[key]) return cache[key];
    let frames;
    if (def.pix) frames = [0, 1].map(f => {   // 手點的
      let pal, ol;
      if (def.m) { const a = autoPal(def.m, def.x && def.x(role)); pal = a.pal; ol = Object.assign(a.ol, def.ol || {}); } else { pal = def.pal(role); ol = def.ol; }
      const L = def.pix(f, sculpt(def.w, def.h), role), v = vt ? variantPix(def, pal, ol, L, vt) : [pal, ol, L];
      return pixArt(def.w, def.h, v[0], v[1], v[2]);
    });
    else {
      const names = Object.keys(def.mats), M = {}; names.forEach((k, i) => { M[k] = i; });
      const ramps = names.map(k => ramp(def.mats[k]));
      frames = [0, 1].map(f => { const P = painter(def.w, def.h); def.draw(P, f, M, role); return P.render(ramps); });
    }
    const RS = def.res || RES;   // boss 可以畫得更精細（def.res＝3、4）：遊戲裡的大小照 w／res 算，不會變大
    const pad = RS, cw = def.w + pad * 2, ch = def.h + pad * 2, c = document.createElement('canvas'); c.width = cw * 2; c.height = ch * 2;
    const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
    frames.forEach((fc, i) => { x.drawImage(fc, i * cw + pad, pad); x.save(); x.translate(i * cw + cw, ch); x.scale(-1, 1); x.drawImage(fc, pad, pad); x.restore(); });
    return (cache[key] = { c, fw: cw / RS, fh: ch / RS, hd: true });
  };
})(window.R);
// ==== 領主體動畫 ====
// 2026-10-18 作者：領主體的動作（待機、移動、出招）。不切塊：用「骨頭」帶著整張圖平滑變形（每個像素照離哪根骨頭近，混合各骨頭的移動），
//   不會有切口、不會破洞；手臂另外畫一層蓋在上面。沒有自己骨頭的領主體用整隻身體的動作（呼吸、走路的起伏、出招前仰後撲）。
// - 圖：beastHDSheet 的第 0 幀當原圖；每一格四邊多留空間（手舉起來不會被切掉），一列原本、一列鏡像。
// - 做圖很花時間：第一次出現時在背景慢慢做（每做一格讓一下），做好之前照舊用原本的兩幀；做好的照 id＋role 存起來。
// - 換圖：保留原本看板的大小比例（每個像素一樣大），只是格子變大；碰撞（lordlogic.js 用看板寬度算）在換圖之前就算好了，不受影響。
// - 出招：lordlogic.js 每出一招 e.lastMove 會換，看到換了就播出招動作。
(function (R) {
  const T3 = () => window.THREE;   // three.js 可能比這個檔案晚載入
  // 骨頭（原圖座標，含 sheet 的 pad）：a 轉軸、b 末端、r 影響半徑；anims 的每一格：{ 骨頭名: [dx, dy, 角度], body: [dx, dy], lean: 角度, sy: 直向縮放 }
  const Z = (a, b, c) => [a || 0, b || 0, c || 0];
  const B = (o, bx, by, lean, sy) => Object.assign({ body: [bx || 0, by || 0], lean: lean || 0, sy: sy || 1 }, o);
  const RIG = R.BEAST_RIG = {
    thunderape: { mx: 0.24, my: 0.42,
      bones: { armF: { a: [113, 74], b: [124, 128], r: 16 }, armB: { a: [60, 84], b: [60, 132], r: 18 }, head: { a: [98, 58], b: [104, 32], r: 13 } },
      anims: {
        idle: [0, 1, 2, 1].map(k => B({ armF: Z(0, -k * 0.3), armB: Z(0, -k * 0.3), head: Z(0, k * 0.4) }, 0, k * 0.5)),
        move: [B({ armF: Z(3, -5, -12), head: Z(1, 0, 2) }, 0, -1), B({ armF: Z(5, -2, -6), armB: Z(-1, 1, 4), head: Z(1, 1) }, 1, 0), B({ armF: Z(3), armB: Z(1, -5, -12), head: Z(0, 1) }, 0, -1), B({ armF: Z(1, 1, 4), armB: Z(2, -2, -6), head: Z(0, 0, -1) }, 1, 0)],
        atk: [B({ armF: Z(0, 2), armB: Z(0, 2), head: Z(0, 1) }, 0, 3), B({ armF: Z(-2, -6, -25), armB: Z(0, -6, -22), head: Z(0, -1) }, -1, -3, -5), B({ armF: Z(-4, -12, -48), armB: Z(-2, -12, -42), head: Z(0, -2, -3) }, -2, -6, -11),
          B({ armF: Z(6, 4, 8), armB: Z(4, 4, 6), head: Z(1, 2) }, 2, 3, 5), B({ armF: Z(3, 2, 3), armB: Z(2, 2, 2), head: Z(0, 1) }, 1, 1, 2)],
        atkT: [0.28, 0.2, 0.42, 0.14, 0.3] } }
  };
  // 沒有自己骨頭的：整隻身體的動作
  const GEN = { mx: 0.1, my: 0.16, bones: {},
    anims: {
      idle: [1, 0.988, 0.978, 0.988].map((sy, i) => B({}, 0, 0, 0, sy)),
      move: [B({}, 0, -1, -2.5), B({}, 1, 0, 0, 0.99), B({}, 0, -1, 2.5), B({}, -1, 0, 0, 0.99)],
      atk: [B({}, 0, 1, 0, 0.95), B({}, -2, -2, -6, 1.04), B({}, 3, 1, 7, 0.96), B({}, 1, 0, 2, 0.99)],
      atkT: [0.2, 0.4, 0.22, 0.3] } };
  const isLord = id => { const d = R.ENEMIES && R.ENEMIES[id]; return !!(d && /^領主體/.test(d.name || '')); };
  // 2026-10-20 小怪（beastpix.js 的新點陣圖）也用這套：整隻身體的動作，飛的一直上下浮
  const baseOf = id => String(id).replace(/_v[123]$/, ''), isPix = id => !!(R.BEAST_PIX && R.BEAST_PIX[baseOf(id)]);
  const GENS = { mx: 0.14, my: 0.2, bones: {}, anims: {
      idle: [B({}, 0, 0, 0, 1), B({}, 0, 0, 0, 0.97), B({}, 0, 1, 0, 0.94), B({}, 0, 0, 0, 0.97)],
      move: [B({}, 0, -2, -4, 1.03), B({}, 0, 0, 0, 0.95), B({}, 0, -2, 4, 1.03), B({}, 0, 0, 0, 0.95)],
      atk: [B({}, -2, 1, -8, 0.92), B({}, -3, 1, -11, 0.9), B({}, 4, -1, 11, 1.08), B({}, 2, 0, 4, 1.02), B({})], atkT: [0.12, 0.14, 0.12, 0.14, 0.12],
      hurt: [B({}, -2, 0, -7, 0.93), B({}, -1, 0, -3, 0.97), B({})], hurtT: [0.08, 0.1, 0.1] } };
  const GENF = { mx: 0.14, my: 0.24, bones: {}, anims: Object.assign({}, GENS.anims, {
      idle: [B({}, 0, 0), B({}, 0, -1), B({}, 0, -2, 0, 1.02), B({}, 0, -1)],
      move: [B({}, 0, -1, -3), B({}, 0, -3, 0, 1.02), B({}, 0, -1, 3), B({}, 0, 0, 0, 0.98)] }) };
  const rigOf = id => RIG[id] || (isPix(id) ? (R.ENEMIES[baseOf(id)] && R.ENEMIES[baseOf(id)].fly ? GENF : GENS) : GEN);
  // ---------- 變形 ----------
  const mk = (piv, dx, dy, deg, sy) => { const t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), k = sy || 1; return (x, y) => { const ux = x - piv[0], uy = (y - piv[1]) * k; return [c * ux - s * uy + piv[0] + dx, s * ux + c * uy + piv[1] + dy]; }; };
  const segD = (x, y, [ax, ay], [bx, by]) => { const vx = bx - ax, vy = by - ay, t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy))); return Math.hypot(x - ax - vx * t, y - ay - vy * t); };
  const prep = (src, W, H, rig) => {
    // 2026-10-18 作者回報有破圖：翅膀尖、尾巴尖、蜘蛛腳尖這種細長的地方超出骨頭的半徑，被算成身體留在原地，一動就斷開。
    //   改成「沿著圖往外長」：骨頭半徑裡的像素是種子、離所有骨頭都很遠的是身體的種子，順著不透明的像素一格一格往外擴（誰先到就算誰的），
    //   透明的地方再接著擴；最後把每根骨頭的權重模糊一下，交界處平滑地過渡（不會有切口）。
    const KEYS = Object.keys(rig.bones), N = W * H, lab = new Int16Array(N).fill(-2), q = new Int32Array(N); let qh = 0, qt = 0;
    const solid = i => src[i * 4 + 3] >= 10;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x; if (!solid(i)) continue; let best = -1, bv = 1e9, far = true;
      KEYS.forEach((k, bi) => { const bn = rig.bones[k], d = segD(x, y, bn.a, bn.b), inBox = bn.box && x >= bn.box[0] && y >= bn.box[1] && x <= bn.box[2] && y <= bn.box[3]; if ((d < bn.r || inBox) && (inBox ? 0 : d / bn.r) < bv) { bv = inBox ? 0 : d / bn.r; best = bi; } if (d < bn.r + 10 || inBox) far = false; });   // box：整塊強制算這根骨頭（鹿角）
      if (best >= 0 || far) { lab[i] = best; q[qt++] = i; }
    }
    const grow = ok => { while (qh < qt) { const i = q[qh++], x = i % W; [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, i - W, i + W].forEach(j => { if (j >= 0 && j < N && lab[j] === -2 && ok(j)) { lab[j] = lab[i]; q[qt++] = j; } }); } };
    grow(solid);
    for (let i = 0; i < N; i++) if (lab[i] === -2 && solid(i)) { lab[i] = -1; q[qt++] = i; }   // 跟哪裡都沒連著的：身體
    qh = 0; { let n = 0; for (let i = 0; i < N; i++) if (lab[i] !== -2) q[n++] = i; qt = n; } grow(() => true);
    const blur = (a, r) => { const t = new Float32Array(N); for (let y = 0; y < H; y++) { let acc = 0; for (let x = -r; x < W + r; x++) { if (x + r < W) acc += a[y * W + Math.min(W - 1, x + r)]; if (x - r - 1 >= 0) acc -= a[y * W + x - r - 1]; if (x >= 0 && x < W) t[y * W + x] = acc / (2 * r + 1); } } for (let x = 0; x < W; x++) { let acc = 0; for (let y = -r; y < H + r; y++) { if (y + r < H) acc += t[Math.min(H - 1, y + r) * W + x]; if (y - r - 1 >= 0) acc -= t[(y - r - 1) * W + x]; if (y >= 0 && y < H) a[y * W + x] = acc / (2 * r + 1); } } return a; };
    const WT = KEYS.map((k, bi) => { const a = new Float32Array(N); for (let i = 0; i < N; i++) a[i] = lab[i] === bi ? 1 : 0; const sr = rig.soft || 3; return blur(blur(a, sr), sr); });   // 關節的過渡寬一點（斷手、斷翅膀）；rig.soft：翅膀跟身體疊在一起的，過渡要更寬（翅膀下半截被拉動，不會撕開）   // 關節的過渡寬一點（斷手、斷翅膀）
    return { src, W, H, rig, KEYS, WT };
  };
  const frame = (S, T, MX, MY) => {
    const { src, W, H, rig, KEYS, WT } = S, CW = W + MX * 2, CH = H + MY, out = new Uint8ClampedArray(CW * CH * 4);
    const wAt = (x, y) => { const xi = Math.max(0, Math.min(W - 1, Math.round(x))), yi = Math.max(0, Math.min(H - 1, Math.round(y))), i = yi * W + xi, w = WT.map(a => a[i]), sum = w.reduce((p, q) => p + q, 0), bd = Math.max(0, 1 - sum), n = Math.max(1, sum + bd); return { w: w.map(v => v / n), body: bd / n }; };
    const body = mk([W / 2, H], T.body[0], T.body[1], T.lean || 0, T.sy || 1);
    const tf = KEYS.map(k => { const [dx, dy, deg] = T[k] || [0, 0, 0], loc = mk(rig.bones[k].a, dx, dy, deg); return (x, y) => { const p = loc(x, y); return body(p[0], p[1]); }; });
    const fwd = (x, y) => { if (!KEYS.length) return body(x, y); const { w, body: wb } = wAt(x, y), pb = body(x, y); let X = pb[0] * wb, Y = pb[1] * wb; w.forEach((v, i) => { if (!v) return; const p = tf[i](x, y); X += p[0] * v; Y += p[1] * v; }); return [X, Y]; };
    const binvF = (ox, oy) => { const t = -(T.lean || 0) * Math.PI / 180, c = Math.cos(t), s = Math.sin(t), ux = ox - T.body[0] - W / 2, uy = oy - T.body[1] - H; return [c * ux - s * uy + W / 2, (s * ux + c * uy) / (T.sy || 1) + H]; };
    const solve = (ox, oy, sx, sy) => { if (!KEYS.length) return [sx, sy, true]; for (let it = 0; it < 14; it++) { const [fx, fy] = fwd(sx, sy), ex = ox - fx, ey = oy - fy; if (ex * ex + ey * ey < 0.04) return [sx, sy, true]; sx += ex * 0.8; sy += ey * 0.8; } const [fx, fy] = fwd(sx, sy); return [sx, sy, (ox - fx) ** 2 + (oy - fy) ** 2 < 0.6]; };
    const put = (X, Y, sx, sy) => { const xi = Math.round(sx - 0.5), yi = Math.round(sy - 0.5); if (xi < 0 || yi < 0 || xi >= W || yi >= H) return; const i = (yi * W + xi) * 4; if (src[i + 3] < 10) return; out.set(src.subarray(i, i + 4), (Y * CW + X) * 4); };
    for (let Y = 0; Y < CH; Y++) for (let X = 0; X < CW; X++) {
      const ox = X - MX + 0.5, oy = Y - MY + 0.5, g = binvF(ox, oy), [sx, sy, ok] = solve(ox, oy, g[0], g[1]); if (!ok) continue;
      // （2026-10-18：原本這裡把關節附近一半一半的像素丟掉——改成沿著圖分配骨頭之後，反而把手臂、翅膀的根部挖出缺口，拿掉）
      put(X, Y, sx, sy);
    }
    KEYS.forEach((k, bi) => {
      const [dx, dy, deg] = T[k] || [0, 0, 0], inv = mk(rig.bones[k].a, 0, 0, -deg);
      if (!dx && !dy && !deg) return;
      for (let Y = 0; Y < CH; Y++) for (let X = 0; X < CW; X++) { const ox = X - MX + 0.5, oy = Y - MY + 0.5, g0 = binvF(ox, oy), g = inv(g0[0] - dx, g0[1] - dy), [sx, sy, ok] = solve(ox, oy, g[0], g[1]); if (!ok || wAt(sx, sy).w[bi] < 0.5) continue; put(X, Y, sx, sy); }
    });
    // 小碎塊拿掉（只看有骨頭的）
    if (KEYS.length) { const seen = new Uint8Array(CW * CH); for (let k0 = 0; k0 < CW * CH; k0++) { if (seen[k0] || out[k0 * 4 + 3] < 10) continue; const st = [k0], comp = []; seen[k0] = 1; while (st.length) { const k = st.pop(); comp.push(k); const x = k % CW; [x > 0 ? k - 1 : -1, x < CW - 1 ? k + 1 : -1, k - CW, k + CW].forEach(q => { if (q >= 0 && q < CW * CH && !seen[q] && out[q * 4 + 3] >= 10) { seen[q] = 1; st.push(q); } }); } if (comp.length < 60) comp.forEach(k => { out[k * 4 + 3] = 0; }); } }   // 原圖都是一整塊：動作後跑出來的小碎塊（< 60 格）拿掉
    // 外圍重新描一圈（原圖的描邊顏色：最暗的那一格）
    const on = k => out[k * 4 + 3] > 10, o2 = out.slice();
    if (KEYS.length) for (let Y = 0; Y < CH; Y++) for (let X = 0; X < CW; X++) { const k = Y * CW + X; if (on(k)) continue; if ((X > 0 && on(k - 1)) || (X < CW - 1 && on(k + 1)) || (Y > 0 && on(k - CW)) || (Y < CH - 1 && on(k + CW))) o2.set([4, 4, 4, 255], k * 4); }
    return { d: o2, CW, CH };
  };
  // ---------- 做整張圖（背景慢慢做） ----------
  const SHEETS = {}, nap = () => new Promise(r => setTimeout(r, 0));
  // amp：動作幅度倍率（異變第二、三形態 1.2、1.4）——位移、傾斜、縮放照倍率放大；關節角度最多 20°（再大會被拉扯得像斷掉）
  const ampT = (T, a) => { if (a === 1) return T; const o = { body: [T.body[0] * a, T.body[1] * a], lean: (T.lean || 0) * a, sy: 1 + ((T.sy || 1) - 1) * a }; Object.keys(T).forEach(k => { const v = T[k]; if (Array.isArray(v) && v.length === 3 && k !== 'body') o[k] = [v[0] * a, v[1] * a, Math.max(-20, Math.min(20, v[2] * a))]; }); return o; };
  const build = (id, role, amp) => {
    amp = amp || 1;
    const key = id + ':' + (role || '') + ':' + amp; if (SHEETS[key]) return SHEETS[key];
    const p = (async () => {
      const sh = R.beastHDSheet(id, role); if (!sh) return null;
      const cw = sh.c.width / 2, ch = sh.c.height / 2, src = sh.c.getContext('2d').getImageData(0, 0, cw, ch).data, rig = rigOf(id);
      const S = prep(src, cw, ch, rig), MX = Math.round(cw * rig.mx * (amp > 1 ? 1.15 : 1)), MY = Math.round(ch * rig.my * (amp > 1 ? 1.2 : 1)), order = [];
      Object.keys(rig.anims).filter(n => Array.isArray(rig.anims[n]) && rig.anims[n][0] && typeof rig.anims[n][0] === 'object').forEach(n => rig.anims[n].forEach((T, i) => order.push([n, i, T])));   // idle、move、atk、m0～m4（每一招）、v0／v1（異變的招）、burst（異變）、狀態（fly、stance……）
      const CW = cw + MX * 2, CH = ch + MY, N = order.length, c = document.createElement('canvas'); c.width = CW * N; c.height = CH * 2;
      const g = c.getContext('2d'), tmp = document.createElement('canvas'); tmp.width = CW; tmp.height = CH; const tg = tmp.getContext('2d'), idx = {};
      for (let j = 0; j < N; j++) {
        const [n, i, T] = order[j]; (idx[n] = idx[n] || [])[i] = j;
        const f = frame(S, ampT(T, amp), MX, MY); tg.putImageData(new ImageData(f.d, CW, CH), 0, 0);
        g.drawImage(tmp, j * CW, 0); g.save(); g.translate(j * CW + CW, CH); g.scale(-1, 1); g.drawImage(tmp, 0, 0); g.restore();
        await nap();
      }
      return { c, N, idx, CW, CH, cw, ch, MX, MY, rig, fw: sh.fw, fh: sh.fh, amp };
    })();
    SHEETS[key] = p; return p;
  };
  R.beastAnimBuild = build;
  // ---------- 換上動畫圖 ----------
  const apply = (m, A) => {
    const sp = m.sp, geo = sp.m.geometry, p = geo.parameters, prev = m._anim, A0 = prev ? prev.A : null;
    const PX = A0 ? p.width / (A0.CW / (A0.cw / A0.fw)) : p.width / A.fw, TILT = A0 ? p.height / ((A0.CH / (A0.cw / A0.fw)) * PX) : p.height / (A.fh * PX), RS = A.cw / A.fw;   // 換第二張動畫圖（異變）：照目前動畫圖的比例算
    const fw = A.CW / RS, fh = A.CH / RS, W0 = fw * PX, H0 = fh * PX * TILT, g2 = new (T3().PlaneGeometry)(W0, H0); g2.translate(0, H0 / 2 - 1 * PX * TILT, 0);
    const t = new (T3().CanvasTexture)(A.c); t.magFilter = t.minFilter = T3().NearestFilter; t.generateMipmaps = false; t.encoding = sp.t.encoding; t.repeat.set(1 / A.N, 1 / 2);
    sp.m.geometry = g2; geo.dispose(); sp.mat.map = t; sp.mat.emissiveMap = t; sp.mat.needsUpdate = true; sp.t = t; sp.cols = A.N; sp.rows = 2;
    m._anim = Object.assign(prev || { atk: -1, t0: 0, lm: null }, { A });   // lm＝null：下一次出招就播（原本 undefined 會吃掉第一招）；換圖的時候出招的進度留著
  };
  const mb0 = R.makeBeastSprite;
  R.makeBeastSprite = (id, role) => {
    const m = mb0(id, role);
    if ((isLord(id) && R.BEAST_HD && R.BEAST_HD[id] || isPix(id)) && T3()) { m._animRole = role; build(id, role).then(A => { if (A && m.sp) try { apply(m, A); } catch (e) { console.warn('[beastanim]', e); } }); }
    return m;
  };
  const bv0 = R.beastVariant;
  R.beastVariant = (m, id, role) => { if (!m || !m._anim) return bv0(m, id, role); m._animRole = role; build(id, role, m._anim.A.amp || 1).then(A => { if (A) try { apply(m, A); } catch (e) { } }); };   // 換顏色：動畫圖也照新顏色重做
  const wrap = a => Math.atan2(Math.sin(a), Math.cos(a));
  // 異變（lordvariant.js）：第二形態動作快 1.25 倍、幅度 ×1.2；第三形態快 1.5 倍、幅度 ×1.4、待機時身體抖動
  const SPD = { 1: 1, 2: 1.25, 3: 1.5 }, AMP = { 1: 1, 2: 1.2, 3: 1.4 };
  const an0 = R.animBeastSprite;
  R.animBeastSprite = (m, id, t, moving) => {
    const S = m && m._anim; if (!S) return an0(m, id, t, moving);
    const A = S.A, an = A.rig.anims;
    const e = (R.W.enemies || []).find(x => x.m === m);
    const ph = (e && e.variant && e.variant.phase) || 1, spd = SPD[ph] || 1;
    // 形態轉換：播「異變」那一下，然後換成幅度更大的動畫圖
    if (e && e.variant) {
      if (S.ph != null && ph > S.ph && A.idx.burst) { S.key = 'burst'; S.atk = 0; S.t0 = t; }
      if (S.ph !== ph) { S.ph = ph; const want = AMP[ph] || 1; if ((A.amp || 1) !== want && !S.ampBusy) { S.ampBusy = 1; build(id, m._animRole, want).then(B => { S.ampBusy = 0; if (B && m.sp) try { apply(m, B); } catch (er) { } }); } }
    }
    // 出招：lordlogic.js 每出一招 e.lastMove 會換；異變的招（lordvariant.js）e._vMove 會加一
    if (e && e.lastMove != null && e.lastMove !== S.lm) { if (S.lm !== undefined) { const k = 'm' + e.lastMove; S.key = A.idx[k] ? k : A.idx.atk ? 'atk' : null; if (S.key) { S.atk = 0; S.t0 = t; } } S.lm = e.lastMove; }
    // 小怪：打到人、射出東西（beastpix.js 記在 e._atkN）播攻擊；扣血播受傷
    if (e && e._atkN && e._atkN !== S.an) { S.an = e._atkN; if (A.idx.atk) { S.key = 'atk'; S.atk = 0; S.t0 = t; } }
    if (e && A.idx.hurt) { if (S.hp0 != null && e.hp < S.hp0 - 0.5 && !(S.atk >= 0)) { S.key = 'hurt'; S.atk = 0; S.t0 = t; } S.hp0 = e.hp; }
    if (e && e._vMove && e._vMove !== S.vm) { S.vm = e._vMove; const k = e._vMoveK; if (A.idx[k]) { S.key = k; S.atk = 0; S.t0 = t; } }
    let col;
    if (S.atk >= 0 && S.key && A.idx[S.key]) { const T = an[S.key + 'T'] || an[S.key].map(() => 0.22), el = (t - S.t0) * (S.key === 'burst' ? 1 : spd); let acc = 0, k = 0; while (k < T.length && el > acc + T[k]) { acc += T[k]; k++; } if (k >= T.length) S.atk = -1; else col = A.idx[S.key][k]; }
    if (col == null && e && A.rig.states) for (const [k, fn] of A.rig.states) { let on = false; try { on = fn(e); } catch (er) { } if (on && A.idx[k]) { col = A.idx[k][Math.floor(t * spd * (an[k + 'F'] || 6)) % an[k].length]; break; } }   // 狀態（飛起來、架勢、擱淺……）一直循環
    if (col == null) col = moving ? A.idx.move[Math.floor(t * spd * 7) % an.move.length] : A.idx.idle[Math.floor(t * spd * 2.6) % an.idle.length];
    const cam = R.W.cam ? R.W.cam.yaw : 0, rel = wrap(m.g.rotation.y - cam), row = Math.sin(rel) >= 0 ? 0 : 1;
    m.sp.t.offset.set(col / m.sp.cols, 1 - (row + 1) / m.sp.rows);
    m.spr.rotation.set(0, Math.abs(m.g.rotation.x) > 0.5 ? 0 : cam - m.g.rotation.y, 0);
    // 第三形態：待機時身體抖動（看起來壓不住）
    const jit = ph >= 3 && !moving && !(S.atk >= 0) ? 0.04 : 0; m.spr.position.x = jit ? (Math.random() - 0.5) * jit : 0;
  };
})(window.R);
// ==== 領主體動畫 完 ====
// ==== 領主體骨架 ====
// 2026-10-18 作者：全部領主體照機制畫動作。每一隻的骨頭（原圖座標，看 beastHDSheet 的第 0 幀）＋每一招一組動作（m0～m4 對應 lordlogic.js 的 moves 順序）＋狀態動作（飛、架勢、擱淺、散架、衝鋒）。
// 一格：{ 骨頭: [dx, dy, 角度], body: [dx, dy], lean: 整隻傾斜（正＝上面往右）, sy: 直向縮放 }；T：每格秒數。
(function (R) {
  const RIG = R.BEAST_RIG; if (!RIG) return;
  const Z = (a, b, c) => [a || 0, b || 0, c || 0];
  const B = (o, bx, by, lean, sy) => Object.assign({ body: [bx || 0, by || 0], lean: lean || 0, sy: sy || 1 }, o || {});
  const breathe = (o) => [0, 1, 2, 1].map(k => B(o ? o(k) : {}, 0, k * 0.4, 0, 1 - k * 0.006));
  const st = (k, fn) => [k, fn];
  // ---------- 巢織蛛（正面）：八隻腳分左右兩組、背上的卵囊 ----------
  RIG.tsuchigumo = { mx: 0.14, my: 0.3,
    bones: { legL: { a: [50, 72], b: [16, 122], r: 12 }, legR: { a: [100, 72], b: [136, 122], r: 12 }, sac: { a: [80, 52], b: [80, 16], r: 20 } },
    anims: {
      idle: breathe(k => ({ sac: Z(0, -k * 0.5) })),
      move: [B({ legL: Z(0, -4, 8) }, 0, -1), B({}, 0, 0), B({ legR: Z(0, -4, -8) }, 0, -1), B({}, 0, 0)],
      m0: [B({ sac: Z(0, -3, -10) }, 0, -1, 0, 1.03), B({ sac: Z(0, 3, 12) }, 0, 2, 0, 0.97), B({ sac: Z(0, 1, 4) })], m0T: [0.35, 0.3, 0.3],   // 吐絲
      m1: [B({ legL: Z(4, -8, 22), legR: Z(-4, -8, -22) }, 0, -2, 0, 0.94), B({ legL: Z(6, -12, 34), legR: Z(-6, -12, -34) }, 0, -4, 0, 0.9), B({ legL: Z(-2, 2, -6), legR: Z(2, 2, 6) }, 0, 2, 0, 0.96)], m1T: [0.4, 2.3, 0.5],   // 爬上天花板：腳收起來，掉下來張開
      m2: [B({ legL: Z(0, -8, 14) }, 0, -1), B({ legL: Z(0, 2, -4) }, 0, 1), B({ legR: Z(0, -8, -14) }, 0, -1), B({ legR: Z(0, 2, 4) }, 0, 1), B({ legL: Z(0, -8, 14), legR: Z(0, -8, -14) }, 0, -2), B({ legL: Z(0, 2, -4), legR: Z(0, 2, 4) }, 0, 2)], m2T: [0.17, 0.17, 0.17, 0.17, 0.17, 0.3],   // 三下踩網
      m3: [B({ sac: Z(0, -3) }, 0, 0, 0, 1.05), B({ sac: Z(0, 1) }, 0, 0, 0, 0.97), B({ sac: Z(0, -3) }, 0, 0, 0, 1.05), B({})], m3T: [0.25, 0.25, 0.25, 0.25],   // 垂下幼體：卵囊一縮一脹
      m4: [B({ legL: Z(-2, -4, -10), legR: Z(2, -4, 10) }, 0, -2, 0, 1.03), B({ legL: Z(2, 2, 6), legR: Z(-2, 2, -6) }, 0, 4, 0, 0.94), B({}, 0, 1)], m4T: [0.3, 0.35, 0.3] } };   // 撲咬
  // ---------- 千節蟲（頭朝左上）：頭和脖子、盤起來的身體 ----------
  RIG.omukade = { mx: 0.16, my: 0.22,
    bones: { head: { a: [72, 52], b: [24, 62], r: 16 } },
    anims: {
      idle: [0, 1, 2, 1].map(k => B({ head: Z(0, k * 0.6, k * 1.2) }, 0, k * 0.3)),
      move: [B({ head: Z(-1, 0, -6) }, 0, -1, -1), B({ head: Z(0, 1, 0) }, 0, 0), B({ head: Z(1, 0, 6) }, 0, -1, 1), B({ head: Z(0, 1, 0) }, 0, 0)],
      m0: [B({ head: Z(6, -4, -12) }, 2, 0, 3), B({ head: Z(-6, 4, 14) }, -3, 1, -5, 0.97)], m0T: [0.6, 1.1],   // 瞄準、衝鋒
      m1: [B({ head: Z(-3, 8, 25) }, 0, 3, -4, 0.92), B({ head: Z(-4, 14, 40) }, 0, 6, -6, 0.85)], m1T: [0.3, 3.1],   // 鑽地
      m2: [B({ head: Z(2, -10, -16) }, 0, -3, 2, 1.05), B({ head: Z(-4, 6, 16) }, 0, 2, -3, 0.95), B({ head: Z(-1, 2, 4) })], m2T: [0.9, 0.35, 0.3],   // 抬頭、砸下（拉人）
      m3: [B({ head: Z(-6, 2, 10) }, -1), B({ head: Z(2, 0, -4) }), B({ head: Z(-6, 2, 10) }, -1), B({})], m3T: [0.2, 0.2, 0.2, 0.25] },   // 毒牙連咬
    states: [st('m0', e => e.rush)] };
  // ---------- 地出巨骸：左邊撐地的巨手、右手、頭 ----------
  RIG.gashadokuro = { mx: 0.16, my: 0.3,
    bones: { armL: { a: [48, 34], b: [40, 128], r: 14, box: [6, 104, 82, 137] }, armR: { a: [104, 62], b: [118, 118], r: 12, box: [100, 100, 136, 137] }, head: { a: [86, 60], b: [86, 30], r: 14 } },
    anims: {
      idle: breathe(k => ({ head: Z(0, k * 0.4, k * 0.8) })),
      move: breathe(),
      m0: [B({ armL: Z(0, -10, 8), armR: Z(0, -10, -10) }, 0, -2), B({ armL: Z(0, 2, -2), armR: Z(0, 2, 3) }, 0, 2, 0, 0.97), B({ armL: Z(0, -6, 5) }), B({ armL: Z(0, 2, -2) }, 0, 1), B({ armR: Z(0, -6, -8) }), B({ armR: Z(0, 2, 3) }, 0, 1)], m0T: [0.4, 0.2, 0.2, 0.2, 0.2, 0.3],   // 三下拍地
      m1: [B({ armR: Z(2, -4, -30) }, 0, 0, 3), B({ armR: Z(-4, 2, 35) }, 0, 0, -4), B({ armR: Z(0, 0, 8) })], m1T: [0.5, 0.35, 0.35],   // 橫掃
      m2: [0, 1, 2, 3, 4, 5].map(i => B(i % 2 ? { armL: Z(0, -8, 6) } : { armR: Z(0, -8, -8) }, 0, i % 2 ? -1 : 1)), m2T: [0.16, 0.16, 0.16, 0.16, 0.16, 0.16],   // 亂拍
      m3: [B({ head: Z(2, -2, -8), armR: Z(0, -6, -20) }, 0, -1), B({ head: Z(-2, 3, 10), armR: Z(-4, 2, 25) }, 0, 1, -3), B({})], m3T: [0.5, 0.7, 0.3],   // 抓人
      reform: [B({ armL: Z(0, 4, -4), armR: Z(0, 4, 6), head: Z(0, 6, 10) }, 0, 3, 0, 0.88), B({ armL: Z(0, 5, -6), armR: Z(0, 5, 8), head: Z(0, 8, 14) }, 1, 4, 0, 0.86)], reformF: 5 },   // 散架
    states: [st('reform', e => e.reform > 0)] };
  // ---------- 霜冠鹿（頭朝左）：頭和角、前腳、後腳 ----------
  RIG.frostdeer = { mx: 0.14, my: 0.16,
    bones: { head: { a: [60, 52], b: [44, 22], r: 26, box: [4, 0, 112, 34] }, legF: { a: [52, 82], b: [46, 116], r: 8 }, legB: { a: [86, 82], b: [92, 116], r: 8 } },
    anims: {
      idle: breathe(k => ({ head: Z(0, k * 0.3, -k * 0.8) })),
      move: [B({ legF: Z(0, -2, -14), legB: Z(0, 0, 10) }, 0, -1), B({}, 0, 0), B({ legF: Z(0, 0, 10), legB: Z(0, -2, -14) }, 0, -1), B({}, 0, 0)],
      m0: [B({ legF: Z(0, -8, 20), head: Z(0, -2, 8) }, 0, -2, 6), B({ legF: Z(0, 1, -4), head: Z(-2, 3, -10) }, 0, 1, -3, 0.97), B({})], m0T: [0.45, 0.4, 0.3],   // 立起來踏下：三排冰刺
      m1: [B({ head: Z(0, -3, 12) }, 0, -1, 2, 1.03), B({ head: Z(0, -3, 16) }, 0, -1, 2, 1.04), B({})], m1T: [0.3, 0.5, 0.3],   // 仰頭：寒氣
      m2: [B({ head: Z(-3, 6, -22), legF: Z(0, 0, 8) }, 2, 1, -6), B({ head: Z(-4, 7, -24), legF: Z(0, -2, -10), legB: Z(0, 0, 10) }, -2, 0, -7)], m2T: [0.6, 0.8],   // 低頭、角衝鋒
      m3: [B({ legF: Z(0, -6, 16) }, 0, -1, 4), B({ legF: Z(0, 1, -3) }, 0, 1, -2), B({})], m3T: [0.35, 0.35, 0.3],   // 踏地結冰
      m4: [B({ head: Z(0, -3, 14) }, 0, -1, 2), B({})], m4T: [0.6, 0.3] },   // 呼喚冰衛
    states: [st('m2', e => e.rush)] };
  // ---------- 熔顎蜥（頭朝右）：頭和顎、尾巴、前腳、後腳 ----------
  RIG.lavajaw = { mx: 0.12, my: 0.3,
    bones: { head: { a: [96, 48], b: [140, 62], r: 14 }, tail: { a: [46, 36], b: [8, 28], r: 12 }, legF: { a: [104, 66], b: [110, 80], r: 8 }, legB: { a: [42, 66], b: [32, 80], r: 8 } },
    anims: {
      idle: breathe(k => ({ tail: Z(0, 0, k * 1.5) })),
      move: [B({ legF: Z(0, -3, -10), tail: Z(0, 0, -5) }, 0, -1), B({ tail: Z(0, 0, 0) }), B({ legB: Z(0, -3, 10), tail: Z(0, 0, 5) }, 0, -1), B({})],
      m0: [B({ head: Z(-2, -2, -14) }, -1, 0, -2), B({ head: Z(3, 2, 8) }, 1, 0, 2), B({ head: Z(3, 2, 6) }, 1, 0, 2)], m0T: [0.5, 0.5, 0.4],   // 噴熔岩
      m1: [B({ head: Z(0, -4, -22), tail: Z(0, -4, -15) }, 0, -1, -3, 1.04), B({ head: Z(0, -4, -26), tail: Z(0, -4, -18) }, 0, -1, -3, 1.05), B({})], m1T: [0.4, 0.6, 0.3],   // 仰頭：天上落熔岩
      m2: [B({}, 0, -2, 0, 1.06), B({ legF: Z(0, 2), legB: Z(0, 2) }, 0, 3, 0, 0.9), B({})], m2T: [0.5, 0.3, 0.3],   // 跺地：熔岩圈
      m3: [B({}, 0, 3, 0, 0.9), B({}, 0, 6, 0, 0.78)], m3T: [0.3, 2.5] } };   // 潛進熔岩
  // ---------- 沙暴鯨（頭朝左）：大嘴、尾巴 ----------
  RIG.sandwhale = { mx: 0.1, my: 0.4,
    bones: { jaw: { a: [62, 46], b: [16, 56], r: 14 }, tail: { a: [112, 40], b: [148, 14], r: 14 } },
    anims: {
      idle: [0, 1, 2, 1].map(k => B({ tail: Z(0, 0, -k * 3) }, 0, k * 0.4)),
      move: [B({ tail: Z(0, 0, -8) }, 0, -1), B({ tail: Z(0, 0, 4) }), B({ tail: Z(0, 0, -8) }, 0, -1), B({ tail: Z(0, 0, 4) })],
      m0: [B({ jaw: Z(0, 2, 10) }, 0, 0, -2), B({ jaw: Z(0, 3, 14) }, -1, 0, -3), B({})], m0T: [0.3, 0.6, 0.3],   // 噴沙
      m1: [B({ tail: Z(0, -6, -28) }, 0, -1, 3), B({ tail: Z(0, 4, 18) }, 0, 1, -2), B({})], m1T: [0.4, 0.4, 0.4],   // 尾巴拍地：一排沙柱
      m2: [B({}, 0, 0, -4, 0.97), B({}, 0, 0, 4, 0.97), B({})], m2T: [0.3, 0.3, 0.3],   // 翻滾：撒蒺藜
      beach: [B({ tail: Z(0, -6, -25), jaw: Z(0, 1, 6) }, 0, 0, -3), B({ tail: Z(0, 3, 15) }, 0, 1, 2, 0.97)], beachF: 3.5 },   // 擱淺：拍尾巴
    states: [st('beach', e => e.beach > 0)] };
  // ---------- 深淵王蛸（正面）：左右兩團觸手、頭（外套膜） ----------
  RIG.kraken = { mx: 0.16, my: 0.22,
    bones: { armL: { a: [42, 70], b: [12, 104], r: 14 }, armR: { a: [74, 70], b: [104, 104], r: 14 }, mantle: { a: [57, 46], b: [57, 8], r: 18 } },
    anims: {
      idle: [0, 1, 2, 3].map(k => B({ armL: Z(0, 0, Math.sin(k * 1.57) * 4), armR: Z(0, 0, -Math.sin(k * 1.57) * 4), mantle: Z(0, -Math.sin(k * 1.57) * 0.8) })),
      move: [0, 1, 2, 3].map(k => B({ armL: Z(0, 0, Math.sin(k * 1.57) * 8), armR: Z(0, 0, Math.sin(k * 1.57) * 8) }, 0, -Math.abs(Math.sin(k * 1.57)))),
      m0: [B({ armL: Z(-2, -8, 25), armR: Z(2, -8, -25) }, 0, -2), B({ armL: Z(0, 2, -10), armR: Z(0, 2, 10) }, 0, 1), B({})], m0T: [0.4, 0.5, 0.3],   // 四道觸手
      m1: [B({ mantle: Z(0, -2) }, 0, 0, 0, 1.06), B({ mantle: Z(0, 2) }, 0, 0, 0, 0.94), B({})], m1T: [0.3, 0.4, 0.3],   // 噴墨
      m2: [B({ armL: Z(0, 0, 30), armR: Z(0, 0, 30) }), B({ armL: Z(0, 0, -30), armR: Z(0, 0, -30) }), B({ armL: Z(0, 0, 30), armR: Z(0, 0, 30) }), B({})], m2T: [0.25, 0.25, 0.25, 0.3],   // 漩渦
      m3: [B({ mantle: Z(0, -3) }, 0, -1, 0, 1.06), B({ armL: Z(-3, 0, -12), armR: Z(3, 0, 12) }, 0, 1, 0, 0.95), B({})], m3T: [0.3, 0.3, 0.3] } };   // 放射魔力彈
  // ---------- 萬面樹（不會動）：樹冠、右邊的枯枝 ----------
  RIG.faceforest = { mx: 0.08, my: 0.18,
    bones: { crown: { a: [72, 62], b: [72, 14], r: 30 }, branch: { a: [118, 46], b: [146, 24], r: 12 } },
    anims: {
      idle: [0, 1, 2, 1].map(k => B({ crown: Z(0, 0, (k - 1) * 1.2), branch: Z(0, 0, -(k - 1) * 3) })),
      move: [0, 1, 2, 1].map(k => B({ crown: Z(0, 0, (k - 1) * 1.2) })),
      m0: [B({}, 0, 1, 0, 0.96), B({}, 0, -1, 0, 1.03), B({}, 0, 1, 0, 0.97), B({})], m0T: [0.3, 0.3, 0.4, 0.3],   // 樹根竄出
      m1: [B({ crown: Z(-1, 0, -4), branch: Z(0, 0, 8) }), B({ crown: Z(1, 0, 4), branch: Z(0, 0, -8) }), B({ crown: Z(-1, 0, -4) }), B({ crown: Z(1, 0, 4) }), B({})], m1T: [0.12, 0.12, 0.12, 0.12, 0.3],   // 抖落種子
      m2: [B({ crown: Z(0, -2, 0) }, 0, 0, 0, 1.03), B({ crown: Z(0, 2, 0) }, 0, 1, 0, 0.96), B({})], m2T: [0.4, 0.3, 0.3],   // 根拍下
      m3: [B({ crown: Z(0, 0, 5), branch: Z(0, 2, 12) }), B({ crown: Z(0, 0, -3) }), B({})], m3T: [0.3, 0.3, 0.3],   // 果實落地
      m4: [B({ crown: Z(0, -3) }, 0, 0, 0, 1.06), B({ crown: Z(1, -3, 2) }, 0, 0, 0, 1.06), B({ crown: Z(-1, -3, -2) }, 0, 0, 0, 1.06), B({})], m4T: [0.15, 0.3, 0.3, 0.3] } };   // 每張臉一起尖叫
  // ---------- 朽翼龍（頭朝左）：兩片翅膀、頭、尾巴 ----------
  RIG.bonewyvern = { mx: 0.12, my: 0.3, soft: 9,
    bones: { wingF: { a: [78, 14], b: [148, 30], r: 16, box: [76, 2, 157, 56] }, wingB: { a: [44, 10], b: [14, 70], r: 14, box: [3, 3, 34, 97] }, head: { a: [54, 46], b: [36, 38], r: 10 }, tail: { a: [112, 70], b: [152, 82], r: 10 } },
    anims: {
      idle: breathe(k => ({ wingF: Z(0, 0, -k * 1.5), wingB: Z(0, 0, k * 1.5), tail: Z(0, 0, k * 2) })),
      move: [B({ wingF: Z(0, -2, -12), wingB: Z(0, -2, 12) }, 0, -1), B({ wingF: Z(0, 2, 8), wingB: Z(0, 2, -8) }, 0, 1), B({ wingF: Z(0, -2, -12), wingB: Z(0, -2, 12) }, 0, -1), B({})],
      fly: [B({ wingF: Z(0, -4, -22), wingB: Z(0, -4, 22), tail: Z(0, 0, 6) }, 0, -2), B({ wingF: Z(0, 2, 6), wingB: Z(0, 2, -6) }), B({ wingF: Z(0, 4, 18), wingB: Z(0, 4, -18), tail: Z(0, 0, -4) }, 0, 2), B({ wingF: Z(0, 2, 6), wingB: Z(0, 2, -6) })], flyF: 7,
      m0: [B({ head: Z(2, -2, 10), wingF: Z(0, -3, -10) }, 1, 0, 3), B({ head: Z(-3, 2, -8) }, -1, 0, -3), B({ head: Z(-3, 2, -8) }, -1, 0, -3), B({})], m0T: [0.4, 0.5, 0.5, 0.3],   // 吐息／俯衝
      m1: [B({ wingF: Z(0, -6, -35), wingB: Z(0, -6, 35) }, 0, -2), B({ wingF: Z(0, 4, 25), wingB: Z(0, 4, -25) }, 0, 2), B({})], m1T: [0.35, 0.3, 0.3],   // 振翅：骨羽
      m2: [B({ wingF: Z(0, -5, -28), wingB: Z(0, -5, 28) }, 0, -2), B({ wingF: Z(0, 3, 15), wingB: Z(0, 3, -15) }, 0, 2, 0, 0.97), B({})], m2T: [0.35, 0.3, 0.3],   // 拍地衝擊波
      m3: [B({ head: Z(0, -3, 14) }, 0, -1, 2), B({ head: Z(-2, 2, -10) }, -1, 0, -2), B({})], m3T: [0.4, 0.5, 0.3] },
    states: [st('fly', e => e.fly)] };
  // ---------- 緋面風翁（正面）：兩片大翅膀、頭 ----------
  RIG.windelder = { mx: 0.14, my: 0.2, soft: 7,
    bones: { wingL: { a: [46, 12], b: [12, 92], r: 14, box: [3, 3, 31, 101] }, wingR: { a: [88, 18], b: [140, 86], r: 14, box: [97, 10, 147, 93] }, head: { a: [66, 26], b: [66, 6], r: 8 } },
    anims: {
      idle: breathe(k => ({ wingL: Z(0, 0, k * 1.2), wingR: Z(0, 0, -k * 1.2) })),
      move: [B({ wingL: Z(0, -2, 10), wingR: Z(0, -2, -10) }, 0, -1), B({}), B({ wingL: Z(0, 1, -5), wingR: Z(0, 1, 5) }, 0, 1), B({})],
      m0: [B({ wingL: Z(-2, -2, 18), wingR: Z(2, -2, -18) }, 0, -1), B({ wingL: Z(0, 2, -10), wingR: Z(0, 2, 10) }, 0, 1), B({})], m0T: [0.4, 0.4, 0.3],   // 四道風刃
      m1: [B({ wingL: Z(0, -3, 20) }), B({ wingL: Z(0, 2, -8), wingR: Z(0, -3, -20) }), B({ wingR: Z(0, 2, 8) }), B({})], m1T: [0.2, 0.2, 0.2, 0.3],   // 颳出龍捲
      m2: [B({ wingL: Z(-3, -4, 30), wingR: Z(3, -4, -30) }, 0, -2, 0, 1.03), B({ wingL: Z(0, 4, -20), wingR: Z(0, 4, 20) }, 0, 2, 0, 0.97), B({})], m2T: [0.4, 0.3, 0.3],   // 大振翅：吹開
      m3: [B({ head: Z(0, -2) }, 0, -1, 0, 1.03), B({}, 0, 1, 0, 0.97), B({})], m3T: [0.3, 0.3, 0.3] } };
  // ---------- 棘背狼（頭朝右）：頭、前腳、後腳 ----------
  RIG.spikewolf = { mx: 0.14, my: 0.22,
    bones: { head: { a: [96, 66], b: [122, 82], r: 12 }, legF: { a: [100, 84], b: [104, 112], r: 8 }, legB: { a: [36, 82], b: [30, 112], r: 8 } },
    anims: {
      idle: breathe(k => ({ head: Z(0, k * 0.4, k) })),
      move: [B({ legF: Z(0, -3, -16), legB: Z(0, 0, 12) }, 0, -1, 1), B({}), B({ legF: Z(0, 0, 12), legB: Z(0, -3, -16) }, 0, -1, -1), B({})],
      m0: [B({ legF: Z(0, 2, 8), legB: Z(0, 2, -8) }, 0, 3, -3, 0.92), B({ legF: Z(2, -4, -25), legB: Z(0, 0, 18), head: Z(2, -2, -8) }, 2, -3, 6, 1.04), B({})], m0T: [0.45, 0.6, 0.3],   // 蹲低、撲擊
      m1: [B({ legF: Z(2, -6, -35) }, 1, -1, 2), B({ legF: Z(0, 1, 10) }, 0, 0, -1), B({ legF: Z(2, -6, -35) }, 1, -1, 2), B({ legF: Z(0, 1, 10) }), B({})], m1T: [0.25, 0.2, 0.25, 0.2, 0.3],   // 兩下爪擊
      m2: [B({}, 0, -2, 0, 1.05), B({}, 0, 2, 0, 0.93), B({})], m2T: [0.4, 0.3, 0.3],   // 震地
      m3: [B({ head: Z(-2, -8, -30) }, 0, -1, -3, 1.04), B({ head: Z(-2, -9, -34) }, 0, -1, -3, 1.05), B({})], m3T: [0.4, 0.5, 0.3] } };   // 長嚎：刺變長
  // ---------- 無主大鎧（正面）：右手的刀、左手（家紋）、頭 ----------
  RIG.muhyo = { mx: 0.16, my: 0.14,
    bones: { arm: { a: [92, 50], b: [116, 122], r: 10 }, armL: { a: [32, 54], b: [24, 94], r: 14 }, head: { a: [62, 30], b: [62, 10], r: 10 } },
    anims: {
      idle: breathe(k => ({ arm: Z(0, k * 0.3, k * 0.5) })),
      move: [B({ arm: Z(0, -1, 4) }, 0, -1, 1), B({}), B({ arm: Z(0, -1, -2) }, 0, -1, -1), B({})],
      stance: [B({ arm: Z(-6, -2, 32), armL: Z(4, 0, -8), head: Z(0, 2) }, 0, 3, 0, 0.94), B({ arm: Z(-6, -2, 33), armL: Z(4, 0, -8), head: Z(0, 2) }, 0, 3, 0, 0.94)], stanceF: 2,   // 架勢：壓低、手按刀
      m0: [B({ arm: Z(-6, -2, 32), armL: Z(4, 0, -8) }, 0, 3, 0, 0.94)], m0T: [1.6],
      m1: [B({ arm: Z(-4, -6, 40) }, -1, 0, -3), B({ arm: Z(4, 2, -50) }, 2, 0, 4), B({ arm: Z(-4, -6, 40) }, -1, 0, -3), B({ arm: Z(4, 2, -50) }, 2, 0, 4), B({ arm: Z(-4, -6, 40) }, -1, 0, -3), B({ arm: Z(4, 2, -50) }, 2, 0, 4), B({})], m1T: [0.45, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],   // 三連斬
      m2: [B({ arm: Z(0, -4, 60) }, 0, 1, 0, 0.96), B({ arm: Z(0, -2, -60) }, 0, 0, 0, 1.02), B({ arm: Z(0, -4, 60) }), B({})], m2T: [0.6, 0.25, 0.25, 0.3],   // 迴旋斬
      m3: [B({ armL: Z(0, -6, 20), head: Z(0, -1) }, 0, -1), B({})], m3T: [0.6, 0.3] },   // 叫足輕
    states: [st('stance', e => e.stance > 0)] };
  // ---------- 緋喙屍鷲（2026-10-18 沙漠的新領主體，正面）：紅頭、兩片垂到地上的大翅膀、紅腿 ----------
  RIG.carrionvulture = { mx: 0.14, my: 0.22, soft: 8,
    bones: { head: { a: [88, 36], b: [90, 10], r: 9, box: [76, 4, 104, 32] }, wingL: { a: [50, 22], b: [20, 110], r: 14, box: [8, 20, 44, 132] }, wingR: { a: [96, 24], b: [126, 110], r: 14, box: [106, 24, 144, 132] }, legs: { a: [62, 74], b: [62, 126], r: 7 } },
    anims: {
      idle: breathe(k => ({ head: Z(0, k * 0.4, k), wingL: Z(0, 0, k * 1.2), wingR: Z(0, 0, -k * 1.2) })),
      move: [B({ legs: Z(0, -2, -6), wingL: Z(0, -2, 4), wingR: Z(0, -2, -4) }, 0, -2), B({ head: Z(1, 1, 3) }, 1, 0), B({ legs: Z(0, -2, 6), wingL: Z(0, -2, 4), wingR: Z(0, -2, -4) }, 0, -2), B({ head: Z(-1, 1, -3) }, -1, 0)],
      m0: [B({ wingL: Z(2, -2, -8), wingR: Z(-2, -2, 8), head: Z(0, 1, 4) }, 0, 1, 0, 0.97), B({ wingL: Z(-3, -3, 12), wingR: Z(3, -3, -12), head: Z(0, -2, -6) }, 0, -1, 0, 1.03), B({})], m0T: [0.3, 0.4, 0.3],   // 羽刃：先收再甩開
      m1: [B({ wingL: Z(-2, -6, 12), wingR: Z(2, -6, -12), legs: Z(0, 2) }, 0, 3, 0, 0.9), B({ wingL: Z(-3, -8, 12), wingR: Z(3, -8, -12) }, 0, -3, 0, 1.06), B({ wingL: Z(-3, 2, 10), wingR: Z(3, 2, -10), head: Z(0, 3, 10) }, 0, 3, 0, 0.94), B({})], m1T: [0.45, 0.65, 0.35, 0.3],   // 俯衝啄擊：蹲低、躍起、啄下去
      m2: [B({ wingL: Z(-3, -6, 12), wingR: Z(3, -6, -12) }, 0, -2), B({ wingL: Z(0, 3, -6), wingR: Z(0, 3, 6) }, 0, 2, 0, 0.96), B({ wingL: Z(-3, -6, 12), wingR: Z(3, -6, -12) }, 0, -2), B({ wingL: Z(0, 3, -6), wingR: Z(0, 3, 6) }, 0, 2, 0, 0.96), B({})], m2T: [0.22, 0.2, 0.22, 0.2, 0.3],   // 沙塵捲翼：大振翅兩下
      m3: [B({ head: Z(0, -4, -12), wingL: Z(-1, -2, 6), wingR: Z(1, -2, -6) }, 0, -1, 0, 1.04), B({ head: Z(0, -5, -14), wingL: Z(-1, -2, 6), wingR: Z(1, -2, -6) }, 0, -1, 0, 1.05), B({})], m3T: [0.4, 0.7, 0.3] } };   // 屍鴉：仰頭叫
  // 2026-10-18 檢查後：鹿角、觸手、蜘蛛腳比骨頭的範圍大，轉太多會被扯開——角度壓小（改用位移）
  const clamp = (id, bones, mx) => Object.values(RIG[id].anims).forEach(arr => Array.isArray(arr) && arr.forEach(T => { if (!T || typeof T !== 'object') return; bones.forEach(k => { if (T[k]) T[k] = [T[k][0], T[k][1], Math.max(-mx, Math.min(mx, T[k][2]))]; }); }));
  clamp('frostdeer', ['head'], 6); clamp('bonewyvern', ['wingF', 'wingB'], 10); clamp('windelder', ['wingL', 'wingR'], 12);   // 翅膀垂到腳邊、跟身體疊在一起：轉太多下半截會被扯斷 clamp('kraken', ['armL', 'armR'], 12); clamp('tsuchigumo', ['legL', 'legR'], 16);
  // ---------- 雷鳴猿：照招式分開（m0 跳砸、m1 落雷、m2 三連撲、m3 震波） ----------
  const ape = RIG.thunderape;
  if (ape) {
    const a = ape.anims; a.m0 = a.atk; a.m0T = a.atkT;
    a.m1 = [B({ armF: Z(-2, -10, -40), armB: Z(0, -10, -36), head: Z(0, -2, -6) }, -1, -3, -6), B({ armF: Z(-3, -12, -46), armB: Z(-1, -12, -42), head: Z(0, -2, -8) }, -1, -3, -7), B({})]; a.m1T = [0.4, 0.6, 0.3];   // 舉雙臂：叫落雷
    a.m2 = [B({ armF: Z(4, -4, -18) }, 1, 0, 2), B({ armF: Z(6, 3, 10) }, 2, 1, 4), B({ armB: Z(2, -4, -16) }, 1, 0, 2), B({ armB: Z(4, 3, 10) }, 2, 1, 4), B({ armF: Z(4, -4, -18) }, 1, 0, 2), B({ armF: Z(6, 3, 10) }, 2, 1, 4), B({})]; a.m2T = [0.3, 0.25, 0.3, 0.25, 0.3, 0.25, 0.3];   // 三連撲
    a.m3 = [B({ armF: Z(0, -6, -20), armB: Z(0, -6, -18) }, 0, -2, -3), B({ armF: Z(2, 4, 6), armB: Z(2, 4, 6) }, 0, 3, 2, 0.95), B({})]; a.m3T = [0.4, 0.3, 0.3];   // 雙拳搥地：震波
  }
  // ---------- 異變（lordvariant.js）：兩招異變的招（v0、v1）＋形態轉換（burst：縮起來再猛然撐開，1.5 秒） ----------
  const VA = (id, o) => { const r = RIG[id]; if (r) Object.assign(r.anims, o); };
  const burst = [B({}, 0, 3, 0, 0.88), B({}, 0, 4, 0, 0.84), B({}, 0, -3, 0, 1.1), B({}, 0, -1, 0, 1.04), B({})];
  Object.keys(RIG).forEach(id => { RIG[id].anims.burst = burst; RIG[id].anims.burstT = [0.35, 0.35, 0.25, 0.3, 0.25]; });
  const rep = (fr, n) => { const o = []; for (let i = 0; i < n; i++) o.push(...fr); return o; };
  // 深淵織母：v0 三圈法陣（卵囊脹縮三次）、v1 召喚＋落毒（八隻腳舉起、卵囊往上脹）
  VA('tsuchigumo', { v0: rep([B({ sac: Z(0, -3) }, 0, 0, 0, 1.06), B({ sac: Z(0, 1) }, 0, 1, 0, 0.96)], 3).concat([B({})]), v0T: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25],
    v1: [B({ legL: Z(0, -6, 12), legR: Z(0, -6, -12), sac: Z(0, -4) }, 0, -2, 0, 1.06), B({ legL: Z(0, -7, 14), legR: Z(0, -7, -14), sac: Z(0, -5) }, 0, -2, 0, 1.07), B({ legL: Z(0, 2, -4), legR: Z(0, 2, 4) }, 0, 2, 0, 0.96), B({})], v1T: [0.35, 0.5, 0.3, 0.3] });
  // 噬骨千足：v0 鑽地三連（頭連續砸地三次）、v1 毒痕（頭左右甩）
  VA('omukade', { v0: rep([B({ head: Z(2, -6, -12) }, 0, -2, 2), B({ head: Z(-4, 10, 18) }, 0, 3, -4, 0.92)], 3).concat([B({})]), v0T: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3, 0.3],
    v1: rep([B({ head: Z(-2, 0, -10) }, -1, 0, -2), B({ head: Z(2, 0, 10) }, 1, 0, 2)], 3).concat([B({})]), v1T: [0.18, 0.18, 0.18, 0.18, 0.18, 0.18, 0.3] });
  // 萬骸之王：v0 四圈震地（兩手輪流拍地）、v1 骨雨（仰頭、兩手舉起）
  VA('gashadokuro', { v0: rep([B({ armL: Z(0, -8, 6) }, 0, -1), B({ armL: Z(0, 2, -2) }, 0, 1, 0, 0.97), B({ armR: Z(0, -8, -8) }, 0, -1), B({ armR: Z(0, 2, 3) }, 0, 1, 0, 0.97)], 2).concat([B({})]), v0T: [0.25, 0.3, 0.25, 0.3, 0.25, 0.3, 0.25, 0.3, 0.3],
    v1: [B({ head: Z(0, -3, -10), armL: Z(0, -8, 6), armR: Z(0, -8, -8) }, 0, -2, 0, 1.04), B({ head: Z(0, -4, -12), armL: Z(0, -10, 8), armR: Z(0, -10, -10) }, 0, -3, 0, 1.05), B({})], v1T: [0.4, 0.9, 0.3] });
  // 永凍之冠：v0 冰環（立起來、前腳踏下）、v1 冰晶漩渦（頭左右轉）
  VA('frostdeer', { v0: [B({ legF: Z(0, -8, 18), head: Z(0, -3, 6) }, 0, -2, 6), B({ legF: Z(0, -9, 20), head: Z(0, -3, 6) }, 0, -3, 7), B({ legF: Z(0, 2, -4), head: Z(-2, 3, -6) }, 0, 2, -3, 0.95), B({})], v0T: [0.4, 0.4, 0.4, 0.3],
    v1: rep([B({ head: Z(-3, 0, -6) }, -1, 0, -2), B({ head: Z(3, 0, 6) }, 1, 0, 2)], 4).concat([B({})]), v1T: [0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.25, 0.3] });
  // 熔獄之顎：v0 熔岩格（跺地）、v1 熔岩雨（仰頭吼、尾巴豎起）
  VA('lavajaw', { v0: rep([B({}, 0, -2, 0, 1.05), B({ legF: Z(0, 2), legB: Z(0, 2) }, 0, 3, 0, 0.9)], 2).concat([B({})]), v0T: [0.3, 0.25, 0.3, 0.25, 0.3],
    v1: [B({ head: Z(0, -4, -20), tail: Z(0, -4, -15) }, 0, -1, -3, 1.05), B({ head: Z(1, -5, -22), tail: Z(0, -5, -18) }, 0, -1, -3, 1.06), B({})], v1T: [0.4, 0.8, 0.3] });
  // 沙海吞天：v0 吞沙漩渦（張大嘴撐住）、v1 鑽沙四連（尾巴拍兩下）
  VA('sandwhale', { v0: [B({ jaw: Z(0, 3, 14) }, -1, 0, -3), B({ jaw: Z(0, 4, 16) }, -2, 0, -4), B({ jaw: Z(0, 3, 14) }, -1, 0, -3), B({})], v0T: [0.4, 1.6, 0.8, 0.3],
    v1: rep([B({ tail: Z(0, -6, -20) }, 0, -1, 3), B({ tail: Z(0, 4, 16) }, 0, 1, -2)], 2).concat([B({})]), v1T: [0.3, 0.3, 0.3, 0.3, 0.3] });
  // 深淵之主：v0 八方觸手光（外套膜一縮一脹兩次）、v1（觸手大幅擺動）
  VA('kraken', { v0: rep([B({ mantle: Z(0, -4) }, 0, -1, 0, 1.06), B({ mantle: Z(0, 2) }, 0, 1, 0, 0.95)], 2).concat([B({})]), v0T: [0.4, 0.3, 0.4, 0.3, 0.3],
    v1: rep([B({ armL: Z(-2, -2, 8), armR: Z(2, -2, 8) }), B({ armL: Z(2, -2, -8), armR: Z(-2, -2, -8) })], 3).concat([B({})]), v1T: [0.22, 0.22, 0.22, 0.22, 0.22, 0.22, 0.3] });
  // 千面之森：v0 五道光（樹冠震五下）、v1 根網（整棵往下壓再彈起）
  VA('faceforest', { v0: rep([B({ crown: Z(0, -2, -3) }, 0, 0, 0, 1.03), B({ crown: Z(0, 1, 3) })], 5).concat([B({})]), v0T: [0.19, 0.19, 0.19, 0.19, 0.19, 0.19, 0.19, 0.19, 0.19, 0.19, 0.3],
    v1: [B({ crown: Z(0, 3) }, 0, 2, 0, 0.94), B({ crown: Z(0, -3) }, 0, -1, 0, 1.05), B({})], v1T: [0.4, 0.4, 0.3] });
  // 亡骸天災：v0 三次突進（頭往前撲三次）、v1 漩渦＋骨雨（大振翅）
  VA('bonewyvern', { v0: rep([B({ head: Z(2, -2, 8) }, 2, 0, 3), B({ head: Z(-4, 2, -8) }, -3, 0, -4)], 3).concat([B({})]), v0T: [0.45, 0.45, 0.45, 0.45, 0.45, 0.45, 0.3],
    v1: rep([B({ wingF: Z(0, -3, -10), wingB: Z(0, -3, 10) }, 0, -2), B({ wingF: Z(0, 2, 6), wingB: Z(0, 2, -6) }, 0, 1)], 3).concat([B({})]), v1T: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3] });
  // 萬雷之王：v0 雷格（右手連拍兩下）、v1 雷暴（雙手舉起撐住）
  VA('thunderape', { v0: rep([B({ armF: Z(2, -10, -18) }, 0, -2, -3), B({ armF: Z(4, 3, 8) }, 1, 2, 3, 0.96)], 2).concat([B({})]), v0T: [0.35, 0.3, 0.35, 0.3, 0.3],
    v1: [B({ armF: Z(-2, -12, -20), armB: Z(0, -3, -6), head: Z(0, -2, -6) }, -1, -3, -6), B({ armF: Z(-3, -13, -20), armB: Z(0, -3, -6), head: Z(0, -2, -8) }, -1, -3, -7), B({})], v1T: [0.4, 3.2, 0.3] });
  // 天狂風神：v0 十字風刃（張開翅膀）、v1（連續振翅）
  VA('windelder', { v0: [B({ wingL: Z(-3, -3, 12), wingR: Z(3, -3, -12) }, 0, -2, 0, 1.03), B({ wingL: Z(-3, -3, 12), wingR: Z(3, -3, -12) }, 0, -2, 0, 1.03), B({})], v0T: [0.4, 1.2, 0.3],
    v1: rep([B({ wingL: Z(0, -3, 12), wingR: Z(0, -3, -12) }, 0, -1), B({ wingL: Z(0, 2, -6), wingR: Z(0, 2, 6) }, 0, 1)], 3).concat([B({})]), v1T: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.3] });
  // 千棘狼王：v0 召喚狼群（長嚎）、v1 刺彈＋兩次突進（蹲低撲兩下）
  VA('spikewolf', { v0: [B({ head: Z(-2, -8, -18) }, 0, -1, -3, 1.04), B({ head: Z(-2, -9, -20) }, 0, -1, -3, 1.05), B({})], v0T: [0.4, 0.9, 0.3],
    v1: rep([B({ legF: Z(0, 2, 8), legB: Z(0, 2, -8) }, 0, 3, -3, 0.92), B({ legF: Z(2, -4, -18), legB: Z(0, 0, 14) }, 2, -3, 6, 1.04)], 2).concat([B({})]), v1T: [0.4, 0.5, 0.4, 0.5, 0.3] });
  // 魔王之鎧：v0 五連突進斬（刀左右揮五次）、v1 召喚足輕＋紫環（舉刀、壓低）
  VA('muhyo', { v0: rep([B({ arm: Z(-4, -6, 20) }, -1, 0, -3), B({ arm: Z(4, 2, -20) }, 2, 0, 4)], 5).concat([B({})]), v0T: [0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.35, 0.3],
    v1: [B({ arm: Z(0, -8, -20), head: Z(0, -1) }, 0, -1, 0, 1.03), B({ arm: Z(-4, -2, 20) }, 0, 3, 0, 0.94), B({})], v1T: [0.5, 0.8, 0.3] });
  // 2026-10-18：蓋在別的部位前面的肢體（雷鳴猿靠鏡頭那隻手蓋著後腳、大鎧拿家紋的左手），舉高會露出底下沒畫到的地方——只做小動作
  const small = (id, k, ang, up) => Object.values((RIG[id] || {}).anims || {}).forEach(arr => Array.isArray(arr) && arr.forEach(T => { const v = T && typeof T === 'object' && T[k]; if (!v) return; T[k] = [Math.max(-3, Math.min(3, v[0])), Math.max(-up, Math.min(3, v[1])), Math.max(-ang, Math.min(ang, v[2]))]; }));
  small('thunderape', 'armB', 6, 3); small('muhyo', 'armL', 8, 3); small('kraken', 'armL', 8, 3); small('kraken', 'armR', 8, 3);
  // 2026-10-18 作者還是看到斷手：關節轉超過 20° 就會被拉扯得像斷掉——所有骨頭的轉動上限 20°，多出來的角度改成往那個方向位移一點
  Object.keys(RIG).forEach(id => { const bones = Object.keys(RIG[id].bones || {}); Object.values(RIG[id].anims).forEach(arr => Array.isArray(arr) && arr.forEach(T => { if (!T || typeof T !== 'object') return; bones.forEach(k => { const v = T[k]; if (!v || Math.abs(v[2]) <= 20) return; const over = Math.abs(v[2]) - 20, sg = Math.sign(v[2]); T[k] = [v[0] + sg * over * 0.15, v[1] - over * 0.2, sg * 20]; }); })); });
})(window.R);
// ==== 領主體骨架 完 ====
