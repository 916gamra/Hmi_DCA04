import { useState, useEffect, useCallback } from 'react';
import { RecipePreset, TrayParams } from '../types';
import { safeStorage } from '../core/safeStorage';

const CUSTOM_PRESETS_STORAGE_KEY = 'hmi-tray-custom-presets';

export function usePresets(currentParams: TrayParams) {
  const [customPresets, setCustomPresets] = useState<RecipePreset[]>(() => {
    return safeStorage.getJSON<RecipePreset[]>(CUSTOM_PRESETS_STORAGE_KEY, []);
  });

  useEffect(() => {
    safeStorage.setJSON(CUSTOM_PRESETS_STORAGE_KEY, customPresets);
  }, [customPresets]);

  const saveCustomPreset = useCallback(
    (
      title: string,
      description: string,
      lang: 'ar' | 'fr' = 'ar',
      overrideParams?: TrayParams
    ) => {
      const newPreset: RecipePreset = {
        id: `custom-recipe-${Date.now()}`,
        name: title,
        nameFr: title,
        description: description,
        descriptionFr: description,
        tag: lang === 'ar' ? 'مخصصة 🌟' : 'Personnalisée 🌟',
        tagFr: 'Personnalisée 🌟',
        params: overrideParams ? { ...overrideParams } : { ...currentParams },
      };
      setCustomPresets((prev) => [newPreset, ...prev]);
      return newPreset;
    },
    [currentParams]
  );

  const deleteCustomPreset = useCallback((presetId: string) => {
    setCustomPresets((prev) => prev.filter((p) => p.id !== presetId));
  }, []);

  return {
    customPresets,
    saveCustomPreset,
    deleteCustomPreset,
  };
}
