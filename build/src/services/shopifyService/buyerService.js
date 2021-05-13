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
exports.BuyerService = void 0;
const database_1 = require("../../../utils/database");
const config_1 = __importDefault(require("../../config/config"));
class BuyerService {
    getVerticals(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                const verticals = yield dbManager.selectData('public.verticals', '*');
                res.send(verticals);
            }
            catch (err) {
                console.log(err);
                return res.status(400).json({ msg: err.response.data.msg });
            }
        });
    }
    getHistory(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                const history = yield dbManager.selectData('public.history', '*');
                res.send(history);
            }
            catch (err) {
                console.log(err);
                return res.status(400).json({ msg: err.response.data.msg });
            }
        });
    }
    generateLink(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                const { user, vertical, pixel } = req.body;
                if (!vertical) {
                    return res.status(400).json({ msg: 'Выберите вертикаль' });
                }
                if (!pixel) {
                    return res.status(400).json({ msg: 'Выберите пиксель' });
                }
                const shopifyFromDb = yield dbManager.selectData('public.shopify', '*');
                const shopify = shopifyFromDb[0];
                if (!shopifyFromDb.length) {
                    return res.status(400).json({ msg: 'Нет свободных shopify' });
                }
                if (shopify) {
                    yield dbManager.deleteElement('*', 'public.shopify', 'id', shopify.id);
                }
                const url = new URL(vertical.pattern);
                url.hostname = shopify.domain;
                url.searchParams.set('click_api', vertical.clickapi);
                url.searchParams.set('pixel', pixel);
                url.searchParams.set('account_name', user);
                let readyUrl = decodeURI(url.href);
                readyUrl = readyUrl.replace(/(domain=)[^\&]+/g, '$1' + shopify.domain);
                yield dbManager.insertData('public.history', 'date, login, password, link', '$1, $2, $3, $4', [shopify.date, shopify.login, shopify.password, readyUrl]);
                res.send(readyUrl);
            }
            catch (err) {
                console.log(err);
                return res.status(400).json({ msg: err.response.data.msg });
            }
        });
    }
}
exports.BuyerService = BuyerService;
