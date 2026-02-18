<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axiosInstance from '@/utils/axios';
import { useToast } from 'vue-toastification';

const toast = useToast();
const page = ref({ title: 'Gestion des Roles' });
const breadcrumbs = ref([
    {
        title: 'Utilisateurs',
        disabled: false,
        href: '#'
    },
    {
        title: 'Roles & Permissions',
        disabled: true,
        href: '#'
    }
]);

interface Profil {
    id_profil: string;
    nom: string;
    description: string | null;
}

const profils = ref<Profil[]>([]);
const loading = ref(true);

const fetchProfils = async () => {
    loading.value = true;
    try {
        const response = await axiosInstance.get('/profils');
        profils.value = response.data;
    } catch (error) {
        toast.error('Impossible de charger les roles.');
        console.error(error);
    } finally {
        loading.value = false;
    }
};

const printPage = () => {
    window.print();
};

onMounted(() => {
    fetchProfils();
});
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12">
            <UiParentCard title="Liste des Roles (Profils)">
                <template v-slot:action>
                    <v-btn color="secondary" variant="outlined" prepend-icon="mdi-printer" @click="printPage">Imprimer / PDF</v-btn>
                </template>

                <v-table class="mt-5" :loading="loading" loading-text="Chargement des roles...">
                    <thead>
                        <tr>
                            <th class="text-left text-uppercase">Nom du Role</th>
                            <th class="text-left text-uppercase">Description</th>
                        </tr>
                    </thead>
                    <tbody v-if="!loading">
                        <tr v-for="item in profils" :key="item.id_profil">
                            <td>
                                <div class="font-weight-bold">{{ item.nom }}</div>
                            </td>
                            <td>{{ item.description || '-' }}</td>
                        </tr>
                        <tr v-if="profils.length === 0">
                            <td colspan="3" class="text-center text-medium-emphasis py-4">Aucun role trouve.</td>
                        </tr>
                    </tbody>
                </v-table>
            </UiParentCard>
        </v-col>
    </v-row>
</template>

