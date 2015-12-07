'use strict';
const Rx = require('rx'),
      Im = require('immutable'),
      keyIn = require('./helpers/keyIn');

module.exports = class Cache {

  constructor (options) {
    options = Object.assign({optimistic: true, buffer: true}, options);
    if (initial) {
      this.updates = new Rx.BehaviorSubject(Im.fromJS(initial));
    }
    else {
      this.updates = new Rx.Subject();
    }
    this.getRequests = new Rx.Subject();
    this.setRequests = new Rx.Subject();
    this.asObservable = this.updates
      .scan(
        (state, operation) => operation(state),
        Immutable.Map())
      .distinctUntilChanged().shareReplay(1)
  }

  get (requestedMap) {
    let keys = Object.keys(requestedMap);

    // find out if all keys are in the cache
    return this.asObservable.filter(
      (state) => {
        let missingKeys = Immutable.List()
        for (let key in keys.map(key => key.split('.'))) {
          if (!state.hasIn(key)) {
            missingKeys.push(key);
          }
        }
        if (missingKeys.length > 0) {
          this.getRequests.onNext(missingKeys);
          return false;
        }
        else return true;
      }
    ).map((state) => {
      // This function only fires when all keys are in the cache (because of filter)
      // return an object as described in the requestedMap
      return Immutable.Map().withMutations(
        (map) => {
          keys.map(key => {
            let cacheValue = state.getIn(key.split('.'));
            map.setIn(requestedMap[key].split('.'), cacheValue);
          }
        }
      ));
    });
  }

  set (setMap) {
    this.setRequests.onNext(setMap);
    if (this.optimistic) {
      updates.onNext(
        (state) => state.mergeDeep(setMap)
      );
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
