// tether.js: Leonov's tether as a procedural cable (round 5, her notes on 0:14 and 0:33).
//
// The generated plates never keep a cable's length (they stretch it, or make it a stiff hoop with a free end), so the
// cable is simulated here and drawn in pencil over plates with the generated one painted out (tools/tether_r5.py).
//
// simulateRope(): a constant-length rope in 3D, position-based dynamics: n equal segments whose lengths are re-imposed
// many times per substep (so the length never changes), both ends pinned to moving points (the ship's hatch, his waist),
// no gravity, light damping, a little bending stiffness; nothing else acts on it, so slack floats and is only pulled
// about by its ends. It runs once, over the whole shot, from a fixed seed, and stores a polyline per 1/24 s of song time,
// so every frame (rendered in any order) reads the same state. Units: plate px (the plates are 960x540, square pixels);
// z (depth, + away from the camera) only decides what passes behind him and the projected (orthographic) shape.

function _rng(seed) { let s = seed >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }

// o: { t0, t1, L, n, endA(t) → [x,y,z], endB(t) → [x,y,z], seed, turns, damp (per second), bend (0..1 per substep),
//      sub (substeps per 1/24 s), iters, pre (seconds of settling before t0, ends held), drift (px/s of initial float) }
function simulateRope(o) {
  // o.via(A, B) → [[x,y,z], ...]: an initial route from end A to end B through these points (a Catmull-Rom curve); the
  // cable's length is then that route's length (o.L ignored)
  let route = null;
  if (o.via) {
    const A0 = o.endA(o.t0), B0 = o.endB(o.t0), W = [A0, ...o.via(A0, B0), B0], R = [];
    for (let i = 0; i < W.length - 1; i++) {
      const p0 = W[Math.max(0, i - 1)], p1 = W[i], p2 = W[i + 1], p3 = W[Math.min(W.length - 1, i + 2)];
      for (let j = 0; j < 40; j++) { const s = j / 40; R.push([0, 1, 2].map(c => .5 * (2 * p1[c] + (p2[c] - p0[c]) * s + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * s * s + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * s * s * s))); }
    }
    R.push(W[W.length - 1]);
    const cum = [0]; for (let i = 1; i < R.length; i++) cum.push(cum[i - 1] + Math.hypot(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1], R[i][2] - R[i - 1][2]));
    route = { R, cum, len: cum[cum.length - 1] };
  }
  const n = o.n ?? 48, L = route ? route.len : o.L, seg = L / n, rnd = _rng(o.seed ?? 7);
  // o.collide (round 6): his body as a collision solid, from the plate's subject matte: field(t) → (x, y) → signed distance
  // to his silhouette (sim units, < 0 inside) at time t (blended between matte frames, so it sweeps); the body is a slab
  // of half-depth T about z = 0, thinning toward the silhouette edge (taper), plus a margin m (the cable's half-width).
  // Every point has a side (-1 in front of him, +1 behind): it may change only outside the silhouette; inside, the point
  // is pushed out of the body: sideways along the distance field near the edge (the body sweeps it along), in depth to its
  // own side deeper in, so the cable can only get from front to back around his edge. exemptB points next to endB (the
  // attachment on his edge) are not collided and take the side of the first collided point.
  const C = o.collide || null, side = new Int8Array(n + 1);
  const exB = C ? C.exemptB ?? 0 : 0;
  const sub = o.sub ?? 10, dt = 1 / 24 / sub, iters = o.iters ?? 30;
  const keep = Math.pow(1 - (o.damp ?? .5), dt);            // velocity kept per substep
  const bend = o.bend ?? .08;
  const X = new Float64Array((n + 1) * 3), Xp = new Float64Array((n + 1) * 3);
  // initial shape: the straight line A→B with a loose coil around it (radius solved for the length), ends fixed
  const A = o.endA(o.t0), B = o.endB(o.t0), turns = o.turns ?? 1.6, ph = rnd() * 6.283;
  const d = [B[0] - A[0], B[1] - A[1], B[2] - A[2]], dl = Math.hypot(...d) || 1, ax = d.map(c => c / dl);
  let e1 = [-ax[1], ax[0], 0]; const e1l = Math.hypot(...e1) || 1; e1 = e1.map(c => c / e1l);
  const e2 = [ax[1] * e1[2] - ax[2] * e1[1], ax[2] * e1[0] - ax[0] * e1[2], ax[0] * e1[1] - ax[1] * e1[0]];
  const wob = Array.from({ length: 3 }, () => [rnd() * 6.283, .5 + rnd()]);
  const shape = (R, i) => {
    const s = i / n, env = Math.pow(Math.sin(Math.PI * s), .7), a = ph + turns * 6.283 * s;
    const r = R * env * (1 + .25 * Math.sin(wob[0][0] + 6.283 * wob[0][1] * s));
    const c1 = Math.cos(a) * r, c2 = Math.sin(a) * r * (o.flat ?? .8) + R * .2 * env * Math.sin(wob[1][0] + 2.5 * s);
    return [0, 1, 2].map(k => A[k] + d[k] * s + e1[k] * c1 + e2[k] * c2);
  };
  const len = R => { let s = 0, p = shape(R, 0); for (let i = 1; i <= n; i++) { const q = shape(R, i); s += Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]); p = q; } return s; };
  let lo = 0, hi = L; for (let k = 0; k < 50; k++) { const m = (lo + hi) / 2; if (len(m) < L) lo = m; else hi = m; }
  for (let i = 0; i <= n; i++) {
    if (!route) { X.set(shape(lo, i), i * 3); continue; }
    const target = i * seg; let k = 1; while (k < route.cum.length - 1 && route.cum[k] < target) k++;
    const f = (target - route.cum[k - 1]) / Math.max(1e-9, route.cum[k] - route.cum[k - 1]);
    X.set([0, 1, 2].map(c => lerp(route.R[k - 1][c], route.R[k][c], f)), i * 3);
  }
  // a slow float: each point starts with a small smooth velocity (the slack drifts, coils open and turn)
  const fv = Array.from({ length: 3 }, () => [rnd() * 6.283, (rnd() - .5) * 2]);
  for (let i = 0; i <= n; i++) for (let k = 0; k < 3; k++) {
    const s = i / n, v = (o.drift ?? 6) * Math.sin(Math.PI * s) * Math.sin(fv[k][0] + 5 * s) * fv[k][1];
    Xp[i * 3 + k] = X[i * 3 + k] - v * dt;
  }
  // stiffness (Gemini 4's umbilical, her reference: big smooth loops, no kinks): no bend tighter than rMin, as a minimum
  // distance between every other point, plus the gentle smoothing in step()
  const rMin = o.rMin ?? 4 * seg, th = 2 * Math.asin(Math.min(1, seg / (2 * rMin))), dMin = 2 * seg * Math.cos(th / 2);
  let fld = null, still = false;   // still: corrections carry no velocity (settling before t0: the start shape just yields)
  const collide = () => {
    if (!fld) return;
    const T = C.T, m = C.m ?? 2, tp = C.taper ?? T, h = C.h ?? 1;
    for (let i = 1; i < n - exB; i++) {
      const a = i * 3, x = X[a], y = X[a + 1], d = fld(x, y);
      if (d >= m) continue;
      const s = side[i], zReq = T * Math.sqrt(Math.min(1, (m - d) / (m + tp))), pz = zReq - s * X[a + 2];
      if (pz <= 0) continue;
      const pxy = m - d;
      if (pxy <= pz) {
        let gx = fld(x + h, y) - fld(x - h, y), gy = fld(x, y + h) - fld(x, y - h); const gl = Math.hypot(gx, gy);
        if (gl > 1e-6) { X[a] += gx / gl * pxy; X[a + 1] += gy / gl * pxy; if (still) { Xp[a] += gx / gl * pxy; Xp[a + 1] += gy / gl * pxy; } continue; }
      }
      X[a + 2] += s * pz; if (still) Xp[a + 2] += s * pz;
    }
  };
  // o.keepOut(x, y, i) → the corrected [x, y] for point i, or null where it is clear: a no-go region in the picture (e.g.
  // the ship's hull: N1's slack must not drift up along it, where it reads as a second cord flickering against the outline)
  const keepOut = () => {
    if (!o.keepOut) return;
    for (let i = 1; i < n; i++) { const a = i * 3, q = o.keepOut(X[a], X[a + 1], i); if (!q) continue;
      if (still) { Xp[a] += q[0] - X[a]; Xp[a + 1] += q[1] - X[a + 1]; } X[a] = q[0]; X[a + 1] = q[1]; }
  };
  const sides = () => {     // a point changes side only outside his silhouette (+ margin); the exempt end inherits
    if (!fld) return;
    const m = C.m ?? 2;
    for (let i = 1; i < n - exB; i++) { const a = i * 3; if (fld(X[a], X[a + 1]) > m) side[i] = X[a + 2] >= 0 ? 1 : -1; }
    for (let i = Math.max(1, n - exB); i <= n; i++) side[i] = side[Math.max(0, n - exB - 1)];
    side[0] = side[1];
  };
  const project = () => {   // restore every segment's length (ends pinned: infinite mass)
    for (let it = 0; it < iters; it++) {
      if (fld && it % 2 === 1) collide();
      keepOut();
      if (it % 3 === 0) for (let j = 0; j + 2 <= n; j++) {
        const a = j * 3, b = a + 6, dx = X[b] - X[a], dy = X[b + 1] - X[a + 1], dz = X[b + 2] - X[a + 2], l = Math.hypot(dx, dy, dz) || 1e-9;
        if (l >= dMin) continue;
        const wa = j === 0 ? 0 : 1, wb = j + 2 === n ? 0 : 1; if (!wa && !wb) continue;
        const c = (l - dMin) / l / (wa + wb) * .5;
        X[a] += wa * c * dx; X[a + 1] += wa * c * dy; X[a + 2] += wa * c * dz;
        X[b] -= wb * c * dx; X[b + 1] -= wb * c * dy; X[b + 2] -= wb * c * dz;
      }
      const fwd = it % 2 === 0;
      for (let jj = 0; jj < n; jj++) {
        const j = fwd ? jj : n - 1 - jj, a = j * 3, b = a + 3;
        const dx = X[b] - X[a], dy = X[b + 1] - X[a + 1], dz = X[b + 2] - X[a + 2], l = Math.hypot(dx, dy, dz) || 1e-9;
        const wa = j === 0 ? 0 : 1, wb = j === n - 1 ? 0 : 1; if (!wa && !wb) continue;
        const c = (l - seg) / l / (wa + wb);
        X[a] += wa * c * dx; X[a + 1] += wa * c * dy; X[a + 2] += wa * c * dz;
        X[b] -= wb * c * dx; X[b + 1] -= wb * c * dy; X[b + 2] -= wb * c * dz;
      }
    }
    collide(); keepOut();
  };
  const step = t => {
    const a = o.endA(t), b = o.endB(t);
    for (let i = 1; i < n; i++) for (let k = 0; k < 3; k++) {   // Verlet, no forces
      const j = i * 3 + k, x = X[j]; X[j] += (X[j] - Xp[j]) * keep; Xp[j] = x;
    }
    X.set(a, 0); X.set(b, n * 3); Xp.set(a, 0); Xp.set(b, n * 3);
    if (bend > 0) for (let i = 1; i < n; i++) for (let k = 0; k < 3; k++) {   // stiffness: ease each point toward its neighbours' midpoint
      const j = i * 3 + k; X[j] += bend * ((X[j - 3] + X[j + 3]) / 2 - X[j]);
    }
    fld = C ? C.field(t) : null;
    sides();
    project();
  };
  for (let i = 0; i <= n; i++) side[i] = X[i * 3 + 2] >= 0 ? 1 : -1;
  const pre = o.pre ?? 1;
  still = true; for (let s = 0, N = Math.round(pre * 24 * sub); s < N; s++) step(o.t0); still = false;
  const out = [], outS = [], N = Math.ceil((o.t1 - o.t0) * 24) + 1;
  let maxErr = 0;
  for (let f = 0; f < N; f++) {
    const t = o.t0 + f / 24;
    if (f > 0) for (let s = 1; s <= sub; s++) step(t - 1 / 24 + s * dt);
    out.push(Float32Array.from(X)); outS.push(Int8Array.from(side));
    let l = 0; for (let i = 0; i < n; i++) l += Math.hypot(X[i * 3 + 3] - X[i * 3], X[i * 3 + 4] - X[i * 3 + 1], X[i * 3 + 5] - X[i * 3 + 2]);
    maxErr = Math.max(maxErr, Math.abs(l - L) / L);
  }
  console.log(`rope ${o.name ?? ''}: ${N} states, length error max ${(maxErr * 100).toFixed(2)} %`);
  const fi = t => clamp(Math.round((t - o.t0) * 24), 0, out.length - 1);
  return { n, L, t0: o.t0, at: t => out[fi(t)], sideAt: t => outS[fi(t)], frames: out, sidesAll: outS, maxErr, collide: !!C };
}

