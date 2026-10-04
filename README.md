# ORBITAL SUNRISE — music video

**Song and lyrics:** Jade Wang
**Narrative arc:** inspired by John Green's essay *Orbital Sunrise* (*The Anthropocene Reviewed*)
**Video:** every frame drawn in colored pencil by JavaScript

* ▶ **[`release/Orbital_Sunrise_1080p.mp4`](release/Orbital_Sunrise_1080p.mp4)** — 1920×1080, 24 fps, 4:02, HEVC
* [`release/Orbital_Sunrise_720p_h264.mp4`](release/Orbital_Sunrise_720p_h264.mp4) — 1280×720, H.264, for players and sites that need H.264
* **Extended cut** (this branch; the re-recorded extended mix, two new intro lines, her round 1–5 notes; 4:12, 252.28 s):
  [`release/extended/Orbital_Sunrise_extended_1080p.mp4`](release/extended/Orbital_Sunrise_extended_1080p.mp4) (HEVC) and
  [`release/extended/Orbital_Sunrise_extended_720p_h264.mp4`](release/extended/Orbital_Sunrise_extended_720p_h264.mp4) (H.264).
  The renderer defaults to the supplied original artwork for the cards at 1:40 and 3:59.
  The prepared PNG retains the approved crop, colors and pencil texture from the local artwork edit.
  The committed releases and earlier exports still have the placeholder; use exports with `original_artwork` in their names.
  Details: [`docs/ARTWORK_EXPORTS.md`](docs/ARTWORK_EXPORTS.md).
  Leonov's drawing (1:40, 3:59) is shown as a colored-pencil redraw while permission to show the original is pending with the museum and his family.
  Release of 2026-10-03: the montage names the people on each human mission (Savitskaya and Hayabusa in), the tether at
  0:14–0:20 stays clear of the hull, and the singer's skin colour at 0:44 is warmer and more natural.
  How it was retimed: [`docs/ALTERNATE_CUT.md`](docs/ALTERNATE_CUT.md)

A colored-pencil drawing redrawn twelve times a second is about the hardest thing there is to
compress (fine hatching everywhere, all of it changing), so both files are two-pass encodes sized
to fit GitHub's 100 MB limit. `tools/encode_release.sh` re-encodes them from the rendered frames;
`tools/package_hls.sh` builds a higher-bitrate (4.8 Mbps HEVC) stream for the private watch page
(`release/web/index.html`).

> The first artwork ever made in space was a colored-pencil sketch of a sunrise,
> drawn by a man who almost didn't make it home. This video is drawn the same way.

On 18 March 1965 Alexei Leonov stepped out of **Voskhod‑2** (*Восход*, "sunrise") and became
the first person in open space. His suit ballooned until he could not get back in; he bled
his own air out to fit through the airlock; the automatic guidance failed; he and Pavel
Belyayev flew the re-entry by hand, overshot, and came down in the snow of the Ural taiga.
Somewhere in the middle of it, with colored pencils tied to his wrist on a string, Leonov
drew the orbital sunrise. The drawing survived.

So the film is **a drawing that survives**. Space is black paper: the void is the paper
itself and light is added stroke by stroke. Earth is white paper: when the capsule lands,
the page turns white and the snow is the paper. Two hands draw the story, his in 1965 and
the singer's now, until at the landing they are the same drawing.

| | |
|---|---|
| Treatment | [`docs/TREATMENT.md`](docs/TREATMENT.md) |
| Style bible (paper, pencil box, strokes, type, motion) | [`docs/STYLE_BIBLE.md`](docs/STYLE_BIBLE.md) |
| Shot list mapped to the beat grid | [`docs/SHOTLIST.md`](docs/SHOTLIST.md) |
| Design boards (style frames, character and set sheets) | [`media/boards/`](media/boards/) |

## How it was made

```
song ──► stems, beat grid, word timings ─────────────────────────────┐
research ──► style frames, character + set sheets (Nano Banana)      │
        └──► performance plates (Seedance 2.5, song audio as reference)
                 └──► analysis: tone · color · flow · edges · face landmarks · mattes
                          └──► colored-pencil renderer (canvas, in headless Chromium) ──► frames ──► MP4
```

1. **The song.** Vocal/instrumental stems (MDX-Net), a 162.33 BPM beat grid, and word-level
   lyric timings (Whisper on the vocal stem, snapped to onsets): [`video/data/timing.json`](video/data/timing.json).
   Every cut and every word on screen is keyed to these.
2. **Research and design.** Historical references for Voskhod‑2, the Berkut suit, the
   capsule, Leonov and Belyayev (Nano Banana 2 with search grounding), then style frames and
   character/set turnarounds (Nano Banana Pro). The singer's sheets come from
   `rare-earth-video` / `rare-earth-techno-remix`.
3. **Performance plates.** 42 short shots generated with **Seedance 2.5** on Cloudflare
   (`tools/plates.py`, specs in `tools/plate_specs.py`), each conditioned on the character
   and set sheets and, for the singer, on the matching slice of the song as reference
   audio. Long jobs run in the background and report to a tiny relay Worker
   (`tools/relay/worker.js`) that also mirrors outputs into KV. A verification loop
   (`tools/lipsync.py`) measures mouth-open curves against the vocal envelope; Seedance's
   sync was close but not frame-exact, so the singer's lips are **re-drawn from the vocal
   track** (`tools/mouth_track.py`) at the plate's own lip landmarks, and the plate's mouth
   is painted out with the surrounding skin tone.
