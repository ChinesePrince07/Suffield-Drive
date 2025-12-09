// Memoized file row component for performance
'use client';

import { FileItem } from '@/lib/types';
import {
    TableCell,
    TableRow,
} from '@/components/ui/table';
import { FileText, Folder, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { memo } from 'react';
import { FileContextMenu } from './FileContextMenu';

interface FileRowProps {
    item: FileItem;
    index: number;
    isSelected: boolean;
    lastClick: { id: string; time: number } | null;
    onRowClick: (e: React.MouseEvent, item: FileItem) => void;
    onRowDoubleClick: (item: FileItem) => void;
    onSelectionChange: (id: string, checked: boolean) => void;
    onRename: (item: FileItem) => void;
    onMove: (item: FileItem) => void;
    onDelete: (item: FileItem) => void;
}

const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatKind = (mime: string | undefined, isFolder: boolean, basename: string) => {
    if (isFolder) return 'Folder';

    // Get extension from filename
    const ext = basename.split('.').pop()?.toLowerCase();

    // Office documents - show extension
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext || '')) {
        return ext?.toUpperCase() + ' Document';
    }

    if (!mime) return ext?.toUpperCase() || 'File';
    if (mime === 'application/pdf') return 'PDF';
    if (mime.startsWith('image/')) return ext?.toUpperCase() + ' Image';
    if (mime.startsWith('video/')) return ext?.toUpperCase() + ' Video';
    if (mime.startsWith('audio/')) return ext?.toUpperCase() + ' Audio';
    if (mime.startsWith('text/')) return ext?.toUpperCase() + ' File';

    return ext?.toUpperCase() || 'File';
};

export const FileRow = memo(function FileRow({
    item,
    index,
    isSelected,
    onRowClick,
    onRowDoubleClick,
    onSelectionChange,
    onRename,
    onMove,
    onDelete,
}: FileRowProps) {
    const isFolder = item.type === 'directory';
    const isImage = item.mime?.startsWith('image/');
    const Icon = isFolder ? Folder : isImage ? ImageIcon : FileText;

    return (
        <FileContextMenu
            key={item.id}
            item={item}
            onRename={() => onRename(item)}
            onMove={() => onMove(item)}
            onDelete={() => onDelete(item)}
        >
            <TableRow
                data-selection-id={item.id}
                className={`
                    cursor-pointer border-0 transition-colors
                    ${isSelected ? 'bg-primary/10 hover:bg-primary/20' : index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                    hover:bg-primary/5
                `}
                onClick={(e) => onRowClick(e, item)}
                onDoubleClick={() => onRowDoubleClick(item)}
            >
                <TableCell className="pl-4 py-3">
                    <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        checked={isSelected}
                        onChange={(e) => onSelectionChange(item.id, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                    />
                </TableCell>
                <TableCell className="font-medium py-3">
                    <div className="flex items-center gap-3">
                        <Icon className={`h-5 w-5 ${isFolder ? 'text-blue-500 fill-blue-500/20' : 'text-muted-foreground'}`} />
                        {isFolder ? (
                            <span
                                className="text-sm text-foreground hover:underline cursor-pointer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRowDoubleClick(item);
                                }}
                            >
                                {item.basename}
                            </span>
                        ) : (
                            <span className="text-sm text-foreground">{item.basename}</span>
                        )}
                    </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground py-3">
                    {item.lastmod ? format(new Date(item.lastmod), 'MMM d, yyyy HH:mm') : '-'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground py-3">
                    {formatKind(item.mime, isFolder, item.basename)}
                </TableCell>
                <TableCell className="text-right text-sm text-muted-foreground py-3 pr-4">
                    {isFolder ? '--' : formatSize(item.size)}
                </TableCell>
            </TableRow>
        </FileContextMenu>
    );
}, (prevProps, nextProps) => {
    // Custom comparison: only re-render if item, selection, or index changed
    return (
        prevProps.item.id === nextProps.item.id &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.index === nextProps.index &&
        prevProps.lastClick === nextProps.lastClick
    );
});
