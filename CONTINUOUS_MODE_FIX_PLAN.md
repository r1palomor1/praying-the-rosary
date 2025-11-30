# Continuous Mode Fix - Implementation Plan

## Problem Statement
When the mobile screen turns off during continuous mode:
- Audio may complete while page is suspended
- Multiple callbacks queue up
- When screen wakes, app jumps ahead several prayers
- User wants to resume from the CURRENT prayer, not the next one

## Root Causes
1. **Browser Suspension**: Mobile browsers suspend pages when screen turns off
2. **Queued Callbacks**: Audio completion callbacks queue up during suspension
3. **Batch Execution**: All queued callbacks fire at once when page resumes
4. **No Validation**: Callbacks don't check if they're still valid

## Multi-Layer Solution

### Layer 1: Prevention (Wake Lock) ✅ DONE
- Keeps screen on during continuous mode
- Prevents browser suspension
- **Limitation**: Not 100% reliable on all devices/browsers

### Layer 2: Detection (Playback Session ID) - TO IMPLEMENT
```typescript
// Add to MysteryScreen.tsx after continuousModeRef

const playbackIdRef = useRef(0);

// In handleToggleContinuous, when STOPPING:
playbackIdRef.current++; // Invalidate all pending callbacks

// In playSequence:
const currentPlaybackId = playbackIdRef.current;

playAudio(getAudioSegments(step), () => {
    // Validate callback is not stale
    if (playbackIdRef.current !== currentPlaybackId) {
        console.log('[Continuous Mode] Stale callback - ignoring');
        return; // Don't advance
    }
    
    // Rest of callback logic...
});
```

### Layer 3: Fallback (Visibility API) - TO IMPLEMENT
```typescript
// Detect when page becomes hidden/visible
useEffect(() => {
    const handleVisibilityChange = () => {
        if (document.hidden && continuousMode) {
            console.log('[Continuous Mode] Page hidden - stopping');
            setContinuousMode(false);
            continuousModeRef.current = false;
            stopAudio();
        }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
}, [continuousMode]);
```

## Implementation Steps

1. **Add playbackIdRef** after line 270 in MysteryScreen.tsx
2. **Update handleToggleContinuous** to increment playbackId when stopping
3. **Update playSequence** to validate playbackId before advancing
4. **Add visibility change listener** to stop continuous mode when page hides
5. **Test on mobile** with screen timeout

## Expected Behavior After Fix

**Scenario 1: Screen turns off**
- Wake Lock keeps screen on (if supported)
- If Wake Lock fails, visibility listener stops continuous mode
- User resumes from current prayer

**Scenario 2: User manually stops**
- playbackId increments
- Any pending callbacks are invalidated
- App stays on current prayer

**Scenario 3: App goes to background**
- Visibility listener detects page hidden
- Stops continuous mode immediately
- User resumes from current prayer

## Testing Checklist
- [ ] Start continuous mode on mobile
- [ ] Let screen timeout (30 seconds)
- [ ] Wake screen
- [ ] Verify: Still on same prayer (not jumped ahead)
- [ ] Verify: Can resume continuous mode from current prayer
- [ ] Test with Wake Lock supported browser
- [ ] Test with Wake Lock unsupported browser
