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

const getRoleQuickPrompts = (isAuthenticated: boolean, role?: 'student' | 'admin'): string[] => {
  if (!isAuthenticated) {
    return [
      'How does account verification work?',
      'How do event registrations work?',
      'Sign in and ask: What is my latest issue status?',
      'What can this assistant help with?',
    ];
  }

  if (role === 'admin') {
    return [
      'Which open issues need immediate admin action?',
      'Show issue lifecycle rules for admins',
      'How can students close resolved issues?',
      'How do I update issue status correctly?',
    ];
  }

  return [
    'What is my latest issue status?',
    'How do I report a new issue?',
    'How do I close a resolved issue?',
    'How do event registrations work?',
  ];
};

const getInitialMessage = (isAuthenticated: boolean, role?: 'student' | 'admin'): ChatMessage => {
  if (!isAuthenticated) {
    return {
      id: 'initial-assistant-message',
      role: 'assistant',
      text: 'I can help with account verification, events info, and general platform guidance. Sign in for personalized issue tracking help.',
    };
  }

  if (role === 'admin') {
    return {
      id: 'initial-assistant-message',
      role: 'assistant',
      text: 'I can help you prioritize open issues, follow lifecycle rules, and guide admin workflow decisions.',
    };
  }

  return {
    id: 'initial-assistant-message',
    role: 'assistant',
    text: 'I can help you track your issue status, report new issues, and understand verification and event registration.',
  };
};

// Store max 10 messages in localStorage to avoid bloat
const MAX_STORED_MESSAGES = 10;

const getStorageKey = (isAuthenticated: boolean, userId?: string): string => {
  if (isAuthenticated && userId) {
    return `chatbot_history_${userId}`;
  }
  return 'chatbot_history_anonymous';
};

const loadMessagesFromStorage = (storageKey: string, initialMessage: ChatMessage): ChatMessage[] => {
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
  return [initialMessage];
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
  const role = currentUser?.role;
  const quickPrompts = useMemo(() => getRoleQuickPrompts(isAuthenticated, role), [isAuthenticated, role]);
  const initialMessage = useMemo(() => getInitialMessage(isAuthenticated, role), [isAuthenticated, role]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const listRef = useRef<HTMLDivElement | null>(null);
  const storageKeyRef = useRef<string>(getStorageKey(isAuthenticated, currentUser?.id));

  const shouldHide = useMemo(() => location.pathname === '/assistant', [location.pathname]);

  // Load messages from localStorage on mount
  useEffect(() => {
    const newStorageKey = getStorageKey(isAuthenticated, currentUser?.id);
    storageKeyRef.current = newStorageKey;
    
    // Only load from storage if we have some saved messages
    // Add initial message back if loading persisted messages
    const loadedMessages = loadMessagesFromStorage(newStorageKey, initialMessage);
    setMessages(loadedMessages);
  }, [isAuthenticated, currentUser?.id, initialMessage]);

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
    setMessages([initialMessage]);
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
    <div className="fixed z-50 bottom-3 right-2 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section className="mb-3 w-[calc(100vw-1rem)] max-w-[24rem] sm:w-[24rem] h-[calc(100vh-8.5rem)] sm:h-[31rem] bg-white rounded-2xl border border-transparent shadow-2xl overflow-hidden flex flex-col animate-in fade-in duration-300">
          <header className="px-4 py-3 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="animate-pulse" />
              <div>
                <p className="font-bold text-sm">✨ AI Assistant</p>
                <p className="text-[11px] text-purple-100">
                  {isAuthenticated ? 'Personalized support enabled' : 'Sign in for personal issue status'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={clearChatHistory}
                className="p-1.5 rounded-lg hover:bg-white/30 transition-all duration-200 hover:scale-110"
                title="Clear chat history"
                aria-label="Clear chat history"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/30 transition-all duration-200 hover:scale-110"
                aria-label="Close assistant"
              >
                <X size={16} />
              </button>
            </div>
          </header>

          <div className="px-3 py-3 border-b border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50">
            <div className="flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="w-full sm:w-auto text-left text-[11px] px-2.5 py-1.5 rounded-full border border-purple-200 bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 hover:from-purple-200 hover:to-pink-200 transition-all duration-200 font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-3 space-y-3 bg-gradient-to-b from-slate-50 to-purple-50/30">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-3 py-2.5 border text-sm ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white border-transparent shadow-md'
                      : 'bg-white text-gray-800 border-purple-100 shadow-sm'
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
                        <div key={issue.id} className="rounded-lg border border-purple-200 px-2.5 py-2 bg-gradient-to-r from-purple-50 to-pink-50 text-xs">
                          <p className="font-semibold text-gray-900">{issue.title}</p>
                          <p className="text-purple-700 font-medium">Status: {issue.status}</p>
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
                          className="text-[11px] px-2 py-1 rounded-full border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition-all duration-200 font-medium"
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
                <div className="max-w-[88%] rounded-2xl px-3 py-2.5 border text-sm bg-white text-gray-700 border-purple-100 shadow-sm animate-pulse">
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
            className="border-t border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 px-3 py-2"
          >
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 px-3 py-2.5 text-sm rounded-xl border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 bg-white"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-400 text-white transition-all duration-200"
                aria-label="Send message"
              >
                <SendHorizonal size={16} />
              </button>
            </div>
          </form>
        </section>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white px-4 py-3 min-h-11 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110 hover:-translate-y-1"
          aria-label="Toggle AI assistant"
        >
          <Bot size={18} className="group-hover:scale-110 transition-transform" />
          <span className="text-sm font-bold hidden sm:inline">Ask AI</span>
        </button>
      )}
    </div>
  );
};
