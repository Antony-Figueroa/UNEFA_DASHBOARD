import React from 'react';
import { useDbStatus } from '../../context/db-status';

export const DatabaseStatusBanner: React.FC = () => {
  const { status, error } = useDbStatus();

  if (status === 'connected' || status === 'checking') return null;

  return (
    <div className="bg-error-600 text-white px-4 py-2 flex items-center justify-between animate-slideDown">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-3.536 5 5 0 015.657-4.95m-4.243 8.486L3 21m4.243-4.243a9.047 9.047 0 01-2.088-3.728 9.005 9.005 0 0111.477-9.934" />
        </svg>
        <span className="text-sm font-medium">
          Sin conexión a la base de datos. Los datos mostrados podrían no estar actualizados.
        </span>
      </div>
      {error && (
        <span className="text-xs opacity-80 hidden md:block italic">
          Error: {error}
        </span>
      )}
      <button 
        onClick={() => window.location.reload()}
        className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors"
      >
        Reintentar
      </button>
    </div>
  );
};
