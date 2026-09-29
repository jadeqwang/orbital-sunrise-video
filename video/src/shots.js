// shots.js: the shot list. Each shot paints the full frame from song time t.

// ------------------------------------------------------------------ helpers
const META = {};                                   // plate id → per-frame measurements (tools/plate_meta.py)
function plateMeta(id, tp) { const m = META[id]; if (!m) return null; return m[plateIndex(id, tp) - 1]; }
const _fr = {};
function faceRatio(id) { if (_fr[id] === undefined) { const m = META[id]; _fr[id] = m ? m.filter(f => f.face).length / m.length : 0; } return _fr[id]; }

// Redraw a plate in pencil. tp = plate time. Returns {F, view, dIdx}.
// ?swap=a:b,c:d draws plate b wherever the film uses plate a (pencil previews of candidate stills: tools/pencil_preview.py)
const SWAP = Object.fromEntries((new URLSearchParams(location.search).get('swap') || '').split(',').filter(Boolean).map(p => p.split(':')));
async function drawPlate(t, id, tp, o = {}) {
  if (SWAP[id]) { id = SWAP[id]; o = { ...o, hold: 0 }; }
  if (!PLATES[id]) { // missing plate: a visible placeholder instead of a crash (review builds only)
    text(G, `[ plate "${id}" not generated yet ]`, W / 2, H / 2, { font: FONT.mono(28, 700), col: 'verm', align: 'center' });
    return { F: null, view: null, dIdx: 0, tp };
  }
  const rate = o.rate ?? 12;
  const { n: dIdx0, tq } = drawClock(t, rate);
  const dIdx = o.fixedSeed ?? dIdx0;
  const tpq = o.hold !== undefined ? o.hold : tp - (t - tq);   // plate advances with the drawing clock
  // auto-exposure lifts dark plates on black paper; white paper keeps the plate's own exposure (snow stays snow)
  const F = await plateF(id, tpq, o.aw ?? 640, o.ah ?? 360, { ...((o.paper ?? 'night') === 'night' ? {} : { gain: 1 }), ...(o.ana || {}) });
  if (o.matte !== false && F.M === undefined) attachMatte(F, await plateMatte(id, tpq));
  const view = makeView(F, typeof o.view === 'function' ? o.view(tq) : (o.view || {}));
  if (window._rec) { const m = view.matrix(PLATES[id].w, PLATES[id].h); window._rec.push({ id, tp: tpq, m: G.getTransform().multiply(new DOMMatrix(m)) }); }   // making-of: which plate, where
  const night = (o.paper ?? 'night') === 'night';
  const ord = night ? ORDER_NIGHT : ORDER_SNOW;
  if (o.under) { // procedural light behind the subject (sun rays, glows): own layer, cut out by the matte
    const Lu = layer(3), pu = new Pen();
    o.under(pu, F, view, dIdx); pu.flush(Lu.g, ord); toothIn(Lu, dIdx + 5);
    if (F.M) behindMatte(Lu, F, view, o.underCut ?? .92);
    G.drawImage(Lu.c, 0, 0);
  }
  const pen = new Pen(), L = layer(1);
  // face detail: re-analyse the face at higher resolution and draw it finer
  // (only on plates where a face is found consistently: stray detections on hardware are ignored)
  const faceOK = o.face === true || (o.face !== false && faceRatio(id) > .5);
  const fm = faceOK ? plateMeta(id, tpq) : null;
  let fmask = null, fbox = null;
  if (fm && fm.face) {
    const [a0, b0, a1, b1] = fm.face, cu = (a0 + a1) / 2, cv = (b0 + b1) / 2, hu = (a1 - a0) * .7, hv = (b1 - b0) * .66;
    const [sx0, sy0] = view.toScreen(cu - hu, cv - hv), [sx1, sy1] = view.toScreen(cu + hu, cv + hv);
    const sw = Math.abs(sx1 - sx0);
    if (sw > (o.faceMin ?? 110)) {
      fbox = [cu - hu, cv - hv, cu + hu, cv + hv];
      const [ecx, ecy] = view.toScreen(cu, cv), erx = Math.abs(sx1 - sx0) / 2, ery = Math.abs(sy1 - sy0) / 2;
      fmask = (X, Y) => { const d = Math.hypot((X - ecx) / erx, (Y - ecy) / ery); return clamp((1.05 - d) / .3); };
    }
  }
  // re-mouthing: the singer's lips follow the vocal track; the plate's own mouth is masked out
  const MG = (o.remouth && fm && fm.face) ? mouthGeom(fm, view, mouthOpen(tq + (o.mouthLead ?? 0))) : null;
  const mm = MG ? MG.mask : null;
  const baseMask = o.hatch && o.hatch.mask;
  const mainMask0 = fmask ? (X, Y) => (1 - .8 * fmask(X, Y)) * (baseMask ? baseMask(X, Y) : 1) : baseMask;
  const mainMask = mainMask0, faceMaskM = fmask;
  // under the re-drawn lips the plate's own mouth is painted out with the surrounding skin (tone + color), so hatching runs on unbroken
  const skinFill = (FF, vw) => {
    if (!MG) return undefined;
    const ca = Math.cos(MG.ang), sa = Math.sin(MG.ang), at = (u, v) => [MG.mx + u * ca - v * sa, MG.my + u * sa + v * ca];
    const pts = [at(-MG.wid * .95, 0), at(MG.wid * .95, 0), at(0, -MG.faceH * .09), at(-MG.wid * .45, MG.faceH * .15), at(MG.wid * .45, MG.faceH * .15)];
    let T = 0, V = 0, r = 0, g = 0, b = 0;
    for (const [X, Y] of pts) { const [px, py] = vw.toPlate(X, Y), rr = samp(FF, FF.R, px, py), gg = samp(FF, FF.G, px, py), bb = samp(FF, FF.B, px, py); T += samp(FF, FF.T, px, py); V += Math.max(rr, gg, bb); r += rr; g += gg; b += bb; }
    const n = pts.length; return { w: mm, T: T / n, V: V / n, rgb: [r / n, g / n, b / n] };
  };
  if (o.hatch !== false) {
    // tonal hatching: long parallel scanline layers (default), or the flow-following stroke cloud for glows (o.cloud)
    if (night && (o.cloud || Q.has('nightCloud'))) hatchField(pen, F, view, { seed: dIdx * 7 + 1, paper: 'night', ...(o.hatch || {}), mask: mainMask, fill: skinFill(F, view) });
    else lineHatch(pen, F, view, { seed: dIdx * 7 + 1, paper: o.paper ?? 'night', ...(o.hatch || {}), ...(o.lines || {}), mask: mainMask, fill: skinFill(F, view) });
    pen.flush(L.g, ord);
  }
  if (o.contour !== false) { contourField(pen, F, view, { seed: dIdx * 13 + 5, pencil: night ? 'white' : 'graphite', tint: night, mask: mm ? (X, Y) => 1 - mm(X, Y) : undefined, ...(o.contour || {}) }); pen.flush(L.g, ord); }
  if (o.silhouette !== false && F.M) { silhouette(pen, F, view, { seed: dIdx * 23 + 9, pencil: night ? 'white' : 'graphite', ...(o.sil || {}) }); pen.flush(L.g, ord); }
  if (fbox) {
    const im = await plateImage(id, tpq);
    const pw = im.width, ph = im.height, src = [fbox[0] * pw, fbox[1] * ph, (fbox[2] - fbox[0]) * pw, (fbox[3] - fbox[1]) * ph];
    // ?fineface (experiment): hatch the face at the source's own resolution, about twice as dense and finer, and draw its
    // features from the image's edges only (the landmark lines pull eyes, brows and lips toward an average face)
    const FINE = Q.has('fineface') || o.fineFace;
    const caw = Math.round(clamp(src[2] * 1.5, 160, FINE ? 1100 : 480)), cah = Math.round(caw * src[3] / src[2]);
    const gF = (o.ana && o.ana.gain) ?? (night ? Math.pow(PLATES[id].gain ?? 1, GAIN_POW) : 1);   // same exposure as the body
    const Fc = analyzePlate(im, caw, cah, { s1: .8, sT: 2.2, sTone: 1, gain: gF }, src);
    const cv = cropView(view, Fc, fbox);
    const fregion = (() => { const [x0, y0] = view.toScreen(fbox[0], fbox[1]), [x1, y1] = view.toScreen(fbox[2], fbox[3]); return [Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1)]; })();
    if (night && (o.cloud || Q.has('nightCloud')))
      hatchField(pen, Fc, cv, { seed: dIdx * 17 + 3, paper: 'night', spacing: 5.2, len: [6, 17], w: [1, 1.8], follow: .85, contrast: 1.6, density: .85, ...(o.faceHatch || {}), mask: faceMaskM, fill: skinFill(Fc, cv), region: fregion });
    else { // finer scanline layers for skin
      const fs = clamp((fregion[2] - fregion[0]) / 700, .6, 1.2) * (FINE ? .48 : 1), fw = FINE ? .62 : 1;
      lineHatch(pen, Fc, cv, { seed: dIdx * 17 + 3, paper: o.paper ?? 'night', step: 2.6, len: [12, 30], mask: faceMaskM, fill: skinFill(Fc, cv), region: fregion,
        layers: [{ ang: -0.72, th: .12, sp: 5.4 * fs, w: 1.05 * fw, a: .62 }, { ang: 0.85, th: .34, sp: 5.8 * fs, w: 1.05 * fw, a: .62 }, { ang: -1.35, th: .56, sp: 5.2 * fs, w: 1.15 * fw, a: .72 }, { ang: 0.1, th: .76, sp: 4.2 * fs, w: 1.3 * fw, a: .82, dark: true }],
        // fine: graphite on the skin (colour hatching reads as blotches), and lit skin left as bare paper, like a portrait
        // drawing: the strokes go into the features and the shadows, not across the cheeks
        ...(FINE ? { step: 1.6, len: [8, 22], white: .72, contrast: 1.7, pencil: (r, g, b, tt, oo, rnd) => { const [h, sa] = hsv(r, g, b); return (h < 12 || h > 340) && sa > .35 && rnd < .3 ? 'crimson' : rnd < .55 ? 'graphite' : 'lead'; } } : {}),
        ...(o.faceHatch || {}) });
    }
    pen.flush(L.g, ord);
    contourField(pen, Fc, cv, { seed: dIdx * 19 + 7, pencil: night ? 'white' : 'graphite', hi: .2, lo: .08, minLen: 8, w: 1.2, alpha: .6, jit: .7, mask: faceMaskM,
      ...(FINE ? { hi: .14, lo: .05, minLen: 5, w: .85, alpha: .75, jit: .35 } : {}), ...(o.faceContour || {}) });
    pen.flush(L.g, ord);
    if (o.faceLines !== false && !FINE) { faceLines(pen, fm, view, { paper: o.paper ?? 'night', seed: dIdx, lips: !MG, ...(o.faceLines || {}) }); pen.flush(L.g, ord); }   // false: unreliable landmarks, edges only
    if (MG) { drawMouth(pen, L.g, MG, { paper: o.paper ?? 'night', seed: dIdx, mono: FINE }); pen.flush(L.g, ord); }
  }
  if (o.extra) { o.extra(pen, F, view, dIdx); pen.flush(L.g, ord); }
  toothIn(L, dIdx);
  G.globalAlpha = o.alpha ?? 1;
  if (!night) G.globalCompositeOperation = 'multiply';     // pigment on white paper darkens where strokes cross
  G.drawImage(L.c, 0, 0); G.globalAlpha = 1; G.globalCompositeOperation = 'source-over';
  return { F, view, dIdx, tp: tpq };
}
// A knockout behind type: strokes thin out inside soft-edged screen rects [x0, y0, x1, y1], as if the artist left room for the words
function quiet(rects, k = .8, soft = .45) {
  // rounded (superelliptic) falloff scaled to each rect, so the clearing has no straight edges
  return (X, Y) => { let m = 1; for (const [x0, y0, x1, y1] of rects) { const hx = (x1 - x0) / 2, hy = (y1 - y0) / 2, d = Math.pow(Math.pow(Math.abs(X - x0 - hx) / hx, 4) + Math.pow(Math.abs(Y - y0 - hy) / hy, 4), .25); m = Math.min(m, 1 - k * smooth(clamp((1 + soft - d) / (2 * soft)))); } return m; };
}
// screen position of the plate's sun
function sunScreen(id, tp, view) { const m = plateMeta(id, tp); if (!m) return null; const [x, y] = view.toScreen(m.sun[0], m.sun[1]); return [x, y, m.sun[2]]; }

