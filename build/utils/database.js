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
exports.DatabaseManager = exports.Database = void 0;
const Pool = require('pg').Pool;
class Database {
    constructor(config) {
        this.connect = ({ user, host, database, password, port }) => __awaiter(this, void 0, void 0, function* () {
            this.db = yield new Pool({
                user,
                host,
                database,
                password,
                port
            });
            return this.db;
        });
        this.connect(config);
    }
}
exports.Database = Database;
class DatabaseManager {
    constructor(db) {
        this.insertData = (table, fields, values, data) => __awaiter(this, void 0, void 0, function* () {
            yield this.db.query(`INSERT INTO ${table}(${fields}) VALUES(${values})`, data);
        });
        this.selectData = (table, select = '*') => __awaiter(this, void 0, void 0, function* () {
            const rows = yield this.db.query(`SELECT ${select} FROM ${table}`);
            return rows.rows;
        });
        this.findElement = (select = '*', table, condition_key, condition_value) => __awaiter(this, void 0, void 0, function* () {
            const { rows } = yield this.db.query(`SELECT ${select} FROM ${table} WHERE ${condition_key} = $1`, [condition_value]);
            return rows;
        });
        this.deleteElement = (select = '*', table, condition_key, condition_value) => __awaiter(this, void 0, void 0, function* () {
            yield this.db.query(`DELETE FROM ${table} WHERE ${condition_key} = $1`, [condition_value]);
            return 'Successfully deleted item';
        });
        this.updateElement = (table, fields, condition_key, condition_value) => __awaiter(this, void 0, void 0, function* () {
            const keys = Object.keys(fields);
            let lastItem;
            const argKeys = Object.keys(fields)
                .map((obj, index) => {
                lastItem = index + 1;
                return `${keys[index]} = $${index + 1}`;
            })
                .join(', ');
            yield this.db.query(`UPDATE ${table} SET ${argKeys} WHERE ${condition_key} = $${lastItem && lastItem + 1}`, [...Object.values(fields), condition_value]);
        });
        this.db = db.db;
    }
}
exports.DatabaseManager = DatabaseManager;
