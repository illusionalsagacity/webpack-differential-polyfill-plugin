
'use strict'

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./webpack-differential-polyfill-plugin.cjs.production.min.js')
} else {
  module.exports = require('./webpack-differential-polyfill-plugin.cjs.development.js')
}
