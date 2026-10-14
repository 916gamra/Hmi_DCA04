# دليل المطورين والمعمارية الهندسية — TRIVIUM120° (HMI Tray Designer)

وثيقة مرجعية شاملة للمهندسين والمطورين توضح البنية المعمارية، الخوارزميات الهندسية، والتقنيات المعتمدة في نظام **TRIVIUM120°** لتصميم ومحاكاة صواني الشاي الصناعية لآلات النقش ثلاثية الرؤوس الشعاعية المتزامنة (**TouchWin OP320 PLC**).

---

## 1. نظرة عامة على النظام (System Overview)

يعمل التطبيق كبيئة **CAD/CAM & HMI Simulator** تعمل بالكامل على المتصفح والهواتف الذكية بدون الحاجة لخادم خلفي (**100% Client-Side & Offline-First PWA**). يقوم النظام بـ:
1. حساب المصفوفات الهندسية للدوائر متحدة المركز وتوزيع الثقوب بتناظر ثلاثي (`120°` بين الرؤوس `T1=0°`, `T2=120°`, `T3=240°`).
2. التحقق اللحظي من التداخلات الهندسية (**Pairwise Euclidean Collision Detection**) وخلوص حافة الصينية والمركز.
3. محاكاة زمنية وحركية (**60 FPS Canvas 2D Engine**) لحركة السيرفو الشعاعي والدوراني وضربات الرؤوس الثلاثة.
4. توليد واستيراد وصفات الآلة الصناعية بصيغ متعدّدة (**TouchWin OP320 LCD Screens, PLC JSON, CSV, G-code, QR Code**).

---

## 2. المكدس التقني (Technology Stack)

### 2.1 النواة والواجهة الأمامية (Frontend & Core)
| التقنية | الإصدار | الدور الوظيفي في المشروع |
| :--- | :--- | :--- |
| **React** | `^19.0.1` | بناء واجهة المستخدم التفاعلية بإدارة حالة معيارية (Hooks-based Architecture). |
| **TypeScript** | `^7.0.2` | ضمان سلامة الأنواع الصارمة (`Strict Typing`) للموديل الهندسي، الحركات الزمنية، والـ Recipes. |
| **Vite** | `^8.3.0` | أداة البناء والتجميع فائقة السرعة مع دعم الموديولات الحديثة (`ESNext`). |
| **Tailwind CSS** | `^4.3.3` | نظام التصميم البصري المبني على لغة **Samsung One UI 8 Light** (`@tailwindcss/vite`). |
| **HTML5 Canvas 2D API** | Native | محرك الرسم الهندسي والمحاكاة اللحظية بدقة `devicePixelRatio` عالية (Retina/HiDPI). |
| **Lucide React** | `^0.546.0` | الأيقونات الصناعية والهندسية في أشرطة الأدوات واللوحات. |

### 2.2 الخطوط المضمنة محلياً (Self-Hosted Offline Fonts)
لضمان عمل التطبيق **100% Offline** داخل المصانع والورش دون الاعتماد على Google Fonts CDN:
- `@fontsource/cairo`: الخط العربي الأساسي لواجهة المشغل.
- `@fontsource/plus-jakarta-sans`: الخط اللاتيني للواجهة الفرنسية والتسميات التقنية.
- `@fontsource/jetbrains-mono`: خط أحادي المسافة (`Monospace`) لشاشات `TouchWin LCD`، الجداول الرقمية، وشبكة الإحداثيات في الكانفس.

### 2.3 مكتبات التبادل الصناعي والباركود (Industrial I/O & QR)
- **`qrcode`** (`^1.5.4`): توليد رموز QR عالية الكثافة لتبادل الوصفات بين الهواتف والـ HMI بدون كابلات.
- **`jsqr`** (`^1.4.0`) + **`MediaDevices Camera API`**: مسح وقراءة رموز QR للوصفات مباشرة عبر كاميرا الهاتف أو رفع صورة.

### 2.4 بيئة الاختبارات والتحقق (Testing & QA)
- **`vitest`** (`^5.0.3`): إطار اختبارات الوحدات السريع (`Unit & Property-Based Testing`) لتغطية الحسابات الرياضية، التناظر الثلاثي، الزمن، وتنسيق وصفات الآلة.

