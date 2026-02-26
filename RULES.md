# 👑 PROJECT RULES - READ FIRST

## 1. Explicit Permission for Builds & Deploys
*   **NEVER** run `npm run build` or `git push` without asking the user for permission first.
*   **NEVER** assume a workflow allows auto-deployment unless explicitly told for that specific turn.
*   Always present the plan and wait for "Go ahead" or "Yes".

## 2. No Jumping the Gun
*   Do not perform actions based on assumptions.
*   **MANDATORY:** Always explicitly answer chat questions *prior* to implementing any changes. Never ignore or disregard questions.
*   Propose solution -> Get Approval -> Implement.
*   Do not start implementation while answering a question.

## 3. Atomic Updates (Standard)
*   Check build status *before* pushing if permission is granted.

## 4. Token Optimization & Efficiency
*   **Concise Responses:** Keep answers short (1-3 sentences) unless complexity requires detail. Answer the question directly without unnecessary preambles like "Sure!", "Let me help you with that", or "Here's what I found".
*   **Background Processes:** Use `isBackground: true` for long-running terminal commands (dev servers, watch modes, continuous processes). Do NOT use background mode for build commands or git operations.
*   **Parallel Tool Calls:** Batch independent read operations (multiple `read_file`, `grep_search`) in a single parallel execution block. Execute them together instead of sequentially to reduce round trips.
*   **Avoid Verbose Explanations:** When actions are self-explanatory (like staging files, running builds), do NOT explain what the command does. Just run it. Only explain when commands are complex, destructive, or non-obvious.
