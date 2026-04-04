"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const committee_controller_1 = require("../controllers/committee.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
router.get('/', committee_controller_1.getCommitteeMembers);
router.post('/bulk', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, committee_controller_1.createCommitteeBulk);
router.put('/reorder', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, committee_controller_1.reorderCommitteeMembers);
// Handle single image upload for committee member
router.post('/', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, upload_1.upload.single('image'), committee_controller_1.createCommitteeMember);
router.patch('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, upload_1.upload.single('image'), committee_controller_1.updateCommitteeMember);
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, committee_controller_1.deleteCommitteeMember);
exports.default = router;
