"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const transliteration_controller_1 = require("../controllers/transliteration.controller");
const router = (0, express_1.Router)();
// Public routes (authenticated)
router.get('/', auth_middleware_1.authenticateToken, transliteration_controller_1.getTransliterations);
router.get('/categories', auth_middleware_1.authenticateToken, transliteration_controller_1.getCategories);
router.post('/', auth_middleware_1.authenticateToken, transliteration_controller_1.createTransliteration);
router.post('/bulk', auth_middleware_1.authenticateToken, transliteration_controller_1.bulkCreateTransliterations);
router.patch('/:id', auth_middleware_1.authenticateToken, transliteration_controller_1.updateTransliteration);
router.delete('/bulk', auth_middleware_1.authenticateToken, transliteration_controller_1.bulkDeleteTransliterations);
router.delete('/:id', auth_middleware_1.authenticateToken, transliteration_controller_1.deleteTransliteration);
exports.default = router;
