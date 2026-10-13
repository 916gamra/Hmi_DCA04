import { useState, useEffect, useMemo, useCallback } from 'react';
import { ViewOptions, RecipePreset, TrayParams } from './types';
import { buildModel } from './core/model';
import { buildTimeline } from './core/timeline';
import { normalizeAndHydrateParams } from './core/recipe';
import { Header } from './components/Header';
import { ParametersPanel } from './components/ParametersPanel';
import { ManualModePage } from './components/ManualModePage';
import { ArticleRecipesPage } from './components/ArticleRecipesPage';
import { BottomNavBar, MainTab } from './components/BottomNavBar';
import { QrCodeModal } from './components/QrCodeModal';
import { QrScannerModal } from './components/QrScannerModal';
import { Toast } from './components/Toast';
import { AutomaticSimulatorSection, CanvasControls, Results } from './components/AutomaticSimulatorSection';
import { CanvasStage } from './components/CanvasStage';
import { SimulationControls } from './components/SimulationControls';
import { SaveArticleModal } from './components/SaveArticleModal';
import { ImportChoiceModal } from './components/ImportChoiceModal';
import { RecipePreviewModal } from './components/RecipePreviewModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { MachineTechModal } from './components/MachineTechModal';
import { MathLogicModal } from './components/MathLogicModal';
import { SplashScreen } from './components/SplashScreen';
import { Language, translations } from './core/i18n';
import { useTrayParams, STORAGE_KEY } from './hooks/useTrayParams';
import { useSimulation } from './hooks/useSimulation';
import { usePresets } from './hooks/usePresets';
import { useNotifications } from './hooks/useNotifications';
import { LayoutGrid, SlidersHorizontal, BarChart3 } from 'lucide-react';

const LANG_STORAGE_KEY = 'hmi-tray-lang';

