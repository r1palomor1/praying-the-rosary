# Cinematic Spacing Audit & Optimization Plan

## Current Spacing Analysis

### 1. REFLECTION (Decade Announcement)
**Current:**
- Title → Text: 16px (space-y-4)
- Text → Fruit: 8px (pt-2)
- Fruit → Scripture: 16px (0.5rem margin + 8px fruit margin)
- Scripture text → Reference: ~12px

**Status:** ✅ Optimized - All content fits on mobile

---

### 2. INTRO PRAYERS (Sign of Cross, etc.)
**Current:**
- Title → Text: 32px (space-y-8)

**Issue:** This is 2x larger than reflection! Should be consistent.

**Recommendation:** Change to space-y-4 (16px) to match reflection

---

### 3. CLOSING PRAYERS
**Current:**
- Title: has mb-8 (32px bottom margin)
- Title → Text: Inside space-y-8 (32px)

**Issue:** Extra large spacing, inconsistent with reflection

**Recommendation:** 
- Remove mb-8 from title
- Change space-y-8 to space-y-4 (16px)

---

### 4. DECADE PRAYERS (Our Father, Hail Mary, etc.)
**Current:**
- Title/Fruit group → Text: 32px (space-y-8)
- Title → Fruit: 8px (space-y-2)

**Issue:** Title→Text gap is 2x larger than reflection

**Recommendation:** Change space-y-8 to space-y-4 (16px)

---

## Proposed Changes

### Change 1: Intro Prayers
**File:** CinematicMysteryView.tsx line 191
**Change:** `space-y-8` → `space-y-4`

### Change 2: Closing Prayers  
**File:** CinematicMysteryView.tsx line 221 & 223
**Change:** Remove `mb-8` from title, change `space-y-8` → `space-y-4`

### Change 3: Decade Prayers
**File:** CinematicMysteryView.tsx line 279
**Change:** `space-y-8` → `space-y-4`

---

## Expected Result
All prayer types will have **consistent 16px spacing** between title and text, matching the optimized reflection page. This will:
- Ensure all content fits on mobile
- Create visual consistency across all prayers
- Maintain proper hierarchy and readability
