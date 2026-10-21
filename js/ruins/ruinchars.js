// 遺跡裡的人物、怪物用全解析度畫（2026-10-21 作者：遺跡的像素格大小）
// 遺跡的場景照舊畫在小畫布（一格 1/12 公尺）再放大，可是人物、隊友、遺跡生物被壓成大格子，素材版的細節都不見了。
// 跟精緻城市（ckpix.js）同一個做法：
// - 畫小畫布的時候，人物的身體換到第 1 層（鏡頭只看第 0 層），小畫布裡沒有人物；
// - 放大那一道（R.pixPost）順便把小畫布的深度寫進螢幕；
// - 最後鏡頭只看第 1 層，用全解析度把人物畫上去：被牆、柱子擋住的地方照樣擋住。
// 人物沒有經過遺跡的調色（ruinfx.js），霧、燈光、黑暗照材質本身算，跟場景一致。
// 只在遺跡裡（W.run、不在城裡、不在室內）；城、東鶴、室內照舊。
// 放在 ruinfx.js、ruinfx2.js、interiorfx.js 後面（最外層的 R.renderFrame）。
(function (R) {
  const W = R.W, T = () => THREE;
  const on = () => !!(!R.ruinCharsOff && W.run && !W.town && !W.inside && W.scene && W.scene.userData.pix && R.pixPost);
  // ---------- 放大那一道：寫深度 ----------
  let patched = false;
  const patch = () => {
    const m = R.pixPost; if (patched || !m) return; patched = true;
    m.fragmentShader = m.fragmentShader.replace('  #include <encodings_fragment>', '  gl_FragDepthEXT = texture2D(tDepth, (p + 0.5) / res).x;\n  #include <encodings_fragment>');
    m.extensions = Object.assign(m.extensions || {}, { fragDepth: true });
    m.depthTest = true; m.depthWrite = true; m.depthFunc = T().AlwaysDepth;   // 深度測試關掉的話 WebGL 也不寫深度
    m.needsUpdate = true;
  };
  // ---------- 誰算人物 ----------
  const groups = () => {
    const out = [], add = g => { if (g && g.isObject3D && g.parent) out.push(g); };
    if (W.P && W.P.h) add(W.P.h.g);
    (W.allies || []).forEach(a => { if (a && a.h) add(a.h.g); else if (a && a.m) add(a.m.g); });
    (W.enemies || []).forEach(e => { if (e && e.m) add(e.m.g); });
    return out;
  };
  const setLayer = (gs, mask) => gs.forEach(g => g.traverse(o => { o.layers.mask = mask; }));
  // 光（和它的影子鏡頭）也要在第 1 層，人物才照得到、才有影子；換樓層會換場景，重找一次
  let LS = null, LSc = null;
  const lights = () => {
    if (LSc === W.scene && LS) return LS; LSc = W.scene; LS = [];
    W.scene.traverse(o => { if (o.isLight) { o.layers.enable(1); if (o.shadow && o.shadow.camera) o.shadow.camera.layers.enable(1); LS.push(o); } });
    return LS;
  };
  const cams = () => [W.camera, W.pcam, W.vcam, W.ocam].filter((c, i, a) => c && a.indexOf(c) === i);

  const rf0 = R.renderFrame;
  R.renderFrame = (w, h) => {
    if (!on()) return rf0(w, h);
    patch(); lights();
    const gs = groups(), cs = cams(), masks = cs.map(c => c.layers.mask);
    setLayer(gs, 2); cs.forEach(c => { c.layers.mask = 1; });
    try {
      rf0(w, h);
      // 全解析度畫人物：鏡頭的範圍跟放大那一道對齊（螢幕只是小畫布中間的一塊）
      const r = W.renderer, cam = W.camera, U = R.pixPost.uniforms, s = U.scale.value, rw = U.res.value.x, rh = U.res.value.y;
      const cv = r.domElement, bw = cv.width, bh = cv.height;
      if (!gs.length || bw < 4 || bh < 4) return;
      const bg = W.scene.background, ac = r.autoClear; W.scene.background = null; r.autoClear = false;
      cam.layers.mask = 2; cam.setViewOffset(rw * s, rh * s, U.off.value.x, rh * s - bh - U.off.value.y, bw, bh);
      try { r.setRenderTarget(null); r.render(W.scene, cam); }
      finally { cam.clearViewOffset(); W.scene.background = bg; r.autoClear = ac; }
    } catch (e) { console.warn('[ruinchars]', e); }
    finally { cs.forEach((c, i) => { c.layers.mask = masks[i]; }); setLayer(gs, 1); }
  };
})(window.R);
