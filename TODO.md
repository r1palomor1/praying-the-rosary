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
- [x] **Refined Persistence:** "New Day" logic prioritizes today's mystery over old state
- [x] **Light Mode Highlighting:** Fixed unreadable text with yellow/black high contrast style
- [x] **Litany highlighting - DISABLED** (see decision below)

### UI/UX Polish
- [x] Book icon states: open (white) when visible, closed (colored) when hidden
- [x] Highlighter icon pulsates orange-gold when active
- [x] Book icon and layout toggle hidden on litany page (not applicable)
- [x] Classic mode prayer titles in bright gold (#FFD700) (Cinematic Mode)
- [x] **Light Mode Classic:** Standardized headers/titles to Amber-700 (#B45309) for readability
- [x] Reflection text centered for consistency
- [x] Fruit labels styled with bright gold (#FBBF24)
- [x] Text visibility delay reduced to 1s (from 2.5s)
- [x] Initial delay for mystery announcements
- [x] Toast notifications for user interactions (audio, layout, visibility, highlighting)

## 🔄 In Progress / Needs Refinement
- [x] Remove debug console logs from production code
- [x] Add error boundaries for highlighting feature
- [x] Update HIGHLIGHTING_IMPLEMENTATION_STATUS.md with final state
- [x] Fix TypeScript 'any' type violations
- [x] Clean production build verification

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

## 🎯 Priority Items for Next Session

### Progress Bar Gap Issue (Dec 19, 2024)
- [ ] **Remove gap between progress bar and cinematic content**
  - **Location:** `.progress-bar-container` in `MysteryScreen.css` (line 64-70)
  - **Current Issue:** `padding-bottom: var(--spacing-md)` creates unwanted gap below progress bar
  - **Options to consider:**
    1. Remove gap completely: `padding-bottom: 0`
    2. Make gap smaller: `padding-bottom: 4px`
    3. Remove both padding and border-bottom
  - **Decision needed:** Which option provides best visual hierarchy?
  - **DevTools finding:** Hovering over `.progress-bar-container` highlights the gap itself

## 📋 Planned Features

### User Feedback & UX Improvements

### Audio & Highlighting Enhancements
- [ ] Pause/Resume support for highlighting (track elapsed time)
- [ ] Fine-tune timing based on actual TTS performance

### Code Quality
- [x] Clean up debug logs
- [x] Add error boundaries for highlighting feature

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

## 🎨 Catholic Calendar API Integration (Future Enhancement)

**API:** [Catholic Calendar API](https://calapi.inadiutorium.cz/) - Free, no API key required

### Phase 1: Liturgical Colors (Foundation)
- [ ] **Dynamic Theme Color** - Status bar changes based on liturgical season
  - Green (Ordinary Time)
  - Violet (Advent & Lent)
  - White (Christmas, Easter, Feasts of the Lord/Mary)
  - Red (Pentecost, Passion Sunday, Martyrs)
  - Rose (Gaudete & Laetare Sundays)
  - Black (All Souls)
- [ ] **App Theme Integration** - Optional: Full app color scheme follows liturgical calendar
- [ ] **Settings Toggle** - "Follow Liturgical Colors" preference

### Phase 2: Daily Content
- [ ] **📅 Daily Saint Card** - Display on home screen
  - Saint name
  - Brief biography
  - Feast day rank (Solemnity, Feast, Memorial)
  - Tap to expand for full details
- [ ] **📖 Daily Gospel Reading** - Integration with Mass readings
  - Gospel passage of the day
  - Optional: Full Mass readings (First Reading, Psalm, Second Reading)
  - Bilingual support (EN/ES)

### Phase 3: Liturgical Intelligence
- [ ] **🙏 Suggested Mysteries** - Based on liturgical season/day
  - Example: Joyful Mysteries during Advent
  - Example: Sorrowful Mysteries during Lent
  - Example: Glorious Mysteries during Easter
  - Smart recommendations on feast days
- [ ] **🔔 Feast Day Notifications** - Optional push notifications
  - Solemnities (Holy Days of Obligation)
  - Major feast days
  - Patron saint days
  - User-selected saints

### Phase 4: Calendar Features
- [ ] **📊 Liturgical Calendar View** - Full calendar interface
  - Month view with color-coded days
  - Upcoming feasts preview
  - Tap day to see details
- [ ] **🌍 Localized Calendars** - Regional variations
  - Different countries have different patron saints
  - Local diocesan calendars
  - Language-specific feast days

### Phase 5: Advanced Integration
- [ ] **Prayer Customization** - Liturgical season-aware prayers
  - Special prayers for Advent/Lent
  - Seasonal variations of prayers
  - Feast-specific additions
- [ ] **Educational Content** - Learn about the liturgical year
  - Explanation of each season
  - History of feast days
  - Significance of liturgical colors

### Implementation Notes
- **API Endpoint**: `https://calapi.inadiutorium.cz/api/v0/{language}/calendars/default/today`
- **Caching Strategy**: Cache daily data to reduce API calls
- **Offline Support**: Graceful degradation when offline
- **Performance**: Fetch on app load, update once per day
- **Privacy**: No user data sent to API (public endpoint)

### Estimated Effort
- Phase 1 (Liturgical Colors): ~2-3 hours
- Phase 2 (Daily Content): ~4-6 hours
- Phase 3 (Liturgical Intelligence): ~3-4 hours
- Phase 4 (Calendar Features): ~6-8 hours
- Phase 5 (Advanced Integration): ~8-10 hours
- Phase 6 (AI Chatbot): ~6-8 hours

**Total**: ~29-39 hours for full implementation

### Phase 6: AI-Powered Rosary Education (Future Enhancement)
- [ ] **AI Chatbot for Mystery Explanations**
  - Replace static "Learn More" with interactive AI assistant
  - Users can ask questions about mysteries, fruits, scriptures
  - Personalized explanations adapted to user's understanding level
  - **Technology**: Google Gemini API (FREE tier - 1500 requests/day)
  - **UI**: "💬 Ask About This Mystery" button next to Learn More
  - **Features**:
    - "What does this mystery mean?"
    - "Why is the fruit 'Humility'?"
    - "Explain this scripture in simple terms"
    - "How does this relate to my daily life?"
  - **Cost**: FREE (Gemini API free tier)
  - **Implementation**: Serverless API route on Vercel
  - **No authentication needed** - just rate limiting
  - **Privacy**: Conversations not stored, no user data collected


---
**Last Updated:** December 19, 2024
