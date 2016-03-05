'use strict'

module.exports = function (state$, setRequests) {
  return function set (setMap) {
    setRequests.onNext(setMap)
    state$.onNext((state) => state.mergeDeep(setMap))
  }
}
