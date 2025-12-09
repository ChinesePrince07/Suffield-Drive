'use client';

import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu';
import { FileItem } from '@/lib/types';
import { Download, Edit, FolderInput, Trash2, ExternalLink, Copy, Scissors } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useClipboard } from '@/lib/clipboard-context';

interface FileContextMenuProps {
    children: React.ReactNode;
    item: FileItem;
    onRename: () => void;
    onMove: () => void;
    onDelete: () => void;
}

export function FileContextMenu({ children, item, onRename, onMove, onDelete }: FileContextMenuProps) {
    const { isAdmin } = useAuth();
    const { copy, cut } = useClipboard();

    const handleDownload = async () => {
        if (item.type === 'directory') {
            try {
                const response = await fetch('/api/zip', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paths: [item.filename] }),
                });
                if (!response.ok) throw new Error('Download failed');
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${item.basename}.zip`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(url);
            } catch (error) {
                console.error(error);
            }
        } else {
            const link = document.createElement('a');
            link.href = `/api/file?path=${encodeURIComponent(item.filename)}&mime=${encodeURIComponent(item.mime || '')}`;
            link.download = item.basename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                {children}
            </ContextMenuTrigger>
            <ContextMenuContent className="w-64 bg-popover border shadow-lg">
                <ContextMenuItem onClick={() => window.open(`/api/file?path=${encodeURIComponent(item.filename)}&inline=true`, '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Open in New Tab
                </ContextMenuItem>
                <ContextMenuItem onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" />
                    Download
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => copy([item])}>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy
                </ContextMenuItem>
                {isAdmin && (
                    <ContextMenuItem onClick={() => cut([item])}>
                        <Scissors className="mr-2 h-4 w-4" />
                        Cut
                    </ContextMenuItem>
                )}
                <ContextMenuSeparator />
                <ContextMenuItem onClick={onRename}>
                    <Edit className="mr-2 h-4 w-4" />
                    Rename
                </ContextMenuItem>
                <ContextMenuItem onClick={onMove}>
                    <FolderInput className="mr-2 h-4 w-4" />
                    Move to...
                </ContextMenuItem>
                {isAdmin && (
                    <>
                        <ContextMenuSeparator />
                        <ContextMenuItem onClick={onDelete} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                        </ContextMenuItem>
                    </>
                )}
            </ContextMenuContent>
        </ContextMenu>
    );
}

