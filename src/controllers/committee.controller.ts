import { Context } from 'hono';
import { getPrisma } from '../lib/prisma';
import { uploadToSupabase } from '../lib/supabase';
import { Bindings, Variables } from '../middleware/auth.middleware';

export const getCommitteeMembers = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const prisma = getPrisma(c.env.DATABASE_URL);
        const members = await prisma.committeeMember.findMany({
            include: { department: true },
            orderBy: { order: 'asc' }
        });
        return c.json(members);
    } catch (error) {
        console.error("Error fetching committee members:", error);
        return c.json({ error: "Failed to fetch committee members" }, 500);
    }
};

export const createCommitteeMember = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const formData = await c.req.formData();
        const prisma = getPrisma(c.env.DATABASE_URL);
        
        const name = formData.get('name') as string;
        const position = formData.get('position') as string || formData.get('role') as string;
        const departmentId = formData.get('departmentId') as string;
        const phone = formData.get('phoneNumber') as string;
        const email = formData.get('email') as string;
        const occupation = formData.get('occupation') as string;
        const order = formData.get('order') as string;
        const file = formData.get('image') as File || formData.get('photo') as File;

        let photoUrl = "";
        if (file && file.size > 0) {
            const fileName = `comm-${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.name}`;
            const buffer = await file.arrayBuffer();
            photoUrl = await uploadToSupabase('uploads', `committees/${fileName}`, new Uint8Array(buffer), file.type, c.env);
        }

        const newMember = await prisma.committeeMember.create({
            data: {
                name,
                position: position || "",
                departmentId,
                phoneNumber: phone || null,
                email: email || null,
                occupation: occupation || null,
                order: order ? parseInt(order) : 0,
                photoUrl
            },
            include: { department: true }
        });
        
        return c.json(newMember, 201);
    } catch (error) {
        console.error("Error creating committee member:", error);
        return c.json({ error: "Failed to create committee member" }, 500);
    }
};

export const updateCommitteeMember = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const id = c.req.param('id');
        const formData = await c.req.formData();
        const prisma = getPrisma(c.env.DATABASE_URL);
        
        const name = formData.get('name') as string;
        const position = formData.get('position') as string || formData.get('role') as string;
        const departmentId = formData.get('departmentId') as string;
        const phone = formData.get('phoneNumber') as string;
        const email = formData.get('email') as string;
        const occupation = formData.get('occupation') as string;
        const order = formData.get('order') as string;
        const file = formData.get('image') as File || formData.get('photo') as File;

        let updateData: any = {};
        if (name) updateData.name = name;
        if (position) updateData.position = position;
        if (departmentId) updateData.departmentId = departmentId;
        if (phone !== undefined) updateData.phoneNumber = phone;
        if (email !== undefined) updateData.email = email;
        if (occupation !== undefined) updateData.occupation = occupation;
        if (order !== undefined) updateData.order = parseInt(order);

        if (file && file.size > 0) {
            const fileName = `comm-${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.name}`;
            const buffer = await file.arrayBuffer();
            updateData.photoUrl = await uploadToSupabase('uploads', `committees/${fileName}`, new Uint8Array(buffer), file.type, c.env);
        }

        const updatedMember = await prisma.committeeMember.update({
            where: { id },
            data: updateData,
            include: { department: true }
        });
        
        return c.json(updatedMember);
    } catch (error) {
        console.error("Error updating committee member:", error);
        return c.json({ error: "Failed to update committee member" }, 500);
    }
};

export const deleteCommitteeMember = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const id = c.req.param('id');
        const prisma = getPrisma(c.env.DATABASE_URL);
        await prisma.committeeMember.delete({ where: { id } });
        return c.body(null, 204);
    } catch (error) {
        console.error("Error deleting committee member:", error);
        return c.json({ error: "Failed to delete committee member" }, 500);
    }
};

export const createCommitteeBulk = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const { committees } = await c.req.json();
        const prisma = getPrisma(c.env.DATABASE_URL);
        
        if (!Array.isArray(committees)) {
            return c.json({ error: "Invalid data format" }, 400);
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

        return c.json({ message: "Imported successfully", count: result.count }, 201);
    } catch (error) {
        console.error("Error bulk creating committee members:", error);
        return c.json({ error: "Failed to import committee members" }, 500);
    }
};
