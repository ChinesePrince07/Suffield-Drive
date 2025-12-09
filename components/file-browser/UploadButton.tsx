'use client';

import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useRef, useState } from 'react';
import { uploadFile } from '@/app/actions';
import { refreshFileList } from '@/lib/refresh';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderUp, FileUp } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

interface UploadButtonProps {
    currentPath?: string;
}

interface UploadStatus {
    current: number;
    total: number;
    succeeded: number;
    failed: number;
    currentFile: string;
}

export function UploadButton({ currentPath = '/' }: UploadButtonProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const folderInputRef = useRef<HTMLInputElement>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>({
        current: 0,
        total: 0,
        succeeded: 0,
        failed: 0,
        currentFile: '',
    });

    const handleFileClick = () => {
        fileInputRef.current?.click();
    };

    const handleFolderClick = () => {
        folderInputRef.current?.click();
    };

    const handleUpload = async (files: FileList | null) => {
        if (!files || files.length === 0) return;

        setIsUploading(true);
        const total = files.length;
        let completed = 0;
        let succeeded = 0;
        let failed = 0;

        setUploadStatus({
            current: 0,
            total,
            succeeded: 0,
            failed: 0,
            currentFile: '',
        });

        // Upload files with controlled concurrency for speed while tracking progress
        const concurrencyLimit = 5;
        const fileArray = Array.from(files);

        // Create a queue-based uploader for real-time progress updates
        const uploadQueue = fileArray.map((file, index) => async () => {
            setUploadStatus((prev) => ({
                ...prev,
                currentFile: file.name,
            }));

            const formData = new FormData();
            formData.append('file', file);

            // For folder uploads, webkitRelativePath gives the path relative to the selected folder
            const relativePath = file.webkitRelativePath;
            const uploadPath = relativePath
                ? (currentPath === '/' ? '' : currentPath) + '/' + relativePath.split('/').slice(0, -1).join('/')
                : currentPath;

            formData.append('path', uploadPath);

            try {
                const result = await uploadFile(formData);
                if (result.success) {
                    succeeded++;
                } else {
                    failed++;
                }
            } catch {
                failed++;
            }

            completed++;
            setUploadStatus({
                current: completed,
                total,
                succeeded,
                failed,
                currentFile: completed < total ? '' : '',
            });
        });

        // Process with concurrency limit
        const executing: Promise<void>[] = [];
        for (const task of uploadQueue) {
            const p = task();
            executing.push(p);

            if (executing.length >= concurrencyLimit) {
                await Promise.race(executing);
                // Remove completed promises
                for (let i = executing.length - 1; i >= 0; i--) {
                    // Check if promise is settled by racing with an immediate resolve
                    const settled = await Promise.race([
                        executing[i].then(() => true).catch(() => true),
                        Promise.resolve(false)
                    ]);
                    if (settled) {
                        executing.splice(i, 1);
                    }
                }
            }
        }

        // Wait for remaining uploads
        await Promise.all(executing);

        // Brief delay to show completion
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setIsUploading(false);
        setUploadStatus({
            current: 0,
            total: 0,
            succeeded: 0,
            failed: 0,
            currentFile: '',
        });

        if (fileInputRef.current) fileInputRef.current.value = '';
        if (folderInputRef.current) folderInputRef.current.value = '';
        refreshFileList();

        if (failed > 0) {
            alert(`Upload completed with ${failed} error${failed > 1 ? 's' : ''}. ${succeeded} file${succeeded !== 1 ? 's' : ''} uploaded successfully.`);
        }
    };

    return (
        <>
            <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                multiple
                onChange={(e) => handleUpload(e.target.files)}
            />
            <input
                type="file"
                className="hidden"
                ref={folderInputRef}
                // @ts-ignore - webkitdirectory is not in standard types but supported by browsers
                webkitdirectory=""
                onChange={(e) => handleUpload(e.target.files)}
            />

            <Dialog open={isUploading} onOpenChange={() => { }}>
                <DialogContent className="sm:max-w-md bg-background" onPointerDownOutside={(e) => e.preventDefault()}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            Uploading Files
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{uploadStatus.current} / {uploadStatus.total}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadStatus.total > 0 ? (uploadStatus.current / uploadStatus.total) * 100 : 0}%` }}
                            />
                        </div>
                        {uploadStatus.currentFile && (
                            <p className="text-sm text-muted-foreground truncate">
                                Uploading: {uploadStatus.currentFile}
                            </p>
                        )}
                        <div className="flex gap-4 text-sm">
                            <span className="flex items-center gap-1 text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                {uploadStatus.succeeded} succeeded
                            </span>
                            {uploadStatus.failed > 0 && (
                                <span className="flex items-center gap-1 text-red-500">
                                    <XCircle className="h-4 w-4" />
                                    {uploadStatus.failed} failed
                                </span>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button disabled={isUploading}>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleFileClick}>
                        <FileUp className="mr-2 h-4 w-4" />
                        Upload Files
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleFolderClick}>
                        <FolderUp className="mr-2 h-4 w-4" />
                        Upload Folder
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </>
    );
}

