import { TrayParams, CustomLayerConfig } from '../types';
import { DEFAULT_PARAMS } from './constants';
import { sanitizeN } from './model';

export type RecipeErrorCode =
  | 'INVALID_JSON'
  | 'INVALID_FORMAT_VERSION'
  | 'TRAY_D_RANGE'
  | 'TOOL_RANGE'
  | 'MARGIN_RANGE'
  | 'LAYERS_RANGE'
  | 'SPACING_RANGE'
  | 'CUSTOM_LAYER_INVALID';

export interface RecipeValidationError {
  code: RecipeErrorCode;
  message: string;
}

export interface TriviumRecipeV1 {
  format: 'TRIVIUM-RECIPE-v1';
  version: 1;
  meta: {
    name?: string;
    description?: string;
    createdAt: string;
  };
  params: {
    trayD: number;
    tool: number;
    margin: number;
    layers: number;
    spacing: number;
    mode: 'all' | 'custom' | 'machine';
    rawBase: number;
    addAngle: number;
    custom: Array<{ n: number; off: number; stepAngle: number }>;
    timing: {
      dwell: number;
      index: number;
      layer: number;
      rampExpansionSec?: number;
      rampRotationSec?: number;
    };
    rotationSpeedHz: number;
    expansionSpeedHz: number;
    pulsesPerRev: number;
    pulsesPerMm: number;
    repteurEnabled?: boolean;
    repteurStartPass?: boolean;
    tableMode?: 'reset' | 'continue';
  };
}

const ERROR_MESSAGES: Record<RecipeErrorCode, { ar: string; fr: string; en: string }> = {
  INVALID_JSON: {
    ar: 'ملف JSON تالف أو غير قابل للقراءة.',
    fr: 'Fichier JSON corrompu ou illisible.',
    en: 'Failed to parse JSON',
  },
  INVALID_FORMAT_VERSION: {
    ar: 'بنية الملف أو إصدار الوصفة غير مدعوم (يتطلب TRIVIUM-RECIPE-v1).',
    fr: 'Format ou version de recette non pris en charge (TRIVIUM-RECIPE-v1 requis).',
    en: 'Invalid format or version',
  },
  TRAY_D_RANGE: {
    ar: 'قطر الصينية (trayD) خارج النطاق المسموح (50 إلى 2000 مم).',
    fr: 'Diamètre du plateau (trayD) hors plage autorisée (50 à 2000 mm).',
    en: 'trayD must be between 50 and 2000',
  },
  TOOL_RANGE: {
    ar: 'قطر أداة الحفر (tool) خارج النطاق المسموح (0.5 إلى 50 مم).',
    fr: 'Diamètre de l’outil (tool) hors plage autorisée (0.5 à 50 mm).',
    en: 'tool must be between 0.5 and 50',
  },
  MARGIN_RANGE: {
    ar: 'الهامش الخارجي (margin) يجب أن يكون 0 أو أكبر وأقل من قطر الصينية.',
    fr: 'La marge extérieure (margin) doit être >= 0 et inférieure au diamètre du plateau.',
    en: 'margin must be >= 0 and < trayD',
  },
  LAYERS_RANGE: {
    ar: 'عدد الطبقات الحلقية (layers) يجب أن يكون بين 1 و 7.',
    fr: 'Le nombre de couches (layers) doit être compris entre 1 et 7.',
    en: 'layers must be between 1 and 7',
  },
  SPACING_RANGE: {
    ar: 'تباعد الطبقات (spacing) يجب أن يكون أكبر من 0 مم.',
    fr: 'L’espacement des couches (spacing) doit être supérieur à 0 mm.',
    en: 'spacing must be > 0',
  },
  CUSTOM_LAYER_INVALID: {
    ar: 'بيانات تخصيص الطبقات (custom) غير صالحة (يجب أن تكون n و off أرقاماً و stepAngle > 0).',
    fr: 'Configuration des couches personnalisées (custom) invalide (n, off numériques et stepAngle > 0).',
    en: 'custom layer configuration invalid',
  },
};

