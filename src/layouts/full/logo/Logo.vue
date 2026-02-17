<script setup>
import { computed } from "vue";
import { useTheme } from "vuetify";
import LogoDark from "./LogoDark.vue";
import LogoLight from "./LogoLight.vue";

const theme = useTheme();
const isDarkTheme = computed(() => theme.global.name.value === 'dark');
</script>
<template>
  <LogoDark v-if="isDarkTheme" />
  <LogoLight v-else />
</template>
