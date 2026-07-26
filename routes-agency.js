// routes/agency.js — واجهات الوكالة (owner/admin/member): رؤية كل البيانات + دعوة عملاء
const express = require('express');
const router = express.Router();
const A = require('./auth');
const { db } = A;

// كل مسارات الوكالة تتطلب دخولًا ودورًا داخل الوكالة
router.use(A.requireAuth, A.requireRole('owner', 'admin', 'member'));

router.get('/dashboard', (req, res) => {
  const g = (q) => db.prepare(q).get().n;
  res.json({
    clients_done: g("SELECT COUNT(*) n FROM clients WHERE status='completed'"),
    deliverables: g("SELECT COUNT(*) n FROM deliverables"),
    live_campaigns: g("SELECT COUNT(*) n FROM campaigns WHERE status='live'"),
    ad_budget: +(db.prepare("SELECT v FROM settings WHERE k='ad_budget_monthly'").get()?.v || 0),
    ad_spend: db.prepare("SELECT COALESCE(SUM(spend_qar),0) s FROM campaigns").get().s,
    leads: db.prepare("SELECT COALESCE(SUM(kpi_actual),0) s FROM campaigns").get().s,
    open_opps: g("SELECT COUNT(*) n FROM opportunities WHERE stage!='won'"),
  });
});

router.get('/clients', (req, res) =>
  res.json(db.prepare(`SELECT cl.*, tm.name AS mgr,
    (SELECT COUNT(*) FROM deliverables d WHERE d.client_id=cl.id) AS deliverables
    FROM clients cl LEFT JOIN team_members tm ON cl.account_mgr=tm.id`).all()));

router.get('/clients/:id', (req, res) => {
  const cl = db.prepare('SELECT * FROM clients WHERE id=?').get(req.params.id);
  if (!cl) return res.status(404).json({ error: 'غير موجود' });
  cl.deliverables = db.prepare('SELECT * FROM deliverables WHERE client_id=?').all(cl.id);
  cl.projects = db.prepare('SELECT * FROM projects WHERE client_id=?').all(cl.id);
  cl.campaigns = db.prepare('SELECT * FROM campaigns WHERE client_id=?').all(cl.id);
  cl.invoices = db.prepare('SELECT * FROM invoices WHERE client_id=?').all(cl.id);
  cl.users = db.prepare('SELECT id,name,email,email_verified FROM users WHERE client_id=?').all(cl.id);
  res.json(cl);
});

// bootstrap — كل بيانات الوكالة الحيّة في نداء واحد (بنفس شكل بيانات التطبيق)
router.get('/bootstrap', (req, res) => {
  const all = (q) => db.prepare(q).all();
  const settings = Object.fromEntries(db.prepare('SELECT k,v FROM settings').all().map(r => [r.k, r.v]));
  const g = (q) => db.prepare(q).get();
  res.json({
    clients: all(`SELECT cl.*, tm.name AS mgr FROM clients cl LEFT JOIN team_members tm ON cl.account_mgr=tm.id`),
    deliverables: all(`SELECT * FROM deliverables`),
    projects: all(`SELECT p.*, cl.name AS client FROM projects p JOIN clients cl ON p.client_id=cl.id`),
    campaigns: all(`SELECT cm.*, cl.name AS client FROM campaigns cm JOIN clients cl ON cm.client_id=cl.id`),
    tasks: all(`SELECT t.*, cl.name AS client, tm.name AS who FROM tasks t LEFT JOIN clients cl ON t.client_id=cl.id LEFT JOIN team_members tm ON t.assignee=tm.id ORDER BY t.due_date`),
    kpis: all(`SELECT k.*, cl.name AS client FROM kpis k JOIN clients cl ON k.client_id=cl.id`),
    content: all(`SELECT cc.*, cl.name AS client FROM content_calendar cc JOIN clients cl ON cc.client_id=cl.id ORDER BY cc.publish_date`),
    invoices: all(`SELECT iv.*, cl.name AS client FROM invoices iv JOIN clients cl ON iv.client_id=cl.id`),
    opportunities: all(`SELECT o.*, tm.name AS owner_name FROM opportunities o LEFT JOIN team_members tm ON o.owner=tm.id`),
    conversations: all(`SELECT * FROM conversations`),
    appointments: all(`SELECT * FROM appointments`),
    reviews: all(`SELECT * FROM reviews`),
    workflows: all(`SELECT * FROM workflows`),
    funnels: all(`SELECT * FROM funnels`),
    integrations: all(`SELECT * FROM integrations`),
    team: all(`SELECT * FROM team_members`),
    settings,
    stats: {
      clients_done: g(`SELECT COUNT(*) n FROM clients WHERE status='completed'`).n,
      deliverables: g(`SELECT COUNT(*) n FROM deliverables`).n,
      live_campaigns: g(`SELECT COUNT(*) n FROM campaigns WHERE status='live'`).n,
      ad_budget: +(settings.ad_budget_monthly || 0),
      ad_spend: g(`SELECT COALESCE(SUM(spend_qar),0) s FROM campaigns`).s,
      leads: g(`SELECT COALESCE(SUM(kpi_actual),0) s FROM campaigns`).s,
      opps: g(`SELECT COUNT(*) n FROM opportunities WHERE stage!='won'`).n,
      unread: g(`SELECT COALESCE(SUM(unread),0) s FROM conversations`).s,
      appts: g(`SELECT COUNT(*) n FROM appointments`).n,
      avg_review: Math.round((g(`SELECT AVG(rating) a FROM reviews`).a || 0) * 10) / 10,
      qa_pending: g(`SELECT COUNT(*) n FROM content_calendar WHERE qa_passed=0`).n,
    },
    me: { name: req.user.name, role: req.user.role },
  });
});

