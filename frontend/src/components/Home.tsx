import React, { useEffect, useRef, useState, useCallback } from 'react';
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
  File as FileIcon,
  AlertCircle,
  Trash2,
  X,
  Eye,
  Sparkles,
  ShieldCheck,
  Database,
  CheckCircle2,
  Clock3,
  ChevronRight,
  PanelLeft,
  RefreshCw,
  Search,
  FileCheck2,
} from 'lucide-react';

import {
  streamChatMessage,
  fetchDocuments,
  uploadDocument,
  deleteDocument,
} from '../services/api';

import type { DocumentItem } from '../types';
import { DocumentViewerModal } from './DocumentViewerModal';

// ----------------------------------------------------------------------
// TYPES
// ----------------------------------------------------------------------

interface LocalMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const SUGGESTED_QUESTIONS = [
  'What are the admission requirements?',
  'What programs are currently available?',
  'How can I apply?',
  'What documents do I need?',
] as const;

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');

  // Chat State
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Document State
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('General Policy');
  const [uploading, setUploading] = useState(false);
  const [documentSearch, setDocumentSearch] = useState('');

  // UI State
  const [previewDoc, setPreviewDoc] = useState<{ url: string; name: string } | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // --------------------------------------------------------------------
  // HANDLERS & API CALLS
  // --------------------------------------------------------------------

  const loadDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to load documents.');
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  // Auto-scroll Chat
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages, sendingMessage]);

  const handleStartNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setNewMessageContent('');
    setStatusMessage(null);
    setActiveTab('chat');
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmedMessage = newMessageContent.trim();
    if (!trimmedMessage || sendingMessage) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: LocalMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmedMessage,
      created_at: timestamp,
    };

    const botMsgId = `${Date.now()}-assistant`;
    const botMsgPlaceholder: LocalMessage = {
      id: botMsgId,
      role: 'assistant',
      content: '',
      created_at: timestamp,
    };

    setMessages((prev) => [...prev, userMsg, botMsgPlaceholder]);
    setNewMessageContent('');
    setSendingMessage(true);
    setStatusMessage(null);

    await streamChatMessage(trimmedMessage, conversationId, {
      onToken: (token: string) => {
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === botMsgId ? { ...msg, content: msg.content + token } : msg
          )
        );
      },
      onComplete: (data) => {
        if (data?.conversation_id) setConversationId(data.conversation_id);
        setSendingMessage(false);
      },
      onError: (error) => {
        setStatusMessage(error.message || 'Failed to stream response.');
        setSendingMessage(false);
      },
    });
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || uploading) return;

    setUploading(true);
    setStatusMessage(null);

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
    if (!window.confirm('Are you sure you want to permanently delete this document?')) return;

    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
      setStatusMessage('Document deleted successfully.');
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Failed to delete document.');
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const search = documentSearch.toLowerCase();
    return doc.file_name.toLowerCase().includes(search) || doc.category.toLowerCase().includes(search);
  });

  // --------------------------------------------------------------------
  // RENDER
  // --------------------------------------------------------------------

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#F8FAFC] font-sans text-slate-800">
      {/* SIDEBAR */}
      {sidebarOpen && (
        <aside className="flex w-72 shrink-0 flex-col border-r border-slate-200/80 bg-white shadow-sm transition-all">
          <div className="border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-accent)] text-white shadow-md shadow-blue-500/20">
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">Admission AI</p>
                <p className="text-[11px] font-medium text-slate-400">SNU Knowledge Platform</p>
              </div>
            </div>
          </div>

          {/* Navigation Switcher */}
          <div className="border-b border-slate-100 p-3">
            <div className="grid grid-cols-2 rounded-xl bg-slate-100/80 p-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                  activeTab === 'chat'
                    ? 'bg-white text-[var(--color-brand-accent)] shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-xs font-semibold transition-all ${
                  activeTab === 'documents'
                    ? 'bg-white text-[var(--color-brand-accent)] shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Database className="h-3.5 w-3.5" />
                Knowledge
              </button>
            </div>
          </div>

          {/* Sidebar Tab Content */}
          <div className="flex flex-1 flex-col overflow-y-auto p-4">
            {activeTab === 'chat' ? (
              <SidebarChatView
                conversationId={conversationId}
                onNewChat={handleStartNewChat}
              />
            ) : (
              <SidebarKnowledgeView
                selectedFile={selectedFile}
                uploadCategory={uploadCategory}
                uploading={uploading}
                fileInputRef={fileInputRef}
                docCount={documents.length}
                onCategoryChange={setUploadCategory}
                onFileSelect={setSelectedFile}
                onUpload={handleFileUpload}
              />
            )}
          </div>
        </aside>
      )}

      {/* MAIN VIEW AREA */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        {/* Header Bar */}
        <header className="flex shrink-0 items-center justify-between border-b border-slate-200/80 bg-white/80 px-6 py-3.5 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen((prev) => !prev)}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
              title="Toggle Sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-slate-900">
                {activeTab === 'chat' ? 'AI Admission Assistant' : 'Knowledge Base Repository'}
              </h1>
              <p className="text-[11px] text-slate-400">
                {activeTab === 'chat'
                  ? 'Grounded in verified institutional sources'
                  : `${documents.length} documents indexed and ready`}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              RAG Connected
            </span>
          </div>
        </header>

        {/* Status Notification Banner */}
        {statusMessage && (
          <div className="flex shrink-0 items-center justify-between border-b border-blue-100 bg-blue-50/70 px-6 py-2.5 text-xs font-medium text-blue-900 backdrop-blur-sm">
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="h-4 w-4 shrink-0 text-[var(--color-brand-accent)]" />
              <span className="truncate">{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="rounded-md p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-700 transition"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* Tab View switching */}
        {activeTab === 'chat' ? (
          <ChatArea
            messages={messages}
            sendingMessage={sendingMessage}
            newMessageContent={newMessageContent}
            messagesContainerRef={messagesContainerRef}
            setNewMessageContent={setNewMessageContent}
            onSendMessage={handleSendMessage}
          />
        ) : (
          <KnowledgeArea
            documents={filteredDocuments}
            loading={loadingDocuments}
            documentSearch={documentSearch}
            setDocumentSearch={setDocumentSearch}
            onRefresh={loadDocuments}
            onPreview={(doc) =>
              setPreviewDoc({
                url: `${API_BASE_URL}/documents/${doc.id}/file`,
                name: doc.file_name,
              })
            }
            onDelete={handleDeleteDoc}
          />
        )}
      </main>

      {/* DOCUMENT PREVIEW MODAL */}
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

// ----------------------------------------------------------------------
// SUB-COMPONENTS (Clean Architecture & Maintainability)
// ----------------------------------------------------------------------

interface SidebarChatViewProps {
  conversationId: string | null;
  onNewChat: () => void;
}

const SidebarChatView: React.FC<SidebarChatViewProps> = ({ conversationId, onNewChat }) => (
  <div className="flex flex-1 flex-col justify-between">
    <div className="space-y-4">
      <button
        onClick={onNewChat}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-accent)] px-4 py-3 text-xs font-semibold text-white shadow-md shadow-blue-500/10 transition hover:opacity-95 active:scale-[0.98]"
      >
        <Plus className="h-4 w-4" />
        New Conversation
      </button>

      <div>
        <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
          Current Session
        </p>
        {conversationId ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-accent)]" />
              <span className="text-xs font-semibold text-slate-800">Active</span>
            </div>
            <p className="mt-1.5 break-all font-mono text-[10px] text-slate-500">{conversationId}</p>
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-4 text-center">
            <MessageSquare className="mx-auto h-5 w-5 text-slate-300" />
            <p className="mt-2 text-xs text-slate-500">No active context yet.</p>
          </div>
        )}
      </div>
    </div>

    <div className="mt-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-3.5">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-accent)] text-white">
          <ShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-slate-800">Grounding Guarantee</p>
          <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
            Engineered with strict RAG validation against official guidelines.
          </p>
        </div>
      </div>
    </div>
  </div>
);

