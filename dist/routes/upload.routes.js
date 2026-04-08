"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const supabase_1 = require("../lib/supabase");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Configure memory storage since Vercel is read-only
const storage = multer_1.default.memoryStorage();
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
// @desc    Upload multiple images via Supabase
// @access  Authenticated
router.post('/', auth_middleware_1.authenticateToken, upload.array('files', 15), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: 'ไม่พบไฟล์ที่อัปโหลด' });
        }
        const urls = [];
        for (const file of files) {
            const ext = path_1.default.extname(file.originalname);
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const fileName = `img-${uniqueSuffix}${ext}`;
            const { data, error } = yield supabase_1.supabaseAdmin.storage
                .from('uploads')
                .upload(`images/${fileName}`, file.buffer, {
                contentType: file.mimetype,
                upsert: true
            });
            if (error) {
                console.error("Supabase upload error for file", file.originalname, error);
                throw error;
            }
            const { data: { publicUrl } } = supabase_1.supabaseAdmin.storage
                .from('uploads')
                .getPublicUrl(`images/${fileName}`);
            urls.push(publicUrl);
        }
        res.json({ urls });
    }
    catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'เกิดข้อผิดพลาดในการอัปโหลด', message: error.message });
    }
}));
exports.default = router;
