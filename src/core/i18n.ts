export type Language = 'ar' | 'fr';

export interface Translations {
  // App & Header
  appTitle: string;
  appSubtitle: string;
  badgeOneUi: string;
  statusSafe: string;
  statusWarn: string;
  statusErr: string;
  btnReset: string;

  // Bottom Navigation
  navAuto: string;
  navManual: string;
  navSemiAuto: string;
  navArticle: string;

  // Parameters
  cardGeoTitle: string;
  trayDiameter: string;
  toolDiameter: string;
  margin: string;
  cardRingsTitle: string;
  layersCount: string;
  spacing: string;
  lastLayerD: string;
  spacingLaw: string;
  servoRadialCourse: string;
  mathDocTitle: string;
  mathDocMarginTitle: string;
  mathDocMarginDesc: string;
  mathDocMarginNote: string;
  mathDocUniformSpacing: string;
  mathDocServoMove: string;
  mathDocServoMoveDesc: string;
  layerDistributionTitle: string;
  customModeHeader: string;
  customModeStepAngle: string;
  customModePoints: string;
  customModeOffset: string;
  timingNote: string;
  cardPointsTitle: string;
  modeAll: string;
  modeCustom: string;
  basePoints: string;
  pointsPerHead: string;
  offsetAngle: string;
  cardTimingTitle: string;
  deflowerTime: string;
  rotSpeed: string;
  expSpeed: string;
  layerTransferTime: string;

  // Simulation & View
  simStatusReady: string;
  simStatusDone: string;
  btnPlay: string;
  btnPause: string;
  btnResetSim: string;
  btnPrevStep: string;
  btnNextStep: string;
  speed: string;
  viewSectors: string;
  viewHeads: string;
  viewRings: string;
  viewLabels: string;
  viewDimensions: string;
  themeDark: string;
  themeLight: string;

  // Validation
  kpisTitle: string;
  validationSubtitle: string;
  validationAllGood: string;
  totalHoles: string;
  d1Label: string;
  dLastLabel: string;
  totalSteps: string;
  cycleTime: string;
  minClearance: string;
  tableLayer: string;
  tableDiam: string;
  tableRadius: string;
  tablePoints: string;
  tableStep: string;
  tablePerHead: string;
  tableOffset: string;
  tableMinDist: string;
  tableSpeed: string;
  tableStatus: string;
  statusOk: string;
  statusOverlap: string;
  layersBreakdown: string;
  viewModeCards: string;
  viewModeTable: string;

  // Manual Mode Page
  manualTitle: string;
  manualSubtitle: string;
  manualAngle: string;
  manualExpLength: string;
  manualDeflowerTime: string;
  manualRotSpeed: string;
  manualExpSpeed: string;
  manualPlungeTest: string;
  manualHead1: string;
  manualHead2: string;
  manualHead3: string;
  manualJogFwd: string;
  manualJogRev: string;
  manualScreen3: string;
  manualScreen4: string;
  manualParameters: string;
  manualEditSection: string;
  testButton: string;
  drillingButton: string;

  // Article Page
  articleTitle: string;
  articleSubtitle: string;
  presetsTitle: string;
  btnCopyRecipe: string;
  recipeCopied: string;
  btnPrintRecipe: string;

  // Machine Modes
  cardMachineModesTitle: string;
  cardMachineModesDesc: string;
  repteurLabel: string;
  repteurHelp: string;
  repteurFirstStroke: string;
  repteurPass: string;
  repteurIntercept: string;
  tableModeLabel: string;
  tableModeReset: string;
  tableModeResetHelp: string;
  tableModeContinue: string;
  tableModeContinueHelp: string;
  drilledHolesCount: string;
  drilledOfTotal: string;

  // Auto Page
  autoTitle: string;
  autoSubtitle: string;

  // Toast & Notifications
  notifEnabledToast: string;
  notifDisabledToast: string;
  notifDeniedToast: string;
  notifUnsupportedToast: string;
  notifLocalActivatedBody: string;
  recipeAppliedPrefix: string;
  factoryDefaultsRestored: string;
  fixErrorsBeforeStart: string;
  recipeSavedToast: string;
  importedModelAppliedToast: string;
  singleLayerNoSpacing: string;
  spacingAutoCalculated: string;
  customRecipeTag: string;

  // Drawer & Workspace Layout
  closeDrawer: string;
  trayParamsTitle: string;
  swipeToAdjust: string;
  showResults: string;
  btnAdjustShort: string;
  btnResultsShort: string;
  viewResultsSim: string;
  adjustTrayParams: string;

  // Canvas Stage & Interactive Tools
  zoomIn: string;
  zoomOut: string;
  zoomFit: string;
  canvas2dPreview: string;
  docMathTooltip: string;
  docMathAria: string;
  hoverHead: string;
  hoverAngle: string;
  hoverCoords: string;
  drilledStatus: string;
  pendingDrillStatus: string;
  forbiddenCollision: string;

  // Simulation Controls Telemetry
  phaseRadialMove: string;
  phaseAngularStep: string;
  phaseDrillingTrio: string;
  btnSaveArticle: string;
  btnGenerateQr: string;
  phaseLabel: string;
  layerLabel: string;
  stepLabel: string;
  holesLabel: string;

  // Save Article Modal
  saveArticleTitle: string;
  saveArticleSubtitle: string;
  articleTitleLabel: string;
  articleTitlePlaceholder: string;
  articleDescLabel: string;
  articleDescPlaceholder: string;
  btnCancel: string;
  btnSaveToArticle: string;

  // Recipe Preview Modal
  previewModelTitle: string;
  previewModelSubtitle: string;
  viewOptionsLabel: string;
  previewStatusSafe: string;
  previewStatusErr: string;
  previewParamsTitle: string;
  layersUnit: string;
  btnSaveToPresets: string;
  btnApplyAndSimulate: string;

  // TouchWin & LCD Screens
  touchWinHeaderTitle: string;
  touchWinSubtitle: string;
  touchWinApplyTooltip: string;
  touchWinApplyBtn: string;
  tabRecipeCard: string;
  tabLcdSingle: string;
  tabLcdAll: string;
  machineRecipeTitle: string;
  trayDiameterLabel: string;
  totalHolesLabel: string;
  toolDiameterLabel: string;
  holesUnit: string;
  qrCodeLabel: string;
  btnPrevScreen: string;
  btnNextScreen: string;

  // Import Modal
  importModalTitle: string;
  importModalSubtitle: string;
  importJsonTitle: string;
  importJsonSubtitle: string;
  importCsvTitle: string;
  importCsvSubtitle: string;
  importGcodeTitle: string;
  importGcodeSubtitle: string;
  importQrTitle: string;
  importQrSubtitle: string;
  importCsvError: string;
  importGcodeErrorPrefix: string;

  // Export Modal & Presets
  exportModalTitle: string;
  exportJsonTitle: string;
  exportJsonDesc: string;
  exportCsvTitle: string;
  exportCsvDesc: string;
  exportQrTitle: string;
  exportQrDesc: string;
  exportTxtTitle: string;
  exportTxtDesc: string;
  exportTriviumTitle: string;
  exportTriviumDesc: string;
  confirmDeleteTitle: string;
  importModelAria: string;
  availablePresetsCount: string;
  activeBadge: string;
  applyBtn: string;
  confirmDeleteBtn: string;

  // QR Scanner Modal
  qrScannerTitle: string;
  qrScannerSubtitle: string;
  qrScannerGuide: string;
  qrScannerStopCamera: string;
  qrScannerDirectCamera: string;
  qrScannerDirectDesc: string;
  qrScannerUploadImage: string;
  qrScannerUploadDesc: string;
  qrScannerProcessingError: string;
  qrScannerNotFound: string;

  // PWA Install Guide
  pwaInstalledBadge: string;
  pwaGuideTitle: string;
  pwaGuideSubtitle: string;
  pwaSafariStep1: string;
  pwaSafariStep1Desc: string;
  pwaSafariStep2: string;
  pwaSafariStep2Desc: string;
  pwaChromeStep1: string;
  pwaChromeStep1Desc: string;
  pwaChromeStep2: string;
  pwaChromeStep2Desc: string;
  pwaCloseGuide: string;

  // Parameters Panel & Results Details
  autoCalculateSpacingBtn: string;
  autoSpacingTooltip: string;
  equalSpacingDesc: string;
  spacingCollisionDanger: string;
  customDistributionLabel: string;
  pointsPerLayerUnit: string;
  radialSettleLabel: string;
  rotationSettleLabel: string;
  modeStandardLabel: string;
  modeRepteurActiveLabel: string;
  modeContinueLabel: string;
  modeAbsoluteLabel: string;
  mmUnit: string;
  cmUnit: string;
  toolWord: string;
  marginWord: string;
  ofSeven: string;
  spacingAutoCalculatedHint: string;
  offsetLockedContinue: string;
  offsetContinueDesc: string;
  offsetAutoLabel: string;
  stepRotServoPerHead: string;
  offsetAddDesc: string;
  ptsPerMinUnit: string;
  stepsUnit: string;
  stagesUnit: string;
  holesActualRepteur: string;
  holesPerHeadUnit: string;

