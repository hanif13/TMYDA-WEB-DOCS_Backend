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
exports.createCommitteeBulk = exports.updateCommitteeMember = exports.deleteCommitteeMember = exports.createCommitteeMember = exports.getCommitteeMembers = void 0;
const prisma_1 = require("../lib/prisma");
const getCommitteeMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year } = req.query;
        const where = {};
        if (year && !isNaN(parseInt(year))) {
            where.thaiYear = parseInt(year);
        }
        const members = yield prisma_1.prisma.committeeMember.findMany({
            where,
            include: {
                department: true
            },
            orderBy: [
                { departmentId: 'asc' },
                { order: 'asc' }
            ]
        });
        res.json(members);
    }
    catch (error) {
        console.error("DEBUG - Error fetching committee members:", error);
        res.status(500).json({
            error: "Failed to fetch committee members",
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});
exports.getCommitteeMembers = getCommitteeMembers;
const createCommitteeMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, position, phoneNumber, email, occupation, departmentId, order, thaiYear } = req.body;
        const photoUrl = req.file ? `/uploads/documents/${req.file.filename}` : "";
        const member = yield prisma_1.prisma.committeeMember.create({
            data: {
                name,
                position,
                phoneNumber,
                email,
                occupation,
                photoUrl,
                departmentId,
                order: Number(order) || 0,
                thaiYear: Number(thaiYear) || 2569
            }
        });
        res.status(201).json(member);
    }
    catch (error) {
        console.error("Error creating committee member:", error);
        res.status(500).json({ error: "Failed to create committee member" });
    }
});
exports.createCommitteeMember = createCommitteeMember;
const deleteCommitteeMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma_1.prisma.committeeMember.delete({
            where: { id }
        });
        res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting committee member:", error);
        res.status(500).json({ error: "Failed to delete committee member" });
    }
});
exports.deleteCommitteeMember = deleteCommitteeMember;
const updateCommitteeMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { name, position, phoneNumber, email, occupation, departmentId, order, thaiYear } = req.body;
        const dataToUpdate = {};
        if (name !== undefined)
            dataToUpdate.name = name;
        if (position !== undefined)
            dataToUpdate.position = position;
        if (phoneNumber !== undefined)
            dataToUpdate.phoneNumber = phoneNumber;
        if (email !== undefined)
            dataToUpdate.email = email;
        if (occupation !== undefined)
            dataToUpdate.occupation = occupation;
        if (departmentId !== undefined)
            dataToUpdate.departmentId = departmentId;
        if (order !== undefined)
            dataToUpdate.order = Number(order);
        if (thaiYear !== undefined)
            dataToUpdate.thaiYear = Number(thaiYear);
        if (req.file) {
            dataToUpdate.photoUrl = `/uploads/documents/${req.file.filename}`;
        }
        const member = yield prisma_1.prisma.committeeMember.update({
            where: { id },
            data: dataToUpdate
        });
        res.json(member);
    }
    catch (error) {
        console.error("Error updating committee member:", error);
        res.status(500).json({ error: "Failed to update committee member" });
    }
});
exports.updateCommitteeMember = updateCommitteeMember;
const createCommitteeBulk = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const members = req.body;
        if (!Array.isArray(members)) {
            return res.status(400).json({ error: "Invalid data format. Expected an array." });
        }
        const result = yield prisma_1.prisma.committeeMember.createMany({
            data: members.map((m) => ({
                name: m.name,
                position: m.position,
                phoneNumber: m.phoneNumber || "",
                email: m.email || "",
                occupation: m.occupation || "",
                departmentId: m.departmentId || "admin",
                order: Number(m.order) || 0,
                thaiYear: Number(m.thaiYear) || 2567
            }))
        });
        res.status(201).json({ message: "Imported successfully", count: result.count });
    }
    catch (error) {
        console.error("Error bulk creating committee members:", error);
        res.status(500).json({ error: "Failed to import committee members" });
    }
});
exports.createCommitteeBulk = createCommitteeBulk;
