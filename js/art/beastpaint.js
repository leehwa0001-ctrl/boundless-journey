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
  // 橢圓的 Path2D（給 shape 用；大腿、膝蓋、腳掌）
  const oval = (cx, cy, rx, ry, rot) => { const p = new Path2D(); p.ellipse(cx, cy, rx, ry, rot || 0, 0, Math.PI * 2); return p; };
  // ---------- 尾隨犬：瘦長的影子狼犬（深胸細腰）、尖耳朵；背上的毛像黑煙往後飄，尾巴整條是一團煙；紫紅色的眼睛發光 ----------
  // 2026-10-10 作者：要像 SFC／GBA 時代 RPG 的怪物——一格一格手點（pixArt）。
  // 姿勢壓低、頭放到背的高度往前伸（在後面跟著你）；肩膀的煙毛豎起來、尾巴是三條往後飄的煙；齜牙（一顆小犬齒）。
  // 毛：1 最暗 → 5 最亮（陰影偏藍紫、亮面偏暖）；x y z 是遠的那一側（腳、耳朵）；煙：a 最暗 → d 最亮；E e r 眼睛的光；n 鼻子、m 牙肉、w 牙、p 耳朵內側。
  // ---------- 礦殼（2026-10-09 作者：原本的比較可愛）：照原本 22×12 的圖放大兩倍——
  // 扁扁的梯形圓頂殼（上面窄、下面寬）、背上三顆往前斜的結晶（紫、灰白、小紫）、前端一隻小黃眼睛、肚子深色、底下六隻細細的小腳。
  // 2026-10-10 改成手點（pixArt）：殼的明暗沿著圓頂的弧線一圈一圈（左上最亮、右下最暗），結晶分亮面、中間、暗面三面，小腳不描邊。
  // ---------- 霜冠鹿（領主體）：雪白的鹿，脖子一圈結霜的鬃毛，冰晶的鹿角，細長的腳和蹄，發藍光的眼睛 ----------
  // 2026-10-10 改成手點（pixArt）：大塊的身體、脖子、頭、腳先照形狀的弧面分五階（左上亮、右下暗，陰影偏藍），
  // 近的部位蓋在遠的上面時，背光的那一側（下、右）描一條深色的內線；鬃毛、鹿角、眼睛、鼻子、耳朵、蹄再一格一格點。
  // 毛：a 最暗 → e 最亮；f g h 是遠的那一側（腳）；鬃毛 o n m；冰：P 最暗 → S 最亮；蹄 K L；眼睛 E F G；鼻子 N；耳朵內側 p q。

  // ==== 巢織蛛 ====
  // ---------- 領主體・巢織蛛：黑紫色的大蜘蛛，腹部有紅褐色的斜紋，前面一團紅眼、一對淡色的螯牙；八隻腳的膝蓋高過身體 ----------
  // ==== 巢織蛛 完 ====
  // ==== 千節蟲 ====
  // ---------- 領主體・千節蟲：紅褐色的大蜈蚣，一節一節的背甲（接縫深色）、每節一對黃色的腳；頭有一對往前彎的觸角、一對深色的毒顎 ----------
  // ==== 千節蟲 完 ====
  // ==== 地出巨骸 ====
  // ---------- 領主體・地出巨骸：從地上的黑洞裡爬出來的巨大骷髏上半身；大頭骨、紅光的眼窩、一排牙，肋骨一根一根，兩手撐在洞口 ----------
  // ==== 地出巨骸 完 ====
  // ==== 熔顎蜥 ====
  // ---------- 領主體・熔顎蜥：岩石一樣的暗色厚皮、身上一條條發光的岩漿裂紋、背上一排岩刺；張著大嘴，嘴裡是熔岩的橘光，一排尖牙 ----------
  // ==== 熔顎蜥 完 ====
  // ==== 沙暴鯨與深淵王蛸 ====
  // 捲起來的一條（觸手、尾巴）：從 (x, y) 朝 a 度出發，每一步轉 curl 度、越來越短
  const curlPts = (x, y, a, len, curl, n) => { const p = [[x, y]]; let ang = a * Math.PI / 180; for (let i = 0; i < n; i++) { const l = len * (1 - i / (n + 2)); x += Math.cos(ang) * l; y += Math.sin(ang) * l; p.push([x, y]); ang += curl * Math.PI / 180 * 2.2 * Math.pow((i + 1) / n, 1.6); } return p; };   // 根部直、越到尖端捲越多
  // ---------- 領主體・沙暴鯨：在沙裡游的大鯨（頭大、身體往尾巴收細），下半身埋在起伏的沙丘裡、旁邊飛起沙；喉嚨幾條淺色的褶紋、長長的嘴線、背上幾顆藤壺，尾鰭翹起來 ----------
  // ---------- 領主體・深淵王蛸：深紫色的大章魚，頭（外套膜）上一塊塊暗斑；兩顆大大的黃眼睛（橫的瞳孔），底下的觸手往兩邊捲、尖端捲起來，內側一排淡粉色的吸盤 ----------
  // ==== 沙暴鯨與深淵王蛸 完 ====
  // ==== 領主二 ====
  // ---------- 領主體・萬面樹：一棵圓圓的大樹，濃綠的樹冠一團一團，裡面嵌著好幾張蒼白的臉（黑眼窩、張著嘴）；粗樹幹上也有一張大臉，樹根往外爬 ----------
  // ---------- 領主體・朽翼龍：只剩骨頭的翼龍——長脖子、角往後的頭骨、一根根的肋骨、骨頭撐著破破爛爛的暗色翼膜；眼窩裡一點青綠色的鬼火 ----------
  // ---------- 領主體・雷鳴猿：藍紫色的大猿，駝著背、長手臂撐地；胸口灰藍、臉是淺色的；頭上和肩膀竄著黃色的閃電，眼睛發黃光 ----------
  // ---------- 領主體・緋面風翁：戴著紅色長鼻面具的老翁，白長髮、白袍、紅腰帶；背後一大片黑色的羽毛披風，手上一把大大的綠色葉扇 ----------
  // ---------- 領主體・棘背狼：黑色的大狼，背上一排銀色的尖棘（往後斜），紅眼睛、齜牙（一顆尖犬齒在嘴的最後面） ----------
  // ==== 領主二 完 ====
  // ==== A1 ====
  // ---------- 三連貂：灰白的鼬，脖子圍著一條巾（絆＝藍、斬＝紅、癒＝綠），前腳是一把彎鐮刀；尾巴往後翹 ----------
  // ---------- 游焰：藍色的鬼火，下面圓、上面幾條火舌往上竄；核心亮、外圈暗；兩顆深色的眼睛 ----------
  // ---------- 行壁：會走路的石牆，一塊塊石磚（灰縫、裂紋），正面一張兇臉（粗眉、紅眼、一排牙），底下兩隻短腳 ----------
  // ---------- 喚群燈：會叫同伴的紙燈籠——橘色的燈籠紙一圈圈竹骨、上下深色的木蓋，一張大嘴（紅唇、舌頭），兩顆圓眼 ----------
  // ---------- 填隙肉芽：小小的肉色怪，大頭大肚子、細手細腳，駝背；凹進去的黃眼睛、裂開的嘴 ----------
  // ---------- 焰輪：著火的木頭車輪（輪框、輻條、輪軸），一圈火焰往外竄；中間一張兇臉 ----------
  // ---------- 砂幕者：彎著腰的老婆婆，沙色的斗篷兜帽遮住臉（只看得到發光的眼睛），手上提著一袋沙，沙一直漏下來 ----------
  // ---------- 鉤尾鯊：青灰色的鯊魚，背鰭高、尾巴末端一根倒鉤；白肚子、一排尖牙 ----------
  // ==== A1 完 ====
  // ==== A2 ====
  // ---------- 霜衣：黑長髮、蒼白的臉，白色的和服（陰影偏冰藍），下擺化成冷霧；淡藍色的眼睛 ----------
  // ---------- 群瞳：一顆肉色的大球，表面長滿大大小小的眼睛（白眼球、紅色的瞳孔），有的眼皮半閉 ----------
  // ---------- 根童：白白的小精靈，大大的圓頭、黑洞一樣的眼睛和嘴；頭會往旁邊歪 ----------
  // ---------- 纏身布：一長條在空中飄的白布，波浪狀、兩頭磨破成鬚鬚；前端兩個黑洞眼睛 ----------
  // ---------- 盤頂蛙：綠色的蛙人——背著褐色的硬殼、頭頂一個裝水的盤子（一圈頭髮）、黃色的鳥喙；手腳有蹼 ----------
  // ---------- 鑽口蛇：粗粗短短、像一截木頭的褐色大蛇，身上一圈圈的紋，淺色的肚子；前端一張圓圓的大嘴（一圈尖牙）、小眼睛 ----------
  // ---------- 影撲貓：壓低身子、準備撲上來的黑貓；尾巴尖端分岔成兩條，綠色發光的眼睛、粉紅的鼻子 ----------
  // ---------- 守墓骨兵：戴著暗色頭盔的骷髏武士，一手舉刀、一手拿圓木盾；頭盔前面一片金色的前立 ----------
  // ==== A2 完 ====
  // ==== B1 ====
  // ---------- 三羽鴉：烏鴉頭的人形——黑羽毛的頭、黃色的鳥喙，白衣紅領，背後一對黑翅膀、一束黑尾羽 ----------
  // ---------- 蛛身牛：蜘蛛的身體（暗紫、毛茸茸）、牛的頭——一對往上彎的白牛角、紅眼睛、鼻環一樣的鼻孔；八隻腳 ----------
  // ---------- 無面影：黑長髮、暗色和服紅腰帶，臉是一片光滑的白（什麼都沒有） ----------
  // ---------- 伸頸：穿暗色和服的女人，脖子長長地往上伸、彎來彎去，頭在最上面（黑髮、白臉、細細的眼睛） ----------
  // ---------- 鼓腹狸：圓滾滾的狸，大肚子（淺色、會拍打）、黑眼圈、蓬蓬的條紋尾巴 ----------
  // ---------- 幻尾狐：奶油白的狐狸，好幾條淡紫色的尾巴像扇子一樣張開；細長的眼睛、尖耳朵 ----------
  // ---------- 嵐翼：紅臉長鼻的山中怪人，背上一對大黑翅膀，白衣、手上一把羽扇；腳踩高齒木屐 ----------
  // ---------- 夜鳴獸：猴子的臉、老虎的身體（橘黃色、黑條紋）、蛇的尾巴（綠色、末端是蛇頭） ----------
  // ==== B1 完 ====
  // ==== B2 ====
  // ---------- 獨目童：光頭的小孩，臉中間一隻大眼睛，藍色的短和服 ----------
  // ---------- 纏煙：一團灰色的煙，邊緣一縷縷往後飄，裡面兩顆黃眼睛 ----------
  // ---------- 面果樹：小一點的樹，樹冠裡結著一顆顆人臉一樣的果子；粗樹幹 ----------
  // ---------- 紫電鼬：紫色的鼬，身上竄著黃色的電光，尾巴尖是一道閃電 ----------
  // ---------- 鐵齒鼠：灰色的大老鼠，門牙是鐵灰色的（又長又亮），細長的尾巴 ----------
  // ---------- 高仰影：細細高高、像圓錐一樣往上收的黑影，頂上一顆小頭、兩顆金色的眼睛；越往上看越高 ----------
  // ---------- 吞夢獸：黑白兩色的貘——前半身和腳是黑的、中間一圈白，長長的鼻子往下垂；小眼睛 ----------
  // ---------- 杓靈：淡藍色的幽靈，下半身是飄的尾巴，手上拿著一支長柄的杓子（舀水） ----------
  // ==== B2 完 ====
  // ==== C1 ====
  // ---------- 懸首：飄在空中的大頭——一大蓬亂糟糟的黑髮、蒼白的臉、紅眼睛、一條緊閉的嘴 ----------
  // ---------- 苔團：一團綠苔，表面毛毛的（亮點、暗點）、兩顆小眼睛，偶爾冒一根小芽 ----------
  // ---------- 燈蛾：奶油色的大翅膀（有眼紋），肚子是一盞發黃光的小燈籠，羽毛一樣的觸角 ----------
  // ---------- 石蝸：背著灰色石頭殼的蝸牛（殼上一圈圈的螺紋），淺褐色的身體、兩根眼柄 ----------
  // ---------- 晶刺蝟：棕灰色的刺蝟，背上一根根藍色的水晶刺（亮面朝左上） ----------
  // ---------- 影蜥：貼著地面爬的黑紫色蜥蜴，背上一排淡紫色的斑點，眼睛發紫光 ----------
  // ---------- 骨鳥：只剩骨頭的鳥——尖尖的頭骨長喙、一根根的翅骨、細長的腳；眼窩裡一點紅光 ----------
  // ---------- 泥偶：褐色的泥巴捏成的人偶，身上有手指捏過的凹痕，一隻橘色的獨眼；走路會掉泥塊 ----------
  // ==== C1 完 ====
  // ==== C2 ====
  // ---------- 鈴蟲：綠色的蟋蟀，長長的後腿、兩根長觸角，翅膀上一條淺色的紋 ----------
  // ---------- 鏽甲兵：一身生鏽的鎧甲（鐵鏽橘、斑駁），頭盔的縫裡一點黃光，拿著一面缺角的盾和一把短劍 ----------
  // ---------- 酸泡：一團黃綠色的酸液，表面冒著小泡泡，下面一攤滴在地上；兩顆小眼睛 ----------
  // ---------- 回音蝠：深紫色的蝙蝠，翅膀張開（翼膜上一根根指骨），大耳朵、紅眼睛、小尖牙 ----------
  // ---------- 鏡魔像：灰色石頭疊成的魔像，胸口嵌著一大片會反光的鏡子（淡藍、有斜的亮痕）；方頭、一隻藍眼睛 ----------
  // ---------- 裂地蠍：鐵鏽紅的大蠍子，一節一節的尾巴高高翹起、末端一根毒針；一對大鉗子、四對腳 ----------
  // ---------- 霧燈靈：淡藍白色的霧氣精靈，上半身圓、下半身拖成一縷霧；黑黑的眼睛、張開的小嘴 ----------
  // ---------- 蝕骨犬：只剩骨頭的狗——頭骨、肋骨、脊椎一節一節，細細的腳骨；眼窩裡紅光、齜著牙 ----------
  // ==== C2 完 ====
  // ==== D1 ====
  // ---------- 雷晶蛛：深紫色的蜘蛛，背上長著一塊發光的青色水晶，八隻腳 ----------
  // ---------- 鐘擺刃：轉個不停的金屬刃輪——四片彎刃（亮面朝左上）、中間一顆黃色的軸心 ----------
  // ---------- 黑泥巨口：一攤黑泥，整個前面裂開成一張大嘴（紅色的嘴裡、上下一排尖牙），上面兩顆黃眼睛 ----------
  // ---------- 號角骸：披著破舊紫袍的骷髏，舉著一支金色的號角在吹；眼窩紅光 ----------
  // ---------- 灰燼鴉：黑灰色的烏鴉，羽毛邊緣燒成橘紅色的餘燼，飛的時候掉火星 ----------
  // ---------- 白骨百足：骨頭串成的蜈蚣——一節一節的脊椎、每節兩隻骨腳；頭骨前面一對骨顎、紅眼 ----------
  // ---------- 冰棺守：一具直立的冰棺（半透明的淡藍、邊緣有霜），裡面隱約看得到一個人影；棺上一隻藍色的眼睛 ----------
  // ---------- 踏焰龜：岩石一樣的深褐色龜殼，殼的縫裡流著發光的熔岩；粗短的腳、慢吞吞的頭 ----------
  // ==== D1 完 ====
  // ==== D2 ====
  // ---------- 沙沉蟲：沙色的大蟲，一節一節（接縫深色），前端整個是一張圓嘴、一圈尖牙 ----------
  // ---------- 深淵觸手：從一灘黑水裡伸出來的深青色觸手，扭來扭去；身上一排發光的青色斑點、內側吸盤 ----------
  // ---------- 虛空行者：高高的黑影，罩著一件邊緣碎掉的長袍，胸口一顆發紫光的核，兜帽裡兩點紫光 ----------
  // ---------- 雙生影：兩個疊在一起的小黑影（一前一後、錯開半步），紫色的眼睛 ----------
  // ---------- 晶核獸：紫色的四腳獸，背上長著一排粉紅色的水晶，胸口一顆發光的晶核 ----------
  // ---------- 審判之眼：一顆大眼睛（白眼球、紅色的虹膜），兩邊一對金色的翅膀狀外框 ----------
  // ---------- 福影童：穿紅色和服的小女孩，黑色的妹妹頭，白白的臉；手裡捧著東西 ----------
  // ---------- 淘豆聲：戴著斗笠、蹲著的小矮人，手裡一個藍色的笊籬，裡面裝著紅豆 ----------
  // ==== D2 完 ====
  // ==== E1 ====
  // ---------- 長舌穢：綠色、黏黏的蛙形怪，蹲著；一條粉紅色的長舌頭伸出來甩 ----------
  // ---------- 黑潮僧：一大顆深藍黑色的圓滾滾海怪，像光頭的和尚；兩顆黃眼睛、一條嘴，底下一圈小觸手 ----------
  // ---------- 濕鱗女：黑長髮、蒼白臉的女人，脖子以下是一條盤起來的青綠色蛇身（鱗片一片片） ----------
  // ---------- 附犬靈：半透明的白色狗靈，趴著、尾巴捲起來，一隻紅眼睛 ----------
  // ---------- 八首蟒：一團黑土裡竄出好幾條綠色的大蛇，每一條都昂著頭、紅眼睛、吐著信 ----------
  // ---------- 赤角巨人：紅皮膚的大個子，頭上兩根白角、黃色的虎紋腰布，扛著一根帶刺的鐵棒；獠牙外露 ----------
  // ---------- 嶺婆：住在山裡的老婆婆，灰白的亂髮、橄欖色的破衣服，駝背，拿著一把柴刀；眼睛發黃光 ----------
  // ---------- 雪粒童：雪做的小孩，圓滾滾的白身體，戴著一頂斗笠；臉頰有點藍 ----------
  // ==== E1 完 ====
  // ==== E2 ====
  // ---------- 獨足鍛：只有一隻腳、一隻眼睛的鍛冶匠，褐色的工作服、皮圍裙，舉著一把大鐵鎚；獨眼是火紅色的 ----------
  // ---------- 抱嬰鳥：白色的大水鳥（像鷺），彎彎的長脖子、懷裡抱著一團布包；紅眼 ----------
  // ---------- 焚車貓：拖著一個著火車輪的黑貓——後面一個燒得正旺的木輪（橘紅的火），前面一隻黑貓，綠眼 ----------
  // ---------- 墜桶：從樹上掉下來的大頭——頭頂一根髮髻、粗眉毛、瞪大的眼睛、咧開的嘴 ----------
  // ---------- 預言犢：小牛的身體（米色、短腿），臉卻是一張人臉（黑髮、平靜的表情） ----------
  // ---------- 翻枕影：小小的光頭人影，穿著紫白條紋的睡衣，半瞇著眼；手裡抱著一顆枕頭 ----------
  // ---------- 捧盤童：戴著大斗笠的小孩，藍色的衣服，雙手捧著一盤白白方方的豆腐 ----------
  // ---------- 陶片將：青花瓷碎片拼成的武士——白底藍紋的盔甲（一片一片有裂縫），頭盔、圓盾；縫裡透出藍光 ----------
  // ==== E2 完 ====
  // ==== 樣本・狼的畫法 ====
  // ==== 2026-10-10 作者：不要球體畫法，照一開始的狼那樣（輪廓一列一列、平塗＋上緣亮邊＋下緣右緣暗邊、細節一格一格）——樣本三隻 ====
  // ---------- 三連貂：灰白的鼬，脖子圍著一條巾（絆＝藍、斬＝紅、癒＝綠），前腳舉著一把彎鐮刀；尾巴往後翹 ----------
  // ---------- 游焰：藍色的鬼火（2026-10-10 作者：像寶石——不要深色外框、不要對稱的水滴形）：
  // 火是發光的，不描黑邊；三條高低不一、往兩邊歪的火舌，上面飄兩點小火星；從邊緣往裡一層層變亮，最亮的芯在下半部（火的根），火舌尖比較暗；兩顆深色的眼睛 ----------
  // ---------- 領主體・熔顎蜥：岩石一樣的暗色厚皮、身上一條條發光的岩漿裂紋、背上一排往後斜的岩刺；張著大嘴（嘴裡熔岩的橘光、上下一排尖牙） ----------
  // ==== 樣本・狼的畫法 完 ====
  // ==== 巨獸一 ====
  // ==== 2026-10-10 作者：其他也要照狼的畫法；巨獸太可愛了——頭小、眼睛細長往上斜壓在眉骨下、張嘴露牙、輪廓有棱角、爪子和刺，顏色暗、重點色是血紅和病態的綠 ====
  // 腳上的剛毛：沿著一條腳的上側每隔幾格冒一根
  const bristle = (K, p, w, ch, step) => { for (let i = 0; i + 1 < p.length; i++) { const [x0, y0] = p[i], [x1, y1] = p[i + 1], L = Math.hypot(x1 - x0, y1 - y0) || 1; let nx = -(y1 - y0) / L, ny = (x1 - x0) / L; if (ny > 0) { nx = -nx; ny = -ny; } for (let t = step / 2; t < L; t += step) K.px(x0 + (x1 - x0) * t / L + nx * (w / 2 + 0.6), y0 + (y1 - y0) * t / L + ny * (w / 2 + 0.6), ch); } };
  // ---------- 領主體・巢織蛛：黑色的巨蛛，前面一對腳高高舉起來；腹部背上一排血紅的箭頭紋、側面一個沙漏紋；八顆紅眼擠在眉骨下面，一對大螯牙滴著綠色的毒；腳上一根根剛毛 ----------
  // ---------- 領主體・千節蟲：暗紅黑色的巨大蜈蚣，一節一節的背甲邊緣帶刺（接縫看得出來）、橘色的尖腳；頭上觸角往後掃，一對深色的大毒顎張開，眼睛細長發黃光 ----------
  // ---------- 領主體・地出巨骸：從地上的黑洞裡爬出來的巨大骷髏——有棱角的頭骨、往中間壓的眉骨、深深的眼窩裡一點紅光、裂開的頭蓋骨、上下兩排尖牙（下顎張開）；肋骨一根根、細長的骨爪摳著洞口 ----------
  // ---------- 領主體・霜冠鹿：冰原的巨鹿，壓低頭往前衝的姿勢——冰晶鹿角往前叉、鼻子噴出白霜；眼睛細長發青光壓在眉下；背上一排往後的冰刺、胸口一團結霜的鬃毛；蹄子深色 ----------
  // ==== 巨獸一 完 ====
  // ==== 巨獸二 ====
  // ---------- 領主體・沙暴鯨：從沙裡衝出來的巨鯨——張開的大嘴（暗紅的嘴裡、上下一排尖牙），小小的紅眼、背上一排骨刺、身上的舊傷疤；淺色的肚子，下半身埋在沙浪裡 ----------
  // ---------- 領主體・深淵王蛸：深紫黑色的巨蛸——頭罩一樣有稜角的外套膜、上面一排棘；細長發黃光的眼睛（橫的瞳孔、厚厚的眼皮）、兩眼中間一張骨色的鳥喙；觸手往外攤開，外側一排倒鉤、內側吸盤 ----------
  // ---------- 領主體・萬面樹：一棵扭曲的枯樹，枝幹像爪子一樣往外抓；黑綠色的葉叢裡嵌著好幾張痛苦的蒼白人臉（黑眼窩、尖叫的嘴）；樹幹上一張大臉——發紅光的斜眼、裂開的大嘴；樹根像觸手爬開 ----------
  // ---------- 領主體・朽翼龍：只剩骨頭的翼龍往前撲——張開的長顎（一排尖牙）、往後的角、眼窩裡青綠色的鬼火；骨翼高高舉起、翼膜破破爛爛；尾巴末端一根骨刺 ----------
  // ==== 巨獸二 完 ====
  // ==== 巨獸三 ====
  // ---------- 領主體・雷鳴猿：駝背的巨猿——寬大的肩背、壓得很低的小頭、垂到地上的長手臂和大拳頭；背上的毛一撮撮豎起；粗眉骨下細長的黃眼、張嘴露獠牙；肩膀和拳頭上竄著閃電 ----------
  // ---------- 領主體・緋面風翁：背後一大片破破爛爛的黑羽翅膀張開，白髮亂飛；紅面具上刻著往中間壓的怒眉、細長發光的眼、往下勾的長鼻；破爛的白袍，舉起一把大葉扇 ----------
  // ---------- 領主體・棘背狼：黑色的巨狼壓低頭往前，背上一排銀色的尖棘（肩膀最高、往後斜）；細長的紅眼壓在眉下，張著嘴露出犬齒；粗尾巴 ----------
  // ==== 巨獸三 完 ====
  // ==== 巨獸・壓迫感 ====
  // ==== 2026-10-10 作者：除了兩隻蟲都沒有 boss 的感覺、不是單純加粗——要有壓迫感：正面朝玩家、張開的大輪廓（角、手、翅膀），暗色調只有邊緣亮、眼睛發光，細節多 ====
  const mirror = (sp, W) => sp.map(([y, a, b, c]) => [y, W - 1 - b, W - 1 - a, c]);   // 左半邊畫好，鏡射成右半邊
  // ---------- 領主體・霜冠鹿（正面）：低著頭正對你，一對巨大的冰晶鹿角像王冠一樣往兩邊張開；胸口一大圈結霜的鬃毛，前腳張開站穩；細長發青光的眼睛，鼻子噴出白霧 ----------
  // ---------- 領主體・雷鳴猿（正面）：張開雙臂高舉過頭、握緊兩顆大拳頭，拳頭之間拉出閃電；寬大的肩背、壓在肩膀中間的小頭在怒吼（張大的嘴、獠牙），短而粗的腿岔開站 ----------
  // ---------- 領主體・地出巨骸（往前探）：從冒著黑紫瘴氣的大洞裡探出上半身，頭骨往前壓、下顎張得很大；一隻手撐在洞口，另一隻巨大的骨手朝你伸過來（越近越大）；肋骨又寬又粗，骨頭上一道道裂痕 ----------
  // ==== 巨獸・壓迫感 完 ====
  // ==== 時空之鑰樣本 ====
  // ==== 2026-10-10 作者：《時空之鑰》那種會動的大型 boss（FF6 也不錯）——正面、上半身巨大、頭小；每一塊肌肉各自上光（左上一團亮、塊和塊之間深色的縫）、
  //      皮膚有顆粒感、一隻怪一組同色系 7 階（近黑到很亮）＋一兩個重點色；畫得更精細（res 3：遊戲裡一樣大，格子更細） ====
  // ---------- 領主體・雷鳴猿：正面半蹲、兩隻粗手臂往兩邊撐、拳頭抵在地上；寬大的肩膀和背、壓在兩肩中間的小頭在怒吼；肩膀和拳頭竄著閃電 ----------
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
  // ==== 熔顎蜥・手點 完 ====
  // ==== 沙暴鯨・手點 ====
  // ---------- 領主體・沙暴鯨 v3（2026-10-11 作者給的參考圖：從沙裡衝出來的巨大座頭鯨，沙色的皮、長嘴線、喉嚨淺色的褶紋、沙殼和藤壺；長胸鰭往右下伸，尾鰭在右上翹起，底下捲起一團沙塵）----------
  // 輪廓、鰭、尾巴照參考圖描；皮的明暗拿參考圖縮小的亮暗；嘴線、褶紋、眼睛、藤壺、沙塵一格一格點。光從左上來。
  // 字：1 2 深色的紋和縫、a～e 沙色的皮（暗→亮）、f F 喉嚨的褶紋、u v w 沙塵（暗→亮）、E 眼睛的亮點、z 眼睛。
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
  // ==== 千節蟲・手點 完 ====
  // ==== 地出巨骸・手點 ====
  // ---------- 領主體・地出巨骸 v2（2026-10-11 作者給的參考圖：從土裡爬出來、駝背的巨大骷髏，一隻粗手臂撐在前面、巨大的骨手五指張開按著地；頭骨低低往前看；右邊一副肋骨、後面一隻骨腳；骨頭上掛著泥土，腳邊碎石）----------
  // 泥土和碎石照參考圖縮小當底稿；骨頭一根一根點、頭骨一格一格點。光從左上來。
  // 字：1～3 縫隙和陰影（暗→亮）、5～8 骨頭（暗→亮）、s S 泥土、E e 眼窩裡暗紅的光。
  // ==== 地出巨骸・手點 完 ====
  // ==== 深淵王蛸・手點 ====
  // ---------- 領主體・深淵王蛸 v3（2026-10-11 作者給的參考圖：深紫黑色的巨蛸，高高尖尖的頭罩、兩邊一對鰭，一對發紅光的眼睛；八條粗觸手往兩邊攤開、尖端捲起來，內側一排白色的吸盤）----------
  // 照參考圖縮小當底稿（輪廓、亮暗）。光從左上來。
  // 字：1～5 紫黑的身體（暗→亮）、p P 觸手內側的紫、v w W 吸盤（暗→亮）、E e 眼睛。
  // ==== 深淵王蛸・手點 完 ====
  // ==== 萬面樹・手點 ====
  // ---------- 領主體・萬面樹 v3（2026-10-11 作者給的參考圖：扭曲的灰褐色老樹，樹幹裡長出好幾張人臉、中間一張張嘴在叫、眼睛發橘光；樹皮上一塊塊青苔，光禿禿的枝幹往兩邊伸、末端幾片小葉；樹根像爪子一樣抓著地）----------
  // 樹幹的明暗拿參考圖縮小的亮暗；枝幹、樹根一根一根點，五張臉一格一格點。光從左上來。
  // 字：1～6 樹皮（暗→亮）、7 爪尖、m M l 青苔和葉子、z 眼窩、o 叫的嘴裡、E e 發光的眼睛。
  // ==== 萬面樹・手點 完 ====
  // ==== 朽翼龍・手點 ====
  // ---------- 領主體・朽翼龍 v3（2026-10-11 作者給的參考圖：只剩骨頭的龍，長頸彎下來、細長的頭骨、往後的角；一副肋骨；兩片骨翼撐著破破爛爛的暗橄欖綠翼膜；四條細長的骨腳；長骨尾往右捲、末端一片破爛的骨扇）----------
  // 一根一根點：骨頭兩端粗、關節凸（左上亮右下暗）；翼膜下緣一條條垂下來、到處是破洞；頭骨一格一格點。
  // 字：5～8 骨頭（暗→亮）、q g G 翼膜（暗→亮）、1 眼窩、E e 眼窩裡暗紅的光。
  // ==== 朽翼龍・手點 完 ====
  // ==== 雷鳴猿・參考圖 ====
  // ---------- 領主體・雷鳴猿 v3（2026-10-11 作者給的參考圖：藍黑色的巨猿，駝背、兩個大拳頭撐地；肩膀和背上一大片往後豎起來的灰白尖毛；頭小、皺著眉；手臂和拳頭上竄著黃色的閃電）----------
  // 照參考圖縮小當底稿（輪廓、亮暗）。光從左上來。只有閃電和眼睛發光。
  // 字：1～5 藍黑的身體（暗→亮）、6～9 灰白的尖毛（暗→亮）、y Y W 閃電（暗→亮）、E e 眼睛、z 眼窩。
  // ==== 雷鳴猿・參考圖 完 ====
  // ==== 緋面風翁・手點 ====
  // ---------- 領主體・緋面風翁 v3（2026-10-11 作者給的參考圖：用大翅膀把自己包起來的鳥人，緋紅的臉、長長往下勾的鳥喙、亂飛的白髮；黑色和緋紅的羽毛、翅膀下半截一大片奶白的長羽；細紅的鳥腳、彎爪）----------
  // 照參考圖縮小當底稿（輪廓、亮暗）。光從左上來。
  // 字：1～4 黑羽（暗→亮）、r R S 緋紅（暗→亮）、6～9 奶白的長羽和白髮（暗→亮）、E e 眼睛。
  // ==== 緋面風翁・手點 完 ====
  // ==== 棘背狼・手點 ====
  // ---------- 領主體・棘背狼 v3（2026-10-11 作者給的參考圖：壓低頭往前的大狼，灰白的毛、背上一片黑毛、身上一道道血紅；從脖子到尾巴一整排骨白、往後彎的大尖棘；細長的眼睛發黃光、齜牙；黑爪）----------
  // 照參考圖縮小當底稿（輪廓、亮暗）。光從左上來。
  // 字：1～5 黑毛和陰影（暗→亮）、6～9 灰白的毛（暗→亮）、w W 骨白的尖棘、r R 血紅、E e 眼睛、z 嘴裡。
  // ==== 棘背狼・手點 完 ====
  // ==== 新概念圖六隻 ====
  // ---------- 領主體・千節蟲 v4（2026-10-15 作者的新概念圖：直直立起來往下看的巨大蜈蚣，一節一節深色帶綠斑的甲殼、紅色的腳和大顎，後半身盤在地上）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：z E 眼睛、1～4 甲殼（暗→亮）、g G 甲殼上的綠斑、r R S 紅色的腳和大顎。
  // ---------- 領主體・緋面風翁 v4（2026-10-15 作者的新概念圖：張開一對巨大黑翅膀的老人，紅臉、長鼻子、亂飛的白髮，破爛的灰色長袍綁著白帶子，手裡拿著羽毛扇，站在石頭上）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～5 黑羽和長袍（暗→亮）、6～9 白髮、白帶子（暗→亮）、r R S 紅臉和手、z 眼睛。
  // ---------- 領主體・萬面樹 v4（2026-10-15 作者的新概念圖：巨大扭曲的老樹，樹幹和枝上長滿一張一張人臉，橄欖綠的樹冠，盤根往四面八方爬）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～6 樹皮和臉（暗→亮）、g G h 樹冠（暗→亮）。
  // ---------- 領主體・熔顎蜥 v4（2026-10-15 作者的新概念圖：整隻趴低的巨蜥，背上一排方塊狀的岩刺，張開的大嘴裡面熔岩發光、上下一排岩牙，肚子是淡色的一節一節）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～5 岩殼（暗→亮）、6～9 淡色的肚子和牙、y Y W 嘴裡的熔岩光。
  // ---------- 領主體・沙暴鯨 v4（2026-10-15 作者的新概念圖：沙色的巨鯨從沙裡探出來，張開的大嘴掛著一排鯨鬚，下巴和肚子淡色、一條一條的溝，尾巴往上翹，身上一塊一塊深色的斑）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～8 沙色（暗→亮）。
  // ---------- 領主體・朽翼龍 v4（2026-10-15 作者的新概念圖：高高站著的骨架飛龍，長脖子往前彎、頭低下來，兩片破爛的膜翼撐在地上，肋骨一根一根，身上掛著苔）----------
  // 照參考圖縮小當底稿（輪廓、亮暗），每一區自己的色階；遊戲裡的大小跟原本一樣。光從左上來。
  // 字：1～6 骨頭和膜翼（暗→亮）、g G 苔、z E 眼窩和裡面的光。
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
    if (t >= 3 && pal.Z) P2.Z = '#7A3AD8';   // 新點陣圖（beastpix.js）的外框：淵是紫色的光邊
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
  // 街上的：腳踏車只輕輕上下（不歪、不壓扁）；貓狗走路小小地起伏
  const GENB = { mx: 0.06, my: 0.08, bones: {}, anims: { idle: [B({})], move: [B({}, 0, 0), B({}, 0, 0), B({}, 0, -1), B({}, 0, 0)], atk: [B({})], hurt: [B({})] } };
  const GENT = { mx: 0.1, my: 0.12, bones: {}, anims: { idle: [B({}, 0, 0, 0, 1), B({}, 0, 0, 0, 0.98)], move: [B({}, 0, -1, -1), B({}, 0, 0), B({}, 0, -1, 1), B({}, 0, 0)], atk: [B({})], hurt: [B({})] } };
  const TOWN = id => (/^cyc[0-9]/.test(id) ? GENB : /^(cat|dog)[0-9]|^(crow|pigeon)/.test(id) ? GENT : null);
  const rigOf = id => RIG[id] || TOWN(id) || (isPix(id) ? (R.ENEMIES[baseOf(id)] && R.ENEMIES[baseOf(id)].fly ? GENF : GENS) : GEN);
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
