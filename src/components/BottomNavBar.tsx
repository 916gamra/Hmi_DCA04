import React from 'react';
import { LayoutGrid, Sliders, BookOpen } from 'lucide-react';
import { Translations } from '../core/i18n';

export type MainTab = 'auto' | 'manual' | 'article';

interface BottomNavBarProps {
  currentTab: MainTab;
  onChangeTab: (tab: MainTab) => void;
  t: Translations;
}

export const BottomNavBar: React.FC<BottomNavBarProps> = ({
  currentTab,
  onChangeTab,
  t,
}) => {
  const tabs = [
    {
      id: 'auto' as MainTab,
      label: t.navAuto,
      icon: LayoutGrid,
    },
    {
      id: 'manual' as MainTab,
      label: t.navManual,
      icon: Sliders,
    },
    {
      id: 'article' as MainTab,
      label: t.navArticle,
      icon: BookOpen,
    },
  ];

  return (
    <nav
      dir="ltr"
      className="flex-none w-full z-40 bg-white/95 backdrop-blur-xl border-t border-[#cbd5e1]/80 shadow-[0_-6px_28px_rgba(15,23,42,0.08)] px-3 sm:px-6 pt-2.5 pb-[max(12px,env(safe-area-inset-bottom))] transition-all no-print select-none"
      aria-label="Bottom Navigation"
    >
      <div
        className="max-w-3xl w-full mx-auto grid grid-cols-3 gap-2.5 sm:gap-4 md:gap-6 items-stretch"
        dir="ltr"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full min-w-0 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2.5 py-2 sm:py-2.5 px-2 sm:px-4 rounded-2xl border transition-all cursor-pointer select-none active:scale-97 ${
                isActive
                  ? 'bg-[#2563eb]/10 border-[#2563eb]/35 text-[#2563eb] shadow-xs'
                  : 'bg-[#f8fafc]/70 border-transparent text-[#475569] hover:text-[#0f172a] hover:bg-[#f1f5f9] hover:border-[#e2e8f0]'
              }`}
            >
              <div
                className={`w-10 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                  isActive
                    ? 'bg-[#2563eb] text-white shadow-sm shadow-[#2563eb]/30'
                    : 'bg-[#e2e8f0]/60 text-[#475569]'
                }`}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 2} />
              </div>
              <span
                className={`text-xs sm:text-sm leading-tight text-center truncate max-w-full transition-all ${
                  isActive
                    ? 'text-[#1d4ed8] font-extrabold'
                    : 'text-[#334155] font-bold'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
