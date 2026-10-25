export default { logger: (req, res, next) => { console.log(req.path); next(); } };
