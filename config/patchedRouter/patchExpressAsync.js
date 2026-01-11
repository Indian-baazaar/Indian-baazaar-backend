import express from 'express';

const originalRouter = express.Router;

express.Router = function patchedRouter(...args) {
  const router = originalRouter(...args);

  const wrap = (fn) => {
    if (typeof fn !== 'function' || fn.length === 4) return fn;
    return function wrappedHandler(req, res, next) {
      try {
        const maybePromise = fn(req, res, next);
        if (maybePromise && typeof maybePromise.then === 'function') {
          maybePromise.catch(next);
        }
      } catch (err) {
        next(err);
      }
    };
  };

  const methods = ['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'all', 'use'];

  methods.forEach((method) => {
    const original = router[method];
    router[method] = function patchedMethod(...methodArgs) {
      const wrapped = methodArgs.map((a) => (typeof a === 'function' ? wrap(a) : a));
      return original.apply(this, wrapped);
    };
  });

  return router;
};

export default null;
