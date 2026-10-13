// 2026-10-14 術士大招（七曜隕星／元素隕星／咒星／氣罩流星）的隕星看起來像天雷（一根根光柱）→ 改成真的從天上斜斜砸下來的隕石：
//   落點預警（mark）出現時，天上同時出現一顆燒著的石頭，帶著尾焰斜著落下，剛好在原本傷害的那一刻落地；
//   落地＝坑（暗色焦痕，3 秒淡掉）＋塵土＋碎石，不再放光柱。元素隕星照火→冰→雷換顏色。「減少閃光」開著時發光調暗。
// 只改畫面，傷害、時間照舊。放在 spellcraft.js、ultpath.js、fx1010.js 後面。
(function (R) {
  const W = () => R.W || {};
  const MET = { until: 0, k: 0, el: false };
  const less = () => (R.lessFlash ? R.lessFlash() : true);
  const COLS = ['#FF6A2A', '#9AD8FF', '#FFE070'];
  const live = [];
  const add = me => { const sc = W().scene; if (sc && me) sc.add(me); return me; };
  const drop = me => { try { if (me && me.parent) me.parent.remove(me); if (me.geometry) me.geometry.dispose(); if (me.material) me.material.dispose(); } catch (e) { } };
  const fall = (x, z, t, col, big) => {
    const TH = window.THREE; if (!TH || !W().scene) return;
    const dur = Math.min(0.7, Math.max(0.25, t)), delay = Math.max(0, t - dur) * 1000, size = big ? 1.3 : 0.8;
    setTimeout(() => {
      const rock = add(new TH.Mesh(new TH.IcosahedronGeometry(size, 0), new TH.MeshBasicMaterial({ color: '#3A2A22' })));
      const glow = add(new TH.Mesh(new TH.SphereGeometry(size * 1.45, 12, 10), new TH.MeshBasicMaterial({ color: col, transparent: true, opacity: less() ? 0.4 : 0.65, depthWrite: false, blending: TH.AdditiveBlending })));
      const trail = []; for (let i = 0; i < 12; i++) trail.push(add(new TH.Mesh(new TH.SphereGeometry(size * (1.1 - i * 0.07), 8, 6), new TH.MeshBasicMaterial({ color: i < 3 ? '#FFE0B0' : col, transparent: true, opacity: (less() ? 0.35 : 0.55) * (1 - i / 12), depthWrite: false, blending: TH.AdditiveBlending }))));
      const sx = x + 7, sy = 16, sz = z - 5, hist = [];
      live.push({ x, z, sx, sy, sz, t0: performance.now(), dur: dur * 1000, rock, glow, trail, hist, col, big });
    }, delay);
  };
  const crater = (x, z, col, big) => {
    const TH = window.THREE; if (!TH || !W().scene) return;
    const r = big ? 2.6 : 1.6;
    const scar = add(new TH.Mesh(new TH.CircleGeometry(r, 24), new TH.MeshBasicMaterial({ color: '#1E1612', transparent: true, opacity: 0.75, depthWrite: false })));
    const rim = add(new TH.Mesh(new TH.RingGeometry(r * 0.8, r * 1.05, 24), new TH.MeshBasicMaterial({ color: col, transparent: true, opacity: less() ? 0.35 : 0.6, depthWrite: false, side: TH.DoubleSide })));
    [scar, rim].forEach(m => { m.rotation.x = -Math.PI / 2; m.position.set(x, 0.05, z); });
    live.push({ crater: true, t0: performance.now(), scar, rim });
    if (R.fx0m) { R.fx0m('dust', x, 0.3, z, { n: big ? 22 : 14 }); R.fx0m('poof', x, 0.4, z, { color: '#8A7A6A', n: big ? 18 : 10 }); }
  };
  const tick = () => {
    requestAnimationFrame(tick);
    const now = performance.now();
    for (let i = live.length - 1; i >= 0; i--) {
      const m = live[i];
      if (m.crater) { const a = (now - m.t0) / 3000; if (a >= 1) { drop(m.scar); drop(m.rim); live.splice(i, 1); continue; } m.scar.material.opacity = 0.75 * (1 - a); m.rim.material.opacity *= 0.97; continue; }
      const p = Math.min(1, (now - m.t0) / m.dur), e = p * p;   // 越落越快
      const px = m.sx + (m.x - m.sx) * e, py = m.sy + (0.4 - m.sy) * e, pz = m.sz + (m.z - m.sz) * e;
      m.rock.position.set(px, py, pz); m.rock.rotation.x += 0.2; m.rock.rotation.y += 0.13; m.glow.position.set(px, py, pz);
      m.hist.unshift([px, py, pz]); if (m.hist.length > 30) m.hist.pop();
      m.trail.forEach((t, j) => { const h = m.hist[Math.min(m.hist.length - 1, j * 2 + 1)]; if (h) t.position.set(h[0], h[1], h[2]); });
      if (p >= 1) { drop(m.rock); drop(m.glow); m.trail.forEach(drop); live.splice(i, 1); crater(m.x, m.z, m.col, m.big); }
    }
  };
  requestAnimationFrame(tick);
  // 大招期間：攔下落點預警（加一顆落下的隕石）和光柱（不要了）
  const wrapFx = () => {
    const fx0 = R.fx; if (!fx0 || fx0._met) return;
    R.fx0m = fx0;
    const f = (kind, x, y, z, o) => {
      if (performance.now() < MET.until) {
        if (kind === 'mark' && o && o.t) { const big = (o.r || 0) >= 3.5, col = big ? '#FFD8A0' : MET.el ? COLS[MET.k % 3] : '#FF7A3A'; MET.k++; fall(x, z, o.t, col, big); }
        if (kind === 'pillar') return;
      }
      return fx0(kind, x, y, z, o);
    };
    f._met = 1; R.fx = f;
  };
  const wrapUlt = () => {
    const U = R.ULTS && R.ULTS.mage; if (!U || U._met) return; const g0 = U.go;
    U.go = (P, ...a) => { wrapFx(); MET.until = performance.now() + 3500; MET.k = 0; MET.el = !!(P && P.adv === 'elementalist'); return g0(P, ...a); };
    U._met = 1;
  };
  const init = () => { wrapUlt(); wrapFx(); };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
  R.meteorFx = { fall, crater, MET };
})(window.R);