export function formatRecipeError(
  codeOrError: RecipeErrorCode | string,
  lang: 'ar' | 'fr' = 'ar'
): string {
  const entry = ERROR_MESSAGES[codeOrError as RecipeErrorCode];
  if (entry) return entry[lang];
  return codeOrError;
}

export function formatRecipeErrorsList(
  codes: Array<RecipeErrorCode | string>,
  lang: 'ar' | 'fr' = 'ar'
): string {
  if (!codes || codes.length === 0) {
    return ERROR_MESSAGES.INVALID_JSON[lang];
  }
  return codes.map((c) => formatRecipeError(c, lang)).join(' ');
}

function roundNum(v: number, decimals = 4): number {
  if (!Number.isFinite(v)) return 0;
  return Number(v.toFixed(decimals));
}

/**
 * Validates raw recipe parameters against physical machine bounds.
 */
export function validateRecipeParams(partial: Partial<TrayParams> | any): {
  ok: boolean;
  errors: RecipeErrorCode[];
  messages: string[];
} {
  const errors: RecipeErrorCode[] = [];

  if (!partial || typeof partial !== 'object') {
    errors.push('INVALID_JSON');
    return {
      ok: false,
      errors,
      messages: errors.map((c) => ERROR_MESSAGES[c].en),
    };
  }

  if (
    typeof partial.trayD !== 'number' ||
    !Number.isFinite(partial.trayD) ||
    partial.trayD < 50 ||
    partial.trayD > 2000
  ) {
    errors.push('TRAY_D_RANGE');
  }

  if (
    typeof partial.tool !== 'number' ||
    !Number.isFinite(partial.tool) ||
    partial.tool < 0.5 ||
    partial.tool > 50
  ) {
    errors.push('TOOL_RANGE');
  }

  if (
    typeof partial.margin !== 'number' ||
    !Number.isFinite(partial.margin) ||
    partial.margin < 0 ||
    (typeof partial.trayD === 'number' && partial.margin >= partial.trayD)
  ) {
    errors.push('MARGIN_RANGE');
  }

  if (
    typeof partial.layers !== 'number' ||
    !Number.isFinite(partial.layers) ||
    partial.layers < 1 ||
    partial.layers > 7
  ) {
    errors.push('LAYERS_RANGE');
  }

  if (
    typeof partial.spacing !== 'number' ||
    !Number.isFinite(partial.spacing) ||
    partial.spacing <= 0
  ) {
    errors.push('SPACING_RANGE');
  }

  if (partial.custom !== undefined) {
    if (!Array.isArray(partial.custom)) {
      errors.push('CUSTOM_LAYER_INVALID');
    } else {
      for (let i = 0; i < partial.custom.length; i++) {
        const c = partial.custom[i];
        if (
          !c ||
          typeof c.n !== 'number' ||
          !Number.isFinite(c.n) ||
          c.n <= 0 ||
          typeof c.off !== 'number' ||
          !Number.isFinite(c.off) ||
          (c.stepAngle !== undefined &&
            (typeof c.stepAngle !== 'number' || !Number.isFinite(c.stepAngle) || c.stepAngle <= 0))
        ) {
          errors.push('CUSTOM_LAYER_INVALID');
          break;
        }
      }
    }
  }

  return {
    ok: errors.length === 0,
    errors,
    messages: errors.map((c) => ERROR_MESSAGES[c].en),
  };
}

/**
 * Normalizes and hydrates any partial/imported TrayParams with DEFAULT_PARAMS,
 * enforces internal 'mm' units, pads custom layers up to 7 with synchronized stepAngle,
 * and computes exact geometric rLast = max(0, d1 - spacing * (layers - 1)).
 */
