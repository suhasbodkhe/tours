module.exports = (callback) => (req, res, next) => {
  // callback(req, res, next).catch((err) => next(err));
  // NOTE the next function in "catch". next function receives an error argument "err".
  // The catch method here is the one available on Promise
  callback(req, res, next).catch(next);
};
