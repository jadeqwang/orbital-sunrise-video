# ORBITAL SUNRISE — music video

**Song:** *Orbital Sunrise* — Jade Wang
**Lyrics:** a found poem from John Green's essay *Orbital Sunrise* (*The Anthropocene Reviewed*)
**Video:** every frame drawn in colored pencil by JavaScript

* ▶ **[`release/Orbital_Sunrise_1080p.mp4`](release/Orbital_Sunrise_1080p.mp4)** — 1920×1080, 24 fps, 4:02, HEVC
* [`release/Orbital_Sunrise_720p_h264.mp4`](release/Orbital_Sunrise_720p_h264.mp4) — 1280×720, H.264, for players and sites that need H.264
* **Extended cut** (this branch; the re-recorded extended mix, two new intro lines, 4:12):
  [`release/extended/Orbital_Sunrise_extended_1080p.mp4`](release/extended/Orbital_Sunrise_extended_1080p.mp4) (HEVC) and
  [`release/extended/Orbital_Sunrise_extended_720p_h264.mp4`](release/extended/Orbital_Sunrise_extended_720p_h264.mp4) (H.264).
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

## Facts on screen

18 March 1965 · Voskhod‑2 (*Восход* = "sunrise"), call sign Алмаз ("Diamond") · Leonov 30,
Belyayev 39 · suit pressure lowered from 0.40 to ~0.27 atm to get back through the Volga
airlock · automatic orientation failed, first manual re-entry · landed in the taiga near
Perm, two nights in the snow · legacy: Ed White's spacewalk (June 1965), Apollo 11 (1969),
Apollo–Soyuz handshake (1975), continuous crews on the ISS (since 2000), the first
commercial spacewalk (Polaris Dawn, 2024), Artemis II around the Moon (2026).
The lyric's "fifteen hundred klicks" is the song's own; the real overshoot was a few
hundred kilometres.
