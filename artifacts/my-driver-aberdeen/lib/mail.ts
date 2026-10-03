const fromAddress = "My Driver Aberdeen <info@mydriver-aberdeen.co.uk>";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function emailShell(body: string) {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>My Driver Aberdeen</title>
</head>
<body style="margin:0;padding:0;background:#10232b;color-scheme:light">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#10232b" style="background:#10232b">
  <tr>
    <td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#fbf9f4" style="max-width:520px;background:#fbf9f4">
        <tr>
          <td bgcolor="#d7b77e" height="3" style="height:3px;background:#d7b77e;font-size:0;line-height:0">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:36px 32px 40px;font-family:Georgia,'Times New Roman',serif;color:#172c35">
            <p style="margin:0;font-size:13px;letter-spacing:0.22em;text-transform:uppercase;color:#172c35">My Driver Aberdeen</p>
            <p style="margin:10px 0 0;font-size:13px;line-height:1.4;color:#647278">Private hire, with a personal touch</p>
            ${body}
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

export async function sendVerificationCode(email: string, code: string) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false as const, error: "Email is not configured yet." };

  const html = emailShell(
    `<p style="margin:28px 0 0;font-size:18px;line-height:1.45;color:#172c35">Your verification code</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:22px 0 4px">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:40px;line-height:1;letter-spacing:0.32em;color:#97743d;padding-left:0.32em">${escapeHtml(code)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#647278">It expires in 10 minutes. If you did not ask to create an account, you can ignore this email.</p>`,
  );

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [email],
      subject: "Your verification code",
      text: `Your My Driver Aberdeen verification code is ${code}.\n\nIt expires in 10 minutes. If you did not ask to create an account, you can ignore this email.`,
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const message = detail && typeof detail === "object" && "message" in detail ? detail.message : "";
    console.error("Resend rejected an email", response.status, message);
    return { ok: false as const, error: "We could not send the email. Try again in a moment." };
  }

  return { ok: true as const };
}

export async function sendNotice(email: string, subject: string, paragraphs: string[]) {
  const key = process.env.RESEND_API_KEY;
  const to = email.trim();
  if (!key || !to) return { ok: false as const, error: "Email is not configured yet." };
  const text = paragraphs.join("\n\n");
  const html = emailShell(
    paragraphs
      .map((paragraph) => `<p style="margin:18px 0 0;font-size:16px;line-height:1.6;color:#172c35">${escapeHtml(paragraph)}</p>`)
      .join(""),
  );
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromAddress,
      to: [to],
      subject,
      text,
      html,
    }),
  });
  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const message = detail && typeof detail === "object" && "message" in detail ? detail.message : "";
    console.error("Resend rejected an email", response.status, message);
    return { ok: false as const, error: "We could not send the email. Try again in a moment." };
  }
  return { ok: true as const };
}
