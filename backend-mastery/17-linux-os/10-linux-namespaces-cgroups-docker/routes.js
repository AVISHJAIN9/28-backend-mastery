const express = require("express");
const { getInfo, getTest } = require("./controller");
const router = express.Router();
router.get("/info", getInfo);
router.get("/test", getTest);
module.exports = router;