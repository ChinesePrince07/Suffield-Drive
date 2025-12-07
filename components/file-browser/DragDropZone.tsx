'use client';

import { useState, useCallback, useEffect } from 'react';
import { uploadFile, copyFiles, moveFiles } from '@/app/actions';
import { UploadCloud, Loader2 } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { refreshFileList } from '@/lib/refresh';
import { useClipboard } from '@/lib/clipboard-context';

interface DragDropZoneProps {
    children: React.ReactNode;
    currentPath?: string;
}

// Helper to recursively get files from a directory entry
async function getFilesFromEntry(entry: FileSystemEntry, path: string = ''): Promise<File[]> {
    if (entry.isFile) {
        return new Promise((resolve) => {
            (entry as FileSystemFileEntry).file((file) => {
                // Create a new file with the full path as name
                const fullPath = path ? `${path}/${file.name}` : file.name;
                const newFile = new File([file], fullPath, { type: file.type });
                resolve([newFile]);
            }, () => resolve([]));
        });
    } else if (entry.isDirectory) {
        const dirReader = (entry as FileSystemDirectoryEntry).createReader();
        const entries = await new Promise<FileSystemEntry[]>((resolve) => {
            dirReader.readEntries((entries) => resolve(entries), () => resolve([]));
        });
        const files: File[] = [];
        const dirPath = path ? `${path}/${entry.name}` : entry.name;
        for (const childEntry of entries) {
            const childFiles = await getFilesFromEntry(childEntry, dirPath);
            files.push(...childFiles);
        }
        return files;
    }
    return [];
}

export function DragDropZone({ children, currentPath }: DragDropZoneProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 });
    const [processingMessage, setProcessingMessage] = useState<string | null>(null);

    const searchParams = useSearchParams();
    const folderId = searchParams.get('folderId');
    const path = currentPath || (folderId ? decodeURIComponent(folderId) : '/');

    const { clipboard, clear: clearClipboard } = useClipboard();

    const processFiles = useCallback(async (allFiles: File[]) => {
        if (allFiles.length === 0) return;

        setIsUploading(true);
        setUploadProgress({ current: 0, total: allFiles.length });
        setProcessingMessage('Uploading...');

        // Upload files in parallel batches for speed
        const concurrencyLimit = 10;
        let completed = 0;

        for (let i = 0; i < allFiles.length; i += concurrencyLimit) {
            const batch = allFiles.slice(i, i + concurrencyLimit);

            await Promise.allSettled(
                batch.map(async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('path', path);
                    formData.append('relativePath', file.name);

                    try {
                        await uploadFile(formData);
                    } catch (error) {
                        console.error(`Failed to upload ${file.name}:`, error);
                    }
                })
            );

            completed += batch.length;
            setUploadProgress({ current: completed, total: allFiles.length });
        }

        setIsUploading(false);
        setUploadProgress({ current: 0, total: 0 });
        setProcessingMessage(null);
        refreshFileList();
    }, [path]);

    const handlePaste = useCallback(async (e: ClipboardEvent) => {
        // 1. Handle Local Files (Upload)
        if (e.clipboardData && e.clipboardData.files.length > 0) {
            e.preventDefault();
            const files = Array.from(e.clipboardData.files);
            await processFiles(files);
            return;
        }

        // 2. Handle Internal Clipboard (Copy/Move)
        if (clipboard.items.length > 0 && clipboard.operation) {
            e.preventDefault();
            setIsUploading(true);
            setProcessingMessage(clipboard.operation === 'copy' ? 'Copying files...' : 'Moving files...');

            const sourcePaths = clipboard.items.map(item => item.filename);

            try {
                if (clipboard.operation === 'copy') {
                    await copyFiles(sourcePaths, path);
                } else {
                    await moveFiles(sourcePaths, path);
                    clearClipboard(); // Clear clipboard after move
                }
                refreshFileList();
            } catch (error) {
                console.error('Paste operation failed:', error);
                alert('Failed to paste items');
            } finally {
                setIsUploading(false);
                setProcessingMessage(null);
            }
        }
    }, [clipboard, path, processFiles, clearClipboard]);

    useEffect(() => {
        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handlePaste]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback(async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        const items = e.dataTransfer.items;
        if (!items || items.length === 0) return;

        const allFiles: File[] = [];

        // Check if we can use webkitGetAsEntry for folder support
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (item.webkitGetAsEntry) {
                const entry = item.webkitGetAsEntry();
                if (entry) {
                    const files = await getFilesFromEntry(entry);
                    allFiles.push(...files);
                }
            } else {
                // Fallback to regular file
                const file = item.getAsFile();
                if (file) allFiles.push(file);
            }
        }

        await processFiles(allFiles);
    }, [processFiles]);

    return (
        <div
            className="relative h-full w-full"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
        >
            {children}
            {isDragging && (
                <div className="absolute inset-0 bg-primary/10 border-4 border-dashed border-primary z-50 flex flex-col items-center justify-center animate-in fade-in duration-200 backdrop-blur-sm">
                    <div className="bg-background p-6 rounded-full shadow-xl mb-4">
                        <UploadCloud className="h-10 w-10 text-primary animate-bounce" />
                    </div>
                    <h3 className="text-2xl font-bold text-primary">Drop files to upload</h3>
                </div>
            )}
            {isUploading && (
                <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
                    <div className="bg-card border rounded-lg p-6 shadow-xl flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <div className="text-center">
                            <p className="font-medium">{processingMessage || 'Processing...'}</p>
                            {uploadProgress.total > 0 && (
                                <p className="text-sm text-muted-foreground">
                                    {uploadProgress.current} of {uploadProgress.total} files
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

