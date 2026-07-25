// routes/portal.js — بورتال العميل: مقيّد بـ client_id بتاع المستخدم فقط (عزل تام)
const express = require('express');
const router = express.Router();
const A = require('./auth');
const { db } = A;

// كل مسارات البورتال: دخول + دور client + عزل المستأجر
router.use(A.requireAuth, A.requireRole('client'), A.tenantScope);

// بيانات العميل نفسه
router.get('/me', (req, res) => {
  const cl = db.prepare('SELECT id,name,industry,country,status,notes FROM clients WHERE id=?').get(req.tenant);
  res.json({ client: cl });
});

// نظرة عامة مقيّدة ببيانات العميل فقط
router.get('/overview', (req, res) => {
  const cid = req.tenant;
  res.json({
    campaigns: db.prepare('SELECT name,channel,status,budget_qar,spend_qar,kpi_metric,kpi_target,kpi_actual FROM campaigns WHERE client_id=?').all(cid),
    deliverables: db.prepare('SELECT title,work_type,status,date FROM deliverables WHERE client_id=?').all(cid),
    invoices: db.prepare('SELECT number,amount_qar,status,issue_date,due_date FROM invoices WHERE client_id=?').all(cid),
    kpis: db.prepare('SELECT name,metric,target,actual,period FROM kpis WHERE client_id=?').all(cid),
    projects: db.prepare('SELECT name,type,status,start_date,due_date FROM projects WHERE client_id=?').all(cid),
  });
});

// نقاط مفردة (كلها معزولة)
router.get('/campaigns', (req, res) =>
  res.json(db.prepare('SELECT * FROM campaigns WHERE client_id=?').all(req.tenant)));
router.get('/deliverables', (req, res) =>
  res.json(db.prepare('SELECT * FROM deliverables WHERE client_id=?').all(req.tenant)));
router.get('/invoices', (req, res) =>
  res.json(db.prepare('SELECT * FROM invoices WHERE client_id=?').all(req.tenant)));
router.get('/reports', (req, res) =>
  res.json({
    kpis: db.prepare('SELECT * FROM kpis WHERE client_id=?').all(req.tenant),
    campaigns: db.prepare('SELECT name,kpi_metric,kpi_target,kpi_actual,spend_qar FROM campaigns WHERE client_id=?').all(req.tenant),
  }));

// حماية إضافية: أي محاولة لطلب مورد بعميل آخر تُرفض ضمنيًا لأن كل الاستعلامات تستخدم req.tenant
module.exports = router;
