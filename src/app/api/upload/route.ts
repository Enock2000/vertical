import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

// Backblaze B2 Configuration (S3-compatible)
const B2_CONFIG = {
    keyId: '005b3c970d8861d0000000002',
    applicationKey: 'K005LedBsyGZVJKjx2YJf6MjQaE81+U',
    endpoint: 'https://s3.us-east-005.backblazeb2.com',
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
    forcePathStyle: true,
});

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const path = formData.get('path') as string;

        if (!file) {
            return NextResponse.json(
                { error: 'Missing required field: file' },
                { status: 400 }
            );
        }

        // Validate file size (10MB max)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File size exceeds 10MB limit' },
                { status: 400 }
            );
        }

        // Clean filename and create path
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = path
            ? `${path}/${Date.now()}_${cleanFileName}`
            : `uploads/${Date.now()}_${cleanFileName}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to B2
        const command = new PutObjectCommand({
            Bucket: B2_CONFIG.bucketName,
            Key: filePath,
            Body: buffer,
            ContentType: file.type,
        });

        await b2Client.send(command);

        // Construct public URL
        const publicUrl = `${B2_CONFIG.endpoint}/${B2_CONFIG.bucketName}/${filePath}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            fileName: file.name,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json(
            { error: 'Failed to upload file' },
            { status: 500 }
        );
    }
}
