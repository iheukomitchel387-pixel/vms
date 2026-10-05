const nodemailer = require('nodemailer');
const QRCode = require('qrcode');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const from = () => process.env.MAIL_FROM || process.env.SMTP_USER;

// Email to the VISITOR with the encrypted QR pass
exports.sendBadgeEmail = async ({ to, visitorName, badgeNumber, hostName, purpose, checkInTime, qrData }) => {
  const time = new Date(checkInTime).toLocaleString();
  const qrPng = await QRCode.toBuffer(qrData, { width: 300, margin: 2 });

  await transporter.sendMail({
    from: from(),
    to,
    subject: `Your visitor pass: ${badgeNumber}`,
    text:
      `Hello ${visitorName},\n\n` +
      `You have been checked in. Show the QR code attached to this email at the gate.\n` +
      `Badge: ${badgeNumber}\nHost: ${hostName}\nPurpose: ${purpose}\nTime: ${time}`,
    html:
      `<div style="font-family:Arial,sans-serif;max-width:480px">` +
      `<h2>Welcome, ${esc(visitorName)}</h2>` +
      `<p>You have been checked in. Show this QR code at the gate and when leaving.</p>` +
      `<img src="cid:badgeqr" alt="Visitor QR code" width="260" height="260" />` +
      `<p style="font-size:20px;font-weight:bold;color:#1d4ed8;margin:8px 0">${esc(badgeNumber)}</p>` +
      `<p><b>Host:</b> ${esc(hostName)}<br><b>Purpose:</b> ${esc(purpose)}<br><b>Time:</b> ${esc(time)}</p></div>`,
    attachments: [{ filename: 'visitor-qr.png', content: qrPng, cid: 'badgeqr' }],
  });
};

// Email to the HOST asking them to accept or decline
exports.sendHostRequestEmail = async ({ to, hostName, visitorName, company, purpose, link }) => {
  await transporter.sendMail({
    from: from(),
    to,
    subject: `Visitor waiting for you: ${visitorName}`,
    text:
      `Hello ${hostName},\n\n` +
      `${visitorName}${company ? ` from ${company}` : ''} is at reception to see you.\n` +
      `Purpose of the meeting: ${purpose}\n\n` +
      `Open this link to accept or decline: ${link}`,
    html:
      `<div style="font-family:Arial,sans-serif;max-width:480px">` +
      `<h2>A visitor is waiting for you</h2>` +
      `<p><b>${esc(visitorName)}</b>${company ? ` from ${esc(company)}` : ''} is at reception.</p>` +
      `<p><b>Purpose of the meeting:</b><br>${esc(purpose)}</p>` +
      `<p><a href="${esc(link)}" style="background:#1d4ed8;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block">Accept or decline</a></p>` +
      `<p style="color:#6b7280;font-size:13px">This link expires in 24 hours.</p></div>`,
  });
};