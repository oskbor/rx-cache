'use strict';
const test = require('tape'),
      buffer = require('../src/buffer'),
      Rx = require('rx'),
      Im = require('immutable'),
      rxEqual = require('./helpers/rx-equals');

var onNext = Rx.ReactiveTest.onNext,
  onCompleted = Rx.ReactiveTest.onCompleted,
  subscribe = Rx.ReactiveTest.subscribe;

test('Buffer: should buffer bursts', function (t) {
  t.plan(1);
  var scheduler = new Rx.TestScheduler();

  var input = scheduler.createHotObservable(
    onNext(200, {'a': 'z'}),
    onNext(210, {'b': 'b'}),
    onNext(220, {'a': 'a'}),
    onCompleted(500)
  );

  var results = scheduler.startScheduler(function () {
      return input.buffer(function () {return  input.debounce(20, scheduler)})
      .map(function (arr) {
        var obj = Im.fromJS({});
        arr.map(item => obj = obj.mergeDeep(item))
        return obj;
      });
    }
  );
  rxEqual(t, results.messages, [
      onNext(140, Im.fromJS({'a': 'a', 'b':'b'})),
      onCompleted(500)
    ]);
});
