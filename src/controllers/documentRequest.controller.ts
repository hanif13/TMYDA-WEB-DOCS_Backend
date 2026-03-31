import { Context } from 'hono';
import { getPrisma } from '../lib/prisma';
import { Bindings, Variables } from '../middleware/auth.middleware';

export const getDocumentRequests = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const year = c.req.query('year');
        const prisma = getPrisma(c.env.DATABASE_URL);
        const where: any = {};
        if (year && !isNaN(parseInt(year))) {
            where.thaiYear = parseInt(year);
        }

        const requests = await prisma.documentRequest.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });
        
        return c.json(requests);
    } catch (error) {
        console.error("DETAILED ERROR Fetching document requests:", error);
        return c.json({ 
            error: "Failed to fetch document requests", 
            details: error instanceof Error ? error.message : String(error) 
        }, 500);
    }
};

export const createDocumentRequest = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const { requestType, department, requestedBy, fields, thaiYear } = await c.req.json();
        const prisma = getPrisma(c.env.DATABASE_URL);
        
        const newRequest = await prisma.documentRequest.create({
            data: {
                requestType,
                department,
                requestedBy,
                fields: fields || {},
                ...(thaiYear && { thaiYear: parseInt(thaiYear as string) })
            }
        });
        
        return c.json(newRequest, 201);
    } catch (error) {
        console.error("Error creating document request:", error);
        return c.json({ error: "Failed to create document request" }, 500);
    }
};

export const updateDocumentRequest = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const id = c.req.param('id');
        const { requestType, department, requestedBy, fields, status } = await c.req.json();
        const prisma = getPrisma(c.env.DATABASE_URL);
        
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
        
        return c.json(updatedRequest);
    } catch (error) {
        console.error("Error updating document request:", error);
        return c.json({ error: "Failed to update document request" }, 500);
    }
};

export const deleteDocumentRequest = async (c: Context<{ Bindings: Bindings, Variables: Variables }>) => {
    try {
        const id = c.req.param('id');
        const prisma = getPrisma(c.env.DATABASE_URL);
        await prisma.documentRequest.delete({
            where: { id: id as string }
        });
        return c.json({ message: "Document request deleted successfully" });
    } catch (error) {
        console.error("Error deleting document request:", error);
        return c.json({ error: "Failed to delete document request" }, 500);
    }
};
