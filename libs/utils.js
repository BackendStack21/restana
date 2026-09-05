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
 * Creates an isolated configuration snapshot. Plain objects and arrays are
 * recursively cloned and frozen; common mutable built-ins are cloned so
 * mutations to the snapshot cannot affect the live configuration.
 *
 * The original object is never mutated — safe to call on user-provided config.
 *
 * @param {Object} obj
 * @returns {Object} Deep-cloned, deeply frozen copy
 */
module.exports.deepFreezeObject = (value, seen = new WeakMap()) => {
  if (!value || typeof value !== 'object') return value
  if (seen.has(value)) return seen.get(value)

  if (Buffer.isBuffer(value)) return Buffer.from(value)
  if (value instanceof Date) return Object.freeze(new Date(value))
  if (value instanceof RegExp) return Object.freeze(new RegExp(value.source, value.flags))

  if (Array.isArray(value)) {
    const clone = []
    seen.set(value, clone)
    for (const item of value) clone.push(module.exports.deepFreezeObject(item, seen))
    return Object.freeze(clone)
  }

  if (value.constructor !== Object) return value

  const clone = {}
  seen.set(value, clone)
  for (const key of Object.keys(value)) {
    clone[key] = module.exports.deepFreezeObject(value[key], seen)
  }
  return Object.freeze(clone)
}
