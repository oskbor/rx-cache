const Immutable = require('immutable');

module.exports = function keyIn(/*...keys*/) {
  var keySet = Immutable.Set(arguments);
  return function (v, k) {
    return keySet.hasIn(k);
  }
}
