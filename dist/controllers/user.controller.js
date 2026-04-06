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
exports.bulkUploadUsers = exports.updatePermissions = exports.deleteUser = exports.changePassword = exports.updateMe = exports.updateUser = exports.createUser = exports.getProfile = exports.getUsers = void 0;
const prisma_1 = require("../lib/prisma");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const sync_1 = require("csv-parse/sync");
// Valid roles
const VALID_ROLES = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'VIEWER'];
const MAX_SUPER_ADMINS = 3;
// Role labels for display
const ROLE_LABELS = {
    SUPER_ADMIN: 'ผู้ดูแลระบบ',
    ADMIN: 'ผู้ใช้งาน',
    FINANCE: 'ผู้จัดการการเงิน',
    VIEWER: 'ผู้ใช้ทั่วไป',
};
const getUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const currentUser = req.user;
        const isSuperAdmin = (currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) === 'SUPER_ADMIN';
        const users = yield prisma_1.prisma.user.findMany({
            include: { department: true },
            orderBy: { createdAt: 'desc' }
        });
        // Map to exclude sensitive fields if not SUPER_ADMIN
        const usersFiltered = users.map(user => {
            if (isSuperAdmin) {
                return Object.assign(Object.assign({}, user), { passwordHash: undefined // security
                 });
            }
            // For others, only return non-sensitive fields
            return {
                id: user.id,
                name: user.name,
                username: user.username,
                role: user.role,
                department: user.department,
                createdAt: user.createdAt
                // phone, email, facebook etc are EXCLUDED
            };
        });
        return res.json(usersFiltered);
    }
    catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Failed to fetch users" });
    }
});
exports.getUsers = getUsers;
const getProfile = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = yield prisma_1.prisma.user.findUnique({
            where: { id: userId },
            include: { department: true }
        });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        return res.json({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            roleLabel: ROLE_LABELS[user.role] || user.role,
            permissions: user.permissions,
            department: (_b = user.department) === null || _b === void 0 ? void 0 : _b.name,
            departmentId: user.departmentId,
            email: user.email,
            phoneNumber: user.phoneNumber,
            facebook: user.facebook,
            createdAt: user.createdAt,
        });
    }
    catch (error) {
        console.error("Error fetching profile:", error);
        return res.status(500).json({ error: "Failed to fetch profile" });
    }
});
exports.getProfile = getProfile;
const createUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password, role, name, department, departmentId: bodyDeptId, email, phoneNumber, facebook } = req.body;
        const targetRole = role || 'VIEWER';
        // Validate role
        if (!VALID_ROLES.includes(targetRole)) {
            return res.status(400).json({ error: `Role ไม่ถูกต้อง กรุณาระบุ: ${VALID_ROLES.join(', ')}` });
        }
        // Limit SUPER_ADMIN to max 3
        if (targetRole === 'SUPER_ADMIN') {
            const count = yield prisma_1.prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
            if (count >= MAX_SUPER_ADMINS) {
                return res.status(400).json({ error: `ไม่สามารถสร้างผู้ดูแลระบบได้มากกว่า ${MAX_SUPER_ADMINS} คน` });
            }
        }
        let finalDeptId = bodyDeptId || department;
        if (finalDeptId && finalDeptId.length <= 10) {
            // If it's a short string, assume it's a department name and try to find the ID
            const dept = yield prisma_1.prisma.department.findFirst({
                where: { name: finalDeptId },
                orderBy: { thaiYear: 'desc' }
            });
            if (dept)
                finalDeptId = dept.id;
        }
        const passwordHash = password ? yield bcryptjs_1.default.hash(password, 10) : yield bcryptjs_1.default.hash('123456', 10);
        const newUser = yield prisma_1.prisma.user.create({
            data: {
                username,
                passwordHash,
                role: targetRole,
                name: name || username,
                departmentId: finalDeptId || null,
                email: email || null,
                phoneNumber: phoneNumber || null,
                facebook: facebook || null,
                permissions: targetRole === 'SUPER_ADMIN' ? ['all'] : ['VIEW']
            },
            include: { department: true }
        });
        return res.status(201).json(newUser);
    }
    catch (error) {
        console.error("Error creating user:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" });
        }
        return res.status(500).json({ error: "Failed to create user" });
    }
});
exports.createUser = createUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { username, password, role, name, department, departmentId: bodyDeptId, email, phoneNumber, facebook } = req.body;
        let updateData = {};
        if (username)
            updateData.username = username;
        if (name)
            updateData.name = name;
        if (email !== undefined)
            updateData.email = email;
        if (phoneNumber !== undefined)
            updateData.phoneNumber = phoneNumber;
        if (facebook !== undefined)
            updateData.facebook = facebook;
        if (role) {
            if (!VALID_ROLES.includes(role)) {
                return res.status(400).json({ error: `Role ไม่ถูกต้อง` });
            }
            // If changing to SUPER_ADMIN, check limit
            if (role === 'SUPER_ADMIN') {
                const currentUser = yield prisma_1.prisma.user.findUnique({ where: { id } });
                if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.role) !== 'SUPER_ADMIN') {
                    const count = yield prisma_1.prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
                    if (count >= MAX_SUPER_ADMINS) {
                        return res.status(400).json({ error: `ไม่สามารถมีผู้ดูแลระบบได้มากกว่า ${MAX_SUPER_ADMINS} คน` });
                    }
                }
            }
            updateData.role = role;
            updateData.permissions = role === 'SUPER_ADMIN' ? ['all'] : ['VIEW'];
        }
        const deptToUse = bodyDeptId || department;
        if (deptToUse) {
            if (deptToUse.length > 10) {
                updateData.departmentId = deptToUse;
            }
            else {
                const dept = yield prisma_1.prisma.department.findFirst({
                    where: { name: deptToUse },
                    orderBy: { thaiYear: 'desc' }
                });
                if (dept)
                    updateData.departmentId = dept.id;
            }
        }
        if (password) {
            updateData.passwordHash = yield bcryptjs_1.default.hash(password, 10);
        }
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { id },
            data: updateData,
            include: { department: true }
        });
        return res.json(updatedUser);
    }
    catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ error: "Failed to update user" });
    }
});
exports.updateUser = updateUser;
const updateMe = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const { name, email, phoneNumber, facebook, departmentId } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name;
        if (email !== undefined)
            updateData.email = email;
        if (phoneNumber !== undefined)
            updateData.phoneNumber = phoneNumber;
        if (facebook !== undefined)
            updateData.facebook = facebook;
        if (departmentId !== undefined)
            updateData.departmentId = departmentId;
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: { department: true }
        });
        return res.json({
            id: updatedUser.id,
            username: updatedUser.username,
            name: updatedUser.name,
            role: updatedUser.role,
            department: (_b = updatedUser.department) === null || _b === void 0 ? void 0 : _b.name,
            departmentId: updatedUser.departmentId,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber,
            facebook: updatedUser.facebook
        });
    }
    catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ error: "Failed to update profile" });
    }
});
exports.updateMe = updateMe;
const changePassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านเก่าและรหัสผ่านใหม่' });
        }
        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
        }
        const user = yield prisma_1.prisma.user.findUnique({ where: { id: userId } });
        if (!user)
            return res.status(404).json({ error: 'ไม่พบผู้ใช้' });
        const isValid = yield bcryptjs_1.default.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return res.status(400).json({ error: 'รหัสผ่านเก่าไม่ถูกต้อง' });
        }
        const newHash = yield bcryptjs_1.default.hash(newPassword, 10);
        yield prisma_1.prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash }
        });
        return res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    }
    catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({ error: "Failed to change password" });
    }
});
exports.changePassword = changePassword;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield prisma_1.prisma.user.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ error: "Failed to delete user" });
    }
});
exports.deleteUser = deleteUser;
const updatePermissions = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { permissions } = req.body;
        if (!Array.isArray(permissions)) {
            return res.status(400).json({ error: "Permissions must be an array" });
        }
        const updatedUser = yield prisma_1.prisma.user.update({
            where: { id: id },
            data: { permissions },
            include: { department: true }
        });
        return res.json(updatedUser);
    }
    catch (error) {
        console.error("Error updating permissions:", error);
        return res.status(500).json({ error: "Failed to update permissions" });
    }
});
exports.updatePermissions = updatePermissions;
const bulkUploadUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "ไม่มีไฟล์อัปโหลด" });
        }
        const records = (0, sync_1.parse)(req.file.buffer, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
        const ROLE_MAP = {
            'ผู้ดูแลระบบ': 'SUPER_ADMIN',
            'ผู้ใช้งาน': 'ADMIN',
            'ผู้จัดการการเงิน': 'FINANCE',
            'ผู้ใช้ทั่วไป': 'VIEWER',
            // English mapping just in case
            'SUPER_ADMIN': 'SUPER_ADMIN',
            'ADMIN': 'ADMIN',
            'FINANCE': 'FINANCE',
            'VIEWER': 'VIEWER'
        };
        const results = {
            total: records.length,
            success: 0,
            updated: 0,
            failed: 0,
            errors: []
        };
        // Cache departments for performance
        const allDepts = yield prisma_1.prisma.department.findMany({
            orderBy: { thaiYear: 'desc' }
        });
        for (const [index, record] of records.entries()) {
            try {
                const username = record.username || record['ชื่อผู้ใช้'];
                const password = record.password || record['รหัสผ่าน'] || '123456';
                const name = record.name || record['ชื่อ'];
                const deptName = record.department || record['หน่วยงาน'];
                const roleInput = record.role || record['ระดับสิทธิ์'] || 'ผู้ใช้ทั่วไป';
                if (!username) {
                    results.failed++;
                    results.errors.push({ row: index + 2, error: "ไม่มีชื่อผู้ใช้" });
                    continue;
                }
                const targetRole = ROLE_MAP[roleInput] || 'VIEWER';
                // Resolve department
                let deptId = null;
                if (deptName) {
                    const dept = allDepts.find(d => d.name === deptName);
                    if (dept)
                        deptId = dept.id;
                }
                const passwordHash = yield bcryptjs_1.default.hash(password, 10);
                const permissions = targetRole === 'SUPER_ADMIN' ? ['all'] : ['VIEW'];
                // Check for existing user
                const existingUser = yield prisma_1.prisma.user.findUnique({ where: { username } });
                if (existingUser) {
                    // Update
                    yield prisma_1.prisma.user.update({
                        where: { id: existingUser.id },
                        data: {
                            name: name || username,
                            passwordHash,
                            role: targetRole,
                            departmentId: deptId || existingUser.departmentId,
                            permissions
                        }
                    });
                    results.updated++;
                    results.success++;
                }
                else {
                    // Create
                    if (targetRole === 'SUPER_ADMIN') {
                        const count = yield prisma_1.prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
                        if (count >= MAX_SUPER_ADMINS) {
                            results.failed++;
                            results.errors.push({ row: index + 2, error: `ไม่สามารถสร้างผู้ดูแลระบบเพิ่มได้ (ครบ ${MAX_SUPER_ADMINS} คนแล้ว)` });
                            continue;
                        }
                    }
                    yield prisma_1.prisma.user.create({
                        data: {
                            username,
                            passwordHash,
                            name: name || username,
                            role: targetRole,
                            departmentId: deptId,
                            permissions
                        }
                    });
                    results.success++;
                }
            }
            catch (err) {
                console.error(`Row ${index + 2} error:`, err);
                results.failed++;
                results.errors.push({ row: index + 2, error: err.message });
            }
        }
        return res.json(results);
    }
    catch (error) {
        console.error("Bulk upload error:", error);
        return res.status(500).json({ error: "การอัปโหลดไฟล์ล้มเหลว" });
    }
});
exports.bulkUploadUsers = bulkUploadUsers;
