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
        const companyId = formData.get('companyId') as string;
        const docType = formData.get('docType') as string;

        if (!file || !companyId || !docType) {
            return NextResponse.json(
                { error: 'Missing required fields: file, companyId, docType' },
                { status: 400 }
            );
        }

        // Validate file size (5MB max)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            return NextResponse.json(
                { error: 'File size exceeds 5MB limit' },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json(
                { error: 'Invalid file type. Only PDF, JPG, PNG allowed' },
                { status: 400 }
            );
        }

        // Clean filename and create path
        const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `verification/${companyId}/${docType}/${Date.now()}_${cleanFileName}`;

        // Convert file to buffer
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Upload to B2
        const command = new PutObjectCommand({
            Bucket: B2_CONFIG.bucketName,
            Key: path,
            Body: buffer,
            ContentType: file.type,
        });

        await b2Client.send(command);

        // Construct public URL
        const publicUrl = `${B2_CONFIG.endpoint}/${B2_CONFIG.bucketName}/${path}`;

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
