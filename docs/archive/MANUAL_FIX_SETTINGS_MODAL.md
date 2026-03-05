# Manual Fix for SettingsModal.tsx

## Problem:
Lines 5-6 import deleted Sherpa files, causing 19 lint errors.

## Solution:
Delete these two lines from `src/components/SettingsModal.tsx`:

```
Line 5: import { getSherpaError, getSherpaState } from '../utils/sherpaTTS';
Line 6: import { ttsManager } from '../utils/ttsManager';
```

## How to Fix Manually:
1. Open `src/components/SettingsModal.tsx`
2. Go to lines 5-6
3. Delete both lines
4. Save the file

That's it! The file will be clean with zero errors.

The rest of the Sherpa removal is complete (~280MB freed).
