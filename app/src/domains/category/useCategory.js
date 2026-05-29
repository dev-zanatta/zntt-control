import { ref } from 'vue'
import { CategoryService } from './category.service'

export function useCategory() {
  const categories = ref([])
  const loading    = ref(false)

  async function fetchCategories() {
    loading.value = true
    try {
      categories.value = await CategoryService.getAll()
    } finally {
      loading.value = false
    }
  }

  async function createCategory(name) {
    const cat = await CategoryService.create(name)
    categories.value.push({ ...cat, project_count: 0 })
    return cat
  }

  async function updateCategory(id, name) {
    await CategoryService.update(id, name)
    const cat = categories.value.find((c) => c.id === id)
    if (cat) cat.name = name
  }

  async function deleteCategory(category) {
    await CategoryService.delete(category)
    categories.value = categories.value.filter((c) => c.id !== category.id)
  }

  function findOrCreateCategory(name, existingList) {
    return CategoryService.findOrCreate(name, existingList ?? categories.value)
  }

  return {
    categories,
    loading,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    findOrCreateCategory,
  }
}
