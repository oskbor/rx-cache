'use strict';
const test = require('tape'),
      Cache = require('../src/cache');

test('Cache: should buffer bursts of get requests', function (assert) {
  assert.plan(2);
  assert.timeoutAfter(100)
  var c = new Cache({buffer:1});
  let emits = 0;
  c.getRequests.subscribe((value) =>
  {
    emits++;
    if (emits ===1) {
      assert.deepEquals(
        value.toJS(), ['a.a', 'b.b', 'c'],
        'requested keys "a.a", "b.b" and "c" are emitted at the same time'
      );
    }
    else if (emits ===2) {
      assert.deepEquals(
        value.toJS(), ['d', 'e'],
        'requested keys "d" and "e" are emitted at the same time'
      );
    }
    else assert.fail('observable emitted too many times');

  });
  c.get({'a.a':'localA'});
  c.get({
          'b.b': 'localB',
          'c': 'localC'
        });
setTimeout(() => {
  c.get({'d':'localD', 'e': 'localE'});
}, 3);
});
