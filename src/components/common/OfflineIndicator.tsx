import React, { useEffect, useState } from 'react';
import { WifiOff, RefreshCw, Check, AlertCircle, Cloud, CloudOff } from 'lucide-react';
import { useOffline } from '../../context/OfflineContext';
import { cn } from '../../utils/cn';

interface OfflineIndicatorProps {
  variant?: 'banner' | 'badge' | 'minimal';
  className?: string;
}

export function OfflineIndicator({ variant = 'banner', className }: OfflineIndicatorProps) {
  const { isOnline, pendingCount, syncStatus, lastSyncAt, forceSync } = useOffline();
  const [showSynced, setShowSynced] = useState(false);

  useEffect(() => {
    if (syncStatus === 'idle' && pendingCount === 0 && lastSyncAt) {
      setShowSynced(true);
      const timer = setTimeout(() => setShowSynced(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [syncStatus, pendingCount, lastSyncAt]);

  if (variant === 'badge') {
    return <OfflineBadge isOnline={isOnline} pendingCount={pendingCount} syncStatus={syncStatus} className={className} />;
  }

  if (variant === 'minimal') {
    return <OfflineMinimal isOnline={isOnline} pendingCount={pendingCount} className={className} />;
  }

  return (
    <OfflineBanner
      isOnline={isOnline}
      pendingCount={pendingCount}
      syncStatus={syncStatus}
      showSynced={showSynced}
      onSync={() => forceSync()}
      className={className}
    />
  );
}

interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount: number;
  syncStatus: string;
  showSynced: boolean;
  onSync: () => void;
  className?: string;
}

function OfflineBanner({ isOnline, pendingCount, syncStatus, showSynced, onSync, className }: OfflineBannerProps) {
  if (!isOnline || pendingCount > 0 || syncStatus === 'syncing' || showSynced) {
    return (
      <div
        className={cn(
          'fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium transition-all duration-300',
          !isOnline && 'bg-error-500 text-white',
          isOnline && syncStatus === 'syncing' && 'bg-info-500 text-white',
          isOnline && pendingCount > 0 && syncStatus !== 'syncing' && 'bg-warning-500 text-white',
          showSynced && isOnline && 'bg-success-500 text-white',
          className
        )}
      >
        {showSynced ? (
          <>
            <Check className="h-4 w-4" />
            <span>Sincronizado exitosamente</span>
          </>
        ) : !isOnline ? (
          <>
            <CloudOff className="h-4 w-4" />
            <span>Sin conexión a internet</span>
            {pendingCount > 0 && <span>• {pendingCount} cambios pendientes</span>}
          </>
        ) : syncStatus === 'syncing' ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Sincronizando cambios...</span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4" />
            <span>{pendingCount} cambios pendientes de sincronizar</span>
            <button
              onClick={onSync}
              className="ml-2 rounded bg-white/20 px-2 py-0.5 text-xs hover:bg-white/30"
            >
              Sincronizar ahora
            </button>
          </>
        )}
      </div>
    );
  }

  return null;
}

interface OfflineBadgeProps {
  isOnline: boolean;
  pendingCount: number;
  syncStatus: string;
  className?: string;
}

function OfflineBadge({ isOnline, pendingCount, syncStatus, className }: OfflineBadgeProps) {
  const showIndicator = !isOnline || pendingCount > 0;

  if (!showIndicator) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium',
        !isOnline && 'bg-error-100 text-error-700 dark:bg-error-900/30 dark:text-error-400',
        isOnline && pendingCount > 0 && 'bg-warning-100 text-warning-700 dark:bg-warning-900/30 dark:text-warning-400',
        className
      )}
    >
      {!isOnline ? (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      ) : (
        <>
          <Cloud className="h-3 w-3" />
          <span>{pendingCount}</span>
        </>
      )}
    </div>
  );
}

interface OfflineMinimalProps {
  isOnline: boolean;
  pendingCount: number;
  className?: string;
}

function OfflineMinimal({ isOnline, pendingCount, className }: OfflineMinimalProps) {
  if (isOnline && pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'inline-flex h-2 w-2 rounded-full',
        !isOnline && 'bg-error-500',
        isOnline && pendingCount > 0 && 'bg-warning-500',
        className
      )}
      title={!isOnline ? 'Sin conexión' : `${pendingCount} cambios pendientes`}
    />
  );
}

export function SyncStatusIndicator({ className }: { className?: string }) {
  const { syncStatus, pendingCount, isOnline } = useOffline();

  return (
    <div className={cn('relative', className)}>
      <Cloud
        className={cn(
          'h-5 w-5 transition-colors',
          !isOnline && 'text-error-500',
          isOnline && pendingCount === 0 && syncStatus === 'idle' && 'text-success-500',
          isOnline && pendingCount > 0 && syncStatus === 'syncing' && 'text-info-500 animate-pulse',
          isOnline && pendingCount > 0 && syncStatus === 'error' && 'text-warning-500',
          syncStatus === 'idle' && pendingCount > 0 && 'text-warning-500'
        )}
      />
      {pendingCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-warning-500 text-[10px] font-bold text-white">
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}
    </div>
  );
}