  // Header Actions
  headerScanQrTitle: string;
  headerSwitchLangTitle: string;
  headerTechModalTitle: string;
  switchLangBadge: string;

  // PWA Status
  pwaStatusIos: string;
  pwaStatusUnsupported: string;
  pwaStatusManual: string;
  pwaInstallDirectTitle: string;
  pwaInstallGuideTitle: string;
  pwaInstallDirectBtn: string;
  pwaInstallGuideBtn: string;

  // Sources & Modals
  sourceQrCode: string;
  sourceImportedRecipe: string;
  deleteConfirmDesc: string;
  exportJsonTooltip: string;
  deletePresetTooltip: string;

  // Semi-Auto HMI Mode
  semiAutoTitle: string;
  semiAutoSubtitle: string;
  thetaLabel: string;
  radialLabel: string;
  spindleLabel: string;
  plungeLabel: string;
  tableZLabel: string;
  stepAngleLabel: string;
  stepRadialLabel: string;
  dwellLabel: string;
  rotHzLabel: string;
  expHzLabel: string;
  rOuterMaxLabel: string;
  btnTableMinus: string;
  btnTablePlus: string;
  btnRadialMinus: string;
  btnRadialPlus: string;
  btnRadialMax: string;
  btnSpindleOff: string;
  btnSpindleOn: string;
  btnTableZDown: string;
  btnTableZUp: string;
  btnPlunge: string;
  btnTableHome: string;
  statusActive: string;
  statusInactive: string;
  statusUp: string;
  statusDown: string;
  hardwareSoonBadge: string;
  cardSemiGeoTitle: string;
  cardSemiPtsTitle: string;
  cardSemiTimingTitle: string;
  cardSemiModesTitle: string;
  numberingModeLabel: string;
  numberingModeCam: string;
  numberingModeLayer: string;
  numberingModeGlobal: string;
  numberingModeHint: string;
  camPlaybackTitle: string;
  camPlaybackStepOf: string;
  camPlayBtn: string;
  camPauseBtn: string;
  camPrevStepBtn: string;
  camNextStepBtn: string;
  camJumpMachineBtn: string;
  camExitPreviewBtn: string;
  camStepTriadFired: string;
  cardSemiSafetyTitle: string;
  rHeadMinLabel: string;
  rHeadMinHint: string;
  rHeadMinLimitReached: string;
  rHeadMinStatusSafe: string;
  rHeadMinStatusAtLimit: string;
  executionPlanTitle: string;
  executionPlanSubtitle: string;
  planTotalPlunges: string;
  planTotalBands: string;
  planYoYoEliminated: string;
  planRadialTravel: string;
  planStepColExec: string;
  planStepColBand: string;
  planStepColRadius: string;
  planStepColTheta: string;
  planStepColHoles: string;
  planStepColCommand: string;
  planNoHolesMessage: string;
  viewExecutionPlanBtn: string;
  hideExecutionPlanBtn: string;
  spindleOffWarning: string;
  maxHolesReachedWarning: string;
  undoLastPlungeBtn: string;
  clearAllHolesBtn: string;
  confirmClearHolesTitle: string;
  confirmClearHolesDesc: string;
  ptsPerTurn: string;
  dwellHoldHint: string;
  dwellPulseHint: string;
  tablePosHigh: string;
  tablePosLow: string;
  spindleRunning: string;
  spindleStopped: string;
  currentRadiusLabel: string;
  layerActiveLabel: string;
  goToLayerRadiusBtn: string;
  ghostHolesCount: string;
  stepAngleIndexingLabel: string;
  nPointsCircleLabel: string;
  derivedSpacingBadge: string;
  radialPressesHelper: string;
  stepVsSpacingNote: string;
  planSourcePreview: string;
  planSourceReplay: string;
  previewScopeAll: string;
  previewScopeCurrent: string;
  autoDrillLayerBtn: string;
  autoDrillLayerRunning: string;
  autoDrillLayerDone: string;
  autoDrillLayerAlreadyDrilled: string;
  autoDrillLayerCancel: string;
}

