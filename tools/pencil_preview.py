"""Pencil previews of candidate stills: how a still would look drawn by the film's renderer, in its own shot.

    python3 tools/pencil_preview.py media/refs/jade_first_hook1.png:H1d_home:33.3 [more ...] [--out=release/review]
        [--hires]          keep the still at 1920 wide instead of the plates' 960x540
        [--q=fineface]     extra studio.html query (e.g. the fine face experiment)  [--suffix=_fine]

For each still: install it as a 1-frame plate `pv_<name>` (video/plates/pv_<name>/f0001.jpg + meta + matte + index entry),
then render the film frame at time t with the shot's plate swapped for it (studio.html ?swap=<plate>:pv_<name>), so
framing, paper, hatching, face treatment and type are exactly the film's. Writes <out>/pencil_<name>.jpg (1920x1080).
"""
import sys, json, pathlib, subprocess, shutil
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent
PL = ROOT / "video" / "plates"
SHOT_PLATE = {"H1d_home": "jade_hook1_p", "K4_home": "jade_studio_p", "B3_never": "jade_brk_p", "B2_float": "jade_notebook_p",
              "A1_snow": "jade_hand_writing_p", "A2_hands": "jade_hand_writing_p"}


def install(src, pid, hires=False):
    d = PL / pid
    if d.exists():
        shutil.rmtree(d)
    d.mkdir(parents=True)
    w, h = (1920, 1080) if hires else (960, 540)
    Image.open(src).convert("RGB").resize((w, h), Image.LANCZOS).save(d / "f0001.jpg", quality=94)
    subprocess.run([sys.executable, str(ROOT / "tools/plate_meta.py"), pid, "--force"], check=True, capture_output=True)
    subprocess.run([sys.executable, str(ROOT / "tools/plate_masks.py"), pid], check=True, capture_output=True)
    idx_path = PL / "index.json"
    idx = json.loads(idx_path.read_text())
    st = json.loads((d / "stats.json").read_text()) if (d / "stats.json").exists() else {}
    idx[pid] = {"n": 1, "fps": 24, "w": 960, "h": 540, "take": "still", "mattes": True, "gain": st.get("gain", 1.0)}
    idx_path.write_text(json.dumps(idx, indent=1))


if __name__ == "__main__":
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    out = pathlib.Path(next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--out=")), ROOT / "release" / "review"))
    out.mkdir(parents=True, exist_ok=True)
    opt = lambda k, d="": next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith(f"--{k}=")), d)
    hires, extra, suffix = "--hires" in sys.argv, opt("q"), opt("suffix")
    for a in args:
        src, shot, t = a.rsplit(":", 2)
        name = pathlib.Path(src).stem.replace("jade_first_", "")
        pid = f"pv_{name}"
        install(ROOT / src, pid, hires)
        tmp = ROOT / "video" / "out" / "pv"
        subprocess.run(["node", "render.mjs", f"--stills={t}", f"--out={tmp}", f"--q=swap={SHOT_PLATE[shot]}:{pid}" + (f"&{extra}" if extra else "")],
                       cwd=ROOT / "video", check=True, capture_output=True)
        f = tmp / f"t{float(t):.2f}".replace(".", "_")
        f = f.with_suffix(".jpg")
        Image.open(f).convert("RGB").save(out / f"pencil_{name}{suffix}.jpg", quality=86, optimize=True)
        print("wrote", out / f"pencil_{name}{suffix}.jpg")
