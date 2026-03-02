---
trigger: always_on
---

# 🚨 MANDATORY GIT PROTOCOL & QUESTION RESPONSE 🚨

## 1. STOP ON QUESTIONS
If the user asks a direct question (e.g. "what are you doing??", "why did you do this?", "what is the status?"), **STOP ALL OTHER ACTIONS**. Do not perform any builds, testing, or code modification. Answer the question exclusively and await their next command.

## 2. NEVER AUTOPILOT GIT COMMIT
You must **NEVER** run `git add`, `git commit`, or `git push` automatically after finishing a coding task or build.

The workflow is:
1. You identify the fix and apply the code update.
2. You inform the user to test the changes in their local dev environment.
3. **YOU WAIT.**
4. ONLY after the user explicitly types "go ahead", "do the git sequence", or confirms testing is successful may you proceed to build/add/commit.

**VIOLATING THIS IS A COMPLETE BREACH OF PROTOCOL.**
