// shots2.js: drop 1 → end.
let SYNC = {};                                     // lip-sync lags per singer plate (tools/lipsync.py → data/sync.json)
const lagOf = id => (SYNC[id] && SYNC[id].use !== false ? (SYNC[id].lag ?? 0) : 0);
const SEG = { jade_hook1: 30.9, jade_hook2: 67.4, jade_brk: 110.4, jade_art: 118.4, jade_hook3: 142.9 };
const tpSing = (id, t) => t - SEG[id];              // re-mouthed: the plate's own lip timing no longer matters

// member ID card (K-pop style): portrait plate on the right, name block on the left
async function idCard(t, lt, dur, o) {
  paper(G, 'night');
  await drawPlate(t, o.plate, .3 + lt * .9, { view: { zoom: 1.02, ox: 330 }, hatch: { spacing: 6 } });
  const L = typeLayer(), g = L.g, k = n => clamp((lt - n * .12) / .18);
  // rules
  g.globalAlpha = .7; g.fillStyle = P[o.accent]; g.fillRect(110, 250, 560 * expoOut(k(0)), 6); g.globalAlpha = 1;
  text(g, o.num, 110, 230, { font: FONT.mono(34, 800), col: o.accent, alpha: k(0) });
  text(g, o.en1, 104, 400, { font: FONT.impact(150), col: 'white', alpha: k(1) });
  text(g, o.en2, 104, 540, { font: FONT.impact(150), col: 'white', alpha: k(2) });
  text(g, o.ru, 110, 612, { font: FONT.cyr(50), col: 'verm', alpha: k(3), ls: 2 });
  o.stats.forEach((s, i) => tele(g, s, 112, 700 + i * 42, t, o.t0 + .5 + i * .22, { size: 25, weight: i ? 400 : 700, col: i ? 'silver' : 'white', dur: .35 }));
  typeFlush(L, drawClock(t, 12).n, .3);
}

