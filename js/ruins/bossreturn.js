// 打完 BOSS 房下樓再上樓，被關在房間裡（作者 2026-10-12）：回到上一層時若落在 BOSS／領主房，改傳送到該層營火所在的房間位置。
// 荊棘上限（作者 2026-10-12）：反彈傷害最多該怪物生命上限 100%；距離衰減：2m 內 100%，之後每多 1m −10%，最低 10%（11m 外不再衰減）。反彈仍走 noVamp，不吸血。
// 這個檔案要在 restfloor.js、stairs2.js、vampproc.js 後面載入。
(function (R) {
  const W = () => R.W;
  const inRoom = (r, x, z) => r && Math.abs(x - r.x) < (r.hx || r.w / 2 || 0) + 0.5 && Math.abs(z - r.z) < (r.hz || r.h / 2 || 0) + 0.5;
  const lf0 = R.loadFloor;
  R.loadFloor = (f, o) => {
    const res = lf0(f, o);
    try {
      const w = W(), F = w.F, P = w.P;
      if (o && o.up && F && P && F.rooms) {
        const trap = F.rooms.find(r => (r.type === 'boss' || r.type === 'lord') && inRoom(r, P.x, P.z));
        // 2026-10-18 作者：打倒領主體 → 下樓 → 再回上一層，會被關在房間裡。這一層的領主體打倒過：不再出現、通道不封，直接傳到營火旁
        const run = w.run, killed = run && run._lordKilled && run._lordKilled[f];
        if (killed) {
          if (F.lordGate) F.lordGate.down = true;
          F.rooms.forEach(r => { if (r.type === 'lord') r.cleared = true; });
          (w.enemies || []).forEach(e => { if (!e.dead && e.def && /^領主體/.test(e.def.name || '')) { e.dead = true; if (e.m && e.m.g && w.scene) w.scene.remove(e.m.g); } });
          R.lockRoom && w.F.rooms.forEach(r => { if (r.type === 'lord' && r.locked) R.lockRoom(r, false); });
        }
        if (trap || killed) {
          const C = F.camp, r0 = F.rooms[0];
          let x = C ? C.x + 1.6 : r0.x, z = C ? C.z + 1.6 : r0.z;
          if (R.pointBlocked && R.pointBlocked(x, z) && r0) { x = r0.x; z = r0.z; }
          P.x = x; P.z = z; P.vx = 0; P.vz = 0; if (P.h && P.h.g) P.h.g.position.set(x, P.y || 0, z);
          (w.allies || []).forEach((a, i) => { if (a && a.h && a.h.g && !a.remote) { a.x = x + (i % 2 ? 1 : -1); a.z = z + 1; a.h.g.position.set(a.x, 0, a.z); } });
          R.placeCam && R.placeCam(null);
        }
      }
    } catch (e) { console.warn('[bossreturn]', e); }
    return res;
  };
  // 記下哪幾層的領主體打倒過
  const bd0 = R.onBossDown;
  R.onBossDown = e => { const r = bd0 ? bd0(e) : undefined; try { const run = W().run; if (run && e && e.def && /^領主體/.test(e.def.name || '')) { run._lordKilled = run._lordKilled || {}; run._lordKilled[run.floor] = 1; } } catch (err) { } return r; };
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, dmg, o) => {
    if (o && o.thorns && e && dmg > 0) {
      const P = W().P;
      const d = P ? Math.hypot((e.x || 0) - P.x, (e.z || 0) - P.z) : 0;
      const k = Math.max(0.1, 1 - Math.max(0, Math.ceil(d - 2)) * 0.1);
      dmg = dmg * k;
      if (e.hpMax > 0) dmg = Math.min(dmg, e.hpMax);
      o.noVamp = true; o.reflect = true;
    }
    return he0(e, dmg, o);
  };
})(window.R);
