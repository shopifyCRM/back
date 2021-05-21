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
exports.TransactionsHelper = void 0;
const qiwiService_1 = require("../cardsServices/qiwiService");
const database_1 = require("../../../utils/database");
const uuid_1 = require("uuid");
const config_1 = __importDefault(require("../../config/config"));
class TransactionsHelper {
    constructor() {
        this.helper = new qiwiService_1.QiwiServiceHelper();
    }
    renderTransactions(allTransactions, currentDate, user, dbManager) {
        return new Promise((resolve, reject) => {
            try {
                const elWithCurrentDate = allTransactions.find((el) => el.timestamp === currentDate && el.userlogin === user.login);
                const cardToRes = [];
                this.helper.getOwnerCards(user, cardToRes).then((userCardsRes) => {
                    if (elWithCurrentDate) {
                        ;
                        (() => __awaiter(this, void 0, void 0, function* () {
                            yield this.renderExistingCards(userCardsRes, elWithCurrentDate, dbManager);
                            dbManager.selectData('public.transactions', '*').then((transactions) => {
                                return resolve(transactions);
                            });
                        }))();
                    }
                    else {
                        ;
                        (() => __awaiter(this, void 0, void 0, function* () {
                            const transactionsAddedInDb = yield this.addTransactionInDb(user, userCardsRes, currentDate);
                            return resolve(transactionsAddedInDb);
                        }))();
                    }
                });
            }
            catch (err) {
                reject(err);
            }
        });
    }
    renderExistingCards(userCardsRes, elWithCurrentDate, dbManager) {
        return new Promise((resolve, reject) => {
            try {
                userCardsRes.forEach((card) => {
                    const cardExistsInDb = elWithCurrentDate.transactions.find((el) => el.cardnumber === card.cardnumber);
                    if (!cardExistsInDb) {
                        card['key'] = uuid_1.v4();
                        elWithCurrentDate.transactions = [...elWithCurrentDate.transactions, card];
                    }
                    elWithCurrentDate.transactions.map((el) => {
                        if (el.cardnumber === card.cardnumber) {
                            if (el.sum !== card.sum) {
                                console.log(true);
                                el.sum = card.sum;
                                return el;
                            }
                        }
                    });
                    dbManager.updateElement('public.transactions', elWithCurrentDate, 'id', elWithCurrentDate.id);
                    resolve(true);
                });
            }
            catch (err) {
                console.log(err);
                reject(err);
            }
        });
    }
    addTransactionInDb(user, userCardsRes, currentDate) {
        return new Promise((resolve, reject) => {
            const dbManager = new database_1.DatabaseManager(config_1.default.db);
            try {
                const userCardsTransactions = userCardsRes.map((el) => {
                    el['key'] = uuid_1.v4();
                    return el;
                });
                if (user.access !== 'Owner') {
                    ;
                    (() => __awaiter(this, void 0, void 0, function* () {
                        yield dbManager.insertData('public.transactions', 'userlogin, timestamp, transactions', '$1, $2, $3', [user.login, currentDate, userCardsTransactions]);
                    }))();
                    return resolve({
                        userlogin: user.login,
                        timestamp: currentDate,
                        transactions: userCardsTransactions
                    });
                }
                else {
                    return;
                }
            }
            catch (err) {
                console.log(err);
                reject(err);
            }
        });
    }
}
exports.TransactionsHelper = TransactionsHelper;
