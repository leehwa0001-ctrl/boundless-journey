// 佩特拉核心的凝視（2026-10-21 作者：看著它的時候，會有類似 MC 深海守衛的那種影子）
// 佩特拉核心（W.enemies 的 petra、保留區的 W.F.coreView）在畫面中間附近、離你 24 公尺內，看了它一秒多：
// 整個畫面浮出一個半透明的巨大眼球影子（骨翼張開、瞳孔盯著你），往你這邊湊近、再慢慢淡掉；同時一聲低沉的嘶鳴（瀏覽器即時合成）。
// 冷卻 40～70 秒。只是畫面和聲音，不影響數值。影子是像素畫（240×150），照核心的顏色畫成淡青色的鬼影。
// 放在 run.js、dread.js 後面。
(function (R) {
  const W = R.W, T = () => THREE;
  // ---------- 影子的圖（畫一次） ----------
  let img = null;
  const draw = () => {
    const w = 240, h = 150, cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d');
    const cx = 120, cy = 76, er = 34;
    g.fillStyle = 'rgba(170,235,225,1)';
    // 骨翼：左右各五根，翼膜半透明
    for (const sd of [-1, 1]) for (let i = 0; i < 5; i++) {
      const a = -0.95 + i * 0.36, L = 78 - Math.abs(i - 1.5) * 9, x1 = cx + sd * (er + 4 + Math.cos(a) * L), y1 = cy + Math.sin(a) * L * 0.85;
      g.globalAlpha = 0.85; g.lineWidth = 3; g.strokeStyle = 'rgba(170,235,225,1)'; g.beginPath(); g.moveTo(cx + sd * (er - 4), cy - 4); g.lineTo(x1, y1); g.stroke();
      if (i < 4) { const b = -0.95 + (i + 1) * 0.36, L2 = 78 - Math.abs(i + 1 - 1.5) * 9; g.globalAlpha = 0.28; g.beginPath(); g.moveTo(cx + sd * (er - 4), cy - 4); g.lineTo(x1, y1); g.lineTo(cx + sd * (er + 4 + Math.cos(b) * L2), cy + Math.sin(b) * L2 * 0.85); g.closePath(); g.fill(); }
    }
    // 眼球、虹膜、瞳孔（瞳孔挖空＝更暗）
    g.globalAlpha = 0.9; g.beginPath(); g.arc(cx, cy, er, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.globalAlpha = 0.55; g.beginPath(); g.arc(cx, cy + 2, 17, 0, Math.PI * 2); g.fill();
    g.globalAlpha = 1; g.beginPath(); g.ellipse(cx, cy + 2, 4, 12, 0, 0, Math.PI * 2); g.fill();
    g.globalCompositeOperation = 'source-over';
    // 血管
    g.globalAlpha = 0.5; g.lineWidth = 1; g.strokeStyle = 'rgba(120,200,190,1)';
    for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2 + 0.2; let x = cx + Math.cos(a) * er, y = cy + Math.sin(a) * er; g.beginPath(); g.moveTo(x, y); for (let k = 0; k < 3; k++) { x += (cx - x) * 0.22 + Math.sin(i * 7 + k) * 2; y += (cy - y) * 0.22 + Math.cos(i * 5 + k) * 2; g.lineTo(x, y); } g.stroke(); }
    // 下面兩對小翼肢
    g.globalAlpha = 0.7; g.lineWidth = 2; g.strokeStyle = 'rgba(170,235,225,1)';
    [[-14, 1], [14, 1], [-24, 0.8], [24, 0.8]].forEach(([dx, s]) => { g.beginPath(); g.moveTo(cx + dx * 0.6, cy + er - 4); g.lineTo(cx + dx, cy + er + 18 * s); g.lineTo(cx + dx * 1.3, cy + er + 26 * s); g.stroke(); });
    img = cv.toDataURL(); return img;
  };
  // ---------- 畫面上的影子 ----------
  let el = null;
  const ensure = () => {
    if (el) return el;
    el = document.createElement('div'); el.id = 'r-coregaze'; el.setAttribute('aria-hidden', 'true');
    el.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:50;opacity:0;background:center/min(118vw,190vh) no-repeat;image-rendering:pixelated;transform:scale(.85)';
    el.style.backgroundImage = 'url(' + (img || draw()) + ')';
    document.body.appendChild(el); return el;
  };
  const show = () => {
    const e = ensure();
    if (e.animate) e.animate([{ opacity: 0, transform: 'scale(.85)' }, { opacity: 0.62, transform: 'scale(1.0)', offset: 0.25 }, { opacity: 0.5, transform: 'scale(1.08)', offset: 0.6 }, { opacity: 0, transform: 'scale(1.22)' }], { duration: 2600, easing: 'ease-out' });
    sound();
  };
  // ---------- 聲音：低沉的嘶鳴＋一點點氣音 ----------
  const sound = () => {
    const A = R.AUDIO, ctx = A && A.ctx; if (!ctx || (R.isMuted && R.isMuted())) return;
    try {
      const t = ctx.currentTime + 0.02, v = (A.VOL ? A.VOL.sfx : 0.8) * 0.22, out = ctx.createGain(); out.gain.setValueAtTime(0, t); out.gain.linearRampToValueAtTime(v, t + 0.25); out.gain.exponentialRampToValueAtTime(0.0008, t + 2.4); out.connect(ctx.destination);
      const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(1400, t); lp.frequency.exponentialRampToValueAtTime(380, t + 2.2); lp.connect(out);
      [[196, 70], [293, 104]].forEach(([f0, f1]) => { const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 2.2); const tr = ctx.createOscillator(), tg = ctx.createGain(); tr.frequency.value = 7; tg.gain.value = 6; tr.connect(tg); tg.connect(o.frequency); o.connect(lp); o.start(t); tr.start(t); o.stop(t + 2.5); tr.stop(t + 2.5); });
      const n = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate), d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length);
      const ns = ctx.createBufferSource(), ng = ctx.createGain(), bp = ctx.createBiquadFilter(); ns.buffer = n; bp.type = 'bandpass'; bp.frequency.value = 900; ng.gain.value = 0.35; ns.connect(bp); bp.connect(ng); ng.connect(lp); ns.start(t);
    } catch (e) { }
  };
  // ---------- 每一格：有沒有在看它 ----------
  let look = 0, cd = 8, last = 0;
  const v3 = () => (v3.v || (v3.v = new (T().Vector3)()));
  const tick = now => {
    requestAnimationFrame(tick);
    const dt = Math.min(0.5, (now - last) / 1000 || 0); last = now;   // 切到別的分頁回來不要一下子跳很多
    const run = W.run, P = W.P, cam = W.camera; if (!run || W.town || W.inside || W.paused || !P || !cam || !window.THREE) { look = 0; return; }
    cd -= dt;
    const core = (W.enemies || []).find(e => e.id === 'petra' && !e.dead) || (W.F && W.F.coreView); if (!core) { look = 0; return; }
    const d = Math.hypot(core.x - P.x, core.z - P.z); if (d > 24) { look = 0; return; }
    const p = v3(); p.set(core.x, 3, core.z).project(cam);
    if (Math.abs(p.x) < 0.55 && Math.abs(p.y) < 0.7 && p.z < 1) look += dt; else look = Math.max(0, look - dt * 2);
    if (look > 1.2 && cd <= 0) { show(); cd = 40 + Math.random() * 30; look = 0; }
  };
  requestAnimationFrame(tick);
  R.coreGaze = show;   // 測試用
})(window.R);
