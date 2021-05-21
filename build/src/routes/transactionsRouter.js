"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const transactionsService_1 = require("../services/transactionsService/transactionsService");
const router = require('express').Router();
const transactionsService = new transactionsService_1.TransactionsService();
router.post('/renderTransactions', transactionsService.renderTransactions.bind(transactionsService));
router.post('/getTransactions', transactionsService.getTransactions.bind(transactionsService));
module.exports = router;
