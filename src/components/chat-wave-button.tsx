'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ref as dbRef, onValue, push, set, update, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/auth-provider';
import type { ChatThread, ChatMessage, Employee } from '@/lib/data';
import { ThreadList } from '@/app/dashboard/chat/components/thread-list';
import { MessageView } from '@/app/dashboard/chat/components/message-view';
import { MessageInput } from '@/app/dashboard/chat/components/message-input';
import { NewDmDialog } from '@/app/dashboard/chat/components/new-dm-dialog';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
    Plus, Hash, Maximize2, Minimize2, X, ArrowLeft,
    MessageSquare,
} from 'lucide-react';

// ─── Chat Wave SVG Icon ───
function ChatWaveIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
            <defs>
                <linearGradient id="cw-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop offset="100%" stopColor="#818cf8" />
                </linearGradient>
            </defs>
            <path d="M8 12C8 9.79 9.79 8 12 8H36C38.21 8 40 9.79 40 12V28C40 30.21 38.21 32 36 32H18L12 38V32H12C9.79 32 8 30.21 8 28V12Z" fill="url(#cw-grad)" />
            <path d="M15 17C17 15 19 19 21 17C23 15 25 19 27 17C29 15 31 19 33 17" stroke="white" strokeWidth="2" strokeLinecap="round" />
            <path d="M15 23C17 21 19 25 21 23C23 21 25 25 27 23C29 21 31 25 33 23" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
        </svg>
    );
}

interface ChatWaveFloatingButtonProps {
    chatPath: string;
}