async function initShots2() {
  try { SYNC = await loadJSON('data/sync.json'); } catch (e) { SYNC = {}; }
  const S = sec => secT(sec);

  // ============================== DROP 1 · 70.94 → 104.60 ==============================
  const [d10, d11] = S('drop1').slice(1), D1 = linesIn('drop1');
  const b0 = beatN(d10 + .01);                             // first beat of the drop
  const bt = n => B(b0 + n);
  const orbitCut = [['capsule_glide', 1.0, { zoom: 1.02 }], ['ship_wide_sunrise', 2.5, { zoom: 1.1 }], ['porthole_sunrise', 2.4, { zoom: 1.04 }], ['hero_sunrise', 6.5, { zoom: 1.06, ox: 150 }]];
  shot('D1_voskhod', d10, bt(16), async (t, lt) => {
    paper(G, 'night');
    const n = Math.floor((beatPos(t) - b0) / 4), c = orbitCut[clamp(n, 0, 3)];
    const z = punch(t, .03);
    await withZoom(z, () => drawPlate(t, c[0], c[1] + (t - bt(n * 4)), { view: c[2] }));
    // flash on each cut
    const since = t - bt(n * 4); if (since < .07) { G.fillStyle = P.white; G.globalAlpha = .5 * (1 - since / .07); G.fillRect(0, 0, W, H); G.globalAlpha = 1; }
    lyricStack(t, [{ s: 'ВОСХОД-2', t: d10, x: W / 2, y: 640, font: FONT.cyr(300), col: 'verm', align: 'center', style: 'slam', alpha: clamp(1 - (lt - 1.6) / .5) }]);
    const Lt = typeLayer(), sun = 1 + Math.max(0, n) * 4 + Math.floor(frac((beatPos(t) - b0) / 4) * 4);
    tele(Lt.g, `ORBIT ${String(2 + Math.floor(lt / 1.5)).padStart(2, '0')}`, 60, 64, t, d10, { size: 22, weight: 800, col: 'white', instant: true });
    tele(Lt.g, `SUNRISES SEEN: ${String(Math.min(17, sun)).padStart(2, '0')}`, W - 60, 64, t, d10, { size: 22, weight: 800, col: 'gold', instant: true, align: 'right' });
    tele(Lt.g, 'ONE EVERY 90 MINUTES', W - 60, 100, t, d10 + 1.8, { size: 18, col: 'silver', dur: .5, align: 'right' });
    typeFlush(Lt, drawClock(t, 12).n, .3);
  });
  shot('D2_id_leonov', bt(16), bt(24), async (t, lt, dur) => idCard(t, lt, dur, {
    plate: 'leonov_turn', t0: bt(16), num: '01', accent: 'gold', en1: 'ALEXEI', en2: 'LEONOV', ru: 'АЛЕКСЕЙ ЛЕОНОВ',
    stats: ['PILOT-COSMONAUT · AGE 30 · CALLSIGN «АЛМАЗ-2»', 'FIRST HUMAN IN OPEN SPACE', 'TRAINED AS A PAINTER — PACKED COLORED PENCILS'] }));
  shot('D3_id_belyayev', bt(24), bt(32), async (t, lt, dur) => idCard(t, lt, dur, {
    plate: 'belyayev_turn', t0: bt(24), num: '02', accent: 'sky', en1: 'PAVEL', en2: 'BELYAYEV', ru: 'ПАВЕЛ БЕЛЯЕВ',
    stats: ['COMMANDER · AGE 39 · CALLSIGN «АЛМАЗ-1»', 'FIGHTER PILOT', 'FLEW THE FIRST MANUAL RE-ENTRY'] }));
  // Leonov draws the sunrise; the vocal chops hit as words
  const w0 = D1[0].words;
  shot('D4_drawing', bt(32), bt(48), async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'drawing_pencils', .2 + lt * .9, { view: { zoom: 1.03 }, hatch: { spacing: 6 } });
    chopWords(t, [[w0[0][0], 'SUN', W / 2, 560, 260, 'gold'], [w0[1][0] + .3, 'RISE', W / 2, 560, 260, 'gold'], [w0[3][0], 'BRING ME', W / 2, 560, 200], [w0[4][0] + .15, 'HOME', W / 2, 600, 280, 'white']], { hold: .9 });
    const Lt = typeLayer();
    tele(Lt.g, 'PENCILS TIED TO HIS WRIST WITH STRING', 60, H - 60, t, bt(33), { size: 22, weight: 700, col: 'white', dur: .8 });
    typeFlush(Lt, drawClock(t, 12).n, .3);
  });
  // his drawing, reconstructed on a small sheet floating in the dark cabin
  shot('D5_the_drawing', bt(48), D1[1].t0 - .05, async (t, lt, dur) => {
    paper(G, 'night');
    const { n: d } = drawClock(t, 12), pen = new Pen(), L = layer(1);
    const drift = [Math.sin(lt * .6) * 14, Math.cos(lt * .5) * 10], rot = Math.sin(lt * .4) * .03;
    const sw = 1440, sh = 900, cx = W / 2 + drift[0], cy = H / 2 - 20 + drift[1];
    // the sheet: white paper card
    G.save(); G.translate(cx, cy); G.rotate(rot); G.drawImage(PAPER.snow, 400, 200, sw, sh, -sw / 2, -sh / 2, sw, sh);
    G.strokeStyle = 'rgba(0,0,0,.25)'; G.lineWidth = 2; G.strokeRect(-sw / 2, -sh / 2, sw, sh); G.restore();
    // the bands draw themselves across the sheet (Leonov's composition: horizon arc, colored bands, the sun)
    const k = easeOut(clamp(lt / (dur * .8)));
    const ecx = cx - 60, ecy = cy + 1500, R = 1420;
    const Ls = layer(2), p2 = new Pen();
    earthDisc(p2, ecx, ecy, R, 1, { lit: .5, spacing: 9, jseed: d });
    sunriseBands(p2, ecx, ecy, R, -Math.PI / 2 - .5, -Math.PI / 2 + .5 * (2 * k - 1), k, 2, { sunA: -Math.PI / 2 + .12, thick: 70, n: 1500, jseed: d });
    raysFrom(p2, ecx + Math.cos(-Math.PI / 2 + .12) * R, ecy + Math.sin(-Math.PI / 2 + .12) * R - 10, { n: 160, r0: 6, r1: 260 * k, energy: k, seed: 9, jseed: d, a0: Math.PI, a1: TAU });
    p2.flush(Ls.g, ORDER_SNOW);
    // clip the drawing to the sheet
    Ls.g.globalCompositeOperation = 'destination-in'; Ls.g.save(); Ls.g.translate(cx, cy); Ls.g.rotate(rot); Ls.g.fillRect(-sw / 2 + 20, -sh / 2 + 20, sw - 40, sh - 40); Ls.g.restore(); Ls.g.globalCompositeOperation = 'source-over';
    toothIn(Ls, d); G.globalCompositeOperation = 'multiply'; G.drawImage(Ls.c, 0, 0); G.globalCompositeOperation = 'source-over';
    const Lt = typeLayer();
    Lt.g.save(); Lt.g.translate(cx, cy); Lt.g.rotate(rot);
    text(Lt.g, 'А. Леонов  18.III.1965', -sw / 2 + 40, -sh / 2 + 60, { font: FONT.serif(40), col: 'graphite', alpha: clamp((lt - .6) / .5) });
    Lt.g.restore();
    tele(Lt.g, 'THE FIRST WORK OF ART MADE IN SPACE', W / 2 - 330, H - 70, t, bt(49), { size: 28, weight: 800, col: 'gold', dur: .8 });
    typeFlush(Lt, d, .3);
  });
  // the grid: every beat a panel changes; vocal chops as words
  const GRID = [['hero_sunrise', 7], ['glove_cu', 2], ['visor_cu', 3], ['airlock_exit', 4], ['porthole_sunrise', 3], ['capsule_glide', 4], ['drawing_pencils', 5], ['globus', 2], ['ship_wide_sunrise', 3], ['leonov_turn', 3.5], ['belyayev_turn', 3.5], ['helmet_off', 3]];
  shot('D6_grid', D1[1].t0 - .05, d11, async (t, lt) => {
    paper(G, 'night');
    const bp = beatPos(t), n = Math.floor(bp);
    const three = t > D1[2].t0 - .05;                         // 2x2, then 3x3 for the last repeats
    const cols = three ? 3 : 2, rows = cols, gap = 14, pw = (W - gap * (cols + 1)) / cols, ph = (H - gap * (rows + 1)) / rows;
    const cells = cols * rows;
    for (let i = 0; i < cells; i++) {
      const pick = GRID[(i * 5 + Math.floor((n - i) / 2) * 3 + 99) % GRID.length];
      const x = gap + (i % cols) * (pw + gap), y = gap + Math.floor(i / cols) * (ph + gap);
      await drawPlateIn(t, pick[0], pick[1] + frac(bp / 2) * .8, [x, y, pw, ph], { spacing: three ? 9 : 7.5, aw: 320, ah: 180, face: false, silhouette: false, contour: { minLen: 5 } });
    }
    const wz = [...D1[1].words, ...D1[2].words, ...D1[3].words];
    chopWords(t, wz.filter((w, i) => i % 5 === 1 || i % 5 === 4).map(w => [w[0], w[1].replace(/[,.]/g, '').toUpperCase() === 'SUNRISE' ? 'SUNRISE' : 'HOME', W / 2, H / 2 + 100, 300, w[1].startsWith('home') ? 'white' : 'gold']), { hold: .6 });
  });

  // ============================== BREAKDOWN · 104.60 → 118.00 ==============================
  const [br0, br1] = S('brk').slice(1), BR = linesIn('brk');
  // split page: her white paper (left) and his black paper (right)
  shot('B1_split', br0, BR[2].t0 - .05, async (t, lt, dur) => {
    paper(G, 'night');
    const split = W * lerp(.5, .5, 0);
    await drawPlateIn(t, 'jade_hands', 1 + lt * .8, [0, 0, split, H], { paper: 'snow', frame: false, spacing: 6.5, zoom: 1.05 });
    await drawPlateIn(t, lt < dur / 2 ? 'valve_bleed' : 'tumble_slow', .8 + (lt % (dur / 2)), [split, 0, W - split, H], { paper: 'night', frame: false, spacing: 6.5, zoom: 1.08 });
    const pen = new Pen(), L = layer(4), d = drawClock(t, 12).n;
    const q = []; for (let y = 0; y <= H; y += 30) q.push([split + (hash2(y, d) - .5) * 3, y]); pen.poly(q, 'lead', 2.2, .9, .02); pen.flush(L.g); G.drawImage(L.c, 0, 0);
    subtitle(G, lineAt(t), t, { size: 58, y: H - 90, shadow: 6, split: { x: split, left: 'graphite', right: 'cream' } });
  });
  shot('B2_float', BR[2].t0 - .05, BR[3].t0 - .05, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'jade_brk', tpSing('jade_brk', t), { remouth: true, paper: 'snow', view: { zoom: 1.02 }, hatch: { spacing: 6.2, mask: quiet([[W / 2 - 760, H - 175, W / 2 + 760, H - 45]], .7) } });
    subtitle(G, lineAt(t), t, { size: 64, col: 'graphite', y: H - 90 });
  });
  shot('B3_never', BR[3].t0 - .05, br1, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'jade_brk', tpSing('jade_brk', t), { remouth: true, paper: 'snow', view: { zoom: 1.08, cy: .45 }, hatch: { spacing: 6.2, mask: quiet([[W / 2 - 760, H - 175, W / 2 + 760, H - 45]], .7) } });
    subtitle(G, lineAt(t), t, { size: 64, col: 'graphite', y: H - 90 });
  });

  // ============================== ART · 118.00 → 129.70 ==============================
  const [ar0, ar1] = S('art').slice(1), AR = linesIn('art');
  const snowfall = (t, seed, n = 90) => {
    const pen = new Pen(), L = layer(4), d = drawClock(t, 12).n;
    for (let i = 0; i < n; i++) {
      const sp = 40 + 50 * hash2(i, seed), x = (hash2(i, seed + 1) * W + Math.sin(t * .7 + i) * 30) % W, y = (hash2(i, seed + 2) * H + t * sp) % (H + 40) - 20;
      const r = 1.5 + 2.5 * hash2(i, seed + 3);
      pen.l(x - r, y, x + r, y, 'lead', 1.2, .55); pen.l(x, y - r, x, y + r, 'lead', 1.2, .55);
    }
    pen.flush(L.g); toothIn(L, d); G.drawImage(L.c, 0, 0);
  };
  shot('A1_snow', ar0, AR[1].t0 - .05, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'jade_art', tpSing('jade_art', t), { remouth: true, paper: 'snow', rate: 8, view: { zoom: 1.02 }, hatch: { spacing: 6.2 } });
    snowfall(t, 3);
    const w = AR[0].words;
    handwrite(t, 'Art is a landing in the snow', W / 2, 190, w[0][0] - .1, w[6][0] + .5, { size: 104, align: 'center', col: 'graphite' });
  });
  shot('A2_hands', AR[1].t0 - .05, ar1, async (t, lt) => {
    paper(G, 'snow');
    const half = W / 2;
    await drawPlateIn(t, 'drawing_pencils', 2.5 + lt * .8, [0, 0, half, H], { paper: 'night', frame: false, spacing: 6.2, zoom: 1.15, cy: .6 });
    await drawPlateIn(t, 'jade_hands', 3 + lt * .8, [half, 0, half, H], { paper: 'snow', frame: false, spacing: 6.2, zoom: 1.08 });
    const Lt = typeLayer(); tele(Lt.g, '1965', 40, 70, t, AR[1].t0, { size: 26, weight: 800, col: 'white', instant: true }); tele(Lt.g, 'NOW', half + 40, 70, t, AR[1].t0, { size: 26, weight: 800, col: 'graphite', instant: true }); typeFlush(Lt, 0, .3);
    subtitle(G, lineAt(t), t, { size: 60, y: H - 90, shadow: 6, split: { x: half, left: 'cream', right: 'graphite' } });
  });

  // ============================== BUILD · 129.70 → 143.20 ==============================
  const [bd0, bd1] = S('build').slice(1), BD = linesIn('build');
  shot('G1_failed', bd0, BD[1].t0 - .05, async (t, lt) => {
    paper(G, 'night');
    const glitch = Math.floor(t * 12) % 7 === 0 ? 1 : 0;
    await drawPlate(t, lt < 1.5 ? 'red_warning' : 'globus', lt < 1.5 ? .5 + lt : 1 + lt, { view: { zoom: 1.03, ox: glitch * 18 } });
    const w = BD[0].words;
    lyricStack(t, [
      { s: 'GUIDANCE', t: w[0][0], x: 110, y: 380, size: 200, col: 'verm', style: 'slam' },
      { s: 'FAILED', t: w[1][0], x: 110, y: 580, size: 200, col: 'verm', style: 'slam' },
      { s: 'ОТКАЗ АВТОМАТИКИ', t: w[1][0] + .25, x: 116, y: 660, font: FONT.cyr(56), col: 'white', style: 'type', dur: .4, ls: 3 },
      { s: 'AND THE CAPSULE SPUN', t: w[2][0], x: 116, y: 740, font: FONT.mono(34, 800), col: 'white', style: 'type', dur: .5 },
    ]);
  });
  shot('G2_math', BD[1].t0 - .05, BD[2].t0 - .05, async (t, lt) => {
    paper(G, 'night');
    const spin = lt * .35;
    await drawPlate(t, 'vzor_manual', .5 + lt, { view: { zoom: 1.1, rot: Math.sin(spin) * .06 } });
    // hand-written orbital arithmetic circling the frame
    const Lt = typeLayer(), eq = ['Δv = 106 m/s', 't = 22 s', 'θ ≈ 90°', 'ОРИЕНТАЦИЯ — РУЧНАЯ', 'h = 497 km', '±1°'];
    eq.forEach((s, i) => { const a = spin + i / eq.length * TAU, r = 430; text(Lt.g, s, W / 2 + Math.cos(a) * r * 1.6, H / 2 + Math.sin(a) * r * .8, { font: FONT.serif(46), col: i === 3 ? 'verm' : 'cream', alpha: clamp((lt - i * .15) / .3) * .9, align: 'center', rot: Math.sin(a) * .2 }); });
    typeFlush(Lt, drawClock(t, 12).n, .4);
    const w = BD[1].words;
    lyricStack(t, [{ s: 'DOING THE MATH', t: w[0][0], x: W / 2, y: 520, size: 150, align: 'center', style: 'rise' }, { s: 'WITH A SPINNING SUN', t: w[3][0], x: W / 2, y: 640, size: 110, align: 'center', style: 'rise', col: 'gold' }]);
  });
  const HO = BD[2].words; // hold on ×3
  const holds = [[HO[0][0], 'retrofire', .3, 170], [HO[2][0], 'capsule_spin', .4, 240], [HO[4][0], 'g_force', .6, 330]];
  shot('G3_hold', BD[2].t0 - .05, bd1, async (t, lt, dur) => {
    paper(G, 'night');
    let cur = holds[0]; for (const h of holds) if (t >= h[0] - .05) cur = h;
    const riser = clamp((t - 139.5) / (bd1 - 139.5));
    const shake = 6 + riser * 22;
    await drawPlate(t, cur[1], cur[2] + (t - cur[0]), { rate: riser > .3 ? 24 : 12, view: { zoom: 1.05 + riser * .15, ox: (hash(Math.floor(t * 24)) - .5) * shake, oy: (hash(Math.floor(t * 24) + 7) - .5) * shake },
      extra: (pen) => edgePanic(pen, .35 + riser * .65, drawClock(t, 24).n * 13) });
    const idx = holds.indexOf(cur);
    lyricStack(t, [{ s: 'HOLD ON', t: cur[0], x: W / 2, y: H / 2 + cur[3] * .35, size: cur[3], align: 'center', style: 'slam', col: idx === 2 ? 'gold' : 'white' }]);
    if (t > bd1 - .12) { G.fillStyle = P.cream; G.globalAlpha = clamp((t - (bd1 - .12)) / .12); G.fillRect(0, 0, W, H); G.globalAlpha = 1; }
  });

  // ============================== HOOK 3 · 143.20 → 152.63 · re-entry burns through to her ==============================
  const [h30, h31] = S('hook3').slice(1), H3 = linesIn('hook3');
  shot('F1_reentry', h30, H3[1].t0 - .05, async (t, lt, dur) => {
    paper(G, 'night');
    await drawPlate(t, 'reentry_fire', .5 + lt, { rate: 24, view: { zoom: 1.04 } });
    const w = H3[0].words, d = drawClock(t, 12).n;
    lyricStack(t, [{ s: 'ORBITAL', t: w[0][0], x: 100, y: 380, size: 220 }, { s: 'SUNRISE', t: w[1][0], x: 100, y: 600, size: 220 }]);
    if (t >= w[2][0]) hatchedText('BURNING GOLD', 106, 800, FONT.impact(170), { cols: ['gold', 'orange', 'verm', 'white'], edge: 'gold', seed: 45, jseed: d, drawIdx: d, alpha: clamp((t - w[2][0]) / .1) });
    // the page burns through, revealing her world
    const r = Math.pow(clamp((t - (H3[1].t0 - 1.6)) / 1.6), 2) * 1500;
    if (r > 0) await burnThrough(t, W * .66, H * .5, r, async () => {
      paper(G, 'snow');
      await drawPlate(t, 'jade_hook3', tpSing('jade_hook3', t), { remouth: true, paper: 'snow', view: { zoom: 1.03 } });
    });
  });
  shot('F2_home', H3[1].t0 - .05, h31, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'jade_hook3', tpSing('jade_hook3', t), { remouth: true, paper: 'snow', view: { zoom: 1.03 } });
    const w = H3[1].words;
    lyricStack(t, [{ s: 'ORBITAL SUNRISE', t: w[0][0], x: 110, y: 200, size: 120, col: 'graphite', style: 'rise' }, { s: 'bring me home', t: w[2][0], x: 110, y: H - 130, font: FONT.serif(130), col: 'crimson', style: 'rise' }]);
  });

  // ============================== DROP 2 · 152.63 → 176.80 ==============================
  const [d20, d21] = S('drop2').slice(1), D2 = linesIn('drop2');
  const b2 = beatN(d20 + .01), bt2 = n => B(b2 + n);
  shot('E1_chute', d20, bt2(16), async (t, lt) => {
    paper(G, 'snow');
    await withZoom(punch(t, .03), () => drawPlate(t, 'parachute', .6 + lt * .9, { paper: 'snow', view: { zoom: 1.03 } }));
    if (lt < .1) { G.fillStyle = P.snow; G.globalAlpha = .6 * (1 - lt / .1); G.fillRect(0, 0, W, H); G.globalAlpha = 1; }
    const Lt = typeLayer();
    tele(Lt.g, 'MAIN PARACHUTE — OPEN', 60, 64, t, d20 + .3, { size: 24, weight: 800, col: 'graphite', dur: .5 });
    tele(Lt.g, 'ALTITUDE 5 KM', 60, 100, t, d20 + .9, { size: 20, col: 'lead', dur: .4 });
    typeFlush(Lt, drawClock(t, 12).n, .3);
  });
  shot('E2_map', bt2(16), D2[0].t0 - .3, async (t, lt) => {
    paper(G, 'snow');
    descentMap(t, bt2(16), { dur: 4.2 });
  });
  shot('E3_offcourse', D2[0].t0 - .3, d21, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'descent_forest', .5 + lt * .5, { paper: 'snow', lines: { contrast: 2.4, white: .7 }, view: { zoom: 1.03, rot: Math.sin(lt * .5) * .03 } });
    const items = [];
    for (const l of D2) { items.push([l.words[0][0], 'OFF COURSE', W / 2, 560, 240, 'verm']); items.push([l.words[2][0], "(BUT I'M)", W / 2, 520, 150, 'graphite']); items.push([l.words[4][0], 'HOME', W / 2, 600, 300, 'graphite']); }
    chopWords(t, items, { hold: .55 });
  });

  // ============================== OUTRO · 176.80 → 189.64 ==============================
  const [o0, o1] = S('outro').slice(1), OU = linesIn('outro');
  shot('O1_klicks', o0, OU[1].t0 - .05, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'descent_forest', 5 + lt * .5, { paper: 'snow', lines: { contrast: 2.4, white: .7 }, hatch: { mask: quiet([[60, 170, 1120, 670]]) }, view: { zoom: 1.12 } });
    const w = OU[0].words;
    lyricStack(t, [
      { s: 'FIFTEEN HUNDRED', t: w[0][0], x: 100, y: 300, size: 150, style: 'rise', col: 'graphite' },
      { s: 'KLICKS', t: w[2][0], x: 100, y: 470, size: 180, style: 'slam', col: 'orange' },
      { s: 'COMING IN HOT', t: w[3][0], x: 100, y: 640, size: 150, style: 'slam', col: 'verm' },
    ]);
  });
  shot('O2_overshot', OU[1].t0 - .05, OU[2].t0 - .05, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'treetops', .1 + lt * .35, { paper: 'snow', lines: { contrast: 2.2, white: .6 }, hatch: { mask: quiet([[W / 2 - 720, 150, W / 2 + 720, 490]]) }, view: { zoom: 1.05 } });
    const w = OU[1].words;
    lyricStack(t, [{ s: 'FIFTEEN HUNDRED KLICKS', t: w[0][0], x: W / 2, y: 260, size: 120, align: 'center', style: 'rise', col: 'graphite' }, { s: 'WE OVERSHOT', t: w[3][0], x: W / 2, y: 460, size: 200, align: 'center', style: 'slam', col: 'verm' }]);
  });
  shot('O3_madeit', OU[2].t0 - .05, o1, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'treetops', 1.72 + lt * .48, { paper: 'snow', rate: 24, lines: { contrast: 2.2, white: .62 }, hatch: { mask: quiet([[W / 2 - 330, 180, W / 2 + 330, 720]]) }, view: { zoom: 1.08 } });
    const w = OU[2].words;
    lyricStack(t, [{ s: 'MADE', t: w[0][0], x: W / 2, y: 330, size: 170, align: 'center', col: 'graphite' }, { s: 'IT', t: w[1][0], x: W / 2, y: 500, size: 170, align: 'center', col: 'graphite' }, { s: 'DOWN', t: w[2][0], x: W / 2, y: 700, size: 230, align: 'center', col: 'verm' }]);
  }, { ones: true });

  // ============================== LANDED · 189.64 → 226.55 · the page turns white ==============================
  const [l0, l1] = S('landed').slice(1);
  const HOME1 = OU[3], MADE2 = OU[4], HOME2 = OU[5];
  shot('L1_impact', l0, HOME1.t0 - .05, async (t, lt) => {
    paper(G, 'snow');
    const shake = Math.exp(-lt * 5) * 14, dn = drawClock(t, lt < .6 ? 24 : 12).n;
    await drawPlate(t, 'treetops', 2.66 + lt * .7, { paper: 'snow', rate: lt < .6 ? 24 : 12, lines: { contrast: 2.2, white: .72 },
      view: { zoom: 1.05 + .06 * Math.exp(-lt * 3), ox: (hash(dn) - .5) * shake, oy: (hash(dn + 7) - .5) * shake },
      extra: (pen) => {
        const bx = W * .46, by = H * .86, e1 = Math.exp(-lt * 3.2), e2 = Math.sin(clamp(lt / 1.8) * Math.PI);
        if (e1 > .04) raysFrom(pen, bx, by, { n: 420, r0: 20, r1: 900, energy: e1, seed: 71, jseed: dn, cols: ['gold', 'orange', 'orange', 'verm'], a0: Math.PI * 1.02, a1: Math.PI * 1.98, w: [1.4, 3], alpha: [.45, .95] });
        if (e2 > .04) raysFrom(pen, bx, by, { n: 560, r0: 60, r1: 1500, energy: e2, seed: 77, jseed: dn, cols: ['lead', 'graphite', 'sky', 'lead', 'cobalt'], a0: Math.PI * 1.04, a1: Math.PI * 1.96, w: [1.1, 2.4], alpha: [.25, .75] });
      } });
    if (lt < .25) { G.fillStyle = P.snow; G.globalAlpha = 1 - lt / .25; G.fillRect(0, 0, W, H); G.globalAlpha = 1; }
  }, { ones: true });
  shot('L2_home', HOME1.t0 - .05, MADE2.t0 - .05, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'hatch_exit', .5 + lt * .9, { paper: 'snow', view: { zoom: 1.03 } });
    lyricStack(t, [{ s: 'HOME.', t: HOME1.t0, x: W / 2, y: 380, size: 280, align: 'center', col: 'graphite', style: 'rise' }]);
  });
  shot('L3_madeit', MADE2.t0 - .05, HOME2.t0 - .05, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'two_men_snow', .5 + lt * .9, { paper: 'snow', view: { zoom: 1.03 } });
    lyricStack(t, [{ s: 'MADE IT DOWN', t: MADE2.t0, x: W / 2, y: 220, size: 150, align: 'center', col: 'graphite', style: 'rise' }]);
  });
  shot('L4_fire', HOME2.t0 - .05, 206.2, async (t, lt) => {
    paper(G, 'night');
    const ftp = 2.2 + lt * .55;
    await drawPlate(t, 'fire_night', ftp, { view: { zoom: 1.03 }, ana: { gain: 1.15 }, lines: {},
      extra: (pen, F, view, d) => { const s = sunScreen('fire_night', ftp, view); if (s && s[2] > .2) flames(pen, s[0], Math.min(H + 30, s[1] + 90), { size: 330, n: 54, seed: d * 3 + 1 }); } });
    lyricStack(t, [{ s: 'home.', t: HOME2.t0, x: 110, y: 300, font: FONT.serif(150), col: 'gold', style: 'rise' }]);
    const Lt = typeLayer(); tele(Lt.g, 'TWO NIGHTS IN THE TAIGA · −25 °C', 60, H - 64, t, HOME2.t0 + 1, { size: 22, weight: 700, col: 'silver', dur: .7 }); typeFlush(Lt, drawClock(t, 12).n, .4);
  });
  shot('L5_survived', 206.2, 211.2, async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'drawing_survives', .4 + lt * .9, { view: { zoom: 1.04 }, lines: {} });
    const Lt = typeLayer(); tele(Lt.g, 'THE DRAWING SURVIVED', 60, H - 70, t, 207, { size: 30, weight: 800, col: 'gold', dur: .6 }); typeFlush(Lt, drawClock(t, 12).n, .4);
  });
  shot('L6_rescue', 211.2, 215.3, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'rescue', .5 + lt * .9, { paper: 'snow', view: { zoom: 1.03 } });
    const Lt = typeLayer(); tele(Lt.g, 'RESCUERS ARRIVE ON SKIS', 60, 64, t, 211.5, { size: 24, weight: 800, col: 'graphite', dur: .6 }); typeFlush(Lt, drawClock(t, 12).n, .6);
  });
  // what came next: one bar per milestone. [year, line, plate, framing (cx, cy, zoom) inside the right-hand panel]
  const LEG = [
    ['1965', 'THREE MONTHS LATER, ED WHITE WALKS IN SPACE', 'leg_gemini', [.64, .5, 1.1]],
    ['1969', 'PEOPLE WALK ON THE MOON', 'leg_moon', [.68, .47, 1.08]],
    ['1975', 'LEONOV SHAKES HANDS WITH AN AMERICAN IN ORBIT', 'leg_handshake', [.63, .52, 1.3]],
    ['2000', 'HUMANS HAVE LIVED IN SPACE EVERY DAY SINCE', 'leg_station', [.66, .5, 1.06]],
    ['2024', 'THE FIRST COMMERCIAL SPACEWALK', 'leg_commercial', [.64, .5, 1.12]],
    ['2026', 'FOUR PEOPLE FLY AROUND THE MOON AGAIN', 'leg_artemis', [.68, .5, 1.12]],
    ['NEXT', 'WHOEVER DARES', 'leg_next', [.62, .5, 1.08]],
  ];
  const lg0 = 215.3, lgBar = (l1 - lg0) / LEG.length, PX = 640;
  shot('L7_legacy', lg0, l1, async (t, lt) => {
    paper(G, 'night');
    const i = clamp(Math.floor(lt / lgBar), 0, LEG.length - 1), [yr, line, plate, fr] = LEG[i], age = lt - i * lgBar;
    if (PLATES[plate]) {
      // the drawing grows out from the subject over the first beats, then keeps boiling
      const rv = easeOut(clamp(age / .55)), cx = PX + (W - PX) / 2, cy = H / 2, R0 = Math.hypot(W - PX, H) / 2;
      const key = (X, Y, h) => clamp(Math.hypot(X - cx, Y - cy) / R0) * .85 + h * .15;
      await drawPlateIn(t, plate, 0, [PX, 0, W - PX, H], { hold: 0, frame: false, cx: fr[0], cy: fr[1], zoom: fr[2] * (1 + age * .025),
        spacing: 7.5, lines: { contrast: 1.3, black: .06 }, hatch: { reveal: rv, revealKey: key }, contour: { hi: .24, lo: .1, minLen: 12, reveal: rv, revealKey: key } });
    }
    const Lt = typeLayer();
    text(Lt.g, yr, 110, 420, { font: FONT.impact(230), col: i === LEG.length - 1 ? 'verm' : 'white', alpha: clamp(age / .1) });
    tele(Lt.g, line, 116, 500, t, lg0 + i * lgBar + .08, { size: 30, weight: 800, col: 'white', dur: .45, wrap: 470 });
    typeFlush(Lt, drawClock(t, 12).n, .3);
  });

  // ============================== CODA · 226.55 → end ==============================
  const [c0, c1] = S('coda').slice(1), [e0, e1] = S('end').slice(1);
  shot('C1_drawing', c0, c1, async (t, lt, dur) => {
    paper(G, 'snow');
    const { n: d } = drawClock(t, 8), L = layer(2), p2 = new Pen();
    const cx = W / 2, cy = H / 2 - 40, R = 1100, k = easeOut(clamp(lt / 3));
    // Leonov's drawing, alone on the page
    earthDisc(p2, cx, cy + 1250, R + 60, 1, { lit: .45, spacing: 10, jseed: d });
    sunriseBands(p2, cx, cy + 1250, R + 60, -Math.PI / 2 - .55, -Math.PI / 2 + .55, k, 2, { sunA: -Math.PI / 2 + .08, thick: 80, n: 1700, jseed: d });
    raysFrom(p2, cx + 90, cy + 1250 - R - 60 - 12, { n: 200, r0: 8, r1: 300 * k, energy: k, seed: 3, jseed: d, a0: Math.PI, a1: TAU });
    p2.flush(L.g, ORDER_SNOW); toothIn(L, d); G.globalCompositeOperation = 'multiply'; G.drawImage(L.c, 0, 0); G.globalCompositeOperation = 'source-over';
    handwrite(t, 'He drew the sunrise anyway.', W / 2, 250, c0 + 1.4, c0 + 4.4, { size: 96, align: 'center', col: 'graphite' });
  });
  shot('Z_title', e0, 999, async (t, lt) => {
    paper(G, 'night');
    const L = typeLayer(), g = L.g, k = clamp(lt / .12);
    text(g, 'ORBITAL SUNRISE', W / 2, 520, { font: FONT.impact(200), col: 'white', align: 'center', alpha: k, ls: 6 });
    text(g, 'ОРБИТАЛЬНЫЙ ВОСХОД', W / 2, 600, { font: FONT.cyr(48), col: 'verm', align: 'center', alpha: k, ls: 4 });
    text(g, 'JADE WANG', W / 2, 690, { font: FONT.mono(34, 800), col: 'white', align: 'center', alpha: clamp((lt - .3) / .3), ls: 8 });
    text(g, 'lyrics: a found poem from John Green\'s "Orbital Sunrise" (The Anthropocene Reviewed)', W / 2, 900, { font: FONT.serif(30), col: 'silver', align: 'center', alpha: clamp((lt - .6) / .4) });
    text(g, 'every frame drawn in colored pencil by JavaScript', W / 2, 950, { font: FONT.mono(20), col: 'silver', align: 'center', alpha: clamp((lt - .8) / .4), ls: 2 });
    typeFlush(L, drawClock(t, 12).n, .3);
    // the picture fades with the last ringing note
    const end = TM.durExt ?? TM.dur, f = clamp((t - (end - 2.4)) / 2.2);
    if (f > 0) { G.fillStyle = P.night; G.globalAlpha = f; G.fillRect(0, 0, W, H); G.globalAlpha = 1; }
  });
}
