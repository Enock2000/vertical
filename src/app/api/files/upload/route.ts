import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];
        const companyId = formData.get('companyId') as string;
        const folderId = formData.get('folderId') as string;

        if (!files || files.length === 0) {
            return NextResponse.json({ error: 'No files provided' }, { status: 400 });
        }

        if (!companyId) {
            return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
        }

        const maxSize = 50 * 1024 * 1024; // 50MB
        const uploadedFiles: Array<{ url: string; path: string; name: string; size: number; mimeType: string }> = [];

        for (const file of files) {
            if (file.size > maxSize) {
                return NextResponse.json(
                    { error: `File "${file.name}" exceeds 50MB limit` },
                    { status: 400 }
                );
            }

            const cleanFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const filePath = `drive/${companyId}/${Date.now()}_${cleanFileName}`;

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);

            const command = new PutObjectCommand({
                Bucket: B2_CONFIG.bucketName,
                Key: filePath,
                Body: buffer,
                ContentType: file.type,
            });

            await b2Client.send(command);

            const publicUrl = `${B2_CONFIG.endpoint}/${B2_CONFIG.bucketName}/${filePath}`;

            uploadedFiles.push({
                url: publicUrl,
                path: filePath,
                name: file.name,
                size: file.size,
                mimeType: file.type || 'application/octet-stream',
            });
        }

        return NextResponse.json({ success: true, files: uploadedFiles });
    } catch (error) {
        console.error('Drive upload error:', error);
        return NextResponse.json({ error: 'Failed to upload files' }, { status: 500 });
    }
}
