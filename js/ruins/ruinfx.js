// 遺跡內部的畫面升級（2026-10-20 作者：小怪要換成更精緻的新圖，遺跡內部一起升級到「MC 開中等光影包」的感覺；交接：遺跡光影升級_交接.md）
// 第一階段：色調映射＋調色、發光（bloom）。
// - 都做在像素那一層：pixel.js 先把場景畫到小畫布，再用 R.pixPost 這道著色器整數倍放大；
//   這裡在放大那一道加調色（ACES 色調映射、每種環境的色溫、飽和度、暗部帶一點顏色、暗角），
//   發光在放大之前、小畫布的解析度上做（挑出夠亮的像素 → 模糊兩次），光暈本身也是像素格，不會糊、走路不閃。
// - 只在遺跡裡（W.run）；城裡、像素版東鶴、室內都照舊（R.pixPost 的 rfOn 關掉）。
// - 色溫一張表（GRADE），照 run.env／地形風格（run.biome）換：一般偏冷灰藍、火山與岩漿海橘紅、凍原冷白藍、沙漠暖黃、深海青綠、熔爐橘銅、晶洞偏紫、密林偏綠。
// - 畫質：R.S.opts.ruinGfx（0 低＝跟以前一樣、1 中、2 高）；觸控裝置預設低，電腦預設中。暫停選單「遺跡畫質」切換（之後的階段：光源、牆角變暗、霧和浮塵、材質）。
// 放在 js/art/pixel.js、js/ruins/biome.js、js/ruins/dread.js、js/ruins/fogarc.js 後面（最外層的 R.renderFrame）。
(function (R) {
  const W = R.W, T = () => THREE;
  // ---------- 色溫表 ----------
  // tint：乘上去的顏色；lift：暗部帶的顏色；sat：飽和度；expo：曝光；bloom：發光強度；th：多亮才發光
  const GRADE = {
    base: { tint: [0.93, 0.98, 1.07], lift: [0.012, 0.018, 0.03], sat: 1.06, expo: 1.04, bloom: 0.50, th: 0.86 },
    volcano: { tint: [1.12, 0.95, 0.82], lift: [0.03, 0.012, 0.006], sat: 1.12, expo: 1.01, bloom: 0.63, th: 0.82 },
    snow: { tint: [0.95, 1.0, 1.1], lift: [0.02, 0.026, 0.04], sat: 0.92, expo: 0.98, bloom: 0.41, th: 0.90 },
    desert: { tint: [1.1, 1.02, 0.87], lift: [0.03, 0.022, 0.01], sat: 1.04, expo: 1.00, bloom: 0.41, th: 0.90 },
    deep: { tint: [0.86, 1.02, 1.06], lift: [0.0, 0.022, 0.03], sat: 1.06, expo: 1.04, bloom: 0.59, th: 0.80 },
    forge: { tint: [1.1, 0.97, 0.85], lift: [0.03, 0.016, 0.006], sat: 1.08, expo: 1.01, bloom: 0.59, th: 0.82 },
    crystal: { tint: [0.96, 0.95, 1.1], lift: [0.018, 0.012, 0.035], sat: 1.1, expo: 1.02, bloom: 0.68, th: 0.78 },
    forest: { tint: [0.95, 1.05, 0.92], lift: [0.01, 0.022, 0.01], sat: 1.06, expo: 1.02, bloom: 0.45, th: 0.88 },
    interior: { tint: [1.05, 1.0, 0.93], lift: [0.02, 0.014, 0.01], sat: 1.06, expo: 1.04, bloom: 0.42, th: 0.9 }   // 室內（interiorfx.js）：暖一點
  };
  const gradeKey = run => { if (W.inside && W.inside.ifx) return 'interior'; if (!run) return 'base'; if (run.env && GRADE[run.env]) return run.env; const b = run.biome; return b === 'lava' ? 'volcano' : b && GRADE[b] ? b : 'base'; };   // 招牌景色（ruinsites.js）會把自己的色溫加進這張表
  R.RUIN_GRADE = GRADE;
  // ---------- 畫質 ----------
  const gfx = () => { const o = R.S && R.S.opts; if (o && o.ruinGfx != null) return o.ruinGfx; return R.touch ? 0 : 1; };
  R.ruinGfx = gfx;
  const active = () => { const w = W, run = w.run; return !!(w.scene && w.scene.userData.pix && gfx() > 0 && ((run && !w.town) || (w.inside && w.inside.ifx))); };   // 2026-10-20：室內精進的樣品（interiorfx.js）也用
  // ---------- 放大那一道：加調色、發光 ----------
  let patched = false;
  const patch = () => {
    const m = R.pixPost; if (!m || patched) return; patched = true;
    const TH = T();
    Object.assign(m.uniforms, { rfOn: { value: 0 }, rfBloom: { value: null }, rfBloomK: { value: 0 }, rfTint: { value: new TH.Vector3(1, 1, 1) }, rfLift: { value: new TH.Vector3() }, rfSat: { value: 1 }, rfExpo: { value: 1 }, rfVig: { value: 0 } });
    let fs = m.fragmentShader;
    fs = fs.replace('void main(){', 'uniform float rfOn; uniform sampler2D rfBloom; uniform float rfBloomK; uniform vec3 rfTint; uniform vec3 rfLift; uniform float rfSat; uniform float rfExpo; uniform float rfVig;\n'
      + 'vec3 rfTone(vec3 x){ x = pow(max(x, 0.0), vec3(1.12)) * 1.04; vec3 o = max(x - 0.8, 0.0); return min(x - o + o / (1.0 + o * 2.5), 1.0); }\nvoid main(){');   // 小畫布是 8 位元（最亮 1）：ACES 只會把中間調提亮、整片泛白；改成加對比、暗部壓深一點、高光柔和收尾
    fs = fs.replace('  gl_FragColor = vec4(c, 1.0);', '  if (rfOn > 0.5) {\n'
      + '    c += texture2D(rfBloom, (p + 0.5) / res).rgb * rfBloomK;\n'
      + '    c = rfTone(c * rfExpo * rfTint);\n'
      + '    float l = dot(c, vec3(0.299, 0.587, 0.114)); c = mix(vec3(l), c, rfSat);\n'
      + '    c += rfLift * (1.0 - c);\n'
      + '    vec2 q = (p + 0.5) / res - 0.5; c *= 1.0 - rfVig * dot(q, q) * 1.6;\n'
      + '  }\n  gl_FragColor = vec4(c, 1.0);');
    m.fragmentShader = fs; m.needsUpdate = true;
  };
  // ---------- 發光：小畫布的解析度上，挑亮的 → 橫、直模糊（兩次） ----------
  const BL = {};
  const quadVS = 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }';
  const blInit = () => {
    const TH = T(), opt = { minFilter: TH.NearestFilter, magFilter: TH.NearestFilter, generateMipmaps: false, type: TH.HalfFloatType };
    BL.a = new TH.WebGLRenderTarget(4, 4, opt); BL.b = new TH.WebGLRenderTarget(4, 4, opt);
    const sm = (fs, u) => new TH.ShaderMaterial({ uniforms: u, vertexShader: quadVS, fragmentShader: fs, depthTest: false, depthWrite: false });
    BL.bright = sm('uniform sampler2D t; uniform float th; varying vec2 vUv; void main(){ vec3 c = texture2D(t, vUv).rgb; float b = max(c.r, max(c.g, c.b)), s = b > 0.0 ? (b - min(c.r, min(c.g, c.b))) / b : 0.0; float k = smoothstep(th, 1.0, b) * smoothstep(0.18, 0.55, s); gl_FragColor = vec4(c * k, 1.0); }', { t: { value: null }, th: { value: 0.7 } });
    // 9 個點的高斯模糊（照像素中心取樣：結果也是一格一格的）
    BL.blur = sm('uniform sampler2D t; uniform vec2 d; varying vec2 vUv; void main(){ vec3 s = texture2D(t, vUv).rgb * 0.227;'
      + ' s += (texture2D(t, vUv + d).rgb + texture2D(t, vUv - d).rgb) * 0.194; s += (texture2D(t, vUv + d * 2.0).rgb + texture2D(t, vUv - d * 2.0).rgb) * 0.121;'
      + ' s += (texture2D(t, vUv + d * 3.0).rgb + texture2D(t, vUv - d * 3.0).rgb) * 0.054; s += (texture2D(t, vUv + d * 4.0).rgb + texture2D(t, vUv - d * 4.0).rgb) * 0.016; gl_FragColor = vec4(s, 1.0); }', { t: { value: null }, d: { value: new TH.Vector2() } });
    BL.scene = new TH.Scene(); BL.cam = new TH.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    BL.quad = new TH.Mesh(new TH.PlaneGeometry(2, 2), BL.bright); BL.quad.frustumCulled = false; BL.scene.add(BL.quad);
  };
  const pass = (ren, mat, target) => { BL.quad.material = mat; W.renderer.setRenderTarget(target); ren.call(W.renderer, BL.scene, BL.cam); };
  const bloom = (ren, g) => {
    const m = R.pixPost, src = m.uniforms.tColor.value, res = m.uniforms.res.value; if (!src) return;
    if (!BL.a) blInit();
    const w = res.x | 0, h = res.y | 0; if (BL.a.width !== w || BL.a.height !== h) { BL.a.setSize(w, h); BL.b.setSize(w, h); }
    BL.bright.uniforms.t.value = src; BL.bright.uniforms.th.value = g.th; pass(ren, BL.bright, BL.a);
    for (let k = 0; k < 2; k++) {
      BL.blur.uniforms.t.value = BL.a.texture; BL.blur.uniforms.d.value.set((k + 1) / w, 0); pass(ren, BL.blur, BL.b);
      BL.blur.uniforms.t.value = BL.b.texture; BL.blur.uniforms.d.value.set(0, (k + 1) / h); pass(ren, BL.blur, BL.a);
    }
    W.renderer.setRenderTarget(null);
    m.uniforms.rfBloom.value = BL.a.texture;
  };
  // ---------- 接上：每一格 ----------
  const setUniforms = (on, g) => {
    const u = R.pixPost && R.pixPost.uniforms; if (!u || !u.rfOn) return;
    u.rfOn.value = on ? 1 : 0; if (!on) return;
    u.rfTint.value.set(g.tint[0], g.tint[1], g.tint[2]); u.rfLift.value.set(g.lift[0], g.lift[1], g.lift[2]);
    u.rfSat.value = g.sat; u.rfExpo.value = g.expo; u.rfVig.value = 0.35; u.rfBloomK.value = g.bloom * (gfx() >= 2 ? 1.15 : 1);
  };
  const rf0 = R.renderFrame;
  R.renderFrame = (w, h) => {
    const on = active();
    if (!on) { setUniforms(false); return rf0(w, h); }
    const r = W.renderer, ren0 = r.render, g = GRADE[gradeKey(W.run)] || GRADE.base; let busy = false;
    // 放大那一道（畫到螢幕、用 R.pixPost 的那張四邊形）之前：先接上著色器、做發光
    r.render = function (sc, cam) {
      if (!busy && sc !== W.scene && r.getRenderTarget() === null && sc.children.length && sc.children[0].material === R.pixPost) {
        busy = true; try { patch(); bloom(ren0, g); setUniforms(true, g); } catch (e) { console.warn('[ruinfx]', e); } finally { busy = false; }
      }
      return ren0.call(this, sc, cam);
    };
    try { return rf0(w, h); } finally { r.render = ren0; }
  };
  // ---------- 暫停選單：遺跡畫質 ----------
  const QN = ['低（跟以前一樣）', '中', '高'];
  const addBtn = () => {
    const row = document.querySelector('#r-sheet .row'); if (!row || row.querySelector('#rf-q')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'rf-q'; b.textContent = '遺跡畫質：' + QN[gfx()];
    b.title = '中：調色、發光；高：再加更多光源和影子（之後的更新）。電腦比較慢就用低。';
    b.onclick = () => { R.S.opts = R.S.opts || {}; R.S.opts.ruinGfx = (gfx() + 1) % 3; if (R.save) R.save(); b.textContent = '遺跡畫質：' + QN[gfx()]; };
    row.appendChild(b);
  };
  const ps = R.pauseSheet; if (ps) R.pauseSheet = (...a) => { const r = ps(...a); try { addBtn(); } catch (e) { } return r; };
  // ---------- 跑不動的時候提示降畫質（交接單第 7 步；2026-10-20） ----------
  // 在遺跡裡、畫質中或高：進去 6 秒以後量 8 秒，平均每格超過 36 毫秒（不到大約 28 fps）就跳一次提示；同一次開遊戲只提示一次。
  // 暫停、切到別的分頁、開著選單的時候不算。
  let fm = null, told = false;
  const tick = now => {
    requestAnimationFrame(tick);
    const w = W, run = w.run;
    if (told || !run || gfx() <= 0 || w.paused || document.hidden || (R.sheetOpen && R.sheetOpen())) { fm = null; return; }
    if (!fm || fm.run !== run) { fm = { run, t0: now, last: now, acc: 0, n: 0 }; return; }
    const dt = now - fm.last; fm.last = now; if (dt > 250) { fm.t0 = now; fm.acc = 0; fm.n = 0; return; }   // 卡一大下（載入、換層）不算
    if (now - fm.t0 < 6000) return;
    fm.acc += dt; fm.n++;
    if (fm.acc < 8000) return;
    const avg = fm.acc / fm.n; fm.acc = 0; fm.n = 0;
    if (avg > 36) { told = true; if (R.toast) R.toast('畫面有點跟不上：暫停選單的「遺跡畫質」調成' + (gfx() >= 2 ? '中' : '低') + '會比較順。', '#E8C04A'); }
  };
  requestAnimationFrame(tick);
})(window.R);
