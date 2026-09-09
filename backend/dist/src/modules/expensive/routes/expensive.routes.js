"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const expensive_controller_1 = require("../controller/expensive.controller");
const errorHandles_1 = require("../../../middleware/errorHandles");
const router = (0, express_1.Router)();
router.use(errorHandles_1.authenticateToken);
// Endpoint para obtener todos los gastos registrados
router.get('/', expensive_controller_1.getExpenses);
// Endpoint para crear nuevo gasto
router.post('/', expensive_controller_1.createExpense);
router.put('/:id', expensive_controller_1.editExpense);
router.delete('/:id', expensive_controller_1.removeExpense);
exports.default = router;
