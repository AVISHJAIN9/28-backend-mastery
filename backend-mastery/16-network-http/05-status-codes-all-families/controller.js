const getInfo = (req, res) => { res.json({ module: 'Module 05', concept: 'Status Codes' }); };
const getTest = (req, res) => { res.json({ status: 'ok' }); };
module.exports = { getInfo, getTest };

