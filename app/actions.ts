'use server';

import { getWebDAVClient } from '@/lib/webdav';
import { revalidatePath } from 'next/cache';
import { Readable } from 'stream';

export async function uploadFile(formData: FormData): Promise<{ success: boolean; error?: string }> {
    const file = formData.get('file') as File;

    if (!file) {
        return { success: false, error: 'No file provided' };
    }

    const path = formData.get('path') as string || '/';

    try {
        const client = getWebDAVClient();

        // WebDAV putFileContents
        const uploadPath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;

        // Ensure parent directory exists
        const parentPath = uploadPath.split('/').slice(0, -1).join('/');
        if (parentPath && parentPath !== '/') {
            try {
                await client.createDirectory(parentPath, { recursive: true });
            } catch {
                // Directory might already exist, that's fine
            }
        }

        // Use stream for large files to avoid memory issues
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Convert buffer to readable stream for efficient upload
        const stream = Readable.from(buffer);

        await client.putFileContents(uploadPath, stream, {
            overwrite: true,
            contentLength: file.size,
        });

        return { success: true };
    } catch (error: any) {
        console.error('Upload failed:', error);
        // Check for specific error types
        if (error?.message?.includes('413') || error?.status === 413) {
            return { success: false, error: 'File too large for server' };
        }
        if (error?.message?.includes('timeout') || error?.code === 'ETIMEDOUT') {
            return { success: false, error: 'Upload timed out - file may be too large' };
        }
        return { success: false, error: String(error) };
    }
}



export async function createFolder(path: string) {
    const client = getWebDAVClient();

    try {
        await client.createDirectory(path);
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to create folder:', error);
        return { success: false, error: 'Failed to create folder' };
    }
}

export async function moveFiles(sourcePaths: string[], destinationPath: string) {
    const client = getWebDAVClient();

    try {
        const results = await Promise.all(sourcePaths.map(async (source) => {
            const filename = source.split('/').pop();
            const dest = destinationPath === '/' ? `/${filename}` : `${destinationPath}/${filename}`;
            try {
                await client.moveFile(source, dest);
                return { path: source, success: true };
            } catch (e) {
                console.error(`Failed to move ${source} to ${dest}`, e);
                return { path: source, success: false, error: e };
            }
        }));

        revalidatePath('/');
        return { success: true, results };
    } catch (error) {
        console.error('Failed to move files:', error);
        return { success: false, error: 'Failed to move files' };
    }
}

export async function copyFiles(sourcePaths: string[], destinationPath: string) {
    const client = getWebDAVClient();

    try {
        const results = await Promise.all(sourcePaths.map(async (source) => {
            const filename = source.split('/').pop();
            const dest = destinationPath === '/' ? `/${filename}` : `${destinationPath}/${filename}`;
            try {
                await client.copyFile(source, dest);
                return { path: source, success: true };
            } catch (e) {
                console.error(`Failed to copy ${source} to ${dest}`, e);
                return { path: source, success: false, error: e };
            }
        }));

        revalidatePath('/');
        return { success: true, results };
    } catch (error) {
        console.error('Failed to copy files:', error);
        return { success: false, error: 'Failed to copy files' };
    }
}

export async function getFolders(path: string = '/') {
    const client = getWebDAVClient();
    try {
        const items = await client.getDirectoryContents(path) as any[];
        const folders = items
            .filter(item => item.type === 'directory' && item.filename !== path)
            .map(item => ({
                filename: item.filename,
                basename: item.basename,
            }));
        return { success: true, folders };
    } catch (error) {
        console.error('Failed to fetch folders:', error);
        return { success: false, folders: [] };
    }
}

export async function renameFile(path: string, newName: string) {
    const client = getWebDAVClient();
    try {
        const parentPath = path.split('/').slice(0, -1).join('/') || '/';
        const dest = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;

        await client.moveFile(path, dest);
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Failed to rename file:', error);
        return { success: false, error: 'Failed to rename file' };
    }
}
export async function deleteItems(paths: string[]) {
    const client = getWebDAVClient();

    console.log('[deleteItems] Starting delete for paths:', paths);

    try {
        const results = await Promise.all(paths.map(async (path) => {
            try {
                console.log('[deleteItems] Deleting:', path);
                await client.deleteFile(path);
                console.log('[deleteItems] Successfully deleted:', path);
                return { path, success: true };
            } catch (e) {
                console.error(`[deleteItems] Failed to delete ${path}:`, e);
                return { path, success: false, error: String(e) };
            }
        }));

        const allSucceeded = results.every(r => r.success);
        console.log('[deleteItems] Results:', results, 'All succeeded:', allSucceeded);

        revalidatePath('/');
        return { success: allSucceeded, results };
    } catch (error) {
        console.error('[deleteItems] Fatal error:', error);
        return { success: false, error: 'Failed to delete items' };
    }
}

