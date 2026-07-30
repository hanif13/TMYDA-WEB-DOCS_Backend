import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

// ─── PUBLIC: Register a new member (No Auth Required) ─────────
export const registerMember = async (req: Request, res: Response) => {
    try {
        const {
            // 1. ข้อมูลส่วนตัว
            fullName,
            nickname,
            birthDate,
            age,
            bloodType,
            // 2. ข้อมูลติดต่อ
            address,
            phoneNumber,
            email,
            facebook,
            lineId,
            emergencyContact,
            // 3. การศึกษา
            education,
            institution,
            fieldOfStudy,
            // 4. อาชีพ/ข้อมูลครอบครัว
            occupation,
            workplace,
            workProvince,
            maritalStatus,
            childrenBoys,
            childrenGirls,
            childrenAges,
            // 5. ความเกี่ยวข้องกับกลุ่มองค์กร
            knowFrom,
            activities,
            // 6. ข้อมูลเพิ่มเติม
            skills,
            interests
        } = req.body;

        // Validate required fields
        if (!fullName || !phoneNumber) {
            return res.status(400).json({ 
                error: 'กรุณากรอกข้อมูลที่จำเป็น (ชื่อ-สกุล, เบอร์โทร)' 
            });
        }

        const member = await prisma.member.create({
            data: {
                fullName,
                nickname: nickname || null,
                birthDate: birthDate ? new Date(birthDate) : null,
                age: age ? parseInt(age) : null,
                bloodType: bloodType || null,
                address: address || null,
                phoneNumber,
                email: email || null,
                facebook: facebook || null,
                lineId: lineId || null,
                emergencyContact: emergencyContact || null,
                education: education || null,
                institution: institution || null,
                fieldOfStudy: fieldOfStudy || null,
                occupation: occupation || null,
                workplace: workplace || null,
                workProvince: workProvince || null,
                maritalStatus: maritalStatus || null,
                childrenBoys: childrenBoys != null ? parseInt(childrenBoys) : null,
                childrenGirls: childrenGirls != null ? parseInt(childrenGirls) : null,
                childrenAges: childrenAges || null,
                knowFrom: knowFrom || null,
                activities: activities || null,
                skills: skills || null,
                interests: interests || null,
                status: 'รอตรวจสอบ'
            }
        });

        return res.status(201).json({ 
            message: 'สมัครสมาชิกสำเร็จ',
            member 
        });
    } catch (error) {
        console.error('Error registering member:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการสมัครสมาชิก' });
    }
};

// ─── PROTECTED: Get all members with search, filter, pagination ─────
export const getMembers = async (req: Request, res: Response) => {
    try {
        const { 
            search, 
            status, 
            province, 
            page = '1', 
            limit = '20' 
        } = req.query;

        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 20;
        const skip = (pageNum - 1) * limitNum;

        const where: any = {};

        if (search) {
            const searchStr = search as string;
            where.OR = [
                { fullName: { contains: searchStr, mode: 'insensitive' } },
                { nickname: { contains: searchStr, mode: 'insensitive' } },
                { phoneNumber: { contains: searchStr } },
                { email: { contains: searchStr, mode: 'insensitive' } },
            ];
        }

        if (status) {
            where.status = status as string;
        }

        if (province) {
            where.workProvince = province as string;
        }

        const [members, total] = await Promise.all([
            prisma.member.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip,
                take: limitNum
            }),
            prisma.member.count({ where })
        ]);

        return res.json({
            members,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                totalPages: Math.ceil(total / limitNum)
            }
        });
    } catch (error) {
        console.error('Error fetching members:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก' });
    }
};

// ─── PROTECTED: Get member stats ─────────────────────────────────
export const getMemberStats = async (req: Request, res: Response) => {
    try {
        const [total, pending, approved, rejected] = await Promise.all([
            prisma.member.count(),
            prisma.member.count({ where: { status: 'รอตรวจสอบ' } }),
            prisma.member.count({ where: { status: 'อนุมัติ' } }),
            prisma.member.count({ where: { status: 'ไม่อนุมัติ' } }),
        ]);

        return res.json({
            total,
            pending,
            approved,
            rejected,
        });
    } catch (error) {
        console.error('Error fetching member stats:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงสถิติ' });
    }
};

// ─── PROTECTED: Get member by ID ─────────────────────────────────
export const getMemberById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const member = await prisma.member.findUnique({
            where: { id: id as string }
        });

        if (!member) {
            return res.status(404).json({ error: 'ไม่พบข้อมูลสมาชิก' });
        }

        return res.json(member);
    } catch (error) {
        console.error('Error fetching member:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสมาชิก' });
    }
};

// ─── PROTECTED: Update member status ─────────────────────────────
export const updateMemberStatus = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { status, note } = req.body;

        const validStatuses = ['รอตรวจสอบ', 'อนุมัติ', 'ไม่อนุมัติ'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'สถานะไม่ถูกต้อง' });
        }

        const member = await prisma.member.update({
            where: { id: id as string },
            data: {
                status,
                ...(note !== undefined && { note })
            }
        });

        return res.json(member);
    } catch (error) {
        console.error('Error updating member status:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปเดตสถานะ' });
    }
};

// ─── PROTECTED: Delete member ────────────────────────────────────
export const deleteMember = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.member.delete({ where: { id: id as string } });
        return res.status(204).send();
    } catch (error) {
        console.error('Error deleting member:', error);
        return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการลบข้อมูลสมาชิก' });
    }
};
