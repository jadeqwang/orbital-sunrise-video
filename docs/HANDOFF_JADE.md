# Handoff: drawing Jade (read this first)

The film is done and released except for one open problem: **how Jade (the singer, the repo owner) appears in her own
scenes.** Everything else below is context for that. Written at the end of a long session so a fresh one can take over.

**Recreating or extending any generated shot** (her singing takes above all: first frames, prompts, params, lags, the
still chains, how to cut new vocal clips for an alternate cut with more lyrics): see [`docs/TAKES.md`](TAKES.md). Each final
take's inputs are archived next to it in `media/plates/<plate_id>/`.

**Alternate cut with extra lyric lines** (new mix, timing, shots to retime, release, environment rebuild): see [`docs/ALTERNATE_CUT.md`](ALTERNATE_CUT.md).

## The open problem, in her words

- Kenton (a friend) watched the release: "The rendering of you is a bit odd. I parse the face shape as a lot less attractive
  than the real you." Jade's rule: **use her Google Photos pencil portrait as the bar** (`media/chars/jade_src/photos/jade_photo_4_pencil_full.jpg`,
  a drawing of `jade_photo_3_full.jpg`, a no-makeup closet selfie). **If she can't look as good as that, take her out of
  the video entirely** (replace her shots with Leonov / drawing / space imagery).
- Every generated version so far has been "weird", "demented", "misshapen", or "someone else". Her diagnosis: image models
  pull her face toward a *really average, unattractive* face, not even a generically pretty one; they add makeup cues
  (liner, lined lips, contour) while losing what makes her face hers.

## Her face and look (facts she gave; do not "correct" them)

- **Unusually large head** (hard to find hats / bike helmets); **heart-shaped ("melon seed") face with a tapering chin**;
  **wide face** (almost no glasses frames fit); **high forehead**; the **two eyebrows are slightly different**.
- Glasses on. No makeup. Doesn't visibly age before 50: never add lines, spots, texture.
- Hair: **centre-parted, symmetrical half-up, with wispy face-framing pieces** (sometimes tucked behind an ear, sometimes
  falling forward), long and straight. As in the closet selfie / Google portrait. (This replaced an earlier "half-up with one
  face-framing piece" note.)
- Wardrobe: white cropped nylon flight jacket with a bright orange band (`media/refs/jade_outfit.jpg`), black top; her real
  **pale dusty-pink over-ear headphones** (`media/refs/jade_headphones.jpg`) in headphone scenes.
- Framing: medium (chest-up or wider), no extreme face close-ups. "Best version of myself" is fine; inventing flaws is not.
- She is an **Austin** person (not San Francisco): e.g. Pennybacker (360) Bridge overlook, Lady Bird Lake / Congress Ave
  bridge / downtown skyline. A studio must make sense: vocal booth with the mic; the mixing desk is in the control room
  behind glass, not next to the mic.
- Put new review items at the **top** of the review page; she reviews on her phone.

## Her scenes in the film (song seconds; `node video/render.mjs --list` from `video/`)

| time | shot | now uses plate | content |
|---|---|---|---|
| 0:32 | `H1d_home` | `jade_hook1_p` | "bring me home", outdoors at golden hour, singing (re-mouthed from the vocal) |
| 1:09 | `K4_home` | `jade_studio_p` | singing in a studio, headphones on |
| 1:51 | `B2_float` | `jade_notebook_p` | over-the-shoulder writing lyrics in a notebook (zoomed onto the page) |
| 1:55 | `B3_never` | `jade_brk_p` | red dusk sky, "never see what he saw ahead" |
| 2:02, 2:06 | `A1_snow`, `A2_hands` | `jade_hand_writing_p` | her hand writing (fine; take 2 has her jacket sleeve) |

The `_p` plates are Seedance clips generated from her photos; those are the ones Kenton found unattractive.

## What was tried (all on the review page, newest at the top) and how it failed

Review page: https://claude.ai/artifact/DY53es5zrPfPBkhejat4VX (source `release/review/index.html`; publish with the
Artifact tool, `root=release/review`, listing the new image files).

