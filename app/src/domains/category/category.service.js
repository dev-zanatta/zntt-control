import { CategoryRepository } from 'src/infrastructure/http/category.repository'
import { Category } from './category.entity'

export const CategoryService = {
  getAll: () => CategoryRepository.getAll(),
  create: (name) => CategoryRepository.create(name),
  update: (id, name) => CategoryRepository.update(id, name),

  async delete(category) {
    if (!Category.canDelete(category)) {
      throw new Error(
        `"${category.name}" is assigned to ${category.project_count} project(s). Reassign or delete those projects first.`
      )
    }
    await CategoryRepository.delete(category.id)
  },

  async findOrCreate(name, existingCategories) {
    const match = existingCategories.find(
      (c) => c.name.toLowerCase() === name.toLowerCase()
    )
    if (match) return match
    return CategoryRepository.create(name)
  },
}
