import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { X, Send, AlertCircle, Brain, Search, Zap, CheckCircle2, Cpu } from 'lucide-react';
import api from '../services/api';

interface RailAiResponseData {
  response: string;
  toolsUsed?: string[];
  confidence?: string;
  responseType?: string;
}

interface Message {
  sender: 'user' | 'ai';
  text: string;
  toolsUsed?: string[];
  confidence?: string;
  responseType?: string;
}

// Simple markdown-like text renderer
function renderFormattedText(text: string) {
  // Split into lines and process
  const lines = text.split('\n');
  const elements: ReactNode[] = [];
  let listItems: string[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${listKey++}`} className="ml-3 space-y-1 my-1.5">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start space-x-1.5">
              <span className="text-indigo-400 mt-0.5 shrink-0">•</span>
              <span>{processInlineFormatting(item)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    // Bullet points
    if (trimmed.startsWith('• ') || trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      listItems.push(trimmed.substring(2));
      return;
    }

    flushList();

    // Headers
    if (trimmed.startsWith('### ')) {
      elements.push(<h5 key={idx} className="font-bold text-slate-200 mt-2 mb-1 text-[11px] uppercase tracking-wide">{trimmed.substring(4)}</h5>);
    } else if (trimmed.startsWith('## ')) {
      elements.push(<h4 key={idx} className="font-bold text-slate-100 mt-2 mb-1">{trimmed.substring(3)}</h4>);
    } else if (trimmed.startsWith('# ')) {
      elements.push(<h3 key={idx} className="font-bold text-white mt-2 mb-1">{trimmed.substring(2)}</h3>);
    } else if (trimmed === '') {
      elements.push(<div key={idx} className="h-1.5" />);
    } else {
      elements.push(<p key={idx} className="my-0.5">{processInlineFormatting(trimmed)}</p>);
    }
  });

  flushList();
  return <>{elements}</>;
}

function processInlineFormatting(text: string): ReactNode {
  // Bold: **text**
  const parts: ReactNode[] = [];
  const regex = /\*\*(.*?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    parts.push(<strong key={match.index} className="font-semibold text-slate-100">{match[1]}</strong>);
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts}</>;
}

// Tool name to friendly display
const TOOL_LABELS: Record<string, { icon: string; label: string }> = {
  'get_train_live_status': { icon: '🚄', label: 'Live Status' },
  'get_train_route': { icon: '🗺️', label: 'Route Info' },
  'get_station_board': { icon: '🏗️', label: 'Station Board' },
  'get_live_station_board': { icon: '📡', label: 'Live Board' },
  'get_trains_between_stations': { icon: '🔗', label: 'Route Search' },
  'search_trains': { icon: '🔍', label: 'Train Search' },
  'search_stations': { icon: '📍', label: 'Station Search' },
};

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
            ? `Hi! I see you are tracking train No. **${trainCtx}**. I can investigate its delays, check live status, show route details, and answer any railway questions!\n\nTry asking:\n• "Why is my train delayed?"\n• "Show the route schedule"\n• "What stations has it passed?"`
            : "Hello! I am **RailAI**, your intelligent Indian Railways assistant powered by Gemini AI.\n\nI can:\n• Check live train status & delays\n• Show route schedules & stations\n• Find trains between cities\n• Investigate delay causes\n\nAsk me anything about Indian Railways!",
          responseType: 'GENERAL'
        }
      ]);
    }
  }, [isOpen, trainCtx]);

  useEffect(() => {
    // Scroll to bottom
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    const handleOpenWithPrompt = (e: any) => {
      const prompt = e.detail?.prompt;
      setIsOpen(true);
      if (prompt) {
        setTimeout(() => {
          handleSendMessage(prompt);
        }, 150);
      }
    };
    window.addEventListener('rail-ai:open' as any, handleOpenWithPrompt);
    return () => window.removeEventListener('rail-ai:open' as any, handleOpenWithPrompt);
  }, []);

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
        const data: RailAiResponseData = response.data;
        setMessages((prev) => [...prev, {
          sender: 'ai',
          text: data.response,
          toolsUsed: data.toolsUsed,
          confidence: data.confidence,
          responseType: data.responseType
        }]);
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
    <div className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] right-3 sm:bottom-6 sm:right-6 z-50 flex flex-col items-end">
      {/* Floating Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white p-3.5 rounded-full shadow-2xl hover:shadow-indigo-500/20 hover:scale-105 transition-all cursor-pointer flex items-center justify-center border border-indigo-500/40 relative group"
        >
          <Brain className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          {/* Tooltip */}
          <div className="absolute right-14 bg-slate-900 border border-slate-800 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
            🧠 RailAI Intelligence
          </div>
        </button>
      )}

      {/* Slide-out Chat Panel */}
      {isOpen && (
        <div className="bg-slate-900/95 border border-slate-800/80 w-[calc(100vw-2rem)] sm:w-80 md:w-[420px] max-w-[420px] h-[520px] max-h-[82vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-md animate-in slide-in-from-bottom-5 fade-in duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-950/80 to-indigo-950/30 px-4 py-3.5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-indigo-950 rounded-lg text-indigo-400 border border-indigo-900/40 relative">
                <Brain className="h-4.5 w-4.5" />
                <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-500 border border-slate-900"></span>
              </div>
              <div>
                <h4 className="font-bold text-slate-200 text-sm flex items-center space-x-1.5">
                  <span>RailAI Intelligence</span>
                  <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider border border-indigo-500/20">AI</span>
                </h4>
                <div className="flex items-center space-x-1">
                  <Cpu className="h-2.5 w-2.5 text-emerald-500" />
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Gemini + Function Calling</span>
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
                  <p className="text-xs">Log in to converse with the RailAI intelligence engine and fetch live running telemetry.</p>
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
                    <div className="max-w-[90%] space-y-1.5">
                      {/* Tool usage indicator (before AI message) */}
                      {m.sender === 'ai' && m.toolsUsed && m.toolsUsed.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-1.5">
                          {[...new Set(m.toolsUsed)].map((tool, i) => {
                            const toolInfo = TOOL_LABELS[tool] || { icon: '⚡', label: tool };
                            return (
                              <span
                                key={i}
                                className="inline-flex items-center space-x-1 bg-indigo-950/60 border border-indigo-900/30 text-[9px] text-indigo-300 px-1.5 py-0.5 rounded-full"
                              >
                                <span>{toolInfo.icon}</span>
                                <span>{toolInfo.label}</span>
                                <CheckCircle2 className="h-2.5 w-2.5 text-emerald-400" />
                              </span>
                            );
                          })}
                        </div>
                      )}

                      <div
                        className={`rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                          m.sender === 'user'
                            ? 'bg-indigo-600 text-white rounded-tr-none'
                            : 'bg-slate-950/80 border border-slate-850 text-slate-250 rounded-tl-none'
                        }`}
                      >
                        {m.sender === 'ai' ? renderFormattedText(m.text) : m.text}
                      </div>

                      {/* Confidence badge */}
                      {m.sender === 'ai' && m.responseType === 'INTELLIGENCE' && m.confidence && (
                        <div className="flex items-center space-x-1 ml-1">
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            m.confidence === 'HIGH' ? 'bg-emerald-500' :
                            m.confidence === 'MEDIUM' ? 'bg-amber-500' : 'bg-red-500'
                          }`}></span>
                          <span className="text-[9px] text-slate-600 uppercase tracking-wider font-bold">
                            {m.confidence === 'HIGH' ? 'Verified by live data' :
                             m.confidence === 'MEDIUM' ? 'Partially verified' : 'Limited data'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-1.5 text-[10px] text-indigo-400">
                        <Zap className="h-3 w-3 animate-pulse" />
                        <span className="animate-pulse">Investigating with live data...</span>
                      </div>
                      <div className="bg-slate-950/80 border border-slate-850 rounded-2xl rounded-tl-none px-4 py-3 text-xs text-slate-500 flex items-center space-x-1.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]"></span>
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]"></span>
                      </div>
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
                    onClick={() => handleSuggestClick('Why is my train delayed?')}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer flex items-center space-x-1"
                  >
                    <Search className="h-2.5 w-2.5" />
                    <span>Why delayed?</span>
                  </button>
                  <button
                    onClick={() => handleSuggestClick('Show complete route schedule')}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                  >
                    Route & stops
                  </button>
                  <button
                    onClick={() => handleSuggestClick('What is the current live status?')}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                  >
                    Live status
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleSuggestClick('Find trains from Delhi to Mumbai')}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                  >
                    Delhi → Mumbai
                  </button>
                  <button
                    onClick={() => handleSuggestClick('What trains are at New Delhi station right now?')}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                  >
                    Station activity
                  </button>
                  <button
                    onClick={() => handleSuggestClick('Check status of Rajdhani Express')}
                    className="bg-slate-950 hover:bg-slate-850 border border-slate-800 text-[10px] text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full whitespace-nowrap transition-colors cursor-pointer"
                  >
                    Rajdhani status
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
                className="bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl flex-grow px-3 py-2 text-slate-200 outline-none text-xs placeholder:text-slate-650"
                placeholder="Ask RailAI anything about Indian Railways..."
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
