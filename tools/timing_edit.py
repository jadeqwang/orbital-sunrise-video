"""Edit and check video/data/timing.json (beats, sections, lyric lines, word times) for a new or longer mix.

The script that first built timing.json (MDX-Net vocal stem -> Whisper word times -> matched to the lyric sheet and snapped
to onsets; beats tracked at 162.33 BPM; sections set by hand) was never committed. This tool covers what an alternate cut
needs instead, without that script (see docs/ALTERNATE_CUT.md):

  python3 tools/timing_edit.py export [--out=media/audio/Orbital_Sunrise_lyrics_timed.txt]
        the lyric text exactly as timed (section headers + one line per lyric line), from timing.json
  python3 tools/timing_edit.py check
        sanity checks: sorted beats/words, lines inside their section, word tokens match the line text
  python3 tools/timing_edit.py shift --at=T --by=D [--out=...]
        the new mix is the old one with D seconds inserted at song time T (D < 0: removed). Everything at or after T moves
        by D; the section containing T grows; beats continue the local grid through the gap; dur/durExt grow.
  python3 tools/timing_edit.py line --sec=brk --text="New words sung here" --t0=112.0 --t1=115.2 [--words=112.0,112.4,...]
        [--tlast=114.3] [--grid=8] [--replace=N] [--out=...]
        add (or, with --replace=N, replace line N of that section) a lyric line; t1 = where the line ends (the last word's
        hold included). --words: the word starts (by ear, checked with `clicks`). Without --words they are spread by
        syllable count from t0 to --tlast (the last word's start; default t1): only a first guess (on the existing lines
        this is off by 0.2 s median, 0.65 s at p90). --grid=8 snaps every word after the first to the nearest 8th note of
        the beat grid (the song's sung words sit within 0.04 s median of it), --grid=16 to 16ths.
  python3 tools/timing_edit.py align --audio=vocals.wav --sec=brk --text="..." --t0=.. --t1=.. [--model=small.en]
        like `line`, but the word starts come from faster-whisper word timestamps in [t0-1, t1+1], matched to the given
        words (needs `pip install faster-whisper` and its model download from huggingface.co; see the doc).
  python3 tools/timing_edit.py clicks --from=104 --to=118 [--audio=media/audio/Orbital_Sunrise_extended.wav] [--out=clicks.mp3]
        the song with a click on every word start (high) and beat (low): listen to check word times by ear.
  python3 tools/timing_edit.py hardcoded [--after=T]
        list the absolute song times / beat numbers written into video/src/shots*.js (read-only), i.e. what a longer or
        rearranged song breaks. With --after, only those at or after song time T.

Reads --in (default video/data/timing.json); writes go to --out (default: video/data/timing.json itself; `git diff` to
review). Times are song seconds.
"""
import sys, json, re, pathlib, subprocess, difflib
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
TIMING = ROOT / "video/data/timing.json"
SRC = [ROOT / "video/src/shots.js", ROOT / "video/src/shots2.js"]
STRIP = "()…—"                       # characters dropped from line text to get the word tokens (as in timing.json)


def tokens(text):
    return [w for w in (t.strip(STRIP) for t in text.split()) if w]


IN = [TIMING]


def load():
    return json.loads(IN[0].read_text())


def save(d, out):
    out = pathlib.Path(out) if out else TIMING
    d["lines"].sort(key=lambda l: l["t0"])
    out.write_text(json.dumps(d, separators=(",", ":"), ensure_ascii=False))
    print(f"wrote {out.relative_to(ROOT) if out.is_relative_to(ROOT) else out}")


def r3(x):
    return round(float(x), 3)


def syllables(w):
    w = w.lower().strip(",.'!?")
    n = len(re.findall(r"[aeiouy]+", w))
    if w.endswith("e") and not w.endswith(("le", "ee")) and n > 1:
        n -= 1
    return max(1, n)


