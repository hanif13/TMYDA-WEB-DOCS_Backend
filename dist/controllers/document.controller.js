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
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteDocument = exports.updateDocument = exports.linkDocumentToProject = exports.createDocument = exports.getDocuments = void 0;
const prisma_1 = require("../lib/prisma");
const getDocuments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year } = req.query;
        const filter = {};
        if (year)
            filter.thaiYear = Number(year);
        const documents = yield prisma_1.prisma.document.findMany({
            where: filter,
            include: {
                category: true,
                department: true,
                uploadedBy: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(documents);
    }
    catch (error) {
        console.error("Error fetching documents:", error);
        res.status(500).json({ error: "Failed to fetch documents" });
    }
});
exports.getDocuments = getDocuments;
const createDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { docNo, name, departmentId, categoryId, uploadedById } = req.body;
        // Find real IDs if names were passed instead of UUIDs
        let realDeptId = departmentId;
        let realCatId = categoryId;
        let realUploaderId = uploadedById;
        // Simple check if it's a UUID (very basic)
        const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        if (!isUUID(departmentId)) {
            const dept = yield prisma_1.prisma.department.findUnique({ where: { name: departmentId === "ส่วนกลาง" ? "สำนักอำนวยการ" : departmentId } });
            if (dept)
                realDeptId = dept.id;
        }
        if (!isUUID(categoryId)) {
            const cat = yield prisma_1.prisma.documentCategory.findUnique({ where: { name: categoryId } });
            if (cat)
                realCatId = cat.id;
        }
        if (uploadedById === "user_id_placeholder") {
            const user = yield prisma_1.prisma.user.findFirst(); // Fallback for demo
            if (user)
                realUploaderId = user.id;
        }
        // The file path will be relative to the server for static serving
        const filePath = req.file ? `/uploads/documents/${req.file.filename}` : "";
        const newDoc = yield prisma_1.prisma.document.create({
            data: {
                docNo,
                name,
                departmentId: realDeptId,
                categoryId: realCatId,
                uploadedById: realUploaderId,
                filePath,
                thaiYear: req.body.thaiYear ? Number(req.body.thaiYear) : (req.body.year ? Number(req.body.year) : 2569)
            },
            include: {
                category: true,
                department: true,
                uploadedBy: true
            }
        });
        res.status(201).json(newDoc);
    }
    catch (error) {
        console.error("Error creating document:", error);
        res.status(500).json({ error: "Failed to create document" });
    }
});
exports.createDocument = createDocument;
const linkDocumentToProject = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const documentId = req.params.documentId;
        const { projectId } = req.body;
        const updatedDoc = yield prisma_1.prisma.document.update({
            where: { id: documentId },
            data: { projectId: projectId || null }
        });
        res.json(updatedDoc);
    }
    catch (error) {
        console.error("Error linking document:", error);
        res.status(500).json({ error: "Failed to link document" });
    }
});
exports.linkDocumentToProject = linkDocumentToProject;
const updateDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { docNo, name, departmentId, categoryId, uploadedById } = req.body;
        const isUUID = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
        let updateData = {};
        if (docNo)
            updateData.docNo = docNo;
        if (name)
            updateData.name = name;
        if (departmentId) {
            if (!isUUID(departmentId)) {
                const dept = yield prisma_1.prisma.department.findUnique({ where: { name: departmentId === "ส่วนกลาง" ? "สำนักอำนวยการ" : departmentId } });
                if (dept)
                    updateData.departmentId = dept.id;
            }
            else {
                updateData.departmentId = departmentId;
            }
        }
        if (categoryId) {
            if (!isUUID(categoryId)) {
                const cat = yield prisma_1.prisma.documentCategory.findUnique({ where: { name: categoryId } });
                if (cat)
                    updateData.categoryId = cat.id;
            }
            else {
                updateData.categoryId = categoryId;
            }
        }
        if (uploadedById && uploadedById !== "user_id_placeholder") {
            updateData.uploadedById = uploadedById;
        }
        if (req.file) {
            updateData.filePath = `/uploads/documents/${req.file.filename}`;
        }
        const updatedDoc = yield prisma_1.prisma.document.update({
            where: { id },
            data: updateData,
            include: {
                category: true,
                department: true,
                uploadedBy: true
            }
        });
        res.json(updatedDoc);
    }
    catch (error) {
        console.error("Error updating document:", error);
        res.status(500).json({ error: "Failed to update document" });
    }
});
exports.updateDocument = updateDocument;
const deleteDocument = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield prisma_1.prisma.document.delete({ where: { id } });
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting document:", error);
        res.status(500).json({ error: "Failed to delete document" });
    }
});
exports.deleteDocument = deleteDocument;