// Beat "punch": a small scale kick on each beat, used in hooks and drops.
function punch(t, amt = .025, every = 1) { return 1 + amt * pulse(t, 7, every); }
async function withZoom(s, fn) { G.save(); G.translate(W / 2, H / 2); G.scale(s, s); G.translate(-W / 2, -H / 2); try { return await fn(); } finally { G.restore(); } }

// Big stacked lyric words with entrances keyed to their sung times.
// items: [{s, t, x, y, size, col, font, align, style:'slam'|'rise'|'type', ls}]
function lyricStack(t, items, o = {}) {
  const L = typeLayer();
  for (const it of items) {
    const k = clamp((t - it.t) / (it.dur ?? .16));
    if (k <= 0) continue;
    const font = it.font ?? FONT.impact(it.size ?? 190);
    const style = it.style ?? 'slam';
    const alpha = (it.alpha ?? 1) * (o.alpha ?? 1);
    if (style === 'slam') {
      const s = lerp(1.28, 1, backOut(k)), a = clamp(k * 2);
      text(L.g, it.s, it.x, it.y, { font, col: it.col ?? 'white', align: it.align, ls: it.ls, sx: s, sy: s, alpha: a * alpha });
    } else if (style === 'rise') {
      const e = expoOut(k);
      text(L.g, it.s, it.x, it.y + (1 - e) * (it.size ?? 190) * .35, { font, col: it.col ?? 'white', align: it.align, ls: it.ls, alpha: e * alpha, stroke: it.stroke, strokeCol: it.strokeCol });
    } else if (style === 'type') {
      const n = Math.ceil(it.s.length * clamp((t - it.t) / (it.dur ?? .4)));
      text(L.g, it.s.slice(0, n), it.x, it.y, { font, col: it.col ?? 'white', align: it.align, ls: it.ls, alpha });
    } else if (style === 'drift') { // weightless letters drifting apart
      const age = t - it.t;
      letters(L.g, it.s, it.x, it.y, font, it.col ?? 'white', (i) => {
        const h1 = hash2(i, 5), h2 = hash2(i, 6), h3 = hash2(i, 7);
        return { dx: (h1 - .5) * age * 26, dy: (h2 - .6) * age * 22 - age * 4, rot: (h3 - .5) * age * .22, alpha: clamp((age - i * .03) / .15) };
      }, { align: it.align, ls: it.ls, alpha });
    }
  }
  typeFlush(L, drawClock(t, 12).n, o.grain ?? .5);
}

