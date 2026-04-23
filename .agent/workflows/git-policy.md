---
description: Policy regarding Git operations
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


# Git Push Policy

**STRICT RULE:**
The agent must **NEVER** push code to the remote repository (`git push`) without explicit, written permission from the user in the current turn.

**Workflow (Version Accuracy Protocol):**
To ensure the `Settings Info Panel` displays the correct Commit Date and Hash:
1.  **Stage & Commit FIRST:**
    *   `git add .`
    *   `git commit -m "message"`
    *   *(Reasoning: The build script reads the `git log` to generate version.json. If we build before committing, it captures the OLD version.)*
2.  **Validation Build (Optional but Recommended):**
    *   `npm run build`
    *   *(Reasoning: Verifies the build passes. If it fails, fix and amend commit.)*
3.  **Push:**
    *   `git push`
    *   *(Trigger deployment)*

# ⛔ DESTRUCTIVE COMMANDS POLICY (STRICT)

**Atomic Rule:**
The agent must **NEVER** run destructive Git commands that erase work without **EXPLICIT, INFORMED USER CONSENT**.

**Prohibited from Auto-Running:**
*   `git reset --hard`
*   `git clean -fd`
*   `git checkout .` (wipes working directory)
*   `git push --force`

**Protocol if Reset is Required:**
1.  **Explain Impact:** "Running this command will PERMANENTLY DELETE all uncommitted work. Are you sure?"
2.  **Verify Backup:** "Have you committed your recent work?"
3.  **Wait for Confirmation:** Do not proceed until the user explicitly types "YES, RESET".
