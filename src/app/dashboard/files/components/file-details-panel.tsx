'use client';

import type { DriveFile } from '@/lib/data';
import { X, Download, Star, Trash2, Share2, FileText, Image, Film, Music, FileSpreadsheet, FileCode, File as FileIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface FileDetailsPanelProps {
    file: DriveFile | null;
    onClose: () => void;
    onDownload: (file: DriveFile) => void;
    onStar: (file: DriveFile) => void;
    onDelete: (file: DriveFile) => void;
    onShare: (file: DriveFile) => void;
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <Image className="h-10 w-10 text-pink-500" />;
    if (mimeType.startsWith('video/')) return <Film className="h-10 w-10 text-purple-500" />;
    if (mimeType.startsWith('audio/')) return <Music className="h-10 w-10 text-green-500" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || mimeType.includes('excel')) return <FileSpreadsheet className="h-10 w-10 text-emerald-500" />;
    if (mimeType.includes('pdf')) return <FileText className="h-10 w-10 text-red-500" />;
    if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('html') || mimeType.includes('css')) return <FileCode className="h-10 w-10 text-yellow-500" />;
    return <FileIcon className="h-10 w-10 text-blue-500" />;
};

const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export function FileDetailsPanel({ file, onClose, onDownload, onStar, onDelete, onShare }: FileDetailsPanelProps) {
    if (!file) return null;

    return (
        <div className="w-80 border-l bg-background h-full flex flex-col animate-in slide-in-from-right-5 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-sm truncate flex-1">Details</h3>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
                    <X className="h-4 w-4" />
                </Button>
            </div>

            {/* Preview */}
            <div className="p-6 flex flex-col items-center border-b bg-muted/30">
                {file.mimeType.startsWith('image/') ? (
                    <div className="w-full h-40 rounded-lg overflow-hidden bg-background border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={file.thumbnailUrl || file.b2Path} alt={file.name} className="w-full h-full object-contain" />
                    </div>
                ) : (
                    <div className="w-20 h-20 rounded-xl bg-background border flex items-center justify-center">
                        {getFileIcon(file.mimeType)}
                    </div>
                )}
                <p className="mt-3 text-sm font-medium text-center break-all">{file.name}</p>
                <Badge variant="secondary" className="mt-1 text-xs">{file.mimeType.split('/')[1]?.toUpperCase() || 'FILE'}</Badge>
            </div>

            {/* Details */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                <DetailRow label="Size" value={formatSize(file.size)} />
                <DetailRow label="Uploaded by" value={file.uploadedByName} />
                <DetailRow label="Created" value={formatDate(file.createdAt)} />
                <DetailRow label="Modified" value={formatDate(file.updatedAt)} />
                <DetailRow label="Type" value={file.mimeType} />
                {file.shared && (
                    <DetailRow label="Shared with" value={`${file.sharedWith?.length || 0} people`} />
                )}
                {file.description && <DetailRow label="Description" value={file.description} />}
            </div>

            <Separator />

            {/* Actions */}
            <div className="p-3 flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => onDownload(file)}>
                    <Download className="h-3.5 w-3.5 mr-1.5" /> Download
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onStar(file)}>
                    <Star className={`h-3.5 w-3.5 ${file.starred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onShare(file)}>
                    <Share2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => onDelete(file)}>
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        </div>
    );
}

function DetailRow({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm break-all">{value}</p>
        </div>
    );
}
