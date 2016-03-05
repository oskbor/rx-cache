'use strict'
const Im = require('immutable')
const allKeysInCache = require('./helpers/allKeysInCache')

module.exports = function (state$, getRequests) {

  return function get (requestedMap) {
    let keys = Im.fromJS(Object.keys(requestedMap))
    // Find all missing keys in the cache
    state$.take(1).subscribe((state) => {
      let missingKeys = Im.List().withMutations((l) => {
        for (let i = 0; i < keys.size; i++) {
          if (!state.hasIn(keys.get(i).split('.'))) {
            l.push(keys.get(i))
          }
        }
      })
      if (missingKeys.size > 0) {
        getRequests.onNext(missingKeys)
      }
    })
    // find out if all keys are in the cache
    return state$
      .filter(allKeysInCache(keys))
      .distinctUntilChanged() // Filter out unrelated changes
      .map((state) => {
        // return an object as described in the requestedMap
        return Im.Map().withMutations((map) => {
          keys.map((key) => {
            let cacheValue = state.getIn(key.split('.'))
            map.setIn(requestedMap[key].split('.'), cacheValue)
          })
        })
      })
  }
}
