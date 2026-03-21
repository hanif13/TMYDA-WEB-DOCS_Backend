"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const documentRequest_routes_1 = __importDefault(require("./routes/documentRequest.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const finance_routes_1 = __importDefault(require("./routes/finance.routes"));
const committee_routes_1 = __importDefault(require("./routes/committee.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const auth_middleware_1 = require("./middleware/auth.middleware");
// CORS — restrict to allowed origins only
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000')
    .split(',')
    .map(o => o.trim());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true
}));
app.use(express_1.default.json({ limit: '10mb' }));
// Protected static file serving — requires authentication
app.use('/uploads', auth_middleware_1.authenticateToken, express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// API Routes (public)
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
// Protected Data Routes
app.use('/api/documents', auth_middleware_1.authenticateToken, document_routes_1.default);
app.use('/api/document-requests', auth_middleware_1.authenticateToken, documentRequest_routes_1.default);
app.use('/api/projects', auth_middleware_1.authenticateToken, project_routes_1.default);
app.use('/api/finance', auth_middleware_1.authenticateToken, finance_routes_1.default);
app.use('/api/committee', auth_middleware_1.authenticateToken, committee_routes_1.default);
app.use('/api/departments', auth_middleware_1.authenticateToken, department_routes_1.default);
// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Fityatulhak API is running', status: 'ok' });
});
// Start the server
app.listen(port, () => {
    console.log(`🚀 Server is running on http://localhost:${port}`);
    console.log(`🔒 CORS allowed origins: ${allowedOrigins.join(', ')}`);
});
