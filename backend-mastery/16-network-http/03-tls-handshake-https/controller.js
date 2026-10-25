const getInfo = (req, res) => { res.json({ module: 'Module 03', concept: 'TLS & HTTPS' }); };
const getTest = (req, res) => { res.json({ status: 'ok' }); };
module.exports = { getInfo, getTest };

