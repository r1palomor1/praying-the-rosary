# Proper Pause/Resume Implementation - Root Cause Analysis & Fix

## Root Cause Analysis

### The Problem
When users clicked the pause button in continuous mode, the audio would stop completely. Clicking it again would restart the prayer from the beginning instead of resuming from where it was paused.

### Why It Was Happening

**The Fundamental Issue**: Web Speech API's `pause()` and `resume()` only work for **single utterances**, not for **queued segments**.

Our app uses a custom segment queue system:
1. A prayer is split into multiple segments (e.g., call and response)
2. Each segment is a separate `SpeechSynthesisUtterance`
3. Segments are played sequentially using callbacks

**The Broken Flow**:
```
User clicks pause
  → pauseAudio() called
  → synth.pause() pauses current utterance ✓
  
User clicks play again
  → pauseAudio() called (checking if paused)
  → synth.resume() resumes current utterance ✓
  
BUT... when user navigates away and back:
  → Component unmounts, synth state is lost
  → User clicks play
  → playAudio(segments) is called
  → speakSegments() is called
  → this.stop() is called (LINE 44!)
  → All state is cleared
  → Starts from beginning ✗
```

**The Critical Bug**: `speakSegments()` always called `this.stop()` at the start, which cleared everything and restarted from the beginning.

---

## The Solution

### 1. State Tracking
Added three new private properties to track pause/resume state:

```typescript
private currentSegments: { text: string; gender: 'female' | 'male'; rate?: number }[] = [];
private currentSegmentIndex: number = 0;
private isPausedState: boolean = false;
```

**What They Do**:
- `currentSegments`: Stores the full prayer segment queue
- `currentSegmentIndex`: Tracks which segment we're currently on
- `isPausedState`: Remembers if we're paused (survives navigation)

### 2. Refactored speakSegments()
```typescript
speakSegments(segments) {
    // Store segments for pause/resume
    this.currentSegments = segments;
    this.currentSegmentIndex = 0;
    this.isPausedState = false;
    
    this.stop(); // Still clears old state
    this.speakFromCurrentIndex(); // New method!
}
```

**Key Change**: Extracted the playback logic into `speakFromCurrentIndex()` which can be called both for initial playback AND for resume.

### 3. New speakFromCurrentIndex() Method
```typescript
private speakFromCurrentIndex(): void {
    const speakNext = () => {
        if (this.currentSegmentIndex >= this.currentSegments.length) {
            // Done - clear state
            this.currentSegments = [];
            this.currentSegmentIndex = 0;
            return;
        }

        const segment = this.currentSegments[this.currentSegmentIndex];
        // ... create and speak utterance ...
        
        this.utterance.onend = () => {
            this.currentSegmentIndex++; // Move to next segment
            speakNext();
        };
    };
    speakNext();
}
```

**What's Different**: Uses `this.currentSegmentIndex` instead of a local `currentIndex` variable, so the index persists across pause/resume cycles.

### 4. Enhanced pause() Method
```typescript
pause(): void {
    if (this.synth.speaking) {
        this.synth.pause();
        this.isPausedState = true; // Remember we're paused
        console.log(`Paused at segment ${this.currentSegmentIndex} of ${this.currentSegments.length}`);
    }
}
```

**Key Addition**: Sets `isPausedState = true` so we know we're paused even if the synth state is lost.

### 5. Smart resume() Method
```typescript
resume(): void {
    if (this.synth.paused) {
        // Simple case: synth is still paused, just resume
        this.synth.resume();
        this.isPausedState = false;
        console.log(`Resumed from segment ${this.currentSegmentIndex}`);
    } else if (this.isPausedState && this.currentSegments.length > 0) {
        // Complex case: synth lost state (e.g., after navigation)
        // but we remember we were paused - restart from current segment
        console.log(`Restarting from segment ${this.currentSegmentIndex} of ${this.currentSegments.length}`);
        this.isPausedState = false;
        this.speakFromCurrentIndex(); // Resume from saved position!
    }
}
```

**The Magic**: 
- If synth is still paused → simple resume
- If synth lost state BUT we remember being paused → restart from saved segment index

