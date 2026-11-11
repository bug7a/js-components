# AGENTS.md

This file is for the AI coding tools that read `AGENTS.md` (Codex, Cursor, GitHub Copilot...). The rules of this repository are in `CLAUDE.md`: written for Claude Code, they are the rules of every AI that works here, and they stay in one file.

- Before you write or change code or docs here, read `CLAUDE.md` and follow it. A folder with a `CLAUDE.md` of its own (`_basic-designer/`) has rules for that folder too: they win there.
- The helper scripts of the AI sessions are in `_ai-tools/`: its `README.md` says what each one does and when to use it.
- More than one session (Claude Code, Codex...) may work in this folder at the same time, and they share one git index. When you commit, do it with `./_ai-tools/commit-files.sh` (`CLAUDE.md`, "Commit": when, and how a shared file is committed), never with `git add` and `git commit`: they take what the other sessions staged.
