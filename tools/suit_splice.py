"""Turn "...through the SLEEVE he wore" (≈53.0 s) into "...through the SUIT he wore"
using only Jade's own recorded voice. Nothing used by the renderer / release is modified.

How the new word is built (all in the separated vocal stem, 44.1 kHz, Kim_Vocal_2 MDX-Net):
  s   — the original "s" of "sleeve" (53.00–53.17 s), left exactly where it is.
  oo  — the vowel of "through" in the same line (steady part 52.845–52.905 s): its WORLD (CheapTrick)
        spectral envelope replaces the envelope of "l-ee" (53.17–53.43 s). The replacement is done as a
        time-varying spectral-envelope swap applied to her *original* "lee" (STFT gain = target / original
        envelope), so the result keeps the exact pitch contour, vibrato, timing, breathiness and reverb of
        the sung note — only the formants (vowel colour, below ~4–6.5 kHz) change. Level follows the original
        note frame by frame (A-weighted, −2.5 dB ⇒ unweighted RMS ≈ +1 dB: "oo" is darker than "ee"). (--mode world instead resynthesises the vowel with the
        WORLD vocoder from the original f0/aperiodicity + the "oo" envelope, for comparison.)
  t   — a short closure (the "oo" decays like its own reverb tail) and then the released "t" of
        "out" from the same line ("…air ouT through…", 52.782–52.810 s), landing just before the
        original breathy onset of "he" (≈53.49 s), which is kept untouched.
The mid (L+R) and side (L−R) of the stem get the same envelope gains, so the stereo reverb is recoloured too.

Remix: edited_mix = original_mix + (edited_vocal − original_vocal), resampled 44.1→48 kHz.
Because vocals + instrumental == song to −52 dB and the stem → 48 kHz path matches the release WAV to −64 dB,
this equals "instrumental + edited vocal" inside the edit, and is sample-identical to the untouched
mix everywhere else (the difference is exactly zero outside 53.10–53.52 s).

Outputs (review only): release/review/suit_test_{before,after,ab}.mp3 + analysis PNGs in the scratchpad.
Usage: python3 tools/suit_splice.py [--mode filter|world]
"""
import argparse, pathlib, subprocess, json
import numpy as np, soundfile as sf, pyworld as pw
from scipy.signal import resample_poly, stft, istft

ROOT = pathlib.Path(__file__).resolve().parent.parent
MIX48 = ROOT / "media/audio/Orbital_Sunrise_extended.wav"           # release mix (rewritten only with --apply)
SLEEVE48 = ROOT / "media/audio/Orbital_Sunrise_extended_sleeve.wav" # the original "sleeve" mix, kept so --apply is repeatable
VOC = pathlib.Path("/tmp/work/audio/vocals.wav")                     # Kim_Vocal_2 stems of song.wav (44.1 kHz)
INST = pathlib.Path("/tmp/work/audio/instrumental.wav")
OUTDIR = ROOT / "release/review"
SCRATCH = pathlib.Path("/tmp/claude-0/-home-user-orbital-sunrise-video/3d083840-e8b0-5cf8-8f8e-6a6047b5cc17/scratchpad")

SR = 44100
FP = 2.5                       # WORLD frame period, ms
WIN = (52.60, 53.75)           # analysis window in the stem
OO_SRC = (52.845, 52.905)      # steady "oo" of "through"
EE_REF = (53.26, 53.42)        # steady "ee" of "sleeve" (reference only)
V0, V1 = 53.168, 53.428        # voiced part of "sleeve" that becomes "oo" (after the s, before the v)
RAMP_IN = 0.018                # envelope morph ramp at the s→oo boundary (s)
T_SRC = (52.782, 52.810)       # released "t" of "out" (burst + aspiration, stops before voicing)
T_AT = 53.459                  # where the t burst lands (closure = V1 .. T_AT)
RESUME = (53.484, 53.494)      # crossfade back to the original ("h" of "he")
EDIT = (53.10, 53.52)          # outside this the vocal is untouched
EXCERPT = (48.30, 55.45)       # before/after excerpt (from "Dancing on the edge…" to ~1 s after "wore")


