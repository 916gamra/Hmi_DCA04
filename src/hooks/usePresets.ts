import { useState, useEffect, useCallback } from 'react';
import { RecipePreset, TrayParams } from '../types';

const CUSTOM_PRESETS_STORAGE_KEY = 'hmi-tray-custom-presets';

export function usePresets(currentParams: TrayParams) {
  const [customPresets, setCustomPresets] = useState<RecipePreset[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_PRESETS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load custom presets from localStorage:', e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(CUSTOM_PRESETS_STORAGE_KEY, JSON.stringify(customPresets));
    } catch (e) {
      console.warn('Failed to save custom presets:', e);
    }
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
