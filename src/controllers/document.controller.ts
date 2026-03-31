import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export const getDocuments = async (req: Request, res: Response) => {
    try {
        const { year } = req.query;
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
        return res.json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        return res.status(500).json({ error: "Failed to fetch documents" });
    }
};

export const createDocument = async (req: Request, res: Response) => {
    try {
        console.log("Create Document Request Body:", req.body);
        const { docNo, name, departmentId, categoryId, uploadedById, thaiYear, year: yearBody } = req.body;
        const file = req.file;
        console.log("File received:", file ? { name: file.originalname, size: file.size } : "No file");

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

        console.log("Resolved IDs:", { realDeptId, realCatId, realUploaderId });
        
        let filePath = "";
        if (file) {
            const extension = file.originalname.split('.').pop() || 'tmp';
            const fileName = `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
            const { data, error } = await supabaseAdmin.storage
                .from('uploads')
                .upload(`documents/${fileName}`, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) throw error;
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('uploads')
                .getPublicUrl(`documents/${fileName}`);
            filePath = publicUrl;
        }
        
        const thaiYearVal = thaiYear || yearBody;

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
        
        return res.status(201).json(newDoc);
    } catch (error: any) {
        console.error("Error creating document (DETAILED):", {
            message: error.message,
            stack: error.stack,
            prismaCode: error.code,
            prismaMeta: error.meta
        });
        return res.status(500).json({ error: "Failed to create document", detail: error.message });
    }
};

export const linkDocumentToProject = async (req: Request, res: Response) => {
    try {
        const documentId = req.params.documentId as string;
        const { projectId } = req.body;
        
        const updatedDoc = await prisma.document.update({
            where: { id: documentId },
            data: { projectId: projectId || null }
        });
        
        return res.json(updatedDoc);
    } catch (error) {
        console.error("Error linking document:", error);
        return res.status(500).json({ error: "Failed to link document" });
    }
};

export const updateDocument = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { docNo, name, departmentId, categoryId, uploadedById } = req.body;
        const file = req.file;

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
        
        if (file) {
            const extension = file.originalname.split('.').pop() || 'tmp';
            const fileName = `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
            const { data, error } = await supabaseAdmin.storage
                .from('uploads')
                .upload(`documents/${fileName}`, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) throw error;
            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('uploads')
                .getPublicUrl(`documents/${fileName}`);
            updateData.filePath = publicUrl;
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
        
        return res.json(updatedDoc);
    } catch (error) {
        console.error("Error updating document:", error);
        return res.status(500).json({ error: "Failed to update document" });
    }
};

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.document.delete({ where: { id } });
        return res.status(204).send();
    } catch (error) {
        console.error("Error deleting document:", error);
        return res.status(500).json({ error: "Failed to delete document" });
    }
};

export const getDocumentCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.documentCategory.findMany({
            orderBy: { name: 'asc' }
        });
        return res.json(categories);
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({ error: "Failed to fetch categories" });
    }
};
