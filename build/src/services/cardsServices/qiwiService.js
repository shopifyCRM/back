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
exports.QiwiService = void 0;
const config_1 = __importStar(require("../../config/config"));
const axios_1 = __importDefault(require("axios"));
const database_1 = require("../../../utils/database");
const uuid_1 = require("uuid");
const newCardService_1 = require("./newCardService");
const cardOwnerService_1 = require("./cardOwnerService");
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
    blockCard(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { card } = req.body;
                const body = config_1.apiReqBody(`/cards/v2/persons/${config_1.QIWI_NUMBER}/cards/${card[0].id}/block`);
                if (!card) {
                    return res.status(400).json({ msg: 'Выберите карту.' });
                }
                yield axios_1.default.put(body.url, {}, body.config);
                return res.send(`Карта ${card.cardnumber} была успешно заблокирована.`);
            }
            catch (err) {
                console.log(err);
                return res.status(400).json({ msg: err.response.data.msg });
            }
        });
    }
    getCardsDataForTable(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                let allCards = yield this.getCards.bind(this.helper)();
                const cardIds = yield this.getIdsFromCards(allCards);
                let { user } = req.body;
                user = user.data;
                if (user.access !== 'Owner') {
                    if (!user.cards.length) {
                        return res.status(400).json({ msg: 'У вас нету карт.' });
                    }
                    const cardsToRes = [];
                    const ownerCards = yield this.ownerCards.bind(this.helper)(user, cardsToRes);
                    return res.send(ownerCards);
                }
                const cardsFromDbRes = yield dbManager.selectData('public.cards', '*');
                const date = this.getDate(1);
                const dailyTransactions = yield this.getTransactions(date);
                const cardsToRes = [];
                for (let i = 0, max = allCards.length; i < max; i++) {
                    const body = config_1.apiReqBody(`/cards/v1/cards/${cardIds[i]}/details`);
                    const uuid = uuid_1.v4();
                    body.data = {
                        operationId: uuid
                    };
                    if (cardsFromDbRes.find((card) => card.id === allCards[i].qvx.id) === undefined) {
                        if (allCards[i].qvx.status === 'ACTIVE') {
                            const qiwiApiRes = yield axios_1.default.put(body.url, body.data, body.config);
                            if (qiwiApiRes.data.status === 'OK') {
                                allCards.forEach((el) => {
                                    const qvx = el.qvx;
                                    const expiresAt = this.getExpiresAt(qvx);
                                    if (qvx.id === cardIds[i]) {
                                        dbManager.insertData('public.cards', 'id, cvv, cardnumber, expiresat', '$1, $2, $3, $4', [qvx.id, qiwiApiRes.data.cvv, qiwiApiRes.data.pan, expiresAt]);
                                        const cardData = {
                                            id: qvx.id,
                                            cvv: qiwiApiRes.data.cvv,
                                            cardnumber: qiwiApiRes.data.pan,
                                            ownerlogin: null,
                                            ownername: null,
                                            expiresAt
                                        };
                                        const transactions = this.countCardTransactionsSum(qiwiApiRes.data.pan, dailyTransactions);
                                        if (transactions.cardnumber === qiwiApiRes.data.pan) {
                                            cardData.sum = transactions.sum;
                                        }
                                        cardsToRes.push(cardData);
                                    }
                                });
                            }
                        }
                    }
                    else {
                        const card = allCards.find((el) => el.qvx.id === cardsFromDbRes[i].id);
                        if (card.qvx.status === 'ACTIVE') {
                            let cardData = cardsFromDbRes[i];
                            const transactions = this.countCardTransactionsSum(cardData.cardnumber, dailyTransactions);
                            if (transactions.cardnumber === cardData.cardnumber) {
                                cardData.sum = transactions.sum;
                            }
                            cardsToRes.push(cardData);
                        }
                        else {
                            if (cardsFromDbRes[i].ownerlogin) {
                                let existingUserRes = yield dbManager.findElement('*', 'public.staff', 'login', cardsFromDbRes[i].ownerlogin);
                                const user = existingUserRes[0];
                                user.cards = user.cards.filter((cardnumber) => cardnumber !== cardsFromDbRes[i].cardnumber);
                                yield dbManager.updateElement('public.staff', user, 'id', user.id);
                            }
                            yield dbManager.deleteElement('*', 'public.cards', 'id', cardsFromDbRes[i].id);
                        }
                    }
                }
                res.send(cardsToRes);
            }
            catch (err) {
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
                const date = this.getDate(89);
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
    getDate(days) {
        const today = new Date();
        let getYesterday = new Date(today);
        getYesterday = getYesterday.setDate(getYesterday.getDate() - days);
        const from = encodeURIComponent(new Date(getYesterday).toISOString().slice(0, -5) + '+03:00');
        const till = encodeURIComponent(today.toISOString().slice(0, -5) + '+03:00');
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
            if (el.type === 'OUT') {
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
            const dbManager = new database_1.DatabaseManager(config_1.default.db);
            const date = this.getDate(1);
            const dailyTransactions = yield this.getTodayTransactions(date);
            for (let i = 0, max = user.cards.length; i < max; i++) {
                const rows = yield dbManager.findElement('*', 'public.cards', 'id', user.cards[i]);
                const cardData = rows[0];
                const transactions = this.countCardTransactionSum(cardData.cardnumber, dailyTransactions);
                if (transactions.cardnumber === cardData.cardnumber) {
                    cardData.sum = transactions.sum;
                }
                cardsToRes.push(cardData);
            }
            return cardsToRes;
        });
    }
}
