#!/usr/bin/env python3
"""Map song time in the current mix to song time in a new mix (docs/ALTERNATE_CUT.md, section 1: "which case is it?").

    python3 tools/compare_mix.py <old audio> <new audio> [--step=5] [--win=3]

Both files are decoded to mono 8 kHz (ffmpeg), turned into normalised log spectra at 100 frames/s, and each --win-second
window of the old mix, every --step seconds, is matched against the new mix (best lag by mean cosine similarity).
Prints old time -> new time, the offset, and the match score (≈0.6+ is the same music; <0.5 means no good match), then
a least-squares tempo fit per stretch of steady offset. A jump in the offset is inserted (or removed) material; a steady
drift means the new mix plays at a different tempo.
"""
import subprocess, sys, tempfile, os
import numpy as np, soundfile as sf
from scipy.signal import stft

FPS = 100

def feat(path):
    with tempfile.TemporaryDirectory() as d:
        w = os.path.join(d, 'a.wav')
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-ac', '1', '-ar', '8000', w], check=True)
        x, sr = sf.read(w)
    _, _, Z = stft(x, sr, nperseg=512, noverlap=512 - sr // FPS)
    S = np.log1p(np.abs(Z))
    S -= S.mean(1, keepdims=True)
    return S / (np.linalg.norm(S, axis=0) + 1e-9)

def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    opt = dict(a[2:].split('=') for a in sys.argv[1:] if a.startswith('--'))
    step, win = float(opt.get('step', 5)), float(opt.get('win', 3))
    A, B = feat(args[0]), feat(args[1])
    W = int(win * FPS)
    rows = []
    for s in range(0, A.shape[1] - W, int(step * FPS)):
        a = A[:, s:s + W]
        # cosine similarity of window a against every position of B (a sliding dot product per frame, averaged)
        c = np.array([np.mean(np.sum(a * B[:, j:j + W], 0)) for j in range(0, B.shape[1] - W, 2)])
        j = int(np.argmax(c)) * 2
        rows.append((s / FPS, j / FPS, c[j // 2]))
    print(f'old {A.shape[1] / FPS:.2f} s, new {B.shape[1] / FPS:.2f} s')
    print('   old s     new s    offset  score')
    prev, seg = None, []
    segs = []
    for t, u, sc in rows:
        off = u - t
        jump = prev is not None and abs(off - prev) > 0.5
        print(f'{t:8.2f}  {u:8.2f}  {off:+8.2f}  {sc:5.2f}' + ('   <- jump' if jump else ''))
        if jump:
            segs.append(seg); seg = []
        if sc >= 0.55:
            seg.append((t, u))
        prev = off
    segs.append(seg)
    for seg in segs:
        if len(seg) < 3:
            continue
        t, u = np.array(seg).T
        k, b = np.polyfit(t, u, 1)
        print(f'old {t[0]:.1f}-{t[-1]:.1f} s: new = {k:.5f} * old {b:+.3f}   (tempo x{1 / k:.4f})')

if __name__ == '__main__':
    main()
