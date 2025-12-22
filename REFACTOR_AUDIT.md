# Refactor Deep Dive Audit
**Date**: 2025-12-22  
**Status**: Phase 8 Testing

## ✅ Completed Fixes (Verified)

### Layout & Structure
1. ✅ **Full-width desktop mode** - Removed 600px max-width constraint
2. ✅ **Missing prayer names** - Added all 6 intro prayer types to both views
3. ✅ **Cinematic top padding** - Reduced from 10vh to 3vh
4. ✅ **Reflection padding alignment** - Removed extra pt-4 class
5. ✅ **Reflection text overflow** - Added max-w-2xl wrapper
6. ✅ **Scripture text overflow** - Added max-w-2xl wrapper  
7. ✅ **Scrolling prevention** - Added overflow: hidden to cinematic-content
8. ✅ **Nav bar overlap** - Changed height to calc(100vh - 80px)
9. ✅ **Removed h-full** - From decade prayers cinematic-main
10. ✅ **Removed wrapper nesting** - Cinematic mode no longer wrapped in mystery-screen-content

---

## ⚠️ POTENTIAL ISSUES TO CHECK

### 1. **Bead Counter Positioning** (CRITICAL)
**Original Issue**: Bead counter was child of cinematic-main, causing centering issues  
**Required Fix**: Bead counter must be SIBLING of cinematic-main, positioned at bottom 15%

**Check**:
- [ ] In CinematicMysteryView.tsx, is bead counter OUTSIDE the `<main className="cinematic-main">` tag?
- [ ] Is it positioned with `position: absolute; bottom: 15%;`?
- [ ] Does it have correct styling: `font-size: 13px`, `font-weight: 700`, `color: white`?

**File**: `src/components/CinematicMysteryView.tsx` lines 301-315

---

### 2. **Image Display - Prayer Type Strings** (CRITICAL)
**Original Issue**: Images not showing because prayer type detection was wrong

**Check**:
- [ ] Intro prayers use `sign_of_cross_start` (not `sign_of_cross`)
- [ ] All prayer types match exactly what's in prayerFlowEngine.ts

**Files**: 
- `src/components/ClassicMysteryView.tsx` lines 28-30
- `src/components/CinematicMysteryView.tsx` lines 34-36

---

### 3. **Fruit Labels Visibility** (CRITICAL)
**Original Issue**: Fruit labels only showed on reflection, not on all decade prayers

**Check**:
- [ ] Classic mode: Fruit shows for ALL decade prayers (Our Father, Hail Mary, Glory Be, etc.)
- [ ] Cinematic mode: Fruit shows for ALL decade prayers
- [ ] Fruit is ALWAYS visible (not hidden by text-hidden class)

**Files**:
- `src/components/ClassicMysteryView.tsx` lines 221-225
- `src/components/CinematicMysteryView.tsx` lines 283-292

---

### 4. **Text Hiding Behavior** (CRITICAL)
**Original Issue**: Titles and fruit were being hidden when "hide text" was active

**Required Behavior**:
- When book icon pressed (text hidden):
  - ✅ Prayer text HIDDEN (`.cinematic-text`)
  - ✅ Scripture HIDDEN (`.cinematic-scripture`)
  - ✅ Titles VISIBLE (`.cinematic-title`)
  - ✅ Fruit VISIBLE (`.cinematic-fruit-label`)

**Check**:
- [ ] CSS only hides `.cinematic-text` and `.cinematic-scripture` when text-hidden
- [ ] Titles and fruit do NOT have these classes

**File**: `src/components/CinematicMysteryView.css` lines 104-108

---

### 5. **Litany Styling** (MEDIUM)
**Original Issue**: Litany styles were scattered, causing inconsistencies

**Check**:
- [ ] All litany classes are in `src/styles/index.css` (centralized)
- [ ] Both Classic and Cinematic use same litany classes
- [ ] No litany CSS in MysteryScreen.css or view-specific CSS

**Files**:
- `src/styles/index.css` (should have all litany classes)
- Both view components should reference these classes

---

### 6. **Collapsible Card / Expandable Image** (CLASSIC MODE)
**Original Issue**: Book icon should collapse card and expand image in classic mode

**Check**:
- [ ] When book icon pressed in classic mode:
  - Card with text collapses/hides
  - Image expands to fill space
- [ ] Image aspect ratios are correct (no 35vh compression)

**File**: `src/components/ClassicMysteryView.css` - image container styling

---

### 7. **Responsive Image Component** (BOTH MODES)
**Check**:
- [ ] ResponsiveImage component is imported and used
- [ ] Images use responsive URLs (sm/md/lg) where available
- [ ] Fallback to string URLs works

**Files**: Both view components should import ResponsiveImage

---

### 8. **Debug Panel** (MINOR)
**Check**:
- [ ] DebugOpacitySlider starts collapsed (useState(false))

**File**: `src/components/DebugOpacitySlider.tsx`

---

## 🔍 NEW POTENTIAL ISSUES (Not in Original Plan)

### 9. **ContentRef in Classic Mode**
**Issue**: The `contentRef` was on mystery-screen-content wrapper, now it's only on classic mode div

**Check**:
- [ ] Does anything rely on contentRef in cinematic mode?
- [ ] Is scrolling/focus behavior still correct?

---

### 10. **Progress Bar Positioning**
**Issue**: Progress bar is outside both view components

**Check**:
- [ ] Progress bar shows correctly in both modes
- [ ] Doesn't overlap with content
- [ ] Positioned correctly relative to header

---

### 11. **Mobile Responsiveness**
**Check**:
- [ ] All fixes work on mobile (DevTools mobile view)
- [ ] Cinematic mode: bead counter at bottom 10% on mobile (not 15%)
- [ ] Text sizes adjust correctly

**File**: `src/components/CinematicMysteryView.css` lines 305-326 (media queries)

---

## 📝 Testing Checklist

### Classic Mode
- [ ] Sign of the Cross shows title and image
- [ ] All intro prayers show titles
- [ ] Reflection shows title, text, fruit, scripture
- [ ] Decade prayers show title and fruit
- [ ] Book icon collapses card, expands image
- [ ] Bead counter shows on Hail Marys
- [ ] Litany displays correctly
- [ ] No scrolling issues

### Cinematic Mode
- [ ] Sign of the Cross shows title over image
- [ ] All intro prayers show titles
- [ ] Reflection shows title, text, fruit, scripture
- [ ] Decade prayers show title and fruit
- [ ] Book icon hides text but keeps titles/fruit
- [ ] Bead counter positioned at bottom 15%
- [ ] Litany displays correctly
- [ ] No scrolling issues
- [ ] Content doesn't go behind nav bar

### Both Modes
- [ ] Switching between modes works smoothly
- [ ] Audio/continuous mode works
- [ ] Navigation (prev/next) works
- [ ] Highlighting works
- [ ] Settings modal works
- [ ] Learn More modal works
