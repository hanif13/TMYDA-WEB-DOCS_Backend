import { Context } from 'hono';
import { getPrisma } from '../lib/prisma';
import { uploadToSupabase } from '../lib/supabase';
import { Bindings, Variables } from '../middleware/auth.middleware';

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const getDocuments = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const year = c.req.query('year');
        const prisma = getPrisma(c.env.DATABASE_URL);
        const filter: any = {};
        if (year) filter.thaiYear = Number(year);

        const documents = await prisma.document.findMany({
            where: filter,
            include: {
                category: true,
                department: true,
                uploadedBy: true
            },
            orderBy: { createdAt: 'desc' }
        });
        return c.json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        return c.json({ error: "Failed to fetch documents" }, 500);
    }
};

export const createDocument = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const formData = await c.req.formData();
        const prisma = getPrisma(c.env.DATABASE_URL);
        
        const docNo = formData.get('docNo') as string;
        const name = formData.get('name') as string;
        const departmentId = formData.get('departmentId') as string;
        const categoryId = formData.get('categoryId') as string;
        const uploadedById = formData.get('uploadedById') as string;
        const thaiYearVal = formData.get('thaiYear') || formData.get('year');
        const file = formData.get('file') as File;

        // Find real IDs if names were passed instead of UUIDs
        let realDeptId = departmentId;
        let realCatId = categoryId;
        let realUploaderId = uploadedById;

        if (departmentId && !isUUID(departmentId)) {
            const dept = await prisma.department.findUnique({ where: { name: departmentId === "ส่วนกลาง" ? "สำนักอำนวยการ" : departmentId } });
            if (dept) realDeptId = dept.id;
        }

        if (categoryId && !isUUID(categoryId)) {
            const cat = await prisma.documentCategory.findUnique({ where: { name: categoryId } });
            if (cat) realCatId = cat.id;
        }

        if (uploadedById === "user_id_placeholder") {
            const user = await prisma.user.findFirst(); // Fallback for demo
            if (user) realUploaderId = user.id;
        }
        
        // Upload to Supabase instead of local disk
        let filePath = "";
        if (file && file.size > 0) {
            const fileName = `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.name}`;
            const buffer = await file.arrayBuffer();
            filePath = await uploadToSupabase('uploads', `documents/${fileName}`, new Uint8Array(buffer), file.type, c.env);
        }
        
        const newDoc = await prisma.document.create({
            data: {
                docNo,
                name,
                departmentId: realDeptId,
                categoryId: realCatId,
                uploadedById: realUploaderId,
                filePath,
                thaiYear: thaiYearVal ? Number(thaiYearVal) : 2569
            },
            include: {
                category: true,
                department: true,
                uploadedBy: true
            }
        });
        
        return c.json(newDoc, 201);
    } catch (error) {
        console.error("Error creating document:", error);
        return c.json({ error: "Failed to create document" }, 500);
    }
};

export const linkDocumentToProject = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const documentId = c.req.param('documentId');
        const { projectId } = await c.req.json();
        const prisma = getPrisma(c.env.DATABASE_URL);
        
        const updatedDoc = await prisma.document.update({
            where: { id: documentId },
            data: { projectId: projectId || null }
        });
        
        return c.json(updatedDoc);
    } catch (error) {
        console.error("Error linking document:", error);
        return c.json({ error: "Failed to link document" }, 500);
    }
};

export const updateDocument = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const id = c.req.param('id');
        const formData = await c.req.formData();
        const prisma = getPrisma(c.env.DATABASE_URL);
        
        const docNo = formData.get('docNo') as string;
        const name = formData.get('name') as string;
        const departmentId = formData.get('departmentId') as string;
        const categoryId = formData.get('categoryId') as string;
        const uploadedById = formData.get('uploadedById') as string;
        const file = formData.get('file') as File;

        let updateData: any = {};
        if (docNo) updateData.docNo = docNo;
        if (name) updateData.name = name;
        
        if (departmentId) {
            if (!isUUID(departmentId)) {
                const dept = await prisma.department.findUnique({ where: { name: departmentId === "ส่วนกลาง" ? "สำนักอำนวยการ" : departmentId } });
                if (dept) updateData.departmentId = dept.id;
            } else {
                updateData.departmentId = departmentId;
            }
        }

        if (categoryId) {
            if (!isUUID(categoryId)) {
                const cat = await prisma.documentCategory.findUnique({ where: { name: categoryId } });
                if (cat) updateData.categoryId = cat.id;
            } else {
                updateData.categoryId = categoryId;
            }
        }

        if (uploadedById && uploadedById !== "user_id_placeholder") {
            updateData.uploadedById = uploadedById;
        }
        
        if (file && file.size > 0) {
            const fileName = `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.name}`;
            const buffer = await file.arrayBuffer();
            updateData.filePath = await uploadToSupabase('uploads', `documents/${fileName}`, new Uint8Array(buffer), file.type, c.env);
        }
        
        const updatedDoc = await prisma.document.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
                department: true,
                uploadedBy: true
            }
        });
        
        return c.json(updatedDoc);
    } catch (error) {
        console.error("Error updating document:", error);
        return c.json({ error: "Failed to update document" }, 500);
    }
};

export const deleteDocument = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const id = c.req.param('id');
        const prisma = getPrisma(c.env.DATABASE_URL);
        await prisma.document.delete({ where: { id } });
        return c.body(null, 204);
    } catch (error) {
        console.error("Error deleting document:", error);
        return c.json({ error: "Failed to delete document" }, 500);
    }
};

export const getDocumentCategories = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const prisma = getPrisma(c.env.DATABASE_URL);
        const categories = await prisma.documentCategory.findMany({
            orderBy: { name: 'asc' }
        });
        return c.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return c.json({ error: "Failed to fetch categories" }, 500);
    }
};
