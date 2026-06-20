/**
 * Email service for FusionZone.
 * Handles transactional emails including invitations, password resets, and notifications.
 */

import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const productionEmailApproved = process.env.ALLOW_PRODUCTION_EMAIL === "true";
const emailDeliveryEnabled = Boolean(resendApiKey) &&
  (process.env.VERCEL_ENV !== "production" || productionEmailApproved);

// Priority order for From address:
// 1. RESEND_FROM_EMAIL (explicitly configured verified sender)
// 2. BUSINESS_EMAIL (the store's business email)
// 3. Fallback to Resend's default test sender (onboarding@resend.dev) - always available
const RESEND_FROM = process.env.RESEND_FROM_EMAIL || process.env.BUSINESS_EMAIL || "FusionZone <onboarding@resend.dev>";
const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO_EMAIL || process.env.RESEND_REPLY_TO || process.env.BUSINESS_EMAIL || "sales@fusionzone.example";

import { getAppUrl } from "./app-url";
const appUrl = getAppUrl();
const withStagingPrefix = (subject: string) =>
  process.env.VERCEL_ENV === "production" || subject.startsWith("[FUSIONZONE TEST]")
    ? subject
    : `[FUSIONZONE TEST] ${subject}`;

// Initialize Resend only if API key is available
const resend = emailDeliveryEnabled ? new Resend(resendApiKey!) : null;

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded
  contentType: string;
}

interface EmailWithAttachmentOptions extends EmailOptions {
  attachments: EmailAttachment[];
}

/**
 * Send an email using Resend.
 * Falls back to console logging in development without API key.
 */
export async function sendEmail(options: EmailOptions): Promise<void> {
  const { to, html, text } = options;
  const subject = withStagingPrefix(options.subject);

  // Log email in development
  if (!resend) {
    console.log("\n========== EMAIL (Development Mode) ==========");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Text: ${text || "N/A"}`);
    console.log("==============================================\n");
    return;
  }

  try {
    const result = await resend.emails.send({
      from: RESEND_FROM,
      replyTo: RESEND_REPLY_TO,
      to,
      subject,
      html,
      text,
    });

    if (result.error) {
      // Check for common Resend domain verification errors
      const errMsg = result.error.message || "";
      if (errMsg.includes("domain is not verified") || errMsg.includes("verify your domain")) {
        console.error("[Email] Domain verification error. From address used:", RESEND_FROM);
        console.error("[Email] To fix: Add RESEND_FROM_EMAIL with a verified sender (e.g. on a verified domain).");
        throw new Error(
          "Email could not be sent because the sender domain is not verified. " +
          "Please verify the domain in Resend or set the RESEND_FROM_EMAIL environment variable " +
          "with a verified sender address."
        );
      }
      throw new Error(`Email failed: ${errMsg}`);
    }

    console.log(`[Email] Sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("[Email] Failed to send:", error);
    throw error;    }
}

/**
 * Send an email with attachments using Resend.
 * Falls back to console logging in development without API key.
 */
