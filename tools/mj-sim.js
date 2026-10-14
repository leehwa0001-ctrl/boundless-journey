// 雀莊：電腦四家打完整的東風戰（檢查不會卡住、點數守恆）：node tools/mj-sim.js [場數]
const MJ = require('../js/minigames/mjcore.js');
const N = +process.argv[2] || 50; const yk = {}; let hands = 0, draws = 0, ext = 0;
for (let g = 0; g < N; g++) {
  const G = MJ.newMatch({ names: ['A', 'B', 'C', 'D'], bots: [1, 1, 1, 1], seed: g + 1 }); MJ.startHand(G);
  let guard = 0;
  while (G.phase !== 'over') {
    if (++guard > 200000) throw new Error('stuck seed ' + (g + 1) + ' phase ' + G.phase);
    if (G.phase === 'result') {
      hands++; const r = G.result; if (r.kind === 'draw' || r.kind === 'abort') draws++; else r.wins.forEach(w => w.y.yaku.forEach(v => { yk[v[0]] = (yk[v[0]] || 0) + 1; }));
      const sum = G.seats.reduce((a, o) => a + o.pts, 0) + G.kyotaku * 1000; if (sum !== 100000) throw new Error('points ' + sum + ' seed ' + (g + 1));
      if (G.round >= 4) ext++;
      MJ.nextHand(G); continue;
    }
    let moved = false;
    for (let s = 0; s < 4; s++) { const a = MJ.botAct(G, s); if (a) { if (!MJ.act(G, s, a)) throw new Error('illegal ' + JSON.stringify(a) + ' seed ' + (g + 1)); moved = true; break; } }
    if (!moved) throw new Error('nobody can act, phase ' + G.phase);
  }
  if (G.final.pts.reduce((a, b) => a + b, 0) !== 100000) throw new Error('final sum');
}
console.log('matches', N, 'hands', hands, 'draws', draws, 'ext-hands', ext);
console.log(Object.entries(yk).sort((a, b) => b[1] - a[1]).map(v => v.join(':')).join(' '));
