'use client';

import { FileItem } from '@/lib/types';
import { FileListView } from './FileListView';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { FileActionsToolbar } from './FileActionsToolbar';
import { MoveFileModal } from './MoveFileModal';
import { RenameFileModal } from './RenameFileModal';
import { SelectionArea } from './SelectionArea';
import { deleteItems } from '@/app/actions';
import { useSWRConfig } from 'swr';
import { refreshFileList } from '@/lib/refresh';
import { useConfirm } from '@/lib/confirm-context';

interface FileBrowserProps {
    items: FileItem[];
    currentPath?: string;
}

import { useClipboard } from '@/lib/clipboard-context';

export function FileBrowser({ items, currentPath }: FileBrowserProps) {
    const router = useRouter();
    const { mutate } = useSWRConfig();
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
    const prevItemsRef = useRef<string>('');

    const { copy, cut } = useClipboard();

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Ignore if input/textarea is focused
            if (document.activeElement instanceof HTMLInputElement || document.activeElement instanceof HTMLTextAreaElement) {
                return;
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'c') {
                e.preventDefault();
                const selectedItems = items.filter(item => selectedIds.has(item.id));
                if (selectedItems.length > 0) {
                    copy(selectedItems);
                    // Optional: Show toast "Copied X items"
                }
            }

            if ((e.metaKey || e.ctrlKey) && e.key === 'x') {
                e.preventDefault();
                const selectedItems = items.filter(item => selectedIds.has(item.id));
                if (selectedItems.length > 0) {
                    cut(selectedItems);
                    // Optional: Show toast "Cut X items"
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [items, selectedIds, copy, cut]);

    // Clear selection when navigating to a different folder
    useEffect(() => {
        const itemsKey = items.map(i => i.id).sort().join(',');
        if (prevItemsRef.current && prevItemsRef.current !== itemsKey) {
            setSelectedIds(new Set());
        }
        prevItemsRef.current = itemsKey;
    }, [items]);

    const handleSelectionChange = (id: string, selected: boolean) => {
        const newSelected = new Set(selectedIds);
        if (selected) {
            newSelected.add(id);
        } else {
            newSelected.delete(id);
        }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = (selected: boolean) => {
        if (selected) {
            setSelectedIds(new Set(items.map(item => item.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleClearSelection = () => {
        setSelectedIds(new Set());
    };

    const handleExclusiveSelect = (id: string) => {
        setSelectedIds(new Set([id]));
    };

    const handleDownload = async () => {
        const selectedItems = items.filter(item => selectedIds.has(item.id));
        if (selectedItems.length === 0) return;

        for (const item of selectedItems) {
            if (item.type === 'directory') {
                // Download folder as zip
                try {
                    const response = await fetch('/api/zip', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
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
                    console.error(`Failed to download folder ${item.basename}:`, error);
                }
            } else {
                // Download single file
                const link = document.createElement('a');
                link.href = `/api/file?path=${encodeURIComponent(item.filename)}&mime=${encodeURIComponent(item.mime || '')}`;
                link.download = item.basename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            // Small delay to prevent browser blocking multiple downloads
            await new Promise(resolve => setTimeout(resolve, 500));
        }
    };

    const { confirm } = useConfirm();

    const handleDelete = async () => {
        const confirmed = await confirm({
            title: 'Delete Items',
            description: `Are you sure you want to delete ${selectedIds.size} item${selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.`,
            confirmText: 'Delete',
            destructive: true,
        });
        if (!confirmed) return;

        const paths = items.filter(item => selectedIds.has(item.id)).map(item => item.filename);
        console.log('[handleDelete] Deleting paths:', paths);
        const result = await deleteItems(paths);
        console.log('[handleDelete] Delete result:', result);
        if (!result.success) {
            alert('Failed to delete some items. Check the console for details.');
        }
        handleClearSelection();
        refreshFileList();
    };

    const selectedFiles = items.filter(item => selectedIds.has(item.id)).map(item => item.filename);
    const selectedItem = items.find(item => selectedIds.has(item.id));

    const handleRenameItem = (item: FileItem) => {
        setSelectedIds(new Set([item.id]));
        setIsRenameModalOpen(true);
    };

    const handleMoveItem = (item: FileItem) => {
        setSelectedIds(new Set([item.id]));
        setIsMoveModalOpen(true);
    };

    const handleDeleteItem = async (item: FileItem) => {
        const confirmed = await confirm({
            title: 'Delete Item',
            description: `Are you sure you want to delete "${item.basename}"? This action cannot be undone.`,
            confirmText: 'Delete',
            destructive: true,
        });
        if (!confirmed) return;

        console.log('[handleDeleteItem] Deleting:', item.filename);
        const result = await deleteItems([item.filename]);
        console.log('[handleDeleteItem] Delete result:', result);
        if (!result.success) {
            alert('Failed to delete item. Check the console for details.');
        }
        handleClearSelection();
        refreshFileList();
    };

    const handleCopy = () => {
        const selectedItems = items.filter(item => selectedIds.has(item.id));
        if (selectedItems.length > 0) copy(selectedItems);
    };

    const handleCut = () => {
        const selectedItems = items.filter(item => selectedIds.has(item.id));
        if (selectedItems.length > 0) cut(selectedItems);
    };

    return (
        <>
            <SelectionArea
                items={items}
                onSelectionChange={(ids) => setSelectedIds(ids)}
            >
                <FileListView
                    items={items}
                    selectedIds={selectedIds}
                    onSelectionChange={handleSelectionChange}
                    onSelectAll={handleSelectAll}
                    onExclusiveSelect={handleExclusiveSelect}
                    onRename={handleRenameItem}
                    onMove={handleMoveItem}
                    onDelete={handleDeleteItem}
                />
            </SelectionArea>

            <FileActionsToolbar
                selectedCount={selectedIds.size}
                onClearSelection={handleClearSelection}
                onMove={() => setIsMoveModalOpen(true)}
                onRename={() => setIsRenameModalOpen(true)}
                onDelete={handleDelete}
                onDownload={handleDownload}
                onCopy={handleCopy}
                onCut={handleCut}
            />

            <MoveFileModal
                isOpen={isMoveModalOpen}
                onClose={() => setIsMoveModalOpen(false)}
                selectedFiles={selectedFiles}
                onMoveComplete={handleClearSelection}
            />

            <RenameFileModal
                isOpen={isRenameModalOpen}
                onClose={() => setIsRenameModalOpen(false)}
                item={selectedItem ? { filename: selectedItem.filename, basename: selectedItem.basename, type: selectedItem.type } : null}
                onRenameComplete={handleClearSelection}
            />
        </>
    );
}
