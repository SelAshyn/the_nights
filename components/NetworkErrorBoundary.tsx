// components/NetworkErrorBoundary.tsx
'use client';

import { useEffect, useState } from 'react';

export function NetworkErrorBoundary({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowWarning(false);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowWarning(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check initial state
    if (!navigator.onLine) {
      setIsOnline(false);
      setShowWarning(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOnline || showWarning) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm">
        <div className="bg-slate-800 border border-red-500/50 rounded-lg p-6 max-w-md shadow-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <h2 className="text-lg font-semibold text-white">Network Connection Issue</h2>
          </div>

          <p className="text-slate-300 mb-4">
            {isOnline
              ? "Connection to Supabase failed. Check your internet and try refreshing."
              : "You appear to be offline. Check your internet connection."}
          </p>

          <div className="bg-slate-900/50 rounded p-3 mb-4 border border-slate-700">
            <p className="text-xs text-slate-400 mb-2">Troubleshooting steps:</p>
            <ul className="text-xs text-slate-400 space-y-1">
              <li>✓ Check your internet connection</li>
              <li>✓ Verify the dev server is running (npm run dev)</li>
              <li>✓ Check .env.local has Supabase credentials</li>
              <li>✓ Try refreshing the page</li>
            </ul>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700 text-white rounded-lg px-4 py-2 font-semibold transition-all"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
