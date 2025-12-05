---
description: Best practices for avoiding data loss during component transitions, specifically regarding useEffect and navigation.
---

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