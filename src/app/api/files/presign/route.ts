import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const B2_CONFIG = {
    keyId: '005b3c970d8861d0000000002',
    applicationKey: 'K005LedBsyGZVJKjx2YJf6MjQaE81+U',
    endpoint: 'https://s3.us-east-005.backblazeb2.com',
    bucketName: 'oraninve',
    region: 'us-east-005',
};

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
        const { fileType, filePath } = await request.json();

        if (!filePath) {
            return NextResponse.json({ error: 'Missing file path parameter' }, { status: 400 });
        }

        const command = new PutObjectCommand({
            Bucket: B2_CONFIG.bucketName,
            Key: filePath,
            ContentType: fileType || 'application/octet-stream',
        });

        // Generate Presigned URL valid for 1 hour
        const signedUrl = await getSignedUrl(b2Client, command, { expiresIn: 3600 });
        const publicUrl = `${B2_CONFIG.endpoint}/${B2_CONFIG.bucketName}/${filePath}`;

        return NextResponse.json({ success: true, signedUrl, publicUrl });
    } catch (error) {
        console.error('Presign URL error:', error);
        return NextResponse.json({ error: 'Failed to generate upload URL' }, { status: 500 });
    }
}
