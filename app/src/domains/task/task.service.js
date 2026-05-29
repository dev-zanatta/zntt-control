import { TaskRepository } from 'src/infrastructure/http/task.repository'

export const TaskService = {
  getById: (id) => TaskRepository.getById(id),
  create:  (data) => TaskRepository.create(data),
  update:  (id, data) => TaskRepository.update(id, data),
  move:    (taskId, target) => TaskRepository.move(taskId, target),
  delete:  (id) => TaskRepository.delete(id),
  search:  (query) => TaskRepository.search(query),

  createSubtask:    (data) => TaskRepository.createSubtask(data),
  toggleSubtask:    (id) => TaskRepository.toggleSubtask(id),
  deleteSubtask:    (id) => TaskRepository.deleteSubtask(id),

  addAttachment:    (taskId, filePath) => TaskRepository.addAttachment(taskId, filePath),
  deleteAttachment: (id) => TaskRepository.deleteAttachment(id),
  openAttachment:   (id) => TaskRepository.openAttachment(id),
}
