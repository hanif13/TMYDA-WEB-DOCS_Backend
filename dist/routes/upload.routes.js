"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path_1.default.join(process.cwd(), 'uploads');
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'img-' + uniqueSuffix + ext);
    }
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (jpg, png, webp, gif) เท่านั้น'));
    }
});
// @route   POST /api/upload
// @desc    Upload multiple images
// @access  Authenticated
router.post('/', auth_middleware_1.authenticateToken, upload.array('files', 15), (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'ไม่พบไฟล์ที่อัปโหลด' });
        }
        // Generate URLs
        // Note: In production, you'd use a real domain. For local, we use relative or absolute from backend.
        const urls = files.map(file => {
            return `/uploads/${file.filename}`;
        });
        res.json({ urls });
    }
    catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปโหลด', message: error.message });
    }
});
exports.default = router;
