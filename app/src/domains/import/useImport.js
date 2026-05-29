import { ref, computed } from 'vue'
import { ImportService } from './import.service'

export function useImport() {
  const filePath    = ref(null)
  const parsing     = ref(false)
  const parseError  = ref('')
  const preview     = ref(null)
  const importing   = ref(false)
  const importError = ref('')
  const result      = ref(null)

  const fileBasename = computed(() => {
    if (!filePath.value) return ''
    return filePath.value.replace(/\\/g, '/').split('/').pop()
  })

  async function selectFile() {
    parseError.value = ''
    const path = await ImportService.selectFile()
    if (path) filePath.value = path
    return path
  }

  async function parseFile() {
    if (!filePath.value) return null
    parsing.value    = true
    parseError.value = ''
    try {
      preview.value = await ImportService.parseTrello(filePath.value)
      return preview.value
    } catch (e) {
      parseError.value = e?.message || 'Erro ao ler o arquivo. Verifique se é um export válido do Trello.'
      return null
    } finally {
      parsing.value = false
    }
  }

  async function runImport(params) {
    importing.value   = true
    importError.value = ''
    try {
      result.value = await ImportService.runTrelloImport(params)
      return result.value
    } catch (e) {
      importError.value = e?.message || 'Erro durante a importação. Tente novamente.'
      throw e
    } finally {
      importing.value = false
    }
  }

  return {
    filePath,
    fileBasename,
    parsing,
    parseError,
    preview,
    importing,
    importError,
    result,
    selectFile,
    parseFile,
    runImport,
  }
}
