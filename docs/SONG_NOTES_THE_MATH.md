# Song notes: "Doing the math with a spinning sun"

> Plain-language version for viewers: [THE_MATH.md](THE_MATH.md), "The math behind 'fifteen hundred klicks'".

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

## Forecast versus outcome: Leonov's 1,500 km

### What he was comparing

Leonov's own words, written about the moment he found the fault, "just five minutes before"
the automatic burn:

> "We knew our landing would have to be performed during our next orbit and that, despite
> our best efforts, we would be coming down off-target—1,500 kilometers west of where we were
> supposed to land." ([L05] p. 3, DOCUMENTED)

This is a **forecast made before the burn**, not a measurement of where they landed. The
sources do not agree on which revolution was planned:

- [RSW] and Russian Wikipedia say the automatic landing was planned "after 17 revolutions"
  near Kustanay, where the search forces were waiting, and that the manual burn came on the
  18th.
- English Wikipedia says 16 and 18. That is probably a different counting convention.

Either way, the burn slipped by **one lap**.

**Our reconstruction (ESTIMATE).** A retro-burn always drops the ship at roughly the same
point *along its own ground track*. Leonov's question was therefore where the next lap's
track crosses the latitude of the old landing zone. The arithmetic is step 6: the track
moves 23.0° of longitude per lap, which is **1,535 km at Kustanay's 53°N**. A navigator with
a Globus and a feel for "about 23° a lap" gets "1,500 km west" in his head.

```
         one lap later the whole track has slid ~23° west
   rev 18 track  /              / rev 17 track (planned)
                /              /
   Perm ● ----/ (landed ~180 km N of Perm, on this track)
              /              /
             /              ●  Kustanay zone, 53°N (search forces here)
            /<-- 1,535 km ->/
           /              /
     burn point        burn point
   (over Africa)      (over Africa)
```

### Why the actual miss was smaller

**1,500 km describes the new track, not a miss on it.** Once they were on revolution 18,
the crew and the ground chose a new aim point on that track. Leonov says it was "an area
close to the city of Perm" ([L05] p. 4). Russian Wikipedia says the crew chose taiga "150 km
west of Solikamsk", away from factories and power lines, and landed "about 70 km west of
Solikamsk". We could not verify those two figures.

The miss is measured against that new aim:

| Distance | Meaning |
|---|---|
| 1,500 km | Lap-to-lap shift of the track (forecast before the burn) |
| 368 / 386 km | Landing relative to the rev-18 aim. A 46 s late burn × 7.4 km/s ≈ 340 km |
| ~77 km | Landing relative to "150 km W of Solikamsk", *if* that aim is right. Our split: about 60 km downrange, 50 km crossrange (ESTIMATE) |
| > 800 km | [RSW]'s "planned landing area", which is unclear: possibly the original zone |

The 77 km and 386 km figures cannot both be measured from the same aim point. The table
shows how far apart the published "misses" are, not which one is right.

## From the math to the snow: what else moves the landing point

All of the following are **ESTIMATES** from a simple model: a 2-D point-mass ballistic
descent with a standard atmosphere and no lift. We used Voskhod's 2.3 m, 2,900 kg descent
sphere ([W]) with a drag coefficient of about 0.9, which gives **β = m/(C_D·A) ≈ 760 kg/m²**.
The burn was treated as instantaneous, at 250 or 350 km. The model is not a reconstruction
of the real trajectory: the burn point, the aim point and the exact Δv are not public. It
gives sizes, not answers.

**The model's sanity check:**
- Burn to touchdown: 25–29 min and about 10,000–12,000 km of ground track.
- Entry angle at 100 km: only 1.3°–2.5° below horizontal.
- Peak deceleration: **8.7–10 g**, with no spin at all. Leonov's "10 Gs" is about what a
  ballistic sphere pulls on its own.

The shallow entry is the key. A shallow entry stretches the trajectory, so small errors at
the burn grow by the time the capsule lands.

| Error at or after the burn | Shift in landing point |
|---|---|
| Burn 1 s late | ≈ 7.4 km downrange (step 5); **46 s ≈ 340 km** |
| Δv 1 m/s short (e.g. a short or weak burn) | +40 to +95 km |
| Thrust pitched 1° off retrograde | ±50 to ±80 km |
| Thrust pitched 3–5° "nose-up" | +150 to +450 km, plus a shallower trajectory, as [RSW] describes |
| Thrust yawed 3° (the Vzor "crab", step 4) | ~9 m/s sideways: tens of km crossrange |
| Upper-air density ±20% (March, 60°N) | ∓30 to ∓70 km |
| Modules joined down to ~100 km | < 1 km (the air above 100 km is too thin to matter) |
| Parachute drift (drogue 5→2.5 km at 30–50 m/s, main 2.5 km→ground at 8–10 m/s, mean wind 7–15 m/s from the SW) | **~2–6 km**, toward the NE (≤ ~9.5 km if the main opened at 5 km) |
| Earth turning during the 46 s delay | ~11 km (already in step 6) |

