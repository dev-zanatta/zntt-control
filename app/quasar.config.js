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
        win: {
          target: [{ target: 'nsis', arch: ['x64'] }],
          icon: 'src-electron/icons/icon.ico',
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