const list = (q) => (req, res) => res.json(db.prepare(q).all());
router.get('/campaigns', list(`SELECT cm.*, cl.name AS client FROM campaigns cm JOIN clients cl ON cm.client_id=cl.id`));
router.get('/invoices', list(`SELECT iv.*, cl.name AS client FROM invoices iv JOIN clients cl ON iv.client_id=cl.id`));
router.get('/opportunities', list(`SELECT * FROM opportunities`));
router.get('/reviews', list(`SELECT * FROM reviews`));
router.get('/tasks', list(`SELECT t.*, cl.name AS client, tm.name AS who FROM tasks t
  LEFT JOIN clients cl ON t.client_id=cl.id LEFT JOIN team_members tm ON t.assignee=tm.id`));
router.get('/conversations', list(`SELECT * FROM conversations`));
router.get('/appointments', list(`SELECT * FROM appointments`));
router.get('/audit', A.requireRole('owner', 'admin'), list(`SELECT * FROM audit_log ORDER BY id DESC LIMIT 200`));

// دعوة عميل للوصول إلى بورتاله الخاص (إنشاء مستخدم بدور client مربوط بـ client_id)
router.post('/clients/:id/invite', async (req, res) => {
  const cl = db.prepare('SELECT * FROM clients WHERE id=?').get(req.params.id);
  if (!cl) return res.status(404).json({ error: 'العميل غير موجود' });
  const { name, email } = req.body || {};
  if (!email) return res.status(400).json({ error: 'البريد مطلوب' });
  if (db.prepare('SELECT id FROM users WHERE email=?').get(email))
    return res.status(409).json({ error: 'البريد مستخدم' });
  const verify = A.token32();
  const tempPass = A.token32().slice(0, 10);
  const info = db.prepare(
    `INSERT INTO users(name,email,password_hash,role,client_id,email_verified,verify_token)
     VALUES(?,?,?,?,?,0,?)`
  ).run(name || cl.name, email, A.hashPassword(tempPass), 'client', cl.id, verify);
  const user = db.prepare('SELECT * FROM users WHERE id=?').get(info.lastInsertRowid);
  const mail = await A.sendVerifyEmail(user);
  A.audit(req.user.uid, 'invite_client', 'user', { client_id: cl.id, email });
  res.json({
    ok: true, message: `تمت دعوة ${email} لبورتال ${cl.name}`,
    tempPassword: tempPass,          // في الإنتاج: يُرسَل بالبريد فقط
    verifyLink: mail.dev ? mail.link : undefined,
  });
});

// ── مرفقات المشاريع (رفع ملفات/صور/روابط لكل عميل) ──
router.get('/attachments', (req, res) => {
  const cid = req.query.client_id;
  const sql = 'SELECT a.*, cl.name AS client FROM attachments a JOIN clients cl ON a.client_id=cl.id';
  const rows = cid
    ? db.prepare(sql + ' WHERE a.client_id=? ORDER BY a.id DESC').all(cid)
    : db.prepare(sql + ' ORDER BY a.id DESC').all();
  res.json(rows);
});
router.post('/attachments', (req, res) => {
  const { client_id, title, kind, url } = req.body || {};
  if (!client_id || !url) return res.status(400).json({ error: 'بيانات ناقصة' });
  const info = db.prepare('INSERT INTO attachments(client_id,title,kind,url,created_by) VALUES(?,?,?,?,?)')
    .run(client_id, title || null, kind || 'link', url, req.user.uid);
  A.audit(req.user.uid, 'add_attachment', 'attachment', { client_id, kind });
  res.json({ ok: true, id: info.lastInsertRowid });
});
router.delete('/attachments/:id', (req, res) => {
  db.prepare('DELETE FROM attachments WHERE id=?').run(req.params.id);
  A.audit(req.user.uid, 'delete_attachment', 'attachment', { id: req.params.id });
  res.json({ ok: true });
});

module.exports = router;
