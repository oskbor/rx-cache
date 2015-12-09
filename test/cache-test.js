'use strict';
const test = require('tape'),
      Cache = require('../src/cache');

test('Buffer: should buffer bursts', function (t) {
  t.plan(1);
  t.timeoutAfter(100)
  var c = new Cache({buffer:1});
  c.getRequests.subscribe((req) => t.equals({'a':'a', 'b': 'b'}))
  c.get({'a':'a'});
  c.get({'b': 'b'});

});