// Draw a cable in pencil. P: rope state (Float32Array xyz per point, plate px); toScreen(x, y) → [X, Y];
// o: { w (screen px), light [lx, ly] (screen direction the light comes from), hide(s, X, Y, z, u) → true where he covers it (u: rope point index, fractional),
//      seed, cols { body, shade, hi }, rings (spacing in screen px, 0 = none), alpha }
function drawCable(pen, P, toScreen, o = {}) {
  const n = P.length / 3 - 1, rnd = _rng(o.seed ?? 1), w0 = o.w ?? 3;
  const pts = []; for (let i = 0; i <= n; i++) { const [X, Y] = toScreen(P[i * 3], P[i * 3 + 1]); pts.push([X, Y, P[i * 3 + 2]]); }
  // resample to ~3 px steps (Catmull-Rom through the rope points) so the strokes are smooth
  const S = [], U = [];   // U: each resampled point's position along the rope (point index, fractional)
  for (let i = 0; i < n; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
    const k = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 3));
    for (let j = 0; j < k; j++) { const s = j / k; S.push([0, 1, 2].map(c => .5 * (2 * p1[c] + (p2[c] - p0[c]) * s + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * s * s + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * s * s * s))); U.push(i + s); }
  }
  S.push(pts[n]); U.push(n);
  const [lx, ly] = o.light ?? [1, -.4], ll = Math.hypot(lx, ly), Lx = lx / ll, Ly = ly / ll;
  // visible runs (split where he covers the cable)
  const runs = []; let cur = [];
  S.forEach((p, i) => { const h = o.hide ? o.hide(i / (S.length - 1), p[0], p[1], p[2], U[i]) : false; if (h) { if (cur.length > 1) runs.push(cur); cur = []; } else cur.push(p); });
  if (cur.length > 1) runs.push(cur);
  const C = { body: 'silver', shade: 'cobalt', hi: 'white', ...(o.cols || {}) }, A = o.alpha ?? 1;
  const jit = (o.jit ?? .35);
  for (const R of runs) {
    // per-point normal (screen), the lit side, a width that grows a little toward the camera (z < 0)
    const nrm = R.map((p, i) => { const a = R[Math.max(0, i - 1)], b = R[Math.min(R.length - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const tl = Math.hypot(tx, ty) || 1; tx /= tl; ty /= tl; let nx = -ty, ny = tx; if (nx * Lx + ny * Ly < 0) { nx = -nx; ny = -ny; } return [nx, ny]; });
    const wd = R.map(p => w0 * clamp(1 - p[2] / (o.persp ?? 1400), .7, 1.4));
    const off = (k, j = jit) => R.map((p, i) => [p[0] + nrm[i][0] * wd[i] * k + (rnd() - .5) * j, p[1] + nrm[i][1] * wd[i] * k + (rnd() - .5) * j]);
    if (w0 < 6) {   // a thin line: a dark shadow side, the silver body, a white glint on the lit side
      pen.poly(off(-.28), C.shade, w0 * .9, .55 * A, .04);
      pen.poly(off(0), C.body, w0 * .8, .95 * A, .04);
      pen.poly(off(.22, jit * .6), C.hi, Math.max(.9, w0 * .35), .9 * A, .1);
    } else {        // a thick cable: two edges, shading hatched across the shadow half, a highlight, faint rings
      pen.poly(off(.5), C.body, 1.6, .9 * A, .03);
      pen.poly(off(-.5), C.body, 1.4, .75 * A, .03);
      pen.poly(off(.24, jit * .5), C.hi, 1.5, .8 * A, .15);
      let acc = 0;
      for (let i = 1; i < R.length; i++) {
        acc += Math.hypot(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1]);
        const [nx, ny] = nrm[i], h = wd[i] / 2;
        if (acc > (o.hatch ?? 3.2)) {   // shade strokes: from the middle to the dark edge, slanted
          acc = 0; const s0 = -.05 + (rnd() - .5) * .15, s1 = -.48;
          const tx = ny, ty = -nx, sl = h * .5;
          pen.l(R[i][0] + nx * h * s0 * 2 + tx * sl * .3, R[i][1] + ny * h * s0 * 2 + ty * sl * .3, R[i][0] + nx * h * s1 * 2 - tx * sl * .3, R[i][1] + ny * h * s1 * 2 - ty * sl * .3, C.shade, 1.1, .6 * A);
        }
      }
      if (o.rings) { let r = 0; for (let i = 1; i < R.length; i++) { r += Math.hypot(R[i][0] - R[i - 1][0], R[i][1] - R[i - 1][1]); if (r > o.rings) { r = 0; const [nx, ny] = nrm[i], h = wd[i] / 2 * .9; pen.l(R[i][0] - nx * h, R[i][1] - ny * h, R[i][0] + nx * h, R[i][1] + ny * h, C.body, 1, .45 * A); } } }
    }
  }
  return S;   // the resampled screen curve (hatch end first), for traces over it
}

