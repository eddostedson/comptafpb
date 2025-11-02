import axios from 'axios';

export const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL 
    ? (process.env.NEXT_PUBLIC_API_URL.endsWith('/api') 
        ? process.env.NEXT_PUBLIC_API_URL 
        : `${process.env.NEXT_PUBLIC_API_URL}/api`)
    : 'http://localhost:3001/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config) => {
    // Le token sera ajouté dynamiquement par les composants qui l'utilisent
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // Ne pas rediriger automatiquement sur 401
    // Laisser les composants gérer eux-mêmes la redirection si nécessaire
    // Cela évite les redirections intempestives lors du chargement des données
    return Promise.reject(error);
  }
);

