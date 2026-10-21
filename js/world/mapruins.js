// 地圖上的遺跡改用新的圖標（2026-10-21 作者：依種類與分級放圖標，不再顯示名稱）
// - 圖標：assets/icons/ruins/<種類>-<分級>.svg（種類 maze 迷宮型／tomb 陵墓型／city 城區型／island 浮島型／tower 高塔型；分級的眼睛在上面）。
// - 遺跡的名字平常不顯示，滑鼠靠近或點了才出現在圖標正上方（mapsites.js 的 CSS）；點下去右邊照樣有介紹。
// - 全國、東鶴近郊兩張圖都換；城市、封鎖海域不動。
(function (R) {
  const NS = 'http://www.w3.org/2000/svg', W = 38, H = 52;   // 圖標 64×88 → 地圖上 38×52（底下的種類圖案中心對準地點）
  const TYPES = ['maze', 'tomb', 'city', 'island', 'tower'];
  const icon = s => 'assets/icons/ruins/' + (TYPES.includes(s.type) ? s.type : 'maze') + '-' + (R.GRADE_COLOR[s.grade] ? s.grade : 'amile') + '.svg';
  const post = str => {
    try {
      const doc = new DOMParser().parseFromString(str, 'image/svg+xml'), svg = doc.documentElement;
      if (svg.querySelector('parsererror')) return str;
      svg.querySelectorAll('g.site.k-ruin').forEach(g => {
        const s = R.SITES.find(x => x.id === g.dataset.site), mk = g.querySelector('.mk'); if (!s || !mk) return;
        [...mk.children].forEach(c => { if (!(c.getAttribute('class') || '').includes('pulse')) c.remove(); });
        const im = doc.createElementNS(NS, 'image'); im.setAttribute('href', icon(s)); im.setAttribute('x', -W / 2); im.setAttribute('y', -H * 0.64); im.setAttribute('width', W); im.setAttribute('height', H); mk.appendChild(im);
        const t = g.querySelector('text.site-name'); if (t) { t.setAttribute('x', 0); t.setAttribute('y', -25); }   // 圖標放大後的頂端約 −22
        const tt = doc.createElementNS(NS, 'title'); tt.textContent = s.name; g.insertBefore(tt, g.firstChild);
      });
      return new XMLSerializer().serializeToString(svg);
    } catch (e) { console.warn('[mapruins]', e); return str; }
  };
  const n0 = R.drawNation, d0 = R.drawDonghe;
  R.drawNation = () => post(n0());
  R.drawDonghe = () => post(d0());
})(window.R);
