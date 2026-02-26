# AI Companion - Product Requirements Document (PRD)

**Project:** Sacred Rosary - AI-Powered Spiritual Companion  
**Version:** 2.0 (Revised)  
**Date:** February 25, 2026  
**Owner:** Development Team  
**Status:** Planning Phase - Ready for Approval

---

## 1. Executive Summary

### Vision
Transform the Sacred Rosary app into a comprehensive AI-powered Catholic spiritual companion that provides personalized explanations, liturgical insights, scripture intelligence, and spiritual growth tools—all using free APIs while maintaining 100% backward compatibility.

### Core Principle
**AI is 100% optional enhancement.** All existing features remain fully functional if AI is unavailable. Users never experience degraded core functionality.

### Success Criteria
- Zero cost to operate (free tier APIs only)
- No feature loss if AI unavailable
- Enhanced user engagement and session duration
- Positive user feedback on AI quality (>80% thumbs up)
- Seamless integration with existing UI/UX
- 100% theological accuracy (expert reviewed)

---

## 2. Goals & Objectives

### Primary Goals
1. **Enhance User Experience** - Provide dynamic, personalized spiritual content
2. **Increase Engagement** - Keep users in-app longer with interactive features
3. **Maintain Excellence** - AI responses must be theologically accurate and helpful
4. **Zero Cost Operation** - Leverage free APIs with proper rate limiting
5. **Privacy First** - No user tracking, anonymous API calls, optional offline mode

### Non-Goals
- Replacing existing static content entirely
- Building AI features that require payment
- Collecting user data for AI training
- Creating dependency on AI for core functionality
- Community/social features (out of scope for now)

---

## 3. Technical Architecture

### Technology Stack

#### AI Models
| Provider | Model | Quota | Use Case | Priority |
|----------|-------|-------|----------|----------|
| **HuggingFace** | Llama 3.1 8B | 1,000+ req/day | Primary chat/explanations | 1 |
| **HuggingFace** | Mistral 7B | 1,000+ req/day | Fallback chat | 2 |
| **HuggingFace** | all-MiniLM-L6-v2 | 1,000+ req/day | Semantic search (Bible/Catechism) | 3 |
| **Tiny Llama 1.1B** | Local | Unlimited | Optional offline mode | 4 |

#### APIs & Data Sources
| Source | Purpose | Auth | Cost |
|--------|---------|------|------|
| HuggingFace Inference API | AI chat, embeddings, semantic search | API Token | Free |
| Vercel Serverless | Backend proxy, rate limiting | None | Free |
| Bible API | Scripture text | API Key | Free |
| Saint API | Liturgical data | None | Free |
| Existing rosary data | Context for AI | None | N/A |

#### Architecture Pattern
```
User Request
    ↓
React Frontend
    ↓
Vercel Serverless Function (/api/ai-chat.js)
    ├─→ Input Sanitization (prevent injection)
    ├─→ Rate Limiter (user-level + global)
    ├─→ Context Builder (mystery/liturgy/scripture data)
    ├─→ HuggingFace Inference API
    │   ├─→ Llama 3.1 8B (primary)
    │   └─→ Mistral 7B (fallback)
    └─→ HuggingFace Embeddings API (for semantic search)
    ↓
AI Response
    ↓
Response Validation (format, safety)
    ↓
Frontend (progressive enhancement)
    ├─→ Success: Show AI content
    └─→ Failure: Show static fallback
```

### Progressive Enhancement Pattern
```typescript
// Core pattern for all AI features
async function getAIEnhancedContent(context: Context) {
  try {
    const response = await callAIAPI(context);
    if (response.ok && validateResponse(response)) {
      return <AIContent data={response} />;
    }
  } catch (error) {
    logError(error); // No PII
  }
  // Always fallback to existing behavior
  return <StaticContent />;
}
```

### Security Measures
**Input Sanitization:**
- Strip HTML/script tags from user input
- Limit input length (2000 chars)
- Block common injection patterns
- Rate limit per user (20 req/hr)

**Response Validation:**
- Check AI response format
- Verify no code execution attempts
- Filter inappropriate content
- Ensure bilingual responses when requested

**API Key Protection:**
- Never expose in frontend
- Rotate keys quarterly
- Monitor for unauthorized usage
- Use Vercel environment variables

---

## 4. Phase Breakdown

### Phase 0: Infrastructure Setup (3-5 days)

#### Objectives
- Establish development environment
- Acquire and test API keys
- Build base infrastructure (rate limiter, error handler, logger)
- Deploy and test serverless functions

#### Tasks & Steps

##### Task 0.1: API Key Acquisition (1 day)
**Steps:**
1. HuggingFace setup
   - Sign up at https://huggingface.co
   - Create API token (Settings → Access Tokens)
   - Test inference call with curl:
     ```bash
     curl https://api-inference.huggingface.co/models/meta-llama/Meta-Llama-3.1-8B-Instruct \
       -H "Authorization: Bearer YOUR_TOKEN" \
       -d '{"inputs":"Test"}'
     ```
   - Verify 1,000+ req/day quota per model
   - Test multiple models (Llama 3.1, Mistral, embeddings)
2. Document API credentials
   - Store in password manager
   - Add to `.env.local` template
   - Update README with setup instructions

**Acceptance Criteria:**
- ✅ HuggingFace token works for all models
- ✅ Quotas verified (1000+ per model)
- ✅ Keys documented securely

##### Task 0.2: Development Environment (1-2 days)
**Steps:**
1. Create `/api` folder structure
   ```
   /api
     /utils
       rateLimiter.ts
       errorHandler.ts
       logger.ts
     ai-chat.js
   ```
2. Set up environment variables
   - Create `.env.local.template`
   - Add to `.gitignore`
   - Document required vars
3. Configure Vercel deployment
   - Link project to Vercel
   - Add environment variables
   - Test deployment pipeline

**Acceptance Criteria:**
- ✅ Folder structure created
- ✅ Environment variables configured
- ✅ Vercel deploys successfully

##### Task 0.3: Base Infrastructure (1-2 days)
**Steps:**
1. Create `AIProvider` context wrapper
   ```typescript
   // Manages AI state globally
   export const AIProvider = ({ children }) => {
     const [aiEnabled, setAIEnabled] = useState(true);
     const [quotaExceeded, setQuotaExceeded] = useState(false);
     // ...
   };
   ```

2. Build rate limiter (`/api/utils/rateLimiter.ts`)
   ```typescript
   // Per-user limits: 20 req/hr
   // Global limits: 900/day per HuggingFace model (90% of 1000)
   export async function checkRateLimit(userId, model) {
     // Implementation
   }
   ```

3. Create error handler (`/api/utils/errorHandler.ts`)
   ```typescript
   export function handleAPIError(error) {
     // Standardize error responses
     // Log without PII
     // Return user-friendly message
   }
   ```

4. Set up logging (`/api/utils/logger.ts`)
   ```typescript
   export function logAIRequest(endpoint, success, responseTime) {
     // No PII - only metrics
     // Track quota usage
     // Performance data
   }
   ```

5. Build fallback mechanism skeleton
   ```typescript
   export async function callAIWithFallback(prompt) {
     try {
       return await callHuggingFace(prompt, 'meta-llama/Meta-Llama-3.1-8B-Instruct');
     } catch (error) {
       return await callHuggingFace(prompt, 'mistralai/Mistral-7B-Instruct-v0.2');
     }
   }
   ```

**Acceptance Criteria:**
- ✅ AIProvider context works
- ✅ Rate limiter blocks over-quota requests
- ✅ Error handler standardizes responses
- ✅ Logger captures metrics (no PII)
- ✅ Fallback switches Llama 3.1 → Mistral

##### Task 0.4: Testing & Deployment (1 day)
**Steps:**
1. Unit test each utility
2. Integration test full flow
3. Deploy to Vercel staging
4. Smoke test deployed endpoints
5. Set up monitoring dashboard

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Staging deployment works
- ✅ Monitoring captures data

#### Deliverables
- ✅ `/api/utils/rateLimiter.ts`
- ✅ `/api/utils/errorHandler.ts`
- ✅ `/api/utils/logger.ts`
- ✅ `/src/context/AIProvider.tsx`
- ✅ Environment variables configured
- ✅ Deployment pipeline tested
- ✅ Monitoring dashboard (basic)

#### Dependencies
- Vercel account access
- Password manager for API keys
- Git repository access

---

### Phase 1: Mystery AI Chat (10-13 hours)

#### Objectives
- Replace static "Learn More" with AI-generated explanations
- Implement basic Q&A chatbot for mysteries
- Establish dual-API fallback system
- Achieve 100% theological accuracy

#### Tasks & Steps

