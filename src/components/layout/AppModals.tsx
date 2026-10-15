import React from 'react';
import { TrayParams, TrayModel } from '../../types';
import { Translations, Language } from '../../core/i18n';
import { ToastState, ToastType } from '../../hooks/useToast';
import { ImportChoiceModal } from '../ImportChoiceModal';
import { RecipePreviewModal } from '../RecipePreviewModal';
import { QrCodeModal } from '../QrCodeModal';
import { QrScannerModal } from '../QrScannerModal';
import { SaveArticleModal } from '../SaveArticleModal';
import { MachineTechModal } from '../MachineTechModal';
import { MathLogicModal } from '../MathLogicModal';
import { Toast } from '../Toast';
import { OfflineIndicator } from '../OfflineIndicator';

export interface AppModalsProps {
  isImportChoiceOpen: boolean;
  setIsImportChoiceOpen: (open: boolean) => void;
  previewRecipe: { params: TrayParams; sourceName: string } | null;
  setPreviewRecipe: (recipe: { params: TrayParams; sourceName: string } | null) => void;
  isQrOpen: boolean;
  setIsQrOpen: (open: boolean) => void;
  isQrScannerOpen: boolean;
  setIsQrScannerOpen: (open: boolean) => void;
  isSaveModalOpen: boolean;
  setIsSaveModalOpen: (open: boolean) => void;
  isTechModalOpen: boolean;
  setIsTechModalOpen: (open: boolean) => void;
  isMathModalOpen: boolean;
  setIsMathModalOpen: (open: boolean) => void;
  setPendingSavePresetParams: (params: TrayParams | null) => void;

  params: TrayParams;
  model: TrayModel;
  totalCycleTimeMs: number;
  toast: ToastState;
  t: Translations;
  lang: Language;
  onRecipeParsed: (parsed: Partial<TrayParams>, sourceName: string) => void;
  onUpdateParams: (updated: Partial<TrayParams>) => void;
  onSaveCustomPreset: (title: string, description: string) => void;
  showToast: (message: string, type?: ToastType) => void;
}

export const AppModals: React.FC<AppModalsProps> = ({
  isImportChoiceOpen,
  setIsImportChoiceOpen,
  previewRecipe,
  setPreviewRecipe,
  isQrOpen,
  setIsQrOpen,
  isQrScannerOpen,
  setIsQrScannerOpen,
  isSaveModalOpen,
  setIsSaveModalOpen,
  isTechModalOpen,
  setIsTechModalOpen,
  isMathModalOpen,
  setIsMathModalOpen,
  setPendingSavePresetParams,
  params,
  model,
  totalCycleTimeMs,
  toast,
  t,
  lang,
  onRecipeParsed,
  onUpdateParams,
  onSaveCustomPreset,
  showToast,
}) => {
  return (
    <>
      <ImportChoiceModal
        isOpen={isImportChoiceOpen}
        onClose={() => setIsImportChoiceOpen(false)}
        onRecipeParsed={onRecipeParsed}
        onTriggerQrScan={() => setIsQrScannerOpen(true)}
        t={t}
        lang={lang}
      />

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
            onUpdateParams(previewRecipe.params);
            setPreviewRecipe(null);
            showToast(t.importedModelAppliedToast);
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
        totalCycleTimeMs={totalCycleTimeMs}
      />

      <QrScannerModal
        isOpen={isQrScannerOpen}
        onClose={() => setIsQrScannerOpen(false)}
        onApplyRecipe={(scannedParams) => {
          onRecipeParsed(scannedParams, t.sourceQrCode);
        }}
        t={t}
        lang={lang}
      />

      <SaveArticleModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        onSave={onSaveCustomPreset}
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
        message={toast.message || null}
        type={toast.type === 'error' ? 'error' : 'success'}
      />

      <OfflineIndicator lang={lang} />
    </>
  );
};
