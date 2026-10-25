// 骰寶「三連星」（2026-10-24 作者：賭博也可以新增）：柏青哥「銀河」的選台畫面多一張骰寶桌。
// 三顆骰子：押大（11～17）、小（4～10）、單、雙（豹子＝三顆一樣的時候這四種都算輸）、任意豹子、或押總點數。直接押費拉。
// 賠率（含本金以外）：大小單雙 1 賠 1、任意豹子 1 賠 30、點數 4/17 賠 50、5/16 賠 18、6/15 賠 14、7/14 賠 12、8/13 賠 8、9～12 賠 6。
// 期望值大約九成多（莊家靠豹子吃掉大小單雙）。R.S.sicbo 記局數和贏最多的一把。
(function (R) {
  const BETS = [5, 20, 100, 500], FACE = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
  const SUMPAY = { 4: 50, 17: 50, 5: 18, 16: 18, 6: 14, 15: 14, 7: 12, 14: 12, 8: 8, 13: 8, 9: 6, 10: 6, 11: 6, 12: 6 };
  const KINDS = [['big', '大', '11～17', 1], ['small', '小', '4～10', 1], ['odd', '單', '總和單數', 1], ['even', '雙', '總和雙數', 1], ['triple', '任意豹子', '三顆一樣', 30]];
  const win = (k, d) => { const s = d[0] + d[1] + d[2], tri = d[0] === d[1] && d[1] === d[2]; if (k === 'triple') return tri; if (k[0] === 's' && k !== 'small') return s === +k.slice(1); if (tri) return false; return k === 'big' ? s >= 11 : k === 'small' ? s <= 10 : k === 'odd' ? s % 2 === 1 : s % 2 === 0; };
  const payOf = k => (k[0] === 's' && k !== 'small' ? SUMPAY[+k.slice(1)] : KINDS.find(x => x[0] === k)[3]);
  const nameOf = k => (k[0] === 's' && k !== 'small' ? '點數 ' + k.slice(1) : KINDS.find(x => x[0] === k)[1]);
  R.sicbo = where => {
    const S = R.S; S.sicbo = S.sicbo || { n: 0, best: 0 };
    let bet = BETS.includes(S.sicbo.bet) ? S.sicbo.bet : 20, pick = 'big', rolling = false;
    R.sheet('<p class="kicker">' + (where || '柏青哥「銀河」・裡面的骰寶桌') + '</p><h2>骰寶「三連星」</h2><p class="note">莊家把三顆骰子蓋在碗裡搖。押大小單雙一賠一，但開出豹子（三顆一樣）就全歸莊家。'
      + (S.sicbo.n ? '你玩了 ' + S.sicbo.n + ' 把' + (S.sicbo.best ? '，贏最多的一把 ' + S.sicbo.best + ' 費拉' : '') + '。' : '') + '</p>'
      + '<div class="sb-dice" id="sb-d">⚀ ⚀ ⚀</div><p class="note" id="sb-msg">選一種押法、押多少，按「開」。</p>'
      + '<div class="row sb-k">' + KINDS.map(([k, n, d, p]) => '<button type="button" class="btn" data-sbk="' + k + '">' + n + '<small>' + d + '・1 賠 ' + p + '</small></button>').join('') + '</div>'
      + '<div class="row sb-k">' + Object.keys(SUMPAY).sort((a, b) => a - b).map(n => '<button type="button" class="btn" data-sbk="s' + n + '">' + n + '<small>1 賠 ' + SUMPAY[n] + '</small></button>').join('') + '</div>'
      + '<div class="row">' + BETS.map(b => '<button type="button" class="btn" data-sbb="' + b + '">押 ' + b + '</button>').join('') + '</div>',
      '<div class="row"><button type="button" class="btn pri" id="sb-go">開</button><button type="button" class="btn" id="sb-x">離開</button></div>');
    const $ = id => document.getElementById(id);
    const sel = () => {
      document.querySelectorAll('[data-sbk]').forEach(b => b.classList.toggle('pri', b.dataset.sbk === pick));
      document.querySelectorAll('[data-sbb]').forEach(b => { b.classList.toggle('pri', +b.dataset.sbb === bet); b.disabled = S.gold < +b.dataset.sbb; });
      $('sb-go').textContent = '開（押「' + nameOf(pick) + '」' + bet + ' 費拉・手上 ' + S.gold + '）'; $('sb-go').disabled = rolling || S.gold < bet;
    };
    document.querySelectorAll('[data-sbk]').forEach(b => { b.onclick = () => { if (!rolling) { pick = b.dataset.sbk; sel(); } }; });
    document.querySelectorAll('[data-sbb]').forEach(b => { b.onclick = () => { if (!rolling) { bet = +b.dataset.sbb; S.sicbo.bet = bet; sel(); } }; });
    $('sb-x').onclick = R.closeSheet;
    $('sb-go').onclick = () => {
      if (rolling || S.gold < bet) return; rolling = true; S.gold -= bet; R.save(); sel();
      const d = [0, 0, 0].map(() => 1 + Math.floor(Math.random() * 6)), k = pick, b = bet; let n = 0;
      R.sfx && R.sfx('pick'); $('sb-msg').textContent = '莊家搖碗……';
      const t = setInterval(() => {
        const box = $('sb-d'); if (!box) { clearInterval(t); return; }
        if (++n < 12) { box.textContent = [0, 0, 0].map(() => FACE[Math.floor(Math.random() * 6)]).join(' '); return; }
        clearInterval(t); box.textContent = d.map(v => FACE[v - 1]).join(' ');
        const s = d[0] + d[1] + d[2], tri = d[0] === d[1] && d[1] === d[2], ok = win(k, d), got = ok ? b * (payOf(k) + 1) : 0;
        S.gold += got; S.sicbo.n++; if (got - b > S.sicbo.best) S.sicbo.best = got - b; R.save();
        $('sb-msg').textContent = '開：' + d.join('、') + '＝' + s + (tri ? '（豹子！）' : s >= 11 ? '（大）' : '（小）') + (ok ? '——押中「' + nameOf(k) + '」，拿回 ' + got + ' 費拉！' : '——沒中，' + b + ' 費拉歸莊家。');
        if (ok) R.sfx && R.sfx(payOf(k) >= 12 ? 'chest' : 'coin');
        rolling = false; sel();
      }, 80);
    };
    sel();
  };
  // 柏青哥的選台畫面多一張「骰寶」
  const pc0 = R.pachinko;
  R.pachinko = kind => { const r = pc0(kind); if (!kind) { const box = document.querySelector('.pachi-kinds'); if (box && !box.querySelector('[data-sicbo]')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'pachi-kind'; b.dataset.sicbo = '1'; b.style.setProperty('--pk', '#E8C04A'); b.style.setProperty('--pkb', '#3A1A0E'); b.innerHTML = '<b>骰寶・三連星</b><small>三顆骰子：大小、單雙、豹子、點數</small><span>直接押費拉，一把定輸贏。點數 4、17 一賠五十。</span>'; b.onclick = () => R.sicbo(); box.appendChild(b); } } return r; };
  const css = document.createElement('style');
  css.textContent = '.sb-dice{font-size:64px;line-height:1.1;text-align:center;letter-spacing:.15em;color:#F4ECD8;background:#3A1A0E;border:3px solid #8A5A2A;border-radius:12px;padding:6px 0}.sb-k .btn{min-width:3.6em}.sb-k .btn small{display:block;font-size:.72em;opacity:.8}';
  document.head.appendChild(css);
})(window.R);
