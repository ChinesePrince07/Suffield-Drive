'use client';

import { useEffect, useState } from 'react';
import * as mammoth from 'mammoth';
import { Loader2 } from 'lucide-react';

interface DocxViewerProps {
    downloadUrl: string;
    filename: string;
}

export function DocxViewer({ downloadUrl, filename }: DocxViewerProps) {
    const [html, setHtml] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadDocx = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch the DOCX file as an ArrayBuffer
                const response = await fetch(downloadUrl);
                if (!response.ok) {
                    throw new Error('Failed to fetch document');
                }

                const arrayBuffer = await response.arrayBuffer();

                // Convert DOCX to HTML using mammoth
                const result = await mammoth.convertToHtml({ arrayBuffer });
                setHtml(result.value);

                // Log any messages/warnings from mammoth
                if (result.messages.length > 0) {
                    console.log('Mammoth conversion messages:', result.messages);
                }
            } catch (err) {
                console.error('Error loading DOCX:', err);
                setError(err instanceof Error ? err.message : 'Failed to load document');
            } finally {
                setLoading(false);
            }
        };

        loadDocx();
    }, [downloadUrl]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Loading document...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                <div className="text-6xl">⚠️</div>
                <div>
                    <h3 className="text-lg font-semibold mb-2">Failed to Load Document</h3>
                    <p className="text-muted-foreground text-sm mb-4">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-auto bg-card">
            <div
                className="docx-content max-w-4xl mx-auto p-8 bg-white dark:bg-card min-h-full"
                dangerouslySetInnerHTML={{ __html: html || '' }}
                style={{
                    fontSize: '14px',
                    lineHeight: '1.6',
                    color: 'var(--foreground)',
                    userSelect: 'text',
                    WebkitUserSelect: 'text',
                    cursor: 'text',
                }}
            />
        </div>
    );
}
