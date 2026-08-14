import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import ReactMarkdown from 'react-markdown';
import {
  AlertCircle,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Database,
  Eye,
  File as FileIcon,
  FileCheck2,
  FileText,
  Loader2,
  MessageSquare,
  PanelLeft,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Trash2,
  UploadCloud,
  User,
  X,
} from 'lucide-react';

import {
  streamChatMessage,
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

const SUGGESTED_QUESTIONS = [
  'What are the admission requirements?',
  'What programs are currently available?',
  'How can I apply?',
  'What documents do I need?',
] as const;

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-accent)] focus-visible:ring-offset-2';

const primaryButton =
  'bg-[var(--color-brand-accent)] text-white hover:bg-[var(--color-brand-accent-hover)]';

const secondaryButton =
  'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900';

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'documents'>('chat');

  // Chat state
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [newMessageContent, setNewMessageContent] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  // Document state
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadCategory, setUploadCategory] = useState('General Policy');
  const [uploading, setUploading] = useState(false);
  const [documentSearch, setDocumentSearch] = useState('');

  // UI state
  const [previewDoc, setPreviewDoc] = useState<{
    url: string;
    name: string;
  } | null>(null);

  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);

  const loadDocuments = useCallback(async () => {
    setLoadingDocuments(true);

    try {
      const data = await fetchDocuments();
      setDocuments(data);
    } catch (error) {
      setStatusMessage(
        error instanceof Error
          ? error.message
          : 'Failed to load documents.',
      );
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  useEffect(() => {
    const container = messagesContainerRef.current;

    if (!container) {
      return;
    }

    container.scrollTo({
      top: container.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, sendingMessage]);

  const handleStartNewChat = useCallback(() => {
    setConversationId(null);
    setMessages([]);
    setNewMessageContent('');
    setStatusMessage(null);
    setActiveTab('chat');
  }, []);

  const handleSendMessage = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();

      const trimmedMessage = newMessageContent.trim();

      if (!trimmedMessage || sendingMessage) {
        return;
      }

      const timestamp = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });

      const userMessage: LocalMessage = {
        id: `${Date.now()}-user`,
        role: 'user',
        content: trimmedMessage,
        created_at: timestamp,
      };

      const assistantMessageId = `${Date.now()}-assistant`;

      const assistantPlaceholder: LocalMessage = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        created_at: timestamp,
      };

      setMessages((previous) => [
        ...previous,
        userMessage,
        assistantPlaceholder,
      ]);

      setNewMessageContent('');
      setSendingMessage(true);
      setStatusMessage(null);

      await streamChatMessage(trimmedMessage, conversationId, {
        onToken: (token: string) => {
          setMessages((previous) =>
            previous.map((message) =>
              message.id === assistantMessageId
                ? {
                    ...message,
                    content: message.content + token,
                  }
                : message,
            ),
          );
        },

        onComplete: (data) => {
          if (data?.conversation_id) {
            setConversationId(data.conversation_id);
          }

          setSendingMessage(false);
        },

        onError: (error) => {
          setStatusMessage(
            error.message || 'Failed to stream response.',
          );
          setSendingMessage(false);
        },
      });
    },
    [
      conversationId,
      newMessageContent,
      sendingMessage,
    ],
  );

  const handleFileUpload = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();

      if (!selectedFile || uploading) {
        return;
      }

      setUploading(true);
      setStatusMessage(null);

      try {
        const newDocument = await uploadDocument(
          selectedFile,
          uploadCategory,
        );

        setDocuments((previous) => [
          newDocument,
          ...previous,
        ]);

        setSelectedFile(null);

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        setStatusMessage(
          'Document uploaded and indexed successfully.',
        );
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : 'Failed to upload document.',
        );
      } finally {
        setUploading(false);
      }
    },
    [selectedFile, uploadCategory, uploading],
  );

  const handleDeleteDocument = useCallback(
    async (documentId: string) => {
      if (
        !window.confirm(
          'Are you sure you want to permanently delete this document?',
        )
      ) {
        return;
      }

      try {
        await deleteDocument(documentId);

        setDocuments((previous) =>
          previous.filter((document) => document.id !== documentId),
        );

        setStatusMessage('Document deleted successfully.');
      } catch (error) {
        setStatusMessage(
          error instanceof Error
            ? error.message
            : 'Failed to delete document.',
        );
      }
    },
    [],
  );

  const filteredDocuments = documents.filter((document) => {
    const search = documentSearch.toLowerCase().trim();

    if (!search) {
      return true;
    }

    return (
      document.file_name.toLowerCase().includes(search) ||
      document.category.toLowerCase().includes(search)
    );
  });

  const isChatTab = activeTab === 'chat';

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-slate-50 font-sans text-slate-800">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close navigation sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-20 bg-slate-900/30 lg:hidden"
        />
      )}

      {/* Sidebar */}
      <aside
        aria-label="Application navigation"
        className={`
          fixed inset-y-0 left-0 z-30
          flex w-[280px] flex-col
          border-r border-slate-200
          bg-white
          transition-transform duration-200 ease-out

          lg:static
          lg:z-auto
          lg:w-72
          lg:translate-x-0
        ${
          sidebarOpen
            ? 'translate-x-0'
            : '-translate-x-full lg:translate-x-0'
        }
        `}
      >
        <SidebarHeader />

        <SidebarTabs
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {isChatTab ? (
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

      {/* Main workspace */}
      <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-white">
        <WorkspaceHeader
          activeTab={activeTab}
          documentCount={documents.length}
          onToggleSidebar={() =>
            setSidebarOpen((previous) => !previous)
          }
        />

        {statusMessage && (
          <StatusBanner
            message={statusMessage}
            onDismiss={() => setStatusMessage(null)}
          />
        )}

        {isChatTab ? (
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
            onPreview={(document) =>
              setPreviewDoc({
                url: `${API_BASE_URL}/documents/${document.id}/file`,
                name: document.file_name,
              })
            }
            onDelete={handleDeleteDocument}
          />
        )}
      </main>

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

/* -------------------------------------------------------------------------- */
/* Sidebar                                                                     */
/* -------------------------------------------------------------------------- */

function SidebarHeader() {
  return (
    <header className="border-b border-slate-100 px-5 py-4">
      <div className="flex items-center gap-3">
        <div
          className="
            flex h-10 w-10 shrink-0 items-center justify-center
            rounded-xl
            bg-[var(--color-brand-accent)]
            text-white
          "
          aria-hidden="true"
        >
          <Sparkles className="h-5 w-5" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-slate-900">
            Admission AI
          </p>

          <p className="mt-0.5 truncate text-[11px] font-medium text-slate-400">
            SNU Knowledge Platform
          </p>
        </div>
      </div>
    </header>
  );
}

interface SidebarTabsProps {
  activeTab: 'chat' | 'documents';
  onChange: (tab: 'chat' | 'documents') => void;
}

function SidebarTabs({
  activeTab,
  onChange,
}: SidebarTabsProps) {
  return (
    <nav
      aria-label="Workspace sections"
      className="border-b border-slate-100 p-3"
    >
      <div
        className="grid grid-cols-2 rounded-xl bg-slate-100 p-1"
        role="tablist"
        aria-label="Workspace"
      >
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'chat'}
          onClick={() => onChange('chat')}
          className={`
            flex min-h-9 items-center justify-center gap-2
            rounded-lg px-2
            text-xs font-semibold
            transition-colors
            ${focusRing}
            ${
              activeTab === 'chat'
                ? 'bg-white text-[var(--color-brand-accent)] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }
          `}
        >
          <MessageSquare
            className="h-3.5 w-3.5"
            aria-hidden="true"
          />
          Chat
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'documents'}
          onClick={() => onChange('documents')}
          className={`
            flex min-h-9 items-center justify-center gap-2
            rounded-lg px-2
            text-xs font-semibold
            transition-colors
            ${focusRing}
            ${
              activeTab === 'documents'
                ? 'bg-white text-[var(--color-brand-accent)] shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }
          `}
        >
          <Database
            className="h-3.5 w-3.5"
            aria-hidden="true"
          />
          Knowledge
        </button>
      </div>
    </nav>
  );
}

