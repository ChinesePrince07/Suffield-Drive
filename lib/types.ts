export interface FileItem {
    id: string;
    filename: string;
    basename: string;
    lastmod: string;
    size: number;
    type: 'directory' | 'file';
    mime?: string;
    etag?: string;
    childCount?: number;
}

