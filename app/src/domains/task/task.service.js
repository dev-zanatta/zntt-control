import { TaskRepository } from 'src/infrastructure/http/task.repository'

export const TaskService = {
  getById: (id)        => TaskRepository.getById(id),
  create:  (data)      => TaskRepository.create(data),
  update:  (id, data)  => TaskRepository.update(id, data),
  move:    (taskId, t) => TaskRepository.move(taskId, t),
  delete:  (id)        => TaskRepository.delete(id),
  search:  (query)     => TaskRepository.search(query),

  createSubtask:    (data) => TaskRepository.createSubtask(data),
  toggleSubtask:    (id)   => TaskRepository.toggleSubtask(id),
  deleteSubtask:    (id)   => TaskRepository.deleteSubtask(id),

  addAttachment:    (taskId, file) => TaskRepository.addAttachment(taskId, file),
  deleteAttachment: (id)           => TaskRepository.deleteAttachment(id),
}
