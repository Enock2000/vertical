'use client';

import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink, FileIcon } from 'lucide-react';
import type { DriveFile } from '@/lib/data';

interface FilePreviewDialogProps {
    file: DriveFile | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onPrevious?: () => void;
    onNext?: () => void;
    hasPrevious?: boolean;
    hasNext?: boolean;
    onDownload?: (file: DriveFile) => void;
}

export function FilePreviewDialog({ file, open, onOpenChange, onPrevious, onNext, hasPrevious, hasNext, onDownload }: FilePreviewDialogProps) {
    if (!file) {
        // Render empty dialog when closed to prevent layout crash
        return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="hidden"></DialogContent></Dialog>;
    }

    // Generate public Backblaze URL
    // Format: endpoint/bucketName/path
    const publicUrl = `https://s3.us-east-005.backblazeb2.com/oraninve/${file.b2Path}`;

    const renderPreview = () => {
        if (file.mimeType.startsWith('image/')) {
            return (
                <div className="flex-1 flex items-center justify-center overflow-hidden bg-black/5 rounded-md">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={publicUrl} alt={file.name} className="max-w-full max-h-[75vh] object-contain" />
                </div>
            );
        }

        if (file.mimeType.startsWith('video/')) {
            return (
                <div className="flex-1 flex items-center justify-center bg-black rounded-md overflow-hidden">
                    <video src={publicUrl} controls className="w-full max-h-[75vh]" autoPlay />
                </div>
            );
        }

        if (file.mimeType.startsWith('audio/')) {
            return (
                <div className="flex-1 flex flex-col items-center justify-center p-12 bg-muted/30 rounded-md">
                    <FileIcon className="h-24 w-24 text-muted-foreground mb-8" />
                    <audio src={publicUrl} controls className="w-full max-w-md" autoPlay />
                </div>
            );
        }

        if (file.mimeType === 'application/pdf') {
            return (
                <div className="flex-1 w-full h-[75vh] rounded-md overflow-hidden border">
                    <iframe src={publicUrl} className="w-full h-full border-0" title={file.name} />
                </div>
            );
        }

        // Unsupported files
        return (
            <div className="flex-1 flex flex-col items-center justify-center py-20 bg-muted/30 rounded-md border text-center px-4">
                <FileIcon className="h-20 w-20 text-muted-foreground mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Preview Available</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    This file type ({file.mimeType || 'unknown'}) cannot be previewed within the browser. 
                    Please download the file to view its contents.
                </p>
                <Button onClick={() => onDownload?.(file)}>
                    <Download className="h-4 w-4 mr-2" /> Download File
                </Button>
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl w-[90vw] max-h-[90vh] flex flex-col p-4 sm:p-6">
                <DialogHeader className="flex-row items-start justify-between space-y-0 pb-4 pr-6 border-b shrink-0">
                    <div className="flex flex-col gap-1 pr-4 min-w-0">
                        <div className="flex items-center gap-3">
                            <DialogTitle className="truncate text-lg">{file.name}</DialogTitle>
                            <div className="flex items-center gap-1 shrink-0 ml-2">
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={onPrevious} disabled={!hasPrevious} title="Previous File (Left Arrow)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                </Button>
                                <Button variant="outline" size="icon" className="h-7 w-7" onClick={onNext} disabled={!hasNext} title="Next File (Right Arrow)">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                                </Button>
                            </div>
                        </div>
                        <DialogDescription className="truncate mt-1">
                            {file.mimeType || 'Unknown File'} • {(file.size / 1024 / 1024).toFixed(2)} MB • Uploaded by {file.uploadedByName}
                        </DialogDescription>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="default" size="sm" onClick={() => onDownload?.(file)}>
                            <Download className="h-4 w-4 mr-2" /> Download
                        </Button>
                    </div>
                </DialogHeader>
                
                <div className="flex-1 overflow-hidden min-h-0 pt-4 flex flex-col">
                    {renderPreview()}
                </div>
            </DialogContent>
        </Dialog>
    );
}
