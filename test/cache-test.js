'use strict'
const test = require('tape')
const Cache = require('../src/cache')

test('getRequests: should buffer bursts of get requests', function (assert) {
  assert.plan(2)
  let buffer_time = 1 // 1 ms
  var c = new Cache({buffer: buffer_time})
  let emits = 0
  c.getRequests.subscribe((value) => {
    emits++
    if (emits === 1) {
      assert.deepEquals(
        value.toJS(), ['a.a', 'b.b', 'c'],
        'requested keys "a.a", "b.b" and "c" are batched together'
      )
    } else if (emits === 2) {
      assert.deepEquals(
        value.toJS(), ['d', 'e'],
        'requested keys "d" and "e" are emitted at the same time'
      )
    } else assert.fail('stream emitted too many times')
  })
  c.get({'a.a': 'localA'})
    .subscribe((val) => assert.fail('stream should not emit, because there are no values in the cache yet'))
  c.get({'b.b': 'localB', 'c': 'localC'})
    .subscribe((val) => assert.fail('stream should not emit, because there are no values in the cache yet'))
  setTimeout(() => {
    c.get({'d': 'localD', 'e': 'localE'}).subscribe(
      (val) => assert.fail('stream should not emit, because there are no values in the cache yet'))
  }, 3)
})

test('get: should not emit any missing keys if they are already in the cache', function (assert) {
  assert.plan(1)
  let c = new Cache({buffer: 1, initial: {
    'a': 'aValue',
    'b': 'bValue'
  }})
  c.getRequests.subscribe(() => assert.fail('missing keys were emitted despite being present in the cache'))
  let emits = 0
  let obs = c.get({'a': 'myA', 'b': 'myB'})
  obs.subscribe((value) => {
    emits++
    if (emits === 1) {
      assert.deepEquals(value.toJS(), {'myA': 'aValue', 'myB': 'bValue'},
        'should emit an object matching the requested object'
      )
    } else assert.fail('observable emitted too many times')
  })
})

test('get: should emit when all keys are available', function (assert) {
  assert.plan(3)
  let c = new Cache({buffer: 1, initial: {
    'a': 'aValue'
  }})
  let emits = 0
  c.getRequests.subscribe((val) => {
    assert.ok(emits === 0, 'the get observable has not emitted yet')
    assert.deepEquals(val.toJS(), ['b'], 'getRequests emits the missing key')
    c.set({'b': 'bValue'}) // All keys are now available in the cache, so the observable should emit
  })
  let obs = c.get({'a': 'myA', 'b': 'myB'})
  obs.subscribe((value) => {
    emits++
    if (emits === 1) {
      assert.deepEquals(value.toJS(), {'myA': 'aValue', 'myB': 'bValue'},
        'get stream emits an object matching the requested object'
      )
    } else assert.fail('observable emitted too many times')
  })
})

test('setRequests: should buffer bursts of set requests', function (assert) {
  assert.plan(2)
  var c = new Cache({buffer: 1}) // Debounces for 1 ms, then emits
  let emits = 0
  c.setRequests.subscribe((value) => {
    emits++
    if (emits === 1) {
      assert.deepEquals(
        value.toJS(), {'a': 'newestA', 'b': 'newB', 'c': 'newC'},
        'set calls are merged and latest set wins'
      )
    } else if (emits === 2) {
      assert.deepEquals(
        value.toJS(), {'d': 'newD', 'e': 'newE'},
        'set calls that are late are sent separately'
      )
    } else {
      assert.fail('stream emitted too many times')
    }
  })
  c.set({'a': 'wrongA', 'b': 'newB'})
  c.set({'c': 'newC', 'a': 'newestA'})
  setTimeout(() => {
    c.set({'d': 'newD', 'e': 'newE'})
  }, 3)
})
