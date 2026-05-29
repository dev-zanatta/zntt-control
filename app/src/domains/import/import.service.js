import { ImportRepository } from 'src/infrastructure/http/import.repository'

export const ImportService = {
  selectFile:      () => ImportRepository.selectFile(),
  parseTrello:     (filePath) => ImportRepository.parseTrello(filePath),
  runTrelloImport: (params) => ImportRepository.runTrelloImport(params),
}
