import React, { useState } from 'react';
import { Navigation } from '../components';
import { chatbotService, ChatbotIssueSummary } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Bot, SendHorizonal, User, Sparkles, Trash2 } from 'lucide-react';

type MessageRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  issues?: ChatbotIssueSummary[];
  suggestions?: string[];
}

const QUICK_PROMPTS = [
  'What is my latest issue status?',
  'How does account verification work?',
  'How do I report a new issue?',
  'How do event registrations work?',
];

const INITIAL_ASSISTANT_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text: 'Ask me about issue status, account verification, issue lifecycle, or event registration.',
};

export const AssistantPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_ASSISTANT_MESSAGE]);

  const clearConversation = () => {
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setInput('');
  };

  const sendMessage = async (rawMessage?: string) => {
    const message = (rawMessage ?? input).trim();
    if (!message || isLoading) return;

    const userMessage: ChatMessage = { id: `${Date.now()}-user`, role: 'user', text: message };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await chatbotService.ask(message);
      const assistantMessage: ChatMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        text: response.reply,
        issues: response.data?.issues,
        suggestions: response.suggestions,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-error`,
          role: 'assistant',
          text: 'I could not process that request right now. Please try again.',
        },
      ]);
      console.error('Chatbot request failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell relative min-h-screen">
      <Navigation />

      <main className="container-padded mx-auto max-w-5xl space-y-6 py-8">
        {/* Header Section */}
        <div className="ios-surface-strong rounded-[30px] p-6 sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-200/70 bg-white/75 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700 shadow-sm backdrop-blur-sm">
                <Sparkles size={14} />
                AI-powered support
              </div>
              <h1 className="text-3xl font-black tracking-[-0.03em] text-slate-900 sm:text-4xl">
                WeAssist AI Assistant
              </h1>
              <p className="text-sm text-slate-600">
                Get instant answers about your issues, events, and account. Signed in as <span className="font-semibold text-slate-900">{currentUser?.name}</span>.
              </p>
            </div>
            <button
              type="button"
              onClick={clearConversation}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-white hover:shadow-md active:translate-y-[1px]"
            >
              <Trash2 size={16} />
              <span>Clear Chat</span>
            </button>
          </div>
        </div>

        {/* Quick Prompts - Horizontally Scrollable */}
        <div className="space-y-3">
          <p className="px-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Quick questions</p>
          <div className="overflow-x-auto scrollbar-hide">
            <div className="flex gap-2 pb-2">
              {QUICK_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => sendMessage(prompt)}
                  className="group relative shrink-0 overflow-hidden rounded-2xl border border-blue-200/60 bg-gradient-to-br from-blue-50 to-indigo-50 px-4 py-3 text-left text-sm font-medium text-blue-900 shadow-sm transition-all hover:border-blue-300/80 hover:shadow-md active:translate-y-[1px] whitespace-nowrap min-w-max"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 transition-opacity group-hover:opacity-30" />
                  <span className="relative flex items-center gap-2">
                    <span className="text-base">✨</span>
                    {prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <section className="ios-surface-strong overflow-hidden rounded-[30px] shadow-lg">
          {/* Chat Messages */}
          <div className="h-[58vh] space-y-4 overflow-y-auto bg-white/50 p-4 sm:p-6 dark:bg-slate-900/20">
            {messages.map((msg, index) => {
              const isUserMessage = msg.role === 'user';
              const msgBubbleClass = isUserMessage
                ? 'bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-600 text-white shadow-lg shadow-blue-500/20'
                : 'ios-surface border border-slate-200/80 text-slate-900 dark:text-slate-100';
              const headerClass = isUserMessage ? 'text-white/80' : 'text-slate-500';
              const justifyClass = isUserMessage ? 'justify-end' : 'justify-start';

              return (
                <div key={msg.id} className={`flex animate-fade-in ${justifyClass}`}>
                  <div className={`max-w-[82%] space-y-2 rounded-[24px] px-4 py-3 sm:px-5 sm:py-4 ${msgBubbleClass}`}>
                    <div className={`flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] ${headerClass}`}>
                      {isUserMessage ? <User size={13} /> : <Bot size={13} />}
                      {isUserMessage ? 'You' : 'Assistant'}
                    </div>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed sm:text-base">{msg.text}</p>

                    {msg.issues && msg.issues.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-current pt-3 opacity-90">
                        {msg.issues.map((issue) => {
                          const issueClass = isUserMessage
                            ? 'border-white/30 bg-white/10 text-white'
                            : 'border-blue-200/60 bg-blue-50/80 text-blue-900 dark:border-blue-400/30 dark:bg-blue-950/30 dark:text-blue-100';
                          return (
                            <div key={issue.id} className={`rounded-2xl border px-3 py-2.5 text-xs sm:text-sm ${issueClass}`}>
                              <p className="font-semibold">{issue.title}</p>
                              <p className="mt-1 opacity-80">Status: {issue.status}</p>
                              <p className="mt-1 text-[10px] opacity-60">ID: {issue.id}</p>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {msg.suggestions && msg.suggestions.length > 0 && index === messages.length - 1 && (
                      <div className="mt-3 flex flex-wrap gap-2 border-t border-current pt-3 opacity-90">
                        {msg.suggestions.map((suggestion) => {
                          const suggestionClass = isUserMessage
                            ? 'border-white/30 bg-white/15 text-white hover:bg-white/25'
                            : 'border-slate-200/70 bg-white/80 text-slate-700 hover:bg-white dark:border-slate-600/50 dark:bg-slate-800/40 dark:text-slate-200 dark:hover:bg-slate-700/60';
                          return (
                            <button
                              key={`${msg.id}-${suggestion}`}
                              type="button"
                              onClick={() => sendMessage(suggestion)}
                              className={`group relative rounded-2xl border px-3 py-1.5 text-xs font-medium transition-all hover:translate-y-[-1px] ${suggestionClass}`}
                            >
                              {suggestion}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex animate-fade-in justify-start">
                <div className="ios-surface space-y-2 rounded-[24px] border border-slate-200/80 px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-500 dark:bg-slate-400" style={{ animationDelay: '0ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-500 dark:bg-slate-400" style={{ animationDelay: '150ms' }} />
                      <div className="h-2 w-2 animate-bounce rounded-full bg-slate-500 dark:bg-slate-400" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span>Assistant is thinking</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-200/80 bg-gradient-to-b from-white/80 to-white/40 p-4 sm:p-6 dark:from-slate-800/60 dark:to-slate-900/40">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2 sm:gap-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your issues or events..."
                className="form-input flex-1 rounded-2xl"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="btn-primary inline-flex shrink-0 items-center gap-2 rounded-2xl px-4 py-2.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <SendHorizonal size={16} />
                <span className="hidden sm:inline">Send</span>
              </button>
            </form>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Press Enter or click Send to ask your question</p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AssistantPage;
