'use strict'

/**
 * Supported HTTP methods
 */
const BASE_METHODS = ['get', 'delete', 'patch', 'post', 'put', 'head', 'options', 'all']
const TRACE_METHOD = 'trace'

module.exports = (options = {}) => {
  const methods = [...BASE_METHODS]
  if (options.enableTrace) {
    methods.push(TRACE_METHOD)
  }
  return methods
}

module.exports.BASE = BASE_METHODS
module.exports.TRACE = TRACE_METHOD
