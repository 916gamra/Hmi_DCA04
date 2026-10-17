import { useState, useEffect, useCallback } from 'react';
import { TrayParams } from '../types';
import { DEFAULT_PARAMS } from '../core/constants';
import { normalizeAndHydrateParams, validateRecipeParams } from '../core/recipeFormat';
import { safeStorage } from '../core/safeStorage';
import { translations, Language } from '../core/i18n';

export const STORAGE_KEY = 'hmi-tray-designer-oneui8-v5';
const LEGACY_STORAGE_KEY_V4 = 'hmi-tray-designer-oneui8-v4';
const LEGACY_STORAGE_KEY_V3 = 'hmi-tray-designer-oneui8-v3';
const LEGACY_STORAGE_KEY_V2 = 'hmi-tray-designer-oneui8-v2';

/**
 * Pure state updater for TrayParams.
 * Guarantees that:
 * 1. stepAngle is NEVER zeroed (must remain strictly > 0 for physical indexing and validation).
 * 2. In continue + custom mode, layer 0 acts as angular origin reference (off = 0).
 */
export function applyTrayParamUpdates(prev: TrayParams, updated: Partial<TrayParams>): TrayParams {
  const next = normalizeAndHydrateParams({ ...prev, ...updated });
  // If tableMode is 'continue' and mode is 'custom', angular offset on layer 0 is the reference (off = 0)
  if (next.tableMode === 'continue' && next.mode === 'custom' && next.custom && next.custom.length > 0) {
    if (next.custom[0].off !== 0) {
      next.custom[0] = { ...next.custom[0], off: 0 };
    }
  }
  return next;
}

export function useTrayParams() {
  const [params, setParams] = useState<TrayParams>(() => {
    // 1. Attempt reading active schema (v5) via safeStorage
    try {
      const savedV5 = safeStorage.getItem(STORAGE_KEY);
      if (savedV5) {
        const parsed = JSON.parse(savedV5);
        // Self-heal legacy corrupted stepAngle <= 0 if present from prior buggy saves
        if (parsed && Array.isArray(parsed.custom)) {
          for (const c of parsed.custom) {
            if (c && typeof c.stepAngle === 'number' && c.stepAngle <= 0) {
              delete c.stepAngle;
            }
          }
        }
        const validated = validateRecipeParams(parsed);
        if (validated.ok) {
          return normalizeAndHydrateParams(parsed);
        }
      }
    } catch {
      // ignore JSON parse errors
    }

    // 2. Migration fallback: check legacy v4 schema
    try {
      const savedV4 = safeStorage.getItem(LEGACY_STORAGE_KEY_V4);
      if (savedV4) {
        const parsed = JSON.parse(savedV4);
        const hydrated = normalizeAndHydrateParams(parsed);
        safeStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
        safeStorage.removeItem(LEGACY_STORAGE_KEY_V4);
        return hydrated;
      }
    } catch {
      // ignore
    }

    // 3. Migration fallback: check legacy v3 schema
    try {
      const savedV3 = safeStorage.getItem(LEGACY_STORAGE_KEY_V3);
      if (savedV3) {
        const parsed = JSON.parse(savedV3);
        const hydrated = normalizeAndHydrateParams(parsed);
        safeStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
        safeStorage.removeItem(LEGACY_STORAGE_KEY_V3);
        return hydrated;
      }
    } catch {
      // ignore
    }

    // 4. Migration fallback: check legacy v2 schema
    try {
      const savedV2 = safeStorage.getItem(LEGACY_STORAGE_KEY_V2);
      if (savedV2) {
        const parsed = JSON.parse(savedV2);
        const hydrated = normalizeAndHydrateParams(parsed);
        safeStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
        safeStorage.removeItem(LEGACY_STORAGE_KEY_V2);
        return hydrated;
      }
    } catch {
      // ignore
    }

    return normalizeAndHydrateParams(DEFAULT_PARAMS);
  });

  // Synchronize params to safeStorage with schema version
  useEffect(() => {
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(params));
  }, [params]);

  const updateParams = useCallback((updated: Partial<TrayParams>) => {
    setParams((prev) => applyTrayParamUpdates(prev, updated));
  }, []);

  const resetDefaultParams = useCallback(() => {
    setParams(normalizeAndHydrateParams(DEFAULT_PARAMS));
  }, []);

  const autoCalculateSpacing = useCallback(
    (
      onSuccess?: (msg: string) => void,
      onError?: (msg: string) => void,
      lang: Language = 'ar'
    ) => {
      if (params.layers <= 1) {
        if (onError) {
          onError(translations[lang].singleLayerNoSpacing);
        }
        return false;
      }

      const R = params.trayD / 2;
      const r1 = Math.max(0, R - params.margin);
      const rLastR = Math.max(0, params.rLast);
      const step = (r1 - rLastR) / (params.layers - 1);
      const rounded = Number(step.toFixed(3));
      const spacingDisplayVal =
        params.spacingU === 'cm' ? Number((rounded / 10).toFixed(2)) : rounded;

      updateParams({
        spacing: rounded,
        spacingDisplay: spacingDisplayVal,
      });

      if (onSuccess) {
        onSuccess(translations[lang].spacingAutoCalculated);
      }
      return true;
    },
    [params, updateParams]
  );

  return {
    params,
    setParams,
    updateParams,
    resetDefaultParams,
    autoCalculateSpacing,
  };
}
