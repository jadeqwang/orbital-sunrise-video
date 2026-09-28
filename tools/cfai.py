"""Thin client for Cloudflare's unified /ai/run endpoint (auth is injected by the session proxy).

Every call is appended to media/genlog.jsonl (model, input minus big blobs, output path, seconds)
so each asset in the video can be traced back to its prompt.
"""
import base64, json, mimetypes, os, sys, time, urllib.request, urllib.error, urllib.parse, pathlib, hashlib, subprocess

ACC = "78885e7db58a4c34423a7e62c8471b75"
RUN = f"https://api.cloudflare.com/client/v4/accounts/{ACC}/ai/run"
ROOT = pathlib.Path(__file__).resolve().parent.parent
LOG = ROOT / "media" / "genlog.jsonl"


def data_uri(path):
    mime = mimetypes.guess_type(str(path))[0] or "application/octet-stream"
    if str(path).endswith(".mp3"):
        mime = "audio/mpeg"
    if str(path).endswith(".wav"):
        mime = "audio/wav"
    return f"data:{mime};base64," + base64.b64encode(open(path, "rb").read()).decode()


def _post(payload, timeout):
    body = json.dumps(payload).encode()
    req = urllib.request.Request(RUN, data=body, headers={"Content-Type": "application/json"}, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read())
        except Exception:
            return {"success": False, "errors": [{"message": f"HTTP {e.code}"}]}


def _strip(o):
    """Drop base64 blobs from logged inputs."""
    if isinstance(o, dict):
        return {k: _strip(v) for k, v in o.items()}
    if isinstance(o, list):
        return [_strip(v) for v in o]
    if isinstance(o, str) and o.startswith("data:"):
        return o[:40] + f"...({len(o)} chars)"
    return o


KV_NS = "9c6c777939a7491a973772459d7ac3f1"
KV = f"https://api.cloudflare.com/client/v4/accounts/{ACC}/storage/kv/namespaces/{KV_NS}/values/"
HOOK = "https://orbital-sunrise-relay.jadewang.workers.dev/hook/"
SECRET_FILES = [pathlib.Path("/tmp/work/relay/hook_secret.txt")]


def _secret():
    for p in SECRET_FILES:
        if p.exists():
            return p.read_text().strip()
    raise RuntimeError("relay hook secret missing; redeploy tools/relay/worker.js with a new secret")


def submit(model, inp, job_id):
    """Start a background run whose result lands in KV under res:<job_id>."""
    payload = {"model": model, "input": inp,
               "options": {"background": True, "webhookUrl": HOOK + _secret() + "/" + job_id}}
    for attempt in range(4):
        res = _post(payload, 60)
        if res.get("success"):
            return res["result"]
        msg = json.dumps(res.get("errors"))[:600]
        print(f"[cfai] submit {model} failed ({attempt+1}): {msg}", file=sys.stderr)
        if "User Input Error" in msg:
            break
        time.sleep(4 * (attempt + 1))
    raise RuntimeError(f"submit {model} failed: {msg}")


def poll(job_id, timeout=1800, every=5):
    t0 = time.time()
    while time.time() - t0 < timeout:
        try:
            with urllib.request.urlopen(KV + "res:" + job_id, timeout=30) as r:
                body = r.read()
            d = json.loads(body)
            if isinstance(d, dict) and d.get("state"):
                return d
        except urllib.error.HTTPError as e:
            if e.code != 404:
                print(f"[cfai] poll {job_id}: HTTP {e.code}", file=sys.stderr)
        except Exception as e:
            print(f"[cfai] poll {job_id}: {e}", file=sys.stderr)
        time.sleep(every)
    raise TimeoutError(job_id)


def run_bg(model, inp, job_id=None, timeout=1800):
    job_id = job_id or f"j{int(time.time()*1000)}_{hashlib.md5(json.dumps(inp, sort_keys=True).encode()).hexdigest()[:8]}"
    t0 = time.time()
    sub = submit(model, inp, job_id)
    print(f"[cfai] submitted {model} job {job_id} run {sub.get('runId', '?')[:12]}", file=sys.stderr, flush=True)
    d = poll(job_id, timeout)
    dt = time.time() - t0
    if d.get("state") != "Completed":
        raise RuntimeError(f"{model} job {job_id} ended {d.get('state')}: {json.dumps(d.get('error'))[:800]}")
    return d.get("result"), dt


