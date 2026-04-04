import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import bcrypt from 'bcryptjs';
import { AuthRequest } from '../middleware/auth.middleware';
import { parse } from 'csv-parse/sync';

// Valid roles
const VALID_ROLES = ['SUPER_ADMIN', 'ADMIN', 'FINANCE', 'VIEWER'];
const MAX_SUPER_ADMINS = 3;

// Role labels for display
const ROLE_LABELS: Record<string, string> = {
    SUPER_ADMIN: 'ผู้ดูแลระบบ',
    ADMIN: 'ผู้ใช้งาน',
    FINANCE: 'ผู้จัดการการเงิน',
    VIEWER: 'ผู้ใช้ทั่วไป',
};

export const getUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: { department: true },
            orderBy: { createdAt: 'desc' }
        });
        
        // Map to exclude new fields
        const usersWithFields = users.map(user => ({
            ...user,
            passwordHash: undefined // security
        }));
        
        return res.json(usersWithFields);
    } catch (error) {
        console.error("Error fetching users:", error);
        return res.status(500).json({ error: "Failed to fetch users" });
    }
};

export const getProfile = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { department: true }
        });

        if (!user) return res.status(404).json({ error: 'User not found' });

        return res.json({
            id: user.id,
            username: user.username,
            name: user.name,
            role: user.role,
            roleLabel: ROLE_LABELS[user.role] || user.role,
            permissions: user.permissions,
            department: user.department?.name,
            departmentId: user.departmentId,
            email: user.email,
            phoneNumber: user.phoneNumber,
            facebook: user.facebook,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return res.status(500).json({ error: "Failed to fetch profile" });
    }
};

export const createUser = async (req: Request, res: Response) => {
    try {
        const { username, password, role, name, department, departmentId: bodyDeptId, email, phoneNumber, facebook } = req.body;
        const targetRole = role || 'VIEWER';

        // Validate role
        if (!VALID_ROLES.includes(targetRole)) {
            return res.status(400).json({ error: `Role ไม่ถูกต้อง กรุณาระบุ: ${VALID_ROLES.join(', ')}` });
        }

        // Limit SUPER_ADMIN to max 3
        if (targetRole === 'SUPER_ADMIN') {
            const count = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
            if (count >= MAX_SUPER_ADMINS) {
                return res.status(400).json({ error: `ไม่สามารถสร้างผู้ดูแลระบบได้มากกว่า ${MAX_SUPER_ADMINS} คน` });
            }
        }
        
        let finalDeptId = bodyDeptId || department;
        if (finalDeptId && finalDeptId.length <= 10) {
            // If it's a short string, assume it's a department name and try to find the ID
            const dept = await prisma.department.findFirst({ 
                where: { name: finalDeptId },
                orderBy: { thaiYear: 'desc' }
            });
            if (dept) finalDeptId = dept.id;
        }

        const passwordHash = password ? await bcrypt.hash(password, 10) : await bcrypt.hash('123456', 10);
        
        const newUser = await prisma.user.create({
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
    } catch (error: any) {
        console.error("Error creating user:", error);
        if (error.code === 'P2002') {
            return res.status(400).json({ error: "ชื่อผู้ใช้นี้มีอยู่แล้ว" });
        }
        return res.status(500).json({ error: "Failed to create user" });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { username, password, role, name, department, departmentId: bodyDeptId, email, phoneNumber, facebook } = req.body;
        
        let updateData: any = {};
        if (username) updateData.username = username;
        if (name) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (facebook !== undefined) updateData.facebook = facebook;

        if (role) {
            if (!VALID_ROLES.includes(role)) {
                return res.status(400).json({ error: `Role ไม่ถูกต้อง` });
            }

            // If changing to SUPER_ADMIN, check limit
            if (role === 'SUPER_ADMIN') {
                const currentUser = await prisma.user.findUnique({ where: { id } });
                if (currentUser?.role !== 'SUPER_ADMIN') {
                    const count = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
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
            } else {
                const dept = await prisma.department.findFirst({ 
                    where: { name: deptToUse },
                    orderBy: { thaiYear: 'desc' }
                });
                if (dept) updateData.departmentId = dept.id;
            }
        }

        if (password) {
            updateData.passwordHash = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            include: { department: true }
        });
        
        return res.json(updatedUser);
    } catch (error) {
        console.error("Error updating user:", error);
        return res.status(500).json({ error: "Failed to update user" });
    }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, email, phoneNumber, facebook, departmentId } = req.body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (email !== undefined) updateData.email = email;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (facebook !== undefined) updateData.facebook = facebook;
        if (departmentId !== undefined) updateData.departmentId = departmentId;

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            include: { department: true }
        });

        return res.json({
            id: updatedUser.id,
            username: updatedUser.username,
            name: updatedUser.name,
            role: updatedUser.role,
            department: updatedUser.department?.name,
            departmentId: updatedUser.departmentId,
            email: updatedUser.email,
            phoneNumber: updatedUser.phoneNumber,
            facebook: updatedUser.facebook
        });
    } catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ error: "Failed to update profile" });
    }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.userId;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'กรุณากรอกรหัสผ่านเก่าและรหัสผ่านใหม่' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ error: 'ไม่พบผู้ใช้' });

        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return res.status(400).json({ error: 'รหัสผ่านเก่าไม่ถูกต้อง' });
        }

        const newHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { passwordHash: newHash }
        });

        return res.json({ message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
    } catch (error) {
        console.error("Error changing password:", error);
        return res.status(500).json({ error: "Failed to change password" });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.user.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        console.error("Error deleting user:", error);
        return res.status(500).json({ error: "Failed to delete user" });
    }
};

