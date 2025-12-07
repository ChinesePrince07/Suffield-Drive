'use client';

import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SearchInput } from './SearchInput';
import { UserMenu } from './UserMenu';
import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ============================================
// EDIT YOUR SITE TITLE HERE
// ============================================
const SITE_TITLE = "Suffield Drive";
// ============================================

export function Header() {
    return (
        <header className="h-16 border-b bg-background px-4 sm:px-6 flex items-center gap-4 sticky top-0 z-10">
            {/* Site Logo/Title */}
            <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity shrink-0">
                <Image
                    src="/logo.png"
                    alt="Logo"
                    width={36}
                    height={36}
                    className="rounded-lg"
                />
                <span className="text-lg sm:text-xl font-bold text-foreground hidden sm:inline">{SITE_TITLE}</span>
            </Link>

            {/* Search */}
            <div className="flex-1 max-w-md mx-auto">
                <Suspense fallback={<div className="h-10 w-full bg-muted/20 rounded-md animate-pulse" />}>
                    <SearchInput />
                </Suspense>
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <Button variant="ghost" size="icon" className="hidden sm:flex">
                    <Bell className="h-5 w-5 text-muted-foreground" />
                </Button>
                <UserMenu />
            </div>
        </header>
    );
}
