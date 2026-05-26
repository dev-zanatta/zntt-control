/* eslint-env node */

const { configure } = require('quasar/wrappers')

module.exports = configure(function (/* ctx */) {
  return {
    boot: ['pinia'],

    css: ['app.scss'],

    extras: ['material-icons'],

    build: {
      target: {
        browser: ['es2019', 'edge88', 'firefox78', 'chrome87', 'safari13.1'],
        node: 'node20',
      },
      vueRouterMode: 'hash',
    },

    devServer: {
      open: false,
    },

    framework: {
      config: {},
      plugins: ['Notify', 'Dialog', 'Loading'],
    },

    animations: [],

    electron: {
      inspectPort: 5858,
      bundler: 'builder',
      builder: {
        appId: 'com.zntt.control',
        productName: 'zntt-control',
        copyright: 'Personal use',
        npmRebuild: false,
        asarUnpack: ['**/*.node'],
        afterPack: async (context) => {
          const path = require('path')
          const { rcedit } = require('rcedit')
          const exePath = path.join(context.appOutDir, 'zntt-control.exe')
          const icoPath = path.join(__dirname, 'src-electron/icons/icon.ico')
          await rcedit(exePath, { icon: icoPath })
        },
        win: {
          target: [{ target: 'nsis', arch: ['x64'] }],
          icon: 'src-electron/icons/icon.ico',
          signAndEditExecutable: false,
        },
        nsis: {
          oneClick: false,
          perMachine: false,
          allowToChangeInstallationDirectory: true,
          createDesktopShortcut: true,
          createStartMenuShortcut: true,
          shortcutName: 'zntt-control',
        },
      },
    },
  }
})
