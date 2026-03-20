import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { prisma } from './lib/prisma';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

import documentRoutes from './routes/document.routes';
import documentRequestRoutes from './routes/documentRequest.routes';
import projectRoutes from './routes/project.routes';
import financeRoutes from './routes/finance.routes';
import departmentRoutes from './routes/department.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { authenticateToken } from './middleware/auth.middleware';

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Request logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Protected Data Routes
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/document-requests', authenticateToken, documentRequestRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/finance', authenticateToken, financeRoutes);
app.use('/api/departments', authenticateToken, departmentRoutes);

// Basic Route for testing
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Welcome to Fityatulhak API' });
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

// Graceful shutdown
// process.on('beforeExit', async () => {
//     await prisma.$disconnect();
// });
