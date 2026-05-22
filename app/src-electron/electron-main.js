const { app, BrowserWindow, protocol } = require('electron')
const path = require('path')
const fs = require('fs')
const { runMigrations } = require('./database/migrations')
const { registerAllHandlers } = require('./ipc/index')

let mainWindow

// ── Generate app icon on first launch (uses Chromium to render SVG → PNG) ──
async function ensureIcon() {
  const iconPath = path.join(__dirname, 'icons', 'icon.png')
  if (fs.existsSync(iconPath)) return iconPath

  const html = `<!DOCTYPE html><html><head>
    <style>*{margin:0;padding:0;box-sizing:border-box;}html,body{width:256px;height:256px;overflow:hidden;background:#0d0d0d;}</style>
    </head><body>
    <svg width="256" height="256" viewBox="0 0 256 256" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="256" height="256" rx="48" fill="#0d0d0d"/>
      <defs>
        <linearGradient id="g" x1="48" y1="48" x2="208" y2="208" gradientUnits="userSpaceOnUse">
          <stop stop-color="#4dabf7"/>
          <stop offset="1" stop-color="#7c6af7"/>
        </linearGradient>
      </defs>
      <polyline points="54,72 202,72 54,184 202,184"
        stroke="url(#g)" stroke-width="26" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
    </svg>
    </body></html>`

  return new Promise((resolve) => {
    const win = new BrowserWindow({
      width: 256,
      height: 256,
      show: false,
      frame: false,
      webPreferences: { contextIsolation: true },
    })

    win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html))

    win.webContents.once('did-finish-load', () => {
      // Small delay so Chromium finishes painting
      setTimeout(() => {
        win.webContents.capturePage().then(img => {
          try {
            fs.mkdirSync(path.dirname(iconPath), { recursive: true })
            fs.writeFileSync(iconPath, img.toPNG())
            console.log('[zntt] icon.png generated at', iconPath)
          } catch (e) {
            console.error('[zntt] Failed to write icon.png:', e)
          }
          win.destroy()
          resolve(iconPath)
        }).catch((e) => {
          console.error('[zntt] capturePage failed:', e)
          win.destroy()
          resolve(null)
        })
      }, 200)
    })
  })
}

function createWindow() {
  const iconPath = path.join(__dirname, 'icons', 'icon.png')

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: false,
    thickFrame: true,
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#0d0d0d',
    show: false,
  })

  mainWindow.loadURL(process.env.APP_URL)

  if (process.env.DEBUGGING) {
    mainWindow.webContents.openDevTools()
  }

  mainWindow.once('ready-to-show', () => mainWindow.show())

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Push maximize state to renderer so titlebar button updates
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('win:maximizeChange', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('win:maximizeChange', false)
  })
}

app.whenReady().then(async () => {
  // Serve files from userData via zntt-userdata://<relative-path>
  protocol.registerFileProtocol('zntt-userdata', (request, callback) => {
    const relativePath = decodeURIComponent(request.url.replace('zntt-userdata://', ''))
    callback({ path: path.join(app.getPath('userData'), relativePath) })
  })

  runMigrations()
  registerAllHandlers()
  await ensureIcon()   // generate icon.png if missing (first launch)
  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})
