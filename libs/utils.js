'use strict'

/**
 * Coerces a value into a valid HTTP status code.
 * Returns the fallback when the value is not an integer in the 100-999 range,
 * preventing `RangeError: Invalid status code` crashes on res.statusCode.
 *
 * @param {*} code
 * @param {number} [fallback=500]
 * @returns {number}
 */
module.exports.toHttpStatusCode = (code, fallback = 500) => {
  return Number.isInteger(code) && code >= 100 && code <= 999 ? code : fallback
}

module.exports.forEachObject = (obj, cb) => {
  const keys = Object.keys(obj)
  const length = keys.length

  for (let i = 0; i < length; i++) {
    cb(obj[keys[i]], keys[i])
  }
}

/**
 * Deep-clones a serializable plain object, then recursively freezes
 * the clone and all nested plain objects. Skips arrays, Buffers,
 * class instances, and other non-plain types.
 *
 * The original object is never mutated — safe to call on user-provided config.
 *
 * @param {Object} obj
 * @returns {Object} Deep-cloned, deeply frozen copy
 */
module.exports.deepFreezeObject = (obj) => {
  // Pass through non-plain values (functions, arrays, primitives, etc.)
  if (!obj || typeof obj !== 'object' || obj.constructor !== Object) {
    return obj
  }

  const clone = JSON.parse(JSON.stringify(obj))

  function freeze (val) {
    if (val && typeof val === 'object' && val.constructor === Object && !Object.isFrozen(val)) {
      Object.freeze(val)
      for (const key of Object.keys(val)) {
        freeze(val[key])
      }
    }
    return val
  }

  return freeze(clone)
}
