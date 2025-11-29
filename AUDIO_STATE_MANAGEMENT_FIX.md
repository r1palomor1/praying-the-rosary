# Audio Playback State Management Fix

## Issues Fixed

### 1. Continuous Mode Button State Persistence

**Problem**: 
When user clicks continuous mode button and audio starts playing, then navigates to Home and back to the prayer screen, the button shows the Play icon (Volume2) instead of the Pause icon, even though audio is still playing. Clicking the Play icon would restart the audio instead of stopping it.

**Root Cause**:
- The `continuousMode` state is local to `MysteryScreen` component
- When user navigates away, the component unmounts and loses state
- When user returns, component remounts with `continuousMode = false`
- Button icon was only checking `continuousMode`, not the global `isPlaying` state

**Solution**:
1. **Button Icon Logic**: Changed button to check `(continuousMode || isPlaying)` instead of just `continuousMode`
   - Now shows Pause icon whenever audio is playing, regardless of how it was started
   
2. **State Synchronization**: Added `useEffect` on component mount to sync `continuousMode` with `isPlaying`
   - If audio is playing when component mounts, automatically set `continuousMode = true`
   - This ensures continuous mode resumes correctly after navigation

**Files Modified**:
- `src/components/MysteryScreen.tsx`
  - Lines 91-99: Added useEffect to sync continuous mode on mount
  - Lines 548-555: Updated button to check both `continuousMode` and `isPlaying`

### 2. Enhanced Voice Selection Debugging

**Problem**:
- Mobile devices may have limited TTS voices available
- Difficult to diagnose why gender alternation isn't working on specific devices
- Spanish voices may not be properly detected on some platforms

**Solution**:
Added comprehensive logging to help diagnose voice selection issues:

1. **Available Voices Logging**: 
   - Logs all available voices for the current language
   - Shows voice name, language code, and default status
   - Helps identify what voices are available on the device

2. **Selection Process Logging**:
   - `✓ Found {gender} voice`: Exact gender match found
   - `⚠ No exact {gender} voice found`: Falling back to alternate strategies
   - `→ Using neutral voice`: Using voice that doesn't match opposite gender
   - `→ Using alternating voice`: Using index-based alternation
   - `→ Using fallback voice`: Last resort - using first available voice

3. **Improved Fallback Strategy**:
   - Better handling when only one voice is available
   - Safer array indexing to prevent out-of-bounds errors
   - More robust alternation logic for mobile devices

**Files Modified**:
- `src/utils/audioPlayer.ts`
  - Lines 92-100: Added available voices logging
  - Lines 102-104: Added warning when no voices found
  - Lines 124-125: Enhanced success logging
  - Lines 127: Added fallback strategy logging
  - Lines 140-141: Improved alternation with safer indexing

## Testing Instructions

### Desktop Testing:
1. Start continuous mode on a prayer
2. Navigate to Home
3. Navigate back to the prayer
4. **Expected**: Pause icon should be showing (not Play icon)
5. Click the button - audio should stop (not restart)

### Mobile Testing:
1. Open browser console (if possible) or use remote debugging
2. Start any prayer with audio
3. Check console for voice selection logs:
   ```
   Available es voices: [{name: "...", lang: "es-ES", default: true}]
   ✓ Found female voice: Monica
   ✓ Found male voice: Diego
   ```
4. Listen to litany prayers - calls should be one voice, responses another
5. If only one voice is available, check that it's being used consistently

### Spanish Litany Testing:
1. Switch to Spanish language
2. Navigate to any mystery
3. Play through to the Litany of Loreto
4. **Expected**: 
   - Calls (invocations) should use female voice
   - Responses should use male voice
   - Same pattern as English litanies

## Debugging Mobile Voice Issues

If gender alternation still doesn't work on mobile:

1. **Check Console Logs**:
   - Look for "Available es voices" log
   - Note how many voices are listed
   - Check if any have gender-specific names

2. **Single Voice Scenario**:
   - If only one voice is available, alternation is impossible
   - The app will use the same voice for both genders
   - This is a device/browser limitation, not an app bug

3. **Voice Name Patterns**:
   - If voices don't match our keywords, they won't be selected by gender
   - Add new keywords to `femaleKeywords` or `maleKeywords` arrays
   - Located in `src/utils/audioPlayer.ts` lines 107-120

## Known Limitations

1. **Mobile TTS Engines**: Some mobile browsers only provide one voice per language
2. **Voice Availability**: Voice selection depends on what the OS/browser provides
3. **Offline Voices**: Some devices only have limited voices when offline

## Future Improvements

1. Add user preference to manually select voices
2. Implement pitch/rate modulation as fallback for single-voice scenarios
3. Add voice preview in settings
4. Cache voice selection to avoid repeated lookups
