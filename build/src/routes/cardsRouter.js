"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const qiwiService_1 = require("../services/cardsServices/qiwiService");
const balanceService_1 = require("../services/cardsServices/balanceService");
const router = require('express').Router();
const qiwiRoutes = new qiwiService_1.QiwiService();
const qiwiBalance = new balanceService_1.BalanceService();
//Qiwi api controllers
router.post('/getCardsData', qiwiRoutes.getCardsDataForTable.bind(qiwiRoutes));
router.post('/newCard', qiwiRoutes.newCard.bind(qiwiRoutes));
router.put('/addOwnerToCards', qiwiRoutes.addOwnerToCards.bind(qiwiRoutes));
router.get('/getBalance', qiwiBalance.getBalance.bind(qiwiBalance));
router.post('/getTransactions', qiwiRoutes.getTransactionHistory.bind(qiwiRoutes));
router.put('/blockCard', qiwiRoutes.blockCard.bind(qiwiRoutes));
module.exports = router;
