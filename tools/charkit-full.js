// 人物素材「完整版」（2026-10-18 作者：打包並匯入遊戲內，連同種族和裝備）→ 遊戲用的 js/art/charkit-full.js
// 用法：node tools/charkit-full.js <〇〇族種_匯入用.zip ...>（也可以直接給 素材_〇〇族種.json、〇〇族種_對照表.csv）
//   zip 裡面＝人物編輯器的匯出檔（每個族種一個，裡面有人類＋那個族種＋共用的衣服、裝備、武器）＋族種對照表（族名 → 身體、各圖層用哪一個）。
// - 格子照 charkit-convert.js 的寫法（0～9 換成 a～j，連續的寫個數）。匯出檔是 49×49 的話裁回 45×45（左右各 2 格、下面 4 列：遊戲裡那裡本來就畫不到）。
// - bodies：每一個身體（人類、精靈、獸人族種、半身族……）的站立、移動、單手揮擊、雙手揮擊；同一個族種有別的體型組（獨臂、六足、半身……）的叫「族種/體型組」。
// - layers：圖層 → 變體 → 動作。同一個變體在別的身體上畫得不一樣的，另外存在 by[身體]（一樣的就不存，用人類的）。
// - weapons：「武器」圖層，變體的 id＝遊戲裡的武器代碼（sword、axe……）。
// - races：族名 → { body, parts: { 圖層: 變體 } }（對照表；兩種寫法：「族名,外貌,身體（種族）,圖層…」或「族名,體型組,建議的搭配（圖層：變體＋圖層：變體）」）。
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const args = process.argv.slice(2); if (!args.length) { console.error('用法：node tools/charkit-full.js <zip...>（或 <json...> <csv...>）'); process.exit(1); }
// 讀 zip（不用另外裝東西）：找中央目錄，一個一個解開
const unzip = file => {
  const b = fs.readFileSync(file), out = []; let e = b.length - 22; while (e >= 0 && b.readUInt32LE(e) !== 0x06054b50) e--;
  if (e < 0) throw new Error('不是 zip：' + file);
  let p = b.readUInt32LE(e + 16); const n = b.readUInt16LE(e + 10);
  for (let k = 0; k < n; k++) {
    const meth = b.readUInt16LE(p + 10), csz = b.readUInt32LE(p + 20), nl = b.readUInt16LE(p + 28), xl = b.readUInt16LE(p + 30), cl = b.readUInt16LE(p + 32), off = b.readUInt32LE(p + 42);
    const name = b.slice(p + 46, p + 46 + nl).toString('utf8'); p += 46 + nl + xl + cl;
    const ds = off + 30 + b.readUInt16LE(off + 26) + b.readUInt16LE(off + 28), raw = b.slice(ds, ds + csz);
    out.push({ name, data: () => (meth === 8 ? zlib.inflateRawSync(raw) : raw) });
  }
  return out;
};
const JSONS = [], CSVS = [];   // { name, text() }
args.forEach(f => {
  if (/\.zip$/i.test(f)) unzip(f).forEach(z => { if (/\.json$/i.test(z.name)) JSONS.push({ name: z.name, text: () => z.data().toString('utf8') }); else if (/\.csv$/i.test(z.name)) CSVS.push({ name: z.name, text: () => z.data().toString('utf8') }); });
  else if (/\.json$/i.test(f)) JSONS.push({ name: path.basename(f), text: () => fs.readFileSync(f, 'utf8') });
  else if (/\.csv$/i.test(f)) CSVS.push({ name: path.basename(f), text: () => fs.readFileSync(f, 'utf8') });
});
const DIRS = ['front', 'back', 'left', 'right'], ACT = { '站立': 'stand', '移動': 'move', '單手揮擊': 'swing1', '雙手揮擊': 'swing2' };
const enc = a => { let s = '', i = 0; while (i < a.length) { const v = a[i] | 0; let n = 1; while (i + n < a.length && (a[i + n] | 0) === v) n++; s += String.fromCharCode(97 + Math.max(0, Math.min(9, v))) + (n > 1 ? n : ''); i += n; } return s; };
const crop = (a, g) => { if (!a || g === 45) return a || []; const o = new Array(45 * 45).fill(0); for (let y = 0; y < 45; y++) for (let x = 0; x < 45; x++) o[y * 45 + x] = a[y * g + x + 2] | 0; return o; };
const out = { grid: 45, order: [], bodies: {}, layers: {}, weapons: {}, races: {} };
const frameOf = (f, g) => { const o = {}; DIRS.forEach(d => { o[d] = enc(crop(f[d], g)); }); return o; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
JSONS.forEach(file => {
  const j = JSON.parse(file.text()), g = j.grid || 45, idOf = {};
  const bodyKey = (r, gi, gr) => (gi === 0 || !gr.name || gr.name === '一般' ? r.name : r.name + '/' + gr.name);   // 體型組
  j.body.races.forEach(r => (r.groups || []).forEach((gr, gi) => gr.actions.forEach(a => { idOf[a.id] = { body: bodyKey(r, gi, gr), act: ACT[a.name] || a.name }; })));
  j.body.races.forEach(r => (r.groups || []).forEach((gr, gi) => { const k = bodyKey(r, gi, gr); if (out.bodies[k]) return; const b = {}; gr.actions.forEach(a => { b[ACT[a.name] || a.name] = a.frames.map(f => frameOf(f, g)); }); out.bodies[k] = b; }));
  j.layers.forEach(L => {
    if (!out.order.includes(L.name)) out.order.push(L.name);
    (L.variants || []).forEach(v => {
      const per = {};   // 身體 → 動作 → 格
      Object.keys(v.byAction || {}).forEach(id => { const w = idOf[id]; if (!w) return; (per[w.body] = per[w.body] || {})[w.act] = v.byAction[id].map(f => frameOf(f, g)); });
      if (!Object.keys(per).length) return;
      if (L.name === '武器') { if (!out.weapons[v.id]) out.weapons[v.id] = per['人類'] || per[Object.keys(per)[0]]; return; }
      const LL = out.layers[L.name] = out.layers[L.name] || {}, V = LL[v.name] = LL[v.name] || { by: {} }; V.by = V.by || {};
      const base = per['人類']; if (base && !V.a) V.a = base;
      Object.keys(per).forEach(b => { if (b === '人類' || V.by[b]) return; if (V.a && same(per[b], V.a)) return; V.by[b] = per[b]; });
      if (!V.a) { const k = Object.keys(V.by)[0]; V.a = V.by[k]; delete V.by[k]; }
    });
  });
  console.log('讀了 ' + file.name + '：身體 ' + j.body.races.map(r => r.name).join('、'));
});
// 對照表：族名,外貌,身體（種族）,圖層 1,圖層 2……；「—」＝沒有
CSVS.forEach(file => {
  const rows = file.text().replace(/^﻿/, '').split(/\r?\n/).filter(Boolean).map(l => l.split(','));
  const head = rows.shift(); if (!head) return;
  if (head[1] === '體型組') {   // 族名,體型組,建議的搭配：身體＝這個檔的族種（體型組不是「一般」的接在後面）
    const fam = String(file.name).replace(/^.*[\\/]/, '').replace(/_.*$/, '');
    rows.forEach(r => {
      const name = r[0], gname = (r[1] || '').trim(), body = gname && gname !== '一般' && out.bodies[fam + '/' + gname] ? fam + '/' + gname : fam, parts = {};
      String(r.slice(2).join(',') || '').split('＋').forEach(x => { const m = x.split('：'); if (m.length === 2 && m[1].trim() && m[1].trim() !== '—') parts[m[0].trim()] = m[1].trim(); });
      if (name && out.bodies[body]) out.races[name] = { body, parts };
    });
    return;
  }
  rows.forEach(r => {
    const name = r[0], body = String(r[2] || '').replace(/（.*$/, '').trim(), parts = {};
    for (let i = 3; i < head.length; i++) { const v = (r[i] || '').trim(); if (v && v !== '—' && v !== '-') parts[head[i]] = v; }
    if (name && out.bodies[body]) out.races[name] = { body, parts };
  });
});
Object.values(out.layers).forEach(LL => Object.values(LL).forEach(V => { if (V.by && !Object.keys(V.by).length) delete V.by; }));   // 沒有另外畫的身體：不存
const dst = path.join(__dirname, '..', 'js', 'art', 'charkit-full.js');
fs.writeFileSync(dst, '// 人物素材完整版的資料（tools/charkit-full.js 從作者的人物編輯器匯出檔＋族種對照表轉出來的，不要手改；遊戲打開「人物：素材版」才載入）\nwindow.R = window.R || {}; window.R.CHARKIT_FULL = ' + JSON.stringify(out) + ';\nwindow.R.charkitFullLoaded && window.R.charkitFullLoaded();\n');
console.log('寫好了：' + dst + '（' + Math.round(fs.statSync(dst).size / 1024) + ' KB）；身體 ' + Object.keys(out.bodies).length + '、圖層 ' + Object.keys(out.layers).length + '、武器 ' + Object.keys(out.weapons).length + '、族 ' + Object.keys(out.races).length);
