// 雀莊（mjcore.js）的役・符・點數測試：node tools/mj-score-test.js
const MJ = require('../mjcore.js');
const parse = s => { const out = []; let buf = []; for (const ch of s.replace(/\s/g, '')) { if (/\d/.test(ch)) buf.push(+ch); else { const base = { m: 0, p: 9, s: 18, z: 27 }[ch]; buf.forEach(n => out.push(base + (ch === 'z' ? n - 1 : n === 0 ? 4 : n - 1))); buf = []; } } return out; };
const used = {}; const tileOf = id => { used[id] = (used[id] || 0) + 1; return id * 4 + 4 - used[id]; };   // 用每種的後幾張（避開赤牌 t%4==0）
const C = s => { const c = new Array(34).fill(0); parse(s).forEach(i => c[i]++); return c; };
const meld = (type, s) => ({ type, tiles: parse(s).map(tileOf) });
let fail = 0, n = 0;
const T = (name, o, exp) => {
  n++; for (const k in used) delete used[k];
  const base = { seatW: 1, roundW: 0, doraInd: [], uraInd: [], aka: 0, tsumo: false, riichi: false };
  const q = Object.assign(base, o, { c: C(o.hand), win: parse(o.win)[0], melds: (o.melds || []).map(m => meld(m[0], m[1])) });
  const r = MJ.evalWin(q);
  if (!r) { fail++; console.log('FAIL', name, '→ 沒有和'); return; }
  const dealer = q.seatW === 0, p = MJ.payOf(r.base, dealer), got = { han: r.han, fu: r.fu };
  if (q.tsumo) { if (dealer) got.all = p.tsumoAll; else { got.ko = p.tsumoKo; got.oya = p.tsumoOya; } } else got.ron = p.ron;
  const bad = Object.keys(exp).filter(k => k !== 'yaku' && exp[k] !== got[k]);
  if (exp.yaku) exp.yaku.forEach(y => { if (!r.yaku.some(v => v[0] === y)) bad.push('yaku:' + y); });
  if (bad.length) { fail++; console.log('FAIL', name, JSON.stringify(got), r.yaku.map(v => v.join(':')).join(' '), 'bad', bad.join()); }
  else console.log('ok  ', name, '|', r.yaku.map(v => v[0] + v[1]).join(' '), '|', r.han + '翻', r.fu + '符', JSON.stringify(got));
};
T('立直自摸平和斷么 20符4翻 子', { hand: '234567m234p678s55p', win: '2m', tsumo: true, riichi: true }, { han: 4, fu: 20, ko: 1300, oya: 2600, yaku: ['平和', '斷么九', '立直', '門前清自摸和'] });
T('平和斷么 榮和 30符2翻 子', { hand: '234567m234p678s55p', win: '2m' }, { han: 2, fu: 30, ron: 2000 });
T('七對子 25符2翻 子', { hand: '1133m5577p99s1122z', win: '9s' }, { han: 2, fu: 25, ron: 1600, yaku: ['七對子'] });
T('七對子 25符2翻 莊', { hand: '1133m5577p99s1122z', win: '9s', seatW: 0 }, { han: 2, fu: 25, ron: 2400 });
T('國士無雙', { hand: '119m19p19s1234567z', win: '7z' }, { han: 13, ron: 32000, yaku: ['國士無雙'] });
T('國士十三面（雙倍）', { hand: '119m19p19s1234567z', win: '1m' }, { han: 26, ron: 64000 });
T('四暗刻 自摸', { hand: '111m333p555s777s22z', win: '7s', tsumo: true }, { ko: 8000, oya: 16000, yaku: ['四暗刻'] });
T('四暗刻單騎（雙倍）', { hand: '111m333p555s777s22z', win: '2z', tsumo: true }, { ko: 16000, oya: 32000 });
T('立直 么九暗刻單騎 40符1翻 子', { hand: '111m234p567p789s55s', win: '5s', riichi: true }, { han: 1, fu: 40, ron: 1300 });
T('立直 40符1翻 莊', { hand: '111m234p567p789s55s', win: '5s', riichi: true, seatW: 0 }, { han: 1, fu: 40, ron: 2000 });
T('食斷 碰 單騎 30符1翻', { hand: '456m345p678s66p', win: '6p', melds: [['pon', '222m']] }, { han: 1, fu: 30, ron: 1000, yaku: ['斷么九'] });
T('立直平和一盃口斷么 莊 30符4翻', { hand: '223344m567p678s88p', win: '4m', riichi: true, seatW: 0 }, { han: 4, fu: 30, ron: 11600, yaku: ['一盃口'] });
T('役牌白 碰 30符1翻', { hand: '234m678p345s99s', win: '9s', melds: [['pon', '555z']] }, { han: 1, fu: 30, ron: 1000, yaku: ['役牌・白'] });
T('大三元', { hand: '234m11s', win: '1s', melds: [['pon', '555z'], ['pon', '666z'], ['pon', '777z']] }, { ron: 32000, yaku: ['大三元'] });
T('立直自摸＋寶牌3 滿貫', { hand: '234567m234p678s55p', win: '2m', tsumo: true, riichi: true, doraInd: [12, 3] }, { han: 7, ko: 3000, oya: 6000 });
T('赤寶牌、裏寶牌', { hand: '234567m234p678s55p', win: '2m', riichi: true, aka: 1, uraInd: [12] }, { han: 6, ron: 12000, yaku: ['赤寶牌', '裏寶牌'] });
T('一氣通貫 門清 坎張自摸', { hand: '123456789m234p99s', win: '5m', tsumo: true }, { han: 3, fu: 30 });
T('三色同順 副露', { hand: '234m234p99s567s', win: '9s', melds: [['chi', '234s']] }, { han: 1, fu: 30, ron: 1000, yaku: ['三色同順'] });
T('純正九蓮寶燈', { hand: '11122345678999m', win: '2m' }, { han: 26, yaku: ['純正九蓮寶燈'] });
T('九蓮寶燈', { hand: '11122345678999m', win: '1m' }, { han: 13, yaku: ['九蓮寶燈'] });
T('清一色 門清', { hand: '12334556778999m', win: '9m', riichi: true }, { yaku: ['清一色', '立直'] });
T('混一色 對對和 役牌', { hand: '111m999m22z', win: '2z', melds: [['pon', '555z'], ['pon', '333m']] }, { han: 5, ron: 8000, yaku: ['混一色', '對對和', '役牌・白'] });
T('暗槓 么九 嶺上開花 70符', { hand: '234m567p678s55p', win: '8s', tsumo: true, rinshan: true, melds: [['ankan', '1111m']] }, { fu: 60, yaku: ['嶺上開花', '門前清自摸和'] });
T('純全帶么九 三色', { hand: '123m123p123s789s99m', win: '3m', riichi: true }, { yaku: ['純全帶么九', '三色同順'] });
T('小三元', { hand: '234m111s55z666z777z', win: '1s' }, { yaku: ['小三元', '役牌・發', '役牌・中'] });
T('自風南 場風東', { hand: '234m678p99s222z111z', win: '9s', melds: [] , tsumo: true }, { yaku: ['自風・南', '場風・東'] });
console.log(fail ? fail + ' / ' + n + ' FAILED' : 'all ' + n + ' passed'); process.exit(fail ? 1 : 0);
