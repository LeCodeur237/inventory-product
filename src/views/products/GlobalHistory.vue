<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import BaseBreadcrumb from '@/components/shared/BaseBreadcrumb.vue';
import UiParentCard from '@/components/shared/UiParentCard.vue';
import axiosInstance from '@/utils/axios';
import { useToast } from 'vue-toastification';
import { PrinterIcon } from 'vue-tabler-icons';

const toast = useToast();
const page = ref({ title: 'Historique Global des Opérations' });
const breadcrumbs = ref([
    { title: 'Rapports', disabled: false, href: '#' },
    { title: 'Historique Global', disabled: true, href: '#' }
]);

const loading = ref(true);
const movements = ref<any[]>([]);
const search = ref('');
const filterType = ref('ALL'); // ALL, ENTREE, SORTIE
const currentUser = ref<any>(null);
const company = ref<any>(null);
const profils = ref<any[]>([]);

const headers = [
    { title: 'Date', key: 'date', align: 'start' as const },
    { title: 'N° Ordre', key: 'num_ordre', align: 'start' as const },
    { title: 'Produit', key: 'product_name', align: 'start' as const },
    { title: 'Type', key: 'type', align: 'center' as const },
    { title: 'Quantité', key: 'quantite', align: 'end' as const },
    { title: 'Prix Unitaire', key: 'prix', align: 'end' as const },
    { title: 'Valeur Totale', key: 'valeur_totale', align: 'end' as const },
    { title: 'Tiers / Observation', key: 'tiers', align: 'start' as const },
    { title: 'Actions', key: 'actions', align: 'end' as const, sortable: false },
];

const fetchData = async () => {
    loading.value = true;
    try {
        // On récupère les entrées et les sorties en parallèle
        // Note: On suppose ici que ces endpoints existent et retournent toutes les données
        const [entriesRes, exitsRes, productsRes, usersRes, suppliersRes] = await Promise.all([
            axiosInstance.get('/stock/entries'),
            axiosInstance.get('/stock/exits'),
            axiosInstance.get('/products'),
            axiosInstance.get('/users'),
            axiosInstance.get('/fournisseurs')
        ]);

        const products = productsRes.data;
        const users = usersRes.data;
        const suppliers = suppliersRes.data;

        // Filtrage des produits selon le rôle/agence/pôle
        let allowedProductIds = new Set<string>();
        const profileId = currentUser.value?.id_profil || currentUser.value?.profil_id || currentUser.value?.profil?.id_profil;
        const userProfile = profils.value.find(p => p.id_profil === profileId);
        const role = userProfile?.nom?.toLowerCase();
        let isRestricted = false;

        if (role && !['direction', 'contrôle', 'controle'].some(r => role.includes(r))) {
            const userAgence = currentUser.value?.agence;
            const userPoleId = currentUser.value?.id_pole || currentUser.value?.pole_id || currentUser.value?.pole?.id_pole;

            if (userAgence || userPoleId) {
                isRestricted = true;
                products.forEach((p: any) => {
                    const matchAgence = userAgence && p.agence === userAgence;
                    const matchPole = userPoleId && p.id_pole === userPoleId;
                    if (matchAgence || matchPole) {
                        allowedProductIds.add(p.id_product);
                    }
                });
            }
        }

        const getProductName = (id: string) => {
            const p = products.find((x: any) => x.id_product === id);
            return p ? p.nom : 'Inconnu';
        };
        const getProductPrice = (id: string) => {
            const p = products.find((x: any) => x.id_product === id);
            return p ? Number(p.prix) : 0;
        };
        const getUserName = (id: string) => {
            const u = users.find((x: any) => x.id_users === id);
            return u ? u.name : 'Utilisateur inconnu';
        };
        const getSupplierName = (id: string) => {
            const s = suppliers.find((x: any) => x.id_fournisseur === id);
            return s ? s.nom : id || 'Fournisseur inconnu';
        };

        // Normalisation des entrées
        const entriesData = isRestricted ? entriesRes.data.filter((e: any) => allowedProductIds.has(e.id_product)) : entriesRes.data;
        const entries = entriesData.map((e: any) => {
            const prixUnitaire = Number(e.prix_achat) || getProductPrice(e.id_product) || 0;
            return {
                id: `IN-${e.id_entrees_stocks}`,
                num_ordre: e.num_ordre || '-',
                date: new Date(e.date_reception),
                product_name: e.product ? e.product.nom : getProductName(e.id_product),
                type: 'ENTREE',
                quantite: e.quantite_entree,
                prix: prixUnitaire,
                valeur_totale: (e.quantite_entree * prixUnitaire),
                tiers: getSupplierName(e.fournisseur || e.id_fournisseur)
            };
        });

        // Normalisation des sorties
        const exitsData = isRestricted ? exitsRes.data.filter((s: any) => allowedProductIds.has(s.id_product)) : exitsRes.data;
        const exits = exitsData.map((s: any) => {
            const prixUnitaire = getProductPrice(s.id_product) || 0;
            return {
                id: `OUT-${s.id_sortie_stock}`,
                num_ordre: s.num_ordre || '-',
                date: new Date(s.date_sortie),
                product_name: s.product ? s.product.nom : getProductName(s.id_product),
                type: 'SORTIE',
                quantite: s.quantite_sortie,
                prix: prixUnitaire,
                valeur_totale: (s.quantite_sortie * prixUnitaire),
                tiers: s.user ? s.user.name : (s.id_users ? getUserName(s.id_users) : 'Sortie de stock')
            };
        });

        // Fusion et tri par date décroissante
        movements.value = [...entries, ...exits].sort((a, b) => b.date.getTime() - a.date.getTime());

    } catch (error) {
        console.error(error);
        toast.error("Erreur lors du chargement de l'historique.");
    } finally {
        loading.value = false;
    }
};

