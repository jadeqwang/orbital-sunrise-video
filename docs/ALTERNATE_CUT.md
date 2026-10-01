# Alternate cut with extra lyric lines: what it takes, end to end

Jade plans an alternate cut of the film with a few extra lines of lyrics (new audio from her; the song may get longer or be
rearranged). This file lists everything a fresh session needs for that, in pipeline order, and says what the repo has and
what it lacks. Audited 2026-09-30 against the code and files on disk.

Read first: [`HANDOFF_JADE.md`](HANDOFF_JADE.md) (her likeness rules, the release history, the ritardando) and
[`TAKES.md`](TAKES.md) (the recipe for every generated take, including "Extending a clip, or adding lyrics").
Style: [`STYLE_BIBLE.md`](STYLE_BIBLE.md). Facts on screen: [`FACTS.md`](FACTS.md).

## The extended mix she supplied (2026-09-30)

`media/audio/Orbital_Sunrise_alt.mp3` is her upload `Orbital_Sunrise_6.mp3`, committed as received: **247.58 s**
(vs 237.79 s for `Orbital_Sunrise.mp3`), MP3 180 kb/s, 48 kHz stereo, tags "Orbital Sunrise" / "jadewang". It is lossy, not
the WAV/AIFF asked for in item 2 below: fine to work from, but ask for the lossless master (and her vocal stem) if she has
them. The released cut's audio is untouched.

