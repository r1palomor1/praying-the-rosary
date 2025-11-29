# Piper TTS Integration - High-Quality Voice Synthesis

## Overview

The app now features **Piper TTS Web** integration, providing significantly better voice quality than the browser's built-in Web Speech API. This is a completely offline, browser-based solution that requires no server infrastructure.

## How It Works

### Automatic Engine Selection

The app automatically chooses the best available TTS engine:

```
1. Check if Piper TTS is supported (WebAssembly available)
2. Check if voice models are downloaded
3. If YES → Use Piper TTS (natural voices)
4. If NO → Use Web Speech API (fallback)
```

### Voice Models

**English Voices**:
- Female: `en_US-lessac-medium` (~18MB) - Natural, expressive
- Male: `en_US-hfc_male-medium` (~17MB) - Clear, natural

**Spanish Voices**:
- Female: `es_ES-sharvard-medium` (~15MB) - Natural Spanish
- Male: `es_ES-davefx-medium` (~15MB) - Clear Spanish

**Total Download**: ~30-35MB per language (one-time)

## User Experience

### First Time User

1. **App loads instantly** - Uses Web Speech API
2. **Banner appears** - "Download Better Voices?"
3. **User clicks "Download"** - Models download in background
4. **Progress shown** - "Downloading... 45%"
5. **Download completes** - App automatically switches to Piper TTS
6. **Future sessions** - Always uses Piper TTS (no download)

### Download Banner

- Appears at bottom of screen
- Non-intrusive, can be dismissed
- Shows download progress
- Remembers if user dismissed it
- Only shows if Piper is supported

## Technical Architecture

### Files Created

1. **`src/utils/piperTTS.ts`**
   - Piper TTS integration layer
   - Voice management
   - Download functionality
   - Browser compatibility checking

2. **`src/utils/ttsManager.ts`**
   - Unified TTS manager
   - Automatic engine selection
   - Seamless fallback
   - Queue management

3. **`src/utils/audioPlayer.ts`** (Updated)
   - Simplified interface
   - Delegates to ttsManager
   - Maintains backward compatibility

4. **`src/components/VoiceDownloadBanner.tsx`**
   - Download prompt UI
   - Progress tracking
   - Dismissal handling

5. **`src/components/VoiceDownloadBanner.css`**
   - Banner styling
   - Animations
   - Responsive design

### Dependencies

- `@mintplex-labs/piper-tts-web` - Browser-based Piper TTS
- ONNX Runtime Web (included)
- WebAssembly support (required)

## Browser Compatibility

### Supported Browsers

✅ Chrome 86+ (Desktop & Mobile)  
✅ Edge 86+  
✅ Safari 15.4+ (iOS 15.4+)  
✅ Firefox 89+  
✅ Samsung Internet 14+  

### Unsupported Browsers

❌ Internet Explorer  
❌ Old Android browsers (pre-2021)  
❌ iOS < 15.4  

**Fallback**: Automatically uses Web Speech API on unsupported browsers

## Storage

### Where Models Are Stored

- **Origin Private File System (OPFS)**
- Permanent browser storage
- Survives app restarts
- Only cleared if user clears browser data

### Storage Usage

```
PWA App Files:     ~5MB
Piper TTS Models:  ~30MB (English) or ~30MB (Spanish)
Cached Images:     ~10MB
Prayer Data:       ~1MB
──────────────────────────
Total:             ~46MB
```

## Performance

### Piper TTS

- **First Load**: 30-60 seconds (download)
- **Subsequent Loads**: Instant (cached)
- **Generation**: ~1-2 seconds per prayer
- **Quality**: ⭐⭐⭐⭐ Natural

### Web Speech API (Fallback)

- **Load Time**: Instant
- **Generation**: Instant
- **Quality**: ⭐⭐ Robotic

## API Usage

### Check if Piper is Ready

```typescript
const isPiperReady = await audioPlayer.isPiperReady();
console.log(isPiperReady ? 'Using Piper TTS' : 'Using Web Speech');
```

### Get Current Engine

```typescript
const engine = audioPlayer.getCurrentEngine();
// Returns: 'piper' | 'webspeech' | 'none'
```

### Download Voices Manually

```typescript
import * as piperTTS from './utils/piperTTS';

await piperTTS.downloadVoices('en', (progress) => {
    console.log(`${Math.round(progress.loaded / progress.total * 100)}%`);
});
```

### Check Downloaded Voices

```typescript
const voices = await piperTTS.getDownloadedVoices();
console.log(voices); // ['en_US-lessac-medium', 'en_US-hfc_male-medium']
```

## Error Handling

### Multiple Fallback Layers

```typescript
1. Try Piper TTS
   ↓ (if fails)
2. Try Web Speech API
   ↓ (if fails)
3. Silent mode (show message)
```

### Common Errors

**Download Failed**:
- Shows error message
- User can retry
- Falls back to Web Speech API

**Piper Crashes**:
- Automatically switches to Web Speech API
- Logs error for debugging
- User experience uninterrupted

**Out of Storage**:
- Download fails gracefully
- Uses Web Speech API
- User notified

## Testing

### Test Piper TTS

1. Open app in Chrome/Edge
2. Wait for download banner
3. Click "Download"
4. Wait for completion
5. Start praying
6. Check console: Should see "🎵 Using Piper TTS"

### Test Fallback

1. Open app in old browser (or disable WebAssembly)
2. Should NOT see download banner
3. Start praying
4. Check console: Should see "🔊 Using Web Speech API"

### Test Download Progress

1. Open browser DevTools → Network tab
2. Click "Download" on banner
3. Watch for ONNX model downloads
4. Progress bar should update
5. Banner should disappear when complete

## Troubleshooting

### Banner Doesn't Appear

- Check if Piper is supported: `piperTTS.isPiperSupported()`
- Check if voices already downloaded
- Check if user dismissed banner (localStorage)

### Download Fails

- Check internet connection
- Check browser console for errors
- Try clearing browser cache
- Retry download

### Audio Doesn't Play

- Check if audio is enabled in settings
- Check browser console for errors
- Try refreshing page
- Check if models are corrupted (re-download)

## Future Enhancements

1. **Voice Selection** - Let users choose specific voices
2. **Offline Download** - Download models during app install
3. **Compression** - Reduce model sizes
4. **More Languages** - Add French, Italian, Portuguese
5. **Custom Voices** - Allow voice cloning (if Piper adds support)

## Credits

- **Piper TTS**: https://github.com/rhasspy/piper
- **Piper TTS Web**: https://github.com/mintplex-labs/piper-tts-web
- **ONNX Runtime**: https://onnxruntime.ai/

## License

Piper TTS is MIT licensed and free to use.
