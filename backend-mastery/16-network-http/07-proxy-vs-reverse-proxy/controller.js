const getInfo = (req, res) => { res.json({ module: 'Module 07', concept: 'Proxy Patterns' }); };
const getTest = (req, res) => { res.json({ status: 'ok' }); };
module.exports = { getInfo, getTest };

