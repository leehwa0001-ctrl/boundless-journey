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
      '  gl_FragDepthEXT = texture2D(tD, (p + 0.5) / res).x;',   // 場景的深度寫進螢幕：之後用全解析度畫人物，被前面的東西擋住的地方照樣擋住
      '}'].join('\n'), { tC: { value: S.rt.texture }, tD: { value: S.rt.depthTexture }, tB: { value: S.a.texture }, res: { value: new TH.Vector2(4, 4) }, scale: { value: 1 }, off: { value: new TH.Vector2() }, cN: { value: 1 }, cF: { value: 100 }, lv: { value: 16 }, bk: { value: 0.9 }, expo: { value: 1 }, vig: { value: 0.4 }, sat: { value: 1.1 } });
    S.comp.extensions = { fragDepth: true }; S.comp.depthWrite = true;
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
    // 人物（玩家、路人、隊友）：先不畫進小畫布（換到第 1 層），最後用全解析度畫在上面——不換色、不加網點、素材版的細節不被壓掉
    const chars = charGroups(); setLayer(chars, 2); const cm = cam.layers.mask; cam.layers.mask = 1;
    pools(L);
    try { r.setRenderTarget(S.rt); r.clear(); r.render(W.scene, cam); } finally { if (sky) sky.visible = sv; if (su) su.value = sz0; }
    // 發光
    S.bright.uniforms.t.value = S.rt.texture; pass(S.bright, S.a);
    for (let k = 0; k < 2; k++) { S.blur.uniforms.t.value = S.a.texture; S.blur.uniforms.d.value.set((k + 1) / rw, 0); pass(S.blur, S.b); S.blur.uniforms.t.value = S.b.texture; S.blur.uniforms.d.value.set(0, (k + 1) / rh); pass(S.blur, S.a); }
    // 放大
    const U = S.comp.uniforms, night = L ? Math.min(1, L.lampK || 0) : 0, post = CK.post || {};
    U.scale.value = s; U.off.value.set(Math.floor((rw * s - bw) / 2), Math.floor((rh * s - bh) / 2)); U.cN.value = cam.near; U.cF.value = cam.far;
    U.expo.value = (post.expo || 0.88) * (0.84 + night * 0.28);   // 白天雪地太亮：白天收一點、晚上亮一點
    U.bk.value = 0.12 + night * 1.0;   // 白天幾乎不透光暈（白色斑馬線、計程車不會發光） U.sat.value = 1.08; U.vig.value = 0.35 + night * 0.15;
    pass(S.comp, null);
    // 人物：全解析度、照場景的深度；鏡頭的範圍跟放大那一道對齊（螢幕只是小畫布中間的一塊）
    try {
      const ls = sceneLights(); ls.forEach(l => l.layers.enable(1));
      const bg = W.scene.background, ac = r.autoClear; W.scene.background = null; r.autoClear = false;
      cam.layers.mask = 2; cam.setViewOffset(rw * s, rh * s, U.off.value.x, rh * s - bh - U.off.value.y, bw, bh);
      try { r.setRenderTarget(null); r.render(W.scene, cam); } finally { cam.clearViewOffset(); W.scene.background = bg; r.autoClear = ac; }
    } finally { cam.layers.mask = cm; setLayer(chars, 1); }
  };
  // 人物的身體都在這幾個 group 裡（citykit2.js 的 CK.fixSprites 也是這樣找）
  const charGroups = () => { const tw = W.town, out = []; if (W.P && W.P.h && W.P.h.g) out.push(W.P.h.g); if (tw) [tw.npcs, tw.allies].forEach(L => (L || []).forEach(n => { if (n && n.h && n.h.g) out.push(n.h.g); })); return out; };
  const setLayer = (gs, mask) => gs.forEach(g => g.traverse(o => { o.layers.mask = mask; }));
  // 光也要在第 1 層，人物才照得到（換場景的時候重找一次；路燈的點光源是固定那幾盞，只換位置）
  let LS0 = null, LSc = null;
  const sceneLights = () => { if (LSc === W.scene && LS0) return LS0; LSc = W.scene; LS0 = []; W.scene.traverse(o => { if (o.isLight) LS0.push(o); }); return LS0; };
  // ---------- 每一盞路燈在地上鋪一圈暖光（晚上；圓的漸層，放大那一道的網點讓邊緣變成細細的過渡） ----------
  let PL = null;
  const pools = L => {
    const tw = W.town, k = L ? Math.min(1, L.lampK || 0) : 0, TH = T();
    if (!tw || !tw.lamps || !tw.lamps.length) return;
    if (!PL || PL.tw !== tw) {
      if (PL && PL.m.parent) PL.m.parent.remove(PL.m);
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
      gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,0.55)'); gr.addColorStop(0.7, 'rgba(255,255,255,0.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      const tex = new TH.CanvasTexture(c), mat = new TH.MeshBasicMaterial({ color: new TH.Color('#FFA448').convertSRGBToLinear(), map: tex, transparent: true, opacity: 0, depthWrite: false, blending: TH.AdditiveBlending, fog: false });
      const geo = new TH.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);
      const m = new TH.InstancedMesh(geo, mat, tw.lamps.length), o = new TH.Object3D();
      tw.lamps.forEach((p, i) => { o.position.set(p[0], (CK.heightAt ? CK.heightAt(p[0], p[1]) : 0) + 0.06, p[1]); o.scale.set(11, 1, 11); o.updateMatrix(); m.setMatrixAt(i, o.matrix); });
      m.frustumCulled = false; m.renderOrder = 2; m.userData.noShadow = true; W.scene.add(m); PL = { tw, m };
    }
    if (PL.m.parent !== W.scene) W.scene.add(PL.m);
    PL.m.material.opacity = 0.55 * k; PL.m.visible = k > 0.02;
    winSpill(tw, k);
  };
  // ---------- 窗戶的光灑到外面的地上（晚上；照 tw.D.foot 每棟房子的外框，四邊各一條從牆邊往外淡掉的光） ----------
  // 2026-10-20 作者：晚上的感覺對——繼續做窗戶的光灑出來。暖的（燈泡）、冷的（日光燈）照房子隨機；每一面亮度不一樣，有的面是暗的。
  let WS = null;
  const winSpill = (tw, k) => {
    const D = tw.D, TH = T(); if (!D || !D.foot) return;
    if (!WS || WS.tw !== tw) {
      if (WS && WS.m && WS.m.parent) WS.m.parent.remove(WS.m);
      const hash = (a, b) => { const s = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453; return s - Math.floor(s); };
      const list = [];
      D.foot.forEach(f => { if (f.poly || !f.r || f.kind === 'skip' || (f.h || 0) < 2.5) return; const [x0, z0, x1, z1] = f.r, w = x1 - x0, d = z1 - z0; if (w < 2 || d < 2 || w > 90 || d > 90) return;
        const warm = hash(x0, z0) < 0.62;
        [[0, z1, (x0 + x1) / 2, w, 0], [0, z0, (x0 + x1) / 2, w, Math.PI], [1, x1, (z0 + z1) / 2, d, Math.PI / 2], [1, x0, (z0 + z1) / 2, d, -Math.PI / 2]].forEach(([vert, at, mid, len, ry], i) => {
          const lit = hash(at + i, mid); if (lit < 0.3) return;   // 這一面的窗都是暗的
          const ext = 2.2, x = vert ? at + (ry > 0 ? ext / 2 : -ext / 2) : mid, z = vert ? mid : at + (ry === 0 ? ext / 2 : -ext / 2);
          list.push({ x, z, len: len * 0.92, ext, ry, warm, I: 0.45 + lit * 0.55 });
        }); });
      if (!list.length) { WS = { tw }; return; }
      const c = document.createElement('canvas'); c.width = 4; c.height = 32; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 32);
      gr.addColorStop(0, 'rgba(255,255,255,0.9)'); gr.addColorStop(0.45, 'rgba(255,255,255,0.35)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 4, 32);
      const geo = new TH.PlaneGeometry(1, 1); geo.rotateX(-Math.PI / 2);   // 貼圖上緣（亮）在 -z：轉 ry 讓亮的那邊貼著牆
      const m = new TH.InstancedMesh(geo, new TH.MeshBasicMaterial({ map: new TH.CanvasTexture(c), transparent: true, opacity: 0, depthWrite: false, blending: TH.AdditiveBlending, fog: false }), list.length), o = new TH.Object3D(), col = new TH.Color();
      const cw = new TH.Color('#FFC27A').convertSRGBToLinear(), cc = new TH.Color('#9CC4E8').convertSRGBToLinear();
      list.forEach((s, i) => { o.position.set(s.x, (CK.heightAt ? CK.heightAt(s.x, s.z) : 0) + 0.05, s.z); o.rotation.set(0, s.ry, 0); o.scale.set(s.len, 1, s.ext); o.updateMatrix(); m.setMatrixAt(i, o.matrix); col.copy(s.warm ? cw : cc).multiplyScalar(s.I); m.setColorAt(i, col); });
      m.frustumCulled = false; m.renderOrder = 2; W.scene.add(m); WS = { tw, m };
    }
    if (!WS.m) return;
    if (WS.m.parent !== W.scene) W.scene.add(WS.m);
    WS.m.material.opacity = 0.62 * k; WS.m.visible = k > 0.02;
  };
  // ---------- 點陣貼圖（2026-10-20 作者選 1：把皇嶺做成真的像素城市，不只是濾鏡） ----------
  // 寫實的雜訊貼圖換成手刻的點陣花樣：一個點陣像素＝R.PIX.PX 公尺（跟人物、遺跡同比例），灰階、平均約 1，乘在原本貼圖的平均色上。
  // 照材質原本的 uv 貼（citykit 的 uv＝公尺÷tile），方向跟原本的貼圖一樣（瓦片的溝朝屋簷）。
  const PN = 24;   // 一張花樣 24×24 像素＝2 公尺
  const PAT = {
    kawara: (x, y) => { const r = y % 6, o = Math.floor(y / 6) % 2 ? 2 : 0; return r === 5 ? 118 : r === 0 ? 230 : (x + o) % 4 === 0 ? 176 : 204; },   // 瓦：一排一排（50 公分），每排上緣亮、下緣有影子，溝淡淡的、上下排錯開
    copper: (x, y, h) => (x % 6 === 0 ? 236 : x % 6 === 1 ? 160 : 202 + (h < 0.06 ? -18 : 0)),   // 銅板屋頂：立起來的接縫
    corrugated: x => (x % 3 === 0 ? 236 : x % 3 === 1 ? 200 : 158),
    plaster: (x, y, h) => 206 + (h < 0.04 ? -16 : h > 0.97 ? 12 : 0),
    concrete: (x, y, h) => (x % 12 === 0 || y % 12 === 0 ? 170 : 206 + (h < 0.05 ? -12 : 0)),
    wood: (x, y, h) => { const b = Math.floor(y / 3); return y % 3 === 2 ? 132 : 196 + ((b * 7) % 3) * 10 + (h < 0.08 ? -18 : 0); },   // 木板：一塊 25 公分
    planks: (x, y, h) => { const b = Math.floor(y / 3); return y % 3 === 2 ? 132 : (x + b * 7) % 16 === 0 ? 150 : 196 + ((b * 5) % 3) * 10 + (h < 0.06 ? -16 : 0); },
    lattice: (x, y) => (x % 4 === 0 || y % 4 === 0 ? 236 : 120),   // 格子窗：白格、暗紙
    ishigaki: null, ashlar: (x, y) => { const r = Math.floor(y / 4), o = r % 2 ? 4 : 0; return y % 4 === 3 || (x + o) % 8 === 0 ? 132 : y % 4 === 0 ? 228 : 204 + ((r * 3 + Math.floor((x + o) / 8)) % 3) * 8; },
    brick: (x, y) => { const r = Math.floor(y / 2), o = r % 2 ? 2 : 0; return y % 2 === 1 || (x + o) % 4 === 0 ? 150 : 206 + ((r + Math.floor((x + o) / 4)) % 3) * 8; },
    pavers: (x, y) => (x % 6 === 0 || y % 6 === 0 ? 160 : 206 + (((Math.floor(x / 6) * 3 + Math.floor(y / 6)) % 3) - 1) * 8),
    granite: (x, y) => (x % 12 === 0 || y % 12 === 0 ? 156 : y % 12 === 1 ? 222 : 204),
    asphalt: (x, y, h) => 204 + (h < 0.03 ? -22 : h > 0.985 ? 18 : 0),
    yard: (x, y, h) => 204 + (h < 0.06 ? -18 : h > 0.95 ? 14 : 0), gravel: (x, y, h) => (h < 0.25 ? 170 : h > 0.8 ? 230 : 204), sand: (x, y, h) => 206 + (h < 0.05 ? -14 : 0), soil: (x, y, h) => 200 + (h < 0.1 ? -20 : h > 0.93 ? 14 : 0),
    grass: (x, y, h) => (h < 0.12 ? 160 : h > 0.9 ? 236 : 204),   // 草：亮暗兩種草尖點
    tatami: (x, y) => (y % 12 === 0 ? 150 : x % 2 ? 214 : 198)
  };
  // 石垣：大小不一的石塊、深色的縫
  PAT.ishigaki = (() => { const a = new Uint8Array(PN * PN).fill(120); let sd = 3; const sr = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < PN;) { const h = 4 + Math.floor(sr() * 3); let x = -Math.floor(sr() * 5); while (x < PN) { const w = 5 + Math.floor(sr() * 4), v = 188 + Math.floor((sr() - 0.5) * 36); for (let j = 1; j < h; j++) for (let i = 1; i < w; i++) { const px = (x + i + PN) % PN, py = y + j; if (py < PN) a[py * PN + px] = j === 1 ? Math.min(240, v + 26) : i === w - 1 ? v - 20 : v; } x += w; } y += h; }
    return (x, y) => a[y * PN + x]; })();
  const PTX = {};
  const patTex = name => {
    if (PTX[name]) return PTX[name]; const f = PAT[name]; if (!f) return null;
    const c = document.createElement('canvas'); c.width = c.height = PN; const g = c.getContext('2d'), img = g.createImageData(PN, PN); let sd = 11, sum = 0; const sr = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < PN; y++) for (let x = 0; x < PN; x++) { const v = Math.max(0, Math.min(255, f(x, y, sr()))), i = (y * PN + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255; sum += v; }
    g.putImageData(img, 0, 0);
    return (PTX[name] = { c, mean: sum / (PN * PN) / 255 });
  };
  const texOf = k => { try { const i = k.indexOf('|'), nm = i < 0 ? k : k.slice(0, i), o = Object.assign({}, (CK.MDEF || {})[nm] || {}, i < 0 ? {} : JSON.parse(k.slice(i + 1))); return o.fac ? null : o.tex || null; } catch (e) { return null; } };
  // 雪：原本是柔和的雜訊斑塊（像素畫法裡變成一塊一塊灰灰的污漬）→ 對齊像素格、邊緣乾淨，雪多的地方整片白
  const SNOW0 = 'float ckS = ckUp * uSnow * uSnowK * smoothstep(0.25, 0.65, ckN(vWPos.xz * 0.9) * 0.6 + ckN(vWPos.xz * 3.7) * 0.4 + uSnow * 0.5);';
  const SNOW1 = 'vec2 ckP = floor(vWPos.xz * ' + (1 / (R.PIX ? R.PIX.PX : 1 / 12)).toFixed(1) + ') * ' + (R.PIX ? R.PIX.PX : 1 / 12).toFixed(5) + '; float ckS = step(0.25, ckUp) * step(1.0 - min(1.0, uSnow * uSnowK) * 0.88, ckN(ckP * 0.45) * 0.7 + ckN(ckP * 1.7) * 0.3);';   // 只用雜訊（不加每格亂數：雪少的時候會變成滿地白點）
  // ---------- 平塗：地面、屋頂、牆這些寫實的雜訊貼圖換成點陣花樣（沒有花樣的換成平均色）；有窗戶的外牆、招牌、燈留著 ----------
  const KEEP = /^(fac|sign|shopLit|winLit|glass|neon|lamp|kiosk|awn|chochin|boat|car|train|tex:)/;
  let flat = false;
  const avgOf = img => { try { const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 8, 8); const d = g.getImageData(0, 0, 8, 8).data; let r = 0, gg = 0, b = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; b += d[i + 2]; } const n = d.length / 4; return new (T().Color)(r / n / 255, gg / n / 255, b / n / 255).convertSRGBToLinear(); } catch (e) { return null; } };
  const setFlat = on => {
    if (on === flat) return; flat = on;
    Object.entries(CK.mats || {}).forEach(([k, m]) => {
      if (!m || !m.isMeshStandardMaterial) return; const u = m.userData;
      // 雪的算法換成像素版（包住 citykit 的 onBeforeCompile；關掉的時候換回來）
      if (on && u.snowK && !u.pxOBC && m.onBeforeCompile) { const ob = u.pxOBC = m.onBeforeCompile; u.pxKey = m.customProgramCacheKey; m.onBeforeCompile = (sh, r) => { ob(sh, r); sh.fragmentShader = sh.fragmentShader.replace(SNOW0, SNOW1); }; m.customProgramCacheKey = () => 'ckpx'; m.needsUpdate = true; }
      else if (!on && u.pxOBC) { m.onBeforeCompile = u.pxOBC; m.customProgramCacheKey = u.pxKey; delete u.pxOBC; delete u.pxKey; m.needsUpdate = true; }
      if (on) {
        if (!m.map || KEEP.test(k) || m.transparent || u.pxMap) return; const a = avgOf(m.map.image); if (!a) return;
        u.pxMap = m.map; u.pxN = m.normalMap; u.pxR = m.roughnessMap; u.pxC = m.color.clone(); m.color.multiply(a); m.normalMap = null; m.roughnessMap = null;
        const pt = patTex(texOf(k)), tile = u.tile || [4, 4], PX = R.PIX ? R.PIX.PX : 1 / 12;
        if (pt) { const t = new (T().CanvasTexture)(pt.c); t.magFilter = t.minFilter = T().NearestFilter; t.generateMipmaps = false; t.wrapS = t.wrapT = T().RepeatWrapping; t.encoding = T().LinearEncoding; t.repeat.set(tile[0] / (PN * PX), tile[1] / (PN * PX)); m.map = t; m.color.multiplyScalar(1 / pt.mean); u.pxT = t; }
        else m.map = null;
        m.needsUpdate = true;
      }
      else if (u.pxMap) { if (u.pxT) { u.pxT.dispose(); delete u.pxT; } m.map = u.pxMap; m.normalMap = u.pxN; m.roughnessMap = u.pxR; m.color.copy(u.pxC); delete u.pxMap; delete u.pxN; delete u.pxR; delete u.pxC; m.needsUpdate = true; }
    });
  };
  const r0 = CK.render;
  CK.render = (...a) => { const on = active(); setFlat(on); if (!on && PL) PL.m.visible = false; if (!on && WS && WS.m) WS.m.visible = false; return on ? render() : r0(...a); };
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
