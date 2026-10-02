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

// EVA telemetry: the 12 min 09 s spacewalk compressed into the song's 8.0 → 58.6 s (released song times: O() moves them).
const EVA0 = 7.99, EVA1 = 58.6, EVA_SECS = 12 * 60 + 9;
function evaClock(t) { const s = clamp((t - O(EVA0)) / (O(EVA1) - O(EVA0))) * EVA_SECS; return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`; }
function suitPressure(t) { // atm: one switch from 0.40 to the suit's 0.27 reserve mode, on "So he bleeds" (his 1965 report and 2004 interview)
  const w = (linesIn('pre')[0] || { words: [] }).words;
  return t >= (w[0]?.[0] ?? O(44.6)) ? .27 : .40;
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
  const POSTER_TP = 4.4, FIRST_BEAT = B(Bn(8));   // beat 8 (≈3.32 s): the band comes in; beat 7 has no onset
  shot('I1_poster', 0, FIRST_BEAT, async (t, lt, dur) => {
    paper(G, 'night');
    const k = clamp(lt / 1.1);                           // drawing progress: done by ≈1.1 s, so the title can be read before the cut
    const view = { zoom: 1.06, ox: 120, oy: 20 };
    // the sun (plate meta) in screen space; the drawing grows outward from the sunrise
    const sm = (META.hero_sunrise || [])[plateIndex('hero_sunrise', POSTER_TP) - 1], su = sm ? sm.sun : [.88, .44];
    const sun = [W / 2 + view.ox + (su[0] - .5) * W * view.zoom, H / 2 + view.oy + (su[1] - .5) * H * view.zoom];
    const rk = (X, Y, h) => clamp(Math.hypot(X - sun[0], Y - sun[1]) / 2000) * .75 + h * .25;
    const done = k >= 1;
    // round 5: the poster is a frame of H1a, so it has the same simulated cable (the hoop painted out); ?i6=r4: the hoop
    const rope = I6_R5 && TD6 ? await i6Rope() : null;
    const r = await drawPlate(t, rope ? 'hero_sunrise_r5' : 'hero_sunrise', 0, {
      hold: POSTER_TP, view, fixedSeed: done ? undefined : 11,
      ...(rope ? { extra: i6Cable(rope, POSTER_TP - sunBreak + H1[0].t0, clamp((k - .1) * 1.4)) } : {}),
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
    // title lockup lands as the drawing fills in: all of it (the date typed last) readable by ≈1.2 s
    const tt = .65;
    lyricStack(t, [
      { s: 'ORBITAL', t: tt, x: 110, y: 420, size: 230, style: 'slam' },
      { s: 'SUNRISE', t: tt + .12, x: 110, y: 640, size: 230, style: 'slam' },
      { s: 'ОРБИТАЛЬНЫЙ ВОСХОД', t: tt + .3, x: 116, y: 716, font: FONT.cyr(52), col: 'verm', style: 'rise', ls: 3 },
      { s: '轨道日出', t: tt + .36, x: 118, y: 772, font: FONT.cjk(38), col: 'verm', style: 'rise', ls: 14 },
      { s: '18.03.1965 — THE FIRST SPACEWALK', t: tt + .25, x: 118, y: 836, font: FONT.mono(26, 700), col: 'silver', style: 'type', dur: .3, ls: 2 },
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
    tele(Lt.g, 'ORBIT 2 · APOGEE ~500 KM', 120, 420, t, bt(3), { size: 24, col: 'silver', dur: .45 });
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

  // ---- the extended recording's two new lines: the story's hinge. He floats free, but all that holds him is a line to the
  // ship; the ship has to take him back, and it can't: at the Volga's mouth, feet first (the plan), the ballooned suit jams
  // in the rim. Then "can't feel his hands, can't feel his face" is that suit from inside; P3 (after he bleeds the air) is
  // the head-first entry that works: his memoir's order.
  const N1W = L1[1].words, N2W = L1[2].words;   // Tied to the ship by the slightest trace · Pull him back to the ship's embrace
  // N1 · "Tied to the ship by the slightest trace": the extreme wide on tether_drift (generated from ship_wide_sunrise's first
  // frame, same framing): Voskhod-2 small at the top, him hanging below over the Earth, drifting away from the ship until the
  // tether goes taut. The take 1.2 → 7.95 s at ≈1x (his own drift, no retime), under a slow push-in that keeps the ship at the
  // top of frame. TIED / TO THE SHIP in the sky right of the airlock; on "by" the pencil traces the tether in gold from the
  // hatch lid down to where it meets him (his shoulders) while the line is sung, with the serif line and the caption left of it.
  // TETHER: the tether in plate uv every 0.5 s of plate time, [tp, 7 points from the lid end to his end, equally spaced in
  // height] (drawn as a Catmull-Rom curve through them): a thin-line ridge traced row by row down from the lid through the sky,
  // then through the bright limb and the clouds toward where it enters his matte (the first matte rows ≥ 5 px wide under the
  // line), a weighted quintic through those rows with outliers dropped, smoothed over ±3 frames (the lid end over ±12). The
  // take's tether bows and kinks as he drifts (most at 3.5 → 5.5 s), so a three-point quadratic no longer fits it.
  const TETHER1 = [
    [0.0, [0.4745, 0.2815], [0.4761, 0.3282], [0.4783, 0.375], [0.4803, 0.4218], [0.4823, 0.4685], [0.4842, 0.5153], [0.4865, 0.562]],
    [0.5, [0.4747, 0.2815], [0.4766, 0.3304], [0.479, 0.3794], [0.4813, 0.4283], [0.4836, 0.4772], [0.4857, 0.5262], [0.4878, 0.5751]],
    [1.0, [0.475, 0.2815], [0.4771, 0.3327], [0.4801, 0.3839], [0.4828, 0.4351], [0.4856, 0.4862], [0.4888, 0.5374], [0.4912, 0.5886]],
    [1.5, [0.475, 0.2815], [0.4777, 0.3354], [0.4813, 0.3892], [0.4847, 0.4431], [0.4883, 0.497], [0.4919, 0.5509], [0.4933, 0.6048]],
    [2.0, [0.4752, 0.2815], [0.4785, 0.3379], [0.4827, 0.3944], [0.4867, 0.4508], [0.4915, 0.5072], [0.4961, 0.5637], [0.493, 0.6201]],
    [2.5, [0.4757, 0.2815], [0.4794, 0.3408], [0.4843, 0.4001], [0.4888, 0.4594], [0.4949, 0.5187], [0.5007, 0.578], [0.4933, 0.6373]],
    [3.0, [0.4758, 0.2815], [0.4801, 0.3435], [0.4854, 0.4056], [0.4912, 0.4676], [0.4989, 0.5296], [0.5044, 0.5917], [0.4926, 0.6537]],
    [3.5, [0.476, 0.2815], [0.4807, 0.3463], [0.4864, 0.4111], [0.4952, 0.4759], [0.5021, 0.5407], [0.501, 0.6056], [0.4926, 0.6704]],
    [4.0, [0.4761, 0.2815], [0.4813, 0.3491], [0.488, 0.4167], [0.4988, 0.4843], [0.5044, 0.5519], [0.4977, 0.6194], [0.4918, 0.687]],
    [4.5, [0.4762, 0.2815], [0.4816, 0.3517], [0.4906, 0.4219], [0.4994, 0.4921], [0.5001, 0.5623], [0.4916, 0.6325], [0.4912, 0.7026]],
    [5.0, [0.4763, 0.2815], [0.4829, 0.3543], [0.4913, 0.4272], [0.4927, 0.5], [0.4899, 0.5728], [0.4885, 0.6457], [0.4872, 0.7185]],
    [5.5, [0.4766, 0.2815], [0.4826, 0.3574], [0.4817, 0.4332], [0.4825, 0.5091], [0.4856, 0.585], [0.4873, 0.6609], [0.4875, 0.7368]],
    [6.0, [0.472, 0.2815], [0.4743, 0.3598], [0.4765, 0.4381], [0.4795, 0.5164], [0.482, 0.5947], [0.4832, 0.673], [0.4866, 0.7513]],
    [6.5, [0.4715, 0.2815], [0.4732, 0.3601], [0.4749, 0.4387], [0.4769, 0.5173], [0.4786, 0.5959], [0.4797, 0.6746], [0.4817, 0.7532]],
    [7.0, [0.4709, 0.2815], [0.4723, 0.3594], [0.4734, 0.4373], [0.4747, 0.5152], [0.4758, 0.5931], [0.4765, 0.671], [0.4774, 0.7489]],
    [7.5, [0.4709, 0.2815], [0.4719, 0.3591], [0.4725, 0.4367], [0.474, 0.5143], [0.4752, 0.5919], [0.4752, 0.6695], [0.4766, 0.7471]],
    [8.0, [0.4709, 0.2815], [0.472, 0.3586], [0.4728, 0.4356], [0.474, 0.5127], [0.4751, 0.5898], [0.4755, 0.6669], [0.4763, 0.744]]];
  // Round 4 (her note: a loose curve that snaps taut, the 1965 footage's held breath): tether_drift take 2 (tether_drift_t2):
  // slack and curving as he drifts down, snapping straight at plate 4.95–5.1 s with a tug that rebounds him toward the ship
  // and lets the line bow again. Same measurement (11 points from the lid to where the line meets his matte; rows every 0.5 s,
  // every 1/12 s through the snap 4.5–6.5 s; frames where the ridge was lost interpolated from their neighbours; ±2 frames, never across the snap; the two motion-
  // blurred in-between frames take the straight line of 5.04 s).
  const TETHER2 = [
    [0.0, [0.482, 0.2815], [0.4832, 0.3114], [0.4844, 0.3414], [0.4858, 0.3713], [0.4873, 0.4012], [0.4885, 0.4312], [0.4898, 0.4611], [0.4911, 0.491], [0.4924, 0.521], [0.4937, 0.5509], [0.4979, 0.5809]],
    [0.5, [0.482, 0.2815], [0.4832, 0.313], [0.4845, 0.3444], [0.4858, 0.3759], [0.4871, 0.4074], [0.4884, 0.4389], [0.4896, 0.4704], [0.4907, 0.5019], [0.4919, 0.5333], [0.4927, 0.5648], [0.4976, 0.5963]],
    [1.0, [0.4821, 0.2815], [0.4832, 0.3146], [0.4843, 0.3478], [0.4854, 0.3809], [0.4866, 0.4141], [0.4878, 0.4472], [0.4891, 0.4804], [0.4901, 0.5135], [0.4909, 0.5467], [0.4919, 0.5798], [0.4976, 0.613]],
    [1.5, [0.4815, 0.2815], [0.4828, 0.3163], [0.4836, 0.3511], [0.485, 0.3859], [0.4856, 0.4207], [0.4866, 0.4556], [0.488, 0.4904], [0.4888, 0.5252], [0.4892, 0.56], [0.4899, 0.5948], [0.498, 0.6296]],
    [2.0, [0.4806, 0.2815], [0.4824, 0.3179], [0.4826, 0.3542], [0.4848, 0.3906], [0.4841, 0.427], [0.486, 0.4633], [0.4873, 0.4997], [0.4882, 0.5361], [0.4895, 0.5724], [0.49, 0.6088], [0.4981, 0.6452]],
    [2.5, [0.4805, 0.2815], [0.4821, 0.3193], [0.4815, 0.3572], [0.4846, 0.395], [0.4828, 0.4329], [0.4855, 0.4707], [0.4869, 0.5086], [0.4879, 0.5464], [0.4912, 0.5843], [0.4856, 0.6221], [0.4982, 0.66]],
    [3.0, [0.4843, 0.2815], [0.4817, 0.3207], [0.4807, 0.36], [0.4825, 0.3993], [0.4831, 0.4385], [0.4838, 0.4778], [0.4859, 0.517], [0.4916, 0.5563], [0.4936, 0.5956], [0.4943, 0.6348], [0.498, 0.6741]],
    [3.5, [0.4845, 0.2815], [0.4814, 0.3222], [0.4798, 0.3629], [0.4792, 0.4036], [0.4839, 0.4443], [0.482, 0.485], [0.4865, 0.5257], [0.4968, 0.5664], [0.4925, 0.6071], [0.491, 0.6478], [0.4984, 0.6885]],
    [4.0, [0.4845, 0.2815], [0.4813, 0.3236], [0.4788, 0.3657], [0.4769, 0.4078], [0.4827, 0.4499], [0.482, 0.492], [0.4918, 0.5341], [0.5, 0.5763], [0.4919, 0.6184], [0.4903, 0.6605], [0.4986, 0.7026]],
    [4.5, [0.4831, 0.2815], [0.481, 0.3249], [0.4761, 0.3683], [0.4764, 0.4117], [0.4774, 0.4551], [0.4825, 0.4985], [0.4996, 0.5419], [0.4984, 0.5853], [0.4871, 0.6287], [0.4869, 0.6721], [0.4993, 0.7156]],
    [4.5833, [0.4831, 0.2815], [0.481, 0.325], [0.4756, 0.3686], [0.4764, 0.4121], [0.4767, 0.4557], [0.4826, 0.4993], [0.5005, 0.5428], [0.4991, 0.5864], [0.4896, 0.6299], [0.4919, 0.6735], [0.4992, 0.717]],
    [4.6667, [0.4829, 0.2815], [0.4809, 0.3252], [0.4751, 0.369], [0.4765, 0.4127], [0.476, 0.4564], [0.4828, 0.5002], [0.5013, 0.5439], [0.4984, 0.5877], [0.4907, 0.6314], [0.4899, 0.6751], [0.4993, 0.7189]],
    [4.75, [0.4829, 0.2815], [0.4806, 0.3253], [0.4746, 0.3692], [0.4764, 0.413], [0.4755, 0.4569], [0.4831, 0.5007], [0.502, 0.5446], [0.4967, 0.5884], [0.4884, 0.6323], [0.495, 0.6761], [0.4992, 0.72]],
    [4.8333, [0.4827, 0.2815], [0.4803, 0.3255], [0.4741, 0.3696], [0.4764, 0.4136], [0.4751, 0.4576], [0.4841, 0.5017], [0.5018, 0.5457], [0.4964, 0.5897], [0.4888, 0.6338], [0.4987, 0.6778], [0.4992, 0.7219]],
    [4.9167, [0.4827, 0.2815], [0.4802, 0.3256], [0.4738, 0.3698], [0.4763, 0.4139], [0.475, 0.458], [0.4846, 0.5022], [0.5016, 0.5463], [0.497, 0.5904], [0.4879, 0.6346], [0.4945, 0.6787], [0.499, 0.7228]],
    [5.0, [0.4822, 0.2815], [0.4832, 0.3259], [0.4847, 0.3703], [0.486, 0.4147], [0.4876, 0.4591], [0.489, 0.5035], [0.4905, 0.5479], [0.4941, 0.5923], [0.4986, 0.6367], [0.4988, 0.6811], [0.4991, 0.7255]],
    [5.0833, [0.4821, 0.2815], [0.4832, 0.3256], [0.4847, 0.3697], [0.4861, 0.4138], [0.4876, 0.4579], [0.4889, 0.502], [0.4905, 0.5461], [0.493, 0.5903], [0.4971, 0.6344], [0.4986, 0.6785], [0.4993, 0.7226]],
    [5.1667, [0.4821, 0.2815], [0.4832, 0.3246], [0.4844, 0.3678], [0.4859, 0.4109], [0.4873, 0.4541], [0.4886, 0.4972], [0.4902, 0.5404], [0.4918, 0.5835], [0.4948, 0.6267], [0.4975, 0.6698], [0.4994, 0.713]],
    [5.25, [0.4819, 0.2815], [0.4829, 0.3227], [0.4838, 0.3639], [0.4853, 0.4051], [0.4866, 0.4464], [0.4879, 0.4876], [0.4893, 0.5288], [0.4907, 0.57], [0.4905, 0.6113], [0.4911, 0.6525], [0.4989, 0.6937]],
    [5.3333, [0.4814, 0.2815], [0.4828, 0.3201], [0.4835, 0.3587], [0.4847, 0.3974], [0.486, 0.436], [0.4875, 0.4746], [0.4886, 0.5133], [0.4898, 0.5519], [0.4878, 0.5905], [0.4871, 0.6291], [0.4978, 0.6678]],
    [5.4167, [0.4814, 0.2815], [0.4822, 0.3174], [0.4817, 0.3533], [0.4823, 0.3893], [0.4842, 0.4252], [0.4862, 0.4611], [0.4876, 0.497], [0.4888, 0.533], [0.488, 0.5689], [0.4879, 0.6048], [0.4962, 0.6407]],
    [5.5, [0.4814, 0.2815], [0.4815, 0.315], [0.479, 0.3485], [0.478, 0.382], [0.4805, 0.4156], [0.4832, 0.4491], [0.4854, 0.4826], [0.4869, 0.5161], [0.4888, 0.5496], [0.4915, 0.5831], [0.4941, 0.6167]],
    [5.5833, [0.4814, 0.2815], [0.4813, 0.3129], [0.4777, 0.3443], [0.4732, 0.3757], [0.4759, 0.4071], [0.4788, 0.4385], [0.4821, 0.4699], [0.4844, 0.5013], [0.4863, 0.5327], [0.488, 0.5641], [0.4914, 0.5956]],
    [5.6667, [0.4814, 0.2815], [0.481, 0.3112], [0.4784, 0.3409], [0.4694, 0.3706], [0.4716, 0.4003], [0.4735, 0.43], [0.4784, 0.4597], [0.4813, 0.4894], [0.4841, 0.5191], [0.4866, 0.5488], [0.4892, 0.5785]],
    [5.75, [0.4814, 0.2815], [0.4802, 0.31], [0.4797, 0.3384], [0.4671, 0.3669], [0.4676, 0.3954], [0.4686, 0.4239], [0.4742, 0.4524], [0.4783, 0.4809], [0.4818, 0.5093], [0.4852, 0.5378], [0.4879, 0.5663]],
    [5.8333, [0.4814, 0.2815], [0.4794, 0.3093], [0.4803, 0.3371], [0.4668, 0.3649], [0.4643, 0.3927], [0.4649, 0.4205], [0.4694, 0.4483], [0.4756, 0.4761], [0.4799, 0.5039], [0.4841, 0.5317], [0.4867, 0.5595]],
    [5.9167, [0.4814, 0.2815], [0.479, 0.309], [0.4799, 0.3365], [0.4686, 0.364], [0.462, 0.3916], [0.462, 0.4191], [0.4647, 0.4466], [0.4726, 0.4741], [0.4787, 0.5016], [0.4834, 0.5291], [0.4852, 0.5567]],
    [6.0, [0.4814, 0.2815], [0.4791, 0.309], [0.4793, 0.3365], [0.4714, 0.364], [0.4607, 0.3916], [0.4594, 0.4191], [0.4613, 0.4466], [0.469, 0.4741], [0.4774, 0.5016], [0.4828, 0.5291], [0.4839, 0.5567]],
    [6.0833, [0.4813, 0.2815], [0.4796, 0.3093], [0.4791, 0.337], [0.4732, 0.3648], [0.4604, 0.3926], [0.4583, 0.4204], [0.4598, 0.4481], [0.4663, 0.4759], [0.4758, 0.5037], [0.4822, 0.5315], [0.4829, 0.5593]],
    [6.1667, [0.4813, 0.2815], [0.4806, 0.3099], [0.4784, 0.3384], [0.4724, 0.3668], [0.4613, 0.3953], [0.4596, 0.4237], [0.4616, 0.4521], [0.4669, 0.4806], [0.4754, 0.509], [0.482, 0.5375], [0.4824, 0.5659]],
    [6.25, [0.4813, 0.2815], [0.4808, 0.3109], [0.4755, 0.3402], [0.4698, 0.3696], [0.4642, 0.399], [0.4638, 0.4283], [0.4662, 0.4577], [0.4704, 0.4871], [0.4771, 0.5164], [0.4814, 0.5458], [0.482, 0.5752]],
    [6.3333, [0.4814, 0.2815], [0.4805, 0.3119], [0.4756, 0.3423], [0.4723, 0.3727], [0.4712, 0.4031], [0.4712, 0.4335], [0.4726, 0.4639], [0.4748, 0.4943], [0.4784, 0.5247], [0.4805, 0.5551], [0.4815, 0.5856]],
    [6.4167, [0.4814, 0.2815], [0.4804, 0.3129], [0.478, 0.3442], [0.4773, 0.3756], [0.4772, 0.407], [0.4769, 0.4383], [0.4769, 0.4697], [0.4771, 0.5011], [0.4782, 0.5324], [0.478, 0.5638], [0.4808, 0.5952]],
    [6.5, [0.4815, 0.2815], [0.4817, 0.3137], [0.4811, 0.3459], [0.4806, 0.378], [0.48, 0.4102], [0.4794, 0.4424], [0.4787, 0.4746], [0.4783, 0.5068], [0.4775, 0.539], [0.477, 0.5711], [0.4799, 0.6033]],
    [7.0, [0.4817, 0.2815], [0.4825, 0.3132], [0.483, 0.345], [0.4836, 0.3767], [0.4841, 0.4084], [0.4848, 0.4402], [0.4855, 0.4719], [0.4862, 0.5037], [0.4868, 0.5354], [0.4868, 0.5671], [0.4898, 0.5989]],
    [7.5, [0.4817, 0.2815], [0.4832, 0.3113], [0.4845, 0.3412], [0.4859, 0.371], [0.4873, 0.4009], [0.4887, 0.4307], [0.49, 0.4606], [0.4914, 0.4904], [0.4926, 0.5203], [0.4939, 0.5501], [0.4972, 0.58]],
    [8.0, [0.4816, 0.2815], [0.4834, 0.3114], [0.4848, 0.3412], [0.4862, 0.3711], [0.4877, 0.401], [0.4891, 0.4309], [0.4905, 0.4607], [0.4918, 0.4906], [0.4931, 0.5205], [0.4944, 0.5504], [0.4977, 0.5802]]];
  // Round 5 (her note: "the tether should have the same length through every frame ... it's a cable, not stretchy"): take 2
  // stretches its line ~40 % on the way to the snap. The default now draws a simulated constant-length cable (tether.js) on
  // tether_drift_r5 (tools/tether_r5.py n1: take 2 with its line painted out and him moved along the hatch→him direction so
  // his distance is the cable's length L at the snap and at 20.30 s, and 0.42 L at the start, the rest of the cable slack).
  // ?n1=r4: round 4 (take 2 and its own line, the gold on TETHER2); ?n1=old: take 1.
  const N1_Q = new URLSearchParams(location.search).get('n1');
  const N1_OLD = N1_Q === 'old', N1_R4 = N1_Q === 'r4', N1_R5 = !N1_OLD && !N1_R4;
  const TETHER_R6 = Q.get('tether') !== 'r5', TETHER_STATS = Q.has('tetherstats');
  const TETHER = N1_OLD ? TETHER1 : TETHER2;
  let TD1 = null, ROPE1 = null;
  if (N1_R5) { try { TD1 = await loadJSON('data/tether_n1.json'); } catch (e) { console.warn('no data/tether_n1.json (tools/tether_r5.py n1)'); } }
  const tetherAt = tp => {   // the tether's points in plate uv at plate time tp
    let i = TETHER.findIndex(r => r[0] > tp); i = i < 0 ? TETHER.length - 1 : Math.max(1, i);
    const a = TETHER[i - 1], b = TETHER[i], f = clamp((tp - a[0]) / (b[0] - a[0]));
    return a.slice(1).map((p, j) => [lerp(p[0], b[j + 1][0], f), lerp(p[1], b[j + 1][1], f)]);
  };
  const catmull = (P, k = 6) => {   // a Catmull-Rom curve through the points P (ends repeated)
    const Q = [P[0], ...P, P[P.length - 1]], out = [];
    for (let i = 1; i < Q.length - 2; i++) for (let j = 0; j < k; j++) {
      const s = j / k, [p0, p1, p2, p3] = [Q[i - 1], Q[i], Q[i + 1], Q[i + 2]];
      out.push([0, 1].map(c => .5 * (2 * p1[c] + (p2[c] - p0[c]) * s + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * s * s + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * s * s * s)));
    }
    out.push(P[P.length - 1]); return out;
  };
  // the cable over the whole shot, simulated once (both ends pinned: the hatch, his waist on the plate frame the shot shows)
  // Round 6 (her note on 0:33, "the cosmonaut clips through the tether", checked here too): his body is a collision solid in
  // the simulation (tether.js, collide: a distance field per subject matte, blended between mattes so it sweeps the cable
  // instead of jumping through it) and every cable point keeps a side (in front of / behind him) that changes only outside
  // his silhouette; points behind are hidden by his matte. ?tether=r5: round 5 (no collision, depth from z alone).
  // ?tetherstats: console.warn the clipping count (cable points inside his silhouette that pass through him) per rope.
  const N1_EX = 6, N1_BODY = { T: 6, m: 1.5, taper: 6 };   // his half-depth, the cable's half-width (plate px)   // cable points next to his waist (the attachment, inside his silhouette) exempt from the collision
  const n1Rope = () => ROPE1 || (ROPE1 = (async () => {
    const t0 = L1[1].t0 - .05, t1 = L1[2].t0 - .05, wa = TD1.waist;
    const tpAt = t => { const tp = 5.0 + (t - N1W[7][0]); return tp >= 4.94 && tp < 5.03 ? 5.042 : tp; };   // as the plate is shown
    const waist = t => { const x = clamp(tpAt(t) * 24, 0, wa.length - 1), i = Math.min(wa.length - 2, Math.floor(x)), f = x - i; return [lerp(wa[i][0], wa[i + 1][0], f), lerp(wa[i][1], wa[i + 1][1], f), 0]; };
    const nP = PLATES[TD1.plate].n, need = new Set();
    for (let t = t0 - 1.3; t <= t1 + .05; t += 1 / 96) { const fp = clamp(tpAt(t) * 24 + 1, 1, nP), k = Math.floor((fp - 1) / 2) * 2 + 1; need.add(k); if (k + 2 <= nP) need.add(k + 2); }
    const SD = (TETHER_R6 || TETHER_STATS) ? await loadBodySDF(TD1.plate, [...need].sort((a, b) => a - b), f => wa[clamp(f - 1, 0, wa.length - 1)], { cell: 1, pad: 24 }) : null;
    const field = (t, blend = true) => bodyAtFrame(SD, clamp(tpAt(t) * 24 + 1, 1, nP), blend);
    const rope = simulateRope({ name: 'N1', t0, t1, L: TD1.L, n: 56, endA: () => [TD1.hatch[0], TD1.hatch[1], 0], endB: waist, seed: 11, turns: 1.1, damp: .3, bend: .06, rMin: 16, iters: 80, sub: 16, pre: 1.2, drift: 6,
      keepOut: (x, y, i) => { const yMin = TD1.hatch[1] + Math.min(18, 4.5 * i); return y < yMin ? [x, yMin] : null; },   // off the hull: the cable leaves the hatch downward (its bottom edge is the hatch's row)
      ...(TETHER_R6 ? { collide: { field, ...N1_BODY, h: .75, exemptB: N1_EX } } : {}) });
    if (TETHER_STATS) console.warn('tether N1 ' + (TETHER_R6 ? 'r6' : 'r5') + ' ' + JSON.stringify(ropeClipStats(rope, f => field(t0 + f / 24, false),
      TETHER_R6 ? (f, i, P, sd) => sd[i] > 0 : (f, i, P) => P[i * 3 + 2] >= -1 && i / rope.n > .5, N1_EX, N1_BODY)));
    return rope;
  })());
  shot('N1_tether', L1[1].t0 - .05, L1[2].t0 - .05, async (t, lt, dur) => {
    paper(G, 'night');
    const e = smooth(clamp(lt / dur)), z = lerp(1.03, 1.13, e);
    // take 2 at 1x from 0.25 s, so its snap (plate 5.0 s) lands on "trace" and the gold completes on the snap; take 1 (?n1=old)
    // 1.2 → 7.95 s with the trace done just after "trace"
    const k = N1_OLD ? easeInOut(clamp((t - N1W[4][0]) / (N1W[7][0] + .5 - N1W[4][0])))   // "by" → just after "trace"
                     : easeInOut(clamp((t - N1W[4][0]) / (N1W[7][0] - N1W[4][0])));     // "by" → "trace" = the snap
    const N1_SNAP = 5.0, tp2 = N1_SNAP + (drawClock(t, 12).tq - N1W[7][0]);   // on the 12 fps drawing clock (passed as hold)
    // the take's two motion-blurred in-between frames (4.96, 5.0 s) are skipped: the line snaps straight in one drawing
    const tpN1 = N1_OLD ? 1.2 + lt * 6.75 / dur : (tp2 >= 4.94 && tp2 < 5.03 ? 5.042 : tp2);
    const rope = N1_R5 && TD1 ? await n1Rope() : null;
    const d = drawClock(t, 12).n;
    // type: TIED / TO THE SHIP right-aligned in the sky right of the airlock ("SHIP" lands on "ship"); the serif line and the
    // caption right-aligned left of the tether, in the black between the ship and the limb
    const rx = W - 120, sw = measure(G, 'SHIP', FONT.impact(120)), gap = measure(G, ' ', FONT.impact(120));
    const cap = 'TETHER · 5.35 M', capF = FONT.mono(24, 700), lx = 850;
    await drawPlate(t, N1_OLD ? 'tether_drift' : rope ? TD1.plate : 'tether_drift_t2', tpN1, { ...(N1_OLD ? {} : { hold: tpN1 }), view: { zoom: z, cy: .5 / z + .003 },
      hatch: { spacing: 6.5, mask: quiet([[rx - 520, 150, rx + 30, 450], [lx - 610, 440, lx + 20, 570]], .75) },
      extra: (pen, F, view, dIdx) => {
        if (rope) {   // round 5: the simulated cable, then the gold trace along it (by arc length from the hatch)
          const P = rope.at(drawClock(t, 12).tq), toS = (x, y) => view.toScreen(x / TD1.w - .5 / F.aw, y / TD1.h - .5 / F.ah);
          // he covers the cable where it passes behind him (z ≥ 0 inside his matte): it meets him at his waist, from behind
          // round 6: where the simulation keeps it behind him (its side, which changes only outside his silhouette)
          const sd = rope.sideAt(drawClock(t, 12).tq);
          const hide = rope.collide ? (s, X, Y, zz, u) => { if (!F.M || !(sd[Math.floor(u)] > 0 || sd[Math.ceil(u)] > 0)) return false; const [px, py] = view.toPlate(X, Y); return samp(F, F.M, px, py) > .5; }
            : (s, X, Y, zz) => { if (!F.M || zz < -1) return false; const [px, py] = view.toPlate(X, Y); return samp(F, F.M, px, py) > .5 && s > .5; };
          const S = drawCable(pen, P, toS, { w: 3.2, light: [1, -.3], seed: dIdx * 31 + 7, hide });
          const seg = S.slice(1).map((q, i) => Math.hypot(q[0] - S[i][0], q[1] - S[i][1]));
          let left = k * seg.reduce((x, y) => x + y, 0); const path = [S[0]];
          for (let i = 0; i < seg.length && left > 0; i++) { const f = Math.min(1, left / seg[i]); path.push([lerp(S[i][0], S[i + 1][0], f), lerp(S[i][1], S[i + 1][1], f)]); left -= seg[i]; }
          if (path.length < 2) return;
          pen.poly(path, 'gold', 7, .28, .02); pen.poly(path, 'gold', 3.2, .95, .02);
          if (k < 1) { const [hx, hy] = path[path.length - 1]; pen.dot(hx, hy, 4, 'white', .95); }
          return;
        }
        // the trace, on the frame being drawn: the tracked tether (the curve through its points) revealed by arc length,
        // a soft wide pass under a firm gold line, the pencil's point at its head. The pencil puts analysis pixel i at uv i / aw,
        // half a pixel up-left of the plate content it samples, so the trace takes the same half pixel to sit on the drawn line.
        const pts = catmull(tetherAt((F.frame - 1) / 24).map(([u, v]) => view.toScreen(u - .5 / F.aw, v - .5 / F.ah)));
        const seg = pts.slice(1).map((q, i) => Math.hypot(q[0] - pts[i][0], q[1] - pts[i][1]));
        let left = k * seg.reduce((x, y) => x + y, 0); const path = [pts[0]];
        for (let i = 0; i < seg.length && left > 0; i++) { const f = Math.min(1, left / seg[i]); path.push([lerp(pts[i][0], pts[i + 1][0], f), lerp(pts[i][1], pts[i + 1][1], f)]); left -= seg[i]; }
        if (path.length < 2) return;
        pen.poly(path, 'gold', 7, .28, .02); pen.poly(path, 'gold', 3.2, .95, .02);
        if (k < 1) { const [hx, hy] = path[path.length - 1]; pen.dot(hx, hy, 4, 'white', .95); }
      } });
    lyricStack(t, [
      { s: 'TIED', t: N1W[0][0], x: rx, y: 300, size: 210, align: 'right', style: 'slam' },
      { s: 'TO THE', t: N1W[1][0], x: rx - sw - gap, y: 435, size: 120, align: 'right', style: 'rise' },
      { s: 'SHIP', t: N1W[3][0], x: rx, y: 435, size: 120, align: 'right', style: 'slam' },
      { s: 'by the slightest trace', t: N1W[4][0], x: lx, y: 505, font: FONT.serif(72), col: 'cream', align: 'right', style: 'rise' },
    ]);
    const Lt = typeLayer();
    tele(Lt.g, cap, lx - measure(G, cap, capF, 1.5), 553, t, N1W[7][0], { size: 24, weight: 700, col: 'gold', dur: .6 });
    typeFlush(Lt, d, .4);
  });

  // N2 · "Pull him back to the ship's embrace", in two shots. Nobody reels him in (docs/FACTCHECK.md P2-4): he hauls himself
  // back. N2a ("Pull him back"): hand_over_hand, him pulling himself along the tether hand over hand to the Volga's open mouth
  // until he grips the rim, outside. N2b ("to the ship's embrace"): the planned feet-first entry, and the ship won't take him
  // (airlock_fail take1: he swings his legs into the tube, the ballooned suit jams against the rim, he pushes back out, turns
  // and struggles; the camera ends close on his strained face). The swell (S3a/S3b) tries again, feet first and then head
  // first, and both jam; after he bleeds the suit (P1) the head-first entry works (P3): the memoir's version (2004), which
  // the film follows throughout (his 1965 report says legs first).
  const PULL_T = N2W[3][0] - .05;   // "to": the cut from the haul to the jam
  const n2Type = t => lyricStack(t, [
    { s: 'PULL', t: N2W[0][0], x: 110, y: 250, size: 190, style: 'slam' },
    { s: 'HIM BACK', t: N2W[2][0], x: 110, y: 420, size: 190, style: 'slam' },
    ...(t >= PULL_T ? [{ s: "to the ship's embrace", t: N2W[3][0], x: 116, y: 510, font: FONT.serif(64), col: 'cream', style: 'rise' }] : []),
  ]);
  // N2a: the take 2.8 → 6.9 s (he is mid-way along the line → his glove on the rim), fast at first (≈2x) and settling to ≈1x
  // as he reaches the rim, so the grip lands just before the cut.
  shot('N2a_haul', L1[2].t0 - .05, PULL_T, async (t, lt, dur) => {
    paper(G, 'night');
    const u = clamp(lt / dur), v0 = 2 * 4.1 / dur - 1, tp = 2.8 + dur * (v0 * u + (1 - v0) * u * u / 2);   // speed falls linearly to 1x at the grip
    await drawPlate(t, 'hand_over_hand', tp, { view: { zoom: lerp(1.34, 1.38, smooth(u)), cx: .375, cy: .5 },   // him right of the type, the ship's mouth at the right edge
      hatch: { spacing: 6.5, mask: quiet([[60, 60, 700, 460]], .72) } });
    n2Type(t);
  });
  // N2b: the take 1.4 → 4.3 s (legs in, the jam, back out) up to "embrace", whipping through the turn to his face in the visor
  // (6.2 s) on "embrace", then ≈0.9x on the strained face to the cut (7.95 s); a punch-in on the face, pushed right of the type.
  const N2K = [[0, 1.4], [N2W[6][0] - .6 - PULL_T, 4.3], [N2W[6][0] - .05 - PULL_T, 6.2], [L1[3].t0 - .05 - PULL_T, 7.95]];   // [shot time, plate time]
  const n2tp = lt => { let i = N2K.findIndex(k => k[0] > lt); i = i < 0 ? N2K.length - 1 : Math.max(1, i);
    const [a, b] = [N2K[i - 1], N2K[i]]; return lerp(a[1], b[1], clamp((lt - a[0]) / (b[0] - a[0]))); };
  shot('N2b_jam', PULL_T, L1[3].t0 - .05, async (t, lt, dur) => {
    paper(G, 'night');
    const e = smooth(clamp(lt / dur)), tp = n2tp(drawClock(t, 12).tq - PULL_T);   // the plate on the drawing clock
    const tight = t >= N2W[6][0] - .05, et = smooth(clamp((t - N2W[6][0]) / (L1[3].t0 - N2W[6][0])));   // "embrace" → the cut
    const view = tight ? { zoom: lerp(1.38, 1.48, et), cx: .5, cy: .42, ox: 330, oy: 20 } : { zoom: lerp(1.0, 1.08, e), cx: lerp(.5, .53, e), cy: lerp(.5, .47, e) };
    await drawPlate(t, 'airlock_fail', tp, { hold: tp, view, face: tp > 5.9,
      hatch: { mask: quiet([[60, 60, 860, 560]], tight ? .72 : .6) },
      extra: (pen) => edgePanic(pen, tight ? .6 + .3 * et : .25 + .3 * e, drawClock(t, 12).n * 5) });
    n2Type(t);
  });

  // I4 · Can't feel his hands
  shot('I4_hands', L1[3].t0 - .05, L1[3].words[4][0] - .05, async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'glove_cu', .3 + lt, { view: { zoom: 1.05, ox: 260 }, hatch: { spacing: 6.5 } });
    const w = L1[3].words;
    lyricStack(t, [
      { s: "CAN'T FEEL", t: w[0][0], x: 110, y: 470, size: 170, style: 'rise' },
      { s: 'HIS HANDS', t: w[2][0], x: 110, y: 640, size: 170, style: 'rise' },
    ]);
  });

  // I5 · can't feel his face
  shot('I5_face', L1[3].words[4][0] - .05, O(20.5), async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'visor_cu', .5 + lt, { view: { zoom: 1.1, ox: -300, oy: 40 }, hatch: { spacing: 6.5 } });
    const w = L1[3].words;
    lyricStack(t, [
      { s: "CAN'T FEEL", t: w[4][0], x: W - 110, y: 470, size: 170, align: 'right', style: 'rise' },
      { s: 'HIS FACE', t: w[6][0], x: W - 110, y: 640, size: 170, align: 'right', style: 'rise' },
    ]);
  });
  // I6 + H1a · orbital night → THE SUNRISE (countdown_drift, then hero_sunrise continuous across the cut)
  // I6 + H1a · orbital night → THE SUNRISE (one continuous take of hero_sunrise)
  const SUN_AT = 2.0;                       // plate time where the sun breaks (refined from meta at boot)
  const sunBreak = (() => { const m = META.hero_sunrise; if (!m) return SUN_AT; const i = m.findIndex(f => f.sun[2] > .55 && f.hot > .0005); return i > 0 ? i / 24 : SUN_AT; })();
  const tpHero = t => sunBreak + (t - H1[0].t0);   // align the plate's sunrise with "Orbital"
  // I6 · the countdown in orbital night. countdown_drift (generated from hero_sunrise's first frame: the same framing, him and
  // the coiled tether drifting gently, no sunrise) plays backwards, slowing, into its first frame, which IS hero_sunrise's
  // first frame; hero_sunrise then takes over and eases up to 1x so that it reaches the sunrise on "Orbital" exactly as H1a
  // plays it (tpHero). The frame pans to H1a's framing (ox 180) over the hero part, so the cut to H1a has no jump.
  // Round 4 (her note: the tether should float and sway, not hang rigid): countdown_drift take 3 (countdown_drift_t3) starts
  // AND ends on hero_sunrise's first frame with the hose swaying and turning in between, so it plays forwards, its last 2.2 s
  // at ≈1.7x easing to rest on that frame. ?i6=old: take 1 played backwards into its first frame (the hose barely moved).
  // Round 5 (her note: "the tether is not a rigid object ... it should float around the cosmonaut like an umbilical cord"):
  // the generated hose (a stiff hoop with a free end) is painted out of both plates (tools/tether_r5.py i6:
  // countdown_drift_r5, hero_sunrise_r5) and a simulated cable (tether.js) runs from the hull, where the struts meet it, to his
  // right hip: one constant length (≈2.5x the distance), stiff like Gemini 4's umbilical (her reference: big smooth loops,
  // no kinks), no gravity, floating slowly in loops in front of and behind him. ?i6=r4: round 4 (take 3 and its hoop).
  const I6_Q = new URLSearchParams(location.search).get('i6');
  const I6_OLD = I6_Q === 'old', I6_R5 = !I6_OLD && I6_Q !== 'r4';
  let TD6 = null, ROPE6 = null;
  if (I6_R5) { try { TD6 = await loadJSON('data/tether_i6.json'); } catch (e) { console.warn('no data/tether_i6.json (tools/tether_r5.py i6)'); } }
  const R5ID = { countdown_drift_t3: 'countdown_drift_r5', hero_sunrise: 'hero_sunrise_r5' };
  const I6_HERO = 1.4;                                        // seconds of hero_sunrise before the cut to H1a
  const i6Map = t => {                                        // → [plate, plate time]
    const s0 = O(20.5), tm = hk0 - I6_HERO;
    if (t < tm) { const u = clamp((t - s0) / (tm - s0));
      return I6_OLD ? ['countdown_drift', (tm - s0) * .6 * (1 - u) * (1 - u)] : ['countdown_drift_t3', 5.0 - 2.2 * Math.pow(1 - u, 1.3)]; }
    const D = I6_HERO, Hh = tpHero(hk0), c = (1 - 2 * Hh / D) / (D * D), a = (Hh - c * D * D * D) / (D * D), x = clamp(t - tm, 0, D);
    return ['hero_sunrise', a * x * x + c * x * x * x];      // h(0) = 0, h'(0) = 0, h(D) = tpHero(hk0), h'(D) = 1
  };
  // the rope continues through H1a (same simulation, hero_sunrise_r5), and I1's poster (hero_sunrise at 4.4 s = inside H1a)
  // draws the state at that moment, so the hoop never comes back and the cable is the same one
  const H1A_END = H1[0].words[2][0] - .05;
  const i6Cable = (rope, tq, reveal = 1) => (pen, F, view, dIdx) => {
    let P = rope.at(tq); if (reveal < 1) P = P.slice(0, 3 * Math.max(2, Math.round(reveal * P.length / 3)));
    const z = i6Track(tq, 'zoom'); P = P.map((c, i) => i % 3 === 2 ? c * z : ZC[i % 3] + (c - ZC[i % 3]) * z);
    const toS = (x, y) => view.toScreen(x / TD6.w - .5 / F.aw, y / TD6.h - .5 / F.ah);
    // behind him (z > 0) the cable is hidden by his matte; in front it crosses over him
    const sd = rope.sideAt(tq);   // round 6: behind him = its side in the simulation (changes only outside his silhouette)
    const hide = rope.collide ? (s, X, Y, zz, u) => { if (!F.M || !(sd[Math.floor(u)] > 0 || sd[Math.ceil(u)] > 0)) return false; const [px, py] = view.toPlate(X, Y); return samp(F, F.M, px, py) > .5; }
      : (s, X, Y, zz) => { if (!F.M || zz <= 0) return false; const [px, py] = view.toPlate(X, Y); return samp(F, F.M, px, py) > .5; };
    drawCable(pen, P, toS, { w: 17 * z * (view.scale / 3.12), light: [1, .35], seed: dIdx * 29 + 3, hide, rings: 9, persp: 900, cols: { body: 'white', shade: 'cobalt', hi: 'white' } });
  };
  const i6Track = (t, key) => {   // his hip / the hull anchor (plate px) on the r5 plate shown at song time t
    const [id0, tp] = t < hk0 ? i6Map(t) : ['hero_sunrise', tpHero(t)], a = TD6[R5ID[id0]][key], x = clamp(tp * 24, 0, a.length - 1), i = Math.min(a.length - 2, Math.floor(x)), f = x - i;
    return typeof a[0] === 'number' ? lerp(a[i], a[i + 1], f) : [lerp(a[i][0], a[i + 1][0], f), lerp(a[i][1], a[i + 1][1], f)];
  };
  // the plate camera pushes in on him through hero_sunrise (zoom = his size vs. countdown frame 81): the cable lives in fixed
  // world units (plate px at zoom 1, about the frame centre) and is magnified with the plate
  const ZC = [480, 270], toWorld = (p, t) => { const z = i6Track(t, 'zoom'); return [ZC[0] + (p[0] - ZC[0]) / z, ZC[1] + (p[1] - ZC[1]) / z]; };
  // the cable starts out (song time O(20.5)) wound loosely around him, after Gemini 4's photo: from the hull down past his
  // right side, up over his head behind him, round his left shoulder and in front of his chest to the hip. Its length is
  // that route's: ≈5.4 m at his scale (he is ≈1.7 m ≈ 360 plate px; Leonov's tether was 5.35 m).
  // Round 6 (her note: "the tether starts out looking right, but then the cosmonaut clips through the tether"): his body is a
  // collision solid (tether.js collide: a distance field per subject matte of the plate shown, blended between mattes so his
  // drift and the push-in sweep the cable along rather than tunnelling through it; a slab ±T deep in z, thinning to his
  // edge), and every cable point keeps its side (in front / behind) and may change it only outside his silhouette, so a
  // loop gets round him only past his edge; behind points are hidden by his matte. The three points at the hip (on his
  // edge) are exempt. ?tether=r5: round 5 (no collision, hidden where z > 0).
  const I6_EX = 3, I6_BODY = { T: 35, m: 5, taper: 30 };   // world units (plate px at countdown frame 81's scale)
  const i6Plate = t => { const [id0, tp] = t < hk0 ? i6Map(t) : ['hero_sunrise', tpHero(t)]; return [R5ID[id0], tp]; };
  const i6Rope = () => ROPE6 || (ROPE6 = (async () => {
    const t0 = O(20.5), t1 = H1A_END, need = {};
    for (let t = t0; t <= t1 + .05; t += 1 / 96) {
      const [id, tp] = i6Plate(t), nP = PLATES[id].n, fp = clamp(tp * 24 + 1, 1, nP), k = Math.floor((fp - 1) / 2) * 2 + 1;
      (need[id] ||= new Set()).add(k); if (k + 2 <= nP) need[id].add(k + 2);
    }
    const SD = {};
    if (TETHER_R6 || TETHER_STATS) for (const id in need) SD[id] = await loadBodySDF(id, [...need[id]].sort((a, b) => a - b), f => TD6[id].hip[clamp(f - 1, 0, TD6[id].hip.length - 1)], { cell: 3, pad: 60 });
    const field = (t, blend = true) => {   // in world units (the cable's): plate px about ZC divided by the push-in zoom
      const [id, tp] = i6Plate(t), z = i6Track(t, 'zoom'), b = bodyAtFrame(SD[id], clamp(tp * 24 + 1, 1, PLATES[id].n), blend);
      return (x, y) => b(ZC[0] + (x - ZC[0]) * z, ZC[1] + (y - ZC[1]) * z) / z;
    };
    const rope = simulateRope({ name: 'I6', t0, t1, n: 120, seed: +(Q.get('i6seed') || 5),
      endA: t => [...toWorld(i6Track(t, 'anchor'), t), 70], endB: t => [...toWorld(i6Track(t, 'hip'), t), 0],
      via: (A, H) => [[690, 370, 60], [630, 440, 30], [565, 340, 70], [600, 200, 40], [525, 95, 90], [420, 45, 60], [330, 115, 30], [225, 165, -20], [255, 265, -50], [345, 225, -70], [430, 335, -50]]
        .map(([x, y, z]) => [x + H[0] - 503, y + H[1] - 300, z]),
      damp: .15, bend: .015, rMin: 70, iters: 60, sub: 12, pre: .8, drift: 24,
      ...(TETHER_R6 ? { collide: { field, ...I6_BODY, h: 2, exemptB: I6_EX } } : {}) });
    if (TETHER_STATS) console.warn('tether I6 ' + (TETHER_R6 ? 'r6' : 'r5') + ' ' + JSON.stringify(ropeClipStats(rope, f => field(t0 + f / 24, false),
      TETHER_R6 ? (f, i, P, sd) => sd[i] > 0 : (f, i, P) => P[i * 3 + 2] > 0, I6_EX, I6_BODY)));
    return rope;
  })());
  shot('I6_predawn', O(20.5), hk0, async (t, lt) => {
    paper(G, 'night');
    const tq = drawClock(t, 8).tq, [id0, tp] = i6Map(tq), pan = smooth(clamp((tq - (hk0 - I6_HERO)) / I6_HERO));
    const rope = I6_R5 && TD6 ? await i6Rope() : null, id = rope ? R5ID[id0] : id0;
    await drawPlate(t, id, tp, { hold: tp, rate: 8, view: { zoom: 1.04, ox: 180 * pan }, hatch: { spacing: 7 },
      ...(rope ? { extra: i6Cable(rope, tq) } : {}) });
    const Lt = typeLayer();
    const cd = [[B(Bn(60)), '3'], [B(Bn(61)), '2'], [B(Bn(62)), '1']];
    // bottom left, clear of his boots (he hangs centre frame, drifting right as the frame pans)
    tele(Lt.g, 'ORBITAL SUNRISE IN', 110, H - 150, t, O(20.7), { size: 26, weight: 700, col: 'silver', dur: .6 });
    for (const [bt, s] of cd) if (t >= bt) { const k = clamp((t - bt) / .1); text(Lt.g, s, 550 + (+s === 3 ? 0 : +s === 2 ? 50 : 100), H - 150, { font: FONT.mono(40, 800), col: 'gold', alpha: k }); }
    typeFlush(Lt, drawClock(t, 12).n, .4);
  });

  shot('H1a_sunrise', hk0, H1[0].words[2][0] - .05, async (t, lt) => {
    paper(G, 'night');
    const z = punch(t, .018), rope = I6_R5 && TD6 ? await i6Rope() : null;   // round 5: the I6 cable continues (?i6=r4: the hoop)
    await withZoom(z, () => drawPlate(t, rope ? 'hero_sunrise_r5' : 'hero_sunrise', tpHero(t), {
      view: { zoom: 1.04, ox: 180 }, hatch: { spacing: 6.5 }, ...(rope ? { extra: i6Cable(rope, drawClock(t, 12).tq) } : {}),
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
  // Round 7 (her note on 0:41.4: "have him close to the ship, facing the sunrise, cord floating around him consistent with the
  // other umbilical-cord-like shot"): ship_wide_close (ship_wide_sunrise's framing, him a couple of metres from the airlock's
  // mouth facing the sun on the right, generated with no tether) and the I6 / H1a cable: the same constant-length rope
  // simulation (tether.js) from the airlock's mouth to his hip, ≈5.35 m at his scale, floating in big loops, his body a
  // collision solid from his matte (front / behind sides, hidden by his matte when behind), drawn the same way.
  // Tracks: video/data/tether_h1c.json (tools/tether_r5.py h1c). ?h1c=old: ship_wide_sunrise as before (its straight line).
  const H1C_OLD = Q.get('h1c') === 'old', H1C_T0 = H1[1].t0 - .05, H1C_T1 = H1[1].words[2][0] - .05, H1C_TP0 = .3;
  let TDC = null, ROPEC = null;
  if (!H1C_OLD) { try { TDC = await loadJSON('data/tether_h1c.json'); } catch (e) { console.warn('no data/tether_h1c.json (tools/tether_r5.py h1c)'); } }
  const tpC = t => H1C_TP0 + (t - H1C_T0);
  const trackC = (t, key) => { const a = TDC[key], x = clamp(tpC(t) * 24, 0, a.length - 1), i = Math.min(a.length - 2, Math.floor(x)), f = x - i; return [lerp(a[i][0], a[i + 1][0], f), lerp(a[i][1], a[i + 1][1], f)]; };
  // his size sets the scale: I6's parameters (he ≈ 360 px there) times s; the cable is 5.35 m with him ≈ 1.9 m in the suit
  const h1cRope = () => ROPEC || (ROPEC = (async () => {
    const t0 = H1C_T0, t1 = H1C_T1, nP = PLATES[TDC.plate].n, hh = TDC.height, s = hh / 360, need = new Set();
    for (let t = t0; t <= t1 + .05; t += 1 / 96) { const fp = clamp(tpC(t) * 24 + 1, 1, nP), k = Math.floor((fp - 1) / 2) * 2 + 1; need.add(k); if (k + 2 <= nP) need.add(k + 2); }
    const SD = (TETHER_R6 || TETHER_STATS) ? await loadBodySDF(TDC.plate, [...need].sort((a, b) => a - b), f => TDC.hip[clamp(f - 1, 0, TDC.hip.length - 1)], { cell: 1, pad: 30 }) : null;
    const field = (t, blend = true) => bodyAtFrame(SD, clamp(tpC(t) * 24 + 1, 1, nP), blend);
    const body = { T: 35 * s, m: Math.max(1.5, 5 * s), taper: 30 * s };
    // the start route (x, y in his heights from the hip, z in plate px · s): out of the airlock's mouth, down past his
    // back, a big loop under his boots in front of him, up in front of his legs toward the sun and back behind him to the
    // hip (≈330 px ≈ 5.4 m: he is ≈1.9 m in the suit ≈ 1.15 x his matte's height, as he floats tilted)
    const rope = simulateRope({ name: 'H1c', t0, t1, n: 72, seed: +(Q.get('h1cseed') || 3),
      endA: t => [...trackC(t, 'anchor'), 0], endB: t => [...trackC(t, 'hip'), 0],
      via: (A, Hp) => H1C_VIA.map(([x, y, z]) => [Hp[0] + x * hh, Hp[1] + y * hh, z * s]),
      damp: .15, bend: .015, rMin: 70 * s, iters: 60, sub: 12, pre: .8, drift: 24 * s,
      ...(TETHER_R6 ? { collide: { field, ...body, h: .75, exemptB: 3 } } : {}) });
    console.warn(`H1c cable ${(rope.L / (1.15 * hh) * 1.9).toFixed(2)} m (${rope.L.toFixed(0)} px, he ${hh} px)`);
    if (TETHER_STATS) console.warn('tether H1c ' + JSON.stringify(ropeClipStats(rope, f => field(t0 + f / 24, false), (f, i, P, sd) => sd[i] > 0, 3, body)));
    return rope;
  })());
  const H1C_VIA = [[-.55, -.35, -10], [-.45, .25, -25], [0, .62, -35], [.5, .55, -30], [.62, .1, -10], [.38, -.15, 25], [.14, -.08, 35]].map(([x, y, z]) => [x * .85, y * .85, z]);
  shot('H1c_wide', H1C_T0, H1C_T1, async (t, lt) => {
    paper(G, 'night');
    const rope = !H1C_OLD && TDC ? await h1cRope() : null;
    if (!rope) await drawPlate(t, 'ship_wide_sunrise', 1 + lt, { view: { zoom: 1.02 }, hatch: { spacing: 6.5 } });
    else {
      const tq = drawClock(t, 12).tq;
      await drawPlate(t, TDC.plate, tpC(t), { view: { zoom: 1.02 }, hatch: { spacing: 6.5 }, extra: (pen, F, view, dIdx) => {
        const P = rope.at(tq), sd = rope.sideAt(tq), toS = (x, y) => view.toScreen(x / TDC.w - .5 / F.aw, y / TDC.h - .5 / F.ah);
        const hide = rope.collide ? (s, X, Y, zz, u) => { if (!F.M || !(sd[Math.floor(u)] > 0 || sd[Math.ceil(u)] > 0)) return false; const [px, py] = view.toPlate(X, Y); return samp(F, F.M, px, py) > .5; }
          : (s, X, Y, zz) => { if (!F.M || zz <= 0) return false; const [px, py] = view.toPlate(X, Y); return samp(F, F.M, px, py) > .5; };
        drawCable(pen, P, toS, { w: 7 * (view.scale / 3.06),   // I6's look, a little thicker than his scale so it reads in the wide
          light: [1, .35], seed: dIdx * 29 + 3, hide, rings: 6, persp: 900 * TDC.height / 360, cols: { body: 'white', shade: 'cobalt', hi: 'white' } });
      } });
    }
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
    // Default (round 4, her note): jade_loc_day = the same take relit frame by frame for broad daylight (natural skin colour,
    // no glasses-shadow, the Hill Country loose toward the edges; tools/jade_relight.py), so lips and lag are unchanged; the
    // pencil thins out toward the frame edges too. ?h1d=loc: the golden-hour take as released.
    // Review variants: ?h1d=over (1B: the plain-paper take), ?h1d=plain, ?h1d=js (engine only; loses her face), ?h1d=locfade
    const exp = new URLSearchParams(location.search).get('h1d') ?? 'day';
    // ?h1d=locfade: everything but her face and hair faded toward the paper (tools/jade_fade.py --head); she found it goofy
    const loc = exp === 'day' || exp === 'loc' || exp === 'locfade', id = loc ? ({ day: 'jade_loc_day', loc: 'jade_loc' }[exp] ?? 'jade_locfade') : 'jade_sing3';
    // looser at the edges: the engine's strokes fade out over the outer fifth of the frame (not on her: she is centred)
    const edgeLoose = exp === 'day' ? (X, Y) => { const dx = Math.max(0, Math.abs(X - W / 2) / (W / 2) - .62) / .38, dy = Math.max(0, Y / H - .78) / .22;
      return 1 - .85 * smooth(clamp(Math.hypot(dx, dy))); } : undefined;
    // and lighter on her face, so the engine does not re-trace the old glasses-shadow's edge from the take's line work
    const faceQuiet = exp === 'day' ? (X, Y) => 1 - .7 * smooth(clamp((1.15 - Math.hypot((X - 900) / 190, (Y - 430) / 235)) / .3)) : undefined;
    // round 5 (her note: "the JS drawing renders the glasses shadow darkly again"): the engine's contours trace every edge
    // in the take, so the faint band left in the plate came back as dark outlines (and its rims doubled up): on her face the
    // contours are quieter still and over a wider oval than the hatching, so her glasses' rims stay light pencil lines
    const faceQuietC = exp === 'day' ? (X, Y) => 1 - .88 * smooth(clamp((1.25 - Math.hypot((X - 900) / 190, (Y - 430) / 235)) / .3)) : undefined;
    const lag = +(new URLSearchParams(location.search).get('h1dlag') ?? -.22);  // her pick by ear ("G"); ?h1dlag= tries others
    const tp = loc ? OI(t) - (30.9 + lag) : OI(t) - 32.05;   // take time runs on the released song's clock
    if (exp !== 'js') await paperTake(id, tp);
    if (exp !== 'plain') {
      G.save(); if (exp !== 'js') G.globalAlpha = .45;
      await drawPlate(t, loc ? id : 'jade_sing3_169', tp, { paper: 'snow', matte: false, face: false, view: { zoom: 1 }, hatch: { spacing: 6.2, mask: edgeLoose && ((X, Y) => edgeLoose(X, Y) * faceQuiet(X, Y)) }, ...(faceQuietC ? { contour: { mask: faceQuietC } } : {}) });
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
  shot('S1_reach', sw0, B(Bn(100)), async (t, lt) => {
    paper(G, 'night');
    await drawPlate(t, 'camera_reach', .4 + lt, { view: { zoom: 1.04 } });
    evaHud(t);
    const Lt = typeLayer();
    tele(Lt.g, "HE CAN'T REACH THE CAMERA SWITCH ON HIS LEG.", 110, H - 120, t, sw0 + .4, { size: 26, weight: 700, col: 'white', dur: 1.1 });
    tele(Lt.g, 'THE SUIT WILL NOT BEND.', 110, H - 78, t, sw0 + 1.8, { size: 26, weight: 700, col: 'verm', dur: .6 });
    typeFlush(Lt, drawClock(t, 12).n, .35);
  });
  shot('S2_balloon', B(Bn(100)), B(Bn(108)), async (t, lt, dur) => {
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
    text(Lt.g, 'SUIT SWELLS —', cx, y - 26, { font: FONT.mono(34, 800), col: 'gold', align: 'center' });   // no number: no source measures it
    text(Lt.g, 'HIS FINGERS NO LONGER REACH THE GLOVES', cx, y + 64, { font: FONT.mono(26, 800), col: 'gold', align: 'center' });   // his account
    tele(Lt.g, 'IN VACUUM, THE SUIT BALLOONS', 110, 180, t, B(Bn(100)) + .2, { size: 26, weight: 700, col: 'white', dur: .8 });
    typeFlush(Lt, d, .35);
  });
  // S3 · HE CAN'T GET BACK IN, twice. S3a: feet first again (airlock_struggle take1, top-down at the Volga's mouth: he faces
  // out of the rim with his backpack and legs in the tube), wedged, wriggling, and working back out toward us (the take 2.5 →
  // 7.8 s: he grows in frame as he pushes out). S3b: he tries head first (headfirst, the take P3 later plays through when he
  // gets in): only its first second, run in and back out on the beat (he shoves, jams at the shoulders, backs off, shoves
  // again), so here he still doesn't get through. Then P1: he has to let the air out of the suit.
  const S3_CUT = B(Bn(114));
  shot('S3a_feet', B(Bn(108)), S3_CUT, async (t, lt, dur) => {
    paper(G, 'night');
    const k = clamp(lt / 4);
    // face:false: the plate's face hits are on the CCCP helmet
    await drawPlate(t, 'airlock_struggle', 2.5 + lt * 5.3 / dur, { view: { zoom: 1.03 }, face: false, hatch: { mask: quiet([[W / 2 - 330, H - 170, W / 2 + 330, H - 55]], .75) },
      extra: (pen) => edgePanic(pen, .1 + k * .35, drawClock(t, 12).n * 3) });
    evaHud(t);
    const Lt = typeLayer();
    tele(Lt.g, "HE CAN'T GET BACK IN.", W / 2 - 230, H - 100, t, B(Bn(109)), { size: 40, weight: 800, col: 'white', dur: .7 });
    typeFlush(Lt, drawClock(t, 12).n, .35);
  });
  const JAM = (c, i) => hash2(c, 71 + i);                                       // per-shove variation (deterministic)
  shot('S3b_head', S3_CUT, O(44.4), async (t, lt, dur) => {
    paper(G, 'night');
    const e = smooth(clamp(lt / dur)), b0 = beatPos(S3_CUT), bp = (beatPos(t) - b0) / 2, c = Math.floor(bp), p = bp - c;
    const lo = i => .06 + .12 * JAM(i, 1), hi = i => .62 + .3 * JAM(i, 2);    // plate seconds: wedged at the rim → a little deeper
    const tp = p < .42 ? lerp(lo(c), hi(c), easeOut(p / .42)) : lerp(hi(c), lo(c + 1), easeInOut((p - .42) / .58));
    const clear = quiet([[W / 2 - 360, H - 190, W / 2 + 360, H - 40]], .95);   // his legs cross the caption: a deeper clearing
    await drawPlate(t, 'headfirst', tp, { hold: tp, view: { zoom: lerp(1.0, 1.1, e), cx: lerp(.5, .47, e), cy: lerp(.5, .46, e) },
      hatch: { mask: clear }, contour: { mask: (X, Y) => clear(X, Y) > .5 ? 1 : 0 },
      extra: (pen) => edgePanic(pen, .35 + .3 * e, drawClock(t, 12).n * 5) });
    evaHud(t);
    const Lt = typeLayer();
    tele(Lt.g, "HE CAN'T GET BACK IN.", W / 2 - 230, H - 100, t, B(Bn(109)), { size: 40, weight: 800, col: 'white', dur: .7 });
    typeFlush(Lt, drawClock(t, 12).n, .35);
  });

  // ---------------- pre-chorus · 44.40 → 59.50 ----------------
  const PR = linesIn('pre');
  shot('P1_bleed', O(44.4), PR[1].t0 - .05, async (t, lt) => {
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
  shot('P4_airlock', PR[3].t0 - .05, O(59.5), async (t, lt, dur) => {
    paper(G, 'night');
    const k = clamp(lt / dur), roll = clamp((t - O(57.2)) / (O(59.5) - O(57.2)));
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
    // Owner: the reach is a bit stiff, so only its start is seen; and even at rest people move, so nothing is frozen. The
    // cutaway (airlock_cut take3: he breathes hard, shifts and fidgets his legs from frame 0; ?p4legs=0: take2, no legs) plays at 1x from the shot's start, and cuts on the
    // beat at 56.18 s (beat 151, "the" → "airlock"), take ~1.6 s, as the glove has lifted off his chest and begun up the wall.
    // Then a moment of the inside view (airlock_side take1: breathing, visor fogging, glove pressing and sliding on the wall),
    // 56.18 → 57.2 at 1x from 0.3 s (as lively as any second of it, and the glove is still whole on the wall), with a slow push and drift, before the roll's flurry.
    // ?p4arm=0: both are the stills.
    const armT = new URLSearchParams(location.search).get('p4arm') !== '0', pushDur = O(57.2) - (PR[3].t0 - .05), CUT_SIDE = beatTime(Bn(151));
    if (!old) {
      const e = smooth(clamp(lt / pushDur));
      id = armT ? (new URLSearchParams(location.search).get('p4legs') === '0' ? 'airlock_cut_t2' : 'airlock_cut') : 'airlock_cut_still'; tp = armT ? lt : 0;
      vz = { zoom: lerp(1.02, 3.0, e), cx: lerp(.5, .212, e), cy: lerp(.44, .4035, e), rot: e * .3 };
      if (t >= CUT_SIDE) {   // his helmet low left under the lyric, the glove on the wall clear of it on the right
        const s = smooth(clamp((t - CUT_SIDE) / (O(57.2) - CUT_SIDE)));
        id = armT ? 'airlock_side' : 'airlock_side_still'; tp = armT ? .3 + (t - CUT_SIDE) : 0;
        vz = { zoom: lerp(1.14, 1.23, s), rot: lerp(.33, .37, s), ox: lerp(135, 110, s), oy: 60 };
      }
    }
    if (roll > 0) {
      // the inside view was just held, so the new take's flurry is the close-ups only
      const step = roll < .5 ? 2 : 4, n = Math.floor(beatPos(t) * step);
      const alts = [...(old ? [['tube_struggle', 7.2]] : []), ['valve_bleed', 3.5], ['visor_cu', 4.5], ['glove_cu', 3], ['suit_balloon', 4]];
      const a = alts[n % alts.length]; id = a[0]; tp = a[1] + frac(beatPos(t) * step) * .3; vz = { zoom: 1.1 + roll * .25 };
    }
    // the stills' faces (hand-boxed in their meta) get the face pass, drawn from hatching and edges (no landmarks)
    const still = id.startsWith('airlock_cut') || id.startsWith('airlock_side');
    await drawPlate(t, id, tp, { rate, view: vz, face: id === 'tube_struggle' ? tp > 5.2 : still || undefined, ...(still ? { faceLines: false, faceHatch: { white: .66, contrast: 1.3 }, faceContour: { hi: .25, lo: .1 } } : {}), ...(id.startsWith('airlock_cut') ? { aw: 960, ah: 540 } : {}),
      hatch: { mask: quiet([[W / 2 - 720, 150, W / 2 + 720, 450]], (id === 'airlock_cut' || id === 'airlock_side' ? .45 : .75) * (1 - roll)) },   // his arm and glove pass under the words: a lighter clearing
      extra: (pen) => edgePanic(pen, .5 + roll * .5, drawClock(t, rate).n * 11) });
    evaHud(t);
    const w = PR[3].words; // Eternity inside the airlock door (sung "Ninety minutes..." until she re-records it)
    lyricStack(t, [
      { s: 'ETERNITY', t: w[0][0], x: W / 2, y: 300, size: 170, align: 'center', style: 'slam' },
      { s: 'INSIDE THE AIRLOCK DOOR', t: w[1][0], x: W / 2, y: 420, size: 96, align: 'center', style: 'rise', ls: 3 },
    ], { alpha: 1 - roll * .6 });
    // the hatch slams: black on the last beat of the roll
    if (t > O(59.5) - TM.beat * .5) { G.fillStyle = P.night; G.globalAlpha = .92; G.fillRect(0, 0, W, H); G.globalAlpha = 1; }
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
      // her Rare Earth nod: on the open tower platform above the clouds at night, arms spreading as she sings. Take M: F's motion
      // (F given to the animator as a reference video) in the baggy dark cargo pants Kenton liked; lips by ear, her "B":
      // song time = 67.4 + 0.3 + take time. ?k4=F: take F (lag 0.5); ?k4=studio: the vocal-booth take (lag 0.7).
      const k4 = new URLSearchParams(location.search).get('k4'), studio = k4 === 'studio';
      const id = studio ? 'jade_studio_loc' : k4 === 'F' ? 'jade_rare_her' : 'jade_rare_her_m';
      const tp = OI(t) - (67.4 + +(new URLSearchParams(location.search).get('k4lag') ?? (studio ? .7 : k4 === 'F' ? .5 : .3)));
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
