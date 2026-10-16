export interface HeadConfig {
  id: 'T1' | 'T2' | 'T3';
  angle: number;
  color: string;
  nameAr: string;
}

export interface Point {
  layer: number;
  k: number;
  head: number;
  j: number;
  a: number;
  x: number;
  y: number;
  bad: boolean;
  fired?: boolean; // هل تم حفر النقطة أم اعترضها قناع Repteur (الافتراضي true)
}

export interface Layer {
  i: number;
  r: number;
  n: number;
  per: number;
  step: number;
  off: number;
  pts: Point[];
  minD: number;
  bad: number;
}

export interface Warn {
  lv: 'err' | 'warn';
  tx: string;
}

export interface CustomLayerConfig {
  n: number;
  off: number;
  stepAngle?: number;
}

export interface TrayTiming {
  dwell: number; // in ms
  index: number; // in ms
  layer: number; // in ms
  rampExpansionSec?: number; // Servo expansion settling/ramp overhead in sec (default 0.08)
  rampRotationSec?: number;  // Rotational indexing servo ramp overhead in sec (default 0.035)
}

export interface TrayParams {
  trayD: number; // in mm
  trayDDisplay: number;
  trayU: 'cm' | 'mm';
  tool: number; // in mm
  margin: number; // in mm
  marginDisplay: number;
  marginU: 'cm' | 'mm';
  layers: number; // max 7
  spacing: number;
  spacingDisplay: number;
  spacingU: 'cm' | 'mm';
  rLast: number;
  rLastDisplay: number;
  rLastU: 'cm' | 'mm';
  mode: 'all' | 'custom' | 'machine';
  rawBase: number;
  addAngle: number;
  custom: CustomLayerConfig[];
  timing: TrayTiming;
  rotationSpeedHz: number;
  expansionSpeedHz: number;
  pulsesPerRev: number;
  pulsesPerMm: number;
  timingMode: 'hz' | 'ms';
  speed: number;
  // Optional machine compatibility modes
  repteurEnabled?: boolean;          // Default false: قناع الضربات المتناوبة
  repteurStartPass?: boolean;        // Default true: أول ضربة في أول طبقة تمر
  tableMode?: 'reset' | 'continue'; // Default 'reset': مرجع مطلق (إعادة للصفر) أو استمرار زاوي
}

export interface TrayModel {
  R: number;
  toolR: number;
  r1: number;
  rLast: number;
  d1: number;     // Diameter of Layer 1 = 2 * r1
  dLast: number;  // Diameter of Last Layer = 2 * rLast
  radialStepMm: number; // Radial movement per layer = spacing (single-sided radial step)
  layers: Layer[];
  all: Point[];
  minD: number;
  badCount: number;
  warns: Warn[];
  totalPts: number;
  totalDrilled: number; // عدد الثقوب المحفورة فعلياً بعد تطبيق قناع Repteur
  totalSteps: number;
  tableMode?: 'reset' | 'continue';
  hasErr: boolean;
  hasWarn: boolean;
}

export interface TimelineAction {
  type: 'repos' | 'index' | 'fire';
  t0: number;
  d: number;
  layer: number;
  j?: number;
  r0: number;
  r1: number;
  th0: number;
  th1: number;
  fired?: boolean; // لقناع Repteur أثناء ضربات الحفر
}

export interface Timeline {
  acts: TimelineAction[];
  total: number;
}

export interface SimulationState {
  theta: number;
  headR: number;
  counts: number[];
  cur: TimelineAction | null;
  u: number;
  done: boolean;
}

export type CanvasTheme = 'light' | 'dark';

export interface ViewOptions {
  sectors: boolean;
  heads: boolean;
  rings: boolean;
  labels: boolean;
  dimensions?: boolean;
  theme?: CanvasTheme;
  frameMode?: 'auto' | 'machine';
}

export interface RecipePreset {
  id: string;
  name: string;
  nameFr?: string;
  description: string;
  descriptionFr?: string;
  tag: string;
  tagFr?: string;
  params: Partial<TrayParams>;
}