1. Seedance clips from generated character sheets, then from her real photos (`_p` plates): generic / unattractive.
2. First-frame stills with her real face composited in (`jade_first_*`): the face was pasted onto generated bodies at
   another angle: "demented", lopsided head.
3. The film's own renderer on her face (`?fineface` experiment in `video/src/shots.js`): even hatching over the skin reads as
   texture/age; features drawn from MediaPipe landmarks look averaged; low resolution (plates are 960x540).
4. Nano Banana pencil drawings "in the style of her portrait": prettier but made-up and not her.
5. **What she approved:** Nano Banana *tracing* photo 3 with nothing changed, told no makeup / no beautifying / keep the
   brows' difference: `media/chars/jade_src/jade_trace_base.jpg` ("base is good and accurate"). At handoff she said
   **"you can keep the one that's 'base'" "and the pencil drawings with the jacket and headphones around the neck"**:
   the keepers are the base and the two figures from #8 with the headphones round her neck,
   `media/chars/jade_src/jade_trace_jacket_hp_{1,2}.jpg` (review `bj_hp_1`, `bj_hp_2`). Build from these; treat the rest as discarded.
6. Scene edits of that trace: the model normalised her head (smaller, narrower, rounder chin, narrower glasses, less hair).
7. Pasting the traced head back onto scenes (`tools/jade_head_lock.py`, eye-aligned): "monsters" except two near-misses.
8. The base with only the jacket (+ headphones) and plain paper background (`tools/jade_base_jacket.py`, review `bj_*`):
   **"all of those are pretty good!"** This is the best result so far.
9. That figure cut out over Austin backgrounds (`tools/jade_scene_bg.py`): "superimposed on a postcard"; headphones drawn
   on her head made her head look smaller.
10. The model redrawing each whole scene with her in it, traced head pasted back (`tools/jade_integrate.py`): "the angles
    and the relative size are off".
11. Photo edits of the real selfie (jacket, headphones, plain backdrop), real face pasted back (`tools/jade_photo_edit.py`,
    review `pe_*`): "all of them are weird, and I can't figure out why".