Her lyric sheet for it is `Orbital_Sunrise_alt_Lyrics.md` (repo root; `Orbital_Sunrise_Lyrics.md` stays the released
cut's). Against the old sheet:

- **Intro: two new lines** after "First man floating in the void of space": "Tied to the ship by the slightest trace" /
  "Pull him back to the ship's embrace". These are the ≈12 s inserted at ≈13.9 s (below). In `timing.json` they go
  *between* intro lines 0 and 1, so `L1[1]` ("Can't feel his hands…") becomes `L1[3]` in the shots.
- **Pre-chorus says "suit"**, like the released sheet; the old *recording* sang "sleeve", so confirm by ear at ≈1:04.
- **Final chorus, line 2** is now "Fall through the skies, bring me home" (was "Orbital sunrise, bring me home"): the
  hook3 line text in `timing.json` and the type in the hook3 shots change; its timing likely does not.
- **The old outro is split in two**: "Fifteen hundred klicks…" is now its own section, "[Vocal led, orchestral strings]",
  and "[Outro — decisive ending]" holds only "Made it down — home." ×2. Check whether the strings are new in the mix
  (the section names in `timing.json` are the film's own and need not follow the sheet).
- **Ending**: "[Soft piano from intro, ritardando at the end]", so the ritardando may already be in the recording
  (item 4: then `tools/ritardando.py` is not needed).

`python3 tools/compare_mix.py Orbital_Sunrise.mp3 media/audio/Orbital_Sunrise_alt.mp3` (a new tool: windowed spectral
matching, old song time to new song time) finds:

| old song time | new song time | what |
|---|---|---|
| 0 – ≈13.9 | 0 – ≈13.9 | the intro through "First man floating in the void of space" (line ends 13.19), same music |
| — | **≈13.9 – ≈26.0** | **≈12 s of new material** (about 8 bars) before "Can't feel his hands, can't feel his face": presumably the new lyric lines; not transcribed yet (Whisper is blocked here, so by ear / from her) |
| ≈14 – 230 | new = 0.98445 × old + 12.03 | the rest of the song in the same order, but **1.58 % faster** (≈164.9 BPM vs 162.33): the offset falls steadily from +12.0 s to +8.7 s |
| 230 – end | +8.4 s | the ending lands ≈0.3 s earlier than the fit; the new mix is ≈1.4 s longer after the final chord than the old mp3 (check whether it already rings out, item 4) |

Match scores are 0.6 – 0.95 rather than ≈1.0 after the intro, so this is a **new render of the song, not the old mix with a
block spliced in**: the arrangement matches but the audio does not sample-for-sample. Consequences:

- It is case **B** (an insert at ≈13.9 s) **plus a tempo change**: `timing_edit.py shift` alone is not enough. Every time after
  the insert maps through `new = 0.98445 × old + 12.03` (a scale, then re-check by ear), the beat period becomes ≈0.3639 s,
  and the beats in `timing.json` must be re-measured (or scaled) rather than shifted. An `editmap.json` (section 4) with a
  scale segment handles the absolute constants in `video/src`.
- The "suit"/"sleeve" word (item 3) must be checked by ear in the new mix: ≈1:04 (old 52.6 s → new ≈63.8 s).
- The five vocal reference clips and the lips of every existing singing take were cut against the old mix: at 1.58 % faster
  they drift ≈0.08 s over a 5 s clip, which may be tolerable, but each take's lag needs a listen against the new audio.
- The suit splice, ending ring-out and ritardando tools (section 2) all need their times moved through the map above.

## Retimed to the extended mix (branch, 2026-09-30)

She confirmed the new mix sings "suit" and asked for the film to be retimed. Done on this branch; the released cut stays on
`main`. How it works:

- **One time map moves the whole film.** `python3 tools/retime.py map` aligns the released mix
  (`Orbital_Sunrise_extended.m4a`) with hers every 0.5 s and writes `video/data/editmap.json` (old song time → new song time;
  a jump of 12.12 s at old 13.0 s for the inserted lines; note-for-note anchors through the piano outro; +8.494 s after the
  final chord). Checked on both vocal stems: the new vocal matches the old one word for word within 0.01–0.03 s once
  mapped, so the recording is the same performance at a slightly different, wandering tempo (≈164.8 BPM on average).
- `python3 tools/retime.py timing` rewrites `video/data/timing.json` from `video/data/timing_release.json` (the released cut's,
  kept): every beat, word and section through the map; 33 beats inserted in the new bars (so released beat n ≥ 35 is now
  n + 33); the two new intro lines; "Can't feel his hands, can't feel his face" re-measured (the released times sat up to
  0.74 s early on "Can't": in both recordings it is sung ≈0.75 s after the old timing said); the final chorus's
  "Fall through the skies, bring me home". The new word times come from a speech recogniser run on the new vocal stem
  (sherpa-onnx, NeMo Parakeet TDT 0.6B int8, downloaded from the k2-fsa/sherpa-onnx GitHub releases, which this environment
  allows; huggingface.co is blocked), each snapped to the stem's onsets and pitch changes; the recogniser alone is only good
  to ≈0.1 s on singing.
- **video/src:** `core.js` has `O(x)` (a released song time → this recording), `OI(t)` (the inverse) and `Bn(n)` (a released
  beat number), loaded from `editmap.json` in `main.js` (no file: the identity, the released cut). Every hand-set time and
  beat number in the table of section 4 is wrapped in them, and the singing takes read their clock through `OI(t)`, so their
  lips stay on her voice (the take plays 1.6 % faster). `render.mjs --list` against the released list: every shot moves
  exactly with the map (within 0.08 s) except the intended changes below.
- **New shots** (the two new lines are the story's hinge: he floats free, all that holds him is a line to the ship, and the
  ship can't take him back: at the hatch the ballooned suit jams in the rim; her direction, 2026-09-30: "he should get stuck
  at the hatch door"; she first asked for head first, then chose his memoir's order: the jammed attempt feet first, the
  head-first entry after he bleeds the suit):
  - `N1_tether` ("Tied to the ship by the slightest trace", one shot over the whole line): the extreme wide
    `ship_wide_sunrise` (the ship small at the top, him hanging far below on one thin line over the Earth), plate 3.1 → 7.9 s
    at 0.74x under a slow push-in (H1c plays 1.0 → 3.9 of the take), "TIED / TO THE SHIP" in the sky right of the airlock.
    From "by" the pencil traces the tether in gold from the hatch lid to where it meets him (his shoulders), following it as
    he drifts (`TETHER`: its ends and middle tracked in plate uv every 0.5 s of plate time), "by the slightest trace" and
    "TETHER · 5.35 M" (on "trace") beside it.
  - `N2_jam` ("Pull him back to the ship's embrace"): `airlock_fail` take1 (mattes made with `tools/plate_masks.py`), the
    feet-first attempt that jams, in memoir order: at the open mouth of the Volga tube he swings his legs in, the ballooned
    suit jams against the rim, he pushes back out, turns and struggles. Plate 1.0 → 7.95 s, speed-ramped: 1.25x through the
    jam and the push out ("Pull him back"), faster through the turn, his face in the visor (plate 6.5 s) on "embrace" with a
    punch-in right of the type, then 0.76x on his strained face to the cut. He never gets in. P3 (`headfirst`) is then the
    head-first entry that works, after he bleeds the air. Note: his 22 March 1965 report and the onboard film say legs
    first throughout (docs/FACTCHECK.md); the film follows the memoir (2004).
  - Replaced for N2 (2026-09-30): `headfirst`'s first second run in and back out on the beat (a head-first jam matches
    neither account). Still rejected: the archived `airlock_struggle` takes 2 and 3, and I3's exit run backwards.
  - Note: S3's plate (`airlock_struggle` take 1, "HE CAN'T GET BACK IN.") has him facing out of the rim with his backpack
    behind him in the tube, i.e. feet first too; left as released.
  - Lyric change (2026-09-30): the pre-chorus's "Ninety minutes inside the airlock door" (wrong, docs/FACTCHECK.md §1) is
    now "Eternity inside the airlock door" on the alt sheet and in `timing.json` (`REWORDED` in `tools/retime.py`:
    "Eternity" on "Ninety"'s time, "minutes" drops); P4 types ETERNITY / INSIDE THE AIRLOCK DOOR. She will re-record it (done: "The re-record" below);
    until then the audio still sings the old words.
  - `I4_hands` now cuts on the sung "Can't" (25.96 s). `F2_home` types "FALL THROUGH / THE SKIES" and "bring me home" (its
    type mask grew to fit).
- **Audio:** her recording already slows the piano outro ("ritardando at the end" on the sheet: the eighths widen from 0.20 to
  0.31 s before the chord), so there is no `tools/ritardando.py` pass and `video/data/timemap.json` is the identity. It still
  cut off 4.4 s after the final chord while ringing (−39 dB), so `tools/extend_ending.py --src=media/audio/Orbital_Sunrise_alt.mp3
  --out=media/audio/Orbital_Sunrise_alt_extended.wav --shift=8.494` gives it the same ring-out as the release (untouched up to
  242.7 s; 250.69 s = **6017 frames**). The committed fallback is `Orbital_Sunrise_alt_extended.m4a`; `render.mjs`,
  `encode_release.sh` and `package_hls.sh` default to it. (`extend_ending.py` now convolves with `fftconvolve`: 6 s instead
  of hours, same result.)
- **Not done:** the full render needs the plate `leonov_drawing` (drop 1's drawing shots, the coda, the title), which
  `tools/install_drawing.py` builds from her museum photo `media/refs/leonov_drawing_real_photo.jpg` (not committed; not in
  this container). `docs/SHOTLIST.md`, the README's "4:02" and the HANDOFF tables still describe the released cut.

## The re-record: "Eternity inside the airlock door" (2026-09-30)

Her upload `Orbital_Sunrise_airlock_corrected_1.mp3` is committed as `media/audio/Orbital_Sunrise_alt2.mp3` ("Orbital Sunrise
(airlock corrected)" / "jadewang", MP3 178 kb/s, 48 kHz stereo): **248.68 s**, 1.1 s longer than `Orbital_Sunrise_alt.mp3`.
It is now the film's audio; `alt` stays committed and renderable (`tools/retime.py --target=alt`).

**A new render, not the old mix with one line patched.** `tools/compare_mix.py media/audio/Orbital_Sunrise_alt.mp3
media/audio/Orbital_Sunrise_alt2.mp3`: same arrangement and the same vocal performance, but the offset grows steadily from
+0.02 s at the start to +1.64 s at 240 s (new = 1.00605 × alt + 0.135: **0.6 % slower**, ≈163.9 BPM), match scores 0.6–0.95
(never ≈1.0), and per-line the two vocal stems match equally well everywhere, the airlock line included. No insert, no cut.
The piano outro keeps its ritardando; the final chord is at **244.78 s** (243.19 in `alt`), and this recording fades the chord
to silence within ~4 s (−60 dB at +3.3 s) instead of cutting it off.

**Lyrics** (Parakeet on the Kim_Vocal_2 stem, per line over several windows, against `alt` the same way): the pre-chorus's
line 4 now sings **"Eternity inside the airlock door"** (the recogniser hears "Eternity inside the airlock door" and, in some
windows, "An/And eternity": the unstressed first "E-" is a pickup ≈0.25 s before where "Ninety" sat). "suit", "Tied to the
ship by the slightest trace", "Pull him back to the ship's embrace" and "Fall through the skies, bring me home" are all
sung as on `Orbital_Sunrise_alt_Lyrics.md`. Differences from the sheet the recogniser reports and that need her ear:
the breakdown's "Never see what **he** saw ahead" is heard as "what **you** saw" in all 12 windows tried (`alt`: "he"), and
the breakdown's "breath by breath" as "breath **my** breath" in most (`alt`: "by"). Neither is changed in `timing.json`
(the breakdown's type does not show those words; `B3_never`'s lips are by ear).

**Retimed** (`tools/retime.py`, now with `TARGETS`, default `alt2`):

- `python3 tools/retime.py map` aligns the released mix with `alt2` directly (not through `alt`), with the search centred on
  `compare_mix.py`'s fits of release → alt2; the piano outro's anchors re-measured on `alt2` (onset cross-correlation of each
  `alt` anchor note, r 0.96–0.99; the chord 244.78). Insert 12.985 → 25.331 s; `shift_after` **+10.084 s**. With
  `--target=alt` the same code reproduces the old `editmap.json`/`timing.json` exactly.
- Word times not from the map, re-measured on the `alt2` vocal stem: `python3 tools/retime.py carry --from=alt
  --stem-from=<alt vocals.wav> --stem=<alt2 vocals.wav>` carries `alt`'s measured times through a DTW of the two stems and
  snaps them to `alt2`'s onsets/note changes (the two new intro lines, "Can't feel his hands…", "Fall through the skies…",
  and "inside the airlock door"); "Eternity" (sung only here) from `python3 tools/retime.py words 65.9 69.3 "Eternity inside
  the airlock door" --stem=<alt2 vocals.wav>` (recogniser + snapping): **Eternity 66.14, inside 67.06, the 67.50, airlock
  67.99, door 68.59**. `words` alone was 0.1–0.2 s off on some words (it snapped to the wrong note change), so it is the
  cross-check, not the source, for words both recordings sing. The vocal stems: `python3 tools/vocal_stem.py
  media/audio/Orbital_Sunrise_alt2.mp3 --out=/tmp/work/stem_alt2` (and the same for `alt`).
- `render.mjs --list` against `alt`'s list through (alt → release → alt2): all 55 shots move with the map (median
  0.003 s); the cuts on re-measured words by up to 0.06 s (N1/N2 on "Pull", N2/I4 on "Can't"), and `P3_sleeve`/`P4_airlock`'s
  cut is now on the sung "Eternity" (66.09, 0.25 s earlier than the map would put it). Checked on contact sheets (ETERNITY lands on 66.14–66.3, INSIDE THE AIRLOCK DOOR on "inside") and
  `timing_edit.py clicks --from=62.5 --to=70`: every pre-chorus word within 0.04 s of a vocal onset except "inside" (it
  glides out of "-ty" with no onset).
- **Ring-out:** `python3 tools/extend_ending.py --src=media/audio/Orbital_Sunrise_alt2.mp3
  --out=media/audio/Orbital_Sunrise_alt2_extended.wav --shift=10.084` (+ the committed `.m4a`): **252.28 s = 6055 frames**.
  `timemap.json`, `render.mjs`, `encode_release.sh`, `package_hls.sh` default to it; `timing.json` dur 248.68 / durExt 252.284.
- **Done** (her approval, after the round-3 notes below): the full render (`node render.mjs --frames=0:252.28 --workers=4
  --force`, 6055 frames) and the release encode (`OUT=$PWD/release/extended NAME=Orbital_Sunrise_extended
  tools/encode_release.sh`): `release/extended/*` is this recording, 4:12.

## Round 3: her fact-check notes on screen (2026-09-30)

The songwriter's notes (her "Leonov Spacewalk Fact-Check" doc; where accounts differ she takes what plays best on screen, the
memoir's order throughout: the plan was feet first; he hauled himself back hand over hand; feet first jammed; after the
pressure drop he went in head first). The round-3 plates (docs/TAKES.md "Round 3 plates") are now in the shots:

- **N1_tether** ("Tied to the ship by the slightest trace") plays `tether_drift` 1.2 → 7.95 s at ≈1x (his own drift away from
  the ship until the tether is taut; same framing as `ship_wide_sunrise`, whose first frame it starts from). `TETHER` was
  re-measured on it every 0.5 s of plate time: 7 points per row from the lid to where the line enters his matte (a ridge
  traced down through the sky, then through the limb and clouds toward the matte, a weighted quintic with outliers dropped,
  ±3-frame smoothing), drawn as a Catmull-Rom curve; the take's tether bows and kinks (3.5 → 5.5 s), so the three-point
  quadratic is gone. On full-res stills the gold sits on the drawn line.
- **N2 is two shots.** `N2a_haul` ("Pull him back"): `hand_over_hand` 2.8 → 6.9 s (≈2x easing to 1x as his glove takes the
  rim), him right of PULL / HIM BACK. `N2b_jam` ("to the ship's embrace", from the sung "to"): `airlock_fail`, the planned
  feet-first entry, jammed, pushing back out; the punch-in on his face on "embrace" as before.
- **The swell tries twice more.** `S3a_feet` (beats 108–114): `airlock_struggle` take 1 (facing out of the rim = feet first),
  2.5 → 7.8 s, wedged and working back out toward us; HE CAN'T GET BACK IN. types on beat 109. `S3b_head` (beat 114 → the
  pre-chorus): `headfirst`'s first second run in and back out on the beat (the old N2 code from 2c267c5), head first jams
  too; the caption stays, in a deeper clearing. Then P1 bleeds the suit and P3 is the head-first entry that works. S1/S2
  captions unchanged. Plate use: `airlock_fail` once (N2b), `airlock_struggle` once (S3a), `headfirst` in S3b (jam) and P3
  (entry).
