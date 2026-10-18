import { useState, useEffect, useMemo, useCallback } from 'react';
import { ViewOptions, RecipePreset, TrayParams } from './types';
import { buildModel } from './core/model';
import { buildTimeline } from './core/timeline';
import { normalizeAndHydrateParams } from './core/recipe';
import { safeStorage } from './core/safeStorage';
import { Header } from './components/Header';
import { ManualModePage } from './components/ManualModePage';
import { SemiAutomaticPage } from './components/SemiAutomaticPage';
import { ArticleRecipesPage } from './components/ArticleRecipesPage';
import { BottomNavBar, MainTab } from './components/BottomNavBar';
import { AutoWorkspace } from './components/layout/AutoWorkspace';
import { AppModals } from './components/layout/AppModals';
import { SplashScreen } from './components/SplashScreen';
import { Language, translations } from './core/i18n';
import { useTrayParams, STORAGE_KEY } from './hooks/useTrayParams';
import { useSimulation } from './hooks/useSimulation';
import { usePresets } from './hooks/usePresets';
import { useNotifications } from './hooks/useNotifications';
import { useToast } from './hooks/useToast';
import { useAppModals } from './hooks/useAppModals';

const LANG_STORAGE_KEY = 'hmi-tray-lang';

export default function App() {
  // 1. Language State (AR & FR)
  const [lang, setLang] = useState<Language>(() => {
    const savedLang = safeStorage.getItem(LANG_STORAGE_KEY);
    if (savedLang === 'fr' || savedLang === 'ar') return savedLang;
    return 'ar';
  });

  const t = translations[lang];

  useEffect(() => {
    safeStorage.setItem(LANG_STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
  }, [lang]);

  const toggleLanguage = () => {
    setLang((prev) => (prev === 'ar' ? 'fr' : 'ar'));
  };

  // 2. Navigation State (4 bottom tabs)
  const [mainTab, setMainTab] = useState<MainTab>(() => {
    const validTabs: MainTab[] = ['auto', 'manual', 'semiauto', 'article'];
    const hash = window.location.hash.replace(/^#/, '') as MainTab;
    if (validTabs.includes(hash)) return hash;
    const savedTab = safeStorage.getItem('hmi-tray-tab') as MainTab;
    if (validTabs.includes(savedTab)) return savedTab;
    return 'auto';
  });

  useEffect(() => {
    safeStorage.setItem('hmi-tray-tab', mainTab);
    const targetHash = `#${mainTab}`;
    if (window.location.hash !== targetHash) {
      window.history.replaceState(null, '', targetHash);
    }
  }, [mainTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const validTabs: MainTab[] = ['auto', 'manual', 'semiauto', 'article'];
      const hash = window.location.hash.replace(/^#/, '') as MainTab;
      if (validTabs.includes(hash)) {
        setMainTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // 3. Toast Notifications State
  const { toast, showToast } = useToast();

  // 4. Custom Hook: Tray Parameters Management
  const {
    params,
    updateParams,
    resetDefaultParams,
    autoCalculateSpacing,
  } = useTrayParams();

  // 5. Computed Model & Timeline
  const model = useMemo(() => buildModel(params), [params]);
  const timeline = useMemo(
    () => buildTimeline(model, params.timing, params.tableMode),
    [model, params.timing, params.tableMode]
  );

  const {
    enabled: notificationsEnabled,
    toggleNotifications,
    sendNotification,
  } = useNotifications();

  const handleToggleNotifications = useCallback(async () => {
    const status = await toggleNotifications(lang);
    if (status === 'enabled') {
      showToast(t.notifEnabledToast, 'success');
    } else if (status === 'disabled') {
      showToast(t.notifDisabledToast, 'success');
    } else if (status === 'denied') {
      showToast(t.notifDeniedToast, 'error');
    } else {
      showToast(t.notifUnsupportedToast, 'error');
    }
  }, [toggleNotifications, lang, showToast, t]);

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
          `${t.simStatusDone} (${model.totalPts} ${t.drilledHolesCount} — D=${params.trayD}mm)`,
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

  // 8. View Options & Modals State via useAppModals hook
  const [viewOptions, setViewOptions] = useState<ViewOptions>(() => {
    const stored = safeStorage.getItem('hmi-tray-canvas-theme');
    const savedTheme: 'light' | 'dark' = stored === 'light' || stored === 'dark' ? stored : 'dark';
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
      safeStorage.setItem('hmi-tray-canvas-theme', viewOptions.theme);
    }
  }, [viewOptions.theme]);

  const modals = useAppModals();

  useEffect(() => {
    modals.setIsMobileDrawerOpen(false);
  }, [mainTab, modals.setIsMobileDrawerOpen]);

  // Handlers
  const handleUpdateParams = (updated: Partial<typeof params>) => {
    updateParams(updated);
    resetSim();
  };

  const handleRecipeParsed = (parsed: Partial<typeof params>, sourceName: string) => {
    const fullParams: TrayParams = normalizeAndHydrateParams({ ...params, ...parsed });
    modals.setPreviewRecipe({ params: fullParams, sourceName });
    modals.setIsImportChoiceOpen(false);
    modals.setIsQrScannerOpen(false);
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
    showToast(`${t.recipeAppliedPrefix}: ${preset.name}`);
  };

  const handleResetDefault = () => {
    safeStorage.removeItem(STORAGE_KEY);
    resetDefaultParams();
    showToast(t.factoryDefaultsRestored);
  };

  const handleTogglePlay = () => {
    if (model.hasErr) {
      showToast(t.fixErrorsBeforeStart, 'error');
      return;
    }
    togglePlay();
  };

  const handleSaveCustomPreset = (title: string, description: string) => {
    const targetParams = modals.pendingSavePresetParams || params;
    saveCustomPreset(title, description, lang, targetParams);
    modals.setPendingSavePresetParams(null);
    modals.setPreviewRecipe(null);
    modals.setIsSaveModalOpen(false);
    showToast(t.recipeSavedToast);
  };

  return (
    <div
      className={`min-h-screen h-screen flex flex-col bg-[#eef2f8] text-[#0f172a] antialiased select-none overflow-hidden relative ${
        lang === 'ar' ? 'font-[var(--font-cairo)]' : 'font-[var(--font-sans)]'
      }`}
    >
      {modals.showSplash && <SplashScreen onFinish={() => modals.setShowSplash(false)} />}

      {/* 1. Header with System Diagnostics & Actions */}
      <Header
        model={model}
        onResetDefault={handleResetDefault}
        t={t}
        lang={lang}
        onToggleLang={toggleLanguage}
        onOpenQrScanner={() => modals.setIsQrScannerOpen(true)}
        onOpenTechModal={() => modals.setIsTechModalOpen(true)}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={handleToggleNotifications}
        activeTab={mainTab}
      />

      {/* 2. Main Content Canvas & Panels */}
      <main className="flex-1 min-h-0 overflow-y-auto px-2 sm:px-4 md:px-6 pt-2 pb-2">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          {mainTab === 'auto' && (
            <AutoWorkspace
              model={model}
              params={params}
              simState={simState}
              simTimeMs={simTimeMs}
              totalTimeMs={timeline.total}
              isPlaying={isPlaying}
              speed={speed}
              viewOptions={viewOptions}
              setViewOptions={setViewOptions}
              onTogglePlay={handleTogglePlay}
              onResetSim={resetSim}
              onStepNext={stepNext}
              onStepPrev={stepPrev}
              onScrubTime={scrubTime}
              onChangeSpeed={(spd) => {
                setSpeed(spd);
                handleUpdateParams({ speed: spd });
              }}
              onUpdateParams={handleUpdateParams}
              onAutoCalculateSpacing={handleAutoCalculateSpacing}
              onOpenSaveModal={() => modals.setIsSaveModalOpen(true)}
              onOpenQr={() => modals.setIsQrOpen(true)}
              onOpenMathModal={() => modals.setIsMathModalOpen(true)}
              isMobileDrawerOpen={modals.isMobileDrawerOpen}
              setIsMobileDrawerOpen={modals.setIsMobileDrawerOpen}
              t={t}
              lang={lang}
            />
          )}

          {mainTab === 'manual' && (
            <ManualModePage
              model={model}
              t={t}
              lang={lang}
              onShowToast={showToast}
            />
          )}

          {mainTab === 'semiauto' && (
            <SemiAutomaticPage
              t={t}
              lang={lang}
              params={params}
              onShowToast={showToast}
              viewOptions={viewOptions}
              setViewOptions={setViewOptions}
            />
          )}

          {mainTab === 'article' && (
            <ArticleRecipesPage
              params={params}
              model={model}
              customPresets={customPresets}
              onApplyPreset={handleApplyPreset}
              onDeletePreset={deleteCustomPreset}
              onOpenImportModal={() => modals.setIsImportChoiceOpen(true)}
              onOpenQr={() => modals.setIsQrOpen(true)}
              t={t}
              lang={lang}
            />
          )}
        </div>
      </main>

      {/* 3. Docked Floating Bottom Navigation Bar */}
      <BottomNavBar currentTab={mainTab} onChangeTab={setMainTab} t={t} />

      {/* 4. Modals & Notifications Layer */}
      <AppModals
        {...modals}
        params={params}
        model={model}
        totalCycleTimeMs={timeline.total}
        toast={toast}
        t={t}
        lang={lang}
        onRecipeParsed={handleRecipeParsed}
        onUpdateParams={handleUpdateParams}
        onSaveCustomPreset={handleSaveCustomPreset}
        showToast={showToast}
      />
    </div>
  );
}