##### Task 1.1: Backend API Setup (3-4 hrs)
**Steps:**
1. Create `/api/ai-chat.js` serverless function
2. Implement HuggingFace Inference API integration
   - Install SDK: `npm install @huggingface/inference`
   - Configure primary model: `meta-llama/Meta-Llama-3.1-8B-Instruct`
   - Add retry logic (3 attempts)
3. Implement model fallback
   - Fallback model: `mistralai/Mistral-7B-Instruct-v0.2`
   - Same retry logic
   - Automatic switch on primary failure
4. Integrate rate limiter from Phase 0
   - Per-user limits: 20 requests/hour
   - Global limit per model: 900 requests/day (90% of 1,000)
   - Return 429 status when exceeded
5. Add error handling & logging
   - Use errorHandler from Phase 0
   - Use logger from Phase 0
   - Return standardized error format

**Acceptance Criteria:**
- ✅ API responds within 2 seconds (p95)
- ✅ Llama 3.1 → Mistral fallback works automatically
- ✅ Rate limiting prevents quota exhaustion
- ✅ Errors gracefully handled
- ✅ All requests logged (no PII)

##### Task 1.2: AI Prompt Engineering (3-4 hrs)
**Steps:**
1. Design system prompt template
   ```typescript
   const MYSTERY_SYSTEM_PROMPT = `
   You are a Catholic spiritual guide helping users understand the mysteries of the Rosary.
   Be theologically accurate, compassionate, and concise.
   Use simple language accessible to all ages.
   Reference scripture when relevant.
   Keep responses under 200 words unless asked for detail.
   Never contradict Catholic doctrine.
   If unsure, say "I recommend consulting a priest" rather than guessing.
   `;
   ```

2. Create context builder
   - Include mystery name, fruit, scripture reference
   - Include user's language (English/Spanish)
   - Include current liturgical season (if available)
   - Format context clearly for AI

3. Test prompt variations
   - Generate 10 sample responses per mystery type
   - Test with different phrasings
   - Test edge cases (heretical questions, inappropriate queries)
   - Verify theological accuracy

4. Create prompt template library (`AI_PROMPTS.md`)
   - Document all prompts
   - Include versioning
   - Note what works/doesn't work

**Acceptance Criteria:**
- ✅ AI responses are theologically sound (100% pass expert review)
- ✅ Tone is warm and accessible
- ✅ Bilingual support (EN/ES) works equally well
- ✅ References scripture appropriately
- ✅ Handles edge cases gracefully

##### Task 1.3: Frontend UI Components (3-4 hrs)
**Steps:**
1. Create `AIExplanationModal.tsx`
   - Replace static "Learn More" modal content
   - Add "Regenerate" button for new perspective
   - Loading state with skeleton animation
   - Error state with fallback to static content
   - Thumbs up/down feedback buttons
   - Match existing design system (colors, fonts, spacing)

2. Create `MysteryQAChat.tsx`
   - Simple chat interface
   - Input field + submit button
   - Message bubbles (user/AI)
   - Loading indicator while AI responds
   - Error handling (show message, retry button)
   - Optional: Streaming responses for speed

3. Integrate with `MysteryScreen.tsx`
   - Add "Ask AI" button next to Learn More
   - Pass mystery context to API
   - Handle loading/error states
   - Track usage (anonymously)

4. Add settings toggle
   - "AI Features" on/off switch in Settings
   - Default: ON
   - Persist to localStorage (`ai_enabled`)
   - Respect toggle across all AI features

**Acceptance Criteria:**
- ✅ UI matches existing design system
- ✅ Modal loads in <500ms (skeleton shows immediately)
- ✅ "Regenerate" creates new explanation
- ✅ Chat interface is intuitive
- ✅ Settings toggle works globally
- ✅ Feedback buttons track satisfaction

##### Task 1.4: Testing & Refinement (2-3 hrs)
**Steps:**
1. Unit testing
   - Test API endpoint with mock data
   - Test rate limiter edge cases
   - Test error handling paths

2. Integration testing
   - Test all 20 mysteries (Joyful/Luminous/Sorrowful/Glorious)
   - Test in both languages (EN/ES)
   - Test rate limiting behavior (exceed quota)
   - Test fallback scenarios:
     - Gemini down → Groq succeeds
     - Groq down → Gemini succeeds
     - Both down → Static fallback

3. Performance testing
   - Test on mobile devices (iOS/Android)
   - Measure response times (p50, p95, p99)
   - Test with slow network (3G simulation)

4. Theological review
   - Generate 20 responses per mystery type (80 total)
   - Catholic theologian reviews using rubric
   - 100% must pass before launch
   - Fix any issues, re-review

5. User testing
   - 10-20 beta users
   - Collect feedback via in-app survey
   - Iterate based on feedback

6. Bug fixes and prompt refinement
   - Address all critical bugs
   - Refine prompts based on testing
   - Optimize performance

**Acceptance Criteria:**
- ✅ All mysteries generate quality responses
- ✅ Bilingual works correctly (equal quality EN/ES)
- ✅ Fallbacks trigger appropriately
- ✅ Mobile performance acceptable (<3s load)
- ✅ 100% theological accuracy (expert approved)
- ✅ >80% user satisfaction (thumbs up)

#### Deliverables
- ✅ `/api/ai-chat.js` serverless function
- ✅ `AIExplanationModal.tsx` component
- ✅ `MysteryQAChat.tsx` component
- ✅ Settings integration
- ✅ `AI_PROMPTS.md` template library
- ✅ Test suite (unit + integration)
- ✅ Theological review documentation
- ✅ User testing report

#### Dependencies
- Phase 0 completion (infrastructure)
- HuggingFace API token
- Vercel deployment access
- Catholic theologian for review

#### Risks & Mitigation
| Risk | Probability | Impact | Mitigation | Contingency |
|------|-------------|--------|------------|-------------|
| API quota exceeded | Medium | High | Dual-API fallback + rate limiting + 90% quota buffer | Show static content, notify users |
| Poor AI responses | Medium | High | Extensive prompt engineering + testing | Manual review, prompt refinement |
| Theological errors | Low | Critical | Expert review every phase, 100% accuracy requirement | Immediate rollback, public correction |
| Slow API response | Medium | Medium | Show loading states, 5s timeout, cache responses | Fallback to static, retry later |
| API service down | Low | Medium | Graceful fallback to static content | Users never notice if fallback works |

---

### Phase 2: Scripture Intelligence (8-11 hours)

#### Objectives
- Implement Bible verse search & lookup
- Add AI context to daily readings
- Create scripture cross-reference system
- Support multiple Bible translations

#### Tasks & Steps

##### Task 2.1: Bible Search Backend (3-4 hrs)
**Steps:**
1. Research Bible APIs
   - Option 1: Bible Gateway API (requires approval)
   - Option 2: ESV API (free tier: 500 calls/day)
   - Option 3: API.Bible (open source, unlimited)
   - Decision: Choose based on features, quota, reliability

2. Create `/api/bible-search.js` serverless function
   - Search by keyword (e.g., "love")
   - Fetch by reference (e.g., "John 3:16")
   - Support multiple translations (KJV, NIV, NRSV, etc.)
   - Return verses with context (previous/next verse)

