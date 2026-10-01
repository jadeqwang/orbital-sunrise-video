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
  const n = o.n ?? 48, L = o.L, seg = L / n, rnd = _rng(o.seed ?? 7);
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
  for (let i = 0; i <= n; i++) { const p = shape(lo, i); X.set(p, i * 3); }
  // a slow float: each point starts with a small smooth velocity (the slack drifts, coils open and turn)
  const fv = Array.from({ length: 3 }, () => [rnd() * 6.283, (rnd() - .5) * 2]);
  for (let i = 0; i <= n; i++) for (let k = 0; k < 3; k++) {
    const s = i / n, v = (o.drift ?? 6) * Math.sin(Math.PI * s) * Math.sin(fv[k][0] + 5 * s) * fv[k][1];
    Xp[i * 3 + k] = X[i * 3 + k] - v * dt;
  }
  // stiffness (Gemini 4's umbilical, her reference: big smooth loops, no kinks): no bend tighter than rMin, as a minimum
  // distance between every other point, plus the gentle smoothing in step()
  const rMin = o.rMin ?? 4 * seg, th = 2 * Math.asin(Math.min(1, seg / (2 * rMin))), dMin = 2 * seg * Math.cos(th / 2);
  const project = () => {   // restore every segment's length (ends pinned: infinite mass)
    for (let it = 0; it < iters; it++) {
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
    project();
  };
  const pre = o.pre ?? 1;
  for (let s = 0, N = Math.round(pre * 24 * sub); s < N; s++) step(o.t0);
  const out = [], N = Math.ceil((o.t1 - o.t0) * 24) + 1;
  let maxErr = 0;
  for (let f = 0; f < N; f++) {
    const t = o.t0 + f / 24;
    if (f > 0) for (let s = 1; s <= sub; s++) step(t - 1 / 24 + s * dt);
    out.push(Float32Array.from(X));
    let l = 0; for (let i = 0; i < n; i++) l += Math.hypot(X[i * 3 + 3] - X[i * 3], X[i * 3 + 4] - X[i * 3 + 1], X[i * 3 + 5] - X[i * 3 + 2]);
    maxErr = Math.max(maxErr, Math.abs(l - L) / L);
  }
  console.log(`rope ${o.name ?? ''}: ${N} states, length error max ${(maxErr * 100).toFixed(2)} %`);
  return { n, L, t0: o.t0, at: t => out[clamp(Math.round((t - o.t0) * 24), 0, out.length - 1)], frames: out, maxErr };
}

// Draw a cable in pencil. P: rope state (Float32Array xyz per point, plate px); toScreen(x, y) → [X, Y];
// o: { w (screen px), light [lx, ly] (screen direction the light comes from), hide(i, X, Y, z) → true where he covers it,
//      seed, cols { body, shade, hi }, rings (spacing in screen px, 0 = none), alpha }
function drawCable(pen, P, toScreen, o = {}) {
  const n = P.length / 3 - 1, rnd = _rng(o.seed ?? 1), w0 = o.w ?? 3;
  const pts = []; for (let i = 0; i <= n; i++) { const [X, Y] = toScreen(P[i * 3], P[i * 3 + 1]); pts.push([X, Y, P[i * 3 + 2]]); }
  // resample to ~3 px steps (Catmull-Rom through the rope points) so the strokes are smooth
  const S = [];
  for (let i = 0; i < n; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n, i + 2)];
    const k = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / 3));
    for (let j = 0; j < k; j++) { const s = j / k; S.push([0, 1, 2].map(c => .5 * (2 * p1[c] + (p2[c] - p0[c]) * s + (2 * p0[c] - 5 * p1[c] + 4 * p2[c] - p3[c]) * s * s + (3 * p1[c] - p0[c] - 3 * p2[c] + p3[c]) * s * s * s))); }
  }
  S.push(pts[n]);
  const [lx, ly] = o.light ?? [1, -.4], ll = Math.hypot(lx, ly), Lx = lx / ll, Ly = ly / ll;
  // visible runs (split where he covers the cable)
  const runs = []; let cur = [];
  S.forEach((p, i) => { const h = o.hide ? o.hide(i / (S.length - 1), p[0], p[1], p[2]) : false; if (h) { if (cur.length > 1) runs.push(cur); cur = []; } else cur.push(p); });
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
