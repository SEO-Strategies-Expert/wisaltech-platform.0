// routes/auth.js — تسجيل، دخول، تأكيد بريد، استرجاع كلمة السر، بيانات المستخدم
const express = require('express');
const router = express.Router();
const A = require('./auth');
const { db } = A;

// تسجيل مستخدم وكالة جديد (owner/admin/member)
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ error: 'بيانات ناقصة' });
  const exists = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (exists) return res.status(409).json({ error: 'البريد مستخدم' });
  const verify = A.token32();
  const info = db.prepare(
    `INSERT INTO users(name,email,password_hash,role,email_verified,verify_token)
     VALUES(?,?,?,?,0,?)`
  ).run(name, email, A.hashPassword(password), ['owner', 'admin', 'member'].includes(role) ? role : 'member', verify);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid);
  const mail = await A.sendVerifyEmail(user);
  A.audit(user.id, 'register', 'user', { email });
  res.json({ ok: true, message: 'تم التسجيل — أكّد بريدك', verifyLink: mail.dev ? mail.link : undefined });
});

// دخول
router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE email=?').get(email);
  if (!u || !A.checkPassword(password, u.password_hash))
    return res.status(401).json({ error: 'بريد أو كلمة سر غير صحيحة' });
  if (!u.email_verified)
    return res.status(403).json({ error: 'يرجى تأكيد بريدك أولًا', need_verify: true });
  A.audit(u.id, 'login', 'user');
  res.json({
    token: A.signToken(u),
    user: { id: u.id, name: u.name, email: u.email, role: u.role, client_id: u.client_id },
    home: u.role === 'client' ? '/portal.html' : '/app',
  });
});

// تأكيد البريد
router.get('/verify', (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE verify_token=?').get(req.query.token || '');
  if (!u) return res.status(400).send('رابط غير صالح');
  db.prepare('UPDATE users SET email_verified=1, verify_token=NULL WHERE id=?').run(u.id);
  A.audit(u.id, 'verify_email', 'user');
  res.send('<div style="font-family:sans-serif;text-align:center;padding:40px" dir="rtl">✅ تم تأكيد بريدك. تقدر تسجّل الدخول الآن. <a href="/login.html">دخول</a></div>');
});

// نسيت كلمة السر
router.post('/forgot', async (req, res) => {
  const u = db.prepare('SELECT * FROM users WHERE email=?').get((req.body || {}).email);
  if (u) {
    const rt = A.token32();
    db.prepare('UPDATE users SET reset_token=?, reset_expires=? WHERE id=?')
      .run(rt, Date.now() + 3600e3, u.id);
    const link = `${A.APP_URL}/api/auth/reset?token=${rt}`;
    const m = await A.sendMail(u.email, 'استرجاع كلمة السر — وصال تك', `اضغط للاسترجاع: <a href="${link}">${link}</a>`);
    return res.json({ ok: true, resetLink: m.dev ? link : undefined });
  }
  res.json({ ok: true }); // لا نكشف وجود البريد
});

// تعيين كلمة سر جديدة
router.post('/reset', (req, res) => {
  const { token, password } = req.body || {};
  const u = db.prepare('SELECT * FROM users WHERE reset_token=?').get(token || '');
  if (!u || !u.reset_expires || u.reset_expires < Date.now())
    return res.status(400).json({ error: 'رابط منتهٍ أو غير صالح' });
  db.prepare('UPDATE users SET password_hash=?, reset_token=NULL, reset_expires=NULL WHERE id=?')
    .run(A.hashPassword(password), u.id);
  A.audit(u.id, 'reset_password', 'user');
  res.json({ ok: true });
});

// بيانات المستخدم الحالي
router.get('/me', A.requireAuth, (req, res) => {
  const u = db.prepare('SELECT id,name,email,role,client_id,email_verified FROM users WHERE id=?').get(req.user.uid);
  res.json({ user: u });
});

module.exports = router;
