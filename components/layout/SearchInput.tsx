'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useCallback, useState, useEffect } from 'react';

export function SearchInput() {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const [searchValue, setSearchValue] = useState(searchParams.get('search') || '');

    // Sync with URL params
    useEffect(() => {
        setSearchValue(searchParams.get('search') || '');
    }, [searchParams]);

    const handleSearch = useCallback((term: string) => {
        const params = new URLSearchParams(searchParams);
        if (term) {
            params.set('search', term);
            // Keep the current folder - search within it
        } else {
            params.delete('search');
        }
        replace(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, replace]);

    return (
        <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder="Search files..."
                className="pl-9 bg-secondary/50 border-transparent focus:bg-background transition-all"
                value={searchValue}
                onChange={(e) => {
                    const value = e.target.value;
                    setSearchValue(value);
                    // Debounce the search
                    const timeoutId = setTimeout(() => handleSearch(value), 300);
                    return () => clearTimeout(timeoutId);
                }}
            />
        </div>
    );
}

