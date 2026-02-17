import axios from 'axios';

// Créer une instance d'axios
const axiosInstance = axios.create({
    baseURL: 'http://localhost:8000/api' // Votre URL d'API
});

// Intercepteur pour ajouter le token JWT à chaque requête
axiosInstance.interceptors.request.use(
    (config) => {
        // Récupérer le token depuis le localStorage
        const token = localStorage.getItem('authToken');
        if (token) {
            // Ajouter le token dans les en-têtes d'autorisation
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
