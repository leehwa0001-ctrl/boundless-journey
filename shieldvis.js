// 護盾看得更清楚（2026-10-11 作者：遊戲裡護盾的顯示太不明顯）
// - 電腦版的生命球：外面一圈發光的青色護盾環（照「護盾 ÷ 生命上限」畫一圈）、球上方一個「護盾 N」的小牌子；拿到護盾的那一下閃一下。
//   （原本 hud2.js 的護盾是球邊 4 格的白線，hud3.js 把球改成液體球以後被擠到球外、幾乎看不到）
// - 手機的生命條：護盾那一段更亮、有光。
// - 遊戲裡：有護盾的人（你、電腦隊友）腳下一圈青色的六角護盾環，護盾越多越亮、慢慢轉。
// 放在 hud2.js、hud3.js、battlehud.js 後面。
(function (R) {
  const W = () => R.W, $ = id => document.getElementById(id);
  const css = document.createElement('style');
  css.textContent = [
    '.sv-ring{position:absolute;left:50%;top:50%;width:var(--sv-d,104px);height:var(--sv-d,104px);transform:translate(-50%,-50%);border-radius:50%;pointer-events:none;z-index:7;display:none;',
    'background:conic-gradient(#9AF6FF calc(var(--s,0)*1turn),rgba(154,246,255,.14) 0);-webkit-mask:radial-gradient(circle,transparent var(--sv-in,45px),#000 calc(var(--sv-in,45px) + 1px));mask:radial-gradient(circle,transparent var(--sv-in,45px),#000 calc(var(--sv-in,45px) + 1px));filter:drop-shadow(0 0 3px #5AD8FF) drop-shadow(0 0 7px #3AB8FF)}',
    '.sv-on .sv-ring{display:block}',
    '.sv-n{position:absolute;left:50%;top:-12px;transform:translateX(-50%);z-index:8;display:none;padding:0 7px;border-radius:9px;font:900 12px/17px system-ui,"Microsoft JhengHei",sans-serif;color:#F0FDFF;background:linear-gradient(#2A92D8,#145A9A);border:1px solid #A8EEFF;box-shadow:0 0 8px #5AD8FF;white-space:nowrap;pointer-events:none;text-shadow:0 1px 1px #04203A}',
    '.sv-on .sv-n{display:block}',
    '.sv-flash .sv-ring,.sv-flash .sv-n{animation:svFlash .55s ease-out}@keyframes svFlash{0%{filter:brightness(2.4) drop-shadow(0 0 12px #9AF6FF)}100%{filter:drop-shadow(0 0 3px #5AD8FF) drop-shadow(0 0 7px #3AB8FF)}}',
    '.bh-shield{background:repeating-linear-gradient(45deg,#C8F8FF 0 3px,#62CCF2 3px 6px)!important;box-shadow:0 0 6px #5AD8FF,inset 0 0 0 1px #F0FDFF!important}'
  ].join('\n');
  document.head.appendChild(css);

  // ---------- 生命球 ----------
  let built = null, last = 0, flashT = 0;
  const build = () => {
    const hp = $('h2-hp'); if (!hp) return null;
    let ring = hp.querySelector('.sv-ring'), n = hp.querySelector('.sv-n');
    if (!ring) { ring = document.createElement('span'); ring.className = 'sv-ring'; hp.appendChild(ring); }
    if (!n) { n = document.createElement('span'); n.className = 'sv-n'; hp.appendChild(n); }
    return { hp, ring, n };
  };
  const hudTick = (P, dt) => {
    if (!built || !built.hp.isConnected) built = build(); if (!built) return;
    const { hp, ring, n } = built, s = P.shield > 0 && P.hpMax > 0 ? Math.min(1, P.shield / P.hpMax) : 0;
    hp.classList.toggle('sv-on', s > 0);
    if (s <= 0) { last = 0; return; }
    // 環的大小照生命球（hud3 的液體球 84px；沒有 hud3 的時候照徽章）
    const orb = hp.querySelector('.h2-ring'), d = orb && orb.getBoundingClientRect().width || 70;
    hp.style.setProperty('--sv-d', Math.round(d + 22) + 'px'); hp.style.setProperty('--sv-in', Math.round(d / 2 + 3) + 'px'); hp.style.setProperty('--s', s.toFixed(3));
    const t = '護盾 ' + Math.ceil(P.shield); if (n.textContent !== t) n.textContent = t;
    if (P.shield > last + P.hpMax * 0.01) { hp.classList.remove('sv-flash'); void hp.offsetWidth; hp.classList.add('sv-flash'); flashT = 0.6; }
    last = P.shield;
    if (flashT > 0 && (flashT -= dt) <= 0) hp.classList.remove('sv-flash');
  };

  // ---------- 遊戲裡：腳下的六角護盾環 ----------
  const rings = new Map();
  const ringOf = who => {
    let g = rings.get(who); if (g) return g;
    if (!window.THREE) return null;
    // 一般混色（不是加亮）：亮的地板上也看得到；外面一圈深藍描邊
    const TH = THREE, mat = (col, op) => new TH.MeshBasicMaterial({ color: col, transparent: true, opacity: op, depthWrite: false, side: TH.DoubleSide, fog: false });
    g = new TH.Group();
    const a = new TH.Mesh(new TH.RingGeometry(0.62, 0.75, 6), mat('#52DCFF', 0.9)), b = new TH.Mesh(new TH.RingGeometry(0.75, 0.81, 6), mat('#0C4E78', 0.7)), c = new TH.Mesh(new TH.CircleGeometry(0.62, 6), mat('#8AEEFF', 0.15));
    [a, b, c].forEach(m => { m.rotation.x = -Math.PI / 2; g.add(m); });
    g.userData = { a, b, c, t: Math.random() * 6 };
    rings.set(who, g); return g;
  };
  const drop = who => { const g = rings.get(who); if (!g) return; if (g.parent) g.parent.remove(g); g.traverse(m => { if (m.geometry) m.geometry.dispose(); if (m.material) m.material.dispose(); }); rings.delete(who); };
  const worldTick = dt => {
    const w = W(), sc = w.scene, list = [];
    if (w.P && !w.P.dead) list.push(w.P);
    (w.allies || []).forEach(a => { if (a && !a.dead && !a.downed) list.push(a); });
    const seen = new Set();
    list.forEach(e => {
      const s = e.shield > 0 && e.hpMax > 0 ? Math.min(1, e.shield / e.hpMax) : 0; if (s <= 0 || !sc) return;
      const g = ringOf(e); if (!g) return; seen.add(e);
      if (g.parent !== sc) sc.add(g);
      const u = g.userData; u.t += dt;
      const k = (e === w.P ? 1.15 : 1) * (e.def && e.def.size ? Math.max(0.8, e.def.size) : 1), pulse = 0.85 + 0.15 * Math.sin(u.t * 4);
      g.position.set(e.x, 0.07, e.z); g.scale.setScalar(k * (1 + 0.04 * Math.sin(u.t * 4)));
      g.rotation.y = u.t * 0.6;
      const op = Math.min(1, (0.45 + 0.55 * Math.sqrt(s)) * pulse); u.a.material.opacity = op; u.b.material.opacity = op * 0.75; u.c.material.opacity = 0.08 + 0.14 * s;
    });
    [...rings.keys()].forEach(e => { if (!seen.has(e)) drop(e); });
  };

  const ht0 = R.hudTick;
  R.hudTick = dt => {
    ht0(dt);
    try { const w = W(), P = w.P; if (P && w.run) { hudTick(P, dt || 0.016); worldTick(dt || 0.016); } else if (rings.size) [...rings.keys()].forEach(drop); } catch (e) { }
  };
})(window.R);
