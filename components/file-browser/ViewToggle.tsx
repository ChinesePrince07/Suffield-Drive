'use client';

import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function ViewToggle() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const currentView = searchParams.get('view') || 'grid';

    const setView = (view: 'grid' | 'list') => {
        const params = new URLSearchParams(searchParams);
        params.set('view', view);
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <div className="flex items-center border rounded-md bg-background">
            <Button
                variant={currentView === 'grid' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8 rounded-none rounded-l-md"
                onClick={() => setView('grid')}
            >
                <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
                variant={currentView === 'list' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8 rounded-none rounded-r-md"
                onClick={() => setView('list')}
            >
                <List className="h-4 w-4" />
            </Button>
        </div>
    );
}
