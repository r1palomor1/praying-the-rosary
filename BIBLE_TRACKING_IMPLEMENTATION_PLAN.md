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
- [ ] Create `useBibleProgress` hook (storage logic).
- [ ] Implement "Mark as Read" UI in `BibleInYearScreen`.
- [ ] Implement "Continue Your Journey" Modal.
- [ ] Add "Missed Days" List View (optional first pass, maybe just jump to first missed).
- [ ] Integrate into `BibleInYearScreen` on mount.
