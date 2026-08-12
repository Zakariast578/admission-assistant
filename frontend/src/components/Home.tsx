import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Plus,
  MessageSquare,
  Send,
  User,
  Bot,
  Loader2,
  FileText,
  UploadCloud,
  File,
  AlertCircle,
  Trash2,
  X,
  Eye,
} from 'lucide-react';
import {
  sendChatMessage,
  fetchDocuments,
  uploadDocument,
  deleteDocument,
} from '../services/api';
import type { DocumentItem } from '../types';
import { DocumentViewerModal } from './DocumentViewerModal';

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// Adjust base API URL according to your environment or backend port
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');

  // Chat State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [newMessageContent, setNewMessageContent] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);

  // Documents State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState<string>('General Policy');
  const [uploading, setUploading] = useState<boolean>(false);

  // Document Viewer Preview State
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);

  // Status/Notification
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoadingDocuments(true);
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to load documents.');
    } finally {
      setLoadingDocuments(false);
    }
  };

  const handleStartNewChat = () => {
    setConversationId(null);
    setMessages([]);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessageContent.trim()) return;

    const userText = newMessageContent.trim();
    const userMsg: LocalMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userText,
      created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setNewMessageContent('');
    setSendingMessage(true);

    try {
      const res = await sendChatMessage(userText, conversationId);
      if (!conversationId && res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      const botMsg: LocalMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: res.answer,
        created_at: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to send message.');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const newDoc = await uploadDocument(selectedFile, uploadCategory);
      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setStatusMessage('Document uploaded and indexed successfully.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to upload document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      setStatusMessage('Document deleted successfully.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to delete document.');
    }
  };

  const openDocumentPreview = (doc: DocumentItem) => {
    // Standardize URL to point directly to the backend file endpoint
    const fileUrl = `${API_BASE_URL}/documents/${doc.id}/file`;
    setPreviewDoc({
      url: fileUrl,
      name: doc.file_name,
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-[var(--color-soft-neutral)] font-sans overflow-hidden">
      <div className="flex flex-1 overflow-hidden">
        {/* SIDEBAR */}
        <aside className="w-80 bg-[var(--color-surface-white)] border-r border-[var(--color-border-muted)] flex flex-col h-full">
          <div className="flex border-b border-[var(--color-border-muted)] bg-[var(--color-soft-neutral)]">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'chat'
                  ? 'border-[var(--color-brand-accent)] text-[var(--color-brand-accent)] bg-[var(--color-surface-white)]'
                  : 'border-transparent text-[var(--color-text-body)] hover:text-[var(--color-deep-navy)]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat Assistant</span>
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`flex-1 py-3 px-4 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
                activeTab === 'documents'
                  ? 'border-[var(--color-brand-accent)] text-[var(--color-brand-accent)] bg-[var(--color-surface-white)]'
                  : 'border-transparent text-[var(--color-text-body)] hover:text-[var(--color-deep-navy)]'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Knowledge Base</span>
            </button>
          </div>

          {activeTab === 'chat' && (
            <div className="p-4 space-y-3">
              <button
                onClick={handleStartNewChat}
                className="w-full py-2.5 px-3 bg-[var(--color-brand-accent)] hover:opacity-90 text-white rounded-lg transition-all flex items-center justify-center gap-2 text-xs font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat Session</span>
              </button>
              {conversationId && (
                <div className="p-3 bg-[var(--color-brand-accent)]/10 border border-[var(--color-brand-accent)]/20 rounded-lg text-xs text-[var(--color-deep-navy)]">
                  <span className="font-semibold block mb-1">Active Session ID:</span>
                  <span className="font-mono text-[10px] break-all">{conversationId}</span>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="p-4 space-y-4 flex-1 overflow-y-auto">
              <h3 className="text-xs font-bold text-[var(--color-deep-navy)] uppercase tracking-wider">
                Upload New Document
              </h3>
              <form onSubmit={handleFileUpload} className="space-y-3 bg-[var(--color-soft-neutral)] p-3 rounded-xl border border-[var(--color-border-muted)]">
                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-body)] mb-1">Select Document</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="text-xs w-full text-[var(--color-text-body)] file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-[var(--color-brand-accent)]/10 file:text-[var(--color-brand-accent)] hover:file:bg-[var(--color-brand-accent)]/20"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[var(--color-text-body)] mb-1">Category</label>
                  <input
                    type="text"
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full border border-[var(--color-border-muted)] rounded p-1.5 text-xs bg-[var(--color-surface-white)] focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-accent)]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedFile || uploading}
                  className="w-full py-2 bg-[var(--color-brand-accent)] hover:opacity-90 disabled:opacity-50 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-2 transition-all shadow-sm"
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload & Index</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </aside>

        {/* MAIN PANEL */}
        <main className="flex-1 flex flex-col h-full bg-[var(--color-surface-white)] relative overflow-hidden">
          {statusMessage && (
            <div className="bg-[var(--color-brand-accent)]/10 border-b border-[var(--color-brand-accent)]/20 p-2 text-xs text-[var(--color-deep-navy)] text-center flex justify-between items-center px-4 shrink-0">
              <span className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-[var(--color-brand-accent)]" />
                {statusMessage}
              </span>
              <button onClick={() => setStatusMessage(null)} className="text-[var(--color-brand-accent)] hover:text-[var(--color-deep-navy)]">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {activeTab === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-[var(--color-text-body)] text-xs space-y-2">
                    <MessageSquare className="w-8 h-8 stroke-1 text-[var(--color-brand-accent)]" />
                    <p>Type a message below to start chatting with your RAG model.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
                      >
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white ${
                            isUser ? 'bg-[var(--color-brand-accent)]' : 'bg-[var(--color-deep-navy)]'
                          }`}
                        >
                          {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-[var(--color-brand-accent)]" />}
                        </div>
                        <div
                          className={`p-4 rounded-xl text-xs space-y-1 ${
                            isUser
                              ? 'bg-[var(--color-brand-accent)]/10 text-[var(--color-deep-navy)] border border-[var(--color-brand-accent)]/20'
                              : 'bg-[var(--color-soft-neutral)] text-gray-900 border border-[var(--color-border-muted)]'
                          }`}
                        >
                          <div className="leading-relaxed prose prose-xs max-w-none">
                            {isUser ? (
                              <div className="whitespace-pre-wrap">{msg.content}</div>
                            ) : (
                              <ReactMarkdown>{msg.content}</ReactMarkdown>
                            )}
                          </div>
                          <div className="text-[10px] text-[var(--color-text-body)] text-right pt-1">{msg.created_at}</div>
                        </div>
                      </div>
                    );
                  })
                )}
                {sendingMessage && (
                  <div className="flex gap-3 max-w-3xl mr-auto">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[var(--color-deep-navy)] text-white">
                      <Bot className="w-4 h-4 text-[var(--color-brand-accent)]" />
                    </div>
                    <div className="p-4 rounded-xl text-xs bg-[var(--color-soft-neutral)] text-gray-900 flex items-center gap-2 border border-[var(--color-border-muted)]">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[var(--color-brand-accent)]" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[var(--color-border-muted)] bg-[var(--color-surface-white)] shrink-0">
                <form onSubmit={handleSendMessage} className="flex gap-2 max-w-3xl mx-auto">
                  <input
                    type="text"
                    value={newMessageContent}
                    onChange={(e) => setNewMessageContent(e.target.value)}
                    placeholder="Ask a question..."
                    disabled={sendingMessage}
                    className="flex-1 border border-[var(--color-border-muted)] rounded-lg px-4 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-[var(--color-brand-accent)] focus:border-[var(--color-brand-accent)] disabled:bg-[var(--color-soft-neutral)]"
                  />
                  <button
                    type="submit"
                    disabled={sendingMessage || !newMessageContent.trim()}
                    className="bg-[var(--color-brand-accent)] hover:opacity-90 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-xs font-medium transition-all shadow-sm"
                  >
                    {sendingMessage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[var(--color-border-muted)] pb-3">
                <h2 className="text-sm font-bold text-[var(--color-deep-navy)]">Indexed Knowledge Base Documents</h2>
                <span className="text-xs text-[var(--color-text-body)]">{documents.length} Total Documents</span>
              </div>

              {loadingDocuments ? (
                <div className="flex items-center justify-center h-64 text-[var(--color-text-body)] text-xs gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--color-brand-accent)]" /> Loading document list...
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-[var(--color-text-body)] text-xs space-y-2 border border-dashed border-[var(--color-border-muted)] rounded-xl">
                  <File className="w-8 h-8 stroke-1 text-[var(--color-border-muted)]" />
                  <p>No indexed documents found in database.</p>
                </div>
              ) : (
                <div className="border border-[var(--color-border-muted)] rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[var(--color-soft-neutral)] text-[var(--color-deep-navy)] border-b border-[var(--color-border-muted)] font-semibold">
                      <tr>
                        <th className="p-3">File Name</th>
                        <th className="p-3">Category</th>
                        <th className="p-3">Upload Date</th>
                        <th className="p-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-muted)] text-gray-700">
                      {documents.map((doc) => (
                        <tr key={doc.id} className="hover:bg-[var(--color-soft-neutral)]/50 transition-colors">
                          <td className="p-3 font-medium">
                            <button
                              onClick={() => openDocumentPreview(doc)}
                              className="flex items-center gap-2 hover:text-[var(--color-brand-accent)] transition-colors text-left group"
                              title="Click to preview document"
                            >
                              <File className="w-4 h-4 text-[var(--color-brand-accent)] shrink-0 group-hover:scale-110 transition-transform" />
                              <span className="truncate max-w-xs group-hover:underline">
                                {doc.file_name}
                              </span>
                            </button>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded-full bg-[var(--color-brand-accent)]/10 text-[var(--color-brand-accent)] text-[10px] font-medium border border-[var(--color-brand-accent)]/20">
                              {doc.category}
                            </span>
                          </td>
                          <td className="p-3 text-[var(--color-text-body)]">{doc.upload_date}</td>
                          <td className="p-3 text-right flex items-center justify-end gap-1">
                            <button
                              onClick={() => openDocumentPreview(doc)}
                              className="p-1.5 text-[var(--color-text-body)] hover:text-[var(--color-brand-accent)] hover:bg-[var(--color-brand-accent)]/10 rounded transition-colors"
                              title="Preview Document"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="p-1.5 text-[var(--color-text-body)] hover:text-[var(--color-crimson-accent)] hover:bg-[var(--color-crimson-accent)]/10 rounded transition-colors"
                              title="Delete Document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {previewDoc && (
        <DocumentViewerModal
          documentUrl={previewDoc.url}
          fileName={previewDoc.name}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};