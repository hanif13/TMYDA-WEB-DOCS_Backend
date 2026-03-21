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
import committeeRoutes from './routes/committee.routes';
import departmentRoutes from './routes/department.routes';
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import { authenticateToken } from './middleware/auth.middleware';

// CORS — restrict to allowed origins only
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Protected static file serving — requires authentication
app.use('/uploads', authenticateToken, express.static(path.join(process.cwd(), 'uploads')));

// API Routes (public)
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);

// Protected Data Routes
app.use('/api/documents', authenticateToken, documentRoutes);
app.use('/api/document-requests', authenticateToken, documentRequestRoutes);
app.use('/api/projects', authenticateToken, projectRoutes);
app.use('/api/finance', authenticateToken, financeRoutes);
app.use('/api/committee', authenticateToken, committeeRoutes);
app.use('/api/departments', authenticateToken, departmentRoutes);

// Health check
app.get('/', (req: Request, res: Response) => {
    res.json({ message: 'Fityatulhak API is running', status: 'ok' });
});

// Start the server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`🔒 CORS allowed origins: ${allowedOrigins.join(', ')}`);
});
