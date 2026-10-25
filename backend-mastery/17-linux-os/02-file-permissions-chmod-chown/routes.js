const ex = require("express");
const {getInfo, getTest} = require("./controller");
const r = ex.Router();
r.get("/info", getInfo);
r.get("/test", getTest);
module.exports = r;