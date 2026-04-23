---
description: Verify code structure and syntax after file modifications
---

> ⚠️ **PROJECT RULES.md — ALWAYS ENFORCED IN THIS WORKFLOW**
>
> **Rule 0 – Deployment Sequence:** `npm run build` → `git add .` → `git commit` → `npm run build` (2nd) → `git push`. Never chain with `&&`.
> **Rule 1 – No Unauthorized Builds/Deploys:** Never run `npm run build` or `git push` without explicit user permission.
> **Rule 2 – No Jumping the Gun:** Propose → Approve → Implement. Never act on assumptions. Always answer questions BEFORE touching code.
> **Rule 3 – Atomic Updates:** Check build before pushing.
> **Rule 4 – Token Efficiency:** Concise responses (1-3 sentences). Batch parallel reads. No verbose narration.
> **Rule 5 – Zero Assumptions:** "Review/Check/Evaluate" = report findings ONLY. No preemptive code changes.
> **Rule 6 – Strict Git & Question Protocol:** NEVER auto-git after writing code. If user asks a question, STOP and answer it exclusively.


Step 1: Check for syntax errors
Before confirming a task is complete, specifically if you have used `replace_file_content` or `multi_replace_file_content`:
1.  Read the file you just modified (or at least the modified sections including surrounding lines) to visually verify structure.
2.  If the project is a TypeScript/JavaScript project, look for "Expected ..." or "Unexpected token" errors in the linter output or build logs.
3.  Specifically check for:
    *   Missing closing braces `}` for classes, functions, or blocks.
    *   Duplicate or missing method signatures.
    *   Unclosed string literals.

Step 2: Verify build status
// turbo
1.  If a build or dev server is running, check its status using `command_status` or by checking the latest output.
2.  If you see "Transform failed" or key syntax errors, **STOP** and fix them immediately before proceeding.

Step 3: Self-Correction
1.  If you identify a syntax error, do not ask the user for permission to fix it. Fix it immediately as part of the tool use cycle.
