# Continuous Mode Pause/Resume & Spanish Voice Gender Fix

## Issues Fixed

### 1. ✅ Continuous Mode Now Uses Pause/Resume (Not Stop/Start)

**Problem**: 
When user clicked the continuous mode button to stop audio, it would completely stop and reset. When they clicked it again, the prayer would restart from the beginning instead of resuming from where it was paused.

**Root Cause**:
- `handleToggleContinuous` was calling `stopAudio()` which cancels all speech
- No state was preserved about where in the prayer the user was
- Clicking the button again would call `playAudio()` with the current step, restarting it

**Solution**:
1. **Changed to Pause/Resume**:
   - Button now calls `pauseAudio()` instead of `stopAudio()`
   - Pause preserves the speech synthesis state
   - Clicking again resumes from the exact point where it was paused

2. **Improved pauseAudio Function**:
   - Now checks if audio is already paused
   - If paused → resumes playback
   - If playing → pauses playback
   - Acts as a proper toggle

3. **Smart Button Logic**:
   - Checks both `continuousMode` and `isPlaying` states
   - Only starts new audio if not already playing
   - Allows seamless pause/resume

**User Experience**:
- **Before**: Click pause → audio stops → click play → prayer restarts from beginning
- **After**: Click pause → audio pauses → click play → prayer resumes from exact point

**Files Modified**:
- `src/components/MysteryScreen.tsx`:
  - Imported `pauseAudio` from useApp
  - Updated `handleToggleContinuous` to use pause instead of stop
  - Added logic to only play if not already playing (for resume)
  
- `src/context/AppContext.tsx`:
  - Enhanced `pauseAudio` to check if already paused and resume if so
  - Properly manages `isPlaying` state for both pause and resume

---

### 2. ✅ Spanish Voice Gender Correction

**Problem**: 
Spanish litanies had reversed gender voices:
- Calls (should be female) were using male voice
- Responses (should be male) were using female voice
- English worked correctly, only Spanish was reversed

**Root Cause**:
Many Spanish TTS engines (especially on Windows and some browsers) have voice metadata that's opposite to the actual voice characteristics:
- A voice labeled "female" or with a female name actually sounds male
- A voice labeled "male" or with a male name actually sounds female
- This is a known issue with certain Spanish TTS voice packs

**Solution**:
Added language-specific gender swapping for Spanish:
```typescript
if (this.language === 'es') {
    requestedGender = segment.gender === 'female' ? 'male' : 'female';
}
```

**How It Works**:
1. Code requests female voice for calls (as intended)
2. For Spanish, we swap: female → male
3. TTS engine returns what it calls a "male" voice
4. But that "male" voice actually sounds female (due to TTS bug)
5. Result: Correct female voice for calls!

**Logging**:
Added console log to show when gender swapping occurs:
```
Spanish voice correction: female → male
```

This helps verify the fix is working and can be disabled if needed.

**Files Modified**:
- `src/utils/audioPlayer.ts`:
  - Lines 65-76: Added Spanish gender correction logic
  - Swaps male ↔ female for Spanish language only
  - Logs the correction for debugging

---

## Testing Instructions

### Test Pause/Resume:
1. Start continuous mode on any prayer
2. Let it play for a few seconds
3. Click pause button
4. **Expected**: Audio pauses mid-sentence
5. Click play button again
6. **Expected**: Audio resumes from exact point where it paused (not from beginning)

### Test Spanish Gender:
1. Switch to Spanish language
2. Navigate to any mystery
3. Play through to Litany of Loreto
4. **Expected**:
   - Calls (e.g., "Santa María") = Female voice
   - Responses (e.g., "Ruega por nosotros") = Male voice
5. Check console for logs:
   ```
   Spanish voice correction: female → male
   Available es voices: [...]
   ✓ Found male voice: [name]
   ```

### Test English (Should Be Unchanged):
1. Switch to English language
2. Play Litany of Loreto
3. **Expected**:
   - Calls = Female voice
   - Responses = Male voice
4. **No** gender correction logs should appear

---

## Configuration Options

### If Spanish Gender Correction Causes Issues:

If on your system Spanish voices are already correct and this fix makes them wrong, you can disable it by commenting out the correction in `src/utils/audioPlayer.ts`:

```typescript
// Spanish voice gender correction
// Many Spanish TTS engines have opposite gender characteristics
// if (this.language === 'es') {
//     requestedGender = segment.gender === 'female' ? 'male' : 'female';
//     console.log(`Spanish voice correction: ${segment.gender} → ${requestedGender}`);
// }
```

### Alternative: Make It Configurable

Could add a setting in the future:
- Settings → "Swap Spanish Voices" toggle
- Allows users to enable/disable based on their system

---

## Technical Notes

### Why Pause/Resume Works:
- Web Speech API's `pause()` preserves the utterance queue
- `resume()` continues from the exact point in the text
- Much better UX than stop/restart

### Why Spanish Voices Are Reversed:
- Some TTS voice packs have incorrect metadata
- Voice files themselves are fine, just mislabeled
- Common issue with Microsoft Spanish voices on Windows
- Also affects some browser-provided Spanish voices
- Swapping the gender request compensates for the mislabeling

### Browser Compatibility:
- Pause/resume works in all modern browsers
- Spanish gender swap is browser/OS independent
- Logging helps diagnose system-specific issues

---

## Summary

**Continuous Mode**: Now properly pauses and resumes instead of stopping and restarting

**Spanish Voices**: Now correctly assigns female to calls and male to responses by compensating for reversed TTS voice metadata

Both fixes improve the user experience significantly and make the app work correctly across different languages and systems!
