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
exports.reorderDepartments = exports.deleteDepartment = exports.updateDepartment = exports.createDepartment = exports.getDepartments = void 0;
const prisma_1 = require("../lib/prisma");
const getDepartments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { year, scope } = req.query;
        let where = {};
        if (scope === 'committee') {
            if (year && year !== 'all') {
                const yearInt = parseInt(year.toString(), 10);
                where.NOT = { hiddenInCommitteeYears: { has: yearInt } };
                where.OR = [
                    { thaiYear: yearInt },
                    { isCommitteeOnly: false }
                ];
            }
        }
        else {
            where.isCommitteeOnly = false;
        }
        const departmentsData = yield prisma_1.prisma.department.findMany({
            where,
            orderBy: [{ order: 'asc' }]
        });
        // Unique filter to prevent duplicates (if any old cloned data remains)
        const uniqueMap = new Map();
        departmentsData.forEach(d => {
            if (!uniqueMap.has(d.name)) {
                uniqueMap.set(d.name, d);
            }
        });
        return res.json(Array.from(uniqueMap.values()));
    }
    catch (error) {
        console.error("Error fetching departments:", error);
        return res.status(500).json({ error: "Failed to fetch departments" });
    }
});
exports.getDepartments = getDepartments;
const createDepartment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, subDepts, theme, order, thaiYear, isCommitteeOnly } = req.body;
        const department = yield prisma_1.prisma.department.create({
            data: {
                name,
                subDepts: subDepts || [],
                theme: theme || null,
                order: order ? parseInt(order.toString()) : 0,
                thaiYear: thaiYear ? parseInt(thaiYear.toString()) : 2567,
                isCommitteeOnly: isCommitteeOnly === true || isCommitteeOnly === 'true'
            }
        });
        return res.status(201).json(department);
    }
    catch (error) {
        console.error("Error creating department:", error);
        return res.status(500).json({ error: "Failed to create department" });
    }
});
exports.createDepartment = createDepartment;
const updateDepartment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { name, subDepts, theme, order } = req.body;
        const department = yield prisma_1.prisma.department.update({
            where: { id },
            data: {
                name,
                subDepts,
                theme,
                order: order !== undefined ? parseInt(order.toString()) : undefined
            }
        });
        return res.json(department);
    }
    catch (error) {
        console.error("Error updating department:", error);
        return res.status(500).json({ error: "Failed to update department" });
    }
});
exports.updateDepartment = updateDepartment;
const deleteDepartment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const dept = yield prisma_1.prisma.department.findUnique({ where: { id } });
        if (!dept) {
            return res.status(404).json({ error: "Department not found" });
        }
        // Cascading delete members first
        yield prisma_1.prisma.committeeMember.deleteMany({
            where: { departmentId: id }
        });
        if (!dept.isCommitteeOnly) {
            const reqYear = req.query.year;
            if (reqYear) {
                const yearInt = parseInt(reqYear, 10);
                if (!dept.hiddenInCommitteeYears.includes(yearInt)) {
                    yield prisma_1.prisma.department.update({
                        where: { id },
                        data: { hiddenInCommitteeYears: { push: yearInt } }
                    });
                }
            }
            return res.status(204).send();
        }
        // Committee-only department, delete fully
        yield prisma_1.prisma.department.delete({ where: { id } });
        return res.status(204).send();
    }
    catch (error) {
        console.error("Error deleting department:", error);
        return res.status(500).json({ error: "Failed to delete department" });
    }
});
exports.deleteDepartment = deleteDepartment;
const reorderDepartments = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { orders } = req.body; // Array of { id, order }
        if (!Array.isArray(orders)) {
            return res.status(400).json({ error: "Invalid orders format" });
        }
        yield prisma_1.prisma.$transaction(orders.map((item) => prisma_1.prisma.department.update({
            where: { id: item.id },
            data: { order: item.order }
        })));
        return res.json({ message: "Reordered successfully" });
    }
    catch (error) {
        console.error("Error reordering departments:", error);
        return res.status(500).json({ error: "Failed to reorder departments" });
    }
});
exports.reorderDepartments = reorderDepartments;
