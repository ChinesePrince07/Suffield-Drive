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

        // Fetch child counts for folders in parallel
        const filesWithCounts = await Promise.all(
            files.map(async (item: any) => {
                if (item.type === 'directory') {
                    try {
                        const children = await client.getDirectoryContents(item.filename) as any[];
                        // Filter out the directory itself from the count
                        const childCount = children.filter((child: any) => child.filename !== item.filename).length;
                        return { ...item, childCount };
                    } catch {
                        return { ...item, childCount: 0 };
                    }
                }
                return item;
            })
        );

        return NextResponse.json(filesWithCounts);
    } catch (error) {
        console.error('Failed to list directory:', error);
        return NextResponse.json({ error: 'Failed to list directory' }, { status: 500 });
    }
}
