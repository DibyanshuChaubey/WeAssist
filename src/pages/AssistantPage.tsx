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
  const [messages, setMessages] = useState<ChatMessage[]>([
    INITIAL_ASSISTANT_MESSAGE,
  ]);

  const clearConversation = () => {
    setMessages([INITIAL_ASSISTANT_MESSAGE]);
    setInput('');
  };

  const sendMessage = async (rawMessage?: string) => {
    const message = (rawMessage ?? input).trim();
    if (!message || isLoading) return;

    const userMessage: ChatMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      text: message,
    };
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
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <section className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 inline-flex items-center gap-2">
              <Sparkles size={20} className="text-blue-600" />
              WeAssist AI Assistant
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Signed in as {currentUser?.name}. Ask naturally and get quick, accurate help.
            </p>
          </div>
          <button
            type="button"
            onClick={clearConversation}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Trash2 size={14} />
            Clear Chat
          </button>
        </section>

        <section className="mb-4">
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendMessage(prompt)}
                className="text-xs sm:text-sm px-3 py-1.5 rounded-full border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        <section className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          <div className="h-[56vh] overflow-y-auto p-4 sm:p-6 space-y-4">
            {messages.map((msg, index) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                    <span className="text-xs font-semibold uppercase tracking-wide">
                      {msg.role === 'user' ? 'You' : 'Assistant'}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base whitespace-pre-wrap">{msg.text}</p>

                  {msg.issues && msg.issues.length > 0 && (
                    <div className="mt-3 space-y-2">
                      {msg.issues.map((issue) => (
                        <div
                          key={issue.id}
                          className="bg-white/80 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        >
                          <p className="font-semibold text-gray-900">{issue.title}</p>
                          <p className="text-gray-700">Status: {issue.status}</p>
                          <p className="text-xs text-gray-500">ID: {issue.id}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {msg.suggestions && msg.suggestions.length > 0 && index === messages.length - 1 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {msg.suggestions.map((suggestion) => (
                        <button
                          key={`${msg.id}-${suggestion}`}
                          type="button"
                          onClick={() => sendMessage(suggestion)}
                          className="text-xs px-2.5 py-1.5 rounded-full border border-gray-300 hover:bg-gray-200 transition-colors"
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
                <div className="bg-gray-100 border border-gray-200 rounded-2xl px-4 py-3 text-sm text-gray-600">
                  Assistant is thinking...
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask: What is my latest issue status?"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium transition-colors inline-flex items-center gap-2"
              >
                <SendHorizonal size={16} />
                Send
              </button>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AssistantPage;
