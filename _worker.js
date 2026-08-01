/**
 * Wisal Tech — static asset worker + CMS API.
 *
 * Every request that is not /api/cms/* is passed straight through to the
 * static asset store, so the public site behaves exactly as before.
 *
 * Required Cloudflare Pages environment variables (Settings → Environment
 * variables, Production). All of them are secrets — never commit them:
 *   CMS_PASSWORD   password for the /admin panel
 *   CMS_SECRET     any long random string, used to sign the session cookie
 *   GITHUB_TOKEN   fine-grained PAT with Contents: read & write on the repo
 *   GITHUB_REPO    owner/name, e.g. SEO-Strategies-Expert/wisaltech-platform.0
 *   GITHUB_BRANCH  optional, defaults to main
 */

const BUILD = 6;          // bump on every worker change to verify what is live
const COOKIE = 'wt_cms';
const SESSION_HOURS = 12;
const INLINE_TAGS = ['em', 'strong', 'b', 'i', 'u', 'small', 'sup', 'sub', 'br', 'span'];
const SVG_TAGS = ['path', 'circle', 'rect', 'line', 'polyline', 'polygon', 'ellipse', 'g', 'defs', 'title', 'use'];

/* ------------------------------------------------------------------ auth */

const enc = new TextEncoder();

async function hmac(data, secret) {
  const key = await crypto.subtle.importKey('raw', enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function safeEqual(a, b) {
  a = String(a); b = String(b);
  if (!a.length || !b.length) return false;
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    diff |= a.charCodeAt(i % a.length) ^ b.charCodeAt(i % b.length);
  }
  return diff === 0;
}

async function issueCookie(env) {
  const exp = Date.now() + SESSION_HOURS * 3600 * 1000;
  const sig = await hmac(String(exp), env.CMS_SECRET);
  return `${COOKIE}=${exp}.${sig}; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=${SESSION_HOURS * 3600}`;
}

async function authed(request, env) {
  if (!env.CMS_SECRET) return false;
  const raw = (request.headers.get('Cookie') || '')
    .split(';').map(s => s.trim()).find(s => s.startsWith(COOKIE + '='));
  if (!raw) return false;
  const [exp, sig] = raw.slice(COOKIE.length + 1).split('.');
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  return safeEqual(sig, await hmac(exp, env.CMS_SECRET));
}

/* ------------------------------------------------------------ sanitisers */

function sanitizeInline(html) {
  return String(html).replace(/<([^>]*)>/g, (_m, inner) => {
    const parts = String(inner).trim().match(/^(\/?)([a-zA-Z0-9-]+)([\s\S]*)$/);
    if (!parts) return '';
    const tag = parts[2].toLowerCase();
    if (!INLINE_TAGS.includes(tag)) return '';
    const attrs = (parts[3] || '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/\/$/, '');
    return `<${parts[1]}${tag}${attrs}>`;
  });
}

function sanitizeText(text) {
  return String(text).replace(/[<>]/g, '');
}

function sanitizeSvg(svg) {
  return String(svg).replace(/<([^>]*)>/g, (_m, inner) => {
    const parts = String(inner).trim().match(/^(\/?)([a-zA-Z0-9-]+)([\s\S]*)$/);
    if (!parts) return '';
    const tag = parts[2].toLowerCase();
    if (!SVG_TAGS.includes(tag)) return '';
    const attrs = (parts[3] || '')
      .replace(/\son\w+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/javascript:/gi, '');
    return `<${parts[1]}${tag}${attrs}>`;
  });
}

const SAFE_PATH = /^\/[A-Za-z0-9._\-\/%]+$/;
const SAFE_VAR = /^[#A-Za-z0-9\s.,()%\/_"'-]{1,220}$/;

function safeVarValue(v) {
  const s = String(v).trim();
  if (!SAFE_VAR.test(s)) return null;
  if (/[;{}<>\\]|@import|expression\(/i.test(s)) return null;
  if (/url\(/i.test(s) && !/^url\(\/[A-Za-z0-9._\-\/%]+\)$/.test(s)) return null;
  return s;
}

/* -------------------------------------------------------------- rewriting */

function escapeRe(s) { return String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function replaceField(html, key, tag, mode, value) {
  const k = escapeRe(key);
  const t = escapeRe(tag);
  if (mode === 'text') {
    const re = new RegExp(`(<${t}\\b[^>]*\\sdata-cms="${k}"[^>]*>)([^<]*)`);
    if (!re.test(html)) return null;
    return html.replace(re, (_m, open) => open + sanitizeText(value));
  }
  const re = new RegExp(`(<${t}\\b[^>]*\\sdata-cms="${k}"[^>]*>)([\\s\\S]*?)(<\\/${t}>)`);
  if (!re.test(html)) return null;
  return html.replace(re, (_m, open, _inner, close) => open + sanitizeInline(value) + close);
}

function replaceImage(html, key, src, alt) {
  const k = escapeRe(key);
  const re = new RegExp(`<img\\b[^>]*\\sdata-cms-img="${k}"[^>]*>`);
  if (!re.test(html)) return null;
  return html.replace(re, (tagHtml) => {
    let out = tagHtml;
    if (src && SAFE_PATH.test(src)) {
      out = /\ssrc\s*=/.test(out)
        ? out.replace(/\ssrc\s*=\s*("[^"]*"|'[^']*')/, ` src="${src}"`)
        : out.replace(/^<img/, `<img src="${src}"`);
    }
    if (typeof alt === 'string') {
      const a = sanitizeText(alt).replace(/"/g, '&quot;');
      out = /\salt\s*=/.test(out)
        ? out.replace(/\salt\s*=\s*("[^"]*"|'[^']*')/, ` alt="${a}"`)
        : out.replace(/^<img/, `<img alt="${a}"`);
    }
    return out;
  });
}

function replaceIcon(html, key, svgInner) {
  const k = escapeRe(key);
  const re = new RegExp(`(<svg\\b[^>]*\\sdata-cms-icon="${k}"[^>]*>)([\\s\\S]*?)(<\\/svg>)`);
  if (!re.test(html)) return null;
  return html.replace(re, (_m, open, _inner, close) => open + sanitizeSvg(svgInner) + close);
}

function buildThemeCss(existingCss, theme) {
  const vars = (theme && theme.vars) || {};
  const lines = Object.keys(vars).sort().map(k => {
    const v = safeVarValue(vars[k]);
    return v === null ? null : `  --cms-${k}:${v};`;
  }).filter(Boolean);

  const families = (theme.googleFonts || [])
    .filter(f => /^[A-Za-z0-9 ]{2,40}$/.test(f))
    .map(f => `family=${f.trim().replace(/\s+/g, '+')}:wght@300;400;500;600;700;800`);
  const imports = families.length
    ? `@import url('https://fonts.googleapis.com/css2?${families.join('&')}&display=swap');\n`
    : '';

  const block = `/* CMS-VARS-START */\n${imports}:root{\n${lines.join('\n')}\n}\n/* CMS-VARS-END */`;
  return existingCss.replace(/\/\* CMS-VARS-START \*\/[\s\S]*?\/\* CMS-VARS-END \*\//, block);
}

/* ----------------------------------------------------------------- github */

class Repo {
  constructor(env) {
    this.repo = env.GITHUB_REPO;
    this.branch = env.GITHUB_BRANCH || 'main';
    this.headers = {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json',
      'User-Agent': 'wisaltech-cms',
      'Content-Type': 'application/json',
    };
  }

  async api(path, init) {
    const res = await fetch(`https://api.github.com${path}`, { ...init, headers: this.headers });
    if (!res.ok) throw new Error(`GitHub ${path} → ${res.status} ${(await res.text()).slice(0, 180)}`);
    return res.json();
  }

  async read(path) {
    const data = await this.api(`/repos/${this.repo}/contents/${encodeURI(path)}?ref=${this.branch}`);
    const bin = Uint8Array.from(atob(data.content.replace(/\n/g, '')), c => c.charCodeAt(0));
    return new TextDecoder().decode(bin);
  }

  async commit(files, message) {
    const ref = await this.api(`/repos/${this.repo}/git/ref/heads/${this.branch}`);
    const head = ref.object.sha;
    const base = await this.api(`/repos/${this.repo}/git/commits/${head}`);

    const tree = [];
    for (const f of files) {
      const blob = await this.api(`/repos/${this.repo}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify(f.base64
          ? { content: f.base64, encoding: 'base64' }
          : { content: f.content, encoding: 'utf-8' }),
      });
      tree.push({ path: f.path, mode: '100644', type: 'blob', sha: blob.sha });
    }

    const newTree = await this.api(`/repos/${this.repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({ base_tree: base.tree.sha, tree }),
    });
    const commit = await this.api(`/repos/${this.repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({ message, tree: newTree.sha, parents: [head] }),
    });
    await this.api(`/repos/${this.repo}/git/refs/heads/${this.branch}`, {
      method: 'PATCH',
      body: JSON.stringify({ sha: commit.sha }),
    });
    return commit.sha;
  }
}

/* -------------------------------------------------------------- endpoints */

const json = (body, status = 200, headers = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });

function configured(env) {
  return Boolean(env.CMS_PASSWORD && env.CMS_SECRET && env.GITHUB_TOKEN && env.GITHUB_REPO);
}

async function handleApi(request, env, url) {
  const route = url.pathname.replace(/^\/api\/cms\/?/, '');

  if (route === 'config') {
    // `build` lets us confirm from the outside which deployment is live.
    return json({ build: BUILD, configured: configured(env), authed: await authed(request, env) });
  }

  if (route === 'login' && request.method === 'POST') {
    if (!configured(env)) return json({ error: 'لوحة التحكم غير مهيأة بعد على Cloudflare.' }, 503);
    const body = await request.json().catch(() => ({}));
    await new Promise(r => setTimeout(r, 400));
    if (!body.password || !safeEqual(body.password, env.CMS_PASSWORD)) {
      return json({ error: 'كلمة المرور غير صحيحة' }, 401);
    }
    return json({ ok: true }, 200, { 'Set-Cookie': await issueCookie(env) });
  }

  if (route === 'logout') {
    return json({ ok: true }, 200, {
      'Set-Cookie': `${COOKIE}=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0`,
    });
  }

  if (!await authed(request, env)) return json({ error: 'unauthorised' }, 401);

  if (route === 'state') {
    const repo = new Repo(env);
    const [content, theme] = await Promise.all([
      repo.read('data/cms-content.json'),
      repo.read('data/site-theme.json'),
    ]);
    return json({ content: JSON.parse(content), theme: JSON.parse(theme) });
  }

  if (route === 'save' && request.method === 'POST') {
    const body = await request.json().catch(() => null);
    if (!body) return json({ error: 'bad payload' }, 400);

    const repo = new Repo(env);
    const files = [];
    const notes = [];
    const registry = JSON.parse(await repo.read('data/cms-content.json'));
    let registryTouched = false;

    const pages = body.pages || {};
    for (const path of Object.keys(pages)) {
      const page = registry.pages[path];
      if (!page) { notes.push(`تخطّي صفحة غير معروفة: ${path}`); continue; }
      const edits = pages[path] || {};
      let html = await repo.read(path);
      let touched = 0;

      for (const key of Object.keys(edits.texts || {})) {
        const field = page.fields[key];
        if (!field) continue;
        const next = replaceField(html, key, field.tag, field.mode, edits.texts[key]);
        if (next === null) { notes.push(`تعذّر تحديث نص ${key} في ${path}`); continue; }
        html = next;
        field.value = field.mode === 'text'
          ? sanitizeText(edits.texts[key])
          : sanitizeInline(edits.texts[key]);
        touched++;
      }

      for (const key of Object.keys(edits.images || {})) {
        const img = page.images[key];
        if (!img) continue;
        const { src, alt } = edits.images[key] || {};
        const next = replaceImage(html, key, src, alt);
        if (next === null) { notes.push(`تعذّر تحديث صورة ${key} في ${path}`); continue; }
        html = next;
        if (src && SAFE_PATH.test(src)) img.src = src;
        if (typeof alt === 'string') img.alt = sanitizeText(alt);
        touched++;
      }

      for (const key of Object.keys(edits.icons || {})) {
        const icon = page.icons[key];
        if (!icon) continue;
        const next = replaceIcon(html, key, edits.icons[key]);
        if (next === null) { notes.push(`تعذّر تحديث أيقونة ${key} في ${path}`); continue; }
        html = next;
        icon.svg = sanitizeSvg(edits.icons[key]);
        touched++;
      }

      if (touched) { files.push({ path, content: html }); registryTouched = true; }
    }

    for (const up of (body.uploads || []).slice(0, 12)) {
      const name = String(up.name || '').toLowerCase().replace(/[^a-z0-9._-]/g, '-').slice(0, 70);
      if (!/\.(png|jpe?g|webp|svg|gif|avif)$/.test(name)) { notes.push(`ملف مرفوض: ${up.name}`); continue; }
      const b64 = String(up.base64 || '').replace(/^data:[^,]+,/, '');
      if (!b64 || b64.length > 8000000) { notes.push(`حجم كبير جدًا: ${up.name}`); continue; }
      files.push({ path: `images/uploads/${name}`, base64: b64 });
    }

    if (body.theme && body.theme.vars) {
      const current = JSON.parse(await repo.read('data/site-theme.json'));
      const merged = {
        ...current,
        vars: { ...current.vars },
        googleFonts: body.theme.googleFonts || current.googleFonts || [],
      };
      for (const k of Object.keys(body.theme.vars)) {
        if (!/^[a-z0-9-]{1,40}$/.test(k)) continue;
        const v = safeVarValue(body.theme.vars[k]);
        if (v === null) { notes.push(`قيمة غير صالحة للمتغيّر ${k}`); continue; }
        merged.vars[k] = v;
      }
      const css = buildThemeCss(await repo.read('static/css/wisal-theme.css'), merged);
      files.push({ path: 'data/site-theme.json', content: JSON.stringify(merged, null, 1) + '\n' });
      files.push({ path: 'static/css/wisal-theme.css', content: css });
    }

    if (!files.length) return json({ ok: false, error: 'لا توجد تغييرات للحفظ', notes });

    if (registryTouched) {
      files.push({ path: 'data/cms-content.json', content: JSON.stringify(registry, null, 1) + '\n' });
    }
    const sha = await repo.commit(files, body.message || 'chore(cms): update site content');
    return json({ ok: true, sha: sha.slice(0, 7), files: files.length, notes });
  }

  return json({ error: 'not found' }, 404);
}

const THEME_SOURCE = '/static/css/wisal-theme.css';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/cms')) {
      try {
        return await handleApi(request, env, url);
      } catch (err) {
        return json({ error: String((err && err.message) || err) }, 500);
      }
    }

    // Cloudflare's edge caches by file extension and then stamps its own
    // four-hour Browser Cache TTL on the response, which overrode every header
    // we set and kept colour and font changes hidden for hours. This path has
    // no extension, so the edge leaves it alone and our header survives.
    // The ETag still lets browsers answer 304, so nothing is re-downloaded.
    if (url.pathname === '/api/theme' || url.pathname === '/api/theme.css') {
      const res = await env.ASSETS.fetch(new Request(new URL(THEME_SOURCE, url.origin), request));
      const out = new Response(res.body, res);
      out.headers.set('Content-Type', 'text/css; charset=utf-8');
      out.headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
      return out;
    }

    return env.ASSETS.fetch(request);
  },
};
