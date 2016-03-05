'use strict'
const Rx = require('rx')
const Im = require('immutable')
const getBuilder = require('./get')

module.exports = function Cache (options) {
  options = Object.assign({optimistic: true, buffer: 20, initial: {}}, options)
  let updates = new Rx.BehaviorSubject(Im.fromJS(options.initial))
  let _setReqSubject = new Rx.Subject()
  let _getReqSubject = new Rx.Subject()
  let state$ = updates.scan(
    (state, operation) => {
      return operation(state)
    })
    .shareReplay(1)

  function set (setMap) {
    _setReqSubject.onNext(setMap)
    if (options.optimistic) {
      updates.onNext(
        (state) => state.mergeDeep(setMap)
      )
    }
  }
  return {
    set: set,
    get: getBuilder(state$, _getReqSubject),
    get setRequests () {
      if (options.buffer) {
        return _setReqSubject
          .buffer(() => _setReqSubject.debounce(options.buffer))
          .map((arr) => {
            return Im.Map().withMutations(
              (m) => arr.map((i) => m.mergeDeep(i)))
          })
      } else return _setReqSubject
    },
    get getRequests () {
      if (options.buffer) {
        return _getReqSubject
          .buffer(() => _getReqSubject.debounce(options.buffer))
          .map((arr) => {
            return Im.Set().withMutations(
              (s) => arr.map((i) => s.union(i))
            )
          })
      } else return _getReqSubject
    }
  }
}

/*
cachen behöver en get, som returnerar en observable. den ska filtrera cachen på att alla nycklar finns.thats it
Alla nycklar som inte finns levereras vidare till "server side" - interfacet

Servern returnerar till ett subject som modifierar cachen

set anropar servern direkt

refresh gör en get , fast bypass på cachen

 */
