'use strict';
const Rx = require('rx'),
      Im = require('immutable'),
      keyIn = require('./helpers/keyIn');

module.exports = class Cache {

  constructor (options) {
    this.options = Object.assign({optimistic: true, buffer: 20, initial: {}}, options);
    this.updates = new Rx.BehaviorSubject(Im.fromJS(this.options.initial));
    this._setReqSubject = new Rx.Subject(),
    this._getReqSubject = new Rx.Subject();
    this.asObservable =
      this.updates
      .scan(
        (state, operation) => {
          return operation(state);
        })
      .shareReplay(1);
  }

  get (requestedMap) {
    let keys = Im.fromJS(Object.keys(requestedMap));

    this.asObservable.take(1).subscribe((state) => {
      let missingKeys = Im.List();
      for (let i = 0; i < keys.size; i++) {
        if (!state.hasIn(keys.get(i).split('.'))) {
          //TODO: modify in transaction
          missingKeys = missingKeys.push(keys.get(i));
        }
      }
      if (missingKeys.size > 0) {
        this._getReqSubject.onNext(missingKeys);
      }
    });
    // find out if all keys are in the cache
    return this.asObservable
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

  set (setMap) {
    this._setReqSubject.onNext(setMap);
    if (this.options.optimistic) {
      this.updates.onNext(
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
      return this._getReqSubject
      .buffer(() => this._getReqSubject.debounce(this.options.buffer))
      .map(arr => {
        return Im.Set().withMutations(
          s => arr.map(i => s.union(i))
        );
      });
      ;
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