---

## 3. هيكلية المشروع وفصل المسؤوليات (Project Architecture)

يتبع المشروع مبدأ الفصل الصارم بين **الحساب الهندسي (Model)**، **الزمن (Timeline)**، **الرسم (Render)**، و**حالة الواجهة (UI & Hooks)**:

```text
/
├── index.html                  # إعدادات الـ Viewport، ألوان شريط النظام PWA، ووسوم الـ SEO
├── vite.config.ts              # إعدادات Vite + VitePWA (Manifest + Workbox Offline Caching)
├── vitest.config.ts            # إعدادات Vitest ومعايير تغطية الكود (Coverage Thresholds)
├── public/
│   ├── icon.svg                # الشعار الهندسي الشعاعي للتطبيق
│   ├── apple-touch-icon.png    # أيقونة نظام iOS (180x180)
│   └── icons/                  # أيقونات الـ PWA القياسية (192x192, 512x512, 512-maskable)
└── src/
    ├── types/
    │   └── index.ts            # كافة الأنواع والواجهات (TrayParams, TrayModel, Timeline, ViewOptions, CanvasTheme)
    ├── core/                   # النواة الهندسية الخالصة (Pure Functions — صفر اعتمادية على React)
    │   ├── constants.ts        # إعدادات الرؤوس الثلاثة (0°, 120°, 240°)، ألوان الطبقات، والوصفات المصنعية
    │   ├── model.ts            # بناء النموذج الهندسي، حساب التراصف الثلاثي، وكشف التداخلات
    │   ├── timeline.ts         # توليد جدول الحركات الزمنية (repos, index, fire) ودالة stateAt(t)
    │   ├── render.ts           # محرك الرسم Canvas 2D (Light/Dark Themes, Major/Minor Grid, Dimensions D/M/ΔD)
    │   ├── recipe.ts           # توليد وتحليل وصفات PLC JSON, CSV, G-code, QR, وبطاقة TouchWin النصية
    │   ├── recipeFormat.ts     # المخطط المعياري الموحد للوصفات (TRIVIUM-RECIPE-v1) والتحقق الأمني للمدخلات
    │   ├── i18n.ts             # القاموس ثنائي اللغة (العربية الفصحى الصناعية والفرنسية التقنية)
    │   └── __tests__/          # منظومة الاختبارات الشاملة (159 اختباراً)
    │       ├── math.test.ts    # اختبارات الدوال الرياضية المساعدة
    │       ├── model.test.ts   # اختبارات الهندسة، تناظر الرؤوس الثلاثة، وكشف التداخل
    │       ├── timeline.test.ts# اختبارات المحاكاة الزمنية وحالة الآلة اللحظية
    │       └── recipe.test.ts  # اختبارات مطابقة مخرجات TouchWin PLC والـ Snapshots
    ├── hooks/                  # خطافات إدارة الحالة والخدمات المحلية
    │   ├── useTrayParams.ts    # إدارة معاملات الصينية مع الحفظ المرقّم في localStorage
    │   ├── useSimulation.ts    # حلقة التحريك (requestAnimationFrame 60fps) والتحكم بالخطوات
    │   ├── usePresets.ts       # إدارة وحفظ واستيراد القوالب والـ Articles
    │   ├── usePWAInstall.ts    # التقاط حدث beforeinstallprompt واكتشاف وضع standalone و iOS
    │   ├── useNotifications.ts # نظام الإشعارات المحلية (Client-Side Local Notifications API)
    │   ├── useOnlineStatus.ts  # مراقبة حالة الاتصال بالشبكة (Online/Offline)
    │   └── useDeviceDetection.ts # التكيف مع الهواتف والأجهزة اللوحية وشاشات اللمس
    └── components/             # مكونات الواجهة (Samsung One UI 8 Light Design System)
        ├── CanvasStage.tsx     # مسرح الكانفس التفاعلي (Pan, Pinch-Zoom, Hit-Testing, Theme & Dimensions Toolbar)
        ├── TouchWinScreenMirror.tsx # محاكي شاشات TouchWin OP320 الـ 7 الحقيقية وبطاقة الوصفة
        ├── ManualModePage.tsx  # صفحة التحكم اليدوي بالمحاور واختبار الرؤوس (Screen 3 & 4)
        ├── ArticleRecipesPage.tsx   # صفحة إدارة الوصفات والـ Articles
        └── ...
```

