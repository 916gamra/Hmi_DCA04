import { useState } from 'react';
import { TrayParams, RecipePreset } from '../types';

export function useAppModals() {
  const [showSplash, setShowSplash] = useState(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isTechModalOpen, setIsTechModalOpen] = useState(false);
  const [isMathModalOpen, setIsMathModalOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isQrScannerOpen, setIsQrScannerOpen] = useState(false);
  const [isImportChoiceOpen, setIsImportChoiceOpen] = useState(false);
  const [previewRecipe, setPreviewRecipe] = useState<{ params: TrayParams; sourceName: string } | null>(null);
  const [pendingSavePresetParams, setPendingSavePresetParams] = useState<TrayParams | null>(null);

  return {
    showSplash,
    setShowSplash,
    isMobileDrawerOpen,
    setIsMobileDrawerOpen,
    isSaveModalOpen,
    setIsSaveModalOpen,
    isTechModalOpen,
    setIsTechModalOpen,
    isMathModalOpen,
    setIsMathModalOpen,
    isQrOpen,
    setIsQrOpen,
    isQrScannerOpen,
    setIsQrScannerOpen,
    isImportChoiceOpen,
    setIsImportChoiceOpen,
    previewRecipe,
    setPreviewRecipe,
    pendingSavePresetParams,
    setPendingSavePresetParams,
  };
}
