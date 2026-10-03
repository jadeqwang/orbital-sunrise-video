"""Re-render a few shots onto the current release's own frames and re-encode, without rebuilding the whole film.

    python3 tools/splice_release.py D5_the_drawing C1_drawing [--q=drawing=user] [--grade=H1d_home] [--release=release/extended]
                                    [--name=Orbital_Sunrise_extended] [--keep] [--no-encode]

Only the plates those shots use need to be on disk (video/plates/<id>/f*.jpg, and mattes where index.json says so; frames
are not in git: tools/extract_plates.py, tools/plate_masks.py, or the tool that built a derived plate). Steps:
1. Decode <release>/<name>_1080p.mp4 to video/out/splice/f%05d.jpg (frame i = film time i/24), unless already there.
2. `render.mjs --list` gives each shot's span; the frames strictly inside it (0.01 s clear of both cuts, so a frame that
   belongs to the neighbouring shot is never replaced) are re-rendered over the decoded ones (render.mjs --frames, --q passed on).
   --grade=SHOT[,SHOT]: tools/skin_grade.py over those shots' frames afterwards (H1d_home's skin colour, a post step). Never
   twice on the same frames: from the 2026-10-03 release on, the decoded H1d_home frames are graded already, so --grade
   only goes with a re-render of that shot (or a full render)
3. FRAMES=video/out/splice tools/encode_release.sh writes <release>/<name>_1080p.mp4 and _720p_h264.mp4 (two-pass, < 100 MB).
The untouched shots go through one more generation of compression (not visible at these rates, but it adds up: splice from
a full render when there is one). --keep keeps the frame folder (2.5 GB) for another splice.
"""
import sys, os, re, math, shutil, subprocess, pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
VID = ROOT / "video"; FPS = 24


def run(cmd, **kw):
    print("+", " ".join(map(str, cmd)), flush=True)
    return subprocess.run(cmd, check=True, **kw)


def main(a):
    opt = dict((x[2:].split("=", 1) + [True])[:2] for x in a if x.startswith("--"))
    shots = [x for x in a if not x.startswith("--")]
    if not shots: sys.exit(__doc__)
    rel = ROOT / opt.get("release", "release/extended"); name = opt.get("name", "Orbital_Sunrise_extended")
    src = rel / f"{name}_1080p.mp4"; out = VID / "out" / "splice"
    q = ["--q=" + opt["q"]] if isinstance(opt.get("q"), str) else []
    if not out.exists() or not any(out.glob("f*.jpg")):
        out.mkdir(parents=True, exist_ok=True)
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", src, "-start_number", "0", "-q:v", "1", out / "f%05d.jpg"])
    lst = subprocess.run(["node", "render.mjs", "--list", *q], cwd=VID, capture_output=True, text=True).stdout
    span = {m[1]: (float(m[2]), float(m[3])) for m in re.finditer(r"^(\S+)\s+([\d.]+)\s+→\s+([\d.]+)", lst, re.M)}
    inside = lambda s: (math.ceil((span[s][0] + .01) * FPS), math.floor((span[s][1] - .01) * FPS))
    grade = [g for g in str(opt.get("grade", "")).split(",") if g and g != "True"]
    for s in shots + grade:
        if s not in span: sys.exit(f"no shot {s} in render.mjs --list")
    for s in shots:
        t0, t1 = span[s]; f0, f1 = inside(s)
        print(f"{s}: {t0:.2f} → {t1:.2f} s, frames {f0}–{f1}")
        # render.mjs --frames=a:b renders frames round(a*24) … round(b*24)-1
        run(["node", "render.mjs", f"--frames={f0 / FPS:.6f}:{(f1 + 1) / FPS:.6f}", "--workers=4", "--dir=out/splice", "--force", *q], cwd=VID)
    for s in grade:
        f0, f1 = inside(s); run([sys.executable, ROOT / "tools" / "skin_grade.py", out, str(f0), str(f1)])
    if "no-encode" not in opt:
        env = dict(os.environ, FRAMES=str(out), OUT=str(rel), NAME=name)
        run(["bash", ROOT / "tools" / "encode_release.sh"], env=env)
    if "keep" not in opt and "no-encode" not in opt: shutil.rmtree(out)


if __name__ == "__main__":
    main(sys.argv[1:])
