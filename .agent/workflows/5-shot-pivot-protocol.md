---
description: Anti-tunnel vision protocol - force architectural rethink after 5 failed attempts
---

# The 5-Shot Pivot Protocol (Anti-Tunnel Vision)

## **Mandatory Rule: Force Architectural Rethink**

### **The Limit**
If a specific bug or feature fails to be fixed after **5 consecutive attempts**, the agent is **STRICTLY FORBIDDEN** from attempting a 6th similar fix.

### **The Pivot**
The agent must immediately stop and propose **2-3 radical alternatives** that challenge the underlying assumptions.

### **Execution Steps**

1. **Acknowledge the Pattern**: Explicitly state that 5 attempts have failed
2. **Stop Current Approach**: Do NOT attempt any variation of the previous 5 solutions
3. **Challenge Assumptions**: List the assumptions made in all previous attempts
4. **Propose Alternatives**: Present 2-3 fundamentally different approaches that:
   - Use different technologies/methods
   - Challenge the problem definition itself
   - Question whether the feature is needed as originally conceived
5. **User Decision**: Wait for user to select an alternative before proceeding

## **Example Pivot Scenarios**

- **CSS not updating** → Check if files are being watched, verify import paths, check browser cache settings, or use inline styles temporarily
- **State not persisting** → Switch from localStorage to IndexedDB, use different state management library, or reconsider data flow
- **Component not rendering** → Rebuild component from scratch, use different component pattern, or verify parent component logic

## **Key Principle**
"If you're in a hole, stop digging."
