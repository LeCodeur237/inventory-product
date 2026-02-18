<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useTheme } from 'vuetify';
import { getDashboardSalesOverview } from '@/api/dashboard';
import { getApiErrorMessage } from '@/utils/apiError';
const theme = useTheme();
const primary = theme.current.value.colors.primary;
const secondary = theme.current.value.colors.secondary;
const select = ref('March 2025');
const items = ref(['March 2025', 'April 2025', 'May 2025']);
const loading = ref(false);
const chartSeries = ref<any[]>([]);
const chartLabels = ref<string[]>([]);

const fetchSalesOverview = async () => {
    loading.value = true;
    try {
        const data = await getDashboardSalesOverview({
            period: 'month',
            from: '2026-02-01',
            to: '2026-02-28',
            group_by: 'day'
        });

        chartLabels.value = Array.isArray(data?.labels) ? data.labels : [];
        chartSeries.value = Array.isArray(data?.series) ? data.series : [];
    } catch (error) {
        console.error(getApiErrorMessage(error, 'Erreur chargement sales overview.'));
        chartLabels.value = [];
        chartSeries.value = [];
    } finally {
        loading.value = false;
    }
};

const maxY = computed(() => {
    const values = chartSeries.value.reduce((acc: number[], s: any) => {
        if (Array.isArray(s?.data)) {
            return acc.concat(s.data.map((v: any) => Number(v) || 0));
        }
        return acc;
    }, []);
    const max = values.length ? Math.max(...values.map((v: number) => Number(v) || 0)) : 0;
    return max > 0 ? Math.ceil(max / 10) * 10 : 100;
});

const chartOptions = computed(() => {
    return {
        series: chartSeries.value,
        chartOptions: {
            grid: {
                borderColor: 'rgba(0,0,0,0.1)',
                strokeDashArray: 3,
                xaxis: {
                    lines: {
                        show: false
                    }
                },
            },
            plotOptions: {
                bar: { horizontal: false, columnWidth: "40%", borderRadius: [8] },
            },
            colors: [primary, secondary],
            chart: {
                type: "bar",
                height: 370,
                offsetX: -15,
                toolbar: { show: true },
                foreColor: "#adb0bb",
                fontFamily: 'inherit',
                sparkline: { enabled: false },
            },
            dataLabels: { enabled: false },
            markers: { size: 0 },
            legend: { show: false },
            xaxis: {
                type: "category",
                categories: chartLabels.value,
                labels: {
                    style: { cssClass: "grey--text lighten-2--text fill-color" },
                },
            },
            yaxis: {
                show: true,
                min: 0,
                max: maxY.value,
                tickAmount: 4,
                labels: {
                    style: {
                        cssClass: "grey--text lighten-2--text fill-color",
                    },
                },
            },
            stroke: {
                show: true,
                width:3,
                lineCap: "butt",
                colors: ["transparent"],
            },
            tooltip: { theme: "light" },

            responsive: [
            {
                breakpoint: 600,
                options: {
                    plotOptions: {
                        bar: {
                            borderRadius: 3,
                        }
                    },
                }
            }
        ]

        },
    };
});

onMounted(() => {
    fetchSalesOverview();
});
</script>
<template>
    <v-card elevation="10" class="withbg">
        <v-card-item>
            <div class="d-sm-flex align-center justify-space-between pt-sm-2">
                <div><v-card-title class="text-h5">Sales Overview</v-card-title></div>
                <div class="my-sm-0 my-2">
                    <v-select v-model="select" :items="items" variant="outlined" density="compact"
                        hide-details></v-select>
                </div>
            </div>
            <div class="mt-6">
                <apexchart v-if="!loading" type="bar" height="370px" :options="chartOptions.chartOptions" :series="chartOptions.series">
                </apexchart>
                <div v-else class="d-flex justify-center py-16">
                    <v-progress-circular indeterminate color="primary"></v-progress-circular>
                </div>
            </div>
        </v-card-item>
    </v-card>
</template>
