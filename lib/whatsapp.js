// lib/whatsapp.js

const WHATSAPP_API_URL = 'https://graph.facebook.com/v20.0';

/**
 * 1. Send Order In Transit / Shipped WhatsApp Message
 */
export async function sendOrderShippedWhatsApp({
  toPhone,
  customerName,
  orderId,
  courierName,
  trackingId,
  trackingUrl,
}) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.error('[WHATSAPP CONFIG ERROR] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in env.');
    return { success: false, reason: 'Credentials missing in environment variables' };
  }

  // Sanitize: Take last 10 digits and prefix with 91 for India
  const cleanPhone = toPhone.replace(/\D/g, '').slice(-10);
  const recipient = `91${cleanPhone}`;

  const payload = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'template',
    template: {
      name: 'shipping_order_1', // Must match the approved template name in Meta WhatsApp Manager exactly
      language: { code: 'en_US' },   // Must match the exact approved language code (e.g. 'en_US' or 'en')
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName || 'Valued Customer' },
            { type: 'text', text: orderId.slice(0, 8).toUpperCase() },
            { type: 'text', text: courierName || 'Courier' },
            { type: 'text', text: trackingId || 'N/A' },
            {
              type: 'text',
              text: trackingUrl || `${process.env.NEXT_PUBLIC_SITE_URL || 'https://leutote.com'}/checkout/success?orderId=${orderId}`,
            },
          ],
        },
      ],
    },
  };

  try {
    const res = await fetch(`https://graph.facebook.com/v20.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[META GRAPH API ERROR]:', JSON.stringify(data, null, 2));
      return { success: false, error: data?.error?.message || 'Meta API returned an error', data };
    }

    return { success: true, data };
  } catch (err) {
    console.error('[WHATSAPP FETCH FAILED]:', err);
    return { success: false, error: err.message };
  }
}

/**
 * 2. Send WhatsApp OTP Verification Message (Authentication Template)
 */
export async function sendWhatsAppOtpMessage(toPhone, otpCode) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneId) return { success: false, reason: 'Credentials missing' };

  const cleanPhone = toPhone.replace(/\D/g, '').slice(-10);
  const recipient = `91${cleanPhone}`;

  const payload = {
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
  };

  try {
    const res = await fetch(`${WHATSAPP_API_URL}/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    return { success: res.ok, data };
  } catch (err) {
    console.error('WhatsApp OTP Error:', err);
    return { success: false, error: err.message };
  }
}