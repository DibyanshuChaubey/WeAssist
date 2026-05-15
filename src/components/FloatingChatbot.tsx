import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, MessageSquare, SendHorizonal, X, Trash2, User } from 'lucide-react';
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

  const lastMessage = messages[messages.length - 1];

  return (
    <div className="fixed z-50 bottom-3 right-2 sm:bottom-6 sm:right-6">
      {isOpen && (
        <section className="mb-3 w-[calc(100vw-1rem)] max-w-[22rem] sm:w-[22rem] h-[calc(100vh-10rem)] sm:h-[28rem] bg-slate-950/95 border border-slate-700/70 rounded-[2rem] shadow-[0_28px_70px_-30px_rgba(15,23,42,0.85)] backdrop-blur-3xl overflow-hidden flex flex-col animate-in fade-in duration-300">
          <header className="px-4 py-3 bg-slate-900/95 text-white flex items-center justify-between border-b border-slate-700/80">
            <div className="flex items-center gap-2">
              <div className="grid place-items-center w-10 h-10 rounded-[1.5rem] bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white shadow-lg">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="font-semibold text-sm tracking-wide uppercase">AI Assistant</p>
                <p className="text-[11px] text-slate-400">
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

          <div className="px-3 py-2 border-b border-slate-700/80 bg-slate-900/90">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="w-full sm:w-auto text-left text-[11px] px-3 py-2 rounded-full border border-slate-700/70 bg-slate-900 text-white hover:bg-slate-800 transition-all duration-200 font-medium"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-2 space-y-2 bg-slate-950">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-xl px-3 py-2 border text-sm ${msg.role === 'user'
                    ? 'bg-emerald-950 text-emerald-100 border border-emerald-500/20 shadow-[0_12px_30px_-20px_rgba(16,185,129,0.45)]'
                    : 'bg-slate-900 text-slate-100 border border-slate-800 shadow-[0_12px_30px_-20px_rgba(15,23,42,0.45)]'
                    }`}
                >
                  <div className="flex items-center gap-1 mb-1 text-[10px] font-semibold uppercase tracking-wide text-white/70">
                    {msg.role === 'user' ? <User size={12} /> : <MessageSquare size={12} />}
                    {msg.role === 'user' ? 'You' : 'Assistant'}
                  </div>
                  <p className="whitespace-pre-wrap leading-snug text-sm">{msg.text}</p>

                  {msg.issues && msg.issues.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {msg.issues.map((issue) => (
                        <div key={issue.id} className="rounded-xl border border-slate-700 px-2 py-1 bg-slate-900 text-xs text-white/90">
                          <p className="font-semibold text-white">{issue.title}</p>
                          <p className="text-purple-300 font-medium">Status: {issue.status}</p>
                          <p className="text-slate-400">ID: {issue.id.slice(0, 8)}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* suggestions moved to sticky area below messages for minimal UI */}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-2xl px-3 py-2.5 border text-sm bg-slate-800 text-white/90 border-slate-700 shadow-sm animate-pulse">
                  Thinking...
                </div>
              </div>
            )}
          </div>

          {/* Sticky minimal suggestions (stays above input) */}
          {(lastMessage?.suggestions?.length ?? 0) > 0 && (
            <div className="sticky bottom-0 z-10 px-3 pb-2 bg-transparent">
              <div className="flex flex-wrap gap-2 text-sm">
                {lastMessage!.suggestions!.map((sug) => (
                  <button
                    key={sug}
                    type="button"
                    onClick={() => sendMessage(sug)}
                    className="text-slate-300 hover:text-white transition-colors text-[13px] cursor-pointer focus:outline-none bg-transparent leading-tight"
                  >
                    {sug}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="border-t border-slate-700/80 bg-slate-950/95 px-3 py-3"
          >
            <div className="flex items-center gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question..."
                className="flex-1 min-h-[3rem] rounded-full border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-[0_0_0_1px_rgba(148,163,184,0.12)] transition-all duration-200 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30 focus:ring-offset-1 focus:ring-offset-slate-950"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="inline-flex h-12 min-w-[3rem] items-center justify-center rounded-full bg-gradient-to-r from-fuchsia-500 to-cyan-500 px-4 text-white shadow-lg transition-all duration-200 hover:from-fuchsia-400 hover:to-cyan-400 disabled:cursor-not-allowed disabled:bg-slate-700"
                aria-label="Send message"
              >
                <SendHorizonal size={18} />
              </button>
            </div>
          </form>
        </section>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="group relative inline-flex items-center gap-2 rounded-full bg-slate-950/95 border border-white/10 text-white px-3 py-2 min-h-[3rem] shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.03]"
          aria-label="Toggle AI assistant"
        >
          <span className="grid place-items-center w-9 h-9 rounded-2xl bg-gradient-to-br from-fuchsia-500 to-cyan-500 text-white shadow-lg">
            <MessageCircle size={18} className="group-hover:scale-110 transition-transform" />
          </span>
          <span className="text-sm font-semibold hidden sm:inline">Ask Support</span>
        </button>
      )}
    </div>
  );
};
