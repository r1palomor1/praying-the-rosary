---
description: Verify code structure and syntax after file modifications
---

Step 1: Check for syntax errors
Before confirming a task is complete, specifically if you have used `replace_file_content` or `multi_replace_file_content`:
1.  Read the file you just modified (or at least the modified sections including surrounding lines) to visually verify structure.
2.  If the project is a TypeScript/JavaScript project, look for "Expected ..." or "Unexpected token" errors in the linter output or build logs.
3.  Specifically check for:
    *   Missing closing braces `}` for classes, functions, or blocks.
    *   Duplicate or missing method signatures.
    *   Unclosed string literals.

Step 2: Verify build status
// turbo
1.  If a build or dev server is running, check its status using `command_status` or by checking the latest output.
2.  If you see "Transform failed" or key syntax errors, **STOP** and fix them immediately before proceeding.

Step 3: Self-Correction
1.  If you identify a syntax error, do not ask the user for permission to fix it. Fix it immediately as part of the tool use cycle.
