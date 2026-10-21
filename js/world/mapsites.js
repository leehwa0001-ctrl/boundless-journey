// 地圖上的城市、遺跡圖標（2026-10-21 作者）
// - 城市（首都、城市、村子）和遺跡的圖標平常縮小 45%，滑鼠靠近或點了才放大回原本的大小。
// - 城市的名字一律放在圖標正上方；遺跡的名字平常不顯示，滑鼠靠近或點了才出現（位置在 mapruins.js）。
// - 城市畫在遺跡上面（名字不會被遺跡圖標蓋住）。圖標變小了，每個地點多一圈看不見的感應範圍，滑鼠靠近就算；滑鼠停著的地點畫在最上面，不會被旁邊的蓋住。
(function (R) {
  const NS = 'http://www.w3.org/2000/svg', KINDS = ['capital', 'city', 'village', 'ruin'];
  const css = () => {
    if (document.getElementById('mapsites-css')) return; const st = document.createElement('style'); st.id = 'mapsites-css';
    const k = (pre, post) => KINDS.map(x => pre + '.site.k-' + x + post).join(',');
    st.textContent = k('', ' .mk') + '{transform:scale(calc(var(--map-detail-scale,1) * .55))}'
      + k('', ':hover .mk') + ',' + k('', ':focus .mk') + ',' + k('', '.sel .mk') + '{transform:scale(var(--map-detail-scale,1))}'
      + '.site .hit{fill:transparent;stroke:none}'
      + '.site.k-ruin .site-name{opacity:0;transition:opacity .15s;pointer-events:none}'
      + '.site.k-ruin:hover .site-name,.site.k-ruin:focus .site-name,.site.k-ruin.sel .site-name{opacity:1}';
    document.head.appendChild(st);
  };
  const post = str => {
    try {
      const doc = new DOMParser().parseFromString(str, 'image/svg+xml'), svg = doc.documentElement;
      if (svg.querySelector('parsererror')) return str;
      svg.querySelectorAll('g.site').forEach(g => {
        const kind = (g.getAttribute('class').match(/k-(\w+)/) || [])[1]; if (!KINDS.includes(kind)) return;
        const inn = g.querySelector('.site-in'); if (!inn) return;
        const hit = doc.createElementNS(NS, 'circle'); hit.setAttribute('class', 'hit'); hit.setAttribute('r', 9); if (kind === 'ruin') hit.setAttribute('cy', -5); inn.insertBefore(hit, inn.firstChild);
        if (kind === 'ruin') return;
        const t = g.querySelector('text.site-name'); if (t) { t.setAttribute('x', 0); t.setAttribute('y', kind === 'capital' ? -11 : -9); }
      });
      // 城市畫在遺跡後面（＝上面），城市的名字才不會被遺跡的圖標蓋住
      const sites = [...svg.children].filter(e => e.matches('g.site')), end = sites.length ? sites[sites.length - 1].nextSibling : null;
      sites.filter(g => /k-(capital|city|village)\b/.test(g.getAttribute('class'))).forEach(g => svg.insertBefore(g, end));
      return new XMLSerializer().serializeToString(svg);
    } catch (e) { console.warn('[mapsites]', e); return str; }
  };
  const n0 = R.drawNation, d0 = R.drawDonghe;
  R.drawNation = () => { css(); return post(n0()); };
  R.drawDonghe = () => { css(); return post(d0()); };
  const pz0 = R.panZoom;
  R.panZoom = (svg, onPick) => {
    svg.addEventListener('pointerover', e => { const g = e.target.closest && e.target.closest('g.site'); if (g && g.parentNode.lastElementChild !== g) g.parentNode.appendChild(g); });
    return pz0(svg, onPick);
  };
})(window.R);
