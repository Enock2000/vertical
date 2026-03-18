'use client';

import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@/lib/data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FileText, Check, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface MessageViewProps {
    messages: ChatMessage[];
    currentUserId: string;
    participantCount: number;
}

export function MessageView({ messages, currentUserId, participantCount }: MessageViewProps) {
    const bottomRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length]);

    const formatTime = (iso: string) => {
        return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (d.toDateString() === today.toDateString()) return 'Today';
        if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });
    };

    // Group messages by date
    const groupedMessages: { date: string; messages: ChatMessage[] }[] = [];
    let lastDate = '';
    for (const msg of messages) {
        const dateStr = new Date(msg.createdAt).toDateString();
        if (dateStr !== lastDate) {
            lastDate = dateStr;
            groupedMessages.push({ date: msg.createdAt, messages: [msg] });
        } else {
            groupedMessages[groupedMessages.length - 1].messages.push(msg);
        }
    }

    const getReadStatus = (msg: ChatMessage) => {
        if (msg.senderId !== currentUserId) return null;
        const readCount = Object.keys(msg.readBy || {}).filter(id => id !== currentUserId).length;
        if (readCount >= participantCount - 1 && participantCount > 1) return 'read';
        return 'sent';
    };

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                    <p className="text-sm">No messages yet</p>
                    <p className="text-xs mt-1">Send a message to start the conversation</p>
                </div>
            </div>
        );
    }

    return (
        <ScrollArea className="flex-1 px-4">
            <div className="py-4 space-y-4">
                {groupedMessages.map((group, gi) => (
                    <div key={gi}>
                        {/* Date separator */}
                        <div className="flex items-center gap-3 my-4">
                            <div className="flex-1 h-px bg-border" />
                            <span className="text-xs text-muted-foreground font-medium px-2">{formatDate(group.date)}</span>
                            <div className="flex-1 h-px bg-border" />
                        </div>

                        {/* Messages */}
                        {group.messages.map((msg) => {
                            const isOwn = msg.senderId === currentUserId;
                            const readStatus = getReadStatus(msg);

                            return (
                                <div
                                    key={msg.id}
                                    className={cn('flex gap-2.5 mb-3', isOwn ? 'flex-row-reverse' : 'flex-row')}
                                >
                                    {!isOwn && (
                                        <Avatar className="h-7 w-7 mt-0.5 shrink-0">
                                            <AvatarImage src={msg.senderAvatar} />
                                            <AvatarFallback className="text-[10px]">{msg.senderName.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn('max-w-[70%]', isOwn ? 'items-end' : 'items-start')}>
                                        {!isOwn && (
                                            <p className="text-[11px] text-muted-foreground mb-0.5 ml-1">{msg.senderName}</p>
                                        )}
                                        <div
                                            className={cn(
                                                'rounded-2xl px-3.5 py-2 text-sm',
                                                isOwn
                                                    ? 'bg-primary text-primary-foreground rounded-br-md'
                                                    : 'bg-muted rounded-bl-md'
                                            )}
                                        >
                                            {msg.type === 'file' ? (
                                                <a
                                                    href={msg.fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className={cn(
                                                        'flex items-center gap-2 underline',
                                                        isOwn ? 'text-primary-foreground' : 'text-primary'
                                                    )}
                                                >
                                                    <FileText className="h-4 w-4 shrink-0" />
                                                    <span className="truncate">{msg.fileName || 'File'}</span>
                                                </a>
                                            ) : (
                                                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                                            )}
                                        </div>
                                        <div className={cn('flex items-center gap-1 mt-0.5', isOwn ? 'justify-end mr-1' : 'ml-1')}>
                                            <span className="text-[10px] text-muted-foreground">{formatTime(msg.createdAt)}</span>
                                            {readStatus === 'read' && <CheckCheck className="h-3 w-3 text-blue-500" />}
                                            {readStatus === 'sent' && <Check className="h-3 w-3 text-muted-foreground" />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
                <div ref={bottomRef} />
            </div>
        </ScrollArea>
    );
}
