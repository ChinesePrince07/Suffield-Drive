'use client';

import { Button } from '@/components/ui/button';
import { Download, Trash2, FolderInput, Pencil, Copy, Scissors, X } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface FileActionsToolbarProps {
    selectedCount: number;
    onClearSelection: () => void;
    onMove: () => void;
    onRename: () => void;
    onDelete: () => void;
    onDownload: () => void;
    onCopy: () => void;
    onCut: () => void;
}

export function FileActionsToolbar({
    selectedCount,
    onClearSelection,
    onMove,
    onRename,
    onDelete,
    onDownload,
    onCopy,
    onCut
}: FileActionsToolbarProps) {
    const { isAdmin } = useAuth();

    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-background/80 backdrop-blur-md border shadow-lg rounded-full px-4 py-2 flex items-center gap-2 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300">
            <div className="flex items-center gap-2 mr-2 border-r pr-4">
                <span className="text-sm font-medium">{selectedCount} selected</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full" onClick={onClearSelection}>
                    <X className="h-3 w-3" />
                </Button>
            </div>

            <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" onClick={onDownload} title="Download">
                    <Download className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={onCopy} title="Copy">
                    <Copy className="h-4 w-4" />
                </Button>
                {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={onCut} title="Cut">
                        <Scissors className="h-4 w-4" />
                    </Button>
                )}
                <Button variant="ghost" size="sm" onClick={onMove} title="Move">
                    <FolderInput className="h-4 w-4" />
                </Button>
                {selectedCount === 1 && (
                    <Button variant="ghost" size="sm" onClick={onRename} title="Rename">
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
                {isAdmin && (
                    <Button variant="ghost" size="sm" onClick={onDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50" title="Delete">
                        <Trash2 className="h-4 w-4" />
                    </Button>
                )}
            </div>
        </div>
    );
}
