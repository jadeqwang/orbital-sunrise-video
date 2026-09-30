"""A performer's ritardando for the piano outro (her note: "gently get slower the way a musician would when performing").

    python3 tools/ritardando.py [--vmin=0.75] [--start=228.36] [--end=234.6957] [--src=media/audio/Orbital_Sunrise_extended.wav]
                                [--out=media/audio/Orbital_Sunrise_rit.wav]

The tempo holds at 1 until --start, then eases down (quadratically, like a pianist leaning back) to --vmin at the final chord
(--end, default 234.6957 s, the last beat); the chord's ring-out after it is untouched. For a new / longer mix (an
alternate cut) pass --src= its "suit" WAV and move --start/--end to where that mix's piano outro and final chord are
(docs/ALTERNATE_CUT.md). Pitch is preserved (rubberband with a time map).
Also writes <out>.map.json: [[song_s, out_s], ...] so the renderer can draw frame at output time u from song time s(u).
"""
import sys, json, pathlib, subprocess
import numpy as np, soundfile as sf
ROOT = pathlib.Path(__file__).resolve().parent.parent
args = dict(a[2:].split("=", 1) for a in sys.argv[1:] if a.startswith("--") and "=" in a)
SRC = pathlib.Path(args.get("src", ROOT / "media/audio/Orbital_Sunrise_extended.wav"))   # the release mix ("suit")
VMIN, S0, S1 = float(args.get("vmin", .75)), float(args.get("start", 228.36)), float(args.get("end", 234.6957))
OUT = pathlib.Path(args.get("out", ROOT / "media/audio/Orbital_Sunrise_rit.wav"))

x, sr = sf.read(SRC)
dur = len(x) / sr
# tempo v(s) (1 = original); output time u(s) = integral ds / v
s = np.arange(0, dur, 0.01)
k = np.clip((s - S0) / (S1 - S0), 0, 1)
v = np.where(s < S0, 1, np.where(s <= S1, 1 - (1 - VMIN) * k ** 2, 1))
u = np.concatenate([[0], np.cumsum(0.01 / v[:-1])])
print(f"vmin {VMIN}: outro {S1 - S0:.2f} s -> {np.interp(S1, s, u) - np.interp(S0, s, u):.2f} s, song {dur:.2f} -> {u[-1] + (dur - s[-1]):.2f} s")
# time map for rubberband: source sample -> target sample, every 50 ms through the ritardando (identity shift elsewhere)
sel = (s >= S0 - .01) & (s <= S1 + .01)
key = [(S0, float(np.interp(S0, s, u)))] + [(float(a), float(b)) for a, b in zip(s[sel][::25], u[sel][::25])] + [(S1, float(np.interp(S1, s, u)))]
key = sorted(set((round(a, 3), round(b, 3)) for a, b in key))
pts = [(int(a * sr), int(b * sr)) for a, b in key]
mp = OUT.with_suffix(".rbmap.txt")
mp.write_text("\n".join(f"{a} {b}" for a, b in pts) + "\n")
ratio = (u[-1] + (dur - s[-1])) / dur
subprocess.run(["rubberband", "-q", "--fine", "-t", f"{ratio:.8f}", "-M", str(mp), str(SRC), str(OUT)], check=True)
json.dump([[round(float(a), 3), round(float(b), 3)] for a, b in zip(s[::10], u[::10])], open(OUT.with_suffix(".map.json"), "w"))
print(OUT)
