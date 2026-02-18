<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axiosInstance from '@/utils/axios';
import { useToast } from 'vue-toastification';

const toast = useToast();
const page = ref({ title: 'Bilan et Valorisation des Stocks' });
const breadcrumbs = ref([
    { title: 'Rapports', disabled: false, href: '#' },
    { title: 'Valorisation', disabled: true, href: '#' }
]);

const loading = ref(true);
const stockData = ref<any[]>([]);
const search = ref('');
const currentUser = ref<any>(null);
const profils = ref<any[]>([]);

const headers = [
    { title: 'Produit', key: 'nom', align: 'start' as const, sortable: true },
    { title: 'Qté Entrée', key: 'total_qte_entree', align: 'end' as const },
    { title: 'Valeur Entrée', key: 'total_valeur_entree', align: 'end' as const },
    { title: 'Qté Sortie', key: 'total_qte_sortie', align: 'end' as const },
    { title: 'Valeur Sortie (Est.)', key: 'total_valeur_sortie', align: 'end' as const },
    { title: 'Qté Restante', key: 'stock_actuel', align: 'end' as const },
    { title: 'Valeur Restante', key: 'valeur_stock', align: 'end' as const },
];

const fetchData = async () => {
    loading.value = true;
    try {
        // Récupération de toutes les données nécessaires
        const [productsRes, entriesRes, exitsRes] = await Promise.all([
            axiosInstance.get('/products'),
            axiosInstance.get('/stock/entries'),
            axiosInstance.get('/stock/exits')
        ]);

        let products = productsRes.data;
        const entries = entriesRes.data;
        const exits = exitsRes.data;

        // Filtrage par agence/pôle
        const profileId = currentUser.value?.id_profil || currentUser.value?.profil_id || currentUser.value?.profil?.id_profil;
        const userProfile = profils.value.find(p => p.id_profil === profileId);
        const role = userProfile?.nom?.toLowerCase();

        if (role && !['direction', 'contrôle', 'controle'].some(r => role.includes(r))) {
            const userAgence = currentUser.value?.agence;
            const userPoleId = currentUser.value?.id_pole || currentUser.value?.pole_id || currentUser.value?.pole?.id_pole;

            if (userAgence || userPoleId) {
                products = products.filter((p: any) => {
                    const matchAgence = userAgence && p.agence === userAgence;
                    const matchPole = userPoleId && p.id_pole === userPoleId;
                    return matchAgence || matchPole;
                });
            }
        }

        // Calcul des agrégats par produit
        stockData.value = products.map((product: any) => {
            // Filtrer les mouvements pour ce produit
            const productEntries = entries.filter((e: any) => e.id_product === product.id_product);
            const productExits = exits.filter((s: any) => s.id_product === product.id_product);

            // Calculs Entrées
            const totalQteEntree = productEntries.reduce((sum: number, e: any) => sum + Number(e.quantite_entree), 0);
            const totalValeurEntree = productEntries.reduce((sum: number, e: any) => {
                const prixUnitaire = Number(e.prix_achat) || Number(product.prix) || 0;
                return sum + (Number(e.quantite_entree) * prixUnitaire);
            }, 0);
            
            // Calcul Prix Moyen Pondéré (PUMP) pour valoriser les sorties et le stock
            // Si pas d'entrée, on prend 0
            const pump = totalQteEntree > 0 ? totalValeurEntree / totalQteEntree : (Number(product.prix) || 0);

            // Calculs Sorties
            const totalQteSortie = productExits.reduce((sum: number, s: any) => sum + Number(s.quantite_sortie), 0);
            // On valorise les sorties au PUMP (estimation standard)
            const totalValeurSortie = totalQteSortie * pump;

            // Stock Actuel (Théorique calculé ou Réel de la table produit)
            // On utilise ici la valeur de la table produit qui est la référence
            const stockActuel = Number(product.quantite_stock);
            const valeurStock = stockActuel * pump;

            return {
                id: product.id_product,
                nom: product.nom,
                reference: product.reference,
                total_qte_entree: totalQteEntree,
                total_valeur_entree: totalValeurEntree,
                total_qte_sortie: totalQteSortie,
                total_valeur_sortie: totalValeurSortie,
                stock_actuel: stockActuel,
                valeur_stock: valeurStock,
                pump: pump
            };
        });

    } catch (error) {
        console.error(error);
        toast.error("Erreur lors du calcul de la valorisation.");
    } finally {
        loading.value = false;
    }
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(value);
};

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

const printPage = () => {
    window.print();
};

onMounted(async () => {
    await Promise.all([fetchCurrentUser(), fetchProfils()]);
    await fetchData();
});
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12">
            <UiParentCard title="Tableau de bord des stocks">
                <template v-slot:action>
                    <v-btn color="secondary" variant="outlined" prepend-icon="mdi-printer" @click="printPage">Imprimer / PDF</v-btn>
                </template>
                <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Rechercher un produit..." variant="outlined" density="compact" hide-details class="mb-4"></v-text-field>

                <v-data-table :headers="headers" :items="stockData" :search="search" :loading="loading" density="comfortable" hover>
                    <template v-slot:item.total_valeur_entree="{ item }">
                        <span class="text-success font-weight-medium">{{ formatCurrency(item.total_valeur_entree) }}</span>
                    </template>
                    <template v-slot:item.total_valeur_sortie="{ item }">
                        <span class="text-warning">{{ formatCurrency(item.total_valeur_sortie) }}</span>
                    </template>
                    <template v-slot:item.stock_actuel="{ item }">
                        <v-chip :color="item.stock_actuel > 0 ? 'primary' : 'error'" size="small" variant="flat">
                            {{ item.stock_actuel }}
                        </v-chip>
                    </template>
                    <template v-slot:item.valeur_stock="{ item }">
                        <span class="font-weight-bold">{{ formatCurrency(item.valeur_stock) }}</span>
                    </template>
                    
                    <!-- Ligne de totaux en bas de tableau (optionnel, via slot 'foot' si supporté ou calcul externe) -->
                </v-data-table>
            </UiParentCard>
        </v-col>
    </v-row>
</template>
