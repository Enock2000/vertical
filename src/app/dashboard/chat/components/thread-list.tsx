'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import type { ChatThread, ChatMessage, Employee } from '@/lib/data';
import { cn } from '@/lib/utils';
import { Hash, User, Users, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ThreadListProps {
    threads: ChatThread[];
    employees: Employee[];
    currentUserId: string;
    activeThreadId: string | null;
    onSelectThread: (thread: ChatThread) => void;
    unreadCounts: Record<string, number>;
}

export function ThreadList({ threads, employees, currentUserId, activeThreadId, onSelectThread, unreadCounts }: ThreadListProps) {
    const [searchQuery, setSearchQuery] = useState('');

    const employeeMap = useMemo(() => {
        const map: Record<string, Employee> = {};
        employees.forEach(e => { map[e.id] = e; });
        return map;
    }, [employees]);

    const getThreadDisplayName = useCallback((thread: ChatThread) => {
        if (thread.type === 'channel') return thread.name || 'Unnamed Channel';
        // For DMs, show the other person's name
        const otherIds = Object.keys(thread.participants || {}).filter(id => id !== currentUserId);
        if (otherIds.length === 0) return 'Unknown';
        const other = employeeMap[otherIds[0]];
        return other?.name || 'Unknown User';
    }, [currentUserId, employeeMap]);

    const getThreadAvatar = useCallback((thread: ChatThread) => {
        if (thread.type === 'channel') return null;
        const otherIds = Object.keys(thread.participants || {}).filter(id => id !== currentUserId);
        if (otherIds.length === 0) return null;
        return employeeMap[otherIds[0]]?.avatar || null;
    }, [currentUserId, employeeMap]);

    const getThreadDepartmentName = useCallback((thread: ChatThread) => {
        if (thread.type === 'channel') return null;
        const otherIds = Object.keys(thread.participants || {}).filter(id => id !== currentUserId);
        if (otherIds.length === 0) return null;
        const other = employeeMap[otherIds[0]];
        if (!other) return null;
        const parts = [];
        if (other.departmentName) parts.push(other.departmentName);
        if (other.branchName) parts.push(other.branchName);
        return parts.length > 0 ? parts.join(' - ') : null;
    }, [currentUserId, employeeMap]);

    const sortedThreads = useMemo(() => {
        return [...threads]
            .filter(t => {
                if (!searchQuery) return true;
                const name = getThreadDisplayName(t).toLowerCase();
                return name.includes(searchQuery.toLowerCase());
            })
            .sort((a, b) => {
                const aTime = a.lastMessageAt || a.createdAt;
                const bTime = b.lastMessageAt || b.createdAt;
                return new Date(bTime).getTime() - new Date(aTime).getTime();
            });
    }, [threads, searchQuery, getThreadDisplayName]);

    const formatTime = (iso: string) => {
        const d = new Date(iso);
        const now = new Date();
        const diff = now.getTime() - d.getTime();
        if (diff < 60000) return 'now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m`;
        if (diff < 86400000) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    return (
        <div className="flex flex-col h-full">
            {/* Search */}
            <div className="p-3 border-b">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-9 h-9"
                    />
                    {searchQuery && (
                        <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                            <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                    )}
                </div>
            </div>

            {/* Thread list */}
            <ScrollArea className="flex-1">
                {sortedThreads.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                        {searchQuery ? 'No conversations found' : 'No conversations yet'}
                    </div>
                ) : (
                    <div className="py-1">
                        {sortedThreads.map(thread => {
                            const unread = unreadCounts[thread.id] || 0;
                            const isActive = activeThreadId === thread.id;
                            return (
                                <button
                                    key={thread.id}
                                    onClick={() => onSelectThread(thread)}
                                    className={cn(
                                        'w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors',
                                        isActive && 'bg-primary/5 border-l-2 border-primary',
                                    )}
                                >
                                    {thread.type === 'channel' ? (
                                        <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                            <Hash className="h-4 w-4 text-primary" />
                                        </div>
                                    ) : (
                                        <Avatar className="h-9 w-9 shrink-0">
                                            <AvatarImage src={getThreadAvatar(thread) || undefined} />
                                            <AvatarFallback className="text-xs">{getThreadDisplayName(thread).charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={cn('text-sm truncate', unread > 0 ? 'font-semibold' : 'font-medium')}>
                                                {getThreadDisplayName(thread)}
                                                {getThreadDepartmentName(thread) && (
                                                    <span className="text-xs font-normal text-muted-foreground ml-1.5">
                                                        ({getThreadDepartmentName(thread)})
                                                    </span>
                                                )}
                                            </span>
                                            {thread.lastMessageAt && (
                                                <span className="text-xs text-muted-foreground shrink-0">
                                                    {formatTime(thread.lastMessageAt)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={cn('text-xs truncate', unread > 0 ? 'text-foreground' : 'text-muted-foreground')}>
                                                {thread.lastMessage || 'No messages yet'}
                                            </p>
                                            {unread > 0 && (
                                                <Badge variant="default" className="h-5 min-w-[20px] flex items-center justify-center text-[10px] px-1.5 shrink-0">
                                                    {unread > 99 ? '99+' : unread}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
