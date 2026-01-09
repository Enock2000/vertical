'use client';

import { useState, useRef } from 'react';
import { Loader2, Camera, Upload, X, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadToB2 } from '@/lib/backblaze';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

interface ImageUploadProps {
    currentImageUrl?: string | null;
    onUploadComplete: (url: string) => void;
    uploadPath: string;
    variant?: 'avatar' | 'square' | 'full';
    size?: 'sm' | 'md' | 'lg';
    placeholder?: string;
    className?: string;
}

export function ImageUpload({
    currentImageUrl,
    onUploadComplete,
    uploadPath,
    variant = 'square',
    size = 'md',
    placeholder,
    className = '',
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    const sizeClasses = {
        sm: variant === 'avatar' ? 'h-16 w-16' : 'h-24 w-32',
        md: variant === 'avatar' ? 'h-24 w-24' : 'h-32 w-48',
        lg: variant === 'avatar' ? 'h-32 w-32' : 'h-48 w-64',
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast({
                variant: 'destructive',
                title: 'Invalid File',
                description: 'Please select an image file (JPG, PNG, GIF).',
            });
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            toast({
                variant: 'destructive',
                title: 'File Too Large',
                description: 'Maximum file size is 5MB.',
            });
            return;
        }

        setIsUploading(true);

        // Show preview immediately
        const reader = new FileReader();
        reader.onload = (e) => {
            setPreviewUrl(e.target?.result as string);
        };
        reader.readAsDataURL(file);

        try {
            const path = `${uploadPath}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
            const result = await uploadToB2(file, path);

            if (!result.success || !result.url) {
                throw new Error(result.error || 'Upload failed');
            }

            setPreviewUrl(result.url);
            onUploadComplete(result.url);
            toast({
                title: 'Image Uploaded',
                description: 'Your image has been uploaded successfully.',
            });
        } catch (error) {
            console.error('Image upload error:', error);
            setPreviewUrl(currentImageUrl || null);
            toast({
                variant: 'destructive',
                title: 'Upload Failed',
                description: 'Could not upload image. Please try again.',
            });
        } finally {
            setIsUploading(false);
            if (inputRef.current) {
                inputRef.current.value = '';
            }
        }
    };

    const handleClear = () => {
        setPreviewUrl(null);
        onUploadComplete('');
    };

    return (
        <div className={`relative group ${className}`}>
            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isUploading}
            />

            <div
                className={`
          ${sizeClasses[size]}
          ${variant === 'avatar' ? 'rounded-full' : 'rounded-lg'}
          ${variant === 'full' ? 'w-full h-48' : ''}
          border-2 border-dashed border-muted-foreground/25
          bg-muted/50
          flex items-center justify-center
          overflow-hidden
          cursor-pointer
          transition-all
          hover:border-primary/50
          hover:bg-muted
          relative
        `}
                onClick={() => !isUploading && inputRef.current?.click()}
            >
                {previewUrl ? (
                    <>
                        <Image
                            src={previewUrl}
                            alt="Uploaded image"
                            fill
                            className="object-cover"
                        />
                        {!isUploading && (
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <Camera className="h-6 w-6 text-white" />
                            </div>
                        )}
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground p-4 text-center">
                        {variant === 'avatar' ? (
                            <Camera className="h-6 w-6" />
                        ) : (
                            <ImageIcon className="h-8 w-8" />
                        )}
                        {placeholder && <span className="text-xs">{placeholder}</span>}
                    </div>
                )}

                {isUploading && (
                    <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                )}
            </div>

            {previewUrl && !isUploading && (
                <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClear();
                    }}
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}
