# Leonov Spacewalk Fact-Check

Sep 30, 2026 · Jade Wang · Markdown copy of the live doc: https://claude.ai/code/artifact/cce049a9-e16d-4a23-b569-af89b0eca48c (the live doc wins if they differ). Written before the captions and lyric fixes in 975e014 and 87f5f9c, so some rows are already fixed; `docs/FACTCHECK.md` is a separate, independent fact-check

**Sourcing rule.** The film treats both Leonov's own accounts (his memoir, interviews) and the official record (the 1965 post-flight report, logs, footage) as valid sources. Where they differ, pick the version that is more interesting artistically, and keep each episode in that one version from start to finish. Anything no source supports gets fixed.

## Summary

There are six claims fans will catch at once. Four are false: "ninety minutes inside the airlock", "fifteen hundred klicks we overshot", Belyayev "flew the first manual re-entry", and Leonov watching a sunrise from outside the ship. The other two are the head-first entry and the step-by-step pressure bleed. Leonov told both stories himself, but his own 1965 report says otherwise.

Scope: the extended cut on branch `ccr-0cd8dada-z9sekc`. That covers `Orbital_Sunrise_alt_Lyrics.md`, `docs/TREATMENT.md`, `docs/SHOTLIST.md`, `docs/FACTS.md`, every piece of on-screen type in `video/src/shots.js` and `shots2.js`, and the footage prompts in `tools/plate_specs.py`. (The session branch `claude/leonov-spacewalk-factcheck-*` is still on the old base; a Markdown copy of this doc is committed on the extended branch as docs/FACTCHECK.md.)

**Head-first: the sources disagree.** Leonov's memoir (2004) says he went in head-first, against the plan, and then had to turn round inside the tube. His post-flight report from 1965, and footage released later, show him going in **feet-first** with the camera in his right hand, and no turn inside. That is what Anatoly Zak reported in Air & Space in 2020. The reshoot follows the famous version, and a well-read fan may bring up the other one. Under the sourcing rule, the film keeps the memoir's head-first version, so P0-6 (the order of the attempts) is the fix still left.

## P0 — Fix before release

Fans will call these out in the comments within the hour.

| # | Claim | Where | What's true | Fix |
| --- | --- | --- | --- | --- |
| P0-1 | "Ninety minutes inside the airlock door" | Pre-chorus lyric; P4 type `NINETY MINUTES / INSIDE THE AIRLOCK DOOR` (shots.js) | He was outside for **12 min 9 s** (08:34:51 → 08:47:00 UTC). The whole airlock cycle, from depressurisation to repressurisation, took **23 min 41 s**. No source says 90 minutes. The number probably comes from the \~91-min orbit, or from the backpack's oxygen supply. | Lyric options that keep 10 syllables and the "door / wore" rhyme: "Twelve long minutes outside the airlock door" · "Twenty-three minutes through the airlock door" (the full cycle) · "Twelve minutes out past the airlock door". Retype the P4 slam to match. |
| P0-2 | "Fifteen hundred klicks we overshot" / "coming in hot" | Outro lyric; O1 and O2 type | The best-supported miss is **\~386 km**: the retrofire came 46 s late, at \~7.8 km/s. Even measured from the Kustanai zone, the site is only \~870 km away. One outlier source says "2,000 km" and RussianSpaceWeb says 800+ km. But \~1,500 km is **Leonov's own figure** from his memoir, per an Air & Space memoir excerpt from 2005 (found by the other session's check in docs/FACTCHECK.md; I haven't opened it). | Under the sourcing rule the lyric can stay as the memoir's number; open the 2005 excerpt before release to confirm it. If you'd rather use the flight data: "Nearly four hundred klicks" (5 syllables, the same as "fifteen hundred klicks"). |
| P0-3 | Belyayev "flew the first manual re-entry" | Belyayev ID card (shots2.js D3); TREATMENT build row; `vzor_manual` prompt | Scott Carpenter (Mercury-Atlas 7, 1962) fired his retros by hand. Gordon Cooper (Mercury-Atlas 9, 1963) flew a fully manual retrofire and re-entry. Voskhod 2 was the **first Soviet** manual retrofire. | `FLEW THE FIRST SOVIET MANUAL RE-ENTRY`, or `FLEW THE SHIP HOME BY HAND`. |
| P0-4 | Leonov watches a sunrise while outside the ship | `hero_sunrise` (orbital night, then the sun rises behind him on the tether); the `ORBITAL SUNRISE IN 3 · 2 · 1` countdown during the EVA; `ship_wide_sunrise`, `visor_sunrise`, `reach_home`; TREATMENT: "the first orbital sunrise ever seen by a human outside a ship" | The whole EVA was in **daylight**. The ship was due to enter Earth's *shadow* (sunset) a few minutes after he got back in. No account has him seeing a sunrise outside. The drawing is a sunrise, which fits a view from the cabin. | Cut the countdown and the TREATMENT sentence. Keep the imagery as the song's metaphor, but let no type say it happened during the walk. The safest fix is a direct sun on the tether, with the first true sunrise saved for the porthole (K1). |
| P0-5 | He enters the airlock head-first | Extended intro `N2_jam`, P3 `headfirst`, `tube_struggle` (the turn inside); FACTS.md | **Disputed.** The memoir (2004) says head-first, then a hard turn inside the tube to close the hatch. His **1965 post-flight report** says legs-first, with the camera in his right hand, and footage released later shows the same (Zak, Air & Space, 2020). If he went in feet-first, the turn inside never happened. | Decided: head-first, from the memoir, under the sourcing rule. The turn inside the tube stays too. You can credit it once on screen if you like, e.g. `AS LEONOV LATER TOLD IT`. Don't mix in details from the 1965 report within this episode. |
| P0-6 | He is jammed head-first at the rim *before* lowering the pressure, then fails feet-first (S3), then gets in head-first | Extended intro `N2_jam` → S3 `airlock_struggle` take 1 → P3 | Even in the memoir, head-first comes *after* the pressure drop, as the way he finally got in. The plan was feet-first. The cut shows three attempts in an order that no account gives. | Use the memoir's order: the planned feet-first attempt fails (S3), he bleeds the air, head-first succeeds (P3), then the turn inside (tube\_struggle). N2 should foreshadow the rim without a head-first entry, e.g. a short cut of the feet-first jam from the S3 take. |

