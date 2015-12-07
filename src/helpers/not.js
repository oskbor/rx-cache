module.exports = function not(predicate) {
  return () => !predicate.apply(this, arguments);
  }
}
