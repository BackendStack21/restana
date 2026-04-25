module.exports.forEachObject = (obj, cb) => {
  const keys = Object.keys(obj)
  const length = keys.length

  for (let i = 0; i < length; i++) {
    cb(obj[keys[i]], keys[i])
  }
}

/**
 * Creates a deep clone of a serializable plain object.
 * Uses JSON.parse/stringify for a clean, immutable copy.
 * Skips non-serializable values (functions, symbols, undefined).
 *
 * @param {Object} obj
 * @returns {Object}
 */
module.exports.deepObjectClone = (obj) => {
  return JSON.parse(JSON.stringify(obj))
}
