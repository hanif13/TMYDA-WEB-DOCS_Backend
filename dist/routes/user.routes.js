"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const user_controller_1 = require("../controllers/user.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All user routes require authentication and admin/super-admin role
router.get('/', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, user_controller_1.getUsers);
router.post('/', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, user_controller_1.createUser);
router.put('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, user_controller_1.updateUser);
router.patch('/:id/permissions', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, user_controller_1.updatePermissions);
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeAdmin, user_controller_1.deleteUser);
exports.default = router;
