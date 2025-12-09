'use server';

import { getWebDAVClient } from '@/lib/webdav';
import { revalidatePath } from 'next/cache';

export async function createFolder(path: string) {
    try {
        const client = getWebDAVClient();
        await client.createDirectory(path);
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Create folder error:', error);
        return { success: false };
    }
}

export async function deleteItems(paths: string[]) {
    try {
        const client = getWebDAVClient();
        for (const path of paths) {
            await client.deleteFile(path);
        }
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Delete error:', error);
        return { success: false };
    }
}

export async function moveFiles(paths: string[], destination: string) {
    try {
        const client = getWebDAVClient();
        for (const path of paths) {
            const filename = path.split('/').pop();
            // Ensure destination doesn't end with slash unless it's root, but webdav client handles paths well usually.
            // If destination is '/', we want '/filename'. If '/folder', we want '/folder/filename'.
            const destPath = destination === '/' ? `/${filename}` : `${destination}/${filename}`;
            await client.moveFile(path, destPath);
        }
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Move error:', error);
        return { success: false };
    }
}

export async function renameFile(path: string, newName: string) {
    try {
        const client = getWebDAVClient();
        const directory = path.split('/').slice(0, -1).join('/');
        const newPath = directory ? `${directory}/${newName}` : `/${newName}`;
        await client.moveFile(path, newPath);
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Rename error:', error);
        return { success: false };
    }
}

export async function getFolders(path: string) {
    try {
        const client = getWebDAVClient();
        const items = await client.getDirectoryContents(path);
        const folders = (Array.isArray(items) ? items : [items])
            .filter((item: any) => item.type === 'directory')
            .map((item: any) => ({
                filename: item.filename,
                basename: item.basename
            }));
        return { success: true, folders };
    } catch (error) {
        console.error('Get folders error:', error);
        return { success: false, folders: [] };
    }
}

export async function uploadFile(formData: FormData) {
    try {
        const file = formData.get('file') as File;
        const path = formData.get('path') as string;

        if (!file) return { success: false };

        const client = getWebDAVClient();
        const buffer = Buffer.from(await file.arrayBuffer());
        // Handle path construction carefully
        const uploadPath = path === '/' ? `/${file.name}` : `${path}/${file.name}`;

        // Create parent directories if they don't exist (for folder uploads)
        if (path && path !== '/') {
            const pathParts = path.split('/').filter(Boolean);
            let currentPath = '';
            for (const part of pathParts) {
                currentPath += '/' + part;
                try {
                    // Check if directory exists, if not create it
                    const exists = await client.exists(currentPath);
                    if (!exists) {
                        await client.createDirectory(currentPath);
                    }
                } catch {
                    // Try to create anyway if exists check fails
                    try {
                        await client.createDirectory(currentPath);
                    } catch {
                        // Directory might already exist, continue
                    }
                }
            }
        }

        await client.putFileContents(uploadPath, buffer);
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error('Upload error:', error);
        return { success: false };
    }
}