export async function sendEmailWithAttachment(options: EmailWithAttachmentOptions): Promise<void> {
  const { to, html, text, attachments } = options;
  const subject = withStagingPrefix(options.subject);

  // Log email in development
  if (!resend) {
    console.log("\n========== EMAIL WITH ATTACHMENT (Development Mode) ==========");
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Attachments: ${attachments.map((a) => a.filename).join(", ")}`);
    console.log("==============================================================\n");
    return;
  }

  try {
    const result = await resend.emails.send({
      from: RESEND_FROM,
      replyTo: RESEND_REPLY_TO,
      to,
      subject,
      html,
      text,
      attachments: attachments.map((att) => ({
        filename: att.filename,
        content: att.content, // base64
      })),
    });

    if (result.error) {
      // Check for common Resend domain verification errors
      const errMsg = result.error.message || "";
      if (errMsg.includes("domain is not verified") || errMsg.includes("verify your domain")) {
        console.error("[Email] Domain verification error. From address used:", RESEND_FROM);
        console.error("[Email] To fix: Add RESEND_FROM_EMAIL with a verified sender (e.g. on a verified domain).");
        throw new Error(
          "Email could not be sent because the sender domain is not verified. " +
          "Please verify the domain in Resend or set the RESEND_FROM_EMAIL environment variable " +
          "with a verified sender address."
        );
      }
      throw new Error(`Email failed: ${errMsg}`);
    }

    console.log(`[Email] Sent with attachments to ${to}: ${subject}`);
  } catch (error) {
    console.error("[Email] Failed to send with attachments:", error);
    throw error;
  }
}

// ============== WELCOME EMAIL ==============

interface WelcomeEmailParams {
  to: string;
  name: string;
  storeName?: string;
}

export async function sendWelcomeEmail(params: WelcomeEmailParams): Promise<void> {
  const { to, name, storeName = "FusionZone" } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to ${storeName}</title>
  <style>
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #111; background: #f7f7f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #0d41e2; padding: 40px 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .content h2 { color: #111; font-size: 20px; margin-top: 0; }
    .footer { background: #111; color: #9a9a9a; padding: 30px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${storeName}</h1>
    </div>
    <div class="content">
      <h2>Welcome, ${name}!</h2>
      <p>Your ${storeName} account has been created. You can now sign in to the dashboard.</p>
      <p>If you were created via the direct account method, you may need to change your password on first login.</p>
      <p><a href="${appUrl}/login" style="color: #0d41e2;">Sign in to your account</a></p>
    </div>
    <div class="footer">
      <p>${storeName} | Namibia</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Welcome, ${name}!

Your ${storeName} account has been created. You can now sign in to the dashboard.

Sign in: ${appUrl}/login

${storeName} | Namibia
  `.trim();

  await sendEmail({ to, subject: `Welcome to ${storeName}`, html, text });
}

// ============== TWO-FACTOR EMAILS ==============

interface TwoFactorEmailParams {
  to: string;
  name: string;
  action: "enabled" | "disabled" | "reset";
  resetBy?: string;
  storeName?: string;
}

export async function sendTwoFactorEmail(params: TwoFactorEmailParams): Promise<void> {
  const { to, name, action, resetBy, storeName = "FusionZone" } = params;

  const subject = action === "enabled"
    ? `Two-Factor Authentication Enabled — ${storeName}`
    : action === "disabled"
    ? `Two-Factor Authentication Disabled — ${storeName}`
    : `Two-Factor Authentication Reset — ${storeName}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #111; background: #f7f7f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #111; padding: 40px 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .alert { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; }
    .footer { background: #111; color: #9a9a9a; padding: 30px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${storeName}</h1>
    </div>
    <div class="content">
      <h2>Hello ${name},</h2>
      ${action === "enabled"
        ? `<p>Two-factor authentication has been <strong>enabled</strong> on your account.</p><p>Your account is now more secure. Make sure you have saved your recovery codes in a safe place.</p>`
        : action === "disabled"
        ? `<p>Two-factor authentication has been <strong>disabled</strong> on your account.</p><p>If you didn't make this change, please contact your administrator immediately.</p>`
        : `<p>Two-factor authentication has been <strong>reset</strong>${resetBy ? ` by ${resetBy}` : ""}.</p><p>You will need to set up a new authenticator app on your next login.</p>`
      }
      <div class="alert">
        <strong>Security Notice:</strong> If you didn't authorize this change, please contact your administrator immediately.
      </div>
    </div>
    <div class="footer">
      <p>${storeName} | Namibia</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Hello ${name},

${action === "enabled"
  ? "Two-factor authentication has been enabled on your account."
  : action === "disabled"
  ? "Two-factor authentication has been disabled on your account."
  : "Two-factor authentication has been reset."
}

SECURITY NOTICE: If you didn't authorize this change, please contact your administrator immediately.

${storeName} | Namibia
  `.trim();

  await sendEmail({ to, subject, html, text });
}

// ============== ROLE / PERMISSION CHANGE EMAIL ==============

interface RoleChangeEmailParams {
  to: string;
  name: string;
  changes: string[];
  changedBy: string;
  storeName?: string;
}

export async function sendRoleChangeEmail(params: RoleChangeEmailParams): Promise<void> {
  const { to, name, changes, changedBy, storeName = "FusionZone" } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Account Updated — ${storeName}</title>
  <style>
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #111; background: #f7f7f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #0d41e2; padding: 40px 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .changes { background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .changes li { margin: 8px 0; }
    .footer { background: #111; color: #9a9a9a; padding: 30px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${storeName}</h1>
    </div>
    <div class="content">
      <h2>Hello ${name},</h2>
      <p>Your account settings were updated by <strong>${changedBy}</strong>.</p>
      <div class="changes">
        <strong>Changes:</strong>
        <ul>
          ${changes.map((c) => `<li>${c}</li>`).join("")}
        </ul>
      </div>
      <p>These changes take effect immediately. If you notice any issues with your access, please contact your administrator.</p>
    </div>
    <div class="footer">
      <p>${storeName} | Namibia</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Hello ${name},

Your account settings were updated by ${changedBy}.

Changes:
${changes.map((c) => `- ${c}`).join("\n")}

These changes take effect immediately.

${storeName} | Namibia
  `.trim();

  await sendEmail({ to, subject: `Your Account Has Been Updated — ${storeName}`, html, text });
}

