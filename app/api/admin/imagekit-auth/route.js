// app/api/admin/imagekit-auth/route.js
import { NextResponse } from 'next/server';
import ImageKit from 'imagekit';
import crypto from 'crypto';

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
});

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Generate a high-entropy UUID v4 token
    const uniqueToken = crypto.randomUUID();
    
    // Pass custom token to getAuthenticationParameters
    const authParams = imagekit.getAuthenticationParameters(uniqueToken);
    
    return NextResponse.json(authParams);
  } catch (error) {
    console.error('ImageKit auth error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}