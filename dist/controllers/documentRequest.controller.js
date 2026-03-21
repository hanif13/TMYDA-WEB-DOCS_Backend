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
const getDocumentRequests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const requests = yield prisma_1.prisma.documentRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    }
    catch (error) {
        console.error("Error fetching document requests:", error);
        res.status(500).json({ error: "Failed to fetch document requests" });
    }
});
exports.getDocumentRequests = getDocumentRequests;
const createDocumentRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { requestType, department, requestedBy, fields } = req.body;
        const newRequest = yield prisma_1.prisma.documentRequest.create({
            data: {
                requestType,
                department,
                requestedBy,
                fields: fields || {}
            }
        });
        res.status(201).json(newRequest);
    }
    catch (error) {
        console.error("Error creating document request:", error);
        res.status(500).json({ error: "Failed to create document request" });
    }
});
exports.createDocumentRequest = createDocumentRequest;
const updateDocumentRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { requestType, department, requestedBy, fields, status } = req.body;
        const updatedRequest = yield prisma_1.prisma.documentRequest.update({
            where: { id: id },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (requestType && { requestType })), (department && { department })), (requestedBy && { requestedBy })), (fields && { fields })), (status && { status }))
        });
        res.json(updatedRequest);
    }
    catch (error) {
        console.error("Error updating document request:", error);
        res.status(500).json({ error: "Failed to update document request" });
    }
});
exports.updateDocumentRequest = updateDocumentRequest;
const deleteDocumentRequest = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.prisma.documentRequest.delete({
            where: { id: id }
        });
        res.json({ message: "Document request deleted successfully" });
    }
    catch (error) {
        console.error("Error deleting document request:", error);
        res.status(500).json({ error: "Failed to delete document request" });
    }
});
exports.deleteDocumentRequest = deleteDocumentRequest;
