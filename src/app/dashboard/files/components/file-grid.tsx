'use client';

import type { DriveFile, DriveFolder } from '@/lib/data';
import { Folder, FileText, Image, Film, Music, FileSpreadsheet, FileCode, File as FileIcon, Star, MoreVertical, Download, Trash2, Share2, FolderInput, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface FileGridProps {
    files: DriveFile[];
    folders: DriveFolder[];
    selectedIds: Set<string>;
    onToggleSelect: (id: string, isFolder: boolean) => void;
    onOpenFolder: (folderId: string) => void;
    onOpenFile: (file: DriveFile) => void;
    onDownload: (file: DriveFile) => void;
    onDelete: (ids: string[], isFolder: boolean) => void;
    onStar: (file: DriveFile) => void;
    onShare: (file: DriveFile) => void;
    onMove: (ids: string[]) => void;
    onRename: (id: string, currentName: string, isFolder: boolean) => void;
    viewMode: 'grid' | 'list';
}

const getFileTypeIcon = (mimeType: string, className: string = 'h-8 w-8') => {
    if (mimeType.startsWith('image/')) return <Image className={cn(className, 'text-pink-500')} />;
    if (mimeType.startsWith('video/')) return <Film className={cn(className, 'text-purple-500')} />;
    if (mimeType.startsWith('audio/')) return <Music className={cn(className, 'text-green-500')} />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('csv') || mimeType.includes('excel')) return <FileSpreadsheet className={cn(className, 'text-emerald-500')} />;
    if (mimeType.includes('pdf')) return <FileText className={cn(className, 'text-red-500')} />;
    if (mimeType.includes('json') || mimeType.includes('javascript') || mimeType.includes('html')) return <FileCode className={cn(className, 'text-yellow-500')} />;
    if (mimeType.includes('word') || mimeType.includes('document')) return <FileText className={cn(className, 'text-blue-500')} />;
    return <FileIcon className={cn(className, 'text-slate-500')} />;
};

