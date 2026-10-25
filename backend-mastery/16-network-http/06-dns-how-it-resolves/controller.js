const getInfo = (req, res) => { res.json({ module: 'Module 06', concept: 'DNS' }); };
const getTest = (req, res) => { res.json({ status: 'ok' }); };
module.exports = { getInfo, getTest };

