# Style bible — "Leonov's Pencils"

Everything on screen is drawn by `video/src` in colored pencil. Generated video plates
(Seedance 2.5) are *reference only*: the renderer reads their light, shape and motion and
redraws them; the plates themselves never appear.

## 1. Paper

| Paper | Hex | Used for | Tooth |
|---|---|---|---|
| **Night** (black paper) | `#0d0c10` → `#16141b` vignette | space, capsule, airlock, re-entry | fine cold fibres, visible only where strokes cross them |
| **Snow** (white paper) | `#f3efe6` → `#e6dfd2` vignette | Earth, the taiga, the singer's world | warm cotton grain, visible everywhere |

Rules: never a flat digital black or white. The tooth texture modulates every stroke
(pencil only deposits on the peaks of the grain). The tooth never moves: it is one sheet
of paper, and only the strokes on it boil.

## 2. The pencil box (the only colors allowed)

| Name | Hex | Role |
|---|---|---|
| white | `#f4efe6` | light on black paper; suits, stars, contours |
| silver | `#a9b0bd` | half-tones on black paper |
| sky | `#7fb3ff` | atmosphere, Earth's limb, reflections |
| cobalt | `#3d63dd` | Earth, shadows of the white suit |
| ultramarine | `#26318f` | deepest shadow tone on black paper |
| gold | `#ffc53d` | sun core, "burning gold" |
| orange | `#ff7a1a` | sunrise rays, rim light, fire |
| vermilion | `#ef3b24` | danger, panic scribble, CCCP, Cyrillic type |
| crimson | `#a8122a` | deep fire, the red sky |
| graphite | `#2b2a2e` | lines on white paper |
| lead | `#6e6c72` | hatching on white paper |

Orbital-sunrise band (Leonov's drawing, bottom → top): `crimson · vermilion · orange · gold · white · sky · cobalt · ultramarine` → black.

## 3. Strokes

* **Contour**: 1.2–2.6 px, tapering ends, 5–15 % overshoot, drawn twice with 0.6 px drift.
* **Hatch (tonal layers)**: long parallel pencil runs in four fixed directions, like an
  etching. Each layer switches on above a tone threshold (0.13 / 0.36 / 0.58 / 0.78), so a
  tone is built from one, two, three or four crossing layers. On black paper the layers
  draw the *light* with a steep curve (shadows stay bare paper) and 1.4× bolder strokes
  that still read on a phone; on white paper they draw the *dark* in graphite, with color
  only where the plate is genuinely colored. Faces get a finer set of layers.
* **Stroke cloud**: short strokes that follow the plate's structure-tensor flow; kept for
  glows (sun, atmosphere) where direction matters more than tone.
* **Radial rays**: the sun and impacts — strokes aimed away from a point, length ∝ energy.
* **Flames / scribble**: tapered tongues and looping strokes for fire and panic; only in
  vermilion/orange/crimson/gold.
* **Boil**: contours are redrawn every drawing with a little drift; the hatch layout is
  stable and each drawing only nudges it (±12 % of a line spacing), so the page shimmers
  instead of strobing. Drawing rate per section: threes (8/s) for awe, twos (12/s)
  default, ones (24/s) for panic and impacts.
* **Knockouts**: where big words sit, the drawing thins out in a soft rounded clearing,
  as if the artist left room for the lettering.

## 4. Type

| Role | Face | Treatment |
|---|---|---|
| Impact lyric (EN) | **Anton** | all caps, tight leading (0.86), cream `#f4efe6` on black / graphite on white; enters on the beat, one word per beat on hooks |
| Cyrillic echo | **Oswald 700** | vermilion, 30–40 % of the EN size, under or beside the EN line |
| Intimate lyric | **Instrument Serif Italic** | the singer's own lines, sentence case, subtitle-sized or huge |
| Telemetry | **JetBrains Mono** | mission clock, suit pressure, orbit count; small caps-like, tracked +4 % |
| Handwriting | single-stroke pencil (drawn, not typeset) | "Art is a landing in the snow", Leonov's signature |

Lyric sizing plan: **big** (≥ 18 % frame height) on hooks and the intro hook; **medium**
on the pre-chorus and build; **subtitle** (lower third, serif italic) in the breakdown
where the pictures carry the story.

## 5. Motion

* Cuts land on beats (bar = 4 beats ≈ 1.48 s at 162 BPM). Drops cut every 1–2 beats;
  verses every 2–4 bars.
* Camera moves come from the plates (Seedance physics); graphic layers add beat
  "punches" (2–4 % scale kick decaying over one beat) only in hooks and drops.
* Weightlessness: everything in orbit drifts; nothing snaps except on impacts.
* Transitions are *drawn*: an eraser wipe, a page turn, a scribble-out, a burn-through.

## 6. Composition

* Hook frames: subject on one third, type on the other two; the sun or the Earth's limb
  crosses behind the type.
* Close-ups of hands, visors and gauges tell the danger; wides tell the scale.
* Symmetry for iconic "point" frames (K-pop hero shots): the glove against the sun, the
  porthole, the capsule falling dead-centre.
