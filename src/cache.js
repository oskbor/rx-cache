'use strict';
const Rx = require('rx'),
      Im = require('immutable'),
      keyIn = require('./helpers/keyIn');

module.exports = function Cache (options) {

  options = Object.assign({optimistic: true, buffer: 20, initial: {}}, options);
  let updates = new Rx.BehaviorSubject(Im.fromJS(options.initial)),
      _setReqSubject = new Rx.Subject(),
      _getReqSubject = new Rx.Subject();
  let asObservable = updates.scan(
      (state, operation) => {
        return operation(state);
      })
    .shareReplay(1);


  let get = function get (requestedMap) {
    let keys = Im.fromJS(Object.keys(requestedMap));

    asObservable.take(1).subscribe((state) => {
      let missingKeys = Im.List();
      for (let i = 0; i < keys.size; i++) {
        if (!state.hasIn(keys.get(i).split('.'))) {
          //TODO: modify in transaction
          missingKeys = missingKeys.push(keys.get(i));
        }
      }
      if (missingKeys.size > 0) {
        _getReqSubject.onNext(missingKeys);
      }
    });
    // find out if all keys are in the cache
    return asObservable
    .distinctUntilChanged()
    .filter((state) => {
      for (let i = 0; i < keys.size; i++) {
        if (!state.hasIn(keys.get(i).split('.'))) {
          return false; // All keys not available yet
        }
      }
      return true;
    })
    .map((state) => {
      // This function only fires when all keys are in the cache (because of filter)
      // return an object as described in the requestedMap
      return Im.Map().withMutations((map) => {
        keys.map(key => {
          let cacheValue = state.getIn(key.split('.'));
          map.setIn(requestedMap[key].split('.'), cacheValue);
        });
      });
    });
  }

  function set (setMap) {
    _setReqSubject.onNext(setMap);
    if (options.optimistic) {
      updates.onNext(
        (state) => state.mergeDeep(setMap)
      );
    }
  }
  return {
    set: set,
    get: get,
    get setRequests () {
      if(options.buffer) {
        return _setReqSubject
        .buffer(() => _setReqSubject.debounce(options.buffer))
        .map(arr => {
          return Im.Map().withMutations(
            m => arr.map(i => m.mergeDeep(i)));
        });
      }
      else return _setReqSubject;
    },
    get getRequests () {
      if(options.buffer) {
        return _getReqSubject
        .buffer(() => _getReqSubject.debounce(options.buffer))
        .map(arr => {
          return Im.Set().withMutations(
            s => arr.map(i => s.union(i))
          );
        });
        ;
      }
      else return _getReqSubject;
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