interface SidebarChatViewProps {
  conversationId: string | null;
  onNewChat: () => void;
}

function SidebarChatView({
  conversationId,
  onNewChat,
}: SidebarChatViewProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="space-y-5">
        <button
          type="button"
          onClick={onNewChat}
          className={`
            flex min-h-11 w-full items-center justify-center gap-2
            rounded-xl
            px-4
            text-xs font-semibold
            shadow-sm
            transition
            active:scale-[0.99]
            ${primaryButton}
            ${focusRing}
          `}
        >
          <Plus
            className="h-4 w-4"
            aria-hidden="true"
          />
          New Conversation
        </button>

        <section>
          <p className="mb-2 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">
            Current Session
          </p>

          {conversationId ? (
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3.5">
              <div className="flex items-center gap-2">
                <CheckCircle2
                  className="h-4 w-4 text-[var(--color-brand-accent)]"
                  aria-hidden="true"
                />

                <span className="text-xs font-semibold text-slate-800">
                  Active Context
                </span>
              </div>

              <p className="mt-2 break-all font-mono text-[10px] leading-4 text-slate-500">
                {conversationId}
              </p>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 p-4 text-center">
              <MessageSquare
                className="mx-auto h-5 w-5 text-slate-300"
                aria-hidden="true"
              />

              <p className="mt-2 text-xs text-slate-500">
                No active context yet.
              </p>
            </div>
          )}
        </section>
      </div>

      <section className="mt-auto pt-6">
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5">
          <div className="flex items-start gap-3">
            <div
              className="
                flex h-7 w-7 shrink-0 items-center justify-center
                rounded-lg
                bg-[var(--color-brand-accent)]
                text-white
              "
              aria-hidden="true"
            >
              <ShieldCheck className="h-4 w-4" />
            </div>

            <div>
              <p className="text-xs font-semibold text-slate-800">
                Grounding Guarantee
              </p>

              <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                Engineered with strict RAG validation against official
                guidelines.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

interface SidebarKnowledgeViewProps {
  selectedFile: File | null;
  uploadCategory: string;
  uploading: boolean;
  docCount: number;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onCategoryChange: (value: string) => void;
  onFileSelect: (file: File | null) => void;
  onUpload: (event: React.FormEvent) => void;
}

function SidebarKnowledgeView({
  selectedFile,
  uploadCategory,
  uploading,
  docCount,
  fileInputRef,
  onCategoryChange,
  onFileSelect,
  onUpload,
}: SidebarKnowledgeViewProps) {
  return (
    <div className="space-y-5">
      <section>
        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold text-slate-800">
            Upload Source Data
          </p>

          <UploadCloud
            className="h-4 w-4 text-[var(--color-brand-accent)]"
            aria-hidden="true"
          />
        </div>

        <form
          onSubmit={onUpload}
          className="space-y-3"
        >
          <label
            className="
              group flex cursor-pointer flex-col items-center
              justify-center rounded-xl
              border border-dashed border-blue-200
              bg-blue-50/20
              p-5 text-center
              transition
              hover:border-[var(--color-brand-accent)]
              hover:bg-blue-50/50
            "
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.txt"
              onChange={(event) =>
                onFileSelect(
                  event.target.files?.[0] || null,
                )
              }
              className="sr-only"
            />

            <div
              className="
                flex h-9 w-9 items-center justify-center
                rounded-lg
                bg-[var(--color-brand-accent)]
                text-white
                shadow-sm
                transition
                group-hover:scale-105
              "
              aria-hidden="true"
            >
              <UploadCloud className="h-4 w-4" />
            </div>

            <p
              className="mt-2.5 max-w-[190px] truncate text-xs font-semibold text-slate-700"
              title={selectedFile?.name}
            >
              {selectedFile
                ? selectedFile.name
                : 'Choose document'}
            </p>

            <p className="mt-0.5 text-[10px] text-slate-400">
              PDF, DOCX, or TXT
            </p>
          </label>

          <input
            type="text"
            value={uploadCategory}
            onChange={(event) =>
              onCategoryChange(event.target.value)
            }
            placeholder="Document Category"
            aria-label="Document Category"
            className={`
              w-full rounded-xl border border-slate-200
              bg-white px-3 py-2.5
              text-xs text-slate-800
              outline-none
              transition
              focus:border-[var(--color-brand-accent)]
              focus:ring-2
              focus:ring-[var(--color-brand-accent)]/10
            `}
          />

          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className={`
              flex min-h-10 w-full items-center justify-center gap-2
              rounded-xl
              px-3 py-2.5
              text-xs font-semibold
              shadow-sm
              transition
              disabled:cursor-not-allowed
              disabled:opacity-40
              ${primaryButton}
              ${focusRing}
            `}
          >
            {uploading ? (
              <>
                <Loader2
                  className="h-3.5 w-3.5 animate-spin"
                  aria-hidden="true"
                />
                Indexing...
              </>
            ) : (
              'Upload & Index'
            )}
          </button>
        </form>
      </section>

      <section className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
          <p className="text-[10px] font-medium text-slate-400">
            Indexed Total
          </p>

          <p className="mt-0.5 text-base font-bold text-slate-800">
            {docCount}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5">
          <p className="text-[10px] font-medium text-slate-400">
            Status
          </p>

          <div className="mt-1 flex items-center gap-1.5">
            <span
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
              aria-hidden="true"
            />

            <span className="text-xs font-semibold text-slate-700">
              Ready
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Workspace Header                                                            */
/* -------------------------------------------------------------------------- */

interface WorkspaceHeaderProps {
  activeTab: 'chat' | 'documents';
  documentCount: number;
  onToggleSidebar: () => void;
}

function WorkspaceHeader({
  activeTab,
  documentCount,
  onToggleSidebar,
}: WorkspaceHeaderProps) {
  const isChat = activeTab === 'chat';

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-slate-200 bg-white px-4 py-3.5 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation sidebar"
          className={`
            flex h-9 w-9 shrink-0 items-center justify-center
            rounded-lg
            ${secondaryButton}
            transition
            ${focusRing}
          `}
        >
          <PanelLeft
            className="h-4 w-4"
            aria-hidden="true"
          />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-sm font-bold tracking-tight text-slate-900">
            {isChat
              ? 'AI Admission Assistant'
              : 'Knowledge Base Repository'}
          </h1>

          <p className="mt-0.5 truncate text-[11px] text-slate-400">
            {isChat
              ? 'Grounded in verified institutional sources'
              : `${documentCount} documents indexed and ready`}
          </p>
        </div>
      </div>

      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
          <span
            className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500"
            aria-hidden="true"
          />
          RAG Connected
        </span>
      </div>
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Status Banner                                                               */
/* -------------------------------------------------------------------------- */

interface StatusBannerProps {
  message: string;
  onDismiss: () => void;
}

function StatusBanner({
  message,
  onDismiss,
}: StatusBannerProps) {
  return (
    <div
      role="status"
      className="
        flex shrink-0 items-center justify-between gap-3
        border-b border-blue-100
        bg-blue-50/70
        px-4 py-2.5
        text-xs font-medium text-blue-900
        sm:px-6
      "
    >
      <div className="flex min-w-0 items-center gap-2">
        <AlertCircle
          className="h-4 w-4 shrink-0 text-[var(--color-brand-accent)]"
          aria-hidden="true"
        />

        <span className="truncate">
          {message}
        </span>
      </div>

      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss message"
        className={`
          flex h-7 w-7 shrink-0 items-center justify-center
          rounded-md
          text-blue-400
          transition
          hover:bg-blue-100
          hover:text-blue-700
          ${focusRing}
        `}
      >
        <X
          className="h-3.5 w-3.5"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Chat Area                                                                   */
/* -------------------------------------------------------------------------- */

interface ChatAreaProps {
  messages: LocalMessage[];
  sendingMessage: boolean;
  newMessageContent: string;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  setNewMessageContent: (value: string) => void;
  onSendMessage: (event?: React.FormEvent) => void;
}

function ChatArea({
  messages,
  sendingMessage,
  newMessageContent,
  messagesContainerRef,
  setNewMessageContent,
  onSendMessage,
}: ChatAreaProps) {
  const isEmpty = messages.length === 0;

  return (
    <>
      <section
        ref={messagesContainerRef}
        tabIndex={0}
        aria-label="Conversation area"
        aria-live="polite"
        className="
          flex-1 overflow-y-auto
          bg-slate-50/70
          px-4 py-6
          outline-none
          sm:px-8
        "
      >
        <div className="mx-auto max-w-3xl">
          {isEmpty ? (
            <EmptyChatState
              onQuestionSelect={setNewMessageContent}
            />
          ) : (
            <ConversationMessages
              messages={messages}
              sendingMessage={sendingMessage}
            />
          )}
        </div>
      </section>

      <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3.5 sm:px-8">
        <ChatComposer
          value={newMessageContent}
          sendingMessage={sendingMessage}
          onChange={setNewMessageContent}
          onSubmit={onSendMessage}
        />
      </footer>
    </>
  );
}

interface EmptyChatStateProps {
  onQuestionSelect: (question: string) => void;
}

function EmptyChatState({
  onQuestionSelect,
}: EmptyChatStateProps) {
  return (
    <div className="flex min-h-[calc(100vh-280px)] flex-col items-center justify-center py-10 text-center">
      <div
        className="
          flex h-14 w-14 items-center justify-center
          rounded-2xl
          bg-[var(--color-brand-accent)]
          text-white
          shadow-lg
          shadow-blue-500/15
        "
        aria-hidden="true"
      >
        <Bot className="h-7 w-7" />
      </div>

      <h2 className="mt-5 text-lg font-bold tracking-tight text-slate-900">
        How can I assist your admission today?
      </h2>

      <p className="mt-2 max-w-md text-xs leading-5 text-slate-500">
        Get immediate answers regarding degree paths, deadlines,
        fees, and requirements derived from source documents.
      </p>

      <div className="mt-7 grid w-full max-w-md grid-cols-1 gap-2 sm:grid-cols-2">
        {SUGGESTED_QUESTIONS.map((question) => (
          <button
            type="button"
            key={question}
            onClick={() => onQuestionSelect(question)}
            className={`
              group flex min-h-11 items-center justify-between
              gap-3
              rounded-xl
              border border-slate-200
              bg-white
              p-3
              text-left
              text-xs font-medium
              text-slate-700
              shadow-sm
              transition
              hover:border-[var(--color-brand-accent)]
              hover:bg-blue-50/30
              ${focusRing}
            `}
          >
            <span>{question}</span>

            <ChevronRight
              className="
                h-3.5 w-3.5 shrink-0
                text-slate-400
                transition-transform
                group-hover:translate-x-0.5
              "
              aria-hidden="true"
            />
          </button>
        ))}
      </div>
    </div>
  );
}

interface ConversationMessagesProps {
  messages: LocalMessage[];
  sendingMessage: boolean;
}

function ConversationMessages({
  messages,
  sendingMessage,
}: ConversationMessagesProps) {
  const lastMessage = messages[messages.length - 1];

  const shouldShowLoading =
    sendingMessage &&
    lastMessage?.role === 'assistant' &&
    lastMessage.content === '';

  return (
    <div className="space-y-6">
      {messages.map((message) => (
        <ConversationMessage
          key={message.id}
          message={message}
        />
      ))}

      {shouldShowLoading && <KnowledgeSearchIndicator />}
    </div>
  );
}

interface ConversationMessageProps {
  message: LocalMessage;
}

function ConversationMessage({
  message,
}: ConversationMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex gap-3 ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      {!isUser && (
        <div
          className="
            flex h-8 w-8 shrink-0 items-center justify-center
            rounded-xl
            bg-[var(--color-brand-accent)]
            text-white
            shadow-sm
          "
          aria-hidden="true"
        >
          <Bot className="h-4 w-4" />
        </div>
      )}

      <div
        className={`max-w-[88%] sm:max-w-[76%] ${
          isUser ? 'items-end' : 'items-start'
        }`}
      >
        <div
          className={`
            rounded-2xl
            px-4 py-3
            shadow-sm
            ${
              isUser
                ? `
                  rounded-tr-none
                  bg-[var(--color-brand-accent)]
                  text-white
                `
                : `
                  rounded-tl-none
                  border border-slate-200
                  bg-white
                  text-slate-800
                `
            }
          `}
        >
          <div
            className={`
              mb-1.5 flex items-center gap-1.5
              text-[10px] font-bold uppercase tracking-[0.12em]
              ${
                isUser
                  ? 'text-white/75'
                  : 'text-slate-400'
              }
            `}
          >
            {isUser ? (
              <User
                className="h-3 w-3"
                aria-hidden="true"
              />
            ) : (
              <Sparkles
                className="h-3 w-3 text-[var(--color-brand-accent)]"
                aria-hidden="true"
              />
            )}

            {isUser ? 'You' : 'Assistant'}
          </div>

          <div
            className={
              isUser
                ? 'whitespace-pre-wrap text-[13px] leading-5'
                : `
                  text-[13px]
                  leading-6
                  [&_a]:font-medium
                  [&_a]:text-[var(--color-brand-accent)]
                  [&_a]:underline
                  [&_blockquote]:my-3
                  [&_blockquote]:border-l-2
                  [&_blockquote]:border-slate-200
                  [&_blockquote]:pl-3
                  [&_code]:rounded
                  [&_code]:bg-slate-100
                  [&_code]:px-1
                  [&_code]:py-0.5
                  [&_code]:text-[11px]
                  [&_h1]:mb-2
                  [&_h1]:mt-3
                  [&_h1]:text-base
                  [&_h1]:font-semibold
                  [&_h2]:mb-2
                  [&_h2]:mt-3
                  [&_h2]:text-[15px]
                  [&_h2]:font-semibold
                  [&_h3]:mb-1.5
                  [&_h3]:mt-2.5
                  [&_h3]:text-sm
                  [&_h3]:font-semibold
                  [&_li]:my-0.5
                  [&_ol]:my-2
                  [&_p]:my-1.5
                  [&_p:first-child]:mt-0
                  [&_p:last-child]:mb-0
                  [&_pre]:my-3
                  [&_pre]:overflow-x-auto
                  [&_pre]:rounded-lg
                  [&_pre]:bg-slate-900
                  [&_pre]:p-3
                  [&_strong]:font-semibold
                  [&_ul]:my-2
                `
            }
          >
            {isUser ? (
              message.content
            ) : (
              <ReactMarkdown>
                {message.content}
              </ReactMarkdown>
            )}
          </div>
        </div>

        <div
          className={`
            mt-1 flex items-center gap-1
            text-[10px] text-slate-400
            ${isUser ? 'justify-end' : 'justify-start'}
          `}
        >
          <Clock3
            className="h-3 w-3"
            aria-hidden="true"
          />
          <span>{message.created_at}</span>
        </div>
      </div>

      {isUser && (
        <div
          className="
            flex h-8 w-8 shrink-0 items-center justify-center
            rounded-xl
            bg-slate-800
            text-white
            shadow-sm
          "
          aria-hidden="true"
        >
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
}

function KnowledgeSearchIndicator() {
  return (
    <div className="flex gap-3" role="status">
      <div
        className="
          flex h-8 w-8 shrink-0 items-center justify-center
          rounded-xl
          bg-[var(--color-brand-accent)]
          text-white
        "
        aria-hidden="true"
      >
        <Bot className="h-4 w-4" />
      </div>

      <div className="flex items-center gap-2 rounded-2xl rounded-tl-none border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <Loader2
          className="h-3.5 w-3.5 animate-spin text-[var(--color-brand-accent)]"
          aria-hidden="true"
        />

        <span className="text-xs text-slate-500">
          Searching knowledge base...
        </span>
      </div>
    </div>
  );
}

interface ChatComposerProps {
  value: string;
  sendingMessage: boolean;
  onChange: (value: string) => void;
  onSubmit: (event?: React.FormEvent) => void;
}

function ChatComposer({
  value,
  sendingMessage,
  onChange,
  onSubmit,
}: ChatComposerProps) {
  const hasMessage = value.trim().length > 0;

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-3xl"
    >
      <div
        className="
          flex items-center gap-2
          rounded-2xl
          border border-slate-200
          bg-slate-50/80
          p-2
          transition
          focus-within:border-[var(--color-brand-accent)]
          focus-within:bg-white
          focus-within:ring-4
          focus-within:ring-[var(--color-brand-accent)]/10
        "
      >
        <MessageSquare
          className="ml-2 h-4 w-4 shrink-0 text-slate-400"
          aria-hidden="true"
        />

        <input
          type="text"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey &&
              !sendingMessage
            ) {
              event.preventDefault();
              onSubmit();
            }
          }}
          placeholder="Ask about admissions, deadlines, requirements..."
          aria-label="Ask about admissions, deadlines, requirements"
          disabled={sendingMessage}
          className="
            min-w-0 flex-1
            bg-transparent
            px-2 py-2
            text-[13px]
            text-slate-800
            outline-none
            placeholder:text-slate-400
            disabled:cursor-not-allowed
            disabled:text-slate-400
          "
        />

        <button
          type="submit"
          disabled={sendingMessage || !hasMessage}
          aria-label={
            sendingMessage
              ? 'Sending message'
              : 'Send message'
          }
          className={`
            flex h-9 w-9 shrink-0 items-center justify-center
            rounded-xl
            text-white
            shadow-sm
            transition
            active:scale-95
            disabled:cursor-not-allowed
            disabled:bg-slate-200
            disabled:text-slate-400
            ${primaryButton}
            ${focusRing}
          `}
        >
          {sendingMessage ? (
            <Loader2
              className="h-4 w-4 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <Send
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
          )}
        </button>
      </div>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Knowledge Base                                                              */
/* -------------------------------------------------------------------------- */

interface KnowledgeAreaProps {
  documents: DocumentItem[];
  loading: boolean;
  documentSearch: string;
  setDocumentSearch: (value: string) => void;
  onRefresh: () => void;
  onPreview: (document: DocumentItem) => void;
  onDelete: (id: string) => void;
}

function KnowledgeArea({
  documents,
  loading,
  documentSearch,
  setDocumentSearch,
  onRefresh,
  onPreview,
  onDelete,
}: KnowledgeAreaProps) {
  return (
    <section className="flex-1 overflow-y-auto bg-slate-50/70 px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search
              className="
                absolute left-3.5 top-1/2
                h-4 w-4 -translate-y-1/2
                text-slate-400
              "
              aria-hidden="true"
            />

            <input
              type="text"
              value={documentSearch}
              onChange={(event) =>
                setDocumentSearch(event.target.value)
              }
              placeholder="Search documents by title or category..."
              aria-label="Search documents by title or category"
              className="
                w-full rounded-xl
                border border-slate-200
                bg-white
                py-2.5 pl-10 pr-4
                text-xs text-slate-800
                outline-none
                shadow-sm
                transition
                focus:border-[var(--color-brand-accent)]
                focus:ring-4
                focus:ring-[var(--color-brand-accent)]/10
              "
            />
          </div>

          <button
            type="button"
            onClick={onRefresh}
            aria-label="Refresh document list"
            className={`
              flex h-10 w-10 shrink-0 items-center justify-center
              rounded-xl
              ${secondaryButton}
              shadow-sm
              transition
              ${focusRing}
            `}
          >
            <RefreshCw
              className={`h-4 w-4 ${
                loading ? 'animate-spin' : ''
              }`}
              aria-hidden="true"
            />
          </button>
        </div>

        <div className="mt-6">
          {loading ? (
            <DocumentLoadingState />
          ) : documents.length === 0 ? (
            <EmptyDocumentsState />
          ) : (
            <DocumentGrid
              documents={documents}
              onPreview={onPreview}
              onDelete={onDelete}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function DocumentLoadingState() {
  return (
    <div className="flex h-64 items-center justify-center text-xs text-slate-500">
      <Loader2
        className="mr-2 h-5 w-5 animate-spin text-[var(--color-brand-accent)]"
        aria-hidden="true"
      />
      Fetching documents...
    </div>
  );
}

function EmptyDocumentsState() {
  return (
    <div
      className="
        flex min-h-[280px]
        flex-col items-center justify-center
        rounded-2xl
        border border-dashed border-slate-200
        bg-white
        p-8 text-center
      "
    >
      <FileText
        className="h-10 w-10 text-slate-300"
        aria-hidden="true"
      />

      <p className="mt-3 text-xs font-semibold text-slate-700">
        No indexed documents
      </p>

      <p className="mt-1 max-w-sm text-[11px] leading-5 text-slate-400">
        Upload source materials to populate the knowledge
        base.
      </p>
    </div>
  );
}

interface DocumentGridProps {
  documents: DocumentItem[];
  onPreview: (document: DocumentItem) => void;
  onDelete: (id: string) => void;
}

function DocumentGrid({
  documents,
  onPreview,
  onDelete,
}: DocumentGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {documents.map((document) => (
        <DocumentCard
          key={document.id}
          document={document}
          onPreview={onPreview}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}

interface DocumentCardProps {
  document: DocumentItem;
  onPreview: (document: DocumentItem) => void;
  onDelete: (id: string) => void;
}

function DocumentCard({
  document,
  onPreview,
  onDelete,
}: DocumentCardProps) {
  return (
    <article
      className="
        group flex flex-col justify-between
        rounded-2xl
        border border-slate-200
        bg-white
        p-4
        shadow-sm
        transition
        hover:-translate-y-0.5
        hover:border-[var(--color-brand-accent)]
        hover:shadow-md
      "
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div
            className="
              flex h-9 w-9 shrink-0 items-center justify-center
              rounded-xl
              bg-red-50
              text-red-500
            "
            aria-hidden="true"
          >
            <FileIcon className="h-4 w-4" />
          </div>

          <FileCheck2
            className="
              h-4 w-4 shrink-0
              text-[var(--color-brand-accent)]
            "
            aria-hidden="true"
          />
        </div>

        <p
          className="mt-3 truncate text-xs font-bold text-slate-800"
          title={document.file_name}
        >
          {document.file_name}
        </p>

        <p className="mt-1 text-[10px] text-slate-400">
          {document.upload_date}
        </p>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
        <span className="max-w-[70%] truncate rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-semibold text-[var(--color-brand-accent)]">
          {document.category}
        </span>

        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onPreview(document)}
            aria-label={`Preview ${document.file_name}`}
            className={`
              flex h-8 w-8 items-center justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-blue-50
              hover:text-[var(--color-brand-accent)]
              ${focusRing}
            `}
          >
            <Eye
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
          </button>

          <button
            type="button"
            onClick={() => onDelete(document.id)}
            aria-label={`Delete ${document.file_name}`}
            className="
              flex h-8 w-8 items-center justify-center
              rounded-lg
              text-slate-400
              transition
              hover:bg-red-50
              hover:text-red-500
              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-red-500
              focus-visible:ring-offset-1
            "
          >
            <Trash2
              className="h-3.5 w-3.5"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </article>
  );
}