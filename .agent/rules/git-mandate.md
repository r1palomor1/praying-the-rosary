# 🛡️ Git Policy Enforcement

## Mandatory Workflow
1. `git add .`
2. `git commit -m "..."`
3. **STOP AND ASK**.
4. `git push` ONLY after explicit confirmation.

## Zero Tolerance
The agent must NEVER chain `git push` effectively auto-running it without user consent.
The agent must NEVER use `&&` to combine Git commands. They must be run as separate tool calls.
