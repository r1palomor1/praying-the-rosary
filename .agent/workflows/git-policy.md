---
description: Policy regarding Git operations
---

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
