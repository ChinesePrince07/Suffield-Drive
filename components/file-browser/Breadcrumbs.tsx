'use client';

import Link from 'next/link';
import { ChevronRight, Home } from 'lucide-react';
import { Fragment } from 'react';

interface BreadcrumbsProps {
    currentPath: string;
}

export function Breadcrumbs({ currentPath }: BreadcrumbsProps) {
    const segments = currentPath.split('/').filter(Boolean);

    return (
        <nav className="flex items-center text-sm text-muted-foreground">
            <Link
                href="/"
                className="flex items-center hover:text-foreground transition-colors"
            >
                <Home className="h-4 w-4 mr-1" />
                Home
            </Link>
            {segments.map((segment, index) => {
                const path = '/' + segments.slice(0, index + 1).join('/');
                const isLast = index === segments.length - 1;

                return (
                    <Fragment key={path}>
                        <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground/50" />
                        {isLast ? (
                            <span className="font-medium text-foreground">
                                {decodeURIComponent(segment)}
                            </span>
                        ) : (
                            <Link
                                href={`/?folderId=${encodeURIComponent(path)}`}
                                className="hover:text-foreground transition-colors"
                            >
                                {decodeURIComponent(segment)}
                            </Link>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}
