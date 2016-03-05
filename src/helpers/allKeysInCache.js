'use strict'

module.exports = function (keys) {
  return (state) => {
    for (let i = 0; i < keys.size; i++) {
      if (!state.hasIn(keys.get(i).split('.'))) {
        return false // All keys not available yet
      }
    }
    return true
  }
}
