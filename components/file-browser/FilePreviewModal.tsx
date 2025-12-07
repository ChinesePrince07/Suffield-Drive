'use client';

import { FileItem } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X } from 'lucide-react';

import { useState, useEffect } from 'react';

interface FilePreviewModalProps {
    item: FileItem | null;
    isOpen: boolean;
    onClose: () => void;
}

export function FilePreviewModal({ item, isOpen, onClose }: FilePreviewModalProps) {
    if (!item) return null;

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

    let mime = item.mime;
    const inferredMime = getMimeType(item.filename);
    const fileExt = getFileExtension(item.filename);

    // If mime is missing or generic, or if we have a specific extension match like PDF, use the inferred one
    if (!mime || mime === 'application/octet-stream' || inferredMime) {
        mime = inferredMime || mime;
    }

    const downloadUrl = `/api/file?path=${encodeURIComponent(item.filename)}&mime=${encodeURIComponent(mime || '')}`;

    const isImage = mime?.startsWith('image/');
    const isPdf = mime?.includes('application/pdf');
    const isText = mime?.startsWith('text/') || mime === 'text/plain';
    const isVideo = mime?.startsWith('video/');
    const isAudio = mime?.startsWith('audio/');
    const isOfficeDoc = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(fileExt);

    const [textContent, setTextContent] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && isText && downloadUrl) {
            fetch(downloadUrl)
                .then(res => res.text())
                .then(setTextContent)
                .catch(console.error);
        } else {
            setTextContent(null);
        }
    }, [isOpen, isText, downloadUrl]);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent hideClose className="max-w-[95vw] w-[95vw] h-[95vh] flex flex-col p-0 bg-background border shadow-2xl rounded-xl overflow-hidden">
                <DialogHeader className="p-4 border-b flex flex-row items-center justify-between space-y-0 bg-background shrink-0">
                    <DialogTitle className="truncate flex-1 mr-4">{item.basename}</DialogTitle>
                    <div className="flex items-center gap-2">
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
                        <Button size="sm" variant="ghost" onClick={onClose} className="ml-2">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <div className={`flex-1 bg-muted flex items-center justify-center ${isPdf ? 'p-0 overflow-hidden' : 'p-4 overflow-auto'}`}>
                    {isImage && downloadUrl ? (
                        <img src={downloadUrl} alt={item.basename} className="max-w-full max-h-full object-contain shadow-lg rounded-lg" />
                    ) : isPdf && downloadUrl ? (
                        <object data={downloadUrl} type="application/pdf" className="w-full h-full rounded-lg shadow-lg bg-white">
                            <div className="flex flex-col items-center justify-center h-full gap-4">
                                <p className="text-muted-foreground">Unable to display PDF directly.</p>
                                <a href={downloadUrl} download target="_blank" rel="noreferrer">
                                    <Button>Download PDF</Button>
                                </a>
                            </div>
                        </object>
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
                    ) : isOfficeDoc ? (
                        <div className="text-center space-y-4 bg-card p-8 rounded-xl shadow-lg">
                            <div className="text-6xl">
                                {['doc', 'docx'].includes(fileExt) && '📄'}
                                {['xls', 'xlsx'].includes(fileExt) && '📊'}
                                {['ppt', 'pptx'].includes(fileExt) && '📽️'}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold mb-2">
                                    {['doc', 'docx'].includes(fileExt) && 'Microsoft Word Document'}
                                    {['xls', 'xlsx'].includes(fileExt) && 'Microsoft Excel Spreadsheet'}
                                    {['ppt', 'pptx'].includes(fileExt) && 'Microsoft PowerPoint Presentation'}
                                </h3>
                                <p className="text-muted-foreground text-sm mb-4">
                                    Office documents cannot be previewed in the browser.
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

