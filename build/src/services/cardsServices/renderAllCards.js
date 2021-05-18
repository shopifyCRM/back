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
exports.RenderAllCards = void 0;
const config_1 = __importStar(require("../../config/config"));
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
const database_1 = require("../../../utils/database");
const qiwiService_1 = require("./qiwiService");
class RenderAllCards {
    constructor() {
        this.helper = new qiwiService_1.QiwiServiceHelper();
        this.getIdsFromCards = this.helper.getIdsFromCards;
        this.getCards = this.helper.getAllCards;
        this.getExpiresAt = this.helper.getExpireTime;
        this.getTransactions = this.helper.getTodayTransactions;
        this.getDate = this.helper.getDate;
        this.countCardTransactionsSum = this.helper.countCardTransactionSum;
    }
    renderAndReturnAllCards(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const cards = yield this.renderAllCards.apply(this);
                res.send(cards);
            }
            catch (err) {
                console.log(err);
                return res.status(400).json({ msg: 'Произошла ошибка при попытке получения карт.' });
            }
        });
    }
    renderAllCards() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                let allCards = yield this.getCards.apply(this.helper);
                const cardIds = yield this.getIdsFromCards(allCards);
                const cardsFromDbRes = yield dbManager.selectData('public.cards', '*');
                const date = this.getDate(1, 'yesterday');
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
                        let card;
                        allCards.forEach((el) => {
                            if (cardsFromDbRes[i]) {
                                if (el.qvx.id === cardsFromDbRes[i].id) {
                                    card = el;
                                }
                            }
                        });
                        if (card) {
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
                }
                return cardsToRes;
            }
            catch (err) {
                console.log(err);
            }
        });
    }
}
exports.RenderAllCards = RenderAllCards;
