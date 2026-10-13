// 多人連線：地圖上看得到隊友（2026-10-14 作者：連線地圖上不會看到隊友）
// - R.coopMates()：同一趟、同一層的連線隊友（net.js 只收同層的位置）→ { x, z, yaw, name, col, down }
// - 右上小地圖（R.drawMinimap 最外層包一層）、Tab 遺跡地圖（ruinmap.js 呼叫 R.coopDraw）都畫：每人一個顏色的箭頭＋名字。
// - 城鎮不同步玩家位置，所以城鎮地圖沒有隊友。
(() => {
  const PAL = ['#5AD1FF', '#FF7AC8', '#B48CFF', '#FFB04A', '#7CFF8A', '#FF6A5A'];
  R.coopMates = () => {
    const N = R.net; if (!N || !N.remotes || !N.remotes.size || !(R.W && R.W.run)) return [];
    const mem = N.members || [], out = [];
    N.remotes.forEach((r, id) => {
      if (!r || !Number.isFinite(r.x) || !Number.isFinite(r.z)) return;
      const i = mem.findIndex(m => m.id === id), m = mem[i];
      out.push({ id, x: r.x, z: r.z, yaw: r.yaw || 0, name: (m && m.name) || '隊友', col: PAL[(i < 0 ? out.length : i) % PAL.length], down: !!(r.h && r.h.down) });
    });
    return out;
  };
  // g：2D context；pt(wx, wz) → [px, py]；sz：箭頭大小
  R.coopDraw = (g, pt, sz, font) => {
    const list = R.coopMates(); if (!list.length) return;
    g.save();
    list.forEach(c => {
      const [mx, my] = pt(c.x, c.z), [fx, fy] = pt(c.x + Math.sin(c.yaw), c.z + Math.cos(c.yaw)), ang = Math.atan2(fy - my, fx - mx);
      g.save(); g.translate(mx, my);
      if (c.down) { g.fillStyle = '#8A8A8A'; g.beginPath(); g.arc(0, 0, sz * 0.6, 0, 7); g.fill(); g.strokeStyle = '#FF6A5A'; g.lineWidth = 2; g.beginPath(); g.moveTo(-sz * .4, -sz * .4); g.lineTo(sz * .4, sz * .4); g.moveTo(sz * .4, -sz * .4); g.lineTo(-sz * .4, sz * .4); g.stroke(); }
      else { g.rotate(ang + Math.PI / 2); g.beginPath(); g.moveTo(0, -sz); g.lineTo(sz * .65, sz * .65); g.lineTo(0, sz * .3); g.lineTo(-sz * .65, sz * .65); g.closePath(); g.fillStyle = c.col; g.fill(); g.lineWidth = 1.5; g.strokeStyle = '#0C0E12'; g.stroke(); }
      g.restore();
      g.font = font; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.lineWidth = 3; g.strokeStyle = 'rgba(8,10,14,.9)';
      const t = c.name + (c.down ? ' 倒下' : ''); g.strokeText(t, mx, my - sz - 2); g.fillStyle = c.col; g.fillText(t, mx, my - sz - 2);
    });
    g.restore();
  };
  const dm0 = R.drawMinimap;
  if (dm0) R.drawMinimap = function () {
    const ret = dm0.apply(this, arguments);
    try {
      const W = R.W, P = W && W.P, cv = document.getElementById('r-map');
      if (P && cv && W.run && W.F && R.coopMates().length) {
        const s = cv.width, sc = 1.3, yaw = W.cam ? W.cam.yaw : 0, cy = Math.cos(yaw), sy = Math.sin(yaw), g = cv.getContext('2d');
        const pt = (wx, wz) => { const dx = (wx - P.x) / sc, dz = (wz - P.z) / sc; let px = s / 2 + dx * cy - dz * sy, py = s / 2 + dx * sy + dz * cy; const r = Math.hypot(px - s / 2, py - s / 2), lim = s / 2 - 8; if (r > lim) { px = s / 2 + (px - s / 2) * lim / r; py = s / 2 + (py - s / 2) * lim / r; } return [px, py]; };
        R.coopDraw(g, pt, 6, 'bold 10px sans-serif');
      }
    } catch (e) { console.warn('[coopmap]', e); }
    return ret;
  };
})();
