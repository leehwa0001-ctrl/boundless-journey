// 遺跡整改（作者 2026-10-13）：IS（Individual survivability，單體生存能力）、素質 ×2、每間房的數量、戰術（巡邏、遠離、合作、短暫逃跑、偷襲）、詞條照 IS
// - 2026-10-15 作者《特質與熟練度》第五節：IS 改成「等級基礎值」——拿掉 ×2、拿掉生命／傷害上限（HPCAP、DMGCAP）、召喚物不再套 IS（summonai.js）。
//   固定基礎值（HPF／ATKF）＝生物原本的數值（變體算加成，用沒變體的那隻）；等級基礎值（HPI／ATKI）＝固定基礎值＋IS 加的；
//   最終值（HPA／ATKA）＝等級基礎值 × 原本所有的加成（遺跡深度、分級、變體、條款、連線人數……照原本算出來的倍率）。
//   一般、精英：生命 X＋round[(X×0.45＋10)×0.95]×n；傷害 X＋round[(X×0.65＋3)×0.25]×n（先四捨五入再乘 n，Q39）。
//   領主體、佩特拉核心（Q45）：生命 X＋round[(X×0.25＋10)×0.55]×n；傷害 X＋round[(X×0.25＋3)×0.15]×n。
//   異變的領主體：生命 X＋round[(X×0.25＋15)×0.55]×n；傷害 X＋round[(X×0.25＋5)×0.15]×n。
//   回血：每級 IS 每秒回最大生命的 0.05%（上限每秒 35%，Q41、F17），被打後 3 秒內不回。
// - （舊）所有遺跡生物（人、狩獵場的野獸、假的除外）生命、傷害 ×2，再加 IS：每一級 +45 生命、+2 傷害、每秒回復 0.2% 生命上限（×IS，上限每秒 0.5%，被打後 3 秒內不回）。
// - IS 照分級、樓層、種類決定（表在 IS_TABLE），頭上的名牌顯示 [IS：N]，大血條（領主體、核心）也顯示。
// - 多人連線：IS、生命、傷害、詞條都由房主決定，跟著 net2.js 的生成訊息送給隊友（is 欄位）。
// - （舊，2026-10-15 拿掉）為了不讓數值疊太誇張：一般、精英的生命最多是同等級「標準一下普攻」的 HPCAP 倍、傷害最多是同等級標準身板的 DMGCAP（條款另外乘）。
// - 戰術：每一級 IS +1.1%（最多 95%）會改用合作包夾、短暫逃跑、偷襲、巡邏繞圈；玩家快倒下或大招集滿時 15% 遠離 7 公尺觀望 4～6 秒。
// 放在所有包 R.spawnEnemy、R.updateEnemies 的檔案後面（index.html 的最後面、main.js 前面）。
(function (R) {
  const W = () => R.W, rnd = Math.random, ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
  const isLord = d => !!(d && /^領主體/.test(d.name || ''));
  // ---------- 表 ----------
  // lo～hi：第 1 段的基礎；every 層加 add；elite：精英再加；core：佩特拉核心；lord／vlord：領主體、異變的領主體
  const IS_TABLE = {
    hamilia: { lo: 0, hi: 1, every: 999, add: 0, elite: 0, core: 35 },
    amile: { lo: 0, hi: 2, every: 3, add: 1, elite: 3, core: 45 },
    mors: { lo: 5, hi: 9, every: 3, add: 3, elite: 3, core: 55 },
    kesent: { lo: 12, hi: 15, every: 5, add: 4, elite: 5, core: 65, lord: [20, 35], vlord: [20, 45] },
    kaso: { lo: 25, hi: 30, every: 5, add: 3, elite: 8, core: 75, lord: [45, 50], vlord: [45, 60] }
  };
  // 每間房幾隻：[戰鬥房, 非戰鬥房]
  const ROOMS = { hamilia: [[1, 2], [0, 1]], amile: [[2, 5], [0, 2]], mors: [[3, 7], [2, 4]], kesent: [[5, 9], [3, 6]], kaso: [[7, 12], [5, 9]] };
  const REGEN_PER = 0.0005, REGEN_CAP = 0.35, TAC_PER = 0.011, TAC_CAP = 0.95, AFX_PER = 0.006, AFX_CAP = 0.6;
  // 等級基礎值（作者的公式）
  const FORM = { n: { hp: [0.45, 10, 0.95], atk: [0.65, 3, 0.25] }, lord: { hp: [0.25, 10, 0.55], atk: [0.25, 3, 0.15] }, vlord: { hp: [0.25, 15, 0.55], atk: [0.25, 5, 0.15] } };
  const lvUp = (X, n, f) => X + Math.round((X * f[0] + f[1]) * f[2]) * n;
  R.isHPI = (X, n, kind) => lvUp(X, n, (FORM[kind] || FORM.n).hp);
  R.isATKI = (X, n, kind) => lvUp(X, n, (FORM[kind] || FORM.n).atk);
  R.RUIN_IS = { IS_TABLE, ROOMS, REGEN_PER, REGEN_CAP, TAC_PER, TAC_CAP, AFX_PER, AFX_CAP, FORM };

  const gid = run => run && run.grade && (run.grade.id === 'kansait' ? 'kaso' : run.grade.id);
  const active = run => !!(run && !run.done && run.grade && IS_TABLE[gid(run)] && run.site && !run.site.outdoor && run.grade.id !== 'hunt' && run.site.kind !== 'train');
  const guest = run => !!(run && run.coop && !run.coop.host);
  const skip = e => !e || !e.def || e.def.human || e.def.wild || e.fake || e.def.noLoot;
  const floorNo = run => { const fl = run.isRealFloor != null ? run.isRealFloor : run.floor, f0 = run.f0 && R.ruinPlusDebug && R.ruinPlusDebug.has0 && R.ruinPlusDebug.has0(run); return Math.max(1, f0 ? fl : fl + 1); };
  const tierOf = e => { const m = /_v(\d)$/.exec(e.id || ''); return m ? +m[1] : 0; };
  const baseElite = (e, o) => { const b = R.ENEMIES[e.id] || e.def; return !!(b && b.elite) || tierOf(e) > 0 || e.leader || !!(o && o.hpMul >= 2); };
  const kindOf = (e, o) => e.id === 'petra' ? 'core' : isLord(e.def) ? (e.variant ? 'vlord' : 'lord') : e.def.boss ? 'boss' : baseElite(e, o) ? 'elite' : 'n';
  // 這一層一般生物的 IS 範圍
  R.ruinISRange = (gradeId, floor) => { const T = IS_TABLE[gradeId]; if (!T) return [0, 0]; const k = Math.floor((Math.max(1, floor) - 1) / T.every) * T.add; return [T.lo + k, T.hi + k]; };
  const rollIS = (e, o, run) => {
    const id = gid(run), T = IS_TABLE[id], f = floorNo(run), [lo, hi] = R.ruinISRange(id, f), k = kindOf(e, o);
    if (k === 'core') return T.core;
    if (k === 'lord' || k === 'vlord') { const L = T[k] || T.lord || [hi + 5, hi + 10]; return Math.max(ri(L[0], L[1]), hi + 2); }   // 低分級沒有寫的：這一層上限 +5～+10；深層不會比小怪還低
    if (k === 'boss') return hi + 5;   // 沒寫到的頭目（非領主、非核心）
    return ri(lo, hi) + (k === 'elite' ? T.elite : 0);
  };
  const isOf = (e, o) => { if (e.is != null) return e.is; const run = W().run; if (!active(run)) return 0; e.is = rollIS(e, o, run); return e.is; };
  R.monIS = isOf;

  // ---------- 詞條：一般的 0 起、每級 IS +0.6%（monsters8.js 呼叫） ----------
  R.ruinISAffix = (e, o, t, dep) => {
    const run = W().run; if (guest(run)) return 0;   // 隊員：房主決定（名字跟著同步）
    const is = isOf(e, o), p = Math.min(AFX_CAP, AFX_PER * is);
    if (t > 0) {   // 精英（變種）：原本的機會再加
      if (t === 3) return 2;
      const base = t === 2 ? 0.55 : 0.3; return rnd() < Math.min(0.95, base + p) ? 1 : 0;
    }
    if (rnd() >= p) return 0;
    return rnd() < Math.min(0.6, 0.15 + 0.004 * is) ? 2 : 1;
  };

  // ---------- 每間房幾隻（run.js fillRoom 呼叫） ----------
  R.ruinRoomCount = (r, run) => {
    if (!active(run)) return null; const T = ROOMS[gid(run)]; if (!T) return null;
    const fight = r.type === 'fight' || r.type === 'wing', rg = fight ? T[0] : T[1];
    let n = ri(rg[0], rg[1]);
    if (r.big) n = Math.round(n * 1.5);   // 跨兩格的大廳（面積兩倍）
    n += R.alliesUp ? R.alliesUp().length : 0;   // 隊友越多越多（原本就有）
    return n;
  };

  // ---------- 素質 ----------
  const formOf = k => (k === 'lord' || k === 'core' ? 'lord' : k === 'vlord' ? 'vlord' : 'n');
  const baseDef = e => R.ENEMIES[String(e.id || '').replace(/_v\d$/, '')] || R.ENEMIES[e.id] || e.def;
  const apply = (e, o) => {
    const run = W().run; if (e.isDone || skip(e) || !active(run)) return; e.isDone = 1;
    if (guest(run) || e.mirror) return;   // 隊員：房主送過來
    e.isPre = { hp: Math.round(e.hpMax), dmg: Math.round((e.dmg || 0) * 10) / 10 };
    const is = isOf(e, o), k = formOf(kindOf(e, o)), b = baseDef(e);
    const hpF = Math.max(1, (b && b.hp) || e.hpMax || 1), atkF = (b && b.dmg) || 0;
    const hpMul = e.hpMax > 0 ? e.hpMax / hpF : 1, dmgMul = atkF > 0 ? (e.dmg || 0) / atkF : 0;   // 原本所有的加成（深度、分級、變體、條款、連線……）
    const hpI = R.isHPI(hpF, is, k), atkI = atkF > 0 ? R.isATKI(atkF, is, k) : 0;
    const hp = Math.max(1, hpI * hpMul), dmg = atkF > 0 ? atkI * dmgMul : (e.dmg || 0);
    const f = e.hpMax > 0 ? e.hp / e.hpMax : 1; e.hpMax = hp; e.hp = hp * f; e.dmg = dmg;
    e.isBase = { hpF, hpI, hp: Math.round(hp), atkF, atkI, dmg: Math.round(dmg * 10) / 10 };
  };
  const se0 = R.spawnEnemy;
  R.spawnEnemy = (id, x, z, room, o) => { const run = W().run, outer = run && run.isRealFloor == null; if (outer) run.isRealFloor = run.floor; let e; try { e = se0(id, x, z, room, o); } finally { if (outer) run.isRealFloor = null; } try { if (e) apply(e, o); } catch (err) { console.warn('[ruinis]', err); } return e; };
  R.ruinISApply = apply;

  // ---------- 被打過的時間（回血暫停） ----------
  const he0 = R.hurtEnemy;
  R.hurtEnemy = (e, raw, o) => { if (e) e.isHurtT = 3; return he0(e, raw, o); };

  // ---------- 戰術 ----------
  const STILL = /burrow|sinkhole|wellhand|wyrm|hooktail|dropper|tentacle|sentry|turret|wall|mimic|thief|ambush|lord|core|boss/;
  const canTac = e => !e.dead && !e.dormant && e.aggro && !e.mirror && !e.standin && !e.def.boss && e.id !== 'petra' && !isLord(e.def) && (e.def.speed || 0) > 0.8 && !STILL.test(e.def.ai || '') && !e.up && !e.under;
  const wrapA = a => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const okAt = (x, z) => (!R.isFloor || R.isFloor(x, z)) && !(R.pointBlocked && R.pointBlocked(x, z));
  // 往 (tx,tz) 走；擋住了就試偏一點的方向，都不行就放棄（回到原本的 AI）
  const steer = (e, tx, tz, sp, dt) => {
    const a0 = Math.atan2(tx - e.x, tz - e.z), step = sp * dt, look = Math.max(0.6, step * 3);
    for (const off of [0, 0.5, -0.5, 1, -1, 1.6, -1.6]) {
      const a = a0 + off, nx = e.x + Math.sin(a) * look, nz = e.z + Math.cos(a) * look;
      if (okAt(nx, nz)) { e.x += Math.sin(a) * step; e.z += Math.cos(a) * step; if (R.collide) R.collide(e, (e.def.size || 1) * 0.5); return true; }
    }
    return false;
  };
  const tgtOf = e => e.tgt || W().P;
  const lowOrUlt = P => !!P && ((P.hpMax > 0 && P.hp / P.hpMax < 0.25) || (!P.ally && (P.ult || 0) >= 100));
  const startTac = (e, P, kind) => {
    const run = W().run, t = run.t || 0, a = Math.atan2(e.x - P.x, e.z - P.z);
    e.tac = { k: kind, t0: t, dur: kind === 'patrol' ? 2 + rnd() * 2 : kind === 'flee' ? 1 + rnd() * 0.6 : kind === 'retreat' ? 99 : 3.5, r: 2 + rnd() * 2, dir: rnd() < 0.5 ? 1 : -1, ang: a, wait: 0 };
  };
  const decide = (e, P) => {
    const is = e.is || 0, p = Math.min(TAC_CAP, TAC_PER * is), d = Math.hypot(e.x - P.x, e.z - P.z);
    // 遠離：玩家快倒下或大招集滿，15%
    const lu = lowOrUlt(P);
    if (lu && !e.luSeen) { e.luSeen = 1; if (rnd() < 0.15) return startTac(e, P, 'retreat'); }
    if (!lu) e.luSeen = 0;
    if (d > 12 || rnd() >= p) return;
    const allies = W().enemies.filter(o => o !== e && !o.dead && o.aggro && Math.hypot(o.x - P.x, o.z - P.z) < 8).length;
    const r = rnd();
    if (allies >= 1 && r < 0.3) return startTac(e, P, 'flank');   // 合作：繞到同伴的另一邊包夾
    if (r < 0.55) return startTac(e, P, 'patrol');                 // 巡邏：2～4 公尺繞圈
    if (r < 0.75 && d < 4) return startTac(e, P, 'flee');          // 短暫逃跑
    return startTac(e, P, 'sneak');                                 // 偷襲：繞到背後
  };
  const before = new Map();
  const ue0 = R.updateEnemies;
  R.updateEnemies = dt => {
    const w = W(), run = w.run, on = active(run) && !guest(run) && w.enemies;
    if (on) { before.clear(); for (const e of w.enemies) if (e.tac && !e.dead) before.set(e, [e.x, e.z]); }
    ue0(dt);
    if (!on) return;
    const t = run.t || 0;
    for (const e of w.enemies) {
      if (e.dead || skip(e)) continue;
      // 回血
      if (e.is) { e.isHurtT = Math.max(0, (e.isHurtT || 0) - dt); if (!e.isHurtT && e.hp < e.hpMax && e.hp > 0) e.hp = Math.min(e.hpMax, e.hp + e.hpMax * Math.min(REGEN_CAP, REGEN_PER * e.is) * dt); }
      if (!canTac(e)) { e.tac = null; continue; }
      const P = tgtOf(e); if (!P || P.dead || P.downed) { e.tac = null; continue; }
      if (!e.tac) { e.tacT = (e.tacT == null ? 1 + rnd() * 2 : e.tacT) - dt; if (e.tacT <= 0) { e.tacT = 2.5 + rnd() * 1.5; decide(e, P); } if (!e.tac) continue; }
      const T = e.tac, b = before.get(e); if (b) { e.x = b[0]; e.z = b[1]; }   // 這一格由戰術決定位置
      const stun = e.st && (e.st.stun > 0 || e.st.root > 0); if (stun) { continue; }
      const sp = e.speed * (e.st && e.st.slow > 0 ? 0.55 : 1), d = Math.hypot(e.x - P.x, e.z - P.z), el = t - T.t0;
      let done = el > T.dur, moved = true;
      if (T.k === 'patrol') {
        T.ang += T.dir * sp * 0.8 / Math.max(1.5, T.r) * dt;
        moved = steer(e, P.x + Math.sin(T.ang) * T.r, P.z + Math.cos(T.ang) * T.r, sp * (Math.abs(d - T.r) > 1.5 ? 1 : 0.8), dt);
        e.cd = Math.max(e.cd, 0.15);
        // 時機：玩家背對牠、或正在出手
        const face = P.yaw != null ? Math.abs(wrapA(Math.atan2(e.x - P.x, e.z - P.z) - P.yaw)) : 0;
        if (el > 1.5 && face > 1.9) done = true;
      } else if (T.k === 'flank') {
        const mates = w.enemies.filter(o => o !== e && !o.dead && o.aggro && Math.hypot(o.x - P.x, o.z - P.z) < 8);
        if (!mates.length) done = true; else { const m = mates[0], a = Math.atan2(P.x - m.x, P.z - m.z); moved = steer(e, P.x + Math.sin(a) * 2.2, P.z + Math.cos(a) * 2.2, sp * 1.1, dt); if (Math.hypot(e.x - P.x - Math.sin(a) * 2.2, e.z - P.z - Math.cos(a) * 2.2) < 0.8) done = true; }
        e.cd = Math.max(e.cd, 0.1);
      } else if (T.k === 'flee') {
        moved = steer(e, e.x + (e.x - P.x) * 3, e.z + (e.z - P.z) * 3, sp * 1.3, dt); e.cd = Math.max(e.cd, 0.2);
      } else if (T.k === 'sneak') {
        const ya = P.yaw || 0, bx = P.x - Math.sin(ya) * 1.6, bz = P.z - Math.cos(ya) * 1.6;
        moved = steer(e, bx, bz, sp * 1.15, dt); e.cd = Math.max(e.cd, 0.1);
        if (Math.hypot(e.x - bx, e.z - bz) < 0.9) { done = true; e.cd = 0; e.sneakHit = 1; }
      } else if (T.k === 'retreat') {
        if (!T.wait) {
          if (d < 7) moved = steer(e, e.x + (e.x - P.x) * 3, e.z + (e.z - P.z) * 3, sp * 1.2, dt);
          else { T.wait = 4 + rnd() * 2; T.w0 = t; }
          if (!moved || el > 6) { T.wait = 4 + rnd() * 2; T.w0 = t; }   // 退不了（牆角）：原地觀望
          e.cd = Math.max(e.cd, 0.3);
        } else {
          e.cd = Math.max(e.cd, 0.3); e.yaw = Math.atan2(P.x - e.x, P.z - e.z);
          if (d < 7 && !T.inside) { T.inside = 1; if (rnd() < 0.35) { T.wait = 0; T.t0 = t; } else { done = true; e.cd = 0; } }   // 走進 7 公尺：35% 再退、65% 直接撲上來
          else if (d >= 7) T.inside = 0;
          if (T.wait && t - T.w0 > T.wait) done = true;   // 等完：重新計算
        }
      }
      if (!moved && T.k !== 'retreat') done = true;   // 卡住了：回到原本的 AI
      if (T.k !== 'retreat' || !T.wait) e.yaw = Math.atan2(P.x - e.x, P.z - e.z);
      if (e.m && e.m.g) e.m.g.position.set(e.x, e.m.g.position.y, e.z);
      if (done) { e.tac = null; e.tacT = 1.5 + rnd() * 2; }
    }
  };
  // 偷襲得手：下一下 ×1.25
  const hp0 = R.hurtPlayer;
  if (hp0) R.hurtPlayer = (dmg, src, o) => { if (src && src.sneakHit) { src.sneakHit = 0; dmg *= 1.25; } return hp0(dmg, src, o); };

  // ---------- 漏網的（成群的那幾隻用內層生的）：每一格補上 ----------
  const st0 = R.step;
  R.step = dt => { st0(dt); const w = W(), run = w.run; if (!active(run) || !w.enemies) return; for (const e of w.enemies) if (!e.isDone && !e.dead) { try { apply(e); } catch (err) { } } };

  // ---------- 名牌 ----------
  try { const s = document.createElement('style'); s.textContent = '.mtag .mis{grid-column:1/3;grid-row:1;justify-self:center;text-decoration:none;font-size:10px;color:#9FD8FF;line-height:1.1}.mtag .mis:empty{display:none}.mtag img,.mtag .mg{grid-row:2/span 2}.mtag b{grid-row:2}.mtag i{grid-row:3}'; document.head.appendChild(s); } catch (e) { }
})(window.R);
