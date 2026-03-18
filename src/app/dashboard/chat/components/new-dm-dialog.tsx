'use client';

import { useState, useMemo } from 'react';
import type { Employee } from '@/lib/data';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Circle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface NewDmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employees: Employee[];
    currentUserId: string;
    onSelect: (employee: Employee) => void;
    presenceMap: Record<string, boolean>;
}

export function NewDmDialog({ open, onOpenChange, employees, currentUserId, onSelect, presenceMap }: NewDmDialogProps) {
    const [search, setSearch] = useState('');

    const filtered = useMemo(() => {
        const others = employees.filter(e =>
            e.id !== currentUserId &&
            (e.status === 'Active' || e.status === 'On Leave' || e.status === 'Sick' || !e.status || e.status === 'active' as any)
        );
        if (!search) return others;
        const q = search.toLowerCase();
        return others.filter(e =>
            e.name.toLowerCase().includes(q) ||
            e.departmentName?.toLowerCase().includes(q) ||
            e.jobTitle?.toLowerCase().includes(q) ||
            e.role?.toLowerCase().includes(q)
        );
    }, [employees, currentUserId, search]);

    return (
        <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setSearch(''); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>New Message</DialogTitle>
                    <DialogDescription>Search the staff directory to start a direct message.</DialogDescription>
                </DialogHeader>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search by name, department, or role..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="pl-9"
                        autoFocus
                    />
                </div>

                <ScrollArea className="max-h-80">
                    {filtered.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-8">No employees found</p>
                    ) : (
                        <div className="space-y-0.5">
                            {filtered.map(emp => (
                                <button
                                    key={emp.id}
                                    onClick={() => { onSelect(emp); onOpenChange(false); setSearch(''); }}
                                    className="w-full flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60 transition-colors text-left"
                                >
                                    <div className="relative">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={emp.avatar} />
                                            <AvatarFallback className="text-xs">{emp.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <Circle
                                            className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 ${presenceMap[emp.id] ? 'text-green-500 fill-green-500' : 'text-muted-foreground fill-muted-foreground/30'}`}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{emp.name}</p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {emp.jobTitle || emp.role} • {emp.departmentName}
                                        </p>
                                    </div>
                                    {presenceMap[emp.id] && (
                                        <Badge variant="secondary" className="text-[10px] shrink-0">Online</Badge>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}
