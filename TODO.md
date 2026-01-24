# Holy Rosary App - Feature To-Do List

---

## 🚨 CRITICAL SAFETY PROTOCOL 🚨

**BEFORE switching to a new agent (when current model hits quota):**

```bash
# USER must manually run these commands in terminal:
git add .
git commit -m "WIP: [describe current state]"
git push
```

**Why?** Prevents data loss from rogue agent actions (like `git checkout .`)

**Lesson Learned (Dec 21, 2024):** Lost 3+ hours of refactor work because uncommitted changes were reverted by next agent. **NEVER let an agent handle final commits when switching models!**

**Rule:** Commit frequently during work, and **ALWAYS commit manually before ending a session.**

---

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

## ✅ Completed Features (Jan 23, 2026 Session)

### Litany Progressive Reveal & Scrolling
- [x] **Litany Progressive Fade-In** ✅ COMPLETED (Commit: 69bb370)
  - **Implemented:** Rows fade in one-at-a-time as audio plays
  - **Solution:** Track revealed rows in state array, trigger on audio segment start
  - **Scrolling:** Smooth centered scroll using `scrollIntoView({ behavior: 'smooth', block: 'center' })`
  - **Resume Support:** Tracks last played row for seamless resume from pause
  - **Files Modified:**
    - `src/components/MysteryScreen.tsx` - Progressive reveal logic + scroll function
    - `src/components/ClassicMysteryView.tsx` - Render revealed rows with fade-in
    - `src/components/CinematicMysteryView.tsx` - Render revealed rows with fade-in
    - `src/components/SacredPrayersScreen.tsx` - Added missing `revealedRows` prop
  - **Result:** Cinematic reveal experience that guides user's attention during litany prayer

- [x] **Debug Panel UI Polish** ✅ COMPLETED (Commit: ef28096)
  - **Updated:** Changed debug panel button from text to Bug icon
  - **Repositioned:** Moved from bottom-right to top-right (below settings icon)
  - **Styling:** Matched opacity adjuster style (transparent background, drop-shadow)
  - **Files Modified:**
    - `src/components/DebugPanel.tsx` - Changed button to icon with aria-label
    - `src/components/DebugPanel.css` - Updated positioning and removed outline
  - **Result:** Cleaner UI with consistent icon-based controls