// EVA telemetry: the 12 min 09 s spacewalk compressed into the song's 8.0 → 58.6 s.
const EVA0 = 7.99, EVA1 = 58.6, EVA_SECS = 12 * 60 + 9;
function evaClock(t) { const s = clamp((t - EVA0) / (EVA1 - EVA0)) * EVA_SECS; return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }
function suitPressure(t) { // atm: bled in steps on each "breath"
  const w = (linesIn('pre')[0] || { words: [] }).words;
  const steps = [[w[0]?.[0] ?? 44.6, .40], [w[6]?.[0] ?? 47.2, .35], [w[8]?.[0] ?? 47.9, .30], [50.2, .27]];
  let p = .40; for (const [ts, v] of steps) if (t >= ts) p = v; return p;
}
function evaHud(t, o = {}) {
  if (t < EVA0 - .2 || t > EVA1 + 1) return;
  const Lt = typeLayer(), g = Lt.g, a = o.alpha ?? .9;
  const p = suitPressure(t), low = p < .31;
  tele(g, 'ВОСХОД-2 · ВЫХОД В КОСМОС', 60, 64, t, EVA0, { size: 20, weight: 700, col: 'verm', instant: true, alpha: a });
  tele(g, `EVA ${evaClock(t)}`, W - 60, 64, t, EVA0, { size: 24, weight: 800, col: 'white', instant: true, align: 'right', alpha: a });
  tele(g, `SUIT ${p.toFixed(2)} ATM`, W - 60, 100, t, EVA0, { size: 20, weight: 700, col: low ? 'verm' : 'silver', instant: true, align: 'right', alpha: a * (low ? (.6 + .4 * (frac(t * 3) < .5)) : 1) });
  typeFlush(Lt, drawClock(t, 12).n, .3);
}
// text set around a circle (porthole rings)
function circleText(g, s, cx, cy, r, a0, font, col, o = {}) {
  g.save(); setFont(g, font, o.ls ?? 0); g.fillStyle = P[col] || col; g.textAlign = 'center'; g.textBaseline = 'middle'; g.globalAlpha = o.alpha ?? 1;
  const total = g.measureText(s).width, span = total / r;
  let a = a0 - span / 2;
  for (const ch of s) {
    const cw = g.measureText(ch).width, da = cw / r;
    g.save(); g.translate(cx + Math.cos(a + da / 2) * r, cy + Math.sin(a + da / 2) * r); g.rotate(a + da / 2 + Math.PI / 2); g.fillText(ch, 0, 0); g.restore();
    a += da;
  }
  g.restore();
}
// red panic scribble creeping in from the frame edges (k 0..1)
function edgePanic(pen, k, seed) {
  if (k <= 0) return;
  const n = Math.floor(4 + k * 22);
  for (let i = 0; i < n; i++) {
    const side = i % 4, u = hash2(i, seed);
    const depth = 40 + k * 260 * hash2(i, seed + 1);
    const x = side === 0 ? u * W : side === 1 ? W - depth * .5 : side === 2 ? u * W : depth * .5;
    const y = side === 0 ? depth * .5 : side === 1 ? u * H : side === 2 ? H - depth * .5 : u * H;
    scribble(pen, x, y, side % 2 ? depth * .6 : 160, side % 2 ? 160 : depth * .6, { n: 18 + Math.floor(k * 30), seed: seed + i * 13, col: hash2(i, seed + 3) < .7 ? 'verm' : 'crimson', w: 1.4 + k, alpha: .35 + k * .5, step: 22 });
  }
}

// A plate drawn into a rectangle of the frame (grids, split screens). rect = [x, y, w, h].
async function drawPlateIn(t, id, tp, rect, o = {}) {
  const [rx, ry, rw, rh] = rect, z = o.zoom ?? 1;
  // cover-fit the 16:9 plate into the rect, then zoom about (cx, cy)
  const cover = Math.max(rw / W, rh / H) * z;
  const view = { zoom: cover, ox: rx + rw / 2 - W / 2 + (o.ox ?? 0), oy: ry + rh / 2 - H / 2 + (o.oy ?? 0), cx: o.cx ?? .5, cy: o.cy ?? .5 };
  G.save(); G.beginPath(); G.rect(rx, ry, rw, rh); G.clip();
  if (o.paper) paper(G, o.paper);
  const r = await drawPlate(t, id, tp, { ...o, view, hatch: { spacing: o.spacing ?? 7, region: [rx, ry, rx + rw, ry + rh], ...(o.hatch || {}) } });
  G.restore();
  if (o.frame !== false) { // pencil frame line around the panel
    const pen = new Pen(), d = drawClock(t, 12).n, col = o.frameCol ?? (o.paper === 'snow' ? 'graphite' : 'white');
    const q = [[rx, ry], [rx + rw, ry], [rx + rw, ry + rh], [rx, ry + rh], [rx, ry]].map(([x, y], i) => [x + (hash2(i, d) - .5) * 2, y + (hash2(i, d + 1) - .5) * 2]);
    pen.poly(q, col, 2, .9, .02); const L = layer(4); pen.flush(L.g); G.drawImage(L.c, 0, 0);
  }
  return r;
}

// A take that is already a pencil drawing on paper (Jade's kept drawing, animated: tools/jade_sing.py) laid straight onto the
// page, never redrawn: the take's own paper colour (index "paper") is divided out and the graphite multiplied onto the sheet,
// as tools/jade_keep.py does for the approved stills. Full height, right of centre (framing A); the cut sleeve fades out.
// A take without a "paper" entry is a full 16:9 frame (on location) and is drawn as it is.
const _pt = makeCanvas(8, 8), _ptg = _pt.getContext('2d', { willReadFrequently: true });
async function paperTake(id, tp, o = {}) {
  const P0 = PLATES[id];
  if (!P0) { text(G, `[ plate "${id}" not generated yet ]`, W / 2, H / 2, { font: FONT.mono(28, 700), col: 'verm', align: 'center' }); return; }
  const im = await plateImage(id, tp), h = o.h ?? H, w = Math.round(P0.w * h / P0.h), x = o.x ?? W - w - Math.round(W * .078);
  if (!P0.paper) { G.save(); G.setTransform(1, 0, 0, 1, 0, 0); G.drawImage(im, 0, 0, W, H); G.restore(); return; }   // a full-frame take (on location): as it is
  _pt.width = w; _pt.height = h; _ptg.drawImage(im, 0, 0, w, h);
  const D = _ptg.getImageData(0, 0, w, h), d = D.data, [pr, pg, pb] = P0.paper, fl = (o.fadeLeft ?? .15) * w;
  for (let i = 0; i < w; i++) {
    const a = i < fl ? Math.pow(i / fl, 1.5) : 1;
    for (let j = 0; j < h; j++) {
      const k = (j * w + i) * 4;
      d[k] = 255 - (255 - Math.min(255, d[k] * 255 / pr)) * a;
      d[k + 1] = 255 - (255 - Math.min(255, d[k + 1] * 255 / pg)) * a;
      d[k + 2] = 255 - (255 - Math.min(255, d[k + 2] * 255 / pb)) * a;
    }
  }
  _ptg.putImageData(D, 0, 0);
  G.save(); G.setTransform(1, 0, 0, 1, 0, 0); G.globalCompositeOperation = 'multiply'; G.drawImage(_pt, x, o.y ?? 0); G.restore();
}

// Burn-through: everything outside `inside` stays; a ragged, glowing hole of radius r reveals what `drawInside` paints.
async function burnThrough(t, cx, cy, r, drawInside, seed = 7) {
  if (r <= 0) return;
  const pts = [];
  for (let i = 0; i <= 96; i++) { const a = i / 96 * TAU, n = fbm(Math.cos(a) * 2 + seed, Math.sin(a) * 2 + t * .3, seed, 3); pts.push([cx + Math.cos(a) * r * (.75 + .5 * n), cy + Math.sin(a) * r * (.75 + .5 * n)]); }
  const S = makeCanvasCached('burn'); const sg = S.getContext('2d');
  sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, W, H);
  // paint the inside world into S via the main canvas swap
  const saved = G.getImageData ? null : null;
  const tmp = makeCanvasCached('burnSave'); const tg = tmp.getContext('2d'); tg.clearRect(0, 0, W, H); tg.drawImage(OUT, 0, 0);
  await drawInside();
  sg.drawImage(OUT, 0, 0);
  G.setTransform(1, 0, 0, 1, 0, 0); G.globalCompositeOperation = 'source-over'; G.globalAlpha = 1; G.drawImage(tmp, 0, 0);
  G.save(); G.beginPath(); pts.forEach(([x, y], i) => i ? G.lineTo(x, y) : G.moveTo(x, y)); G.closePath(); G.clip(); G.drawImage(S, 0, 0); G.restore();
  // charred rim + embers
  const pen = new Pen(), d = drawClock(t, 24).n, L = layer(4);
  for (let pass = 0; pass < 3; pass++) {
    const off = [-10, 0, 9][pass], col = ['crimson', 'orange', 'gold'][pass];
    const q = pts.map(([x, y], i) => { const a = Math.atan2(y - cy, x - cx); return [x + Math.cos(a) * off + (hash3(i, d, pass) - .5) * 5, y + Math.sin(a) * off + (hash3(i, d, pass + 3) - .5) * 5]; });
    pen.poly(q, col, [6, 3.5, 2][pass], [.9, .95, .8][pass], .02);
  }
  for (let i = 0; i < 60; i++) { const k = Math.floor(hash2(i, d) * pts.length), [x, y] = pts[k], a = Math.atan2(y - cy, x - cx); const L2 = 10 + 40 * hash2(i, d + 1); pen.l(x, y, x + Math.cos(a) * L2, y + Math.sin(a) * L2, hash2(i, d + 2) < .5 ? 'gold' : 'orange', 1.6, .8); }
  pen.flush(L.g, ORDER_NIGHT); toothIn(L, d); G.drawImage(L.c, 0, 0);
}
const _cc = {};
function makeCanvasCached(k) { if (!_cc[k]) _cc[k] = makeCanvas(); return _cc[k]; }

