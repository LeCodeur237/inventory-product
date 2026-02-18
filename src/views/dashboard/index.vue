<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import SalesOverview from '@/components/dashboard/SalesOverview.vue';
import YearlyBreakup from '@/components/dashboard/YearlyBreakup.vue';
import MonthlyEarning from '@/components/dashboard/MonthlyEarnings.vue';
import RecentTransaction from '@/components/dashboard/RecentTransaction.vue';
import axiosInstance from '@/utils/axios';

const router = useRouter();
const loading = ref(true);
const roleName = ref('');
const demandes = ref<any[]>([]);
const sorties = ref<any[]>([]);

const isAgent = computed(() => roleName.value.toLowerCase().includes('agent'));

const normalizeStatus = (value: string) => {
    return (value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase();
};

const isReceivedStatus = (status: string) => {
    const s = normalizeStatus(status);
    return s.includes('CONFIRM') || s.includes('VALID') || s.includes('RECU') || s.includes('LIVRE');
};

const isRefusedStatus = (status: string) => {
    return normalizeStatus(status).includes('REFUS');
};

const agentStats = computed(() => {
    const rows = sorties.value.map((s: any) => s.statut_direction || s.statut || 'EN_ATTENTE');
    const received = rows.filter((s: string) => isReceivedStatus(s)).length;
    const refused = rows.filter((s: string) => isRefusedStatus(s)).length;
    const pending = rows.length - received - refused;

    const totalQtyReceived = sorties.value
        .filter((s: any) => isReceivedStatus(s.statut_direction || s.statut || ''))
        .reduce((sum: number, s: any) => sum + Number(s.quantite_sortie || 0), 0);

    return {
        demandes: demandes.value.length,
        sorties: sorties.value.length,
        received,
        refused,
        pending,
        totalQtyReceived
    };
});

const recentAgentRows = computed(() => {
    return [...sorties.value]
        .sort((a: any, b: any) => {
            const da = new Date(a.date_sortie || a.created_at || 0).getTime();
            const db = new Date(b.date_sortie || b.created_at || 0).getTime();
            return db - da;
        })
        .slice(0, 8);
});

const getProductName = (item: any) => {
    return item?.product?.nom || 'Produit';
};

const statusChartSeries = computed(() => {
    return [agentStats.value.received, agentStats.value.refused, agentStats.value.pending];
});

const statusChartOptions = computed(() => ({
    labels: ['Recus', 'Refuses', 'En attente'],
    colors: ['#4CAF50', '#F44336', '#FF9800'],
    legend: { position: 'bottom' },
    dataLabels: { enabled: true }
}));

const twoDigits = (value: number) => {
    return value < 10 ? `0${value}` : `${value}`;
};

const monthlyChartData = computed(() => {
    const now = new Date();
    const months: { key: string; label: string }[] = [];

    for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${twoDigits(d.getMonth() + 1)}`;
        const label = d.toLocaleDateString('fr-FR', { month: 'short' });
        months.push({ key, label });
    }

    const demandesCount = months.map((m) =>
        demandes.value.filter((d: any) => {
            if (!d?.date_demande) return false;
            const date = new Date(d.date_demande);
            const key = `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}`;
            return key === m.key;
        }).length
    );

    const recuesCount = months.map((m) =>
        sorties.value.filter((s: any) => {
            const rawDate = s.date_sortie || s.created_at;
            if (!rawDate) return false;
            const date = new Date(rawDate);
            const key = `${date.getFullYear()}-${twoDigits(date.getMonth() + 1)}`;
            return key === m.key && isReceivedStatus(s.statut_direction || s.statut || '');
        }).length
    );

    return {
        categories: months.map((m) => m.label),
        series: [
            { name: 'Demandes', data: demandesCount },
            { name: 'Receptions', data: recuesCount }
        ]
    };
});

const monthlyChartOptions = computed(() => ({
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { borderRadius: 6, columnWidth: '45%' } },
    xaxis: { categories: monthlyChartData.value.categories },
    colors: ['#1E88E5', '#43A047'],
    legend: { position: 'top' }
}));

const topProductsData = computed(() => {
    const map = new Map<string, number>();
    sorties.value.forEach((s: any) => {
        const name = getProductName(s);
        const qty = Number(s.quantite_sortie || 0);
        map.set(name, (map.get(name) || 0) + qty);
    });

    const rows = Array.from(map.entries())
        .map(([name, qty]) => ({ name, qty }))
        .sort((a, b) => b.qty - a.qty)
        .slice(0, 6);

    return {
        categories: rows.map((r) => r.name),
        values: rows.map((r) => r.qty)
    };
});

const topProductsOptions = computed(() => ({
    chart: { type: 'bar', toolbar: { show: false } },
    plotOptions: { bar: { horizontal: true, borderRadius: 6 } },
    xaxis: { categories: topProductsData.value.categories },
    colors: ['#5E35B1'],
    dataLabels: { enabled: true }
}));

const fetchRole = async () => {
    const { data: user } = await axiosInstance.get('/user');
    const profileId = user.id_profil || user.profil_id || user.profil?.id_profil;

    if (user.profil?.nom) {
        roleName.value = user.profil.nom;
        return;
    }

    if (profileId) {
        const { data: profils } = await axiosInstance.get('/profils');
        const profil = (Array.isArray(profils) ? profils : []).find((p: any) => p.id_profil === profileId);
        roleName.value = profil?.nom || '';
    }
};

const fetchAgentData = async () => {
    const { data } = await axiosInstance.get('/demandes/me');
    demandes.value = Array.isArray(data) ? data : [];

    const sortiesParDemande = await Promise.all(
        demandes.value.map(async (d: any) => {
            try {
                const res = await axiosInstance.get(`/demandes/${d.id_demande}/sorties`);
                const rows = Array.isArray(res.data) ? res.data : [];
                return rows.map((s: any) => ({
                    ...s,
                    demande_id: d.id_demande,
                    demande_motif: d.motif || ''
                }));
            } catch {
                return [];
            }
        })
    );

    sorties.value = sortiesParDemande.reduce((acc: any[], items: any[]) => acc.concat(items), []);
};

const initDashboard = async () => {
    loading.value = true;
    try {
        await fetchRole();
        if (isAgent.value) {
            await fetchAgentData();
        }
    } catch (error) {
        console.error('Erreur chargement dashboard', error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    initDashboard();
});
</script>

<template>
    <v-row>
        <v-col cols="12">
            <v-row v-if="!isAgent">
                <v-col cols="12" lg="8">
                    <SalesOverview />
                </v-col>
                <v-col cols="12" lg="4">
                    <div class="mb-6">
                        <YearlyBreakup />
                    </div>
                    <div>
                        <MonthlyEarning />
                    </div>
                </v-col>
                <v-col cols="12" lg="12">
                    <RecentTransaction />
                </v-col>
            </v-row>

            <v-row v-else>
                <v-col cols="12" md="3">
                    <v-card variant="outlined" class="pa-4">
                        <div class="text-caption text-medium-emphasis">Mes demandes</div>
                        <div class="text-h4 font-weight-bold">{{ agentStats.demandes }}</div>
                    </v-card>
                </v-col>
                <v-col cols="12" md="3">
                    <v-card variant="outlined" class="pa-4">
                        <div class="text-caption text-medium-emphasis">Produits recus</div>
                        <div class="text-h4 font-weight-bold text-success">{{ agentStats.received }}</div>
                    </v-card>
                </v-col>
                <v-col cols="12" md="3">
                    <v-card variant="outlined" class="pa-4">
                        <div class="text-caption text-medium-emphasis">Produits refuses</div>
                        <div class="text-h4 font-weight-bold text-error">{{ agentStats.refused }}</div>
                    </v-card>
                </v-col>
                <v-col cols="12" md="3">
                    <v-card variant="outlined" class="pa-4">
                        <div class="text-caption text-medium-emphasis">Quantite recue</div>
                        <div class="text-h4 font-weight-bold text-primary">{{ agentStats.totalQtyReceived }}</div>
                    </v-card>
                </v-col>

                <v-col cols="12" md="4">
                    <v-card elevation="10">
                        <v-card-item>
                            <v-card-title class="text-h6">Statut des sorties</v-card-title>
                            <apexchart v-if="!loading" type="donut" height="260" :options="statusChartOptions" :series="statusChartSeries" />
                        </v-card-item>
                    </v-card>
                </v-col>

                <v-col cols="12" md="8">
                    <v-card elevation="10">
                        <v-card-item>
                            <v-card-title class="text-h6">Evolution mensuelle (6 mois)</v-card-title>
                            <apexchart v-if="!loading" type="bar" height="260" :options="monthlyChartOptions" :series="monthlyChartData.series" />
                        </v-card-item>
                    </v-card>
                </v-col>

                <v-col cols="12">
                    <v-card elevation="10">
                        <v-card-item>
                            <v-card-title class="text-h6">Top produits (quantites)</v-card-title>
                            <apexchart
                                v-if="!loading"
                                type="bar"
                                height="260"
                                :options="topProductsOptions"
                                :series="[{ name: 'Quantite', data: topProductsData.values }]"
                            />
                        </v-card-item>
                    </v-card>
                </v-col>

                <v-col cols="12">
                    <v-card elevation="10">
                        <v-card-item>
                            <div class="d-flex justify-space-between align-center mb-4">
                                <v-card-title class="text-h5">Mes derniers mouvements</v-card-title>
                                <v-btn color="primary" variant="outlined" @click="router.push('/users/agent-report')">
                                    Voir le rapport complet
                                </v-btn>
                            </div>

                            <v-table :loading="loading">
                                <thead>
                                    <tr>
                                        <th class="text-left">Date</th>
                                        <th class="text-left">Produit</th>
                                        <th class="text-left">Quantite</th>
                                        <th class="text-left">Statut</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr v-for="item in recentAgentRows" :key="item.id_sortie_stock">
                                        <td>{{ item.date_sortie ? new Date(item.date_sortie).toLocaleDateString() : '-' }}</td>
                                        <td>{{ getProductName(item) }}</td>
                                        <td>{{ item.quantite_sortie || 0 }}</td>
                                        <td>
                                            <v-chip
                                                size="small"
                                                :color="isRefusedStatus(item.statut_direction || item.statut || '') ? 'error' : (isReceivedStatus(item.statut_direction || item.statut || '') ? 'success' : 'warning')"
                                            >
                                                {{ item.statut_direction || item.statut || 'EN_ATTENTE' }}
                                            </v-chip>
                                        </td>
                                    </tr>
                                    <tr v-if="recentAgentRows.length === 0 && !loading">
                                        <td colspan="4" class="text-center text-medium-emphasis py-4">Aucun mouvement disponible.</td>
                                    </tr>
                                </tbody>
                            </v-table>
                        </v-card-item>
                    </v-card>
                </v-col>
            </v-row>
        </v-col>
    </v-row>
</template>
