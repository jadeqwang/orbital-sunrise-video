"""Encode upload copies from the approved, already graded PNG frames.

    video/out/.venv/bin/python tools/encode_uploads.py youtube
    video/out/.venv/bin/python tools/encode_uploads.py x

YouTube uses 4K; X uses 1080p with a bounded bitrate for upload compatibility.
Both use two-pass H.264 with copied AAC audio. The archival master is read only.
Samples: add --sample=skin --start=44.375 --duration=4.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
from artwork_frames import verify_artwork_frames

ROOT = Path(__file__).resolve().parent.parent
MASTER = ROOT / "video/out/masters/Orbital_Sunrise_extended_4K_master.mp4"
AUDIO = ROOT / "media/audio/Orbital_Sunrise_alt2_extended.m4a"
FRAMES = ROOT / "video/out/master_frames"
FFMPEG = ROOT / "video/out/bin/ffmpeg"
TARGETS = {
    "youtube": (45, "YouTube", 3840, 2160, "5.1"),
    "x": (12, "X", 1920, 1080, "4.1"),
}


def checksum(path):
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(4 * 1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("target", choices=TARGETS)
    p.add_argument("--sample")
    p.add_argument("--start", type=float, default=0)
    p.add_argument("--duration", type=float)
    a = p.parse_args()
    approved_artwork = verify_artwork_frames()
    if a.sample:
        if not a.sample.replace("_", "").isalnum() or not a.duration or a.duration <= 0:
            p.error("samples require an alphanumeric name and a positive --duration")
    elif a.start or a.duration is not None:
        p.error("--start and --duration require --sample")
    first = round(a.start * 24)
    count = round(a.duration * 24) if a.sample else 6055
    if first < 0 or count < 1 or first + count > 6055:
        p.error("requested frames are outside the approved cut")
    for i in range(first, first + count):
        f = FRAMES / f"f{i:05d}.png"
        if not f.is_file() or f.stat().st_size < 1000:
            raise RuntimeError(f"missing approved PNG frame: {f}")

    rate, label, width, height, level = TARGETS[a.target]
    out = ROOT / "video/out/uploads"
    if a.sample:
        out /= "review"
    out.mkdir(parents=True, exist_ok=True)
    resolution = "4K" if height == 2160 else f"{height}p"
    name = f"Orbital_Sunrise_extended_original_artwork_{resolution}_{a.target}_{rate}Mbps"
    if a.sample:
        name += f"_sample_{a.sample}"
    final = out / f"{name}.mp4"
    partial = out / f"{name}.partial.mp4"
    manifest = partial.with_suffix(".json")
    for f in (final, final.with_suffix(".json"), partial, manifest):
        if f.exists():
            raise RuntimeError(f"refusing to overwrite existing output: {f}")

    master_before = checksum(MASTER)
    print(f"{label}: source checked; master SHA-256 {master_before}", flush=True)
    frame_input = ["-framerate", "24", "-start_number", str(first), "-i", str(FRAMES / "f%05d.png")]
    settings = ["-vf", f"scale={width}:{height}:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p",
                "-frames:v", str(count), "-c:v", "libx264", "-preset", "slow", "-tune", "grain",
                "-b:v", f"{rate}M", "-profile:v", "high", "-level:v", level, "-threads", "8",
                "-g", "48", "-keyint_min", "24", "-color_range", "tv", "-color_primaries", "bt709",
                "-color_trc", "bt709", "-colorspace", "bt709", "-passlogfile", str(out / (name + ".pass"))]
    if a.target == "x":
        settings += ["-maxrate", "16M", "-bufsize", "24M", "-refs", "4"]
    base = [str(FFMPEG), "-hide_banner", "-loglevel", "warning", "-nostats", "-n"]
    for n in (1, 2):
        command = base + ["-progress", str(out / f"{name}.pass{n}.progress")] + frame_input
        if n == 2:
            if first:
                command += ["-ss", str(first / 24)]
            command += ["-i", str(AUDIO)]
        command += ["-map", "0:v:0"] + settings + ["-pass", str(n)]
        if n == 1:
            command += ["-an", "-f", "null", "-"]
        else:
            command += ["-map", "1:a:0", "-c:a", "copy"]
            if a.sample:
                command += ["-t", str(count / 24)]
            command += ["-movflags", "+faststart", str(partial)]
        print(f"{label}: pass {n}/2, {width}x{height}, {count} frames at {rate} Mbps", flush=True)
        with (out / f"{name}.pass{n}.log").open("w") as log:
            subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, check=True)

    info = json.loads(MASTER.with_suffix(".json").read_text())
    info.pop("verification", None)
    info.pop("crf", None)
    info.update(file=final.name, bytes=partial.stat().st_size, frames=count, resolution=[width, height],
                upload_target=label, target_video_bitrate_mbps=rate, rate_control="two-pass variable bitrate",
                archival_master_sha256=master_before, source_frames="approved graded lossless PNGs; Lanczos scale",
                artwork=approved_artwork)
    if a.target == "x":
        info.update(maximum_video_bitrate_mbps=16, vbv_buffer_mbits=24, h264_level=level,
                    upload_guidance="https://help.x.com/en/using-x/premium-longer-videos")
    if a.sample:
        info["sample"] = {"start_seconds": first / 24, "duration_seconds": count / 24}
    manifest.write_text(json.dumps(info, indent=2) + "\n")
    if not a.sample:
        env = os.environ.copy()
        env["PATH"] = str(FFMPEG.parent) + os.pathsep + env.get("PATH", "")
        subprocess.run([sys.executable, str(ROOT / "tools/verify_upload_master.py"), str(partial), str(AUDIO),
                        "--resolution", f"{width}x{height}"], env=env, check=True)
    else:
        subprocess.run([str(FFMPEG), "-v", "error", "-xerror", "-err_detect", "explode", "-threads", "4",
                        "-i", str(partial), "-f", "null", "-"], check=True)
    if checksum(MASTER) != master_before:
        raise RuntimeError("archival master checksum changed")
    assert verify_artwork_frames() == approved_artwork, "artwork frames changed during encoding"
    partial.rename(final)
    manifest.rename(final.with_suffix(".json"))
    print(f"{label}: verified {final} ({final.stat().st_size / 1e9:.3f} GB); archival master unchanged", flush=True)


if __name__ == "__main__":
    main()