export function ChatWaveFloatingButton({ chatPath }: ChatWaveFloatingButtonProps) {
    const router = useRouter();
    const { employee, companyId } = useAuth();
    const { toast } = useToast();

    const [isOpen, setIsOpen] = useState(false);

    // Chat data
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
    const [showNewDm, setShowNewDm] = useState(false);

    useEffect(() => {
        if (!companyId || !isOpen) return;
        const empRef = dbRef(db, `employees`);
        const unsub = onValue(empRef, snap => {
            if (snap.val()) {
                const all = Object.values(snap.val()) as Employee[];
                setEmployees(all.filter(e => e.companyId === companyId));
            }
        });
        return () => off(empRef);
    }, [companyId, isOpen]);

    // Load threads
    useEffect(() => {
        if (!companyId || !employee || !isOpen) return;
        const threadsRef = dbRef(db, `companies/${companyId}/chat/threads`);
        const unsub = onValue(threadsRef, snap => {
            const data = snap.val();
            if (data) {
                const all: ChatThread[] = Object.values(data);
                setThreads(all.filter(t => t.participants?.[employee.id]));
            } else setThreads([]);
        });
        return () => off(threadsRef);
    }, [companyId, employee, isOpen]);

    // Load messages for active thread
    useEffect(() => {
        if (!companyId || !activeThread) { setMessages([]); return; }
        const msgsRef = dbRef(db, `companies/${companyId}/chat/messages/${activeThread.id}`);
        const unsub = onValue(msgsRef, snap => {
            const data = snap.val();
            if (data) {
                const msgs: ChatMessage[] = Object.values(data);
                msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                setMessages(msgs);
                // Mark as read
                msgs.forEach(msg => {
                    if (msg.senderId !== employee?.id && (!msg.readBy || !msg.readBy[employee!.id])) {
                        update(dbRef(db, `companies/${companyId}/chat/messages/${activeThread.id}/${msg.id}/readBy/${employee!.id}`), { '.sv': 'timestamp' });
                    }
                });
            } else setMessages([]);
        });
        return () => off(msgsRef);
    }, [companyId, activeThread, employee]);

    // Presence
    useEffect(() => {
        if (!companyId || !isOpen) return;
        const presRef = dbRef(db, `companies/${companyId}/chat/presence`);
        const unsub = onValue(presRef, snap => {
            const data = snap.val();
            if (data) {
                const map: Record<string, boolean> = {};
                for (const [uid, val] of Object.entries(data)) map[uid] = (val as any)?.online || false;
                setPresenceMap(map);
            }
        });
        return () => off(presRef);
    }, [companyId, isOpen]);

    const employeeMap = useMemo(() => {
        const map: Record<string, Employee> = {};
        employees.forEach(e => { map[e.id] = e; });
        return map;
    }, [employees]);

    const getThreadName = useCallback((thread: ChatThread) => {
        if (thread.type === 'channel') return thread.name || 'Unnamed Channel';
        const otherId = Object.keys(thread.participants || {}).find(id => id !== employee?.id);
        return otherId ? employeeMap[otherId]?.name || 'Unknown' : 'Unknown';
    }, [employee, employeeMap]);

    // Handlers
    const handleStartDm = useCallback(async (emp: Employee) => {
        if (!companyId || !employee) return;
        const existing = threads.find(t => t.type === 'dm' && t.participants?.[employee.id] && t.participants?.[emp.id] && Object.keys(t.participants).length === 2);
        if (existing) { setActiveThread(existing); return; }
        const threadsRef = dbRef(db, `companies/${companyId}/chat/threads`);
        const newRef = push(threadsRef);
        const thread: ChatThread = { id: newRef.key!, companyId, type: 'dm', participants: { [employee.id]: true, [emp.id]: true }, createdBy: employee.id, createdAt: new Date().toISOString() };
        await set(newRef, thread);
        setActiveThread(thread);
    }, [companyId, employee, threads]);

    const handleSendMessage = useCallback(async (content: string, type: 'text' | 'file', file?: File) => {
        if (!companyId || !employee || !activeThread) return;
        let fileUrl: string | undefined, fileName: string | undefined, fileSize: number | undefined;
        if (type === 'file' && file) {
            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `chat/${companyId}/${Date.now()}_${cleanName}`;
            const presignRes = await fetch('/api/files/presign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: file.name, fileType: file.type || 'application/octet-stream', filePath }) });
            const presignData = await presignRes.json();
            if (!presignRes.ok) { toast({ variant: 'destructive', title: 'Upload failed', description: presignData.error }); return; }
            const uploadRes = await fetch(presignData.signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } });
            if (!uploadRes.ok) { toast({ variant: 'destructive', title: 'Upload failed' }); return; }
            fileUrl = presignData.publicUrl; fileName = file.name; fileSize = file.size;
        }
        const msgsRef = dbRef(db, `companies/${companyId}/chat/messages/${activeThread.id}`);
        const newMsgRef = push(msgsRef);
        const msg: ChatMessage = { id: newMsgRef.key!, threadId: activeThread.id, senderId: employee.id, senderName: employee.name, senderAvatar: employee.avatar, content: type === 'file' ? (fileName || 'File') : content, type, ...(fileUrl && { fileUrl }), ...(fileName && { fileName }), ...(fileSize && { fileSize }), createdAt: new Date().toISOString(), readBy: { [employee.id]: new Date().toISOString() } };
        await set(newMsgRef, msg);
        await update(dbRef(db, `companies/${companyId}/chat/threads/${activeThread.id}`), { lastMessage: type === 'file' ? `📎 ${fileName}` : content, lastMessageAt: new Date().toISOString(), lastMessageBy: employee.id });
    }, [companyId, employee, activeThread, toast]);

    return (
        <>
            {/* ─── Floating Button ─── */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    'fixed z-[100] flex items-center justify-center rounded-full shadow-lg select-none transition-all duration-300',
                    'bg-gradient-to-br from-violet-600 via-indigo-500 to-indigo-400',
                    'hover:shadow-xl hover:shadow-violet-500/25 hover:scale-105 active:scale-95',
                    'w-[52px] h-[52px]',
                    isOpen && 'rotate-90 opacity-0 pointer-events-none',
                )}
                style={{ left: 12, bottom: 24 }}
                title="Chat Wave"
            >
                <ChatWaveIcon className="h-8 w-8 drop-shadow-sm" />
                {/* Pulse ring */}
                {!isOpen && (
                    <span className="absolute inset-0 rounded-full animate-ping bg-violet-400/20 pointer-events-none" style={{ animationDuration: '3s' }} />
                )}
            </button>

            {/* ─── Chat Widget ─── */}
            <div
                className={cn(
                    'fixed z-[100] flex flex-col bg-background border rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out',
                    isOpen
                        ? 'opacity-100 translate-y-0 scale-100'
                        : 'opacity-0 translate-y-4 scale-95 pointer-events-none',
                )}
                style={{
                    left: 12,
                    bottom: 24,
                    width: 380,
                    height: 520,
                    maxHeight: 'calc(100vh - 48px)',
                    maxWidth: 'calc(100vw - 24px)',
                }}
            >
                {/* Widget Header */}
                <div className="flex items-center gap-2 p-3 border-b bg-gradient-to-r from-violet-600 via-indigo-500 to-indigo-400 text-white">
                    {activeThread ? (
                        <>
                            <button onClick={() => setActiveThread(null)} className="p-1 hover:bg-white/20 rounded-md transition-colors">
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold truncate">{getThreadName(activeThread)}</p>
                                <p className="text-[10px] opacity-80">
                                    {activeThread.type === 'channel'
                                        ? `${Object.keys(activeThread.participants || {}).length} members`
                                        : (() => {
                                            const otherId = Object.keys(activeThread.participants || {}).find(id => id !== employee?.id);
                                            const otherInfo = employeeMap[otherId || ''];
                                            const isOnline = presenceMap[otherId || ''];
                                            const presenceText = isOnline ? 'Online' : 'Offline';
                                            const parts = [];
                                            if (otherInfo?.departmentName) parts.push(otherInfo.departmentName);
                                            if (otherInfo?.branchName) parts.push(otherInfo.branchName);
                                            const infoString = parts.length > 0 ? parts.join(' - ') : '';
                                            return infoString ? `${infoString} • ${presenceText}` : presenceText;
                                        })()
                                    }
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            <ChatWaveIcon className="h-7 w-7 shrink-0" />
                            <div className="flex-1">
                                <p className="text-sm font-bold">Chat Wave</p>
                                <p className="text-[10px] opacity-80">{threads.length} conversation{threads.length !== 1 ? 's' : ''}</p>
                            </div>
                        </>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-0.5">
                        <button
                            onClick={() => { setIsOpen(false); router.push(chatPath); }}
                            className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                            title="Open full screen"
                        >
                            <Maximize2 className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="p-1.5 hover:bg-white/20 rounded-md transition-colors"
                            title="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Widget Body */}
                <div className="flex-1 flex flex-col overflow-hidden">
                    {activeThread ? (
                        <>
                            <MessageView
                                messages={messages}
                                currentUserId={employee?.id || ''}
                                participantCount={Object.keys(activeThread.participants || {}).length}
                            />
                            <MessageInput onSend={handleSendMessage} />
                        </>
                    ) : (
                        <>
                            {/* Quick actions */}
                            <div className="p-2 border-b flex gap-1.5">
                                <Button variant="outline" size="sm" className="flex-1 text-xs h-8" onClick={() => setShowNewDm(true)}>
                                    <Plus className="h-3 w-3 mr-1" /> New Message
                                </Button>
                            </div>

                            {/* Thread list */}
                            <ThreadList
                                threads={threads}
                                employees={employees}
                                currentUserId={employee?.id || ''}
                                activeThreadId={null}
                                onSelectThread={setActiveThread}
                                unreadCounts={{}}
                            />
                        </>
                    )}
                </div>
            </div>

            {/* New DM Dialog */}
            <NewDmDialog
                open={showNewDm}
                onOpenChange={setShowNewDm}
                employees={employees}
                currentUserId={employee?.id || ''}
                onSelect={handleStartDm}
                presenceMap={presenceMap}
            />
        </>
    );
}

export { ChatWaveIcon };
