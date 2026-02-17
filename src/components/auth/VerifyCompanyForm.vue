<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axiosInstance from '@/utils/axios';
import { useToast } from 'vue-toastification';

const router = useRouter();
const toast = useToast();

const companyEmail = ref('');
const loading = ref(false);
const emailRules = ref([(v: string) => !!v || 'E-mail is required', (v: string) => /.+@.+\..+/.test(v) || 'E-mail must be valid']);

const verifyCompany = async () => {
    if (!companyEmail.value) return;
    loading.value = true;
    try {
        // Recherche de l'entreprise par email via un paramètre de requête GET
        const response = await axiosInstance.get('/entreprises', {
            params: { email: companyEmail.value }
        });
        
        // L'API renvoie un tableau. S'il n'est pas vide, on prend le premier résultat.
        if (response.data && response.data.length > 0) {
            const companyId = response.data[0].id_entreprise;
            toast.success("Entreprise trouvée ! Veuillez créer votre compte administrateur.");
            router.push(`/auth/create-admin/${companyId}`);
        } else {
            // Si le tableau est vide, aucune entreprise n'a été trouvée.
            toast.error("Aucune entreprise trouvée avec cet email.");
        }
    } catch (error: any) {
        const message = error.response?.data?.message || "Aucune entreprise trouvée avec cet email.";
        toast.error(message);
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <v-form @submit.prevent="verifyCompany">
        <v-row class="d-flex mt-3">
            <v-col cols="12">
                <v-label class="font-weight-bold mb-1">Email de l'entreprise</v-label>
                <v-text-field v-model="companyEmail" :rules="emailRules" type="email" variant="outlined" color="primary"
                    placeholder="contact@mon-entreprise.com"></v-text-field>
            </v-col>
            <v-col cols="12" class="mt-2">
                <v-btn type="submit" color="primary" size="large" block flat :loading="loading">Vérifier et continuer</v-btn>
            </v-col>
        </v-row>
    </v-form>
</template>