// 2026-10-14 召喚物：繞牆追敵、卡住偵測、離太遠自動傳回身邊（IS 在 2026-10-15 拿掉了）
// - 遺跡的地圖是方格（dungeon.js 的 F.tile）。遺跡生物本身沒有尋路（只會偏一點方向繞，ruinis.js 的 steer），
//   召喚物改用方格上的 BFS（8 方向、不切牆角）找路：跟目標之間有牆擋住就照路走，路上挑「看得到的最遠一個路點」（classes2b.js 的 hk.via）。
// - 卡住偵測：一直在走、但 1 秒內離目標沒有近 0.3 公尺 → 重新找路；連續 2 秒 → 換一隻打（這隻 3 秒內不追）；4 秒 → 傳回召喚師身邊。
// - 離召喚師超過 TELEPORT_M（20 公尺）→ 傳回身邊（兩邊各一團小煙）。
// - 2026-10-15 作者《特質與熟練度》第五節：召喚物不再套 IS（原本 floor(等級÷4) 級，每級 +45 生命、+2 傷害），召喚物的等級之後另外做（Q44）。
// 放在 summoncarry.js、classes2b.js、summoncraft.js 後面。
(function (R) {
  const W = () => R.W;
  const isS = P => !!(P && P.cls === 'summoner');
  const TELEPORT_M = 20, STUCK_T = 1, DROP_T = 2, TP_T = 4;
  R.SUMMON_AI = { TELEPORT_M, STUCK_T, DROP_T, TP_T };
  // ---------- 土犬、鴉群、蟲群 ----------
  const pi0 = R.petInit;
  R.petInit = (pet, P, s, w) => {
    if (pi0) pi0(pet, P, s, w);
    if (!isS(P)) return;
    const id = s && s._id;
    if (id === 'sn_dog') { pet.upkeep = (pet.upkeep || 0) * 2; if (pet.hpMax) pet.hpMax *= 2; }   // 土犬：維持魔力 ×2、血量 ×2（攻擊速度 ×2 在 rate）
    if (s && s.ghost) { pet.ghost = 1; pet.hpMax = 0; pet.hp = 0; }   // 鴉群、蟲群：敵人打不到、沒有血條
    if (pet.hpMax) { pet.hpMax = Math.round(pet.hpMax); pet.hp = pet.hpMax; }
  };
  // ---------- 方格尋路 ----------
  const TL = () => W() && W().F && W().F.tile;
  const FLOOR = (R.TILE && R.TILE.FLOOR);
  const okAt = (x, z) => (!R.isFloor || R.isFloor(x, z)) && !(R.pointBlocked && R.pointBlocked(x, z));
  const clear = (ax, az, bx, bz) => { const d = Math.hypot(bx - ax, bz - az), n = Math.ceil(d / 0.35); for (let i = 1; i <= n; i++) { const f = i / n, x = ax + (bx - ax) * f, z = az + (bz - az) * f; if (!okAt(x, z) || !okAt(x + 0.3, z) || !okAt(x - 0.3, z) || !okAt(x, z + 0.3) || !okAt(x, z - 0.3)) return false; } return true; };
  const N8 = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  const findPath = (ax, az, bx, bz) => {
    const t = TL(); if (!t || FLOOR == null) return null;
    const TS = t.TS, nx = t.nx, nz = t.nz, ti = (x, z) => [Math.floor((x - t.X0) / TS), Math.floor((z - t.Z0) / TS)];
    const [sx, sz] = ti(ax, az), [gx, gz] = ti(bx, bz); if (sx < 0 || sz < 0 || sx >= nx || sz >= nz || gx < 0 || gz < 0 || gx >= nx || gz >= nz) return null;
    const walk = (x, z) => x >= 0 && z >= 0 && x < nx && z < nz && t.T[z * nx + x] === FLOOR;
    const s = sz * nx + sx, g = gz * nx + gx, prev = new Map([[s, -1]]), q = [s];
    for (let h = 0; h < q.length && h < 6000; h++) {
      const k = q[h]; if (k === g) break; const x = k % nx, z = (k - x) / nx;
      for (const [dx, dz] of N8) { const x2 = x + dx, z2 = z + dz; if (!walk(x2, z2)) continue; if (dx && dz && (!walk(x + dx, z) || !walk(x, z + dz))) continue; const k2 = z2 * nx + x2; if (prev.has(k2)) continue; prev.set(k2, k); q.push(k2); }
    }
    if (!prev.has(g)) return null;
    const out = []; for (let k = g; k !== -1 && k !== s; k = prev.get(k)) { const x = k % nx, z = (k - x) / nx; out.push({ x: t.X0 + (x + 0.5) * TS, z: t.Z0 + (z + 0.5) * TS }); }
    return out.reverse();
  };
  R.summonPath = findPath;
  const poof = (x, z) => R.fx && R.fx('poof', x, 0.6, z, { color: '#B8E07A', n: 10 });
  const tpHome = (pet, P) => {
    poof(pet.x, pet.z);
    let a = Math.random() * 6.28, x = P.x + Math.sin(a) * 1.4, z = P.z + Math.cos(a) * 1.4;
    if (!okAt(x, z)) { const f = R.nearestFloor ? R.nearestFloor(x, z) : [P.x, P.z]; x = f[0]; z = f[1]; }
    pet.x = x; pet.z = z; if (pet.g) pet.g.position.set(x, 0, z);
    pet._path = null; pet._stuck = 0; pet._best = null; poof(x, z); pet._tpN = (pet._tpN || 0) + 1;
  };
  R.summonTpHome = tpHome;
  // ---------- 鴉群、蟲群：遠遠吐出會穿透的魔力彈 ----------
  const ULT_K = 2, ULT_T = 8, ULT_SHIELD = 0.4;
  const ghostShot = (pet, P, t, ult) => {
    const s = pet.s || {}, reach = s.reach || 7;
    if (!t || t.dead || Math.hypot(t.x - pet.x, t.z - pet.z) > reach || !clear(pet.x, pet.z, t.x, t.z)) return null;
    if (pet.cd <= 0) {
      pet.cd = s.rate || 0.9;
      const a = Math.atan2(t.x - pet.x, t.z - pet.z), dmg = (pet.pw || 10) * (s.k || 0.5) * (pet.mul || 1) * (pet.dK || 1);
      R.fire && R.fire({ kind: 'spirit', owner: 'p', x: pet.x, z: pet.z, a, speed: 18, dmg, life: (reach + 3) / 18, pierce: 99, vSk: 'summon' });
      pet._shots = (pet._shots || 0) + 1;
    }
    return { tg: null, goal: { x: pet.x, z: pet.z }, skip: true };   // 原地吐，不衝上去咬
  };
  // ---------- 意念外面再包一層：繞牆、卡住、傳回 ----------
  const pt0 = R.petThink;
  R.petThink = (pet, P, dt, tg, w) => {
    let hk = pt0 ? pt0(pet, P, dt, tg, w) : null;
    if (!isS(P) || pet.left <= 0) return hk;
    const now = R.coreTime ? R.coreTime() : performance.now() / 1000;
    const ult = (P._sumUlt || 0) > now;
    if (ult) { pet.spK = (pet.spK || 1) * ULT_K; pet.dK = (pet.dK || 1) * ULT_K; pet.cd -= dt * (ULT_K - 1); }   // 大招：移動、傷害、攻擊速度 ×2
    if (pet.ghost) { const g = ghostShot(pet, P, hk && 'tg' in hk ? hk.tg : tg, ult); if (g) return g; }
    if (Math.hypot(pet.x - P.x, pet.z - P.z) > TELEPORT_M) { tpHome(pet, P); return hk; }
    let t = hk && 'tg' in hk ? hk.tg : tg;
    if (t && pet._skip && pet._skip.e === t && pet._skip.until > now) {   // 卡住放棄的那隻：先找別隻
      let best = null, bd = 1e9; (w.enemies || []).forEach(e => { if (e.dead || e.under || e.invuln || e === t) return; const d = Math.hypot(e.x - pet.x, e.z - pet.z); if (d < bd && Math.hypot(e.x - P.x, e.z - P.z) < 15) { bd = d; best = e; } });
      t = best; hk = Object.assign({}, hk || {}, { tg: best });
    }
    const goal = t || (hk && hk.goal) || { x: P.x - Math.sin(P.aimA || 0) * 1.6, z: P.z - Math.cos(P.aimA || 0) * 1.6 };
    const d = Math.hypot(goal.x - pet.x, goal.z - pet.z), reach = t ? 0.9 + ((t.def && t.def.size) || 1) * 0.45 : 1.2;
    if (d <= reach + 0.3) { pet._stuck = 0; pet._best = d; pet._bestT = now; pet._path = null; return hk; }
    // 卡住偵測
    if (pet._best == null || d < pet._best - 0.3 || pet._goalRef !== (t || 'goal')) { pet._best = d; pet._bestT = now; pet._goalRef = t || 'goal'; pet._stuck = 0; }
    else pet._stuck = now - (pet._bestT || now);
    if (pet._stuck > TP_T) { tpHome(pet, P); return hk; }
    if (pet._stuck > DROP_T && t) { pet._skip = { e: t, until: now + 3 }; pet._best = null; pet._path = null; pet._dropN = (pet._dropN || 0) + 1; return Object.assign({}, hk || {}, { tg: null }); }
    if (clear(pet.x, pet.z, goal.x, goal.z)) { pet._path = null; return hk; }
    // 有牆擋：找路（0.5 秒一次，卡住時馬上重找）
    if (!pet._path || now - (pet._pathT || 0) > 0.5 || pet._stuck > STUCK_T) { pet._path = findPath(pet.x, pet.z, goal.x, goal.z); pet._pathT = now; pet._pathN = (pet._pathN || 0) + 1; }
    const path = pet._path; if (!path || !path.length) return hk;
    let via = null; for (let i = Math.min(path.length - 1, 12); i >= 0; i--) if (clear(pet.x, pet.z, path[i].x, path[i].z)) { via = path[i]; break; }
    if (!via) via = path[0];
    return Object.assign({}, hk || {}, { tg: t, via });
  };
  // ---------- 技能改數字（2026-10-14 作者） ----------
  const LIB = R.SKILL_LIB || {}, SK = R.SKILLS || {};
  const setSk = (id, o, desc) => { const l = LIB[id]; if (!l) return; Object.assign(l, o); if (SK[id]) { if (o.mp != null) SK[id].mp = o.mp; SK[id].desc = desc; } l.desc = desc; };
  const up = k => (R.summonUpkeep ? R.summonUpkeep(k, {}) : 0.6);
  if (LIB.sn_dog) setSk('sn_dog', { mp: LIB.sn_dog.mp * 2, p: Object.assign({}, LIB.sn_dog.p, { rate: 0.4 }) }, '用執念捏一隻土狗跟著你咬敵人（不限時間）：攻擊速度 2 倍（0.4 秒咬一口）、血量 2 倍；召喚魔力 ' + LIB.sn_dog.mp * 2 + '、在場時每秒吃 ' + Math.round(up(0.7) * 2 * 10) / 10 + ' 魔力（都是一般的 2 倍）。');
  if (LIB.sn_crow) setSk('sn_crow', { mp: Math.round(LIB.sn_crow.mp / 2), type: 'pet', p: { beast: 'ashcrow', n: 4, k: 0.45, ghost: 1, rate: 0.9, reach: 8, speed: 8, scale: 0.7, color: '#6A5A8A' } }, '放出 4 隻魔力烏鴉留在場上，朝 8 公尺內的敵人吐出會穿透的魔力羽（每隻 0.9 秒一發，一路穿過去）。敵人打不到牠們（沒有血條）；死靈法師：鴉群打出去的傷害 10% 回成你的生命。召喚魔力 ' + Math.round(LIB.sn_crow.mp / 2) + '（減半），在場時每隻每秒吃 ' + up(0.45) + ' 魔力。');
  if (LIB.sn_swarm) setSk('sn_swarm', { mp: Math.round(LIB.sn_swarm.mp / 2), type: 'pet', p: { beast: 'bellcricket', n: 5, k: 0.35, ghost: 1, rate: 0.7, reach: 6, speed: 7, scale: 0.6, color: '#8AC88A' } }, '捏出 5 隻小蟲留在場上，朝 6 公尺內的敵人噴出會穿透的蟲刺（每隻 0.7 秒一發，一路穿過去）。敵人打不到牠們（沒有血條）；死靈法師：蟲群打出去的傷害 10% 回成你的生命。召喚魔力 ' + Math.round(LIB.sn_swarm.mp / 2) + '（減半），在場時每隻每秒吃 ' + up(0.35) + ' 魔力。');
  // ---------- 大招：護盾＋召喚物強化（不再叫出新的召喚物） ----------
  const U = R.ULTS && R.ULTS.summoner;
  if (U) {
    const g0 = U.go;
    U.name = '百鬼夜行'; U.sub = '召喚師的大招：獲得 40% 生命的護盾（沒有減傷）；' + ULT_T + ' 秒內所有召喚物傷害、移動速度、攻擊速度 ×2'; U.bonus = ''; U.dur = ULT_T;
    U.go = P => {
      const T = R.SKILL_TYPES || {}, p0 = T.pet, o0 = P.orbit, n0 = P.orbitN;
      T.pet = () => { };   // 原本的大招（含轉職路線）叫出新召喚物的部分全部拿掉；其他效果（死靈法師的怨靈纏身）照舊
      try { g0(P); } catch (e) { } finally { T.pet = p0; P.orbit = o0; P.orbitN = n0; }
      const now = R.coreTime ? R.coreTime() : 0; P._sumUlt = now + ULT_T;
      P.shield = Math.max(P.shield || 0, Math.round(P.hpMax * ULT_SHIELD)); if (P.buff) P.buff.shieldT = Math.max(P.buff.shieldT || 0, ULT_T);
      R.fx && R.fx('ring', P.x, 0.1, P.z, { r: 4, color: '#B8E07A' }); R.num && R.num(P.x, 2.8, P.z, '召喚物 ×2', 'crit');
      (R.PETS || []).forEach(p => { if (!p.gone && p.left > 0) R.fx && R.fx('ring', p.x, 0.1, p.z, { r: 1, color: '#B8E07A' }); });
    };
  }
  R.SUMMON_ULT = { K: ULT_K, T: ULT_T, SHIELD: ULT_SHIELD };
})(window.R);
