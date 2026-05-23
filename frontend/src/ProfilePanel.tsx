import { useState, useEffect } from 'react';
import { X, FileText, Trash2, LogOut, Database, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ProfilePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  token: string;
}

interface Document {
  id: string;
  filename: string;
  createdAt: string;
}

export default function ProfilePanel({ isOpen, onClose, onLogout, token }: ProfilePanelProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchDocuments();
    }
  }, [isOpen]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/documents', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (error) {
      console.error("Failed to fetch docs", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`http://localhost:3000/documents/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setDocuments(docs => docs.filter(d => d.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40" 
            onClick={onClose} 
          />
          
          {/* Side Panel */}
          <motion.div 
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-96 bg-background border-l border-border z-50 flex flex-col shadow-2xl shadow-black"
          >
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-surface">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
                  <Database size={20} />
                </div>
                <h2 className="text-white font-semibold tracking-wide">Vault Management</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                <X size={20} />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="flex items-center gap-2 mb-6 text-xs font-semibold text-slate-500 tracking-wider uppercase">
                <ShieldCheck size={14} /> Indexed Documents
              </div>
              
              {loading ? (
                <div className="flex justify-center p-8 text-indigo-500">
                  <Loader2 className="animate-spin" size={32} />
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center p-8 border border-dashed border-border rounded-xl text-slate-500 text-sm bg-slate-900/50">
                  Your secure vault is currently empty.
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <AnimatePresence>
                    {documents.map(doc => (
                      <motion.div 
                        key={doc.id}
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-surface border border-border p-4 rounded-xl flex justify-between items-center group hover:border-slate-600 transition-colors shadow-sm"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-slate-900 rounded-lg text-slate-400">
                            <FileText size={16} />
                          </div>
                          <span className="text-sm text-slate-200 truncate pr-4" title={doc.filename}>{doc.filename}</span>
                        </div>
                        <button 
                          className={`p-2 rounded-lg transition-colors ${deletingId === doc.id ? 'text-rose-400' : 'text-slate-500 hover:text-rose-400 hover:bg-rose-500/10'}`}
                          onClick={() => handleDelete(doc.id)}
                          disabled={deletingId === doc.id}
                          title="Purge Document"
                        >
                          {deletingId === doc.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-border bg-slate-900/50 mt-auto">
              <button 
                onClick={onLogout}
                className="w-full flex justify-center items-center gap-2 px-4 py-3 rounded-xl border border-rose-500/30 text-rose-400 hover:bg-rose-500/10 transition-colors font-medium text-sm"
              >
                <LogOut size={16} /> Terminate Secure Session
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
