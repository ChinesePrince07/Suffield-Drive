'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FolderPlus } from 'lucide-react';
import { createFolder } from '@/app/actions';
import { refreshFileList } from '@/lib/refresh';

interface CreateFolderButtonProps {
    currentPath: string;
}

export function CreateFolderButton({ currentPath }: CreateFolderButtonProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [folderName, setFolderName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleCreate = async () => {
        if (!folderName.trim()) return;

        setIsLoading(true);
        const path = currentPath === '/' ? `/${folderName}` : `${currentPath}/${folderName}`;

        try {
            const result = await createFolder(path);
            if (result.success) {
                setIsOpen(false);
                setFolderName('');
                refreshFileList();
            } else {
                alert('Failed to create folder');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="icon">
                    <FolderPlus className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-background border shadow-xl">
                <DialogHeader>
                    <DialogTitle>Create New Folder</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <Input
                        id="name"
                        placeholder="Folder Name"
                        value={folderName}
                        onChange={(e) => setFolderName(e.target.value)}
                        className="col-span-3"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCreate();
                        }}
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleCreate} disabled={isLoading}>
                        {isLoading ? 'Creating...' : 'Create'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
