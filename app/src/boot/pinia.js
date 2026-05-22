import { createPinia } from 'pinia'

// Create ONE instance at module level.
// If Quasar's HMR re-runs this boot plugin (double-mount warning in Electron dev),
// the same pinia instance is reused — Vue silently ignores the duplicate app.use().
const pinia = createPinia()

export default ({ app }) => {
  app.use(pinia)
}
