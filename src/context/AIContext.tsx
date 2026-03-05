import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AIContextType {
  aiEnabled: boolean;
  setAiEnabled: (enabled: boolean) => void;
  sendMessage: (payload: { mysteryName?: string; contextStr: string; language: string; userPrompt: string }) => Promise<{ response?: string; error?: string }>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [aiEnabled, setAiEnabledState] = useState<boolean>(true);

  // Load initial settings
  useEffect(() => {
    const savedSettings = localStorage.getItem('rosary_ai_settings');
    if (savedSettings) {
      try {
        const { enabled } = JSON.parse(savedSettings);
        setAiEnabledState(enabled);
      } catch (e) {
        console.error('Failed to parse AI settings', e);
      }
    }
  }, []);

  const setAiEnabled = (enabled: boolean) => {
    setAiEnabledState(enabled);
    localStorage.setItem('rosary_ai_settings', JSON.stringify({ enabled }));
  };

  const sendMessage = async (payload: { mysteryName?: string; contextStr: string; language: string; userPrompt: string }) => {
    if (!aiEnabled) {
      return { error: 'AI features are currently disabled.' };
    }

      console.log('[AI Debug] Attempting to send message to /api/ai-chat');
      console.log('[AI Debug] Payload:', JSON.stringify({ ...payload, contextStr: payload.contextStr.substring(0, 50) + '...' })); // Truncated context for clean logs

      try {
        const response = await fetch('/api/ai-chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        });

        console.log(`[AI Debug] Response Status: ${response.status} ${response.statusText}`);
        
        // Read raw text first so we can debug HTML/500 errors if JSON parse fails
        const rawText = await response.text();
        console.log(`[AI Debug] Raw Response Body:`, rawText.substring(0, 200) + (rawText.length > 200 ? '...' : ''));

        let data;
        try {
          data = JSON.parse(rawText);
        } catch (jsonErr) {
          console.error('[AI Debug] Failed to parse JSON response. Server returned non-JSON format.');
          throw new Error('Invalid server response format. Check debug panel.');
        }

        if (!response.ok) {
          // If data.error is a boolean, grab data.message or data.details
          const errMsg = typeof data.error === 'string' ? data.error : (data.details || data.message || 'Unknown server error');
          console.error(`[AI Debug] Server returned error state: ${errMsg}`);
          throw new Error(errMsg);
        }

        return { response: data.response };
      } catch (error: any) {
        console.error('[AI Debug] Catch Block Hit. AI Companion Error:', error.message || error);
        return { error: error.message || 'An unexpected error occurred.' };
      }
    };

    return (
      <AIContext.Provider value={{ aiEnabled, setAiEnabled, sendMessage }}>
        {children}
      </AIContext.Provider>
    );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (context === undefined) {
    throw new Error('useAI must be used within an AIProvider');
  }
  return context;
};
