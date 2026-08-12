import React, { useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { X, Loader2, FileText, Download } from 'lucide-react';

interface DocumentViewerModalProps {
  documentUrl: string;
  fileName: string;
  onClose: () => void;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  documentUrl,
  fileName,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string>('');

  const docxContainerRef = useRef<HTMLDivElement>(null);
  const ext = fileName.split('.').pop()?.toLowerCase();

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const loadDocument = async () => {
      try {
        const response = await fetch(documentUrl);
        if (!response.ok) {
          throw new Error(`Failed to load file (${response.statusText})`);
        }

        if (ext === 'pdf') {
          const blob = await response.blob();
          if (isMounted) {
            const objectUrl = URL.createObjectURL(blob);
            setPdfBlobUrl(objectUrl);
          }
        } else if (ext === 'docx') {
          const blob = await response.blob();
          if (docxContainerRef.current && isMounted) {
            docxContainerRef.current.innerHTML = '';
            await renderAsync(blob, docxContainerRef.current);
          }
        } else if (ext === 'txt') {
          const text = await response.text();
          if (isMounted) setTextContent(text);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : 'Error fetching and rendering document.'
          );
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadDocument();

    return () => {
      isMounted = false;
      if (pdfBlobUrl) {
        URL.revokeObjectURL(pdfBlobUrl);
      }
    };
  }, [documentUrl, ext]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--color-surface-white)] w-full max-w-5xl h-[88vh] rounded-xl shadow-2xl flex flex-col overflow-hidden border border-[var(--color-border-muted)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-border-muted)] flex items-center justify-between bg-[var(--color-soft-neutral)] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--color-brand-accent)]/10 rounded-lg text-[var(--color-brand-accent)]">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--color-deep-navy)] truncate max-w-md">
                {fileName}
              </h3>
              <p className="text-[10px] text-[var(--color-text-body)] uppercase font-mono">
                Format: {ext || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={documentUrl}
              download={fileName}
              className="p-1.5 text-[var(--color-text-body)] hover:text-[var(--color-deep-navy)] hover:bg-gray-200/50 rounded-lg transition-colors flex items-center gap-1 text-xs"
              title="Download File"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-gray-500 hover:text-gray-800 hover:bg-gray-200/50 rounded-lg transition-colors"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[var(--color-soft-neutral)]/40 relative">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 z-10 gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-brand-accent)]" />
              <span className="text-xs text-[var(--color-text-body)] font-medium">
                Loading document preview...
              </span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <p className="text-xs font-semibold text-red-500 mb-2">{error}</p>
              <a
                href={documentUrl}
                download={fileName}
                className="text-xs text-[var(--color-brand-accent)] hover:underline"
              >
                Click here to download file directly instead.
              </a>
            </div>
          )}

          {/* PDF Renderer using Object URL Blob */}
          {ext === 'pdf' && pdfBlobUrl && (
            <iframe
              src={pdfBlobUrl}
              className="w-full h-full rounded-lg border border-[var(--color-border-muted)] bg-white shadow-sm"
              title={fileName}
            />
          )}

          {/* DOCX Renderer Container */}
          {ext === 'docx' && (
            <div
              ref={docxContainerRef}
              className="bg-white p-8 shadow-sm rounded-lg min-h-full border border-[var(--color-border-muted)] text-black font-sans prose max-w-none"
            />
          )}

          {/* Plain Text Renderer */}
          {ext === 'txt' && (
            <pre className="bg-white p-6 rounded-lg border border-[var(--color-border-muted)] text-xs text-gray-800 font-mono whitespace-pre-wrap leading-relaxed shadow-sm">
              {textContent}
            </pre>
          )}

          {/* Format Fallback */}
          {!['pdf', 'docx', 'txt'].includes(ext || '') && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center py-16 text-xs text-[var(--color-text-body)] space-y-3">
              <FileText className="w-12 h-12 stroke-1 text-[var(--color-border-muted)]" />
              <p>Direct preview is not supported for this file extension.</p>
              <a
                href={documentUrl}
                download={fileName}
                className="px-4 py-2 bg-[var(--color-brand-accent)] text-white rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};