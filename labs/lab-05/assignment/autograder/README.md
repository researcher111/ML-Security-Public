# lab-05 Gradescope autograder — the three agent defenses

Pure-Python (stdlib only) autograder. Students submit their hardened
`secure_agent.py`; the grader imports it and exercises the three defense
functions — `output_filter` (D1), `joined_scan` (D2), and `retrieve_notes`
(D3) — as pure functions. No LLM, no running server.

## Files

| file | role |
|------|------|
| `run_autograder` | Gradescope entrypoint |
| `setup.sh` | image build step — no deps |
| `grader.py` | all grading logic; writes `results.json` |
| `build_zip.sh` | builds `autograder.zip` for upload |

## Scoring (100 pts)

| pts | test | how |
|----:|------|-----|
| 10 | config present | `SECRET_PATTERNS` non-empty, an injection regex/list defined, `TRUSTED_AUTHORS` non-empty |
| 30 | D1 `output_filter` | blocks each secret verbatim **and** when whitespace-disguised (`M e g a c o r p …`), without over-blocking benign answers |
| 30 | D2 `joined_scan` | catches a direct injection **and** a fragmentation attack split across the `=== file ===` boundary, without flagging benign joined documents |
| 30 | D3 `retrieve_notes` | serves trusted-author articles, drops untrusted (poisoned) ones even when the title matches the query |

All components give proportional partial credit.

## Safety

Every check is a pure-function call. The grader never starts the agent, never
calls an LLM, and never executes any attack payload — the "attack" strings are
inert text fed to a string filter. A broken submission can do nothing worse
than score low.

## Build & test

```bash
./build_zip.sh                                   # -> autograder.zip
python3 grader.py --submission ../../agent       # reference -> 100/100
python3 grader.py --submission ../                # the template -> ~54
```

Reference solution: `../../agent/secure_agent.py`. Template: `../secure_agent.py`.

The student submits a single `secure_agent.py`. Its FastAPI app, LLM client,
and tool dispatch are built lazily in `_build_app()`, so importing the file
for grading needs only the standard library — the web stack and a configured
LLM are never required.
