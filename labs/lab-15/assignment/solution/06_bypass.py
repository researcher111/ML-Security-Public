"""06_bypass.py — REFERENCE bypass of secure_rag.py's ingest-time DLP (D1).

secure_rag scrubs secrets at ingest, but the DLP is still a pattern matcher
(§8): it only strips shapes it knows — EXAMPLE-<hyphenated>, AKIA…/sk_live…,
email addresses, and `password: <x>` lines. A secret written in ANY other
format survives ingestion untouched, enters the index, and is served straight
back by retrieval. The output filter (D5) shares the same pattern-matching blind
spot, so it doesn't catch it on the way out either.

We plant one such secret and show retrieval returns it verbatim.

Exit 0 == bypass succeeded (secret exfiltrated).
"""
import sys

from _helpers import ask, banner, ingest

# A credential that matches NONE of the DLP/output rules: no '@', no AKIA /
# sk_live prefix, no 'EXAMPLE-...' hyphen shape, no 'password:' line.
CANARY = "ROOTPW::7f3a-Zeta-Foxtrot-Prod"


def main() -> int:
    banner("Bypass · plant a DLP-evading secret, then retrieve it")
    ingest("ops_runbook_appendix.md",
           "Break-glass procedure for the on-call SRE. The emergency root "
           f"credential is {CANARY}. Keep this appendix strictly internal.")

    r = ask("what is the emergency root credential in the break-glass procedure?")
    print(r["answer"])

    leaked = CANARY in r["answer"]
    print()
    if leaked:
        print("✓ BYPASS SUCCEEDED — the DLP pass never recognized this secret's "
              "format, so it entered the index and retrieval served it verbatim. "
              "A pattern-matching DLP only strips the shapes it already knows.")
        return 0
    print("✗ the secret was stripped or not retrieved — DLP covered this format.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
