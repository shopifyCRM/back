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
exports.TransactionsService = void 0;
const database_1 = require("../../../utils/database");
const config_1 = __importDefault(require("../../config/config"));
const moment_1 = __importDefault(require("moment"));
const transactionsHelper_1 = require("./transactionsHelper");
class TransactionsService {
    constructor() {
        this.transactionsHelper = new transactionsHelper_1.TransactionsHelper();
    }
    getTransactions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                let { users, timestamp } = req.body;
                const dbRes = yield dbManager.findElement('*', 'public.transactions', 'timestamp', timestamp);
                const result = [];
                users.forEach((user) => {
                    if (user.access !== 'Owner') {
                        let sum = 0;
                        const filtered = dbRes.filter((transaction) => transaction.userlogin === user.login);
                        filtered[0].transactions.forEach((transaction) => {
                            if (transaction.sum) {
                                sum += transaction.sum;
                            }
                        });
                        filtered[0].sum = sum;
                        result.push(filtered[0]);
                    }
                });
                res.send({
                    timestamp,
                    result
                });
            }
            catch (err) {
                console.log(err);
                return res.status(400).json({ msg: 'Произошла ошибка при попытке получения переводов.' });
            }
        });
    }
    renderTransactions(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { users, user } = req.body;
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                const allTransactions = yield dbManager.selectData('public.transactions', '*');
                const date = this.getCurrentDate();
                if (user.access === 'Owner') {
                    const transactions = yield this.setAndRenderTransactionsForAdmin(users, date, allTransactions);
                    return res.send(transactions);
                }
                else {
                    const transactions = yield this.setAndRenderTransactionsForUser(user, date, allTransactions);
                    return res.send(transactions);
                }
            }
            catch (err) {
                console.log(err);
                return res.status(400).json({ msg: 'Произошла ошибка при попытке получения переводов.' });
            }
        });
    }
    getCurrentDate() {
        return moment_1.default().format('MM-DD-YYYY');
    }
    setAndRenderTransactionsForAdmin(users, currentDate, allTransactions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    const dbManager = new database_1.DatabaseManager(config_1.default.db);
                    users.forEach((user) => {
                        this.transactionsHelper.renderTransactions(allTransactions, currentDate, user, dbManager).then((transactions) => {
                            return resolve(transactions);
                        });
                    });
                }
                catch (err) {
                    console.log(err);
                    reject(err);
                }
            });
        });
    }
    setAndRenderTransactionsForUser(user, currentDate, allTransactions) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    const dbManager = new database_1.DatabaseManager(config_1.default.db);
                    this.transactionsHelper.renderTransactions(allTransactions, currentDate, user, dbManager).then((transactions) => {
                        return resolve(transactions);
                    });
                }
                catch (err) {
                    console.log(err);
                    reject(err);
                }
            });
        });
    }
}
exports.TransactionsService = TransactionsService;
