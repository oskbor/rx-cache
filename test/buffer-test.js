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
    onNext(201, {'a': 'z'}),
    onNext(210, {'b': 'b'}),
    onNext(220, {'a': 'a'}),
    onNext(300, {'a2': 'z'}),
    onNext(310, {'b': 'b'}),
    onNext(320, {'a': 'a'})
  );
  var stop = input.debounce(20, scheduler);

  var results = scheduler.startScheduler(function () {
      return input.buffer(() => stop)
      .map(function (arr) {
        var obj = {};
        arr.map(item => obj = Object.assign(obj, item));
        return obj;
      });
    }
  );
  rxEqual(t, results.messages, [
      onNext(240, {'a': 'a', 'b':'b'}),
      onNext(340, {'a': 'a', 'a2':'z', 'b':'b'})
    ]);
});