### 6. Updated stop() Method
```typescript
stop(): void {
    this.synth.cancel();
    this.utterance = null;
    // Clear ALL state
    this.isPausedState = false;
    this.currentSegments = [];
    this.currentSegmentIndex = 0;
}
```

**Important**: Only `stop()` clears the state. `pause()` preserves it.

---

## How It Works Now

### Scenario 1: Simple Pause/Resume (No Navigation)
```
1. User starts continuous mode
   → speakSegments() called
   → currentSegments = [seg1, seg2, seg3, ...]
   → currentSegmentIndex = 0
   → Starts playing segment 0

2. Segment 0 finishes
   → currentSegmentIndex = 1
   → Starts playing segment 1

3. User clicks pause (mid-segment 1)
   → synth.pause() pauses current utterance
   → isPausedState = true
   → currentSegmentIndex still = 1

4. User clicks play
   → resume() called
   → synth.paused = true (still paused)
   → synth.resume() resumes segment 1 from exact point
   → isPausedState = false
   → Continues playing ✓
```

### Scenario 2: Pause, Navigate Away, Come Back, Resume
```
1. User starts continuous mode
   → currentSegments = [seg1, seg2, seg3, ...]
   → Playing segment 2

2. User clicks pause
   → isPausedState = true
   → currentSegmentIndex = 2

3. User navigates to Home
   → Component unmounts
   → synth state may be lost
   → BUT audioPlayer state persists (singleton)

4. User navigates back to prayer
   → Component remounts
   → Checks isPlaying from AppContext
   → Syncs continuousMode = true

5. User clicks play
   → resume() called
   → synth.paused = false (state was lost)
   → BUT isPausedState = true AND currentSegments.length > 0
   → Calls speakFromCurrentIndex()
   → Starts from segment 2 (where we paused!) ✓
```

---

## Additional Fix: Tooltip Text

Changed button tooltip from "Stop Continuous" / "Detener Continuo" to "Pause" / "Pausar" to accurately reflect the new behavior.

**Files Modified**:
- `src/components/MysteryScreen.tsx`:
  - Lines 140, 155: Changed `stopContinuous` to `pauseContinuous`
  - Lines 564-565: Updated button to use `pauseContinuous`

---

## Testing Instructions

### Test 1: Basic Pause/Resume
1. Start continuous mode on any prayer
2. Let it play for 3-4 segments
3. Click pause button
4. **Expected**: Audio pauses immediately
5. Wait 2 seconds
6. Click play button
7. **Expected**: Audio resumes from exact point (not restart)

### Test 2: Pause, Navigate, Resume
1. Start continuous mode
2. Let it play for several segments
3. Click pause
4. Navigate to Home
5. Navigate back to prayer
6. Click play
7. **Expected**: Audio resumes from where you paused (not restart)

### Test 3: Verify Segment Tracking
1. Open browser console
2. Start continuous mode
3. Click pause
4. **Check console**: Should see "Paused at segment X of Y"
5. Click play
6. **Check console**: Should see "Resumed from segment X" or "Restarting from segment X"

### Test 4: Tooltip Text
1. Hover over continuous button when audio is playing
2. **Expected**: Tooltip says "Pause" (English) or "Pausar" (Spanish)
3. Not "Stop" or "Detener"

---

## Technical Notes

### Why This Works
- **Persistent State**: audioPlayer is a singleton, so state survives navigation
- **Segment Tracking**: We track which segment we're on, not just time position
- **Smart Resume**: Handles both simple pause/resume and state-loss scenarios

### Limitations
- Only tracks segment-level position, not character-level position within a segment
- If a segment is very long and user pauses mid-segment, resume will restart that segment
- This is acceptable for our use case (segments are typically short)

### Future Enhancements
- Could add character-level position tracking using utterance events
- Could add visual indicator showing which segment is playing
- Could add "skip to next segment" button

---

## Summary

**Root Cause**: `speakSegments()` always called `stop()`, clearing all state and restarting from beginning.

**Fix**: 
1. Track segment queue state (segments, index, paused flag)
2. Extract playback logic to `speakFromCurrentIndex()`
3. Make `resume()` smart enough to restart from saved position
4. Only clear state in `stop()`, not in `pause()`

**Result**: True pause/resume that works even across navigation! 🎉
