---
trigger: always_on
---

# Critical State Persistence & Race Conditions

##Excellence Mandate: Root Cause & Structural Integrity
This mandate strictly prohibits superficial patching and elevates the requirement for every logic update to be a comprehensive, structural improvement. Mediocrity in problem-solving is unacceptable.

Mandatory Rule: Patching is Forbidden (Root Cause Analysis Required)
The agent must never introduce a localized patch, conditional check, or quick fix that masks a deeper underlying issue. Every bug must be treated as a symptom requiring exhaustive diagnosis.

Stage 1: Diagnosis & Scope (Mandatory Pre-requisite)

Upon encountering any error or bug, the agent must first perform a comprehensive root cause analysis across the entire codebase.

The agent must identify the original faulty architectural choice, design flaw, or assumption that allowed the bug to manifest.

Stage 2: Structural Solution Only

The agent is forbidden from applying logic updates directly to the point of failure if the root cause lies elsewhere.

The proposed fix must be a structural update that resolves the original design flaw, preventing the class of bug from recurring, not just the specific instance encountered.

If a fix requires modification across multiple files to ensure structural coherence, all such modifications must be included in the proposed change set.

Stage 3: Excellence and Validation

The agent must certify that the proposed fix achieves the highest standard of code excellence, prioritizing clarity, maintainability, and efficiency.

The solution must integrate seamlessly with existing architecture and pass all regression tests focused on the original root cause area.

Agent Communication Directive
When proposing a logic fix, the agent must explicitly justify that the change is structural, not a patch.

When proposing a fix, the agent must include a summary section titled: "Root Cause Identified and Structural Solution:"

This summary must clearly state: "Patching was rejected; this solution addresses [Original Design Flaw] to prevent future recurrences."

##Logic Update Integrity ProtocolThis protocol establishes a secure, transactional method for updating code logic, preventing file corruption and ensuring easy rollback.Mandatory Rule: Atomic File Swapping (No In-Place Edits)The agent must never directly modify a production or working file when performing a logic update. All file changes must be conducted in a temporary staging area and then swapped into place only upon successful validation.Stage 1: Shadow Copy and ModificationBefore making any change, create a shadow copy of the original file (file.ts $\rightarrow$ file.ts.staging).Apply the logic updates only to the staging copy (file.ts.staging). The original file (file.ts) must remain untouched.Stage 2: Independent ValidationAfter the logic update is complete on the staging copy, run all necessary unit tests and syntax checks against the staging copy before it is merged.If validation fails, the staging copy (file.ts.staging) is immediately deleted, and the original file (file.ts) is retained, resulting in a clean, zero-effort rollback.Stage 3: Atomic SwapIf validation succeeds, perform an atomic file swap:The original file (file.ts) is moved to a temporary backup (file.ts.bak).The staging copy (file.ts.staging) is immediately renamed to the original name (file.ts).The backup (file.ts.bak) is then deleted.This sequence minimizes the window of time where the file system is inconsistent, ensuring that either the old, known-good file or the new, validated file is always present.Agent Communication DirectiveWhen proposing a logic fix, the agent must explicitly confirm the successful execution of this protocol before reporting completion.When proposing a fix, the agent must include a step that confirms: "Staging and Validation Complete."After the fix is applied, the agent must confirm: "Atomic Swap Successful. Logic Update is Live."By enforcing this protocol, you prevent the issue of partial, corrupted writes, as the working file is only ever replaced by a fully validated version.

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
3. **For git commands like add , commit and push, do each individually and not all in one string

### Corruption of files
1. Plan accordingly to avoid corruption of files and having to redo from scratch.
2. Execute code after proper planning to avoid corruption of files and having to redo from scratch.