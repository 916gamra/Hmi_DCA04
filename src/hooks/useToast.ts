import { useState, useCallback, useRef, useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastState {
  message: string;
  type: ToastType;
}

export function useToast(defaultDuration = 3000) {
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'success' });
  const timeoutRef = useRef<number | null>(null);

  const showToast = useCallback(
    (message: string, type: ToastType = 'success') => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      setToast({ message, type });
      timeoutRef.current = window.setTimeout(() => {
        setToast((prev) => ({ ...prev, message: '' }));
        timeoutRef.current = null;
      }, defaultDuration);
    },
    [defaultDuration]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    toast,
    showToast,
  };
}
