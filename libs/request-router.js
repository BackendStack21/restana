/**
 * find-my-way router factory
 *
 * @see https://github.com/delvedor/find-my-way
 */
const router = require('find-my-way')

module.exports = (options) => router({
  ignoreTrailingSlash: options.ignoreTrailingSlash || false,
  allowUnsafeRegex: options.allowUnsafeRegex || false,
  maxParamLength: options.maxParamLength || 100,
  defaultRoute: options.defaultRoute || ((req, res) => res.send(404))
})