- **I6_predawn** plays `countdown_drift` backwards, slowing, into its first frame (= `hero_sunrise`'s first frame), then
  `hero_sunrise` eases from rest up to 1x so it reaches `tpHero(hk0)` exactly at the cut; the frame pans to H1a's ox 180 over
  that part, so H1a continues without a jump. The countdown type moved to the bottom left, off his boots.
- **L5_survived** plays `card_by_fire` 0.9 → 6.0 s (a small flat card from his lining, the push-in, his smile), lit like L4
  (fire falloff widening as the fire leaves frame). `drawing_survives_v2` (unfolding a folded sheet) is no longer used.
- **L7_legacy**: Shenzhou 5 (Yang Liwei, lying down) is replaced by **2008 SHENZHOU 7 — ZHAI ZHIGANG, CHINA'S FIRST SPACEWALK**
  (27 Sep 2008, Feitian suit), plus **2012 CURIOSITY — A SKY CRANE LOWERS A ROVER ONTO MARS** (6 Aug 2012 UTC, Gale Crater) and
  **2022 TIANGONG — CHINA'S SPACE STATION IS COMPLETE** (T shape, Mengtian berthed Nov 2022): twelve items. Twelve × 3 beats
  would start the montage 6 beats into L6's rescue, so the montage keeps its 30 beats (LEG_END − 30 → LEG_END) and the items
  alternate 3 and 2 beats (the six longer lines get 3). All lines fit the left third (checked on the sheet).

`render.mjs --list`: 57 shots, contiguous; new cuts on "to" (22.88 s), beat 114 (54.36 s) and the legacy beats.

## Round 4: title in Chinese; the unsung last "home." (2026-10-01)

- **轨道日出** under ОРБИТАЛЬНЫЙ ВОСХОД in `I1_poster` (Oswald's red, 38 px, in by ≈1.2 s; the date moved down to y 836) and
  `Z_title` (34 px; JADE WANG moved to y 730). None of the film's fonts has CJK glyphs, so `fonts/NotoSansSC_subset_700.otf`
  (Noto Sans SC Bold, SIL OFL, `pyftsubset --text=轨道日出`, 4 KB) is loaded as `FONT.cjk` (studio.html, main.js).
- **The second "home." (OU[5], 211.58 s) is not sung** in alt2: the vocal stem (`vocal_stem.py --ss=190`) and Parakeet hear
  "Oh, made it down" with "down" at ≈211.0 s; the voice stops ≈211.3 s, and the C5 line the stem holds from there to ≈220 s
  has no vibrato (0 cents deviation for seconds, unlike every sung note before it) and steps with the strings: orchestra.
  So `L4_fire` no longer types "home" (nor keeps its clearing); the timing line stays as the cut point.
- **The first "home." (OU[3]) is sung at 204.79 s**, not the mapped 203.37 s (a note change inside the held "down"): "down"
  voiced to 204.63, the breathy /h/ 204.65–204.78, the vowel from 204.79 (on beat 204.81), held to 208.57. `retime.py`
  `TARGETS["alt2"]` `new_lines["home1"]` sets it (and, new, an optional t1), so `retime.py timing` writes it. L2_home (cut
  and HOME) now starts 204.74 s; L1_impact grows to 4.7 s, its treetops rate capped (≤ 2.3 s of plate, O3's .48) so the
  5.04 s plate does not run out.

## Round 5: the tether as a cable (2026-10-01, her notes on 0:14 and 0:33)

The generated plates never keep the cable's length, so both shots now draw a **simulated** tether (`video/src/tether.js`:
constant-length rope, position-based dynamics, both ends pinned, no gravity, light damping, bending stiffness with a minimum
bend radius after Gemini 4's umbilical, S65-30433; run once per shot at boot, stored per 1/24 s, so frames stay pure
functions of t) over plates with the generated one painted out (`tools/tether_r5.py n1|i6`; frames not in git: rerun it).

- **N1_tether**: `tether_drift_r5` = take 2 with its line removed (masked temporal median of the static shot) and him moved
  along the hatch→him line: distance 0.42 L at the start (the rest coiled slack), coasting out to exactly L on "trace"
  (18.59 s, the snap; the gold trace runs along the simulated cable and completes on it), held, a small rebound
  (≥0.93 L, the line bows), taut again by ≈20.1 s and at 20.30 s. L = 199.7 plate px (`video/data/tether_n1.json`).
  `?n1=r4` = round 4, `?n1=old` = take 1.
- **I6_predawn**: the hoop removed from `countdown_drift_t3` / `hero_sunrise` (→ `countdown_drift_r5`, `hero_sunrise_r5`,
  frames 1–72 only, used by I6 alone); a ≈5.4 m cable from the hull (where the struts meet it, tracked) to his right hip,
  starting wound loosely around him and floating in big loops, in front of and behind him (hidden by his matte when behind).
  `?i6=r4` = round 4, `?i6=old` = take 1. The same simulation continues through **H1a_sunrise** (`hero_sunrise_r5`, frames
  1–120; the plate's push-in is followed with a per-frame zoom, the hull anchor extrapolated off frame), and **I1_poster**
  (hero_sunrise at 4.4 s, a moment inside H1a) draws that moment's cable: the hoop never returns. `?i6=r4` restores all three.

## Round 4–5 release (2026-10-01)

She approved all round-4/5 stills ("ship it"). Full re-render (252.28 s, 6055 frames) after rebuilding the round-5 plates
(`tools/tether_r5.py n1 i6`; `jade_loc_day` frames checked against its committed take); `release/extended/` 1080p HEVC and
720p H.264 re-encoded with `encode_release.sh` (audio unchanged, so the 320k MP3 stands). In this cut: 轨道日出 in the
poster and end title, the unsung last "home." no longer typed, the first "home." on its sung onset, the relit 0:44 with no
glasses-shadow band, and the simulated constant-length tether at 0:14 and through 0:33–0:38 (hoop painted out).
Viewer feedback, added at release: `L2_home` (3:25) types a two-line caption bottom left in L6's mono style, "THE HATCH BLEW
OPEN — INTO A TREE." / "THEY ROCKED IT UNTIL IT FELL FREE." (FACTS §3), clear of the HOME lyric.

## 0. Ask her first (only she can supply these)

1. **The new lyric text**, line by line, and where each new line goes (which section, before/after which existing line).
   The repo has the current text only: `Orbital_Sunrise_Lyrics.md` (the sheet as written) and
   `media/audio/Orbital_Sunrise_lyrics_timed.txt` (the lines exactly as the film is keyed to them).
2. **The new master**, lossless (WAV/AIFF, 44.1 or 48 kHz), and, if she has it, **her isolated vocal stem** of the same
   mix (far better than a separation for timing, lips and any word repair).
3. **Does the new master sing "suit" or "sleeve"** in "Let his air out through the suit he wore" (≈0:53)? The original
   recording says *sleeve*; the release has *suit* only because `tools/suit_splice.py` rebuilt that one word. If she
   re-sang it, nothing to do; if the new master comes from the old session, the splice must be redone (section 2).
4. **Is the new ending the old one?** The release lets the last chord ring out (`tools/extend_ending.py`) and slows the
   piano outro (`tools/ritardando.py`, her approved "ritardando B", vmin 0.65). Does she want both on the new mix?
5. **Which new lines she wants to be seen singing** (each is a Seedance take from her approved drawings, a 5-lag listening
   test and her pick) and which get only on-screen type over existing/space imagery.
6. If generation is needed: the relay secret (section 7) and gateway credit ("Insufficient balance" happened once).

## 1. Three kinds of change, three amounts of work

| the new audio | timing.json | shots (`video/src`) | ritardando / time map |
|---|---|---|---|
| **A. New lines sung over bars that already exist** (e.g. the instrumental swell 34.3–44.4 s, the drops, the piano "landed" part) — same length | add the lines (`timing_edit.py line`) | add type (and maybe a new shot) inside the shots that cover those bars; nothing moves | unchanged |
| **B. New bars inserted** (a new verse / longer section) | `timing_edit.py shift` at each insert, then `line` for the new lines | every absolute time or beat number after the insert must move (list in section 4); new shot(s) for the gap | re-run: the outro moved |
| **C. Rearranged** (sections reordered / removed) | redo sections and lines per block (`shift` with negative `--by` removes; or re-time lines one by one) | re-plan: shots are written in song order | re-run |

Find which case it is by comparing the new mix with the committed "suit" mix: line up the intros (cross-correlate the
first 20 s), then walk section starts (`timing.json` `sections`) and listen/look where they stop matching.

## 2. Audio: masters, the "suit"/"sleeve" trap, ending, ritardando, time map

What exists (all song times in seconds):

| file | what | in git |
|---|---|---|
| `Orbital_Sunrise.mp3` (root) | the original song, 237.79 s. Sings **"sleeve"**. Source of the vocal reference clips. Never build release audio from it. | yes |
| `media/audio/Orbital_Sunrise_extended.m4a` | **the release "suit" mix**, 242.20 s, 48 kHz AAC 256k: suit splice + the ring-out ending. Build everything from this. | yes |
| `media/audio/Orbital_Sunrise_extended.wav` | the same decoded (`ffmpeg -i ..._extended.m4a -ar 48000 ..._extended.wav`); `tools/setup_env.sh` does it | no (gitignored) |
| `media/audio/Orbital_Sunrise_extended_sleeve.wav` | the pre-splice mix (so `suit_splice.py --apply` is repeatable) | no; lost with the container |
| `media/audio/Orbital_Sunrise_rit_0.65.{wav,m4a,map.json,rbmap.txt}` | the release audio (243.17 s), ritardando from 228.36 s to the final chord at 234.6957 s; the .m4a is the committed fallback | m4a + maps |
| `release/audio/Orbital_Sunrise.mp3` | the published mix (from the rit_0.65 WAV) | yes |
| `media/audio_refs/jade_*.mp3` | vocal reference clips for Seedance, full-mix excerpts of `Orbital_Sunrise.mp3` (see section 5) | yes |

**When she supplies a new mix**, in this order:

1. Save it losslessly as `media/audio/Orbital_Sunrise_alt.wav` (48 kHz; WAVs are gitignored, so also commit an
   `ffmpeg -i ... -c:a aac -b:a 256k Orbital_Sunrise_alt.m4a` as the fallback, like the current mix). Keep the old files:
   the current film must stay renderable.
2. **Suit/sleeve.** If it says "sleeve": `tools/suit_splice.py` does the fix, but everything in it is hard-coded to the old
   song: input paths `MIX48`/`SLEEVE48` (48 kHz mix), the vocal/instrumental stems at `/tmp/work/audio/{vocals,instrumental}.wav`
   (44.1 kHz; `python3 tools/vocal_stem.py <mix>` makes them, or use her stem), a hard-coded `SCRATCH` path from an old
   session (change it to your scratchpad), and all the word times (`WIN`, `OO_SRC`, `V0/V1`, `T_SRC`, `T_AT`, `RESUME`,
   `EDIT`, `EXCERPT`, 52.6–53.75 s). If the new mix moves that line, add the offset to every one of them, run it without
   `--apply` first and listen to `release/review/suit_test_{before,after,ab}.mp3`, then `--apply`. It needs `pyworld`.
3. **Ending.** `tools/extend_ending.py` reads `Orbital_Sunrise.mp3` (hence its "sleeve" warning) and hard-codes the old
   ending (final hit ≈234.5 s, `FREEZE` 235.0–235.6, `XF0/XF1` 236.0/236.9, `T0` 235.8, 234.3 in the code). For a new mix,
   point `SRC`/`OUT` at it and move those times by the offset of its final chord; or skip it if her new master already
   rings out. Its output is the new "extended" mix: everything below uses that.
4. **Ritardando** (her approved B): `python3 tools/ritardando.py --src=<new extended wav> --vmin=0.65 --start=<228.36 + D>
   --end=<234.6957 + D> --out=media/audio/Orbital_Sunrise_alt_rit_0.65.wav` (`--src`/`--end` were added for this; D = how far
   the piano outro moved). It needs `rubberband` (`rubberband-cli`). It writes `<out>.map.json` + `.rbmap.txt`.
5. **Time map:** `python3 tools/timemap.py media/audio/Orbital_Sunrise_alt_rit_0.65.map.json` rewrites
   `video/data/timemap.json` (the renderer draws film time u from song time s(u); identity before the slowdown). Commit a
   `.m4a` of the rit WAV too (timemap.json names it as `audio_fallback`). This *replaces* the current film's map: do it on a
   branch or keep a copy (`git show HEAD:video/data/timemap.json`) so the released cut can still be rendered.
6. Vocal stem for the tools that need it (`mouth_track.py`, `lipsync.py`, `timing_edit.py align`, the splice):
   her own stem, else `python3 tools/vocal_stem.py media/audio/Orbital_Sunrise_alt.wav` → `/tmp/work/audio/`.

Everything in `video/src` is written in **song time** (the unslowed, extended mix). Only the outro ritardando maps song
time to film time.

## 3. Timing: `video/data/timing.json`

Contents: `bpm` 162.33, `beat` 0.36962 s, `t0` 0.3465 (first beat), `beats` (643 measured beat times; they wander up to
±0.05 s from a strict grid), `sections` (15 contiguous `[name, start, end]`, set by hand: intro, hook1, swell, pre, hook2,
drop1, brk, art, build, hook3, drop2, outro, landed, coda, end), `lines` (34 × `{sec, text, t0, t1, words: [[t, word]]}`),
`dur` 237.76 (the mp3), `durExt` 242.2 (the extended mix; the title card fades out 2.4 s before it).

**How it was made, and what is missing.** Per the README and the first commit (`6418b54`): MDX-Net vocal stem → Whisper
word timestamps on the stem → matched to the lyric sheet and snapped to onsets; beats tracked at 162.33 BPM; sections by
hand; later edits by hand (`40ceea1` changed "sleeve" to "suit"). **The script that did this was never committed** and its
inputs (`/tmp/work/audio/*`, the Whisper model) lived only in that first container. So timing.json cannot be regenerated
from scratch; it can be edited. Two gaps are now filled:

- `media/audio/Orbital_Sunrise_lyrics_timed.txt`: the lyric lines exactly as timed, grouped by section (written by
  `python3 tools/timing_edit.py export`). Note the timed text differs from `Orbital_Sunrise_Lyrics.md` in punctuation and in
  the drops: drop1's chopped "Sun-rise… (bring me) home…" is timed as four "Orbital sunrise, bring me home" lines; word
  tokens are the text split on spaces with `( ) … —` dropped.
- `tools/timing_edit.py` (new): `export`, `check`, `shift`, `line`, `align`, `clicks`, `hardcoded` (see its docstring).
- `tools/vocal_stem.py` (new): the Kim_Vocal_2 MDX-Net separation again (checked: vocals ≈ −68 dB in the piano outro,
  −25 dB in sung passages). Not byte-identical with the lost stems.

**Recipe for new lines** (song times of the new mix):

```bash
cp video/data/timing.json /tmp/timing_before_alt.json            # keep the released cut's timing
# B: each inserted block, from the last one backwards (so earlier times stay valid): D seconds at song time T
python3 tools/timing_edit.py shift --at=104.6 --by=8.87          # e.g. 24 beats inserted before the breakdown
# the new line: word starts by ear (listen at 0.75x), snapped to the 8th-note grid of the measured beats
python3 tools/timing_edit.py line --sec=brk --text="The new words she sings" --t0=113.1 --t1=116.8 \
    --words=113.1,113.47,113.84,114.58,115.32 --grid=8
python3 tools/timing_edit.py clicks --from=112 --to=118 --out=/tmp/clicks.mp3   # hear a click on every word: fix and repeat
python3 tools/timing_edit.py check
python3 tools/timing_edit.py export                                # refresh the lyrics text file, commit both
```

- Accuracy notes, measured on the existing lines: the song's sung word starts sit within 0.04 s (median) of the 8th-note
  grid, so rough ear times (±0.08 s) plus `--grid=8` land within 0.06 s median. Without `--words`, `line` spreads the words
  by syllable count (with `--tlast`=the last word's start): 0.2 s median error, a first guess only. Onset snapping on the
  full mix did not help (drums), so it is not offered.
- `align` uses faster-whisper word timestamps matched to the given words. **Untested here: huggingface.co (where
  faster-whisper's models download from) is blocked by this environment's egress policy** (403). If a later environment
  allows it: `pip install faster-whisper`, run on the vocal stem, and still check with `clicks`.
- `shift` warns when an insert is not a whole number of beats; a musical insert is usually whole bars (4 beats = 1.479 s).
- New beats inside an inserted block are continued from the local beat period; if the new block has its own tempo feel,
  listen with `clicks` (low clicks are beats).
- Lines are looked up by section and **index** (`linesIn('pre')[3]`), so a line inserted *before* existing lines of a section
  renumbers them. Indices the shots use: `L1[0-1]` intro, `H1[0-1]` hook1, `PR[0-3]` pre, `H2[0-1]` hook2, `D1[0-3]` drop1,
  `BR[2-3]` brk, `AR[0-1]` art, `BD[0-2]` build, `H3[0-1]` hook3, `D2[0]` drop2, `OU[0-5]` outro (OU[3–5], "home." /
  "Made it down" / "home.", lie inside `landed` but are tagged `outro`; `check` allows that). Appending a new line after
  a section's existing lines keeps every index.
- Other derived data: `video/data/mouth.json` (`tools/mouth_track.py`, the re-mouthing track over the whole song, from the
  vocal stem and word times: regenerate for a new mix; only the old `_p` singer plates behind `?k4=old`/`?b3=old`/`?h1d=`
  flags use it) and `video/data/sync.json` (`tools/lipsync.py` lags for those old plates; unaffected unless they are used).

## 4. Shots: how they are scheduled and what a longer song breaks

`video/src/timeline.js`: `shot(name, t0, t1, fn, opts)` registers a shot over song time `[t0, t1)`; the last registered
shot containing t wins. `fn(t, lt, dur)` paints the whole frame (t song time, lt = t − t0). Helpers: `S(name)` =
`secT(name)` = `[name, start, end]` from `sections`; `linesIn(sec)` (type.js) = that section's lines;
`line.words[i][0]` = a word's start; `B(n)` = time of beat n (absolute index into `beats`); `beatN(t)`, `beatPos(t)`;
`lyricStack(t, items)` (shots.js) draws big lyric words, each `{s, t, x, y, size|font, col, style: 'slam'|'rise'|'type'|'drift'}`
entering at its sung time `t`. The **on-screen lyric text is written into each shot** (e.g. `'SO HE BLEEDS'`, `"I'll never float"`);
only the timing comes from timing.json. `node video/render.mjs --list` prints every shot's times.

Most shot boundaries are relative (section starts/ends, line and word starts, beats counted from a section's first beat,
e.g. drop1 `bt(n) = B(beatN(d10) + n)`), so they follow timing.json. **These are absolute and will not move** (print the
current list with `python3 tools/timing_edit.py hardcoded [--after=T]`):

| where | constant | means | relative form (suggested) |
|---|---|---|---|
| shots.js:153 | `EVA0 = 7.99`, `EVA1 = 58.6` | EVA clock runs over the spacewalk | `L1[0].t0`, `S('hook2')[1] − 0.9` |
| shots.js:157 | `44.6, 47.2, 47.9` fallbacks, **`50.2`** | suit-pressure steps (50.2 is always used) | `PR[1].words[..][0]` + offset |
| shots.js:330, 444 | `B(7)`, `B(60..62)` | first beat, countdown 3-2-1 | before any insert: fine unless the intro changes |
| shots.js:426, 440, 445 | `20.5`, `20.7` | I5/I6 cut, "ORBITAL SUNRISE IN" | `hk0 − 3.13`, `hk0 − 2.93` |
| shots.js:501 | `30.9` (+lag), `32.05` | H1d: **vocal clip start** of `jade_loc` / `jade_sing3` | shift with the song; keep equal to the clip's cut point |
| shots.js:517–552 | `B(100)`, `B(108)`, `B(109)` | swell cuts S1/S2/S3 | `beatN(sw0) + 9`, `+17`, `+18` |
| shots.js:544, 558 | `44.4` | S3 end / P1 start (= pre start) | `S('pre')[1]` |
| shots.js:602–657 | `57.2`, `59.5`, `beatTime(151)` | P4 airlock roll, push, side cut, hatch slam (59.5 = hook2 start) | `h20 − 2.3`, `h20`, `beatN(h20) − 9` |
| shots.js:708 | `67.4` (+lag) | K4: vocal clip start of `jade_rare_her_m` | shift with the song |
| shots2.js:5, 186 | `SEG` 30.9 / 67.4 / 110.4; `110.4` (+lag) | old `_p` plates; B3: clip start of `jade_dusk` | shift with the song |
| shots2.js:213 | `B(328)` | A1 cut inside "Art is a landing" | `beatN(ar0) + 10` |
| shots2.js:251, 269 | `SPIN_B0 = 352`, `CAB_B0 = 375` | the tumble's sun passes, cabin portholes | `beatN(bd0) + 3`, `+26` |
| shots2.js:448 | `139.5` | G3 riser start | `bd1 − 3.7` |
| shots2.js:570–605 | `206.2`, `211.2`, `211.5` | L4/L5/L6 cuts, "RESCUERS ARRIVE" | `l0 + 16.56`, `l0 + 21.56` |
| shots2.js:588, 601, 634 | `LEG_END = 610` (+2) | the legacy montage ends on beat 610 | `beatN(c0) − 1` |
| shots2.js:626 | `CARD1 = B(619)` | survivors card → drawing | `beatN(c0) + 8` |

Beat numbers are absolute indices: **an insert of k beats moves every B(n) after it by k** (`shift` prints k).

Two ways to handle a longer song (the helpers editing `video/src` now are working on the released cut, so do this on a branch
or when they are done):

- **Least edits (recommended for case B):** add an *edit map* of old song time → new song time (piecewise linear, like
  `timemap.json`; one point pair per insert) as `video/data/editmap.json`, a helper `O(x)` in core.js that maps through it,
  and wrap each constant above: `O(57.2)`, `B(Bn(151))` with `Bn(n)` = beat index of `O(oldBeat[n])`. `timing_edit.py shift`
  applies the same inserts to timing.json. The released cut is the identity map.
- **Cleaner:** replace each constant with its relative form (right column), verify with `--list` and a contact sheet that
  the current film is unchanged (frames are pure functions of t: compare stills before/after), then insert the new material.

**A shot for a new line:** copy the nearest shot of the same kind, register it over the new line's time
(`shot('X1_newline', NL.t0 - .05, NL.t1, ...)`, with `const NL = linesIn('brk').at(-1)` or by index), and shorten the
shot that covered those bars. Type: `lyricStack(t, [{ s: 'NEW WORDS', t: NL.words[0][0], ... }])` in the section's style
(Anton impact caps for the story lines, Instrument Serif italic crimson for her own lines, pencil handwriting for the notebook;
STYLE_BIBLE.md). A plate: `drawPlate(t, id, lt, {...})` for an existing plate (index in `video/plates/index.json`), or a new
take (TAKES.md). Case A often needs no new shot, only a `lyricStack` inside the shot already there (the swell shots S1–S3
carry telemetry only).

Also written in song seconds and to be updated by hand: `docs/SHOTLIST.md` (the shot table), the tables in
`HANDOFF_JADE.md`/`TAKES.md` ("0:32", "1:09", "1:55"), `README.md` ("4:02", the render command).

## 5. Her singing takes for new lines

Recipe: [`TAKES.md` → "Extending a clip, or adding lyrics"](TAKES.md#extending-a-clip-or-adding-lyrics-alternate-cut) and
"Timing by ear (lips)". Cross-checked for this cut:

- The five vocal reference clips are full-mix excerpts of `Orbital_Sunrise.mp3`: `jade_hook1` 30.9 s (5 s), `jade_hook2` 67.4
  (5), `jade_brk` 110.4 (8), `jade_art` 118.4 (12), `jade_hook3` 142.9 (12); 44.1 kHz stereo MP3 192k. The renderer's clip
  starts (30.9, 67.4, 110.4 in section 4) are the same numbers: **if the song moves, the existing takes stay right only if
  those constants move by the same amount** (the takes were generated against the old clips; the lags stay).
- New line: cut its clip from the **new** mix at the new line's start (minus ~0.3 s), as long as the take you request
  (Seedance 5–12 s): `ffmpeg -ss <start> -t <secs> -i <new suit wav> -ar 44100 -ac 2 -c:a libmp3lame -b:a 192k media/audio_refs/jade_<name>.mp3`.
  Add a `SCENES` entry in `tools/jade_sing.py` (clip, seconds, the exact words sung in that clip, headphones on/neck, place).
- First frame: reuse an archived first frame for a place already in the film (`media/plates/<id>/take1.first.jpg`) or build
  one from her approved drawings (`tools/jade_location.py`); her rules in HANDOFF/TAKES (centred chest-up, arms down,
  never a face close-up, check head size with the landmark model).
- Lips by ear: render **5 lags 0.2 s apart** with the new mix under the take (TAKES.md loop, `-i <new suit wav>`), put them at
  the top of the review page, she picks; then `take time = song time − (clip start + lag)` in the shot, with a `?…lag=` flag.
- Install the take at native size (TAKES.md "Installing a take"): frames into `video/plates/<id>/`, an entry in
  `video/plates/index.json`.

## 6. Rendering and release

- `cd video && node render.mjs --list` (shot table: song times, film times in brackets after the ritardando);
  `--sheet=t1,t2,... --cols=3` (contact sheet), `--stills=...`, `--clip=a:b --out=out/x.mp4` (with the song),
  `--frames=0:<film length> --workers=4` (resumable; `--force` to redo), `--encode`; `--norit` = no ritardando;
  `--song=<file>` overrides the audio; `--q=k4lag=0.3&...` passes page flags. All times are **film** time; frame i = i/24.
- Audio length decides the frame count: the current film is 243.17 s = 5837 frames. For the alternate cut, frames =
  ceil(24 × its rit WAV length). Render into its own directory (`--dir=out/frames_alt`) so the released frames survive;
  `encode_release.sh` / `package_hls.sh` read `video/out/frames`, so move/symlink it there before encoding.
- `AUDIO=media/audio/Orbital_Sunrise_alt_rit_0.65.wav tools/encode_release.sh` (checks frames vs audio length; writes
  `release/Orbital_Sunrise_1080p.mp4` + `_720p_h264.mp4`, sized under GitHub's 100 MB: a longer film gets a lower bitrate
  automatically). **These overwrite the released files**: for an alternate cut, copy the outputs to new names
  (e.g. `release/alt/`) and restore the originals, or edit `OUT` in a copy of the script.
- `AUDIO=... tools/package_hls.sh` → `release/web/{hevc,avc}` (HLS for the watch page, 4.8 Mbps HEVC; budget 256 MB) —
  also overwrites. The watch page (`release/web/index.html`, published at https://claude.ai/artifact/TYmS3GPKvHH3f1i45QrjJ5)
  has "4:02" in its stamp; publish an alternate cut as a **new** artifact (republish in batches under 58 MB, as HANDOFF says),
  not over the released one, unless she asks.
- Audio for release: `ffmpeg -i <alt rit wav> -c:a libmp3lame -b:a 320k release/audio/<name>.mp3`.
- Review page: `release/review/index.html`, https://claude.ai/artifact/DY53es5zrPfPBkhejat4VX (new items at the top; she
  reviews on her phone).

## 7. Environment (fresh container)

`tools/setup_env.sh` (new; `--check` reports only, `--audio` adds faster-whisper + the MDX model, `--mattes` pre-fetches the
rembg model). It installs / checks:

- Python packages: `tools/requirements.txt` (new; the versions that ran here). **mediapipe must be 0.10.14.** `pyworld`
  (suit_splice) was missing in the last container.
- `ffmpeg`: the imageio-ffmpeg static binary symlinked to `/usr/local/bin/ffmpeg`; it has no ffprobe, so
  `tools/ffprobe_standin.py` (new, the stand-in the last session wrote) goes to `/usr/local/bin/ffprobe` (answers only
  `-show_entries format=duration`, which is all the tools ask). `rubberband` from apt `rubberband-cli`.
- Node 22 + `cd video && npm ci` (puppeteer-core 24). Chromium: the image's Playwright build at
  `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` (render.mjs's default); otherwise `npx playwright install chromium`
  and `CHROME=<path>` / `--chrome=`.
- Models (not in git, `/tmp/work/models`): `face_landmarker.task` (MediaPipe, float16, 3.76 MB) and
  `selfie_multiclass.tflite` (selfie_multiclass_256x256 float32, 16.4 MB) from storage.googleapis.com/mediapipe-models
  (sha256 in the script); rembg `isnet-general-use.onnx` (178 MB) downloads itself into `U2NET_HOME=/tmp/work/u2`;
  `Kim_Vocal_2.onnx` (66.8 MB, GitHub TRvlvr/model_repo) for `vocal_stem.py`. Whisper models (huggingface.co) are blocked here.
- The release WAV decoded from the committed m4a.
- **Relay secret** (Seedance / Nano Banana): `tools/cfai.py` starts background jobs whose webhook is
  `https://orbital-sunrise-relay.jadewang.workers.dev/hook/<HOOK_SECRET>/<job>`; it reads the secret from
  **`/tmp/work/relay/hook_secret.txt`** (one line). It must equal the **`HOOK_SECRET`** secret of the Cloudflare Worker
  `orbital-sunrise-relay` (`tools/relay/worker.js`, KV namespace binding `JOBS`). The value is not in the repo and must never
  be committed. In a fresh container: get it from her, or (her OK) generate a new one, set it as the Worker's `HOOK_SECRET`
  (Cloudflare API via the session proxy, which injects the auth, or `wrangler secret put HOOK_SECRET`) and write it to that
  file with `chmod 600`. Cloudflare auth itself needs no key (the proxy adds it).
- Frames for the renderer's plates are not in git: `tools/extract_plates.py id:take ...` with explicit ids (HANDOFF
  "Released" has the pitfalls), `tools/plate_masks.py` (~90 min on 4 cores), singing takes installed by hand (TAKES.md).

## 8. What cannot be recovered, and what needs her

- The script that built timing.json (Whisper + onset snapping + beat tracking) and its stems: lost. Replaced by editing
  tools (`timing_edit.py`) and a re-implemented separation (`vocal_stem.py`); fresh word times need her ear (or Whisper,
  if huggingface.co is reachable).
- `Orbital_Sunrise_extended_sleeve.wav` and the original stems: gone with the first container (rebuildable from the mp3
  with `extend_ending.py` + `vocal_stem.py`, not byte-identical).
- Needs her: the new lyrics and their placement, the new master (+ stem), suit/sleeve, ending/ritardando choice, which
  lines she appears in, every face/lip pick, the relay secret and gateway credit.
