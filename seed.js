// seed.js — إنشاء مستخدمين ابتدائيين (فريق الوكالة + مستخدم عميل لكل عميل)
// يُستخدم كأمر (node seed.js) أو تلقائيًا عند الإقلاع لو الجدول فارغ.
require('dotenv').config();
const A = require('./auth');
const { db } = A;

function upsertUser(name, email, password, role, client_id, log) {
  const ex = db.prepare('SELECT id FROM users WHERE email=?').get(email);
  if (ex) return;
  db.prepare(`INSERT INTO users(name,email,password_hash,role,client_id,email_verified)
              VALUES(?,?,?,?,?,1)`).run(name, email, A.hashPassword(password), role, client_id || null);
  if (log) console.log('أُنشئ:', role.padEnd(7), email, '| كلمة السر:', password);
}

function seed(log = true) {
  if (log) console.log('=== بذر مستخدمي وصال تك ===');
  upsertUser('أحمد الأنصاري', 'admin@wisaltech.qa', 'Wisal@123', 'owner', null, log);
  upsertUser('خالد الكواري', 'khaled@wisaltech.qa', 'Wisal@123', 'member', null, log);
  const clients = db.prepare("SELECT id,name FROM clients WHERE status='completed'").all();
  clients.forEach((cl) => upsertUser(cl.name + ' — بورتال', `client${cl.id}@example.com`, 'Client@123', 'client', cl.id, log));
  if (log) {
    console.log('\nإجمالي المستخدمين:', db.prepare('SELECT COUNT(*) n FROM users').get().n);
    console.log('وكالة: admin@wisaltech.qa / Wisal@123');
    console.log('عميل : client2@example.com / Client@123');
  }
}

// يبذر تلقائيًا فقط لو لا يوجد مستخدمون (آمن للنشر)
function seedIfEmpty() {
  const n = db.prepare('SELECT COUNT(*) n FROM users').get().n;
  if (n === 0) { console.log('لا مستخدمين — تشغيل البذر التلقائي...'); seed(false); }
}

if (require.main === module) seed(true);      // عند تشغيله مباشرة
module.exports = { seed, seedIfEmpty };
