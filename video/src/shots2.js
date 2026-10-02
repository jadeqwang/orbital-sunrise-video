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
const tpSing = (id, t) => OI(t) - SEG[id] + (REMOUTH[id] ? 0 : lagOf(id));
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

// ---- Leonov's "Sunrise" (1965), redrawn stroke by stroke (round 4) ----
// The film's own drawing, not the photo: tools/fit_leonov_drawing.py fits the museum photo (local only) to parameters in
// data/leonov_drawing.json (the card's tone and shape, each pencil's full-pressure colour, its pressure on a 5-unit grid,
// the stroke direction field, the sun disc). Here that becomes a few thousand generated pencil strokes, each pencil
// laid on a supersampled card layer and pressed into the card's tooth: light pressure catches only the grain's peaks,
// heavy pressure fills the valleys (the waxy look). The card is 1000 units wide.
//   (default)        this redraw (also ?drawing=crayon / redraw): the public cut while permission to show the original is
//                    pending with the museum and his family
//   ?drawing=blank   no likeness of his drawing at all: his blank card (pubCabin / pubPage below; also ?drawing=public)
//   ?drawing=v1      the round-3 version (leonovDrawing, needs the plate; also not for public use)
//   ?drawing=photo   the museum photo of the real drawing, for a licensed cut: needs media/refs/leonov_drawing_real_photo.jpg
//                    (served by render.mjs as refs/...); without it, it falls back to the redraw. It carries the credit line.
const LD_MODE = (m => ['blank', 'public'].includes(m) ? 'public' : ['v1', 'photo'].includes(m) ? m : 'redraw')(new URLSearchParams(location.search).get('drawing'));
const LD_SS = +(new URLSearchParams(location.search).get('ldss') || 2);       // card layer supersampling
const LD_GAIN = 1.39;                                                         // the photo is dim: card × 1.39
const LD_CONTRAST = { black: 1.35, black_over: 1.35, blue: 1.2, deep_blue: 1.12, light_blue: 1, yellow: 1.1, orange_red: 1.4 };   // and flat: T^γ per pencil
const LD_CREDIT = 'A. Leonov, «Sunrise» (Восход), 1965 · Museum of the Yuri Gagarin Cosmonaut Training Centre, Star City';
// per pencil: stroke length and width (card units), strokes per unit of pressure, how far a stroke leans off the field
const LD_STYLE = {
  black: { len: [40, 110], w: [1.8, 3.2], k: 4.2, dev: .05 },
  light_blue: { len: [30, 90], w: [1.6, 2.8], k: 7, dev: .06, ap: .36, th: .45 },   // the sunrise bands: dense, the card barely shows
  yellow: { len: [36, 100], w: [1.6, 2.8], k: 9, dev: .04, ap: .55, th: .4 },
  orange_red: { len: [30, 90], w: [1.5, 2.6], k: 8.5, dev: .04, ap: .55, th: .42 },
  blue: { len: [36, 120], w: [1.6, 3], k: 6.5, dev: .08, ap: .5, th: .85 },          // the Earth: cobalt and deep blue laid over each other,
  deep_blue: { len: [40, 130], w: [1.6, 3.2], k: 5, dev: .06, ap: .55, th: .85 },   // pressed harder where it is darkest
  black_over: { len: [30, 100], w: [1.4, 2.6], k: 1.6, dev: .07, ap: .32, th: .9 },   // black laid over the blues where he did
};
let LD = null, LD_PHOTO = null;
async function ldInit() {
  if (LD_MODE === 'v1' || LD_MODE === 'public') return;
  try { LD = await loadJSON('data/leonov_drawing.json'); } catch (e) { console.warn('no data/leonov_drawing.json: the v1 drawing'); return; }
  const dec = s => Uint8Array.from(atob(s), c => c.charCodeAt(0)), G0 = LD.grid;
  LD.pencils.forEach(p => { p.c = dec(p.cov); p.Tc = p.T.map(v => Math.pow(v, LD_CONTRAST[p.name] ?? 1.2)); });
  const ang = dec(LD.orient.ang), coh = dec(LD.orient.coh);
  // direction field as doubled-angle vectors (so it interpolates), weighted by coherence
  LD.vx = new Float32Array(ang.length); LD.vy = new Float32Array(ang.length);
  for (let i = 0; i < ang.length; i++) { const a = ang[i] / 255 * Math.PI * 2, c = .2 + coh[i] / 255; LD.vx[i] = Math.cos(a) * c; LD.vy[i] = Math.sin(a) * c; }
  ldStrokes();
  if (LD_MODE === 'photo') { try { LD_PHOTO = await loadImage('refs/' + LD.card.photo); } catch (e) { console.warn('drawing=photo: the photo is not here; drawing the redraw'); } }
}
// bilinear sample of a grid (Uint8 0..255 or Float32) at card units (x, y)
function ldSamp(arr, x, y) {
  const g = LD.grid, fx = (x - g.x0) / g.cell - .5, fy = (y - g.y0) / g.cell - .5;
  const x0 = Math.floor(fx), y0 = Math.floor(fy), ax = fx - x0, ay = fy - y0;
  const at = (i, j) => (i < 0 || j < 0 || i >= g.nx || j >= g.ny) ? 0 : arr[j * g.nx + i];
  return (at(x0, y0) * (1 - ax) + at(x0 + 1, y0) * ax) * (1 - ay) + (at(x0, y0 + 1) * (1 - ax) + at(x0 + 1, y0 + 1) * ax) * ay;
}
function ldDir(x, y) { const vx = ldSamp(LD.vx, x, y), vy = ldSamp(LD.vy, x, y); return Math.atan2(vy, vx) / 2; }
// the strokes, generated once: seeded in each grid cell in proportion to the pencil's pressure there, then traced along
// the direction field until they run out of that pencil's band. Inside the sun: short strokes hatched across the disc.
function ldStrokes() {
  const g = LD.grid, S = LD.sun, cellA = g.cell * g.cell;
  LD.pencils.forEach((p, pi) => {
    const st = LD_STYLE[p.name] || LD_STYLE.blue, r = rng(1965 + pi * 101), out = [];
    const cov = (x, y) => ldSamp(p.c, x, y) / 255 * 1.25;
    for (let j = 0; j < g.ny; j++) for (let i = 0; i < g.nx; i++) {
      const c = p.c[j * g.nx + i] / 255 * 1.25; if (c < .03) continue;
      const L0 = (st.len[0] + st.len[1]) / 2, W0 = (st.w[0] + st.w[1]) / 2;
      const sunCell = p.name === 'orange_red' && Math.hypot(g.x0 + (i + .5) * g.cell - S.cx, g.y0 + (j + .5) * g.cell - S.cy) < S.r * .84;
      // round the disc the band's own strokes thin out, so the denser band does not swell the sun past its size
      const sunRim = p.name === 'orange_red' && !sunCell && Math.hypot(g.x0 + (i + .5) * g.cell - S.cx, g.y0 + (j + .5) * g.cell - S.cy) < S.r * 1.35;
      let n = c * st.k * (sunCell ? 1.6 : sunRim ? .6 : 1) * cellA / (L0 * W0 * .55); n = Math.floor(n) + (r() < n % 1 ? 1 : 0);
      for (let s = 0; s < n; s++) {
        const x = g.x0 + (i + r()) * g.cell, y = g.y0 + (j + r()) * g.cell;
        const inSun = p.name === 'orange_red' && Math.hypot(x - S.cx, y - S.cy) < S.r * .84;
        const len = inSun ? 6 + r() * 14 : st.len[0] + (st.len[1] - st.len[0]) * Math.pow(r(), 1.4);
        const bend = (r() - .5) * .006, dev = (r() - .5) * 2 * st.dev, half = [[], []];
        const a0 = inSun ? 1.15 + (r() - .5) * 1.4 : ldDir(x, y) + dev;
        for (const sg of [1, -1]) {
          let px = x, py = y, a = a0, run = 0;
          const pts = half[sg > 0 ? 0 : 1];
          while (run < len / 2) {
            const step = 3;
            if (!inSun) { let b = ldDir(px, py) + dev; while (b - a > Math.PI / 2) b -= Math.PI; while (a - b > Math.PI / 2) b += Math.PI; if (Math.abs(b - a) > .45) break; a = a + (b - a) * .22 + bend * sg; }
            px += Math.cos(a) * step * sg; py += Math.sin(a) * step * sg; run += step;
            if (!inSun && cov(px, py) < .04 && r() < .5) break;
            if (inSun && Math.hypot(px - S.cx, py - S.cy) > S.r * (.84 + .05 * r())) break;   // the disc keeps a round edge
            if (!inSun && p.name === 'orange_red' && Math.hypot(px - S.cx, py - S.cy) < S.r * .4) break;   // the band runs into the disc (no pale rim)                        // ran off the band (ends a little ragged)
            pts.push(px, py);
          }
        }
        const pts = [];
        for (let q = half[1].length - 2; q >= 0; q -= 2) pts.push(half[1][q], half[1][q + 1]);
        pts.push(x, y); for (let q = 0; q < half[0].length; q += 2) pts.push(half[0][q], half[0][q + 1]);
        if (pts.length < 6) continue;
        out.push({ pts: Float32Array.from(pts), w: inSun ? st.w[1] * (.8 + r() * .3) : st.w[0] + (st.w[1] - st.w[0]) * r(),
          a: clamp(.2 + (st.ap ?? .38) * Math.min(1, c) + (r() - .5) * .16, .1, .85) * (inSun ? 1.15 : 1), x, seed: (r() * 1e9) | 0, h: r() });
      }
    }
    p.strokes = out;
  });
  const xs = LD.pencils.flatMap(p => p.strokes.map(s => s.x));
  LD.xmin = Math.min(...xs); LD.xmax = Math.max(...xs);
  console.log('leonov drawing: ' + LD.pencils.map(p => p.name + ' ' + p.strokes.length).join(', '));
}
// Crayon / wax pencil (Leonov's drawing): the stroke is laid as 3–4 lanes of wax across its width (the point's facets),
// segment by segment, with pressure rising, wandering and lifting along it; lane edges wobble, so the stroke's edge is soft
// and irregular. The tooth step afterwards breaks it where the paper's grain is low; strokes are flushed in passes, so
// where they overlap the wax builds up.
function crayon(pen, pts, w, a, seed) {
  const n = pts.length; if (n < 2) return;
  const lanes = w > 2.4 ? 4 : 3, lw = w / lanes * 1.35;
  const off = [], str = [];
  for (let i = 0; i < lanes; i++) { off.push(((i + .5) / lanes - .5) * w + (hash2(seed, 40 + i) - .5) * w * .25); str.push(.55 + .55 * hash2(seed, 50 + i)); }
  const ph = hash2(seed, 61) * 50, lift = .15 + .2 * hash2(seed, 62);
  for (let j = 0; j < n - 1; j++) {
    const t = (j + .5) / (n - 1), [x0, y0] = pts[j], [x1, y1] = pts[j + 1];
    const taper = Math.sqrt(smooth(clamp(t / .14)) * smooth(clamp((1 - t) / lift)));
    const pr = taper * (.72 + .56 * vnoise(j * .45 + ph, 0, 77));               // pressure along the stroke
    if (pr < .05) continue;
    let nx = -(y1 - y0), ny = x1 - x0; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl;
    for (let i = 0; i < lanes; i++) {
      const wob = (vnoise(j * .7 + i * 9.1, ph, 78) - .5) * w * .35, o = off[i] + wob;
      pen.l(x0 + nx * o, y0 + ny * o, x1 + nx * o, y1 + ny * o, '#000', lw * (.75 + .45 * pr), clamp(a * pr * str[i], .03, 1));
    }
  }
}
// the paper's tooth for the card layer, one tile at layer resolution: fine grain (~1 px on screen) and a coarser one
let LD_TOOTH = null;
function ldTooth() {
  if (LD_TOOTH) return LD_TOOTH;
  const N = 1024, T = new Float32Array(N * N), f = LD_SS;
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
    const v = .3 * hash2((x / f) | 0, (y / f) | 0) + .4 * vnoise(x / (2.2 * f), y / (1.8 * f), 31) + .3 * vnoise(x / (7 * f), y / (5.5 * f), 47);
    T[y * N + x] = clamp((v - .18) / .64);
  }
  return (LD_TOOTH = { N, T });
}
// one drawing of the card: paper, then each pencil pressed into the tooth. Cached per (size, drawing index, progress).
const LD_CACHE = { key: '', c: null };
function ldCard(cw, k, d) {
  const key = cw + '|' + d + '|' + Math.round(k * 400);
  if (LD_CACHE.key === key) return LD_CACHE.c;
  const ch = Math.round(cw * LD.card.h / LD.card.w), u = cw / LD.card.w;
  let C = LD_CACHE.c; if (!C || C.width !== cw || C.height !== ch) C = makeCanvas(cw, ch);
  const g = C.getContext('2d', { willReadFrequently: true });
  // the card: his off-white, a faint mottle and the grain's valleys a shade darker
  const base = LD.card.rgb.map(v => Math.min(250, v * LD_GAIN)), tooth = ldTooth(), TN = tooth.N;
  const im = g.createImageData(cw, ch), D = im.data;
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
    const i = (y * cw + x) * 4, tv = tooth.T[(y % TN) * TN + (x % TN)], m = 1 - .028 * (1 - tv) + .018 * (vnoise(x / (90 * LD_SS), y / (90 * LD_SS), 5) - .5);
    D[i] = base[0] * m; D[i + 1] = base[1] * m; D[i + 2] = base[2] * m; D[i + 3] = 255;
  }
  // the drawn region only
  const rx0 = Math.floor(20 * u), ry0 = 0, rx1 = Math.ceil(870 * u), ry1 = Math.min(ch, Math.ceil(620 * u)), rw = rx1 - rx0, rh = ry1 - ry0;
  const S = (LD_CACHE.s && LD_CACHE.s.width === rw && LD_CACHE.s.height === rh) ? LD_CACHE.s : (LD_CACHE.s = makeCanvas(rw, rh));
  const sg = S.getContext('2d', { willReadFrequently: true });
  const span = LD.xmax - LD.xmin;
  for (const p of LD.pencils) {
    sg.setTransform(1, 0, 0, 1, 0, 0); sg.clearRect(0, 0, rw, rh); sg.setTransform(u, 0, 0, u, -rx0, -ry0);
    const pen = new Pen();
    p.strokes.forEach((s, si) => {
      const key2 = (s.x - LD.xmin) / span * .86 + s.h * .14;                          // left → right, a little shuffled
      const vis = clamp((k - key2) / .05); if (vis <= 0) return;
      const P = s.pts, n = P.length / 2, m = Math.max(2, Math.round(n * vis));
      const jx = (hash2(s.seed, d * 2 + 1) - .5) * .7, jy = (hash2(s.seed, d * 2 + 2) - .5) * .7;   // the boil: a hair
      const pts = []; for (let q = 0; q < m; q++) pts.push([P[q * 2] + jx, P[q * 2 + 1] + jy]);
      crayon(pen, pts, s.w, s.a * (.94 + .12 * hash2(s.seed, d + 7)), s.seed);
      if (si % 500 === 499) pen.flush(sg);                                               // passes: overlaps build up
    });
    pen.flush(sg);
    const A = sg.getImageData(0, 0, rw, rh).data, T = p.Tc, TH = (LD_STYLE[p.name] || {}).th ?? .78;   // th: how far pressure fills the tooth
    for (let y = 0; y < rh; y++) {
      const ty = ((y + ry0) % TN) * TN, row = ((y + ry0) * cw + rx0) * 4;
      for (let x = 0; x < rw; x++) {
        const al = A[(y * rw + x) * 4 + 3]; if (!al) continue;
        const tv = tooth.T[ty + ((x + rx0) % TN)], th = TH * (1 - tv), c = clamp((al / 255 - th) / (1 - th));
        if (c <= 0) continue;
        const i = row + x * 4;
        D[i] *= 1 - c + c * T[0]; D[i + 1] *= 1 - c + c * T[1]; D[i + 2] *= 1 - c + c * T[2];
      }
    }
  }
  g.putImageData(im, 0, 0);
  LD_CACHE.key = key; LD_CACHE.c = C;
  return C;
}
// the card on screen: centre (cx, cy), width cw px, rotation rot; k: draw-on progress; returns the card's screen height.
// Photo mode (licensed): the museum photo of the card (cropped above the pencil box that covers its lower edge) in its place.
function drawLeonovCard(t, k, cx, cy, cw, rot = 0, o = {}) {
  const d = drawClock(t, o.rate ?? 12).n, photo = LD_MODE === 'photo' && LD_PHOTO;
  const ch = cw * LD.card.h / LD.card.w * (photo ? LD.card.photo_crop_v : 1), u = cw / LD.card.w;
  G.save(); G.translate(cx, cy); G.rotate(rot);
  // the card's shadow: a soft one on white paper, a faint lift on black
  G.save(); G.shadowColor = o.night ? 'rgba(0,0,0,.6)' : 'rgba(40,30,20,.22)'; G.shadowBlur = o.night ? 40 : 34; G.shadowOffsetY = o.night ? 10 : 12;
  G.fillStyle = rgbHex(...LD.card.rgb.map(v => v * LD_GAIN)); G.fillRect(-cw / 2, -ch / 2, cw, ch); G.restore();
  G.beginPath(); G.rect(-cw / 2, -ch / 2, cw, ch); G.clip();
  G.imageSmoothingEnabled = true; G.imageSmoothingQuality = 'high';
  if (photo) {
    const a = LD.card.photo_to_card, s = LD.card.photo_w / LD_PHOTO.naturalWidth;
    G.translate(-cw / 2, -ch / 2); G.scale(u, u); G.transform(a[0] * s, a[3] * s, a[1] * s, a[4] * s, a[2], a[5]);
    G.filter = 'brightness(1.38) contrast(1.06)'; G.drawImage(LD_PHOTO, 0, 0); G.filter = 'none';
  } else {
    const C = ldCard(Math.round(cw * LD_SS), k, d);
    G.drawImage(C, -cw / 2, -ch / 2, cw, ch);
  }
  G.restore();
  // the card's edge: a thin pencil-grey line, a little uneven
  G.save(); G.translate(cx, cy); G.rotate(rot); G.strokeStyle = o.night ? 'rgba(255,255,255,.10)' : 'rgba(60,50,40,.28)'; G.lineWidth = 1.2; G.strokeRect(-cw / 2, -ch / 2, cw, ch); G.restore();
  return ch;
}
const ldPhoto = () => LD_MODE === 'photo' && !!LD_PHOTO;
const ldRedraw = () => LD_MODE !== 'v1' && !!LD;

