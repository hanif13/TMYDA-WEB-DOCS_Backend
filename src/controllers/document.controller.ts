import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { supabaseAdmin } from '../lib/supabase';
import { generateNextDocNo } from '../lib/doc-utils';

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
        const { name, departmentId, categoryId, uploadedById, thaiYear, year: yearBody } = req.body; // docNo is ignored
        const file = req.file;
        console.log("File received:", file ? { name: file.originalname, size: file.size } : "No file");

        // Find real IDs if names were passed instead of UUIDs
        let realDeptId = departmentId;
        let realCatId = categoryId;
        let realUploaderId = uploadedById;
        const docYear = thaiYear ? Number(thaiYear) : (yearBody ? Number(yearBody) : 2567);

        if (departmentId) {
            let dept;
            if (isUUID(departmentId)) {
                dept = await prisma.department.findUnique({ where: { id: departmentId } });
            } else {
                // Check if it's a known string ID (like 'family', 'admin') or a Name
                dept = await prisma.department.findFirst({ 
                    where: {
                        OR: [
                            { id: departmentId },
                            { name: departmentId === "ส่วนกลาง" ? "สำนักอำนวยการ" : departmentId }
                        ]
                    },
                    orderBy: { thaiYear: 'desc' }
                });
            }

            if (dept) {
                // Check if this department's year matches the document's year
                if (dept.name && dept.thaiYear !== docYear) {
                    // Try to find the same department name for the document's specific year
                    let yearDept = await prisma.department.findFirst({
                        where: { name: dept.name, thaiYear: docYear }
                    });

                    // If it doesn't exist for the current year, auto-create it
                    if (!yearDept) {
                        yearDept = await prisma.department.create({
                            data: {
                                name: dept.name,
                                subDepts: dept.subDepts || [],
                                theme: dept.theme || null,
                                thaiYear: docYear,
                                order: dept.order || 0
                            }
                        });
                    }
                    realDeptId = yearDept.id;
                } else {
                    realDeptId = dept.id;
                }
            }
        }

        const thaiYearVal = thaiYear || yearBody;
        const finalYear = thaiYearVal ? Number(thaiYearVal) : 2569;

        if (categoryId) {
            let cat;
            if (isUUID(categoryId)) {
                cat = await prisma.documentCategory.findUnique({ where: { id: categoryId } });
            } else {
                cat = await prisma.documentCategory.findUnique({ where: { name: categoryId } });
            }
            
            if (cat) {
                realCatId = cat.id;
                
                // If the user hasn't provided a specific department (or provided "ส่วนกลาง")
                // AND it's a global category, default to admin
                const isExplicitDept = departmentId && departmentId !== "ส่วนกลาง" && departmentId !== "admin";
                
                if (!isExplicitDept && 
                    (cat.name === "ประเภทเอกสารโครงการ" || cat.name === "ประเภทเอกสารรายงานผลการดำเนินโครงการ")) {
                    const globalDept = await prisma.department.findFirst({ 
                        where: { name: "สำนักอำนวยการ", thaiYear: finalYear } 
                    });
                    if (globalDept) {
                        realDeptId = globalDept.id;
                        console.log(`Auto-resolved Global Type category: ${cat.name} to department: ${globalDept.name}`);
                    }
                }
            }
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
        
        

        // Transaction to ensure atomic docNo generation and insertion
        // Prisma transaction with retry logic for unique constraint
        let newDoc;
        let retries = 3;
        
        while (retries > 0) {
            try {
                newDoc = await prisma.$transaction(async (tx) => {
                    // Get the actual names for generating the document number
                    const deptObj = await tx.department.findUnique({ where: { id: realDeptId } });
                    const catObj = await tx.documentCategory.findUnique({ where: { id: realCatId } });
                    
                    if (!deptObj || !catObj) {
                        throw new Error("Invalid department or category for docNo generation");
                    }
                    
                    // Generate safe docNo inside the transaction
                    const generatedDocNo = await generateNextDocNo(deptObj.name, catObj.name, finalYear, tx);
                    
                    return await tx.document.create({
                        data: {
                            docNo: generatedDocNo,
                            name,
                            departmentId: realDeptId,
                            categoryId: realCatId,
                            uploadedById: realUploaderId,
                            filePath,
                            thaiYear: finalYear
                        },
                        include: {
                            category: true,
                            department: true,
                            uploadedBy: true
                        }
                    });
                });
                break; // Success, exit retry loop
            } catch (txError: any) {
                // If it's a unique constraint violation (P2002), retry
                if (txError.code === 'P2002' && retries > 1) {
                    console.warn(`Unique constraint caught generating docNo. Retrying... (${retries - 1} left)`);
                    retries--;
                    // Optional small delay
                    await new Promise(r => setTimeout(r, Math.random() * 200 + 100));
                } else {
                    throw txError; // Other errors or out of retries, bubble up
                }
            }
        }
        
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
            let dept;
            if (isUUID(departmentId)) {
                dept = await prisma.department.findUnique({ where: { id: departmentId } });
            } else {
                const deptName = departmentId === "ส่วนกลาง" ? "สำนักอำนวยการ" : departmentId;
                dept = await prisma.department.findFirst({ 
                    where: {
                        OR: [
                            { id: departmentId },
                            { name: deptName }
                        ]
                    },
                    orderBy: { thaiYear: 'desc' }
                });
            }

            if (dept) {
                // If the document has a specific year, ensure we use the department record for THAT year
                // Default to a sensible current year if not loaded yet
                const docToUpdate = await prisma.document.findUnique({ where: { id } });
                const docYear = docToUpdate?.thaiYear || 2569;

                if (dept.name && dept.thaiYear !== docYear) {
                    let yearDept = await prisma.department.findFirst({
                        where: { name: dept.name, thaiYear: docYear }
                    });

                    if (!yearDept) {
                        yearDept = await prisma.department.create({
                            data: {
                                name: dept.name,
                                subDepts: dept.subDepts || [],
                                theme: dept.theme || null,
                                thaiYear: docYear,
                                order: dept.order || 0
                            }
                        });
                    }
                    updateData.departmentId = yearDept.id;
                } else {
                    updateData.departmentId = dept.id;
                }
            }
        }

        if (categoryId) {
            if (isUUID(categoryId)) {
                updateData.categoryId = categoryId;
            } else {
                const cat = await prisma.documentCategory.findUnique({ where: { name: categoryId } });
                if (cat) updateData.categoryId = cat.id;
            }
        }

        if (uploadedById && uploadedById !== "user_id_placeholder") {
            updateData.uploadedById = uploadedById;
        }

        console.log("Update Data Prepared:", updateData);
        
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

        let updatedDoc;
        
        // If docNo is "(ออกเลขอัตโนมัติ)", we need to generate it inside a transaction
        // Normalized check to handle potential whitespace variations
        const isAutoNo = docNo && typeof docNo === 'string' && docNo.trim() === "(ออกเลขอัตโนมัติ)";
        
        if (isAutoNo) {
            let retries = 3;
            while (retries > 0) {
                try {
                    updatedDoc = await prisma.$transaction(async (tx) => {
                        // Get current document state to know year and category/dept if not provided in request
                        const currentDoc = await tx.document.findUnique({
                            where: { id },
                            include: { category: true, department: true }
                        });

                        if (!currentDoc) throw new Error("Document not found");

                        // Determine final IDs and Names for sequence generation
                        const targetDeptId = updateData.departmentId || currentDoc.departmentId;
                        const targetCatId = updateData.categoryId || currentDoc.categoryId;
                        const targetYear = currentDoc.thaiYear;

                        const deptObj = await tx.department.findUnique({ where: { id: targetDeptId } });
                        const catObj = await tx.documentCategory.findUnique({ where: { id: targetCatId } });

                        if (!deptObj || !catObj) {
                            throw new Error("Invalid department or category for docNo generation");
                        }

                        const generatedDocNo = await generateNextDocNo(deptObj.name, catObj.name, targetYear, tx);
                        updateData.docNo = generatedDocNo;

                        return await tx.document.update({
                            where: { id },
                            data: updateData,
                            include: {
                                category: true,
                                department: true,
                                uploadedBy: true
                            }
                        });
                    });
                    break; // Success
                } catch (txError: any) {
                    if (txError.code === 'P2002' && retries > 1) {
                        retries--;
                        console.log(`Unique constraint caught in update (docNo). Retrying... (${retries} left)`);
                    } else {
                        throw txError;
                    }
                }
            }
        } else {
            updatedDoc = await prisma.document.update({
                where: { id },
                data: updateData,
                include: {
                    category: true,
                    department: true,
                    uploadedBy: true
                }
            });
        }
        
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
