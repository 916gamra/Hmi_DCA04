import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Download, QrCode as QrIcon } from 'lucide-react';
import { TrayParams, TrayModel } from '../types';
import { generateCompactQrPayload } from '../core/recipe';

interface QrCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  params: TrayParams;
  model: TrayModel;
  totalCycleTimeMs: number;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({
  isOpen,
  onClose,
  params,
  model,
  totalCycleTimeMs,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [payloadText, setPayloadText] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    const payload = generateCompactQrPayload(params, model, totalCycleTimeMs);
    setPayloadText(payload);

    if (canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        payload,
        {
          width: 260,
          margin: 2,
          color: {
            dark: '#0f172a',
            light: '#ffffff',
          },
          errorCorrectionLevel: 'M',
        },
        (error) => {
          if (error) console.error('QR code generation error:', error);
        }
      );
    }
  }, [isOpen, params, model, totalCycleTimeMs]);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(payloadText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQrImage = () => {
    if (!canvasRef.current) return;
    const url = canvasRef.current.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `tray_recipe_qr_${params.trayD}mm.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-2xl max-w-md w-full overflow-hidden p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#2563eb] flex items-center justify-center">
              <QrIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">
                رمز الاستجابة السريعة (QR) للآلة
              </h3>
              <p className="text-[11px] text-[#64748b]">
                نقل مباشر لمعاملات الوصفة إلى قارئ TouchWin HMI
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

        {/* QR Code Canvas */}
        <div className="flex flex-col items-center justify-center py-2">
          <div className="p-3 bg-white rounded-2xl border border-[#e2e8f0] shadow-sm">
            <canvas ref={canvasRef} className="block rounded-lg" />
          </div>
          <span className="text-xs text-[#64748b] mt-2 font-medium">
            وجّه قارئ الباركود أو كاميرا الهاتف لمسح الوصفة
          </span>
        </div>

        {/* Recipe Summary */}
        <div className="bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-3 text-xs flex flex-col gap-1.5 font-mono">
          <div className="flex justify-between text-[#475569]">
            <span>قطر الصينية:</span>
            <strong className="text-[#0f172a]">{params.trayD} مم</strong>
          </div>
          <div className="flex justify-between text-[#475569]">
            <span>عدد الحلقات / الثقوب:</span>
            <strong className="text-[#2563eb]">{model.layers.length} حلقات / {model.totalPts} ثقب</strong>
          </div>
          <div className="flex justify-between text-[#475569]">
            <span>قطر الأداة:</span>
            <strong className="text-[#0f172a]">Ø {params.tool} مم</strong>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-[#f1f5f9]">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#f1f5f9] hover:bg-[#e2e8f0] text-xs font-bold text-[#334155] transition-all cursor-pointer active:scale-95"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#059669]" />
                <span className="text-[#059669]">تم النسخ!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-[#2563eb]" />
                <span>نسخ البيانات</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadQrImage}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-xs font-bold text-white transition-all cursor-pointer active:scale-95 shadow-sm shadow-[#2563eb]/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>حفظ صورة QR</span>
          </button>
        </div>
      </div>
    </div>
  );
};
