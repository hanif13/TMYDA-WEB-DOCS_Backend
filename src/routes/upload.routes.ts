import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Configure storage
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, 'img-' + uniqueSuffix + ext);
    }
});

const upload = multer({ 
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('รองรับเฉพาะไฟล์รูปภาพ (jpg, png, webp, gif) เท่านั้น'));
    }
});

// @route   POST /api/upload
// @desc    Upload multiple images
// @access  Authenticated
router.post('/', authenticateToken as any, upload.array('files', 15), (req: any, res: any) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'ไม่พบไฟล์ที่อัปโหลด' });
        }

        // Generate URLs
        // Note: In production, you'd use a real domain. For local, we use relative or absolute from backend.
        const urls = files.map(file => {
            return `/uploads/${file.filename}`;
        });

        res.json({ urls });
    } catch (error: any) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปโหลด', message: error.message });
    }
});

export default router;
