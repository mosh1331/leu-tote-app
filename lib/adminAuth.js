// lib/adminAuth.js

export async function generateAdminToken(pin, secret) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  // Format: "timestamp:signature"
  const timestamp = Date.now().toString();
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    keyMaterial,
    enc.encode(`${pin}:${timestamp}`)
  );
  
  const signatureHex = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return `${timestamp}.${signatureHex}`;
}

export async function verifyAdminToken(token, pin, secret) {
  if (!token || !token.includes('.')) return false;
  
  const [timestamp, incomingSig] = token.split('.');
  const time = parseInt(timestamp, 10);
  
  // Expire after 7 days (7 * 24 * 60 * 60 * 1000)
  if (isNaN(time) || Date.now() - time > 7 * 24 * 60 * 60 * 1000) {
    return false;
  }

  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    keyMaterial,
    enc.encode(`${pin}:${timestamp}`)
  );
  
  const expectedSig = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return incomingSig === expectedSig;
}