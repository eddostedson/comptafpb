'use client';

import { useState, useEffect } from 'react';
import { backendStatusService, BackendStatus } from '@/lib/backend-status';

/**
 * Hook React pour obtenir et surveiller le statut du backend
 */
export function useBackendStatus(checkInterval: number = 10000) {
  const [status, setStatus] = useState<BackendStatus>(() => backendStatusService.getStatus());

  useEffect(() => {
    // S'abonner aux changements de statut
    const unsubscribe = backendStatusService.subscribe((newStatus) => {
      setStatus(newStatus);
    });

    // Démarrer la surveillance si pas déjà démarrée
    backendStatusService.startMonitoring(checkInterval);

    // Nettoyage lors du démontage
    return () => {
      unsubscribe();
    };
  }, [checkInterval]);

  // Vérifier manuellement si nécessaire
  const checkNow = async () => {
    await backendStatusService.checkBackendStatus();
  };

  return {
    ...status,
    checkNow,
  };
}