// ============== INVITATION EMAIL ==============

interface InvitationEmailParams {
  to: string;
  name: string;
  inviterName: string;
  code?: string | null;
  token?: string;
  role: string;
  note?: string;
  storeName?: string;
}

export async function sendInvitationEmail(params: InvitationEmailParams): Promise<void> {
  const { to, name, inviterName, code, token, role, note, storeName = "FusionZone" } = params;

  // Use short branded link when available, fall back to long token URL
  const invitationUrl = code
    ? `${getAppUrl()}/invite/${code}`
    : token
    ? `${getAppUrl()}/admin/invite/accept?token=${token}`
    : `${getAppUrl()}/login`;
  const roleDisplay = role.charAt(0) + role.slice(1).toLowerCase();

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${storeName}</title>
  <style>
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #111; background: #f7f7f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #0d41e2; padding: 40px 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .content h2 { color: #111; font-size: 20px; margin-top: 0; }
    .button { display: inline-block; background: #0d41e2; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #dd781c; }
    .details { background: #f7f7f7; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .details p { margin: 8px 0; }
    .details strong { color: #111; }
    .footer { background: #111; color: #9a9a9a; padding: 30px; text-align: center; font-size: 13px; }
    .footer a { color: #0d41e2; }
    .expiry { color: #dc2626; font-size: 13px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${storeName}</h1>
    </div>
    <div class="content">
      <h2>Hello ${name},</h2>
      <p>You've been invited by <strong>${inviterName}</strong> to join the ${storeName} team as a <strong>${roleDisplay}</strong>.</p>

      ${note ? `<p><strong>Note:</strong> ${note}</p>` : ""}

      <div class="details">
        <p><strong>Your Role:</strong> ${roleDisplay}</p>
        <p><strong>Email:</strong> ${to}</p>
      </div>

      <p>Click the button below to set up your account and create your password:</p>

      <a href="${invitationUrl}" class="button">Accept Invitation</a>

      <p class="expiry">This invitation expires in 7 days and can only be used once.</p>

      <p style="font-size: 13px; color: #6f6f6f; margin-top: 30px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${invitationUrl}" style="color: #0d41e2; word-break: break-all;">${invitationUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>${storeName} | Namibia</p>
      <p>If you didn't expect this invitation, you can safely ignore this email.</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Hello ${name},

You've been invited by ${inviterName} to join the ${storeName} team as a ${roleDisplay}.

${note ? `Note: ${note}\n` : ""}
Your Role: ${roleDisplay}
Email: ${to}

Click the link below to set up your account:
${invitationUrl}

This invitation expires in 7 days and can only be used once.

${storeName} | Namibia
If you didn't expect this invitation, you can safely ignore this email.
  `.trim();

  await sendEmail({
    to,
    subject: `You're Invited to Join ${storeName}`,
    html,
    text,
  });
}

// ============== PASSWORD RESET EMAIL ==============

interface PasswordResetEmailParams {
  to: string;
  token: string;
  storeName?: string;
}

export async function sendPasswordResetEmail(params: PasswordResetEmailParams): Promise<void> {
  const { to, token, storeName = "FusionZone" } = params;

  const resetUrl = `${appUrl}/admin/reset-password?token=${token}`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your ${storeName} Password</title>
  <style>
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #111; background: #f7f7f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #0d41e2; padding: 40px 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .content h2 { color: #111; font-size: 20px; margin-top: 0; }
    .button { display: inline-block; background: #0d41e2; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .button:hover { background: #dd781c; }
    .expiry { color: #dc2626; font-size: 13px; margin-top: 20px; }
    .footer { background: #111; color: #9a9a9a; padding: 30px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${storeName}</h1>
    </div>
    <div class="content">
      <h2>Reset Your Password</h2>
      <p>We received a request to reset the password for your ${storeName} account (${to}).</p>

      <p>Click the button below to reset your password:</p>

      <a href="${resetUrl}" class="button">Reset Password</a>

      <p class="expiry">This link expires in 1 hour and can only be used once.</p>

      <p style="font-size: 13px; color: #6f6f6f; margin-top: 30px;">
        If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
      </p>

      <p style="font-size: 13px; color: #6f6f6f;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${resetUrl}" style="color: #0d41e2; word-break: break-all;">${resetUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>${storeName} | Namibia</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Reset Your Password

We received a request to reset the password for your ${storeName} account (${to}).

Click the link below to reset your password:
${resetUrl}

This link expires in 1 hour and can only be used once.

If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.

${storeName} | Namibia
  `.trim();

  await sendEmail({
    to,
    subject: `Reset Your ${storeName} Password`,
    html,
    text,
  });
}

// ============== PASSWORD CHANGED NOTIFICATION ==============

interface PasswordChangedEmailParams {
  to: string;
  name: string;
  storeName?: string;
}

export async function sendPasswordChangedEmail(params: PasswordChangedEmailParams): Promise<void> {
  const { to, name, storeName = "FusionZone" } = params;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Your ${storeName} Password Has Been Changed</title>
  <style>
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #111; background: #f7f7f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: #0d41e2; padding: 40px 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .alert { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; }
    .footer { background: #111; color: #9a9a9a; padding: 30px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${storeName}</h1>
    </div>
    <div class="content">
      <h2>Hello ${name},</h2>
      <p>Your ${storeName} account password has been successfully changed.</p>

      <div class="alert">
        <strong>Security Notice:</strong> If you didn't make this change, please contact your administrator immediately.
      </div>

      <p>If you made this change, no further action is required.</p>
    </div>
    <div class="footer">
      <p>${storeName} | Namibia</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Hello ${name},

Your ${storeName} account password has been successfully changed.

SECURITY NOTICE: If you didn't make this change, please contact your administrator immediately.

If you made this change, no further action is required.

${storeName} | Namibia
  `.trim();

  await sendEmail({
    to,
    subject: `Your ${storeName} Password Has Been Changed`,
    html,
    text,
  });
}

// ============== ACCOUNT STATUS EMAILS ==============

interface AccountStatusEmailParams {
  to: string;
  name: string;
  status: "suspended" | "reactivated";
  reason?: string;
  storeName?: string;
}

export async function sendAccountStatusEmail(params: AccountStatusEmailParams): Promise<void> {
  const { to, name, status, reason, storeName = "FusionZone" } = params;

  const isSuspended = status === "suspended";
  const subject = isSuspended
    ? `Your ${storeName} Account Has Been Suspended`
    : `Your ${storeName} Account Has Been Reactivated`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${subject}</title>
  <style>
    body { font-family: Inter, -apple-system, BlinkMacSystemFont, sans-serif; line-height: 1.6; color: #111; background: #f7f7f7; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; background: #fff; }
    .header { background: ${isSuspended ? "#dc2626" : "#16a34a"}; padding: 40px 30px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; font-weight: 700; }
    .content { padding: 40px 30px; }
    .content h2 { color: #111; font-size: 20px; margin-top: 0; }
    .reason { background: ${isSuspended ? "#fef2f2" : "#ecfdf3"}; padding: 16px; border-radius: 8px; margin: 20px 0; }
    .footer { background: #111; color: #9a9a9a; padding: 30px; text-align: center; font-size: 13px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${storeName}</h1>
    </div>
    <div class="content">
      <h2>Hello ${name},</h2>
      <p>Your ${storeName} account has been <strong>${isSuspended ? "suspended" : "reactivated"}</strong>.</p>

      ${reason ? `
      <div class="reason">
        <strong>Reason:</strong> ${reason}
      </div>
      ` : ""}

      ${isSuspended
        ? `<p>Your account access has been temporarily disabled. Please contact your administrator for more information.</p>`
        : `<p>Your account access has been restored. You can now sign in to the dashboard.</p>`
      }
    </div>
    <div class="footer">
      <p>${storeName} | Namibia</p>
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Hello ${name},

Your ${storeName} account has been ${isSuspended ? "suspended" : "reactivated"}.

${reason ? `Reason: ${reason}\n` : ""}
${isSuspended
  ? "Your account access has been temporarily disabled. Please contact your administrator for more information."
  : "Your account access has been restored. You can now sign in to the dashboard."
}

${storeName} | Namibia
  `.trim();

  await sendEmail({
    to,
    subject,
    html,
    text,
  });
}
