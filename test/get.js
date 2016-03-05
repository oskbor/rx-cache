'use strict'
const test = require('tape')
const Cache = require('../src/cache')

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

test('get: should return the set value', function(assert) {
  assert.plan(1)
  let c = new Cache()
  c.set({'a': 'value'})
  setTimeout(() => {c.get({'a': 'a'}).subscribe((val) => {
    assert.deepEquals(val.toJS(), {'a': 'value'})
  })}, 1)
})

test('get: should return the latest set value', function(assert) {
  assert.plan(1)
  let c = new Cache()
  c.set({'a': '1'})
  c.set({'a': '2'})
  c.set({'a': '3'})
  c.set({'a': 'latest'})
  setTimeout(() => {c.get({'a': 'a'}).subscribe((val) => {
    assert.deepEquals(val.toJS(), {'a': 'latest'})
  })}, 1)
})
