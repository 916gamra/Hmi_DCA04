import React, { useRef, useState } from 'react';
import { FileJson, FileSpreadsheet, QrCode, X, Upload, AlertCircle, FileText } from 'lucide-react';
import { TrayParams } from '../types';
import {
  parseJsonRecipeWithErrors,
  parseCsvPointsToParams,
  parseRecipeGCode,
  formatRecipeErrorsList,
} from '../core/recipe';
import { Translations, Language, translations } from '../core/i18n';

interface ImportChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRecipeParsed: (params: TrayParams, sourceName: string) => void;
  onTriggerQrScan: () => void;
  t: Translations;
  lang?: Language;
}

export const ImportChoiceModal: React.FC<ImportChoiceModalProps> = ({
  isOpen,
  onClose,
  onRecipeParsed,
  onTriggerQrScan,
  t,
  lang = 'ar',
}) => {
  const activeT = t || translations[lang];
  const jsonInputRef = useRef<HTMLInputElement | null>(null);
  const csvInputRef = useRef<HTMLInputElement | null>(null);
  const gcodeInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseJsonRecipeWithErrors(content);
      if (result.ok && result.params) {
        onClose();
        onRecipeParsed(result.params, file.name.replace(/\.json$/i, ''));
      } else {
        setError(formatRecipeErrorsList(result.errors, lang));
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseCsvPointsToParams(content);
      if (parsed) {
        onClose();
        onRecipeParsed(parsed, file.name.replace(/\.csv$/i, ''));
      } else {
        setError(activeT.importCsvError);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleGcodeFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const result = parseRecipeGCode(content);
      if (result.params) {
        onClose();
        onRecipeParsed(result.params, file.name.replace(/\.(gcode|txt)$/i, ''));
      } else {
        const localized = result.errors
          ? formatRecipeErrorsList(result.errors, lang)
          : result.error || '';
        setError(`${activeT.importGcodeErrorPrefix}${localized}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200 select-none"
      dir="ltr"
    >
      <div className="bg-white rounded-3xl border border-[#e2e8f0] shadow-2xl max-w-md w-full overflow-hidden p-5 sm:p-6 flex flex-col gap-4.5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f1f5f9] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-blue-50 text-[#2563eb] flex items-center justify-center border border-blue-100">
              <Upload className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0f172a]">
                {activeT.importModalTitle}
              </h3>
              <p className="text-[11px] text-[#64748b]">
                {activeT.importModalSubtitle}
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

        {/* Error notification */}
        {error && (
          <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Hidden inputs */}
        <input
          ref={jsonInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={handleJsonFile}
        />
        <input
          ref={csvInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleCsvFile}
        />
        <input
          ref={gcodeInputRef}
          type="file"
          accept=".gcode,.txt"
          className="hidden"
          onChange={handleGcodeFile}
        />

        {/* 3 Import Choice Buttons */}
        <div className="flex flex-col gap-3">
          {/* 1. JSON Option */}
          <button
            type="button"
            onClick={() => jsonInputRef.current?.click()}
            className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#2563eb] hover:bg-blue-50/40 transition-all cursor-pointer text-left active:scale-98"
          >
            <div className="w-11 h-11 rounded-xl bg-blue-100 text-[#2563eb] flex items-center justify-center shrink-0">
              <FileJson className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-[#0f172a]">
                {activeT.importJsonTitle}
              </span>
              <span className="text-[11px] text-[#64748b] block truncate">
                {activeT.importJsonSubtitle}
              </span>
            </div>
          </button>

          {/* 2. CSV Option */}
          <button
            type="button"
            onClick={() => csvInputRef.current?.click()}
            className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#059669] hover:bg-emerald-50/40 transition-all cursor-pointer text-left active:scale-98"
          >
            <div className="w-11 h-11 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-[#0f172a]">
                {activeT.importCsvTitle}
              </span>
              <span className="text-[11px] text-[#64748b] block truncate">
                {activeT.importCsvSubtitle}
              </span>
            </div>
          </button>

          {/* 3. G-code / TRIVIUM Recipe Option */}
          <button
            type="button"
            onClick={() => gcodeInputRef.current?.click()}
            className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#ea580c] hover:bg-orange-50/40 transition-all cursor-pointer text-left active:scale-98"
          >
            <div className="w-11 h-11 rounded-xl bg-orange-100 text-[#ea580c] flex items-center justify-center shrink-0">
              <FileText className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-[#0f172a]">
                {activeT.importGcodeTitle}
              </span>
              <span className="text-[11px] text-[#64748b] block truncate">
                {activeT.importGcodeSubtitle}
              </span>
            </div>
          </button>

          {/* 3. QR Code Option */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onTriggerQrScan();
            }}
            className="flex items-center gap-3.5 p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] hover:border-[#4f46e5] hover:bg-indigo-50/40 transition-all cursor-pointer text-left active:scale-98"
          >
            <div className="w-11 h-11 rounded-xl bg-indigo-100 text-[#4f46e5] flex items-center justify-center shrink-0">
              <QrCode className="w-5.5 h-5.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-xs font-bold text-[#0f172a]">
                {activeT.importQrTitle}
              </span>
              <span className="text-[11px] text-[#64748b] block truncate">
                {activeT.importQrSubtitle}
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};
