import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { supabaseAdmin } from '../lib/supabase';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Configure memory storage since Vercel is read-only
const storage = multer.memoryStorage();

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
// @desc    Upload multiple images via Supabase
// @access  Authenticated
router.post('/', authenticateToken as any, upload.array('files', 15), async (req: any, res: any) => {
    try {
        const files = req.files as Express.Multer.File[];
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'ไม่พบไฟล์ที่อัปโหลด' });
        }

        const urls: string[] = [];

        for (const file of files) {
            const ext = path.extname(file.originalname);
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const fileName = `img-${uniqueSuffix}${ext}`;
            
            const { data, error } = await supabaseAdmin.storage
                .from('uploads')
                .upload(`images/${fileName}`, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) {
                console.error("Supabase upload error for file", file.originalname, error);
                throw error;
            }

            const { data: { publicUrl } } = supabaseAdmin.storage
                .from('uploads')
                .getPublicUrl(`images/${fileName}`);
                
            urls.push(publicUrl);
        }

        res.json({ urls });
    } catch (error: any) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปโหลด', message: error.message });
    }
});

export default router;
