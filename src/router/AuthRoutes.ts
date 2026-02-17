const AuthRoutes = {
    path: '/auth',
    component: () => import('@/layouts/blank/BlankLayout.vue'),
    meta: {
        requiresAuth: false
    },
    children: [
        {
            name: 'Login',
            path: '/auth/login',
            component: () => import('@/views/auth/Login.vue')
        },
        {
            name: 'Register',
            path: '/auth/register',
            component: () => import('@/views/auth/Register.vue')
        },
        {
            name: 'CreateAdmin',
            path: '/auth/create-admin/:companyId',
            component: () => import('@/views/auth/CreateAdmin.vue')
        },
        {
            name: 'Plans',
            path: '/auth/plans/:companyId',
            component: () => import('@/views/auth/Plans.vue')
        }
        ,
        {
            name: 'VerifyCompany',
            path: '/auth/verify-company',
            component: () => import('@/views/auth/VerifyCompany.vue')
        }
    ]
};

export default AuthRoutes;
