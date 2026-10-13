// 2026-10-14 吟遊詩人的「爆炸」改成音波（作者：「回調吟遊詩人爆炸的效果，應該要是類似音波朝外擴散而不是火焰爆炸的特效」）
// - 以前：三重奏／攻擊音符炸開（bardchord.js）用通用的 'boom'，被 fx1010.js 依顏色當成火焰爆炸（火球＋煙）；
//   技能（不協和音、奏鳴曲、雷鼓、滾奏、終章大鼓、轉調……）的 'ring'／'boom' 也一樣會被換成元素（火）的特效。
// - 現在：吟遊詩人放的技能、音符炸開，一律畫成「音波」：三圈同色的環從中心一圈一圈往外擴散到原本的半徑，再飄出幾顆音符；沒有火、沒有煙。
// - 傷害、範圍完全沒動（只換畫面）。「減少閃光」開著時環比較淡、音符比較少。
// 放在 fx1010.js、fx1011.js、fxplus.js、bardchord.js 後面（包在 R.fx 最外層）。
(function (R) {
  const W = () => R.W;
  const less = () => (R.lessFlash ? R.lessFlash() : true);
  let noteTex = null;
  const noteMap = () => {
    if (noteTex) return noteTex;
    const TH = window.THREE, c = document.createElement('canvas'); c.width = c.height = 64;
    const g = c.getContext('2d'); g.fillStyle = '#FFFFFF'; g.font = 'bold 48px serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('♪', 32, 34);
    noteTex = new TH.CanvasTexture(c); return noteTex;
  };
  const sonic = (x, z, r, col) => {
    const TH = window.THREE, sc = W() && W().scene; if (!TH || !sc) return;
    r = Math.max(0.8, r || 2); col = col || '#FFB8E0';
    const lf = less(), A = lf ? 0.55 : 0.9, made = [], t0 = performance.now(), SL = R.bdSonicSlow || 1;   // SL：測試截圖用（放慢），平常是 1
    for (let i = 0; i < 3; i++) {
      const m = new TH.Mesh(new TH.RingGeometry(0.8, 1, 56), new TH.MeshBasicMaterial({ color: col, transparent: true, opacity: 0, side: TH.DoubleSide, depthWrite: false, blending: TH.NormalBlending }));
      m.rotation.x = -Math.PI / 2; m.position.set(x, 0.15 + i * 0.02, z); m.scale.setScalar(0.01); sc.add(m);
      made.push({ m, kind: 'ring', d: i * 110 * SL, life: 460 * SL });
    }
    const nN = lf ? 3 : 5;
    for (let i = 0; i < nN; i++) {
      const a = (i / nN) * Math.PI * 2 + Math.random() * 0.6, sp = new TH.Sprite(new TH.SpriteMaterial({ map: noteMap(), color: col, transparent: true, opacity: 0, depthWrite: false }));
      sp.scale.set(0.55, 0.55, 1); sp.position.set(x, 0.8, z); sc.add(sp);
      made.push({ m: sp, kind: 'note', d: (60 + i * 40) * SL, life: 700 * SL, a, r });
    }
    const step = () => {
      const now = performance.now(); let alive = 0;
      made.forEach(o => {
        if (o.done) return; const t = (now - t0 - o.d) / o.life;
        if (t < 0) { alive++; return; }
        if (t >= 1) { o.done = true; try { sc.remove(o.m); o.m.geometry && o.m.geometry.dispose(); o.m.material.dispose(); } catch (e) { } return; }
        alive++;
        if (o.kind === 'ring') { const e = 1 - Math.pow(1 - t, 2); o.m.scale.setScalar(Math.max(0.01, r * (0.15 + 0.85 * e))); o.m.material.opacity = A * (1 - t) * (t < 0.12 ? t / 0.12 : 1); }
        else { const e = t; o.m.position.set(x + Math.sin(o.a) * o.r * 0.6 * e, 0.8 + 1.4 * e, z + Math.cos(o.a) * o.r * 0.6 * e); o.m.material.opacity = (lf ? 0.6 : 0.9) * (1 - t); }
      });
      if (!alive) clearInterval(iv);
    };
    const iv = setInterval(step, 16); step();   // 用 setInterval（畫面卡住、分頁在背景也照樣播完、清掉）
    R._bdSonicN = (R._bdSonicN || 0) + 1;
  };
  R.bardSonic = sonic;
  // 吟遊詩人放的技能裡面的 'boom'／'ring'／'groundwave' 都換成音波
  const fx0 = R.fx;
  R.fx = function (kind, x, y, z, o) {
    try {
      const P = W() && W().P;
      if (P && P.cls === 'bard' && (kind === 'boom' || kind === 'ring' || kind === 'groundwave' || kind === 'poof') && (R._bdSonicOn || (R.vampInSkill && R.vampInSkill()))) { sonic(x, z, (o && o.r) || 2, o && o.color); return; }
    } catch (e) { }
    return fx0.apply(this, arguments);
  };
})(window.R);
