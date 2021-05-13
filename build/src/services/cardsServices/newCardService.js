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
exports.NewCard = void 0;
const config_1 = require("../../config/config");
const axios_1 = __importDefault(require("axios"));
class NewCard {
    createOrder(cardType) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const body = config_1.apiReqBody(`/cards/v2/persons/${config_1.QIWI_NUMBER}/orders`);
                const res = yield axios_1.default.post(body.url, { cardAlias: cardType }, body.config);
                return resolve(res.data);
            }
            catch (err) {
                return reject(err.response.data.description);
            }
        }));
    }
    submitOrder(id) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const body = config_1.apiReqBody(`/cards/v2/persons/${config_1.QIWI_NUMBER}/orders/${id}/submit`);
                const res = yield axios_1.default.put(body.url, {}, body.config);
                return resolve(res.data);
            }
            catch (err) {
                return reject(err.response.data.description);
            }
        }));
    }
    buyCard(data) {
        return new Promise((resolve, reject) => __awaiter(this, void 0, void 0, function* () {
            try {
                const body = config_1.apiReqBody('/sinap/api/v2/terms/32064/payments');
                body.data = {
                    id: new Date().getTime().toString(),
                    sum: {
                        amount: data.amount,
                        currency: '643'
                    },
                    paymentMethod: {
                        type: 'Account',
                        accountId: '643'
                    },
                    fields: {
                        account: config_1.QIWI_NUMBER,
                        order_id: data.order_id
                    }
                };
                const res = yield axios_1.default.post(body.url, body.data, body.config);
                return resolve(res.data);
            }
            catch (err) {
                return reject(err.response.data.description);
            }
        }));
    }
    newCard(cardType) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    this.createOrder(cardType)
                        .then((createOrderRes) => {
                        this.submitOrder(createOrderRes.id)
                            .then((submitOrderRes) => {
                            this.buyCard({ amount: submitOrderRes.price.amount, order_id: createOrderRes.id })
                                .then(() => {
                                return resolve('Карта была успешно создана.');
                            })
                                .catch((err) => {
                                return reject(err);
                            });
                        })
                            .catch((err) => {
                            return reject(err);
                        });
                    })
                        .catch((err) => {
                        return reject(err);
                    });
                }
                catch (err) {
                    return reject('Произошла ошибка при попытке покупки карт.');
                }
            });
        });
    }
}
exports.NewCard = NewCard;
