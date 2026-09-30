"""Retime the film from the released song to her extended recordings (Orbital_Sunrise_6 and its re-record, docs/ALTERNATE_CUT.md).

    python3 tools/retime.py map       align the two recordings, write video/data/editmap.json (old song time -> new song time)
    python3 tools/retime.py timing    video/data/timing_release.json -> video/data/timing.json through the map, plus the new lines
    python3 tools/retime.py words A B "text" [--stem=/tmp/work/audio/vocals.wav]
                                      measure a line's word starts in [A, B] s on the new vocal stem (NEW_LINES' numbers)
    python3 tools/retime.py carry --from=alt --stem-from=<its vocals.wav> [--stem=...] [--times=a,b,...]
                                      carry word times measured on another recording of the same performance over
  --target=alt2 (default) | alt: which recording (TARGETS); the vocal stem comes from tools/vocal_stem.py <recording>

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

REWORDED: lines whose words change but not yet their recording (for "alt": "Eternity inside the airlock door", sung as
"Ninety minutes..."): each new word takes the mapped time of an old one.

Targets (TARGETS, --target=): "alt" (Orbital_Sunrise_6, the first extended recording) and "alt2" (default: her re-record
that sings "Eternity inside the airlock door", a new render of the same performance 0.6 % slower). Both map straight from
the released cut, so timing_release.json stays the one source; `carry` moves word times measured on one recording to
another through their vocal stems.
"""
import sys, json, pathlib, subprocess
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
OLD_AUDIO = ROOT / "media/audio/Orbital_Sunrise_extended.m4a"      # the released "suit" mix: timing_release.json's clock
EDITMAP = ROOT / "video/data/editmap.json"
TIMING_OLD = ROOT / "video/data/timing_release.json"
TIMING = ROOT / "video/data/timing.json"

FPS, WIN, STEP = 200, 1.5, 0.5
INS_OLD = 13.0                 # old song time of the insert (between "space" 12.21 and "Can't" 13.19; beat 35 = 12.914)
A_LAST = 11.5                  # last window start that lies wholly before the insert (window end 13.0)
B_FIRST = 13.5                 # first window start wholly after it
FIT_END = 231.0                # the alignment is used up to here; then END_ANCHORS