export default function App() {

  // 1. Language State (AR & FR)
  const [lang, setLang] = useState<Language>(() => {
    try {
      const savedLang = localStorage.getItem(LANG_STORAGE_KEY);
      if (savedLang === 'fr' || savedLang === 'ar') return savedLang;
    } catch (e) {
      console.warn('Failed to read lang preference:', e);
    }
    return 'ar';
  });

  const t = translations[lang];

  useEffect(() => {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
    } catch (e) {
      console.warn('Failed to save lang preference:', e);
    }
    document.documentElement.lang = lang;
    document.documentElement.dir = 'ltr';
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'ar' ? 'fr' : 'ar'));
  };

  // 2. Navigation State (3 bottom tabs: auto | manual | article) synced with URL hash (#auto, #manual, #article)
  const [mainTab, setMainTab] = useState<MainTab>(() => {
    const validTabs: MainTab[] = ['auto', 'manual', 'article'];
    try {
      const hash = window.location.hash.replace(/^#/, '') as MainTab;
      if (validTabs.includes(hash)) {
        return hash;
      }
      const savedTab = localStorage.getItem('hmi-tray-tab') as MainTab;
      if (validTabs.includes(savedTab)) {
        return savedTab;
      }
    } catch (e) {
      console.warn('Failed to read initial tab preference:', e);
    }
    return 'auto';
  });

  useEffect(() => {
    try {
      localStorage.setItem('hmi-tray-tab', mainTab);
      const targetHash = `#${mainTab}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, '', targetHash);
      }
    } catch (e) {
      console.warn('Failed to save tab preference:', e);
    }
  }, [mainTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const validTabs: MainTab[] = ['auto', 'manual', 'article'];
      const hash = window.location.hash.replace(/^#/, '') as MainTab;
      if (validTabs.includes(hash)) {
        setMainTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 3. Toast Notifications State
  const [toast, setToast] = useState<{ message: string | null; type: 'success' | 'error' }>({
    message: null,
    type: 'success',
  });

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: null, type: 'success' });
    }, 2800);
  }, []);

  // 4. Custom Hook: Tray Parameters Management (with Versioned Storage)
  const {
    params,
    updateParams,
    resetDefaultParams,
    autoCalculateSpacing,
  } = useTrayParams();

  // 5. Computed Model & Timeline
  const model = useMemo(() => buildModel(params), [params]);
  const timeline = useMemo(
    () => buildTimeline(model, params.timing),
    [model, params.timing]
  );

  const {
    enabled: notificationsEnabled,
    toggleNotifications,
    sendNotification,
  } = useNotifications();

  const handleToggleNotifications = useCallback(async () => {
    const status = await toggleNotifications(lang);
    if (status === 'enabled') {
      showToast(
        lang === 'ar'
          ? 'تم تفعيل إشعارات النظام (PWA Notifications)'
          : 'Notifications PWA activées',
        'success'
      );
    } else if (status === 'disabled') {
      showToast(
        lang === 'ar'
          ? 'تم إيقاف إشعارات النظام'
          : 'Notifications PWA désactivées',
        'success'
      );
    } else if (status === 'denied') {
      showToast(
        lang === 'ar'
          ? 'يرجى السماح بالإشعارات من إعدادات المتصفح'
          : 'Veuillez autoriser les notifications dans le navigateur',
        'error'
      );
    } else {
      showToast(
        lang === 'ar'
          ? 'الإشعارات غير مدعومة في هذا المتصفح'
          : 'Notifications non prises en charge',
        'error'
      );
    }
  }, [toggleNotifications, lang, showToast]);

  // 6. Custom Hook: Simulation Engine
  const {
    simTimeMs,
    isPlaying,
    speed,
    setSpeed,
    simState,
    togglePlay,
    resetSim,
    scrubTime,
    stepNext,
    stepPrev,
  } = useSimulation({
    model,
    timeline,
    initialSpeed: params.speed || 1,
    onComplete: () => {
      showToast(t.simStatusDone);
      if (notificationsEnabled) {
        sendNotification(
          'TRIVIUM120° — تريفيوم',
          lang === 'ar'
            ? `${t.simStatusDone} (${model.totalPts} ثقب — D=${params.trayD}mm)`
            : `${t.simStatusDone} (${model.totalPts} trous — D=${params.trayD}mm)`,
          'trivium-sim-done'
        );
      }
    },
  });

  // 7. Custom Hook: Article Recipes & Presets Management
  const {
    customPresets,
    saveCustomPreset,
    deleteCustomPreset,
  } = usePresets(params);

  // 8. View Options & Modals State
  const [viewOptions, setViewOptions] = useState<ViewOptions>(() => {
    let savedTheme: 'light' | 'dark' = 'dark';
    try {
      const stored = localStorage.getItem('hmi-tray-canvas-theme');
      if (stored === 'light' || stored === 'dark') {
        savedTheme = stored;
      }
    } catch (e) {
      console.warn('Failed to read canvas theme preference:', e);
    }
    return {
      sectors: true,
      heads: false,
      rings: true,
      labels: true,
      dimensions: true,
      theme: savedTheme,
    };
  });

  useEffect(() => {
    if (viewOptions.theme) {
      try {
        localStorage.setItem('hmi-tray-canvas-theme', viewOptions.theme);
      } catch (e) {
        console.warn('Failed to save canvas theme preference:', e);
      }
    }
  }, [viewOptions.theme]);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [mainTab]);

  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isImportChoiceOpen, setIsImportChoiceOpen] = useState(false);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const [previewRecipe, setPreviewRecipe] = useState<{
    params: TrayParams;
    sourceName: string;
  } | null>(null);
  const [pendingSavePresetParams, setPendingSavePresetParams] = useState<TrayParams | null>(null);

  // Handlers
  const handleUpdateParams = (updated: Partial<typeof params>) => {
    updateParams(updated);
    resetSim();
  };

  const handleRecipeParsed = (parsed: Partial<typeof params>, sourceName: string) => {
    const fullParams: TrayParams = normalizeAndHydrateParams({ ...params, ...parsed });
    setPreviewRecipe({ params: fullParams, sourceName });
    setIsImportChoiceOpen(false);
    setIsQrScannerOpen(false);
  };

  const handleAutoCalculateSpacing = () => {
    autoCalculateSpacing(
      (msg) => showToast(msg, 'success'),
      (err) => showToast(err, 'error'),
      lang
    );
  };

  const handleApplyPreset = (preset: RecipePreset) => {
    handleUpdateParams(normalizeAndHydrateParams(preset.params));
    showToast(
      lang === 'ar' ? `تم تطبيق الوصفة: ${preset.name}` : `Recette appliquée : ${preset.name}`
    );
  };

  const handleResetDefault = () => {
    localStorage.removeItem(STORAGE_KEY);
    resetDefaultParams();
    resetSim();
    showToast(
      lang === 'ar'
        ? 'تمت استعادة الإعدادات المصنعية الافتراضية'
        : "Paramètres d'usine restaurés"
    );
  };

  const handleTogglePlay = () => {
    if (model.hasErr) {
      showToast(
        lang === 'ar'
          ? 'يرجى معالجة الأخطاء الهندسية والتداخل أولاً قبل التشغيل.'
          : 'Veuillez corriger les erreurs de collision avant le démarrage.',
        'error'
      );
      return;
    }
    togglePlay();
  };

  const handleSaveCustomPreset = (title: string, description: string) => {
    const targetParams = pendingSavePresetParams || params;
    saveCustomPreset(title, description, lang, targetParams);
    setPendingSavePresetParams(null);
    setPreviewRecipe(null);
    setIsSaveModalOpen(false);
    showToast(
      lang === 'ar' ? 'تم حفظ الوصفة / المقال بنجاح' : 'Article / Recette enregistré avec succès'
    );
  };

  return (
    <div
      dir="ltr"
      className={`app-container bg-[#f1f4f9] text-[#0f172a] relative overflow-hidden select-none ${
        lang === 'ar' ? 'font-[var(--font-cairo)]' : 'font-[var(--font-sans)]'
      }`}
    >
      {showSplash && <SplashScreen onEnter={() => setShowSplash(false)} lang={lang} />}

      {/* 1. Header (Always LTR layout as requested, respecting mobile notch safe-area) */}
      <Header
        model={model}
        lang={lang}
        t={t}
        onToggleLang={toggleLanguage}
        onOpenQrScanner={() => setIsQrScannerOpen(true)}
        onResetDefault={handleResetDefault}
        onOpenTechModal={() => setIsTechModalOpen(true)}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
      />

      {/* 2. Main Executive Content Container */}
      <main
        className={`flex-1 min-h-0 max-w-[1600px] w-full mx-auto transition-all ${
          mainTab === 'auto' || mainTab === 'article' || mainTab === 'manual'
            ? 'p-2 sm:p-3 md:p-6 flex flex-col overflow-hidden lg:overflow-y-auto pb-2 sm:pb-3 md:pb-6'
            : 'overflow-y-auto overscroll-contain p-3 sm:p-4 md:p-6 pb-6'
        }`}
      >
        {/* TAB 1: AUTOMATIC GUIDE (المحاكي الآلي وتصميم الصينية) */}
        {mainTab === 'auto' && (
          <div className="flex-1 min-h-0 flex flex-col lg:block max-w-[1600px] w-full mx-auto">
            {/* Mobile View: Fixed Canvas + Simulation Controls at top, Responsive Scrollable KPI Container below */}
            <div className="lg:hidden flex-1 min-h-0 flex flex-col gap-2 relative">
              {/* 1. Fixed Top Unit: Canvas + Simulation Controls (Never scrolls or shifts) */}
              <div className="flex-none flex flex-col gap-2">
                <CanvasControls
                  model={model}
                  state={simState}
                  options={viewOptions}
                  onChangeOptions={setViewOptions}
                  currentTimeMs={simTimeMs}
                  totalTimeMs={timeline.total}
                  isPlaying={isPlaying}
                  speed={speed}
                  onTogglePlay={handleTogglePlay}
                  onReset={resetSim}
                  onStepNext={stepNext}
                  onStepPrev={stepPrev}
                  onScrubTime={scrubTime}
                  onChangeSpeed={(spd) => {
                    setSpeed(spd);
                    handleUpdateParams({ speed: spd });
                  }}
                  onOpenSaveModal={() => setIsSaveModalOpen(true)}
                  onOpenQr={() => setIsQrOpen(true)}
                  onOpenMathModal={() => setIsMathModalOpen(true)}
                  params={params}
                  totalCycleTimeMs={timeline.total}
                  t={t}
                  lang={lang}
                  onToggleDrawer={() => setIsMobileDrawerOpen((prev) => !prev)}
                  isDrawerOpen={isMobileDrawerOpen}
                />
              </div>

              {/* Scrim Overlay below sticky unit when drawer is open */}
              {isMobileDrawerOpen && (
                <div
                  className="fixed inset-0 z-35 bg-black/25 backdrop-blur-[1px] animate-in fade-in duration-200"
                  onClick={() => setIsMobileDrawerOpen(false)}
                />
              )}

              {/* Mobile Parameters Bottom Sheet Drawer (slides from bottom, does not cover canvas/controls) */}
              {isMobileDrawerOpen && (
                <div
                  className="fixed inset-x-0 bottom-[64px] z-40 max-h-[74dvh] h-[68dvh] sm:h-auto sm:max-h-[76dvh] flex flex-col bg-white rounded-t-3xl shadow-[0_-12px_44px_rgba(15,23,42,0.22)] border-t border-[#cbd5e1] animate-in slide-in-from-bottom duration-300"
                  dir="ltr"
                >
                  {/* Drawer Drag Handle & Bar */}
                  <div className="flex-none pt-2.5 pb-2.5 px-4 sm:px-5 border-b border-[#f1f5f9] flex flex-col gap-2 bg-gradient-to-b from-slate-50 to-white rounded-t-3xl">
                    <div
                      className="w-12 h-1.5 bg-slate-300 hover:bg-slate-400 rounded-full mx-auto cursor-pointer transition-colors"
                      onClick={() => setIsMobileDrawerOpen(false)}
                      title={lang === 'ar' ? 'إغلاق الدرج' : 'Fermer'}
                    />
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center font-bold shadow-2xs">
                          <SlidersHorizontal className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-xs font-bold text-[#0f172a] block">
                            {lang === 'ar' ? 'ضبط معاملات الصينية' : 'Paramètres du plateau'}
                          </span>
                          <span className="text-[10px] text-[#64748b] block">
                            {lang === 'ar' ? 'اسحب للأعلى أو الأسفل للتحكم' : 'Déroulez pour ajuster'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsMobileDrawerOpen(false)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-all cursor-pointer active:scale-95 shadow-2xs"
                      >
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span>{lang === 'ar' ? 'عرض النتائج' : 'Voir Résultats'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Scrollable Accordion Parameters with generous bottom padding for breathing room */}
                  <div className="flex-1 overflow-y-auto px-3.5 py-3.5 sm:px-5 sm:py-4 pb-32 sm:pb-28 overscroll-contain">
                    <ParametersPanel
                      params={params}
                      model={model}
                      t={t}
                      lang={lang}
                      onChange={handleUpdateParams}
                      onAutoCalculateSpacing={handleAutoCalculateSpacing}
                    />
                  </div>
                </div>
              )}

              {/* 2. Responsive KPI Container: Fixed position below controls, fills remaining vertical space down to bottom nav bar, internal scroll */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-0.5 pb-2">
                <Results
                  model={model}
                  params={params}
                  totalCycleTimeMs={timeline.total}
                  t={t}
                  lang={lang}
                  state={simState}
                  options={viewOptions}
                  onChangeOptions={setViewOptions}
                  currentTimeMs={simTimeMs}
                  totalTimeMs={timeline.total}
                  isPlaying={isPlaying}
                  speed={speed}
                  onTogglePlay={handleTogglePlay}
                  onReset={resetSim}
                  onStepNext={stepNext}
                  onStepPrev={stepPrev}
                  onScrubTime={scrubTime}
                  onChangeSpeed={(spd) => {
                    setSpeed(spd);
                    handleUpdateParams({ speed: spd });
                  }}
                  onOpenSaveModal={() => setIsSaveModalOpen(true)}
                  onOpenQr={() => setIsQrOpen(true)}
                />
              </div>
            </div>

            {/* Desktop View */}
            <div className="hidden lg:grid grid-cols-[380px_1fr] xl:grid-cols-[410px_1fr] gap-4 md:gap-6 items-start">
              <aside className="w-full">
                <ParametersPanel
                  params={params}
                  model={model}
                  t={t}
                  lang={lang}
                  onChange={handleUpdateParams}
                  onAutoCalculateSpacing={handleAutoCalculateSpacing}
                />
              </aside>

              <AutomaticSimulatorSection
                model={model}
                state={simState}
                options={viewOptions}
                onChangeOptions={setViewOptions}
                currentTimeMs={simTimeMs}
                totalTimeMs={timeline.total}
                isPlaying={isPlaying}
                speed={speed}
                onTogglePlay={handleTogglePlay}
                onReset={resetSim}
                onStepNext={stepNext}
                onStepPrev={stepPrev}
                onScrubTime={scrubTime}
                onChangeSpeed={(spd) => {
                  setSpeed(spd);
                  handleUpdateParams({ speed: spd });
                }}
                onOpenSaveModal={() => setIsSaveModalOpen(true)}
                onOpenQr={() => setIsQrOpen(true)}
                onOpenMathModal={() => setIsMathModalOpen(true)}
                params={params}
                totalCycleTimeMs={timeline.total}
                t={t}
                lang={lang}
              />
            </div>
          </div>
        )}

        {/* TAB 2: MANUAL MODE (التحكم اليدوي ومحاكاة محاور الآلة) */}
        {mainTab === 'manual' && (
          <ManualModePage
            model={model}
            t={t}
            lang={lang}
            onShowToast={showToast}
          />
        )}

        {/* TAB 3: ARTICLE & RECIPES (قائمة الوصفات وشاشات الآلة TouchWin) */}
        {mainTab === 'article' && (
          <ArticleRecipesPage
            params={params}
            model={model}
            t={t}
            lang={lang}
            onApplyPreset={handleApplyPreset}
            onDeletePreset={deleteCustomPreset}
            onOpenImportModal={() => setIsImportChoiceOpen(true)}
            onOpenQr={() => setIsQrOpen(true)}
            customPresets={customPresets}
          />
        )}
      </main>

      {/* 3. Docked Floating Bottom Navigation Bar (3 Tabs: Automatic Guide, Manual, Article) */}
      <BottomNavBar currentTab={mainTab} onChangeTab={setMainTab} t={t} />

      {/* 4. Modals & Notifications */}
      {/* Import Choice Modal (JSON / CSV / QR Code) */}
      <ImportChoiceModal
        isOpen={isImportChoiceOpen}
        onClose={() => setIsImportChoiceOpen(false)}
        onRecipeParsed={handleRecipeParsed}
        onTriggerQrScan={() => setIsQrScannerOpen(true)}
        t={t}
        lang={lang}
      />

      {/* Recipe Preview Modal with interactive Canvas, controls and Save button */}
      {previewRecipe && (
        <RecipePreviewModal
          isOpen={!!previewRecipe}
          onClose={() => setPreviewRecipe(null)}
          previewParams={previewRecipe.params}
          sourceName={previewRecipe.sourceName}
          onOpenSaveModal={() => {
            setPendingSavePresetParams(previewRecipe.params);
            setIsSaveModalOpen(true);
          }}
          onApplyToSimulator={() => {
            handleUpdateParams(previewRecipe.params);
            setPreviewRecipe(null);
            showToast(
              lang === 'ar'
                ? 'تم تطبيق القالب المستورد على المحاكي بنجاح'
                : 'Modèle importé appliqué avec succès au simulateur'
            );
          }}
          t={t}
          lang={lang}
        />
      )}

      <QrCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        params={params}
        model={model}
        totalCycleTimeMs={timeline.total}
      />

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onApplyRecipe={(scannedParams) => {
          handleRecipeParsed(scannedParams, lang === 'ar' ? 'رمز QR' : 'Code QR');
        }}
        t={t}
        lang={lang}
      />

      <SaveArticleModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={handleSaveCustomPreset}
        t={t}
        lang={lang}
      />

      <MachineTechModal
        isOpen={isTechModalOpen}
        onClose={() => setIsTechModalOpen(false)}
        lang={lang}
      />

      <MathLogicModal
        isOpen={isMathModalOpen}
        onClose={() => setIsMathModalOpen(false)}
        model={model}
        params={params}
        lang={lang}
      />

      <Toast
        message={toast.message}
        type={toast.type}
      />

      {/* Offline Connectivity Status Indicator */}
      <OfflineIndicator lang={lang} />
    </div>
  );
}
