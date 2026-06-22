#!/usr/bin/env bash
# Gradescope image build step. The grader is pure Python 3 stdlib — nothing to
# install. The student's secure_agent.py imports fastapi/pydantic/the agent
# package only inside _build_app(), which the grader never calls (it imports
# the file and exercises the three defense functions directly), so the missing
# web deps don't matter here.
set -euo pipefail
python3 --version
