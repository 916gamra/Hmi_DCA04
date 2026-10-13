import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RotateCcw, Trash2 } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetAndReload = () => {
    try {
      localStorage.removeItem('hmi-tray-designer-oneui8-v2');
      localStorage.removeItem('hmi-tray-designer-oneui8-v3');
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="ltr"
          className="min-h-screen w-full bg-[#f1f4f9] flex items-center justify-center p-4 sm:p-6 select-none"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl border border-red-200/80 p-6 sm:p-8 shadow-xl flex flex-col gap-5 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-red-50 border border-red-200 text-red-600 flex items-center justify-center shadow-xs">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                حدث خطأ غير متوقع في واجهة النظام
              </h2>
              <p className="text-xs sm:text-sm text-slate-600">
                Une erreur inattendue est survenue dans l'application. Vos données sont protégées.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-left font-mono text-[11px] text-red-700 max-h-32 overflow-y-auto selectable-text">
                {this.state.error.message || 'Unknown error occurred'}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#2563eb] hover:bg-[#1d4ed8] text-white text-xs font-bold transition-all shadow-xs cursor-pointer active:scale-95"
              >
                <RotateCcw className="w-4 h-4" />
                <span>إعادة تحميل التطبيق / Recharger</span>
              </button>

              <button
                type="button"
                onClick={this.handleResetAndReload}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all border border-slate-200 cursor-pointer active:scale-95"
              >
                <Trash2 className="w-4 h-4 text-red-500" />
                <span>استعادة الافتراضي / Réinitialiser</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
