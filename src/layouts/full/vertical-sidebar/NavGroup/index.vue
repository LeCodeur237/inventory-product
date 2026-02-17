<script setup>
const props = defineProps({ item: Object, index: Number });
</script>

<template>
    <v-list-subheader color="darkText" class="smallCap text-uppercase text-subtitle-2 font-weight-bold"
        :class="index > 0 ? 'mt-0' : ''">{{ props.item.header }}</v-list-subheader>
</template>
