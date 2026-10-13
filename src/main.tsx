import '@fontsource/cairo/400.css';
import '@fontsource/cairo/500.css';
import '@fontsource/cairo/600.css';
import '@fontsource/cairo/700.css';
import '@fontsource/cairo/800.css';
import '@fontsource/cairo/900.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';

// Native app gesture locking: Prevent full-page pinch zoom while preserving internal canvas zooming
if (typeof window !== 'undefined') {
  // Prevent iOS / Safari page pinch-to-zoom (gesturestart) outside canvas
  document.addEventListener(
    'gesturestart',
    (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'CANVAS' || target.closest('canvas'))) {
        return; // Allow canvas custom gestures
      }
      e.preventDefault();
    },
    { passive: false }
  );

  // Prevent multi-touch touchmove zoom on document level outside canvas
  document.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (e.touches && e.touches.length > 1) {
        const target = e.target as HTMLElement | null;
        if (target && (target.tagName === 'CANVAS' || target.closest('canvas'))) {
          return; // Allow canvas pinch-to-zoom
        }
        e.preventDefault();
      }
    },
    { passive: false }
  );
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
