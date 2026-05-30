import { ProjectRepository } from 'src/infrastructure/http/project.repository'

export const ProjectService = {
  getAll:       () => ProjectRepository.getAll(),
  getById:      (id) => ProjectRepository.getById(id),
  update:       (id, data) => ProjectRepository.update(id, data),
  updateStatus: (id, status) => ProjectRepository.updateStatus(id, status),
  delete:       (id) => ProjectRepository.delete(id),

  async create({ name, color, category_id, logoFile, columns }) {
    const project = await ProjectRepository.create({ name, color, category_id, columns })
    if (logoFile) await ProjectRepository.saveLogo(project.id, logoFile)
    return project
  },

  async updateWithLogo(id, data, newLogoFile) {
    if (newLogoFile) await ProjectRepository.saveLogo(id, newLogoFile)
    return ProjectRepository.update(id, data)
  },

  // ── Compartilhamento ─────────────────────────────────────────

  getInviteCode:     (id) => ProjectRepository.getInviteCode(id),
  refreshInviteCode: (id) => ProjectRepository.refreshInviteCode(id),
  join:              (code) => ProjectRepository.join(code),
  getMembers:        (id) => ProjectRepository.getMembers(id),
  acceptMember:      (id, userId) => ProjectRepository.acceptMember(id, userId),
  rejectMember:      (id, userId) => ProjectRepository.rejectMember(id, userId),
  removeMember:      (id, userId) => ProjectRepository.removeMember(id, userId),
}
