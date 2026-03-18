'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { ref as dbRef, onValue, push, set, update, off } from 'firebase/database';
import { db } from '@/lib/firebase';
import { useAuth } from '@/app/auth-provider';
import type { ChatThread, ChatMessage, Employee, GlobalChatThread, FriendRequest, Connection, UserProfile } from '@/lib/data';
import { ThreadList } from '@/app/dashboard/chat/components/thread-list';
import { MessageView } from '@/app/dashboard/chat/components/message-view';
import { MessageInput } from '@/app/dashboard/chat/components/message-input';
import { NewDmDialog } from '@/app/dashboard/chat/components/new-dm-dialog';
import { NewChannelDialog } from '@/app/dashboard/chat/components/new-channel-dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
    MessageSquare, Plus, Hash, Users, Globe, Loader2,
    UserPlus, Search, Bell, Shield, Settings2,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export default function EmployeePortalChatPage() {
    const { employee, companyId, company } = useAuth();
    const { toast } = useToast();

    const [activeTab, setActiveTab] = useState<'company' | 'network'>('company');
    const [threads, setThreads] = useState<ChatThread[]>([]);
    const [activeThread, setActiveThread] = useState<ChatThread | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [presenceMap, setPresenceMap] = useState<Record<string, boolean>>({});
    const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

    const [globalThreads, setGlobalThreads] = useState<GlobalChatThread[]>([]);
    const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>([]);
    const [activeGlobalThread, setActiveGlobalThread] = useState<GlobalChatThread | null>(null);
    const [connections, setConnections] = useState<Connection[]>([]);
    const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

    const [showNewDm, setShowNewDm] = useState(false);
    const [showNewChannel, setShowNewChannel] = useState(false);
    const [showGlobalSearch, setShowGlobalSearch] = useState(false);
    const [showFriendRequests, setShowFriendRequests] = useState(false);
    const [showPrivacySettings, setShowPrivacySettings] = useState(false);
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!companyId) return;
        const empRef = dbRef(db, `employees`);
        const unsub = onValue(empRef, snap => {
            if (snap.val()) {
                const all = Object.values(snap.val()) as Employee[];
                setEmployees(all.filter(e => e.companyId === companyId));
            }
            setLoading(false);
        });
        return () => off(empRef);
    }, [companyId]);

    // ─── Load company chat threads ───
    useEffect(() => {
        if (!companyId || !employee) return;
        const threadsRef = dbRef(db, `companies/${companyId}/chat/threads`);
        const unsub = onValue(threadsRef, snap => {
            const data = snap.val();
            if (data) {
                const all: ChatThread[] = Object.values(data);
                setThreads(all.filter(t => t.participants?.[employee.id]));
            } else setThreads([]);
        });
        return () => off(threadsRef);
    }, [companyId, employee]);

    // ─── Load messages for active thread ───
    useEffect(() => {
        if (!companyId || !activeThread) { setMessages([]); return; }
        const msgsRef = dbRef(db, `companies/${companyId}/chat/messages/${activeThread.id}`);
        const unsub = onValue(msgsRef, snap => {
            const data = snap.val();
            if (data) {
                const msgs: ChatMessage[] = Object.values(data);
                msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
                setMessages(msgs);
                msgs.forEach(msg => {
                    if (msg.senderId !== employee?.id && (!msg.readBy || !msg.readBy[employee!.id])) {
                        update(dbRef(db, `companies/${companyId}/chat/messages/${activeThread.id}/${msg.id}/readBy/${employee!.id}`), { '.sv': 'timestamp' });
                    }
                });
            } else setMessages([]);
        });
        return () => off(msgsRef);
    }, [companyId, activeThread, employee]);

    // ─── Presence ───
    useEffect(() => {
        if (!companyId || !employee) return;
        const myPresRef = dbRef(db, `companies/${companyId}/chat/presence/${employee.id}`);
        set(myPresRef, { online: true, lastSeen: new Date().toISOString() });
        const presRef = dbRef(db, `companies/${companyId}/chat/presence`);
        const unsub = onValue(presRef, snap => {
            const data = snap.val();
            if (data) {
                const map: Record<string, boolean> = {};
                for (const [uid, val] of Object.entries(data)) map[uid] = (val as any)?.online || false;
                setPresenceMap(map);
            }
        });
        const handleUnload = () => set(myPresRef, { online: false, lastSeen: new Date().toISOString() });
        window.addEventListener('beforeunload', handleUnload);
        return () => { off(presRef); handleUnload(); window.removeEventListener('beforeunload', handleUnload); };
    }, [companyId, employee]);

    // ─── Global: Profile, connections, requests, threads ───
    useEffect(() => {
        if (!employee) return;
        const profRef = dbRef(db, `global/profiles/${employee.id}`);
        const unsub = onValue(profRef, snap => {
            const data = snap.val();
            if (data) setUserProfile(data);
            else if (company) {
                const profile: UserProfile = { userId: employee.id, name: employee.name, jobTitle: employee.jobTitle || employee.role, companyId: employee.companyId, companyName: company.name, avatar: employee.avatar, discoverable: true };
                set(profRef, profile);
                setUserProfile(profile);
            }
        });
        return () => off(profRef);
    }, [employee, company]);

    useEffect(() => {
        if (!employee) return;
        const connRef = dbRef(db, `global/connections/${employee.id}`);
        const unsub = onValue(connRef, snap => { setConnections(snap.val() ? Object.values(snap.val()) : []); });
        return () => off(connRef);
    }, [employee]);

    useEffect(() => {
        if (!employee) return;
        const frRef = dbRef(db, `global/friendRequests`);
        const unsub = onValue(frRef, snap => {
            const data = snap.val();
            if (data) {
                const all: FriendRequest[] = Object.values(data);
                setFriendRequests(all.filter(r => r.toUserId === employee.id || r.fromUserId === employee.id));
            } else setFriendRequests([]);
        });
        return () => off(frRef);
    }, [employee]);

    useEffect(() => {
        if (!employee) return;
        const gtRef = dbRef(db, `global/chat/threads`);
        const unsub = onValue(gtRef, snap => {
            const data = snap.val();
            if (data) { const all: GlobalChatThread[] = Object.values(data); setGlobalThreads(all.filter(t => t.participants?.[employee.id])); }
            else setGlobalThreads([]);
        });
        return () => off(gtRef);
    }, [employee]);

    useEffect(() => {
        if (!activeGlobalThread) { setGlobalMessages([]); return; }
        const msgsRef = dbRef(db, `global/chat/messages/${activeGlobalThread.id}`);
        const unsub = onValue(msgsRef, snap => {
            const data = snap.val();
            if (data) { const msgs: ChatMessage[] = Object.values(data); msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); setGlobalMessages(msgs); }
            else setGlobalMessages([]);
        });
        return () => off(msgsRef);
    }, [activeGlobalThread]);

    useEffect(() => {
        if (!showGlobalSearch) return;
        
        const empRef = dbRef(db, 'employees');
        const compRef = dbRef(db, 'companies');
        const profRef = dbRef(db, 'global/profiles');

        let employeesData: Record<string, Employee> = {};
        let companiesData: Record<string, any> = {};
        let profilesData: Record<string, UserProfile> = {};

        const updateAllProfiles = () => {
            const merged: UserProfile[] = [];
            for (const emp of Object.values(employeesData)) {
                // Skip inactive employees completely
                if (emp.status?.toLowerCase() === 'inactive') continue;
                
                const existing = profilesData[emp.id];
                if (existing) {
                    merged.push(existing);
                } else {
                    merged.push({
                        userId: emp.id,
                        name: emp.name,
                        jobTitle: emp.jobTitle || emp.role || '',
                        companyId: emp.companyId,
                        companyName: companiesData[emp.companyId]?.name || 'Unknown Company',
                        avatar: emp.avatar,
                        discoverable: true,
                    });
                }
            }
            setAllProfiles(merged);
        };

        const unsubEmp = onValue(empRef, snap => {
            employeesData = snap.val() || {};
            updateAllProfiles();
        });
        const unsubComp = onValue(compRef, snap => {
            companiesData = snap.val() || {};
            updateAllProfiles();
        });
        const unsubProf = onValue(profRef, snap => {
            profilesData = snap.val() || {};
            updateAllProfiles();
        });

        return () => {
            off(empRef);
            off(compRef);
            off(profRef);
        };
    }, [showGlobalSearch]);

    // ─── Handlers ───
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

    const handleCreateChannel = useCallback(async (name: string, memberIds: string[]) => {
        if (!companyId || !employee) return;
        const participants: Record<string, boolean> = { [employee.id]: true };
        memberIds.forEach(id => { participants[id] = true; });
        const threadsRef = dbRef(db, `companies/${companyId}/chat/threads`);
        const newRef = push(threadsRef);
        const thread: ChatThread = { id: newRef.key!, companyId, type: 'channel', name, participants, createdBy: employee.id, createdAt: new Date().toISOString() };
        await set(newRef, thread);
        setActiveThread(thread);
    }, [companyId, employee]);

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

    const handleSendFriendRequest = useCallback(async (targetProfile: UserProfile) => {
        if (!employee || !company) return;
        const frRef = dbRef(db, `global/friendRequests`);
        const newRef = push(frRef);
        const request: FriendRequest = { id: newRef.key!, fromUserId: employee.id, fromUserName: employee.name, fromCompanyName: company.name, fromAvatar: employee.avatar, fromJobTitle: employee.jobTitle || employee.role, toUserId: targetProfile.userId, toUserName: targetProfile.name, toAvatar: targetProfile.avatar, status: 'pending', createdAt: new Date().toISOString() };
        await set(newRef, request);
        toast({ title: 'Friend request sent', description: `Request sent to ${targetProfile.name}` });
    }, [employee, company, toast]);

    const handleAcceptRequest = useCallback(async (request: FriendRequest) => {
        if (!employee || !company) return;
        await update(dbRef(db, `global/friendRequests/${request.id}`), { status: 'accepted' });
        await set(dbRef(db, `global/connections/${employee.id}/${request.fromUserId}`), { userId: employee.id, connectedUserId: request.fromUserId, connectedUserName: request.fromUserName, connectedCompanyName: request.fromCompanyName, connectedAvatar: request.fromAvatar, connectedAt: new Date().toISOString() });
        await set(dbRef(db, `global/connections/${request.fromUserId}/${employee.id}`), { userId: request.fromUserId, connectedUserId: employee.id, connectedUserName: employee.name, connectedCompanyName: company.name, connectedAvatar: employee.avatar, connectedAt: new Date().toISOString() });
        const gtRef = dbRef(db, `global/chat/threads`);
        const newRef = push(gtRef);
        await set(newRef, { id: newRef.key!, type: 'dm', participants: { [employee.id]: true, [request.fromUserId]: true }, createdAt: new Date().toISOString() });
        toast({ title: 'Connection accepted', description: `You are now connected with ${request.fromUserName}` });
    }, [employee, company, toast]);

    const handleDeclineRequest = useCallback(async (request: FriendRequest) => {
        await update(dbRef(db, `global/friendRequests/${request.id}`), { status: 'declined' });
    }, []);

    const handleSendGlobalMessage = useCallback(async (content: string, type: 'text' | 'file', file?: File) => {
        if (!employee || !activeGlobalThread) return;
        let fileUrl: string | undefined, fileName: string | undefined;
        if (type === 'file' && file) {
            const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `global-chat/${Date.now()}_${cleanName}`;
            const presignRes = await fetch('/api/files/presign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: file.name, fileType: file.type || 'application/octet-stream', filePath }) });
            const presignData = await presignRes.json();
            if (presignRes.ok) { const uploadRes = await fetch(presignData.signedUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type || 'application/octet-stream' } }); if (uploadRes.ok) { fileUrl = presignData.publicUrl; fileName = file.name; } }
        }
        const msgsRef = dbRef(db, `global/chat/messages/${activeGlobalThread.id}`);
        const newMsgRef = push(msgsRef);
        await set(newMsgRef, { id: newMsgRef.key!, threadId: activeGlobalThread.id, senderId: employee.id, senderName: employee.name, senderAvatar: employee.avatar, content: type === 'file' ? (fileName || 'File') : content, type, ...(fileUrl && { fileUrl }), ...(fileName && { fileName }), createdAt: new Date().toISOString() });
        await update(dbRef(db, `global/chat/threads/${activeGlobalThread.id}`), { lastMessage: type === 'file' ? `📎 ${fileName}` : content, lastMessageAt: new Date().toISOString(), lastMessageBy: employee.id });
    }, [employee, activeGlobalThread]);

    const handleToggleDiscoverability = useCallback(async (val: boolean) => {
        if (!employee) return;
        await update(dbRef(db, `global/profiles/${employee.id}`), { discoverable: val });
    }, [employee]);

    const handleRemoveConnection = useCallback(async (conn: Connection) => {
        if (!employee) return;
        await set(dbRef(db, `global/connections/${employee.id}/${conn.connectedUserId}`), null);
        await set(dbRef(db, `global/connections/${conn.connectedUserId}/${employee.id}`), null);
        toast({ title: 'Connection removed' });
    }, [employee, toast]);

    const handleBlockUser = useCallback(async (userId: string) => {
        if (!employee) return;
        await update(dbRef(db, `global/profiles/${employee.id}/blockedUsers`), { [userId]: true });
        toast({ title: 'User blocked' });
    }, [employee, toast]);

    const pendingIncoming = friendRequests.filter(r => r.toUserId === employee?.id && r.status === 'pending');
    const connectedUserIds = new Set(connections.map(c => c.connectedUserId));
    const filteredGlobalProfiles = useMemo(() => {
        if (!employee) return [];
        const blocked = userProfile?.blockedUsers || {};
        let result = allProfiles.filter(p => p.userId !== employee.id && p.discoverable !== false && !blocked[p.userId]);
        if (globalSearchQuery) {
            const q = globalSearchQuery.toLowerCase();
            result = result.filter(p => (p.name || '').toLowerCase().includes(q) || (p.jobTitle || '').toLowerCase().includes(q));
        }
        return result;
    }, [allProfiles, globalSearchQuery, employee, userProfile]);

    const getGlobalThreadName = useCallback((thread: GlobalChatThread) => {
        if (!employee) return 'Unknown';
        const otherId = Object.keys(thread.participants || {}).find(id => id !== employee.id);
        const conn = connections.find(c => c.connectedUserId === otherId);
        return conn?.connectedUserName || 'Unknown';
    }, [employee, connections]);

    const getGlobalThreadAvatar = useCallback((thread: GlobalChatThread) => {
        if (!employee) return null;
        const otherId = Object.keys(thread.participants || {}).find(id => id !== employee.id);
        const conn = connections.find(c => c.connectedUserId === otherId);
        return conn?.connectedAvatar || null;
    }, [employee, connections]);

    if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    return (
        <div className="flex h-[calc(100vh-8rem)] border rounded-xl overflow-hidden bg-background">
            {/* Left Sidebar */}
            <div className="w-80 border-r flex flex-col shrink-0">
                <div className="p-3 border-b">
                    <Tabs value={activeTab} onValueChange={v => { setActiveTab(v as any); setActiveThread(null); setActiveGlobalThread(null); }}>
                        <TabsList className="w-full">
                            <TabsTrigger value="company" className="flex-1 gap-1.5 text-xs"><Users className="h-3.5 w-3.5" /> Company</TabsTrigger>
                            <TabsTrigger value="network" className="flex-1 gap-1.5 text-xs">
                                <Globe className="h-3.5 w-3.5" /> Network
                                {pendingIncoming.length > 0 && <Badge variant="destructive" className="h-4 min-w-[16px] text-[9px] px-1 ml-1">{pendingIncoming.length}</Badge>}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>
                </div>
                <div className="p-2 border-b flex gap-1.5">
                    {activeTab === 'company' ? (
                        <>
                            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowNewDm(true)}><Plus className="h-3.5 w-3.5 mr-1" /> Message</Button>
                            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowNewChannel(true)}><Hash className="h-3.5 w-3.5 mr-1" /> Channel</Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setShowGlobalSearch(true)}><Search className="h-3.5 w-3.5 mr-1" /> Find People</Button>
                            <Button variant="outline" size="sm" className="text-xs relative" onClick={() => setShowFriendRequests(true)}>
                                <Bell className="h-3.5 w-3.5" />
                                {pendingIncoming.length > 0 && <span className="absolute -top-1 -right-1 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center px-1">{pendingIncoming.length}</span>}
                            </Button>
                            <Button variant="outline" size="sm" className="text-xs" onClick={() => setShowPrivacySettings(true)}><Shield className="h-3.5 w-3.5" /></Button>
                        </>
                    )}
                </div>
                {activeTab === 'company' ? (
                    <ThreadList threads={threads} employees={employees} currentUserId={employee?.id || ''} activeThreadId={activeThread?.id || null} onSelectThread={setActiveThread} unreadCounts={unreadCounts} />
                ) : (
                    <ScrollArea className="flex-1">
                        {globalThreads.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground text-sm">
                                <Globe className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                <p>No network conversations yet</p>
                                <p className="text-xs mt-1">Connect with people to start chatting</p>
                            </div>
                        ) : (
                            <div className="py-1">
                                {globalThreads.sort((a, b) => new Date(b.lastMessageAt || b.createdAt).getTime() - new Date(a.lastMessageAt || a.createdAt).getTime()).map(thread => (
                                    <button key={thread.id} onClick={() => setActiveGlobalThread(thread)} className={`w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted/60 transition-colors ${activeGlobalThread?.id === thread.id ? 'bg-primary/5 border-l-2 border-primary' : ''}`}>
                                        <Avatar className="h-9 w-9"><AvatarImage src={getGlobalThreadAvatar(thread) || undefined} /><AvatarFallback className="text-xs">{getGlobalThreadName(thread).charAt(0)}</AvatarFallback></Avatar>
                                        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{getGlobalThreadName(thread)}</p><p className="text-xs text-muted-foreground truncate">{thread.lastMessage || 'No messages yet'}</p></div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </ScrollArea>
                )}
            </div>

            {/* Right Panel */}
            <div className="flex-1 flex flex-col">
                {(activeTab === 'company' && activeThread) ? (
                    <>
                        <div className="p-3 border-b flex items-center gap-3">
                            {activeThread.type === 'channel' ? (
                                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center"><Hash className="h-4 w-4 text-primary" /></div>
                            ) : (
                                <Avatar className="h-9 w-9"><AvatarFallback className="text-xs">{(() => { const otherId = Object.keys(activeThread.participants || {}).find(id => id !== employee?.id); return employees.find(e => e.id === otherId)?.name.charAt(0) || '?'; })()}</AvatarFallback></Avatar>
                            )}
                            <div>
                                <p className="font-semibold text-sm">{activeThread.type === 'channel' ? activeThread.name : (() => { const otherId = Object.keys(activeThread.participants || {}).find(id => id !== employee?.id); return employees.find(e => e.id === otherId)?.name || 'Unknown'; })()}</p>
                                <p className="text-xs text-muted-foreground">
                                    {activeThread.type === 'channel'
                                        ? `${Object.keys(activeThread.participants || {}).length} members`
                                        : (() => {
                                            const otherId = Object.keys(activeThread.participants || {}).find(id => id !== employee?.id);
                                            const otherInfo = employees.find(e => e.id === otherId);
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
                        </div>
                        <MessageView messages={messages} currentUserId={employee?.id || ''} participantCount={Object.keys(activeThread.participants || {}).length} />
                        <MessageInput onSend={handleSendMessage} />
                    </>
                ) : (activeTab === 'network' && activeGlobalThread) ? (
                    <>
                        <div className="p-3 border-b flex items-center gap-3">
                            <Avatar className="h-9 w-9"><AvatarImage src={getGlobalThreadAvatar(activeGlobalThread) || undefined} /><AvatarFallback className="text-xs">{getGlobalThreadName(activeGlobalThread).charAt(0)}</AvatarFallback></Avatar>
                            <div><p className="font-semibold text-sm">{getGlobalThreadName(activeGlobalThread)}</p><p className="text-xs text-muted-foreground">Network Connection</p></div>
                        </div>
                        <MessageView messages={globalMessages} currentUserId={employee?.id || ''} participantCount={2} />
                        <MessageInput onSend={handleSendGlobalMessage} />
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground">
                        <div className="text-center"><MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" /><h3 className="text-lg font-medium">Welcome to Chat Wave</h3><p className="text-sm mt-1">Select a conversation or start a new one</p></div>
                    </div>
                )}
            </div>

            {/* Dialogs */}
            <NewDmDialog open={showNewDm} onOpenChange={setShowNewDm} employees={employees} currentUserId={employee?.id || ''} onSelect={handleStartDm} presenceMap={presenceMap} />
            <NewChannelDialog open={showNewChannel} onOpenChange={setShowNewChannel} employees={employees} currentUserId={employee?.id || ''} onCreate={handleCreateChannel} />

            {/* Global Search */}
            <Dialog open={showGlobalSearch} onOpenChange={(v) => { setShowGlobalSearch(v); if (!v) setGlobalSearchQuery(''); }}>
                <DialogContent className="sm:max-w-lg">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> Find People</DialogTitle><DialogDescription>Search for professionals across all companies.</DialogDescription></DialogHeader>
                    <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder="Search by name or job title..." value={globalSearchQuery} onChange={e => setGlobalSearchQuery(e.target.value)} className="pl-9" autoFocus /></div>
                    <ScrollArea className="max-h-80">
                        {filteredGlobalProfiles.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No people found</p> : (
                            <div className="space-y-0.5">{filteredGlobalProfiles.map(profile => {
                                const isConnected = connectedUserIds.has(profile.userId);
                                const hasPending = friendRequests.some(r => (r.fromUserId === employee?.id && r.toUserId === profile.userId && r.status === 'pending') || (r.toUserId === employee?.id && r.fromUserId === profile.userId && r.status === 'pending'));
                                return (
                                    <div key={profile.userId} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60">
                                        <Avatar className="h-10 w-10"><AvatarImage src={profile.avatar} /><AvatarFallback>{profile.name.charAt(0)}</AvatarFallback></Avatar>
                                        <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{profile.name}</p><p className="text-xs text-muted-foreground truncate">{profile.jobTitle} • {profile.companyName}</p></div>
                                        {isConnected ? <Badge variant="secondary" className="text-[10px]">Connected</Badge> : hasPending ? <Badge variant="outline" className="text-[10px]">Pending</Badge> : <Button size="sm" variant="outline" className="text-xs" onClick={() => handleSendFriendRequest(profile)}><UserPlus className="h-3.5 w-3.5 mr-1" /> Connect</Button>}
                                    </div>
                                );
                            })}</div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Friend Requests */}
            <Dialog open={showFriendRequests} onOpenChange={setShowFriendRequests}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Bell className="h-5 w-5" /> Connection Requests</DialogTitle><DialogDescription>Manage your connection requests.</DialogDescription></DialogHeader>
                    <ScrollArea className="max-h-80">
                        {friendRequests.filter(r => r.status === 'pending').length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No pending requests</p> : (
                            <div className="space-y-2">{friendRequests.filter(r => r.status === 'pending').map(req => (
                                <div key={req.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                                    <Avatar className="h-9 w-9"><AvatarImage src={req.fromUserId === employee?.id ? req.toAvatar : req.fromAvatar} /><AvatarFallback>{(req.fromUserId === employee?.id ? req.toUserName : req.fromUserName).charAt(0)}</AvatarFallback></Avatar>
                                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{req.fromUserId === employee?.id ? req.toUserName : req.fromUserName}</p><p className="text-xs text-muted-foreground">{req.fromUserId === employee?.id ? 'Sent by you' : `${req.fromCompanyName}`}</p></div>
                                    {req.toUserId === employee?.id ? <div className="flex gap-1.5"><Button size="sm" className="text-xs h-7" onClick={() => handleAcceptRequest(req)}>Accept</Button><Button size="sm" variant="outline" className="text-xs h-7" onClick={() => handleDeclineRequest(req)}>Decline</Button></div> : <Badge variant="outline" className="text-[10px]">Sent</Badge>}
                                </div>
                            ))}</div>
                        )}
                    </ScrollArea>
                </DialogContent>
            </Dialog>

            {/* Privacy Settings */}
            <Dialog open={showPrivacySettings} onOpenChange={setShowPrivacySettings}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader><DialogTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> Privacy Settings</DialogTitle><DialogDescription>Control your visibility and connections.</DialogDescription></DialogHeader>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between"><div><Label className="font-medium">Profile Discoverability</Label><p className="text-xs text-muted-foreground mt-0.5">Allow others to find you in global search</p></div><Switch checked={userProfile?.discoverable !== false} onCheckedChange={handleToggleDiscoverability} /></div>
                        <Separator />
                        <div>
                            <Label className="font-medium">Connections ({connections.length})</Label>
                            <ScrollArea className="max-h-48 mt-2">
                                {connections.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">No connections yet</p> : (
                                    <div className="space-y-1">{connections.map(conn => (
                                        <div key={conn.connectedUserId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                                            <Avatar className="h-8 w-8"><AvatarImage src={conn.connectedAvatar} /><AvatarFallback className="text-xs">{conn.connectedUserName.charAt(0)}</AvatarFallback></Avatar>
                                            <div className="flex-1 min-w-0"><p className="text-sm truncate">{conn.connectedUserName}</p><p className="text-xs text-muted-foreground truncate">{conn.connectedCompanyName}</p></div>
                                            <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><Settings2 className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end"><DropdownMenuItem onClick={() => handleRemoveConnection(conn)} className="text-destructive">Remove</DropdownMenuItem><DropdownMenuItem onClick={() => handleBlockUser(conn.connectedUserId)} className="text-destructive">Block</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
                                        </div>
                                    ))}</div>
                                )}
                            </ScrollArea>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
