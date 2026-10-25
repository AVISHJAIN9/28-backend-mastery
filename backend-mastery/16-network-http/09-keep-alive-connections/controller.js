const getInfo = (req, res) => { res.json({ module: 'Module 09', concept: 'Keep-Alive' }); };
const getTest = (req, res) => { res.json({ status: 'ok' }); };
module.exports = { getInfo, getTest };