export const translations: Record<Language, Translations> = {
  ar: {
    appTitle: 'TRIVIUM120° (HMI Tray Designer)',
    appSubtitle: 'Machine de gravure numérique pour plateaux circulaires à trois têtes radiales',
    badgeOneUi: 'One UI 8 Light',
    statusSafe: 'تصميم سليم ومتزامن 100%',
    statusWarn: 'تنبيه هندسي — راجع المسافات',
    statusErr: 'خطأ تداخل — التصدير معطل',
    btnReset: 'إعادة ضبط',

    navAuto: 'المحاكي الآلي',
    navManual: 'الوضع اليدوي',
    navSemiAuto: 'شبه-تلقائي (Semi-Auto)',
    navArticle: 'الوصفات والـ Article',

    autoTitle: 'المحاكي الآلي وتصميم الصينية الموزعة',
    autoSubtitle: 'تصميم هندسة الحفر التلقائية، حساب الزوايا، وتوليد إحداثيات ومحاكاة دورات الآلة الحقيقية',

    cardGeoTitle: 'هندسة الصينية والأداة',
    trayDiameter: 'قطر الصينية الإجمالي',
    toolDiameter: 'قطر سن الحفر / الأداة',
    margin: 'هامش الطبقة الأولى عن الحافة',
    cardRingsTitle: 'الدوائر متحدة المركز والتباعد',
    layersCount: 'عدد الطبقات الحلقية (الحد الأقصى بالآلة: 7)',
    spacing: 'التباعد الشعاعي بين الطبقات (s / Spacing)',
    lastLayerD: 'قطر آخر طبقة في المركز (D_آخر)',
    spacingLaw: 'قانون التباعد بين الطبقتين:',
    servoRadialCourse: 'حركة رأس الحفر على السيرفو الشعاعي:',
    mathDocTitle: 'توثيق المنطق الرياضي للتباعد التلقائي:',
    mathDocMarginTitle: '1. الهامش (Margin):',
    mathDocMarginDesc: 'هو أول تباعد يدوي يقيسه العامل بين محيط الصينية وأول طبقة:',
    mathDocMarginNote: '(هذه القيمة في تطبيقنا لضمان دقة العامل وتفادي الحافة، وليست مبرمجة في الآلة).',
    mathDocUniformSpacing: '2. التباعد الشعاعي المنتظم (s):',
    mathDocServoMove: '3. حركة السيرفو بالآلة (Expansion Length):',
    mathDocServoMoveDesc: 'تتحرك ذراع الرأس شعاعياً بمقدار التباعد الشعاعي مباشرة (s):',
    layerDistributionTitle: 'توزيع أقطار الطبقات الحالي (متساوٍ بانتظام):',
    customModeHeader: 'تخصيص كل طبقة (النقاط وإزاحة الزاوية بدون كيبورد):',
    customModeStepAngle: 'زاوية الخطوة:',
    customModePoints: 'النقاط',
    customModeOffset: 'إزاحة زاوية (°)',
    timingNote: 'مطابقة تامة لشاشات الآلة TouchWin: التردد 800 Hz وزمن الحفر 0.10 S لحساب زمن المعالجة (processing time).',
    cardPointsTitle: 'توزيع النقاط والزوايا',
    modeAll: 'نمط موحد (لكل الطبقات)',
    modeCustom: 'مخصص لكل طبقة',
    basePoints: 'نقاط الطبقة (مضاعف لـ 3)',
    pointsPerHead: 'نقاط لكل رأس',
    offsetAngle: 'إزاحة زاوية تدريجية بين الطبقات',
    cardTimingTitle: 'توقيت وسرعات الآلة (TouchWin PLC)',
    deflowerTime: 'deflower time (زمن الحفر والتفريغ)',
    rotSpeed: 'rotation speed (Hz)',
    expSpeed: 'expansion speed (Hz)',
    layerTransferTime: 'انتقال المحور الشعاعي لتغيير الطبقة (ms)',

    simStatusReady: 'جاهز للبدء',
    simStatusDone: 'اكتملت الدورة بنجاح',
    btnPlay: 'تشغيل',
    btnPause: 'إيقاف مؤقت',
    btnResetSim: 'إعادة',
    btnPrevStep: 'خطوة سابقة',
    btnNextStep: 'خطوة تالية',
    speed: 'السرعة',
    viewSectors: 'قطاعات الرؤوس',
    viewHeads: 'رؤوس T1/T2/T3',
    viewRings: 'الدوائر',
    viewLabels: 'ترقيم الثقوب',
    viewDimensions: 'أبعاد',
    themeDark: 'داكن',
    themeLight: 'فاتح',

    kpisTitle: 'نتائج الفحص الهندسي ومؤشرات الأداء (KPIs)',
    validationSubtitle: 'فحص التداخلات، التزامن، ومعدل الإنتاجية',
    validationAllGood: 'الحسابات الهندسية ممتازة: أبعاد الصينية آمنة، لا يوجد تداخل بين الثقوب، والتزامن مثالي.',
    totalHoles: 'إجمالي الثقوب',
    d1Label: 'قطر أول حلقة (D₁)',
    dLastLabel: 'قطر آخر حلقة (D_آخر)',
    totalSteps: 'خطوات التدوير (لكل رأس)',
    cycleTime: 'زمن الدورة المتوقع',
    minClearance: 'أدنى مسافة خلوص',
    tableLayer: 'الطبقة',
    tableDiam: 'القطر D (مم)',
    tableRadius: 'نصف القطر R (مم)',
    tablePoints: 'النقاط',
    tableStep: 'الخطوة (°)',
    tablePerHead: 'نقاط / رأس',
    tableOffset: 'الإزاحة (°)',
    tableMinDist: 'أدنى مسافة (مم)',
    tableSpeed: 'السرعة (ثقب/د)',
    tableStatus: 'الحالة',
    statusOk: 'سليم',
    statusOverlap: 'تداخل',
    layersBreakdown: 'تفاصيل وتحليل الطبقات',
    viewModeCards: 'بطاقات',
    viewModeTable: 'جدول',

    manualTitle: 'الوضع اليدوي للمشغل (TouchWin Manual Control)',
    manualSubtitle: 'محاكاة الشاشات 3 و 4 للمعاملات والتحكم اليدوي المباشر بالمحاور',
    manualAngle: 'rotation angle (زاوية الدوران اليدوية)',
    manualExpLength: 'expansion length (طول التمدد اليدوي)',
    manualDeflowerTime: 'deflower time (زمن الحفر اليدوي)',
    manualRotSpeed: 'rotation speed (تردد سرعة الدوران)',
    manualExpSpeed: 'expansion speed (تردد سرعة التمدد)',
    manualPlungeTest: 'اختبار تشغيل رأس الحفر اليدوي',
    manualHead1: 'الرأس 1 (0°)',
    manualHead2: 'الرأس 2 (120°)',
    manualHead3: 'الرأس 3 (240°)',
    manualJogFwd: 'تمدد ذراع السيرفو (+)',
    manualJogRev: 'سحب ذراع السيرفو (-)',
    manualScreen3: 'Screen 3 — المعاملات اليدوية',
    manualScreen4: 'Screen 4 — سرعات التشغيل اليدوي',
    manualParameters: 'manual parameters',
    manualEditSection: 'تعديل المعاملات اليدوية (Screen 3 & 4)',
    testButton: 'اختبار',
    drillingButton: 'حفر...',

    articleTitle: 'إدارة الوصفات والـ Articles',
    articleSubtitle: 'نماذج المصنع الجاهزة وشاشات الكريستال السائل TouchWin OP320',
    presetsTitle: 'قائمة الوصفات والقوالب المصنعية',
    btnCopyRecipe: 'نسخ الوصفة للعامل',
    recipeCopied: 'تم نسخ الوصفة!',
    btnPrintRecipe: 'طباعة ورقة الوصفة',

    cardMachineModesTitle: 'أوضاع الآلة والتوافق الصناعي',
    cardMachineModesDesc: 'أوضاع اختيارية لمطابقة آلات قديمة (DCA04) ودورات القناع بدون تغيير الهندسة الشعاعية الأساسية',
    repteurLabel: 'قناع الضربات المتناوبة (Repteur)',
    repteurHelp: 'حفر ضربة وتخطي ضربة بالتناوب المتصل لمحاكاة صمام التجاوز الميكانيكي/الهوائي بالآلة',
    repteurFirstStroke: 'حالة أول ضربة في الطبقة الأولى:',
    repteurPass: 'تمر (حفر فعلي)',
    repteurIntercept: 'تُعترض (تخطي وفراغ)',
    tableModeLabel: 'وضع مرجع الطاولة الدوارة (Table Mode):',
    tableModeReset: 'مرجع مطلق (إعادة للصفر)',
    tableModeResetHelp: 'إعادة تصفير الزاوية وبدء كل طبقة من إزاحتها المستقلة عن الصفر',
    tableModeContinue: 'استمرار زاوي (آلة DCA04)',
    tableModeContinueHelp: 'تراكم إزاحات الزوايا واستمرار الطاولة من زاوية التوقف دون الرجوع للصفر المطلق',
    drilledHolesCount: 'الثقوب الفعلية المحفورة',
    drilledOfTotal: 'ثقب محفور من إجمالي',

    // Toast & Notifications
    notifEnabledToast: 'تم تفعيل إشعارات النظام (PWA Notifications)',
    notifDisabledToast: 'تم إيقاف إشعارات النظام',
    notifDeniedToast: 'يرجى السماح بالإشعارات من إعدادات المتصفح',
    notifUnsupportedToast: 'الإشعارات غير مدعومة في هذا المتصفح',
    notifLocalActivatedBody: 'تم تفعيل الإشعارات المحلية بنجاح بدون سيرفر!',
    recipeAppliedPrefix: 'تم تطبيق الوصفة: ',
    factoryDefaultsRestored: 'تمت استعادة الإعدادات المصنعية الافتراضية',
    fixErrorsBeforeStart: 'يرجى معالجة الأخطاء الهندسية والتداخل أولاً قبل التشغيل.',
    recipeSavedToast: 'تم حفظ الوصفة / المقال بنجاح',
    importedModelAppliedToast: 'تم تطبيق القالب المستورد على المحاكي بنجاح',
    singleLayerNoSpacing: 'طبقة واحدة فقط — لا حاجة لحساب التباعد.',
    spacingAutoCalculated: 'تم حساب وتعديل خطوة التباعد الشعاعي بنجاح.',
    customRecipeTag: 'مخصصة 🌟',

    // Drawer & Workspace Layout
    closeDrawer: 'إغلاق الدرج',
    trayParamsTitle: 'ضبط معاملات الصينية',
    swipeToAdjust: 'اسحب للأعلى أو الأسفل للتحكم',
    showResults: 'عرض النتائج',
    btnAdjustShort: 'ضبط',
    btnResultsShort: 'نتائج',
    viewResultsSim: 'عرض النتائج والمحاكاة',
    adjustTrayParams: 'ضبط معاملات الصينية',

    // Canvas Stage & Interactive Tools
    zoomIn: 'تكبير',
    zoomOut: 'تصغير',
    zoomFit: 'ملاءمة للشاشة (100%)',
    canvas2dPreview: 'المعاينة الهندسية 2D',
    docMathTooltip: 'توثيق المنطق الرياضي وحسابات التباعد',
    docMathAria: 'توثيق المنطق الرياضي',
    hoverHead: 'الرأس:',
    hoverAngle: 'الزاوية:',
    hoverCoords: 'الإحداثيات:',
    drilledStatus: 'تم الحفر',
    pendingDrillStatus: 'بانتظار الحفر',
    forbiddenCollision: 'تداخل محظور',

    // Simulation Controls Telemetry
    phaseRadialMove: 'انتقال شعاعي إلى الطبقة',
    phaseAngularStep: 'تدوير الصينية بالخطوة الزاوية',
    phaseDrillingTrio: 'حفر متزامن بالرؤوس الثلاثة (0° / 120° / 240°)',
    btnSaveArticle: 'حفظ كـ Article / وصفة',
    btnGenerateQr: 'توليد رمز الاستجابة السريعة (QR Code)',
    phaseLabel: 'الطور:',
    layerLabel: 'الطبقة: ',
    stepLabel: 'الخطوة: ',
    holesLabel: 'الثقوب: ',

    // Save Article Modal
    saveArticleTitle: 'حفظ الوصفة كـ Article جديد',
    saveArticleSubtitle: 'إضافة البارمترات الحالية إلى صفحة الوصفات والـ Articles',
    articleTitleLabel: 'عنوان الوصفة / المقال (Title)',
    articleTitlePlaceholder: 'مثال: صينية إنتاج سريعة 35 سم',
    articleDescLabel: 'وصف تفصيلي أو ملاحظات (Description)',
    articleDescPlaceholder: 'اكتب ملاحظات حول سرعة الآلة أو نوع الإنتاج...',
    btnCancel: 'إلغاء',
    btnSaveToArticle: 'حفظ في الـ Article',

    // Recipe Preview Modal
    previewModelTitle: 'معاينة القالب المستورد',
    previewModelSubtitle: 'تحقق من الأبعاد الهندسية ونقاط الحفر قبل الحفظ أو التطبيق',
    viewOptionsLabel: 'خيارات العرض:',
    previewStatusSafe: 'التصميم متوافق هندسياً مع آلة DCA',
    previewStatusErr: 'يوجد تداخل بين الثقوب أو مع محيط الصينية',
    previewParamsTitle: 'معاملات الصينية المستوردة',
    layersUnit: 'طبقات',
    btnSaveToPresets: 'حفظ في القوالب والمقالات',
    btnApplyAndSimulate: 'تطبيق وتشغيل في المحاكي',

    // TouchWin & LCD Screens
    touchWinHeaderTitle: 'شاشات ووصفات الآلة TouchWin OP320',
    touchWinSubtitle: 'شاشات LCD الخضراء الحقيقية وبطاقة وصفة الآلة الجاهزة للإدخال',
    touchWinApplyTooltip: 'تطبيق وصفة شاشات الآلة الحقيقية: 12° / 15° / 20° / 12° بتباعد 39 مم',
    touchWinApplyBtn: 'تطبيق وصفة الآلة (4L - 39mm)',
    tabRecipeCard: 'بطاقة الوصفة',
    tabLcdSingle: 'شاشة LCD',
    tabLcdAll: 'معرض الـ 7',
    machineRecipeTitle: 'وصفة الآلة — جاهزة للإدخال',
    trayDiameterLabel: 'قطر الصينية:',
    totalHolesLabel: 'إجمالي الثقوب:',
    toolDiameterLabel: 'قطر الأداة:',
    holesUnit: 'ثقب',
    qrCodeLabel: 'رمز QR',
    btnPrevScreen: 'الشاشة السابقة',
    btnNextScreen: 'الشاشة التالية',

    // Import Modal
    importModalTitle: 'استيراد قالب ووصفة صناعية',
    importModalSubtitle: 'اختر صيغة الملف لاستيرادها ومعاينتها',
    importJsonTitle: 'ملف JSON (TouchWin PLC / قالب)',
    importJsonSubtitle: 'استيراد وصفة إلكترونية ومعاملات الآلة الكاملة',
    importCsvTitle: 'جدول نقاط CSV (Punched Points)',
    importCsvSubtitle: 'استيراد إحداثيات ثقوب الحفر والطبقات',
    importGcodeTitle: 'وصفة زوايا وسرعات TRIVIUM (.gcode/.txt)',
    importGcodeSubtitle: 'استيراد معاملات الآلة والزوايا (TRIVIUM / TouchWin)',
    importQrTitle: 'رمز الاستجابة السريعة QR Code',
    importQrSubtitle: 'مسح بالكاميرا أو رفع صورة كود QR',
    importCsvError: 'ملف CSV تالف أو يحتوي على أبعاد وطبقات خارج النطاق المسموح (50–2000 مم، 1–7 طبقات).',
    importGcodeErrorPrefix: 'خطأ في استيراد G-code: ',

    // Export Modal & Presets
    exportModalTitle: 'تصدير القالب (اختر الصيغة)',
    exportJsonTitle: 'ملف JSON (معاملات الوصفة وال PLC)',
    exportJsonDesc: 'متوافق مع الاستيراد الفوري في شاشات TouchWin',
    exportCsvTitle: 'ملف CSV (إحداثيات النقاط والثقوب)',
    exportCsvDesc: 'جدول كامل لإحداثيات X و Y والطبقات لبرامج CNC',
    exportQrTitle: 'بيانات QR (حمولة مختصرة للماسح)',
    exportQrDesc: 'نص مختصر للتحويل إلى رمز استجابة سريعة',
    exportTxtTitle: 'تقرير نصي (للمشغلين والصيانة HMI)',
    exportTxtDesc: 'ملف نصي يلخص إعدادات الآلة وأوقات الدورة',
    exportTriviumTitle: 'وصفة زوايا وسرعات (TRIVIUM)',
    exportTriviumDesc: 'وصفة زوايا وسرعات لآلة TRIVIUM / TouchWin (وليس مسار CNC عام)',
    confirmDeleteTitle: 'تأكيد الحذف',
    importModelAria: 'استيراد قالب',
    availablePresetsCount: 'قوالب متاحة',
    activeBadge: 'النشطة',
    applyBtn: 'تطبيق',
    confirmDeleteBtn: 'تأكيد الحذف',

    // QR Scanner Modal
    qrScannerTitle: 'مسح واستقبال وصفة QR',
    qrScannerSubtitle: 'قارئ TouchWin HMI اللاسلكي',
    qrScannerGuide: 'وجّه الكاميرا نحو رمز QR',
    qrScannerStopCamera: 'إيقاف الكاميرا',
    qrScannerDirectCamera: 'مسح مباشر بالكاميرا',
    qrScannerDirectDesc: 'مسح الكود عبر الكاميرا',
    qrScannerUploadImage: 'تحميل صورة QR من الجهاز',
    qrScannerUploadDesc: 'استيراد لقطة شاشة أو صورة',
    qrScannerProcessingError: 'فشلت معالجة الصورة',
    qrScannerNotFound: 'لم يتم العثور على رمز QR واضح في الصورة. تأكد من وضوح الصورة وزوايا الرمز.',

    // PWA Install Guide
    pwaInstalledBadge: 'التطبيق مثبت',
    pwaGuideTitle: 'دليل تثبيت TRIVIUM120° يدوياً',
    pwaGuideSubtitle: 'إضافة التطبيق إلى الشاشة الرئيسية',
    pwaSafariStep1: '1. اضغط زر المشاركة (Share ⎋)',
    pwaSafariStep1Desc: 'في شريط متصفح Safari أسفل الشاشة.',
    pwaSafariStep2: '2. اختر "إضافة إلى الشاشة الرئيسية"',
    pwaSafariStep2Desc: 'مرر للأسفل في القائمة ثم اضغط إضافة (Add).',
    pwaChromeStep1: '1. افتح قائمة المتصفح (النقاط الثلاث ⁝)',
    pwaChromeStep1Desc: 'في أعلى شريط عنوان المتصفح (Chrome / Edge).',
    pwaChromeStep2: '2. اختر "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية"',
    pwaChromeStep2Desc: 'سيتم إنشاء أيقونة مستقلة للتطبيق على جهازك.',
    pwaCloseGuide: 'إغلاق الدليل',

    // Parameters Panel & Results Details
    autoCalculateSpacingBtn: '⚙ احسب التباعد تلقائياً',
    autoSpacingTooltip: 'حساب تباعد متساوٍ تماماً بين محيط أول طبقة ومحيط آخر طبقة',
    equalSpacingDesc: 'التباعد الشعاعي المتساوي بين الحلقات:',
    spacingCollisionDanger: '⚠ خطر: التباعد أقل من قطر الأداة — يحدث تداخل!',
    customDistributionLabel: 'توزيع مخصص لكل طبقة',
    pointsPerLayerUnit: 'نقطة/طبقة',
    radialSettleLabel: 'استقرار التمدد الشعاعي',
    rotationSettleLabel: 'استقرار تدوير الرأس',
    modeStandardLabel: 'الوضع القياسي',
    modeRepteurActiveLabel: 'Repteur مفعّل',
    modeContinueLabel: 'استمرار زاوي',
    modeAbsoluteLabel: 'مرجع مطلق',
    mmUnit: 'مم',
    cmUnit: 'سم',
    toolWord: 'أداة',
    marginWord: 'هامش',
    ofSeven: 'من 7',
    spacingAutoCalculatedHint: 'محسوب تلقائياً من شعاع أول حلقة وآخر حلقة — غير قابل للتحرير',
    offsetLockedContinue: '0° (مقفل — استمرار شعاعي)',
    offsetContinueDesc: 'في وضع الاستمرار الزاوي (continue)، الإزاحة التدريجية ملغاة؛ تستمر الطاولة شعاعياً من موضع آخر ضربة تلقائياً دون إزاحة إضافية.',
    offsetAutoLabel: ' (تلقائي)',
    stepRotServoPerHead: 'خطوة دوران السيرفو للرأس الواحد = ',
    offsetAddDesc: 'تُزاح كل طبقة تدريجياً لمنع اصطفاف الثقوب خطياً وتحقيق مظهر دوامي متناسق.',
    ptsPerMinUnit: 'ث/د',
    stepsUnit: 'خطوة',
    stagesUnit: 'مراحل',
    holesActualRepteur: 'الثقوب الفعلية (Repteur)',
    holesPerHeadUnit: 'حفر/رأس',

    headerScanQrTitle: 'مسح واستقبال كود QR للوصفة',
    headerSwitchLangTitle: 'Passer en Français',
    headerTechModalTitle: 'الوصف التقني وفلسفة TRIVIUM',
    switchLangBadge: 'FR',
    pwaStatusIos: 'أجهزة iPhone / iPad تتطلب التثبيت اليدوي من قائمة مشاركة Safari:',
    pwaStatusUnsupported: 'هذا المتصفح لا يدعم التثبيت التلقائي المباشر. يمكنك تثبيت التطبيق يدوياً من قائمة المتصفح:',
    pwaStatusManual: 'نافذة التثبيت التلقائي غير متاحة حالياً (أو داخل معاينة). اتبع الخطوات اليدوية التالية:',
    pwaInstallDirectTitle: 'تثبيت تطبيق TRIVIUM120° مباشرة (PWA)',
    pwaInstallGuideTitle: 'طريقة تثبيت التطبيق على الجهاز',
    pwaInstallDirectBtn: 'تثبيت التطبيق',
    pwaInstallGuideBtn: 'تثبيت (دليل)',
    sourceQrCode: 'رمز QR',
    sourceImportedRecipe: 'وصفة مستوردة',
    deleteConfirmDesc: 'هل أنت متأكد من رغبتك في حذف هذا القالب؟ لا يمكن التراجع عن هذا الإجراء.',
    exportJsonTooltip: 'تصدير هذا القالب (JSON)',
    deletePresetTooltip: 'حذف القالب',

    semiAutoTitle: 'لوحة التحكم شبه التلقائية (Semi-Auto HMI)',
    semiAutoSubtitle: 'محاكاة أزرار التحكم اليدوي ونظام التشغيل شبه التلقائي',
    thetaLabel: 'زاوية الطاولة (θ)',
    radialLabel: 'الموضع الشعاعي (r)',
    spindleLabel: 'رؤوس التزيين (Spindle)',
    plungeLabel: 'الغطس (Plunge / Push)',
    tableZLabel: 'موضع الطاولة Z',
    stepAngleLabel: 'خطوة الزاوية (°)',
    stepRadialLabel: 'خطوة الشعاع (مم)',
    dwellLabel: 'زمن الحفر / Dwell (ث)',
    rotHzLabel: 'سرعة الدوران (Hz)',
    expHzLabel: 'سرعة التمدد (Hz)',
    rOuterMaxLabel: 'أقصى شعاع مسموح (mm)',
    btnTableMinus: 'θ −',
    btnTablePlus: 'θ +',
    btnRadialMinus: 'r −',
    btnRadialPlus: 'r +',
    btnRadialMax: 'r → MAX',
    btnSpindleOff: 'Spindle OFF',
    btnSpindleOn: 'Spindle ON',
    btnTableZDown: 'الطاولة نازلة (DOWN)',
    btnTableZUp: 'الطاولة مرتفعة (UP)',
    btnPlunge: 'ضغط حفر (PLUNGE / PUSH)',
    btnTableHome: 'طاولة 0° (Home عتاد)',
    statusActive: 'نشط',
    statusInactive: 'متوقف',
    statusUp: 'مرتفع',
    statusDown: 'نازل',
    hardwareSoonBadge: 'قريباً / عتاد',
    cardSemiGeoTitle: 'هندسة الصينية (Plateau)',
    cardSemiPtsTitle: 'توزيع النقاط والزوايا (Angles & Pas)',
    cardSemiTimingTitle: 'التوقيت والسرعة (Vitesse & Temporisation)',
    cardSemiModesTitle: 'أوضاع الآلة (Modes machine)',
    numberingModeLabel: 'نمط ترقيم الثقوب',
    numberingModeCam: 'مسار CAM التنفيذي (1..الضربات من الخارج للداخل)',
    numberingModeLayer: 'لكل حلقة (1..n)',
    numberingModeGlobal: 'تراكمي شامل (1..N)',
    numberingModeHint: 'ترقيم مسار CAM الحتمي يرتب الثقوب بدقة حسب تسلسل تنفيذ الآلة ويوفر حركات الارتداد',
    camPlaybackTitle: 'محاكي مسار التشغيل خطوة بخطوة (CAM Step Playback)',
    camPlaybackStepOf: 'خطوة {current} من {total}',
    camPlayBtn: 'تشغيل المحاكاة',
    camPauseBtn: 'إيقاف مؤقت',
    camPrevStepBtn: 'الخطوة السابقة',
    camNextStepBtn: 'الخطوة التالية',
    camJumpMachineBtn: 'مزامنة الآلة الحية مع الخطوة',
    camExitPreviewBtn: 'العودة للتحكم اليدوي',
    camStepTriadFired: 'الرؤوس المفعلة في الضربة: {heads}',
    cardSemiSafetyTitle: 'حدود الأمان ومسافة الرؤوس (Sécurité)',
    rHeadMinLabel: 'حد أدنى شعاع الرؤوس (r min أمان)',
    rHeadMinHint: 'أقرب مسافة ميكانيكية مسموحة للرؤوس نحو المركز لتفادي الاصطدام. مستقلة تماماً عن آخر حلقة تصميمية.',
    rHeadMinLimitReached: 'تنبيه: تم بلوغ الحد الأدنى لشعاع الرؤوس (r min). تم تثبيت الحركة لمنع الاصطدام!',
    rHeadMinStatusSafe: 'نطاق حركة آمن',
    rHeadMinStatusAtLimit: 'الرؤوس عند الحد الأدنى (Butée)',
    executionPlanTitle: 'مسار التشغيل (خارج ← داخل)',
    executionPlanSubtitle: 'فرز أحادي الاتجاه يلغي ارتداد الرؤوس (Anti Yo-Yo) ويخفض زمن التشغيل',
    planTotalPlunges: 'إجمالي الضربات (Plunges)',
    planTotalBands: 'الأشرطة الشعاعية',
    planYoYoEliminated: 'حركات Yo-Yo ملغاة',
    planRadialTravel: 'مشوار الشعاع الخارجي للداخلي',
    planStepColExec: '#',
    planStepColBand: 'الشريط',
    planStepColRadius: 'r (مم)',
    planStepColTheta: 'θ (درجة)',
    planStepColHoles: 'الثقوب',
    planStepColCommand: 'الأمر التقديري',
    planNoHolesMessage: 'لا توجد ثقوب مسجلة بعد. قم بالحفر اليدوي لتوليد مسار التشغيل الذكي تلقائياً.',
    viewExecutionPlanBtn: 'عرض مسار التشغيل (خارج ← داخل)',
    hideExecutionPlanBtn: 'إخفاء مسار التشغيل',
    spindleOffWarning: 'تنبيه: يجب تشغيل رؤوس التزيين (Spindle ON) قبل الحفر!',
    maxHolesReachedWarning: 'تم الوصول للحد الأقصى للثقوب (1500 ثقب)!',
    undoLastPlungeBtn: 'تراجع (3 ثقوب)',
    clearAllHolesBtn: 'مسح كل الحفر',
    confirmClearHolesTitle: 'تأكيد مسح كل الحفر',
    confirmClearHolesDesc: 'هل أنت متأكد من مسح جميع الثقوب المحفورة في وضع Semi-Automatic؟ لا يمكن التراجع عن هذا الإجراء.',
    ptsPerTurn: 'تقسيم/دورة',
    dwellHoldHint: '0 = استمرار بالضغط (Hold)',
    dwellPulseHint: 'نبضة مؤقتة (Pulse)',
    tablePosHigh: 'مرتفعة للأعلى (UP)',
    tablePosLow: 'نازلة للأسفل (DOWN)',
    spindleRunning: 'تدور وجاهزة للحفر',
    spindleStopped: 'متوقفة (OFF)',
    currentRadiusLabel: 'نصف القطر الحالي للرؤوس r (مم)',
    layerActiveLabel: 'الطبقة النشطة (Layer)',
    goToLayerRadiusBtn: 'انتقال لنصف قطر الطبقة',
    ghostHolesCount: 'أشباح الشبكة',
    stepAngleIndexingLabel: 'خطوة فهرسة الطاولة (θ)',
    nPointsCircleLabel: 'عدد نقاط الحلقة (n)',
    derivedSpacingBadge: 'تباعد هندسي مشتق (s)',
    radialPressesHelper: 'بين حلقتين متتاليتين: s = {s} مم → حوالي {n} ضغطة r± (بخطوة {step} مم)',
    stepVsSpacingNote: 'المسافة بين الحلقات s مشتقة هندسياً، بينما خطوة الزر r± حرة ومستقلة لتمنحك تحكماً ميدانياً مرناً.',
    planSourcePreview: 'معاينة الشبكة',
    planSourceReplay: 'إعادة عرض المحفور',
    previewScopeAll: 'كل الطبقات',
    previewScopeCurrent: 'الحلقة الحالية',
    autoDrillLayerBtn: 'حفر الحلقة الحالية تلقائياً',
    autoDrillLayerRunning: 'جاري حفر الحلقة...',
    autoDrillLayerDone: 'تم حفر الحلقة بنجاح ({count} ثقب)',
    autoDrillLayerAlreadyDrilled: 'جميع نقاط هذه الحلقة محفورة بالفعل',
    autoDrillLayerCancel: 'إلغاء الحفر التلقائي',
  },
  fr: {
    appTitle: 'TRIVIUM120° (HMI Tray Designer)',
    appSubtitle: 'Machine de gravure numérique pour plateaux circulaires à trois têtes radiales',
    badgeOneUi: 'One UI 8 Light',
    statusSafe: 'Conception 100% conforme',
    statusWarn: 'Avertissement — Vérifier entraxes',
    statusErr: 'Erreur collision — Export bloqué',
    btnReset: 'Réinit.',

    navAuto: 'Guide Automatique',
    navManual: 'Manuel',
    navSemiAuto: 'Semi-Auto',
    navArticle: 'Articles & Recettes',

    autoTitle: 'Simulateur Automatique & Design de Plateau',
    autoSubtitle: 'Conception géométrique automatique, calcul des angles et simulation des cycles machine',

    cardGeoTitle: 'Géométrie du plateau et outil',
    trayDiameter: 'Diamètre total du plateau',
    toolDiameter: 'Diamètre du forêt / outil',
    margin: 'Marge extérieure (bord du plateau)',
    cardRingsTitle: 'Cercles concentriques & Espacement',
    layersCount: 'Nombre de couches (Max machine : 7)',
    spacing: 'Espacement radial entre couches (s / Spacing)',
    lastLayerD: 'Diamètre dernière couche au centre (D_fin)',
    spacingLaw: "Règle d'espacement des couches :",
    servoRadialCourse: 'Course radiale du servo :',
    mathDocTitle: "Documentation mathématique de l'espacement automatique :",
    mathDocMarginTitle: '1. Marge extérieure (Bord) :',
    mathDocMarginDesc: 'Premier espacement mesuré manuellement entre le bord du plateau et la 1ère couche :',
    mathDocMarginNote: '(Valeur intégrée dans notre app pour la précision de l’opérateur, non programmée dans la machine).',
    mathDocUniformSpacing: '2. Espacement radial uniforme (s) :',
    mathDocServoMove: '3. Course du servomoteur machine (Expansion Length) :',
    mathDocServoMoveDesc: 'Le bras se déplace radialement de la valeur de l’espacement radial (s) :',
    layerDistributionTitle: 'Répartition actuelle des diamètres (uniforme) :',
    customModeHeader: 'Personnalisation de chaque couche (points & décalages) :',
    customModeStepAngle: 'Angle de pas :',
    customModePoints: 'Points',
    customModeOffset: 'Décalage angulaire (°)',
    timingNote: 'Conformité exacte aux écrans TouchWin : 800 Hz et 0.10 S pour le calcul du temps de traitement.',
    cardPointsTitle: 'Répartition des points & angles',
    modeAll: 'Mode uniforme (toutes couches)',
    modeCustom: 'Personnalisé par couche',
    basePoints: 'Points par couche (multiple de 3)',
    pointsPerHead: 'Points par tête',
    offsetAngle: 'Décalage angulaire progressif',
    cardTimingTitle: 'Temporisation & Vitesses (TouchWin PLC)',
    deflowerTime: 'deflower time (temps perçage / dégagement)',
    rotSpeed: 'rotation speed (Hz)',
    expSpeed: 'expansion speed (Hz)',
    layerTransferTime: 'Transfert radial inter-couches (ms)',

    simStatusReady: 'Prêt à démarrer',
    simStatusDone: 'Cycle terminé avec succès',
    btnPlay: 'Démarrer',
    btnPause: 'Pause',
    btnResetSim: 'Réinitialiser',
    btnPrevStep: 'Pas précédent',
    btnNextStep: 'Pas suivant',
    speed: 'Vitesse',
    viewSectors: 'Secteurs têtes',
    viewHeads: 'Têtes T1/T2/T3',
    viewRings: 'Cercles',
    viewLabels: 'Numéros des trous',
    viewDimensions: 'Dimensions',
    themeDark: 'Sombre',
    themeLight: 'Clair',

    kpisTitle: 'Résultats géométriques & Indicateurs clés (KPIs)',
    validationSubtitle: 'Validation géométrique, collisions et cadences',
    validationAllGood: 'Calculs géométriques conformes : aucune collision, entraxes validés.',
    totalHoles: 'Total trous',
    d1Label: 'Diamètre 1ère couche (D₁)',
    dLastLabel: 'Diamètre fin (D_fin)',
    totalSteps: 'Pas de rotation / tête',
    cycleTime: 'Temps cycle estimé',
    minClearance: 'Distance mini entre trous',
    tableLayer: 'Couche',
    tableDiam: 'Diamètre D (mm)',
    tableRadius: 'Rayon R (mm)',
    tablePoints: 'Points',
    tableStep: 'Pas (°)',
    tablePerHead: 'Pts / Tête',
    tableOffset: 'Décalage (°)',
    tableMinDist: 'Dist. min (mm)',
    tableSpeed: 'Cadence (pts/min)',
    tableStatus: 'État',
    statusOk: 'Conforme',
    statusOverlap: 'Collision',
    layersBreakdown: 'Détails & Analyse des couches',
    viewModeCards: 'Cartes',
    viewModeTable: 'Tableau',

    manualTitle: 'Contrôle Manuel Opérateur (TouchWin OP320)',
    manualSubtitle: 'Simulation des écrans 3 et 4 pour tests manuels des axes et perçage',
    manualAngle: 'rotation angle (angle manuel)',
    manualExpLength: 'expansion length (course manuelle)',
    manualDeflowerTime: 'deflower time (temps perçage manuel)',
    manualRotSpeed: 'rotation speed (vitesse rotation)',
    manualExpSpeed: 'expansion speed (vitesse expansion)',
    manualPlungeTest: 'Test de plongée manuelle par tête',
    manualHead1: 'Tête 1 (0°)',
    manualHead2: 'Tête 2 (120°)',
    manualHead3: 'Tête 3 (240°)',
    manualJogFwd: 'Avance radiale servomoteur (+)',
    manualJogRev: 'Recul radial servomoteur (-)',
    manualScreen3: 'Screen 3 — Paramètres Manuels',
    manualScreen4: 'Screen 4 — Vitesses Manuelles',
    manualParameters: 'manual parameters',
    manualEditSection: 'Modification des paramètres (Écrans 3 & 4)',
    testButton: 'Test',
    drillingButton: 'Perçage...',

    articleTitle: 'Gestion des Recettes & Articles',
    articleSubtitle: 'Modèles d\'usine prédéfinis et écrans LCD TouchWin OP320',
    presetsTitle: 'Catalogue des articles et recettes usine',
    btnCopyRecipe: 'Copier la recette pour l\'opérateur',
    recipeCopied: 'Recette copiée !',
    btnPrintRecipe: 'Imprimer la fiche recette',

    cardMachineModesTitle: 'Modes Machine & Rétrocompatibilité',
    cardMachineModesDesc: 'Modes optionnels pour correspondre aux machines historiques (DCA04) sans altérer la géométrie radiale',
    repteurLabel: 'Masque de frappe alternée (Répteur)',
    repteurHelp: 'Perce une frappe et saute la suivante en alternance continue (vanne mécanique/pneumatique)',
    repteurFirstStroke: 'État de la 1ère frappe (couche 1) :',
    repteurPass: 'Passer (perçage)',
    repteurIntercept: 'Intercepter (saut vide)',
    tableModeLabel: 'Mode de référence plateau rotatif :',
    tableModeReset: 'Référence absolue (Remise à zéro)',
    tableModeResetHelp: 'Remise à zéro et calcul d\'angle indépendant pour chaque couche',
    tableModeContinue: 'Continuité angulaire (DCA04)',
    tableModeContinueHelp: 'Cumul des décalages angulaires sans retour forcé au zéro absolu',
    drilledHolesCount: 'Trous réellement percés',
    drilledOfTotal: 'trous percés sur un total de',

    // Toast & Notifications
    notifEnabledToast: 'Notifications PWA activées',
    notifDisabledToast: 'Notifications PWA désactivées',
    notifDeniedToast: 'Veuillez autoriser les notifications dans le navigateur',
    notifUnsupportedToast: 'Notifications non prises en charge',
    notifLocalActivatedBody: 'Notifications locales activées avec succès (sans serveur) !',
    recipeAppliedPrefix: 'Recette appliquée : ',
    factoryDefaultsRestored: "Paramètres d'usine restaurés",
    fixErrorsBeforeStart: 'Veuillez corriger les erreurs de collision avant le démarrage.',
    recipeSavedToast: 'Article / Recette enregistré avec succès',
    importedModelAppliedToast: 'Modèle importé appliqué avec succès au simulateur',
    singleLayerNoSpacing: "Une seule couche — pas d'espacement nécessaire.",
    spacingAutoCalculated: 'Espacement radial calculé et ajusté avec succès.',
    customRecipeTag: 'Personnalisée 🌟',

    // Drawer & Workspace Layout
    closeDrawer: 'Fermer',
    trayParamsTitle: 'Paramètres du plateau',
    swipeToAdjust: 'Déroulez pour ajuster',
    showResults: 'Voir Résultats',
    btnAdjustShort: 'Régler',
    btnResultsShort: 'Résultats',
    viewResultsSim: 'Voir Résultats & Simulation',
    adjustTrayParams: 'Régler les paramètres',

    // Canvas Stage & Interactive Tools
    zoomIn: 'Zoom avant',
    zoomOut: 'Zoom arrière',
    zoomFit: "Ajuster à l'écran (100%)",
    canvas2dPreview: 'Aperçu Géométrique 2D',
    docMathTooltip: 'Documentation logique mathématique',
    docMathAria: 'Documentation mathématique',
    hoverHead: 'Tête :',
    hoverAngle: 'Angle :',
    hoverCoords: 'Coord :',
    drilledStatus: 'Percé',
    pendingDrillStatus: 'En attente',
    forbiddenCollision: 'Collision interdite',

    // Simulation Controls Telemetry
    phaseRadialMove: 'Déplacement radial',
    phaseAngularStep: 'Rotation angulaire pas-à-pas',
    phaseDrillingTrio: 'Perçage 3 têtes synchronisées (0° / 120° / 240°)',
    btnSaveArticle: 'Enregistrer Article / Recette',
    btnGenerateQr: 'Générer QR Code',
    phaseLabel: 'Phase :',
    layerLabel: 'Couche : ',
    stepLabel: 'Pas : ',
    holesLabel: 'Trous : ',

    // Save Article Modal
    saveArticleTitle: 'Enregistrer comme Article',
    saveArticleSubtitle: 'Ajouter les paramètres actuels à la liste des articles',
    articleTitleLabel: "Titre de l'article",
    articleTitlePlaceholder: 'Ex: Plateau production rapide 35 cm',
    articleDescLabel: 'Description ou notes',
    articleDescPlaceholder: 'Notes sur la production ou vitesse machine...',
    btnCancel: 'Annuler',
    btnSaveToArticle: 'Enregistrer',

    // Recipe Preview Modal
    previewModelTitle: 'Aperçu du modèle importé',
    previewModelSubtitle: "Vérifiez la géométrie avant d'enregistrer ou d'appliquer",
    viewOptionsLabel: "Options d'affichage:",
    previewStatusSafe: 'Statut géométrique validé',
    previewStatusErr: 'Collision ou débordement géométrique détecté',
    previewParamsTitle: 'Paramètres géométriques',
    layersUnit: 'L',
    btnSaveToPresets: 'Enregistrer dans les articles',
    btnApplyAndSimulate: 'Appliquer et simuler',

    // TouchWin & LCD Screens
    touchWinHeaderTitle: 'TouchWin OP320 Écrans & Recettes',
    touchWinSubtitle: 'Écrans LCD verts et fiche de paramétrage prête pour saisie',
    touchWinApplyTooltip: 'Appliquer la recette machine réelle : 12° / 15° / 20° / 12°, 39 mm',
    touchWinApplyBtn: 'Appliquer recette (4L - 39mm)',
    tabRecipeCard: 'Fiche Recette',
    tabLcdSingle: 'Écran LCD',
    tabLcdAll: '7 Écrans',
    machineRecipeTitle: 'Fiche Recette Machine — Prête à saisir',
    trayDiameterLabel: 'Diamètre plateau :',
    totalHolesLabel: 'Total trous :',
    toolDiameterLabel: 'Diamètre outil :',
    holesUnit: 'trous',
    qrCodeLabel: 'Code QR',
    btnPrevScreen: 'Écran précédent',
    btnNextScreen: 'Écran suivant',

    // Import Modal
    importModalTitle: 'Importer une recette',
    importModalSubtitle: 'Sélectionnez le format du fichier',
    importJsonTitle: 'Fichier JSON (TouchWin PLC)',
    importJsonSubtitle: 'Recette complète TouchWin JSON',
    importCsvTitle: 'Tableau CSV des points',
    importCsvSubtitle: 'Coordonnées de perçage CSV',
    importGcodeTitle: 'Recette angles/vitesses TRIVIUM',
    importGcodeSubtitle: 'Import des paramètres machine TRIVIUM',
    importQrTitle: 'Scanner un QR Code',
    importQrSubtitle: 'Scan caméra ou image QR',
    importCsvError: 'Fichier CSV invalide ou dimensions/couches hors limites autorisées (50–2000 mm, 1–7 couches).',
    importGcodeErrorPrefix: "Erreur d'import G-code : ",

    // Export Modal & Presets
    exportModalTitle: 'Exporter le modèle (Format)',
    exportJsonTitle: 'Fichier JSON (Complet)',
    exportJsonDesc: 'Recommandé pour la sauvegarde',
    exportCsvTitle: 'Fichier CSV (Coordonnées)',
    exportCsvDesc: 'Tableau Excel / CNC des points',
    exportQrTitle: 'Payload QR Code (Compact)',
    exportQrDesc: 'Données prêtes pour QR Code',
    exportTxtTitle: 'Rapport TXT (Opérateurs)',
    exportTxtDesc: 'Résumé technique imprimable',
    exportTriviumTitle: 'Recette angles/vitesses (TRIVIUM)',
    exportTriviumDesc: 'Recette angles/vitesses TRIVIUM / TouchWin (non-CNC générique)',
    confirmDeleteTitle: 'Confirmer la suppression',
    importModelAria: 'Importer un modèle',
    availablePresetsCount: 'modèles',
    activeBadge: 'Active',
    applyBtn: 'Choisir',
    confirmDeleteBtn: 'Confirmer',

    // QR Scanner Modal
    qrScannerTitle: 'Scanner Recette QR',
    qrScannerSubtitle: 'Lecteur TouchWin HMI',
    qrScannerGuide: 'Pointez la caméra vers le QR code',
    qrScannerStopCamera: 'Arrêter la caméra',
    qrScannerDirectCamera: 'Scanner en direct avec la caméra',
    qrScannerDirectDesc: 'Lecture instantanée via caméra',
    qrScannerUploadImage: 'Charger une image QR',
    qrScannerUploadDesc: "Importer une capture d'écran",
    qrScannerProcessingError: 'Échec traitement image',
    qrScannerNotFound: 'Aucun code QR détecté dans cette image.',

    // PWA Install Guide
    pwaInstalledBadge: 'Installé',
    pwaGuideTitle: 'Guide d’installation manuelle PWA',
    pwaGuideSubtitle: 'Ajouter à l’écran d’accueil',
    pwaSafariStep1: '1. Appuyez sur Partager (⎋)',
    pwaSafariStep1Desc: 'Dans la barre du navigateur Safari.',
    pwaSafariStep2: '2. "Sur l\'écran d\'accueil" (⊞)',
    pwaSafariStep2Desc: 'Faites défiler vers le bas puis appuyez sur Ajouter.',
    pwaChromeStep1: '1. Ouvrez le menu du navigateur (⁝)',
    pwaChromeStep1Desc: 'En haut à droite de Chrome ou Edge.',
    pwaChromeStep2: '2. "Installer l\'application" ou "Ajouter à l\'écran d\'accueil"',
    pwaChromeStep2Desc: 'Une icône dédiée sera créée sur votre appareil.',
    pwaCloseGuide: 'Fermer le guide',

    // Parameters Panel & Results Details
    autoCalculateSpacingBtn: '⚙ Auto',
    autoSpacingTooltip: 'Calculer un espacement uniforme entre la 1ère et la dernière couche',
    equalSpacingDesc: 'Espacement radial uniforme :',
    spacingCollisionDanger: '⚠ Danger : Espacement inférieur au diamètre outil — collision !',
    customDistributionLabel: 'Distribution personnalisée',
    pointsPerLayerUnit: 'pts/couche',
    radialSettleLabel: 'Ramp expansion (settling)',
    rotationSettleLabel: 'Ramp rotation (settling)',
    modeStandardLabel: 'Mode standard',
    modeRepteurActiveLabel: 'Répteur actif',
    modeContinueLabel: 'Continuité',
    modeAbsoluteLabel: 'Absolu',
    mmUnit: 'mm',
    cmUnit: 'cm',
    toolWord: 'Outil',
    marginWord: 'Marge',
    ofSeven: '/ 7',
    spacingAutoCalculatedHint: 'Calculé automatiquement à partir du premier et dernier rayon — non modifiable',
    offsetLockedContinue: '0° (verrouillé)',
    offsetContinueDesc: 'En mode continuité, le décalage progressif est désactivé ; la table reprend radialement du dernier perçage sans décalage additionnel.',
    offsetAutoLabel: ' (auto)',
    stepRotServoPerHead: 'Pas de rotation du servo par tête = ',
    offsetAddDesc: 'Décalage angulaire progressif pour éviter l’alignement radial.',
    ptsPerMinUnit: 'p/m',
    stepsUnit: 'p',
    stagesUnit: 'st',
    holesActualRepteur: 'Trous réels (Répteur)',
    holesPerHeadUnit: 'trous/tête',

    headerScanQrTitle: 'Scanner QR pour recevoir recette',
    headerSwitchLangTitle: 'التحويل إلى العربية',
    headerTechModalTitle: 'Description technique et philosophie TRIVIUM',
    switchLangBadge: 'AR',
    pwaStatusIos: 'Sur iPhone / iPad, l’installation se fait manuellement via le menu Partager de Safari :',
    pwaStatusUnsupported: 'Ce navigateur ne prend pas en charge l’installation directe. Installez manuellement via le menu :',
    pwaStatusManual: 'L’invite automatique n’est pas disponible actuellement. Suivez ces étapes manuelles :',
    pwaInstallDirectTitle: 'Installer TRIVIUM120° (PWA)',
    pwaInstallGuideTitle: 'Guide d’installation PWA',
    pwaInstallDirectBtn: 'Installer',
    pwaInstallGuideBtn: 'Installer (Guide)',
    sourceQrCode: 'Code QR',
    sourceImportedRecipe: 'Recette importée',
    deleteConfirmDesc: 'Êtes-vous sûr de vouloir supprimer ce modèle ? Cette action est irréversible.',
    exportJsonTooltip: 'Exporter (JSON)',
    deletePresetTooltip: 'Supprimer',

    semiAutoTitle: 'Panneau de Contrôle Semi-Automatique',
    semiAutoSubtitle: 'Simulation des boutons manuels & macro semi-automatique',
    thetaLabel: 'Angle table (θ)',
    radialLabel: 'Position radiale (r)',
    spindleLabel: 'Broches (Spindle)',
    plungeLabel: 'Plongée (Plunge / Push)',
    tableZLabel: 'Table Z (Haut/Bas)',
    stepAngleLabel: 'Pas angulaire (°)',
    stepRadialLabel: 'Pas radial (mm)',
    dwellLabel: 'Temps de dwell (s)',
    rotHzLabel: 'Vitesse rot (Hz)',
    expHzLabel: 'Vitesse exp (Hz)',
    rOuterMaxLabel: 'Rayon max (mm)',
    btnTableMinus: 'θ −',
    btnTablePlus: 'θ +',
    btnRadialMinus: 'r −',
    btnRadialPlus: 'r +',
    btnRadialMax: 'r → MAX',
    btnSpindleOff: 'Broches OFF',
    btnSpindleOn: 'Broches ON',
    btnTableZDown: 'Table Basse (DOWN)',
    btnTableZUp: 'Table Haute (UP)',
    btnPlunge: 'Plongée (PLUNGE / PUSH)',
    btnTableHome: 'Table 0° (Home)',
    statusActive: 'Actif',
    statusInactive: 'Inactif',
    statusUp: 'Haut',
    statusDown: 'Bas',
    hardwareSoonBadge: 'Bientôt / Matériel',
    cardSemiGeoTitle: 'Géométrie du plateau',
    cardSemiPtsTitle: 'Répartition des points & ANGLES',
    cardSemiTimingTitle: 'Temporisation et vitesse',
    cardSemiModesTitle: 'Modes machine',
    numberingModeLabel: 'Mode de numérotation',
    numberingModeCam: 'Ordre CAM Exécution (1..Plongées Ext->Int)',
    numberingModeLayer: 'Par anneau (1..n)',
    numberingModeGlobal: 'Cumulatif global (1..N)',
    numberingModeHint: 'Le mode CAM numérote selon l’ordre optimal d’exécution sans va-et-vient radial',
    camPlaybackTitle: 'Simulateur pas-à-pas du plan CAM',
    camPlaybackStepOf: 'Étape {current} sur {total}',
    camPlayBtn: 'Lancer l’animation',
    camPauseBtn: 'Pause',
    camPrevStepBtn: 'Étape précédente',
    camNextStepBtn: 'Étape suivante',
    camJumpMachineBtn: 'Aligner la machine réelle sur cette étape',
    camExitPreviewBtn: 'Retour au contrôle manuel',
    camStepTriadFired: 'Têtes actives : {heads}',
    cardSemiSafetyTitle: 'Sécurité & Butée mécanique',
    rHeadMinLabel: 'Rayon minimal des têtes (r min sécurité)',
    rHeadMinHint: 'Limite mécanique absolue vers le centre pour éviter la collision entre les têtes. Indépendante de l’anneau rLast.',
    rHeadMinLimitReached: 'Attention : Butée minimale des têtes atteinte (r min). Mouvement vers le centre verrouillé !',
    rHeadMinStatusSafe: 'Course libre et sûre',
    rHeadMinStatusAtLimit: 'En butée minimale (Stop)',
    executionPlanTitle: 'Plan d’exécution (Extérieur → Intérieur)',
    executionPlanSubtitle: 'Séquencement sans va-et-vient radial (anti Yo-Yo), réduisant l’usure et le temps d’usinage',
    planTotalPlunges: 'Total plongées',
    planTotalBands: 'Bandes radiales',
    planYoYoEliminated: 'Allers-retours évités',
    planRadialTravel: 'Course radiale extérieure → intérieure',
    planStepColExec: '#',
    planStepColBand: 'Bande',
    planStepColRadius: 'r (mm)',
    planStepColTheta: 'θ (deg)',
    planStepColHoles: 'Trous',
    planStepColCommand: 'Commande estimée',
    planNoHolesMessage: 'Aucun perçage enregistré. Effectuez des perçages pour générer le plan optimisé.',
    viewExecutionPlanBtn: 'Afficher le plan d’exécution (Extérieur → Intérieur)',
    hideExecutionPlanBtn: 'Masquer le plan d’exécution',
    spindleOffWarning: 'Attention : Activez la broche (Spindle ON) avant de percer !',
    maxHolesReachedWarning: 'Limite maximale de trous atteinte (1500 trous) !',
    undoLastPlungeBtn: 'Annuler (3 trous)',
    clearAllHolesBtn: 'Effacer tout',
    confirmClearHolesTitle: 'Confirmer l’effacement',
    confirmClearHolesDesc: 'Voulez-vous vraiment effacer tous les trous percés dans ce mode ? Cette action est irréversible.',
    ptsPerTurn: 'div/tour',
    dwellHoldHint: '0 = Maintien (Hold)',
    dwellPulseHint: 'Impulsion (Pulse)',
    tablePosHigh: 'Position Haute (UP)',
    tablePosLow: 'Position Basse (DOWN)',
    spindleRunning: 'En rotation (ON)',
    spindleStopped: 'À l’arrêt (OFF)',
    currentRadiusLabel: 'Rayon actuel des têtes r (mm)',
    layerActiveLabel: 'Couche active (Layer)',
    goToLayerRadiusBtn: 'Aller au rayon de la couche',
    ghostHolesCount: 'Fantômes de grille',
    stepAngleIndexingLabel: 'Pas d’indexation table (θ)',
    nPointsCircleLabel: 'Points par cercle (n)',
    derivedSpacingBadge: 'Espacement s calculé',
    radialPressesHelper: 'Entre deux couches : s = {s} mm → env. {n} impulsions r± (pas de {step} mm)',
    stepVsSpacingNote: 'L’espacement s est calculé géométriquement, tandis que le pas r± reste indépendant pour un pilotage précis.',
    planSourcePreview: 'Aperçu grille',
    planSourceReplay: 'Rejeu perçage',
    previewScopeAll: 'Tous cercles',
    previewScopeCurrent: 'Cercle actif',
    autoDrillLayerBtn: 'Percer le cercle actif auto',
    autoDrillLayerRunning: 'Perçage du cercle...',
    autoDrillLayerDone: 'Cercle percé avec succès ({count} trous)',
    autoDrillLayerAlreadyDrilled: 'Tous les points de ce cercle sont déjà percés',
    autoDrillLayerCancel: 'Annuler perçage auto',
  },
};
