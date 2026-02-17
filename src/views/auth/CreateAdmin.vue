<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Logo from '@/layouts/full/logo/Logo.vue';
import CreateAdminForm from '@/components/auth/CreateAdminForm.vue';
</script>

<template>
    <div class="authentication">
        <v-container fluid class="pa-3">
            <v-row class="h-100vh d-flex justify-center align-center">
                <v-col cols="12" lg="4" xl="3" class="d-flex align-center">
                    <v-card rounded="md" elevation="10" class="px-sm-1 px-0 withbg mx-auto" max-width="500">
                        <v-card-item class="pa-sm-8">
                            <div class="d-flex justify-center py-4">
                                <Logo />
                            </div>
                            <div class="text-center">
                                <h2 class="text-h4 font-weight-bold">Créer le compte Administrateur</h2>
                                <p class="text-muted mt-2">Ce compte sera utilisé pour gérer votre entreprise.</p>
                            </div>
                            <CreateAdminForm />
                        </v-card-item>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>