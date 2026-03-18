'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '@/lib/firebase';
import { ref as dbRef, onValue, push, set, update, remove } from 'firebase/database';
import { useAuth } from '@/app/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ChevronRight, HardDrive, Home } from 'lucide-react';
import type { DriveFile, DriveFolder, Employee, SubscriptionPlan, Company } from '@/lib/data';
import { uploadDriveFiles } from '@/lib/backblaze';

import { FileGrid } from './components/file-grid';
import { FileToolbar } from './components/file-toolbar';
import { FileDetailsPanel } from './components/file-details-panel';
import { CreateFolderDialog } from './components/create-folder-dialog';
import { UploadDialog } from './components/upload-dialog';
import { ShareDialog } from './components/share-dialog';
import { MoveDialog } from './components/move-dialog';
import { FilePreviewDialog } from './components/file-preview-dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export default function FilesPage() {
    const { companyId, employee } = useAuth();
    const { toast } = useToast();

    // Data state
    const [allFiles, setAllFiles] = useState<DriveFile[]>([]);
    const [allFolders, setAllFolders] = useState<DriveFolder[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [company, setCompany] = useState<Company | null>(null);
    const [globalStorageLimitMB, setGlobalStorageLimitMB] = useState(5120);
    const [loading, setLoading] = useState(true);

    // UI state
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState('name');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [selectedFileForDetails, setSelectedFileForDetails] = useState<DriveFile | null>(null);
    const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
    const [showStarred, setShowStarred] = useState(false);

    // Dialog state
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showCreateFolderDialog, setShowCreateFolderDialog] = useState(false);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [shareFile, setShareFile] = useState<DriveFile | null>(null);
    const [showMoveDialog, setShowMoveDialog] = useState(false);
    const [moveIds, setMoveIds] = useState<string[]>([]);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ ids: string[]; isFolder: boolean } | null>(null);
    const [renameTarget, setRenameTarget] = useState<{ id: string; name: string; isFolder: boolean } | null>(null);
    // Password Prompt State
    const [passwordChallenge, setPasswordChallenge] = useState<{ file: DriveFile, action: 'download' | 'preview' } | null>(null);

    // ─── Firebase listeners ───
    useEffect(() => {
        if (!companyId) return;

        const filesRef = dbRef(db, `companies/${companyId}/drive/files`);
        const foldersRef = dbRef(db, `companies/${companyId}/drive/folders`);
        const employeesRef = dbRef(db, 'employees');
        const plansRef = dbRef(db, 'subscriptionPlans');
        const companyRef = dbRef(db, `companies/${companyId}`);

        let filesLoaded = false, foldersLoaded = false, employeesLoaded = false, plansLoaded = false, companyLoaded = false, settingsLoaded = false;
        const checkDone = () => { if (filesLoaded && foldersLoaded && employeesLoaded && plansLoaded && companyLoaded && settingsLoaded) setLoading(false); };

        const unsub1 = onValue(filesRef, (snap) => {
            const data = snap.val();
            setAllFiles(data ? Object.values(data) : []);
            filesLoaded = true;
            checkDone();
        });

        const unsub2 = onValue(foldersRef, (snap) => {
            const data = snap.val();
            setAllFolders(data ? Object.values(data) : []);
            foldersLoaded = true;
            checkDone();
        });

        const unsub3 = onValue(employeesRef, (snap) => {
            const data = snap.val();
            if (data) {
                const emps: Employee[] = Object.values(data);
                setEmployees(emps.filter((e) => e.companyId === companyId));
            }
            employeesLoaded = true;
            checkDone();
        });

        const unsub4 = onValue(plansRef, (snap) => {
            const data = snap.val();
            setPlans(data ? Object.values(data) : []);
            plansLoaded = true;
            checkDone();
        });

        const unsub5 = onValue(companyRef, (snap) => {
            setCompany(snap.val());
            companyLoaded = true;
            checkDone();
        });

        const settingsRef = dbRef(db, 'platformSettings/globalStorageLimitMB');
        const unsub6 = onValue(settingsRef, (snap) => {
            setGlobalStorageLimitMB(snap.val() || 5120);
            settingsLoaded = true;
            checkDone();
        });

        return () => { unsub1(); unsub2(); unsub3(); unsub4(); unsub5(); unsub6(); };
    }, [companyId]);

    // ─── Computed data ───
    const breadcrumbs = useMemo(() => {
        const trail: DriveFolder[] = [];
        let id = currentFolderId;
        while (id) {
            const folder = allFolders.find((f) => f.id === id);
            if (folder) {
                trail.unshift(folder);
                id = folder.parentId;
            } else break;
        }
        return trail;
    }, [currentFolderId, allFolders]);

    const currentFiles = useMemo(() => {
        let files = showStarred
            ? allFiles.filter((f) => f.starred && !f.trashed)
            : allFiles.filter((f) => (f.folderId || null) === (currentFolderId || null) && !f.trashed);

        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            files = files.filter((f) => f.name.toLowerCase().includes(q));
        }

        files.sort((a, b) => {
            switch (sortBy) {
                case 'date': return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                case 'size': return b.size - a.size;
                case 'type': return a.mimeType.localeCompare(b.mimeType);
                default: return a.name.localeCompare(b.name);
            }
        });

        return files;
    }, [allFiles, currentFolderId, searchQuery, sortBy, showStarred]);

    const currentFolders = useMemo(() => {
        if (showStarred) return [];
        let folders = allFolders.filter((f) => (f.parentId || null) === (currentFolderId || null));
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            folders = folders.filter((f) => f.name.toLowerCase().includes(q));
        }
        return folders.sort((a, b) => a.name.localeCompare(b.name));
    }, [allFolders, currentFolderId, searchQuery, showStarred]);

    const storageUsed = useMemo(() => allFiles.reduce((a, f) => a + f.size, 0), [allFiles]);
    const storageLimit = useMemo(() => {
        if (!company || !plans.length) return globalStorageLimitMB * 1024 * 1024;
        if (company.overrideStorageLimitMB) return company.overrideStorageLimitMB * 1024 * 1024;
        
        const sub = company.subscription;
        // Try to find plan by ID
        let plan = plans.find(p => p.id === sub?.planId);
        
        // Safeguard for existing companies that might have hardcoded 'free' or mismatched planIds
        if (!plan && sub?.planId === 'free') {
            plan = plans.find(p => p.name.toLowerCase() === 'free');
        }

        const limitMB = plan?.storageLimitMB || globalStorageLimitMB;
        return limitMB * 1024 * 1024;
    }, [company, plans, globalStorageLimitMB]);
    const storagePercent = Math.min((storageUsed / storageLimit) * 100, 100);

    // ─── Handlers ───
    const handleToggleSelect = useCallback((id: string, _isFolder: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });

        // Also set details panel for files
        const file = allFiles.find((f) => f.id === id);
        if (file) setSelectedFileForDetails(file);
    }, [allFiles]);

    const handleOpenFolder = useCallback((folderId: string) => {
        setCurrentFolderId(folderId);
        setSelectedIds(new Set());
        setSelectedFileForDetails(null);
        setShowStarred(false);
    }, []);

    const handleOpenFile = useCallback((file: DriveFile) => {
        if (file.isPasswordProtected) {
            setPasswordChallenge({ file, action: 'preview' });
        } else {
            setPreviewFile(file);
        }
    }, []);

    const handleUpload = useCallback(async (files: File[]) => {
        if (!companyId || !employee) return;

        // CHECK QUOTA
        const newFilesSize = files.reduce((acc, f) => acc + f.size, 0);
        if (storageUsed + newFilesSize > storageLimit) {
            toast({ 
                variant: 'destructive', 
                title: 'Storage Limit Exceeded', 
                description: 'You do not have enough storage space. Please free up space or upgrade your subscription.' 
            });
            throw new Error('Storage Limit Exceeded');
        }

        const result = await uploadDriveFiles(
            files,
            companyId,
            currentFolderId,
            employee.id,
            employee.name,
        );

        if (!result.success || !result.files) {
            toast({ variant: 'destructive', title: 'Upload Failed', description: result.error });
            throw new Error(result.error);
        }

        // Save metadata to Firebase
        const filesRef = dbRef(db, `companies/${companyId}/drive/files`);
        for (const f of result.files) {
            const newRef = push(filesRef);
            const driveFile: DriveFile = {
                id: newRef.key!,
                companyId,
                name: f.name,
                mimeType: f.mimeType,
                size: f.size,
                b2Path: f.path,
                folderId: currentFolderId,
                uploadedBy: employee.id,
                uploadedByName: employee.name,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                starred: false,
                shared: false,
                ...((f.mimeType || '').startsWith('image/') ? { thumbnailUrl: f.url } : {})
            };
            await set(newRef, driveFile);
        }

        toast({ title: 'Upload Complete', description: `${result.files.length} file(s) uploaded.` });
    }, [companyId, employee, currentFolderId, toast, storageUsed, storageLimit]);

    const handleCreateFolder = useCallback(async (name: string, color: string) => {
        if (!companyId || !employee) return;
        const foldersRef = dbRef(db, `companies/${companyId}/drive/folders`);
        const newRef = push(foldersRef);
        const folder: DriveFolder = {
            id: newRef.key!,
            companyId,
            name,
            parentId: currentFolderId,
            color,
            createdBy: employee.id,
            createdByName: employee.name,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        await set(newRef, folder);
        toast({ title: 'Folder Created', description: `"${name}" has been created.` });
    }, [companyId, employee, currentFolderId, toast]);

    const handleDownload = useCallback(async (file: DriveFile) => {
        if (file.isPasswordProtected) {
            setPasswordChallenge({ file, action: 'download' });
            return;
        }
        
        try {
            const res = await fetch('/api/files/download', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: file.b2Path, fileName: file.name }),
            });
            const data = await res.json();
            if (data.url) {
                // Trigger download in the same tab using a programmatic anchor click
                const a = document.createElement('a');
                a.href = data.url;
                a.download = file.name;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            }
        } catch {
            toast({ variant: 'destructive', title: 'Download Failed' });
        }
    }, [toast]);

    const handleSecureAction = useCallback(async (password: string) => {
        if (!passwordChallenge) return;
        const { file, action } = passwordChallenge;

        if (action === 'preview') {
            // For preview, we still need to verify the password. We can do a quick check against the hash client-side for UX.
            try {
                const msgBuffer = new TextEncoder().encode(password);
                const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                
                if (hashHex !== file.passwordHash) {
                    toast({ variant: 'destructive', title: 'Incorrect Password' });
                    return;
                }
                
                setPasswordChallenge(null);
                setPreviewFile(file);
            } catch (err) {
                toast({ variant: 'destructive', title: 'Error verifying password' });
            }
        } else if (action === 'download') {
            // Initiate secure download
            try {
                // To download a stream (ZIP) via API route, we can use a direct form POST or create an object URL.
                // Because fetch() doesn't prompt "Save As" directly, we fetch the blob and save it.
                // For very large files this is memory intensive, but standard for SPAs.
                toast({ title: 'Preparing secure download...' });
                const res = await fetch('/api/files/download-secure', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fileId: file.id, companyId: file.companyId, password }),
                });

                if (!res.ok) {
                    const err = await res.json();
                    toast({ variant: 'destructive', title: 'Download Failed', description: err.error });
                    return;
                }

                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${file.name}.zip`; // It comes back as a protected zip
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                setPasswordChallenge(null);
            } catch (error) {
                toast({ variant: 'destructive', title: 'Download Failed' });
            }
        }
    }, [passwordChallenge, toast]);

    const handleDelete = useCallback((ids: string[], isFolder: boolean) => {
        setDeleteTarget({ ids, isFolder });
        setShowDeleteConfirm(true);
    }, []);

    const confirmDelete = useCallback(async () => {
        if (!companyId || !deleteTarget) return;

        if (deleteTarget.isFolder) {
            for (const id of deleteTarget.ids) {
                await remove(dbRef(db, `companies/${companyId}/drive/folders/${id}`));
            }
        } else {
            // Delete from B2 + Firebase
            const filesToDelete = allFiles.filter((f) => deleteTarget.ids.includes(f.id));
            const paths = filesToDelete.map((f) => f.b2Path);

            if (paths.length > 0) {
                await fetch('/api/files/delete', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ paths }),
                });
            }

            for (const id of deleteTarget.ids) {
                await remove(dbRef(db, `companies/${companyId}/drive/files/${id}`));
            }
        }

        toast({ title: 'Deleted', description: `${deleteTarget.ids.length} item(s) deleted.` });
        setSelectedIds(new Set());
        setSelectedFileForDetails(null);
        setShowDeleteConfirm(false);
        setDeleteTarget(null);
    }, [companyId, deleteTarget, allFiles, toast]);

    const handleStar = useCallback(async (file: DriveFile) => {
        if (!companyId) return;
        await update(dbRef(db, `companies/${companyId}/drive/files/${file.id}`), {
            starred: !file.starred,
            updatedAt: new Date().toISOString(),
        });
    }, [companyId]);

    const handleShare = useCallback((file: DriveFile) => {
        setShareFile(file);
        setShowShareDialog(true);
    }, []);

    const confirmShare = useCallback(async (fileId: string, employeeIds: string[], password?: string | null) => {
        if (!companyId) return;

        // Use 'any' type to allow assigning null to fields to delete them from Firebase
        const updates: any = {
            shared: employeeIds.length > 0,
            sharedWith: employeeIds,
            updatedAt: new Date().toISOString(),
        };

        if (password) {
            // Hash the password client-side using WebCrypto before sending to Firebase
            const msgBuffer = new TextEncoder().encode(password);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            
            updates.isPasswordProtected = true;
            updates.passwordHash = hashHex;
        } else if (password === null) {
            // Remove password protection
            updates.isPasswordProtected = null;
            updates.passwordHash = null;
        }

        await update(dbRef(db, `companies/${companyId}/drive/files/${fileId}`), updates);
        toast({ title: 'Sharing Updated', description: `File sharing settings updated.` });
    }, [companyId, toast]);

    const handleMoveInit = useCallback((ids: string[]) => {
        setMoveIds(ids);
        setShowMoveDialog(true);
    }, []);

    const confirmMove = useCallback(async (targetFolderId: string | null) => {
        if (!companyId) return;
        for (const id of moveIds) {
            // Check if it's a file or folder
            const file = allFiles.find((f) => f.id === id);
            if (file) {
                await update(dbRef(db, `companies/${companyId}/drive/files/${id}`), {
                    folderId: targetFolderId,
                    updatedAt: new Date().toISOString(),
                });
            } else {
                await update(dbRef(db, `companies/${companyId}/drive/folders/${id}`), {
                    parentId: targetFolderId,
                    updatedAt: new Date().toISOString(),
                });
            }
        }
        toast({ title: 'Moved', description: `${moveIds.length} item(s) moved.` });
        setSelectedIds(new Set());
    }, [companyId, moveIds, allFiles, toast]);

    const handleRename = useCallback((id: string, currentName: string, isFolder: boolean) => {
        setRenameTarget({ id, name: currentName, isFolder });
    }, []);

    const confirmRename = useCallback(async (newName: string) => {
        if (!companyId || !renameTarget) return;
        const path = renameTarget.isFolder
            ? `companies/${companyId}/drive/folders/${renameTarget.id}`
            : `companies/${companyId}/drive/files/${renameTarget.id}`;

        await update(dbRef(db, path), {
            name: newName,
            updatedAt: new Date().toISOString(),
        });
        toast({ title: 'Renamed', description: `Renamed to "${newName}".` });
        setRenameTarget(null);
    }, [companyId, renameTarget, toast]);

    const formatStorageSize = (bytes: number) => {
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
        return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
    };

    // ─── Preview Navigation ───
    const previewIndex = previewFile ? currentFiles.findIndex(f => f.id === previewFile.id) : -1;
    const hasPrevious = previewIndex > 0;
    const hasNext = previewIndex >= 0 && previewIndex < currentFiles.length - 1;

    const handlePreviousPreview = useCallback(() => {
        if (hasPrevious) setPreviewFile(currentFiles[previewIndex - 1]);
    }, [hasPrevious, previewIndex, currentFiles]);

    const handleNextPreview = useCallback(() => {
        if (hasNext) setPreviewFile(currentFiles[previewIndex + 1]);
    }, [hasNext, previewIndex, currentFiles]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!previewFile) return;
            if (e.key === 'ArrowLeft') handlePreviousPreview();
            if (e.key === 'ArrowRight') handleNextPreview();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [previewFile, handlePreviousPreview, handleNextPreview]);

    // ─── Render ───
    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-8rem)]">
            {/* Main content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-sm">
                            <button
                                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors font-medium"
                                onClick={() => { setCurrentFolderId(null); setShowStarred(false); setSelectedIds(new Set()); }}
                            >
                                <HardDrive className="h-4 w-4" />
                                My Drive
                            </button>
                            {breadcrumbs.map((folder) => (
                                <span key={folder.id} className="flex items-center gap-1">
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                    <button
                                        className="text-muted-foreground hover:text-foreground transition-colors font-medium"
                                        onClick={() => handleOpenFolder(folder.id)}
                                    >
                                        {folder.name}
                                    </button>
                                </span>
                            ))}
                            {showStarred && (
                                <span className="flex items-center gap-1">
                                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="font-medium">⭐ Starred</span>
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Storage Widget */}
                    <Card className="w-56 shrink-0">
                        <CardContent className="p-3">
                            <div className="flex items-center justify-between text-xs mb-1.5">
                                <span className="text-muted-foreground">Storage</span>
                                <span className="font-medium">{formatStorageSize(storageUsed)} / {formatStorageSize(storageLimit)}</span>
                            </div>
                            <Progress value={storagePercent} className="h-1.5" />
                        </CardContent>
                    </Card>
                </div>

                {/* Toolbar */}
                <FileToolbar
                    viewMode={viewMode}
                    onViewModeChange={setViewMode}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    sortBy={sortBy}
                    onSortChange={setSortBy}
                    onUploadClick={() => setShowUploadDialog(true)}
                    onNewFolderClick={() => setShowCreateFolderDialog(true)}
                    selectedCount={selectedIds.size}
                    onDeleteSelected={() => handleDelete(Array.from(selectedIds), false)}
                    onMoveSelected={() => handleMoveInit(Array.from(selectedIds))}
                    showStarred={showStarred}
                    onToggleStarred={() => { setShowStarred(!showStarred); setCurrentFolderId(null); setSelectedIds(new Set()); }}
                />

                {/* File Grid */}
                <div className="flex-1 overflow-y-auto pb-4">
                    <FileGrid
                        files={currentFiles}
                        folders={currentFolders}
                        selectedIds={selectedIds}
                        onToggleSelect={handleToggleSelect}
                        onOpenFolder={handleOpenFolder}
                        onOpenFile={handleOpenFile}
                        onDownload={handleDownload}
                        onDelete={handleDelete}
                        onStar={handleStar}
                        onShare={handleShare}
                        onMove={handleMoveInit}
                        onRename={handleRename}
                        viewMode={viewMode}
                    />
                </div>
            </div>

            {/* Details Panel */}
            {selectedFileForDetails && (
                <FileDetailsPanel
                    file={selectedFileForDetails}
                    onClose={() => setSelectedFileForDetails(null)}
                    onDownload={handleDownload}
                    onStar={handleStar}
                    onDelete={(f) => handleDelete([f.id], false)}
                    onShare={handleShare}
                />
            )}

            {/* Dialogs */}
            <UploadDialog
                open={showUploadDialog}
                onOpenChange={setShowUploadDialog}
                onUpload={handleUpload}
            />

            <CreateFolderDialog
                open={showCreateFolderDialog}
                onOpenChange={setShowCreateFolderDialog}
                onCreateFolder={handleCreateFolder}
            />

            <ShareDialog
                open={showShareDialog}
                onOpenChange={(v) => { setShowShareDialog(v); if (!v) setShareFile(null); }}
                file={shareFile}
                employees={employees}
                onShare={confirmShare}
            />

            <MoveDialog
                open={showMoveDialog}
                onOpenChange={setShowMoveDialog}
                folders={allFolders}
                currentFolderId={currentFolderId}
                onMove={confirmMove}
            />

            <FilePreviewDialog
                file={previewFile}
                open={!!previewFile}
                onOpenChange={(v) => { if (!v) setPreviewFile(null); }}
                onPrevious={handlePreviousPreview}
                onNext={handleNextPreview}
                hasPrevious={hasPrevious}
                hasNext={hasNext}
                onDownload={handleDownload}
            />

            {/* Delete Confirmation */}
            <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete {deleteTarget?.ids.length || 0} item(s)?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. The selected items will be permanently removed.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Rename Dialog */}
            {renameTarget && (
                <RenameDialog
                    open={!!renameTarget}
                    onOpenChange={(v) => { if (!v) setRenameTarget(null); }}
                    currentName={renameTarget.name}
                    onRename={confirmRename}
                />
            )}

            {/* Password Prompt Dialog */}
            {passwordChallenge && (
                <PasswordDialog
                    open={!!passwordChallenge}
                    onOpenChange={(v) => { if (!v) setPasswordChallenge(null); }}
                    file={passwordChallenge.file}
                    action={passwordChallenge.action}
                    onSubmit={handleSecureAction}
                />
            )}
        </div>
    );
}

// ─── Inline Password Dialog ───
function PasswordDialog({ open, onOpenChange, file, action, onSubmit }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    file: DriveFile;
    action: 'preview' | 'download';
    onSubmit: (password: string) => Promise<void>;
}) {
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!password) return;
        setLoading(true);
        try {
            await onSubmit(password);
        } finally {
            setLoading(false);
            setPassword('');
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Protected File</DialogTitle>
                    <DialogDescription>
                        &quot;{file.name}&quot; is password protected. Please enter the password to {action} this file.
                    </DialogDescription>
                </DialogHeader>
                <input
                    type="password"
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                />
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={!password || loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Submit'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Inline Rename Dialog ───
function RenameDialog({ open, onOpenChange, currentName, onRename }: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    currentName: string;
    onRename: (name: string) => Promise<void>;
}) {
    const [name, setName] = useState(currentName);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!name.trim()) return;
        setLoading(true);
        try {
            await onRename(name.trim());
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Rename</AlertDialogTitle>
                </AlertDialogHeader>
                <input
                    className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    autoFocus
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleSubmit} disabled={!name.trim() || loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rename'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
