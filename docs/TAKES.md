# Takes: how every generated shot was made, and how to remake or extend it

Written for a future session that has to recreate a shot, extend a clip, or cut an alternate version with more lyrics
(she wants to try one). Read `docs/HANDOFF_JADE.md` first for her likeness rules and the history; this file is the
recipe book. Everything here was checked against `media/genlog.jsonl` and the files on disk on 2026-09-30.

## Where things are

Each final take is archived next to its video, in `media/plates/<plate_id>/` (the existing convention):

| file | what |
|---|---|
| `takeN.mp4` | the take exactly as the model returned it (committed with `git add -f`; `.gitignore` hides takes) |
| `takeN.first.jpg` | the **exact** first-frame file sent as Seedance `image` (byte-identical: its data-URI length matches the genlog) |
| `takeN.ref_*.png` | any `reference_images` sent, byte-identical |
| `takeN.prompt.txt` | the exact prompt sent (from the genlog) |
| `takeN.params.json` | every other input (duration, resolution, aspect, `generate_audio`, `use_virtual_avatar`, audio / video refs), the genlog line, the song-time formula and lag she picked, how the renderer uses it, the command that remakes it |
| `takeN.chain.json` / `still.chain.json` | the still-image chain that made the first frame: every Nano Banana step with its full prompt, its inputs (repo paths) and its output, plus the local steps (face restore, resize, crop) |
| `chain/*.jpg` | chain images that were not in the repo before (JPEG q95, 1920 wide; the early airlock rounds 1280 wide) |
| `takeN.json`, `takeN.sheet.jpg` | older plates (`tools/plates.py`) already had these: the spec and a contact sheet |

