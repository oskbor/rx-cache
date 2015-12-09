'use strict';
const Rx = require('rx'),
      Im = require('immutable'),
      keyIn = require('./helpers/keyIn');

module.exports = class Cache {

  constructor (options) {
    this.options = Object.assign({optimistic: true, buffer: 20}, options);
    if (this.options.initial) {
      this.updates = new Rx.BehaviorSubject(Im.fromJS(initial));
    }
    else {
      this.updates = new Rx.Subject();
    }
    this._setReqSubject = new Rx.Subject();
    this._getReqSubject = new Rx.Subject();
    this.asObservable = this.updates
      .scan(
        (state, operation) => operation(state),
        Im.Map())
      .distinctUntilChanged().shareReplay(1)
  }

  get (requestedMap) {
    let keys = Object.keys(requestedMap);

    // find out if all keys are in the cache
    return this.asObservable.filter(
      (state) => {
        let missingKeys = Im.List()
        for (let key in keys.map(key => key.split('.'))) {
          if (!state.hasIn(key)) {
            missingKeys.push(key);
          }
        }
        if (missingKeys.length > 0) {
          this._getReqSubject.onNext(missingKeys);
          return false;
        }
        else return true;
      }
    ).map((state) => {
      // This function only fires when all keys are in the cache (because of filter)
      // return an object as described in the requestedMap
      return Im.Map().withMutations(
        (map) => {
          keys.map(key => {
            let cacheValue = state.getIn(key.split('.'));
            map.setIn(requestedMap[key].split('.'), cacheValue);
          });
        });
      });
  }

  set (setMap) {
    this._setReqSubject.onNext(setMap);
    if (this.optimistic) {
      updates.onNext(
        (state) => state.mergeDeep(setMap)
      );
    }
  }
  get setRequests () {
    if(this.options.buffer) {
      return this._setReqSubject.buffer(() => this._setReqSubject.debounce(this.options.buffer));
    }
    else return this._setReqSubject;
  }
  get getRequests () {
    if(this.options.buffer) {
      return this._getReqSubject.buffer(() => this._getReqSubject.debounce(this.options.buffer));
    }
    else return this._getReqSubject;
  }
}

/*
cachen behöver en get, som returnerar en observable. den ska filtrera cachen på att alla nycklar finns.thats it
Alla nycklar som inte finns levereras vidare till "server side" - interfacet

Servern returnerar till ett subject som modifierar cachen

set anropar servern direkt

refresh gör en get , fast bypass på cachen

 */
