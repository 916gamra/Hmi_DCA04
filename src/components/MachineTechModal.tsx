import React from 'react';
import { X, Cpu, Cog, Sparkles } from 'lucide-react';
import { Language } from '../core/i18n';

interface MachineTechModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang: Language;
}

export const MachineTechModal: React.FC<MachineTechModalProps> = ({
  isOpen,
  onClose,
  lang,
}) => {
  if (!isOpen) return null;

  const isAr = lang === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in select-none">
      <div
        className="relative w-full max-w-4xl max-h-[90vh] bg-white rounded-3xl shadow-2xl border border-[#e2e8f0] flex flex-col overflow-hidden animate-scale-up"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e2e8f0] bg-[#f8fafc]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#eff6ff] text-[#2563eb] flex items-center justify-center shadow-xs border border-[#dbeafe]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-[#0f172a]">
                {isAr
                  ? 'الوصف التقني الدقيق للآلة (Description Technique Détaillée)'
                  : 'Description Technique Détaillée de la Machine'}
              </h2>
              <p className="text-xs text-[#64748b]">
                {isAr
                  ? 'نظام أتمتة رقمي متطور لنقش الصواني الدائرية بثلاث رؤوس متزامنة'
                  : 'Système CNC dédié pour plateaux circulaires à 3 têtes synchronisées'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#64748b] hover:text-[#0f172a] hover:bg-[#e2e8f0] rounded-xl transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-[#1e293b] text-xs sm:text-sm leading-relaxed">
          {/* TRIVIUM Philosophical Explanation Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-300/60 text-[#92400e] space-y-2 shadow-sm">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base text-amber-900">
              <Sparkles className="w-5 h-5 text-amber-600 shrink-0" />
              <span>
                {isAr ? 'فلسفة ومعنى اسم TRIVIUM (تريفيوم)' : 'Philosophie et sens du nom TRIVIUM'}
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-amber-950">
              {isAr
                ? 'في العصور الوسطى، كان "التريفيوم" (Trivium) يمثل أساس العقل والمعرفة: النحو (Grammar) + المنطق (Logic) + البلاغة (Rhetoric). هي 3 طرق ومسارات تلتقي في عقل واحد. تماماً مثل رؤوس النقش الثلاثة (@120°) التي تلتقي في صينية دائرية واحدة. هذا هو الاسم الذي يشرح الآلة فلسفياً: 3 مسارات منطقية متزامنة تنتج حقيقة واحدة.'
                : 'Au Moyen Âge, le Trivium constituait la base de l’esprit : Grammaire + Logique + Rhétorique. 3 chemins se rejoignant en un seul esprit, tout comme les 3 têtes à 120° se rejoignent sur un plateau unique. C’est le nom philosophique de la machine : 3 parcours logiques synchronisés produisant une seule vérité artistique.'}
            </p>
          </div>

          {/* Introduction */}
          <div className="p-4 rounded-2xl bg-[#eff6ff] border border-[#dbeafe] text-[#1e40af] space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
              <Sparkles className="w-4 h-4 text-[#2563eb] shrink-0" />
              <span>
                {isAr ? 'مبدأ عمل وهندسة الآلة' : 'Principe de fonctionnement et cinématique'}
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed text-[#334155]">
              {isAr
                ? 'هذه الآلة هي عبارة عن نظام أتمتة رقمي متطور (Système CNC Dédié)، مصمم خصيصاً للنقش والزخرفة السريعة على المعادن اللينة (كالنحاس والألومنيوم) المستخدمة في صناعة الصواني التقليدية والموانع الدائرية. يعتمد مبدأ عملها على هندسة ميكانيكية وحركية خاصة (Cinématique Spécifique).'
                : 'Cette machine est un système d’automatisation numérique avancé (Système CNC Dédié), spécialement conçu pour la gravure et la décoration rapide sur métaux tendres (cuivre et aluminium) utilisés dans la fabrication de plateaux traditionnels et pièces circulaires. Son principe repose sur une cinématique spécifique.'}
            </p>
          </div>

          {/* Section 1 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-3">
            <div className="flex items-center gap-2.5 font-bold text-[#0f172a] text-sm sm:text-base">
              <div className="w-7 h-7 rounded-xl bg-[#e2e8f0] text-[#0f172a] flex items-center justify-center font-mono text-xs">
                1
              </div>
              <span>
                {isAr
                  ? 'آلية الرؤوس وحركتها الشعاعية (Les 3 têtes à déplacement radial)'
                  : '1. Les 3 têtes à déplacement radial'}
              </span>
            </div>
            <ul className="space-y-2 text-[#475569] text-xs sm:text-sm list-disc ps-5">
              <li>
                <strong className="text-[#0f172a]">
                  {isAr ? 'التوزيع الهندسي:' : 'Distribution géométrique :'}
                </strong>{' '}
                {isAr
                  ? 'تحتوي الآلة على ثلاثة رؤوس نقش ميكانيكية متناظرة وموزعة هندسياً بفارق زاوية 120° على محيط محرك متساوي الأبعاد.'
                  : 'La machine intègre trois têtes de gravure mécaniques symétriques réparties à 120° sur la périphérie.'}
              </li>
              <li>
                <strong className="text-[#0f172a]">
                  {isAr ? 'الحركة الشعاعية (Mouvement Radial):' : 'Mouvement Radial :'}
                </strong>{' '}
                {isAr
                  ? 'يتحرك كل رأس بشكل خطي متزامن وموجه بدقة من المحيط باتجاه المركز الميكانيكي (Mouvement centripète/radial) على سكك توجيه دقيقة (Guides linéaires de précision).'
                  : 'Chaque tête se déplace de manière linéaire et synchronisée de la périphérie vers le centre mécanique sur des guides linéaires de précision.'}
              </li>
              <li>
                <strong className="text-[#0f172a]">
                  {isAr ? 'الغرض التقني:' : 'Objectif technique :'}
                </strong>{' '}
                {isAr
                  ? 'تيح الرؤوس الثلاثة نقش نفس الزخرفة في ثلاثة اتجاهات مختلفة في نفس الوقت، مما يقسم وقت الإنتاج إلى الثلث ويضمن تماثلاً هندسياً مطلقاً للنقوش الزخرفية التقليدية (كالتوريق والزخارف الهندسية الفاسية أو المراكشية).'
                  : 'Permet de graver simultanément le même motif dans trois directions, divisant le temps de production par trois tout en garantissant une symétrie parfaite des décors traditionnels.'}
              </li>
            </ul>
          </div>

          {/* Section 2 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-3">
            <div className="flex items-center gap-2.5 font-bold text-[#0f172a] text-sm sm:text-base">
              <div className="w-7 h-7 rounded-xl bg-[#e2e8f0] text-[#0f172a] flex items-center justify-center font-mono text-xs">
                2
              </div>
              <span>
                {isAr
                  ? "المحور الدوراني المركزي (L'axe rotatif - Plateau Diviseur / Axe C)"
                  : "2. L'axe rotatif (Plateau Diviseur / Axe C)"}
              </span>
            </div>
            <ul className="space-y-2 text-[#475569] text-xs sm:text-sm list-disc ps-5">
              <li>
                <strong className="text-[#0f172a]">
                  {isAr ? 'طاولة الدوران:' : 'Table rotative :'}
                </strong>{' '}
                {isAr
                  ? 'تُثبّت الصينية الدائرية المراد نقشها على طاولة دوراة مركزية (Table rotative numérique) تحرك الصينية بدقة متناهية بزوايا ميكرو-مترية.'
                  : 'Le plateau circulaire est fixé sur une table rotative numérique pilotée avec une précision micrométrique.'}
              </li>
              <li>
                <strong className="text-[#0f172a]">
                  {isAr ? 'التكامل بالحركة:' : 'Intégration du mouvement :'}
                </strong>{' '}
                {isAr
                  ? 'تدور الصينية (المحور C) بينما تتحرك الرؤوس الثلاثة أفقياً نحو الداخل والخارج (المحور X)، مما يمنح الآلة القدرة على تغطية كامل مساحة الصينية والتحكم في تعقيد النقوش وسرعتها عبر تنسيق برمجي متكامل.'
                  : 'La rotation du plateau (Axe C) se combine aux déplacements radiaux des 3 têtes, permettant de couvrir toute la surface et de régler la complexité des motifs.'}
              </li>
            </ul>
          </div>

          {/* Section 3 */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-3">
            <div className="flex items-center gap-2.5 font-bold text-[#0f172a] text-sm sm:text-base">
              <div className="w-7 h-7 rounded-xl bg-[#e2e8f0] text-[#0f172a] flex items-center justify-center font-mono text-xs">
                3
              </div>
              <span>
                {isAr
                  ? 'نظام التشغيل والنقش (Système de gravure et Broches)'
                  : '3. Système de gravure et Broches'}
              </span>
            </div>
            <ul className="space-y-2 text-[#475569] text-xs sm:text-sm list-disc ps-5">
              <li>
                <strong className="text-[#0f172a]">
                  {isAr ? 'أدوات الحفر (Broches de gravure):' : 'Broches de gravure :'}
                </strong>{' '}
                {isAr
                  ? 'يحمل كل رأس من الرؤوس الثلاثة مغزل دوران عالي السرعة (Broche haute vitesse) مركب عليه إبرة أو ريشة حفر ميكانيكية دقيقة صلبة (Outil carbure/Graveur).'
                  : 'Chaque tête porte une broche haute vitesse équipée d’un outil en carbure ou d’une pointe de gravure.'}
              </li>
              <li>
                <strong className="text-[#0f172a]">
                  {isAr ? 'رؤوس طرق نيوماتيكية (Pneumatic Gravers):' : 'Grailleurs pneumatiques :'}
                </strong>{' '}
                {isAr
                  ? 'تعمل بالضغط الهوائي (النقش بالطرق المتتالي) لعمل النقش التقليدي دون إزالة الرايش.'
                  : 'Fonctionnement par air comprimé pour un martelage traditionnel sans enlèvement de copeaux.'}
              </li>
              <li>
                <strong className="text-[#0f172a]">
                  {isAr ? 'التحكم الرقمي (Contrôle CNC):' : 'Contrôle CNC :'}
                </strong>{' '}
                {isAr
                  ? 'يتم التحكم في عمق وسرعة الحفر وتنسيق حركة الرؤوس وطاولة الدوران أوتوماتيكياً بالكامل باستخدام كارت تحكم متوافق مع ملفات G-Code.'
                  : 'Contrôle entièrement automatisé de la profondeur, de la vitesse et de la coordination des axes via G-code.'}
              </li>
            </ul>
          </div>

          {/* Radial Kinematics Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-[#fef3c7] border border-[#f59e0b]/40 text-[#92400e] space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm sm:text-base">
              <Cog className="w-5 h-5 text-[#d97706] shrink-0 animate-spin-slow" />
              <span>
                {isAr
                  ? 'التصميم الميكانيكي والحركة الشعاعية (Radial Kinematics)'
                  : 'Conception mécanique et cinématique radiale'}
              </span>
            </div>
            <p className="text-xs sm:text-sm leading-relaxed">
              {isAr
                ? 'يتم توزيع الرؤوس الثلاثة بزاوية 120 درجة متساوية حول محيط الصينية الدائرية لضمان توزيع متوازن للجهد الميكانيكي وتناظر مثالي في النقش. يتحرك كل رأس على سكة توجيه خطية (Linear Rail) موجهة بدقة نحو المركز الميكانيكي للآلة. للتحكم في حركة الرؤوس الثلاثة بشكل شعاعي متزامن نحو المركز، يُستخدم نظام اللولب غير المتناهي والمسننات (Vise sans fin) أو محركات سيرفو مستقلة مترابطة برمجياً.'
                : 'Les 3 têtes sont disposées à 120° pour assurer un équilibrage parfait des efforts mécaniques. Chaque tête se déplace sur un rail linéaire dirigé vers le centre. Le mouvement radial synchronisé est assuré par vis sans fin ou moteurs servo couplés.'}
            </p>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-[#e2e8f0] bg-[#f8fafc]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl transition-all cursor-pointer shadow-sm active:scale-95"
          >
            {isAr ? 'إغلاق الوصف التقني' : 'Fermer'}
          </button>
        </div>
      </div>
    </div>
  );
};
