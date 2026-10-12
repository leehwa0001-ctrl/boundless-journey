// node istable.cjs：印出每個分級、樓層的 IS 範圍與 IS 帶來的加成（讀 ruinis.js 的表）
const fs = require('fs'), vm = require('vm');
const R = { W: {}, ENEMIES: {}, spawnEnemy: () => null, hurtEnemy: () => 0, updateEnemies: () => 0, step: () => 0, hurtPlayer: () => 0 };
global.window = { R }; global.document = { createElement: () => ({}), head: { appendChild() {} } };
vm.runInThisContext(fs.readFileSync(process.argv[2] || require('path').join(__dirname, '..', 'ruinis.js'), 'utf8'));
const T = R.RUIN_IS, floors = { hamilia: 3, amile: 15, mors: 10, kesent: 58, kaso: 75 };
for (const g of Object.keys(T.IS_TABLE)) {
  const t = T.IS_TABLE[g], rows = [];
  for (let f = 1; f <= floors[g]; f += (g === 'kesent' || g === 'kaso') ? 5 : g === 'hamilia' ? 1 : 3) {
    const [lo, hi] = R.ruinISRange(g, f), eh = hi + t.elite;
    rows.push({ floor: f, normal: lo + '-' + hi, elite: (lo + t.elite) + '-' + eh, '+HP': (T.HP_PER * lo) + '-' + (T.HP_PER * hi), '+DMG': (T.DMG_PER * lo) + '-' + (T.DMG_PER * hi), 'regen%/s': (Math.min(T.REGEN_CAP, T.REGEN_PER * hi) * 100).toFixed(1), 'tactic%': (Math.min(T.TAC_CAP, T.TAC_PER * hi) * 100).toFixed(1), 'affix%': (Math.min(T.AFX_CAP, T.AFX_PER * hi) * 100).toFixed(1) });
  }
  console.log('\n' + g + '  core IS ' + t.core + (t.lord ? '  lord ' + t.lord.join('~') + '  mutated lord ' + t.vlord.join('~') : '') + '  rooms fight ' + T.ROOMS[g][0].join('~') + ' / other ' + T.ROOMS[g][1].join('~'));
  console.table(rows);
}
