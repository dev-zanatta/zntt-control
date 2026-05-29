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
  }
})
