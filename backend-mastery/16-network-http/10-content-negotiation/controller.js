const getInfo = (req, res) => { res.json({ module: 'Module 10', concept: 'Content Negotiation' }); };
const getTest = (req, res) => { res.json({ status: 'ok' }); };
module.exports = { getInfo, getTest };

