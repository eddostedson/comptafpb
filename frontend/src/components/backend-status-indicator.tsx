'use client';

import { useBackendStatus } from '@/hooks/use-backend-status';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BackendStatusIndicatorProps {
  variant?: 'default' | 'compact' | 'minimal';
  showLabel?: boolean;
  className?: string;
}

export function BackendStatusIndicator({ 
  variant = 'default', 
  showLabel = true,
  className 
}: BackendStatusIndicatorProps) {
  const { isOnline, isChecking, error } = useBackendStatus(10000); // Vérifier toutes les 10 secondes

  if (variant === 'minimal') {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {isChecking ? (
          <Loader2 className="h-3 w-3 animate-spin text-slate-400" />
        ) : isOnline ? (
          <Wifi className="h-3 w-3 text-green-500" />
        ) : (
          <WifiOff className="h-3 w-3 text-red-500" />
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <Badge 
        variant={isOnline ? 'default' : 'destructive'} 
        className={cn(
          "flex items-center gap-1.5 px-2 py-0.5",
          isOnline ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600",
          className
        )}
      >
        {isChecking ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isOnline ? (
          <Wifi className="h-3 w-3" />
        ) : (
          <WifiOff className="h-3 w-3" />
        )}
        {showLabel && (
          <span className="text-xs font-medium">
            {isChecking ? 'Vérification...' : isOnline ? 'Backend en ligne' : 'Backend hors ligne'}
          </span>
        )}
      </Badge>
    );
  }

  // Variant 'default'
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Badge 
        variant={isOnline ? 'default' : 'destructive'} 
        className={cn(
          "flex items-center gap-2 px-3 py-1",
          isOnline ? "bg-green-500 hover:bg-green-600" : "bg-red-500 hover:bg-red-600",
        )}
      >
        {isChecking ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-xs font-medium">Vérification...</span>
          </>
        ) : isOnline ? (
          <>
            <Wifi className="h-4 w-4" />
            <span className="text-xs font-medium">Backend en ligne</span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4" />
            <span className="text-xs font-medium">Backend hors ligne</span>
          </>
        )}
      </Badge>
      {error && !isChecking && (
        <span className="text-xs text-red-600 hidden md:block">{error}</span>
      )}
    </div>
  );
}

