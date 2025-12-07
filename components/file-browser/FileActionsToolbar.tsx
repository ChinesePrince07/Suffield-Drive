'use client';

import { Button } from '@/components/ui/button';
import { Move, Trash2, Download, X, Copy, Scissors } from 'lucide-react';
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
    onCut,
}: FileActionsToolbarProps) {
    const { isAdmin } = useAuth();

    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex items-center gap-2 p-2 rounded-full shadow-2xl border border-border bg-popover text-popover-foreground max-w-[90vw] overflow-x-auto">
                <div className="flex items-center gap-2 px-3 border-r border-border/50 shrink-0">
                    <span className="text-sm font-medium whitespace-nowrap hidden sm:inline">
                        {selectedCount} selected
                    </span>
                    <span className="text-sm font-medium whitespace-nowrap sm:hidden">
                        {selectedCount}
                    </span>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 rounded-full hover:bg-muted"
                        onClick={onClearSelection}
                    >
                        <X className="h-3 w-3" />
                    </Button>
                </div>

                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={onCopy} className="gap-2 rounded-full px-2 sm:px-3">
                        <Copy className="h-4 w-4" />
                        <span className="hidden sm:inline">Copy</span>
                    </Button>
                    {isAdmin && (
                        <Button variant="ghost" size="sm" onClick={onCut} className="gap-2 rounded-full px-2 sm:px-3">
                            <Scissors className="h-4 w-4" />
                            <span className="hidden sm:inline">Cut</span>
                        </Button>
                    )}
                    {isAdmin && (
                        <Button variant="ghost" size="sm" onClick={onMove} className="gap-2 rounded-full px-2 sm:px-3">
                            <Move className="h-4 w-4" />
                            <span className="hidden sm:inline">Move</span>
                        </Button>
                    )}
                    {isAdmin && selectedCount === 1 && (
                        <Button variant="ghost" size="sm" onClick={onRename} className="gap-2 rounded-full px-2 sm:px-3">
                            <span className="text-xs font-bold border border-current rounded px-1">I</span>
                            <span className="hidden sm:inline">Rename</span>
                        </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={onDownload} className="gap-2 rounded-full px-2 sm:px-3">
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Download</span>
                    </Button>
                    {isAdmin && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onDelete}
                            className="gap-2 rounded-full text-destructive hover:text-destructive hover:bg-destructive/10 px-2 sm:px-3"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="hidden sm:inline">Delete</span>
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

