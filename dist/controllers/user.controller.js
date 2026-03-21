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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteUser = exports.updateUser = exports.updatePermissions = exports.createUser = exports.getUsers = void 0;
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma_1.prisma.user.findMany({
            include: { department: true },
            orderBy: { createdAt: 'desc' }
        });
        // Remove passwordHash before sending
        const safeUsers = users.map((_a) => {
            var { passwordHash } = _a, user = __rest(_a, ["passwordHash"]);
            return user;
        });
        res.json(safeUsers);
    }
    catch (error) {
        res.status(500).json({ error: 'ไม่สามารถดึงข้อมูลผู้ใช้ได้' });
    }
});
exports.getUsers = getUsers;
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, name, role, permissions, departmentId } = req.body;
        const existingUser = yield prisma_1.prisma.user.findUnique({ where: { username } });
        if (existingUser) {
            return res.status(400).json({ error: 'ชื่อผู้ใช้นี้มีอยู่ในระบบแล้ว' });
        }
        const passwordHash = yield bcryptjs_1.default.hash(password, 10);
        const newUser = yield prisma_1.prisma.user.create({
            data: {
                username,
                passwordHash,
                name,
                role: role || 'USER',
                permissions: permissions || ['VIEW'],
                departmentId
            }
        });
        const { passwordHash: _ } = newUser, safeUser = __rest(newUser, ["passwordHash"]);
        res.status(201).json(safeUser);
    }
    catch (error) {
        res.status(500).json({ error: 'ไม่สามารถสร้างผู้ใช้ได้' });
    }
});
exports.createUser = createUser;
const updatePermissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { permissions, role } = req.body;
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { id: id },
            data: {
                permissions: permissions,
                role: role
            }
        });
        const { passwordHash } = updatedUser, safeUser = __rest(updatedUser, ["passwordHash"]);
        res.json(safeUser);
    }
    catch (error) {
        res.status(500).json({ error: 'ไม่สามารถอัปเดตสิทธิ์ได้' });
    }
});
exports.updatePermissions = updatePermissions;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { username, name, role, permissions, departmentId, password } = req.body;
        const data = {
            username,
            name,
            role,
            permissions,
            departmentId
        };
        if (password) {
            data.passwordHash = yield bcryptjs_1.default.hash(password, 10);
        }
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { id: id },
            data
        });
        const { passwordHash } = updatedUser, safeUser = __rest(updatedUser, ["passwordHash"]);
        res.json(safeUser);
    }
    catch (error) {
        res.status(500).json({ error: 'ไม่สามารถอัปเดตข้อมูลผู้ใช้ได้' });
    }
});
exports.updateUser = updateUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Prevent deleting self? or strictly super-admin can delete anyone?
        // For simplicity, just delete.
        yield prisma_1.prisma.user.delete({ where: { id: id } });
        res.json({ message: 'ลบผู้ใช้สำเร็จ' });
    }
    catch (error) {
        res.status(500).json({ error: 'ไม่สามารถลบผู้ใช้ได้' });
    }
});
exports.deleteUser = deleteUser;
