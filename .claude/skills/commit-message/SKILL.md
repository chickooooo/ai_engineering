---
name: commit-message
description: Write a git commit message for the staged changes. Use when the user asks for a commit message, or says "give me a commit message" / "commit message for this".
---

# Commit message

1. Read the staged changes: `git diff --cached --stat`, then
   `git diff --cached` for the files that matter. Skip lockfiles.
2. Read `git log --format="%s" -10` and match that style.
3. Output one line, nothing else — no body, no `Co-Authored-By` trailer,
   no explanation of the changes.

Rules for the line:

- Imperative mood, capitalised, no trailing full stop.
- Under 72 characters.
- No `feat:` / `chore:` prefixes unless the log already uses them.
- Name what changed, not how many files.
- Cover the dominant change; drop incidental ones rather than listing
  everything.

Put it in a fenced code block so it can be copied.
