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
const uuid_1 = require("uuid");
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
                const result = yield this.transactionsHelper.countUserTransactions(dbRes, users);
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
    getTransactionsBetweenTimestamps(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                let { users, timestampfrom, timestamptill } = req.body;
                const dbRes = yield dbManager.selectData('public.transactions', '*');
                const filteredData = dbRes.filter((el) => el.timestamp >= timestampfrom && el.timestamp <= timestamptill);
                let result = yield this.transactionsHelper.countUserTransactions(filteredData, users);
                result = yield this.transactionsHelper.timestampSort(result);
                const timestamp = timestampfrom + ' - ' + timestamptill;
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
    addTransaction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                let { timestamp, amount, comment, id } = req.body;
                if (!amount) {
                    return res.status(400).json({ msg: 'Введите сумму транзакции.' });
                }
                if (!comment) {
                    return res.status(400).json({ msg: 'Введите комментарий к транзакции.' });
                }
                const foundTransaction = yield dbManager.findElement('*', 'public.transactions', 'id', id);
                const foundEl = foundTransaction[0];
                const transactionId = uuid_1.v4();
                foundEl.transactions = [...foundEl.transactions, { timestamp, amount, comment, id: transactionId }];
                dbManager.updateElement('public.transactions', foundEl, 'id', id);
                return res.send('Транзакция была успешно добавлена.');
            }
            catch (err) {
                console.log(err);
                return res.status(400).json({ msg: 'Произошла ошибка при попытке добавления транзакции.' });
            }
        });
    }
    deleteTransaction(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                let { id, transactionId } = req.body;
                const foundTransactions = yield dbManager.findElement('*', 'public.transactions', 'id', id);
                const foundEl = foundTransactions[0];
                if (foundEl) {
                    foundEl.transactions = foundEl.transactions.filter((el) => el.id !== transactionId);
                }
                yield dbManager.updateElement('public.transactions', foundEl, 'id', id);
                return res.send('Транзакция была успешно уделена.');
            }
            catch (err) {
                console.log(err);
                return res.status(400).json({ msg: 'Произошла ошибка при попытке удалении транзакции.' });
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
                        if (user.cards) {
                            this.transactionsHelper.renderTransactions(allTransactions, currentDate, user, dbManager).then((transactions) => {
                                return resolve(transactions);
                            });
                        }
                        return resolve(true);
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
                    if (user.cards) {
                        this.transactionsHelper.renderTransactions(allTransactions, currentDate, user, dbManager).then((transactions) => {
                            return resolve(transactions);
                        });
                    }
                    return resolve(true);
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