interface SidebarKnowledgeViewProps {
  selectedFile: File | null;
  uploadCategory: string;
  uploading: boolean;
  docCount: number;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onCategoryChange: (val: string) => void;
  onFileSelect: (file: File | null) => void;
  onUpload: (e: React.FormEvent) => void;
}

const SidebarKnowledgeView: React.FC<SidebarKnowledgeViewProps> = ({
  selectedFile,
  uploadCategory,
  uploading,
  docCount,
  fileInputRef,
  onCategoryChange,
  onFileSelect,
  onUpload,
}) => (
  <div className="space-y-5">
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-800">Upload Source Data</p>
        <UploadCloud className="h-4 w-4 text-[var(--color-brand-accent)]" />
      </div>

      <form onSubmit={onUpload} className="space-y-3">
        <label className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-blue-200 bg-blue-50/20 p-5 text-center transition hover:border-[var(--color-brand-accent)] hover:bg-blue-50/50">
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            onChange={(e) => onFileSelect(e.target.files?.[0] || null)}
            className="hidden"
          />
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-brand-accent)] text-white shadow-sm transition group-hover:scale-105">
            <UploadCloud className="h-4 w-4" />
          </div>
          <p className="mt-2.5 text-xs font-semibold text-slate-700">
            {selectedFile ? selectedFile.name : 'Choose document'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400">PDF, DOCX, or TXT</p>
        </label>

        <input
          type="text"
          value={uploadCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          placeholder="Document Category"
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 outline-none transition focus:border-[var(--color-brand-accent)] focus:ring-2 focus:ring-blue-500/10"
        />

        <button
          type="submit"
          disabled={!selectedFile || uploading}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-brand-accent)] px-3 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {uploading ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Indexing...
            </>
          ) : (
            'Upload & Index'
          )}
        </button>
      </form>
    </div>

    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
      <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-2.5">
        <p className="text-[10px] font-medium text-slate-400">Indexed Total</p>
        <p className="mt-0.5 text-base font-bold text-slate-800">{docCount}</p>
      </div>
      <div className="rounded-xl border border-slate-200/60 bg-slate-50/50 p-2.5">
        <p className="text-[10px] font-medium text-slate-400">Status</p>
        <div className="mt-1 flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          <span className="text-xs font-semibold text-slate-700">Ready</span>
        </div>
      </div>
    </div>
  </div>
);

