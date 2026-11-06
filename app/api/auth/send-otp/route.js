// app/api/auth/send-otp/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { generateNumericOtp, hashString, sendFast2Sms, sendWhatsAppOtp } from '@/lib/otpService';

export async function POST(req) {
  const db = getDb();
  try {
    const { phone, channel = 'SMS' } = await req.json();

    if (!phone || !/^[6-9]\d{9}$/.test(phone.slice(-10))) {
      return NextResponse.json({ error: 'Valid 10-digit Indian phone number required' }, { status: 400 });
    }

    const cleanPhone = phone.slice(-10);

    // Rate limiting: check recent OTPs in the last 60 seconds
    const rateCheck = await db.query(
      `SELECT created_at FROM phone_otps 
       WHERE phone = $1 AND created_at > NOW() - INTERVAL '60 seconds' 
       ORDER BY created_at DESC LIMIT 1`,
      [cleanPhone]
    );

    if (rateCheck.rowCount > 0) {
      return NextResponse.json({ error: 'Please wait 60 seconds before requesting another code' }, { status: 429 });
    }

    const otpCode = generateNumericOtp(6);
    const otpHash = hashString(otpCode);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    let dispatchResult;
    let usedChannel = channel;

    if (channel === 'WHATSAPP') {
      dispatchResult = await sendWhatsAppOtp(cleanPhone, otpCode);
      if (!dispatchResult.success) {
        // Fallback to SMS if WhatsApp fails
        dispatchResult = await sendFast2Sms(cleanPhone, otpCode);
        usedChannel = 'SMS';
      }
    } else {
      // Primary: Fast2SMS
      dispatchResult = await sendFast2Sms(cleanPhone, otpCode);
    }

    // Save hash to database
    await db.query(
      `INSERT INTO phone_otps (phone, otp_hash, channel, expires_at)
       VALUES ($1, $2, $3, $4)`,
      [cleanPhone, otpHash, usedChannel, expiresAt]
    );

    return NextResponse.json({
      success: true,
      channel: usedChannel,
      message: `OTP sent via ${usedChannel}`,
    });
  } catch (error) {
    console.error('Send OTP Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}