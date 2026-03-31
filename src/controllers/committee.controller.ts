import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';

export const getCommitteeMembers = async (req: Request, res: Response) => {
    try {
        const members = await prisma.committeeMember.findMany({
            include: { department: true },
            orderBy: { order: 'asc' }
        });
        return res.json(members);
    } catch (error) {
        console.error("Error fetching committee members:", error);
        return res.status(500).json({ error: "Failed to fetch committee members" });
    }
};

export const createCommitteeMember = async (req: Request, res: Response) => {
    try {
        const { name, position, role, departmentId, phoneNumber, email, occupation, order, thaiYear } = req.body;
        const file = req.file;

        let photoUrl = "";
        if (file) {
            const extension = file.originalname.split('.').pop() || 'tmp';
            const fileName = `comm-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
            const { data, error } = await supabaseAdmin.storage
                .from('uploads')
                .upload(`committees/${fileName}`, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) throw error;
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('uploads')
                .getPublicUrl(`committees/${fileName}`);
            photoUrl = publicUrl;
        }

        const newMember = await prisma.committeeMember.create({
            data: {
                name,
                position: position || role || "",
                departmentId,
                phoneNumber: phoneNumber || null,
                email: email || null,
                occupation: occupation || null,
                order: order ? parseInt(order.toString()) : 0,
                photoUrl,
                thaiYear: thaiYear ? Number(thaiYear) : 2569
            },
            include: { department: true }
        });
        
        return res.status(201).json(newMember);
    } catch (error) {
        console.error("Error creating committee member:", error);
        return res.status(500).json({ error: "Failed to create committee member" });
    }
};

export const updateCommitteeMember = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { name, position, role, departmentId, phoneNumber, email, occupation, order } = req.body;
        const file = req.file;

        let updateData: any = {};
        if (name) updateData.name = name;
        if (position || role) updateData.position = position || role;
        if (departmentId) updateData.departmentId = departmentId;
        if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
        if (email !== undefined) updateData.email = email;
        if (occupation !== undefined) updateData.occupation = occupation;
        if (order !== undefined) updateData.order = parseInt(order.toString());

        if (file) {
            const extension = file.originalname.split('.').pop() || 'tmp';
            const fileName = `comm-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
            const { data, error } = await supabaseAdmin.storage
                .from('uploads')
                .upload(`committees/${fileName}`, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) throw error;
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('uploads')
                .getPublicUrl(`committees/${fileName}`);
            updateData.photoUrl = publicUrl;
        }

        const updatedMember = await prisma.committeeMember.update({
            where: { id },
            data: updateData,
            include: { department: true }
        });
        
        return res.json(updatedMember);
    } catch (error) {
        console.error("Error updating committee member:", error);
        return res.status(500).json({ error: "Failed to update committee member" });
    }
};

export const deleteCommitteeMember = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.committeeMember.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        console.error("Error deleting committee member:", error);
        return res.status(500).json({ error: "Failed to delete committee member" });
    }
};

export const createCommitteeBulk = async (req: Request, res: Response) => {
    try {
        const { committees } = req.body;
        
        if (!Array.isArray(committees)) {
            return res.status(400).json({ error: "Invalid data format" });
        }

        const result = await prisma.committeeMember.createMany({
            data: committees.map((comm: any) => ({
                name: comm.name,
                position: comm.position || comm.role || "",
                departmentId: comm.departmentId,
                phoneNumber: comm.phoneNumber || null,
                email: comm.email || null,
                photoUrl: comm.photoUrl || comm.imageUrl || "",
                order: comm.order || 0
            }))
        });

        return res.status(201).json({ message: "Imported successfully", count: result.count });
    } catch (error) {
        console.error("Error bulk creating committee members:", error);
        return res.status(500).json({ error: "Failed to import committee members" });
    }
};
