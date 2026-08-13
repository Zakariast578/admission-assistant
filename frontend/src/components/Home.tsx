import React, { useEffect, useRef, useState } from 'react';
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

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');

  // ---------------------------------------------------------
  // CHAT STATE
  // ---------------------------------------------------------

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // ---------------------------------------------------------
  // DOCUMENT STATE
  // ---------------------------------------------------------

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('General Policy');
  const [uploading, setUploading] = useState(false);
  const [documentSearch, setDocumentSearch] = useState('');

  // ---------------------------------------------------------
  // UI STATE
  // ---------------------------------------------------------

  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  // ---------------------------------------------------------
  // LOAD DOCUMENTS
  // ---------------------------------------------------------

  const loadDocuments = async () => {
    setLoadingDocuments(true);

    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Failed to load documents.'
      );
    } finally {
      setLoadingDocuments(false);
    }
  };

  useEffect(() => {
    void loadDocuments();
  }, []);

  // ---------------------------------------------------------
  // AUTO SCROLL CHAT
  // ---------------------------------------------------------

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, sendingMessage]);

  // ---------------------------------------------------------
  // START NEW CHAT
  // ---------------------------------------------------------

  const handleStartNewChat = () => {
    setConversationId(null);
    setMessages([]);
    setNewMessageContent('');
    setStatusMessage(null);
    setActiveTab('chat');
  };

  // ---------------------------------------------------------
  // SEND MESSAGE
  // ---------------------------------------------------------

  const handleSendMessage = async (
    e?: React.FormEvent
  ) => {
    e?.preventDefault();

    const trimmedMessage = newMessageContent.trim();

    if (!trimmedMessage || sendingMessage) return;

    const userMsg: LocalMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content: trimmedMessage,
      created_at: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setNewMessageContent('');
    setSendingMessage(true);
    setStatusMessage(null);

    try {
      const res = await sendChatMessage(
        trimmedMessage,
        conversationId
      );

      if (!conversationId && res.conversation_id) {
        setConversationId(res.conversation_id);
      }

      const botMsg: LocalMessage = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content:
          res.answer || 'No response received from the assistant.',
        created_at: new Date().toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Failed to send message.'
      );
    } finally {
      setSendingMessage(false);
    }
  };

  // ---------------------------------------------------------
  // UPLOAD DOCUMENT
  // ---------------------------------------------------------

  const handleFileUpload = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!selectedFile || uploading) return;

    setUploading(true);
    setStatusMessage(null);

    try {
      const newDoc = await uploadDocument(
        selectedFile,
        uploadCategory
      );

      setDocuments((prev) => [newDoc, ...prev]);
      setSelectedFile(null);

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      setStatusMessage(
        'Document uploaded and indexed successfully.'
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Failed to upload document.'
      );
    } finally {
      setUploading(false);
    }
  };

  // ---------------------------------------------------------
  // DELETE DOCUMENT
  // ---------------------------------------------------------

  const handleDeleteDoc = async (
    docId: string
  ) => {
    const confirmed = window.confirm(
      'Are you sure you want to permanently delete this document?'
    );

    if (!confirmed) return;

    try {
      await deleteDocument(docId);

      setDocuments((prev) =>
        prev.filter((doc) => doc.id !== docId)
      );

      setStatusMessage(
        'Document deleted successfully.'
      );
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Failed to delete document.'
      );
    }
  };

  // ---------------------------------------------------------
  // DOCUMENT PREVIEW
  // ---------------------------------------------------------

  const openDocumentPreview = (
    doc: DocumentItem
  ) => {
    const fileUrl =
      `${API_BASE_URL}/documents/${doc.id}/file`;

    setPreviewDoc({
      url: fileUrl,
      name: doc.file_name,
    });
  };

  // ---------------------------------------------------------
  // FILTER DOCUMENTS
  // ---------------------------------------------------------

  const filteredDocuments = documents.filter((doc) => {
    const search = documentSearch.toLowerCase();

    return (
      doc.file_name.toLowerCase().includes(search) ||
      doc.category.toLowerCase().includes(search)
    );
  });

  // ---------------------------------------------------------
  // UI
  // ---------------------------------------------------------

  return (
    <div
      className="
        flex
        h-[calc(100vh-64px)]
        overflow-hidden
        bg-[#F5F7FA]
        font-sans
      "
    >
      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      {sidebarOpen && (
        <aside
          className="
            flex
            w-[300px]
            shrink-0
            flex-col
            border-r
            border-[var(--color-border-muted)]
            bg-white
          "
        >
          {/* Sidebar Header */}

          <div className="border-b border-gray-200 px-5 py-5">
            <div className="flex items-center gap-3">
              <div
                className="
                  flex
                  h-10 w-10
                  items-center
                  justify-center
                  rounded-xl
                  bg-[var(--color-brand-accent)]
                  text-white
                  shadow-sm
                "
              >
                <BrainCircuitIcon />
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-[var(--color-deep-navy)]">
                  Admission AI
                </p>

                <p className="text-[11px] text-gray-500">
                  SNU Knowledge Platform
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}

          <div className="border-b border-gray-200 p-3">
            <div className="grid grid-cols-2 rounded-xl bg-gray-100 p-1">
              <button
                onClick={() => setActiveTab('chat')}
                className={`
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  px-3
                  py-2.5
                  text-xs
                  font-semibold
                  transition-all
                  ${
                    activeTab === 'chat'
                      ? 'bg-[var(--color-brand-accent)] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }
                `}
              >
                <MessageSquare className="h-4 w-4" />
                Chat
              </button>

              <button
                onClick={() => setActiveTab('documents')}
                className={`
                  flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  px-3
                  py-2.5
                  text-xs
                  font-semibold
                  transition-all
                  ${
                    activeTab === 'documents'
                      ? 'bg-[var(--color-brand-accent)] text-white shadow-sm'
                      : 'text-gray-500 hover:text-gray-800'
                  }
                `}
              >
                <Database className="h-4 w-4" />
                Knowledge
              </button>
            </div>
          </div>

          {/* Sidebar Content */}

          {activeTab === 'chat' ? (
            <div className="flex flex-1 flex-col p-4">
              <button
                onClick={handleStartNewChat}
                className="
                  flex
                  w-full
                  items-center
                  justify-center
                  gap-2
                  rounded-xl
                  bg-[var(--color-brand-accent)]
                  px-4
                  py-3
                  text-xs
                  font-semibold
                  text-white
                  shadow-md
                  transition-all
                  hover:-translate-y-0.5
                  hover:opacity-95
                "
              >
                <Plus className="h-4 w-4" />
                New Chat
              </button>

              <div className="mt-5">
                <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">
                  Current conversation
                </p>

                {conversationId ? (
                  <div
                    className="
                      rounded-xl
                      border
                      border-blue-100
                      bg-blue-50/60
                      p-3
                    "
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[var(--color-brand-accent)]" />

                      <span className="text-xs font-semibold text-[var(--color-deep-navy)]">
                        Active session
                      </span>
                    </div>

                    <p className="mt-2 break-all font-mono text-[9px] text-gray-500">
                      {conversationId}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 p-4 text-center">
                    <MessageSquare className="mx-auto h-5 w-5 text-gray-300" />

                    <p className="mt-2 text-[11px] text-gray-500">
                      Start a new conversation.
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-brand-accent)] text-white">
                      <ShieldCheck className="h-4 w-4" />
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-gray-800">
                        RAG Protected
                      </p>

                      <p className="mt-1 text-[10px] leading-relaxed text-gray-500">
                        Answers are grounded in your indexed university documents.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4">
              {/* Upload */}

              <div className="mb-5">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-[var(--color-deep-navy)]">
                      Add knowledge
                    </p>

                    <p className="mt-0.5 text-[10px] text-gray-400">
                      Upload source documents
                    </p>
                  </div>

                  <UploadCloud className="h-4 w-4 text-[var(--color-brand-accent)]" />
                </div>

                <form
                  onSubmit={handleFileUpload}
                  className="space-y-3"
                >
                  <label
                    className="
                      group
                      flex
                      cursor-pointer
                      flex-col
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-dashed
                      border-blue-200
                      bg-blue-50/30
                      px-4
                      py-7
                      text-center
                      transition-all
                      hover:border-[var(--color-brand-accent)]
                      hover:bg-blue-50/60
                    "
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.docx,.txt"
                      onChange={(e) =>
                        setSelectedFile(
                          e.target.files?.[0] || null
                        )
                      }
                      className="hidden"
                    />

                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand-accent)] text-white shadow-sm">
                      <UploadCloud className="h-5 w-5" />
                    </div>

                    <p className="mt-3 text-xs font-semibold text-gray-700">
                      {selectedFile
                        ? selectedFile.name
                        : 'Choose a document'}
                    </p>

                    <p className="mt-1 text-[10px] text-gray-400">
                      PDF, DOCX or TXT
                    </p>
                  </label>

                  <input
                    type="text"
                    value={uploadCategory}
                    onChange={(e) =>
                      setUploadCategory(e.target.value)
                    }
                    placeholder="Document category"
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      px-3
                      py-2.5
                      text-xs
                      outline-none
                      transition
                      focus:border-[var(--color-brand-accent)]
                      focus:ring-2
                      focus:ring-[var(--color-brand-accent)]/10
                    "
                  />

                  <button
                    type="submit"
                    disabled={!selectedFile || uploading}
                    className="
                      flex
                      w-full
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-[var(--color-brand-accent)]
                      px-3
                      py-3
                      text-xs
                      font-semibold
                      text-white
                      shadow-sm
                      transition
                      hover:opacity-95
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Indexing...
                      </>
                    ) : (
                      <>
                        <UploadCloud className="h-4 w-4" />
                        Upload & Index
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Stats */}

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <p className="text-[10px] text-gray-400">
                    Documents
                  </p>

                  <p className="mt-1 text-lg font-bold text-[var(--color-deep-navy)]">
                    {documents.length}
                  </p>
                </div>

                <div className="rounded-xl border border-gray-200 bg-white p-3">
                  <p className="text-[10px] text-gray-400">
                    Status
                  </p>

                  <div className="mt-1 flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-accent)]" />

                    <span className="text-xs font-semibold text-[var(--color-brand-accent)]">
                      Indexed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>
      )}

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        {/* Main Toolbar */}

        <div className="flex shrink-0 items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() =>
                setSidebarOpen((prev) => !prev)
              }
              className="
                flex
                h-9 w-9
                items-center
                justify-center
                rounded-lg
                border
                border-gray-200
                text-gray-500
                transition
                hover:bg-gray-50
              "
              title="Toggle sidebar"
            >
              <PanelLeft className="h-4 w-4" />
            </button>

            <div>
              <p className="text-xs font-bold text-[var(--color-deep-navy)]">
                {activeTab === 'chat'
                  ? 'AI Admission Assistant'
                  : 'Knowledge Base'}
              </p>

              <p className="text-[10px] text-gray-400">
                {activeTab === 'chat'
                  ? 'Ask questions grounded in university documents'
                  : `${documents.length} indexed documents`}
              </p>
            </div>
          </div>

          <div className="hidden items-center gap-2 sm:flex">
            <div className="flex items-center gap-1.5 rounded-full border border-blue-100 bg-blue-50 px-2.5 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-brand-accent)]" />
              <span className="text-[10px] font-semibold text-[var(--color-brand-accent)]">
                Knowledge Connected
              </span>
            </div>
          </div>
        </div>

        {/* Status notification */}

        {statusMessage && (
          <div
            className="
              flex
              shrink-0
              items-center
              justify-between
              border-b
              border-blue-100
              bg-blue-50
              px-4
              py-2.5
              text-xs
              text-blue-900
              sm:px-6
            "
          >
            <div className="flex min-w-0 items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 text-[var(--color-brand-accent)]" />

              <span className="truncate">
                {statusMessage}
              </span>
            </div>

            <button
              onClick={() => setStatusMessage(null)}
              className="ml-3 shrink-0 rounded-md p-1 text-blue-400 hover:bg-blue-100 hover:text-blue-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* ===================================================
            CHAT
        =================================================== */}

        {activeTab === 'chat' ? (
          <>
            <div
              ref={messagesContainerRef}
              className="
                flex-1
                overflow-y-auto
                bg-[#FBFCFE]
                px-4
                py-6
                sm:px-8
                lg:px-12
              "
            >
              <div className="mx-auto max-w-4xl">
                {messages.length === 0 ? (
                  <div className="flex min-h-full flex-col items-center justify-center py-20 text-center">
                    <div
                      className="
                        flex
                        h-16 w-16
                        items-center
                        justify-center
                        rounded-2xl
                        bg-[var(--color-brand-accent)]
                        text-white
                        shadow-lg
                      "
                    >
                      <Bot className="h-8 w-8 text-white" />
                    </div>

                    <div className="mt-5">
                      <h2 className="text-xl font-bold text-[var(--color-deep-navy)]">
                        How can I help with admissions?
                      </h2>

                      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                        Ask about admission requirements, programs,
                        application procedures, fees, deadlines,
                        or other information available in the
                        university knowledge base.
                      </p>
                    </div>

                    <div className="mt-7 grid w-full max-w-xl grid-cols-1 gap-2 sm:grid-cols-2">
                      {[
                        'What are the admission requirements?',
                        'What programs are currently available?',
                        'How can I apply?',
                        'What documents do I need?',
                      ].map((question) => (
                        <button
                          key={question}
                          onClick={() => {
                            setNewMessageContent(question);
                          }}
                          className="
                            flex
                            items-center
                            justify-between
                            rounded-xl
                            border
                            border-gray-200
                            bg-white
                            px-4
                            py-3
                            text-left
                            text-xs
                            font-medium
                            text-gray-700
                            shadow-sm
                            transition
                            hover:border-[var(--color-brand-accent)]
                            hover:bg-blue-50/50
                          "
                        >
                          <span>{question}</span>
                          <ChevronRight className="ml-2 h-4 w-4 shrink-0 text-gray-300" />
                        </button>
                      ))}
                    </div>

                    <div className="mt-7 flex items-center gap-2 text-[10px] text-gray-400">
                      <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-brand-accent)]" />
                      Responses are grounded in indexed university content.
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((msg) => {
                      const isUser =
                        msg.role === 'user';

                      return (
                        <div
                          key={msg.id}
                          className={`flex gap-3 ${
                            isUser
                              ? 'justify-end'
                              : 'justify-start'
                          }`}
                        >
                          {!isUser && (
                            <div
                              className="
                                flex
                                h-9 w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-[var(--color-brand-accent)]
                                text-white
                                shadow-sm
                              "
                            >
                              <Bot className="h-4 w-4" />
                            </div>
                          )}

                          <div
                            className={`
                              max-w-[85%]
                              sm:max-w-[75%]
                              ${
                                isUser
                                  ? 'items-end'
                                  : 'items-start'
                              }
                            `}
                          >
                            <div
                              className={`
                                rounded-2xl
                                px-4 py-3.5
                                shadow-sm
                                ${
                                  isUser
                                    ? 'rounded-tr-md bg-[var(--color-brand-accent)] text-white'
                                    : 'rounded-tl-md border border-gray-200 bg-white text-gray-800'
                                }
                              `}
                            >
                              <div
                                className={`
                                  mb-1.5
                                  flex
                                  items-center
                                  gap-1.5
                                  text-[9px]
                                  font-bold
                                  uppercase
                                  tracking-[0.15em]
                                  ${
                                    isUser
                                      ? 'text-white/70'
                                      : 'text-gray-400'
                                  }
                                `}
                              >
                                {isUser ? (
                                  <>
                                    <User className="h-3 w-3" />
                                    You
                                  </>
                                ) : (
                                  <>
                                    <Sparkles className="h-3 w-3 text-[var(--color-brand-accent)]" />
                                    SNU Assistant
                                  </>
                                )}
                              </div>

                              <div
                                className={`
                                  text-[13px]
                                  leading-7
                                  ${
                                    isUser
                                      ? 'whitespace-pre-wrap'
                                      : 'prose prose-sm max-w-none'
                                  }
                                `}
                              >
                                {isUser ? (
                                  msg.content
                                ) : (
                                  <ReactMarkdown>
                                    {msg.content}
                                  </ReactMarkdown>
                                )}
                              </div>
                            </div>

                            <div
                              className={`mt-1.5 flex items-center gap-1.5 text-[9px] text-gray-400 ${
                                isUser
                                  ? 'justify-end'
                                  : 'justify-start'
                              }`}
                            >
                              <Clock3 className="h-3 w-3" />
                              {msg.created_at}
                            </div>
                          </div>

                          {isUser && (
                            <div
                              className="
                                flex
                                h-9 w-9
                                shrink-0
                                items-center
                                justify-center
                                rounded-xl
                                bg-[var(--color-brand-accent)]
                                text-white
                                shadow-sm
                              "
                            >
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      );
                    })}

                    {sendingMessage && (
                      <div className="flex gap-3">
                        <div
                          className="
                            flex
                            h-9 w-9
                            shrink-0
                            items-center
                            justify-center
                            rounded-xl
                            bg-[var(--color-brand-accent)]
                            text-white
                          "
                        >
                          <Bot className="h-4 w-4" />
                        </div>

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            rounded-2xl
                            rounded-tl-md
                            border
                            border-gray-200
                            bg-white
                            px-4
                            py-3.5
                            shadow-sm
                          "
                        >
                          <Loader2 className="h-4 w-4 animate-spin text-[var(--color-brand-accent)]" />

                          <span className="text-xs font-medium text-gray-500">
                            Searching knowledge base...
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Composer */}

            <div className="shrink-0 border-t border-gray-200 bg-white px-4 py-4 sm:px-8">
              <form
                onSubmit={handleSendMessage}
                className="mx-auto max-w-4xl"
              >
                <div
                  className="
                    flex
                    items-center
                    gap-2
                    rounded-2xl
                    border
                    border-gray-200
                    bg-gray-50
                    px-3
                    py-2
                    shadow-sm
                    transition
                    focus-within:border-[var(--color-brand-accent)]
                    focus-within:bg-white
                    focus-within:ring-4
                    focus-within:ring-[var(--color-brand-accent)]/10
                  "
                >
                  <MessageSquare className="ml-1 h-4 w-4 shrink-0 text-gray-400" />

                  <input
                    type="text"
                    value={newMessageContent}
                    onChange={(e) =>
                      setNewMessageContent(
                        e.target.value
                      )
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === 'Enter' &&
                        !e.shiftKey &&
                        !sendingMessage
                      ) {
                        e.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                    placeholder="Ask anything about SNU admissions..."
                    disabled={sendingMessage}
                    className="
                      min-w-0
                      flex-1
                      bg-transparent
                      px-2
                      py-2
                      text-sm
                      text-gray-800
                      outline-none
                      placeholder:text-gray-400
                    "
                  />

                  <button
                    type="submit"
                    disabled={
                      sendingMessage ||
                      !newMessageContent.trim()
                    }
                    className="
                      flex
                      h-10 w-10
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-[var(--color-brand-accent)]
                      text-white
                      shadow-sm
                      transition
                      hover:-translate-y-0.5
                      hover:opacity-95
                      disabled:cursor-not-allowed
                      disabled:opacity-40
                    "
                  >
                    {sendingMessage ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <p className="mt-2 text-center text-[9px] text-gray-400">
                  AI-generated responses may require verification against official university sources.
                </p>
              </form>
            </div>
          </>
        ) : (
          /* =================================================
             KNOWLEDGE BASE
          ================================================= */

          <div className="flex-1 overflow-y-auto bg-[#FBFCFE] px-4 py-6 sm:px-8 lg:px-12">
            <div className="mx-auto max-w-6xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-[var(--color-brand-accent)]" />

                    <h2 className="text-lg font-bold text-[var(--color-deep-navy)]">
                      Knowledge Base
                    </h2>
                  </div>

                  <p className="mt-1 text-xs text-gray-500">
                    Manage the documents used by the RAG assistant.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 shadow-sm">
                    <p className="text-[9px] uppercase tracking-wider text-gray-400">
                      Documents
                    </p>

                    <p className="mt-0.5 text-sm font-bold text-[var(--color-deep-navy)]">
                      {documents.length}
                    </p>
                  </div>

                  <button
                    onClick={() => void loadDocuments()}
                    className="
                      flex
                      h-10 w-10
                      items-center
                      justify-center
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      text-gray-500
                      shadow-sm
                      transition
                      hover:bg-gray-50
                    "
                    title="Refresh documents"
                  >
                    <RefreshCw
                      className={`h-4 w-4 ${
                        loadingDocuments
                          ? 'animate-spin'
                          : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Search */}

              <div className="mt-6">
                <div className="relative max-w-md">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                  <input
                    type="text"
                    value={documentSearch}
                    onChange={(e) =>
                      setDocumentSearch(
                        e.target.value
                      )
                    }
                    placeholder="Search documents..."
                    className="
                      w-full
                      rounded-xl
                      border
                      border-gray-200
                      bg-white
                      py-3
                      pl-10
                      pr-4
                      text-xs
                      outline-none
                      shadow-sm
                      focus:border-[var(--color-brand-accent)]
                      focus:ring-4
                      focus:ring-[var(--color-brand-accent)]/10
                    "
                  />
                </div>
              </div>

              {/* Documents */}

              <div className="mt-6">
                {loadingDocuments ? (
                  <div className="flex h-64 items-center justify-center">
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <Loader2 className="h-5 w-5 animate-spin text-[var(--color-brand-accent)]" />
                      Loading knowledge base...
                    </div>
                  </div>
                ) : filteredDocuments.length === 0 ? (
                  <div
                    className="
                      flex
                      min-h-[320px]
                      flex-col
                      items-center
                      justify-center
                      rounded-2xl
                      border
                      border-dashed
                      border-gray-200
                      bg-white
                      text-center
                    "
                  >
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-50">
                      <FileText className="h-7 w-7 text-gray-300" />
                    </div>

                    <h3 className="mt-4 text-sm font-semibold text-gray-700">
                      No documents found
                    </h3>

                    <p className="mt-1 max-w-sm text-xs text-gray-400">
                      Upload university documents to build your
                      admission assistant's knowledge base.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {filteredDocuments.map((doc) => (
                      <div
                        key={doc.id}
                        className="
                          group
                          rounded-2xl
                          border
                          border-gray-200
                          bg-white
                          p-4
                          shadow-sm
                          transition
                          hover:-translate-y-0.5
                          hover:border-[var(--color-brand-accent)]
                          hover:shadow-md
                        "
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex min-w-0 items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
                              <File className="h-5 w-5 text-red-500" />
                            </div>

                            <div className="min-w-0">
                              <p
                                className="truncate text-xs font-semibold text-gray-800"
                                title={doc.file_name}
                              >
                                {doc.file_name}
                              </p>

                              <p className="mt-1 text-[10px] text-gray-400">
                                {doc.upload_date}
                              </p>
                            </div>
                          </div>

                          <FileCheck2 className="h-4 w-4 shrink-0 text-[var(--color-brand-accent)]" />
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[var(--color-brand-accent)]">
                            {doc.category}
                          </span>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                openDocumentPreview(doc)
                              }
                              className="
                                rounded-lg
                                p-2
                                text-gray-400
                                transition
                                hover:bg-blue-50
                                hover:text-[var(--color-brand-accent)]
                              "
                              title="Preview document"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() =>
                                void handleDeleteDoc(
                                  doc.id
                                )
                              }
                              className="
                                rounded-lg
                                p-2
                                text-gray-400
                                transition
                                hover:bg-red-50
                                hover:text-red-500
                              "
                              title="Delete document"
                            >
                              <Trash2 className="h-4 w-4" />
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
        )}
      </main>

      {/* =====================================================
          DOCUMENT PREVIEW MODAL
      ===================================================== */}

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

// Small reusable icon wrapper
function BrainCircuitIcon() {
  return (
    <Sparkles className="h-5 w-5 text-white" />
  );
}