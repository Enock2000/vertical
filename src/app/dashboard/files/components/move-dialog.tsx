'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, FolderIcon, ChevronRight } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DriveFolder } from '@/lib/data';

interface MoveDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    folders: DriveFolder[];
    currentFolderId: string | null;
    onMove: (targetFolderId: string | null) => Promise<void>;
    title?: string;
}

export function MoveDialog({ open, onOpenChange, folders, currentFolderId, onMove, title = 'Move to...' }: MoveDialogProps) {
    const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleMove = async () => {
        setLoading(true);
        try {
            await onMove(selectedFolderId);
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    // Build folder tree
    const rootFolders = folders.filter((f) => f.parentId === null);
    const getChildren = (parentId: string) => folders.filter((f) => f.parentId === parentId);

    const renderFolder = (folder: DriveFolder, depth: number = 0) => {
        const children = getChildren(folder.id);
        const isSelected = selectedFolderId === folder.id;
        const isCurrent = currentFolderId === folder.id;

        return (
            <div key={folder.id}>
                <button
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${isSelected ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'} ${isCurrent ? 'opacity-50' : ''}`}
                    style={{ paddingLeft: `${12 + depth * 20}px` }}
                    onClick={() => !isCurrent && setSelectedFolderId(folder.id)}
                    disabled={isCurrent}
                >
                    {children.length > 0 && <ChevronRight className="h-3 w-3" />}
                    <FolderIcon className="h-4 w-4" style={{ color: folder.color || '#6366f1' }} />
                    <span className="truncate">{folder.name}</span>
                    {isCurrent && <span className="text-xs text-muted-foreground ml-auto">(current)</span>}
                </button>
                {children.map((child) => renderFolder(child, depth + 1))}
            </div>
        );
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>Select a folder to move the selected items to.</DialogDescription>
                </DialogHeader>

                <ScrollArea className="h-64 border rounded-lg">
                    <div className="p-2">
                        {/* Root option */}
                        <button
                            className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors ${selectedFolderId === null ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}
                            onClick={() => setSelectedFolderId(null)}
                        >
                            <FolderIcon className="h-4 w-4 text-muted-foreground" />
                            <span>My Drive (Root)</span>
                        </button>
                        {rootFolders.map((f) => renderFolder(f))}
                        {folders.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center py-8">No folders yet.</p>
                        )}
                    </div>
                </ScrollArea>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleMove} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Move Here
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
