import { getWebDAVClient } from '@/lib/webdav';
import { FileBrowserClient } from '@/components/file-browser/FileBrowserClient';
import { Cloud } from 'lucide-react';
import { CreateFolderButton } from '@/components/file-browser/CreateFolderButton';
import { UploadButton } from '@/components/file-browser/UploadButton';
import { FileItem } from '@/lib/types';
import { Breadcrumbs } from '@/components/file-browser/Breadcrumbs';

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string; view?: string; sort?: string; order?: string; search?: string }>;
}) {
  const { folderId, view = 'list', sort = 'lastmod', order = 'desc', search } = await searchParams;
  const client = getWebDAVClient();

  // Simple check if configured
  if (!process.env.WEBDAV_URL) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <div className="text-center space-y-6 max-w-md p-8 rounded-2xl bg-card border shadow-xl">
          <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto text-primary">
            <Cloud className="h-10 w-10" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Welcome to CloudDrive</h1>
            <p className="text-muted-foreground">
              Please configure your WebDAV credentials in the environment variables.
            </p>
          </div>
        </div>
      </div>
    );
  }

  try {
    const path = folderId ? decodeURIComponent(folderId) : '/';

    // Recursive function to get all files from all subdirectories
    async function getAllFilesRecursively(dirPath: string): Promise<any[]> {
      const items = await client.getDirectoryContents(dirPath) as any[];
      let allFiles: any[] = [];

      for (const item of items) {
        if (item.filename === dirPath) continue;
        allFiles.push(item);

        if (item.type === 'directory') {
          const subFiles = await getAllFilesRecursively(item.filename);
          allFiles = allFiles.concat(subFiles);
        }
      }

      return allFiles;
    }

    let files: FileItem[];

    // If searching, do recursive search from current folder
    if (search) {
      const allFiles = await getAllFilesRecursively(path);
      files = allFiles
        .filter((item: any) =>
          item.basename.toLowerCase().includes(search.toLowerCase())
        )
        .map((item: any) => ({
          ...item,
          id: item.filename,
        })) as FileItem[];
    } else {
      // Normal directory listing
      const directoryItems = await client.getDirectoryContents(path) as any[];
      files = directoryItems
        .filter((item: any) => item.filename !== path)
        .map((item: any) => ({
          ...item,
          id: item.filename,
        })) as FileItem[];
    }

    // Sorting Logic
    files.sort((a, b) => {
      let comparison = 0;
      switch (sort) {
        case 'name':
          comparison = a.basename.localeCompare(b.basename);
          break;
        case 'size':
          comparison = a.size - b.size;
          break;
        case 'date':
        case 'lastmod':
          const dateA = new Date(a.lastmod).getTime();
          const dateB = new Date(b.lastmod).getTime();
          comparison = dateA - dateB;
          break;
        default:
          comparison = 0;
      }
      return order === 'desc' ? -comparison : comparison;
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Breadcrumbs currentPath={path} />
            <span className="text-sm text-muted-foreground">
              {files.length} item{files.length !== 1 ? 's' : ''}
            </span>
          </div>
          <div className="flex gap-2 items-center">
            <CreateFolderButton currentPath={path} />
            <UploadButton currentPath={path} />
          </div>
        </div>
        <FileBrowserClient
          initialData={files}
          currentPath={path}
          sort={sort}
          order={order}
          search={search || ''}
        />
      </div>
    );
  } catch (error) {
    console.error(error);
    return (
      <div className="p-6 text-center text-red-500">
        Failed to load files. Please check your WebDAV configuration.
      </div>
    );
  }
}