interface ChatAreaProps {
  messages: LocalMessage[];
  sendingMessage: boolean;
  newMessageContent: string;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  setNewMessageContent: (val: string) => void;
  onSendMessage: (e?: React.FormEvent) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  sendingMessage,
  newMessageContent,
  messagesContainerRef,
  setNewMessageContent,
  onSendMessage,
}) => (
  <>
    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto bg-[#F8FAFC]/50 px-4 py-6 sm:px-8">
      <div className="mx-auto max-w-3xl">
        {messages.length === 0 ? (
          <div className="flex min-h-[calc(100vh-280px)] flex-col items-center justify-center text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--color-brand-accent)] text-white shadow-lg shadow-blue-500/20">
              <Bot className="h-7 w-7" />
            </div>

            <h2 className="mt-4 text-lg font-bold text-slate-900">How can I assist your admission today?</h2>
            <p className="mt-1.5 max-w-md text-xs leading-relaxed text-slate-500">
              Get immediate answers regarding degree paths, deadlines, fees, and requirements derived from source documents.
            </p>

            <div className="mt-6 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button
                  key={q}
                  onClick={() => setNewMessageContent(q)}
                  className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-white p-3 text-left text-xs font-medium text-slate-700 shadow-sm transition hover:border-[var(--color-brand-accent)] hover:bg-blue-50/30"
                >
                  <span>{q}</span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div key={msg.id} className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}>
                  {!isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-accent)] text-white shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div className={`max-w-[85%] sm:max-w-[75%] ${isUser ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`rounded-2xl px-4 py-3 shadow-sm ${
                        isUser
                          ? 'rounded-tr-none bg-[var(--color-brand-accent)] text-white'
                          : 'rounded-tl-none border border-slate-200/80 bg-white text-slate-800'
                      }`}
                    >
                      <div className={`mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider ${isUser ? 'text-white/80' : 'text-slate-400'}`}>
                        {isUser ? <User className="h-3 w-3" /> : <Sparkles className="h-3 w-3 text-[var(--color-brand-accent)]" />}
                        {isUser ? 'You' : 'Assistant'}
                      </div>

                      <div className={`text-xs leading-relaxed ${isUser ? 'whitespace-pre-wrap' : 'prose prose-xs max-w-none'}`}>
                        {isUser ? msg.content : <ReactMarkdown>{msg.content}</ReactMarkdown>}
                      </div>
                    </div>

                    <div className={`mt-1 flex items-center gap-1 text-[10px] text-slate-400 ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <Clock3 className="h-3 w-3" />
                      {msg.created_at}
                    </div>
                  </div>

                  {isUser && (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white shadow-sm">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })}

            {sendingMessage && messages[messages.length - 1]?.content === '' && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-accent)] text-white">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--color-brand-accent)]" />
                  <span className="text-xs text-slate-500">Searching knowledge base...</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>

    {/* Message Input Composer */}
    <div className="shrink-0 border-t border-slate-200/80 bg-white px-4 py-3.5 sm:px-8">
      <form onSubmit={onSendMessage} className="mx-auto max-w-3xl">
        <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/50 p-2 transition focus-within:border-[var(--color-brand-accent)] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-500/10">
          <MessageSquare className="ml-2 h-4 w-4 shrink-0 text-slate-400" />
          <input
            type="text"
            value={newMessageContent}
            onChange={(e) => setNewMessageContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !sendingMessage) {
                e.preventDefault();
                onSendMessage();
              }
            }}
            placeholder="Ask about admissions, deadlines, requirements..."
            disabled={sendingMessage}
            className="w-full bg-transparent px-2 text-xs text-slate-800 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            disabled={sendingMessage || !newMessageContent.trim()}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-brand-accent)] text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {sendingMessage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          </button>
        </div>
      </form>
    </div>
  </>
);

interface KnowledgeAreaProps {
  documents: DocumentItem[];
  loading: boolean;
  documentSearch: string;
  setDocumentSearch: (val: string) => void;
  onRefresh: () => void;
  onPreview: (doc: DocumentItem) => void;
  onDelete: (id: string) => void;
}

const KnowledgeArea: React.FC<KnowledgeAreaProps> = ({
  documents,
  loading,
  documentSearch,
  setDocumentSearch,
  onRefresh,
  onPreview,
  onDelete,
}) => (
  <div className="flex-1 overflow-y-auto bg-[#F8FAFC]/50 px-6 py-6 lg:px-10">
    <div className="mx-auto max-w-5xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={documentSearch}
            onChange={(e) => setDocumentSearch(e.target.value)}
            placeholder="Search documents by title or category..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs text-slate-800 outline-none shadow-sm transition focus:border-[var(--color-brand-accent)] focus:ring-4 focus:ring-blue-500/10"
          />
        </div>

        <button
          onClick={onRefresh}
          className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition hover:bg-slate-50"
          title="Refresh List"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="flex h-64 items-center justify-center text-xs text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-[var(--color-brand-accent)]" />
            Fetching documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
            <FileText className="h-10 w-10 text-slate-300" />
            <p className="mt-3 text-xs font-semibold text-slate-700">No indexed documents</p>
            <p className="mt-1 text-[11px] text-slate-400">Upload source materials to populate the knowledge base.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="group flex flex-col justify-between rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[var(--color-brand-accent)] hover:shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-500">
                      <FileIcon className="h-4 w-4" />
                    </div>
                    <FileCheck2 className="h-4 w-4 text-[var(--color-brand-accent)]" />
                  </div>
                  <p className="mt-3 truncate text-xs font-bold text-slate-800" title={doc.file_name}>
                    {doc.file_name}
                  </p>
                  <p className="mt-0.5 text-[10px] text-slate-400">{doc.upload_date}</p>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[10px] font-semibold text-[var(--color-brand-accent)]">
                    {doc.category}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPreview(doc)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-[var(--color-brand-accent)] transition"
                      title="Preview"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(doc.id)}
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500 transition"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  </div>
);