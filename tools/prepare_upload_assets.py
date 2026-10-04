"""Restore the current extended cut's local render assets without changing its edit or metadata.

Run with the render Python environment and ffmpeg on PATH. Uses committed takes/stills only.
Derived airlock and tether plates are rebuilt by their original preparation tools.
"""
import concurrent.futures as cf
import json
import multiprocessing as mp
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parent.parent
PL = ROOT / "video/plates"
sys.path.insert(0, str(ROOT / "tools"))
ACTIVE_MASKS = """airlock_exit glove_cu hero_sunrise ship_wide_sunrise visor_cu visor_sunrise
camera_reach headfirst porthole_sunrise suit_balloon tumble_slow airlock_jettison belyayev_turn
capsule_glide capsule_spin descent_forest drawing_pencils globus helmet_off leonov_turn parachute
reentry_fire treetops airlock_fail g_force valve_bleed leonov_drawing_hand fire_night_v2 porthole_spin
reentry_outside hatch_tree hatch_free rescue_v2 airlock_struggle drawing_hand jade_notebook_p
jade_hand_writing_p card_by_fire hand_over_hand ship_wide_close vzor_manual_cu tether_drift_t2
countdown_drift_t3 leg_station leg_commercial leg_philae leg_change4 leg_chandrayaan3 leg_survivors
leg_tiangong leg_shenzhou7 leg_curiosity""".split()
ALIASES = {"countdown_drift_t3": ("countdown_drift", "take3.mp4"),
           "tether_drift_t2": ("tether_drift", "take2.mp4"),
           "vzor_manual_t2": ("vzor_manual", "take2.mp4"),
           "vzor_manual_t3": ("vzor_manual", "take3.mp4"),
           "vzor_manual_cu": ("vzor_manual", "take6.mp4"),
           "jade_loc_day": ("jade_loc_day", "take1.mp4")}


def extract(item):
    from PIL import Image
    pid, info = item
    d = PL / pid
    d.mkdir(exist_ok=True)
    if (d / f"f{info['n']:04d}.jpg").exists():
        return
    still = ROOT / "media/stills" / f"{pid}.png"
    if pid.startswith("leg_") and still.is_file():
        Image.open(still).convert("RGB").resize((info["w"], info["h"]), Image.Resampling.LANCZOS).save(d / "f0001.jpg", quality=92)
    elif pid == "vzor_manual_s4":
        Image.open(ROOT / "media/plates/vzor_manual/take4.first.jpg").convert("RGB").resize((960, 540), Image.Resampling.LANCZOS).save(d / "f0001.jpg", quality=92)
    else:
        source_id, take = ALIASES.get(pid, (pid, info["take"]))
        src = ROOT / "media/plates" / source_id / take
        if not src.is_file():
            return  # inactive review variants and the local-only museum photo
        subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-threads", "2", "-i", str(src),
                        "-filter_threads", "1", "-vf", f"fps=24,scale={info['w']}:{info['h']}:flags=lanczos",
                        "-frames:v", str(info["n"]), "-q:v", "3", str(d / "f%04d.jpg")], check=True)
    if len(list(d.glob("f*.jpg"))) != info["n"]:
        raise RuntimeError(f"{pid}: extracted frame count differs from the approved index")
    print(f"extracted {pid}: {info['n']} frames", flush=True)


def masks(pid):
    from PIL import Image
    from rembg import new_session, remove
    os.environ.setdefault("U2NET_HOME", "/tmp/work/u2")
    os.environ.setdefault("OMP_NUM_THREADS", "2")
    todo = [f for f in sorted((PL / pid).glob("f*.jpg")) if int(f.stem[1:]) % 2 and not f.with_name("m" + f.stem[1:] + ".png").exists()]
    if not todo:
        return
    global SESSION
    if "SESSION" not in globals():
        SESSION = new_session("isnet-general-use", providers=["CPUExecutionProvider"])
    t0 = time.monotonic()
    for f in todo:
        im = Image.open(f).convert("RGB").resize((512, 288))
        remove(im, session=SESSION, only_mask=True).save(f.with_name("m" + f.stem[1:] + ".png"))
    print(f"masked {pid}: {len(todo)} frames in {time.monotonic()-t0:.1f}s", flush=True)


def main():
    idx = json.loads((PL / "index.json").read_text())
    # The normal extractor deletes metadata and chooses latest takes. Keep the approved index instead.
    with cf.ThreadPoolExecutor(max_workers=4) as ex:
        list(ex.map(extract, [(k, v) for k, v in idx.items() if not k.startswith("airlock_cut") and not k.startswith("airlock_side")]))
    for pid in ACTIVE_MASKS:
        if not (PL / pid / "f0001.jpg").is_file():
            raise RuntimeError(f"missing committed source for active plate {pid}")
    with mp.get_context("spawn").Pool(3) as pool:
        pool.map(masks, ACTIVE_MASKS)
    # These tools also write measured metadata. Preserve the approved measurements and edit tracks.
    files = [PL / "index.json", ROOT / "video/data/tether_n1.json", ROOT / "video/data/tether_i6.json"]
    files += list(PL.glob("*/meta.json")) + list(PL.glob("*/stats.json"))
    saved = {p: p.read_bytes() for p in files if p.exists()}
    try:
        import airlock_stills as airlock
        import cv2
        cv2.setNumThreads(2)
        airlock.meta = lambda *a, **kw: None
        for pid in ("airlock_cut", "airlock_side"):
            if not (PL / pid / "f0121.jpg").exists():
                airlock.run(pid)
        import tether_r5
        for key, fn in (("tether_drift_r5", tether_r5.n1), ("hero_sunrise_r5", tether_r5.i6)):
            if not (PL / key / "f0001.jpg").exists():
                fn()
    finally:
        for p, data in saved.items():
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_bytes(data)
    active = set(ACTIVE_MASKS) | {"airlock_cut", "airlock_side", "hero_sunrise_r5", "countdown_drift_r5",
                                 "tether_drift_r5", "jade_loc_day", "jade_dusk", "jade_rare_her_m"}
    for pid in active:
        info = idx[pid]
        for f in range(1, info["n"] + 1):
            if not (PL / pid / f"f{f:04d}.jpg").is_file():
                raise RuntimeError(f"missing frame {pid}/{f}")
            if info.get("mattes") and f % 2 and not (PL / pid / f"m{f:04d}.png").is_file():
                raise RuntimeError(f"missing subject mask {pid}/{f}")
    print("Approved extended-cut render assets restored.", flush=True)


if __name__ == "__main__":
    main()
