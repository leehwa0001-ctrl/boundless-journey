// 精緻城市改成像素畫法（2026-10-20 作者：精緻版跟我們的人物會割裂；照作者給的像素影片、圖那樣——東鶴先不動，先拿皇嶺來試）
// 參考：低解析度的 3D 場景、少色平塗、網點漸層、強烈明暗與冷暖對比、夜裡路燈和窗戶是主角。
// - 跟遺跡同一套做法：先畫到小畫布（一格像素＝人物的一個像素，R.PIX.PX 公尺），再整數倍放大；放大的時候
//   描邊（深度差大的邊變暗）、色階收斂（每個顏色只留幾階，中間用 4×4 網點抖動混出來）、亮又鮮豔的東西透出像素格的光暈、暗角。
// - 鏡頭對齊像素格（走路時不動的東西每一格都落在同樣的像素上，不閃）。
// - 小畫布要畫的像素少很多，也比較順。水面倒影、天空在這種畫法裡不畫。
// - 目前只有皇嶺（PIXCITY）；暫停選單「畫法：像素／精緻」切換，存在瀏覽器（tfl-ckpix-城市）。
// 放在 citykit*.js、ckperf*.js、cktopcam.js 後面（最外層的 CK.render）。
(function (R) {
  const CK = R.CK, W = R.W, T = () => THREE; if (!CK || !CK.render) return;
  const PIXCITY = { huangling: 1 };
  const LS = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { } return null; };
  const want = id => { const v = LS('tfl-ckpix-' + id); return v ? v === '1' : !!PIXCITY[id]; };
  const active = () => { const tw = W.town; return !!(tw && tw.ck && !tw.room && W.scene && W.scene.userData.hq && want(tw.ck)); };
  R.ckPixOn = active;
  // ---------- 畫布、著色器 ----------
  const S = {};
  const VS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const init = () => {
    const TH = T();
    S.rt = new TH.WebGLRenderTarget(4, 4, { minFilter: TH.NearestFilter, magFilter: TH.NearestFilter, generateMipmaps: false, type: TH.HalfFloatType });
    S.rt.depthTexture = new TH.DepthTexture(4, 4); S.rt.depthTexture.type = TH.UnsignedIntType;
    const o = { minFilter: TH.NearestFilter, magFilter: TH.NearestFilter, generateMipmaps: false, type: TH.HalfFloatType };
    S.a = new TH.WebGLRenderTarget(4, 4, o); S.b = new TH.WebGLRenderTarget(4, 4, o);
    const sm = (fs, u) => new TH.ShaderMaterial({ uniforms: u, vertexShader: VS, fragmentShader: fs, depthTest: false, depthWrite: false });
    // 發光：亮（線性 0.85 以上）而且鮮豔，或是很亮（1.2 以上，路燈、窗戶的自發光）
    S.bright = sm('uniform sampler2D t; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float b = max(c.r, max(c.g, c.b)), s = b > 0.0 ? (b - min(c.r, min(c.g, c.b))) / b : 0.0;'
      + ' float k = max(smoothstep(0.85, 1.4, b) * smoothstep(0.2, 0.6, s), smoothstep(1.2, 2.2, b)); gl_FragColor = vec4(c * k, 1.0); }', { t: { value: null } });
    S.blur = sm('uniform sampler2D t; uniform vec2 d; varying vec2 vUv; void main(){ vec3 s = texture2D(t, vUv).rgb * 0.227; s += (texture2D(t, vUv + d).rgb + texture2D(t, vUv - d).rgb) * 0.194;'
      + ' s += (texture2D(t, vUv + d * 2.0).rgb + texture2D(t, vUv - d * 2.0).rgb) * 0.121; s += (texture2D(t, vUv + d * 3.0).rgb + texture2D(t, vUv - d * 3.0).rgb) * 0.054; s += (texture2D(t, vUv + d * 4.0).rgb + texture2D(t, vUv - d * 4.0).rgb) * 0.016; gl_FragColor = vec4(s, 1.0); }', { t: { value: null }, d: { value: new TH.Vector2() } });
    // 放大：描邊、發光、色調、色階＋網點、暗角；自己換成 sRGB（不用 three 的 encodings）
    S.comp = sm([
      'uniform sampler2D tC; uniform sampler2D tD; uniform sampler2D tB; uniform vec2 res; uniform float scale; uniform vec2 off; uniform float cN; uniform float cF; uniform float lv; uniform float bk; uniform float expo; uniform float vig; uniform float sat;',
      'float dep(vec2 p){ float z = texture2D(tD, (p + 0.5) / res).x; return cN * cF / (cF - z * (cF - cN)); }',
      'float bayer(vec2 p){ vec2 q = mod(p, 4.0); int i = int(q.x) + int(q.y) * 4; float m[16]; m[0]=0.;m[1]=8.;m[2]=2.;m[3]=10.;m[4]=12.;m[5]=4.;m[6]=14.;m[7]=6.;m[8]=3.;m[9]=11.;m[10]=1.;m[11]=9.;m[12]=15.;m[13]=7.;m[14]=13.;m[15]=5.;',
      '  float v = 0.0; for (int k = 0; k < 16; k++) { if (k == i) v = m[k]; } return v / 16.0 - 0.47; }',
      'vec3 tone(vec3 x){ x *= expo; return x / (1.0 + x * 0.32); }',
      'void main(){',
      '  vec2 p = floor((gl_FragCoord.xy + off) / scale);',
      '  vec3 c = texture2D(tC, (p + 0.5) / res).rgb + texture2D(tB, (p + 0.5) / res).rgb * bk;',
      '  float d = dep(p), far = max(max(dep(p + vec2(1.0, 0.0)), dep(p - vec2(1.0, 0.0))), max(dep(p + vec2(0.0, 1.0)), dep(p - vec2(0.0, 1.0))));',
      '  if (far - d > 0.6 + d * 0.012) c *= 0.55;',
      '  c = tone(c); float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, sat);',
      '  vec2 q = (p + 0.5) / res - 0.5; c *= 1.0 - vig * dot(q, q) * 1.6;',
      '  c = pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));',
      '  c = clamp(floor(c * lv + 0.5 + bayer(p) * 0.55) / lv, 0.0, 1.0);',   // 色階收斂＋4×4 網點
      '  gl_FragColor = vec4(c, 1.0);',
      '}'].join('\n'), { tC: { value: S.rt.texture }, tD: { value: S.rt.depthTexture }, tB: { value: S.a.texture }, res: { value: new TH.Vector2(4, 4) }, scale: { value: 1 }, off: { value: new TH.Vector2() }, cN: { value: 1 }, cF: { value: 100 }, lv: { value: 10 }, bk: { value: 0.9 }, expo: { value: 1 }, vig: { value: 0.4 }, sat: { value: 1.1 } });
    S.scene = new TH.Scene(); S.cam = new TH.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    S.quad = new TH.Mesh(new TH.PlaneGeometry(2, 2), S.comp); S.quad.frustumCulled = false; S.scene.add(S.quad);
  };
  const pass = (mat, target) => { S.quad.material = mat; W.renderer.setRenderTarget(target); W.renderer.render(S.scene, S.cam); };
  // ---------- 一格 ----------
  const render = () => {
    const r = W.renderer, TH = T(); if (!S.rt) init();
    const cam = W.pcam || W.camera; if (W.camera !== cam) { cam.position.copy(W.camera.position); cam.quaternion.copy(W.camera.quaternion); W.camera = cam; }
    const dpr = window.devicePixelRatio || 1; if (Math.abs(r.getPixelRatio() - dpr) > 0.01) r.setPixelRatio(dpr);   // 最後一步只是放大，畫布用螢幕真正的解析度
    const v = new TH.Vector2(); r.getDrawingBufferSize(v); const bw = v.x, bh = v.y; if (bw < 4 || bh < 4) return;
    // 小畫布多大：人物那個距離，畫面一格＝一個點陣像素
    const P0 = W.P, PX = R.PIX ? R.PIX.PX : 1 / 12, tgt = P0 ? new TH.Vector3(P0.x, (P0.yv || 0) + 1, P0.z) : new TH.Vector3();
    const dist = cam.position.distanceTo(tgt) || 30, viewH = 2 * dist * Math.tan(cam.fov / 2 * Math.PI / 180);
    const s = Math.max(1, Math.round(bh / (viewH / PX))), rw = 2 * Math.ceil(bw / s / 2), rh = 2 * Math.ceil(bh / s / 2);
    if (S.rt.width !== rw || S.rt.height !== rh) { S.rt.setSize(rw, rh); S.a.setSize(rw, rh); S.b.setSize(rw, rh); S.comp.uniforms.res.value.set(rw, rh); }
    if (cam.near !== 0.8 || cam.far !== 600 || Math.abs(cam.aspect - rw / rh) > 1e-4) { cam.near = 0.8; cam.far = 600; cam.aspect = rw / rh; cam.updateProjectionMatrix(); }
    // 鏡頭對齊像素格（沿鏡頭的左右、上下方向挪到整數格）
    cam.updateMatrixWorld();
    const e = cam.matrixWorld.elements, p = cam.position, u = viewH / rh;
    const pr = p.x * e[0] + p.y * e[1] + p.z * e[2], pu = p.x * e[4] + p.y * e[5] + p.z * e[6];
    const dr = Math.round(pr / u) * u - pr, du = Math.round(pu / u) * u - pu;
    p.x += dr * e[0] + du * e[4]; p.y += dr * e[1] + du * e[5]; p.z += dr * e[2] + du * e[6]; cam.updateMatrixWorld();
    // 天空、倒影不畫
    const L = W.town && W.town.L, sky = L && L.sky, sv = sky && sky.visible; if (sky) sky.visible = false;
    // 雪、雨的點是照螢幕像素算大小的：畫在小畫布上再放大會大 s 倍（2026-10-20 作者：雪還是太大顆了）——畫的時候除回去
    const su = L && L.snow && L.snow.material && L.snow.material.uniforms && L.snow.material.uniforms.size, sz0 = su && su.value; if (su) su.value = sz0 / s * 0.75;   // 小畫布上大約 2 格
    try { r.setRenderTarget(S.rt); r.clear(); r.render(W.scene, cam); } finally { if (sky) sky.visible = sv; if (su) su.value = sz0; }
    // 發光
    S.bright.uniforms.t.value = S.rt.texture; pass(S.bright, S.a);
    for (let k = 0; k < 2; k++) { S.blur.uniforms.t.value = S.a.texture; S.blur.uniforms.d.value.set((k + 1) / rw, 0); pass(S.blur, S.b); S.blur.uniforms.t.value = S.b.texture; S.blur.uniforms.d.value.set(0, (k + 1) / rh); pass(S.blur, S.a); }
    // 放大
    const U = S.comp.uniforms, night = L ? Math.min(1, L.lampK || 0) : 0, post = CK.post || {};
    U.scale.value = s; U.off.value.set(Math.floor((rw * s - bw) / 2), Math.floor((rh * s - bh) / 2)); U.cN.value = cam.near; U.cF.value = cam.far;
    U.expo.value = (post.expo || 0.88) * (0.92 + night * 0.2);   // 白天雪地太亮：白天收一點、晚上亮一點 U.bk.value = 0.55 + night * 0.6; U.sat.value = 1.08; U.vig.value = 0.35 + night * 0.15;
    pass(S.comp, null);
  };
  // ---------- 平塗：地面、屋頂、牆這些寫實的雜訊貼圖換成平均色（網點會把雜訊放大成滿地沙點）；有窗戶的外牆、招牌、燈留著 ----------
  const KEEP = /^(fac|sign|shopLit|winLit|glass|neon|lamp|kiosk|awn|chochin|boat|car|train|tex:)/;
  let flat = false;
  const avgOf = img => { try { const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 8, 8); const d = g.getImageData(0, 0, 8, 8).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4; return new (T().Color)(r / n / 255, gg / n / 255, b / n / 255).convertSRGBToLinear(); } catch (e) { return null; } };
  const setFlat = on => {
    if (on === flat) return; flat = on;
    Object.entries(CK.mats || {}).forEach(([k, m]) => {
      if (!m || !m.isMeshStandardMaterial) return; const u = m.userData;
      if (on) { if (!m.map || KEEP.test(k) || m.transparent || u.pxMap) return; const a = avgOf(m.map.image); if (!a) return; u.pxMap = m.map; u.pxN = m.normalMap; u.pxR = m.roughnessMap; u.pxC = m.color.clone(); m.color.multiply(a); m.map = null; m.normalMap = null; m.roughnessMap = null; m.needsUpdate = true; }
      else if (u.pxMap) { m.map = u.pxMap; m.normalMap = u.pxN; m.roughnessMap = u.pxR; m.color.copy(u.pxC); delete u.pxMap; delete u.pxN; delete u.pxR; delete u.pxC; m.needsUpdate = true; }
    });
  };
  const r0 = CK.render;
  CK.render = (...a) => { const on = active(); setFlat(on); return on ? render() : r0(...a); };
  // ---------- 暫停選單：畫法 ----------
  const tm = R.townMenu;
  if (tm) R.townMenu = (...a) => {
    const out = tm(...a);
    try {
      const tw = W.town, row = document.querySelector('#r-sheet .row'); if (!tw || !tw.ck || tw.room || !row || row.querySelector('#ck-pixmode')) return out;
      const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'ck-pixmode';
      const lab = () => '畫法：' + (want(tw.ck) ? '像素（測試）' : '精緻');
      b.textContent = lab(); b.title = '像素：跟人物、遺跡一樣的像素畫法（測試中）';
      b.onclick = () => { LS('tfl-ckpix-' + tw.ck, want(tw.ck) ? '0' : '1'); b.textContent = lab(); };
      row.appendChild(b);
    } catch (e) { }
    return out;
  };
})(window.R);