// ---------------------------------------------------------------------------------------------- round 6: his body (mattes)
// Signed distance fields of his silhouette, one per subject matte (plates/<id>/m%04d.png: odd plate frames, 512x288), in
// plate px (960x540): the matte thresholded at .5, the component nearest seed(f) (his hip / waist; the ship's hull is
// another component in some plates), exact Euclidean distance (Felzenszwalb) on a grid of `cell` plate px over his
// bounding box + pad; negative inside. Loaded once per shot (async), so the simulation stays a pure precompute.
function _edt1(f, n, d, v, z) {   // 1D squared distance transform (Felzenszwalb & Huttenlocher)
  let k = 0; v[0] = 0; z[0] = -1e20; z[1] = 1e20;
  for (let q = 1; q < n; q++) {
    let s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]);
    while (s <= z[k]) { k--; s = ((f[q] + q * q) - (f[v[k]] + v[k] * v[k])) / (2 * q - 2 * v[k]); }
    k++; v[k] = q; z[k] = s; z[k + 1] = 1e20;
  }
  k = 0;
  for (let q = 0; q < n; q++) { while (z[k + 1] < q) k++; d[q] = (q - v[k]) * (q - v[k]) + f[v[k]]; }
}
function _edt(mask, w, h) {       // squared distance from every cell to the nearest cell where mask is 1
  const INF = 1e12, D = new Float64Array(w * h), N = Math.max(w, h), f = new Float64Array(N), d = new Float64Array(N), v = new Int32Array(N), z = new Float64Array(N + 1);
  for (let i = 0; i < w * h; i++) D[i] = mask[i] ? 0 : INF;
  for (let x = 0; x < w; x++) { for (let y = 0; y < h; y++) f[y] = D[y * w + x]; _edt1(f, h, d, v, z); for (let y = 0; y < h; y++) D[y * w + x] = d[y]; }
  for (let y = 0; y < h; y++) { for (let x = 0; x < w; x++) f[x] = D[y * w + x]; _edt1(f, w, d, v, z); for (let x = 0; x < w; x++) D[y * w + x] = d[x]; }
  return D;
}
const _bc = { c: null, g: null };
async function loadBodySDF(id, frames, seed, o = {}) {
  const PW = o.pw ?? 960, PH = o.ph ?? 540, cell = o.cell ?? 2, pad = o.pad ?? 40, out = new Map();
  if (!_bc.c) { _bc.c = makeCanvas(512, 288); _bc.g = _bc.c.getContext('2d', { willReadFrequently: true }); }
  for (const f of frames) {
    let im; try { im = await loadImage(`plates/${id}/m${String(f).padStart(4, '0')}.png`); } catch (e) { continue; }
    const MW = im.width, MH = im.height; _bc.c.width = MW; _bc.c.height = MH; _bc.g.drawImage(im, 0, 0);
    const px = _bc.g.getImageData(0, 0, MW, MH).data, on = new Uint8Array(MW * MH);
    for (let i = 0; i < on.length; i++) on[i] = px[i * 4] > 127 ? 1 : 0;
    // components (4-connected flood fill); his = the one nearest the seed
    const lab = new Int32Array(MW * MH), st = [0]; let nl = 0;
    const [sx, sy] = seed(f).map((c, k) => c * (k ? MH / PH : MW / PW));
    let best = -1, bd = 1e30;
    for (let i = 0; i < on.length; i++) if (on[i] && !lab[i]) {
      nl++; st.length = 0; st.push(i); lab[i] = nl; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1, dmin = 1e30;
      while (st.length) {
        const j = st.pop(), x = j % MW, y = (j / MW) | 0;
        x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
        dmin = Math.min(dmin, (x - sx) ** 2 + (y - sy) ** 2);
        if (x > 0 && on[j - 1] && !lab[j - 1]) { lab[j - 1] = nl; st.push(j - 1); }
        if (x < MW - 1 && on[j + 1] && !lab[j + 1]) { lab[j + 1] = nl; st.push(j + 1); }
        if (y > 0 && on[j - MW] && !lab[j - MW]) { lab[j - MW] = nl; st.push(j - MW); }
        if (y < MH - 1 && on[j + MW] && !lab[j + MW]) { lab[j + MW] = nl; st.push(j + MW); }
      }
      if (dmin < bd) { bd = dmin; best = { nl, x0, y0, x1, y1 }; }
    }
    if (best === -1) continue;
    // grid over his bbox + pad, in plate px; a cell is inside when the matte pixel under its centre is his
    const X0 = Math.floor(best.x0 * PW / MW - pad), Y0 = Math.floor(best.y0 * PH / MH - pad);
    const gw = Math.ceil(((best.x1 + 1) * PW / MW + pad - X0) / cell), gh = Math.ceil(((best.y1 + 1) * PH / MH + pad - Y0) / cell);
    const inside = new Uint8Array(gw * gh), outside = new Uint8Array(gw * gh);
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
      const mx = Math.floor((X0 + (gx + .5) * cell) * MW / PW), my = Math.floor((Y0 + (gy + .5) * cell) * MH / PH);
      const v = mx >= 0 && my >= 0 && mx < MW && my < MH && lab[my * MW + mx] === best.nl;
      inside[gy * gw + gx] = v ? 1 : 0; outside[gy * gw + gx] = v ? 0 : 1;
    }
    const Di = _edt(outside, gw, gh), Do = _edt(inside, gw, gh), d = new Float32Array(gw * gh);
    for (let i = 0; i < d.length; i++) d[i] = (inside[i] ? -(Math.sqrt(Di[i]) - .5) : Math.sqrt(Do[i]) - .5) * cell;
    out.set(f, { X0, Y0, cell, gw, gh, d });
  }
  return out;
}
function sdfSample(B, x, y) {     // bilinear, plate px; beyond the grid: the edge value + the distance to the grid
  let gx = (x - B.X0) / B.cell - .5, gy = (y - B.Y0) / B.cell - .5;
  const cx = gx < 0 ? 0 : gx > B.gw - 1.001 ? B.gw - 1.001 : gx, cy = gy < 0 ? 0 : gy > B.gh - 1.001 ? B.gh - 1.001 : gy;
  const xi = cx | 0, yi = cy | 0, fx = cx - xi, fy = cy - yi, i = yi * B.gw + xi, a = B.d;
  const v = (a[i] * (1 - fx) + a[i + 1] * fx) * (1 - fy) + (a[i + B.gw] * (1 - fx) + a[i + B.gw + 1] * fx) * fy;
  return v + Math.hypot(gx - cx, gy - cy) * B.cell;
}
// his body at plate frame position fp (1-based, fractional): blended between the bracketing mattes (the body moves through
// the in-betweens, so a substep sees it part way); blend = false: the matte the renderer shows for that frame (plateMatte)
function bodyAtFrame(S, fp, blend = true) {
  const ks = [...S.keys()].sort((a, b) => a - b); if (!ks.length) return () => 1e9;
  if (!blend) { let f = Math.round(fp); if (f % 2 === 0) f++; const k = ks.reduce((p, q) => Math.abs(q - f) < Math.abs(p - f) ? q : p); const B = S.get(k); return (x, y) => sdfSample(B, x, y); }
  let k0 = Math.floor((fp - 1) / 2) * 2 + 1, a = (fp - k0) / 2;
  const near = f => ks.reduce((p, q) => Math.abs(q - f) < Math.abs(p - f) ? q : p);
  const B0 = S.get(near(k0)), B1 = S.get(near(k0 + 2)); if (B0 === B1 || a <= 0) return (x, y) => sdfSample(B0, x, y);
  return (x, y) => (1 - a) * sdfSample(B0, x, y) + a * sdfSample(B1, x, y);
}
// clipping check (verification): per state, rope points (outside the exempt end) inside his silhouette (the displayed
// matte, d < -1 plate px), and how many of those are pass-throughs: inside a run of points within the silhouette, the
// drawn visibility changes from what it was where the run entered (the cable appears to go into / through his body).
// fieldAt(f) → (x, y) → d (sim units), hidden(f, i, P, sides) → whether point i is drawn hidden
// body: { T, m, taper } as collide: inBody counts inside points nearer z = 0 than half the slab's depth there (in his volume)
function ropeClipStats(rope, fieldAt, hidden, exemptB = 0, body = null) {
  const n = rope.n, inside = [], pass = []; let inBody = 0;
  rope.frames.forEach((P, f) => {
    const fld = fieldAt(f); let ins = 0, ps = 0, run = null;
    for (let i = 1; i < n - exemptB; i++) {
      const d = fld(P[i * 3], P[i * 3 + 1]);
      if (d < -1 && body) { const zr = body.T * Math.sqrt(Math.min(1, ((body.m ?? 2) - d) / ((body.m ?? 2) + (body.taper ?? body.T)))); if (Math.abs(P[i * 3 + 2]) < .5 * zr) inBody++; }
      if (d < -1) { ins++; const h = hidden(f, i, P, rope.sidesAll[f]); if (run === null) run = h; else if (h !== run) ps++; }
      else run = null;
    }
    inside.push(ins); pass.push(ps);
  });
  const sum = a => a.reduce((x, y) => x + y, 0);
  return { frames: inside.length, inside: sum(inside), inBody, lengthErrPct: +(rope.maxErr * 100).toFixed(3), pass: sum(pass), framesPass: pass.filter(x => x > 0).length, perFrame: pass };
}