export function normalizeAndHydrateParams(partial: Partial<TrayParams>): TrayParams {
  const merged = {
    ...DEFAULT_PARAMS,
    ...partial,
    timing: {
      ...DEFAULT_PARAMS.timing,
      ...(partial.timing || {}),
    },
  };

  const trayD = roundNum(merged.trayD, 3);
  const tool = roundNum(merged.tool, 3);
  const margin = roundNum(merged.margin, 3);
  const layers = Math.min(7, Math.max(1, Math.round(merged.layers)));
  const rawBase = sanitizeN(merged.rawBase || DEFAULT_PARAMS.rawBase);
  const tableMode: 'reset' | 'continue' =
    partial?.tableMode === 'continue' || merged.tableMode === 'continue'
      ? 'continue'
      : 'reset';
  const addAngle = tableMode === 'continue' ? 0 : roundNum(merged.addAngle ?? DEFAULT_PARAMS.addAngle, 4);

  const R = trayD / 2;
  const r1 = Math.max(0, R - margin);
  const hasExplicitRLast =
    partial && typeof partial === 'object' && 'rLast' in partial && partial.rLast !== undefined;
  const hasExplicitSpacing =
    partial && typeof partial === 'object' && 'spacing' in partial && partial.spacing !== undefined;

  let rLast: number;
  let spacing: number;

  if (hasExplicitRLast) {
    rLast = roundNum(partial.rLast!, 3);
    const rLastR = Math.max(0, rLast / 2);
    spacing =
      layers > 1
        ? roundNum((r1 - rLastR) / (layers - 1), 3)
        : roundNum(merged.spacing, 3);
  } else if (hasExplicitSpacing) {
    spacing = roundNum(partial.spacing!, 3);
    rLast = roundNum(
      Math.max(0, 2 * r1 - 2 * spacing * (layers - 1)),
      3
    );
  } else {
    rLast = roundNum(
      merged.rLast !== undefined ? merged.rLast : DEFAULT_PARAMS.rLast,
      3
    );
    const rLastR = Math.max(0, rLast / 2);
    spacing =
      layers > 1
        ? roundNum((r1 - rLastR) / (layers - 1), 3)
        : roundNum(DEFAULT_PARAMS.spacing, 3);
  }

  // Pad custom array to at least 7 layers with synchronized stepAngle = 360 / n
  const sourceCustom = Array.isArray(partial.custom)
    ? partial.custom
    : DEFAULT_PARAMS.custom;

  const custom: CustomLayerConfig[] = [];
  const targetLen = Math.max(7, layers, sourceCustom.length);
  for (let i = 0; i < targetLen; i++) {
    const src = sourceCustom[i];
    const n = sanitizeN(src?.n ?? rawBase);
    const off = roundNum(src?.off ?? i * addAngle, 4);
    const stepAngle = roundNum(
      src?.stepAngle && src.stepAngle > 0 ? src.stepAngle : 360 / n,
      4
    );
    custom.push({ n, off, stepAngle });
  }

  return {
    ...merged,
    trayD,
    trayDDisplay: trayD,
    trayU: 'mm',
    tool,
    margin,
    marginDisplay: margin,
    marginU: 'mm',
    layers,
    spacing,
    spacingDisplay: spacing,
    spacingU: 'mm',
    rLast,
    rLastDisplay: rLast,
    rLastU: 'mm',
    mode: merged.mode || 'custom',
    rawBase,
    addAngle,
    custom,
    rotationSpeedHz: roundNum(merged.rotationSpeedHz || DEFAULT_PARAMS.rotationSpeedHz, 3),
    expansionSpeedHz: roundNum(merged.expansionSpeedHz || DEFAULT_PARAMS.expansionSpeedHz, 3),
    pulsesPerRev: Math.round(merged.pulsesPerRev || DEFAULT_PARAMS.pulsesPerRev),
    pulsesPerMm: Math.round(merged.pulsesPerMm || DEFAULT_PARAMS.pulsesPerMm),
    timingMode: merged.timingMode || 'hz',
    speed: merged.speed || 1,
    repteurEnabled: Boolean(partial.repteurEnabled ?? DEFAULT_PARAMS.repteurEnabled ?? false),
    repteurStartPass:
      partial.repteurStartPass !== undefined
        ? Boolean(partial.repteurStartPass)
        : (DEFAULT_PARAMS.repteurStartPass ?? true),
    tableMode,
  };
}

