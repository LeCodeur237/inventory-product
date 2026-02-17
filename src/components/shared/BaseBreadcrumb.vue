<script setup lang="ts">


interface Breadcrumb {
    title: string;
    disabled: boolean;
    href: string;
}

defineProps({
    title: {
        type: String,
        required: true,
    },
    breadcrumbs: {
        type: Array as () => Breadcrumb[],
        required: true,
    },
});
</script>

<template>
    <v-card class="mb-6" variant="tonal" elevation="0">
        <v-card-text>
            <v-row align="center">
                <v-col>
                    <h3 class="text-h4">{{ title }}</h3>
                </v-col>
                <v-col class="d-none d-sm-block text-right">
                    <v-breadcrumbs :items="breadcrumbs" class="justify-end pa-0">
                        <template v-slot:divider>
                            <v-icon>mdi-chevron-right</v-icon>
                        </template>
                    </v-breadcrumbs>
                </v-col>
            </v-row>
        </v-card-text>
    </v-card>
</template>