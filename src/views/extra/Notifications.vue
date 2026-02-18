<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axiosInstance from '@/utils/axios';
import { useToast } from 'vue-toastification';

const toast = useToast();
const page = ref({ title: 'Notifications' });
const breadcrumbs = ref([
    { title: 'Extra', disabled: false, href: '#' },
    { title: 'Notifications', disabled: true, href: '#' }
]);

const loading = ref(false);
const search = ref('');
const notifications = ref<any[]>([]);

const normalizeNotification = (item: any) => {
    return {
        id: item.id_notification || item.id || crypto.randomUUID(),
        title: item.titre || item.title || item.type || 'Notification',
        message: item.message || item.contenu || item.description || '-',
        created_at: item.created_at || item.date || item.timestamp || new Date().toISOString(),
        is_read: Boolean(item.is_read ?? item.read ?? item.lu ?? false)
    };
};

const fetchNotifications = async () => {
    loading.value = true;
    try {
        const endpoints = ['/notifications/me', '/notifications', '/users/notifications'];
        let data: any[] = [];

        for (const endpoint of endpoints) {
            try {
                const res = await axiosInstance.get(endpoint);
                if (Array.isArray(res.data)) {
                    data = res.data;
                    break;
                }
            } catch {
                // next endpoint
            }
        }

        notifications.value = data.map(normalizeNotification);
    } catch (error) {
        console.error(error);
        toast.error('Impossible de charger les notifications.');
    } finally {
        loading.value = false;
    }
};

const filteredNotifications = computed(() => {
    if (!search.value) return notifications.value;
    const s = search.value.toLowerCase();
    return notifications.value.filter((n: any) => {
        return String(n.title).toLowerCase().includes(s) || String(n.message).toLowerCase().includes(s);
    });
});

const unreadCount = computed(() => {
    return notifications.value.filter((n: any) => !n.is_read).length;
});

const printPage = () => {
    window.print();
};

onMounted(() => {
    fetchNotifications();
});
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>

    <v-row>
        <v-col cols="12">
            <UiParentCard title="Centre de notifications">
                <template v-slot:action>
                    <div class="d-flex ga-2 align-center">
                        <v-chip color="warning" label>{{ unreadCount }} non lues</v-chip>
                        <v-btn color="secondary" variant="outlined" prepend-icon="mdi-printer" @click="printPage">Imprimer / PDF</v-btn>
                        <v-btn color="primary" variant="outlined" prepend-icon="mdi-refresh" :loading="loading" @click="fetchNotifications">Rafraîchir</v-btn>
                    </div>
                </template>

                <v-text-field
                    v-model="search"
                    prepend-inner-icon="mdi-magnify"
                    label="Rechercher une notification..."
                    variant="outlined"
                    density="compact"
                    hide-details
                    class="mb-4"
                />

                <v-list lines="two" class="rounded border">
                    <v-list-item v-for="item in filteredNotifications" :key="item.id">
                        <template v-slot:prepend>
                            <v-avatar :color="item.is_read ? 'grey-lighten-2' : 'warning'" variant="tonal" size="36">
                                <v-icon>mdi-bell-outline</v-icon>
                            </v-avatar>
                        </template>
                        <v-list-item-title class="font-weight-medium">{{ item.title }}</v-list-item-title>
                        <v-list-item-subtitle>{{ item.message }}</v-list-item-subtitle>
                        <template v-slot:append>
                            <div class="text-caption text-medium-emphasis">
                                {{ new Date(item.created_at).toLocaleString() }}
                            </div>
                        </template>
                    </v-list-item>
                    <v-list-item v-if="filteredNotifications.length === 0 && !loading">
                        <v-list-item-title class="text-medium-emphasis">Aucune notification.</v-list-item-title>
                    </v-list-item>
                </v-list>
            </UiParentCard>
        </v-col>
    </v-row>
</template>
