"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = (0, express_1.Router)();
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: { error: 'กรุณารอสักครู่ (15 นาที) ก่อนพยายามล็อกอินใหม่อีกครั้ง เนื่องจากมีการเข้าสู่ระบบผิดพลาดหลายครั้ง' },
    standardHeaders: true,
    legacyHeaders: false,
});
router.post('/login', loginLimiter, auth_controller_1.login);
exports.default = router;
