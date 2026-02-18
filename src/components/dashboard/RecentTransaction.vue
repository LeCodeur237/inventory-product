<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { CircleIcon } from 'vue-tabler-icons';
import { getDashboardRecentTransactions } from '@/api/dashboard';
import { getApiErrorMessage } from '@/utils/apiError';

const loading = ref(false);
const recentTransaction = ref<any[]>([]);

const getColorByType = (type: string) => {
    const t = (type || '').toUpperCase();
    if (t.includes('ENTREE')) return 'success';
    if (t.includes('SORTIE')) return 'warning';
    if (t.includes('REFUS')) return 'error';
    return 'primary';
};

const formatDateTime = (value: string) => {
    if (!value) return '-';
    return new Date(value).toLocaleString();
};

const fetchRecentTransactions = async () => {
    loading.value = true;
    try {
        const data = await getDashboardRecentTransactions(10);
        const rows = Array.isArray(data) ? data : [];
        recentTransaction.value = rows.map((item: any, index: number) => ({
            title: formatDateTime(item.date || item.created_at),
            subtitle: item.subtitle || item.title || item.type || 'Transaction',
            textcolor: getColorByType(item.type || ''),
            line: index < rows.length - 1,
            boldtext: true,
            url: item.url || '/products/global-history',
            link: item.id || ''
        }));
    } catch (error) {
        console.error(getApiErrorMessage(error, 'Erreur chargement transactions récentes.'));
        recentTransaction.value = [];
    } finally {
        loading.value = false;
    }
};

onMounted(() => {
    fetchRecentTransactions();
});
</script>
<template>
    <v-card elevation="10" class="withbg">
        <v-card-item class="pb-0">
            <v-card-title class="text-h5 pt-sm-2">Recent Transactions</v-card-title>
            <div v-if="loading" class="d-flex justify-center py-10">
                <v-progress-circular indeterminate color="primary"></v-progress-circular>
            </div>
            <div v-else class="recent-transaction mt-10 px-3">
                <div v-for="list in recentTransaction" :key="list.title">
                    <v-row class="d-flex mb-4">
                        <v-col cols="4" lg="3" md="auto" sm="auto" class="px-0 pt-0 pb-1 d-flex align-start">
                            <h6 class="text-body-1 textSecondary text-no-wrap">{{ list.title }}</h6>
                        </v-col>
                        <v-col cols="1" sm="1" class="px-0 text-center pt-0 pb-1">
                            <CircleIcon size="13" :class="'text-' + list.textcolor" />
                            <div v-if="list.line" class="line mx-auto bg-grey100"></div>
                        </v-col>
                        <v-col cols="7" sm="8" class="pt-0">
                            <h6 v-if="list.boldtext" class="text-body-1 font-weight-bold">{{ list.subtitle }}</h6>
                            <h6 v-else class="text-body-1 textSecondary">{{ list.subtitle }}</h6>
                            <div class="mt-n1">
                                <RouterLink :to="list.url" class="text-body-1 text-primary text-decoration-none" v-if="list.link">{{
                                    list.link
                                }}</RouterLink>
                            </div>
                        </v-col>
                    </v-row>
                </div>
            </div>
        </v-card-item>
    </v-card>
</template>
<style lang="scss">
.recent-transaction {
    .line {
        width: 2px;
        height: 35px;
    }
}
</style>
