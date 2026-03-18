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
import { Loader2, Share2, Copy, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import type { Employee, DriveFile } from '@/lib/data';

interface ShareDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    file: DriveFile | null;
    employees: Employee[];
    onShare: (fileId: string, employeeIds: string[]) => Promise<void>;
}

export function ShareDialog({ open, onOpenChange, file, employees, onShare }: ShareDialogProps) {
    const [selectedIds, setSelectedIds] = useState<string[]>(file?.sharedWith || []);
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);

    const toggleEmployee = (id: string) => {
        setSelectedIds((prev) =>
            prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
        );
    };

    const handleShare = async () => {
        if (!file) return;
        setLoading(true);
        try {
            await onShare(file.id, selectedIds);
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        if (file) {
            navigator.clipboard.writeText(`${window.location.origin}/api/files/download?path=${encodeURIComponent(file.b2Path)}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!file) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Share2 className="h-5 w-5" />
                        Share &quot;{file.name}&quot;
                    </DialogTitle>
                    <DialogDescription>
                        Select employees to share this file with, or copy a direct link.
                    </DialogDescription>
                </DialogHeader>

                {/* Copy link */}
                <div className="flex gap-2">
                    <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm truncate font-mono">
                        {file.name}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleCopyLink}>
                        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                </div>

                {/* Employee list */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">Share with employees</p>
                    <ScrollArea className="h-52 border rounded-lg">
                        <div className="p-2 space-y-1">
                            {employees.filter((e) => e.status === 'Active').map((emp) => (
                                <label
                                    key={emp.id}
                                    className="flex items-center gap-3 p-2 rounded-md hover:bg-muted cursor-pointer"
                                >
                                    <Checkbox
                                        checked={selectedIds.includes(emp.id)}
                                        onCheckedChange={() => toggleEmployee(emp.id)}
                                    />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{emp.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{emp.email}</p>
                                    </div>
                                </label>
                            ))}
                            {employees.filter((e) => e.status === 'Active').length === 0 && (
                                <p className="text-sm text-muted-foreground text-center py-4">No employees found.</p>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleShare} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Share
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
