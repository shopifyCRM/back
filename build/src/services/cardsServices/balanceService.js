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
exports.BalanceService = void 0;
const config_1 = require("../../config/config");
const axios_1 = __importDefault(require("axios"));
class BalanceService {
    getBalance(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const body = config_1.apiReqBody(`/funding-sources/v2/persons/${config_1.QIWI_NUMBER}/accounts`);
                const balanceRes = yield axios_1.default.get(body.url, body.config);
                if (balanceRes.status === 200) {
                    const balanceData = balanceRes.data.accounts[0];
                    if (balanceData.hasBalance) {
                        return res.send({ amount: balanceData.balance.amount, status: 200 });
                    }
                }
            }
            catch (err) {
                return res.status(400).json({ msg: 'Произошла ошибка при попытке получения баланса.' });
            }
        });
    }
}
exports.BalanceService = BalanceService;
