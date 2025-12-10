# Audio Read-Along Highlighting - Implementation Status

## Overview
We attempted to implement **sentence-level highlighting** for the **Apostles' Creed** during audio playback. The goal was for the text to highlight in sync with the spoken audio.

## Current Status
**Implemented but NOT Working.** The user reports that audio plays, but no highlighting occurs.

## Changes Made

### 1. TTS Engine (`src/utils/ttsManager.ts`)
*   Added `setOnBoundary(callback)` method to subscribe to speech events.
*   Updated `speakWithWebSpeech` to attach `utterance.onboundary` and forward events.
*   Added `activeUtterance` property to store the `SpeechSynthesisUtterance` reference (preventing Garbage Collection issues where events stop firing).

### 2. UI Logic (`src/components/MysteryScreen.tsx`)
*   Added `highlightIndex` state.
*   Added `getSentences(text)` helper function to split text by punctuation `[.!?:]`.
*   Added `useEffect` that:
    *   Subscribes to `ttsManager.onBoundary`.
    *   Filters for Creed prayer.
    *   Maps `event.charIndex` (from audio) to the correct sentence index.
    *   **Crucial:** Uses `sanitizeTextForSpeech` on the source text to ensure character indices match the sanitized audio text.
*   Updated Rendering Loop:
    *   For Apostles' Creed, splits text into `<span>` elements.
    *   Applies `.highlighted-sentence` class to the active index.

### 3. Styling (`src/components/MysteryScreen.css`)
*   Added `.highlighted-sentence` class at the end of the file.
*   Style: Purple background glow + text color change.

## Debugging / Handoff Guide

### Hypotheses for "Why it's not working":

1.  **Browser Compatibility:** The user might be on a browser/OS that does not support `word` boundary events with the Web Speech API (e.g., some versions of Firefox or older Safari).
    *   *Check:* Re-add `console.log` in `MysteryScreen.tsx` inside `handleBoundary` to see if events fire at all.
    
2.  **Event Name Mismatch:** The code listens for ALL events (does not filter by `event.name === 'word'`), but implies `word` usage. If the browser only sends `start` (index 0) and `end`, highlighting would stay stuck at 0 or finish instantly.
    
3.  **CSS Specificity:** The `.highlighted-sentence` class might be overridden by tailwind utility classes or other `p` styles.
    *   *Check:* Inspect element in DevTools to see if class is applied but invisible.
    
4.  **Race Condition (Subscription):** `MysteryScreen` subscribes in `useEffect`. If `playAudio` (in `AppContext`) somehow resets `ttsManager` or starts speaking before the subscription is active (on re-render), events might be missed.
    *   *Note:* `ttsManager` is a singleton, so subscription *should* persist, but `useEffect` cleanup wipes it on re-render.

5.  **Text Mismatch:** If `sanitizeTextForSpeech` logic (used in UI) differs slightly from what actually got sent to `SpeechSynthesisUtterance`, indices will be off.

## Recommended Next Steps
1.  Add `console.log` back into `MysteryScreen.tsx` to verify if events are firing.
2.  If events are missing, investigate `ttsManager` subscription flow.
3.  If events are present, investigate `getSentences` logic or CSS.
4.  Consider falling back to **Time-Based Estimation** (Option A in original plan) if `onboundary` proves too unreliable across devices.
