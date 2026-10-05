import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, X, Send, Sparkles, AlertCircle } from 'lucide-react';
import api from '../services/api';

interface Message {
  sender: 'user' | 'ai';
  text: string;
}

export default function RailAiWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const location = useLocation();
  const navigate = useNavigate();
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Extract trainNumber context from path (/trains/12760) or search (?train=12760)
  const getTrainContext = (): string => {
    const pathParts = location.pathname.split('/');
    if (pathParts[1] === 'trains' && pathParts[2]) {
      return pathParts[2];
    }
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('train') || '';
  };

  const trainCtx = getTrainContext();
  const isAuthenticated = !!localStorage.getItem('accessToken');

  useEffect(() => {
    // Add welcome message on widget open
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          sender: 'ai',
          text: trainCtx
            ? `Hi! I see you are tracking train No. ${trainCtx}. Ask me anything about its delay status, route schedule, or halting details!`
            : "Hello! I am RailAI, your virtual railroad assistant. Ask me questions about delays, route timetables, or alert settings!"
        }
      ]);
    }
  }, [isOpen, trainCtx]);

  useEffect(() => {
    // Scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    setError('');
    const newMsg: Message = { sender: 'user', text: textToSend };
    setMessages((prev) => [...prev, newMsg]);
    setInput('');
    setLoading(true);

    try {
      const response: any = await api.post('/api/v1/railai/chat', {
        prompt: textToSend,
        trainNumber: trainCtx
      });

      if (response.success && response.data) {
        setMessages((prev) => [...prev, { sender: 'ai', text: response.data.response }]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to communicate with RailAI');
      setMessages((prev) => [
        ...prev,
        { sender: 'ai', text: 'Sorry, I encountered an error connecting to my services. Please try again.' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestClick = (suggestion: string) => {
    handleSendMessage(suggestion);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-3.5 rounded-full shadow-2xl hover:shadow-indigo-500/20 hover:scale-105 transition-all cursor-pointer flex items-center justify-center border border-indigo-500/40 relative group"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          {/* Tooltip */}
          <div className="absolute right-14 bg-slate-900 border border-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
            Chat with RailAI
          </div>
        </button>
      )}

      {/* Slide-out Chat Panel */}
      {isOpen && (
        <div className="bg-slate-900/95 border border-slate-800/80 w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
          <div className="bg-slate-950/60 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 bg-indigo-950 rounded-lg text-indigo-400 border border-indigo-900/40">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-sm">RailAI Assistant</h4>
                <div className="flex items-center space-x-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-450 hover:text-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Body */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!isAuthenticated ? (
              <div className="text-center py-20 text-slate-450 space-y-4 px-6">
                <AlertCircle className="h-10 w-10 mx-auto text-amber-500 opacity-60" />
                <div className="space-y-1">
                  <p className="font-bold text-slate-200 text-sm">Authentication Required</p>
                  <p className="text-xs">Log in to converse with the RailAI copilot and fetch live running telemetry.</p>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    navigate('/login');
                  }}
                  className="bg-indigo-650 hover:bg-indigo-500 text-white w-full py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <>
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none'
                          : 'bg-slate-950/80 border border-slate-850 text-slate-250 rounded-tl-none'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-950/80 border border-slate-850 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 flex items-center space-x-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                      <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-950/20 border border-red-900/30 p-2.5 rounded-lg flex items-center space-x-1.5 text-red-400 text-[10px]">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </>
            )}
          </div>

          {/* Quick suggestions chips */}
          {isAuthenticated && (
            <div className="px-4 py-2 bg-slate-950/20 border-t border-slate-850/60 overflow-x-auto flex space-x-2 scrollbar-none shrink-0 select-none">
              {trainCtx ? (
                <>
                  <button
                    onClick={() => handleSuggestClick('Is my train late?')}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                  >
                    Is this train late?
                  </button>
                  <button
                    onClick={() => handleSuggestClick('Show route schedule.')}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                  >
                    Stops timetable
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSuggestClick('How do I set up alerts?')}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                  >
                    Setup custom alerts
                  </button>
                  <button
                    onClick={() => handleSuggestClick('What is RailAI?')}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                  >
                    Who are you?
                  </button>
                </>
              )}
            </div>
          )}

          {/* Input Footer Bar */}
          {isAuthenticated && (
            <div className="p-3 bg-slate-950/60 border-t border-slate-800 flex items-center space-x-2 shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(input)}
                disabled={loading}
                className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl flex-grow px-3 py-2 text-slate-205 text-slate-200 outline-none text-xs placeholder:text-slate-650"
                placeholder="Ask RailAI something..."
              />
              <button
                onClick={() => handleSendMessage(input)}
                disabled={!input.trim() || loading}
                className="bg-indigo-650 hover:bg-indigo-500 text-white p-2 rounded-xl transition-all cursor-pointer disabled:opacity-40 disabled:hover:bg-indigo-650 flex items-center justify-center shrink-0"
              >
                <Send className="h-4.5 w-4.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
