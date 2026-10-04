"""Encode and verify a separate CRF-12 4K master from the corrected, graded PNGs."""
import json
import os
from pathlib import Path
import subprocess

from artwork_frames import ROOT, FRAMES, checksum, verify_artwork_frames
from verify_upload_master import main as verify_video


def main():
    old = ROOT / "video/out/masters/Orbital_Sunrise_extended_4K_master.mp4"
    out = old.with_name("Orbital_Sunrise_extended_original_artwork_4K_master.mp4")
    partial = out.with_suffix(".partial.mp4")
    manifest = partial.with_suffix(".json")
    for p in (out, out.with_suffix(".json"), partial, manifest):
        if p.exists():
            raise RuntimeError(f"refusing to overwrite {p}")
    art = verify_artwork_frames()
    old_hash = checksum(old)
    audio = ROOT / "media/audio/Orbital_Sunrise_alt2_extended.m4a"
    ffmpeg = ROOT / "video/out/bin/ffmpeg"
    os.environ["PATH"] = str(ffmpeg.parent) + os.pathsep + os.environ.get("PATH", "")
    print("Encoding corrected original-artwork 4K master: CRF 12, slow preset, grain tuning.", flush=True)
    command = [str(ffmpeg), "-hide_banner", "-loglevel", "warning", "-nostats", "-n",
               "-progress", str(out.with_suffix(".progress")), "-framerate", "24", "-start_number", "0",
               "-i", str(FRAMES / "f%05d.png"), "-i", str(audio), "-map", "0:v:0", "-map", "1:a:0",
               "-vf", "scale=3840:2160:flags=lanczos:out_color_matrix=bt709:out_range=tv,format=yuv420p",
               "-c:v", "libx264", "-preset", "slow", "-tune", "grain", "-crf", "12",
               "-profile:v", "high", "-level:v", "5.1", "-threads", "8", "-g", "48", "-keyint_min", "24",
               "-color_range", "tv", "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
               "-c:a", "copy", "-movflags", "+faststart", str(partial)]
    with out.with_suffix(".log").open("w") as log:
        subprocess.run(command, stdout=log, stderr=subprocess.STDOUT, check=True)
    info = json.loads(old.with_suffix(".json").read_text())
    info.pop("verification", None)
    info.update(file=out.name, bytes=partial.stat().st_size, artwork=art, archival_master_sha256=old_hash,
                source_frames="approved graded lossless PNGs with supplied original artwork; Lanczos upscale")
    manifest.write_text(json.dumps(info, indent=2) + "\n")
    verify_video(str(partial), str(audio))
    assert verify_artwork_frames() == art, "artwork changed during encoding"
    assert checksum(old) == old_hash, "previous master changed"
    partial.rename(out)
    manifest.rename(out.with_suffix(".json"))
    print(f"Verified corrected master: {out} ({out.stat().st_size / 1e9:.3f} GB); previous master preserved.", flush=True)


if __name__ == "__main__":
    main()
