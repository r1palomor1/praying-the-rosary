import { useCallback } from 'react';

type Tab = 'home' | 'progress' | 'mysteries' | 'prayers' | 'settings';

interface UseNavigationHandlerProps {
    onNavigateHome?: () => void;
    onNavigateToProgress?: () => void;
    onNavigateToMysteries?: () => void;
    onNavigateToPrayers?: () => void;
    onNavigateToSettings?: () => void;
}

/**
 * A shared hook to centralize navigation logic for the BottomNav component.
 * This ensures consistent navigation behavior across different screens.
 */
export function useNavigationHandler({
    onNavigateHome,
    onNavigateToProgress,
    onNavigateToMysteries,
    onNavigateToPrayers,
    onNavigateToSettings
}: UseNavigationHandlerProps) {
    return useCallback((tab: Tab) => {
        switch (tab) {
            case 'home':
                onNavigateHome?.();
                break;
            case 'progress':
                onNavigateToProgress?.();
                break;
            case 'mysteries':
                onNavigateToMysteries?.();
                break;
            case 'prayers':
                onNavigateToPrayers?.();
                break;
            case 'settings':
                onNavigateToSettings?.();
                break;
        }
    }, [onNavigateHome, onNavigateToProgress, onNavigateToMysteries, onNavigateToPrayers, onNavigateToSettings]);
}
