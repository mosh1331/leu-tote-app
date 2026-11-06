// lib/otpService.js
import crypto from 'crypto';
import { getDb } from '@/lib/db';

export function generateNumericOtp(length = 6) {
  return Math.floor(100000 + Math.random() * 900000).toString().substring(0, length);
}

export function hashString(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// 1. Send SMS via Fast2SMS
export async function sendFast2Sms(phone, otpCode) {
  const apiKey = process.env.FAST2SMS_API_KEY;
  const cleanPhone = phone.replace(/\D/g, '').slice(-10);

  const url = `https://www.fast2sms.com/dev/bulkV2?authorization=${apiKey}&route=q&message=${encodeURIComponent(
    `Your Leu Tote verification code is: ${otpCode}. Valid for 10 minutes.`
  )}&language=english&flash=0&numbers=${cleanPhone}`;

  const res = await fetch(url, { method: 'GET' });
  const data = await res.json();
  return { success: data.return === true, data };
}

// 2. Send via Meta WhatsApp API
export async function sendWhatsAppOtp(phone, otpCode) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { success: false, reason: 'WhatsApp not configured' };

  const cleanPhone = phone.replace(/\D/g, '');
  const recipient = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: recipient,
      type: 'template',
      template: {
        name: 'order_verification_otp',
        language: { code: 'en_US' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: otpCode }],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: otpCode }],
          },
        ],
      },
    }),
  });

  const data = await res.json();
  return { success: res.ok, data };
}