### API Resilience & Fallback System
- [x] **Romcal API Fallback System - Unified Approach** ✅ COMPLETED (Commit: 52251ec)
  - **Implemented:** Date-aware fallback when romcal API fails
  - **Solution:** Created `getFallbackLiturgicalData(date, language)` in liturgicalCalendar.ts
  - **Season Detection:**
    - Dec 1-24: "Advent" + Violet (#8B5CF6)
    - Dec 25-Jan 6: "Christmas" + White (#F3F4F6)
    - Lent (Ash Wed to Easter -1): "Lent" + Violet (#8B5CF6)
    - Easter (Easter to +49 days): "Easter" + White (#F3F4F6)
    - Default: "Ordinary Time" + Green (#10B981)
  - **Easter Calculation:** Meeus/Jones/Butcher algorithm
  - **Files Modified:**
    - `src/utils/liturgicalCalendar.ts` - Added fallback generator + Easter calc
    - `src/components/PrayerSelectionScreen.tsx` - Conditional render with fallback
    - `src/components/DailyReadingsScreen.tsx` - Simplified fetch with fallback
  - **Result:** App works offline with season-appropriate colors

- [x] **Cross-API Fallback for Feast Names** ✅ COMPLETED (Commit: c97e384)
  - **Implemented:** Multi-source fallback chain for liturgical titles
  - **Prayer Selection Enhancement:**
    - Romcal returns generic weekday → Fetches USCCB title
    - Reuses existing `/api/readings` endpoint
  - **Daily Readings Title Fallback:**
    - USCCB title → Vatican title (already fetched) → Generic weekday
    - No additional API calls needed
  - **Files Modified:**
    - `src/components/PrayerSelectionScreen.tsx` - Added USCCB fetch on fallback
    - `src/components/DailyReadingsScreen.tsx` - Uses Vatican title if USCCB missing
  - **Result:** Real feast names survive single API failure

- [x] **HTML Entity Cleanup for TTS** ✅ COMPLETED (Commit: 0c0c1a4)
  - **Issue:** Spanish TTS reading "nbsp" instead of space
  - **Root Cause:** Audio text only removed HTML tags, not entities
  - **Solution:** Added entity replacement: `&nbsp;`, `&amp;`, `&lt;`, `&gt;`
  - **Files Modified:**
    - `src/components/DailyReadingsScreen.tsx` - Both handlePlayContent and handlePlayAll
  - **Result:** Clean audio playback without entity artifacts

- [x] **Liturgical Color Sorting Fix (Romcal v3 Upgrade)** ✅ COMPLETED
  - **Issue:** Romcal v1.3 returned multiple events, picked first (often incorrect Green)
  - **Root Cause:** No rank/color prioritization in API
  - **Solution:** Upgraded to romcal v3 which handles priority internally
  - **Files Modified:**
    - `/api/liturgy.js` - Now uses romcal v3 with automatic priority handling
  - **Result:** Correct liturgical colors (Red/White feasts prioritized over Green)
  - **Verification:** Line 70 comment: "The first item is always the primary celebration (romcal v3 handles priority)"

### Documentation & Process Improvements
- [x] **Code Reuse Verification Protocol** - Added to .cursorrules
  - Mandatory check for existing implementations before coding
  - Prevents duplicate logic and wasted resources
  
- [x] **Git Workflow Documentation** - Updated in .cursorrules
  - Clarified mandatory sequence: build → commit → build → push
  - Ensures version.json accuracy

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

## 🐛 Daily Readings Issues (Jan 18-19, 2026)

### ✅ Resolved Issues
- [x] **Version Date Showing Wrong Date** ✅ FIXED (Jan 19, 2026)
  - **Root Cause:** `new Date("YYYY-MM-DD")` parsed as UTC, causing timezone shift to previous day in Western timezones
  - **Solution:** Updated `src/utils/version.ts` to parse date string directly instead of using Date object
  - **Fix:** String splitting (`"2026-01-19".split('-')`) avoids timezone conversion
  - **Commit:** 8c204c3 - "fix(frontend): Correct timezone calculation for commit date"
  - **Status:** Deployed and verified working

- [x] **Lectionary Label Not Centered** ✅ FIXED
  - Changed to space-between layout
  - Added .lectionary-text class with text-align: center
  - **Status:** Verified working on device

- [x] **Responsorial Psalm Highlighting** ✅ DECISION: NOT FEASIBLE
  - **Issue:** R/ and R. responses need <strong> tags from API to highlight correctly
  - **Root Cause:** USCCB API does not include <strong> tags in responsorial psalm text
  - **Attempted Solutions:**
    - Regex fallback: `^(R[.\/]\s*(?:R[.\/]\s*)?)(.*)` - too unreliable
    - Manual parsing: Would require maintaining psalm response patterns
  - **Decision:** Removed highlighting logic for responsorial responses
  - **Rationale:** Better to have no highlighting than incorrect highlighting (Excellence over compromise)
  - **Status:** Closed - will not implement unless API provides proper markup

### Active Issues
- [x] **Words of the Pope Card** ✅ COMPLETED (Jan 18-19, 2026)
  - Implemented Vatican News integration via serverless API
  - Created `/api/vatican-reflection.js` proxy to bypass CORS
  - Added source selector dropdown (USCCB vs Vatican)
  - Both sources now display "Words of the Popes" reflections
  - **Status:** Deployed and working

### Liturgical Integration
- [x] **Liturgical Calendar Integration** ✅ COMPLETED (Jan 19-20, 2026)
  - **Strategy:** Backend-only implementation (Zero-Config Client)
  - **Logic:** Used `romcal` library in Vercel Serverless Function (`api/liturgy.js`)
  - **Frontend:** Light card component fetches JSON from proxy
  - **Styling:**
    - Premium glass morphism
    - Dynamic header coloring (match liturgical color)
    - Responsive typesetting (Cinzel font)
  - **Status:** Deployed and working

## 📋 OUTSTANDING ITEMS (Verified Jan 23, 2026)

### ✅ Completed (Needs Checkbox Update)
- [x] **Debug Panel** ✅ ALREADY IMPLEMENTED
  - Location: `src/components/DebugPanel.tsx`
  - Active in: `src/App.tsx` line 274
  - Features: Console intercept, copy logs, clear, toggle visibility
  - Status: WORKING (was marked incomplete in old TODO)

---

### 📱 Android APK Optimization (Not Started)
**Priority:** Medium | **Time:** 3-4 hours total

- [ ] **Create Release Build** (Step 1)
  - Current: Debug APK = 258 MB
  - Target: Release APK = ~180 MB (30% reduction)
  - Commands documented below in Android section
  
- [ ] **Convert to App Bundle (.aab)** (Step 2)
  - Current: 180 MB APK
  - Target: 115 MB bundle (36% reduction)
  - Required for Google Play optimization
  
- [ ] **Optimize Images** (Step 3)
  - Current: ~32 MB
  - Target: ~17 MB (50% compression)
  - Tools: TinyPNG, Squoosh, imagemin

---

### 🎨 UI/UX Refinements (Not Started)
**Priority:** Low | **Time:** 1-2 hours

- [ ] **Daily Readings Text Formatting**
  - Improve Responsorial Psalm whitespace/newlines
  - Ensure 'R.' responses are visually distinct
  
- [ ] **Highlighting Enhancements**
  - Pause/Resume support (track elapsed time)
  - Fine-tune timing based on TTS performance
  - Adjustable speed/timing in settings
  - Different highlight colors/styles option

---

### 🔬 TTS Research & Implementation (Not Started)
**Priority:** Low | **Time:** 8-12 hours (research + POC)

**Problem:** Web Speech API lacks precise timing for litany highlighting

**Research Items:**
- [ ] **Debug Sherpa-ONNX Integration** (files exist but unused)
  - Models present: `android/app/src/main/assets/public/sherpa/*.onnx`
  - Root cause: Why fallback to Web Speech always occurred?
  
- [ ] **Piper TTS POC** (Most promising: 10-30 MB, phoneme timing)
- [ ] **eSpeak-NG Evaluation** (<5 MB, robotic but excellent timing)
- [ ] **New/Emerging WebAssembly TTS** (2024+ models, WebGPU, ONNX)
- [ ] **Google Cloud TTS POC** (Alternative: research pricing, caching strategy)

---

### 🤖 AI-Powered Spiritual Companion (Not Started)
**Priority:** Vision | **Time:** 30-40 hours | **Cost:** $0 (all free APIs)

**Phase 1: Dynamic Mystery Explanations** (8-12 hours)
- [ ] Replace static "Learn More" with AI chatbot
- [ ] Mystery Q&A feature
- [ ] Tech: Gemini API (1,500 free/day) + Groq fallback

**Phase 2: Liturgical Integration** (6-8 hours)
- [ ] MCP server for Catholic data
- [ ] Saint of the day with AI insights
- [ ] Today's readings with context

**Phase 3: Enhanced Features** (8-10 hours)
- [ ] Podcast-style mystery dialogues
- [ ] Bible verse search
- [ ] Smart suggestions

**Phase 4: On-Device Mode** (6-8 hours)
- [ ] Tiny Llama integration (483 MB)
- [ ] Offline AI fallback

**Phase 5: Complete Companion** (8-10 hours)
- [ ] Spiritual journal
- [ ] Progress tracking integration
- [ ] Vatican document access
- [ ] Catechism lookup

---

## 🎯 Priority Items for Next Session

### 🐛 Enhanced Progress Tab Issues (Jan 1-2, 2026) ✅ COMPLETED
- [x] **Current Month Text Overflow** ✅
  - Fixed month name overflowing on mobile
  - Added responsive font sizes and ellipsis
  - Tablet breakpoint (641px-1024px) with reduced sizes
  
- [x] **MTD Goal Date Display Bug** ✅
  - Fixed "by January 1" → "by January 31"
  - Now shows correct last day of month
  - Location: EnhancedStatsCards.tsx line 169
  
- [x] **Sacred Prayers Modal Scroll Issue** ✅
  - Added overflow-y: auto to modal content
  - Sacred modal now scrolls properly
  - Matches Rosary progress behavior
  
- [x] **Sacred Modal Layout Issues** ✅
  - Increased modal width from 512px to 600px
  - Fixed calendar badges to be circular (added width: 32px)
  - Fixed card overlap and text wrapping
  - Added responsive padding adjustments
  
- [x] **Goal Progress Calculation Errors** ✅
  - Fixed Year Progress: Now divides by 365/366 instead of elapsed days
  - Fixed Month Progress: Now divides by 28-31 instead of current day
  - YTD Current Streak: Only counts within current year (not crossing into previous year)
  - MTD Streaks: Fixed timezone issues with string comparison
  - Day Counting: Jan 3 to Dec 31 = 363 days (was 364)

### 🎯 Custom Start Date Tracking (Jan 2, 2026) ✅ COMPLETED

- [x] **Progress Settings System**
  - Created progressSettings.ts utility
  - Stores Rosary and Sacred Prayers start dates separately
  - Calculates adjusted YTD/MTD goals based on start date
  - No penalty for starting mid-year!
  
- [x] **Settings UI**
  - Added "Progress Tracking" section to Settings
  - Date inputs for both prayer types
  - Auto-sync: Rosary date auto-fills Sacred date
  - Apply button: Set both dates before recalculating
  - Clear buttons to reset individual dates
  - Bilingual help text (EN/ES)
  
- [x] **Goal Calculations**
  - YTD Goal: Days from start date to Dec 31
  - MTD Goal: Days from start date to end of month
  - Progress %: Completions / Adjusted Goal
  - What-if scenarios: Change dates anytime
  
- [x] **Date Formatting Consistency**
  - All dates now use MM/DD/YYYY format
  - Settings footer shows date AND time
  - Version modal uses consistent formatting
  - Abbreviated month names: "Jan 2026" instead of "January"

### 📱 Responsive Layout Fixes (Jan 2, 2026) ✅ COMPLETED
- [x] **Tablet Breakpoint (641px-1024px)**
  - Fixed Rosary progress overflow on tablet
  - Reduced card padding from 1.5rem to 0.75rem horizontal
  - Smaller fonts for titles, numbers, and labels
  - Tighter streak box spacing
  
- [x] **Mobile Optimizations**
  - Month name responsive sizing
  - Year selector compact on mobile
  - Sacred modal matches Rosary screen
  - All cards stack properly on small screens

### ✨ Final Polish & Enhancements (Jan 15, 2026) ✅ COMPLETED
- [x] **Litany Display Structure**
  - Refactored text rendering for plain styling (no amber overlays)
  - Implemented smart section dividers (gold lines) based on empty lines in data
  - Added duplicate call/response lines to data for full traditional accuracy
  
- [x] **Litany Indentation & Formatting**
  - Split Kyrie/Trinity lines into distinct Call and Response
  - Indented Responses with subtle italic styling
  - **Highlighting:** "Pray for us" phrases now inline-highlighted in gold(#FBBF24) within the single-line layout
  
- [x] **Audio Navigation Controls**
  - Added new Play/Stop button centered in bottom navigation
  - Changed icon from Pause to Square (Stop) to reflect reset behavior
  - Optimized margins for Desktop vs Mobile to prevent accidental clicks
  - visual size consistency (24px) with existing icons
  
- [x] **Bead Counter Positioning**
  - Adjusted cinematic bead counter to bottom 30%
  - Ensures visibility on Fold devices and tablet layouts
  
- [x] **Version Tracking**
  - Added automated version timestamp generation
  - Displayed discreet "Updated: MM/DD/YY HH:MM AM/PM" on Home Screen
  - Helps instant verification of deployed updates without digging into settings

### 🚨 CRITICAL: Reconstruct Lost Refactor Work (Dec 21, 2024)
- [x] **Rebuild Classic/Cinematic Layout Separation** ✅ DECISION: NOT NECESSARY
  - Current `MysteryScreen.tsx` implementation is stable and functional
  - Splitting components adds complexity without immediate benefit
  - Closing this reconstruction task to focus on new features

### Progress Bar Gap Issue (Dec 19, 2024)
- [x] **Remove gap between progress bar and cinematic content** ✅ DECISION: NOT NECESSARY
  - Visual hierarchy is acceptable as is
  - Minor cosmetic tweak deprioritized

## 📱 Android APK Optimization (When Ready for Mobile)

### APK Size Reduction
- [ ] **Create Release Build** (Priority: High)
  - **Current:** Debug build = 258 MB
  - **Target:** Release build = ~180 MB (30% smaller)
  - **Commands:**
    ```bash
    npm run build
    npx cap sync android
    cd android
    ./gradlew assembleRelease
    ```
  - **Output:** `android/app/build/outputs/apk/release/app-release-unsigned.apk`
  - **Savings:** ~78 MB (removes debug symbols)
  - **Note:** Needs signing before Google Play upload

- [ ] **Convert to App Bundle (.aab)** (Priority: Medium)
  - **Current:** APK = 180 MB (after release build)
  - **Target:** App Bundle = ~115 MB (36% smaller)
  - **Commands:**
    ```bash
    cd android
    ./gradlew bundleRelease
    ```
  - **Output:** `android/app/build/outputs/bundle/release/app-release.aab`
  - **Savings:** ~65 MB (Google Play optimizes per device)
  - **Benefit:** Users download only what their device needs

- [ ] **Optimize Images** (Priority: Low)
  - **Current:** Images = ~32 MB
  - **Target:** Compressed = ~17 MB (50% smaller)
  - **Tools:** TinyPNG, Squoosh, or imagemin
  - **Settings:**
    - WebP: Quality 80-85
    - JPG: Quality 75-80 with progressive encoding
  - **Savings:** ~15 MB
  - **Impact:** Only 6% of total APK size

### Combined Impact
| Step | Size | Savings |
|------|------|---------|
| Debug Build (current) | 258 MB | - |
| → Release Build | 180 MB | -78 MB (30%) |
| → App Bundle | 115 MB | -65 MB (36%) |
| → Image Compression | 100 MB | -15 MB (13%) |
| **TOTAL SAVINGS** | **100 MB** | **-158 MB (61%)** |

**Recommended Order:**
1. Release build first (biggest win)
2. App Bundle second (required for Google Play)
3. Image compression last (nice to have)

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

## 🚫 Blocked / Deferred Features

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


## 🤖 AI-Powered Spiritual Companion (THE VISION - EXCELLENCE!)

**Mission:** Transform the Rosary app into a comprehensive Catholic spiritual companion using AI and free public data sources.

**Motto:** EXCELLENCE - We don't settle for aluminum cans when we can find gold nuggets!

---

### 🎯 The Complete Vision

**Current State:** Beautiful Rosary app with static content
**Target State:** AI-powered spiritual guide with real-time Catholic data

**What Users Will Experience:**
- Dynamic, personalized explanations of mysteries
- Chatbot that answers spiritual questions
- Daily liturgical calendar integration
- Saint of the day with AI-generated insights
- Today's Mass readings with contextual explanations
- Podcast-style dialogues about mysteries
- Bible verse search and cross-references
- Vatican document access
- Catechism lookup by topic

---

### 📊 Technology Stack (All FREE!)

#### **AI Models**
1. **Google Gemini API** (Primary)
   - Free tier: 1,500 requests/day
   - Best quality responses
   - No credit card required
   - Get key: https://aistudio.google.com/app/apikey

2. **Groq API** (Backup)
   - Free tier: 14,400 requests/day
   - Ultra-fast responses (0.5 sec)
   - Fallback when Gemini quota exceeded
   - Get key: https://console.groq.com

3. **Tiny Llama 1.1B** (Optional On-Device)
   - Size: 483 MB
   - 100% offline, 100% private
   - User downloads if they want offline mode
   - GitHub: llama-cpp-wasm

#### **MCP (Model Context Protocol)**
- **Catholic Liturgical Calendar MCP Server**
  - GitHub: Available now (search: "Catholic MCP server")
  - FREE, no authentication
  - Data: 1970-9999 (includes all future years!)
  - Provides: Liturgical colors, seasons, feast days, national/diocesan calendars

#### **Free Catholic Data APIs**
1. **Church Calendar API** - https://publicapi.dev
   - Saints' feast days
   - Religious events
   - Multiple languages

2. **Liturgy.day REST API** - https://liturgy.day
   - Daily Mass readings
   - Gospel, Psalms, First/Second readings
   - Bilingual support

3. **Inadiutorium Calendar API** - https://calapi.inadiutorium.cz
   - Roman Catholic liturgical calendar
   - Post-Vatican II reforms
   - JSON API, no auth required

4. **Bible APIs** (Multiple options)
   - Bible Gateway API
   - ESV API
   - Multiple translations
   - Search by verse, keyword

5. **Vatican API** (Public)
   - Papal documents
   - Encyclicals
   - Messages and homilies

---

### 🚀 Phased Implementation Plan

#### **PHASE 1: Foundation (Week 1-2) - Start Simple**
**Goal:** Get basic AI working without MCP

**Features:**
- [ ] Dynamic "Learn More" (replaces static text)
  - AI generates fresh explanations each time
  - "Regenerate" button for different perspectives
  - Uses mystery data as context
  
- [ ] Basic Mystery Chatbot
  - "Ask a Question" button on mystery screen
  - AI knows current mystery context
  - Simple Q&A interface

- [ ] Dual-API Setup
  - Gemini as primary
  - Groq as fallback
  - Graceful degradation to static text if both fail

**Tech Stack:**
- Vercel serverless functions (FREE)
- Gemini + Groq APIs (FREE)
- Simple context passing (no MCP yet)

**Estimated Time:** 8-12 hours
**Cost:** $0

---

#### **PHASE 2: MCP Integration (Week 3-4) - Add Real-Time Data**
**Goal:** Connect to Catholic data sources via MCP

**Features:**
- [ ] Liturgical Calendar Integration
  - Display today's liturgical color in app theme
  - Show current season (Advent, Lent, etc.)
  - Highlight feast days
  - AI knows liturgical context for better answers

- [ ] Saint of the Day
  - Card on home screen
  - AI-generated biography summary
  - Tap to expand for full details
  - "Ask about this saint" chatbot

- [ ] Daily Mass Readings
  - Today's Gospel on home screen
  - Optional: Full readings (First, Psalm, Second)
  - AI can reference in mystery explanations
  - "How does today's Gospel relate to this mystery?"

**Tech Stack:**
- Catholic Liturgical Calendar MCP Server
- Church Calendar API
- Liturgy.day API
- MCP client in Vercel serverless

**Estimated Time:** 10-15 hours
**Cost:** $0

---

#### **PHASE 3: Enhanced Features (Week 5-6) - Polish & Power**
**Goal:** Add advanced AI features

**Features:**
- [ ] Podcast Mode
  - Two-voice dialogue about mysteries
  - "Host" and "Expert" personas
  - 2-3 minute conversations
  - Generated on-demand
  - Optional: TTS to create actual audio

- [ ] Bible Search
  - "Find verses about humility"
  - Cross-references to current mystery
  - Multiple translations
  - AI explains context

- [ ] Vatican Documents
  - Search papal encyclicals
  - Find relevant quotes
  - AI summarizes in simple terms

- [ ] Smart Suggestions
  - "Based on today's feast, try these mysteries"
  - "This saint is connected to this mystery"
  - Liturgical season-aware recommendations

**Tech Stack:**
- Bible APIs
- Vatican API
- Enhanced MCP context
- TTS for podcast audio (optional)

**Estimated Time:** 12-18 hours
**Cost:** $0

---

#### **PHASE 4: On-Device Option (Week 7-8) - Privacy & Offline**
**Goal:** Add 100% private, offline AI mode

**Features:**
- [ ] Tiny Llama Integration
  - User downloads 483 MB model (one-time)
  - 100% offline mode
  - 100% private (never leaves device)
  - Lower quality but still helpful

- [ ] Settings Toggle
  - "AI Mode: Cloud (Best Quality)" ← Default
  - "AI Mode: On-Device (Privacy + Offline)"
  - Transparent about trade-offs

- [ ] Hybrid Mode
  - Try on-device first (instant, private)
  - Fall back to cloud if complex question
  - Best of both worlds

**Tech Stack:**
- llama-cpp-wasm
- Tiny Llama 1.1B GGUF
- IndexedDB for model caching
- Web Workers for background processing

**Estimated Time:** 15-20 hours
**Cost:** $0

---

#### **PHASE 5: Full Spiritual Companion (Week 9-10) - The Summit!**
**Goal:** Complete the vision

**Features:**
- [ ] Catechism Lookup
  - Search by topic
  - AI explains in simple terms
  - Cross-references to mysteries

- [ ] Prayer Journal (AI-Enhanced)
  - User writes reflections
  - AI suggests related mysteries
  - AI finds relevant scripture
  - Private, never sent to cloud

- [ ] Liturgical Calendar View
  - Full month view
  - Color-coded days
  - Tap for feast details
  - AI explains significance

- [ ] Educational Content
  - "Explain the liturgical year"
  - "History of this feast day"
  - "Why this liturgical color?"
  - Deep theological insights

**Tech Stack:**
- All previous APIs integrated
- Advanced MCP orchestration
- Local storage for journal
- Calendar UI component

**Estimated Time:** 20-25 hours
**Cost:** $0

---

### 💰 Total Cost Analysis

| Component | Free Tier | Expected Usage | Cost |
|-----------|-----------|----------------|------|
| Gemini API | 1,500/day | ~300/day | $0 |
| Groq API | 14,400/day | ~50/day (backup) | $0 |
| Vercel Serverless | 100GB-hrs/mo | ~5GB-hrs/mo | $0 |
| All Catholic APIs | Unlimited | N/A | $0 |
| MCP Server | Open source | N/A | $0 |
| Tiny Llama | One-time download | 483 MB | $0 |
| **TOTAL** | | | **$0** |

**Even with 10,000 users:** Still $0!

---

### 🎯 Success Metrics

**Phase 1 Success:**
- [ ] Users prefer AI explanations over static text
- [ ] "Regenerate" button gets used
- [ ] Chatbot answers 90%+ of questions correctly

**Phase 2 Success:**
- [ ] Liturgical calendar data displays correctly
- [ ] Saint of the day loads daily
- [ ] AI references today's readings in answers

**Phase 3 Success:**
- [ ] Podcast mode gets positive feedback
- [ ] Bible search finds relevant verses
- [ ] Smart suggestions are helpful

**Phase 4 Success:**
- [ ] On-device mode works offline
- [ ] Model loads in <10 seconds
- [ ] Quality is "good enough" for offline use

**Phase 5 Success:**
- [ ] App feels like a complete spiritual companion
- [ ] Users spend more time in the app
- [ ] 5-star reviews mention AI features

---

### 🚧 Implementation Notes

**Architecture Pattern:**
```
User Question
    ↓
App (React)
    ↓
Vercel Serverless Function
    ↓
MCP Client (orchestrates data)
    ├─→ Catholic Calendar MCP
    ├─→ Liturgy.day API
    ├─→ Bible API
    └─→ Vatican API
    ↓
Gemini AI (with full context)
    ↓
Intelligent Answer
    ↓
User
```

**Caching Strategy:**
- Cache liturgical calendar data (updates daily)
- Cache saint data (updates daily)
- Cache Bible verses (static)
- Don't cache AI responses (always fresh)

**Error Handling:**
- Gemini fails → Try Groq
- Groq fails → Show static content
- API timeout → Show cached data
- No internet → On-device mode (if downloaded)

**Privacy:**
- No user accounts required
- No tracking/analytics for AI features
- Questions sent to APIs are anonymous
- On-device mode = 100% private
- Clear privacy policy in settings

---

### 📚 Resources & Links

**AI APIs:**
- Gemini: https://ai.google.dev/gemini-api/docs
- Groq: https://console.groq.com/docs
- Tiny Llama: https://github.com/janhq/llama-cpp-wasm

**Catholic Data:**
- MCP Server: Search GitHub for "Catholic MCP"
- Liturgy.day: https://liturgy.day/api
- Church Calendar: https://publicapi.dev/church-calendar-api
- Inadiutorium: https://calapi.inadiutorium.cz

**MCP Resources:**
- MCP Spec: https://modelcontextprotocol.io
- MCP Examples: https://github.com/modelcontextprotocol

**Tutorials:**
- WebLLM: https://webllm.mlc.ai
- Vercel AI SDK: https://sdk.vercel.ai/docs

---

### 🎓 Learning Path

**For You (Developer):**
1. Week 1: Learn Gemini API basics
2. Week 2: Understand MCP concepts
3. Week 3: Practice with Catholic APIs
4. Week 4: Experiment with Tiny Llama
5. Week 5+: Build and iterate!

**For Users:**
- Gradual rollout (beta testing)
- Tutorial on first use
- "What's New" announcements
- Feedback collection

---

### ⚠️ Potential Challenges

**Technical:**
- MCP learning curve (new technology)
- API rate limits (mitigated by dual-API)
- On-device model size (483 MB - optional)
- WebAssembly browser support (good in 2025)

**Content:**
- AI hallucinations (mitigate with good prompts)
- Theological accuracy (test extensively)
- Language nuances (English + Spanish)

**Solutions:**
- Start simple (Phase 1)
- Test each phase thoroughly
- Get Catholic theology review
- Iterate based on feedback

---

### 🏆 The Vision Statement

**"From a beautiful Rosary app to a comprehensive AI-powered Catholic spiritual companion that helps users deepen their faith through intelligent, personalized guidance - all for FREE, respecting privacy, and built with EXCELLENCE."**

---

**Next Steps:**
1. Get API keys (Gemini + Groq)
2. Start Phase 1 implementation
3. Test with real mysteries
4. Iterate and improve
5. Climb to the summit! 🏔️

**Ready when you are, hermano!** 🚀🙏

---
**Last Updated:** December 23, 2025


## Daily Readings Enhancements
- [ ] Refine Daily Readings text formatting: Improve whitespace/newlines for Responsorial Psalm and Alleluia (ensure 'R.' and verses are visually distinct).

##  Current Status / Hand-off (Jan 23, 2026)

### ✅ All High-Priority Items Complete

**Liturgical Calendar:**
- **Library:** Romcal v3 (stable production version)
- **Status:** ✅ WORKING - Automatic priority handling
- **Color Sorting:** ✅ FIXED - Red/White feasts correctly prioritized over Green
- **Fallback System:** ✅ IMPLEMENTED - Date-aware offline support with Easter calculation

**API Resilience:**
- **Romcal Fallback:** ✅ Season-aware data when API down
- **Cross-API Titles:** ✅ USCCB → Vatican → Generic fallback chain
- **TTS Audio:** ✅ HTML entities cleaned (no more "nbsp" artifacts)

**Daily Readings:**
- **Status:** ✅ Fully functional
- **Theme Colors:** ✅ Correct liturgical colors displayed
- **Audio Playback:** ✅ Clean TTS without entity artifacts

**Recent Changes (Jan 23, 2026):**
- Verified romcal v3 priority handling working correctly
- Date-aware fallback with Easter calculation (Commit 52251ec)
- Multi-source feast name fallback (Commit c97e384)
- HTML entity cleanup for Spanish TTS (Commit 0c0c1a4)

### 🎯 Ready for Next Phase
All critical bugs resolved. App is stable and production-ready.