// ---- ?drawing=blank: no likeness of his drawing (the blank-card cut, default from f77f594 until the crayon redraw returned) ----
// The songwriter's decision then: his «Sunrise» is not shown, nor any imitation of it (the crayon redraw is a derivative of his
// work and needs the same permission as the photo). The two drawing moments stay about the act of drawing: his coloured
// pencils on their string, the card catching the sunrise light, and the sunrise itself drawn in the film's own pencil
// style. The card is only ever seen from the back (its blank side); nothing of his composition, palette or marks.
// Everything here is procedural pencil work (no plates, no generated imagery).
//   (default, or ?drawing=crayon / redraw) the crayon redraw   ?drawing=photo  the licensed cut
const PUB = LD_MODE === 'public';
// the box: a few colours of pencil (body, the facet toward the light, the facet away from it)
const PUB_PENCILS = [['verm', 'orange', 'crimson'], ['gold', 'cream', 'orange'], ['cobalt', 'sky', 'ultra'], ['green', '#86b98a', '#20402a'],
  ['graphite', 'lead', 'night'], ['sky', 'white', 'cobalt'], ['orange', 'gold', 'verm']];
// a hexagonal coloured pencil from its back end (x, y) along ang: three facets of long strokes, the sharpened wood cone and
// the lead, an outline in the paper's contour pencil and the string tied on near the back. lit: light direction (angle).
function pubPencil(pen, x, y, ang, len, wid, spec, d, o = {}) {
  const [col, lit, dk] = spec, ux = Math.cos(ang), uy = Math.sin(ang), nx = -uy, ny = ux, s = o.seed ?? 1, night = o.night !== false;
  const at = (a, b) => [x + ux * a + nx * b, y + uy * a + ny * b], j = (i, k) => (hash3(s, i, d * 5 + k) - .5);
  const litSide = Math.cos(ang + Math.PI / 2 - (o.lit ?? -Math.PI / 2)) > 0 ? 1 : -1;   // which side of the body faces the light
  const body = len * .8, cone = len * .95, rv = o.reveal ?? 1;
  // facets: the lit one, the body colour, the shaded one
  const lanes = [[-1, litSide < 0 ? lit : dk], [0, col], [1, litSide > 0 ? lit : dk]];
  lanes.forEach(([ln, c], li) => {
    const n = Math.max(3, Math.round(wid / 5));
    for (let i = 0; i < n; i++) {
      const b = (ln + (i + .5) / n - .5) * wid / 3 + j(li * 40 + i, 1) * 1.4;
      const a0 = 3 + j(li * 40 + i, 2) * 8, a1 = Math.min(body, body * rv) - 2 + j(li * 40 + i, 3) * 6;
      if (a1 <= a0) continue;
      const [x0, y0] = at(a0, b), [x1, y1] = at(a1, b + j(li * 40 + i, 4) * 1.2);
      pen.l(x0, y0, x1, y1, c, wid / n / 3 * 2.4, .78 + .15 * hash2(s, li * 40 + i));
    }
  });
  // the ridges between the facets
  if (rv > .3) [-1, 1].forEach(sg => { const [x0, y0] = at(4, sg * wid / 6), [x1, y1] = at(body * rv - 3, sg * wid / 6 + j(sg + 7, 5)); pen.l(x0, y0, x1, y1, dk, 1, .45); });
  if (rv >= 1) {
    // the sharpened wood: strokes from the body's end converge on the lead
    for (let i = 0; i < 9; i++) {
      const b = (i / 8 - .5) * wid * .92, [x0, y0] = at(body + 1, b), [x1, y1] = at(cone - 2, b * .2 + j(i, 6));
      const shade = b * litSide < -wid * .15;
      pen.l(x0, y0, x1, y1, shade ? 'brown' : '#e8cfa0', 1.9, shade ? .55 : .85);
    }
    // the lead
    for (let i = 0; i < 4; i++) { const b = (i / 3 - .5) * wid * .2, [x0, y0] = at(cone - 3, b), [x1, y1] = at(len, j(i, 7) * .6); pen.l(x0, y0, x1, y1, col === 'graphite' ? 'night' : col, 2, .95); }
  }
  // outline in the contour pencil
  const oc = night ? 'white' : 'graphite', oa = night ? .55 : .7;
  const e = sg => { const q = []; for (let i = 0; i <= 8; i++) { const a = body * rv * i / 8; q.push(at(a, sg * wid / 2 + j(i + sg * 20, 8) * 1.3)); } if (rv >= 1) q.push(at(cone, sg * wid * .1), at(len, 0)); return q; };
  pen.poly(e(1), oc, 1.5, oa, .05); pen.poly(e(-1), oc, 1.5, oa, .05);
  pen.poly([at(0, -wid / 2), at(-1.5, 0), at(0, wid / 2)], oc, 1.4, oa, .05);
  // the string tied round it near the back end
  const sc = night ? 'silver' : 'lead';
  for (let i = 0; i < 3; i++) { const a = len * .055 + i * 3.2; pen.l(...at(a + j(i, 9) * 2, -wid / 2 - 1.5), ...at(a + 2.5 + j(i, 10) * 2, wid / 2 + 1.5), sc, 1.3, .85); }
  return at(len * .06, 0);                                                             // where the string leaves the pencil
}
// a loose string from (ax, ay) to (bx, by), floating (bow: sideways bulge in px, ph: its slow sway)
function pubString(pen, ax, ay, bx, by, bow, ph, d, o = {}) {
  const dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, q = [];
  for (let i = 0; i <= 16; i++) {
    const u = i / 16, b = Math.sin(u * Math.PI) * bow + Math.sin(u * Math.PI * 2 + ph) * bow * .35 + (hash3(i, d, 77) - .5) * 1.2;
    q.push([ax + dx * u + nx * b, ay + dy * u + ny * b]);
  }
  const n = Math.max(2, Math.round(q.length * (o.reveal ?? 1)));
  pen.poly(q.slice(0, n), o.col ?? 'silver', o.w ?? 1.3, o.a ?? .7, .02);
}
// a card in space: centre (cx, cy), w × h px, turned by yaw (about its vertical axis) and pitch, then roll; perspective f
function pubQuad(cx, cy, w, h, yaw, pitch, roll, f = 2600) {
  return [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => {
    let x = sx * w / 2, y = sy * h / 2, z = 0;
    [x, z] = [x * Math.cos(yaw), x * Math.sin(yaw)];
    [y, z] = [y * Math.cos(pitch) - z * Math.sin(pitch), y * Math.sin(pitch) + z * Math.cos(pitch)];
    const p = f / (f + z); x *= p; y *= p;
    return [cx + x * Math.cos(roll) - y * Math.sin(roll), cy + x * Math.sin(roll) + y * Math.cos(roll)];
  });
}
// the card's blank back as a drawn sheet: its tone, warm where the light falls (lx, ly), cross-strokes of the light pencils
// along its length, and a pencil edge. k: how much sunrise light reaches it.
function pubCardBack(pen, Q, d, k, o = {}) {
  const night = o.night !== false;
  const lerpP = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u)];
  G.save(); G.beginPath(); Q.forEach(([x, y], i) => i ? G.lineTo(x, y) : G.moveTo(x, y)); G.closePath();
  if (o.shadow) { G.shadowColor = 'rgba(40,30,20,.24)'; G.shadowBlur = 30; G.shadowOffsetX = 8; G.shadowOffsetY = 14; }
  const lit = o.litEdge ?? 1, A = lit ? lerpP(Q[1], Q[2], .5) : lerpP(Q[0], Q[3], .5), B = lit ? lerpP(Q[0], Q[3], .5) : lerpP(Q[1], Q[2], .5);
  const gr = G.createLinearGradient(A[0], A[1], B[0], B[1]);
  const base = night ? [196, 186, 168] : [238, 231, 214], warm = [255, 226, 168];
  gr.addColorStop(0, rgbHex(...base.map((v, i) => lerp(v, warm[i], .85 * k)))); gr.addColorStop(1, rgbHex(...base.map((v, i) => lerp(v * (night ? .55 : .97), warm[i], .18 * k))));
  G.fillStyle = gr; G.fill(); G.restore();
  // strokes laid along the card's length (the light pencils), more of them on the lit side
  for (let i = 0; i < 70; i++) {
    const v = hash2(i, 31), u0 = hash2(i, 32) * .7, u1 = Math.min(1, u0 + .2 + hash2(i, 33) * .4), jx = (hash3(i, d, 34) - .5) * 1.4;
    const P0 = lerpP(lerpP(Q[0], Q[3], v), lerpP(Q[1], Q[2], v), u0), P1 = lerpP(lerpP(Q[0], Q[3], v), lerpP(Q[1], Q[2], v), u1);
    const near = lit ? (u0 + u1) / 2 : 1 - (u0 + u1) / 2;
    pen.l(P0[0] + jx, P0[1], P1[0] + jx, P1[1], near * k > .45 && hash2(i, 35) < .6 ? 'gold' : (night ? 'cream' : 'silver'), 1.6, (night ? .22 : .07) + (night ? .3 : .2) * near * k);
  }
  const q = [...Q, Q[0]].map(([x, y], i) => [x + (hash3(i, d, 36) - .5) * 1.6, y + (hash3(i, d, 37) - .5) * 1.6]);
  pen.poly(q, night ? 'white' : 'graphite', 1.5, night ? .45 : .35, .02);
}
// a soft light (additive on black paper, a warm wash on white)
function pubGlow(x, y, r, a, col = [255, 196, 110], mode = 'lighter') {
  if (a <= 0) return;
  G.save(); G.globalCompositeOperation = mode;
  const g = G.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${col},${a})`); g.addColorStop(.35, `rgba(${col},${a * .45})`); g.addColorStop(1, `rgba(${col},0)`);
  G.fillStyle = g; G.fillRect(x - r, y - r, r * 2, r * 2); G.restore();
}
// the porthole: a rim of hatched metal round a window onto the Earth's limb, the sun rising on it. k: sunrise 0..1.
// Returns the sun's screen position.
function pubPorthole(pen, cx, cy, R, k, d, lt) {
  // inside the window: black, the Earth's curve low in it (hatched cobalt), the sun coming up over the limb
  const ER = R * 2.6, ex = cx + R * .45, ey = cy + R * .3 + ER, sx = cx - R * .22, sy = ey - Math.sqrt(ER * ER - (sx - ex) * (sx - ex)) + 26 - 46 * smooth(k);
  const win = layer(2);
  win.g.save(); win.g.beginPath(); win.g.arc(cx, cy, R, 0, TAU); win.g.clip();
  win.g.fillStyle = '#070609'; win.g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
  const pw = new Pen();
  starfield(pw, 61, 40, { region: [cx - R, cy - R, cx + R, sy - 20], twinkle: .3 });
  earthDisc(pw, ex, ey, ER, 19, { spacing: 5.5, lit: .5 + .45 * k, litA: Math.atan2(sy - ey, sx - ex), jseed: d });
  // the limb: a thin line of atmosphere, white-blue, brightening toward the sun
  const la = Math.atan2(sy - ey, sx - ex);
  for (let i = 0; i < 160; i++) {
    const a = la + (hash2(i, 71) - .5) * 1.3, near = Math.exp(-Math.pow((a - la) / .22, 2)), r = ER + 2 + hash2(i, 72) * (5 + 9 * near * k);
    const da = (12 + 30 * near) / ER;
    pw.l(ex + Math.cos(a) * r, ey + Math.sin(a) * r, ex + Math.cos(a + da) * r, ey + Math.sin(a + da) * r, near * k > .5 ? 'white' : 'sky', 1.4 + near, .45 + .45 * near * k);
  }
  // the sun: a hot point with rays (the same pencils as the rest of the film's sunrises)
  raysFrom(pw, sx, sy, { n: 150, r0: 6, r1: R * (.3 + .55 * k), seed: 23, jseed: d, energy: .5 + .5 * k, cols: ['white', 'gold', 'gold', 'orange', 'cream'], alpha: [.3, .75], w: [1, 2], a0: Math.PI, a1: TAU });
  raysFrom(pw, sx, sy, { n: 60, r0: 4, r1: R * (.12 + .2 * k), seed: 24, jseed: d, energy: 1, cols: ['white', 'cream', 'gold'], alpha: [.5, .9], w: [1.4, 2.4] });
  for (let i = 0; i < 26; i++) { const a = hash3(i, d, 73) * TAU, r = (8 + 10 * k) * Math.sqrt(hash2(i, 74)); pw.l(sx, sy, sx + Math.cos(a) * r, sy + Math.sin(a) * r, i % 3 ? 'white' : 'cream', 2.4, .95); }
  pw.flush(win.g, ORDER_NIGHT); toothIn(win, d);
  win.g.restore();
  G.drawImage(win.c, 0, 0);
  pubGlow(sx, sy, R * (.4 + .5 * k), .35 + .35 * k, [255, 214, 150]);
  // the rim: two pencil circles and hatching round the ring, lit on the side away from the sun's glare, and the bolts
  const RW = 54;
  for (let i = 0; i < 1400; i++) {
    const a = hash2(i, 81) * TAU, r = R + 4 + hash2(i, 82) * (RW - 8), facing = Math.cos(a - (la + Math.PI)) * .5 + .5;
    const da = (10 + 22 * hash2(i, 83)) / r, jx = (hash3(i, d, 84) - .5) * 1.2;
    pen.l(cx + Math.cos(a) * r + jx, cy + Math.sin(a) * r, cx + Math.cos(a + da) * r + jx, cy + Math.sin(a + da) * r, facing > .62 ? 'silver' : facing > .3 ? 'lead' : 'brown', 1.8, .45 + .4 * facing);
  }
  // the sunrise catches the inner edge of the rim (warm) on the far side
  for (let i = 0; i < 90; i++) {
    const a = la + Math.PI + (hash2(i, 85) - .5) * 1.9, r = R + 3 + hash2(i, 86) * 10, da = (14 + 20 * hash2(i, 87)) / r;
    pen.l(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a + da) * r, cy + Math.sin(a + da) * r, hash2(i, 88) < .5 ? 'gold' : 'orange', 1.8, (.3 + .55 * k) * (1 - Math.abs(hash2(i, 85) - .5) * 1.4));
  }
  [R + 1, R + RW].forEach((r, ri) => { const q = []; for (let i = 0; i <= 72; i++) { const a = i / 72 * TAU; q.push([cx + Math.cos(a) * (r + (hash3(i % 72, d, 89 + ri) - .5) * 1.6), cy + Math.sin(a) * (r + (hash3(i % 72, d, 91 + ri) - .5) * 1.6)]); } pen.poly(q, 'white', ri ? 1.5 : 2, ri ? .4 : .6, .01); });
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU + .13, r = R + RW * .55; pen.dot(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 3.4, 'silver', .7); }
  return [sx, sy];
}
// D5 (1:40), ?drawing=blank: in the dark cabin the sun comes up in the porthole; his card turns slowly in the air, its blank back to
// us, and the sunrise light blooms over its edge; his pencils float on their strings in front of it.
function pubCabin(t, lt, dur) {
  paper(G, 'night');
  const d = drawClock(t, 12).n, k = smooth(clamp((lt - .2) / (dur * .75))), rv = easeOut(clamp(lt / .9));
  const pen = new Pen(), L = layer(1);
  const [sx, sy] = pubPorthole(pen, 1395, 430, 300, k, d, lt);
  pen.flush(L.g, ORDER_NIGHT); toothIn(L, d); G.drawImage(L.c, 0, 0); L.g.clearRect(0, 0, W, H);
  // a faint shaft of the sunrise across the cabin toward the card
  const Ls = layer(2), ps = new Pen();
  raysFrom(ps, sx, sy, { n: 90, r0: 360, r1: 700, a0: Math.PI * .97, a1: Math.PI * 1.1, seed: 41, jseed: d, energy: k, cols: ['gold', 'cream'], alpha: [.04, .14], w: [1.2, 2.2] });
  ps.flush(Ls.g, ORDER_NIGHT); toothIn(Ls, d); G.drawImage(Ls.c, 0, 0);
  // the card: turning slowly in the air, its back toward us, its near edge toward the porthole
  const cx = 760 + Math.sin(lt * .5) * 14, cy = 390 + Math.cos(lt * .42) * 10;
  const Q = pubQuad(cx, cy, 640, 430, .98 - lt * .035, .1 + Math.sin(lt * .3) * .03, -.08 + Math.sin(lt * .35) * .02);
  const cardR = (Q[1][0] + Q[2][0]) / 2, cardRy = (Q[1][1] + Q[2][1]) / 2;
  G.save(); G.globalAlpha = rv; pubCardBack(pen, Q, d, .25 + .75 * k, { night: true, litEdge: 1 }); G.restore();
  pen.flush(L.g, ORDER_NIGHT); toothIn(L, d); G.globalAlpha = rv; G.drawImage(L.c, 0, 0); G.globalAlpha = 1; L.g.clearRect(0, 0, W, H);
  pubGlow(cardR, cardRy, 260 + 160 * k, .1 + .32 * k);                                  // the light blooming over its edge
  // the pencils on their strings, drifting below it: tied to one string that runs off to his wrist (lower left)
  const knot = [70 + Math.sin(lt * .4) * 8, 1090], pl = [];
  PUB_PENCILS.forEach((spec, i) => {
    const ph = i * 1.7, a = -1.42 + i * .2 + Math.sin(lt * .45 + ph) * .04, r0 = 210 + 80 * hash2(i, 51) + Math.sin(lt * .5 + ph) * 10;
    const bx = knot[0] + Math.cos(a) * r0, by = knot[1] + Math.sin(a) * r0;
    const ang = a + (hash2(i, 54) - .5) * .3 + Math.sin(lt * .6 + ph) * .06;
    pl.push([spec, bx, by, ang, 340 + 50 * hash2(i, 55), i]);
  });
  pl.forEach(([spec, bx, by, ang, len, i]) => {
    const rvi = clamp(rv * 1.3 - i * .05);
    const s0 = pubPencil(pen, bx, by, ang, len, 24, spec, d, { seed: i + 1, lit: Math.atan2(sy - by, sx - bx), reveal: rvi });
    pubString(pen, s0[0], s0[1], knot[0], knot[1], (hash2(i, 56) - .5) * 90, lt * .7 + i, d, { reveal: rvi, a: .55 });
  });
  pen.flush(L.g, ORDER_NIGHT); toothIn(L, d); G.drawImage(L.c, 0, 0);
  // the lit facets catch a little of the warm light
  pl.forEach(([spec, bx, by, ang, len], i) => pubGlow(bx + Math.cos(ang) * len * .5, by + Math.sin(ang) * len * .5, 120, .05 + .06 * k));
  return d;
}
// C1 (3:59, the ending), ?drawing=blank: the white page; the light of a sunrise falls through the porthole as a warm pool that
// slides across the page onto his card, which lies face down; his pencils lie beside it on their string.
function pubPage(t, lt, dur) {
  paper(G, 'snow');
  const d = drawClock(t, 8).n, k = smooth(clamp((lt - .1) / (dur * .8))), rv = easeOut(clamp(lt / 1.2));
  const pcx = lerp(620, 1060, k), pcy = lerp(720, 640, k), prx = 380 + 260 * k, pry = 250 + 170 * k, pa = -.18;
  const pool = (X, Y) => { const dx = X - pcx, dy = Y - pcy, u = dx * Math.cos(pa) + dy * Math.sin(pa), v = -dx * Math.sin(pa) + dy * Math.cos(pa); return smooth(clamp((1.08 - Math.hypot(u / prx, v / pry)) / .3)); };
  const words = quiet([[W / 2 - 860, 110, W / 2 + 860, 270]], .95);
  // the light on the page: warm strokes inside the pool
  const L = layer(1), pen = new Pen();
  for (let y = -40; y < H + 40; y += 7) for (let x = -60; x < W + 60; x += 46) {
    const X = x + (hash3(x, y, 3) - .5) * 40 + (y * .6) % 46, Y = y + (hash3(x, y, d % 3 + 4) - .5) * 1.4, p = pool(X, Y), m = words(X, Y);
    const warm = p * m * (.35 + .65 * k);
    if (warm > .1 && hash3(x, y, 6) < warm * .45) pen.l(X, Y, X + 44, Y - 26, hash3(x, y, 7) < .6 ? 'gold' : 'orange', 1.7, .14 + .24 * warm);
  }
  pen.flush(L.g, ORDER_SNOW); toothIn(L, d);
  G.globalCompositeOperation = 'multiply'; G.drawImage(L.c, 0, 0); G.globalCompositeOperation = 'source-over'; L.g.clearRect(0, 0, W, H);
  // his card, face down: the blank back, a soft shadow; it warms as the light reaches it
  const Q = pubQuad(1080, 640, 640, 434, 0, 0, -.045);
  const kc = clamp((k - .25) / .6);
  G.save(); G.globalAlpha = rv; pubCardBack(pen, Q, d, kc, { night: false, shadow: true, litEdge: 0 }); G.restore();
  pen.flush(L.g, ORDER_SNOW); toothIn(L, d); G.globalCompositeOperation = 'multiply'; G.globalAlpha = rv; G.drawImage(L.c, 0, 0);
  G.globalAlpha = 1; G.globalCompositeOperation = 'source-over'; L.g.clearRect(0, 0, W, H);
  // his pencils, lying in a loose fan to the left of it, still on their string; each with a soft shadow
  const knot = [300, 930], pl = [];
  PUB_PENCILS.forEach((spec, i) => {
    const ang = -1.12 + i * .16 + (hash2(i, 61) - .5) * .08, r0 = 70 + 40 * hash2(i, 62);
    pl.push([spec, knot[0] + Math.cos(ang) * r0 + i * 18, knot[1] + Math.sin(ang) * r0, ang + (hash2(i, 63) - .5) * .12, 360 + 40 * hash2(i, 64), i]);
  });
  G.save(); G.globalCompositeOperation = 'multiply'; G.filter = 'blur(7px)'; G.globalAlpha = .22 * rv; G.lineCap = 'round'; G.strokeStyle = '#6b5a48';
  pl.forEach(([, bx, by, ang, len, i]) => { G.globalAlpha = .22 * clamp(rv * 1.4 - i * .06); G.lineWidth = 20; G.beginPath(); G.moveTo(bx + 8, by + 10); G.lineTo(bx + Math.cos(ang) * len * .93 + 8, by + Math.sin(ang) * len * .93 + 10); G.stroke(); });
  G.restore();
  pl.forEach(([spec, bx, by, ang, len, i]) => {
    const rvi = clamp(rv * 1.4 - i * .06);
    const s0 = pubPencil(pen, bx, by, ang, len, 22, spec, d, { seed: i + 1, night: false, lit: -2.4, reveal: rvi });
    pubString(pen, s0[0], s0[1], knot[0], knot[1], (hash2(i, 65) - .5) * 40, i, d, { col: 'lead', a: .7, reveal: rvi });
  });
  // the string's loose end trails off the page
  pubString(pen, knot[0], knot[1], -20, 1060, 60, 1.3, d, { col: 'lead', a: .7, reveal: rv });
  pen.flush(L.g, ORDER_SNOW); toothIn(L, d); G.globalCompositeOperation = 'multiply'; G.drawImage(L.c, 0, 0); G.globalCompositeOperation = 'source-over';
  pubGlow(pcx, pcy, prx * 1.3, .3 * (.3 + .7 * k), [255, 200, 110], 'multiply');                    // the warmth of the light
}

async function initShots2() {
  try { SYNC = await loadJSON('data/sync.json'); } catch (e) { SYNC = {}; }
  await ldInit();
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
    stats: ['PILOT-COSMONAUT · AGE 30 · CALLSIGN «АЛМАЗ-2»', 'FIRST HUMAN IN OPEN SPACE', 'A PAINTER ALL HIS LIFE'] }));
  shot('D3_id_belyayev', bt(24), bt(32), async (t, lt, dur) => idCard(t, lt, dur, {
    plate: 'belyayev_turn', t0: bt(24), num: '02', accent: 'sky', en1: 'PAVEL', en2: 'BELYAYEV', ru: 'ПАВЕЛ БЕЛЯЕВ',
    stats: ['COMMANDER · AGE 39 · CALLSIGN «АЛМАЗ-1»', 'FIGHTER PILOT', 'FLEW THE FIRST SOVIET MANUAL LANDING'] }));
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
    if (PUB) {
      const d = pubCabin(t, lt, dur), Lt = typeLayer();
      tele(Lt.g, 'THE FIRST WORK OF ART MADE IN SPACE', W / 2 - 330, H - 40, t, bt(49), { size: 28, weight: 800, col: 'gold', dur: .8 });
      typeFlush(Lt, d, .3);
      return;
    }
    paper(G, 'night');
    const { n: d } = drawClock(t, 12);
    if (ldRedraw()) {
      // round 4: his card at its own shape and tone, large, the drawing laid on stroke by stroke (drawLeonovCard)
      const dx = Math.sin(lt * .6) * 12, dy = Math.cos(lt * .5) * 8, rot = Math.sin(lt * .4) * .022, ph = ldPhoto();
      drawLeonovCard(t, easeOut(clamp(lt / (dur * .7))), W / 2 + dx, (ph ? H / 2 - 44 : H / 2 - 26) + dy, 1330, rot, { night: true });
      const Lt = typeLayer();
      tele(Lt.g, 'THE FIRST WORK OF ART MADE IN SPACE', W / 2 - 330, ph ? H - 78 : H - 40, t, bt(49), { size: 28, weight: 800, col: 'gold', dur: .8 });
      if (ph) tele(Lt.g, LD_CREDIT, W / 2, H - 34, t, bt(48), { size: 16, col: 'silver', alpha: .7, align: 'center', instant: true });
      typeFlush(Lt, d, .3);
      return;
    }
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
      const tp = OI(t) - (110.4 + +(new URLSearchParams(location.search).get('b3lag') ?? -.8));
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
  // the frame (and her own scribble is on the right page), so after the cut the line is written on her notebook's blank left page.
  const A1_SPLIT = B(Bn(328)), A1_B0 = .45;                                          // ≈132.85 s
  const A1_B = { id: 'jade_hand_writing_p', tp: t => A1_B0 + t - A1_SPLIT };
  // The left page as a plane: HW_QUAD is its corners in plate px (960×540) on frame 1 of the take in use (measured on the plate,
  // not carried from take 2): outer head corner, gutter head, gutter foot, and the outer foot corner (below the frame, where the
  // fore-edge (2,340)→(225,540) meets the foot edge (600,407)→(425,530)). Page coordinates (u, v): u 0→1 across the head edge
  // from the outer edge to the gutter, v 0→HW_ASPECT down the page (a 1:1.4 page); HW_H maps them to plate px (homography).
  // Text is laid out in page units and mapped word by word (each word gets the local affine of the homography at its middle),
  // so it recedes with the page; lines sit inside the margins (u .1–.84 clear of the outer edge and the gutter's curl, above
  // the frame's lower edge) and the font is fitted so the longest line fills the measure. The page is blank (no ruled lines).
  // HW_TRACK: the book region (cover, page block, page edges; her hand masked out) tracked through the take, SIFT similarity
  // fit to frame 1 every 8 frames: [frame, dx, dy] plate px at the page centre. The camera holds: it stays under 0.6 px.
  const HW_QUAD = [[2, 340], [280, 227], [600, 407], [306.7, 613.3]], HW_ASPECT = 1.4;
  const HW_TRACK = [[1, 0, 0], [9, .1, -.2], [17, -.1, 0], [25, .1, -.1], [33, .5, -.2], [41, 0, -.3], [49, .1, -.1], [57, 0, -.2], [65, 0, -.2], [73, .2, -.3],
    [81, .2, -.2], [89, .4, -.1], [97, .2, -.1], [105, .2, -.2], [113, .4, -.2], [121, .5, -.3], [129, .4, -.4], [137, .6, -.3], [145, .3, -.2]];
  const HW_H = (() => {   // unit square → quad (Heckbert), then scale v by 1/HW_ASPECT
    const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = HW_QUAD;
    const dx1 = x1 - x2, dx2 = x3 - x2, dy1 = y1 - y2, dy2 = y3 - y2, sx = x0 - x1 + x2 - x3, sy = y0 - y1 + y2 - y3, den = dx1 * dy2 - dx2 * dy1;
    const g = (sx * dy2 - dx2 * sy) / den, h = (dx1 * sy - sx * dy1) / den;
    return (u, v) => { v /= HW_ASPECT; const z = g * u + h * v + 1; return [((x1 - x0 + g * x1) * u + (x3 - x0 + h * x3) * v + x0) / z, ((y1 - y0 + g * y1) * u + (y3 - y0 + h * y3) * v + y0) / z]; };
  })();
  const HW_LINES = [{ u: .1, n: 4 }, { u: .17, n: 3 }], HW_V0 = .32, HW_LEAD = 1.6, HW_MEASURE = .74, HW_FMAX = .14;   // lines: first word's u, word count; first baseline v, leading in font sizes
  const _mg = document.createElement('canvas').getContext('2d'), wordW = (s, size) => measure(_mg, s, FONT.serif(size));
  // each sung word written on as it is sung: from just before its onset to the next word (at most .6 s; "in" is held long)
  const wordWin = (w, i) => [w[i][0] - .08, w[i][0] + clamp((w[i + 1]?.[0] ?? w[i][0] + .6) - w[i][0], .2, .6)];
  shot('A1_snow', ar0, AR[1].t0 - .05, async (t, lt) => {
    const first = t < A1_SPLIT, clear = quiet([[W / 2 - 800, 80, W / 2 + 800, 240]], .8), w = AR[0].words;
    const words = w.map(x => x[1].replace(/[,.]/g, ''));
    if (first) {   // the line in cream pencil across the top of his black paper, word by word with the vocal
      paper(G, 'night');
      await drawPlate(t, 'leonov_drawing_hand', .3 + lt, { rate: 8, view: { zoom: 1.02 }, face: false, hatch: { spacing: 6.5, mask: clear } });
      snowfall(t, 3, 90, 'silver');
      const sz = 104, sp = wordW(' ', sz), ws = words.map(s => wordW(s, sz)), tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1);
      let x = W / 2 - tot / 2;
      words.forEach((s, i) => { handwrite(t, s, x, 190, ...wordWin(w, i), { size: sz, col: 'cream' }); x += ws[i] + sp; });
    } else {
      paper(G, 'snow');
      const { view, F } = await drawPlate(t, A1_B.id, A1_B.tp(t), { paper: 'snow', rate: 8, view: { zoom: 1.02 }, face: false, hatch: { spacing: 6.2 } });
      snowfall(t, 3, 90, 'lead');
      const f = F?.frame ?? 1, k = HW_TRACK.findIndex(r => r[0] >= f), r1 = HW_TRACK[Math.max(k, 0)], r0 = HW_TRACK[Math.max(k - 1, 0)];
      const a = r1[0] > r0[0] ? (f - r0[0]) / (r1[0] - r0[0]) : 0, ox = lerp(r0[1], r1[1], a), oy = lerp(r0[2], r1[2], a);
      const S = (u, v) => { const [x, y] = HW_H(u, v); return view.toScreen((x + ox) / 960, (y + oy) / 540); };
      // font size in page units: the longest line fits the measure
      const REF = 100, lines = []; let wi = 0;
      HW_LINES.forEach(L => { lines.push({ ...L, ws: words.slice(wi, wi + L.n), i0: wi }); wi += L.n; });
      const fs = Math.min(HW_FMAX, ...lines.map(L => (HW_MEASURE + .1 - L.u) * REF / wordW(L.ws.join(' '), REF))), unit = fs / REF, sp = wordW(' ', REF) * unit;
      lines.forEach((L, i) => { L.v = HW_V0 + i * HW_LEAD * fs; });
      lines.forEach(L => {
        let u = L.u;
        L.ws.forEach((s, j) => {
          const ww = wordW(s, REF) * unit, um = u + ww / 2, vm = L.v - fs * .3, e = 1e-3;
          const [x, y] = S(u, L.v), [mx, my] = S(um, vm), [px, py] = S(um + e, vm), [qx, qy] = S(um, vm + e);
          const ja = [(px - mx) / e * unit, (py - my) / e * unit], jb = [(qx - mx) / e * unit, (qy - my) / e * unit];
          handwrite(t, s, x, y, ...wordWin(w, L.i0 + j), { size: REF, col: 'graphite', page: [ja[0], ja[1], jb[0], jb[1]] });
          u += ww + sp;
        });
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
  const SPIN_B0 = Bn(352), SPIN_BEATS = 3, SPIN_LAG = .06, SPIN_HALF = .17;   // pass centre = B(352 + 3k) + lag; half a crossing, s
  const PORT_UV = [486 / 960, 277 / 540], PORT_R = 252 / 960;             // glass opening in plate uv (Hough fit, frames 1–91; the camera holds it)
  // her notes (2:20): the capsule is still tumbling in the g-load shot, so the sun and the Earth keep sliding across its two cabin
  // portholes like they slide across the big one before it (not the glass pulsing): the sun whips across the right port, then
  // on at the same speed behind the wall to the left one (one object at constant velocity, not a jump: her note; cabPath), the
  // Earth's limb curving through half a turn later. Glass openings (x, y, r in 960×540 plate px) fitted at frame 1 and carried by a SIFT similarity fit of the
  // wall round each (every 16 frames: the camera drifts and pushes in); the left one sits behind the first cosmonaut's helmet
  // (occ: his helmet, tracked the same way and cut out soft), so only the sliver above it shows; the path runs high there (top)
  const CAB_PORTS = [
    { f: [1, 17, 33, 49, 65, 81, 97, 113, 129, 145], x: [707, 712, 718, 724, 732, 742, 748, 758, 766, 776], y: [175, 173, 172, 170, 168, 167, 167, 165, 164, 163], r: [37, 38, 39, 40, 41, 42, 43, 45, 46, 48], top: false },
    { f: [1, 17, 33, 49, 65, 81, 97, 113, 129, 145], x: [291, 287, 282, 278, 273, 268, 261, 257, 252, 248], y: [162, 160, 159, 157, 154, 152, 152, 150, 147, 149], r: [41, 42, 43, 44, 45, 46, 48, 49, 50, 51], top: true,
      occ: [{ x: [292, 288, 283, 279, 274, 269, 261, 258, 249, 244], y: [190, 189, 188, 187, 184, 183, 183, 180, 178, 177], r: [45, 46, 47, 49, 50, 52, 54, 56, 58, 59] }] }];   // his helmet
  // G2_math (her note, 2:13): the round porthole behind the commander's head in vzor_manual turns with the same tumble. Glass and
  // the two helmets in front of it (occ: cut out soft) carried from frame 12 by SIFT fits of the wall / each helmet (every 8 frames)
  const VZ_F = [12, 20, 28, 36, 44, 52, 60, 68, 76, 84];
  const VZ_PORTS = [{ f: VZ_F, x: [506, 509, 513, 516, 519, 524, 528, 530, 534, 536], y: [98, 95, 94, 91, 90, 94, 96, 99, 100, 101], r: [56, 58, 59, 61, 63, 63, 65, 66, 68, 69], lag: .65, top: false,
    occ: [{ x: [454, 455, 457, 459, 459, 462, 464, 465, 466, 467], y: [156, 154, 153, 154, 155, 156, 159, 161, 163, 165], r: [87, 90, 93, 96, 99, 103, 105, 108, 111, 114] },
      { x: [574, 579, 584, 590, 595, 601, 608, 613, 619, 623], y: [180, 180, 181, 182, 184, 187, 191, 194, 196, 198], r: [73, 75, 77, 79, 81, 83, 85, 87, 91, 93] }] }];
  // round 6 (her note: "just one cosmonaut on the seat and Belyayev back in his own seat"): vzor_manual take 2, both men in their own
  // couches side by side, the commander on the orientation handle. Locked-off camera: the porthole between them is still (Hough fit
  // of the glass, plate px), no helmet in front of it. ?g2=old brings back take 1 (the second helmet just behind him)
  // Her follow-up: "better without the consoles because they're doing the math in their heads": take 3 (default), heads and shoulders,
  // no consoles; its porthole is still too (bright-glass bbox), and the figures orbit each man's head. ?g2=t2 = take 2, ?g2=old = take 1
  // Her next note: "stage it similarly to before, consistent with other capsule shots ... the sun and earth sweep through two portholes
  // (traveling at a constant rate between the portholes)": the default is G3's cabin (g_force frame 1) with the console removed, a still
  // plate (vzor_manual_s4); its two windows sit where g_force's do, so cabPath runs the same one sun / one Earth at CAB_V across them
  // on the same beat grid (CAB_B0 + CAB_BEATS·k: a pass at ≈144.9 s). ?g2=t3 = take 3 (heads, one porthole), ?g2=t2, ?g2=old
  const G2_Q = new URLSearchParams(location.search).get('g2'), G2_OLD = G2_Q === 'old', G2_T2 = G2_Q === 't2', G2_T3 = G2_Q === 't3', G2_S4 = G2_Q === 's4', G2_CU = !G2_OLD && !G2_T2 && !G2_T3 && !G2_S4;
  const VZ4_PORTS = Object.assign([{ f: [1, 193], x: [707, 707], y: [174, 174], r: [39, 39], top: false },
    { f: [1, 193], x: [292, 292], y: [160, 160], r: [41, 41], top: true, occ: [{ x: [290, 290], y: [192, 192], r: [47, 47] }] }], { path: true });   // right, left (behind his helmet)
  const VZ4_HEADS = [[294, 188], [638, 212]];
  // Her next note (round 7): "closer in on one guy so there's more facial expression and density of math" (the founder's intensity:
  // trying not to hurl, trying not to die, only pure reason keeps the crew alive, while spinning), and "we have values right now but
  // not equations". Default: vzor_manual take 6 (plate vzor_manual_cu), a close-up of one cosmonaut; ?g2=s4 = the two-porthole still.
  // The sun keeps G3's beat grid: its one porthole (left edge) is the path's first window, the second a hidden one off-frame where
  // G3's left window would be, so the sun crosses it when it crosses G3's right port and the Earth half a turn later.
  const VZC_PORTS = Object.assign([{ f: [1, 193], x: [22, 22], y: [152, 152], r: [155, 155], top: false },   // Hough fit, still all take
    { f: [1, 193], x: [-393, -393], y: [137, 137], r: [41, 41], top: true, hide: true }], { path: true });   // G3's offset: −415, −44 to its top
  const VZC_HEAD = [610, 245];   // his face, plate px
  // The working in his head, aligned with docs/SONG_NOTES_THE_MATH.md: every equation is the real physics and every substituted number
  // computes (checked in Python: μ = 398 600 km³/s², R⊕ = 6378 km, g₀ = 9.807; TDU-1 15.83 kN, Isp 266 s, ~45 s; 5682 kg; 167 × 475 km).
  // The often-quoted Δv ≈ 155 m/s is Vostok's 4.7 t figure: he writes it first and crosses it out for F·t/m ≈ 125 and the rocket
  // equation's ≈ 128 m/s. [text, lane, strike, colour]: lane 0 nearest the helmet; strike = a wrong first try crossed out. They arrive
  // one by one, half-written while they type on, so the ring fills as the shot goes on.
  const VZC_EQ = [
    ['T = 2π √(a³/μ)', 0], ['Δv ≈ 155 m/s', 1, 1], ['a = R⊕ + (hₚ + hₐ)/2', 2], ['T ≈ 88 min', 0, 1], ['= 6378 + (167 + 475)/2 = 6699 km', 1],
    ['ОРИЕНТАЦИЯ — РУЧНАЯ', 2, 0, 'verm'], ['T = 2π √(6699³ / 398 600) ≈ 5457 s ≈ 90.9 min', 0], ['F·t = m·Δv', 1],
    ['15 830 N × 45 s ≈ 712 000 N·s', 2], ['÷ 5682 kg → Δv ≈ 125 m/s', 0], ['Δv = Isp·g₀·ln(m₀/m₁)', 1],
    ['ṁ = F/(Isp·g₀) ≈ 6.07 kg/s × 45 s ≈ 273 kg', 2], ['= 266 · 9.807 · ln(5682/5409) ≈ 128 m/s', 0], ['Δv ≈ 130 m/s', 1, 0, 'verm'],
    ['v² = μ (2/r − 1/a)', 2], ['vₚ = √(398 600 (2/6545 − 1/6699)) ≈ 7.89 km/s', 0], ['vₐ ≈ 7.54 km/s', 1], ['Δv/v ≈ 128/7540 ≈ 1.7 %', 2],
    ['sin ρ = R⊕/(R⊕ + h) = 6378/6545 ≈ 0.974', 0], ['ρ ≈ 77° → horizon 13° below', 1], ['u = v·R⊕/r ≈ 7.4 km/s (ground)', 2],
    ['yaw: u/h ≈ 7.4/300 rad/s ≈ 1.4°/s', 0], ['Δx ≈ u·Δt ≈ 7.4 km/s × Δt', 1, 0, 'verm'], ['46 s × 7.4 ≈ 340 km', 2],
    ['ω⊕·T = 360° × 90.9/1436.1 ≈ 22.8°', 0], ['+ J₂ 0.23° → 23.0° west / lap', 1], ['23.0° × 111.3 km × cos 53° ≈ 1540 km', 2, 0, 'verm'],
    ['e = (rₐ − rₚ)/(rₐ + rₚ) ≈ 0.023', 0]];
  function mathRing(Lt, t, lt, dur, view, spin) {
    const [hx, hy] = view.toScreen(VZC_HEAD[0] / 960, VZC_HEAD[1] / 540), n = VZC_EQ.length, tight = 1 - .2 * clamp(lt / dur);   // the ring tightens
    VZC_EQ.forEach(([s, lane, strike, col], i) => {
      const t0 = .05 + i * (dur * .8) / n, age = lt - t0; if (age <= 0) return;
      const nch = Math.min(s.length, Math.ceil(age / .45 * s.length)), shown = s.slice(0, nch);   // typed on over .45 s: half-written
      const a = spin * (2.6 - lane * .5) + i * 2.399, rx = (640 + lane * 140) * tight, ry = (350 + lane * 90) * tight;   // golden-angle spread
      const x = hx - 260 + Math.cos(a) * rx, y = hy - 20 + Math.sin(a) * ry, front = Math.sin(a) > 0;   // centred left of him, over the open wall
      const fs = lane === 0 ? 44 : lane === 1 ? 38 : 32, half = measure(Lt.g, s, FONT.serif(fs)) / 2;
      const onFace = Math.abs(y - (hy + 40)) < 330 && x + half > hx - 270 && x - half < hx + 270;   // keep his face readable: what crosses it goes faint
      const o = { font: FONT.serif(fs), col: col || (lane === 2 ? 'gold' : 'cream'), alpha: clamp(age / .2) * (front ? .95 : .55) * (strike && age > 1 ? .6 : 1) * (onFace ? .12 : 1), align: 'center', rot: Math.sin(a) * .1 + (hash(i) - .5) * .12 };
      const wdt = text(Lt.g, shown, x, y, o);
      if (strike && age > .7) {   // crossed out, then the right one follows
        const k = clamp((age - .7) / .25), ca = Math.cos(o.rot), sa = Math.sin(o.rot), hw = wdt / 2 * k;
        Lt.g.save(); Lt.g.strokeStyle = P.verm; Lt.g.lineWidth = 3; Lt.g.globalAlpha = o.alpha; Lt.g.beginPath();
        Lt.g.moveTo(x - wdt / 2 * ca, y - 12 - wdt / 2 * sa); Lt.g.lineTo(x + (-wdt / 2 + 2 * hw) * ca, y - 12 + (-wdt / 2 + 2 * hw) * sa); Lt.g.stroke(); Lt.g.restore();
      }
    });
  }
  const VZ2_PORTS = [{ f: [1, 165], x: [582, 582], y: [84, 84], r: [58, 58], lag: .65, top: false }];
  const VZ3_PORTS = [{ f: [1, 193], x: [494, 494], y: [122, 122], r: [93, 93], lag: .65, top: false }];
  const VZ3_HEADS = [[216, 196], [782, 204]];   // the two faces, plate px
  const CAB_B0 = Bn(375), CAB_BEATS = 8, CAB_V = 400, CAB_ER = 200, CAB_EO = 185;   // ≈139.0 s; plate px/s; the Earth's radius, its centre below the path
  const track = (fs, vs, f) => { let i = 0; while (i < fs.length - 2 && f > fs[i + 1]) i++; return lerp(vs[i], vs[i + 1], clamp((f - fs[i]) / (fs[i + 1] - fs[i]))); };
  // where a line (base + u·(ca, sa)) is inside circle (ox, oy, r): [u0, u1] or null
  const chord = (bx, by, ca, sa, ox, oy, r) => { const qx = bx - ox, qy = by - oy, b = qx * ca + qy * sa, c = qx * qx + qy * qy - r * r, D = b * b - c; return D > 0 ? [-b - Math.sqrt(D), -b + Math.sqrt(D)] : null; };
  // the sun crossing a porthole, in pencil (portholeSun, cabinPorts): washed-out hatching densest round it, its smear back up
  // the path, the sunburst. (cx, cy, R) the glass on screen, (sx, sy) the sun, (dx, dy) its travel, f the flare, vis how far
  // in; sc scales the strokes down for a small window (1 = the big porthole, stroke for stroke as it was)
  function sunStrokes(pen, cx, cy, R, sx, sy, dx, dy, f, vis, seed, d, sc = 1) {
    const ls = sc < 1 ? Math.max(.3, sc) : 1, ws = sc < 1 ? .6 + .4 * sc : 1;
    const ang = -.62, ca = Math.cos(ang), sa = Math.sin(ang), sp = sc < 1 ? 4 : 6.5;
    for (let i = -Math.ceil(R / sp); i <= R / sp; i++) {
      const off = i * sp, half = Math.sqrt(Math.max(0, R * R - off * off));
      for (let s = -half, j = 0; s < half; j++) {
        const h1 = hash2(i * 97 + j, seed), h2 = hash2(i * 97 + j, seed + 1), len = (26 + 70 * h1) * ls;
        const u = s + len / 2, x = cx - sa * off + ca * u, y = cy + ca * off + sa * u;
        s += len + 3 * ls + 10 * h2 * ls;
        const near = Math.exp(-Math.hypot(x - sx, y - sy) / (R * (.45 + .5 * f))), dens = vis * Math.min(1, f * 1.05 + .12) * (.5 + .5 * near);
        if (h2 > dens) continue;
        const jx = (hash2(i * 97 + j, d * 3 + 1) - .5) * 2.2, jy = (hash2(i * 97 + j, d * 3 + 2) - .5) * 2.2;
        const col = near > .55 || (f > .6 && h1 < .45) ? 'white' : near > .25 || f > .6 ? (h1 < .55 ? 'cream' : 'gold') : (h1 < .6 ? 'gold' : 'orange');
        pen.l(x - ca * len / 2 + jx, y - sa * len / 2 + jy, x + ca * len / 2 + jx, y + sa * len / 2 + jy, col, (1.7 + 1.4 * near + f) * ws, clamp(.3 + .45 * f + .3 * near));
      }
    }
    // smear: the disc's track back up the path it came down
    for (let i = 0; i < 46; i++) {
      const h1 = hash2(i, seed + 5), h2 = hash2(i, seed + 6), o = (h1 - .5) * 150 * (.6 + .4 * f) * sc, len = R * (.35 + .6 * h2) * vis;
      const x0 = sx - dy * o, y0 = sy + dx * o, x1 = x0 - dx * len, y1 = y0 - dy * len, bend = (hash2(i, d + 90) - .5) * 10 * ls;
      pen.q(x0, y0, (x0 + x1) / 2 + bend, (y0 + y1) / 2, x1, y1, h2 < .4 ? 'white' : h2 < .75 ? 'gold' : 'orange', (1.6 + 2 * (1 - Math.abs(h1 - .5) * 2)) * ws, .5 + .4 * (1 - h2));
    }
    // the sunburst (same pencils as the sunrise): long rays stretched along the whip, then the white-gold core
    const along = Math.atan2(dy, dx), nr = sc < 1 ? .45 : 1;
    raysFrom(pen, sx, sy, { n: 520 * nr, r0: 14 * ls, r1: R * 1.5, energy: vis * (.55 + .45 * f), seed: seed + 11, jseed: d, w: [1.4 * ws, 3.2 * ws], alpha: [.5, .95],
      lenMul: a => .55 + .9 * Math.abs(Math.cos(a - along)) });
    raysFrom(pen, sx, sy, { n: 620 * nr, r0: 0, r1: (150 + 90 * f) * ls, energy: vis, seed: seed + 13, jseed: d, cols: ['white', 'gold', 'gold', 'white', 'orange'], w: [2 * ws, 4.2 * ws], alpha: [.85, 1] });
  }
  // the Earth sliding through a small window: blue hatching inside its disc (ex, ey, ER), a pale limb along the edge
  function earthStrokes(pen, cx, cy, R, ex, ey, ER, seed, d) {
    const ang = -.62, ca = Math.cos(ang), sa = Math.sin(ang), sp = 3.6;
    for (let i = -Math.ceil(R / sp); i <= R / sp; i++) {
      const off = i * sp, bx = cx - sa * off, by = cy + ca * off, A = chord(bx, by, ca, sa, cx, cy, R), E = chord(bx, by, ca, sa, ex, ey, ER);
      if (!A || !E) continue;
      const u0 = Math.max(A[0], E[0]), u1 = Math.min(A[1], E[1]);
      for (let s = u0, j = 0; s < u1; j++) {
        const h1 = hash2(i * 89 + j, seed), h2 = hash2(i * 89 + j, seed + 1), len = Math.min(10 + 16 * h1, u1 - s);
        const u = s + len / 2, x = bx + ca * u, y = by + sa * u; s += len + 2 + 4 * h2;
        const rim = clamp(1 - (ER - Math.hypot(x - ex, y - ey)) / (R * .5));   // 1 at the limb, fading inward
        const cloud = vnoise((x - ex) / 12, (y - ey) / 12, seed) > .64;
        const col = cloud ? 'white' : rim > .6 ? 'sky' : h1 < .5 ? 'cobalt' : h1 < .8 ? 'ultra' : 'sky';
        const jx = (hash2(i * 89 + j, d * 3 + 1) - .5) * 1.6, jy = (hash2(i * 89 + j, d * 3 + 2) - .5) * 1.6;
        pen.l(x - ca * len / 2 + jx, y - sa * len / 2 + jy, x + ca * len / 2 + jx, y + sa * len / 2 + jy, col, 1.4 + .8 * rim, .55 + .35 * rim);
      }
    }
    // the limb: a few light passes along the arc inside the glass
    const a0 = Math.atan2(cy - ey, cx - ex);
    for (let k = 0; k < 5; k++) {
      const r = ER + (k - 1) * 1.6 + (hash2(k, d + seed) - .5) * 1.4, pts = [];
      for (let a = a0 - Math.PI; a < a0 + Math.PI; a += .01) { const x = ex + Math.cos(a) * r, y = ey + Math.sin(a) * r; if (Math.hypot(x - cx, y - cy) < R) pts.push([x, y]); else if (pts.length > 1) break; else pts.length = 0; }
      if (pts.length > 1) pen.poly(pts, k < 2 ? 'white' : 'sky', 2.2 - k * .3, .8 - k * .1);
    }
  }
  // one sun on one path across the cabin wall: a straight line in plate px from the right glass's centre through the left one's
  // visible top (above the helmet), travelled at a constant CAB_V; each window shows it as it passes, the wall hides it between,
  // so it takes the gap's width / CAB_V to reach the left window. One turn = CAB_BEATS beats, the right port crossed on
  // CAB_B0 + CAB_BEATS·k; u: how far along the path the sun is, C: one turn's length. The turn index k changes while it's hidden
  function cabPath(t, pf, ports = CAB_PORTS) {   // ports with .path (G2's two-porthole plate) share it
    const [A, Q] = ports, T = (P, v) => track(P.f, v, pf);
    const o = [T(A, A.x), T(A, A.y)], q = [T(Q, Q.x), T(Q, Q.y) - (Q.top ? .7 : 0) * T(Q, Q.r)], D = Math.hypot(q[0] - o[0], q[1] - o[1]);
    const e = [(q[0] - o[0]) / D, (q[1] - o[1]) / D], ph = (beatPos(t) - CAB_B0) / CAB_BEATS, C = CAB_V * CAB_BEATS * TM.beat;
    return { o, e, n: [e[1], -e[0]], u: ph * C, C, k: Math.floor(ph - .75) };   // n: across the path, down
  }
  function cabinPorts(t, view, pf, ports = CAB_PORTS) {
    const d = drawClock(t, 12).n, cyc = SPIN_BEATS * TM.beat / SPIN_HALF;   // one turn of the tumble in half-crossings
    const path = ports === CAB_PORTS || ports.path ? cabPath(t, pf, ports) : null;
    const disc = (P, o) => { const x = track(P.f, o.x, pf), y = track(P.f, o.y, pf), r = track(P.f, o.r, pf), [cx, cy] = view.toScreen(x / 960, y / 540), [ex, ey] = view.toScreen((x + r) / 960, y / 540); return [cx, cy, Math.hypot(ex - cx, ey - cy)]; };
    for (const P0 of ports) {
      if (P0.hide) continue;   // a path's off-frame window: only places the sun on its path
      const [cx, cy, R0] = disc(P0, P0), R = R0 * .96;
      let sx, sy, dx, dy, p, k, ex, ey, ER, sd, ed;
      if (path) {   // one sun, one Earth for both windows: where each is along the path relative to this window (nearest turn)
        const { o, e, n, u, C } = path, S = (x, y) => view.toScreen(x / 960, y / 540), ps = R0 / track(P0.f, P0.r, pf);   // screen px per plate px
        const x = track(P0.f, P0.x, pf), y = track(P0.f, P0.y, pf), a = (x - o[0]) * e[0] + (y - o[1]) * e[1];
        const w = u - a - C * Math.round((u - a) / C), side = (hash(path.k * 7 + 2) - .5) * 10;   // a little different each turn (hidden when it changes)
        const P = [o[0] + e[0] * (a + w) + n[0] * side, o[1] + e[1] * (a + w) + n[1] * side], [qx, qy] = S(P[0] + e[0], P[1] + e[1]);
        [sx, sy] = S(...P); const l = Math.hypot(qx - sx, qy - sy); dx = (qx - sx) / l; dy = (qy - sy) / l;
        k = path.k; p = w / (1.28 * track(P0.f, P0.r, pf)); sd = 640 + k * 37; ed = 700;
        const we = u - C / 2 - a, wE = we - C * Math.round(we / C);   // the Earth half a turn behind, its limb just below the path
        [ex, ey] = S(o[0] + e[0] * (a + wE) + n[0] * CAB_EO, o[1] + e[1] * (a + wE) + n[1] * CAB_EO); ER = CAB_ER * ps;
      } else {
        // where the sun is in the tumble: a pass every SPIN_BEATS beats, offset by lag
        const bp = (beatPos(t) - SPIN_B0) / SPIN_BEATS - P0.lag; k = Math.round(bp); p = (bp - k) * cyc;
        // right to left with a slight fall, a little different each turn
        const lean = .16 + (hash(k * 7 + 1) - .5) * .12, nx = -Math.sin(lean), ny = -Math.cos(lean);   // n: across the path, up
        dx = -Math.cos(lean); dy = Math.sin(lean);
        const side = (hash(k * 7 + 2) - .5) * .3 * R + (P0.top ? .7 * R : 0);
        sx = cx + dx * p * R * 1.28 + nx * side; sy = cy + dy * p * R * 1.28 + ny * side;
        // the Earth half a turn off the sun: its limb comes in behind the sun and the next one's leaves ahead of it
        const pe = p > 0 ? p - cyc / 2 : p + cyc / 2, eo = R * 1.9 - (P0.top ? R * .5 : 0); ER = R * 2.6;
        ex = cx + dx * pe * R * 1.28 - nx * eo; ey = cy + dy * pe * R * 1.28 - ny * eo; sd = 640 + k * 37 + P0.lag * 100; ed = 700 + k * 13;
      }
      const f = Math.exp(-Math.pow(p / .5, 2)), vis = clamp((1.2 - Math.abs(p)) / .35), earth = Math.hypot(ex - cx, ey - cy) < ER + R;
      const L = layer(3), M = layer(5), pen = new Pen(), sc = R / 544;
      if (earth) earthStrokes(pen, cx, cy, R, ex, ey, ER, ed, d);
      if (vis > 0) sunStrokes(pen, cx, cy, R, sx, sy, dx, dy, f, vis, sd, d, sc);
      pen.flush(L.g, ORDER_NIGHT); toothIn(L, d);
      // the glass: black space (the plate's lit window put out), a little less under the glare, then the strokes; all masked soft
      // to inside the drawn rim (a hard-edged fill that misses the glass reads as a stray shape: her note)
      paper(M.g, 'night', .85 - .25 * f * vis); M.g.drawImage(L.c, 0, 0);
      M.g.globalCompositeOperation = 'destination-in';
      const mk = M.g.createRadialGradient(cx, cy, 0, cx, cy, R); mk.addColorStop(0, '#000'); mk.addColorStop(.8, '#000'); mk.addColorStop(1, 'rgba(0,0,0,0)');
      M.g.fillStyle = mk; M.g.fillRect(cx - R, cy - R, 2 * R, 2 * R);
      M.g.globalCompositeOperation = 'destination-out';   // helmets in front of the glass
      for (const o of P0.occ || []) { const [hx, hy, hr] = disc(P0, o), hg = M.g.createRadialGradient(hx, hy, 0, hx, hy, hr * 1.04); hg.addColorStop(0, '#000'); hg.addColorStop(.93, '#000'); hg.addColorStop(1, 'rgba(0,0,0,0)'); M.g.fillStyle = hg; M.g.fillRect(cx - R, cy - R, 2 * R, 2 * R); }
      M.g.globalCompositeOperation = 'source-over';
      G.drawImage(M.c, cx - R, cy - R, 2 * R, 2 * R, cx - R, cy - R, 2 * R, 2 * R);
      if (f * vis > .03) {   // the light it throws into the cabin, from where the sun is on the glass
        const gx = clamp(sx, cx - R * .8, cx + R * .8), gy = P0.top ? cy - R * .5 : clamp(sy, cy - R * .8, cy + R * .8), gR = R * 3, a = f * vis;
        G.save(); G.globalCompositeOperation = 'lighter';
        const gr = G.createRadialGradient(gx, gy, 0, gx, gy, gR);
        gr.addColorStop(0, `rgba(255,236,200,${.45 * a})`); gr.addColorStop(.3, `rgba(255,190,120,${.22 * a})`); gr.addColorStop(1, 'rgba(255,160,90,0)');
        G.fillStyle = gr; G.fillRect(gx - gR, gy - gR, 2 * gR, 2 * gR); G.restore();
      }
    }
  }
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
    const L = layer(3), pen = new Pen();
    sunStrokes(pen, cx, cy, R, sx, sy, dx, dy, f, vis, 600 + k * 37, d);
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
      { s: 'ОТКАЗ СИСТЕМЫ УПРАВЛЕНИЯ', t: w[1][0] + .25, x: 116, y: 660, font: FONT.cyr(46), col: 'white', style: 'type', dur: .4, ls: 3 },
      { s: 'AND THE CAPSULE SPUN', t: w[2][0], x: 116, y: 740, font: FONT.mono(34, 800), col: 'white', style: 'type', dur: .5 },
    ]);
  });
  shot('G2_math', BD[1].t0 - .05, BD[2].t0 - .05, async (t, lt, dur) => {
    paper(G, 'night');
    const spin = lt * .35;
    const plate = G2_OLD ? 'vzor_manual' : G2_T2 ? 'vzor_manual_t2' : G2_T3 ? 'vzor_manual_t3' : G2_S4 ? 'vzor_manual_s4' : 'vzor_manual_cu';
    const zoom = G2_OLD || G2_T2 ? 1.1 : G2_T3 ? 1.04 : G2_S4 ? 1.05 + lt * .012 : 1.03 + lt * .01;
    const { view } = await drawPlate(t, plate, .5 + lt, { view: { zoom, rot: Math.sin(spin) * (G2_OLD || G2_T2 ? .06 : .03) } });
    if (view) cabinPorts(t, view, (.5 + lt) * 24, G2_OLD ? VZ_PORTS : G2_T2 ? VZ2_PORTS : G2_T3 ? VZ3_PORTS : G2_S4 ? VZ4_PORTS : VZC_PORTS);
    // hand-written orbital arithmetic circling the frame. Sourced figures only (docs/FACTCHECK.md §4.2): the TDU-1 retro-rocket
    // (~16 kN for ~45 s, Δv ~155 m/s), the 167 × 475 km orbit and its 90.9 min period
    const Lt = typeLayer(), eq = ['Δv ≈ 155 m/s', 't ≈ 45 s', 'T = 90.9 min', 'ОРИЕНТАЦИЯ — РУЧНАЯ', 'h = 167–475 km', 'F ≈ 16 kN'];
    if (G2_CU && view) mathRing(Lt, t, lt, dur, view, spin);
    else if (!G2_OLD && !G2_T2 && view) eq.forEach((s, i) => {   // the math in their heads: three figures circling each helmet, dimmer behind it
      const h = i % 2, HD = G2_S4 ? VZ4_HEADS : VZ3_HEADS, [hx, hy] = view.toScreen(HD[h][0] / 960, HD[h][1] / 540), a = spin * 2.4 + Math.floor(i / 2) / 3 * TAU + h * 1.1;
      const [rx, ry, fs] = G2_S4 ? [215, 130, 36] : [340, 240, 48];
      text(Lt.g, s, hx + Math.cos(a) * rx, hy - (G2_S4 ? 30 : 40) + Math.sin(a) * ry, { font: FONT.serif(i === 3 ? fs - 8 : fs), col: i === 3 ? 'verm' : 'cream', alpha: clamp((lt - i * .15) / .3) * (Math.sin(a) > 0 ? .95 : .65), align: 'center', rot: Math.sin(a) * .12 });
    });
    else eq.forEach((s, i) => { const a = spin + i / eq.length * TAU, r = 430; text(Lt.g, s, W / 2 + Math.cos(a) * r * 1.6, H / 2 + Math.sin(a) * r * .8, { font: FONT.serif(46), col: i === 3 ? 'verm' : 'cream', alpha: clamp((lt - i * .15) / .3) * .9, align: 'center', rot: Math.sin(a) * .2 }); });
    typeFlush(Lt, drawClock(t, 12).n, .4);
    const w = BD[1].words;
    const ly = G2_S4 ? 300 : 0;   // the two-porthole cabin: under their helmets, clear of the faces
    if (G2_CU) lyricStack(t, [{ s: 'DOING THE MATH', t: w[0][0], x: 90, y: 860, size: 130, style: 'rise' }, { s: 'WITH A SPINNING SUN', t: w[3][0], x: 90, y: 965, size: 96, style: 'rise', col: 'gold' }]);   // lower left, clear of his face
    else lyricStack(t, [{ s: 'DOING THE MATH', t: w[0][0], x: W / 2, y: 520 + ly, size: 150, align: 'center', style: 'rise' }, { s: 'WITH A SPINNING SUN', t: w[3][0], x: W / 2, y: 640 + ly, size: 110, align: 'center', style: 'rise', col: 'gold' }]);
  });
  const HO = BD[2].words; // hold on ×3
  // already tumbling on the first HOLD ON (outside), then through the porthole with the sun still sweeping past, then the g-load
  const holds = [[HO[0][0], 'capsule_spin', .4, 170, { rate: 1.5, roll: .13, zoom: .16 }], [HO[2][0], 'porthole_spin', .1, 240, { face: false, rate: 1.2, sun: true }], [HO[4][0], 'g_force', .6, 330]];
  shot('G3_hold', BD[2].t0 - .05, bd1, async (t, lt, dur) => {
    paper(G, 'night');
    let cur = holds[0]; for (const h of holds) if (t >= h[0] - .05) cur = h;
    const riser = clamp((t - O(139.5)) / (bd1 - O(139.5)));
    const shake = 6 + riser * 22;
    const ho = cur[4] || {};
    const { view } = await drawPlate(t, cur[1], cur[2] + (t - cur[0]) * (ho.rate || 1), { face: ho.face, rate: riser > .3 ? 24 : 12, view: { zoom: 1.05 + (ho.zoom || 0) + riser * .15, rot: ho.roll ? -ho.roll + (t - cur[0]) * ho.roll * 1.1 : 0, ox: (hash(Math.floor(t * 24)) - .5) * shake, oy: (hash(Math.floor(t * 24) + 7) - .5) * shake },
      extra: (pen) => edgePanic(pen, .35 + riser * .65, drawClock(t, 24).n * 13) });
    if (ho.sun && view) portholeSun(t, view);
    if (cur[1] === 'g_force' && view) cabinPorts(t, view, (cur[2] + (t - cur[0]) * (ho.rate || 1)) * 24);
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
    await drawPlate(t, 'reentry_outside', tpRe(t), { view: RE_VIEW, ...RE_OPT, hatch: { pencilOpt: { warm: 1.8 }, mask: quiet([[60, 70, 1140, 370], [W / 2 - 420, H - 150, W / 2 + 420, H - 40]], .8) } });
    const w = H3[1].words;   // Fall through the skies, bring me home (the extended recording's final chorus)
    // "bring" lands .4 s before the cut to the parachute ("home" is sung after it): a subtitle-sized line, not a hero word
    lyricStack(t, [{ s: 'FALL THROUGH', t: w[0][0], x: 110, y: 200, size: 120, col: 'white', style: 'rise' },
      { s: 'THE SKIES', t: w[2][0], x: 110, y: 330, size: 120, col: 'white', style: 'rise' },
      { s: 'bring me home', t: w[4][0] - .1, x: W / 2, y: H - 80, font: FONT.serif(64), col: 'cream', align: 'center', style: 'rise' }]);
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
    tele(Lt.g, 'ALTITUDE ~2.5 KM', 60, 100, t, d20 + .9, { size: 20, col: 'lead', dur: .4 });
    typeFlush(Lt, drawClock(t, 12).n, .3);
  });
  // the chops hit on the sung words, which sit on the beat ("Off" n, "but" the and of n+3, "home" n+5; tools/retime.py
  // offcourse1-3). Each hit is set .1 s early: drawn on twos, and a slam is half-opaque only .04 s in, so a hit set on
  // the word shows 0.07-0.14 s after it; .1 s early it shows within 0.035 s of the beat (measured on the 24 fps render).
  // ?offcourse=old: the round-4 times (the released cut's recogniser timing through the map: lines 2-3's OFF COURSE
  // 0.4-0.6 s early, every (BUT I'M) 0.26-0.34 s early, lines 2-3's HOME 0.28-0.53 s late, as seen).
  const OC_OLD = Q.get('offcourse') === 'old', OC_T0 = OC_OLD ? 176.433 : D2[0].t0;
  const OC_HITS = OC_OLD ? [[176.433, 177.271, 178.253], [178.907, 180.292, 181.412], [181.632, 183.126, 184.542]]
    : D2.map(l => [l.words[0][0], l.words[2][0], l.words[4][0]].map(x => x - .1));
  shot('E2_map', bt2(16), OC_T0 - .3, async (t, lt) => {
    paper(G, 'snow');
    descentMap(t, bt2(16), { dur: 4.2 });
  });
  shot('E3_offcourse', OC_T0 - .3, d21, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'descent_forest', .5 + lt * .5, { paper: 'snow', lines: { contrast: 2.4, white: .7 }, view: { zoom: 1.03, rot: Math.sin(lt * .5) * .03 } });
    const items = [];
    for (const [a, b, c] of OC_HITS) { items.push([a, 'OFF COURSE', W / 2, 560, 240, 'verm']); items.push([b, "(BUT I'M)", W / 2, 520, 150, 'graphite']); items.push([c, 'HOME', W / 2, 600, 300, 'graphite']); }
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
  // runs through the held "down" to the sung "home" (204.79 s, round 4: 4.7 s); the plate rate stays O3's .48 at most so
  // treetops (5.04 s) does not run out
  shot('L1_impact', l0, HOME1.t0 - .05, async (t, lt, dur) => {
    paper(G, 'snow');
    const shake = Math.exp(-lt * 5) * 14, dn = drawClock(t, lt < .6 ? 24 : 12).n;
    await drawPlate(t, 'treetops', 2.66 + lt * Math.min(.7, 2.3 / dur), { paper: 'snow', rate: lt < .6 ? 24 : 12, lines: { contrast: 2.2, white: .72 },
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
    await drawPlate(t, 'hatch_tree', .5 + lt * .9, { paper: 'snow', view: { zoom: 1.03 }, ...SNOW_DUSK, hatch: { mask: quiet([[W / 2 - 520, 150, W / 2 + 520, 420], [40, H - 150, 1000, H - 40]], .8) } });
    lyricStack(t, [{ s: 'HOME', t: HOME1.t0, x: W / 2, y: 380, size: 280, align: 'center', col: 'graphite', style: 'rise' }]);
    // viewers missed the jammed hatch (FACTS §3: blown by explosive bolts, wedged against a tree, rocked free, fell into the snow)
    const Lt = typeLayer();
    tele(Lt.g, 'THE HATCH BLEW OPEN — INTO A TREE.', 60, H - 104, t, HOME1.t0 + .7, { size: 24, weight: 800, col: 'graphite', dur: .7 });
    tele(Lt.g, 'THEY ROCKED IT UNTIL IT FELL FREE.', 60, H - 66, t, HOME1.t0 + 1.7, { size: 24, weight: 800, col: 'graphite', dur: .7 });
    typeFlush(Lt, drawClock(t, 12).n, .6);
  });
  // the hatch lies in the snow; Leonov climbs out and helps Belyayev
  shot('L3_madeit', MADE2.t0 - .05, HOME2.t0 - .05, async (t, lt) => {
    paper(G, 'snow');
    // ?l3=drawn: Kenton's "what a human would draw" test: the shot drawn by hand (tools/human_draw.py, looser version, her pick)
    // and animated from that drawing (tools/drawn_plate.py), shown as it is: no tracing pass over it
    const l3 = new URLSearchParams(location.search).get('l3');   // ?l3=drawn | soft (toned to the pale shot before it: her note on contrast/saturation)
    if (l3 === 'drawn' || l3 === 'soft') await paperTake(l3 === 'soft' ? 'hatch_drawn_soft' : 'hatch_drawn', .4 + lt * 1.3);
    else await drawPlate(t, 'hatch_free', 2.2 + lt * 1.3, { paper: 'snow', view: { zoom: 1.03 }, ...SNOW_DUSK, hatch: { mask: quiet([[W / 2 - 620, 100, W / 2 + 620, 260]], .8) } });
    lyricStack(t, [{ s: 'MADE IT DOWN', t: MADE2.t0, x: W / 2, y: 220, size: 150, align: 'center', col: 'graphite', style: 'rise' }]);
  });
  // night by the fire: quilted suit linings, parachute cloth, fur boots. The plate is dusk; here only what the fire lights is drawn
  // (the hatching falls off with distance from the fire), so the taiga goes to night around it.
  shot('L4_fire', HOME2.t0 - .05, O(206.2), async (t, lt) => {
    paper(G, 'night');
    const ftp = 2.2 + lt * .55, z = 1.03, m = plateMeta('fire_night_v2', ftp), fu = m ? m.sun : [.43, .96];
    const fx = W / 2 + (fu[0] - .5) * W * z, fy = H / 2 + (fu[1] - .5) * H * z;
    // no lyric here: the re-record (alt2) does not sing the second "home." (the voice ends on "down" ≈211.3 s; what the
    // vocal stem holds after it is the vibrato-free string line), so the fire and the caption carry the shot alone
    const firelight = (X, Y) => clamp(1.25 - Math.hypot((X - fx) / 1.3, Y - fy) / 950, .14, 1);
    await drawPlate(t, 'fire_night_v2', ftp, { view: { zoom: z }, ana: { gain: .95 }, lines: { black: .14, contrast: 2.1 }, hatch: { mask: firelight },
      contour: { mask: (X, Y) => firelight(X, Y) > .35 ? 1 : 0 },
      extra: (pen, F, view, d) => flames(pen, fx, Math.min(H + 20, fy + 40), { size: 300, n: 54, seed: d * 3 + 1 }) });
    const Lt = typeLayer(); tele(Lt.g, 'TWO NIGHTS IN THE TAIGA · BELOW −25 °C', 60, H - 64, t, HOME2.t0 + 1, { size: 22, weight: 700, col: 'silver', dur: .7 }); typeFlush(Lt, drawClock(t, 12).n, .4);
  });
  // by the fire he takes a small flat card out of his suit lining, looks at it and smiles (card_by_fire, generated from
  // fire_night_v2 at 2.2 s, L4's own opening frame, so the cut keeps the framing). The drawing was a small flat card, not a
  // folded sheet (docs/FACTCHECK.md P2-8; the old drawing_survives_v2 unfolded one). The take 0.9 → 6.0 s: the card comes out
  // (≈1.5 s), then the camera pushes in onto it and his smile. Lit as L4: only what the fire lights is drawn at first; the
  // falloff widens as the camera pushes in and the fire leaves the frame. No caption (the line moves to the coda).
  shot('L5_survived', O(206.2), O(211.2), async (t, lt, dur) => {
    paper(G, 'night');
    const tp = .9 + lt * 5.1 / dur, z = 1.03, open = smooth(clamp((tp - 2.1) / 1.6));
    const fx = W / 2 + (.415 - .5) * W * z, fy = H / 2 + (.957 - .5) * H * z + open * 500;   // the fire (plate meta, first second), sinking out of frame with the push-in
    const firelight = (X, Y) => clamp(1.25 - Math.hypot((X - fx) / 1.3, Y - fy) / (950 + open * 900), .14 + .5 * open, 1);
    await drawPlate(t, 'card_by_fire', tp, { view: { zoom: z }, ana: { gain: Math.round((.95 + .35 * open) * 20) / 20 }, lines: { black: .14, contrast: 2.1 - .5 * open }, hatch: { mask: firelight },
      contour: { mask: (X, Y) => firelight(X, Y) > .35 ? 1 : 0 }, face: tp > 2.4,
      extra: (pen, F, view, d) => { if (open < .6) flames(pen, fx, Math.min(H + 20, fy + 40), { size: 300 * (1 - open), n: 54, seed: d * 3 + 1 }); } });
  });
  // skiers in sheepskin coats bring warm clothes; the cosmonauts by the fire in their linings
  // The montage keeps its span, beats LEG_END − 30 → LEG_END (≈214.9 → 225.8 s, after L6's rescue), so twelve milestones share
  // 30 beats: the six with the longer lines (and a crew line) get 3 beats, the others 2. Years in order; every line names
  // its mission, and a human mission names its people: the headline names who did the first, the smaller crew line the rest.
  const LEG_SPAN = 30, LEG_END = Bn(610);                                            // the legacy montage ends on beat 610 (≈225.81 s)
  const LEG = [   // [year, line (docs/FACTS.md §6), plate, framing (cx, cy, zoom) in the right-hand panel, beats, crew line or '']
    ['1969', 'APOLLO 11 — ARMSTRONG AND ALDRIN WALK ON THE MOON', 'leg_moon', [.72, .45, 1.0], 3, 'COLLINS FLIES COLUMBIA OVERHEAD'],
    ['1975', 'APOLLO–SOYUZ — LEONOV AND STAFFORD SHAKE HANDS IN ORBIT', 'leg_handshake', [.63, .52, 1.3], 3, 'WITH KUBASOV, BRAND AND SLAYTON'],   // 17 Jul 1975
    ['1984', 'SALYUT 7 — SVETLANA SAVITSKAYA, THE FIRST WOMAN IN OPEN SPACE', 'leg_savitskaya', [.6, .52, 1.3], 3, 'WITH VLADIMIR DZHANIBEKOV'],   // 25 Jul 1984, 3 h 35 min
    ['2000', 'ISS — FIFTEEN NATIONS, ONE STATION', 'leg_station', [.56, .5, 1.06], 2, 'EXPEDITION 1: SHEPHERD, GIDZENKO, KRIKALEV MOVE IN'],   // 2 Nov 2000
    ['2008', "SHENZHOU 7 — ZHAI ZHIGANG, CHINA'S FIRST SPACEWALK", 'leg_shenzhou7', [.6, .46, 1.1], 3, 'WITH LIU BOMING AND JING HAIPENG'],   // 27 Sep 2008, Feitian suit
    ['2010', 'HAYABUSA — A CRIPPLED PROBE BRINGS HOME THE FIRST ASTEROID DUST', 'leg_hayabusa', [.62, .45, 1.08], 3, ''],   // Itokawa; capsule landed at Woomera, 13 Jun 2010
    ['2012', 'CURIOSITY — A SKY CRANE LOWERS A ROVER ONTO MARS', 'leg_curiosity', [.65, .5, 1.12], 2, ''],    // 6 Aug 2012 UTC, Gale Crater
    ['2014', 'ROSETTA / PHILAE — A LANDER ON A COMET', 'leg_philae', [.72, .56, 1.7], 2, ''],
    ['2019', "CHANG'E 4 — FIRST SOFT LANDING ON THE MOON'S FAR SIDE", 'leg_change4', [.6, .5, 1.08], 2, ''],
    ['2022', "TIANGONG — CHINA'S SPACE STATION IS COMPLETE", 'leg_tiangong', [.65, .42, 1.06], 2, 'CHEN DONG, LIU YANG AND CAI XUZHE ABOARD'],   // Shenzhou 14 crew; Mengtian berthed Nov 2022
    ['2023', "CHANDRAYAAN-3 — INDIA LANDS NEAR THE MOON'S SOUTH POLE", 'leg_chandrayaan3', [.68, .45, 1.1], 2, ''],   // Chandrayaan-3 landed at ~69°S: near, not at, the pole
    ['2024', 'POLARIS DAWN — ISAACMAN AND GILLIS MAKE THE FIRST COMMERCIAL SPACEWALK', 'leg_commercial', [.62, .5, 1.12], 3, 'WITH POTEET AND MENON'],   // 12 Sep 2024
  ];
  const LEG_B0 = LEG_END - LEG_SPAN, lg0 = B(LEG_B0), lg1 = B(LEG_END), PX = 640;
  const LEG_AT = LEG.reduce((a, it) => [...a, a[a.length - 1] + it[4]], [0]);          // each item's first beat, from LEG_B0
  if (LEG_AT[LEG.length] !== LEG_SPAN) throw new Error('LEG beats must sum to LEG_SPAN');
  shot('L6_rescue', O(211.2), lg0, async (t, lt) => {
    paper(G, 'snow');
    await drawPlate(t, 'rescue_v2', 2 + lt * 1.4, { paper: 'snow', view: { zoom: 1.03 }, ...SNOW_DUSK, hatch: { mask: quiet([[40, 30, 760, 110]], .8) } });
    const Lt = typeLayer(); tele(Lt.g, 'RESCUERS ARRIVE ON SKIS', 60, 64, t, O(211.5), { size: 24, weight: 800, col: 'graphite', dur: .6 }); typeFlush(Lt, drawClock(t, 12).n, .6);
  });
  // team Earth: one milestone per LEG item, cut on the beat
  shot('L7_legacy', lg0, lg1, async (t, lt) => {
    paper(G, 'night');
    const bb = beatPos(t) + 1e-4 - LEG_B0, i = clamp(LEG_AT.findIndex(b => b > bb) - 1, 0, LEG.length - 1), [yr, line, plate, fr, , crew] = LEG[i], it0 = B(LEG_B0 + LEG_AT[i]), age = t - it0;
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
    if (crew) {   // the crew, smaller, under however many lines the headline wrapped to (tele's own wrap rule)
      const f = FONT.mono(30, 800); let n = 1, cur = '';
      for (const w of line.split(' ')) { const tryL = cur ? cur + ' ' + w : w; if (cur && measure(Lt.g, tryL, f, 1.5) > 470) { n++; cur = w; } else cur = tryL; }
      tele(Lt.g, crew, 116, 500 + n * 30 * 1.35 + 16, t, it0 + .3, { size: 22, weight: 700, col: 'silver', dur: .3, wrap: 470 });
    }
    typeFlush(Lt, drawClock(t, 12).n, .3);
  });

  // ============================== CODA · 226.55 → end ==============================
  const [c0, c1] = S('coda').slice(1), [e0, e1] = S('end').slice(1);
  const CARD1 = B(Bn(619));                                                          // ≈229.10 s: the survivors card → the drawing
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
    if (PUB) pubPage(t, lt, dur);                                                    // ?drawing=blank: his card face down
    else if (ldRedraw()) {
      // round 4: the card itself on the page, large, under the handwritten line
      paper(G, 'snow');
      const ph = ldPhoto();
      drawLeonovCard(t, easeOut(clamp(lt / 1.6)), W / 2, ph ? 600 : 652, 1100, -.012, { rate: 8 });
      if (ph) { const Lt = typeLayer(); tele(Lt.g, LD_CREDIT, W / 2, H - 40, t, CARD1, { size: 16, col: 'lead', alpha: .85, align: 'center', instant: true }); typeFlush(Lt, drawClock(t, 8).n, .3); }
    } else { paper(G, 'snow'); await leonovDrawing(t, easeOut(clamp(lt / 1.6)), { zoom: .8, ox: 120, oy: 130 }, { rate: 8 }); }
    handwrite(t, 'The cosmonauts and the artwork survived.', W / 2, 200, CARD1 + .6, CARD1 + 3.0, { size: 88, align: 'center', col: 'graphite' });
  });
  shot('Z_title', e0, 999, async (t, lt) => {
    paper(G, 'night');
    const L = typeLayer(), g = L.g, k = clamp(lt / .12);
    text(g, 'ORBITAL SUNRISE', W / 2, 520, { font: FONT.impact(200), col: 'white', align: 'center', alpha: k, ls: 6 });
    text(g, 'ОРБИТАЛЬНЫЙ ВОСХОД', W / 2, 600, { font: FONT.cyr(48), col: 'verm', align: 'center', alpha: k, ls: 4 });
    text(g, '轨道日出', W / 2, 652, { font: FONT.cjk(34), col: 'verm', align: 'center', alpha: k, ls: 14 });
    text(g, 'JADE WANG', W / 2, 730, { font: FONT.mono(34, 800), col: 'white', align: 'center', alpha: clamp((lt - .3) / .3), ls: 8 });
    text(g, 'An homage to \u201cOrbital Sunrise: The First Art Made in Space\u201d by John Green', W / 2, 900, { font: FONT.serif(30), col: 'silver', align: 'center', alpha: clamp((lt - .6) / .4) });
    // (Kenton: a second line crediting vlogbrothers read as crediting them with the video; the line above says enough)
    typeFlush(L, drawClock(t, 12).n, .3);
    // the picture fades with the last ringing note
    const end = TM.durExt ?? TM.dur, f = clamp((t - (end - 2.4)) / 2.2);
    if (f > 0) { G.fillStyle = P.night; G.globalAlpha = f; G.fillRect(0, 0, W, H); G.globalAlpha = 1; }
  });
}
