---
trigger: always_on
---

# Critical State Persistence & Race Conditions

## The "Missing 1%" Pattern
**Problem:** Relying on `useEffect` to save state (like progress) often fails at the very end of a workflow (e.g., completion) because the component unmounts or navigates away *before* the effect runs.

**Symptom:**
- User completes a task (100%).
- App navigates to "Success" screen.
- Upon reload/resume, progress shows as 99% or "almost done".
- Logic fixes to "resume" flow fail because the underlying data is incomplete.

## The Fix: Explicit Synchronous Save
**Rule:** NEVER rely on `useEffect` to save the *final* state of a workflow if that state change also triggers navigation.

**Incorrect Pattern:**
```typescript
// Bad: Navigation happens immediately, Effect runs later (or never)
useEffect(() => { save(state); }, [state]);

const handleComplete = () => {
  setState(100); // Schedules effect
  navigate('/done'); // Unmounts component immediately!
};
```

**Correct Pattern:**
```typescript
// Good: Save explicitly BEFORE navigation
const handleComplete = () => {
  const finalState = 100;
  save(finalState); // Synchronous save
  navigate('/done');
};
```

## Debugging Checklist
1.  **Verify Data First:** Before fixing navigation logic, check the actual saved data (localStorage/DB). Is it 100%?
2.  **Check Race Conditions:** Does the "Save" action race with the "Navigate" action?
3.  **Trust No Implicit Save:** If it's the final step, save it explicitly.

---
**Application to this Project:**
- **Rosary Completion:** When `MysteryScreen` detects completion, it must call `savePrayerProgress` *synchronously* with the 100% state before calling `onComplete()` (which unmounts it).
- **Session Management:** `HomeScreen` must check this saved data *before* initializing a new session to avoid overwriting context.

## Agent Behavior Protocol

### Communication Style
1.  **No Code Syntax in Chat:** Do not display code snippets, diffs, or syntax when debugging or proposing fixes. Keep the chat clean.
2.  **Bullet Points for Approval:** Present a concise list of planned actions (bullet points) for user approval.
3.  **Background Execution:** All detailed analysis, code reading, and verification steps must happen in the background. Do not narrate them.

### Efficiency & Optimization
1.  **Optimize Logic Building:** Prioritize the most efficient path to a solution to conserve tokens and reduce requests.
2.  **Avoid Verbosity:** Do not display repetitive internal checks (e.g., "I'll check X..."). Only report the final result or confirmation.