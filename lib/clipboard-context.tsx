'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { FileItem } from './types';

interface ClipboardState {
    items: FileItem[];
    operation: 'copy' | 'move' | null;
}

interface ClipboardContextType {
    clipboard: ClipboardState;
    copy: (items: FileItem[]) => void;
    cut: (items: FileItem[]) => void;
    clear: () => void;
}

const ClipboardContext = createContext<ClipboardContextType | undefined>(undefined);

export function ClipboardProvider({ children }: { children: React.ReactNode }) {
    const [clipboard, setClipboard] = useState<ClipboardState>({
        items: [],
        operation: null,
    });

    const copy = useCallback((items: FileItem[]) => {
        setClipboard({ items, operation: 'copy' });
    }, []);

    const cut = useCallback((items: FileItem[]) => {
        setClipboard({ items, operation: 'move' });
    }, []);

    const clear = useCallback(() => {
        setClipboard({ items: [], operation: null });
    }, []);

    return (
        <ClipboardContext.Provider value={{ clipboard, copy, cut, clear }}>
            {children}
        </ClipboardContext.Provider>
    );
}

export function useClipboard() {
    const context = useContext(ClipboardContext);
    if (context === undefined) {
        throw new Error('useClipboard must be used within a ClipboardProvider');
    }
    return context;
}
