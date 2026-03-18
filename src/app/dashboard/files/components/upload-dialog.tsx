'use client';

import { useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, X, FileIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UploadDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpload: (files: File[]) => Promise<void>;
}

type FileUploadStatus = 'pending' | 'uploading' | 'done' | 'error';

interface FileEntry {
    file: File;
    status: FileUploadStatus;
    progress: number;
}

export function UploadDialog({ open, onOpenChange, onUpload }: UploadDialogProps) {
    const [fileEntries, setFileEntries] = useState<FileEntry[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploading, setUploading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const entries: FileEntry[] = Array.from(newFiles).map((file) => ({
            file,
            status: 'pending' as FileUploadStatus,
            progress: 0,
        }));
        setFileEntries((prev) => [...prev, ...entries]);
    }, []);

    const removeFile = (index: number) => {
        setFileEntries((prev) => prev.filter((_, i) => i !== index));
    };

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files.length > 0) {
                addFiles(e.dataTransfer.files);
            }
        },
        [addFiles]
    );

    const handleUpload = async () => {
        if (fileEntries.length === 0) return;
        setUploading(true);

        // Mark all as uploading
        setFileEntries((prev) =>
            prev.map((e) => ({ ...e, status: 'uploading' as FileUploadStatus, progress: 50 }))
        );

        try {
            const files = fileEntries.map((e) => e.file);
            await onUpload(files);
            setFileEntries((prev) =>
                prev.map((e) => ({ ...e, status: 'done' as FileUploadStatus, progress: 100 }))
            );
            setTimeout(() => {
                setFileEntries([]);
                onOpenChange(false);
            }, 1000);
        } catch {
            setFileEntries((prev) =>
                prev.map((e) => ({ ...e, status: 'error' as FileUploadStatus }))
            );
        } finally {
            setUploading(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!uploading) { onOpenChange(v); setFileEntries([]); } }}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Upload className="h-5 w-5" />
                        Upload Files
                    </DialogTitle>
                    <DialogDescription>
                        Drag and drop files or click to browse. Max 50MB per file.
                    </DialogDescription>
                </DialogHeader>

                {/* Drop zone */}
                <div
                    className={cn(
                        'border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer',
                        isDragging
                            ? 'border-primary bg-primary/5 scale-[1.02]'
                            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                    )}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                            if (e.target.files) addFiles(e.target.files);
                            e.target.value = '';
                        }}
                    />
                    <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">
                        {isDragging ? 'Drop files here...' : 'Click or drag files here'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Supports any file type up to 50MB
                    </p>
                </div>

                {/* File list */}
                {fileEntries.length > 0 && (
                    <div className="max-h-60 overflow-y-auto space-y-2">
                        {fileEntries.map((entry, index) => (
                            <div
                                key={`${entry.file.name}-${index}`}
                                className="flex items-center gap-3 p-2 rounded-lg bg-muted/50"
                            >
                                <FileIcon className="h-5 w-5 text-muted-foreground shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{entry.file.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {formatSize(entry.file.size)}
                                    </p>
                                    {entry.status === 'uploading' && (
                                        <Progress value={entry.progress} className="h-1 mt-1" />
                                    )}
                                </div>
                                {entry.status === 'pending' && (
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                )}
                                {entry.status === 'uploading' && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                                {entry.status === 'done' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                                {entry.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive" />}
                            </div>
                        ))}
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center">
                    <p className="text-xs text-muted-foreground">
                        {fileEntries.length} file{fileEntries.length !== 1 ? 's' : ''} selected
                    </p>
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={() => { onOpenChange(false); setFileEntries([]); }} disabled={uploading}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpload} disabled={fileEntries.length === 0 || uploading}>
                            {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Upload {fileEntries.length > 0 ? `(${fileEntries.length})` : ''}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