def load_audio(path, sr=16000, ss=0.0, dur=None):
    cmd = ["ffmpeg", "-hide_banner", "-loglevel", "error", "-ss", str(ss)] + (["-t", str(dur)] if dur else [])
    cmd += ["-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "f32le", "-"]
    return np.frombuffer(subprocess.run(cmd, capture_output=True, check=True).stdout, dtype=np.float32)


def spread(words, t0, t1):
    sy = np.array([syllables(w) for w in words], float)
    starts = t0 + (t1 - t0) * np.concatenate([[0], np.cumsum(sy)[:-1]]) / sy.sum()
    return list(starts)


def quantize(times, beats, div):
    """Snap each time to the nearest 1/(div/4) beat subdivision of the measured beat grid (div 8 = 8th notes)."""
    b = np.asarray(beats); k = max(1, div // 4)
    grid = np.concatenate([b[:-1] + (b[1:] - b[:-1]) * j / k for j in range(k)] + [b[-1:]])
    grid.sort()
    return [times[0]] + [float(grid[np.argmin(abs(grid - t))]) for t in times[1:]]


def add_line(d, sec, text, times, t1, replace=None):
    secs = {s[0]: s for s in d["sections"]}
    if sec not in secs:
        sys.exit(f"no section {sec!r}; sections: {', '.join(secs)}")
    toks = tokens(text)
    assert len(toks) == len(times), f"{len(toks)} words but {len(times)} times"
    line = {"sec": sec, "text": text, "t0": r3(times[0]), "words": [[r3(t), w] for t, w in zip(times, toks)], "t1": r3(t1)}
    if replace is not None:
        same = [l for l in d["lines"] if l["sec"] == sec]
        d["lines"].remove(same[replace])
    d["lines"].append(line)
    d["lines"].sort(key=lambda l: l["t0"])
    s = secs[sec]
    if not (s[1] <= line["t0"] and line["t1"] <= s[2] + 1.0):
        print(f"warning: line {line['t0']}-{line['t1']} is outside section {sec} {s[1]}-{s[2]}")
    print(json.dumps(line, ensure_ascii=False))


def cmd_export(a):
    d = load()
    out = pathlib.Path(a.get("out", ROOT / "media/audio/Orbital_Sunrise_lyrics_timed.txt"))
    rows = ["# The lyric lines exactly as timed in video/data/timing.json (written by tools/timing_edit.py export).",
            "# [section start end] headers are the film's sections (song seconds); each following line is one timed lyric line,",
            "# its words are timing.json's word tokens (the text split on spaces, with ( ) … — dropped).",
            "# The drop1 lines are the chopped vocal (\"Sun-rise… (bring me) home…\") timed as the hook's words.",
            "# Orbital_Sunrise_Lyrics.md (repo root) is the lyric sheet as written; this file is what the film is keyed to."]
    for s in d["sections"]:
        rows.append(f"\n[{s[0]} {s[1]} {s[2]}]")
        rows += [l["text"] for l in d["lines"] if l["sec"] == s[0]]
    out.write_text("\n".join(rows) + "\n")
    print(f"wrote {out}")


def cmd_check(a):
    d = load(); bad = 0
    b = d["beats"]
    if any(y <= x for x, y in zip(b, b[1:])):
        print("beats not increasing"); bad += 1
    secs = {s[0]: s for s in d["sections"]}
    for x, y in zip(d["sections"], d["sections"][1:]):
        if abs(x[2] - y[1]) > 1e-6:
            print(f"sections {x[0]}/{y[0]} not contiguous"); bad += 1
    for l in d["lines"]:
        ws = [t for t, _ in l["words"]]
        if ws != sorted(ws) or abs(ws[0] - l["t0"]) > 1e-6 or l["t1"] < ws[-1]:
            print(f"word times out of order: {l['text']}"); bad += 1
        if [w for _, w in l["words"]] != tokens(l["text"]):
            print(f"tokens differ from text: {l['text']!r}"); bad += 1
        s = secs.get(l["sec"])
        if not s or l["t0"] < s[1] - 1e-6:
            print(f"line before its section: {l['sec']} {l['t0']} {l['text']}"); bad += 1
        elif l["t0"] > s[2]:   # allowed: the last outro lines (home. / Made it down) run on into 'landed', used there as OU[3..5]
            print(f"note: line after its section's end (allowed, the shots index it by section): {l['sec']} {l['t0']} {l['text']}")
    print(f"{len(b)} beats ({d['bpm']} BPM), {len(d['sections'])} sections, {len(d['lines'])} lines, dur {d['dur']}, "
          f"durExt {d.get('durExt')}: {'OK' if not bad else str(bad) + ' problem(s)'}")
    return bad


def cmd_shift(a):
    T, D = float(a["at"]), float(a["by"])
    d = load()
    mv = lambda t: r3(t + D) if t >= T else t
    if D < 0 and any(T <= w[0] < T - D for l in d["lines"] for w in l["words"]):
        print("warning: removed span contains lyric words; those lines now overlap: delete or re-time them")
    b = np.array(d["beats"])
    before, after = b[b < T], b[b >= T]
    if D < 0:
        after = after[after >= T - D]
    per = float(np.median(np.diff(before[-8:]))) if len(before) > 8 else d["beat"]
    if D > 0:
        nb = D / per
        if abs(nb - round(nb)) > .15:
            print(f"warning: {D} s is {nb:.2f} beats; a musical insert is usually whole bars (4 beats = {4 * per:.3f} s)")
        lim = (after[0] + D if len(after) else T + D) - per / 2          # fill up to the first moved beat
        gap = [before[-1] + per * k for k in range(1, int(np.ceil((lim - before[-1]) / per)) + 1) if before[-1] + per * k < lim]
    else:
        gap = []
    d["beats"] = [r3(x) for x in list(before) + gap + list(after + D)]
    for s in d["sections"]:
        s[1] = s[1] if s[1] <= T else r3(s[1] + D)
        s[2] = s[2] if s[2] <= T else r3(s[2] + D)   # the section containing T (start <= T < end) grows
    for l in d["lines"]:
        l["t0"], l["t1"] = mv(l["t0"]), mv(l["t1"])
        l["words"] = [[mv(t), w] for t, w in l["words"]]
    d["dur"] = r3(d["dur"] + D)
    if "durExt" in d:
        d["durExt"] = r3(d["durExt"] + D)
    print(f"shifted by {D:+.3f} s from {T} s: {len(d['beats'])} beats (+{len(d['beats']) - len(b)}), dur {d['dur']}; "
          f"beat numbers after {T} s moved by {len(d['beats']) - len(b)}: B(n) in video/src must follow (see `hardcoded`)")
    save(d, a.get("out"))


def cmd_line(a, align=False):
    d = load()
    text, t0, t1 = a["text"], float(a["t0"]), float(a["t1"])
    toks = tokens(text)
    if "words" in a:
        times = [float(x) for x in a["words"].split(",")]
    elif align:
        times = whisper_times(a["audio"], toks, t0, t1, a.get("model", "small.en"))
    else:
        if "tlast" in a and len(toks) > 1:     # the first n-1 words fill [t0, tlast), the last starts at tlast
            times = spread(toks[:-1], t0, float(a["tlast"])) + [float(a["tlast"])]
        else:
            times = spread(toks, t0, t1)
    if "grid" in a:
        times = quantize(times, d["beats"], int(a["grid"]))
    add_line(d, a["sec"], text, times, t1, int(a["replace"]) if "replace" in a else None)
    save(d, a.get("out"))


def match_words(toks, heard):
    """heard: [(start, word)] from ASR. Returns a start per token: matched ones from ASR, the rest interpolated."""
    norm = lambda w: re.sub(r"[^a-z']", "", w.lower())
    A, Bw = [norm(w) for w in toks], [norm(w) for _, w in heard]
    t = [None] * len(toks)
    for blk in difflib.SequenceMatcher(None, A, Bw, autojunk=False).get_matching_blocks():
        for k in range(blk.size):
            t[blk.a + k] = heard[blk.b + k][0]
    known = [i for i, x in enumerate(t) if x is not None]
    if not known:
        return None
    for i in range(len(t)):
        if t[i] is None:
            lo = max([k for k in known if k < i], default=None); hi = min([k for k in known if k > i], default=None)
            if lo is not None and hi is not None:
                t[i] = t[lo] + (t[hi] - t[lo]) * (i - lo) / (hi - lo)
            elif lo is not None:
                t[i] = t[lo] + .3 * (i - lo)
            else:
                t[i] = t[hi] - .3 * (hi - i)
    return t


def whisper_times(audio, toks, t0, t1, model):
    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("pip install faster-whisper (and allow huggingface.co for the model download), or use `line` instead")
    ss = max(0.0, t0 - 1)
    y = load_audio(audio, 16000, ss, t1 - ss + 1)
    m = WhisperModel(model, device="cpu", compute_type="int8")
    segs, _ = m.transcribe(y, language="en", word_timestamps=True, initial_prompt=" ".join(toks), vad_filter=False)
    heard = [(ss + w.start, w.word) for s in segs for w in (s.words or [])]
    print("heard:", " ".join(f"{w.strip()}@{t:.2f}" for t, w in heard))
    t = match_words(toks, heard)
    if t is None:
        sys.exit("no lyric word recognised in that window: use `line` (syllable spread + onset snap) and check by ear")
    t[0] = max(t[0], t0 - .3)
    return t


def cmd_clicks(a):
    d = load()
    a0, a1 = float(a["from"]), float(a["to"])
    audio = a.get("audio") or next(p for p in [ROOT / "media/audio/Orbital_Sunrise_extended.wav",
                                                  ROOT / "media/audio/Orbital_Sunrise_extended.m4a"] if p.exists())
    sr = 44100
    y = load_audio(audio, sr, a0, a1 - a0) * .7
    def click(t, f, amp):
        i = int((t - a0) * sr); n = int(.03 * sr)
        if 0 <= i < len(y) - n:
            k = np.arange(n) / sr
            y[i:i + n] += amp * np.sin(2 * np.pi * f * k) * np.exp(-k * 120)
    for b in d["beats"]:
        click(b, 800, .25)
    for l in d["lines"]:
        for t, _ in l["words"]:
            click(t, 2400, .5)
    out = a.get("out", "clicks.mp3")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-",
                    "-c:a", "libmp3lame", "-b:a", "160k", out], input=np.clip(y, -1, 1).astype(np.float32).tobytes(), check=True)
    print(f"wrote {out} ({a0}-{a1} s): high click = word start, low click = beat")


