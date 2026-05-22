/* eslint-env node */
module.exports = {
  plugins: [
    require('autoprefixer')({
      overrideBrowserslist: [
        'last 4 Chrome versions',
        'last 4 Firefox versions',
        'last 4 Edge versions',
        'last 4 Safari versions',
        'last 4 iOS versions',
      ],
    }),
  ],
}
