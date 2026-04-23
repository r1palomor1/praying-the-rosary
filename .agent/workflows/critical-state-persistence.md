---
description: Best practices for avoiding data loss during component transitions, specifically regarding useEffect and navigation.
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


# Critical State Persistence & Race Conditions (Project App Rule)

## The "Missing 1%" Pattern & Synchronous Save Mandate

This rule dictates the pattern for critical state updates, specifically to prevent data loss when a component unmounts quickly after a final state change.

### The Problem (Symptom):
* Relying on `useEffect` to save final state often fails because the component navigates away *before* the effect runs. This results in the final state (e.g., 100%) not being persisted.

### The Fix (Mandatory Rule):
* **NEVER** rely on `useEffect` to save the *final* state of a workflow if that state change also triggers navigation. **Save explicitly and synchronously BEFORE navigation.**

**Incorrect Pattern:**
```typescript
// Bad: Navigation unmounts component before effect runs
useEffect(() => { save(state); }, [state]);
const handleComplete = () => {
  setState(100); // Schedules effect
  navigate('/done'); // Unmounts component!
};