import React from 'react';
import { ChevronDown } from 'lucide-react';

interface SemiCardAccordionProps {
  isOpen: boolean;
  onToggle: () => void;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

export const SemiCardAccordion: React.FC<SemiCardAccordionProps> = ({
  isOpen,
  onToggle,
  title,
  icon,
  children,
}) => (
  <div className="oneui-card overflow-hidden border border-slate-200/90 shadow-2xs rounded-2xl bg-white">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-left"
    >
      <div className="flex items-center gap-2.5 font-bold text-slate-800 text-xs sm:text-sm">
        {icon}
        <span>{title}</span>
      </div>
      <ChevronDown
        className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
          isOpen ? 'rotate-0' : '-rotate-90'
        }`}
      />
    </button>
    {isOpen && (
      <div className="p-4 border-t border-slate-100 flex flex-col gap-3.5 bg-slate-50/40">
        {children}
      </div>
    )}
  </div>
);
