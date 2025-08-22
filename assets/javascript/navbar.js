const open = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { open.value = false })