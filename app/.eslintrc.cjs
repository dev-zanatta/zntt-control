/* eslint-env node */
module.exports = {
  root: true,
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  extends: ['plugin:vue/vue3-recommended', 'eslint:recommended', 'prettier'],
  plugins: ['vue'],
  rules: {
    'vue/multi-word-component-names': 'off',
  },
}
