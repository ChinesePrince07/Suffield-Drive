'use client';

import useSWR, { useSWRConfig } from 'swr';
import { FileItem } from '@/lib/types';
import { FileBrowser } from './FileBrowser';
import { useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const fetcher = (url: string) => fetch(url).then(res => res.json());

interface FileBrowserClientProps {
    initialData: FileItem[];
    currentPath: string;
    sort: string;
    order: string;
    search: string;
}

export function FileBrowserClient({ initialData, currentPath, sort, order, search }: FileBrowserClientProps) {
    const cacheKey = `/api/list?path=${encodeURIComponent(currentPath)}`;

    const { data, error, isLoading, mutate } = useSWR<FileItem[]>(
        cacheKey,
        fetcher,
        {
            fallbackData: initialData,
            revalidateOnFocus: true,
            revalidateOnMount: true,
            dedupingInterval: 1000, // Reduced from 5s to 1s
        }
    );

    // Expose mutate function globally for other components to trigger refresh
    useEffect(() => {
        (window as any).__refreshFileList = () => mutate();
        return () => {
            delete (window as any).__refreshFileList;
        };
    }, [mutate]);

    if (error) {
        return (
            <div className="p-6 text-center text-red-500">
                Failed to load files. Please refresh the page.
            </div>
        );
    }

    let files = data || [];

    // Client-side search filtering
    if (search) {
        files = files.filter(file =>
            file.basename.toLowerCase().includes(search.toLowerCase())
        );
    }

    // Client-side sorting
    files = [...files].sort((a, b) => {
        let comparison = 0;
        switch (sort) {
            case 'name':
                comparison = a.basename.localeCompare(b.basename);
                break;
            case 'size':
                comparison = a.size - b.size;
                break;
            case 'date':
            case 'lastmod':
                const dateA = new Date(a.lastmod).getTime();
                const dateB = new Date(b.lastmod).getTime();
                comparison = dateA - dateB;
                break;
            default:
                comparison = 0;
        }
        return order === 'desc' ? -comparison : comparison;
    });

    return (
        <>
            {isLoading && !initialData.length && (
                <div className="flex items-center justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            )}
            <FileBrowser items={files} currentPath={currentPath} />
        </>
    );
}

