# Song notes: "Doing the math with a spinning sun"

> *Guidance failed and the capsule spun / Doing the math with a spinning sun*
> (Orbital_Sunrise_alt_Lyrics.md, build before the final chorus; the film's 2:24 shot, G2_math)

On 19 March 1965 Voskhod 2's automatic system would not bring the ship home. Pavel Belyayev
had to point the ship by hand and fire the retro-rocket himself, the first time a Soviet crew
had done this. Alexei Leonov held him in place at the sight, and he also worked out where they
would come down. This note rebuilds the arithmetic behind that hour. We mark every claim:

- **DOCUMENTED**: in a source, cited. [L05] = Leonov, *Air & Space*, Jan 2005; [RSW] =
  RussianSpaceWeb, "Voskhod-2 lands in the wild"; [W] = Wikipedia "Voskhod 2" / "Voskhod
  (spacecraft)" / "S5.4"; [Siddiqi] = *Challenge to Apollo*, NASA SP-2000-4408, as quoted in
  [W]. Full quotes and page numbers are in [RESEARCH_R4.md](RESEARCH_R4.md) §1 and
  [FACTCHECK.md](FACTCHECK.md) §3.
- **ESTIMATE**: our own calculation or reasoning. No flight log gives these figures, and the
  crew never said they thought this way.

Numbers computed in Python (μ = 398,600 km³/s², R = 6,378 km, g₀ = 9.807 m/s²).

## What the spacecraft gave them

| Item | What it was | Status |
|---|---|---|
| **Vzor** | A periscope sight in the floor porthole. It had a central field with lines, and eight ports in a ring around it. You set yaw by turning the ship until the landscape "flowed" along the lines. You set pitch and roll by levelling the ship until the horizon showed evenly in the ring. Daylight only. | DOCUMENTED (Astronautix, Vostok; via search snippets, the page is blocked) |
| Couches | Turned 90° to the Vzor. Belyayev "had to lean horizontally across both seats … while I held him steady in front of the orientation porthole" | DOCUMENTED [L05] p. 4, [RSW] p. 3 |
| Attitude control | Hand controller firing cold-gas nitrogen jets | DOCUMENTED (Vostok heritage) |
| **TDU-1** retro (S5.4) | 15.83 kN, Isp 266 s, about 250 kg of propellant, burn about 45 s. Wikipedia's table lists Δv 155 m/s | DOCUMENTED [W] |
| Backup retro | A solid-fuel rocket on top of the descent sphere, for use if the TDU failed | DOCUMENTED [W] |
| Orbit | 167 × 475 km, inclination 64.8°, 90.9 min | DOCUMENTED [W] |
| Mass | 5,682 kg at launch, less the airlock jettisoned after the spacewalk (we found no firm figure for the airlock) | DOCUMENTED / gap |
| Globus | A small turning globe on the panel that shows the ground point under the ship | DOCUMENTED [W] |

**Why the automatic system failed.** [RSW] blames "a problem with the sun-based orientation
system". Secondary sources say the solar sensor was probably fouled by pyrotechnic gas when
the airlock was jettisoned (Grahn, via a search snippet; the page itself is blocked). Leonov
noticed it "just five minutes before" the planned burn on revolution 17 ([L05] p. 3; [RSW]
p. 2). Without the Sun sensor the ship could not find "backwards" on its own.

## The problem, step by step

### 1. How much time do we have? (orbital period)

T = 2π √(a³/μ), with a = R + (167 + 475)/2 = 6,699 km, which gives **T = 90.9 min**. This
matches the published figure. Missing the burn on revolution 17 meant waiting one more lap.
That was the only retry they had: Belyayev told the ground "We can make only one attempt at
reentry" ([L05] p. 3, DOCUMENTED).

### 2. How fast are we going? (vis-viva)

v = √(μ(2/r − 1/a)): **7.89 km/s at perigee and 7.54 km/s at apogee** (e = 0.023). The point
on the ground below the ship moves at v·R/r, which is **7.0 to 7.7 km/s** depending on height.

### 3. How big a kick? (F·t = m·Δv and the rocket equation)

The simple impulse estimate, F·t = m·Δv:

- 15,830 N × 45 s = 712,000 N·s. Divided by 5,682 kg, that gives **Δv ≈ 125 m/s**.

The rocket equation, Δv = Isp·g₀·ln(m₀/m₁), with propellant flow F/(Isp·g₀) = 6.07 kg/s:

- A 45 s burn uses 273 kg, so Δv = 2,609 × ln(5,682/5,409) = **128 m/s**.
- The 250 kg load lasts only 41 s at full thrust. That gives **117 m/s** at 5,682 kg, or
  **123 m/s** if the airlock took 250 kg off the mass.
- The often-quoted **155 m/s** comes out exactly for a ship of **4,725 kg (Vostok's mass)**.
  It appears to be a Vostok figure carried over to Voskhod.

**ESTIMATE:** Voskhod 2's real retro Δv was probably about **120–135 m/s**. Δv is only about
1.7% of orbital speed, but that is enough. The burn leaves a vacuum perigee well below the
ground. For a horizontal burn at 300 km, the post-burn perigee is −172 km with 155 m/s and
−93 km with 130 m/s. Either way the ship hits the atmosphere.

### 4. Pointing it: the Vzor geometry

- **Pitch and roll:** from height h, the horizon lies arcsin(R/r) from straight down. That
  is **77° at 167 km, 73° at 300 km and 68.5° at 475 km**. (ESTIMATE:) the ring ports must look out at about
  that angle. The ship points straight down when the horizon fills all eight ports evenly.
  If one side brightens first, the ship is tilted toward it.
- **Yaw:** at 300 km the ground sweeps across the view at v_ground/h ≈ **1.4°/s**. When
  features slide along the lines instead of across them, the ship is aligned with its track.
- **A subtle trap (ESTIMATE):** the ground moves relative to the ship's *inertial* velocity,
  but Earth turns underneath, so the "running" direction is skewed. The skew is
  atan(465 m/s · cos φ · cos(az) / v_ground). For this orbit it comes to **3.3° at the
  equator, 2.8° at 30° and 1.8° at 50°**. With 155 m/s, a 3° yaw offset puts about **9 m/s
  sideways**, which moves the landing cross-range but barely changes the braking. A 1° pitch
  error costs only 0.02 m/s of braking. Nobody knows whether the crew corrected for it.

### 5. When to fire: downrange per second (ESTIMATE)

A burn made Δt late happens Δt × v_ground further along the track, and the whole re-entry
shifts with it:

- **≈ 7.0–7.7 km per second of delay**, or about 7.4 km/s at 300 km.
- 46 s × 7.4 km/s ≈ **340 km** (323–354 km across the orbit's height range).

That is close to the **368/386 km** that flight-data accounts give for the miss ([W],
spacefacts, Siddiqi). The planned manual
ignition was 11:35:44 MSK ([RSW] p. 2) and [W] gives the actual ignition as 11:36:27, so
those two figures put the ignition **43 s late**.

### 6. Where the next lap lands: Earth's rotation (ESTIMATE)

In one period Earth turns 360° × 90.9 / 1,436.1 = 22.8°. Nodal drift from Earth's flattening
(J₂) adds 0.23°, so the track moves **23.0° west** per lap. In kilometres:

- **2,563 km** at the equator, **1,535 km at 53°N** (the original landing zone near
  Kustanay) and **1,298 km at 59.6°N** (the actual landing site).

Leonov wrote that they knew they would come down "1,500 kilometers west of where we were
supposed to land" ([L05] p. 3, DOCUMENTED). That matches **one lap's westward shift at the
latitude of the planned zone**. We think the forecast is exactly this arithmetic (ESTIMATE).
It was a forecast of the new track, not a miss. Earth's rotation during the 46 s delay itself
adds only about 11–13 km.

### 7. What we think went through their heads (ESTIMATE)

1. *Auto is out.* One lap until the next chance, and fuel for one try.
2. *Daylight.* The Vzor works only over the sunlit Earth, so the orientation had to be done
   before the burn point, on the day side.
3. *Level, then yaw.* Belyayev first evens the horizon in the ring, then turns the ship until
   the ground runs along the lines, then turns 180° so the engine faces forward.
4. *Where do we land?* Leonov, "as navigator", chooses "an area close to the city of Perm"
   ([L05] p. 4, DOCUMENTED). That is on the new, westward-shifted track and over Soviet land.
5. *Fire on the second.* Each second late costs about 7 km. But Belyayev also has to get back
   into position, and Leonov says they had to move "very rapidly so that the spacecraft's
   center of gravity was correct" ([L05] p. 4). Their bodies were ballast.

## What actually happened

- **The delay.** Wikipedia, citing Siddiqi, says it took Belyayev **46 s** to return to his seat
  before firing. That number is in **neither** [L05] nor [RSW]. [RSW] says instead that "both
  cosmonauts were apparently out of their seats" when he pressed ignition. That would shift
  the centre of gravity and give an "off-line" attitude, "a shallower than predicted
  trajectory". **Uncertain.**
- **The burn** "apparently lasted as scheduled" ([RSW] p. 3).
- **The spin.** The descent sphere was meant to separate from the instrument module 10 s
  after the burn. A cable kept them joined, and the stack whirled around it until about
  100 km up. Leonov: "my instruments indicated 10 Gs" ([L05] p. 4). [RSW] says separation came
  on a backup command from thermal sensors. So the lyric's "spinning sun" came *after* the math.
- **The landing.** At 12:02–12:06 MSK (sources differ by 4 min) they came down in deep snow in
  the Perm taiga, "180 kilometers north of the city of Perm", 25–30 km SW of Berezniki
  ([RSW] p. 4). Our great-circle check of 59°34′N 55°28′E gives 179 km from Perm and
  1,605 km from Baikonur.

**Why the overshoot figures differ.** Each figure is measured from a different point:

| Figure | Measured from | Source |
|---|---|---|
| 368 / 386 km | The aim point on revolution 18; fits a ~46 s late burn (step 5) | [W], spacefacts |
| > 800 km | The "planned landing area", probably the original zone | [RSW] p. 3 |
| ~865 km | Our check: Kustanay to the landing site | ESTIMATE |
| 1,500 km | Crew's forecast *before* the burn: one lap's westward shift (step 6) | [L05] p. 3 |
| 2,000 km | "Our orientation system indicated" (probably the Globus, wrong) | [L05] p. 4 |

## How this appears in the film

G2_math (2:24, the `eq` list in `video/src/shots2.js`) draws this ring of equations:
`Δv ≈ 155 m/s · t ≈ 45 s · T = 90.9 min · ОРИЕНТАЦИЯ — РУЧНАЯ · h = 167–475 km · F ≈ 16 kN`.

| On screen | This doc | Verdict |
|---|---|---|
| T = 90.9 min | 90.9 min | ✅ |
| h = 167–475 km | 167 × 475 km | ✅ |
| F ≈ 16 kN | 15.83 kN | ✅ |
| t ≈ 45 s | 45 s (41 s if 250 kg at full thrust) | ✅ |
| ОРИЕНТАЦИЯ — РУЧНАЯ | Manual orientation | ✅ |
| **Δv ≈ 155 m/s** | 16 kN × 45 s on 5.4–5.7 t gives **≈ 125–135 m/s**; 155 fits the 4.7 t Vostok | ⚠️ **mismatch** |

The newer `VZC_EQ` ring (work in progress in `shots2.js`) checks out against this doc: T = 5457 s ≈ 90.9 min, vₚ ≈ 7.89 / vₐ ≈ 7.54 km/s, e ≈ 0.023, ρ ≈ 77°, 22.8° per lap, 1 s late → 7.7 km (the perigee value; 7.0–7.7 across the orbit), 155/45 ≈ 3.4 m/s². "T ≈ 88 min" and "155 / 45 = 3.9" are deliberate crossed-out wrong tries. Its only disagreement is the same **Δv ≈ 155 m/s**, and putting it beside `Δv = F·t / m` with F ≈ 16 kN and t ≈ 45 s invites anyone who works it through to get ≈ 127 m/s.

Suggestions for the shot (these do not change the music):
- Change `Δv ≈ 155 m/s` to `Δv ≈ 130 m/s`, or keep 155 and drop `F ≈ 16 kN`/`t ≈ 45 s` so
  the ring no longer contradicts itself.
- Optionally add `Δx ≈ 7.4 km/s × Δt` (downrange per second late) or `ΔL = 23° / lap`, the two
  equations that actually decided where they landed.

## Sources and gaps

- Read in full (the songwriter's private PDFs, not committed): [L05], [RSW]; see
  [RESEARCH_R4.md](RESEARCH_R4.md).
- Seen only as search excerpts, because the egress proxy blocked these pages: Wikipedia
  ("Voskhod 2", "Voskhod (spacecraft)", "S5.4"), Astronautix (Vostok, Voskhod 2), Sven Grahn
  "The Voskhod 2 mission revisited" (and its NASA mirror), Drew Ex Machina, braeunig.us.
- Not seen: the 2020 Roscosmos document release and Siddiqi's own text. The 46 s and 386 km
  figures come to us only second-hand.
