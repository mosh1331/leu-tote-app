// app/api/auth/send-otp/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { sendWhatsAppOtpMessage } from '@/lib/whatsapp';
import crypto from 'crypto';

function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

export async function POST(req) {
  const db = getDb();
  try {
    const { phone } = await req.json();

    if (!phone || !/^[6-9]\d{9}$/.test(phone.slice(-10))) {
      return NextResponse.json({ error: 'Valid 10-digit Indian mobile number required' }, { status: 400 });
    }

    const cleanPhone = phone.slice(-10);

    // Rate limiting: 60 seconds cooldown between OTP requests
    const recentOtp = await db.query(
      `SELECT created_at FROM phone_otps 
       WHERE phone = $1 AND created_at > NOW() - INTERVAL '60 seconds' 
       ORDER BY created_at DESC LIMIT 1`,
      [cleanPhone]
    );

    if (recentOtp.rowCount > 0) {
      return NextResponse.json({ error: 'Please wait 60 seconds before requesting another code' }, { status: 429 });
    }

    // Generate 6-digit numeric OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashString(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

    // Dispatch via WhatsApp Authentication Template
    let waResult = await sendWhatsAppOtpMessage(cleanPhone, otpCode);

    // Save hash to database
    await db.query(
      `INSERT INTO phone_otps (phone, otp_hash, channel, expires_at)
       VALUES ($1, $2, 'WHATSAPP', $3)`,
      [cleanPhone, otpHash, expiresAt]
    );

    return NextResponse.json({
      success: true,
      message: 'Verification code sent via WhatsApp',
    });
  } catch (error) {
    console.error('Send Auth OTP Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 500 });
  }
}