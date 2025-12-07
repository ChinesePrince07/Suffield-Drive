import { FileItem } from '@/lib/types';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { FileText, Folder, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';
import { memo } from 'react';

interface FileCardProps {
    item: FileItem;
    selected?: boolean;
}

export const FileCard = memo(function FileCard({ item, selected }: FileCardProps) {
    const isFolder = item.type === 'directory';
    const isImage = item.mime?.startsWith('image/');

    const Icon = isFolder ? Folder : isImage ? ImageIcon : FileText;

    return (
        <Card className={`
            hover:shadow-md transition-all cursor-pointer group glass-card border-none 
            ${selected ? 'bg-primary/10 ring-2 ring-primary shadow-md' : 'bg-card'}
        `}>
            <CardContent className="p-4 flex flex-col items-center justify-center h-40 relative overflow-hidden">
                <Icon className={`h-16 w-16 ${isFolder ? 'text-blue-500' : 'text-gray-400'}`} />
            </CardContent>
            <CardHeader className={`p-3 border-t ${selected ? 'bg-primary/5' : 'bg-muted/50'}`}>
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium truncate w-full" title={item.basename}>{item.basename}</p>
                </div>
                <p className="text-xs text-muted-foreground">
                    {item.lastmod ? format(new Date(item.lastmod), 'MMM d, yyyy') : 'Unknown date'}
                </p>
            </CardHeader>
        </Card>
    );
});