const fetchCurrentUser = async () => {
    try {
        const response = await axiosInstance.get('/user');
        currentUser.value = response.data;
    } catch (error) {
        console.error("Erreur chargement utilisateur", error);
    }
};

const fetchCompany = async () => {
    if (currentUser.value && currentUser.value.id_entreprise) {
        try {
            const response = await axiosInstance.get(`/entreprises/${currentUser.value.id_entreprise}`);
            company.value = response.data;
        } catch (error) {
            console.error("Erreur chargement entreprise", error);
        }
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

const getImageUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:')) return path;
    return `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}${path}`;
};

const filteredMovements = computed(() => {
    let data = movements.value;

    if (filterType.value !== 'ALL') {
        data = data.filter(m => m.type === filterType.value);
    }

    if (search.value) {
        const s = search.value.toLowerCase();
        data = data.filter(m => 
            m.product_name.toLowerCase().includes(s) || 
            m.tiers.toLowerCase().includes(s)
        );
    }

    return data;
});

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF' }).format(value);
};

const printMovement = (item: any) => {
    // Récupérer tous les produits liés au même numéro d'ordre
    let itemsToPrint = [item];
    if (item.num_ordre && item.num_ordre !== '-') {
        itemsToPrint = movements.value.filter(m => m.num_ordre === item.num_ordre && m.type === item.type);
    }
    const totalDocumentValue = itemsToPrint.reduce((sum, curr) => sum + curr.valeur_totale, 0);

    const isEntry = item.type === 'ENTREE';
    const title = isEntry ? 'BON DE RÉCEPTION' : 'BON DE SORTIE';
    const tiersLabel = isEntry ? 'Fournisseur' : 'Bénéficiaire';
    const color = isEntry ? '#4caf50' : '#ff9800';
    const logoUrl = company.value && company.value.logo ? getImageUrl(company.value.logo) : '';

    const rowsHtml = itemsToPrint.map(line => `
        <tr>
            <td style="padding: 12px; border: 1px solid #ddd;">${line.product_name}</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${line.quantite}</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${formatCurrency(line.prix)}</td>
            <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${formatCurrency(line.valeur_totale)}</td>
        </tr>
    `).join('');

    const content = `
        <div style="font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; border: 1px solid #eee;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 40px; border-bottom: 2px solid ${color}; padding-bottom: 20px;">
                <div>
                    ${logoUrl ? `<img src="${logoUrl}" style="max-height: 80px; max-width: 200px;" />` : ''}
                </div>
                <div style="text-align: right;">
                    <h1 style="margin: 0; color: ${color}; font-size: 24px;">${title}</h1>
                    <p style="margin: 5px 0; color: #666;">#${item.num_ordre}</p>
                    <p style="margin: 5px 0;">Date : ${item.date.toLocaleDateString()}</p>
                </div>
            </div>

            <div style="margin-bottom: 30px; background: #f9f9f9; padding: 20px; border-radius: 4px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                    <strong>${tiersLabel} :</strong>
                    <span>${item.tiers}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <strong>Type de mouvement :</strong>
                    <span>${item.type}</span>
                </div>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">Désignation</th>
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Quantité</th>
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Prix Unitaire</th>
                        <th style="padding: 12px; border: 1px solid #ddd; text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${rowsHtml}
                    <tr style="background-color: #f9f9f9; font-weight: bold;">
                        <td colspan="3" style="padding: 12px; border: 1px solid #ddd; text-align: right;">TOTAL GÉNÉRAL</td>
                        <td style="padding: 12px; border: 1px solid #ddd; text-align: right;">${formatCurrency(totalDocumentValue)}</td>
                    </tr>
                </tbody>
            </table>

            <div style="margin-top: 50px; display: flex; justify-content: space-between;">
                <div style="text-align: center;">
                    <p><strong>Signature Directeur Général</strong></p>
                    <div style="height: 60px;"></div>
                </div>
                <div style="text-align: center;">
                    <p><strong>Signature ${tiersLabel}</strong></p>
                    <div style="height: 60px;"></div>
                </div>
            </div>
            
            <div style="margin-top: 30px; font-size: 12px; color: #999; text-align: center;">
                Imprimé le ${new Date().toLocaleString()}
            </div>
        </div>
    `;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (printWindow) {
        printWindow.document.write(`<html><head><title>${title} - ${item.id}</title></head><body>${content}</body></html>`);
        printWindow.document.close();
        setTimeout(() => {
            printWindow.print();
        }, 500);
    }
};

