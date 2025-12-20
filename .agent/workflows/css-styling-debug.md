---
description: Protocol for debugging CSS/styling issues efficiently
---

# CSS Styling Debug Protocol

**Purpose:** Prevent wasted time when matching or debugging visual styles. Always find the source of truth FIRST before attempting fixes.

## Rule: Source of Truth First

When asked to match styling (color, size, font, etc.) from Element A to Element B:

### Step 1: Identify the Target Element's Classes
- View the code for Element A
- Note ALL className values (e.g., `className="font-display text-2xl immersive-mystery-title"`)

### Step 2: Search for CSS Definitions (Exhaustive)
For EACH class found in Step 1:
```bash
# Search entire src directory, not just one file
grep_search: ".<classname>" in src/
```

**CRITICAL:** If a class is not found in the first search:
- ❌ DO NOT assume it doesn't exist
- ❌ DO NOT start guessing with inline styles
- ✅ DO search broader (entire project root)
- ✅ DO ask user to inspect element in browser DevTools

### Step 3: Verify CSS Rule Priority
Once CSS is found, check:
- Is there an inline `style` attribute? (highest priority)
- Which CSS rule actually applies? (specificity matters)
- Are there `!important` overrides?

### Step 4: Apply the EXACT Same Approach
Copy the EXACT className or CSS rule to Element B:
- Same classes → Same result
- Don't reinvent with inline styles unless absolutely necessary

## Anti-Pattern: What NOT to Do

❌ **Guessing with inline styles**
```tsx
// BAD: Guessing the color
<span style={{ color: '#FFD700' }}>  // Where did this come from?
```

✅ **Using the actual class**
```tsx
// GOOD: Using the source of truth
<span className="immersive-mystery-title">  // Matches Element A exactly
```

## When to Ask User for Browser Inspection

If after exhaustive search (entire project) a class is still not found:
1. Ask user: "Can you right-click [Element A], select Inspect, and tell me what color/style shows in the DevTools Styles panel?"
2. User provides the actual CSS rule
3. Apply that rule to Element B

## Time Savings

- **Old approach:** 30+ minutes of trial and error
- **New approach:** 5 minutes (search → find → apply)

## Example from Dec 19, 2024

**Task:** Match fruit text color to REFLECTION title color

**Wrong approach (30 min):**
- Assumed `var(--color-text-primary)`
- Tried inline styles with variables
- Tried `!important` overrides
- Went in circles

**Right approach (5 min):**
1. See REFLECTION uses `className="immersive-mystery-title"`
2. Search: `grep_search "immersive-mystery-title" in src/`
3. Find: `.immersive-mystery-title { color: #FFD700; }`
4. Apply same class to fruit text
5. Done ✅

---

**Last Updated:** December 19, 2024
