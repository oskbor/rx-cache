'use strict'
const Rx = require('rx')
const Im = require('immutable')
const getBuilder = require('./get')

module.exports = function Cache (options) {
  // TODO: Immutable record as options object
  options = Object.assign({buffer: 20, initial: {}}, options)

  let updates = new Rx.ReplaySubject(1)
  let serverSet$ = new Rx.Subject()
  let serverGet$ = new Rx.Subject()
  let state$ = updates.startWith((s) => s).scan(
    (state, operation) => {
      return operation(state)
    }, Im.fromJS(options.initial))
    .shareReplay(1)
  function set (setMap) {
    serverSet$.onNext(setMap)
    updates.onNext((state) => state.mergeDeep(setMap))
  }
  return {
    set: set,
    get: getBuilder(state$, serverGet$),
    get setRequests () {
      if (options.buffer) {
        return serverSet$
          .buffer(() => serverSet$.debounce(options.buffer))
          .map((arr) => {
            return Im.Map().withMutations(
              (m) => arr.map((i) => m.mergeDeep(i)))
          })
      } else return serverSet$
    },
    get getRequests () {
      if (options.buffer) {
        return serverGet$
          .buffer(() => serverGet$.debounce(options.buffer))
          .map((arr) => {
            return Im.Set().withMutations(
              (s) => arr.map((i) => s.union(i))
            )
          })
      } else return serverGet$
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
