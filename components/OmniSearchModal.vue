<template>
  <SearchOmniSearchModal v-bind="$attrs" />
</template>

<script setup lang="ts">
import SearchOmniSearchModal from './search/OmniSearchModal.vue'

defineOptions({
  inheritAttrs: false
})
</script>
