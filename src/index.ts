import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { authenticateToken } from './middleware/auth.middleware';

// Routes imports
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import documentRoutes from './routes/document.routes';
import documentRequestRoutes from './routes/documentRequest.routes';
import projectRoutes from './routes/project.routes';
import financeRoutes from './routes/finance.routes';
import committeeRoutes from './routes/committee.routes';
import departmentRoutes from './routes/department.routes';

import { Bindings, Variables } from './middleware/auth.middleware';

const app = new Hono<{ Bindings: Bindings, Variables: Variables }>().basePath('/api');

// CORS — restrict to allowed origins only
app.use('*', async (c, next) => {
    const corsOrigins = (c.env.CORS_ORIGIN || 'http://localhost:3000')
        .split(',')
        .map((o: string) => o.trim());
    
    const corsMiddleware = cors({
        origin: corsOrigins,
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
    });
    
    return corsMiddleware(c, next);
});

// Health check
app.get('/', (c) => {
    return c.json({ message: 'Fityatulhak API (Edge) is running', status: 'ok' });
});

// API Routes (public)
app.route('/auth', authRoutes);
app.route('/users', userRoutes);

// Protected Data Routes
app.use('/documents/*', authenticateToken);
app.route('/documents', documentRoutes);

app.use('/document-requests/*', authenticateToken);
app.route('/document-requests', documentRequestRoutes);

app.use('/projects/*', authenticateToken);
app.route('/projects', projectRoutes);

app.use('/finance/*', authenticateToken);
app.route('/finance', financeRoutes);

app.use('/committee/*', authenticateToken);
app.route('/committee', committeeRoutes);

app.use('/departments/*', authenticateToken);
app.route('/departments', departmentRoutes);

export default app;
