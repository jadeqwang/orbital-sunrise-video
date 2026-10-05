# ORBITAL SUNRISE — music video

**▶ Watch on [YouTube](https://www.youtube.com/watch?v=GKVOH-Tjd2U) · [X / Twitter](https://x.com/qiqing/status/2106803533282787360)**

For the best picture quality, watch the published uploads: **4K on YouTube** or **1080p on X**.
The downloads in this repository are compressed to fit GitHub's 100 MB file limit.

**Song and lyrics:** Jade Wang
**Narrative arc:** inspired by John Green's essay *Orbital Sunrise* (*The Anthropocene Reviewed*)
**Video:** colored-pencil animation rendered in JavaScript, with Leonov's original sunrise drawing in the two card shots

The current film is the **4:12 extended cut** (252.28 s), set to the re-recorded mix with two new intro lines.
The legacy montage names the people on each human mission, the tether at 0:14–0:20 stays clear of the hull,
and the singer's skin colour at 0:44 is warmer and more natural.

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
| Russian lyrics (three singable versions for a Suno cover) | [`lyrics/ru/`](lyrics/ru/) |
| Design boards (style frames, character and set sheets) | [`media/boards/`](media/boards/) |

## Downloads

These smaller files are useful for offline viewing. For the best picture quality and the current artwork,
use the YouTube or X links above.

* **Extended cut** (2026-10-03, 4:12, 24 fps):
  [1080p HEVC](release/extended/Orbital_Sunrise_extended_1080p.mp4) ·
  [720p H.264](release/extended/Orbital_Sunrise_extended_720p_h264.mp4).
* **Earlier cut** (2026-09-30, 4:03, 24 fps):
  [1080p HEVC](release/Orbital_Sunrise_1080p.mp4) ·
  [720p H.264](release/Orbital_Sunrise_720p_h264.mp4).

The committed downloads contain an earlier colored-pencil redraw of Leonov's sunrise card.
The current renderer and published uploads use the supplied original artwork at 1:40 and 3:59,
preserving its crop, colors, pencil texture and museum credit.
See the [artwork and export notes](docs/ARTWORK_EXPORTS.md) and [timing and edit notes](docs/ALTERNATE_CUT.md).

Fine hatching changes twelve times a second, so the film is particularly demanding to compress.
The repository downloads are two-pass encodes sized to fit GitHub's limit;
`tools/encode_release.sh` makes these copies from rendered frames.
H.264 is available for players that cannot decode HEVC.

## How it was made

```
song ──► stems, beat grid, word timings ─────────────────────────────┐
research ──► style frames, character + set sheets (Nano Banana)      │
        └──► performance plates (Seedance 2.5, song audio as reference)
                 └──► analysis: tone · color · flow · edges · face landmarks · mattes
                          └──► colored-pencil renderer (canvas, in headless Chromium) ──► frames ──► MP4
```

1. **The song.** Vocal/instrumental stems, a beat grid, and word-level
   lyric timings (Whisper on the vocal stem, snapped to onsets): [`video/data/timing.json`](video/data/timing.json).
   Every cut and every word on screen is keyed to these. The extended cut was retimed to the new recording
   with `tools/retime.py`, including timings re-measured on its vocal stem.
2. **Research and design.** Historical references for Voskhod‑2, the Berkut suit, the
   capsule, Leonov and Belyayev (Nano Banana 2 with search grounding), then style frames and
   character/set turnarounds (Nano Banana Pro). The singer's sheets come from
   `rare-earth-video` / `rare-earth-techno-remix`.
3. **Performance plates.** Short shots generated with **Seedance 2.5** on Cloudflare
   (`tools/plates.py`, specs in `tools/plate_specs.py`), each conditioned on the character
   and set sheets and, for the singer, on the matching slice of the song as reference
   audio. Long jobs run in the background and report to a tiny relay Worker
   (`tools/relay/worker.js`) that also mirrors outputs into KV. A verification loop
   (`tools/lipsync.py`) measures mouth-open curves against the vocal envelope; Seedance's
   sync was close but not frame-exact, so the singer's lips are **re-drawn from the vocal
   track** (`tools/mouth_track.py`) at the plate's own lip landmarks, and the plate's mouth
   is painted out with the surrounding skin tone.
4. **Plate analysis.** Each plate frame is read into fields — tone, color,
   structure-tensor flow, thinned edges — plus MediaPipe face landmarks
   (`tools/plate_meta.py`), rembg subject mattes (`tools/plate_masks.py`) and a per-plate
   exposure. The renderer only *reads* the plates; the footage itself never appears.
   [`docs/making_of.jpg`](docs/making_of.jpg) shows reference plates next to the frames drawn from them.
   The original sunrise card is placed separately from the performance plates.
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
6. **The ending and the final mix.** The song's last chord is held and allowed to ring out
   with a spectral freeze of the sustained chord mixed under the original tail
   (`tools/extend_ending.py`). The current recording sings "Eternity inside the airlock door" and
   "through the suit he wore"; its piano outro already includes the ritardando.
   The renderer uses [`media/audio/Orbital_Sunrise_alt2_extended.m4a`](media/audio/Orbital_Sunrise_alt2_extended.m4a),
   with an identity time map. Earlier audio releases are in [`release/audio/`](release/audio/).

## Render it

Requires Node.js, ffmpeg/ffprobe, Chromium and the restored plate frames and masks.
Set `CHROME` to your Chromium or Chrome executable if it differs from the renderer's default.

```bash
cd video
npm install
node render.mjs --list                         # the shot table
node render.mjs --sheet=23,24,25 --cols=3       # quick contact sheet
node render.mjs --frames=0:252.28 --workers=4   # all 6055 frames → out/frames (resumable)
node render.mjs --encode                        # frames + song → out/orbital_sunrise.mp4
```

Open `video/studio.html` through any static server to scrub the film interactively.
The analysis data (`video/plates/*/meta.json`, `index.json`) is in the repo; the plate
frames and mattes are regenerated from the committed takes and stills with `tools/prepare_upload_assets.py`.
Run it from the repository root in the Python environment described below; it preserves the current edit's
take selection and metadata.

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
Perm, two nights in the snow. The legacy montage spans Apollo 11 (1969), Apollo–Soyuz (1975),
Savitskaya's spacewalk (1984), the ISS (2000), Shenzhou 7 (2008), Hayabusa (2010), Curiosity (2012),
Rosetta/Philae (2014), Chang'e 4 (2019), Tiangong (2022), Chandrayaan-3 (2023) and Polaris Dawn (2024).

The lyric's "fifteen hundred klicks" comes from Leonov's own forecast. It is distinct from the final landing miss;
the sources and calculations are explained in [the math behind that number](docs/THE_MATH.md).
