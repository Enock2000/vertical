'use client';

import { useState, useMemo } from 'react';
import type { Employee } from '@/lib/data';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, X, Hash, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NewChannelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees: Employee[];
    currentUserId: string;
    onCreate: (name: string, memberIds: string[]) => Promise<void>;
}

export function NewChannelDialog({ open, onOpenChange, employees, currentUserId, onCreate }: NewChannelDialogProps) {
    const [channelName, setChannelName] = useState('');
    const [search, setSearch] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [creating, setCreating] = useState(false);

    const filtered = useMemo(() => {
        const others = employees.filter(e => e.id !== currentUserId && (e.status === 'Active' || e.status === 'On Leave' || e.status === 'Sick' || !e.status || e.status === 'active' as any));
        if (!search) return others;
        const q = search.toLowerCase();
        return others.filter(e =>
            e.name.toLowerCase().includes(q) ||
            e.departmentName?.toLowerCase().includes(q)
        );
    }, [employees, currentUserId, search]);

    const toggleMember = (id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleCreate = async () => {
        if (!channelName.trim() || selectedIds.size === 0) return;
        setCreating(true);
        try {
            await onCreate(channelName.trim(), Array.from(selectedIds));
            setChannelName('');
            setSelectedIds(new Set());
            setSearch('');
            onOpenChange(false);
        } finally {
            setCreating(false);
        }
    };

    const reset = () => {
        setChannelName('');
        setSearch('');
        setSelectedIds(new Set());
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Hash className="h-5 w-5" /> New Channel
                    </DialogTitle>
                    <DialogDescription>Create a group channel for your team or department.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <Input
                        placeholder="Channel name (e.g. Marketing Team)"
                        value={channelName}
                        onChange={e => setChannelName(e.target.value)}
                    />

                    {/* Selected members */}
                    {selectedIds.size > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                            {Array.from(selectedIds).map(id => {
                                const emp = employees.find(e => e.id === id);
                                if (!emp) return null;
                                return (
                                    <Badge key={id} variant="secondary" className="gap-1 pr-1">
                                        {emp.name}
                                        <button onClick={() => toggleMember(id)}>
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                );
                            })}
                        </div>
                    )}

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search employees to add..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-9"
                        />
                    </div>

                    <ScrollArea className="max-h-52">
                        <div className="space-y-0.5">
                            {filtered.map(emp => (
                                <button
                                    key={emp.id}
                                    onClick={() => toggleMember(emp.id)}
                                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left ${
                                        selectedIds.has(emp.id) ? 'bg-primary/10' : 'hover:bg-muted/60'
                                    }`}
                                >
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={emp.avatar} />
                                        <AvatarFallback className="text-xs">{emp.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{emp.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">{emp.departmentName}</p>
                                    </div>
                                    {selectedIds.has(emp.id) && (
                                        <Badge variant="default" className="text-[10px]">Added</Badge>
                                    )}
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => { onOpenChange(false); reset(); }}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={!channelName.trim() || selectedIds.size === 0 || creating}>
                        {creating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Create Channel ({selectedIds.size} member{selectedIds.size !== 1 ? 's' : ''})
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
