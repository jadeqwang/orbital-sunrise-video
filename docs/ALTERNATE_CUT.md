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
- **New shots:** `N1_tether` ("Tied to the ship by the slightest trace": the unused plate `reach_home`, over his shoulder
  reaching for the Earth, the tether in a loose curve; "TETHER · 5.35 M") and `N2_pullback` ("Pull him back to the ship's
  embrace": I3's `airlock_exit` take run backwards, the ship taking him in). `I4_hands` now cuts on the sung "Can't"
  (25.96 s). `F2_home` types "FALL THROUGH / THE SKIES" and "bring me home" (its type mask grew to fit).
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
