"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.QiwiServiceHelper = exports.QiwiService = void 0;
const config_1 = __importStar(require("../../config/config"));
const axios_1 = __importDefault(require("axios"));
const database_1 = require("../../../utils/database");
const newCardService_1 = require("./newCardService");
const cardOwnerService_1 = require("./cardOwnerService");
const renderAllCards_1 = require("./renderAllCards");
const moment_1 = __importDefault(require("moment"));
class QiwiService {
    constructor() {
        this.helper = new QiwiServiceHelper();
        this.getIdsFromCards = this.helper.getIdsFromCards;
        this.getCards = this.helper.getAllCards;
        this.getExpiresAt = this.helper.getExpireTime;
        this.getTransactions = this.helper.getTodayTransactions;
        this.getDate = this.helper.getDate;
        this.countCardTransactionsSum = this.helper.countCardTransactionSum;
        this.ownerCards = this.helper.getOwnerCards;
        this.removeCardFromOwner = this.helper.removeCardFromUser;
    }
    newCard(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const newCardHelper = new newCardService_1.NewCard();
                const { cardType } = req.body;
                const msg = yield newCardHelper.newCard(cardType);
                res.send(msg);
            }
            catch (err) {
                return res.status(400).json({ msg: 'Произошла ошибка при попытке покупки карт.' });
            }
        });
    }
    getCardsDataForTable(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let { user } = req.body;
                if (user.access !== 'Owner') {
                    if (!user.cards.length) {
                        return res.status(400).json({ msg: 'У вас нету карт.' });
                    }
                    const cardsToRes = [];
                    const ownerCards = yield this.ownerCards.call(this.helper, user, cardsToRes);
                    return res.send(ownerCards);
                }
                const renderAllCardsHelper = new renderAllCards_1.RenderAllCards();
                const cardsToRes = yield renderAllCardsHelper.renderAllCards.apply(this);
                res.send(cardsToRes);
            }
            catch (err) {
                console.log(err);
                return res.status(400).json({ msg: 'Произошла ошибка при попытке получения карт.' });
            }
        });
    }
    addOwnerToCards(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { user, cards } = req.body;
                const cardOwner = new cardOwnerService_1.CardOwnerService();
                const msg = yield cardOwner.addOwnerToCards(user, cards);
                res.send(msg);
            }
            catch (err) {
                return res.status(400).json({ msg: err.msg });
            }
        });
    }
    getTransactionHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { card } = req.body;
                const date = this.getDate(90, 'manyDays');
                const transactions = yield this.getTransactions(date);
                const cardTransactions = transactions.data.filter((el) => el.account.slice(-4) === card[0].cardnumber.slice(-4));
                const resTransactions = {};
                let transactionsSum = 0;
                cardTransactions.map((transaction) => {
                    const day = transaction.date.slice(0, 10);
                    const time = transaction.date.slice(11, -9);
                    if (typeof resTransactions[day] === 'undefined') {
                        resTransactions[day] = [];
                    }
                    resTransactions[day].push({ time: time, sum: transaction.sum.amount, status: transaction.status });
                    transactionsSum += transaction.sum.amount;
                });
                res.send({ transactions: resTransactions, transactionsSum });
            }
            catch (err) {
                console.log(err);
                res.status(400).json({ msg: err.response.data.msg });
            }
        });
    }
}
exports.QiwiService = QiwiService;
class QiwiServiceHelper {
    getIdsFromCards(allCards = []) {
        return __awaiter(this, void 0, void 0, function* () {
            const cards = allCards !== [] ? allCards : yield this.getAllCards();
            const cardIds = [];
            for (let i = 0, max = cards.length; i <= max; i++) {
                if (cards[i]) {
                    cardIds.push(cards[i].qvx.id);
                }
            }
            return cardIds;
        });
    }
    getAllCards() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = config_1.apiReqBody('/cards/v1/cards/?vas-alias=qvc-master');
                let qiwiApiRes = yield axios_1.default.get(body.url, body.config);
                return qiwiApiRes.data;
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    getExpireTime(qvx) {
        const expiresAtMonth = qvx.cardExpireMonth;
        const expiresAtYear = qvx.cardExpireYear.slice(-2);
        const expiresAt = expiresAtMonth + '/' + expiresAtYear;
        return expiresAt;
    }
    getDate(days, type) {
        const today = new Date();
        let getYesterday = new Date(today);
        if (type === 'manyDays') {
            getYesterday = getYesterday.setDate(getYesterday.getDate() - days);
            getYesterday = new Date(getYesterday);
        }
        else if (type === 'yesterday') {
            getYesterday = moment_1.default().utcOffset(0);
            getYesterday.set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
            getYesterday.toISOString();
            getYesterday.format();
        }
        const from = encodeURIComponent(getYesterday.toISOString().slice(0, -5) + '+03:00');
        const till = encodeURIComponent(moment_1.default().utcOffset(0).set({ hour: 23, minute: 59, second: 59, millisecond: 59 }).toISOString().slice(0, -5) + '+03:00');
        return { from, till };
    }
    getTodayTransactions(queryDate) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const body = config_1.apiReqBody(`/payment-history/v2/persons/${config_1.QIWI_NUMBER}/payments?rows=50&operation=QIWI_CARD&startDate=${queryDate.from}&endDate=${queryDate.till}`);
                    const res = yield axios_1.default.get(body.url, body.config);
                    return resolve(res.data);
                }
                catch (err) {
                    console.log(err);
                    return resolve({
                        status: 404,
                        error: err.response.data.description,
                        value: null
                    });
                }
            }));
        });
    }
    countCardTransactionSum(cardnumber, cardsTransactions) {
        let cardTransactionsSum = 0;
        const cardTransactions = cardsTransactions.data.filter((el) => el.account.slice(-4) === cardnumber.slice(-4));
        cardTransactions.map((el) => {
            if (el.status !== 'ERROR') {
                cardTransactionsSum += el.total.amount;
            }
        });
        return {
            cardnumber: cardnumber,
            sum: Math.floor(cardTransactionsSum)
        };
    }
    getOwnerCards(user, cardsToRes) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                const date = this.getDate(1, 'yesterday');
                const dailyTransactions = yield this.getTodayTransactions(date);
                if (Array.isArray(user.cards)) {
                    for (let i = 0, max = user.cards.length; i < max; i++) {
                        const rows = yield dbManager.findElement('*', 'public.cards', 'id', user.cards[i]);
                        const cardData = rows[0];
                        if (!cardData) {
                            yield this.removeCardFromUser(user, user.cards[i]);
                        }
                        else {
                            if (cardData.ownerlogin === user.login) {
                                const transactions = this.countCardTransactionSum(cardData.cardnumber, dailyTransactions);
                                if (transactions.cardnumber === cardData.cardnumber) {
                                    cardData.sum = transactions.sum;
                                }
                                cardsToRes.push(cardData);
                            }
                            else {
                                yield this.removeCardFromUser(user, cardData.id);
                            }
                        }
                    }
                }
                return cardsToRes;
            }
            catch (err) {
                console.log(err);
            }
        });
    }
    removeCardFromUser(user, card) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                user.cards = user.cards.filter((el) => el !== card);
                yield dbManager.updateElement('public.staff', user, 'login', user.login);
            }
            catch (err) {
                console.log(err);
            }
        });
    }
}
exports.QiwiServiceHelper = QiwiServiceHelper;
