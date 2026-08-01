# تشغيل لوحة تحكم وصال تك (CMS)

لوحة التحكم موجودة على: **https://wisaltech.agency/admin**

الكود كله منشور بالفعل. باقي خطوة واحدة تعملها بنفسك مرة واحدة فقط:
إضافة 4 مفاتيح سرية في Cloudflare. لا تُكتب هذه المفاتيح في الكود أبدًا.

---

## 1) أنشئ مفتاح GitHub

1. افتح: https://github.com/settings/personal-access-tokens/new
2. **Token name**: `wisaltech-cms`
3. **Expiration**: سنة واحدة (ذكّر نفسك بتجديده)
4. **Repository access** → *Only select repositories* → اختر `wisaltech-platform.0`
5. **Permissions** → *Repository permissions* → **Contents** → اختر **Read and write**
6. اضغط **Generate token** وانسخ المفتاح (يظهر مرة واحدة فقط، يبدأ بـ `github_pat_`)

## 2) أضف المفاتيح في Cloudflare

من لوحة Cloudflare:
**Workers & Pages → wisal-tech → Settings → Variables and Secrets → Production**

أضف المتغيّرات التالية، واختر النوع **Secret** لكل منها:

| الاسم | القيمة |
|---|---|
| `CMS_PASSWORD` | كلمة المرور التي ستدخل بها للوحة التحكم (اخترها قوية) |
| `CMS_SECRET` | أي نص عشوائي طويل (30 حرفًا أو أكثر) — لا تحتاج لحفظه |
| `GITHUB_TOKEN` | المفتاح الذي نسخته في الخطوة السابقة |
| `GITHUB_REPO` | `SEO-Strategies-Expert/wisaltech-platform.0` |

ثم اضغط **Save**، ومن تبويب **Deployments** اضغط **Retry deployment** على آخر نشر
حتى تُقرأ المفاتيح الجديدة.

## 3) ادخل على اللوحة

افتح https://wisaltech.agency/admin وأدخل كلمة المرور.

---

## كيف تعمل اللوحة

* **الألوان / الخطوط / الإضاءة** → تُطبَّق على كل صفحات الموقع دفعة واحدة.
* **النصوص** → اختر الصفحة، ثم عدّل أي عنوان أو فقرة أو زر. الكلمات بين `[[ ]]`
  هي الكلمات التي تظهر باللون المميّز.
* **الصور** → استبدل خلفيات الأقسام أو أي صورة داخل الصفحة برفع صورة من جهازك.
* **الأيقونات** → اختر أيقونة جاهزة من المكتبة.
* **المعاينة الحيّة** على اليسار تتغير فورًا قبل النشر، ويمكنك الضغط على أي نص
  داخلها للانتقال مباشرة لتعديله.
* **نشر التغييرات** → يحفظ كل شيء في المستودع، وCloudflare ينشره خلال دقيقة تقريبًا.

كل تعديل يُسجَّل كـ commit في GitHub، فيمكن دائمًا الرجوع لأي نسخة سابقة.

---

## ملاحظات للمطوّر

* التعليم يتم عبر `scripts/cms_annotate.py` — يضيف `data-cms` / `data-cms-img` /
  `data-cms-icon` للعناصر ويولّد `data/cms-content.json`. أعد تشغيله من جذر
  المستودع بعد أي تعديل يدوي على بنية الصفحات:

  ```bash
  python scripts/cms_annotate.py
  ```

* طبقة الثيم في `static/css/wisal-theme.css`. الكتلة بين `CMS-VARS-START` و
  `CMS-VARS-END` يعيد الـ worker توليدها عند كل حفظ؛ القواعد تحتها ثابتة.
* واجهة الـ API في `_worker.js` تحت `/api/cms/*` فقط، وكل ما عداها يمر كما هو
  إلى الملفات الثابتة.
