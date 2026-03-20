import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDocuments = async (req: Request, res: Response) => {
    try {
        const documents = await prisma.document.findMany({
            include: {
                category: true,
                department: true,
                uploadedBy: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(documents);
    } catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Failed to fetch documents" });
    }
};

export const createDocument = async (req: Request, res: Response) => {
    try {
        const { docNo, name, departmentId, categoryId, uploadedById } = req.body;
        
        // Find real IDs if names were passed instead of UUIDs
        let realDeptId = departmentId;
        let realCatId = categoryId;
        let realUploaderId = uploadedById;

        // Simple check if it's a UUID (very basic)
        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

        if (!isUUID(departmentId)) {
            const dept = await prisma.department.findUnique({ where: { name: departmentId === "ส่วนกลาง" ? "สำนักอำนวยการ" : departmentId } });
            if (dept) realDeptId = dept.id;
        }

        if (!isUUID(categoryId)) {
            const cat = await prisma.documentCategory.findUnique({ where: { name: categoryId } });
            if (cat) realCatId = cat.id;
        }

        if (uploadedById === "user_id_placeholder") {
            const user = await prisma.user.findFirst(); // Fallback for demo
            if (user) realUploaderId = user.id;
        }
        
        // The file path will be relative to the server for static serving
        const filePath = req.file ? `/uploads/documents/${req.file.filename}` : "";
        
        const newDoc = await prisma.document.create({
            data: {
                docNo,
                name,
                departmentId: realDeptId,
                categoryId: realCatId,
                uploadedById: realUploaderId,
                filePath
            },
            include: {
                category: true,
                department: true,
                uploadedBy: true
            }
        });
        
        res.status(201).json(newDoc);
    } catch (error) {
        console.error("Error creating document:", error);
        res.status(500).json({ error: "Failed to create document" });
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
        
        res.json(updatedDoc);
    } catch (error) {
        console.error("Error linking document:", error);
        res.status(500).json({ error: "Failed to link document" });
    }
};
export const updateDocument = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        const { docNo, name, departmentId, categoryId, uploadedById } = req.body;
        
        const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

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
        
        if (req.file) {
            updateData.filePath = `/uploads/documents/${req.file.filename}`;
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
        
        res.json(updatedDoc);
    } catch (error) {
        console.error("Error updating document:", error);
        res.status(500).json({ error: "Failed to update document" });
    }
};

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.document.delete({ where: { id } });
        res.status(204).send();
    } catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ error: "Failed to delete document" });
    }
};
