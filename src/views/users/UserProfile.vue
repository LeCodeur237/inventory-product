<script setup lang="ts">
import { ref, onMounted } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axiosInstance from '@/utils/axios';
import { useToast } from 'vue-toastification';

const toast = useToast();
const page = ref({ title: 'Mon Profil' });
const breadcrumbs = ref([
    {
        title: 'Utilisateurs',
        disabled: false,
        href: '#'
    },
    {
        title: 'Mon Profil',
        disabled: true,
        href: '#'
    }
]);

const loading = ref(false);
const userModel = ref({
    id_users: '',
    name: '',
    email: '',
    phone_number: '',
    poste: '',
    matricule: '',
    agence: '',
    link_img: '',
    signature: '',
    profil_id: null,
});

// Fichiers temporaires pour l'upload
const profileImage = ref<any>(null);
const signatureImage = ref<any>(null);
const profils = ref<any[]>([]);

const fetchUserProfile = async () => {
    loading.value = true;
    try {
        const response = await axiosInstance.get('/user');
        const data = response.data;
        console.log("Données utilisateur récupérées:", data);

        userModel.value = {
            id_users: data.id_users,
            name: data.name,
            email: data.email,
            phone_number: data.phone_number || '',
            poste: data.poste || '',
            matricule: data.matricule || '',
            agence: data.agence || '',
            link_img: data.link_img || '',
            signature: data.signature || '',
            profil_id: data.profil_id || (data.profil ? data.profil.id_profil : null),
        };
    } catch (error) {
        toast.error("Impossible de charger les informations du profil.");
        console.error(error);
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

const saveProfile = async () => {
    loading.value = true;
    try {
        // Upload de la photo de profil si modifiée
        const pFile = Array.isArray(profileImage.value) ? profileImage.value[0] : profileImage.value;
        if (pFile) {
            const formData = new FormData();
            formData.append('file', pFile);
            const response = await axiosInstance.post('/users/upload-media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            userModel.value.link_img = response.data.path;
        }
        // Upload de la signature si modifiée
        const sFile = Array.isArray(signatureImage.value) ? signatureImage.value[0] : signatureImage.value;
        if (sFile) {
            const formData = new FormData();
            formData.append('file', sFile);
            const response = await axiosInstance.post('/users/upload-media', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            userModel.value.signature = response.data.path;
        }

        // Mise à jour des informations du profil

        await axiosInstance.put(`/users/${userModel.value.id_users}`, userModel.value);
        toast.success("Profil mis à jour avec succès !");
        
        // Rafraîchir les données et vider les champs de fichier
        await fetchUserProfile();
        profileImage.value = null;
        signatureImage.value = null;
        
    } catch (error) {
        toast.error("Erreur lors de la mise à jour du profil.");
        console.error(error);
    } finally {
        loading.value = false;
    }
};

const getImageUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${import.meta.env.VITE_API_URL || 'https://api.inventory.cremin-cam.org'}${path}`;
};

onMounted(() => {
    fetchUserProfile();
    fetchProfils();
});
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12" md="4">
            <UiParentCard title="Photo de profil">
                <div class="d-flex flex-column align-center pt-4">
                    <v-avatar size="120" color="primary" variant="tonal" class="mb-6">
                        <v-img v-if="userModel.link_img" :src="getImageUrl(userModel.link_img)" cover></v-img>
                        <v-icon v-else size="60">mdi-account</v-icon>
                    </v-avatar>
                    
                    <v-file-input v-model="profileImage" label="Changer la photo" variant="outlined" density="compact" prepend-icon="mdi-camera" accept="image/*" class="w-100" hide-details></v-file-input>
                    <div class="text-caption text-medium-emphasis mt-2 text-center">Formats: JPG, PNG. Max 2Mo.</div>
                </div>
            </UiParentCard>
            
            <UiParentCard title="Signature" class="mt-6">
                <div class="d-flex flex-column align-center pt-2">
                    <div class="mb-4 border border-dashed pa-4 rounded w-100 d-flex justify-center align-center bg-grey-lighten-5" style="height: 100px;">
                        <v-img v-if="userModel.signature" :src="getImageUrl(userModel.signature)" max-height="80" contain></v-img>
                        <div v-else class="text-medium-emphasis font-italic text-caption">Aucune signature</div>
                    </div>
                    
                    <v-file-input v-model="signatureImage" label="Téléverser une signature" variant="outlined" density="compact" prepend-icon="mdi-pen" accept="image/*" class="w-100" hide-details></v-file-input>
                </div>
            </UiParentCard>
        </v-col>
        
        <v-col cols="12" md="8">
            <UiParentCard title="Informations personnelles">
                <v-form @submit.prevent="saveProfile" class="mt-2">
                    <h6 class="text-subtitle-1 font-weight-bold mb-4">Identité</h6>
                    <v-row>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Nom complet</v-label><v-text-field v-model="userModel.name" variant="outlined" color="primary" density="comfortable"></v-text-field></v-col>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Email</v-label><v-text-field v-model="userModel.email" variant="outlined" color="primary" density="comfortable" readonly disabled bg-color="grey-lighten-4"></v-text-field></v-col>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Téléphone</v-label><v-text-field v-model="userModel.phone_number" variant="outlined" color="primary" density="comfortable"></v-text-field></v-col>
                    </v-row>

                    <v-divider class="my-6"></v-divider>

                    <h6 class="text-subtitle-1 font-weight-bold mb-4">Informations Professionnelles</h6>
                    <v-row>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Poste / Fonction</v-label><v-text-field v-model="userModel.poste" variant="outlined" color="primary" density="comfortable"></v-text-field></v-col>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Matricule</v-label><v-text-field v-model="userModel.matricule" variant="outlined" color="primary" density="comfortable"></v-text-field></v-col>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Agence</v-label><v-text-field v-model="userModel.agence" variant="outlined" color="primary" density="comfortable" readonly disabled></v-text-field></v-col>
                        <v-col cols="12" md="6"><v-label class="font-weight-medium mb-2">Profil (Rôle)</v-label><v-select v-model="userModel.profil_id" :items="profils" item-title="nom" item-value="id_profil" variant="outlined" color="primary" density="comfortable" readonly disabled bg-color="grey-lighten-4"></v-select></v-col>
                    </v-row>

                    <div class="d-flex justify-end mt-6">
                        <v-btn color="primary" type="submit" :loading="loading" size="large" flat>Enregistrer les modifications</v-btn>
                    </div>
                </v-form>
            </UiParentCard>
        </v-col>
    </v-row>
</template>