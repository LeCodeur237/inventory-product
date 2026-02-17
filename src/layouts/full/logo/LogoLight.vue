<script setup lang="ts">
import { ref } from 'vue';
import { RouterLink } from 'vue-router';
const primary = ref('rgb(var(--v-theme-primary))');
const secondary = ref('rgb(var(--v-theme-secondary))');
</script>
<template>
    <div class="logo">
        <RouterLink to="/">
            <svg width="250" height="100" viewBox="0 0 360 100" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="gradMain" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#0F4C81" />
                        <stop offset="100%" stop-color="#00B4D8" />
                    </linearGradient>

                    <linearGradient id="gradAccent" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stop-color="#2ECC71" />
                        <stop offset="100%" stop-color="#27AE60" />
                    </linearGradient>
                </defs>

                <!-- Icône -->
                <g transform="translate(20,20)">
                    <!-- Cube -->
                    <rect x="10" y="10" width="60" height="60" rx="8" fill="url(#gradMain)" />

                    <!-- Flèche sortie stock -->
                    <path d="M25 40 H50 L45 35 M50 40 L45 45" stroke="#FFFFFF" stroke-width="3" fill="none"
                        stroke-linecap="round" stroke-linejoin="round" />

                    <!-- Points IA -->
                    <circle cx="25" cy="55" r="2.5" fill="#2ECC71" />
                    <circle cx="35" cy="60" r="2.5" fill="#2ECC71" />
                    <circle cx="45" cy="55" r="2.5" fill="#2ECC71" />

                    <line x1="25" y1="55" x2="35" y2="60" stroke="#2ECC71" stroke-width="1.5" />
                    <line x1="35" y1="60" x2="45" y2="55" stroke="#2ECC71" stroke-width="1.5" />
                </g>

                <!-- Texte -->
                <text x="110" y="58" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="32" font-weight="700"
                    fill="#0F4C81">
                    Inventory
                </text>

                <text x="265" y="58" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="32" font-weight="700"
                    fill="url(#gradAccent)">
                    Pro
                </text>

                <!-- Slogan -->
                <text x="112" y="82" font-family="Segoe UI, Roboto, Arial, sans-serif" font-size="12" fill="#6C757D">
                    Gestion intelligente des stocks par IA
                </text>
            </svg>
        </RouterLink>
    </div>
</template>
