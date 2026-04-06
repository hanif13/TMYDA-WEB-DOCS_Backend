"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const multer_1 = __importDefault(require("multer"));
const router = (0, express_1.Router)();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// Self-service routes (any authenticated user)
router.get('/me', auth_middleware_1.authenticateToken, user_controller_1.getProfile);
router.put('/me', auth_middleware_1.authenticateToken, user_controller_1.updateMe);
router.put('/me/password', auth_middleware_1.authenticateToken, user_controller_1.changePassword);
// Admin routes (GET for ADMIN/SUPER_ADMIN, others for SUPER_ADMIN only)
router.get('/', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, user_controller_1.getUsers);
router.post('/', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeSuperAdmin, user_controller_1.createUser);
router.post('/upload', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeSuperAdmin, upload.single('file'), user_controller_1.bulkUploadUsers);
router.put('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeSuperAdmin, user_controller_1.updateUser);
router.patch('/:id/permissions', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeSuperAdmin, user_controller_1.updatePermissions);
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeSuperAdmin, user_controller_1.deleteUser);
exports.default = router;
