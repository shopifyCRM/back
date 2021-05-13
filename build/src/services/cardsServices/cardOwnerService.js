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
exports.CardOwnerService = void 0;
const database_1 = require("../../../utils/database");
const config_1 = __importDefault(require("../../config/config"));
class CardOwnerService {
    addOwnerToCards(user, cards) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                try {
                    const dbManager = new database_1.DatabaseManager(config_1.default.db);
                    if (!user) {
                        reject({ msg: 'Выберите пользователя.' });
                    }
                    if (!cards.length) {
                        reject({ msg: 'Выберите карты.' });
                    }
                    let updatedUser = user;
                    if (!updatedUser.cards) {
                        updatedUser.cards = [];
                    }
                    cards.forEach((card) => {
                        if (card.ownerlogin) {
                            ;
                            (() => __awaiter(this, void 0, void 0, function* () {
                                const existingUserRes = yield dbManager.findElement('*', 'public.staff', 'login', card.ownerlogin);
                                const existingUser = existingUserRes[0];
                                if (existingUser.id !== user.id) {
                                    existingUser.cards = existingUser.cards.filter((el) => el !== card.id);
                                    yield dbManager.updateElement('public.staff', existingUser, 'id', existingUser.id);
                                    card.ownerlogin = null;
                                    card.ownername = null;
                                }
                            }))();
                        }
                        if (!updatedUser.cards.includes(card.id)) {
                            card.ownerlogin = user.login;
                            card.ownername = user.name;
                            updatedUser.cards.push(card.id);
                            delete card.sum;
                            dbManager.updateElement('public.cards', card, 'id', card.id);
                        }
                    });
                    dbManager.updateElement('public.staff', updatedUser, 'id', updatedUser.id);
                    resolve('Карты были успешно добавлены к владельцу.');
                }
                catch (err) {
                    reject({ msg: 'Произошла ошибка при попытке присвоения карт.' });
                }
            });
        });
    }
}
exports.CardOwnerService = CardOwnerService;
