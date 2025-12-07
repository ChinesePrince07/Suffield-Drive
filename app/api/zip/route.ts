
import { getWebDAVClient } from '@/lib/webdav';
import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { PassThrough } from 'stream';

export async function POST(request: NextRequest) {
    try {
        const { paths } = await request.json();

        if (!paths || !Array.isArray(paths) || paths.length === 0) {
            return new NextResponse('Paths array is required', { status: 400 });
        }

        const client = getWebDAVClient();
        const archive = archiver('zip', {
            zlib: { level: 9 } // Sets the compression level.
        });

        // Create a PassThrough stream to pipe the archive into
        const stream = new PassThrough();
        archive.pipe(stream);

        // Process files
        // We don't await the appending process here because we want to start streaming immediately
        // but we need to catch errors.
        (async () => {
            try {
                for (const path of paths) {
                    const filename = path.split('/').pop();
                    // Get file stream from WebDAV
                    const fileStream = client.createReadStream(path);
                    archive.append(fileStream, { name: filename });
                }
                await archive.finalize();
            } catch (err) {
                console.error('Archiving error:', err);
                archive.abort();
            }
        })();

        // @ts-ignore - Node stream to Web stream
        return new NextResponse(stream, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="download.zip"`,
            },
        });

    } catch (error) {
        console.error('Zip error:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
