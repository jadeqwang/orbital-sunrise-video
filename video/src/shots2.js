// shots2.js: drop 1 → end.
let SYNC = {};                                     // lip-sync lags per singer plate (tools/lipsync.py → data/sync.json)
const lagOf = id => (SYNC[id] && SYNC[id].use !== false ? (SYNC[id].lag ?? 0) : 0);
// singer plates (Jade from her real photos): song time where the audio slice each was generated with starts (tools/plate_specs.py: media/audio_refs/*.mp3)
const SEG = { jade_hook1_p: 30.9, jade_studio_p: 67.4, jade_brk_p: 110.4 };
// Re-mouthing vs the plate's own mouth (compared on full-res stills across each shot): hook1_p is frontal with a steady face
// mesh but holds one pursed 'oo' through the whole line (no closure on 'bring me'), so its lips are re-drawn from the vocal;
// studio_p is seen three-quarter-on and articulates well at its lag (lips closed on 'bring me', open on 'home'), where the frontal
// synthetic mouth looks pasted on; on brk_p the face mesh slips as she looks up, which drops the synthetic mouth toward her chin.
// Plates drawn with their own mouth are shifted by the lag in data/sync.json.
const REMOUTH = { jade_hook1_p: true, jade_studio_p: false, jade_brk_p: false };
// re-mouthed, the plate's own lip timing no longer matters; drawn with its own mouth, the plate is shifted by its measured lag
const tpSing = (id, t) => t - SEG[id] + (REMOUTH[id] ? 0 : lagOf(id));
// a singing shot on white paper: the plate at song time, re-mouthed or not (REMOUTH)
const singer = (t, id, o = {}) => drawPlate(t, id, tpSing(id, t), { remouth: REMOUTH[id], paper: 'snow', ...o });

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

