'use client';

import { FileItem } from '@/lib/types';
import { FileCard } from './FileCard';
import { FilePreviewModal } from './FilePreviewModal';
import { useState } from 'react';

import { useRouter } from 'next/navigation';

import { FileContextMenu } from './FileContextMenu';

interface FileGridProps {
    items: FileItem[];
    selectedIds: Set<string>;
    onSelectionChange: (id: string, selected: boolean) => void;
    onExclusiveSelect: (id: string) => void;
    onRename: (item: FileItem) => void;
    onMove: (item: FileItem) => void;
    onDelete: (item: FileItem) => void;
}

export function FileGrid({ items, selectedIds, onSelectionChange, onExclusiveSelect, onRename, onMove, onDelete }: FileGridProps) {
    const [selectedItem, setSelectedItem] = useState<FileItem | null>(null);
    const router = useRouter();

    const handleItemClick = (e: React.MouseEvent, item: FileItem) => {
        if (e.metaKey || e.ctrlKey) {
            onSelectionChange(item.id, !selectedIds.has(item.id));
        } else {
            onExclusiveSelect(item.id);
        }
    };

    const handleItemDoubleClick = (item: FileItem) => {
        if (item.type === 'directory') {
            router.push(`/?folderId=${encodeURIComponent(item.filename)}`);
        } else {
            setSelectedItem(item);
        }
    };

    return (
        <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 select-none">
                {items.map((item) => (
                    <FileContextMenu
                        key={item.id}
                        item={item}
                        onRename={() => onRename(item)}
                        onMove={() => onMove(item)}
                        onDelete={() => onDelete(item)}
                    >
                        <div
                            data-selection-id={item.id}
                            onClick={(e) => handleItemClick(e, item)}
                            onDoubleClick={() => handleItemDoubleClick(item)}
                            className="cursor-pointer"
                        >
                            <FileCard item={item} selected={selectedIds.has(item.id)} />
                        </div>
                    </FileContextMenu>
                ))}
            </div>
            <FilePreviewModal
                item={selectedItem}
                isOpen={!!selectedItem}
                onClose={() => setSelectedItem(null)}
            />
        </>
    );
}
