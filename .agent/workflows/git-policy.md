---
description: Policy regarding Git operations
---

# Git Push Policy

**STRICT RULE:**
The agent must **NEVER** push code to the remote repository (`git push`) without explicit, written permission from the user in the current turn.

**Workflow:**
1.  Stage changes: `git add .`
2.  Commit changes: `git commit -m "message"`
3.  **STOP.**
4.  Ask user: "Changes committed. Ready to push?"
5.  **ONLY** if user says "Yes" or "Push", then run `git push`.

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
