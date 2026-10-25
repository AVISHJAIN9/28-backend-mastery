const getInfo = (req, res) => { res.json({ module: 'Module 04', concept: 'HTTP Headers' }); };
const getTest = (req, res) => { res.json({ status: 'ok' }); };
module.exports = { getInfo, getTest };

