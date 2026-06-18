# Lab 05 — Attacking AI Agents

DS 6042 · Module 4 (security against ML systems) · 2–3 hours in class
plus a 3-hour assignment.

## Files

```
lab-05/
├── attack-agents.html      ← main lab page (student-facing)
├── styles.css              ← per-lab styles
├── viz.js                  ← four interactive widgets
├── README.md               ← this file
│
├── agent/
│   ├── baseline_agent.py   ← vulnerable agent (run on port 8001)
│   ├── secure_agent.py     ← hardened agent (run on port 8002)
│   ├── llm_client.py       ← OpenAI-compatible client (env-var driven)
│   ├── tools.py            ← file_search, file_read, config_lookup
│   ├── system_prompt.txt   ← system prompt with planted creds
│   ├── requirements.txt
│   ├── .env.example        ← copy to .env, fill in Rivanna details
│   └── data/               ← fake employee files, config.json
│
├── attacks/
│   ├── 01_prompt_extraction.py  ← AML.T0051.000 direct injection
│   ├── 02_indirect_injection.py ← AML.T0051.001 indirect
│   └── 03_memory_poisoning.py   ← AML.T0020 data poisoning
│
└── solution/
    └── NOTES.md            ← instructor notes (not student-facing)
```

## Quick start

```bash
cd Class/labs/lab-05
python3 -m venv .venv && source .venv/bin/activate
pip install -r agent/requirements.txt
cp agent/.env.example agent/.env
$EDITOR agent/.env                 # fill in Rivanna GenAI values

# terminal 1
uvicorn agent.baseline_agent:app --port 8001 --reload

# terminal 2
python attacks/01_prompt_extraction.py
python attacks/02_indirect_injection.py
python attacks/03_memory_poisoning.py
```

Then start the secure version and re-run:

```bash
uvicorn agent.secure_agent:app --port 8002 --reload
# edit AGENT="http://127.0.0.1:8002" in each attack script and re-run
```

## Open in browser

Open `attack-agents.html` directly — no server needed.

## Reference

- MITRE ATLAS — <https://atlas.mitre.org/>
- OWASP LLM Top-10 — <https://owasp.org/www-project-top-10-for-large-language-model-applications/>
- UVA RC GenAI portal — <https://open-webui.rc.virginia.edu/>
