# Lab 15 · Secure twin write-up (reference)

## (a) Which Lab 15 attack does my defense close?

`secure_rag.py` implements four of the §8 fixes; the two I lean on for this
write-up are:

- **D1 · ingest-time DLP → closes Attack 1 (knowledge-base leakage).** Every
  document is scrubbed in `ingest_text()` *before* it is chunked. Emails,
  API-key shapes (`AKIA…`, `sk_live…`, `SG.…`), the planted `EXAMPLE-*`
  credentials, and `password: <x>` lines are replaced with redaction markers.
  Because the secret never enters the index, no query — however phrased — can
  retrieve it. This is strictly better than an output filter alone: there is
  nothing left in the corpus to leak.
- **D4 · path allowlist → closes Attack 4 (retrieval hijacking).** `file_read()`
  normalizes the path (Unicode NFKC + zero-width strip), resolves it, and reads
  it only if it lives inside the knowledge-base directory. The baseline's
  substring blocklist failed *open* (anything not literally matched was read);
  an allowlist fails *closed* (anything not explicitly permitted is refused),
  which is why homoglyph and `/tmp/…` traversal paths no longer work.

(D3 diversity cap and D5 structural output filter are also implemented; see the
file comments.)

## (b) What blind spot does my bypass exploit?

`06_bypass.py` defeats **D1**. The DLP is a *pattern matcher*: it strips only
the secret shapes I enumerated. My bypass plants a credential in a format none
of those regexes cover — `ROOTPW::7f3a-Zeta-Foxtrot-Prod` (no `@`, no
`AKIA`/`sk_live` prefix, no `EXAMPLE-` hyphen shape, no `password:` line). The
DLP passes it through untouched, it is indexed like any other chunk, and a
plain question retrieves it verbatim. The output filter (D5) shares the same
enumerated-shapes blind spot, so it doesn't catch it on the way out either.
This is the exact failure mode §8 predicts for regex/DLP defenses: *the attacker
adds one twist the matcher hasn't seen.*

## (c) What would the next defense look like — and its new attack class?

The next defense is to stop enumerating shapes and instead **detect secrets
structurally and semantically**: named-entity recognition (Presidio/spaCy) for
PII, high-entropy-substring detection for credentials (Shannon entropy over a
sliding window flags random-looking tokens regardless of format), and a
sensitivity classifier trained on labeled examples. Pair that with
**provenance + human review at ingest** (the Attack 2 fix I deliberately left
open) so an attacker can't freely upload the poisoned appendix in the first
place.

Its new attack class: entropy and NER detectors have **false-positive budgets
and latency budgets**. An attacker can (1) *lower the entropy* of the secret by
encoding it as plausible English ("the passphrase is correct-horse-battery-
staple-plus-seven"), sliding under the entropy threshold while staying
recoverable by the LLM; or (2) **split the secret across several chunks/uploads**
so no single window looks secret, and let retrieval + the model reassemble it
(the multi-turn/fragment attack from §7). Defense-in-depth narrows the seam but
never closes it — which is the whole lesson of the lab.
