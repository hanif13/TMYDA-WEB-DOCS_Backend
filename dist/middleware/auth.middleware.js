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
exports.authorizePermission = exports.authorizeSuperAdmin = exports.authorizeFinance = exports.authorizeAdmin = exports.authenticateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateToken = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนดำเนินการ' });
    }
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            console.error('❌ JWT_SECRET is not set in environment.');
            return res.status(500).json({ error: 'เซิร์ฟเวอร์ยังไม่พร้อมใช้งาน' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (err) {
        console.error('JWT verification error:', err);
        return res.status(403).json({ error: 'เซสชันหมดอายุหรือไม่มีสิทธิ์การเข้าถึง' });
    }
});
exports.authenticateToken = authenticateToken;
// Allow SUPER_ADMIN and ADMIN
const authorizeAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if ((user === null || user === void 0 ? void 0 : user.role) !== 'ADMIN' && (user === null || user === void 0 ? void 0 : user.role) !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้ (Admin Only)' });
    }
    next();
});
exports.authorizeAdmin = authorizeAdmin;
// Allow SUPER_ADMIN and FINANCE for finance write operations
const authorizeFinance = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if ((user === null || user === void 0 ? void 0 : user.role) !== 'FINANCE' && (user === null || user === void 0 ? void 0 : user.role) !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้ (Finance Only)' });
    }
    next();
});
exports.authorizeFinance = authorizeFinance;
// Allow SUPER_ADMIN only
const authorizeSuperAdmin = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const user = req.user;
    if ((user === null || user === void 0 ? void 0 : user.role) !== 'SUPER_ADMIN') {
        return res.status(403).json({ error: 'คุณไม่มีสิทธิ์ในการดำเนินการนี้ (Super Admin Only)' });
    }
    next();
});
exports.authorizeSuperAdmin = authorizeSuperAdmin;
const authorizePermission = (permission) => {
    return (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
        const user = req.user;
        if (!(user === null || user === void 0 ? void 0 : user.permissions.includes(permission)) && (user === null || user === void 0 ? void 0 : user.role) !== 'SUPER_ADMIN') {
            return res.status(403).json({ error: `คุณไม่มีสิทธิ์ในการเข้าถึง (${permission})` });
        }
        next();
    });
};
exports.authorizePermission = authorizePermission;
