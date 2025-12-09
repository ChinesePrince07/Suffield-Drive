'use client';

import { FileItem } from '@/lib/types';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { FileText, Folder, Image as ImageIcon, ArrowUp, ArrowDown } from 'lucide-react';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useState, useMemo } from 'react';
import { FilePreviewModal } from './FilePreviewModal';
import { FileContextMenu } from './FileContextMenu';

interface FileListViewProps {
    items: FileItem[];
    selectedIds: Set<string>;
    onSelectionChange: (id: string, selected: boolean) => void;
    onSelectAll: (selected: boolean) => void;
    onExclusiveSelect: (id: string) => void;
    onRename: (item: FileItem) => void;
    onMove: (item: FileItem) => void;
    onDelete: (item: FileItem) => void;
}

type SortKey = 'name' | 'date' | 'kind' | 'size';
type SortDirection = 'asc' | 'desc';

export function FileListView({ items, selectedIds, onSelectionChange, onSelectAll, onExclusiveSelect, onRename, onMove, onDelete }: FileListViewProps) {
    const router = useRouter();
    const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
    const [lastClick, setLastClick] = useState<{ id: string; time: number } | null>(null);
    const [sortKey, setSortKey] = useState<SortKey>('name');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

    const handleSort = (key: SortKey) => {
        if (sortKey === key) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortKey(key);
            setSortDirection('asc');
        }
    };

    const sortedItems = useMemo(() => {
        const sorted = [...items].sort((a, b) => {
            // Folders always come first
            if (a.type === 'directory' && b.type !== 'directory') return -1;
            if (a.type !== 'directory' && b.type === 'directory') return 1;

            let comparison = 0;
            switch (sortKey) {
                case 'name':
                    comparison = a.basename.localeCompare(b.basename);
                    break;
                case 'date':
                    const dateA = a.lastmod ? new Date(a.lastmod).getTime() : 0;
                    const dateB = b.lastmod ? new Date(b.lastmod).getTime() : 0;
                    comparison = dateA - dateB;
                    break;
                case 'kind':
                    const kindA = a.mime || '';
                    const kindB = b.mime || '';
                    comparison = kindA.localeCompare(kindB);
                    break;
                case 'size':
                    comparison = (a.size || 0) - (b.size || 0);
                    break;
            }
            return sortDirection === 'asc' ? comparison : -comparison;
        });
        return sorted;
    }, [items, sortKey, sortDirection]);

    const SortIcon = ({ columnKey }: { columnKey: SortKey }) => {
        if (sortKey !== columnKey) return null;
        return sortDirection === 'asc'
            ? <ArrowUp className="inline h-3 w-3 ml-1" />
            : <ArrowDown className="inline h-3 w-3 ml-1" />;
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    };

    const allSelected = sortedItems.length > 0 && sortedItems.every(item => selectedIds.has(item.id));
    const someSelected = sortedItems.some(item => selectedIds.has(item.id));

    return (
        <>
            <div className="rounded-lg border bg-card shadow-sm overflow-hidden select-none">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-muted/50 hover:bg-muted/50 border-b border-border/50">
                            <TableHead className="w-[40px] pl-4">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    checked={allSelected}
                                    ref={input => {
                                        if (input) {
                                            input.indeterminate = someSelected && !allSelected;
                                        }
                                    }}
                                    onChange={(e) => onSelectAll(e.target.checked)}
                                />
                            </TableHead>
                            <TableHead
                                className="w-[50%] font-medium text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort('name')}
                            >
                                Name<SortIcon columnKey="name" />
                            </TableHead>
                            <TableHead
                                className="font-medium text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort('date')}
                            >
                                Date Modified<SortIcon columnKey="date" />
                            </TableHead>
                            <TableHead
                                className="font-medium text-xs uppercase tracking-wider text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort('kind')}
                            >
                                Kind<SortIcon columnKey="kind" />
                            </TableHead>
                            <TableHead
                                className="text-right font-medium text-xs uppercase tracking-wider text-muted-foreground pr-4 cursor-pointer hover:text-foreground transition-colors"
                                onClick={() => handleSort('size')}
                            >
                                Size<SortIcon columnKey="size" />
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {sortedItems.map((item, index) => {
                            const isFolder = item.type === 'directory';
                            const isImage = item.mime?.startsWith('image/');
                            const Icon = isFolder ? Folder : isImage ? ImageIcon : FileText;
                            const isSelected = selectedIds.has(item.id);

                            const handleRowClick = (e: React.MouseEvent, item: FileItem) => {
                                // If clicking checkbox, let it handle itself
                                if ((e.target as HTMLElement).closest('input[type="checkbox"]')) return;

                                const now = Date.now();
                                const isAlreadySelected = selectedIds.has(item.id);

                                // Check if this is a second tap on the same item (within 500ms for mobile, or already selected)
                                if (isAlreadySelected && item.type === 'directory' &&
                                    lastClick?.id === item.id && (now - lastClick.time) < 500) {
                                    // Navigate into folder on second tap
                                    router.push(`/?folderId=${encodeURIComponent(item.filename)}`);
                                    return;
                                }

                                // Update last click tracking
                                setLastClick({ id: item.id, time: now });

                                if (e.metaKey || e.ctrlKey) {
                                    // Toggle selection
                                    onSelectionChange(item.id, !selectedIds.has(item.id));
                                } else {
                                    // Exclusive selection
                                    onExclusiveSelect(item.id);
                                }
                            };

                            const handleRowDoubleClick = (item: FileItem) => {
                                if (item.type === 'directory') {
                                    router.push(`/?folderId=${encodeURIComponent(item.filename)}`);
                                } else {
                                    setSelectedItem(item);
                                }
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

                            // ... inside map
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
                                        onClick={(e) => handleRowClick(e, item)}
                                        onDoubleClick={() => handleRowDoubleClick(item)}
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
                                                            handleRowDoubleClick(item);
                                                        }}
                                                    >
                                                        {item.basename}
                                                    </span>
                                                ) : (
                                                    <span
                                                        className="text-sm text-foreground hover:underline cursor-pointer"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleRowDoubleClick(item);
                                                        }}
                                                    >
                                                        {item.basename}
                                                    </span>
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
                                            {isFolder
                                                ? (item.childCount !== undefined
                                                    ? `${item.childCount} item${item.childCount !== 1 ? 's' : ''}`
                                                    : '--')
                                                : formatSize(item.size)}
                                        </TableCell>
                                    </TableRow>
                                </FileContextMenu>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>
            <FilePreviewModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </>
    );
}
