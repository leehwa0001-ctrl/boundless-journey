// 術士重製：咒文編排（2026-10-13 作者：照《法術統整》重做術士——咒文要照書上的格式自己拼）
// 一、咒文＝活力項（1～4 文，元素；省略＝魔力法術）-聚合項（1～2 文：魔力量＋形狀）-定點項（1 文）-控制項（3 文：速度、軌跡、觸擊），
//    每一段後面可以接一文調適項（Gm 廣、Am 抑、Mm 穩、Pm 盤、Bm 變；意思看接在哪一段），調適項後面再接一文狀態項（ˊ）。
//    元素量 e＝主注釋＋副注釋；魔力量 m＝聚合項的 %×e（魔力法術照固定值）；Tsp＝e＋m；發射另外吃控制項第一文的 %Tsp。
//    消耗古克＝m＋發射耗（＋連頻 1200、制導）；MP＝古克 ÷10 ÷4。施法時間＝文數 ×0.08 秒。
//    m＜e 的 50%＝無法成形；50～75%＝25% 會消散（退一半 MP）；75～100%＝10%；≥100% 穩定；＞125% 偏純魔（元素效果機率 ×0.7）。
//    固化：Tsp ≥ 500 且 x＝(m − ACmps×SD)÷Cs − SD ≤ 0（Cs＝e÷活力文數×0.68、SD＝法術飛行秒數）→ 法術結束的地方留下 8 秒的固化物
//    （土金闇明暖＝石牆、焰＝熔岩、冰流＝冰刺、植生＝荊叢）：擋敵人和敵人的投射物，不擋你和隊友。
//    傷害＝(e×0.03＋m×0.012)×技能威力÷7；魔力法術＝m×0.04×1.3（無視元素、射程一半、消散快）。
// 二、元素反應保留：焰＝火、冰＝冰、明＝雷；同一隻敵人身上碰到就引爆（蒸發、碎冰、過載），法術撞上別種元素的固化物也會引爆。
// 三、咒式書（B 鍵、城裡選單、暫停選單）：最多 6 句咒，綁到 5 個技能格（沒綁的格子照舊用原本的技能）；即時算古克、MP、形狀、穩定度、固化。
// 四、X：按住＝臨場改寫（Q/W/E/R 選段、1～5 選文、再按同一段換另一排、←→ 換要改的咒；手機長按職業條＝圓盤）；點一下＝斷序（中斷正在詠唱的咒，退 70% MP）。
// 五、大招：下一句咒自動 PmPm（×3）且免費，之後 5 秒不能用帶 Ky、Pm 的咒。
// 六、轉職：元素師選一種主元素（那一元素當主注釋 −30% 消耗、活力項可多 1 文）；咒術師＝密影（闇的弱化更重）；外修者：第 1 句咒＝魔力罩（瞬發、只能純魔、腳下 1 公尺）。
//    武器：法杖＝控制項免費 Am 精確（+30%）、施法 +10% 時間；法球＝連放同一句咒每次 −5%（最多 −25%）；短杖＝施法 −25% 時間、傷害 −10%。
// 放在 archerdraw.js 後面（包 R.castSlot／R.useSkill／R.slotSkill 最外面）。
(function (R) {
  if (!R || !R.CORE || !R.CORE.mage || !R.coreKit) return;
  const W = () => R.W, S = () => R.S, $ = id => document.getElementById(id), esc = s => (R.esc ? R.esc(String(s == null ? '' : s)) : String(s));
  const CT = () => (R.coreTime ? R.coreTime() : performance.now() / 1000), rnd = Math.random;
  const isM = P => !!(P && P.cls === 'mage');
  // 2026-10-13 符卷師（諾克薩派）也用同一套咒文：符卷書（S.scrollbook）、在書桌寫成卷軸，戰鬥中撕開（scrollwrite.js）
  const isSc = P => !!(P && P.cls === 'scroll');
  const isMS = P => isM(P) || isSc(P);
  const scCls = () => !!(S() && S().cls === 'scroll');
  const live = () => { const w = W(); return !!(w && w.run && !w.run.done && w.P && !w.P.dead && !w.town); };
  const toast = (t, c) => R.toast && R.toast(t, c || '#C8B0FF');
  const say = (P, t, c) => R.num && R.num(P.x, 2.8, P.z, t, c || 'crit');
  // ---------- 字表 ----------
  const EL = {
    Ya: { n: '焰', m: 360, s: 50, c: '#FF6A2A', k: 'fire', so: 'lava', d: '火' }, Ga: { n: '金', m: 710, s: 120, c: '#E8C04A', so: 'wall', d: '金' },
    Ta: { n: '土', m: 145, s: 20, c: '#B8905A', so: 'wall', d: '土' }, La: { n: '流', m: 255, s: 35, c: '#5AB8FF', so: 'ice', d: '水' },
    Za: { n: '植', m: 285, s: 130, c: '#6AC85A', so: 'thicket', d: '木' }, Lo: { n: '明', m: 560, s: 100, c: '#FFE070', k: 'shock', so: 'wall', d: '光（雷）' },
    No: { n: '暖', m: 325, s: 70, c: '#BFF0E0', so: 'wall', d: '風' }, Ao: { n: '闇', m: 755, s: 430, c: '#9A6AD8', so: 'wall', d: '闇' },
    Bo: { n: '冰', m: 210, s: 60, c: '#9AD8FF', k: 'frost', so: 'ice', d: '凝（冰）' }, So: { n: '生', m: 180, s: 80, c: '#9AE8A0', so: 'thicket', d: '息' }
  };
  const ELA = ['Ya', 'Ga', 'Ta', 'La', 'Za'], ELO = ['Lo', 'No', 'Ao', 'Bo', 'So'];
  const MASTER = { Ya: '赤炎術士', Ga: '煉金術士', Ta: '大地術士', La: '碧源術士', Za: '叢根術士', Lo: '拓界術士', No: '踏雲術士', Ao: '密影術士', Bo: '空間術士', So: '喚息術士' };
  const AG = {
    Lk: { n: '微', p: 0.5, pure: 25, sh: 'drop' }, Fk: { n: '伏', p: 0.75, pure: 50, sh: 'wave' }, Yk: { n: '仰', p: 1, pure: 75, sh: 'rect' }, Zk: { n: '脹', p: 1.25, pure: 100, sh: 'disc' }, Pk: { n: '膨', p: 1.5, pure: 125, sh: 'shard' },
    Gf: { n: '聚', p: 1.75, pure: 150, sh: 'sphere' }, Uf: { n: '湧', p: 2, pure: 175, sh: 'line' }, Pf: { n: '噴', p: 2.25, pure: 200, sh: 'pillar' }, Zf: { n: '腫', p: 2.5, pure: 225, sh: 'block' }, Hf: { n: '海', p: 2.75, pure: 250, sh: 'tide' }
  };
  const AGK = ['Lk', 'Fk', 'Yk', 'Zk', 'Pk'], AGF = ['Gf', 'Uf', 'Pf', 'Zf', 'Hf'], AGALL = ['Lk', 'Fk', 'Yk', 'Zk', 'Pk', 'Gf', 'Uf', 'Pf', 'Zf', 'Hf'];
  const SH = {   // 形狀：幾發、每發倍率、半徑、穿透、速度倍率、散開
    drop: { n: '滴狀', c: 1, k: 1, rad: 0.22, pierce: 0 }, wave: { n: '波狀', c: 3, k: 0.5, rad: 0.3, pierce: 0, spread: 0.25 },
    rect: { n: '矩狀', c: 1, k: 1, rad: 0.55, pierce: 1 }, disc: { n: '圓狀', c: 1, k: 1.1, rad: 0.7, pierce: 1, sp: 0.85 },
    shard: { n: '不規則', c: 5, k: 0.3, rad: 0.2, pierce: 0, spread: 0.4, rand: 1 }, sphere: { n: '球狀', c: 1, k: 1, rad: 0.5, pierce: 0, boom: 2.2 },
    line: { n: '條狀', c: 1, k: 0.9, rad: 0.25, pierce: 99, life: 1.3 }, pillar: { n: '柱狀', c: 1, k: 1.1, rad: 0.4, pierce: 3 },
    block: { n: '塊狀', c: 1, k: 1.3, rad: 0.9, pierce: 1, sp: 0.7, kb: 2 }, tide: { n: '浪狀', c: 7, k: 0.28, rad: 0.35, pierce: 99, spread: 0.6 }
  };
  const PT = { Tr: '天（上方落下）', Fr: '飛（左前）', Sr: '升（正前）', Jr: '跳（右前）', Dr: '彈（地下竄出）', Se: '斜（前下・貼地）', De: '陡（前上・拋射）', Le: '立（自己身上）', Be: '撇（右側）', Pe: '趴（左側）' };
  const PTR = ['Tr', 'Fr', 'Sr', 'Jr', 'Dr'], PTE = ['Se', 'De', 'Le', 'Be', 'Pe'];
  const CTRL = {
    Xl: { n: '折', sp: '走', tr: '轉折', hit: '炸', l: 0.20, v: 12, ac: 2, acc: 1 }, Zl: { n: '轉', sp: '行', tr: '旋轉', hit: '穿', l: 0.12, v: 9, ac: 1, acc: 1 },
    Ol: { n: '歪', sp: '止', tr: '迴旋', hit: '散', l: 0.02, v: 0, ac: 0 }, Wl: { n: '彎', sp: '退', tr: '彎曲', hit: '纏', l: 0.12, v: 9, ac: 1, acc: -1 },
    Kl: { n: '起', sp: '爬', tr: '起伏', hit: '鑽', l: 0.20, v: 12, ac: 2, acc: -1 }, Ky: { n: '規', sp: '撞', tr: '自控', hit: '擊', l: 0.65, v: 30, ac: 15, acc: 1 },
    Zy: { n: '直', sp: '衝', tr: '筆直', hit: '返', l: 0.55, v: 26, ac: 12, acc: 1 }, Py: { n: '偏', sp: '跑', tr: '偏移', hit: '反彈', l: 0.45, v: 22, ac: 9, acc: 1 },
    Fy: { n: '方', sp: '闖', tr: '矩陣', hit: '震', l: 0.35, v: 18, ac: 6, acc: 1 }, Ey: { n: '移', sp: '背', tr: '跟隨', hit: '擴散', l: 0.45, v: 22, ac: 9, acc: -1 }
  };
  const CTL = ['Xl', 'Zl', 'Ol', 'Wl', 'Kl'], CTY = ['Ky', 'Zy', 'Py', 'Fy', 'Ey'];
  const ADJ = ['Gm', 'Am', 'Mm', 'Pm', 'Bm'];
  const ADJN = { v: ['增幅', '抑制', '穩定', '變換', '修正'], a: ['增加', '減少', '中和', '倍增', '倍除'], p: ['廣域', '拓展', '延伸', '周圍', '擴增'], c: ['粗略', '精確', '連頻', '制導', '隨機'], st: ['啟用', '暫存', '取消', '循環', '轉調'] };
  const adjName = (seg, g) => (ADJN[seg] || [])[ADJ.indexOf(g)] || '';
  const PTD = { Gm: [5.5, 0.1], Am: [4.5, 0.08], Mm: [3.5, 0.06], Pm: [2.5, 0.04], Bm: [1.5, 0.02] };
  const CLASS = {}; ELA.concat(ELO).forEach(g => { CLASS[g] = 'v'; }); ADJ.forEach(g => { CLASS[g] = 'm'; }); AGALL.forEach(g => { CLASS[g] = 'a'; }); PTR.concat(PTE).forEach(g => { CLASS[g] = 'p'; }); CTL.concat(CTY).forEach(g => { CLASS[g] = 'c'; });
  R.SPELL_GLYPHS = { EL, AG, PT, CTRL, ADJ, ADJN, SH, CLASS, MASTER };

  // ---------- 咒文 ↔ 結構 ----------
  const blank = () => ({ n: '新咒文', v: { g: [], adj: '', st: '', to: [] }, a: { g: ['Yk'], adj: '', cnt: 1, g2: [], st: '' }, p: { g: 'Sr', adj: '', st: '' }, c: { g: ['Zy', 'Zy', 'Zy'], adj: '', x: '', st: '' } });
  const stStr = st => (st === 'Dx' ? 'Mmˊ-Mmˊ-Mmˊ' : st ? st + 'ˊ' : '');
  const toCode = sp => {
    const out = [], v = sp.v, a = sp.a, p = sp.p, c = sp.c;
    if (v.g.length) { out.push(v.g.join('')); if (v.adj) { out.push(v.adj); if (v.adj === 'Pm' && v.to && v.to.length) out.push(v.to.join('')); if (v.st) out.push(stStr(v.st)); } }
    out.push(a.g.join('')); if (a.adj) { out.push((a.adj === 'Pm' || a.adj === 'Bm') ? a.adj.repeat(Math.max(1, a.cnt || 1)) : a.adj); if ((a.adj === 'Gm' || a.adj === 'Am') && a.g2 && a.g2.length) out.push(a.g2.join('')); if (a.st) out.push(stStr(a.st)); }
    out.push(p.g); if (p.adj) { out.push(p.adj); if (p.st) out.push(stStr(p.st)); }
    out.push(c.g.join('') + (c.adj === 'Mm' && c.x ? c.x : '')); if (c.adj) { out.push(c.adj); if (c.st) out.push(stStr(c.st)); }
    return out.join('-');
  };
  const glyphsOf = seg => { const out = [], re = /([A-Z][a-z])(ˊ|'|´|`)?/g; let m, used = 0; while ((m = re.exec(seg))) { if (m.index !== used) return null; out.push({ g: m[1], st: !!m[2] }); used = re.lastIndex; } return used === seg.length ? out : null; };
  // 讀咒文字串（給文字框、預設咒）；錯誤收在 errs
  const parse = (code, name) => {
    const sp = blank(); sp.n = name || '咒文'; sp.a.g = []; sp.p.g = ''; sp.c.g = []; const errs = [];
    const segs = String(code || '').replace(/\s+/g, '').split(/[-－—]/).filter(Boolean);
    let phase = 'v', last = null;   // last：上一個有調適項的段
    for (let si = 0; si < segs.length; si++) {
      const gl = glyphsOf(segs[si]); if (!gl || !gl.length) { errs.push('看不懂「' + segs[si] + '」'); continue; }
      if (gl.some(x => !CLASS[x.g])) { errs.push('沒有這個字：' + gl.filter(x => !CLASS[x.g]).map(x => x.g).join('、')); continue; }
      const cl = CLASS[gl[0].g];
      if (gl.some(x => CLASS[x.g] !== cl)) { errs.push('「' + segs[si] + '」混了不同的頻（每段只能放同一種）'); continue; }
      if (cl === 'm') {
        if (gl[0].st) {   // 狀態項
          if (!last || !last.adj) { errs.push('狀態項「ˊ」要接在調適項後面（「' + segs[si] + '」當成調適項）'); }
          else {
            let n = 1; while (si + n < segs.length && segs[si + n] === segs[si] && n < 3) n++;
            if (gl[0].g === 'Mm' && n >= 3) { last.st = 'Dx'; si += 2; } else last.st = gl[0].g;
            continue;
          }
        }
        const seg = phase === 'v' || phase === 'v2' ? sp.v : phase === 'a' || phase === 'a2' ? sp.a : phase === 'p' ? sp.p : phase === 'c' ? sp.c : null;
        if (!seg) { errs.push('調適項「' + segs[si] + '」前面沒有東西'); continue; }
        if (seg === sp.v && !sp.v.g.length) { errs.push('調適項放在活力項後面才有作用'); continue; }
        if (seg.adj) { errs.push('每段只能接一文調適項'); continue; }
        seg.adj = gl[0].g; if (seg === sp.a && (seg.adj === 'Pm' || seg.adj === 'Bm')) seg.cnt = gl.filter(x => x.g === seg.adj).length;
        last = seg; continue;
      }
      if (cl === 'v') {
        if (phase === 'v' && !sp.v.g.length) { sp.v.g = gl.map(x => x.g); continue; }
        if (sp.v.adj === 'Pm' && !(sp.v.to && sp.v.to.length) && sp.a.g.length === 0) { sp.v.to = gl.map(x => x.g); phase = 'v2'; continue; }
        errs.push('活力項只能有一段（變換 Pm 後面可以再接一段）'); continue;
      }
      if (cl === 'a') {
        if (!sp.a.g.length) { sp.a.g = gl.map(x => x.g).slice(0, 2); if (gl.length > 2) errs.push('聚合項最多 2 文'); phase = 'a'; last = null; continue; }
        if ((sp.a.adj === 'Gm' || sp.a.adj === 'Am') && !sp.a.g2.length) { sp.a.g2 = gl.map(x => x.g).slice(0, 2); phase = 'a2'; continue; }
        errs.push('聚合項多了一段'); continue;
      }
      if (cl === 'p') { if (sp.p.g) { errs.push('定點項只能一文'); continue; } sp.p.g = gl[0].g; if (gl.length > 1) errs.push('定點項只能一文'); phase = 'p'; last = null; continue; }
      if (cl === 'c') { if (sp.c.g.length) { errs.push('控制項只能一段'); continue; } sp.c.g = gl.slice(0, 3).map(x => x.g); if (gl.length > 3) sp.c.x = gl[3].g; if (gl.length < 3) errs.push('控制項要剛好三文（速度、軌跡、觸擊）'); phase = 'c'; last = null; continue; }
    }
    if (!sp.a.g.length) errs.push('少了聚合項（k、f 頻）');
    if (!sp.p.g) errs.push('少了定點項（r、e 頻）');
    if (sp.c.g.length !== 3) errs.push('少了控制項（l、y 頻三文）');
    if (sp.c.x && sp.c.adj !== 'Mm') { errs.push('第四文觸擊要接 Mm（連頻）'); sp.c.x = ''; }
    if (!sp.a.g.length) sp.a.g = ['Yk']; if (!sp.p.g) sp.p.g = 'Sr'; while (sp.c.g.length < 3) sp.c.g.push('Zy');
    sp.errs = errs; return sp;
  };
  const glyphCount = sp => { const c = toCode(sp); return (c.match(/[A-Z][a-z]/g) || []).length; };

  // ---------- 存檔 ----------
  const PRESETS = [
    ['火射線', 'YaLoNo-Yk-Sr-ZyZyZy'], ['屏障', 'BoLoSo-Zf-Le-FyFyFy'], ['爆炸', 'YaLoSoNo-Gf-Sr-XlXlXl'], ['水流', 'LaNo-Fk-Se-WlWlWl'],
    ['火彈', 'Ya-Gf-Sr-ZyZyXl'], ['冰槍', 'BoLa-Uf-Sr-ZyZyWl'], ['雷擊', 'LoNo-Fk-Tr-KyZyFy'], ['魔力飛彈', 'Fk-Sr-PyWlKy'], ['石牆', 'TaGa-Yk-Sr-OlOlOl']
  ];
  R.SPELL_PRESETS = PRESETS;
  // 原本的技能 → 對應的預設咒（舊存檔：這些格子自動換成咒；其他技能照舊）
  const OLD2SP = { fireball: '火彈', m_bolt: '魔力飛彈', m_lance: '冰槍', m_thunder: '雷擊', m_manashield: '屏障', m_flamewall: '火射線' };
  const NSLOT = 5, NSP = 6;
  const book = () => {
    const s = S(); if (!s) return null;
    const sc = s.cls === 'scroll', KEY = sc ? 'scrollbook' : 'spellbook';
    let b = s[KEY];
    if (sc && (!b || !Array.isArray(b.spells))) {   // 符卷書：預設咒；舊的卷軸技能格先不動（沒綁的格照舊放原本的技能）
      b = s[KEY] = { v: 1, spells: [], bind: Array(NSLOT).fill(null), mainEl: '' };
      ['火彈', '冰槍', '雷擊', '魔力飛彈', '石牆', '爆炸'].forEach(n => { const p = PRESETS.find(x => x[0] === n); b.spells.push({ n, code: p[1] }); });
    }
    if (!b || !Array.isArray(b.spells)) {
      b = s[KEY] = { v: 1, spells: [], bind: Array(NSLOT).fill(null), mainEl: '' };
      ['火射線', '屏障', '爆炸', '水流', '火彈', '雷擊'].forEach(n => { const p = PRESETS.find(x => x[0] === n); b.spells.push({ n, code: p[1] }); });
      // 綁定：舊存檔對得上的技能才換；新角色第 1～4 格全部換成咒
      const fresh = !s.classes || !s.classes.mage || (s.classes.mage.lv || s.lv || 1) <= 1;
      let lo = []; try { lo = R.loadoutOf ? R.loadoutOf('mage') : []; } catch (e) { lo = []; }
      for (let i = 0; i < NSLOT; i++) {
        const id = lo[i], want = OLD2SP[id];
        if (want) { let k = b.spells.findIndex(x => x.n === want); if (k < 0 && b.spells.length < NSP) { const p = PRESETS.find(x => x[0] === want); b.spells.push({ n: want, code: p[1] }); k = b.spells.length - 1; } if (k >= 0 && !b.bind.includes(k)) b.bind[i] = k; }
        else if (fresh && i < 4 && !b.bind.includes(i)) b.bind[i] = i;
      }
    }
    if (!Array.isArray(b.bind)) b.bind = Array(NSLOT).fill(null);
    while (b.bind.length < NSLOT) b.bind.push(null);
    b.spells = b.spells.slice(0, NSP);
    return b;
  };
  R.spellBook = book;
  const spellOf = k => { const b = book(); const x = b && b.spells[k]; return x ? parse(x.code, x.n) : null; };
  const mg0 = R.migrate; R.migrate = s => { s = mg0 ? mg0(s) : s; return s; };   // 咒式書在第一次用到時才建（看得到裝備的技能）

  // ---------- 計算 ----------
  const pwOf = P => (R.SKILL_KIT && R.SKILL_KIT.power && P && P.ws && P.ws.dmg ? R.SKILL_KIT.power(P.ws) : 30);
  const base = P => (P && P.item && P.item.base) || '';
  const advOf = P => (P && P.adv) || '';
  const ENV = { ruin: ['Ta', 'Ga'], forest: ['Za', 'So'], plain: ['No', 'Ta'], cave: ['La', 'Ta'], crystal: ['Lo', 'Bo'], lava: ['Ya', 'Ga'], snow: ['Bo', 'La'], volcano: ['Ya', 'Ga'], deep: ['La', 'Bo'], desert: ['Ta', 'No'] };
  const envEls = () => { const run = W() && W().run; return (run && (ENV[run.env] || ENV[run.biome])) || ELA.concat(ELO); };
  R.spellEnvEls = envEls;
  // ctx：{ P, roll（真的要放：Bm 隨機、轉調）, ult, inField }
  const evalSpell = (sp0, ctx) => {
    ctx = ctx || {}; const P = ctx.P || (W() && W().P) || { cls: 'mage', lv: 1 }, sp = JSON.parse(JSON.stringify(sp0)), errs = (sp0.errs || []).slice(), notes = [];
    const lim = 4 + (advOf(P) === 'elementalist' && book() && sp.v.g[0] && sp.v.g[0] === book().mainEl ? 1 : 0);
    if (sp.v.g.length > lim) errs.push('活力項最多 ' + lim + ' 文');
    // 狀態項
    const stOf = seg => seg.st;
    ['v', 'a', 'p', 'c'].forEach(k => { const seg = sp[k]; if (!seg.adj) return; const st = stOf(seg), rt = ctx.rt && ctx.rt[k];
      if (st === 'Mm') { seg.adj = ''; notes.push(adjNameSeg(k) + '調適項取消'); }
      else if (st === 'Am' && rt && rt.amSkip) { seg.adj = ''; notes.push('暫存：這次不帶調適項'); }
      else if (st === 'Bm' && ctx.roll) { const i = ADJ.indexOf(seg.adj), j = Math.max(0, Math.min(4, i + (rnd() < 0.5 ? -1 : 1))); seg.adj = ADJ[j]; notes.push('轉調：' + ADJ[i] + '→' + ADJ[j]); }
    });
    // 循環（Pmˊ）：沒有調適項的聚合項，借同一聚合項登記過的
    if (ctx.loop && !sp.a.adj && ctx.loop[sp.a.g.join('')]) { sp.a.adj = ctx.loop[sp.a.g.join('')].adj; sp.a.cnt = ctx.loop[sp.a.g.join('')].cnt || 1; notes.push('循環：自動帶上 ' + sp.a.adj); }
    if (ctx.ult) { sp.a.adj = 'Pm'; sp.a.cnt = 2; notes.push('大招：PmPm ×3、免費'); }
    // 共振（奏域）：聚合項往上一階
    if (ctx.field && ctx.field.has('gk')) { const i = AGALL.indexOf(sp.a.g[0]); if (i >= 0 && i < 9) { sp.a.g[0] = AGALL[i + 1]; notes.push('共振：聚合項 → ' + sp.a.g[0]); } }
    // 活力
    let els = sp.v.g.slice(), look = els.slice();
    if (sp.v.adj === 'Pm') { if (sp.v.to && sp.v.to.length) { els = sp.v.to.slice(); notes.push('變換：外形 ' + look.join('') + '，放出後變成 ' + els.join('')); } else errs.push('變換 Pm 後面要再接一段活力項'); }
    if (sp.v.adj === 'Bm' && els.length) { if (ctx.roll) { const e = envEls(), g = e[Math.floor(rnd() * e.length)]; notes.push('修正：' + els[0] + '→' + g); els[0] = g; } else notes.push('修正：主元素看遺跡環境隨機換'); }
    const pure = !els.length;
    let e = pure ? 0 : EL[els[0]].m + els.slice(1).reduce((t, g) => t + EL[g].s, 0);
    const e0 = e;
    if (sp.v.adj === 'Gm') e *= 2; else if (sp.v.adj === 'Am') e /= 2;
    // 聚合
    const amt = (g, ee) => { const A = AG[g]; return !A ? 0 : ee > 0 ? A.p * ee : A.pure; };
    let m = amt(sp.a.g[0], e);
    if (sp.a.adj === 'Gm') { if (sp.a.g2.length) m += amt(sp.a.g2[0], e); else errs.push('增加 Gm 後面要再接一段聚合項'); }
    else if (sp.a.adj === 'Am') { if (sp.a.g2.length) { const m2 = amt(sp.a.g2[0], e); m = m - m2 <= 0 ? m2 : m - m2; } else errs.push('減少 Am 後面要再接一段聚合項'); }
    else if (sp.a.adj === 'Mm') m = e || m;
    else if (sp.a.adj === 'Pm') m *= 1 + (sp.a.cnt || 1);
    else if (sp.a.adj === 'Bm') m /= 1 + (sp.a.cnt || 1);
    m = Math.round(m * 10) / 10;
    if (sp.v.adj === 'Mm' && !pure) e = m;
    const shG = sp.a.g.length > 1 ? sp.a.g[1] : sp.a.g[0], shape = (AG[shG] || AG.Yk).sh, Sh = SH[shape];
    const ratio = pure ? 9 : m / Math.max(1, e);
    let fizz = 0, stab = '穩定';
    if (!pure && ratio < 0.5 - 1e-6) { errs.push('魔力量不到元素量的 50%：法術無法成形'); stab = '無法成形'; }
    else if (!pure && ratio < 0.75 - 1e-6) { fizz = 0.25; stab = '極不穩（25% 消散）'; }
    else if (!pure && ratio < 1 - 1e-6) { fizz = 0.1; stab = '不穩（10% 消散）'; }
    else if (!pure && ratio > 1.25 + 1e-6) stab = '偏純魔（元素效果 ×0.7）';
    if (ctx.field && ctx.field.has('zp')) { fizz = 0; if (stab !== '無法成形') stab = '鎮頻：穩定'; }
    const Tsp = e + m;
    // 控制
    const cg = sp.c.g.slice(); let rand = false;
    if (sp.c.adj === 'Bm') { rand = true; if (ctx.roll) { cg[1] = CTL.concat(CTY)[Math.floor(rnd() * 10)]; cg[2] = CTL.concat(CTY)[Math.floor(rnd() * 10)]; } }
    const staffAm = base(P) === 'staff' && !sp.c.adj;
    const kC = sp.c.adj === 'Gm' ? 0.8 : sp.c.adj === 'Am' || staffAm ? 1.3 : 1;
    const C0 = CTRL[cg[0]] || CTRL.Zy;
    let launch = C0.l * Tsp * (sp.c.adj === 'Gm' ? 0.8 : sp.c.adj === 'Am' ? 1.3 : 1);
    let extra = 0; if (sp.c.adj === 'Mm') extra += 1200;
    // 定點
    const pd = PTD[sp.p.adj] || [0, 0];
    // 速度、射程
    const speed = C0.v * kC * (Sh.sp || 1), range = 14 * kC * (pure ? 0.5 : 1);
    let life = speed > 0 ? range / speed * (Sh.life || 1) : 4 * kC;
    if (cg[1] === 'Ey') life = 5 * kC; if (pure) life *= speed > 0 ? 1 : 0.5;
    if (sp.c.adj === 'Pm') extra += 550 * Math.min(2, life);
    const costGk = m + launch + extra;
    let mpK = 1; const notesK = [];
    if (advOf(P) === 'elementalist' && book() && els[0] && els[0] === book().mainEl) { mpK *= 0.7; notesK.push('主元素 −30%'); }
    if (ctx.field && ctx.field.has('zp')) { mpK *= 0.8; notesK.push('鎮頻 −20%'); }
    if (ctx.orbK) { mpK *= ctx.orbK; notesK.push('法球 −' + Math.round((1 - ctx.orbK) * 100) + '%'); }
    let mp = costGk / 40 * mpK; if (ctx.ult) mp = 0;
    mp = Math.round(mp * 10) / 10;
    // 施法時間
    const n = glyphCount(sp0);
    let cast = n * 0.08 + (sp.p.adj ? 0.1 : 0);
    if (ctx.rt && ctx.rt.armed) cast = Math.max(0.08, cast - 0.16);   // 啟用：之後不用再念那一文調適項
    if (base(P) === 'staff') cast *= 1.1; else if (base(P) === 'wand') cast *= 0.75;
    if (ctx.field && ctx.field.has('tx')) cast *= 0.6;
    const wx = advOf(P) === 'waixiu' && ctx.slotK === 0;
    if (wx) cast = 0;
    // 傷害
    const pw = ctx.pw || pwOf(P);
    let dmg = pure ? m * 0.04 * 1.3 : e * 0.03 + m * 0.012;
    dmg *= pw / 7 * (1 - pd[1]) * (base(P) === 'wand' ? 0.9 : 1);
    if (cg[1] === 'Fy') dmg *= 1;   // 矩陣：四發各 ×0.4（算在發射）
    // 固化
    const nG = Math.max(1, els.length), Cs = e / nG * 0.68, SD = life;
    const x = pure || Cs <= 0 ? 99 : (m - C0.ac * SD) / Cs - SD;
    const solid = !pure && Tsp >= 500 && x <= 0 && !errs.length;
    const main = els[0] || '', elk = (EL[main] || {}).k || null;
    const lockKP = cg.includes('Ky') || [sp.v, sp.a, sp.p, sp.c].some(s => s.adj === 'Pm');
    const cd = Math.max(0.6, 0.5 + Tsp / 500 + (sp.c.adj === 'Mm' ? 1.5 : 0)) * (wx ? 0.5 : 1);
    return { sp, code: toCode(sp0), errs, notes: notes.concat(notesK), pure, els, look, main, elk, e: Math.round(e * 10) / 10, e0, m, Tsp: Math.round(Tsp * 10) / 10, launch: Math.round(launch), extra: Math.round(extra), costGk: Math.round(costGk), mp, cast: Math.round(cast * 100) / 100, cd: Math.round(cd * 10) / 10,
      shape, Sh, ratio, fizz, stab, cg, rand, kC, speed, range, life, pd, dmg, x: Math.round(x * 100) / 100, solid, solidKind: solid ? EL[main].so : '', n, lockKP, pt: sp.p.g, wx };
  };
  const adjNameSeg = k => ({ v: '活力', a: '聚合', p: '定點', c: '控制' })[k] || '';
  R.spellEval = (code, ctx) => evalSpell(typeof code === 'string' ? parse(code) : code, ctx);
  R.spellParse = parse; R.spellCode = toCode;

  // ---------- 執行期 ----------
  const RT = { cast: null, bolts: [], solids: [], rw: {}, st: {}, loop: {}, last: null, lastSlot: 0, orb: { k: -1, n: 0 } };
  R.spellRT = RT;
  const TH = () => window.THREE;
  const scene = () => W() && W().scene;
  const geo = {}, mat = {};
  const meshFor = (kind, col) => {
    const t = TH(), sc = scene(); if (!t || !sc) return null;
    const key = kind + col;
    if (!geo[kind]) geo[kind] = kind === 'bolt' ? new t.SphereGeometry(1, 10, 8) : kind === 'wall' ? new t.BoxGeometry(1, 1.6, 0.6) : kind === 'ice' ? new t.ConeGeometry(0.45, 1.8, 6) : kind === 'thicket' ? new t.DodecahedronGeometry(0.75, 0) : new t.CircleGeometry(1.5, 24);
    if (!mat[key]) mat[key] = new t.MeshBasicMaterial({ color: col, transparent: true, opacity: kind === 'lava' ? 0.6 : kind === 'bolt' ? 0.92 : 0.85, side: t.DoubleSide, depthWrite: kind !== 'lava' });
    geo[kind].userData.shared = true; mat[key].userData.shared = true;
    const me = new t.Mesh(geo[kind], mat[key]); sc.add(me); return me;
  };
  const drop = me => { try { if (me && me.parent) me.parent.remove(me); } catch (e) { } };
  const clearAll = () => { RT.bolts.forEach(b => drop(b.mesh)); RT.solids.forEach(s => drop(s.mesh)); RT.bolts = []; RT.solids = []; RT.cast = null; };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const foes = () => (W().enemies || []).filter(e => !e.dead && !e.under);
  const nearest = (x, z, r, not) => { let best = null, bd = r; foes().forEach(e => { if (not && not.has && not.has(e)) return; const d = Math.hypot(e.x - x, e.z - z); if (d < bd) { bd = d; best = e; } }); return best; };
  const blocked = (x, z) => (R.pointBlocked && R.pointBlocked(x, z)) || (R.isFloor && W().F && !R.isFloor(x, z));
  const field = () => (R.souyuMage ? R.souyuMage() : null);
  const fieldAt = (x, z) => { const f = field(); return f && f.inside(x, z) ? f : null; };

  // 元素反應（跟 classcore.js 一樣的三種；法術撞上固化物也用這個）
  const REACT = { 'fire+frost': '蒸發', 'frost+shock': '碎冰', 'fire+shock': '過載' };
  const react = (x, z, a, b, P, tgt) => {
    const key = [a, b].sort().join('+'), name = REACT[key]; if (!name) return false;
    const k = (advOf(P) === 'elementalist' ? 1.5 : 1) * pwOf(P);
    R.num && R.num(x, 2.6, z, name, 'crit');
    if (key === 'fire+frost') { R.fx && R.fx('poof', x, 1, z, { color: '#F0F0F0', n: 18 }); if (tgt && !tgt.dead) R.coreHit(tgt, k * 1.6, {}); else R.coreAoe(x, z, 2, k * 1.4, {}); }
    else if (key === 'frost+shock') { R.fx && R.fx('ring', x, 0.1, z, { r: 2.5, color: '#BFE8FF' }); foes().forEach(e => { if (Math.hypot(e.x - x, e.z - z) < 2.5) e.st.stun = Math.max(e.st.stun || 0, 1.5); }); R.coreAoe(x, z, 2.5, k * 1.0, {}); }
    else { R.fx && R.fx('boom', x, 0.4, z, { r: 3.5, color: '#FFB45A' }); R.shake && R.shake(0.2); R.coreAoe(x, z, 3.5, k * 1.8, { kb: 2 }); }
    if (advOf(P) === 'hexer') foes().forEach(e => { if (Math.hypot(e.x - x, e.z - z) < 4) e.st.curse = Math.max(e.st.curse || 0, 4); });
    if (advOf(P) === 'shikigami' || advOf(P) === 'waixiu') P.mp = Math.min(P.mpMax, P.mp + 6);
    return true;
  };

  // ---------- 固化物 ----------
  const SOLID = { wall: { r: 0.8, block: 1, n: '石牆' }, ice: { r: 0.7, block: 1, n: '冰刺', el: 'frost' }, thicket: { r: 1.1, block: 1, n: '荊叢' }, lava: { r: 1.5, block: 0, n: '熔岩', el: 'fire' } };
  const addSolid = (kind, x, z, a, col, el, P, dmg, wide) => {
    const D = SOLID[kind] || SOLID.wall, pts = wide ? [-1, 0, 1] : [0];
    pts.forEach(o => {
      const sx = x + Math.cos(a) * o * 1.0, sz = z - Math.sin(a) * o * 1.0;
      if (R.isFloor && W().F && !R.isFloor(sx, sz)) return;
      const me = meshFor(kind === 'wall' ? 'wall' : kind, kind === 'lava' ? '#FF5A1A' : kind === 'ice' ? '#BFE8FF' : kind === 'thicket' ? '#4A8A3A' : col);
      if (me) { if (kind === 'lava') { me.rotation.x = -Math.PI / 2; me.position.set(sx, 0.07, sz); } else { me.position.set(sx, kind === 'ice' ? 0.9 : 0.8, sz); me.rotation.y = a; } }
      const s = { kind, x: sx, z: sz, r: D.r, block: D.block, t: 8, el: el || D.el || null, mesh: me, dmg: dmg * 0.25, tick: 0 };
      RT.solids.push(s);
      if (kind === 'ice') { foes().forEach(e => { if (Math.hypot(e.x - sx, e.z - sz) < 1.2 + e.def.size * 0.5) { R.hurtEnemy(e, dmg * 0.5, { spell: 1, vSk: 'spell' }); e.st.slow = Math.max(e.st.slow || 0, 2); } }); }
    });
    R.fx && R.fx('poof', x, 0.6, z, { color: col, n: 10 });
    say(P, '固化：' + D.n, 'heal');
  };
  const stepSolids = dt => {
    const w = W();
    for (const s of RT.solids) {
      s.t -= dt; if (s.mesh && s.mesh.material && s.t < 1) s.mesh.scale.setScalar(Math.max(0.05, s.t));
      if (s.block) {
        (w.shots || []).forEach(q => { if (!q.dead && q.owner !== 'p' && Math.hypot(q.x - s.x, q.z - s.z) < s.r + (q.rad || 0.2)) R.killShot(q); });
        foes().forEach(e => { const d = Math.hypot(e.x - s.x, e.z - s.z), need = s.r + e.def.size * 0.5; if (d < need && d > 1e-4) { const k = (need - d) / d; e.x += (e.x - s.x) * k; e.z += (e.z - s.z) * k; if (s.kind === 'thicket') e.st.slow = Math.max(e.st.slow || 0, 0.5); } });
      }
      if (s.kind === 'lava' || s.kind === 'thicket') { s.tick -= dt; if (s.tick <= 0) { s.tick = 0.5; foes().forEach(e => { if (Math.hypot(e.x - s.x, e.z - s.z) < s.r + e.def.size * 0.5 + 0.1) { R.hurtEnemy(e, s.dmg * 0.5, { spell: 1, vSk: 'spell', elem: s.kind === 'lava' ? 'fire' : null }); if (s.kind === 'thicket') e.st.root = Math.max(e.st.root || 0, 0.4); } }); } }
      if (s.t <= 0) { s.dead = true; drop(s.mesh); }
    }
    RT.solids = RT.solids.filter(s => !s.dead);
  };
  R.spellSolids = () => RT.solids;

  // ---------- 法術本體 ----------
  const statusOn = (e, r, P, dmg) => {
    const ch = r.ratio > 1.25 ? 0.7 : 1, g = r.main, o = {};
    if (!g) return o;
    if (rnd() < ch) {
      if (g === 'Ta') o.kb = 1; else if (g === 'No') o.kb = 1.5; else if (g === 'La') { e.st.slow = Math.max(e.st.slow || 0, 1.5); o.kb = 0.5; }
      else if (g === 'Za') o.root = 0.8; else if (g === 'Ao') { o.curse = advOf(P) === 'hexer' ? 6 : 4; if (advOf(P) === 'hexer') e._spWeak = CT() + 6; }
      else if (g === 'So') R.healP && R.healP(dmg * 0.03, true);
    }
    if (g === 'Ga') o.xPen = 0.3;
    return o;
  };
  const hitEnemy = (b, e, mul, extra) => {
    const P = W().P, r = b.r; if (!e || e.dead) return 0;
    let k = mul || 1; const hitG = b.hit;
    if (hitG === 'Ky' || b.hit2 === 'Ky' || (hitG === 'Ey' && !b.ended)) k *= 1.25;
    const st = statusOn(e, r, P, b.dmg * k);
    const o = Object.assign({ spell: 1, vSk: 'spell', elem: b.elk, spEl: b.elk, xPen: r.pure ? 0.3 : st.xPen }, st, extra || {});
    if (b.kb) o.kb = Math.max(o.kb || 0, b.kb);
    const hs = [hitG, b.hit2].filter(Boolean);
    if (hs.includes('Zl')) o.kb = Math.max(o.kb || 0, 2.5);
    if (hs.includes('Wl')) o.root = Math.max(o.root || 0, 1.6 * r.kC);
    if (hs.includes('Fy')) o.stun = Math.max(o.stun || 0, (e.def && e.def.boss ? 0.3 : 0.8) * r.kC);
    if (hs.includes('Ky')) o.stun = Math.max(o.stun || 0, 0.25);
    const d = R.hurtEnemy(e, b.dmg * k, o);
    RT.last = e;
    if (hs.includes('Kl') && !(extra && extra.dot)) { let n = 6; const tick = () => { if (e.dead || n-- <= 0 || !live()) return; R.hurtEnemy(e, b.dmg * 0.15, { spell: 1, vSk: 'spell', dot: 1 }); setTimeout(tick, 500); }; setTimeout(tick, 500); R.fx && R.fx('ring', e.x, 0.6, e.z, { r: 0.8, color: b.col }); }
    return d;
  };
  const explodeAt = (b, x, z, rad, k, skip) => { R.fx && R.fx('boom', x, 0.6, z, { r: rad, color: b.col }); foes().forEach(e => { if (e === skip) return; if (Math.hypot(e.x - x, e.z - z) < rad + e.def.size * 0.5) hitEnemy(b, e, k, { noHitFx: 1 }); }); };
  const scatter = (b, x, z) => { for (let i = 0; i < 4; i++) { const a = rnd() * Math.PI * 2; spawnBolt(Object.assign({}, b, { x, z, a, sp: 14, life: 0.35, dmg: b.dmg * 0.3, hit: 'Zy', hit2: '', tr: 'Zy', pierce: 0, hitSet: new Set(b.hitSet), solid: false, child: 1, rad: 0.18, boom: 0, mesh: null })); } };
  const endBolt = (b, why) => {
    if (b.ended) return; b.ended = true; b.dead = true; drop(b.mesh);
    if (b.child) return;
    const hs = [b.hit, b.hit2];
    if (b.boom) explodeAt(b, b.x, b.z, b.boom * b.r.kC, 0.7);
    if (why !== 'hit' && hs.includes('Ey') && !b.hitAny) explodeAt(b, b.x, b.z, 3 * b.r.kC, 0.6);
    if (why === 'wall' && hs.includes('Fy')) { R.fx && R.fx('ring', b.x, 0.1, b.z, { r: 2, color: b.col }); foes().forEach(e => { if (Math.hypot(e.x - b.x, e.z - b.z) < 2 + e.def.size * 0.5) e.st.stun = Math.max(e.st.stun || 0, 0.5); }); }
    if (why === 'wall' && hs.includes('Xl')) explodeAt(b, b.x, b.z, 1.8 * b.r.kC, 0.6);
    if (why === 'wall' && hs.includes('Ol')) scatter(b, b.x, b.z);
    if (b.solid && !b.solidDone) { b.solidDone = 1; RT.solidOnce = RT.solidOnce || new Set(); if (!RT.solidOnce.has(b.cid)) { RT.solidOnce.add(b.cid); addSolid(b.r.solidKind, b.x, b.z, b.a, b.col, b.elk, W().P, b.dmg, ['rect', 'line', 'tide', 'wave', 'block'].includes(b.r.shape)); } }
  };
  const spawnBolt = b => {
    b.hitSet = b.hitSet || new Set(); b.t = 0; b.y = b.y != null ? b.y : 1.1;
    if (!b.mesh && b.rad) { b.mesh = meshFor('bolt', b.col); if (b.mesh) { b.mesh.scale.setScalar(b.rad); b.mesh.position.set(b.x, b.y, b.z); } }
    RT.bolts.push(b); return b;
  };
  let CID = 0;
  // 放出一句咒（施法完成）
  const release = (P, r, slot) => {
    const sp = r.sp, a0 = P.aimA, col = r.pure ? '#C8B0FF' : (EL[r.look[0] || r.main] || {}).c || '#C8B0FF';
    const cid = ++CID, f = fieldAt(P.x, P.z);
    // 外修者：第 1 句咒＝魔力罩
    if (r.wx) {
      const v = Math.min(P.hpMax * 0.35, r.m * 0.004 * P.hpMax + 4);
      P.shield = (P.shield || 0) + v; R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 1.2, color: '#9AE8FF' });
      foes().forEach(e => { if (dist(e, P) < 1 + 1 + e.def.size * 0.5) R.hurtEnemy(e, r.dmg * 1.2, { spell: 1, vSk: 'spell', kb: 2 }); });
      say(P, '魔力罩', 'heal'); return;
    }
    // 屏障（立＋矩陣）：腳下張開一圈，擋下敵人的投射物
    if (sp.p.g === 'Le' && r.cg[1] === 'Fy') {
      const t = 3 + r.m / 400, rr = 2.4;
      const ring = { kind: 'barrier', x: P.x, z: P.z, r: rr, t, mesh: null, fol: 1 };
      if (TH() && scene()) { const T3 = TH(); ring.mesh = new T3.Mesh(new T3.RingGeometry(rr - 0.12, rr, 40), new T3.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.75, side: T3.DoubleSide })); ring.mesh.rotation.x = -Math.PI / 2; ring.mesh.position.set(P.x, 0.08, P.z); scene().add(ring.mesh); }
      RT.barrier && drop(RT.barrier.mesh); RT.barrier = ring;
      P.shield = (P.shield || 0) + Math.min(P.hpMax * 0.3, P.hpMax * 0.25 * r.m / 975);
      say(P, '屏障', 'heal'); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: rr, color: col }); return;
    }
    const sx = Math.sin(a0), sz = Math.cos(a0), lx = Math.sin(a0 + Math.PI / 2), lz = Math.cos(a0 + Math.PI / 2);
    const pd = r.pd[0] ? r.pd[0] + rnd() : 0;
    let ox = P.x + sx * (0.9 + pd), oz = P.z + sz * (0.9 + pd), y = 1.1;
    const pt = sp.p.g;
    if (pt === 'Fr' || pt === 'Pe') { ox += lx * 0.9 * (pt === 'Pe' ? 1.4 : 1); oz += lz * 0.9 * (pt === 'Pe' ? 1.4 : 1); if (pt === 'Pe') { ox -= sx * 0.9; oz -= sz * 0.9; } }
    if (pt === 'Jr' || pt === 'Be') { ox -= lx * 0.9 * (pt === 'Be' ? 1.4 : 1); oz -= lz * 0.9 * (pt === 'Be' ? 1.4 : 1); if (pt === 'Be') { ox -= sx * 0.9; oz -= sz * 0.9; } }
    if (pt === 'Le') { ox = P.x; oz = P.z; }
    if (pt === 'Se') y = 0.35; if (pt === 'De') y = 1.8;
    const Sh = r.Sh, shots = r.cg[1] === 'Fy' ? 4 : Sh.c, k0 = r.cg[1] === 'Fy' ? Sh.k * 0.4 * (Sh.c) : Sh.k;
    const one = (i, n) => {
      let a = a0;
      if (r.cg[1] === 'Fy') a = a0; else if (n > 1) a = a0 + (Sh.rand ? (rnd() - 0.5) * 2 * Sh.spread : (i - (n - 1) / 2) / ((n - 1) / 2) * Sh.spread);
      let x = ox, z = oz;
      if (r.cg[1] === 'Fy') { const gx = (i % 2) - 0.5, gz = Math.floor(i / 2) - 0.5; x += lx * gx * 0.9 + sx * gz * 0.9; z += lz * gx * 0.9 + sz * gz * 0.9; }
      if (blocked(x, z)) { x = P.x + sx * 0.4; z = P.z + sz * 0.4; }
      return spawnBolt({ cid, r, slot, x, z, y, a, a0: a, sp: r.speed, v0: r.speed, life: r.life, rad: Sh.rad * (r.cg[1] === 'Fy' ? 0.7 : 1), dmg: r.dmg * (r.cg[1] === 'Fy' ? k0 / 4 : k0), pierce: Sh.pierce + (r.cg[2] === 'Zl' || r.sp.c.x === 'Zl' ? 2 : 0) + (f && f.has('dp') ? 0 : 0),
        tr: r.cg[1], hit: r.cg[2], hit2: sp.c.adj === 'Mm' ? sp.c.x : '', col, elk: r.elk, kb: Sh.kb || 0, boom: Sh.boom || 0, solid: r.solid, acc: (CTRL[r.cg[0]] || {}).acc || 0,
        homeT: sp.c.adj === 'Pm' && RT.last && !RT.last.dead ? RT.last : null, field: f, turned: 0, dodges: 0, seed: rnd() * 2 - 1, orbA: a0 + i * Math.PI * 2 / n });
    };
    // 天、彈：直接在準心處落下／竄出
    if (pt === 'Tr' || pt === 'Dr') {
      const aim = R.SKILL_KIT && R.SKILL_KIT.aimIn ? R.SKILL_KIT.aimIn(P, r.range + r.pd[0]) : [ox, oz];
      const [x, z] = aim, rad = Math.max(1.2, Sh.rad * 2.6) * (Sh.c > 1 ? 1.4 : 1);
      R.fx && R.fx('mark', x, 0, z, { r: rad, t: pt === 'Tr' ? 0.45 : 0.25 });
      const b = { cid, r, x, z, a: a0, dmg: r.dmg * Sh.k * Math.min(2.2, Sh.c), hit: r.cg[2], hit2: sp.c.adj === 'Mm' ? sp.c.x : '', col, elk: r.elk, boom: Sh.boom || 0, solid: r.solid, hitSet: new Set(), child: 0 };
      setTimeout(() => {
        if (!live()) return; R.fx && R.fx(pt === 'Tr' ? 'pillar' : 'boom', x, pt === 'Tr' ? 0 : 0.2, z, { r: rad, color: col });
        foes().forEach(e => { if (Math.hypot(e.x - x, e.z - z) < rad + e.def.size * 0.5) { hitEnemy(b, e, 1, pt === 'Dr' ? { stun: 0.3 } : null); b.hitAny = 1; } });
        endBolt(b, b.hitAny ? 'hit' : 'life');
      }, pt === 'Tr' ? 450 : 250);
      return;
    }
    for (let i = 0; i < shots; i++) one(i, shots);
    R.sfx && R.sfx('magic'); P.h && (P.h.recoil = 1);
  };
  const stepBolts = dt => {
    const w = W(), P = w.P;
    for (const b of RT.bolts) {
      if (b.dead) continue;
      b.t += dt; b.life -= dt;
      const tr = b.tr, inF = b.field && b.field.inside(b.x, b.z);
      // 速度：加速／減速
      if (b.acc > 0) b.sp = Math.min(b.v0 * 1.6, b.sp + b.v0 * 0.8 * dt); else if (b.acc < 0) b.sp = Math.max(b.v0 * 0.4, b.sp - b.v0 * 0.5 * dt);
      // 軌跡
      let tgt = null;
      if (inF && b.field.has('dp')) tgt = nearest(b.x, b.z, 30, b.hitSet);   // 定頻：奏域裡必中
      else if (b.homeT && !b.homeT.dead) tgt = b.homeT;
      if (tgt) { const want = Math.atan2(tgt.x - b.x, tgt.z - b.z), d = Math.atan2(Math.sin(want - b.a), Math.cos(want - b.a)); b.a += Math.max(-10 * dt, Math.min(10 * dt, d)); }
      else if (tr === 'Xl') { if (!b.turned && b.t > Math.max(0.15, (b.t + b.life) * 0.35)) { b.turned = 1; const e = nearest(b.x, b.z, 12, b.hitSet); let sgn = 1; if (e) { const cr = Math.sin(b.a) * (e.z - b.z) - Math.cos(b.a) * (e.x - b.x); sgn = cr > 0 ? -1 : 1; } b.a += sgn * Math.PI / 2; } }
      else if (tr === 'Zl') b.a += (5 / (1 + b.t * 1.5)) * dt;
      else if (tr === 'Ol') { if (!b.turned && b.t > (b.t + b.life) * 0.5) { b.turned = 1; b.a += Math.PI; b.hitSet.clear(); } }
      else if (tr === 'Wl') { if (b.t < 0.4) b.a += b.seed * 3 * dt; else { const e = nearest(b.x, b.z, 16, b.hitSet); if (e) { const want = Math.atan2(e.x - b.x, e.z - b.z), d = Math.atan2(Math.sin(want - b.a), Math.cos(want - b.a)); b.a += Math.max(-6 * dt, Math.min(6 * dt, d)); } } }   // 彎：只追敵人，不會轉回來打自己
      else if (tr === 'Kl') { const ph = b.t < 0.3 ? 1 : b.t < 0.6 ? -1 : 0; b.a = b.a0 + ph * Math.PI / 4; }
      else if (tr === 'Ky') { if (P && P.aimX != null) { const want = Math.atan2(P.aimX - b.x, P.aimZ - b.z), d = Math.atan2(Math.sin(want - b.a), Math.cos(want - b.a)); b.a += Math.max(-9 * dt, Math.min(9 * dt, d)); } if (P) { P.mp = Math.max(0, P.mp - 1 * dt); if (P.mp <= 0) b.life = 0; } }   // 自控：每秒 40 古克＝1 MP
      // 移動
      let nx, nz;
      if (tr === 'Ey' && P) { b.orbA += 3 * dt; nx = P.x + Math.sin(b.orbA) * 1.6; nz = P.z + Math.cos(b.orbA) * 1.6; }
      else { const sp = b.sp; nx = b.x + Math.sin(b.a) * sp * dt; nz = b.z + Math.cos(b.a) * sp * dt; }
      if (blocked(nx, nz) && tr !== 'Ey' && !(inF && b.field.has('dp'))) {
        if (tr === 'Py' && b.dodges < 6) { b.dodges++; const tries = [Math.PI / 2, -Math.PI / 2, Math.PI]; for (const t of tries) { const a2 = b.a + t; if (!blocked(b.x + Math.sin(a2) * 0.4, b.z + Math.cos(a2) * 0.4)) { b.a = a2; break; } } continue; }
        if ((b.hit === 'Py' || b.hit2 === 'Py') && b.dodges < 4) { b.dodges++; b.a += Math.PI; continue; }
        endBolt(b, 'wall'); continue;
      }
      b.x = nx; b.z = nz;
      if (b.mesh) { b.mesh.position.set(b.x, b.y, b.z); }
      // 撞上固化物：不同元素就引爆
      if (b.elk && !b.child) for (const s of RT.solids) { if (s.dead || !s.el || s.el === b.elk || s.cid === b.cid) continue; if (Math.hypot(s.x - b.x, s.z - b.z) < s.r + b.rad + 0.2) { if (react(s.x, s.z, b.elk, s.el, P, null)) { s.dead = true; s.t = 0; drop(s.mesh); } } }
      // 打中
      const hitR = b.rad;
      for (const e of foes()) {
        if (b.hitSet.has(e)) continue;
        if (Math.hypot(e.x - b.x, e.z - b.z) >= hitR + e.def.size * 0.6) continue;
        b.hitSet.add(e); b.hitAny = 1;
        if (tr === 'Ey') { setTimeout(() => b.hitSet.delete(e), 500); }
        const d = hitEnemy(b, e, 1);
        const hs = [b.hit, b.hit2];
        if (hs.includes('Xl')) { explodeAt(b, b.x, b.z, 1.8 * b.r.kC, 0.6, e); endBolt(b, 'hit'); break; }
        if (hs.includes('Ol') && !b.child) { scatter(b, b.x, b.z); endBolt(b, 'hit'); break; }
        if (hs.includes('Py') && (b.bounce || 0) < 3) { b.bounce = (b.bounce || 0) + 1; const n = nearest(e.x, e.z, 7, b.hitSet); if (n) { b.a = Math.atan2(n.x - b.x, n.z - b.z); b.dmg *= 0.75; b.life = Math.max(b.life, 0.6); continue; } }
        if (hs.includes('Zy') && !b.ret && !b.child) { b.ret = 1; b.a = Math.atan2(P.x - b.x, P.z - b.z); b.hitSet.clear(); b.hitSet.add(e); b.life = Math.max(b.life, dist(b, P) / Math.max(4, b.sp) + 0.2); b.homeP = 1; continue; }
        if (tr === 'Ey') continue;
        if (b.pierce-- <= 0) { endBolt(b, 'hit'); break; }
      }
      if (b.dead) continue;
      if (b.homeP && P) { b.a = Math.atan2(P.x - b.x, P.z - b.z); if (dist(b, P) < 0.8) { endBolt(b, 'back'); continue; } }
      if (b.life <= 0) endBolt(b, 'life');
    }
    RT.bolts = RT.bolts.filter(b => !b.dead);
    // 屏障
    const br = RT.barrier;
    if (br) { br.t -= dt; if (P) { br.x = P.x; br.z = P.z; if (br.mesh) br.mesh.position.set(P.x, 0.08, P.z); } (w.shots || []).forEach(q => { if (!q.dead && q.owner !== 'p' && Math.hypot(q.x - br.x, q.z - br.z) < br.r + 0.3) R.killShot(q); }); if (br.t <= 0) { drop(br.mesh); RT.barrier = null; } }
  };

  // ---------- 施法 ----------
  const UNLOCK = i => (R.SKILL_UNLOCK || [1, 3, 6, 10, 15])[i] || 1;
  const cdGet = (P, i) => (i === 0 ? P.skillCd || 0 : (P.skCd && P.skCd[i]) || 0);
  const cdSet = (P, i, v) => { if (i === 0) P.skillCd = v; else { P.skCd = P.skCd || [0, 0, 0, 0, 0]; P.skCd[i] = v; } };
  const boundK = (P, i) => { if (!isMS(P)) return -1; const b = book(); if (!b) return -1; const k = b.bind[i]; return k != null && b.spells[k] ? k : -1; };
  const curSpell = k => RT.rw[k] ? JSON.parse(JSON.stringify(RT.rw[k])) : spellOf(k);
  const hasSt = (sp, st) => ['v', 'a', 'p', 'c'].some(s => sp[s].adj && sp[s].st === st);
  const ctxFor = (P, k, roll) => {
    const st = RT.st[k] || (RT.st[k] = { n: 0, amSkip: true, armed: false }), rt = { v: st, a: st, p: st, c: st, armed: st.armed };
    let orbK = 0; if (base(P) === 'orb') { const n = RT.orb.k === k ? Math.min(5, RT.orb.n + 1) : 0; orbK = 1 - 0.05 * n; }
    return { P, roll, ult: !!P._spUlt, field: fieldAt(P.x, P.z), rt, loop: RT.loop, slotK: k, orbK: orbK || 0 };
  };
  const danxu = (P, why) => {   // 斷序：中斷正在詠唱的咒，退 70% MP
    const c = RT.cast; if (!c) return false;
    RT.cast = null; P.mp = Math.min(P.mpMax, P.mp + c.mp * 0.7); cdSet(P, c.slot, Math.min(cdGet(P, c.slot), 0.4));
    say(P, '斷序', 'heal'); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 1.3, color: '#C8C0B0' }); if (why) toast(why, '#C8C0B0'); return true;
  };
  const castSpell = (P, slot, k) => {
    if (isSc(P)) return R.scrollTear ? R.scrollTear(P, slot, k) : undefined;
    if (RT.cast) { if (RT.cast.slot === slot) danxu(P, '斷序：退回 70% 魔力'); else toast('正在詠唱「' + RT.cast.r.sp.n + '」'); return; }
    if ((P.lv || 1) < UNLOCK(slot)) { toast('職業等級 ' + UNLOCK(slot) + ' 才會打開這一格'); return; }
    if (cdGet(P, slot) > 0 || P.dead || P.knockT > 0 || P.stance > 0) return;
    const sp = curSpell(k); if (!sp) return;
    const r = evalSpell(sp, ctxFor(P, k, true));
    if (r.errs.length) { toast('咒文有誤：' + r.errs[0], '#FF9A8A'); return; }
    if ((P._spNoKP || 0) > CT() && r.lockKP) { toast('大招之後 ' + Math.ceil(P._spNoKP - CT()) + ' 秒內不能用帶 Ky、Pm 的咒', '#FF9A8A'); return; }
    if (P.mp < r.mp) { toast('魔力不夠（要 ' + r.mp + '）'); return; }
    P.mp -= r.mp; cdSet(P, slot, r.cd * (P.skillCdMult || 1));
    if (P._spUlt) { P._spUlt = false; P._spNoKP = CT() + 5; }
    const st = RT.st[k]; st.n++; if (hasSt(sp, 'Am')) st.amSkip = !st.amSkip; if (hasSt(sp, 'Gm')) st.armed = true;
    if (sp.a.adj && sp.a.st === 'Pm') RT.loop[sp.a.g.join('')] = { adj: sp.a.adj, cnt: sp.a.cnt };
    if (base(P) === 'orb') { RT.orb.n = RT.orb.k === k ? Math.min(5, RT.orb.n + 1) : 0; RT.orb.k = k; }
    if (r.elk) P._el = r.elk;
    RT.lastK = k; RT.lastSlot = slot;
    RT.cast = { slot, k, r, t: 0, dur: r.cast, mp: r.mp };
    if (R.sfx) R.sfx('skill');
    if (r.cast <= 0) finishCast(P);
  };
  const finishCast = P => {
    const c = RT.cast; RT.cast = null; if (!c) return;
    const r = c.r;
    if (hasSt(r.sp, 'Dx')) {   // 斷序咒：打斷附近敵人的出手，咒本身不放出去，退 70%
      foes().forEach(e => { if (dist(e, P) < 6 + e.def.size * 0.5) { e.st.stun = Math.max(e.st.stun || 0, e.def.boss ? 0.3 : 0.7); if (e.cd != null) e.cd = Math.max(e.cd, 0.8); } });
      P.mp = Math.min(P.mpMax, P.mp + c.mp * 0.7); say(P, '斷序咒', 'crit'); R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 6, color: '#C8C0B0' }); return;
    }
    if (r.fizz && rnd() < r.fizz) { P.mp = Math.min(P.mpMax, P.mp + c.mp * 0.5); say(P, '法術消散', 'hurt'); R.fx && R.fx('poof', P.x, 1.2, P.z, { color: '#8A8096', n: 10 }); return; }
    release(P, r, c.slot);
  };
  R.spellCast = (slot) => { const P = W().P, k = boundK(P, slot); if (k >= 0) castSpell(P, slot, k); };
  R.spellDanxu = () => { const P = W().P; return P ? danxu(P) : false; };

  // ---------- 包外面 ----------
  const cs0 = R.castSlot, us0 = R.useSkill, ss0 = R.slotSkill;
  const mine = (P, i) => isMS(P) && live() && boundK(P, i) >= 0;
  R.castSlot = i => { const P = W() && W().P; if (mine(P, i | 0)) return castSpell(P, i | 0, boundK(P, i | 0)); return cs0 ? cs0(i) : undefined; };
  R.useSkill = (...a) => { const P = W() && W().P; if (mine(P, 0)) return castSpell(P, 0, boundK(P, 0)); return us0 ? us0(...a) : undefined; };
  const skCache = {};
  R.slotSkill = (P, i) => {
    const k = boundK(P, i); if (k < 0) return ss0 ? ss0(P, i) : null;
    if ((P.lv || 1) < UNLOCK(i)) return null;
    const id = 'sp_' + k, x = book().spells[k], code = RT.rw[k] ? toCode(RT.rw[k]) : x.code;
    if (!skCache[id] || skCache[id].code !== code || skCache[id].n !== x.n) {
      let r = null; try { r = evalSpell(RT.rw[k] || parse(x.code, x.n), { P }); } catch (e) { }
      skCache[id] = { code, n: x.n };
      R.SKILLS[id] = { name: x.n + (RT.rw[k] ? '＊' : ''), cls: 'mage', cd: r ? r.cd : 2, mp: r ? r.mp : 0, spell: 1, desc: '咒文 ' + code + (r ? '：' + r.costGk + ' 古克（' + r.mp + ' MP）、' + SH[r.shape].n + '、施法 ' + r.cast + ' 秒' : '') };
    }
    return id;
  };
  // 施法中：走路變慢；奏域、雜項
  const st0 = R.step;
  R.step = dt => {
    const r = st0(dt), w = W();
    try {
      if (w && !w.paused && w.run && w.P) {
        const P = w.P;
        if (RT.cast) { if (!isMS(P) || P.dead || !live()) RT.cast = null; else { RT.cast.t += dt; P.slowT = Math.max(P.slowT || 0, 0.1); if (RT.cast.t >= RT.cast.dur) finishCast(P); } }
        if (RT.bolts.length || RT.barrier) stepBolts(dt);
        if (RT.solids.length) stepSolids(dt);
      }
    } catch (e) { console.warn('[spellcraft]', e); }
    return r;
  };
  const lf0 = R.loadFloor; R.loadFloor = (...a) => { clearAll(); if (RT.barrier) { drop(RT.barrier.mesh); RT.barrier = null; } return lf0(...a); };
  const sr0 = R.startRun; if (sr0) R.startRun = (...a) => { RT.rw = {}; RT.st = {}; RT.loop = {}; RT.orb = { k: -1, n: 0 }; clearAll(); return sr0(...a); };

  // ---------- 職業核心：取代原本的「X 換元素」 ----------
  const C = R.CORE.mage, oh0 = C.onHit;
  const RE3 = ['fire', 'frost', 'shock'];
  C.name = '咒文'; C.col = '#B88AFF';
  C.onHit = function (e, d, o, P, killed) {
    if (o && o.spell) {
      if (!o.spEl || RE3.indexOf(o.spEl) < 0) return;
      const f = fieldAt(e.x, e.z);
      if (f && f.has('zd') && e._el) { const has = RE3.filter(x => x !== o.spEl && (e._el[x] || 0) > CT()); if (!has.length && (e._el[o.spEl] || 0) > CT()) { const other = RE3.find(x => x !== o.spEl); o = Object.assign({}, o, { elem: other }); } }
    }
    return oh0.call(this, e, d, o, P, killed);
  };
  C.mod = (e, raw, o, P) => ((e._spWeak || 0) > CT() && !(o && o.reflect) ? raw * 1.2 : raw);
  C.act = () => { };   // X 由下面的按住／點一下處理
  C.floor = P => { P._el = P._el || 'fire'; };
  C.help = P => '咒文編排：技能格綁上咒式書裡的咒（B 鍵、城裡選單、暫停選單打開咒式書）。咒文＝活力項（元素）-聚合項（魔力量與形狀）-定點項（從哪出現）-控制項（速度、軌跡、觸擊）；消耗＝古克 ÷40 MP，施法時間＝文數 ×0.08 秒。'
    + '魔力量不到元素量一半無法成形；剛好一半 25% 會消散（退一半 MP）。元素量＋魔力量 ≥500 古克而且固化值 x≤0，法術結束的地方會留下 8 秒的固化物（擋敵人與敵人的投射物，不擋自己人）。'
    + '焰＝火、冰＝冰、明＝雷：同一隻身上碰到不同的就引爆（蒸發、碎冰、過載），法術撞上別種元素的固化物也會引爆。X 按住＝臨場改寫（Q/W/E/R 選段、1～5 選文、再按同一段換另一排、←→ 換咒）；詠唱中點一下 X＝斷序（退 70% MP）。'
    + ({ elementalist: '元素師：選一種主元素（咒式書），那一元素當主注釋時消耗 −30%、活力項可多 1 文；反應 ×1.5。', hexer: '咒術師（密影）：闇的弱化更重——被弱化的敵人受到的傷害再 +20%（6 秒）；反應順便詛咒周圍。', waixiu: '外修者：咒式書第 1 句咒是魔力罩（瞬發、只能純魔、腳下 1 公尺：給護盾＋震開身邊的敵人）；反應回 6 魔力。', shikigami: '式神使：反應回 6 點魔力。' }[advOf(P)] || '')
    + ({ staff: '法杖：控制項沒寫調適項時免費 Am 精確（+30%），施法時間 +10%。', orb: '法球：連放同一句咒，每次 −5% 消耗（最多 −25%）。', wand: '短杖：施法時間 −25%、傷害 −10%。' }[base(P)] || '');
  C.gauge = P => {
    const c = RT.cast;
    if (c) return { name: '詠唱：' + c.r.sp.n, col: '#C8B0FF', v: c.t, max: Math.max(0.01, c.dur), text: c.r.costGk + ' 古克', sub: c.r.code, x: '斷序' };
    const k = RT.lastK != null ? RT.lastK : boundK(P, 0), sp = k >= 0 ? curSpell(k) : null;
    let r = null; try { r = sp ? evalSpell(sp, { P }) : null; } catch (e) { }
    const ul = P._spUlt ? '・下一句 PmPm 免費' : (P._spNoKP || 0) > CT() ? '・Ky/Pm 封鎖 ' + Math.ceil(P._spNoKP - CT()) + 's' : '';
    const el = P._el && { fire: '火', frost: '冰', shock: '雷' }[P._el];
    return { name: '咒文' + (sp ? '：' + sp.n + (RT.rw[k] ? '＊' : '') : ''), col: P._spUlt ? '#FFE08A' : '#B88AFF', text: r ? r.mp + ' MP・' + SH[r.shape].n : '打開咒式書（B）', sub: (r ? r.code : '') + ul + (el ? '・元素 ' + el : ''), x: '按住改寫' };
  };
  // 大招：下一句咒 PmPm（×3）免費，之後 5 秒不能用 Ky、Pm
  if (R.ULTS && R.ULTS.mage) Object.assign(R.ULTS.mage, { name: '三重盤咒', sub: '術士的大招：下一句咒自動疊上 PmPm（魔力量 ×3）、不耗魔', go: P => { P._spUlt = true; [0, 1, 2, 3, 4].forEach(i => cdSet(P, i, 0)); say(P, '三重盤咒', 'crit'); toast('下一句咒：PmPm（×3）免費！之後 5 秒不能用帶 Ky、Pm 的咒', '#FFE08A'); } });

  // ---------- 畫面：共用樣式（深色） ----------
  const css = document.createElement('style'); css.id = 'sp-css';
  css.textContent = ''
    + 'body:has(#sp-book:not([hidden])) #tu2-card,body:has(#sp-book:not([hidden])) #tu2-ring,body:has(#sp-book:not([hidden])) #tu2-arrow{display:none!important}#sp-book{position:fixed;inset:0;z-index:9990;background:rgba(6,4,10,.72);display:flex;align-items:center;justify-content:center}#sp-book[hidden]{display:none}'
    + '#sp-book .spb{width:min(1040px,calc(100vw - 16px));max-height:calc(100dvh - 16px);overflow:auto;background:linear-gradient(180deg,#1E1A26,#16131C);color:#E8E0D0;border:1px solid rgba(184,138,255,.45);border-top:3px solid #7A5AB8;border-radius:8px;box-shadow:0 10px 32px rgba(0,0,0,.6);padding:10px 12px;font-size:13px}'
    + '#sp-book h3{margin:0;font-size:16px;color:#E0CCFF}#sp-book .sp-h{display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px}#sp-book small{color:#A89CB8}'
    + '#sp-book .sp-cols{display:grid;grid-template-columns:240px 1fr;gap:10px}@media (max-width:760px){#sp-book .sp-cols{grid-template-columns:1fr}}'
    + '#sp-book .sp-list>div{background:#221D2B;border:1px solid #3E3550;border-radius:6px;padding:6px 8px;margin-bottom:5px;cursor:pointer}#sp-book .sp-list>div.on{border-color:#B88AFF;box-shadow:0 0 0 1px #B88AFF inset}#sp-book .sp-list b{color:#F0E6FF}#sp-book .sp-list code{display:block;color:#C8B8E0;font-size:11px;word-break:break-all}'
    + '#sp-book button,#sp-rw button{background:#2E2836;color:#E8E0D0;border:1px solid #5A5070;border-radius:4px;padding:4px 9px;font-size:12px;cursor:pointer;min-height:28px}#sp-book button.pri{background:#4A3478;border-color:#8A6AC8}#sp-book button:disabled{opacity:.4;cursor:default}'
    + '#sp-book select,#sp-book input{background:#15121B;color:#EDE6DA;border:1px solid #4A4058;border-radius:4px;padding:3px 5px;font-size:12px;min-height:26px}#sp-book input.code{width:100%;font-family:ui-monospace,monospace;font-size:13px}'
    + '#sp-book .sp-seg{background:#1A1622;border:1px solid #352D44;border-radius:6px;padding:6px 8px;margin:5px 0}#sp-book .sp-seg>b{display:inline-block;min-width:64px;color:#D8C8F0}#sp-book .sp-seg label{margin-right:6px;white-space:nowrap}#sp-book .sp-seg .hint{color:#8A8096;font-size:11px;display:block;margin-top:2px}'
    + '#sp-book .sp-out{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:4px 10px;background:#120F17;border:1px solid #352D44;border-radius:6px;padding:6px 8px;margin-top:6px}#sp-book .sp-out span{color:#A89CB8}#sp-book .sp-out b{color:#F0E6FF;font-variant-numeric:tabular-nums}'
    + '#sp-book .sp-err{color:#FF9A8A;margin-top:4px}#sp-book .sp-note{color:#9FC59A;margin-top:4px;font-size:12px}'
    + '#sp-book .sp-bind{display:flex;flex-wrap:wrap;gap:6px 12px;margin-top:8px;padding-top:8px;border-top:1px solid #352D44}'
    + '#sp-rw{position:fixed;left:50%;bottom:22%;transform:translateX(-50%);z-index:9980;width:min(520px,calc(100vw - 16px));background:rgba(22,18,30,.94);color:#E8E0D0;border:1px solid #8A6AC8;border-radius:8px;padding:8px 10px;font-size:12.5px;box-shadow:0 6px 22px rgba(0,0,0,.6)}#sp-rw[hidden]{display:none}'
    + '#sp-rw .rw-h{display:flex;justify-content:space-between;gap:6px}#sp-rw code{color:#E0CCFF;word-break:break-all}#sp-rw .rw-seg{display:flex;gap:4px;margin:6px 0}#sp-rw .rw-seg button.on{background:#4A3478;border-color:#B88AFF}'
    + '#sp-rw .rw-opt{display:flex;gap:4px;flex-wrap:wrap}#sp-rw kbd{background:#3A3240;border:1px solid #5A5060;border-radius:3px;padding:0 4px;font-size:11px;margin-right:3px}#sp-rw small{color:#A89CB8}'
    + 'body.touch #sp-rw .rw-opt{position:relative;height:190px;display:block}body.touch #sp-rw .rw-opt button{position:absolute;width:64px;height:44px;margin:-22px 0 0 -32px}';
  document.head.appendChild(css);

  // ---------- 臨場改寫（按住 X） ----------
  const SEGK = { q: 'v', w: 'a', e: 'p', r: 'c' }, SEGN = { v: '活力', a: '聚合', p: '定點', c: '控制（觸擊）' };
  const ROWS = { v: [ELA, ELO], a: [AGK, AGF], p: [PTR, PTE], c: [CTL, CTY] };
  const RW = { open: false, k: -1, seg: 'v', row: 0 };
  const boundList = P => { const b = book(); if (!b) return []; const out = []; b.bind.forEach((k, i) => { if (k != null && b.spells[k] && (P.lv || 1) >= UNLOCK(i) && out.indexOf(k) < 0) out.push(k); }); return out; };
  const gName = (seg, g) => seg === 'v' ? g + EL[g].n : seg === 'a' ? g + AG[g].n : seg === 'p' ? g + PT[g].slice(0, 1) : g + CTRL[g].hit;
  const rwApply = (g) => {
    const P = W().P, k = RW.k; if (k < 0) return; const sp = curSpell(k);
    if (RW.seg === 'v') { if (!sp.v.g.length) sp.v.g = [g]; else sp.v.g[0] = g; if (sp.v.g.indexOf(g, 1) > 0) sp.v.g.splice(sp.v.g.indexOf(g, 1), 1); }
    else if (RW.seg === 'a') sp.a.g[0] = g; else if (RW.seg === 'p') sp.p.g = g; else sp.c.g[2] = g;
    const r = evalSpell(sp, { P });
    if (r.errs.length) { toast('改不了：' + r.errs[0], '#FF9A8A'); return; }
    RT.rw[k] = sp; delete skCache['sp_' + k]; say(P, '改寫', 'heal'); rwRender();
  };
  const rwRender = () => {
    let el = $('sp-rw'); if (!el) { el = document.createElement('div'); el.id = 'sp-rw'; document.body.appendChild(el); el.addEventListener('pointerdown', ev => { const t = ev.target.closest && ev.target.closest('[data-rw]'); if (!t) return; ev.preventDefault(); ev.stopPropagation(); const a = t.dataset.rw, v = t.dataset.v; if (a === 'seg') rwSeg(v); else if (a === 'g') rwApply(v); else if (a === 'k') rwNext(+v); else if (a === 'reset') { delete RT.rw[RW.k]; delete skCache['sp_' + RW.k]; rwRender(); } else if (a === 'x') rwClose(); }); }
    if (!RW.open) { el.hidden = true; return; }
    const P = W().P, sp = curSpell(RW.k); if (!sp) { el.hidden = true; return; }
    const r = evalSpell(sp, { P }), opts = ROWS[RW.seg][RW.row], touch = !!R.touch;
    const pos = (i, n) => { const a = -Math.PI / 2 + i * Math.PI * 2 / n; return 'left:' + (50 + Math.cos(a) * 38) + '%;top:' + (50 + Math.sin(a) * 38) + '%'; };
    el.hidden = false;
    el.innerHTML = '<div class="rw-h"><b>臨場改寫：' + esc(sp.n) + (RT.rw[RW.k] ? '＊' : '') + '</b><span><button data-rw="k" data-v="-1">◀</button> <button data-rw="k" data-v="1">▶</button> <button data-rw="reset">還原</button>' + (touch ? ' <button data-rw="x">✕</button>' : '') + '</span></div>'
      + '<code>' + esc(r.code) + '</code><small>　' + r.costGk + ' 古克・' + r.mp + ' MP・' + esc(SH[r.shape].n) + '・' + esc(r.stab) + (r.solid ? '・會固化' : '') + '</small>'
      + '<div class="rw-seg">' + Object.keys(SEGK).map(key => '<button data-rw="seg" data-v="' + SEGK[key] + '" class="' + (RW.seg === SEGK[key] ? 'on' : '') + '">' + (touch ? '' : '<kbd>' + key.toUpperCase() + '</kbd>') + SEGN[SEGK[key]] + '</button>').join('') + '</div>'
      + '<div class="rw-opt">' + opts.map((g, i) => '<button data-rw="g" data-v="' + g + '" style="' + (touch ? pos(i, 5) : '') + '">' + (touch ? '' : '<kbd>' + (i + 1) + '</kbd>') + esc(gName(RW.seg, g)) + '</button>').join('') + '</div>'
      + '<small>' + (touch ? '點段落；再點同一段換另一排字。放開職業條或按 ✕ 收起。' : '再按同一段的鍵換另一排（第 ' + (RW.row + 1) + '／2 排）；←→ 換咒；放開 X 收起。改寫到回城為止。') + '</small>';
  };
  const rwSeg = s => { if (RW.seg === s) RW.row = 1 - RW.row; else { RW.seg = s; RW.row = 0; } rwRender(); };
  const rwNext = d => { const L = boundList(W().P); if (!L.length) return; const i = L.indexOf(RW.k); RW.k = L[(i + d + L.length) % L.length]; rwRender(); };
  const rwOpen = () => { const P = W().P; if (!isM(P) || !live()) return; const L = boundList(P); if (!L.length) { toast('技能格還沒綁咒（B 打開咒式書）'); return; } RW.open = true; RW.k = L.indexOf(RT.lastK) >= 0 ? RT.lastK : L[0]; rwRender(); };
  const rwClose = () => { RW.open = false; rwRender(); };
  R.spellRewrite = { open: rwOpen, close: rwClose, seg: rwSeg, pick: i => { const g = ROWS[RW.seg][RW.row][i]; if (g) rwApply(g); }, next: rwNext, state: RW };
  const typing = e => e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName);
  let xT = 0, xHold = null, xDown = false;
  const xPress = () => { const P = W().P; if (!isM(P) || !live() || xDown) return; xDown = true; xT = performance.now(); clearTimeout(xHold); xHold = setTimeout(() => { if (xDown) rwOpen(); }, 260); };
  const xRelease = () => {
    if (!xDown) return; xDown = false; clearTimeout(xHold);
    if (RW.open) { if (!R.touch) rwClose(); return; }
    if (performance.now() - xT < 260) { const P = W().P; if (P && !danxu(P)) toast('X：按住＝臨場改寫咒文；詠唱中點一下＝斷序（退 70% 魔力）', '#C8B0FF'); }
  };
  window.addEventListener('keydown', e => {
    if (typing(e)) return; const P = W() && W().P; if (!isM(P)) return; const k = (e.key || '').toLowerCase();
    if (k === 'b' && !e.repeat && !(R.sheetOpen && R.sheetOpen()) && !$('sp-book')?.offsetParent) { if (W().run || W().town) { e.preventDefault(); R.openSpellBook(); } return; }
    if (!live()) return;
    if (k === 'x') { if (!e.repeat) xPress(); return; }
    if (RW.open) {
      if (SEGK[k]) { rwSeg(SEGK[k]); e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (/^[1-5]$/.test(k)) { R.spellRewrite.pick(+k - 1); e.preventDefault(); e.stopImmediatePropagation(); return; }
      if (k === 'arrowleft' || k === 'arrowright') { rwNext(k === 'arrowleft' ? -1 : 1); e.preventDefault(); e.stopImmediatePropagation(); return; }
    }
  }, true);
  window.addEventListener('keyup', e => { const k = (e.key || '').toLowerCase(); if (k === 'x') xRelease(); }, true);
  // 手機：長按職業條＝圓盤；點一下＝斷序
  document.addEventListener('pointerdown', e => { const P = W().P; if (!isM(P) || !live() || !e.target || !e.target.closest || !e.target.closest('#core-g')) return; e.preventDefault(); if (RW.open) { rwClose(); return; } xPress(); }, true);
  document.addEventListener('pointerup', e => { if (xDown) xRelease(); }, true);
  document.addEventListener('pointercancel', () => { if (xDown) xRelease(); }, true);

  // ---------- 咒式書 ----------
  const BK = { i: 0, paused: false };
  const opt = (v, t, cur) => '<option value="' + esc(v) + '"' + (String(v) === String(cur) ? ' selected' : '') + '>' + esc(t) + '</option>';
  const adjSel = (seg, cur, f) => '<label>調適 <select data-f="' + f + '">' + opt('', '（無）', cur) + ADJ.map(g => opt(g, g + ' ' + adjName(seg, g), cur)).join('') + '</select></label>';
  const stSel = (cur, f, on) => '<label>狀態 <select data-f="' + f + '"' + (on ? '' : ' disabled') + '>' + opt('', '（無）', cur) + ADJ.map(g => opt(g, g + 'ˊ ' + ADJN.st[ADJ.indexOf(g)], cur)).join('') + opt('Dx', 'Mmˊ×3 斷序', cur) + '</select></label>';
  const elOpts = (cur, none) => opt('', none, cur) + ELA.concat(ELO).map(g => opt(g, g + ' ' + EL[g].n + '（' + EL[g].d + '）', cur)).join('');
  const agOpts = (cur, none) => (none ? opt('', none, cur) : '') + AGALL.map(g => opt(g, g + ' ' + AG[g].n + '（' + Math.round(AG[g].p * 100) + '%・' + SH[AG[g].sh].n + '）', cur)).join('');
  const ptOpts = cur => PTR.concat(PTE).map(g => opt(g, g + ' ' + PT[g], cur)).join('');
  const ctOpts = (cur, which, none) => (none ? opt('', none, cur) : '') + CTL.concat(CTY).map(g => opt(g, g + ' ' + CTRL[g][which], cur)).join('');
  const shapeTip = { drop: '一發細的', wave: '三發扇形', rect: '寬一點、穿 1 隻', disc: '圓盤、穿 1 隻、慢一點', shard: '五發亂射', sphere: '撞到炸開', line: '細長、穿透全部', pillar: '穿 3 隻', block: '又大又重、擊退', tide: '七發大扇形、穿透' };
  const editor = (P, b, i) => {
    const x = b.spells[i]; if (!x) return '<p>咒式書是空的，按「新增」或「放預設咒」。</p>';
    const sp = parse(x.code, x.n), r = evalSpell(sp, { P, field: null }), v = sp.v, a = sp.a, p = sp.p, c = sp.c;
    const vg = i2 => v.g[i2] || '';
    const segV = '<div class="sp-seg"><b>活力項</b>'
      + [0, 1, 2, 3].map(j => '<select data-f="v' + j + '">' + elOpts(vg(j), j === 0 ? '（無＝魔力法術）' : '（空）') + '</select>').join(' ')
      + (advOf(P) === 'elementalist' && b.mainEl && v.g[0] === b.mainEl ? ' <select data-f="v4">' + elOpts(vg(4), '（空）') + '</select>' : '')
      + '<br>' + adjSel('v', v.adj, 'vadj') + (v.adj === 'Pm' ? '<label>變換成 <input data-f="vto" value="' + esc((v.to || []).join('')) + '" size="10" placeholder="例 YaTaNo"></label>' : '') + stSel(v.st, 'vst', !!v.adj)
      + '<span class="hint">第一文是主注釋（元素量大），後面是副注釋（加一點）。不放元素＝魔力法術：傷害 ×1.3、射程一半、消散快。</span></div>';
    const segA = '<div class="sp-seg"><b>聚合項</b><label>魔力量 <select data-f="a0">' + agOpts(a.g[0]) + '</select></label><label>形狀 <select data-f="a1">' + agOpts(a.g[1] || '', '（同一文）') + '</select></label><br>'
      + adjSel('a', a.adj, 'aadj') + ((a.adj === 'Gm' || a.adj === 'Am') ? '<label>' + (a.adj === 'Gm' ? '＋' : '－') + ' <select data-f="a2">' + agOpts(a.g2[0] || 'Lk') + '</select></label>' : '') + ((a.adj === 'Pm' || a.adj === 'Bm') ? '<label>疊 <select data-f="acnt">' + [1, 2, 3].map(n => opt(n, n + ' 文', a.cnt)).join('') + '</select></label>' : '') + stSel(a.st, 'ast', !!a.adj)
      + '<span class="hint">形狀：' + esc(SH[r.shape].n + '＝' + shapeTip[r.shape]) + '。前一文定魔力量、後一文定形狀（雙文操作）。</span></div>';
    const segP = '<div class="sp-seg"><b>定點項</b><select data-f="p0">' + ptOpts(p.g) + '</select> ' + adjSel('p', p.adj, 'padj') + stSel(p.st, 'pst', !!p.adj) + '<span class="hint">天＝準心處從天而降、彈＝準心處從地下竄出、立＋矩陣＝腳下屏障；調適項讓出現的位置再往前（傷害少一點、施法慢 0.1 秒）。</span></div>';
    const segC = '<div class="sp-seg"><b>控制項</b><label>速 <select data-f="c0">' + ctOpts(c.g[0], 'sp') + '</select></label><label>軌 <select data-f="c1">' + ctOpts(c.g[1], 'tr') + '</select></label><label>擊 <select data-f="c2">' + ctOpts(c.g[2], 'hit') + '</select></label><br>'
      + adjSel('c', c.adj, 'cadj') + (c.adj === 'Mm' ? '<label>第二觸擊 <select data-f="cx">' + ctOpts(c.x || 'Xl', 'hit') + '</select></label>' : '') + stSel(c.st, 'cst', !!c.adj)
      + '<span class="hint">速度越快發射越貴（%Tsp）。彎＝追最近的敵人（不會打到自己）、規＝跟著準心走（每秒 1 MP）、跟隨＝繞著你轉。連頻 Mm 多 1200 古克、多一種觸擊。</span></div>';
    const out = [['元素量 e', r.e + ' 古克'], ['魔力量 m', r.m + ' 古克'], ['總體量 Tsp', r.Tsp], ['發射耗', r.launch + ' 古克'], ['消耗', r.costGk + ' 古克'], ['魔力', r.mp + ' MP'], ['施法時間', r.cast + ' 秒（' + r.n + ' 文）'], ['冷卻', r.cd + ' 秒'], ['形狀', SH[r.shape].n], ['穩定度', r.stab], ['固化值 x', r.pure ? '—（魔力法術）' : r.x + (r.solid ? '→ 固化：' + SOLID[r.solidKind].n : r.Tsp < 500 ? '（未滿 500 古克）' : '（不固化）')], ['預估傷害', Math.round(r.dmg * r.Sh.k * (r.cg[1] === 'Fy' ? 0.4 : 1)) + (r.Sh.c > 1 || r.cg[1] === 'Fy' ? ' ×' + (r.cg[1] === 'Fy' ? 4 : r.Sh.c) + ' 發' : '')], ['元素反應', ({ fire: '火', frost: '冰', shock: '雷' })[r.elk] || '—'], ['速度', r.speed ? r.speed.toFixed(1) + ' m/s' : '不動']];
    return '<div class="sp-seg"><b>名稱</b><input data-f="name" value="' + esc(x.n) + '" maxlength="10" size="10"> <label>咒文 <input class="code" data-f="code" value="' + esc(x.code) + '" spellcheck="false"></label></div>'
      + segV + segA + segP + segC
      + '<div class="sp-out">' + out.map(o => '<div><span>' + esc(o[0]) + '</span>　<b>' + esc(o[1]) + '</b></div>').join('') + '</div>'
      + (r.errs.length ? '<div class="sp-err">⚠ ' + r.errs.map(esc).join('；') + '</div>' : '') + (r.notes.length ? '<div class="sp-note">' + r.notes.map(esc).join('；') + '</div>' : '');
  };
  const bookHtml = () => {
    const P = W().P, b = book(); if (!b) return '';
    BK.i = Math.max(0, Math.min(b.spells.length - 1, BK.i));
    const skillName = i => { let id = null; try { id = ss0 ? ss0(P, i) : null; } catch (e) { } return id && R.SKILLS[id] ? R.SKILLS[id].name : '（空）'; };
    const ttl = scCls() ? '符卷書' : '咒式書';
    return '<div class="spb" role="dialog" aria-label="' + ttl + '"><div class="sp-h"><h3>' + ttl + '</h3>' + (scCls() ? '<small>符卷師：編好的咒要到白藤堂的書桌寫成卷軸，戰鬥中按技能格撕開（零前搖、不耗魔力）。</small>' : '') + '<small>照《法術統整》的格式編咒：活力-聚合-定點-控制，每段後面可以接調適項與狀態項。消耗＝古克 ÷10 ÷4。</small><button type="button" data-a="x">關閉</button></div>'
      + '<div class="sp-cols"><div><div class="sp-list">' + b.spells.map((x, i) => { let r = null; try { r = evalSpell(parse(x.code, x.n), { P }); } catch (e) { } return '<div data-a="pick" data-i="' + i + '" class="' + (i === BK.i ? 'on' : '') + '"><b>' + (i + 1) + '. ' + esc(x.n) + '</b>' + (r ? ' <small>' + r.mp + ' MP' + (r.errs.length ? '・⚠' : '') + '</small>' : '') + '<code>' + esc(x.code) + '</code></div>'; }).join('') + '</div>'
      + '<div style="display:flex;flex-wrap:wrap;gap:4px"><button type="button" data-a="new"' + (b.spells.length >= NSP ? ' disabled' : '') + '>新增</button><select data-a="preset">' + opt('', '放預設咒…', '') + PRESETS.map(p => opt(p[0], p[0] + '　' + p[1], '')).join('') + '</select><button type="button" data-a="del"' + (b.spells.length ? '' : ' disabled') + '>刪掉這句</button></div>'
      + (advOf(P) === 'elementalist' ? '<div class="sp-seg"><b>主元素</b><select data-a="mainEl">' + opt('', '（還沒選）', b.mainEl) + ELA.concat(ELO).map(g => opt(g, MASTER[g] + '（' + g + EL[g].n + '）', b.mainEl)).join('') + '</select><span class="hint">那一元素當主注釋時消耗 −30%、活力項可多 1 文。</span></div>' : '')
      + (advOf(P) === 'waixiu' ? '<div class="sp-note">外修者：第 1 句咒是魔力罩（瞬發、只能純魔、腳下 1 公尺）。</div>' : '')
      + '</div><div>' + editor(P, b, BK.i) + '</div></div>'
      + '<div class="sp-bind"><b>技能格</b>' + b.bind.map((k, i) => '<label>' + (i === 0 ? '技能一' : '技能' + '一二三四五'[i]) + (P && (P.lv || 1) < UNLOCK(i) ? '（' + UNLOCK(i) + ' 級）' : '') + ' <select data-a="bind" data-i="' + i + '">' + opt('', '原本的技能：' + skillName(i), k == null ? '' : k) + b.spells.map((x, j) => opt(j, (j + 1) + '. ' + x.n, k == null ? '' : k)).join('') + '</select></label>').join('') + '</div></div>';
  };
  const setSp = (b, sp) => { const x = b.spells[BK.i]; x.code = toCode(sp); x.n = sp.n || x.n; Object.keys(skCache).forEach(k => delete skCache[k]); };
  const onField = (b, f, val) => {
    const x = b.spells[BK.i]; if (!x) return;
    if (f === 'code') { x.code = String(val).trim(); Object.keys(skCache).forEach(k => delete skCache[k]); return; }
    if (f === 'name') { x.n = String(val).trim().slice(0, 10) || '咒文'; return; }
    const sp = parse(x.code, x.n);
    if (/^v\d$/.test(f)) { const j = +f[1]; const g = sp.v.g.slice(); if (val) g[j] = val; else g.splice(j); sp.v.g = g.filter(Boolean); if (!sp.v.g.length) { sp.v.adj = ''; sp.v.st = ''; } }
    else if (f === 'vadj') { sp.v.adj = val; if (!val) sp.v.st = ''; if (val !== 'Pm') sp.v.to = []; }
    else if (f === 'vto') { const gl = glyphsOf(String(val).trim()) || []; sp.v.to = gl.map(q => q.g).filter(g => CLASS[g] === 'v'); }
    else if (f === 'vst') sp.v.st = val;
    else if (f === 'a0') sp.a.g[0] = val; else if (f === 'a1') { if (val) sp.a.g[1] = val; else sp.a.g = [sp.a.g[0]]; }
    else if (f === 'aadj') { sp.a.adj = val; if (!val) sp.a.st = ''; sp.a.g2 = (val === 'Gm' || val === 'Am') ? (sp.a.g2.length ? sp.a.g2 : ['Lk']) : []; sp.a.cnt = 1; }
    else if (f === 'a2') sp.a.g2 = [val]; else if (f === 'acnt') sp.a.cnt = +val || 1; else if (f === 'ast') sp.a.st = val;
    else if (f === 'p0') sp.p.g = val; else if (f === 'padj') { sp.p.adj = val; if (!val) sp.p.st = ''; } else if (f === 'pst') sp.p.st = val;
    else if (/^c[012]$/.test(f)) sp.c.g[+f[1]] = val; else if (f === 'cadj') { sp.c.adj = val; if (!val) sp.c.st = ''; sp.c.x = val === 'Mm' ? (sp.c.x || 'Xl') : ''; } else if (f === 'cx') sp.c.x = val; else if (f === 'cst') sp.c.st = val;
    setSp(b, sp);
  };
  const render = () => {
    const el = $('sp-book'); if (!el || el.hidden) return; const b = book(); el.innerHTML = bookHtml();
    el.querySelectorAll('[data-f]').forEach(n => { n.onchange = () => { onField(b, n.dataset.f, n.value); R.save && R.save(); render(); }; });
    el.querySelectorAll('[data-a]').forEach(n => {
      const a = n.dataset.a;
      if (n.tagName === 'SELECT') n.onchange = () => {
        if (a === 'preset' && n.value) { const p = PRESETS.find(q => q[0] === n.value); if (b.spells.length < NSP) { b.spells.push({ n: p[0], code: p[1] }); BK.i = b.spells.length - 1; } else { b.spells[BK.i] = { n: p[0], code: p[1] }; } }
        if (a === 'bind') { const i = +n.dataset.i, v = n.value === '' ? null : +n.value; b.bind[i] = v; }
        if (a === 'mainEl') b.mainEl = n.value;
        Object.keys(skCache).forEach(k => delete skCache[k]); R.save && R.save(); render();
      };
      else n.onclick = () => {
        if (a === 'x') return R.closeSpellBook();
        if (a === 'pick') BK.i = +n.dataset.i;
        if (a === 'new' && b.spells.length < NSP) { b.spells.push({ n: '新咒文 ' + (b.spells.length + 1), code: 'Ya-Yk-Sr-ZyZyZy' }); BK.i = b.spells.length - 1; }
        if (a === 'del' && b.spells.length) { b.spells.splice(BK.i, 1); b.bind = b.bind.map(k => (k == null ? null : k === BK.i ? null : k > BK.i ? k - 1 : k)); BK.i = Math.max(0, BK.i - 1); }
        Object.keys(skCache).forEach(k => delete skCache[k]); R.save && R.save(); render();
      };
    });
  };
  R.openSpellBook = () => {
    const P = W() && W().P; if (!S() || (P && !isMS(P)) || (!P && S().cls !== 'mage' && S().cls !== 'scroll')) return;
    let el = $('sp-book'); if (!el) { el = document.createElement('div'); el.id = 'sp-book'; document.body.appendChild(el); el.addEventListener('keydown', e => { if (e.key === 'Escape') { e.stopPropagation(); R.closeSpellBook(); } }); el.addEventListener('pointerdown', e => { if (e.target === el) R.closeSpellBook(); }); }
    el.hidden = false; const w = W(); BK.paused = !!(w && w.run && !w.paused); if (BK.paused) w.paused = true;
    render();
  };
  R.closeSpellBook = () => { const el = $('sp-book'); if (el) el.hidden = true; const w = W(); if (BK.paused && w) w.paused = false; BK.paused = false; };
  // 城裡選單、暫停選單：多一顆「咒式書」
  const addBtn = again => { const P = W() && W().P; if (!isMS(P) && !(S() && (S().cls === 'mage' || S().cls === 'scroll'))) return; const row = $('r-sheet') && $('r-sheet').querySelector('.row'); if (!row || row.querySelector('#sp-open')) return; const b = document.createElement('button'); b.type = 'button'; b.className = 'btn'; b.id = 'sp-open'; b.textContent = scCls() ? '符卷書' : '咒式書'; b.onclick = () => { R.closeSheet && R.closeSheet(); R.openSpellBook(); }; row.appendChild(b); };
  const ps = R.pauseSheet; if (ps) R.pauseSheet = (...a) => { const r = ps(...a); try { addBtn(); } catch (e) { } return r; };
  const tm = R.townMenu; if (tm) R.townMenu = (...a) => { const r = tm(...a); try { addBtn(); } catch (e) { } return r; };
  R.spellKit = { isSc, ctxFor, curSpell, hasSt, cdSet, cdGet, UNLOCK, parse, toCode, evalSpell, PRESETS, OLD2SP, react, RT, book, boundK, castSpell, finishCast, release, editorHtml: bookHtml, SOLID };
})(window.R);
