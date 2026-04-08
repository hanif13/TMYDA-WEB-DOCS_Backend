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
exports.deleteDocumentRequest = exports.updateDocumentRequest = exports.createDocumentRequest = exports.getDocumentRequests = void 0;
const prisma_1 = require("../lib/prisma");
// Removed unused doc-utils as createDocument logic handles numbering
const getDocumentRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year } = req.query;
        const user = req.user;
        const where = {};
        if (year && !isNaN(parseInt(year))) {
            where.thaiYear = parseInt(year);
        }
        // Privacy Fix: If not Admin/SuperAdmin, only show own requests
        if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            where.requestedById = user.userId;
        }
        const requests = yield prisma_1.prisma.documentRequest.findMany({
            where,
            include: { resultDoc: true },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(requests);
    }
    catch (error) {
        console.error("Error fetching document requests:", error);
        return res.status(500).json({
            error: "Failed to fetch document requests",
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
exports.getDocumentRequests = getDocumentRequests;
const createDocumentRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requestType, department, requestedBy, fields, thaiYear } = req.body;
        const user = req.user;
        const newRequest = yield prisma_1.prisma.documentRequest.create({
            data: Object.assign({ requestType,
                department,
                requestedBy, requestedById: user === null || user === void 0 ? void 0 : user.userId, fields: fields || {} }, (thaiYear && { thaiYear: parseInt(thaiYear) }))
        });
        return res.status(201).json(newRequest);
    }
    catch (error) {
        console.error("Error creating document request:", error);
        return res.status(500).json({ error: "Failed to create document request" });
    }
});
exports.createDocumentRequest = createDocumentRequest;
const updateDocumentRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { requestType, department, requestedBy, fields, status, resultDocId } = req.body;
        const updatedRequest = yield prisma_1.prisma.documentRequest.update({
            where: { id: id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (requestType && { requestType })), (department && { department })), (requestedBy && { requestedBy })), (fields && { fields })), (status && { status })), (resultDocId !== undefined && { resultDocId }))
        });
        return res.json(updatedRequest);
    }
    catch (error) {
        console.error("Error updating document request:", error);
        return res.status(500).json({
            error: "Failed to update document request",
            details: error instanceof Error ? error.message : String(error)
        });
    }
});
exports.updateDocumentRequest = updateDocumentRequest;
const deleteDocumentRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield prisma_1.prisma.documentRequest.delete({
            where: { id: id }
        });
        return res.json({ message: "Document request deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting document request:", error);
        return res.status(500).json({ error: "Failed to delete document request" });
    }
});
exports.deleteDocumentRequest = deleteDocumentRequest;