---

## 4. الخوارزميات الهندسية والفيزيائية (Core Engineering Logic)

### 4.1 التزامن الميكانيكي للرؤوس الثلاثة (`sanitizeN`)
تحتوي الآلة على 3 رؤوس حفر ثابتة الزاوية (`T1 @ 0°`, `T2 @ 120°`, `T3 @ 240°`) تتحرك شعاعياً معاً وتنزل معاً، بينما تدور الصينية في المركز:
- يجب أن يكون عدد الثقوب $N$ في أي طبقة **مضاعفاً للعدد 3** ($N \in [3, 120]$).
- تقوم دالة `sanitizeN(n)` بتقريب أي إدخال إلى أقرب مضاعف للعدد 3، ثم يُعاد حساب زاوية الخطوة بدقة:
  $$\text{step} = \frac{360^\circ}{N}, \quad \text{holesPerHead} = \frac{N}{3}$$

### 4.2 قانون الأقطار والتباعد الشعاعي الصارم (`Radius-Only Pipeline Law`)
- **نصف قطر وقطر الطبقة الأولى ($r_1, D_1$)**:
  $$R = \frac{D_{\text{tray}}}{2}, \quad r_1 = R - \text{Margin}, \quad D_1 = 2 \times r_1 = D_{\text{tray}} - 2 \times \text{Margin}$$
- **التباعد الشعاعي جهة واحدة ($s = \text{Spacing}$)**:
  $$s = \frac{r_1 - r_{\text{last}}}{n - 1} = \frac{D_1 - D_{\text{last}}}{2 \times (n - 1)}$$
- **أنصاف أقطار وأقطار الطبقات ($r_i, D_i$)**:
  $$r_i = r_1 - s \times i, \quad D_i = 2 \times r_i$$
- **حركة السيرفو الشعاعي (`Radial Expansion Step`)**:
  بما أن حركة الرؤوس نحو المركز خط شعاعي، فإن حركة السيرفو بين كل طبقتين تساوي التباعد الشعاعي جهة واحدة مباشرة:
  $$\Delta r = s = \text{Spacing}$$

### 4.3 كشف التداخلات الهندسية (`Collision & Clearance Engine`)
يفحص `buildModel` جميع أزواج الثقوب $(A, B)$ عبر المسافة الإقليدية المباشرة:
$$d(A, B) = \sqrt{(x_A - x_B)^2 + (y_A - y_B)^2}$$
- إذا كانت $d(A, B) < D_{\text{tool}} + \text{SAFETY\_CLEARANCE\_MM} - 10^{-6}$، يُعلّم الثقبان بـ `bad = true` ويُمنع التصدير أو التشغيل الآلي (`hasErr = true`) لحماية الصينية وأسنان الحفر.

---

## 5. محرك الكانفس الصناعي المطور (Industrial Canvas 2D Engine)

تم تصميم `src/core/render.ts` و `src/components/CanvasStage.tsx` لتقديم تجربة CAD صناعية متقدمة:

### 5.1 الوضع الداكن والفاتح للكانفس (`Canvas Dark / Light Theme`)
- يدعم الكانفس ثيمين مستقلين (`light` و `dark`) يتم تبديلهما فورياً من شريط أدوات الكانفس:
  - **الوضع الداكن (`dark` — الافتراضي للكانفس)**: خلفية صناعية عالية التباين (`#0f172a` → `#0b1220`)، سطح صينية معدني داكن بحافة زرقاء مضيئة (`#38bdf8`)، وألوان طبقات عالية السطوع لضمان قراءة فورية للثقوب والحلقات.
  - **الوضع الفاتح (`light`)**: خلفية خزفية فاتحة متناسقة مع واجهة `One UI 8 Light`، ويُستخدم أيضاً بشكل ثابت في شاشة الـ `SplashScreen`.
- يُحفظ تفضيل المستخدم تلقائياً في `localStorage` تحت المفتاح `hmi-tray-canvas-theme`.

