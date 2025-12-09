'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { renameFile } from '@/app/actions';
import { refreshFileList } from '@/lib/refresh';

interface RenameFileModalProps {
    isOpen: boolean;
    onClose: () => void;
    item: { filename: string; basename: string; type?: string } | null;
    onRenameComplete: () => void;
}

export function RenameFileModal({ isOpen, onClose, item, onRenameComplete }: RenameFileModalProps) {
    const [newName, setNewName] = useState('');
    const [isRenaming, setIsRenaming] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const prevItemRef = useRef<string | null>(null);

    // Extract name and extension
    const getNameAndExtension = (basename: string, isFolder: boolean) => {
        if (isFolder) {
            return { name: basename, extension: '' };
        }
        const lastDot = basename.lastIndexOf('.');
        if (lastDot === -1 || lastDot === 0) {
            return { name: basename, extension: '' };
        }
        return {
            name: basename.substring(0, lastDot),
            extension: basename.substring(lastDot), // includes the dot
        };
    };

    const isFolder = item?.type === 'directory';
    const { name: originalName, extension } = item ? getNameAndExtension(item.basename, isFolder) : { name: '', extension: '' };

    // Only reset the name when the modal opens with a different item
    useEffect(() => {
        if (isOpen && item && item.filename !== prevItemRef.current) {
            prevItemRef.current = item.filename;
            const { name } = getNameAndExtension(item.basename, item.type === 'directory');
            setNewName(name);
            // Focus and select after a small delay to ensure the dialog is rendered
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                    inputRef.current.select();
                }
            }, 50);
        }

        // Reset tracking when modal closes
        if (!isOpen) {
            prevItemRef.current = null;
        }
    }, [isOpen, item?.filename, item?.basename, item?.type]);

    const handleRename = async () => {
        if (!item || !newName.trim()) return;

        const finalName = extension ? `${newName.trim()}${extension}` : newName.trim();
        if (finalName === item.basename) return;

        setIsRenaming(true);
        const res = await renameFile(item.filename, finalName);
        setIsRenaming(false);

        if (res.success) {
            onRenameComplete();
            onClose();
            refreshFileList();
        } else {
            alert('Failed to rename file');
        }
    };

    const finalName = extension ? `${newName.trim()}${extension}` : newName.trim();
    const isUnchanged = finalName === item?.basename;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] glass-card">
                <DialogHeader>
                    <DialogTitle>Rename {isFolder ? 'Folder' : 'File'}</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="flex items-center gap-1">
                        <Input
                            ref={inputRef}
                            id="name"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Enter new name"
                            className="flex-1"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleRename();
                                }
                            }}
                        />
                        {extension && (
                            <span className="text-muted-foreground font-mono text-sm px-2 py-2 bg-muted rounded">
                                {extension}
                            </span>
                        )}
                    </div>
                    {extension && (
                        <p className="text-xs text-muted-foreground">
                            The file extension cannot be changed.
                        </p>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button onClick={handleRename} disabled={isRenaming || !newName.trim() || isUnchanged}>
                        {isRenaming ? 'Renaming...' : 'Rename'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

