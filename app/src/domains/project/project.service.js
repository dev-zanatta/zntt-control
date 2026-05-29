import { ProjectRepository } from 'src/infrastructure/http/project.repository'

export const ProjectService = {
  getAll:       () => ProjectRepository.getAll(),
  getById:      (id) => ProjectRepository.getById(id),
  update:       (id, data) => ProjectRepository.update(id, data),
  updateStatus: (id, status) => ProjectRepository.updateStatus(id, status),
  delete:       (id) => ProjectRepository.delete(id),

  async create({ name, color, category_id, logoPath }) {
    const project = await ProjectRepository.create({ name, color, category_id })
    if (logoPath) {
      await ProjectRepository.saveLogo(project.id, logoPath)
      return { ...project, logo_path: `attachments/projects/${project.id}/logo` }
    }
    return project
  },

  async updateWithLogo(id, data, newLogoPath) {
    if (newLogoPath) await ProjectRepository.saveLogo(id, newLogoPath)
    return ProjectRepository.update(id, data)
  },
}
