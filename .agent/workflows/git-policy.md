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