# The recordings the film can be retimed to (--target=, default the latest). Each: the recording and its ring-out mix,
# the search centre of the alignment (old -> new, linear before / after the insert: tools/compare_mix.py's fits), the
# piano outro's anchors (old note -> the same note in that recording: the onsets of the last eighth-note run and the
# final chord), the word times measured on its vocal stem (NEW_LINES: section, index after insertion, text or None =
# unchanged, word starts in that recording's song time) and REWORDED lines (new words the audio does not sing yet).
TARGETS = {
    # Orbital_Sunrise_6.mp3 (2026-09-30): sings "Ninety minutes inside the airlock door"
    "alt": dict(
        audio="media/audio/Orbital_Sunrise_alt.mp3", ext="media/audio/Orbital_Sunrise_alt_extended.m4a",
        coarse=((1.0, 0.0), (.98445, 12.028)),
        end=[(231.71, 240.02), (232.12, 240.42), (234.15, 242.28), (234.50, 242.59), (234.696, 243.19)],
        new_lines={
            "tied": ("intro", 1, "Tied to the ship by the slightest trace", [13.80, 14.35, 14.91, 15.47, 16.60, 16.94, 17.37, 18.40]),
            "pull": ("intro", 2, "Pull him back to the ship's embrace", [20.36, 21.01, 21.56, 22.74, 23.03, 23.44, 24.05]),
            "cant": ("intro", 3, None, [26.01, 26.50, 27.08, 27.63, 28.79, 29.50, 30.12, 30.68]),
            "fall": ("hook3", 1, "Fall through the skies, bring me home", [158.78, 159.35, 159.74, 160.05, 161.82, 162.55, 162.79]),
        },
        # was "Ninety minutes inside the airlock door" (docs/FACTCHECK.md §1): "Eternity" on "Ninety", "minutes" drops
        # (for each new word, the index of the old word whose mapped time it takes)
        reworded={"eternity": ("pre", 3, "Eternity inside the airlock door", [0, 2, 3, 4, 5])},
    ),
    # Orbital_Sunrise_airlock_corrected_1.mp3 (2026-09-30): the re-record that sings "Eternity inside the airlock door".
    # A new render, not a patch: the same performance and arrangement, 0.6 % slower than "alt" (+0.02 s at the start,
    # +1.6 s by the outro), the final chord at 244.78 s; see docs/ALTERNATE_CUT.md "The re-record".
    "alt2": dict(
        audio="media/audio/Orbital_Sunrise_alt2.mp3", ext="media/audio/Orbital_Sunrise_alt2_extended.m4a",
        coarse=((1.006, 0.02), (.98957, 12.333)),
        end=[(231.71, 241.645), (232.12, 242.066), (234.15, 243.888), (234.50, 244.160), (234.696, 244.78)],
        # Word times: `carry --from=alt` ("alt"'s measured times through a DTW of the two vocal stems, snapped to the
        # new stem's onsets / note changes within 0.08 s; "inside the airlock door" from "alt"'s timing), cross-checked
        # with `words` (recogniser + snapping: within 0.1 s once its per-word bias on "alt" is taken off; used alone it
        # snapped some words to the wrong note change). "Eternity" (not sung in "alt") from `words`: 66.14, the onset of
        # its first vowel after "wore" (voiced from 66.10), 0.25 s before "Ninety" sat: an unstressed pickup "E-".
        new_lines={
            "tied": ("intro", 1, "Tied to the ship by the slightest trace", [13.89, 14.47, 14.99, 15.58, 16.71, 17.13, 17.49, 18.59]),
            "pull": ("intro", 2, "Pull him back to the ship's embrace", [20.51, 21.18, 21.76, 22.93, 23.32, 23.69, 24.36]),
            "cant": ("intro", 3, None, [26.26, 26.80, 27.38, 27.92, 29.13, 29.81, 30.38, 31.00]),
            "eternity": ("pre", 3, "Eternity inside the airlock door", [66.14, 67.06, 67.50, 67.99, 68.59]),
            "fall": ("hook3", 1, "Fall through the skies, bring me home", [159.83, 160.40, 160.79, 161.12, 162.93, 163.63, 163.86]),
        },
        reworded={},
    ),
}
INSERTED = ("tied", "pull")     # NEW_LINES that are new lines (the rest re-time or re-word existing ones)
ARGS = dict(a[2:].split("=", 1) for a in sys.argv[2:] if a.startswith("--") and "=" in a)
TARGET = ARGS.get("target", "alt2")
T = TARGETS[TARGET]
NEW_AUDIO, NEW_EXT = ROOT / T["audio"], ROOT / T["ext"]
END_ANCHORS, NEW_LINES, REWORDED = T["end"], T["new_lines"], T["reworded"]


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
    (ka, ba), (kb, bb) = T["coarse"]
    coarse = lambda s: ka * s + ba if s < INS_OLD else kb * s + bb        # the search centre
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
                  f"new song time ({T['audio']}, its ring-out {T['ext']}). "
                  "Piecewise linear through map; after the last point a constant shift; the jump at insert.old is the "
                  "inserted intro lines. Written by tools/retime.py map; read by video/src/core.js O()/OI()/Bn().",
         "target": TARGET,
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
    # new lines first (appended, then sorted in), so the indices of NEW_LINES count them
    for key, (sec, i, text, ws) in NEW_LINES.items():
        if key in INSERTED:                                          # the inserted intro lines
            tk = tokens(text); assert len(tk) == len(ws), key
            d["lines"].append({"sec": sec, "text": text, "t0": ws[0], "t1": None, "words": [[t, w] for t, w in zip(ws, tk)]})
    d["lines"].sort(key=lambda l: l["t0"])
    for key, (sec, i, text, ws) in NEW_LINES.items():                # re-measured lines (and changed words)
        if key in INSERTED:
            continue
        l = [l for l in d["lines"] if l["sec"] == sec][i]
        tk = tokens(text) if text else [w for _, w in l["words"]]
        assert len(tk) == len(ws), key
        l.update({"text": text or l["text"], "t0": ws[0], "words": [[t, w] for t, w in zip(ws, tk)]})
    for sec, i, text, keep in REWORDED.values():
        l = [l for l in d["lines"] if l["sec"] == sec][i]
        tk = tokens(text); assert len(tk) == len(keep), text
        l.update({"text": text, "words": [[l["words"][j][0], w] for j, w in zip(keep, tk)]})
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