// Handwriting write-on: text revealed left→right with a pencil tip, grained like graphite.
// o.page = [a, b, c, d]: lay the line on a page seen at an angle (text x → screen (a, b), text y → (c, d), about the anchor x, y)
function handwrite(t, s, x, y, t0, t1, o = {}) {
  const k = clamp((t - t0) / (t1 - t0)); if (k <= 0) return;
  const L = typeLayer(), g = L.g, font = o.font ?? FONT.serif(o.size ?? 110);
  const w = measure(g, s, font, o.ls ?? 0);
  const x0 = o.align === 'center' ? x - w / 2 : x;
  g.save(); g.beginPath(); g.rect(x0 - 20, y - (o.size ?? 110) * 1.2, (w + 40) * k, (o.size ?? 110) * 1.6); g.clip();
  // slightly doubled strokes like pencil pressure
  text(g, s, x0 + .8, y + .6, { font, col: o.col ?? 'graphite', alpha: .55, ls: o.ls });
  text(g, s, x0, y, { font, col: o.col ?? 'graphite', alpha: .92, ls: o.ls });
  g.restore();
  if (k < 1) { const tx = x0 + w * k; g.fillStyle = P[o.col ?? 'graphite']; g.globalAlpha = .8; g.beginPath(); g.arc(tx, y - (o.size ?? 110) * .3 + Math.sin(t * 40) * 6, 3, 0, TAU); g.fill(); g.globalAlpha = 1; }
  if (!o.page) { typeFlush(L, drawClock(t, 12).n, .8); return; }
  const [a, b, c, d] = o.page;
  G.save(); G.transform(a, b, c, d, x - a * x - c * y, y - b * x - d * y); typeFlush(L, drawClock(t, 12).n, .8); G.restore();
}

// Vocal-chop word slams: [[time, word, x, y, size, col]] — each word hits hard and fades by the next.
function chopWords(t, items, o = {}) {
  let cur = null; for (const it of items) if (t >= it[0]) cur = it;
  if (!cur) return;
  const age = t - cur[0], k = clamp(age / .08), fade = clamp(1 - (age - (o.hold ?? .45)) / .25);
  if (fade <= 0) return;
  lyricStack(t, [{ s: cur[1], t: cur[0], x: cur[2], y: cur[3], size: cur[4], col: cur[5] ?? 'white', align: 'center', style: 'slam', alpha: fade }]);
}

// A navigator's sketch map of the descent: the planned landing zone and the line running past it.
function descentMap(t, t0, o = {}) {
  // North up. The planned landing zone lay in the Kazakh steppe, south-east of the Urals; a late, hand-fired
  // retro burn on a later orbit (track shifted west) put Voskhod-2 down far to the north-west, west of the Urals, near Perm.
  const pen = new Pen(), d = drawClock(t, 12).n, L = layer(2);
  const k = clamp((t - t0) / (o.dur ?? 4.5));
  // graticule
  for (let i = 0; i <= 8; i++) { const x = 160 + i * 200; pen.l(x + (hash2(i, d) - .5) * 3, 120, x, H - 120, 'lead', 1, .3); }
  for (let j = 0; j <= 4; j++) { const y = 140 + j * 200; pen.l(140, y, W - 140, y + (hash2(j, d) - .5) * 3, 'lead', 1, .3); }
  // the Ural range: a hatched ridge running north-south
  for (let i = 0; i < 64; i++) { const y = 150 + i * 11, x = 1130 + Math.sin(i * .35) * 30 + i * 1.2 + (hash2(i, 3) - .5) * 20; pen.l(x - 18, y + 8, x, y - 8, 'graphite', 1.6, .6); pen.l(x, y - 8, x + 18, y + 8, 'graphite', 1.6, .6); }
  const tx = 1510, ty = 860, ax = 700, ay = 300;
  const ring = (x, y, r, col, a) => { const q = []; for (let a2 = 0; a2 <= TAU + .1; a2 += .15) q.push([x + Math.cos(a2) * r + (hash2(Math.round(a2 * 10), d) - .5) * 3, y + Math.sin(a2) * r + (hash2(Math.round(a2 * 10), d + 1) - .5) * 3]); pen.poly(q, col, 2.2, a, .02); };
  ring(tx, ty, 70, 'graphite', .9); ring(tx, ty, 8, 'graphite', .9);
  // the planned ground track (dashed graphite), from the south-west into the zone
  for (let i = 0; i < 26; i++) { const u0 = i / 26, u1 = u0 + .5 / 26; const P = u => [lerp(180, tx, u), lerp(1040, ty, u) - Math.sin(u * Math.PI) * 90]; const [x0, y0] = P(u0), [x1, y1] = P(u1); pen.l(x0, y0, x1, y1, 'graphite', 1.6, .55); }
  // the actual track (vermilion): further west, longer, bending north to the taiga
  const path = []; for (let i = 0; i <= 60; i++) { const u = i / 60; path.push([lerp(120, ax, u) + Math.sin(u * 2.6) * 90, lerp(930, ay, Math.pow(u, .85))]); }
  const n = Math.max(2, Math.floor(path.length * k)), head = path[n - 1];
  pen.poly(path.slice(0, n), 'verm', 3.4, .95, .03);
  if (k < .98) { const q = []; for (let a2 = 0; a2 <= TAU + .1; a2 += .5) q.push([head[0] + Math.cos(a2) * 11, head[1] + Math.sin(a2) * 11]); pen.poly(q, 'crimson', 2.6, .95, .02); }   // the capsule
  if (k > .98) { const s2 = 26 * (1 + .25 * pulse(t, 6)); pen.l(ax - s2, ay - s2, ax + s2, ay + s2, 'verm', 4, .95); pen.l(ax - s2, ay + s2, ax + s2, ay - s2, 'verm', 4, .95); }
  pen.flush(L.g, ORDER_SNOW); toothIn(L, d); G.globalCompositeOperation = 'multiply'; G.drawImage(L.c, 0, 0); G.globalCompositeOperation = 'source-over';
  const Lt = typeLayer();
  tele(Lt.g, 'PLANNED LANDING ZONE', tx - 90, ty + 110, t, t0 + .3, { size: 24, weight: 700, col: 'graphite', dur: .5, align: 'right' });
  tele(Lt.g, 'KAZAKH STEPPE', tx - 90, ty + 146, t, t0 + .5, { size: 20, col: 'lead', dur: .4, align: 'right' });
  tele(Lt.g, 'УРАЛ · URALS', 1210, 180, t, t0 + .6, { size: 22, col: 'lead', dur: .4 });
  if (k > .98) { tele(Lt.g, 'ACTUAL: THE TAIGA NEAR PERM', ax + 50, ay - 30, t, t0 + (o.dur ?? 4.5), { size: 28, weight: 800, col: 'verm', dur: .6 }); tele(Lt.g, 'DEEP SNOW · NO ROADS · WOLVES', ax + 50, ay + 10, t, t0 + (o.dur ?? 4.5) + .4, { size: 22, weight: 700, col: 'graphite', dur: .5 }); }
  typeFlush(Lt, d, .3);
}

