<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useTheme } from 'vuetify';
import { getDashboardMonthlyEarnings } from '@/api/dashboard';
import { getApiErrorMessage } from '@/utils/apiError';
const theme = useTheme();
const secondary = theme.current.value.colors.secondary;
const loading = ref(false);
const monthlyValue = ref(0);
const changePct = ref(0);
const sparklineData = ref<number[]>([0, 0, 0, 0, 0, 0, 0]);

const fetchMonthlyEarnings = async () => {
    loading.value = true;
    try {
        const data = await getDashboardMonthlyEarnings('2026-02');
        monthlyValue.value = Number(data?.value) || 0;
        changePct.value = Number(data?.change_pct_vs_previous_month) || 0;
        sparklineData.value = Array.isArray(data?.sparkline) ? data.sparkline.map((v: any) => Number(v) || 0) : [0, 0, 0, 0, 0, 0, 0];
    } catch (error) {
        console.error(getApiErrorMessage(error, 'Erreur chargement monthly earnings.'));
    } finally {
        loading.value = false;
    }
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value);
};

/* Chart */
const areachartOptions = computed(() => {
    return {
        labels: ['1', '2', '3','4','5','6','7'],
        chart: {
            type: 'area',
            height: 60,
            fontFamily: `inherit`,
            foreColor: '#a1aab2',
            toolbar: {
                show: false
            },
            sparkline: {
                enabled: true
            },
            group: 'sparklines'
        },
        colors: [secondary],
        stroke: {
            curve: 'smooth',
            width: 2
        },
        fill: {
            type: 'solid',
            opacity: 0.05
        },
        markers: {
            size: 0
        },
        tooltip: {
            theme: 'light',
            x: {
                show: true
            }
        }
    };
});

const areaSeries = computed(() => [
    {
        name: '',
        data: sparklineData.value
    }
]);

onMounted(() => {
    fetchMonthlyEarnings();
});
</script>
<template>
    <v-card elevation="10" class="withbg">
        <v-card-item>
            <div class="d-flex align-center justify-space-between pt-sm-2">
                <v-card-title class="text-h5">Monthly Earnings</v-card-title>
                <v-btn size="large" icon  class="bg-secondary">
                    <v-avatar size="large" class="text-white">
                        <CurrencyDollarIcon size="25" />
                    </v-avatar>
                </v-btn>
            </div>
            <v-row>
                <v-col cols="12">
                    <div class="mt-2">
                        <h3 class="text-h3">{{ formatCurrency(monthlyValue) }}</h3>
                        <div class="mt-1">
                            <v-avatar class="bg-lighterror text-accent" size="25">
                                <ArrowDownRightIcon size="20" />
                            </v-avatar>
                            <span class="text-subtitle-1 ml-2 font-weight-bold">{{ changePct >= 0 ? '+' : '' }}{{ changePct }}%</span>
                            <span class="text-subtitle-1 text-muted ml-2">last year</span>
                        </div>
                    </div>
                </v-col>
            </v-row>
        </v-card-item>
        <div class="mt-3">
            <apexchart v-if="!loading" type="area" height="60" :options="areachartOptions" :series="areaSeries"> </apexchart>
            <div v-else class="d-flex justify-center py-4">
                <v-progress-circular indeterminate color="secondary"></v-progress-circular>
            </div>
        </div>
    </v-card>
</template>