// Leonov's "Orbital Sunrise", redrawn on white paper from a photo of the original (plate `leonov_drawing`, built by
// tools/install_drawing.py: the whole card, white-balanced). It is drawn the way he drew it: short coloured-pencil strokes laid along the bands (a stroke cloud that follows the
// plate's flow), the colour picked from the plate and the bare sheet left as paper. The pencil box has no violet, so the
// No contours: the original has no outlines, and no text. Bands from the outer edge in: black, light blue, yellow,
// orange-red with the red sun, then layered blues.
// k: 0..1 draw-on progress (left → right across the study); view: plate view on screen (the study spans u .12–.76, v .08–.86).
const DRAW_PENCIL = (r, g, b, t, o, rnd) => {
  const [h, s, v] = hsv(r, g, b);
  if (s < .1 && v > .7) return null;                                              // the sheet itself
  const warmGrey = (h < 50 || h >= 320) && s < .28;                               // graphite fading into the cream sheet at the study's edge
  if (warmGrey && v > .72) return null;
  if (v < .17 || warmGrey || (s < .22 && v < .6)) return v < .34 ? (rnd < .15 ? 'lead' : 'graphite') : (rnd < .5 ? 'graphite' : 'lead');
  if (h >= 245 && h < 320) return rnd < .78 ? 'ultra' : 'crimson';               // violet (top band)
  if (h < 14 || h >= 320) return 'verm';                                          // the red rim and the red sun
  if (h < 36) return rnd < .7 ? 'orange' : 'verm';
  if (h < 170) return 'gold';                                                     // the yellow band
  if (h < 212) return v > .5 ? 'sky' : 'ultra';                                   // light blue (just above the orange)
  return v > .5 ? 'cobalt' : 'ultra';                                             // blue; the dark Earth below the rim
};
// the same pencils for scanline hatching on white paper (plates of the drawing being made): tone from darkness or colour
const DRAW_LAYERS = [{ ang: -0.25, th: .13, sp: 5.2, w: 1.9, a: .9 }, { ang: 0.85, th: .36, sp: 5.6, w: 1.8, a: .9 }, { ang: -1.35, th: .58, sp: 5, w: 1.8, a: .9 }, { ang: 0.1, th: .8, sp: 4.4, w: 1.9, a: .95, dark: true }];
const DRAW_TONE = (L, V) => Math.max(Math.pow(smooth(clamp((.84 - (.55 * L + .45 * V)) / .7)), 1.1), V - L > .08 ? .24 + .46 * clamp((V - L - .06) * 3.2) : 0);
async function leonovDrawing(t, k, view, o = {}) {
  const z = view.zoom ?? 1, ox = view.ox ?? 0, x0 = W / 2 + ox + (.12 - (view.cx ?? .5)) * W * z, x1 = W / 2 + ox + (.76 - (view.cx ?? .5)) * W * z;
  const key = (X, Y, h) => clamp((X - x0) / (x1 - x0)) * .88 + h * .12;
  const d = drawClock(t, o.rate ?? 12).n, j = (hash(d * 3 + 1) - .5) * 1.6, j2 = (hash(d * 3 + 2) - .5) * 1.6;   // the stroke layout boils a little
  return drawPlate(t, 'leonov_drawing', 0, { hold: 0, rate: o.rate ?? 12, paper: 'snow', view, face: false, hatch: false, contour: false, silhouette: false, matte: false,
    // light, layered strokes along the arc: density follows how much pigment is on the card
    extra: (pen, F, v) => hatchField(pen, F, v, { paper: 'snow', seed: 5, tone: L => .3 + .62 * clamp((.95 - L) / .5), pencil: DRAW_PENCIL, spacing: o.spacing ?? 4,
      len: [16, 36], w: [1.3, 2.1], alpha: [.55, .9], angle: -.45, follow: 1, cross: .88, crossAngle: .5, gamma: 1.1,
      region: [j, j2, W + j, H + j2], reveal: k, revealKey: key }) });
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
  // his drawing (the reconstruction) on a small white card floating in the dark cabin; no text on the drawing itself
  shot('D5_the_drawing', bt(48), D1[1].t0 - .05, async (t, lt, dur) => {
    paper(G, 'night');
    const { n: d } = drawClock(t, 12);
    const drift = [Math.sin(lt * .6) * 14, Math.cos(lt * .5) * 10], rot = Math.sin(lt * .4) * .03;
    const sw = 1440, sh = 880, cx = W / 2 + drift[0], cy = H / 2 - 30 + drift[1];
    const card = g => { g.translate(cx, cy); g.rotate(rot); g.beginPath(); g.rect(-sw / 2, -sh / 2, sw, sh); };
    // the card: white paper, a soft pencil edge
    G.save(); card(G); G.clip(); G.rotate(-rot); G.translate(-cx, -cy); paper(G, 'snow'); G.restore();
    // the drawing draws itself across the card, then boils
    G.save(); card(G); G.clip(); G.rotate(-rot); G.translate(-cx, -cy);
    await leonovDrawing(t, easeOut(clamp(lt / (dur * .7))), { zoom: .84, ox: drift[0], oy: drift[1] - 30, rot });
    G.restore();
    G.save(); card(G); G.strokeStyle = 'rgba(0,0,0,.25)'; G.lineWidth = 2; G.stroke(); G.restore();
    const Lt = typeLayer();
    tele(Lt.g, 'THE FIRST WORK OF ART MADE IN SPACE', W / 2 - 330, H - 44, t, bt(49), { size: 28, weight: 800, col: 'gold', dur: .8 });
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
    // left: a hand finishing the reconstruction in coloured pencil (orange along the arc, then the red sun) on white paper
    const subClear = quiet([[W / 2 - 780, H - 170, W / 2 + 780, H - 40]], .85);
    await drawPlateIn(t, 'drawing_hand', .5 + lt, [0, 0, split, H], { paper: 'snow', frame: false, spacing: 6.5, zoom: 1.0, face: false,
      lines: { tone: DRAW_TONE, pencil: DRAW_PENCIL, layers: DRAW_LAYERS }, hatch: { mask: subClear } });
    await drawPlateIn(t, lt < dur / 2 ? 'valve_bleed' : 'tumble_slow', .8 + (lt % (dur / 2)), [split, 0, W - split, H], { paper: 'night', frame: false, spacing: 6.5, zoom: 1.08, hatch: { mask: subClear } });
    const pen = new Pen(), L = layer(4), d = drawClock(t, 12).n;
    const q = []; for (let y = 0; y <= H; y += 30) q.push([split + (hash2(y, d) - .5) * 3, y]); pen.poly(q, 'lead', 2.2, .9, .02); pen.flush(L.g); G.drawImage(L.c, 0, 0);
    subtitle(G, lineAt(t), t, { size: 58, y: H - 90, shadow: 6, split: { x: split, left: 'graphite', right: 'cream' } });
  });
  // She writes the line in her leather notebook: a slow push onto the open book (a page shot, not a face close-up) so the
  // handwriting reads on a phone. The lyric is written in graphite across the blank left page (her hand writes on the right one),
  // laid along the page as the plate sees it: the lines run with the head edge, the page recedes along the gutter.
  // NB_* are in jade_notebook_p plate pixels (960×540; the book does not move in the take). The left page: outer head corner
  // (385,280), head edge to the gutter at ~(555,307); outer edge down-left to ~(287,355); gutter ~(558,318)→(505,478). Her sleeve
  // cuts across the lower-left below (280,350)→(330,410), and her hand writes on the right page. NB_LINES are the baselines' starts,
  // each a little further in along the outer edge.
  const NB_LINES = [[400, 308], [387, 334], [374, 360]], NB_ALONG = [170, 27], NB_DOWN = [-75, 110], NB_SIZE = 20, NB_AT = [445, 345];
  shot('B2_float', BR[2].t0 - .05, BR[3].t0 - .05, async (t, lt, dur) => {
    paper(G, 'snow');
    const z = lerp(2.3, 2.75, easeInOut(clamp(lt / dur)));
    const { view } = await drawPlate(t, 'jade_notebook_p', .4 + lt, { paper: 'snow', face: false, aw: 960, ah: 540,
      view: { zoom: z, cx: NB_AT[0] / 960, cy: NB_AT[1] / 540 }, hatch: { spacing: 6.2 } });
    const S = (x, y) => view.toScreen(x / 960, y / 540), dir = ([dx, dy]) => { const [x0, y0] = S(500, 300), [x1, y1] = S(500 + dx, 300 + dy), l = Math.hypot(x1 - x0, y1 - y0); return [(x1 - x0) / l, (y1 - y0) / l]; };
    const [ax, ay] = dir(NB_ALONG), [bx, by] = dir(NB_DOWN), fy = .85;
    const w = BR[2].words; // I'll never float where the sky turns red
    [["I'll never float", w[0][0] - .05, w[2][0] + .3], ['where the sky', w[3][0] - .05, w[5][0] + .3], ['turns red', w[6][0] - .05, w[7][0] + .45]].forEach(([s, t0, t1], i) => {
      const [x, y] = S(...NB_LINES[i]);
      handwrite(t, s, x, y, t0, t1, { size: NB_SIZE * W / 960 * z, col: 'graphite', page: [ax, ay, bx * fy, by * fy] });
    });
  });
  // under the deep red dusk sky on the hilltop, eyes lifted, one hand raised toward the sky; chest-up, framed medium. As she looks up MediaPipe's
  // mesh still slips on some frames (a mouth on her chin), so the face is drawn from the plate's own edges only (faceLines: false)
  shot('B3_never', BR[3].t0 - .05, br1, async (t, lt) => {
    paper(G, 'snow');
    // On the Lady Bird Lake trail at red dusk, drawn and lit around her kept drawing (her own lines, no closet glasses-shadow),
    // background kept loose, animated singing; the film's pencil over it at 45%. Lips by ear for this line ("Never see what he
    // saw ahead"): song time = 110.4 - 0.8 + take time (her pick; the take ends 0.36 s before the shot and holds its last frame).
    // ?b3=old: the previous renderer-drawn take.
    if (new URLSearchParams(location.search).get('b3') === 'old') {
      await singer(t, 'jade_brk_p', { view: { zoom: 1.02 }, faceLines: false, hatch: { spacing: 6.2, mask: quiet([[W / 2 - 760, H - 175, W / 2 + 760, H - 45]], .7) } });
    } else {
      const tp = t - (110.4 + +(new URLSearchParams(location.search).get('b3lag') ?? -.8));
      await paperTake('jade_dusk', tp);
      G.save(); G.globalAlpha = .45;
      await drawPlate(t, 'jade_dusk', tp, { paper: 'snow', matte: false, face: false, view: { zoom: 1 }, hatch: { spacing: 6.2 } });
      G.restore();
    }
    if (new URLSearchParams(location.search).get('b3') === 'old') subtitle(G, lineAt(t), t, { size: 64, col: 'graphite', y: H - 90 });
    else subtitle(G, lineAt(t), t, { size: 64, col: 'graphite', x: W - 500, y: 150 });   // in the sky, clear of her
  });

  // ============================== ART · 118.00 → 129.70 ==============================
  const [ar0, ar1] = S('art').slice(1), AR = linesIn('art');
  const snowfall = (t, seed, n = 90, col = 'lead') => {
    const pen = new Pen(), L = layer(4), d = drawClock(t, 12).n;
    for (let i = 0; i < n; i++) {
      const sp = 40 + 50 * hash2(i, seed), x = (hash2(i, seed + 1) * W + Math.sin(t * .7 + i) * 30) % W, y = (hash2(i, seed + 2) * H + t * sp) % (H + 40) - 20;
      const r = 1.5 + 2.5 * hash2(i, seed + 3);
      pen.l(x - r, y, x + r, y, col, 1.2, .55); pen.l(x, y - r, x, y + r, col, 1.2, .55);
    }
    pen.flush(L.g); toothIn(L, d); G.drawImage(L.c, 0, 0);
  };
  // A1 is two halves: Leonov's hand drawing the sunrise in the cabin (black paper), then the singer's hand writing lyrics
  // in her notebook (white paper). A1_SPLIT is the cut (a beat in the held note after "in"); A1_B is the second half's plate.
  // face:false on both hand plates: any face hits there are knuckles. In jade_hand_writing_p her hand and pencil fill the top of
  // the frame, where the line sits in the first half, so after the cut the line is written on her notebook's blank left page
  // instead, in perspective like B2: HW_* in plate pixels (960×540, the book does not move): head edge (10,367)→(293,252),
  // gutter (293,252)→(627,460). "Art is a landing" is already on the page at the cut; "in the snow" is written from the cut.
  const A1_SPLIT = B(328), A1_B0 = .45;                                          // ≈121.62 s
  const A1_B = { id: 'jade_hand_writing_p', tp: t => A1_B0 + t - A1_SPLIT };
  // HW_* were measured on take 2; take 4 (take 2 rebuilt from its first frame) has the book 3 px left and 16 px higher (phase
  // correlation of the book region against take 2's contact sheet, steady over the whole take)
  const HW_OFF = [-3, -16], HW_LINES = [[118, 442], [190, 477]].map(([x, y]) => [x + HW_OFF[0], y + HW_OFF[1]]), HW_ALONG = [283, -115], HW_DOWN = [334, 208], HW_SIZE = 46;
  shot('A1_snow', ar0, AR[1].t0 - .05, async (t, lt) => {
    const first = t < A1_SPLIT, clear = quiet([[W / 2 - 800, 80, W / 2 + 800, 240]], .8), w = AR[0].words;
    if (first) {   // the line in cream pencil across the top of his black paper
      paper(G, 'night');
      await drawPlate(t, 'leonov_drawing_hand', .3 + lt, { rate: 8, view: { zoom: 1.02 }, face: false, hatch: { spacing: 6.5, mask: clear } });
      snowfall(t, 3, 90, 'silver');
      handwrite(t, 'Art is a landing in the snow', W / 2, 190, w[0][0] - .1, w[6][0] + .5, { size: 104, align: 'center', col: 'cream' });
    } else {
      paper(G, 'snow');
      const { view } = await drawPlate(t, A1_B.id, A1_B.tp(t), { paper: 'snow', rate: 8, view: { zoom: 1.02 }, face: false, hatch: { spacing: 6.2 } });
      snowfall(t, 3, 90, 'lead');
      const S = (x, y) => view.toScreen(x / 960, y / 540), dir = ([dx, dy]) => { const [x0, y0] = S(300, 300), [x1, y1] = S(300 + dx, 300 + dy), l = Math.hypot(x1 - x0, y1 - y0); return [(x1 - x0) / l, (y1 - y0) / l]; };
      const [ax, ay] = dir(HW_ALONG), [bx, by] = dir(HW_DOWN), fy = .85;
      [['Art is a landing', w[0][0] - .1, w[3][0] + .4], ['in the snow', A1_SPLIT, w[6][0] + .5]].forEach(([s, t0, t1], i) => {
        const [x, y] = S(...HW_LINES[i]);
        handwrite(t, s, x, y, t0, t1, { size: HW_SIZE * W / 960 * 1.02, col: 'graphite', page: [ax, ay, bx * fy, by * fy] });
      });
    }
  });
  shot('A2_hands', AR[1].t0 - .05, ar1, async (t, lt) => {
    paper(G, 'snow');
    const half = W / 2;
    await drawPlateIn(t, 'leonov_drawing_hand', 4.2 + lt * .75, [0, 0, half, H], { paper: 'night', frame: false, spacing: 6.2, zoom: 1.08, cx: .52, cy: .55, face: false });
    // her hand keeps writing where A1 left it (A1 ends at plate ≈3.75 s); slowed so the 6 s take lasts to the end of the shot
    await drawPlateIn(t, 'jade_hand_writing_p', A1_B.tp(AR[1].t0 - .05) + lt * .47, [half, 0, half, H], { paper: 'snow', frame: false, spacing: 6.2, zoom: 1.08, cx: .58, face: false });
    subtitle(G, lineAt(t), t, { size: 60, y: H - 90, shadow: 6, split: { x: half, left: 'cream', right: 'graphite' } });
  });

  // ============================== BUILD · 129.70 → 143.20 ==============================
  const [bd0, bd1] = S('build').slice(1), BD = linesIn('build');
  // The sun whips past the porthole once per turn of the tumble: every 3 beats (≈1.1 s), centred just after beats 352, 355, 358,
  // which is where the plate's spin is between Earths (Earth → black → SUN → black → Earth). It enters at the top and leaves at
  // the bottom, the way the Earth sweeps through the plate. Each pass keeps one stroke layout (seed per pass; jseed boils it).
  const SPIN_B0 = 352, SPIN_BEATS = 3, SPIN_LAG = .06, SPIN_HALF = .17;   // pass centre = B(352 + 3k) + lag; half a crossing, s
  const PORT_UV = [486 / 960, 277 / 540], PORT_R = 252 / 960;             // glass opening in plate uv (Hough fit, frames 1–91; the camera holds it)
  function portholeSun(t, view) {
    const d = drawClock(t, 12).n;   // t is already on the shot's twos grid (renderFrame); d only boils the strokes
    const k = Math.round((beatPos(t) - SPIN_B0) / SPIN_BEATS), c = B(SPIN_B0 + k * SPIN_BEATS) + SPIN_LAG, p = (t - c) / SPIN_HALF;
    if (p < -1.35 || p > 2.2) return;
    const [cx, cy] = view.toScreen(PORT_UV[0], PORT_UV[1]), [ex, ey] = view.toScreen(PORT_UV[0] + PORT_R, PORT_UV[1]), R = Math.hypot(ex - cx, ey - cy);
    const circle = g => { g.beginPath(); g.arc(cx, cy, R, 0, TAU); };
    if (p > 1.05) {   // hard black after it: the eye is blind for a moment, the glass goes dead
      const a = clamp(1.25 - (p - 1.05) * .9);
      G.save(); circle(G); G.clip(); paper(G, 'night', a); G.restore();
      return;
    }
    // the path: top → bottom with a slight lean (the tumble's axis is not quite level), a little different each turn
    const lean = -.28 + (hash(k * 5 + 3) - .5) * .16, dx = Math.sin(lean), dy = Math.cos(lean), side = (hash(k * 5 + 4) - .5) * .35 * R;
    const sx = cx + dx * p * R * 1.28 - dy * side, sy = cy + dy * p * R * 1.28 + dx * side;
    const f = Math.exp(-Math.pow(p / .5, 2));                                // the flare: strongest as it crosses the middle
    const vis = clamp((1.2 - Math.abs(p)) / .35);                            // rays reach in before the disc does
    // wash: the plate's hatching burns out under the glare
    G.save(); circle(G); G.clip(); paper(G, 'night', clamp(.25 + f * .8) * vis); G.restore();
    const L = layer(3), pen = new Pen(), seed = 600 + k * 37;
    // washed-out hatching: long pale strokes laid across the glass, densest round the sun
    const ang = -.62, ca = Math.cos(ang), sa = Math.sin(ang), sp = 6.5;
    for (let i = -Math.ceil(R / sp); i <= R / sp; i++) {
      const off = i * sp, half = Math.sqrt(Math.max(0, R * R - off * off));
      for (let s = -half, j = 0; s < half; j++) {
        const h1 = hash2(i * 97 + j, seed), h2 = hash2(i * 97 + j, seed + 1), len = 26 + 70 * h1;
        const u = s + len / 2, x = cx - sa * off + ca * u, y = cy + ca * off + sa * u;
        s += len + 3 + 10 * h2;
        const near = Math.exp(-Math.hypot(x - sx, y - sy) / (R * (.45 + .5 * f))), dens = vis * Math.min(1, f * 1.05 + .12) * (.5 + .5 * near);
        if (h2 > dens) continue;
        const jx = (hash2(i * 97 + j, d * 3 + 1) - .5) * 2.2, jy = (hash2(i * 97 + j, d * 3 + 2) - .5) * 2.2;
        const col = near > .55 || (f > .6 && h1 < .45) ? 'white' : near > .25 || f > .6 ? (h1 < .55 ? 'cream' : 'gold') : (h1 < .6 ? 'gold' : 'orange');
        pen.l(x - ca * len / 2 + jx, y - sa * len / 2 + jy, x + ca * len / 2 + jx, y + sa * len / 2 + jy, col, 1.7 + 1.4 * near + f, clamp(.3 + .45 * f + .3 * near));
      }
    }
    // smear: the disc's track back up the path it came down
    for (let i = 0; i < 46; i++) {
      const h1 = hash2(i, seed + 5), h2 = hash2(i, seed + 6), o = (h1 - .5) * 150 * (.6 + .4 * f), len = R * (.35 + .6 * h2) * vis;
      const x0 = sx - dy * o, y0 = sy + dx * o, x1 = x0 - dx * len, y1 = y0 - dy * len, bend = (hash2(i, d + 90) - .5) * 10;
      pen.q(x0, y0, (x0 + x1) / 2 + bend, (y0 + y1) / 2, x1, y1, h2 < .4 ? 'white' : h2 < .75 ? 'gold' : 'orange', 1.6 + 2 * (1 - Math.abs(h1 - .5) * 2), .5 + .4 * (1 - h2));
    }
    // the sunburst (same pencils as the sunrise): long rays stretched along the whip, then the white-gold core
    const along = Math.atan2(dy, dx);
    raysFrom(pen, sx, sy, { n: 520, r0: 14, r1: R * 1.5, energy: vis * (.55 + .45 * f), seed: seed + 11, jseed: d, w: [1.4, 3.2], alpha: [.5, .95],
      lenMul: a => .55 + .9 * Math.abs(Math.cos(a - along)) });
    raysFrom(pen, sx, sy, { n: 620, r0: 0, r1: 150 + 90 * f, energy: vis, seed: seed + 13, jseed: d, cols: ['white', 'gold', 'gold', 'white', 'orange'], w: [2, 4.2], alpha: [.85, 1] });
    pen.flush(L.g, ORDER_NIGHT); toothIn(L, d);
    L.g.save(); L.g.globalCompositeOperation = 'destination-in'; circle(L.g); L.g.fill(); L.g.restore();   // only through the glass
    G.drawImage(L.c, 0, 0);
  }
  shot('G1_failed', bd0, BD[1].t0 - .05, async (t, lt) => {
    paper(G, 'night');
    const glitch = Math.floor(t * 12) % 7 === 0 ? 1 : 0;
    // through the porthole while the capsule tumbles: Earth, black, Earth sweep past (plate frames 0–90, before the plasma).
    // face:false: the plate's face hits are reflections on the glass
    const { view } = await drawPlate(t, 'porthole_spin', .1 + lt * 1.2, { face: false, view: { zoom: 1.08, ox: 330 + glitch * 18, rot: Math.sin(lt * 2.2) * .04 } });
    if (view) portholeSun(t, view);
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
  // already tumbling on the first HOLD ON (outside), then through the porthole with the sun still sweeping past, then the g-load
  const holds = [[HO[0][0], 'capsule_spin', .4, 170, { rate: 1.5, roll: .13, zoom: .16 }], [HO[2][0], 'porthole_spin', .1, 240, { face: false, rate: 1.2, sun: true }], [HO[4][0], 'g_force', .6, 330]];
  shot('G3_hold', BD[2].t0 - .05, bd1, async (t, lt, dur) => {
    paper(G, 'night');
    let cur = holds[0]; for (const h of holds) if (t >= h[0] - .05) cur = h;
    const riser = clamp((t - 139.5) / (bd1 - 139.5));
    const shake = 6 + riser * 22;
    const ho = cur[4] || {};
    const { view } = await drawPlate(t, cur[1], cur[2] + (t - cur[0]) * (ho.rate || 1), { face: ho.face, rate: riser > .3 ? 24 : 12, view: { zoom: 1.05 + (ho.zoom || 0) + riser * .15, rot: ho.roll ? -ho.roll + (t - cur[0]) * ho.roll * 1.1 : 0, ox: (hash(Math.floor(t * 24)) - .5) * shake, oy: (hash(Math.floor(t * 24) + 7) - .5) * shake },
      extra: (pen) => edgePanic(pen, .35 + riser * .65, drawClock(t, 24).n * 13) });
    if (ho.sun && view) portholeSun(t, view);
    const idx = holds.indexOf(cur);
    lyricStack(t, [{ s: 'HOLD ON', t: cur[0], x: W / 2, y: H / 2 + cur[3] * .35, size: cur[3], align: 'center', style: 'slam', col: idx === 2 ? 'gold' : 'white' }]);
    if (t > bd1 - .12) { G.fillStyle = P.cream; G.globalAlpha = clamp((t - (bd1 - .12)) / .12); G.fillRect(0, 0, W, H); G.globalAlpha = 1; }
  });

  // ============================== HOOK 3 · 143.20 → 152.63 · re-entry burns through to her ==============================
  const [h30, h31] = S('hook3').slice(1), H3 = linesIn('hook3');
  // outside: the descent sphere in its plasma sheath over the night side; one continuous take from the burn-through into F2
  const BURN0 = H3[1].t0 - 1.6, tpRe = t => .6 + (t - BURN0) * 1.1, RE_VIEW = { zoom: 1.04 }, RE_OPT = { cloud: true, face: false };   // the plasma is a glow: flow-following stroke cloud
  shot('F1_reentry', h30, H3[1].t0 - .05, async (t, lt, dur) => {
    paper(G, 'night');
    await drawPlate(t, 'reentry_fire', .5 + lt, { rate: 24, view: { zoom: 1.04 } });
    const w = H3[0].words, d = drawClock(t, 12).n;
    lyricStack(t, [{ s: 'ORBITAL', t: w[0][0], x: 100, y: 380, size: 220 }, { s: 'SUNRISE', t: w[1][0], x: 100, y: 600, size: 220 }]);
    if (t >= w[2][0]) hatchedText('BURNING GOLD', 106, 800, FONT.impact(170), { cols: ['gold', 'orange', 'verm', 'white'], edge: 'gold', seed: 45, jseed: d, drawIdx: d, alpha: clamp((t - w[2][0]) / .1) });
    // the page burns through from the capsule outward, revealing the capsule from outside
    const r = Math.pow(clamp((t - BURN0) / 1.6), 2) * 1500;
    if (r > 0) await burnThrough(t, W * .5, H * .56, r, async () => {
      paper(G, 'night');
      await drawPlate(t, 'reentry_outside', tpRe(t), { view: RE_VIEW, ...RE_OPT, hatch: { pencilOpt: { warm: 1.8 } } });
    });
  });
  shot('F2_home', H3[1].t0 - .05, h31, async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'reentry_outside', tpRe(t), { view: RE_VIEW, ...RE_OPT, hatch: { pencilOpt: { warm: 1.8 }, mask: quiet([[60, 70, 1140, 240], [W / 2 - 420, H - 150, W / 2 + 420, H - 40]], .8) } });
    const w = H3[1].words;
    // "bring" lands .4 s before the cut to the parachute ("home" is sung after it): a subtitle-sized line, not a hero word
    lyricStack(t, [{ s: 'ORBITAL SUNRISE', t: w[0][0], x: 110, y: 200, size: 120, col: 'white', style: 'rise' },
      { s: 'bring me home', t: w[2][0] - .1, x: W / 2, y: H - 80, font: FONT.serif(64), col: 'cream', align: 'center', style: 'rise' }]);
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
  // the round-2 landing plates are blue dusk: lift them and hatch only the real darks, so the snow stays paper
  const SNOW_DUSK = { ana: { gain: 1.2 }, lines: { contrast: 2.3, white: .64 } };
  // the hatch is blown against a birch; the men (white suits, no helmets) rock it free
  shot('L2_home', HOME1.t0 - .05, MADE2.t0 - .05, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'hatch_tree', .5 + lt * .9, { paper: 'snow', view: { zoom: 1.03 }, ...SNOW_DUSK, hatch: { mask: quiet([[W / 2 - 520, 150, W / 2 + 520, 420]], .8) } });
    lyricStack(t, [{ s: 'HOME', t: HOME1.t0, x: W / 2, y: 380, size: 280, align: 'center', col: 'graphite', style: 'rise' }]);
  });
  // the hatch lies in the snow; Leonov climbs out and helps Belyayev
  shot('L3_madeit', MADE2.t0 - .05, HOME2.t0 - .05, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'hatch_free', 2.2 + lt * 1.3, { paper: 'snow', view: { zoom: 1.03 }, ...SNOW_DUSK, hatch: { mask: quiet([[W / 2 - 620, 100, W / 2 + 620, 260]], .8) } });
    lyricStack(t, [{ s: 'MADE IT DOWN', t: MADE2.t0, x: W / 2, y: 220, size: 150, align: 'center', col: 'graphite', style: 'rise' }]);
  });
  // night by the fire: quilted suit linings, parachute cloth, fur boots. The plate is dusk; here only what the fire lights is drawn
  // (the hatching falls off with distance from the fire), so the taiga goes to night around it.
  shot('L4_fire', HOME2.t0 - .05, 206.2, async (t, lt) => {
    paper(G, 'night');
    const ftp = 2.2 + lt * .55, z = 1.03, m = plateMeta('fire_night_v2', ftp), fu = m ? m.sun : [.43, .96];
    const fx = W / 2 + (fu[0] - .5) * W * z, fy = H / 2 + (fu[1] - .5) * H * z;
    const firelight = (X, Y) => clamp(1.25 - Math.hypot((X - fx) / 1.3, Y - fy) / 950, .14, 1) * quiet([[60, 170, 700, 340]], .85)(X, Y);
    await drawPlate(t, 'fire_night_v2', ftp, { view: { zoom: z }, ana: { gain: .95 }, lines: { black: .14, contrast: 2.1 }, hatch: { mask: firelight },
      contour: { mask: (X, Y) => firelight(X, Y) > .35 ? 1 : 0 },
      extra: (pen, F, view, d) => flames(pen, fx, Math.min(H + 20, fy + 40), { size: 300, n: 54, seed: d * 3 + 1 }) });
    lyricStack(t, [{ s: 'home', t: HOME2.t0, x: 110, y: 300, font: FONT.serif(150), col: 'gold', style: 'rise' }]);
    const Lt = typeLayer(); tele(Lt.g, 'TWO NIGHTS IN THE TAIGA · −25 °C', 60, H - 64, t, HOME2.t0 + 1, { size: 22, weight: 700, col: 'silver', dur: .7 }); typeFlush(Lt, drawClock(t, 12).n, .4);
  });
  // by the fire he unfolds the folded sheet (the reconstruction) and smiles; no caption (the line moves to the coda)
  shot('L5_survived', 206.2, 211.2, async (t, lt) => {
    paper(G, 'night');
    const tp = 1.0 + lt;
    await drawPlate(t, 'drawing_survives_v2', tp, { view: { zoom: 1.04 }, lines: {}, face: tp > 4.3 });   // earlier face hits are on the hands
  });
  // skiers in sheepskin coats bring warm clothes; the cosmonauts by the fire in their linings
  const LEG_BEATS = 3, LEG_END = 610;                                            // the legacy montage ends on beat 610 (≈225.81 s)
  const LEG = [
    ['1965', 'ED WHITE WALKS IN SPACE', 'leg_gemini', [.64, .5, 1.1]],
    ['1969', 'PEOPLE WALK ON THE MOON', 'leg_moon', [.68, .47, 1.08]],
    ['1975', 'LEONOV SHAKES HANDS IN ORBIT', 'leg_handshake', [.63, .52, 1.3]],
    ['2000', 'FIFTEEN NATIONS, ONE STATION', 'leg_station', [.56, .5, 1.06]],
    ['2003', "CHINA'S FIRST ASTRONAUT", 'leg_yang_liwei', [.63, .5, 1.1]],
    ['2014', 'A LANDER ON A COMET', 'leg_philae', [.72, .56, 1.7]],
    ['2019', 'FIRST LANDING ON THE FAR SIDE', 'leg_change4', [.6, .5, 1.08]],
    ['2023', "INDIA LANDS NEAR THE MOON'S SOUTH POLE", 'leg_chandrayaan3', [.68, .45, 1.1]],   // Chandrayaan-3 landed at ~69°S: near, not at, the pole
    ['2024', 'THE FIRST COMMERCIAL SPACEWALK', 'leg_commercial', [.62, .5, 1.12]],
    ['2026', 'FOUR PEOPLE AROUND THE MOON AGAIN', 'leg_artemis', [.68, .5, 1.12]],
  ];
  const LEG_B0 = LEG_END - LEG.length * LEG_BEATS, lg0 = B(LEG_B0), lg1 = B(LEG_END), PX = 640;
  shot('L6_rescue', 211.2, lg0, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'rescue_v2', 2 + lt * 1.4, { paper: 'snow', view: { zoom: 1.03 }, ...SNOW_DUSK, hatch: { mask: quiet([[40, 30, 760, 110]], .8) } });
    const Lt = typeLayer(); tele(Lt.g, 'RESCUERS ARRIVE ON SKIS', 60, 64, t, 211.5, { size: 24, weight: 800, col: 'graphite', dur: .6 }); typeFlush(Lt, drawClock(t, 12).n, .6);
  });
  // team Earth: one milestone every LEG_BEATS beats, on the beat. [year, line (≤ 7 words, docs/FACTS.md §6), plate, framing (cx, cy, zoom) in the right-hand panel]
  shot('L7_legacy', lg0, lg1, async (t, lt) => {
    paper(G, 'night');
    const i = clamp(Math.floor((beatPos(t) + 1e-4 - LEG_B0) / LEG_BEATS), 0, LEG.length - 1), [yr, line, plate, fr] = LEG[i], it0 = B(LEG_B0 + i * LEG_BEATS), age = t - it0;
    if (PLATES[plate]) {
      // the drawing grows out from the subject over the first beat, then keeps boiling
      const rv = easeOut(clamp(age / .4)), cx = PX + (W - PX) / 2, cy = H / 2, R0 = Math.hypot(W - PX, H) / 2;
      const key = (X, Y, h) => clamp(Math.hypot(X - cx, Y - cy) / R0) * .85 + h * .15;
      await drawPlateIn(t, plate, 0, [PX, 0, W - PX, H], { hold: 0, frame: false, cx: fr[0], cy: fr[1], zoom: fr[2] * (1 + age * .025),
        spacing: 7.5, lines: { contrast: 1.3, black: .06 }, hatch: { reveal: rv, revealKey: key }, contour: { hi: .24, lo: .1, minLen: 12, reveal: rv, revealKey: key } });
    }
    const Lt = typeLayer();
    text(Lt.g, yr, 110, 420, { font: FONT.impact(230), col: 'white', alpha: clamp(age / .1) });
    tele(Lt.g, line, 116, 500, t, it0 + .06, { size: 30, weight: 800, col: 'white', dur: .35, wrap: 470 });
    typeFlush(Lt, drawClock(t, 12).n, .3);
  });

  // ============================== CODA · 226.55 → end ==============================
  const [c0, c1] = S('coda').slice(1), [e0, e1] = S('end').slice(1);
  const CARD1 = B(619);                                                          // ≈229.10 s: the survivors card → the drawing
  // 3:46 · Leonov and Belyayev after the rescue: white paper (daylight snow), the words in a clearing above them
  shot('L8_cosmonauts', lg1, CARD1, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'leg_survivors', 0, { hold: 0, paper: 'snow', rate: 8, view: { zoom: 1.0, oy: 230 },
      hatch: { mask: quiet([[W / 2 - 700, 40, W / 2 + 700, 520]], .9) }, contour: { mask: quiet([[W / 2 - 700, 40, W / 2 + 700, 520]], .9) } });
    lyricStack(t, [
      { s: 'THE COSMONAUTS', t: lg1 + .05, x: W / 2, y: 250, size: 170, align: 'center', col: 'graphite', style: 'rise', ls: 4 },
      { s: 'SURVIVED', t: B(LEG_END + 2), x: W / 2, y: 480, size: 240, align: 'center', col: 'verm', style: 'slam', ls: 6 },
    ]);
  });
  // 3:51 · the drawing, alone on the white page
  shot('C1_drawing', CARD1, e0, async (t, lt, dur) => {
    paper(G, 'snow');
    await leonovDrawing(t, easeOut(clamp(lt / 1.6)), { zoom: .8, ox: 120, oy: 130 }, { rate: 8 });
    handwrite(t, 'The cosmonauts and the artwork survived.', W / 2, 200, CARD1 + .6, CARD1 + 3.0, { size: 88, align: 'center', col: 'graphite' });
  });
  shot('Z_title', e0, 999, async (t, lt) => {
    paper(G, 'night');
    const L = typeLayer(), g = L.g, k = clamp(lt / .12);
    text(g, 'ORBITAL SUNRISE', W / 2, 520, { font: FONT.impact(200), col: 'white', align: 'center', alpha: k, ls: 6 });
    text(g, 'ОРБИТАЛЬНЫЙ ВОСХОД', W / 2, 600, { font: FONT.cyr(48), col: 'verm', align: 'center', alpha: k, ls: 4 });
    text(g, 'JADE WANG', W / 2, 690, { font: FONT.mono(34, 800), col: 'white', align: 'center', alpha: clamp((lt - .3) / .3), ls: 8 });
    text(g, 'An homage to \u201cOrbital Sunrise: The First Art Made in Space\u201d by John Green', W / 2, 900, { font: FONT.serif(30), col: 'silver', align: 'center', alpha: clamp((lt - .6) / .4) });
    text(g, 'vlogbrothers \u00b7 also an episode of The Anthropocene Reviewed', W / 2, 950, { font: FONT.mono(20), col: 'silver', align: 'center', alpha: clamp((lt - .8) / .4), ls: 2 });
    typeFlush(L, drawClock(t, 12).n, .3);
    // the picture fades with the last ringing note
    const end = TM.durExt ?? TM.dur, f = clamp((t - (end - 2.4)) / 2.2);
    if (f > 0) { G.fillStyle = P.night; G.globalAlpha = f; G.fillRect(0, 0, W, H); G.globalAlpha = 1; }
  });
}
