# The math behind "fifteen hundred klicks"

*A companion page for viewers of* Orbital Sunrise. *The detailed working notes, with every
equation, are in [SONG_NOTES_THE_MATH.md](SONG_NOTES_THE_MATH.md).*

## 1. Why this page exists

Near the end of the song there is a line: *"Fifteen hundred klicks, coming in hot … we
overshot."* A "klick" is soldier's slang for a kilometre. So the song says Voskhod 2 came
down about 1,500 km from where it should have.

We wanted to know whether that holds up. Where does the number come from? How far off did
Alexei Leonov and Pavel Belyayev actually land in March 1965? And how much of the miss came
from two men doing by hand what a machine was supposed to do?

The answer is better than "right" or "wrong". The 1,500 km is Leonov's own number. But it
measures something different from where the capsule finally came down.

## 2. How we sourced the figures

Every number below carries one of three labels:

- **Documented**: it is in a source we can point to.
- **Estimate**: our own calculation from documented inputs. Nobody in 1965 wrote it down.
- **Our inference**: a reading of the sources that seems the most likely to us, but that
  no source states outright.

**What kinds of sources.** We used four kinds:

- *Spacecraft data*: engine thrust, orbit, capsule size and weight, mostly from Wikipedia
  pages that cite the standard NASA history (Asif Siddiqi, *Challenge to Apollo*, NASA
  SP-2000-4408).
- *Mission accounts*: Anatoly Zak's RussianSpaceWeb history of the landing, read in full.
- *Memoir*: Leonov's own article "The Nightmare of Voskhod 2" (*Air & Space*, January 2005),
  adapted from his book *Two Sides of the Moon*, also read in full.
- *Reanalysis weather*: ERA5, a modern computer reconstruction of past weather, for the
  landing spot and day.

