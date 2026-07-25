// server.js — نسخة مسطّحة للنشر (كل الملفات في مستوى واحد)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// بذر تلقائي عند الإقلاع لو لا يوجد مستخدمون
require('./seed').seedIfEmpty();

// واجهات API
app.use('/api/auth', require('./routes-auth'));
app.use('/api/agency', require('./routes-agency'));
app.use('/api/portal', require('./routes-portal'));
app.use('/api/integrations', require('./routes-integrations'));
app.get('/api/health', (req, res) => res.json({ ok: true, service: 'wisaltech-backend', time: new Date().toISOString() }));

// الصفحات
app.get('/app', (req, res) => res.sendFile(path.join(__dirname, 'app.html')));
app.get('/login.html', (req, res) => res.sendFile(path.join(__dirname, 'login.html')));
app.get('/portal.html', (req, res) => res.sendFile(path.join(__dirname, 'portal.html')));
app.get('/', (req, res) => res.redirect('/login.html'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ باك إند وصال تك يعمل على المنفذ ${PORT}`));
module.exports = app;
