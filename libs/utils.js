'use strict'

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
