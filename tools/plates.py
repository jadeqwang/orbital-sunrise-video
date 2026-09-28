"""Generate Seedance plates (reference footage the renderer redraws) from tools/plate_specs.py.

    python3 tools/plates.py                 # run every spec whose output is missing
    python3 tools/plates.py hero_sunrise    # run specific plates (re-runs even if present, as a new take)
    python3 tools/plates.py --list

Each plate lands in media/plates/<id>/take<N>.mp4 plus a frame sheet (sheet.jpg) for review.
"""
import sys, os, json, time, pathlib, subprocess, concurrent.futures as cf
sys.path.insert(0, os.path.dirname(__file__))
import cfai
from plate_specs import PLATES, ref

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "media" / "plates"
MAX_PAR = int(os.environ.get("PLATE_PAR", "6"))


def takes(pid):
    d = OUT / pid
    return sorted(d.glob("take*.mp4")) if d.exists() else []


def sheet(mp4):
    out = mp4.with_suffix(".sheet.jpg")
    dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(mp4)],
                               capture_output=True, text=True).stdout or 5)
    n = 8
    subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-i", str(mp4), "-vf",
                    f"fps={n/dur:.4f},scale=480:-1,tile=4x2", "-frames:v", "1", str(out)], check=False)
    return out


def run_plate(pid, force=False):
    spec = PLATES[pid]
    existing = takes(pid)
    if existing and not force:
        return pid, str(existing[-1]), "exists"
    n = max((int(p.stem[4:]) for p in existing), default=0) + 1  # rejects move to media/archive: never reuse a number
    out = OUT / pid / f"take{n}.mp4"
    inp = {
        "prompt": spec["prompt"],
        "duration": spec.get("duration", 5),
        "resolution": spec.get("resolution", "720p"),
        "aspect_ratio": spec.get("aspect_ratio", "16:9"),
        "generate_audio": spec.get("generate_audio", False),
    }
    imgs = [ref(r) for r in spec.get("refs", [])]
    if imgs:
        inp["reference_images"] = imgs
    if spec.get("first_frame"):
        inp["image"] = ref(spec["first_frame"])
    if spec.get("last_frame"):
        inp["last_frame_image"] = ref(spec["last_frame"])
    if spec.get("audio"):
        inp["reference_audios"] = [cfai.data_uri(a) for a in spec["audio"]]
    if spec.get("faces", True):
        inp["use_virtual_avatar"] = True
    if "seed" in spec:
        inp["seed"] = spec["seed"]
    t0 = time.time()
    refs = list(spec.get("refs", []))
    for attempt in range(4):
        try:
            paths, res = cfai.gen(spec.get("model", "bytedance/seedance-2.5"), inp, out, tag="plate:" + pid, timeout=1500)
            break
        except Exception as e:
            msg = str(e)
            if "PrivacyInformation" in msg and attempt < 3 and refs:
                # the real-person filter is probabilistic: reshuffle, then drop face close-up sheets (keep turnarounds)
                if attempt == 1:
                    refs = [r for r in refs if r not in ("LF", "BF", "JF", "J3F")] or refs
                refs = refs[1:] + refs[:1]
                inp["reference_images"] = [ref(r) for r in refs]
                print(f"[plate] {pid}: privacy filter, retry {attempt+1} with refs {refs}", flush=True)
                continue
            if "Timeout" in type(e).__name__ or "timeout" in msg.lower():
                print(f"[plate] {pid}: timed out, resubmitting", flush=True)
                continue
            return pid, None, f"ERR {msg[:300]}"
    else:
        return pid, None, "ERR retries exhausted"
    s = sheet(out)
    (OUT / pid / f"take{n}.json").write_text(json.dumps({"spec": {k: v for k, v in spec.items()}, "secs": round(time.time() - t0)}, indent=1))
    return pid, str(out), f"ok {time.time()-t0:.0f}s"


if __name__ == "__main__":
    a = sys.argv[1:]
    if "--list" in a:
        for k, v in PLATES.items():
            print(f"{k:24s} {v.get('duration',5):>3}s  takes={len(takes(k))}  {v['prompt'][:90]}")
        sys.exit()
    ids = [x for x in a if not x.startswith("--")] or [k for k in PLATES if not takes(k)]
    force = bool([x for x in a if not x.startswith("--")])
    print(f"generating {len(ids)} plates, {MAX_PAR} at a time: {ids}")
    with cf.ThreadPoolExecutor(MAX_PAR) as ex:
        futs = {ex.submit(run_plate, p, force): p for p in ids}
        for f in cf.as_completed(futs):
            pid, path, status = f.result()
            print(f"[plate] {pid}: {status} {path or ''}", flush=True)
