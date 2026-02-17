<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axiosInstance from '@/utils/axios';
import { useToast } from 'vue-toastification';

const router = useRouter();
const toast = useToast();

// Form fields
const form = ref<HTMLFormElement | null>(null);
const loading = ref(false);
const name = ref('');
const email = ref('');
const phoneNumber = ref('');
const password = ref('');
const passwordConfirmation = ref('');
const profilId = ref('');
const profiles = ref<{ id_profil: string, nom: string }[]>([]);

// Validation rules
const requiredRule = [(v: string) => !!v || 'Ce champ est requis'];
const emailRule = [
    (v: string) => !!v || 'Ce champ est requis',
    (v: string) => /.+@.+\..+/.test(v) || "L'email doit être valide",
];
const passwordConfirmationRule = [
    (v: string) => !!v || 'Ce champ est requis',
    (v: string) => v === password.value || 'Les mots de passe ne correspondent pas',
];

const fetchProfiles = async () => {
    try {
        const response = await axiosInstance.get('/profils');
        profiles.value = response.data;
    } catch (error) {
        console.error("Erreur lors du chargement des profils:", error);
        toast.error("Impossible de charger les profils.");
    }
};

onMounted(() => {
    fetchProfiles();
});

const handleSubmit = async () => {
    const { valid } = await form.value!.validate();
    if (!valid) return;

    loading.value = true;
    try {
        const companyId = router.currentRoute.value.params.companyId;
        if (!companyId) {
            toast.error("ID de l'entreprise manquant. Veuillez recommencer.");
            router.push('/auth/register');
            return;
        }

        const payload = {
            name: name.value,
            email: email.value,
            phone_number: phoneNumber.value,
            password: password.value,
            password_confirmation: passwordConfirmation.value,
            id_entreprise: companyId,
            profil_id: profilId.value,
        };

        await axiosInstance.post('/register', payload);

        toast.success("Compte administrateur créé avec succès !");
        router.push(`/auth/plans/${companyId}`);
    } catch (error: any) {
        const message = error.response?.data?.message || "Une erreur est survenue.";
        toast.error(message);
        console.error("Erreur lors de la création de l'administrateur:", error);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <v-form ref="form" @submit.prevent="handleSubmit">
        <v-row class="d-flex mt-3">
            <v-col cols="12" md="6">
                <v-label class="font-weight-bold mb-1">Nom complet</v-label>
                <v-text-field v-model="name" :rules="requiredRule" variant="outlined" color="primary"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-label class="font-weight-bold mb-1">Email</v-label>
                <v-text-field v-model="email" :rules="emailRule" type="email" variant="outlined" color="primary"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-label class="font-weight-bold mb-1">Téléphone</v-label>
                <v-text-field v-model="phoneNumber" :rules="requiredRule" variant="outlined" color="primary"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-label class="font-weight-bold mb-1">Profil</v-label>
                <v-select v-model="profilId" :items="profiles" item-title="nom" item-value="id_profil" :rules="requiredRule"
                    variant="outlined" color="primary" label="Sélectionner un profil"></v-select>
            </v-col>
            <v-col cols="12" md="6">
                <v-label class="font-weight-bold mb-1">Mot de passe</v-label>
                <v-text-field v-model="password" :rules="requiredRule" type="password" variant="outlined" color="primary"></v-text-field>
            </v-col>
            <v-col cols="12" md="6">
                <v-label class="font-weight-bold mb-1">Confirmation du mot de passe</v-label>
                <v-text-field v-model="passwordConfirmation" :rules="passwordConfirmationRule" type="password" variant="outlined" color="primary"></v-text-field>
            </v-col>
            <v-col cols="12" class="mt-2">
                <v-btn type="submit" color="primary" size="large" block flat :loading="loading">Finaliser l'inscription</v-btn>
            </v-col>
        </v-row>
    </v-form>
</template>