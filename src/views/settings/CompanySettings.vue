<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axiosInstance from '@/utils/axios';
import { useToast } from 'vue-toastification';

const toast = useToast();
const page = ref({ title: "Paramètres de l'entreprise" });
const breadcrumbs = ref([
    {
        title: 'Paramètres',
        disabled: false,
        href: '#'
    },
    {
        title: 'Entreprise',
        disabled: true,
        href: '#'
    }
]);

const loading = ref(false);
const companyModel = ref({
    id_entreprise: '',
    company_name: '',
    tax_number: '',
    address: '',
    company_email: '',
    logo: '',
    manager_name: '',
    manager_email: '',
    manager_phone: '',
    manager_nui: ''
});

const logoFile = ref<any>(null);
const currentUser = ref<any>(null);
const profils = ref<any[]>([]);

const canEdit = computed(() => {
    if (!currentUser.value || profils.value.length === 0) return false;

    const profileId = currentUser.value.id_profil || currentUser.value.profil_id || (currentUser.value.profil ? currentUser.value.profil.id_profil : null);
    const userProfile = profils.value.find((p: any) => p.id_profil === profileId);
    const roleName = userProfile?.nom?.toLowerCase() || '';
    const agency = currentUser.value.agence?.toLowerCase() || '';

    // L'utilisateur doit être Admin ET appartenir à la Direction
    const isAdmin = roleName.includes('admin');
    const isDirection = agency.includes('direction') || roleName.includes('direction');

    return isAdmin && isDirection;
});

const getImageUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${import.meta.env.VITE_API_URL || 'https://api.inventory.cremin-cam.org'}${path}`;
};

const fetchCompanySettings = async () => {
    loading.value = true;
    try {
        // 1. Récupérer l'utilisateur courant pour avoir l'ID entreprise
        const userRes = await axiosInstance.get('/user');
        const user = userRes.data;
        currentUser.value = user;
        
        if (user.id_entreprise) {
            // 2. Récupérer les détails de l'entreprise
            const companyRes = await axiosInstance.get(`/entreprises/${user.id_entreprise}`);
            const data = companyRes.data;
            
            companyModel.value = {
                id_entreprise: data.id_entreprise,
                company_name: data.company_name,
                tax_number: data.tax_number,
                address: data.address,
                company_email: data.company_email,
                logo: data.logo,
                manager_name: data.manager_name,
                manager_email: data.manager_email,
                manager_phone: data.manager_phone,
                manager_nui: data.manager_nui
            };
        }
    } catch (error) {
        console.error(error);
        toast.error("Impossible de charger les informations de l'entreprise.");
    } finally {
        loading.value = false;
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

const saveSettings = async () => {
    loading.value = true;
    try {
        // Gérer la mise à jour du logo si un fichier est sélectionné
        const file = Array.isArray(logoFile.value) ? logoFile.value[0] : logoFile.value;
        if (file) {
            const formData = new FormData();
            formData.append('file', file);
            const response = await axiosInstance.post('/users/upload-media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            companyModel.value.logo = response.data.path;
        }

        await axiosInstance.put(`/entreprises/${companyModel.value.id_entreprise}`, companyModel.value);
        toast.success("Paramètres enregistrés avec succès !");
        
        // Rafraîchir les données
        await fetchCompanySettings();
        logoFile.value = null;
    } catch (error) {
        console.error(error);
        toast.error("Erreur lors de la sauvegarde des paramètres.");
    } finally {
        loading.value = false;
    }
};

onMounted(async () => {
    await fetchProfils();
    await fetchCompanySettings();
});
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12" md="4">
            <UiParentCard title="Logo de l'entreprise">
                <div class="d-flex flex-column align-center pt-4">
                    <div class="mb-4 border border-dashed pa-4 rounded w-100 d-flex justify-center align-center bg-grey-lighten-5" style="height: 150px;">
                        <v-img v-if="companyModel.logo" :src="getImageUrl(companyModel.logo)" max-height="120" contain></v-img>
                        <div v-else class="text-medium-emphasis font-italic">Aucun logo</div>
                    </div>
                    <v-file-input v-model="logoFile" label="Changer le logo" variant="outlined" density="compact" prepend-icon="mdi-camera" accept="image/*" class="w-100" hide-details :disabled="!canEdit"></v-file-input>
                </div>
            </UiParentCard>
        </v-col>

        <v-col cols="12" md="8">
            <UiParentCard title="Informations générales">
                <v-form @submit.prevent="saveSettings">
                    <h6 class="text-subtitle-1 font-weight-bold mb-4">Détails de l'entreprise</h6>
                    <v-row>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Nom de l'entreprise</v-label><v-text-field v-model="companyModel.company_name" variant="outlined" color="primary" density="comfortable" :readonly="!canEdit"></v-text-field></v-col>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Email de contact</v-label><v-text-field v-model="companyModel.company_email" variant="outlined" color="primary" density="comfortable" type="email" :readonly="!canEdit"></v-text-field></v-col>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Numéro de contribuable</v-label><v-text-field v-model="companyModel.tax_number" variant="outlined" color="primary" density="comfortable" :readonly="!canEdit"></v-text-field></v-col>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Adresse</v-label><v-text-field v-model="companyModel.address" variant="outlined" color="primary" density="comfortable" :readonly="!canEdit"></v-text-field></v-col>
                    </v-row>

                    <v-divider class="my-6"></v-divider>

                    <h6 class="text-subtitle-1 font-weight-bold mb-4">Responsable</h6>
                    <v-row>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Nom du responsable</v-label><v-text-field v-model="companyModel.manager_name" variant="outlined" color="primary" density="comfortable" :readonly="!canEdit"></v-text-field></v-col>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Email du responsable</v-label><v-text-field v-model="companyModel.manager_email" variant="outlined" color="primary" density="comfortable" type="email" :readonly="!canEdit"></v-text-field></v-col>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Téléphone</v-label><v-text-field v-model="companyModel.manager_phone" variant="outlined" color="primary" density="comfortable" :readonly="!canEdit"></v-text-field></v-col>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">NUI</v-label><v-text-field v-model="companyModel.manager_nui" variant="outlined" color="primary" density="comfortable" :readonly="!canEdit"></v-text-field></v-col>
                    </v-row>

                    <div class="d-flex justify-end mt-6" v-if="canEdit">
                        <v-btn color="primary" type="submit" :loading="loading" size="large" flat>Enregistrer les modifications</v-btn>
                    </div>
                </v-form>
            </UiParentCard>
        </v-col>
    </v-row>
</template>
