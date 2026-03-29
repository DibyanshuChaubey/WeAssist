import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Bot, SendHorizonal, Sparkles, X, Trash2, User } from 'lucide-react';
import { chatbotService, ChatbotIssueSummary } from '../services/api';
import { useAuth } from '../context/AuthContext';

type MessageRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  suggestions?: string[];
  issues?: ChatbotIssueSummary[];
}

const QUICK_PROMPTS = [
  'What is my latest issue status?',
  'How does account verification work?',
  'How do I report a new issue?',
  'How do event registrations work?',
];

const INITIAL_MESSAGE: ChatMessage = {
  id: 'initial-assistant-message',
  role: 'assistant',
  text: 'Ask me about issue status, account verification, issue lifecycle, or event registration.',
};

// Store max 10 messages in localStorage to avoid bloat
const MAX_STORED_MESSAGES = 10;

const getStorageKey = (isAuthenticated: boolean, userId?: string): string => {
  if (isAuthenticated && userId) {
    return `chatbot_history_${userId}`;
  }
  return 'chatbot_history_anonymous';
};

const loadMessagesFromStorage = (storageKey: string): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that it's an array of ChatMessage objects
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Failed to load chat history from localStorage:', error);
  }
  // Return initial message if nothing stored or error
  return [INITIAL_MESSAGE];
};

const saveMessagesToStorage = (storageKey: string, messages: ChatMessage[]): void => {
  try {
    // Don't save the initial message, and limit to last MAX_STORED_MESSAGES
    const messagesToSave = messages
      .filter((msg) => msg.id !== 'initial-assistant-message')
      .slice(-MAX_STORED_MESSAGES);

    if (messagesToSave.length === 0) {
      // If no messages to save, clear storage
      localStorage.removeItem(storageKey);
    } else {
      localStorage.setItem(storageKey, JSON.stringify(messagesToSave));
    }
  } catch (error) {
    console.error('Failed to save chat history to localStorage:', error);
  }
};

export const FloatingChatbot: React.FC = () => {
  const location = useLocation();
  const { isAuthenticated, currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const storageKeyRef = useRef<string>(getStorageKey(isAuthenticated, currentUser?.id));

  const shouldHide = useMemo(() => location.pathname === '/assistant', [location.pathname]);

  // Load messages from localStorage on mount
  useEffect(() => {
    const newStorageKey = getStorageKey(isAuthenticated, currentUser?.id);
    storageKeyRef.current = newStorageKey;
    
    // Only load from storage if we have some saved messages
    // Add initial message back if loading persisted messages
    const loadedMessages = loadMessagesFromStorage(newStorageKey);
    setMessages(loadedMessages);
  }, [isAuthenticated, currentUser?.id]);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    saveMessagesToStorage(storageKeyRef.current, messages);
  }, [messages]);

  // Scroll to bottom when messages update
  useEffect(() => {
    if (!isOpen || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages, isOpen]);

  const clearChatHistory = () => {
    // Reset to initial message
    setMessages([INITIAL_MESSAGE]);
    // Clear localStorage
    localStorage.removeItem(storageKeyRef.current);
  };

  const sendMessage = async (overrideMessage?: string) => {
    const text = (overrideMessage ?? input).trim();
    if (!text || isLoading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: `${Date.now()}-user`,
        role: 'user',
        text,
      },
    ]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatbotService.ask(text);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          text: response.reply,
          issues: response.data?.issues,
          suggestions: response.suggestions,
        },
      ]);
    } catch (error) {
      console.error('Floating chatbot request failed:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant-error`,
          role: 'assistant',
          text: 'I could not respond right now. Please try again in a few seconds.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (shouldHide) {
    return null;
  }

  return (
    <div className="fixed z-50 bottom-5 right-5 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section className="mb-3 w-[calc(100vw-2rem)] sm:w-[24rem] h-[31rem] bg-white rounded-2xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col">
          <header className="px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={16} />
              <div>
                <p className="font-semibold text-sm">AI Assistant</p>
                <p className="text-[11px] text-blue-100">
                  {isAuthenticated ? 'Personalized support enabled' : 'Sign in for personal issue status'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChatHistory}
                className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
                title="Clear chat history"
                aria-label="Clear chat history"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md hover:bg-white/20 transition-colors"
                aria-label="Close assistant"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="px-3 py-2 border-b border-gray-200 bg-white">
            <div className="flex flex-wrap gap-1.5">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="text-[11px] px-2.5 py-1 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-slate-50">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2.5 border text-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-800 border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-semibold uppercase tracking-wide opacity-80">
                    {msg.role === 'user' ? <User size={12} /> : <Bot size={12} />}
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>

                  {msg.issues && msg.issues.length > 0 && (
                    <div className="mt-2.5 space-y-2">
                      {msg.issues.map((issue) => (
                        <div key={issue.id} className="rounded-lg border border-gray-200 px-2.5 py-2 bg-gray-50 text-xs">
                          <p className="font-semibold text-gray-900">{issue.title}</p>
                          <p className="text-gray-600">Status: {issue.status}</p>
                          <p className="text-gray-500">ID: {issue.id.slice(0, 8)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.suggestions && msg.suggestions.length > 0 && index === messages.length - 1 && (
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {msg.suggestions.map((suggestion) => (
                        <button
                          key={`${msg.id}-${suggestion}`}
                          type="button"
                          onClick={() => sendMessage(suggestion)}
                          className="text-[11px] px-2 py-1 rounded-full border border-gray-300 hover:bg-gray-100 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-2xl px-3 py-2.5 border text-sm bg-white text-gray-700 border-gray-200">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="border-t border-gray-200 bg-white px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white transition-colors"
                aria-label="Send message"
              >
                <SendHorizonal size={16} />
              </button>
            </div>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="ml-auto group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-4 py-3 shadow-xl hover:shadow-2xl transition-all"
        aria-label="Toggle AI assistant"
      >
        <Bot size={18} className="group-hover:scale-110 transition-transform" />
        <span className="text-sm font-semibold">AI Help</span>
      </button>
    </div>
  );
};
