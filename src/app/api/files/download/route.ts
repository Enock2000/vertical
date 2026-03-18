import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
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
        const { path, fileName } = await request.json();

        if (!path) {
            return NextResponse.json({ error: 'Missing file path' }, { status: 400 });
        }

        const command = new GetObjectCommand({
            Bucket: B2_CONFIG.bucketName,
            Key: path,
            ResponseContentDisposition: fileName
                ? `attachment; filename="${encodeURIComponent(fileName)}"`
                : undefined,
        });

        const signedUrl = await getSignedUrl(b2Client, command, { expiresIn: 3600 });

        return NextResponse.json({ success: true, url: signedUrl });
    } catch (error) {
        console.error('Download URL error:', error);
        return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 });
    }
}