**Reading the table:**

- **Timing** alone explains about 340 of the 368–386 km.
- **Attitude** is the next-biggest unknown. [RSW] blames an "off-line" attitude caused by
  the crew being out of their seats. A few degrees is enough to push the miss from about
  340 km toward 800 km. We cannot say how many degrees it was.
- **The spin** after the burn is frightening but did little to the path. The air above
  100 km is too thin for the extra mass and shape to matter, and the tumble averages out.
  Its cost was in g and in blood vessels, not in kilometres.
- **Weather** comes last. ERA5 reanalysis for the nearest grid point (59.65°N 55.53°E,
  196 m) shows the hour of landing, 12:00 MSK on 19 March: 10 m wind **4.0 m/s from 225°**
  (SW, blowing toward the NE), gusts 9.5 m/s; 100 m wind 6.1 m/s from 226°; **−1.1 °C**;
  100% cloud; snow depth **0.66 m** (grid mean). All of the 19th was the same steady SW
  flow: 10 m wind 2.8–4.6 m/s, 100 m wind 4.7–7.7 m/s, overcast throughout. It cooled to
  −3.6 °C by midnight and −4.4 °C by dawn on the 20th, their night in the forest.
- **Two parachute altitudes.** Wikipedia's "Voskhod 2" page puts the start of the
  parachute sequence at ~5 km; "Voskhod (spacecraft)" puts the main chute at ~2.5 km. We
  read these as two stages of one sequence, not a contradiction: a drogue (braking) chute
  first, at ~5 km, then the main canopy at ~2.5 km. Soviet mains also usually opened reefed
  and then disreefed. A single canopy goes from command to fully open in seconds, a few
  hundred metres at most, so that alone cannot close a 2.5 km gap; staging can. ESTIMATE
  (our inference): we have seen no primary source for Voskhod 2's chute timing.
- **Drift.** ERA5 here gives only the two lowest levels, so the winds aloft are an
  assumption: wind usually grows with height, so take a column mean of **7–15 m/s** (a bit
  lower below 2.5 km, but we keep it simple). Drogue from 5 to 2.5 km at an assumed
  30–50 m/s: 50–85 s. Main from 2.5 km to the ground at 8–10 m/s: 250–310 s. Total
  300–395 s. 7 m/s × 300 s ≈ 2.1 km; 15 m/s × 395 s ≈ 5.9 km. So the wind moved the
  capsule **~2–6 km toward the NE**. The single-stage case (main open at 5 km, 500–625 s
  under canopy, ~3.5–9.5 km) is an upper bound. Either way it is a few km against a
  368–386 km overshoot. Wind decides which clearing, not which district; the overshoot
  was the late manual burn.
- **The data and the story disagree.** Russian Wikipedia gives −19 °C by day and 1.5–2 m
  of snow; ERA5 gives about −1 °C at landing and 0.66 m. Possible reasons: ERA5 for 1965
  is a model reconstruction with few Ural observations to pin it; one grid cell averages
  ~30 km and smooths the terrain; drifts in forest clearings and ravines run far deeper
  than the mean; −19 °C may be the nights, or memoir drift. We do not pick a side. The film
  keeps the deep snow and the cold; these notes say what the data says.
  Source: ERA5 (Hersbach et al. 2020, Copernicus C3S) via the Open-Meteo archive API,
  `https://archive-api.open-meteo.com/v1/archive?latitude=59.6&longitude=55.5&start_date=1965-03-18&end_date=1965-03-20&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,wind_speed_100m,wind_direction_100m,cloud_cover,snow_depth&wind_speed_unit=ms&timezone=Europe%2FMoscow`;
  saved as [`docs/data/era5_landing_1965-03-18_20.json`](data/era5_landing_1965-03-18_20.json).
  The listed hour is 12:00 MSK; touchdown was 12:02–12:06.
- **Earth's shape and rotation** are built into any landing-point calculation, so the
  planners would have included them. We did not model them.

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
- Also blocked: planetarium.perm.ru, rgantd.ru. (ERA5 via Open-Meteo was later fetched; see Weather above.) The descent sphere's 2.3 m / 2,900 kg / 8–10 m/s, the chute sequence starting at ~5 km ("Voskhod 2") and the main at ~2.5 km ("Voskhod (spacecraft)") and the "150 km W of Solikamsk" aim are from Wikipedia (en/ru) search excerpts.
- Not seen: the 2020 Roscosmos document release and Siddiqi's own text. The 46 s and 386 km
  figures come to us only second-hand.
