"""Retime the film from the released song to the extended recording (Orbital_Sunrise_6, docs/ALTERNATE_CUT.md).

    python3 tools/retime.py map       align the two recordings, write video/data/editmap.json (old song time -> new song time)
    python3 tools/retime.py timing    video/data/timing_release.json -> video/data/timing.json through the map, plus the new lines

The new recording is the released song's performance at a slightly different, wandering tempo (1.58 % faster on average)
with two new intro lines inserted: its vocal matches the old vocal word for word within 0.01-0.03 s once mapped (checked
on both Kim_Vocal_2 stems, tools/vocal_stem.py). So one time map moves everything: the beats, every word, every section
and every absolute time or beat number in video/src (core.js O(), OI(), Bn()).

The map (old -> new):
  - 0 - INS_OLD: spectral alignment of the full mixes every 0.5 s (1.5 s windows, sub-frame peak), median-smoothed;
  - INS_OLD: the two new lines ("Tied to the ship...", "Pull him back...", 12.18 s, two phrases) are inserted here, after
    "First man floating in the void of space" and before "Can't feel his hands" (a jump in the map);
  - INS_OLD - FIT_END: the alignment again;
  - FIT_END - the final chord: note-for-note anchors (END_ANCHORS; the new recording plays its own ritardando there, so
    the film needs no tools/ritardando.py slowdown);
  - after the final chord: a constant shift (the ring-out, tools/extend_ending.py).

Word times that do not come from the map (measured on the new vocal stem: recogniser word times from a sherpa-onnx
Parakeet model, each snapped to the vocal's onsets and pitch changes; see NEW_LINES) are the two new lines, "Can't feel
his hands, can't feel his face" (whose released times sat up to 0.2 s early; the recogniser and the stem's onsets agree
on the new ones) and the final chorus's changed line "Fall through the skies, bring me home".
"""
import sys, json, pathlib, subprocess
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
OLD_AUDIO = ROOT / "media/audio/Orbital_Sunrise_extended.m4a"      # the released "suit" mix: timing_release.json's clock
NEW_AUDIO = ROOT / "media/audio/Orbital_Sunrise_alt.mp3"           # her extended recording
NEW_EXT = ROOT / "media/audio/Orbital_Sunrise_alt_extended.m4a"    # the same with the ring-out (tools/extend_ending.py)
EDITMAP = ROOT / "video/data/editmap.json"
TIMING_OLD = ROOT / "video/data/timing_release.json"
TIMING = ROOT / "video/data/timing.json"

FPS, WIN, STEP = 200, 1.5, 0.5
INS_OLD = 13.0                 # old song time of the insert (between "space" 12.21 and "Can't" 13.19; beat 35 = 12.914)
A_LAST = 11.5                  # last window start that lies wholly before the insert (window end 13.0)
B_FIRST = 13.5                 # first window start wholly after it
FIT_END = 231.0                # the alignment is used up to here; then END_ANCHORS
# piano outro: old note -> the same note in the new recording (onsets of the last eighth-note run and the final chord)
END_ANCHORS = [(231.71, 240.02), (232.12, 240.42), (234.15, 242.28), (234.50, 242.59), (234.696, 243.19)]

NEW_LINES = {
    # section, index (after insertion), text, word starts (new song time)
    "tied": ("intro", 1, "Tied to the ship by the slightest trace", [13.80, 14.35, 14.91, 15.47, 16.60, 16.94, 17.37, 18.40]),
    "pull": ("intro", 2, "Pull him back to the ship's embrace", [20.36, 21.01, 21.56, 22.74, 23.03, 23.44, 24.05]),
    "cant": ("intro", 3, None, [26.01, 26.50, 27.08, 27.63, 28.79, 29.50, 30.12, 30.68]),      # re-measured, text unchanged
    "fall": ("hook3", 1, "Fall through the skies, bring me home", [158.78, 159.35, 159.74, 160.05, 161.82, 162.55, 162.79]),
}


def decode(path, sr=16000):
    raw = subprocess.run(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32)


