import { site } from "@/lib/site";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  replyTo?: string;
}) {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false as const, error: "Email is not configured yet." };

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `My Driver Aberdeen <${site.email}>`,
      to: [input.to],
      subject: input.subject,
      text: input.text,
      html: input.html,
      reply_to: input.replyTo,
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

function emailShell(body: string) {
  return `<!DOCTYPE html>
<html lang="en-GB">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(site.name)}</title>
</head>
<body style="margin:0;padding:0;background:#000000;color-scheme:light">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#000000" style="background:#000000">
  <tr>
    <td align="center" style="padding:32px 16px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f4efe6" style="max-width:520px;background:#f4efe6">
        <tr>
          <td bgcolor="#d4b46a" height="3" style="height:3px;background:#d4b46a;font-size:0;line-height:0">&nbsp;</td>
        </tr>
        <tr>
          <td style="padding:36px 32px 40px;font-family:Georgia,'Times New Roman',serif;color:#1c1915">
            <p style="margin:0;font-size:13px;letter-spacing:0.22em;text-transform:uppercase;color:#1c1915">${escapeHtml(site.name)}</p>
            <p style="margin:10px 0 0;font-size:13px;line-height:1.4;color:#6f675c">${escapeHtml(site.tagline)}</p>
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

function detailTable(rows: { label: string; value: string }[]) {
  const cells = rows
    .map(
      (row) => `<tr>
        <td width="112" valign="top" style="width:112px;padding:14px 12px 14px 0;border-bottom:1px solid #e6ddd0;font-family:Georgia,'Times New Roman',serif;font-size:11px;line-height:1.4;letter-spacing:0.14em;text-transform:uppercase;color:#6f675c">${escapeHtml(row.label)}</td>
        <td valign="top" style="padding:12px 0;border-bottom:1px solid #e6ddd0;font-family:Georgia,'Times New Roman',serif;font-size:16px;line-height:1.45;color:#1c1915">${escapeHtml(row.value)}</td>
      </tr>`,
    )
    .join("");
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:22px 0 0;border-top:1px solid #e6ddd0">${cells}</table>`;
}

function hireRows(input: { dateLabel: string; time: string; pickup: string; destination: string; note: string }) {
  return [
    { label: "Date", value: input.dateLabel },
    { label: "Time", value: input.time },
    { label: "Pickup", value: input.pickup },
    { label: "Destination", value: input.destination },
    { label: "Note", value: input.note || "None" },
  ];
}

export function verificationEmailHtml(code: string) {
  return emailShell(
    `<p style="margin:28px 0 0;font-size:18px;line-height:1.45;color:#1c1915">Your verification code</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding:22px 0 4px">
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:40px;line-height:1;letter-spacing:0.32em;color:#8a6840;padding-left:0.32em">${escapeHtml(code)}</p>
        </td>
      </tr>
    </table>
    <p style="margin:18px 0 0;font-size:14px;line-height:1.6;color:#6f675c">It expires in 10 minutes. If you did not ask to create an account, you can ignore this email.</p>`,
  );
}

export function memberHireEmailHtml(input: {
  memberName: string;
  dateLabel: string;
  time: string;
  pickup: string;
  destination: string;
  note: string;
}) {
  return emailShell(
    `<p style="margin:28px 0 0;font-size:18px;line-height:1.45;color:#1c1915">Hello ${escapeHtml(input.memberName)},</p>
    <p style="margin:12px 0 0;font-size:16px;line-height:1.6;color:#1c1915">We have received your hire request. It is not confirmed until we contact you.</p>
    ${detailTable(hireRows(input))}
    <p style="margin:22px 0 0;font-size:14px;line-height:1.6;color:#6f675c">We will confirm by phone or text on <a href="tel:${site.phoneTel}" style="color:#1c1915;text-decoration:none;white-space:nowrap">${escapeHtml(site.phoneDisplay)}</a>.</p>`,
  );
}

export function ownerHireEmailHtml(input: {
  memberName: string;
  memberEmail: string;
  dateLabel: string;
  time: string;
  pickup: string;
  destination: string;
  note: string;
}) {
  return emailShell(
    `<p style="margin:28px 0 0;font-size:18px;line-height:1.45;color:#1c1915">${escapeHtml(input.memberName)} requested a hire.</p>
    <p style="margin:8px 0 0;font-size:16px;line-height:1.5;color:#1c1915">Email: <a href="mailto:${encodeURIComponent(input.memberEmail)}" style="color:#1c1915;text-decoration:underline">${escapeHtml(input.memberEmail)}</a></p>
    ${detailTable(hireRows(input))}`,
  );
}

export async function sendVerificationCode(email: string, code: string) {
  return sendEmail({
    to: email,
    subject: "Your verification code",
    text: [
      `Your My Driver Aberdeen verification code is ${code}.`,
      "",
      "It expires in 10 minutes. If you did not ask to create an account, you can ignore this email.",
    ].join("\n"),
    html: verificationEmailHtml(code),
  });
}

export async function sendHireRequestEmails(input: {
  memberName: string;
  memberEmail: string;
  dateLabel: string;
  time: string;
  pickup: string;
  destination: string;
  note: string;
}) {
  const noteLine = input.note ? `Note: ${input.note}` : "Note: none";
  const details = [
    `Date: ${input.dateLabel}`,
    `Time: ${input.time}`,
    `Pickup: ${input.pickup}`,
    `Destination: ${input.destination}`,
    noteLine,
  ];

  const member = await sendEmail({
    to: input.memberEmail,
    subject: "Your hire request",
    text: [
      `Hello ${input.memberName},`,
      "",
      "We have received your hire request. It is not confirmed until we contact you.",
      "",
      ...details,
      "",
      `We will confirm by phone or text on ${site.phoneDisplay}.`,
    ].join("\n"),
    html: memberHireEmailHtml(input),
  });

  const owner = await sendEmail({
    to: site.email,
    replyTo: input.memberEmail,
    subject: `New hire request — ${input.dateLabel}, ${input.time}`,
    text: [
      `${input.memberName} requested a hire.`,
      `Email: ${input.memberEmail}`,
      "",
      ...details,
    ].join("\n"),
    html: ownerHireEmailHtml(input),
  });

  return { ok: member.ok && owner.ok };
}
