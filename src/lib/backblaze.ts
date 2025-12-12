// Backblaze B2 Configuration and Client
// Using S3-compatible API

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
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
 * Upload a file to Backblaze B2
 * @param file - The file to upload
 * @param path - The path/key in the bucket (e.g., 'companies/123/verification/document.pdf')
 * @returns Upload result with URL or error
 */
export async function uploadToB2(file: File, path: string): Promise<UploadResult> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const command = new PutObjectCommand({
            Bucket: B2_CONFIG.bucketName,
            Key: path,
            Body: buffer,
            ContentType: file.type,
            ACL: 'public-read', // Make file publicly accessible
        });

        await b2Client.send(command);

        // Construct the public URL
        const publicUrl = `${B2_CONFIG.endpoint}/${B2_CONFIG.bucketName}/${path}`;

        return {
            success: true,
            url: publicUrl,
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
 * Generate a path for verification documents
 */
export function getVerificationDocPath(companyId: string, docType: string, fileName: string): string {
    // Clean the filename to remove special characters
    const cleanFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    return `verification/${companyId}/${docType}/${Date.now()}_${cleanFileName}`;
}

export { B2_CONFIG };
