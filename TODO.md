# Holy Rosary App - Feature To-Do List

## ✅ Completed Features
- [x] Audio read-along highlighting for all prayers (gold text)
- [x] Highlighter toggle button with pulsate animation
- [x] Auto-enable highlighting from home page audio
- [x] Time-based sentence synchronization
- [x] Universal highlighting across all prayer types
- [x] Experimental litany row highlighting

## 🔄 In Progress / Needs Refinement
- [ ] Litany highlighting timing calibration (currently drifts)
- [ ] Remove debug console logs from production code

## 📋 Planned Features

### User Feedback & UX Improvements
- [ ] **Toast Notifications for Icon Toggles**
  - Add brief toast messages (1-1.5 seconds) when user clicks header icons:
    - Audio button: "Audio On" / "Audio Off"
    - Book icon: "Prayer Text Visible" / "Prayer Text Hidden"
    - Highlighter icon: "Highlighting On" / "Highlighting Off"
    - Layout toggle: "Cinematic Mode" / "Classic Mode"
  - Should be subtle, non-intrusive, and auto-dismiss
  - Consider using a toast library or custom component

### Audio & Highlighting Enhancements
- [ ] Pause/Resume support for highlighting (track elapsed time)
- [ ] Fine-tune timing based on actual TTS performance
- [ ] Consider alternative litany highlighting approach (or disable)

### Code Quality
- [ ] Clean up debug logs
- [ ] Add error boundaries for highlighting feature
- [ ] Document litany timing algorithm
- [ ] Update HIGHLIGHTING_IMPLEMENTATION_STATUS.md with final state

## 🚀 Advanced TTS Exploration (For Perfect Sync)

### Problem Statement
Current Web Speech API doesn't provide real-time feedback on what's being read, forcing us to use time-based estimation which can drift.

### Cloud TTS Solutions (Provides Word-Level Timestamps)

**Top Candidates:**
1. **Google Cloud Text-to-Speech** ⭐ (Recommended)
   - Provides word-level timestamps with exact timing
   - Excellent Spanish voices (critical for our app)
   - Returns: Audio file + timing metadata
   - Cost: ~$4 per 1M characters (~$0.004 per prayer)
   - [Documentation](https://cloud.google.com/text-to-speech)

2. **Amazon Polly**
   - Speech marks feature (word/sentence boundaries)
   - Multiple neural voices
   - Similar pricing to Google
   - [Documentation](https://aws.amazon.com/polly/)

3. **Microsoft Azure Speech**
   - Word boundary events
   - Neural voice options
   - Similar pricing structure
   - [Documentation](https://azure.microsoft.com/en-us/services/cognitive-services/text-to-speech/)

### Implementation Approach
```
1. User clicks audio
2. Send prayer text to cloud TTS API
3. Receive back:
   - Audio file (MP3/WAV)
   - Timing data: [{word: "Our", start: 0.0s, end: 0.2s}, ...]
4. Play audio using <audio> element
5. Track currentTime and highlight with PERFECT sync
```

### Pros & Cons

**Advantages:**
- ✅ Perfect word/sentence-level synchronization
- ✅ High quality, consistent voices across devices
- ✅ No browser compatibility issues
- ✅ Professional-grade Spanish pronunciation
- ✅ Can cache generated audio for offline use

**Challenges:**
- ❌ Requires internet connection (unless cached)
- ❌ Ongoing costs (small but not free)
- ❌ Initial generation delay (~1-2 seconds)
- ❌ Privacy consideration (prayers sent to cloud)
- ❌ More complex implementation

### Potential Implementation Strategy
- **Phase 1:** Implement as optional premium feature
- **Phase 2:** Keep Web Speech API as free fallback
- **Phase 3:** Cache generated audio locally for offline use
- **Phase 4:** Consider pre-generating all prayers and bundling with app

### Next Steps
- [ ] Research Google Cloud TTS pricing in detail
- [ ] Create proof-of-concept with single prayer
- [ ] Compare voice quality vs Web Speech API
- [ ] Evaluate caching strategy for offline support
- [ ] Consider user preference: "High Quality Audio" toggle

## 💡 Future Considerations
- [ ] User preference to save highlighting state
- [ ] Adjustable highlighting speed/timing in settings
- [ ] Different highlight colors/styles option
- [ ] Accessibility improvements (screen reader announcements)

---
**Last Updated:** December 9, 2024
