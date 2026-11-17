const nodemailer = require('nodemailer');

/**
 * Sends an email via SMTP if credentials are configured.
 * Otherwise, in development, prints the email body to the terminal
 * so you can copy the reset link manually.
 */
async function sendEmail({ to, subject, text, html }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM } = process.env;

  const hasSmtp = SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS;

  if (!hasSmtp) {
    // Dev fallback: log to terminal
    console.log('\n────────── 📧 EMAIL (dev mode) ──────────');
    console.log('To:      ', to);
    console.log('Subject: ', subject);
    console.log('Body:\n', text || html);
    console.log('─────────────────────────────────────────\n');
    return { delivered: false, reason: 'SMTP not configured — printed to console' };
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS }
  });

  const info = await transporter.sendMail({
    from: EMAIL_FROM || SMTP_USER,
    to,
    subject,
    text,
    html
  });

  return { delivered: true, messageId: info.messageId };
}

module.exports = sendEmail;