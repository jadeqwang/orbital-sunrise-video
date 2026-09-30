"""Install a ritardando time map for the renderer: video/data/timemap.json (read by video/src/main.js and video/render.mjs).

    python3 tools/timemap.py media/audio/Orbital_Sunrise_rit_0.65.map.json [media/audio/Orbital_Sunrise_rit_0.65.wav]

Input: the <out>.map.json that tools/ritardando.py writes next to its audio, [[song_s, out_s], ...] every 0.1 s song time.
Output keeps the points from the last identity point before the slowdown on (identity before, constant shift after), plus
the audio file to mux (the .wav, or the committed .m4a fallback) and its duration. render.mjs --norit ignores it.
"""
import sys, json, pathlib, subprocess
ROOT = pathlib.Path(__file__).resolve().parent.parent
src = pathlib.Path(sys.argv[1]).resolve()
wav = pathlib.Path(sys.argv[2]).resolve() if len(sys.argv) > 2 else src.with_suffix("").with_suffix(".wav")
rel = lambda p: str(p.resolve().relative_to(ROOT))
m = json.load(open(src))
i = max(k for k, (s, u) in enumerate(m) if s == u and all(a == b for a, b in m[:k + 1]))
pts = m[i:]
assert all(b[0] > a[0] and b[1] > a[1] for a, b in zip(pts, pts[1:])), "map must be increasing"
aud = wav if wav.exists() else wav.with_suffix(".m4a")
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(aud)],
                           capture_output=True, text=True, check=True).stdout)
json.dump({
    "about": "Ritardando time map, song time s -> output (film) time u. Identity before the first point; after the last point "
             "u - s stays constant (the final chord rings out unchanged). The renderer draws output time u from song time s(u). "
             "Written by tools/timemap.py; render.mjs --norit / studio.html?norit turn it off.",
    "source": rel(src), "audio": rel(wav), "audio_fallback": rel(wav.with_suffix(".m4a")), "duration": round(dur, 3), "map": pts,
}, open(ROOT / "video/data/timemap.json", "w"), separators=(",", ":"))
print(f"video/data/timemap.json: {len(pts)} points from s={pts[0][0]}, song {pts[-1][0]} -> film {pts[-1][1]}, audio {rel(aud)} {dur:.3f} s")
