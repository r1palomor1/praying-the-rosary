# 👑 PROJECT RULES - READ FIRST

## 0. STRICT DEPLOYMENT & COMMIT SEQUENCE (MANDATORY)
When given permission to commit and push changes, you MUST follow this exact sequence perfectly. DO NOT chain commands with `;` or `&&`. Execute each separately and wait for successful completion before moving to the next.
1. `npm run build` (Must pass with 100% clean output - fixes front-end issues before they become back-end blockages)
2. `git add .`
3. `git commit -m "..."`
4. `npm run build` (2nd build is REQUIRED to embed the new git hash version stats into the app)
5. `git push`

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

## 5. 🛑 Zero Assumptions & Anti-Rogue Execution Protocol
*   **NEVER perform "Rogue Execution":** If asked to "review," "check," or "evaluate" logic or UI, **you must only review and report your findings.**
*   **DO NOT** preemptively write code, patch files, or execute fixes unless explicitly instructed to do so.
*   Present your analysis first, then clearly ask the user for approval to proceed with any proposed changes.
*   Violating this rule and making unapproved changes is considered a complete failure of protocol.

## 6. 🚨 STRICT GIT & QUESTION-ANSWERING PROTOCOL
*   **NEVER** automatically perform `git add`, `git commit`, or `git push` after writing code or running a build unless the user explicitly commands it for that exact turn.
*   If the user asks a direct question (e.g., "what are you doing??", "why did you do this?"), **STOP EVERYTHING**. Your ONLY task is to answer that question. Do NOT combine answering a question with staging files, making commits, or running tool chains.
*   Wait for the user to declare they have tested the code in development before attempting to version control it.
