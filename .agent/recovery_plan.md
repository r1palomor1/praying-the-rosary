# Recovery Plan: Restore Stable State & Preserve Features

## Objective
To revert the codebase to the stable commit `770088c` (Working Copy) while preserving the code and logic for the "Learn More" feature and "Clear Progress" updates for controlled re-integration.

## Phase 1: Documentation & Preservation
We will create a comprehensive documentation file (`.agent/feature-preservation.md`) containing:

1.  **Learn More Feature:**
    *   Full source code of `src/components/LearnMoreModal.tsx`.
    *   Full source code of `src/components/LearnMoreModal.css`.
    *   The structure and content of the educational JSON files (`src/data/en-rosary-educational-content.json`, `src/data/es-rosary-educational-content.json`).
    *   The integration logic within `MysteryScreen.tsx` (state management, helper functions like `getCurrentEducationalContent`, and the UI button).

2.  **Clear Progress Logic:**
    *   The updated `handleClearProgress` function from `SettingsModal.tsx` (single-click confirmation logic).
    *   The `handleResetProgress` function from `MysteryScreen.tsx`.
    *   Any changes to `src/utils/storage.ts` if applicable.

3.  **Other Updates:**
    *   The `isIntroPrayer` fix in `MysteryScreen.tsx`.
    *   Style updates in `SettingsModal.css` and `MysteryBottomNav.css`.

## Phase 2: Revert to Stable State
Once preservation is confirmed, we will execute:
```bash
git reset --hard 770088c
```
This will forcefully reset the current branch to the "Working Copy. Good working state prior to Learn More phase" commit, effectively removing the recent changes that caused layout issues.

## Phase 3: Re-integration Strategy (Next Steps)
After the revert, we will have a clean slate. We will then:
1.  Verify the app runs correctly and the cinematic layout is fixed.
2.  Re-introduce the **Clear Progress** logic first (as it is logic-heavy and less likely to break layout).
3.  Re-introduce the **Learn More** feature incrementally, checking the cinematic layout after adding the button and modal to ensure no CSS conflicts occur.

## Approval
Please confirm if this plan meets your requirements. Upon approval, I will proceed with Phase 1 (Documentation) immediately.
