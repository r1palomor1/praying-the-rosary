# Audio Read-Along Highlighting - Implementation Status

## Overview
Implemented **sentence-level highlighting** for the **Apostles' Creed** during audio playback using a time-based estimation approach.

## Current Status
**✅ WORKING** - Highlighting is functional using time-based sentence estimation.

## Final Implementation

### Approach: Time-Based Estimation
After discovering that the Web Speech API's `onboundary` events are not reliably supported across browsers, we implemented a time-based approach that calculates when each sentence should be highlighted based on:
- Word count per sentence
- Speech rate (0.85x)
- Estimated words per second (~3.0 WPS adjusted)

### Changes Made

#### 1. TTS Engine (`src/utils/ttsManager.ts`)
*   Added `setOnBoundary(callback)` method (kept for potential future use)
*   Added `activeUtterance` property to prevent Garbage Collection issues
*   Added getter `activeUtteranceRef` for TypeScript compliance

#### 2. UI Logic (`src/components/MysteryScreen.tsx`)
*   Added `highlightIndex` state to track which sentence is active
*   Added `getSentences(text)` helper function to split text by punctuation `[.!?:]`
*   Added `useEffect` that:
    *   Checks if current prayer is Apostles' Creed
    *   Sanitizes text using `sanitizeTextForSpeech` to match audio processing
    *   Splits into sentences and calculates timing for each
    *   Sets timeouts to update `highlightIndex` at appropriate intervals
    *   Cleans up timeouts on unmount or when playback stops
*   Updated Rendering:
    *   For Apostles' Creed, splits text into `<span>` elements
    *   Applies `.highlighted-sentence` class to the active sentence index

#### 3. Styling (`src/components/MysteryScreen.css`)
*   Added `.highlighted-sentence` class with:
    *   Purple background glow (`rgba(91, 33, 182, 0.3)`)
    *   Box shadow for emphasis
    *   Smooth transition animation
    *   Dark mode support

## Known Limitations

1. **Timing Accuracy**: The highlighting is based on estimated timing, not actual audio position. There may be slight drift (±1-2 seconds) between audio and highlight, especially for longer sentences.

2. **Pause/Resume**: If user pauses and resumes, the timing will be off since timeouts continue running. This could be improved by tracking elapsed time.

3. **Single Prayer Only**: Currently only works for Apostles' Creed. Can be extended to other prayers by modifying the `isCreed` check.

## Future Improvements

1. **Extend to All Prayers**: Remove the Creed-only restriction
2. **Improve Timing**: Fine-tune the `wordsPerSecond` calculation based on actual TTS performance
3. **Pause/Resume Support**: Track elapsed time to maintain sync when pausing
4. **Browser Event Fallback**: Keep the `onboundary` code as a fallback for browsers that support it

## Testing Notes

- Tested on Apostles' Creed with audio playback
- Highlighting activates correctly for each sentence
- Minor timing lag (~2 seconds) on last sentence, adjusted from 2.5 to 3.0 WPS
- Works in continuous mode
