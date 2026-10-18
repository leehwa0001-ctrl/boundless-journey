// 信譽值（2026-10-18 作者：重做原本的名聲 R.S.rep，−100～100，一開始 0）
// - 等級（看現在的值）：100／75／50／25／0／−25／−50／−75／−100。效果照作者的表：
//   反饋（委託成績的反饋 +20～−20，不超過 100；traitlife.js 的 R.traitTaskAxes 呼叫 R.repFb）、
//   所有消費（−15%～+15%：包 R.priceMul、R.spendMul）、霧島撿回裝備的機率（raid.js 呼叫 R.repKiri）、
//   遺跡裡倒下被路過的勇者救起來（25%／10%／5%：醒在這一層樓梯旁的營火邊，生命 30%）、
//   100：每天第一次偷東西被看到 75% 被原諒（props.js 呼叫 R.repForgive，還是會扣信譽值；作者 2026-10-18：每天只有第一次才擲）、
//   偷聽路人聊天會分享情報（今天哪座遺跡的佩特拉反應——那天去那座遺跡真的會是那個反應、市集的特價日、黑市進了什麼、隱藏任務的線索、重要角色在哪裡）；
//   −50 以下：城裡比較容易被搶（streetevents.js 呼叫 R.repRob）；−75 以下信譽值的獲取量 −50%、−100 −75%。
// - 其他（作者「其他的獲取來源、加成你幫我想」）：
//   ≥50：私人委託的報酬 +10%（jobs.js 呼叫 R.repJobMul）、通緝一星的小罪只口頭警告（不罰錢、不算前科）；
//   ≥75：路人偶爾送你小東西、路人說話比較親切；100：公會每 7 天送 2 瓶回復藥；
//   ≤−50：偷東西比較容易被看到（+10%）、私人委託的騙局變多（jobs.js 呼叫 R.repScamK）、路人比較冷淡；
//   ≤−75：公會不派哈米莉亞級的救援委託（hamilia.js 看 R.repTier）、市集和藥鋪不賣你東西；
//   法院申訴的勝率 ±15（traffic.js 照信譽值算）。
// - 會加會扣：R.S.rep 改成存取器，原本各處的 s.rep = (s.rep || 0) ± n 都會經過這裡（限制範圍、獲取量、特質、跳提示）。
//   這個檔案另外加的：公會委託成績（反饋 80% 以上 +2、100% +3、失敗 −2）、隱藏任務 +5、打倒對你動手的壞人 +1、
//   神社奉納 100 費拉 +1（一天一次）、信譽值是負的時候一整天沒做壞事 +1。
// - 特質（作者 2026-10-18）：默默無名＝信譽值不會變（解除後才開始累積；永久：信譽值不帶來折扣）；
//   惡名遠洋＝一開始 −85、只會扣不會加（解除後才開始累積）。
// - 顯示：城裡左上角、角色總數值、家裡的戰利品架（home.js）。
// 放在 fatigue.js 後面、kuzeshadow.js 前面（kuzeshadow.js 要包在 R.onPlayerDown 最外面）。
(function (R) {
  const W = () => R.W || {}, S = () => R.S, $ = id => document.getElementById(id), rnd = Math.random;
  const pick = a => a[Math.floor(rnd() * a.length)];
  const hasIn = (s, id) => !!(s && s.traits && s.traits.list && s.traits.list.indexOf(id) >= 0);
  const has = id => hasIn(S(), id);
  const TIERS = [[100, '眾所景仰', '#FFE08A'], [75, '備受信賴', '#9AE0B0'], [50, '值得信賴', '#9AE0B0'], [25, '小有口碑', '#C8E0A8'], [0, '普通', '#D8D0C0'], [-25, '風評不佳', '#E8D07A'], [-50, '聲名狼藉', '#F0A060'], [-75, '惡名昭彰', '#F06A6A'], [-100, '人人喊打', '#D04848']];
  const tierOf = v => (v >= 100 ? 100 : v >= 75 ? 75 : v >= 50 ? 50 : v >= 25 ? 25 : v > -25 ? 0 : v > -50 ? -25 : v > -75 ? -50 : v > -100 ? -75 : -100);
  const T = () => TIERS.find(t => t[0] === tierOf(get()));
  const get = () => { const s = S(); return s ? Math.round(s.rep || 0) : 0; };
  R.repValue = get; R.repTier = () => tierOf(get()); R.repTierName = () => T()[1];
  // ---------- 存取器：所有的加減都經過這裡 ----------
  let pend = 0, pendT = 0, blocked = '';
  const note = (d, why) => {
    pend += d; if (why) blocked = why; clearTimeout(pendT);
    pendT = setTimeout(() => { const n = Math.round(pend), b = blocked; pend = 0; blocked = ''; if (!R.toast) return; if (b && !n) { R.toast(b, '#C8B898'); return; } if (!n) return; R.toast('信譽值 ' + (n > 0 ? '+' : '') + n + '（現在 ' + get() + '・' + R.repTierName() + '）' + (b ? b : ''), n > 0 ? '#9AE0B0' : '#F0A060'); }, 80);
  };
  const ensure = s => {
    if (!s || typeof s !== 'object' || s.__rep) return s;
    const d = Object.getOwnPropertyDescriptor(s, 'rep');
    let v = Math.max(-100, Math.min(100, Math.round((d && 'value' in d ? +d.value : 0) || 0)));
    delete s.rep;
    Object.defineProperty(s, '__rep', { value: 1, enumerable: false });
    Object.defineProperty(s, '__repRaw', { enumerable: false, configurable: true, get: () => v, set: x => { v = Math.max(-100, Math.min(100, Math.round(x))); } });
    Object.defineProperty(s, 'rep', {
      enumerable: true, configurable: true,
      get: () => v,
      set(x) {
        x = +x; if (!isFinite(x)) return;
        let dlt = x - v; if (!dlt) return;
        if (hasIn(this, 'momo')) { if (this === R.S) note(0, '（默默無名：沒有人記得你做了什麼，信譽值不會變）'); return; }
        if (dlt > 0 && hasIn(this, 'eming')) { if (this === R.S) note(0, '（惡名遠洋：大家不相信你，信譽值加不上去）'); return; }
        if (dlt > 0) dlt *= v <= -100 ? 0.25 : v <= -75 ? 0.5 : 1;
        const before = v; v = Math.max(-100, Math.min(100, Math.round(v + dlt)));
        if (this === R.S && v !== before) { if (v < before) this.repBadDay = this.day || 0; note(v - before); }
      }
    });
    return s;
  };
  // 惡名遠洋：一開始 −85（建角色的時候、舊存檔第一次）
  const eming = s => { if (s && s.__rep && hasIn(s, 'eming') && !s.repEm) { s.__repRaw = -85; s.repEm = 1; } };
  const wrap = name => { const f = R[name]; if (f) R[name] = (...a) => { const r = ensure(f(...a)); eming(r); return r; }; };
  wrap('loadSlot'); wrap('freshSave');
  const sv0 = R.save; if (sv0) R.save = (...a) => { ensure(R.S); eming(R.S); return sv0(...a); };
  ensure(R.S);
  R.repEnsure = ensure;
  R.repAdd = d => { const s = S(); if (s) { ensure(s); s.rep = (s.rep || 0) + d; } };
  const tas0 = R.traitApplyStart; if (tas0) R.traitApplyStart = (...a) => { const r = tas0(...a); try { ensure(S()); eming(S()); } catch (e) { } return r; };
  // ---------- 效果 ----------
  const FB = { 100: 20, 75: 15, 50: 10, 25: 5, 0: 0, '-25': -5, '-50': -10, '-75': -15, '-100': -20 };
  const PRICE = { 100: -0.15, 75: -0.1, 50: -0.05, '-50': 0.05, '-75': 0.1, '-100': 0.15 };
  const KIRI = { 100: 0.1, 75: 0.05, 50: 0.05, '-50': -0.05, '-75': -0.1, '-100': -0.15 };
  const SAVE = { 100: 0.25, 75: 0.1, 50: 0.05 };
  const ROB = { '-50': 0.05, '-75': 0.1, '-100': 0.15 };
  const tk = () => R.repTier();
  R.repFb = () => FB[tk()] || 0;
  R.repKiri = () => KIRI[tk()] || 0;
  R.repRob = () => (W().town && !W().run ? ROB[tk()] || 0 : 0);
  R.repJobMul = () => (tk() >= 50 ? 1.1 : 1);
  R.repScamK = () => (tk() <= -50 ? 0.75 : 1);
  const priceK = () => { const p = PRICE[tk()] || 0; if (p < 0 && S() && S().traits && S().traits.momoPerm) return 1; return 1 + p; };   // 默默無名（永久）：沒有折扣
  const pm0 = R.priceMul;
  R.priceMul = shop => { const m = pm0 ? pm0(shop) : 1; if (m == null) return m; if (tk() <= -75 && (shop === 'market' || shop === 'pharmacy')) return null; return m * priceK(); };
  const sm0 = R.spendMul;
  if (sm0) R.spendMul = kind => sm0(kind) * priceK();
  // 偷東西被看到（100：75% 被原諒；props.js 的 caught 呼叫）
  R.repForgive = name => {
    const s = S(); if (tk() < 100 || s.repForgiveDay === s.day) return false;
    s.repForgiveDay = s.day; if (rnd() >= 0.75) return false;   // 每天只有第一次被看到才擲
    s.rep = (s.rep || 0) - 5;
    R.townTalk && R.townTalk(name || '路人', ['「……啊，是你。」', '（對方認出了你，嘆了一口氣，把東西拿回去，沒有叫衛兵。）', '「這次就當我沒看到。別再這樣了。」']);
    return true;
  };
  // 偷東西比較容易被看到（≤−50 +10%：traitlife.js 的 R.crimeK 再乘）
  try {
    const d = Object.getOwnPropertyDescriptor(R, 'crimeK');
    if (d && d.get) Object.defineProperty(R, 'crimeK', { configurable: true, get: () => { const ck = d.get(); return ck && tk() <= -50 ? Object.assign({}, ck, { seen: (ck.seen || 1) * 1.1 }) : ck; } });
  } catch (e) { console.warn('[repute]', e); }
  // 通緝一星的小罪：≥50 只口頭警告
  let warned = false;
  const ap0 = R.arrestPunish;
  if (ap0) R.arrestPunish = (heat, ...a) => {
    if (tk() >= 50 && (heat || 1) <= 1) {
      const s = S(); s.rep = (s.rep || 0) - 3; warned = true;
      R.townTalk && R.townTalk('東鶴的衛兵', ['「站住。……是你啊。」', '「大家都說你是個正派的勇者，這次就口頭警告。」', '（沒有罰錢，也沒有記前科。）']);
      return;
    }
    return ap0(heat, ...a);
  };
  const oa0 = R.onArrest;
  if (oa0) R.onArrest = (...a) => { if (warned) { warned = false; return; } return oa0(...a); };
  // ---------- 遺跡裡倒下：被路過的勇者救起來 ----------
  const pd0 = R.onPlayerDown;
  R.onPlayerDown = (...a) => {
    try {
      const w = W(), run = w.run, P = w.P, ch = SAVE[tk()] || 0;
      if (ch && run && !run.done && !w.town && P && !(R.net && R.net.room) && rnd() < ch) {
        P.dead = false; P.hp = Math.max(1, Math.round(P.hpMax * 0.3)); P.iframe = 3;
        const go = () => {
          const F = W().F; if (!F) return;
          const C = F.camp, up = F.up || (F.rooms && F.rooms[0] && { x: F.rooms[0].x, z: F.rooms[0].z });
          const at = C ? R.nearestFloor(C.x, C.z + 1.6) : up && R.nearestFloor ? R.nearestFloor(up.x, up.z - 3) : null;
          if (at) { [P.x, P.z] = at; P.y = 0; }
          if (P.h && R.setDown) R.setDown(P.h, false);
          (W().allies || []).forEach((al, i) => { if (!al.downed && at && R.nearestFloor) { [al.x, al.z] = R.nearestFloor(at[0] + (i % 2 ? 1.6 : -1.6), at[1] - 0.8); if (al.h && al.h.g) al.h.g.position.set(al.x, 0, al.z); } });
          if (R.placeCam) R.placeCam(null);
          R.S.stats = R.S.stats || {}; R.S.stats.rescued = (R.S.stats.rescued || 0) + 1;
          R.banner && R.banner('被路過的勇者救了', pick(['「喂，醒醒！……還好你運氣好，我們剛好經過。」', '「這不是那個有名的勇者嗎？快扶起來。」', '「撐著點，我們把你抬到營火那邊。」']) + '（生命 30%）');
        };
        if (R.fade) R.fade(go); else go();
        return;
      }
    } catch (e) { console.warn('[repute]', e); }
    return pd0(...a);
  };
  // ---------- 其他的來源 ----------
  const otp0 = R.onTaskPosted;
  R.onTaskPosted = t => {
    const r = otp0 ? otp0(t) : undefined;
    try { if (t && S()) { const fb = t.s && t.s[4]; if (t.failed) R.repAdd(-2); else if (fb >= 100) R.repAdd(3); else if (fb >= 80) R.repAdd(2); } } catch (e) { console.warn('[repute]', e); }
    return r;
  };
  const hd0 = R.hiddenDone;
  if (hd0) R.hiddenDone = (...a) => { const r = hd0(...a); try { if (r) R.repAdd(5); } catch (e) { } return r; };
  const ke0 = R.killEnemy;
  if (ke0) R.killEnemy = (e, by) => {
    const was = e && !e.dead, r = ke0(e, by);
    try { if (was && e.dead && e.def && e.def.human && !e.def.phantom && !e.innocent && !by && !e.fake && !e.petHit && W().run) R.repAdd(1); } catch (err) { }
    return r;
  };
  // 神社：一枚白條，或奉納 100 費拉（一天一次信譽值 +1）
  const sp0 = R.shrinePray;
  if (sp0) R.shrinePray = () => {
    const s = S(); if (!s || !R.sheet) return sp0();
    const ok = s.gold >= 100 && s.repShrine !== s.day;
    R.sheet('<p class="kicker">東鶴神社</p><h2>參拜</h2><p class="note">投一枚白條就好，也可以奉納 100 費拉給神社（一天一次，街坊會知道：信譽值 +1）。</p>',
      '<div class="row"><button type="button" class="btn" id="rp-pray">投一枚白條（1 費拉）</button><button type="button" class="btn pri" id="rp-give"' + (ok ? '' : ' disabled') + '>奉納 100 費拉' + (s.repShrine === s.day ? '（今天奉納過了）' : '') + '</button><button type="button" class="btn" id="rp-x">算了</button></div>');
    $('rp-x').onclick = () => R.closeSheet();
    $('rp-pray').onclick = () => { R.closeSheet(); sp0(); };
    $('rp-give').onclick = () => { if (s.gold < 100 || s.repShrine === s.day) return; s.gold -= 100; s.repShrine = s.day; R.closeSheet(); R.repAdd(1); R.townTalk && R.townTalk('東鶴神社', ['把紙包放進奉納箱，深深鞠了一躬。', '掃地的神職人員朝你點了點頭。']); R.save && R.save(); };
  };
  // 每天：負的時候一整天沒做壞事 +1；100 的時候公會每 7 天送謝禮
  const nd0 = R.onNewDay;
  R.onNewDay = (...a) => {
    const r = nd0 ? nd0(...a) : undefined;
    try {
      const s = S(); if (!s) return r; ensure(s);
      if (get() < 0 && (s.repBadDay == null || s.repBadDay < s.day - 1) && !(R.crime && R.crime.heat > 0)) s.rep = get() + 1;
      if (tk() >= 100 && (s.day || 0) - (s.repGift == null ? -99 : s.repGift) >= 7) {
        s.repGift = s.day || 0; s.potions = s.potions || {};
        if (!R.bagCanAdd || R.bagCanAdd('pot:hp', 2)) s.potions.hp = (s.potions.hp || 0) + 2; else if (R.stackAdd) R.stackAdd('pot:hp', 'stash', 2);
        setTimeout(() => R.toast && R.toast('公會送來謝禮：回復藥 ×2（「一直以來辛苦了」）。', '#FFE08A'), 2600);
      }
    } catch (e) { console.warn('[repute]', e); }
    return r;
  };
  // ---------- 城裡的人 ----------
  // 今天哪座遺跡的佩特拉反應：說出口就定下來（記在 R.S.repIntel），今天去那座遺跡就是那個反應
  const reactionIntel = s => {
    let it = s.repIntel;
    if (!it || it.day !== s.day) {
      const sites = (R.SITES || []).filter(x => x.kind === 'ruin' && !/^sp-/.test(x.id) && R.gradeById && R.gradeById(x.grade)); if (!sites.length || !R.REACTIONS) return null;
      const site = pick(sites), g = R.gradeById(site.grade), ks = Object.keys(R.REACTIONS).filter(k => !(g.crystal === 'none' && k === 'tail'));
      it = s.repIntel = { day: s.day, site: site.id, r: pick(ks) };
    }
    const site = R.SITES.find(x => x.id === it.site), rx = R.REACTIONS[it.r];
    return site && rx ? '「我朋友是公會的調查員，說今天「' + site.name + '」的佩特拉是「' + rx.name + '」。要去的話小心一點。」' : null;
  };
  const sr0 = R.startRun;
  if (sr0) R.startRun = (...a) => {
    const r = sr0(...a);
    try { const s = S(), run = W().run, it = s && s.repIntel; if (run && it && it.day === s.day && run.site && run.site.id === it.site && !run.coop && R.REACTIONS[it.r]) { run.reaction = it.r; run.reactionKnown = true; } } catch (e) { console.warn('[repute]', e); }
    return r;
  };
  const intel = () => {
    const s = S(), L = [];
    try { const ri = reactionIntel(s); if (ri) L.push(ri, ri); } catch (e) { }
    try {
      const E = R.eventsOf && R.dateOf ? R.eventsOf(R.dateOf((s.day || 0) + 1)) : {};
      if (E.market) L.push('「明天是凝日喔，市集的攤子打八折。要買東西明天再買。」');
      if (E.blizzard) L.push('「我表哥在驛站，說明天會有暴風雪，北邊的山口要封了。」');
      else if (E.weather) L.push('「聽漁會的人說，明天大概是' + E.weather + '。」');
      if (E.manaTide) L.push('「公會的人在說，明天遺跡裡的魔力很亂，寶箱會比較好，遺跡生物也比較兇。」');
    } catch (e) { }
    (s.blackMarket || []).forEach(x => { try { L.push('「後巷的黑市' + (x.from > (s.day || 0) ? '過兩天會賣' : '最近在賣') + '「' + R.itemName(x.it) + '」，好像是從遺跡裡撿回來的。」'); } catch (e) { } });
    Object.values(R.PEOPLE || {}).forEach(p => { if (p && p.hint) L.push('「跟你說一件事：' + p.hint + '」'); });
    (R.HIDDEN_QUESTS || []).forEach(q => { const m = s.hiddenQ || {}; if (q.hint && !m[q.id]) L.push('「最近有個傳聞……' + q.hint + '」'); });
    return L.length ? pick(L) : '「最近城裡都滿平靜的。多虧了你們這些勇者。」';
  };
  const ROLE = /(上班族|學生|店員|工人|老人家|主婦|路人)$/;
  const WARM = ['「啊，是你！前陣子謝謝你幫忙。」', '「大家都說你人很好。下遺跡要小心喔。」', '「你就是那個勇者吧？我女兒一直在說你的事。」'];
  const COLD = ['（對方看到你，皺了一下眉頭，沒有回話就走開了。）', '「……離我遠一點。」', '「你就是那個名聲很差的勇者？」（對方把包包抱緊了。）'];
  const tt0 = R.townTalk;
  if (tt0) R.townTalk = (who, lines, ...a) => {
    try {
      const t = tk();
      if (who === '路邊聊天的人' && t >= 100) lines = [intel(), '（他們認出了你，壓低聲音多說了幾句。）'];
      else if (typeof who === 'string' && ROLE.test(who) && Array.isArray(lines) && lines.length === 1 && !(R.crime && R.crime.heat > 0)) {
        if (t >= 75 && rnd() < 0.35) lines = [pick(WARM)];
        else if (t <= -50 && rnd() < 0.4) lines = [pick(COLD)];
      }
    } catch (e) { }
    return tt0(who, lines, ...a);
  };
  // 路人偶爾送東西（≥75）、左上角
  let giftT = 0, last = '';
  setInterval(() => {
    try {
      const s = S(), w = W(); if (!s) return; ensure(s); eming(s);
      if (!w.run && w.town && !w.inside && !w.paused && tk() >= 75 && ++giftT >= 240) {
        giftT = 0;
        if (rnd() < 0.35 && R.addGift) { const k = pick(['dango', 'dango', 'tea']); if (R.addGift(k, 1) !== false) R.toast && R.toast('路過的街坊認出你，塞了' + (k === 'tea' ? '一包熱茶葉' : '一串糰子') + '給你。', '#9AE0B0'); }
      }
      let el = $('r-rep');
      if (!el) { const tl = $('r-tl'); if (!tl) return; el = document.createElement('div'); el.id = 'r-rep'; el.className = 'glass r-misc'; el.style.cursor = 'pointer'; el.onclick = () => R.toast && R.toast('信譽值（−100～100）：幫街坊、好好完成委託會加；偷東西、被抓、委託失敗會扣。現在 ' + get() + '（' + R.repTierName() + '）：' + effLine() + '。', '#C8E0A8'); tl.appendChild(el); }
      const scr = $('run'); el.hidden = !(scr && !scr.hidden && !w.run); if (el.hidden) return;
      const t = T(), txt = '信譽 <b style="color:' + t[2] + '">' + get() + '</b>・' + t[1];
      if (txt !== last) { el.innerHTML = txt; last = txt; }
    } catch (e) { }
  }, 1000);
  const effLine = () => {
    const t = tk(), L = [], fb = FB[t] || 0, p = PRICE[t] || 0, k = KIRI[t] || 0;
    if (fb) L.push('委託的反饋 ' + (fb > 0 ? '+' : '') + fb);
    if (p) L.push('消費 ' + (p > 0 ? '+' : '−') + Math.round(Math.abs(p) * 100) + '%' + (p < 0 && priceK() === 1 ? '（默默無名：沒有折扣）' : ''));
    if (k) L.push('霧島撿回 ' + (k > 0 ? '+' : '−') + Math.round(Math.abs(k) * 100) + '%');
    if (SAVE[t]) L.push('倒下 ' + Math.round(SAVE[t] * 100) + '% 被路過的勇者救起來');
    if (t >= 100) L.push('每天第一次偷東西被看到 75% 被原諒、路人分享情報、公會每週謝禮');
    if (t >= 50) L.push('私人委託報酬 +10%、小罪口頭警告');
    if (ROB[t]) L.push('被搶 +' + Math.round(ROB[t] * 100) + '%');
    if (t <= -75) L.push('獲取量 −' + (t <= -100 ? 75 : 50) + '%、市集和藥鋪不賣你、公會不派救援委託');
    return L.join('、') || '沒有特別的效果';
  };
  R.repEffects = effLine;
  // 角色總數值
  const ch0 = R.charSheetHtml;
  if (ch0) R.charSheetHtml = (cls, opt) => { const h = ch0(cls, opt), t = T(); return h.replace('<h4>基本</h4>', '<h4>基本</h4><div class="cs-row"><span>信譽值</span><b style="color:' + t[2] + '">' + get() + '</b><small>' + t[1] + '：' + effLine() + '</small></div>'); };
})(window.R = window.R || {});