def a_weight_db(f):
    f = np.maximum(f, 1e-3); f2 = f * f
    ra = (12194**2 * f2**2) / ((f2 + 20.6**2) * np.sqrt((f2 + 107.7**2) * (f2 + 737.9**2)) * (f2 + 12194**2))
    return 20 * np.log10(ra) + 2.0


def world(x):
    x = np.ascontiguousarray(x, dtype=np.float64)
    f0, t = pw.harvest(x, SR, f0_floor=150, f0_ceil=800, frame_period=FP)
    sp = pw.cheaptrick(x, f0, t, SR, fft_size=2048)
    ap = pw.d4c(x, f0, t, SR, fft_size=2048)
    return f0, t, sp, ap


def raised_cos(n):
    return 0.5 - 0.5 * np.cos(np.linspace(0, np.pi, n))


def build(mode="filter", t_gain_db=2.0, oo_gain_db=-2.5):
    v, sr = sf.read(VOC); assert sr == SR
    mid, side = (v[:, 0] + v[:, 1]) / 2, (v[:, 0] - v[:, 1]) / 2
    a, b = int(WIN[0] * SR), int(WIN[1] * SR)
    xm, xs = mid[a:b].copy(), side[a:b].copy()
    f0, t, sp, ap = world(xm)
    T = WIN[0] + t
    fr = np.linspace(0, SR / 2, sp.shape[1])
    L = np.log(sp + 1e-20)

    # target "oo" envelope (log-mean over the steady part of "through")
    oo = (T >= OO_SRC[0]) & (T < OO_SRC[1])
    L_oo = L[oo].mean(0)
    aw = 10 ** (a_weight_db(fr) / 10)
    loud = lambda Lf: 10 * np.log10((np.exp(Lf) * aw).sum(-1))
    # frame-wise gain so the new vowel follows the original note's A-weighted loudness
    g = loud(L) - loud(L_oo[None]) + oo_gain_db                       # dB per frame
    iv1 = np.searchsorted(T, V1 - 0.004)
    g[iv1:] = g[iv1]                                                   # hold level into the closure; `tail` does the decay
    # small transfer of the original's slow spectral micro-dynamics (vibrato AM etc.), heavily smoothed
    ee = (T >= EE_REF[0]) & (T < EE_REF[1])
    resid = L - L[ee].mean(0) - (np.log(10) / 10) * (loud(L) - loud(L[ee].mean(0)[None]))[:, None]
    k = np.hanning(41); k /= k.sum()
    resid = np.apply_along_axis(lambda r: np.convolve(r, k, mode="same"), 1, resid)
    resid = np.clip(resid, -np.log(10) * 0.3, np.log(10) * 0.3) * 0.5   # ≤ ±1.5 dB
    L_new = L_oo[None] + (np.log(10) / 10) * g[:, None] + resid

    # morph weight: 0 = original, 1 = "oo". Ramps in over the s→vowel boundary, stays 1 through the closure.
    w = np.clip((T - (V0 - RAMP_IN / 2)) / RAMP_IN, 0, 1)
    w[T > RESUME[1] + 0.01] = 0
    L_tgt = (1 - w[:, None]) * L + w[:, None] * L_new

    # closure: the vowel dies away like a short reverb tail after V1 (floor −22 dB, like her other t closures)
    tail = np.ones(len(T))
    after = T > V1
    tail[after] = np.exp(-(T[after] - V1) / 0.012)
    tail = np.maximum(tail, 10 ** (-22 / 20))

    if mode == "world":
        f0v = f0.copy()
        y = pw.synthesize(np.ascontiguousarray(f0v), np.ascontiguousarray(np.exp(L_new)), np.ascontiguousarray(ap), SR, FP)
        y = y[:len(xm)]
        ws = np.interp(np.arange(len(xm)) / SR, t, w)
        new_m = xm * (1 - ws) + y * ws
        # side: envelope gains as in filter mode
        gain_log = (L_tgt - L) / 2
    else:
        gain_log = (L_tgt - L) / 2
    # above ~4 kHz the "through" frames mostly hold breath / the reverb of its "th", not vowel colour:
    # fade the swap out between 4 and 6.5 kHz and keep the original's own air there
    hf = np.clip((fr - 4000) / 2500, 0, 1)
    gain_log = gain_log * (1 - hf)[None]
    gain_log = np.clip(gain_log, -np.log(10) * 1.5, np.log(10) * 0.75)  # −30 … +15 dB

    def apply(x):
        nper, hop = 1024, 64
        fs, ts, Z = stft(x, SR, window="hann", nperseg=nper, noverlap=nper - hop, boundary="even", padded=True)
        # interpolate log gain (time: WORLD frames → STFT frames, freq: 1025 → 513 bins)
        Gf = np.array([np.interp(fs, fr, gl) for gl in gain_log])           # (frames, 513)
        Gt = np.array([np.interp(ts, t, Gf[:, i]) for i in range(Gf.shape[1])])  # (513, stft frames)
        _, y = istft(Z * np.exp(Gt), SR, window="hann", nperseg=nper, noverlap=nper - hop, boundary=True)
        return y[:len(x)]

    new_s = apply(xs)
    if mode != "world":
        new_m = apply(xm)
    # closure envelope applied sample-wise (sharper than the STFT gain could be)
    tail_s = np.interp(np.arange(len(xm)) / SR + WIN[0], T, tail)
    new_m *= tail_s; new_s *= tail_s

    # ---- the "t": burst of "out" dropped in after the closure ----
    ta, tb = int(T_SRC[0] * SR), int(T_SRC[1] * SR)
    burst_m, burst_s = mid[ta:tb].copy(), side[ta:tb].copy()
    env = np.ones(tb - ta); fi, fo = int(0.001 * SR), int(0.006 * SR)
    env[:fi] = raised_cos(fi); env[-fo:] = raised_cos(fo)[::-1]
    gt = 10 ** (t_gain_db / 20)
    p = int((T_AT - WIN[0]) * SR)
    new_m[p:p + len(env)] += burst_m * env * gt
    new_s[p:p + len(env)] += burst_s * env * gt

    # ---- crossfade back to the untouched original at the "h" of "he", and out of the edit window ----
    n = np.arange(len(xm)) / SR + WIN[0]
    r0, r1 = RESUME
    keep_new = np.clip((r1 - n) / (r1 - r0), 0, 1)
    keep_new = 0.5 - 0.5 * np.cos(np.pi * keep_new)                    # raised-cosine xfade
    keep_new[n < EDIT[0]] = 0
    # before V0-RAMP the envelope gain is exactly 1 anyway; hard-limit to EDIT window
    out_m = xm * (1 - keep_new) + new_m * keep_new
    out_s = xs * (1 - keep_new) + new_s * keep_new
    # identical-by-construction outside [EDIT0, r1]; smooth entry at EDIT0 (gain≈1 there)
    e0 = int((EDIT[0] - WIN[0]) * SR); xf = int(0.01 * SR)
    ramp = raised_cos(xf)
    out_m[e0:e0 + xf] = xm[e0:e0 + xf] * (1 - ramp) + out_m[e0:e0 + xf] * ramp
    out_s[e0:e0 + xf] = xs[e0:e0 + xf] * (1 - ramp) + out_s[e0:e0 + xf] * ramp

    d_m, d_s = out_m - xm, out_s - xs
    delta = np.stack([d_m + d_s, d_m - d_s], 1)                          # L, R
    vedit = v.copy(); vedit[a:b] += delta
    info = dict(mode=mode, f0=f0, t=T, w=w, L=L, L_oo=L_oo, L_tgt=L_tgt, g=g)
    return v, vedit, a, delta, info


