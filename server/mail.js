/**
 * Email delivery. RIFQ Muslim never claims a message was sent unless the
 * provider accepted it. Configure RESEND_API_KEY (and optionally MAIL_FROM)
 * in Settings -> Environment variables to enable real delivery.
 */
export function mailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendEmail({ to, subject, text, html }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM || 'RIFQ Muslim <onboarding@resend.dev>';
  if (!key) {
    return {
      delivered: false,
      reason:
        'Email delivery is not configured yet. Add RESEND_API_KEY (and MAIL_FROM) in Settings → Environment variables to enable real email sending.',
    };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject, text, html }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { delivered: false, reason: data?.message || `Email provider returned ${res.status}.` };
    }
    return { delivered: true, id: data?.id || null };
  } catch {
    return { delivered: false, reason: 'Email provider could not be reached.' };
  }
}
