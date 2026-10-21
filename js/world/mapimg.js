// 全國地圖換成作者畫的圖（2026-10-21 作者：新版昭旭地圖）
// - 底圖：assets/map/zhaoxu.webp（779×591，跟 map.js 的地圖範圍 FR 一樣大小比例）；原本程式畫的海、海岸、鄰國、山、森林、路、國名都拿掉。
// - 國旗：圖上的小國旗換成清楚的（assets/flags/，昭旭用 flag.webp），位置照圖上量的（圖的像素）。
// - 留下來的：地點（城市、遺跡的眼睛、封鎖海域）、島名、紙紋。
(function (R) {
  const IMG = 'assets/map/zhaoxu.webp', IW = 779, IH = 591;
  const FLAGS = [   // [圖, 左, 上, 寬, 高]（圖的像素）
    ['flag.webp', 562, 89, 46, 30],
    ['assets/flags/warnarant.webp', 40, 197, 47, 32],
    ['assets/flags/n-karoen.webp', 74, 382, 47, 32],
    ['assets/flags/s-karoen.webp', 163, 483, 46, 31],
    ['assets/flags/yueyun.webp', 6, 536, 46, 31],
    ['assets/flags/bakimist.webp', 209, 546, 47, 31]
  ];
  const NS = 'http://www.w3.org/2000/svg';
  const d0 = R.drawNation;
  R.drawNation = () => {
    const s = d0();
    try {
      const doc = new DOMParser().parseFromString(s, 'image/svg+xml'), svg = doc.documentElement;
      if (svg.querySelector('parsererror')) return s;
      const vb = svg.getAttribute('viewBox').split(' ').map(Number), W = vb[2], H = vb[3], kx = W / IW, ky = H / IH;
      [...svg.children].forEach(el => { if (!(el.tagName === 'defs' || el.matches('g.site, text.island-name') || el.getAttribute('pointer-events') === 'none')) el.remove(); });
      const img = (href, x, y, w, h) => { const e = doc.createElementNS(NS, 'image'); e.setAttribute('href', href); e.setAttribute('x', x.toFixed(1)); e.setAttribute('y', y.toFixed(1)); e.setAttribute('width', w.toFixed(1)); e.setAttribute('height', h.toFixed(1)); e.setAttribute('preserveAspectRatio', 'none'); return e; };
      const g = doc.createElementNS(NS, 'g'); g.setAttribute('class', 'map-art');
      g.appendChild(img(IMG, 0, 0, W, H));
      FLAGS.forEach(([href, x, y, w, h]) => g.appendChild(img(href, (x - 0.5) * kx, (y - 0.5) * ky, (w + 1) * kx, (h + 1) * ky)));
      const defs = svg.querySelector('defs'); svg.insertBefore(g, defs ? defs.nextSibling : svg.firstChild);
      return new XMLSerializer().serializeToString(svg);
    } catch (e) { console.warn('[mapimg]', e); return s; }
  };
})(window.R);
