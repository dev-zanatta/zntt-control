export const CategoryRepository = {
  /** @returns {Promise<Category[]>} */
  getAll: () => {},
  /** @param {string} name @returns {Promise<Category>} */
  create: (_name) => {},
  /** @param {number} id @param {string} name @returns {Promise<void>} */
  update: (_id, _name) => {},
  /** @param {number} id @returns {Promise<void>} */
  delete: (_id) => {},
}