Untested hypotheses for 9–11 (the previous session's, not conclusions): the pasted face keeps the selfie's lens
perspective and lighting (a phone at arm's length: wide-angle, close, from slightly below/front), while the model redraws
the body, headphones and scene for a normal camera distance, so head, body and scene disagree about where the camera is;
the head paste also freezes the original's light direction; in 1–2 of the photo edits the model re-posed the body.

## Directions not yet tried

- Keep **everything** from the approved figure (#8) and design each scene *for a selfie*: she is holding the phone, so a
  selfie-perspective background (close, wide, slightly from below/front) fits her pose instead of fighting it.
- Ask her for a new real photo per scene (in the jacket, in the right light/pose), traced like #5. Tracing her real photos is
  the one thing that has worked every time.
- Drop the singing close-ups: keep her only in shots that don't need her face (hands, notebook over the shoulder, back view,
  silhouette), or take her out entirely per her rule.

Show her intermediate results early and small; she reads them on her phone.

## Tools and setup

- Image/video generation: `tools/cfai.py` (`gen(model, inp, out, tag)`), Cloudflare AI via the proxy (no keys needed);
  `google/nano-banana-pro` takes at most **3** `image_input`s; `bytedance/seedance-2.5` takes `image` (first frame),
  `reference_images`, `reference_audios`. Seedance specs live in `tools/plate_specs.py`, run with `tools/plates.py <id>`.
  The gateway once ran out of credit ("Insufficient balance"); she tops it up.
- Face tools: `tools/jade_head_lock.py` (`eyes()`: MediaPipe eye centres with window search for small faces;
  `paste_onto(target, "head"|"face", src=...)`), rembg mattes. MediaPipe model: `/tmp/work/models/face_landmarker.task`
  (may need re-downloading in a fresh container).
- Pencil previews of a still in its film shot: `tools/pencil_preview.py <still>:<shot>:<t> [--hires] [--q=fineface]`.
- Plate pipeline after a new take: `tools/extract_plates.py <id>:<take>`, `tools/plate_meta.py <id> --force`,
  `tools/plate_masks.py <id>`. Generated PNGs under `media/` are gitignored; commit what must survive as JPEG.

## Done but not yet in a release

- (nothing: everything committed as a renderer default is in the 2026-09-30 release below. The two items that were listed
  here, the capsule tumbling on the first HOLD ON (`G3_hold`) and her writing hand in the jacket sleeve at 2:02
  (`jade_hand_writing_p`), were already in the 2026-09-29 release and are in this one.)

To release: full render (`cd video && node render.mjs --frames=0:243.2 --workers=4`, 5837 frames with the default time map;
the safest is to move an older `out/frames` aside and render everything, or pass `--force`), then `tools/encode_release.sh`,
`tools/package_hls.sh`, republish the watch page (https://claude.ai/artifact/TYmS3GPKvHH3f1i45QrjJ5, in batches under 58 MB)
and commit. Work on `main`. Commit messages end with the session's Co-Authored-By / Claude-Session lines.

## Update: singing works (0:32 approved)

- **Stills:** the kept drawing itself is the shot, laid on the film's Snow paper by multiply (`tools/jade_keep.py`, review `keep_a`):
  "those look accurate". Nothing about her face is redrawn or pasted.
- **Singing:** Seedance 2.5 animated from that drawing with her vocal as the lip-sync reference (`tools/jade_sing.py`). She approved
  **take 3 at timing A**: `media/chars/jade_src/sing/take3.mp4` (started from `take3_first.jpg`: centred, chest-up), played with
  **song time = 30.9 + 1.15 + clip time** (30.9 s is where `media/audio_refs/jade_hook1.mp3` starts). Review `sing_3_a`.
  It comes out portrait (834x1112); `jade_keep.video_on_paper()` lays it on the 16:9 paper in framing A with the lyric.
- What made the difference: a centred chest-up first frame, "static locked-off camera, never a face close-up", and her forehead
  and hairline spelled out. With a landscape requested (take 1) or an off-centre first frame (takes 1-2) it redrew her
  (smaller head, shrunk forehead) or pushed in to a close-up. Expression is fine with her; accuracy of the face is the bar.
- `generate_audio` must be off: Seedance flags her own song as copyrighted. The film uses her real track anyway.
- Timing varies per take (take 2 needed +1.45 s, take 3 +1.15 s): render a few shifts and let her pick by ear.
- The relay's `HOOK_SECRET` was reset this session (her OK); the new value is only in `/tmp/work/relay/hook_secret.txt` in that
  container, so a fresh container needs it set again.
- Not yet in the film: `H1d_home` still draws the old `jade_hook1_p` plate through the renderer.

## Update: 0:32 on location (current default)

- She wanted to be "actually there", not superimposed: `tools/jade_location.py` has the image model draw the Hill Country
  around her kept drawing (a selfie at an overlook), then `restore_face()` puts her own face back (the model re-inks it:
  liner-like lashes, outlined lips). She picked version 2 (`media/chars/jade_src/location/hook1_2.jpg`).
- Animated singing with `jade_sing.py --loc` (take A, `media/plates/jade_loc/take1.mp4`), then the film's pencil engine over
  it at 45% (her "1B": she liked the rotoscope over her drawing; the engine alone loses her face). Lyric top right in the sky.
- Timing by ear: **song time = 30.9 - 0.22 + take time** ("G"). Matching lips to the approved take 3 was 0.8 s off: always
  render several shifts and let her pick.
- Rejected: the faded-background variant (`jade_fade.py --head`, `?h1d=locfade`): "goofy", not the film's style.
- Open question put to her: the shot is a fuller, more coloured illustration than the sparse hatching either side of it.

## Update: 1:09 and 1:55 on location (in the film)

- 1:09 `K4_home`: plate `jade_studio_loc` (from `media/chars/jade_src/location/smic_2.jpg`: started from the jacket-only
  drawing so the headphones are only on her head; her real Sony pair matched from `media/refs/jade_headphones.jpg`; mic beside
  her face; engineer a loose sketch behind the glass; no lamp; lit from the front). Song time = 67.4 + 0.7 + take time.
- 1:55 `B3_never`: plate `jade_dusk` (from `location/dloose_1.jpg`: Lady Bird Lake trail, relit by the model for the red dusk,
  background loosened). Song time = 110.4 - 0.8 + take time; the take ends 0.36 s early and holds its last frame.
- Both: the film's pencil over the take at 45%; lyrics moved clear of her (top right / in the sky). `?k4=old`, `?b3=old`
  bring back the previous renderer-drawn takes.
- Relighting: the model may relight her; `jade_location.restore_lines(..., skip_cheeks=True)` puts back only her pencil lines
  under its light, leaving the cheeks to the scene (her drawing carries the closet's overhead glasses-shadow there).
- Her notes that shaped these: light must be consistent (no lamp behind her lighting her face), no selfie arm, headphones
  must be her real pair and not doubled on the neck, backgrounds and props "a little bit loose", no mixing desk visible.
- 1:51 notebook and 2:02/2:06 hand shots are unchanged (no face).

## Released (2026-09-30)

- Full re-render (5837 frames, 243.17 s, ritardando time map on by default) and release. In it since 2026-09-29, all renderer
  defaults (no URL flags):
  - 0:32 `H1d_home` on location (`jade_loc`, lag -0.22).
  - 0:55 `P4_airlock` at true scale: `airlock_cut` **take3** (breathing, shifting, restless legs; `?p4legs=0` = take2) and
    `airlock_side` take1, both animated.
  - 1:09 `K4_home` take **M** (`jade_rare_her_m`: Rare Earth platform, baggy dark cargo trousers, lag 0.3).
  - 1:55 `B3_never` dusk on the Lady Bird Lake trail (`jade_dusk`).
  - 2:13 / 2:20 `G2_math` / `G3_hold` portholes with the sun at constant speed across the windows.
  - Credits without the vlogbrothers line.
  - "suit" in the audio (release audio `media/audio/Orbital_Sunrise_rit_0.65.wav`, from the "suit" extended mix; checked
    against the committed m4a at the word, 53.0-53.5 s, and it differs from the mp3's "sleeve").
  - The **ritardando B** ending (see "Outro ritardando" below).
  - 3:18 `L3_madeit` "made it down" back in the original pencil style (`hatch_free`; `?l3=drawn` / `soft` are the alternatives).
  - Carried over from 2026-09-29: the first-HOLD-ON tumble and the jacket-sleeve writing hand (take 4).
- Files: `release/Orbital_Sunrise_1080p.mp4` (HEVC, 94.1 MB) and `release/Orbital_Sunrise_720p_h264.mp4` (H.264, 90.3 MB),
  both 243.17 s; `release/audio/Orbital_Sunrise.mp3` was already the rit/"suit" mix (unchanged). HLS in `release/web/`
  (not committed: hevc 41 segments / 144 MB, avc 41 / 87 MB). Watch page https://claude.ai/artifact/TYmS3GPKvHH3f1i45QrjJ5
  republished in five batches under 58 MB (page: running time 4:03, the Ending line mentions the slowing outro; poster.jpg and
  making_of.jpg left as they were).
- Render: ~21 min on 4 workers (+ the airlock span rendered last, after the legs take landed); encodes + HLS ~36 min.
  All plates were already installed; `airlock_cut` / `airlock_cut_t2` had been reinstalled from take3 / take2 by
  `tools/airlock_stills.py` in this checkout. The native-size location plates (`jade_loc`, `jade_rare_her_m`, `jade_dusk`, ...)
  have no meta.json; the page's 404s for those at load are expected.

## Released (2026-09-29)

- Full render and release with her three singing shots on location, the 2:02 writing hand take 4, and the first-HOLD-ON
  tumble. Watch page https://claude.ai/artifact/TYmS3GPKvHH3f1i45QrjJ5 republished in five batches under 58 MB.
- Rebuilding a fresh container for a render: `tools/extract_plates.py id:take ...` with explicit ids (never bare: it would
  squash the 1280x720 / portrait jade_* location plates, and it deletes each folder's committed meta.json/stats.json, so
  `git checkout -- $(git ls-files --deleted video/plates)` afterwards, and restore index.json); leg_* stills from
  media/stills; `pip install rembg onnxruntime soundfile`; `tools/plate_masks.py` (~90 min on 4 cores);
  `tools/install_drawing.py` needs her photo at media/refs/leonov_drawing_real_photo.jpg (not committed);
  `tools/extend_ending.py`. The container had no ffprobe: a duration-only stand-in at /usr/local/bin/ffprobe was enough.

## Outro ritardando (approved 2026-09-30, released 2026-09-30)

- She approved **ritardando B** for the piano outro: `media/audio/Orbital_Sunrise_rit_0.65.wav` (243.17 s), made by
  `tools/ritardando.py --vmin=0.65 --start=228.36 --out=media/audio/Orbital_Sunrise_rit_0.65.wav` from the "suit" release mix
  `media/audio/Orbital_Sunrise_extended.wav` (the WAVs are gitignored; `Orbital_Sunrise_rit_0.65.m4a` is the committed
  fallback). **Never rebuild audio from the mp3** (it says "sleeve").
- The picture follows the slowed music: **film (output) time u is drawn from song time s(u)**. `video/data/timemap.json`
  (written by `python3 tools/timemap.py media/audio/Orbital_Sunrise_rit_0.65.map.json` from ritardando.py's map) holds
  [[s, u], ...]: identity until ~228.9 s (the map is rounded to 1 ms), then the ritardando; after the final chord (song
  234.70 s, film 235.64 s) a constant +0.948 s shift, so the ring-out and the title fade are unchanged. `video/src/main.js`
  `renderFrame(u)` maps it (`songAt` / `outAt`); the 12-per-second drawing clock runs in film time, so the outro stays on twos.
  Shots are still written in song time; frames before 228.9 s are byte-identical to the unmapped render.
- All render.mjs times (`--frames`, `--clip`, `--sheet`, `--stills`, frame i / 24) are now **film time**; `--list` prints song
  times with the film times in brackets where they differ. Default audio for `--clip` / `--encode` is the time map's
  (`Orbital_Sunrise_rit_0.65.wav`, else the .m4a). The film is 243.17 s = **5837 frames** (was 242.22 s / 5814):
  `node render.mjs --frames=0:243.2 --workers=4`.
- **Off switch:** `node render.mjs ... --norit` (and `studio.html?norit`) reproduces the old film exactly (song time = film
  time, the unslowed extended mix, 5814 frames); release it with `NORIT=1 tools/encode_release.sh` /
  `NORIT=1 tools/package_hls.sh`. Both scripts take `AUDIO=...` too and refuse to run when the frame count in
  `video/out/frames` does not match the audio's length (frames from the other mode).
- To try another ritardando: run ritardando.py with other settings, then `tools/timemap.py <its .map.json>`; render.mjs and the
  page pick up the new map and audio from `video/data/timemap.json`.

## Round 4 (2026-10-01): her notes on 0:14, 0:33, 0:44 (stills for review; no full render yet)

- 0:44 `H1d_home`: relit for broad daylight per frame (`jade_loc_day`, `tools/jade_relight.py`; the approved take's lips and
  lag unchanged), looser edges; `?h1d=loc` brings back the golden hour. Details in TAKES.md.
- 0:14 `N1_tether` / 0:33 `I6_predawn`: new takes of `tether_drift` / `countdown_drift` (TAKES.md "Round 4 takes").
