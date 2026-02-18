<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import { PencilIcon, TrashIcon } from 'vue-tabler-icons';
import axiosInstance from '@/utils/axios';
import { useToast } from 'vue-toastification';

const toast = useToast();
const page = ref({ title: 'Gestion des Pôles' });
const breadcrumbs = ref([
    { title: 'Utilisateurs', disabled: false, href: '#' },
    { title: 'Liste des utilisateurs', disabled: true, href: '#' },
    { title: 'Paramètres', disabled: false, href: '#' },
    { title: 'Pôles', disabled: true, href: '#' }
]);

const poles = ref<any[]>([]);
const loading = ref(true);
const isDrawerOpen = ref(false);
const isFormLoading = ref(false);
const currentUser = ref<any>(null);
const profils = ref<any[]>([]);
const editedPole = ref<any>(null);
const poleModel = ref({ nom: '', description: '' });
const poleForm = ref<HTMLFormElement | null>(null);

// Delete
const isDeleteDialogOpen = ref(false);
const poleToDelete = ref<any>(null);

const fetchCurrentUser = async () => {
    try {
        const response = await axiosInstance.get('/user');
        currentUser.value = response.data;
    } catch (error) {
        console.error("Erreur chargement utilisateur", error);
    }
};

const fetchProfils = async () => {
    try {
        const response = await axiosInstance.get('/profils');
        profils.value = response.data;
    } catch (error) {
        console.error("Erreur chargement profils", error);
    }
};

const fetchPoles = async () => {
    loading.value = true;
    try {
        const response = await axiosInstance.get('/poles');
        poles.value = response.data;
    } catch (error) {
        toast.error("Erreur chargement pôles");
    } finally {
        loading.value = false;
    }
};

const openAddDrawer = () => {
    editedPole.value = null;
    poleModel.value = { nom: '', description: '' };
    isDrawerOpen.value = true;
};

const openEditDrawer = (item: any) => {
    editedPole.value = item;
    poleModel.value = { nom: item.nom, description: item.description };
    isDrawerOpen.value = true;
};

const savePole = async () => {
    const { valid } = await poleForm.value!.validate();
    if (!valid) return;

    isFormLoading.value = true;
    try {
        if (editedPole.value) {
            await axiosInstance.put(`/poles/${editedPole.value.id_pole}`, poleModel.value);
            toast.success("Pôle modifié");
        } else {
            await axiosInstance.post('/poles', poleModel.value);
            toast.success("Pôle créé");
        }
        isDrawerOpen.value = false;
        fetchPoles();
    } catch (error) {
        toast.error("Erreur enregistrement");
    } finally {
        isFormLoading.value = false;
    }
};

const canCreate = computed(() => {
    if (!currentUser.value || profils.value.length === 0) return false;
    const profileId = currentUser.value.id_profil || currentUser.value.profil_id || (currentUser.value.profil ? currentUser.value.profil.id_profil : null);
    const userProfile = profils.value.find((p: any) => p.id_profil === profileId);
    const roleName = userProfile?.nom?.toLowerCase() || '';
    const agency = currentUser.value.agence?.toLowerCase() || '';
    return roleName.includes('admin') && agency.includes('direction');
});

const openDeleteDialog = (item: any) => {
    poleToDelete.value = item;
    isDeleteDialogOpen.value = true;
};

const deletePole = async () => {
    if (!poleToDelete.value) return;
    try {
        await axiosInstance.delete(`/poles/${poleToDelete.value.id_pole}`);
        toast.success("Pôle supprimé");
        isDeleteDialogOpen.value = false;
        fetchPoles();
    } catch (error) {
        toast.error("Erreur suppression");
    }
};

const printPage = () => {
    window.print();
};

onMounted(async () => {
    await fetchCurrentUser();
    await Promise.all([fetchPoles(), fetchProfils()]);
});
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12">
            <UiParentCard title="Liste des Pôles">
                <template v-slot:action>
                    <div class="d-flex ga-2">
                        <v-btn color="secondary" variant="outlined" prepend-icon="mdi-printer" @click="printPage">Imprimer / PDF</v-btn>
                        <v-btn v-if="canCreate" color="primary" prepend-icon="mdi-plus" @click="openAddDrawer">Ajouter un pôle</v-btn>
                    </div>
                </template>
                <v-table class="mt-5" :loading="loading">
                    <thead>
                        <tr>
                            <th class="text-left">Nom</th>
                            <th class="text-left">Description</th>
                            <th class="text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="item in poles" :key="item.id_pole">
                            <td>{{ item.nom }}</td>
                            <td>{{ item.description || '-' }}</td>
                            <td class="text-right">
                                <v-btn icon variant="text" color="primary" size="small" @click="openEditDrawer(item)"><PencilIcon size="20" /></v-btn>
                                <v-btn icon variant="text" color="error" size="small" @click="openDeleteDialog(item)"><TrashIcon size="20" /></v-btn>
                            </td>
                        </tr>
                        <tr v-if="poles.length === 0 && !loading"><td colspan="3" class="text-center">Aucun pôle trouvé</td></tr>
                    </tbody>
                </v-table>
            </UiParentCard>
        </v-col>
        
        <v-navigation-drawer v-if="canCreate" v-model="isDrawerOpen" location="right" temporary width="400">
            <div class="pa-5">
                <div class="d-flex justify-space-between align-center mb-5">
                    <h3 class="text-h5">{{ editedPole ? 'Modifier' : 'Ajouter' }} un pôle</h3>
                    <v-btn icon="mdi-close" variant="text" @click="isDrawerOpen = false"></v-btn>
                </div>
                <v-form ref="poleForm" @submit.prevent="savePole">
                    <v-label class="font-weight-bold mb-1">Nom</v-label>
                    <v-text-field v-model="poleModel.nom" variant="outlined" color="primary" :rules="[v => !!v || 'Requis']"></v-text-field>
                    
                    <v-label class="font-weight-bold mb-1">Description</v-label>
                    <v-textarea v-model="poleModel.description" variant="outlined" color="primary" rows="3"></v-textarea>
                    
                    <v-btn color="primary" type="submit" block :loading="isFormLoading" class="mt-4">Enregistrer</v-btn>
                </v-form>
            </div>
        </v-navigation-drawer>

        <v-dialog v-model="isDeleteDialogOpen" max-width="500">
            <v-card>
                <v-card-title>Confirmer suppression</v-card-title>
                <v-card-text>Supprimer {{ poleToDelete?.nom }} ?</v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="isDeleteDialogOpen = false">Annuler</v-btn>
                    <v-btn color="error" @click="deletePole">Supprimer</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </v-row>
</template>
