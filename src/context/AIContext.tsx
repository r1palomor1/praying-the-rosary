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

    try {
      const response = await fetch('/api/ai-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || 'Failed to connect to AI Companion.');
      }

      return { response: data.response };
    } catch (error: any) {
      console.error('AI Companion Error:', error);
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
