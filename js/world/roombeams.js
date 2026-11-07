// 精緻城市的店裡（CK.defineRoom）：開窗戶、白天照進一道光（2026-10-21 作者：窗戶的光束──不是只有公會一樓）
// 跟東鶴的室內（interiorfx.js 的 beams）同一個樣子：牆上一扇淡藍的窗、地上一塊光斑、一道斜的光束、光裡慢慢飄的灰塵。
// - 窗戶開在西牆、東牆空著的地方（附近沒有家具的碰撞盒），最多兩扇；都擋住才用北牆。窗戶跟著牆一起淡掉（tw.walls）。
// - 灰塵一扇 8 粒、一格大、很慢（2026-10-21 作者：粒子有時候像蟲）。
// - 沒窗的店（卡拉 OK、小鋼珠、賭場、夜店、劇場）不開；def.noWin 也可以關掉。
// ckpix.js 的 roomFx 第一次蓋的時候呼叫 R.roomWindows(tw)。
(function (R) {
  const W = R.W, T = () => THREE;
  const NOWIN = /karaoke|pachinko|casino|club|theater|cinema|arcade/;
  let TX = null;
  const tex = () => {
    if (TX) return TX; const TH = T();
    const mk = (wd, ht, f) => { const c = document.createElement('canvas'); c.width = wd; c.height = ht; const x = c.getContext('2d'), im = x.createImageData(wd, ht); for (let j = 0; j < ht; j++) for (let i = 0; i < wd; i++) { const k = (j * wd + i) * 4; im.data[k] = im.data[k + 1] = im.data[k + 2] = 255; im.data[k + 3] = Math.round(255 * Math.max(0, Math.min(1, f(i / (wd - 1), j / (ht - 1))))); } x.putImageData(im, 0, 0); const t = new TH.CanvasTexture(c); t.magFilter = t.minFilter = TH.LinearFilter; return t; };
    const ss = v => v * v * (3 - 2 * v);
    TX = { beam: mk(8, 32, (u, v) => ss(Math.min(1, v * 1.6)) * ss(Math.min(1, (1 - v) * 4)) * ss(1 - Math.abs(u - 0.5) * 2) * 1.4), blob: mk(32, 32, (u, v) => { const q = Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5)) * 2; return ss(Math.max(0, 1 - q)) * 1.1; }) };
    return TX;
  };
  R.roomWindows = tw => {
    const def = tw && tw.room, g = tw && tw.group; if (!def || !g || tw.rbeam || def.noWin || NOWIN.test(def.id || '')) return;
    const TH = T(), w = def.w, d = def.d, h = def.h || 3.6, HW = w / 2, HD = d / 2, y = Math.min(2.5, h - 1.1); if (y < 1.6) return;
    tw.rbeam = { dust: [], t: 0 };
    // 牆邊那一段有沒有家具（碰撞盒），門擋、牆不算
    const solids = (R.col.list || []).filter(b => b.on && b.tag !== 'wall' && b.tag !== 'bound' && b.tag !== 'npc');
    const clear = (x0, x1, z0, z1) => !solids.some(b => b.x1 > x0 && b.x0 < x1 && b.z1 > z0 && b.z0 < z1);
    const cand = [];
    [-0.22, 0.18].forEach(t => { cand.push(['w', t * d]); cand.push(['e', t * d]); });
    [-0.28, 0.28].forEach(t => cand.push(['n', t * w]));
    const wins = [];
    for (const [side, a] of cand) {
      if (wins.length >= 2 || (side === 'n' && wins.length)) break;
      const ew = side !== 'n', x = side === 'w' ? -HW : side === 'e' ? HW : a, z = ew ? a : -HD;
      if (ew ? !clear(side === 'w' ? -HW : HW - 0.7, side === 'w' ? -HW + 0.7 : HW, z - 0.9, z + 0.9) : !clear(x - 0.9, x + 0.9, -HD, -HD + 0.7)) continue;
      if (Math.abs(z) > HD - 1.2 || Math.abs(ew ? z : x) > (ew ? HD : HW) - 1) continue;
      const wl = (tw.walls || []).find(o => side === 'w' ? o.nx === -1 : side === 'e' ? o.nx === 1 : o.nz === -1); if (!wl) continue;
      // 窗：玻璃＋十字窗框＋上下的框（材質交給牆一起淡掉）
      const nx = side === 'w' ? 1 : side === 'e' ? -1 : 0, nz = ew ? 0 : 1, wg = new TH.Group(); wg.position.set(x + nx * 0.02, y, z + nz * 0.02); wg.rotation.y = ew ? Math.PI / 2 : 0; wl.grp.add(wg);
      const glass = new TH.MeshLambertMaterial({ color: new TH.Color('#CFE0F0').convertSRGBToLinear(), emissive: new TH.Color('#9FBEDC').convertSRGBToLinear(), emissiveIntensity: 0.7 }), frame = new TH.MeshLambertMaterial({ color: new TH.Color('#3A2E26').convertSRGBToLinear() });
      const bx = (sx, sy, sz, m, oy) => { const o = new TH.Mesh(new TH.BoxGeometry(sx, sy, sz), m); o.position.y = oy || 0; wg.add(o); return o; };
      bx(1.2, 1.4, 0.06, glass); bx(0.08, 1.4, 0.1, frame); bx(1.2, 0.08, 0.1, frame); bx(1.36, 0.1, 0.16, frame, 0.75); bx(1.36, 0.1, 0.2, frame, -0.75);
      wl.mats.push(glass, frame);
      wins.push([x + nx * 0.06, y, z + nz * 0.06, nx, nz]);
    }
    // 光（白天、傍晚）
    const hr = R.S && R.S.hour != null ? R.S.hour : 12, day = hr >= 7 && hr < 17, dusk = (hr >= 16 && hr < 18) || (hr >= 6 && hr < 8);
    if (!wins.length || !(day || dusk)) return;
    const tx = tex(), col = new TH.Color(dusk ? '#FFC890' : '#FFF0D2').convertSRGBToLinear(), a = dusk ? 0.16 : 0.2;
    const beamM = new TH.MeshBasicMaterial({ color: col, map: tx.beam, transparent: true, opacity: a, depthWrite: false, blending: TH.AdditiveBlending, side: TH.DoubleSide });
    const patchM = new TH.MeshBasicMaterial({ color: col, map: tx.blob, transparent: true, opacity: a * 1.1, depthWrite: false, blending: TH.AdditiveBlending });
    wins.forEach(([wx, wy, wz, nx, nz]) => {
      const reach = Math.min(2.6, wy * 0.95), fx = wx + nx * reach, fz = wz + nz * reach;
      const p = new TH.Mesh(new TH.PlaneGeometry(nx ? 2.0 : 1.5, nx ? 1.5 : 2.0), patchM); p.rotation.x = -Math.PI / 2; p.position.set(fx, 0.016, fz); p.renderOrder = 2; g.add(p);
      const len = Math.hypot(reach, wy), b = new TH.Mesh(new TH.PlaneGeometry(1.3, len), beamM);
      const u = new TH.Vector3(-nz, 0, nx), v = new TH.Vector3(wx - fx, wy, wz - fz).normalize(), n = new TH.Vector3().crossVectors(u, v);
      b.quaternion.setFromRotationMatrix(new TH.Matrix4().makeBasis(u, v, n)); b.position.set((wx + fx) / 2, wy / 2, (wz + fz) / 2); b.renderOrder = 3; g.add(b);
      const N = 8, arr = new Float32Array(N * 3), seed = []; for (let i = 0; i < N; i++) seed.push([Math.random(), (Math.random() - 0.5) * 1.1, Math.random() * 6]);
      const pg = new TH.BufferGeometry(); pg.setAttribute('position', new TH.BufferAttribute(arr, 3));
      const pts = new TH.Points(pg, new TH.PointsMaterial({ color: new TH.Color('#FFF4DC').convertSRGBToLinear(), size: 1, sizeAttenuation: false, transparent: true, opacity: 0.4, depthWrite: false, blending: TH.AdditiveBlending }));
      pts.frustumCulled = false; pts.renderOrder = 4; g.add(pts);
      tw.rbeam.dust.push({ pts, arr, seed, wx, wy, wz, fx, fz, nx, nz });
    });
  };
  // 灰塵：沿著光束很慢地往下飄
  let last = 0;
  const tick = now => {
    requestAnimationFrame(tick);
    const dt = Math.min(0.05, (now - last) / 1000 || 0); last = now;
    const tw = W.town, f = tw && tw.room && tw.rbeam; if (!f || !f.dust.length || W.paused) return;
    f.t += dt;
    f.dust.forEach(D => { const { arr, seed, wx, wy, wz, fx, fz, nx, nz } = D; for (let i = 0; i < seed.length; i++) { const s = seed[i]; s[0] = (s[0] + dt * 0.006) % 1; const t = s[0], wob = Math.sin(f.t * 0.25 + s[2]) * 0.04; arr[i * 3] = wx + (fx - wx) * t - nz * (s[1] + wob); arr[i * 3 + 1] = wy * (1 - t) + 0.2 + Math.sin(f.t * 0.2 + s[2] * 2) * 0.05; arr[i * 3 + 2] = wz + (fz - wz) * t + nx * (s[1] + wob); } D.pts.geometry.attributes.position.needsUpdate = true; });
  };
  requestAnimationFrame(tick);
})(window.R);
