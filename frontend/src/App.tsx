import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import ReactMarkdown from 'react-markdown';
import { Send, Paperclip, Bot, User, Database, Wifi, Loader2, FileText } from 'lucide-react';
import './App.css';

const socket = io('http://localhost:3000');

interface Message { sender: 'user' | 'bot'; text: string; context?: string; }

function App() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Upload States
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');
  
  // Auto-scroll ref
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logic
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => { scrollToBottom(); }, [messages, progress]);

  useEffect(() => {
    socket.on('upload_progress', (data) => {
      setProgress(data.progress);
      setStatusText(data.status);
      
      if (data.progress === 100 || data.status === 'Error') {
        if (data.message) {
          setMessages((prev) => [...prev, { 
            sender: 'bot', 
            text: data.status === 'Success' ? `**Success:** ${data.message}` : `**Error:** ${data.message}` 
          }]);
        }
        setTimeout(() => { setProgress(0); setStatusText(''); }, 3000);
        setLoading(false);
      }
    });
    return () => { socket.off('upload_progress'); };
  }, []);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMessage: Message = { sender: 'user', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMessage.text }),
      });
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
    if (!file) return;

    setLoading(true);
    setProgress(5);
    setStatusText('Initiating WebSocket connection...');

    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result;
      socket.emit('upload_file', { filename: file.name, buffer });
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input so same file can be uploaded again if needed
  };

  return (
    <div className="app-container">
      
      {/* Header */}
      <div className="header">
        <div className="header-title">
          <Database size={24} color="var(--accent)" />
          RAG Neural Engine
        </div>
        <div className="status-badge">
          <Wifi size={14} />
          <span>Gateway Active</span>
        </div>
      </div>

      {/* Chat Area */}
      <div className="chat-container">
        {messages.length === 0 && (
          <div className="empty-state">
            <Database size={48} opacity={0.5} />
            <p>Upload a document below to build the knowledge base,<br/>then ask a question.</p>
          </div>
        )}

        {messages.map((msg, index) => (
          <div key={index} className={`message-row ${msg.sender}`}>
            {msg.sender === 'bot' && (
              <div className="avatar bot"><Bot size={20} /></div>
            )}
            
            <div className={`message-bubble ${msg.sender}`}>
              <ReactMarkdown>{msg.text}</ReactMarkdown>
              
              {msg.context && msg.context !== "No context." && (
                <div className="context-box">
                  <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
                    <FileText size={12} />
                    Retrieved Context
                  </span>
                  {msg.context.substring(0, 150)}...
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="avatar" style={{ background: 'var(--accent)' }}><User size={20} color="white" /></div>
            )}
          </div>
        ))}

        {/* Thinking Indicator */}
        {loading && progress === 0 && (
          <div className="message-row bot">
            <div className="avatar bot"><Loader2 size={20} className="lucide-spin" style={{ animation: 'spin 2s linear infinite' }} /></div>
            <div className="message-bubble bot" style={{ opacity: 0.7, fontStyle: 'italic' }}>
              Synthesizing response...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Upload Progress Tracker */}
      {progress > 0 && (
        <div className="progress-widget">
          <div className="progress-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Loader2 size={14} style={{ animation: 'spin 2s linear infinite' }} />
              {statusText}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="progress-track">
            <div 
              className="progress-fill" 
              style={{ 
                width: `${progress}%`, 
                backgroundColor: progress === 100 ? 'var(--success)' : statusText === 'Error' ? 'var(--danger)' : 'var(--accent)' 
              }}
            ></div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="input-area">
        <label className="upload-btn" title="Upload Document">
          <Paperclip size={20} />
          <input 
            type="file" 
            accept=".txt, .pdf, .docx, .pptx" 
            style={{ display: 'none' }} 
            onChange={handleFileUpload} 
            disabled={loading}
          />
        </label>
        
        <input 
          type="text" 
          className="text-input"
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Query the knowledge base..."
          disabled={loading}
        />
        
        <button 
          className="send-btn" 
          onClick={sendMessage} 
          disabled={loading || !input.trim()}
        >
          <Send size={18} />
        </button>
      </div>

    </div>
  );
}

export default App;
