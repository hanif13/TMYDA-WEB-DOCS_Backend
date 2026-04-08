import { Response } from 'express';
import { prisma } from '../lib/prisma';
import { AuthRequest } from '../middleware/auth.middleware';
// Removed unused doc-utils as createDocument logic handles numbering

export const getDocumentRequests = async (req: AuthRequest, res: Response) => {
    try {
        const { year } = req.query;
        const user = req.user;
        const where: any = {};
        
        if (year && !isNaN(parseInt(year as string))) {
            where.thaiYear = parseInt(year as string);
        }

        // Privacy Fix: If not Admin/SuperAdmin, only show own requests
        if (user && user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
            where.requestedById = user.userId;
        }

        const requests = await prisma.documentRequest.findMany({
            where,
            include: { resultDoc: true },
            orderBy: { createdAt: 'desc' }
        });
        
        return res.json(requests);
    } catch (error) {
        console.error("Error fetching document requests:", error);
        return res.status(500).json({ 
            error: "Failed to fetch document requests", 
            details: error instanceof Error ? error.message : String(error) 
        });
    }
};

export const createDocumentRequest = async (req: AuthRequest, res: Response) => {
    try {
        const { requestType, department, requestedBy, fields, thaiYear } = req.body;
        const user = req.user;
        
        const newRequest = await prisma.documentRequest.create({
            data: {
                requestType,
                department,
                requestedBy, // The display name
                requestedById: user?.userId, // The unique identifier
                fields: fields || {},
                ...(thaiYear && { thaiYear: parseInt(thaiYear as string) })
            }
        });
        
        return res.status(201).json(newRequest);
    } catch (error) {
        console.error("Error creating document request:", error);
        return res.status(500).json({ error: "Failed to create document request" });
    }
};

export const updateDocumentRequest = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        const { requestType, department, requestedBy, fields, status, resultDocId } = req.body;
        
        const updatedRequest = await prisma.documentRequest.update({
            where: { id: id as string },
            data: {
                ...(requestType && { requestType }),
                ...(department && { department }),
                ...(requestedBy && { requestedBy }),
                ...(fields && { fields }),
                ...(status && { status }),
                ...(resultDocId !== undefined && { resultDocId })
            }
        });
        
        return res.json(updatedRequest);
    } catch (error) {
        console.error("Error updating document request:", error);
        return res.status(500).json({ 
            error: "Failed to update document request",
            details: error instanceof Error ? error.message : String(error)
        });
    }
};

export const deleteDocumentRequest = async (req: AuthRequest, res: Response) => {
    try {
        const id = req.params.id as string;
        await prisma.documentRequest.delete({
            where: { id: id as string }
        });
        return res.json({ message: "Document request deleted successfully" });
    } catch (error) {
        console.error("Error deleting document request:", error);
        return res.status(500).json({ error: "Failed to delete document request" });
    }
};
