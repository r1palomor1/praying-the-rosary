# Enhanced Mystery Progress Persistence

## Date: 2025-11-28

## User Request

Allow users to resume unfinished mysteries from previous days, while still showing today's mystery on app launch. Only clear old unfinished mysteries when today's mystery is completed.

---

## Implementation

### **New Behavior**

#### **1. Home Screen Always Shows Today's Mystery** ✅
- When you open the app, the home screen displays today's mystery
- Example: Friday → Shows Sorrowful Mysteries

#### **2. Unfinished Mysteries Are Preserved** ✅
- If you started Thursday's mystery but didn't finish, that progress is saved
- You can manually select Thursday's mystery from the Mysteries tab
- It will resume exactly where you left off

#### **3. Independent Progress Tracking** ✅
- Each mystery type has its own separate progress storage
- You can have unfinished progress for multiple mysteries
- Storage keys: `rosary_prayer_progress_joyful`, `rosary_prayer_progress_sorrowful`, etc.

#### **4. Automatic Cleanup** ✅
- When you complete today's mystery, ALL old unfinished mysteries are cleared
- This assumes you won't go back to pray old mysteries after completing today's

---

## Example Scenarios

### **Scenario 1: Unfinished Thursday, Open on Friday**

**Thursday Evening:**
- Start Thursday's Rosary (Luminous Mysteries)
- Pray 3 out of 5 decades (60% complete)
- Close app
- ✅ Progress saved: `rosary_prayer_progress_luminous`

**Friday Morning:**
- Open app
- ✅ Home screen shows: **Sorrowful Mysteries** (Friday's mystery)
- ✅ Thursday's progress is still saved in background

**Friday - Option A: Pray Friday's Mystery**
- Press "Pray" button
- ✅ Starts Sorrowful Mysteries from beginning (0%)

**Friday - Option B: Finish Thursday's Mystery**
- Go to Mysteries tab
- Select Luminous Mysteries
- ✅ Resumes at 60% (3rd decade)
- Complete it
- ✅ Thursday's progress cleared for that mystery only

**Friday - Complete Friday's Mystery**
- Pray and complete Sorrowful Mysteries
- ✅ ALL old unfinished mysteries are cleared (including Thursday's if not yet completed)

---

### **Scenario 2: Multiple Unfinished Mysteries**

**Monday:**
- Start Joyful Mysteries
- Pray 2 decades (40%)
- Close app

**Tuesday:**
- Home shows Sorrowful Mysteries
- Start Sorrowful Mysteries
- Pray 1 decade (20%)
- Close app

**Wednesday:**
- Home shows Glorious Mysteries
- Can still resume:
  - Monday's Joyful (40%) - via Mysteries tab
  - Tuesday's Sorrowful (20%) - via Mysteries tab
- Start Wednesday's Glorious
- Complete it ✅
- **Result**: All old progress cleared (Monday's and Tuesday's)

---

## Technical Implementation

### **1. Storage Structure**

**Before:**
```
rosary_prayer_progress: {
  mysteryType: "luminous",
  currentStepIndex: 45,
  date: "2025-11-28"
}
```

**After (Per-Mystery Storage):**
```
rosary_prayer_progress_joyful: {
  mysteryType: "joyful",
  currentStepIndex: 20,
  date: "2025-11-27"
}

rosary_prayer_progress_sorrowful: {
  mysteryType: "sorrowful",
  currentStepIndex: 10,
  date: "2025-11-28"
}

rosary_prayer_progress_luminous: {
  mysteryType: "luminous",
  currentStepIndex: 45,
  date: "2025-11-27"
}
```

### **2. Updated Functions**

#### **savePrayerProgress(progress)**
- Stores progress with mystery-specific key
- Key format: `rosary_prayer_progress_{mysteryType}`

#### **loadPrayerProgress(mysteryType?)**
- Loads progress for specific mystery type
- If no mysteryType provided, tries legacy single-key storage

#### **clearPrayerProgress(mysteryType?)**
- If mysteryType provided: Clears that specific mystery's progress
- If no mysteryType: Clears ALL prayer progress for all mysteries

#### **hasValidPrayerProgress(mysteryType?)**
- Checks if there's valid progress for today for a specific mystery

### **3. App Flow**

#### **App Launch (AppContext.tsx)**
```tsx
// Always show today's mystery
const todaysMystery = getTodaysMystery();
setCurrentMysterySet(todaysMystery);

// Don't clear old sessions - preserve them for manual selection
```

#### **Start Prayer (MysteryScreen.tsx)**
```tsx
// Load progress for the selected mystery type
const savedProgress = loadPrayerProgress(currentMysterySet);
if (savedProgress && hasValidPrayerProgress(currentMysterySet)) {
    engine.jumpToStep(savedProgress.currentStepIndex);
}
```

#### **Complete Prayer (App.tsx)**
```tsx
completeSession();
clearPrayerProgress(); // Clear ALL mysteries' progress
```

---

## Files Modified

1. **src/utils/storage.ts**
   - Enhanced `savePrayerProgress` to use per-mystery keys
   - Updated `loadPrayerProgress` to accept optional mysteryType
   - Updated `clearPrayerProgress` to support clearing specific or all mysteries
   - Updated `hasValidPrayerProgress` to check specific mystery

2. **src/components/MysteryScreen.tsx**
   - Updated to load progress for specific mystery type
   - Updated to check validity for specific mystery type

3. **src/context/AppContext.tsx**
   - Removed automatic clearing of old sessions
   - Preserved old sessions for manual selection
   - Added clearing of all progress when completing today's mystery

4. **src/App.tsx**
   - Kept `clearPrayerProgress()` call (now clears all mysteries)

---

## Benefits

✅ **User-Friendly**: Users can finish unfinished mysteries at their own pace
✅ **Flexible**: Multiple unfinished mysteries can coexist
✅ **Clean**: Completing today's mystery cleans up all old progress
✅ **Intuitive**: Home screen always shows today's mystery
✅ **Resumable**: Each mystery remembers its own progress independently

---

## Testing Checklist

- [ ] Start Thursday's mystery, don't finish, open on Friday → Friday's mystery shown
- [ ] From Friday, go to Mysteries tab, select Luminous → Resumes Thursday's progress
- [ ] Complete Friday's mystery → All old progress cleared
- [ ] Start multiple mysteries on different days → Each maintains separate progress
- [ ] Complete any mystery → All other unfinished mysteries cleared
