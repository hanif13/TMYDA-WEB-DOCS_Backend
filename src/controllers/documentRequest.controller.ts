import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDocumentRequests = async (req: Request, res: Response) => {
    try {
        const requests = await prisma.documentRequest.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(requests);
    } catch (error) {
        console.error("Error fetching document requests:", error);
        res.status(500).json({ error: "Failed to fetch document requests" });
    }
};

export const createDocumentRequest = async (req: Request, res: Response) => {
    try {
        const { requestType, department, requestedBy, fields } = req.body;
        
        const newRequest = await prisma.documentRequest.create({
            data: {
                requestType,
                department,
                requestedBy,
                fields: fields || {}
            }
        });
        
        res.status(201).json(newRequest);
    } catch (error) {
        console.error("Error creating document request:", error);
        res.status(500).json({ error: "Failed to create document request" });
    }
};

export const updateDocumentRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { requestType, department, requestedBy, fields, status } = req.body;
        
        const updatedRequest = await prisma.documentRequest.update({
            where: { id: id as string },
            data: {
                ...(requestType && { requestType }),
                ...(department && { department }),
                ...(requestedBy && { requestedBy }),
                ...(fields && { fields }),
                ...(status && { status })
            }
        });
        
        res.json(updatedRequest);
    } catch (error) {
        console.error("Error updating document request:", error);
        res.status(500).json({ error: "Failed to update document request" });
    }
};

export const deleteDocumentRequest = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.documentRequest.delete({
            where: { id: id as string }
        });
        res.json({ message: "Document request deleted successfully" });
    } catch (error) {
        console.error("Error deleting document request:", error);
        res.status(500).json({ error: "Failed to delete document request" });
    }
};