def feat(path):
    from scipy.signal import stft
    x = decode(path)
    _, _, Z = stft(x, 16000, nperseg=1024, noverlap=1024 - 16000 // FPS)
    S = np.log1p(10 * np.abs(Z[:300]))
    S -= S.mean(1, keepdims=True)
    return S / (np.linalg.norm(S, axis=0) + 1e-9)


def align():
    A, B = feat(OLD_AUDIO), feat(NEW_AUDIO)
    W = int(WIN * FPS)
    coarse = lambda s: s if s < INS_OLD else .98445 * s + 12.028        # tools/compare_mix.py's fit, the search centre
    rows = []
    for s in np.arange(0, FIT_END, STEP):
        if A_LAST < s < B_FIRST:
            continue
        i, p = int(s * FPS), int(coarse(s) * FPS)
        a = A[:, i:i + W]
        cs = np.array([np.mean(np.sum(a * B[:, p + o:p + o + W], 0)) if 0 <= p + o and p + o + W <= B.shape[1] else -9
                       for o in range(-120, 121)])
        k = int(np.argmax(cs))
        d = 0.
        if 0 < k < len(cs) - 1:
            y0, y1, y2 = cs[k - 1:k + 2]
            den = y0 - 2 * y1 + y2
            d = .5 * (y0 - y2) / den if den else 0.
        # a window's lag belongs to its centre
        rows.append((float(s + WIN / 2), float((p + k - 120 + d) / FPS + WIN / 2), float(cs[k])))
    return rows


def smooth(rows):
    """Median of 5 on the offset (new - old): drops single mis-matches, keeps the tempo's wander."""
    t = np.array([r[0] for r in rows]); off = np.array([r[1] - r[0] for r in rows])
    m = np.array([np.median(off[max(0, i - 2):i + 3]) for i in range(len(off))])
    return [(float(a), float(a + b)) for a, b in zip(t, m)]


def build_map():
    rows = align()
    pa = smooth([r for r in rows if r[0] < INS_OLD])
    pb = smooth([r for r in rows if r[0] > INS_OLD])
    ext = lambda p, x: p[0][1] + (x - p[0][0]) * (p[1][1] - p[0][1]) / (p[1][0] - p[0][0])   # linear extrapolation
    a_end = ext(pa[-2:], INS_OLD)
    b_start = ext(pb[:2], INS_OLD)
    pts = [(0.0, 0.0)] + [p for p in pa if p[0] > 0] + [(INS_OLD - 1e-3, a_end), (INS_OLD, b_start)] + pb
    pts = [p for p in pts if p[0] < END_ANCHORS[0][0] - .3] + END_ANCHORS
    last = END_ANCHORS[-1]
    m = {"about": "Old song time (the released cut, video/data/timing_release.json, media/audio/Orbital_Sunrise_extended.m4a) -> "
                  "new song time (media/audio/Orbital_Sunrise_alt.mp3, its ring-out Orbital_Sunrise_alt_extended.m4a). "
                  "Piecewise linear through map; after the last point a constant shift; the jump at insert.old is the "
                  "inserted intro lines. Written by tools/retime.py map; read by video/src/core.js O()/OI()/Bn().",
         "insert": {"old": INS_OLD, "new0": round(a_end, 3), "new1": round(b_start, 3)},
         "shift_after": round(last[1] - last[0], 3),
         "map": [[round(a, 3), round(b, 3)] for a, b in pts]}
    return m


class Map:
    def __init__(self, m):
        self.m = np.array(m["map"]); self.ins = m["insert"]["old"]; self.after = m["shift_after"]

    def __call__(self, x):
        o, n = self.m[:, 0], self.m[:, 1]
        if x >= o[-1]:
            return float(x + self.after)
        side = o < self.ins if x < self.ins else o >= self.ins
        oo, nn = o[side], n[side]
        if x <= oo[0]:
            return float(nn[0] + (x - oo[0]) * (nn[1] - nn[0]) / (oo[1] - oo[0]))
        if x >= oo[-1]:
            return float(nn[-1] + (x - oo[-1]) * (nn[-1] - nn[-2]) / (oo[-1] - oo[-2]))
        return float(np.interp(x, oo, nn))


def dur(path):
    return len(decode(path, 8000)) / 8000


def tokens(text):
    return [w for w in (t.strip("()…—") for t in text.split()) if w]


def retime():
    m = json.loads(EDITMAP.read_text()); O = Map(m)
    d = json.loads(TIMING_OLD.read_text())
    r3 = lambda x: round(float(x), 3)
    # beats: every old beat through the map; the inserted bars get an even grid between their neighbours
    ob = d["beats"]
    nb = next(i for i, b in enumerate(ob) if b >= INS_OLD)
    before, after = [O(b) for b in ob[:nb]], [O(b) for b in ob[nb:]]
    per = before[-1] - before[-2]
    gap = after[0] - before[-1]
    k = int(round(gap / per)) - 1
    fill = [before[-1] + gap * (i + 1) / (k + 1) for i in range(k)]
    beats = before + fill + after
    m["insert"].update({"beat": nb, "k": k})
    EDITMAP.write_text(json.dumps(m, separators=(",", ":")))
    body = np.diff([b for b in beats if 40 < b < 230])
    d["beat"] = r3(np.median(body)); d["bpm"] = round(60 / d["beat"], 2)
    d["beats"] = [r3(b) for b in beats]
    d["t0"] = d["beats"][0]
    # sections: boundaries through the map (the insert lies inside the intro, which grows)
    d["sections"] = [[s, r3(O(a)) if a > 0 else 0.0, r3(O(b))] for s, a, b in d["sections"]]
    # lines: words and bounds through the map, then the measured ones
    for l in d["lines"]:
        l["t0"], l["t1"] = r3(O(l["t0"])), r3(O(l["t1"]))
        l["words"] = [[r3(O(t)), w] for t, w in l["words"]]
    intro = [l for l in d["lines"] if l["sec"] == "intro"]
    for key in ("tied", "pull"):
        sec, i, text, ws = NEW_LINES[key]
        tk = tokens(text); assert len(tk) == len(ws), key
        d["lines"].append({"sec": sec, "text": text, "t0": ws[0], "t1": None, "words": [[t, w] for t, w in zip(ws, tk)]})
    cant = intro[1]; ws = NEW_LINES["cant"][3]
    cant["words"] = [[t, w] for t, (_, w) in zip(ws, cant["words"])]; cant["t0"] = ws[0]
    h3 = [l for l in d["lines"] if l["sec"] == "hook3"][1]
    _, _, text, ws = NEW_LINES["fall"]
    tk = tokens(text); assert len(tk) == len(ws)
    h3.update({"text": text, "t0": ws[0], "words": [[t, w] for t, w in zip(ws, tk)]})
    d["lines"].sort(key=lambda l: l["t0"])
    # a line that ran up to the next one's start still does (the released intro/pre lines are chained like that)
    for a, b in zip(d["lines"], d["lines"][1:]):
        if a["t1"] is None or (a["sec"] == "intro" and b["sec"] == "intro"):
            a["t1"] = b["t0"]
    d["dur"] = r3(dur(NEW_AUDIO))
    ext = next((f for f in (NEW_EXT.with_suffix(".wav"), NEW_EXT) if f.exists()), None)   # the .m4a carries encoder padding
    d["durExt"] = r3(dur(ext)) if ext else d["dur"]
    TIMING.write_text(json.dumps(d, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {TIMING.relative_to(ROOT)}: {len(beats)} beats ({k} inserted at old beat {nb}), beat {d['beat']} s "
          f"({d['bpm']} BPM), {len(d['lines'])} lines, dur {d['dur']}, durExt {d['durExt']}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "map":
        m = build_map()
        EDITMAP.write_text(json.dumps(m, separators=(",", ":")))
        print(f"wrote {EDITMAP.relative_to(ROOT)}: {len(m['map'])} points, insert {m['insert']}, then +{m['shift_after']} s")
    elif cmd == "timing":
        retime()
    else:
        print(__doc__)
