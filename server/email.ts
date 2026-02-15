import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY
    ? 'repl ' + process.env.REPL_IDENTITY
    : process.env.WEB_REPL_RENEWAL
    ? 'depl ' + process.env.WEB_REPL_RENEWAL
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendPasswordResetEmail(toEmail: string, code: string) {
  const { client, fromEmail } = await getResendClient();

  await client.emails.send({
    from: fromEmail || 'TakeSale <noreply@resend.dev>',
    to: toEmail,
    subject: 'TakeSale — Код восстановления пароля',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0;">TakeSale</h1>
        </div>
        <p style="color: #333; font-size: 16px; line-height: 1.5;">Вы запросили восстановление пароля. Используйте код ниже:</p>
        <div style="background: #f4f4f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
          <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #1a1a1a; font-family: monospace;">${code}</span>
        </div>
        <p style="color: #666; font-size: 14px; line-height: 1.5;">Код действует <strong>10 минут</strong>.</p>
        <p style="color: #999; font-size: 13px; line-height: 1.5; margin-top: 24px;">Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
      </div>
    `,
  });
}
