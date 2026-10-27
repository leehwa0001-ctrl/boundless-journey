// 2026-10-13 Esc 選單重新分類（作者：把玩家的 esc 鍵後的介面重新整理分類）
// 遺跡的暫停選單（hud.js）、城裡的選單（town.js）、可以走的城市選單（citykit2.js）都一樣排成：
//   遊戲（繼續、地圖、快速移動、委託、手冊、新手教學……）／角色（法術書、外觀、種族……）／
//   設定：畫面（畫質、鏡頭、幀數……）・聲音（音樂、音效）・按鍵與操作（按鍵設定）／社群・回報（回報穿模、公告……）／離開（回程、回到標題）
// 按鈕都是原本那幾顆搬過來的（onclick 不變），沒有拿掉任何功能；認不出來的放「其他」。
// 很多檔案晚一點才把按鈕塞進選單（setTimeout），所以用 MutationObserver 看著 #r-sheet，有新按鈕就再排一次。
(function (R) {
  R.lessFlash = () => { try { return localStorage.getItem('tfl_lessflash') !== '0'; } catch (e) { return true; } };
  const $ = id => document.getElementById(id);
  const MENU = /^(ps-x|tm-x|ck-x)$/;
  const SECS = [
    ['game', '遊戲'], ['char', '角色'], ['set', '設定'], ['social', '社群・回報'], ['other', '其他'], ['leave', '離開']
  ];
  const SUB = [['screen', '畫面'], ['sound', '聲音'], ['keys', '按鍵與操作']];
  const RULES = [
    ['leave', /回到標題|直接回程|放棄|離開|存檔/, /^(ps-quit|tm-title|ck-title)$/],
    ['keys', /按鍵|操作|搖桿|手把/],
    ['sound', /音效|音樂|音量|聲音/],
    ['screen', /畫質|鏡頭|幀數|像素版|畫面|視角|亮度|字體|介面大小|閃光/],
    ['social', /回報|穿模|公告|更新|隊伍|連線|好友|房間|聊天|分享|排行/],
    ['char', /技能|天賦|被動|捏角|披風|轉職|稱號|裝備|種族|人物|法術書|符卷書|兜帽|召喚|職業|角色/],
    ['game', /繼續|隔間牆|卡住|地圖|快速移動|委託|手冊|指南|圖鑑|教學|瓦版|日誌|任務|觀光/]
  ];
  const kindOf = b => { const t = (b.textContent || '').trim(), id = b.id || ''; for (const [k, re, ire] of RULES) { if ((ire && ire.test(id)) || re.test(t)) return k; } return 'other'; };
  const css = document.createElement('style');
  css.textContent = '.em-wrap{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:8px;margin:8px 0}'
    + '.em-sec{background:#17141E;border:1px solid #352E42;border-radius:8px;padding:8px 10px}.em-sec>h4{margin:0 0 6px;font-size:13px;letter-spacing:.1em;color:#C9B27A}'
    + '.em-set{grid-column:1/-1}.em-subs{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px}.em-sub>h5{margin:0 0 4px;font-size:12px;color:#A89CB8;font-weight:600}'
    + '.em-btns{display:flex;flex-wrap:wrap;gap:6px}.em-btns .btn{padding:6px 10px;font-size:14px;min-height:34px}.em-sub .vol-row{margin:0 0 6px}'
    + '.em-leave{grid-column:1/-1;display:flex;align-items:center;gap:8px;flex-wrap:wrap;background:#1C1418;border-color:#4A2E36}.em-leave>h4{margin:0 8px 0 0}'
    + '.em-game .btn.pri{min-width:120px}'
    + '@media (max-width:640px){.em-wrap{grid-template-columns:1fr}.em-btns .btn{flex:1 1 calc(50% - 6px);min-height:40px}}';
  document.head.appendChild(css);
  const build = sh => {
    const w = document.createElement('div'); w.className = 'em-wrap';
    SECS.forEach(([id, name]) => {
      const s = document.createElement('section'); s.className = 'em-sec em-' + id; s.innerHTML = '<h4>' + name + '</h4>';
      if (id === 'set') { const subs = document.createElement('div'); subs.className = 'em-subs'; SUB.forEach(([k, n]) => { const d = document.createElement('div'); d.className = 'em-sub em-s-' + k; d.innerHTML = '<h5>' + n + '</h5><div class="em-btns"></div>'; subs.appendChild(d); }); s.appendChild(subs); }
      else { const d = document.createElement('div'); d.className = 'em-btns'; s.appendChild(d); }
      w.appendChild(s);
    });
    return w;
  };
  const slot = (w, k) => (SUB.some(s => s[0] === k) ? w.querySelector('.em-s-' + k + ' .em-btns') : w.querySelector('.em-' + k + ' .em-btns'));
  let busy = false;
  const organize = () => {
    const sh = $('r-sheet'); if (!sh) return;
    const cont = [...sh.querySelectorAll('button')].find(b => MENU.test(b.id)); if (!cont) return;
    busy = true;
    try {
      let w = sh.querySelector('.em-wrap');
      if (!w) {
        w = build(sh);
        const anchor = sh.querySelector('.mt-wrap') || cont.closest('.row') || cont;
        anchor.before(w);
      }
      // 減少閃光（預設開）：全螢幕閃光、加亮光團、畫面晃動都調弱
      if (!sh.querySelector('#nf-tg')) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'nf-tg';
        const lab = () => { b.textContent = '減少閃光：' + (R.lessFlash() ? '開' : '關'); };
        lab(); b.onclick = () => { try { localStorage.setItem('tfl_lessflash', R.lessFlash() ? '0' : '1'); } catch (e) { } lab(); }; slot(w, 'screen').appendChild(b);
      }
      // 語言（2026-10-27，i18n.js）：中文 → English → Deutsch，換了重新載入
      if (R.LANGS && R.setLang && !sh.querySelector('#lang-tg')) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'lang-tg'; b.setAttribute('translate', 'no');
        const i = Math.max(0, R.LANGS.findIndex(x => x[0] === R.lang));
        b.textContent = '🌐 ' + R.LANGS[i][1] + ' → ' + R.LANGS[(i + 1) % R.LANGS.length][1];
        b.onclick = () => R.setLang(R.LANGS[(i + 1) % R.LANGS.length][0]); slot(w, 'screen').appendChild(b);
      }
      // 手機：全螢幕／隱藏網址列（2026-10-27，fullscreen.js）
      if (R.fsCan && R.fsCan() && !sh.querySelector('#fs-tg')) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'fs-tg';
        const lab = () => { b.textContent = R.fsLabel(); };
        lab(); b.onclick = () => { R.fsToggle(); lab(); }; slot(w, 'screen').appendChild(b);
      }
      // 城裡的快捷鍵欄（2026-10-18，townbar.js）
      if (R.townBarOn && !sh.querySelector('#tb-tg')) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'tb-tg';
        const lab = () => { b.textContent = '城裡的快捷鍵欄：' + (R.townBarOn() ? '開' : '關'); };
        lab(); b.onclick = () => { R.setTownBar(!R.townBarOn()); lab(); }; slot(w, 'screen').appendChild(b);
      }
      // 鏡頭：一般／肩部視角（2026-10-18，shouldercam.js）
      if (R.setShoulder && !sh.querySelector('#sc-tg')) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'sc-tg';
        const lab = () => { b.textContent = '鏡頭：' + (R.shoulderOn() ? '肩部視角' : '一般') + '（P）'; };
        lab(); b.onclick = () => { R.setShoulder(!R.shoulderOn()); lab(); }; slot(w, 'screen').appendChild(b);
      }
      if (R.shoulderPos && !sh.querySelector('#sc-pos-open')) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'sc-pos-open'; b.textContent = '肩部視角的位置（Shift＋P）';
        b.onclick = () => R.shoulderPos(); slot(w, 'screen').appendChild(b);
      }
      // 按鍵設定：鍵盤玩家一定看得到（城市選單原本沒有）
      if (!R.touch && R.keySheet && !sh.querySelector('#kb-open')) {
        const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'kb-open'; b.textContent = '按鍵設定';
        const again = cont.id === 'ps-x' ? () => R.pauseSheet() : cont.id === 'tm-x' ? () => R.townMenu() : null;
        b.onclick = () => R.keySheet(again); slot(w, 'keys').appendChild(b);
      }
      // 遺跡裡的 Esc 選單：查看目前裝著的技能（2026-10-15 作者）
      if (cont.id === 'ps-x' && R.skillViewSheet && !sh.querySelector('#ps-skills')) { const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'ps-skills'; b.textContent = '查看目前技能'; b.onclick = () => R.skillViewSheet(); slot(w, 'char').prepend(b); }
      const vol = sh.querySelector('.vol-row'); if (vol && !vol.closest('.em-wrap')) { const s = w.querySelector('.em-s-sound'); s.insertBefore(vol, s.querySelector('.em-btns')); }
      [...sh.querySelectorAll('button')].forEach(b => {
        if (b.classList.contains('cx-x') || b.closest('.em-wrap') || b.closest('.cs-box') || b.closest('.vol-row') || b.closest('details')) return;   // 2026-10-15 修：右上角的 ✕（closex.js）不要搬──搬走了 closex 又補一顆、再被搬，越長越多
        if (b.closest('.keys,.keyrow')) return;
        let k = kindOf(b); if (b === cont) k = 'game';
        const d = slot(w, k); if (b === cont) d.prepend(b); else d.appendChild(b);
      });
      // 空的區塊藏起來；原本的分組（menutidy.js）、空的 row 拿掉
      w.querySelectorAll('.em-sub').forEach(s => { s.hidden = !s.querySelector('.em-btns').children.length && !s.querySelector('.vol-row'); });
      w.querySelectorAll('.em-sec').forEach(s => { s.hidden = s.classList.contains('em-set') ? ![...s.querySelectorAll('.em-sub')].some(x => !x.hidden) : !s.querySelector('.em-btns').children.length; });
      sh.querySelectorAll('.mt-wrap,.mt-sys').forEach(x => { if (!x.querySelector('button,input')) x.remove(); });
      sh.querySelectorAll('.row').forEach(r => { if (!r.closest('.em-wrap') && !r.children.length) r.remove(); });
    } catch (e) { console.warn('[escmenu]', e); }
    busy = false;
  };
  let t = null;
  const start = () => {
    const sh = $('r-sheet'); if (!sh) return setTimeout(start, 300);
    new MutationObserver(() => { if (busy) return; clearTimeout(t); t = setTimeout(organize, 20); }).observe(sh, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  R.escMenuOrganize = organize;
  // 目前技能：裝著的每一格技能──名字、種類、實際冷卻（含冷卻縮減）、魔力、完整說明、技能變化；看完「回去」回到 Esc 選單
  R.skillViewSheet = () => {
    const W = R.W, P = W && W.P; if (!P || !R.SKILLS) return; const esc = t => R.esc(String(t == null ? '' : t));
    const lo = R.loadoutOf ? R.loadoutOf(P.cls) : [P.skill], un = R.SKILL_UNLOCK || [1, 3, 6, 10, 15], ids = [];
    lo.forEach((id, j) => { if (j === 0) id = P.skill || id; if (id && R.SKILLS[id] && (P.lv || 1) >= (un[j] || 1)) ids.push([j, id]); });
    const cdK = P.skillCdMult || 1, n1 = v => Math.round(v * 10) / 10;
    const card = ([j, id]) => { const sk = R.SKILLS[id], ic = R.skillIconURL && R.skillIconURL(id), tag = R.skillTag ? R.skillTag(id) : '', rk = R.skillRank ? R.skillRank(id) || 0 : 0;
      return '<div class="sv-card">' + (R.skillQ ? R.skillQ(id) : '') + (ic ? '<img src="' + ic + '" alt="">' : '<i></i>') + '<div><b>第 ' + (j + 1) + ' 格・' + esc(sk.name) + (rk ? ' <small>熟練度 ★' + rk + '</small>' : '') + '</b>'
        + '<small>' + (tag ? esc(tag) + '・' : '') + '冷卻 ' + n1(sk.cd * cdK) + ' 秒' + (Math.abs(cdK - 1) > 0.01 ? '（原本 ' + sk.cd + '）' : '') + '・' + (P.cls === 'warrior' ? '不耗怒氣' : '魔力 ' + sk.mp) + '</small>'
        + '<p>' + esc(sk.desc) + '</p></div></div>'; };
    R.sheet('<p class="kicker">' + esc((R.CLASSES[P.cls] || {}).name || '') + ' Lv ' + (P.lv || 1) + '</p><h2>目前技能</h2>' + (ids.length ? ids.map(card).join('') : '<p class="note">還沒有裝技能。</p>')
      + '<p class="note">遺跡裡不能換技能；換技能要回城裡的暫停選單或公會的「武器登記」旁邊。</p>', '<div class="row"><button type="button" class="btn pri" id="sv-back">回去</button></div>');
    const b = document.getElementById('sv-back'); if (b) b.onclick = () => (R.pauseSheet ? R.pauseSheet() : R.closeSheet());
  };
  const svCss = document.createElement('style');
  svCss.textContent = '.sv-card{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;margin:6px 0;border-radius:8px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)}.sv-card>img,.sv-card>i{width:40px;height:40px;flex:none;border-radius:6px;background:#221E2A;image-rendering:pixelated}.sv-card b{display:block}.sv-card b small{color:#FFE08A;font-weight:400}.sv-card>div>small{color:#A8A0B0}.sv-card p{margin:4px 0 0;line-height:1.5}';
  document.head.appendChild(svCss);
})(window.R);
