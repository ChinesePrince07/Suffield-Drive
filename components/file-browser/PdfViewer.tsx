'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PdfViewerProps {
    downloadUrl: string;
    filename: string;
}

export function PdfViewer({ downloadUrl, filename }: PdfViewerProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const pagesContainerRef = useRef<HTMLDivElement>(null);
    const [totalPages, setTotalPages] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [pdfDoc, setPdfDoc] = useState<any>(null);
    const [zoom, setZoom] = useState(1.0);
    const renderedPagesZoom = useRef<Map<number, number>>(new Map()); // Track which zoom level each page was rendered at
    const canvasRefs = useRef<Map<number, HTMLCanvasElement>>(new Map());

    // Pinch zoom tracking
    const initialPinchDistance = useRef(0);
    const initialZoom = useRef(1.0);

    useEffect(() => {
        const loadPdf = async () => {
            try {
                setLoading(true);
                const pdfjsLib = await import('pdfjs-dist');
                pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

                const loadingTask = pdfjsLib.getDocument({
                    url: downloadUrl,
                    withCredentials: false,
                });
                const pdf = await loadingTask.promise;

                setPdfDoc(pdf);
                setTotalPages(pdf.numPages);
                setCurrentPage(1);
                setLoading(false);
            } catch (error) {
                console.error('Error loading PDF:', error);
                setLoading(false);
            }
        };

        loadPdf();
    }, [downloadUrl]);

    // Render a single page
    const renderPage = useCallback(async (pageNum: number) => {
        if (!pdfDoc) return;

        // Skip if already rendered at current zoom level
        if (renderedPagesZoom.current.get(pageNum) === zoom) return;

        const canvas = canvasRefs.current.get(pageNum);
        if (!canvas || !containerRef.current) return;

        const page = await pdfDoc.getPage(pageNum);
        const context = canvas.getContext('2d')!;

        const devicePixelRatio = window.devicePixelRatio || 1;
        const containerWidth = containerRef.current.clientWidth - 16; // Account for padding
        const viewport = page.getViewport({ scale: 1 });

        const baseScale = containerWidth / viewport.width;
        const scale = baseScale * zoom * devicePixelRatio;
        const scaledViewport = page.getViewport({ scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const displayWidth = scaledViewport.width / devicePixelRatio;
        const displayHeight = scaledViewport.height / devicePixelRatio;
        canvas.style.height = `${displayHeight}px`;
        canvas.style.width = `${displayWidth}px`;

        context.save();
        await page.render({
            canvasContext: context,
            viewport: scaledViewport,
        }).promise;
        context.restore();

        renderedPagesZoom.current.set(pageNum, zoom);
    }, [pdfDoc, zoom]);

    // Render visible pages on scroll
    useEffect(() => {
        if (!pdfDoc || !pagesContainerRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const pageNum = parseInt(entry.target.getAttribute('data-page') || '0');
                        if (pageNum > 0) {
                            renderPage(pageNum);
                        }
                    }
                });
            },
            { root: containerRef.current, rootMargin: '100px', threshold: 0.1 }
        );

        const pageElements = pagesContainerRef.current.querySelectorAll('[data-page]');
        pageElements.forEach((el) => observer.observe(el));

        return () => observer.disconnect();
    }, [pdfDoc, renderPage, totalPages]);

    // Re-render visible pages when zoom changes
    useEffect(() => {
        if (!pdfDoc || !containerRef.current) return;
        // Just trigger a scroll event to re-render visible pages
        const container = containerRef.current;
        const scrollTop = container.scrollTop;
        container.scrollTop = scrollTop + 1;
        requestAnimationFrame(() => {
            container.scrollTop = scrollTop;
        });
    }, [zoom, pdfDoc]);

    // Track current page on scroll
    const handleScroll = useCallback(() => {
        if (!pagesContainerRef.current || !containerRef.current) return;

        const container = containerRef.current;
        const pages = pagesContainerRef.current.querySelectorAll('[data-page]');
        const scrollTop = container.scrollTop;
        const containerHeight = container.clientHeight;

        for (let i = 0; i < pages.length; i++) {
            const page = pages[i] as HTMLElement;
            const pageTop = page.offsetTop;
            const pageHeight = page.offsetHeight;

            if (pageTop + pageHeight / 2 > scrollTop && pageTop < scrollTop + containerHeight / 2) {
                setCurrentPage(i + 1);
                break;
            }
        }
    }, []);

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 5.0));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 1.0));
    const handleResetZoom = () => setZoom(1.0);

    // Pinch to zoom
    const getPinchDistance = (touches: React.TouchList) => {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            initialPinchDistance.current = getPinchDistance(e.touches);
            initialZoom.current = zoom;
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && initialPinchDistance.current > 0) {
            e.preventDefault(); // Prevent page zoom
            e.stopPropagation();
            const currentDistance = getPinchDistance(e.touches);
            const scaleFactor = currentDistance / initialPinchDistance.current;
            const newZoom = Math.max(1.0, Math.min(5.0, initialZoom.current * scaleFactor));
            setZoom(newZoom);
        }
    };

    const handleTouchEnd = () => {
        initialPinchDistance.current = 0;
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-muted">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
                    <p className="mt-2 text-sm text-muted-foreground">Loading PDF...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-muted">
            {/* Scrollable PDF Container */}
            <div
                ref={containerRef}
                className="flex-1 overflow-auto overscroll-contain"
                onScroll={handleScroll}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
                style={{ touchAction: 'pan-y pinch-zoom' }}
            >
                <div ref={pagesContainerRef} className="flex flex-col items-center gap-4 p-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <div
                            key={pageNum}
                            data-page={pageNum}
                            className="bg-white shadow-lg"
                        >
                            <canvas
                                ref={(el) => {
                                    if (el) canvasRefs.current.set(pageNum, el);
                                }}
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Controls - centered, pushed down with filled background */}
            <div className="border-t bg-background py-2 pb-20 flex items-center justify-center gap-4">
                {/* Page indicator */}
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                    {currentPage} / {totalPages}
                </div>

                {/* Zoom Controls */}
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleZoomOut} disabled={zoom <= 1.0}>
                        <ZoomOut className="h-4 w-4" />
                    </Button>

                    <div className="text-sm text-muted-foreground whitespace-nowrap min-w-[50px] text-center">
                        {Math.round(zoom * 100)}%
                    </div>

                    <Button variant="outline" size="sm" onClick={handleZoomIn} disabled={zoom >= 5.0}>
                        <ZoomIn className="h-4 w-4" />
                    </Button>

                    <Button variant="outline" size="sm" onClick={handleResetZoom} title="Fit to Width">
                        <Maximize2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
