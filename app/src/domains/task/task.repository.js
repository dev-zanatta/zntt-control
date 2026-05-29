export const TaskRepository = {
  /** @param {number} id @returns {Promise<Task>} full task with subtasks + attachments */
  getById: (_id) => {},
  /** @param {object} data @returns {Promise<Task>} */
  create: (_data) => {},
  /** @param {number} id @param {object} data @returns {Promise<Task>} */
  update: (_id, _data) => {},
  /** @param {number} taskId @param {{newColumnId:number,newPosition:number}} target @returns {Promise<void>} */
  move: (_taskId, _target) => {},
  /** @param {number} id @returns {Promise<void>} */
  delete: (_id) => {},
  /** @param {string} query @returns {Promise<Task[]>} */
  search: (_query) => {},
  /** @param {{task_id:number,title:string}} data @returns {Promise<Subtask>} */
  createSubtask: (_data) => {},
  /** @param {number} id @returns {Promise<Subtask>} */
  toggleSubtask: (_id) => {},
  /** @param {number} id @returns {Promise<void>} */
  deleteSubtask: (_id) => {},
  /** @param {number} taskId @param {string} filePath @returns {Promise<Attachment>} */
  addAttachment: (_taskId, _filePath) => {},
  /** @param {number} id @returns {Promise<void>} */
  deleteAttachment: (_id) => {},
  /** @param {number} id @returns {Promise<void>} */
  openAttachment: (_id) => {},
}
