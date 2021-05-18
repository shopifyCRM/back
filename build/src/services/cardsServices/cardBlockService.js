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
exports.CardBlockService = void 0;
const config_1 = require("../../config/config");
const axios_1 = __importDefault(require("axios"));
const renderAllCards_1 = require("./renderAllCards");
class CardBlockService {
    blockCard(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const { cards } = req.body;
                const renderCards = new renderAllCards_1.RenderAllCards();
                yield this.blockCards(cards);
                yield renderCards.renderAllCards();
                if (!cards) {
                    return res.status(400).json({ msg: 'Выберите карту.' });
                }
                if (cards.length === 1) {
                    return res.send(`Карта ${cards[0].cardnumber} была успешно заблокирована.`);
                }
                return res.send('Выбранные карты были успешно заблокированы.');
            }
            catch (err) {
                console.log(err);
                return res.status(400).json({ msg: err.response.data.msg });
            }
        });
    }
    blockCards(cards) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < cards.length; i++) {
                const body = config_1.apiReqBody(`/cards/v2/persons/${config_1.QIWI_NUMBER}/cards/${cards[i].id}/block`);
                yield axios_1.default.put(body.url, {}, body.config);
            }
        });
    }
}
exports.CardBlockService = CardBlockService;
