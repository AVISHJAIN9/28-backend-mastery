const getInfo = (req, res) => { res.json({ module: 'Module 08', concept: 'CDN' }); };
const getTest = (req, res) => { res.json({ status: 'ok' }); };
module.exports = { getInfo, getTest };

