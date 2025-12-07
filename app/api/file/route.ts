
import { getWebDAVClient } from '@/lib/webdav';
import { NextRequest, NextResponse } from 'next/server';



export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const path = searchParams.get('path');

    if (!path) {
        return new NextResponse('Path is required', { status: 400 });
    }

    try {
        console.log(`Serving file: ${path} with mime: ${searchParams.get('mime')}`);
        const client = getWebDAVClient();
        // Get file stream
        const stream = client.createReadStream(path);

        const mime = searchParams.get('mime') || 'application/octet-stream';

        // We need to convert the stream to a ReadableStream for Next.js
        // @ts-ignore - webdav stream is compatible enough
        return new NextResponse(stream, {
            headers: {
                'Content-Type': mime,
                'Content-Disposition': `inline; filename="${path.split('/').pop()}"`,
            },
        });
    } catch (error) {
        console.error('Error serving file:', error);
        return new NextResponse('File not found or error', { status: 404 });
    }
}