### 5.2 الشبكة الهندسية المزدوجة (`Adaptive Major / Minor Engineering Grid`)
- تختار الدالة زوج الخطوات `[minorStep, majorStep]` ديناميكياً حسب معامل التكبير (`sc`) من السلسلة القياسية بالمليمتر:
  `[1, 5]`, `[2, 10]`, `[5, 25]`, `[10, 50]`, `[20, 100]`, `[50, 250]`, `[100, 500]`, `[200, 1000]`.
- **حماية الأداء والبصر**: تُخفى خطوط `minor` تلقائياً إذا قلّ التباعد البصري على الشاشة عن `9px` أو زاد عدد الخطوط عن الحد الأقصى، مع رسم تسميات المليمتر (`mm`) على المحورين الرئيسيَين X و Y بخط `JetBrains Mono`.

### 5.3 طبقة الأبعاد الهندسية (`Engineering Dimensions Overlay: D, M, s`)
عند تفعيل زر **أبعاد / Dimensions** (`options.dimensions !== false`)، يرسم المحرك فوق الصينية ثلاثة أبعاد هندسية بأسهم قياسية وبطاقات مقروءة:
1. **قطر الصينية الكلي (`D`)**: خط أبعاد قياسي أسفل الصينية يعرض `D={trayD} mm`.
2. **هامش الحافة الشعاعي (`M`)**: سهم شعاعي عند الزاوية `-35°` من محيط الصينية الخارجي ($R$) إلى الحلقة الأولى ($r_1$) يعرض `M={margin} mm`.
3. **التباعد الشعاعي بين الحلقات (`s`)**: سهم شعاعي عمودي عند الزاوية `-90°` بين الحلقة الأولى `L1` والحلقة الثانية `L2` يعرض `s={spacing} mm`.

### 5.4 التفاعل اللمسي والماوس (`Touch Pinch-Zoom, Pan & Hit-Testing`)
- دعم السحب بإصبع واحد (`Pan`) والتكبير/التصغير بإصبعين (`2-Finger Pinch-to-Zoom`) عبر `Pointer Events API`، بالإضافة إلى عجلة الماوس (`Wheel Zoom` من `40%` حتى `6000%`).
- **فحص الإصابة العكسي (`Inverse Rotation Hit-Testing`)**: عند تمرير الماوس أو لمس ثقب أثناء دوران الصينية بزاوية $\theta$، يتم تدوير إحداثيات المؤشر عكسياً بزاوية $-\theta$ لاكتشاف الثقب بدقة وعرض نافذة تفصيلية (`Layer, Point #, Head ID, Angle, X/Y, Drill Status`).

---

## 6. تقنيات الـ PWA، ألوان النظام، والإشعارات المحلية

### 6.1 تخصيص ألوان شريط العنوان والـ Standalone Mode
تم ضبط التطبيق ليعمل كتطبيق أصيل مستقل (`display: "standalone"`) مع تلوين شريط العنوان العلوي للنظام بلون الهوية الصناعية الأزرق (`#2563eb`):
- **في `index.html`**:
  ```html
  <meta name="theme-color" content="#2563eb" />
  <meta name="mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  ```
- **في `vite.config.ts` (`VitePWA Manifest`)**:
  ```json
  {
    "name": "TRIVIUM - تريفيوم",
    "short_name": "TRIVIUM",
    "display": "standalone",
    "theme_color": "#2563eb",
    "background_color": "#ffffff"
  }
  ```

### 6.2 نظام الإشعارات المحلية بدون خادم (`Client-Side Local Notifications`)
في `src/hooks/useNotifications.ts`، يعتمد التطبيق حصرياً على واجهة **`Notification API`** المحلية في المتصفح دون أي خادم Push خارجي:
- يعمل **100% أوفلاين** من داخل كود الـ JavaScript النشط.
- عند ضغط المشغل على زر الجرس في الـ `Header`، يُطلب الإذن عبر `Notification.requestPermission()` ويُحفظ التفضيل في `localStorage` (`hmi-tray-local-notifications-enabled`).
- يتم إطلاق إشعار نظام حقيقي (`new Notification(title, options)`) مع أيقونة التطبيق واهتزاز الهاتف (`vibrate: [200, 100, 200]`) ومنع التكرار (`tag`) عند:
  1. اكتمال دورة المحاكاة الآلية للصينية.
  2. تصدير ملف وصفة `TouchWin PLC JSON`.