The model PNGs themselves were only ever in the session scratchpad; the repo keeps JPEGs of them (`*_model.jpg` in
`media/chars/jade_src/location/`, and the `chain/` folders). `.png` under `media/` is gitignored; the one PNG that matters
byte-for-byte (take M's trousers reference) is force-added.

**Seeds:** no seed is sent (the Cloudflare `bytedance/seedance-2.5` and `google/nano-banana-pro` inputs used here have none).
Re-running any recipe gives a *new* take in the same spirit, never the same pixels. Keep the takes.

### The genlog

`tools/cfai.py gen()` appends every model call to `media/genlog.jsonl`: `t`, `tag`, `model`, `input` (prompt in full; images
and audio replaced by `data:<mime>;base64,<first bytes>...(<N> chars)`), `out`, `secs`. The blobs are truncated, so images
**cannot** be decoded from it. To find which file was sent, match the length: a file of `s` bytes gives
`len("data:<mime>;base64,") + 4*ceil(s/3)` chars (mime from the extension; `cfai.data_uri` sends the bytes as they are, so a
`.png` path that holds JPEG data still says `image/png`). That is how every input below was identified; where two files
have the same size (e.g. `jade_hook1.mp3` and `jade_hook2.mp3`, both 123273 bytes) the scene in `tools/jade_sing.py` decides.
Useful tags: `jade_sing` (her singing takes), `jade_location` / `jade_location_fix` (her stills), `airlock_scale`,
`airlock_arm`, `airlock_alive_*` (airlock stills / takes), `human_draw`, `drawn_plate`, `plate:<id>` (`tools/plates.py`).

## Her rules (from `docs/HANDOFF_JADE.md`; they decide what gets approved)

- Bar: her Google Photos pencil portrait (`media/chars/jade_src/photos/jade_photo_4_pencil_full.jpg`). If she can't look that
  good, take her out of the shot.
- Unusually large head; wide, heart-shaped ("melon seed") face with a tapering chin; high forehead; the two eyebrows differ;
  glasses on; no makeup; never add age, lines or texture. Hair centre-parted, symmetrical half-up, wispy face-framing pieces.
- White cropped nylon flight jacket with the orange band, black top; her real **pale dusty-pink** over-ear headphones
  (`media/refs/jade_headphones.jpg`), on her head *or* round her neck, never both.
- Medium framing (chest-up or wider), never a face close-up. Austin, not San Francisco. Light must be consistent (no lamp
  behind her lighting her face), no selfie arm, backgrounds and props "a little bit loose", no mixing desk next to the mic.
- Everything of her comes from **her approved drawings**: `media/chars/jade_src/jade_trace_base.jpg` and the two figures
  with the jacket, `jade_trace_jacket_hp_1.jpg` (headphones round the neck) and `jade_trace_jacket_plain_1.jpg`. Tracing a real
  photo of hers is the only thing that has worked every time.
- She reviews on her phone; new items go at the top of the review page; always offer several lip timings.

## Lessons (what went wrong and what fixed it)

- **The image model shrinks and "averages" her head whenever it redraws her.** Changing her pose (arms spread, turning her
  body) in a still made her head smaller and narrower every time (review `apose_*`, `one_*`, `turn_*`: rejected). What worked:
  keep her arms down in the still and **let the video model move them** (take F's prompt asks her to lift and spread her arms).
- Check head scale numerically: MediaPipe face landmarks (`tools/jade_head_lock.py eyes()`, `jade_location.face_landmarks`;
  model `/tmp/work/models/face_landmarker.task`, re-download in a fresh container) — compare eye distance / face-oval size to
  the approved drawing; `jade_location.check()` measures change over her head box.
- **Never paste her face in at another angle or from another photo** ("demented", "monsters"). Only put back *her own lines
  from the same picture at the same place*: `restore_face()` (0:32) or `restore_lines(..., skip_cheeks=True)` when the model
  relit her (1:09 studio, 1:55 dusk).
- Seedance: a **centred, chest-up first frame** and "static locked-off camera, never a face close-up" keep her face; an
  off-centre frame or a landscape request made it redraw her. Spell out her forehead and hairline in the prompt.
- `generate_audio` must be **off** (Seedance flags her song as copyrighted); the film uses the real track.
- `use_virtual_avatar: true` is the default in `jade_sing.py`; `--no-avatar` was tried for every scene ("take b") and lost.
- To keep a take's motion but change something (her trousers for take M): pass the approved take as **`reference_videos`**
  (a public URL: `raw.githubusercontent.com/...`) and the change as a `reference_images` crop, and say "take only the motion".
- Lip timing drifts per take (0.2–1.5 s): always render **5 options 0.2 s apart** and let her pick by ear.
- Audio: the release mix says "through the **suit** he wore" (`tools/suit_splice.py`). Rebuild the render WAV from the
  committed **`media/audio/Orbital_Sunrise_extended.m4a`** ("suit"), never from `Orbital_Sunrise.mp3` ("sleeve";
  `tools/extend_ending.py` warns). Release audio: `media/audio/Orbital_Sunrise_rit_0.65.wav` (the ritardando outro,
  `tools/ritardando.py`, map in `Orbital_Sunrise_rit_0.65.map.json`; song times before 3:40 are unchanged) →
  `release/audio/Orbital_Sunrise.mp3`.
- Third-party reference photos help the image model (true-scale airlock, a trouser silhouette) but must **not** be committed
  to this public repo; describe them (see "Not committed" below).

## Her singing shots (vocals)

Song time → take time: `take time = song time − (clip start + lag)`, where the clip start is where the vocal reference clip
begins in the song and the lag is her pick by ear. `?…lag=` in the renderer URL tries other lags live.

### 0:32 · `H1d_home` · "bring me home" · plate `jade_loc` (default)

- Shows: her kept drawing on location, a selfie at a Hill Country overlook at golden hour, singing; the film's pencil over it
  at 45 %, lyric top right in the sky.
- Take: `media/plates/jade_loc/take1.mp4` (session `loc_take_a`, genlog line 275, 1280x720, 5 s). Her pick; the no-avatar
  take b lost.
- First frame: `take1.first.jpg` (= `media/chars/jade_src/sing/loc_first.jpg` = `location/hook1_2.jpg`).
- Chain (`take1.chain.json`): `jade_src/sing/take3_first.jpg` (her `jade_trace_jacket_hp_1` drawing laid on Snow paper, centred
  chest-up, 1280x720; `tools/jade_keep.py` `graphite()`/`place()`) → `tools/jade_location.py` `SCENES["hook1"]`
  (`python3 tools/jade_location.py take3_first.jpg <prefix> 2 hook1`) → her pick `loc_2` (`location/hook1_2_model.jpg`) →
  `restore_face(take3_first.jpg, loc_2.png, hook1_2.jpg)` (reproduced to 0.18/255).
- Recreate: `python3 tools/jade_sing.py media/plates/jade_loc/take1.first.jpg out.mp4 --loc` (prompt = `PROMPT + LOC`;
  vocal `media/audio_refs/jade_hook1.mp3`; 5 s, 720p, 16:9, no audio, avatar on). Checked: the script rebuilds the logged
  prompt exactly.
- Timing: clip start 30.9, **lag −0.22** (her "G"): take time = t − 30.68. (`?h1dlag=`)
- Wiring: `video/src/shots.js` `H1d_home`: `paperTake('jade_loc', tp)` then `drawPlate(...)` at alpha .45. Flags `?h1d=over`
  / `plain` (the plain-paper take below), `?h1d=js`, `?h1d=locfade` (rejected "goofy").
- Alternative kept: `jade_sing3` = her approved plain-paper **take 3** (genlog 269, first frame `jade_sing3/take1.first.jpg`,
  `python3 tools/jade_sing.py <first> out.mp4`, lag +1.15, came out portrait 834x1112).

### 1:09 · `K4_home` · "bring me home" · plate `jade_rare_her_m` = take **M** (default)

- Shows: her Rare Earth nod: on an open tower platform above the clouds at night under stars, in the jacket, pink
  headphones on her head, baggy near-black cargo trousers; she slowly lifts and spreads her arms while singing; camera eases
  back. Film pencil over it at 45 %; lyric top right with a cream halo.
- Take: `media/plates/jade_rare_her_m/take1.mp4` (session `sep_take_m2`, genlog line 507). Take F's motion, which she picked,
  in the baggy trousers Kenton liked (take F wore grey-blue work trousers). Take `n` (line 502) had the same inputs.
- First frame: `take1.first.jpg` (the only copy; was scratchpad `re/sep_first.jpg`) = `sep_2.png` resized to 1920x1080.
- Reference image: `take1.ref_pants_ok.png` (592x716), an exact crop (x 1114–1706, y 820–1536) of our own generated
  `sdp_1.png` (`chain/sdp_1.jpg`): trousers only.
- Reference video: take F, `https://raw.githubusercontent.com/jadeqwang/orbital-sunrise-video/main/media/plates/jade_rare_her/take1.mp4`.
- Chain (`take1.chain.json`, and take F's `media/plates/jade_rare_her/take1.chain.json` for the shared part):
  `location/smic_2.jpg` (the approved studio still) → `FIXES["rare_setting"]` (+ `media/refs/rare_earth/re_6.jpg`) →
  `set_1` (restored: `location/rare_set_1.jpg`) → local: shrunk to ~62 % onto a plain cream page (`chain/wide_in.jpg`) →
  `rare_wider` → `wide_2` → `rare_wider_fix` → `wfix_1` → `rare_arm_shadow` → `warm_1` → `rare_no_rail` (+ `re_6.jpg`) →
  `norail_2` → `rare_setting_pants` (+ `rare_earth/anime_ref.jpg`) → **`sp_2`** (`jade_rare_her/chain/sp_2.jpg`) →
  `FIXES["rare_stars_baggy_pants"]` (+ a third-party trouser crop, not committed) → `sep_2` → 1920 JPEG.
  Each step is `jade_location.fix(edited, prefix, "<name>", extra=[...], n=2..4)` (Nano Banana Pro, 16:9, 2K, PNG).
- Recreate: `python3 tools/jade_sing.py media/plates/jade_rare_her_m/take1.first.jpg out.mp4 --scene=rare_her_anime
  --ref=media/plates/jade_rare_her_m/take1.ref_pants_ok.png --refvideo=https://raw.githubusercontent.com/jadeqwang/orbital-sunrise-video/main/media/plates/jade_rare_her/take1.mp4`
  (vocal `jade_hook2.mp3`, 5 s; verified to rebuild the logged prompt exactly).
- Timing: clip start 67.4, **lag 0.3** (her "B" of 0.1/0.3/0.5/0.7/0.9): take time = t − 67.7. (`?k4lag=`)
- Wiring: `video/src/shots.js` `K4_home`, `paperTake(id)` + `drawPlate` at .45. `?k4=F` → `jade_rare_her` (lag .5),
  `?k4=studio` → `jade_studio_loc` (lag .7), `?k4=old` → the renderer-drawn `jade_studio_p`.

#### Alternatives kept for 1:09

- **Take F** `jade_rare_her` (genlog lines 405/406 are the same job logged twice): first frame `take1.first.jpg`
  (= `sing/rare_her_stars_first.jpg` = `stp_4` at 1920) from `sp_2` → `FIXES["rare_stars_pants"]`;
  `python3 tools/jade_sing.py <first> out.mp4 --scene=rare_her`; lag 0.5.
- **Vocal booth** `jade_studio_loc` (genlog 307): first frame `location/smic_2.jpg`; chain `sing/plain_first.jpg` (the
  jacket-only drawing on Snow paper) → `SCENES["studio2"]` → `studio_fix` (+`jade_trace_jacket_hp_1.jpg`) → `studio_fix2`
  (+ hp_1 + `media/refs/jade_headphones.jpg`) → `s2a_1` (`jade_studio_loc/chain/s2a_1.jpg`) → `loosen_ref` (+ hp_1 +
  plain_1) → `slooser_1` → `loosen_mic` → `smic_2` → `restore_lines(plain_first.jpg, smic_2.png, smic_2.jpg, skip_cheeks=True)`
  (reproduced to 0.16/255). `python3 tools/jade_sing.py <first> out.mp4 --scene=studio`; lag 0.7 (her "A").

### 1:51 · `B2_float` · "I'll never float where the sky turns red" · plate `jade_notebook_p`

- Shows: over the shoulder, her hand writing in a leather notebook; the renderer pushes onto the page (zoom 2.3→2.75) and
  handwrites the lyric along the page (`NB_*` plate coordinates). No face, so it was never redone.
- Take 1 (genlog 193, `tools/plates.py jade_notebook_p`, spec in `tools/plate_specs.py`, refs `JP_REFS` = her photos 5, 6,
  14 + `jade_outfit.jpg` + `jade_headphones.jpg`, all committed). `take1.prompt.txt` / `take1.params.json` added.

### 1:55 · `B3_never` · "never see what he saw ahead" · plate `jade_dusk`

- Shows: her kept drawing on the Lady Bird Lake trail at red dusk, relit by the scene, skyline loose; singing, eyes lifting.
- Take: `media/plates/jade_dusk/take1.mp4` (session `dusk2_a`, genlog line 305, 8 s). Her pick "1:55 · 1".
- First frame: `take1.first.jpg` (= `sing/dusk_first.jpg` = `location/dloose_1.jpg`).
- Chain: `sing/take3_first.jpg` → `SCENES["dusk_trail_lit"]` → `dtrail_2` → `FIXES["dusk_fix"]` → `d2fix_1` (restored:
  `location/d2fix_1.jpg`) → `FIXES["loosen"]` → `dloose_1` → `restore_lines(take3_first.jpg, dloose_1.png, dloose_1.jpg,
  skip_cheeks=True)` (reproduced to 0.25/255).
- Recreate: `python3 tools/jade_sing.py media/plates/jade_dusk/take1.first.jpg out.mp4 --scene=dusk` (vocal `jade_brk.mp3`, 8 s).
- Timing: clip start 110.4, **lag −0.8**: take time = t − 109.6; the take ends 0.36 s before the shot and holds its last
  frame. (`?b3lag=`; `?b3=old` → `jade_brk_p`.) Wiring: `video/src/shots2.js` `B3_never`.

### 2:01–2:10 · `A1_snow` (second half) and `A2_hands` (right half) · plate `jade_hand_writing_p` take 4

- Shows: her hand in the jacket sleeve writing the lyric in her notebook; the renderer writes "Art is a landing / in the
  snow" on the blank page (`HW_*`, offset `[-3, -16]` for take 4).
- Take 4 (genlog 310): image-to-video from `take4.first.jpg` (= `media/refs/jade_hand_sleeve_from_take2.jpg`, recovered
  from take 2's contact sheet), no reference image (take 3 with one came out portrait). `python3 tools/plates.py jade_hand_writing_p`.

## Other generated plates

### 0:55 · `P4_airlock` · `airlock_cut`, `airlock_side` (true-scale Volga) — IN FLUX

Another session is re-taking these right now (genlog lines 508–511, tags `airlock_alive_cut` / `airlock_alive_side`, from the
same stills; `tools/airlock_stills.py` gains a `TAKES` table with the prompts and `--gen <id>`; `video/plates/index.json` will
point at `airlock_cut` take2 and `airlock_side` take1). Check `git log -- media/plates/airlock_cut media/plates/airlock_side`
for the current takes; what is archived here is what was committed at `a1de1c5`:

- Stills: `media/plates/airlock_cut/still.jpg` = Nano Banana `v15_1` (side cutaway, he lies full length in a ~1 m tube);
  `media/plates/airlock_side/still.jpg` = `v16_1` (inside, wall a hand's width above his visor, glove on the wall).
  Chains in `still.chain.json`: `video/plates/tube_struggle/f0001.jpg` + `f0180.jpg` (frames of the old take) → rounds
  v2–v9 (with the Volga trainer photos, not committed) → `v10_A1_1` (close inside view) → cutaway: `v13A1` (+ Volga
  construction reference) → local lengthening `v13A1_long` (shrunk onto a wider canvas, right hatch moved right, gap blocked
  in tan) → `v15_1`; inside: `v13B2` → `v14D2` → `v16_1` (+ `v10_A1_1`). The full prompt of every step is in the chain
  files (the session's generator scripts were ad hoc; the genlog is the record).
- `airlock_cut/take1.mp4` (session `arm4`, genlog line 506): he slides one arm up the wall to the hatch; image = `still.jpg`,
  5 s; prompt in `take1.prompt.txt`. `python3 tools/airlock_stills.py --gen` then `python3 tools/airlock_stills.py airlock_cut`
  (registers every frame onto the still, re-tones for the night pencil, mattes the arm, installs 1920x1080 frames).
- Wiring: `video/src/shots.js` `P4_airlock` (`?p4arm=0` still only, `?p4=old` the old `tube_struggle` take).

### 3:18 · `L3_madeit` alternative · `hatch_drawn` (`?l3=drawn`, `?l3=soft`)

Kenton's "what a human would draw" test: a frame of `hatch_free` (`chain/hatch_free.jpg`) → `tools/human_draw.py` → her
pick `hatch_hd_2` (`media/refs/human_draw/hatch_hd_2.jpg`) → 1280x720 first frame (`take1.first.jpg`) →
`python3 tools/drawn_plate.py <first> out.mp4 8 "<action in take1.params.json>"` (genlog 328). `hatch_drawn_soft` is the same
take toned to its neighbours. Not the default (`hatch_free` is).

### Everything else (the Seedance plates the pencil renderer redraws)

These were made by `tools/plates.py <id>` from `tools/plate_specs.py`; each final take already has `takeN.json` (the spec:
prompt, duration, ref keys) and `takeN.sheet.jpg` next to it. The ref keys map (`plate_specs.R`) to character / set sheets
at `media/chars/*.png`, `media/env/*.png`, which are **not in the repo** (gitignored PNGs); their JPEG copies are in
`media/archive/sheets/` (`leonov_turnaround`, `leonov_faces`, `belyayev_turnaround`, `belyayev_faces`, `env_voskhod2_orbit`,
`env_capsule_interior`, `env_volga_tube`, `env_taiga_landing`). To re-run a spec, convert those to the PNG paths
(`python3 -c "from PIL import Image; Image.open('media/archive/sheets/leonov_faces.jpg').save('media/chars/leonov_faces.png')"`)
— close to, not identical with, what was sent. Final take per plate is `video/plates/index.json` `take`.

| plate | take | shots |
|---|---|---|
| `hero_sunrise` | 1 | I1_poster, I6_predawn, H1a_sunrise, D1, D5 |
| `airlock_exit` | 1 | I3_firstman, D5 |
| `glove_cu` | 1 | I4_hands, P4 flurry, D5 |
| `visor_cu` | 1 | I5_face, P4 flurry, D5 |
| `visor_sunrise` | 1 | H1b_gold |
| `ship_wide_sunrise` | 1 | H1c_wide, D1, D5 |
| `camera_reach` | 1 | S1_reach |
| `suit_balloon` | 1 | S2_balloon, P4 flurry |
| `airlock_struggle` | 1 | S3_nofit |
| `valve_bleed` | 2 | P1_bleed, P4 flurry, B1_split |
| `tumble_slow` | 1 | P2_edge, B1_split |
| `headfirst` | 1 | P3_sleeve |
| `tube_struggle` | 2 | P4_airlock `?p4=old` |
| `porthole_sunrise` | 1 | K1_porthole, D1, D5 |
| `helmet_off` | 1 | K2_gold, D5 |
| `airlock_jettison` | 1 | K3_jettison |
| `capsule_glide`, `globus` | 1 | D1_voskhod, D5 |
| `leonov_turn`, `belyayev_turn` | 1 | D2, D3 (+D5) |
| `drawing_pencils` | 1 | D4_drawing, D5 |
| `drawing_hand` | 2 | B1_split |
| `leonov_drawing_hand` | 4 | A1_snow, A2_hands |
| `porthole_spin` | 1 | G1_failed, G2_math |
| `vzor_manual`, `capsule_spin` | 1 | G2_math |
| `g_force` | 1 | G2_math, G3_hold |
| `reentry_fire` | 1 | F1_reentry |
| `reentry_outside` | 2 | F1_reentry, F2_home |
| `parachute` | 1 | E1_chute |
| `descent_forest` | 1 | E3_offcourse, O1_klicks |
| `treetops` | 1 | O2, O3, L1_impact |
| `hatch_tree` | 2 | L2_home |
| `hatch_free` | 2 | L3_madeit |
| `fire_night_v2` | 1 | L4_fire |
| `drawing_survives_v2` | 2 | L5_survived |
| `rescue_v2` | 2 | L6_rescue |

### Round 3 plates (2026-09-30, not yet wired into shots)

Specs in `tools/plate_specs.py` (round 3), made with `python3 tools/plates.py <id>`; each take has `takeN.prompt.txt`,
`takeN.params.json` (genlog line, inputs, intended use) and, where it continues an existing take, `takeN.first.jpg`.

| plate | take | what | from |
|---|---|---|---|
| `hand_over_hand` | 2 (7 s) | he hauls himself back along the tether hand over hand and stops gripping the Volga rim, outside (no entry; S3/P3 do that). Take 1 (archived json/sheet) read as a rigid pole and ended head-in-the-mouth | refs LT, LF, SHIP |
| `tether_drift` | 1 (8 s) | N1 "by the slightest trace": he drifts away from the ship until the tether goes taut, same framing as `ship_wide_sunrise` | first frame = `ship_wide_sunrise` take1 frame 1 |
| `countdown_drift` | 1 (5 s) | I6 countdown: gentle drift of him and the coiled tether, orbital night, no sunrise (gain pinned to hero_sunrise's 1.38) | first frame = `hero_sunrise` take1 frame 1 |
| `card_by_fire` | 1 (6 s) | L5: he takes a small flat card (not a folded sheet, FACTS §4) from his lining by the fire and smiles; push-in onto the card | first frame = `fire_night_v2` take1 at 2.2 s; refs DRAW, LF |

New legacy stills (`tools/legacy_stills.py`, round 3): `leg_tiangong` (T-shaped Tiangong, take 2: take 1 had a hard edge on
the Earth), `leg_shenzhou7` (Zhai Zhigang in Feitian waving the flag, Liu Boming in Orlan-M at the hatch, 27 Sep 2008;
replaces `leg_yang_liwei`), `leg_curiosity` (sky crane touchdown, Gale Crater, 6 Aug 2012 UTC).

Stills (`leg_*`, `leonov_drawing`) come from `media/stills/` (`tools/legacy_stills.py`, `tools/install_drawing.py`).
`leonov_drawing_hand` take 4 and `drawing_hand` take 2 used references (`DRAW`, `DRAWPH`, first frame `DRAWFF` =
`media/refs/leonov_drawing_real_cabin_frame.png`) whose sent versions are gone (the museum photo is deliberately not
committed; the card and cabin frame were replaced/never committed); the takes themselves are committed.

## Installing a take into the renderer

- The singing / location takes (1280x720, `mattes: false`) are installed at native size, **not** with
  `tools/extract_plates.py` (it scales to 960x540 and deletes committed meta/stats):
  ```
  mkdir -p video/plates/<id> && ffmpeg -i media/plates/<id>/take1.mp4 -vf fps=24 -q:v 3 video/plates/<id>/f%04d.jpg
  ```
  then add to `video/plates/index.json`:
  `"<id>": {"n": <frames>, "fps": 24, "w": 1280, "h": 720, "take": "take1.mp4", "mattes": false, "gain": 1.0}`
  (5 s → 121 frames, 8 s → 193). Frames are not committed; `index.json` is.
- The older 960x540 plates: `python3 tools/extract_plates.py <id>:<take>` (always with explicit ids), `tools/plate_meta.py <id>
  --force`, `tools/plate_masks.py <id>`; then `git checkout -- $(git ls-files --deleted video/plates)` and restore `index.json`.
- Airlock plates: `python3 tools/airlock_stills.py <id>`.
- Preview a frame: `node video/render.mjs --list` for shot times; `tools/pencil_preview.py <still>:<shot>:<t>`.

## Timing by ear (lips)

1. Render the take with the song under it at several lags, 0.2 s apart (what was done: `re/lags.sh`):
   ```
   for L in 0.1 0.3 0.5 0.7 0.9; do ss=$(python3 -c "print(round(67.4+$L,2))")
     ffmpeg -y -i take.mp4 -ss $ss -t 5.04 -i media/audio/Orbital_Sunrise_extended.wav -map 0:v -map 1:a \
       -c:v libx264 -crf 22 -pix_fmt yuv420p -c:a aac -b:a 160k -shortest -movflags +faststart take_lag$L.mp4; done
   ```
   (`Orbital_Sunrise_extended.wav` = `ffmpeg -i media/audio/Orbital_Sunrise_extended.m4a -ar 48000 ...wav`, the "suit" mix.)
   Centre the five on a first estimate (lip closures on "b"/"m"; `tools/mouth_track.py` / `tools/lipsync.py` can estimate).
2. Put them on the review page as A–E ("picture 0.4 s earlier … 0.4 s later") and let her pick on her phone.
3. Set the lag default in the shot (`?…lag=` lets her try others in the preview).

## Extending a clip, or adding lyrics (alternate cut)

**Limits seen in this setup:** Seedance 2.5 via `tools/cfai.py`: 720p, 16:9 requested (portrait output happens when the
first frame is portrait), durations **5–12 s** were accepted (5, 6, 7, 8, 10, 12 in the genlog; `jade_hook3`/`jade_art`
ran 12 s). `tools/jade_sing.py` fixes the duration per scene (5 s, dusk 8 s): edit `SCENES[...]` (or `dur`) for longer.
Takes cost ~3–6 minutes each (`secs` in the genlog); run 2–4 in parallel. The gateway once ran out of credit ("Insufficient
balance"): she tops it up.

**A longer or new sung line** (e.g. an alternate cut with more lyrics; the whole pipeline around it, from the new mix and
timing.json to shots with absolute times and the release, is in [`ALTERNATE_CUT.md`](ALTERNATE_CUT.md)):
1. Find the words' times in `video/data/timing.json` (`lines[].words` = `[time, word]`) and `Orbital_Sunrise_Lyrics.md`.
2. Cut the vocal reference from the song at the new start. The existing clips are **full-mix excerpts** of
   `Orbital_Sunrise.mp3` (repo root) — not stems — verified by cross-correlation: `jade_hook1.mp3` starts at 30.9 s (5 s),
   `jade_hook2.mp3` 67.4 s (5 s), `jade_brk.mp3` 110.4 s (8 s), `jade_art.mp3` 118.4 s (12 s), `jade_hook3.mp3` 142.9 s (12 s);
   44.1 kHz stereo 192 kb/s MP3:
   ```
   ffmpeg -ss <start> -t <secs> -i media/audio/Orbital_Sunrise_extended.wav -ar 44100 -ac 2 -c:a libmp3lame -b:a 192k media/audio_refs/jade_<name>.mp3
   ```
   Use the "suit" WAV (decoded from the m4a) for anything around 0:52–0:55; elsewhere the two mixes are identical. The clip
   length should equal the take duration you request.
3. Add a `SCENES` entry in `tools/jade_sing.py` (vocal clip, seconds, the exact words, headphones on/neck, the place) —
   copy the closest existing one; the words must be the words in the clip.
4. First frame: reuse an archived first frame for the same place (consistency), or build a new still from her approved
   drawings with `tools/jade_location.py` (a new `SCENES`/`FIXES` entry; start from `sing/take3_first.jpg` (headphones round the
   neck) or `sing/plain_first.jpg` (none), keep her arms down, restore her lines, check head size).
5. Generate 2–4 takes, pick the one that keeps her face, then the 5-lag listening test; set `take time = t − (start + lag)`.

**Extending an existing take:**
- *Continuation:* extract the take's last frame (`ffmpeg -sseof -0.05 -i take1.mp4 -frames:v 1 last.jpg`, or at the frame you
  want to cut on) and use it as the next call's `image`, same prompt, the vocal clip that starts where the take's audio ends
  (clip start + take length). Crossfade or hard-cut at that frame. Watch for her head drifting smaller over chained takes:
  re-check landmarks against the first frame.
- *Longer in one go:* same first frame, `duration` up to 12, a clip of that length; lips must be re-timed (new take).
- *Same motion, new detail:* pass the approved take as `reference_videos` (it must be a public URL: commit and push it, then
  `https://raw.githubusercontent.com/jadeqwang/orbital-sunrise-video/main/media/plates/<id>/take1.mp4`) with
  `--refvideo=`; this is how take M copied take F.
- *Just hold:* the renderer holds the last frame when a shot outlasts its take (1:55 does this for 0.36 s).

## Not committed (third-party references; described instead)

| used in | what | source |
|---|---|---|
| airlock stills v6, v7, v12 (image 1/2) | photo of the Volga inflatable airlock trainer (full view) | Flickr, rocbolt, photo 47829983051 |
| airlock stills v9–v11 | a close crop of that same trainer photo | same |
| airlock stills v13–v15 | a construction view of the Volga airlock (rings, fabric sleeve, hatch) | RussianSpaceWeb (Anatoly Zak) / RSC Energia material on Voskhod-2 |
| 1:09 take M still (`sep_*`, `sbp_*`, `scp_*`, `sdp_*`) | crops of a K-pop dancer's baggy dark cargo / parachute trousers (`pants_ref*.png`) | web image search; not recorded |
| (mentioned by the owner) | Kill Bill stills | not found in this container or the genlog; never an input to a final take |

The Rare Earth anime stills (`media/refs/rare_earth/*`, used for the 1:09 setting and the trouser silhouette) were already in
the repo and are left as they are. `media/refs/leonov_drawing_real_photo.jpg` (museum photo) stays uncommitted.

## Could not be recovered

- Exact bytes of any image sent to a model that lived only in the scratchpad: the model PNGs are archived as JPEGs, so a
  re-run of a chain step from them is close but not identical. The first frames and take M's reference PNG are exact.
- How `sing/take3_first.jpg` / `plain_first.jpg` were placed on the paper (scale/offset) and how `hatch_hd_2_first.jpg` was
  cropped: not recorded; the files themselves are committed, so nothing downstream depends on it.
- `leonov_drawing_hand` take 4 / `drawing_hand` take 2 references (see above).
