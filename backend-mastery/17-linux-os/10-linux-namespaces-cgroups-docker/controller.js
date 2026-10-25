function getInfo(req, res) { res.json({ message: "Info", status: "ok" }); }
function getTest(req, res) { res.json({ test: "ok" }); }
module.exports = { getInfo, getTest };