def run(model, inp, timeout=1000, retries=2):
    last = None
    for attempt in range(retries + 1):
        t0 = time.time()
        res = _post({"model": model, "input": inp}, timeout)
        dt = time.time() - t0
        if res.get("success"):
            return res["result"], dt
        last = res
        msg = json.dumps(res.get("errors"))[:600]
        print(f"[cfai] {model} attempt {attempt+1} failed after {dt:.0f}s: {msg}", file=sys.stderr)
        if "User Input Error" in msg and "timeout" not in msg.lower():
            break
        time.sleep(5 * (attempt + 1))
    raise RuntimeError(f"{model} failed: {json.dumps(last)[:1500]}")


def download(url, out):
    out = pathlib.Path(out)
    out.parent.mkdir(parents=True, exist_ok=True)
    with urllib.request.urlopen(url, timeout=600) as r, open(out, "wb") as f:
        f.write(r.read())
    return out


def find_urls(o):
    if isinstance(o, dict):
        for v in o.values():
            yield from find_urls(v)
    elif isinstance(o, list):
        for v in o:
            yield from find_urls(v)
    elif isinstance(o, str) and o.startswith("http"):
        yield o


def kv_get(key, binary=False):
    try:
        with urllib.request.urlopen(KV + urllib.parse.quote(key, safe=""), timeout=120) as r:
            b = r.read()
        return b if binary else json.loads(b)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return None
        raise


def fetch_mirrored(job_id, out_paths, timeout=600):
    """Wait for the relay to copy a job's output files into KV, then reassemble them locally."""
    t0 = time.time()
    while time.time() - t0 < timeout:
        idx = kv_get("mir:" + job_id)
        if idx:
            paths = []
            for f in idx["files"]:
                if f.get("error"):
                    raise RuntimeError(f"mirror {job_id} file {f.get('i')}: {f['error']}")
                i = f["i"]
                p = pathlib.Path(out_paths[min(i, len(out_paths) - 1)] if i < len(out_paths) else str(out_paths[0]).replace(".", f"_{i}.", 1))
                p.parent.mkdir(parents=True, exist_ok=True)
                with open(p, "wb") as fh:
                    if f["chunks"] == 1:
                        fh.write(kv_get(f["key"], binary=True))
                    else:
                        for c in range(f["chunks"]):
                            fh.write(kv_get(f"{f['key']}:{c}", binary=True))
                paths.append(str(p))
            return paths
        time.sleep(6)
    raise TimeoutError("mirror " + job_id)


def gen(model, inp, out, tag="", timeout=1800, background=True, job_id=None):
    """Run a model and save its URL outputs next to `out`. Returns (paths, result).
    background=True routes through the relay (no 30 s cutoff)."""
    job_id = job_id or f"j{int(time.time()*1000)}_{hashlib.md5(json.dumps(inp, sort_keys=True).encode()).hexdigest()[:8]}"
    res, dt = run_bg(model, inp, job_id, timeout) if background else run(model, inp, timeout=timeout)
    urls = list(find_urls(res))
    direct_ok = all("r2.cloudflarestorage.com" in u for u in urls)
    out = pathlib.Path(out)
    paths = []
    if urls and (direct_ok or not background):
        for i, u in enumerate(urls):
            p = out if i == 0 else out.with_name(out.stem + f"_{i}" + out.suffix)
            download(u, p)
            paths.append(str(p))
    elif urls:
        paths = fetch_mirrored(job_id, [str(out.with_name(out.stem + (f"_{i}" if i else "") + out.suffix)) for i in range(len(urls))])
    else:
        # some models return base64 inline
        b64 = None
        for k in ("image", "audio", "video"):
            if isinstance(res, dict) and isinstance(res.get(k), str):
                b64 = res[k]
        if b64:
            out.parent.mkdir(parents=True, exist_ok=True)
            open(out, "wb").write(base64.b64decode(b64.split(",")[-1]))
            paths.append(str(out))
    LOG.parent.mkdir(parents=True, exist_ok=True)
    with open(LOG, "a") as f:
        f.write(json.dumps({"t": time.strftime("%Y-%m-%dT%H:%M:%S"), "tag": tag, "model": model,
                            "input": _strip(inp), "out": [os.path.relpath(p, ROOT) for p in paths],
                            "secs": round(dt, 1)}) + "\n")
    print(f"[cfai] {model} -> {paths} ({dt:.0f}s)")
    return paths, res


if __name__ == "__main__":
    # usage: cfai.py MODEL out.png '{"prompt": "..."}'
    m, o, j = sys.argv[1], sys.argv[2], json.loads(sys.argv[3])
    gen(m, j, o, tag=sys.argv[4] if len(sys.argv) > 4 else "")
