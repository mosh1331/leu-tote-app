// lib/ntfy.js
export async function sendOrderAdminAlert({
  orderId,
  finalPayable,
  customerName,
  phone,
  city,
  state,
  itemCount,
}) {
  const topic = process.env.NTFY_TOPIC;
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

  if (!topic) {
    console.error('[NTFY ERROR] NTFY_TOPIC environment variable is not defined!');
    return { success: false, reason: 'NTFY_TOPIC missing' };
  }

  const shortId = orderId ? orderId.slice(0, 8).toUpperCase() : 'NEW';
  
  // Use pure ASCII characters for the header Title to avoid Node fetch ByteString errors
  const safeTitle = `New Order: Rs. ${Number(finalPayable).toLocaleString()} (#${shortId})`;
  const bodyText = `Customer: ${customerName} (${phone})\nLocation: ${city}, ${state}\nItems: ${itemCount} bag(s)\nAmount: Rs. ${finalPayable}`;

  try {
    const res = await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Title': safeTitle,
        'Priority': 'urgent',
        'Tags': 'shopping_bags,tada', // Tags automatically add the emojis without breaking header encoding
        'Click': `${baseUrl}/admin`,
      },
      body: bodyText,
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('[NTFY HTTP ERROR]:', res.status, errText);
      return { success: false, status: res.status, error: errText };
    }

    console.log('[NTFY SUCCESS] Alert published to topic:', topic);
    return { success: true };
  } catch (err) {
    console.error('[NTFY DISPATCH EXCEPTION]:', err);
    return { success: false, error: err.message };
  }
}