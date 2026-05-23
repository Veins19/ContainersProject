import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import { Send, Paperclip, Bot, User as UserIcon, Database, Wifi, Loader2, FileText, Cpu, Server } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Auth from './Auth';
import ProfilePanel from './ProfilePanel';

const socket = io('http://localhost:3000');

interface Message { sender: 'user' | 'bot'; text: string; context?: string; }

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [engine, setEngine] = useState<'gemini' | 'ollama'>('gemini');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  useEffect(() => { scrollToBottom(); }, [messages, progress]);

  useEffect(() => {
    socket.on('upload_progress', (data) => {
      setProgress(data.progress);
      setStatusText(data.status);
      if (data.progress === 100 || data.status === 'Error') {
        if (data.message) {
          setMessages((prev) => [...prev, { 
            sender: 'bot', 
            text: data.status === 'Success' ? `**Vault Sync Complete:** ${data.message}` : `**Error:** ${data.message}` 
          }]);
        }
        setTimeout(() => { setProgress(0); setStatusText(''); }, 3000);
        setLoading(false);
      }
    });
    return () => { socket.off('upload_progress'); };
  }, []);

  const handleAuthSuccess = (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setMessages([]);
    setIsProfileOpen(false);
  };

  const sendMessage = async () => {
    if (!input.trim() || !token) return;
    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ question: userMessage.text, engine }),
      });
      
      if (response.status === 401) {
        handleLogout();
        return;
      }

      const data = await response.json();
      setMessages((prev) => [...prev, { sender: 'bot', text: data.answer, context: data.context }]);
    } catch (error) {
      setMessages((prev) => [...prev, { sender: 'bot', text: 'Connection to Gateway failed.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    setLoading(true);
    setProgress(5);
    setStatusText('Initiating secure handshake...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result;
      socket.emit('upload_file', { filename: file.name, buffer, token }); 
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; 
  };

  if (!token) return <Auth onAuthSuccess={handleAuthSuccess} />;

  const themeColor = engine === 'gemini' ? 'text-cloud' : 'text-local';
  const themeBg = engine === 'gemini' ? 'bg-cloud' : 'bg-local';
  const themeBorder = engine === 'gemini' ? 'border-cloud/30' : 'border-local/30';

  return (
    <div className="flex flex-col h-screen bg-background text-slate-200 font-sans">
      
      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-4 bg-surface/50 backdrop-blur-xl border-b border-border z-20">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl bg-slate-900 border ${themeBorder} shadow-lg shadow-black/20`}>
            <Database className={themeColor} size={24} />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-wide">RAG Neural Engine</h1>
            <p className="text-xs text-slate-400 font-mono flex items-center gap-2">
              v4.0.0 <span className={`inline-block w-2 h-2 rounded-full ${themeBg} animate-pulse-slow`}></span> Active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* ENGINE TOGGLE */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-full border border-border">
            <button 
              onClick={() => setEngine('gemini')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${engine === 'gemini' ? 'bg-surface text-cloud shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Server size={14} /> Cloud
            </button>
            <button 
              onClick={() => setEngine('ollama')}
              className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 ${engine === 'ollama' ? 'bg-surface text-local shadow-md' : 'text-slate-400 hover:text-slate-200'}`}
            >
              <Cpu size={14} /> Local
            </button>
          </div>

          <button 
            onClick={() => setIsProfileOpen(true)}
            className="p-2.5 rounded-full bg-slate-800 border border-border hover:bg-slate-700 transition-colors text-slate-300 hover:text-white"
            title="Vault Management"
          >
            <UserIcon size={18} />
          </button>
        </div>
      </header>

      {/* CHAT CONTAINER */}
      <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
        <div className="max-w-4xl mx-auto flex flex-col gap-6 pb-20">
          
          {messages.length === 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
              <div className={`p-6 rounded-full bg-slate-900 border border-slate-800 shadow-2xl`}>
                <Database size={48} className="text-slate-600" />
              </div>
              <h2 className="text-2xl font-semibold text-white">System Online</h2>
              <p className="text-slate-400 max-w-md">Upload a document to index it into the secure vector database, then query your personalized knowledge graph.</p>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg, index) => (
              <motion.div 
                key={index} 
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                className={`flex gap-4 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'bot' && (
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border ${themeBorder} bg-slate-900`}>
                    <Bot size={20} className={themeColor} />
                  </div>
                )}
                
                <div className={`max-w-[80%] rounded-2xl p-5 shadow-lg ${msg.sender === 'user' ? `${themeBg} text-white rounded-br-sm` : 'bg-surface border border-border text-slate-200 rounded-bl-sm'}`}>
                  <div className="markdown-body text-[15px]">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                  
                  {msg.context && msg.context !== "No context needed for this interaction." && msg.context !== "No context needed." && msg.context !== "No context." && (
                    <div className="mt-4 p-3 rounded-lg bg-slate-900/50 border border-slate-700/50 text-xs font-mono text-slate-400 leading-relaxed">
                      <span className="flex items-center gap-2 font-bold text-slate-300 mb-2 border-b border-slate-700/50 pb-2">
                        <FileText size={14} className={themeColor} /> Retrieved Vector Context
                      </span>
                      {msg.context.substring(0, 300)}...
                    </div>
                  )}
                </div>

                {msg.sender === 'user' && (
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center bg-slate-800 border border-slate-700`}>
                    <UserIcon size={20} className="text-slate-300" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {loading && progress === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border ${themeBorder} bg-slate-900`}>
                <Loader2 size={20} className={`animate-spin ${themeColor}`} />
              </div>
              <div className="bg-surface border border-border rounded-2xl rounded-bl-sm p-4 text-slate-400 italic text-sm flex items-center gap-3">
                Processing via {engine === 'gemini' ? 'Cloud Gateway' : 'Local GPU Node'}...
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* INPUT AREA & PROGRESS */}
      <div className="bg-background/80 backdrop-blur-xl border-t border-border p-4 relative z-10">
        <div className="max-w-4xl mx-auto">
          
          <AnimatePresence>
            {progress > 0 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute -top-12 left-0 right-0 px-4 flex justify-center">
                <div className="bg-surface border border-border rounded-lg shadow-xl p-3 w-full max-w-md flex flex-col gap-2">
                  <div className="flex justify-between items-center text-xs font-mono text-slate-300">
                    <span className="flex items-center gap-2"><Loader2 size={12} className="animate-spin" /> {statusText}</span>
                    <span>{progress}%</span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div className={`h-full transition-all duration-300 ${progress === 100 ? 'bg-emerald-500' : statusText === 'Error' ? 'bg-rose-500' : themeBg}`} style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative flex items-end gap-3 bg-surface border border-border p-2 rounded-2xl focus-within:border-slate-500 focus-within:ring-4 focus-within:ring-slate-800/50 transition-all shadow-lg">
            <label className="p-3 text-slate-400 hover:text-white hover:bg-slate-700 rounded-xl cursor-pointer transition-colors shrink-0">
              <Paperclip size={22} />
              <input type="file" accept=".txt, .pdf, .docx, .pptx" className="hidden" onChange={handleFileUpload} disabled={loading} />
            </label>
            
            <textarea 
              className="w-full bg-transparent text-white placeholder-slate-500 py-3 px-2 focus:outline-none resize-none max-h-32 min-h-[48px]"
              rows={1}
              value={input} 
              onChange={(e) => setInput(e.target.value)} 
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} 
              placeholder="Query your secure knowledge base..." 
              disabled={loading} 
            />
            
            <button 
              className={`p-3 rounded-xl transition-all shrink-0 ${!input.trim() || loading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : `${themeBg} text-white shadow-lg hover:brightness-110`}`}
              onClick={sendMessage} 
              disabled={loading || !input.trim()}
            >
              <Send size={20} className={loading && !input.trim() ? '' : 'ml-1'} />
            </button>
          </div>
          <div className="text-center mt-2 text-[10px] text-slate-500 font-mono">
            SECURE MULTI-TENANT ARCHITECTURE • END-TO-END ENCRYPTION ENABLED
          </div>
        </div>
      </div>

      <ProfilePanel isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} onLogout={handleLogout} token={token} />
    </div>
  );
}

export default App;
