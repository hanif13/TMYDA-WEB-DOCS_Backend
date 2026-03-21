"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorizePermission = exports.authorizeAdmin = exports.authenticateToken = exports.JWT_SECRET = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
// Enforce JWT_SECRET from environment — no fallback allowed
if (!process.env.JWT_SECRET) {
    console.error('❌ FATAL: JWT_SECRET is not set in environment variables. Server cannot start securely.');
    process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
exports.JWT_SECRET = JWT_SECRET;
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'เซสชันหมดอายุหรือไม่มีสิทธิ์การเข้าถึง' });
        }
        req.user = user;
        next();
    });
};
exports.authenticateToken = authenticateToken;
const authorizeAdmin = (req, res, next) => {
    var _a, _b;
    if (((_a = req.user) === null || _a === void 0 ? void 0 : _a.role) !== 'ADMIN' && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้ (Admin Only)' });
    }
    next();
};
exports.authorizeAdmin = authorizeAdmin;
const authorizePermission = (permission) => {
    return (req, res, next) => {
        var _a, _b;
        if (!((_a = req.user) === null || _a === void 0 ? void 0 : _a.permissions.includes(permission)) && ((_b = req.user) === null || _b === void 0 ? void 0 : _b.role) !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: `คุณไม่มีสิทธิ์ในการเข้าถึง (${permission})` });
        }
        next();
    };
};
exports.authorizePermission = authorizePermission;
