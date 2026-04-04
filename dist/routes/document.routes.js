"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const document_controller_1 = require("../controllers/document.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.get('/categories', document_controller_1.getDocumentCategories);
router.get('/', document_controller_1.getDocuments);
// Handle single document file upload
router.post('/', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, upload_1.upload.single('file'), document_controller_1.createDocument);
router.patch('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, upload_1.upload.single('file'), document_controller_1.updateDocument);
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, document_controller_1.deleteDocument);
router.patch('/:documentId/link', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, document_controller_1.linkDocumentToProject);
exports.default = router;
