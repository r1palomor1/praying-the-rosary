---
trigger: always_on
---

# 🛡️ Git Policy Enforcement

## Zero Tolerance

The agent must NEVER use `&&` to combine Git commands. They must be run as separate tool calls.



## Mandatory Workflow
1. `npm run build` (to update version info)
2. `git add .`
3. `git commit -m "..."`
4. `git push` unless told otherwise.

