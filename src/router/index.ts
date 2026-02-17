import { createRouter, createWebHistory } from 'vue-router';
import MainRoutes from './MainRoutes';
import AuthRoutes from './AuthRoutes';

export const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: [
        {
            path: '/:pathMatch(.*)*',
            component: () => import('@/views/pages/Error404.vue')
        },
        MainRoutes,
        AuthRoutes
    ]
});

router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem('authToken');
    const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

    if (requiresAuth && !isAuthenticated) {
        // Si la route nécessite une authentification et que l'utilisateur n'est pas connecté,
        // rediriger vers la page de connexion.
        next('/auth/login');
    } else if (to.path.startsWith('/auth') && isAuthenticated) {
        // Si l'utilisateur est déjà connecté et essaie d'accéder aux pages d'authentification,
        // le rediriger vers la page d'accueil.
        next('/');
    } else {
        // Sinon, autoriser la navigation.
        next();
    }
});
