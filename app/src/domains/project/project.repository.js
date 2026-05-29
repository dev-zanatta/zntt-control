export const ProjectRepository = {
  /** @returns {Promise<Project[]>} */
  getAll: () => {},
  /** @param {number} id @returns {Promise<Project>} */
  getById: (_id) => {},
  /** @param {object} data @returns {Promise<Project>} */
  create: (_data) => {},
  /** @param {number} id @param {object} data @returns {Promise<Project>} */
  update: (_id, _data) => {},
  /** @param {number} id @param {string} status @returns {Promise<Project>} */
  updateStatus: (_id, _status) => {},
  /** @param {number} id @returns {Promise<void>} */
  delete: (_id) => {},
  /** @param {number} projectId @param {string} logoPath @returns {Promise<void>} */
  saveLogo: (_projectId, _logoPath) => {},
}