## P1 — Wrong numbers and details

These are on-screen numbers or hardware details that are wrong or made up. They are cheap to fix.

| # | Claim | Where | What's true | Fix |
| --- | --- | --- | --- | --- |
| P1-1 | The suit gauge steps 0.40 → 0.35 → 0.30 → 0.27 atm | EVA HUD `suitPressure()` (shots.js) | The Berkut had two modes, 0.40 and 0.27. The 1965 report and Leonov (MK, 2004) describe **one switch** to the second mode. The 0.35 and 0.30 readings are invented. The lyric "breath by breath" can stay as poetry. | Jump from 0.40 to 0.27 in one step, on "bleeds" or on the last "breath". |
| P1-2 | `ORBIT 2 · ALTITUDE ~500 KM` | Mission card (shots.js I2) | "Orbit 2" is right; Russian sources say "on the second orbit". The orbit was about 167 × 475 km (other figures: 173 × 498). So \~500 km is the **apogee**, not his altitude during the walk. | `ORBIT 2 · APOGEE ~500 KM`, or `ORBIT 167–475 KM`. |
| P1-3 | `TRAINED AS A PAINTER` | Leonov ID card (shots2.js D2) | He was a serious amateur. He applied to the Riga Academy of Arts but couldn't afford to go, and he had no formal training. | `AMATEUR PAINTER — PACKED COLORED PENCILS`, or `A PAINTER ALL HIS LIFE`. |
| P1-4 | `+6 CM · THE SUIT IS SWELLING` | S2 dimension marks | No source gives a number. What is documented is his account: his fingers pulled out of the glove tips and his feet slipped out of the boots. | Drop the number and animate the marks without a value. Or type `HIS FINGERS NO LONGER REACH THE GLOVES`. |
| P1-5 | `HE TRIES TO REACH THE CAMERA ON HIS LEG` | S1 (shots.js) | The still camera was on his **chest**. What he couldn't reach was its **shutter switch on his thigh**. The film footage came from the ship's own cameras. | `HE CAN'T REACH THE CAMERA SWITCH ON HIS LEG.` The plate prompt already says "switch on his thigh". |
| P1-6 | Air bled from a valve **on the sleeve** | Original `valve_bleed` spec (the released take) | FACTS.md says the regulator is on the suit's chest; one Russian source calls it a blue tap at the solar plexus. The v2 spec in the same file shows the chest tap. | Check that `video/plates/valve_bleed` has the chest-tap take installed and not the sleeve one. |
| P1-7 | Leonov "holding Belyayev across his lap" at the Vzor | TREATMENT build row | Belyayev lay across **both seats** to use the Vzor, and Leonov held him in place. Getting back into his seat cost \~46 s, which is why the retrofire was late. | Reword. The `vzor_manual` prompt already shows it correctly. |
| P1-8 | Landing distance in FACTS.md: "386 km by one count; other sources \~2,000 km \[contested\]" | FACTS.md §3 | 386 km matches the 46-second delay. 2,000 km comes from a single retelling and doesn't fit the geometry. | Mark 386 km as the working figure, so nobody puts "2,000 km" back in later. |

