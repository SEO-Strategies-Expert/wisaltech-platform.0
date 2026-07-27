// persist.js — free durable storage: backs up the SQLite DB to Cloudinary after writes,
// and restores it on boot. Uses only Node built-ins (no extra dependencies).
var https = require('https');
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var cp = require('child_process');
var CRLF = String.fromCharCode(13, 10);
var PUBLIC_ID = 'wisaltech_db_backup';

function cfg(){ return { cloud: process.env.CLOUDINARY_CLOUD_NAME, key: process.env.CLOUDINARY_API_KEY, secret: process.env.CLOUDINARY_API_SECRET }; }
function dbPath(dir){ return path.join(dir || __dirname, 'wisaltech.db'); }

function httpsGet(url, headers){
  return new Promise(function(res, rej){
    var r = https.get(url, { headers: headers || {} }, function(resp){
      var d = [];
      resp.on('data', function(c){ d.push(c); });
      resp.on('end', function(){ res({ status: resp.statusCode, buf: Buffer.concat(d) }); });
    });
    r.on('error', rej);
  });
}

function restoreMain(){
  var c = cfg();
  if(!c.cloud || !c.key || !c.secret){ console.error('[persist] no cloudinary creds, skip restore'); return Promise.resolve(); }
  var auth = 'Basic ' + Buffer.from(c.key + ':' + c.secret).toString('base64');
  var api = 'https://api.cloudinary.com/v1_1/' + c.cloud + '/resources/raw/upload/' + PUBLIC_ID;
  return httpsGet(api, { Authorization: auth }).then(function(meta){
    if(meta.status !== 200){ console.error('[persist] no backup yet, status ' + meta.status); return; }
    var j = JSON.parse(meta.buf.toString());
    if(!j.secure_url){ console.error('[persist] backup missing url'); return; }
    return httpsGet(j.secure_url).then(function(dl){
      if(dl.status !== 200 || !dl.buf.length){ console.error('[persist] download failed ' + dl.status); return; }
      fs.writeFileSync(dbPath(process.env.WT_DB_DIR), dl.buf);
      console.error('[persist] restored db from cloud, bytes ' + dl.buf.length);
    });
  }).catch(function(e){ console.error('[persist] restore error', e && e.message); });
}

function restoreSync(dir){
  try{
    cp.execFileSync(process.execPath, [__filename, '--restore'], { env: Object.assign({}, process.env, { WT_DB_DIR: dir || __dirname }), stdio: 'inherit', timeout: 20000 });
  }catch(e){ console.error('[persist] restoreSync failed', e && e.message); }
}

var timer = null, backingUp = false, dir_ = null, db_ = null;
function scheduleBackup(){ if(timer){ clearTimeout(timer); } timer = setTimeout(runBackup, 4000); }
function runBackup(){
  if(backingUp || !db_){ return; }
  var c = cfg();
  if(!c.cloud || !c.key || !c.secret){ return; }
  backingUp = true;
  try{
    var snap = path.join(dir_, 'wt_snapshot.db');
    try{ fs.unlinkSync(snap); }catch(e){}
    db_.exec("VACUUM INTO '" + snap + "'");
    var buf = fs.readFileSync(snap);
    uploadRaw(c, buf).then(function(){ try{ fs.unlinkSync(snap); }catch(e){} backingUp = false; console.error('[persist] backup uploaded, bytes ' + buf.length); }).catch(function(e){ backingUp = false; console.error('[persist] upload failed', e && e.message); });
  }catch(e){ backingUp = false; console.error('[persist] backup error', e && e.message); }
}

function uploadRaw(c, buf){
  return new Promise(function(resolve, reject){
    var ts = Math.floor(Date.now() / 1000);
    var toSign = 'invalidate=true&overwrite=true&public_id=' + PUBLIC_ID + '&timestamp=' + ts;
    var sig = crypto.createHash('sha1').update(toSign + c.secret).digest('hex');
    var boundary = '----wtb' + ts;
    var parts = [];
    function field(name, val){ parts.push(Buffer.from('--' + boundary + CRLF + 'Content-Disposition: form-data; name="' + name + '"' + CRLF + CRLF + val + CRLF)); }
    field('api_key', c.key);
    field('timestamp', String(ts));
    field('public_id', PUBLIC_ID);
    field('overwrite', 'true');
    field('invalidate', 'true');
    field('signature', sig);
    parts.push(Buffer.from('--' + boundary + CRLF + 'Content-Disposition: form-data; name="file"; filename="wisaltech.db"' + CRLF + 'Content-Type: application/octet-stream' + CRLF + CRLF));
    parts.push(buf);
    parts.push(Buffer.from(CRLF + '--' + boundary + '--' + CRLF));
    var body = Buffer.concat(parts);
    var req = https.request({ method: 'POST', hostname: 'api.cloudinary.com', path: '/v1_1/' + c.cloud + '/raw/upload', headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary, 'Content-Length': body.length } }, function(resp){
      var d = [];
      resp.on('data', function(x){ d.push(x); });
      resp.on('end', function(){ if(resp.statusCode >= 200 && resp.statusCode < 300){ resolve(); } else { reject(new Error('status ' + resp.statusCode + ' ' + Buffer.concat(d).toString().slice(0, 200))); } });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function startBackups(db, dir){
  db_ = db; dir_ = dir || __dirname;
  try{
    var origPrepare = db.prepare.bind(db);
    db.prepare = function(sql){
      var stmt = origPrepare(sql);
      var s = (typeof sql === 'string') ? sql : '';
      var i = 0;
      while(i < s.length){ var cc = s.charCodeAt(i); if(cc === 32 || cc === 9 || cc === 10 || cc === 13 || cc === 40){ i++; } else { break; } }
      var head = s.slice(i, i + 7).toUpperCase();
      var isWrite = head.indexOf('INSERT') === 0 || head.indexOf('UPDATE') === 0 || head.indexOf('DELETE') === 0 || head.indexOf('REPLACE') === 0;
      if(isWrite && stmt && typeof stmt.run === 'function'){
        var origRun = stmt.run.bind(stmt);
        stmt.run = function(){ var r = origRun.apply(stmt, arguments); scheduleBackup(); return r; };
      }
      return stmt;
    };
  }catch(e){ console.error('[persist] wrap failed', e && e.message); }
  var flush = function(){ try{ if(timer){ clearTimeout(timer); timer = null; } runBackup(); }catch(e){} };
  process.on('SIGTERM', function(){ flush(); setTimeout(function(){ process.exit(0); }, 2500); });
  process.on('SIGINT', function(){ flush(); setTimeout(function(){ process.exit(0); }, 2500); });
}

if(process.argv.indexOf('--restore') !== -1){
  restoreMain().then(function(){ process.exit(0); }).catch(function(){ process.exit(0); });
} else {
  module.exports = { restoreSync: restoreSync, startBackups: startBackups };
}
