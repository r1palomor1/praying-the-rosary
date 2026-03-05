# Refactor TODO

## Desktop Layout Issue - Reflection Page
**Priority**: Medium  
**Status**: Deferred for later review

### Issue
In full-width desktop mode, the reflection text and scripture text overflow into the blur background on the reflection page. The titles ("Reflection" and "Fruit: XXX") are perfectly centered, but the body text is not constrained properly.

### Works Correctly
- ✅ Tablet mode (DevTools narrow screen)
- ✅ Mobile mode
- ✅ Titles are centered correctly

### Needs Fix
- ❌ Desktop mode: Reflection text overflows
- ❌ Desktop mode: Scripture text overflows

### Possible Solutions
1. Add max-width constraint to text containers (not the entire page)
2. Add padding/margin to prevent overflow into blur
3. Consider responsive breakpoints for desktop vs tablet

### Files to Review
- `src/components/ClassicMysteryView.tsx` (reflection rendering)
- `src/components/ClassicMysteryView.css` (text container styling)
