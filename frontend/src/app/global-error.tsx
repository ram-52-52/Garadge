"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error Boundary caught:", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-slate-950 text-white min-h-screen flex flex-col items-center justify-center p-8 text-center selection:bg-rose-500/30 antialiased">
        <div className="max-w-md">
          <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-8 border border-rose-500/20 shadow-lg shadow-rose-500/10">
            <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-4 leading-none">Global <span className="text-rose-500">Error.</span></h1>
          <p className="text-slate-400 text-sm font-medium uppercase tracking-widest mb-10 leading-relaxed">
            A critical system failure occurred. Our engineers have been notified.
          </p>
          <button
            onClick={() => reset()}
            className="w-full h-16 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:bg-slate-200 transition-all shadow-xl"
          >
            Attempt Recovery
          </button>
          
          {error.digest && (
            <p className="mt-8 text-[10px] text-slate-700 font-mono uppercase tracking-widest">
              Error Digest: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
