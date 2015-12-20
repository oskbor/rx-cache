'use strict';
const test = require('tape'),
      Cache = require('../src/cache');

test('Cache: should buffer bursts of get requests', function (assert) {
  assert.plan(2);
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

test('Cache: should not emit any missing keys if they are already in the cache', function (assert) {
  assert.plan(1);
  let c = new Cache ({buffer:1, initial: {
    'a': 'aValue',
    'b': 'bValue'
  }});
  c.getRequests.subscribe(() => assert.fail('missing keys were emitted despite both "a" and "b" being present in the cache'));
  let emits = 0;
  let obs = c.get({'a': 'myA', 'b': 'myB'});
  obs.subscribe((value) => {
    emits++;
    if (i===1) {
      assert.deepEquals(value.toJS(), {'myA': 'aValue', 'myB': 'bValue'});
    }
    else assert.fail('observable emitted too many times');
  });
});
