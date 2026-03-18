'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Upload, FolderPlus, LayoutGrid, List, Search, Trash2, FolderInput, Star } from 'lucide-react';

interface FileToolbarProps {
    viewMode: 'grid' | 'list';
    onViewModeChange: (mode: 'grid' | 'list') => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    sortBy: string;
    onSortChange: (sort: string) => void;
    onUploadClick: () => void;
    onNewFolderClick: () => void;
    selectedCount: number;
    onDeleteSelected: () => void;
    onMoveSelected: () => void;
    showStarred: boolean;
    onToggleStarred: () => void;
}

export function FileToolbar({
    viewMode, onViewModeChange, searchQuery, onSearchChange,
    sortBy, onSortChange, onUploadClick, onNewFolderClick,
    selectedCount, onDeleteSelected, onMoveSelected,
    showStarred, onToggleStarred,
}: FileToolbarProps) {
    return (
        <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Primary actions */}
            <Button onClick={onUploadClick} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload
            </Button>
            <Button variant="outline" onClick={onNewFolderClick} className="gap-2">
                <FolderPlus className="h-4 w-4" />
                New Folder
            </Button>

            {/* Starred toggle */}
            <Button
                variant={showStarred ? 'secondary' : 'outline'}
                size="icon"
                onClick={onToggleStarred}
                title="Starred files"
            >
                <Star className={`h-4 w-4 ${showStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
            </Button>

            {/* Bulk actions */}
            {selectedCount > 0 && (
                <div className="flex items-center gap-1 ml-2 pl-2 border-l">
                    <span className="text-sm text-muted-foreground mr-1">{selectedCount} selected</span>
                    <Button variant="outline" size="sm" onClick={onMoveSelected}>
                        <FolderInput className="h-3.5 w-3.5 mr-1.5" /> Move
                    </Button>
                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={onDeleteSelected}>
                        <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Delete
                    </Button>
                </div>
            )}

            <div className="flex-1" />

            {/* Search */}
            <div className="relative w-auto min-w-[200px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-8 h-9"
                />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={onSortChange}>
                <SelectTrigger className="w-[140px] h-9">
                    <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="date">Date modified</SelectItem>
                    <SelectItem value="size">Size</SelectItem>
                    <SelectItem value="type">Type</SelectItem>
                </SelectContent>
            </Select>

            {/* View toggle */}
            <div className="flex border rounded-md">
                <Button
                    variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-9 w-9 rounded-r-none"
                    onClick={() => onViewModeChange('grid')}
                >
                    <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                    variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                    size="icon"
                    className="h-9 w-9 rounded-l-none"
                    onClick={() => onViewModeChange('list')}
                >
                    <List className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
}
