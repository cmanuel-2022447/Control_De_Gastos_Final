"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const errorHandles_1 = require("../../../middleware/errorHandles");
const dashboard_controller_1 = require("../controller/dashboard.controller");
const router = (0, express_1.Router)();
router.use(errorHandles_1.authenticateToken);
router.get('/summary', dashboard_controller_1.getSummary);
exports.default = router;
