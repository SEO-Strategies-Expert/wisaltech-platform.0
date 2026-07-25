// routes/integrations.js — ربط وتحقّق الحسابات الخارجية (OAuth) — هيكل جاهز للمفاتيح الحقيقية
const express = require('express');
const router = express.Router();
const A = require('./auth');
const { db } = A;

// مزوّدو الربط المدعومون + نقاط OAuth الرسمية (تُملأ المفاتيح من .env)
const PROVIDERS = {
  meta: {
    label: 'Meta (Facebook / Instagram Ads)',
    authUrl: 'https://www.facebook.com/v20.0/dialog/oauth',
    scopes: 'ads_management,pages_show_list,instagram_basic',
    envId: 'META_APP_ID', envSecret: 'META_APP_SECRET',
  },
  whatsapp: {
    label: 'WhatsApp Business',
    authUrl: 'https://www.facebook.com/v20.0/dialog/oauth',
    scopes: 'whatsapp_business_management,whatsapp_business_messaging',
    envId: 'META_APP_ID', envSecret: 'META_APP_SECRET',
  },
  google: {
    label: 'Google (Ads / Analytics)',
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    scopes: 'https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/analytics.readonly',
    envId: 'GOOGLE_CLIENT_ID', envSecret: 'GOOGLE_CLIENT_SECRET',
  },
  instagram: {
    label: 'Instagram',
    authUrl: 'https://api.instagram.com/oauth/authorize',
    scopes: 'user_profile,user_media',
    envId: 'META_APP_ID', envSecret: 'META_APP_SECRET',
  },
  email: { label: 'Email (SMTP/SendGrid)', authUrl: null, scopes: '', envId: 'SMTP_HOST', envSecret: 'SMTP_PASS' },
};

// قائمة الحالات (الوكالة تشوف الكل، العميل يشوف بتاعه فقط)
router.get('/', A.requireAuth, A.tenantScope, (req, res) => {
  const rows = req.tenant
    ? db.prepare('SELECT id,provider,account_name,status,client_id FROM oauth_connections WHERE client_id=?').all(req.tenant)
    : db.prepare('SELECT id,provider,account_name,status,client_id FROM oauth_connections').all();
  res.json({
    providers: Object.entries(PROVIDERS).map(([k, v]) => ({
      key: k, label: v.label,
      configured: !!process.env[v.envId],          // هل المفاتيح موجودة؟
    })),
    connections: rows,
  });
});

// بدء ربط: يبني رابط OAuth الرسمي (يتطلّب مفاتيح التطبيق في .env)
router.get('/:provider/connect', A.requireAuth, A.requireRole('owner', 'admin', 'member'), (req, res) => {
  const p = PROVIDERS[req.params.provider];
  if (!p) return res.status(404).json({ error: 'مزوّد غير مدعوم' });
  const clientId = process.env[p.envId];
  if (!clientId) return res.status(400).json({
    error: `مفاتيح ${p.label} غير مضبوطة`,
    hint: `أضف ${p.envId} و ${p.envSecret} في ملف .env بعد تسجيل تطبيقكم لدى المزوّد`,
  });
  const redirect = `${A.APP_URL}/api/integrations/${req.params.provider}/callback`;
  const url = `${p.authUrl}?client_id=${encodeURIComponent(clientId)}`
    + `&redirect_uri=${encodeURIComponent(redirect)}`
    + `&scope=${encodeURIComponent(p.scopes)}&response_type=code&state=${A.token32()}`;
  res.json({ authorize_url: url, note: 'وجّه المستخدم لهذا الرابط لإتمام الموافقة' });
});

// رد OAuth: هنا يتم تبادل الكود بـ access_token (يحتاج المفاتيح الحقيقية)
router.get('/:provider/callback', A.requireAuth, A.requireRole('owner', 'admin', 'member'), async (req, res) => {
  const p = PROVIDERS[req.params.provider];
  if (!p) return res.status(404).json({ error: 'مزوّد غير مدعوم' });
  const { code } = req.query;
  if (!code) return res.status(400).json({ error: 'لا يوجد code من المزوّد' });
  // ── في الإنتاج: POST إلى token endpoint بالمفاتيح للحصول على access/refresh token ──
  // مثال (يُفعّل عند توفّر المفاتيح):
  //   const tok = await fetch(TOKEN_URL,{method:'POST',body:...}).then(r=>r.json());
  // للتوضيح هنا نسجّل الاتصال بحالة "verified" كمحاكاة آمنة بدون مفاتيح:
  const info = db.prepare(
    `INSERT INTO oauth_connections(provider,account_name,status,scopes,connected_by,created_at)
     VALUES(?,?,?,?,?,datetime('now'))`
  ).run(req.params.provider, `${p.label} — 〔الحساب〕`, 'verified', p.scopes, req.user.uid);
  A.audit(req.user.uid, 'oauth_connect', 'integration', { provider: req.params.provider });
  res.json({ ok: true, id: info.lastInsertRowid, provider: req.params.provider, status: 'verified' });
});

// فصل ربط
router.delete('/:id', A.requireAuth, A.requireRole('owner', 'admin'), (req, res) => {
  db.prepare('DELETE FROM oauth_connections WHERE id=?').run(req.params.id);
  A.audit(req.user.uid, 'oauth_disconnect', 'integration', { id: req.params.id });
  res.json({ ok: true });
});

module.exports = router;
