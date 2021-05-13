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
exports.ShopifyCreationService = void 0;
const database_1 = require("../../../utils/database");
const config_1 = __importDefault(require("../../config/config"));
class ShopifyCreationService {
    constructor() {
        this.helper = new ShopifyCreationHelper();
        this.verticalReqChecker = this.helper.verticalReqChecker;
    }
    addNewShopify(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                //shopify is in plural :)
                const { freshShopify } = req.body;
                const shopifyInDb = yield dbManager.selectData('public.shopify', '*');
                freshShopify.forEach((el) => {
                    let found = shopifyInDb.find((elInDb) => {
                        delete elInDb.id;
                        return Object.entries(elInDb).toString() === Object.entries(el).toString();
                    });
                    if (!found) {
                        dbManager.insertData('public.shopify', 'date, time, login, password, domain', '$1, $2, $3, $4, $5', [el.date, el.time, el.login, el.password, el.domain]);
                    }
                });
                res.send(true);
            }
            catch (err) {
                console.log(err);
                res.status(400).json({ msg: 'Произошла ошибка при попытке добавления вертикалей' });
            }
        });
    }
    addVertical(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                const { vertical } = req.body;
                const verticalsInDb = yield dbManager.selectData('public.verticals', '*');
                vertical.id = +vertical.id;
                let found = verticalsInDb.find((verticalInDb) => {
                    return Object.entries(verticalInDb).toString() === Object.entries(vertical).toString();
                });
                this.verticalReqChecker(vertical)
                    .then(() => {
                    if (!found) {
                        dbManager.insertData('public.verticals', 'id, name, clickapi, pattern', '$1, $2, $3, $4', [vertical.id, vertical.name, vertical.clickapi, vertical.pattern]);
                        return res.send(true);
                    }
                    else {
                        return res.status(400).json({ msg: 'Вертикаль с таким id уже существует' });
                    }
                })
                    .catch((err) => {
                    return res.status(400).json(err);
                });
            }
            catch (err) {
                console.log(err);
                res.status(400).json({ msg: 'Произошла ошибка при попытке добавления вертикалей' });
            }
        });
    }
    getAddedShopify(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                const shopifyFromDb = yield dbManager.selectData('public.shopify', '*');
                res.send(shopifyFromDb);
            }
            catch (err) {
                console.log(err);
                res.status(400).json({ msg: 'Произошла ошибка при попытке получения shopify' });
            }
        });
    }
}
exports.ShopifyCreationService = ShopifyCreationService;
class ShopifyCreationHelper {
    verticalReqChecker(vertical) {
        return new Promise((resolve, reject) => {
            if (!vertical.id) {
                return reject({ msg: 'Введите id вертикали' });
            }
            if (!vertical.clickapi) {
                return reject({ msg: 'Введите Click API вертикали' });
            }
            if (!vertical.name) {
                return reject({ msg: 'Введите название вертикали' });
            }
            if (!vertical.pattern) {
                return reject({ msg: 'Введите шаблон вертикали' });
            }
            return resolve(true);
        });
    }
}
