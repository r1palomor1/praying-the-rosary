# Bible in a Year - Progress Tracking & Catch-Up Plan

## Overview
Implement a progress tracking system for the "Bible in a Year" feature to help users stay on track or catch up when they miss days.

## 1. Core Features
- **Track Read Status**: Store which days have been completed (e.g., `bible_read_days: [1, 2, 3...]` in localStorage).
- **Missed Day Detection**: On launch, identify if there are incomplete days prior to "Today".
- **"Continue Your Journey" Modal**: 
  - Shown when missed days are detected.
  - Options:
    1. **Start with Day X** (Next incomplete day).
    2. **View All Incomplete Days** (List view).
    3. **Cancel** (Go to today's reading).

## 2. UI Specifications (From Chat History)

### Modal Content
**Title:** "Continue Your Journey"
**Message:** "Ready to pick up where you left off? Choose how you'd like to continue:"

**Options:**
1. **[Icon] Start with Day {day}**
   - Subtext: "(Next incomplete day)"
   - Action: Loads that specific day.
   
2. **[Icon] View All Incomplete Days**
   - Subtext: "(Choose which to read)"
   - Action: Shows a list/calendar of missed days.

### Translations
```typescript
{
  en: {
    catchUpTitle: "Continue Your Journey",
    catchUpMessage: "Ready to pick up where you left off? Choose how you'd like to continue:",
    startNext: "Start with Day {day}",
    startNextSub: "(Next incomplete day)",
    viewAll: "View All Incomplete Days",
    viewAllSub: "(Choose which to read)"
  },
  es: {
    catchUpTitle: "Continúa tu Camino",
    catchUpMessage: "¿Listo para retomar donde lo dejaste? Elige cómo continuar:",
    startNext: "Comenzar con Día {day}",
    startNextSub: "(Siguiente día incompleto)",
    viewAll: "Ver Todos los Días Incompletos",
    viewAllSub: "(Elige cuál leer)"
  }
}
```

## 3. Technical Implementation

### Data Storage
- `localStorage` key: `'bible_progress'`
- Structure: `{ completedDays: number[] }`

### Logic
1. **On Mount (`BibleInYearScreen.tsx`)**:
   - Calculate `currentDayOfYear`.
   - Check `completedDays`.
   - Identify `missedDays` = (Days 1 to `currentDayOfYear` - 1) NOT in `completedDays`.
   - If `missedDays.length > 0` -> Show Modal.

2. **Marking Complete**:
   - Add "Mark as Read" button (or auto-mark on scroll/time?).
   - *Decision:* Likely a manual "Complete" button or checkmark at bottom of reading.

3. **Navigation**:
   - Update `currentDay` state to match user selection.

## 4. Work Checklist
- [x] Create `useBibleProgress` hook (storage logic).
- [x] Implement "Mark as Read" UI in `BibleInYearScreen`.
- [x] Implement "Continue Your Journey" Modal.
- [x] Add "Missed Days" List View / Calendar View in Modal.
- [x] Integrate into `BibleInYearScreen` on mount.
- [x] Implement Catch-Up logic (Resume vs View Calendar).
- [x] Refine Header Navigation (Day Counter vs Date).
- [x] Improve TTS (Slash removal, Verse pronunciation).

## 5. Completed Implementation Details (Feb 15, 2026)

### Storage & Logic
- **`useBibleProgress` Hook**: Manages `bible_progress` in localStorage.
- **Logic**:
  - `markDayComplete(day)`: Adds day to array, saves timestamp.
  - `isDayComplete(day)`: Returns boolean.
  - `missedDays`: Calculated array of days < currentDayOfYear not in completed list.
  - `expectedDay`: The current day of the year (1-365).

### UI Components
- **BibleInYearScreen**:
  - **Header**: `[Date] < Day X of 365 > [Calendar Icon]`
  - **Readings**: Standard layout with "Mark Complete" button at bottom.
  - **Floating Scroll Buttons**: 
    - Auto-appear based on scroll direction/position.
    - Premium Glassmorphism style with Gold accents.
    - Context-aware: Bottom button hides when at bottom.
  
- **BibleProgressModal**:
  - 365-day grid visualization.
  - **Green**: Completed days.
  - **Red**: Missed days (past days not completed).
  - **Gray**: Future days.
  - **Current Day**: Highlighted border.
  - **Interaction**: Clicking a day closes modal and loads that day's readings. 

### Catch-Up Flow
1. **On Load**: Checks for missed days.
2. **If Missed Days**: Shows "Continue Your Journey" modal.
3. **Options**:
   - **Resume**: Jumps to first missed day.
   - **Today**: Loads current calendar day.
   - **View Calendar**: Opens full progress grid.

## 6. TTS & Audio Enhancements (Feb 16, 2026)

### Features
- **Wake Lock**: Prevents screen sleep during audio playback.
- **Chapter Controls**: Individual Play/Stop buttons for each chapter.
- **Deduplication**: Fixed API data issue where chapters were repeated.
- **Floating Scroll Controls**: Improved visibility/styling (Glassmorphism + Gold).

### Technical Details
- **Wake Lock API**: `navigator.wakeLock.request('screen')`.
- **API Fix**: Deduplicated verses in `api/bible.js` to handle corrupted upstream KJV data.
- **Component**: `handlePlayChapter` logic splits text by `###` markers.

## 7. Formatting & Polish (Next Steps)

### English & Spanish Text Formatting
- **Issue**: Both languages currently break at every verse, causing a disjointed reading experience.
- **Solution**:
  - **English (KJV)**: Preserve `¶` markers in API logic. Use them to group verses into paragraph blocks.
  - **Spanish**: Investigate source data for paragraph markers. If missing, explore alternative data sources or heuristic grouping.

### Visual Polish
- **Daily Readings**: Improve styling for Responsorial Psalms and Alleluia (hanging indent, bold R.).
- **APK Optimization**: Execute release build and bundle generation.

## 8. Strategic Pivot: Data Source Parity (Feb 16, 2026)

**Decision**: Instead of patching inconsistent formatting (paragraphs for English, lists for Spanish), we will pursue structural parity.

### New Objective
Switch the Spanish Bible source from `es-bes` (Biblia en Español Sencillo) to a version that natively supports paragraph structure (e.g., Reina Valera 1960), ensuring both languages offer a premium, book-like reading experience without custom hacks.

### Action Plan
1.  **Investigate**: Verify availability of structural-rich Spanish Bible JSON (e.g., `es-rvr`, `es-1960`).
2.  **Implement**: Update `api/bible.js` to fetch from the new source.
3.  **Format**: Apply the same paragraph-grouping logic to both languages.
