<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Logo from '@/layouts/full/logo/Logo.vue';
import axiosInstance from '@/utils/axios';
import { useToast } from 'vue-toastification';

const router = useRouter();
const toast = useToast();
const loadingPlan = ref<string | null>(null);

const plans = ref([
    {
        name: 'Gratuit',
        price: '0 FCFA',
        userLimit: '30',
        features: ['30 utilisateurs', 'Gestion de stock de base', 'Support par email'],
        color: 'danger'
    },
    {
        name: 'Soft',
        price: '10,000 FCFA / mois',
        userLimit: '60',
        features: ['60 utilisateurs', 'Gestion de stock avancée', 'Rapports et analyses', 'Support prioritaire'],
        color: 'primary'
    },
    {
        name: 'Premium',
        price: '25,000 FCFA / mois',
        userLimit: 'illimité',
        features: ['Utilisateurs illimités', 'Toutes les fonctionnalités Soft', 'Intégrations API', 'Support dédié 24/7'],
        color: 'secondary'
    }
]);

const selectPlan = async (plan: typeof plans.value[0]) => {
    loadingPlan.value = plan.name;
    try {
        const companyId = router.currentRoute.value.params.companyId;
        if (!companyId) {
            toast.error("ID de l'entreprise manquant. Veuillez recommencer le processus.");
            router.push('/auth/register');
            return;
        }

        const payload = {
            id_entreprise: companyId,
            forfait: plan.name,
            nbre_limit_personnel: plan.userLimit,
            actif: true
        };

        await axiosInstance.post('/config-entreprises', payload);
        toast.success(`Forfait ${plan.name} sélectionné ! Vous pouvez maintenant vous connecter.`);
        router.push('/auth/login');
    } catch (error: any) {
        const message = error.response?.data?.message || "Une erreur est survenue lors de la sélection du forfait.";
        toast.error(message);
    } finally {
        loadingPlan.value = null;
    }
};
</script>

<template>
    <div class="authentication">
        <v-container fluid class="pa-3">
            <v-row class="h-100vh d-flex justify-center align-center">
                <v-col cols="12" lg="10" xl="8">
                    <v-card rounded="md" elevation="10" class="px-sm-1 px-0 withbg mx-auto">
                        <v-card-item class="pa-sm-8">
                            <div class="d-flex justify-center py-4">
                                <Logo />
                            </div>
                            <div class="text-center mb-6">
                                <h2 class="text-h3 font-weight-bold">Choisissez votre forfait</h2>
                                <p class="text-muted mt-2">Vous êtes presque prêt ! Sélectionnez le forfait qui correspond le mieux à vos besoins.</p>
                            </div>

                            <v-row>
                                <v-col v-for="plan in plans" :key="plan.name" cols="12" md="4">
                                    <v-card variant="outlined" class="text-center" :class="plan.color === 'primary' ? 'border-primary' : ''">
                                        <v-card-item>
                                            <h3 class="text-h4 font-weight-semibold">{{ plan.name }}</h3>
                                            <p class="text-h5 my-4">{{ plan.price }}</p>
                                            <v-list class="text-left bg-transparent">
                                                <v-list-item v-for="feature in plan.features" :key="feature" density="compact" class="px-0">
                                                    <template v-slot:prepend>
                                                        <v-icon color="primary" size="small">mdi-check-circle</v-icon>
                                                    </template>
                                                    <v-list-item-title class="ml-n2">{{ feature }}</v-list-item-title>
                                                </v-list-item>
                                            </v-list>
                                            <v-btn :color="plan.color" block flat size="large" class="mt-4" @click="selectPlan(plan)" :loading="loadingPlan === plan.name">
                                                Choisir ce forfait
                                            </v-btn>
                                        </v-card-item>
                                    </v-card>
                                </v-col>
                            </v-row>
                        </v-card-item>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>