import axiosInstance from '@/utils/axios';

export interface SalesOverviewParams {
    period: string;
    from: string;
    to: string;
    group_by: string;
}

export const getDashboardSalesOverview = async (params: SalesOverviewParams) => {
    const response = await axiosInstance.get('/dashboard/sales-overview', { params });
    return response.data;
};

export const getDashboardYearlyBreakup = async (year: number) => {
    const response = await axiosInstance.get('/dashboard/yearly-breakup', { params: { year } });
    return response.data;
};

export const getDashboardMonthlyEarnings = async (month: string) => {
    const response = await axiosInstance.get('/dashboard/monthly-earnings', { params: { month } });
    return response.data;
};

export const getDashboardRecentTransactions = async (limit = 10) => {
    const response = await axiosInstance.get('/dashboard/recent-transactions', { params: { limit } });
    return response.data;
};

