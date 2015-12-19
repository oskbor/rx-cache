'use strict';
const test = require('tape'),
      Cache = require('../src/cache');

test('Cache: should buffer bursts of get requests', function (assert) {
  assert.plan(1);
  assert.timeoutAfter(100)
  var c = new Cache({buffer:1});
  c.getRequests.subscribe((value) =>
  {
    assert.deepEquals(
      value.toJS(), [['a'], ['b'], ['c']],
      'requested keys "a", "b" and "c" are emitted at the same time'
    );
    assert.end();
  });
  c.get({'a':'localA'});
  c.get({
          'b': 'localB',
          'c': 'localC'
        });

});
