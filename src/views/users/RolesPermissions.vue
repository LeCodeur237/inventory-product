<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axiosInstance from '@/utils/axios';
import { useToast } from 'vue-toastification';

const toast = useToast();
const page = ref({ title: 'Gestion des Rôles' });
const breadcrumbs = ref([
    {
        title: 'Utilisateurs',
        disabled: false,
        href: '#'
    },
    {
        title: 'Rôles & Permissions',
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
        toast.error("Impossible de charger les rôles.");
        console.error(error);
    } finally {
        loading.value = false;
    }
};



onMounted(() => {
    fetchProfils();
});
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12">
            <UiParentCard title="Liste des Rôles (Profils)">

                <v-table class="mt-5" :loading="loading" loading-text="Chargement des rôles...">
                    <thead>
                        <tr>
                            <th class="text-left text-uppercase">Nom du Rôle</th>
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
                            <td colspan="3" class="text-center text-medium-emphasis py-4">Aucun rôle trouvé.</td>
                        </tr>
                    </tbody>
                </v-table>
            </UiParentCard>
        </v-col>
    </v-row>
</template>