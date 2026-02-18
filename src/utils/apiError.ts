export const getApiErrorMessage = (error: any, fallback = 'Une erreur est survenue.') => {
    return error?.response?.data?.message || error?.message || fallback;
};

