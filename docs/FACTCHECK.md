# FACTCHECK: Voskhod 2 in *Orbital Sunrise* (2026-09-30)

I checked everything by web search. The egress proxy refused every page fetch (curl and WebFetch), so the facts below come
from search-result excerpts of the linked pages. §5 lists the pages worth opening by hand. Line numbers in
`video/src/shots.js` are from the working tree at 05:13 UTC, which had another session's uncommitted edits. If they have
moved, grep for the quoted string.

Legend: ✅ correct · ❌ wrong · ⚠️ contested or imprecise · ❓ unverified. All times are Moscow time (UTC+3 in 1965) unless marked UTC.

## Summary: what to fix, most important first

### Lyrics to re-record

1. ❌ **"Ninety minutes inside the airlock door"** (`Orbital_Sunrise_alt_Lyrics.md:13`, `Orbital_Sunrise_Lyrics.md:11`,
   `media/audio/Orbital_Sunrise_lyrics_timed.txt:23`). No flight record supports ninety minutes:
   - He was outside for **12 min 9 s** (11:34:51–11:47:00) and was **back in the airlock at 11:47:00**.
   - He shut the outer hatch about 1.5 min later.
   - The airlock **began repressurizing at 11:51:54**. That is about 5 min after he got back in, and **23 min 41 s**
     after the airlock was first depressurized.
   - His backpack carried only 30–45 min of oxygen.

   The phrase "ninety-minute wait within the airlock" appears on ClimateCultures' page about the sketch and in Wikipedia's
   "Orbital sunrise" article. It most likely blends two real facts: an orbit took 90.9 min, and he went out about
   90 minutes after lift-off. Replacement lines are in §2. The same words are typed on screen at `shots.js:735–736` and
   listed in `SHOTLIST.md:36`.
2. ⚠️ **"Fifteen hundred klicks coming in hot / … we overshot"** (`alt:39–40`, `released:37–38`, `timed:60–61`). This one
   is optional:
   - 1,500 km is Leonov's own figure, from the memoir excerpt in Air & Space (2005). Verified from the full text
     (RESEARCH_R4 §1 round 6, PDF p. 3): it is the miss the crew **expected before the burn**: "we would be coming
     down off-target—1,500 kilometers [930 miles] west of where we were supposed to land". It is not a measured miss.
   - Flight-data accounts give **386 km** past the aim point, caused by the burn firing 46 s late.
   - RussianSpaceWeb gives **800+ km** past the planned landing area in Kazakhstan. Verified from the full text
     (PDF p. 3): "a more than 800-kilometer overflight of the planned landing area".

   Options are in §3.
3. Nothing else has to be re-recorded. These lines are poetic but acceptable:
   - "breath by breath": his 1965 report describes **one** switch of the suit to 0.27 atm. The 2005 Air & Space
     telling is gradual, though: "letting out a little oxygen at a time as I tried to inch inside the airlock"
     (A&S 2005, PDF p. 2).
   - "can't feel his face": the hands are sourced; the face is not.
   - "doing the math with a spinning sun": the ship really was rolling, and the Sun sensor was the part that failed.

### On-screen type

1. ❌ `shots.js:735–736` NINETY MINUTES / INSIDE THE AIRLOCK DOOR: change to the new lyric.
2. ❌ `shots2.js:93` FLEW THE FIRST MANUAL RE-ENTRY: Gordon Cooper already flew a manual retrofire and re-entry on Faith 7
   (May 1963). Voskhod 2 was the first **Soviet** manual landing. The hand work was orienting the ship and firing the
   retro-rocket; the re-entry itself was ballistic. Use FLEW THE FIRST SOVIET MANUAL LANDING.
3. ❌ `shots2.js:436` the retro-burn "math" (Δv = 106 m/s, t = 22 s, h = 497 km) matches neither the TDU-1 engine
   (≈45 s burn, Δv ≈155 m/s) nor the orbit (167 × 475 km).
4. ✅ (fixed) The caption is now HE CAN'T REACH THE CAMERA SWITCH ON HIS LEG. It matches NASA's *Walking to Olympus*
   (1997) p. 2: "unable to reach the shutter switch on his thigh for his chest-mounted camera" (RESEARCH_R4 §4).
5. ✅ (fixed: the gauge now makes one switch, 0.40 → 0.27; NASA 1997 gives only these two settings, 40.6 / 27.4 kPa) Was: `shots.js:155–157, 166` the SUIT gauge steps 0.40 → 0.35 → 0.30 → 0.27. The 0.35 and 0.30 steps are invented: his
   1965 report and his 2004 interview describe one switch, 0.40 → 0.27. Later retellings say 0.30, then 0.25.
6. ⚠️ `shots.js:527` ORBITAL SUNRISE IN, and `SHOTLIST.md:19` "SUNRISE IN 3 · 2 · 1": the spacewalk took place in orbital
   daylight and ended about five minutes before orbital night. There was no sunrise during it.
7. ⚠️ `shots.js:318` WOLVES: the cosmonauts never met any. By one account, an aircraft scared off a pack a mile or two
   from the capsule.
8. ⚠️ `shots2.js:90` TRAINED AS A PAINTER: he wanted to study at the Riga Academy of Arts in 1953 but went to military
   flight school instead. A LIFELONG ARTIST is safe.
9. ❓ `shots.js:622` "+6 CM": no source gives a figure for how much the suit swelled.
10. Minor:
    - ⚠️ `shots2.js:101` pencils: each pencil was on a thread, and the pack was held to his wrist by a rubber band.
    - ❓ `shots2.js:496` ALTITUDE 5 KM: unverified.
    - ⚠️ `shots.js:393` ~500 KM: the apogee was 475 km.
    - ⚠️ `shots.js:152–153` the EVA clock reaches 12:09 at the hatch slam. The 12 min 9 s actually end when he is back in
      the airlock; he shut the hatch about 1.5 min later.

