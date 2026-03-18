import { NextRequest, NextResponse } from 'next/server';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

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
        const { paths } = await request.json();

        if (!paths || !Array.isArray(paths) || paths.length === 0) {
            return NextResponse.json({ error: 'Missing file paths' }, { status: 400 });
        }

        const results: Array<{ path: string; success: boolean; error?: string }> = [];

        for (const path of paths) {
            try {
                const command = new DeleteObjectCommand({
                    Bucket: B2_CONFIG.bucketName,
                    Key: path,
                });
                await b2Client.send(command);
                results.push({ path, success: true });
            } catch (err) {
                results.push({
                    path,
                    success: false,
                    error: err instanceof Error ? err.message : 'Delete failed',
                });
            }
        }

        return NextResponse.json({ success: true, results });
    } catch (error) {
        console.error('Delete error:', error);
        return NextResponse.json({ error: 'Failed to delete files' }, { status: 500 });
    }
}
