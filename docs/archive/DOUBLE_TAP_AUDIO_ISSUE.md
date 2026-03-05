# Double-Tap Audio Issue - Analysis & Solution

## Problem
On mobile, when launching the app fresh, the continuous mode button must be pressed **twice** before audio plays:
- First press: No audio
- Second press: Audio plays normally

## Root Cause
Mobile browsers (iOS Safari, Chrome Android) require a **user gesture** to unlock the audio context. This is a security feature to prevent auto-playing audio.

### What's Happening:
1. **First tap**: Initializes Sherpa TTS and generates audio, but audio context is locked
2. **Second tap**: Audio context is now unlocked, audio plays

## Solution Options

### Option 1: Silent Audio Unlock (Recommended)
Play a silent audio file on first user interaction to unlock the context.

**Implementation**: Add to `ttsManager.ts` in `speakWithSherpa()`:
```typescript
// One-time audio context unlock
if (!this.audioContextUnlocked) {
    const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
    await silentAudio.play().catch(() => {});
    this.audioContextUnlocked = true;
}
```

### Option 2: User Feedback
Show a message on first launch: "Tap to enable audio" before starting prayers.

### Option 3: Preload on Home Screen
Add an "Enable Audio" button on the home screen that unlocks audio before entering prayer mode.

## Testing Required
After implementing, test:
1. Close app completely
2. Reopen app
3. Start continuous mode
4. Verify audio plays on FIRST press

## Browser Compatibility
- ✅ Chrome Android
- ✅ Safari iOS 16.4+
- ⚠️ Older browsers may still require double-tap
