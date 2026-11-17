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
  pointsEarned = 0,
}) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.error('[WHATSAPP CONFIG ERROR] Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in env.');
    return { success: false, reason: 'Credentials missing in environment variables' };
  }

  const cleanPhone = toPhone.replace(/\D/g, '').slice(-10);
  const recipient = `91${cleanPhone}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://leutote.store';
  const finalTrackingUrl = trackingUrl || 'https://www.indiapost.gov.in/';
  const orderDetailsUrl = `${siteUrl}/orders/${orderId}`;

  const payload = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'template',
    template: {
      name: 'order_shipped_update_1',
      language: { code: 'en' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: customerName || 'Valued Customer' }, // {{1}}
            { type: 'text', text: orderId.slice(0, 8).toUpperCase() },  // {{2}}
            { type: 'text', text: courierName || 'India Post' },       // {{3}}
            { type: 'text', text: trackingId || 'N/A' },               // {{4}}
            { type: 'text', text: String(pointsEarned) },              // {{5}}
          ],
        },
        // Button 0: "Track Order" (Include if configured with a dynamic URL suffix in Meta)
     
        // Button 1: "Order Details" (Appends UUID to your base URL e.g. https://leutote.com/orders/{{1}})
        {
          type: 'button',
          sub_type: 'url',
          index: '1',
          parameters: [
            { type: 'text', text: orderDetailsUrl },
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