### Doc claims

1. ⚠️ **Head first** (`TREATMENT.md:63`, `SHOTLIST.md:35`, `ALTERNATE_CUT.md:78–93`, `FACTS.md:12`, comment at
   `shots.js:415`):
   - His **22 March 1965 report says legs first, with the camera in his right hand**.
   - The **onboard film** released after his death shows the same (Air & Space, 26 Mar 2020).
   - Head first comes from his 2004 memoir. Verified in the 2005 Air & Space excerpt (PDF p. 2): feet first was
     "impossible", and he went in by "pulling myself into the airlock gradually, head first".
   - Even in the memoir, the attempt that failed was feet first. Head first is how he got in, after bleeding pressure. So
     the N2_jam shot ("head first … jams in the rim") matches neither account.

   - A third version: NASA's *Walking to Olympus* (1997) p. 2, citing "recent accounts". He went in head first,
     "violated procedure", "got stuck sideways when he turned to close the outer hatch", and only then lowered his suit
     pressure "to free himself". On this account a head-first jam (N2_jam) does have a source (RESEARCH_R4 §4).

   It is Jade's call. Head first is now backed by the memoir and by NASA 1997, against the 1965 report and the film.
2. ⚠️ `README.md:25–26` "flew the re-entry by hand", `README.md:111` and `TREATMENT.md:68` "first manual re-entry": see
   on-screen item 2.
3. ⚠️ `README.md:115–116` says "fifteen hundred klicks" is the song's own and the real overshoot was a few hundred
   kilometres. In fact 1,500 km is Leonov's own memoir figure, and "a few hundred" is only one of several figures
   (386 km, 800+ km).
4. `FACTS.md`: add the timeline below, the 2024 publication of the full report, the onboard film, the 0.25 atm retellings
   and the list of overshoot figures. Several items are still unverified (§4.6).

## 1. The airlock, minute by minute

| Event | Moscow | UTC | Source |
|---|---|---|---|
| Launch | 10:00:00 | 07:00:00 | [W-V2][wv2] |
| Volga airlock depressurized with Leonov inside (start of orbit 2) | 11:28:13 | 08:28:13 | [spacefacts][sf], [GMIK][gmik] |
| Outer hatch opened (by Belyayev, from his console; NASA 1997 says "Leonov opened Volga's outer hatch") | 11:32:54 | 08:32:54 | [spacefacts][sf], [GMIK][gmik] |
| Leonov leaves the airlock; Belyayev radios «Человек вышел в космическое пространство!» | 11:34:51 | 08:34:51 | [spacefacts][sf], [Gudok][gudok], [Rodina][rodina25] |
| Back inside the airlock, after switching the suit to 0.27 atm (Russian accounts: the S-97 camera went in first) | 11:47:00 | 08:47:00 | [spacefacts][sf], [GMIK][gmik] |
| Outer hatch closed | 11:48:34 (Russian press), or 11:48:40 | 08:48:40 | [GMIK][gmik], [spacefacts][sf]. Americaspace says "by 11:51" ([AS14][am2]) |
| Repressurization begins ("three minutes" after the hatch closed) | 11:51:54 | 08:51:54 | [spacefacts][sf], [GMIK][gmik] |
| Into the cabin; Volga jettisoned by pyro-bolts, which set the ship rolling at ~17°/s | soon after (no time found) | | [AS14][am2] |

What the numbers measure:

- **12 min 9 s** is the time outside the ship: from leaving the airlock (11:34:51) to getting back into it (11:47:00).
  It includes the struggle at the hatch. Sources: [W-V2][wv2], [Gudok][gudok], [spacefacts][sf]. NASA 1997 (*Walking to
  Olympus* p. 2) agrees: "After 12 min Leonov reentered Volga".
- **23 min 41 s** is the time in vacuum: from the start of depressurization (11:28:13) to the start of repressurization
  (11:51:54). NASA's *Walking to Olympus* (1997) gives the EVA "Duration: 0:24" (p. 1), the same span. It breaks down as:
  - 6 min 38 s in the airless airlock before going out;
  - 12 min 9 s outside;
  - 4 min 54 s in the airlock afterwards.

  Some Russian press calls this span "from hatch opening to hatch closing", which does not fit the clock times: the hatch
  was open for 15 min 40–46 s. Sources: [spacefacts][sf], [Roscosmos][rosc].
- **The struggle at the hatch** has no primary figure; it falls inside the 12 min 9 s. His memoir says he had about five
  minutes of daylight left ([Space.com][sphero]). His 1965 report describes a fairly minor struggle ([A&S 2020][as20]).
- **After the spacewalk** he spent about 5 min in the airless airlock, from 11:47:00 to 11:51:54. About 1.5 min of that
  went on closing the hatch. After repressurization he went into the cabin; no time was found for that.

**Where "ninety minutes" came from.** Leonov's page on ClimateCultures says he drew during a "ninety-minute wait within
the airlock", and Wikipedia's "Orbital sunrise" article repeats it ([CC][cc], [W-OS][wos]; search excerpts). No flight
account supports it, and the Berkut backpack held only 30–45 min of oxygen ([W-Berkut][berkut]). Likely roots:

- One orbit took 90.9 min ([W-V2][wv2]), so there was a sunrise about every 90 minutes.
- He went out about 95 min after launch (the hatch opened at 93 min). The same page words this as about ninety minutes
  after lift-off.

Whether John Green's episode itself says "ninety minutes" is unverified: the transcript was blocked (§5).

## 2. Replacement lines for "Ninety minutes inside the airlock door"

