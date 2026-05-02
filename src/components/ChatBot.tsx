import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import { askGemini } from '../services/geminiService';
import { cn } from '../lib/utils';

interface Message {
  role: 'user' | 'model';
  content: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { role: 'model', content: 'Hi! I am your RoomZy assistant. How can I help you today?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const chatHistory = messages.slice(1).map(m => ({ role: m.role, content: m.content }));
      const response = await askGemini(userMessage, chatHistory);
      
      if (response) {
        setMessages(prev => [...prev, { role: 'model', content: response }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', content: "I'm sorry, I encountered an error. Please try again later." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div
          className="mb-4 h-[500px] w-[350px] overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl flex flex-col sm:w-[400px]"
          id="chatbot-window"
        >
          {/* Header */}
          <div className="bg-neutral-900 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-600">
                <Bot className="h-6 w-6" />
              </div>
              <div>
                <h3 className="font-bold text-sm">RoomZy Assistant</h3>
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  <span className="text-[10px] text-neutral-400 font-medium uppercase tracking-wider">Online</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="rounded-full p-2 hover:bg-white/10 transition-colors"
              id="close-chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50/50">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={cn(
                  "flex gap-3 max-w-[85%]",
                  message.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                )}
              >
                <div className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border",
                  message.role === 'user' ? "bg-white border-neutral-200" : "bg-orange-600 border-transparent text-white"
                )}>
                  {message.role === 'user' ? <User className="h-4 w-4 text-neutral-400" /> : <Bot className="h-4 w-4" />}
                </div>
                <div className={cn(
                  "rounded-2xl px-4 py-2 text-sm shadow-sm",
                  message.role === 'user' 
                    ? "bg-neutral-900 text-white rounded-tr-none" 
                    : "bg-white text-neutral-700 border border-neutral-100 rounded-tl-none"
                )}>
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 mr-auto items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-600 text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-white rounded-2xl px-4 py-2 border border-neutral-100 shadow-sm flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-orange-600" />
                  <span className="text-xs text-neutral-400 font-medium">Assistant is thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-neutral-100 bg-white">
            <div className="relative">
              <input
                type="text"
                placeholder="Type your message..."
                className="w-full rounded-2xl border border-neutral-200 bg-neutral-50 py-3 pl-4 pr-12 text-sm focus:border-orange-500 focus:outline-none transition-all"
                value={input}
                onChange={e => setInput(e.target.value)}
                id="chat-input"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1.5 rounded-xl bg-neutral-900 p-1.5 text-white transition-all hover:bg-neutral-800 disabled:opacity-50"
                id="send-button"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] text-center text-neutral-400 flex items-center justify-center gap-1">
              <Sparkles className="h-3 w-3 text-orange-500" />
              Powered by Gemini AI
            </p>
          </form>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full shadow-2xl transition-all duration-300",
          isOpen ? "bg-neutral-900 text-white" : "bg-orange-600 text-white"
        )}
        id="chatbot-toggle"
      >
        {isOpen ? <X className="h-8 w-8" /> : <MessageSquare className="h-8 w-8" />}
      </button>
    </div>
  );
}