/**
 * Serializes TrayParams into canonical TRIVIUM-RECIPE-v1 JSON string (all values in mm).
 */
export function serializeRecipeV1(
  params: TrayParams,
  meta?: Partial<TriviumRecipeV1['meta']>
): string {
  const hydrated = normalizeAndHydrateParams(params);

  const recipe: TriviumRecipeV1 = {
    format: 'TRIVIUM-RECIPE-v1',
    version: 1,
    meta: {
      ...(meta?.name ? { name: meta.name } : {}),
      ...(meta?.description ? { description: meta.description } : {}),
      createdAt: meta?.createdAt || new Date().toISOString(),
    },
    params: {
      trayD: roundNum(hydrated.trayD, 3),
      tool: roundNum(hydrated.tool, 3),
      margin: roundNum(hydrated.margin, 3),
      layers: hydrated.layers,
      spacing: roundNum(hydrated.spacing, 3),
      mode: hydrated.mode,
      rawBase: hydrated.rawBase,
      addAngle: roundNum(hydrated.addAngle, 4),
      custom: hydrated.custom.slice(0, Math.max(7, hydrated.layers)).map((c) => {
        const n = sanitizeN(c.n);
        return {
          n,
          off: roundNum(c.off, 4),
          stepAngle: roundNum(c.stepAngle && c.stepAngle > 0 ? c.stepAngle : 360 / n, 4),
        };
      }),
      timing: {
        dwell: Math.round(hydrated.timing.dwell),
        index: Math.round(hydrated.timing.index),
        layer: Math.round(hydrated.timing.layer),
        ...(hydrated.timing.rampExpansionSec !== undefined
          ? { rampExpansionSec: roundNum(hydrated.timing.rampExpansionSec, 3) }
          : {}),
        ...(hydrated.timing.rampRotationSec !== undefined
          ? { rampRotationSec: roundNum(hydrated.timing.rampRotationSec, 3) }
          : {}),
      },
      rotationSpeedHz: roundNum(hydrated.rotationSpeedHz, 3),
      expansionSpeedHz: roundNum(hydrated.expansionSpeedHz, 3),
      pulsesPerRev: Math.round(hydrated.pulsesPerRev),
      pulsesPerMm: Math.round(hydrated.pulsesPerMm),
      repteurEnabled: hydrated.repteurEnabled,
      repteurStartPass: hydrated.repteurStartPass,
      tableMode: hydrated.tableMode,
    },
  };

  return JSON.stringify(recipe, null, 2);
}

/**
 * Parses a TRIVIUM-RECIPE-v1 JSON string or object and returns a fully hydrated TrayParams.
 */
export function parseRecipeV1(jsonOrObject: string | unknown): {
  ok: boolean;
  params?: TrayParams;
  meta?: TriviumRecipeV1['meta'];
  errors: RecipeErrorCode[];
} {
  try {
    const data =
      typeof jsonOrObject === 'string' ? JSON.parse(jsonOrObject) : (jsonOrObject as any);

    if (!data || typeof data !== 'object') {
      return { ok: false, errors: ['INVALID_JSON'] };
    }

    if (data.format !== 'TRIVIUM-RECIPE-v1' || data.version !== 1) {
      return { ok: false, errors: ['INVALID_FORMAT_VERSION'] };
    }

    const validation = validateRecipeParams(data.params);
    if (!validation.ok) {
      return { ok: false, errors: validation.errors };
    }

    const fullParams = normalizeAndHydrateParams(data.params);

    return {
      ok: true,
      params: fullParams,
      meta: data.meta,
      errors: [],
    };
  } catch {
    return { ok: false, errors: ['INVALID_JSON'] };
  }
}
