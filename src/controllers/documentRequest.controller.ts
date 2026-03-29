import { Request, Response } from 'express';
import { prisma } from '../lib/prisma';

export const getDocumentRequests = async (req: Request, res: Response) => {
    try {
        const { year } = req.query;
        console.log("Fetching document requests for year:", year);
        const where: any = {};
        if (year && !isNaN(parseInt(year as string))) {
            where.thaiYear = parseInt(year as string);
        }

        console.log("Query where clause:", JSON.stringify(where));
        
        const requests = await prisma.documentRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        
        console.log(`Found ${requests.length} requests`);
        res.json(requests);
    } catch (error) {
        console.error("DETAILED ERROR Fetching document requests:", error);
        res.status(500).json({ error: "Failed to fetch document requests", details: error instanceof Error ? error.message : String(error) });
    }
};

export const createDocumentRequest = async (req: Request, res: Response) => {
    try {
        const { requestType, department, requestedBy, fields, thaiYear } = req.body;
        
        const newRequest = await prisma.documentRequest.create({
            data: {
                requestType,
                department,
                requestedBy,
                fields: fields || {},
                ...(thaiYear && { thaiYear: parseInt(thaiYear as string) })
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