## P2 — Nitpicks and artistic licence

These are defensible, but worth hedging or deciding on purpose.

| # | Claim | Where | Note | Suggestion |
| --- | --- | --- | --- | --- |
| P2-1 | Wolves | `DEEP SNOW · NO ROADS · WOLVES` (map); TREATMENT "wolves' eyes"; archived `fire_night` v1 | The Upper Kama taiga of Perm Krai is grey-wolf country, so wolves on the map are accurate for the habitat. Wolves near the capsule come only from Leonov's own account, which the sourcing rule allows. | Keep `DEEP SNOW · NO ROADS · WOLVES` and "wolves' eyes" in the treatment. If you want to be exact, don't show wolves attacking or coming close; glinting eyes at the edge of the firelight are fine. |
| P2-2 | `TWO NIGHTS IN THE TAIGA · −25 °C` | L4 | Two nights is right. Sources give both −25 °C and "below −30 °C". | `−25 TO −30 °C`, or `BELOW −25 °C`. |
| P2-3 | `MAIN PARACHUTE — OPEN · ALTITUDE 5 KM` | E1 | Wikipedia's Voskhod 2 page puts the start of the parachute sequence at \~5 km; the Voskhod spacecraft page puts the main chute at \~2.5 km. | `PARACHUTE — OPEN` with no altitude, or `PARACHUTES DEPLOYING · ~5 KM`. |
| P2-4 | "Pull him back to the ship's embrace" | Intro lyric | Nobody reeled him in. He hauled himself back along the tether, hand over hand. | The lyric is fine as poetry. Just don't show Belyayev pulling on the line. |
| P2-5 | Sun or capsule spinning while Belyayev orients the ship | `vzor_manual` ("sunlight spins slowly across them"); lyric "doing the math with a spinning sun" | The spin came *after* retrofire, when the instrument module failed to separate. Orientation happened in a stable ship. | Keep the lyric, but hold the light steady in the Vzor shot and save the spin for `porthole_spin`. |
| P2-6 | A red warning lamp flashes | `red_warning` | This is dramatised. The failure was that the automatic orientation and retrofire never started. The crew heard about it from the ground and from the dead instruments. | Acceptable shorthand. Don't add any type that names an alarm. |
| P2-7 | `FIRST LANDING ON THE FAR SIDE` (2019) | Legacy (shots2.js) | NASA's Ranger 4 crashed on the far side in 1962. Chang'e 4 made the first **soft** landing there. | `FIRST SOFT LANDING ON THE FAR SIDE`. |
| P2-8 | He carries the drawing into the taiga, pulls it from his suit lining and unfolds it | `drawing_survives_v2`; `THE DRAWING SURVIVED` | The drawing survives in a museum, but no account puts it in the forest. It is a small **flat card**, not a folded sheet. | Show it unfolding as a flat card. The "survived" type is fine. |
| P2-9 | `THE FIRST WORK OF ART MADE IN SPACE` | D5 | It is widely called that (the Science Museum, for one). *When* he drew it during the flight is poorly documented. | Fine as it stands. `WIDELY CALLED THE FIRST ART MADE IN SPACE` if you want to be bulletproof. |
| P2-10 | "Ten g" of deceleration | `g_force` prompt (no type on screen) | Often quoted and typical of a ballistic Voskhod re-entry, but I found no primary figure. | Keep it out of the on-screen type. |
| P2-11 | "Guidance failed" | Build lyric; `GUIDANCE FAILED · ОТКАЗ АВТОМАТИКИ` | Strictly, the **automatic orientation** system failed (отказ автоматики means that). "Guidance" is loose but close enough. | Keep it. |

## Verified — leave as is

