const middleware = {
  logger: (req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  },

  errorHandler: (err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export default middleware;