**When sources disagree.** The rule is to be accurate. Where honest accounts genuinely
differ (Leonov's memory against the official record, say), the film may keep the more
dramatic version, and the notes say so. Anything no source supports gets fixed.

**The main sources**

| Source | What we used it for |
|---|---|
| Leonov, ["The Nightmare of Voskhod 2"](https://www.smithsonianmag.com/air-space-magazine/the-nightmare-of-voskhod-2-8655378/), *Air & Space*, 2005 | The crew's view: the failure, the 1,500 km forecast, the cabin |
| Zak, ["Voskhod-2 lands in the wild"](https://www.russianspaceweb.com/voskhod2-landing.html), RussianSpaceWeb | Burn times, the "800+ km" overflight, the landing site |
| Wikipedia, ["Voskhod 2"](https://en.wikipedia.org/wiki/Voskhod_2) and ["Voskhod (spacecraft)"](https://en.wikipedia.org/wiki/Voskhod_(spacecraft)) | Orbit, engine, capsule, parachutes, the 46 s and 386 km (citing Siddiqi) |
| [Russian Wikipedia, "Восход-2"](https://ru.wikipedia.org/wiki/%D0%92%D0%BE%D1%81%D1%85%D0%BE%D0%B4-2) | Planned landing zone, −19 °C and 1.5–2 m of snow |
| [Spacefacts](http://www.spacefacts.de/mission/english/voskhod-2.htm), [Sven Grahn](http://www.svengrahn.pp.se/histind/Voskhod2/Voskhod2.htm), [Astronautix](http://www.astronautix.com/v/voskhod2.html) | Cross-checks; the cause of the sensor failure |
| ERA5 (Copernicus) via the [Open-Meteo archive](https://archive-api.open-meteo.com/v1/archive?latitude=59.6&longitude=55.5&start_date=1965-03-18&end_date=1965-03-20&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m,wind_speed_100m,wind_direction_100m,cloud_cover,snow_depth&wind_speed_unit=ms&timezone=Europe%2FMoscow) | Wind, temperature and snow at the landing site; saved as [data/era5_landing_1965-03-18_20.json](data/era5_landing_1965-03-18_20.json) |

Some of these pages we could only see as search excerpts; the notes say which.

## 3. Inside the capsule: what they knew and what they had to work out

**The failure.** On 19 March 1965, the day after the spacewalk, the ship was due to point
itself backwards and fire its braking rocket on its own. Leonov noticed "just five minutes
before" that the automatic system wasn't working (documented). The likely cause was the
Sun sensor the ship used to find its orientation; one account says gas from the explosive
bolts that dropped the airlock had fogged it (documented as a secondary account). Without
it, the ship could not tell which way was "backwards".

**The new plan.** They would land by hand, one orbit later. Belyayev told the ground: "We
can make only one attempt at reentry" (documented). One orbit took 90.9 minutes.

**Pointing the ship by eye.** The tool was the *Vzor*, a periscope sight looking down
through a porthole in the floor. It had a ring of small windows round a central view.
Belyayev would level the ship until the horizon showed evenly in all the ring windows, then
turn it until the ground below "flowed" along the guide lines. Then the ship was lined up
with its path. It only worked over the daylit side of the Earth.

**The awkward cabin.** Voskhod was a Vostok capsule rebuilt for more crew, and the seats sat
crosswise to the sight. In Leonov's words, Belyayev "had to lean horizontally across both
seats in the spacecraft, while I held him steady in front of the orientation porthole."
Then: "We then had to maneuver ourselves back into the correct positions in our seats very
rapidly so that the spacecraft's center of gravity was correct during the reentry burn"
(documented). Their bodies were part of the ship's balance.

**What they could not know.** No satellite navigation, no live position fix. They had a
clock, the known orbit, a small turning globe on the panel (the *Globus*) and the ground's
instructions. Leonov, "as navigator", picked the landing area: "an area close to the city of
Perm" (documented).

**Where "1,500 km" comes from.** Leonov wrote that they knew they "would be coming down
off-target—1,500 kilometers west of where we were supposed to land" (documented). That was
said *before* the burn. Here is a back-of-envelope way a cosmonaut could get that number.
This is **our reconstruction**, not something the crew wrote down.

A spacecraft's path doesn't change much from one lap to the next, but the Earth turns
underneath it. So each lap crosses the ground further west.

| Step | Arithmetic | Result |
|---|---|---|
| Earth turns once in about 1,436 minutes | 360° ÷ 1,436 min | 0.25° per minute |
| One lap takes 90.9 minutes | 0.25° × 90.9 | about 22.8° |
| A small extra drift from Earth's bulge (estimate) | 22.8° + 0.2° | **about 23° west per lap** |
| One degree of longitude at 53°N (the planned zone, near Kustanay in Kazakhstan) | 111 km × cos 53° | about 67 km |
| Shift in one lap at that latitude | 23 × 67 km | **about 1,540 km** |

That is "1,500 kilometres west", near enough (the detailed notes, with more decimals, get
1,535 km). Notice what it measures: not a miss, but how far the *whole path* moved by
waiting one lap.

## 4. Working backwards: what we know now

With hindsight we can do what the crew couldn't: start from where they landed and ask what
happened.

**Where they landed (documented).** In deep snow in the taiga, about 180 km north of Perm,
at roughly 59°34′N 55°28′E, around 12:02–12:06 Moscow time (sources differ by 4 minutes).

**How far off.** Flight-data accounts give **368 or 386 km** beyond the aim point on the new
orbit (documented). RussianSpaceWeb gives "more than 800 km" past the *planned* landing
area, probably the original zone in Kazakhstan; Kustanay to the landing site is about 865 km
by our check (estimate).

**The late burn.** The manual firing was planned for 11:35:44 Moscow time; Wikipedia gives
11:36:27 as the actual time. That is **43 seconds late**. The often-quoted figure is **46
seconds** for Belyayev to get back to his seat (from Siddiqi via Wikipedia; it is in
neither of the two full texts we read).

How much does a late burn cost? A burn made late simply happens further along the path, and
the whole descent slides forward with it. The point on the ground under the ship moves at
about **7.4 km every second** (a bit slower than the ship's own 7.5–7.9 km/s, because the
ship is a few hundred km up). So:

> 46 s × 7.4 km/s ≈ **340 km**

That covers most of the 368–386 km (estimate).

**How sensitive is the landing?** We ran a simple model of a falling ball through a standard
atmosphere. It gives sizes, not answers (estimate). The key finding: Voskhod comes in very
shallow, only about 1.5–2.5° below horizontal at 100 km, and a shallow entry stretches small errors
into big ones.

| What goes wrong at the burn | How far the landing moves |
|---|---|
| Burn 1 s late | about 7.4 km further on |
| Burn gives 1 m/s too little push | 40 to 95 km further on |
| Thrust tilted 1° up or down | 50 to 80 km either way |
| Thrust tilted 3–5° nose-up | 150 to 450 km further on |
| Thrust turned 3° sideways | tens of km to the side |
| Upper air 20% thinner or thicker | 30 to 70 km |
| Parachute drift in the wind | 2 to 6 km |

RussianSpaceWeb says both men were "apparently out of their seats" when Belyayev pressed the
ignition button, so the ship's balance was off and it flew a shallower path than planned
(documented). A few degrees of tilt would be enough to stretch a 340 km miss toward 800 km.
How many degrees it really was, we can't say.

**The spin came later.** After the burn a cable kept the cabin joined to the equipment
section, and the pair whirled until about 100 km up (documented). The air up there is too
thin for the tumble to change the path much (estimate). It cost blood vessels, not
kilometres.

**The weather (from ERA5, our retrieval).** At noon on 19 March, at the nearest grid point:

| Item | ERA5 value |
|---|---|
| Wind at 10 m | 4.0 m/s from the south-west (gusts 9.5 m/s) |
| Wind at 100 m | 6.1 m/s from the south-west |
| Temperature | −1.1 °C, falling to about −4 °C by dawn on the 20th |
| Cloud | Overcast all day |
| Snow depth | 0.66 m (average over a ~30 km grid cell) |

Russian Wikipedia says −19 °C and 1.5–2 m of snow; Leonov wrote of "two meters of thick
snow". ERA5 for 1965 has few Ural weather stations to anchor it and averages over a wide
area, and drifts in forest clearings run far deeper than the average. We don't pick a side:
the film keeps the deep snow and the cold, and the notes say what the data says.

**Parachutes and drift.** One Wikipedia page puts the start of the parachute sequence at
about 5 km up; another puts the main parachute at about 2.5 km. We read these as two stages,
a small braking chute (a "drogue") first and then the main canopy, rather than a
contradiction (our inference; we have no primary source for the timing). The film's card
now reads **MAIN PARACHUTE — OPEN · ALTITUDE ~2.5 KM**.

The drift, step by step (estimate, with assumed winds aloft of 7–15 m/s):

- Drogue, 5 km down to 2.5 km at 30–50 m/s: 2,500 ÷ 50 = 50 s to 2,500 ÷ 30 ≈ 85 s.
- Main, 2.5 km to the ground at 8–10 m/s: 2,500 ÷ 10 = 250 s to 2,500 ÷ 8 ≈ 310 s.
- Total 300–395 s. Then 7 m/s × 300 s ≈ 2.1 km, and 15 m/s × 395 s ≈ 5.9 km.

So the wind carried them **about 2–6 km to the north-east**. The wind chose the clearing,
not the district.

**Their knowledge against ours.**

| | In the capsule, 1965 | With hindsight |
|---|---|---|
| Where they'd land | "1,500 km west" of the old zone; "near Perm" | 180 km N of Perm, ~368–386 km past the new aim |
| Why | One extra lap, Earth turning underneath | Plus a ~43–46 s late burn and an off-balance ship |
| Weather | Unknown | Light SW wind, overcast, around freezing (ERA5) |
| Where they actually were | The instruments said 2,000 km beyond Perm | They weren't |

## 5. The human hand: timing by squeeze and button

**What was done by hand (documented).** Pointing the ship (Belyayev, with the hand controller
and the Vzor), choosing the landing area (Leonov), and starting the engine: RussianSpaceWeb
says Belyayev "pressed the ignition button". Leonov wrote that they had to "decide on the
exact timing and duration of the retro-rocket firing".

**What is unclear.** Our sources do not say how the burn was *stopped*: whether the ship's
own system cut the engine once it had given enough push, or whether a crewman did.
RussianSpaceWeb says only that the burn "apparently lasted as scheduled". So below we show
both cases.

**Reaction time (general estimate, not from the Voskhod sources).** A rested person
pressing a button on a cue takes about 0.2–0.3 s; more under stress, in thick gloves and a
pressurised suit (they landed in their Berkut suits). Call it 0.2 to 1 second.

**Starting late or early.** Each second costs about 7.4 km along the path:

| Timing error at ignition | Landing shift |
|---|---|
| 0.2 s | about 1.5 km |
| 0.3 s | about 2.2 km |
| 1 s | about 7.4 km |
| 5 s | about 37 km |
| 43–46 s (the actual delay) | about 320–340 km |

You might expect re-entry to magnify a timing error. In our model it doesn't: a late burn
just slides the whole descent forward at ground-track speed. The magnifying happens with
the *size* and *direction* of the push, below.

**Stopping late or early (only if a person stopped it; estimate).** The engine's 15.8 kN
thrust on a 5.7-tonne ship gives about 15,830 ÷ 5,682 ≈ 2.8 m/s of speed change per
second. Each 1 m/s too little moves the landing 40–95 km. So:

| Cut-off error | Push missing | Landing shift |
|---|---|---|
| 0.2 s | about 0.6 m/s | about 20–50 km |
| 0.3 s | about 0.8 m/s | about 35–80 km |
| 0.5 s | about 1.4 m/s | about 55–130 km |

If the ship cut its own engine, these errors mostly disappear.

**Holding the ship straight by hand (estimate).** Pointing by eye through a periscope is
good to a degree or two, perhaps a few. Two separate effects:

- *Lost push* is tiny. If the thrust is 1° off, the backwards push is cos 1° = 99.98% of
  the total; on 130 m/s that is 0.02 m/s lost. Even at 5° it's under 0.5 m/s.
- *Push in the wrong direction* is what matters. At 1°, sin 1° × 130 m/s ≈ 2.3 m/s goes up
  or down instead of backwards. That changes how steeply the capsule meets the air, worth
  50–80 km per degree. At 3° sideways, about 7–8 m/s goes sideways, tens of km off to one
  side.

**The honest conclusion.** A good hand on the button costs a few km. Even a clumsy one,
a second or so, costs under 10 km. If a person also had to cut the engine, a few tenths of a
second there could cost tens of km. A few degrees of tilt could cost hundreds. But the big,
documented error is the **43–46 second delay** while two men in spacesuits untangled
themselves from the sight and got back into their seats. That, plus the ship flying
off-balance, is what turned a planned landing into a few hundred kilometres of taiga.

## 6. Learnings along the way

Things we got wrong first, and what fixing them changed.

- **The engine's push came from the wrong ship.** The film's first sourced equation ring
  said Δv ≈ 155 m/s, the figure on Wikipedia. Working it through with Voskhod's actual
  launch weight, 5,682 kg, gives 15,830 N × 45 s ÷ 5,682 kg ≈ 125 m/s (about 128 with the
  rocket equation). 155 m/s comes out exactly for 4,725 kg, which is Vostok's weight: it
  looks like a Vostok number carried over. The on-screen math now writes 155, crosses it
  out, and arrives at about 130 (an older version of the shot still shows 155). The landing
  story doesn't change.
- **Invented numbers on screen.** The first version of that ring showed "Δv = 106 m/s ·
  t = 22 s · h = 497 km · ±1°", matching neither engine nor orbit. Replaced with sourced
  figures.
- **"Altitude ~500 km" was the high point.** An orbit caption said ALTITUDE ~500 KM. The
  orbit actually ran from 167 to 475 km. The card now says APOGEE (the highest point) ~500
  KM, a rounded popular figure.
- **Orbital speed vs ground speed.** An early check multiplied 46 s by 7.8 km/s and got
  about 360 km. The point on the ground moves slower than the ship, about 7.4 km/s, which
  gives about 340 km. Same conclusion, better number.
- **The 46 seconds.** We first took "46 s to get back to his seat" as solid. Reading both
  full texts, it is in neither; RussianSpaceWeb even says both men were still out of their
  seats at ignition. The clock times give 43 s. We now mark 46 s as second-hand.
- **The weather was blocked, then found.** At first the internet proxy blocked the ERA5
  weather archive, and the notes said "no wind record". The songwriter later fetched it.
  The wind turned out to be light and steady, worth a few km of drift.
- **One parachute or two?** We first assumed the main chute opened at 5 km, giving 3.5–9.5
  km of drift. The two Wikipedia figures (5 km and 2.5 km) fit a drogue-then-main sequence
  better. Drift dropped to 2–6 km, and the screen card changed from 5 KM to ~2.5 KM.
- **The Russian caption.** The failure card first read ОТКАЗ АВТОМАТИКИ ("automatics
  failure"). A native speaker preferred ОТКАЗ СИСТЕМЫ УПРАВЛЕНИЯ ("control system failure"),
  and the film changed it.
- **"1,500 km" is a forecast, not a miss.** We first read Leonov's figure as an exaggerated
  overshoot. In the full text it is his prediction *before* the burn, and it matches one
  lap's westward shift almost exactly.

## 7. Where the song's number lands

The capsule came down a few hundred kilometres past its new aim: 368–386 km by the flight
data, more than 800 km from the original zone by another count. Not 1,500.

But 1,500 km is not made up. It is the number Leonov wrote down for the moment the
automatics failed: the two of them, five minutes before the planned burn, realising they
would have to wait a lap and come down far to the west. It is the math they did in their
heads, and it is very nearly right for what it measured.

The song is about that hour, so it keeps Leonov's number. This page is for anyone who
wants the rest of the arithmetic.
