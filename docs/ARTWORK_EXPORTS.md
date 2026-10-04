# Original-artwork upload exports

The supplied artwork was already prepared and approved in the local Downloads checkout, but the initial 4K exports
used the repository's default redraw. This workspace now uses that exact prepared PNG and metadata:

- `video/data/supplied_drawing_rectified.png`: 950 × 510, copied unchanged from the approved local edit.
- `video/data/user_drawing.json`: source `sunrise_cropped_card.png`, approved perspective corners, crop, original colors,
  and Leonov/museum credit. The photo originally came from `~/Documents/sunrise/sunrise_cropped_card.png`.

The renderer defaults to `drawing=user` and fails if the supplied asset is unavailable. `drawing=redraw` remains an
explicit review option. The two replacement ranges at 24 fps are:

| Shot | Frames, inclusive | Output time |
|---|---|---|
| D5_the_drawing | 2403–2537 | 100.125–105.750 s |
| C1_drawing | 5740–5874 | 239.167–244.792 s |

Only these 270 PNG frames were regenerated in `video/out/master_frames/`. The other 5785 frames and the approved
47-frame skin correction were checked against their previous file metadata and skin checksums. Previous card frames
are backed up in `video/out/artwork_patch/previous_frames/`. The artwork and replacement-frame checksums are recorded in
`video/out/master_frames/artwork_manifest.json` and verified before and after each encode.

To update the cached frames after an artwork edit, run from the repository root:

```bash
video/out/.venv/bin/python tools/artwork_frames.py snapshot
cd video
node render.mjs --chrome=/usr/bin/google-chrome --frames=100.125:105.75 --workers=4 --format=png --dir=out/master_frames --force --q=drawing=user
node render.mjs --chrome=/usr/bin/google-chrome --frames=239.1666666667:244.7916666667 --workers=4 --format=png --dir=out/master_frames --force --q=drawing=user
cd ..
video/out/.venv/bin/python tools/artwork_frames.py record
```

The corrected exports use distinct filenames, preserving the previous master and uploads:

- `video/out/uploads/Orbital_Sunrise_extended_original_artwork_4K_youtube_45Mbps.mp4`
- `video/out/uploads/Orbital_Sunrise_extended_original_artwork_4K_x_35Mbps.mp4`
- `video/out/masters/Orbital_Sunrise_extended_original_artwork_4K_master.mp4`

All are 3840 × 2160 at 24 fps, 6055 frames, about 252.292 seconds, with the extended AAC soundtrack copied unchanged.
The upload copies use two-pass H.264 at 45 and 35 Mbps; the separate master uses H.264 CRF 12. Each is decoded in full,
checked for correct dimensions/duration/frame count and fast-start layout, and compared against the original AAC packets.
The manifests include the supplied artwork's checksum and credit. All outputs and working frames are gitignored.

English lyric subtitles for the same unchanged soundtrack are available as
`video/out/uploads/Orbital_Sunrise_extended_en.srt` and `.vtt`. They contain 35 phrase cues, derived from the current
alt2 lyric timing through the identity time map. The explicitly unsung last “home” is omitted. The adjacent
`.subtitles_qa.json` records timing, source hashes, readability and format checks, plus lyric transcription limitations.

The intro thumbnail uses the fully visible `I1_poster` title at 2.500 seconds, from lossless source frame
`video/out/master_frames/f00060.png`. It is scaled from 1920 × 1080 to 3840 × 2160 with Lanczos, matching the 4K
video exports. `video/out/uploads/Orbital_Sunrise_intro_title_4K.png` is the lossless PNG (16.72 MB), and the adjacent
`.jpg` is a 1.83 MB JPEG with 4:4:4 chroma. The adjacent `.json` records the source frame, dimensions, compression
and export hashes.

After the 4K/35 Mbps X copy failed to upload, `tools/encode_uploads.py x` was changed to make a separate
`video/out/uploads/Orbital_Sunrise_extended_original_artwork_1080p_x_12Mbps.mp4` from the same approved PNGs.
The original 4K files remain available. This retry copy uses 1920 × 1080, 24 fps, two-pass H.264 at 12 Mbps,
High profile/level 4.1, four reference frames, a 16 Mbps maximum video bitrate, and a 24 Mbit VBV buffer.
The original AAC mix is copied unchanged. The verified file is 385.21 MB, and the full duration stays 4:12.
X's [current Premium upload guidance](https://help.x.com/en/using-x/premium-longer-videos) documents 1080p uploads
up to 16 GB on the web; the exact cause of the reported failure has not been established.
The shared verifier now accepts `--resolution 1920x1080` while keeping 4K as its default.
