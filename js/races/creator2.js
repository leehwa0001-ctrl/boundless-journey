// 新的建角色畫面（2026-10-15 作者給的草圖）：原本四步（種族、外觀、特質、武器）兩兩合成兩頁
// - 第一頁「種族＋外觀」：左＝抽到的種族（五十連抽一次，可以捲）＋「抽」；中＝角色立繪（正面放大、下面三面小圖、種族說明、名字）；右＝外觀選項（可以捲）；右下「下一步」。
// - 第二頁「特質＋武器」：左＝登記的武器（武器的類別就是職業，可以捲）；中上＝優點特質、中下＝缺點特質（各自捲）；右＝已選擇的特質（剩幾點、拿掉）、角色摘要、登記完成。
// - 規則照舊：特質的點數、不相容（traits.js）、特質擋武器（traitfx.js 的 R.traitWeaponOk）、開局（R.traitApplyStart）。
// - 重新捏角（R.restyle）、重新登記種族（R.changeRace）照舊用 creator.js 的畫面。
// 放在 creator.js、lookplus.js、traits.js、traitpick.js、traitfx.js 後面（main.js 前面）。
(function (R) {
  const $ = id => document.getElementById(id), esc = s => R.esc(s), pick = a => a[Math.floor(Math.random() * a.length)];
  const css = document.createElement('style');
  // 2026-10-15 作者：配色降低對比——霧金色的框、暗灰的卡片、降飽和的紅
  css.textContent = [
    '#pick.cr2{--c2-bd:#9C8460;--c2-pan:#1E1B22;--c2-in:#2A2730;--c2-card:#37323C;--c2-card2:#433C45;--c2-tx:#E2DACB;--c2-dim:#ABA294;--c2-gd:#D6BE93;--c2-red:#9A4040;--c2-red2:#AE4C4A}',
    '#pick.cr2 .b-intro{display:none}#pick.cr2 .b-body{padding:10px 14px 14px}',
    '.c2{display:grid;gap:14px;height:calc(100vh - 128px);min-height:520px;color:var(--c2-tx)}',
    '.c2-a{grid-template-columns:minmax(270px,1.05fr) minmax(250px,.95fr) minmax(280px,1.1fr)}',
    '.c2-b{grid-template-columns:minmax(240px,.95fr) minmax(280px,1.15fr) minmax(260px,1fr);grid-template-rows:1fr 1fr}',
    '.c2-p{position:relative;display:flex;flex-direction:column;min-height:0;background:var(--c2-pan);border:3px solid var(--c2-bd);border-radius:16px;padding:10px;box-shadow:0 4px 14px rgba(0,0,0,.3)}',
    '.c2-p>h3{margin:0 0 8px;font-family:var(--serif);font-size:16px;color:var(--c2-gd);display:flex;align-items:center;gap:8px}.c2-p>h3 small{color:var(--c2-dim);font-size:12px;font-family:var(--sans)}',
    '.c2-scroll{flex:1;min-height:0;overflow-y:auto;background:var(--c2-in);border-radius:10px;padding:8px;display:grid;gap:8px;align-content:start;scrollbar-width:thin;scrollbar-color:#7E6B52 var(--c2-pan)}',
    '.c2-scroll::-webkit-scrollbar{width:8px}.c2-scroll::-webkit-scrollbar-thumb{background:#7E6B52;border-radius:4px}.c2-scroll::-webkit-scrollbar-track{background:var(--c2-pan)}',
    // 種族：上面是選中的那一族，下面是四格一列的小方塊
    '.c2-race{background:var(--c2-in);border-radius:10px;padding:8px 10px;margin-bottom:8px;max-height:36%;overflow-y:auto;display:grid;gap:3px;font-size:12.5px;border-left:4px solid var(--c,var(--c2-bd))}',
    '.c2-race b{font-family:var(--serif);font-size:17px}.c2-race .tier{color:var(--c);font-family:"DotGothic16",var(--sans);margin-right:6px}.c2-race small{color:var(--c2-dim)}.c2-race em{font-style:normal;color:#C9B07E}.c2-race i{font-style:normal;color:#C49A92;font-size:12px}',
    '.c2-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}',
    '.c2-tile{display:grid;gap:1px;align-content:start;text-align:center;background:var(--c2-card);color:var(--c2-tx);border:1px solid #4A4450;border-top:3px solid var(--c);border-radius:7px;padding:6px 3px;cursor:pointer;font:inherit;min-height:52px}',
    '.c2-tile span{font-family:"DotGothic16",var(--sans);color:var(--c);font-size:12px;opacity:.9}.c2-tile b{font-size:12px;font-weight:600;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
    '.c2-tile:hover{background:var(--c2-card2)}.c2-tile.sel{background:#4A4234;border-color:var(--c2-gd);box-shadow:0 0 0 1px var(--c2-gd) inset}',
    '.c2-tile.flip{animation:flip .5s ease}.c2-tile.shine{animation:flip .5s ease,shine 1.6s ease .5s 2}',
    '.c2-foot{display:flex;gap:8px;align-items:center;margin-top:10px}.c2-foot small{color:var(--c2-dim)}',
    '.c2-red{background:var(--c2-red);border:1px solid #B86A60;color:#F1E6DA;font-weight:700;border-radius:6px;padding:10px 24px;font-size:16px;cursor:pointer}.c2-red:hover{background:var(--c2-red2)}.c2-red:disabled{opacity:.4;cursor:not-allowed}',
    '.c2-next{position:absolute;right:0;bottom:-58px;min-width:200px;padding:12px 26px;font-size:17px}',
    '.c2-port{flex:1;min-height:180px;display:flex;flex-direction:column;align-items:center;gap:6px;background:#2E333A;border:3px solid #8C8476;border-radius:16px;padding:10px;overflow:hidden}',
    '.c2-port canvas{image-rendering:pixelated}#c2-big{flex:1;min-height:0;width:100%;height:100%;object-fit:contain}#c2-tri{flex:none;height:64px;width:auto;opacity:.85}',
    '.c2-name{display:flex;gap:6px;align-items:center;margin-top:10px}.c2-name input{flex:1;min-width:0;background:var(--c2-in);border:1px solid #4A4450;color:var(--c2-tx);border-radius:6px;padding:8px 10px;font-size:15px}',
    '.c2-opts{color:var(--c2-tx)}.c2-opts h4{margin:6px 0 2px;font-size:13px;color:var(--c2-gd)}.c2-opts .note{margin:0;color:var(--c2-dim)}',
    '#pick.cr2 .chip{background:var(--c2-card);border-color:#4A4450;color:var(--c2-tx)}#pick.cr2 .chip.on{background:#6E5D42;border-color:var(--c2-gd);color:#F4EAD8}',
    '#pick.cr2 .btn{background:var(--c2-card);border-color:#4E4854;color:var(--c2-tx)}',
    '.c2-empty{display:grid;place-items:center;text-align:center;color:var(--c2-dim);font-size:14px;line-height:1.6;padding:20px}',
    '.c2-w{grid-row:1/3}.c2-sel{grid-column:3;grid-row:1/3}',
    '.c2-grp{font-size:13px;color:var(--c2-gd);margin:6px 2px 0;display:flex;align-items:center;gap:6px;border-bottom:2px solid var(--gc,var(--c2-bd));padding-bottom:3px}.c2-grp .cls-emb,.c2-grp svg,.c2-grp img{width:30px;height:30px}',
    '.c2-scroll .reg-card{background:var(--c2-card);color:var(--c2-tx);border:1px solid #4A4450;border-radius:7px}.c2-scroll .reg-card span{color:var(--c2-dim)}.c2-scroll .reg-card:hover{background:var(--c2-card2)}.c2-scroll .reg-card.sel{background:#4A4234;border-color:var(--c2-gd);box-shadow:0 0 0 1px var(--c2-gd) inset}.c2-scroll .reg-card:disabled{opacity:.35}',
    '.c2-scroll .tp-t{background:var(--c2-card);color:var(--c2-tx);border:1px solid #4A4450}.c2-scroll .tp-t small{color:var(--c2-dim)}.c2-scroll .tp-t.pos i{color:#93BD8C}.c2-scroll .tp-t.neg i{color:#D29384}.c2-scroll .tp-t em{color:#D2A56C}.c2-scroll .tp-t.on{outline:1px solid var(--c2-gd);background:#4A4234}.c2-scroll .tp-t:disabled{opacity:.38}',
    '#pick.cr2 .tp-warn{color:#CDAE7C}',
    '.c2-left{font-size:22px;font-weight:700;color:var(--c2-gd)}.c2-left.bad{color:#D88878}.c2-left small{font-weight:400}',
    '.c2-sum{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:center;background:var(--c2-in);border-radius:10px;padding:8px;margin-bottom:8px}.c2-sum canvas{image-rendering:pixelated}',
    '.c2-sum div{display:grid;gap:2px;font-size:13px}.c2-sum b{font-family:var(--serif);font-size:16px}',
    // 2026-10-16 出身：角色圖旁邊兩個按鈕（origin.js）
    '.c2-sum.org{grid-template-columns:auto 1fr minmax(128px,auto)}.c2-sum .c2-org{display:grid;gap:6px;align-self:stretch;align-content:center}',
    '.c2-ob{display:grid;gap:1px;text-align:left;background:var(--c2-card);color:var(--c2-tx);border:1px solid #4A4450;border-radius:7px;padding:6px 8px;cursor:pointer;font:inherit}.c2-ob b{font-size:13px}.c2-ob small{color:var(--c2-dim);font-size:11px}.c2-ob:hover{background:var(--c2-card2)}.c2-ob.sel{background:#4A4234;border-color:var(--c2-gd);box-shadow:0 0 0 1px var(--c2-gd) inset}',
    '.c2-od{margin:-2px 0 8px;font-size:12px;color:var(--c2-dim);line-height:1.5}.c2-od b{color:var(--c2-gd)}',
    '@media (max-width:900px){.c2-sum.org{grid-template-columns:auto 1fr}.c2-sum .c2-org{grid-column:1/-1;grid-template-columns:1fr 1fr}.c2{height:auto}.c2-a,.c2-b{grid-template-columns:1fr;grid-template-rows:none}.c2-w,.c2-sel{grid-row:auto;grid-column:auto}.c2-scroll{max-height:56vh}.c2-port{min-height:340px}.c2-next{position:static;width:100%;margin-top:8px}.c2-race{max-height:none}}'
  ].join('');
  document.head.appendChild(css);

  let st = null, timer = 0, sheet = null, sheetKey = '';
  const K = () => R.CREATOR_KIT;
  const lookOf = () => Object.assign({ weapon: st.weapon || R.STARTER[st.cls] || 'katana', shield: !!(R.CLASSES[st.cls] && R.CLASSES[st.cls].shield), race: st.race }, st.look);
  // ---------- 立繪 ----------
  const draw = (cv, big) => {
    if (!cv || !st.race) return;
    const look = lookOf(), k = JSON.stringify(look); if (k !== sheetKey) { sheet = R.heroSheetCanvas(look); sheetKey = k; }
    const x = cv.getContext('2d'), sc = R.lookScale ? R.lookScale(st.look) : { x: 1, y: 1 }, fr = [0, 1, 0, 2][Math.floor(performance.now() / 240) % 4];
    x.imageSmoothingEnabled = false; x.clearRect(0, 0, cv.width, cv.height);
    if (big) {
      const S = Math.floor(Math.min(cv.width / 24, cv.height / 30) * 0.92), w = 24 * S * sc.x, h = 30 * S * sc.y;
      x.fillStyle = 'rgba(0,0,0,.28)'; x.beginPath(); x.ellipse(cv.width / 2, cv.height - 10, w * 0.32, 9, 0, 0, Math.PI * 2); x.fill();
      x.drawImage(sheet, fr * 24, 0, 24, 30, (cv.width - w) / 2, cv.height - h - 6, w, h);
    } else {
      const S = Math.floor(Math.min(cv.width / 72, cv.height / 30));
      [0, 2, 1].forEach((dir, i) => { const w = 24 * S * sc.x, h = 30 * S * sc.y; x.drawImage(sheet, fr * 24, dir * 30, 24, 30, i * 24 * S + (24 * S - w) / 2, cv.height - h, w, h); });
    }
  };
  const loop = () => { clearInterval(timer); timer = setInterval(() => { const a = $('c2-big'), b = $('c2-tri'), c = $('c2-mini'); if (!a && !c) { clearInterval(timer); return; } draw(a, true); draw(b, false); draw(c, true); }, 240); };

  // ---------- 第一頁：種族＋外觀 ----------
  const raceCard = (id, i) => { const r = R.RACES[id], T0 = R.TIERS[r.tier]; return '<button type="button" class="c2-tile' + (st.pick === i ? ' sel' : '') + '" data-pick="' + i + '" style="--c:' + T0.color + '" title="' + esc(r.name + '：' + r.line) + '"><span>' + T0.name + '</span><b>' + esc(r.name) + '</b></button>'; };
  const raceBox = () => { if (!st.race) return '<div class="c2-race"><b>選擇的種族</b><small>還沒選。抽完以後點下面的格子。</small></div>'; const r = R.RACES[st.race], T0 = R.TIERS[r.tier]; return '<div class="c2-race" style="--c:' + T0.color + '"><b><span class="tier">' + T0.name + '</span>' + esc(r.name) + '</b><small>' + esc(r.from) + '</small><span>' + esc(r.line) + '</span><em>' + esc(R.raceBonusText(st.race).join('・')) + '</em>' + (R.XENO_TEXT && R.XENO_TEXT[r.xeno] ? '<i>' + esc(R.XENO_TEXT[r.xeno]) + '</i>' : '') + '</div>'; };
  const sw = (key, list, cur, dis) => '<div class="swatches">' + list.map(c => '<button type="button" class="sw' + (c === cur ? ' on' : '') + '" data-k="' + key + '" data-v="' + c + '" style="--c:' + c + '" aria-label="' + c + '"' + (dis ? ' disabled' : '') + '></button>').join('') + '</div>';
  const chips = (key, list, cur) => '<div class="chips">' + list.map(([v, n]) => '<button type="button" class="chip' + (v === cur ? ' on' : '') + '" data-k="' + key + '" data-v="' + v + '">' + esc(n) + '</button>').join('') + '</div>';
  const optsHTML = () => {
    if (!st.race) return '<div class="c2-empty">先在左邊抽種族、選一個，<br>這裡就會出現外觀的選項。</div>';
    const k = K(), r = R.RACES[st.race], L = st.look, bald = !!r.look.bald, fixedHair = !!r.hairCol, O = R.LOOK_OPTS, FCOL = { ears: 'earCol', horns: 'hornCol', wings: 'wingCol', tail: 'tailCol' };
    return '<div class="c2-opts"><button type="button" class="btn" id="c2-rand" style="width:100%">全部隨機</button>'
      + '<h4>髮型</h4>' + (bald ? '<p class="note">' + esc(r.name) + '沒有頭髮。</p>' : chips('hs', k.HS.concat(O ? O.HAIR_NEW : []), L.hs))
      + '<h4>髮色</h4>' + (fixedHair ? '<p class="note">' + esc(r.name) + '的頭髮是天生的顏色。</p>' : sw('hair', (r.hairs || []).concat(k.HAIR.filter(c => !(r.hairs || []).includes(c))), L.hair, bald && !r.look.leaves))
      + '<h4>膚色</h4>' + sw('skin', r.skins, L.skin) + '<h4>眼睛</h4>' + sw('eye', k.EYES, L.eye)
      + (O ? '<h4>眉毛</h4>' + chips('brow', O.BROW, L.brow || '') + '<h4>瞳孔</h4>' + chips('pupil', O.PUPIL, L.pupil || '') + '<h4>表情</h4>' + chips('mouth', O.MOUTH, L.mouth || '')
        + '<h4>身高</h4>' + chips('height', O.HEIGHT, L.height || '') + '<h4>體格</h4>' + chips('build', O.BUILD, L.build || '') : '')
      + '<h4>上衣</h4>' + (O ? chips('topStyle', O.TOP, L.topStyle || '') : '') + sw('top', k.CLOTH, L.top)
      + (O && ['vest', 'coat', 'kimono'].includes(L.topStyle) ? '<h4>' + (L.topStyle === 'kimono' ? '腰帶' : '裡面的襯衫') + '</h4>' + sw('top2', k.CLOTH, L.top2 || '#E8E4DA') : '')
      + '<h4>披風</h4>' + sw('cloak', k.CLOTH, L.cloak)
      + (O ? '<h4>褲子</h4>' + chips('pantsStyle', O.PANTS, L.pantsStyle || '') + sw('pants', k.CLOTH, L.pants || '') + '<h4>鞋子</h4>' + chips('shoeStyle', O.SHOES, L.shoeStyle || '') + sw('shoe', O.SHOE_COL, L.shoe || '') : '')
      + (O && R.raceFeatureOpts ? R.raceFeatureOpts(st.race).map(f => '<h4>' + esc(f.n) + '</h4>' + (f.styles.length > 1 ? chips(f.key, f.styles, L[f.key] || f.def) : '') + sw(FCOL[f.key], O.FEAT_COL, L[FCOL[f.key]] || '')).join('') : '')
      + '<h4>配件</h4>' + chips('acc', k.ACC, L.acc) + (L.acc !== 'none' && L.acc !== 'glasses' && L.acc !== 'eyepatch' && L.acc !== 'earring' ? sw('accCol', k.ACCC, L.accCol) : '') + '</div>';
  };
  const setRace = id => { st.race = id; st.look = K().defaultLook(id); if (!st.nameSet) st.name = R.randomName(id); };
  const pageA = () => {
    const h = $('pick-cards');
    $('pick-h').textContent = '勇者登記・一、種族與外觀';
    h.innerHTML = '<div class="c2 c2-a">'
      + '<section class="c2-p"><h3>種族<small>' + (st.got.length ? '抽到 ' + st.got.length + ' 個，點一個登記' : '五十連抽一次') + '</small></h3>' + raceBox() + '<div class="c2-scroll" id="c2-races">' + (st.got.length ? '<div class="c2-grid">' + st.got.map(raceCard).join('') + '</div>' : '<div class="c2-empty">勇者證上要寫種族。<br>按下「抽」五十連抽一次，<br>從抽到的裡面選一個（最稀有的排前面）。</div>') + '</div>'
      + '<div class="c2-foot"><button type="button" class="c2-red" id="c2-draw"' + (st.got.length ? ' disabled' : '') + '>抽</button>' + (st.got.length ? '<small class="note">已經抽過了</small>' : '') + '</div></section>'
      + '<section class="c2-p"><h3>角色</h3><div class="c2-port"><canvas id="c2-big" width="240" height="300"></canvas><canvas id="c2-tri" width="216" height="90"></canvas></div>'
      + '<div class="c2-name"><input id="c2-nm" maxlength="12" placeholder="名字" value="' + esc(st.name || '') + '"' + (st.race ? '' : ' disabled') + '><button type="button" class="btn" id="c2-rn"' + (st.race ? '' : ' disabled') + '>換一個</button></div></section>'
      + '<section class="c2-p"><h3>外觀</h3><div class="c2-scroll" id="c2-opts">' + optsHTML() + '</div><button type="button" class="c2-red c2-next" id="c2-next"' + (st.race ? '' : ' disabled') + '>下一步</button></section></div>';
    const drawBtn = $('c2-draw');
    drawBtn.onclick = () => {
      if (st.got.length) return; const TI = Object.keys(R.TIERS);
      for (let k = 0; k < 50; k++) st.got.push(R.drawRace());
      st.got.sort((a, b) => TI.indexOf(R.RACES[b].tier) - TI.indexOf(R.RACES[a].tier)); st.pick = 0; setRace(st.got[0]); pageA();
      st.got.forEach((id, i) => { const el = h.querySelector('[data-pick="' + i + '"]'), r = R.RACES[id], d = i * 0.03, rare = r.tier === 'SSR' || r.tier === 'UR'; if (!el) return; el.style.animationDelay = rare ? d + 's, ' + (d + 0.5) + 's' : d + 's'; el.style.animationFillMode = 'backwards'; el.classList.add('flip'); if (rare) el.classList.add('shine'); });
    };
    h.querySelectorAll('[data-pick]').forEach(b => { b.onclick = () => { const sc = $('c2-races').scrollTop; st.pick = +b.dataset.pick; setRace(st.got[st.pick]); pageA(); $('c2-races').scrollTop = sc; }; });
    bindOpts();
    const nm = $('c2-nm'); if (nm) nm.oninput = e => { st.name = e.target.value.trim(); st.nameSet = true; };
    if ($('c2-rn')) $('c2-rn').onclick = () => { st.name = R.randomName(st.race); st.nameSet = false; $('c2-nm').value = st.name; };
    $('c2-next').onclick = () => { if (!st.race) return; if (!st.name) st.name = R.randomName(st.race); st.page = 'b'; pageB(); };
    loop();
  };
  const bindOpts = () => {
    const box = $('c2-opts'); if (!box) return;
    box.querySelectorAll('[data-k]').forEach(b => { b.onclick = () => { const sc = box.scrollTop; st.look[b.dataset.k] = b.dataset.v; refreshOpts(); $('c2-opts').scrollTop = sc; }; });
    const rd = $('c2-rand'); if (rd) rd.onclick = () => {
      const k = K(), r = R.RACES[st.race], bald = !!r.look.bald, O = R.LOOK_OPTS;
      st.look = k.defaultLook(st.race); if (!bald) st.look.hs = pick(k.HS.slice(0, 8))[0]; st.look.acc = pick(k.ACC)[0]; st.look.accCol = pick(k.ACCC); st.look.eye = r.eye || pick(k.EYES);
      if (O) { const pv = l => pick(l)[0]; Object.assign(st.look, { brow: pv(O.BROW), pupil: pv(O.PUPIL), mouth: pv(O.MOUTH), height: pv(O.HEIGHT), build: pv(O.BUILD), topStyle: pv(O.TOP), pantsStyle: pv(O.PANTS), shoeStyle: pv(O.SHOES), pants: pick(k.CLOTH), shoe: pick(O.SHOE_COL), top2: pick(k.CLOTH) }); if (!bald && Math.random() < 0.4) st.look.hs = pv(O.HAIR_NEW); }
      refreshOpts();
    };
  };
  const refreshOpts = () => { const box = $('c2-opts'); if (!box) return; box.innerHTML = optsHTML(); bindOpts(); };

  // ---------- 第二頁：特質＋武器 ----------
  const okW = (cls, w) => !R.traitWeaponOk || R.traitWeaponOk(cls, w, st.traits);
  const tCard = (t, on) => {
    const list = st.traits, blocked = on ? [] : R.traitBlockedBy(t.id, list), can = on || R.traitCanAdd(t.id, list), c = R.traitCost(t.id, on ? list : list.concat([t.id]));
    const why = blocked.length ? '不能和「' + blocked.map(o => R.TRAITS[o].name).join('」「') + '」一起選' : !can ? '點數不夠' : '';
    return '<button type="button" class="tp-t ' + (t.cost < 0 ? 'pos' : 'neg') + (on ? ' on' : '') + '" data-tp="' + t.id + '"' + (can ? '' : ' disabled') + '><b>' + esc(t.name) + '</b><i>' + (c > 0 ? '+' : '') + c + '</i><small>' + esc(t.desc) + '</small>' + (why ? '<em>' + esc(why) + '</em>' : '') + '</button>';
  };
  const tList = sign => { const free = R.TRAIT_LIST.filter(t => st.traits.indexOf(t.id) < 0 && (sign < 0 ? t.cost < 0 : t.cost > 0)); return [1, 2, 5, 8].map(c => { const g = free.filter(t => Math.abs(t.cost) === c); return g.length ? '<div class="c2-grp">' + (sign < 0 ? '用掉 ' : '多 ') + c + ' 點</div>' + g.map(t => tCard(t, false)).join('') : ''; }).join(''); };
  const pageB = () => {
    const h = $('pick-cards'), left = R.traitLeft(st.traits), g0 = R.regGroup(st.cls), d0 = R.CLASSES[st.cls], OR = R.ORIGINS;
    $('pick-h').textContent = '勇者登記・二、特質與武器';
    if (!okW(st.cls, st.weapon)) { const g = R.REG.find(x => x.list.some(([w]) => okW(x.cls, w))); if (g) { st.cls = g.cls; st.weapon = g.list.find(([w]) => okW(g.cls, w))[0]; } }
    const sc = ['c2-wl', 'c2-pos', 'c2-neg', 'c2-chosen'].map(id => ($(id) ? $(id).scrollTop : 0));
    h.innerHTML = '<div class="c2 c2-b">'
      + '<section class="c2-p c2-w"><h3>登記武器<small>武器的類別就是職業</small></h3><div class="c2-scroll" id="c2-wl">'
      + R.REG.map(g => { const d = R.CLASSES[g.cls]; return '<div class="c2-grp" style="--gc:' + d.color + '">' + (R.classEmblemHTML ? R.classEmblemHTML(g.cls) : '') + esc(g.group) + '・' + esc(d.name) + '</div>' + g.list.map(([w, line]) => '<button type="button" class="reg-card' + (st.cls === g.cls && st.weapon === w ? ' sel' : '') + '" data-cls="' + g.cls + '" data-w="' + w + '"' + (okW(g.cls, w) ? '' : ' disabled title="你的特質不能用這種武器"') + '><b>' + esc(R.regName(g.cls, w)) + '</b><span>' + esc(line) + '</span></button>').join(''); }).join('')
      + '</div></section>'
      + '<section class="c2-p"><h3>優點特質<small>用掉點數</small></h3><div class="c2-scroll" id="c2-pos">' + tList(-1) + '</div></section>'
      + '<section class="c2-p"><h3>缺點特質<small>多給點數</small></h3><div class="c2-scroll" id="c2-neg">' + tList(1) + '</div></section>'
      + '<section class="c2-p c2-sel"><h3>已選擇的特質</h3>'
      + '<div class="c2-sum' + (OR ? ' org' : '') + '"><canvas id="c2-mini" width="72" height="90"></canvas><div><b>' + esc(st.name) + '</b><span>' + esc(R.RACES[st.race].name) + '</span><span>' + esc(R.regName(st.cls, st.weapon)) + '・' + esc(g0.group) + '（' + esc(d0.name) + '）</span><small class="note">生命 ' + d0.hp + '・魔力 ' + d0.mp + '</small></div>'
      + (OR ? '<div class="c2-org">' + Object.keys(OR).map(k => '<button type="button" class="c2-ob' + (st.origin === k ? ' sel' : '') + '" data-org="' + k + '" title="' + esc(OR[k].lines.join('、')) + '"><b>' + esc(OR[k].name) + '</b><small>' + esc(OR[k].short) + '</small></button>').join('') + '</div>' : '') + '</div>'
      + (OR && OR[st.origin] ? '<p class="c2-od"><b>' + esc(OR[st.origin].name) + '</b>：' + esc(OR[st.origin].lines.join('、')) + '。</p>' : '')
      + '<div class="c2-left' + (left < 0 ? ' bad' : '') + '">剩下 ' + left + ' 點<small class="note">（一開始 ' + R.TRAIT_POINTS + ' 點）</small></div>'
      + '<p class="tp-warn">特質選了就不能再改，請對自己的角色負責。可以不選，點數也可以不用完。</p>'
      + '<div class="c2-scroll" id="c2-chosen">' + (st.traits.length ? st.traits.map(id => tCard(R.TRAITS[id], true)).join('') : '<div class="c2-empty">還沒選。<br>點中間的特質加進來，<br>點這裡的拿掉。</div>') + '</div>'
      + '<div class="c2-foot"><button type="button" class="btn" id="c2-back">上一步</button><span class="grow" style="flex:1"></span><button type="button" class="c2-red" id="c2-go">登記完成，走出公會</button></div></section></div>';
    ['c2-wl', 'c2-pos', 'c2-neg', 'c2-chosen'].forEach((id, i) => { if ($(id)) $(id).scrollTop = sc[i]; });
    h.querySelectorAll('[data-w]').forEach(b => { b.onclick = () => { st.cls = b.dataset.cls; st.weapon = b.dataset.w; pageB(); }; });
    h.querySelectorAll('[data-tp]').forEach(b => { b.onclick = () => {
      const id = b.dataset.tp, i = st.traits.indexOf(id);
      if (i >= 0) { const nl = st.traits.filter(x => x !== id); if (R.traitLeft(nl) < 0) { R.toast && R.toast('拿掉「' + R.TRAITS[id].name + '」點數會不夠，先拿掉一些優點。', '#F0A060'); return; } st.traits = nl; }
      else if (R.traitCanAdd(id, st.traits)) st.traits = st.traits.concat([id]); else return;
      pageB();
    }; });
    h.querySelectorAll('[data-org]').forEach(b => { b.onclick = () => { st.origin = b.dataset.org; pageB(); }; });
    $('c2-back').onclick = () => { st.page = 'a'; pageA(); };
    $('c2-go').onclick = finish;
    loop();
  };
  const finish = () => {
    clearInterval(timer);
    R.S = R.freshSave(st.cls, { name: st.name, look: st.look, race: st.race });
    const w = R.makeItem({ kind: 'weapon', base: st.weapon, ilvl: 1, rarity: 0, identified: true }); R.S.stash.push(w); R.S.equip[st.cls].weapon = w.id;
    R.ensureKit(st.cls); if (R.ensureWorld) R.ensureWorld();
    R.S.traits = { list: st.traits.slice(), asked: true, v: 1 }; if (R.traitApplyStart) R.traitApplyStart(st.cls, st.weapon);
    if (R.applyOrigin) R.applyOrigin(st.origin);
    if (st.race === 'demon') { R.S.watched = true; R.addDeed && R.addDeed('公會東鶴分館登記了一名純魔族勇者，列為受監視對象。'); }
    R.save(); $('pick').classList.remove('cr2'); R.enterTown();
  };

  // ---------- 接上 ----------
  R.createChar = slot => {
    if (slot) R.slot = slot;
    st = { page: 'a', race: null, look: null, name: '', nameSet: false, cls: 'gunner', weapon: 'pistol', traits: [], got: [], pick: null, origin: 'zhaoxu' };
    sheetKey = ''; R.showScreen('pick'); $('pick').classList.add('cr2'); pageA();
  };
  // 重新捏角、重新登記種族用的是舊畫面：把新版的樣式拿掉
  const rs0 = R.restyle; if (rs0) R.restyle = (...a) => { const p = $('pick'); if (p) p.classList.remove('cr2'); return rs0(...a); };
  const ss0 = R.showScreen; if (ss0) R.showScreen = (id, ...a) => { if (id !== 'pick') { const p = $('pick'); if (p) p.classList.remove('cr2'); } return ss0(id, ...a); };
})(window.R);
