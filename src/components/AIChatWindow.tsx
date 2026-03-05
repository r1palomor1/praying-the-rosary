import React, { useState, useRef, useEffect } from 'react';
import { Send, AlertCircle } from 'lucide-react';
import { useAI } from '../context/AIContext';
import './AIChatWindow.css';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  isError?: boolean;
}

interface AIChatWindowProps {
  contextStr: string;
  topicName?: string;
  initialMessage?: string;
  language?: string;
}

export function AIChatWindow({ contextStr, topicName, initialMessage, language = 'en' }: AIChatWindowProps) {
  const { sendMessage, aiEnabled } = useAI();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle initial greeting if provided
  useEffect(() => {
    if (initialMessage && messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          role: 'ai',
          content: initialMessage
        }
      ]);
    }
  }, [initialMessage, messages.length]);

  const defaultCapsules = language === 'es' ? [
    { label: 'Dar una reflexión', prompt: 'Por favor, dame una breve reflexión sobre esta lectura.' },
    { label: 'Explicar', prompt: '¿Puedes explicar el significado de esta lectura?' },
    { label: 'Contexto histórico', prompt: '¿Cuál es el contexto histórico de este pasaje?' },
    { label: 'Aplicación práctica', prompt: '¿Cómo puedo aplicar las enseñanzas de esta lectura en mi vida diaria?' }
  ] : [
    { label: 'Provide a reflection', prompt: 'Please provide a short reflection on this reading.' },
    { label: 'Explain this', prompt: 'Can you explain the meaning of this reading?' },
    { label: 'Historical context', prompt: 'What is the historical context of this passage?' },
    { label: 'Practical application', prompt: 'How can I apply the teachings of this reading to my daily life?' }
  ];

  const handleSend = async (forcedText?: string) => {
    const textToSubmit = forcedText || inputValue;
    if (!textToSubmit.trim() || !aiEnabled || isLoading) return;

    const userText = textToSubmit.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userText
    };

    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);

    const { response, error } = await sendMessage({
      mysteryName: topicName,
      contextStr,
      language,
      userPrompt: userText
    });

    setIsLoading(false);

    if (error) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: language === 'es' 
          ? 'Lo siento, no pude procesar tu solicitud en este momento.' 
          : 'I am sorry, I could not process your request at this time.',
        isError: true
      }]);
    } else if (response) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'ai',
        content: response
      }]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!aiEnabled) {
    return (
      <div className="ai-chat-container" style={{ padding: '20px', textAlign: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.6)' }}>
          {language === 'es' ? 'El Compañero de IA está desactivado.' : 'AI Companion is disabled.'}
        </p>
      </div>
    );
  }

  return (
    <div className="ai-chat-container">
      <div className="ai-messages-list">
        {messages.map((msg) => (
          <div key={msg.id} className={`ai-message ${msg.role}`}>
            {msg.isError && <AlertCircle size={16} style={{ marginRight: '8px', color: '#ff6b6b' }} />}
            {msg.content}
          </div>
        ))}
        {isLoading && (
          <div className="ai-loading-indicator">
            <div className="ai-loading-dot"></div>
            <div className="ai-loading-dot"></div>
            <div className="ai-loading-dot"></div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {messages.length <= 1 && (
        <div className="ai-capsules-container">
          {defaultCapsules.map((capsule, index) => (
            <button 
              key={index} 
              className="ai-capsule"
              onClick={() => handleSend(capsule.prompt)}
              disabled={isLoading}
            >
              {capsule.label}
            </button>
          ))}
        </div>
      )}

      <div className="ai-input-container">
        <input
          type="text"
          className="ai-chat-input"
          placeholder={language === 'es' ? 'Haz una pregunta espiritual...' : 'Ask a spiritual question...'}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
        />
        <button 
          className="ai-send-button"
          onClick={() => handleSend()}
          disabled={!inputValue.trim() || isLoading}
          aria-label="Send message"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
}