ASR = pathlib.Path("/tmp/work/asr/sherpa-onnx-nemo-parakeet-tdt-0.6b-v2-int8")   # k2-fsa/sherpa-onnx GitHub releases


def candidates(stem, a, b):
    """Snap targets in [a, b] of a vocal stem: onsets, voicing starts and note changes (pYIN, a semitone or more)."""
    import librosa
    hop = 128
    y, sr = librosa.load(str(stem), sr=22050, offset=a, duration=b - a)
    cand = list(librosa.onset.onset_detect(y=y, sr=sr, hop_length=hop, units="time", delta=.07))
    f0, vf, _ = librosa.pyin(y, fmin=100, fmax=900, sr=sr, hop_length=hop)
    midi = np.where(vf, librosa.hz_to_midi(np.nan_to_num(f0, nan=1.0)), np.nan)
    tt = librosa.times_like(f0, sr=sr, hop_length=hop)
    for i in range(1, len(midi)):
        if (vf[i] and not vf[i - 1]) or (vf[i] and vf[i - 1] and abs(round(midi[i]) - round(midi[i - 1])) >= 1):
            cand.append(tt[i])
    return np.array(sorted(cand)) + a


def snap(cand, t, r=.12):
    j = int(np.argmin(abs(cand - t))) if len(cand) else -1
    return float(cand[j]) if j >= 0 and abs(cand[j] - t) <= r else t


def words(a, b, text, stem):
    """Word starts of `text` sung in [a, b] (new song time) on a vocal stem: recogniser word times, each snapped to the
    nearest onset or note change of the stem within 0.12 s. The recogniser alone is good to about 0.1 s on singing."""
    import sherpa_onnx, librosa, difflib
    x, sr = librosa.load(str(stem), sr=16000, offset=a, duration=b - a)
    rec = sherpa_onnx.OfflineRecognizer.from_transducer(
        encoder=str(ASR / "encoder.int8.onnx"), decoder=str(ASR / "decoder.int8.onnx"), joiner=str(ASR / "joiner.int8.onnx"),
        tokens=str(ASR / "tokens.txt"), model_type="nemo_transducer", num_threads=4)
    st = rec.create_stream()
    pad = np.zeros(8000, np.float32)
    st.accept_waveform(sr, np.concatenate([pad, x / (np.abs(x).max() + 1e-9) * .5, pad])); rec.decode_stream(st)
    heard = []
    for tok, t in zip(st.result.tokens, st.result.timestamps):
        if tok.startswith(" ") or not heard:
            heard.append([a + t - .5, tok.strip()])
        else:
            heard[-1][1] += tok
    print("heard:", " ".join(f"{w}({t:.2f})" for t, w in heard))
    cand = candidates(stem, a, b)
    norm = lambda w: "".join(c for c in w.lower() if c.isalpha())
    want = tokens(text)
    sm = difflib.SequenceMatcher(None, [norm(w) for w in want], [norm(w) for _, w in heard])
    got = [None] * len(want)
    for blk in sm.get_matching_blocks():
        for k in range(blk.size):
            got[blk.a + k] = heard[blk.b + k][0]
    for op, i1, i2, j1, j2 in sm.get_opcodes():               # misheard words: take the recogniser's times in order
        if op == "replace":
            for k in range(i2 - i1):
                if j1 + k < j2:
                    got[i1 + k] = heard[j1 + k][0]
    out = []
    for w, t in zip(want, got):
        if t is None:
            out.append((w, None, None)); continue
        out.append((w, t, snap(cand, t)))
    for w, t, s in out:
        print(f"  {w:10s} heard {t if t is None else round(t, 2)!s:>7}  snapped {s if s is None else round(s, 2)!s:>7}")
    print("[" + ", ".join("None" if s is None else f"{s:.2f}" for _, _, s in out) + "]")