### 6.3 التثبيت الذكي والعمل دون اتصال (`Offline Caching & Install Prompt`)
- يقوم `Workbox` بتخزين جميع ملفات `JS, CSS, HTML, PNG, SVG, WOFF2` مسبقاً (`Precaching`).
- يلتقط `usePWAInstall.ts` حدث `beforeinstallprompt` على متصفحات Chromium/Android لعرض زر التثبيت المباشر، ويكتشف أجهزة `iOS Safari` لعرض نافذة إرشادية مصورة خطوة بخطوة للإضافة إلى الشاشة الرئيسية.
- يراقب `OfflineIndicator.tsx` حالة الاتصال (`navigator.onLine`) ويعرض شارة تنبيه غير مزعجة عند انقطاع الإنترنت.

---

## 7. إدارة الحالة ومزامنة الرابط (`State Persistence & URL Routing`)

1. **مزامنة التبويبات في الرابط (`URL Hash Routing`)**:
   - يتم حفظ ومزامنة التبويب الرئيسي النشط مباشرة في عنوان الصفحة (`#auto`, `#manual`, `#article`) عبر `window.history.replaceState` ومستمع الحدث `hashchange` في `src/App.tsx`، بالإضافة إلى نسخه احتياطياً في `localStorage` (`hmi-tray-tab`).
   - يتيح ذلك مشاركة رابط مباشر لوضع معين أو استخدام أزرار الرجوع/التقدم في المتصفح والهاتف بسلاسة.

2. **التخزين المرقّم للمعاملات (`Versioned LocalStorage`)**:
   - يحفظ `useTrayParams.ts` إعدادات الصينية في المفتاح `hmi-tray-params-v6` مع التحقق من صحة القيم واستعادة الإعدادات المصنعية الآمنة في حال تلف البيانات.
   - يحفظ `usePresets.ts` الوصفات المخصصة في المفتاح `hmi-tray-custom-presets-v1`.

---

## 8. منظومة الاختبارات والتحقق الهندسي (`Vitest Test Suite`)

يضم المشروع **159 اختباراً آلياً** في `src/core/__tests__/` تضمن عدم حدوث أي تراجع (`Regression`) في الحسابات الهندسية أو مخرجات الآلة:

| ملف الاختبار | عدد الاختبارات | النطاق المختبر |
| :--- | :--- | :--- |
| `math.test.ts` | **74** | الدوال الرياضية (`clamp`, `clampInt`, `norm360`, `sanitizeN`, `toMm`, `ease`, `fmt`, `fmtTime`) وحالات الحدود (`±Infinity`, `NaN`, `-0`). |
| `model.test.ts` | **43** | بناء النموذج الهندسي (`buildModel`)، أنصاف الأقطار، الزوايا، تناظر الرؤوس الثلاثة بزاوية `120°`، كشف التداخل، و300 اختبار عشوائي ببذرة ثابتة (`Seeded PRNG Invariants`). |
| `timeline.test.ts` | **23** | اتصال الحركات الزمنية بدون فجوات (`repos`, `index`, `fire`)، دقة `stateAt(t)` عند الحدود، وأحادية زيادة عدادات الحفر. |
| `recipe.test.ts` | **19** | دقة محاذاة أعمدة `ANGLE PARAMETERS` (7 طبقات) و`AUTO PARAMETERS` في `buildRecipeText` مع اختبار `Inline Snapshot`. |

### أوامر التشغيل للمطورين:
```bash
# تشغيل جميع الاختبارات (159 اختباراً)
npm test

# تشغيل الاختبارات في وضع المراقبة المستمرة أثناء التطوير
npm run test:watch

# فحص تغطية الكود (Code Coverage)
npm run test:coverage

# التحقق من سلامة الأنواع (TypeScript Typecheck)
npm run lint

# بناء نسخة الإنتاج (Production Build + PWA Service Worker)
npm run build
```