// ------------------------------------------------------------------ shots
async function initShots() {
  for (const id of Object.keys(PLATES)) { try { META[id] = await loadJSON(`plates/${id}/meta.json`); } catch (e) { } }
  const S = sec => secT(sec);
  const [intro0, intro1] = S('intro').slice(1), [hk0, hk1] = S('hook1').slice(1);
  const L1 = linesIn('intro'), H1 = linesIn('hook1');

  // I1 · The poster draws itself (0 → first beat)
  const POSTER_TP = 4.4, FIRST_BEAT = B(7);
  shot('I1_poster', 0, FIRST_BEAT, async (t, lt, dur) => {
    paper(G, 'night');
    const k = clamp(lt / 2.45);                          // drawing progress
    const view = { zoom: 1.06, ox: 120, oy: 20 };
    // the sun (plate meta) in screen space; the drawing grows outward from the sunrise
    const sm = (META.hero_sunrise || [])[plateIndex('hero_sunrise', POSTER_TP) - 1], su = sm ? sm.sun : [.88, .44];
    const sun = [W / 2 + view.ox + (su[0] - .5) * W * view.zoom, H / 2 + view.oy + (su[1] - .5) * H * view.zoom];
    const rk = (X, Y, h) => clamp(Math.hypot(X - sun[0], Y - sun[1]) / 2000) * .75 + h * .25;
    const done = k >= 1;
    const r = await drawPlate(t, 'hero_sunrise', 0, {
      hold: POSTER_TP, view, fixedSeed: done ? undefined : 11,
      contour: { reveal: clamp(k * 1.6), revealKey: rk, hi: .14, lo: .06 },
      hatch: { reveal: clamp((k - .15) * 1.35), revealKey: rk, spacing: 6.5 },
      sil: { reveal: clamp(k * 1.8), revealKey: rk },
      under: (pen, F, v, dI) => {
        // the sunrise is already burning on the first frame (the thumbnail); everything else is drawn out of its light
        const e = .75 + .25 * easeOut(clamp((k - .2) / .6));
        raysFrom(pen, sun[0], sun[1], { n: 1100, r0: 16, r1: 1600, energy: e, seed: 21, jseed: dI, w: [1.5, 3.4], alpha: [.55, 1] });
        raysFrom(pen, sun[0], sun[1], { n: 700, r0: 0, r1: 240, energy: 1, seed: 23, jseed: dI, cols: ['white', 'gold', 'gold', 'white', 'orange'], w: [2, 4.2], alpha: [.85, 1] });
      },
    });
    // title lockup lands when the drawing is ~85% done
    const tt = 2.1;
    lyricStack(t, [
      { s: 'ORBITAL', t: tt, x: 110, y: 420, size: 230, style: 'slam' },
      { s: 'SUNRISE', t: tt + .12, x: 110, y: 640, size: 230, style: 'slam' },
      { s: 'ОРБИТАЛЬНЫЙ ВОСХОД', t: tt + .3, x: 116, y: 716, font: FONT.cyr(52), col: 'verm', style: 'rise', ls: 3 },
      { s: '18.03.1965 — THE FIRST SPACEWALK', t: tt + .25, x: 118, y: 790, font: FONT.mono(26, 700), col: 'silver', style: 'type', dur: .3, ls: 2 },
    ]);
  });

  // I2 · The sun sets; the ship; the hatch opens (first beat → "First")
  shot('I2_hatch', FIRST_BEAT, L1[0].t0 - .05, async (t, lt, dur) => {
    paper(G, 'night');
    const { n: dIdx } = drawClock(t, 8);
    const pen = new Pen(), Lr = layer(1);
    // the hatch: a circle opening onto the Earth
    const open = easeInOut(clamp((lt - .6) / (dur - .6)));
    const cx = W * .62, cy = H * .52, R = 40 + open * 560;
    if (open > 0) {
      const M = layer(2);
      const p2 = new Pen();
      earthDisc(p2, cx + 120, cy + 1150, 1350, 1, { lit: .9, litA: -Math.PI / 2 - .5, spacing: 8, jseed: dIdx });
      sunriseBands(p2, cx + 120, cy + 1150, 1350, -Math.PI / 2 - .7, -Math.PI / 2 + .3, .35, 3, { sunA: -Math.PI / 2 - .5, thick: 30, jseed: dIdx });
      starfield(p2, 4, 160, { region: [cx - R, cy - R, cx + R, cy + R] });
      p2.flush(M.g, ORDER_NIGHT);
      M.g.globalCompositeOperation = 'destination-in'; M.g.beginPath(); M.g.arc(cx, cy, R, 0, TAU); M.g.fill(); M.g.globalCompositeOperation = 'source-over';
      Lr.g.drawImage(M.c, 0, 0);
    }
    // hatch rim: a doubled pencil circle with bolts
    for (let pass = 0; pass < 2; pass++) {
      const pts = []; for (let a = 0; a <= TAU + .2; a += .04) { const j = (hash2(Math.round(a * 100), dIdx + pass) - .5) * 3; pts.push([cx + Math.cos(a) * (R + j + pass * 4), cy + Math.sin(a) * (R + j + pass * 4)]); }
      pen.poly(pts, pass ? 'silver' : 'white', pass ? 1.2 : 2.2, pass ? .5 : .9, .05);
    }
    for (let i = 0; i < 16; i++) { const a = i / 16 * TAU; pen.dot(cx + Math.cos(a) * (R + 22), cy + Math.sin(a) * (R + 22), 2.5, 'silver', .8); }
    pen.flush(Lr.g, ORDER_NIGHT);
    toothIn(Lr, dIdx); G.drawImage(Lr.c, 0, 0);
    // mission card, typed on the beats
    const Lt = typeLayer(), bt = n => B(8 + n * 2);
    tele(Lt.g, '18 MARCH 1965', 120, 250, t, bt(0), { size: 30, weight: 700, col: 'white', dur: .35 });
    tele(Lt.g, 'ВОСХОД-2 · VOSKHOD-2', 120, 300, t, bt(1), { size: 30, weight: 700, col: 'verm', dur: .4 });
    tele(Lt.g, '«ВОСХОД» MEANS «SUNRISE»', 120, 350, t, bt(2), { size: 24, col: 'silver', dur: .45 });
    tele(Lt.g, 'ORBIT 2 · ALTITUDE ~500 KM', 120, 420, t, bt(3), { size: 24, col: 'silver', dur: .45 });
    typeFlush(Lt, dIdx, .4);
  });

  // I3 · First man floating in the void of space
  shot('I3_firstman', L1[0].t0 - .05, L1[1].t0 - .05, async (t, lt, dur) => {
    paper(G, 'night');
    await drawPlate(t, 'airlock_exit', 1.2 + lt * .95, { view: { zoom: 1.02, oy: 30 }, hatch: { spacing: 7 } });
    const w = L1[0].words; // First man floating in the void of space
    lyricStack(t, [
      { s: 'FIRST', t: w[0][0], x: W - 110, y: 250, size: 210, align: 'right', style: 'slam' },
      { s: 'MAN', t: w[1][0], x: W - 110, y: 440, size: 210, align: 'right', style: 'slam' },
      { s: 'FLOATING', t: w[2][0], x: W - 110, y: 560, size: 96, align: 'right', style: 'drift' },
      { s: 'in the void of space', t: w[3][0], x: W - 116, y: 640, font: FONT.serif(64), col: 'cream', align: 'right', style: 'rise' },
    ]);
    const Lt = typeLayer();
    tele(Lt.g, '«ЧЕЛОВЕК ВЫШЕЛ В КОСМИЧЕСКОЕ ПРОСТРАНСТВО!»', 120, H - 120, t, w[4][0], { size: 24, weight: 700, col: 'verm', dur: .9 });
    tele(Lt.g, 'A MAN HAS STEPPED OUT INTO OPEN SPACE — BELYAYEV, BY RADIO', 120, H - 84, t, w[5][0] + .2, { size: 18, col: 'silver', dur: .8 });
    typeFlush(Lt, drawClock(t, 12).n, .4);
  });

  // I4 · Can't feel his hands
  shot('I4_hands', L1[1].t0 - .05, L1[1].words[4][0] - .05, async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'glove_cu', .3 + lt, { view: { zoom: 1.05, ox: 260 }, hatch: { spacing: 6.5 } });
    const w = L1[1].words;
    lyricStack(t, [
      { s: "CAN'T FEEL", t: w[0][0], x: 110, y: 470, size: 170, style: 'rise' },
      { s: 'HIS HANDS', t: w[2][0], x: 110, y: 640, size: 170, style: 'rise' },
    ]);
  });

  // I5 · can't feel his face
  shot('I5_face', L1[1].words[4][0] - .05, 20.5, async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'visor_cu', .5 + lt, { view: { zoom: 1.1, ox: -300, oy: 40 }, hatch: { spacing: 6.5 } });
    const w = L1[1].words;
    lyricStack(t, [
      { s: "CAN'T FEEL", t: w[4][0], x: W - 110, y: 470, size: 170, align: 'right', style: 'rise' },
      { s: 'HIS FACE', t: w[6][0], x: W - 110, y: 640, size: 170, align: 'right', style: 'rise' },
    ]);
  });

  // I6 + H1a · orbital night → THE SUNRISE (one continuous take of hero_sunrise)
  const SUN_AT = 2.0;                       // plate time where the sun breaks (refined from meta at boot)
  const sunBreak = (() => { const m = META.hero_sunrise; if (!m) return SUN_AT; const i = m.findIndex(f => f.sun[2] > .55 && f.hot > .0005); return i > 0 ? i / 24 : SUN_AT; })();
  const tpHero = t => sunBreak + (t - H1[0].t0);   // align the plate's sunrise with "Orbital"
  shot('I6_predawn', 20.5, hk0, async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'hero_sunrise', Math.max(0, tpHero(t)), { rate: 8, view: { zoom: 1.04 }, hatch: { spacing: 7 } });
    const Lt = typeLayer();
    const cd = [[B(60), '3'], [B(61), '2'], [B(62), '1']];
    tele(Lt.g, 'ORBITAL SUNRISE IN', W / 2 - 250, H - 150, t, 20.7, { size: 26, weight: 700, col: 'silver', dur: .6 });
    for (const [bt, s] of cd) if (t >= bt) { const k = clamp((t - bt) / .1); text(Lt.g, s, W / 2 + 190 + (+s === 3 ? 0 : +s === 2 ? 50 : 100), H - 150, { font: FONT.mono(40, 800), col: 'gold', alpha: k }); }
    typeFlush(Lt, drawClock(t, 12).n, .4);
  });

  shot('H1a_sunrise', hk0, H1[0].words[2][0] - .05, async (t, lt) => {
    paper(G, 'night');
    const z = punch(t, .018);
    await withZoom(z, () => drawPlate(t, 'hero_sunrise', tpHero(t), {
      view: { zoom: 1.04, ox: 180 }, hatch: { spacing: 6.5 },
      under: (pen, F, v) => {
        const s = sunScreen('hero_sunrise', tpHero(t), v); if (!s) return;
        const burst = expoOut(clamp((t - hk0) / .5));
        raysFrom(pen, s[0], s[1], { n: 380, r0: 10, r1: 1300, energy: burst * (.75 + .35 * pulse(t, 5)), seed: 31, jseed: drawClock(t, 12).n });
      },
    }));
    const w = H1[0].words;
    lyricStack(t, [
      { s: 'ORBITAL', t: w[0][0], x: 100, y: 430, size: 240, style: 'slam' },
      { s: 'SUNRISE', t: w[1][0], x: 100, y: 660, size: 240, style: 'slam' },
      { s: 'ОРБИТАЛЬНЫЙ ВОСХОД', t: w[1][0] + .35, x: 106, y: 738, font: FONT.cyr(54), col: 'verm', style: 'rise', ls: 3 },
    ]);
  });

  // H1b · burning gold
  shot('H1b_gold', H1[0].words[2][0] - .05, H1[1].t0 - .05, async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'visor_sunrise', 1.6 + lt, { view: { zoom: 1.12, ox: 330, oy: 30 }, hatch: { spacing: 6.5 } });
    const w = H1[0].words, d = drawClock(t, 12).n;
    if (t >= w[2][0]) hatchedText('BURNING', 110, 470, FONT.impact(210), { cols: ['gold', 'orange', 'gold', 'white'], edge: 'gold', seed: 41, jseed: d, drawIdx: d, alpha: clamp((t - w[2][0]) / .12) });
    if (t >= w[3][0]) hatchedText('GOLD', 110, 700, FONT.impact(250), { cols: ['gold', 'gold', 'orange', 'white'], edge: 'orange', seed: 46, jseed: d, drawIdx: d, alpha: clamp((t - w[3][0]) / .12) });
  });

  // H1c · Orbital sunrise (the wide)
  shot('H1c_wide', H1[1].t0 - .05, H1[1].words[2][0] - .05, async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'ship_wide_sunrise', 1 + lt, { view: { zoom: 1.02 }, hatch: { spacing: 6.5 } });
    const w = H1[1].words;
    lyricStack(t, [
      { s: 'ORBITAL SUNRISE', t: w[0][0], x: W / 2, y: H - 110, size: 150, align: 'center', style: 'rise', ls: 6 },
    ]);
  });

  // H1d · bring me home
  // the singer takes every "bring me home": her world is the white page (Earth, home)
  // Her kept drawing, animated singing, never redrawn or re-mouthed; lips matched to her vocal by ear: song time = 30.9 + lag +
  // take time (jade_loc: lag -0.22; the plain-paper take jade_sing3: 1.15). See docs/HANDOFF_JADE.md.
  shot('H1d_home', H1[1].words[2][0] - .05, hk1, async (t, lt) => {
    paper(G, 'snow');
    // On location (her pick): the model drew the Hill Country around her kept drawing, her own face kept, animated singing,
    // with the film's pencil engine over it at half strength so she boils like the other shots (as in "1B").
    // Review variants: ?h1d=over (1B: the plain-paper take), ?h1d=plain, ?h1d=js (engine only; loses her face), ?h1d=locfade
    const exp = new URLSearchParams(location.search).get('h1d') ?? 'loc';
    // ?h1d=locfade: everything but her face and hair faded toward the paper (tools/jade_fade.py --head); she found it goofy
    const loc = exp === 'loc' || exp === 'locfade', id = loc ? (exp === 'loc' ? 'jade_loc' : 'jade_locfade') : 'jade_sing3';
    const lag = +(new URLSearchParams(location.search).get('h1dlag') ?? -.22);  // her pick by ear ("G"); ?h1dlag= tries others
    const tp = loc ? t - (30.9 + lag) : t - 32.05;
    if (exp !== 'js') await paperTake(id, tp);
    if (exp !== 'plain') {
      G.save(); if (exp !== 'js') G.globalAlpha = .45;
      await drawPlate(t, loc ? id : 'jade_sing3_169', tp, { paper: 'snow', matte: false, face: false, view: { zoom: 1 }, hatch: { spacing: 6.2 } });
      G.restore();
    }
    const w = H1[1].words;
    lyricStack(t, [
      loc ? { s: 'bring me home', t: w[2][0], x: W - 110, y: 190, font: FONT.serif(124), col: 'crimson', style: 'rise', align: 'right' }   // on location: the open sky, top right
          : { s: 'bring me home', t: w[2][0], x: 110, y: H - 140, font: FONT.serif(124), col: 'crimson', style: 'rise' },
    ]);
  });

  // ---------------- swell · 34.34 → 44.40 · the suit balloons ----------------
  const [sw0, sw1] = S('swell').slice(1);
  shot('S1_reach', sw0, B(100), async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'camera_reach', .4 + lt, { view: { zoom: 1.04 } });
    evaHud(t);
    const Lt = typeLayer();
    tele(Lt.g, 'HE TRIES TO REACH THE CAMERA ON HIS LEG.', 110, H - 120, t, sw0 + .4, { size: 26, weight: 700, col: 'white', dur: 1.1 });
    tele(Lt.g, 'THE SUIT WILL NOT BEND.', 110, H - 78, t, sw0 + 1.8, { size: 26, weight: 700, col: 'verm', dur: .6 });
    typeFlush(Lt, drawClock(t, 12).n, .35);
  });
  shot('S2_balloon', B(100), B(108), async (t, lt, dur) => {
    paper(G, 'night');
    const { view } = await drawPlate(t, 'suit_balloon', .5 + lt, { view: { zoom: 1.03 } });
    evaHud(t);
    // dimension marks spreading: the suit is swelling
    const k = easeInOut(clamp(lt / dur)), pen = new Pen(), Lr = layer(2), d = drawClock(t, 12).n;
    const cx = W * .5, y = H * .84, half = 330 + k * 120;
    for (const s of [-1, 1]) {
      pen.l(cx + s * half, y - 60, cx + s * half, y + 30, 'gold', 2, .9);
      pen.l(cx + s * half, y, cx + s * (half - 40), y - 10, 'gold', 2, .9); pen.l(cx + s * half, y, cx + s * (half - 40), y + 10, 'gold', 2, .9);
    }
    pen.l(cx - half, y, cx + half, y, 'gold', 1.4, .7);
    pen.flush(Lr.g, ORDER_NIGHT); toothIn(Lr, d); G.drawImage(Lr.c, 0, 0);
    const Lt = typeLayer();
    text(Lt.g, `+${Math.round(k * 6)} CM`, cx, y - 26, { font: FONT.mono(34, 800), col: 'gold', align: 'center' });
    tele(Lt.g, 'IN VACUUM, THE SUIT BALLOONS', 110, 180, t, B(100) + .2, { size: 26, weight: 700, col: 'white', dur: .8 });
    typeFlush(Lt, d, .35);
  });
  shot('S3_nofit', B(108), 44.4, async (t, lt) => {
    paper(G, 'night');
    const k = clamp(lt / 4);
    // top-down at the Volga tube mouth: the ballooned suit wedged in the rim (face:false: the plate's face hits are on the CCCP helmet)
    await drawPlate(t, 'airlock_struggle', .6 + lt * 1.1, { view: { zoom: 1.03 }, face: false, hatch: { mask: quiet([[W / 2 - 330, H - 170, W / 2 + 330, H - 55]], .75) },
      extra: (pen) => edgePanic(pen, k * .35, drawClock(t, 12).n * 3) });
    evaHud(t);
    const Lt = typeLayer();
    tele(Lt.g, "HE CAN'T GET BACK IN.", W / 2 - 230, H - 100, t, B(109), { size: 40, weight: 800, col: 'white', dur: .7 });
    typeFlush(Lt, drawClock(t, 12).n, .35);
  });

  // ---------------- pre-chorus · 44.40 → 59.50 ----------------
  const PR = linesIn('pre');
  shot('P1_bleed', 44.4, PR[1].t0 - .05, async (t, lt) => {
    paper(G, 'night');
    const w = PR[0].words; // So he bleeds the air out, breath by breath
    const late = t >= w[6][0] - .05;
    // take 2: the gloved hand turns the small blue regulator tap on the chest; the type sits in a clearing on the shoulder
    await drawPlate(t, 'valve_bleed', .2 + lt, { view: { zoom: 1.05, ox: -260 },
      hatch: { mask: quiet(late ? [[W - 640, 220, W - 60, 800]] : [[W - 820, 300, W - 60, 620]], .8) } });
    evaHud(t);
    lyricStack(t, late ? [
      { s: 'BREATH', t: w[6][0], x: W - 100, y: 380, size: 200, align: 'right', style: 'slam' },
      { s: 'BY', t: w[7][0], x: W - 100, y: 560, size: 170, align: 'right', style: 'slam' },
      { s: 'BREATH', t: w[8][0], x: W - 100, y: 760, size: 200, align: 'right', style: 'slam' },
    ] : [
      { s: 'SO HE BLEEDS', t: w[0][0], x: W - 100, y: 420, size: 150, align: 'right', style: 'rise' },
      { s: 'THE AIR OUT', t: w[3][0], x: W - 100, y: 580, size: 150, align: 'right', style: 'rise' },
    ]);
  });
  shot('P2_edge', PR[1].t0 - .05, PR[2].t0 - .05, async (t, lt, dur) => {
    paper(G, 'night');
    const k = clamp(lt / dur);
    await drawPlate(t, 'tumble_slow', .5 + lt, { rate: 8, view: { zoom: 1.02 }, extra: (pen) => edgePanic(pen, .25 + k * .5, drawClock(t, 8).n * 5) });
    evaHud(t);
    const w = PR[1].words; // Dancing on the edge of a quiet death
    // the tightrope
    const Lt = typeLayer(), y = 330;
    const lk = clamp((t - w[0][0]) / .5);
    Lt.g.strokeStyle = P.white; Lt.g.lineWidth = 2; Lt.g.globalAlpha = .8; Lt.g.beginPath(); Lt.g.moveTo(80, y + 8); Lt.g.lineTo(80 + (W - 160) * lk, y + 8 + Math.sin(t * 2) * 2); Lt.g.stroke(); Lt.g.globalAlpha = 1;
    typeFlush(Lt, drawClock(t, 12).n, .3);
    lyricStack(t, [
      { s: 'DANCING ON THE EDGE', t: w[0][0], x: W / 2, y, size: 130, align: 'center', style: 'rise', ls: 4 },
      { s: 'of a quiet death', t: w[5][0], x: W / 2, y: y + 110, font: FONT.serif(80), col: 'cream', align: 'center', style: 'rise' },
    ]);
  });
  shot('P3_sleeve', PR[2].t0 - .05, PR[3].t0 - .05, async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'headfirst', .4 + lt, { view: { zoom: 1.03 }, extra: (pen) => edgePanic(pen, .55, drawClock(t, 12).n * 7) });
    evaHud(t);
    const w = PR[2].words; // Let his air out through the suit he wore
    lyricStack(t, [
      { s: 'LET HIS AIR OUT', t: w[0][0], x: 100, y: 250, size: 130, style: 'rise' },
      { s: 'THROUGH THE SUIT HE WORE', t: w[4][0], x: 100, y: 370, size: 96, style: 'rise' },
    ]);
  });
  // the airlock: cuts accelerate with the snare roll, drawn on ones at the end
  shot('P4_airlock', PR[3].t0 - .05, 59.5, async (t, lt, dur) => {
    paper(G, 'night');
    const k = clamp(lt / dur), roll = clamp((t - 57.2) / (59.5 - 57.2));
    const rate = roll > 0 ? 24 : 12;
    // during the roll, flash between the tube and close-ups every half beat, then every quarter
    // tube_struggle: he curls round inside the padded tube toward the hatch, ending on his sweating face (the face is real only from ~5.2 s)
    // Kenton: the tube read as roomy (the round hatch filled the frame, him small inside it); framed tight on him so the
    // padded walls crowd the edges, as in the real ~1 m airlock. ?p4zoom= to try others
    // Her notes: at true scale (Volga: ~1.0 m inside, 2.5 m long; Leonov ~1.9 m in the swollen suit) he lies in it like a hot
    // dog in a bun. Opens on a side cutaway of the sealed tube (airlock_cut, a still drawn by the pencil pass, slow push in to
    // his helmet), then the roll cuts to him from inside with the wall a hand's width above his visor (airlock_side).
    // The stills are re-toned for the night pencil by tools/airlock_stills.py (dark ribbed tube, him bright, his face lifted and
    // warm, subject mattes for a silhouette line). The push ends tight on his helmet, rolled a little so the grimace
    // (nose, bared teeth) reads the right way up and the ribs tilt into the snare roll; the inside view is framed whole,
    // rolled so his helmet sits left, below the lyric, and the glove on the wall stands clear of it on the right.
    // ?p4=old: the previous roomy tube_struggle take (?p4zoom= its framing)
    const old = new URLSearchParams(location.search).get('p4') === 'old';
    const pz = +(new URLSearchParams(location.search).get('p4zoom') ?? 1.7);
    let id = 'tube_struggle', tp = 1.6 + lt * 2, vz = { zoom: pz, cx: .56, cy: .5 };
    // push: from the whole tube (sat a little low, under the lyric) to his face at uv (.21, .465), held below the lyric (y≈730)
    if (!old) { const e = smooth(clamp(lt / (57.2 - (PR[3].t0 - .05)))); id = 'airlock_cut'; tp = 0; vz = { zoom: lerp(1.02, 3.0, e), cx: lerp(.5, .212, e), cy: lerp(.44, .4035, e), rot: e * .3 }; }
    if (roll > 0) {
      const step = roll < .5 ? 2 : 4, n = Math.floor(beatPos(t) * step);
      const alts = [[old ? 'tube_struggle' : 'airlock_side', old ? 7.2 : 0], ['valve_bleed', 3.5], ['visor_cu', 4.5], ['glove_cu', 3], ['suit_balloon', 4]];
      const a = alts[n % alts.length]; id = a[0]; tp = a[1] + frac(beatPos(t) * step) * .3; vz = id === 'airlock_side' ? { zoom: 1.2 + roll * .06, rot: .35, ox: 120, oy: 60 } : { zoom: 1.1 + roll * .25 };
    }
    // the stills' faces (hand-boxed in their meta) get the face pass, drawn from hatching and edges (no landmarks)
    const still = id === 'airlock_cut' || id === 'airlock_side';
    await drawPlate(t, id, tp, { rate, view: vz, face: id === 'tube_struggle' ? tp > 5.2 : still || undefined, ...(still ? { faceLines: false, faceHatch: { white: .66, contrast: 1.3 }, faceContour: { hi: .25, lo: .1 } } : {}), ...(id === 'airlock_cut' ? { aw: 960, ah: 540 } : {}),
      hatch: { mask: quiet([[W / 2 - 720, 150, W / 2 + 720, 450]], .75 * (1 - roll)) },
      extra: (pen) => edgePanic(pen, .5 + roll * .5, drawClock(t, rate).n * 11) });
    evaHud(t);
    const w = PR[3].words; // Ninety minutes inside the airlock door
    lyricStack(t, [
      { s: 'NINETY MINUTES', t: w[0][0], x: W / 2, y: 300, size: 170, align: 'center', style: 'slam' },
      { s: 'INSIDE THE AIRLOCK DOOR', t: w[2][0], x: W / 2, y: 420, size: 96, align: 'center', style: 'rise', ls: 3 },
    ], { alpha: 1 - roll * .6 });
    // the hatch slams: black on the last beat of the roll
    if (t > 59.5 - TM.beat * .5) { G.fillStyle = P.night; G.globalAlpha = .92; G.fillRect(0, 0, W, H); G.globalAlpha = 1; }
  });

  // ---------------- hook 2 · 59.50 → 70.94 · inside, relief ----------------
  const H2 = linesIn('hook2'), [h20, h21] = S('hook2').slice(1);
  shot('K1_porthole', h20, H2[0].words[2][0] - .05, async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'porthole_sunrise', .3 + lt, { view: { zoom: 1.02 } });
    const w = H2[0].words, Lt = typeLayer();
    const k1 = clamp((t - w[0][0]) / .2), k2 = clamp((t - w[1][0]) / .2);
    circleText(Lt.g, 'ORBITAL', W / 2, H / 2, 430, -Math.PI / 2 - .55, FONT.impact(110), 'white', { alpha: k1, ls: 10 });
    circleText(Lt.g, 'SUNRISE', W / 2, H / 2, 430, -Math.PI / 2 + .55, FONT.impact(110), 'gold', { alpha: k2, ls: 10 });
    typeFlush(Lt, drawClock(t, 12).n, .4);
  });
  shot('K2_gold', H2[0].words[2][0] - .05, H2[1].t0 - .05, async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'helmet_off', .4 + lt, { view: { zoom: 1.04, ox: 240 } });
    const w = H2[0].words, d = drawClock(t, 12).n;
    if (t >= w[2][0]) hatchedText('BURNING', 100, 460, FONT.impact(200), { cols: ['gold', 'orange', 'white'], edge: 'gold', seed: 43, jseed: d, drawIdx: d, alpha: clamp((t - w[2][0]) / .12) });
    if (t >= w[3][0]) hatchedText('GOLD', 100, 690, FONT.impact(240), { cols: ['gold', 'orange', 'gold'], edge: 'orange', seed: 48, jseed: d, drawIdx: d, alpha: clamp((t - w[3][0]) / .12) });
  });
  shot('K3_jettison', H2[1].t0 - .05, H2[1].words[2][0] - .05, async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'airlock_jettison', .5 + lt, { view: { zoom: 1.02 } });
    const w = H2[1].words;
    lyricStack(t, [{ s: 'ORBITAL SUNRISE', t: w[0][0], x: W / 2, y: H - 110, size: 150, align: 'center', style: 'rise', ls: 6 }]);
    const Lt = typeLayer();
    tele(Lt.g, 'THE AIRLOCK IS CAST OFF', 60, 64, t, w[0][0] + .3, { size: 22, weight: 700, col: 'silver', dur: .6 });
    typeFlush(Lt, drawClock(t, 12).n, .3);
  });
  // the recording studio at night: headphones on, singing past the condenser mic and its pop filter; medium shot (waist up).
  // The take is dark: lift it a little (more and her black hair goes to bare paper), hatch only its real darks (the face too,
  // with only its stronger edges), keep the skin mostly graphite (sat), and let the dark foam walls thin out well away from her
  // and the mic (she stands left of centre, the mic just right of her face), so they carry the frame.
  // The line sits bottom right, in a clearing over the foam wall and the mic stand.
  const studioSkin = (L, V) => .72 * Math.pow(smooth(clamp((.66 - (.55 * L + .45 * V)) / .56)), 1.6);   // at most three light layers: shadowed skin stays skin
  const studioLight = (X, Y) => clamp(1.3 - Math.hypot((X - 900) / 1.25, Y - 440) / 640, .12, 1) * quiet([[W - 860, H - 270, W - 60, H - 90]], .75)(X, Y);
  shot('K4_home', H2[1].words[2][0] - .05, h21, async (t, lt) => {
    paper(G, 'snow');
    // In the vocal booth, drawn around her kept drawing (her notes: headphones only on her head, mic beside her face, the
    // engineer a loose sketch behind the glass, no lamp), animated singing; the film's pencil over it at 45% as at 0:32.
    // Lips by ear: song time = 67.4 + 0.7 + take time (her "A"). ?k4=old: the previous renderer-drawn take.
    if (new URLSearchParams(location.search).get('k4') === 'old') {
      await singer(t, 'jade_studio_p', { view: { zoom: 1.02 }, ana: { gain: 1.1 }, lines: { contrast: 2.2, white: .62 },
        hatch: { spacing: 6.2, mask: studioLight }, faceHatch: { tone: studioSkin, pencilOpt: { sat: .5 } }, faceContour: { hi: .28, lo: .11 } });
    } else {
      // her Rare Earth nod: on the open tower platform above the clouds at night, arms spreading as she sings (take F, lips by
      // ear: her "A", song time = 67.4 + 0.5 + take time). ?k4=studio: the vocal-booth take (lag 0.7).
      const studio = new URLSearchParams(location.search).get('k4') === 'studio', id = studio ? 'jade_studio_loc' : 'jade_rare_her';
      const tp = t - (67.4 + +(new URLSearchParams(location.search).get('k4lag') ?? (studio ? .7 : .5)));
      await paperTake(id, tp);
      G.save(); G.globalAlpha = .45;
      await drawPlate(t, id, tp, { paper: 'snow', matte: false, face: false, view: { zoom: 1 }, hatch: { spacing: 6.2 } });
      G.restore();
    }
    const w = H2[1].words;
    lyricStack(t, [{ s: 'bring me home', t: w[2][0], x: W - 110, y: new URLSearchParams(location.search).get('k4') === 'old' ? H - 140 : 190,
      font: FONT.serif(124), col: 'crimson', align: 'right', style: 'rise', stroke: 18, strokeCol: 'white' }]);   // new take: top right, clear of the mic stand; a paper-cream halo lifts it off the foam
  });

  if (typeof initShots2 === 'function') await initShots2();
  SHOTS.sort((a, b) => a.t0 - b.t0);
}
