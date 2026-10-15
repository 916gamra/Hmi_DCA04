import { useState, useEffect, useCallback } from 'react';
import { TrayParams } from '../types';
import { DEFAULT_PARAMS } from '../core/constants';
import { normalizeAndHydrateParams, validateRecipeParams } from '../core/recipeFormat';
import { safeStorage } from '../core/safeStorage';

export const STORAGE_KEY = 'hmi-tray-designer-oneui8-v5';
export const STORAGE_SCHEMA_VERSION = 5;

interface StoredParametersPayload {
  version: number;
  params: Partial<TrayParams>;
}

export function loadInitialParams(): TrayParams {
  try {
    const raw = safeStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const payload = parsed as StoredParametersPayload;
        const candidate =
          payload.version === STORAGE_SCHEMA_VERSION && payload.params && typeof payload.params === 'object'
            ? payload.params
            : (parsed as Partial<TrayParams>);
        if (
          candidate &&
          typeof candidate === 'object' &&
          typeof candidate.trayD === 'number' &&
          Number.isFinite(candidate.trayD) &&
          candidate.trayD > 0
        ) {
          const hydrated = normalizeAndHydrateParams(candidate);
          if (validateRecipeParams(hydrated).ok) {
            return hydrated;
          }
        }
      }
    }

    // Attempt migration from v4 or legacy keys if available
    const oldV4 = safeStorage.getItem('hmi-tray-designer-oneui8-v4');
    if (oldV4) {
      try {
        const parsedV4 = JSON.parse(oldV4);
        const candidateV4 =
          parsedV4 && typeof parsedV4 === 'object' && 'params' in parsedV4
            ? parsedV4.params
            : parsedV4;
        if (
          candidateV4 &&
          typeof candidateV4 === 'object' &&
          typeof candidateV4.trayD === 'number' &&
          Number.isFinite(candidateV4.trayD) &&
          candidateV4.trayD > 0
        ) {
          safeStorage.removeItem('hmi-tray-designer-oneui8-v4');
          const hydratedV4 = normalizeAndHydrateParams(candidateV4);
          if (validateRecipeParams(hydratedV4).ok) {
            return hydratedV4;
          }
        }
      } catch {
        safeStorage.removeItem('hmi-tray-designer-oneui8-v4');
      }
    }

    // Attempt migration from v2 if available
    const oldV2 = safeStorage.getItem('hmi-tray-designer-oneui8-v2');
    if (oldV2) {
      try {
        const candidateOld = JSON.parse(oldV2);
        if (
          candidateOld &&
          typeof candidateOld === 'object' &&
          typeof candidateOld.trayD === 'number' &&
          Number.isFinite(candidateOld.trayD) &&
          candidateOld.trayD > 0
        ) {
          safeStorage.removeItem('hmi-tray-designer-oneui8-v2');
          const hydratedOld = normalizeAndHydrateParams(candidateOld);
          if (validateRecipeParams(hydratedOld).ok) {
            return hydratedOld;
          }
        }
      } catch {
        safeStorage.removeItem('hmi-tray-designer-oneui8-v2');
      }
    }
  } catch (e) {
    console.warn('Failed to parse saved parameters, resetting to default:', e);
  }
  return DEFAULT_PARAMS;
}

export function useTrayParams(onParamsChange?: () => void) {
  const [params, setParams] = useState<TrayParams>(loadInitialParams);

  // Synchronize params to localStorage with schema version
  useEffect(() => {
    const payload: StoredParametersPayload = {
      version: STORAGE_SCHEMA_VERSION,
      params,
    };
    safeStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [params]);

  const updateParams = useCallback(
    (updated: Partial<TrayParams>) => {
      setParams((prev) => {
        const next = { ...prev, ...updated };
        if (updated.tableMode === 'continue') {
          next.addAngle = 0;
        }
        return next;
      });
      if (onParamsChange) {
        onParamsChange();
      }
    },
    [onParamsChange]
  );

  const resetDefaultParams = useCallback(() => {
    setParams(DEFAULT_PARAMS);
    if (onParamsChange) {
      onParamsChange();
    }
  }, [onParamsChange]);

  const autoCalculateSpacing = useCallback(
    (
      onSuccess?: (msg: string) => void,
      onError?: (msg: string) => void,
      lang: 'ar' | 'fr' = 'ar'
    ) => {
      if (params.layers <= 1) {
        if (onError) {
          onError(
            lang === 'ar'
              ? 'طبقة واحدة فقط — لا حاجة لحساب التباعد.'
              : "Une seule couche — pas d'espacement nécessaire."
          );
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
        onSuccess(
          lang === 'ar'
            ? 'تم حساب وتعديل خطوة التباعد الشعاعي بنجاح.'
            : "Espacement radial calculé et ajusté avec succès."
        );
      }
      return true;
    },
    [params, updateParams]
  );

  return {
    params,
    updateParams,
    resetDefaultParams,
    autoCalculateSpacing,
  };
}