4. **Analysis, never display.** Each plate frame is read into fields — tone, color,
   structure-tensor flow, thinned edges — plus MediaPipe face landmarks
   (`tools/plate_meta.py`), rembg subject mattes (`tools/plate_masks.py`) and a per-plate
   exposure. The renderer only *reads* the plates; the footage itself never appears.
   [`docs/making_of.jpg`](docs/making_of.jpg) shows reference plates next to the frames drawn from them.
5. **The pencil renderer** ([`video/src/`](video/src)). Every frame is a pure function of
   song time `t` (`renderAt(t)`), so frames render in any order and in parallel:
   * etching-style tonal hatching (four crossing layers), contours with overshoot, matte
     silhouettes, faces drawn as line work from their landmarks;
   * the pencil box is fixed (white, silver, sky, cobalt, ultramarine, gold, orange,
     vermilion, crimson, graphite, lead); paper tooth under every stroke;
   * drawn on twos like hand-drawn animation: everything, camera punches and type included,
     changes 12 times a second (ones only for the capsule's last seconds and the impact);
     contours boil, the hatch layout shimmers but does not strobe;
   * kinetic type: Anton for impact lyrics (with red Cyrillic echoes), Instrument Serif
     italic for the singer's own lines, JetBrains Mono for telemetry, pencil handwriting
     for "Art is a landing in the snow"; big words get a quiet clearing in the drawing.
6. **The ending and one word.** The song's last chord is held and allowed to ring out (≈4.5 s longer)
   with a spectral freeze of the sustained chord mixed under the original tail
   (`tools/extend_ending.py`). The lyric "through the sleeve he wore" was changed to "through the
   suit he wore" (the pressure valve was on the suit) by rebuilding that one word from Jade's own
   recorded voice: her "s", the "oo" of "through", the "t" of "out" (`tools/suit_splice.py`).
   The final mix is in [`release/audio/`](release/audio/).

## Render it

```bash
cd video && npm install
node render.mjs --list                         # the shot table
node render.mjs --sheet=23,24,25 --cols=3       # quick contact sheet
node render.mjs --frames=0:242.2 --workers=4    # all frames → out/frames (resumable)
node render.mjs --encode                        # frames + song → out/orbital_sunrise.mp4
```

Open `video/studio.html` through any static server to scrub the film interactively.
The analysis data (`video/plates/*/meta.json`, `index.json`) is in the repo; the plate
frames and mattes are regenerated from the Seedance takes with `tools/pipeline.sh`
(the takes themselves are not committed).

### High-quality 4K upload master

`bash tools/encode_youtube.sh` renders the approved 4:12 extended cut to lossless 1080p PNGs, reapplies the approved
skin correction at 0:44, then upscales with Lanczos to 3840×2160 at 24 fps. The H.264 encode uses CRF 12, the slow preset,
grain tuning, 4:2:0 and BT.709. The committed extended AAC audio is copied without another audio encode.
The output is `video/out/masters/Orbital_Sunrise_extended_original_artwork_4K_master.mp4`; it and the resumable frames are gitignored.
This master is not constrained by the repository's 100 MB file limit.

For a fresh checkout, restore the plate frames and masks first with `tools/prepare_upload_assets.py` in a Python environment
with Pillow, OpenCV, NumPy, rembg/ONNX Runtime and MediaPipe 0.10.14. It uses the committed takes, the approved index and
the original airlock/tether preparation tools, preserving the edit's metadata. The skin grade also needs the face model
listed in `tools/setup_env.sh`. In this workspace those dependencies are isolated under `video/out/.venv`, with ffmpeg
and the duration probe on `video/out/bin` and the models under `/tmp/work`.
Set `PYTHON`, `CHROME`, `FRAMES`, `OUT`, `WORKERS` or `CRF` to override the defaults. Frame rendering resumes;
the two artwork shots and the skin shot are rendered afresh so a retry cannot keep stale art or grade the same pixels twice.

For smaller upload copies, run `video/out/.venv/bin/python tools/encode_uploads.py youtube` and
`video/out/.venv/bin/python tools/encode_uploads.py x`. These reuse the approved graded PNG frames and make separate
H.264 copies at 4K/45 Mbps (YouTube, about 1.43 GB) and 1080p/12 Mbps (X, about 390 MB), using two-pass variable bitrate,
the slow preset and grain tuning. The X copy uses High profile, level 4.1, four reference frames, and a 16 Mbps
maximum video bitrate to improve upload compatibility after the 4K/35 Mbps copy failed to upload.
The extended AAC mix is copied, each complete file is decoded and verified,
and the archival master checksum is checked before and after. Outputs and logs are under `video/out/uploads/`;
the script refuses to overwrite existing exports. The corrected filenames include `original_artwork`.
The encoder verifies the artwork and cached card-frame hashes before and after encoding to prevent using stale placeholder
frames. Add `--sample=skin --start=44.375 --duration=4` to review a short sample.
`video/out/.venv/bin/python tools/encode_artwork_master.py` makes a separate corrected CRF-12 master under `video/out/masters/`.

## Facts on screen

18 March 1965 · Voskhod‑2 (*Восход* = "sunrise"), call sign Алмаз ("Diamond") · Leonov 30,
Belyayev 39 · suit pressure lowered from 0.40 to ~0.27 atm to get back through the Volga
airlock · automatic orientation failed, first manual re-entry · landed in the taiga near
Perm, two nights in the snow · legacy: Ed White's spacewalk (June 1965), Apollo 11 (1969),
Apollo–Soyuz handshake (1975), continuous crews on the ISS (since 2000), the first
commercial spacewalk (Polaris Dawn, 2024), Artemis II around the Moon (2026).
The lyric's "fifteen hundred klicks" is the song's own; the real overshoot was a few
hundred kilometres.
The math behind that number, for viewers: [`docs/THE_MATH.md`](docs/THE_MATH.md).
