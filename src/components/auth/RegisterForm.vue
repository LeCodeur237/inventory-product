<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import axiosInstance from '@/utils/axios';
import { useToast } from 'vue-toastification';

const router = useRouter();
const toast = useToast();

const tab = ref('one');
const isCompanyTabValid = ref(false); // Variable pour suivre la validation
const loading = ref(false); // Pour l'état de chargement du bouton
// Informations sur l'entreprise
const formCompany = ref<HTMLFormElement | null>(null);
const companyName = ref('');
const taxNumber = ref('');
const address = ref('');
const companyEmail = ref('');
const logo = ref<File[]>([]); // Pour le v-file-input

// Informations sur le responsable
const formManager = ref<HTMLFormElement | null>(null);
const managerName = ref('');
const managerEmail = ref('');
const managerPhone = ref('');
const managerNUI = ref('');

// Règles de validation simples
const requiredRule = [(v: string) => !!v || 'Ce champ est requis'];
const emailRule = [
    (v: string) => !!v || 'Ce champ est requis',
    (v: string) => /.+@.+\..+/.test(v) || "L'email doit être valide",
];

const toBase64 = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
});

const handleButtonClick = async () => {
    if (tab.value === 'one') {
        const { valid } = await formCompany.value!.validate();
        if (valid) {
            tab.value = 'two';
            isCompanyTabValid.value = true; // Activer l'onglet suivant
        }
    } else {
        // Valider les deux formulaires avant de soumettre
        const { valid: companyValid } = await formCompany.value!.validate();
        const { valid: managerValid } = await formManager.value!.validate();

        if (companyValid && managerValid) {
            loading.value = true;

            try {
                let logoBase64 = '';
                if (logo.value.length > 0) {
                    logoBase64 = await toBase64(logo.value[0]);
                }

                const payload = {
                    company_name: companyName.value,
                    tax_number: taxNumber.value,
                    address: address.value,
                    company_email: companyEmail.value,
                    logo: logoBase64,
                    manager_name: managerName.value,
                    manager_email: managerEmail.value,
                    manager_phone: managerPhone.value,
                    manager_nui: managerNUI.value,
                };

                const response = await axiosInstance.post('/entreprises', payload);

                // Récupérer l'ID de l'entreprise depuis la réponse de l'API
                const companyId = response.data.id_entreprise; // Adaptez si la clé est différente

                toast.success("Entreprise enregistrée avec succès. Veuillez créer le compte administrateur.");

                // Rediriger vers la page de création de l'administrateur avec l'ID
                router.push(`/auth/create-admin/${companyId}`);

            } catch (error: any) {
                console.error("Erreur lors de l'inscription:", error);
                // Afficher un message d'erreur à l'utilisateur
                const message = error.response?.data?.message || "Une erreur est survenue lors de l'inscription.";
                toast.error(message);
            } finally {
                loading.value = false;
            }
        }
    }
};
</script>

<template>
    <v-tabs v-model="tab" bg-color="transparent" color="primary" grow>
        <v-tab value="one">Entreprise</v-tab>
        <v-tab value="two" :disabled="!isCompanyTabValid">Responsable</v-tab>
    </v-tabs>

    <v-window v-model="tab" class="mt-3">
        <v-window-item value="one">
            <v-form ref="formCompany" class="mt-3">
                <v-row>
                    <v-col cols="12" md="6"><v-label class="font-weight-bold mb-1">Nom de l'entreprise</v-label><v-text-field v-model="companyName" variant="outlined" :rules="requiredRule" color="primary"></v-text-field></v-col>
                    <v-col cols="12" md="6"><v-label class="font-weight-bold mb-1">Numéro de contribuable</v-label><v-text-field v-model="taxNumber" variant="outlined" :rules="requiredRule" color="primary"></v-text-field></v-col>
                    <v-col cols="12" md="6"><v-label class="font-weight-bold mb-1">Adresse</v-label><v-text-field v-model="address" variant="outlined" :rules="requiredRule" color="primary"></v-text-field></v-col>
                    <v-col cols="12" md="6"><v-label class="font-weight-bold mb-1">Email de l'entreprise</v-label><v-text-field v-model="companyEmail" variant="outlined" type="email" :rules="emailRule" color="primary"></v-text-field></v-col>
                    <v-col cols="12"><v-label class="font-weight-bold mb-1">Logo</v-label><v-file-input v-model="logo" variant="outlined" color="primary" prepend-icon="mdi-camera"></v-file-input></v-col>
                </v-row>
            </v-form>
        </v-window-item>

        <v-window-item value="two">
            <v-form ref="formManager" class="mt-3">
                <v-row>
                    <v-col cols="12" md="6"><v-label class="font-weight-bold mb-1">Nom du responsable</v-label><v-text-field v-model="managerName" variant="outlined" :rules="requiredRule" color="primary"></v-text-field></v-col>
                    <v-col cols="12" md="6"><v-label class="font-weight-bold mb-1">Email du responsable</v-label><v-text-field v-model="managerEmail" variant="outlined" type="email" :rules="emailRule" color="primary"></v-text-field></v-col>
                    <v-col cols="12" md="6"><v-label class="font-weight-bold mb-1">Téléphone du responsable</v-label><v-text-field v-model="managerPhone" variant="outlined" :rules="requiredRule" color="primary"></v-text-field></v-col>
                    <v-col cols="12" md="6"><v-label class="font-weight-bold mb-1">NUI du responsable</v-label><v-text-field v-model="managerNUI" variant="outlined" :rules="requiredRule" color="primary"></v-text-field></v-col>
                    <!-- Le champ mot de passe est retiré de ce formulaire -->
                </v-row>
            </v-form>
        </v-window-item>
    </v-window>

    <div class="mt-5">
        <v-btn @click="handleButtonClick" color="primary" size="large" block flat :loading="loading">
            {{ tab === 'one' ? 'Suivant' : "Enregistrer l'entreprise" }}
        </v-btn>
    </div>
</template>