def to48(x):
    return resample_poly(x, 160, 147, axis=0)


def write_mp3(path, x, sr=48000):
    tmp = SCRATCH / (path.stem + ".wav")
    sf.write(tmp, x, sr, subtype="FLOAT")
    subprocess.run(["ffmpeg", "-y", "-hide_banner", "-loglevel", "error", "-i", str(tmp), "-c:a", "libmp3lame",
                    "-b:a", "192k", str(path)], check=True)
    return tmp


def lufs(path):
    r = subprocess.run(["ffmpeg", "-hide_banner", "-nostats", "-i", str(path), "-af", "ebur128=peak=true", "-f", "null", "-"],
                       capture_output=True, text=True).stderr
    tail = r[r.rfind("Summary:"):]
    I = float(tail.split("I:")[1].split("LUFS")[0]); P = float(tail.split("Peak:")[1].split("dBFS")[0])
    return I, P


def main():
    ap_ = argparse.ArgumentParser(); ap_.add_argument("--mode", default="filter", choices=["filter", "world"])
    ap_.add_argument("--t-gain-db", type=float, default=2.0); ap_.add_argument("--oo-gain-db", type=float, default=-2.5); ap_.add_argument("--tag", default="")
    ap_.add_argument("--apply", action="store_true", help="write the edited full mix to the release WAV (the original is kept as *_sleeve.wav)")
    args = ap_.parse_args()
    SCRATCH.mkdir(parents=True, exist_ok=True); OUTDIR.mkdir(parents=True, exist_ok=True)

    v, vedit, a, delta, info = build(args.mode, args.t_gain_db, args.oo_gain_db)
    sf.write(SCRATCH / f"vocal_edit{args.tag}.wav", vedit[int(50 * SR):int(56 * SR)], SR)
    sf.write(SCRATCH / f"vocal_orig.wav", v[int(50 * SR):int(56 * SR)], SR)

    if not SLEEVE48.exists():
        import shutil; shutil.copy2(MIX48, SLEEVE48)
    mix, msr = sf.read(SLEEVE48, dtype="float64"); assert msr == 48000   # always edit the original, never an already-edited mix
    # delta on a 48 kHz grid aligned to the stem: stem sample a  ↔  48 kHz sample a*160/147
    pad = 147 * 20                                                     # keep the resampler's edges in zeros
    a0 = (a // 147) * 147 - pad
    buf = np.zeros((len(delta) + 2 * pad + 147, 2)); off = a - a0
    buf[off:off + len(delta)] = delta
    d48 = to48(buf)
    s48 = a0 * 160 // 147
    after_full = mix.copy()
    after_full[s48:s48 + len(d48)] += d48
    if args.apply:
        sf.write(MIX48, after_full, 48000, subtype=sf.info(SLEEVE48).subtype)
        print(f"applied: wrote {MIX48} ({len(after_full) / 48000:.2f} s)")

    e0, e1 = int(EXCERPT[0] * 48000), int(EXCERPT[1] * 48000)
    before, after = mix[e0:e1].copy(), after_full[e0:e1].copy()
    fade = np.ones(len(before)); fi, fo = int(0.02 * 48000), int(0.25 * 48000)
    fade[:fi] = raised_cos(fi); fade[-fo:] = raised_cos(fo)[::-1]
    before *= fade[:, None]; after *= fade[:, None]
    diff = np.abs(after - before).max(1); nz = np.nonzero(diff > 0)[0]
    print(f"samples that differ: {len(nz)}  span {EXCERPT[0] + nz[0] / 48000:.4f}–{EXCERPT[0] + nz[-1] / 48000:.4f} s")

    fb = write_mp3(OUTDIR / "suit_test_before.mp3", before)
    fa = write_mp3(OUTDIR / "suit_test_after.mp3", after)
    ab = np.concatenate([before, np.zeros((48000, 2)), after])
    write_mp3(OUTDIR / "suit_test_ab.mp3", ab)
    for f in ("suit_test_before.mp3", "suit_test_after.mp3"):
        I, P = lufs(OUTDIR / f); print(f"{f}: {I:.2f} LUFS, true peak {P:.2f} dBFS")
    np.savez(SCRATCH / f"splice_info{args.tag}.npz", **{k: val for k, val in info.items() if k != "mode"})
    sf.write(SCRATCH / f"mix_after{args.tag}.wav", after, 48000); sf.write(SCRATCH / "mix_before.wav", before, 48000)


if __name__ == "__main__":
    main()