def carry(src, stem_src, stem, extra=None):
    """The word times measured on another recording of the same performance (TARGETS[src]'s NEW_LINES, or --times=a,b,..
    of one line), carried onto this one: each line's vocal (1 s before, 1.5 s after) is aligned to this recording's vocal
    stem by DTW on log spectra (10 ms frames) around the line's offset found by cross-correlation, and every word start
    maps through the path. Only for words both recordings sing."""
    import librosa
    from scipy.signal import stft
    def load(p):
        x, _ = librosa.load(str(p), sr=16000)
        _, _, Z = stft(x, 16000, nperseg=1024, noverlap=1024 - 160)
        S = np.log1p(10 * np.abs(Z[:400])); S -= S.mean(1, keepdims=True)
        return S / (np.linalg.norm(S, axis=0) + 1e-9)
    A, B = load(stem_src), load(stem)
    (_, _), (kb, bb) = TARGETS[src]["coarse"]; (_, _), (kb2, bb2) = T["coarse"]
    lines = {"times": extra} if extra else {k: v[3] for k, v in TARGETS[src]["new_lines"].items()}
    for key, ws in lines.items():
        t = max(ws[0], 25.5)                                       # the inserted lines: the offset where the insert ends
        g = int(round((kb2 * (t - bb) / kb + bb2 - t) * 100))      # src time -> released time -> this recording, both fits
        a0, a1 = int((ws[0] - 1) * 100), int((ws[-1] + 1.5) * 100)
        a = A[:, a0:a1]
        sc, o = max((np.mean(np.sum(a * B[:, a0 + o:a1 + o], 0)), o) for o in range(g - 60, g + 61))
        b0 = a0 + o - 30
        b = B[:, b0:a1 + o + 30]
        _, wp = librosa.sequence.dtw(C=1 - a.T @ b, subseq=True)
        wp = wp[::-1]
        new = [round(float(b0 + wp[wp[:, 0] == int(round(w * 100)) - a0, 1].mean()) / 100, 2) for w in ws]
        cand = candidates(stem, new[0] - 1, new[-1] + 1)
        print(f"{key:9s} offset {o / 100:+.2f} (r {sc:.2f})  {list(ws)}\n{'':9s} -> {new}\n{'':9s} snapped (0.08 s) "
              f"{[round(snap(cand, t, .08), 2) for t in new]}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    if cmd == "map":
        m = build_map()
        EDITMAP.write_text(json.dumps(m, separators=(",", ":")))
        print(f"wrote {EDITMAP.relative_to(ROOT)}: {len(m['map'])} points, insert {m['insert']}, then +{m['shift_after']} s")
    elif cmd == "timing":
        retime()
    elif cmd == "carry":
        carry(ARGS.get("from", "alt"), ARGS["stem-from"], ARGS.get("stem", "/tmp/work/audio/vocals.wav"),
              [float(x) for x in ARGS["times"].split(",")] if "times" in ARGS else None)
    elif cmd == "words":
        pos = [x for x in sys.argv[2:] if not x.startswith("--")]
        words(float(pos[0]), float(pos[1]), pos[2], ARGS.get("stem", "/tmp/work/audio/vocals.wav"))
    else:
        print(__doc__)
