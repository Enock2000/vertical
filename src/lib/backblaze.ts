// Backblaze B2 Configuration and Client
// Using S3-compatible API

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// Backblaze B2 Configuration (S3-compatible)
const B2_CONFIG = {
    keyId: '005b3c970d8861d0000000002',
    keyName: 'sharespac',
    applicationKey: 'K005LedBsyGZVJKjx2YJf6MjQaE81+U',
    endpoint: 'https://s3.us-east-005.backblazeb2.com',
    bucketId: 'db63dc494790cd9898a6011d',
    bucketName: 'oraninve',
    region: 'us-east-005',
};

// Create S3 client configured for Backblaze B2
const b2Client = new S3Client({
    endpoint: B2_CONFIG.endpoint,
    region: B2_CONFIG.region,
    credentials: {
        accessKeyId: B2_CONFIG.keyId,
        secretAccessKey: B2_CONFIG.applicationKey,
    },
    forcePathStyle: true, // Required for B2
});

export interface UploadResult {
    success: boolean;
    url?: string;
    error?: string;
}

/**
 * Upload a file to Backblaze B2 via API route (CORS-safe)
 * @param file - The file to upload
 * @param path - The path/key in the bucket (e.g., 'companies/123/verification/document.pdf')
 * @returns Upload result with URL or error
 */
export async function uploadToB2(file: File, path: string): Promise<UploadResult> {
    try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', path);

        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData,
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.error || 'Upload failed');
        }

        return {
            success: true,
            url: result.url,
        };
    } catch (error) {
        console.error('B2 upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

/**
 * Upload files to B2 via the drive-specific API route
 */
export async function uploadDriveFiles(
    files: File[],
    companyId: string,
    folderId: string | null,
    employeeId: string,
    employeeName: string,
): Promise<{ success: boolean; files?: Array<{ url: string; path: string; name: string; size: number; mimeType: string }>; error?: string }> {
    try {
        const formData = new FormData();
        files.forEach(f => formData.append('files', f));
        formData.append('companyId', companyId);
        formData.append('folderId', folderId || '');
        formData.append('employeeId', employeeId);
        formData.append('employeeName', employeeName);

        const response = await fetch('/api/files/upload', {
            method: 'POST',
            body: formData,
        });

        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch {
            throw new Error(text || response.statusText);
        }

        if (!response.ok) throw new Error(result?.error || text || 'Upload failed');
        return { success: true, files: result.files };
    } catch (error) {
        console.error('Drive upload error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
    }
}

/**
 * Upload a string as a file to Backblaze B2
 * @param content - The string content to upload
 * @param path - The path/key in the bucket
 * @param contentType - MIME type (default: text/plain)
 * @returns Upload result with URL or error
 */
export async function uploadStringToB2(
    content: string,
    path: string,
    contentType: string = 'text/plain'
): Promise<UploadResult> {
    try {
        const buffer = Buffer.from(content, 'utf-8');

        const command = new PutObjectCommand({
            Bucket: B2_CONFIG.bucketName,
            Key: path,
            Body: buffer,
            ContentType: contentType,
            ACL: 'public-read',
        });

        await b2Client.send(command);

        const publicUrl = `${B2_CONFIG.endpoint}/${B2_CONFIG.bucketName}/${path}`;

        return {
            success: true,
            url: publicUrl,
        };
    } catch (error) {
        console.error('B2 string upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

/**
 * Get a signed URL for private file access
 * @param path - The file path in the bucket
 * @param expiresIn - URL expiration in seconds (default: 1 hour)
 */
export async function getB2SignedUrl(path: string, expiresIn: number = 3600): Promise<string> {
    const command = new GetObjectCommand({
        Bucket: B2_CONFIG.bucketName,
        Key: path,
    });

    return getSignedUrl(b2Client, command, { expiresIn });
}

/**
 * Delete a file from Backblaze B2
 * @param path - The file path/key in the bucket
 */
export async function deleteFromB2(path: string): Promise<{ success: boolean; error?: string }> {
    try {
        const command = new DeleteObjectCommand({
            Bucket: B2_CONFIG.bucketName,
            Key: path,
        });
        await b2Client.send(command);
        return { success: true };
    } catch (error) {
        console.error('B2 delete error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Delete failed' };
    }
}

/**
 * Copy a file within B2
 * @param sourcePath - Source file path
 * @param destPath - Destination file path
 */
export async function copyInB2(sourcePath: string, destPath: string): Promise<{ success: boolean; error?: string }> {
    try {
        const command = new CopyObjectCommand({
            Bucket: B2_CONFIG.bucketName,
            CopySource: `${B2_CONFIG.bucketName}/${sourcePath}`,
            Key: destPath,
        });
        await b2Client.send(command);
        return { success: true };
    } catch (error) {
        console.error('B2 copy error:', error);
        return { success: false, error: error instanceof Error ? error.message : 'Copy failed' };
    }
}

/**
 * Move a file within B2 (copy + delete original)
 */
export async function moveInB2(sourcePath: string, destPath: string): Promise<{ success: boolean; error?: string }> {
    const copyResult = await copyInB2(sourcePath, destPath);
    if (!copyResult.success) return copyResult;
    return deleteFromB2(sourcePath);
}

/**
 * Get the public URL for a file in B2
 */
export function getB2PublicUrl(path: string): string {
    return `${B2_CONFIG.endpoint}/${B2_CONFIG.bucketName}/${path}`;
}

/**
 * Generate a path for verification documents
 */
export function getVerificationDocPath(companyId: string, docType: string, fileName: string): string {
    // Clean the filename to remove special characters
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `verification/${companyId}/${docType}/${Date.now()}_${cleanFileName}`;
}

/**
 * Generate a path for drive files
 */
export function getDriveFilePath(companyId: string, fileName: string): string {
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `drive/${companyId}/${Date.now()}_${cleanFileName}`;
}

export { B2_CONFIG, b2Client };
