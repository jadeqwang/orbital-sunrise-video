// props.js: procedural pencil props (the Earth's limb, the orbital-sunrise bands, gauges, the Globus).

// Leonov's orbital-sunrise bands along a circular limb. cx, cy, R: the Earth's circle; a0..a1: arc span;
// k: 0..1 sunrise progress (band height and brightness), seed: drawing index.
const BANDS = ['crimson', 'verm', 'orange', 'gold', 'white', 'sky', 'cobalt', 'ultra'];
function sunriseBands(pen, cx, cy, R, a0, a1, k, seed, o = {}) {
  const thick = (o.thick ?? 46) * k, n = o.n ?? 900, sunA = o.sunA ?? (a0 + a1) / 2, spread = o.spread ?? .55;
  for (let i = 0; i < n; i++) {
    const h1 = hash2(i, seed), h2 = hash2(i, seed + 1), h3 = hash2(i, seed + 2);
    const a = lerp(a0, a1, h1);
    const near = Math.exp(-Math.pow((a - sunA) / spread, 2));     // brighter/thicker near the sun
    const band = Math.floor(h2 * BANDS.length);
    const r = R + (band / BANDS.length) * thick * (.6 + near * .9) + (h3 - .5) * 6 + (o.jseed !== undefined ? (hash2(i, o.jseed * 5 + 1) - .5) * (o.jit ?? 1.6) : 0);
    const len = (18 + 50 * near) * (.5 + h3);
    const da = len / r;
    const col = BANDS[band];
    if (near * k < .05 && band < 4) continue;
    const x0 = cx + Math.cos(a) * r, y0 = cy + Math.sin(a) * r, x1 = cx + Math.cos(a + da) * r, y1 = cy + Math.sin(a + da) * r;
    const xm = cx + Math.cos(a + da / 2) * (r + 1.5), ym = cy + Math.sin(a + da / 2) * (r + 1.5);
    pen.q(x0, y0, xm, ym, x1, y1, col, 1.5 + near * 1.4, clamp(.35 + near * .6) * clamp(k * 1.4));
  }
}

// Earth disc hatched in cobalt/ultramarine (night paper). Used when a plate is not driving the picture.
function earthDisc(pen, cx, cy, R, seed, o = {}) {
  const sp = o.spacing ?? 9, lit = o.lit ?? 0, litA = o.litA ?? -Math.PI / 2;
  const y0 = Math.max(0, cy - R), y1 = Math.min(H, cy + R), x0 = Math.max(0, cx - R), x1 = Math.min(W, cx + R);
  for (let y = y0; y < y1; y += sp) for (let x = x0; x < x1; x += sp) {
    const jx = o.jseed !== undefined ? (hash3(x | 0, y | 0, o.jseed * 3 + 7) - .5) * (o.jit ?? 1.4) : 0, jy = o.jseed !== undefined ? (hash3(x | 0, y | 0, o.jseed * 3 + 8) - .5) * (o.jit ?? 1.4) : 0;
    const X = x + (hash3(x | 0, y | 0, seed) - .5) * sp + jx, Y = y + (hash3(x | 0, y | 0, seed + 1) - .5) * sp + jy;
    const dx = X - cx, dy = Y - cy, d = Math.hypot(dx, dy) / R; if (d > 1) continue;
    const facing = Math.cos(Math.atan2(dy, dx) - litA) * .5 + .5;
    const l = clamp(lit * facing * (.4 + .6 * d) + (1 - d) * .15);
    const pr = .25 + l * .7; if (hash3(x | 0, y | 0, seed + 2) > pr) continue;
    const col = l > .7 ? 'sky' : l > .35 ? 'cobalt' : 'ultra';
    const a = Math.atan2(dy, dx) + Math.PI / 2 + (hash3(x | 0, y | 0, seed + 3) - .5) * .3;
    const L = 10 + 16 * hash3(x | 0, y | 0, seed + 4);
    pen.l(X - Math.cos(a) * L / 2, Y - Math.sin(a) * L / 2, X + Math.cos(a) * L / 2, Y + Math.sin(a) * L / 2, col, 1.5, .45 + l * .5);
  }
}