def cmd_hardcoded(a):
    d = load()
    after = float(a.get("after", -1))
    beats = d["beats"]
    bt = lambda n: beats[n] if 0 <= n < len(beats) else None
    pat_num = re.compile(r"(?<![\w.])(\d{1,3}\.\d+)(?!\w)")
    pat_beat = re.compile(r"\b(?:B|beatTime)\((\d+)\)|\b(\w+_B0|LEG_END)\s*=\s*(\d+)")
    for f in SRC:
        for i, line in enumerate(f.read_text().splitlines(), 1):
            code = line.split("//")[0]
            hits = []
            for m in pat_beat.finditer(code):
                n = int(m.group(1) or m.group(3)); t = bt(n)
                if t is not None and t >= after:
                    hits.append(f"beat {n} (≈{t:.2f} s)")
            if re.search(r"shot\(|t0|t1|tele\(|\bt\s*[-<>]|SEG|lag|EVA|steps|riser|roll", code):
                for m in pat_num.finditer(code):
                    v = float(m.group(1))
                    if 7 <= v <= d["dur"] + 10 and v >= after:
                        hits.append(f"{v} s")
            if hits:
                print(f"{f.relative_to(ROOT)}:{i}: {', '.join(hits)}\n    {code.strip()[:150]}")


def main():
    if len(sys.argv) < 2 or sys.argv[1] in ("-h", "--help"):
        print(__doc__); return
    a = dict(x[2:].split("=", 1) if "=" in x else (x[2:], "1") for x in sys.argv[2:] if x.startswith("--"))
    c = sys.argv[1]
    if "in" in a:
        IN[0] = pathlib.Path(a["in"]).resolve()
    if c == "export": cmd_export(a)
    elif c == "check": sys.exit(1 if cmd_check(a) else 0)
    elif c == "shift": cmd_shift(a)
    elif c == "line": cmd_line(a)
    elif c == "align": cmd_line(a, align=True)
    elif c == "clicks": cmd_clicks(a)
    elif c == "hardcoded": cmd_hardcoded(a)
    else: sys.exit(__doc__)


if __name__ == "__main__":
    main()
