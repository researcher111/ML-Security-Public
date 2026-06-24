# Lab 07 · Part 2 — build your own MCP server, for VS Code (group)

You've spent the lab attacking other people's MCP servers. Now write one — as a
**group** — host it on GitHub, and make it usable from VS Code. This is a
**Build → Break → Secure** exercise on a server *you* author.

> **Submit:** a link to your group's **public GitHub repo** with the three Python
> files below, the `.vscode/mcp.json`, and `SERVER.md`. List every member in the
> repo README.

## What's here

```
assignment-build/
├── my_server.py            ← BUILD: two tool stubs; finish them, plant one vuln
├── attack_my_server.py     ← BREAK: MCP client; finish build_payload() to exploit
├── .vscode/mcp.json        ← VS Code MCP config — registers your server in the editor
├── notes/                  ← sample data the read_note tool serves
│   ├── welcome.txt
│   └── todo.txt
└── secret.txt              ← a file OUTSIDE notes/ — your traversal target, if you go that way
```

## Use it from VS Code

Your server speaks MCP over stdio, which VS Code (and Code Server on Rivanna)
can drive directly:

1. `pip install mcp` in the Python environment VS Code uses.
2. Open this folder in VS Code. The included `.vscode/mcp.json` registers a
   `my-server` stdio server (`python my_server.py`).
3. Start it from the **Run** affordance on `.vscode/mcp.json`, or the
   **MCP: List Servers** command, then call a tool from Copilot agent mode (or
   any MCP client). Capture a screenshot/transcript of a tool call for `SERVER.md`.

## The task

1. **Build** — implement `my_server.py` so it exposes **≥2 working tools** over
   MCP, one of which touches something sensitive (here: `read_note` reads files).
2. **Break** — plant **exactly one** vulnerability from the lab taxonomy
   (description poisoning, path traversal, over-privileged tool,
   command/argument injection, or SSTI), then finish `attack_my_server.py` so it
   lands the exploit **through the MCP interface** — as a client calling the
   tool, not by importing your function.
3. **Secure** — copy `my_server.py` to `my_server_secure.py`, fix the one bug
   (remove the dangerous capability, don't just blocklist your single payload),
   and show the attack now fails:
   ```bash
   python attack_my_server.py                    # vulnerable → exploit lands
   python attack_my_server.py my_server_secure.py # secure → exploit fails
   ```

## Run it

```bash
pip install mcp          # the official MCP SDK (same one §9–§11 use)
python my_server.py      # starts the server on stdio (waits for a client)
# in another shell:
python attack_my_server.py
```

## Submit

The three Python files plus **`SERVER.md`**: what your server does, which
vulnerability class you planted and why it's a realistic developer mistake, the
one-line root cause, and the one-line fix.

**Try it (ungraded):** swap repos with another group and exploit their planted
vuln *blind* — before reading their `SERVER.md`.

A worked reference (path-traversal plant + secure twin) lives in
`../solution/build/` — for the instructor; don't peek until you've tried it.
