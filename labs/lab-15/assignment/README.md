# Lab 15 · Assignment · Build the secure twin

You attacked `baseline_rag.py` five ways. Now defend it. Start from
`../server/baseline_rag.py`, keep its HTTP surface, and harden it.

## Deliverables (submit these three files)

1. **`secure_rag.py`** — same surface as `baseline_rag.py` (the `/query`,
   `/ingest`, `/reset`, `/health` endpoints and the `retrieve` / `output_guard`
   / `file_read` / `ingest_text` functions), with **two or more** of the §8
   fixes implemented. Run it on a **different port** from the baseline (e.g.
   `uvicorn secure_rag:app --port 8091`). Comment each fix with the attack
   number it closes.
2. **`06_bypass.py`** — an attack that defeats **one of your own fixes**. It
   must `main() -> int` and exit `0` when the bypass succeeds (mirror the style
   of `attacks/01_kb_leakage.py`). Import helpers with
   `from _helpers import ask, ingest, reset, banner`.
3. **`writeup.md`** — one page, three sections: **(a)** which Lab 15 attack your
   defense closes, **(b)** the structural blind spot your bypass exploits, and
   **(c)** what the next defense — and its new attack class — would be.

See `solution/` for a reference of all three.

## Grade yourself locally

From the folder holding your three files:

```bash
pip install fastapi httpx uvicorn pydantic
python3 /path/to/assignment/test_local.py .
```

This runs the same automated checks Gradescope runs and prints a per-check
breakdown.

## How grading works (and its one honest limit)

The lab attacks need a live LLM, which the grader does not have. So the grader
swaps in a **deterministic stub** that behaves like a faithful, compliant,
vulnerable model — it quotes retrieved context verbatim and obeys `read_file`
tool-calls — and runs the attacks against your `secure_rag` through FastAPI's
in-process `TestClient`. A working defense is exactly what stops the stub from
leaking. The upshot: results are reproducible, but the stub can't simulate
multi-turn model cleverness, so a bypass that relies on real-model reasoning may
score partial here and be re-checked by hand.

### Points

| Check | Points | Auto? |
|---|---:|---|
| `secure_rag` imports, exposes the surface, answers a benign query | 10 | ✅ |
| Two or more §8 defenses are actually effective | 15 | ✅ |
| The original lab attacks fail against your twin (leak + hijack) | 20 | ✅ |
| `06_bypass.py` is valid Python and exits 0 against your twin | 20 | ✅ |
| Write-up: blind spot + next defense | 35 | ✍️ by hand |
| **Total** | **100** | |

The five defenses the grader can detect (implement **any two+**): ingest-time
DLP (Attack 1), ingestion provenance (Attack 2), per-source diversity cap
(Attack 3), path normalize + allowlist (Attack 4), structural output filter
(Attack 5).

## Files

```
assignment/
  README.md            ← you are here
  test_local.py        ← grade yourself locally
  solution/            ← reference secure_rag.py + 06_bypass.py + writeup.md
  autograder/
    grader.py          ← the grader (also runs locally)
    run_autograder     ← Gradescope entrypoint
    setup.sh           ← Gradescope image build
    autograder.zip     ← upload this to Gradescope
```
