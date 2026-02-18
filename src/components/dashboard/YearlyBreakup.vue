<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useTheme } from 'vuetify';
import { getDashboardYearlyBreakup } from '@/api/dashboard';
import { getApiErrorMessage } from '@/utils/apiError';
const theme = useTheme();
const primary = theme.current.value.colors.primary;
const lightprimary = theme.current.value.colors.lightprimary;
const loading = ref(false);
const totalValue = ref(0);
const changePct = ref(0);
const chartSeries = ref<number[]>([0, 0, 0]);
const legend = ref<string[]>(['Entrées', 'Sorties', 'Ajustements']);

const fetchYearlyBreakup = async () => {
    loading.value = true;
    try {
        const data = await getDashboardYearlyBreakup(2026);
        totalValue.value = Number(data?.total_value) || 0;
        changePct.value = Number(data?.change_pct_vs_previous_year) || 0;
        chartSeries.value = Array.isArray(data?.donut) ? data.donut.map((v: any) => Number(v) || 0) : [0, 0, 0];
        if (Array.isArray(data?.legend) && data.legend.length) {
            legend.value = data.legend;
        }
    } catch (error) {
        console.error(getApiErrorMessage(error, 'Erreur chargement yearly breakup.'));
    } finally {
        loading.value = false;
    }
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(value);
};

const chartOptions = computed(() => {
    return {
        labels: ['series-1', 'series-2', 'series-3'],
        chart: {
            type: 'donut',
            fontFamily: `inherit`,
            foreColor: '#a1aab2',
            toolbar: {
                show: false
            }
        },
        colors: [primary, lightprimary, '#F9F9FD'],
        plotOptions: {
            pie: {
                startAngle: 0,
                endAngle: 360,
                donut: {
                    size: '75%',
                    background: 'transparent'
                }
            }
        },
        stroke: {
            show: false
        },
        
        dataLabels: {
            enabled: false
        },
        legend: {
            show: false
        },
        tooltip: { theme: "light", fillSeriesColor: false },
    };
});

onMounted(() => {
    fetchYearlyBreakup();
});
</script>
<template>
    <v-card elevation="10" class="withbg">
        <v-card-item>
            <div class="d-sm-flex align-center justify-space-between pt-sm-2">
                <v-card-title class="text-h5">Yearly Breakup</v-card-title>
            </div>
            <v-row>
                <v-col cols="7" sm="7">
                    <div class="mt-6">
                        <h3 class="text-h3">{{ formatCurrency(totalValue) }}</h3>
                        <div class="mt-1">
                            <v-avatar class="bg-lightsuccess text-success" size="25">
                                <ArrowUpLeftIcon size="20" />
                            </v-avatar>
                            <span class="text-subtitle-1 ml-2 font-weight-bold">{{ changePct >= 0 ? '+' : '' }}{{ changePct }}%</span>
                            <span class="text-subtitle-1 text-muted ml-2">last year</span>
                        </div>
                        <div class="d-flex align-center mt-sm-10 mt-8">
                            <h6 class="text-subtitle-1 text-muted">
                                <v-icon icon="mdi mdi-checkbox-blank-circle" class="mr-1" size="10" color="primary"></v-icon> {{ legend[0] || 'N/A' }}
                            </h6>
                            <h6 class="text-subtitle-1 text-muted pl-5">
                                <v-icon icon="mdi mdi-checkbox-blank-circle" class="mr-1" size="10" color="lightprimary"></v-icon> {{ legend[1] || 'N/A' }}
                            </h6>
                        </div>
                    </div>
                </v-col>
                <v-col cols="5" sm="5" class="pl-lg-0">
                    <div class="d-flex align-center flex-shrink-0">
                        <apexchart v-if="!loading" class="pt-6" type="donut" height="145" :options="chartOptions" :series="chartSeries"> </apexchart>
                        <v-progress-circular v-else indeterminate color="primary"></v-progress-circular>
                    </div>
                </v-col>
            </v-row>
        </v-card-item>
    </v-card>
</template>
