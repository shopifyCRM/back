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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordManager = void 0;
const bcrypt = require('bcryptjs');
class PasswordManager {
    passwordChecker(password, confirmPassword) {
        return new Promise((resolve, reject) => {
            let msg = undefined;
            const letterRegex = new RegExp('^(?=.*[a-z])(?=.*[A-Z])');
            const numericRegex = new RegExp('(?=.*[0-9])');
            if (password.length < 7)
                msg = 'Пароль должен содержать минимум 7 знаков.';
            if (letterRegex.test(password) == false)
                msg = 'Пароль должен содержать строчные и заглавные знаки.';
            if (numericRegex.test(password) === false)
                msg = 'Пароль должен содержать числа.';
            if (password !== confirmPassword)
                msg = 'Пароли не сопвадают.';
            if (msg) {
                return reject(msg);
            }
            return resolve(true);
        });
    }
    hashPassword(password, confirmPassword) {
        return new Promise((resolve, reject) => {
            this.passwordChecker(password, confirmPassword)
                .then(() => __awaiter(this, void 0, void 0, function* () {
                const salt = yield bcrypt.genSalt();
                const passwordHash = yield bcrypt.hash(password, salt);
                return resolve({
                    status: true,
                    passwordHash,
                    msg: undefined
                });
            }))
                .catch((msg) => {
                return reject({
                    status: false,
                    passwordHash: undefined,
                    msg
                });
            });
        });
    }
}
exports.PasswordManager = PasswordManager;
