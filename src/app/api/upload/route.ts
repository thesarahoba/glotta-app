import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { createHash } from 'crypto';

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

// POST /api/upload — upload a product image to Cloudinary
export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return NextResponse.json({ error: 'Image upload not configured' }, { status: 503 });
  }

  let fd: FormData;
  try {
    fd = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const file = fd.get('file');
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json(
      { error: 'Only JPEG, PNG, WebP, and GIF images are allowed' },
      { status: 400 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 });
  }

  // Build Cloudinary signed upload
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = 'glotta/products';

  // Signature: SHA-1 of "folder={f}&timestamp={ts}{secret}" (params sorted alphabetically)
  const signature = createHash('sha1')
    .update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`)
    .digest('hex');

  const upload = new FormData();
  upload.set('file', file);
  upload.set('api_key', apiKey);
  upload.set('timestamp', String(timestamp));
  upload.set('signature', signature);
  upload.set('folder', folder);

  let result: Response;
  try {
    result = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: 'POST', body: upload }
    );
  } catch {
    return NextResponse.json({ error: 'Could not reach upload service' }, { status: 502 });
  }

  const data = (await result.json()) as { secure_url?: string; error?: { message: string } };

  if (!result.ok || !data.secure_url) {
    return NextResponse.json(
      { error: data.error?.message ?? 'Upload failed' },
      { status: 502 }
    );
  }

  return NextResponse.json({ url: data.secure_url });
}