const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export function FileGrid({
    files, folders, selectedIds, onToggleSelect, onOpenFolder, onOpenFile,
    onDownload, onDelete, onStar, onShare, onMove, onRename, viewMode,
}: FileGridProps) {
    if (viewMode === 'list') {
        return (
            <div className="border rounded-lg overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[1fr_100px_120px_120px_40px] gap-2 px-4 py-2 bg-muted/50 text-xs font-medium text-muted-foreground border-b">
                    <span>Name</span>
                    <span>Size</span>
                    <span>Modified</span>
                    <span>Owner</span>
                    <span></span>
                </div>

                {/* Folders */}
                {folders.map((folder) => (
                    <div
                        key={`folder-${folder.id}`}
                        className={cn(
                            'grid grid-cols-[1fr_100px_120px_120px_40px] gap-2 px-4 py-2.5 items-center hover:bg-muted/50 cursor-pointer border-b transition-colors',
                            selectedIds.has(folder.id) && 'bg-primary/5'
                        )}
                        onClick={() => onToggleSelect(folder.id, true)}
                        onDoubleClick={() => onOpenFolder(folder.id)}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            <Folder className="h-5 w-5 shrink-0" style={{ color: folder.color || '#6366f1' }} />
                            <span className="text-sm truncate font-medium">{folder.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">—</span>
                        <span className="text-xs text-muted-foreground">{formatDate(folder.updatedAt)}</span>
                        <span className="text-xs text-muted-foreground truncate">{folder.createdByName}</span>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => e.stopPropagation()}>
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onRename(folder.id, folder.name, true)}>
                                    <Pencil className="h-4 w-4 mr-2" /> Rename
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-destructive" onClick={() => onDelete([folder.id], true)}>
                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                ))}

                {/* Files */}
                {files.map((file) => (
                    <div
                        key={`file-${file.id}`}
                        className={cn(
                            'grid grid-cols-[1fr_100px_120px_120px_40px] gap-2 px-4 py-2.5 items-center hover:bg-muted/50 cursor-pointer border-b last:border-b-0 transition-colors',
                            selectedIds.has(file.id) && 'bg-primary/5'
                        )}
                        onClick={() => onToggleSelect(file.id, false)}
                        onDoubleClick={() => onOpenFile(file)}
                    >
                        <div className="flex items-center gap-3 min-w-0">
                            {getFileTypeIcon(file.mimeType, 'h-5 w-5 shrink-0')}
                            <span className="text-sm truncate">{file.name}</span>
                            {file.starred && <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 shrink-0" />}
                        </div>
                        <span className="text-xs text-muted-foreground">{formatSize(file.size)}</span>
                        <span className="text-xs text-muted-foreground">{formatDate(file.updatedAt)}</span>
                        <span className="text-xs text-muted-foreground truncate">{file.uploadedByName}</span>
                        <FileContextMenu file={file} onDownload={onDownload} onDelete={onDelete} onStar={onStar} onShare={onShare} onMove={onMove} onRename={onRename} />
                    </div>
                ))}

                {files.length === 0 && folders.length === 0 && (
                    <div className="py-16 text-center text-muted-foreground">
                        <FileIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm">This folder is empty</p>
                        <p className="text-xs mt-1">Upload files or create a folder to get started</p>
                    </div>
                )}
            </div>
        );
    }

    // Grid view
    return (
        <div>
            {/* Folders */}
            {folders.length > 0 && (
                <div className="mb-6">
                    <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Folders</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {folders.map((folder) => (
                            <div
                                key={`folder-${folder.id}`}
                                className={cn(
                                    'group relative p-3 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer',
                                    selectedIds.has(folder.id) && 'ring-2 ring-primary bg-primary/5'
                                )}
                                onClick={() => onToggleSelect(folder.id, true)}
                                onDoubleClick={() => onOpenFolder(folder.id)}
                            >
                                <div className="flex items-center gap-2.5">
                                    <Folder className="h-8 w-8 shrink-0" style={{ color: folder.color || '#6366f1' }} />
                                    <span className="text-sm font-medium truncate">{folder.name}</span>
                                </div>
                                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                                                <MoreVertical className="h-3.5 w-3.5" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onRename(folder.id, folder.name, true)}>
                                                <Pencil className="h-4 w-4 mr-2" /> Rename
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem className="text-destructive" onClick={() => onDelete([folder.id], true)}>
                                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Files */}
            {files.length > 0 && (
                <div>
                    <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">Files</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                        {files.map((file) => (
                            <div
                                key={`file-${file.id}`}
                                className={cn(
                                    'group relative p-3 rounded-xl border bg-card hover:shadow-md transition-all cursor-pointer',
                                    selectedIds.has(file.id) && 'ring-2 ring-primary bg-primary/5'
                                )}
                                onClick={() => onToggleSelect(file.id, false)}
                                onDoubleClick={() => onOpenFile(file)}
                            >
                                {/* Preview / Icon */}
                                <div className="h-24 rounded-lg bg-muted/50 flex items-center justify-center mb-2 overflow-hidden">
                                    {file.mimeType.startsWith('image/') && file.thumbnailUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={file.thumbnailUrl} alt={file.name} className="w-full h-full object-cover" />
                                    ) : (
                                        getFileTypeIcon(file.mimeType, 'h-10 w-10')
                                    )}
                                </div>

                                {/* Name & info */}
                                <div className="space-y-0.5">
                                    <p className="text-sm font-medium truncate">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatSize(file.size)}</p>
                                </div>

                                {/* Star */}
                                {file.starred && (
                                    <Star className="absolute top-2 left-2 h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                                )}

                                {/* Context menu */}
                                <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <FileContextMenu file={file} onDownload={onDownload} onDelete={onDelete} onStar={onStar} onShare={onShare} onMove={onMove} onRename={onRename} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {files.length === 0 && folders.length === 0 && (
                <div className="py-20 text-center text-muted-foreground">
                    <FileIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">No files here yet</p>
                    <p className="text-sm mt-1">Upload files or create folders to get started</p>
                </div>
            )}
        </div>
    );
}

function FileContextMenu({ file, onDownload, onDelete, onStar, onShare, onMove, onRename }: {
    file: DriveFile;
    onDownload: (file: DriveFile) => void;
    onDelete: (ids: string[], isFolder: boolean) => void;
    onStar: (file: DriveFile) => void;
    onShare: (file: DriveFile) => void;
    onMove: (ids: string[]) => void;
    onRename: (id: string, name: string, isFolder: boolean) => void;
}) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => e.stopPropagation()}>
                    <MoreVertical className="h-3.5 w-3.5" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onDownload(file)}>
                    <Download className="h-4 w-4 mr-2" /> Download
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onRename(file.id, file.name, false)}>
                    <Pencil className="h-4 w-4 mr-2" /> Rename
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onStar(file)}>
                    <Star className={cn('h-4 w-4 mr-2', file.starred && 'fill-yellow-400 text-yellow-400')} />
                    {file.starred ? 'Unstar' : 'Star'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onShare(file)}>
                    <Share2 className="h-4 w-4 mr-2" /> Share
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onMove([file.id])}>
                    <FolderInput className="h-4 w-4 mr-2" /> Move to...
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={() => onDelete([file.id], false)}>
                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