| Claim | Where | Check |
| --- | --- | --- |
| 18 March 1965; «ВОСХОД» means «SUNRISE» | Poster, mission card | Correct |
| "First man floating in the void of space" | Intro | First human EVA |
| `TETHER · 5.35 M` | N1b | 5.35 m in nearly every source (one Wikipedia page has a "15.35 m" typo) |
| EVA clock totals 12:09 | EVA HUD | 12 min 9 s outside |
| «ЧЕЛОВЕК ВЫШЕЛ В КОСМИЧЕСКОЕ ПРОСТРАНСТВО!», Belyayev by radio | I3 | Correct speaker and words |
| "In vacuum, the suit balloons"; "He can't get back in" | S2, S3 | Correct |
| White Berkut suit, red СССР on the helmet | All plates | Correct |
| `THE AIRLOCK IS CAST OFF` | K3 | The Volga was jettisoned after the EVA |
| 16 sunrises a day, one every \~90 min, count capped at 17 | Drop 1 | \~91-min period; 17 orbits; retrofire on the 18th |
| Leonov age 30, Belyayev age 39; callsigns «АЛМАЗ-1» (Belyayev) and «АЛМАЗ-2» (Leonov) | ID cards | Birth dates check out; confirm the numbering on ru.wikipedia |
| Belyayev was a fighter pilot and the commander | ID card | Correct |
| Coloured pencils (Taktika) tied to his wrist with threads | D4 | Correct |
| The drawing's design: a diagonal arc, black, light blue, yellow, orange-red with a small red sun, blues below | `DRAWING` spec | Matches the museum photo |
| The instrument module didn't separate; the stack tumbled until the cable burned through | `capsule_spin`, `porthole_spin` | Correct |
| Soft-landing rocket fires just above the ground | `treetops` | Correct (\~1.5 m) |
| Landed in the Perm taiga, Urals, not Siberia; planned zone in Kazakhstan | E2 map | Correct |
| The hatch jammed on a birch and was rocked free; they wore suit linings tied with parachute cord; fur boots | `hatch_tree`, `hatch_free`, `LININGS` | Correct (the birch species is less certain) |
| Rescuers on skis; two nights | L6, L4 | Correct |
| Legacy: 1965 Ed White; 1969 Moon; 1975 Leonov handshake; 2000 15 nations; 2003 Yang Liwei; 2014 Philae; 2023 Chandrayaan-3 "near" the south pole; 2024 Polaris Dawn; 2026 Artemis II (1–10 Apr) | L7 | All correct |
| Leonov 1934–2019 | End card | Correct |

## Reference timeline and sources

Times are UTC; Moscow time is +3 h.

| Time | Event |
| --- | --- |
| 18 Mar, 07:00 | Launch from Baikonur |
| 08:28:13 | Airlock depressurised |
| 08:34:51 | Leonov leaves the airlock, on orbit 2, in daylight |
| 08:47:00 | Back in the airlock: **12 min 9 s outside** |
| 08:48:40 | Outer hatch closed |
| 08:51:54 | Repressurised: **23 min 41 s** for the whole cycle |
| A few minutes later | The ship enters Earth's shadow |
| After the EVA | The Volga airlock is jettisoned |
| 19 Mar, orbit 17 | Automatic orientation fails; the planned retrofire doesn't happen |
| 19 Mar, orbit 18 | Manual orientation with the Vzor; retrofire \~46 s late; the stack tumbles until the cable burns through at \~100 km |
| 19 Mar, 09:02 | Landing at 59°34′N 55°28′E, Perm taiga, \~386 km from the target |
| 19–20 Mar | First night alone, by a fire, in the suit linings |
| 20 Mar, morning | Rescuers on skis arrive; second night in a log hut |
| 21 Mar | They ski to a clearing and fly out by helicopter |

Sources: the web tools could not open pages this session (blocked by the network policy), so the facts above come from search excerpts, plus the sources already in `docs/FACTS.md`. Open the Air & Space piece before quoting it.

- [Anatoly Zak, "Turns Out Alexei Leonov's First Spacewalk Wasn't Quite as Dramatic as We Thought", Air & Space, 2020](https://www.smithsonianmag.com/air-space-magazine/turns-out-alexei-leonovs-first-spacewalk-wasnt-quite-dramatic-we-thought-180974522/)
- [RussianSpaceWeb: Voskhod-2 EVA](https://www.russianspaceweb.com/voskhod2-eva.html) · [Voskhod-2 landing](https://www.russianspaceweb.com/voskhod2-landing.html)
- [Wikipedia: Voskhod 2](https://en.wikipedia.org/wiki/Voskhod_2) · [Восход-2 (ru)](https://ru.wikipedia.org/wiki/Восход-2)
- [Wikipedia: Mercury-Atlas 7](https://en.wikipedia.org/wiki/Mercury-Atlas_7) · [NASA: Cooper's Faith 7](https://www.nasa.gov/history/60-years-ago-coopers-faith-7-mission-closes-out-project-mercury/)
- [Linda Hall Library: Alexei Leonov](https://www.lindahall.org/about/news/scientist-of-the-day/alexei-leonov/) · [Science Museum blog](https://blog.sciencemuseum.org.uk/remembering-alexei-leonov/)
- [NASA: Artemis II splashdown](https://www.nasa.gov/blogs/missions/2026/04/10/artemis-ii-flight-day-10-crew-sets-for-final-burn-splashdown/)
