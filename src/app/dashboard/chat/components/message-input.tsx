'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Paperclip, Send, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MessageInputProps {
    onSend: (content: string, type: 'text' | 'file', file?: File) => Promise<void>;
    disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
    const [content, setContent] = useState('');
    const [sending, setSending] = useState(false);
    const [attachedFile, setAttachedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = useCallback(async () => {
        if (sending) return;

        if (attachedFile) {
            setSending(true);
            try {
                await onSend(attachedFile.name, 'file', attachedFile);
                setAttachedFile(null);
            } finally {
                setSending(false);
            }
            return;
        }

        const text = content.trim();
        if (!text) return;

        setSending(true);
        try {
            await onSend(text, 'text');
            setContent('');
        } finally {
            setSending(false);
        }
    }, [content, attachedFile, onSend, sending]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setAttachedFile(file);
        }
        e.target.value = '';
    };

    const formatSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className="border-t p-3">
            {/* Attached file preview */}
            {attachedFile && (
                <div className="mb-2 flex items-center gap-2 px-3 py-2 bg-muted/50 rounded-lg">
                    <Paperclip className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{attachedFile.name}</p>
                        <p className="text-xs text-muted-foreground">{formatSize(attachedFile.size)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setAttachedFile(null)}>
                        <X className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}

            <div className="flex items-end gap-2">
                <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={disabled || sending}
                >
                    <Paperclip className="h-4 w-4" />
                </Button>

                <Textarea
                    placeholder="Type a message..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className="min-h-[36px] max-h-[120px] resize-none text-sm"
                    disabled={disabled || sending}
                />

                <Button
                    size="icon"
                    className="h-9 w-9 shrink-0"
                    onClick={handleSend}
                    disabled={disabled || sending || (!content.trim() && !attachedFile)}
                >
                    {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
            </div>
        </div>
    );
}
