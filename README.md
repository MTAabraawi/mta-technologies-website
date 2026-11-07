# MTA TECHNOLOGIES - Official Corporate Website
**BUILDING A SMARTER TOMORROW**  
**المؤسس: Mohammed Taha Abdullah Dawood Abrah (محمد طه عبدالله داود عبره)**  
**البريد الرسمي المعتمد: hoaam100@gmail.com**

الموقع الرسمي الكامل لشركة **MTA TECHNOLOGIES**، مبني كـ **Static Website** فائق السرعة وخالٍ تماماً من التبعيات المعقدة أو الخوادم، وجاهز للرفع الفوري على **Cloudflare Pages** و **GitHub Pages**.

---

## 📁 محتويات الحزمة البرمجية (File Structure)

- `index.html` : الصفحة الرئيسية مع الشعار الرسمي، الرسالة، وملخص المشاريع والمجالات.
- `about.html` : من نحن، التعريف بالمؤسس، ورؤية ورسالة وفلسفة الشركة.
- `projects.html` : المشاريع والمنتجات الرسمية (MTA Net Blocker, AgentPay, MTA Video Downloader, Sehhaty, MTA AI Video Studio).
- `innovation.html` : مجالات العمل والابتكار التقني السبعة.
- `knowledge.html` : مركز المعرفة والمقالات الهندسية الأصلية.
- `gallery.html` : معرض الهوية البصرية والواجهات مع عارض تكبير تفاعلي (Lightbox).
- `contact.html` : صفحة التواصل والبريد المعتمد `hoaam100@gmail.com`.
- `404.html` : صفحة الخطأ 404 المخصصة لشبكات الاستضافة السحابية.
- `privacy-policy.html` : سياسة الخصوصية الشاملة مع إفصاحات Google AdSense وملفات تعريف الارتباط.
- `terms.html` : شروط الاستخدام وحقوق الملكية الفكرية.
- `disclaimer.html` : إخلاء المسؤولية القانونية وحالة النماذج الأولية.
- `cookies.html` : سياسة ملفات تعريف الارتباط والتخزين المحلي.
- `css/style.css` : نظام التصميم المتكامل (Dark/Light mode + دعم RTL/LTR التلقائي).
- `js/main.js` : منطق التبديل اللحظي بين العربية والإنجليزية، وتغيير النمط، وتكبير الصور.
- `images/` : ملفات الشعارات الرسمية المتجهة (SVG) بدقة فائقة.
- `favicon.svg` : أيقونة المتصفح الرسمية.
- `robots.txt` : تعليمات محركات البحث.
- `sitemap.xml` : خريطة أرشفة الموقع.

---

## 🌐 دعم اللغتين (Arabic RTL & English LTR)

الموقع مجهز بنظام ترجمة لحظي ثنائي اللغة:
- **العربية (RTL)** كخيار أساسي افتراضي.
- **الإنجليزية (LTR)** بضغطة زر واحدة على `EN / عربي` في شريط التنقل.
- يتم حفظ خيار المستخدم تلقائياً في المتصفح عبر `localStorage` لمنع التبديل عند تصفح الصفحات الأخرى.

---

## ⚡ طرق النشر والاستضافة السريعة

### 1. الاستعراض المحلي الفوري
- قم بفك ضغط ملف `mta-technologies-website.zip`.
- افتح ملف `index.html` بالنقر المزدوج في أي متصفح ويب.
- الموقع يعمل محلياً 100% دون الحاجة إلى تشغيل خادم محلي!

### 2. النشر على Cloudflare Pages (الأسرع والأفضل عالمياً)
1. سجل الدخول إلى [لوحة تحكم Cloudflare](https://dash.cloudflare.com/).
2. توجه إلى **Workers & Pages** ثم اضغط **Create application** ثم اختر تبويب **Pages**.
3. اختر خيار **Direct Upload** (الرفع المباشر).
4. حدد اسم المشروع (مثلاً: `mta-technologies`).
5. اسحب وأفلت مجلد `static-site` المستخرج بالكامل واضغط **Deploy site**.
6. سيعمل موقعك فوراً مع شهادة أمان SSL عالمية وسرعة تحميل فائقة على شبكة الحافة (Edge CDN).

### 3. النشر على GitHub Pages
1. أنشئ مستودعاً جديداً على GitHub باسم `mta-technologies`.
2. ارفع كافة الملفات الموجودة داخل المجلد إلى الفرع `main`.
3. اذهب إلى **Settings > Pages**.
4. تحت **Build and deployment**، اختر **Deploy from a branch** وحدد الفرع `main` والمجلد `/ (root)`.
5. اضغط **Save**، وسيكون الموقع نشطاً خلال ثوانٍ.

---

## 💰 دليل تجهيز وتفعيل Google AdSense

الموقع مجهز بالكامل وفق متطلبات وممارسات Google AdSense الدلالية (Semantic HTML5)، وسياسة خصوصية معتمدة تتضمن إفصاحات ملفات تعريف الارتباط وإعلانات الأطراف الثالثة.

> **ملاحظة هامة:** لم يتم تضمين أي معرفات وهمية أو إعلانات مزيفة حفاظاً على سياسات Google AdSense. اتبع الخطوات التالية فور استلام حسابك المعتمد:

### الخطوة 1: إضافة شفرة AdSense في `<head>`
افتح ملفات HTML (`index.html`, `about.html`, إلخ) وابحث في قسم `<head>` عن التعليق التالي:
```html
<!-- GOOGLE ADSENSE INTEGRATION POINT -->
```
قم بإلغاء التعليق واستبدل `ca-pub-XXXXXXXXXXXXXXXX` بمعرف الناشر الحقيقي الخاص بك:
```html
<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-YOUR_REAL_PUBLISHER_ID" crossorigin="anonymous"></script>
```

### الخطوة 2: إنشاء ملف `ads.txt`
عند اعتماد موقعك من Google AdSense، أنشئ ملفاً باسم `ads.txt` في المجلد الرئيسي بجانب `index.html` وضع فيه السطر التالي:
```text
google.com, pub-YOUR_REAL_PUBLISHER_ID, DIRECT, f08c47fec0942fa0
```

### الخطوة 3: تفعيل أماكن الإعلانات المجهزة
تم تجهيز أماكن إعلانية معلقة ونظيفة داخل الصفحات تحت تعليق:
```html
<!-- CONFIGURABLE AD PLACEMENT SLOT -->
```
يمكنك إلغاء التعليق وتحديد `data-ad-slot` الحقيقي الخاص بالوحدة الإعلانية، أو الاعتماد كلياً على ميزة **الإعلانات التلقائية (Auto Ads)** من لوحة Google AdSense.

---

جميع الحقوق محفوظة © 2026 شركة MTA TECHNOLOGIES.
