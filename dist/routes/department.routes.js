"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const department_controller_1 = require("../controllers/department.controller");
const router = (0, express_1.Router)();
router.get('/', department_controller_1.getDepartments);
exports.default = router;
