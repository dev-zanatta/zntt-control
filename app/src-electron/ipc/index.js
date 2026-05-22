const { registerProjectsHandlers } = require('./projectsHandlers')
const { registerColumnsHandlers } = require('./columnsHandlers')
const { registerTasksHandlers } = require('./tasksHandlers')
const { registerSubtasksHandlers } = require('./subtasksHandlers')
const { registerAttachmentsHandlers } = require('./attachmentsHandlers')
const { registerSettingsHandlers } = require('./settingsHandlers')
const { registerCategoriesHandlers } = require('./categoriesHandlers')
const { registerAppHandlers } = require('./appHandlers')
const { registerImportHandlers } = require('./importHandlers')

function registerAllHandlers() {
  registerProjectsHandlers()
  registerColumnsHandlers()
  registerTasksHandlers()
  registerSubtasksHandlers()
  registerAttachmentsHandlers()
  registerSettingsHandlers()
  registerCategoriesHandlers()
  registerAppHandlers()
  registerImportHandlers()
}

module.exports = { registerAllHandlers }
