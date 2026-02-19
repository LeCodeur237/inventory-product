<script setup lang="ts">
import { computed } from 'vue';
import { useTheme } from 'vuetify';
import Logo from '@/layouts/full/logo/Logo.vue';
/* Login form */
import LoginForm from '@/components/auth/LoginForm.vue';
// Icons
import { SunIcon, MoonIcon } from 'vue-tabler-icons';

// Theme
const theme = useTheme();
const isDarkTheme = computed(() => theme.global.name.value === 'dark');

const toggleTheme = () => {
    theme.global.name.value = isDarkTheme.value ? 'light' : 'dark';
};
</script>
<template>
    <div class="authentication">
        <v-container fluid class="pa-3">
            <v-btn icon variant="text" class="custom-hover-primary text-muted" style="position: absolute; top: 20px; right: 20px;" @click="toggleTheme">
                <SunIcon v-if="isDarkTheme" stroke-width="1.5" size="22" />
                <MoonIcon v-else stroke-width="1.5" size="22" />
            </v-btn>
            <v-row class="h-100vh d-flex justify-center align-center">
                <v-col cols="12" lg="4" xl="3" class="d-flex align-center">
                    <v-card rounded="md" elevation="10" class="px-sm-1 px-0 withbg mx-auto" max-width="500">
                        <v-card-item class="pa-sm-8">
                            <div class="d-flex justify-center py-4">
                                <Logo />
                            </div>
                            <LoginForm />
                            <div class="mt-4 text-center">
                                <div class="d-flex flex-column flex-sm-row justify-center align-center ga-1 ga-sm-2 text-body-2 text-sm-body-1 text-muted font-weight-medium">
                                    <span>New to use Inventory Pro?</span>
                                    <RouterLink to="/auth/register" class="text-primary text-decoration-none font-weight-medium">
                                        Create an account
                                    </RouterLink>
                                </div>
                                <div class="d-flex flex-column flex-sm-row justify-center align-center ga-1 ga-sm-2 text-body-2 text-sm-body-1 text-muted font-weight-medium mt-2">
                                    <span>Entreprise déjà créée ?</span>
                                    <RouterLink to="/auth/verify-company" class="text-primary text-decoration-none font-weight-medium">
                                        Créer un compte admin
                                    </RouterLink>
                                </div>
                            </div>
                        </v-card-item>
                    </v-card>
                </v-col>
            </v-row>
        </v-container>
    </div>
</template>
