// 《傳奇人物誌》久世玄悟（已故的精神人物，只是閱讀內容；不上場、不改能力、不寫公告）
// 東鶴書房、皇嶺書店・積學堂可翻閱；圖在打開書時才載入（img/lore/kuze_*.webp）。
(function (R) {
  const P = [
    { t: '生平', img: 'img/lore/kuze_battle.webp', h: '刀鬼・久世玄悟',
      body: ['昭旭的人提起「刀鬼」，指的就是他。這本人物誌由後人整理成冊，以下照家譜與舊籍所記。',
        '久世玄悟生於 AG 188 年冬雪月 12 月 25 日，出生在昭旭聯合王國吉山縣，是久世家族的次男；國籍記為昭光帝國豐邑府廳。',
        '他專精內修派，練的是肢宮道；所用的久世道刀法、近身格鬥與雙刃戰鬥，至今仍是昭旭習刀者口中的名字。',
        '享年二百七十九歲。'] },
    { t: '基本資料', img: 'img/lore/kuze_stand.webp', tall: 1, rows: [
      ['名稱', '久世 玄悟'], ['稱號', '刀鬼'], ['年齡', '279 歲（已故）'], ['生日', 'AG 188 年 冬雪月 12 月 25 日（12/25）'],
      ['出生地', '昭旭聯合王國 吉山縣'], ['國籍', '昭光帝國 豐邑府廳'], ['生物種', '智慧種－地表平原－大陸族種－大陸人族 - 精靈混血'],
      ['久世家族', '次男'], ['身高', '188公分'], ['體重', '98公斤'], ['血型', '藍漿AB型'], ['專精魔法派系', '內修派']] },
    { t: '嗜好', img: 'img/lore/kuze_rest.webp', rows: [
      ['專長', '刀劍格鬥、肉身搏鬥、內修派-肢宮道'], ['愛好', '戰鬥'], ['最喜／厭的食物', '精米飯／拌飯類型'], ['戰鬥風格', '久世道刀法、近身格鬥、雙刃戰鬥']] }];
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let el = null, pg = 0;
  function css() {
    if (document.getElementById('kz-css')) return; const s = document.createElement('style'); s.id = 'kz-css';
    s.textContent = `#kz-book{position:fixed;inset:0;z-index:9000;background:rgba(10,8,6,.72);display:flex;align-items:center;justify-content:center;font-family:"Noto Serif TC","Noto Serif JP",serif}
#kz-book .kz-p{width:min(920px,94vw);max-height:92vh;overflow:auto;background:#F3EAD6 repeating-linear-gradient(0deg,transparent 0 27px,rgba(120,90,50,.06) 27px 28px);border:3px solid #3A2A1C;outline:6px solid #6B4A2E;box-shadow:0 10px 40px #000;color:#2A1E14;padding:18px 22px}
#kz-book .kz-hd{display:flex;align-items:center;gap:10px;border-bottom:2px solid #8A2A24;padding-bottom:8px}
#kz-book .kz-hd b{font-size:22px;letter-spacing:.2em}#kz-book .kz-hd i{font-style:normal;color:#8A2A24;font-size:13px}
#kz-book .kz-x{margin-left:auto}
#kz-book button{font:inherit;background:#2E3A4A;color:#F3EAD6;border:1px solid #1A222C;padding:6px 14px;cursor:pointer;border-radius:2px}
#kz-book button:disabled{opacity:.35;cursor:default}
#kz-book .kz-tabs{display:flex;gap:4px;margin:10px 0}#kz-book .kz-tabs button{background:#C8B08A;color:#3A2A1C}
#kz-book .kz-tabs button[aria-selected=true]{background:#8A2A24;color:#F3EAD6}
#kz-book .kz-c{display:flex;gap:18px;flex-wrap:wrap}#kz-book .kz-c img{max-width:100%;border:2px solid #3A2A1C;background:#D8CCB0}
#kz-book .kz-c.wide img{width:100%;max-height:42vh;aspect-ratio:16/9;object-fit:cover}#kz-book .kz-c.tall img{width:240px;aspect-ratio:2/3;object-fit:cover}
#kz-book .kz-tx,#kz-book .kz-tx p{color:#2A1E14}#kz-book .kz-tx{flex:1;min-width:260px;line-height:1.85;font-size:15px}#kz-book .kz-tx h3{margin:0 0 6px;color:#8A2A24}
#kz-book table{border-collapse:collapse;width:100%}#kz-book td{color:#2A1E14!important;background:none!important;border-bottom:1px dotted #8A6A44;padding:4px 6px;vertical-align:top}#kz-book td:first-child{white-space:nowrap;color:#6B4A2E;width:7.5em}
#kz-book .kz-ft{display:flex;align-items:center;justify-content:space-between;margin-top:12px;border-top:1px solid #8A6A44;padding-top:8px}
@media(max-width:640px){#kz-book .kz-c.tall img{width:100%}}`;
    document.head.appendChild(s);
  }
  function draw() {
    const p = P[pg], wide = !p.tall;
    const tx = p.body ? '<h3>' + esc(p.h) + '</h3>' + p.body.map(x => '<p>' + esc(x) + '</p>').join('') : '<table>' + p.rows.map(r => '<tr><td>' + esc(r[0]) + '</td><td>' + esc(r[1]) + '</td></tr>').join('') + '</table>';
    el.querySelector('.kz-tabs').innerHTML = P.map((q, i) => '<button data-kp="' + i + '" aria-selected="' + (i === pg) + '">' + (i + 1) + '．' + esc(q.t) + '</button>').join('');
    el.querySelector('.kz-c').className = 'kz-c ' + (wide ? 'wide' : 'tall');
    el.querySelector('.kz-c').innerHTML = '<img loading="lazy" alt="久世玄悟" src="' + p.img + '"><div class="kz-tx">' + tx + '</div>';
    el.querySelector('.kz-pn').textContent = (pg + 1) + ' / ' + P.length;
    el.querySelector('[data-k=prev]').disabled = pg === 0; el.querySelector('[data-k=next]').disabled = pg === P.length - 1;
  }
  function key(e) {
    if (!el) return; const k = e.key;
    if (k === 'Escape') close(); else if (k === 'ArrowLeft' && pg > 0) { pg--; draw(); } else if (k === 'ArrowRight' && pg < P.length - 1) { pg++; draw(); } else return;
    e.preventDefault(); e.stopPropagation();
  }
  function close() { if (!el) return; el.remove(); el = null; window.removeEventListener('keydown', key, true); }
  function open(where) {
    css(); close(); pg = 0; el = document.createElement('div'); el.id = 'kz-book';
    el.innerHTML = '<div class="kz-p"><div class="kz-hd"><b>傳奇人物誌</b><i>' + esc(where || '') + '・後人整理</i><button class="kz-x" data-k="close">闔上書</button></div><div class="kz-tabs"></div><div class="kz-c"></div><div class="kz-ft"><button data-k="prev">◀ 上一頁</button><span class="kz-pn"></span><button data-k="next">下一頁 ▶</button></div></div>';
    el.addEventListener('click', e => { const b = e.target.closest('button'); if (e.target === el) return close(); if (!b) return;
      if (b.dataset.kp != null) pg = +b.dataset.kp; else if (b.dataset.k === 'prev') pg = Math.max(0, pg - 1); else if (b.dataset.k === 'next') pg = Math.min(P.length - 1, pg + 1); else if (b.dataset.k === 'close') return close(); draw(); });
    ['keydown', 'keyup', 'mousedown', 'wheel', 'touchstart'].forEach(t => el.addEventListener(t, e => e.stopPropagation()));
    document.body.appendChild(el); window.addEventListener('keydown', key, true); draw();
  }
  R.openKuzeBook = open; R.kuzeBookOpen = () => !!el; R.closeKuzeBook = close;
})(window.R = window.R || {});
