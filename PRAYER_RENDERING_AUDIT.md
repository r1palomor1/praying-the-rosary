# Complete Prayer Rendering Audit - MysteryScreen.tsx

## Objective
Ensure ALL prayers use `renderTextWithHighlighting()` for consistent highlighting across the entire app.

## Prayer Types and Rendering Locations

### 1. DECADE ANNOUNCEMENT (line ~658)
- **Type:** `step.type === 'decade_announcement'`
- **Current Status:** ❌ NOT using renderTextWithHighlighting
- **Location:** Line 658-713
- **Text rendered at:** Line 699 - `<p className="reflection-text">{step.text}</p>`
- **Action Required:** Replace with `renderTextWithHighlighting(step.text)`

### 2. REFLECTION (line ~715)
- **Type:** `step.type === 'reflection'`
- **Current Status:** ✅ FIXED (line 728)
- **Location:** Line 715-757
- **Text rendered at:** Line 728 - Already using `renderTextWithHighlighting`

### 3. DECADE PRAYERS - CINEMATIC MODE (line ~758)
- **Types:** `decade_our_father`, `decade_hail_mary`, `decade_glory_be`, `decade_jaculatory`, `fatima_prayer`
- **Current Status:** ❌ NOT using renderTextWithHighlighting
- **Location:** Line 758-817
- **Text rendered at:** Multiple locations with inline text
- **Action Required:** Need to find where text is rendered

### 4. DECADE PRAYERS - CINEMATIC WITH IMAGES (line ~818)
- **Current Status:** ❌ NOT using renderTextWithHighlighting
- **Location:** Line 818-899
- **Text rendered at:** Need to find exact line
- **Action Required:** Apply renderTextWithHighlighting

### 5. FINAL HAIL MARY (line ~900)
- **Type:** `step.type === 'final_hail_mary_intro'`
- **Current Status:** ❌ NOT using renderTextWithHighlighting
- **Location:** Line 900-953
- **Text rendered at:** Need to find exact line
- **Action Required:** Apply renderTextWithHighlighting

### 6. CLOSING PRAYERS - CINEMATIC (line ~954)
- **Current Status:** ❌ NOT using renderTextWithHighlighting
- **Location:** Line 954-970
- **Text rendered at:** Need to find exact line
- **Action Required:** Apply renderTextWithHighlighting

### 7. CLOSING PRAYERS - CLASSIC (line ~971)
- **Current Status:** ✅ FIXED (line 975)
- **Location:** Line 971-977
- **Text rendered at:** Line 975 - Already using `renderTextWithHighlighting`

### 8. INTRO PRAYERS - CLASSIC (line ~981)
- **Current Status:** ✅ FIXED (line 985)
- **Location:** Line 981-987
- **Text rendered at:** Line 985 - Already using `renderTextWithHighlighting`

### 9. INTRO PRAYERS - CINEMATIC (line ~1013+)
- **Current Status:** ✅ FIXED (via renderContent helper)
- **Location:** Line 1013-1099
- **Text rendered at:** Uses `renderContent()` which calls `renderTextWithHighlighting`

### 10. DECADE PRAYERS - CLASSIC MODE (line ~1112)
- **Current Status:** ✅ FIXED (line 1116)
- **Location:** Line 1112-1119
- **Text rendered at:** Line 1116 - Already using `renderTextWithHighlighting`

### 11. DEFAULT FALLBACK (line ~1122)
- **Current Status:** ✅ FIXED (line 1125)
- **Location:** Line 1122-1127
- **Text rendered at:** Line 1125 - Already using `renderTextWithHighlighting`

## Summary
- ✅ Fixed: 6 locations
- ❌ Missing: 5 locations (decade announcements, cinematic decade prayers, final hail mary, closing prayers cinematic)

## Next Steps
1. Find exact line numbers for missing locations
2. Apply `renderTextWithHighlighting` to all ❌ locations
3. Test each prayer type to verify highlighting works
