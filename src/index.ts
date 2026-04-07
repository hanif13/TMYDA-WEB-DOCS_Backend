import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

// Routes imports
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import documentRoutes from './routes/document.routes';
import documentRequestRoutes from './routes/documentRequest.routes';
import projectRoutes from './routes/project.routes';
import financeRoutes from './routes/finance.routes';
import committeeRoutes from './routes/committee.routes';
import departmentRoutes from './routes/department.routes';
import uploadRoutes from './routes/upload.routes';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api', (req, res) => {
    res.json({ message: 'Fityatulhak API is running (Node.js/Express)', status: 'ok' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/document-requests', documentRequestRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/committee', committeeRoutes);
app.use('/api/upload', uploadRoutes);

// Serve static files from uploads folder
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`🔥 Uncaught Exception: ${err.message}`);
    console.error(err.stack);
    res.status(500).json({ 
        error: 'เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์', 
        message: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined 
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});

export default app;
