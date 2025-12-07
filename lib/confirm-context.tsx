'use client';

import { useState, createContext, useContext, useCallback } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    destructive?: boolean;
}

interface ConfirmContextType {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmContext = createContext<ConfirmContextType | undefined>(undefined);

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [options, setOptions] = useState<ConfirmOptions | null>(null);
    const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

    const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setOptions(opts);
            setResolvePromise(() => resolve);
            setIsOpen(true);
        });
    }, []);

    const handleConfirm = () => {
        setIsOpen(false);
        resolvePromise?.(true);
    };

    const handleCancel = () => {
        setIsOpen(false);
        resolvePromise?.(false);
    };

    return (
        <ConfirmContext.Provider value={{ confirm }}>
            {children}
            <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
                <AlertDialogContent className="bg-background border shadow-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>{options?.title}</AlertDialogTitle>
                        <AlertDialogDescription>{options?.description}</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={handleCancel}>
                            {options?.cancelText || 'Cancel'}
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleConfirm}
                            className={options?.destructive ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
                        >
                            {options?.confirmText || 'Confirm'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </ConfirmContext.Provider>
    );
}

export function useConfirm() {
    const context = useContext(ConfirmContext);
    if (context === undefined) {
        throw new Error('useConfirm must be used within a ConfirmProvider');
    }
    return context;
}
