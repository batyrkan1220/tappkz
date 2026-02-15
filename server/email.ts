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

  const senderAddress = (fromEmail && !fromEmail.includes('gmail.com') && !fromEmail.includes('yahoo.com') && !fromEmail.includes('mail.ru') && !fromEmail.includes('yandex.'))
    ? fromEmail
    : 'Tapp <onboarding@resend.dev>';

  await client.emails.send({
    from: senderAddress,
    to: toEmail,
    subject: 'Tapp — Код восстановления пароля',
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="font-size: 24px; font-weight: 700; color: #1a1a1a; margin: 0;">Tapp</h1>
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

function wrapEmailHtml(subject: string, body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; padding: 32px 16px;">
    <div style="background: #ffffff; border-radius: 12px; padding: 32px 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
      <div style="text-align: center; margin-bottom: 24px; padding-bottom: 20px; border-bottom: 1px solid #e4e4e7;">
        <h1 style="font-size: 22px; font-weight: 700; color: #1a1a1a; margin: 0;">Tapp</h1>
      </div>
      ${body}
    </div>
    <div style="text-align: center; padding: 20px 0 0; color: #a1a1aa; font-size: 12px;">
      <p style="margin: 0;">Вы получили это письмо, потому что зарегистрированы на tapp.kz</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendBroadcastEmail(
  toEmails: string[],
  subject: string,
  htmlBody: string,
  onProgress?: (success: number, fail: number) => void
): Promise<{ success: number; fail: number }> {
  const { client, fromEmail } = await getResendClient();
  const from = (fromEmail && !fromEmail.includes('gmail.com') && !fromEmail.includes('yahoo.com') && !fromEmail.includes('mail.ru') && !fromEmail.includes('yandex.'))
    ? fromEmail
    : 'Tapp <onboarding@resend.dev>';
  const wrappedHtml = wrapEmailHtml(subject, htmlBody);

  let success = 0;
  let fail = 0;

  const BATCH_SIZE = 10;
  for (let i = 0; i < toEmails.length; i += BATCH_SIZE) {
    const batch = toEmails.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(email =>
        client.emails.send({
          from,
          to: email,
          subject,
          html: wrappedHtml,
        })
      )
    );

    for (const r of results) {
      if (r.status === "fulfilled" && r.value?.data?.id) {
        success++;
      } else {
        fail++;
      }
    }

    if (onProgress) onProgress(success, fail);

    if (i + BATCH_SIZE < toEmails.length) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return { success, fail };
}
