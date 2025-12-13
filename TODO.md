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
- [x] Persist last active mystery selection across reloads
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
- [x] Toast notifications for user interactions (audio, layout, visibility, highlighting)

## 🔄 In Progress / Needs Refinement
- [x] Remove debug console logs from production code
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

### Audio & Highlighting Enhancements
- [ ] Pause/Resume support for highlighting (track elapsed time)
- [ ] Fine-tune timing based on actual TTS performance

### Code Quality
- [ ] Clean up debug logs
- [ ] Add error boundaries for highlighting feature

## 🔬 Lightweight On-Device TTS Research (Priority)

### Problem Statement
Web Speech API works but has limitations:
- No precise timing control (litany highlighting issues)
- Voice quality varies by device/OS
- No control over pace/tone

Previous attempts with Sherpa/Piper failed due to integration issues, NOT download size.
Need to revisit with fresh debugging approach.

### Lightweight TTS Candidates to Research

**1. Piper TTS** ⭐ (Most Promising)
- **Size:** 10-30 MB per voice
- **Quality:** Good, natural-sounding
- **Timing:** Provides phoneme-level timing data
- **WebAssembly:** Yes (runs in browser)
- **Languages:** English + Spanish supported
- **GitHub:** https://github.com/rhasspy/piper
- **Status:** Actively maintained
- **Action:** Debug previous integration failure, try fresh implementation

**2. Sherpa-ONNX** (Previously Attempted)
- **Size:** 50-200 MB per model
- **Quality:** Excellent
- **Timing:** Word-level timestamps available
- **WebAssembly:** Yes
- **GitHub:** https://github.com/k2-fsa/sherpa-onnx
- **Status:** We had integration issues - models downloaded but app never used them
- **Action:** Debug why fallback to Web Speech always occurred

**3. eSpeak-NG**
- **Size:** <5 MB (tiny!)
- **Quality:** Robotic (1990s sound)
- **Timing:** Excellent control
- **WebAssembly:** Available
- **GitHub:** https://github.com/espeak-ng/espeak-ng
- **Status:** Maintained but quality may be too low
- **Action:** Test quality vs. Web Speech API

**4. Coqui TTS**
- **Size:** 50-100 MB
- **Quality:** Excellent
- **GitHub:** https://github.com/coqui-ai/TTS
- **Status:** ⚠️ Project archived (no longer maintained)
- **Action:** Skip unless no other options

**5. New/Emerging Options**
- [ ] Research latest WebAssembly TTS projects on GitHub
- [ ] Check for new lightweight neural TTS models (2024)
- [ ] Look for ONNX-based TTS with small model sizes
- [ ] Investigate WebGPU-accelerated TTS options

### Implementation Requirements

**Must Have:**
- ✅ Runs entirely on-device (browser/WebAssembly)
- ✅ Works offline after initial download
- ✅ Provides timing data (word or phoneme level)
- ✅ Supports English + Spanish
- ✅ <50 MB total download size
- ✅ Free/open source

**Nice to Have:**
- Voice customization (pace, pitch, tone)
- Multiple voice options per language
- Low battery/CPU usage on mobile
- Streaming synthesis (start playing before full generation)

### Debugging Previous Failures

**Sherpa/Piper Integration Issues to Investigate:**
1. Model loading - Did models actually initialize?
2. API calls - Were Sherpa functions being called correctly?
3. Fallback logic - Why did it always default to Web Speech?
4. Error handling - Were errors silently caught?
5. Browser compatibility - Did it work in some browsers but not others?

**Action Items:**
- [ ] Review old Sherpa integration code (if still exists)
- [ ] Check browser console for model loading errors
- [ ] Test model initialization in isolation
- [ ] Verify WebAssembly support in target browsers
- [ ] Create minimal reproduction case

### Next Steps
1. **Research Phase** (1-2 hours)
   - Survey latest lightweight TTS options on GitHub
   - Check for 2024 releases/updates
   - Read integration docs for top 3 candidates

2. **Proof of Concept** (2-3 hours)
   - Implement Piper TTS in isolated test page
   - Verify model loading and audio generation
   - Test timing data accuracy
   - Measure performance on mobile

3. **Integration** (3-4 hours)
   - Wire into existing `ttsManager.ts`
   - Add settings toggle: "Enhanced Voices (requires download)"
   - Implement graceful fallback to Web Speech
   - Test across devices

4. **Polish** (1-2 hours)
   - Add download progress indicator
   - Cache models in IndexedDB
   - Optimize for mobile performance

**Target Outcome:** Perfect litany highlighting with on-device TTS


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
- [x] User preference to save highlighting state
- [ ] Adjustable highlighting speed/timing in settings
- [ ] Different highlight colors/styles option
- [ ] Accessibility improvements (screen reader announcements)

---
**Last Updated:** December 13, 2024
