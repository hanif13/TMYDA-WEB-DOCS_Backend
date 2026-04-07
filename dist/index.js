"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
// Routes imports
const auth_routes_1 = __importDefault(require("./routes/auth.routes"));
const user_routes_1 = __importDefault(require("./routes/user.routes"));
const document_routes_1 = __importDefault(require("./routes/document.routes"));
const documentRequest_routes_1 = __importDefault(require("./routes/documentRequest.routes"));
const project_routes_1 = __importDefault(require("./routes/project.routes"));
const finance_routes_1 = __importDefault(require("./routes/finance.routes"));
const committee_routes_1 = __importDefault(require("./routes/committee.routes"));
const department_routes_1 = __importDefault(require("./routes/department.routes"));
const upload_routes_1 = __importDefault(require("./routes/upload.routes"));
const path_1 = __importDefault(require("path"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, morgan_1.default)('dev'));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health check
app.get('/api', (req, res) => {
    res.json({ message: 'Fityatulhak API is running (Node.js/Express)', status: 'ok' });
});
// API Routes
app.use('/api/auth', auth_routes_1.default);
app.use('/api/users', user_routes_1.default);
app.use('/api/documents', document_routes_1.default);
app.use('/api/document-requests', documentRequest_routes_1.default);
app.use('/api/projects', project_routes_1.default);
app.use('/api/finance', finance_routes_1.default);
app.use('/api/departments', department_routes_1.default);
app.use('/api/committee', committee_routes_1.default);
app.use('/api/upload', upload_routes_1.default);
// Serve static files from uploads folder
app.use('/uploads', express_1.default.static(path_1.default.join(process.cwd(), 'uploads')));
// Global Error Handler
app.use((err, req, res, next) => {
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
exports.default = app;