export const updatePermissions = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { permissions } = req.body;
        
        if (!Array.isArray(permissions)) {
            return res.status(400).json({ error: "Permissions must be an array" });
        }

        const updatedUser = await prisma.user.update({
            where: { id: id },
            data: { permissions },
            include: { department: true }
        });
        
        return res.json(updatedUser);
    } catch (error) {
        console.error("Error updating permissions:", error);
        return res.status(500).json({ error: "Failed to update permissions" });
    }
};

export const bulkUploadUsers = async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "ไม่มีไฟล์อัปโหลด" });
        }

        const records = parse(req.file.buffer, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });

        const ROLE_MAP: Record<string, string> = {
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
            errors: [] as any[]
        };

        // Cache departments for performance
        const allDepts = await prisma.department.findMany({
            orderBy: { thaiYear: 'desc' }
        });

        for (const [index, record] of (records as any[]).entries()) {
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
                    if (dept) deptId = dept.id;
                }

                const passwordHash = await bcrypt.hash(password, 10);
                const permissions = targetRole === 'SUPER_ADMIN' ? ['all'] : ['VIEW'];

                // Check for existing user
                const existingUser = await prisma.user.findUnique({ where: { username } });

                if (existingUser) {
                    // Update
                    await prisma.user.update({
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
                } else {
                    // Create
                    if (targetRole === 'SUPER_ADMIN') {
                        const count = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } });
                        if (count >= MAX_SUPER_ADMINS) {
                            results.failed++;
                            results.errors.push({ row: index + 2, error: `ไม่สามารถสร้างผู้ดูแลระบบเพิ่มได้ (ครบ ${MAX_SUPER_ADMINS} คนแล้ว)` });
                            continue;
                        }
                    }

                    await prisma.user.create({
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
            } catch (err: any) {
                console.error(`Row ${index + 2} error:`, err);
                results.failed++;
                results.errors.push({ row: index + 2, error: err.message });
            }
        }

        return res.json(results);
    } catch (error) {
        console.error("Bulk upload error:", error);
        return res.status(500).json({ error: "การอัปโหลดไฟล์ล้มเหลว" });
    }
};
