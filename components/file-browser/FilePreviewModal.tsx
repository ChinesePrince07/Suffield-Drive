'use client';

import { FileItem } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';
import { DocxViewer } from './DocxViewer';
import { PdfViewer } from './PdfViewer';
import { useIsMobile } from '@/lib/hooks/useIsMobile';

import { useState, useEffect } from 'react';

interface FilePreviewModalProps {
    item: FileItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export function FilePreviewModal({ item, isOpen, onClose }: FilePreviewModalProps) {
    // All hooks must be called before any conditional returns (Rules of Hooks)
    const isMobile = useIsMobile();
    const [textContent, setTextContent] = useState<string | null>(null);

    // Helper functions defined outside of conditional logic
    const getMimeType = (filename: string) => {
        const ext = filename.split('.').pop()?.toLowerCase();

        // Images
        if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'tif'].includes(ext || '')) {
            return `image/${ext === 'jpg' ? 'jpeg' : ext === 'svg' ? 'svg+xml' : ext}`;
        }

        // Documents
        if (ext === 'pdf') return 'application/pdf';

        // Office documents
        if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        if (ext === 'doc') return 'application/msword';
        if (ext === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        if (ext === 'xls') return 'application/vnd.ms-excel';
        if (ext === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
        if (ext === 'ppt') return 'application/vnd.ms-powerpoint';

        // Text files
        if (['txt', 'md', 'markdown', 'ts', 'tsx', 'js', 'jsx', 'json', 'css', 'scss', 'less',
            'html', 'htm', 'xml', 'yaml', 'yml', 'env', 'sh', 'bash', 'zsh', 'py', 'rb', 'go',
            'java', 'c', 'cpp', 'h', 'hpp', 'cs', 'php', 'swift', 'kt', 'rs', 'sql', 'r',
            'gitignore', 'dockerignore', 'editorconfig', 'prettierrc', 'eslintrc', 'log',
            'csv', 'ini', 'cfg', 'conf', 'toml'].includes(ext || '')) {
            return 'text/plain';
        }

        // Video
        if (['mp4', 'webm', 'ogg', 'mov', 'avi', 'mkv'].includes(ext || '')) {
            return `video/${ext === 'mov' ? 'quicktime' : ext}`;
        }

        // Audio
        if (['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac'].includes(ext || '')) {
            return `audio/${ext === 'mp3' ? 'mpeg' : ext}`;
        }

        return null;
    };

    const getFileExtension = (filename: string) => {
        return filename.split('.').pop()?.toLowerCase() || '';
    };

    // Compute derived values (handle item being null)
    let mime = item?.mime;
    const inferredMime = item ? getMimeType(item.filename) : null;
    const fileExt = item ? getFileExtension(item.filename) : '';

    if (item && (!mime || mime === 'application/octet-stream' || inferredMime)) {
        mime = inferredMime || mime;
    }

    const downloadUrl = item ? `/api/file?path=${encodeURIComponent(item.filename)}&mime=${encodeURIComponent(mime || '')}` : '';

    const isImage = mime?.startsWith('image/');
    const isPdf = mime?.includes('application/pdf');
    const isText = mime?.startsWith('text/') || mime === 'text/plain';
    const isVideo = mime?.startsWith('video/');
    const isAudio = mime?.startsWith('audio/');
    const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt);

    // useEffect MUST be called before any early return
    useEffect(() => {
        if (isOpen && isText && downloadUrl && item) {
            fetch(downloadUrl)
                .then(res => res.text())
                .then(setTextContent)
                .catch(console.error);
        } else {
            setTextContent(null);
        }
    }, [isOpen, isText, downloadUrl, item]);

    // Early return AFTER all hooks
    if (!item) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent hideClose className="max-w-[100vw] w-[100vw] h-[100vh] md:max-w-[95vw] md:w-[95vw] md:h-[95vh] flex flex-col p-0 bg-background border shadow-2xl md:rounded-xl overflow-hidden z-[200]">
                <DialogHeader className="pt-6 px-4 pb-4 md:p-4 border-b bg-background shrink-0">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <DialogTitle className="md:flex-1 md:mr-4 md:truncate">{item.basename}</DialogTitle>
                        <div className="flex items-center justify-between md:justify-start gap-2 flex-shrink-0">
                            {downloadUrl && (
                                <>
                                    <a href={downloadUrl} target="_blank" rel="noreferrer">
                                        <Button size="sm" variant="ghost">
                                            Open in New Tab
                                        </Button>
                                    </a>
                                    <a href={downloadUrl} download target="_blank" rel="noreferrer">
                                        <Button size="sm" variant="outline">
                                            <Download className="h-4 w-4 mr-2" />
                                            Download
                                        </Button>
                                    </a>
                                </>
                            )}
                            <Button size="sm" variant="ghost" onClick={onClose} className="ml-auto">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </DialogHeader>

                <div className={`flex-1 bg-muted ${isPdf ? 'p-0 overflow-hidden' : 'p-4 overflow-auto flex items-center justify-center'}`}>
                    {isImage && downloadUrl ? (
                        <img src={downloadUrl} alt={item.basename} className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
                    ) : isPdf && downloadUrl ? (
                        isMobile ? (
                            <PdfViewer downloadUrl={downloadUrl} filename={item.basename} />
                        ) : (
                            <iframe
                                src={downloadUrl}
                                className="w-full h-full border-0"
                                title={item.basename}
                            />
                        )
                    ) : isVideo && downloadUrl ? (
                        <video src={downloadUrl} controls className="max-w-full max-h-full rounded-lg shadow-lg">
                            Your browser does not support video playback.
                        </video>
                    ) : isAudio && downloadUrl ? (
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-6xl">🎵</div>
                            <audio src={downloadUrl} controls className="w-80">
                                Your browser does not support audio playback.
                            </audio>
                        </div>
                    ) : isText && textContent !== null ? (
                        <pre className="bg-card p-4 rounded-lg shadow-inner w-full h-full overflow-auto text-sm font-mono whitespace-pre-wrap">
                            {textContent}
                        </pre>
                    ) : ['docx'].includes(fileExt) && downloadUrl ? (
                        <DocxViewer downloadUrl={downloadUrl} filename={item.basename} />
                    ) : isOfficeDoc ? (
                        <div className="text-center space-y-4 bg-card p-8 rounded-xl shadow-lg">
                            <div className="text-6xl">
                                {['doc'].includes(fileExt) && '📄'}
                                {['xls', 'xlsx'].includes(fileExt) && '📊'}
                                {['ppt', 'pptx'].includes(fileExt) && '📽️'}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {['doc'].includes(fileExt) && 'Microsoft Word Document'}
                                    {['xls', 'xlsx'].includes(fileExt) && 'Microsoft Excel Spreadsheet'}
                                    {['ppt', 'pptx'].includes(fileExt) && 'Microsoft PowerPoint Presentation'}
                                </h3>
                                <p className="text-muted-foreground text-sm mb-4">
                                    This file type cannot be previewed in the browser.
                                </p>
                            </div>
                            {downloadUrl && (
                                <a href={downloadUrl} download target="_blank" rel="noreferrer">
                                    <Button>
                                        <Download className="h-4 w-4 mr-2" />
                                        Download to Open
                                    </Button>
                                </a>
                            )}
                        </div>
                    ) : (
                        <div className="text-center space-y-4">
                            <p className="text-muted-foreground">Preview not available for this file type.</p>
                            {downloadUrl && (
                                <a href={downloadUrl} download target="_blank" rel="noreferrer">
                                    <Button>Download to View</Button>
                                </a>
                            )}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

