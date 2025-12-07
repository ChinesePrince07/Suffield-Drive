'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SelectionAreaProps {
    children: React.ReactNode;
    onSelectionChange: (selectedIds: Set<string>) => void;
    items: { id: string }[];
}

export function SelectionArea({ children, onSelectionChange, items }: SelectionAreaProps) {
    const [isSelecting, setIsSelecting] = useState(false);
    const [selectionBox, setSelectionBox] = useState<{ left: number; top: number; width: number; height: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const startPointRef = useRef<{ x: number; y: number } | null>(null);
    const rafRef = useRef<number | null>(null);
    const lastSelectedRef = useRef<Set<string>>(new Set());

    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        // Only start drag selection with left mouse button
        // Don't start if clicking on buttons, links, inputs, or context menu items
        const target = e.target as HTMLElement;
        if (e.button !== 0 || target.closest('button, a, input, [role="menuitem"], [data-radix-collection-item]')) return;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left + container.scrollLeft;
        const y = e.clientY - rect.top + container.scrollTop;

        startPointRef.current = { x, y };
        setIsSelecting(true);
        setSelectionBox({ left: x, top: y, width: 0, height: 0 });

        // Prevent text selection during drag
        e.preventDefault();
    }, []);

    const calculateSelection = useCallback(() => {
        if (!selectionBox || !containerRef.current) return;

        const itemElements = containerRef.current.querySelectorAll('[data-selection-id]');
        const newSelectedIds = new Set<string>();
        const containerRect = containerRef.current.getBoundingClientRect();

        itemElements.forEach((el) => {
            const elRect = el.getBoundingClientRect();
            const elLeft = elRect.left - containerRect.left + containerRef.current!.scrollLeft;
            const elTop = elRect.top - containerRect.top + containerRef.current!.scrollTop;

            if (
                elLeft < selectionBox.left + selectionBox.width &&
                elLeft + elRect.width > selectionBox.left &&
                elTop < selectionBox.top + selectionBox.height &&
                elTop + elRect.height > selectionBox.top
            ) {
                const id = el.getAttribute('data-selection-id');
                if (id) newSelectedIds.add(id);
            }
        });

        // Only update if selection changed
        const prevIds = lastSelectedRef.current;
        const changed = newSelectedIds.size !== prevIds.size ||
            [...newSelectedIds].some(id => !prevIds.has(id));

        if (changed) {
            lastSelectedRef.current = newSelectedIds;
            onSelectionChange(newSelectedIds);
        }
    }, [selectionBox, onSelectionChange]);

    useEffect(() => {
        if (!isSelecting) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (!startPointRef.current || !containerRef.current) return;

            const container = containerRef.current;
            const rect = container.getBoundingClientRect();
            const x = e.clientX - rect.left + container.scrollLeft;
            const y = e.clientY - rect.top + container.scrollTop;

            // Use RAF for smooth visual updates
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
            rafRef.current = requestAnimationFrame(() => {
                const start = startPointRef.current!;
                setSelectionBox({
                    left: Math.min(start.x, x),
                    top: Math.min(start.y, y),
                    width: Math.abs(x - start.x),
                    height: Math.abs(y - start.y),
                });
            });
        };

        const handleMouseUp = () => {
            setIsSelecting(false);
            setSelectionBox(null);
            startPointRef.current = null;
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [isSelecting]);

    // Calculate selection on box change (debounced via RAF)
    useEffect(() => {
        if (isSelecting && selectionBox) {
            calculateSelection();
        }
    }, [isSelecting, selectionBox, calculateSelection]);

    return (
        <div
            ref={containerRef}
            onMouseDown={handleMouseDown}
            className="relative min-h-full w-full"
        >
            {children}
            {isSelecting && selectionBox && (
                <div
                    className="absolute bg-primary/20 border border-primary z-50 pointer-events-none"
                    style={{
                        left: selectionBox.left,
                        top: selectionBox.top,
                        width: selectionBox.width,
                        height: selectionBox.height,
                    }}
                />
            )}
        </div>
    );
}
