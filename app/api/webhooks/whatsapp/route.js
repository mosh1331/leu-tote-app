// app/api/webhooks/whatsapp/route.js
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Helper to push failure alerts to your phone via ntfy
async function alertAdminWhatsAppFailure({ recipient, errorTitle, errorDetails, errorCode }) {

    console.log(`[WHATSAPP ALERT] Delivery to ${recipient} failed: ${errorTitle} (${errorCode}) - ${errorDetails}`);
  const topic = process.env.NTFY_TOPIC;
  if (!topic) return;

  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Title': `WhatsApp Delivery Failed (${errorCode || 'ERR'})`,
        'Priority': 'high',
        'Tags': 'warning,speech_balloon',
      },
      body: `To: ${recipient}\nReason: ${errorTitle}\nDetails: ${errorDetails}`,
    });
  } catch (err) {
    console.error('[NTFY WHATSAPP ALERT ERROR]:', err);
  }
}

/**
 * 1. GET Handler: Meta Webhook Verification Challenge
 */
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[WHATSAPP WEBHOOK] Verified successfully by Meta.');
    return new Response(challenge, { status: 200 });
  }

  return NextResponse.json({ error: 'Forbidden: Invalid verify token' }, { status: 403 });
}

/**
 * 2. POST Handler: Receive Delivery Statuses & Post-Acceptance Failures
 */
export async function POST(req) {
  const db = getDb();

  try {
    const body = await req.json();

    // Ensure payload originates from WhatsApp Business Account
    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ received: true }, { status: 200 });
    }

    for (const entry of body.entry || []) {
      for (const change of entry.changes || []) {
        const value = change.value;

        // Process message delivery status callbacks (sent, delivered, read, failed)
        if (value?.statuses && Array.isArray(value.statuses)) {
          for (const statusObj of value.statuses) {
            const wamid = statusObj.id;
            const deliveryStatus = (statusObj.status || '').toUpperCase(); // 'SENT', 'DELIVERED', 'READ', 'FAILED'
            const recipientId = statusObj.recipient_id;
            const errors = statusObj.errors || [];

            console.log(`[WHATSAPP WEBHOOK STATUS] wamid=${wamid} status=${deliveryStatus}`, errors);

            // Map Meta status to our PostgreSQL ENUM
            let dbStatus = 'SENT';
            if (deliveryStatus === 'DELIVERED') dbStatus = 'DELIVERED';
            else if (deliveryStatus === 'READ') dbStatus = 'READ';
            else if (deliveryStatus === 'FAILED') dbStatus = 'FAILED';

            // Update notifications_log row matching this wamid
            await db.query(
              `UPDATE notifications_log
               SET status = $1,
                   provider_response = COALESCE(provider_response, '{}'::jsonb) || $2::jsonb,
                   sent_at = COALESCE(sent_at, NOW())
               WHERE provider_message_id = $3`,
              [
                dbStatus,
                JSON.stringify({ webhook_status: statusObj }),
                wamid,
              ]
            );

            // If Meta failed delivery after accepting, extract reason and alert admin phone
            if (deliveryStatus === 'FAILED') {
              const primaryError = errors[0] || {};
              const errorCode = primaryError.code || 'UNKNOWN';
              const errorTitle = primaryError.title || 'Delivery rejected by Meta';
              const errorDetails = primaryError.error_data?.details || primaryError.message || 'Check Meta Business Billing or Recipient WhatsApp status';

              await alertAdminWhatsAppFailure({
                recipient: recipientId,
                errorCode,
                errorTitle,
                errorDetails,
              });
            }
          }
        }
      }
    }

    // Meta requires an immediate HTTP 200 OK response within 5 seconds
    return NextResponse.json({ status: 'ok' }, { status: 200 });
  } catch (error) {
    console.error('[WHATSAPP WEBHOOK ERROR]:', error);
    // Still return 200 so Meta does not repeatedly retry malformed payloads
    return NextResponse.json({ status: 'error_logged' }, { status: 200 });
  }
}