onMounted(async () => {
    await fetchCurrentUser();
    await Promise.all([fetchCompany(), fetchProfils()]);
    await fetchData();
});
</script>

<template>
    <BaseBreadcrumb :title="page.title" :breadcrumbs="breadcrumbs"></BaseBreadcrumb>
    <v-row>
        <v-col cols="12">
            <UiParentCard title="Mouvements de stock">
                <template v-slot:action>
                    <div class="d-flex gap-2 align-center">
                        <v-btn-toggle v-model="filterType" mandatory density="compact" color="primary" variant="outlined">
                            <v-btn value="ALL">Tout</v-btn>
                            <v-btn value="ENTREE">Entrées</v-btn>
                            <v-btn value="SORTIE">Sorties</v-btn>
                        </v-btn-toggle>
                    </div>
                </template>

                <v-text-field v-model="search" prepend-inner-icon="mdi-magnify" label="Rechercher un produit ou un tiers..." variant="outlined" density="compact" hide-details class="mb-4"></v-text-field>

                <v-data-table :headers="headers" :items="filteredMovements" :loading="loading" density="comfortable" hover>
                    <template v-slot:item.date="{ item }">
                        {{ item.date.toLocaleDateString() }}
                    </template>
                    <template v-slot:item.type="{ item }">
                        <v-chip :color="item.type === 'ENTREE' ? 'success' : 'warning'" size="small" label>
                            {{ item.type }}
                        </v-chip>
                    </template>
                    <template v-slot:item.prix="{ item }">
                        {{ formatCurrency(item.prix) }}
                    </template>
                    <template v-slot:item.valeur_totale="{ item }">
                        {{ formatCurrency(item.valeur_totale) }}
                    </template>
                    <template v-slot:item.actions="{ item }">
                        <v-btn icon variant="text" color="secondary" size="small" title="Imprimer le bon" @click="printMovement(item)">
                            <PrinterIcon size="20" />
                        </v-btn>
                    </template>
                </v-data-table>
            </UiParentCard>
        </v-col>
    </v-row>
</template>