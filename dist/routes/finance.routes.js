"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const finance_controller_1 = require("../controllers/finance.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_1 = require("../middleware/upload");
const router = (0, express_1.Router)();
// Read routes — any authenticated user can view
router.get('/', auth_middleware_1.authenticateToken, finance_controller_1.getTransactions);
router.get('/categories', auth_middleware_1.authenticateToken, finance_controller_1.getFinanceCategories);
router.get('/summary', auth_middleware_1.authenticateToken, finance_controller_1.getFinanceSummary);
// Write routes — SUPER_ADMIN and FINANCE only
router.post('/', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeFinance, upload_1.upload.single('evidence'), finance_controller_1.createTransaction);
router.patch('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeFinance, upload_1.upload.single('evidence'), finance_controller_1.updateTransaction);
router.delete('/:id', auth_middleware_1.authenticateToken, auth_middleware_1.authorizeFinance, finance_controller_1.deleteTransaction);
exports.default = router;
