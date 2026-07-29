// auth.js — مصادقة (JWT)، تجزئة كلمات السر، تحقّق البريد، وسيط الصلاحيات
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const { customAlphabet } = require('nanoid');
const { db, audit } = require('./db');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const token32 = customAlphabet('0123456789abcdefghijklmnopqrstuvwxyz', 32);

// ── كلمات السر ──
const hashPassword = (p) => bcrypt.hashSync(p, 10);
const checkPassword = (p, h) => bcrypt.compareSync(p, h);

// ── JWT ──
function signToken(user) {
  return jwt.sign(
    { uid: user.id, role: user.role, client_id: user.client_id || null, name: user.name },
    JWT_SECRET, { expiresIn: '12h' }
  );
}
function verifyToken(t) { try { return jwt.verify(t, JWT_SECRET); } catch { return null; } }

// ── البريد — Brevo HTTP API (يتجاوز حظر منافذ SMTP على الاستضافة المجانية)، ثم SMTP، ثم تسجيل بالطرفية ──
const MAIL_FROM = process.env.SMTP_FROM || 'no-reply@wisaltech.qa';
let transporter = null;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, port: +(process.env.SMTP_PORT || 587),
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}
async function sendMail(to, subject, html) {
  // 1) Brevo HTTP API عبر HTTPS (لا يتأثر بحظر منافذ SMTP الصادرة)
  if (process.env.BREVO_API_KEY) {
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 15000);
      const resp = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': process.env.BREVO_API_KEY, 'content-type': 'application/json', 'accept': 'application/json' },
        body: JSON.stringify({ sender: { email: MAIL_FROM, name: 'وصال تك' }, to: [{ email: to }], subject, htmlContent: html }),
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      if (resp.ok) return { sent: true };
      const errText = await resp.text().catch(() => '');
      console.error('[BREVO API] فشل الإرسال:', resp.status, errText);
      return { sent: false, error: `brevo ${resp.status}` };
    } catch (e) {
      console.error('[BREVO API] استثناء:', e && e.message);
      return { sent: false, error: 'brevo-exception' };
    }
  }
  // 2) SMTP (يعمل فقط على استضافة تسمح بمنافذ SMTP)
  if (transporter) {
    try { await transporter.sendMail({ from: MAIL_FROM, to, subject, html }); return { sent: true }; }
    catch (e) { console.error('[SMTP] فشل الإرسال:', e && e.message); return { sent: false, error: 'smtp' }; }
  }
  // 3) وضع التطوير: لا إعداد → نطبع الرابط بدل الإرسال
  console.log(`\n[DEV MAIL] إلى: ${to}\nالموضوع: ${subject}\n${html.replace(/<[^>]+>/g, ' ').trim()}\n`);
  return { sent: false, dev: true };
}

async function sendVerifyEmail(user) {
  const link = `${APP_URL}/api/auth/verify?token=${user.verify_token}`;
  const r = await sendMail(user.email, 'تأكيد بريدك — وصال تك',
    `مرحبًا ${user.name}، اضغط لتأكيد بريدك: <a href="${link}">${link}</a>`);
  return { link, ...r };
}

// ── وسطاء الحماية ──
function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : (req.query.token || null);
  const p = t && verifyToken(t);
  if (!p) return res.status(401).json({ error: 'غير مصرّح — سجّل الدخول' });
  req.user = p;
  next();
}
// الأدوار المسموح لها
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role))
      return res.status(403).json({ error: 'ممنوع — صلاحية غير كافية' });
    next();
  };
}
// عزل المستأجر: مستخدم العميل مقيّد بـ client_id بتاعه فقط
function tenantScope(req, res, next) {
  if (req.user.role === 'client') {
    if (!req.user.client_id) return res.status(403).json({ error: 'حساب عميل بلا ربط' });
    req.tenant = req.user.client_id;
  } else {
    req.tenant = null; // الوكالة ترى الكل
  }
  next();
}

module.exports = {
  hashPassword, checkPassword, signToken, verifyToken,
  sendMail, sendVerifyEmail, token32,
  requireAuth, requireRole, tenantScope, audit, db, APP_URL,
};
