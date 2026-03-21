"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { username, password } = req.body;
        const normalizedUsername = username === null || username === void 0 ? void 0 : username.trim();
        if (!normalizedUsername || !password) {
            return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
        }
        const user = yield prisma_1.prisma.user.findUnique({
            where: { username: normalizedUsername },
            include: { department: true }
        });
        if (!user) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
        const isPasswordValid = yield bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
        }
        const token = jsonwebtoken_1.default.sign({
            userId: user.id,
            username: user.username,
            role: user.role,
            permissions: user.permissions
        }, auth_middleware_1.JWT_SECRET, { expiresIn: '7d' });
        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.name,
                role: user.role,
                permissions: user.permissions,
                department: (_a = user.department) === null || _a === void 0 ? void 0 : _a.name
            }
        });
    }
    catch (error) {
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
    }
});
exports.login = login;
