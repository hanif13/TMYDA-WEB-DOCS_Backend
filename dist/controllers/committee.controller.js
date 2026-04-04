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
exports.reorderCommitteeMembers = exports.createCommitteeBulk = exports.deleteCommitteeMember = exports.updateCommitteeMember = exports.createCommitteeMember = exports.getCommitteeMembers = void 0;
const prisma_1 = require("../lib/prisma");
const supabase_1 = require("../lib/supabase");
const getCommitteeMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year } = req.query;
        let where = {};
        if (year) {
            where.thaiYear = parseInt(year.toString());
        }
        const members = yield prisma_1.prisma.committeeMember.findMany({
            where,
            include: { department: true },
            orderBy: { order: 'asc' }
        });
        return res.json(members);
    }
    catch (error) {
        console.error("Error fetching committee members:", error);
        return res.status(500).json({ error: "Failed to fetch committee members" });
    }
});
exports.getCommitteeMembers = getCommitteeMembers;
const createCommitteeMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, position, role, departmentId, phoneNumber, email, occupation, order, thaiYear } = req.body;
        const file = req.file;
        let photoUrl = "";
        if (file) {
            const extension = file.originalname.split('.').pop() || 'tmp';
            const fileName = `comm-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
            const { data, error } = yield supabase_1.supabaseAdmin.storage
                .from('uploads')
                .upload(`committees/${fileName}`, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });
            if (error)
                throw error;
            const { data: { publicUrl } } = supabase_1.supabaseAdmin.storage
                .from('uploads')
                .getPublicUrl(`committees/${fileName}`);
            photoUrl = publicUrl;
        }
        const newMember = yield prisma_1.prisma.committeeMember.create({
            data: {
                name,
                position: position || role || "",
                departmentId,
                phoneNumber: phoneNumber || null,
                email: email || null,
                occupation: occupation || null,
                order: order ? parseInt(order.toString()) : 0,
                photoUrl,
                thaiYear: thaiYear ? Number(thaiYear) : 2567
            },
            include: { department: true }
        });
        return res.status(201).json(newMember);
    }
    catch (error) {
        console.error("Error creating committee member:", error);
        return res.status(500).json({ error: "Failed to create committee member" });
    }
});
exports.createCommitteeMember = createCommitteeMember;
const updateCommitteeMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { name, position, role, departmentId, phoneNumber, email, occupation, order } = req.body;
        const file = req.file;
        let updateData = {};
        if (name)
            updateData.name = name;
        if (position || role)
            updateData.position = position || role;
        if (departmentId)
            updateData.departmentId = departmentId;
        if (phoneNumber !== undefined)
            updateData.phoneNumber = phoneNumber;
        if (email !== undefined)
            updateData.email = email;
        if (occupation !== undefined)
            updateData.occupation = occupation;
        if (order !== undefined)
            updateData.order = parseInt(order.toString());
        if (req.body.thaiYear !== undefined)
            updateData.thaiYear = Number(req.body.thaiYear);
        if (file) {
            const extension = file.originalname.split('.').pop() || 'tmp';
            const fileName = `comm-${Date.now()}-${Math.round(Math.random() * 1e9)}.${extension}`;
            const { data, error } = yield supabase_1.supabaseAdmin.storage
                .from('uploads')
                .upload(`committees/${fileName}`, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });
            if (error)
                throw error;
            const { data: { publicUrl } } = supabase_1.supabaseAdmin.storage
                .from('uploads')
                .getPublicUrl(`committees/${fileName}`);
            updateData.photoUrl = publicUrl;
        }
        const updatedMember = yield prisma_1.prisma.committeeMember.update({
            where: { id },
            data: updateData,
            include: { department: true }
        });
        return res.json(updatedMember);
    }
    catch (error) {
        console.error("Error updating committee member:", error);
        return res.status(500).json({ error: "Failed to update committee member" });
    }
});
exports.updateCommitteeMember = updateCommitteeMember;
const deleteCommitteeMember = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        yield prisma_1.prisma.committeeMember.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting committee member:", error);
        return res.status(500).json({ error: "Failed to delete committee member" });
    }
});
exports.deleteCommitteeMember = deleteCommitteeMember;
const createCommitteeBulk = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { committees } = req.body;
        if (!Array.isArray(committees)) {
            return res.status(400).json({ error: "Invalid data format" });
        }
        const result = yield prisma_1.prisma.committeeMember.createMany({
            data: committees.map((comm) => ({
                name: comm.name,
                position: comm.position || comm.role || "",
                departmentId: comm.departmentId,
                phoneNumber: comm.phoneNumber || null,
                email: comm.email || null,
                photoUrl: comm.photoUrl || comm.imageUrl || "",
                order: comm.order || 0,
                thaiYear: comm.thaiYear ? Number(comm.thaiYear) : 2567
            }))
        });
        return res.status(201).json({ message: "Imported successfully", count: result.count });
    }
    catch (error) {
        console.error("Error bulk creating committee members:", error);
        return res.status(500).json({ error: "Failed to import committee members" });
    }
});
exports.createCommitteeBulk = createCommitteeBulk;
const reorderCommitteeMembers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orders } = req.body; // Array of { id, order, departmentId? }
        if (!Array.isArray(orders)) {
            return res.status(400).json({ error: "Invalid orders format" });
        }
        yield prisma_1.prisma.$transaction(orders.map((item) => prisma_1.prisma.committeeMember.update({
            where: { id: item.id },
            data: {
                order: item.order,
                departmentId: item.departmentId
            }
        })));
        return res.json({ message: "Reordered successfully" });
    }
    catch (error) {
        console.error("Error reordering committee members:", error);
        return res.status(500).json({ error: "Failed to reorder committee members" });
    }
});
exports.reorderCommitteeMembers = reorderCommitteeMembers;