Each line fits the same slot: 10 syllables, stresses on syllables 1, 3, 6, 8 and 10 ("NINE-ty MIN-utes in-SIDE the
AIR-lock DOOR"), and a rhyme with "wore".

| # | Line | Stress | The fact it rests on | Sources |
|---|---|---|---|---|
| 1 | **Five more minutes inside the airlock door** | FIVE more MIN-utes in-SIDE the AIR-lock DOOR | Back in the airlock at 11:47:00; repressurization began at 11:51:54 (4 min 54 s in the airless airlock). Only the first word changes. | [spacefacts][sf], [GMIK][gmik] |
| 2 | **Twelve long minutes, and then the airlock door** | TWELVE long MIN-utes, and THEN the AIR-lock DOOR | 12 min 9 s outside, ending at the airlock hatch (the famous number) | [W-V2][wv2], [spacefacts][sf], [Gudok][gudok] |
| 3 | Twelve long minutes, then back in through the door | TWELVE long MIN-utes, then BACK in THROUGH the DOOR | Same as 2 | Same as 2 |
| 4 | Twelve-oh-nine, and then back in through the door | TWELVE-oh-NINE, and then BACK in THROUGH the DOOR | 12 min 09 s; matches the film's EVA clock ("12:09"). It may be heard as a time of day. | Same as 2 |
| 5 | Point two seven, then back in through the door | POINT two SEV-en, then BACK in THROUGH the DOOR | Suit switched from 0.40 to 0.27 atm to get in: his 1965 report and 2004 interview (some retellings say 0.25) | [A&S 2020][as20], [MK 2004][mk04], [W-Berkut][berkut] |
| 6 | Twenty-four minutes in the void, no more | TWEN-ty-four MIN-utes IN the VOID, no MORE (the stress moves to "four MIN") | 23 min 41 s in vacuum, from depressurization to repressurization | [spacefacts][sf], [Gudok][gudok] |
| 7 | Ninety minutes, a sunrise, then one more | NINE-ty MIN-utes, a SUN-rise, THEN one MORE | Keeps "Ninety minutes" (perhaps the first half of her existing take). One orbit is 90.9 min, so there was a sunrise about every 90 min, ~16 a day. The line moves from the airlock to the orbit and leads into the chorus. | [W-V2][wv2] |
| 8 | Ninety minutes, one lap, one sunrise more | NINE-ty MIN-utes, one LAP, one SUN-rise MORE | Same as 7 | [W-V2][wv2] |

Recommended: **1** (smallest change, exact meter) or **2** (the number everyone knows). Keep "head first" out of the
lyric, since it is contested. Whichever line is chosen, update the type at `shots.js:735–736`, `SHOTLIST.md:36`,
`media/audio/Orbital_Sunrise_lyrics_timed.txt:23`, `video/data/timing.json` and both lyric sheets.

## 3. The overshoot: "Fifteen hundred klicks"

| Figure | Measured from | Source |
|---|---|---|
| **386 km** (sometimes given as 368 km) | The aim point. The burn was 46 s late (46 s × ~7.8 km/s ≈ 360 km). | [W-V2][wv2], [spacefacts][sf], [Astronautix][ax] |
| **more than 800 km** | The planned landing area. Verified (PDF p. 3). RSW blames the centre of gravity: "Both cosmonauts were apparently out of their seats by the time Belyaev pressed the ignition button". It does not mention a 46 s delay. | [RussianSpaceWeb][rsw] |
| ~865 km | Kostanay to the landing site at 59°34′N 55°28′E (my great-circle arithmetic). The automatic landing was planned near Kustanay, after 17 orbits. | [ru-W][rwv2], [spacefacts][sf] |
| **~1,500 km west** | "Where they were supposed to land", in Leonov's memoir excerpt. Verified (PDF p. 3): this was the crew's forecast before the burn, not the measured miss. | [A&S 2005][as05] |
| ~2,000 km | Leonov (PDF p. 4): "Our orientation system indicated that we had landed 2,000 kilometers beyond Perm, in deepest Siberia." The landing site contradicts this (~180 km N of Perm, [RSW] p. 4). It is likely the root of the retellings. | [A&S 2005][as05] |
| 160 km | One Perm regional account | Search excerpt only |

For scale (my arithmetic): the landing site is about 1,600 km from Baikonur and about 180 km from Perm city.

The line is 9 syllables with the stress pattern FIF-teen HUN-dred KLICKS, and the hot/overshot rhyme stays. Options:

- **Keep "Fifteen hundred klicks"**: it is Leonov's own number, though contested.
- **"Near four hundred klicks, coming in hot / Near four hundred klicks, we overshot"**: the flight-data figure (386 km).
- **"Eight, nine hundred klicks, coming in hot / Eight, nine hundred klicks, we overshot"**: the distance past the planned
  landing area in Kazakhstan.

The on-screen type follows the lyric at `shots2.js:518–520` and `shots2.js:527`, and in `SHOTLIST.md:76–77`.

## 4. Claim by claim

### 4.1 Lyrics (`Orbital_Sunrise_alt_Lyrics.md` = alt, `Orbital_Sunrise_Lyrics.md` = rel, `media/audio/Orbital_Sunrise_lyrics_timed.txt` = timed)

| Claim | Where | Verdict | Accurate fact | Sources |
|---|---|---|---|---|
| "First man floating in the void of space" | alt:2, rel:2, timed:8 | ✅ | First human spacewalk, 18 March 1965 | [W-V2][wv2] |
| "Tied to the ship by the slightest trace" | alt:3, timed:9 | ✅ | A 5.35 m tether (NASA 1997: "15.35-m … umbilical") carried the phone and telemetry lines; oxygen came from his backpack ("45 min of oxygen", NASA 1997 p. 1) | [Space.com][sphero], [W-Berkut][berkut] |
| "Pull him back to the ship's embrace" | alt:4, timed:10 | ✅ (poetic) | He hauled himself back along the tether, holding the S-97 movie camera in his other hand | [MK 2004][mk04] |
| "Can't feel his hands, can't feel his face" | alt:5, rel:3, timed:11 | ⚠️ | Hands: his fingertips pulled back from the glove tips and his feet floated in the boots. Face: no source. | [Space.com 50th][sp50] |
| "So he bleeds the air out, breath by breath" | alt:10, 21, rel:8, 19, timed:20, 36 | ⚠️ (poetic) | His own accounts describe one switch of the suit to its 0.27 atm reserve mode (planned beforehand, per the 1965 report). The gradual or 0.25 atm versions come from later retellings. | [A&S 2020][as20], [MK 2004][mk04], [Hackaday][hack] |
| "Dancing on the edge of a quiet death" | alt:11, rel:9 | ✅ (poetic) | Lower suit pressure risked the bends; he judged an hour of breathing pure oxygen made it safe | [MK 2004][mk04] |
| "Let his air out through the suit he wore" | alt:12, rel:10, timed:22 | ✅ | He vented oxygen through the suit's valve; the pressure-mode control was on the suit | [W-Berkut][berkut], [AS14][am2] |
| "Ninety minutes inside the airlock door" | alt:13, rel:11, timed:23 | ❌ | 12 min 9 s outside; about 5 min in the airlock afterwards before repressurization; 23 min 41 s in vacuum in total (§1) | [spacefacts][sf], [Gudok][gudok] |
| "Art is a landing in the snow" | alt:26, rel:24, timed:42 | ✅ (poetic) | They landed in snow up to 2 m deep (ERA5 grid mean: 0.66 m, about −1 °C; see SONG_NOTES_THE_MATH.md, Weather) | [NewsKo][newsko] |
| "Guidance failed and the capsule spun" | alt:29, rel:27, timed:46 | ✅ | The Sun sensor failed, so the automatic orientation failed. The ship rolled after the airlock was jettisoned, and after the burn the modules stayed joined and tumbled until ~100 km. | [Grahn][grahn], [AS14][am2], [Drew Ex Machina][drew] |
| "Doing the math with a spinning sun" | alt:30, rel:28, timed:47 | ⚠️ (poetic) | Belyayev oriented the ship by hand through the Vzor (an Earth view); ground control computed the burn | [Grahn][grahn] |
| "Fall through the skies" / "Off course… (but I'm) home" / "Made it down — home" | alt:34–45, timed:52–65 | ✅ | Manual re-entry, landed off course | [W-V2][wv2] |
| "Fifteen hundred klicks coming in hot / we overshot" | alt:39–40, rel:37–38, timed:60–61 | ⚠️ | See §3 | [A&S 2005][as05], [W-V2][wv2], [RussianSpaceWeb][rsw] |

### 4.2 On-screen type (`video/src`)

| Claim | Where | Verdict | Accurate fact | Sources |
|---|---|---|---|---|
| EVA clock: 12:09 spread over "First man…" to the hatch slam | shots.js:152–153, 165 | ⚠️ minor | 12:09 runs from exit to being back in the airlock. The hatch shut 1.5 min later. | [spacefacts][sf] |
| SUIT 0.40 → 0.35 → 0.30 → 0.27 ATM on each "breath" | shots.js:155–157, 166 | ✅ (now one switch, 0.40 → 0.27) | 0.40 nominal, switched to 0.27 (reserve). NASA 1997 p. 1: "40.6 kpascal (5.88 psi) or 27.4 kpascal (3.97 psi)", the only two settings. | [W-Berkut][berkut], [A&S 2020][as20], [MK 2004][mk04] |
| ВОСХОД-2 · ВЫХОД В КОСМОС | shots.js:164 | ✅ | | |
| PLANNED LANDING ZONE / KAZAKH STEPPE / УРАЛ · URALS | shots.js:315–317 | ✅ | The automatic landing was planned near Kustanay (Kazakhstan) | [ru-W][rwv2] |
| ACTUAL: THE TAIGA NEAR PERM | shots.js:318 | ✅ | Usolsky district, Perm Oblast, ~180 km north of Perm, 25–30 km SW of Berezniki | [spacefacts][sf], [Grahn][grahn] |
| DEEP SNOW · NO ROADS · WOLVES | shots.js:318 | ⚠️ | Snow and no roads: ✅ (helicopters could not land). Wolves: the crew never met any; by one account an aircraft scared off a pack. | [AS14][am2], [NewsKo][newsko] |
| 18.03.1965 — THE FIRST SPACEWALK; 18 MARCH 1965; ВОСХОД-2 · VOSKHOD-2; «ВОСХОД» MEANS «SUNRISE» | shots.js:358, 390–392 | ✅ | | [W-V2][wv2] |
| ORBIT 2 · ALTITUDE ~500 KM | shots.js:393 | ⚠️ minor | Orbit 2 is ✅. The orbit was 167 × 475 km; "~500 km" is the rounded popular figure. | [W-V2][wv2], [GMIK][gmik] |
| «ЧЕЛОВЕК ВЫШЕЛ В КОСМИЧЕСКОЕ ПРОСТРАНСТВО!» — BELYAYEV, BY RADIO | shots.js:409–410 | ✅ | | [Rodina][rodina25] |
| TETHER · 5.35 M | shots.js:535 | ✅ (keep) / ⚠️ | 5.35 m in Russian sources («фал длиной 5,35 м») and most English ones. NASA's *Walking to Olympus* (1997) p. 1 says "15.35-m (50.7-ft) umbilical"; its own ft conversion does not match its metres. Keep 5.35 M (RESEARCH_R4 §4). | [Space.com][sphero], [spacefacts][sf], [WtO][wto] |
| ORBITAL SUNRISE IN (countdown during the spacewalk) | shots.js:527 | ⚠️ | The spacewalk was in daylight and ended ~5 min before orbital night; no sunrise was seen from outside | [Space.com][sphero] |
| HE CAN'T REACH THE CAMERA SWITCH ON HIS LEG. | shots.js:747 | ✅ (fixed) | Chest-mounted camera; the shutter switch was on his thigh (NASA 1997 p. 2) | [Gizmodo][giz], [Space.com 50th][sp50], [WtO][wto] |
| THE SUIT WILL NOT BEND. / IN VACUUM, THE SUIT BALLOONS / HE CAN'T GET BACK IN. | shots.js:605, 623, 634 | ✅ | | [Space.com 50th][sp50] |
| +N CM (suit swelling, up to +6) | shots.js:622 | ❓ | No source gives a measurement | |
| NINETY MINUTES / INSIDE THE AIRLOCK DOOR | shots.js:735–736 | ❌ | See §1 and §2 | [spacefacts][sf] |
| THE AIRLOCK IS CAST OFF | shots.js:931 | ✅ | Jettisoned with pyro-bolts after he was back on his couch (NASA 1997 p. 1); the ship rolled at ~17°/s | [AS14][am2], [WtO][wto] |
| ORBIT 02… / SUNRISES SEEN / ONE EVERY 90 MINUTES | shots2.js:83–85 | ✅ | Period 90.9 min; the flight lasted 26 h 02 min (~17 orbits) | [W-V2][wv2], [Grahn][grahn] |
| LEONOV: AGE 30, CALLSIGN «АЛМАЗ-2», FIRST HUMAN IN OPEN SPACE | shots2.js:90 | ✅ | Born 30 May 1934 | [W-Leonov][wleo], [Rodina][rodina25] |
| TRAINED AS A PAINTER — PACKED COLORED PENCILS | shots2.js:90 | ⚠️ | The pencils are ✅. As for training: he aimed at the Riga Academy of Arts (1953) but went to flight school; sources differ on whether he enrolled. | [Linda Hall][lh], [NMSM][nmsm] |
| BELYAYEV: COMMANDER, AGE 39, «АЛМАЗ-1», FIGHTER PILOT | shots2.js:93 | ✅ | Born 26 June 1925; flew fighters against Japan in 1945 | [W-Belyayev][wbel], [Rodina][rodina25] |
| FLEW THE FIRST MANUAL RE-ENTRY | shots2.js:93 | ❌ | Cooper (Faith 7, 1963) came first. This was the first Soviet manual landing, by hand orientation and retrofire. | [NASA Faith 7][f7], [RussianSpaceWeb][rsw] |
| PENCILS TIED TO HIS WRIST WITH STRING | shots2.js:101 | ⚠️ minor | Each pencil was on a thread; the pack was held to his wrist by a rubber band | [Hyperallergic][hyper], [Linda Hall][lh] |
| THE FIRST WORK OF ART MADE IN SPACE | shots2.js:119 | ✅ | The exact moment he drew it is undocumented | [Hyperallergic][hyper], [NAU][nau] |
| ОТКАЗ СИСТЕМЫ УПРАВЛЕНИЯ / AND THE CAPSULE SPUN (was ОТКАЗ АВТОМАТИКИ; Vlad, native speaker, 2026-10) | shots2.js:426–427 | ✅ | | [Grahn][grahn] |
| Δv = 106 m/s · t = 22 s · θ ≈ 90° · h = 497 km · ±1° | shots2.js:436 | ❌ | TDU-1: ~16 kN for ~45 s, Δv ~155 m/s. Orbit 167 × 475 km. θ and ±1° are unsourced. ОРИЕНТАЦИЯ — РУЧНАЯ is ✅. | [W-Voskhod][wvs], [W-V2][wv2] |
| MAIN PARACHUTE — OPEN / ALTITUDE ~2.5 KM | shots2.js:808–809 | ✅ fixed | Was "ALTITUDE 5 KM". Voskhod had two parachutes and a soft-landing rocket. Wikipedia gives ~5 km for the start of the sequence ("Voskhod 2"; the drogue, our inference) and ~2.5 km for the main ("Voskhod (spacecraft)"). Fixed: the card now reads "ALTITUDE ~2.5 KM" for the main chute, per the Voskhod spacecraft page. See SONG_NOTES_THE_MATH.md, Weather | [W-Voskhod][wvs] |
| FIFTEEN HUNDRED / KLICKS / COMING IN HOT, WE OVERSHOT | shots2.js:518–520, 527 | ⚠️ | See §3 | |
| TWO NIGHTS IN THE TAIGA · −25 °C | shots2.js:580 | ✅ | Nights of 19–20 and 20–21 March. −25 °C is Leonov's figure; Americaspace says −30 °C. | [Fakty][fakty], [AS14][am2] |
| LEGACY: 1965 Gemini 4 — Ed White walks in space (NASA 1997 p. 2: U.S. EVA 1, World EVA 2, 0:36), 1969 Moon, 1975 handshake, 2000 ISS, 2003 Yang Liwei, 2014 Philae, 2019 Chang'e 4, 2023 Chandrayaan-3 (~69°S), 2024 Polaris Dawn, 2026 Artemis II | shots2.js:591–600 | ✅ | Gemini 4: 3 June 1965. ASTP handshake: 17 July 1975. Artemis II: 1–10 April 2026. | [NASA G4][g4], [NASA ASTP][astp], [NASA A2][a2], [Space.com PD][pd] |
| RESCUERS ARRIVE ON SKIS | shots2.js:606 | ✅ | 20 March: a team lowered by helicopter nearby skied in; on 21 March the crew skied out to a helicopter | [AS14][am2] |
| THE COSMONAUTS SURVIVED / The cosmonauts and the artwork survived. | shots2.js:634–635, 642 | ✅ | The drawing is held at the museum of the Gagarin Cosmonaut Training Centre | [NAU][nau] |
| Homage to "Orbital Sunrise: The First Art Made in Space" by John Green | shots2.js:650 | ✅ | The title of Green's video | [W-OS][wos] |

### 4.3 `README.md`

| Claim | Where | Verdict | Accurate fact | Sources |
|---|---|---|---|---|
| Lyrics are a found poem from John Green's *Orbital Sunrise* (*The Anthropocene Reviewed*) | 4 | ✅ | Podcast episode of 26 Aug 2021, later posted on vlogbrothers | [episode][ep], [W-OS][wos] |
| 18 Mar 1965, Voskhod-2 = "sunrise", first person in open space; the suit ballooned; he bled air to fit back in; guidance failed | 23–25 | ✅ | | [W-V2][wv2] |
| "he and Pavel Belyayev flew the re-entry by hand" | 25–26 | ⚠️ | They oriented the ship and fired the retro-rocket by hand; the re-entry was ballistic | [Grahn][grahn] |
| Overshot, came down in the snow of the Ural taiga | 26 | ✅ | Upper Kama upland, Perm Oblast | [spacefacts][sf] |
| Colored pencils tied to his wrist on a string | 27 | ⚠️ minor | Threads on the pencils, a rubber band on the wrist | [Hyperallergic][hyper] |
| "sleeve" → "suit": the pressure valve was on the suit | 87–89 | ✅ | | [W-Berkut][berkut] |
| Facts on screen: date, Алмаз, ages 30/39, 0.40 → ~0.27 atm, taiga near Perm, two nights, legacy | 109–114 | ✅ | | above |
| "first manual re-entry" | 111 | ⚠️ | First Soviet one; Cooper flew one in 1963 | [NASA Faith 7][f7] |
| "fifteen hundred klicks is the song's own; the real overshoot was a few hundred kilometres" | 115–116 | ⚠️ | 1,500 km is Leonov's memoir figure (his pre-burn forecast, A&S 2005 p. 3); the record gives 386 km or 800+ km (§3) | [A&S 2005][as05] |

### 4.4 `docs/TREATMENT.md`

| Claim | Where | Verdict | Accurate fact | Sources |
|---|---|---|---|---|
| Date, name, first in open space; suit, airlock, guidance, spin; "overshot by hundreds of kilometres"; Ural taiga | 8–12 | ✅ | See §3 for the size of the overshoot | [W-V2][wv2] |
| Pencils tied to his wrist on a string | 13 | ⚠️ minor | See README:27 | [Hyperallergic][hyper] |
| Hook 1: "the first orbital sunrise ever seen by a human outside a ship" | 62 | ⚠️ | The spacewalk was in daylight, near the end of the orbital day | [Space.com][sphero] |
| 0.40 → 0.27 atm, "goes in head-first" | 63 | ✅ / ⚠️ | Legs first per the 1965 report and the onboard film; head first per the 2004 memoir | [A&S 2020][as20] |
| Chorus 2: "Inside … another sunrise" | 64 | ⚠️ | He got back in as the ship headed into orbital night; the next sunrise came after the night pass | [Space.com][sphero] |
| 16 sunrises a day | 65 | ✅ | 90.9 min orbit | [W-V2][wv2] |
| "First manual re-entry", Leonov holding Belyayev at the Vzor | 68 | ⚠️ / ✅ | First Soviet one. Using the Vzor kept both men out of their seats and delayed the burn ~46 s. | [NASA Faith 7][f7], [Grahn][grahn] |
| Fifteen hundred klicks | 71 | ⚠️ | §3 | |
| "wolves' eyes" | 73 | ⚠️ | Dramatization; no wolves came near | [AS14][am2] |

### 4.5 `docs/SHOTLIST.md`

| Claim | Where | Verdict | Accurate fact |
|---|---|---|---|
| Poster, date, "SUNRISE-2", Belyayev's radio line | 14–16 | ✅ | |
| SUNRISE IN 3 · 2 · 1 | 19 | ⚠️ | No sunrise during the spacewalk |
| "12 minutes", SUIT 0.40 ATM | 28 | ✅ | |
| +6 CM | 29 | ❓ | Unsourced |
| Gauge 0.40 → 0.27 "on each breath" | 33 | ⚠️ | One switch |
| headfirst | 35 | ⚠️ | Contested (§Summary, docs 1) |
| NINETY MINUTES · INSIDE THE AIRLOCK DOOR | 36 | ❌ | §2 |
| Airlock jettison; 16 sunrises a day; ID cards (ages 30/39, artist); first art made in space | 41–49 | ✅ | |
| GUIDANCE FAILED; Vzor; retrofire → spin → g-load | 62–65 | ✅ | |
| Map: planned zone in the Kazakh steppe, actual track further west and north to Perm | 72 | ✅ | Planned near Kustanay |
| 1500 klicks | 76–77 | ⚠️ | §3 |
| Soft-landing rockets fire at touchdown | 81 | ✅ | A solid rocket on the parachute lines |
| Two nights, −25 °C; the drawing survived; legacy | 84–87 | ✅ | |

### 4.6 `docs/FACTS.md`

| Claim | Where | Verdict | Accurate fact / what to add | Sources |
|---|---|---|---|---|
| Berkut modes 0.40 nominal / 0.27 reserve; control on the suit; O2 in the backpack | 10 | ✅ | The backpack carried 30–45 min of O2 (NASA 1997: 45 min; 40.6 / 27.4 kPa) | [W-Berkut][berkut] |
| MK 2004: switched to 0.27 atm without telling the ground | 11 | ✅ | Add: the 1965 report says he had planned the switch before the flight. Gradual/0.25 atm versions are later retellings. | [MK 2004][mk04], [A&S 2020][as20], [Hackaday][hack] |
| Head first vs legs first; Volga 1.0 m inside / 1.2 m outside / 2.5 m long | 12 | ⚠️ / ✅ | Add: the onboard film shows legs first, and RGANTD published the full 22 Mar 1965 report on 30 May 2024. The 65 cm hatch is ✅ (NASA 1997 p. 1: "airlock hatch 65 cm (26 in) wide"; 74 cm stowed, 2.5 m³, 7 min to inflate). | [A&S 2020][as20], [RG 2024][rg24], [Habr][habr24], [AS14][am2] |
| Cosmosphere trainer label; Leonov ~1.9 m in the suit | 13 | ❓ / ✅ | 1.9 m in the suit is confirmed; the trainer label was not re-checked | [AS14][am2] |
| Fingertips and feet; sweat up to the knees (NASA 1997 ✅); ~6 L; +1.8 °C (NASA 1997: in 20 min ✅); ~190 bpm; 12 min 9 s | 14 | ✅ / ⚠️ | Other retellings give 143 bpm; 6 L comes from one account | [Space.com 50th][sp50], [AS14][am2] |
| Tether 5.35 m, phone/telemetry, no oxygen | 15 | ✅ | NASA's *Walking to Olympus* (1997) says 15.35 m; Russian sources say 5.35 m (RESEARCH_R4 §4) | [Space.com][sphero] |
| Suits after landing, air drops | 21–23 | ❓ | Not re-checked | |
| Rescue on skis on 20 Mar; skied out on 21 Mar; helicopter to Perm | 24 | ✅ | | [AS14][am2] |
| Hatch jammed against a birch; Belyayev shoved it free | 30 | ✅ / ❓ | The hatch rested on a big birch trunk (Russian accounts); who freed it is not re-checked | [NewsKo][newsko] |
| Landing 19 Mar, 09:02 UTC, Usolsky district; 386 km vs ~2,000 km | 31 | ✅ / ⚠️ | Add 800+ km (RussianSpaceWeb), ~1,500 km (memoir), 160 km (regional), and 59°34′N 55°28′E | §3 |
| The drawing held at the Cosmonaut Training Centre museum, shown in London 2015 | 46–47 | ✅ | Shown at the Science Museum, 2015–16 | [NAU][nau], [Hyperallergic][hyper] |
| Polaris Dawn: ~7–8 min each, ~700 km | 53 | ✅ | About 7 min each; the orbit peaked at ~737 km | [Space.com PD][pd] |
| Artemis II, 1–10 Apr 2026, crew | 58 | ✅ | | [NASA A2][a2] |
| Vzor across both seats, 46 s, one revolution later (the 18th) | 75 | ✅ / ⚠️ | Across both seats, with Leonov holding him: verified (A&S 2005 p. 4). 18th orbit, 11:35:44 MSK scheduled (RSW p. 2). **46 s is in neither full text**; RSW says both men were still out of their seats at ignition. | Wikipedia: planned for orbit 16, flown on 18. Russian Wikipedia: planned after 17 orbits. | [W-V2][wv2], [Grahn][grahn], [ru-W][rwv2] |
| Modules failed to separate; tumbling until ~100 km | 76 | ✅ | Leonov: spun round the cable until "about 100 kilometers, when the connecting cable burnt through" (A&S 2005 p. 4). RSW p. 3: separated "on a secondary command from thermal sensors". | [Grahn][grahn], [Drew Ex Machina][drew], [A&S 2005][as05], [RSW][rsw] |
| ~10 g | 77 | ✅ (per Leonov) | "my instruments indicated 10 Gs" (A&S 2005, PDF p. 4; first-person, not flight data) | [A&S 2005][as05] |
| Green: video title; podcast 26 Aug 2021; video posted ~16 Nov 2021 | 83 | ✅ / ❓ | The video date is unverified | [episode][ep] |

### 4.7 `docs/ALTERNATE_CUT.md` (history claims only)

| Claim | Where | Verdict | Accurate fact |
|---|---|---|---|
| "at the hatch, head first, the ballooned suit jams in the rim" | 78–80, 86–90 | ⚠️ | Memoir: the feet-first attempt failed, and head first worked after bleeding pressure. 1965 report and onboard film: legs first. NASA 1997: head first, then stuck sideways turning to close the hatch, then the pressure bleed. That supports a head-first jam. |
| The tether traced from the airlock to his waist, "TETHER · 5.35 M" | 84–85 | ✅ | |
| Rejected `airlock_fail` because "he enters legs first" | 91–92 | ⚠️ | Legs first is what the 1965 report and the film show |
| S3 = the planned feet-first attempt | 93–94 | ✅ | Feet first was the plan |

## 5. Blocked: please open these

The egress proxy refused all of these (403), so the excerpts above need checking against the pages themselves.

- **Air & Space, 26 Mar 2020**, "…Wasn't Quite as Dramatic as We Thought" ([link][as20]): the exact report quotes (legs first, 0.27 atm) and what the onboard film shows.
- ~~**Air & Space, Jan 2005**, "The Nightmare of Voskhod 2"~~: read in full on 2026-10-01 (songwriter's PDF), together
  with RussianSpaceWeb "Voskhod-2 lands in the wild". Exact quotes with page refs are in RESEARCH_R4 §1, "Round 6".
- ~~NASA, *Walking to Olympus* (Portree & Treviño 1997)~~: pp. 1–2 read in full on 2026-10-01 (songwriter's PDF);
  quotes in RESEARCH_R4 §4.
- **Siddiqi, *Challenge to Apollo*** (NASA SP-2000-4408), Voskhod 2 chapter
  ([PDF](https://history.nasa.gov/SP-4408pt1.pdf)): the timeline and the landing distance.
- **spacefacts.de** ([link][sf]) and **Sven Grahn, "The Voskhod 2 mission revisited"** ([link][grahn],
  [NASA mirror](https://sma.nasa.gov/SignificantIncidents/assets/the-voskhod-2-mission-revisited.pdf)): the timestamps and 386 km.
- **RGANTD full report, 30 May 2024** ([RG][rg24], [Habr][habr24], [RBC](https://www.rbc.ru/society/30/05/2024/66583bb29a79470ce064d600)): the ingress passage.
- **John Green's script**: [Nerdfighteria transcript](https://nerdfighteria.info/v/xKfvkE3Xf6M/) and
  [YouTube](https://www.youtube.com/watch?v=xKfvkE3Xf6M). Does he say "ninety minutes" or "fifteen hundred"?
- **ClimateCultures** ([link][cc]) and **Wikipedia, "Orbital sunrise"** ([link][wos]): the "ninety-minute wait" wording and its citation.
- **Wikipedia and Russian Wikipedia, Voskhod 2** ([en][wv2], [ru][rwv2]), **RussianSpaceWeb** ([landing][rsw],
  [EVA](https://www.russianspaceweb.com/voskhod2-eva.html)), **Americaspace** ([link][am2]), **MK 2004 via the
  Presidential Library** ([link][mk04]), and the Russian timeline pages ([GMIK][gmik], [Gudok][gudok], [Presidential Library][prlib20]).

[wv2]: https://en.wikipedia.org/wiki/Voskhod_2
[wvs]: https://en.wikipedia.org/wiki/Voskhod_(spacecraft)
[rwv2]: https://ru.wikipedia.org/wiki/%D0%92%D0%BE%D1%81%D1%85%D0%BE%D0%B4-2
[sf]: http://www.spacefacts.de/mission/english/voskhod-2.htm
[gmik]: https://gmik.ru/2026/03/18/pervyiy-v-istorii-chelovechestva-vyihod-v-otkryityiy-kosmos/
[gudok]: https://gudok.ru/newspaper/?ID=1259900
[prlib20]: https://www.prlib.ru/news/2030679
[rosc]: https://www.roscosmos.ru/23337/
[rodina25]: https://rodina-history.ru/2025/03/18/a-zemlia-to-kruglaia-60-let-nazad-chelovek-vpervye-vyshel-v-otkrytyj-kosmos.html
[am2]: https://www.americaspace.com/2014/03/09/to-swim-in-space-the-worlds-first-spacewalk-part-2/
[as20]: https://www.smithsonianmag.com/air-space-magazine/turns-out-alexei-leonovs-first-spacewalk-wasnt-quite-dramatic-we-thought-180974522/
[as05]: https://www.smithsonianmag.com/air-space-magazine/the-nightmare-of-voskhod-2-8655378/
[mk04]: https://www.prlib.ru/news/1292617
[rg24]: https://rg.ru/2024/05/30/rgantd-vpervye-opublikoval-polnyj-tekst-doklada-kosmonavta-alekseia-leonova.html
[habr24]: https://habr.com/ru/news/818191/
[rsw]: https://www.russianspaceweb.com/voskhod2-landing.html
[grahn]: http://www.svengrahn.pp.se/histind/Voskhod2/Voskhod2.htm
[ax]: http://www.astronautix.com/v/voskhod2.html
[drew]: https://www.drewexmachina.com/2015/03/18/the-mission-of-voskhod-2/
[berkut]: https://en.wikipedia.org/wiki/Berkut_spacesuit
[hack]: https://hackaday.com/2024/10/03/polaris-dawn-and-the-prudence-of-a-short-spacewalk/
[sphero]: https://www.space.com/alexei-leonov-heroes-of-space.html
[sp50]: https://space.com/amp/28858-first-spacewalk-alexei-leonov-50th-anniversary.html
[giz]: https://gizmodo.com/50-years-ago-the-first-spacewalk-nearly-ended-in-trage-1692303108
[cc]: https://climatecultures.net/museum-of-the-anthropocene/material-culture-inside-the-museum/orbital-sunrise-sketch-alexei-leonov/
[wos]: https://en.wikipedia.org/wiki/Orbital_sunrise
[ep]: https://podcasts.apple.com/us/podcast/orbital-sunrise/id1342003491?i=1000533191994
[wleo]: https://en.wikipedia.org/wiki/Alexei_Leonov
[wbel]: https://en.wikipedia.org/wiki/Pavel_Belyayev
[lh]: https://www.lindahall.org/about/news/scientist-of-the-day/alexei-leonov/
[nmsm]: https://nmspacemuseum.org/inductee/alexei-a-leonov/
[hyper]: https://hyperallergic.com/the-first-artwork-made-in-outer-space/
[nau]: https://ac.nau.edu/omeka-s/s/space-art/item/3961
[f7]: https://www.nasa.gov/history/60-years-ago-coopers-faith-7-mission-closes-out-project-mercury/
[fakty]: https://fakty.ua/ru/12312-dvazhdy-geroj-sovetskogo-soyuza-aleksej-leonov-spuskaemyj-apparat-prizemlilsya-v-gluhoj-tajge-nam-s-pavlom-belyayevym-nochevat-prishlos-pri-25-gradusnom-moroze-pod-otkrytym-nebom
[newsko]: https://www.newsko.ru/articles/nk-3246404.html
[a2]: https://www.nasa.gov/blogs/missions/2026/04/10/artemis-ii-flight-day-10-crew-sets-for-final-burn-splashdown/
[astp]: https://www.nasa.gov/history/45-years-ago-historic-handshake-in-space/
[g4]: https://www.nasa.gov/image-article/june-3-1965-americas-first-spacewalk/
[pd]: https://www.space.com/spacex-polaris-dawn-first-private-spacewalk
[wto]: https://ntrs.nasa.gov/citations/19980004606
