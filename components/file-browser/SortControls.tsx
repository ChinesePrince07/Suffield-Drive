'use client';

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function SortControls() {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const sort = searchParams.get('sort') || 'name';
    const order = searchParams.get('order') || 'asc';

    const updateParams = (key: string, value: string) => {
        const params = new URLSearchParams(searchParams);
        params.set(key, value);
        router.push(`${pathname}?${params.toString()}`);
    };

    const toggleOrder = () => {
        updateParams('order', order === 'asc' ? 'desc' : 'asc');
    };

    return (
        <div className="flex items-center gap-2">
            <Select value={sort} onValueChange={(val) => updateParams('sort', val)}>
                <SelectTrigger className="w-[140px] h-8">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="date">Date Modified</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                </SelectContent>
            </Select>
            <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={toggleOrder}
            >
                {order === 'asc' ? (
                    <ArrowUp className="h-4 w-4" />
                ) : (
                    <ArrowDown className="h-4 w-4" />
                )}
            </Button>
        </div>
    );
}
