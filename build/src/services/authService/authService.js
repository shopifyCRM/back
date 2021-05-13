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
exports.AuthRouter = void 0;
const checker_1 = require("../../../utils/checker");
const database_1 = require("../../../utils/database");
const config_1 = __importDefault(require("../../config/config"));
const auth = require('../../../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const jwt_decode = require('jwt-decode');
class AuthRouter {
    register(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const pm = new checker_1.PasswordManager();
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                let { name, access, login, password, confirmPassword } = req.body;
                if (!name || !access || !login || !password || !confirmPassword) {
                    return res.status(400).json({ msg: 'Введите все поля.' });
                }
                const existingUserByLogin = yield dbManager.findElement('*', 'public.staff', 'login', login);
                if (existingUserByLogin.length) {
                    return res.status(400).json({ msg: 'Пользователь с таким логином уже существует.' });
                }
                const passwordCheck = yield pm.hashPassword(password, confirmPassword);
                if (!passwordCheck.status) {
                    return res.status(400).json({ msg: passwordCheck.msg });
                }
                name = name.charAt(0).toUpperCase() + name.slice(1);
                yield dbManager.insertData('public.staff', 'name, access, Login, password', '$1, $2, $3, $4', [name, access, login, passwordCheck.passwordHash]);
                res.send({
                    name,
                    access,
                    login
                });
            }
            catch (err) {
                return res.status(400).json({ msg: err.message || err.msg });
            }
        });
    }
    login(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                let { login, password } = req.body;
                if (!login || !password) {
                    return res.status(400).json({ msg: 'Введите все поля.' });
                }
                const user = yield dbManager.findElement('*', 'public.staff', 'login', login);
                if (!user.length) {
                    return res.status(400).json({ msg: 'Сотрудника с таким логином не найдено.' });
                }
                const ifMatch = yield bcrypt.compare(password, user[0].password);
                if (!ifMatch)
                    return res.status(400).json({ msg: 'Неправильный пароль или логин.' });
                const token = jwt.sign({ id: user[0].id }, process.env.JWT_SECRET);
                const resData = {
                    token,
                    user: {
                        name: user[0].name,
                        access: user[0].access,
                        login: user[0].login,
                        cards: user[0].cards
                    }
                };
                res.json(resData);
            }
            catch (err) {
                return res.status(400).json({ msg: err.message });
            }
        });
    }
    getUser(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const dbManager = new database_1.DatabaseManager(config_1.default.db);
                let decodedJwt = jwt_decode(req.headers['x-auth-token']).id;
                const usersRes = yield dbManager.findElement('*', 'public.staff', 'id', decodedJwt);
                if (!usersRes.length) {
                    return res.status(400).json({ msg: 'Сотрудника с таким логином не найдено.' });
                }
                res.send({
                    name: usersRes[0].name,
                    login: usersRes[0].login,
                    access: usersRes[0].access,
                    cards: usersRes[0].cards
                });
            }
            catch (err) {
                res.status(500).json({ err: err.message });
            }
        });
    }
    validToken(req, res) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const token = req.headers['x-auth-token'];
                if (!token)
                    return res.json(false);
                const verified = jwt.verify(token, process.env.JWT_SECRET);
                if (!verified)
                    return res.json(false);
                return res.json(true);
            }
            catch (err) {
                console.log(err);
                return res.status(500).json({ msg: err.message });
            }
        });
    }
}
exports.AuthRouter = AuthRouter;
