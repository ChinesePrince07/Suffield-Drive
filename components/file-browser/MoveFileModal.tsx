'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Folder, ChevronRight, Loader2, Home, ChevronLeft } from 'lucide-react';
import { getFolders, moveFiles } from '@/app/actions';
import { refreshFileList } from '@/lib/refresh';

interface MoveFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedFiles: string[];
    onMoveComplete: () => void;
}

export function MoveFileModal({ isOpen, onClose, selectedFiles, onMoveComplete }: MoveFileModalProps) {
    const [currentPath, setCurrentPath] = useState('/');
    const [folders, setFolders] = useState<{ filename: string; basename: string }[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMoving, setIsMoving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setCurrentPath('/');
            loadFolders('/');
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            loadFolders(currentPath);
        }
    }, [currentPath]);

    const loadFolders = async (path: string) => {
        setIsLoading(true);
        const res = await getFolders(path);
        if (res.success) {
            setFolders(res.folders);
        }
        setIsLoading(false);
    };

    const handleMove = async () => {
        setIsMoving(true);
        const res = await moveFiles(selectedFiles, currentPath);
        setIsMoving(false);
        if (res.success) {
            onMoveComplete();
            onClose();
            refreshFileList();
        } else {
            alert('Failed to move files');
        }
    };

    const navigateUp = () => {
        if (currentPath === '/') return;
        const parentPath = currentPath.split('/').slice(0, -1).join('/') || '/';
        setCurrentPath(parentPath);
    };

    const pathSegments = currentPath.split('/').filter(Boolean);

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-background border shadow-xl">
                <DialogHeader>
                    <DialogTitle className="text-lg">
                        Move {selectedFiles.length} item{selectedFiles.length !== 1 ? 's' : ''}
                    </DialogTitle>
                </DialogHeader>

                {/* Breadcrumb navigation */}
                <div className="flex items-center gap-1 py-2 px-3 bg-muted rounded-lg text-sm overflow-x-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 shrink-0"
                        onClick={() => setCurrentPath('/')}
                    >
                        <Home className="h-4 w-4" />
                    </Button>
                    {pathSegments.map((segment, index) => (
                        <div key={index} className="flex items-center shrink-0">
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => setCurrentPath('/' + pathSegments.slice(0, index + 1).join('/'))}
                            >
                                {segment}
                            </Button>
                        </div>
                    ))}
                </div>

                {/* Folder list */}
                <div className="h-[280px] overflow-y-auto border rounded-lg bg-background">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-full">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <div className="divide-y">
                            {currentPath !== '/' && (
                                <div
                                    className="flex items-center gap-3 p-3 hover:bg-muted cursor-pointer transition-colors"
                                    onClick={navigateUp}
                                >
                                    <ChevronLeft className="h-5 w-5 text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Back</span>
                                </div>
                            )}
                            {folders.length === 0 && currentPath === '/' ? (
                                <div className="text-center py-12 text-muted-foreground text-sm">
                                    No folders available
                                </div>
                            ) : folders.length === 0 ? (
                                <div className="text-center py-12 text-muted-foreground text-sm">
                                    No subfolders in this directory
                                </div>
                            ) : (
                                folders.map((folder) => (
                                    <div
                                        key={folder.filename}
                                        className="flex items-center justify-between p-3 hover:bg-muted cursor-pointer group transition-colors"
                                        onClick={() => setCurrentPath(folder.filename)}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Folder className="h-5 w-5 text-blue-500" />
                                            <span className="text-sm font-medium">{folder.basename}</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleMove} disabled={isMoving || isLoading}>
                        {isMoving ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Moving...
                            </>
                        ) : (
                            'Move Here'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

