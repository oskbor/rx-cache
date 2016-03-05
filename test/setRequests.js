'use strict'
const test = require('tape')
const Cache = require('../src/cache')

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
