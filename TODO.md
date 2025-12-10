# Holy Rosary App - Feature To-Do List

## ✅ Completed Features

### Audio & Highlighting
- [x] Audio read-along highlighting for all prayers (gold text)
- [x] Highlighter toggle button with pulsate animation
- [x] Auto-enable highlighting from home page audio
- [x] Session-based highlighting preference (persists until app restart)
- [x] Time-based sentence synchronization
- [x] Universal highlighting across all prayer types
- [x] Last sentence/row stays highlighted until step changes
- [x] Final Hail Mary continuous highlighting (sentence offset)
- [x] **Litany highlighting - DISABLED** (see decision below)

### UI/UX Polish
- [x] Book icon states: open (white) when visible, closed (colored) when hidden
- [x] Highlighter icon pulsates orange-gold when active
- [x] Book icon and layout toggle hidden on litany page (not applicable)
- [x] Classic mode prayer titles in bright gold (#FFD700)
- [x] Reflection text centered for consistency
- [x] Fruit labels styled with bright gold (#FBBF24)
- [x] Text visibility delay reduced to 1s (from 2.5s)
- [x] Initial delay for mystery announcements

## 🔄 In Progress / Needs Refinement
- [ ] Remove debug console logs from production code
- [ ] Update HIGHLIGHTING_IMPLEMENTATION_STATUS.md with final state

## ⚠️ Litany Highlighting Decision

**Status:** DISABLED after extensive testing

**Attempts Made:**
- Option 2: TTS boundary events (browser incompatibility)
- Option 3: Conservative timing estimates
- Option 4: Sync checkpoints at transition points
- Option 5: Adaptive speeds with safety buffers

**Root Cause:** Web Speech API doesn't provide reliable timing across languages/voices
- English: ~90% accuracy achieved
- Spanish: Failed due to different TTS speeds
- Time-based estimation inherently unreliable

**Decision:** Excellence over compromise - no highlighting is better than inaccurate highlighting
- Litany text remains fully visible and readable
- Code preserved (unreachable) for future reference if better TTS APIs emerge

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

### Code Quality
- [ ] Clean up debug logs
- [ ] Add error boundaries for highlighting feature

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
