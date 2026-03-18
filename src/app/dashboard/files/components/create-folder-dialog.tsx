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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FolderPlus } from 'lucide-react';

interface CreateFolderDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreateFolder: (name: string, color: string) => Promise<void>;
}

const FOLDER_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
    '#f97316', '#eab308', '#22c55e', '#06b6d4',
    '#3b82f6', '#64748b',
];

export function CreateFolderDialog({ open, onOpenChange, onCreateFolder }: CreateFolderDialogProps) {
    const [name, setName] = useState('');
    const [color, setColor] = useState(FOLDER_COLORS[0]);
    const [loading, setLoading] = useState(false);

    const handleCreate = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            await onCreateFolder(name.trim(), color);
            setName('');
            setColor(FOLDER_COLORS[0]);
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FolderPlus className="h-5 w-5" />
                        New Folder
                    </DialogTitle>
                    <DialogDescription>Create a new folder to organize your files.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="folder-name">Folder Name</Label>
                        <Input
                            id="folder-name"
                            placeholder="Enter folder name..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                            autoFocus
                        />
                    </div>
                    <div className="space-y-2">
                        <Label>Color</Label>
                        <div className="flex gap-2 flex-wrap">
                            {FOLDER_COLORS.map((c) => (
                                <button
                                    key={c}
                                    className={`h-8 w-8 rounded-full transition-all ${color === c ? 'ring-2 ring-offset-2 ring-primary scale-110' : 'hover:scale-105'}`}
                                    style={{ backgroundColor: c }}
                                    onClick={() => setColor(c)}
                                    type="button"
                                />
                            ))}
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={!name.trim() || loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Folder
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
