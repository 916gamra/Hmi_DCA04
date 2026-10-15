import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import { Camera, Upload, X, QrCode as QrIcon, CheckCircle2, AlertCircle } from 'lucide-react';
import { TrayParams } from '../types';
import { Translations, Language } from '../core/i18n';
import { parseJsonRecipeWithErrors, formatRecipeErrorsList } from '../core/recipe';

interface QrScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyRecipe?: (recipe: TrayParams) => void;
  t?: Translations;
  lang?: Language;
}

export function parseQrRecipePayload(text: string): TrayParams | null {
  const res = parseJsonRecipeWithErrors(text);
  return res.ok ? res.params : null;
}

export const QrScannerModal: React.FC<QrScannerModalProps> = ({
  isOpen,
  onClose,
  onApplyRecipe,
  lang = 'ar',
}) => {
  const [mode, setMode] = useState<'idle' | 'camera' | 'upload'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Stop camera tracks and animation frame cleanly
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  }, []);

  // Cleanup on close or unmount
  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setMode('idle');
      setError(null);
      setSuccessMsg(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, stopCamera]);

  const handleRecipeScanned = useCallback(
    (codeText: string) => {
      const result = parseJsonRecipeWithErrors(codeText);
      if (result.ok && result.params) {
        const parsed = result.params;
        stopCamera();
        setSuccessMsg(
          lang === 'ar'
            ? 'تم التعرف على الوصفة بنجاح! جاري التطبيق...'
            : 'Recette QR reconnue avec succès ! Application...'
        );
        setTimeout(() => {
          if (onApplyRecipe) {
            onApplyRecipe(parsed);
          }
          onClose();
        }, 800);
      } else {
        setError(formatRecipeErrorsList(result.errors, lang));
      }
    },
    [lang, onApplyRecipe, onClose, stopCamera]
  );

  // Live Camera Scan Loop
  const startScanningLoop = useCallback(() => {
    const scan = () => {
      const video = videoRef.current;
      if (video && video.readyState === video.HAVE_ENOUGH_DATA) {
        let canvas = canvasRef.current;
        if (!canvas) {
          canvas = document.createElement('canvas');
          canvasRef.current = canvas;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            handleRecipeScanned(code.data);
            return;
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(scan);
    };

    animFrameRef.current = requestAnimationFrame(scan);
  }, [handleRecipeScanned]);

  // Robust Camera Starter with Fallback to any video device
  const handleStartCamera = async () => {
    setError(null);
    setSuccessMsg(null);
    setMode('camera');

    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMode('idle');
      setError(
        lang === 'ar'
          ? 'المتصفح الحالي لا يدعم الوصول للكاميرا مباشرة. استخدم خيار تحميل صورة.'
          : 'La caméra n\'est pas supportée dans ce navigateur. Utilisez le chargement d\'image.'
      );
      return;
    }

    try {
      stopCamera();
      let stream: MediaStream;

      // 1. Try environment (back) camera
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch (backCamError) {
        // 2. Fallback to any default camera device (laptop webcam, front cam)
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        startScanningLoop();
      }
    } catch (err: any) {
      console.warn('Camera access unavailable or denied:', err);
      setMode('idle');
      const isDenied = err?.name === 'NotAllowedError' || (err?.message && err.message.toLowerCase().includes('denied'));
      setError(
        isDenied
          ? (lang === 'ar'
              ? 'تم رفض إذن الكاميرا من إعدادات المتصفح. يمكنك السماح بالإذن أو استخدام خيار تحميل صورة مباشرة.'
              : 'Permission caméra refusée par le navigateur. Vous pouvez charger une image directement.')
          : (lang === 'ar'
              ? 'تعذر الوصول إلى الكاميرا. يرجى تجربة خيار تحميل صورة أو الوصفة التجريبية.'
              : 'Accès caméra impossible. Veuillez charger une image.')
      );
    }
  };

  const processImageFile = (file: File) => {
    setError(null);
    setSuccessMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setError(t.qrScannerProcessingError);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: 'attemptBoth',
        });

        if (code && code.data) {
          handleRecipeScanned(code.data);
        } else {
          setError(t.qrScannerNotFound);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 select-none"
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
    >
      <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-2xl max-w-sm w-full overflow-hidden p-5 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center">
              <QrIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">
                {t.qrScannerTitle}
              </h3>
              <p className="text-[10px] text-[#64748b]">
                {t.qrScannerSubtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-[#f1f5f9] text-[#94a3b8] hover:text-[#0f172a] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="flex flex-col gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 text-xs text-emerald-700 bg-emerald-50 p-3 rounded-xl border border-emerald-200">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Camera View Mode */}
        {mode === 'camera' ? (
          <div className="flex flex-col gap-3">
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-slate-300">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Scanning Crosshair Overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-[#2563eb] rounded-2xl relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-white -mt-0.5 -ml-0.5 rounded-tl-sm" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-white -mt-0.5 -mr-0.5 rounded-tr-sm" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-white -mb-0.5 -ml-0.5 rounded-bl-sm" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-white -mb-0.5 -mr-0.5 rounded-br-sm" />
                  <div className="w-full h-0.5 bg-[#2563eb]/80 absolute top-1/2 -translate-y-1/2 animate-pulse shadow-sm shadow-[#2563eb]" />
                </div>
              </div>

              <span className="absolute bottom-2.5 px-3 py-1 rounded-full bg-black/60 text-white text-[10px] font-medium backdrop-blur-xs">
                {t.qrScannerGuide}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                stopCamera();
                setMode('idle');
              }}
              className="w-full py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
            >
              {t.qrScannerStopCamera}
            </button>
          </div>
        ) : (
          /* Selection Options */
          <div className="flex flex-col gap-2.5">
            {/* Live Camera Button */}
            <button
              type="button"
              onClick={handleStartCamera}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#2563eb] hover:bg-blue-50/40 transition-all cursor-pointer text-start active:scale-98"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-[#2563eb] flex items-center justify-center shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-[#0f172a]">
                  {t.qrScannerDirectCamera}
                </span>
                <span className="text-[11px] text-[#64748b] truncate block">
                  {t.qrScannerDirectDesc}
                </span>
              </div>
            </button>

            {/* Upload Image File Button */}
            <label className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#059669] hover:bg-emerald-50/40 transition-all cursor-pointer text-start active:scale-98">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-xs font-bold text-[#0f172a]">
                  {t.qrScannerUploadImage}
                </span>
                <span className="text-[11px] text-[#64748b] truncate block">
                  {t.qrScannerUploadDesc}
                </span>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
};
