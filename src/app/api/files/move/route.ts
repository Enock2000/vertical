import { NextRequest, NextResponse } from 'next/server';
import { S3Client, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

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
        const { sourcePath, destPath, deleteOriginal } = await request.json();

        if (!sourcePath || !destPath) {
            return NextResponse.json({ error: 'Missing sourcePath or destPath' }, { status: 400 });
        }

        // Copy the file
        const copyCommand = new CopyObjectCommand({
            Bucket: B2_CONFIG.bucketName,
            CopySource: `${B2_CONFIG.bucketName}/${sourcePath}`,
            Key: destPath,
        });

        await b2Client.send(copyCommand);

        // If it's a move, delete the original
        if (deleteOriginal) {
            const deleteCommand = new DeleteObjectCommand({
                Bucket: B2_CONFIG.bucketName,
                Key: sourcePath,
            });
            await b2Client.send(deleteCommand);
        }

        const publicUrl = `${B2_CONFIG.endpoint}/${B2_CONFIG.bucketName}/${destPath}`;

        return NextResponse.json({
            success: true,
            url: publicUrl,
            path: destPath,
        });
    } catch (error) {
        console.error('Move/copy error:', error);
        return NextResponse.json({ error: 'Failed to move/copy file' }, { status: 500 });
    }
}
