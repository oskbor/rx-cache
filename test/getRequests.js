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
