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
exports.AdminService = void 0;
const database_1 = require("../../../utils/database");
const config_1 = __importDefault(require("../../config/config"));
class AdminService {
    constructor() {
        this.helper = new AdminHelper();
        this.prepareToRes = this.helper.prepareToRes;
    }
    getStaff(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                const staffRes = yield dbManager.selectData('public.staff', '*');
                if (staffRes.length === 0) {
                    return res.status(400).json({ msg: 'У вас нет персонала.' });
                }
                const staff = this.prepareToRes(staffRes);
                res.send(staff);
            }
            catch (err) {
                return res.status(400).json({ msg: err.response.data.msg });
            }
        });
    }
}
exports.AdminService = AdminService;
class AdminHelper {
    prepareToRes(staffRes) {
        const staff = [];
        staffRes.forEach((el) => {
            staff.push({
                id: el.id,
                name: el.name,
                access: el.access,
                login: el.login,
                cards: el.cards
            });
        });
        return staff;
    }
}