3. Implement caching
   - Use Vercel Edge Config or KV store
   - Cache common verses (Lord's Prayer, Hail Mary references, etc.)
   - Cache duration: 7 days
   - Reduce API calls by 50%+

4. Error handling
   - Handle invalid references
   - Handle API rate limits
   - Fallback to cached verses
   - User-friendly error messages

**Acceptance Criteria:**
- ✅ Search returns relevant verses (95%+ precision)
- ✅ Supports EN/ES translations
- ✅ Cache reduces API load by 50%+
- ✅ Handles errors gracefully

##### Task 2.2: AI Context for Readings (2-3 hrs)
**Steps:**
1. Extend `/api/ai-chat.js` for reading context
   - New endpoint: `/api/ai-reading-context.js`
   - Accepts scripture text + reference
   - Returns AI explanation

2. Create prompt for scripture explanation
   ```typescript
   const SCRIPTURE_PROMPT = `
   Explain this scripture reading in simple terms for a Catholic audience.
   Include: historical context, spiritual meaning, practical application.
   Reference related Catholic teachings when relevant.
   Keep under 150 words.
   `;
   ```

3. Add "Explain This Reading" button to `DailyReadingsScreen`
   - Shows modal with AI explanation
   - Loading state while fetching
   - Error state shows reading without context

4. Stream response to avoid blocking
   - Optional: Show text as it generates
   - Improves perceived performance

**Acceptance Criteria:**
- ✅ Explanations are clear and accurate
- ✅ Context loads in <3 seconds
- ✅ Fallback shows reading without context
- ✅ Theological accuracy maintained (expert review)

##### Task 2.3: Cross-Reference System (3-4 hrs)
**Steps:**
1. Build reference database (JSON)
   - Map mysteries to related verses
   - Map fruits to relevant scriptures
   - Include Catechism references
   - Manual curation for quality

2. Create `ScriptureReferencePanel.tsx`
   - Shows related verses for current mystery
   - Click to expand full text
   - AI explains connection to mystery
   - Collapsible/expandable

3. Integrate with mystery screens
   - Add "Related Scripture" section
   - Load references from database
   - Fetch verse text from Bible API
   - Cache aggressively

**Acceptance Criteria:**
- ✅ References are theologically relevant
- ✅ AI explains connections clearly
- ✅ Panel doesn't clutter UI (collapsible)
- ✅ Loads quickly (<2s for full panel)

##### Task 2.4: Testing & Refinement (2 hrs)
**Steps:**
1. Test Bible search with various queries
2. Test reading context explanations
3. Verify cross-references are accurate
4. Performance testing
5. Theological review
6. User testing

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Performance meets budgets
- ✅ Theological accuracy 100%

#### Deliverables
- ✅ `/api/bible-search.js` endpoint
- ✅ `/api/ai-reading-context.js` endpoint
- ✅ Scripture context in daily readings
- ✅ `ScriptureReferencePanel.tsx`
- ✅ Reference database (JSON)
- ✅ Test suite
- ✅ User documentation

#### Dependencies
- Bible API selection & key
- Phase 1 completion (AI backend)
- Existing daily readings system

#### Risks & Mitigation
| Risk | Probability | Impact | Mitigation | Contingency |
|------|-------------|--------|------------|-------------|
| Bible API limits | Medium | Medium | Cache aggressively + fallback API | Show cached verses only |
| Incorrect references | High | High | Manual verification of database | Community review, corrections |
| Slow verse fetching | Low | Low | Preload common verses | Lazy load, show loading state |
| Translation quality | Low | Medium | Use established translations (KJV, NIV) | Offer multiple translations |

---

### Phase 3: Liturgical Insights (8-11 hours)

#### Objectives
- Add saint of the day with AI background
- Provide liturgical season explanations
- Create feast day context cards
- Integrate with existing liturgical calendar

#### Tasks & Steps

##### Task 3.1: Saint Data Integration (3-4 hrs)
**Steps:**
1. Research saint APIs
   - Church Calendar API (https://publicapi.dev/church-calendar-api)
   - Catholic Saints Calendar (multiple sources)
   - Select most reliable/comprehensive

2. Create `/api/saint-of-day.js`
   - Fetch today's saint
   - Include basic bio data (name, dates, feast day)
   - Support multiple languages (EN/ES)
   - Cache for 24 hours (saint doesn't change mid-day)

3. Add AI enhancement
   - Generate 100-word bio summary
   - Highlight interesting facts
   - Show relevance to modern life
   - Reference related mysteries/prayers

4. Create `SaintOfDayCard.tsx`
   - Shows on home screen
   - Click to expand full bio
   - AI-generated content
   - Fallback to basic data if AI fails

**Acceptance Criteria:**
- ✅ Saint loads daily at midnight
- ✅ AI bio is engaging and accurate
- ✅ Works in EN/ES
- ✅ Fallback to basic data works

##### Task 3.2: Liturgical Season UI (2-3 hrs)
**Steps:**
1. Create `LiturgicalSeasonCard.tsx`
   - Shows current season (Advent, Lent, Ordinary Time, etc.)
   - Displays liturgical color
   - AI explains season significance
   - Shows days remaining in season

2. Add to home screen or prayer selection screen
   - Subtle card below existing liturgical calendar
   - Click to expand full explanation
   - Matches design system

3. Optional: Dynamic theming
   - Change app accent based on season color
   - Setting to enable/disable (default: OFF)
   - Doesn't break existing color scheme

**Acceptance Criteria:**
- ✅ Season auto-updates at season boundaries
- ✅ Explanations are clear and accurate
- ✅ Theming optional and doesn't break UI
- ✅ Integrates with existing liturgical calendar

##### Task 3.3: Feast Day Context (3-4 hrs)
**Steps:**
1. Extend existing liturgical calendar integration
   - Already have feast day names from romcal
   - Add AI context layer

2. Add AI context to feast days
   - Historical background (who/what/when)
   - Why this day is significant
   - How to observe/pray on this day
   - Related mysteries/devotions

3. Create expandable card on `PrayerSelectionScreen`
   - Show feast name (existing)
   - Add "Learn More" button
   - Modal with AI context
   - Fallback to feast name only if AI fails

**Acceptance Criteria:**
- ✅ Context is theologically accurate
- ✅ Loads without blocking UI
- ✅ Fallback shows feast name only
- ✅ Integrates seamlessly with existing UI

##### Task 3.4: Testing & Refinement (2 hrs)
**Steps:**
1. Test saint data fetching
2. Test liturgical season transitions
3. Test feast day context
4. Theological review
5. User testing

**Acceptance Criteria:**
- ✅ All tests pass
- ✅ Theological accuracy 100%
- ✅ User satisfaction >80%

#### Deliverables
- ✅ `/api/saint-of-day.js` endpoint
- ✅ `SaintOfDayCard.tsx`
- ✅ `LiturgicalSeasonCard.tsx`
- ✅ Feast day context integration
- ✅ Optional seasonal theming
- ✅ Test suite
- ✅ Documentation

#### Dependencies
- Phase 1 AI backend
- Existing liturgical calendar system
- Saint API selection

---

### Phase 4: Advanced Features (11-14 hours)

#### Objectives
- Create podcast-style mystery dialogues
- Build smart prayer suggestion engine
- Add Vatican document search
- Enhance user engagement

#### Tasks & Steps

##### Task 4.1: Podcast Dialogues (5-6 hrs)
**Steps:**
1. Design dialogue format
   - Host persona (curious learner, asking questions)
   - Expert persona (spiritual guide, providing answers)
   - 2-3 minute conversations (500-700 words)
   - Natural, conversational tone

2. Create `/api/generate-podcast.js`
   - AI generates dialogue script
   - Two distinct voices/tones
   - Structured as Q&A format
   - Includes intro/outro

3. Optional: TTS integration
   - Use existing Web Speech API
   - Assign different voices to personas (male/female or different pitches)
   - Generate audio file on-demand
   - Cache for 7 days

4. Create `PodcastPlayer.tsx`
   - Play/pause controls
   - Show transcript below audio
   - "Regenerate" button for new dialogue
   - Download transcript option

**Acceptance Criteria:**
- ✅ Dialogues are natural and engaging
- ✅ TTS voices sound distinct
- ✅ Transcript syncs with audio
- ✅ Quality matches other AI features

##### Task 4.2: Smart Suggestions (3-4 hrs)
**Steps:**
1. Create suggestion engine
   - Based on today's liturgical calendar
   - Based on recent prayer history (from existing tracking)
   - Based on current season
   - AI generates personalized explanation

2. Add to home screen or prayer selection screen
   - "Try This Mystery Today" card
   - AI explains why it's suggested
   - User can accept or dismiss

3. Implement recommendation logic
   ```typescript
   // Examples:
   // Advent → Suggest Joyful mysteries
   // Lent → Suggest Sorrowful mysteries
   // Feast of Assumption → Suggest Glorious mysteries
   // User hasn't prayed Luminous in a week → Suggest Luminous
   ```

**Acceptance Criteria:**
- ✅ Suggestions are relevant and timely
- ✅ Explanations make sense
- ✅ Users can dismiss/ignore
- ✅ Doesn't feel pushy or guilt-inducing

##### Task 4.3: Vatican Document Search (3-4 hrs)
**Steps:**
1. Research Vatican APIs
   - Vatican News API
   - Papal documents database (vatican.va)
   - Check CORS, rate limits, reliability

2. Create `/api/vatican-search.js`
   - Keyword search across documents
   - Filter by document type (encyclical, homily, message, etc.)
   - Return relevant excerpts
   - Include links to full documents

3. AI summarizes results
   - Brief summary of each result
   - Relevance to user's query
   - Key quotes highlighted

4. Add to "Learn More" modal or separate tab
   - "Related Documents" section
   - Shows top 3-5 results
   - Click to read full document on vatican.va

**Acceptance Criteria:**
- ✅ Search returns accurate results
- ✅ AI summaries are helpful
- ✅ Links open Vatican website correctly
- ✅ Respects copyright/attribution

##### Task 4.4: Testing & Refinement (2 hrs)
**Steps:**
1. Test podcast generation and playback
2. Test smart suggestions across scenarios
3. Test Vatican document search
4. Theological review
5. User testing

**Acceptance Criteria:**
- ✅ All features work as expected
- ✅ Theological accuracy maintained
- ✅ User engagement metrics positive

#### Deliverables
- ✅ `/api/generate-podcast.js`
- ✅ `/api/vatican-search.js`
- ✅ `PodcastPlayer.tsx`
- ✅ Smart suggestion engine
- ✅ Vatican document search UI
- ✅ Test suite
- ✅ Documentation

#### Dependencies
- Phase 1 AI backend
- Phase 3 liturgical integration
- Existing prayer history tracking

---

### Phase 5: Personal Growth (11-14 hours)

#### Objectives
- Build spiritual journal with AI prompts
- Create progress insights dashboard
- Add Catechism lookup tool
- Maintain strict privacy (local-only data)

#### Tasks & Steps

##### Task 5.1: Spiritual Journal (5-6 hrs)
**Steps:**
1. Create `SpiritualJournal.tsx` screen
   - Add to bottom navigation or settings menu
   - Daily entry system
   - Tagged by date
   - Simple text editor (or markdown support)

2. AI prompt generator
   - Daily reflection questions based on:
     - Mystery prayed today
     - Today's readings
     - Current liturgical season
     - User's prayer history
   - Optional: User can request new prompt

3. Local storage only (PRIVACY CRITICAL)
   - Never sent to cloud
   - Encrypted locally with Web Crypto API
   - Only user can read their entries
   - Export feature (JSON/text) for backup

4. AI insights (OPTIONAL, OPT-IN ONLY)
   - Analyze trends locally (in browser)
   - Suggest prayers based on entries
   - Encouraging messages
   - User must explicitly opt-in
   - Clear explanation of what AI sees

**Acceptance Criteria:**
- ✅ Entries save locally (localStorage or IndexedDB)
- ✅ AI prompts are meaningful and varied
- ✅ No data sent to server (verified in network tab)
- ✅ Export feature works (JSON/text)
- ✅ Encryption works (entries unreadable in storage)
- ✅ Opt-in AI insights clearly explained

##### Task 5.2: Progress Insights (3-4 hrs)
**Steps:**
1. Extend existing progress tracking
   - Already have prayer completion data
   - Add AI layer for insights

2. Add AI-generated insights
   - Examples:
     - "You've prayed 20 days in a row! Keep it up!"
     - "Try Sorrowful mysteries this week for Lent"
     - "You haven't prayed the Luminous mysteries in 2 weeks"
   - Encouraging tone, never guilt-inducing
   - Based on actual user data

3. Create `InsightsCard.tsx`
   - Shows on progress screen
   - Refreshes weekly
   - User can dismiss
   - Optional: User can request new insight

**Acceptance Criteria:**
- ✅ Insights are encouraging and helpful
- ✅ Based on actual user data (not generic)
- ✅ Never guilt-inducing or judgmental
- ✅ User can dismiss/hide

##### Task 5.3: Catechism Lookup (3-4 hrs)
**Steps:**
1. Research Catechism APIs/databases
   - Catechism of Catholic Church (public domain)
   - JSON format available online
   - Download and include in app (or external API)

2. Create search function
   - Search by topic (e.g., "prayer", "grace")
   - Search by paragraph number (e.g., "CCC 2558")
   - Return relevant paragraphs

3. AI explains in simple terms
   - 50-word summary of paragraph
   - Practical application
   - Related scriptures or prayers

4. Add to "Learn More" modal or separate section
   - "Catechism References" tab
   - Shows search results
   - Click to expand AI explanation
   - Link to full Catechism paragraph

**Acceptance Criteria:**
- ✅ Search is fast and accurate
- ✅ AI summaries are orthodox (expert review)
- ✅ Links to full Catechism text work
- ✅ Covers all major topics

##### Task 5.4: Testing & Refinement (2 hrs)
**Steps:**
1. Test journal encryption and export
2. Test progress insights accuracy
3. Test Catechism search
4. Privacy audit (verify no data sent to server)
5. Theological review
6. User testing

**Acceptance Criteria:**
- ✅ All features work correctly
- ✅ Privacy maintained (no server calls for journal)
- ✅ Theological accuracy 100%

#### Deliverables
- ✅ `SpiritualJournal.tsx` screen
- ✅ AI progress insights
- ✅ Catechism lookup tool
- ✅ Privacy documentation (explain local-only)
- ✅ Test suite
- ✅ User guide

#### Dependencies
- Phase 1 AI backend
- Phase 2 scripture system (for journal prompts)
- Existing progress tracking system
- Catechism database/API

---

### Phase 6: Offline Mode (14-17 hours)

#### Objectives
- Integrate Tiny Llama 1.1B for on-device AI
- Enable core features offline
- Background sync when online
- Optional feature (user downloads model)

#### Tasks & Steps

##### Task 6.1: WebAssembly Setup (4-5 hrs)
**Steps:**
1. Research WebLLM options
   - llama-cpp-wasm (most mature)
   - transformers.js (HuggingFace)
   - web-llm (MLC AI)
   - Choose based on browser support and performance

2. Install dependencies
   ```bash
   npm install @mlc-ai/web-llm
   ```

3. Test model loading
   - Tiny Llama 1.1B GGUF format
   - Verify 483 MB size
   - Measure load time (target: <15s)
   - Test inference speed

4. Create `/utils/onDeviceAI.ts`
   - Model initialization
   - Inference function (similar interface to cloud AI)
   - Memory management
   - Error handling

**Acceptance Criteria:**
- ✅ Model loads in <15 seconds
- ✅ Runs in Chrome/Edge/Firefox
- ✅ Memory usage acceptable (<1 GB RAM)
- ✅ Inference speed acceptable (<5s per response)

##### Task 6.2: Settings & Download UI (3-4 hrs)
**Steps:**
1. Add "Offline AI Mode" to settings
   - Toggle to enable
   - Warning about download size (483 MB)
   - Download button

2. Create `ModelDownloader.tsx`
   - Shows download progress (percentage, MB/s)
   - Estimates time remaining
   - Allows pause/resume
   - Allows cancellation
   - Success confirmation

3. Store in IndexedDB
   - Persist across sessions
   - Check for updates (new model versions)
   - Delete option (free up space)

**Acceptance Criteria:**
- ✅ Download UI is clear and informative
- ✅ User can pause/resume/cancel
- ✅ Model persists after download
- ✅ Delete option works

##### Task 6.3: Offline-First Logic (4-5 hrs)
**Steps:**
1. Implement hybrid mode
   ```typescript
   async function getAIResponse(prompt) {
     // Priority: On-device > Cloud > Static
     if (offlineModeEnabled && modelLoaded) {
       return await onDeviceInference(prompt);
     }
     if (navigator.onLine) {
       return await cloudAI(prompt);
     }
     return fallbackToStatic();
   }
   ```

2. Quality detection (OPTIONAL)
   - If on-device response is unclear/low-quality, try cloud
   - Show "Enhanced with cloud AI" badge
   - User can choose to always use on-device

3. Sync when online
   - Cache cloud responses for offline use
   - Update model if new version available
   - Background sync of favorite content

**Acceptance Criteria:**
- ✅ Offline mode works without internet
- ✅ Hybrid mode upgrades quality when online
- ✅ Smooth transition online/offline
- ✅ User understands which AI is being used

##### Task 6.4: Performance Optimization (3-4 hrs)
**Steps:**
1. Use Web Workers
   - Inference in background thread
   - Don't block UI during inference
   - Show progress indicator

2. Implement caching
   - Cache common prompts locally
   - Reduce redundant inference
   - Target: 30%+ cache hit rate

3. Battery optimization
   - Detect low battery (<20%)
   - Automatically switch to cloud if available
   - Or reduce on-device usage
   - User notification

**Acceptance Criteria:**
- ✅ UI stays responsive during inference
- ✅ Cache reduces inference by 30%+
- ✅ Battery impact minimal (<5% drain/hour)
- ✅ Web Worker doesn't crash

##### Task 6.5: Testing & Refinement (2 hrs)
**Steps:**
1. Test model download and loading
2. Test offline inference quality
3. Test battery impact
4. Test memory usage
5. User testing

**Acceptance Criteria:**
- ✅ All features work offline
- ✅ Quality acceptable (may be lower than cloud)
- ✅ Performance acceptable

#### Deliverables
- ✅ `/utils/onDeviceAI.ts`
- ✅ `ModelDownloader.tsx`
- ✅ Offline-first logic
- ✅ Performance optimizations
- ✅ Test suite
- ✅ User documentation

#### Dependencies
- Phase 1-5 completion
- WebAssembly browser support (95%+ browsers)
- IndexedDB support

---

## 5. Cross-Cutting Concerns

### Rate Limiting Strategy
```typescript
// Per-user limits (prevent abuse)
const USER_RATE_LIMIT = {
  requests: 20,
  window: 3600000, // 1 hour in ms
};

// Global limits (90% of quota for safety buffer)
const GLOBAL_LIMITS = {
  'llama-3.1-8b': { 
    requests: 900, // 90% of 1000
    window: 86400000, // 1 day in ms
  },
  'mistral-7b': { 
    requests: 900, // 90% of 1000
    window: 86400000,
  },
  'embeddings': {
    requests: 900, // 90% of 1000
    window: 86400000,
  },
};

// Implementation
async function checkRateLimit(userId, endpoint) {
  const userKey = `ratelimit:${userId}:${endpoint}`;
  const globalKey = `ratelimit:global:${endpoint}`;
  
  // Check user limit
  const userCount = await getCount(userKey);
  if (userCount >= USER_RATE_LIMIT.requests) {
    throw new Error('USER_RATE_LIMIT_EXCEEDED');
  }
  
  // Check global limit
  const globalCount = await getCount(globalKey);
  if (globalCount >= GLOBAL_LIMITS[endpoint].requests) {
    throw new Error('GLOBAL_RATE_LIMIT_EXCEEDED');
  }
  
  // Increment counters
  await incrementCount(userKey, USER_RATE_LIMIT.window);
  await incrementCount(globalKey, GLOBAL_LIMITS[endpoint].window);
}
```

### Error Handling Pattern
```typescript
async function callAIWithFallback(prompt, context) {
  try {
    // Try primary AI (Llama 3.1 8B)
    const response = await callHuggingFace(prompt, context, 'meta-llama/Meta-Llama-3.1-8B-Instruct');
    if (validateResponse(response)) {
      logSuccess('llama-3.1', response.time);
      return response;
    }
  } catch (error) {
    logError('llama-3.1', error);
    
    if (error.code === 'RATE_LIMIT' || error.code === 'MODEL_ERROR') {
      // Try fallback AI (Mistral 7B)
      try {
        const response = await callHuggingFace(prompt, context, 'mistralai/Mistral-7B-Instruct-v0.2');
        if (validateResponse(response)) {
          logSuccess('mistral-7b', response.time);
          return response;
        }
      } catch (mistralError) {
        logError('mistral-7b', mistralError);
      }
    }
    
    if (error.code === 'NETWORK') {
      // Try on-device AI if available
      if (onDeviceModelLoaded()) {
        try {
          const response = await onDeviceAI(prompt, context);
          if (validateResponse(response)) {
            logSuccess('on-device', response.time);
            return response;
          }
        } catch (deviceError) {
          logError('on-device', deviceError);
        }
      }
    }
  }
  
  // Ultimate fallback: static content
  logFallback('static');
  return getStaticContent(context);
}

function validateResponse(response) {
  // Check format
  if (!response || !response.text) return false;
  
  // Check for inappropriate content (basic filter)
  if (containsInappropriateContent(response.text)) return false;
  
  // Check for code execution attempts
  if (containsCodePattern(response.text)) return false;
  
  return true;
}
```

### Caching Strategy
| Data Type | Cache Duration | Storage | Invalidation |
|-----------|----------------|---------|--------------|
| AI responses | None (always fresh) | N/A | N/A |
| Saint of day | 24 hours | localStorage | Daily at midnight |
| Liturgical data | 24 hours | localStorage | Daily at midnight |
| Bible verses | 7 days | IndexedDB | Weekly or manual |
| Podcast dialogues | 7 days | IndexedDB | Manual clear |
| Catechism paragraphs | 30 days | IndexedDB | Version change |

```typescript
// Cache implementation example
async function getCachedOrFetch(key, fetchFn, duration) {
  const cached = await getFromCache(key);
  if (cached && !isExpired(cached, duration)) {
    return cached.data;
  }
  
  const data = await fetchFn();
  await saveToCache(key, data, Date.now());
  return data;
}
```

### Privacy & Security

**Core Principles:**
- **No user accounts** - All features work anonymously
- **No tracking** - AI queries are stateless, no analytics cookies
- **Local-first** - Journal/progress stays on device, never sent to server
- **Transparent** - Privacy policy explains all data flows clearly
- **Opt-in** - Users choose cloud vs on-device AI, journal insights opt-in

**Implementation:**
```typescript
// Privacy checks
function ensurePrivacy(data) {
  // Never log PII
  if (containsPII(data)) {
    throw new Error('PII_DETECTED');
  }
  
  // Never send journal to server
  if (isJournalData(data)) {
    throw new Error('JOURNAL_DATA_NOT_ALLOWED');
  }
  
  // Anonymize all requests
  return {
    query: sanitize(data.query),
    context: sanitize(data.context),
    // No user ID, IP, or identifying info
  };
}
```

**Privacy Policy Highlights:**
- AI queries are anonymous (no user ID attached)
- Journal entries never leave your device
- Progress data stored locally
- No third-party tracking scripts
- No cookies for tracking (only functional cookies)
- User can export all data (GDPR compliance)
- User can delete all data (right to be forgotten)

### Internationalization

**Current Support:** English (EN), Spanish (ES)  
**Future:** French (FR), Portuguese (PT), Italian (IT)

**Implementation:**
```typescript
// All prompts support bilingual
const PROMPTS = {
  en: {
    mysteryExplanation: 'Explain this mystery...',
    scriptureContext: 'Explain this scripture...',
    // ...
  },
  es: {
    mysteryExplanation: 'Explica este misterio...',
    scriptureContext: 'Explica esta escritura...',
    // ...
  },
};

// AI responses translated if needed
async function getAIResponse(prompt, language) {
  const systemPrompt = PROMPTS[language].system;
  const userPrompt = PROMPTS[language][prompt.type];
  
  const response = await callAI(systemPrompt, userPrompt);
  
  // Verify response is in correct language
  if (!isInLanguage(response, language)) {
    // Re-request with language emphasis
    return await callAI(
      `${systemPrompt}\nIMPORTANT: Respond in ${language} language only.`,
      userPrompt
    );
  }
  
  return response;
}
```

**Testing:**
- All features tested in both EN and ES
- Native speakers review translations
- Equal quality in both languages (measured)
- UI text follows existing i18n system

### Analytics (Privacy-Safe)

**What We Track:**
- Feature usage counts (e.g., "AI chat used 150 times today")
- Performance metrics (response times, error rates)
- User satisfaction (thumbs up/down counts)
- Quota usage (how close to API limits)

**What We DON'T Track:**
- User identity (completely anonymous)
- Personal info (no PII ever)
- Prayer content or journal entries
- Specific questions asked (only counts)
- Location, IP address, device ID

**Implementation:**
```typescript
// Privacy-safe analytics
function trackEvent(event, metadata) {
  // No user ID
  // No PII
  // Only aggregate metrics
  
  logEvent({
    event: event, // e.g., 'ai_chat_used'
    timestamp: Date.now(),
    metadata: sanitizeMetadata(metadata), // Remove any PII
  });
}

// Example usage
trackEvent('ai_chat_used', {
  mystery: 'joyful_1', // OK
  language: 'en', // OK
  responseTime: 1250, // OK
  // NO user ID, NO question text
});
```

---

## 6. Testing Strategy

### Unit Tests
**Coverage Target:** 80%+

**Test Suites:**
- API endpoint logic (`/api/*.js`)
- Rate limiter (`rateLimiter.ts`)
- Context builder (`contextBuilder.ts`)
- Fallback mechanisms (`callAIWithFallback`)
- Input sanitization (`sanitize`)
- Response validation (`validateResponse`)

**Tools:** Jest, Testing Library

### Integration Tests
**Scenarios:**
- Gemini → Groq fallback (simulate Gemini down)
- Online → Offline transition (simulate network loss)
- Cache hit/miss scenarios
- Error state handling (API errors, timeouts, invalid responses)
- Rate limit enforcement (exceed quota, verify blocking)

**Tools:** Playwright or Cypress

### End-to-End Tests
**User Flows:**
- Phase 1: Ask AI about mystery, regenerate, rate response
- Phase 2: Search Bible verse, get AI context
- Phase 3: View saint of day, expand AI bio
- Phase 4: Generate podcast, listen, view transcript
- Phase 5: Write journal entry, get AI prompt
- Phase 6: Download model, use offline

**Devices:**
- Desktop (Chrome, Firefox, Safari, Edge)
- Mobile (iOS Safari, Android Chrome)
- Tablet (iPad, Android tablet)

**Tools:** Playwright, BrowserStack

### Regression Testing
**Run before each phase deployment:**
- ✅ All 20 mysteries still load
- ✅ Audio playback works (EN/ES)
- ✅ Progress tracking accurate
- ✅ Daily readings fetch correctly
- ✅ Bible in a year tracking works
- ✅ Settings persist
- ✅ Offline mode (if enabled) still works
- ✅ No performance degradation

**Automated:** Yes (CI/CD pipeline)  
**Frequency:** Every deployment  
**Blocking:** Yes - failed tests block deploy

### Performance Testing
**Targets:**
- API response time: <2s (p95), <5s (p99)
- Serverless cold start: <3s
- UI interaction: <100ms (button clicks, navigation)
- Bundle size increase: <50 KB per phase
- Memory usage: <200 MB
- Rate limiter: Handle 100 concurrent users

**Tools:** Artillery, k6, Lighthouse, WebPageTest  
**Frequency:** Before each phase launch  
**Scenarios:**
1. 100 users hitting mystery AI simultaneously
2. Rate limit exhaustion test
3. Fallback API switch under load
4. Offline model inference stress test

### Load Testing
**Scenarios:**
- Normal load: 100 concurrent users
- Peak load: 500 concurrent users
- Spike test: 0 → 500 → 0 in 5 minutes
- Soak test: 100 users for 24 hours

**Success Criteria:**
- No errors under normal load
- <5% errors under peak load
- Graceful degradation during spikes
- No memory leaks during soak test

### Accessibility Testing
**Standard:** WCAG 2.1 Level AA

**Requirements:**
- ✅ Screen reader compatible (NVDA, JAWS, VoiceOver)
- ✅ Keyboard navigation (all features accessible without mouse)
- ✅ Color contrast ≥4.5:1 (text) and ≥3:1 (UI components)
- ✅ Focus indicators visible (2px solid outline)
- ✅ ARIA labels on all interactive elements
- ✅ Semantic HTML (headings, landmarks, lists)
- ✅ No keyboard traps
- ✅ Skip links for navigation

**Tools:** axe DevTools, Lighthouse, WAVE  
**Frequency:** Every phase  
**Manual Testing:** Test with actual screen reader users

### Security Testing
**Checks:**
- Input sanitization (XSS, SQL injection, code injection)
- API key exposure (never in frontend code)
- CORS configuration (correct origins)
- Rate limiting (prevents abuse)
- Prompt injection attacks (malicious prompts)
- Content Security Policy (CSP headers)

**Tools:** OWASP ZAP, manual penetration testing  
**Frequency:** Phase 0 and before each major release

### Quality Assurance

**Theological Review:**
```markdown
### Review Process
1. Generate 20 responses per mystery type (80 total)
2. Catholic theologian/priest reviews using rubric:
   - Orthodox doctrine: Pass/Fail (MUST pass)
   - Scripture accuracy: Pass/Fail (MUST pass)
   - Tone appropriateness: 1-5 (must be ≥4)
   - Clarity: 1-5 (must be ≥4)
   - Overall: Pass/Fail
3. 100% must pass before phase launch
4. Post-launch: Random sampling (5% of responses)
5. User-reported issues reviewed within 24 hours
```

**User Testing:**
- 10-20 beta users per phase
- Diverse demographics (age, tech-savvy, language)
- Collect feedback via in-app survey
- Metrics: Satisfaction (thumbs up/down), usability issues, feature requests
- Iterate based on feedback before public launch

**Performance Monitoring:**
- Real-time dashboard (Vercel Analytics)
- Error rates by endpoint
- Response times (p50, p95, p99)
- Quota usage (Gemini/Groq)
- Feature usage stats

---

## 7. Deployment Strategy

### Phased Rollout
1. **Internal Testing** - Dev team only (1 week per phase)
   - Full feature testing
   - Bug fixes
   - Performance validation

2. **Beta Release** - 50-100 opt-in users (1 week per phase)
   - Collect feedback
   - Monitor metrics
   - Fix critical issues

3. **Gradual Rollout** - Percentage-based (2 weeks)
   - Week 1: 10% of users
   - Week 1.5: 50% of users (if no issues)
   - Week 2: 100% of users

4. **Monitor & Iterate** - Ongoing
   - Fix issues as they arise
   - Improve prompts based on feedback
   - Optimize performance

### Feature Flags
```typescript
// Vercel Environment Variables or runtime config
const FEATURE_FLAGS = {
  aiMysteryChat: true,         // Phase 1
  scriptureIntelligence: false, // Phase 2
  liturgicalInsights: false,    // Phase 3
  advancedFeatures: false,      // Phase 4
  personalGrowth: false,        // Phase 5
  offlineMode: false,           // Phase 6
};

// Usage in code
function FeatureComponent() {
  if (!FEATURE_FLAGS.aiMysteryChat) {
    return <StaticContent />;
  }
  return <AIEnhancedContent />;
}
```

**Benefits:**
- Instant enable/disable without deployment
- A/B testing capabilities
- Gradual rollout per feature
- Emergency kill switch

### Rollback Plan

**Automatic Rollback Triggers:**
- Error rate >5% for 5 consecutive minutes
- API response time >5s (p95) for 5 minutes
- Rate limit exceeded >10 times in 1 hour
- Memory leak detected (>500 MB usage)

**Manual Rollback Criteria:**
- User complaints >10 in 1 hour
- Theological expert flags content as problematic
- Security vulnerability discovered
- Privacy violation detected

**Rollback Procedure:**
1. Disable feature flag immediately
2. Notify users (if necessary)
3. Investigate root cause
4. Fix issue in development
5. Re-test thoroughly
6. Re-deploy with fix
7. Post-mortem: Document what happened and how to prevent

**Data Considerations:**
- No data loss on rollback (all local or cached)
- User preferences preserved
- Journal entries unaffected (local-only)

---

## 8. Success Metrics

### Phase 1 Metrics: Mystery AI Chat
| Metric | Target | Measurement Method | Success Criteria |
|--------|--------|-------------------|------------------|
| **Engagement** | 50%+ try AI chat | Track "Ask AI" clicks vs mystery views | ≥50% click rate within 2 weeks |
| **Quality** | <10% regenerate | Regenerate clicks / Total responses | ≤10% regeneration |
| **Performance** | <2s response (p95) | Server-side timing logs | 95th percentile ≤2000ms |
| **Satisfaction** | >80% thumbs up | In-app thumbs up/down | ≥80% positive |
| **Theological** | 100% accuracy | Expert review | All responses pass |

### Phase 2 Metrics: Scripture Intelligence
| Metric | Target | Measurement | Success |
|--------|--------|-------------|---------|
| **Usage** | 30%+ use search | Bible search usage / Daily active users | ≥30% |
| **Accuracy** | 95%+ correct verses | Manual review of top 100 searches | ≥95% precision |
| **Performance** | <3s search | API response times | p95 ≤3000ms |

### Phase 3 Metrics: Liturgical Insights
| Metric | Target | Measurement | Success |
|--------|--------|-------------|---------|
| **Daily Active** | 40%+ check saint | Saint card views / Daily active users | ≥40% |
| **Engagement** | 20%+ expand feast | Feast expansion / Feast appearances | ≥20% |

### Phase 4 Metrics: Advanced Features
| Metric | Target | Measurement | Success |
|--------|--------|-------------|---------|
| **Podcast** | 15%+ generate | Podcast generations / Active users | ≥15% |
| **Suggestions** | 25%+ follow | Suggestion accepts / Suggestion shows | ≥25% |

### Phase 5 Metrics: Personal Growth
| Metric | Target | Measurement | Success |
|--------|--------|-------------|---------|
| **Journal** | 10%+ write entries | Users with ≥1 entry / Active users | ≥10% |
| **Retention** | 2x more likely | Journal users return rate vs non-journal | ≥2x |

### Phase 6 Metrics: Offline Mode
| Metric | Target | Measurement | Success |
|--------|--------|-------------|---------|
| **Adoption** | 5%+ download | Model downloads / Active users | ≥5% |
| **Performance** | <5s inference | On-device response times | p95 ≤5000ms |

### Overall App Metrics (Post-Implementation)
| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| **Session Duration** | Current avg | +30% | Analytics |
| **Daily Active Users** | Current | +20% | Analytics |
| **Retention (7-day)** | Current | +25% | Analytics |
| **5-Star Reviews** | Current | +15% | App stores |

---

## 9. Timeline & Resources

### Estimated Timeline
| Phase | Dev Time | Testing | Total | Calendar Duration | Dependencies |
|-------|----------|---------|-------|-------------------|--------------|
| **Phase 0: Setup** | 3-4 days | 1 day | 4-5 days | 1 week | API keys, Vercel access |
| **Phase 1** | 10-13 hrs | 2-3 hrs | 12-16 hrs | 1-2 weeks | Phase 0 |
| **Phase 2** | 8-11 hrs | 2-3 hrs | 10-14 hrs | 1-2 weeks | Phase 1 |
| **Phase 3** | 8-11 hrs | 2-3 hrs | 10-14 hrs | 1-2 weeks | Phase 1 |
| **Phase 4** | 11-14 hrs | 3-4 hrs | 14-18 hrs | 2 weeks | Phase 1, 3 |
| **Phase 5** | 11-14 hrs | 3-4 hrs | 14-18 hrs | 2 weeks | Phase 1, 2 |
| **Phase 6** | 14-17 hrs | 4-5 hrs | 18-22 hrs | 2-3 weeks | Phase 1-5 |
| **Total** | **65-84 hrs** | **18-23 hrs** | **83-107 hrs** | **10-13 weeks** | |

**Note:** Timeline assumes part-time development (10-15 hours/week)

### Critical Path
```
Phase 0 (Setup) → Phase 1 (AI Chat) → Phase 4 (Advanced) → Phase 6 (Offline)
```
This is the longest dependency chain. Phases 2, 3, 5 can overlap with Phase 4.

### Resource Requirements

#### Development Resources
| Resource | Quantity | Purpose | Cost |
|----------|----------|---------|------|
| Developer time | 83-107 hrs | Implementation + testing | $0 (internal) |
| API Keys (Gemini) | 1 | Primary AI | Free tier |
| API Keys (Groq) | 1 | Fallback AI | Free tier |
| Bible API access | 1 | Scripture data | Free tier |
| Saint API access | 1 | Liturgical data | Free tier |
| Vercel account | 1 | Serverless hosting | Free tier |
| Testing devices | 3-5 | iOS/Android/Desktop | Existing |

#### External Resources
| Resource | Quantity | Purpose | Cost |
|----------|----------|---------|------|
| Beta testers | 10-20/phase | User validation | $0 (volunteers) |
| Theologian reviewer | 1 | Accuracy validation | $0 (volunteer or $500 total) |
| UX feedback | 5-10 users | Usability testing | $0 (volunteers) |

#### Infrastructure Costs (Monthly)
| Service | Free Tier | Expected Usage | Overage Cost | Total |
|---------|-----------|----------------|--------------|-------|
| Vercel Serverless | 100 GB-hrs | ~5 GB-hrs | $0 | $0 |
| Vercel Bandwidth | 100 GB | ~10 GB | $0 | $0 |
| HuggingFace Inference | 1,000 req/day per model | ~300 req/day per model | $0 | $0 |
| Bible API | Varies by service | Cached heavily | $0 | $0 |
| **TOTAL** | | | | **$0/month** |

**Scaling Estimate (10,000 active users):**
- Assuming 20% use AI features daily = 2,000 users
- 2,000 users × 2 requests/day = 4,000 requests/day
- **Solution:** Distribute across multiple models:
  - Llama 3.1: 900 req/day (primary chat)
  - Mistral 7B: 900 req/day (fallback chat)
  - Gemma 7B: 900 req/day (additional fallback)
  - Total capacity: 2,700 req/day (covers 2,000)
- **Cost at 10k users:** Still $0/month with smart load balancing

---

## 10. Risk Management

### Critical Risks
| Risk | Probability | Impact | Mitigation | Contingency | Owner |
|------|-------------|--------|------------|-------------|-------|
| **Theological errors** | Low | Critical | Expert review every phase, 100% accuracy requirement, user reporting | Immediate rollback, public correction, apologize to community | Dev + Theologian |
| **User data loss** | Very Low | Critical | Local-first architecture, no cloud sync, export feature | Local backup, restore from export, user education | Dev |
| **API service shutdown** | Very Low | High | Dual-API + offline mode, diversified dependencies | Switch to community-hosted alternatives, on-device only | Dev |
| **Privacy violation** | Very Low | Critical | No PII logging, anonymous requests, privacy audit, clear policy | Immediate disclosure, fix, notify users if needed | Dev + Legal |

### High-Risk Items
| Risk | Probability | Impact | Mitigation | Monitoring | Owner |
|------|-------------|--------|------------|-----------|-------|
| **API quota exceeded** | Medium | High | 90% quota buffer, dual-API fallback, per-user limits, smart caching | Daily quota dashboard, alerts at 75% | Dev |
| **Poor AI quality** | Medium | High | Extensive prompt engineering, A/B testing, user feedback, continuous improvement | Quality score tracking (thumbs up/down) | Dev + Theologian |
| **Slow API response** | Medium | Medium | Timeout limits (5s), loading states, cache results, CDN for static assets | Response time metrics (p50, p95, p99) | Dev |
| **Rate limit abuse** | Low | Medium | Per-user limits (20/hr), IP tracking if needed, CAPTCHA for suspicious activity | Alert on unusual patterns (>50 req/min from one user) | Dev |

### Medium-Risk Items
| Risk | Probability | Impact | Mitigation | Acceptance Criteria | Owner |
|------|-------------|--------|------------|---------------------|-------|
| **Browser compatibility** | Low | Medium | Polyfills, feature detection, graceful degradation, test on 95%+ browsers | Works on Chrome, Firefox, Safari, Edge (latest 2 versions) | Dev |
| **Model size concerns** | Medium | Low | Optional download, progressive enhancement, clear warnings (483 MB) | <5% user complaints about size | Dev |
| **Cache invalidation bugs** | Medium | Low | Versioned cache keys, clear cache button, auto-recovery | Auto-recovery mechanism works in tests | Dev |
| **Bilingual quality gap** | Medium | Medium | Native speaker review for both languages, equal investment in both | Equal quality EN/ES (measured by satisfaction scores) | Dev + Translators |
| **CORS issues with APIs** | Medium | Medium | Proxy all API calls through Vercel functions, never direct from browser | All API calls work in production | Dev |

### Low-Risk Items (Monitor)
| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| **Vercel quota exceeded** | Low | Medium | Monitor usage, optimize functions, upgrade plan if needed | Dev |
| **Dependency vulnerabilities** | Low | Low | Weekly `npm audit`, update regularly, automated security alerts | Dev |
| **Prompt injection attacks** | Low | Medium | Input sanitization, context isolation, output validation | Dev |

### Risk Monitoring & Alerting
**Daily Checks:**
- API quota usage (Gemini/Groq)
- Error rates by endpoint
- Response times (p95)
- User complaints (manual review)

**Weekly Checks:**
- Security vulnerabilities (`npm audit`)
- Quality metrics (thumbs up/down ratio)
- Feature usage trends
- Theological concerns (user reports)

**Alerts:**
- Quota >75%: Warning email
- Quota >90%: Critical email + Slack
- Error rate >5%: Immediate Slack alert
- Theological issue reported: Email to theologian + dev

---

## 11. Monitoring & Observability

### Real-Time Dashboard
**Metrics to Track:**
- API quota usage (Llama 3.1: X/900, Mistral: X/900, Embeddings: X/900)
- Model distribution (% requests to each model)
- Error rates by model (chart over time)
- Response times per model (p50, p95, p99 - line charts)
- Active users (current count)
- Feature flag status (enabled/disabled per feature)
- Rate limit hits (per hour per model)

**Tools:** Vercel Analytics, custom dashboard (React + Chart.js)

**Access:** Development team only (password protected)

### Daily Reports (Email)
**Contents:**
- Quota usage trends (yesterday vs 7-day avg)
- Error summaries (top 5 errors, counts)
- User engagement stats (AI chat usage, scripture searches, etc.)
- Quality metrics (thumbs up/down ratio, regenerate rate)
- Performance summary (response times, uptime)

**Recipients:** Dev team, project owner

### Logging Strategy
**What to Log:**
- API requests (endpoint, timestamp, response time, success/fail)
- Errors (type, message, stack trace - NO PII)
- Quota usage (increment counters)
- Feature usage (which features used, anonymously)
- Performance metrics (slow queries, timeouts)

**What NOT to Log:**
- User identities (no user IDs, IPs, or PII)
- Prayer content or journal entries
- Specific questions asked (only counts)
- Personal information

**Storage:** Vercel logs (30-day retention), no third-party services

**Example Log Entry:**
```json
{
  "timestamp": "2026-02-25T12:34:56Z",
  "endpoint": "/api/ai-chat",
  "method": "POST",
  "responseTime": 1250,
  "status": 200,
  "error": null,
  "quotaUsed": {
    "gemini": 145,
    "groq": 12
  }
  // NO user ID, NO question text, NO PII
}
```

---

## 12. Rollback Procedures

### Step-by-Step Rollback Guide

**Scenario 1: Feature has critical bug**
1. Disable feature flag immediately (in Vercel env vars)
2. Verify feature is disabled for all users (check dashboard)
3. Notify users via in-app message (if necessary)
4. Investigate root cause (logs, error reports)
5. Fix issue in development branch
6. Test fix thoroughly (unit, integration, E2E)
7. Re-enable feature flag for 10% users (canary)
8. Monitor for 24 hours
9. If stable, roll out to 100%
10. Post-mortem: Document what happened and how to prevent

**Scenario 2: API quota exceeded unexpectedly**
1. Check quota dashboard (which API, how much over)
2. Disable non-critical features (podcasts, Vatican search)
3. Keep critical features (mystery chat, scripture search)
4. Notify users if features are temporarily unavailable
5. Investigate cause (traffic spike, abuse, bug)
6. If abuse, implement stricter rate limiting
7. If traffic spike, optimize caching or upgrade quota
8. Re-enable features once quota available
9. Post-mortem: Adjust quotas or limits

**Scenario 3: Theological error reported**
1. Immediate review by theologian (within 24 hours)
2. If confirmed error, disable affected feature immediately
3. Generate 100 new responses, have all reviewed
4. Fix prompt engineering to prevent recurrence
5. Re-test thoroughly
6. Re-enable feature after 100% pass rate
7. Public statement if error was public-facing
8. Post-mortem: Improve review process

### Feature Flag Management
**Locations:**
- Vercel Environment Variables (production)
- `.env.local` (development)
- Runtime config (for instant changes)

**Access Control:**
- Only dev team can modify flags
- Changes logged (who, when, what)
- Require approval for critical features

**Emergency Kill Switch:**
- Master flag: `AI_FEATURES_ENABLED`
- Disables ALL AI features at once
- Use only in critical emergencies
- Static fallbacks activate automatically

---

## 13. User Communication Plan

### Launch Announcements
**Phase 1 Launch:**
- In-app banner: "New! Ask AI about any mystery"
- Tutorial modal on first use (optional, dismissible)
- Email to beta users (if opt-in list exists)
- Social media post (if applicable)

**Subsequent Phases:**
- In-app "What's New" section
- Brief tutorial for new features
- No interruptions to existing users

### Feature Education
**In-App Tutorials:**
- First use of AI chat: Show example questions
- First use of offline mode: Explain download size and benefits
- Journal feature: Explain privacy (local-only)

**Help Documentation:**
- FAQ section in settings
- "How to use AI features" guide
- Privacy policy (explain what data is/isn't collected)

### Feedback Collection
**Methods:**
- Thumbs up/down after AI responses
- In-app survey (optional, after 1 week of use)
- Email feedback (support@app.com)
- User testing sessions (scheduled)

**Response Time:**
- Critical bugs: Within 24 hours
- Theological concerns: Within 24 hours (theologian review)
- Feature requests: Acknowledged within 1 week
- General feedback: Reviewed weekly

### Beta Program Management
**Recruitment:**
- Opt-in via settings or email
- Diverse demographics (age, language, tech-savvy)
- 50-100 users per phase

**Communication:**
- Weekly email updates during beta
- Private Slack/Discord channel for feedback
- Early access to new features
- Recognition in app credits (optional)

---

## 14. Knowledge Transfer

### Developer Onboarding Guide
**For new developers joining the project:**

1. **Read Core Documents:**
   - This PRD (complete overview)
   - `AI_PROMPTS.md` (prompt templates)
   - `AI_ARCHITECTURE.md` (system design)
   - `RULES.md` (project rules)

2. **Setup Development Environment:**
   - Clone repo
   - Install dependencies (`npm install`)
   - Get API keys (from team lead)
   - Set up `.env.local`
   - Deploy to Vercel staging

3. **Understand Architecture:**
   - Review folder structure
   - Read code comments
   - Run tests (`npm test`)
   - Deploy and test locally

4. **First Task:**
   - Fix a small bug or add minor feature
   - Get code review
   - Deploy to staging
   - Learn the workflow

**Estimated Time:** 1-2 days

### Architecture Decisions (ADRs)
**Key Decisions Documented:**
1. Why Gemini + Groq (dual-API strategy)
2. Why local-first for journal (privacy)
3. Why progressive enhancement (backward compatibility)
4. Why Vercel serverless (free tier, easy deployment)
5. Why Tiny Llama for offline (size vs quality trade-off)

**Format:**
- Decision: What was chosen
- Context: Why it matters
- Alternatives: What else was considered
- Consequences: Trade-offs and implications

### Troubleshooting Guide
**Common Issues:**

1. **AI not responding**
   - Check API keys are valid
   - Check quota not exceeded (dashboard)
   - Check network connection
   - Check fallback working (Gemini → Groq → Static)

2. **Slow responses**
   - Check API response times (dashboard)
   - Check caching working
   - Check timeout settings (5s)
   - Consider switching to Groq (faster)

3. **Poor quality responses**
   - Review prompt engineering
   - Check if using correct language
   - Verify context is being passed correctly
   - Consider regenerating prompt

4. **Theological concerns**
   - Escalate to theologian immediately
   - Collect examples
   - Review prompt templates
   - Disable feature if necessary

**Escalation:**
- Dev issues → Team lead
- Theological issues → Theologian
- Privacy issues → Project owner + legal
- Security issues → Immediate escalation to all

---

## 15. Future Enhancements (Post-Phase 6)

### Potential Additions
- **Audio Rosary Coaching** - AI suggests pacing, tone for prayer recitation
- **Community Features** - Share AI insights (opt-in, moderated)
- **Multi-language Expansion** - French, Portuguese, Italian, Polish
- **AR/VR Integration** - Immersive prayer experiences with VR headset
- **Wearable Sync** - Apple Watch, Android Wear for prayer reminders
- **Voice Input** - Ask AI questions via voice instead of typing
- **Personalized Prayer Plans** - AI generates custom prayer schedules
- **Integration with Parish** - Connect to local parish schedules and events

### Research Areas
- **Better TTS with timing** - For litany highlighting (Phase 0 of original TODO)
- **Smaller on-device models** - <200 MB for faster downloads
- **Real-time liturgical updates** - Live from Vatican or USCCB
- **Integration with Bible apps** - Cross-app deep linking
- **Gamification** - Prayer streaks, achievements (carefully, avoid trivializing)

### Long-Term Vision
**1-Year Goal:** AI companion is integral to user experience, used by 50%+ of users  
**3-Year Goal:** Multi-language, offline-first, community-driven content  
**5-Year Goal:** Leading Catholic spiritual companion app with AI at its core

---

## 16. Appendices

### A. API Documentation Links
- [HuggingFace Inference API Docs](https://huggingface.co/docs/api-inference/index)
- [HuggingFace Inference JS SDK](https://huggingface.co/docs/huggingface.js/inference/README)
- [Llama 3.1 Model Card](https://huggingface.co/meta-llama/Meta-Llama-3.1-8B-Instruct)
- [Mistral 7B Model Card](https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.2)
- [Sentence Transformers (Embeddings)](https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2)
- [Web-LLM Docs](https://webllm.mlc.ai/docs)
- [Bible API Options](https://scripture.api.bible) (example)
- [Church Calendar API](https://publicapi.dev/church-calendar-api)

### B. Reference Architecture
See `AI_COMPANION_ARCHITECTURE.md` (to be created):
- System architecture diagram
- Data flow diagrams
- Component relationships
- API interaction flows

### C. Prompt Templates
See `AI_PROMPTS.md` (to be created):
- Mystery explanation prompts (EN/ES)
- Scripture context prompts
- Saint biography prompts
- Podcast dialogue prompts
- Journal prompt generator
- All system prompts with versions

### D. Testing Checklist
See `AI_TESTING_CHECKLIST.md` (to be created):
- Unit test checklist
- Integration test scenarios
- E2E user flows
- Regression test suite
- Performance benchmarks
- Accessibility checklist
- Security audit checklist

### E. Deployment Checklist
**Before Each Phase Launch:**
- [ ] All tests passing (unit, integration, E2E)
- [ ] Performance budgets met
- [ ] Theological review complete (100% pass)
- [ ] User testing complete (>80% satisfaction)
- [ ] Documentation updated
- [ ] Feature flags configured
- [ ] Monitoring dashboard ready
- [ ] Rollback plan tested
- [ ] Team notified (launch date/time)
- [ ] Beta users notified (early access)

---

## Document Status

**Version:** 2.0 (Revised)  
**Status:** ✅ Ready for Review and Approval  
**Next Steps:**
1. Review with team (2-3 days)
2. Get theological expert buy-in
3. Approve and begin Phase 0 (setup)
4. Create supporting documents (AI_PROMPTS.md, AI_ARCHITECTURE.md, etc.)

**Questions/Feedback:** Update this PRD as needed during implementation

**Last Updated:** February 25, 2026  
**Last Updated By:** Development Team
