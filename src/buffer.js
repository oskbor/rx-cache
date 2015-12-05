'use strict';

module.exports = function buffer(source, scheduler) {
  const stop = source.debounce(20, scheduler);
  const start = source.startWith('');
  return source.buffer(start, stop);
}
