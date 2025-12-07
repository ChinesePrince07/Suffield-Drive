import { NextRequest, NextResponse } from 'next/server';
import { getWebDAVClient } from '@/lib/webdav';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path') || '/';

    try {
        const client = getWebDAVClient();
        const directoryItems = await client.getDirectoryContents(path) as any[];

        const files = directoryItems
            .filter((item: any) => item.filename !== path)
            .map((item: any) => ({
                ...item,
                id: item.filename,
            }));

        return NextResponse.json(files);
    } catch (error) {
        console.error('Failed to list directory:', error);
        return NextResponse.json({ error: 'Failed to list directory' }, { status: 500 });
    }
}
