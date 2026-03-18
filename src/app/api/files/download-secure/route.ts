import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { ref, get } from 'firebase/database';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import archiver from 'archiver';
// @ts-ignore
import archiverZipEncrypted from 'archiver-zip-encrypted';

archiver.registerFormat('zip-encrypted', archiverZipEncrypted);

const s3 = new S3Client({
  credentials: {
    accessKeyId: process.env.BACKBLAZE_KEY_ID || '0056973e8e97f0c0000000001',
    secretAccessKey: process.env.BACKBLAZE_APP_KEY || 'K005/N46+gC2/7f1dMofh/Q4XgN0L0Q'
  },
  endpoint: process.env.BACKBLAZE_ENDPOINT || 'https://s3.eu-central-003.backblazeb2.com',
  region: process.env.BACKBLAZE_REGION || 'eu-central-003',
  forcePathStyle: true,
});

export async function POST(req: Request) {
  try {
    const { fileId, companyId, password } = await req.json();

    if (!fileId || !companyId || !password) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Verify password in Firebase
    const fileRef = ref(db, `companies/${companyId}/drive/files/${fileId}`);
    const fileSnap = await get(fileRef);
    if (!fileSnap.exists()) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    const fileData = fileSnap.val();
    if (!fileData.isPasswordProtected || !fileData.passwordHash) {
      return NextResponse.json({ error: 'File is not password protected' }, { status: 400 });
    }

    // Hash the provided password (SHA-256) to compare
    const crypto = await import('crypto');
    const hash = crypto.createHash('sha256').update(password).digest('hex');

    if (hash !== fileData.passwordHash) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    // 2. Fetch the file byte stream from B2
    const bucketName = process.env.BACKBLAZE_BUCKET_NAME || 'LencoFilez';
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileData.b2Path,
    });

    const b2Response = await s3.send(command);
    if (!b2Response.Body) {
      throw new Error("Empty body from B2");
    }

    // 3. Create the Encrypted ZIP stream
    // Using node's TransformStream standard allows bridging from the Archiver Node stream to the Web Response stream.
    const { Readable, PassThrough } = await import('stream');
    const passThrough = new PassThrough();
    
    // @ts-ignore - archiver-zip-encrypted adds zip-encrypted format
    const archive = archiver('zip-encrypted', {
      zlib: { level: 8 },
      encryptionMethod: 'aes256',
      password: password,
    });

    archive.on('error', (err) => {
      console.error('Archiver error:', err);
    });

    // Pipe the archive down to the PassThrough stream
    archive.pipe(passThrough);

    // Append the B2 read stream into the archive as the original file
    archive.append(b2Response.Body as any, { name: fileData.name });

    // Finalize the archive (this will end the passThrough stream when done)
    archive.finalize();

    // Convert Node PassThrough stream to Web ReadableStream for Next.js Response
    // @ts-ignore
    const webStream = Readable.toWeb(passThrough);

    return new Response(webStream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileData.name}.zip"`,
      },
    });

  } catch (error: any) {
    console.error('Secure download error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
