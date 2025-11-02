/**
 * Service pour vérifier le statut de connexion au backend
 */

export interface BackendStatus {
  isOnline: boolean;
  isChecking: boolean;
  lastChecked: Date | null;
  error?: string;
}

class BackendStatusService {
  private status: BackendStatus = {
    isOnline: false,
    isChecking: false,
    lastChecked: null,
  };

  private listeners: Set<(status: BackendStatus) => void> = new Set();
  private checkInterval: NodeJS.Timeout | null = null;

  /**
   * Vérifier si le backend est accessible
   */
  async checkBackendStatus(): Promise<boolean> {
    if (this.status.isChecking) {
      return this.status.isOnline;
    }

    this.status.isChecking = true;
    this.notifyListeners();

    try {
      const baseURL = process.env.NEXT_PUBLIC_API_URL
        ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api')
            ? process.env.NEXT_PUBLIC_API_URL
            : `${process.env.NEXT_PUBLIC_API_URL}/api`)
        : 'http://localhost:3001/api';

      // Essayer de faire un GET simple sur l'API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // Timeout de 3 secondes

      const response = await fetch(`${baseURL}/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      clearTimeout(timeoutId);

      const isOnline = response.ok || response.status < 500;
      this.status = {
        isOnline,
        isChecking: false,
        lastChecked: new Date(),
        error: isOnline ? undefined : `Erreur HTTP ${response.status}`,
      };

      this.notifyListeners();
      return isOnline;
    } catch (error: any) {
      const isOnline = false;
      this.status = {
        isOnline,
        isChecking: false,
        lastChecked: new Date(),
        error: error.name === 'AbortError' ? 'Timeout de connexion' : 'Backend injoignable',
      };

      this.notifyListeners();
      return false;
    }
  }

  /**
   * Démarrer la surveillance périodique
   */
  startMonitoring(intervalMs: number = 10000) {
    // Vérifier immédiatement
    this.checkBackendStatus();

    // Vérifier périodiquement
    this.checkInterval = setInterval(() => {
      this.checkBackendStatus();
    }, intervalMs);
  }

  /**
   * Arrêter la surveillance
   */
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  /**
   * Obtenir le statut actuel
   */
  getStatus(): BackendStatus {
    return { ...this.status };
  }

  /**
   * S'abonner aux changements de statut
   */
  subscribe(listener: (status: BackendStatus) => void): () => void {
    this.listeners.add(listener);
    // Notifier immédiatement avec le statut actuel
    listener(this.status);

    // Retourner une fonction de désabonnement
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Notifier tous les abonnés
   */
  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener({ ...this.status });
      } catch (error) {
        console.error('Erreur lors de la notification du listener:', error);
      }
    });
  }
}

// Instance singleton
export const backendStatusService = new BackendStatusService();


